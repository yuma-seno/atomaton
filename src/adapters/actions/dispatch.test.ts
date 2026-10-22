import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { importable, runWithFakeGh, type FakeGhRule } from "../../entrypoints/machinery/testing/harness.ts";

/**
 * dispatch.test.ts — how `dispatchRunner` classifies a dispatch in the ops log.
 *
 * The op name is the ONE structured signal `chain_continues` reads
 * (`ops-log.ts`), so the classification is load-bearing twice over: the audit
 * trail, and the result comment's claim about whether anything runs next. The
 * default is a comparison against the node the run sits on; `continuesChain` is
 * the caller's override for the dispatch that comparison cannot see — a merged
 * pull request's re-invocation of the issue it delivers, which is neither on the
 * run's node nor under it, and is exactly the run's own outcome.
 *
 * Run through a subprocess, like `aggregation.test.ts`: mutating PATH and
 * calling a `gh`-shelling function in the long-lived bun:test process has given
 * wrong results before.
 */

const LIB_DIR = import.meta.dir;

interface Run {
  ops: Record<string, unknown>[];
  dispatched: boolean;
}

function run(opts: { type: string; number: string; target: number; continuesChain?: boolean }): Run {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-dispatch-"));
  const opsLog = join(dir, "ops.log");
  const shim = join(dir, "shim.ts");
  writeFileSync(
    shim,
    `import { dispatchRunner } from "${importable(join(LIB_DIR, "dispatch.ts"))}";
const outcome = dispatchRunner({
  context: "dispatch.test.ts",
  agent: "engineer",
  type: "${opts.type}",
  number: ${opts.target},
  repo: "owner/repo",
  answersRequest: true,
 ${opts.continuesChain ? "continuesChain: true," : ""}
});
console.log(outcome);
`,
  );
  // The target must be open (`mayStartWorkOn`), and the dispatch itself is one
  // `workflow run`. `answersRequest` skips the marker and its ordering check —
  // pinned with the full path in `mcp.test.ts`'s merge_pr test; the classification
  // is what this file is for.
  const rules: FakeGhRule[] = [
    { match: ["api", `repos/owner/repo/issues/${opts.target}`], stdout: JSON.stringify({ state: "open" }) },
    { match: ["workflow", "run", "atomaton-runner.yml"], stdout: "" },
  ];
  try {
    const r = runWithFakeGh(shim, [], {
      rules,
      env: {
        TYPE: opts.type,
        NUMBER: opts.number,
        ATOMATON_OPS_LOG: opsLog,
      },
    });
    expect(r.stdout.trim()).toBe("dispatched");
    const ops = readFileSync(opsLog, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    return { ops, dispatched: true };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("dispatchRunner's ops-log classification", () => {
  test("a dispatch onto the node this run sits on is `dispatch`", () => {
    const { ops } = run({ type: "issue", number: "300", target: 300 });
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ op: "dispatch", target: "issue", agent: "engineer", number: 300 });
  });

  test("a dispatch onto another node from a pull request run is `dispatch-elsewhere`", () => {
    const { ops } = run({ type: "issue", number: "802", target: 300 });
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ op: "dispatch-elsewhere", target: "issue", agent: "engineer", number: 300 });
  });

  test("continuesChain records the run's own conclusion as `dispatch` wherever it lands", () => {
    // The post-merge restart: the run sits on pull request #802, the run it wakes
    // sits on issue #300, and the dispatch is the merge's own outcome. This is the
    // case the node comparison gets wrong and the caller has to name.
    const { ops } = run({ type: "issue", number: "802", target: 300, continuesChain: true });
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ op: "dispatch", target: "issue", agent: "engineer", number: 300 });
  });
});
