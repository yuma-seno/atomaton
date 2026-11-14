import { describe, expect, test } from "bun:test";
import { runWithFakeGh, scriptPath } from "./testing/harness.ts";
import { AGENT_TAG, ENDED_TAG, LLM_CONTEXT_TAG } from "../../adapters/github/tags.ts";

/**
 * The cancelled run's own ending, as the script writes it.
 *
 * The step wiring is pinned in `tests/contract/cancelled-run.test.ts`; what is pinned
 * here is the wire the thread then reads. A cancellation is the one run shape whose
 * claim nothing else closes — "Post result comment" is gated off, the sweep is gone —
 * so this comment IS the handback: if its ending does not carry the claim's ask and
 * run, or does not land, the claim stands and the node wedges exactly as before. That
 * is why the failure path is tested as an exit: a comment that did not write must turn
 * the step red, because the job's log is the only place left to say so.
 */
describe("report_cancelled_run.ts", () => {
  const args = ["--number", "9", "--agent", "engineer", "--ask", "55", "--run-id", "4359"];

  test("posts a `stopped` ending answering the claim, tagged for a person", () => {
    const r = runWithFakeGh(scriptPath("report_cancelled_run.ts"), args, {
      rules: [{ match: ["issue", "comment"] }],
    });
    expect(r.status).toBe(0);
    const call = r.ghCalls.find((c) => c.includes("comment")) ?? [];
    const body = call[call.indexOf("--body") + 1] ?? "";
    // The identity is the whole point: an ending that does not name the ask and run
    // the claim carries answers nothing, and the claim survives it.
    expect(ENDED_TAG.readProse(body)).toEqual({ verb: "stopped", answers: 55, run: 4359 });
    expect(AGENT_TAG.readProse(body)).toBe("engineer");
    // The header is `exclude` from `turnCommentBody` itself (audience "person"): the
    // next run can do nothing with this comment but carry it.
    expect(LLM_CONTEXT_TAG.read(body)).toBe("exclude");
    expect(body).toContain("Nothing was decided");
  });

  test("turns red when the comment does not land — the log is the only record left", () => {
    const r = runWithFakeGh(scriptPath("report_cancelled_run.ts"), args, {
      rules: [{ match: ["issue", "comment"], code: 1 }],
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("::error::");
    expect(r.stderr).toContain("could not post the cancelled run's ending");
    // A run that backs off and claims nothing posts nothing; this script has no such
    // path, so one call is the whole of its output.
    expect(r.ghCalls).toHaveLength(1);
  });
});
