import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hermeticEnv, importable, runWithFakeGh, type FakeGhRule } from "../../entrypoints/machinery/testing/harness.ts";

/**
 * `branch-reads.ts` — the three branch questions, and the difference between "no"
 * and "I could not look".
 *
 * The cost this file exists for (#346): `branch-placement.ts` read a failed
 * `git ls-remote` as "the parent has no branch yet" and CREATED the parent's branch
 * at whatever commit the run had checked out, so one transient network failure could
 * stack every sibling of an issue on a base nobody chose. The same failure in
 * `mcp/attachments.ts` was a refusal. Two meanings for one failed read, and only the
 * creation path could not absorb the difference.
 *
 * A real remote and a real repository, because the question is what git and `origin`
 * say — a faked `git` would only assert this file's own idea of it. A child process,
 * because `gitRun` answers about its own working directory and because the `gh` seam
 * is an environment variable (see `fake-gh-env.ts`).
 */
const HERE = import.meta.dir;

type Rules = FakeGhRule[];

/** Runs `body` with `reads` and `placement` imported, and returns what it printed. */
function run<T>(
  body: string,
  cwd: string,
  opts: { env?: Record<string, string>; rules?: Rules } = {},
): { value: T; stderr: string; ghCalls: string[][] } {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-branch-reads-"));
  const file = join(dir, "shim.ts");
  writeFileSync(
    file,
    [
      `const reads = await import(${JSON.stringify(importable(join(HERE, "branch-reads.ts")))});`,
      `const placement = await import(${JSON.stringify(importable(join(HERE, "branch-placement.ts")))});`,
      "try {",
      body,
      "} catch (e) {",
      "  process.stdout.write(JSON.stringify({ threw: (e as Error).message }));",
      "}",
    ].join("\n"),
  );
  try {
    const r = runWithFakeGh(file, [], { cwd, env: opts.env, rules: opts.rules });
    if (r.status !== 0) throw new Error(`shim failed: ${r.stderr || r.stdout}`);
    return { value: JSON.parse(r.stdout) as T, stderr: r.stderr, ghCalls: r.ghCalls };
  } finally {
    rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
  }
}

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", env: hermeticEnv() }).trim();
}

/** A real remote with `main` and the named branches, and a clone of it to ask from. */
function makeRemote(branches: string[] = []): { root: string; seed: string; work: string } {
  const root = mkdtempSync(join(tmpdir(), "atomaton-branch-reads-git-"));
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
  return { root, seed, work };
}

/**
 * A repository whose `origin` is a path that is not a repository: `ls-remote` fails,
 * which is the read this file is about. Nothing else here can make git fail on demand.
 */
function makeRepoWithUnreachableOrigin(): { root: string; repo: string } {
  const root = mkdtempSync(join(tmpdir(), "atomaton-branch-reads-broken-"));
  const repo = join(root, "repo");
  git(root, "init", "--initial-branch=main", repo);
  git(repo, "config", "user.name", "Atomaton Test");
  git(repo, "config", "user.email", "atomaton@example.com");
  writeFileSync(join(repo, "value.txt"), "one\n");
  git(repo, "add", "value.txt");
  git(repo, "commit", "-m", "initial");
  git(repo, "remote", "add", "origin", join(root, "there-is-no-remote-here.git"));
  return { root, repo };
}

type OriginBranchRead =
  | { known: true; present: true; sha: string }
  | { known: true; present: false }
  | { known: false; why: string };

/** `readOriginBranch` as the shim printed it, or the error it threw. */
function originBranch(cwd: string, branch: string): OriginBranchRead {
  const body = `process.stdout.write(JSON.stringify(reads.readOriginBranch(${JSON.stringify(branch)})));`;
  return run<OriginBranchRead>(body, cwd).value;
}

describe("readOriginBranch", () => {
  test("a branch origin has is present, with the tip to compare against", () => {
    const { root, seed, work } = makeRemote(["atomaton/issue-12"]);
    try {
      const read = originBranch(work, "atomaton/issue-12");
      expect(read).toEqual({ known: true, present: true, sha: git(seed, "rev-parse", "atomaton/issue-12") });
    } finally {
      rmSync(root, { recursive: true, force: true, maxRetries: 5 });
    }
  });

  test("a branch origin does not have is absent, not a failed read", () => {
    const { root, work } = makeRemote();
    try {
      expect(originBranch(work, "atomaton/issue-12")).toEqual({ known: true, present: false });
    } finally {
      rmSync(root, { recursive: true, force: true, maxRetries: 5 });
    }
  });

  /**
   * The whole point: a read that did not happen is not an answer of "no". It carries
   * the reason, so a caller can say why it refused instead of reporting a missing
   * branch that nobody observed missing.
   */
  test("an origin that cannot be reached is unknown, never 'not there'", () => {
    const { root, repo } = makeRepoWithUnreachableOrigin();
    try {
      const read = originBranch(repo, "atomaton/issue-12");
      expect(read).toMatchObject({ known: false });
      expect((read as { why: string }).why).toContain("could not read 'atomaton/issue-12' from origin");
    } finally {
      rmSync(root, { recursive: true, force: true, maxRetries: 5 });
    }
  });
});

describe("checkedOutBranch", () => {
  test("on a branch, it is the branch", () => {
    const { root, work } = makeRemote();
    try {
      expect(run<{ branch: string | null }>("process.stdout.write(JSON.stringify({ branch: reads.checkedOutBranch() ?? null }));", work).value)
        .toEqual({ branch: "main" });
    } finally {
      rmSync(root, { recursive: true, force: true, maxRetries: 5 });
    }
  });

  /** A `pr` run's checkout: `git rev-parse --abbrev-ref HEAD` answers `HEAD`, a ref that is not a branch. */
  test("a detached checkout has no branch, not one named HEAD", () => {
    const { root, work } = makeRemote();
    try {
      git(work, "checkout", "--detach", "HEAD");
      expect(run<{ branch: string | null }>("process.stdout.write(JSON.stringify({ branch: reads.checkedOutBranch() ?? null }));", work).value)
        .toEqual({ branch: null });
    } finally {
      rmSync(root, { recursive: true, force: true, maxRetries: 5 });
    }
  });
});

describe("readRemoteDefaultBranch", () => {
  test("asks origin for the branch its HEAD points at", () => {
    const { root, work } = makeRemote();
    try {
      const body = `process.stdout.write(JSON.stringify(reads.readRemoteDefaultBranch()));`;
      expect(run<unknown>(body, work).value).toEqual({ known: true, branch: "main" });
    } finally {
      rmSync(root, { recursive: true, force: true, maxRetries: 5 });
    }
  });

  /** Publishing refuses to write to this branch, so "unknown" must not read as "not it". */
  test("an unreachable origin is unknown, so a caller refuses rather than publishing", () => {
    const { root, repo } = makeRepoWithUnreachableOrigin();
    try {
      const body = `process.stdout.write(JSON.stringify(reads.readRemoteDefaultBranch()));`;
      const read = run<{ known: boolean; why?: string }>(body, repo).value;
      expect(read.known).toBe(false);
      expect(read.why).toContain("default branch is unknown");
    } finally {
      rmSync(root, { recursive: true, force: true, maxRetries: 5 });
    }
  });
});

/** What `parentIssueOf` reads: #1 is a sub-issue of #12. */
const SUB_ISSUE: FakeGhRule = {
  match: ["graphql"],
  stdout: JSON.stringify({ data: { repository: { issue: { parent: { number: 12 } } } } }),
};

/** The `git/refs` POST that creates a branch, and nothing else about it. */
function createsBranch(ghCalls: string[][]): boolean {
  return ghCalls.some((argv) => argv.some((arg) => arg.includes("git/refs")) && argv.includes("POST"));
}

describe("branch-placement.ts creation path", () => {
  /**
   * The defect, reproduced. #12's branch is absent FROM ORIGIN'S ANSWER, so creating
   * it is right; the next test is the same shape with the read failing, and the two
   * must not take the same path.
   */
  test("origin answering 'no such branch' creates the parent branch", () => {
    const { root, work } = makeRemote();
    try {
      const body = `process.stdout.write(JSON.stringify({ base: placement.stackedBaseFor("o/r", 1) }));`;
      const { value, ghCalls } = run<{ base: string }>(body, work, {
        rules: [SUB_ISSUE, { match: ["api", "git/refs"], stdout: "" }],
      });
      // The fetch after the creation fails, because the fake `gh` created nothing on
      // the remote -- so the base falls back. What is asserted is that the creation
      // was ATTEMPTED, which is what an absent branch licenses.
      expect(value.base).toBe("");
      expect(createsBranch(ghCalls)).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true, maxRetries: 5 });
    }
  });

  test("an unreadable origin does not create the parent branch", () => {
    const { root, repo } = makeRepoWithUnreachableOrigin();
    try {
      const body = `process.stdout.write(JSON.stringify({ base: placement.stackedBaseFor("o/r", 1) }));`;
      const { value, ghCalls } = run<{ base: string }>(body, repo, {
        rules: [SUB_ISSUE, { match: ["api", "git/refs"], stdout: "" }],
      });
      // Cut from the base instead — the pre-stacking behaviour — and, crucially, the
      // parent's branch is not created at a commit this run happens to be on.
      expect(value.base).toBe("");
      expect(createsBranch(ghCalls)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true, maxRetries: 5 });
    }
  });

  /**
   * `stackedPrBase` decides where a pull request merges to, so it cannot fall back the
   * way `stackedBaseFor` does: guessing the base lands one child's half of a feature
   * on the release branch.
   */
  test("stackedPrBase refuses rather than guessing when origin cannot be read", () => {
    const { root, repo } = makeRepoWithUnreachableOrigin();
    try {
      const body = `process.stdout.write(JSON.stringify({ base: placement.stackedPrBase("o/r") ?? null }));`;
      const { value } = run<{ base: string | null; threw?: string }>(body, repo, { rules: [SUB_ISSUE], env: { TYPE: "issue", NUMBER: "1" } });
      const threw = (value as { threw?: string }).threw ?? "";
      expect(threw).toContain("Cannot tell whether atomaton/issue-12 exists on origin");
      expect(threw).toContain("Retry the call");
    } finally {
      rmSync(root, { recursive: true, force: true, maxRetries: 5 });
    }
  });
});
