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
import { requestOutstanding, turnEvents, whoseTurn, type TurnHolder, type TurnReaders } from "../../domain/work/whose-turn.ts";

/**
 * The three readers, from the modules that own each format.
 *
 * `asksForAgent` is `parseCommentCommand` rather than a regex written here: a command
 * is a command wherever it is read, and the parser already accepts both the slash form
 * a person types and the dispatch marker the machinery writes.
 */
export const readers: TurnReaders = {
  isAgentResult: (body) => AGENT_TAG.has(body),
  handedOff: (body) => ENDED_TAG.read(body) === "handoff",
  asksForAgent: (body) => parseCommentCommand(body).agent !== "",
};

/** A comment as this needs it: an id to exclude by, and a body to read. */
interface Comment {
  id: number;
  body?: string;
}

/**
 * The node's body and its comments, oldest first, minus the one being judged.
 *
 * A failed read of either throws rather than answering "no events": every caller is
 * deciding whether to keep a comment out of a race, so an answer nobody could
 * determine must not be the one that lets work through.
 */
export function threadBodies(repo: string, number: string | number, excludeCommentId?: string | number): string[] {
  const issue = gh("api", `repos/${repo}/issues/${number}`, "--jq", ".body");
  if (issue.code !== 0) throw new Error(`could not read #${number}: ${issue.stderr || issue.stdout}`);
  const body = issue.stdout ?? "";

  const listed = gh("api", `repos/${repo}/issues/${number}/comments`, "--paginate");
  if (listed.code !== 0) throw new Error(`could not read comments on #${number}: ${listed.stderr || listed.stdout}`);
  const comments = JSON.parse(listed.stdout || "[]") as Comment[];

  const excluded = String(excludeCommentId ?? "").trim();
  const bodies = comments
    .filter((comment) => String(comment.id) !== excluded)
    .map((comment) => comment.body ?? "");

  return [body, ...bodies];
}

/** The node's comments, oldest first, minus the one being judged. */
function commentBodies(repo: string, number: string | number, excludeCommentId?: string | number): string[] {
  const listed = gh("api", `repos/${repo}/issues/${number}/comments`, "--paginate");
  if (listed.code !== 0) throw new Error(`could not read comments on #${number}: ${listed.stderr || listed.stdout}`);
  const comments = JSON.parse(listed.stdout || "[]") as Comment[];
  const excluded = String(excludeCommentId ?? "").trim();
  return comments.filter((comment) => String(comment.id) !== excluded).map((comment) => comment.body ?? "");
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
  return whoseTurn(turnEvents(commentBodies(repo, number, excludeCommentId), readers));
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
 */export function requestOutstandingOn(repo: string, number: string | number, excludeCommentId?: string | number): boolean {
  return requestOutstanding(turnEvents(commentBodies(repo, number, excludeCommentId), readers));
}
