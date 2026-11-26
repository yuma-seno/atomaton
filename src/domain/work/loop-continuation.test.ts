import { describe, expect, test } from "bun:test";
import { loopAbortFromSession, loopAbortLines, loopContinuationMessage, type LoopAbort } from "./loop-continuation.ts";

/**
 * The note a loop-stopped run is handed, and the verdict it is built from.
 *
 * The predicates and the injection are pinned by their own files; what is here is
 * the half that decides what the run is told, and it has one rule that matters more
 * than the wording: the note may not describe a rule it is not. A run told "you
 * already have the answer" when the tool returned nothing, or failed, would act on a
 * fact that is not true of it.
 */

function session(runs: unknown[]): Parameters<typeof loopAbortFromSession>[0] {
  return { messages: [], atoma_runs: runs };
}

const ANSWERS = {
  rule: "identical_answers",
  tool: "read",
  arguments: '{"path":"src/domain/tool_loop.rs"}',
  count: 4,
  call: 5,
  capped: false,
  last_error: null,
};

function abort(over: Partial<LoopAbort> = {}): LoopAbort {
  return { rule: "identical_answers", tool: "read", arguments: '{"path":"a.rs"}', count: 4, capped: false, ...over };
}

describe("the verdict a loop ending records", () => {
  test("is read from the last run entry", () => {
    expect(loopAbortFromSession(session([{ ended_because: "loop", loop_abort: ANSWERS }]))).toEqual({
      rule: "identical_answers",
      tool: "read",
      arguments: '{"path":"src/domain/tool_loop.rs"}',
      count: 4,
      capped: false,
      lastError: undefined,
    });
  });

  /** The pin's other half: a binary older than v0.6.0 writes `loop` and nothing beside it. */
  test("a session from an older binary records the ending and no verdict", () => {
    expect(loopAbortFromSession(session([{ ended_because: "loop" }]))).toBeUndefined();
  });

  /**
   * The shape a real run has (#610). atoma's `soft_stop_ending` maps only
   * `Repetition`, so a tool-loop abort is recorded as `failed` with the verdict
   * beside it -- keying on the word found nothing on any run that ever looped.
   */
  test("the ending word is not the signal: a failed run carrying a verdict was stopped by the guard", () => {
    const abort = loopAbortFromSession(session([{ ended_because: "failed", loop_abort: ANSWERS }]));
    expect(abort?.rule).toBe("identical_answers");
    expect(loopContinuationMessage(abort!)).toContain('{"path":"src/domain/tool_loop.rs"}');
  });

  /** Nor is it read the other way round: a verdict is a verdict under any word. */
  test("a verdict under any other ending is read the same", () => {
    for (const ended_because of ["loop", "stopped", "runtime", "completed"]) {
      expect(loopAbortFromSession(session([{ ended_because, loop_abort: ANSWERS }])), ended_because).toBeDefined();
    }
  });

  /** A run that looped and then finished on its second turn is a run that finished. */
  test("an earlier loop is not this run's ending", () => {
    expect(
      loopAbortFromSession(session([{ ended_because: "failed", loop_abort: ANSWERS }, { ended_because: "completed" }])),
    ).toBeUndefined();
  });

  /**
   * The ending word alone says nothing here: `loop` without a verdict is the older
   * binary, and `failed` without one is an ordinary failure.
   */
  test("an entry with neither a verdict nor anything else yields nothing", () => {
    for (const ended_because of ["loop", "failed", "completed"]) {
      expect(loopAbortFromSession(session([{ ended_because }])), ended_because).toBeUndefined();
    }
  });

  test("an entry with neither field at all yields nothing", () => {
    expect(loopAbortFromSession(session([{}]))).toBeUndefined();
  });

  test("a session with no run record at all says nothing", () => {
    expect(loopAbortFromSession(session([]))).toBeUndefined();
    expect(loopAbortFromSession(undefined)).toBeUndefined();
  });
});

describe("the note a loop-stopped run is handed", () => {
  test("identical answers: the call, its arguments and the count, and what to do instead", () => {
    const note = loopContinuationMessage(abort({ count: 5 }));
    expect(note).toContain("`read`");
    expect(note).toContain('{"path":"a.rs"}');
    expect(note).toContain("5 times in a row");
    expect(note, "re-reading cannot produce anything new").toContain("reading it again returns the same text");
    expect(note, "the way out is a report from what is in hand").toContain("write the closing report");
  });

  test("a capped answer says re-reading cannot reach what was cut", () => {
    const note = loopContinuationMessage(abort({ capped: true }));
    expect(note).toContain("output cap");
    expect(note).toContain("cannot reach what was cut");
  });

  test("an uncapped answer does not mention the cap", () => {
    expect(loopContinuationMessage(abort({ capped: false }))).not.toContain("output cap");
  });

  /** "Returned nothing" is not "you already have the answer". */
  test("the empty rule speaks in its own terms", () => {
    const note = loopContinuationMessage(abort({ rule: "empty_results" }));
    expect(note).toContain("returned nothing");
    expect(note).not.toContain("same answer");
    expect(note).toContain("write the closing report");
  });

  /** And "failed identically" reuses the tool's own sentence rather than paraphrasing it. */
  test("the failure rule quotes the error and says it will fail again", () => {
    const note = loopContinuationMessage(
      abort({ rule: "identical_failures", lastError: "Error: ENOENT: no such file or directory, open 'a.rs'" }),
    );
    expect(note).toContain("ENOENT: no such file or directory");
    expect(note).toContain("will fail the same way again");
    expect(note).not.toContain("same answer");
  });

  test("the cycle rule says the calls came round, not that an answer repeated", () => {
    const note = loopContinuationMessage(abort({ rule: "cycle" }));
    expect(note).toContain("came round in a circle");
    expect(note).not.toContain("same answer");
  });

  /** A rule a newer core adds must not be described as one of the four this knows. */
  test("an unknown rule names itself and claims nothing else", () => {
    const note = loopContinuationMessage(abort({ rule: "no_progress" }));
    expect(note).toContain("no_progress");
    expect(note).not.toContain("same answer");
    expect(note, "and still names a way out").toContain("write the closing report");
  });

  test("a verdict with no arguments still names the call and the count", () => {
    const note = loopContinuationMessage(abort({ arguments: "", count: 0 }));
    expect(note).toContain("`read`");
    expect(note).toContain("over and over");
    expect(note).not.toContain("The arguments it repeated");
  });
});

describe("the section a result comment carries", () => {
  test("names the tool, the arguments and the count without the log", () => {
    const lines = loopAbortLines(abort({ count: 4 })).join("\n");
    expect(lines).toContain("> [!WARNING]");
    expect(lines).toContain("loop guard stopped this run");
    expect(lines).toContain("`read`");
    expect(lines).toContain('{"path":"a.rs"}');
    expect(lines).toContain("4 times in a row");
  });

  test("and carries the cap and the error when the verdict has them", () => {
    const lines = loopAbortLines(abort({ rule: "identical_failures", capped: true, lastError: "it broke" })).join("\n");
    expect(lines).toContain("output cap");
    expect(lines).toContain("it broke");
  });
});
