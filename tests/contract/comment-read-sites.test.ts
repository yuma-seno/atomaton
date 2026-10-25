/**
 * comment-read-sites.test.ts — nothing may list a node's comments behind
 * `adapters/github/thread.ts`'s `listComments`.
 *
 * ## The failure this exists for
 *
 * "Every comment on this node" was answered nine times, with four page strategies:
 *
 * - `--paginate` and a hand-written split of the per-page arrays (`thread.ts`);
 * - `--paginate` plus `ghPaginated`, which is the same split wrapped (`agent-on-issue.ts`,
 *   `validate_pull_request.ts`);
 * - `--jq "[.[].body]"` and a hand-written flatten of the pages (`work-tree.ts`,
 *   `aggregation.ts`);
 * - `--paginate` and `JSON.parse` of the WHOLE stdout (`participants.ts`), which throws
 *   from the second page on — a node past 100 comments answered with none of its
 *   commenters, silently;
 * - one line of JSON per comment, parsed by hand (`manage_dispatch_loop.ts`).
 *
 * Every one of those was a correct-looking line. What made them wrong was only visible
 * from the whole set, and nothing could see the whole set — which is what this test is:
 * the place a tenth has to pass through. The strategies did not only differ in style:
 * two of them could not read a long thread at all, and one answered a failed read with
 * zero retries, which is the number that lets the CI loop run past its bound.
 *
 * The failure POLICY is not unified and must not be (a dispatch that must not start
 * without its thread throws; a search index treats the same failure as "nothing to
 * index"). This test is about the I/O: one endpoint, one page strategy, one place.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * The one module allowed to read a node's comment list — `listComments`, which every
 * caller now goes through.
 */
const THE_READER = "src/adapters/github/thread.ts";

/**
 * The other places the per-node comments endpoint appears, and why each one is not a
 * second read.
 *
 * Every entry but the last is a WRITE: posting a comment is not reading the thread, and
 * each of these needs the new comment's id (`--jq .id`), which is why they cannot go
 * through the reader. They are listed by file rather than exempted by pattern because a
 * rule clever enough to tell a POST from a GET by looking at a template literal is a
 * rule whose next fix is to stop explaining things.
 */
const NOT_A_READ: Record<string, string> = {
  "src/adapters/actions/dispatch.ts": "postDispatchMarker writes the dispatch marker",
  "src/adapters/github/work-tree.ts": "commentOnWithId writes a comment and returns its id",
  "src/entrypoints/machinery/claim_turn.ts": "posts the turn claim",
  "src/entrypoints/machinery/post_result_comment.ts": "posts the run's result comment",
  "src/entrypoints/tools/mcp/github.ts": "posts the push comment before dispatching validation",
  "src/entrypoints/machinery/watch_for_stop.ts":
    "polls `?since=`: its question is `any NEW comment since this run started`, one page of a delta, asked every 30s -- re-reading the whole thread on every poll is a cost with no answer in it",
};

/** Every `.ts` under `src/`, excluding tests. */
function sourceFiles(): string[] {
  return readdirSync("src", { recursive: true })
    .map(String)
    .map((name) => join("src", name).replaceAll("\\", "/"))
    .filter((path) => path.endsWith(".ts") && !path.endsWith(".test.ts"));
}

/**
 * The per-node comments endpoint, in any of the spellings the nine used.
 *
 * The repository-wide `/issues/comments` (the search index's full sweep) and the pull
 * request review-comment endpoints are different questions and do not match: this
 * pattern needs a segment between `issues/` and `/comments`.
 */
const ENDPOINT = /issues\/[^\s`]*\/comments/;

describe("the places that read a node's comments", () => {
  test("only thread.ts lists them", () => {
    const offenders = sourceFiles()
      .filter((path) => path !== THE_READER && !(path in NOT_A_READ))
      .filter((path) => ENDPOINT.test(readFileSync(path, "utf8")));

    expect(
      offenders,
      `these read a node's comments themselves instead of calling listComments: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  /** And the reader itself reads them once, so a second read cannot grow inside it. */
  test("thread.ts spells the endpoint once", () => {
    // A separate global copy: a `g` regex carries `lastIndex` between calls, so `.test`
    // on the one above would answer "no match" on every second file it is asked about.
    const found = readFileSync(THE_READER, "utf8").match(new RegExp(ENDPOINT, "g")) ?? [];
    expect(found.length, "one read, so one page strategy").toBe(1);
  });

  /**
   * An exemption for a file that no longer reads or writes the endpoint is an exemption
   * that hides the next one: the list is checked in both directions, the way
   * `dispatch-sites.test.ts` checks its bridge count.
   */
  test("every exemption still spells the endpoint", () => {
    const stale = Object.keys(NOT_A_READ).filter((path) => !ENDPOINT.test(readFileSync(path, "utf8")));
    expect(stale, `drop these from NOT_A_READ: ${stale.join(", ")}`).toEqual([]);
  });
});
