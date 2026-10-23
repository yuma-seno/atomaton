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

  test("the fix cycle: the re-validated run claims the fresh push comment, not the pushing run's ask", () => {
    // The thread a fix push leaves: the person's command (the engineer's ask, which
    // the engineer claimed and answered by pushing), and the push comment
    // `commit_and_push` posts for the re-validated run to claim. The engineer's
    // claim is OLDER but holds a DIFFERENT ask — the comparison is per-ask, so the
    // reviewer's claim of the push comment holds and the cycle goes. (Quoting the
    // engineer's own ask here was the first cut: the reviewer lost this race every
    // time and the fix cycle was dead.)
    const comments = [
      { id: 10, body: "/engineer fix CI" },
      body(11, 10, 7),
      { id: 12, body: "<!-- atomaton:ended=done answers=10 run=7 -->" },
      body(13, 13, 8), // the push comment, claimed by the run validation dispatches
    ];
    expect(raceOutcome(comments, { id: 13, ask: 13 })).toBe("held");
  });

  test("two runs for one push comment race on it the way they race on a command", () => {
    const comments = [body(13, 13, 8)];
    expect(raceOutcome(comments, { id: 14, ask: 13 })).toBe("backed-off");
    expect(raceOutcome(comments, { id: 13, ask: 13 })).toBe("held");
  });

  test("only took tags count: a remark that mentions an ask is not a claim", () => {
    const comments = [
      { id: 10, body: "about ask 55: the took tag is prose here" },
      body(11, 55, 7),
    ];
    expect(raceOutcome(comments, { id: 11, ask: 55 })).toBe("held");
  });

  // The tag decides a claim, and the fence decides it is a sample (#304): a comment
  // quoting a took tag inside a code block has claimed nothing, so this run holds.
  test("a took tag quoted in a fenced sample does not back this run off", () => {
    const comments = [
      { id: 10, body: ["The claim format:", "```html", "<!-- atomaton:took=55 run=7 -->", "```"].join("\n") },
      body(11, 55, 8),
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
