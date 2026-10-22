import { describe, expect, test } from "bun:test";
import { parseRunTitle, needsEnding, lastEndingComment, releasesLabel, type DatedComment } from "./run-report.ts";
import { endingWalkReaders } from "../../adapters/github/thread.ts";

/**
 * The run watch's judgement, asked of strings alone. The readers are the REAL
 * ones (`endingWalkReaders`), because the mapping under test — that `done`,
 * `stopped` and `limit` return the node, that `handoff` keeps it, that a guard
 * quotation is nobody's ending — is the mapping the thread machinery itself
 * uses, and a test's own copy of it would test the copy.
 */

const START = "2026-10-22T10:00:00Z";

function comment(body: string, createdAt: string): DatedComment {
  return { body, createdAt };
}

function commentsWith(...bodies: string[]): DatedComment[] {
  // Timestamped a full day BEFORE the usual run start, unless a test names its own.
  return bodies.map((body, index) => comment(body, `2026-10-2${index}T09:00:00Z`));
}

describe("parseRunTitle", () => {
  test("reads the runner's run-name shape", () => {
    expect(parseRunTitle("engineer on #252")).toEqual({ agent: "engineer", number: 252 });
  });

  test("tolerates surrounding whitespace", () => {
    expect(parseRunTitle("  reviewer on #17 \n")).toEqual({ agent: "reviewer", number: 17 });
  });

  test("reads nothing in the runner's own name, which every run carried before run-name", () => {
    expect(parseRunTitle("Atomaton Runner")).toBeUndefined();
  });

  test("reads nothing in a title that is not this machinery's", () => {
    expect(parseRunTitle("deploy: apply v0.21.22 to .github/")).toBeUndefined();
    expect(parseRunTitle("engineer on #abc")).toBeUndefined();
    expect(parseRunTitle("on #252")).toBeUndefined();
    expect(parseRunTitle("engineer on #252 extra")).toBeUndefined();
    expect(parseRunTitle("")).toBeUndefined();
    expect(parseRunTitle(undefined)).toBeUndefined();
  });

  test("reads nothing in a node number that cannot exist", () => {
    expect(parseRunTitle("engineer on #0")).toBeUndefined();
    expect(parseRunTitle("engineer on #-3")).toBeUndefined();
  });
});

describe("needsEnding", () => {
  test("a thread with no ending at all needs one", () => {
    expect(needsEnding([], START, endingWalkReaders)).toBe(true);
    expect(needsEnding(commentsWith("just a remark", "/engineer"), START, endingWalkReaders)).toBe(true);
  });

  test("an ending at or after the run's start means the run reported", () => {
    const comments = commentsWith("<!-- atomaton:ended=done -->\nDone.");
    // One-turn-per-node: the newest ending is the only one that can answer for
    // this run, so "at the start" and "after it" are the same answer.
    expect(needsEnding(comments, "2026-10-20T09:00:00Z", endingWalkReaders)).toBe(false);
    expect(needsEnding(comments, "2026-10-20T08:59:59Z", endingWalkReaders)).toBe(false);
  });

  test("an ending from before the run does not count for it", () => {
    const comments = commentsWith("<!-- atomaton:ended=done -->\nDone.");
    expect(needsEnding(comments, START, endingWalkReaders)).toBe(true);
  });

  test("the newest ending is the one asked", () => {
    const comments = [
      comment("<!-- atomaton:ended=done -->\nOld.", "2026-10-19T09:00:00Z"),
      comment("<!-- atomaton:ended=waiting -->\nChild running.", "2026-10-23T09:00:00Z"),
    ];
    expect(needsEnding(comments, START, endingWalkReaders)).toBe(false);
  });

  test("an ended tag inside a guard quotation is the deleted author's words, not an ending", () => {
    const quotation = [
      "<!-- atomaton:llm-context=exclude -->",
      "<!-- atomaton:quotes=123 -->",
      "Your comment was removed because the ball is with an agent on this issue/PR.",
      "<details><summary>Your comment, as you wrote it</summary>",
      "",
      "```",
      "<!-- atomaton:ended=done -->",
      "```",
      "",
      "</details>",
    ].join("\n");
    // The quotation is the only thing on the thread that looks like an ending, and
    // it came from the run's own lifetime — a walk that read it would stay silent
    // on the jam this module exists to end.
    expect(needsEnding(commentsWith(quotation), START, endingWalkReaders)).toBe(true);
    expect(lastEndingComment(commentsWith(quotation), endingWalkReaders)).toBeUndefined();
  });

  test("an ending whose time cannot be read does not excuse the run", () => {
    expect(needsEnding(commentsWith("<!-- atomaton:ended=done -->"), START, endingWalkReaders)).toBe(true);
    const comments = [comment("<!-- atomaton:ended=done -->\nDone.", START)];
    expect(needsEnding(comments, undefined, endingWalkReaders)).toBe(true);
    expect(needsEnding(comments, "not a timestamp", endingWalkReaders)).toBe(true);
  });
});

describe("releasesLabel", () => {
  const at = "2026-10-22T09:00:00Z";

  test("releases on every ending that returned the node or left it waiting on a child", () => {
    for (const ended of ["done", "stopped", "limit", "waiting"]) {
      expect(releasesLabel(comment(`<!-- atomaton:ended=${ended} -->`, at), endingWalkReaders), ended).toBe(true);
    }
  });

  test("holds on a hand-off, the one ending that leaves the turn with an agent", () => {
    expect(releasesLabel(comment("<!-- atomaton:ended=handoff -->", at), endingWalkReaders)).toBe(false);
  });

  test("holds when the thread names no ending this rule can read", () => {
    expect(releasesLabel(undefined, endingWalkReaders)).toBe(false);
    expect(releasesLabel(comment("just a remark", at), endingWalkReaders)).toBe(false);
  });
});
