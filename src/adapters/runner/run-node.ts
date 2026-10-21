/**
 * run-node.ts — the node this run sits on, and the one place that reads it.
 *
 * One run = one node: an issue or a pull request. The runner puts the node's
 * number in `NUMBER`, its kind in `TYPE` and the node's requester in `NOTIFY`
 * (`atomaton-runner.wac.ts`, mirrored in `AGENT_ENV_NAMES`). Everything that
 * used to read those names straight out of `process.env` goes through here,
 * because the node and the conversation are two different axes and one name
 * carrying both was what #248 was:
 *
 *   - the NODE is what this run sits on and what its tools act on by default —
 *     the thing this file reads;
 *   - the CONVERSATION is the canonical node `fetch_events.ts` resolved, written
 *     to the workflow as `session_type` / `session_number`. A pull request run
 *     joins its parent issue's conversation so the two runs share one session; a
 *     sub-issue's run joins its own. That resolution is deliberate and must not
 *     be dissolved into this file.
 *
 * The refusals the "a pull request run does not leave its node" tools share live
 * here too, so they cannot drift into disagreeing about what a pull request run
 * is for.
 */

/** The kind of node a run sits on, as the runner spells it in `TYPE`. */
export type NodeType = "issue" | "pr";

/**
 * The kind of node this run is on, or undefined outside a run and on a value
 * that is neither spelling. Undefined is treated as "not a pull request run"
 * everywhere below: the tools that require a pull request run refuse, and the
 * tools that require an issue run refuse with the same sentence.
 */
export function nodeType(): NodeType | undefined {
  const raw = (process.env.TYPE ?? "").trim().toLowerCase();
  return raw === "issue" || raw === "pr" ? raw : undefined;
}

export function isPrRun(): boolean {
  return nodeType() === "pr";
}

export function isIssueRun(): boolean {
  return nodeType() === "issue";
}

/**
 * The number of the node this run sits on, or undefined when the environment
 * does not name one. A pull request run's number is the pull request's — issues
 * and pull requests share one number space, which is why one number can serve
 * both shapes of read and the result says which kind came back.
 */
export function nodeNumber(): number | undefined {
  const parsed = Number((process.env.NUMBER ?? "").trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * Refuse a tool only an issue run may call, naming the routes a pull request
 * run has instead.
 *
 * The shared half is the reason (a pull request is a leaf of the work tree) and
 * the caller passes the routes, because they differ: a defect gets
 * `create_root_issue`, a finished review gets `merge_pr`, a fix gets
 * `commit_and_push`. A refusal that says what to do instead is followed, and one
 * that only states a rule is not — see `refuseCommandLines` in
 * `tools/mcp/github.ts` for the same rule on a different refusal.
 */
export function refusePrRun(tool: string, instead: string): never {
  throw new Error(
    `${tool} is for an issue run, and this run is on a pull request — a leaf of the work tree, ` +
      "which reviews or fixes one pull request and adds nothing below it. " +
      instead,
  );
}
