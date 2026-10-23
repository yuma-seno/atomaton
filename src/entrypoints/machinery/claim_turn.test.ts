import { describe, expect, test } from "bun:test";
import { claimCommentBody, raceOutcome } from "./claim_turn.ts";

/**
 * The claim's race check (#285): two runs reaching for one ask are separated by
 * the claim comment ids themselves — the older claim holds the turn, the newer run
 * backs off. Per-node concurrency serialises the two runners, so the check cannot
 * itself race; what is pinned here is the comparison and the wire format the
 * watch's gates read back.
 */

const body = (id: number, ask: number, run: number) => ({ id, body: claimCommentBody({ ask, run }) });

describe("raceOutcome", () => {
  test("a claim with nothing older on the same ask holds the turn", () => {
    expect(raceOutcome([body(10, 55, 7)], { id: 10, ask: 55 })).toBe("held");
    expect(raceOutcome([], { id: 11, ask: 55 })).toBe("held");
  });

  test("an older claim on the same ask wins, and this run backs off", () => {
    // The acceptance condition: two runs processing one ask, one proceeds.
    const comments = [body(10, 55, 7), body(11, 55, 8)];
    expect(raceOutcome(comments, { id: 11, ask: 55 })).toBe("backed-off");
    expect(raceOutcome(comments, { id: 10, ask: 55 })).toBe("held");
  });

  test("a claim on a DIFFERENT ask does not back this one off", () => {
    const comments = [body(10, 55, 7), body(11, 56, 8)];
    expect(raceOutcome(comments, { id: 11, ask: 56 })).toBe("held");
  });

  test("a claim newer than mine is not consulted — only the older one holds", () => {
    expect(raceOutcome([body(10, 55, 7), body(11, 55, 8)], { id: 10, ask: 55 })).toBe("held");
  });

  test("only took tags count: a remark that mentions an ask is not a claim", () => {
    const comments = [
      { id: 10, body: "about ask 55: the took tag is prose here" },
      body(11, 55, 7),
    ];
    expect(raceOutcome(comments, { id: 11, ask: 55 })).toBe("held");
  });
});

describe("claimCommentBody", () => {
  test("the claim is machinery bookkeeping: excluded from the model's context", () => {
    const body = claimCommentBody({ ask: 55, run: 7 });
    expect(body).toContain("atomaton:llm-context=exclude");
    expect(body).toContain("<!-- atomaton:took=55 run=7 -->");
  });
});
