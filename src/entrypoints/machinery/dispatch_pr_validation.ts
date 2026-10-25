#!/usr/bin/env bun
/**
 * dispatch_pr_validation.ts — hand a pull request to validation, from a workflow step.
 *
 * ## Why a person's command goes through validation rather than straight to the agent
 *
 * A person commenting `/<agent>` on a pull request is asking for a run, and the run
 * they are asking for is a judgement about a commit. Starting it immediately means
 * it reads a CI result that does not exist yet -- so it either waits with nothing
 * able to wake it, or reviews a commit whose checks have not run. Validation is the
 * thing that runs CI and waits, and it already dispatches whoever the result calls
 * for.
 *
 * So every agent start on a pull request goes through it, whoever asked: an agent's
 * handoff, a person's comment, and the re-validation after a push. One path, one
 * place that knows how to wait.
 *
 * ## Why the branch is resolved here when it is not passed in
 *
 * The two agent-side callers push a branch and pass the name they pushed. A person's
 * comment carries only a pull request number, so this script has to ask GitHub which
 * branch the pull request is from -- and a member can comment on a pull request from
 * a FORK, whose head branch is a branch of the fork rather than of this repository.
 * The read used to happen inline in the workflow step, which meant the name arrived
 * unchecked and `--ref` was handed one this repository does not have (#344). It is
 * resolved through the same three gates a `pr` run uses (`lib/pr-head-branch.ts`), and
 * a refusal is posted on the pull request in words the person can act on rather than
 * left as a red job nobody looks at.
 *
 * ## What `asked-by-person` changes
 *
 * Who a FAILED check goes back to. An agent that broke its own pull request fixes
 * it; a person who asked for a run is owed the answer themselves, and handing their
 * request to an agent would be the machinery deciding on their behalf. See
 * `ValidationInput.askedByPerson`.
 *
 * Usage:
 *   dispatch_pr_validation.ts --repo OWNER/REPO --number N [--branch B]
 *     [--asked-by-person] [--ask ID] [--commenter LOGIN]
 */
import { parseArgs } from "node:util";
import { dispatchPrValidation } from "../../adapters/actions/dispatch-targets.ts";
import { gh } from "../../adapters/github/gh.ts";
import { LLM_CONTEXT_TAG } from "../../adapters/github/tags.ts";
import { describePrHeadRefusal, validationNotDispatchedNotice } from "../../domain/work/pr-head-branch.ts";
import { isTrue } from "./lib/flags.ts";
import { resolvePrHeadBranch } from "./lib/pr-head-branch.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface DispatchPrValidationArgs {
  repo: string;
  number: string | number;
  /**
   * The branch to validate. Omitted, it is resolved from the pull request through
   * `lib/pr-head-branch.ts` — the path a person's comment takes, because the number is
   * all the comment carries.
   */
  branch?: string;
  "asked-by-person"?: string;
  /**
   * Who asked, for the refusal posted when no branch can be resolved. Only the
   * person-facing path has one: an agent's own dispatch has a branch by construction.
   */
  commenter?: string;
  /**
   * The ask comment id the run validation dispatches should claim (#285): the
   * person's command for the manual-comment path, the `waiting` ending for
   * `create_pr`'s, the pushing run's own claim for the re-validation after a push.
   * The answers-request check verifies the wait against THIS id, and the runner
   * writes its `atomaton:took` from it.
   */
  ask?: string;
}

export const ref = defineScript<DispatchPrValidationArgs>(import.meta.url);

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      repo: { type: "string" },
      number: { type: "string" },
      branch: { type: "string" },
      "asked-by-person": { type: "string" },
      commenter: { type: "string" },
      ask: { type: "string" },
    },
  });

  const repo = values.repo ?? "";
  const number = values.number ?? "";
  if (!repo || !number) {
    console.error("usage: dispatch_pr_validation.ts --repo OWNER/REPO --number N [--branch B]");
    process.exit(2);
  }

  const branch = (values.branch ?? "").trim() || resolvedBranch(repo, number, values.commenter ?? "");

  // `dispatchPrValidation` reads the agent names from the pull request itself, so
  // there is nothing to pass but the target. `asked-by-person` travels as a
  // workflow input because it is a fact about THIS request rather than about the
  // pull request -- the same pull request can be validated by an agent's push and
  // by a person's comment, and the two route a failure differently.
  const dispatched = dispatchPrValidation(repo, Number(number), branch, {
    askedByPerson: isTrue(values["asked-by-person"]),
    ask: (values.ask ?? "").trim() || undefined,
  });
  if (!dispatched) {
    // Fatal, unlike most dispatches. The person asked for a run and nothing was
    // started; saying so in the log is the only place left, because nothing on this
    // workflow's path posts before validation -- the "CI is running" comment a
    // person may eventually see comes from validation itself, which never runs when
    // its own dispatch failed. (An earlier version of this comment blamed the
    // waiting comment this step used to post; that step is gone -- #271 moved the
    // comment into validation.)
    console.error(`::error::could not dispatch validation for PR #${number}; no agent will run`);
    process.exit(1);
  }
  console.error(`dispatched validation for PR #${number}`);
}

/**
 * The pull request's head branch, or the end of this run.
 *
 * A refusal posts on the pull request and exits non-zero, because the person asked for
 * a run and none is coming: the notice is what they will read, and the red job is what
 * says the request never became a run. Tagged out of the model's context like every
 * other notice addressed to a person — a later run on this pull request would otherwise
 * read somebody else's refusal as something it was told.
 */
function resolvedBranch(repo: string, number: string, commenter: string): string {
  const { branch, refusal } = resolvePrHeadBranch(repo, Number(number));
  if (!refusal) return branch;

  const notice = validationNotDispatchedNotice(commenter, Number(number), refusal);
  const posted = gh(
    "issue", "comment", number, "--repo", repo,
    "--body", [LLM_CONTEXT_TAG.write("exclude"), notice].join("\n"),
  );
  if (posted.code !== 0) {
    console.error(`Warning: could not post the refusal on #${number}: ${posted.stderr || posted.stdout}`);
  }
  console.error(
    `::error::${describePrHeadRefusal(Number(number), refusal)}; nothing was dispatched for PR #${number}`,
  );
  process.exit(1);
}

if (import.meta.main) main();
