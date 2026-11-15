import { describe, expect, test } from "bun:test";
import { pathClaimedBy, pathMatches, pathPatternListProblem, pathPatternProblem } from "./path-patterns.ts";

describe("pathMatches", () => {
  test("a directory pattern claims everything under it", () => {
    expect(pathMatches(".github/workflows/ci.yml", ".github/**")).toBe(true);
    expect(pathMatches(".github/atomaton-runtime/scripts/deep/nested.ts", ".github/**")).toBe(true);
  });

  test("a literal pattern claims exactly one path", () => {
    expect(pathMatches("package.json", "package.json")).toBe(true);
    expect(pathMatches("web/package.json", "package.json")).toBe(false);
  });

  test("a directory pattern does not claim a sibling with the same prefix", () => {
    expect(pathMatches("db/migrations-old/x.sql", "db/migrations/**")).toBe(false);
  });
});

// The `!` prefix means nothing on one pattern — it means something on a list, and
// the meaning is the order. Kept separate from `pathMatches` for that reason: a
// caller that compares one pattern at a time cannot express an exclusion at all.
describe("pathClaimedBy", () => {
  test("a file is claimed by a pattern that covers it", () => {
    expect(pathClaimedBy(".github/workflows/ci.yml", [".github/**"])).toBe(true);
  });

  // The whole point of the prefix: a narrow exclusion carved out of a broad
  // pattern, without restating everything that stays covered.
  test("the last pattern to match decides", () => {
    const patterns = [".github/**", "!.github/atomaton/skills/**"];
    expect(pathClaimedBy(".github/atomaton/skills/x.md", patterns)).toBe(false);
    expect(pathClaimedBy(".github/atomaton/config.yaml", patterns)).toBe(true);
  });

  // Order is the meaning, and this is the ordering that reads as an exclusion to
  // its author and is not one. It governs, which is the safe direction to be
  // wrong in and the reason the docs say to put exclusions last.
  test("an exclusion written before what it excludes does not win", () => {
    const patterns = ["!.github/atomaton/skills/**", ".github/**"];
    expect(pathClaimedBy(".github/atomaton/skills/x.md", patterns)).toBe(true);
  });

  // A second exclusion can put a file back, the way .gitignore's `!` can. Naming
  // the same file twice is not an error, so the later one has to decide.
  test("a later pattern re-claims what an earlier exclusion gave up", () => {
    const patterns = [".github/**", "!.github/atomaton/skills/**", ".github/atomaton/skills/pinned.md"];
    expect(pathClaimedBy(".github/atomaton/skills/pinned.md", patterns)).toBe(true);
    expect(pathClaimedBy(".github/atomaton/skills/x.md", patterns)).toBe(false);
  });

  // Nothing matched, nothing claimed. The alternative — an unmatched file counting
  // as claimed — would make a list of exclusions alone govern every path in the
  // repository, which is not what its author wrote.
  test("a file no pattern matches is not claimed", () => {
    expect(pathClaimedBy("src/index.ts", [".github/**", "!package.json"])).toBe(false);
    expect(pathClaimedBy(".github/workflows/ci.yml", ["!.github/workflows/**"])).toBe(false);
    expect(pathClaimedBy(".github/workflows/ci.yml", [])).toBe(false);
  });
});

describe("pathPatternProblem", () => {
  test("the two supported forms are accepted", () => {
    expect(pathPatternProblem(".github/**")).toBe("");
    expect(pathPatternProblem("db/migrations/**")).toBe("");
    expect(pathPatternProblem("package.json")).toBe("");
  });

  // The reason this function exists. Each of these would be compared literally,
  // match nothing, and leave someone believing they had a gate.
  test("a wildcard anywhere but the trailing /** is rejected", () => {
    for (const pattern of ["**/*.sql", "*.ts", "db/*/migrations/**", "db/mig*/**", "db/**/x.sql"]) {
      expect(pathPatternProblem(pattern), pattern).toContain("glob character");
    }
  });

  // A trailing slash is how most people write a directory, and it was the one
  // spelling that passed this check and then matched nothing — the failure the
  // module exists to prevent, reached through the validator rather than around
  // it. The message names the fix because the fix is one character.
  test("a trailing slash is rejected, and the message says what to write", () => {
    const problem = pathPatternProblem("db/migrations/");
    expect(problem).toContain("match nothing");
    expect(problem).toContain('"db/migrations/**"');
  });

  // Same class: read as a glob, behaved as a filename.
  test("other glob characters are rejected", () => {
    for (const pattern of ["logs/?.txt", "db/[0-9]/x.sql", "src/{a,b}/x.ts", "logs/a].txt"]) {
      expect(pathPatternProblem(pattern), pattern).toContain("glob character");
    }
  });

  test("a directory pattern must name a directory", () => {
    expect(pathPatternProblem("/**")).toContain("names no directory");
  });

  test("empty and untrimmed patterns are rejected", () => {
    expect(pathPatternProblem("")).not.toBe("");
    expect(pathPatternProblem("   ")).not.toBe("");
    expect(pathPatternProblem(" db/** ")).toContain("whitespace");
  });

  test("a non-string is rejected rather than coerced", () => {
    expect(pathPatternProblem(42 as unknown as string)).not.toBe("");
    expect(pathPatternProblem(undefined as unknown as string)).not.toBe("");
  });

  // #551. `!` was not in the glob characters and not a form this matcher had, so
  // it passed here and then matched nothing: an exclusion that excluded nothing,
  // under a validator saying the pattern was fine. Both halves are now the same
  // form, so an accepted pattern is one that can act.
  test("an exclusion is accepted, and its body is held to the same rules", () => {
    expect(pathPatternProblem("!.github/atomaton/skills/**")).toBe("");
    expect(pathPatternProblem("!package.json")).toBe("");
    expect(pathPatternProblem("!db/migrations/")).toContain("ends in a slash");
    expect(pathPatternProblem("!**/*.md")).toContain("glob character");
    expect(pathPatternProblem("!")).toContain('bare "!"');
    expect(pathPatternProblem("!!x")).toContain('"!!"');
    expect(pathPatternProblem("! /x")).toContain("whitespace");
  });
});

// The form of each pattern is the question above; whether the LIST can act is a
// different one, and the only one an exclusion gets wrong on its own.
describe("pathPatternListProblem", () => {
  test("a list with something to carve out of is fine", () => {
    expect(pathPatternListProblem([".github/**", "!.github/atomaton/skills/**"])).toBe("");
    expect(pathPatternListProblem(["package.json"])).toBe("");
    expect(pathPatternListProblem([])).toBe("");
  });

  // Reads as "everything except this" and behaves as "nothing at all" — the same
  // silence as a gate that never fires, and one line of YAML away.
  test("a list made only of exclusions matches nothing, and says so", () => {
    expect(pathPatternListProblem(["!.github/atomaton/skills/**"])).toContain("matches nothing");
    expect(pathPatternListProblem(["!a/**", "!b/**"])).toContain("matches nothing");
  });
});
