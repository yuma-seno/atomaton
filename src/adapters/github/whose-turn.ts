/**
 * whose-turn.ts — read a node's thread and answer whether the ball is with an agent.
 *
 * The I/O half of `domain/work/whose-turn.ts`. That module folds a list of events into
 * an answer; this one reads the events out of GitHub — the node's own body and its
 * comments — and hands them over.
 *
 * ## Why the body is read too
 *
 * A node is handed to an agent in three ways, and only two of them are comments: a
 * person's `/agent` comment, an agent's hand-off result comment, and a pull request
 * body naming a reviewer. The third is written by `create_pr` before any comment
 * exists, so a reader that looked only at comments would see a pull request with a
 * reviewer named and no agent working on it.
 *
 * ## Why it lives here rather than in `entrypoints/`
 *
 * Two callers need it and they are in different trees: the guard
 * (`entrypoints/machinery/guard_comment_during_run.ts`) and the sub-agent dispatch
 * (`entrypoints/tools/lib/dispatch_sub_agent.ts`). A script may not import another
 * script's `ref`, and the machinery scripts are bundled one per file — so the shared
 * reader belongs beside the other modules that read a thread, not in either caller.
 */
import { gh } from "./gh.ts";
import { AGENT_TAG, ENDED_TAG } from "./tags.ts";
import { parseCommentCommand } from "../../domain/work/comment-command.ts";
import {
  latestRequestedAgent,
  requestOutstanding,
  shapedThread,
  turnEvents,
  whoseTurn,
  type ThreadEntry,
  type TurnHolder,
  type TurnReaders,
} from "../../domain/work/whose-turn.ts";

/**
 * The four readers, from the modules that own each format.
 *
 * `asksForAgent` and `requestedAgent` are both `parseCommentCommand` rather than a
 * regex written here: a command is a command wherever it is read, and the parser
 * already accepts both the slash form a person types and the dispatch marker the
 * machinery writes. The two are the same parse, asked two questions — whether a body
 * asks, and who it asks for.
 */
export const readers: TurnReaders = {
  isAgentResult: (body) => AGENT_TAG.has(body),
  handedOff: (body) => ENDED_TAG.read(body) === "handoff",
  asksForAgent: (body) => parseCommentCommand(body).agent !== "",
  requestedAgent: (body) => parseCommentCommand(body).agent,
};

/** A comment as this needs it: an id to exclude by, a body to read, and who wrote it. */
interface Comment {
  id: number;
  body?: string;
  user?: { type?: string };
}

/** Whether a comment was written by a person rather than the machinery. */
function isHumanComment(comment: Comment): boolean {
  return comment.user?.type !== "Bot";
}

/** The node's comments as thread entries, oldest first, minus the one being judged. */
function commentEntries(repo: string, number: string | number, excludeCommentId?: string | number): ThreadEntry[] {
  const listed = gh("api", `repos/${repo}/issues/${number}/comments`, "--paginate");
  if (listed.code !== 0) throw new Error(`could not read comments on #${number}: ${listed.stderr || listed.stdout}`);
  const comments = JSON.parse(listed.stdout || "[]") as Comment[];
  const excluded = String(excludeCommentId ?? "").trim();
  return comments
    .filter((comment) => String(comment.id) !== excluded)
    .map((comment) => ({ body: comment.body ?? "", isHuman: isHumanComment(comment) }));
}

/**
 * The node's body and its comments as thread entries, oldest first, minus the one
 * being judged.
 *
 * The body is the oldest entry: it is what the node was opened saying, and a comment
 * is what somebody is saying now. That ordering is what lets a person's later
 * `/reviewer` comment win over the `/<agent>` line the body was opened with — see
 * `latestRequestedAgent`.
 *
 * The body is never a person's comment for the guard's purpose: it is not something
 * that can race a run, so it is marked not-human and the shaping never removes it.
 */
export function threadEntries(repo: string, number: string | number, excludeCommentId?: string | number): ThreadEntry[] {
  const issue = gh("api", `repos/${repo}/issues/${number}`, "--jq", ".body");
  if (issue.code !== 0) throw new Error(`could not read #${number}: ${issue.stderr || issue.stdout}`);
  const body = issue.stdout ?? "";
  return [{ body, isHuman: false }, ...commentEntries(repo, number, excludeCommentId)];
}

/**
 * Whether the guard's shaping removes a comment — the question the guard itself asks.
 *
 * The guard deletes a person's comment made while the ball is with an agent, and that
 * rule is `shapedThread`'s. So the guard does not re-derive it: it shapes the thread
 * and asks whether the ball is with an agent once the shaping is done. One rule, one
 * place, and the readers that run in the window before the deletion lands see the same
 * answer.
 *
 * The comment being judged is EXCLUDED from the read, so the question is whose turn it
 * was BEFORE it arrived — which is what decides whether it is removed. A comment that
 * arrives while the ball is with a person is the request that starts the next turn,
 * and is kept.
 *
 * COMMENTS ONLY, never the body. A pull request body naming a reviewer is a request
 * the validation dispatch is already handling, and counting it would delete a person's
 * comment on the strength of a request their comment was not racing.
 *
 * Throws when the thread cannot be read, so a caller deciding whether to keep a comment
 * out of a race fails closed rather than letting it through.
 */
export function commentWouldBeRemoved(repo: string, number: string | number, commentId: string | number): boolean {
  const entries = commentEntries(repo, number, commentId);
  const shaped = shapedThread(entries, readers);
  return whoseTurn(turnEvents(shaped.map((entry) => entry.body), readers)) === "agent";
}

/**
 * Whose turn it is on a node, read from its COMMENTS alone.
 *
 * The guard's question, and the body is deliberately left out of it. A pull request
 * body naming a reviewer is a request the validation dispatch exists to fulfil, so a
 * guard that counted it would delete a person's comment on the strength of a request
 * that is already being handled — and the person would be told to wait for a run that
 * their own comment was not racing.
 *
 * `whoseTurnOn` reads the body as well, which is right for a question about the node
 * as a whole. This is the narrower one: what has been said in the thread.
 */
export function whoseTurnInComments(repo: string, number: string | number, excludeCommentId?: string | number): TurnHolder {
  return whoseTurn(turnEvents(commentEntries(repo, number, excludeCommentId).map((entry) => entry.body), readers));
}

/**
 * Whether a request for an agent is outstanding on a node, read from its comments.
 *
 * The node's BODY is deliberately not read, unlike `whoseTurnOn`. A pull request body
 * naming a reviewer is the request the validation dispatch exists to fulfil, so
 * counting it would refuse the one dispatch that should happen. What this answers is
 * "has somebody asked, in the thread, and nobody taken it up" — and a body is not a
 * comment.
 *
 * Throws when the comments cannot be read, so a caller deciding whether to start a run
 * fails closed rather than starting a second one.
 */
export function requestOutstandingOn(repo: string, number: string | number, excludeCommentId?: string | number): boolean {
  return requestOutstanding(turnEvents(commentEntries(repo, number, excludeCommentId).map((entry) => entry.body), readers));
}

/**
 * The agent a node asks for next, from the newest request in its shaped thread.
 *
 * The body is read here, unlike the two above, because a pull request's body IS a
 * request — the `/<agent>` line `create_pr` writes. It is the oldest entry, so a
 * person's later comment wins over it, which is the point: the body is what the node
 * was opened asking for, and a comment is what somebody is asking for now.
 *
 * Read from the SHAPED thread, so a comment the guard is removing does not get to name
 * the next agent in the window before it disappears. See `shapedThread`.
 *
 * `isKnownAgent` is the caller's check that a name can actually be dispatched — a
 * definition exists for it. It is a predicate rather than a directory because the
 * filesystem layout is the caller's to know, and a name that fails it is skipped
 * rather than returned, so a typo falls back to the next request instead of
 * dispatching nobody.
 *
 * Throws when the thread cannot be read, so a caller deciding who to dispatch fails
 * closed rather than dispatching the wrong agent.
 */
export function latestRequestedAgentOn(
  repo: string,
  number: string | number,
  isKnownAgent: (name: string) => boolean,
  excludeCommentId?: string | number,
): string {
  const issue = gh("api", `repos/${repo}/issues/${number}`, "--jq", ".body");
  if (issue.code !== 0) throw new Error(`could not read #${number}: ${issue.stderr || issue.stdout}`);
  const body = issue.stdout ?? "";
  const known: TurnReaders = {
    ...readers,
    requestedAgent: (text) => {
      const name = readers.requestedAgent(text);
      return isKnownAgent(name) ? name : "";
    },
  };
  return latestRequestedAgent(body, commentEntries(repo, number, excludeCommentId), known);
}
