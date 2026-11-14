#!/usr/bin/env bun
/**
 * report_cancelled_run.ts — the one inside report a CANCELLED run leaves.
 *
 * ## Why cancellation needs its own writer
 *
 * Everything that reports a run's ending reads `steps.atoma.outcome`, and the two
 * values it reports on are `success` and `failure`. A cancellation is neither: the
 * runner is stopped under the run — a person's cancel, a workflow-level timeout —
 * and "Post result comment" is gated off, on the reasoning that a person who stopped
 * a run on purpose should not be told the run died. What that gate also silences is
 * the CLAIM: the run took the turn at start, and a cancellation leaves that claim
 * standing with nothing coming to answer it. The stale claim then reads as "an agent
 * holds the turn" to every reader — the guard deletes what a person writes next,
 * a validation's verdict refuses to dispatch — and no run will ever arrive to heal
 * it, because the only writer left was the sweep.
 *
 * So a cancelled run closes its own claim here, from inside, before the machinery
 * takes it apart. The ending is `stopped` — the tag's own verb for "the run stopped,
 * the turn came back" — answering the ask the run claimed, naming the run. The
 * thread's newest word becomes the handback, and every reader agrees on something
 * true. Nothing is decided by the run: whatever it reached before the stop is what
 * exists, and the text says so rather than implying a report.
 *
 * ## What this does NOT cover
 *
 * A run whose runner vanished without a cancellation — GitHub losing the runner
 * mid-job. Nothing inside runs there either, but the machinery recovers by read:
 * `latestRequestOn` and `claim_turn` now judge a claim by its RUN (the judgement
 * `domain/work/stale-lock.ts` has always made) and treat a finished run's claim as
 * dead, so a person's next command simply works. See `adapters/github/thread.ts`'s
 * `latestRequestOn` for the heal-on-read half and the run watch's history for why
 * the outside sweep that used to do this job is gone.
 *
 * Usage: report_cancelled_run.ts --number N --agent AGENT --ask ID --run-id ID
 */
import { parseArgs } from "node:util";
import { gh } from "../../adapters/github/gh.ts";
import { turnCommentBody } from "../../adapters/github/turn-comment.ts";
import { recoveryLines } from "../../domain/work/comment-command.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface ReportCancelledRunArgs {
  number: string | number;
  agent: string;
  /** The ask this run claimed; `0` when it claimed none, which writes an answer to nothing. */
  ask?: string;
  "run-id"?: string;
}

export const ref = defineScript<ReportCancelledRunArgs>(import.meta.url);

export function cancelledNotice(agent: string): string[] {
  return [
    "Atomaton: this run was stopped — cancelled from outside — and it posted no report.",
    "Nothing was decided by it: whatever it reached — commits, pull requests, saved",
    "history — is whatever reached GitHub before the stop.",
    "",
    ...recoveryLines(agent),
  ];
}

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      number: { type: "string" },
      agent: { type: "string" },
      ask: { type: "string" },
      "run-id": { type: "string" },
    },
  });

  if (!values.number || !values.agent) {
    console.error("usage: report_cancelled_run.ts --number N --agent AGENT [--ask ID] [--run-id ID]");
    process.exit(2);
  }

  // A turn comment, unlike the limit notice: this one closes the claim the run took
  // at start, which is exactly what no other writer does on this path. The ending
  // carries the ask and the run id — the turn's identity closing (#285) — so the
  // thread's fold releases the claim instead of leaving it standing.
  const body = turnCommentBody({
    ended: "stopped",
    audience: "person",
    agent: values.agent,
    answers: Number(values.ask ?? 0) || 0,
    run: Number(values["run-id"] ?? 0) || 0,
    body: cancelledNotice(values.agent).join("\n"),
  });

  // The header carries `llm-context=exclude` already: this is addressed to the person
  // who stopped the run, and the next run can do nothing with it but carry it.
  const posted = gh("issue", "comment", values.number, "--body", body);
  if (posted.code !== 0) {
    // A comment that did not land leaves the claim standing — the exact state this
    // change exists to remove, with nobody coming to heal it — and the step is the
    // last chance the job has to say so. Red is the signal the thread was denied; the
    // job's own log is where the reason has to be, because the thread got nothing.
    console.error(
      `::error::could not post the cancelled run's ending on #${values.number}: ` +
        `${posted.stderr || posted.stdout}`,
    );
    process.exitCode = 1;
  }
}

if (import.meta.main) main();
