/**
 * test-hermetic-env.test.ts — a test that spawns a script spawns it without the
 * variables that exist only inside an Atomaton run.
 *
 * ## The failure this exists for
 *
 * The runner sets `ATOMATON_MACHINERY_ROOT`, `TYPE`, `NUMBER`, `NOTIFY`,
 * `ATOMATON_OPS_LOG` in the environment the agent works in, and a
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
 * ## The run's identity, which #355 added
 *
 * The variables above change *where a child writes*; `AGENT` and `GITHUB_RUN_ID`
 * change *what it writes*. Both are the identity of the run executing the suite: a
 * spawned server inherits them, stamps them onto the comment bodies it posts as
 * `atomaton:agent=` and `run=`, and a body assertion then holds or fails depending on
 * which agent happened to run the suite. `AGENT` does not exist in CI at all, so the
 * suite there is green either way and the difference only ever shows up in a run --
 * which is the same "red for a reason the change did not cause" as above, one layer
 * further in.
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

/**
 * A spawn target that is `git`.
 *
 * `git` finds its repository through `GIT_DIR`/`GIT_WORK_TREE`, which OVERRIDE `cwd`, so
 * a child `git` started from a test inherits them and writes somewhere the test did not
 * name. #27 measured the damage: a suite run with those set to reconstruct another
 * branch's tree wrote a seed commit onto this repository's own local branch, set
 * `core.worktree` in `.git/config`, and left an index that no longer described the tree.
 */
const RUNS_GIT = /["'`]git["'`]/;

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
   * The `git` half of the same ratchet, from #27.
   *
   * A test that runs `git` in a temp dir still inherits `GIT_DIR`/`GIT_WORK_TREE` from the
   * caller, and those OVERRIDE `cwd`. The measured consequence was a run that rewrote
   * this repository's checkout -- a seed commit on its own branch, `core.worktree` in
   * `.git/config` -- while every assertion in the suite passed. `hermeticEnv()` removes
   * them, so a test that spawns `git` has to pass it, the same way the `bun` ones do.
   */
  test("does not hand a spawned git the run's own GIT_DIR or GIT_WORK_TREE", () => {
    const offenders = [...testFiles("src"), ...testFiles("tests")].filter((path) => {
      const source = readFileSync(path, "utf8");
      return SPAWNS.test(source) && RUNS_GIT.test(source) && !source.includes("hermeticEnv(");
    });

    expect(
      offenders,
      `import hermeticEnv() from src/entrypoints/machinery/testing/harness.ts and pass it as \`env\` ` +
        `to any \`git\` you spawn. GIT_DIR/GIT_WORK_TREE override \`cwd\`, so a child git reads and ` +
        `writes the repository the caller pointed it at rather than this test's temp dir: ${offenders.join(", ")}`,
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

describe("a test that spawns a server", () => {
  /**
   * The ratchet for #355, and the half that fails on the code as it was.
   *
   * The decoys are set here rather than inherited, so this test gives the same answer
   * in CI (where neither variable exists) and in an agent's run (where both do): the
   * environment the parent has is faked, not read. Before `hermeticEnv()` dropped
   * these two, `AGENT` came back as `zzdecoyagent` and the run id as `999999999`,
   * which is what a spawned server would then have stamped onto every comment body.
   *
   * The explicit-value-wins half is asserted beside it because it is the other side of
   * the same contract: `create_pr`'s tests declare `AGENT` on purpose, and a fix that
   * made a declaration impossible would be a different bug.
   */
  test("does not hand it the run's own AGENT or GITHUB_RUN_ID", () => {
    const saved = { AGENT: process.env.AGENT, GITHUB_RUN_ID: process.env.GITHUB_RUN_ID };
    process.env.AGENT = "zzdecoyagent";
    process.env.GITHUB_RUN_ID = "999999999";
    try {
      const env = hermeticEnv();
      expect(
        { AGENT: env.AGENT, GITHUB_RUN_ID: env.GITHUB_RUN_ID },
        "a spawned server that inherits these stamps the run's agent and run id onto every comment it " +
          "posts, so a body assertion depends on which agent ran the suite",
      ).toEqual({ AGENT: undefined, GITHUB_RUN_ID: undefined });
      expect(
        { ...env, AGENT: "engineer", GITHUB_RUN_ID: "42" },
        "a test that wants either declares it; the caller's env is spread after this one and must win",
      ).toMatchObject({ AGENT: "engineer", GITHUB_RUN_ID: "42" });
    } finally {
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  /**
   * The behavioural half: the suite whose assertions are about comment bodies gives
   * the same answer when the run's identity is faked.
   *
   * `mcp.test.ts` is where #355 measured the leak -- a `launch_sub_agent` test
   * declaring only `NUMBER` still posted `agent=engineer` and the run's own
   * `run=40166802492` -- so it is the file that has to stay green under a decoy rather
   * than an abstract probe. The decoy differs from every value the file declares, so a
   * test that reads the run's identity instead of its own fixture shows up here.
   *
   * Why this file and not the whole suite: `bun run test` is minutes, and every file
   * that spawns a server goes through the same `hermeticEnv()` call the ratchet above
   * pins. What this can see is that no assertion in this file depends on the identity
   * being whatever the parent had; what it cannot see is a body assertion written in a
   * file that does not spawn `bun` at all.
   */
  test("the suite that asserts comment bodies stays green with the run's AGENT faked", () => {
    const r = spawnSync("bun", ["test", join(process.cwd(), "src/entrypoints/tools/mcp/mcp.test.ts")], {
      encoding: "utf8",
      env: { ...hermeticEnv(), AGENT: "zzdecoyagent", GITHUB_RUN_ID: "999999999" },
      timeout: 120_000,
    });
    expect(
      r.status,
      `mcp.test.ts is red when the suite is run by an agent whose name is not the one a fixture names, ` +
        `so its assertions are reading the environment rather than their own env:\n${r.stdout}\n${r.stderr}`,
    ).toBe(0);
  }, 180_000);
});

