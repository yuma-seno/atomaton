#!/usr/bin/env bun
/**
 * report_run_failure.ts — Post the comment a failed run leaves behind.
 *
 * ## Why this is a script and not workflow bash
 *
 * It used to be a dozen `echo` lines building markdown inside a TypeScript
 * template literal that generates YAML that becomes bash. Every backtick in that
 * text crosses three layers of escaping, and the text now needs backticks: the
 * two things a person can do next are slash commands, and a slash command written
 * as plain prose reads as prose. Every other human-facing comment in this
 * repository is built here, tested here, and invoked in one line.
 *
 * ## What changed about what it says
 *
 * **The session now survives a failure**. Anyone who has used Atomaton
 * before will assume the opposite, so the notice says it outright and gives the
 * two ways forward — continue with the history, or archive it and start clean.
 * Which of those is right is a judgement about the work, and it belongs to the
 * person rather than to the machinery.
 *
 * ## The exit code is the gate
 *
 * The step this runs in is the run's verdict on its own failure, and the colour is
 * decided by two facts: whether the ending got written, and whose the failure was.
 * An agent failure whose notice posted has said everything there is to say — the
 * comment became the turn ending, and a red run beside it would only repeat that
 * news in Notifications — so that exits 0. A machinery failure is red even once its
 * notice has healed the thread — red is the machinery's signal, and the thread is
 * healed beside it, not instead of it — and a notice that could not be written ends
 * the run red because red is then the only signal left. So this exits 0 only for the
 * first case, and non-zero for the other two. No extra gate step is needed: the
 * step's own failure IS the run's failure.
 *
 * Whose the failure was arrives as `--atoma-failed`, the output "Run agent" writes
 * when atoma's own exit is a failure and nothing else writes. Absent reads as NOT
 * atoma's — the machinery's, wherever it struck — so the notice still posts while
 * the run stays red, and a future rename that loses the output turns every failure
 * red again, which is the conservative direction.
 *
 * ## Where the words come from
 *
 * The prose is `lib/failure-notice.ts`'s, shared with `post_result_comment.ts`,
 * which says the same thing for a run the core filed `failed` — the failures this
 * step never sees, because the step the agent ran in succeeded. Two spellings of
 * "what became of the run and what you can do next" would be two answers free to
 * drift. What is HERE is only the part this caller owns: the turn header, and the
 * person this notice opens by naming.
 *
 * Usage:
 *   report_run_failure.ts --number N --agent NAME [--notify LOGIN]
 *     --run-url URL [--logs-file FILE] [--atoma-failed true]
 *     [--ask ID] [--run-id ID]
 */
import { parseArgs } from "node:util";
import { gh } from "../../adapters/github/gh.ts";
import { turnHeader } from "../../adapters/github/turn-comment.ts";
import { failureLines, logExcerptFrom } from "./lib/failure-notice.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface ReportRunFailureArgs {
  number: string | number;
  agent: string;
  notify?: string;
  "run-url": string;
  "logs-file"?: string;
  /**
   * Whether atoma itself failed — the output "Run agent" writes when its exit is
   * neither success nor the soft stop. Absent or anything but "true" reads as the
   * machinery's, wherever it struck, which is the conservative direction: the
   * notice still posts, and the run stays red. See "The exit code is the gate".
   */
  "atoma-failed"?: string;
  /**
   * The ask this run claimed and its own run id (#285), written onto the ending so
   * the ask is closed by THIS notice: "the request that was taken up was answered by
   * a failure notice", which is what stops the run watch from notifying the same
   * open ask again. Absent reads as `0` — an answer to no ask, the honest record
   * when the run died before it claimed one.
   */
  ask?: string;
  "run-id"?: string;
}

export const ref = defineScript<ReportRunFailureArgs>(import.meta.url);

/** The comment, as the person watching the issue will read it. */
export function failureNotice(
  agent: string,
  notify: string | undefined,
  runUrl: string,
  excerpt: string,
  identity: { ask?: number; runId?: number } = {},
): string {
  const lines = [
    // The turn's ending, through the one place that writes turn headers. A failed run
    // gave the node back to a person -- it is not processing anything -- but without
    // this the node's last turn-changing event stays the `asked` that STARTED the run,
    // and the guard reads that as "the ball is with an agent" and deletes the person's
    // next comment.
    //
    // That is what #90 was: this notice tells the reader to comment `/agent` to
    // continue, and the guard then removed exactly that comment, so the run could only
    // be restarted by hand. `done` is the `returned` ending -- the same one a run that
    // finished and reported gets -- and it is true here.
    //
    // Addressed to a person: it names one and tells them what to do, and the next run
    // can do nothing with it but carry it.
    //
    // No `AGENT_TAG`: this is not the agent's result comment, and tagging it as one
    // would file a failure with the runs that reported, which is the distinction
    // `domain/work/thread.ts` keeps. `turnHeader` writes the two tags this DOES carry
    // and nothing else, which is why the note fits here rather than in the wrapper.
    //
    // The ending carries `answers`/`run` (#285): this notice IS the answer the ask
    // gets — "the run that took this up failed" — and writing the ids here is what
    // makes the ask closed, so the run watch posts its own notice for the same ask
    // never.
    ...turnHeader({
      ended: "done",
      audience: "person",
      answers: identity.ask ?? 0,
      run: identity.runId ?? 0,
    }),
    // Everything below the header, including why it does not say "the run failed".
    ...failureLines({ agent, notify, excerpt, runUrl }),
  ];
  return lines.join("\n");
}

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      number: { type: "string" },
      agent: { type: "string" },
      notify: { type: "string" },
      "run-url": { type: "string" },
      "logs-file": { type: "string" },
      "atoma-failed": { type: "string" },
      ask: { type: "string" },
      "run-id": { type: "string" },
    },
  });

  if (!values.number) {
    // Not an error a comment could answer: a run can fail before the number is
    // known, and there is nowhere to post. Said in the workflow log, where
    // somebody is already looking -- and the non-zero exit is what turns the run
    // red, because there is no comment to convert the failure into.
    console.error("::error::Cannot post failure comment: issue/PR number unknown.");
    process.exitCode = 1;
    return;
  }

  const excerpt = logExcerptFrom(values["logs-file"]);

  const body = failureNotice(values.agent ?? "", values.notify, values["run-url"] ?? "", excerpt, {
    ask: Number(values.ask ?? 0) || 0,
    runId: Number(values["run-id"] ?? 0) || 0,
  });
  const { code, stdout, stderr } = gh("issue", "comment", String(values.number), "--body", body);
  // Green only for an agent failure whose notice landed -- see "The exit code is
  // the gate" above. The other two cases both exit non-zero: the post failed (red
  // is the only signal left), or the failure is the machinery's -- wherever it
  // struck -- and the notice, though posted, healed the thread beside a red run
  // rather than instead of one.
  const atomaFailed = (values["atoma-failed"] ?? "").trim() === "true";
  if (code !== 0) {
    console.error(`Failed to post the failure comment: ${stderr || stdout}`);
    process.exitCode = 1;
  } else if (!atomaFailed) {
    console.error("The machinery failed, not the agent; the notice healed the thread, but the run stays red.");
    process.exitCode = 1;
  }
}

if (import.meta.main) main();
