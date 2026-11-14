/**
 * node-lock.ts — the outside judgement about a node's lock, from three reads.
 *
 * A node's thread says an agent holds the turn. Whether that agent is still THERE is a
 * different question, answered by things the thread does not carry: whether the run the
 * claim names has finished (`actions/runs/{id}`), and — for a parked turn — whether the
 * work it waits on has closed and whether the collection it expects is overdue.
 *
 * One function, because the callers that ask this question must not disagree about the
 * same node — the disagreement is the cost: a read releasing what another caller still
 * calls live, or the guard deleting under a lock another read has written off. The
 * judgement itself is `domain/work/stale-lock.ts`'s; this is the I/O that feeds it.
 * `lockAbandoned` is the guard's door into it, and it is the whole verdict now — with
 * the outside sweep gone, the guard is where a missed park recovers on read, so a
 * narrower reading of the verdict here would leave the two callers answering
 * differently about parks.
 */
import { readRunStatus } from "./run-status.ts";
import { openUnderOf } from "./issue-links.ts";
import { lockOn, type ThreadLock } from "./thread.ts";
import { lockVerdict, type LockVerdict, type RunStatusRead } from "../../domain/work/stale-lock.ts";

/** What the guard asks: the lock it already read, and whether nobody is coming back for it. */
export function lockAbandoned(repo: string, number: string | number, lock: ThreadLock, nowMs: number): boolean {
  return (
    lockVerdict({
      claim: lock.claim,
      parked: lock.park !== undefined,
      parkedSince: lock.park?.at ?? "",
      openUnder: lock.park !== undefined ? openUnderOf(repo, number) : 0,
      run:
        lock.claim !== undefined && lock.claim.run > 0
          ? readRunStatus(repo, lock.claim.run)
          : { read: false, why: "the claim names no run" },
      nowMs,
    }) === "release"
  );
}

/** A node's lock and what follows from it. */
export interface NodeLock {
  readonly lock: ThreadLock;
  readonly verdict: LockVerdict;
  /** What GitHub said about the claim's run. `null` when no run was asked about. */
  readonly run: RunStatusRead | null;
}

/**
 * Read one node's lock and judge it.
 *
 * Throws when the thread cannot be read — a failed read is not "nothing holds this node",
 * and both callers have something to say about not knowing. The run-status and children
 * reads degrade instead, to `undetermined`, because each is only ever asked to refine an
 * answer the thread already gave.
 *
 * Only a PARKED node asks what is open under it: an unparked lock has no collection to wait
 * for, so the read would be a request whose answer nothing consults.
 */
export function readNodeLock(repo: string, number: string | number, nowMs: number): NodeLock {
  const lock = lockOn(repo, number);
  const run = lock.claim !== undefined && lock.claim.run > 0 ? readRunStatus(repo, lock.claim.run) : null;
  const openUnder = lock.park !== undefined ? openUnderOf(repo, number) : 0;
  const verdict = lockVerdict({
    claim: lock.claim,
    parked: lock.park !== undefined,
    parkedSince: lock.park?.at ?? "",
    openUnder,
    run: run ?? { read: false, why: "the claim names no run" },
    nowMs,
  });
  return { lock, verdict, run };
}
