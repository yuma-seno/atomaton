/**
 * gh.test.ts — which identity a dispatch runs as.
 *
 * `dispatchWorkflow` grew an optional `token` for one caller: the update lane's
 * notice and conflict dispatch, which run in workflows that hold no `actions: write`
 * and so cannot start a run with their own token. Everything else dispatches as the
 * ambient `GH_TOKEN`, and must keep doing so.
 *
 * A dispatch is one `gh workflow run`, and there is nothing in this repository that
 * can observe which token it carried — argv look identical either way. So this asks
 * the fake `gh` for its own environment: the seam is one function deep (`ghAs` builds
 * the child's env), and a test that skipped it would be asserting that a boolean was
 * returned, which is the part that was never in doubt.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GH = join(import.meta.dir, "gh.ts");

/**
 * Dispatch through the real module, with a fake `gh` that records what it was handed.
 *
 * The fake writes to a file rather than stdout: `gh.ts` captures the child's stdout as
 * the command's answer, so what the fake prints never reaches this process.
 */
function dispatch(token: string | undefined): { ok: boolean; token: string; argv: string[] } {
  const dir = mkdtempSync(join(tmpdir(), "gh-dispatch-"));
  const impl = join(dir, "fake-gh.ts");
  const seen = join(dir, "seen.json");
  writeFileSync(
    impl,
    'import { writeFileSync } from "node:fs";\n' +
      `writeFileSync(${JSON.stringify(seen)}, JSON.stringify({ token: process.env.GH_TOKEN ?? "", argv: process.argv.slice(2) }));\n`,
  );
  try {
    const script = `
      const { dispatchWorkflow } = await import(${JSON.stringify(GH)});
      const ok = dispatchWorkflow("ctx", "atomaton-runner.yml", ["--repo", "o/r", "--field", "agent=engineer"], () => {}${
        token === undefined ? "" : `, ${JSON.stringify(token)}`
      });
      process.stdout.write(JSON.stringify({ ok }));
    `;
    const proc = Bun.spawnSync({
      cmd: [process.execPath, "-e", script],
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, ATOMATON_FAKE_GH: impl, GH_TOKEN: "the-ambient-token" },
    });
    if (proc.exitCode !== 0) throw new Error(proc.stderr.toString() || proc.stdout.toString());
    const { ok } = JSON.parse(proc.stdout.toString()) as { ok: boolean };
    const ran = JSON.parse(readFileSync(seen, "utf8")) as { token: string; argv: string[] };
    return { ok, ...ran };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("dispatchWorkflow", () => {
  test("without a token it dispatches as the ambient one", () => {
    const r = dispatch(undefined);
    expect(r.ok).toBe(true);
    expect(r.token).toBe("the-ambient-token");
    expect(r.argv.slice(0, 3)).toEqual(["workflow", "run", "atomaton-runner.yml"]);
  });

  /**
   * The one case the argument exists for: a workflow whose own token may not start a
   * run passes the PAT it already holds, and the child sees THAT as `GH_TOKEN` —
   * not the ambient one, which is the whole point.
   */
  test("with a token it dispatches as that identity instead", () => {
    const r = dispatch("the-pat");
    expect(r.ok).toBe(true);
    expect(r.token).toBe("the-pat");
    // The rest of the argv is unchanged: the token decides who, never what.
    expect(r.argv.slice(0, 3)).toEqual(["workflow", "run", "atomaton-runner.yml"]);
    expect(r.argv).toContain("agent=engineer");
  });

  /** Blank is absent: every existing caller passes nothing, and none passes " ". */
  test("a blank token falls back to the ambient one", () => {
    expect(dispatch("   ").token).toBe("the-ambient-token");
  });
});
