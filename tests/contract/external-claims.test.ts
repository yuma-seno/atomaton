/**
 * external-claims.test.ts — what this tree says about systems outside it, held to
 * the one property that makes a claim about somebody else's service checkable: the
 * text names the signal that would show the claim has stopped being true.
 *
 * ## Why the sentence is not what is asserted
 *
 * A claim about GitHub, an upload endpoint or a search engine is a measurement, and
 * it goes stale without a line of this repository changing. Pinning the paragraph
 * would make the prose a test fixture — rewording a correct paragraph would fail,
 * and correcting a wrong one would fail too, which is the wrong direction for a
 * test that exists because a paragraph went stale and nobody noticed. So the one
 * thing pinned is the NAME of the signal, `A successful call is not an answer`, and
 * only where that signal is what the place is teaching. Everything around the name
 * is free to be rewritten by whoever measured something new.
 *
 * ## The second check is the same failure, already realised
 *
 * `docs/tools/reference.md` offered `delegate_free` and `delegate_readonly_free` as
 * tools long after the roster had renamed those folders to `delegate_large` and
 * `delegate_readonly_large`. Nothing read that page against the roster, so nothing
 * said so; the page described two tools no run has. The check below reads it
 * against the roster, and catches the class rather than those two strings: a
 * backticked name that begins with `delegate` and is neither a roster server nor a
 * folder in it is a name an agent would call and get `unknown tool` back.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

/** The name of the signal, written once here so the places that teach it agree. */
const SUCCESS_IS_NOT_AN_ANSWER = "A successful call is not an answer";

/**
 * The places that teach it, one per road a run reaches the failure by:
 *
 * - `fetch`'s own description, read by every run that has just called it;
 * - the search skill, where the refusal arrives as a `200` with a normal
 *   `content-type` and the answer is a page with no links in it;
 * - the credential skill, where a status code was being read as proof that a route
 *   exists — the same mistake, in the place that tells a run what a check can
 *   conclude.
 *
 * Adding a place is a decision: the name is worth nothing if it is sprinkled where
 * the signal is not what is being taught.
 */
const TEACHES_THE_SIGNAL = [
  "src/entrypoints/tools/mcp/web.ts",
  "src/content/skills/research/web-search.md",
  "src/content/skills/engineering/secrets-in-a-check.md",
];

describe("a claim about a system outside this repository", () => {
  test.each(TEACHES_THE_SIGNAL)("%s names the signal the reader will see", (file) => {
    // Rewrapped prose is not a change to the name, so line breaks are collapsed
    // before the comparison: a paragraph that is re-flowed still teaches it.
    const text = readFileSync(file, "utf8").replace(/\s+/g, " ");
    expect(
      text,
      `${file} teaches that a successful call can be a failure, and has to name it ` +
        "the way the other places do — the name is the only part of the lesson a reader " +
        "carries from one file to the next",
    ).toContain(SUCCESS_IS_NOT_AN_ANSWER);
  });
});

/**
 * The pages that tell a person which delegate tools exist. Both doors: the README
 * ships into the adopter's tree, and the reference is what a reader reaches from
 * `config.yaml`'s own comments.
 */
const DELEGATE_PAGES = ["docs/tools/reference.md", "src/content/README.md"];

/** A backticked name that could be one of the delegate tools. */
const DELEGATE_TOKEN = /`(delegate(?:_[a-z]+)*)`/g;

describe("the delegate tools a page names", () => {
  // The roster is the source of truth for which exist: a folder is a tool, which is
  // why these four names appear twice here rather than in a list in the test.
  const roster = Bun.YAML.parse(readFileSync("src/content/delegates/delegates.yaml", "utf8")) as Record<
    string,
    string[]
  >;
  const KNOWN = new Set([...Object.keys(roster), ...Object.values(roster).flat()]);

  test.each(DELEGATE_PAGES)("%s names only names the roster has", (page) => {
    const named = [...readFileSync(page, "utf8").matchAll(DELEGATE_TOKEN)].map((m) => m[1]!);
    expect(named.length, `${page} names no delegate at all; check the pattern`).toBeGreaterThan(0);

    const unknown = [...new Set(named)].filter((name) => !KNOWN.has(name));
    expect(
      unknown,
      `${page} names a delegate that is not in src/content/delegates/delegates.yaml. ` +
        "A name here is what a reader asks for, and the roster is the only list of what " +
        "answers — rename the page in the same change that renames the folder.",
    ).toEqual([]);
  });
});
