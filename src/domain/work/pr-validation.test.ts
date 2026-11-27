import { describe, expect, test } from "bun:test";
import { contextsPassed, decideValidationOutcome } from "./pr-validation.ts";
import type { ThreadHold } from "./thread.ts";

/** The two agents, named once: every case here routes between the same pair. */
const agents = { reviewerAgent: "reviewer", engineerAgent: "engineer" };

/**
 * The hold every case shares unless it says otherwise. A thread whose newest word
 * is an ask nobody took up is the state a green verdict may act in: the standing
 * request is waiting for exactly this delivery.
 */
const free: ThreadHold = { kind: "free" };

const decide = (conclusion: string, hold: ThreadHold = free) =>
  decideValidationOutcome({ conclusion, ...agents, hold });

describe("decideValidationOutcome", () => {
  test("a successful run writes passing checks and hands to the agent the calls name", () => {
    const outcome = decide("success");
    expect(outcome.verdict).toBe("passed");
    expect(contextsPassed(outcome.verdict)).toBe(true);
    expect(outcome.next?.agent).toBe("reviewer");
    // The dispatched run's brief says what happened, and carries no line addressed
    // to a person: the agent reads that context, not a person on the pull request.
    expect(outcome.summary).not.toContain("Comment /");
  });

  // GitHub's own list of conclusions that satisfy a required check, so a job the
  // repository chose to skip must not read as a defect to fix.
  test("skipped and neutral pass like success", () => {
    for (const conclusion of ["skipped", "neutral"]) {
      const outcome = decide(conclusion);
      expect(outcome.verdict, conclusion).toBe("passed");
      expect(outcome.next?.agent, conclusion).toBe("reviewer");
      expect(contextsPassed(outcome.verdict), conclusion).toBe(true);
    }
  });

  // Red takes the same gate as green: a call already waiting for this answer gets
  // the fix run. The automatic retry this replaced started the OPENER without a
  // call, on a verdict nobody had asked it to act on -- and more than once, while
  // its own report was still being written. Neither of those is this: the agent
  // started here is the one the thread asked for, and it is asked for once.
  test("a failing run hands the fix to the call the thread is waiting with", () => {
    const outcome = decide("failure");
    expect(outcome.verdict).toBe("failed");
    expect(contextsPassed(outcome.verdict)).toBe(false);
    expect(outcome.next?.agent).toBe("reviewer");
    expect(outcome.summary).toContain("failure");
  });

  // A person who asked for the engineer asked for the engineer, not for whichever
  // agent opened the pull request: the name is the thread's, not a role default.
  test("a red verdict starts the agent the thread named, not the opener", () => {
    const outcome = decideValidationOutcome({
      conclusion: "failure",
      reviewerAgent: "engineer",
      engineerAgent: "atomaton",
      hold: { kind: "free" },
    });
    expect(outcome.next?.agent).toBe("engineer");
  });

  // The dispatch context is the brief the run starts with, so a line addressed to
  // a person there is read by the agent instead.
  test("a dispatched red verdict's brief invites nobody", () => {
    expect(decide("failure").summary).not.toContain("Comment /");
  });

  test("a red verdict nobody is waiting for names the agent a person can ask", () => {
    const outcome = decide("failure", { kind: "with-person" });
    expect(outcome.next).toBeUndefined();
    expect(outcome.summary).toContain("/engineer");
  });

  test("cancelled and timed_out are red verdicts, not no-conclusion", () => {
    for (const conclusion of ["cancelled", "timed_out"]) {
      expect(decide(conclusion).verdict, conclusion).toBe("failed");
    }
  });

  // No conclusion means the run never reported -- it timed out here, or could not
  // be found. There is no defect for an engineer to fix, and dispatching one
  // spends a model run to discover that. Block the merge and stop: not even a
  // waiting call changes this, because there is nothing to hand it.
  test("no conclusion writes a failing check but dispatches nobody", () => {
    for (const hold of [free, { kind: "parked" } as const, { kind: "with-person" } as const]) {
      const outcome = decide("", hold);
      expect(outcome.verdict, hold.kind).toBe("no-conclusion");
      expect(contextsPassed(outcome.verdict), hold.kind).toBe(false);
      expect(outcome.next, hold.kind).toBeUndefined();
    }
    expect(decide("").summary).toContain("human");
  });

  /**
   * The reason `verdict` exists, and why the check runs are no longer built here.
   *
   * `validate_pull_request.ts` used to ask `checks.every((c) => c.conclusion ===
   * "success")` of a list this function returned, one entry per required context.
   * An empty array answers `true` — so a failing run on a base branch requiring no
   * checks posted no failure comment and dispatched the engineer with no brief.
   *
   * The list is gone: it restated the verdict once per context, and a field
   * derivable from another field is a second answer to one question. Which
   * contexts exist is the caller's to know; whether they pass is this.
   */
  test("how many contexts there are does not reach this decision at all", () => {
    expect(contextsPassed(decide("failure").verdict)).toBe(false);
    expect(decide("failure").verdict).toBe("failed");
  });

  test("conclusions are matched case- and space-insensitively", () => {
    expect(decide("  SUCCESS ").next?.agent).toBe("reviewer");
  });
});

/**
 * The hold is the whole gate on a green verdict: machinery starts an agent only
 * where a call is waiting. Every other state hands the verdict to a mention --
 * which is the rule the routing it replaced broke, by re-starting whoever made
 * the newest ask while that ask's own run was still reporting.
 */
describe("where the ball sits decides whether a green verdict starts anything", () => {
  // The create_pr shape: the run parked the turn on the pull request it opened,
  // and the machinery is the promised collector. The standing request runs.
  test("a parked turn is the machinery keeping its own promise", () => {
    const outcome = decide("success", { kind: "parked" });
    expect(outcome.next?.agent).toBe("reviewer");
  });

  // A run is still working on this node. Starting another over it is what put two
  // runs on #536's thread; the mention waits instead.
  test("a run in flight starts nothing", () => {
    const outcome = decide("success", { kind: "in-flight" });
    expect(outcome.verdict).toBe("passed");
    expect(outcome.next).toBeUndefined();
    expect(outcome.summary).toContain("already holds");
  });

  // The chain named this node's next agent; that call is the chain's to carry.
  test("a hand-off the chain owns starts nothing here", () => {
    const outcome = decide("success", { kind: "chain" });
    expect(outcome.next).toBeUndefined();
    expect(outcome.summary).toContain("chain");
  });

  // The run handed the turn back to a person. Reviving the standing request
  // behind that handback's back is deciding for the person.
  test("a turn handed back to a person starts nothing", () => {
    const outcome = decide("success", { kind: "with-person" });
    expect(outcome.next).toBeUndefined();
    expect(outcome.summary).toContain("person");
  });

  // The thread could not be read. The conservative answer when nobody can tell
  // is the one that starts nothing -- the guard's rule.
  test("an unreadable thread starts nothing", () => {
    const outcome = decide("success", { kind: "unreadable" });
    expect(outcome.next).toBeUndefined();
  });

  // An absent hold is a caller that could not answer, which reads as the state
  // that starts nothing -- the direction that cannot start a run nobody asked for.
  test("an absent hold reads as the ball being with a person", () => {
    const outcome = decideValidationOutcome({ conclusion: "success", ...agents });
    expect(outcome.next).toBeUndefined();
  });
});

/**
 * Red and green read the same gate.
 *
 * A red verdict used to dispatch nobody on purpose and tell a person instead, so
 * the gate only ever had to hold for green. Now that a failure hands the fix to the
 * call the thread is making, every state that must not start a run has to hold for
 * red too -- and where the thread names nobody, the failure comment is what carries
 * the name a person can ask.
 */
describe("a red verdict meets the same gate as a green one", () => {
  test("a run in flight, a chain, or a person holding the turn starts nothing", () => {
    const holds = [
      { kind: "in-flight" as const },
      { kind: "chain" as const },
      { kind: "with-person" as const },
      { kind: "unreadable" as const },
    ];
    for (const hold of holds) {
      const outcome = decide("failure", hold);
      expect(outcome.verdict, hold.kind).toBe("failed");
      expect(outcome.next, hold.kind).toBeUndefined();
      // The failure comment still names who a person can ask for the fix.
      expect(outcome.summary, hold.kind).toContain("/engineer");
    }
  });

  test("a parked turn is collected on red as it is on green", () => {
    expect(decide("failure", { kind: "parked" }).next?.agent).toBe("reviewer");
  });

  test("a call that names nobody starts nobody", () => {
    const outcome = decideValidationOutcome({
      conclusion: "failure",
      reviewerAgent: "",
      engineerAgent: "engineer",
      hold: free,
    });
    expect(outcome.verdict).toBe("failed");
    expect(outcome.next).toBeUndefined();
    expect(outcome.summary).toContain("/engineer");
  });
});
/**
 * A pull request whose own `.github/atomaton/` cannot start a run.
 *
 * Judged before the CI conclusion, and treated as a red CI run rather than as a
 * broken job: failing checks so the merge is blocked, and a person told, naming
 * the opener -- the author of what it broke. The alternative — a failed workflow
 * step — writes no check at all, which leaves the required context pending forever
 * and dispatches nobody.
 */
describe("a deliverable that cannot start a run", () => {
  const problems = ["engineer.md: mcp_servers 'shell': not found in tools file"];

  const decideWith = (deliverableProblems: string[], conclusion = "", hold: ThreadHold = free) =>
    decideValidationOutcome({
      conclusion,
      ...agents,
      hold,
      deliverableProblems,
    });

  test("blocks the merge, and hands the fix to a waiting call like any other red", () => {
    const outcome = decideWith(problems);
    expect(outcome.verdict).toBe("deliverable-invalid");
    expect(contextsPassed(outcome.verdict)).toBe(false);
    expect(outcome.next?.agent).toBe("reviewer");
    // The dispatched run's brief carries the count and no instruction to a person;
    // the problems themselves are the failure comment's.
    expect(outcome.summary).not.toContain("Comment /");
  });

  test("dispatches nobody where no call is waiting", () => {
    const outcome = decideWith(problems, "", { kind: "with-person" });
    expect(outcome.verdict).toBe("deliverable-invalid");
    expect(outcome.next).toBeUndefined();
  });

  // The count belongs in the summary; the problems themselves travel in the
  // comment. `summary` is also a step output, which is one line by construction.
  test("the summary names the count and stays one line", () => {
    const outcome = decideWith([...problems, "chain.labels.launched must be a non-empty label name."]);
    expect(outcome.summary).toContain("(2 problems)");
    expect(outcome.summary).not.toContain("\n");
  });

  test("one problem is not pluralised", () => {
    expect(decideWith(problems).summary).toContain("(1 problem)");
  });

  /**
   * The ordering that matters. CI was never dispatched, so `conclusion` is empty —
   * which on its own means `no-conclusion`, a verdict that deliberately dispatches
   * NOBODY because there is no defect to hand anyone. Here there is one, and its
   * author is the agent that just wrote it.
   */
  test("an empty conclusion is not read as a run that never reported", () => {
    expect(decideWith(problems, "").verdict).toBe("deliverable-invalid");
    expect(decideWith([], "").verdict).toBe("no-conclusion");
  });

  // A green CI run cannot rescue it: what CI checked is the repository's own code,
  // and what is broken is the machinery the NEXT run loads.
  test("a passing CI conclusion does not override it", () => {
    expect(decideWith(problems, "success").verdict).toBe("deliverable-invalid");
  });

  // Nobody was dispatched, so the failure comment is the whole message: it names
  // the agent that wrote the breakage, which is who a person asks for the fix.
  test("the mention names the agent that wrote what is broken", () => {
    expect(decideWith(problems, "", { kind: "with-person" }).summary).toContain("/engineer");
  });

  test("an empty list is the normal case and changes nothing", () => {
    expect(decideWith([], "success").verdict).toBe("passed");
    expect(decideWith([], "failure").verdict).toBe("failed");
  });
});

/**
 * A role nobody is configured for.
 *
 * `nextAgent: string` could hold `""` and did at every hand-back, so a role left
 * unnamed produced the same value as a deliberate stop — and the only thing
 * separating them was a `!= ''` in the workflow. `next` being absent says it once,
 * in the type, and the check it used to need is gone with it.
 */
describe("a role with nobody in it", () => {
  test("hands off to nobody rather than to an agent called \"\"", () => {
    const outcome = decideValidationOutcome({
      conclusion: "success",
      reviewerAgent: "",
      engineerAgent: "engineer",
      hold: free,
    });
    expect(outcome.verdict).toBe("passed");
    expect(outcome.next).toBeUndefined();
  });

  test("whitespace is not a name either", () => {
    const outcome = decideValidationOutcome({
      conclusion: "failure",
      reviewerAgent: "reviewer",
      engineerAgent: "   ",
      hold: { kind: "with-person" },
    });
    expect(outcome.verdict).toBe("failed");
    expect(outcome.next).toBeUndefined();
    // And the mention suggests nobody: there is no name to suggest.
    expect(outcome.summary).not.toContain("/engineer");
  });
});
