/**
 * pr-head-branch.ts — whether a pull request's head branch is one this repository can
 * validate, and what to tell a person when it is not.
 *
 * A pull request's `headRefName` names a branch in the pull request's HEAD repository.
 * For a pull request opened from a fork that is not this repository, so the name is
 * either a branch that does not exist here or — worse — one that does, with different
 * content. Validation runs this repository's workflows with `--ref <name>`, so a fork's
 * name is not something it can be handed.
 *
 * `resolve_pr_branch.ts` has decided this for a `pr` run's own checkout since #803. The
 * other entrance — a person commenting `/<agent>` on a pull request — read the name
 * inline and passed it straight on, so a member's comment on a fork's pull request
 * dispatched validation onto a branch this repository does not have (#344). The three
 * guards are shared now (`entrypoints/machinery/lib/pr-head-branch.ts`); this module is
 * the pure half: what can stop the resolution, and the words each audience needs for it.
 *
 * Two audiences, deliberately rendered apart. A log line is read by whoever is
 * debugging the run and wants the fact; a comment is read by the person whose command
 * did not start a run, and they need to know nothing is coming and what would change
 * that.
 */
import { mentionPrefix } from "./mention.ts";

/**
 * Every way resolving a pull request's head branch can end without one.
 *
 * A union rather than a string, because the notice a person reads differs by kind: a
 * fork is something they can act on by pushing the branch here, and a pull request that
 * could not be read is something to retry. Folding them into one message would either
 * give the fork advice to somebody whose request merely failed, or give retry advice to
 * somebody whose branch will never be valid here.
 */
export type PrHeadRefusal =
  /** `gh pr view` did not answer, so nothing is known about the pull request. */
  | { kind: "unreadable"; detail: string }
  /** The head branch belongs to another repository. */
  | { kind: "fork" }
  /** The answer named no branch at all. */
  | { kind: "no-branch" }
  /** A name git itself would not accept as a branch (`HEAD`, whitespace, `..`, ...). */
  | { kind: "not-a-branch-name"; branch: string }
  /** A branch name this repository does not have. */
  | { kind: "not-on-origin"; branch: string };

/**
 * One sentence saying what is wrong with the pull request's head, for a log.
 *
 * Written to be true read on its own, in either place it lands: the `pr` run that stays
 * on its detached checkout, and the dispatch that starts nothing. It does not say what
 * the caller does about it — that is the caller's, and the two callers differ.
 */
export function describePrHeadRefusal(number: number, refusal: PrHeadRefusal): string {
  switch (refusal.kind) {
    case "unreadable":
      return `pull request #${number} could not be read: ${refusal.detail}`;
    case "fork":
      return (
        `pull request #${number} comes from a fork, so its head branch is a branch of ` +
        "the fork rather than of this repository"
      );
    case "no-branch":
      return `pull request #${number} names no head branch`;
    case "not-a-branch-name":
      return `pull request #${number} names '${refusal.branch}', which is not a branch name`;
    case "not-on-origin":
      return `pull request #${number}'s head branch '${refusal.branch}' is not a branch of this repository`;
  }
}

/**
 * What a person is told when the run they asked for was not started.
 *
 * Posted on the pull request, because that is where they asked and the only place they
 * will look. It says three things and no more: the run is not happening, why, and what
 * would make it happen — a refusal that leaves somebody waiting for a run that never
 * starts is the silent failure this is here to remove.
 *
 * The `commenter` is mentioned rather than named, because a person who comments and
 * hears nothing back has been ignored, and this is the one chance to speak.
 */
export function validationNotDispatchedNotice(
  commenter: string,
  number: number,
  refusal: PrHeadRefusal,
): string {
  return [
    `${mentionPrefix(commenter)}Atomaton: the run you asked for on #${number} was not started — ${describePrHeadRefusal(number, refusal)}.`,
    "",
    advice(number, refusal),
  ].join("\n");
}

/** What the person can do about it, which is the part the refusal's kind decides. */
function advice(number: number, refusal: PrHeadRefusal): string {
  switch (refusal.kind) {
    case "fork":
      return "Validation runs CI against a branch of this repository, which a fork's branch is not. Push the branch into this repository and comment again. Nothing was dispatched.";
    case "unreadable":
      return `Comment again once #${number} can be read. Nothing was dispatched.`;
    case "no-branch":
    case "not-a-branch-name":
    case "not-on-origin":
      return "Comment again once the pull request has a head branch in this repository. Nothing was dispatched.";
  }
}
