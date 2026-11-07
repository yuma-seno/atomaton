import { describe, expect, test } from "bun:test";
import {
  CLAIM_WITHOUT_RUN_MINUTES,
  PARK_COLLECTION_MINUTES,
  abandonedClaim,
  claimFreshness,
  lockVerdict,
  parkOverdue,
  type ClaimLock,
  type RunStatusRead,
} from "./stale-lock.ts";

/**
 * The one judgement the sweep and the guard share, asked of strings and instants alone.
 *
 * Both callers act on this answer — the sweep writes an ending, the guard stops deleting —
 * so the cases here are the states the whole issue is about: a run that finished and left
 * its claim, a run still going, a park whose collection never came, and every shape where
 * the question cannot be answered. The unanswerable ones matter most: an unreadable run
 * must never come back as `stale`, because that is a live run's comments deleted and a
 * live run's node handed to a person mid-work.
 */

const NOW = Date.parse("2026-11-01T12:00:00Z");

/** A time `minutes` before NOW, as GitHub would print it. */
function ago(minutes: number): string {
  return new Date(NOW - minutes * 60_000).toISOString();
}

const UNREAD: RunStatusRead = { read: false, why: "HTTP 502" };

function claim(run: number, at = ago(1)): ClaimLock {
  return { ask: 55, run, at };
}

describe("claimFreshness", () => {
  test("a run still going is fresh, whatever the clock says", () => {
    // Three days old, and still the answer: the run is what decides, not the age. A claim
    // whose run is queued behind a busy runner is not stale merely because it has waited.
    for (const status of ["queued", "in_progress", "requested", "waiting", "pending"]) {
      expect(claimFreshness(claim(7, ago(3 * 24 * 60)), { read: true, status }, NOW), status).toBe("fresh");
    }
  });

  test("a completed run with its claim still standing is stale", () => {
    expect(claimFreshness(claim(7), { read: true, status: "completed" }, NOW)).toBe("stale");
    // Ten seconds ago is as dead as ten days ago: no grace, because the run's own
    // completion is the evidence, not the passage of time.
    expect(claimFreshness(claim(7, ago(0.1)), { read: true, status: "completed" }, NOW)).toBe("stale");
  });

  test("a status this file has not seen reads as live rather than as over", () => {
    // The same argument `merge-signals.ts` makes about its own list: the one value that
    // means "over" is named, and a value nobody has seen must not resolve to "nothing is
    // running here" — that is how a running agent's node gets handed to a person.
    expect(claimFreshness(claim(7), { read: true, status: "hibernating" }, NOW)).toBe("fresh");
    expect(claimFreshness(claim(7), { read: true, status: "COMPLETED" }, NOW)).toBe("fresh");
  });

  test("a run that could not be read is unknown, not fresh and not stale", () => {
    expect(claimFreshness(claim(7), UNREAD, NOW)).toBe("unknown");
  });

  test("a claim naming no run falls back to the timer, and only there", () => {
    const runless = (at: string): ClaimLock => ({ ask: 55, run: 0, at });
    // Under the fallback's bound: still trusted. The fallback exists for claims nothing can
    // be asked about, so it may only fire where a run could not still be alive.
    expect(claimFreshness(runless(ago(CLAIM_WITHOUT_RUN_MINUTES - 1)), UNREAD, NOW)).toBe("fresh");
    expect(claimFreshness(runless(ago(CLAIM_WITHOUT_RUN_MINUTES)), UNREAD, NOW)).toBe("stale");
    // And the run read is not consulted at all: it was never made.
    expect(claimFreshness(runless(ago(CLAIM_WITHOUT_RUN_MINUTES + 600)), { read: true, status: "in_progress" }, NOW)).toBe("stale");
  });

  test("a claim whose time cannot be read is unknown, never stale", () => {
    for (const at of ["", "yesterday", "2026-13-45T99:99:99Z"]) {
      expect(claimFreshness({ ask: 55, run: 0, at }, UNREAD, NOW), at).toBe("unknown");
    }
  });
});

describe("parkOverdue", () => {
  test("a park is overdue only after the grace the aggregation is given", () => {
    expect(parkOverdue(ago(PARK_COLLECTION_MINUTES - 1), NOW)).toBe(false);
    expect(parkOverdue(ago(PARK_COLLECTION_MINUTES), NOW)).toBe(true);
    // Unreadable is not overdue: the park may be a second old, and releasing it early
    // writes "nothing was decided" beside a parent that then decides something.
    expect(parkOverdue("", NOW)).toBe(false);
  });
});

describe("lockVerdict, an unparked node", () => {
  const verdictOf = (c: ClaimLock | undefined, run: RunStatusRead): string =>
    lockVerdict({ claim: c, parked: false, parkedSince: "", openChildren: 0, run, nowMs: NOW });

  test("a finished run with its claim standing is released", () => {
    expect(verdictOf(claim(7), { read: true, status: "completed" })).toBe("release");
  });

  test("a live run holds, and so does a claim nobody could ask about", () => {
    expect(verdictOf(claim(7), { read: true, status: "in_progress" })).toBe("hold");
    expect(verdictOf(claim(7), UNREAD)).toBe("undetermined");
  });

  test("no claim holds — the guard keeps the comment and the sweep has nothing to release", () => {
    // Both readings are the same edge: with nothing claiming the turn, `shapedThread`
    // already says the ball is with a person, so there is no lock to break.
    expect(verdictOf(undefined, UNREAD)).toBe("hold");
    expect(verdictOf(undefined, { read: true, status: "completed" })).toBe("hold");
  });
});

describe("lockVerdict, a parked node", () => {
  const verdictOf = (args: {
    claim?: ClaimLock;
    openChildren: number | undefined;
    parkedSince?: string;
    run?: RunStatusRead;
  }): string =>
    lockVerdict({
      claim: args.claim,
      parked: true,
      parkedSince: args.parkedSince ?? ago(PARK_COLLECTION_MINUTES + 1),
      openChildren: args.openChildren,
      run: args.run ?? { read: true, status: "completed" },
      nowMs: NOW,
    });

  test("a park with anything still open holds, however overdue", () => {
    expect(verdictOf({ claim: claim(7), openChildren: 2, parkedSince: ago(60 * 24) })).toBe("hold");
    expect(verdictOf({ claim: claim(7), openChildren: 1, parkedSince: ago(60 * 24) })).toBe("hold");
  });

  test("a park inside its grace holds — the aggregation is still coming", () => {
    expect(verdictOf({ claim: claim(7), openChildren: 0, parkedSince: ago(PARK_COLLECTION_MINUTES - 1) })).toBe("hold");
  });

  test("an overdue park with nothing open is released", () => {
    expect(verdictOf({ claim: claim(7), openChildren: 0 })).toBe("release");
    // Including the case with no claim: a person took the claim away by hand to get out of
    // a stuck lock, and the park is what is left holding the node.
    expect(verdictOf({ openChildren: 0 })).toBe("release");
  });

  test("children that could not be read are undetermined, never \"nothing is open\"", () => {
    // The whole arm rests on there being nothing left under the node. `issueLinks` reports
    // a failed read as `unavailable`, and folding that into `0` would release a parent
    // whose work is still going.
    expect(verdictOf({ claim: claim(7), openChildren: undefined })).toBe("undetermined");
    expect(verdictOf({ openChildren: undefined })).toBe("undetermined");
  });

  test("a parked ask a run has claimed since is held by that run", () => {
    // The resume that collects a park claims the parked ask with its OWN run id. A claim
    // made after the park is therefore a live collection, and releasing it would post
    // "nothing was decided" over a parent that is deciding something.
    expect(verdictOf({ claim: claim(9, ago(0.5)), openChildren: 0, run: { read: true, status: "in_progress" } })).toBe("hold");
    // And once that run is over too, the park is stale again — by the same rule.
    expect(verdictOf({ claim: claim(9, ago(0.5)), openChildren: 0, run: { read: true, status: "completed" } })).toBe("release");
    // An unanswerable run on an overdue park is undetermined, like everywhere else.
    expect(verdictOf({ claim: claim(9), openChildren: 0, run: UNREAD })).toBe("undetermined");
  });
});

describe("abandonedClaim, the guard's half", () => {
  const abandoned = (args: { claim?: ClaimLock; parked: boolean; run: RunStatusRead }): boolean =>
    abandonedClaim({ claim: args.claim, parked: args.parked, run: args.run, nowMs: NOW });

  test("a finished run's standing claim is abandoned", () => {
    expect(abandoned({ claim: claim(7), parked: false, run: { read: true, status: "completed" } })).toBe(true);
  });

  test("a live run's claim is not, and neither is one nobody could ask about", () => {
    // The guard's whole safety margin: the two answers it must never delete on.
    expect(abandoned({ claim: claim(7), parked: false, run: { read: true, status: "in_progress" } })).toBe(false);
    expect(abandoned({ claim: claim(7), parked: false, run: UNREAD })).toBe(false);
  });

  test("a park is never abandoned by the guard, however old", () => {
    // The aggregation resumes a park and reads what was written during the wait. A missed
    // one is the SWEEP's to release, on the park's own clock — the guard must not take that
    // decision, because it would delete the comment the resumed run needed.
    expect(abandoned({ claim: claim(7, ago(60 * 24)), parked: true, run: { read: true, status: "completed" } })).toBe(false);
  });

  test("no claim means nothing is abandoned — there is no run to have finished", () => {
    expect(abandoned({ claim: undefined, parked: false, run: { read: true, status: "completed" } })).toBe(false);
  });
});
