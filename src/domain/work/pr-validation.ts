/**
 * pr-validation.ts — decides what a pull request's validation run means: whether
 * it passed, who works next, and what to say about it.
 *
 * The decision half of the pair whose I/O half is `scripts/validate_pull_request.ts`.
 * Everything here is a pure function of a conclusion string, the one thread fact
 * routing needs, and who the thread's calls name -- so the whole truth table is
 * testable without a `gh` in the loop. The same split
 * `domain/delivery/merge-readiness.ts` uses.
 *
 * ## The one rule the table serves
 *
 * Machinery starts an agent only where a CALL is waiting: a person's command, an
 * agent's hand-off, the `/<agent>` line the pull request was opened with. Where the
 * thread's ball is anywhere else -- a run in flight, a chain already started, a turn
 * a run handed back to a person -- nothing is dispatched, and nothing is posted on
 * the verdict either. The routing used to send a green verdict back to whoever made
 * the newest ask, and a red one to the engineer who opened the pull request, both
 * without a call: the asker was re-run to judge its own answer, and the opener was
 * re-run to fix a failure nobody asked it to fix, in both cases while its own report
 * was still being written.
 *
 * A red verdict meets the same gate as a green one. It used to dispatch on green
 * alone and leave red to a person, through a notice that ended up with nobody to
 * read it: on a release pull request it pinged the repository owner after every run,
 * and on an agent's pull request it repeated what the run that pushed had already
 * said. What tells a person what failed is the failure comment this domain's caller
 * posts; what continues the work is the call the thread carries, red or green.
 */
import type { ThreadHold } from "./thread.ts";
import type { NextTurn } from "./turn.ts";

/** Conclusions GitHub reports for a completed run that should count as passing. */
const PASSING = new Set(["success", "skipped", "neutral"]);

/**
 * What this validation run concluded, as one of four distinguishable answers.
 *
 * `passed`               CI is green; the call the thread names works next, where the ball is with one.
 * `failed`               CI is red; the same call works next, where one is waiting, and
 *                        the failure comment tells a person what broke.
 * `no-conclusion`        the run timed out, was cancelled, or could not be found.
 * `deliverable-invalid`  the pull request would merge a `.github/atomaton/` that
 *                        cannot start a run, so CI was never dispatched.
 */
export type ValidationVerdict = "passed" | "failed" | "no-conclusion" | "deliverable-invalid";

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
   * and the failure comment was the retry tally, so nothing bounded the loop the
   * verdict used to feed. This constant is the `[]-every()` lesson's other half:
   * we read the checks, and there were none.
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
  /** One line saying what the verdict concluded and who it went to. */
  summary: string;
}

/**
 * The run being judged, and what the thread says about who holds the ball.
 *
 * An object rather than positional parameters because `reviewerAgent` and
 * `engineerAgent` are adjacent, same-typed, and mean opposite things: swapping
 * them type-checks, passes nothing, and inverts every routing decision this
 * function makes.
 *
 * ## Where the two names come from
 *
 * Neither is a setting and neither is a literal. `reviewerAgent` is what the pull
 * request asks for -- the `/<agent>` line in its own body, or the newer call a
 * comment made. `engineerAgent` is who opened it, from the `atomaton:origin-agent`
 * tag. Both are read from the pull request and its thread, so a project that
 * renames an agent gets the new name everywhere without touching this file.
 *
 * Neither dispatches on its own: `reviewerAgent` runs only where the hold says a
 * call is waiting (`free` or `parked`), and `engineerAgent` is never dispatched at
 * all -- it is the name the failure comment offers, the agent a person can ask for.
 *
 * Either may be empty, and empty is a real answer: nobody was named. The verdict
 * then dispatches nobody, and the failure comment is the only thing left that can
 * say who a person could ask for the work.
 */
export interface ValidationInput {
  /** GitHub's own conclusion for the dispatched run. Empty means it never reached one. */
  conclusion: string;
  /** The agent the thread's newest call names: the body's `/<agent>` line, or a comment's. */
  reviewerAgent: string;
  /** The agent that opened the pull request, from `atomaton:origin-agent` -- the name the failure comment offers. */
  engineerAgent: string;
  /**
   * Where the ball sits when the verdict lands, from `threadHold`.
   *
   * The gate on every verdict's dispatch. A call waiting for the work (`free`)
   * and the park that promised the machinery would collect it (`parked`) let the
   * standing request run; a run in flight, a chain already started, or a turn
   * handed back to a person start nothing. Absent reads as `with-person` -- the
   * direction that starts nothing, which is the side that cannot start a run
   * nobody asked for.
   */
  hold?: ThreadHold;
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
 * The sentence fragment that says who can be asked for the fix, when a name exists.
 *
 * `engineerAgent` -- the pull request's origin agent -- is never dispatched by this
 * verdict; it is the name a person needs when the verdict dispatches nobody. Empty,
 * the whole clause goes: a person's own pull request has nobody to suggest.
 */
function askFor(engineerAgent: string): string {
  const named = engineerAgent.trim();
  return named === "" ? "" : ` Comment /${named} on this pull request to ask for it.`;
}

/**
 * Translate a completed CI run into a verdict, who works next, and one sentence.
 *
 * The same gate on every verdict that has work behind it: where the thread's ball is
 * a call waiting for this answer (`free`, or the `parked` whose collection this
 * validation is), the agent that call names works next. Everywhere else -- a run in
 * flight, a chain already carrying the call, a turn handed back to a person, a thread
 * that could not be read, or a call that names nobody -- nothing is dispatched.
 *
 * Red meets that gate like green, and did not always. It dispatched nobody on the
 * theory that the failure was a person's to route, and told them so through a notice
 * of its own; a person who had already asked for the fix got the notice instead of
 * the fix. What a red verdict owes a person is what broke, which is the failure
 * comment this domain's caller posts, and what it owes the work is the call the
 * thread is holding.
 *
 * An empty `conclusion` — the run timed out, was cancelled, or could not be
 * found — is deliberately NOT treated as a failure to hand to the engineer:
 * there is no defect to fix, and dispatching one would spend a model run
 * discovering that. It writes a failing check, which blocks the merge, and
 * stops — `contextsPassed` is what makes that check a failing one. A human reads
 * the pull request and decides.
 */
export function decideValidationOutcome(input: ValidationInput): ValidationOutcome {
  const { conclusion, reviewerAgent, engineerAgent } = input;

  // The one gate every verdict below reads. Absent is a caller that could not
  // answer, and it reads as `with-person` -- the direction that starts nothing,
  // which is the side that cannot start a run nobody asked for.
  const hold = input.hold ?? ({ kind: "with-person" } as const);
  const callWaiting = hold.kind === "free" || hold.kind === "parked";
  const next = callWaiting ? handTo(reviewerAgent) : {};
  // Whether the work was actually handed on. Not the same question as `callWaiting`:
  // a call that names nobody starts nothing either, and then the failure comment is
  // the only thing that can carry a name.
  const handedOn = next.next !== undefined;

  // Judged first, and treated as the red CI run it stands in for: failing checks so
  // the merge is blocked, a comment so whoever acts next has the problems at once.
  // Failing the workflow step instead would have written no check at all, which
  // leaves the required context pending forever — a pull request only a human can
  // rescue, for a mistake an agent makes in the ordinary course of editing its own
  // tool surface.
  const deliverableProblems = input.deliverableProblems ?? [];
  if (deliverableProblems.length > 0) {
    const count = `${deliverableProblems.length} problem${deliverableProblems.length === 1 ? "" : "s"}`;
    const headline = `.github/atomaton/ is not internally consistent (${count}), so CI was not run.`;
    return {
      verdict: "deliverable-invalid",
      ...next,
      summary: handedOn ? headline : `${headline}${askFor(engineerAgent)}`,
    };
  }

  const normalised = conclusion.trim().toLowerCase();
  const passed = PASSING.has(normalised);

  if (passed) {
    if (handedOn) {
      return { verdict: "passed", ...next, summary: `CI concluded ${normalised}.` };
    }
    // Every state that hands the turn elsewhere, named: the summary is a step output
    // and, for these verdicts, the whole of what this run says about itself.
    const because: Record<ThreadHold["kind"], string> = {
      free: "the thread names no agent to start",
      parked: "the thread names no agent to start",
      "in-flight": "a run already holds this pull request, and its own report is the thread's next word",
      chain: "the thread's newest word handed the work to another agent, and that call is the chain's to carry",
      "with-person": "the thread's newest word handed the turn back to a person",
      unreadable: "the thread could not be read to rule out a run in flight",
    };
    return {
      verdict: "passed",
      summary: `CI concluded ${normalised}, and nothing was dispatched: ${because[hold.kind]}.`,
    };
  }

  if (!normalised) {
    return {
      verdict: "no-conclusion",
      summary: "CI never reported a conclusion. Nothing was dispatched; a human should look.",
    };
  }

  // Red. The failing-run URL and the checks ride on the comment this verdict's caller
  // posts, so a dispatched run gets the one line and reads the comment for the rest.
  // The automatic retry this replaced started the opener without a call, on a verdict
  // nobody had asked it to act on.
  return {
    verdict: "failed",
    ...next,
    summary: handedOn
      ? `CI concluded ${normalised}.`
      : `CI concluded ${normalised}. Nobody was dispatched to fix it.${askFor(engineerAgent)}`,
  };
}
