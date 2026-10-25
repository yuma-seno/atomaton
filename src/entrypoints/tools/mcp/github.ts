#!/usr/bin/env bun
/**
 * github.ts — Unified GitHub MCP server for Atomaton.
 *
 * Transport: stdio, via the official @modelcontextprotocol/sdk.
 * Dependencies: `gh` CLI + `git`.
 *
 * Every mutation is logged to $ATOMATON_OPS_LOG (see lib/ops-log.ts) as a
 * general audit trail; dispatch decisions specifically are also what
 * atomaton-runner.wac.ts's chain_continues detection reads.
 *
 * IMPORTANT: this process's `process.stdout` IS the JSON-RPC transport --
 * never `console.log()` anywhere in this file or in anything it calls
 * in-process (resolveNotify/dispatchOrchestratorIfSubIssueReady/etc.);
 * always `console.error()` (`log()` below) for logging.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gh, ghGraphql, gitRun, nothingToCommit, splitConcatenatedJson } from "../../../adapters/github/gh.ts";
import { getBaseBranch, getLabel } from "../../../adapters/runner/config.ts";
import { resolveNotify } from "../../../adapters/github/notify.ts";
import {
  describeGateResult,
  dispatchOrchestratorIfSubIssueReady,
  needsAttention,
  type DispatchGateResult,
} from "../../../app/aggregation.ts";
import { logDispatch, logOp } from "../../../adapters/runner/ops-log.ts";
import { report } from "../../../adapters/mcp/mcp-report.ts";
import { knownParticipants } from "../../../adapters/github/participants.ts";
import { escapedMentionNotice, escapeUnknownMentions } from "../../../domain/work/mention.ts";
import { isHumanAuthor } from "../../../domain/work/actor.ts";
import { LLM_CONTEXT_TAG, NOTIFY_TAG, ORIGIN_AGENT_TAG, PARENT_ISSUE_TAG } from "../../../adapters/github/tags.ts";
import { closingKeywordRefusal, closingReferences, partOfLine } from "../../../domain/work/issue-links.ts";
import { commandInBodyRefusal, commandLinesIn } from "../../../domain/work/comment-command.ts";
import { closeRequestComment } from "../../../domain/work/close-request.ts";
import { turnCommentBody, turnHeader } from "../../../adapters/github/turn-comment.ts";
import { endingIdentity } from "../lib/turn-identity.ts";
import { postTurnComment, recordEndingComment } from "../../../adapters/github/ending-comment.ts";
import type { GhIssueAuthor } from "../../../adapters/github/wire-types.ts";
import { buildMcpTools, defineMcpTool, positiveInt, serveMcpServer, stringArray, withoutBookkeeping, z, type McpToolResult } from "../../../adapters/mcp/mcp-tool.ts";
import { capText, fitItems, TOOL_OUTPUT_BUDGET } from "../../../shared/tool-output.ts";
import { decidePostMergeHandoff } from "../../../domain/work/handoff.ts";
import { isAttended, unattendedNotice } from "../../../domain/work/unattended-pull-request.ts";
import { branchForCommit, resolveBranch, stackedPrBase } from "../../../adapters/github/branch-placement.ts";
import { baseBranch, checkedOutBranch, readOriginBranch } from "../../../adapters/github/branch-reads.ts";
import { readPullRequestDiff, readPullRequestOrThrow } from "../../../adapters/github/pull-request.ts";
import { isIssueRun, isPrRun, nodeNumber, refusePrRun } from "../../../adapters/runner/run-node.ts";
import { dispatchCd, dispatchCi, dispatchPostMergeAgent, dispatchPrValidation } from "../../../adapters/actions/dispatch-targets.ts";
import { issueLinks } from "../../../adapters/github/issue-links.ts";
import { reportSubIssueToParent } from "../../../adapters/github/sub-issue-report.ts";
import type { LinkedChild, LinkedIssue } from "../../../domain/work/issue-links.ts";
import { decideMergeReadiness, formatBlockers } from "../../../domain/delivery/merge-readiness.ts";
import { gatherMergeSignals } from "../../../adapters/github/merge-signals.ts";
import { readTargetState } from "../../../adapters/github/target-state.ts";
import { selectCommentRange } from "../../../domain/work/comment-range.ts";
import { hardenCredentialHolder } from "../lib/harden.ts";

function log(msg: string): void {
  console.error(`[atomaton-github] ${msg}`);
}

// Same OS user as every other tool server, including the one that runs arbitrary
// commands -- so this process makes itself unreadable to its peers and drops
// writable directories from its PATH. See `../lib/harden.ts` for what that closes,
// what it costs, and what it deliberately leaves open.
hardenCredentialHolder(log);

let REPO = process.env.GITHUB_REPOSITORY ?? "";
// Fallback: derive REPO from git remote if env var is not set.
if (!REPO) {
  try {
    const { code, stdout } = gitRun("remote", "get-url", "origin");
    if (code === 0 && stdout) {
      const url = stdout.trim();
      for (const prefix of ["https://github.com/", "git@github.com:"]) {
        if (url.startsWith(prefix)) {
          const suffix = url.slice(prefix.length);
          REPO = suffix.endsWith(".git") ? suffix.slice(0, -4) : suffix;
          break;
        }
      }
    }
  } catch {
    // best-effort
  }
}

function mcpFail(message: string): never {
  throw new Error(message);
}

function ghJsonOrThrow<T>(...args: string[]): T {
  const { code, stdout, stderr } = gh(...args);
  if (code) mcpFail(stderr || stdout);
  return stdout ? (JSON.parse(stdout) as T) : (null as T);
}

/**
 * A `gh api` LIST read with every page of it, or a tool error.
 *
 * `ghJsonOrThrow` cannot read a paginated listing: with `--paginate`, `gh` writes each
 * page's array back to back, so from the second page on the stream is not one JSON
 * document and `JSON.parse` throws on it. The tempting way out — leave `--paginate` off
 * and parse the page that comes — is what `list_pr_review_comments` did, and it hid
 * every review comment past the first page while still reporting `omitted: 0`. This
 * tool's contract says a non-zero `omitted` is the reason to believe something was left
 * out, so the loss was indistinguishable from a short thread.
 *
 * `splitConcatenatedJson` is the repository's splitter for exactly this shape; the
 * flattening below is `ghPaginated`'s. This reads with plain `gh` rather than
 * `ghPaginated` only to keep this file's failure policy, which is one: a failed read is
 * a tool error here, never an empty list — an empty review comment list is the answer
 * that means "nobody commented on this code".
 */
function ghJsonPagesOrThrow<T>(...args: string[]): T[] {
  const { code, stdout, stderr } = gh(...args, "--paginate");
  if (code) mcpFail(stderr || stdout);
  const flat: T[] = [];
  for (const page of splitConcatenatedJson(stdout)) {
    if (Array.isArray(page)) flat.push(...(page as T[]));
  }
  return flat;
}

async function resolveIssueId(number: number): Promise<string> {
  const [owner, repo] = REPO.split("/", 2);
  const d = ghGraphql<{ repository: { issue: { id: string } } }>(
    "query($owner:String!,$repo:String!,$num:Int!){repository(owner:$owner,name:$repo){issue(number:$num){id}}}",
    { owner: owner!, repo: repo!, num: number },
  );
  return d.repository.issue.id;
}

/**
 * What each shape of tool calls its number.
 *
 * These were both `number`, with `adapters/mcp/mcp-tool.ts` folding four synonyms into it —
 * `issue_number`, `pr_number`, `pull_number`, `pull_request_number` — before the
 * schema was allowed to see the call. Only ONE of those was ever observed
 * (`issue_number`, three times in one run); the other three were speculative, which
 * that file's own comment forbids: "a speculative synonym is indistinguishable from a
 * typo, and quietly accepting a typo is the defect strictness exists to prevent".
 *
 * So the name is the one a model reaches for, and there are no synonyms. Every tool
 * here addresses exactly one kind of object — the schemas were already split
 * issue-shaped and PR-shaped, and each tool's name (`get_issue`, `merge_pr`) fixes
 * which — so there is nothing ambiguous about spelling it out. The same repair as
 * atoma#24's `load_skill`, which had grown five spellings of one argument.
 *
 * Constants because each name is written twice: once in the schema below and once in
 * the refusal a caller reads when they leave it out. That is exactly the pair that
 * drifted in atoma#24.
 */
const ISSUE_NUMBER_ARG = "issue_number";
const PR_NUMBER_ARG = "pull_number";

/**
 * Schema for a close of an issue, whose number is never inferred.
 *
 * Required, and deliberately not defaulted from the run: inferring the target of an
 * irreversible, outward-facing action turns a malformed call into a wrong close
 * instead of an error message. `merge_pr` used to share that rule with a required
 * `pull_number` of its own; it now takes no number at all — the pull request it
 * merges is the node the run sits on — so this schema's remaining callers are the
 * internal close helpers, reached from code rather than from the model.
 */
const ISSUE_NUMBER_ARG_SCHEMA = z.object({
  [ISSUE_NUMBER_ARG]: positiveInt("Positive GitHub issue number, without a leading '#'."),
});

/**
 * Schema for read-only ISSUE lookups whose `number` defaults to the node this run
 * sits on.
 *
 * Deliberately not used for mutations. Inferring the target of an irreversible,
 * outward-facing action from an environment variable turns a malformed call into a
 * wrong merge instead of an error message; the internal close below takes its
 * required schema and is reached from code, not from the model.
 *
 * The default is the run's NODE (`adapters/runner/run-node.ts`), which on a pull
 * request run is the pull request itself: issues and pull requests share one
 * number space, so the number resolves either way, and the result says which one
 * came back with `kind`. A defaulted PR read during an issue run is refused
 * instead — see `PR_CONTEXT_NUMBER_ARG_SCHEMA` below for the failure that refusal
 * exists for.
 */
const ISSUE_CONTEXT_NUMBER_ARG_SCHEMA = z.object({
  [ISSUE_NUMBER_ARG]: positiveInt(
    "Positive GitHub issue number, without a leading '#'. " +
      "Omit to use the node this run is already on (an issue's number, or the pull request's on a pull request run).",
  ).optional(),
});

/**
 * Schema for a read-only PULL REQUEST lookup that may default to this run's own.
 *
 * The default is available only when the run really is a pull request run —
 * `isPrRun()` from `adapters/runner/run-node.ts`, which reads the `TYPE` the
 * runner sets. Issues and pull requests share one number space, so an issue
 * run's number is a perfectly valid-looking pull request number belonging to a
 * different thing entirely — and the resulting `gh pr view <issue-number>` fails
 * with a GitHub error about resolving a PullRequest, which reads as a broken
 * tool rather than a missing argument.
 */
const PR_CONTEXT_NUMBER_ARG_SCHEMA = z.object({
  [PR_NUMBER_ARG]: positiveInt(
    "Positive pull request number, without a leading '#'. " +
      "Omit only on a pull request run, to use the pull request this run is reviewing; " +
      "on an issue run, pass the number of the pull request that closes it.",
  ).optional(),
});


const ISSUE_COMMENTS_SCHEMA = z.object({
  [ISSUE_NUMBER_ARG]: positiveInt(
    "Positive GitHub issue number, without a leading '#'. Omit to use the issue this run is already operating on.",
  ).optional(),
  from: positiveInt(
    "First comment to return, counting from 1 in the order they were posted. " +
      "This is the number `search_issues` reports as `comment`, so a match can be read directly.",
  ).optional(),
  to: positiveInt("Last comment to return, inclusive. Defaults to `from`, so passing only `from` reads one comment.").optional(),
});

/**
 * Resolve an issue read's target, falling back to the node this run sits on.
 *
 * Models omit it entirely when they are already reasoning about a single issue,
 * which used to surface as a required-argument error and burn an iteration. On an
 * issue run the node is the issue; on a pull request run it is the pull request,
 * whose number answers the issue-shaped read because the number space is shared —
 * and the result's `kind` says which one came back. The conflation this replaces
 * is #248: the run's environment used to hold the SESSION's issue under
 * `ISSUE_NUMBER`, which on a pull request run was the parent issue, not the node.
 */
function issueContextNumber(args: { issue_number?: number }): number {
  if (args[ISSUE_NUMBER_ARG] !== undefined) return args[ISSUE_NUMBER_ARG];
  const node = nodeNumber();
  if (node === undefined) {
    mcpFail(
      `\`${ISSUE_NUMBER_ARG}\` was omitted and this run has no node number in its environment. ` +
        `Pass \`${ISSUE_NUMBER_ARG}\` explicitly.`,
    );
  }
  return node;
}

/**
 * Resolve a pull request read's target, falling back to this run's own pull request
 * only when the run is a pull request run.
 *
 * The type check is the whole point. Issues and pull requests share one number
 * space, so a number that is an issue's here is a perfectly valid-looking pull
 * request number belonging to a different thing entirely — and the resulting
 * `gh pr view <issue-number>` fails with a GitHub error about resolving a
 * PullRequest, which reads as a broken tool rather than a missing argument.
 */
function prContextNumber(args: { pull_number?: number }): number {
  if (args[PR_NUMBER_ARG] !== undefined) return args[PR_NUMBER_ARG];
  if (!isPrRun()) {
    mcpFail(
      `\`${PR_NUMBER_ARG}\` was omitted, and this run is on ` +
        (isIssueRun() ? `issue #${nodeNumber()}` : "neither an issue nor a pull request") +
        ". Pass the pull request's number explicitly — an issue's number is not a pull request's.",
    );
  }
  const node = nodeNumber();
  if (node === undefined) {
    mcpFail(
      `\`${PR_NUMBER_ARG}\` was omitted and this run has no node number in its environment. ` +
        `Pass \`${PR_NUMBER_ARG}\` explicitly.`,
    );
  }
  return node;
}

/**
 * The arguments of BOTH issue-creating tools.
 *
 * One schema rather than two, because the two differ in the edge they record -- a
 * link under this run's issue, or no parent at all -- and not in what the caller
 * provides. Two copies would be the pair that drifts.
 */
const ISSUE_ARGS_SCHEMA = z.object({
  title: z.string().min(1).describe("Concise issue title."),
  body: z.string().optional().describe("Issue body in GitHub-flavored Markdown. Defaults to an empty body."),
  labels: stringArray("Existing repository label names to apply. Defaults to no extra labels.").optional(),
});

const LIST_ISSUES_SCHEMA = z.object({
  state: z.enum(["open", "closed", "all"]).optional().describe("Issue state filter. Defaults to 'open'."),
  labels: stringArray("Return only issues matching these repository labels.").optional(),
  limit: positiveInt("Maximum issues to return. Defaults to 30; maximum 100.").max(100).optional(),
});

const CREATE_PR_SCHEMA = z.object({
  title: z.string().min(1).describe("Concise pull request title."),
  body: z.string().optional().describe("Pull request body in GitHub-flavored Markdown. Atomaton adds issue traceability metadata automatically."),
  reviewer: z
    .string()
    .optional()
    .describe(
      "Which agent should review this once CI passes, for example 'reviewer'. Nothing reviews a pull request " +
        "unless you ask: opening one no longer starts anyone by itself. Omit it only when a review is genuinely " +
        "not wanted -- a person is then told the pull request is waiting, by name, so it does not sit unnoticed. " +
        "That a person will merge it is not a reason to omit it: the review is what tells them whether it may " +
        "be merged at all.",
    ),
});

const LIST_PRS_SCHEMA = z.object({
  state: z.enum(["open", "closed", "merged", "all"]).optional().describe("Pull request state filter. Defaults to 'open'."),
  limit: positiveInt("Maximum pull requests to return. Defaults to 30; maximum 100.").max(100).optional(),
});

const SEARCH_CODE_SCHEMA = z.object({
  query: z.string().min(1).describe("GitHub code-search query scoped automatically to the current repository."),
});
const GET_BRANCH_SCHEMA = z.object({
  // `branch`, not `name`, so this and `sync_branch` call one thing by one name.
  branch: z.string().min(1).describe("Repository branch name, for example 'main' or 'atomaton/issue-42'."),
});
const GET_CHECK_RUNS_SCHEMA = z.object({
  ref: z.string().min(1).describe("Commit SHA, branch name, or tag whose GitHub check runs should be returned."),
});
const SYNC_BRANCH_SCHEMA = z.object({
  branch: z.string().optional().describe("Branch to synchronize. Defaults to the current Atomaton branch."),
});

const COMMIT_AND_PUSH_SCHEMA = z.object({
  message: z.string().describe("Commit message."),
});


/**
 * The requester tag, and a refusal if the agent wrote one itself.
 *
 * The tag decides who hears about this work later, and the run that writes it is the
 * run being reported on. An agent that can set it can redirect the report of its own
 * failure, or address it to a name nobody reads and be silent in effect. Neither
 * needs intent: a login is a word, and agents repeat words they have read.
 *
 * `create_pr` has refused this since its parent-issue tag was added and the
 * issue-creating tools did not, and the asymmetry was load-bearing. `NOTIFY_TAG.read`
 * returns the first match, so the machine's tag wins while there is one -- and when the
 * requester is unknown there is none, which left the agent's as the only tag in the body.
 *
 * The `has` is raw, not `hasProse`: this is the agent's own DRAFT, not a body GitHub
 * wrote back, and the rule it enforces is "you do not write this tag anywhere in it" --
 * a sample of the tag in a fence still needs a person to look at why it is there (#304).
 */
function notifyTagPrefix(body: string, what: string): string {
  if (NOTIFY_TAG.has(body)) mcpFail(`${what} body already contains a notify tag; refusing to add another`);
  const login = (process.env.NOTIFY ?? "").trim();
  return login ? `${NOTIFY_TAG.write(login)}\n` : "";
}

/**
 * The body of an issue an agent wrote, with the three checks both creating tools apply.
 *
 * One function, so `create_sub_issue` and `create_root_issue` cannot come to disagree
 * about what an agent may write into an issue body: an issue body is read for a command
 * by `resolve_entry_agent.ts` when the issue is opened, so a command on a line of its
 * own would start a run nobody asked for; the notify tag decides who is told about the
 * work, so the run being reported on may not write one; and a mention has to be checked
 * before GitHub notifies a stranger.
 *
 * `instead` names the route the writer meant, and differs between the two: a child is
 * started with `launch_sub_agent`, and a root issue is not dispatched by an agent at all.
 */
function checkedIssueBody(body: string, instead: string): string {
  refuseCommandLines(body, "issue body", instead);
  return notifyTagPrefix(body, "Issue") + withCheckedMentions(body);
}

async function createSubIssue(a: z.infer<typeof ISSUE_ARGS_SCHEMA>): Promise<string> {
  const title = a.title;

  // A pull request run does not create sub-issues. It reviews or fixes one pull
  // request, and the node it sits on is that pull request -- so a sub-issue
  // created here would hang under a node that was never decomposing anything, and
  // the pull request's `atomaton/in-progress` guard would be held by a chain that
  // had moved elsewhere. Decomposition belongs to an issue run.
  //
  // A defect found on a pull request run has a route of its own: `create_root_issue`,
  // which makes no link and holds no guard. Before it existed, a pull request run had
  // nowhere at all to file one. See #192.
  if (isPrRun()) {
    refusePrRun(
      "create_sub_issue",
      "Use create_root_issue to report a defect that is nobody's child, " +
        "create_pr to hand this pull request to a reviewer, or merge_pr to merge it once its review passes.",
    );
  }

  // A sub-issue needs a parent, and the name now says so. This used to create the
  // issue anyway -- with the sub-issue label and no link -- and add a `note` saying
  // nothing would aggregate it: an issue that looked like a child, counted as a
  // sibling, and belonged to no tree. Creating an issue outside the tree is
  // `create_root_issue`'s job, so the by-product is gone rather than reported.
  const parentNum = nodeNumber();
  if (parentNum === undefined) {
    mcpFail(
      "create_sub_issue links its issue under the node this run sits on, and this run " +
        "has no node number in its environment. Use create_root_issue to file an issue that is " +
        "nobody's child.",
    );
  }

  // The route the writer meant is `launch_sub_agent`, which is also what the parent's
  // aggregation waits on.
  const body = checkedIssueBody(a.body ?? "", "Use `launch_sub_agent` to start an agent on a sub-issue.");
  let labels = a.labels ?? [];
  const subIssueLabel = getLabel("sub_issue");
  const ensured = gh(
    "label", "create", subIssueLabel,
    "--repo", REPO,
    "--force",
    "--color", "8250df",
    "--description", "Child delivery task managed by Atomaton",
  );
  if (ensured.code) mcpFail(`Failed to ensure sub-issue label '${subIssueLabel}': ${ensured.stderr || ensured.stdout}`);
  if (!labels.includes(subIssueLabel)) labels = [...labels, subIssueLabel];

  const cmd = ["issue", "create", "--repo", REPO, "--title", title];
  if (body) cmd.push("--body", body);
  for (const l of labels) cmd.push("--label", l);

  const { code, stdout, stderr } = gh(...cmd);
  if (code) mcpFail(stderr || stdout);
  const num = Number(stdout.trim().split("/").pop());
  if (!Number.isFinite(num)) mcpFail(`gh issue create: unexpected output: ${stdout.slice(0, 300)}`);

  // The link IS the record now, and the issue exists by this point and cannot be
  // un-created, so a failure names it: an agent that is told only
  // "create_sub_issue failed" would file it again.
  //
  // This used to be best-effort, logged without a severity word, because the
  // `atomaton:parent` tag in the body was what aggregation read and the link was "the
  // cosmetic half". The tag is gone — it recorded the parent at creation and nothing
  // ever rewrote it, so a person re-parenting a sub-issue in the web UI left two
  // answers in the system. See `adapters/github/parent-issue.ts`.
  //
  // No branch for "no parent to link under": that is refused above, before the issue is
  // created. It used to create one anyway -- with the label and no link -- and add a
  // `note` saying nothing would aggregate it. `create_root_issue` is where an issue
  // that belongs to no tree is made now, so that outcome is asked for rather than
  // arrived at.
  try {
    const pid = await resolveIssueId(parentNum);
    const sid = await resolveIssueId(num);
    ghGraphql(
      "mutation($parent:ID!,$sub:ID!){addSubIssue(input:{issueId:$parent,subIssueId:$sub,replaceParent:true}){issue{number}}}",
      { parent: pid, sub: sid },
    );
    log(`Linked sub-issue #${num} to parent #${parentNum} via official sub-issues API`);
  } catch (e) {
    mcpFail(
      `Issue #${num} was created, but could not be linked under #${parentNum} as a sub-issue: ${e}. ` +
        `Nothing records that edge except the link, so #${num} is currently a root issue and no aggregation ` +
        `will pick it up. Do not create it again — add it under #${parentNum} in the web UI, or retry the link.`,
    );
  }

  logOp("create_sub_issue", { number: num, title, parent: parentNum });
  return JSON.stringify({
    number: num,
    url: stdout.trim(),
    parent: parentNum,
  });
}

/**
 * Create an issue that is nobody's child.
 *
 * The tree is Issue -> sub-issue -> pull request, and every creating tool above lines
 * its issue up under the run's own. That leaves no route at all for the one kind of
 * issue that belongs to no node: a defect in the machinery itself, which is nobody's
 * child, or a decision somebody has to make before any work exists to decompose. A
 * pull request run -- which refuses `create_sub_issue` because it is not decomposing
 * anything -- is where such a report most often originates, and before this tool it had
 * nowhere to put one.
 *
 * What it deliberately does NOT do:
 *
 *   - no `atomaton/sub-issue` label, and no `gh label create` to provision it. That
 *     label is what `countOpenSiblings` counts, so a root issue wearing it would be
 *     counted as a sibling of a parent it does not have.
 *   - no `addSubIssue` mutation. The absence of a parent is the point, not a failure.
 *
 * Nor is it a by-product of `create_sub_issue` any more. That tool used to make one
 * when the run had no issue number, label and no link included, and warn in a `note`
 * that nothing would aggregate it -- an issue that looked like a child and belonged to
 * no tree. Refusing there and creating here is the same behaviour with the destination
 * named.
 */
async function createRootIssue(a: z.infer<typeof ISSUE_ARGS_SCHEMA>): Promise<string> {
  const title = a.title;
  const labels = a.labels ?? [];

  // `create_root_issue` is allowed on a pull request run, unlike `create_sub_issue`.
  // The reasons for that refusal do not apply here: nothing is linked under the pull
  // request's own node, and holding `atomaton/in-progress` on it is a question about
  // the chain, not about an issue with no parent. What does apply is that a defect in
  // a tool is found while reviewing a pull request more often than anywhere else.
  const body = checkedIssueBody(
    a.body ?? "",
    "A root issue is filed for a person to triage rather than dispatched from here, " +
      "so describe the work in prose.",
  );

  // Asked for rather than merely not added. A caller passing the label by hand would
  // otherwise get the one outcome this tool exists to make impossible: an issue that
  // `countOpenSiblings` counts among a parent's children while GitHub holds no edge
  // to that parent.
  const subIssueLabel = getLabel("sub_issue");
  if (labels.includes(subIssueLabel)) {
    mcpFail(
      `create_root_issue creates an issue with no parent, so \`${subIssueLabel}\` -- the label a ` +
        "parent's aggregation counts its children by -- may not be applied to it. Call " +
        "create_sub_issue to file a child under this run's issue, or drop the label.",
    );
  }

  const cmd = ["issue", "create", "--repo", REPO, "--title", title];
  if (body) cmd.push("--body", body);
  for (const l of labels) cmd.push("--label", l);

  const { code, stdout, stderr } = gh(...cmd);
  if (code) mcpFail(stderr || stdout);
  const num = Number(stdout.trim().split("/").pop());
  if (!Number.isFinite(num)) mcpFail(`gh issue create: unexpected output: ${stdout.slice(0, 300)}`);

  logOp("create_root_issue", { number: num, title });
  // `root: true` and `parent: null` both say the same thing, because the reader of a
  // result JSON should not have to infer "created as a root" from a missing field --
  // and the one-line note says it in words, since having no parent is what was asked
  // for rather than a link that failed.
  return JSON.stringify({
    number: num,
    url: stdout.trim(),
    parent: null,
    root: true,
    note: "Created as a root issue: it has no parent, by design rather than because a link failed.",
  });
}

/**
 * A sub-issue as a reader wants it: without the labels the gates judge it by.
 *
 * `issueLinks` fetches those in the same request, because `sibling-check.ts` and the
 * work tree need them and a second read per child would be the alternative. Nothing a
 * model is shown asks "which labels does each child carry", so they are dropped here
 * rather than not fetched — the cost of carrying them is one array per child in a
 * response, and the cost of not fetching them is a round trip each.
 */
function shownChildren(children: readonly LinkedChild[]): LinkedIssue[] {
  return children.map(({ labels: _judgedBy, ...shown }) => shown);
}

/**
 * The issue itself, and what it is attached to — without the conversation.
 *
 * The comments used to come back here too, which made every lookup of an
 * issue's state or labels drag its whole discussion in with it. The runner
 * already puts the current issue's comments in the prompt, so for the common
 * case that payload was a second copy; for any other issue it was an unbounded
 * read nobody asked for. `get_issue_comments` returns them, in a range.
 */
function getIssue(a: z.infer<typeof ISSUE_CONTEXT_NUMBER_ARG_SCHEMA>): string {
  const number = issueContextNumber(a);
  const issue = ghJsonOrThrow<{ comments?: unknown[]; body?: unknown }>(
    "issue", "view", String(number), "--repo", REPO,
    "--json", "number,title,body,state,labels,createdAt,closedAt,comments",
  );
  const { comments, body, ...rest } = issue ?? {};
  const links = issueLinks(REPO, number);
  return JSON.stringify({
    // `issue` or `pull_request`: issues and pull requests share one number space,
    // so a read pointed at the other kind resolves and the caller has to be told
    // which it got. Absent only when the links could not be read — `links_unavailable`
    // below then says so.
    ...(links.kind ? { kind: links.kind } : {}),
    ...rest,
    // An issue body is text a person wrote and has no bound. Most are short; the
    // ones that are not tend to be the ones with a log or a table pasted in, and
    // that arrives once per lookup and then stays in the session forever.
    body: typeof body === "string" ? capText(body).text : body,
    total_comments: comments?.length ?? 0,
    parent: links.parent,
    children: shownChildren(links.children),
    pull_requests: links.pullRequests,
    // Empty because there are none, or empty because nobody could look? The
    // three fields above cannot say, and the difference decides whether
    // "no open pull request" means the work landed or means nothing is known.
    ...(links.unavailable ? { links_unavailable: links.unavailable } : {}),
  });
}

function listIssues(a: z.infer<typeof LIST_ISSUES_SCHEMA>): string {
  const state = a.state ?? "open";
  const limit = a.limit ?? 30;
  const labels = a.labels ?? [];
  const cmd = ["issue", "list", "--repo", REPO, "--state", state, "--limit", String(limit), "--json", "number,title,state,labels"];
  for (const l of labels) cmd.push("--label", l);
  return JSON.stringify(ghJsonOrThrow(...cmd) ?? []);
}

/**
 * A range of one issue's comments, carrying enough of the issue to be read
 * alone.
 *
 * The header is not redundancy. This tool is reached from a search result that
 * named a comment number, so it is entirely normal for it to be the only call
 * made about that issue — and a comment read without knowing which issue it
 * belongs to, whether that issue is still open, whether it is part of something
 * larger, and whether the work has actually landed is a comment that can be
 * read to mean the opposite of what it says. "Implemented it" on a sub-issue
 * whose pull request is still open is a proposal, not a fact. Making the result
 * carry that costs a few dozen tokens and removes a whole class of confident
 * wrong answers; requiring a prior `get_issue` call instead would only work
 * when the caller happens to make it.
 *
 * Labels are deliberately not here. What a repository's labels mean is up to
 * whoever adopted this, so no claim can be made that knowing them changes how
 * the words are read.
 */
function getIssueComments(a: z.infer<typeof ISSUE_COMMENTS_SCHEMA>): string {
  const number = issueContextNumber(a);
  const issue = ghJsonOrThrow<{ title?: string; state?: string; comments?: unknown[] }>(
    "issue", "view", String(number), "--repo", REPO, "--json", "title,state,comments",
  );
  const all = (issue?.comments ?? []).map((comment, i) => ({ index: i + 1, ...(comment as object) }));

  // The four interacting defaults live in `domain/work/comment-range.ts`, where the
  // truth table is testable without a `gh` in the loop.
  const range = selectCommentRange(all.length, a.from, a.to);
  // Capped per comment AND as a whole. The range bounds how MANY comments come
  // back and says nothing about how big one is, so a single comment with a log
  // pasted into it filled the window while `showing` reported three of forty.
  const selected = (range.count > 0 ? all.slice(range.from - 1, range.to) : []).map((comment) => {
    const body = (comment as { body?: unknown }).body;
    return typeof body === "string" ? { ...comment, body: capText(body, PER_ITEM_BUDGET).text } : comment;
  });

  const links = issueLinks(REPO, number);
  return JSON.stringify({
    issue: {
      number,
      // See `get_issue`: what the number resolved to, since a pull request's
      // number answers this read too.
      ...(links.kind ? { kind: links.kind } : {}),
      title: issue?.title,
      state: issue?.state,
      total_comments: all.length,
      parent: links.parent,
      // `children` was the one of the three this header did not carry, and nothing
      // said why: the same `issueLinks` call already has it, so it cost nothing to
      // leave out and nothing to put back. What it costs to omit is the question a
      // reviewer asks most often of a parent — "is anything under this still open"
      // — answered by the comments alone, which cannot answer it.
      children: shownChildren(links.children),
      pull_requests: links.pullRequests,
      // See `get_issue`: an unread link list is not an empty one, and this
      // header exists precisely so a comment is not read as settled work.
      ...(links.unavailable ? { links_unavailable: links.unavailable } : {}),
    },
    // Always stated, never implied. A truncated read that looks complete is how
    // a caller concludes something is absent when it was merely not shown -- and
    // an empty one has to say why it is empty, or it reads as "nothing is there".
    showing: range.showing,
    comments: selected,
  });
}

/**
 * Close the issue, or ask the person who opened it to.
 *
 * The github server's close used to answer a person-opened issue with a tool
 * ERROR -- "Refusing to close issue #N: opened by a human, not a bot" -- and
 * post nothing. Two things were wrong with that, and
 * `domain/work/close-request.ts` holds the measurement: the error arrived at the
 * moment the agent had decided it was finished, so it went into the report as a
 * paragraph about tools; and because an error posts no comment, nobody was ever
 * asked to close anything. The issue just stayed open with a merged pull request
 * against it.
 *
 * `request_close_issue` settled the shape for the same question, and this
 * internal path follows it: the close decides, it does not fail, and it leaves
 * the request where a person will read it. Its only caller is `merge_pr`,
 * through `closeParentAndReport` -- an agent concludes its own issue with
 * `request_close_issue`, which this tool surface no longer duplicates.
 *
 * Returns whether the close actually happened, because the caller's aggregation
 * gate counts siblings and an issue that is still open is not one of them.
 */
function closeIssue(a: z.infer<typeof ISSUE_NUMBER_ARG_SCHEMA>): boolean {
  const num = a[ISSUE_NUMBER_ARG];
  log(`closeIssue: #${num}`);
  // NOTE: `gh issue view --json author` returns {id, is_bot, login, name} --
  // there is NO `.type` field (that only exists on the REST
  // `gh api repos/OWNER/REPO/issues/N` endpoint, as `.user.type`). Use the
  // reliable `.author.is_bot` boolean instead.
  const d = ghJsonOrThrow<GhIssueAuthor>("issue", "view", String(num), "--repo", REPO, "--json", "author");
  const isBot = !isHumanAuthor(d?.author?.is_bot);
  log(`closeIssue: author.is_bot=${isBot}`);
  if (!isBot) {
    const request = closeRequestComment({
      notify: resolveNotify(REPO, num),
      body: "Atomaton: an agent finished the work on this issue and asked for it to be closed.",
    });
    // `ended: "done"`, `audience: "person"`: this is the turn ending (the run is over and
    // the issue stays open for the person who was just asked), and it is addressed to
    // that person rather than to the model. Both used to be missing — the `exclude` tag
    // was written by hand and the ending was not written at all — and the missing ending
    // is what let the guard delete the person's agreement to close the issue. See
    // `conclude_issue.ts`, which has the same bug, and `turn-comment.ts`.
    const { code, stdout, stderr } = gh(
      "issue", "comment", String(num), "--repo", REPO,
      "--body", turnCommentBody({ ended: "done", audience: "person", body: request, ...endingIdentity() }),
    );
    // The one failure still worth an error. Saying nothing here would leave an
    // issue that nobody has been asked to close and an agent that believes
    // somebody has -- which is the defect above with the comment removed.
    if (code) mcpFail(`Could not ask for issue #${num} to be closed: ${stderr || stdout}`);
    logOp("close_issue", { number: num, closed: false });
    return false;
  }
  const { code, stdout, stderr } = gh("issue", "close", String(num), "--repo", REPO);
  if (code) mcpFail(stderr || stdout);
  logOp("close_issue", { number: num, closed: true });
  return true;
}

/**
 * Runs closeIssue()'s own logic, then -- whether this is a sub-issue closed
 * via the normal merge_pr path or via an origin-agent re-invocation
 * confirming its own work -- checks phase-gating/aggregation for its
 * parent, so it fires regardless of which path closed the issue.
 * dispatchOrchestratorIfSubIssueReady no-ops harmlessly if GitHub has #num under
 * nothing. Awaited by every caller (matching the original
 * Bun.spawnSync-based blocking behavior) so the tool response isn't
 * returned before phase-gating has actually run.
 *
 * The gate is skipped entirely when the close was only requested. Aggregation
 * asks whether every sibling is closed, and this one is not -- running it would
 * either answer "not yet" pointlessly or, worse, re-invoke a parent on the
 * strength of an issue that is still open.
 */
async function closeIssueAndDispatch(
  a: z.infer<typeof ISSUE_NUMBER_ARG_SCHEMA>,
  options: { continuesChain?: boolean } = {},
): Promise<string> {
  const closed = closeIssue(a);
  const num = a[ISSUE_NUMBER_ARG];

  if (!closed) {
    // Success, stated as what happened rather than as what was declined. It says
    // the close was requested because an agent that believed it had closed the
    // issue would go on to tell a person so -- the honest half of the old refusal,
    // kept, with the part that read as a failure to work around removed.
    return JSON.stringify({
      ok: true,
      close_requested: num,
      note: "The issue's author was asked on the thread to close it.",
    });
  }

  // The parent's thread is where the agent about to be re-invoked reads what happened
  // here, and this path has no summary to carry: `merge_pr` closed the issue itself
  // because no origin agent was tagged on the pull request, so no run wrote one down.
  // What the report carries instead is what GitHub links to the issue -- above all the
  // pull request that delivered it -- read through `issueLinks` rather than searched
  // for.
  reportSubIssueToParent(REPO, num, "");

  // The aggregation outcome is part of what happened, so it goes in the result.
  // This used to be awaited and discarded, and `{ok: true}` was returned whether
  // the parent's atomaton had been re-invoked, had been left waiting, or had
  // been skipped because something could not be read. The last of those leaves a
  // parent that nothing will ever come back to -- and the agent that closed the
  // issue is the last thing in a position to notice.
  let aggregation: DispatchGateResult;
  try {
    aggregation = await dispatchOrchestratorIfSubIssueReady(REPO, num, options);
  } catch (e) {
    const why = (e as Error).message ?? String(e);
    log(`closeIssueAndDispatch: aggregation check failed for #${num}: ${why}`);
    aggregation = { kind: "undetermined", why };
  }

  return JSON.stringify({
    ok: true,
    closed: num,
    aggregation: aggregation.kind,
    ...(needsAttention(aggregation)
      ? { note: describeGateResult(aggregation, num) }
      : {}),
  });
}

/**
 * An agent-written body, with mentions it cannot vouch for defused.
 *
 * The same check the result comment gets, for the same reason: a `@name` in an
 * issue or pull request body notifies a real account, and a name an agent read in
 * a commit log is a name it can repeat. See `domain/work/mention.ts`.
 *
 * The thread it checks against is the node this run sits on. On an issue run that
 * is the issue's own thread; on a pull request run the pull request's. For a new
 * issue the thread is the parent's rather than its own, which does not exist yet
 * -- and is the right set anyway: the people already talking about this work.
 *
 * The notice goes in the body rather than being logged, because the body is where
 * somebody will see it. A run log is read when something has already gone wrong.
 */
/**
 * Refuse text GitHub would act on, before it becomes something GitHub has acted on.
 *
 * Two places only, and they are the two the documentation names: a pull request's
 * description, and a commit message. A keyword in an issue body, a pull request comment
 * or a review does nothing -- checked against GitHub's own documentation rather than
 * assumed, because a guard on a path that cannot fire is a rule somebody has to read and
 * obey for no reason.
 */
function refuseClosingKeywords(text: string, what: string): void {
  const refusal = closingKeywordRefusal(closingReferences(text), what);
  if (refusal !== undefined) mcpFail(refusal);
}

/**
 * Refuse a body an agent wrote that carries a command on a line of its own.
 *
 * A command is a request from someone entitled to make it, and a body an agent wrote
 * is not one — but the next reader takes it for one: `extract_directive.ts` reads a
 * pull request body for the agent to dispatch, and `resolve_entry_agent.ts` reads an
 * issue body the same way. So an agent that writes `/engineer` into a body is starting
 * a run by accident, and the route it meant to use is a tool argument.
 *
 * `instead` names that route, and is required: a refusal that says what to do instead
 * is followed, and one that only states a rule is not.
 */
function refuseCommandLines(text: string, what: string, instead: string): void {
  const refusal = commandInBodyRefusal(commandLinesIn(text), what, instead);
  if (refusal !== undefined) mcpFail(refusal);
}

function withCheckedMentions(body: string): string {
  const checked = escapeUnknownMentions(
    body,
    knownParticipants(REPO, nodeNumber() === undefined ? "" : String(nodeNumber())),
  );
  if (checked.escaped.length === 0) return body;
  log(`escaped ${checked.escaped.length} unconfirmed mention(s): ${checked.escaped.join(", ")}`);
  const notice = escapedMentionNotice(checked.escaped);
  return notice === undefined ? checked.text : `${checked.text}\n\n${notice}`;
}

function injectParentIssue(body: string, reviewer: string): string {
  // The node this run sits on. `create_pr` refuses a pull request run before this
  // is reached, so on the only path here the node is the issue the pull request
  // delivers — and the tag below is what `merge_pr`, `issue-links.ts` and
  // `parse_pr_metadata.ts` all read as the same fact.
  const parent = nodeNumber() === undefined ? "" : String(nodeNumber());
  refuseClosingKeywords(body, "pull request body");
  // The reviewer is a tool argument, and the machinery writes the `/<agent>` line
  // itself below. An agent writing one into the body is asking for a run in the one
  // place a reader takes for a request, so it is refused rather than merged with the
  // argument -- two answers to "who reviews this" is the shape this repository keeps
  // finding.
  refuseCommandLines(
    body,
    "pull request body",
    "Pass the agent as the `reviewer` argument instead; the machinery writes the line for you.",
  );
  body = notifyTagPrefix(body, "PR") + withCheckedMentions(body);
  // The reviewer, as the same line a person would type. Written before the tags so
  // it is the first visible line of the body, which is where a directive is read
  // from -- see `latestRequestOn`. An empty name writes nothing, and the
  // pull request is then left for a person, who is told so below.
  const reviewerLine = reviewer ? `/${reviewer}\n\n` : "";
  if (!parent) return `${reviewerLine}${body}${openedByLine()}`;
  if (PARENT_ISSUE_TAG.has(body)) {
    // Raw `has`, not `hasProse` -- the agent's own draft, same rule as `notifyTagPrefix`:
    // the machinery writes the parent tag, and the agent writes none of it, fence
    // included (#304).
    mcpFail("PR body already contains a parent-issue tag; refusing to add another");
  }
  // `Part of #N`, not `Closes #N`, and written the same way for every pull request
  // — stacked or aimed at the default branch — so there is one rule rather than a
  // choice that depends on the base branch.
  //
  // `Closes` closed the issue whenever the base was the default branch, which is
  // not what this line is for: it is here to say which issue the work belongs to.
  // GitHub has no keyword that links without closing, so the answer is to use no
  // keyword at all; the cross-reference `Part of #N` produces is what a person
  // sees, and `PARENT_ISSUE_TAG` is what the machinery reads. Cost, and the
  // pull requests the choice was checked on: #171.
  //
  // Unconditionally, now that `refuseClosingKeywords` above guarantees the agent
  // wrote none of its own — the two now agree instead of one forbidding what the
  // other did.
  const line = `${partOfLine(Number(parent))}\n`;
  const originAgent = (process.env.AGENT ?? "").trim();
  const originLine = originAgent ? `${ORIGIN_AGENT_TAG.write(originAgent)}\n` : "";
  return `${reviewerLine}${PARENT_ISSUE_TAG.write(Number(parent))}\n${originLine}${line}${body}${openedByLine()}`;
}

/**
 * Who opened this pull request, said in the body where a reader can see it.
 *
 * The hidden `atomaton:origin-agent` tag above carries the same fact for the
 * machinery, but a tag is invisible in every place a person reads the thread, and
 * the PR body is where "who did this work" is looked for (#215). This line is
 * there for everyone else — and it is the routing input when a review sends the
 * pull request back: the agent `Opened by` names is the one that fixes the
 * findings, which is exactly the agent that opened it.
 *
 * Written at the END of the body, below the work: it is metadata about the pull
 * request, the work is above it, and a directive is read from the body's first
 * visible line — a `/engineer` a caller meant to write would otherwise sit next to
 * something that looks like a second answer.
 *
 * Written for a root-issue pull request as well as a stacked one: who opened the
 * pull request is a fact about the pull request, not about the branch it aims at.
 * Empty when a person or the machinery started this run, which is the ordinary
 * case for a pull request nobody will route back to.
 */
function openedByLine(): string {
  const agent = (process.env.AGENT ?? "").trim();
  if (!agent) return "";
  const runUrl = (process.env.ATOMATON_RUN_URL ?? "").trim();
  const who = runUrl ? `[\`${agent}\`](${runUrl})` : `\`${agent}\``;
  return `\n---\n_Opened by ${who}_\n`;
}

function createPr(a: z.infer<typeof CREATE_PR_SCHEMA>): McpToolResult {
  const title = a.title;
  let body = a.body ?? "";

  // A pull request is a leaf, so a pull request run does not open another one. The
  // tree is Issue -> sub-Issue -> (single) pull request; a PR run either reviews that
  // pull request or fixes it, and neither adds a node below it. Without this guard a
  // PR run could open a second PR whose base is the first PR's head -- a pull request
  // under a pull request, which is not a shape the tree has.
  //
  // `create_sub_issue` and `launch_sub_agent` refuse on a PR run for the same reason; this
  // is the third tool that could add a child, and it was the one left open.
  if (isPrRun()) {
    refusePrRun(
      "create_pr",
      "Use commit_and_push to push a fix onto this pull request's branch, " +
        "or merge_pr to merge it once its review passes.",
    );
  }

  // Where this pull request aims is part of the tree, not a choice. A sub-issue's
  // pull request targets its parent's branch, so the parent's work accumulates in
  // one place and reaches the base as a single reviewed change; anything else
  // targets the configured base branch — how an adopter says where day-to-day work
  // lands, since a repo that develops on `develop` cannot have every agent PR aimed
  // at the default branch. With none set, `gh` targets the default branch.
  const base = stackedPrBase(REPO) ?? getBaseBranch();
  const reviewer = (a.reviewer ?? "").trim();
  body = injectParentIssue(body, reviewer);
  log(`createPr: title=${JSON.stringify(title)}, base=${JSON.stringify(base)}, REPO=${JSON.stringify(REPO)}`);

  const branch = resolveBranch();
  log(`createPr: resolved branch=${JSON.stringify(branch)}`);

  const worktree = gitRun("status", "--porcelain");
  if (worktree.code) mcpFail(worktree.stderr || worktree.stdout);
  if (worktree.stdout.trim()) {
    mcpFail("Cannot create a PR with uncommitted changes. Call commit_and_push first.");
  }
  const head = gitRun("rev-parse", "HEAD");
  if (head.code) mcpFail(`Cannot resolve local HEAD: ${head.stderr || head.stdout}`);
  const remote = readOriginBranch(branch);
  if (!remote.known) mcpFail(`Cannot inspect remote branch '${branch}': ${remote.why}`);
  if (!remote.present) {
    mcpFail(`Remote branch '${branch}' does not exist. Call commit_and_push before creating the PR.`);
  }
  if (remote.sha !== head.stdout.trim()) {
    mcpFail(
      `Remote branch '${branch}' is not at local HEAD. Call sync_branch and inspect its status; ` +
      `if it reports 'ahead', call commit_and_push before creating the PR.`,
    );
  }

  const cmd = ["pr", "create", "--repo", REPO, "--title", title, "--head", branch];
  if (body) cmd.push("--body", body);
  if (base) cmd.push("--base", base);
  log(`createPr: running gh ${cmd.join(" ")}`);
  const { code, stdout, stderr } = gh(...cmd);
  log(`createPr: gh pr create rc=${code}, out=${JSON.stringify(stdout)}, err=${JSON.stringify(stderr)}`);
  if (code) mcpFail(`gh pr create failed (rc=${code}): ${stderr || stdout}`);

  const num = Number(stdout.trim().split("/").pop());
  if (!Number.isFinite(num)) mcpFail(`gh pr create: unexpected output: ${stdout.slice(0, 300)}`);

  logOp("create_pr", { number: num, title });
  // The reviewer is named by the caller, and the name goes in the BODY rather than
  // into this dispatch. Two reasons, and the second is the one that matters.
  //
  // The body is where the name survives. A dispatch argument is gone the moment the
  // run ends, so a re-validation -- a push, a second CI round -- had nothing to read
  // and fell back to a literal. The body is read every time, by the same reader that
  // resolves a person's `/reviewer` comment.
  //
  // And it makes one mechanism out of two. An agent naming a reviewer and a person
  // typing `/reviewer` are the same request, so they are written the same way and
  // resolved by the same code. `injectParentIssue` below puts the line in.
  //
  // An empty name is a legitimate answer: CI still runs, and nothing is dispatched
  // afterwards. What it did not handle is a person finding out, which is what
  // `noticeNobodyIsComing` below is for.
  // Traceability: the reviewer dispatch is fire-and-forget, and (since this call
  // now ends the session immediately, see the returned meta.session_ends below) no
  // further agent text will be posted on the CURRENT issue about this -- record it
  // here explicitly, the same way dispatchSubAgent always confirms its own
  // dispatch with a comment.
  const node = nodeNumber();
  // The `waiting` ending goes up BEFORE the dispatch, and its comment id is the ask
  // the dispatched run claims (#285): the reviewer line in the body is not a
  // comment, so the waiting comment is the only identity the thread can give the
  // request this dispatch fulfils — the ask the run's claim names, the check
  // verifies its wait against, and the ending eventually answers back. That is
  // also why the wait is posted first: a dispatch that has no ask to name is
  // refused, not sent.
  //
  // The `waiting` tag records that this run stopped to wait on a child (the pull
  // request); without it the node's last turn event reverts to the `asked` that
  // started the run, and the aggregation gate reads that as a request nobody took
  // up. It is chosen here rather than inside the wrapper because a comment with no
  // ending is not a turn comment: the failure path below takes this one back and
  // posts a content-free notice instead, because a failed dispatch keeps the
  // session open and a run that continues must not carry the tag. See
  // `domain/work/thread.ts`.
  let waitingCommentId: string | undefined;
  if (node !== undefined) {
    const next = reviewer
      ? `Running CI; \`${reviewer}\` follows if it passes.`
      : "Running CI. No reviewer was named, so nothing is scheduled afterwards.";
    const text = `Atomaton: PR #${num} created (${stdout.trim()}). ${next}`;
    // Posted but NOT recorded yet: whether the session ends is known only once the
    // dispatch answers — the same order `reload_environment` runs in, which posts
    // its hand-off and records it only when the dispatch succeeds.
    waitingCommentId = postTurnComment({
      number: String(node),
      repo: REPO,
      body: turnCommentBody({ ended: "waiting", audience: "person", body: text, ...endingIdentity() }),
    });
  }
  const validationDispatched = dispatchPrValidation(REPO, num, branch, { ask: waitingCommentId });
  if (validationDispatched) {
    // The turn is PARKED: this session ends inside this call, the work it started runs
    // on the pull request, and the node keeps its `atomaton/in-progress` label — the
    // same treatment `launch_sub_agent`'s children get, and the reason
    // `shouldReleaseGuard` holds for a parked turn (`domain/work/turn.ts`). The runner
    // reads it back out of this run's own ops log by grepping for the op name
    // `logDispatch` writes with `elsewhere`; without the entry, this run's ending was
    // read as `finished` and the node went to `atomaton/waiting-for-person` while a
    // reviewer was working its pull request (#351).
    //
    // Written HERE, not inside `dispatchPrValidation`, because that function is also
    // the stand-in a person's `/reviewer` comment reaches
    // (`entrypoints/machinery/dispatch_pr_validation.ts`): a request being delivered to
    // work already on this node parks nothing. And written only when the dispatch
    // SUCCEEDED: a failed one keeps the session open for the agent to act on, and a run
    // that carries on is not parked — the entry would hold the guard on a node whose
    // only live thing is the agent still typing.
    //
    // `reviewer` is the name the caller passed, and may be empty, because nobody is
    // chosen yet: validation routes CI's verdict. The op NAME is all the runner reads;
    // a name invented here would be one a later reader believes.
    logDispatch("pr", reviewer, { number: num, elsewhere: true });
  }
  if (node !== undefined) {
    if (validationDispatched) {
      // The session ends here, so the waiting comment IS this run's ending: recorded
      // through the one helper (`ending-comment.ts`), so the result footer lands on
      // THIS comment instead of on a second, content-free one beside it.
      recordEndingComment(waitingCommentId, String(node));
    } else {
      // Take the wait back — a run that continues must not leave a comment claiming
      // it is waiting — and say what actually happened, with no ending, the way the
      // pre-#285 failure path wrote it.
      if (waitingCommentId !== undefined) {
        gh("api", `repos/${REPO}/issues/comments/${waitingCommentId}`, "--method", "DELETE");
      }
      const text =
        `Atomaton: PR #${num} created (${stdout.trim()}). ` +
        "CI could NOT be started, so no required check will appear and no agent is scheduled. See the run log.";
      postTurnComment({
        number: String(node),
        repo: REPO,
        body: `${LLM_CONTEXT_TAG.write("exclude")}\n${text}`,
        sessionEnds: false,
      });
    }
  }

  // Nobody coming, said out loud on the pull request itself.
  //
  // Asking is explicit now -- an agent names the reviewer, or a person types
  // `/reviewer` -- which removed a class of unwanted runs and created one silent
  // failure: a pull request opened with no reviewer and nobody mentioned just sits.
  // CI passes, the check goes green, and the work waits for someone who was never
  // told. The old triggers made that impossible; making asking explicit made
  // forgetting possible.
  //
  // Not tagged `llm-context=exclude`, unlike the confirmation above: this one is a
  // fact about the pull request that a later agent reading the thread should see.
  // The confirmation is bookkeeping; this is "nobody is coming".
  if (!isAttended({ ...(reviewer ? { next: { agent: reviewer } } : {}), body: body ?? "" })) {
    const openedBy = (process.env.AGENT ?? "").trim() || "an agent";
    const notify = resolveNotify(REPO, num);
    log(`createPr: PR #${num} has no reviewer and mentions nobody; leaving a notice for ${notify || "(nobody resolved)"}`);
    gh("pr", "comment", String(num), "--repo", REPO, "--body", unattendedNotice(notify, openedBy));
  }

  // From the calling agent's (engineer's) perspective, create_pr should
  // behave like launch_sub_agent: a normal-looking synchronous tool call
  // that, once it returns, immediately ends this session. The agent is
  // re-invoked later (see dispatchPostMergeAgent) once the PR actually
  // concludes (merged, or sent back via changes_requested), at which point
  // that re-invocation is framed as the deferred continuation of this exact
  // call -- not a brand-new unrelated task. This keeps the engineer's own
  // run from continuing to execute concurrently with the reviewer run just
  // dispatched above (the whole point of the "serial" design).
  // `session_ends` only when something is actually going to happen next.
  //
  // This used to be unconditional, and `dispatchPrValidation` returned void, so
  // a failed dispatch ended the engineer's session having reported success: no
  // CI, no required check, no agent re-invoked, and a pull request that sits
  // until a person finds it. The engineer is the only thing still able to fix
  // that, and it was the thing being told to stop.
  //
  // `base` is returned because it is resolved from the tree and the configured
  // base rather than chosen, and which one won decides whether merging this
  // deploys. See `stackedPrBase`.
  return {
    text: JSON.stringify({
      number: num,
      url: stdout.trim(),
      base,
      validation_dispatched: validationDispatched,
      ...(validationDispatched
        ? {}
        : {
            note:
              "The pull request exists, but CI could not be started, so no required check will be written " +
              "and no agent is scheduled to continue. Retry with commit_and_push, which dispatches " +
              "validation again, or report this so a person can start it.",
          }),
    }),
    meta: validationDispatched ? { session_ends: true } : {},
  };
}


/**
 * The first line of git's own record of the merge in progress, or "".
 *
 * Read rather than recomposed. `git merge -m` writes the message into `MERGE_MSG`, so
 * a merge `merge_base_into_branch` started leaves `Merge base branch 'main' (abc1234)
 * into 'atomaton/issue-3'` there, and git's own default leaves what it decided. The
 * base a conflicted merge came from was fixed when that merge started, and asking the
 * configuration again later can answer a different branch.
 */
function mergeMessage(): string {
  const dir = gitRun("rev-parse", "--git-dir");
  if (dir.code) return "";
  try {
    const text = readFileSync(join(dir.stdout.trim(), "MERGE_MSG"), "utf8");
    return text.split("\n").map((line) => line.trim()).find((line) => line && !line.startsWith("#")) ?? "";
  } catch {
    return "";
  }
}

/**
 * The merge an unfinished `merge_base_into_branch` left behind, if there is one.
 *
 * `MERGE_HEAD` is git's own record that the next commit has two parents, and the
 * unmerged entries in the index are the paths the merge could not decide. Both have to
 * be read BEFORE `git add -A`, which is what stages a conflicted path and so tells git
 * the conflict is resolved.
 *
 * Which of those paths are still unresolved is asked of the FILE, not of the index, and
 * that is not a shortcut: an agent that resolved a conflict by editing it has no way to
 * stage the result -- raw `git add` is a mutation the shell guard refuses -- so the
 * index would call every conflict unresolved until `commit_and_push` had already
 * committed it. The content can answer: git's markers are `<<<<<<< label` and
 * `>>>>>>> label` at the start of a line, and they are gone exactly when the conflict
 * has been decided. A resolved path needs to be bracketed by git's end of it; a path
 * written down as a literal, in a comment or a test, does not.
 */
function unfinishedMerge(): { head: string; unresolved: string[]; description: string } | undefined {
  const head = gitRun("rev-parse", "-q", "--verify", "MERGE_HEAD");
  if (head.code !== 0) return undefined;
  const unmerged = gitRun("diff", "--name-only", "--diff-filter=U");
  const paths =
    unmerged.code === 0 ? unmerged.stdout.split("\n").map((line) => line.trim()).filter(Boolean) : [];
  const unresolved = paths.filter((path) => {
    try {
      return /^(?:<{7} |>{7} )/m.test(readFileSync(path, "utf8"));
    } catch {
      // Gone from the worktree, which is a resolution: `add -A` stages the deletion.
      return false;
    }
  });
  return { head: head.stdout.trim(), unresolved, description: mergeMessage() };
}

/**
 * Push the checked-out branch, and make GitHub run the required check on its new head.
 *
 * One copy for both callers that publish: `commit_and_push`, and
 * `merge_base_into_branch`'s merge commit. A second copy would be a second place for
 * the validation dispatch below to be forgotten — and forgetting it is invisible: the
 * pull request keeps the check its previous head commit had, so the ruleset reads the
 * required context as missing and the merge stays refused.
 *
 * A push to a branch that already has a pull request has to be validated the same way
 * the first push was. Nothing else will do it: GitHub raises no event for a push made
 * with GITHUB_TOKEN, so neither CI nor any routing workflow hears about this commit.
 *
 * Skipped when there is no pull request yet, which is the ordinary first push:
 * `create_pr` dispatches validation itself once the pull request exists, and
 * validating a branch with nothing to merge into would only burn a CI run.
 *
 * Repeated pushes within one run each dispatch, and the validation workflow's own
 * concurrency group collapses them, keeping the last.
 *
 * Returns whether the remote moved, so a caller can report honestly that it pushed
 * nothing.
 */
function pushBranch(branch: string): boolean {
  const { code, stdout, stderr } = gitRun("push", "-u", "origin", branch);
  if (code) mcpFail(stderr || stdout);
  const pushed = !/Everything up-to-date/i.test(`${stdout} ${stderr}`);
  if (!pushed) return false;

  const open = gh("pr", "list", "--repo", REPO, "--head", branch, "--state", "open", "--json", "number");
  if (!open.code) {
    try {
      const [pr] = JSON.parse(open.stdout || "[]") as { number: number }[];
      // No reviewer argument. This dispatch exists to refresh the required check on
      // the new head commit, which is about whether the pull request CAN merge -- a
      // different question from whether anyone should look at it. The name is read
      // from the pull request's own body by the validation, so a push does not have
      // to carry it.
      //
      // `pull_request.synchronize` used to start a reviewer here, and only for a
      // person's push. It was removed: nothing starts unless someone asks. An
      // agent that pushed a fix and wants it reviewed hands off by naming the
      // reviewer as its directive, which is the path the handoff limit covers.
      //
      // The ask the re-validated run claims is a FRESH comment, posted here — the
      // shape `create_pr` uses for its `waiting` ending (#285). Quoting the pushing
      // run's own ask was the first cut, and it deadlocks the fix cycle: that ask
      // carries THIS run's claim, older than anything the dispatch could write, so
      // the run the validation starts loses the claim race every time and posts
      // nothing — green CI with no verdict, red CI with no fix. The push comment is
      // the record of what this dispatch is answering (the head moved), no earlier
      // claim can hold it, and two validations for one push race on it the way two
      // validations for one command race on the command.
      let pushAsk: string | undefined;
      if (pr) {
        const sha = gitRun("rev-parse", "--short", "HEAD");
        const head = sha.code === 0 ? sha.stdout.trim() : "";
        const posted = gh(
          "api", `repos/${REPO}/issues/${pr.number}/comments`, "--method", "POST",
          "-f", `body=${LLM_CONTEXT_TAG.write("exclude")}\nAtomaton: pushed ${head} to this pull request. Running CI; the result routes what happens next.`,
          "--jq", ".id",
        );
        if (posted.code === 0) pushAsk = posted.stdout.trim() || undefined;
        else report("warning", "could not post the push comment, so the dispatched run would have no ask to claim; validation was NOT dispatched");
      }
      if (pr && pushAsk !== undefined) dispatchPrValidation(REPO, pr.number, branch, { ask: pushAsk });
    } catch {
      // This call's result is `{ok: true}` and validation was not started. An
      // agent that pushed and expects CI to run would be waiting for something
      // that is not coming, so the discrepancy has to reach it, not the log.
      report(
        "warning",
        "could not read the open pull request list, so CI validation was NOT dispatched for this push",
      );
    }
  }
  return true;
}

function commitAndPush(a: z.infer<typeof COMMIT_AND_PUSH_SCHEMA>): string {
  const message = a.message;
  // Before anything is written. A commit message is the other place GitHub acts on a
  // closing keyword, and the harder of the two to notice afterwards: it is not in the
  // pull request's diff, and nobody opens the commit list to check.
  refuseClosingKeywords(message, "commit message");
  // Before the commit, so a failure to name a branch does not leave a commit
  // stranded on the base branch.
  const branch = branchForCommit(REPO);
  // Before `git add -A` below, which would stage the conflict markers and so tell git
  // every conflict is resolved. `merge_base_into_branch` stops on a conflict and
  // leaves the work in the worktree; this is the only way that merge is ever
  // concluded, so refusing here is what keeps a marker file out of the branch.
  const merge = unfinishedMerge();
  if (merge && merge.unresolved.length > 0) {
    mcpFail(
      `The merge in progress still has unresolved conflicts: ${merge.unresolved.join(", ")}. ` +
        "Resolve them (the conflict markers are in those files), then call commit_and_push again to close the merge.",
    );
  }
  {
    const { code, stdout, stderr } = gitRun("add", "-A");
    if (code) mcpFail(stderr || stdout);
  }
  // "nothing to commit" is not a failure to commit; it is having nothing to commit.
  // It happened 23 times, and failing here skipped the push below -- so an agent that
  // had committed through the shell and called this to publish the work got an error
  // and a branch that never reached origin. The push is the part that still had
  // something to do, so fall through to it and report honestly that nothing was
  // committed. `git push` on an already-published branch exits 0 saying so.
  //
  // The message a merge is concluded with carries what was brought in -- the base
  // branch, in git's own words from `MERGE_MSG`. The agent decides the rest of the
  // commit message; what it cannot be expected to know is which merge it is closing,
  // because the call that stopped for conflicts is not this one.
  const commitMessage = merge ? `${message}\n\n${merge.description || `Merge ${merge.head}`}` : message;
  let committed = true;
  {
    const result = gitRun("commit", "-m", commitMessage);
    if (result.code) {
      if (!nothingToCommit(result)) mcpFail(result.stderr || result.stdout);
      committed = false;
    }
  }
  const pushed = pushBranch(branch);

  // Only when something moved.
  //
  // The runner reads this log to decide whether a run changed anything, and stops a
  // chain that has stopped moving. Letting the commit through when the tree was clean
  // was right -- there was a commit waiting to be pushed -- but a call that commits
  // nothing AND pushes nothing must not register as progress, or the fix to one
  // failure would have quietly disarmed a guard against another.
  if (committed || pushed) logOp("commit_and_push", { committed });

  // `committed: false, pushed: false` is the honest report of a call that found nothing
  // to do. It used to be an error, which stopped the run; it is a fact the agent can
  // read and act on, and saying it plainly is better than either failing or implying
  // work was published.
  return JSON.stringify({ ok: true, committed, pushed, ...(merge ? { merge_head: merge.head } : {}) });
}

function syncBranch(a: z.infer<typeof SYNC_BRANCH_SCHEMA>): string {
  const branch = a.branch?.trim() || resolveBranch();
  const valid = gitRun("check-ref-format", "--branch", branch);
  if (valid.code) mcpFail(`Invalid branch name '${branch}': ${valid.stderr || valid.stdout}`);
  const current = checkedOutBranch();
  if (current !== branch) {
    mcpFail(`Cannot synchronize '${branch}' while '${current || "detached HEAD"}' is checked out.`);
  }

  const worktree = gitRun("status", "--porcelain");
  if (worktree.code) mcpFail(worktree.stderr || worktree.stdout);
  if (worktree.stdout.trim()) {
    mcpFail("Cannot synchronize a branch with uncommitted changes. Commit or discard them first.");
  }

  const remoteRef = `refs/remotes/origin/${branch}`;
  const fetch = gitRun("fetch", "origin", `refs/heads/${branch}:${remoteRef}`);
  if (fetch.code) {
    if (/couldn't find remote ref|not our ref/i.test(fetch.stderr)) {
      return JSON.stringify({ branch, status: "remote_missing", ahead: 0, behind: 0 });
    }
    mcpFail(`Failed to fetch remote branch '${branch}': ${fetch.stderr || fetch.stdout}`);
  }

  const counts = gitRun("rev-list", "--left-right", "--count", `HEAD...${remoteRef}`);
  if (counts.code) mcpFail(`Failed to compare branch '${branch}': ${counts.stderr || counts.stdout}`);
  const [ahead, behind] = counts.stdout.trim().split(/\s+/).map(Number);
  if (!Number.isFinite(ahead) || !Number.isFinite(behind)) {
    mcpFail(`Unexpected rev-list output for branch '${branch}': ${counts.stdout}`);
  }

  if (ahead === 0 && behind! > 0) {
    const fastForward = gitRun("merge", "--ff-only", remoteRef);
    if (fastForward.code) mcpFail(`Failed to fast-forward branch '${branch}': ${fastForward.stderr || fastForward.stdout}`);
    logOp("sync_branch", { branch, status: "fast_forwarded", ahead, behind });
    return JSON.stringify({ branch, status: "fast_forwarded", ahead, behind });
  }

  const status = ahead! > 0 && behind! > 0 ? "diverged" : ahead! > 0 ? "ahead" : "up_to_date";
  logOp("sync_branch", { branch, status, ahead, behind });
  return JSON.stringify({ branch, status, ahead, behind });
}

/**
 * The branch this run's work is based on: the one a merge brings in.
 *
 * The same rule `create_pr` states, applied to the node this run is actually on. An
 * issue run resolves it from the tree — a sub-issue's base is its parent's branch, and
 * anything else targets the configured base branch — because that is where its own
 * pull request will aim. A pull request run has no issue to ask about: its `NUMBER` is
 * the pull request, and the base that pull request aims at is the one base this branch
 * must take in. Reading it from the pull request rather than re-deriving it is what
 * makes a stacked pull request bring in its parent's branch and not the release branch
 * underneath it.
 *
 * `base_branch` is unset for "the repository's default branch", which `gh pr create`
 * resolves on its own and a merge has to name: there is nothing to fetch from an
 * empty name. `baseBranch` is where that empty answer becomes the remote's default
 * branch, once for every caller.
 */
function baseBranchForMerge(): string {
  const number = nodeNumber();
  if (isPrRun() && number !== undefined) {
    const pr = readPullRequestOrThrow<{ baseRefName?: string }>(REPO, number, "baseRefName");
    const fromPullRequest = (pr.baseRefName ?? "").trim();
    if (fromPullRequest) return fromPullRequest;
  }

  // The tree's answer first (a sub-issue takes in its parent's branch), then the
  // project's base: `base_branch`, or origin's default branch when nothing is set.
  const fromTree = stackedPrBase(REPO);
  if (fromTree) return fromTree;

  const base = baseBranch();
  if (!base.known) {
    mcpFail(
      `Cannot tell which branch this work is based on: no base branch is configured, and ${base.why}.`,
    );
  }
  return base.branch;
}

/** Whether this checkout's history stops short of its roots. */
function isShallowCheckout(): boolean {
  return gitRun("rev-parse", "--is-shallow-repository").stdout.trim() === "true";
}

/**
 * The commit `ref` and HEAD share, or undefined when this checkout shows none.
 *
 * Asked with `merge-base` rather than read off `--is-ancestor`, whose exit code 1
 * means either "not an ancestor" or "no common ancestor at all" — and the two need
 * opposite things done about them.
 */
function mergeBaseWith(ref: string): string | undefined {
  const base = gitRun("merge-base", ref, "HEAD");
  return base.code === 0 && base.stdout ? base.stdout.trim() : undefined;
}

/**
 * Deepen a shallow checkout until the merge base with the base branch is present.
 *
 * Returns whether the merge base is reachable afterwards. #372: a depth-1 checkout,
 * which is what `actions/checkout` leaves when no workflow asks for more, has no
 * ancestry for the branch's own tip, so `git merge` finds no common ancestor and
 * refuses with `fatal: refusing to merge unrelated histories` — a fact about this
 * checkout said as if it were a fact about the branches, when GitHub has the merge
 * base all along.
 *
 * The refspec is explicit because `actions/checkout` writes a narrow one into
 * `.git/config`: `git fetch --unshallow origin` on its own deepens that one ref and
 * leaves everything else where it was. `--unshallow` rather than a bounded
 * `--deepen`: how far back the merge base lies cannot be known from here, and a
 * deepening loop is several round trips to a remote that can answer once. A checkout
 * that can already answer `merge-base` never reaches this, so the ordinary merge pays
 * nothing for it.
 *
 * The alternative — checking every machinery run out at `fetch-depth: 0` — was
 * rejected: it charges every run the full history of the repository, when the tools
 * that need it (`merge-base` here, the credential scan's branch range) are the ones
 * that can say so and ask.
 */
function deepenToMergeBase(remoteRef: string): boolean {
  const fetch = gitRun("fetch", "--unshallow", "origin", "+refs/heads/*:refs/remotes/origin/*");
  if (fetch.code) {
    log(`this checkout is shallow, and deepening it failed: ${fetch.stderr || fetch.stdout}`);
    return false;
  }
  return mergeBaseWith(remoteRef) !== undefined;
}

/**
 * Bring this branch's base into it, as a merge commit, and push.
 *
 * The route `git merge` never had. #264: a pull request whose base had moved ahead
 * could be brought up to date by no tool at all — `sync_branch` fast-forwards THIS
 * branch from its OWN remote branch, which is the other question, and the shell guard
 * refused a raw merge by saying to use the github tools. The run that hit it built the
 * merge out of `commit-tree` and `update-ref`, and that merge reached no ops log, so
 * the only record of it was the transcript.
 *
 * One node, one branch, one direction. The base comes INTO the checked-out branch;
 * nothing is pushed anywhere else, no child's or sibling's branch is touched, and
 * nothing cascades. A merge up the tree is what closing an issue and merging the pull
 * request into the parent branch already do.
 *
 * A conflict commits nothing and leaves the markers in the worktree, because which side
 * wins is a judgement about the code. A `package.json` version is the case that shows
 * why no rule belongs here: both sides are plausible, and a machine choosing one
 * silently rolls a release back.
 */
function mergeBaseIntoBranch(): string {
  try {
    return mergeBaseIntoBranchOrThrow();
  } catch (error) {
    // Every result, including this one: a merge that failed half-way is the entry
    // someone reading the log most needs, and it is the one an early return loses.
    logOp("merge_base_into_branch", { status: "failed", reason: (error as Error).message });
    throw error;
  }
}

function mergeBaseIntoBranchOrThrow(): string {
  const branch = resolveBranch();
  if (unfinishedMerge()) {
    mcpFail(
      "A merge is already in progress on this branch. Resolve its conflicts and call commit_and_push to close " +
        "it before bringing another base in.",
    );
  }
  const worktree = gitRun("status", "--porcelain");
  if (worktree.code) mcpFail(worktree.stderr || worktree.stdout);
  if (worktree.stdout.trim()) {
    mcpFail("Cannot merge the base branch into a branch with uncommitted changes. Call commit_and_push first.");
  }

  const base = baseBranchForMerge();
  if (base === branch) {
    mcpFail(`'${base}' is both the branch this run is on and its base, so there is nothing to bring in.`);
  }
  const remoteRef = `refs/remotes/origin/${base}`;
  const fetch = gitRun("fetch", "origin", `refs/heads/${base}:${remoteRef}`);
  if (fetch.code) mcpFail(`Cannot fetch base branch '${base}': ${fetch.stderr || fetch.stdout}`);
  const remoteTip = (): string => {
    const resolved = gitRun("rev-parse", remoteRef);
    if (resolved.code) mcpFail(`Cannot resolve base branch '${base}': ${resolved.stderr || resolved.stdout}`);
    return resolved.stdout.trim();
  };
  let baseSha = remoteTip();

  // Before the ancestry question, because a truncated checkout cannot answer that one
  // either: `--is-ancestor` reads history it does not have as "not an ancestor".
  let deepened = false;
  if (mergeBaseWith(remoteRef) === undefined) {
    if (!isShallowCheckout()) {
      mcpFail(
        `'${branch}' and '${base}' share no common ancestor in this checkout, so git would refuse the merge ` +
          `with "fatal: refusing to merge unrelated histories". Nothing was merged.`,
      );
    }
    deepened = deepenToMergeBase(remoteRef);
    if (!deepened) {
      mcpFail(
        `Cannot find the merge base between '${branch}' and '${base}': this checkout is shallow (the workflow ` +
          `clones at fetch-depth 1) and deepening it did not reach one. That is what "fatal: refusing to merge ` +
          `unrelated histories" would have been describing — the truncated checkout, not the branches. Nothing ` +
          `was merged.`,
      );
    }
    // The deepening fetched every branch, so where the base's tip is now is worth
    // re-reading rather than carrying the sha resolved before it.
    baseSha = remoteTip();
  }

  // Recorded only when it happened: an ordinary merge says nothing, and a reader
  // wondering why one merge was slow has the answer in the entry.
  const deepening = deepened ? { deepened: true } : {};

  const ancestor = gitRun("merge-base", "--is-ancestor", remoteRef, "HEAD");
  if (ancestor.code === 0) {
    logOp("merge_base_into_branch", { branch, base, status: "up_to_date", base_sha: baseSha, ...deepening });
    return JSON.stringify({ status: "up_to_date", branch, base, base_sha: baseSha });
  }
  if (ancestor.code !== 1) {
    mcpFail(`Cannot compare '${branch}' with '${base}': ${ancestor.stderr || ancestor.stdout}`);
  }

  // `--no-ff` so the result is always a merge commit: it records that the base was
  // taken in, and it is one shape for every case rather than a fast-forward whose
  // history says nothing about why it moved.
  const merge = gitRun(
    "merge", "--no-ff",
    "-m", `Merge base branch '${base}' (${baseSha.slice(0, 12)}) into '${branch}'`,
    remoteRef,
  );
  // Asked of the index rather than read from the merge's exit code: that code is 1 for
  // a conflict and for several failures that are not one.
  const unmerged = gitRun("diff", "--name-only", "--diff-filter=U");
  const files = unmerged.stdout.split("\n").map((line) => line.trim()).filter(Boolean);
  if (files.length > 0) {
    // Not committed, and deliberately not `merge --abort`: the markers are the work.
    logOp("merge_base_into_branch", { branch, base, status: "conflicts", base_sha: baseSha, files, ...deepening });
    return JSON.stringify({
      status: "conflicts",
      branch,
      base,
      base_sha: baseSha,
      files,
      note:
        "Nothing was committed. The conflicts are in the worktree with their markers; resolve them, then call " +
        "commit_and_push to close the merge.",
    });
  }
  if (merge.code) mcpFail(`Merging '${base}' into '${branch}' failed: ${merge.stderr || merge.stdout}`);

  const head = gitRun("rev-parse", "HEAD");
  if (head.code) mcpFail(`Cannot resolve HEAD after the merge: ${head.stderr || head.stdout}`);
  const commit = head.stdout.trim();
  pushBranch(branch);
  logOp("merge_base_into_branch", { branch, base, status: "merged", base_sha: baseSha, commit, ...deepening });
  return JSON.stringify({ status: "merged", branch, base, base_sha: baseSha, commit });
}

/**
 * The most one item of a list may contribute.
 *
 * A fifth of the whole, so five long comments fill the budget rather than the
 * first one doing it alone. A count limit is not a volume limit: `get_issue_comments`
 * bounds how MANY comments it returns and said nothing about how big one may be, so
 * a single comment with a pasted log in it filled the window while the tool
 * reported having shown three of forty.
 */
const PER_ITEM_BUDGET = Math.floor(TOOL_OUTPUT_BUDGET / 5);

/**
 * Fields of one REST object, and nothing else.
 *
 * Every tool below that reached `gh api` returned the response whole. That is not
 * a small waste: a tool result joins the session and is resent on every later
 * inference in it, so an unread field is rent charged for the rest of the issue's
 * life. Measured on this repository:
 *
 *   get_check_runs   24,954 -> 1,363 bytes   (18x; `app` is 2,244 bytes PER RUN,
 *                                             the same App description eight times)
 *   get_branch       11,614 ->    81 bytes   (143x; `commit` is 11,164 of it)
 *   get_pr_reviews      905 ->   ~400 bytes  (2x; already trimmed by `gh --json`)
 *
 * A projection is strictly better than a cap: the cap loses information and this
 * loses none. Note the pattern in those numbers -- the tools using `gh --json`
 * were already light and the ones using `gh api` were heavy, because `gh --json`
 * makes you name what you want.
 *
 * `unknown` in, typed out: these come from `ghJsonOrThrow`, and asserting a shape
 * that GitHub might change would be a lie the compiler believes.
 */
function pick<K extends string>(source: unknown, keys: readonly K[]): Partial<Record<K, unknown>> {
  if (typeof source !== "object" || source === null) return {};
  const record = source as Record<string, unknown>;
  const out: Partial<Record<K, unknown>> = {};
  for (const key of keys) if (record[key] !== undefined) out[key] = record[key];
  return out;
}

function getPr(a: z.infer<typeof PR_CONTEXT_NUMBER_ARG_SCHEMA>): string {
  const pr = readPullRequestOrThrow<{ body?: unknown }>(REPO, prContextNumber(a), [
    "number",
    "title",
    "body",
    "state",
    "baseRefName",
    "headRefName",
    "createdAt",
  ]);
  const { body, ...rest } = pr;
  // Same as `get_issue`: the description is the one unbounded field here.
  return JSON.stringify({ ...rest, body: typeof body === "string" ? capText(body).text : body });
}

function getPrDiff(a: z.infer<typeof PR_CONTEXT_NUMBER_ARG_SCHEMA>): string {
  const read = readPullRequestDiff(REPO, prContextNumber(a));
  if (!read.known) mcpFail(read.why);
  // `head`: a diff's first files are the subject of the change. And the cut is now
  // announced in the text rather than being a silent `slice` -- a truncated read
  // that looks complete is how a reviewer concludes a file was not touched.
  return capText(read.diff).text;
}

function listPrs(a: z.infer<typeof LIST_PRS_SCHEMA>): string {
  const state = a.state ?? "open";
  const limit = a.limit ?? 30;
  return JSON.stringify(ghJsonOrThrow("pr", "list", "--repo", REPO, "--state", state, "--limit", String(limit), "--json", "number,title,state,headRefName,baseRefName") ?? []);
}

/**
 * How long to keep waiting out a rate limit before reporting one.
 *
 * GitHub allows ten code searches a minute, which is why this was the most-failed
 * read in the catalog: 30 refusals, all quota, none of them anything the query could
 * have avoided. A 429 names its own wait -- "try again in 2.32s" -- so most of these
 * are two seconds away from succeeding, and the agent was paying an iteration for
 * each one instead.
 *
 * Bounded, because the run holds a runner while it sleeps. Two minutes clears the
 * per-minute limit comfortably; the hourly installation limit it will not clear, and
 * sitting on a runner for an hour to find that out is worse than saying so.
 */
const SEARCH_WAIT_BUDGET_MS = 120_000;

/** The wait GitHub stated, in ms, when it stated one. */
function statedWait(text: string): number | undefined {
  const match = /try again in ([0-9.]+)s/i.exec(text);
  if (!match) return undefined;
  return Math.min(60_000, Math.ceil(Number(match[1]) * 1000));
}

function searchCode(a: z.infer<typeof SEARCH_CODE_SCHEMA>): string {
  const backoff = [5_000, 15_000, 30_000, 60_000];
  let waited = 0;
  for (let attempt = 0; ; attempt += 1) {
    const { code, stdout, stderr } = gh("search", "code", a.query, "--repo", REPO, "--limit", "30");
    if (!code) return capText(stdout).text;
    const text = `${stderr} ${stdout}`;
    // Both shapes GitHub uses: 429 for the per-minute limit, 403 for the installation
    // quota. Anything else is a real failure and is reported as it always was.
    if (!/HTTP 429|rate limit/i.test(text)) mcpFail(stderr || stdout);
    const delay = statedWait(text) ?? backoff[Math.min(attempt, backoff.length - 1)] ?? 60_000;
    if (waited + delay > SEARCH_WAIT_BUDGET_MS) {
      mcpFail(
        `GitHub's code search quota is still exhausted after waiting ${Math.round(waited / 1000)}s, ` +
          "so this search did not run. For code in this repository use search_code, " +
          "which reads the checkout and has no quota. This tool is the one to use for a " +
          "repository that is not checked out, and it will be available again shortly.",
      );
    }
    Bun.sleepSync(delay);
    waited += delay;
  }
}

/**
 * Branch metadata, or a plain report that there is no such branch.
 *
 * The comment below used to describe this as serving "a caller asking whether a
 * branch exists" while the only available answer to that question was a thrown 404.
 * Six calls in the recorded sessions asked about `atomaton/issue-104`, `atomaton/issue-190`
 * and `atomaton/issue-219` before creating them, and each was charged an error for
 * asking. A tool that cannot say "no" makes every correct check look like a fault,
 * and it buries the 404s that ARE faults among them.
 *
 * Only 404 becomes an answer. A 403 or a 500 is still the absence of one, and
 * reporting "this branch does not exist" because GitHub was unreachable would be a
 * confident lie in the one place a caller is deciding whether to create something.
 */
function getBranch(a: z.infer<typeof GET_BRANCH_SCHEMA>): string {
  const found = gh("api", `repos/${REPO}/branches/${a.branch}`);
  if (found.code) {
    const text = `${found.stderr} ${found.stdout}`;
    if (/HTTP 404|Branch not found|Not Found/i.test(text)) {
      return JSON.stringify({ branch: a.branch, exists: false });
    }
    mcpFail(found.stderr || found.stdout);
  }
  // 11,614 bytes to 81. The whole `commit` object -- author, committer, tree,
  // parents, verification and the message -- was 11,164 of it, for a caller asking
  // whether a branch exists and what its head is.
  const branch = (found.stdout ? JSON.parse(found.stdout) : {}) as {
    name?: string;
    commit?: { sha?: string };
    protected?: boolean;
  };
  return JSON.stringify({
    branch: branch.name,
    exists: true,
    sha: branch.commit?.sha,
    protected: branch.protected,
  });
}

function getCheckRuns(a: z.infer<typeof GET_CHECK_RUNS_SCHEMA>): string {
  const d = ghJsonOrThrow<{ check_runs?: unknown[] }>("api", `repos/${REPO}/commits/${a.ref}/check-runs`);
  // `html_url` and not `output`: the summary GitHub puts in `output` is usually
  // empty and never the failure, and the URL is what a reader follows to the log.
  // `details_url` is dropped as a near-duplicate of it.
  return JSON.stringify((d?.check_runs ?? []).map((run) => pick(run, ["name", "status", "conclusion", "html_url"])));
}

function getPrReviews(a: z.infer<typeof PR_CONTEXT_NUMBER_ARG_SCHEMA>): string {
  const d = readPullRequestOrThrow<{ reviews?: unknown[] }>(REPO, prContextNumber(a), "reviews");
  // `reactionGroups`, `includesCreatedEdit` and `authorAssociation` are dropped:
  // nothing an agent does with a review depends on them. Each body is capped on its
  // own, because a count of reviews says nothing about the size of one.
  const reviews = (d?.reviews ?? []).map((review) => {
    const kept = pick(review, ["author", "state", "submittedAt"]);
    const body = (review as { body?: unknown }).body;
    return { ...kept, body: typeof body === "string" ? capText(body, PER_ITEM_BUDGET).text : body };
  });
  // Whole reviews go, not a slice of the JSON: cutting the array mid-string
  // returns text that no longer parses. `omitted` is what stops "not shown" being
  // read as "not there".
  const { kept, omitted } = fitItems(reviews);
  return JSON.stringify({ total: reviews.length, omitted, reviews: kept });
}

/**
 * The inline comments a pull request's review carries.
 *
 * Not `pull-request.ts`'s read, and not a second spelling of it: this is a paginated
 * sub-resource (`pulls/<n>/comments`) — a list of review objects, projected down to
 * where each comment is and what it says. The pull request's own object does not carry
 * them, and its projection is what a caller names fields of rather than a list.
 */
function listPrReviewComments(a: z.infer<typeof PR_CONTEXT_NUMBER_ARG_SCHEMA>): string {
  // Every page, and `?per_page=100` so that "every page" is one or two requests: the
  // cost of this read is the number of requests, not of comments, and the default 30
  // turns a 200-comment pull request into seven of them.
  const comments = ghJsonPagesOrThrow<unknown>(
    "api", `repos/${REPO}/pulls/${prContextNumber(a)}/comments?per_page=100`,
  );
  // The raw REST review comment carries about thirty fields, including a `user`
  // object of roughly a kilobyte to convey one login and a `diff_hunk` repeating
  // code the caller can read from the diff. What acting on a review comment needs
  // is where it is and what it says.
  const projected = comments.map((comment) => {
    const record = (typeof comment === "object" && comment !== null ? comment : {}) as Record<string, unknown>;
    const user = record.user as { login?: unknown } | undefined;
    const body = record.body;
    return {
      author: user?.login,
      path: record.path,
      line: record.line ?? record.original_line,
      in_reply_to: record.in_reply_to_id,
      body: typeof body === "string" ? capText(body, PER_ITEM_BUDGET).text : body,
    };
  });
  const { kept, omitted } = fitItems(projected);
  return JSON.stringify({ total: projected.length, omitted, comments: kept });
}

/** True if `number` is currently closed (used to skip a pointless post-merge re-invocation when native "Closes #N" auto-close already did the job). */
function isIssueClosed(number: number): boolean {
  // `readTargetState`, not a second read of `gh issue view --json state`. That copy
  // looked for the literal `"CLOSED"` and could not tell a merged pull request from a
  // closed one -- the distinction `target-state.ts` exists to make.
  const state = readTargetState(number, REPO);
  return state.known && state.state !== "open";
}


function checkMergeReadiness(a: z.infer<typeof PR_CONTEXT_NUMBER_ARG_SCHEMA>): string {
  const num = prContextNumber(a);
  const { signals, refs } = gatherMergeSignals(REPO, num, mcpFail);
  const headRefName = refs.headRefName;
  const readiness = decideMergeReadiness(signals);

  const dispatched = readiness.needsCiDispatch && headRefName ? dispatchCi(headRefName) : false;

  return JSON.stringify({
    number: num,
    ready: readiness.ready,
    blockers: readiness.blockers,
    // The branch protection this verdict came from, so a refusal is auditable
    // rather than an assertion: `merge_state_status` is GitHub's own evaluation
    // and `required_checks` is what the ruleset currently demands.
    merge_state_status: signals.mergeStateStatus,
    required_checks: signals.requiredChecks,
    checks: signals.checks.map((c) => ({ name: c.name, status: c.status, conclusion: c.conclusion })),
    ci_dispatched: dispatched,
    summary: readiness.ready
      ? "Ready to merge."
      : `Not mergeable:\n${formatBlockers(readiness.blockers)}` +
        (dispatched ? "\n\nCI has been dispatched for the head commit; re-check shortly." : ""),
  });
}

/**
 * Deletes the branch a merged pull request came from.
 *
 * A branch now appears only when a run commits, but an implemented issue still
 * leaves one behind for good, and they accumulate one per issue. Every CHANGE the
 * branch introduced is in the base by the time this runs -- not in the form of the
 * branch's own commits, because the merge commits them under `--merge` and the merge
 * commit's tree is what the base holds, but nothing the branch carried is left out
 * of it.
 *
 * Deleting it is also what lets the next piece of work on the same issue take
 * the plain `atomaton/issue-N` name again: with the merged branch gone, nothing is
 * left to count up from, and the new branch is cut from the base rather than
 * from released history — the same outcome the suffix exists to produce.
 *
 * Never fails the merge. The merge is the outcome the agent was asked for, and a
 * branch that outlives it is untidy, not broken.
 */
function deleteMergedBranch(branch: string): void {
  if (!branch) return;
  const { code, stderr, stdout } = gh("api", "-X", "DELETE", `repos/${REPO}/git/refs/heads/${branch}`);
  if (code) {
    // The merge is done and this does not undo it, but a token that cannot delete
    // a ref is an environment fault -- and this repository accumulated 72 stray
    // branches once already.
    report("warning", `merged, but could not delete the branch ${branch}: ${stderr || stdout}`);
    return;
  }
  log(`mergePr: deleted merged branch ${branch}`);
}

async function mergePr(): Promise<string> {
  // The pull request this run sits on, and nothing else. There is no number
  // argument to name a different one: a merge is irreversible, and the node the
  // run is on is the one thing this run was started for. On an issue run there is
  // no pull request to name — the pull request that delivers this work is merged
  // by the run sitting on it, its reviewer once the checks pass, or the engineer
  // the review sends back.
  if (!isPrRun()) {
    mcpFail(
      "`merge_pr` merges the pull request this run is on and takes no number: the run's own node is the only " +
        "pull request it will merge. This run is on " +
        (isIssueRun() ? `issue #${nodeNumber()}` : "neither an issue nor a pull request") +
        ". A pull request is merged by the run sitting on it — its reviewer once the checks pass, or the engineer the review sends back.",
    );
  }
  const num = nodeNumber();
  if (num === undefined) {
    mcpFail("merge_pr could not read this run's own pull request number (the environment's NUMBER is unset or not a positive integer).");
  }

  // The gate, applied on the path every agent merge takes. The verdict itself is
  // the repository's own branch protection, re-read here rather than restated —
  // see domain/delivery/merge-readiness.ts. It is applied at this call site because an
  // agent merge is made with GITHUB_TOKEN, which the ruleset must exempt in order
  // to let the deployment job publish, so protection alone would not stop it.
  const { signals, refs } = gatherMergeSignals(REPO, num, mcpFail);
  const { headRefName, baseRefName } = refs;
  const readiness = decideMergeReadiness(signals);
  if (!readiness.ready) {
    log(`mergePr: refusing PR #${num} — ${readiness.blockers.map((b) => b.kind).join(", ")}`);
    const dispatched = readiness.needsCiDispatch && headRefName ? dispatchCi(headRefName) : false;
    return JSON.stringify({
      merged: false,
      blockers: readiness.blockers,
      ci_dispatched: dispatched,
      reason: `Not mergeable:\n${formatBlockers(readiness.blockers)}`,
    });
  }

  // A merge commit, so the commit that is released is the commit that was
  // reviewed. Squashing and rebasing both write a NEW commit: the branch's own
  // SHAs never become reachable from the base, which is why a tag on one of them
  // would not deploy (docs/pipeline/how-it-works.md) and why the approval recorded
  // on the pull request is attached to a commit that is not in the tree that ships.
  // The repository is configured to permit only this method -- the ruleset pins it
  // (`allowed_merge_methods`) and the squash and rebase switches are off -- so this
  // flag and that configuration say the same thing and either one alone would be
  // enough. It is passed explicitly because this is the only merge site; a person
  // merging from the web UI is constrained by the ruleset instead.
  const { code, stdout, stderr } = gh("pr", "merge", String(num), "--repo", REPO, "--merge");
  log(`mergePr: gh pr merge rc=${code}, out=${JSON.stringify(stdout)}, err=${JSON.stringify(stderr)}`);
  if (code) mcpFail(`gh pr merge failed (rc=${code}): ${stderr || stdout}`);
  logOp("merge_pr", { number: num });
  deleteMergedBranch(headRefName);

  // Nothing else will: this merge produced no `push` event, because GitHub starts
  // no workflow run for events GITHUB_TOKEN triggers.
  dispatchCd(baseRefName);

  const d = readPullRequestOrThrow<{ body?: string }>(REPO, num, "body");
  const body = d.body ?? "";
  // Prose only: a body quoting either tag in a fenced sample is not carrying it (#304).
  const parentIssue = PARENT_ISSUE_TAG.readProse(body);

  const handoff = decidePostMergeHandoff({
    parentIssue,
    parentAlreadyClosed: parentIssue !== undefined && isIssueClosed(parentIssue),
    originAgent: ORIGIN_AGENT_TAG.readProse(body),
  });

  switch (handoff.kind) {
    case "no-parent":
      // Four different things used to serialise to the identical
      // `{merged: true, closed_issue: null}`: no parent, the parent was already
      // closed, the close failed, and the re-invocation was dispatched instead.
      // Only one of those leaves an issue open that should not be, and it was
      // the one the agent could not see -- the failure went to this server's
      // stderr. `parent_outcome` names which happened.
      return JSON.stringify({ merged: true, closed_issue: null, parent_outcome: "no-parent" });
    case "already-closed":
      log(`mergePr: parent issue #${handoff.parentIssue} already closed -- skipping post-merge re-invocation`);
      return JSON.stringify({
        merged: true,
        closed_issue: null,
        parent_issue: handoff.parentIssue,
        parent_outcome: "already-closed",
        note: "GitHub closed the parent itself, from a \"Closes #N\" line. Nothing further was needed.",
      });
    case "reinvoke-origin-agent":
      if (dispatchPostMergeAgent(REPO, handoff.parentIssue, handoff.agent)) {
        return JSON.stringify({
          merged: true,
          closed_issue: null,
          parent_issue: handoff.parentIssue,
          parent_outcome: "reinvoked",
          reinvoked_agent: handoff.agent,
        });
      }
      // The preferred handoff (re-invoking the origin agent) failed to
      // dispatch -- fall back to closing the parent directly ourselves,
      // same as the "close-directly" case below.
      return await closeParentAndReport(handoff.parentIssue);
    case "close-directly":
      return await closeParentAndReport(handoff.parentIssue);
  }
}

/** closeIssueAndDispatch also triggers phase-gating/aggregation itself. Shared by mergePr()'s "close-directly" case and its "reinvoke failed" fallback. */
async function closeParentAndReport(parentIssue: number): Promise<string> {
  try {
    // Read, not discarded. `closeIssueAndDispatch` stopped throwing when the author
    // is a person: it asks them on the thread and reports success. A caller that
    // ignores the answer therefore reports a parent as closed while it is open --
    // which is the failure this change exists to remove, and discarding the return
    // value here would have moved it rather than fixed it.
    //
    // `continuesChain`, because this fallback is the same conclusion as the
    // re-invocation it replaces: the merge closed this run's own issue, and the
    // aggregation dispatch that may follow is that conclusion continuing -- not work
    // started under the pull request. See `RunnerDispatch.continuesChain`.
    const outcome = JSON.parse(
      await closeIssueAndDispatch({ [ISSUE_NUMBER_ARG]: parentIssue }, { continuesChain: true }),
    ) as {
      close_requested?: number;
    };
    if (outcome.close_requested !== undefined) {
      return JSON.stringify({
        merged: true,
        closed_issue: null,
        parent_issue: parentIssue,
        parent_outcome: "close-requested",
        note: `The pull request merged. Issue #${parentIssue} was opened by a person, so it was not closed -- they have been asked on the thread to close it. Nothing further is needed from you.`,
      });
    }
    return JSON.stringify({
      merged: true,
      closed_issue: parentIssue,
      parent_issue: parentIssue,
      parent_outcome: "closed",
    });
  } catch (e) {
    const why = (e as Error).message ?? String(e);
    log(`mergePr: could not close parent issue #${parentIssue}: ${why}`);
    // The one outcome that leaves work undone. The merge happened, the parent
    // is still open, and nothing is scheduled to close it -- so the caller is
    // told, rather than being handed the same shape as "there was no parent".
    return JSON.stringify({
      merged: true,
      closed_issue: null,
      parent_issue: parentIssue,
      parent_outcome: "close-failed",
      note: `The pull request merged, but issue #${parentIssue} could not be closed: ${why}. It is still open and nothing will retry. Close it with request_close_issue, or report it.`,
    });
  }
}

const { tools: TOOLS, dispatch: rawDispatch } = buildMcpTools([
  defineMcpTool({
    name: "create_sub_issue",
    description: "Create a GitHub issue and link it under the issue THIS RUN is working on, as a child of it. Use this for durable work items and for the sub-issues a decomposition is made of; the new issue is always linked under the current issue and always carries the sub-issue label, and the call is refused on a pull request run and on a run with no current issue. To file an issue that is nobody's child -- a defect in the tools, or a decision somebody has to make -- use create_root_issue. This mutates GitHub and records the operation in Atomaton's audit log.",
    schema: ISSUE_ARGS_SCHEMA,
    handler: createSubIssue,
  }),
  defineMcpTool({
    name: "create_root_issue",
    description: "Create a GitHub issue that is nobody's child: no parent is linked, no sub-issue label is applied, and no aggregation will ever pick it up. Use this to report a defect in the tools or the environment, and to raise a decision that has to be made before there is any work to decompose. Unlike create_sub_issue it may be called on a pull request run, which is where such a report most often originates. Returns {number, url, parent: null, root: true} and mutates GitHub.",
    schema: ISSUE_ARGS_SCHEMA,
    handler: createRootIssue,
  }),
  defineMcpTool({ name: "get_issue", description: "Retrieve one issue's — or, when the number names one, pull request's — title, body, state, labels, timestamps, comment count, and what it is attached to: its parent issue, its sub-issues, and the pull requests that say they close it (each marked merged or not). The result carries `kind` (`issue` or `pull_request`) because the two share one number space, so a read pointed at the other kind still resolves. It does NOT return the comments themselves — use get_issue_comments for those, which takes a range. Returns a JSON object and does not mutate GitHub.", schema: ISSUE_CONTEXT_NUMBER_ARG_SCHEMA, handler: getIssue }),
  defineMcpTool({ name: "list_issues", description: "List issue summaries in the current repository, optionally filtered by state and labels. Use this to discover or scan issues; use get_issue when full body and comments are needed. Returns a JSON array and does not mutate GitHub.", schema: LIST_ISSUES_SCHEMA, handler: listIssues }),
  defineMcpTool({ name: "get_issue_comments", description: "Read a range of one issue's comments, numbered from 1 in the order they were posted. Pass `from` (and optionally `to`) to read exactly the comment a search result pointed at; with no range it returns the last few, and always states which of how many it showed. Each result also carries the issue's title, state, `kind` (`issue` or `pull_request`), parent, and the pull requests that close it, so a comment read on its own is not mistaken for settled work when its pull request is still open. Returns JSON and does not mutate GitHub.", schema: ISSUE_COMMENTS_SCHEMA, handler: getIssueComments }),
  defineMcpTool({ name: "create_pr", description: "Create a pull request from the checked-out Atomaton branch and return its number, URL and base. The base is resolved from the tree and is not yours to choose: a sub-issue's pull request targets its parent's branch, and anything else targets the configured base branch. Call commit_and_push first: this tool requires a clean worktree and exact local/remote HEAD equality, and it never pushes for you. On success it dispatches CI validation -- NOT the reviewer directly: validation runs the checks and then dispatches whichever agent the result calls for, the reviewer when they pass and the engineer when they do not. Read `validation_dispatched`: when it is true the session ends here and you are re-invoked later; when it is false nothing is scheduled and the session stays open for you to act.", schema: CREATE_PR_SCHEMA, handler: createPr }),
  defineMcpTool({ name: "get_pr", description: "Retrieve one pull request's metadata, including state and base/head branches. Use this for PR status and identity; use get_pr_diff or review tools for code and review details. Returns a JSON object and does not mutate GitHub.", schema: PR_CONTEXT_NUMBER_ARG_SCHEMA, handler: getPr }),
  defineMcpTool({ name: "get_pr_diff", description: "Retrieve the unified diff for one pull request. Use this to review code changes; it does not include review conversations. Returns plain diff text and does not mutate GitHub. A large diff is truncated and says so in the text where the cut falls -- if you see that marker, the files after it were NOT shown and you have not seen the whole change.", schema: PR_CONTEXT_NUMBER_ARG_SCHEMA, handler: getPrDiff }),
  defineMcpTool({ name: "list_prs", description: "List pull request summaries in the current repository, optionally filtered by state. Use this to discover PRs; use get_pr for full metadata. Returns a JSON array and does not mutate GitHub.", schema: LIST_PRS_SCHEMA, handler: listPrs }),
  defineMcpTool({ name: "search_remote_code", description: "Search code through GitHub within the current repository. Use this for remote repository text or symbol discovery when local filesystem search is unavailable; do not use it for uncommitted changes. Returns GitHub CLI search text; a long result is truncated and says so where the cut falls.", schema: SEARCH_CODE_SCHEMA, handler: searchCode }),
  defineMcpTool({ name: "get_branch", description: "Retrieve GitHub's branch metadata for an exact branch name, or report that no such branch exists. Use this to inspect remote branch identity and protection information, not local worktree state. A branch that is not there is an answer, not an error: it returns `{branch, exists: false}`, so this is the tool for checking before you create one. When the branch does exist it returns `branch`, `exists`, `sha` and `protected` -- the head commit's SHA, not the commit itself; use get_pr_diff or bash git log for commit content. Does not mutate GitHub.", schema: GET_BRANCH_SCHEMA, handler: getBranch }),
  defineMcpTool({
    name: "sync_branch",
    description: "Synchronize the checked-out branch with its remote counterpart and report ahead/behind status. Use this after a non-fast-forward push failure or before retrying branch publication; it fast-forwards only when safe. It never rebases or force-pushes, and reports diverged branches for explicit resolution. It does NOT bring the base branch in — a branch behind its base is merge_base_into_branch's job.",
    schema: SYNC_BRANCH_SCHEMA,
    handler: syncBranch,
  }),
  defineMcpTool({
    name: "merge_base_into_branch",
    description:
      "Bring this run's base branch into the checked-out branch, as a merge commit, and push it. The base is resolved the way create_pr resolves it: a sub-issue's is its parent's branch, anything else the configured base branch, and a pull request run's is the base the pull request aims at. It takes no arguments and touches no branch but this one: no cascade, no writes to a child's or sibling's branch, no rebase, no force-push. Returns {status: 'up_to_date'} when the base is already an ancestor, {status: 'merged', base, base_sha, commit} after a clean merge, or {status: 'conflicts', base, base_sha, files} — in which case nothing is committed and the conflict markers are left in the worktree: resolve them and call commit_and_push to close the merge. Every outcome is recorded in the ops log.",
    schema: z.object({}),
    handler: mergeBaseIntoBranch,
  }),
  defineMcpTool({ name: "get_check_runs", description: "Retrieve GitHub Actions and other check runs for a commit, branch, or tag. Use this to verify CI status after pushing or before merge decisions. Returns one object per check with `name`, `status`, `conclusion` and `html_url` -- follow the URL for a failing check's log, which is not included. Does not wait for incomplete checks.", schema: GET_CHECK_RUNS_SCHEMA, handler: getCheckRuns }),
  defineMcpTool({
    name: "check_merge_readiness",
    description:
      "Report whether a pull request can be merged right now, and every reason it cannot. Read the `blockers` array rather than assuming a fixed set: kinds include failing, pending and absent required checks, merge conflicts, a branch behind its base, branch protection, draft state, a human author, a change under a governed path, a condition this project declared in `merge.gates`, and merge policy. Call this before merge_pr, and to explain a refused merge. When the only thing missing is a CI run on the head commit, this dispatches CI and says so — re-check afterwards rather than merging blind. Read-only apart from that dispatch.",
    schema: PR_CONTEXT_NUMBER_ARG_SCHEMA,
    handler: checkMergeReadiness,
  }),
  defineMcpTool({ name: "get_pr_reviews", description: "Retrieve submitted review summaries for one pull request. Use this to inspect review decisions and bodies; use list_pr_review_comments for line-level code comments. Returns { total, omitted, reviews } where each review has `author`, `state`, `submittedAt` and `body`; a non-zero `omitted` means the rest did not fit and you have not seen them all. Does not mutate GitHub.", schema: PR_CONTEXT_NUMBER_ARG_SCHEMA, handler: getPrReviews }),
  defineMcpTool({ name: "list_pr_review_comments", description: "Retrieve line-level review comments for one pull request. Use this to find file- and line-specific feedback; use get_pr_reviews for overall review decisions. Returns { total, omitted, comments } where each comment has `author`, `path`, `line`, `in_reply_to` and `body`; the surrounding code is not included, read it with the `read` tool or get_pr_diff, and a non-zero `omitted` means the rest did not fit. Does not mutate GitHub.", schema: PR_CONTEXT_NUMBER_ARG_SCHEMA, handler: listPrReviewComments }),
  defineMcpTool({
    name: "commit_and_push",
    description: "Stage all worktree changes, create one commit, and push the checked-out branch to origin. Use this after validation and before create_pr; do not call it with unrelated or unreviewed changes present. Returns JSON success status and fails rather than rewriting remote history. While a merge is in progress it refuses if any conflicted path is still unresolved, naming them, and closes the merge as a merge commit once they are (the message then records the base that was taken in).",
    schema: COMMIT_AND_PUSH_SCHEMA,
    handler: commitAndPush,
  }),
  defineMcpTool({
    name: "merge_pr",
    description: "Merge the pull request this run is on — it takes no arguments, and the run's own node is the only pull request it will merge; the call is refused when this run is on an issue. Then continues Atomaton's issue handoff. Refuses and returns merged:false with a `blockers` list whenever the PR is not mergeable. The list is open-ended, so read it rather than assuming a fixed set: it covers failing, pending and absent required checks, conflicts, a branch behind its base, branch protection, draft state, a human author, a change under a governed path, a condition this project declared in `merge.gates`, and merge policy. A refusal is a decision or a real defect, never a condition to retry around — read `blockers`, and use check_merge_readiness for detail. On success this may merge the PR, close its linked issue, and dispatch follow-up work.",
    schema: z.object({}),
    handler: mergePr,
  }),
]);

// The tools that hand back an issue, pull request, comment or review body: GitHub
// prose, carrying Atomaton's own state markers, which are not part of any answer an
// agent asked for. See `withoutBookkeeping`.
//
// `get_pr_diff` and `search_code` are deliberately absent. What they return is the
// text under review, where a tag-shaped literal is part of the change rather than a
// note about it -- `src/lib/lib.test.ts` holds one, and stripping it showed a
// reviewer a diff that was not the diff.
//
// `list_issues` and `list_prs` are absent because they return no body at all.
const dispatch = withoutBookkeeping(rawDispatch, [
  "get_issue",
  "get_issue_comments",
  "get_pr",
  "get_pr_reviews",
  "list_pr_review_comments",
]);

async function main(): Promise<void> {
  // Refused at startup, not per call.
  //
  // With `GITHUB_REPOSITORY` unset and a remote URL matching neither prefix,
  // `REPO` stays "" and every tool runs `gh … --repo ""`. Each one then fails
  // with a GitHub error about a malformed repository name, which reads as a
  // broken tool rather than a server that was never told which repository it is
  // for — and it reads that way once per call, for the whole run.
  //
  // `search.ts` already handles the same condition explicitly, and says exactly
  // this. Saying it once, before anything can be called, is the version that
  // costs nothing.
  if (!REPO) {
    log(
      "GITHUB_REPOSITORY is unset and no GitHub remote could be read, so there is no repository to act on. " +
        "Set GITHUB_REPOSITORY, or run where `git remote get-url origin` resolves to a github.com URL.",
    );
    process.exit(1);
  }
  log(`Starting for ${REPO}`);
  await serveMcpServer({ name: "atomaton-github-mcp", version: "1.0.0", tools: TOOLS, dispatch, log });
}

if (import.meta.main) void main();
