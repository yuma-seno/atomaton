import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseGithubOutput, runWithFakeGh, scriptPath, type FakeGhRule } from "./testing/harness.ts";

/**
 * The branch a run checks out, and the one question it answers.
 *
 * This had no test, and the gap cost the delivery of a whole issue tree. A parent
 * issue's branch outlives the pull requests from it: it is created by the first
 * child's commit and carries every child's merge, so a pull request from it can
 * land — part of the tree reaching the base — while the branch goes on receiving
 * work. `collectIssueBranches` asked only whether a pull request from the branch
 * NAME had merged, answered *merged*, and this script then reported no branch to
 * resume. The parent's aggregation run started on the base branch, and `create_pr`
 * had a head equal to its base and could not open the pull request that delivers
 * the branch (#441, #476). A person merged it by hand.
 *
 * So what is asserted here is the outcome the workflow step depends on: the name
 * written to `branch=`, for a branch whose own tip is not the commit that landed.
 */
describe("resolve_issue_branch.ts", () => {
  const STALE = "c".repeat(40);
  const TIP = "d".repeat(40);

  /** One branch of issue 7 at `sha`, as `git/matching-refs/heads` reports it. */
  const refsAt = (sha: string) =>
    JSON.stringify([{ ref: "refs/heads/atomaton/issue-7", object: { sha } }]);

  /** What `repos/.../pulls?head=owner:<branch>` prints for one merged pull request. */
  const mergedPrAt = (sha: string, mergeCommit?: string) =>
    JSON.stringify([
      { merged_at: "2026-01-01T00:00:00Z", head: { sha }, ...(mergeCommit ? { merge_commit_sha: mergeCommit } : {}) },
    ]);

  /** Run the script the way the workflow step does, and report its `branch` output. */
  function run(rules: FakeGhRule[]): { status: number | null; stderr: string; branch: string } {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-issue-branch-out-"));
    const output = join(dir, "out");
    writeFileSync(output, "");
    try {
      const r = runWithFakeGh(
        scriptPath("resolve_issue_branch.ts"),
        ["--repo", "owner/repo", "--issue", "7"],
        { rules, env: { GITHUB_OUTPUT: output } },
      );
      return { ...r, branch: parseGithubOutput(readFileSync(output, "utf8")).branch ?? "" };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  test("an unmerged branch is resumed", () => {
    const r = run([
      { match: ["matching-refs/heads/atomaton/issue-7"], stdout: refsAt(TIP) },
      { match: ["head=owner:atomaton/issue-7"], stdout: "[]" },
    ]);
    expect(r.status).toBe(0);
    expect(r.branch).toBe("atomaton/issue-7");
  });

  test("a branch whose own tip a pull request landed is not resumed", () => {
    const r = run([
      { match: ["matching-refs/heads/atomaton/issue-7"], stdout: refsAt(TIP) },
      { match: ["head=owner:atomaton/issue-7"], stdout: mergedPrAt(TIP) },
    ]);
    expect(r.status).toBe(0);
    expect(r.branch).toBe("");
  });

  /**
   * The reported case. The tip `d…` carries merges nobody has delivered, and the
   * pull request that merged was from `c…` — an earlier state of the same branch.
   * Resuming nothing is what left the parent's aggregation run unable to open a
   * delivery pull request at all.
   */
  test("a branch that moved on after a pull request from it merged is resumed", () => {
    const r = run([
      { match: ["matching-refs/heads/atomaton/issue-7"], stdout: refsAt(TIP) },
      { match: ["head=owner:atomaton/issue-7"], stdout: mergedPrAt(STALE) },
    ]);
    expect(r.status).toBe(0);
    expect(r.branch).toBe("atomaton/issue-7");
  });

  /**
   * A branch left sitting on its own landing's merge commit. The merge commit PR #419
   * created is where `atomaton/issue-418` stood (`7f6ce012`), delivered from
   * `87e54a9`. Resuming here sends a run to a branch with nothing left to deliver,
   * where `create_pr` then has nothing to open — the mirror image of #476.
   */
  test("a branch whose tip is the merge commit a pull request from it created is not resumed", () => {
    const r = run([
      { match: ["matching-refs/heads/atomaton/issue-7"], stdout: refsAt(TIP) },
      { match: ["head=owner:atomaton/issue-7"], stdout: mergedPrAt(STALE, TIP) },
    ]);
    expect(r.status).toBe(0);
    expect(r.branch).toBe("");
  });

  /**
   * A read that failed is not a branch with nothing to resume. This one cannot fail
   * the run — a run that stops before the agent has said anything is worse than one
   * that starts on the base and reports — but the log has to say which answer it is.
   */
  test("an unreadable branch list starts on the base and says so", () => {
    const r = run([{ match: ["matching-refs"], code: 1 }]);
    expect(r.status).toBe(0);
    expect(r.branch).toBe("");
    expect(r.stderr).toContain("staying on the base branch");
  });

  test("an issue with no branch of its own starts on the base", () => {
    const r = run([{ match: ["matching-refs"], stdout: "[]" }]);
    expect(r.status).toBe(0);
    expect(r.branch).toBe("");
  });
});
