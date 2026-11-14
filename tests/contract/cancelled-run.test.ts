/**
 * Pins the cancelled run's inside report.
 *
 * A cancelled run claims the turn at start and reaches no step that could close it:
 * "Post result comment" is gated on the agent step succeeding or failing, and a
 * cancellation is neither. The claim then stands with nothing coming to answer it —
 * the exact state that used to need the outside sweep, and the one a person hits
 * first (a cancel is the commonest way a run dies mid-work).
 *
 * `report_cancelled_run.ts` closes the claim from inside: an `ended=stopped` turn
 * comment answering the ask, naming the run. If either half of this wiring
 * disappears — the step from the generated runner, or the ending's identity from
 * the script — a person's cancel wedges the node again: the guard deletes what they
 * write next, a validation's verdict refuses to dispatch, and no run is coming.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { cancelledNotice } from "../../src/entrypoints/machinery/report_cancelled_run.ts";
import { recoveryLines } from "../../src/domain/work/comment-command.ts";
import { ENDED_TAG, AGENT_TAG } from "../../src/adapters/github/tags.ts";
import { turnCommentBody } from "../../src/adapters/github/turn-comment.ts";

type Step = { name?: string; if?: string; run?: string; env?: Record<string, string> };
type WorkflowDocument = { jobs?: Record<string, { steps?: Step[] }> };

describe("the cancelled run's inside report", () => {
  const workflow = Bun.YAML.parse(
    readFileSync("dist/.github/workflows/atomaton-runner.yml", "utf8"),
  ) as WorkflowDocument;
  const steps = Object.values(workflow.jobs ?? {}).flatMap((job) => job.steps ?? []);

  test("the runner carries the step, gated on a cancellation that claimed the turn", () => {
    const step = steps.find((s) => s.name === "Report a cancelled run");
    expect(step, "the step must exist").toBeDefined();
    expect(step?.if ?? "").toContain("steps.atoma.outcome == 'cancelled'");
    expect(step?.if ?? "").toContain("always()");
    expect(step?.if ?? "").toContain("steps.claim.outputs.claimed == 'true'");
  });

  test("the report carries the turn's identity, so it closes the claim it answers", () => {
    const step = steps.find((s) => s.name === "Report a cancelled run");
    expect(step?.run ?? "").toContain("report_cancelled_run.ts");
    // The ending answers the ask the run claimed (#285): without `--ask`/`--run-id`
    // the comment would be an answer to nothing, matching no real claim.
    expect(step?.run ?? "").toContain("--ask");
    expect(step?.run ?? "").toContain("--run-id");
  });

  test("the notice is a `stopped` ending addressed to a person, with the recovery lines", () => {
    const body = turnCommentBody({
      ended: "stopped",
      audience: "person",
      agent: "reviewer",
      answers: 687,
      run: 4359,
      body: cancelledNotice("reviewer").join("\n"),
    });
    expect(ENDED_TAG.readProse(body)).toEqual({ verb: "stopped", answers: 687, run: 4359 });
    expect(AGENT_TAG.hasProse(body)).toBe(true);
    expect(body).toContain("cancelled from outside");
    // The recovery lines are the one action a person takes next; omitting them would
    // leave a notice that says nothing happened and nothing about what to do.
    for (const line of recoveryLines("reviewer")) {
      expect(body).toContain(line);
    }
    // It decides nothing: the text says so, because a person reading "stopped" beside
    // a pushed branch otherwise wonders whether the stop undid it.
    expect(body).toContain("Nothing was decided");
  });
});
