import { Workflow } from "@github-actions-workflow-ts/lib";
import { ActionsCheckoutV4 } from "@github-actions-workflow-ts/actions";
import { startJob, SCRIPT_JOB_TIMEOUT_MINUTES, TypedOutputsStep } from "./actions/base.ts";
import { scriptCommandWithArgs } from "./actions/script-call.ts";
import { SetupBunAction } from "./actions/third-party.ts";
import { ref as updateAtomatonRef } from "../entrypoints/machinery/update_atomaton.ts";

// Take a newer template release onto this tree — the doing half of the machinery
// the notice serves.
//
// ## The two ways in
//
// The Actions tab's Run workflow button is the person standing there; a `!upgrade`
// comment on the notice (or any thread) dispatches this workflow with the thread's
// number, so the update answers where it was asked. Either way the run is the same
// script (`update_atomaton.ts`), which plans, applies, opens its pull request and
// either merges it once the repository's checks have passed or stops at it.
//
// ## Why the update token is a secret the owner sets
//
// The branch the update pushes must run this repository's checks, and a push made
// with this workflow's own token deliberately runs none — so a merge gated on those
// checks would gate on nothing. `ATOMATON_UPDATE_TOKEN` is a token with `repo` and
// `workflow` scope that the owner adds once, the second because the release ships
// workflows and GitHub refuses a push that updates one without it; when it is
// missing the run fails loudly and changes nothing, because the person who started
// it is standing there and silence is not an answer. It is also the identity the
// pull request is opened and merged as -- GitHub starts no `pull_request` run for a
// pull request this workflow's token opened, and no `push` for a merge it made, and
// the check the ruleset requires and the deploy the merge chains to are exactly
// those events. See `update_atomaton.ts`'s own comment for the whole argument.
//
// ## One update at a time
//
// Two updates running together would push the same branch from two checkouts and
// race the pull request. The group is one and never cancels: a run that waited is
// not a run that was wrong, and cancelling mid-apply would leave a tree holding
// half a plan.
export const atomaUpdate = new Workflow("atomaton-update", {
  name: "Atomaton Update",
  on: {
    workflow_dispatch: {
      inputs: {
        // The thread a `!upgrade` came from, as a number. Empty from the button:
        // the run then reports only where the machinery reports anyway — the pull
        // request and, when one stands open, the notice.
        source: {
          description: "Issue or pull request to answer. Leave empty when starting from here.",
          required: false,
          type: "string",
        },
      },
    },
  },
  // Narrower than ATOMATON_WORKFLOW_PERMISSIONS and deliberately so. `pull-requests`
  // is what editing the update's pull request needs; `issues` is the notice it
  // answers and closes; `checks: read` is the rollup and watch its merge waits
  // behind -- a private repository refuses that read to a job without it, and the
  // refusal would land in the WARN branch, a pull request left standing instead of
  // an error; `contents: read` is the checkout and the releases it reads. The writes
  // that decide anything -- the push, the pull request's opening, the merge -- travel
  // under the update token, which this workflow's permission block neither grants
  // nor limits. That is the point: the checks the merge is gated on are started by
  // the token's identity, so this workflow's own permissions cannot widen the gate.
  //
  // `actions` is here for the one dispatch this run makes: with
  // `update.on_new_release: pr-agent` it starts `agents.on_update_conflict` on the
  // pull request that stopped on a conflict. That is not a way around the paragraph
  // above: `checks: write` stays absent, so this token cannot make a check result,
  // while the checks the merge waits on are started by the update token's push.
  permissions: { contents: "read", issues: "write", "pull-requests": "write", checks: "read", actions: "write" },
  concurrency: { group: "atomaton-update", "cancel-in-progress": false },
}).addJobs(
  startJob(
    "update",
    {
      "runs-on": "ubuntu-latest",
      // The update's own budget, not the shared five: a clean application waits
      // for the repository's checks before it merges, and the check's own path
      // (plan job, dispatched check, matrix) is minutes on its own. A job killed
      // mid-wait would also kill the notice close that follows.
      "timeout-minutes": 60,
    },
    [
      // The tree the update lands on: the default branch. The checkout's own
      // token stays configured in git, but the update never pushes with it — the
      // script builds the push URL from the update token itself, so the token
      // GitHub gave this run cannot create a branch even in principle.
      new ActionsCheckoutV4({}),
      new SetupBunAction({ name: "Setup Bun" }),
      new TypedOutputsStep({
        name: "Take the newest release onto this tree",
        shell: "bash",
        env: {
          GH_TOKEN: "${{ github.token }}",
          ATOMATON_UPDATE_TOKEN: "${{ secrets.ATOMATON_UPDATE_TOKEN }}",
          REPO: "${{ github.repository }}",
          SOURCE: "${{ inputs.source }}",
        },
        run: `${scriptCommandWithArgs(updateAtomatonRef, { repo: "\${REPO}", source: "\${SOURCE}" })}\n`,
      }),
    ],
  ).jobs(),
);
