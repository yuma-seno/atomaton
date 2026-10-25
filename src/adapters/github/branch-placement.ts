/**
 * branch-placement.ts — which branch a run's work goes on, and what its pull
 * request aims at.
 *
 * The naming rule itself is pure and lives in `domain/work/issue-branch.ts`. What is
 * here is everything that has to ask git or GitHub to apply it: whether a branch
 * already exists, whether this issue has a parent, where a new branch should be
 * cut from, and whether a parent's branch is there to stack on.
 *
 * `repo` is passed rather than read from the environment, so the decision is
 * never quietly about a different repository than the caller meant.
 */
import { gh, gitRun } from "./gh.ts";
import { parentIssueOf, type ParentIssue } from "./parent-issue.ts";
import { isIssueRun, nodeNumber } from "../runner/run-node.ts";
import { nextOrdinal } from "../../domain/work/issue-branch.ts";
import { collectIssueBranches } from "./issue-branches.ts";
import { checkedOutBranch, isLocalBranch, readOriginBranch } from "./branch-reads.ts";

// Re-exported because this module's own callers ask for it by this name. The
// definition is `parent-issue.ts`'s: it used to live here, and the same
// question was being answered in two other places by two other rules.
export { parentIssueOf, type ParentIssue };

function log(message: string): void {
  console.error(`[atomaton-github] ${message}`);
}

// The naming convention itself is `branch-names.ts`. Re-exported because these two
// are what the rest of the repository reaches for, and moving the definition should
// not move every import with it.
export { branchOfIssue, isIssueBranch } from "./branch-names.ts";
import { branchNameFor, branchOfIssue, isIssueBranch } from "./branch-names.ts";

/**
 * What to say when this run has no branch at all.
 *
 * The state, not the symptom. This used to be "Cannot determine branch name; set
 * BRANCH env", and before that the third route below handed git's own description
 * of a detached HEAD -- `(HEAD detached at pull/802/head)` -- to `git push -u
 * origin <that>`, which answered `fatal: invalid refspec`. An agent reading a raw
 * git failure concludes the tool is broken; what it needs to know is that this
 * checkout has no branch to push, so there is nothing for these tools to publish.
 */
const NO_BRANCH_MESSAGE =
  "This run is on a detached checkout with no local branch, so there is no branch to push: " +
  "commit_and_push and create_pr cannot publish this run's work. Report the work on the issue instead.";

/**
 * The branch this run is checked out on, however it can be determined.
 *
 * Every route answers only with a name that resolves as `refs/heads/<name>`, and
 * nothing resolves to the literal `HEAD`, an empty string, or git's description of
 * a detached HEAD. A route that cannot answer falls through to the next; when none
 * can, the run has no branch and says so (see `NO_BRANCH_MESSAGE`).
 */
export function resolveBranch(): string {
  const fromEnv = (process.env.BRANCH ?? "").trim();
  if (isLocalBranch(fromEnv)) return fromEnv;

  // What git says is checked out, read in `branch-reads.ts` because two other
  // callers ask the same literal question.
  const checkedOut = checkedOutBranch();
  if (checkedOut) return checkedOut;

  {
    // The case this route allows: a detached HEAD at a commit that a LOCAL branch
    // points at, so there is a name the work belongs on and a branch to push.
    //
    // The case it rejects, and the one a `pr` run is in: a detached HEAD at a commit
    // that only a remote-tracking or `refs/pull/<n>/head` ref points at. That commit
    // is a tip of something, but nothing local names it, so there is no branch to
    // push and the honest answer is the refusal below rather than a string git will
    // reject as a refspec.
    //
    // `git branch --points-at HEAD` lists the allowed branch -- but its first line is
    // git's own pseudo-entry for the detached HEAD, `(HEAD detached at
    // pull/802/head)`, which `--format` does not suppress and which is a description
    // rather than a ref. Every line is therefore checked, not just the first: a name
    // beginning with `(` and a name that does not resolve as `refs/heads/<name>` are
    // both rejected.
    const { code, stdout } = gitRun("branch", "--format=%(refname:short)", "--points-at=HEAD");
    if (code === 0) {
      for (const line of stdout.split("\n")) {
        const name = line.trim();
        if (isLocalBranch(name)) return name;
      }
    }
  }
  throw new Error(NO_BRANCH_MESSAGE);
}


/**
 * The branch a sub-issue's work should be cut from, or "" for the base branch.
 *
 * Sub-issues of one parent are split from a single piece of work and usually
 * depend on each other — an interface one defines is what the next one consumes.
 * Cutting each from the base hides those from one another until every part has
 * landed separately, which is where integration surprises come from.
 *
 * So they stack: each is cut from the parent's branch and merges back into it,
 * and the parent's branch reaches the base as one reviewed change. The parent's
 * branch is created here, empty, if the first child gets there first — an
 * atomaton plans and dispatches without committing, so its branch would
 * otherwise not exist yet.
 *
 * Best-effort throughout. Every failure returns "" and the work is cut from the
 * base, which is the behaviour before stacking existed: a slower integration is
 * not worth failing a commit over.
 */
export function stackedBaseFor(repo: string, issue: number): string {
  // An unreadable parent falls in with every other failure here: cut from the
  // base. `parentIssueOf` has already logged why.
  const found = parentIssueOf(repo, issue);
  if (!found.known || !found.parent) return "";

  const parentBranch = branchOfIssue(found.parent);
  const existing = readOriginBranch(parentBranch);
  if (!existing.known) {
    // NOT "the parent has no branch yet". The creation below cuts the parent's
    // branch at whatever this run has checked out; doing that on a failed read
    // stacks every sibling on a base nobody chose, and the parent's own pull
    // request then carries work it was never cut from. Cutting from the base is
    // the pre-stacking behaviour and the cheaper wrong answer.
    log(`WARN ${existing.why}; cutting from the base branch instead`);
    return "";
  }
  if (existing.present) {
    const fetched = gitRun("fetch", "origin", `refs/heads/${parentBranch}:refs/remotes/origin/${parentBranch}`);
    if (fetched.code) {
      log(`WARN could not fetch ${parentBranch}; cutting from the base branch instead`);
      return "";
    }
    return parentBranch;
  }

  // The parent has no branch yet. Create it where this run started, which is the
  // base branch — the run resumed nothing, or `branchForCommit` would not be
  // naming a branch at all.
  const head = gitRun("rev-parse", "HEAD");
  if (head.code) return "";
  const { code, stderr, stdout } = gh(
    "api", `repos/${repo}/git/refs`, "-X", "POST",
    "-f", `ref=refs/heads/${parentBranch}`, "-f", `sha=${head.stdout.trim()}`,
  );
  if (code) {
    log(`WARN could not create ${parentBranch}: ${stderr || stdout}; cutting from the base branch instead`);
    return "";
  }
  const fetched = gitRun("fetch", "origin", `refs/heads/${parentBranch}:refs/remotes/origin/${parentBranch}`);
  if (fetched.code) return "";
  log(`commitAndPush: created parent branch ${parentBranch} for #${found.parent}`);
  return parentBranch;
}

/**
 * Cut `name` from the parent's branch `from`, carrying this run's uncommitted work
 * onto it.
 *
 * A sub-issue's run is checked out on the base branch, so by the time this runs the
 * worktree holds edits written against the base — and the parent's branch may have
 * moved in the same files. `git checkout -b` cannot answer that: it refuses with
 * "Your local changes to the following files would be overwritten by checkout" when a
 * file it would switch is one the run edited, and there is nothing else to ask, so a
 * stacked run whose parent had touched any of its files simply could not commit.
 *
 * So the work is staged, stashed, and re-applied after the switch. `git stash pop` is
 * a three-way merge between the base the work was written against, the parent's tip,
 * and the work itself: what comes out is the parent's branch with this run's change on
 * top of it. A file both sides changed is a conflict in the worktree — named, with the
 * markers in it — rather than a refusal, and no file the run did not touch keeps a
 * base-branch version over the parent's.
 *
 * Staging first is what makes a file the run CREATED merge three ways. An untracked
 * file is not part of a stash's tracked diff: `stash pop` refuses to restore it over
 * the parent's copy of the same path and leaves the run's version in the stash entry
 * — work that has silently vanished from the worktree. Staged, it is an add/add
 * conflict, which the agent decides.
 */
function createStackedBranch(name: string, from: string): void {
  const worktree = gitRun("status", "--porcelain");
  if (worktree.code) {
    throw new Error(
      `Could not read the worktree before creating branch '${name}': ${worktree.stderr || worktree.stdout}`,
    );
  }

  if (!worktree.stdout.trim()) {
    // Nothing of this run's to carry: the switch is the whole job.
    const created = gitRun("checkout", "-b", name, `origin/${from}`);
    if (created.code) throw new Error(`Could not create branch '${name}': ${created.stderr || created.stdout}`);
    return;
  }

  const staged = gitRun("add", "-A");
  if (staged.code) {
    throw new Error(
      `Could not stage this run's work before creating branch '${name}': ${staged.stderr || staged.stdout}`,
    );
  }
  const stashed = gitRun("stash", "push", "--message", `atomaton: this run's work, carried onto ${from}`);
  if (stashed.code) {
    throw new Error(
      `Could not set this run's work aside to create branch '${name}' from '${from}': ${stashed.stderr || stashed.stdout}`,
    );
  }

  const created = gitRun("checkout", "-b", name, `origin/${from}`);
  if (created.code) {
    // The work goes back where it was before the failure is reported: a branch that
    // was not created must not also cost the run its worktree.
    gitRun("stash", "pop");
    throw new Error(`Could not create branch '${name}': ${created.stderr || created.stdout}`);
  }

  const applied = gitRun("stash", "pop");
  if (!applied.code) {
    log(`commitAndPush: carried this run's work from the base branch onto ${from}`);
    return;
  }

  const conflicts = unmergedPaths();
  if (conflicts.length > 0) {
    throw new Error(
      `Branch '${name}' was created from '${from}', but ${conflicts.length} file(s) this run changed also ` +
        `changed on that branch: ${conflicts.join(", ")}. Both sides are in those files with git's conflict markers. ` +
        "Resolve them, then call commit_and_push again to commit the result.",
    );
  }
  throw new Error(
    `Branch '${name}' was created from '${from}', but this run's work could not be re-applied to it: ` +
      `${applied.stderr || applied.stdout}. The work is in 'git stash list', not in the worktree.`,
  );
}

/**
 * The paths git holds as unmerged in the index, which is what a merge, a stash
 * application or a rebase leaves behind when it could not decide a file.
 */
function unmergedPaths(): string[] {
  const unmerged = gitRun("diff", "--name-only", "--diff-filter=U");
  if (unmerged.code) return [];
  return unmerged.stdout.split("\n").map((line) => line.trim()).filter(Boolean);
}

/**
 * The branch this commit belongs on, creating one if the run has none yet.
 *
 * A run starts on the base branch unless it had work to resume, because most
 * runs never commit and creating a branch for those left one behind every time.
 * The first commit is what turns a run into work, so that is where the branch
 * appears.
 *
 * When every earlier branch for this issue has merged, the name counts up:
 * reusing a merged branch would build on history the base already contains.
 */
export function branchForCommit(repo: string): string {
  const onBranch = checkedOutBranch();
  if (onBranch && isIssueBranch(onBranch)) return onBranch;

  // Only an issue run may name a branch. On a pull request run `NUMBER` holds the
  // PR's number and the checkout is already the branch under review, so naming one
  // from it would move the work off the pull request.
  const issue = runIssueNumber();
  if (issue === undefined) return resolveBranch();

  const from = stackedBaseFor(repo, issue);
  // Refused rather than guessed. An unread list makes `nextOrdinal` answer with the
  // FIRST name, which is the one most likely to exist already -- and the run then fails
  // at the push, reporting a non-fast-forward instead of the read that caused it.
  const listed = collectIssueBranches(repo, issue);
  if (!listed.known) {
    throw new Error(
      `${listed.why}, so a new branch for #${issue} cannot be named without risking one that already exists.`,
    );
  }
  const name = branchNameFor(issue, nextOrdinal(listed.branches));
  if (from) {
    createStackedBranch(name, from);
  } else {
    const created = gitRun("checkout", "-b", name);
    if (created.code) throw new Error(`Could not create branch '${name}': ${created.stderr || created.stdout}`);
  }
  log(`commitAndPush: created branch ${name}${from ? ` from ${from}` : ""}`);
  return name;
}

/**
 * The parent's branch, when this run is a sub-issue's and that branch exists.
 *
 * Returns undefined for a root issue, and for a sub-issue whose parent branch
 * was never created — a run that reports rather than commits reaches no
 * `commit_and_push`, so nothing made one, and there is nothing to stack on.
 *
 * The parent's own run is a root run by this test: its issue carries no parent
 * tag, so its pull request — the integration one, carrying every child's work —
 * targets the base branch like any other.
 *
 * Throws when the issue could not be read, rather than answering undefined.
 * Unlike `stackedBaseFor`, this caller cannot absorb the uncertainty: its answer
 * decides where a pull request merges to, and guessing the base branch for a
 * sub-issue lands one child's half of a feature on the release branch and
 * deploys it. A tool error the agent can retry is the cheaper wrong answer.
 */
export function stackedPrBase(repo: string): string | undefined {
  const issue = runIssueNumber();
  if (issue === undefined) return undefined;

  const found = parentIssueOf(repo, issue);
  if (!found.known) {
    throw new Error(
      `Cannot tell whether issue #${issue} is a sub-issue, so the base branch for its pull request is unknown: ` +
        `${found.why}. Retry the call.`,
    );
  }
  if (!found.parent) return undefined;

  const parentBranch = branchOfIssue(found.parent);
  const read = readOriginBranch(parentBranch);
  if (!read.known) {
    // The same refusal as the unreadable parent above, for the same reason: this
    // answer decides where the pull request merges to, and "cut from the base
    // instead" would land one child's half of a feature on the release branch.
    throw new Error(
      `Cannot tell whether ${parentBranch} exists on origin, so the base branch for this pull request is unknown: ` +
        `${read.why}. Retry the call.`,
    );
  }
  return read.present ? parentBranch : undefined;
}

/**
 * The issue this run is working on, or undefined when it is not an issue run.
 *
 * Both callers above need the same two conditions — the run is an issue run,
 * and the number is a real one — and both are wrong in the same way if either
 * is dropped: a pull request run's `NUMBER` is the pull request's number,
 * and treating it as an issue moves work off the branch under review.
 */
function runIssueNumber(): number | undefined {
  if (!isIssueRun()) return undefined;
  return nodeNumber();
}
