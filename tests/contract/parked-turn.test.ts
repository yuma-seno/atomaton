/**
 * Pins the parked turn's wiring in the generated runner (#208).
 *
 * The label a parked run keeps is decided by `decide_turn_ending` from a `parked`
 * signal the runner reads out of its own ops log — the `dispatch-elsewhere` entry a
 * child-starting tool writes. If either half of that wiring disappears from the
 * generated workflow, a parked run's label is removed at job end and the node looks
 * free while its subtree is still working — the exact state 判断1-A exists to make
 * visible.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

type Step = { name?: string; run?: string };
type WorkflowDocument = { jobs?: Record<string, { steps?: Step[] }> };

describe("the parked turn's wiring (#208)", () => {
  const workflow = Bun.YAML.parse(
    readFileSync("dist/.github/workflows/atomaton-runner.yml", "utf8"),
  ) as WorkflowDocument;
  const steps = Object.values(workflow.jobs ?? {}).flatMap((job) => job.steps ?? []);

  test("the agent step publishes the parked signal from its own ops log", () => {
    const read = steps.find((s) => (s.run ?? "").includes("parked=${PARKED}"));
    expect(read, "the step that reads the ops log must publish the signal").toBeDefined();
    expect(read?.run ?? "").toContain('"op":"dispatch-elsewhere"');
  });

  test("the ending decision consumes it", () => {
    const decide = steps.find((s) => s.name === "Decide how this turn ended");
    expect(decide, "the ending decision must exist").toBeDefined();
    expect(decide?.run ?? "").toContain("--parked");
  });
});
