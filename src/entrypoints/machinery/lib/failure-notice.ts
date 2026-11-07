/**
 * failure-notice.ts — the words a failed run leaves on its thread.
 *
 * One script speaks for a run that failed: `post_result_comment.ts`. It used to be two,
 * and the second existed only because the first ran on one side of a step outcome:
 *
 *   - a "Run agent" step that came back with the core recording `failed` — a session
 *     that died on its context budget, say — reached the result comment, which had
 *     nothing of the run's own to show. That is #441: the last assistant turn was a tool
 *     call, no tool had recorded an ending, and the thread received nothing at all. No
 *     comment, no `atomaton:ended` tag to release the thread's guard, and a person had
 *     to open the run and read its log to learn that anything had happened.
 *   - a "Run agent" step that exited non-zero — a hard crash — reached nothing, because
 *     every later step was gated on that step succeeding. A separate script
 *     (`report_run_failure.ts`) covered it, in a step of its own, with the same sentence.
 *
 * One event, two writers, and the cost was the gap the split invites: a run whose step
 * succeeded but whose core filed `failed` fell between them. So the post step now runs
 * for both outcomes and this is one caller. See `post_result_comment.ts`'s "This is the
 * only writer of a run's ending".
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
 * The caller writes the tags above it — `post_result_comment.ts` through the result
 * comment's own header — and this is the prose under them.
 *
 * `notify` opens the notice with the person. The result comment, the only caller, names
 * the person in its own mention sentence at the bottom instead, where every other
 * ending on the thread names them, so it passes no `notify`.
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
