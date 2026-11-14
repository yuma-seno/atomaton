/**
 * stale-lock.ts — is the lock on a node still held by something that can release it?
 *
 * ## The state this exists for
 *
 * A run says it took the turn (`atomaton:took=<ask> run=<run>`), and every reader treats
 * that line as "an agent is working" until an ending answers the same ask. A run that
 * dies before it answers — the context budget, a lost runner, a timeout — leaves the
 * claim standing, and the claim then holds the node forever: the guard reads it as a
 * live run and removes what a person writes next, so there is no way in, and no run
 * arrives that could release it. A park (`atomaton:ended=waiting`) is the same shape one
 * step later: the turn is held open for a resume the aggregation is supposed to deliver,
 * and if that resume never comes the node waits for a parent that is not coming.
 *
 * ## Run facts first, the clock only where a run cannot answer
 *
 * The evidence that a lock is dead is the RUN, not the clock: a claim names the run that
 * took it, and GitHub says whether that run has finished. Finished + no release is the
 * whole of "nobody is coming", and it needs no timer — a run that ended ten seconds ago
 * is as dead as one that ended ten days ago. So run facts are the primary signal, and
 * the timer exists for the two states run facts cannot speak to:
 *
 *   - a claim whose `run` is 0 — an older format, or one written outside any run.
 *     `CLAIM_WITHOUT_RUN_MINUTES` is then the only thing saying "this has sat too long".
 *   - a park. Its run has ALWAYS finished by definition (it ended inside a
 *     child-starting call), so "the run is over" says nothing about whether the
 *     aggregation is about to collect it. `PARK_COLLECTION_MINUTES` is that grace.
 *
 * Both constants are far longer than the thing they wait for, because the two errors are
 * not symmetric: holding a dead lock one read longer costs nothing but the read, while
 * releasing a live one removes the guard from a node a run is working on — the
 * interruption the guard exists to close.
 *
 * `unknown` is a third answer rather than a silent `fresh`: a read that failed is not an
 * answer, and every reader says so instead of acting on a guess — the guard keeps the
 * person's comment, the dispatch hold keeps its refusal, and the claim path keeps its
 * back-off.
 *
 * ## Why one rule
 *
 * The dispatch hold (`latestRequestOn`), the claim path (`claim_turn.ts`'s dead-claim
 * exception) and the guard (which must not delete a person's comment under a live
 * lock) are actions taken on ONE judgement. Multiple spellings of it would drift, and
 * the drift is exactly the disagreement that costs a person their comment or leaves a
 * node locked: one caller releasing what another still calls live. So the judgement
 * lives here and every caller asks it — the dispatch hold and the guard through
 * `lockVerdict`, the claim path through `claimFreshness`.
 *
 * Pure: instants arrive as arguments (`nowMs`), never from the clock.
 */

/**
 * How a lock's liveness reads.
 *
 * - `fresh` — something may still be holding it: the run is not finished, or the claim is
 *   too recent to call.
 * - `stale` — the run that took the turn has finished and nothing released it.
 * - `unknown` — the question could not be answered (an unreadable run, an unreadable
 *   time). Not an answer, and neither caller acts on it.
 */
export type LockFreshness = "fresh" | "stale" | "unknown";

/** What GitHub says about a run, or why it could not be read. */
export type RunStatusRead = { readonly read: true; readonly status: string } | { readonly read: false; readonly why: string };

/**
 * How long a claim that names no run id is trusted before it is called stale.
 *
 * The fallback, and only that: a claim naming a run is judged by the run. Six hours,
 * because the longest a run may live is the runner job's own 240-minute bound and a
 * queued one can sit behind that a while longer.
 */
export const CLAIM_WITHOUT_RUN_MINUTES = 360;

/**
 * How long a parked turn is given for the aggregation to collect it.
 *
 * A park holds the turn open on purpose (#208): the run ended inside a child-starting
 * call, and the parent is re-invoked when the last child closes — seconds after it
 * closes, through its own path. So a park with nothing open under it that has survived
 * this long has missed that path, and half an hour bounds a missed park without
 * crowding the aggregation while it works.
 */
export const PARK_COLLECTION_MINUTES = 30;

/** The claim a node's thread leaves open: which ask, which run, and when it was taken. */
export interface ClaimLock {
  /** The ask comment id the run claimed. */
  readonly ask: number;
  /** The run that took it — `0` when the claim names none, which is what the fallback is for. */
  readonly run: number;
  /** When the claim was written, as GitHub's `created_at`. Empty when the read had none. */
  readonly at: string;
}

/** `at` in minutes before `nowMs`, or `undefined` when it cannot be read. */
function ageMinutes(at: string, nowMs: number): number | undefined {
  const parsed = Date.parse(at);
  if (!Number.isFinite(parsed)) return undefined;
  return (nowMs - parsed) / 60_000;
}

/**
 * Whether the run behind a claim may still be holding it.
 *
 * The run's own status answers it whenever the claim names a run. GitHub reports
 * `queued`, `in_progress`, `requested`, `waiting` and `pending` for a run that has not
 * finished, so the ONE value that means "over" is named and everything else reads as
 * live — a status this file has not seen must not read as "nothing is running here", the
 * same argument `merge-signals.ts` makes about its own list.
 *
 * `run` is the read the caller made, and the caller decides whether to make it: a claim
 * whose `run` is 0 passes `{read:false}`, and lands on the timer.
 */
export function claimFreshness(claim: ClaimLock, run: RunStatusRead, nowMs: number): LockFreshness {
  if (claim.run > 0) {
    if (!run.read) return "unknown";
    return run.status === "completed" ? "stale" : "fresh";
  }
  const age = ageMinutes(claim.at, nowMs);
  if (age === undefined) return "unknown";
  return age >= CLAIM_WITHOUT_RUN_MINUTES ? "stale" : "fresh";
}

/** Whether a park has sat past the grace the aggregation is given for it. */
export function parkOverdue(parkedSince: string, nowMs: number): boolean {
  const age = ageMinutes(parkedSince, nowMs);
  return age !== undefined && age >= PARK_COLLECTION_MINUTES;
}

/**
 * What a reader of one node's lock should do with it.
 *
 * - `release` — the run is over and nothing is coming: the guard keeps the person's
 *   comment, the dispatch hold treats the ask as free, and the next run's own ending
 *   closes the thread.
 * - `hold` — something may still hold it, or a park's collection is legitimately still on
 *   its way. Every reader keeps the thread's word.
 * - `undetermined` — the question could not be answered. Every reader stays on the side
 *   that acts on nothing: deleting or dispatching on a guess is the harm, and silence
 *   here must not read as "there was nothing to do".
 */
export type LockVerdict = "release" | "hold" | "undetermined";

/**
 * The judgement about one node.
 *
 * A lock that is NOT parked has no legitimate resumer: the run took the turn and nothing
 * but an ending can release it, so "the run is over" is the whole answer.
 *
 * A PARK does have one — the aggregation — and that is why three more facts are required
 * before releasing one: nothing is left open under the node, the grace has passed, and the
 * links could be read at all. All three are about not racing the machinery's own resume. A
 * park released early would hand a person's next command onto a node a parent is about to
 * decide something about.
 *
 * `claim` is absent in one real state: a person removed the claim by hand to get out of a
 * lock and left the park standing, which before this was the only way out of a stuck one.
 * There is no run to ask about then, and the park clock plus the open children are what is
 * left — which is enough, because a park is the newer of the two facts and carries its own
 * ending.
 *
 * Two shapes are NOT released however old the lock looks, and both are about not racing
 * work that is really there. A park whose collection may still be coming keeps its grace
 * and its open-work checks above. And an UNANSWERABLE claim — an unreadable run, an
 * unreadable time — lands on `undetermined`, never on `release`: `unknown` is not `stale`,
 * because acting on a guess here is a live run's node handed away.
 */
export function lockVerdict(args: {
  /** The open claim, or `undefined` when the thread leaves none. */
  readonly claim: ClaimLock | undefined;
  /** Whether the thread's newest event is a `waiting` ending — a parked turn (#208). */
  readonly parked: boolean;
  /** When that ending was written. Only read when `parked`. */
  readonly parkedSince: string;
  /**
   * Open work under the node — sub-issues AND pull requests — or `undefined` when the
   * links could not be read.
   *
   * Both lists, because a park waits on whichever it started: a sub-issue
   * (`launch_sub_agent`) or a pull request (`create_pr`). Counting only sub-issues reads a
   * leaf issue's `create_pr` park as "nothing is open" while its pull request is in review.
   */
  readonly openUnder: number | undefined;
  /** What GitHub says about the claim's run. Ignored when there is no claim. */
  readonly run: RunStatusRead;
  readonly nowMs: number;
}): LockVerdict {
  if (args.parked) {
    if (args.openUnder === undefined) return "undetermined";
    if (args.openUnder > 0) return "hold";
    if (!parkOverdue(args.parkedSince, args.nowMs)) return "hold";
    // The park is overdue and nothing is open under it. A resume that IS dispatched
    // claims the parked ask first, so a claim made after the park is a live run holding
    // the ball and its own ending will answer — that is what this last check reads.
    if (args.claim === undefined) return "release";
    const parkedClaim = claimFreshness(args.claim, args.run, args.nowMs);
    return parkedClaim === "fresh" ? "hold" : parkedClaim === "unknown" ? "undetermined" : "release";
  }
  // Nothing claims the turn, so no reader holds it: there is no lock to release, and
  // a person's comment reaches a node whose turn nothing holds.
  if (args.claim === undefined) return "hold";
  const freshness = claimFreshness(args.claim, args.run, args.nowMs);
  if (freshness === "unknown") return "undetermined";
  return freshness === "fresh" ? "hold" : "release";
}
