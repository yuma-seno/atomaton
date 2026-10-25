import { describe, expect, test } from "bun:test";
import { readCommentBody } from "./comment-body.ts";

/** A body whose characters differ from one another, so a wrong offset shows up. */
const patterned = (length: number) =>
  Array.from({ length }, (_, i) => String.fromCharCode(97 + (i % 26))).join("");

describe("readCommentBody", () => {
  test("a body that fits comes back whole and unmarked", () => {
    const segment = readCommentBody("the whole comment", { index: 2, budget: 100 });
    expect(segment.text).toBe("the whole comment");
    expect(segment.next).toBeUndefined();
  });

  test("a cut body says how much it dropped and the offset that reads the rest", () => {
    const body = patterned(2_000);
    const segment = readCommentBody(body, { index: 3, budget: 500 });
    expect(segment.text.length).toBeLessThanOrEqual(500);
    expect(segment.text.startsWith(body.slice(0, 200))).toBe(true);
    expect(segment.text).toContain("dropped from the end");
    expect(segment.text).toContain("from: 3, body_offset:");
    expect(segment.next).toBeGreaterThan(0);
    expect(segment.next).toBeLessThan(body.length);
  });

  // The defect this module exists for: the cut named a count and no way to read
  // past it, so the tail of a long comment was unreachable through the tool.
  test("each offset it names reads the next characters, and the last part reaches the end", () => {
    const body = patterned(3_000);
    const budget = 500;
    const parts: { offset: number; text: string; next?: number }[] = [];
    let offset = 0;
    while (parts.length < 100) {
      const segment = readCommentBody(body, { index: 1, budget, offset });
      parts.push({ offset, ...segment });
      if (segment.next === undefined) break;
      offset = segment.next;
    }

    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) expect(part.text.length).toBeLessThanOrEqual(budget);
    // Every part but the last names the offset of the next one.
    for (const part of parts.slice(0, -1)) {
      expect(part.text).toContain(`body_offset: ${part.next}`);
      expect(part.text).not.toContain("this is the last part");
    }
    // Each continuation starts where the previous one stopped, so nothing is
    // skipped between segments.
    for (let i = 1; i < parts.length; i += 1) {
      const previous = parts[i - 1]!;
      const part = parts[i]!;
      expect(previous.next).toBeDefined();
      expect(part.offset).toBe(previous.next!);
      expect(part.text).toContain(`continuing comment 1 at character ${part.offset + 1}`);
    }
    const last = parts[parts.length - 1]!;
    expect(last.next).toBeUndefined();
    expect(last.text).toContain("this is the last part");
    expect(last.text.endsWith(body.slice(-40))).toBe(true);
    // No segment claims there is more when there is not.
    expect(last.text).not.toContain("body_offset");
  });

  test("a continuation is labelled, so a middle does not read as an opening", () => {
    const segment = readCommentBody(patterned(100), { index: 4, budget: 1_000, offset: 40 });
    expect(segment.text).toContain("continuing comment 4 at character 41 of 100");
    expect(segment.next).toBeUndefined();
  });

  test("an empty body is returned as empty rather than as a marker", () => {
    const segment = readCommentBody("", { index: 1, budget: 100 });
    expect(segment.text).toBe("");
    expect(segment.next).toBeUndefined();
  });
});
