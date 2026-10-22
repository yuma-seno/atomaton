/**
 * thread.ts — a node's thread: the events in it, whose turn they leave it with, and
 * the agent it asks for.
 *
 * ## The question
 *
 * One node holds one turn. A person asks for an agent, the agent works, and the agent
 * either hands the node to another agent or gives it back. Between those moments the
 * node is the agent's, and a comment a person makes then would reach the agent
 * mid-turn as though it had been part of the conversation all along.
 *
 * `guard_comment_during_run.ts` is what acts on the answer. It used to read the
 * `atomaton/in-progress` label, which the runner sets — so between a person's command
 * and the runner starting, the label is absent and the guard is off. That window is
 * minutes long on a pull request, where a command goes through validation and CI
 * before any agent starts.
 *
 * ## Why the thread answers it
 *
 * The label is a cache of this answer, written late. The thread is the answer itself,
 * and it is written at the moment the turn changes:
 *
 *   - a person's `/agent` command, a pull request body naming a reviewer, or a
 *     dispatch onto a sub-issue is the node being handed to an agent
 *   - an agent's result comment that handed off is the same thing one turn later
 *   - an agent's result comment that did not is the node coming back
 *
 * So the last of those events decides, and the label is left to do what it is good at
 * — showing a person, at a glance, that a run is going.
 *
 * ## Pure
 *
 * The tag formats live in `adapters/github/tags.ts` and the command syntax in
 * `parse_comment_command.ts`; both reach here as readers, so this module is a fold
 * over strings and nothing else.
 */

/** One thing that happened on a node, as far as this question is concerned. */
export type TurnEvent =
  /** The node was handed to an agent: a `/agent` command, or a dispatch. */
  | "asked"
  /** An agent handed the node to another agent, which runs on THIS node. */
  | "handed-off"
  /**
   * An agent finished by starting work UNDER this node, and waits for it.
   *
   * `launch_sub_agent` files children and `create_pr` opens a pull request; the run
   * ends inside that call, so no result comment follows. This event is how that
   * ending reaches the thread.
   *
   * Distinct from `handed-off`, which is the next agent taking THIS node. Here the
   * next work is on a child, and the node itself is only waiting — so a person may
   * still comment on it (it is not mid-turn), and `whoseTurn` gives it back to them.
   * Without this event the node fell back to the `asked` that started the run, and
   * the aggregation gate read that as "a request nobody has taken up" and refused to
   * re-invoke the parent.
   */
  | "waiting"
  /** An agent finished and gave the node back to a person. */
  | "returned";

/** Who holds a node's turn. */
export type TurnHolder = "agent" | "person";

/**
 * How to read the events out of a body.
 *
 * ## Why the ending, and not "is this a result comment"
 *
 * The event a body is used to be derived from `isAgentResult` -- an `atomaton:agent`
 * tag meant `returned` or `handed-off`, and nothing else could be either. That put the
 * result comment in charge of "how the turn ended", and there are bodies that end a
 * turn and are NOT result comments: the failure notice (`report_run_failure.ts`) gives
 * the node back to a person, and `launch_sub_agent`/`create_pr` leave it waiting on a
 * child. Neither carries `atomaton:agent` (tagging them as results would file a
 * failure with the runs that reported), so neither was read as an event at all, and
 * the node's last event stayed the `asked` that started the run.
 *
 * `ending` is the tag that means "how this run ended" -- `atomaton:ended`, written on
 * every body that ends a turn -- so it is what decides. A body with no ending is not
 * an ending, whatever else it carries.
 *
 * `requestedAgent` stays a separate reader because a request is the one event that is
 * not an ending: a person's `/agent` command, or the machinery's dispatch marker.
 */
export interface TurnReaders {
  /**
   * How this body ended the turn, or "" when it is not an ending.
   *
   * One of `returned`, `handed-off`, `waiting` -- the same three `TurnEvent`s an ending
   * can be, said in the vocabulary of the tag rather than of the fold, so a reader that
   * has the tag does not have to guess which event it implies.
   */
  ending: (body: string) => "returned" | "handed-off" | "waiting" | "";
  /**
   * The agent a body asks for, or "" when it asks for none.
   *
   * One reader, not two. It used to be paired with an `asksForAgent` that answered
   * "does this body ask?" — but that is the same question as "is this name non-empty",
   * so the two parsed every body twice to answer one thing. A body asks for an agent
   * exactly when this returns a name.
   */
  requestedAgent: (body: string) => string;
  /**
   * Whether a body is a dispatch marker the machinery wrote.
   *
   * Distinct from `requestedAgent`, which answers for a person's `/agent` command too.
   * This is the narrower question "did the machinery start a run here", and it is what
   * `wasLaunched` asks.
   */
  isDispatchMarker: (body: string) => boolean;
}

/**
 * One entry in a node's thread, as the shaping needs it.
 *
 * `isHuman` is the one thing a body's text cannot answer, and the shaping cannot do
 * without: the guard deletes a PERSON's comment made while the ball is with an agent,
 * and the machinery's own comments are not that. A dispatch marker is the machinery
 * taking up a request; an agent's result is the turn ending. Only a person can race a
 * run, so only a person's comment is the one that disappears.
 */
export interface ThreadEntry {
  body: string;
  /** Whether a person wrote it, rather than the machinery. */
  isHuman: boolean;
  /**
   * Whether this body is a quotation of somebody else's words.
   *
   * The machinery's notice that preserves a removed person's comment carries the
   * removed text verbatim inside a `<details>` block (`atomaton:quotes`, read by the
   * adapter). The words in it are the REMOVED author's, not the machinery's, and
   * nothing in this fold may take them for the machinery speaking: read as the
   * machinery's, a `/agent` line in the quoted text would name the next agent and a
   * tag the quoted text carries would end the turn -- which hands the deleted comment
   * back the power its deletion existed to take away.
   *
   * Read from the tag, and only on a NON-human comment: a person writing the same tag
   * in their own text is prose about the machinery, and their commands stay theirs.
   */
  quoted?: boolean;
}

/**
 * A node's comments as the guard will leave them, and the events they are.
 *
 * Both halves come out of one walk, because the walk needs the events to decide what
 * to remove and the callers need them to answer their questions. Returning only the
 * comments would make every caller fold the events a second time to ask anything.
 *
 * Generic in the entry, so a caller that carries an id alongside the body gets its own
 * entries back rather than having to match them up again.
 */
export interface ShapedThread<T extends ThreadEntry = ThreadEntry> {
  /** The comments that survive the shaping, oldest first. */
  comments: T[];
  /** The turn-changing events those comments are, oldest first. */
  events: TurnEvent[];
}

/**
 * The turn-changing event a body is, or nothing.
 *
 * One definition, used by both the fold below and the shaping: a body that is neither
 * an ending nor a request for one is not an event, and reading it as though it were
 * would hand the node back to a person every time somebody said anything.
 *
 * A quotation is read BEFORE the ending, and is never one: the quoted text is verbatim,
 * so if it quotes machinery output it carries the tags machinery output carries, and an
 * ending read first would take the notice for the turn the quoted text names. The
 * ending is read next, because an ending's body may quote a command in its report and
 * the ending is the stronger claim about what the body is. See `TurnReaders`.
 */
function eventOf(entry: Pick<ThreadEntry, "body" | "quoted">, readers: TurnReaders): TurnEvent | undefined {
  if (entry.quoted) return undefined;
  const ending = readers.ending(entry.body);
  if (ending !== "") return ending;
  if (readers.requestedAgent(entry.body) !== "") return "asked";
  return undefined;
}

/**
 * The turn-changing events in a thread, oldest first.
 *
 * A body that is neither an agent's result nor a request for one is not an event:
 * ordinary discussion does not move the turn, and reading it as though it did would
 * hand the node back to a person every time somebody said anything.
 */
export function turnEvents(bodies: readonly string[], readers: TurnReaders): TurnEvent[] {
  const events: TurnEvent[] = [];
  for (const body of bodies) {
    const event = eventOf({ body }, readers);
    if (event !== undefined) events.push(event);
  }
  return events;
}

/**
 * The body of the newest comment that is a turn event, or nothing.
 *
 * `shapedThread`'s events say what happened and in what order, but not whose each one
 * was — the fold reduces a comment to its event and the source is dropped. Callers
 * that must attribute an event walk the surviving comments with this and read the tag
 * they need off the body it names: the newest event's source is the newest comment
 * that folds to one, so one backward walk finds it. An answers-request dispatch reads
 * it to attribute a `returned` verdict to the agent that wrote it (#283) — the one
 * question about a thread the events alone cannot answer.
 */
export function newestEventBody(
  entries: readonly (Pick<ThreadEntry, "body" | "quoted">)[],
  readers: TurnReaders,
): string | undefined {
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    if (entry === undefined) break;
    if (eventOf(entry, readers) !== undefined) return entry.body;
  }
  return undefined;
}

/**
 * Whose turn it is, from the events in the order they happened.
 *
 * The last event decides. An empty thread is a person's: nothing has been asked for,
 * so there is nothing for an agent to be doing.
 *
 * `waiting` is a person's turn. The node's own run is over and the ball is with a
 * child, not with this node's agent — so a comment here is a person talking to
 * nobody's turn, which the guard keeps rather than deletes. See `TurnEvent`.
 */
export function whoseTurn(events: readonly TurnEvent[]): TurnHolder {
  const last = events[events.length - 1];
  return last === "asked" || last === "handed-off" ? "agent" : "person";
}

/**
 * Whether a request for an agent is outstanding — asked for, and not yet taken up.
 *
 * This is the question a dispatch asks before it starts a run, and it is narrower than
 * `whoseTurn` in one place that matters. A hand-off is the node being handed to the
 * next agent, so `whoseTurn` reads it as the agent's — but the dispatch that follows a
 * hand-off IS that hand-off being taken up, so it is not an outstanding request. Only
 * `asked` is: a person's command, or a marker from a dispatch that already went out.
 *
 * `waiting` is not outstanding either, and that is the point of it. The `asked` that
 * started the run is still in the thread, but the run took it up and ended inside a
 * child-starting tool — so the request is spent, and the aggregation gate may start
 * the parent again. Reading the old `asked` as outstanding was what refused the
 * parent with `parent-busy` after every orchestrated subtree finished.
 *
 * Read from comments alone, never the node's body. A pull request body naming a
 * reviewer is the request the validation dispatch exists to fulfil, so counting it
 * would refuse the one dispatch that should happen.
 */
export function requestOutstanding(events: readonly TurnEvent[]): boolean {
  return events[events.length - 1] === "asked";
}

/**
 * The thread as it will read once the guard has finished with it.
 *
 * ## Why this exists
 *
 * The guard deletes a person's comment made while the ball is with an agent, and the
 * deletion is not instant: it is a `gh api DELETE` that may fail, and even when it
 * succeeds the comment is on the page until GitHub processes it. Every reader that
 * runs in that window — the guard's own next turn, the validation that resolves who a
 * pull request asks for, the dispatch that checks for a request already outstanding —
 * would otherwise see a comment that is on its way out and read it as though it were
 * staying.
 *
 * So the shaping is one function, and every reader uses it. A comment the guard would
 * remove is removed here too, so no two readers disagree about what the thread says.
 *
 * ## What it removes
 *
 * A person's comment that arrived while the ball was already with an agent — the
 * guard's rule, applied to the whole thread in order: walk it oldest first, and drop
 * each such comment as it is reached. It is any human comment, not only a command: a
 * person's remark made mid-run would otherwise sit unseen until the run finished, and
 * the guard removes it for the same reason it removes a command.
 *
 * A comment that arrives while the ball is with a person is kept — it is the request
 * that starts the next turn, or an ordinary remark that moves nothing.
 *
 * The machinery's own comments are never removed, whatever they say: a dispatch marker
 * is the machinery taking up a request, and an agent's result is the turn ending.
 * Neither is a person racing a run.
 *
 * ## Comments only, never the node's body
 *
 * The body is not a comment and cannot race a run, so it is not an entry here. It is
 * the node's opening statement, and it is read as a request source by
 * `latestRequestedAgent` — but it does not move the turn, which is why a person's
 * later comment wins over it.
 */
export function shapedThread<T extends ThreadEntry>(comments: readonly T[], readers: TurnReaders): ShapedThread<T> {
  const kept: T[] = [];
  const events: TurnEvent[] = [];
  for (const entry of comments) {
    if (entry.isHuman && whoseTurn(events) === "agent") continue;
    kept.push(entry);
    const event = eventOf(entry, readers);
    if (event !== undefined) events.push(event);
  }
  return { comments: kept, events };
}

/**
 * The agent the node asks for, from the newest request in its shaped thread.
 *
 * The newest request is the current one, so this reads newest-first. The node's BODY
 * is the oldest entry in its own thread — it is what the node was opened asking for —
 * so it is the fallback: a person's later `/reviewer` comment wins over the
 * `/engineer` line the body was opened with, which is the whole point.
 *
 * Read from the SHAPED thread, so a comment the guard is removing does not get to name
 * the next agent in the window before it disappears.
 *
 * Quotations are skipped: the notice preserving a removed comment carries the removed
 * text verbatim, and reading a `/agent` line out of it would make the deleted comment
 * name the next agent after all -- the power the guard removed it to take away,
 * handed back through the message that replaced it.
 *
 * Returns "" when nothing in the thread asks for an agent.
 */
export function latestRequestedAgent(body: string, comments: readonly ThreadEntry[], readers: TurnReaders): string {
  const { comments: kept } = shapedThread(comments, readers);
  for (let index = kept.length - 1; index >= 0; index -= 1) {
    const entry = kept[index]!;
    if (entry.quoted) continue;
    const agent = readers.requestedAgent(entry.body);
    if (agent !== "") return agent;
  }
  return readers.requestedAgent(body);
}

/**
 * Who made an ask, as `latestAsk` reports it.
 *
 * A person's command and an agent's hand-off directive are the two asks somebody
 * stands behind: a push that answers either can be handed back to its author. The
 * machinery makes requests too -- the dispatch marker -- but a marker is the
 * machinery TAKING UP an ask rather than one it is making, so there is nobody to
 * return its answer to, and it is no author here.
 */
export type AskAuthor = { kind: "person" } | { kind: "agent"; agent: string };

/** The newest ask in a thread that a push could answer, as `latestAsk` returns it. */
export interface LatestAsk {
  /** The agent the ask names. */
  agent: string;
  /** Who made it -- and who therefore judges the answer to it. */
  author: AskAuthor;
  /**
   * When the ask was written, as the entry carried it. Empty when the entry had no
   * time, which a caller must treat as unreadable rather than as "very old".
   */
  at: string;
}

/**
 * How to read the agent a machinery comment was written by.
 *
 * Extends `TurnReaders` because the question is adjacent to the turn's without
 * being one of it: the runner tags its result comment with the agent that produced
 * it, and that tag's wire format is the caller's (`adapters/github/tags.ts`), not
 * this module's.
 */
export interface AskReaders extends TurnReaders {
  /** The agent the machinery tagged this comment as written by, or "" when it did not. */
  authoringAgent: (body: string) => string;
}

/**
 * The newest ask a person or an agent made in a thread, with who made it and when.
 *
 * ## Why the dispatch markers are not asks
 *
 * `latestRequestedAgent` reads them as requests, and rightly so for the turn: a
 * marker is the node being handed to an agent. But the marker is the machinery
 * taking up a request, not one it is making -- the ask it took up sits in the
 * comment before it. This is the question "who asked, so the answer can be handed
 * back to them", and a marker has no author to hand anything back to. So the walk
 * skips markers and finds the ask underneath: the reviewer's directive, the
 * person's command.
 *
 * ## Why the body is not an ask either
 *
 * The body's `/<agent>` line is the node's standing request: it asks for the work,
 * and a push is part of that work, not an answer to it. Reading it as consumable
 * would hand the pull request back to its opener on every push; the standing
 * request is routed instead by `latestRequestedAgent`, which dispatches the named
 * agent and is the caller's fallback when this returns undefined. Only an ask
 * somebody COMPLETED a turn by making -- a person's command, an agent's directive
 * -- is one a push can answer.
 *
 * ## The one comment that stops the walk
 *
 * Machinery that asks without saying who it is for -- a directive-carrying comment
 * with no authoring tag -- returns undefined rather than being walked past. The
 * asks under it are older, and routing a newer push's answer to an older asker
 * would be wrong in a way dispatching nobody is not. Undefined is the caller's cue
 * to route by the standing request, which is the behaviour that predated this fold.
 *
 * ## Why quotations are skipped
 *
 * The notice preserving a removed person's comment carries the removed text verbatim,
 * and its words are the removed author's -- but the notice itself is the machinery
 * PRESERVING a comment, not making an ask, and the machinery already told the author
 * the comment would not be acted on. Stepped over, the walk finds the ask underneath:
 * the one the removed comment raced. A quotation is an entry like any other here, and
 * never the ask the walk returns.
 *
 * Entries may carry `at` (the comment's creation time). The ask reports it, so the
 * caller can tell an ask the push postdates from one it predates; an entry without
 * one yields an ask with `at: ""`, which the caller must treat as unreadable.
 */
export function latestAsk<T extends ThreadEntry & { at?: string }>(
  body: string,
  comments: readonly T[],
  readers: AskReaders,
): LatestAsk | undefined {
  const { comments: kept } = shapedThread(comments, readers);
  for (let index = kept.length - 1; index >= 0; index -= 1) {
    const entry = kept[index]!;
    if (entry.quoted) continue;
    const agent = readers.requestedAgent(entry.body);
    if (agent === "") continue;
    if (readers.isDispatchMarker(entry.body)) continue;
    if (entry.isHuman) return { agent, author: { kind: "person" }, at: entry.at ?? "" };
    const author = readers.authoringAgent(entry.body);
    if (author === "") return undefined;
    return { agent, author: { kind: "agent", agent: author }, at: entry.at ?? "" };
  }
  return undefined;
}

/**
 * Whether an agent was ever dispatched onto this node, from its thread.
 *
 * The `atomaton/launched` label used to answer this, and it was written BEFORE the
 * dispatch was attempted -- so a dispatch that was refused (a closed target, a request
 * already outstanding) left the label saying "launched" while nothing had been. The
 * dispatch marker is written by `dispatchRunner` itself, and only when it is about to
 * start a run, so the thread is the accurate record.
 *
 * Read from the shaped thread, which is safe because a dispatch marker is the
 * machinery's own comment and the guard never removes one -- so shaping cannot change
 * the answer.
 */
export function wasLaunched(comments: readonly ThreadEntry[], readers: TurnReaders): boolean {
  return comments.some((entry) => readers.isDispatchMarker(entry.body));
}
