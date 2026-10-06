/**
 * turn-comment.ts — the one way a comment that ends a turn puts the turn on the thread.
 *
 * ## The rule this exists to make unforgettable
 *
 * A node holds one turn. Every comment that ends one has to say so, because the only
 * thing that answers "is a comment arriving mid-turn?" is the thread's last turn event
 * — see `domain/work/thread.ts`. A comment that ends a turn without carrying the ending
 * leaves the node's last event as the `asked` that started the run, and every reader
 * then agrees on something false: the guard deletes a person's next comment, the
 * aggregation gate refuses the parent with `parent-busy`, `/resume` skips the node.
 *
 * Twice from one cause. #90 was the failure notice; the close-request path had the same
 * hole, in code written to fix #90 — the comment that ASKS A PERSON TO CLOSE the issue
 * carried no ending, so a person who agreed and commented had it removed. So the ending
 * is a parameter here rather than a line each writer remembers:
 *
 *     turnCommentBody({ ended: "waiting", audience: "person", body })
 *
 * `ended` is required. There is no overload that omits it, because omitting it is the
 * bug. A caller with no ending to write is writing something that is not a turn comment
 * — a notice, a refusal, an acknowledgement — and should not use this; it writes its own
 * `llm-context` tag, because that decision still has to be made.
 *
 * ## What it does not decide
 *
 * Not the text, and not who posts it: a tool call and a workflow step reach `gh` the
 * same way, and who may post where is not this file's question. What it owns is the two
 * header tags and the newline under them, which every writer used to spell out itself.
 *
 * ## Audience, not a tag
 *
 * `audience` says who the comment is for: the model's context (`"model"`) or a person
 * reading the issue (`"person"`). On the wire that is `llm-context=include` /
 * `llm-context=exclude` — the names callers used to write by hand, with a comment beside
 * each one explaining which. Naming the reader rather than the tag keeps the decision,
 * instead of its encoding, at the call site; see `LLM_CONTEXT_TAG`.
 */
import { ENDED_TAG, LLM_CONTEXT_TAG } from "./tags.ts";

/**
 * The endings a turn comment may carry, as `ENDED_TAG` spells them.
 *
 * The tag's own vocabulary rather than `domain/work/turn.ts`'s `Ending`, deliberately:
 * several of the domain's endings are not turn comments in this sense (`failed` is
 * written by `report_run_failure`, `finished` and `no-report` by `post_result_comment`),
 * and a reader of a call here should see the small set the tag accepts. The projection
 * from `Ending` is `post_result_comment`'s `endedTag`, and it stays there — one
 * exhaustive switch, where a new ending is a type error rather than a silent landing on
 * `done`.
 */
export type TurnCommentEnding = "done" | "stopped" | "limit" | "handoff" | "waiting";

export interface TurnCommentHeader {
  /**
   * How the turn this comment ends has ended. Required — see the module comment.
   *
   * `waiting` is the one to reach for when the run started work UNDER the node
   * (`launch_sub_agent`, `create_pr`): the node's own turn is over and the ball is with
   * a child, which is a different claim from `handoff`'s "this node's next agent".
   */
  ended: TurnCommentEnding;
  /** Who reads it: the model's context, or a person. */
  audience: "model" | "person";
}

/** The two header lines, in the order every comment here has them. */
export function turnHeader(h: TurnCommentHeader): string[] {
  const context = h.audience === "model" ? "include" : "exclude";
  return [LLM_CONTEXT_TAG.write(context), ENDED_TAG.write(h.ended)];
}

/**
 * The body of a comment that ends a turn, tags and all.
 *
 * Pure. A caller that wants to compose further around it — a `<details>` fold, a footer
 * — uses `turnHeader` instead, so it does not keep a second copy of the tag order.
 */
export function turnCommentBody(h: TurnCommentHeader & { body: string }): string {
  return [...turnHeader(h), h.body].join("\n");
}
