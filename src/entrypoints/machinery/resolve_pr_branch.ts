#!/usr/bin/env bun
/**
 * resolve_pr_branch.ts — the head branch of the pull request a `pr` run is on.
 *
 * A `pr` run checks the pull request out through `refs/pull/N/head`, and that is
 * not a branch: `actions/checkout` fetches it to `refs/remotes/pull/N/head` and
 * checks *that* out, so git leaves the run detached and
 * `git rev-parse --abbrev-ref HEAD` answers `HEAD`. There was therefore nothing
 * for `commit_and_push` to push to, and it built a refspec out of git's own
 * description of the state --
 *
 *     fatal: invalid refspec '(HEAD detached at pull/802/head)'
 *
 * -- so the one agent whose job is to push a fix onto a red pull request was the
 * one that could not. Observed twice: #247, and the run that filed #803.
 *
 * This is the counterpart of `resolve_issue_branch.ts`. It answers *which* branch
 * the pull request is already from; the workflow step beside it materialises that
 * branch at the commit the run already has. A script rather than inline bash
 * because the decision is the part that can be wrong, and this way it is decided
 * where it can be tested without a runner.
 *
 * It no longer holds the decision itself. The three gates a head branch has to pass
 * -- not a fork's, a name git accepts, a branch `origin` has -- are in
 * `lib/pr-head-branch.ts`, because a `pr` run is no longer the only entrance that
 * resolves a head branch: `dispatch_pr_validation.ts` resolves one for a person's
 * comment on a pull request, which used to read the name inline and pass it on
 * unchecked (#344).
 *
 * Best-effort, in the same way and for the same reason: nothing here fails the
 * run. An empty `branch` output means this run has no branch it may push to, it
 * stays on the detached checkout, and the tool that needs a branch refuses with a
 * message saying what the run cannot do. Stopping before the agent has said
 * anything would be worse than that.
 *
 * Usage:
 *   resolve_pr_branch.ts --repo owner/name --number 12
 *
 * Writes `branch=<name-or-empty>` to $GITHUB_OUTPUT.
 */
import { appendFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { describePrHeadRefusal } from "../../domain/work/pr-head-branch.ts";
import { resolvePrHeadBranch } from "./lib/pr-head-branch.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface ResolvePrBranchArgs {
  repo: string;
  number: string;
}

export const ref = defineScript<ResolvePrBranchArgs>(import.meta.url);

function log(message: string): void {
  console.error(`[atomaton-pr-branch] ${message}`);
}

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: { repo: { type: "string" }, number: { type: "string" } },
  });

  const repo = (values.repo ?? "").trim();
  const number = Number((values.number ?? "").trim());
  const githubOutput = process.env.GITHUB_OUTPUT;

  // Never exits non-zero. Every path below either resolves a name or resolves
  // nothing, and says on stderr which of the two happened and why.
  let branch = "";
  if (!repo || !Number.isInteger(number) || number <= 0) {
    log("missing --repo or --number; this run has no branch to check out");
  } else {
    const resolved = resolvePrHeadBranch(repo, number);
    if (resolved.refusal) log(describePrHeadRefusal(number, resolved.refusal));
    branch = resolved.branch;
  }

  log(
    branch
      ? `the pull request's head branch is ${branch}`
      : "no head branch to check out; staying on the detached checkout",
  );
  if (githubOutput) appendFileSync(githubOutput, `branch=${branch}\n`);
}

if (import.meta.main) main();
