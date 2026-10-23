import { describe, expect, test } from "bun:test";
import { endingCallProblem, endingCalls, rejectionMessage } from "./ending-calls.ts";

const CALLABLE = {
  knowsAgent: (name: string) => ["engineer", "reviewer", "atomaton"].includes(name),
  humans: ["yuma-seno", "some-reviewer"],
};

describe("what a closing message calls", () => {
  test("a bare directive line calls that agent", () => {
    expect(endingCalls("/engineer\n\nPlease build it.", CALLABLE)).toEqual({
      agents: ["engineer"],
      humans: [],
    });
  });

  /** The markdown-mangled form still dispatches, so it still counts. */
  test("a backticked directive line counts the same", () => {
    expect(endingCalls("/`engineer`", CALLABLE).agents).toEqual(["engineer"]);
  });

  /** A line naming something with no definition dispatches nothing. */
  test("a name with no definition is not a call", () => {
    expect(endingCalls("/nobody", CALLABLE).agents).toEqual([]);
    expect(endingCalls("/agent reviewer", CALLABLE).agents).toEqual([]);
  });

  test("a known participant mentioned in prose is a call", () => {
    expect(endingCalls("I think @Yuma-Seno should decide.", CALLABLE).humans).toEqual(["Yuma-Seno"]);
  });

  test("a stranger is not a call, because the comment will not reach them", () => {
    expect(endingCalls("Thanks to @torvalds.", CALLABLE).humans).toEqual([]);
  });

  test("a mention inside a code span is not a call", () => {
    expect(endingCalls("Write `@yuma-seno` to ask.", CALLABLE).humans).toEqual([]);
    expect(endingCalls("```\n@yuma-seno\n```", CALLABLE).humans).toEqual([]);
  });

  test("the same name twice is one call", () => {
    const calls = endingCalls("@yuma-seno and again @YUMA-SENO\n/engineer\n/engineer", CALLABLE);
    expect(calls.agents).toEqual(["engineer"]);
    expect(calls.humans).toEqual(["yuma-seno"]);
  });
});

describe("the one-call rule", () => {
  test("nobody is allowed, and is how a run asks the machinery to notify", () => {
    expect(endingCallProblem({ agents: [], humans: [] })).toBeUndefined();
  });

  test("one agent is allowed", () => {
    expect(endingCallProblem({ agents: ["engineer"], humans: [] })).toBeUndefined();
  });

  test("one person is allowed", () => {
    expect(endingCallProblem({ agents: [], humans: ["yuma-seno"] })).toBeUndefined();
  });

  test("an agent and a person is two calls, and the problem names both", () => {
    expect(endingCallProblem({ agents: ["engineer"], humans: ["yuma-seno"] })).toBe(
      "it calls 2 things: `/engineer`, `@yuma-seno`",
    );
  });

  test("two of either is two calls", () => {
    expect(endingCallProblem({ agents: ["engineer", "reviewer"], humans: [] })).toBe(
      "it calls 2 things: `/engineer`, `/reviewer`",
    );
    expect(endingCallProblem({ agents: [], humans: ["a", "b"] })).toBe("it calls 2 things: `@a`, `@b`");
  });
});

describe("the message handed back to the run", () => {
  test("states what was wrong and what the rule is", () => {
    const message = rejectionMessage("it calls 2 things: `/engineer`, `@yuma-seno`");
    expect(message).toContain("Your closing message was not posted");
    expect(message).toContain("it calls 2 things: `/engineer`, `@yuma-seno`");
    expect(message).toContain("calls at most one thing");
    // The fallback is stated, because it is what happens next and not a threat.
    expect(message).toContain("with its calls left as text");
  });
});
