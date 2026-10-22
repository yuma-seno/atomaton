import { Workflow, Step } from "@github-actions-workflow-ts/lib";
import type { IssuesOpenedEvent } from "@octokit/webhooks-types";
import { ActionsCheckoutV4 } from "@github-actions-workflow-ts/actions";
import { JobCondition, SCRIPT_JOB_TIMEOUT_MINUTES, startJob, TypedOutputsStep } from "./actions/base.ts";
import { githubEvent, githubEventRaw, isRepositoryMember } from "./actions/github-context.ts";
import { ATOMATON_WORKFLOW_PERMISSIONS } from "./actions/permissions.ts";
import { scriptCommand } from "./actions/script-call.ts";
import { SetupBunAction } from "./actions/third-party.ts";
import { dispatchToAtomaRunner } from "./atomaton-runner.wac.ts";
import { ref as resolveEntryAgentRef } from "../entrypoints/machinery/resolve_entry_agent.ts";

// Fires when a new issue is opened. Resolves which agent (if any) should
// handle it from the issue body's first line, then hands off to the shared
// atomaton-runner reusable workflow.
//
// Job graph:
//   route --> run (atomaton-runner.yml, reusable)

const resolveStep = new TypedOutputsStep(
  {
    name: "Resolve agent and context",
    id: "resolve",
    shell: "bash",
    env: {
      NUMBER: githubEvent<IssuesOpenedEvent>((e) => e.issue.number),
      SENDER: githubEvent<IssuesOpenedEvent>((e) => e.sender.login),
    },
    run: `${scriptCommand(resolveEntryAgentRef)}\n`,
  },
  ["agent", "number", "type", "notify"] as const,
);

export const atomaEntry = new Workflow("atomaton-entry", {
  name: "Atomaton Entry",
  // The run's own name, carrying the node. The run watch (atomaton-run-watch)
  // triggers on this workflow's completion, and a `workflow_run` event carries no
  // inputs — the display title is how it learns the node. `run-name` is evaluated
  // before any job runs, so the agent the route would choose is not available
  // here, and a title naming this workflow instead ("Atomaton Entry on #N") would
  // read as an agent called "Atomaton Entry" — a name no person could resume with.
  // The title carries the node alone; the watch reads the agent off the thread
  // when its notice needs one.
  "run-name": "#${{ github.event.issue.number }}",
  on: {
    issues: { types: ["opened"] },
  },
  permissions: ATOMATON_WORKFLOW_PERMISSIONS,
}).addJobs(
  startJob(
    "route",
    {
      "runs-on": "ubuntu-latest",
      "timeout-minutes": SCRIPT_JOB_TIMEOUT_MINUTES,
      // Only a repository member's issue starts an agent. An outside contributor
      // may open issues freely; none of them spend model budget or hand an agent
      // instructions from someone without write access.
      if: JobCondition.from(isRepositoryMember(githubEventRaw<IssuesOpenedEvent>((e) => e.issue.author_association))),
      outputs: {
        agent: resolveStep.outputs.agent,
        number: resolveStep.outputs.number,
        type: resolveStep.outputs.type,
        notify: resolveStep.outputs.notify,
      },
    },
    [
      new ActionsCheckoutV4({}),
      // Required by the "Resolve agent and context" step below, which runs
      // resolve_entry_agent.ts via `bun run` -- not preinstalled on
      // GitHub-hosted runners.
      new SetupBunAction({ name: "Setup Bun" }),
      resolveStep,
    ],
  )
    .then((routeJob) => dispatchToAtomaRunner(routeJob, "inherit"))
    .jobs(),
);
