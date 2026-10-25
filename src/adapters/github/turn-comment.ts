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
 * same way, and who may post where is not this file's question. What it owns is the
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
import { AGENT_TAG, ENDED_TAG, LLM_CONTEXT_TAG } from "./tags.ts";

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
  /**
   * The agent this run was, written as `atomaton:agent` (#354).
   *
   * Optional because a caller outside a run has no name to give, and a guessed one
   * would be a name `mostRecentAgentOn` acts on. A caller inside a run always has one
   * — `runAgent()` — and passes it.
   *
   * It matters most for `waiting`. A run that parks on a child posts no result
   * comment, so this ending is the only footprint it leaves, and it used to leave it
   * without a name. A node whose run was started without a dispatch marker — a manual
   * `workflow_dispatch`, a new issue's body — then had no name anywhere on its
   * thread, and the aggregation that collects the parked turn could only dispatch an
   * agent called `""`, which GitHub refused (#354). `atomaton:agent` is where the
   * thread already names a run's agent, so the ending carries it too.
   *
   * A body carrying this tag reads as an agent's comment — so the readers that mean
   * "an agent's RESULT comment" must say so, and `isResultComment` in
   * `adapters/github/thread.ts` is where they do.
   */
  agent?: string;
  /**
   * The ask comment id this ending answers, and the id of the run that wrote it (#285).
   *
   * The ending is the second half of a turn's identity — `TOOK_TAG` claimed an ask at
   * start, and this closes it. Both come from the run's environment: the runner passes
   * the ask it claimed in (`ATOMATON_ASK_ID`) and its own run id rides in
   * (`GITHUB_RUN_ID`). A caller outside a run — a test, a tool that lost its
   * environment — writes `answers=0`, which matches no real comment id: the ending is
   * then an answer to nothing, which is the truthful record for a turn that claimed
   * no ask. There are no other defaults: an ending that guessed at either id would be
   * a lie a comparison would act on.
   */
  answers?: number;
  run?: number;
}

/** The header lines, in the order every comment here has them. */
export function turnHeader(h: TurnCommentHeader): string[] {
  const context = h.audience === "model" ? "include" : "exclude";
  const agent = (h.agent ?? "").trim();
  return [
    LLM_CONTEXT_TAG.write(context),
    // Between the audience and the ending: the two tags every turn comment carries
    // keep their places, and a caller with no agent writes exactly what it wrote
    // before (#354).
    ...(agent === "" ? [] : [AGENT_TAG.write(agent)]),
    ENDED_TAG.write({ verb: h.ended, answers: h.answers ?? 0, run: h.run ?? 0 }),
  ];
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
