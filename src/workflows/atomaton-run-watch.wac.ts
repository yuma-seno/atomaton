import { Workflow } from "@github-actions-workflow-ts/lib";
import type { WorkflowRunCompletedEvent } from "@octokit/webhooks-types";
import { ActionsCheckoutV4 } from "@github-actions-workflow-ts/actions";
import { DefinedJob, JobCondition, SCRIPT_JOB_TIMEOUT_MINUTES, TypedOutputsStep } from "./actions/base.ts";
import { githubEvent } from "./actions/github-context.ts";
import { ATOMATON_WORKFLOW_PERMISSIONS } from "./actions/permissions.ts";
import { scriptCommandWithArgs } from "./actions/script-call.ts";
import { SetupBunAction } from "./actions/third-party.ts";
import { ref as reconcileRunEndingRef } from "../entrypoints/machinery/reconcile_run_ending.ts";
import { ref as sweepStaleLocksRef } from "../entrypoints/machinery/sweep_stale_locks.ts";

/**
 * The run watch — the outside check for a run that never wrote its ending.
 *
 * Everything that reports a run's ending reports from a step INSIDE the run, so a
 * run whose runner vanished, that was cancelled or timed out, or that the
 * machinery skipped whole (the `new_event_count == 0` path ends green with every
 * agent step skipped) leaves the thread's last turn event at the `asked` that
 * started it — and the guard, which reads the thread, deletes what a person writes
 * next, forever, because no run will ever arrive to heal it. #252.
 *
 * This workflow is triggered by the completion of the runner AND of the two entry
 * workflows that can start a chain, after all of the watched run's steps have
 * finished, so the two cannot double-report: a run that reported — its result
 * comment, or its failure notice — has the ending on the thread already,
 * timestamped at or after the run's start, and the watch reads it and stays
 * silent. Only the run whose report never landed gets the notice. It is the second
 * line of defence, not a replacement: the run's colour still belongs to the inside
 * report alone, because it is decided at completion, before any outside step could
 * speak.
 *
 * The entry workflows are on the list because GitHub records no run for a CALLED
 * workflow — they execute the runner as a reusable workflow, so the first run of
 * every chain exists only as its caller's run. Their titles carry the node alone
 * (`run-name` is evaluated before any job runs, so the agent a route would choose
 * is not available to the title); the notice reads the agent off the thread.
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
const CONCURRENCY_GROUP =
  "atomaton-run-watch-\${{ github.event_name }}-\${{ github.event.workflow_run.display_title }}";

/**
 * Why the group names the EVENT as well as the node.
 *
 * The node is the watched run's display title, and a schedule has no watched run: that
 * expression is empty there, so every scheduled run would join the same group as a watch
 * for a node whose title happened to be blank. Naming the event separates the two halves —
 *
 *   - `atomaton-run-watch-workflow_run-<node>`: one group per node, as before, so two
 *     watches of one node serialize and different nodes do not queue behind each other.
 *   - `atomaton-run-watch-schedule-`: one group for every sweep, which is what a sweep
 *     wants. There is no node to key on, and two sweeps in flight would read the same
 *     thread and both post an ending for it.
 *
 * A job-level group would not have been enough: GitHub applies the workflow's group first,
 * so two runs of this workflow in one workflow-level group cannot overlap whatever their
 * jobs say.
 */

/**
 * How often the sweep runs.
 *
 * Fifteen minutes, and the number is a bound on how long a person can be locked out rather
 * than a cost: a sweep that finds nothing makes one list read per node and writes nothing.
 * GitHub delays or drops a scheduled run under load, so this is the common case and not a
 * guarantee — which is why the completion trigger above stays: a delivered completion is
 * still reconciled within seconds.
 */
const SWEEP_CRON = "*/15 * * * *";

/**
 * How long one sweep may take.
 *
 * Fifteen minutes rather than `SCRIPT_JOB_TIMEOUT_MINUTES`'s five, because the sweep's work
 * is proportional to the repository rather than to a fixed script: one thread read and one
 * run-status read per node wearing the label, up to the sweep's own limit. Being stopped
 * early costs the sweep and nothing else — every node is released only after its ending has
 * been posted and the thread read back — and the next run is fifteen minutes away.
 */
const SWEEP_JOB_TIMEOUT_MINUTES = 15;

export const atomaRunWatch = new Workflow("atomaton-run-watch", {
  name: "Atomaton Run Watch",
  on: {
    // The scheduled half. A `workflow_run` never fires for a run the machinery dispatched
    // with `GITHUB_TOKEN` — GitHub starts no run for an event its own token triggered — so
    // the trigger below has only ever watched ENTRY runs, and the runner runs this workflow
    // exists for (the ones that die mid-work) never arrived here at all (#462). A schedule
    // does not depend on an event being delivered, so it is the check that reaches them.
    schedule: [{ cron: SWEEP_CRON }],
    workflow_run: {
      // The three workflows whose completions can leave a node's turn unreported,
      // by NAME, the way GitHub's trigger matches. The runner's own runs are the
      // continuations a chain dispatches. The two entry workflows are here because
      // GitHub records NO run for a called workflow — they execute the runner as a
      // reusable workflow, so the first run of every chain (a person's command, a
      // new issue) exists only as its caller's run, and a caller that was cancelled
      // or timed out would jam its thread with no watch on it at all. Most entry
      // runs never took a turn; `reconcile_run_ending`'s second gate (`tookTurn`)
      // is what keeps the watch silent on those, and it reads the event that
      // started the watched run (`workflow_run.event`, below) to tell a
      // command-consuming run from one — an entry run started by a new issue —
      // that must never claim a person's command as its own. This workflow's own
      // runs are not in the list and never re-trigger it.
      workflows: ["Atomaton Runner", "Atomaton Entry", "Atomaton Manual Comment"],
      types: ["completed"],
    },
  },
  concurrency: { group: CONCURRENCY_GROUP, "cancel-in-progress": false },
  permissions: ATOMATON_WORKFLOW_PERMISSIONS,
}).addJob(
  new DefinedJob("watch", {
    "runs-on": "ubuntu-latest",
    "timeout-minutes": SCRIPT_JOB_TIMEOUT_MINUTES,
    // The completion half only. On a schedule there is no watched run — no title, no id, no
    // conclusion — and the reconciliation below would read every one of them as empty; the
    // sweep job is what a schedule runs instead.
    if: JobCondition.of("github.event_name == 'workflow_run'"),
  }, [
    // The DEFAULT branch head, which is what `github.sha` is on a `workflow_run`
    // event — not the triggering run's head commit, whatever a first reading of
    // this checkout might suggest. That is the right commit anyway: a watch is
    // part of the DEPLOYED machinery, and its reconciliation must read the tag
    // vocabulary the deployed machinery writes — including the vocabulary of the
    // runs deployed after the watched one started. A watch pinned to the watched
    // run's commit would read older formats forever and miss the runs the newest
    // release changed the shape of.
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
        // The watched run's id — the value the runner wrote into its claim and its
        // ending (#285). Both gates are comparisons against it, which is why it is
        // an env value like the rest: a claim read off the thread names a run id,
        // and the comparison is ids, not timestamps.
        RUN_ID: githubEvent<WorkflowRunCompletedEvent>((e) => e.workflow_run.id),
        RUN_URL: githubEvent<WorkflowRunCompletedEvent>((e) => e.workflow_run.html_url),
        CONCLUSION: githubEvent<WorkflowRunCompletedEvent>((e) => e.workflow_run.conclusion),
      },
      run: `${scriptCommandWithArgs(reconcileRunEndingRef, {
        "display-title": "\${DISPLAY_TITLE}",
        "run-id": "\${RUN_ID}",
        "run-url": "\${RUN_URL}",
        conclusion: "\${CONCLUSION}",
      })}\n`,
    }),
  ]),
).addJob(
  // The scheduled half: the same question, asked of every node that could still be locked,
  // without waiting for an event that never comes. See `lib/stale-sweep.ts` for what it does
  // and `domain/work/stale-lock.ts` for the one judgement it shares with the guard.
  new DefinedJob("sweep", {
    "runs-on": "ubuntu-latest",
    "timeout-minutes": SWEEP_JOB_TIMEOUT_MINUTES,
    // The scheduled half only. A `workflow_run` event has no lock to sweep — the watch above
    // reconciles that run by its own id — and running both would read every labelled node
    // twice for one completion.
    if: JobCondition.of("github.event_name == 'schedule'"),
  }, [
    // The DEFAULT branch head, which is what `github.sha` is on a schedule — the last
    // committed release of this machinery, whose tag vocabulary the sweep has to read.
    new ActionsCheckoutV4({}),
    new SetupBunAction({ name: "Setup Bun" }),
    new TypedOutputsStep({
      name: "Sweep the stale locks",
      shell: "bash",
      env: {
        GH_TOKEN: "${{ github.token }}",
        GITHUB_REPOSITORY: "${{ github.repository }}",
        GITHUB_RUN_ID: "${{ github.run_id }}",
      },
      // No arguments: the script reads the repository and this run's id from the
      // environment, which is where the run itself put them. A value spliced onto the
      // command line here would be the same value typed twice.
      run: `${scriptCommandWithArgs(sweepStaleLocksRef, {})}\n`,
    }),
  ]),
);
