#!/usr/bin/env bun
/**
 * validate_pull_request.ts — runs the repository's CI against an agent's pull
 * request, writes the result where the branch ruleset will look for it, and says
 * who works next.
 *
 * ## Why this exists at all
 *
 * An agent's pull request cannot satisfy a required status check on its own.
 *
 * GitHub changed on 2026-06-11 ("Bot-created pull requests can run workflows if
 * approved"): a workflow triggered by a pull request that the default
 * `GITHUB_TOKEN` created or updated is held for human approval, even on a branch
 * in the same repository. The intent is that generated code should not
 * automatically run workflows that may reach secrets. No setting disables it.
 *
 * So the run that would normally produce the required check sits at
 * `action_required` and never reports. This script dispatches CI itself, waits
 * for it, and republishes its conclusion as a check run the ruleset accepts.
 *
 * ## Two things here look like redundancy and are not
 *
 * **The mirrored check is not a duplicate of the dispatched run's own check.**
 * Both carry the same name on the same commit. Only the mirror satisfies the
 * ruleset: a check derived from a `workflow_dispatch` run does not count toward a
 * required status check, while one created through the Checks API does. Measured
 * with every confounder removed — a human-opened pull request, a fresh commit, no
 * held run, nothing deleted, a successful check on the head commit, still
 * blocked. Delete the mirror and agent pull requests stop merging.
 *
 * **The held `action_required` run must be left alone.** Every agent pull request
 * carries one, it shows as a pending check, and deleting it is the obvious
 * cleanup. Doing so destroys the commit's check rollup permanently: REST goes on
 * reporting the check runs and suites as successful and associated with the pull
 * request while GraphQL reports `statusCheckRollup: null`, and re-running CI does
 * not repair it, because the damage is to the commit rather than to any run.
 * Left in place it is harmless — with the mirror present the pull request reaches
 * `UNSTABLE`, which the ruleset permits.
 *
 * ## Why the waiting happens here rather than in an agent
 *
 * Nothing wakes an agent when CI finishes. A completed run fires `workflow_run`
 * only when the originating event came from something other than `GITHUB_TOKEN`,
 * and neither a bot's `pull_request` (even after approval) nor a
 * `workflow_dispatch` qualifies — the documented `workflow_dispatch` exemption
 * covers creating a run, not its completion. Agents also have no sleep.
 *
 * A workflow job can wait, because a loop inside a live job is not a new trigger.
 * That is the whole reason this sequencing lives in a script the runner calls.
 *
 * ## If GitHub closes this
 *
 * The mechanism is sanctioned — Checks API check runs are how third-party CI
 * reports into a pull request, and `GITHUB_TOKEN` satisfies the app-only
 * restriction because it is an installation token for the github-actions app. The
 * purpose is not: it satisfies a required check for code GitHub held back. The
 * narrowest closure would stop `GITHUB_TOKEN` creating check runs on a commit
 * whose pull request `GITHUB_TOKEN` opened, which would leave third-party CI
 * intact.
 *
 * Two retreats, each giving up something this design keeps:
 *
 * - Drop the required check from the ruleset. Merging then needs only a pull
 *   request, and whether CI passed becomes the reviewer's judgement rather than a
 *   server-side rule — one ruleset no longer governs humans and agents alike.
 * - Give the agent a trusted identity, a GitHub App or a personal access token,
 *   for opening and pushing to the pull request. Nothing is held, so nothing needs
 *   mirroring and no human acts — at the cost of an adoption step, and of
 *   attributing the agent's commits to whoever owns the token.
 *
 * ## The deliverable is checked before CI is asked to run
 *
 * `--deliverable-report` names the file `validate_deliverable.ts` wrote for this
 * pull request. A non-empty one means the pull request would merge a
 * `.github/atomaton/` that cannot start a run, and this script then writes the failing
 * checks and hands it back WITHOUT dispatching CI — there is nothing to learn from
 * running a pipeline against a deliverable that cannot be loaded.
 *
 * Usage:
 *   validate_pull_request.ts --repo owner/name --number N --branch atomaton/issue-N
 *     --workflow ci.yml --reviewer reviewer --engineer engineer
 *     --deliverable-report FILE [--timeout-seconds 1800]
 */
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { contextsPassed, decideValidationOutcome } from "../../domain/work/pr-validation.ts";
import { dispatchWorkflow, gh, ghPaginated } from "../../adapters/github/gh.ts";
import { readBranchRules } from "../../adapters/github/branch-rules.ts";
import { CI_RETRY_TAG, LLM_CONTEXT_TAG, ORIGIN_AGENT_TAG, isQuotation } from "../../adapters/github/tags.ts";
import { latestRequestOn } from "../../adapters/github/thread.ts";
import { hasAgentDefinition } from "./extract_directive.ts";
import { isTrue } from "./lib/flags.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface ValidatePullRequestArgs {
  repo: string;
  number: string;
  branch: string;
  workflow: string;
  /**
   * Directory holding `agent-definitions/*.md`, for resolving the `/<agent>` line
   * the pull request's body carries.
   *
   * A name is only accepted when a definition exists for it, which is the same
   * check an agent's handoff goes through -- so a body that mentions `/engineer`
   * in prose dispatches nobody, and a name with no definition cannot reach
   * `gh workflow run`, where there would be nowhere left to report it.
   */
  "def-dir": string;
  /**
   * File `validate_deliverable.ts` wrote, one problem per line and empty when
   * there are none.
   *
   * A path that does not exist stops the run rather than standing in for "no
   * problems". The step that writes it always writes it, so an absent file means
   * the step did not run — and a validation that did not happen must not be
   * reported as one that passed. Same reasoning as `required.known` below.
   */
  "deliverable-report": string;
  /**
   * Whether a person asked for this run, rather than an agent.
   *
   * It decides who a failed check goes back to, and the two answers differ on
   * purpose: an agent that broke its own pull request fixes it, and a person who
   * asked for a run is owed the answer themselves. See `ValidationInput.askedByPerson`.
   */
  "asked-by-person"?: string;
  /** Defaults to 1800. The job's own `timeout-minutes` is deliberately longer,
   *  so a stall is reported as "no conclusion" here rather than killed there
   *  with nothing written. */
  "timeout-seconds"?: string;
}

export const ref = defineScript<ValidatePullRequestArgs>(import.meta.url);

function log(message: string): void {
  console.error(`[atomaton-validate-pr] ${message}`);
}

export interface RunRef {
  id: number;
  status: string;
  conclusion: string | null;
}

/**
 * Find the dispatched run.
 *
 * `gh workflow run` returns nothing identifying, so the run has to be recognised
 * afterwards. Matching on head SHA rather than branch is what keeps a human's
 * concurrent push to the same branch from being mistaken for this one: that push
 * produces a different commit.
 *
 * `since` excludes runs that already existed, so a previous validation of the
 * same commit cannot be adopted as this one.
 */
export function pickDispatchedRun(
  runs: { id: number; status: string; conclusion: string | null; head_sha: string; created_at: string; event: string }[],
  headSha: string,
  since: string,
): RunRef | undefined {
  const candidates = runs
    .filter((run) => run.event === "workflow_dispatch")
    .filter((run) => run.head_sha === headSha)
    .filter((run) => run.created_at >= since)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const run = candidates[0];
  return run ? { id: run.id, status: run.status, conclusion: run.conclusion } : undefined;
}

/** A CI run as the Actions API reports it, for the question asked of it here. */
interface CiRun {
  id: number;
  status: string;
  conclusion: string | null;
  head_sha: string;
  path: string;
  created_at: string;
  event: string;
}

/**
 * A CI run that already exists for this commit, if one does.
 *
 * CI is dispatched more than once for the same commit. `create_pr` starts a
 * validation, `commit_and_push` starts another, and a person's `/agent` comment
 * starts a third -- and each of those used to run CI again from scratch. The commit
 * has not changed between them, so the verdict cannot have, and the second and third
 * runs bought nothing but runner time.
 *
 * Only `workflow_dispatch` runs are considered, and only the named workflow's. A
 * `pull_request` run sits on the same commit held at `action_required` -- GitHub
 * holds a workflow a bot's pull request triggered -- and adopting it would read the
 * hold as a verdict.
 */
export function findExistingCiRun(runs: CiRun[], workflow: string, headSha: string): RunRef | undefined {
  const candidates = runs
    .filter((run) => run.event === "workflow_dispatch")
    .filter((run) => run.head_sha === headSha)
    .filter((run) => run.path.endsWith(`/${workflow}`))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const run = candidates[0];
  return run ? { id: run.id, status: run.status, conclusion: run.conclusion } : undefined;
}

/**
 * Comments this script has left on the pull request, each marking one hand-back.
 *
 * Exported for its test: the quotation exclusion is the part that is easy to get
 * subtly wrong, and getting it wrong counts the removed text the notice preserves as
 * retries this script never made.
 */
export function countPriorRetries(repo: string, number: string): number {
  // `ghPaginated`, not a `JSON.parse` of the whole stdout: with `--jq`, `gh`
  // evaluates the filter once per page and writes each page's result to the same
  // stream, so past one page the output is back-to-back arrays a whole-output
  // parse refuses. `--jq "[.[].body]"` (not `. [].body`) because a bracketed
  // filter's result is one JSON array per page, which is what `ghPaginated`
  // flattens -- an unbracketed filter prints top-level scalars raw, which is not
  // JSON at all and parses as nothing. The count is the retry bound: a read that
  // silently answers 0 would let the engineer/CI loop run past its bound at a
  // model run per turn.
  try {
    const bodies = ghPaginated<string>("api", `repos/${repo}/issues/${number}/comments`, "--jq", "[.[].body]");
    // The notice quoting a removed comment carries that comment verbatim, and a
    // `ci-retry` marker inside it is the DELETED author's words -- counting it would
    // fire the retry limit early, on a turn the notice's own line says will not be
    // acted on. See `isQuotation`. `hasProse` for the same reason one tag over: a
    // person quoting the marker inside a fenced sample has not asked for a retry
    // (#304).
    return bodies.filter((body) => !isQuotation(body ?? "") && CI_RETRY_TAG.hasProse(body ?? "")).length;
  } catch {
    return 0;
  }
}

/**
 * Leave the engineer what it needs to act, and leave the count its next turn
 * reads.
 *
 * The failing job's URL rather than its log: the engineer can fetch what it wants
 * from there, and pasting a log costs tokens on every retry whether or not the
 * relevant lines are in the part that fits.
 */
function reportFailure(
  repo: string,
  number: string,
  attempt: number,
  runUrl: string,
  summary: string,
  details: readonly string[] = [],
): void {
  // `summary` is also a step output, which is one line by construction, so the list
  // of problems travels here rather than being folded into it. The engineer needs
  // all of them at once: one per round trip costs a model run each.
  const body = [
    LLM_CONTEXT_TAG.write("include"),
    CI_RETRY_TAG.write(attempt),
    `Atomaton: ${summary}`,
    ...(details.length > 0 ? ["", ...details.map((detail) => `- ${detail}`)] : []),
    "",
    runUrl ? `Failing run: ${runUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const posted = gh("issue", "comment", number, "--repo", repo, "--body", body);
  if (posted.code) log(`WARN could not post the failure comment: ${posted.stderr}`);
}

/**
 * Tell the person who asked for this run that CI is actually running, and where to
 * watch it.
 *
 * A person's `/agent` on a pull request is handed to validation, and the wait is
 * minutes long; a person who typed a command and saw nothing happen has no way to
 * tell a queued run from a broken workflow. So validation itself says the one fact
 * that is true while the run goes -- and nothing more. It does not name the agent
 * that will work next, because the result decides that: checks that fail dispatch
 * the engineer who opened the pull request, not the agent the person named. The
 * workflow-side comment this replaces promised the agent unconditionally, and said
 * it even when CI was never going to run -- validation reuses a run that already
 * finished, so its most common case was a promise about a wait that did not exist
 * (#271).
 *
 * Person-asked only. An agent's push already knows its validation is running -- the
 * tool that started it says so in its result -- and a comment on every push would be
 * noise on the thread the agent is working in. A reused completed run says nothing
 * either: the person's own command is the record the run was asked for, the verdict
 * that reuse returns is seconds old, and the agent the verdict dispatches starts
 * seconds later. There is no wait left to describe.
 */
function notifyCiWaiting(repo: string, number: string, askedByPerson: boolean, runUrl: string): void {
  if (!askedByPerson) return;
  const body = [
    LLM_CONTEXT_TAG.write("exclude"),
    `Atomaton: CI is running on this pull request (${runUrl}). Its result decides who works next.`,
  ].join("\n");
  const posted = gh("issue", "comment", number, "--repo", repo, "--body", body);
  if (posted.code) log(`WARN could not post the CI-waiting comment: ${posted.stderr}`);
}

/**
 * Dispatch CI and wait for it, or reuse a run that already exists, returning what
 * it concluded.
 *
 * A run that already exists for this commit is reused rather than duplicated. CI is
 * dispatched more than once for the same commit -- `create_pr`, `commit_and_push`,
 * and a person's `/agent` comment each start a validation -- and each used to run CI
 * again from scratch. The commit has not changed between them, so the verdict cannot
 * have. See `findExistingCiRun`.
 *
 * When there is something to wait for -- a run already going, or one this call
 * dispatched -- it says so through `notifyCiWaiting`, which holds the rules for when
 * that comment is worth a person's thread and when it is noise.
 *
 * A function rather than the body of `main`, so the one caller that must NOT run it
 * — a pull request whose own `.github/atomaton/` is broken — can skip it by not
 * calling it, instead of by an early return that would also skip writing the
 * checks and the comment.
 *
 * An empty `conclusion` means the run timed out, was cancelled, or was never
 * found. That is deliberately not an error here: `decideValidationOutcome` has a
 * verdict for it that dispatches nobody.
 */
function runCiAndWait(
  repo: string,
  number: string,
  workflow: string,
  branch: string,
  headSha: string,
  timeoutSeconds: number,
  askedByPerson: boolean,
): { conclusion: string; runUrl: string } {
  const runUrlFor = (id: number): string => `https://github.com/${repo}/actions/runs/${id}`;

  // Filtered by `head_sha` server-side, because both callers below want only runs on
  // this commit and an unfiltered list is a bounded page: on a busy repository the
  // just-dispatched run is not on the first page, so the poll never finds it and
  // validation reports "no conclusion" and writes a failing check. Asking for the
  // commit is both correct and bounded.
  const listRuns = (): CiRun[] => {
    const listed = gh("api", `repos/${repo}/actions/runs?event=workflow_dispatch&head_sha=${headSha}`).stdout;
    const { workflow_runs = [] } = JSON.parse(listed || "{}") as { workflow_runs?: CiRun[] };
    return workflow_runs;
  };

  // Reuse a CI run that already exists for this commit rather than starting a
  // second one. A cancelled run is not a verdict -- it was superseded, not judged --
  // so it is not reused and CI is dispatched again.
  const existing = findExistingCiRun(listRuns(), workflow, headSha);
  const reusable = existing?.status === "completed" && existing.conclusion && existing.conclusion !== "cancelled";
  if (reusable) {
    log(`reusing CI run ${existing.id} for ${headSha.slice(0, 7)}: ${existing.conclusion}`);
    return { conclusion: existing.conclusion!, runUrl: runUrlFor(existing.id) };
  }

  // A run already going for this commit is waited for rather than duplicated. It is
  // the same commit and the same workflow, so a second run would answer the same
  // question twice.
  const alreadyRunning = existing !== undefined && existing.status !== "completed";
  const since = new Date().toISOString();
  // The person asked for a run and got silence so far; this is where a wait became
  // a fact, so this is where they are told. A reused run never reaches this, which
  // is the point -- see `notifyCiWaiting` for who is told and who is not.
  let notified = alreadyRunning;
  if (alreadyRunning) {
    log(`CI run ${existing.id} is already ${existing.status} for ${headSha.slice(0, 7)}; waiting for it`);
    notifyCiWaiting(repo, number, askedByPerson, runUrlFor(existing.id));
  } else {
    // `dispatchWorkflow` rather than a `gh workflow run` built here. This is the sixth
    // stand-in for the same hole — GitHub starts no workflow run for an event its own
    // token triggered — and the only one that cannot live in `adapters/actions/dispatch-targets.ts`,
    // because it has to RECOGNISE the run it started (see `pickDispatchedRun`: `gh
    // workflow run` returns nothing identifying, so the wait below matches on head sha
    // and start time). What it can share is the call itself.
    //
    // Fatal here, unlike everywhere else that dispatch is best-effort: this function's
    // whole purpose is the verdict CI gives, and there is none without a run.
    if (!dispatchWorkflow(`validate_pull_request: CI for ${branch}`, workflow, ["--repo", repo, "--ref", branch], log)) {
      process.exit(1);
    }
  }

  const deadline = Date.now() + timeoutSeconds * 1000;
  while (Date.now() < deadline) {
    Bun.sleepSync(10_000);
    // A run that was already going is matched by id, not by `since`: it started
    // before this validation did, so `pickDispatchedRun`'s start-time filter would
    // never see it.
    const run = alreadyRunning
      ? listRuns().find((candidate) => candidate.id === existing.id)
      : pickDispatchedRun(listRuns(), headSha, since);
    if (!run) continue;
    // First sight of a run this call dispatched: say where to watch it, while it is
    // still going. A first sighting that is already completed says nothing -- "CI is
    // running" posted after it finished is the same lie the workflow-side comment
    // told -- and the verdict follows within seconds either way.
    if (!notified && run.status !== "completed") {
      notifyCiWaiting(repo, number, askedByPerson, runUrlFor(run.id));
      notified = true;
    }
    if (run.status !== "completed") continue;
    const conclusion = run.conclusion ?? "";
    log(`CI run ${run.id} concluded ${conclusion}`);
    return { conclusion, runUrl: runUrlFor(run.id) };
  }

  log(`no conclusion within ${timeoutSeconds}s`);
  return { conclusion: "", runUrl: "" };
}

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      repo: { type: "string" },
      number: { type: "string" },
      branch: { type: "string" },
      workflow: { type: "string" },
      "def-dir": { type: "string" },
      "deliverable-report": { type: "string" },
      "asked-by-person": { type: "string" },
      "timeout-seconds": { type: "string" },
    },
  });

  const repo = values.repo ?? "";
  const branch = values.branch ?? "";
  const workflow = values.workflow ?? "";
  const defDir = values["def-dir"] ?? "";
  if (!repo || !branch || !workflow || !defDir) {
    console.error("usage: validate_pull_request.ts --repo owner/name --number N --branch B --workflow W --def-dir DIR");
    process.exit(1);
  }

  // Read before anything is decided, and an absent file stops the run. The step
  // that writes it writes it unconditionally, including empty, so absence means the
  // step did not run — and "we did not check" must never be able to look like
  // "there was nothing wrong". Same reasoning as `required.known` below.
  const reportPath = values["deliverable-report"] ?? "";
  if (!reportPath) {
    console.error("usage: validate_pull_request.ts ... --deliverable-report FILE");
    process.exit(1);
  }
  if (!existsSync(reportPath)) {
    log(`cannot validate: no deliverable report at ${reportPath}`);
    process.exit(1);
  }
  const deliverableProblems = readFileSync(reportPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (deliverableProblems.length > 0) {
    log(`the deliverable is inconsistent (${deliverableProblems.length} problem(s)); CI will not be dispatched`);
  }

  const githubOutput = process.env.GITHUB_OUTPUT;
  const write = (line: string): void => {
    if (githubOutput) appendFileSync(githubOutput, `${line}\n`);
  };

  const prJson = gh("api", `repos/${repo}/pulls/${values.number}`).stdout;
  const pr = JSON.parse(prJson || "{}") as { head?: { sha?: string }; base?: { ref?: string } };
  const headSha = pr.head?.sha ?? "";
  const baseRef = pr.base?.ref ?? "";
  if (!headSha) {
    log("could not read the pull request's head SHA");
    process.exit(1);
  }

  // An unknown answer stops the run rather than standing in for "nothing is
  // required". This is the caller that cannot treat the two alike: it mirrors one
  // check run per required context, and `passed` below is `every()` over that
  // list, which is `true` for an empty one. So a failed read would report a
  // FAILING run as passed, suppress the failure comment, and — because that
  // comment is also the retry tally — leave the retry limit that bounds the
  // engineer/CI loop unable to ever fire.
  const required = readBranchRules(repo, baseRef);
  if (!required.known) {
    log(`cannot validate: ${required.why}`);
    process.exit(1);
  }
  const requiredContexts = required.contexts;
  log(`required contexts on ${baseRef}: ${requiredContexts.join(", ") || "(none)"}`);
  if (!required.enforceable) {
    // Not a misconfiguration and not something to fix: a free account cannot have
    // branch rules on a private repository, and this template is meant to be adopted
    // by people who have one. The verdict below is still decided by what CI actually
    // concluded, so a red run still fails, still posts its brief, and still advances
    // the retry tally. What is gone is GitHub refusing the merge -- merge_pr
    // holds that line instead, and says so.
    log(`::notice::${required.why}. Atomaton enforces the CI result itself when merging.`);
  } else if (requiredContexts.length === 0) {
    // A different situation, and worth saying once: the rules ARE readable and
    // require nothing. That is usually a ruleset nobody imported rather than a
    // decision, so it reads as a warning where the case above reads as a notice.
    log(
      `::warning::${baseRef} requires no status checks, so CI results gate nothing here. ` +
        "Import .github/atomaton/rulesets/main.json if that was not intended.",
    );
  }

  // Not dispatched at all when the deliverable itself is inconsistent. CI would
  // either fail for an unrelated-looking reason or pass and say nothing, and the
  // verdict is decided either way: `decideValidationOutcome` reads the problems
  // first and never looks at a conclusion.
  const { conclusion, runUrl } =
    deliverableProblems.length > 0
      ? { conclusion: "", runUrl: "" }
      : runCiAndWait(
          repo,
          values.number ?? "",
          workflow,
          branch,
          headSha,
          Number(values["timeout-seconds"] ?? "1800"),
          isTrue(values["asked-by-person"]),
        );

  // How many times validation already sent this pull request back. Counted from
  // its own comments rather than held anywhere, so it survives a re-dispatch and
  // needs no state of its own.
  const priorRetries = countPriorRetries(repo, values.number ?? "");

  // Read after the wait, so a directive or command posted while CI ran is seen: the
  // thread read answers for the moment the verdict is decided, not the moment the
  // push landed. One read answers both questions the routing asks of the thread --
  // who it asks for (the default, dispatch markers included), and the newest ask a
  // push could answer (markers excluded, with who made it and when). See
  // `latestRequestOn`.
  //
  // The head commit's time rides with them: the push this validation judged produced
  // that commit, so "newer than the ask" is how the verdict below recognises the
  // push as an answer. The SHA was read before the wait, and is the commit CI ran
  // against -- a newer push cancels this validation rather than moving it.
  const threadRequest = latestRequestOn(repo, values.number ?? "", (name) => hasAgentDefinition(name, defDir));
  const headCommittedAt = gh("api", `repos/${repo}/commits/${headSha}`, "--jq", ".commit.committer.date").stdout ?? "";
  const prBody = gh("api", `repos/${repo}/pulls/${values.number}`, "--jq", ".body").stdout ?? "";
  const engineerAgent = ORIGIN_AGENT_TAG.readProse(prBody) ?? "";

  const outcome = decideValidationOutcome({
    conclusion,
    reviewerAgent: threadRequest.newestRequestedAgent,
    engineerAgent,
    askedByPerson: isTrue(values["asked-by-person"]),
    priorRetries,
    deliverableProblems,
    latestAsk: threadRequest.latestAsk,
    headCommittedAt,
  });

  // One check run per required context, all carrying the same conclusion. The list
  // is this script's — it read the ruleset — and the conclusion is the domain's, in
  // one direction: a context passes when the verdict is `passed` and on no other.
  //
  // It used to arrive as a list on the outcome, one entry per context each holding
  // that same answer, and this script then had two places to read it from. It read
  // the wrong one; see `contextsPassed`.
  const conclusionForContexts = contextsPassed(outcome.verdict) ? "success" : "failure";
  for (const check of requiredContexts.map((name) => ({ name, conclusion: conclusionForContexts }))) {
    // The Checks API, not a workflow's own check. See the header: only this form
    // satisfies a required status check for an agent's pull request.
    const created = gh(
      "api",
      "--method",
      "POST",
      `repos/${repo}/check-runs`,
      "-f",
      `name=${check.name}`,
      "-f",
      `head_sha=${headSha}`,
      "-f",
      "status=completed",
      "-f",
      `conclusion=${check.conclusion}`,
    );
    if (created.code) log(`WARN could not write check "${check.name}": ${created.stderr}`);
    else log(`wrote check "${check.name}" as ${check.conclusion}`);
  }

  // Posted whenever CI did not pass, including the turn that gives up: the
  // comment is both the engineer's brief and the tally the next turn counts, and
  // the last one is what tells a human why nothing is moving.
  //
  // Read from the verdict, not re-derived from `checks`. It used to be
  // `checks.every((c) => c.conclusion === "success")`, which is `true` for the
  // empty list a base branch with no required checks produces -- so a failing
  // run posted no comment, the engineer was dispatched with no brief, and the
  // tally that bounds that loop never advanced. See `ValidationOutcome.verdict`.
  if (outcome.verdict !== "passed") {
    reportFailure(repo, values.number ?? "", priorRetries + 1, runUrl, outcome.summary, deliverableProblems);
  }

  write(`next_agent=${outcome.next?.agent ?? ""}`);
  write(`conclusion=${conclusion}`);
  // Whether the verdict this run judged the work `passed`, passed to the dispatch as
  // `--verdict-passed`. The answers-request check reads it when the thread's last
  // event is the dispatched agent's own `returned` verdict: green confirms it (#282 —
  // the same reviewer, the same head, again), red refutes it (the engineer's "done"
  // was wrong about its own push, and the retry must go). The thread cannot carry
  // this — a verdict comment does not name the commit it judged — so the caller that
  // judged it supplies it.
  write(`verdict_passed=${contextsPassed(outcome.verdict)}`);
  write(`summary=${outcome.summary}`);
}

if (import.meta.main) main();
