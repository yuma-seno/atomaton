/**
 * deployed-config.test.ts — this repository's OWN config.yaml, validated.
 *
 * ## The failure this exists for
 *
 * `validate_deliverable.ts` checks the `.github/atomaton/` a pull request would
 * merge, and it ran on every pull request. What nothing checked is whether
 * `src/content/config.yaml` — the template — and `.github/atomaton/config.yaml` —
 * this repository's copy of its own config — say the same thing about a key that
 * is REQUIRED.
 *
 * The `agents` section was added to the template with `on_config_finding` required,
 * and this repository's own copy was never given one. The consequence was not a
 * warning. `configProblems` reported it for the tree every pull request would merge,
 * `decideValidationOutcome` turned that into `deliverable-invalid`, and CI was never
 * dispatched — so EVERY pull request in this repository failed validation before its
 * checks ran, for a setting none of them touched. Recovering the first one meant a
 * second agent run whose whole content was the one-line fix, and the pull request
 * that found it could not be reviewed until that landed.
 *
 * ## Why this file and not one of the three that read a config
 *
 * `config-contract.test.ts` validates the SHIPPED config against `configProblems`,
 * `merge-gate-targets.test.ts` compares the two copies' merge gates, and the
 * machinery's own update three-way merges the deployed copy — so a change to the
 * shipped copy alone is already visible. The hole is the case nobody reads: the
 * deployed copy the agents here actually run under, against the validator, with the
 * names that sit beside it. `src/content/config.yaml` is not that — it is the
 * template, it is not what the agents here run under, and it is the one that had
 * the key.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { configProblems } from "../../src/domain/delivery/deliverable-integrity.ts";

/** This repository's own config, the one the live agents run under. */
const CONFIGS = [".github/atomaton/config.yaml"];

function agentNames(dir: string): string[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.slice(0, -".md".length))
    .sort();
}

function problemsFor(configPath: string): string[] {
  return configProblems({
    config: Bun.YAML.parse(readFileSync(configPath, "utf8")),
    // The definitions and workflows that sit beside THIS config, which is what the
    // validator checks a name against. Reading the shipped ones would answer a
    // different question: whether the template is self-consistent.
    agentNames: agentNames(".github/atomaton/agent-definitions"),
    workflowFiles: readdirSync(".github/workflows"),
  });
}

describe.each(CONFIGS)("%s", (configPath) => {
  /**
   * The keys `configProblems` requires rather than defaults, checked here so the
   * failure names the config a person has to edit. `agents.on_config_finding` is
   * the one that was missing; the assertion is deliberately over the whole list
   * rather than that key alone, so the next required key is covered on the day it
   * is added to `REQUIRED_AGENT_KEYS`.
   */
  test("is internally consistent, so CI runs on the pull requests that follow", () => {
    expect(
      problemsFor(configPath),
      `${configPath} is what this repository's agents actually run under, and what every pull ` +
        `request's validation reads. A problem here blocks CI for every pull request, not only ` +
        `the one that touched it`,
    ).toEqual([]);
  });
});

describe("the shipped template and this repository's own config", () => {
  /**
   * The direction the drift actually went: the template gained a required key and
   * this repository's copy did not follow. Not a byte comparison — the two are
   * this repository's own adoption and the shipped template, and may differ by
   * design. This checks the keys that make the deliverable valid.
   */
  test("both set every agent a workflow starts with no thread to read", () => {
    const shipped = Bun.YAML.parse(readFileSync("src/content/config.yaml", "utf8")) as {
      agents?: Record<string, unknown>;
    };
    const own = Bun.YAML.parse(readFileSync(CONFIGS[0]!, "utf8")) as { agents?: Record<string, unknown> };
    for (const key of Object.keys(shipped.agents ?? {})) {
      expect(own.agents?.[key], `${key} is in src/content/config.yaml and missing here`).toBe(
        shipped.agents![key],
      );
    }
  });

  // A walk that finds nothing compares equal to one that passes -- the shape both
  // this file and `config-contract.test.ts` were written after.
  test("the inputs this reads are really there", () => {
    expect(agentNames(".github/atomaton/agent-definitions").length).toBeGreaterThan(0);
    expect(readdirSync(join(".github", "workflows")).length).toBeGreaterThan(0);
  });
});
