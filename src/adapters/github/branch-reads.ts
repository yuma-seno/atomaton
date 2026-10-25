/**
 * branch-reads.ts — the questions everything here asks about branches, each asked
 * in one place.
 *
 *   - does `origin` have branch X, and at which commit;
 *   - which branch is this checkout on;
 *   - what is this project's base branch.
 *
 * They were answered in five, four and three places respectively (#346), and the
 * answers disagreed where it costs most: a failed `git ls-remote` was read as "the
 * branch is not there" in `branch-placement.ts`, which then CREATED the parent
 * branch at whatever commit this run happened to have checked out — so one
 * transient network failure could stack every sibling of an issue on the wrong
 * base. The same failure in `mcp/attachments.ts` was a refusal, and in `create_pr`
 * a tool error. `app/aggregation.ts` already states the rule these lacked — "not
 * finding the marker and not being able to look are different answers, and only one
 * of them means go ahead" — and this module is that rule for refs.
 *
 * ## Why the readers say whether they know
 *
 * `known: false` is a read that did not happen; `known: true, present: false` is
 * `origin` answering "no such branch". Only the second is a fact a creation or a
 * refusal may be based on, so they are separate fields rather than one falsy value.
 * What a caller DOES with the first is its own to decide — cut from the base,
 * refuse a pull request's base, fail the tool, scan nothing — and each says so
 * where it decides, because that is the only place the question can be answered.
 *
 * `gitRun` takes no working directory, so every reader here answers about the
 * checkout the process is in. That is the only tree these callers mean.
 */
import { gitRun } from "./gh.ts";
import { getBaseBranch } from "../runner/config.ts";

function log(message: string): void {
  console.error(`[atomaton-branch-reads] ${message}`);
}

/**
 * Whether `name` is a branch that exists locally — `refs/heads/<name>` — rather
 * than a name git merely printed.
 *
 * Asked rather than assumed, because every route to "the current branch" can hand
 * back a string that looks like a branch and is not one: `git branch --points-at
 * HEAD` prints its own pseudo-entry for a detached HEAD, and `BRANCH` is set by the
 * runner from whatever `git rev-parse --abbrev-ref HEAD` said. `git show-ref
 * --verify` is the check git itself uses for "is this a ref", so a name that is not
 * one — including the pseudo-entry, whose parentheses are not valid in a refname —
 * fails here rather than at the push.
 */
export function isLocalBranch(name: string): boolean {
  if (!name || name === "HEAD" || name.startsWith("(")) return false;
  return gitRun("show-ref", "--verify", "--quiet", `refs/heads/${name}`).code === 0;
}

/**
 * The branch this checkout has, or `undefined` when it has none.
 *
 * The literal question, and the only place it is asked: `resolveBranch` in
 * `branch-placement.ts` builds its fallbacks on this, and the callers that must not
 * fall back (`sync_branch`, which acts on the branch actually checked out; publishing
 * drafts, which refuses to write into the work this run is delivering) use it
 * directly.
 *
 * A detached HEAD answers `HEAD`, which is not a branch — the pseudo-entry a
 * `pr` run has, and the string that once reached `git push` as a refspec.
 */
export function checkedOutBranch(): string | undefined {
  const { code, stdout } = gitRun("rev-parse", "--abbrev-ref", "HEAD");
  const name = code === 0 ? stdout.trim() : "";
  return isLocalBranch(name) ? name : undefined;
}

/**
 * Whether `origin` has this branch, and its tip when it does.
 *
 * One `ls-remote` per call: the sha is what `create_pr` compares against local HEAD,
 * so the read that answers "is it there" answers "where is it" in the same round
 * trip rather than leaving callers to ask twice and get two answers.
 */
export type OriginBranchRead =
  /** `origin` answered: the branch is there, at `sha`. */
  | { readonly known: true; readonly present: true; readonly sha: string }
  /** `origin` answered: it has no such branch. */
  | { readonly known: true; readonly present: false }
  /** `origin` could not be read, so whether it has the branch is unknown. */
  | { readonly known: false; readonly why: string };

/** The tip of branch `branch` on `origin`, or that it is not there, or that this is unknown. */
export function readOriginBranch(branch: string): OriginBranchRead {
  const { code, stdout, stderr } = gitRun("ls-remote", "--heads", "origin", `refs/heads/${branch}`);
  if (code !== 0) {
    const why = `could not read '${branch}' from origin: ${stderr || stdout || `git ls-remote exited ${code}`}`;
    log(`WARN ${why}`);
    return { known: false, why };
  }
  // Matched on the full ref rather than taken from the first line: `ls-remote` takes
  // a pattern, and a name that matched something else would otherwise answer with
  // that ref's sha as though it were this branch's.
  const wanted = `refs/heads/${branch}`;
  for (const line of stdout.split("\n")) {
    const [sha, ref] = line.trim().split(/\s+/);
    if (ref === wanted && sha) return { known: true, present: true, sha };
  }
  return { known: true, present: false };
}

/**
 * The branch `HEAD` points at on `origin`, out of `git ls-remote --symref origin HEAD`.
 *
 * `origin/HEAD` is not set in a run's checkout — measured, it is not a symbolic ref
 * there — so the name has to be asked of the remote. Split from the call so the
 * parsing can be tested against output measured from a real remote.
 */
export function defaultBranchFrom(lsRemoteSymref: string): string | undefined {
  return /^ref:\s+refs\/heads\/([^\s]+)\s+HEAD$/m.exec(lsRemoteSymref)?.[1];
}

/** `origin`'s default branch, or the reason it could not be read. */
export type DefaultBranchRead =
  | { readonly known: true; readonly branch: string }
  | { readonly known: false; readonly why: string };

/**
 * The default branch of `origin`.
 *
 * Asked of git and the remote rather than of GitHub's API: it is the branch a push
 * to `origin` lands on by default, which is the fact both callers act on — publishing
 * refuses to write there because it would bypass review, and a merge has to fetch
 * from a concrete name. It also needs no repository argument and no `gh`
 * credential, so a caller that already holds a checkout can ask.
 */
export function readRemoteDefaultBranch(): DefaultBranchRead {
  const symref = gitRun("ls-remote", "--symref", "origin", "HEAD");
  if (symref.code !== 0) {
    const why = `could not read origin, so its default branch is unknown: ${symref.stderr || symref.stdout}`;
    log(`WARN ${why}`);
    return { known: false, why };
  }
  const branch = defaultBranchFrom(symref.stdout);
  if (!branch) {
    const why = "origin named no default branch (its HEAD is not a symbolic ref)";
    log(`WARN ${why}`);
    return { known: false, why };
  }
  return { known: true, branch };
}

/**
 * The branch this project calls its base: `base_branch` from `config.yaml` when it
 * is set, otherwise the remote's default branch.
 *
 * The relationship between the two, written once. `getBaseBranch()` answers `""`
 * for "nobody configured one", deliberately — `gh pr create` reads that as "the
 * default branch, whatever it is" and resolves it on its own. A caller that needs a
 * NAME (to fetch from, to compare against) cannot pass `""` on, so this is where
 * the empty answer is turned into the remote's default.
 *
 * Not every caller of the base wants the configuration: publishing drafts guards
 * against the remote's default branch specifically, because that is the branch
 * review protects, so it asks `readRemoteDefaultBranch` instead. A `base_branch` of
 * `develop` does not make `main` safe to publish onto.
 */
export function baseBranch(): DefaultBranchRead {
  const configured = getBaseBranch().trim();
  if (configured) return { known: true, branch: configured };
  return readRemoteDefaultBranch();
}
