import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { hermeticEnv, makeConfigDir, scriptPath } from "./testing/harness.ts";

/**
 * Run the script against the fixture `config.yaml` in `dir`, in a child that has
 * inherited none of the variables that exist only inside an Atomaton run.
 *
 * `env: hermeticEnv()` is load bearing here and not decoration. `loadConfig()`
 * resolves the file through `machineryPath(CONFIG_FILE)`, and the runner sets
 * `ATOMATON_MACHINERY_ROOT`, so a child that inherits it reads the DEPLOYED config
 * instead of the fixture below: `bun install --frozen-lockfile` then runs in a temp
 * directory with no `package.json` and exits 1, and these three tests are red inside
 * an agent's run while CI -- where the variable is unset -- stays green. The agent
 * cannot tell that failure from one its own change caused, which is the whole
 * damage; see `hermeticEnv` for the run that lost itself to it.
 */
function run(dir: string) {
  return spawnSync("bun", ["run", scriptPath("run_environment_setup.ts")], {
    encoding: "utf8",
    cwd: dir,
    env: hermeticEnv(),
  });
}

describe("run_environment_setup.ts", () => {
  test("runs configured setup commands in order", () => {
    const dir = makeConfigDir({ environment: { setup_commands: ["echo one", "echo two"] } });
    try {
      const r = run(dir);
      expect(r.status).toBe(0);
      expect(r.stdout).toContain("one");
      expect(r.stdout).toContain("two");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("aborts with the failing command's exit code", () => {
    const dir = makeConfigDir({ environment: { setup_commands: ["exit 3"] } });
    try {
      const r = run(dir);
      expect(r.status).toBe(3);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("no-ops quietly when no setup_commands are configured", () => {
    const dir = makeConfigDir({});
    try {
      const r = run(dir);
      expect(r.status).toBe(0);
      expect(r.stdout).toContain("skipping");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
