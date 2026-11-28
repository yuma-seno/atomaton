/**
 * environment-setup.ts — the one step that makes a project's declared
 * environment exist, for every job that then depends on it.
 *
 * There are three jobs that run a project's own commands: the agent's, the
 * checks, and the deployment. Only the agent's used to run
 * `environment.setup_commands`, so the environment the agent worked in and the
 * environment CI verified in were different machines with different software on
 * them.
 *
 * The consequence was not a broken build, which would at least be legible. It was
 * a build that passes for the agent and fails in CI, and the failure comes back to
 * an engineer who cannot reproduce it -- and to a person who then has to decide,
 * run by run, whether the pull request can work at all.
 *
 * The workaround, which this repository was itself using, is to put the setup at
 * the front of a check's own `commands` — `bun install --frozen-lockfile` before
 * the tests — and remember to keep it in step with
 * `environment.setup_commands`. Two statements of one fact, either of which can
 * be updated alone.
 *
 * So the step is a function rather than three copies of four lines. A job that
 * runs a project's commands includes it; that is the whole rule.
 *
 * ## What each job reads
 *
 * `ATOMATON_MACHINERY_ROOT` decides, and it differs on purpose:
 *
 *   the agent's run    the default branch. A pull request must not choose how the
 *                      agent reviewing it is set up.
 *   checks, tools      the default branch. The commands come from there because a
 *                      pull request must not choose what runs, and the setup is part
 *                      of what runs: an entry that added a dependency would otherwise
 *                      install it into a tree the commands are not allowed to use.
 *                      The one job that works IN the pull request -- the checks that
 *                      named no secret -- points the variable at a second checkout
 *                      instead, so the setup it runs is still the released one while
 *                      the commands it precedes see the change.
 *   deployment         the tag or the default branch, both of them post-merge.
 *
 * ## No credentials
 *
 * Setup runs before any secret enters the environment, in every one of them. That
 * is deliberate in the agent's case -- see the ordering in
 * `atomaton-runner.wac.ts` -- and it falls out of step order in the others: the
 * slot-renaming shell that exports a check's credentials runs after this step.
 */
import { TypedOutputsStep } from "./base.ts";
import { scriptCommand } from "./script-call.ts";
import { ref as runEnvironmentSetupRef } from "../../entrypoints/machinery/run_environment_setup.ts";

/**
 * Runs `environment.setup_commands`, and says so plainly when there are none.
 *
 * A fresh instance per call: a step object belongs to the job it is added to.
 */
export function environmentSetupStep(): TypedOutputsStep {
  return new TypedOutputsStep({
    name: "Run configured environment setup",
    shell: "bash",
    run: `${scriptCommand(runEnvironmentSetupRef)}\n`,
  });
}
