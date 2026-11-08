/**
 * atomaton-data.ts — helpers for reading/writing per-agent session.json files
 * on the orphan `atomaton-data` git branch, this repo's persistent session
 * store (GitHub Actions runners have no other durable storage between runs).
 */
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readlinkSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { gitRun } from "../../../adapters/github/gh.ts";
import { ARCHIVE_DIR, sessionDir, workspaceDir } from "../../../domain/machinery/data-layout.ts";

/**
 * The orphan branch this repository keeps its durable state on.
 *
 * One constant, because the name was written out fifteen times and a rename would
 * have to find every one — including the `origin/atomaton-data:path` refs, where a
 * missed copy reads a branch that no longer exists and silently finds nothing.
 */
export const DATA_BRANCH = "atomaton-data";

/** Path of a given agent's session file on the atomaton-data branch. */
export function sessionTargetPath(type: string, number: string | number, agent: string): string {
  return `${sessionDir(type, number)}/${agent}.json`;
}

export function nextArchiveSessionPath(
  type: string,
  number: string | number,
  agent: string,
  existingNames: readonly string[],
): string {
  const escapedAgent = agent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const archivePattern = new RegExp(`^${escapedAgent}-(\\d+)\\.json$`);
  const nextNumber = existingNames
    .map((name) => archivePattern.exec(name))
    .filter((match): match is RegExpExecArray => match !== null)
    .reduce((max, match) => Math.max(max, Number(match[1])), 0) + 1;
  return `${sessionDir(type, number)}/${ARCHIVE_DIR}/${agent}-${nextNumber}.json`;
}

/**
 * Reads `targetPath`'s content from the `atomaton-data` branch's tip on
 * `origin`, WITHOUT checking out or otherwise disturbing the current
 * working tree/branch (just `git fetch` + `git show <ref>:<path>`).
 * Returns undefined if the branch, or the file within it, doesn't exist yet.
 */
export function restoreSession(targetPath: string): string | undefined {
  if (gitRun("fetch", "origin", DATA_BRANCH, "--depth=1").code !== 0) {
    return undefined;
  }
  if (gitRun("cat-file", "-e", `origin/${DATA_BRANCH}:${targetPath}`).code !== 0) {
    return undefined;
  }
  const shown = gitRun("show", `origin/${DATA_BRANCH}:${targetPath}`);
  return shown.code === 0 ? shown.stdout : undefined;
}

/** `git` with something on its stdin, which `gitRun` has no way to supply. */
function gitPipe(input: string, ...args: string[]): { code: number; stdout: string } {
  const proc = Bun.spawnSync({ cmd: ["git", ...args], stdin: Buffer.from(input), stdout: "pipe", stderr: "pipe" });
  return { code: proc.exitCode ?? 1, stdout: proc.stdout ? proc.stdout.toString("utf8").trim() : "" };
}

/**
 * Read one file from the tip of `branch`, without disturbing the working tree.
 *
 * `restoreSession` with the branch as a parameter. Kept separate rather than
 * generalising that one, because its name is what tells a reader which of the two
 * stores they are looking at, and the two have opposite rules about history.
 */
export function restoreFromBranch(branch: string, targetPath: string): string | undefined {
  if (gitRun("fetch", "origin", branch, "--depth=1").code !== 0) return undefined;
  if (gitRun("cat-file", "-e", `origin/${branch}:${targetPath}`).code !== 0) return undefined;
  const shown = gitRun("show", `origin/${branch}:${targetPath}`);
  return shown.code === 0 ? shown.stdout : undefined;
}

/**
 * Write one file as the ONLY commit on `branch`, discarding whatever was there.
 *
 * For data that is rewritten whole, whose old versions are worth nothing, and which
 * can be rebuilt if it is lost. The issue search index is all three -- see
 * `adapters/github/issue-index.ts` for what keeping its history cost before this existed.
 *
 * # Why this does not use a worktree
 *
 * `saveSession` checks out a worktree because it edits a tree it must preserve. There
 * is nothing to preserve here: the commit has no parent and one file, so it can be
 * built out of plumbing -- a blob, a tree, a commit -- without a checkout, an index,
 * or a second copy of anything on disk. That also means it cannot disturb the agent's
 * own checkout, which at this point in a run may hold uncommitted work.
 *
 * # Why the force-push is safe here and would not be on `atomaton-data`
 *
 * Nothing else is on this branch. A force-push that loses a concurrent write loses
 * one refresh of an index that the next call rebuilds from `?since=`; the same
 * force-push on `atomaton-data` would drop a session that nothing can reconstruct.
 */
export function saveAsOnlyCommit(
  branch: string,
  targetPath: string,
  content: string,
  commitMessage: string,
): boolean {
  // commit-tree takes the committer from config, which is not set in a fresh
  // checkout; the same two lines `saveSession` runs before it creates the branch.
  gitRun("config", "user.email", "action@github.com");
  gitRun("config", "user.name", "GitHub Actions");

  const blob = gitPipe(content, "hash-object", "-w", "--stdin");
  if (blob.code !== 0) return false;
  const tree = gitPipe(`100644 blob ${blob.stdout}\t${targetPath}\n`, "mktree");
  if (tree.code !== 0) return false;
  // No parent: the branch is one commit, now and after every later save.
  const commit = gitPipe(commitMessage, "commit-tree", tree.stdout);
  if (commit.code !== 0) return false;

  return gitRun("push", "--force", "origin", `${commit.stdout}:refs/heads/${branch}`).code === 0;
}
function gitIn(cwd: string, ...args: string[]): { code: number; stdout: string } {
  const proc = Bun.spawnSync({ cmd: ["git", ...args], cwd, stdout: "pipe", stderr: "pipe" });
  return { code: proc.exitCode ?? 1, stdout: proc.stdout ? proc.stdout.toString("utf8").trim() : "" };
}

/**
 * Writes `content` to `targetPath` on the `atomaton-data` branch and pushes it,
 * retrying on push races (parallel agents -- e.g. sibling sub-issue
 * engineers running at the same time -- each write to their own uniquely
 * named target path, but all push to the SAME atomaton-data branch, so a race
 * is expected, not exceptional).
 *
 * Uses a separate git worktree (unlike `restoreSession`, which is a safe
 * read-only `git show`) so the CURRENT checkout/branch -- which may hold the
 * agent's own real, possibly-uncommitted code changes at this point in the
 * job -- is never disturbed. Returns true if the save succeeded (or the
 * content was already identical -- a no-op "save").
 */
export function saveSession(targetPath: string, content: string, commitMessage: string): boolean {
  if (gitRun("ls-remote", "--exit-code", "origin", DATA_BRANCH).code !== 0) {
    gitRun("config", "user.email", "action@github.com");
    gitRun("config", "user.name", "GitHub Actions");
    // 4b825dc6... is Git's canonical empty-tree SHA (never changes).
    const commit = gitRun("commit-tree", "4b825dc642cb6eb9a060e54bf8d69288fbee4904", "-m", `init: ${DATA_BRANCH} session store`).stdout;
    gitRun("push", "origin", `${commit}:refs/heads/${DATA_BRANCH}`);
  }

  gitRun("fetch", "origin", DATA_BRANCH);
  const worktreeDir = mkdtempSync(join(tmpdir(), "atomaton-data-wt-"));
  gitRun("worktree", "add", worktreeDir, `origin/${DATA_BRANCH}`);

  let saved = false;
  try {
    gitIn(worktreeDir, "config", "user.email", "action@github.com");
    gitIn(worktreeDir, "config", "user.name", "GitHub Actions");

    for (let attempt = 1; attempt <= 5; attempt++) {
      gitIn(worktreeDir, "fetch", "origin", DATA_BRANCH);
      gitIn(worktreeDir, "reset", "--hard", `origin/${DATA_BRANCH}`);

      const fullTarget = join(worktreeDir, targetPath);
      mkdirSync(dirname(fullTarget), { recursive: true });
      writeFileSync(fullTarget, content);
      gitIn(worktreeDir, "add", targetPath);

      if (gitIn(worktreeDir, "diff", "--cached", "--quiet").code === 0) {
        saved = true;
        break;
      }

      gitIn(worktreeDir, "commit", "-m", commitMessage);

      if (gitIn(worktreeDir, "push", "origin", `HEAD:${DATA_BRANCH}`).code === 0) {
        saved = true;
        break;
      }

      console.error(`Push attempt ${attempt} failed (concurrent push) -- resetting and retrying with a fresh pull...`);
      Bun.sleepSync(attempt * 2000);
    }
  } finally {
    gitRun("worktree", "remove", "--force", worktreeDir);
    rmSync(worktreeDir, { recursive: true, force: true });
  }

  return saved;
}

/**
 * Preserve a session before recovery as the next numbered archive entry.
 * Number allocation happens inside the retrying atomaton-data worktree so two
 * recoveries racing on the same context cannot select the same archive path.
 */
export function archiveSession(
  type: string,
  number: string | number,
  agent: string,
  content: string,
): string | undefined {
  if (gitRun("ls-remote", "--exit-code", "origin", DATA_BRANCH).code !== 0) return undefined;

  gitRun("fetch", "origin", DATA_BRANCH);
  const worktreeDir = mkdtempSync(join(tmpdir(), "atomaton-data-archive-wt-"));
  gitRun("worktree", "add", worktreeDir, `origin/${DATA_BRANCH}`);

  let archivedPath: string | undefined;
  try {
    gitIn(worktreeDir, "config", "user.email", "action@github.com");
    gitIn(worktreeDir, "config", "user.name", "GitHub Actions");

    for (let attempt = 1; attempt <= 5; attempt++) {
      gitIn(worktreeDir, "fetch", "origin", DATA_BRANCH);
      gitIn(worktreeDir, "reset", "--hard", `origin/${DATA_BRANCH}`);

      const archiveDir = join(worktreeDir, sessionDir(type, number), ARCHIVE_DIR);
      mkdirSync(archiveDir, { recursive: true });
      const relativePath = nextArchiveSessionPath(type, number, agent, readdirSync(archiveDir));
      const fullPath = join(worktreeDir, relativePath);
      if (existsSync(fullPath)) continue;

      writeFileSync(fullPath, content);
      gitIn(worktreeDir, "add", relativePath);
      gitIn(worktreeDir, "commit", "-m", `session: archive ${agent} on ${type} ${number}`);

      if (gitIn(worktreeDir, "push", "origin", `HEAD:${DATA_BRANCH}`).code === 0) {
        archivedPath = relativePath;
        break;
      }

      console.error(`Archive push attempt ${attempt} failed -- retrying with the latest ${DATA_BRANCH} branch.`);
      Bun.sleepSync(attempt * 2000);
    }
  } finally {
    gitRun("worktree", "remove", "--force", worktreeDir);
    rmSync(worktreeDir, { recursive: true, force: true });
  }

  return archivedPath;
}


// ── The agent's scratch workspace ─────────────────────────────────────────────
//
// A directory rather than a file, and the difference is why these two functions
// exist alongside the session pair above.
//
// `restoreSession` reads with `git show <ref>:<path>`, which only works on a blob.
// `saveSession` writes one file into a real worktree. A workspace is a tree of
// whatever the agent chose to leave there, so both halves need the tree form.
//
// See `domain/work/workspace.ts` for what the directory is FOR and why it is a
// directory instead of a pair of evacuate/retrieve tools.

/** Where a root issue's workspace lives on the atomaton-data branch. */
export function workspaceTargetPrefix(rootIssue: string | number): string {
  return workspaceDir(rootIssue);
}

/**
 * Unpack `prefix` from the atomaton-data branch into `destDir`.
 *
 * `git archive | tar -x` rather than a sparse checkout: it needs no worktree, no
 * index and no branch switch, which is the same property that makes
 * `restoreSession` safe to call in the middle of a run.
 *
 * Returns false when there is nothing stored yet -- the ordinary case on the first
 * run for an issue, not a failure.
 */
export function restoreWorkspace(prefix: string, destDir: string): boolean {
  if (gitRun("fetch", "origin", DATA_BRANCH, "--depth=1").code !== 0) return false;
  // `cat-file -e` on a tree tells us whether anything was ever saved, and keeps a
  // missing workspace from looking like a failed extraction.
  if (gitRun("cat-file", "-e", `origin/${DATA_BRANCH}:${prefix}`).code !== 0) return false;

  mkdirSync(destDir, { recursive: true });
  const archive = Bun.spawnSync({
    cmd: ["git", "archive", "--format=tar", `origin/${DATA_BRANCH}:${prefix}`],
    stdout: "pipe",
    stderr: "pipe",
  });
  if (archive.exitCode !== 0) {
    console.error(`[atomaton-data] git archive failed: ${archive.stderr.toString().trim()}`);
    return false;
  }
  const extract = Bun.spawnSync({
    cmd: ["tar", "-x", "-C", destDir],
    stdin: archive.stdout,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (extract.exitCode !== 0) {
    console.error(`[atomaton-data] tar failed: ${extract.stderr.toString().trim()}`);
    return false;
  }
  return true;
}

/** A copied directory: writable, because the worktree it is staged from is removed again. */
const DIRECTORY_MODE = 0o755;
/** A copied file. Permissions are not what the snapshot carries; the execute bit is. */
const FILE_MODE = 0o644;
/** The same, for a source file that has an execute bit for somebody. */
const EXECUTABLE_FILE_MODE = 0o755;

/**
 * Copy the tree at `source` into the (empty) directory `destination`, returning the
 * paths that were left out because this user cannot read them.
 *
 * ## Why not `cpSync`
 *
 * `cpSync` fails the whole tree on the first file it cannot read. The workspace is
 * written by the tool user and saved by the runner -- two identities, one directory --
 * so a file the agent's tools created 0600 is unreadable to the copy, and every other
 * file in the workspace is lost with it. A path that cannot be read is skipped and
 * named instead; the rest of the tree is worth more than any one of them.
 *
 * ## Why `.git` is not copied
 *
 * Committing a directory that holds a `.git` records it as a gitlink -- one entry,
 * no contents -- so it does not preserve a clone's history, it makes the whole
 * directory restore as an empty one. Measured, on a workspace holding one clone:
 *
 *     .git copied   160000 commit <sha>   workspace/issue-7/data-branch
 *                   -> restored as an empty `data-branch/`
 *     .git skipped  100644 blob <sha>     workspace/issue-7/data-branch/README.md
 *                   -> restored as the files the agent had
 *
 * Leaving it out is the version that keeps what the agent left.
 *
 * ## Why the modes are normalized
 *
 * `git add` records 100644 or 100755 and nothing else, so the modes on disc matter only
 * to the worktree staging them: a read-only directory cannot be removed when the next
 * push attempt starts over, and a 000 file cannot be read by the `git` doing the add.
 * The execute bit is carried because that one survives the commit.
 *
 * Returns undefined when `source` itself cannot be read. That is not a partial tree to
 * save: staging an empty one over the previous snapshot would delete it, and a stale
 * workspace is worth far more to the next run than none.
 */
function copyWorkspace(source: string, destination: string): string[] | undefined {
  const skipped: string[] = [];

  /** Walks `from` into `to`. False when `from` could not be listed at all. */
  const copy = (from: string, to: string): boolean => {
    let entries;
    try {
      entries = readdirSync(from, { withFileTypes: true });
    } catch {
      skipped.push(relative(source, from) || ".");
      return false;
    }
    // Created only once its contents are known: a directory this user cannot list is
    // left out whole rather than committed as an empty one, which the next run would
    // restore as a directory that had lost everything in it.
    mkdirSync(to, { recursive: true });
    chmodSync(to, DIRECTORY_MODE);

    for (const entry of entries) {
      // Unprefixed and exact: `notes/.gitignore` is an ordinary file, and a `.git` that
      // is a FILE rather than a directory is a worktree's pointer into one.
      if (entry.name === ".git") continue;
      const sourcePath = join(from, entry.name);
      const targetPath = join(to, entry.name);
      try {
        if (entry.isDirectory()) {
          copy(sourcePath, targetPath);
        } else if (entry.isSymbolicLink()) {
          // Git stores a symlink as one, so this is the copy that keeps it: reading
          // through the link would put a copy of somebody else's file in the snapshot.
          symlinkSync(readlinkSync(sourcePath), targetPath);
        } else if (entry.isFile()) {
          copyFileSync(sourcePath, targetPath);
          const executable = (statSync(sourcePath).mode & 0o111) !== 0;
          chmodSync(targetPath, executable ? EXECUTABLE_FILE_MODE : FILE_MODE);
        } else {
          // A fifo or a socket. Nothing to carry, and reading one blocks.
          skipped.push(relative(source, sourcePath));
        }
      } catch {
        // Unreadable, or it went away between the listing and the copy. Either way the
        // rest of the tree is worth more than this one path -- and a file the copy
        // stopped halfway through is not a shorter version of it, so it does not stay.
        rmSync(targetPath, { recursive: true, force: true });
        skipped.push(relative(source, sourcePath));
      }
    }
    return true;
  };

  return copy(source, destination) ? skipped : undefined;
}

/**
 * Replace `prefix` on the atomaton-data branch with the contents of `sourceDir`.
 *
 * Replace, not merge. A file the agent deleted has to be gone next run, or the
 * workspace becomes a place where deletions do not take -- the same silent shape
 * `unzip -o` produced for `.github/` before `self/` (see
 * `tests/contract/self-overlay.test.ts`). `git add --all <prefix>` after removing
 * the old tree stages the deletions along with the additions.
 *
 * The retry loop is `saveSession`'s, for the same reason: sibling agents on
 * decomposed issues push to this branch concurrently, and a rejected push means
 * someone else got there first rather than that anything is wrong.
 */
export function saveWorkspace(prefix: string, sourceDir: string, commitMessage: string): boolean {
  if (!existsSync(sourceDir)) return true;
  if (gitRun("ls-remote", "--exit-code", "origin", DATA_BRANCH).code !== 0) {
    // No branch yet means no session has ever been saved either. Leave creating it
    // to `saveSession`, which runs in the same job: a workspace with no session is
    // not a state worth bringing into existence.
    console.error(`[${DATA_BRANCH}] ${DATA_BRANCH} does not exist yet; skipping workspace save`);
    return false;
  }

  gitRun("fetch", "origin", DATA_BRANCH);
  const worktreeDir = mkdtempSync(join(tmpdir(), "atomaton-data-ws-"));
  gitRun("worktree", "add", worktreeDir, `origin/${DATA_BRANCH}`);

  let saved = false;
  try {
    gitIn(worktreeDir, "config", "user.email", "action@github.com");
    gitIn(worktreeDir, "config", "user.name", "GitHub Actions");

    for (let attempt = 1; attempt <= 5; attempt++) {
      gitIn(worktreeDir, "fetch", "origin", DATA_BRANCH);
      gitIn(worktreeDir, "reset", "--hard", `origin/${DATA_BRANCH}`);

      const target = join(worktreeDir, prefix);
      rmSync(target, { recursive: true, force: true });
      mkdirSync(dirname(target), { recursive: true });
      const skipped = copyWorkspace(sourceDir, target);
      if (skipped === undefined) {
        console.error(`[${DATA_BRANCH}] cannot read ${sourceDir}; leaving the previous workspace snapshot alone`);
        break;
      }
      // A warning annotation rather than a log line: the save itself succeeds, so
      // nothing else in the job says a file the agent left will not be there next run.
      for (const path of skipped) {
        console.error(
          `::warning::workspace snapshot: left ${path} out, because the user saving it cannot read it`,
        );
      }
      // Clear the index's entries for the prefix before staging the new tree.
      //
      // `git add --all` alone is not enough, and the reason is measured rather than
      // theoretical: a directory committed with a `.git` in it went in as a GITLINK, and
      // at that path the worktree holds an empty directory rather than a file. Staging
      // over it does not notice the files copied beneath -- the index keeps the gitlink
      // and everything under it is dropped silently, which is the same empty-directory
      // restore the `.git` skip exists to prevent, reached from the other side. One such
      // entry is on `atomaton-data` now. `--ignore-unmatch` because a prefix nobody has
      // saved yet is the ordinary first run.
      gitIn(worktreeDir, "rm", "-r", "--cached", "--quiet", "--ignore-unmatch", "--", prefix);
      gitIn(worktreeDir, "add", "--all", "--", prefix);

      if (gitIn(worktreeDir, "diff", "--cached", "--quiet").code === 0) {
        saved = true;
        break;
      }

      gitIn(worktreeDir, "commit", "-m", commitMessage);

      if (gitIn(worktreeDir, "push", "origin", `HEAD:${DATA_BRANCH}`).code === 0) {
        saved = true;
        break;
      }

      console.error(`[${DATA_BRANCH}] workspace push attempt ${attempt} failed (concurrent push) -- retrying`);
      Bun.sleepSync(attempt * 2000);
    }
  } finally {
    gitRun("worktree", "remove", "--force", worktreeDir);
    rmSync(worktreeDir, { recursive: true, force: true });
  }

  return saved;
}
