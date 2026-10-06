#!/usr/bin/env bun
/**
 * atoma.ts — MCP server exposing Atomaton orchestration tools.
 *
 * Transport: stdio, via the official @modelcontextprotocol/sdk.
 *
 * Tools:
 *   - launch_sub_agent: Launch Atomaton agents on sub-issues and end the
 *     atomaton session.
 *   - request_close_issue: Conclude work on the current issue.
 *   - reload_environment: Re-run the project's setup as a workflow step and start
 *     a new run, for the things an agent cannot do to its own environment.
 *
 * Both tool responses include `_meta.session_ends: true` so the Atoma core
 * can detect that the session should terminate.
 *
 * IMPORTANT: this process's `process.stdout` IS the JSON-RPC transport --
 * never `console.log()` anywhere in this file or in anything it calls
 * in-process (dispatchSubAgent/concludeIssue and whatever they import);
 * always `console.error()` (stderr) for logging.
 */
import { gh } from "../../../adapters/github/gh.ts";
import { dispatchSubAgent } from "../lib/dispatch_sub_agent.ts";
import { parentIssueOf } from "../../../adapters/github/parent-issue.ts";
import { LLM_CONTEXT_TAG } from "../../../adapters/github/tags.ts";
import { turnCommentBody, turnHeader } from "../../../adapters/github/turn-comment.ts";
import { concludeIssue, type ConcludeIssueResult } from "../lib/conclude_issue.ts";
import { describeGateResult, needsAttention } from "../../../app/aggregation.ts";
import { buildMcpTools, defineMcpTool, positiveInt, serveMcpServer, z, type McpToolResult } from "../../../adapters/mcp/mcp-tool.ts";
import { hardenCredentialHolder } from "../lib/harden.ts";
import { dispatchRunner } from "../../../adapters/actions/dispatch.ts";
import { getReloadLimit } from "../../../adapters/runner/config.ts";
import {
  reloadAccepted,
  reloadRefusal,
  reloadsSoFar,
  resolveReloadLimit,
} from "../../../domain/work/environment-reload.ts";

function log(msg: string): void {
  console.error(`[atomaton-mcp] ${msg}`);
}

// Same OS user as every other tool server, including the one that runs arbitrary
// commands -- so this process makes itself unreadable to its peers and drops
// writable directories from its PATH. See `../lib/harden.ts` for what that closes,
// what it costs, and what it deliberately leaves open.
hardenCredentialHolder(log);

const LAUNCH_SUB_AGENT_SCHEMA = z.object({
  tasks: z
    .array(
      z.object({
        // `positiveInt`, not a bare `z.number()`. This was the only numeric
        // argument in the tool tree skipping the helper whose docstring records
        // the production failures that motivated it — models sending `"185"` for
        // 185. Once per atomaton run is where an avoidable rejection costs
        // the most, since the whole plan is in that one call.
        issue: positiveInt("The sub-issue number."),
        agent: z.string().min(1).describe("The agent to dispatch (e.g., 'engineer')."),
      }),
    )
    .min(1, "tasks must be a non-empty list of {issue, agent} objects")
    .describe("List of {issue, agent} pairs to dispatch."),
  /**
   * Where the report goes for the one exit that had nowhere to put it.
   *
   * Four calls end a session. `create_pr` carries the report in `body`,
   * `request_close_issue` in `summary`, `reload_environment` in `reason` -- and
   * this one carried nothing, while being the atomaton's most frequent exit.
   * The session stops the moment it returns, so there is no later turn to write
   * in: a run that meant to report after dispatching never reports at all.
   *
   * Optional rather than required, and deliberately so: a partial dispatch leaves
   * the session OPEN (see `handleLaunchSubAgent`), and on that path the closing
   * text is still the report. Required here would make the failure path demand
   * the report twice.
   *
   * Same shape as `REQUEST_CLOSE_ISSUE_SCHEMA.summary` below, because it is the
   * same fact -- what this run concluded -- reaching the thread the same way.
   */
  summary: z
    .string()
    .optional()
    .describe(
      "Your report for this run. It is folded into the dispatch comment on the issue you are on, " +
        "behind a `<details>`, so keep it short: what you concluded and what happens next, not the " +
        "full four-part report. This call ends your session when every dispatch succeeds, so there " +
        "is no turn after it to write one in.",
    ),
});

const REQUEST_CLOSE_ISSUE_SCHEMA = z.object({
  reason: z
    .string()
    .min(1)
    .describe(
      "Why this issue's work is considered complete — one sentence. It is printed directly " +
        "above `summary`, so anything longer is the same judgement written twice.",
    ),
  summary: z.string().optional().describe("Final summary to include in the posted comment (e.g. an aggregation report)."),
});

function mcpFail(message: string): never {
  throw new Error(message);
}

function handleLaunchSubAgent(args: z.infer<typeof LAUNCH_SUB_AGENT_SCHEMA>): McpToolResult {
  const validTasks = args.tasks;

  log(`Dispatching ${validTasks.length} sub-issue(s): ${JSON.stringify(validTasks)}`);

  // A pull request run does not decompose work. It reviews or fixes one pull
  // request, and the node it is on is that pull request -- so there is no parent
  // issue for a sub-issue to hang under, and `ISSUE_NUMBER` here is the pull
  // request's own number (or, worse, the parent issue `fetch_events.ts` resolved
  // for context). Dispatching from it created sub-issues under a node that was
  // never decomposing anything, and left the pull request's `atomaton/in-progress`
  // guard held by a chain that had moved to a different node entirely.
  //
  // The route a pull request run has is `create_pr` (to hand to a reviewer) or
  // `request_close_issue` (to conclude). Decomposition belongs to an issue run.
  if ((process.env.ATOMATON_RUN_TYPE ?? "").trim() === "pr") {
    mcpFail(
      "launch_sub_agent is for an issue run that is decomposing work into sub-issues. " +
        "This run is on a pull request, which reviews or fixes one pull request rather than " +
        "decomposing it. Use github__create_pr to hand this pull request to a reviewer, or " +
        "atomaton__request_close_issue to conclude it.",
    );
  }

  // The atomaton's OWN current issue (the parent, from the sub-issues'
  // point of view).
  const parentIssue = (process.env.ISSUE_NUMBER ?? "").trim();
  const notify = process.env.ISSUE_NOTIFY ?? "";

  const dispatched: string[] = [];
  const errors: string[] = [];

  // Every task must name an issue that is actually UNDER this one.
  //
  // `launch_sub_agent` used to dispatch whatever number it was handed, and the
  // dispatch comment says "sub-task" whatever the truth is — so a number that was
  // never a child of this issue was announced as one, counted as one, and waited on
  // as one. #16 hit it: the atomaton created #18 with `sub_issue: false` (a genuine
  // "stands alone" child), dispatched it anyway, and the parent's aggregation then
  // waited for a child GitHub does not record it as having. Every sub-issue was
  // closed and the parent still never woke (#29; the empty-agent crash beside it is
  // #30).
  //
  // Also catches the converse, which is the louder half: an issue that is a child of
  // SOME OTHER issue would be pulled into this subtree by a dispatch it does not
  // belong to.
  //
  // Checked here rather than in `dispatchSubAgent`, because it needs to know WHICH
  // node this run is on — and that is this tool's own `ISSUE_NUMBER`, not something
  // `dispatchSubAgent` can see. It reads the parent rather than a label: GitHub's
  // sub-issue link is the edge the aggregation counts, so it is the edge this has to
  // agree with (`adapters/github/parent-issue.ts`).
  //
  // Skipped entirely when this run does not know its own number: an empty parent is
  // not a parent of zero, and refusing every dispatch on a run whose environment is
  // broken would replace a wrong dispatch with no dispatch at all.
  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const parentNum = parentIssue === "" ? 0 : Number(parentIssue);
  const unrelated: string[] = [];
  const tasks = parentNum === 0 ? validTasks : validTasks.filter(({ issue }) => {
    const found = parentIssueOf(repo, issue);
    if (!found.known) {
      // A parent that could not be read is not a parent that is absent. Dispatching
      // on a guess would be the defect this check exists for, so it is refused and
      // the atomaton is told why — it can retry, or create the link first.
      errors.push(`#${issue}: could not read its parent (${found.why}), so nothing was dispatched onto it`);
      return false;
    }
    if (found.parent === parentNum) return true;
    unrelated.push(found.parent === 0 ? `#${issue} (a root issue)` : `#${issue} (a child of #${found.parent})`);
    return false;
  });
  if (unrelated.length) {
    // Named individually and together, because the atomaton has to act on each one
    // and the shape of the mistake is what tells it what to do: create the link, or
    // stop treating the number as its own.
    errors.push(
      `not a child of #${parentIssue}, so nothing was dispatched onto: ${unrelated.join(", ")}. ` +
        "A sub-agent runs on a sub-issue, and the aggregation that wakes this issue counts GitHub's " +
        "sub-issue links — an issue not linked under this one is never counted, so a dispatch onto " +
        "it would leave this issue waiting forever. Create it with `github__create_issue` " +
        "(`sub_issue: true`, the default) so the link exists.",
    );
  }

  for (const { issue, agent } of tasks) {
    try {
      dispatchSubAgent(issue, agent, notify);
      dispatched.push(`#${issue}→${agent}`);
    } catch (e) {
      const message = (e as Error).message ?? String(e);
      log(`dispatchSubAgent failed for #${issue}: ${message}`);
      errors.push(`#${issue}/${agent}: ${message}`);
    }
  }

  // One comment on the PARENT issue, not two.
  //
  // The audit line and the report used to be separate comments: the machine's
  // list of what it dispatched, and the report the run concluded. Two comments
  // for one event read as two events, and the report -- four sections, written
  // for the next run -- dominated the thread a person scrolls past. Folded into
  // one comment with the report behind a `<details>`, the thread shows what was
  // launched and the report is one click away.
  //
  // The report is not lost to the next run by being folded in here. It travels
  // twice: as this comment, and as the `summary` argument of the `launch_sub_agent`
  // call itself, which the session keeps as a tool call. The comment is the copy a
  // person reads; the tool call is the copy the next run is handed. So the exclude
  // tag below -- which keeps this comment out of the next run's context -- costs
  // the next run nothing.
  //
  // Posted even on a partial dispatch: the session stays open there, but a report
  // the agent has already written is not worth discarding for that.
  const summary = (args.summary ?? "").trim();
  // The session ends only when every task was dispatched -- see below. Written here
  // because the `waiting` tag means exactly that: the run is over and a child carries
  // it. A partial dispatch keeps the session OPEN, so it is not waiting and must not
  // carry the tag.
  const complete = errors.length === 0;
  if (parentIssue && (dispatched.length || summary)) {
    // The ending goes on through `turnHeader`, and only when the session really ends.
    // `launch_sub_agent` ends the session on a COMPLETE dispatch and posts no result
    // comment then, so without `waiting` the node's last event reverts to the `asked`
    // that started the run — and the aggregation gate reads that as a request nobody
    // took up, refusing to re-invoke the parent with `parent-busy`. `waiting` says the
    // request was taken up and the next work is on a child. See `domain/work/thread.ts`.
    //
    // A partial dispatch keeps the session OPEN, so it is not waiting and must not carry
    // the tag, which is why the header is built from `complete` and the tags are not
    // baked into the body below.
    const bodyLines = complete
      ? turnHeader({ ended: "waiting", audience: "person" })
      : [LLM_CONTEXT_TAG.write("exclude")];
    if (dispatched.length) {
      bodyLines.push("Atomaton: Launched sub-agent(s):", ...dispatched.map((d) => `- ${d}`));
    }
    if (summary) {
      bodyLines.push("", "<details><summary>Report</summary>", "", summary, "", "</details>");
    }
    gh("issue", "comment", parentIssue, "--body", bodyLines.join("\n"));
  }

  if (errors.length && !dispatched.length) {
    mcpFail(`All dispatches failed: ${errors.join("; ")}`);
  }

  // The session ends only when every task was dispatched.
  //
  // A partial failure used to end it too, mentioning the failures in prose. By
  // this tool's own contract the atomaton is re-invoked when ALL sub-issues
  // are closed — and a sub-issue nobody was dispatched onto is never closed, so
  // the parent waited forever. The atomaton is the one caller that can still
  // fix a partial dispatch, and it was the one being told to stop.
  //
  // `complete` is computed above, beside the `waiting` tag it also decides.

  // Structured, because the prose was wrong in both directions. "Agents will be
  // dispatched automatically" described neither group: the successful ones were
  // dispatched synchronously, in the loop above, and the failed ones never will
  // be. "Dispatch comments posted for N sub-issue(s)" described the comment
  // rather than the dispatch, which is the part the reader cares about.
  return {
    text: JSON.stringify({
      dispatched,
      failed: errors,
      complete,
      note: complete
        ? "Every sub-agent is running. This session ends here, and resumes when all sub-issues are closed."
        : "Some sub-agents were NOT dispatched, and nothing will retry them. This session stays open: " +
          "re-dispatch the failures with atomaton__launch_sub_agent, or the parent waits forever for sub-issues " +
          "nobody is working on.",
    }),
    meta: complete ? { session_ends: true } : {},
  };
}

async function handleRequestCloseIssue(args: z.infer<typeof REQUEST_CLOSE_ISSUE_SCHEMA>): Promise<McpToolResult> {
  const reason = args.reason.trim();
  const summary = (args.summary ?? "").trim();

  if (!reason) mcpFail("reason must be a non-empty string");

  const issueNumberRaw = (process.env.ISSUE_NUMBER ?? "").trim();
  if (!issueNumberRaw) mcpFail("ISSUE_NUMBER is not set in the environment");
  const issueNumber = Number(issueNumberRaw);

  log(`Concluding issue #${issueNumber}: reason=${JSON.stringify(reason)}`);

  // The module's own type, not a copy of its shape. The copy had already fallen
  // behind: `concludeIssue` gained the aggregation outcome and this annotation
  // hid it.
  let result: ConcludeIssueResult;
  try {
    result = await concludeIssue(issueNumber, reason, summary);
  } catch (e) {
    const message = (e as Error).message ?? String(e);
    log(`concludeIssue failed for #${issueNumber}: ${message}`);
    mcpFail(`Failed to conclude issue #${issueNumber}: ${message}`);
  }

  // One sentence for both outcomes, because the difference between them is not
  // the agent's to act on or to relay. The human-authored branch used to answer
  // "it has NOT been closed automatically", and the agent — handed that as the
  // last thing it heard before ending — wrote it into its report, so a person
  // asking for work got a paragraph about which tool declined to do what (#933).
  // Who may close the issue is decided here; what the reader sees is the comment.
  const concluded = `Issue #${issueNumber} is concluded: your reason and summary are on the issue.`;

  if (result.outcome !== "closed") {
    return { text: `${concluded} Nothing else is yours to do here.`, meta: { session_ends: true } };
  }

  // What the aggregation gate actually did, not merely that it ran. The old
  // wording -- "Phase-gating/aggregation for its parent has been checked" -- was
  // true of all six outcomes, including the two where nothing was dispatched and
  // nothing will retry.
  const aggregation = result.aggregation;
  const stalled = aggregation !== undefined && needsAttention(aggregation);

  return {
    text: [
      concluded,
      aggregation ? describeGateResult(aggregation, issueNumber) : "",
      stalled
        ? "This session is staying open because you are the last thing able to act on that: report it on the parent issue so a person sees it."
        : "Nothing else is yours to do here.",
    ]
      .filter(Boolean)
      .join(" "),
    // Ends only when something is going to happen next, matching create_pr and
    // launch_sub_agent.
    meta: stalled ? {} : { session_ends: true },
  };
}

const RELOAD_ENVIRONMENT_SCHEMA = z.object({
  reason: z
    .string()
    .min(1)
    .describe(
      "What you need the environment to have that it does not, in one sentence. Recorded on the issue so a " +
        "person reading it later can see why the run restarted.",
    ),
});

/**
 * Re-run the project's setup and start a new run.
 *
 * The decision half is `domain/work/environment-reload.ts`. Here is the I/O: read the
 * tally this run arrived with, refuse or dispatch, and say which on the issue.
 *
 * Refusing is a tool ERROR rather than a session end, and that is the point. The
 * agent keeps its turn and can switch to reporting what it found, which is the
 * useful thing left to do. A run that died here would take the reason with it.
 */
function handleReloadEnvironment(args: z.infer<typeof RELOAD_ENVIRONMENT_SCHEMA>): McpToolResult {
  const number = (process.env.ISSUE_NUMBER ?? "").trim();
  const agent = (process.env.AGENT ?? "").trim();
  if (!number || !agent) {
    mcpFail("Cannot reload: this run does not know its own issue number or agent name.");
  }

  const limit = resolveReloadLimit(getReloadLimit());
  const soFar = reloadsSoFar(process.env.ATOMATON_RELOAD_COUNT);
  const refusal = reloadRefusal(soFar, limit);
  if (refusal) {
    log(`reload refused: ${soFar}/${limit}`);
    // `mcpFail` throws, and the wrapper turns that into `isError: true` -- which is
    // what keeps the agent's turn. Returning text would read as a successful
    // reload, and returning `session_ends` would end the run with the reason inside
    // it. Neither leaves the agent able to report.
    mcpFail(refusal);
  }

  const next = soFar + 1;
  // Posted before the dispatch, and addressed to a person reading the issue later: the
  // agent about to be started is told the same thing by the tool result, and this run's
  // session ends here.
  //
  // `handoff`, not `waiting`: the new run is on THIS node and continues this turn — the
  // dispatch passes `answersRequest`, which is the same claim in the thread's terms. A
  // comment with no ending would leave the node's last event as the `asked` this run is
  // fulfilling, which is indistinguishable from a request nobody took up. See
  // `turn-comment.ts` for why the ending is a required argument.
  gh(
    "issue", "comment", number,
    "--body",
    turnCommentBody({
      ended: "handoff",
      audience: "person",
      body:
        `Atomaton: rebuilding the environment and restarting \`${agent}\` ` +
        `(reload ${next} of ${limit}). Reason: ${args.reason}`,
    }),
  );

  const outcome = dispatchRunner({
    context: `${agent} was to be restarted on #${number} after an environment rebuild`,
    agent,
    type: (process.env.ATOMATON_RUN_TYPE ?? "").trim() === "pr" ? "pr" : "issue",
    number,
    notify: (process.env.ISSUE_NOTIFY ?? "").trim(),
    reloadCount: next,
    // The same turn, continued: the agent running right now is restarting itself, so
    // the thread's last event is the command that started this very run. Without this
    // the outstanding-request check would read the reload as a second request.
    answersRequest: true,
    log,
  });
  if (outcome === "refused-closed") {
    // Closed underneath this run -- merged, or closed by a person while it worked.
    // A rebuild is not worth restarting into, and the agent is told why rather than
    // being sent to read a workflow log that contains no error.
    mcpFail(
      `#${number} is no longer open, so the environment was not rebuilt and nothing was restarted. ` +
        "Report what you found rather than retrying.",
    );
  }
  if (outcome !== "dispatched") {
    // The comment above is already posted, so saying nothing here would leave an
    // issue claiming a restart that never happened. An error keeps the turn.
    mcpFail(
      "Could not dispatch the new run; the environment was not rebuilt. See the workflow log. " +
        "Report what you found rather than retrying.",
    );
  }

  return { text: reloadAccepted(next, limit), meta: { session_ends: true } };
}

const { tools: TOOLS, dispatch } = buildMcpTools([
  defineMcpTool({
    name: "launch_sub_agent",
    description:
      "Dispatch Atomaton agents onto sub-issues and immediately end the atomaton session. " +
      "Call this ONCE after creating all sub-issues via GitHub MCP. " +
      "Each sub-issue can be assigned a different agent. " +
      "Put your report in `summary`: the atomaton session ends immediately after this call " +
      "returns, so there is no turn afterwards in which to write one. " +
      "The atomaton will be automatically re-invoked when ALL sub-issues are closed.",
    schema: LAUNCH_SUB_AGENT_SCHEMA,
    handler: handleLaunchSubAgent,
  }),
  defineMcpTool({
    name: "request_close_issue",
    description:
      "Conclude work on YOUR CURRENT issue and end your session. This is the ONLY " +
      "correct way for the atomaton to finish an issue -- do NOT call " +
      "github__close_issue yourself, and do NOT just stop responding without calling " +
      "this. Your reason and summary are posted to the issue, and phase-gating/" +
      "aggregation is triggered for its parent when this is a sub-issue. Whether the " +
      "close happens now or the issue's author is asked to make it is this tool's " +
      "decision and not yours -- it is the same call either way, and your session " +
      "ends when it returns.",
    schema: REQUEST_CLOSE_ISSUE_SCHEMA,
    handler: handleRequestCloseIssue,
  }),
  defineMcpTool({
    name: "reload_environment",
    description:
      "Rebuild this project's environment and restart your run. Use it when something you need is missing " +
      "and you cannot install it yourself: a system package (you have no sudo), a globally installed CLI, or " +
      "a work tree you broke. YOUR SESSION ENDS IMMEDIATELY and a new run starts, so finish anything you were " +
      "part-way through first -- commit what is worth keeping and leave notes in /tmp/atomaton-workspace, which " +
      "survives into the next run. " +
      "What it does: re-runs `environment.setup_commands` as a privileged workflow step, against the CURRENT " +
      "work tree. So a dependency you added to package.json, Cargo.toml or requirements.txt gets installed by " +
      "the project's own trusted command -- you do not edit that command, and cannot. " +
      "What it does NOT do: install a system package the setup does not already ask for. Those commands come " +
      "from the default branch, so a package you decided you need is not in them yet; add it to " +
      "`environment.setup_commands` in .github/atomaton/config.yaml, say so in your report, and a person merges " +
      "it. Reloading first will hand you the same environment back and cost a run. " +
      "There is a limit on how many times one piece of work may do this, because each reload starts a new run " +
      "and resets the run's time budget. The tool tells you where you stand.",
    schema: RELOAD_ENVIRONMENT_SCHEMA,
    handler: handleReloadEnvironment,
  }),
]);

async function main(): Promise<void> {
  log("Starting atomaton-mcp-server (stdio transport)");
  await serveMcpServer({ name: "atomaton-mcp-server", version: "1.0.0", tools: TOOLS, dispatch, log });
}

if (import.meta.main) void main();
