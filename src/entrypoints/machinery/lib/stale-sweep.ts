/**
 * stale-sweep.ts — the watch's sweep: hand a node back when the run that took its turn is
 * over and nothing released it.
 *
 * ## Why a sweep, and why scheduled
 *
 * Every report a run makes comes from a step INSIDE it, and the outside check for the run
 * that never reported is `Atomaton Run Watch` — which fires on `workflow_run: completed`.
 * GitHub starts no workflow run for an event its own token triggered, and every runner run
 * is dispatched by the machinery with `GITHUB_TOKEN`. So the watch has never seen the runs
 * it exists for: measured over its whole history, every reconciliation it performed was of
 * an ENTRY run, and none of a runner run. The insurance was pointed away from the risk.
 *
 * A schedule does not depend on an event being delivered. It asks the question directly —
 * "which node still holds a lock whose run is over" — over the nodes wearing the
 * in-progress label, which is what a run puts on when it takes the turn and exactly the
 * set a dead run leaves behind.
 *
 * ## What counts as stale
 *
 * `domain/work/stale-lock.ts` is the judgement and `adapters/github/node-lock.ts` is the
 * reads; this module is the loop and the writing. The one thing to keep in view here: the
 * release is the SAME ending the watch posts for a single run — a turn-ending header
 * answering the claim's ask — so every reader that was waiting for an ending (the guard,
 * the aggregation's `parent-busy` check, the next sweep) reads it as one.
 *
 * A park is released the same way and says something different, because it is a different
 * fact: the run did answer (`ended=waiting`), and what never arrived is the collection the
 * aggregation was to perform.
 *
 * ## What it will not do
 *
 * It writes nothing for a node whose lock is fresh, or whose question could not be
 * answered. A sweep with nothing stale makes no writes at all — it reads threads and run
 * statuses and stops, which is what makes it safe to run every fifteen minutes.
 *
 * It also does not end a person's turn for them: a node whose thread holds no claim is not
 * this sweep's, whatever its label says.
 */
import { gh, ghPaginated } from "../../../adapters/github/gh.ts";
import { mostRecentAgentOn } from "../../../adapters/github/agent-on-issue.ts";
import { readNodeLock } from "../../../adapters/github/node-lock.ts";
import { lockOn } from "../../../adapters/github/thread.ts";
import { turnHeader } from "../../../adapters/github/turn-comment.ts";
import { getLabel } from "../../../adapters/runner/config.ts";
import { recoveryLines } from "../../../domain/work/comment-command.ts";
import { applyTurnLabels } from "./turn-labels.ts";

/** How many nodes one sweep looks at. Well past what a repository holds wearing the label. */
const SWEEP_LIMIT = 200;

/**
 * The notice a claim that outlived its run leaves behind.
 *
 * The same shape the watch posts for one run, and the same subject: the ASK. What a reader
 * needs is that this request went unanswered — the run that took it up is the how. The
 * sweep says one more thing the per-run watch does not have to, because it found the node
 * by looking for exactly this: the lock had been standing.
 */
export function staleClaimNotice(agent: string, ask: number, sweepRunId: number): string {
  return [
    ...turnHeader({ ended: "done", audience: "person", answers: ask, run: sweepRunId }),
    "Atomaton: this request was taken up, but no answer was posted for it — and the run that",
    "took it up has finished. The turn had stayed with that run, so nothing was running here.",
    "",
    "Nothing was decided by that run: whatever it reached — commits, pull requests, saved",
    "history — is whatever reached GitHub before it stopped.",
    "",
    ...recoveryLines(agent),
  ].join("\n");
}

/**
 * The notice a park whose collection never came leaves behind.
 *
 * A park is not a silence: the run ended on purpose, inside a child-starting call, and said
 * so. What went missing is the step that was to collect it — the aggregation's
 * re-invocation of the node once its work closed. So this says that, rather than borrowing
 * the "no answer was posted" wording, which would be false here.
 */
export function staleParkNotice(agent: string, ask: number, sweepRunId: number): string {
  return [
    ...turnHeader({ ended: "done", audience: "person", answers: ask, run: sweepRunId }),
    "Atomaton: this node's run parked the turn on the work started under it, and the resume that",
    "was to collect it never arrived. Nothing under this node is still open, and nothing is running here.",
    "",
    ...recoveryLines(agent),
  ].join("\n");
}

/** What one sweep did, for its own log and for the caller's exit code. */
export interface SweepSummary {
  /** Nodes the label listed. */
  readonly examined: number;
  /** Nodes handed back to a person. */
  readonly released: number;
  /** Nodes deliberately left alone. */
  readonly held: number;
  /** Nodes whose question could not be answered. */
  readonly undetermined: number;
  /** Releases that did not take effect when the thread was read again. */
  readonly failed: number;
}

/**
 * The nodes a sweep looks at: open nodes wearing the in-progress label.
 *
 * That label is the run's own claim on the wearer — `manage_turn_labels.ts` writes it when
 * a run takes the turn, off the same `claimed` signal the claim comment is written on — so
 * it is a superset of the nodes whose thread holds a claim, and never misses one. It lags
 * the thread (a run that died before its label step leaves none), which is why the thread
 * decides and this only narrows what to read.
 *
 * Throws when the list cannot be read: enumerating nothing and not being able to enumerate
 * are different answers, and a sweep that treated them the same would report a clean pass
 * over a repository it never looked at.
 *
 * ## Why the REST issues endpoint, and not `gh issue list --label`
 *
 * `gh issue list` with a label goes to the SEARCH API, and the query it builds carries
 * `type:issue` — so pull requests are excluded, and `gh issue list` refuses the qualifier
 * that would change that. Every runner run wears this label on a pull request as readily as
 * on an issue (`atomaton-runner.wac.ts`: "Applies to both issues and PRs"), and a review or
 * engineer run that dies mid-work leaves a claim on a PR — the very shape this sweep exists
 * for, on the node kind with the most runner runs. `repos/{owner}/{repo}/issues` returns
 * both kinds (a PR is an issue with a `pull_request` field), which is how
 * `adapters/github/issue-index.ts` reads the same list. Here the pull requests are wanted,
 * so nothing is filtered out.
 */
function inProgressNodes(repo: string, label: string): number[] {
  const path = `repos/${repo}/issues?state=open&labels=${encodeURIComponent(label)}&per_page=100`;
  let nodes: { number?: number }[];
  try {
    nodes = ghPaginated<{ number?: number }>("api", path);
  } catch (error) {
    throw new Error(`could not list the nodes wearing '${label}': ${(error as Error).message}`);
  }
  return nodes
    .map((node) => Number(node.number))
    .filter((number) => Number.isInteger(number) && number > 0)
    .slice(0, SWEEP_LIMIT);
}

/**
 * Sweep the repository and hand back every node whose lock is stale.
 *
 * Returns the number of releases that could not be verified. The caller decides what that
 * means for its exit code; here it is reported and the sweep carries on, because one node
 * GitHub would not let go of must not stop the others being recovered.
 */
export function sweepStaleLocks(opts: {
  readonly repo: string;
  /** This sweep's own run id, for the endings it writes. `0` outside a run. */
  readonly runId: number;
  /** The instant to judge ages against. Passed in, so a test can name it. */
  readonly nowMs: number;
  readonly log?: (message: string) => void;
}): SweepSummary {
  const log = opts.log ?? ((message: string) => console.error(message));
  const nodes = inProgressNodes(opts.repo, getLabel("in_progress"));
  log(`stale sweep: ${nodes.length} node(s) wearing the in-progress label`);

  let released = 0;
  let held = 0;
  let undetermined = 0;
  let failed = 0;

  for (const number of nodes) {
    let read: ReturnType<typeof readNodeLock>;
    try {
      read = readNodeLock(opts.repo, number, opts.nowMs);
    } catch (error) {
      undetermined += 1;
      log(`stale sweep: could not read #${number}'s thread, so it is left alone: ${(error as Error).message}`);
      continue;
    }

    if (read.verdict === "hold") {
      held += 1;
      continue;
    }
    // The ask the ending must answer: the claim's, or — for a park whose claim a person
    // already took away by hand — the parked ending's own, which is what the aggregation
    // would have answered. A `release` with neither cannot be written, so it is reported as
    // undetermined rather than posted answering ask 0.
    const ask = read.lock.claim?.ask ?? read.lock.park?.answers;
    if (read.verdict === "undetermined" || ask === undefined) {
      undetermined += 1;
      log(`stale sweep: #${number}'s lock is not something this sweep can call; left alone`);
      continue;
    }

    const parked = read.lock.park !== undefined;
    const agent = mostRecentAgentOn(opts.repo, number) || "atomaton";
    const body = parked ? staleParkNotice(agent, ask, opts.runId) : staleClaimNotice(agent, ask, opts.runId);
    const posted = gh("issue", "comment", String(number), "--repo", opts.repo, "--body", body);
    if (posted.code !== 0) {
      failed += 1;
      log(`::error::stale sweep: could not post the ending on #${number}: ${posted.stderr || posted.stdout}`);
      continue;
    }
    released += 1;
    log(`stale sweep: ${parked ? "released a missed park" : "released a dead claim"} on #${number}`);

    // The ending IS the release: it answers the claim's ask, so every reader that was
    // waiting for one stops waiting. Proven, not assumed — a release that did not take
    // effect is a node still locked with a comment on it saying otherwise, which is the
    // worst of the states here. The labels come after, best-effort, on the same rule the
    // per-run watch applies: the thread is the record and the label is its cache.
    // The proof asks the question the judgement answered, not "is any claim open": a comment
    // that arrives between the release and this read is a NEW claim by a new run, and
    // reading that as "the release did not take" would turn a healed node into a red run and
    // skip its label write.
    const answeredLock = read.lock.claim;
    let stillHeld: boolean;
    try {
      const after = lockOn(opts.repo, number).claim;
      stillHeld =
        answeredLock !== undefined
          ? after?.ask === answeredLock.ask && after?.run === answeredLock.run
          : after !== undefined && after.ask === ask;
    } catch (error) {
      failed += 1;
      log(`::error::stale sweep: released #${number} but could not read the thread back to check it: ${(error as Error).message}`);
      continue;
    }
    if (stillHeld) {
      failed += 1;
      log(`::error::stale sweep: #${number} still holds a claim after the ending was posted; this sweep will report it again`);
      continue;
    }
    applyTurnLabels("with-person", opts.repo, String(number));
  }

  log(
    `stale sweep: examined ${nodes.length}, released ${released}, held ${held}, ` +
      `undetermined ${undetermined}, failed ${failed}`,
  );
  return { examined: nodes.length, released, held, undetermined, failed };
}
