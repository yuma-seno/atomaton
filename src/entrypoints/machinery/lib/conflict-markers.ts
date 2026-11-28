/**
 * conflict-markers.ts — the files in a checked-out tree that still carry git's
 * conflict markers.
 *
 * ## Why validation measures this rather than inferring it from a red check
 *
 * The update machinery writes a collision into the tree as markers where a release
 * and this repository both changed a file, and a pull request carrying them is not a
 * pull request that failed — it is one waiting for somebody to resolve it. CI cannot
 * tell the two apart: it runs the repository's commands against a half-merged file and
 * reports a compile or parse error, which reads on the pull request as a red check
 * with no reason (#671). Reading the tree for markers is what lets the validation say
 * which of the two it is, and where.
 *
 * ## The measurement is a heuristic, and this is where it draws the line
 *
 * A collision writes `<<<<<<< <label>` above one side and `>>>>>>> <label>` below the
 * other. A file carrying BOTH is unresolved. Requiring both ends is what keeps a
 * document that quotes one marker line — this repository's own prose about conflicts
 * does — from reading as a conflict.
 *
 * Binary is skipped by git's own test for it, a NUL byte: a resolved binary holds
 * whichever side was written there, and no line in it means anything.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** The two ends of a conflict hunk, each anchored to a line of its own. */
const START = /^<{7}(?: |$)/m;
const END = /^>{7}(?: |$)/m;

/**
 * Directories whose files no merge collision is ever about.
 *
 * `.git` is the checkout's own history — every object in it holds whatever the branch
 * has ever held, markers included, so reading it would report a conflict for a tree
 * that has none. `node_modules` is a dependency tree that is not the pull request's.
 */
const SKIPPED_DIRS = new Set([".git", "node_modules"]);

/**
 * Files larger than this are not read.
 *
 * A conflict is written into a source file, a config, or a document — never into the
 * kind of blob this admits. The cost of missing one is the behaviour before this check
 * existed (CI runs and reports the markers as it always did), never a wrong red.
 */
const MAX_BYTES = 8 * 1024 * 1024;

/** Whether `text` carries both ends of a conflict. */
export function carriesConflictMarkers(text: string): boolean {
  return START.test(text) && END.test(text);
}

/** Whether one file on disk carries them, read without being decoded if it is binary. */
function fileCarriesMarkers(path: string): boolean {
  try {
    if (statSync(path).size > MAX_BYTES) return false;
    const bytes = readFileSync(path);
    if (bytes.includes(0)) return false;
    return carriesConflictMarkers(bytes.toString("utf8"));
  } catch {
    // Unreadable, or gone between the walk and the read. A file this cannot read is
    // not evidence of a conflict, and stopping the validation over it would replace a
    // verdict with a broken run.
    return false;
  }
}

/**
 * Every file under `root` that still carries conflict markers, as paths relative to
 * `root`, sorted.
 *
 * Sorted because the caller writes them into a comment: a list in the order the
 * filesystem returned would differ between two runs about the same tree, and the
 * comment is something a person reads to decide where to start.
 */
export function findConflictMarkers(root: string): string[] {
  const found: string[] = [];

  const walk = (dir: string): void => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      // A symlink is not followed: it may point outside this tree, and a loop through
      // one would walk forever.
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRS.has(entry.name)) walk(full);
      } else if (entry.isFile() && fileCarriesMarkers(full)) {
        found.push(relative(root, full).split(sep).join("/"));
      }
    }
  };

  walk(root);
  return found.sort();
}
