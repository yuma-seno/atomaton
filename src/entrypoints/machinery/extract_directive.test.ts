import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { extractDirective, hasAgentDefinition } from "./extract_directive.ts";

describe("extract_directive.ts", () => {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-defdir-"));
  writeFileSync(join(dir, "reviewer.md"), "---\nname: reviewer\n---\n");
  writeFileSync(join(dir, "engineer.md"), "---\nname: engineer\n---\n");

  test("extracts a plain slash-command directive", () => {
    expect(extractDirective("Done.\n/reviewer", dir)).toBe("reviewer");
  });

  test("rejects instructions on the directive line", () => {
    expect(extractDirective("Done.\n/reviewer please check this.", dir)).toBe("");
  });

  test("extracts a markdown-mangled backtick-wrapped directive", () => {
    expect(extractDirective("All set.\n/`engineer`", dir)).toBe("engineer");
  });

  test("ignores a directive that names a non-existent agent", () => {
    expect(extractDirective("/agent reviewer", dir)).toBe("");
  });

  test("returns empty when there is no directive at all", () => {
    expect(extractDirective("Just a plain summary.", dir)).toBe("");
  });
});

/**
 * The same bar a line clears, for a name that arrives as a bare value.
 *
 * A person's command carries the name it typed rather than text to be read, and it
 * has to be checked the same way: a name with no definition would fail at
 * `gh workflow run`, which is the moment there is nowhere left to report it.
 */
describe("hasAgentDefinition", () => {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-defdir-"));
  writeFileSync(join(dir, "reviewer.md"), "---\nname: reviewer\n---\n");

  test("accepts a name with a definition", () => {
    expect(hasAgentDefinition("reviewer", dir)).toBe(true);
  });

  test("rejects a name with no definition", () => {
    expect(hasAgentDefinition("engineer", dir)).toBe(false);
  });

  test("rejects the empty name, which is nobody", () => {
    expect(hasAgentDefinition("", dir)).toBe(false);
  });
});
