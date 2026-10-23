/**
 * removed-comment.ts — the words of a comment the machinery deleted, kept on the page.
 *
 * Two notices remove a person's comment: the in-progress/commands guard and the stop
 * path. In both, the comment is gone so it cannot join a session, and in both the
 * person who wrote it should still be able to read what they wrote and put it back.
 * The block lives here so the two notices cannot drift into two ideas of "preserved".
 */

/**
 * Ceiling on the preserved text, so the notice stays well under GitHub's 65,536-character
 * limit on a comment body even when the removed comment did not.
 */
export const MAX_PRESERVED_CHARS = 30_000;

/**
 * A code fence one run longer than the longest run of backticks in `text`.
 *
 * The fence is what keeps the quoted text verbatim. A comment that itself contains a
 * fence -- somebody's own code block, exactly the thing worth preserving -- closes an
 * ordinary triple fence early, and everything after it leaves the block and is read as
 * this notice's speech. One longer than the longest run in the text closes last. The
 * floor is three: the ordinary fence, for a body carrying none.
 */
export function fenceFor(text: string): string {
  let longest = 0;
  for (const run of text.match(/`+/g) ?? []) longest = Math.max(longest, run.length);
  return "`".repeat(Math.max(3, longest + 1));
}

/**
 * The `<details>` block that keeps a removed comment's text, wrapped in a fence that
 * closes last.
 *
 * Returned as lines for the caller to append to its own notice, which is where the
 * `llm-context=exclude` and `quotes` tags go: this block is the quotation, not the
 * notice. The comment's id is not taken here -- the caller writes the tag, because it
 * is the one that knows whether the comment was actually deleted.
 */
export function preservedCommentBlock(original: string): string[] {
  const truncated = original.length > MAX_PRESERVED_CHARS;
  const kept = truncated ? original.slice(0, MAX_PRESERVED_CHARS) : original;
  const fence = fenceFor(kept);
  return [
    "<details><summary>Your comment, as you wrote it</summary>",
    "",
    fence,
    kept,
    fence,
    ...(truncated ? ["", `The comment was longer than ${MAX_PRESERVED_CHARS.toLocaleString("en-US")} characters; the rest is not preserved here.`] : []),
    "",
    "</details>",
  ];
}
