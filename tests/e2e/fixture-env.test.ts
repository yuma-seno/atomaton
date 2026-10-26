/**
 * fixture-env.test.ts — what `runAtoma` hands the fixture's `atoma` (#403).
 *
 * The defect was the inheritance, not the fixture: an agent's run carries the runner's
 * `TYPE`/`NUMBER`, the test's atoma read the node kind from `TYPE`, and
 * `launch_sub_agent` refused with "this run is on a pull request" for a change that
 * touched neither. `bun test ./tests/e2e` with `TYPE=pr NUMBER=401` reproduced it at
 * `launch-sub-agent.e2e.test.ts:118`; the same tree with `env -u TYPE -u NUMBER` was
 * 9 pass, 0 fail.
 *
 * No binary and no spawn: this is the half of it that can be asserted in milliseconds,
 * and it is the half a regression would come back through — putting `process.env` back
 * into that spawn is the whole of the change that caused it.
 */
import { expect, test } from "bun:test";
import { fixtureEnv } from "./run-atoma.ts";

/**
 * What an agent run's environment has and CI's does not: the node the run sits on, the
 * run's own identity, and the machinery it is deployed in.
 */
const RUN_ENV = {
  TYPE: "pr",
  NUMBER: "401",
  NOTIFY: "yuma-seno",
  AGENT: "engineer",
  ATOMATON_MACHINERY_ROOT: "/nonexistent-machinery",
  ATOMATON_OPS_LOG: "/tmp/decoy-ops.log",
  ATOMATON_RUN_DIR: "/tmp/decoy-run",
  GITHUB_RUN_ID: "999999999",
};

/**
 * Runs `fn` with `RUN_ENV` forced into this process's environment, then puts back
 * whatever was there — this file may itself be running inside an agent's run, which is
 * the situation it is about.
 */
function withRunEnv<T>(fn: () => T): T {
  const saved = Object.entries(RUN_ENV).map(([name]) => [name, process.env[name]] as const);
  Object.assign(process.env, RUN_ENV);
  try {
    return fn();
  } finally {
    for (const [name, value] of saved) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

test("the fixture's atoma does not inherit the run that started the suite", () => {
  withRunEnv(() => {
    const env = fixtureEnv({ OPENAI_BASE_URL: "http://127.0.0.1:1/v1" });
    expect(Object.keys(RUN_ENV).filter((name) => env[name] !== undefined)).toEqual([]);
    // What a child needs in order to start at all still comes through, or every
    // fixture would fail for a reason of its own.
    expect(env.PATH).toBe(process.env.PATH);
    expect(env.OPENAI_BASE_URL).toBe("http://127.0.0.1:1/v1");
  });
});

test("a name a fixture means something by is still the fixture's value", () => {
  withRunEnv(() => {
    expect(fixtureEnv({ TYPE: "issue", NUMBER: "7" })).toMatchObject({ TYPE: "issue", NUMBER: "7" });
  });
});
