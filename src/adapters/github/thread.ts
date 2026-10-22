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
import { gh, ghRead, ghPaginated, splitConcatenatedJson } from "./gh.ts";
import { AGENT_TAG, DISPATCH_TAG, ENDED_TAG, isQuotation, QUOTES_TAG } from "./tags.ts";
import { parseCommentCommand, parseMangledCommand } from "../../domain/work/comment-command.ts";
import { isHumanActor } from "../../domain/work/actor.ts";
import {
  latestAsk,
  latestRequestedAgent,
  newestEventBody,
  requestOutstanding,
  shapedThread,
  wasLaunched,
  whoseTurn,
  type AskReaders,
  type LatestAsk,
  type ShapedThread,
  type ThreadEntry,
  type TurnEvent,
  type TurnHolder,
  type TurnReaders,
} from "../../domain/work/thread.ts";
import type { DatedComment, EndingWalkReaders, WatchComment } from "../../domain/work/run-report.ts";

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

/**
 * The same readers, plus who the machinery says wrote a comment.
 *
 * Every result comment the runner posts opens with `atomaton:agent=<name>` — so the
 * directive at the end of one has an author to hand the answer back to. A machinery
 * comment without the tag has no author, and `latestAsk` treats it as one it cannot
 * route an answer to.
 *
 * `requestedAgent` is the tolerant parse here, and only here. The ask is read out of
 * an AGENT's result comment, which is the model's final text posted verbatim — the
 * same text `extract_directive` read the handoff from, through `lineForms`. Read
 * strictly, a directive it dispatched from `- /engineer` would not be an ask, and the
 * green verdict would re-dispatch the agent the push answered. `readers` stays strict:
 * a command a person typed is not a model's markdown, and `whoseTurn`,
 * `requestOutstanding` and the guard all read it as the machinery acts on it.
 */
const askReaders: AskReaders = {
  ...readers,
  requestedAgent: (body) => parseMangledCommand(body).agent,
  authoringAgent: (body) => AGENT_TAG.read(body) ?? "",
};

/**
 * The walk readers for counting endings over a whole thread — the turn's ending
 * reader, and the quotation skip beside it.
 *
 * The skip is load-bearing on its own: the guard's notice preserving a removed
 * comment carries that comment's text verbatim, so an `atomaton:ended` tag inside
 * it is the DELETED author's words, and a walk that read it would take the
 * quotation for the thread's own ending. `lastEnding` (work-tree.ts) applies the
 * same skip by hand; this is the shared form, so a walk written tomorrow reaches
 * for one definition instead of a third copy. See `run-report.ts`, which folds on
 * exactly these two readers.
 */
export const endingWalkReaders: EndingWalkReaders = { ending: readers.ending, quoted: isQuotation };

/** A comment as this needs it: an id to exclude by, a body to read, and who wrote it. */
interface Comment {
  id: number;
  body?: string;
  /** When the comment was written, as GitHub reports it. Present on every comment the API returns. */
  created_at?: string;
  user?: { type?: string };
}

/** A thread entry that also carries when it happened, for asks ordered against events outside the thread. */
interface DatedEntry extends ThreadEntry {
  /** When the comment was written, or absent when the read did not have it. */
  at?: string;
}

/** Whether a comment was written by a person rather than the machinery. */
function isHumanComment(comment: Comment): boolean {
  return isHumanActor(comment.user?.type);
}

/**
 * A comment as the shaping needs it, including whether it is a quotation.
 *
 * The ONE place `quoted` is read. A quotation is the machinery's notice that preserves
 * a removed person's comment (`atomaton:quotes`, see `guard_comment_during_run.ts`),
 * and the words inside it are the removed author's -- so the readers must not take
 * them for the machinery speaking, which is the `quoted` the domain folds on. Read
 * from the tag, and only on a NON-human comment: a person writing the same tag in
 * their own text is prose about the machinery, and their commands stay theirs.
 */
function entryOf(comment: Comment): ThreadEntry & { at?: string } {
  const isHuman = isHumanComment(comment);
  const body = comment.body ?? "";
  return {
    body,
    isHuman,
    quoted: !isHuman && QUOTES_TAG.has(body),
    at: comment.created_at,
  };
}

/** What the run watch asks of a node's thread, from one read of it. */
export interface RunWatchThread {
  /** The comments oldest first, as `needsEnding` and `lastEndingComment` fold them. */
  dated: DatedComment[];
  /** The same comments as thread entries, carrying who wrote them and when. */
  entries: WatchComment[];
  /** The shaped thread's turn events, oldest first — `requestOutstanding`'s input. */
  events: TurnEvent[];
}

/**
 * Read a node's thread once and return every view the run watch asks from it.
 *
 * The watch asks three questions of the same listing — whether an ending is
 * missing (`needsEnding`, over the dated bodies), whether the thread is stuck at
 * an ask (`requestOutstanding`, over the shaped events), and whether the watched
 * run took the turn (`tookTurn`, over the shaped entries). Reading the thread once
 * per question would triple a watch's API calls and let the answers disagree as
 * the thread moves; one read returns all three views, shaped once.
 *
 * `ghPaginated`, not `listComments`: past one page `gh --paginate` writes
 * back-to-back arrays, which a whole-output `JSON.parse` throws on — the shape
 * `mostRecentAgentOn`'s comment guards against, and a watch that threw there would
 * fail every notice on a long thread. Throws when the read fails, like every other
 * reader here: a watch deciding whether to post must not read a failed read as
 * "no ending".
 */
export function readRunWatchThread(repo: string, number: string | number): RunWatchThread {
  const listed = ghPaginated<{ id: number; body?: string; created_at?: string; user?: { type?: string } }>(
    "api", `repos/${repo}/issues/${number}/comments`,
  );
  const entries: WatchComment[] = listed.map((comment) => ({
    ...entryOf(comment),
    createdAt: comment.created_at ?? "",
  }));
  return {
    dated: entries.map((entry) => ({ body: entry.body, createdAt: entry.createdAt })),
    entries,
    events: shapedThread(entries, readers).events,
  };
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
  const entries = comments.map((comment) => ({ id: comment.id, ...entryOf(comment) }));
  return new Set(shapedThread(entries, readers).comments.map((entry) => entry.id));
}

/**
 * The raw comment list, oldest first, as the API returns it.
 *
 * One read shared by every reader here: the shaped readers fold it, the guard walks it,
 * and the dispatch freshness probe scans it. Throws when the read fails — every caller
 * is deciding whether to keep a comment out of a race or whether to start a run, so an
 * answer nobody could determine must not be the one that lets work through.
 */
function listComments(repo: string, number: string | number): Comment[] {
  const listed = ghRead("api", `repos/${repo}/issues/${number}/comments`, "--paginate");
  if (listed.code !== 0) throw new Error(`could not read comments on #${number}: ${listed.stderr || listed.stdout}`);
  // `--paginate` writes one JSON array per page back to back, so from the second page
  // on the stream is not one JSON document and `JSON.parse` throws on it — a node with
  // more than one page of comments read as an unreadable thread, and every reader here
  // answers an unreadable thread by standing down. Split the pages and flatten, the
  // way `ghPaginated` does; this read keeps `ghRead` rather than `ghPaginated` because
  // it is the retrying kind (see `splitConcatenatedJson` for the split of labour).
  const pages = splitConcatenatedJson(listed.stdout);
  const flat: Comment[] = [];
  for (const page of pages) {
    if (Array.isArray(page)) flat.push(...(page as Comment[]));
  }
  return flat;
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
function readComments(repo: string, number: string | number, excludeCommentId?: string | number): ShapedThread<DatedEntry> {
  const excluded = String(excludeCommentId ?? "").trim();
  const comments: DatedEntry[] = listComments(repo, number)
    .filter((comment) => String(comment.id) !== excluded)
    .map(entryOf);

  return shapedThread(comments, readers);
}

/**
 * A node's body and its shaped comments, read from GitHub.
 *
 * The one read every question below starts from. `excludeCommentId` drops a comment
 * from the read — `requestOutstandingOn` uses it so a dispatch does not count its own
 * marker's request as the one it would be refusing.
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
 * The rule is `shapedThread`'s, applied to the whole thread in order: a person's comment
 * is removed when the ball was already with an agent WHEN IT ARRIVED. So the comment is
 * judged at its own position in that walk, not by removing it and asking whose turn the
 * rest leaves. Judged by exclusion, a `/agent` command posted seconds AFTER the comment
 * being judged moved the turn first, and an ordinary comment written on a person's turn
 * was deleted for racing a run that started after it was written (#206).
 *
 * When the comment is in the listing, the answer is whether the shaping keeps it — the
 * same walk `keptCommentIds` gives the context builder, so the guard and the run's own
 * context cannot disagree about a comment that is on the page.
 *
 * When it is NOT, GitHub's read has not caught up with the write: the comment being
 * judged is newer than everything the listing shows (read-after-write is not
 * guaranteed; `MarkerCheck` has the same fact from the dispatch side). Taking "absent"
 * as "kept" would open the very window this guard exists to close, so the fallback
 * judges it as the latest arrival — whose turn the whole listed thread leaves.
 *
 * COMMENTS ONLY, never the body. A pull request body naming a reviewer is a request the
 * validation dispatch is already handling, and counting it would delete a person's
 * comment on the strength of a request their comment was not racing.
 */
export function commentWouldBeRemoved(repo: string, number: string | number, commentId: string | number): boolean {
  const comments = listComments(repo, number);
  const listed = comments.find((comment) => String(comment.id) === String(commentId));
  if (listed === undefined) {
    // Read-after-write lag: the comment being judged is newer than the listing. Judge
    // it as the latest arrival, which is whose turn the whole listed thread leaves.
    const entries = comments.map(entryOf);
    return whoseTurn(shapedThread(entries, readers).events) === "agent";
  }
  return !keptCommentIds(comments).has(listed.id);
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
 * The node's BODY is deliberately not read, unlike `latestRequestOn`. A pull
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
  const comments = listComments(repo, number);

  const marker = String(markerId);
  const markerVisible = comments.some((comment) => String(comment.id) === marker);
  const entries: ThreadEntry[] = comments
    .filter((comment) => String(comment.id) !== marker)
    .map(entryOf);

  return { markerVisible, outstanding: requestOutstanding(shapedThread(entries, readers).events) };
}

/** What an answers-request dispatch learns from one read of the thread. */
export interface LastTurnRead {
  /**
   * Whether the comment the caller named as its freshness probe is in the listing yet,
   * or `undefined` when it named none. The same instrument the dispatch marker is for
   * `MarkerCheck`: while the caller's own recent write is not visible, the read has not
   * caught up, and an answer judged on it is an answer about an older thread.
   */
  probeVisible: boolean | undefined;
  /** The newest turn event in the shaped thread, or `undefined` when it carries none. */
  last: TurnEvent | undefined;
  /**
   * The agent the newest event belongs to, when it is a `returned` verdict whose
   * comment names its author (`AGENT_TAG`) — the fact that separates the dispatch that
   * would re-deliver a verdict already in the thread from the one that answers a fix
   * another agent just pushed (#283). `undefined` for every other event, and for a
   * verdict whose comment names nobody.
   */
  lastAgent: string | undefined;
}

/**
 * Read a node's thread once and answer what an answers-request dispatch judges on.
 *
 * `answersRequest` claims the request this dispatch fulfils is the thread's own to
 * still be waiting for; the claim is the caller's, and this read is what makes it
 * checkable — see `adapters/actions/dispatch.ts`, which owns the judgement. The probe
 * is the caller's just-written comment, when it has one (`reload_environment`'s
 * handoff comment): until the listing shows it, the read may predate the write the
 * `handed-off` answer rests on, and judging then would judge the thread as it stood
 * before the caller spoke. Shaped like every other read, so a comment the guard is
 * removing cannot be the event the answer turns on. Throws when the read fails, like
 * every other reader here.
 */
export function readLastTurnEvent(
  repo: string,
  number: string | number,
  probeId?: string | number,
): LastTurnRead {
  const comments = listComments(repo, number);
  const entries = comments.map(entryOf);
  const shaped = shapedThread(entries, readers);
  const last = shaped.events[shaped.events.length - 1];
  const probe = probeId === undefined ? undefined : String(probeId);
  return {
    probeVisible: probe === undefined ? undefined : comments.some((comment) => String(comment.id) === probe),
    last,
    // Only a `returned` verdict is attributed: `asked` is refused without asking who
    // made it, and the other events name no agent to attribute.
    lastAgent:
      last === "returned" ? AGENT_TAG.read(newestEventBody(entries, readers) ?? "") : undefined,
  };
}

/**
 * The two answers the validation routing asks of one thread.
 *
 * The body is read for both, because a pull request's body IS a request — the
 * `/<agent>` line `create_pr` writes. It is the oldest entry, so a person's later
 * comment wins over it, which is the point: the body is what the node was opened
 * asking for, and a comment is what somebody is asking for now. It is the fallback
 * for `newestRequestedAgent` and never an answerable ask — see `LatestAsk`.
 */
export interface ThreadRequest {
  /**
   * The agent the thread's newest request names — a dispatch marker included — with
   * the body's own `/<agent>` line as the fallback. This is the routing default: who
   * works next when nothing has answered the request yet.
   */
  newestRequestedAgent: string;
  /**
   * The newest ask a person or an agent made, with who made it and when. Undefined
   * when the newest ask is the body's own line, a dispatch marker, or machinery the
   * thread does not identify. This is the ask a push can answer: when the
   * pull request's head commit postdates it, the push is the answer, and the verdict
   * hands back to `author` rather than to `newestRequestedAgent`.
   *
   * See `domain/work/pr-validation.ts` for the routing, `domain/work/thread.ts`'s
   * `latestAsk` for why markers and the body are excluded.
   */
  latestAsk?: LatestAsk;
}

/**
 * Read a node's thread once and answer both request questions the routing asks of it.
 *
 * One read, not two, because both answers come from the same listing — the same
 * argument `checkDispatchMarker` makes, and for the same reason: the API has a rate
 * limit, and a validation runs on every push to every agent pull request.
 *
 * `isKnownAgent` filters the name each answer routes by: a name with no definition is
 * skipped rather than returned, so a typo falls back to the next request instead of
 * dispatching nobody. It does not filter the ASK's author — that agent ran, so it has
 * a definition by construction.
 */
export function latestRequestOn(
  repo: string,
  number: string | number,
  isKnownAgent: (name: string) => boolean,
): ThreadRequest {
  const { body, shaped } = readThread(repo, number);
  // A name with no definition cannot be dispatched, so each answer routes by the
  // nearest name that can.
  const known = (name: string): string => (isKnownAgent(name) ? name : "");
  return {
    // The standing request keeps the strict read: it is what a dispatch will act on,
    // and one name for it means the dispatch acts on what was actually asked.
    newestRequestedAgent: latestRequestedAgent(body, shaped.comments, {
      ...readers,
      requestedAgent: (text) => known(readers.requestedAgent(text)),
    }),
    // The ask is read the way the HANDOFF was read -- see `askReaders`. A directive
    // the runner dispatched must be the same directive a push is seen to answer.
    latestAsk: latestAsk(body, shaped.comments, {
      ...askReaders,
      requestedAgent: (text) => known(askReaders.requestedAgent(text)),
    }),
  };
}
