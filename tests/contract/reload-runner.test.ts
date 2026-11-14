/**
 * Pins the reload's wiring in the generated runner.
 *
 * `reload_environment` ends the run that called it and starts another on the same
 * node, naming its own handoff comment as the ask. That comment is
 * `llm-context=exclude` like every operational notice, so the new run's context
 * snapshot comes back unchanged and `new_event_count` reads 0 — and a gate on the
 * count alone made every reload a no-op: the new run skipped the claim, the agent
 * and the ending, left `atomaton/in-progress` on the node, and said nothing at all.
 *
 * The five steps that open a turn must therefore also open when
 * `inputs.reload_count != '0'` — the only durable trace a reload leaves. If any of
 * them regresses to the event count alone, a reload silently burns a run again and
 * the node stays marked in-progress until a person happens to touch it.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

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
});
