/**
 * update-apply.ts — put an update plan onto a tree, and find out what really merges.
 *
 * The plan (`domain/machinery/update-plan.ts`) classifies every path; this module
 * performs what it proposes, inside a directory it is pointed at. The one judgement
 * it adds is the merge itself: a path marked `merge` — both sides changed it — is
 * resolved with `git merge-file`, the same three-way merge a normal git merge runs,
 * given the base content, the adopter's content, and the target content. The result
 * is either content both sides can live with, or a report that a person (or an agent
 * acting for one) is needed on that path.
 *
 * That is why the machinery's stop condition is measured here and not declared
 * upstream: whether BOTH sides changed a file says a merge is needed; running the
 * merge says whether it had a collision.
 *
 * ## What a collision is written as
 *
 * A collision is normally written into the tree as conflict markers, because that
 * is the one form a person or an agent can read the two sides out of. `config.yaml`
 * is the exception and is never written that way — `NEVER_MARKED` says why.
 *
 * ## Everything is decided before anything is written
 *
 * The merges all run in a scratch directory first, and the tree only sees whole
 * files after every path has resolved. A plan that half-applies is worse than one
 * that refuses outright: the tree would then say something no release ever shipped.
 * Refusal is total and answered with a `why`; the git status of the tree the run
 * works in is untouched by a refused plan.
 *
 * `treeRoot` is a directory this call writes into — in production the repository
 * checkout the workflow runs in, in tests a temp tree. Every path it touches must
 * already name a file in one of the two releases; anything else in the tree is the
 * adopter's, and this module never lists it, walks it, or writes beside it.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { CONFIG_FILE } from "../../../domain/machinery/machinery-layout.ts";
import type { UpdatePlan } from "../../../domain/machinery/update-plan.ts";

/**
 * Paths whose collision is reported instead of written into the tree.
 *
 * `.github/atomaton/config.yaml` is the machinery's own control file: every check
 * job is declared in it, and so are the setup commands, the merge policy and the
 * reach of every tool server. A marker makes YAML unparseable, and an unparseable
 * config is a state nothing recovers from — the pull request's checks cannot be
 * planned, `run_environment_setup.ts` dies before an agent starts, the servers of a
 * run that did start die reading it — so markers there name a decision nobody can
 * reach. That was #668: a self-apply left them in the file and every job failed with
 * `Multiline implicit key`, on the commit and on every re-run of it.
 *
 * The tree's own copy stays and the two sides go into the pull request's body
 * (`UpdateReport.held`), which is where a person reads a diff. The run still stops
 * at that pull request: the update decides nothing about a value here.
 */
const NEVER_MARKED: ReadonlySet<string> = new Set([CONFIG_FILE]);

/** A collision the tree did not take, with the content that would have carried it. */
export interface HeldCollision {
  readonly path: string;
  /**
   * What `git merge-file` produced: both sides, labelled, with markers. Reported in
   * the pull request, never written — a marker here is what `NEVER_MARKED` is for.
   */
  readonly text: string;
}

/** What applying a plan did, as the pull request and the notices render it. */
export interface ApplyResult {
  /** Paths that took the target's content (plan: take), written. */
  readonly taken: readonly string[];
  /** Plan: add — paths created. */
  readonly added: readonly string[];
  /** Plan: delete — paths removed. */
  readonly removed: readonly string[];
  /** Plan: merge — paths whose three-way merge resolved with no conflict. */
  readonly merged: readonly string[];
  /** Plan: merge — paths whose merge collided, now carrying conflict markers. */
  readonly conflicts: readonly string[];
  /** Plan: merge — paths whose merge collided and whose content stayed as the tree has it. */
  readonly held: readonly HeldCollision[];
}

/** Every path refuses together: no `why` means the tree holds the whole plan. */
export type Applied = { result: ApplyResult } | { why: string };

/**
 * Apply `plan` to the tree at `treeRoot`.
 *
 * `base` and `target` are the two releases' contents; `ours` is what the tree holds
 * at the paths the plan cares about (the same map `planUpdate` read). Writes are
 * whole-file — the release ships files as they are, so an update is byte-for-byte
 * what the release carries, not a patch sequence.
 */
export function applyPlan(
  treeRoot: string,
  plan: UpdatePlan,
  base: ReadonlyMap<string, string>,
  target: ReadonlyMap<string, string>,
  ours: ReadonlyMap<string, string>,
): Applied {
  const root = resolve(treeRoot);
  /** Where `path` lands inside the tree, or null when it would escape it. */
  const inside = (path: string): string | null => {
    const destination = resolve(join(root, path));
    if (destination !== root && !destination.startsWith(root + sep)) return null;
    return destination;
  };

  // Every path the plan names is validated before anything runs: an escaping
  // path is a refusal that costs nothing, and refusing late -- after the merges
  // have run, at the write loop -- would leave a tree holding half a plan. The
  // paths come from the release's own manifest and archive, so this is the
  // boundary a malformed release is caught at.
  for (const path of [...plan.take, ...plan.add, ...plan.delete, ...plan.merge]) {
    if (inside(path) === null) return { why: `\`${path}\` resolves outside the tree` };
  }

  // Decide everything: content per path to write, paths to delete. The tree is
  // untouched until every decision has succeeded.
  const writes = new Map<string, string>();
  const deletes = new Set<string>();
  const taken: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];
  const merged: string[] = [];
  const conflicts: string[] = [];
  const held: HeldCollision[] = [];

  for (const path of plan.take) {
    const content = target.get(path);
    if (content === undefined) {
      return { why: `the target release does not carry \`${path}\`, which the plan says to take` };
    }
    writes.set(path, content);
    taken.push(path);
  }
  for (const path of plan.add) {
    const content = target.get(path);
    if (content === undefined) {
      return { why: `the target release does not carry \`${path}\`, which the plan says to add` };
    }
    // A path upstream adds where the plan says nothing is in the way is a file the
    // tree should not already hold; refuse to clobber one that appeared anyway.
    // Containment was validated up front for every path in the plan, so the null
    // branch is unreachable -- kept for the type, not for the runtime.
    const destination = inside(path);
    if (destination === null) return { why: `\`${path}\` resolves outside the tree` };
    if (existsSync(destination)) {
      return { why: `\`${path}\` exists in the tree but the plan did not expect it` };
    }
    writes.set(path, content);
    added.push(path);
  }
  for (const path of plan.delete) {
    deletes.add(path);
    removed.push(path);
  }

  const scratch = (() => {
    try {
      return mkdtempSync(join(tmpdir(), "atomaton-merge-"));
    } catch (error) {
      return null;
    }
  })();
  if (scratch === null) {
    return { why: `could not make a scratch directory for the merges` };
  }
  try {
    for (const path of plan.merge) {
      const baseContent = base.get(path);
      const oursContent = ours.get(path);
      const targetContent = target.get(path);
      if (baseContent === undefined || oursContent === undefined || targetContent === undefined) {
        return { why: `\`${path}\` is marked for a merge this run cannot read all three sides of` };
      }
      const outcome = mergeFile(scratch, basename(path) || path, baseContent, oursContent, targetContent);
      if ("why" in outcome) return { why: outcome.why };
      if (outcome.conflicts > 0 && NEVER_MARKED.has(path)) {
        // The tree keeps what it had; the merge's output is for the report. Not a
        // `merged` (nothing was resolved on either side) and not a `conflict` (the
        // markers are not in the tree) — `held` is both facts at once.
        writes.set(path, oursContent);
        held.push({ path, text: outcome.content });
        continue;
      }
      writes.set(path, outcome.content);
      (outcome.conflicts > 0 ? conflicts : merged).push(path);
    }
  } finally {
    try {
      rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    } catch {
      // The OS owns a temp directory it will not let go of.
    }
  }

  // Then act. Writes first (parents included), deletions after — order only
  // matters where a release moves a directory's contents around, which no two
  // releases of this tree have done. Containment was validated for every path
  // up front, so this loop has no refusals left to make -- EXCEPT one shape the
  // plan cannot see: a path changing kind between releases. Upstream deleted
  // `x` and added `x/y` classifies as `delete x` + `add x/y`, and the write of
  // `x/y` would hit `mkdirSync` while `x` is still a file. So every parent that
  // a write needs and the tree holds as a FILE is removed first, before any
  // write runs: the loop below still writes everything or nothing, because the
  // type check is a read with no side effects and the deletions it plans are
  // exactly the plan's own delete entries -- paths upstream removed, which this
  // tree still holds as the plan found them.
  for (const path of writes.keys()) {
    let parent = dirname(path);
    while (parent !== "." && parent !== "/") {
      const stats = statSync(resolve(join(root, parent)), { throwIfNoEntry: false });
      if (stats?.isFile()) {
        if (!deletes.has(parent)) {
          return { why: `\`${path}\` needs \`${parent}\` to be a directory, but the tree holds a file there that the plan does not delete` };
        }
      }
      const next = dirname(parent);
      parent = next;
    }
  }

  for (const [path, content] of writes) {
    const destination = inside(path);
    if (destination === null) throw new Error(`\`${path}\` resolves outside the tree`);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, content);
  }
  for (const path of deletes) {
    try {
      rmSync(resolve(join(root, path)), { force: true });
    } catch (error) {
      return { why: `could not remove \`${path}\`: ${(error as Error).message}` };
    }
  }

  return { result: { taken, added, removed, merged, conflicts, held } };
}

/**
 * The three-way merge of one path, as `git merge-file` answers it.
 *
 * The labels name the sides a person sees in the conflict markers, so a marker in a
 * freshly-updated tree reads as two named claims rather than two anonymous ones.
 * The exit code IS the conflict count (255 means the merge could not run); reading
 * it back as the outcome is what makes "merged cleanly" a measured fact.
 */
export function mergeFile(
  scratch: string,
  label: string,
  base: string,
  ours: string,
  theirs: string,
): { content: string; conflicts: number } | { why: string } {
  const oursPath = join(scratch, "ours");
  const basePath = join(scratch, "base");
  const theirsPath = join(scratch, "theirs");
  writeFileSync(oursPath, ours);
  writeFileSync(basePath, base);
  writeFileSync(theirsPath, theirs);
  const run = Bun.spawnSync({
    cmd: [
      "git", "merge-file",
      "-L", `${label} (ours)`,
      "-L", `${label} (base)`,
      "-L", `${label} (theirs)`,
      oursPath, basePath, theirsPath,
    ],
    stdout: "pipe",
    stderr: "pipe",
  });
  // `>0` is the conflict count and the file still carries the markers — the useful
  // case. `255` (and anything else) is a real failure, which must stop the run
  // rather than be read as "conflicted, carry on".
  const code = run.exitCode ?? 1;
  if (code === 255) {
    return { why: `git merge-file could not run: ${run.stderr?.toString("utf8").trim() || "no message"}` };
  }
  if (code < 0) {
    return { why: `the merge of ${label} was interrupted: ${run.stderr?.toString("utf8").trim() || "no message"}` };
  }
  return { content: readFileSync(oursPath, "utf8"), conflicts: code };
}
