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
 * of `Atomaton Runner` itself. The runner's completion fires only after all of its
 * own steps have finished, so:
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
 * ## What it deliberately does not do
 *
 * It does not ask WHY the run went silent (that is #12/#11's ground), does not
 * re-dispatch anything, does not close the issue, and does not change the guard's
 * rule. It posts one notice and, best-effort, removes one label.
 *
 * ## The title
 *
 * A `workflow_run` event carries no inputs, so the node is read out of the
 * runner's `run-name` ("`agent` on `#N`", its display title). Anything the title
 * reader does not recognise — the runner's own name before `run-name` existed, a
 * title GitHub or another workflow wrote — exits 0 and does nothing: silence on
 * what cannot be read is the safe direction here, because a guessed node would
 * post a notice onto a thread whose run may be fine.
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
 *   reconcile_run_ending.ts --display-title "agent on #N"
 *     [--run-started-at ISO] [--run-url URL] [--conclusion WORD]
 *
 * Requires GITHUB_REPOSITORY (owner/repo) in the environment.
 */
import { parseArgs } from "node:util";
import { gh, ghRead, ghPaginated } from "../../adapters/github/gh.ts";
import { getLabel } from "../../adapters/runner/config.ts";
import { endingWalkReaders } from "../../adapters/github/thread.ts";
import { turnHeader } from "../../adapters/github/turn-comment.ts";
import { recoveryLines } from "../../domain/work/comment-command.ts";
import {
  lastEndingComment,
  needsEnding,
  parseRunTitle,
  releasesLabel,
  type DatedComment,
} from "../../domain/work/run-report.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface ReconcileRunEndingArgs {
  /** The triggering run's display title — `run-name`, which the runner sets to "`agent` on `#N`". */
  "display-title": string;
  /** When the watched run started running; endings before it are earlier turns'. */
  "run-started-at"?: string;
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
export function missingEndingNotice(agent: string, runUrl: string): string {
  const lines = [
    ...turnHeader({ ended: "done", audience: "person" }),
    `Atomaton: \`${agent}\`'s run ended without posting its result. It was cancelled, lost its runner, timed out, or finished without reporting one.`,
    "",
    "Nothing was decided by that run: whatever it reached — commits, pull requests,",
    "saved history — is whatever reached GitHub before it stopped. Its log:",
    runUrl,
    "",
    ...recoveryLines(agent),
  ];
  return lines.join("\n");
}

/** Whether the issue currently carries a label, said either way when the read fails. */
function hasLabel(repo: string, number: number, label: string): boolean {
  const read = ghRead("api", `repos/${repo}/issues/${number}`, "--jq", "[.labels[].name]");
  if (read.code !== 0) {
    console.error(`Warning: could not read #${number}'s labels, so the stale label is not touched: ${read.stderr || read.stdout}`);
    return false;
  }
  try {
    return (JSON.parse(read.stdout || "[]") as string[]).includes(label);
  } catch {
    console.error(`Warning: #${number}'s labels were not readable as a list, so the stale label is not touched`);
    return false;
  }
}

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      "display-title": { type: "string" },
      "run-started-at": { type: "string" },
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

  const { agent, number } = title;

  // The thread decides, so the thread must be readable. A failed read is the one
  // thing this script refuses to guess past — "no ending" drawn from an unreadable
  // thread would post a notice beside a run that may have reported fine.
  let comments: DatedComment[];
  try {
    comments = ghPaginated<{ body?: string; created_at?: string }>(
      "api", `repos/${repo}/issues/${number}/comments`,
    ).map((comment) => ({ body: comment.body ?? "", createdAt: comment.created_at ?? "" }));
  } catch (error) {
    console.error(`::error::reconcile_run_ending: could not read the thread on #${number}: ${(error as Error).message}`);
    process.exitCode = 1;
    return;
  }

  if (!needsEnding(comments, values["run-started-at"], endingWalkReaders)) {
    console.error(`reconcile_run_ending: the run on #${number} posted its ending; nothing to do`);
    return;
  }

  // The ending the run owed. Posted before the label work, because the comment —
  // not the label — is what the guard reads: this is the step that unjams the
  // thread, and the label is only the cache beside it.
  const body = missingEndingNotice(agent, values["run-url"] ?? "");
  const posted = gh("issue", "comment", String(number), "--repo", repo, "--body", body);
  if (posted.code !== 0) {
    console.error(`::error::reconcile_run_ending: could not post the notice on #${number}: ${posted.stderr || posted.stdout}`);
    process.exitCode = 1;
    return;
  }
  console.error(`reconcile_run_ending: posted the missing-ending notice on #${number}`);

  // The label the dead run left, judged by the turn the thread had BEFORE it took
  // the ball — `comments` predates the notice above, so the notice's own ending
  // cannot answer here. Best-effort: a warning, never a failed step, because the
  // thread is healed and the label is a cache of an answer the thread now gives.
  const label = getLabel("in_progress");
  if (!hasLabel(repo, number, label)) return;
  if (!releasesLabel(lastEndingComment(comments, endingWalkReaders), endingWalkReaders)) {
    console.error(`reconcile_run_ending: '${label}' stays on #${number}; the thread's last ending keeps the turn with an agent`);
    return;
  }
  const removed = gh("issue", "edit", String(number), "--repo", repo, "--remove-label", label);
  if (removed.code !== 0) {
    console.error(`Warning: could not remove '${label}' from #${number}: ${removed.stderr || removed.stdout}`);
  }
}

if (import.meta.main) main();
