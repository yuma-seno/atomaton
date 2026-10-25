import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FAKE_GH_IMPL } from "../../entrypoints/machinery/testing/fake-gh-env.ts";
import { subIssueReportBody } from "./sub-issue-report.ts";
import { parseCommentCommand, parseMangledCommand } from "../../domain/work/comment-command.ts";
import { AGGREGATED_TAG, proseOnly } from "./tags.ts";
import type { LinkedPr } from "../../domain/work/issue-links.ts";

const MERGED: LinkedPr = { number: 34, title: "the fix", state: "done" };

describe("subIssueReportBody", () => {
  test("folds the child's own words under a Report block that names the child", () => {
    const body = subIssueReportBody({ child: 12, report: "It landed in #34.", pullRequests: [MERGED] });

    // The spelling `launch_sub_agent` established for a folded report, so a parent's
    // thread reads the same whichever tool put the fold there.
    expect(body).toContain("<details><summary>Report</summary>");
    expect(body.trimEnd().endsWith("</details>")).toBe(true);
    // Context the parent's aggregation is meant to read, not bookkeeping.
    expect(body).toContain("<!-- atomaton:llm-context=include -->");
    expect(body).toContain("Sub-issue #12");
    expect(body).toContain("It landed in #34.");
    expect(body).toContain("#34 the fix (done)");
    // The `atomaton:aggregated` marker is what makes every later caller answer
    // `already-aggregated`; a report carrying one would claim a completion that was
    // never dispatched, and cancel the retry that would have.
    expect(AGGREGATED_TAG.readProse(body)).toBeUndefined();
  });

  test("says an empty list and an unreadable one are different answers", () => {
    // The distinction `gatherSubResults` was careful about and the search it used could
    // not make: "no pull requests" and "nobody could look" read identically once they
    // are both an empty list, and only one of them is a fact.
    expect(subIssueReportBody({ child: 1, report: "", pullRequests: [] })).toContain("No pull requests are linked");
    expect(subIssueReportBody({ child: 1, report: "", pullRequests: undefined })).toContain(
      "could not be read",
    );
    expect(subIssueReportBody({ child: 1, report: "", pullRequests: [] })).not.toContain("could not be read");
  });

  test("a close with no summary says so rather than leaving the fold empty", () => {
    // The `merge_pr` close-directly path: no run wrote anything down, and a blank
    // report reads as a child that had nothing to say.
    expect(subIssueReportBody({ child: 7, report: "   ", pullRequests: [MERGED] })).toContain(
      "Its closing run wrote no summary.",
    );
  });

  /**
   * The report lands on a LIVE node, and that node's agent is about to be re-invoked.
   * A `/name` alone on a line there is somebody asking for an agent, and an unclaimed
   * ask is what makes the aggregation gate stand down with `parent-busy` and take its
   * marker back — so an unguarded report would cancel the very aggregation it exists to
   * inform. Both readers are checked, because they are the two that decide.
   */
  test("a directive line in the child's report is not a request to the parent", () => {
    const body = subIssueReportBody({
      child: 12,
      report: "The work is delivered.\n\n/atomaton\n\n- /engineer fix the follow-up",
      pullRequests: [],
    });

    expect(parseCommentCommand(proseOnly(body)).agent).toBe("");
    expect(parseCommentCommand(proseOnly(body)).control).toBe("");
    expect(parseMangledCommand(proseOnly(body)).agent).toBe("");
    // Still readable, and still there: escaping rather than deleting, because the
    // parent is supposed to learn what the child said next.
    expect(body).toContain("/atomaton");
    expect(body).toContain("/engineer fix the follow-up");
  });
});

/**
 * Where the report is posted, which is the half a pure body test cannot answer.
 *
 * A child process, because the `gh` seam is an environment variable and `Bun.spawnSync`
 * without an explicit `env` does not see one set after this runtime started — the same
 * reason `thread.test.ts` reaches its fake this way.
 */
describe("reportSubIssueToParent", () => {
  const SRC = join(import.meta.dir, "sub-issue-report.ts");

  function report(child: number, said: string, responses: unknown[]): { posted: boolean; calls: string[][]; stderr: string } {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-sub-report-"));
    const log = join(dir, "gh.log");
    const script = `
      const { reportSubIssueToParent } = await import(${JSON.stringify(SRC)});
      process.stdout.write(JSON.stringify(reportSubIssueToParent("o/r", ${child}, ${JSON.stringify(said)})));
    `;
    try {
      const proc = Bun.spawnSync({
        cmd: [process.execPath, "-e", script],
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          ATOMATON_FAKE_GH: FAKE_GH_IMPL,
          FAKE_GH_RESPONSES: JSON.stringify(responses),
          FAKE_GH_LOG: log,
          GH_TOKEN: "fake-gh-must-be-used",
          GITHUB_TOKEN: "fake-gh-must-be-used",
        },
      });
      const out = proc.stdout.toString();
      if (proc.exitCode !== 0) throw new Error(`child failed: ${proc.stderr.toString() || out}`);
      let calls: string[][] = [];
      try {
        calls = readFileSync(log, "utf8")
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line) as string[]);
      } catch {
        // No `gh` call at all is an answer, not a failure.
      }
      return { posted: JSON.parse(out) as boolean, calls, stderr: proc.stderr.toString() };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  const links = (parent: number | null, prs: unknown[] = []): unknown => ({
    match: ["graphql"],
    stdout: JSON.stringify({
      data: {
        repository: {
          issueOrPullRequest: {
            __typename: "Issue",
            parent: parent === null ? null : { number: parent, title: "the parent", state: "OPEN" },
            closedByPullRequestsReferences: { nodes: prs },
            timelineItems: { nodes: [] },
          },
        },
      },
    }),
  });

  test("posts on the issue the child is under, never on the child", () => {
    const r = report(12, "the work landed", [
      links(7),
      { match: ["issue", "comment"], stdout: "https://github.com/o/r/issues/7#issuecomment-1" },
    ]);

    expect(r.posted).toBe(true);
    const comment = r.calls.find((c) => c.includes("comment"));
    expect(comment?.slice(0, 4)).toEqual(["issue", "comment", "7", "--repo"]);
    expect(comment?.join(" ")).toContain("the work landed");
  });

  test("posts nothing when the issue is under nothing, and nothing when the parent cannot be read", () => {
    // A root issue: there is no parent thread for its report. And an unreadable link
    // list is not "no parent" — where the report goes is the one thing this cannot
    // guess, so it declines rather than posting somewhere.
    expect(report(12, "the work landed", [links(null), { match: ["issue", "comment"], stdout: "x" }]).posted).toBe(false);
    const unreadable = report(12, "the work landed", []);
    expect(unreadable.posted).toBe(false);
    expect(unreadable.calls.some((c) => c.includes("comment"))).toBe(false);
    expect(unreadable.stderr).toContain("nothing was posted there");
  });
});
