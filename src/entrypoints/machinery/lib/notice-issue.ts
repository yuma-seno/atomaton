/**
 * notice-issue.ts — the one open issue the notice keeps, and who may close it.
 *
 * `notify_new_release.ts` opens the notice; `update_atomaton.ts` is what makes the
 * notice's promise true, and when it does, the notice should stop standing. Both
 * sides reference the marker, so it lives here with the search that finds the issue
 * wearing it — the one question both sides would otherwise each implement, slightly
 * differently, forever.
 */
import { ghRead } from "../../../adapters/github/gh.ts";

/**
 * The marker that makes the notice findable, and that keeps it to one.
 *
 * A comment rather than a label: labels are the project's to name and this is not,
 * and searching for a comment body needs no label to exist first.
 */
export const NOTICE_MARKER = "<!-- atomaton:new-release -->";

/**
 * The open notice's number, `0` for none, or null when the list could not be read.
 *
 * ## Why the marker is checked here rather than searched for
 *
 * The query is the title's own words, and the marker is then checked in the body in
 * TypeScript. Title words are certainly indexed; a hidden HTML comment is not
 * something this can be sure of from here, and a query the index does not match
 * would leave a run opening a fresh notice every day — the one failure that
 * compounds. Checking the body makes the other direction safe too: an issue whose
 * title happens to match, and which no run of this wrote, is not edited.
 *
 * ## Why the state is filtered here too
 *
 * `--state open` is passed, and the answer is held to it again below. Whether `gh`
 * applies a state filter when `--search` is alongside it is not something this
 * repository can measure — the fake `gh` matches argv and has no search API — and
 * getting it wrong is expensive in one direction: a CLOSED notice read as open would
 * be edited every day instead of a new one being opened after the owner closed it.
 * So the request asks for `state` and the answer is filtered on it, which is correct
 * whichever way the flag behaves.
 */
export function findOpenNotice(repo: string): number | null {
  const result = ghRead(
    "issue", "list", "--repo", repo, "--state", "open",
    "--search", `"Atomaton release" in:title`,
    "--json", "number,body,state",
  );
  if (result.code !== 0) {
    log(`WARN could not look for an existing notice in ${repo}: ${result.stderr.trim() || `gh exited ${result.code}`}`);
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(result.stdout || "[]");
  } catch {
    log(`WARN the issue search in ${repo} did not answer with JSON`);
    return null;
  }
  if (!Array.isArray(parsed)) {
    log(`WARN the issue search in ${repo} did not answer with a list`);
    return null;
  }
  const found = parsed.find((entry) => {
    const issue = entry as { number?: unknown; body?: unknown; state?: unknown };
    // `state` absent is left to the server's own filter; present and not open is
    // not a notice this run may touch.
    return (
      typeof issue.body === "string" &&
      issue.body.includes(NOTICE_MARKER) &&
      (issue.state === undefined || issue.state === "OPEN")
    );
  }) as { number?: unknown } | undefined;
  const number = Number(found?.number ?? 0);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function log(message: string): void {
  console.error(`[notice-issue] ${message}`);
}
