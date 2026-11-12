/**
 * summarize_run.test.ts — the step outputs the post steps consume, held to the
 * ops log the run actually wrote.
 *
 * The greps are the whole point of this script: `"op":"dispatch"` ends in a
 * quote so it cannot match `"op":"dispatch-elsewhere"`, and a refactor once
 * broke a grep like it silently. What these pin is which ops count and which
 * do not — the contract tests on the generated workflow hold that the step
 * calls this file at all.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hermeticEnv, parseGithubOutput, removeTemp, scriptPath } from "./testing/harness.ts";

const BREAKING = "Done.\n\n/engineer\n\n@alice, your call.";

interface RunResult {
  status: number;
  outputs: Record<string, string>;
  /** The raw `$GITHUB_OUTPUT` file, heredoc blocks included. */
  raw: string;
}

function run(opts: { ops?: string; output?: string; endingInvalid?: string }): RunResult {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-summarize-"));
  try {
    const runDir = join(dir, "run");
    mkdirSync(runDir, { recursive: true });
    if (opts.ops !== undefined) writeFileSync(join(runDir, "atomaton_ops.log"), opts.ops);
    writeFileSync(join(runDir, "atomaton_output.txt"), opts.output ?? BREAKING);
    const defDir = join(dir, ".github", "atomaton", "agent-definitions");
    mkdirSync(defDir, { recursive: true });
    writeFileSync(join(defDir, "engineer.md"), "---\nname: engineer\n---\n");
    const githubOutput = join(dir, "github-output.txt");
    writeFileSync(githubOutput, "");

    const r = spawnSync(
      "bun",
      ["run", scriptPath("summarize_run.ts"), "--run-dir", runDir, "--ending-invalid", opts.endingInvalid ?? "false"],
      {
        encoding: "utf8",
        env: { ...hermeticEnv(), ATOMATON_MACHINERY_ROOT: dir, GITHUB_OUTPUT: githubOutput },
      },
    );
    expect(r.status, r.stderr).toBe(0);
    return { status: r.status ?? -1, outputs: parseGithubOutput(readGithubOutput(githubOutput)), raw: readGithubOutput(githubOutput) };
  } finally {
    removeTemp(dir);
  }
}

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

function readGithubOutput(path: string): string {
  return readFileSync(path, "utf8");
}

describe("summarize_run.ts", () => {
  test("the report is the step output, whole and under a delimiter the report cannot close", () => {
    const report = "Done.\n\nresult<<EOF-looking\nmore";
    const r = run({ output: report });
    // The report is multiline, so it travels in the heredoc form — and the
    // delimiter is drawn fresh, so a report containing a delimiter-looking line
    // cannot close it early.
    const raw = r.raw;
    expect(raw).toMatch(/result<<[0-9a-f]{30}\n/);
    expect(raw).toContain(`${report}`);
  });

  test("the directive is read when the ending is valid, and empty when it was refused", () => {
    const clean = run({ output: "Done.\n\n/engineer", endingInvalid: "false" });
    expect(clean.outputs.directive).toBe("engineer");
    const refused = run({ output: BREAKING, endingInvalid: "true" });
    expect(refused.outputs.directive).toBe("");
    expect(refused.outputs.ending_invalid).toBe("true");
  });

  test("a hand-off to this node's chain is progress; a park and nothing at all are not", () => {
    const chain = run({ ops: '{"op":"dispatch","agent":"reviewer"}\n' });
    expect(chain.outputs.chain_continues).toBe("true");
    expect(chain.outputs.parked, "a dispatch onto THIS node is not a park").toBe("false");

    const parked = run({ ops: '{"op":"dispatch-elsewhere","node":9}\n' });
    expect(parked.outputs.parked).toBe("true");
    expect(parked.outputs.chain_continues, "and the trailing quote keeps one run from reading as both").toBe("false");
  });

  test("changed reads the same ops log the stalled check did, after any second turn", () => {
    const pushed = run({ ops: '{"op":"commit_and_push","sha":"abc"}\n' });
    expect(pushed.outputs.changed).toBe("true");
    const silent = run({ ops: '{"op":"something-else"}\n' });
    expect(silent.outputs.changed).toBe("false");
    const none = run({});
    expect(none.outputs.changed, "no ops log is no progress").toBe("false");
  });
});
