/**
 * base-edit.ts — building a commit on the base branch's tree without a checkout.
 *
 * ## Why the object store rather than a branch switch
 *
 * The run that calls this is in the middle of work: its branch holds the change it
 * is delivering, and its index may hold anything at all. A `git switch` to the base
 * branch, a second worktree, a `stash` — each can lose that work or fight this call
 * for the same tree. So nothing here checks anything out. The commit is assembled
 * from objects: a temporary index seeded from the base branch's tree, one
 * `hash-object` and `update-index` per file, `write-tree`, `commit-tree`, and a
 * single refspec push. `HEAD`, the shared index and the working tree are never read
 * or written.
 *
 * This is `mcp/attachments.ts`'s `publishDraft` technique with the base branch's tip
 * as the parent instead of an empty tree. The technique is in two places because the
 * two do different things with it: publishing accumulates history on an orphan branch
 * nobody merges, and this produces exactly one commit on top of a branch people
 * review, from the tree that branch holds now.
 *
 * ## What is read, and from where
 *
 * The file being amended is read out of the base branch's TREE, not off the disk.
 * That is what makes the base branch the subject of the edit rather than whatever
 * this run happens to have checked out — and the two differ whenever the base has
 * moved since the run started, which is the case the `old` check exists for.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gitRun, gitRunWith } from "./gh.ts";
import { baseBranch, readOriginBranch } from "./branch-reads.ts";
import { overlayTwinPath } from "../../domain/machinery/base-edit.ts";

/**
 * The commit identity, as `git -c` pairs.
 *
 * Passed per command rather than read from configuration, for the reason
 * `publishDraft` gives: the runner's own `git config user.name` is a shell step that
 * may not have run by the time a server starts, and a commit that cannot be created
 * for want of an identity is work silently not published.
 */
function commitIdentity(): string[] {
  const agent = (process.env.AGENT ?? "").trim() || "engineer";
  const name = `atomaton-${agent}`;
  return ["-c", `user.name=${name}`, "-c", `user.email=${name}@users.noreply.github.com`];
}

/**
 * `git`, with stdout handed back exactly as written.
 *
 * `gitRun` decodes and TRIMS, which is right for a ref name and wrong for a file:
 * a prompt's trailing newline is part of the prompt, and a replacement applied to a
 * trimmed copy would write a file that had lost it. Every other call here asks about
 * a ref or a tree and goes through `gitRun`.
 */
function gitRaw(...args: string[]): { code: number; stdout: string; stderr: string } {
  const proc = Bun.spawnSync({ cmd: ["git", ...args], stdout: "pipe", stderr: "pipe" });
  return {
    code: proc.exitCode ?? 1,
    stdout: proc.stdout ? proc.stdout.toString("utf8") : "",
    stderr: proc.stderr ? proc.stderr.toString("utf8") : "",
  };
}

/** One file as the base branch's tree holds it. */
type BaseFileRead =
  | { readonly present: true; readonly text: string; readonly mode: string }
  | { readonly present: false };

/**
 * One file as the base branch's tree holds it, by mode and bytes.
 *
 * `ls-tree` and `cat-file blob`, in that order, because the mode is not derivable
 * from the content and has to be preserved: `.github/atomaton/scripts/` holds
 * executable shell scripts, and writing one back as `100644` would quietly stop it
 * being runnable.
 */
export function readBaseFile(baseSha: string, path: string): BaseFileRead {
  const listing = gitRun("ls-tree", baseSha, "--", path);
  if (listing.code !== 0) {
    throw new Error(`could not read the tree of ${baseSha.slice(0, 12)}: ${listing.stderr || listing.stdout}`);
  }
  const line = listing.stdout.split("\n").find((entry) => entry.trim() !== "");
  if (line === undefined) return { present: false };
  const [mode, type] = line.trim().split(/\s+/);
  if (type !== "blob" || mode === undefined) {
    throw new Error(`\`${path}\` is not a file on this branch (\`${line.trim()}\`), so it cannot be amended.`);
  }

  const blob = gitRaw("cat-file", "blob", `${baseSha}:${path}`);
  if (blob.code !== 0) throw new Error(`could not read \`${path}\` from this branch: ${blob.stderr || blob.stdout}`);
  return { present: true, text: blob.stdout, mode };
}

/**
 * The base branch this tool amends, and its commit.
 *
 * `baseBranch()` — `base_branch` from config.yaml when it is set, the remote's default
 * branch otherwise — because that is the branch this project's machinery is live on,
 * and the amendment is an observation about the machinery rather than part of any
 * issue's work. A refused read is an error rather than a fall back to the default
 * branch: building the commit on the wrong tree and pushing it is worse than retrying.
 *
 * The fetch goes into the remote-tracking ref and NOT into `FETCH_HEAD`, and the sha is
 * read back from there rather than from `ls-remote`. Two reasons, both measured shapes
 * from elsewhere in this repository: a run's checkout may be shallow, so the tip
 * `ls-remote` named a moment earlier can be an object this repository does not have;
 * and `FETCH_HEAD` is what `self-overlay.test.ts` and every `merge-base` caller read to
 * decide what a change branched from, so a tool that overwrote it would change the
 * answer of a check running beside it.
 */
export function fetchBaseTip(): { base: string; sha: string } {
  const resolved = baseBranch();
  if (!resolved.known) throw new Error(`the base branch could not be determined: ${resolved.why}`);
  const base = resolved.branch;

  const tip = readOriginBranch(base);
  if (!tip.known) throw new Error(`\`${base}\` could not be read from origin: ${tip.why}`);
  if (!tip.present) throw new Error(`origin has no \`${base}\` branch, so there is nothing to amend.`);

  // `+`, because the remote-tracking ref is this repository's cache of what origin
  // says, not a ref anything authored: a run whose checkout holds a stale one should
  // amend the branch as it is now, and `old` not matching is what catches a base that
  // moved. The fetch writes no `FETCH_HEAD` -- see above.
  const remoteRef = `refs/remotes/origin/${base}`;
  const fetched = gitRun("fetch", "--no-tags", "--no-write-fetch-head", "origin", `+refs/heads/${base}:${remoteRef}`);
  if (fetched.code !== 0) throw new Error(`could not fetch \`${base}\` from origin: ${fetched.stderr || fetched.stdout}`);
  const commit = gitRun("rev-parse", `${remoteRef}^{commit}`);
  if (commit.code !== 0) {
    throw new Error(`\`${base}\` was fetched but its commit could not be resolved: ${commit.stderr || commit.stdout}`);
  }
  return { base, sha: commit.stdout.trim() };
}

/** One file to write: its repository path, its whole new text, and the mode to write. */
export interface StagedFile {
  readonly path: string;
  readonly text: string;
  readonly mode: string;
}

/** What `update-index --index-info` is fed: mode, blob, path, NUL after each record. */
function indexInfoFor(entries: readonly { blob: string; mode: string; target: string }[]): string {
  return entries.map((entry) => `${entry.mode} blob ${entry.blob}\t${entry.target}\0`).join("");
}

/**
 * Build one commit on top of `baseSha` holding exactly `files`, in a temporary index.
 *
 * Every path is read back out of the tree about to be committed, because
 * `git update-index` reports some paths it did not stage as a warning and exit code 0
 * — so a commit that dropped a file would otherwise be reported as success, with a
 * pull request for a change that is not in it.
 */
export function buildCommitOnBase(baseSha: string, files: readonly StagedFile[], message: string): string {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-amend-"));
  // One index for these commands only. Assigning `GIT_INDEX_FILE` on `process.env`
  // would leave the run's own index described by a tree holding three files, and every
  // later `git` in this server would act on it — see `gitRunWith`.
  const env = { env: { GIT_INDEX_FILE: join(dir, "index") } };
  try {
    const seeded = gitRunWith(env, "read-tree", baseSha);
    if (seeded.code !== 0) {
      throw new Error(`could not start from the base branch's tree: ${seeded.stderr || seeded.stdout}`);
    }

    const staged: { blob: string; mode: string; target: string }[] = [];
    for (const file of files) {
      const hashed = gitRunWith({ ...env, stdin: file.text }, "hash-object", "-w", "--stdin", "--no-filters");
      if (hashed.code !== 0) {
        throw new Error(`could not write \`${file.path}\` into the object store: ${hashed.stderr || hashed.stdout}`);
      }
      staged.push({ blob: hashed.stdout, mode: file.mode, target: file.path });
    }

    const indexed = gitRunWith({ ...env, stdin: indexInfoFor(staged) }, "update-index", "-z", "--index-info");
    if (indexed.code !== 0) throw new Error(`could not stage the change: ${indexed.stderr || indexed.stdout}`);

    const tree = gitRunWith(env, "write-tree");
    if (tree.code !== 0) throw new Error(`could not write the tree: ${tree.stderr || tree.stdout}`);

    const missing = files.filter((file) => gitRun("cat-file", "-e", `${tree.stdout}:${file.path}`).code !== 0);
    if (missing.length > 0) {
      throw new Error(
        `git did not accept ${missing.map((file) => `\`${file.path}\``).join(", ")} into the tree, so nothing was ` +
          "pushed. A path must be repository-relative and may not contain `..`.",
      );
    }

    const commit = gitRun(...commitIdentity(), "commit-tree", tree.stdout, "-p", baseSha, "-m", message);
    if (commit.code !== 0) throw new Error(`could not create the commit: ${commit.stderr || commit.stdout}`);
    return commit.stdout.trim();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Push `commit` as the tip of `branch` on `origin`, or throw saying why it was refused. */
export function pushCommit(commit: string, branch: string): void {
  const pushed = gitRun("push", "origin", `${commit}:refs/heads/${branch}`);
  if (pushed.code === 0) return;
  const refused = /non-fast-forward|fetch first|rejected/i.test(`${pushed.stderr} ${pushed.stdout}`);
  throw new Error(
    refused
      ? `\`${branch}\` moved on origin while this call was building its commit, so the push was refused rather than ` +
          "replacing somebody else's. Nothing was pushed; retry, which names a new branch."
      : `could not push \`${branch}\`: ${pushed.stderr || pushed.stdout}`,
  );
}

/** An overlay twin that is on the branch: its path, its bytes and the mode to write. */
interface Twin {
  readonly path: string;
  readonly text: string;
  readonly mode: string;
}

/**
 * The `self/` twin of `path`, when the base branch has one.
 *
 * `self/` mirrors `.github/`, and the self-deploy rebuilds the deployed tree from it,
 * so the two must hold the same bytes. Whether this repository has one at all is asked
 * of the base branch's tree rather than assumed: an adopter has no `self/`, and the
 * tool is the same tool there.
 */
export function readTwin(baseSha: string, path: string): Twin | undefined {
  const twinPath = overlayTwinPath(path);
  const read = readBaseFile(baseSha, twinPath);
  return read.present ? { path: twinPath, text: read.text, mode: read.mode } : undefined;
}
