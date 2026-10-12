import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { toolDefaults } from "../../src/domain/machinery/shipped-servers.ts";

describe("skill catalog", () => {
  test("has valid, unique metadata and non-empty instructions", () => {
    const files: string[] = [];
    const collect = (directory: string): void => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) collect(path);
        else if (entry.isFile() && entry.name.endsWith(".md")) files.push(path);
      }
    };
    collect("src/content/skills");

    const names = new Set<string>();
    for (const file of files) {
      const document = readFileSync(file, "utf8");
      // `\r?` on every newline: a Windows checkout has CRLF line endings, and without
      // it this matched nothing at all -- so the test failed for anyone working on
      // Windows and passed in CI, which is the least useful place for a check to
      // disagree with the person it is checking.
      const match = document.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/);
      expect(match, `${file} must have YAML frontmatter and a body`).not.toBeNull();
      const metadata = Bun.YAML.parse(match![1]!) as { name?: string; description?: string };
      expect(metadata.name?.trim(), `${file} name`).toBeTruthy();
      expect(metadata.description?.trim(), `${file} description`).toBeTruthy();
      expect(match![2]!.trim(), `${file} instructions`).toBeTruthy();
      expect(names.has(metadata.name!), `duplicate skill name: ${metadata.name}`).toBe(false);
      names.add(metadata.name!);
    }

    // Not an exact count. What this guards is that the walk found anything at
    // all — a mistyped directory would make every check above vacuous and the
    // test would pass on zero files. Pinning the number instead made adding a
    // skill a test edit, which taught nothing and caught nothing.
    expect(files.length, "no skills found; check the walk's starting directory").toBeGreaterThan(0);
  });

  /**
   * A skill names its tools the way a run reaches them, and that means bare.
   *
   * Every server in `tools/defaults.yaml` sets `unprefixed: true`, so a tool is
   * registered under its own name — `probe`, `create_pr`, `bash` — and
   * `server__tool` names nothing. This is not a style rule: a skill that says
   * `attachments__publish_draft` tells an agent to call a tool that does not
   * exist, the call comes back unknown, and the skill's own "if this tool is not
   * among yours, the layer is not deployed" branch then reports a deployment gap
   * about a tool that is right there. Measured on `docs/design-doc`'s first
   * draft, which spelled all six of its tool references that way.
   *
   * The `atoma_builtin__` prefix is the core's own and is not covered: it names
   * the tools atoma adds itself, whose spelling no skill here decides.
   */
  test("a skill does not write a shipped server's tool as `server__tool`", () => {
    const servers = Object.keys(toolDefaults().servers);
    const files: string[] = [];
    const collect = (directory: string): void => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) collect(path);
        else if (entry.isFile() && entry.name.endsWith(".md")) files.push(path);
      }
    };
    collect("src/content/skills");

    const wrong: string[] = [];
    for (const file of files) {
      const document = readFileSync(file, "utf8");
      for (const server of servers) {
        for (const match of document.matchAll(new RegExp(`\`${server}__([a-z_]+)\``, "g"))) {
          wrong.push(`${file}: \`${server}__${match[1]}\` — call it \`${match[1]}\``);
        }
      }
    }
    expect(
      wrong,
      "a shipped server is `unprefixed`, so its tools are called by their own names; a name " +
        "carrying the server prefix is one no run has",
    ).toEqual([]);
  });
});
