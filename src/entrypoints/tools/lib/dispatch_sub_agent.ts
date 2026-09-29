import { gh } from "../../../adapters/github/gh.ts";
import { isAgentName } from "../../../domain/work/agent-name.ts";
import { getLabel } from "../../../adapters/runner/config.ts";
import { dispatchRunner } from "../../../adapters/actions/dispatch.ts";

export interface DispatchSubAgentResult {
  issue: number;
  agent: string;
}

/**
 * Tags a sub-issue as "launched" and dispatches the runner workflow on it.
 *
 * `dispatchedBy` is the agent starting this run -- the one waiting on its result.
 * It defaults to the current run's own agent (`process.env.AGENT`), which is the
 * caller in every real path: an atomaton launching a sub-agent. Passed through to
 * the runner so the started run knows who to report back to; see
 * `RunnerDispatch.dispatchedBy` for why that name has no other route.
 *
 * ## What this no longer does
 *
 * It used to post its own dispatch comment, and to check the thread for a request that
 * came first. Both moved into `dispatchRunner`, which every path that starts an agent
 * goes through: the comment is the marker the ordering check is written against, and
 * the check is the same question for a sub-issue, a pull request and a parent issue.
 * A guard that each caller has to remember is one the next caller will not have.
 */
export function dispatchSubAgent(issue: number, agent: string, notify = "", dispatchedBy = (process.env.AGENT ?? "").trim()): DispatchSubAgentResult {
  if (!Number.isInteger(issue) || issue <= 0) {
    throw new Error(`issue must be a positive integer, got: ${issue}`);
  }
  if (!isAgentName(agent)) {
    throw new Error(`agent must be a valid lowercase agent name, got: ${agent}`);
  }

  const launchedLabel = getLabel("launched");
  // Create it first, as the in-progress and sub-issue labels already do. Adding a
  // label that does not exist fails, and the failure below is only a warning — but
  // `sibling-check.ts` reads this label to decide whether a sub-issue has already
  // been launched, so silently never applying it makes a child look unlaunched and
  // invites a relaunch.
  gh("label", "create", launchedLabel, "--force", "-c", "1f883d", "-d", "Atomaton has dispatched an agent for this sub-task");
  const { code: labelCode } = gh("issue", "edit", String(issue), "--add-label", launchedLabel);
  if (labelCode !== 0) {
    console.error(`Warning: failed to add '${launchedLabel}' label to #${issue}`);
  }

  // Throws rather than returning quietly: `launch_sub_agent` reports each task's
  // outcome to the atomaton individually, and a swallowed failure would leave a
  // sub-issue that says an agent is working on it while nothing is.
  const outcome = dispatchRunner({
    context: `${agent} was to be started on sub-issue #${issue}`,
    agent,
    type: "issue",
    number: issue,
    notify,
    dispatchedBy,
  });
  if (outcome === "refused-closed") {
    // A sub-issue this run created a moment ago, already closed. Rare, and named
    // separately because "see the workflow log for the gh error" would send the
    // atomaton looking for a failure that did not happen.
    throw new Error(`#${issue} is not open, so ${agent} was not started on it; the issue says so.`);
  }
  if (outcome === "refused-outstanding") {
    // Somebody asked for an agent on this sub-issue before this dispatch reached it.
    // The dispatch marker was removed, and the request that came first stands.
    throw new Error(
      `#${issue} already has an agent asked for on it, so ${agent} was not started. ` +
        "Wait for that run, or comment on the issue yourself.",
    );
  }
  if (outcome !== "dispatched") {
    throw new Error(`could not dispatch ${agent} on sub-issue #${issue}; see the workflow log for the gh error`);
  }

  return { issue, agent };
}