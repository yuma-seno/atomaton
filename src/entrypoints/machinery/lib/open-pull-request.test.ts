/**
 * open-pull-request.test.ts — the read the notice makes before it dispatches.
 *
 * Two things decide whether a daily cron starts an update once per release or once
 * per day: the answer, and the identity the question is asked as. The answer is
 * pinned through the update's own fixtures (`update_atomaton.test.ts`); this pins the
 * identity, because a `gh pr list` that is refused comes back as "no pull request is
 * open" -- the answer that dispatches -- and argv look identical either way.
 *
 * The seam is the fake `gh`'s own environment, one function deep (`ghAs` builds the
 * child's env). Nothing above it can see which token a read carried.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LIB = join(import.meta.dir, "open-pull-request.ts");

interface Ran {
  number: number;
  token: string;
  argv: string[];
  stderr: string;
}

/**
 * Ask the real module, with a fake `gh` that records what it was given.
 *
 * `refuse` makes the fake exit non-zero with a permission message, which is what a
 * private repository answers a job without `pull-requests`.
 */
function search(token: string | undefined, refuse = false): Ran {
  const dir = mkdtempSync(join(tmpdir(), "open-pr-"));
  const impl = join(dir, "fake-gh.ts");
  const seen = join(dir, "seen.json");
  writeFileSync(
    impl,
    'import { writeFileSync } from "node:fs";\n' +
      `writeFileSync(${JSON.stringify(seen)}, JSON.stringify({ token: process.env.GH_TOKEN ?? "", argv: process.argv.slice(2) }));\n` +
      (refuse
        ? 'console.error("HTTP 403: Resource not accessible by integration");\nprocess.exit(1);\n'
        : 'process.stdout.write(JSON.stringify([{ number: 4 }]));\n'),
  );
  try {
    const script = `
      const { openPrForHead } = await import(${JSON.stringify(LIB)});
      const number = openPrForHead("o/r", "atomaton/update-v0.2.0"${token === undefined ? "" : `, ${JSON.stringify(token)}`});
      process.stdout.write(JSON.stringify({ number }));
    `;
    const proc = Bun.spawnSync({
      cmd: [process.execPath, "-e", script],
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, ATOMATON_FAKE_GH: impl, GH_TOKEN: "the-ambient-token" },
    });
    if (proc.exitCode !== 0) throw new Error(proc.stderr.toString() || proc.stdout.toString());
    const { number } = JSON.parse(proc.stdout.toString()) as { number: number };
    const ran = JSON.parse(readFileSync(seen, "utf8")) as { token: string; argv: string[] };
    return { number, stderr: proc.stderr.toString(), ...ran };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("openPrForHead", () => {
  test("without a token it reads as the ambient identity", () => {
    const r = search(undefined);
    expect(r.number).toBe(4);
    expect(r.token).toBe("the-ambient-token");
    expect(r.argv.slice(0, 4)).toEqual(["pr", "list", "--repo", "o/r"]);
    expect(r.argv[r.argv.indexOf("--head") + 1]).toBe("atomaton/update-v0.2.0");
  });

  /**
   * The notice's case. Its workflow declares `contents: read` and `issues: write`
   * and nothing else, so the ambient token cannot make this call on a private
   * repository -- and this module answers a refused read with `0`, which the notice
   * reads as "dispatch".
   */
  test("with a token it reads as that identity instead", () => {
    const r = search("the-pat");
    expect(r.number).toBe(4);
    expect(r.token).toBe("the-pat");
    expect(r.argv.slice(0, 2)).toEqual(["pr", "list"]);
  });

  /**
   * A read that failed is not an answer of "none", and the callers act on `0` by
   * opening or dispatching. The reason it was given goes to the log, where the run
   * that acted on it can be read afterwards.
   */
  test("a refused read is 0 and says why, rather than looking like a clean answer", () => {
    const r = search("the-pat", true);
    expect(r.number).toBe(0);
    expect(r.stderr).toContain("WARN");
    expect(r.stderr).toContain("403");
  });
});
