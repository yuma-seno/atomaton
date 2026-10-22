/**
 * run-report.ts — which runner runs owe the thread an ending, read from OUTSIDE the run.
 *
 * ## Why outside
 *
 * Everything that reports a run's ending reports from a step INSIDE the run
 * (`post_result_comment.ts`, `report_run_failure.ts`). A run that was killed — its
 * runner lost, a timeout, a cancel, or the machinery's `new_event_count == 0` path
 * that skips every agent step and ends green — reaches no step that could write one,
 * and the thread's last turn event stays the `asked` that started the run. That is
 * not a cosmetic state: the guard reads the thread, keeps deleting what a person
 * writes next, and no run arrives to heal it, because the run that would have is
 * the one that died (#252).
 *
 * The reader for that is the run watch (`Atomaton Run Watch`), triggered by the
 * runner's own completion — a step of no run in particular, so it can still write.
 * This module is the watch's judgement, pure and testable: what the run's title
 * says, and whether the thread it worked on still lacks the ending it owed.
 *
 * ## What the title is
 *
 * `Atomaton Runner` sets `run-name: "${{ inputs.agent }} on #${{ inputs.number }}"`,
 * because a `workflow_run` event carries no inputs — the display title is the only
 * place the watched run's node is written down. Titles that do not match the shape
 * are not this machinery's runs (the runner's own name before the `run-name` existed,
 * and anything else GitHub lists) and read as nothing: the watch stays silent on
 * what it cannot read rather than guessing a node to post at.
 *
 * ## The time comparison
 *
 * An ending comment counts when it was written at or after the run started —
 * `created_at >= run_started_at`, inclusive. Endings before the run are earlier
 * turns' endings and say nothing about this one; a one-turn-per-node thread cannot
 * carry an ending from a run that is still going, so the newest ending is the only
 * one that can answer for this run.
 *
 * An ending whose time cannot be read does not count, and an unknown run start
 * does not excuse the run: both land on "needs an ending". The asymmetry is
 * deliberate — a duplicate notice is noise a person reads past, while a silent
 * pass on a jammed thread is the permanent state this module exists to end.
 *
 * Pure: strings in, answers out. The readers arrive as arguments — the tag
 * vocabulary is `adapters/github/tags.ts`'s and the turn events are `thread.ts`'s,
 * so this module folds over what they return and names none of it.
 */
import { whoseTurn, type TurnReaders } from "./thread.ts";

/** How a body is read for this module's questions. */
export interface EndingWalkReaders extends Pick<TurnReaders, "ending"> {
  /**
   * Whether a body QUOTES another comment — the guard's notice preserving a removed
   * one, which carries the removed text verbatim. An `atomaton:ended` tag inside a
   * quotation is the deleted author's words, not the thread's own ending, and the
   * walk steps over the whole body. Same rule as `adapters/github/work-tree.ts`'s
   * `lastEnding`.
   */
  quoted: (body: string) => boolean;
}

/** The agent and node a runner run's title names. */
export interface RunTitle {
  readonly agent: string;
  readonly number: number;
}

/**
 * The agent and issue/PR number a run's display title carries, or `undefined` when
 * the title is not one this machinery wrote.
 */
export function parseRunTitle(displayTitle: string | undefined): RunTitle | undefined {
  const match = /^(\S+) on #(\d+)$/.exec((displayTitle ?? "").trim());
  if (!match) return undefined;
  const number = Number(match[2]);
  if (!Number.isInteger(number) || number <= 0) return undefined;
  return { agent: match[1]!, number };
}

/** A comment as this module reads it: what it says and when it was written. */
export interface DatedComment {
  readonly body: string;
  /** GitHub's `created_at`, an ISO instant — or "" when the read did not carry one. */
  readonly createdAt: string;
}

/**
 * The thread's newest turn-ending comment, quotations stepped over — or `undefined`
 * when nothing on the thread is an ending.
 *
 * Newest first, because the newest is the only one that answers for the run just
 * finished: one turn per node means every other ending predates it.
 */
export function lastEndingComment(
  comments: readonly DatedComment[],
  readers: EndingWalkReaders,
): DatedComment | undefined {
  for (let index = comments.length - 1; index >= 0; index -= 1) {
    const comment = comments[index]!;
    if (readers.quoted(comment.body)) continue;
    if (readers.ending(comment.body) !== "") return comment;
  }
  return undefined;
}

/**
 * Whether the thread still lacks the ending the run owed it — the watch's signal
 * to post one.
 *
 * True when the newest ending predates the run's start (or cannot be placed in
 * time, or there is no ending at all). See the time comparison above for why each
 * unreadable case lands on the notify side.
 */
export function needsEnding(
  comments: readonly DatedComment[],
  runStartedAt: string | undefined,
  readers: EndingWalkReaders,
): boolean {
  const last = lastEndingComment(comments, readers);
  if (last === undefined) return true;
  const endedAt = Date.parse(last.createdAt);
  if (Number.isNaN(endedAt)) return true;
  const startedAt = Date.parse(runStartedAt ?? "");
  if (Number.isNaN(startedAt)) return true;
  return endedAt < startedAt;
}

/**
 * Whether the `atomaton/in-progress` label may come off a node the watch just
 * returned to a person.
 *
 * The rule is the turn's, asked of the ending the thread had BEFORE the crashed
 * run took the ball: `whoseTurn` names a person for an ending that returned the
 * node or left it waiting on a child, and an agent for one that handed the node
 * to the next agent on it. #252's two sentences reach the same set from two
 * directions — "an ending that returns to a person releases" and "`shouldReleaseGuard`'s
 * rule" — and `waiting` sits where they differ. This follows the first and holds
 * only on `handoff`: a thread whose last ending is a hand-off was handed to an
 * agent, and whether that agent is the crashed run (whose recovery path is the
 * notice, which has already healed the thread) or work still in flight, the label
 * is the one cache this watch does not overwrite from outside. A stale `waiting`
 * — a child long finished, the re-dispatched parent crashed — is the stuck state
 * this module exists to end, so it releases; the residue when a child genuinely
 * still runs is a label off a few minutes early, which the child's own machinery
 * re-adds.
 *
 * No readable ending holds the label: a thread this rule cannot read is not a
 * thread to act on from outside.
 */
export function releasesLabel(lastEnding: DatedComment | undefined, readers: EndingWalkReaders): boolean {
  if (lastEnding === undefined) return false;
  const event = readers.ending(lastEnding.body);
  if (event === "") return false;
  // `whoseTurn` reads the events of a thread; one ending is the whole walk here.
  return whoseTurn([event]) === "person";
}
