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
   * registered under its own name — `publish_draft`, `create_pr`, `bash` — and
   * `server__tool` names nothing. This is not a style rule: a skill that says
   * `attachments__publish_draft` tells an agent to call a tool that does not
   * exist, the call comes back unknown, and the skill's own "if this tool is not
   * among yours, the layer is not deployed" branch then reports a deployment gap
   * about a tool that is right there. A skill here once spelled all six of its tool
   * references that way.
   *
   * The built-in `load_skill` is named bare like the rest now. The `atoma_builtin__`
   * spelling it carried before answers to nothing — the core dropped the namespace —
   * so a skill writing it teaches a tool that has been removed, and it is treated as
   * the dead name it is rather than exempted as the core's own.
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
      // The built-in's own spelling. The old namespace name names nothing after the
      // rename, so it fails a skill the way a dead `server__tool` does; the bare
      // `load_skill` passes what is above and needs saying nothing extra here.
      for (const match of document.matchAll(/`atoma_builtin__[a-z_]+`/g)) {
        wrong.push(`${file}: ${match[0]} — the built-in is called \`load_skill\``);
      }
    }
    expect(
      wrong,
      "a shipped server is `unprefixed`, so its tools are called by their own names; a name " +
        "carrying the server prefix is one no run has",
    ).toEqual([]);
  });

  /**
   * The shipped skills index names every skill that ships.
   *
   * `src/content/README.md` is the only place an adopter can learn a skill exists: the
   * catalog an agent reads is built from this directory, so a skill missing from the
   * README loads fine and is never discovered by the person who could tune it. The
   * heading says "the agents and skills that ship" — a claim about a set — and nothing
   * read it against the set.
   *
   * It had already drifted both ways when this was written: `docs/customer-doc`
   * shipped in the release manifest and had no row, and the sentence under the table
   * said "the three above" while the table held four. Neither is visible from inside
   * the file that carries it, which is why this reads it against the directory.
   *
   * What is pinned is membership. A row may say anything about a skill, and the prose
   * around the table may be rewritten; only the name has to be there.
   */
  test("the shipped README names every skill in the catalog", () => {
    const readme = readFileSync("src/content/README.md", "utf8");

    const shipped: string[] = [];
    const collect = (directory: string): void => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) collect(path);
        else if (entry.isFile() && entry.name.endsWith(".md")) {
          const name = readFileSync(path, "utf8").match(/^---\r?\n[\s\S]*?\bname:\s*(\S+)/)?.[1];
          if (name) shipped.push(name);
        }
      }
    };
    collect("src/content/skills");

    // Without this the check below passes on a walk that found nothing, which is the
    // one failure mode a membership test has that a count test does not.
    expect(shipped.length, "no skills found; check the walk's starting directory").toBeGreaterThan(0);

    const missing = shipped.filter((name) => !readme.includes("`" + name + "`"));
    expect(
      missing,
      "the README is the only index of what ships, so a skill it omits is one an adopter " +
        "never learns they could tune. Add a row to the skill table",
    ).toEqual([]);
  });
});
