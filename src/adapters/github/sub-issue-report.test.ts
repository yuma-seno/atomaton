import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FAKE_GH_IMPL } from "../../entrypoints/machinery/testing/fake-gh-env.ts";
import {
  mergeProgressIntoReport,
  subIssueProgressLine,
  subIssueReportBody,
  withProgressLine,
} from "./sub-issue-report.ts";
import { parseCommentCommand, parseMangledCommand } from "../../domain/work/comment-command.ts";
import { AGGREGATED_TAG, AGENT_TAG, DISPATCH_TAG, LLM_CONTEXT_TAG, SUB_RESULT_TAG, proseOnly } from "./tags.ts";
import type { LinkedPr } from "../../domain/work/issue-links.ts";

const MERGED: LinkedPr = { number: 34, title: "the fix", state: "done" };

describe("subIssueReportBody", () => {
  test("folds the child's own words under a Report block that names the child", () => {
    const body = subIssueReportBody({ child: 12, report: "It landed in #34.", pullRequests: [MERGED] });

    // The one spelling this project folds a report under, so a parent's thread reads
    // the same whichever path put the fold there.
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

  /**
   * A dispatch marker is a command too — `parseCommentCommand` matches it through its
   * own pattern — and the form an agent's report can carry is
   * `<!-- atomaton:dispatch=name -->`, which has no `/` in it. An escape written as a
   * search for `/` would leave this one intact, and `mostRecentAgentOn` would then read
   * the child's text as the agent the parent was asked for.
   */
  test("a dispatch marker in the child's report is not the machinery asking for an agent", () => {
    const exact = subIssueReportBody({
      child: 12,
      report: "The work is delivered.\n\n<!-- atomaton:dispatch=engineer -->",
      pullRequests: [],
    });
    // The writer's own spelling is a registered tag, so it is stripped outright.
    expect(DISPATCH_TAG.hasProse(exact)).toBe(false);
    expect(parseCommentCommand(proseOnly(exact)).agent).toBe("");
    expect(exact).toContain("The work is delivered.");

    // A hand-retyped marker: `DISPATCH_RE` tolerates whitespace around `=` that the tag
    // writer never emits, so this one is a command to the thread reader and invisible to
    // the tag stripper. It is the case the escape has to cover by itself.
    const retyped = subIssueReportBody({
      child: 12,
      report: "See below.\n\n<!-- atomaton:dispatch = engineer -->",
      pullRequests: [],
    });
    expect(parseCommentCommand(proseOnly(retyped)).agent).toBe("");
    expect(parseMangledCommand(proseOnly(retyped)).agent).toBe("");
    expect(retyped).toContain("\\<!-- atomaton:dispatch = engineer -->");
  });

  /**
   * `withoutTags`, for the same reason `fetch_events` runs it on everything an agent
   * reads: the gate's idempotency read scans every raw comment on the parent for
   * `atomaton:aggregated=<N>`, and a child whose report quotes that marker would make
   * the gate answer `already-aggregated` — leaving the parent unaggregated with no
   * marker to take back and nothing that retries.
   */
  test("a tag-shaped marker in the child's report is not parent state", () => {
    const body = subIssueReportBody({
      child: 12,
      report: "Delivered.\n\n<!-- atomaton:aggregated=12 -->\n\n<!-- atomaton:agent=engineer -->",
      pullRequests: [],
    });

    expect(AGGREGATED_TAG.readProse(body)).toBeUndefined();
    expect(AGENT_TAG.readProse(body)).toBeUndefined();
    // The body's own context tag is added after the stripping and survives it.
    expect(body).toContain("<!-- atomaton:llm-context=include -->");
    expect(body).toContain("Delivered.");
  });
});

/**
 * Where the report is posted, which is the half a pure body test cannot answer.
 *
 * A child process, because the `gh` seam is an environment variable and `Bun.spawnSync`
 * without an explicit `env` does not see one set after this runtime started — the same
 * reason `thread.test.ts` reaches its fake this way.
 */
const SRC = join(import.meta.dir, "sub-issue-report.ts");

/**
 * Run one call of this module in a child process against the fake `gh`, and hand back
 * what it answered plus every command it issued.
 */
function childRun(script: string, responses: unknown[]): { out: string; calls: string[][]; stderr: string } {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-sub-report-"));
  const log = join(dir, "gh.log");
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
    return { out, calls, stderr: proc.stderr.toString() };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("reportSubIssueToParent", () => {
  function report(child: number, said: string, responses: unknown[]): { posted: boolean; calls: string[][]; stderr: string } {
    const r = childRun(
      `
      const { reportSubIssueToParent } = await import(${JSON.stringify(SRC)});
      process.stdout.write(JSON.stringify(reportSubIssueToParent("o/r", ${child}, ${JSON.stringify(said)})));
    `,
      responses,
    );
    return { posted: JSON.parse(r.out) as boolean, calls: r.calls, stderr: r.stderr };
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

/**
 * The line the gate adds while siblings are still open, and the body it lands in.
 *
 * It used to be a comment of its own; it is edited into the child's report now, which
 * is why the two pure halves below are tested together: which sentence, and what a
 * second run over the same completion produces.
 */
describe("the progress line", () => {
  test("says which child finished and how many are left, and is not a command", () => {
    const line = subIssueProgressLine(12, 3);
    expect(line).toContain("#12");
    expect(line).toContain("3 sub-task(s)");
    // The report it is edited into is `llm-context=include`, so a line that read as a
    // command would be somebody asking the parent for an agent — and an ask nothing
    // claimed makes the gate answer `parent-busy` and take its marker back.
    expect(line.startsWith("/")).toBe(false);
    expect(parseCommentCommand(line).agent).toBe("");
    expect(parseMangledCommand(line).agent).toBe("");
    expect(DISPATCH_TAG.has(line)).toBe(false);
  });

  test("adds itself to a report without touching what the report says", () => {
    const report = subIssueReportBody({ child: 12, report: "It landed in #34.", pullRequests: [MERGED] });
    const merged = withProgressLine(report, subIssueProgressLine(12, 3));

    expect(merged).toContain("It landed in #34.");
    expect(merged.trimEnd().endsWith("3 sub-task(s) still in progress.")).toBe(true);
    // Still context the parent's aggregation reads: the line is added to an include
    // comment and does not change that.
    expect(LLM_CONTEXT_TAG.readProse(merged)).toBe("include");
    // Neither half became a command by being put next to the other.
    expect(parseCommentCommand(proseOnly(merged)).agent).toBe("");
    expect(parseMangledCommand(proseOnly(merged)).agent).toBe("");
  });

  test("replaces its own previous line rather than adding a second one", () => {
    // The gate can run twice over the same completion — a retried event, two racing
    // callers — and the count can have moved in between as siblings closed. A second
    // run must produce the body the second count asks for, not a body carrying both.
    const once = withProgressLine(subIssueReportBody({ child: 12, report: "Done.", pullRequests: [] }), subIssueProgressLine(12, 2));
    const twice = withProgressLine(once, subIssueProgressLine(12, 1));

    expect(twice).not.toContain("2 sub-task(s)");
    expect(twice).toContain("1 sub-task(s) still in progress.");
    expect(twice.split("Atomaton: Sub-task #").length - 1).toBe(1);
    // Same input, same body: an edit that has already landed is a no-op, not a rewrite.
    expect(withProgressLine(once, subIssueProgressLine(12, 2))).toBe(once);
  });
});

/**
 * Which comment the line is edited into — the half a pure body test cannot answer.
 *
 * A report is found by the shape `subIssueReportBody` writes, never by the
 * `sub-result` tag alone: the fallback progress comment carries that tag as well, and
 * rewriting it into a fold would put a report where a person-facing sentence was
 * while the child's own run posts its report after it — two comments again.
 */
describe("mergeProgressIntoReport", () => {
  const parentThread = (comments: unknown[]): unknown => ({
    match: ["api", "issues/5/comments"],
    stdout: JSON.stringify(comments),
  });
  const patchRule: unknown = { match: ["--method", "PATCH"], stdout: "{}" };

  function merge(child: number, remaining: number, responses: unknown[]): { merged: boolean; calls: string[][]; stderr: string } {
    const r = childRun(
      `
      const { mergeProgressIntoReport, subIssueProgressLine } = await import(${JSON.stringify(SRC)});
      process.stdout.write(JSON.stringify(
        mergeProgressIntoReport("o/r", 5, ${child}, subIssueProgressLine(${child}, ${remaining})),
      ));
    `,
      responses,
    );
    return { merged: JSON.parse(r.out) as boolean, calls: r.calls, stderr: r.stderr };
  }

  const reportComment = (child: number): { id: number; user: { type: string }; body: string } => ({
    id: 88,
    user: { type: "Bot" },
    body: subIssueReportBody({ child, report: "It landed in #34.", pullRequests: [MERGED] }),
  });

  test("edits the child's report in place, and posts nothing", () => {
    const r = merge(12, 3, [parentThread([reportComment(12)]), patchRule]);

    expect(r.merged).toBe(true);
    const patches = r.calls.filter((c) => c.includes("PATCH"));
    expect(patches.length).toBe(1);
    // The comment it edits, not the issue: one POST on the parent would be the second
    // comment this exists to avoid.
    expect(patches[0]?.join(" ")).toContain("repos/o/r/issues/comments/88");
    const body = patches[0]?.find((a) => a.startsWith("body=")) ?? "";
    expect(body).toContain("It landed in #34.");
    expect(body).toContain("3 sub-task(s) still in progress.");
    expect(body).toContain("atomaton:llm-context=include");
    // Never a new comment, and never a delete: the report is the child's only record
    // on the parent's thread.
    expect(r.calls.filter((c) => c.slice(0, 2).join(" ") === "issue comment").length).toBe(0);
    expect(r.calls.filter((c) => c.includes("DELETE")).length).toBe(0);
  });

  test("leaves the bare progress comment alone, so the gate still posts its own", () => {
    // The fallback shape: the tag, no fold. Taking it for a report would rewrite a
    // sentence a person is reading into a fold nobody asked for.
    const progress = {
      id: 12,
      user: { type: "Bot" },
      body: `${LLM_CONTEXT_TAG.write("exclude")}\n${SUB_RESULT_TAG.write(12)}\n${subIssueProgressLine(12, 3)}`,
    };
    const r = merge(12, 2, [parentThread([progress]), patchRule]);

    expect(r.merged).toBe(false);
    expect(r.calls.some((c) => c.includes("PATCH"))).toBe(false);
  });

  test("does not edit a person's comment, and does not edit another child's report", () => {
    const theirs = { id: 90, user: { type: "User" }, body: reportComment(12).body };
    const other = reportComment(11);
    const r = merge(12, 3, [parentThread([theirs, other]), patchRule]);

    expect(r.merged).toBe(false);
    expect(r.calls.some((c) => c.includes("PATCH"))).toBe(false);
  });

  test("does not take a report quoting another child's heading for that child", () => {
    // Both halves the finder might have keyed on can appear inside a child's own words.
    // The opening cannot: the machinery writes it before the child says anything.
    const quoting = {
      id: 91,
      user: { type: "Bot" },
      body: subIssueReportBody({ child: 11, report: "**Sub-issue #12** was the one that landed.", pullRequests: [] }),
    };
    const r = merge(12, 3, [parentThread([quoting]), patchRule]);

    expect(r.merged).toBe(false);
    expect(r.calls.some((c) => c.includes("PATCH"))).toBe(false);
  });

  test("says nothing it cannot vouch for when the thread cannot be read", () => {
    // No matching rule: the fake refuses, `listComments` throws, and the gate falls
    // back to posting its own comment — a comment lost to a failed read, never a
    // decision made on one.
    const r = merge(12, 3, [patchRule]);

    expect(r.merged).toBe(false);
    expect(r.calls.some((c) => c.includes("PATCH"))).toBe(false);
    expect(r.stderr).toContain("could not look for #12's report");
  });
});
