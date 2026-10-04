/**
 * node-type.ts — the `issue` / `pr` spelling a workflow passes around.
 *
 * ## Why this is not `NodeKind`
 *
 * `work-tree.ts`'s `NodeKind` is `"issue" | "pull-request"`, which is what a person
 * reads. This is `"issue" | "pr"`, which is what a workflow input, a `--type` flag
 * and a `$GITHUB_OUTPUT` line carry. They are the same distinction spelled two ways,
 * and the two spellings are deliberate: the wire form is short because it is typed
 * into `gh workflow run` by hand, and the domain form is long because it is read in
 * a sentence. Folding them together would make one of the two worse.
 *
 * ## Why it is one function
 *
 * The check `type !== "issue" && type !== "pr"` was written four times — in
 * `dispatch_agent.ts`, `fetch_events.ts`, `post_result_comment.ts`, and as a bash
 * `[[ "$TYPE" == "issue" || "$TYPE" == "pr" ]]` in `atomaton-runner.wac.ts`. The bash
 * copy is the one that matters: it is not generated from anything, so a third type
 * added here would not reach it.
 */

/** The two kinds of node, as a workflow spells them. */
export type NodeType = "issue" | "pr";

/** Both spellings, for a caller that has to enumerate them. */
export const NODE_TYPES: readonly NodeType[] = ["issue", "pr"];

/** Whether `value` is a node type a workflow may pass. */
export function isNodeType(value: string | undefined): value is NodeType {
  return value === "issue" || value === "pr";
}
