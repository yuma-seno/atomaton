import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * #306: the project skill and CONTRIBUTING gave opposite answers about `version` in
 * `package.json`, and a reviewer had to resolve them by reading further than either
 * document. They are edited by different hands at different times, and only one of
 * them is loaded into every agent run, so the agreement is pinned here.
 *
 * The agreed procedure (#306): a work pull request never carries the version edit,
 * and a release is declared by a person through the **Atomaton Release** workflow,
 * whose pull request carries only that edit. Merging it is the release.
 */
const SKILL = readFileSync("self/atomaton/skills/project/conventions.md", "utf8");
const CONTRIBUTING = readFileSync("CONTRIBUTING.md", "utf8");

describe("the version procedure is stated the same way in both documents", () => {
  test("the skill forbids the edit outright, and names who declares the release", () => {
    expect(SKILL).toContain("**Never touch `version` in `package.json`.");
    expect(SKILL).toContain("Atomaton Release");
    // The old rule made the bump normal whenever "releasing is the task", which is
    // every work pull request under the practice it contradicted.
    expect(SKILL).not.toContain("unless releasing is the task");
  });

  test("CONTRIBUTING names the release as a separate declaration, not a bump", () => {
    expect(CONTRIBUTING).toContain("dispatch **Atomaton Release**");
    expect(CONTRIBUTING).not.toContain("Bump `version` in `package.json` and merge it");
  });
});
