import { describe, expect, test } from "bun:test";
import { closingKeywordRefusal, closingReferences, dedupeByNumber, partOfLine } from "./issue-links.ts";

/**
 * The line a pull request carries to say which issue it belongs to.
 *
 * `Closes #N` used to be written here and is deliberately not any more (#171): GitHub
 * acts on a closing keyword by closing the issue, so a link and a close could not be
 * separated by choosing one. What is left is a line no keyword matches, which produces
 * the cross-reference a person reads and nothing GitHub acts on.
 */
describe("partOfLine", () => {
  test("names the issue and matches none of GitHub's closing keywords", () => {
    expect(partOfLine(166)).toBe("Part of #166");
    expect(closingReferences(partOfLine(166)), "a keyword here would close the issue").toEqual([]);
  });

  test("the words a reader would reach for are all keywords, so this is not one of them", () => {
    // Stated as a test rather than a comment because the next person's first instinct
    // is to make it read better, and every better-reading verb is one GitHub acts on.
    for (const verb of ["Closes", "Closes", "Fixes", "Resolves"]) {
      expect(closingReferences(`${verb} #7`), verb).not.toEqual([]);
    }
  });
});

describe("dedupeByNumber", () => {
  test("keeps the first mention, so an authoritative source wins", () => {
    const declared = [{ number: 9, merged: true }];
    const referenced = [{ number: 9, merged: false }, { number: 4, merged: false }];
    expect(dedupeByNumber(declared, referenced)).toEqual([
      { number: 4, merged: false },
      { number: 9, merged: true },
    ]);
  });

  test("survives having nothing to merge", () => {
    expect(dedupeByNumber<{ number: number }>([], [])).toEqual([]);
  });
});

/**
 * The guard's own reader, which has to catch forms a reader deliberately does not.
 *
 * A reader asking "which issue does this name" answers about issues in this
 * repository, so a cross-repository reference is correctly invisible to it. A rule
 * about what an agent may write cannot share that blind spot: a keyword aimed at another
 * repository closes an issue nothing here will ever show.
 */
describe("closingReferences", () => {
  /** Checked against GitHub's documentation, not remembered. */
  test("every keyword GitHub documents, and only those", () => {
    expect(
      closingReferences("close #1 closed #2 fix #3 fixes #4 fixed #5 resolve #6 resolves #7 resolved #8 closes #9"),
    ).toHaveLength(9);
    expect(closingReferences("addresses #1 completes #2 see #3 issue #4")).toEqual([]);
  });

  test("the forms GitHub accepts around the keyword", () => {
    expect(closingReferences("CLOSES: #10")).toEqual(["CLOSES: #10"]);
    expect(closingReferences("Closes:  #10")).toEqual(["Closes:  #10"]);
  });

  /** The dangerous one: it closes an issue nothing in this repository will show. */
  test("a cross-repository reference is found", () => {
    expect(closingReferences("Fixes octo-org/octo-repo#100")).toEqual(["Fixes octo-org/octo-repo#100"]);
  });

  test("several in one line, as GitHub's own example writes them", () => {
    expect(closingReferences("Resolves #10, resolves octo-org/octo-repo#100")).toEqual([
      "Resolves #10",
      "resolves octo-org/octo-repo#100",
    ]);
  });

  /**
   * Documentation explaining the rule is not an attempt to break it, and a rule that
   * could not be written down in its own docs would be unusable.
   */
  test("code is left alone", () => {
    expect(closingReferences("write `Closes #1` in the body")).toEqual([]);
    expect(closingReferences("```\nCloses #1\n```")).toEqual([]);
  });

  test("the same reference twice is reported once", () => {
    expect(closingReferences("Closes #1 and Closes #1")).toEqual(["Closes #1"]);
  });
});

describe("closingKeywordRefusal", () => {
  test("nothing found, nothing said", () => {
    expect(closingKeywordRefusal([], "pull request body")).toBeUndefined();
  });

  /**
   * A refusal rather than an escape, and it has to name the route that works: measured
   * three times in this project, a refusal saying what to do instead is followed and one
   * that only states a rule is not.
   */
  test("it quotes what it found and names the tool to use", () => {
    const refusal = closingKeywordRefusal(["Closes #1"], "pull request body")!;
    expect(refusal).toContain('"Closes #1"');
    expect(refusal).toContain("pull request body");
    expect(refusal).toContain("close_issue");
    expect(refusal).toContain("added for you");
  });
});
