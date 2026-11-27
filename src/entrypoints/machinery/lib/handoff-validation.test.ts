/**
 * handoff-validation.test.ts — the decision a handoff makes about a pull request's
 * head commit (#632).
 *
 * The rule this pins: a pull request handed to a person must be one they can merge,
 * so a required context that is missing from the head commit (or present and not
 * passing — a held `action_required` run is the shape #632 hit) starts a validation,
 * and everything else starts nothing.
 *
 * The dispatch half is pinned through `manage_turn_labels.test.ts`, which is the
 * script every handoff runs; this file is the decision it makes and the one promise
 * the dispatched validation relies on.
 */
import { describe, expect, test } from "bun:test";
import type { BranchRules } from "../../../adapters/github/branch-rules.ts";
import { decideValidationOutcome } from "../../../domain/work/pr-validation.ts";
import { handoffValidationNeeded, type HandoffSignals } from "./handoff-validation.ts";

const CHECK = "atomaton-check";

function required(contexts: string[] = [CHECK]): BranchRules {
  return { known: true, enforceable: true, contexts, pullRequestRequired: true };
}

function signals(overrides: Partial<HandoffSignals> = {}): HandoffSignals {
  return {
    kind: "pull-request",
    state: "OPEN",
    isDraft: false,
    // What #632's pull request reported: the merge is blocked on a required context.
    mergeStateStatus: "BLOCKED",
    required: required(),
    checks: [],
    ...overrides,
  };
}

const run = (name: string, status: string, conclusion: string | null) => ({ name, status, conclusion });

describe("handoffValidationNeeded", () => {
  test("a required context with no run on the head starts a validation (#632)", () => {
    const decision = handoffValidationNeeded(signals());
    expect(decision.dispatch).toBe(true);
    expect(decision.why).toContain(CHECK);
  });

  // The held run is the shape #632 actually had: `atomaton-check` was on the commit,
  // held at `action_required`, and a completed-but-not-passing check is not a satisfied
  // context. It is not the mirror, and a person cannot merge past it.
  test("a required context held at action_required starts a validation", () => {
    const decision = handoffValidationNeeded(signals({ checks: [run(CHECK, "completed", "action_required")] }));
    expect(decision.dispatch).toBe(true);
  });

  test("a required context that is still running starts a validation", () => {
    expect(handoffValidationNeeded(signals({ checks: [run(CHECK, "in_progress", null)] })).dispatch).toBe(true);
  });

  test("every required context passing starts nothing", () => {
    for (const conclusion of ["success", "neutral", "skipped"]) {
      const decision = handoffValidationNeeded(signals({ checks: [run(CHECK, "completed", conclusion)] }));
      expect(decision.dispatch, conclusion).toBe(false);
    }
  });

  test("a check run of another name does not stand in for a required context", () => {
    expect(handoffValidationNeeded(signals({ checks: [run("some-other-check", "completed", "success")] })).dispatch).toBe(
      true,
    );
  });

  test("an issue is never looked at: nothing merges it", () => {
    expect(handoffValidationNeeded(signals({ kind: "issue" })).dispatch).toBe(false);
  });

  test("a closed pull request is not validated", () => {
    expect(handoffValidationNeeded(signals({ state: "CLOSED" })).dispatch).toBe(false);
    expect(handoffValidationNeeded(signals({ state: "MERGED" })).dispatch).toBe(false);
  });

  test("a draft is not validated", () => {
    expect(handoffValidationNeeded(signals({ isDraft: true })).dispatch).toBe(false);
  });

  // `merge-readiness.ts`'s `CI_WOULD_BE_WASTED`: the commit changes before the person
  // merges it, so a check written now would be written on the wrong commit.
  test("a head commit that is about to change is not validated", () => {
    for (const mergeStateStatus of ["DIRTY", "BEHIND", "DRAFT", "UNKNOWN", "HAS_HOOKS", ""]) {
      const decision = handoffValidationNeeded(signals({ mergeStateStatus }));
      expect(decision.dispatch, mergeStateStatus || "(none)").toBe(false);
    }
  });

  // The other side of the same coin: these are the verdicts in which the commit is
  // final, and the repair is worth making.
  test("the verdicts in which the commit is final are the ones validated", () => {
    for (const mergeStateStatus of ["CLEAN", "UNSTABLE", "BLOCKED"]) {
      expect(handoffValidationNeeded(signals({ mergeStateStatus })).dispatch, mergeStateStatus).toBe(true);
    }
  });

  test("required contexts that cannot be read start nothing", () => {
    const decision = handoffValidationNeeded(
      signals({ required: { known: false, why: "the rules could not be read" } }),
    );
    expect(decision.dispatch).toBe(false);
    expect(decision.why).toContain("could not be read");
  });

  test("a repository that cannot require checks starts nothing", () => {
    const decision = handoffValidationNeeded(
      signals({
        required: { known: true, enforceable: false, contexts: [], pullRequestRequired: false, why: "a free account" },
      }),
    );
    expect(decision.dispatch).toBe(false);
  });

  test("a base branch that requires no status checks starts nothing", () => {
    expect(handoffValidationNeeded(signals({ required: required([]) })).dispatch).toBe(false);
  });

  test("every required context is asked for, not only the first", () => {
    const decision = handoffValidationNeeded(
      signals({
        required: required([CHECK, "lint"]),
        checks: [run(CHECK, "completed", "success")],
      }),
    );
    expect(decision.dispatch).toBe(true);
    expect(decision.why).toContain("lint");
    expect(decision.why).not.toContain(CHECK);
  });
});

/**
 * The promise the dispatch is made on: the validation this starts writes a check and
 * wakes nobody. The turn is with a person, so the verdict lands on a `with-person`
 * hold -- and that hold dispatches no agent, whatever the verdict is.
 */
describe("the validation started at a handoff", () => {
  test("dispatches nobody: the verdict lands with the person holding the turn", () => {
    for (const conclusion of ["success", "failure"]) {
      const outcome = decideValidationOutcome({
        conclusion,
        reviewerAgent: "reviewer",
        engineerAgent: "engineer",
        hold: { kind: "with-person" },
      });
      expect(outcome.next, conclusion).toBeUndefined();
    }
  });
});
