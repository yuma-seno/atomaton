import { Workflow } from "@github-actions-workflow-ts/lib";
import type { PullRequestClosedEvent } from "@octokit/webhooks-types";
import { ActionsCheckoutV4 } from "@github-actions-workflow-ts/actions";
import { DefinedJob, JobCondition, SCRIPT_JOB_TIMEOUT_MINUTES, TypedOutputsStep } from "./actions/base.ts";
import { isOwnPullRequest, githubEvent, githubEventRaw } from "./actions/github-context.ts";
import { ATOMATON_WORKFLOW_PERMISSIONS } from "./actions/permissions.ts";
import { scriptCommand, scriptCommandWithArgs } from "./actions/script-call.ts";
import { SetupBunAction } from "./actions/third-party.ts";
import { ref as resolveOrchestratorParentRef } from "../entrypoints/machinery/resolve_orchestrator_parent.ts";
import { ref as aggregateSubIssuesRef } from "../entrypoints/machinery/aggregate_sub_issues.ts";
import { ref as parsePrMetadataRef } from "../entrypoints/machinery/parse_pr_metadata.ts";
import { ref as dispatchPostMergeRef } from "../entrypoints/machinery/dispatch_post_merge.ts";
import { ref as dispatchRejectedRef } from "../entrypoints/machinery/dispatch_rejected.ts";
import { LLM_CONTEXT_TAG } from "../adapters/github/tags.ts";

// Detect what became of a pull request and act on the two things a close can
// mean. Uses pull_request_target so the event is seen whoever or whatever
// performed it. This is the PRIMARY mechanism for sub-issue aggregation on a
// merge: it fires reliably regardless of who/what merged the PR. The
// `issues: closed` event that also fires when the merge auto-closes the linked
// issue is handled by atomaton-sub-issue-closed.wac.ts, which aggregates the
// same completion if it gets there first.
//
// Both paths landing on one completion is expected, not a fault: the shared gate
// in `lib/aggregation.ts` posts an `atomaton:aggregated` marker on the parent, and
// whichever caller arrives second reads it and stands down. That guard lives on the
// parent's own thread because the identity it decides is the parent's -- see
// check_sub_issue_closure.ts's header for why the level below cannot answer it (#150).
//
// Three things happen for a merged pull request, and the order between them is the
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
//   3. Notify the parent with a bookkeeping comment.
//
// A close WITHOUT a merge is the other outcome of the same event, and it used
// to start nothing at all: every job was gated on `merged == true`, so a
// person closing a pull request unmerged left the branch behind, the issue
// open, and nobody told (#267). `dispatch-rejected` now returns that close to
// the origin agent as a rejection -- as a judgement for the agent to make, not
// a verdict the machine has reached; `decideRejectionHandoff` holds the branch
// list and why the machine closes nothing on this side. It is gated on the
// pull request's head branch being this repository's: a merge is the one
// outcome an outside contributor cannot produce, a close is not, and an
// agent only starts when a repository member triggered it.
//
// NOTE: this workflow never runs for an agent's own actions -- GITHUB_TOKEN's own
// actions raise no event cascade, so `pull_request_target: closed` fires only for a
// person's merge or close. The agent's `merge_pr` takes the merge decisions
// in-process instead (`decidePostMergeHandoff` + the close path's own gate). That is
// why the aggregation cannot be assumed to have happened merely because a merged PR
// links an issue (#150).
//
// Job graph:
//   parse (BOTH outcomes -- it carries no merge gate any more, because the
//          rejection side reads its output too)
//     \-> resolve-parent --> notify-parent (merged)
//                        \-> aggregate-sub-issues (merged)
//   reinvoke-origin-agent (merged; no `needs` -- it decides from the pull request's
//          own body, and carries its merge gate itself for the reason recorded on it)
//   dispatch-rejected (NOT merged, and the pull request's head branch is this
//          repository's -- the membership gate that keeps a fork's forged body
//          from starting anything)

const parseMetadataStep = new TypedOutputsStep(
  {
    name: "Parse the parent-issue tag from the PR body",
    id: "parse-metadata",
    shell: "bash",
    env: {
      PR_BODY: githubEvent<PullRequestClosedEvent>((e) => e.pull_request.body),
      PR_NUMBER: githubEvent<PullRequestClosedEvent>((e) => e.pull_request.number),
    },
    run: `${scriptCommand(parsePrMetadataRef)}\n`,
  },
  ["parent_number"] as const,
);

const parseJob = new DefinedJob(
  "parse",
  {
    "runs-on": "ubuntu-latest",
    "timeout-minutes": SCRIPT_JOB_TIMEOUT_MINUTES,
    // No `merged` gate, where it had one: the rejection side reads this number
    // too, so `parse` runs for both outcomes of `closed`. The merge-side jobs
    // carry the gate themselves again -- that is the explicit `merged == true`
    // on `notify-parent`, `reinvoke-origin-agent` and `aggregate-sub-issues`
    // below. A gate inherited through `needs` is what `reinvoke-origin-agent`
    // silently lost once its `needs` was dropped (#203); a job now states the
    // event test it depends on.
    //
    // One output, where there used to be two.
    //
    // `sub_issue` was read from the body's `Closes #N` line and `parent_issue` from
    // its tag — and the two were the same number every time, because `create_pr`
    // wrote both from the run's one issue number. Every use below was `sub_issue` fed to
    // something that then asked GitHub for ITS parent, which the tag answers on its
    // own. The line is gone (#171) and the duplicate with it.
    outputs: {
      parent_issue: parseMetadataStep.outputs.parent_number,
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
      SUB: parseJob.outputs.parent_issue,
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
    "timeout-minutes": SCRIPT_JOB_TIMEOUT_MINUTES,
    if: JobCondition.isNot(parseJob.rawOutputs.parent_issue, ""),
    needs: [parseJob],
    outputs: {
      parent_issue: resolveStep.outputs.parent_issue,
    },
  },
  [new ActionsCheckoutV4({}), new SetupBunAction({ name: "Setup Bun" }), resolveStep],
);

// Both merge-side terminal jobs depend on the exact same pair -- resolve-parent
// (for the resolved parent issue number) and parse (for the issue the pull
// request belongs to) -- so this is the one place that lists that dependency.
const NOTIFY_AND_AGGREGATE_NEEDS = [resolveParentJob, parseJob];

/**
 * Re-invoke the agent that opened the merged pull request, to judge the merge.
 *
 * The step writes `reinvoked=true` when `dispatchPostMergeAgent` started a run; the
 * aggregate job reads it (below) and stands down. Everything about which agent and
 * which issue is decided in `dispatch_post_merge.ts`, which applies the same
 * `decidePostMergeHandoff` as `merge_pr`, so the two merge routes cannot drift.
 *
 * ## Why it has no `needs`, and why it still needs an `if`
 *
 * It used to be gated on `resolve-parent` — the orchestrator root above the pull
 * request's issue. But the re-invocation reads the pull request BODY (which issue, which
 * origin agent) and uses nothing that resolution answers. A root issue has no parent, so
 * the resolution is empty and the job was skipped along with the two that genuinely need
 * one: a root issue's merged pull request was never re-invoked, and the run was green
 * (#203, observed on #206 / pull request #233).
 *
 * The only question — does this pull request name an issue to re-invoke — belongs to
 * `dispatch_post_merge.ts`, which answers it (`no-parent` writes `reinvoked=false`). One
 * rule, in the place that has the inputs for it.
 *
 * The merge gate is a different question and is written here rather than inherited. It
 * used to come from `needs: [parse, ...]`: GitHub skips a job whose needed job was
 * skipped, and `parse` was the only job in this workflow that tested the event. Parse
 * no longer carries that gate -- it runs for both outcomes of `closed` -- so this job
 * states its own.
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
    "timeout-minutes": SCRIPT_JOB_TIMEOUT_MINUTES,
    // A merge test of its own, not the one `needs: parse` used to lend it.
    if: JobCondition.is(githubEventRaw<PullRequestClosedEvent>((e) => e.pull_request.merged), true),
    outputs: {
      reinvoked: reinvokeStep.outputs.reinvoked,
    },
    env: {
      GH_TOKEN: "${{ github.token }}",
    },
  },
  [new ActionsCheckoutV4({}), new SetupBunAction({ name: "Setup Bun" }), reinvokeStep],
);

/**
 * Return the close to the origin agent as a rejection (#267).
 *
 * The other outcome of the same event: a close that merged nothing. It used to
 * start nothing -- every job was gated on `merged == true` -- so a rejected
 * pull request left its branch behind, its issue open, and nobody told. The
 * job hands the close to `dispatch_rejected.ts`, which reads the issue `parse`
 * produced, the origin agent from the pull request body, and the issue's state
 * from GitHub, and applies `decideRejectionHandoff`: return the close to the
 * agent when the issue is still open and the agent is named; do nothing when it
 * is not. The machine closes nothing here.
 *
 * ## Why it needs `parse`, and nothing else
 *
 * The linked issue is parse's output -- read once, for both outcomes, rather
 * than a second reader of the same body tag. Everything else (the origin agent,
 * the state of the issue) is decided in the script, the place that has the
 * inputs for it; the job carries only the event test that picks this outcome --
 * plus the membership test, which lives on the job because it is about the
 * EVENT, not about what the body asks for (see the job's comment: the head
 * repository, not the author's association).
 *
 * ## Why a failed dispatch fails the job
 *
 * The merge route has a fallback: when its re-invocation does not go out, the
 * aggregate job aggregates the parent anyway -- better than a silent wait. This
 * route has none. A close that woke nobody is the exact defect #267 exists to
 * remove, so the script exits non-zero and the job goes red rather than
 * reporting a green run that handed off nothing.
 */
const rejectedStep = new TypedOutputsStep({
  name: "Return the close to the origin agent as a rejection",
  id: "rejected",
  shell: "bash",
  env: {
    GH_TOKEN: "${{ github.token }}",
    ISSUE_NUMBER: parseJob.outputs.parent_issue,
    PR_BODY: githubEvent<PullRequestClosedEvent>((e) => e.pull_request.body),
    PR_NUMBER: githubEvent<PullRequestClosedEvent>((e) => e.pull_request.number),
    OWNER: "${{ github.repository_owner }}",
    REPO: githubEvent<PullRequestClosedEvent>((e) => e.repository.name),
  },
  run: `${scriptCommand(dispatchRejectedRef)}\n`,
});

const dispatchRejectedJob = new DefinedJob(
  "dispatch-rejected",
  {
    "runs-on": "ubuntu-latest",
    "timeout-minutes": SCRIPT_JOB_TIMEOUT_MINUTES,
    // Only the close that merged nothing, and only for this repository's own
    // pull requests. The second test is the trust boundary, and it exists
    // because the two outcomes of `closed` are not symmetric in who can cause
    // them: a merge is the one outcome an outside contributor cannot produce
    // (`merged == true` is already member-only, which is why the three
    // merge-side jobs need no membership test), but a close is not -- a
    // contributor can close their own pull request, and a maintainer rejecting
    // an outside contribution fires the same event with the same body. Without
    // the head-repository test, two forged tags in that body would start an
    // agent on a number the contributor chose -- the boundary
    // `docs/work/boundaries.md` states: an agent only starts when a repository
    // member triggered it.
    //
    // The test is the HEAD REPOSITORY, not `author_association`: an agent's
    // pull request is authored by `github-actions[bot]`, association `NONE`, so
    // an association test would be false for every pull request the machinery
    // opened and the feature would never fire (the trap recorded on
    // `atomaton-sub-issue-closed.wac.ts`). The head repository holds both ways.
    if: JobCondition.is(githubEventRaw<PullRequestClosedEvent>((e) => e.pull_request.merged), false).and(
      // `head.repo` is nullable in the webhook schema (a deleted fork head), so
      // the accessor reads through optional chaining; the recorded path is the
      // same, and a null head cannot be this repository's own.
      JobCondition.from(isOwnPullRequest(githubEventRaw<PullRequestClosedEvent>((e) => e.pull_request.head.repo?.full_name))),
    ),
    // For the linked issue `parse` produced. Parse runs for both outcomes, so
    // this wait is never a skip.
    needs: [parseJob],
    env: {
      GH_TOKEN: "${{ github.token }}",
    },
  },
  [new ActionsCheckoutV4({}), new SetupBunAction({ name: "Setup Bun" }), rejectedStep],
);

export const atomaPrClosed = new Workflow("atomaton-pr-closed", {
  name: "Atomaton PR Closed",
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
      "timeout-minutes": SCRIPT_JOB_TIMEOUT_MINUTES,
      // The merge gate is written here now, where it used to be inherited from
      // `parse` through `needs`: parse runs for both outcomes of `closed`, and
      // a close that merged nothing must not comment on the parent about a
      // merge that did not happen.
      if: JobCondition.is(githubEventRaw<PullRequestClosedEvent>((e) => e.pull_request.merged), true).and(
        JobCondition.isNot(resolveParentJob.rawOutputs.parent_issue, ""),
      ),
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
      "timeout-minutes": SCRIPT_JOB_TIMEOUT_MINUTES,
      // Not when the judgement was dispatched: it re-invokes the parent itself once
      // the sub-issue is closed, and aggregating here would start the parent on a
      // subtree whose sub-issue is still open. The merge gate is written here for
      // the same reason `notify-parent`'s is -- parse no longer carries it.
      if: JobCondition.is(githubEventRaw<PullRequestClosedEvent>((e) => e.pull_request.merged), true)
        .and(JobCondition.isNot(resolveParentJob.rawOutputs.parent_issue, ""))
        .and(JobCondition.isNot(reinvokeJob.rawOutputs.reinvoked, "true")),
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
          // The issue this pull request belongs to, not a second number read from
          // its body. The two were the same value (see `parseJob`); this is the
          // one that survives the `Closes` line's removal.
          CLOSED_NUM: parseJob.outputs.parent_issue,
        },
        run: `${scriptCommandWithArgs(aggregateSubIssuesRef, { repo: "\${OWNER}/\${REPO}", parent: "\${PARENT}", "closed-num": "\${CLOSED_NUM}" })}
`,
      }),
    ],
  ),
  dispatchRejectedJob,
]);
