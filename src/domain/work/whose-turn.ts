/**
 * whose-turn.ts — whether the ball is with an agent or with a person, read from a
 * node's thread.
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
  /** An agent handed the node to another agent. */
  | "handed-off"
  /** An agent finished and gave the node back to a person. */
  | "returned";

/** Who holds a node's turn. */
export type TurnHolder = "agent" | "person";

/** How to read the three events out of a body. */
export interface TurnReaders {
  /** Whether a body is an agent's own result comment. */
  isAgentResult: (body: string) => boolean;
  /** Whether that result handed the node to another agent. */
  handedOff: (body: string) => boolean;
  /** Whether a body asks for an agent: a `/agent` command, or a dispatch marker. */
  asksForAgent: (body: string) => boolean;
}

/**
 * The turn-changing events in a thread, oldest first.
 *
 * A body that is neither an agent's result nor a request for one is not an event:
 * ordinary discussion does not move the turn, and reading it as though it did would
 * hand the node back to a person every time somebody said anything.
 *
 * An agent's result is read before a request, because a result comment may quote a
 * command in its report and the tag is the stronger claim about what the body is.
 */
export function turnEvents(bodies: readonly string[], readers: TurnReaders): TurnEvent[] {
  const events: TurnEvent[] = [];
  for (const body of bodies) {
    if (readers.isAgentResult(body)) {
      events.push(readers.handedOff(body) ? "handed-off" : "returned");
    } else if (readers.asksForAgent(body)) {
      events.push("asked");
    }
  }
  return events;
}

/**
 * Whose turn it is, from the events in the order they happened.
 *
 * The last event decides. An empty thread is a person's: nothing has been asked for,
 * so there is nothing for an agent to be doing.
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
 * Read from comments alone, never the node's body. A pull request body naming a
 * reviewer is the request the validation dispatch exists to fulfil, so counting it
 * would refuse the one dispatch that should happen.
 */
export function requestOutstanding(events: readonly TurnEvent[]): boolean {
  return events[events.length - 1] === "asked";
}
