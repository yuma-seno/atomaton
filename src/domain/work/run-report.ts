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
 * A `workflow_run` event carries no inputs, so the watched run's node is read out of
 * its display title, which `run-name` writes. Two shapes, one per kind of watched
 * run: the runner's own runs — the continuations a chain dispatches — carry
 * "`agent` on `#N`"; the two entry workflows whose runs START a chain (`Atomaton
 * Entry`, `Atomaton Manual Comment`) carry `#N` alone, because `run-name` is
 * evaluated before any job runs and the agent is a route's decision, unavailable to
 * the title. The watch triggers on all three workflows, so both shapes arrive.
 * Titles that match neither (the runner's own name before `run-name` existed, and
 * anything else GitHub lists) read as nothing: the watch stays silent on what it
 * cannot read rather than guessing a node to post at.
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
import { shapedThread, whoseTurn, type ThreadEntry, type TurnReaders } from "./thread.ts";

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
  /**
   * The claim of a turn a body carries, when it is one (#285) — `TOOK_TAG.read`.
   *
   * The claim is the identity the watch's gates compare: "did THIS run take a turn"
   * is "does a claim with MY run id exist", which no marker, command or timestamp
   * can answer.
   */
  claim: (body: string) => { ask: number; run: number } | undefined;
  /**
   * The ending record a body carries, when it is one (#285) — `ENDED_TAG.read`, verb
   * and `answers` and `run` together. The ending is the claim's close: "does THIS run
   * have an ending" and "is THIS ask still unanswered" are both reads of it.
   */
  ended: (body: string) => { verb: string; answers: number; run: number } | undefined;
}

/** The node a watched run's title names, and the agent when the title carries one. */
export interface RunTitle {
  /**
   * The agent the run was asked for, from the runner's title. `undefined` for an
   * entry run, whose title carries the node alone; the notice reads that run's
   * agent off the thread when it needs one.
   */
  readonly agent: string | undefined;
  readonly number: number;
}

/**
 * The node a run's display title carries, or `undefined` when the title is not one
 * this machinery wrote.
 */
export function parseRunTitle(displayTitle: string | undefined): RunTitle | undefined {
  const match = /^(?:(\S+) on )?#(\d+)$/.exec((displayTitle ?? "").trim());
  if (!match) return undefined;
  const number = Number(match[2]);
  if (!Number.isInteger(number) || number <= 0) return undefined;
  return { agent: match[1], number };
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
 * A comment as the watch's questions read it: what it says, when it was written,
 * and who wrote it.
 *
 * The identity gates (#285) read the tags off the bodies and need none of this, but
 * the shaped entries stay part of the thread read — the notice reads the agent off
 * them, and a future question about who wrote what keeps one shape to ask it of.
 */
export interface WatchComment extends ThreadEntry {
  readonly createdAt: string;
}

/**
 * The ask comment id a run claimed on a thread, or `undefined` when it claimed none
 * (#285).
 *
 * The claim — `atomaton:took=<ask> run=<run>`, written by the runner at start — is
 * the whole answer to "did this run take a turn": the thread carries which run took
 * which ask, and reading it is a comparison, not the marker-or-command-or-time
 * estimate this gate replaced. A run that never wrote a claim took no turn, whatever
 * its title says; a run that wrote one is on the hook for the ending that answers
 * the same ask.
 *
 * Newest claim wins, which only matters when a run somehow claimed twice; quotations
 * are stepped over, the same rule `lastEndingComment` walks by.
 */
export function turnClaimedBy(
  comments: readonly { readonly body: string }[],
  runId: number,
  readers: EndingWalkReaders,
): number | undefined {
  for (let index = comments.length - 1; index >= 0; index -= 1) {
    const comment = comments[index]!;
    if (readers.quoted(comment.body)) continue;
    const claim = readers.claim(comment.body);
    if (claim !== undefined && claim.run === runId) return claim.ask;
  }
  return undefined;
}

/**
 * Whether a run wrote an ending — an `atomaton:ended` carrying its run id (#285).
 *
 * The watch's second gate, and the twin of `turnClaimedBy`: a run that claimed an
 * ask owes an ending with the same run id on it, and the pair is what "this run
 * took the turn and never reported" means now that the thread says who took what.
 */
export function endingLeftBy(
  comments: readonly { readonly body: string }[],
  runId: number,
  readers: EndingWalkReaders,
): boolean {
  return comments.some(
    (comment) => !readers.quoted(comment.body) && readers.ended(comment.body)?.run === runId,
  );
}

/**
 * Whether an ask is still unanswered — no ending on the thread answers it (#285).
 *
 * The check that makes the watch's notice a once-per-ask event: the notice itself is
 * an ending carrying `answers=<ask>`, so the ask it healed no longer reads as
 * unanswered, and the next watch that fires — for this run's own completion, a
 * re-run of the watch, or any other run's — stays silent. Machinery notices carry
 * `answers=0`, which matches no ask and answers nothing.
 */
export function askUnanswered(
  comments: readonly { readonly body: string }[],
  askId: number,
  readers: EndingWalkReaders,
): boolean {
  return !comments.some(
    (comment) => !readers.quoted(comment.body) && readers.ended(comment.body)?.answers === askId,
  );
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
