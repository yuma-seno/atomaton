import { Workflow } from "@github-actions-workflow-ts/lib";
import type { PullRequestClosedEvent } from "@octokit/webhooks-types";
import { ActionsCheckoutV4 } from "@github-actions-workflow-ts/actions";
import { DefinedJob, JobCondition, TypedOutputsStep } from "./actions/base.ts";
import { githubEvent, githubEventRaw } from "./actions/github-context.ts";
import { ATOMATON_WORKFLOW_PERMISSIONS } from "./actions/permissions.ts";
import { scriptCommand, scriptCommandWithArgs } from "./actions/script-call.ts";
import { SetupBunAction } from "./actions/third-party.ts";
import { ref as resolveOrchestratorParentRef } from "../entrypoints/machinery/resolve_orchestrator_parent.ts";
import { ref as aggregateSubIssuesRef } from "../entrypoints/machinery/aggregate_sub_issues.ts";
import { ref as parsePrMetadataRef } from "../entrypoints/machinery/parse_pr_metadata.ts";
import { ref as dispatchPostMergeRef } from "../entrypoints/machinery/dispatch_post_merge.ts";
import { LLM_CONTEXT_TAG } from "../adapters/github/tags.ts";

// Detect PR merges and aggregate sub-issue results.
// Uses pull_request_target so GITHUB_TOKEN-created PR merges are detected.
//
// This is the PRIMARY mechanism for sub-issue aggregation. It fires reliably
// regardless of who/what merged the PR. The `issues: closed` event that also
// fires when the merge auto-closes the linked issue is handled by
// atomaton-sub-issue-closed.wac.ts, which explicitly skips issues closed via a
// merged PR (see its "Check if closed via a merged PR" step) to avoid
// dispatching the atomaton twice for the same completion.
//
// Two things happen for a merged pull request, and the order between them is the
// point:
//
//   1. Re-invoke the agent that opened it, to JUDGE whether what merged satisfies
//      the issue it delivers. `dispatchPostMergeAgent` posts the trigger comment and
//      starts the run. This is the same decision `merge_pr` takes for an
//      agent-made merge (`decidePostMergeHandoff`); a person's merge skipped it, so a
//      sub-issue's pull request merged by hand went straight to aggregating the parent
//      with the sub-issue still open.
//   2. Aggregate the parent, but ONLY when step 1 did not re-invoke anybody. When it
//      did, the judgement runs, closes the sub-issue if the criteria are met, and THAT
//      close aggregates the parent -- so aggregating here would race it and start the
//      parent on a subtree that is not finished.
//
// Job graph:
//   parse --> resolve-parent --> notify-parent
//                             \-> re-invoke (may stand the aggregate job down)
//                             \-> aggregate-sub-issues (skipped when re-invoke did)

const parseMetadataStep = new TypedOutputsStep(
  {
    name: "Parse parent-issue / sub-issue metadata from PR body",
    id: "parse-metadata",
    shell: "bash",
    env: {
      PR_BODY: githubEvent<PullRequestClosedEvent>((e) => e.pull_request.body),
      PR_NUMBER: githubEvent<PullRequestClosedEvent>((e) => e.pull_request.number),
    },
    run: `${scriptCommand(parsePrMetadataRef)}\n`,
  },
  ["parent_number", "sub_number"] as const,
);

const parseJob = new DefinedJob(
  "parse",
  {
    "runs-on": "ubuntu-latest",
    if: JobCondition.is(githubEventRaw<PullRequestClosedEvent>((e) => e.pull_request.merged), true),
    outputs: {
      parent_issue: parseMetadataStep.outputs.parent_number,
      sub_issue: parseMetadataStep.outputs.sub_number,
    },
  },
  [new ActionsCheckoutV4({}), new SetupBunAction({ name: "Setup Bun" }), parseMetadataStep],
);

const resolveStep = new TypedOutputsStep(
  {
    name: "Resolve atomaton parent via GraphQL parent field",
    id: "resolve",
    shell: "bash",
    env: {
      GH_TOKEN: "${{ github.token }}",
      REPO: "${{ github.repository }}",
      SUB: parseJob.outputs.sub_issue,
    },
    run: `PARENT=$(${scriptCommandWithArgs(resolveOrchestratorParentRef, { repo: "\${REPO}", sub: "\${SUB}" })})
echo "parent_issue=\${PARENT}" >> "$GITHUB_OUTPUT"
`,
  },
  ["parent_issue"] as const,
);

const resolveParentJob = new DefinedJob(
  "resolve-parent",
  {
    "runs-on": "ubuntu-latest",
    if: JobCondition.isNot(parseJob.rawOutputs.sub_issue, ""),
    needs: [parseJob],
    outputs: {
      parent_issue: resolveStep.outputs.parent_issue,
    },
  },
  [new ActionsCheckoutV4({}), new SetupBunAction({ name: "Setup Bun" }), resolveStep],
);

// Both terminal jobs below depend on the exact same pair -- resolve-parent
// (for the resolved parent issue number) and parse (for the raw sub-issue
// number) -- so this is the one place that lists that dependency.
const NOTIFY_AND_AGGREGATE_NEEDS = [resolveParentJob, parseJob];

/**
 * Re-invoke the agent that opened the merged pull request, to judge the merge.
 *
 * The step writes `reinvoked=true` when `dispatchPostMergeAgent` started a run; the
 * aggregate job reads it (below) and stands down. Everything about which agent and
 * which issue is decided in `dispatch_post_merge.ts`, which applies the same
 * `decidePostMergeHandoff` as `merge_pr`, so the two merge routes cannot drift.
 */
const reinvokeStep = new TypedOutputsStep(
  {
    name: "Re-invoke the origin agent to judge the merge",
    id: "reinvoke",
    shell: "bash",
    env: {
      GH_TOKEN: "${{ github.token }}",
      PR_BODY: githubEvent<PullRequestClosedEvent>((e) => e.pull_request.body),
      PR_NUMBER: githubEvent<PullRequestClosedEvent>((e) => e.pull_request.number),
      OWNER: "${{ github.repository_owner }}",
      REPO: githubEvent<PullRequestClosedEvent>((e) => e.repository.name),
    },
    run: `${scriptCommand(dispatchPostMergeRef)}\n`,
  },
  ["reinvoked"] as const,
);

const reinvokeJob = new DefinedJob(
  "reinvoke-origin-agent",
  {
    "runs-on": "ubuntu-latest",
    if: JobCondition.isNot(resolveParentJob.rawOutputs.parent_issue, ""),
    needs: NOTIFY_AND_AGGREGATE_NEEDS,
    outputs: {
      reinvoked: reinvokeStep.outputs.reinvoked,
    },
    env: {
      GH_TOKEN: "${{ github.token }}",
    },
  },
  [new ActionsCheckoutV4({}), new SetupBunAction({ name: "Setup Bun" }), reinvokeStep],
);

export const atomaPrMerged = new Workflow("atomaton-pr-merged", {
  name: "Atomaton PR Merged",
  on: {
    pull_request_target: { types: ["closed"] },
  },
  permissions: { ...ATOMATON_WORKFLOW_PERMISSIONS, "pull-requests": "read" },
}).addJobs([
  parseJob,
  resolveParentJob,
  new DefinedJob(
    "notify-parent",
    {
      "runs-on": "ubuntu-latest",
      if: JobCondition.isNot(resolveParentJob.rawOutputs.parent_issue, ""),
      needs: NOTIFY_AND_AGGREGATE_NEEDS,
    },
    [
      new TypedOutputsStep({
        name: "Comment on parent issue",
        shell: "bash",
        env: {
          GH_TOKEN: "${{ github.token }}",
          REPO: "${{ github.repository }}",
          PARENT: resolveParentJob.outputs.parent_issue,
          PR_NUMBER: githubEvent<PullRequestClosedEvent>((e) => e.pull_request.number),
          PR_TITLE: githubEvent<PullRequestClosedEvent>((e) => e.pull_request.title),
          PR_URL: githubEvent<PullRequestClosedEvent>((e) => e.pull_request.html_url),
        },
        // Not a turn comment: this is machinery bookkeeping about a merge that happened
        // to a NODE OTHER THAN the one it is posted on (the parent). The parent's own
        // turn is moved by the aggregation dispatch, not by this line, so writing an
        // `ended` tag here would put an ending on the parent's thread that the parent's
        // run did not produce. It keeps the `llm-context=exclude` tag it always had.
        run: `gh issue comment "$PARENT" --repo "$REPO" --body \\
  "${LLM_CONTEXT_TAG.write("exclude")}
PR #\${PR_NUMBER} merged: \${PR_TITLE} (\${PR_URL})"
`,
      }),
    ],
  ),
  // The judgement, before the aggregation. Reads the same two body tags
  // `merge_pr` reads and applies the same `decidePostMergeHandoff`, so the
  // agent-made and person-made merge routes agree by construction. `reinvoked=true`
  // stands the aggregate job down: the agent it starts closes the sub-issue if the
  // criteria are met, and THAT close aggregates the parent.
  reinvokeJob,
  new DefinedJob(
    "aggregate-sub-issues",
    {
      "runs-on": "ubuntu-latest",
      // Not when the judgement was dispatched: it re-invokes the parent itself once
      // the sub-issue is closed, and aggregating here would start the parent on a
      // subtree whose sub-issue is still open.
      if: JobCondition.isNot(resolveParentJob.rawOutputs.parent_issue, "").and(
        JobCondition.isNot(reinvokeJob.rawOutputs.reinvoked, "true"),
      ),
      needs: [...NOTIFY_AND_AGGREGATE_NEEDS, reinvokeJob],
      env: {
        GH_TOKEN: "${{ github.token }}",
      },
    },
    [
      new ActionsCheckoutV4({}),
      // Required below: aggregate_sub_issues.ts (which uses shared logic
      // from lib/aggregation.ts, lib/sibling-check.ts, lib/notify.ts) is
      // run via `bun run` -- not preinstalled on GitHub-hosted runners.
      new SetupBunAction({ name: "Setup Bun" }),
      new TypedOutputsStep({
        name: "Aggregate sub-issue results",
        shell: "bash",
        env: {
          OWNER: "${{ github.repository_owner }}",
          REPO: githubEvent<PullRequestClosedEvent>((e) => e.repository.name),
          PARENT: resolveParentJob.outputs.parent_issue,
          CLOSED_NUM: parseJob.outputs.sub_issue,
        },
        run: `${scriptCommandWithArgs(aggregateSubIssuesRef, { repo: "\${OWNER}/\${REPO}", parent: "\${PARENT}", "closed-num": "\${CLOSED_NUM}" })}
`,
      }),
    ],
  ),
]);
