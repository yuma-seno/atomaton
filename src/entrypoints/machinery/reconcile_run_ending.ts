#!/usr/bin/env bun
/**
 * reconcile_run_ending.ts — the run watch's reconciliation: notice the run that
 * never wrote its ending, from OUTSIDE the run, and hand the node back.
 *
 * ## Why outside
 *
 * Everything that reports a run's ending is a step INSIDE the run. A run whose
 * runner vanished, that GitHub cancelled or timed out, or that the machinery
 * skipped whole (the `new_event_count == 0` path ends green with every agent step
 * skipped) reaches no step that could write one. The thread's last turn event
 * stays the `asked` that started the run, and the guard — which reads the thread,
 * never the label — keeps deleting what a person writes next, forever, because no
 * run will ever arrive to heal it. Removing the label does not help; the thread is
 * the answer and it still says "an agent holds the turn". That is #252.
 *
 * This script runs in `Atomaton Run Watch`, triggered by `workflow_run: completed`
 * of the three workflows that can take a node's turn: `Atomaton Runner` itself, and
 * the two entry workflows whose runs START a chain. The distinction matters, because
 * GitHub records no run for a CALLED workflow: `Atomaton Entry` and `Atomaton
 * Manual Comment` execute the runner as a reusable workflow, so the first run of
 * every chain — the one a person's command or a new issue starts — exists only as
 * its CALLER's run. Without the callers in the trigger list, a first run that was
 * cancelled or timed out would jam its thread with no watch on it at all — the
 * commonest path a person walks, invisible. The runner's completion, meanwhile,
 * fires only after all of its own steps have finished, so:
 *
 *   - a run that reported (its own result comment, or its failure notice) has the
 *     ending on the thread ALREADY, timestamped at or after the run's start — and
 *     this script reads it and stays silent. That is why the two cannot double-post:
 *     the inside report, when it lands at all, always lands first, and the watch is
 *     the second line of defence for the run whose report never landed — insurance,
 *     not a replacement. The run's colour still belongs to the inside report alone:
 *     it is decided at completion, before any outside step could speak.
 *   - a run that never posted one has the thread stuck at its `asked`, and this
 *     script posts the notice that ends the turn — the same `done` ending the
 *     failure notice uses — and releases the `atomaton/in-progress` label the dead
 *     run left behind.
 *
 * ## The gate
 *
 * One gate for every kind of watched run now (#285): the thread itself says who took
 * the turn and who reported. The watched run's id arrives as `--run-id` — the same
 * value the runner wrote into its claim at start — and the question is the pair:
 *
 *   - a claim with this run's id on it (`atomaton:took`) — this run took a turn;
 *   - an ending with this run's id on it (`atomaton:ended`) — this run reported,
 *     its own result comment or its failure notice, and the thread already holds
 *     the answer. The inside report, when it lands at all, always lands first — the
 *     watch is the second line of defence for the run whose report never landed —
 *     insurance, not a replacement. The run's colour still belongs to the inside
 *     report alone: it is decided at completion, before any outside step could
 *     speak.
 *
 * The notice waits for both halves: claimed and unreported. A run that never
 * claimed — most entry runs, whose ask is the node's body and not a comment — took
 * no turn the thread can name, and stays silent whatever happened to it. That is
 * the estimate-erasing half of #285: the three-condition guess at "was this MY
 * turn" is gone, because the thread now answers it by comparison.
 *
 * The notice itself closes what it reports: it is an ending carrying
 * `answers=<ask> run=<this watch's id>`, so the ask the dead run claimed reads as
 * answered after it, and no later watch — this run's own re-run, or any other —
 * posts the same notice again. Once per ask, which is the whole of #252's residue.
 *
 * ## What it deliberately does not do
 *
 * It does not ask WHY the run went silent (that is #12/#11's ground), does not
 * re-dispatch anything, does not close the issue, and does not change the guard's
 * rule. It posts one notice and, best-effort, removes one label.
 *
 * ## The title
 *
 * A `workflow_run` event carries no inputs, so the node is read out of the
 * watched run's display title. Two shapes arrive — the runner's "`agent` on `#N`"
 * and the entry workflows' "`#N`" — and anything else (old-format titles, runs of
 * unrelated workflows) exits 0 and does nothing: silence on what cannot be read is
 * the safe direction here, because a guessed node would post a notice onto a
 * thread whose run may be fine. An entry run's agent, when the notice needs one,
 * is read off the thread (`mostRecentAgentOn` — the person's command, or the
 * dispatch marker), falling back to `atomaton`, whose command is the one path that
 * always resumes a node.
 *
 * Conclusion `skipped` is silent for the same reason by a different route: the
 * calling job's condition never started the runner, so there is no run here to
 * reconcile. Every other conclusion — success included, which is the green run
 * that finished without reporting — goes through the thread check.
 *
 * ## The exit code
 *
 * This run's colour is its own verdict on ITS OWN work, never a re-statement of
 * the watched run's: the watched run already has its colour, and a red beside a
 * notice that landed would only repeat the news in Notifications. So: silent
 * paths exit 0, a notice that posted exits 0, and the only non-zero exits are the
 * reads and writes this reconciliation could not complete — a thread that cannot
 * be read, a comment GitHub refuses. There the red run is the signal, and the
 * re-run is the recovery, the same as for the watched run itself.
 *
 * The label release is best-effort and never fails the step: the thread — which
 * the notice just healed — is what the guard reads, and the label is only its
 * cache.
 *
 * Usage:
 *   reconcile_run_ending.ts --display-title "agent on #N" | "#N"
 *     [--run-id ID] [--run-url URL] [--conclusion WORD]
 *
 * Requires GITHUB_REPOSITORY (owner/repo) in the environment.
 */
import { parseArgs } from "node:util";
import { gh } from "../../adapters/github/gh.ts";
import { mostRecentAgentOn } from "../../adapters/github/agent-on-issue.ts";
import { endingWalkReaders, readRunWatchThread, readers, type RunWatchThread } from "../../adapters/github/thread.ts";
import { turnHeader } from "../../adapters/github/turn-comment.ts";
import { recoveryLines } from "../../domain/work/comment-command.ts";
import { requestOutstanding } from "../../domain/work/thread.ts";
import { applyTurnLabels } from "./lib/turn-labels.ts";
import {
  askUnanswered,
  endingLeftBy,
  lastEndingComment,
  parseRunTitle,
  releasesLabel,
  turnClaimedBy,
} from "../../domain/work/run-report.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface ReconcileRunEndingArgs {
  /** The triggering run's display title — the runner's "`agent` on `#N`", or an entry run's "`#N`". */
  "display-title": string;
  /**
   * The watched run's id — `github.event.workflow_run.id` — the value the runner
   * wrote into its claim and its ending (#285). Both gates are comparisons against
   * it; an absent or unreadable one lands on silence, the direction every
   * unreadable input here takes.
   */
  "run-id"?: string;
  /** The watched run's URL, for the notice. */
  "run-url"?: string;
  /** The watched run's conclusion; `skipped` means no run happened to reconcile. */
  conclusion?: string;
}

export const ref = defineScript<ReconcileRunEndingArgs>(import.meta.url);

/**
 * The notice a run that never reported leaves behind, addressed to a person.
 *
 * It says what happened, that nothing was decided, and the two ways forward —
 * and it does NOT say the session was saved, because for the deaths this covers
 * that would be a claim nobody made: the report step that would know is the step
 * that never ran. What the run reached is described only as "whatever reached
 * GitHub", which is true of every way a run can stop short.
 *
 * The header tags are the whole of the turn mechanics here: `ended: done` is what
 * changes the thread's last turn event from the dead run's `asked` to a returned
 * turn, which is the unjamming itself — the guard reads this comment, not this
 * script. No `atomaton:agent` tag: like the failure notice, this is not the
 * agent's result comment, and tagging it as one would file it with the runs that
 * reported.
 */
export function missingEndingNotice(
  agent: string,
  runUrl: string,
  identity: { ask: number; watchRunId: number },
): string {
  const lines = [
    ...turnHeader({ ended: "done", audience: "person", answers: identity.ask, run: identity.watchRunId }),
    // The subject is the ASK, not the run (#285): what the reader needs to know is
    // that this request went unanswered — the run that took it up is the how, and
    // the older wording ("the run ended without posting its result") put the run
    // first and read as blame aimed at whatever completed, which the two false
    // notices this replaced had already shown the cost of.
    `Atomaton: this request was taken up, but no answer was posted for it. The run that claimed it was cancelled, lost its runner, timed out, or finished without writing one.`,
    "",
    "Nothing was decided by that run: whatever it reached — commits, pull requests,",
    "saved history — is whatever reached GitHub before it stopped. Its log:",
    runUrl,
    "",
    ...recoveryLines(agent),
  ];
  return lines.join("\n");
}

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      "display-title": { type: "string" },
      "run-id": { type: "string" },
      "run-url": { type: "string" },
      conclusion: { type: "string" },
    },
  });

  const repo = process.env.GITHUB_REPOSITORY ?? "";

  // Nothing ran by design — the caller's own condition skipped the runner — so
  // there is no run here whose ending could be missing.
  if ((values.conclusion ?? "") === "skipped") {
    console.error("reconcile_run_ending: the run was skipped before it started; nothing to reconcile");
    return;
  }

  const title = parseRunTitle(values["display-title"]);
  if (title === undefined) {
    // A run this machinery did not title — the runner's own name before `run-name`
    // existed, or anything else. Silence, said in the log, is the whole action.
    console.error(`reconcile_run_ending: title "${values["display-title"] ?? ""}" names no node; nothing to do`);
    return;
  }

  const { agent: titledAgent, number } = title;
  const watchRunId = Number(values["run-id"]);
  if (!Number.isInteger(watchRunId) || watchRunId <= 0) {
    console.error(
      `reconcile_run_ending: the watched run's id is not readable ("${values["run-id"] ?? ""}"), ` +
        "so whether it took a turn cannot be compared against the thread; nothing to do",
    );
    return;
  }

  // The thread decides, so the thread must be readable. A failed read is the one
  // thing this script refuses to guess past — "no ending" drawn from an unreadable
  // thread would post a notice beside a run that may have reported fine.
  let thread: RunWatchThread;
  try {
    thread = readRunWatchThread(repo, number);
  } catch (error) {
    console.error(`::error::reconcile_run_ending: could not read the thread on #${number}: ${(error as Error).message}`);
    process.exitCode = 1;
    return;
  }

  // The gate, one rule for every watched run (#285): the thread says who took the
  // turn and who reported, both by run id. Claimed and unreported is the whole
  // notice; anything else is silence.
  const claimedAsk = turnClaimedBy(thread.dated, watchRunId, endingWalkReaders);
  if (claimedAsk === undefined) {
    console.error(`reconcile_run_ending: run ${watchRunId} claimed no ask on #${number}; nothing to do`);
    return;
  }
  if (endingLeftBy(thread.dated, watchRunId, endingWalkReaders)) {
    console.error(`reconcile_run_ending: run ${watchRunId} left its ending on #${number}; nothing to do`);
    return;
  }
  if (!askUnanswered(thread.dated, claimedAsk, endingWalkReaders)) {
    // The claim is open on this run's side, but the ask has an answer — a watch
    // that fired earlier, a notice that healed it while this one queued. Saying it
    // again would be the second notice #252's residue is about; silence is the
    // whole action.
    console.error(
      `reconcile_run_ending: the ask run ${watchRunId} claimed on #${number} is already answered; nothing to do`,
    );
    return;
  }

  // The agent the notice names for its recovery lines: the title's for a runner
  // run; off the thread for an entry run — the person's command, or the marker the
  // machinery posted — and `atomaton` when the thread names nobody, whose command
  // is the one path that always resumes a node.
  const agent = titledAgent ?? (mostRecentAgentOn(repo, number) || "atomaton");

  // The ending the run owed. The notice IS that ending — it carries
  // `answers=<claimed ask> run=<this watch>` — so posting it both tells a person
  // and closes the ask, which is what keeps the notice a once-per-ask event.
  // Posted before the label work, because the comment — not the label — is what
  // the guard reads.
  const body = missingEndingNotice(agent, values["run-url"] ?? "", { ask: claimedAsk, watchRunId });
  const posted = gh("issue", "comment", String(number), "--repo", repo, "--body", body);
  if (posted.code !== 0) {
    console.error(`::error::reconcile_run_ending: could not post the notice on #${number}: ${posted.stderr || posted.stdout}`);
    process.exitCode = 1;
    return;
  }
  console.error(`reconcile_run_ending: posted the missing-ending notice on #${number}`);

  // The labels the dead run left, judged by the turn the thread had BEFORE it took
  // the ball — `thread` predates the notice above, so the notice's own ending
  // cannot answer here. The notice gave the node back to a person, so the labels
  // move to `with-person`: the in-progress guard comes off AND the
  // waiting-for-person label goes on (#223) — the crash is the third way a turn
  // reaches a person, and the node must be findable in the filter of work stopped
  // here. The `hasLabel` early return is deliberately gone: a run that fell over
  // before its labels were applied still ends with a person waiting, and the
  // waiting side is what that node is missing. Best-effort: a warning, never a
  // failed step, because the thread is healed and the labels are a cache of an
  // answer the thread now gives.
  if (!releasesLabel(lastEndingComment(thread.dated, endingWalkReaders), endingWalkReaders)) {
    console.error(`reconcile_run_ending: the labels stay on #${number}; the thread's last ending keeps the turn with an agent`);
    return;
  }
  applyTurnLabels("with-person", repo, String(number));
}

if (import.meta.main) main();
