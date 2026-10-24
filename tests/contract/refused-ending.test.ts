/**
 * Pins the loop-limit notice as a turn event (#194).
 *
 * A chain that stops on its own limit refused the hand-off its result comment
 * already wrote: the comment says "handed off", the notice says why nobody is
 * coming. The notice therefore carries `ended=refused` — the tag that ends the
 * turn — built with the marker from `ENDED_TAG` because the ids are runtime
 * values. If the tag line disappears from the generated workflow, the thread's
 * newest word goes back to "a hand-off" and the node looks busy to every later
 * reader on work nothing will ever start.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

type Step = { id?: string; name?: string; run?: string };
type WorkflowDocument = { jobs?: Record<string, { steps?: Step[] }> };

describe("the loop-limit notice ends the turn (#194)", () => {
  const workflow = Bun.YAML.parse(
    readFileSync("dist/.github/workflows/atomaton-runner.yml", "utf8"),
  ) as WorkflowDocument;

  const steps = Object.values(workflow.jobs ?? {}).flatMap((job) => job.steps ?? []);
  const notice = steps.find((s) => s.name === "Comment on loop limit reached");

  test("the notice step exists and carries the refused ending", () => {
    expect(notice, "the chain-over path must keep its notice").toBeDefined();
    expect(notice?.run ?? "").toContain("atomaton:ended=refused answers=");
    // The identity is runtime, spelled from ENDED_TAG's marker: the ask the
    // successor was to claim is this run's result comment, and this run withdraws
    // the promise.
    expect(notice?.run ?? "").toContain("ASK_COMMENT");
    expect(notice?.run ?? "").toContain("RUN_ID");
  });

  test("the validation dispatch carries the chain identity too", () => {
    const validate = Bun.YAML.parse(
      readFileSync("dist/.github/workflows/atomaton-validate-pr.yml", "utf8"),
    ) as WorkflowDocument;
    const vsteps = Object.values(validate.jobs ?? {}).flatMap((job) => job.steps ?? []);
    const dispatch = vsteps.find((s) => (s.run ?? "").includes("dispatch_agent"));
    expect(dispatch, "validation's dispatch step must exist").toBeDefined();
    expect(dispatch?.run ?? "").toContain("run-id");
  });
});
