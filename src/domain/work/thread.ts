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

/** How to read the events out of a body. */
export interface TurnReaders {
  /** Whether a body is an agent's own result comment. */
  isAgentResult: (body: string) => boolean;
  /** Whether that result handed the node to another agent. */
  handedOff: (body: string) => boolean;
  /**
   * Whether that result ended with the run waiting on work under this node.
   *
   * Read instead of `handedOff` for a result comment, because only one of the two can
   * be true and they lead to different answers: `handed-off` is the next agent on THIS
   * node (the ball is the agent's), `waiting` is a child being started (the ball is
   * nobody's until the child reports). See `TurnEvent`.
   */
  waiting: (body: string) => boolean;
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
 * an agent's result nor a request for one is not an event, and reading it as though it
 * were would hand the node back to a person every time somebody said anything.
 *
 * `waiting` is checked first and on its own tag, BEFORE `isAgentResult`. It is written
 * by the session-ending tools (`launch_sub_agent`, `create_pr`) on the comment they
 * already post, and it carries no `AGENT_TAG` -- those runs post no result comment, and
 * tagging theirs as one would file a hand-off with the runs that reported. So it cannot
 * be read through `isAgentResult`, and it is the same body's stronger claim.
 *
 * An agent's result is read before a request, because a result comment may quote a
 * command in its report and the tag is the stronger claim about what the body is.
 */
function eventOf(body: string, readers: TurnReaders): TurnEvent | undefined {
  if (readers.waiting(body)) return "waiting";
  if (readers.isAgentResult(body)) return readers.handedOff(body) ? "handed-off" : "returned";
  if (readers.requestedAgent(body) !== "") return "asked";
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
    const event = eventOf(body, readers);
    if (event !== undefined) events.push(event);
  }
  return events;
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
    const event = eventOf(entry.body, readers);
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
 * Returns "" when nothing in the thread asks for an agent.
 */
export function latestRequestedAgent(body: string, comments: readonly ThreadEntry[], readers: TurnReaders): string {
  const { comments: kept } = shapedThread(comments, readers);
  for (let index = kept.length - 1; index >= 0; index -= 1) {
    const agent = readers.requestedAgent(kept[index]!.body);
    if (agent !== "") return agent;
  }
  return readers.requestedAgent(body);
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
