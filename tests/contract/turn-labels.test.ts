/**
 * Pins the turn labels' wiring in the generated runner (#223, #352).
 *
 * The two labels are complements and move together — `running` when a run claims
 * the turn, `with-person` when it hands back — and a third step strips them from a
 * node that closed (#352), unconditionally on the ending: the hand-off and park
 * endings skip the release by design, and a run that closed its own node inside
 * one of them would otherwise leave its label on work that is over.
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

  test("every run end strips a closed node's labels, whoever ended it (#352)", () => {
    const strip = steps.find((s) => (s.run ?? "").includes('--phase "closed"'));
    expect(strip, "the closed-node strip step must exist").toBeDefined();
    // Unconditional on the ending, and on the claim: whether the node is closed is
    // the script's read, not this step's guess, and a run that lost the claim race
    // on a node that then closed must still leave it clean.
    expect(strip?.if ?? "").toBe("always()");
  });
});
