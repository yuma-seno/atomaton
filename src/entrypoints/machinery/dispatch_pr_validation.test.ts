import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hermeticEnv, runWithFakeGh, scriptPath, type FakeGhRule } from "./testing/harness.ts";

/**
 * The entrance a person's `/<agent>` comment on a pull request takes (#344).
 *
 * The workflow step used to read the head branch inline and hand it on, so a member's
 * comment on a pull request from a FORK dispatched validation with a branch this
 * repository does not have — or with a same-named branch of this repository, which is
 * worse. The branch is now resolved inside this script through the gates a `pr` run
 * uses, and a refusal is posted on the pull request in words the person can act on.
 *
 * What the agent-side callers have not lost: a branch they already know is still
 * dispatched as given, without a `gh pr view`.
 */
describe("dispatch_pr_validation.ts", () => {
  function git(cwd: string, ...args: string[]): string {
    return execFileSync("git", args, { cwd, encoding: "utf8", env: hermeticEnv() }).trim();
  }

  /**
   * A real remote and a clone of it, because `existsOnOrigin` asks git rather than a
   * fake: the question is whether `origin` has the branch, and a stubbed answer would
   * only assert this test's idea of that.
   */
  function makeRemote(branches: string[]): { root: string; work: string } {
    const root = mkdtempSync(join(tmpdir(), "atomaton-dispatch-validation-"));
    const remote = join(root, "remote.git");
    const seed = join(root, "seed");
    git(root, "init", "--bare", "--initial-branch=main", remote);
    git(root, "init", "--initial-branch=main", seed);
    git(seed, "config", "user.name", "Atomaton Test");
    git(seed, "config", "user.email", "atomaton@example.com");
    writeFileSync(join(seed, "value.txt"), "one\n");
    git(seed, "add", "value.txt");
    git(seed, "commit", "-m", "initial");
    git(seed, "remote", "add", "origin", remote);
    git(seed, "push", "-u", "origin", "main");
    for (const branch of branches) {
      if (branch === "main") continue;
      git(seed, "branch", branch);
      git(seed, "push", "origin", branch);
    }
    const work = join(root, "work");
    git(root, "clone", remote, work);
    return { root, work };
  }

  /** What `gh pr view --json headRefName,isCrossRepository` prints for a head branch. */
  function headRule(headRefName: string, isCrossRepository = false): FakeGhRule {
    return { match: ["pr", "view"], stdout: JSON.stringify({ headRefName, isCrossRepository }) };
  }

  const dispatched: FakeGhRule = { match: ["workflow", "run"], stdout: "" };
  const commented: FakeGhRule = { match: ["issue", "comment"], stdout: "" };

  function run(rules: FakeGhRule[], args: string[], cwd: string) {
    return runWithFakeGh(scriptPath("dispatch_pr_validation.ts"), args, {
      rules,
      cwd,
      env: { GH_TOKEN: "test-token" },
    });
  }

  /** The `gh workflow run` invocation and the comment's body, without the argv noise. */
  function workflowRun(calls: string[][]): string[] {
    return calls.find((c) => c[0] === "workflow" && c[1] === "run") ?? [];
  }

  function commentBody(calls: string[][]): string {
    const call = calls.find((c) => c[0] === "issue" && c[1] === "comment") ?? [];
    const index = call.indexOf("--body");
    return index >= 0 ? (call[index + 1] ?? "") : "";
  }

  test("a branch this repository has is resolved and handed to validation", () => {
    const { root, work } = makeRemote(["atomaton/issue-9"]);
    try {
      const r = run(
        [headRule("atomaton/issue-9"), dispatched],
        ["--repo", "owner/repo", "--number", "9", "--asked-by-person", "true", "--ask", "555"],
        work,
      );
      expect(r.status).toBe(0);
      const argv = workflowRun(r.ghCalls);
      expect(argv).toContain("atomaton-validate-pr.yml");
      expect(argv).toContain("branch=atomaton/issue-9");
      expect(argv).toContain("number=9");
      expect(argv).toContain("asked_by_person=true");
      expect(argv).toContain("ask=555");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  /**
   * The defect exactly: a fork's head branch exists only in the fork, so `--ref` names
   * nothing this repository can run. Nothing is dispatched, and the person learns why
   * from a comment rather than from a red workflow run they never look at.
   */
  test("a fork's head is refused, nothing is dispatched, and the person is told", () => {
    const { root, work } = makeRemote(["main"]);
    try {
      const r = run(
        [headRule("main", true), dispatched, commented],
        ["--repo", "owner/repo", "--number", "9", "--commenter", "octocat"],
        work,
      );
      expect(r.status).toBe(1);
      expect(workflowRun(r.ghCalls)).toEqual([]);
      const body = commentBody(r.ghCalls);
      expect(body).toContain("@octocat");
      expect(body).toContain("comes from a fork");
      expect(body).toContain("Nothing was dispatched");
      expect(body).toContain("atomaton:llm-context=exclude");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  /** A head branch that is gone — renamed, deleted in a race — is not a name to run CI on. */
  test("a head branch this repository does not have is refused rather than passed on", () => {
    const { root, work } = makeRemote(["main"]);
    try {
      const r = run(
        [headRule("atomaton/issue-404"), dispatched, commented],
        ["--repo", "owner/repo", "--number", "9", "--commenter", "octocat"],
        work,
      );
      expect(r.status).toBe(1);
      expect(workflowRun(r.ghCalls)).toEqual([]);
      expect(commentBody(r.ghCalls)).toContain("is not a branch of this repository");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  /**
   * The agent-side shape of this call: the caller pushed the branch, so it already knows
   * the name, and asking GitHub again would be a second answer that can disagree.
   */
  test("a branch passed in is dispatched as given, without reading the pull request", () => {
    const { root, work } = makeRemote(["atomaton/issue-9"]);
    try {
      const r = run(
        [dispatched],
        ["--repo", "owner/repo", "--number", "9", "--branch", "atomaton/issue-9"],
        work,
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((c) => c[0] === "pr" && c[1] === "view")).toBe(false);
      expect(workflowRun(r.ghCalls)).toContain("branch=atomaton/issue-9");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  /** Without a target there is nothing to validate, and nothing to ask GitHub about. */
  test("a missing number is a usage error, not a resolution", () => {
    const r = run([], ["--repo", "owner/repo"], process.cwd());
    expect(r.status).toBe(2);
    expect(r.ghCalls).toEqual([]);
  });
});
