/**
 * dispatch-chain.ts — how many times agents have handed work to each other with
 * nobody else saying anything.
 *
 * ## What this replaced, and why it could not fire
 *
 * The count used to live in `session.json`, advanced by `manage_dispatch_loop.ts`,
 * and reset whenever the run saw a new GitHub event. It never reached 1.
 *
 * The reset was meant to say "a person intervened, so start counting again". What
 * it actually said was "anything appeared in the issue" -- and `post_result_comment`
 * posts one comment per run. The next agent in the chain sees the previous agent's
 * result comment as a new event, resets to zero, hands off, and so on. `LOOP_LIMIT`
 * was unreachable, the comment telling a person the chain had stopped could not be
 * posted, and `decide_turn_ending` always received `loop-limit-reached=false`.
 *
 * Its unit tests were green. Three of the four passed `newEventCount = 0`, which
 * the workflow cannot produce: the agent step only runs when `new_event_count != 0`,
 * and when it does not run the loop-control step is skipped along with it. The
 * branch that incremented the counter was covered and unreachable at the same time.
 *
 * ## Counting rather than storing
 *
 * `CI_RETRY_LIMIT` is the only cross-run limit in this repository that works, and
 * its own comment says why: it is "counted from its own comments rather than held
 * anywhere, so it survives a re-dispatch and needs no state of its own".
 *
 * So this does the same. Walk the target's comments from the newest backwards,
 * stop at the first one a person wrote, and count the agent result comments in
 * between. There is no counter to reset, no session field to migrate, and no
 * input a test can pass that the workflow could not.
 *
 * `post_result_comment` runs before the loop-control step, so the current run's own
 * comment is already there and is included. A tally of 1 means "this run, and
 * nothing before it".
 *
 * ## Issue and pull request count separately, on purpose
 *
 * A chain that moves from an issue to a pull request starts again from zero,
 * because the comments are on a different object. That is the right answer rather
 * than a gap: opening a pull request IS progress. The point is to catch repetition
 * that goes nowhere, not to cap how long a legitimate piece of work may take.
 */
import { isHumanActor } from "./actor.ts";
import { resolveLimit } from "./limits.ts";

/** The subset of a GitHub comment this decision reads. */
export interface ChainComment {
  /** `user.type` from the comments API: `"User"`, `"Bot"`, `"Organization"`, ... */
  authorType?: string;
  /** The comment body, which carries the agent tag if an agent wrote it. */
  body?: string;
}

/**
 * How many consecutive handoffs may happen with nobody but agents talking.
 *
 * Five, because the longest chain measured in this repository's history is three,
 * and that history is one where a person intervenes often. Left running on its
 * own the chains get longer, which is why `limits.agent_handoffs` exists -- this is
 * the value for a repository that has not thought about it yet.
 *
 * Exported because the comment a person receives when a chain stops names the
 * number. That sentence used to carry its own literal `5`, so raising the limit
 * would have told them "loop limit (5 consecutive runs) reached" while the real
 * limit was something else, on the one message they get.
 */
export const DEFAULT_HANDOFF_LIMIT = 5;

/**
 * Whether a person wrote this comment.
 *
 * The rule is `domain/work/actor.ts`'s, and it is one rule for the whole repository:
 * a person is anything that is not a bot. It used to be written here as
 * `authorType === "User"`, which read `Organization` as not-a-person while the guard
 * (`whose-turn.ts`) read it as one — two readers, one thread, two answers.
 *
 * The direction is still the cautious one for the cases that matter: a missing or
 * unrecognised type reads as a person, so the tally resets and the limit fires later
 * rather than a person's comment being mistaken for a bot's.
 */
function isPerson(comment: ChainComment): boolean {
  return isHumanActor(comment.authorType);
}

/**
 * Agent result comments since the last one a person wrote.
 *
 * `comments` in the order the API returns them -- oldest first. `isAgentComment`
 * is passed in rather than imported so this stays a pure function of its inputs
 * and the tag format lives in one place (`adapters/github/tags.ts`).
 */
export function handoffsSincePerson(
  comments: readonly ChainComment[],
  isAgentComment: (body: string) => boolean,
): number {
  let handoffs = 0;
  for (let i = comments.length - 1; i >= 0; i--) {
    const comment = comments[i]!;
    // A person's comment ends the walk rather than being counted. Everything
    // before it belongs to a chain that has already been interrupted.
    if (isPerson(comment)) break;
    if (isAgentComment(comment.body ?? "")) handoffs++;
  }
  return handoffs;
}

/**
 * Whether the chain has gone on long enough to stop and ask a person.
 *
 * `>=` rather than `>`: a limit of 5 means five handoffs are allowed and the
 * dispatch that would make a sixth is refused. The run that hits it still finishes
 * and still reports -- only the handoff to the next agent is withheld.
 */
export function handoffLimitReached(handoffs: number, limit: number): boolean {
  return handoffs >= limit;
}

/**
 * A limit from configuration, or the default.
 *
 * The rule is `limits.ts`'s, shared with every other limit in the project: zero and
 * negatives mean the default rather than "no chains allowed". A repository that wants
 * no automatic handoffs at all is `1`, which says so.
 */
export function resolveHandoffLimit(configured: unknown): number {
  return resolveLimit(configured, DEFAULT_HANDOFF_LIMIT);
}
