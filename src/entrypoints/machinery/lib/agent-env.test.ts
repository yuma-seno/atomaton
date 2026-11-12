/**
 * agent-env.test.ts — the environment the tool servers run under, and the two
 * run facts computed beside it.
 *
 * The environment was an inline bash array in the agent step until that step
 * outgrew GitHub's 21,000-character bound on one expression, and the list moved
 * here. What the move buys is that the entries can be asserted as behaviour:
 * this file calls `buildAgentEnv` and holds what a server receives, rather than
 * grepping generated YAML for strings a refactor could reorder. The contract
 * with `AGENT_ENV_NAMES` is held by `tests/contract/agent-environment.test.ts`,
 * which calls the same function; this file holds the values and the conditionals.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { agentBudget, buildAgentEnv, changedSoFar } from "./agent-env.ts";
import { removeTemp } from "../testing/harness.ts";

function source(overrides: Record<string, string | undefined> = {}): Record<string, string | undefined> {
  return {
    HOME: "/home/runner",
    PATH: "/usr/bin:/bin",
    AGENT: "engineer",
    ATOMATON_MACHINERY_ROOT: "/tmp/machinery",
    ATOMATON_UNTRUSTED_USER: "atomaton-untrusted",
    GITHUB_REPOSITORY: "o/r",
    BRANCH: "atomaton/issue-1",
    NUMBER: "1",
    NOTIFY: "",
    TYPE: "issue",
    ATOMATON_RELOAD_COUNT: "0",
    ATOMATON_DISPATCHED_BY: "",
    ATOMATON_ASK_ID: "",
    GITHUB_RUN_ID: "42",
    ATOMATON_OPS_LOG: "/run/atomaton_ops.log",
    GITHUB_SERVER_URL: "https://github.com",
    ...overrides,
  };
}

describe("buildAgentEnv", () => {
  test("every entry arrives as NAME=VALUE, and the run's URL is built from its parts", () => {
    const entries = buildAgentEnv(source(), { toolCache: "/tmp/cache", runDir: "/run" });
    expect(entries).toContain("HOME=/home/runner");
    expect(entries).toContain("ATOMATON_MACHINERY_ROOT=/tmp/machinery");
    expect(entries).toContain("ATOMATON_UNTRUSTED_USER=atomaton-untrusted");
    expect(entries).toContain("BRANCH=atomaton/issue-1");
    expect(entries).toContain("ATOMATON_RUN_DIR=/run");
    expect(entries).toContain("ATOMATON_RUN_URL=https://github.com/o/r/actions/runs/42");
  });

  test("the caches are redirected to the tool cache, one subdirectory each", () => {
    const entries = buildAgentEnv(source(), { toolCache: "/tmp/cache", runDir: "/run" });
    for (const expected of [
      "XDG_CACHE_HOME=/tmp/cache",
      "XDG_CONFIG_HOME=/tmp/cache/config",
      "XDG_DATA_HOME=/tmp/cache/data",
      "BUN_INSTALL_CACHE_DIR=/tmp/cache/bun",
      "npm_config_cache=/tmp/cache/npm",
      "PIP_CACHE_DIR=/tmp/cache/pip",
      "CARGO_HOME=/tmp/cache/cargo",
    ]) {
      expect(entries, expected).toContain(expected);
    }
  });

  test("the provider settings are promoted from their _IN spell, and only when set", () => {
    const both = buildAgentEnv(source({ OPENAI_BASE_URL_IN: "https://base.example", ATOMA_PROVIDER_IN: "openrouter" }), { toolCache: "/c", runDir: "/r" });
    expect(both, "a set base URL arrives under the name atoma reads").toContain("OPENAI_BASE_URL=https://base.example");
    expect(both).toContain("ATOMA_PROVIDER=openrouter");
    expect(both.some((entry) => entry.startsWith("OPENAI_BASE_URL_IN=")), "the _IN spell never reaches a server").toBe(false);

    const empty = buildAgentEnv(source({ OPENAI_BASE_URL_IN: "", ATOMA_PROVIDER_IN: undefined }), { toolCache: "/c", runDir: "/r" });
    // An empty base URL is not "unset" to atoma — it points every request at
    // "/chat/completions" — so an empty _IN arrives as no entry at all.
    expect(empty.some((entry) => entry.startsWith("OPENAI_BASE_URL="))).toBe(false);
    expect(empty.some((entry) => entry.startsWith("ATOMA_PROVIDER="))).toBe(false);
  });
});

describe("agentBudget", () => {
  test("what is left of the job, whole seconds", () => {
    expect(agentBudget(2000, 1000, 60)).toEqual({ budget: 1000, floored: false });
  });

  test("a floor when the job is at its end, so the run can still act", () => {
    expect(agentBudget(1030, 1000, 60)).toEqual({ budget: 60, floored: true });
    expect(agentBudget(900, 1000, 60)).toEqual({ budget: 60, floored: true });
  });
});

describe("changedSoFar", () => {
  test("a commit, a pull request or a merge is progress", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-progress-"));
    try {
      const log = join(dir, "atomaton_ops.log");
      writeFileSync(log, '{"op":"create_pr","number":7}\n');
      expect(changedSoFar(log)).toBe(true);
      writeFileSync(log, '{"op":"merge_base_into_branch","status":"merged"}\n');
      expect(changedSoFar(log)).toBe(true);
    } finally {
      removeTemp(dir);
    }
  });

  test("a clean merge is progress; its other outcomes are not", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-progress-"));
    try {
      const log = join(dir, "atomaton_ops.log");
      writeFileSync(log, '{"op":"merge_base_into_branch","status":"up_to_date"}\n');
      expect(changedSoFar(log), "finding there was nothing to do is not a change").toBe(false);
      writeFileSync(log, '{"op":"merge_base_into_branch","status":"conflicts"}\n');
      expect(changedSoFar(log), "waiting on the agent is not a change").toBe(false);
    } finally {
      removeTemp(dir);
    }
  });

  test("no log is no progress, and never an error", () => {
    expect(changedSoForwardSafe()).toBe(false);
  });

  /** The path a run without an ops log yet takes — the file does not exist. */
  function changedSoForwardSafe(): boolean {
    return changedSoFar(join(tmpdir(), "atomaton-progress-missing", "atomaton_ops.log"));
  }
});
