/**
 * pull-request.ts — read a pull request by number, once.
 *
 * ## The failure this exists for
 *
 * "This pull request" was read thirteen times across six files (#345): eight
 * `gh pr view` calls each spelling its own `--json` list, three reads of the REST object
 * (`gh api repos/<repo>/pulls/<n>`, two of them projected with `--jq`), and two
 * spellings of the diff — `gh pr diff` in the tool server and a raw
 * `gh api ... -H Accept: application/vnd.github.v3.diff` in the event fetch. Every one
 * of them was a correct-looking line, and nothing could see the set. What differed was
 * not only the projection: `merge-signals.ts` retried a transient failure and
 * `pr-head-branch.ts` did not, so the same blip degraded one answer and ended another.
 *
 * The projection IS a real difference and stays one. A caller that wants
 * `{title, headRefName}` and a caller that wants the pull request whole are asking
 * different questions of one object, so the fields are an argument here rather than a
 * reason for a second read. What is NOT an argument is where the read happens, whether
 * it is retried, or what its failure is called.
 *
 * ## What a failure means is the caller's
 *
 * The read answers `{ known, value }` or `{ known: false, why }`, the way
 * `branch-reads.ts` answers about refs, because "GitHub said there is no such pull
 * request" and "GitHub could not be read" are different answers and only the first is
 * a fact anything may be based on. What a caller does with the second stays with the
 * caller: `merge-signals.ts` refuses the merge, `pr-head-branch.ts` returns a refusal
 * that quotes the reason, `workspace-scope.ts` falls back to a private workspace, and
 * `mcp/github.ts` fails the tool. This module never decides that, and never throws on a
 * caller's behalf except through `readPullRequestOrThrow`, which is the caller saying
 * so in one word.
 *
 * ## Why every read here retries
 *
 * `ghRead`, not `gh`: a transient failure is the absence of an answer, and a read that
 * gives up on one turns a blip into a decision — the merge refused, the branch not
 * checked out, the agent given no pull request. `looksTransient` decides what a blip
 * is; this module only says that every one of these reads outlasts one.
 *
 * ## What this module does not read
 *
 * A *sub-resource* of a pull request is a different question with its own endpoint and
 * its own paging, so each stays where it is asked and says why: the changed-files list
 * (`merge-signals.ts`), the reviews and the inline review comments
 * (`fetch_events.ts`, `mcp/github.ts`). The review comments are the closest call, and
 * they are still a list — `pulls/<n>/comments`, paged — read in one place for a reviewer
 * and in another for the model's context, with a different projection at each.
 */
import { ghRead, type RunResult } from "./gh.ts";

/**
 * The fields to ask a pull request for: the comma-separated list `gh --json` takes, or
 * the names it is built from.
 *
 * Both forms, because one field reads better as one word and six read better as a list —
 * and either way there is one place that joins them, so no caller assembles a projection
 * out of its own punctuation.
 */
export type PullRequestFields = string | readonly string[];

/**
 * What one read of a pull request answered.
 *
 * `known: false` is a read that did not happen, and `why` says so in the words of the
 * read and of GitHub. It is deliberately not a `null` value: every caller answers a
 * failed read differently, and a caller that had to tell `null` from "no such pull
 * request" would be reading the difference from the wrong place.
 */
export type PullRequestRead<T> =
  | { readonly known: true; readonly value: T }
  | { readonly known: false; readonly why: string };

/** The pull request's diff, or why it could not be read. */
export type PullRequestDiffRead =
  | { readonly known: true; readonly diff: string }
  | { readonly known: false; readonly why: string };

function viewArgs(repo: string, number: number, fields: PullRequestFields): string[] {
  const json = typeof fields === "string" ? fields : fields.join(",");
  return ["pr", "view", String(number), "--repo", repo, "--json", json];
}

/**
 * Why a read is not an answer, naming the read.
 *
 * The read is named because GitHub's message does not: `Resource not accessible by
 * integration (HTTP 403)` says nothing about which call produced it, and a failure an
 * agent cannot act on is worth as little as the read it came from.
 */
function whyNot(what: string, result: RunResult): string {
  return `${what}: ${result.stderr || result.stdout || `gh exited ${result.code}`}`;
}

/**
 * The fields `fields` names, from `gh pr view`.
 *
 * The projection is the caller's: `"headRefName,isCrossRepository"` for a checkout,
 * `"mergeStateStatus"` for mergeability, the whole enumerated context for an agent. One
 * read, one argv, one retry policy.
 */
export function readPullRequest<T>(
  repo: string,
  number: number,
  fields: PullRequestFields,
): PullRequestRead<T> {
  const what = `gh pr view ${number} --repo ${repo}`;
  const result = ghRead(...viewArgs(repo, number, fields));
  if (result.code !== 0) return { known: false, why: whyNot(what, result) };
  if (!result.stdout.trim()) return { known: false, why: `${what}: gh printed nothing` };
  try {
    return { known: true, value: JSON.parse(result.stdout) as T };
  } catch {
    // An answer that cannot be parsed is a read that did not happen, not an exception:
    // every caller already has an answer for a failed read, and this is one.
    return { known: false, why: `${what}: the answer was not JSON` };
  }
}

/**
 * The same read, for a caller whose failure is an exception.
 *
 * `ghJsonOrThrow`'s shape one layer up. A tool server turns an unreadable pull request
 * into a tool error and has nowhere to put a "why", so it says so here and the message
 * carries the reason.
 */
export function readPullRequestOrThrow<T>(
  repo: string,
  number: number,
  fields: PullRequestFields,
): T {
  const read = readPullRequest<T>(repo, number, fields);
  if (!read.known) throw new Error(read.why);
  return read.value;
}

/**
 * The whole pull request, as the REST API returns it.
 *
 * The one projection `--json` cannot express: it makes you name the fields, and the
 * event fetch wants the object itself — `head.sha`, `user.type`, `labels[].name`,
 * `created_at`, `updated_at`, and whatever the next reader adds without this function
 * changing. That is the "全文" half of "a projection is an argument", so it is a second
 * projection here rather than a second spelling out there.
 */
export function readPullRequestObject<T>(repo: string, number: number): PullRequestRead<T> {
  const what = `gh api repos/${repo}/pulls/${number}`;
  const result = ghRead("api", `repos/${repo}/pulls/${number}`);
  if (result.code !== 0) return { known: false, why: whyNot(what, result) };
  if (!result.stdout.trim()) return { known: false, why: `${what}: gh printed nothing` };
  try {
    return { known: true, value: JSON.parse(result.stdout) as T };
  } catch {
    return { known: false, why: `${what}: the answer was not JSON` };
  }
}

/**
 * The pull request's diff, as the text a reader reviews.
 *
 * A media type on the pull request's own endpoint rather than `gh pr diff`, because a
 * diff is not JSON: it is the patch, and this is the spelling of the request that both
 * callers already made — one of them with a measured reason to keep it.
 *
 * Not paginated, and not a list: GitHub answers the whole patch or refuses.
 */
export function readPullRequestDiff(repo: string, number: number): PullRequestDiffRead {
  const what = `gh api repos/${repo}/pulls/${number} (diff)`;
  const result = ghRead(
    "api",
    `repos/${repo}/pulls/${number}`,
    "-H",
    "Accept: application/vnd.github.v3.diff",
  );
  if (result.code !== 0) return { known: false, why: whyNot(what, result) };
  return { known: true, diff: result.stdout };
}
