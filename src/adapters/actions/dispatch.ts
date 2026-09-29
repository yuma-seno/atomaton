/**
 * dispatch.ts — start an agent run by dispatching the runner workflow.
 *
 * Four places hand work to another agent: an atomaton launching sub-agents,
 * a created PR summoning its reviewer, a merged PR re-invoking the agent that
 * opened it, and the aggregation gate re-invoking an atomaton once its
 * sub-issues are done. Each had built its own `gh workflow run` call, and the
 * copies had diverged in the two ways that matter.
 *
 * They disagreed on how the workflow is named -- `||`, `??`, a hardcoded
 * string, and a per-call option nothing ever passed.
 *
 * More seriously, two of them ignored the exit code and wrote the ops-log
 * dispatch entry unconditionally. That entry is not bookkeeping: it is the
 * signal `atomaton-runner`'s `chain_continues` output reads to decide whether work
 * is still in flight, and a hand-off keeps the `atomaton/in-progress`
 * label held whenever it is set. So a dispatch that failed -- a bad token, a
 * renamed workflow, a rate limit -- reported a chain that had started when none
 * had, and left the issue locked with nothing on the way to unlock it.
 *
 * Binding the two together here is the point of this module: the ops-log entry
 * is written if and only if GitHub accepted the dispatch, and it cannot be
 * forgotten by the next call site added.
 *
 * The same argument put the closed-target guard here. #803 was closed by hand while
 * its sub-issues were finishing, and eighteen seconds later the aggregation gate
 * dispatched an atomaton onto it -- which ran for five minutes and opened a pull
 * request nobody was waiting for. None of the four call sites looked at the state of
 * the number it was dispatching onto, and a guard that each of them has to remember is
 * one the fifth will not have. See #827.
 */
import { dispatchWorkflow, gh } from "../../adapters/github/gh.ts";
import { logDispatch } from "../../adapters/runner/ops-log.ts";
import { readTargetState } from "../../adapters/github/target-state.ts";
import { requestOutstandingOn } from "../../adapters/github/whose-turn.ts";
import { DISPATCH_TAG, LLM_CONTEXT_TAG } from "../../adapters/github/tags.ts";
import { dispatchRefusedNotice, mayStartWorkOn, type TargetState } from "../../domain/work/closed-issue.ts";

/** The reusable workflow every agent run enters through. */
function runnerWorkflow(): string {
  return process.env.ATOMATON_DISPATCH_WORKFLOW || "atomaton-runner.yml";
}

export interface RunnerDispatch {
  /**
   * Prefixes both log lines, so a failure names who was dispatching and why.
   * Carry the detail here -- "re-invoking engineer on #12 to confirm and close"
   * -- rather than leaving it to the generic message.
   */
  context: string;
  agent: string;
  type: "issue" | "pr";
  number: number | string;
  /** Omit or leave empty when there is nobody to mention; a silent run is normal. */
  notify?: string;
  /**
   * Pass when the caller's working directory is not a checkout of the target
   * repository. The MCP servers run inside one and so may omit it; a helper
   * called from an arbitrary job should not assume that.
   */
  repo?: string;
  /**
   * How many environment rebuilds this work has already had, for the run being
   * started to carry forward.
   *
   * Passed as a workflow input rather than counted from anywhere, because a reload
   * leaves nothing behind to count -- unlike a handoff, which leaves a comment
   * (see `domain/work/dispatch-chain.ts`). The tally has to travel with the dispatch or
   * it does not exist.
   *
   * Omitted by every other caller, which is correct: dispatching for any other
   * reason starts the count again, because the new run is not the result of a
   * rebuild.
   */
  reloadCount?: number;
  /**
   * The agent that started this run, so the run knows who to report back to.
   *
   * A run is started by a person, by another agent, or by the machinery. When it
   * is another agent, that agent is the one waiting on the result -- and the run
   * has no other way to learn its name: the dispatch comment names the agent being
   * STARTED, never the one starting it. So an engineer dispatched by an atomaton
   * could not tell that an atomaton was waiting, and ended with a plain comment on
   * its own sub-issue instead of reporting back.
   *
   * Omitted when a person or the machinery started the run, which is the honest
   * answer: there is no agent to report to, and the prompt says so.
   */
  dispatchedBy?: string;
  /**
   * Whether this dispatch continues work already in flight, rather than starting a
   * turn somebody asked for.
   *
   * One caller sets it: `reload_environment`, where the agent running right now is
   * restarting itself. The thread's last turn-changing event is the command that
   * started that very run, so the outstanding-request check below would read the
   * reload as a second request and refuse it. It is not one — it is the same turn,
   * continued — so the check is skipped.
   *
   * Omitted everywhere else, which is the honest default: a dispatch that is not a
   * continuation is a new turn, and a new turn must not start on a node that already
   * has one.
   */
  continues?: boolean;
  log?: (message: string) => void;
}

/**
 * What a dispatch did, as three answers rather than two.
 *
 * It used to be a boolean, and `false` already meant two things once this module
 * started refusing closed targets: GitHub rejected the call, or the target was in no
 * state to receive one. Only the first is a fault, only the second has a person
 * already being told, and a caller that cannot tell them apart reports the wrong one.
 * The same lesson `DispatchGateResult` in `aggregation.ts` was written down for.
 */
export type DispatchOutcome =
  /** GitHub accepted it and the ops-log entry is written. */
  | "dispatched"
  /** The target is closed, or its state could not be read. Nobody was dispatched, and the escalation is posted. */
  | "refused-closed"
  /** A request for an agent was already outstanding on the target. Nobody was dispatched, and the marker is removed. */
  | "refused-outstanding"
  /** GitHub rejected the dispatch. Nothing is running and nothing will retry. */
  | "failed";

/**
 * Refuse to start an agent on a target that is not open, and say what will not happen.
 *
 * Here rather than at the four call sites, for the reason this module exists: each of
 * them built its own `gh workflow run` and the copies diverged. A guard that has to be
 * remembered is one the fifth caller will not have.
 *
 * The notice goes on the target itself, because that is where somebody looking for
 * this work will look, and a closed issue is still readable. `notify` carries whoever
 * asked for the run -- see `adapters/github/notify.ts`, which settles that question for every path
 * that starts one.
 */
function refuseClosedTarget(d: RunnerDispatch, state: TargetState): "refused-closed" {
  const log = d.log ?? ((message: string) => console.error(message));
  const body = dispatchRefusedNotice({
    agent: d.agent,
    number: Number(d.number),
    context: d.context,
    state,
    notify: d.notify ?? "",
  });
  const { code, stdout, stderr } = gh(
    "issue", "comment", String(d.number), ...(d.repo ? ["--repo", d.repo] : []), "--body", body,
  );
  // A warning rather than a throw: the refusal stands either way, and the caller has
  // its own way of reporting. What is lost is the person being told, which is worth a
  // line in the log that says so rather than an exception that hides the refusal.
  if (code !== 0) {
    log(`${d.context}: refused to dispatch onto #${d.number} (not open), and could not post the notice: ${stderr || stdout}`);
  } else {
    log(`${d.context}: refused to dispatch onto #${d.number} (not open); notice posted`);
  }
  return "refused-closed";
}

/**
 * Post the marker that says this node has been handed to an agent, and return its id.
 *
 * The marker is what makes the ordering check below possible: it is the "asked" event
 * this dispatch writes, so a request that came BEFORE it is one nobody has taken up.
 * It is also the record a person reads — the same line the runner used to post on a
 * pull request, now posted for every node and every path, because the check needs it
 * everywhere.
 *
 * Returns `undefined` when it could not be posted. That is not fatal on its own — the
 * dispatch can still go out — but the ordering check cannot run without it, so the
 * caller decides.
 */
function postDispatchMarker(d: RunnerDispatch): string | undefined {
  const log = d.log ?? ((message: string) => console.error(message));
  const body =
    `${LLM_CONTEXT_TAG.write("exclude")}\n${DISPATCH_TAG.write(d.agent)}\n` +
    `Atomaton: \`${d.agent}\` starting on this ${d.type === "pr" ? "pull request" : "issue"}.`;
  const { code, stdout, stderr } = gh(
    "api",
    `repos/${d.repo ?? "{owner}/{repo}"}/issues/${d.number}/comments`,
    "--method",
    "POST",
    "-f",
    `body=${body}`,
    "--jq",
    ".id",
  );
  if (code !== 0) {
    log(`${d.context}: could not post the dispatch marker on #${d.number}: ${stderr || stdout}`);
    return undefined;
  }
  return stdout.trim();
}

/**
 * Refuse a dispatch when a request for an agent is already outstanding on the target.
 *
 * A node holds one turn. A person's command, or a marker from a dispatch that already
 * went out, is a request — and if the last turn-changing event in the thread is one of
 * those, nobody has taken it up, so this dispatch would be a second run on a node that
 * already has one. Two agents, two comments, one issue.
 *
 * The marker posted just above is excluded from the read, so the question is what came
 * BEFORE this dispatch. When the answer is "a request", the marker is removed: it was
 * the second one, and leaving it would make the thread say two agents were asked for.
 *
 * A read that fails refuses too. The alternative is dispatching a second agent because
 * GitHub was briefly unreachable, which is the failure this exists to prevent.
 *
 * Returns the refusal, or `undefined` when the dispatch may proceed.
 */
function refuseOutstandingRequest(d: RunnerDispatch, markerId: string | undefined): "refused-outstanding" | undefined {
  const log = d.log ?? ((message: string) => console.error(message));
  const removeMarker = (): void => {
    if (markerId === undefined) return;
    gh("api", "--method", "DELETE", `repos/${d.repo ?? "{owner}/{repo}"}/issues/comments/${markerId}`);
  };

  let outstanding: boolean;
  try {
    outstanding = requestOutstandingOn(d.repo ?? "", d.number, markerId);
  } catch (e) {
    removeMarker();
    log(`${d.context}: could not read the thread on #${d.number}, so ${d.agent} was not started: ${e}`);
    return "refused-outstanding";
  }
  if (!outstanding) return undefined;

  removeMarker();
  log(
    `${d.context}: #${d.number} already has an agent asked for on it, so ${d.agent} was not started; ` +
      "the dispatch marker was removed",
  );
  return "refused-outstanding";
}

/**
 * Dispatch the runner, unless the target is not open or already has a turn.
 *
 * Callers that have a fallback (closing an issue directly rather than asking an agent
 * to) branch on the outcome; callers that do not should at least not treat anything
 * but `"dispatched"` as success.
 */
export function dispatchRunner(d: RunnerDispatch): DispatchOutcome {
  const state = readTargetState(d.number, d.repo);
  if (!mayStartWorkOn(state)) return refuseClosedTarget(d, state);

  // The marker goes out before the check, so the check has something to be ordered
  // against. A continuation (`continues`) skips both: it is the same turn, not a new
  // request, and the thread's last event is the command that started the run it is
  // continuing.
  if (!d.continues) {
    const markerId = postDispatchMarker(d);
    const refusal = refuseOutstandingRequest(d, markerId);
    if (refusal !== undefined) return refusal;
  }

  const args = [
    ...(d.repo ? ["--repo", d.repo] : []),
    "--field", `agent=${d.agent}`,
    "--field", `number=${d.number}`,
    "--field", `type=${d.type}`,
    "--field", `notify=${d.notify ?? ""}`,
    // Always sent, so the input has a value on every path rather than defaulting in
    // one place and being absent in another.
    "--field", `reload_count=${d.reloadCount ?? 0}`,
    // Empty when a person or the machinery started the run -- see `dispatchedBy`.
    "--field", `dispatched_by=${d.dispatchedBy ?? ""}`,
  ];
  if (!dispatchWorkflow(d.context, runnerWorkflow(), args, d.log)) return "failed";
  logDispatch(d.type, d.agent, { number: Number(d.number) });
  return "dispatched";
}
