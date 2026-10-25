/**
 * pr-head-branch.ts — the one place a pull request's head branch is resolved from
 * GitHub, and the three gates a name has to pass before this repository can use it.
 *
 * A pull request's `headRefName` names a branch in the pull request's HEAD repository,
 * which for a fork is not `origin`. Since #803 a `pr` run has resolved its own head
 * branch through these gates before checking it out, so that a run whose push would land
 * on a same-named branch of this repository stays detached instead.
 *
 * The other entrance is a person's `/<agent>` comment on a pull request, and it read the
 * name inline and dispatched validation with whatever came back (#344). A member's
 * comment on a fork's pull request therefore handed a branch of the fork — or a
 * same-named branch of this repository — to a workflow that runs `--ref` against this
 * repository. The gates live here so that both entrances ask the same question of the
 * same code; `domain/work/pr-head-branch.ts` holds the pure half, what each refusal is
 * and what it says.
 *
 * `resolve_pr_branch.ts` and `dispatch_pr_validation.ts` are the two callers, and
 * neither is a `ref` this module may import: a bundled script gets its own
 * `import.meta.url`, so a sibling's `ref` would name the importer. See `script-ref.ts`.
 */
import { gh, gitRun } from "../../../adapters/github/gh.ts";
import type { PrHeadRefusal } from "../../../domain/work/pr-head-branch.ts";

/** What `gh pr view` was asked for, and what an unreadable answer means. */
export interface PrHead {
  branch: string;
  /** True when the head branch lives in a fork rather than in this repository. */
  crossRepository: boolean;
}

/**
 * Read the head branch out of `gh pr view --json headRefName,isCrossRepository`.
 *
 * Pure, and forgiving on purpose: an answer that cannot be parsed is one of the ways a
 * caller ends up with no branch, not an exception. The fork flag is carried separately
 * from the name because the two refusals are different facts about the pull request, and
 * whoever reads the log needs to tell them apart.
 */
export function prHead(prJson: string): PrHead {
  try {
    const pr = JSON.parse(prJson) as { headRefName?: unknown; isCrossRepository?: unknown };
    return {
      branch: typeof pr.headRefName === "string" ? pr.headRefName.trim() : "",
      crossRepository: pr.isCrossRepository === true,
    };
  } catch {
    return { branch: "", crossRepository: false };
  }
}

/**
 * Whether a name may be checked out as a branch, asked of git rather than
 * pattern-matched.
 *
 * `check-ref-format --branch` is the same rule `git checkout` and `git push` apply, so a
 * name it accepts cannot be one they refuse, and one it rejects never reaches the
 * `git checkout` a caller runs. That covers the empty name; `HEAD` — not a branch, and
 * exactly what the step `resolve_pr_branch.ts` replaces used to write; names carrying
 * whitespace or a control character, which would otherwise split into extra refspecs or
 * extra `$GITHUB_ENV` lines; and `..`, `~`, `^`, `:`, `\`, `@{`, `.lock` or a leading
 * `-`.
 */
export function isBranchName(name: string): boolean {
  if (!name) return false;
  return gitRun("check-ref-format", "--branch", name).code === 0;
}

/**
 * Whether the branch is one `origin` has.
 *
 * Asking first is what turns "the checkout fails" into "the caller has no branch", and
 * it is what stops a fork's branch from being taken for a branch of the same name in
 * this repository — which is the branch a push would then land on, and the branch a
 * `--ref` would then validate.
 */
export function existsOnOrigin(name: string): boolean {
  const { code, stdout } = gitRun("ls-remote", "--heads", "origin", `refs/heads/${name}`);
  return code === 0 && stdout.trim() !== "";
}

/**
 * Either a branch this repository can use, or the refusal that stopped it.
 *
 * `branch` is `""` exactly when `refusal` is set, so a caller cannot read a branch out
 * of a refusal by accident, and cannot ignore a refusal and carry on with nothing.
 */
export interface PrHeadResolution {
  branch: string;
  refusal: PrHeadRefusal | null;
}

/**
 * Resolve a pull request's head branch through all three gates.
 *
 * The order is the point. The fork test comes first because it is about WHICH repository
 * the name belongs to, and every later gate asks about this one: a fork whose branch is
 * called `main` passes `isBranchName` and `existsOnOrigin` and means something else
 * entirely. The name test comes next, before anything is asked of the network, and the
 * existence test last because it is the only one that needs the remote.
 */
export function resolvePrHeadBranch(repo: string, number: number): PrHeadResolution {
  const { code, stdout, stderr } = gh(
    "pr", "view", String(number), "--repo", repo,
    "--json", "headRefName,isCrossRepository",
  );
  if (code !== 0) {
    return { branch: "", refusal: { kind: "unreadable", detail: stderr || stdout } };
  }

  const head = prHead(stdout);
  if (head.crossRepository) return { branch: "", refusal: { kind: "fork" } };
  if (!head.branch) return { branch: "", refusal: { kind: "no-branch" } };
  if (!isBranchName(head.branch)) {
    return { branch: "", refusal: { kind: "not-a-branch-name", branch: head.branch } };
  }
  if (!existsOnOrigin(head.branch)) {
    return { branch: "", refusal: { kind: "not-on-origin", branch: head.branch } };
  }
  return { branch: head.branch, refusal: null };
}
