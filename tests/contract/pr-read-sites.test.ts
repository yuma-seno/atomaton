/**
 * pr-read-sites.test.ts — nothing may read a pull request by number behind
 * `adapters/github/pull-request.ts`.
 *
 * ## The failure this exists for
 *
 * "This pull request" was answered thirteen times, in six files, with three spellings:
 * eight `gh pr view` calls each naming its own `--json` list, three reads of the REST
 * object (two of them projected with `--jq`), and two spellings of the diff — `gh pr
 * diff` in the tool server and `gh api ... -H Accept: application/vnd.github.v3.diff`
 * in the event fetch (#345).
 *
 * Every one of those was a correct-looking line. What made them wrong was only visible
 * from the whole set, and nothing could see the whole set — which is what this test is:
 * the place a thirteenth has to pass through. They did not differ only in style: two of
 * them retried a transient `HTTP 504` and the rest did not, so the same blip degraded a
 * merge verdict in one place and ended a run in another. A projection, by contrast, IS a
 * real difference — `{title, headRefName}` and the whole object are different questions
 * — and that is why it is an argument to the reader rather than a reason for a read.
 *
 * The failure POLICY is not unified and must not be (a merge refuses, a checkout gets a
 * refusal it can post, a workspace falls back to private, a tool errors). This test is
 * about the I/O: one endpoint, one retry, one place.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * The one module allowed to read a pull request by number — every caller now goes
 * through it.
 */
const THE_READER = "src/adapters/github/pull-request.ts";

/**
 * The other places the pull request endpoint appears, and why each one is not a second
 * read of it.
 *
 * Every entry is a SUB-RESOURCE: a different question with its own endpoint and its own
 * paging, none of which the pull request's own object carries. They are listed by file
 * rather than exempted by a pattern, because a rule clever enough to tell
 * `pulls/7/comments` from `pulls/7` is a rule whose next fix is to stop explaining
 * things.
 */
const NOT_A_READ: Record<string, string> = {
  "src/adapters/github/merge-signals.ts":
    "reads the changed-FILES list (`pulls/<n>/files`) — a paginated list, and it fails closed, neither of which a field of the pull request does",
  "src/entrypoints/machinery/fetch_events.ts":
    "reads the reviews and the inline review comments (`pulls/<n>/reviews`, `pulls/<n>/comments`) — lists of review objects, not the pull request",
  "src/entrypoints/tools/mcp/github.ts":
    "reads the inline review comments this pull request's review carries — a comment list, paged, which is a different question from the pull request",
};

/** Every `.ts` under `src/`, excluding tests. */
function sourceFiles(): string[] {
  return readdirSync("src", { recursive: true })
    .map(String)
    .map((name) => join("src", name).replaceAll("\\", "/"))
    .filter((path) => path.endsWith(".ts") && !path.endsWith(".test.ts"));
}

/**
 * The pull request's own endpoint, in any of the spellings the thirteen used: the CLI view
 * (`gh pr view <n>`) and the REST path (`repos/<repo>/pulls/<n>`).
 *
 * A sub-resource path matches too — `pulls/<n>/files` is the same endpoint with a
 * segment after it — which is what puts those four sites in `NOT_A_READ` with a reason
 * instead of leaving them invisible.
 */
const ENDPOINT = /"pr",\s*"view"|pulls\/\$\{[^}]+\}/;

describe("the places that read a pull request by number", () => {
  test("only pull-request.ts reads one", () => {
    const offenders = sourceFiles()
      .filter((path) => path !== THE_READER && !(path in NOT_A_READ))
      .filter((path) => ENDPOINT.test(readFileSync(path, "utf8")));

    expect(
      offenders,
      `these read a pull request themselves instead of calling pull-request.ts: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  /** And the reader itself spells the CLI view once, so a second argv cannot grow in it. */
  test("pull-request.ts spells `pr view` once", () => {
    // A separate global copy: a `g` regex carries `lastIndex` between calls, so `.test`
    // on the one above would answer "no match" on every second file it is asked about.
    const found = readFileSync(THE_READER, "utf8").match(/"pr",\s*"view"/g) ?? [];
    expect(found.length, "one view argv, so one projection builder").toBe(1);
  });

  /**
   * An exemption for a file that no longer touches the endpoint is an exemption that
   * hides the next one: the list is checked in both directions, the way
   * `comment-read-sites.test.ts` checks its own.
   */
  test("every exemption still spells the endpoint", () => {
    const stale = Object.keys(NOT_A_READ).filter((path) => !ENDPOINT.test(readFileSync(path, "utf8")));
    expect(stale, `drop these from NOT_A_READ: ${stale.join(", ")}`).toEqual([]);
  });
});
