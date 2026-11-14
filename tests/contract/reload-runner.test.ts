import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * The reload's continued turn (#555).
 *
 * A run started by `reload_environment` reads zero new events — the handoff
 * comment is `llm-context=exclude`, so the context snapshot is unchanged — and
 * used to no-op silently: no claim, no agent, no ending, the in-progress label
 * left standing, and nothing saying why. Every gate that opens a turn must
 * therefore open for `reload_count != '0'` as well as for a non-zero count.
 *
 * The `${{ }}` half of the contract is the shape, not decoration: an `if:` that
 * mixes a `${{ }}`-wrapped fragment with literal text evaluates unpredictably —
 * actionlint's `if-cond` rule reports the shape as "always evaluated to true" —
 * and a first cut here did exactly that, which would have removed the no-op
 * protection entirely while every test below still passed. So the generated
 * workflow must carry the condition BARE: no `${{` anywhere in a gate that
 * names the input.
 */
type Step = { name?: string; if?: string };
type WorkflowDocument = { jobs?: Record<string, { steps?: Step[] }> };

const workflow = Bun.YAML.parse(
  readFileSync("dist/.github/workflows/atomaton-runner.yml", "utf8"),
) as WorkflowDocument;
const steps = Object.values(workflow.jobs ?? {}).flatMap((job) => job.steps ?? []);

describe("the reload's continued turn", () => {
  const OPEN = "reload_count != '0'";
  const turnSteps = [
    "Claim the turn",
    "Watch for a stop request",
    "Run agent",
    "Post result comment",
    "Add atomaton/in-progress label (the turn is with a run)",
  ];

  test("every step that opens a turn also opens for a run arrived by reload", () => {
    for (const name of turnSteps) {
      const step = steps.find((s) => s.name === name);
      expect(step, `the step "${name}" must exist`).toBeDefined();
      expect(step?.if ?? "", name).toContain(OPEN);
    }
  });

  test("no step opens on the event count alone any more", () => {
    const gates = steps.map((s) => s.if ?? "").filter((gate) => gate.includes("new_event_count"));
    for (const gate of gates) {
      expect(gate, "the event count alone is the old, broken gate").toContain(OPEN);
    }
  });

  test("the gates are bare expressions — no ${{ }} mixed with literal text", () => {
    const gates = steps
      .map((s) => s.if ?? "")
      .filter((gate) => gate.includes("reload_count") || gate.includes("new_event_count"));
    expect(gates.length).toBeGreaterThan(0);
    for (const gate of gates) {
      // `${{ inputs.reload_count != '0' }}` spliced into a template made the
      // condition always-true while looking like a condition. The bare form is
      // the one GitHub evaluates; a gate carrying `${{` mid-expression is the
      // bug this test exists to keep out.
      expect(gate, `not an always-true mixed expression: ${gate}`).not.toContain("${{");
    }
  });
});
