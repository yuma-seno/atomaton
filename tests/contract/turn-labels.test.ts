/**
 * Pins the turn labels' wiring in the generated runner (#223).
 *
 * The two labels are complements and move together — `running` when a run claims
 * the turn, `with-person` when it hands back. If either step loses its phase, a
 * node ends up wearing both labels or neither, and neither state is readable.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

type Step = { name?: string; run?: string; if?: string };
type WorkflowDocument = { jobs?: Record<string, { steps?: Step[] }> };

describe("the turn labels move together (#223)", () => {
  const workflow = Bun.YAML.parse(
    readFileSync("dist/.github/workflows/atomaton-runner.yml", "utf8"),
  ) as WorkflowDocument;
  const steps = Object.values(workflow.jobs ?? {}).flatMap((job) => job.steps ?? []);

  test("a claimed run moves the labels to `running`", () => {
    const add = steps.find((s) => s.name === "Add atomaton/in-progress label (the turn is with a run)");
    expect(add, "the start-of-turn label step must exist").toBeDefined();
    expect(add?.run ?? "").toContain('--phase "running"');
  });

  test("a hand-back moves the labels to `with-person`", () => {
    const release = steps.find((s) => s.name === "Move the turn labels: the work hands back to a person");
    expect(release, "the end-of-turn label step must exist").toBeDefined();
    expect(release?.run ?? "").toContain('--phase "with-person"');
    // Only a run that TOOK the turn may move the labels (#223's review): a run
    // that lost the claim race or did nothing must not strip the in-progress
    // label another run — a parked parent included — is still holding.
    expect(release?.if ?? "").toContain("claimed");
  });
});
