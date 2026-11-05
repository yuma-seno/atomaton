import { describe, expect, test } from "bun:test";
import {
  endingOf,
  nextToDispatch,
  refusedByChainLimit,
  shouldReleaseGuard,
  type TurnSignals,
} from "./turn.ts";

function signals(overrides: Partial<TurnSignals> = {}): TurnSignals {
  return {
    succeeded: true,
    endedBecause: "completed",
    loopLimitReached: false,
    chainContinues: false,
    directive: "",
    reported: true,
    ...overrides,
  };
}

const endingFor = (overrides: Partial<TurnSignals> = {}) => endingOf(signals(overrides));

describe("endingOf", () => {
  test("a run that did not complete failed, whatever else it said", () => {
    expect(endingFor({ succeeded: false }).ended).toBe("failed");
    // A directive from a run that crashed is not a hand-off. Nothing below the
    // failure is known to have been meant.
    expect(endingFor({ succeeded: false, directive: "engineer" }).ended).toBe("failed");
  });

  test("a person stopping it is its own ending, not a limit", () => {
    expect(endingFor({ endedBecause: "stopped" }).ended).toBe("stopped");
  });

  /**
   * The repetition circuit breaker is named apart from a plain failure, because it is
   * the one failure a person can act on: the same turn asked again is often all it
   * takes, where a provider hanging up is nothing to look at.
   */
  test("a run cut off for repeating itself is its own ending, not a failure", () => {
    expect(endingFor({ endedBecause: "loop" }).ended).toBe("looped");
    expect(endingFor({ endedBecause: "loop" }).ended).not.toBe("failed");
  });

  test("this run's own ceiling spends it", () => {
    expect(endingFor({ endedBecause: "runtime" }).ended).toBe("spent");
  });

  /**
   * #208: a run that ended inside a child-starting tool call PARKED the turn — the
   * children are running under this node, and the aggregation re-invocation collects
   * the turn. Named apart from `handed-off` (the next agent takes THIS node) and
   * from `no-report` (the same silence, without the park), because the label rule
   * reads the difference: a park holds the guard, a quiet run does not.
   */
  test("a run that parked its turn on children is its own ending", () => {
    expect(endingFor({ parked: true, reported: false }).ended).toBe("parked");
    // A park beats the chain limits and a hand-off: the children are already
    // running, and the limits catch the re-invoked parent instead.
    expect(endingFor({ parked: true, loopLimitReached: true }).ended).toBe("parked");
    expect(endingFor({ parked: true, directive: "reviewer" }).ended).toBe("parked");
  });

  /** Two different ceilings. A person goes and looks at different things. */
  test("the chain's ceiling is a different ending from this run's", () => {
    expect(endingFor({ loopLimitReached: true }).ended).toBe("chain-over");
    expect(endingFor({ endedBecause: "runtime" }).ended).not.toBe("chain-over");
  });

  test("naming the next agent is a hand-off", () => {
    const ending = endingFor({ directive: "reviewer" });
    expect(ending.ended).toBe("handed-off");
    expect(ending.next).toEqual({ agent: "reviewer" });
  });

  /**
   * A tool call already started a run — ON ANOTHER NODE — so the guard stays held and
   * the mention stays silent, but this node has handed back (#449).
   *
   * This test used to assert `ended: "handed-off"`, and that is what wrote a promise
   * onto merged pull requests that nothing could ever keep: a merged pull request
   * re-invokes the issue it delivers, and every reader of `atomaton:ended=handoff`
   * took it as "the next agent runs HERE". The node's own conclusion is what the
   * ending now says; whether a run started is `continues`.
   */
  test("a tool call having already dispatched does not make this node a hand-off", () => {
    const ending = endingFor({ chainContinues: true });
    expect(ending.ended).toBe("finished");
    expect(ending.next).toBeUndefined();
    expect(ending.continues).toBe(true);
  });

  /** A directive still is: the agent it names runs on THIS node. */
  test("and a directive beside it is still a hand-off", () => {
    const ending = endingFor({ chainContinues: true, directive: "reviewer" });
    expect(ending.ended).toBe("handed-off");
    expect(ending.next).toEqual({ agent: "reviewer" });
  });

  test("nothing continuing at all is finished", () => {
    expect(endingFor().ended).toBe("finished");
  });

  test("whitespace is not a name", () => {
    expect(endingFor({ directive: "   " }).ended).toBe("finished");
  });

  /**
   * The case `finished` used to swallow. Measured over 396 sessions: 39 left no
   * closing text, and three of those the core called `completed` -- 313, 173 and 110
   * tool calls each, recorded as work done.
   */
  test("a run that ended having said nothing is not finished", () => {
    expect(endingFor({ reported: false }).ended).toBe("no-report");
    expect(endingFor({ reported: false }).ended).not.toBe("finished");
  });

  /**
   * The placement that makes the ending usable. A session-ending tool call -- create_pr,
   * launch_sub_agent -- gives the model no further turn, so its last word is that tool
   * call and nothing else. Asked before the hand-off, every one of those would read as
   * a run that reported nothing.
   */
  test("a hand-off is a hand-off whether or not the agent wrote a closing line", () => {
    expect(endingFor({ reported: false, directive: "reviewer" }).ended).toBe("handed-off");
    // And a dispatch elsewhere is still silence — `no-report` with the run it started
    // recorded beside it, rather than a hand-off nobody on this node can answer.
    expect(endingFor({ reported: false, chainContinues: true }).ended).toBe("no-report");
    expect(endingFor({ reported: false, chainContinues: true }).continues).toBe(true);
  });

  /** Every ending above it is a different sentence, and each still wins. */
  test("silence does not rename an ending that already has a name", () => {
    expect(endingFor({ reported: false, succeeded: false }).ended).toBe("failed");
    expect(endingFor({ reported: false, endedBecause: "stopped" }).ended).toBe("stopped");
    expect(endingFor({ reported: false, endedBecause: "runtime" }).ended).toBe("spent");
    expect(endingFor({ reported: false, loopLimitReached: true }).ended).toBe("chain-over");
  });

  /** It ended on its own and named nobody, so there is nobody to start. */
  test("a run that said nothing hands off to nobody", () => {
    expect(endingFor({ reported: false }).next).toBeUndefined();
  });
});

/**
 * One ending holds the guard. Every case below was a separate rule in
 * `serialization-guard.ts`, and each is now the same sentence asked of a name.
 */
describe("shouldReleaseGuard", () => {
  test("releases on every ending that handed back", () => {
    for (const overrides of [
      { succeeded: false },
      { succeeded: false, directive: "engineer" },
      { endedBecause: "stopped" },
      { endedBecause: "runtime" },
      { endedBecause: "loop" },
      { loopLimitReached: true },
      // Nothing is working on a node whose agent went quiet, so the node must not
      // stay locked against the person the mention is about to fetch.
      { reported: false },
      {},
    ]) {
      expect(shouldReleaseGuard(endingFor(overrides)), JSON.stringify(overrides)).toBe(true);
    }
  });

  test("stays held only while work is still going", () => {
    expect(shouldReleaseGuard(endingFor({ chainContinues: true }))).toBe(false);
    expect(shouldReleaseGuard(endingFor({ directive: "reviewer" }))).toBe(false);
    expect(shouldReleaseGuard(endingFor({ chainContinues: true, directive: "reviewer" }))).toBe(false);
    // A park is the second holder (#208): the children it started are running under
    // this node, and the aggregation re-invocation is the collection of the turn,
    // not a new one.
    expect(shouldReleaseGuard(endingFor({ parked: true }))).toBe(false);
  });

  /**
   * The arm #449 added, and the reason it is an arm rather than a consequence: the
   * ending became `finished` so the THREAD stops promising a successor, while the
   * label behaviour every existing consumer relies on is deliberately unchanged.
   * Removing this would make a merged pull request release a guard the aggregation
   * and the release rule were written against.
   */
  test("a run started elsewhere still holds the guard, though the ending handed back", () => {
    const ending = endingFor({ chainContinues: true });
    expect(ending.ended).toBe("finished");
    expect(shouldReleaseGuard(ending)).toBe(false);
  });

  /** And `nextToDispatch` reads the ending, so nothing is started twice. */
  test("nothing to dispatch for a run that is already going elsewhere", () => {
    expect(nextToDispatch(endingFor({ chainContinues: true }))).toBeUndefined();
  });

  /** A ceiling reached mid-chain ends the turn even though something was in flight. */
  test("a ceiling beats work in flight", () => {
    expect(shouldReleaseGuard(endingFor({ endedBecause: "runtime", chainContinues: true }))).toBe(true);
    expect(shouldReleaseGuard(endingFor({ loopLimitReached: true, directive: "reviewer" }))).toBe(true);
  });
});

/**
 * The two questions that used to be one four-term Actions expression thirty lines
 * from the step that asked the domain the other one.
 */
describe("who runs next", () => {
  test("a hand-off names who to start", () => {
    expect(nextToDispatch(endingFor({ directive: "reviewer" }))).toEqual({ agent: "reviewer" });
  });

  test("nothing is started on any other ending", () => {
    for (const overrides of [
      { succeeded: false, directive: "reviewer" },
      { endedBecause: "stopped", directive: "reviewer" },
      { endedBecause: "runtime", directive: "reviewer" },
      { endedBecause: "loop", directive: "reviewer" },
      { loopLimitReached: true, directive: "reviewer" },
      { chainContinues: true },
      { reported: false },
      {},
    ]) {
      expect(nextToDispatch(endingFor(overrides)), JSON.stringify(overrides)).toBeUndefined();
    }
  });

  /**
   * The chain's limit is the one refusal a person is told about by name: somebody
   * was named, and this is where the chain stops rather than taking them.
   */
  test("the chain's limit names who would have run", () => {
    expect(refusedByChainLimit(endingFor({ loopLimitReached: true, directive: "reviewer" }))).toEqual({
      agent: "reviewer",
    });
  });

  test("this run's own ceiling is not that refusal", () => {
    expect(refusedByChainLimit(endingFor({ endedBecause: "runtime", directive: "reviewer" }))).toBeUndefined();
  });

  test("a hand-off that happened is not a refusal", () => {
    expect(refusedByChainLimit(endingFor({ directive: "reviewer" }))).toBeUndefined();
  });

  /** Exactly one of the two can ever be answered, or a step would both run and be explained away. */
  test("no ending both dispatches and refuses", () => {
    for (const overrides of [
      { directive: "reviewer" },
      { loopLimitReached: true, directive: "reviewer" },
      { chainContinues: true },
      { succeeded: false },
      {},
    ]) {
      const ending = endingFor(overrides);
      expect(
        Boolean(nextToDispatch(ending)) && Boolean(refusedByChainLimit(ending)),
        JSON.stringify(overrides),
      ).toBe(false);
    }
  });
});
