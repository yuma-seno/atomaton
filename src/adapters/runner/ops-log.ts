/**
 * ops-log.ts — Structured JSON-lines log of mutating operations Atomaton
 * performs during a run, written to $ATOMATON_OPS_LOG (default
 * /tmp/atomaton_ops.log). Two purposes:
 *   1. A general audit trail (create_sub_issue, create_root_issue, close_issue, create_pr,
 *      merge_pr, etc. -- see mcp/github.ts's call sites).
 *   2. `logDispatch()`'s `"op":"dispatch"` entries are the canonical,
 *      STRUCTURED signal `atomaton-runner.wac.ts`'s `chain_continues`
 *      detection reads (via `grep` for the literal `"op":"dispatch"`
 *      JSON key/value, a stable documented field -- not by pattern-matching
 *      arbitrary human-readable log prose). The previous approach (grepping
 *      stderr log TEXT for hand-written strings like "dispatched: agent=...")
 *      silently broke once already when a refactor changed the wording
 *      without updating the grep pattern to match -- this module exists so
 *      that class of bug can't recur: the dispatch signal now has one
 *      canonical writer and one canonical reader, both referring to the
 *      same `"op":"dispatch"` literal.
 */
import { appendFileSync } from "node:fs";

const OPS_LOG_PATH = process.env.ATOMATON_OPS_LOG ?? "/tmp/atomaton_ops.log";

export function logOp(op: string, payload: Record<string, unknown> = {}): void {
  const entry = { ts: new Date().toISOString(), op, ...payload };
  try {
    appendFileSync(OPS_LOG_PATH, JSON.stringify(entry) + "\n");
  } catch (e) {
    console.error(`[ops-log] WARN: failed to write op log: ${e}`);
  }
}

/**
 * Records that a follow-up agent dispatch was triggered as a side effect of
 * a tool call during this run: `launch_sub_agent` (once per sub-issue),
 * `create_pr`'s automatic reviewer dispatch, `merge_pr`'s re-invocation of
 * the PR's origin agent (or, once that confirms and closes, the
 * atomaton), and a sub-issue closure's atomaton dispatch (see
 * lib/aggregation.ts). This is the ONE canonical "a chain continues"
 * signal every dispatch site writes.
 *
 * ## Two entries, because a dispatch says two different things
 *
 * A dispatch STARTS A RUN EVERYWHERE, so it always silences the "nobody is coming"
 * mention. What it does NOT always do is keep THIS node's turn going: a hand-off puts
 * the next agent ON this node, while `launch_sub_agent` and `create_pr` start work
 * UNDER it and park the turn — the node holds its `atomaton/in-progress` guard because
 * the turn is parked, not because anything is running on it, and the run is not a link
 * in this node's chain. A single flag said "a run is going on this node" for both, so
 * `manage_dispatch_loop` counted a parked run as one that continues. See
 * `domain/work/turn.ts` for what each ending implies.
 *
 * So the op NAME carries which kind it was, and a reader greps for the one it means:
 *
 *   `"op":"dispatch"`            this dispatch carries the run's own turn on — the
 *                                run is on the target node, or the dispatch is the
 *                                run's own conclusion waking another node (a merged
 *                                pull request re-invoking the issue it delivers)
 *   `"op":"dispatch-elsewhere"`  work started UNDER this node — the node is waiting
 *
 * `elsewhere` is passed in rather than derived here because only the caller knows
 * which node it is dispatching onto. `dispatchRunner` derives it by comparing the
 * target number with the run's own, and a caller whose dispatch is the run's own
 * conclusion landing elsewhere passes `continuesChain` instead — the one case the
 * comparison cannot see, and the reason the flag exists (see `RunnerDispatch`). The
 * two names are exact-proof against each other:
 * `grep '"op":"dispatch"'` does not match `"op":"dispatch-elsewhere"`, because the
 * character after `dispatch` must be a closing quote.
 */
export function logDispatch(
  target: string,
  agent: string,
  extra: Record<string, unknown> & { elsewhere?: boolean } = {},
): void {
  const { elsewhere, ...rest } = extra;
  logOp(elsewhere === true ? "dispatch-elsewhere" : "dispatch", { target, agent, ...rest });
}
