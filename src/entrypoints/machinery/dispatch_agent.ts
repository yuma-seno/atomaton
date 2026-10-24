#!/usr/bin/env bun
/**
 * dispatch_agent.ts — hand work to the next agent, from a workflow step.
 *
 * A workflow step that needs to start an agent used to write its own `gh workflow
 * run atomaton-runner.yml` in bash. Two did — the runner's hand-off to the agent a
 * directive named, and the validation workflow's hand-off to whoever the result
 * called for — and both were invisible to `adapters/actions/dispatch.ts`, which exists to make
 * exactly that impossible. Its header says so:
 *
 * > a guard that each of them has to remember is one the fifth will not have.
 *
 * Those two were the fifth and the sixth. Neither refused a closed target (#827: an
 * atomaton dispatched onto an issue closed eighteen seconds earlier, ran for five
 * minutes and opened a pull request nobody was waiting for), neither wrote the
 * ops-log dispatch entry that `chain_continues` and `shouldReleaseGuard` read, and
 * neither sent `reload_count`, which `dispatchRunner` documents as "always sent, so
 * the input has a value on every path". A workflow step cannot import TypeScript, so
 * this script is how it reaches the one dispatcher.
 *
 * ## What each exit code means
 *
 * - `0` — the run was dispatched, or it was refused: the target is not open, already
 *   has an agent asked for on it, or the wait the dispatch was answering had already
 *   resolved (`superseded` — refused quietly, because the thread already holds the
 *   judgement a notice would restate). A refusal is not a fault: nothing is running,
 *   and a person who needs telling has been told on the target itself. Failing the
 *   step here would report the refusal as a broken workflow.
 * - `1` — GitHub rejected the dispatch, or the arguments were not usable. Nothing is
 *   running and nothing will retry, which is worth failing the job over.
 *
 * Usage:
 *   dispatch_agent.ts --agent reviewer --number 12 --type pr \
 *     --context "CI passed on #12, so reviewer was to review it"
 */
import { parseArgs } from "node:util";
import { isAgentName } from "../../domain/work/agent-name.ts";
import { isNodeType } from "../../domain/work/node-type.ts";
import { dispatchRunner } from "../../adapters/actions/dispatch.ts";
import { applyTurnLabels } from "./lib/turn-labels.ts";
import { isTrue } from "./lib/flags.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface DispatchAgentArgs {
  /** The agent to start. Validated here, because it usually comes from another agent's output. */
  agent: string;
  /** The issue or pull request number to start it on. */
  number: string | number;
  /** `issue` or `pr`. */
  type: string;
  /** Who to mention; empty when nobody asked for this run. */
  notify?: string;
  /** `owner/name`, when the step's checkout is not the target repository. */
  repo?: string;
  /**
   * Whether this dispatch takes up a request already in the thread.
   *
   * Validation sets it: the run it starts fulfils the request the pull request
   * carries, so the thread's last turn-changing event is that request — this
   * dispatch's own. Without it the outstanding-request check would read the request
   * as somebody else's and refuse the one dispatch that should happen. The claim is
   * verified in `dispatchRunner` (#283): the dispatch goes out only while the thread
   * still waits for it.
   *
   * A hand-off does not set it: the agent that named the next one is not answering a
   * request, it is making one.
   */
  "answers-request"?: string;
  /**
   * This run's own id, when the dispatch continues its chain (#194).
   *
   * The runner's hand-off step passes `github.run_id`. With it, a refusal that ends
   * the chain — closed target, unconfirmable marker, GitHub rejecting the call —
   * writes `ended=refused answers=<ask> run=<this run>` on the refusal notice and
   * releases the node: the thread's newest word stops being "a hand-off", which
   * `runInFlight` reads as a run working or coming, forever. Without it, the refusal
   * stays a plain notice and the thread keeps whatever state it had.
   */
  "run-id"?: string;
  /**
   * The ask comment id this dispatch's run should claim (#285), and what the
   * answers-request check verifies the wait against.
   *
   * Required with `answers-request`: the person's command comment for validation,
   * the hand-off comment the reload just wrote, the `waiting` ending that opened the
   * pull request. A marker dispatch omits it and the marker it posts becomes the ask.
   */
  ask?: string;
  /**
   * Whether the verdict this dispatch rides on judged the work `passed` — for
   * validation, of the verdict its check runs were written from.
   *
   * Read only by the answers-request check, and only when the thread's last event is
   * a `returned` verdict of the agent being dispatched: a passed verdict confirms
   * that verdict (so the dispatch would re-deliver a judgement the thread already
   * holds, and is refused), a failed one refutes it (the engineer's "done" was wrong
   * about its own push, and the retry must go). Validation always passes it, in both
   * directions; left off, the standing verdict is treated as unrefuted.
   */
  "verdict-passed"?: string;
  /**
   * What was about to happen, in the caller's words.
   *
   * Not decoration: it is the sentence a person reads in the refusal notice when the
   * target turns out to be closed (`dispatchRefusedNotice`), and the prefix on both
   * log lines. Written at the call site because only the call site knows why.
   */
  context: string;
}

export const ref = defineScript<DispatchAgentArgs>(import.meta.url);

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      agent: { type: "string" },
      number: { type: "string" },
      type: { type: "string" },
      notify: { type: "string" },
      repo: { type: "string" },
      ask: { type: "string" },
      "run-id": { type: "string" },
      "answers-request": { type: "string" },
      "verdict-passed": { type: "string" },
      context: { type: "string" },
    },
  });

  const agent = (values.agent ?? "").trim();
  const number = Number((values.number ?? "").trim());
  const type = (values.type ?? "").trim();
  const context = (values.context ?? "").trim();

  // Checked here rather than in the step's bash, where it was a copy of
  // `AGENT_NAME_PATTERN` spliced into a regex. A name that is not one cannot start a
  // run, and saying which of the three is wrong is cheaper than a dispatch that
  // fails at GitHub with "workflow not found".
  if (!isAgentName(agent)) {
    console.error(`::error::dispatch_agent: '${agent}' is not an agent name, so nothing was dispatched.`);
    process.exit(1);
  }
  if (!isNodeType(type)) {
    console.error(`::error::dispatch_agent: --type must be 'issue' or 'pr', not '${type}'.`);
    process.exit(1);
  }
  if (!Number.isInteger(number) || number <= 0) {
    console.error(`::error::dispatch_agent: --number must be a positive number, not '${values.number ?? ""}'.`);
    process.exit(1);
  }
  if (!context) {
    console.error("::error::dispatch_agent: --context is required; it is what a person reads if this is refused.");
    process.exit(1);
  }

  // The chain identity this dispatch carries (#194): `--ask` names the ask the
  // successor was to claim, and `--run-id` names the run that made the promise —
  // the runner's hand-off names its result comment, validation names the request
  // the pull request carries. Both must be known for a refusal to write an honest
  // `ended=refused`; a caller that names neither — the aggregation, whose
  // re-invocation of a parent holds no promise open — gets the plain refusal
  // notice, the right shape for a thread this dispatch does not hold open.
  const runId = Number(values["run-id"]);
  const askId = Number(values.ask);
  const refusalEnding =
    Number.isInteger(runId) && runId > 0 && Number.isInteger(askId) && askId > 0
      ? { answers: askId, run: runId }
      : undefined;

  const outcome = dispatchRunner({
    context,
    agent,
    type,
    number,
    notify: values.notify ?? "",
    repo: (values.repo ?? "").trim() || undefined,
    // The ask this dispatch's run should claim (#285). An answers-request dispatch
    // requires one — `dispatchRunner` refuses without it — and a marker dispatch is
    // content to let the marker it just posted be the ask.
    ask: (values.ask ?? "").trim() || undefined,
    answersRequest: isTrue(values["answers-request"]),
    verdictPassed: values["verdict-passed"] === undefined ? undefined : isTrue(values["verdict-passed"]),
    // The chain identity a hand-off carries (#194): the refusal that ends the chain
    // writes `ended=refused` answering the ask the successor was to claim, with this
    // run's id on it. Both ids must be known for the ending to be honest; a caller
    // that names neither (the aggregation, which holds no promise open) gets the
    // plain refusal notice, which is the right shape for a thread that is not held
    // open by this promise.
    refusalEnding,
  });

  // The chain is over: the ending on the thread says the turn came back, and the
  // labels move with it — the in-progress guard comes off and the
  // waiting-for-person label goes on (#223). Nothing else removes them: the run's
  // own release step ran before the dispatch and held the label because the turn
  // said `handoff`.
  if (refusalEnding !== undefined && (outcome === "refused-closed" || outcome === "unconfirmed" || outcome === "failed")) {
    applyTurnLabels("with-person", values.repo ?? "", String(number));
  }

  if (outcome === "failed") {
    console.error(`::error::Could not dispatch ${agent} on ${type} #${number}.`);
    process.exit(1);
  }
  if (outcome === "unconfirmed") {
    console.error(
      `::error::Could not confirm the dispatch marker on ${type} #${number}, so ${agent} was not started; ` +
        "the thread may not have caught up with the marker. Retry shortly.",
    );
    process.exit(1);
  }
}

if (import.meta.main) main();
