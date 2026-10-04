/**
 * data-layout.ts — the shape of the `atomaton-data` branch's tree.
 *
 * ## Why the shapes are here and not beside their writers
 *
 * The branch holds two trees, `sessions/` and `workspace/`, and each is written by
 * one file and read by another: `lib/atomaton-data.ts` writes both, and
 * `atomaton-data-pruning.ts` decides which of them is dead. The pruner cannot import
 * the writer — it is in `domain/` and the writer is in `entrypoints/`, and the
 * layering rule runs one way — so it spelled `workspace/` and `issue-<n>` for itself.
 * Two spellings of one path is the shape of a bug that deletes the wrong thing, so
 * the shapes live here where both can reach them.
 *
 * ## Why `issue-<n>` and not the node type
 *
 * A workspace is stored under the ISSUE that owns the work, not the node a run was
 * dispatched on, so that a re-run after a pull request is gone still finds it. The
 * pruner relies on this — it reads the number out of the path and asks GitHub about
 * that issue — so the prefix is a contract between the two, not a naming preference.
 */

/** The tree holding per-agent session files. */
export const SESSIONS_TREE = "sessions/";

/** The tree holding an agent's scratch workspace, one directory per root issue. */
export const WORKSPACE_TREE = "workspace/";

/** The subdirectory holding a session's archived predecessors. */
export const ARCHIVE_DIR = "archive";

/** The directory a node's sessions live in, e.g. `sessions/issue-42`. */
export function sessionDir(type: string, number: string | number): string {
  return `${SESSIONS_TREE}${type}-${number}`;
}

/** Where a root issue's workspace lives, e.g. `workspace/issue-42`. */
export function workspaceDir(rootIssue: string | number): string {
  return `${WORKSPACE_TREE}issue-${rootIssue}`;
}
