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
 * Whose the failure was arrives as `--atoma-reached`, the output "Run agent" writes
 * at the machinery/agent boundary and nothing else writes. Absent reads as NOT
 * reached — a future rename that loses the output turns every failure red again,
 * which is the conservative direction.
 *
 * ## Why the excerpt is last
 *
 * It is usually about the infrastructure — "MCP server closed connection",
 * "Unexpected while resolving package" — which no agent and often no person can
 * act on. It is kept because occasionally it is the answer, and put below the
 * part that always matters.
 *
 * Redacted before it becomes a comment: the log holds every MCP server's stderr,
 * and `unauthorized` is exactly the line a provider emits WITH the credential in
 * it. Actions masks registered secrets in the workflow log and does nothing for
 * an issue comment.
 *
 * Usage:
 *   report_run_failure.ts --number N --agent NAME [--notify LOGIN]
 *     --run-url URL [--logs-file FILE] [--atoma-reached true]
 */
import { existsSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { gh } from "../../adapters/github/gh.ts";
import { redact } from "../../shared/redaction.ts";
import { turnHeader } from "../../adapters/github/turn-comment.ts";
import { mentionPrefix } from "../../domain/work/mention.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface ReportRunFailureArgs {
  number: string | number;
  agent: string;
  notify?: string;
  "run-url": string;
  "logs-file"?: string;
  /**
   * Whether the machinery reached `atoma run` — the output "Run agent" writes at
   * the machinery/agent boundary. Absent or anything but "true" reads as NOT
   * reached, which is the conservative direction: the machinery failed first, the
   * notice still posts, and the run stays red. See "The exit code is the gate".
   */
  "atoma-reached"?: string;
}

export const ref = defineScript<ReportRunFailureArgs>(import.meta.url);

/** Lines from the run's log that might say what went wrong. */
const INTERESTING = /error|fail|panic|exception|unauthorized/i;
const EXCERPT_LINES = 5;

/**
 * The excerpt, redacted, or nothing.
 *
 * Silent on every failure. The notice is the thing that has to go out; an excerpt
 * is an improvement to it, not a precondition for it.
 */
export function logExcerpt(text: string): string {
  return text
    .split("\n")
    .filter((line) => INTERESTING.test(line))
    .slice(0, EXCERPT_LINES)
    .map((line) => redact(line))
    .join("\n")
    .trim();
}

/** The comment, as the person watching the issue will read it. */
export function failureNotice(
  agent: string,
  notify: string | undefined,
  runUrl: string,
  excerpt: string,
): string {
  const mention = mentionPrefix(notify);
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
    ...turnHeader({ ended: "done", audience: "person" }),
    // No "the run failed": the run's colour is decided by whether THIS comment
    // posted. A notice that landed leaves the run green, and "the run failed"
    // underneath it would contradict the run the reader can see.
    `${mention}Atomaton: \`${agent}\` did not finish.`,
    "",
    "**The session was saved.** What this run worked out is still there.",
    "",
    `- Continue: comment \`/${agent}\` and put what to do next on the following lines.`,
    `- Start clean: comment \`/${agent} recover\`, which archives this session and rebuilds`,
    "  it from the issue.",
    "",
    `Workflow logs: ${runUrl}`,
  ];
  if (excerpt) {
    lines.push("", "From the log, which is often about the infrastructure rather than the work:", "```", excerpt, "```");
  }
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
      "atoma-reached": { type: "string" },
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

  let excerpt = "";
  const logs = values["logs-file"];
  if (logs && existsSync(logs)) {
    try {
      excerpt = logExcerpt(readFileSync(logs, "utf8"));
    } catch {
      excerpt = "";
    }
  }

  const body = failureNotice(values.agent ?? "", values.notify, values["run-url"] ?? "", excerpt);
  const { code, stdout, stderr } = gh("issue", "comment", String(values.number), "--body", body);
  // Green only for an agent failure whose notice landed -- see "The exit code is
  // the gate" above. The other two cases both exit non-zero: the post failed (red
  // is the only signal left), or the machinery failed first and the notice, though
  // posted, healed the thread beside a red run rather than instead of one.
  const atomaRan = (values["atoma-reached"] ?? "").trim() === "true";
  if (code !== 0) {
    console.error(`Failed to post the failure comment: ${stderr || stdout}`);
    process.exitCode = 1;
  } else if (!atomaRan) {
    console.error(
      "The machinery failed before the agent started; the notice healed the thread, but the run stays red.",
    );
    process.exitCode = 1;
  }
}

if (import.meta.main) main();
