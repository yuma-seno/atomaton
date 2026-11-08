/**
 * atomaton-data.test.ts — what `saveWorkspace` carries into the snapshot, and what it
 * must survive on the way.
 *
 * ## Why the fixture is shaped like a real workspace
 *
 * The workspace is written by the tool user and saved by the runner, so the save has to
 * cope with files it cannot read -- and the agent may leave a clone in there, which
 * brings a `.git` whose pack files are read-only and whose promisor file is 0600. The
 * fixture is exactly that, because both properties are invisible to a tree of plain
 * 0644 files and only one of the two is about permissions.
 *
 * ## Why the unreadable file is `chmod 000`
 *
 * A 0600 file owned by the tool user reads to the runner exactly as a 000 file owned by
 * somebody else reads to the test process: no access at all. Root reads everything, so
 * on a root-run suite the tests that depend on an unreadable file report nothing -- they
 * are skipped rather than passed, because a green one would be claiming to have measured
 * something it could not.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hermeticEnv, removeTemp, scriptPath } from "../testing/harness.ts";

/** Whether a mode can stop this process reading a file. Root is the exception. */
const RUNS_AS_ROOT = process.getuid?.() === 0;

let root: string;
let origin: string;
let repo: string;
let workspace: string;

/** `git` in a temp repository, with the ambient repository's variables removed. */
function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", env: hermeticEnv() }).trim();
}

function save(): { status: number | null; stderr: string } {
  const result = spawnSync(
    "bun",
    ["run", scriptPath("save_workspace.ts"), "--root-issue", "7", "--source", workspace],
    { encoding: "utf8", cwd: repo, env: hermeticEnv() },
  );
  return { status: result.status, stderr: result.stderr };
}

/** Every path on the branch, as `git ls-tree -r` prints it. */
function snapshot(): string {
  return git(origin, "ls-tree", "-r", "atomaton-data");
}

/** A file of `content` at `path`, made read-only or unreadable as asked. */
function fileAt(path: string, content: string, mode?: number): void {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, content);
  if (mode !== undefined) chmodSync(path, mode);
}

/**
 * A workspace holding a clone: its `.git` with a read-only pack and a promisor file
 * nobody but its owner can read, the files it checked out, and the agent's own notes.
 */
function cloneInWorkspace(promisorMode: number): void {
  const pack = join(workspace, "data-branch", ".git", "objects", "pack");
  fileAt(join(workspace, "notes.md"), "agent notes\n");
  fileAt(join(workspace, "data-branch", "README.md"), "checked out\n");
  fileAt(join(pack, "pack-7698.pack"), "pack\n", 0o444);
  fileAt(join(pack, "pack-7698.promisor"), "promisor\n", promisorMode);
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "atomaton-data-test-"));
  origin = join(root, "origin.git");
  repo = join(root, "repo");
  workspace = join(root, "workspace");

  // A bare repository standing in for `origin`, and a checkout whose `cwd` is what
  // `saveWorkspace`'s own `git` calls run in.
  mkdirSync(origin);
  git(origin, "init", "--quiet", "--bare");
  mkdirSync(repo);
  git(repo, "init", "--quiet", "--initial-branch=main");
  git(repo, "config", "user.email", "test@example.com");
  git(repo, "config", "user.name", "Test");
  fileAt(join(repo, "README.md"), "the repository\n");
  git(repo, "add", "--all");
  git(repo, "commit", "--quiet", "-m", "seed");
  git(repo, "remote", "add", "origin", origin);
  // The branch the workspace is written to, created the way `saveSession` creates it.
  git(repo, "push", "--quiet", "origin", "HEAD:refs/heads/atomaton-data");
  git(repo, "fetch", "--quiet", "origin", "atomaton-data");
});

afterEach(() => {
  removeTemp(root);
});

describe("saveWorkspace", () => {
  test.skipIf(RUNS_AS_ROOT)(
    "saves the snapshot when a clone in the workspace holds a promisor file this user cannot read",
    () => {
      cloneInWorkspace(0o000);

      const { status, stderr } = save();

      expect(status, `save_workspace.ts exited ${status}:\n${stderr}`).toBe(0);
      expect(stderr, "the snapshot is saved, not warned about").not.toContain("WARN");
      const tree = snapshot();
      expect(tree, "the agent's own notes are the point of the snapshot").toContain(
        "workspace/issue-7/notes.md",
      );
      // Without its `.git`, a clone is ordinary files: what the agent checked out is
      // carried, where a commit holding the `.git` would record a gitlink and restore
      // an empty directory.
      expect(tree).toContain("workspace/issue-7/data-branch/README.md");
      expect(tree, "a commit cannot hold a repository's own metadata").not.toContain(".git/");
      expect(
        tree.split("\n").filter((line) => line.startsWith("160000")),
        "a gitlink restores as an empty directory, so it must not be what a workspace becomes",
      ).toEqual([]);
    },
  );

  test.skipIf(RUNS_AS_ROOT)(
    "keeps the rest of the workspace when one file cannot be read, and names it",
    () => {
      fileAt(join(workspace, "notes.md"), "agent notes\n");
      fileAt(join(workspace, "secret.bin"), "0600 for the tool user\n", 0o000);

      const { status, stderr } = save();

      expect(status, `save_workspace.ts exited ${status}:\n${stderr}`).toBe(0);
      const tree = snapshot();
      expect(tree, "one unreadable file must not cost the snapshot").toContain(
        "workspace/issue-7/notes.md",
      );
      expect(tree).not.toContain("secret.bin");
      expect(stderr, "what was left behind has to be visible in the run log").toContain(
        "secret.bin",
      );
    },
  );

  test("carries the rest of the workspace unchanged, executable files included", () => {
    fileAt(join(workspace, "notes.md"), "agent notes\n");
    fileAt(join(workspace, "probe/check.sh"), "#!/bin/sh\nexit 0\n", 0o755);

    const { status, stderr } = save();

    expect(status, `save_workspace.ts exited ${status}:\n${stderr}`).toBe(0);
    const tree = snapshot();
    expect(
      tree.split("\n").filter((line) => line.endsWith("\tworkspace/issue-7/probe/check.sh")),
      "an executable the agent left is still executable",
    ).toEqual([expect.stringContaining("100755")]);
    expect(tree).toContain("workspace/issue-7/notes.md");
  });

  test("carries a symlink as a symlink, dangling or not", () => {
    fileAt(join(workspace, "notes.md"), "agent notes\n");
    fileAt(join(workspace, "real.md"), "the target\n");
    symlinkSync("real.md", join(workspace, "link.md"));
    // A dangling link is ordinary in a workspace -- a build's shim whose target the
    // agent deleted. Following it would fail the copy; storing it is exact.
    symlinkSync("gone.md", join(workspace, "dangling.md"));

    const { status, stderr } = save();

    expect(status, `save_workspace.ts exited ${status}:\n${stderr}`).toBe(0);
    const stored = git(origin, "ls-tree", "-r", "atomaton-data");
    expect(stored).toContain("120000 blob");
    expect(stored).toContain("workspace/issue-7/link.md");
    expect(stderr, "a dangling link is stored, not warned about").not.toContain("dangling.md");
  });

  /**
   * The other side of the `.git` skip: a prefix that ALREADY holds what the old code
   * committed for a nested repository.
   *
   * Bookkeeping one of those the old way gives a GITLINK, and at that path the worktree
   * holds an empty directory rather than a file. `git add --all` does not notice files
   * beneath it -- the index keeps the gitlink and everything under it is dropped with no
   * failure and no warning. The whole prefix has to be cleared from the index first.
   */
  test("replaces a gitlink the previous snapshot left at the same path", () => {
    // A repository, so its commit id is one git can record as a gitlink.
    const nested = join(root, "nested");
    mkdirSync(nested);
    git(nested, "init", "--quiet", "--initial-branch=main");
    git(nested, "config", "user.email", "test@example.com");
    git(nested, "config", "user.name", "Test");
    fileAt(join(nested, "a.md"), "a\n");
    git(nested, "add", "--all");
    git(nested, "commit", "--quiet", "-m", "c");

    git(repo, "worktree", "add", "--quiet", "--detach", join(root, "seed"), "origin/atomaton-data");
    const seed = join(root, "seed");
    fileAt(join(seed, "workspace/issue-7/old-notes.md"), "the previous run's notes\n");
    git(seed, "add", "--all");
    git(seed, "update-index", "--add", "--cacheinfo",
      `160000,${git(nested, "rev-parse", "HEAD")},workspace/issue-7/data-branch`);
    git(seed, "commit", "--quiet", "-m", "snapshot from before the .git skip");
    git(seed, "push", "--quiet", "origin", "HEAD:refs/heads/atomaton-data");

    // The workspace this run leaves: ordinary files where that gitlink was.
    cloneInWorkspace(0o644);
    writeFileSync(join(workspace, "data-branch", "README.md"), "what the agent checked out\n");

    const { status, stderr } = save();

    expect(status, `save_workspace.ts exited ${status}:\n${stderr}`).toBe(0);
    const tree = snapshot();
    expect(
      tree.split("\n").filter((line) => line.startsWith("160000")),
      "the gitlink has to be replaced, or every file beneath it is dropped",
    ).toEqual([]);
    expect(tree).toContain("workspace/issue-7/data-branch/README.md");
    expect(tree, "the rest of the prefix is written as before").toContain(
      "workspace/issue-7/notes.md",
    );
    expect(tree, "a file the previous snapshot had and this one does not is still replaced").not.toContain(
      "old-notes.md",
    );
  });

  test.skipIf(RUNS_AS_ROOT)(
    "leaves the previous snapshot alone when the workspace cannot be read at all",
    () => {
      // A first save that works, so there is a previous snapshot to lose.
      fileAt(join(workspace, "notes.md"), "the first run's notes\n");
      expect(save().status).toBe(0);
      expect(snapshot()).toContain("workspace/issue-7/notes.md");

      // Whatever the reason -- a wrong ownership after a permissions change, a mount
      // that went away -- an unreadable source must not be staged as an empty tree.
      chmodSync(workspace, 0o000);
      try {
        const { status } = save();
        expect(status, "nothing to save is not the job's failure to report").toBe(0);
      } finally {
        chmodSync(workspace, 0o755);
      }
      expect(
        snapshot(),
        "an unreadable workspace would otherwise delete the snapshot the next run needs",
      ).toContain("workspace/issue-7/notes.md");
    },
  );
});
