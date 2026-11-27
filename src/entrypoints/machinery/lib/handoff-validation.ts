/**
 * handoff-validation.ts — leave the head commit of a pull request a person is handed
 * mergeable, by making sure its required checks exist on that commit.
 *
 * ## Why a handoff has to look at the commit (#632)
 *
 * A required context on the base branch is satisfied only by the check run
 * `validate_pull_request.ts` mirrors onto the head commit: a check derived from a
 * `workflow_dispatch` run does not count toward a ruleset, and GitHub's own
 * `pull_request` run does not either while it sits at `action_required` unapproved.
 * The mirror is written by a validation, and a validation is started by a push, by
 * `create_pr`/`commit_and_push`, or by a person's command — none of which is
 * guaranteed to have covered the commit that is final when a turn ends. In #632 the
 * last push landed after the validation that ran, so no mirror was ever written for
 * the head the pull request ended on. The turn then went to a person over a governance
 * change, and their merge was refused with the required context missing on that head,
 * with nothing left that would create it.
 *
 * `with-person` is where that is catchable, because every way a turn reaches a person
 * passes through `applyTurnLabels` (the runner's release step, a stop, a refused
 * hand-off, the watch healing a dead run). The moment the next actor is a person's
 * merge click is the moment to check the commit they will merge.
 *
 * ## What is checked, and what is left alone
 *
 * The required contexts come from `readBranchRules` — the same read behind the mirror
 * `validate_pull_request.ts` writes and the blocker `merge-readiness.ts` raises — so
 * the list that gets repaired cannot drift from the list that is enforced.
 *
 * Nothing is done to a held `action_required` run. Deleting it damages the commit's
 * check rollup permanently, and approving it re-runs a job whose own check the ruleset
 * does not count; the mirror is what it accepts, so re-posting that is what makes the
 * pull request mergeable. `validate_pull_request.ts`'s header carries both
 * measurements.
 *
 * ## What is skipped
 *
 * A head commit that is about to change is not worth validating: not open, a draft,
 * conflicting, behind its base, or a mergeability GitHub has not computed yet — the
 * set `merge-readiness.ts` calls `CI_WOULD_BE_WASTED`. A required context that is
 * already satisfied is the other side of the same skip: there is nothing to write.
 *
 * ## Nobody is woken
 *
 * The validation is dispatched as neither a person's request nor a claimed ask. The
 * turn is with a person, so when the verdict lands the thread's hold is `with-person`
 * and `decideValidationOutcome` dispatches nobody: what this run is for is the mirror,
 * not an agent.
 *
 * Best effort throughout, like every handoff write. A failure here is a warning and
 * the turn labels still move: a label that did not move reads on the page as a question
 * that never came, which is worse than a mirror written a run later.
 */
import { dispatchPrValidation } from "../../../adapters/actions/dispatch-targets.ts";
import { readBranchRules, type BranchRules } from "../../../adapters/github/branch-rules.ts";
import { ghRead } from "../../../adapters/github/gh.ts";
import { readPullRequest } from "../../../adapters/github/pull-request.ts";
import type { NodeKind } from "../../../domain/work/work-tree.ts";
import { isBranchName, prHead } from "./pr-head-branch.ts";

/** Conclusions that satisfy a required check. Skipped and neutral are not failures. */
const PASSING = new Set(["success", "neutral", "skipped"]);

/**
 * The merge verdicts in which the head commit is the one a person will merge.
 *
 * `CLEAN` and `UNSTABLE` are GitHub saying the commit itself is mergeable; `BLOCKED`
 * is the verdict this file exists for, because a required context missing (or held) on
 * the commit reads exactly like that. Everything else — `DIRTY`, `BEHIND`, `DRAFT`,
 * `HAS_HOOKS`, or a verdict this file has never seen — means the commit is going to
 * change first, so any check written now would be written on the wrong commit.
 */
const COMMIT_IS_FINAL = new Set(["CLEAN", "UNSTABLE", "BLOCKED"]);

/** A check run on the head commit, reduced to what this decision reads. */
export interface HandoffCheckRun {
  name: string;
  /** GitHub `status`: queued | in_progress | completed. */
  status: string;
  /** GitHub `conclusion`, null while incomplete. */
  conclusion: string | null;
}

/** Everything the decision below is made of, read from GitHub by the caller. */
export interface HandoffSignals {
  kind: NodeKind;
  /** GitHub's `state` for the pull request: `OPEN`, `CLOSED` or `MERGED`. */
  state: string;
  isDraft: boolean;
  /** GitHub's computed merge state, as `gh pr view --json mergeStateStatus` reports it. */
  mergeStateStatus: string;
  required: BranchRules;
  checks: readonly HandoffCheckRun[];
}

/**
 * Whether a validation has to run before this pull request is left to a person.
 *
 * Pure: everything it reads is a fact about the pull request, so the skip conditions
 * are testable without a repository. `why` is always filled in — a handoff that does
 * nothing should still say so in the run's log, because the interesting failures here
 * are the ones that look like nothing happened.
 */
export function handoffValidationNeeded(signals: HandoffSignals): { dispatch: boolean; why: string } {
  if (signals.kind !== "pull-request") {
    return { dispatch: false, why: "the node is an issue, which nothing merges" };
  }
  const state = (signals.state ?? "").toUpperCase();
  if (state !== "OPEN") {
    return { dispatch: false, why: `the pull request is ${state ? state.toLowerCase() : "in an unknown state"}, not open` };
  }
  if (signals.isDraft) return { dispatch: false, why: "the pull request is a draft" };
  const mergeState = (signals.mergeStateStatus ?? "").toUpperCase();
  if (!COMMIT_IS_FINAL.has(mergeState)) {
    return {
      dispatch: false,
      why: `GitHub reports ${mergeState || "no merge state"}, so the head commit will change before it is merged`,
    };
  }

  const { required } = signals;
  if (!required.known) {
    return { dispatch: false, why: `the required contexts on the base branch could not be read (${required.why})` };
  }
  if (!required.enforceable) return { dispatch: false, why: "this repository cannot require status checks" };
  if (required.contexts.length === 0) {
    return { dispatch: false, why: "the base branch requires no status checks" };
  }

  const byName = new Map(signals.checks.map((check) => [check.name, check]));
  const unsatisfied = required.contexts.filter((context) => {
    const run = byName.get(context);
    return run === undefined || run.status !== "completed" || !PASSING.has((run.conclusion ?? "").toLowerCase());
  });
  if (unsatisfied.length === 0) {
    return { dispatch: false, why: `every required context has passed on the head commit (${required.contexts.join(", ")})` };
  }
  return {
    dispatch: true,
    why:
      `required context${unsatisfied.length === 1 ? "" : "s"} not satisfied on the head commit: ` +
      unsatisfied.join(", "),
  };
}

function log(message: string): void {
  console.error(`[atomaton-handoff] ${message}`);
}

/**
 * The pull request fields this check reads.
 *
 * One read for the commit, the verdict on it and the branch — the three facts that
 * decide both the skip and the dispatch. `headRefName` and `isCrossRepository` are here
 * rather than in `resolvePrHeadBranch`'s own read because the branch is only needed on
 * the dispatch path, and that path already exists here.
 */
interface HandoffView {
  headRefOid?: string;
  headRefName?: string;
  isCrossRepository?: boolean;
  baseRefName?: string;
  isDraft?: boolean;
  state?: string;
  mergeStateStatus?: string;
}

/**
 * Leave `number` mergeable before its turn reaches a person.
 *
 * Called from `applyTurnLabels` for the `with-person` phase, so it runs on every path
 * a turn takes to a person. Never throws: the labels are what the caller is there for.
 */
export function ensureMergeableAtHandoff(kind: NodeKind, repoArg: string, number: string): void {
  try {
    ensure(kind, (repoArg ?? "").trim(), number);
  } catch (e) {
    log(`WARN could not check the head commit before the handoff: ${(e as Error).message}`);
  }
}

function ensure(kind: NodeKind, repoArg: string, number: string): void {
  if (kind !== "pull-request") return;

  // The runner's release step names no repository: it runs in this repository's own
  // checkout, where `gh` fills `{owner}/{repo}` in from the remote. Every read here
  // names one, so the environment's answer is taken when the caller had none.
  const repo = repoArg || (process.env.GITHUB_REPOSITORY ?? "").trim();
  if (!repo) {
    log("WARN cannot check the head commit before the handoff: no repository is named");
    return;
  }

  const read = readPullRequest<HandoffView>(repo, Number(number), [
    "headRefOid",
    "headRefName",
    "isCrossRepository",
    "baseRefName",
    "isDraft",
    "state",
    "mergeStateStatus",
  ]);
  if (!read.known) {
    log(`WARN could not read the pull request before the handoff: ${read.why}`);
    return;
  }
  const view = read.value;
  const headSha = (view.headRefOid ?? "").trim();
  if (!headSha) {
    log("WARN could not check the head commit before the handoff: the pull request reports no head commit");
    return;
  }

  const decision = handoffValidationNeeded({
    kind,
    state: view.state ?? "",
    isDraft: view.isDraft === true,
    mergeStateStatus: view.mergeStateStatus ?? "",
    required: readBranchRules(repo, (view.baseRefName ?? "").trim()),
    checks: readChecks(repo, headSha),
  });
  if (!decision.dispatch) {
    log(decision.why);
    return;
  }
  log(`${decision.why}; dispatching a validation so the mirror lands on ${headSha.slice(0, 7)}`);

  // The same three gates a `pr` run puts a head branch through before checking it out
  // (`lib/pr-head-branch.ts`). The `origin` read is deliberately not repeated: the
  // pull request is open, so its head branch is one this repository has, and the case
  // that read protects against — a branch deleted under a live pull request — is one
  // where dispatching nothing leaves the commit exactly as it is.
  const head = prHead({ headRefName: view.headRefName, isCrossRepository: view.isCrossRepository });
  if (head.crossRepository) {
    log("WARN the head is a fork's branch, not a branch of this repository; nothing was dispatched");
    return;
  }
  if (!isBranchName(head.branch)) {
    log(`WARN '${head.branch}' is not a branch name this repository can use; nothing was dispatched`);
    return;
  }

  if (dispatchPrValidation(repo, Number(number), head.branch)) {
    log(`dispatched validation for #${number} at the handoff, so the required check reaches ${headSha.slice(0, 7)}`);
  }
}

/**
 * The check runs GitHub reports for a commit.
 *
 * A read that fails answers with no runs, which the decision above reads as "not
 * satisfied" and dispatches validation for. That is the opposite direction from the
 * rest of this codebase on purpose: a duplicate validation costs one waiting job and
 * is reused by `validate_pull_request.ts` (`findExistingCiRun`), while the other
 * direction hands a person the #632 merge again with nothing running that would fix
 * it. The read is retried by `ghRead` before it gets here, so only a real outage
 * reaches this.
 */
function readChecks(repo: string, sha: string): HandoffCheckRun[] {
  const { code, stdout, stderr } = ghRead("api", `repos/${repo}/commits/${sha}/check-runs?per_page=100`);
  if (code) {
    log(`WARN could not read the check runs on ${sha.slice(0, 7)}: ${stderr || stdout}`);
    return [];
  }
  try {
    const { check_runs = [] } = JSON.parse(stdout || "{}") as {
      check_runs?: { name?: string; status?: string; conclusion?: string | null }[];
    };
    return check_runs.map((run) => ({
      name: run.name ?? "",
      status: run.status ?? "",
      conclusion: run.conclusion ?? null,
    }));
  } catch {
    log(`WARN the check runs on ${sha.slice(0, 7)} were not JSON`);
    return [];
  }
}
