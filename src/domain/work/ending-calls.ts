/**
 * ending-calls.ts — what a run's closing message calls, and whether that is allowed.
 *
 * # The rule
 *
 * People and agents are the same kind of thing here: whoever a run hands the work
 * to holds the ball next, and exactly one of them does. A closing message therefore
 * ends by calling **at most one** thing —
 *
 *   - one agent, as a line holding nothing but `/name`;
 *   - one person, as a single `@login` mention of somebody who can act;
 *   - or nobody at all, in which case the machinery tells the person this work
 *     belongs to.
 *
 * Two calls is not "a hand-off plus a notification": it is two people who both
 * believe they were asked, and work that happens twice or not at all. The prompt
 * states the rule; this is the part that can see whether it was kept.
 *
 * # Why a count of invocations and not a reading of intent
 *
 * A directive line and an `@login` in prose are exactly the two ways a run can make
 * something happen to another participant, and both are already read by the
 * machinery for other purposes (`extract_directive.ts` dispatches on the first,
 * `post_result_comment.ts` notifies on the second). Counting what those two readers
 * recognise keeps the check honest: a line that neither would act on is not a call,
 * and telling an agent it made a call that dispatched nothing would be a lie.
 *
 * Pure: the caller supplies what counts as a callable agent and a callable person.
 */
import { AGENT_NAME_PATTERN } from "./agent-name.ts";
import { lineForms } from "./comment-command.ts";
import { mentionsIn } from "./mention.ts";

const DIRECTIVE = new RegExp(`^\\/(${AGENT_NAME_PATTERN})$`);

export interface EndingCalls {
  /** Agents called, in the order they were named, without repeats. */
  agents: string[];
  /** People called, by the login as written, without repeats. */
  humans: string[];
}

export interface CallableSet {
  /** Whether a definition exists for this name, which is what makes a line dispatch. */
  knowsAgent: (name: string) => boolean;
  /** Logins that are somebody this run may call: a participant, or the work's owner. */
  humans: Iterable<string>;
}

/**
 * Everything the closing message calls, in prose order, agent lines first.
 *
 * Agent lines are read the way `extract_directive.ts` reads them — the same
 * `lineForms` tolerance for a markdown-backticked `/name`, and the same requirement
 * that a definition exists — so a count here and a dispatch there cannot disagree
 * about what a line is.
 */
export function endingCalls(output: string, callable: CallableSet): EndingCalls {
  const agents: string[] = [];
  for (const rawLine of output.split("\n")) {
    for (const candidate of lineForms(rawLine)) {
      const match = DIRECTIVE.exec(candidate);
      if (!match) continue;
      const agent = match[1]!;
      if (!callable.knowsAgent(agent)) continue;
      if (!agents.includes(agent)) agents.push(agent);
    }
  }

  return { agents, humans: calledHumans(output, callable.humans) };
}

/**
 * The people the text calls, by login, without repeats.
 *
 * A mention is a call only when its login is one of `humans`. An unknown `@name` is
 * not a call: `domain/work/mention.ts` escapes it before the comment is posted, so
 * nobody is reached by it, and counting it would reject a message that reaches no one
 * twice.
 *
 * Exported for the result comment, which asks the same question of the text it is
 * about to post — it has already read the participants on its own token, and it must
 * not decide "was this a call" a second, differently-spelled way.
 */
export function calledHumans(text: string, humans: Iterable<string>): string[] {
  const allowed = new Set([...humans].map((login) => login.trim().toLowerCase()).filter(Boolean));
  const called: string[] = [];
  for (const login of mentionsIn(text)) {
    if (!allowed.has(login.toLowerCase())) continue;
    if (called.some((seen) => seen.toLowerCase() === login.toLowerCase())) continue;
    called.push(login);
  }
  return called;
}

/** How many things this message calls. */
function callCount(calls: EndingCalls): number {
  return calls.agents.length + calls.humans.length;
}

/** The calls, as the reader would write them: `` `/engineer`, `@alice` ``. */
function namedCalls(calls: EndingCalls): string {
  return [
    ...calls.agents.map((agent) => `\`/${agent}\``),
    ...calls.humans.map((login) => `\`@${login}\``),
  ].join(", ");
}

/**
 * The sentence naming what is wrong with the message, or `undefined` when it is fine.
 *
 * Written for the agent as much as for the log: it is what the run is handed when it
 * is asked to write the message again, and naming the calls it did make is the only
 * way it can see which of them to keep.
 */
export function endingCallProblem(calls: EndingCalls): string | undefined {
  const count = callCount(calls);
  if (count <= 1) return undefined;
  return `it calls ${count} things: ${namedCalls(calls)}`;
}

/**
 * The message handed back to a run whose closing message broke the rule.
 *
 * A user turn rather than an error: the run is being asked to write the same message
 * again, with the reason. It is injected into the saved session — see
 * `inject_ending_rejection.ts` — so the model reads its own rejected text first and
 * then this, which is why it can say "write it again, whole" and mean it.
 *
 * The last paragraph says what happens if it breaks the rule again, because that is
 * not a threat but a fact: the fallback posts the text with the calls left as
 * marks, and the machinery makes the one call it can still make. A run that knows
 * this can choose the person to notify by simply naming nobody.
 */
export function rejectionMessage(problem: string): string {
  return `Your closing message was not posted, and nothing it named was started or notified.

Your closing message ${problem}. A closing message calls at most one thing:

- one agent, as a line holding nothing but \`/name\`, taken from the colleagues named in your instructions;
- or one person, as a single \`@login\` mention of somebody who is a collaborator or has taken part in this thread;
- or nobody, in which case the machinery tells the person this work belongs to.

Write the closing message again, whole: it is the comment that will be posted. End it by calling one thing, or none. If it still calls more than one, the comment is posted with its calls left as text, none of them made, and the machinery notifies the person itself.`;
}
