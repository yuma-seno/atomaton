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

  /**
   * #499: four spaces at the start of a block is an indented code block on GitHub,
   * so a fence quoted that way pairs up and is one code block. This used to be
   * prose, which put backticks inside the sample.
   */
  test("an indented fence at a block start is code", () => {
    const text = ["before", "", "    ```", "    commit by @torvalds", "    ```", "after"].join("\n");
    expect(prose(text)).toBe("before\n\nafter");
    expect(fenceSegments(text).filter((segment) => segment.code)).toHaveLength(1);
  });

  /** The same shape under a list item, where the indent is the item's content column. */
  test("an indented fence under a list item is code when it pairs up", () => {
    const text = ["1. step", "", "    ```sh", "    npm i @scope/pkg", "    ```", "after"].join("\n");
    expect(prose(text)).toBe("1. step\n\nafter");
  });

  /** A fence right after the item's marker, with no blank line, is still a fence. */
  test("an indented fence right after a list marker is code", () => {
    const text = ["- step", "    ```", "    @torvalds", "    ```", "after"].join("\n");
    expect(prose(text)).toBe("- step\nafter");
  });

  /**
   * The conservative side, pinned. Four spaces after a paragraph line continue the
   * paragraph, so the fence lines are text and a mention in them notifies. Reading
   * this as code would leave a stranger unescaped.
   */
  test("an indented fence that continues a paragraph stays prose", () => {
    const text = ["This is prose", "    ```", "    @torvalds", "    ```", "after"].join("\n");
    expect(prose(text)).toBe(text);
  });

  /** Without a closer there is no pair, so the safe side remains prose. */
  test("an unclosed indented fence stays prose", () => {
    expect(prose("    ```\n    @torvalds\nafter")).toBe("    ```\n    @torvalds\nafter");
  });

  /** Tildes pair the same way, and a longer closer closes a shorter opener. */
  test("indented tilde fences and longer closers pair", () => {
    expect(prose(["    ~~~", "    @torvalds", "    ~~~~", "after"].join("\n"))).toBe("after");
  });

  /**
   * The pair has to sit in one block. A line out at the margin ends the indented
   * code, so the fence below it opens a new block; reading across would call the
   * margin line code and leave a mention in it unescaped.
   */
  test("a line out at the margin ends the indented block, so there is no pair", () => {
    const text = ["    ```", "prose by @torvalds", "    ```", "after"].join("\n");
    expect(prose(text)).toBe(text);
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

  /**
   * `> ``` ` is a code block on GitHub, so reading it as prose would put backticks
   * inside a sample somebody is meant to read -- the failure this module exists for.
   */
  test("a fence inside a blockquote is code", () => {
    const text = ["Quoted:", "> ```", "> commit by @torvalds", "> ```", "after"].join("\n");
    expect(prose(text)).toBe("Quoted:\nafter");
  });

  /** A quote that ends takes its fence with it: the lines after are prose again. */
  test("a fence does not outlive the blockquote it opened in", () => {
    const text = ["> ```", "> code", "", "and @torvalds here"].join("\n");
    expect(prose(text)).toBe("\nand @torvalds here");
  });

  test("a doubly quoted fence is code too", () => {
    expect(prose([">> ```", ">> code", ">> ```", "after"].join("\n"))).toBe("after");
  });

  /** The issue's shape one container along: indented code inside a blockquote. */
  test("an indented fence inside a blockquote is code too", () => {
    const text = ["Quote:", ">     ```", ">     @torvalds", ">     ```", "after"].join("\n");
    expect(prose(text)).toBe("Quote:\nafter");
  });

  /** A `>` written inside the sample is sample text, not the quote's own marker. */
  test("a marker deeper than the opener is part of the sample", () => {
    expect(prose(["> ```", "> > quoted run", "> ```", "after"].join("\n"))).toBe("after");
  });
});
