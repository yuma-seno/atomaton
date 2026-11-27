/**
 * open-pull-request.ts — the pull request standing open on a head branch, as both
 * halves of the update lane ask it.
 *
 * The update run asks before it opens one, so a second run edits the pull request
 * it already made instead of failing on a duplicate. The notice asks before it
 * dispatches an update at all, so a daily cron does not start a run per day for a
 * release that is still waiting on one pull request.
 *
 * The answer is a number, `0` for none, and never an exception: a read that fails is
 * not evidence that no pull request exists, so each caller gets to decide -- the
 * update opens or edits as though none is there (which is recoverable), and the
 * notice dispatches rather than silently skipping a release.
 */
import { ghRead } from "../../../adapters/github/gh.ts";

export function openPrForHead(repo: string, branch: string): number {
  const result = ghRead(
    "pr", "list", "--repo", repo, "--head", branch, "--state", "open", "--json", "number",
  );
  if (result.code !== 0) return 0;
  try {
    const parsed = JSON.parse(result.stdout || "[]") as Array<{ number?: unknown }>;
    const number = Number(parsed[0]?.number ?? 0);
    return Number.isInteger(number) && number > 0 ? number : 0;
  } catch {
    return 0;
  }
}
