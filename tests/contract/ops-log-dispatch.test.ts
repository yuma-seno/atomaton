/**
 * ops-log-dispatch.test.ts — the two op names `logDispatch` writes, and the grep the
 * runner uses to tell them apart.
 *
 * Lives under `tests/contract/` rather than beside `ops-log.ts` because it spawns a
 * child (`bun`) and imports the test harness, and `src/adapters/` may not reach the
 * harness — see `layering.test.ts`. The harness is also what makes the spawn hermetic:
 * the runner sets `ATOMATON_OPS_LOG` in an agent's environment, and a child started
 * with `...process.env` would log to the run's own file instead of this test's.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hermeticEnv } from "../../src/entrypoints/machinery/testing/harness.ts";

/**
 * The exact expression `atomaton-runner.wac.ts` puts in its `chain_continues` step,
 * kept here as a literal so a change to one is a failing test rather than a silent
 * divergence between the writer and the reader.
 */
const RUNNER_GREP = '"op":"dispatch"';

const OPS_LOG = join(process.cwd(), "src/adapters/runner/ops-log.ts");

/** Write one entry in a child, so the module's one-time read of the env var is fresh. */
function writeEntry(call: string): string {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-ops-"));
  const log = join(dir, "ops.log");
  const script = join(dir, "call.ts");
  writeFileSync(script, `import { logDispatch } from ${JSON.stringify(OPS_LOG)};\n${call}\n`);
  try {
    const r = Bun.spawnSync(["bun", "run", script], {
      env: { ...hermeticEnv(), ATOMATON_OPS_LOG: log },
      stdout: "pipe",
      stderr: "pipe",
    });
    if (r.exitCode !== 0) throw new Error(`child failed: ${r.stderr.toString()}`);
    return readFileSync(log, "utf8");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * `logDispatch` writes one op name or the other, and the runner's grep must see exactly
 * one of them.
 *
 * The failure this pins: `launch_sub_agent` and `create_pr` dispatch onto a CHILD node,
 * so the run that called them is finished and its `atomaton/in-progress` guard must come
 * off (#28). Writing the same `"op":"dispatch"` for them made `chain_continues` true,
 * which held the guard — the node looked busy while nothing ran on it, `/resume` and
 * `/stop` skipped it, and `manage_dispatch_loop` counted a chain that was not there
 * (#73). The two names differ by a suffix and the reader is a `grep`, so the trailing
 * quote is what makes them disjoint; this test is what keeps it that way.
 */
describe("ops-log dispatch entries", () => {
  test("a hand-off on this node is the entry the runner greps for", () => {
    const text = writeEntry(`logDispatch("pr", "reviewer", { number: 12 });`);
    expect(text).toContain(RUNNER_GREP);
    expect(text).not.toContain('"op":"dispatch-elsewhere"');
  });

  test("a dispatch onto another node is invisible to that grep, so the node releases", () => {
    const text = writeEntry(`logDispatch("issue", "engineer", { number: 7, elsewhere: true });`);
    expect(text).toContain('"op":"dispatch-elsewhere"');
    // The point of the whole thing: the runner's grep must not match this entry, or
    // the node stays locked after launching the work it was waiting on.
    expect(text).not.toContain(RUNNER_GREP);
  });

  test("the target and agent ride along with either name", () => {
    const text = writeEntry(`logDispatch("issue", "atomaton", { number: 7, elsewhere: true });`);
    const entry = JSON.parse(text.trim());
    expect(entry.target).toBe("issue");
    expect(entry.agent).toBe("atomaton");
    expect(entry.number).toBe(7);
    // `elsewhere` is the decision, not a field: it must not survive as one, or a later
    // reader would be guessing at a value the op name already settled.
    expect(entry.elsewhere).toBeUndefined();
  });
});
