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
import { nodeNumber } from "../runner/run-node.ts";
import { readTargetState } from "../../adapters/github/target-state.ts";
import { checkDispatchMarker, isAskSuperseded, type MarkerCheck } from "../../adapters/github/thread.ts";
import { DISPATCH_TAG, LLM_CONTEXT_TAG } from "../../adapters/github/tags.ts";
import { dispatchRefusedNotice, dispatchUnconfirmedNotice, mayStartWorkOn, type TargetState } from "../../domain/work/closed-target.ts";

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
   * The ask comment id this dispatch's run should claim when it starts (#285).
   *
   * The second half of the turn's identity on the wire: the runner writes
   * `atomaton:took=<ask> run=<run>` from this, and the ending it eventually writes
   * names the same ask back. What it is depends on the dispatch:
   *
   *   - a dispatch that posts a marker: the marker's own comment id, which
   *     `postDispatchMarker` returns — the marker IS the ask this run takes up
   *     (the marker kept as the intent, the claim as the start, decision #285);
   *   - an answers-request dispatch: the ask it fulfils, which the caller names —
   *     the person's command comment for validation, the hand-off comment
   *     `reload_environment` just wrote, the `waiting` ending that opened the pull
   *     request. Required there: an answers-request dispatch that names no ask has
   *     nothing to verify its wait against, and is refused rather than sent.
   *
   * A run started by a new issue's body has no ask comment (the body is not one),
   * and is started by the reusable-workflow call rather than this dispatcher — its
   * `ask` input stays empty and it writes no claim.
   */
  ask?: number | string;
  /**
   * Whether this dispatch takes up a request already in the thread, rather than
   * starting a turn nobody asked for.
   *
   * The claim is the caller's; the verification lives here (`refuseSupersededAsk`
   * below). Two callers set it, and both would otherwise be refused by the
   * outstanding-request check for the same reason: the thread's last turn-changing
   * event is a request, and that request is this dispatch's own.
   *
   *   - `reload_environment`: the agent running right now is restarting itself, so
   *     the request is the command that started that very run. It posts its handoff
   *     comment first, passes its id as `ask` (the run claims it) and as
   *     `freshnessProbeId` (the check sees it before it judges).
   *   - validation: the dispatch fulfils the request the pull request carries — the
   *     command a person typed, or the reviewer line `create_pr` wrote. The check is
   *     what keeps that premise honest: CI can hold the dispatch for minutes, and the
   *     thread it lands on is the one that exists at the end of the wait, not the one
   *     the caller saw at the start. A ball that moved in the meantime — a hand-off
   *     that already ran the reviewer, a verdict already on the thread, a newer ask
   *     still open — is read off the quoted ask's own identity (#285), not guessed
   *     from which event happens to be newest.
   *
   * Omitted everywhere else, which is the honest default: a dispatch that is not
   * taking up a request is a new turn, and a new turn must not start on a node that
   * already has one.
   */
  answersRequest?: boolean;
  /**
   * A comment this dispatch's caller wrote moments before asking to be dispatched,
   * which the answers-request check must be able to see before it judges the thread —
   * the freshness probe, the same instrument the marker is for the ordering check
   * (`MarkerCheck`).
   *
   * `reload_environment` passes the handoff comment it posts immediately before
   * dispatching: until that comment is visible, the read may still predate the write
   * the `handed-off` answer rests on, and refusing on it would break the reload over
   * read-after-write lag. A comment that never posted leaves no id, and the check
   * then judges the thread as it stands — which refuses, rightly, because the
   * handoff the claim rests on is not in it. Validation has no such write — its
   * thread was last touched minutes ago — and passes nothing, which reads once.
   *
   * Omitted everywhere else. Only an answers-request dispatch has a claim about the
   * thread's present state to verify, and only one of those has just written to it.
   */
  freshnessProbeId?: number | string;
  /**
   * Whether the verdict this dispatch rides on judged the work `passed` — for
   * validation, `contextsPassed` of the verdict it wrote the checks from; for every
   * other caller, unsupplied.
   *
   * The answers-request check reads it in one place only: the thread's last event is a
   * `returned` verdict of the agent being dispatched. That verdict is then the
   * thread's newest word on the work, and what the caller judged decides whether it
   * still stands — a green run confirms it, and dispatching the same agent again would
   * re-deliver a judgement the thread already holds (#282); a red one refutes it, and
   * the engineer's "done" was wrong about its own push, so the retry must go. The
   * thread cannot carry this: a verdict comment does not name the commit it judged.
   * Unsupplied, the standing verdict is treated as unrefuted — the conservative
   * reading, and the one that keeps #282's refusal for a caller that forgot the fact.
   *
   * A `returned` from another agent never reaches this field: the fix push that
   * answers a reviewer's directive ends `returned` with the engineer's name on it, and
   * the reviewer it routes to has not spoken on that work at all.
   */
  verdictPassed?: boolean;
  /**
   * This dispatch is the run's own conclusion continuing the chain — on another node.
   *
   * The default classification compares the target with the node the run sits on:
   * onto it moves the turn on, under it starts work and leaves the node waiting. One
   * dispatch fits neither: a merged pull request's re-invocation of the issue it
   * delivers. The run sits on the pull request, the run it wakes sits on the parent
   * issue, and the dispatch is not work under the pull request — it IS the pull
   * request's outcome. The caller knows that; no node comparison can recover it. So
   * the caller says so, the op is logged as `dispatch`, and `chain_continues` — which
   * reads that op — stays true: the merged pull request's result comment must not
   * claim that nothing runs next while a run has just been started.
   *
   * Before the node env was renamed (#259) the comparison stumbled into this by
   * accident: the env then held the session's canonical issue, which on a pull
   * request run is exactly the parent the dispatch wakes.
   *
   * Set by `dispatchPostMergeAgent` and by `merge_pr`'s close-directly fallback;
   * nowhere else.
   */
  continuesChain?: boolean;
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
  /**
   * The dispatch marker could not be confirmed in the thread, so the ordering check
   * could not be trusted. Nobody was dispatched, and a notice is posted.
   *
   * Separate from `failed`, which is GitHub rejecting the dispatch itself. This is the
   * read side: the marker was posted but never became visible, so a second dispatch
   * could not be ruled out and starting one would risk two runs on one node.
   */
  | "unconfirmed"
  /**
   * The wait this dispatch was answering had already resolved, or the thread could not
   * be read well enough to rule that out. Nobody was dispatched, nothing is posted,
   * and no marker was written — the answers-request dispatch makes no marker to take
   * back.
   *
   * Quiet on purpose, which is what separates it from every other refusal here. In the
   * resolved case the thread already holds the judgement the dispatch would have
   * produced — a reviewer has reviewed, a run has handed the ball back — so a notice
   * would restate what a person can read above it and make the newest judgement harder
   * to find, which is the second half of the harm #283 reports. In the unreadable case
   * there is nobody whose attention the refusal needs: the caller decides what a
   * refused reload or a refused validation means, and both have a path for it. One log
   * line is the whole account, either way.
   */
  | "superseded"
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
 * ## Why the marker is confirmed before the check is trusted
 *
 * GitHub does not guarantee read-after-write: a comment can be missing from the listing
 * for a moment after it is created. The check reads the thread to see whether ANOTHER
 * dispatch's marker is there — and if this dispatch's own marker is not visible yet, the
 * read has not caught up, so another's may be missing too. Two dispatches racing would
 * then both see "no request" and both start a run, which is exactly what this exists to
 * prevent.
 *
 * So the marker is a freshness probe: read the thread, and if the marker is not there,
 * wait and read again. Once the marker is visible the read has caught up at least to
 * this dispatch's own write, and a write that happened before it is very likely visible
 * too. This is a heuristic, not a guarantee — but it is strictly better than reading
 * once and hoping.
 *
 * ## When the marker never appears
 *
 * The post itself may have failed, so it is retried a few times. If it still never
 * appears, the ordering check cannot be trusted and nobody is dispatched: a notice is
 * posted and the outcome is `unconfirmed`. Starting a run on an unverified thread is the
 * failure this whole function exists to prevent, so the cautious answer is to stand down.
 *
 * A read that fails refuses too, for the same reason.
 *
 * Returns the refusal, or `undefined` when the dispatch may proceed.
 */
function refuseOutstandingRequest(d: RunnerDispatch, markerId: string | undefined): "refused-outstanding" | "unconfirmed" | undefined {
  const log = d.log ?? ((message: string) => console.error(message));
  // The repository as a `gh` path segment, the same way `postDispatchMarker` writes it.
  // A caller that did not name one (the runner's own hand-off, via `dispatch_agent.ts`)
  // used to get `""` here and `"{owner}/{repo}"` there -- so the marker POST succeeded
  // against the checkout's repository while every READ went to `repos//issues/...` and
  // came back 404. The dispatch then reported `refused-outstanding`, which is the one
  // answer that looks benign: the log says the node already had an agent asked for it,
  // and no run is started. `gh` fills the placeholder in from the checkout, which is
  // the same repository the POST reached.
  const repoPath = d.repo ?? "{owner}/{repo}";
  const removeMarker = (): void => {
    if (markerId === undefined) return;
    gh("api", "--method", "DELETE", `repos/${repoPath}/issues/comments/${markerId}`);
  };

  // No marker means the ordering check has nothing to be ordered against, so it cannot
  // run. The dispatch still goes out -- the marker failing to post is not fatal on its
  // own -- but the check is skipped rather than guessed at.
  if (markerId === undefined) return undefined;

  // Widening, like `ghRead`: the point is to outlast a lag, not to sit out an outage.
  // A run holds a runner while this sleeps, so the total is bounded.
  const delays = [1_000, 2_000, 4_000];
  let check: MarkerCheck | undefined;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      check = checkDispatchMarker(repoPath, d.number, markerId);
    } catch (e) {
      removeMarker();
      log(`${d.context}: could not read the thread on #${d.number}, so ${d.agent} was not started: ${e}`);
      return "refused-outstanding";
    }
    if (check.markerVisible) break;
    const delay = delays[attempt];
    if (delay === undefined) break;
    log(`${d.context}: the dispatch marker on #${d.number} is not visible yet; waiting ${delay}ms and reading again`);
    Bun.sleepSync(delay);
  }

  if (check === undefined || !check.markerVisible) {
    // The marker never became visible. The post may have failed, so try once more before
    // giving up -- a second post is safe, because the first is not in the thread.
    const reposted = postDispatchMarker(d);
    if (reposted !== undefined) {
      try {
        if (checkDispatchMarker(repoPath, d.number, reposted).markerVisible) {
          // The repost is visible, so the thread has caught up. The first marker, if it
          // exists at all, is a duplicate of this one -- remove it so the thread does not
          // say two agents were asked for.
          removeMarker();
          return undefined;
        }
      } catch (e) {
        log(`${d.context}: could not read the thread on #${d.number} after reposting the marker: ${e}`);
      }
      gh("api", "--method", "DELETE", `repos/${repoPath}/issues/comments/${reposted}`);
    }
    log(
      `${d.context}: the dispatch marker on #${d.number} never became visible, so the ordering check could not be trusted ` +
        `and ${d.agent} was not started`,
    );
    const body = dispatchUnconfirmedNotice({
      agent: d.agent,
      number: Number(d.number),
      context: d.context,
      notify: d.notify ?? "",
    });
    const { code, stdout, stderr } = gh(
      "issue", "comment", String(d.number), ...(d.repo ? ["--repo", d.repo] : []), "--body", body,
    );
    if (code !== 0) {
      log(`${d.context}: could not post the unconfirmed notice on #${d.number}: ${stderr || stdout}`);
    }
    return "unconfirmed";
  }

  if (!check.outstanding) return undefined;

  removeMarker();
  log(
    `${d.context}: #${d.number} already has an agent asked for on it, so ${d.agent} was not started; ` +
      "the dispatch marker was removed",
  );
  return "refused-outstanding";
}

/**
 * Refuse an answers-request dispatch whose ask has already been answered or
 * superseded — the comparison that replaced the wait's shape-and-time guess (#285).
 *
 * `answersRequest` claims the thread still waits for what this dispatch delivers.
 * Like every claim this module acts on, it is verified here rather than trusted: CI
 * can hold a validation for minutes, and the thread it lands on is the one that exists
 * at the END of the wait. #283 is what skipping the verification cost: while the
 * validation polled CI, a hand-off ran the reviewer, that reviewer reviewed and gave
 * the ball back to a person — and five minutes after the ball had settled, the
 * validation dispatched the same reviewer onto the same head.
 *
 * ## The rule
 *
 * The dispatch names the ask it fulfils (`ask`), and the thread is asked one
 * question about that ask's own identity: does it still need this delivery? See
 * `domain/work/thread.ts`'s `askSuperseded` for the three comparisons — an answering
 * `handed-off`/`waiting` ending (the ball moved to a run that delivers the answer),
 * the dispatched agent's own verdict already on the thread (#282, `verdictPassed`
 * deciding whether it stands), and a newer ask still open (someone else's live
 * request). A thread whose ask survives all three is still waiting, and the dispatch
 * goes. The marker an answers-request dispatch never posted stays unposted: the
 * runner's claim — `atomaton:took`, written at start — is the record that a run took
 * the turn, and it is what separates two racing validations' runs when both arrive
 * for one ask.
 *
 * A dispatch that names no ask is refused: an answers-request dispatch without one
 * has nothing to verify its wait against, and sending it would be exactly the
 * unverified claim #283 was. The callers all name one — validation carries the
 * command comment's id or the `waiting` ending's, the reload its own hand-off's.
 *
 * A refused dispatch posts nothing: the person already holds the judgement, and a
 * notice restating it is the confusion #283 reports rather than a cure. One log line
 * is the account.
 *
 * ## Why the read is probed before it is trusted
 *
 * A caller that wrote to the thread moments before dispatching (`reload_environment`'s
 * handoff comment) passes its id as `freshnessProbeId`, and the read is retried until
 * that comment is visible — the same read-after-write instrument the ordering check
 * runs on its marker. Judging before the read catches up could refuse the reload over
 * a lag, and the reload is the path this check exists to keep open. A probe that never
 * becomes visible is a read that cannot be trusted, and the answer is the one this
 * module gives every untrusted read: stand down, quietly.
 *
 * A read that fails refuses too — the module's standing asymmetry: an answer nobody
 * could determine must not be the one that lets work through.
 *
 * Returns the refusal, or `undefined` when the dispatch may proceed.
 */
function refuseSupersededAsk(d: RunnerDispatch): "superseded" | undefined {
  const log = d.log ?? ((message: string) => console.error(message));
  // The repository as a `gh` path segment, the same way `postDispatchMarker` writes
  // it, for the same reason `refuseOutstandingRequest` does.
  const repoPath = d.repo ?? "{owner}/{repo}";

  const askId = Number(d.ask);
  if (!Number.isInteger(askId) || askId <= 0) {
    log(
      `${d.context}: the dispatch answers a request on #${d.number} but names no ask comment, ` +
        `so ${d.agent} was not started`,
    );
    return "superseded";
  }

  // Widening, like the marker check's: the point is to outlast a lag, not to sit out
  // an outage. A run holds a runner while this sleeps, so the total is bounded.
  const delays = [1_000, 2_000, 4_000];
  let read:
    | { superseded: ReturnType<typeof isAskSuperseded>["superseded"]; probeVisible: boolean | undefined }
    | undefined;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      read = isAskSuperseded(repoPath, d.number, {
        askId,
        agent: d.agent,
        verdictPassed: d.verdictPassed,
        probeId: d.freshnessProbeId,
      });
    } catch (e) {
      log(`${d.context}: could not read the thread on #${d.number}, so ${d.agent} was not started: ${e}`);
      return "superseded";
    }
    if (d.freshnessProbeId === undefined || read.probeVisible) break;
    const delay = delays[attempt];
    if (delay === undefined) break;
    log(
      `${d.context}: the comment this dispatch answers on #${d.number} is not visible yet; ` +
        `waiting ${delay}ms and reading again`,
    );
    Bun.sleepSync(delay);
  }

  if (read === undefined || (d.freshnessProbeId !== undefined && !read.probeVisible)) {
    log(
      `${d.context}: whether #${d.number} still waits for ${d.agent} could not be established ` +
        "(the thread would not confirm it had caught up), so nothing was started",
    );
    return "superseded";
  }

  const why = read.superseded;
  if (why === undefined) return undefined;
  log(
    `${d.context}: the ask this dispatch answers on #${d.number} is no longer waiting ` +
      `(${why}), so ${d.agent} was not started`,
  );
  return "superseded";
}

/**
 * Dispatch the runner, unless the target is not open, already has a turn, or — for a
 * dispatch that answers a request — the wait it answers has already resolved.
 *
 * Callers that have a fallback (closing an issue directly rather than asking an agent
 * to) branch on the outcome; callers that do not should at least not treat anything
 * but `"dispatched"` as success.
 */
export function dispatchRunner(d: RunnerDispatch): DispatchOutcome {
  // An empty agent is refused here rather than sent to GitHub, which rejects it with
  // `HTTP 422: Required input 'agent' not provided`. The doc comment on
  // `aggregation.ts`'s `parentAgent` has claimed this refusal for a while; it was not
  // there, and the 422 was the only thing that stopped a run for an agent called "".
  //
  // The caller that reaches this is the aggregation gate, when the parent's thread
  // names no agent -- see `mostRecentAgent`. `failed` is the honest answer: nothing is
  // running and nothing will retry, which is what the gate reports as
  // `dispatch-failed`.
  if (!d.agent.trim()) {
    const log = d.log ?? ((message: string) => console.error(message));
    log(`${d.context}: no agent was named, so nothing was dispatched (an empty agent is not a run).`);
    return "failed";
  }

  const state = readTargetState(d.number, d.repo);
  if (!mayStartWorkOn(state)) return refuseClosedTarget(d, state);

  // The marker goes out before the check, so the check has something to be ordered
  // against. A dispatch that answers a request posts no marker — the request it would
  // find is its own — so instead of the ordering check its claim is verified the
  // other way: the ask it names must still be waiting (#285). Either way the run
  // starts with an `ask` to claim: the marker's id where the marker is the ask, the
  // caller's where the dispatch answers a request.
  let ask: number | string | undefined;
  if (d.answersRequest) {
    const refusal = refuseSupersededAsk(d);
    if (refusal !== undefined) return refusal;
    ask = d.ask;
  } else {
    const markerId = postDispatchMarker(d);
    const refusal = refuseOutstandingRequest(d, markerId);
    if (refusal !== undefined) return refusal;
    ask = d.ask ?? markerId;
  }

  const args = [
    ...(d.repo ? ["--repo", d.repo] : []),
    "--field", `agent=${d.agent}`,
    "--field", `number=${d.number}`,
    "--field", `type=${d.type}`,
    "--field", `notify=${d.notify ?? ""}`,
    // The ask this run claims at start (#285). Empty is the honest "no ask comment" —
    // a body-started run — and the runner writes no claim for it.
    "--field", `ask=${ask ?? ""}`,
    // Always sent, so the input has a value on every path rather than defaulting in
    // one place and being absent in another.
    "--field", `reload_count=${d.reloadCount ?? 0}`,
    // Empty when a person or the machinery started the run -- see `dispatchedBy`.
    "--field", `dispatched_by=${d.dispatchedBy ?? ""}`,
  ];
  if (!dispatchWorkflow(d.context, runnerWorkflow(), args, d.log)) return "failed";
  // The default classification compares the target with this run's own node
  // (`run-node.ts`): onto it moves the turn on, under it starts work and leaves this
  // node waiting. `continuesChain` overrides it for the dispatch that is the run's
  // own conclusion landing on another node — neither on it nor under it — whose
  // caller passes the fact the comparison cannot recover. See `RunnerDispatch` and
  // `ops-log.ts` for what the two op names decide.
  const here = nodeNumber();
  const elsewhere = d.continuesChain !== true && here !== undefined && String(d.number) !== String(here);
  logDispatch(d.type, d.agent, { number: Number(d.number), ...(elsewhere ? { elsewhere: true } : {}) });
  return "dispatched";
}
