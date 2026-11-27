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
 *
 * `token` is the update lane's PAT, and the notice must pass it. A workflow that
 * declares `permissions` gets `none` for every scope it does not list, and
 * `atomaton-new-release.yml` lists `contents` and `issues` only: on a private
 * repository its own token cannot list pull requests at all. The refusal would come
 * back as this function's `0` -- "no pull request is open" -- and the cron would
 * dispatch the same update every day for as long as the release is waiting. Reading
 * as the identity that may is cheaper than the alternative, which is adding
 * `pull-requests: read` to the permissions of the workflow that writes the notice.
 */
import { ghAs, ghRead } from "../../../adapters/github/gh.ts";

/** The read, as `token` when one is given and as the ambient identity otherwise. */
function listOpenForHead(token: string, repo: string, branch: string) {
  const argv = ["pr", "list", "--repo", repo, "--head", branch, "--state", "open", "--json", "number"] as const;
  return token.trim() === "" ? ghRead(...argv) : ghAs(token.trim(), ...argv);
}

export function openPrForHead(repo: string, branch: string, token = ""): number {
  const result = listOpenForHead(token, repo, branch);
  if (result.code !== 0) {
    // Named rather than swallowed: `0` is the answer that dispatches an update (or
    // opens a second pull request), so the reason it was given belongs in the log of
    // the run that acted on it.
    const why = (result.stderr || result.stdout).split("\n")[0] ?? "";
    console.error(`WARN could not list open pull requests on ${branch}: ${why || `gh exited ${result.code}`}`);
    return 0;
  }
  try {
    const parsed = JSON.parse(result.stdout || "[]") as Array<{ number?: unknown }>;
    const number = Number(parsed[0]?.number ?? 0);
    return Number.isInteger(number) && number > 0 ? number : 0;
  } catch {
    return 0;
  }
}
