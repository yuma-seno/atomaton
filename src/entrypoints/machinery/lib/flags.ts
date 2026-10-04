/**
 * flags.ts — reading a boolean out of `$GITHUB_OUTPUT` / `--flag` text.
 *
 * A workflow step passes a boolean as the string `"true"` or `"false"`, and a script
 * reads it back. The comparison was written eight times across five scripts, each as
 * its own `=== "true"` or a local `isTrue`, and the copies had begun to differ in how
 * they handled an absent value (`?? ""` in some, not in others).
 *
 * One function, so "what counts as true" is one answer. Anything that is not exactly
 * `"true"` is false, including absent — a flag nobody set is not a flag that was set.
 */

/** Whether a workflow flag is set. Only the exact string `"true"` is true. */
export function isTrue(value: string | undefined): boolean {
  return value === "true";
}
