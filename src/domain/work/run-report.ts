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
 * A comment as the watch's questions read it: what it says, when it was written,
 * and who wrote it.
 *
 * `needsEnding` needs the first two; `tookTurn` needs all three, because the entry
 * runs it judges can complete without ever taking a turn, and only the author
 * separates a person's request from the machinery's dispatch marker.
 */
export interface WatchComment extends ThreadEntry {
  readonly createdAt: string;
}

/**
 * Whether the watched run took the node's turn — the gate that keeps the watch
 * silent on an entry run that completed without dispatching anything.
 *
 * An entry run is the watch's second trigger surface, and most of its runs are not
 * turns: a comment the guard removed, an ordinary remark, a route that chose no
 * agent. None of them change the thread, and a notice on one would land on a node
 * whose last event is an older turn's ending — sometimes in the middle of another
 * run's turn, which would unjam the guard while that run was still working. So the
 * caller of this gate pairs it with `requestOutstanding` — the thread must be
 * stuck at an ask — and this answers the narrower question: is THAT ask the
 * watched run's doing?
 *
 * The newest ask that survives the shaping is the live one; an older ask under it
 * was taken up or superseded. It is the watched run's doing when either:
 *
 *   - the machinery posted a dispatch marker at or after the run started. The
 *     marker is written by the machinery about to start a run, so one inside the
 *     watched run's lifetime is that run taking the turn; or
 *   - the ask is a person's command, the run is one whose trigger consumes a
 *     command, the run did NOT end successfully, and the command was written
 *     before the run started. Four facts, because each condition closes a hole
 *     a measurement on the thread actually caught:
 *
 *       - without the trigger condition, a run a new issue started claims the
 *         command the person posted seconds after it — the ask the command's
 *         OWN run is working on;
 *       - without the conclusion condition, a run that ended `success` claims
 *         it too. A successful entry run carried its own judgment all the way
 *         through: it either dispatched — its marker is on the thread, and the
 *         branch above answers, whatever the conclusion — or it decided there
 *         was nothing to do, which is exactly the silence this gate owes. The
 *         fallback is for a run that died before posting any marker, and
 *         GitHub reports that death as anything but `success` — cancelled,
 *         failed, timed out, never started;
 *       - without the time condition, a command written during the run — the
 *         NEXT run's ask — is handed back to the run already going, so
 *         rapid-fire commands reproduce the same mix-up.
 *
 *     A flag or a time that cannot be read lands on silence, like the marker
 *     branch below. The residue is caught when the run that did take the
 *     command completes: that run's marker or its own death answers there.
 *
 * A command that raced a live run — deleted, or on its way out — cannot reach
 * this branch: it survives the shaping only when it was made on a person's
 * turn.
 *
 * A machinery marker OLDER than the run is another run's: the run still working
 * when the watch fired for a guard-only completion, whose death its own completion
 * will answer for — its watch will find the same jam with that run's marker inside
 * its own lifetime, and post then.
 *
 * Unreadable times land on silence — the opposite of `needsEnding`'s asymmetry,
 * because this gate is about noise: a false "took the turn" posts a notice onto a
 * thread where nothing is owed, while the residue of a missed one is caught when
 * the run that did take the turn completes.
 */
export function tookTurn(
  comments: readonly WatchComment[],
  runStartedAt: string | undefined,
  readers: TurnReaders,
  /** Whether the watched run's trigger consumes a person's command; the caller derives it, so no event name reaches here. */
  consumesCommands: boolean,
  /** Whether the watched run ended other than by carrying its judgment through — anything but `success`; the caller derives it too. */
  endedUnsuccessfully: boolean,
): boolean {
  const { comments: kept } = shapedThread(comments, readers);
  for (let index = kept.length - 1; index >= 0; index -= 1) {
    const entry = kept[index]!;
    if (entry.quoted) continue;
    if (readers.requestedAgent(entry.body) === "") continue;
    if (entry.isHuman) {
      if (!consumesCommands) return false;
      if (!endedUnsuccessfully) return false;
      const at = Date.parse(entry.createdAt);
      const start = Date.parse(runStartedAt ?? "");
      return !Number.isNaN(at) && !Number.isNaN(start) && at < start;
    }
    const at = Date.parse(entry.createdAt);
    const start = Date.parse(runStartedAt ?? "");
    return !Number.isNaN(at) && !Number.isNaN(start) && at >= start;
  }
  return false;
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
