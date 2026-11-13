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
// ## What it does NOT need
//
// A secret. `contents: read` to read the releases and the manifest at the tag,
// `issues: write` to open the notice, and nothing else -- no PAT, no GitHub App, no
// branch protection. That is the whole reason this ships before the sync half of
// the same problem: an upgrade nobody knows about is the first barrier, and it can
// be removed without asking an adopter to configure anything.
//
// ## In this repository it is a no-op
//
// Self-deploy keeps `.github/atomaton-release.json` equal to the latest release, so
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
  // PERMISSIONS`: this run starts no agent, writes no pull request, and dispatches
  // nothing, so none of that token can be spent by it. `actions` is here because
  // every generated workflow declares it and removing it from one file would be a
  // second opinion about the shape -- see the note in that module.
  permissions: { contents: "read", issues: "write" },
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
        },
        run: `${scriptCommandWithArgs(notifyNewReleaseRef, { repo: "\${REPO}" })}\n`,
      }),
    ],
  ).jobs(),
);
