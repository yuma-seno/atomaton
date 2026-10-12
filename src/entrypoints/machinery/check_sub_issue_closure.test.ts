import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseGithubOutput, runWithFakeGh, scriptPath } from "./testing/harness.ts";

/**
 * One GraphQL call now, not two. The parent comes from GitHub's own sub-issue link
 * (the `atomaton:parent` tag it used to read out of the webhook payload is gone --
 * see `adapters/github/parent-issue.ts`).
 *
 * The second call it used to make -- `closedByPullRequestsReferences`, to skip the
 * aggregation when a merged PR linked the issue -- is gone with the guard it fed.
 * It asked a question one level below the one that matters and answered it wrong for
 * an agent's merge; see the script's header and #150.
 */
const parentIs = (parent: number | null) => ({
  match: ["graphql", "parent{number}"],
  stdout: JSON.stringify({ data: { repository: { issue: { parent: parent === null ? null : { number: parent } } } } }),
});

function run(rules: { match: string[]; stdout?: string; code?: number }[]) {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
  try {
    const outputFile = join(dir, "out");
    writeFileSync(outputFile, "");
    const result = runWithFakeGh(scriptPath("check_sub_issue_closure.ts"), [], {
      env: { GITHUB_OUTPUT: outputFile, CLOSED_NUM: "9", OWNER: "owner", REPO: "repo" },
      rules,
    });
    return { ...result, out: parseGithubOutput(readFileSync(outputFile, "utf8")) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("check_sub_issue_closure.ts", () => {
  test("detects a sub-issue and reports its parent", () => {
    const { out } = run([parentIs(3)]);
    expect(out.is_sub_issue).toBe("true");
    expect(out.parent_number).toBe("3");
  });

  test("reports is_sub_issue=false when GitHub says the issue has no parent", () => {
    const { out } = run([parentIs(null)]);
    expect(out.is_sub_issue).toBe("false");
  });

  /**
   * The guard this used to carry is gone, and its absence is the contract: no second
   * call, and no `closed_via_pr` for the workflow's `if:` to read. Whether a
   * completion has already been aggregated is the gate's decision, on the parent's
   * thread (`aggregation.ts`'s `atomaton:aggregated` marker) -- the level where the
   * identity lives. Re-adding a skip here would make #150's silent loss possible again.
   */
  test("does not ask whether a merged PR closed the issue, and writes no closed_via_pr", () => {
    const { out, ghCalls } = run([parentIs(3)]);
    expect(out.closed_via_pr).toBeUndefined();
    expect(ghCalls.some((c) => c.join(" ").includes("closedByPullRequestsReferences"))).toBe(false);
  });

  /**
   * The distinction the old version could not make. It read the parent out of the
   * webhook payload, so "no tag" and "could not look" were the same answer — and the
   * quiet one skipped the aggregation, leaving an atomaton nothing would ever
   * re-invoke.
   */
  test("a parent that could not be read fails rather than passing as 'not a sub-issue'", () => {
    const { status, stderr, out } = run([{ match: ["graphql", "parent{number}"], code: 1, stdout: "boom" }]);
    expect(status).toBe(1);
    expect(stderr).toContain("::error::");
    expect(out.is_sub_issue).toBeUndefined();
  });
});
