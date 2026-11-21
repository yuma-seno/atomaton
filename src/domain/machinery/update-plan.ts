/**
 * update-plan.ts — what taking a newer release onto this tree means, path by path.
 *
 * # The idea, and why nothing else had to be invented
 *
 * `.github/atomaton-release.json` records the release this tree came from. That
 * fact is all a mechanical update needs, because it makes the ordinary git
 * three-way merge available:
 *
 *     base    = the release the tree came from (its asset's files)
 *     ours    = the adopter's tree, as it stands
 *     theirs  = the release being taken (its asset's files)
 *
 * Everything an upgrade policy would otherwise hand-write falls out of the
 * comparison. A file the adopter never touched takes the new version silently. A
 * file the adopter changed and upstream did not keeps the adopter's words. A file
 * both sides changed needs a look — and that is the whole, exact definition of
 * "this update needs a person": not an upstream declaration about some average
 * adopter, but the collision this particular tree actually has. Upstream cannot
 * know whether an adopter customised `config.yaml`; only the tree can answer, and
 * only at update time.
 *
 * # What this module decides, and what it refuses to decide
 *
 * This is the classification layer: which paths changed upstream, which the
 * adopter touched, and which strategy each one takes. It does not perform merges
 * — "merge" entries are paths where the outcome is only knowable by running the
 * merge (`git merge-file`, in the machinery that applies this plan). It also never
 * proposes touching a path that is in neither release: the adopter's own files are
 * outside this computation entirely, which is why the plan needs no ownership
 * table and no namespace rules. A layout change upstream needs no change here.
 *
 * Pure: three content maps in, one plan out.
 */
import { noLongerShipped, type ReleaseManifest } from "./release-manifest.ts";

/** What upstream did to a path, read from the two releases' contents. */
export type UpstreamChange = "added" | "deleted" | "modified" | "unchanged";

/** What the plan proposes for a path. */
export type UpdateOutcome =
  /** Upstream changed it, the adopter did not: the new content goes in. */
  | "take"
  /** Upstream added it, nothing of the adopter's is in the way. */
  | "add"
  /** Upstream removed it, the adopter's copy still matches: removed here too. */
  | "delete"
  /** Both sides changed it: the merge run decides merged or conflicted. */
  | "merge"
  /** The adopter's words win, and a person should see why. */
  | "keep"
  /** Nothing to do. */
  | "skip";

export interface PlanEntry {
  readonly path: string;
  readonly upstream: UpstreamChange;
  /** Whether the adopter's copy differs from the base release's. */
  readonly oursModified: boolean;
  readonly outcome: UpdateOutcome;
}

export interface UpdatePlan {
  /** The release the tree came from, as the tag names it. */
  readonly base: string;
  /** The release being taken, as the tag names it. */
  readonly target: string;
  /** Every path in either release's file list, sorted. */
  readonly entries: readonly PlanEntry[];
  readonly take: readonly string[];
  readonly add: readonly string[];
  readonly delete: readonly string[];
  /** Paths where both sides changed: the merge run answers merged or conflicted. */
  readonly merge: readonly string[];
  /**
   * The `keep` entries, in the order a person meets them: an upstream addition
   * landing where the adopter's own file already stands, an upstream deletion the
   * adopter had edited, an upstream modification of a file the adopter deleted.
   */
  readonly kept: readonly PlanEntry[];
}

/**
 * The plan for moving a tree from its release to another one.
 *
 * `ours` answers "what does the adopter's tree hold at this path" for the paths
 * in either release — `undefined` is a path the tree does not have. Paths in
 * neither release are invisible here by construction; they are the adopter's.
 */
export function planUpdate(
  base: string,
  target: string,
  baseFiles: ReadonlyMap<string, string>,
  targetFiles: ReadonlyMap<string, string>,
  ours: ReadonlyMap<string, string>,
): UpdatePlan {
  const paths = new Set([...baseFiles.keys(), ...targetFiles.keys()]);
  const entries: PlanEntry[] = [];

  for (const path of [...paths].sort()) {
    const baseContent = baseFiles.get(path);
    const targetContent = targetFiles.get(path);
    const oursContent = ours.get(path);

    let upstream: UpstreamChange;
    if (baseContent === undefined && targetContent !== undefined) upstream = "added";
    else if (baseContent !== undefined && targetContent === undefined) upstream = "deleted";
    else if (baseContent === targetContent) upstream = "unchanged";
    else upstream = "modified";

    // Whether something of the adopter's sits on this path that the base release
    // did not put there: an edit they made, or (for a path upstream adds) a file
    // of their own that was never part of any release.
    const inTheWay = oursContent !== undefined && oursContent !== baseContent;

    let outcome: UpdateOutcome;
    if (upstream === "added") {
      outcome = inTheWay ? "keep" : "add";
    } else if (upstream === "deleted") {
      outcome = oursContent === undefined ? "skip" : inTheWay ? "keep" : "delete";
    } else if (upstream === "unchanged") {
      outcome = "skip";
    } else {
      // modified. An adopter who deleted the path keeps it deleted -- upstream's
      // fix is not forced back onto a tree that chose to live without it.
      if (oursContent === undefined) outcome = "keep";
      else if (!inTheWay) outcome = "take";
      else if (oursContent === targetContent) outcome = "skip";
      else outcome = "merge";
    }

    entries.push({ path, upstream, oursModified: inTheWay, outcome });
  }

  const by = (outcome: UpdateOutcome) => entries.filter((e) => e.outcome === outcome).map((e) => e.path);
  return {
    base,
    target,
    entries,
    take: by("take"),
    add: by("add"),
    delete: by("delete"),
    merge: by("merge"),
    kept: entries.filter((e) => e.outcome === "keep"),
  };
}

/**
 * Paths present in the tree, under the paths the release owns, that the target
 * release does not ship.
 *
 * Broader than the plan's deletions: these include files inherited from releases
 * older than the base one, which no comparison of two releases can see. They are
 * reported, never acted on — the manifest cannot tell the adopter's own files
 * from abandoned template ones, so deleting on this list is how a person's
 * workflow vanishes. The notice names them; the update names them; a person
 * decides.
 */
export function leftoversOf(targetManifest: ReleaseManifest, treePaths: Iterable<string>): string[] {
  return noLongerShipped(targetManifest, treePaths);
}

/**
 * The one sentence a report leads with, before any list.
 *
 * `mergeCount` is the plan's merge paths; the execution may resolve some cleanly,
 * so a report written after merging counts its own conflicts instead and passes
 * that number. Zero means nothing in this tree can collide with the release --
 * which is exactly the condition under which the update may merge itself.
 */
export function verdictSentence(base: string, target: string, mergeCount: number, keptCount: number): string {
  if (mergeCount === 0 && keptCount === 0) {
    return `Nothing in this tree collides with ${target}: the update applies itself, and no decision is needed on the way from ${base}.`;
  }
  return `Taking ${target} onto ${base} needs a decision here: ${mergeCount} file(s) changed on both sides, ${keptCount} more the plan will not touch without a person.`;
}
