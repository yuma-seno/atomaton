/**
 * failure-notice.ts — the words a failed run leaves on its thread.
 *
 * Two machinery scripts speak for a run that failed, and they are one event:
 *
 *   - `report_run_failure.ts`, for a "Run agent" step that exits non-zero. The step
 *     failed, so nothing later in the run posts anything.
 *   - `post_result_comment.ts`, for a run the core filed `failed` that has nothing of
 *     its own to show. That step SUCCEEDED, so the failure notice above never runs —
 *     which is #441: a session died on its context budget, the core recorded `failed`,
 *     the last assistant turn was a tool call, no tool had recorded an ending, and the
 *     thread received nothing at all. No comment, no `atomaton:ended` tag to release
 *     the thread's guard, and a person had to open the run and read its log to learn
 *     that anything had happened.
 *
 * The sentence a person needs is the same in both cases — what became of the run, that
 * its session survived, and the two ways forward — so it is written once here and both
 * callers use it. A second copy would be a second answer to "what do I do now", free to
 * drift from this one.
 */
import { existsSync, readFileSync } from "node:fs";
import { recoveryLines } from "../../../domain/work/comment-command.ts";
import { mentionPrefix } from "../../../domain/work/mention.ts";
import { redact } from "../../../shared/redaction.ts";

/**
 * Lines from the run's log that might say what went wrong.
 *
 * `warn` is here because the reason often arrives as one rather than as an error: the
 * run #441 was filed on left two WARN lines about its context budget and nothing else,
 * so an excerpt keyed to errors alone was empty in exactly the case it was needed.
 */
const INTERESTING = /error|fail|panic|exception|unauthorized|warn/i;

/** A comment is not a log viewer. */
const EXCERPT_LINES = 5;

/**
 * The excerpt, redacted, or nothing.
 *
 * The LAST matching lines rather than the first: a log opens with start-up chatter and
 * ends with why it stopped, so the tail is the part that answers the question.
 *
 * Silent on every failure. The notice is the thing that has to go out; an excerpt is an
 * improvement to it, not a precondition for it.
 */
export function logExcerpt(text: string): string {
  return text
    .split("\n")
    .filter((line) => INTERESTING.test(line))
    .slice(-EXCERPT_LINES)
    .map((line) => redact(line))
    .join("\n")
    .trim();
}

/** The excerpt from a run's log file, or "". Missing, unreadable and unsupplied are one answer. */
export function logExcerptFrom(path: string | undefined): string {
  if (!path || !existsSync(path)) return "";
  try {
    return logExcerpt(readFileSync(path, "utf8"));
  } catch {
    return "";
  }
}

/**
 * What the failure notice says, from the line that names the run.
 *
 * The caller writes the tags above it — `report_run_failure.ts` through `turnHeader`,
 * `post_result_comment.ts` through the result comment's own header — and this is the
 * prose under them.
 *
 * `notify` opens the notice with the person, which the failure notice does and the
 * result comment does not: the result comment names the person in its own mention
 * sentence at the bottom, where every other ending on the thread names them.
 *
 * `runUrl` is passed by the caller whose comment carries no footer, and omitted by the
 * one whose footer already has the run link, so one fact is not printed twice in one
 * comment.
 *
 * The excerpt is last. It is usually about the infrastructure — "MCP server closed
 * connection", "Unexpected while resolving package" — which no agent and often no
 * person can act on. It is kept because occasionally it is the answer, and put below
 * the part that always matters.
 */
export function failureLines(args: {
  agent: string;
  excerpt: string;
  notify?: string;
  runUrl?: string;
}): string[] {
  const lines = [
    // No "the run failed": a run's colour is decided by whether the notice posted, and
    // a notice that landed leaves the run green — the same words would contradict the
    // run the reader can see.
    `${mentionPrefix(args.notify)}Atomaton: \`${args.agent}\` did not finish.`,
    "",
    // The fact somebody who has used Atomaton before will assume the opposite of.
    "**The session was saved.** What this run worked out is still there.",
    "",
    // The two ways forward, worded beside the one definition of the command syntax they
    // spell — shared with the run watch's notice, which says them for a run that never
    // got far enough to report anything at all.
    ...recoveryLines(args.agent),
  ];
  if (args.runUrl) lines.push("", `Workflow logs: ${args.runUrl}`);
  if (args.excerpt) {
    lines.push("", "From the log, which is often about the infrastructure rather than the work:", "```", args.excerpt, "```");
  }
  return lines;
}
