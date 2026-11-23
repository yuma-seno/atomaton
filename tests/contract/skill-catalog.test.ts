import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { toolDefaults } from "../../src/domain/machinery/shipped-servers.ts";

const SKILLS = "src/content/skills";
/** The file whose presence makes a directory a skill. Nothing else under here is one. */
const SKILL_FILE = "SKILL.md";

/**
 * Every skill's `SKILL.md`, found the way the loader finds them.
 *
 * A directory holding `SKILL.md` is the skill and the walk stops there, so the files
 * beside it — `scripts/`, `assets/`, whatever the skill reaches for — are resources
 * and never definitions. This is the shape every reader of the directory depends on:
 * the CLI that loads them, and the metrics report that asks which of them nothing
 * loaded.
 */
function skillFiles(): string[] {
  const files: string[] = [];
  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile() && entry.name === SKILL_FILE) files.push(path);
    }
  };
  walk(SKILLS);
  return files;
}

/** The name a run asks for: the directory the `SKILL.md` sits in. */
function leafName(file: string): string {
  return basename(dirname(file));
}

/** The frontmatter, as YAML, out of a `SKILL.md`. */
function metadataOf(file: string): { name?: string; description?: string } {
  const document = readFileSync(file, "utf8");
  // `\r?` on every newline: a Windows checkout has CRLF line endings, and without it
  // this matched nothing at all -- so the test failed for anyone working on Windows
  // and passed in CI, which is the least useful place for a check to disagree with
  // the person it is checking.
  const match = document.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/);
  expect(match, `${file} must have YAML frontmatter and a body`).not.toBeNull();
  expect(match![2]!.trim(), `${file} instructions`).toBeTruthy();
  return Bun.YAML.parse(match![1]!) as { name?: string; description?: string };
}

describe("skill catalog", () => {
  test("has valid, unique metadata and non-empty instructions", () => {
    const files = skillFiles();
    const names = new Set<string>();
    for (const file of files) {
      const metadata = metadataOf(file);
      expect(metadata.name?.trim(), `${file} name`).toBeTruthy();
      expect(metadata.description?.trim(), `${file} description`).toBeTruthy();
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
   * The layout the loader enforces, checked against the tree that ships.
   *
   * A skill is a directory holding `SKILL.md`, and its `name` has to be that
   * directory's own name — lowercase letters, digits and single hyphens. The author
   * of the loader rejects anything else, which means a skill whose `name` still
   * carries its category (`delivery/pipeline-setup`) is not a skill with an odd name:
   * it is one no run can load, and nothing else in this repository would notice.
   */
  test("every skill is named after its own directory, in the form the loader accepts", () => {
    for (const file of skillFiles()) {
      const { name } = metadataOf(file);
      const directory = leafName(file);
      expect(name, `${file}: name must equal the directory it is in`).toBe(directory);
      expect(name, `${file}: name must be lowercase letters, digits and single hyphens`).toMatch(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      );
      expect(name!.length, `${file}: name is capped at 64 characters`).toBeLessThanOrEqual(64);
    }
  });

  test("a description fits in the catalog's own limit", () => {
    for (const file of skillFiles()) {
      const { description } = metadataOf(file);
      expect(description!.length, `${file}: description is capped at 1024 characters`).toBeLessThanOrEqual(1024);
    }
  });

  /**
   * The catalog the nine shipped skills load as, by leaf name.
   *
   * This one list IS pinned, where the count above is not, because these names are
   * what an agent writes in `load_skill` and what an agent definition names: a rename
   * here is a broken instruction somewhere else, and a set that grew or shrank
   * silently is exactly what the loader cannot tell you about. Adding a skill means
   * adding its name below, one line, on purpose.
   */
  test("the shipped tree yields exactly the nine skills, by leaf name", () => {
    const names = skillFiles().map(leafName).sort();
    expect(names).toEqual([
      "agent-prompt-surface",
      "customer-doc",
      "environment",
      "gh-actions-surface",
      "japanese",
      "on-demand-audit",
      "pipeline-setup",
      "secrets-in-a-check",
      "web-search",
    ]);
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
    const wrong: string[] = [];
    for (const file of skillFiles()) {
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
    const shipped = skillFiles().map((file) => metadataOf(file).name!);

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
