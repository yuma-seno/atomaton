/**
 * path-patterns.ts — the one path-pattern form Atomaton's configuration accepts.
 *
 * A pattern is a literal path, or a directory followed by `/**`, optionally
 * prefixed with `!` to exclude instead of cover. That is all.
 * Deliberately not a glob library, and the reason is not laziness: a
 * half-implemented glob is read as a full one. Someone writes `**\/*.sql`,
 * matches nothing, and their gate silently never fires -- which is worse than no
 * gate at all, because they believe they have one.
 *
 * So the form is small AND checked. `pathPatternProblem` rejects anything this
 * matcher cannot honour, and both callers -- `merge.gates` and
 * `merge.governed_paths` -- report that as a configuration problem rather than
 * matching zero files and carrying on. A pattern that cannot work says so at the
 * moment it is read.
 *
 * `merge.governed_paths` was not checked for a while, and the header here claimed it
 * was. That is the worse half of the same mistake: a gate over the agent's own
 * limits, silently matching nothing, under a comment saying it could not.
 *
 * `!` was the third version of it. It passed this check as an ordinary filename
 * character, so `!.github/atomaton/skills/**` looked accepted and matched nothing --
 * an exclusion that excluded nothing, which is exactly the fail-open the setting
 * exists to prevent. The prefix is now part of the form, refused when it is alone
 * or doubled, and a list is read with the last match winning (`pathClaimedBy`), so
 * the exclusion means what it says.
 *
 * Extracted from `merge-readiness.ts`, where `governedPathsIn` had the matcher
 * inline. `merge.gates` needed the same one, and two copies of a security-shaped
 * comparison is exactly the arrangement that drifts.
 */

/**
 * Whether `pattern` claims `file`, read as a positive pattern.
 *
 * `!x` is not this function's question and it answers it by claiming nothing:
 * whether a file is excluded depends on what else the list says, so it is
 * `pathClaimedBy` that reads a declared list. Handing a configuration list to this
 * function directly is how `!` used to pass validation and change nothing.
 */
export function pathMatches(file: string, pattern: string): boolean {
  return pattern.endsWith("/**") ? file.startsWith(pattern.slice(0, -2)) : file === pattern;
}

/** The character that turns a pattern into an exclusion. */
const NEGATION = "!";

/** Whether `pattern` excludes rather than covers. */
function pathPatternNegates(pattern: string): boolean {
  return pattern.startsWith(NEGATION);
}

/**
 * The positive pattern an exclusion is written around, or the pattern itself.
 *
 * One prefix is all there is to remove: `pathPatternProblem` has already refused a
 * bare `!` and a doubled `!!` by the time a pattern reaches a matcher.
 *
 * Exported so a reader asking "does this entry name anything real" strips the
 * prefix the same way the matcher does, rather than with a second `slice(1)` beside
 * a rule that would then need changing in two places.
 */
export function pathPatternTarget(pattern: string): string {
  return pathPatternNegates(pattern) ? pattern.slice(NEGATION.length) : pattern;
}

/**
 * Whether `file` is claimed by `patterns`, read in order with the last match
 * winning — the rule `.gitignore` uses, and for the same reason: it is the only
 * ordering under which a narrow exclusion can be carved out of a broad pattern
 * without restating everything that stays covered.
 *
 * A file no pattern matches is not claimed. That keeps a list of nothing but
 * exclusions from claiming every file, which would be the same kind of silent
 * surprise reached from the other side.
 *
 * `pathMatches` itself reads the positive form only: given `!x` it compares a
 * filename literally, which matches nothing. Anything that hands a configuration
 * list to `pathMatches` and stops there is reading the exclusions as no-ops.
 */
export function pathClaimedBy(file: string, patterns: readonly string[]): boolean {
  let claimed = false;
  for (const pattern of patterns) {
    if (pathMatches(file, pathPatternTarget(pattern))) claimed = !pathPatternNegates(pattern);
  }
  return claimed;
}

/**
 * Why `patterns` cannot be read as a list, or "" when it can.
 *
 * A pattern's own form is `pathPatternProblem`'s question; this is the one only the
 * whole list can answer. An exclusion takes a file back out of a pattern before it
 * *in the same list*, so a list made only of exceptions matches nothing — and a
 * list that matches nothing reads as "everything except this" to whoever wrote it,
 * while behaving as "nothing at all". A condition that never fires looks exactly
 * like a condition nobody needed; the gate it belongs to might as well not be
 * declared. `[]` is how a setting is turned off, so this is refused rather than
 * interpreted.
 */
export function pathPatternListProblem(patterns: readonly string[]): string {
  if (patterns.length === 0 || !patterns.every(pathPatternNegates)) return "";
  return (
    "every pattern is an exclusion, so the list matches nothing. An exclusion takes " +
    'a file back out of a pattern before it in the same list, so name what it covers first.'
  );
}

/**
 * Why `pattern` is not one `pathMatches` can honour, or "" when it is fine.
 *
 * The wildcard check is the point. A trailing `/**` is the supported form; a `*`
 * anywhere else -- `**\/*.sql`, `db/*\/migrations/**`, `*.ts` -- would be compared
 * literally and match nothing.
 */
const GLOB_CHARACTERS = /[*?[\]{}]/;

export function pathPatternProblem(pattern: string): string {
  if (typeof pattern !== "string" || pattern.trim() === "") {
    return "a path pattern must be a non-empty string";
  }
  if (pattern !== pattern.trim()) {
    return `"${pattern}" has surrounding whitespace`;
  }

  // The prefix comes off before every check below, so an exclusion is held to
  // exactly the rules its positive form is -- `!db/migrations/` is refused for the
  // reason `db/migrations/` is. Two spellings are refused outright. `!` alone
  // negates nothing, and left to the checks below it would be read as a file named
  // "!": accepted, matching nothing, which is this function's whole subject. `!!x`
  // is the same mistake written twice, and a matcher that strips one prefix would
  // read what is left as a file named `!x`.
  if (pattern === NEGATION) {
    return `"${pattern}" is a bare "!", which negates no pattern. Write "!<pattern>" naming what to exclude.`;
  }
  if (pattern.startsWith(NEGATION + NEGATION)) {
    return (
      `"${pattern}" starts with "!!". One "!" negates the pattern after it; ` +
      "a second one is not a form this matcher has, so this would match nothing."
    );
  }
  const target = pathPatternTarget(pattern);
  if (target !== target.trim()) {
    return `"${pattern}" has whitespace between the "!" and the pattern it negates`;
  }

  // A trailing slash is the ordinary way a person writes a directory, and it is
  // the one spelling that looks right and claims nothing: `pathMatches` sees no
  // `/**`, falls through to the literal comparison, and no file is ever named
  // with a trailing slash. Caught before the glob check so the message can name
  // the fix rather than the character.
  if (target.endsWith("/")) {
    return (
      `"${pattern}" ends in a slash, so it would match nothing. ` +
      `Write "${pattern}**" for everything under it, or drop the slash to match that one path.`
    );
  }

  // Everything except a trailing `/**` is compared literally, so any other glob
  // character is a pattern that reads as a glob and behaves as a filename. A
  // literal path containing one of these is refused too: it could in principle
  // be matched, but telling the two apart needs intent this cannot see, and a
  // refusal a person fixes beats a gate that quietly never fires.
  const body = target.endsWith("/**") ? target.slice(0, -3) : target;
  if (body === "") {
    return `"${pattern}" names no directory. Write the directory before the "/**".`;
  }
  const glob = GLOB_CHARACTERS.exec(body);
  if (glob) {
    return (
      `"${pattern}" uses the glob character '${glob[0]}', which this matcher cannot honour, ` +
      'so it would match nothing. Write a literal path, or a directory followed by "/**".'
    );
  }
  return "";
}
