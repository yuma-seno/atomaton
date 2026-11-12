/**
 * agent-environment.test.ts — what the agent's servers receive, and what a
 * project may therefore not declare, are one list.
 *
 * ## The failure this exists for
 *
 * `TOOL_SECRETS.reserved` is what `tools.secrets` may not name, and the reason a
 * name is on it is that the agent's process already means something by it. That
 * made it a hand-written copy of the runner's `AGENT_ENV`, and its own comment
 * said what a hand-written copy does:
 *
 * > it is right until the day something is added to one side.
 *
 * It had been. Twelve names were in `AGENT_ENV` and not reserved — `HOME`, `PATH`,
 * `ATOMATON_MACHINERY_ROOT`, `GITHUB_REPOSITORY`, `BRANCH` and the seven cache
 * directories — added to the runner over time and never mirrored back. The first
 * drift of the same list, `ATOMA_COPILOT_TOKEN`, is what the comment was written
 * about; this is the second.
 *
 * So the names live in `domain/delivery/declared-secrets.ts` and the generator
 * reads them. The environment itself is built by `buildAgentEnv` in
 * `entrypoints/machinery/lib/agent-env.ts` — it moved out of the runner's inline
 * bash when that step outgrew GitHub's 21,000-character expression bound — and
 * this test now calls the function directly: the names the agent's servers will
 * receive, compared against the names a project may not shadow. Reading the
 * generated YAML cannot hold the two together any more; calling the function can.
 */
import { describe, expect, test } from "bun:test";
import { AGENT_ENV_NAMES, TOOL_SECRETS } from "../../src/domain/delivery/declared-secrets.ts";
import { buildAgentEnv } from "../../src/entrypoints/machinery/lib/agent-env.ts";

/** A source environment with every input the runner's step carries, and a value apiece. */
function fakeSource(): Record<string, string> {
  const source: Record<string, string> = {};
  for (const name of AGENT_ENV_NAMES) {
    if (name === "OPENAI_BASE_URL" || name === "ATOMA_PROVIDER") continue;
    source[name] = `value-of-${name}`;
  }
  // The provider inputs arrive under their `_IN` spell, promoted when non-empty.
  source.OPENAI_BASE_URL_IN = "https://base.example";
  source.ATOMA_PROVIDER_IN = "openrouter";
  return source;
}

describe("the agent's environment", () => {
  /** The names `buildAgentEnv` produces, from the fake source above. */
  function namesBuilt(): string[] {
    return buildAgentEnv(fakeSource(), { toolCache: "/cache", runDir: "/run" }).map((entry) => entry.slice(0, entry.indexOf("=")));
  }

  test("is exactly the list the reserved names are built from", () => {
    expect(new Set(namesBuilt())).toEqual(new Set(AGENT_ENV_NAMES));
  });

  /**
   * The point of the list. Every name the agent's process already means something
   * by is a name `tools.secrets` must not be able to mean something else by.
   */
  test("every one of them is refused to a project's own declaration", () => {
    const unreserved = AGENT_ENV_NAMES.filter((name) => !TOOL_SECRETS.reserved.has(name));
    expect(unreserved, `these are in the agent's environment and not reserved: ${unreserved.join(", ")}`).toEqual([]);
  });

  /**
   * Two entries are conditional, and the condition matters more than the value: a
   * base URL of `""` is not "unset" to atoma, it is a base URL — pointing every
   * request at "/chat/completions". So an empty `_IN` must arrive as no entry at
   * all, and a set one under its promoted name.
   */
  test("the provider settings are promoted only when set, under their own names", () => {
    const env = buildAgentEnv(fakeSource(), { toolCache: "/cache", runDir: "/run" });
    expect(env).toContain("OPENAI_BASE_URL=https://base.example");
    expect(env).toContain("ATOMA_PROVIDER=openrouter");
    expect(env.some((entry) => entry.startsWith("OPENAI_BASE_URL_IN="))).toBe(false);
    expect(env.some((entry) => entry.startsWith("ATOMA_PROVIDER_IN="))).toBe(false);

    const silent = buildAgentEnv(
      { ...fakeSource(), OPENAI_BASE_URL_IN: "", ATOMA_PROVIDER_IN: undefined },
      { toolCache: "/cache", runDir: "/run" },
    );
    expect(silent.some((entry) => entry.startsWith("OPENAI_BASE_URL="))).toBe(false);
    expect(silent.some((entry) => entry.startsWith("ATOMA_PROVIDER="))).toBe(false);
    expect(silent.some((entry) => entry.startsWith("ATOMA_PROVIDER_IN="))).toBe(false);
  });

  /** The names that had drifted, named so a revert is a failing test rather than a diff. */
  test("the names that were missing stay reserved", () => {
    for (const name of [
      "HOME",
      "PATH",
      "ATOMATON_MACHINERY_ROOT",
      "GITHUB_REPOSITORY",
      "BRANCH",
      "XDG_CACHE_HOME",
      "CARGO_HOME",
      "npm_config_cache",
    ]) {
      expect(TOOL_SECRETS.reserved.has(name), name).toBe(true);
    }
  });
});
