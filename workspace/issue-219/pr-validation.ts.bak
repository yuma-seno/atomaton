/**
 * pr-validation.ts — decides what a pull request's validation run means: whether
 * it passed, who works next, and what to say about it.
 *
 * The decision half of the pair whose I/O half is `scripts/validate_pull_request.ts`.
 * Everything here is a pure function of a conclusion string, a count, and the one
 * thread fact routing needs -- the newest ask and when it was made -- so the whole
 * truth table is testable without a `gh` in the loop. The same split
 * `domain/delivery/merge-readiness.ts` uses.
 */
import type { AskAuthor, LatestAsk } from "./thread.ts";
import type { NextTurn } from "./turn.ts";

/** Conclusions GitHub reports for a completed run that should count as passing. */
const PASSING = new Set(["success", "skipped", "neutral"]);

/**
 * How many times validation may hand the same pull request back to the engineer.
 *
 * Bounds a loop nothing else bounds. `manage_dispatch_loop.ts`'s counter only
 * advances on a directive an agent wrote, and here the engineer is dispatched by
 * a workflow, so failing CI would otherwise cycle forever at the cost of a model
 * run per turn. Three is enough for a fix that needed another look and few enough
 * that a genuinely stuck pull request reaches a human quickly.
 */
export const CI_RETRY_LIMIT = 3;

/**
 * What this validation run concluded, as one of five distinguishable answers.
 *
 * `passed`                CI is green; the reviewer works next.
 * `failed`                CI is red and the engineer gets another attempt.
 * `no-conclusion`         the run timed out, was cancelled, or could not be found.
 * `retries-exhausted`     red again after `CI_RETRY_LIMIT` attempts; stop.
 * `deliverable-invalid`   the pull request would merge a `.github/atomaton/` that
 *                        cannot start a run, so CI was never dispatched.
 */
export type ValidationVerdict = "passed" | "failed" | "no-conclusion" | "retries-exhausted" | "deliverable-invalid";

export interface ValidationOutcome {
  /**
   * What the run concluded.
   *
   * Returned rather than left for the caller to work out, because the caller
   * worked it out wrongly. It ran `checks.every((c) => c.conclusion === "success")`,
   * and `checks` holds one entry per required context — so on a base branch that
   * requires no status checks, `checks` is `[]`, `every()` is `true`, and a
   * failing CI run was read as a passing one.
   *
   * That case is not hypothetical: `validate_pull_request.ts` treats an empty
   * required list as legitimate and only warns. The consequences chained. The
   * failure comment was skipped while `nextAgent` still said `engineer`, so the
   * engineer was dispatched with no brief, no summary and no failing-run URL —
   * and that same comment is the retry tally, so `priorRetries` stayed at zero
   * and `CI_RETRY_LIMIT` could never fire. The engineer/CI loop this constant
   * exists to bound ran unbounded, one model run per turn.
   *
   * `adapters/github/branch-rules.ts` records the same `[].every()` defect being fixed once
   * already. It was fixed at the input — "we could not read the required checks"
   * — and this is the other half: we read them, and there are none.
   */
  verdict: ValidationVerdict;
  /**
   * Who runs next, when anybody does. Absent hands back to a person.
   *
   * It was `nextAgent: string`, where `""` meant nobody — the spelling of absence
   * this domain kept reaching for and the one that reads as a name until you
   * check. `NextTurn` is the same edge `domain/work/turn.ts` names when a run
   * hands off, which is what this is: the validation is a turn on the pull
   * request, and this is who it gives it to.
   */
  next?: NextTurn;
  /** One line for the comment that accompanies a hand-back to the engineer. */
  summary: string;
}

/**
 * The run being judged, and who is available to work on it.
 *
 * An object rather than positional parameters because `reviewerAgent` and
 * `engineerAgent` are adjacent, same-typed, and mean opposite things: swapping
 * them type-checks, passes nothing, and inverts every routing decision this
 * function makes.
 *
 * ## Where the two names come from
 *
 * Neither is a setting and neither is a literal. `reviewerAgent` is what the pull
 * request asks for -- the `/<agent>` line in its own body, which is the same line a
 * person would type. `engineerAgent` is who opened it, from the
 * `atomaton:origin-agent` tag. Both are read from the pull request, so a project
 * that renames an agent gets the new name everywhere without touching this file.
 *
 * Either may be empty, and empty is a real answer: nobody was asked. The verdict
 * then dispatches nobody and the caller tells a person, which is the one outcome
 * that cannot be silently wrong.
 */
export interface ValidationInput {
  /** GitHub's own conclusion for the dispatched run. Empty means it never reached one. */
  conclusion: string;
  /** Agent to dispatch when CI passes, from the pull request's own `/<agent>` line. */
  reviewerAgent: string;
  /** Agent to dispatch when CI fails and retries remain, from `atomaton:origin-agent`. */
  engineerAgent: string;
  /**
   * Whether the run being judged was asked for by a person rather than by an agent.
   *
   * It decides who a FAILED check goes back to, and the two answers are different
   * on purpose. An agent that opened a pull request and broke CI is the one that
   * should fix it -- it has the context and it is already in the loop. A person who
   * asked for a run and got a red check is owed the answer themselves: handing
   * their request to an agent would be the machinery deciding on their behalf, and
   * the agent would be working from a request it did not make.
   *
   * So a person's failed run dispatches nobody, and the caller mentions them.
   */
  askedByPerson?: boolean;
  /** How many times this pull request has already been handed back. */
  priorRetries?: number;
  /**
   * Ways the pull request's own `.github/atomaton/` is inconsistent, from
   * `validate_deliverable.ts`. Empty is the normal case.
   *
   * Non-empty means CI was never dispatched, and the `conclusion` field is
   * therefore empty for a reason that has nothing to do with a run timing out.
   * That is why this is judged before `conclusion` is looked at: read in the
   * other order, a broken deliverable would report as `no-conclusion` — a
   * verdict that deliberately dispatches nobody, because there is no defect to
   * hand anyone. Here there is one, and its author is the agent that just wrote it.
   */
  deliverableProblems?: readonly string[];
  /**
   * The newest ask in the thread that a push could answer -- a person's command or
   * an agent's hand-off directive -- with who made it and when. Absent when the
   * newest ask is the pull request body's own `/<agent>` line, a dispatch marker,
   * or machinery the thread does not identify.
   *
   * This is what makes a fix request consumable. The reviewer asks the engineer to
   * fix something; the engineer's push is the answer; the next green validation
   * must hand the answer back to the reviewer rather than re-run the engineer on a
   * request it already fulfilled -- which is what kept #211's pull request green
   * and unattended, the thread's newest request still naming the engineer the
   * fix had been asked OF. See `answeredByPush`.
   */
  latestAsk?: LatestAsk;
  /**
   * When the pull request's head commit was created, or empty when it could not be
   * read. The push this validation judges produced that commit, so "the commit is
   * newer than the ask" is how a push is recognised as the answer to one.
   */
  headCommittedAt?: string;
}

/**
 * Whether the required contexts are written as passing.
 *
 * One rule, in one direction: a context passes when the verdict is `passed` and on
 * no other verdict. It used to be a list of check runs on the outcome, one per
 * context, each carrying this same answer — so the outcome restated the verdict
 * once per required context, and the caller could read either.
 *
 * It read the wrong one. `checks.every((c) => c.conclusion === "success")` is
 * `true` for the empty list a base branch with no required checks produces, so a
 * failing run was taken for a passing one: no comment was posted, the engineer was
 * dispatched with no brief, and the tally that bounds that loop never advanced.
 * See `ValidationOutcome.verdict` for what that cost.
 *
 * A field derivable from another field is a second answer to one question. This is
 * the derivation, named, and the caller writes the check runs from it.
 */
export function contextsPassed(verdict: ValidationVerdict): boolean {
  return verdict === "passed";
}

/**
 * Whether the push this validation judged answers the newest ask, and who made it.
 *
 * A push answers an ask when the commit it produced is NEWER than the ask: the ask
 * asked for work, and the commit is work that did not exist when the ask was made.
 * A commit the ask postdates was already there when the ask was made -- the ask was
 * made ABOUT it, re-review it or fix it again -- and stands, whoever made it.
 *
 * Either timestamp missing or unreadable is "not answered", and so is a tie: the
 * standing request keeps routing, which is the behaviour that predated this
 * question. Unknown is not old.
 *
 * What the ask NAMES does not gate this, only who made it. The realistic asks are
 * fix requests -- a reviewer's directive at the engineer, a person's command at the
 * engineer -- and their author is exactly who the answer belongs to; the body's own
 * line, the one ask a push must never consume, never reaches here as a
 * `latestAsk` at all.
 */
function answeredByPush(latestAsk: LatestAsk | undefined, headCommittedAt: string | undefined): AskAuthor | undefined {
  if (!latestAsk?.at || !headCommittedAt) return undefined;
  const askAt = Date.parse(latestAsk.at);
  const commitAt = Date.parse(headCommittedAt);
  if (Number.isNaN(askAt) || Number.isNaN(commitAt)) return undefined;
  return commitAt > askAt ? latestAsk.author : undefined;
}

/**
 * The hand-off, or nothing when the caller has nobody configured for the role.
 *
 * An unset `reviewerAgent` or `engineerAgent` is a project that has not named one,
 * and a hand-off to the empty string is the bug that shape invites: it reads as a
 * dispatch right up to the moment something tries to run an agent called "".
 */
function handTo(agent: string): { next?: NextTurn } {
  const named = agent.trim();
  return named === "" ? {} : { next: { agent: named } };
}

/**
 * Translate a completed CI run into a verdict, who works next, and one sentence.
 *
 * An empty `conclusion` — the run timed out, was cancelled, or could not be
 * found — is deliberately NOT treated as a failure to hand to the engineer:
 * there is no defect to fix, and dispatching one would spend a model run
 * discovering that. It writes a failing check, which blocks the merge, and
 * stops — `contextsPassed` is what makes that check a failing one. A human reads
 * the pull request and decides.
 */
export function decideValidationOutcome(input: ValidationInput): ValidationOutcome {
  const { conclusion, reviewerAgent, engineerAgent, askedByPerson = false, priorRetries = 0, headCommittedAt } = input;

  // Judged first, and treated exactly as a red CI run: failing checks so the
  // merge is blocked, a comment so the engineer knows what to fix, and the same
  // retry bound. Failing the workflow step instead would have written no check at
  // all, which leaves the required context pending forever and dispatches nobody
  // — a pull request only a human can rescue, for a mistake an agent makes in the
  // ordinary course of editing its own tool surface.
  //
  // The engineer can act on it because the run that carries it reads its
  // machinery from the default branch, not from this pull request: a broken
  // `.github/atomaton/` here does not stop the agent sent to fix it.
  const deliverableProblems = input.deliverableProblems ?? [];
  if (deliverableProblems.length > 0) {
    const count = `${deliverableProblems.length} problem${deliverableProblems.length === 1 ? "" : "s"}`;
    if (priorRetries >= CI_RETRY_LIMIT) {
      return {
        verdict: "retries-exhausted",
        summary:
          `The deliverable is still not internally consistent (${count}) after ${priorRetries} attempts. ` +
          `Stopping rather than dispatching the engineer again; a human should look.`,
      };
    }
    return {
      verdict: "deliverable-invalid",
      ...handTo(engineerAgent),
      summary: `.github/atomaton/ is not internally consistent (${count}), so CI was not run.`,
    };
  }

  const normalised = conclusion.trim().toLowerCase();
  const passed = PASSING.has(normalised);

  if (passed) {
    // A green run after a fix was pushed does not route by the standing request:
    // the newest ask in the thread is the fix request the push ANSWERED, and
    // routing by it would re-run the agent the fix was asked of -- the #211
    // stall, a green pull request nobody returns to. The answer goes to whoever
    // asked: the reviewer whose directive it was reviews it, and a person's
    // request is owed to the person, which is the same rule a red run already
    // follows through `askedByPerson`.
    const answered = answeredByPush(input.latestAsk, headCommittedAt);
    if (answered) {
      if (answered.kind === "agent") {
        return {
          verdict: "passed",
          ...handTo(answered.agent),
          summary: `CI concluded ${normalised}. The push answered the request ${answered.agent} made, so it is ${answered.agent}'s to judge.`,
        };
      }
      return {
        verdict: "passed",
        summary: `CI concluded ${normalised}. The push answered the request a person made, so nobody is dispatched.`,
      };
    }
    return { verdict: "passed", ...handTo(reviewerAgent), summary: `CI concluded ${normalised}.` };
  }

  if (!normalised) {
    return {
      verdict: "no-conclusion",
      summary: "CI never reported a conclusion. Nothing was dispatched; a human should look.",
    };
  }

  if (priorRetries >= CI_RETRY_LIMIT) {
    return {
      verdict: "retries-exhausted",
      summary:
        `CI concluded ${normalised} after ${priorRetries} attempts at fixing it. ` +
        `Stopping rather than dispatching the engineer again; a human should look.`,
    };
  }

  // A person's failed run goes back to the person. See `askedByPerson`: an agent
  // that broke its own pull request is the one to fix it, and a person who asked
  // for a run is owed the answer rather than a run they did not ask for.
  if (askedByPerson) {
    return {
      verdict: "failed",
      summary: `CI concluded ${normalised}. This run was asked for by a person, so nobody was dispatched.`,
    };
  }

  return {
    verdict: "failed",
    ...handTo(engineerAgent),
    summary: `CI concluded ${normalised}. Returning to the engineer with the failing job.`,
  };
}
