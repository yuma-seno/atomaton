import { Workflow } from "@github-actions-workflow-ts/lib";
import type { GeneratedWorkflowTypes as GWT } from "@github-actions-workflow-ts/lib";
import { ActionsCheckoutV4 } from "@github-actions-workflow-ts/actions";
import { startJob, SCRIPT_JOB_TIMEOUT_MINUTES, TypedOutputsStep } from "./actions/base.ts";
import { scriptCommandWithArgs } from "./actions/script-call.ts";
import { SetupBunAction } from "./actions/third-party.ts";
import { ref as notifyNewReleaseRef } from "../entrypoints/machinery/notify_new_release.ts";

// Tells an adopted repository that a newer release of the template exists.
//
// ## Why this is a schedule
//
// An adopted tree is a copy, and nothing announces that a copy is stale. Every
// other event in this system reacts to something a person or an agent did; this one
// reacts to the absence of that, so there is no event to listen for. The consumer
// this exists for is a repository that has not been touched in weeks -- exactly the
// one where a busy trigger fires nothing.
//
// ## What it needs
//
// `contents: read` to read the releases and the manifest at the tag, `issues: write`
// to open the notice, and `actions: write` to start the update when the repository
// asked for one. No GitHub App and no branch protection -- which is the whole reason
// this ships before the sync half of the same problem: an upgrade nobody knows about
// is the first barrier, and it can be removed without asking an adopter to configure
// anything.
//
// `actions: write` is what makes the dispatch below this run's own doing rather than
// a thing borrowed from a secret, and `workflow_dispatch` is the documented exception
// that runs even when `GITHUB_TOKEN` is what asked for it -- the same shape as every
// other dispatch the machinery makes. It does not widen the gate the update's merge
// waits behind: `checks: write` is absent, so this token cannot produce a check
// result, and the checks that gate the merge are started by the update token's push.
//
// One secret is READ, and only for the project that asked for it: with
// `update.on_new_release` set to `pr` or `pr-agent` the notice dispatches the update
// workflow, and `ATOMATON_UPDATE_TOKEN` is what that run then pushes, opens its pull
// request and merges with -- and what this notice reads an open pull request as,
// since no `pull-requests` is declared here. A token without `Actions` is enough for
// all of that. The secret is empty in a repository that never set it, which is exactly
// the default mode: `issue` reads it, sees nothing, and dispatches nothing.
//
// ## In this repository it is a no-op
//
// Applying a release keeps `.github/atomaton-release.json` equal to the latest release, so
// the comparison finds nothing and the run exits green having written nothing. That
// is the intended state, not a defect, and the script says so in its log.

/**
 * How often an adopter is told.
 *
 * Daily rather than hourly: a release is not an incident, and an hourly run would
 * spend a hundred and sixty-eight more Actions minutes a week to shorten the wait
 * for an announcement by at most a day. Not weekly either — a person who opens
 * their repository on a Monday should not have to wait until Friday to learn there
 * are two releases to take.
 */
const CHECK_CRON = "0 6 * * *";

export const atomaNewRelease = new Workflow("atomaton-new-release", {
  name: "Atomaton New Release",
  on: {
    schedule: [{ cron: CHECK_CRON }],
    // So a person who is about to upgrade can ask now, and so the first run after
    // an adoption does not wait for 06:00 UTC.
    workflow_dispatch: {},
  },
  // The narrowest permission set any generated workflow here declares, and the
  // point of shipping this half first. Constant rather than `ATOMATON_WORKFLOW_-
  // PERMISSIONS`: this run starts no agent and writes no pull request, so none of
  // that token can be spent by it. `actions` is what starts the update workflow it
  // announces, and it is in the same set every other dispatching workflow declares
  // -- `workflow_dispatch` is the exception `GITHUB_TOKEN` can make. `checks: write`
  // stays absent, so nothing here can produce a check result.
  permissions: { contents: "read", issues: "write", actions: "write" },
}).addJobs(
  startJob(
    "notify",
    {
      "runs-on": "ubuntu-latest",
      "timeout-minutes": SCRIPT_JOB_TIMEOUT_MINUTES,
    },
    [
      // The adopted tree, which is where the version to compare FROM lives. The
      // default branch's: a schedule has no other ref, and this repository's own
      // `.github/` is the deployment it should be judging.
      new ActionsCheckoutV4({}),
      new SetupBunAction({ name: "Setup Bun" }),
      new TypedOutputsStep({
        name: "Announce a newer release, if there is one",
        shell: "bash",
        env: {
          GH_TOKEN: "${{ github.token }}",
          // The event's value, carried as an env value rather than spliced into
          // the command: a `${{ }}` expression is substituted into the script text
          // BEFORE bash parses it, so a value that reached here with a quote in it
          // would end the string. `github.repository` cannot, and the argv below is
          // built this way regardless so that the next value to travel this path
          // does not have to be reasoned about again.
          REPO: "${{ github.repository }}",
          // Read, never required: the mode that starts an update is the one that
          // needs it, and `issue` -- the default, and what an unset key means -- is
          // the notice and nothing else. Empty is a value here, not an absence: the
          // script checks it and says so in the notice rather than failing the run.
          ATOMATON_UPDATE_TOKEN: "${{ secrets.ATOMATON_UPDATE_TOKEN }}",
        },
        run: `${scriptCommandWithArgs(notifyNewReleaseRef, { repo: "\${REPO}" })}\n`,
      }),
    ],
  ).jobs(),
);
