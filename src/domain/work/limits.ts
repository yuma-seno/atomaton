/**
 * limits.ts — how a configured limit becomes a number, or the default.
 *
 * ## One rule about zero, across the whole project
 *
 * A limit read from configuration is a positive whole number, or the default. Zero
 * and negatives mean the default rather than "no chains allowed" / "never stop" /
 * "no reloads": a repository that wants none of something says so by removing the
 * tool or setting the limit to `1`, and a reader who learns the rule in one place
 * should not be surprised in another. `infra::timeouts` in atoma made this the rule
 * for timeouts after three call sites took `0` literally.
 *
 * ## Why it is one function
 *
 * It was written four times — `resolveHandoffLimit`, `resolveReloadLimit`,
 * `resolveNoProgressLimit`, and `reloadsSoFar` — each with its own copy of the same
 * `Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback` expression and
 * its own comment pointing at the others. The comments agreed; the code was four
 * chances to disagree.
 *
 * `reloadsSoFar` is the same rule with a fallback of `0` rather than a named default,
 * which is why the fallback is a parameter here rather than baked in.
 */

/**
 * A configured limit as a positive whole number, or `fallback`.
 *
 * Accepts a number or a string, because configuration arrives as YAML (numbers) and
 * as `$GITHUB_OUTPUT` (strings) and both reach the same callers. Anything that is not
 * a finite number above zero — including `undefined`, `""`, `NaN` and a negative —
 * becomes `fallback`.
 */
export function resolveLimit(configured: unknown, fallback: number): number {
  const value = typeof configured === "number" ? configured : Number(String(configured ?? "").trim());
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}
