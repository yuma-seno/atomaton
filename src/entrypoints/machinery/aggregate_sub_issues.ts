#!/usr/bin/env bun
/**
 * aggregate_sub_issues.ts — Called after a PR merges and its linked
 * sub-issue's atomaton parent is known. If any sibling sub-issues are
 * still open, just posts a progress comment. Once all siblings are done, it
 * re-dispatches the atomaton.
 *
 * It carries nothing into the parent's session, and that is the point (#149).
 * It used to read every child's title, state and "linked pull requests" and overwrite
 * the parent's last tool message with them — a summary assembled by a different route
 * than the one the parent reads, and one whose pull request lookup was a body search
 * with no predicate behind it (`#109` matched `#1090`, and a body saying "the bug found
 * in #109" counted as a delivery). What the parent is told about its children is one
 * thing now: the report each child's own closing run posts on the parent's thread (see
 * `adapters/github/sub-issue-report.ts`). This path posts none of its own, because a
 * person merging a pull request is not a run with anything to say.
 *
 * Thin CLI wrapper around app/aggregation.ts's shared dispatch gate -- see that
 * module's doc comment for the other two callers of the same gate and for the
 * race between them.
 *
 * Usage:
 *   aggregate_sub_issues.ts --repo OWNER/REPO --parent N --closed-num N
 */
import { parseArgs } from "node:util";
import { defineScript } from "./lib/script-ref.ts";
import { describeGateResult, dispatchOrchestratorIfReady, needsAttention } from "../../app/aggregation.ts";

export interface AggregateSubIssuesArgs {
  repo: string;
  parent: string | number;
  "closed-num": string | number;
}

export const ref = defineScript<AggregateSubIssuesArgs>(import.meta.url);

async function main(): Promise<void> {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      repo: { type: "string" },
      parent: { type: "string" },
      "closed-num": { type: "string" },
    },
  });
  const repo = values.repo;
  const parent = values.parent;
  const closedNum = values["closed-num"];
  if (!repo || !parent || !closedNum) {
    console.error("usage: aggregate_sub_issues.ts --repo OWNER/REPO --parent N --closed-num N");
    process.exit(2);
  }

  console.error(`PR merged (sub-issue #${closedNum}, parent #${parent}). Checking siblings...`);

  const result = await dispatchOrchestratorIfReady({
    repo,
    parent: Number(parent),
    closedNum: Number(closedNum),
    // We already KNOW this sub-issue's work is done (its PR just merged)
    // regardless of whether GitHub's live issue state reflects that yet
    // (native "Closes #N" auto-close is unreliable under the Actions
    // GITHUB_TOKEN) -- excluding it makes this check reliably correct on
    // its first (and normally only) run instead of depending on that timing.
    exclude: true,
    progressMessage: (remaining) => `Atomaton: Sub-task #${closedNum} completed. ${remaining} sub-task(s) still in progress.`,
  });

  console.error(describeGateResult(result, Number(closedNum), Number(parent)));
  // A run that left work undone must not look green. `needsAttention` is true
  // only for the two outcomes nothing else will retry.
  if (needsAttention(result)) process.exit(1);
}

if (import.meta.main) void main();
