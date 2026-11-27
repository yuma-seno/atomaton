/**
 * update-branch.ts — the branch an update for a tag lives on.
 *
 * One fact read by both halves of the update lane: the run creates and pushes it,
 * and the notice looks for a pull request standing on it so a release still waiting
 * is not dispatched again every day. A branch name written twice is a name that
 * drifts once, and the drift is silent -- the notice would find no pull request and
 * start a run that then found one.
 */
export function updateBranchFor(tag: string): string {
  return `atomaton/update-${tag}`;
}
