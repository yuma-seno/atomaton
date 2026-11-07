/**
 * node-lock.ts — the outside judgement about a node's lock, from three reads.
 *
 * A node's thread says an agent holds the turn. Whether that agent is still THERE is a
 * different question, answered by things the thread does not carry: whether the run the
 * claim names has finished (`actions/runs/{id}`), and — for a parked turn — whether the
 * work it waits on has closed and whether the collection it expects is overdue.
 *
 * One function, because two callers ask the same question of the same node and act on the
 * answer differently: the watch's sweep RELEASES a stale lock, and the guard must NOT
 * delete a person's comment under one. Two spellings of the read would let them disagree
 * about the same node, and the disagreement is the cost — a sweep releasing what the guard
 * still calls live, or the guard deleting under a lock the sweep has written off.
 *
 * The judgement itself is `domain/work/stale-lock.ts`'s; this is the I/O that feeds it.
 */
import { issueLinks } from "./issue-links.ts";
import { readRunStatus } from "./run-status.ts";
import { lockOn, type ThreadLock } from "./thread.ts";
import { abandonedClaim, lockVerdict, type LockVerdict, type RunStatusRead } from "../../domain/work/stale-lock.ts";

/** What the guard asks: the lock it already read, and whether nobody is coming back for it. */
export function lockAbandoned(repo: string, lock: ThreadLock, nowMs: number): boolean {
  // Short-circuited before the run read, not inside `abandonedClaim`: a park is never
  // abandoned here, so asking GitHub about its run would be a request whose answer
  // nothing consults, on the one path where the answer cannot change the outcome.
  if (lock.park !== undefined || lock.claim === undefined) return false;
  return abandonedClaim({
    claim: lock.claim,
    parked: false,
    run: lock.claim.run > 0 ? readRunStatus(repo, lock.claim.run) : { read: false, why: "the claim names no run" },
    nowMs,
  });
}

/** A node's lock and what follows from it. */
export interface NodeLock {
  readonly lock: ThreadLock;
  readonly verdict: LockVerdict;
  /** What GitHub said about the claim's run. `null` when no run was asked about. */
  readonly run: RunStatusRead | null;
}

/**
 * Open sub-issues under a node, or `undefined` when they could not be read.
 *
 * `issueLinks` reports an unreadable relationship as `unavailable` rather than throwing,
 * and that distinction is load-bearing here: no children and no knowledge of the children
 * must not both read as "nothing is left under this node".
 */
function openChildrenOf(repo: string, number: string | number): number | undefined {
  const links = issueLinks(repo, Number(number));
  if (links.unavailable !== undefined) return undefined;
  return links.children.filter((child) => child.state === "open").length;
}

/**
 * Read one node's lock and judge it.
 *
 * Throws when the thread cannot be read — a failed read is not "nothing holds this node",
 * and both callers have something to say about not knowing. The run-status and children
 * reads degrade instead, to `undetermined`, because each is only ever asked to refine an
 * answer the thread already gave.
 *
 * Only a PARKED node asks about its children: an unparked lock has no collection to wait
 * for, so the read would be a request whose answer nothing consults.
 */
export function readNodeLock(repo: string, number: string | number, nowMs: number): NodeLock {
  const lock = lockOn(repo, number);
  const run = lock.claim !== undefined && lock.claim.run > 0 ? readRunStatus(repo, lock.claim.run) : null;
  const openChildren = lock.park !== undefined ? openChildrenOf(repo, number) : 0;
  const verdict = lockVerdict({
    claim: lock.claim,
    parked: lock.park !== undefined,
    parkedSince: lock.park?.at ?? "",
    openChildren,
    run: run ?? { read: false, why: "the claim names no run" },
    nowMs,
  });
  return { lock, verdict, run };
}
