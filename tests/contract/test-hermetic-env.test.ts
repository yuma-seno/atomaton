/**
 * test-hermetic-env.test.ts — a test that spawns a script spawns it without the
 * variables that exist only inside an Atomaton run.
 *
 * ## The failure this exists for
 *
 * The runner sets `ATOMATON_MACHINERY_ROOT`, `ATOMATON_RUN_TYPE`, `ISSUE_NUMBER`,
 * `ATOMATON_OPS_LOG` and `ISSUE_NOTIFY` in the environment the agent works in, and a
 * test that spawns a child with `...process.env` hands them straight to it. The child
 * is then not reading the fixture the test wrote: `loadConfig()` resolves its path
 * through `machineryPath(CONFIG_FILE)`, so `ATOMATON_MACHINERY_ROOT` sends it to the
 * DEPLOYED config instead, and `ATOMATON_OPS_LOG` sends the shell guard's search
 * streak into the run's own live counter.
 *
 * The damage is not the failure itself, which is why CI stayed green through all of
 * it. It is that the agent cannot tell that red from one its own change caused, and
 * `harness.ts`'s own comment records the run that spent its remaining iterations
 * hunting one of these and never finished its task.
 *
 * `hermeticEnv()` in `src/entrypoints/machinery/testing/harness.ts` is the fix, and it
 * is one line per call site. What is easy to leave out and not notice is the call
 * site: eleven files had it missing. This repository has been here before -- the
 * machinery-root test beside this one exists for a variable spelled by hand in a
 * second place -- so this is the ratchet rather than the repair.
 *
 * ## What this can see, and what it cannot
 *
 * A `.test.ts` file that names `bun` as a spawn target must call `hermeticEnv()`
 * somewhere. That is file granularity: a file that calls it once and spawns
 * unhermetically twice passes. It catches the case that happened -- a subprocess test
 * written from scratch with `...process.env` -- and not a half-fixed file, which is
 * the honest limit of a text scan.
 *
 * It also cannot see a child spawned through an interpreter (`bash -c "bun run ..."`)
 * or one whose command is assembled from pieces. Nothing here does either.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { hermeticEnv, makeConfigDir } from "../../src/entrypoints/machinery/testing/harness.ts";

/** A call that starts a child process. */
const SPAWNS = /(?:^|[^\w.])(?:spawn|spawnSync|execFileSync|execSync|execFile)\s*\(|Bun\.spawn(?:Sync)?\s*\(/;

/** A spawn target that is this repository's own runner, rather than `git` or `bash`. */
const RUNS_BUN = /["'`]bun["'`]/;

/** Every `.test.ts` under a directory, at any depth. */
function testFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true })
    .map(String)
    .map((name) => join(dir, name).replaceAll("\\", "/"))
    .filter((path) => path.endsWith(".test.ts"));
}

describe("a test that spawns a script", () => {
  test("does not hand it the run's own environment", () => {
    const offenders = [...testFiles("src"), ...testFiles("tests")]
      .filter((path) => {
        const source = readFileSync(path, "utf8");
        return SPAWNS.test(source) && RUNS_BUN.test(source) && !source.includes("hermeticEnv(");
      });

    expect(
      offenders,
      `import hermeticEnv() from src/entrypoints/machinery/testing/harness.ts and pass it as \`env\`. ` +
        `A child started with ...process.env reads the run's deployed config and the run's own ops log ` +
        `instead of this test's fixtures, which is red in an agent's run and green in CI: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  /**
   * The behavioural half, and the one that would have failed on the original defect
   * wherever it ran.
   *
   * `makeConfigDir` writes a fixture `config.yaml` -- here one whose single setup
   * command exits 1. Given as `ATOMATON_MACHINERY_ROOT`, that is what a child
   * inheriting the variable reads instead of its own fixture. So a suite that spawns
   * `run_environment_setup.ts` unhermetically runs `exit 1` and reports a failure for
   * a change nobody made, which is exactly what the issue measured.
   *
   * Why this file and not the whole suite: the variable is set here rather than
   * inherited, so CI reproduces what only an agent's run used to. Reaching for the
   * whole of `bun run test` would make this the slowest test in the repository to
   * prove something one file proves.
   */
  test("the suite that was red stays green with a decoy machinery root", () => {
    const decoy = makeConfigDir({ environment: { setup_commands: ["exit 1"] } });
    try {
      const r = spawnSync("bun", ["test", join(process.cwd(), "src/entrypoints/machinery/run_environment_setup.test.ts")], {
        encoding: "utf8",
        env: { ...hermeticEnv(), ATOMATON_MACHINERY_ROOT: decoy },
        timeout: 60_000,
      });
      expect(
        r.status,
        `run_environment_setup.test.ts is red with ATOMATON_MACHINERY_ROOT set, so it reads the ` +
          `deployed config instead of its own fixture and an agent cannot tell this failure from its ` +
          `own:\n${r.stdout}\n${r.stderr}`,
      ).toBe(0);
    } finally {
      rmSync(decoy, { recursive: true, force: true });
    }
  }, 90_000);
});
