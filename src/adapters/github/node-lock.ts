/**
 * node-lock.ts — the outside judgement about a node's lock, from three reads.
 *
 * A node's thread says an agent holds the turn. Whether that agent is still THERE is a
 * different question, answered by things the thread does not carry: whether the run the
 * claim names has finished (`actions/runs/{id}`), and — for a parked turn — whether the
 * work it waits on has closed.
 *
 * One spelling, because the callers that ask this question must not disagree about the
 * same node — the disagreement is the cost: one read releasing what another still calls
 * live, or the guard deleting under a lock another read has written off. The judgement
 * itself is `domain/work/stale-lock.ts`'s; this is the I/O that feeds it. `lockAbandoned`
 * is the guard's door into it, and it is the whole verdict: with the outside sweep gone,
 * the guard is where a missed park recovers on read, so a narrower reading of the verdict
 * here would leave the guard and the dispatch hold answering differently about parks.
 */
import { readRunStatus } from "./run-status.ts";
import { openUnderOf } from "./issue-links.ts";
import { type ThreadLock } from "./thread.ts";
import { lockVerdict } from "../../domain/work/stale-lock.ts";

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
