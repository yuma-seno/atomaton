/**
 * ops-log.ts — Structured JSON-lines log of mutating operations Atomaton
 * performs during a run, written to $ATOMATON_OPS_LOG (default
 * /tmp/atomaton_ops.log). Two purposes:
 *   1. A general audit trail (create_issue, close_issue, create_pr,
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
 * mention. What it does NOT always do is end THIS node's turn: a hand-off to a
 * colleague runs on this very node, while `launch_sub_agent` and `create_pr` start
 * work UNDER it and leave it waiting. Reading one flag for both held the node's
 * `atomaton/in-progress` guard through the second kind — after every orchestration
 * the node was still "the agent's" while nothing ran on it, so a person's `/resume`
 * and `/stop` skipped it, and `manage_dispatch_loop` counted the chain as continuing.
 * See `domain/work/turn.ts` for what each ending implies.
 *
 * So the op NAME carries which kind it was, and a reader greps for the one it means:
 *
 *   `"op":"dispatch"`            this node's turn moves on — the run is on THIS node
 *   `"op":"dispatch-elsewhere"`  work started UNDER this node — the node is waiting
 *
 * `elsewhere` is passed in rather than derived here because only the caller knows
 * which node it is dispatching onto; `dispatchRunner` decides it by comparing the
 * target number with the run's own. The two names are exact-proof against each other:
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
