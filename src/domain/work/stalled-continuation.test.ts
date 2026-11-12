import { describe, expect, test } from "bun:test";
import { shouldAskToContinue, stalledContinuationMessage, type StalledRunFacts } from "./stalled-continuation.ts";

/** Everything a stalled run looks like; each test changes one fact. */
const STALLED: StalledRunFacts = {
  endedBecause: "completed",
  lastTurnCalledTools: false,
  changed: false,
  calledSomeone: false,
};

describe("shouldAskToContinue", () => {
  test("a completed run that changed nothing and called nobody is asked to continue", () => {
    expect(shouldAskToContinue(STALLED)).toBe(true);
  });

  /** The direction that matters: a run cut off by anything else is not re-asked. */
  test("any ending other than completed is left alone", () => {
    for (const endedBecause of ["runtime", "iterations", "stopped", "loop", "failed", undefined]) {
      expect(shouldAskToContinue({ ...STALLED, endedBecause }), String(endedBecause)).toBe(false);
    }
  });

  test("a last turn that called a tool already ended the run", () => {
    expect(shouldAskToContinue({ ...STALLED, lastTurnCalledTools: true })).toBe(false);
  });

  test("a run that changed something has no announced step to recover", () => {
    expect(shouldAskToContinue({ ...STALLED, changed: true })).toBe(false);
  });

  test("a run that called an agent or a person has handed the work on", () => {
    expect(shouldAskToContinue({ ...STALLED, calledSomeone: true })).toBe(false);
  });
});

describe("stalledContinuationMessage", () => {
  test("names both ways out: do the work, or say why there is none", () => {
    const note = stalledContinuationMessage();
    expect(note).toContain("If work remains, make that tool call now.");
    expect(note).toContain("say so and give the grounds");
  });

  /** The failure is ending on the sentence, so the rule says what not to do. */
  test("forbids ending on an announcement", () => {
    expect(stalledContinuationMessage()).toContain("Do not end on a sentence that introduces a next step.");
  });
});
