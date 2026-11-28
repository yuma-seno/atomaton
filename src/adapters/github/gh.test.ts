/**
 * gh.test.ts — a dispatch is one `gh workflow run`, as the ambient identity, and a
 * refusal is a `false` rather than a throw.
 *
 * There is no token argument: every workflow that dispatches declares `actions:
 * write`, so the `GH_TOKEN` the workflow already holds is the one that starts the
 * run. That makes "which identity" a claim about the environment the child got, and
 * argv cannot show it — so this asks the fake `gh` for its own environment. A test
 * that skipped the seam would be asserting that a boolean was returned, which is the
 * part that was never in doubt.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GH = join(import.meta.dir, "gh.ts");

/**
 * Dispatch through the real module, with a fake `gh` that records what it was handed
 * and then exits with `code`.
 *
 * The fake writes to a file rather than stdout: `gh.ts` captures the child's stdout as
 * the command's answer, so what the fake prints never reaches this process. The
 * module's log lines go to stderr, which this reads back whole.
 */
function dispatch(code = 0): { ok: boolean; token: string; argv: string[]; log: string } {
  const dir = mkdtempSync(join(tmpdir(), "gh-dispatch-"));
  const impl = join(dir, "fake-gh.ts");
  const seen = join(dir, "seen.json");
  writeFileSync(
    impl,
    'import { writeFileSync } from "node:fs";\n' +
      `writeFileSync(${JSON.stringify(seen)}, JSON.stringify({ token: process.env.GH_TOKEN ?? "", argv: process.argv.slice(2) }));\n` +
      `process.exit(${code});\n`,
  );
  try {
    const script = `
      const { dispatchWorkflow } = await import(${JSON.stringify(GH)});
      const ok = dispatchWorkflow(
        "ctx",
        "atomaton-runner.yml",
        ["--repo", "o/r", "--field", "agent=engineer"],
        (message) => process.stderr.write(message + "\\n"),
      );
      process.stdout.write(JSON.stringify({ ok }));
    `;
    const proc = Bun.spawnSync({
      cmd: [process.execPath, "-e", script],
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, ATOMATON_FAKE_GH: impl, GH_TOKEN: "the-workflows-own-token" },
    });
    if (proc.exitCode !== 0) throw new Error(proc.stderr.toString() || proc.stdout.toString());
    const { ok } = JSON.parse(proc.stdout.toString()) as { ok: boolean };
    const ran = JSON.parse(readFileSync(seen, "utf8")) as { token: string; argv: string[] };
    return { ok, log: proc.stderr.toString(), ...ran };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("dispatchWorkflow", () => {
  /** The workflow's own token is what starts the run — never one threaded in. */
  test("it dispatches as the workflow's own token", () => {
    const r = dispatch();
    expect(r.ok).toBe(true);
    expect(r.token).toBe("the-workflows-own-token");
    expect(r.argv.slice(0, 3)).toEqual(["workflow", "run", "atomaton-runner.yml"]);
    expect(r.argv).toContain("agent=engineer");
  });

  /** A refusal is the caller's to read, not an exception the run dies on. */
  test("a refused dispatch is `false`, and the reason is logged", () => {
    const r = dispatch(1);
    expect(r.ok).toBe(false);
    expect(r.log).toContain("WARN failed to dispatch atomaton-runner.yml");
  });
});
