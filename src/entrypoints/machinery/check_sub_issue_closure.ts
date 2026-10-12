#!/usr/bin/env bun
/**
 * check_sub_issue_closure.ts — Determine whether a just-closed issue is an
 * Atomaton sub-issue. If it is, the aggregation gate is left to decide whether its
 * parent is ready; this script answers only "is there a parent, and what is it".
 *
 * ## Why it asks GitHub rather than reading the event
 *
 * It used to take the parent from the `<!-- atomaton:parent=N -->` tag in the closed
 * issue's body, which the webhook payload already carries — free, and wrong for the
 * same reason the tag is gone everywhere else: it recorded the parent at creation and
 * nothing rewrote it, so a sub-issue re-parented in the web UI aggregated under the
 * issue it used to be under. One request buys the answer the rest of the system uses.
 *
 * A parent that could not be READ is not a parent that is absent. Saying
 * `is_sub_issue=false` there would skip the aggregation silently, and nothing else
 * would notice a parent that is never re-invoked — so this fails instead.
 *
 * ## Why it no longer asks whether a merged PR closed this issue
 *
 * It used to, and used the answer to skip the whole aggregation: "a merged PR
 * links this sub-issue, so atomaton-pr-merged.wac.ts already handled the parent".
 * That is a fact about the SUB-ISSUE standing in for a fact about the PARENT, and
 * the two are different questions at different levels of the tree. A pull request
 * that closes a sub-issue says the sub-issue's work was delivered; it says nothing
 * about whether the sub-issue's parent was ever aggregated.
 *
 * The inference was wrong in the direction that loses work, and measurably so. An
 * agent's merge (`merge_pr`, permitted by the shipped `merge.policy: auto`) runs as
 * GITHUB_TOKEN, and GitHub raises no event cascade for its own token's actions — so
 * atomaton-pr-merged never fires for that merge, while the merged PR still appears
 * in `closedByPullRequestsReferences`. Measured on PR #124 (merged by
 * `app/github-actions`, parent #109 of #12): the guard answered `closed_via_pr=true`
 * and skipped, and `atomaton-pr-merged` had no run for that PR at all. #12 was never
 * aggregated, and the skip left no comment, no failure, and a green workflow — the
 * same silent-loss shape as #143.
 *
 * The duplicate it was preventing is real but belongs one level up: two paths
 * aggregating the SAME parent node. `aggregation.ts`'s `atomaton:aggregated` marker
 * already answers that where the identity actually lives — on the parent's own
 * thread — and makes the second caller a no-op. A guard one level down cannot answer
 * it, which is why it was both unreliable and unnecessary. See #150, and #149 for the
 * sweep this is one instance of.
 *
 * Env: CLOSED_NUM, OWNER, REPO
 * Writes to $GITHUB_OUTPUT: is_sub_issue, parent_number
 */
import { appendFileSync } from "node:fs";
import { parentIssueOf } from "../../adapters/github/parent-issue.ts";
import { defineScript } from "./lib/script-ref.ts";

export const ref = defineScript(import.meta.url);

function main(): void {
  const closedNum = process.env.CLOSED_NUM ?? "";
  const owner = process.env.OWNER ?? "";
  const repo = process.env.REPO ?? "";
  const githubOutput = process.env.GITHUB_OUTPUT;

  const found = parentIssueOf(`${owner}/${repo}`, Number(closedNum));
  if (!found.known) {
    console.error(
      `::error::Could not tell whether #${closedNum} is a sub-issue (${found.why}), so nothing was aggregated. ` +
        "Its parent will not be re-invoked until someone does it by hand.",
    );
    process.exit(1);
  }
  const parent = found.parent || undefined;

  if (parent === undefined) {
    if (githubOutput) appendFileSync(githubOutput, "is_sub_issue=false\n");
    return;
  }

  console.error(`Sub-issue #${closedNum} closed — parent #${parent}`);

  if (githubOutput) {
    appendFileSync(githubOutput, ["is_sub_issue=true", `parent_number=${parent}`].join("\n") + "\n");
  }
}

if (import.meta.main) main();
