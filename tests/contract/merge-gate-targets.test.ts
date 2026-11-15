/**
 * merge-gate-targets.test.ts — the files this repository's merge gates name, held
 * to the files that exist.
 *
 * ## The failure this exists for
 *
 * A gate says "a change to `src/domain/merge-readiness.ts` is a person's to merge".
 * Move that file and the gate keeps parsing, keeps validating, and matches nothing
 * — so it stops firing, and the only symptom is an agent merging something it
 * should have handed over. Splitting `src/domain/` into four contexts moved three
 * of the four paths this repository's one gate names, and nothing would have said
 * so.
 *
 * That is the shape this repository keeps finding: a guard that silently does not
 * run is indistinguishable from one that passes. `deliverable-integrity.ts`
 * validates a gate's SHAPE — unknown keys are an error, because a typo in
 * `files_added` matches nothing — and this is the other half of that argument
 * applied to the values.
 *
 * ## Both copies
 *
 * The gate in force is the one in the machinery tree, `.github/atomaton/config.yaml`.
 * `self/atomaton/config.yaml` is what the next self-deploy would put back. A path
 * corrected in one and not the other is a gate that works until it is redeployed,
 * or one that does not work until then, so both are read here.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { governedPathsIn } from "../../src/domain/delivery/merge-readiness.ts";
import { pathMatches, pathPatternTarget } from "../../src/domain/delivery/path-patterns.ts";
import { hermeticEnv } from "../../src/entrypoints/machinery/testing/harness.ts";

const CONFIGS = [".github/atomaton/config.yaml", "self/atomaton/config.yaml"];

/** Every file git knows about, for the patterns that are globs rather than paths. */
function trackedFiles(): string[] {
  const listed = spawnSync("git", ["ls-files"], { encoding: "utf8", env: hermeticEnv() });
  expect(listed.status, "could not list the repository's files").toBe(0);
  return listed.stdout.split("\n").filter(Boolean);
}

interface Gate {
  reason?: string;
  when?: { files_changed?: string[]; files_added?: string[] };
}

/**
 * Whether `pattern` names something that exists.
 *
 * A `!` is now a form either list may carry, and the name that has to resolve is
 * the one after it: an exclusion pointed at a path nothing has is an exclusion
 * that excludes nothing, which is the same silence as a gate that never fires.
 */
function namesSomething(pattern: string): boolean {
  const target = pathPatternTarget(pattern);
  return target.includes("*")
    ? trackedFiles().some((file) => pathMatches(file, target))
    : existsSync(target);
}

function gatesOf(path: string): Gate[] {
  const config = Bun.YAML.parse(readFileSync(path, "utf8")) as { merge?: { gates?: Gate[] } };
  return config.merge?.gates ?? [];
}

describe.each(CONFIGS)("%s", (config) => {
  const named = gatesOf(config).flatMap((gate) => [
    ...(gate.when?.files_changed ?? []),
    ...(gate.when?.files_added ?? []),
  ]);

  test("names at least one file, or the gate section is empty on purpose", () => {
    expect(gatesOf(config).length === 0 || named.length > 0).toBe(true);
  });

  test.each(named)("a gate names %s, and it is there", (pattern) => {
    expect(namesSomething(pattern), `no file matches the gate pattern ${pattern}; the gate cannot fire`).toBe(true);
  });
});

describe("the two copies", () => {
  test("name the same files, so a deploy does not change which gates fire", () => {
    const [live, overlay] = CONFIGS.map((c) => JSON.stringify(gatesOf(c)));
    expect(overlay).toBe(live);
  });
});

/**
 * `merge.governed_paths`, held to the same rule as the gates above and to one the
 * gates do not need: an exclusion has to exclude something.
 *
 * A pattern that matches nothing is the failure both halves share — a gate that
 * never fires and an exclusion that excludes nothing are the same silence, and one
 * of them (#551) was this repository's own config being read without complaint.
 * The restates below then check that the list does what it says, because a name
 * that resolves is not yet a rule that applies.
 */
function governedOf(path: string): string[] {
  const config = Bun.YAML.parse(readFileSync(path, "utf8")) as { merge?: { governed_paths?: string[] } };
  return config.merge?.governed_paths ?? [];
}

describe.each(CONFIGS)("%s governed_paths", (config) => {
  test.each(governedOf(config))("names something that exists: %s", (pattern) => {
    expect(namesSomething(pattern), `nothing matches ${pattern}; the entry does nothing`).toBe(true);
  });

  // The carve-out this repository added for #218, checked where it is meant to
  // apply rather than as text in a file: what an agent writes down about how this
  // project works is not a merge a person has to perform, and everything deciding
  // what that agent may reach still is.
  test("the prompt template and the skills are not governed; config.yaml is", () => {
    const patterns = governedOf(config);
    const ungoverned = adoptedPathsUnder(".github/atomaton/skills").concat(
      ".github/atomaton/prompt-template.md",
    );
    expect(ungoverned.length).toBeGreaterThan(1);
    expect(governedPathsIn(ungoverned, patterns)).toEqual([]);
    expect(governedPathsIn([".github/atomaton/config.yaml"], patterns)).toEqual([
      ".github/atomaton/config.yaml",
    ]);
  });
});

/**
 * The tracked files under `dir`.
 *
 * From git rather than the directory, so a deployed copy that happens to be
 * sitting in the tree unbranched does not satisfy the test above on its own.
 */
function adoptedPathsUnder(dir: string): string[] {
  return trackedFiles().filter((file) => file.startsWith(`${dir}/`));
}
