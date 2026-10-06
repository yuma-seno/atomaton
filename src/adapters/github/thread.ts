/**
 * thread.ts — read a node's thread and answer what it says about the turn.
 *
 * The I/O half of `domain/work/thread.ts`. That module folds a list of events into
 * an answer; this one reads the events out of GitHub — the node's own body and its
 * comments — and hands them over.
 *
 * ## Every reader sees the SHAPED thread
 *
 * The guard deletes a person's comment made while the ball is with an agent, and the
 * deletion is not instant. So every question here is asked of `shapedThread`'s output,
 * never of the raw comments: a comment on its way out must not be able to answer any of
 * them. That is one rule in one place, and it is why the functions below are thin —
 * each reads the thread, shapes it, and asks the domain one question.
 *
 * ## Why the body is read too
 *
 * A node is handed to an agent in three ways, and only two of them are comments: a
 * person's `/agent` comment, an agent's hand-off result comment, and a pull request
 * body naming a reviewer. The third is written by `create_pr` before any comment
 * exists, so a reader that looked only at comments would see a pull request with a
 * reviewer named and no agent working on it.
 *
 * The body is the node's OPENING statement, not a comment: it cannot race a run, so it
 * is never removed by the shaping, and it is the fallback when no comment asks for an
 * agent. See `latestRequestedAgent`.
 *
 * ## Why it lives here rather than in `entrypoints/`
 *
 * Two callers need it and they are in different trees: the guard
 * (`entrypoints/machinery/guard_comment_during_run.ts`) and the sub-agent dispatch
 * (`entrypoints/tools/lib/dispatch_sub_agent.ts`). A script may not import another
 * script's `ref`, and the machinery scripts are bundled one per file — so the shared
 * reader belongs beside the other modules that read a thread, not in either caller.
 */
import { gh, ghRead } from "./gh.ts";
import { DISPATCH_TAG, ENDED_TAG } from "./tags.ts";
import { parseCommentCommand } from "../../domain/work/comment-command.ts";
import { isHumanActor } from "../../domain/work/actor.ts";
import {
  latestRequestedAgent,
  requestOutstanding,
  shapedThread,
  wasLaunched,
  whoseTurn,
  type ShapedThread,
  type ThreadEntry,
  type TurnHolder,
  type TurnReaders,
} from "../../domain/work/thread.ts";

/**
 * The readers, from the modules that own each format.
 *
 * `requestedAgent` is `parseCommentCommand` rather than a regex written here: a command
 * is a command wherever it is read, and the parser already accepts both the slash form
 * a person types and the dispatch marker the machinery writes.
 */
export const readers: TurnReaders = {
  // The ending is the tag that means "how this run ended". `handoff` and `waiting` are
  // the two that leave the ball somewhere other than a person; `stopped`/`limit`/`done`
  // all give the node back, and end the turn the same way. See `TurnReaders`.
  ending: (body) => {
    const ended = ENDED_TAG.read(body);
    if (ended === "handoff") return "handed-off";
    if (ended === "waiting") return "waiting";
    if (ended === "stopped" || ended === "limit" || ended === "done") return "returned";
    return "";
  },
  requestedAgent: (body) => parseCommentCommand(body).agent,
  isDispatchMarker: (body) => DISPATCH_TAG.has(body),
};

/** A comment as this needs it: an id to exclude by, a body to read, and who wrote it. */
interface Comment {
  id: number;
  body?: string;
  user?: { type?: string };
}

/** Whether a comment was written by a person rather than the machinery. */
function isHumanComment(comment: Comment): boolean {
  return isHumanActor(comment.user?.type);
}

/**
 * Which of a list of comments survive the guard's shaping, by id.
 *
 * For a caller that has already fetched the comments and wants to drop the ones the
 * guard is removing — `fetch_events.ts`, which builds the model's context from a
 * comment list it read itself. It does not re-read the thread; it shapes what it has,
 * with the same rule every other reader uses.
 *
 * The comments must be oldest first, which is the order the API returns them in.
 */
export function keptCommentIds(comments: readonly Comment[]): Set<number> {
  const entries = comments.map((comment) => ({
    id: comment.id,
    body: comment.body ?? "",
    isHuman: isHumanComment(comment),
  }));
  return new Set(shapedThread(entries, readers).comments.map((entry) => entry.id));
}

/**
 * A node's shaped comments, read from GitHub.
 *
 * The comments alone, without the body. `runInFlight` needs only these, and it is
 * called once per node in a tree walk — so reading the body too would double the
 * requests for an answer the body cannot change. The body is not a comment and cannot
 * move the turn; see `domain/work/thread.ts`.
 *
 * Throws when the read fails, for the same reason `readThread` does.
 */
function readComments(repo: string, number: string | number, excludeCommentId?: string | number): ShapedThread {
  const listed = ghRead("api", `repos/${repo}/issues/${number}/comments`, "--paginate");
  if (listed.code !== 0) throw new Error(`could not read comments on #${number}: ${listed.stderr || listed.stdout}`);

  const excluded = String(excludeCommentId ?? "").trim();
  const comments: ThreadEntry[] = (JSON.parse(listed.stdout || "[]") as Comment[])
    .filter((comment) => String(comment.id) !== excluded)
    .map((comment) => ({ body: comment.body ?? "", isHuman: isHumanComment(comment) }));

  return shapedThread(comments, readers);
}

/**
 * A node's body and its shaped comments, read from GitHub.
 *
 * The one read every question below starts from. `excludeCommentId` drops a comment
 * from the read — the guard excludes the comment it is judging, so the question is
 * whose turn it was BEFORE that comment arrived.
 *
 * Throws when either read fails. Every caller is deciding whether to keep a comment out
 * of a race or whether to start a run, so an answer nobody could determine must not be
 * the one that lets work through.
 */
function readThread(repo: string, number: string | number, excludeCommentId?: string | number): { body: string; shaped: ShapedThread } {
  const issue = ghRead("api", `repos/${repo}/issues/${number}`, "--jq", ".body");
  if (issue.code !== 0) throw new Error(`could not read #${number}: ${issue.stderr || issue.stdout}`);

  return { body: issue.stdout ?? "", shaped: readComments(repo, number, excludeCommentId) };
}

/**
 * Whether the guard's shaping removes a comment — the question the guard itself asks.
 *
 * The guard deletes a person's comment made while the ball is with an agent, and that
 * rule is `shapedThread`'s. So the guard does not re-derive it: it reads the thread
 * WITHOUT the comment it is judging, shapes what is left, and asks whose turn it was.
 * One rule, one place, and the readers that run in the window before the deletion lands
 * see the same answer.
 *
 * COMMENTS ONLY, never the body. A pull request body naming a reviewer is a request the
 * validation dispatch is already handling, and counting it would delete a person's
 * comment on the strength of a request their comment was not racing.
 */
export function commentWouldBeRemoved(repo: string, number: string | number, commentId: string | number): boolean {
  return whoseTurn(readThread(repo, number, commentId).shaped.events) === "agent";
}

/**
 * Whether a run is in flight on a node, read from its thread.
 *
 * The `atomaton/in-progress` label is a cache of this answer, written late: the runner
 * sets it after the job starts and clears it when the job ends, so between a person's
 * command and the runner starting it is absent, and a run that died leaves it set. The
 * thread is the answer itself, written when the turn changes -- the same argument
 * `guard_comment_during_run.ts` makes for reading the thread rather than the label.
 *
 * The ball is with an agent exactly when the last turn-changing event was a request or
 * a hand-off, which is `whoseTurn`'s rule. A request that no run has taken up yet still
 * counts: a run is coming, and a stop should reach it and a resume should not start a
 * second one.
 *
 * Throws when the thread cannot be read. A caller deciding whether to stop or resume
 * work must not read a failed read as "nothing is running".
 */
export function runInFlight(repo: string, number: string | number): boolean {
  return whoseTurn(readComments(repo, number).events) === "agent";
}

/**
 * Whether an agent was ever dispatched onto a node, read from its thread.
 *
 * The `atomaton/launched` label used to answer this, and it was written before the
 * dispatch was attempted -- so a refused dispatch left it saying "launched" while
 * nothing had been. The dispatch marker is written by `dispatchRunner` only when it is
 * about to start a run, so the thread is the accurate record. See `wasLaunched`.
 *
 * Throws when the thread cannot be read, like every other reader here: a caller
 * deciding whether a sub-issue has been started must not read a failed read as "no".
 */
export function wasLaunchedOn(repo: string, number: string | number): boolean {
  return wasLaunched(readComments(repo, number).comments, readers);
}

/**
 * Whether a request for an agent is outstanding on a node, read from its comments.
 *
 * The node's BODY is deliberately not read, unlike `latestRequestedAgentOn`. A pull
 * request body naming a reviewer is the request the validation dispatch exists to
 * fulfil, so counting it would refuse the one dispatch that should happen. What this
 * answers is "has somebody asked, in the thread, and nobody taken it up" — and a body
 * is not a comment.
 *
 * Read from the SHAPED thread, so a comment the guard is removing cannot be the request
 * this refuses a dispatch over: it is on its way out, and the guard's own notice tells
 * its author it will not be acted on.
 */
export function requestOutstandingOn(repo: string, number: string | number, excludeCommentId?: string | number): boolean {
  return requestOutstanding(readThread(repo, number, excludeCommentId).shaped.events);
}

/** What a dispatch learns from one read of the thread after posting its marker. */
export interface MarkerCheck {
  /**
   * Whether the marker this dispatch just posted is visible in the thread yet.
   *
   * GitHub does not guarantee read-after-write: a comment can be missing from the
   * listing for a moment after it is created. This is the freshness probe -- if the
   * dispatch's OWN write is visible, the read has caught up at least that far, and a
   * write that happened before it is very likely visible too.
   */
  markerVisible: boolean;
  /** Whether a request for an agent was outstanding BEFORE that marker. */
  outstanding: boolean;
}

/**
 * Read the thread once and answer both questions a dispatch has after posting its marker.
 *
 * One read, not two, because the two answers come from the same listing: whether the
 * marker is visible, and whether a request preceded it. Asking them separately would
 * double the API calls for a dispatch, and the API has a rate limit.
 *
 * The marker is excluded from the outstanding check -- it is this dispatch's own
 * request, and counting it would refuse the very dispatch that posted it. That is the
 * same exclusion `requestOutstandingOn` takes as an argument, folded in here so the
 * caller gets both answers from one call.
 *
 * Throws when the read fails, like every other reader here.
 */
export function checkDispatchMarker(
  repo: string,
  number: string | number,
  markerId: string | number,
): MarkerCheck {
  const listed = ghRead("api", `repos/${repo}/issues/${number}/comments`, "--paginate");
  if (listed.code !== 0) throw new Error(`could not read comments on #${number}: ${listed.stderr || listed.stdout}`);

  const marker = String(markerId);
  const comments = JSON.parse(listed.stdout || "[]") as Comment[];
  const markerVisible = comments.some((comment) => String(comment.id) === marker);
  const entries: ThreadEntry[] = comments
    .filter((comment) => String(comment.id) !== marker)
    .map((comment) => ({ body: comment.body ?? "", isHuman: isHumanComment(comment) }));

  return { markerVisible, outstanding: requestOutstanding(shapedThread(entries, readers).events) };
}

/**
 * The agent a node asks for next, from the newest request in its shaped thread.
 *
 * The body is read here, unlike the two above, because a pull request's body IS a
 * request — the `/<agent>` line `create_pr` writes. It is the oldest entry, so a
 * person's later comment wins over it, which is the point: the body is what the node
 * was opened asking for, and a comment is what somebody is asking for now.
 *
 * `isKnownAgent` is the caller's check that a name can actually be dispatched — a
 * definition exists for it. It is a predicate rather than a directory because the
 * filesystem layout is the caller's to know, and a name that fails it is skipped rather
 * than returned, so a typo falls back to the next request instead of dispatching nobody.
 */
export function latestRequestedAgentOn(
  repo: string,
  number: string | number,
  isKnownAgent: (name: string) => boolean,
  excludeCommentId?: string | number,
): string {
  const { body, shaped } = readThread(repo, number, excludeCommentId);
  const known: TurnReaders = {
    ...readers,
    requestedAgent: (text) => {
      const name = readers.requestedAgent(text);
      return isKnownAgent(name) ? name : "";
    },
  };
  return latestRequestedAgent(body, shaped.comments, known);
}
