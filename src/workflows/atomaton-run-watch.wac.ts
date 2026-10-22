import { Workflow } from "@github-actions-workflow-ts/lib";
import type { WorkflowRunCompletedEvent } from "@octokit/webhooks-types";
import { ActionsCheckoutV4 } from "@github-actions-workflow-ts/actions";
import { DefinedJob, SCRIPT_JOB_TIMEOUT_MINUTES, TypedOutputsStep } from "./actions/base.ts";
import { githubEvent } from "./actions/github-context.ts";
import { ATOMATON_WORKFLOW_PERMISSIONS } from "./actions/permissions.ts";
import { scriptCommandWithArgs } from "./actions/script-call.ts";
import { SetupBunAction } from "./actions/third-party.ts";
import { ref as reconcileRunEndingRef } from "../entrypoints/machinery/reconcile_run_ending.ts";

/**
 * The run watch — the outside check for a runner run that never wrote its ending.
 *
 * Everything that reports a run's ending reports from a step INSIDE the run, so a
 * run whose runner vanished, that was cancelled or timed out, or that the
 * machinery skipped whole (the `new_event_count == 0` path ends green with every
 * agent step skipped) leaves the thread's last turn event at the `asked` that
 * started it — and the guard, which reads the thread, deletes what a person writes
 * next, forever, because no run will ever arrive to heal it. #252.
 *
 * This workflow is triggered by the runner's own completion, after all of the
 * runner's steps have finished, so the two cannot double-report: a run that
 * reported — its result comment, or its failure notice — has the ending on the
 * thread already, timestamped at or after the run's start, and the watch reads it
 * and stays silent. Only the run whose report never landed gets the notice. It is
 * the second line of defence, not a replacement: the run's colour still belongs to
 * the inside report alone, because it is decided at completion, before any outside
 * step could speak.
 *
 * #252's residual holes stay holes by decision: GitHub itself down (nobody can
 * write anything), a run queued forever (its trigger never fires), and a deleted
 * node (nowhere to post) leave the red run as the only signal, and re-running it
 * is the recovery — the one place "a person can always resume by comment" does not
 * hold.
 */

/**
 * The concurrency group, per watched node.
 *
 * The node is the display title, because that is where the runner writes it. Two
 * watch runs for the SAME node — a re-run of a runner run whose first instance's
 * watch has not finished — would each read a thread without the ending and each
 * post a notice; one group per node serializes them, so the second reads the
 * thread AFTER the first's notice landed. Different nodes run concurrently: a
 * repo-wide group would queue every watch behind every other, and GitHub keeps at
 * most one PENDING run per group — a chain's completions arriving together would
 * cancel the queued watches and leave exactly the runs this exists for unreconciled.
 *
 * `cancel-in-progress: false`: a watch that is RUNNING finishes. The pending slot
 * is where the newest-wins behaviour lives, and for one node the newest watch's
 * reconciliation subsumes the older one's — it reads the thread as it stands now,
 * and one notice for the jam as it stands is the outcome, not two for how it got
 * there.
 */
const CONCURRENCY_GROUP = "atomaton-run-watch-\${{ github.event.workflow_run.display_title }}";

export const atomaRunWatch = new Workflow("atomaton-run-watch", {
  name: "Atomaton Run Watch",
  on: {
    workflow_run: {
      // The runner by NAME, the way GitHub's trigger matches. The runner's own
      // completion is the only completion this watch reads; its own runs are not
      // `Atomaton Runner` and never re-trigger it.
      workflows: ["Atomaton Runner"],
      types: ["completed"],
    },
  },
  concurrency: { group: CONCURRENCY_GROUP, "cancel-in-progress": false },
  permissions: ATOMATON_WORKFLOW_PERMISSIONS,
}).addJob(
  new DefinedJob("watch", {
    "runs-on": "ubuntu-latest",
    "timeout-minutes": SCRIPT_JOB_TIMEOUT_MINUTES,
  }, [
    // The triggering run's head commit, which is the machinery commit the runner
    // itself ran on — the same scripts, so a watch never reconciles a run with a
    // different release's reader.
    new ActionsCheckoutV4({}),
    new SetupBunAction({ name: "Setup Bun" }),
    new TypedOutputsStep({
      name: "Reconcile the run's ending",
      shell: "bash",
      env: {
        GH_TOKEN: "${{ github.token }}",
        GITHUB_REPOSITORY: "${{ github.repository }}",
        // The event's values ride in as env, not as argv splices. The display title
        // is not one of the runner's validated inputs — it is whatever GitHub
        // substituted into `run-name` — and a value spliced into shell text is the
        // injection `toArgv`'s own comment warns about. An env value is set as the
        // process environment, which no shell parses; the argv below reads the
        // variables back, and bash does not re-execute a variable's expansion.
        DISPLAY_TITLE: githubEvent<WorkflowRunCompletedEvent>((e) => e.workflow_run.display_title),
        RUN_STARTED_AT: githubEvent<WorkflowRunCompletedEvent>((e) => e.workflow_run.run_started_at),
        RUN_URL: githubEvent<WorkflowRunCompletedEvent>((e) => e.workflow_run.html_url),
        CONCLUSION: githubEvent<WorkflowRunCompletedEvent>((e) => e.workflow_run.conclusion),
      },
      run: `${scriptCommandWithArgs(reconcileRunEndingRef, {
        "display-title": "\${DISPLAY_TITLE}",
        "run-started-at": "\${RUN_STARTED_AT}",
        "run-url": "\${RUN_URL}",
        conclusion: "\${CONCLUSION}",
      })}
`,
    }),
  ]),
);
