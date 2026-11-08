import { describe, expect, test } from "bun:test";
import { codeSegments, fenceSegments } from "./fence.ts";

/** The prose only, as one string, for the assertions that do not care about the split. */
function prose(text: string): string {
  return codeSegments(text)
    .map((segment) => (segment.code ? "" : segment.text))
    .join("");
}

describe("where the code is", () => {
  /**
   * A draft quoting a Markdown file is a four-backtick fence holding a three-backtick
   * sample, and GitHub renders it as one code block. The regex this replaced paired
   * the inner three, which made the sample look like prose.
   */
  test("a fence nested in a longer one is one code block", () => {
    const text = ["before", "````markdown", "```text", "@torvalds", "```", "````", "after"].join("\n");
    expect(prose(text)).toBe("before\nafter");
    expect(fenceSegments(text).filter((segment) => segment.code)).toHaveLength(1);
  });

  test("a closer has to be at least as long as its opener", () => {
    const text = ["````", "```", "still code", "````", "after"].join("\n");
    expect(prose(text)).toBe("after");
  });

  test("a fence never closed runs to the end", () => {
    expect(prose("prose\n```\ncode\nmore code")).toBe("prose\n");
  });

  test("tildes and backticks do not close one another", () => {
    expect(prose(["~~~", "```", "~~~", "after"].join("\n"))).toBe("after");
  });

  /** Four spaces of indent is an indented code block, not a fence. */
  test("a fence may be indented by up to three spaces and no more", () => {
    expect(prose("    ```\nafter")).toBe("    ```\nafter");
  });

  test("an inline span is code, and a longer run holds a shorter one", () => {
    expect(prose("run `npm i @scope/pkg` now")).toBe("run  now");
    expect(prose("a ``x `y` z`` b")).toBe("a  b");
  });

  /**
   * An unclosed backtick is text, and does not reach the next line: a stray tick
   * making the next line's name look like code would leave it unescaped.
   */
  test("an unclosed span stays text and does not reach the next line", () => {
    expect(prose("a stray ` backtick\nask @torvalds")).toBe("a stray ` backtick\nask @torvalds");
  });

  /** The two halves of a body are how the parsers are used: rejoining must lose nothing. */
  test("the segments give the argument back byte for byte", () => {
    const text = ["日本語の本文 @0", "", "````markdown", "```text", "@torvalds", "```", "````", "", "`a `b` c` end"].join("\n");
    expect(codeSegments(text).map((segment) => segment.text).join("")).toBe(text);
  });
});
