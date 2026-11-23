import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { classifyCall, skillsUnder } from "./write_metrics_report.ts";

/**
 * `skillsUnder` is the list the report subtracts the loaded skills from, so when it
 * comes back empty the report has nothing to call unused. It came back empty on every
 * run for as long as it asked git: the machinery is a release zip unpacked into
 * `${RUNNER_TEMP}/atomaton-machinery`, which is not a git repository, and `git
 * ls-files` over a path outside a repository lists nothing and says nothing.
 *
 * These are the two answers that must stay distinguishable -- a list, and not knowing
 * -- because the empty list in between is the one that reads as good news.
 */
describe("skillsUnder", () => {
  function tree(files: readonly string[]): string {
    const root = mkdtempSync(`${tmpdir()}/skills-`);
    for (const file of files) {
      const at = file.lastIndexOf("/");
      if (at > 0) mkdirSync(`${root}/${file.slice(0, at)}`, { recursive: true });
      writeFileSync(`${root}/${file}`, "# skill");
    }
    return root;
  }

  /**
   * The name is the directory's, not a path with a suffix taken off it. A run loads
   * `pipeline-setup`: the category is where the file lives, not part of what it is
   * called, and the loader rejects a `SKILL.md` whose `name` says otherwise.
   */
  test("names a skill by the directory its SKILL.md sits in", () => {
    const root = tree(["delivery/pipeline-setup/SKILL.md", "engineering/tdd/SKILL.md"]);
    expect(skillsUnder(root)).toEqual(["pipeline-setup", "tdd"]);
  });

  test("a directory that is not there is not an empty catalogue", () => {
    expect(skillsUnder(`${tmpdir()}/atomaton-no-such-skills-dir`)).toBeUndefined();
  });

  /**
   * The case that hid `delivery/pipeline-setup` at zero loads: a readable directory
   * holding nothing this recognises answers the same as an unreadable one. A deployed
   * tree always ships skills, so either way this looked in the wrong place.
   */
  test("a directory with no skill in it is not an empty catalogue either", () => {
    expect(skillsUnder(tree(["README.txt"]))).toBeUndefined();
    expect(skillsUnder(tree([]))).toBeUndefined();
  });

  /**
   * A loose `.md` is a file the loader ignores, so counting it here would list it as
   * never loaded, on every report, for as long as it exists. The resources beside a
   * `SKILL.md` are not skills either.
   */
  test("ignores a loose .md and the resources beside a SKILL.md", () => {
    const root = tree([
      "engineering/tdd/SKILL.md",
      "engineering/tdd/scripts/run.mjs",
      "engineering/tdd/assets/template.fodt",
      "engineering/notes.md",
      "README.txt",
    ]);
    expect(skillsUnder(root)).toEqual(["tdd"]);
  });
});

/**
 * Both branches are keyed on a tool's name, and a name this file gets wrong is silent:
 * the call is still counted, it just carries nothing.
 *
 * That is not hypothetical. The `act` branch read `endsWith("shell_execute")`, the name
 * the shell server used before it was renamed to `bash`, so no call ever set an act
 * again — `byAct` came back empty and the report simply lost its section on what the
 * guard argued about. Nothing failed, on either side of the rename.
 */
describe("classifyCall", () => {
  const args = (o: unknown) => JSON.stringify(o);

  test("a bash call is read for what the command was doing", () => {
    expect(classifyCall("bash", args({ command: "grep -rn foo src/" })).act).toBe("search");
    expect(classifyCall("bash", args({ command: "sed -n '1,40p' src/a.ts" })).act).toBe("open");
    expect(classifyCall("bash", args({ command: "echo x > file" })).act).toBe("edit");
    expect(classifyCall("bash", args({ command: "bun test" })).act).toBe("verify");
  });

  /**
   * The name as it was before the rename, kept here to say what the test is for. It must
   * NOT classify: a prefixed or renamed spelling matching means the equality has been
   * loosened back into the suffix test that went stale.
   */
  test("a name this server no longer has classifies nothing", () => {
    expect(classifyCall("shell_execute", args({ command: "grep -rn foo src/" })).act).toBeUndefined();
    expect(classifyCall("shell__bash", args({ command: "grep -rn foo src/" })).act).toBeUndefined();
  });

  /** atoma's own tool, so the core's prefix is straddled rather than spelled out. */
  test("load_skill is read for the skill, under any prefix", () => {
    expect(classifyCall("atoma_builtin__load_skill", args({ skill_name: "engineering/tdd" })).skill).toBe("engineering/tdd");
    expect(classifyCall("load_skill", args({ skill_name: "engineering/tdd" })).skill).toBe("engineering/tdd");
  });

  test("arguments that will not parse are a call with nothing in it", () => {
    expect(classifyCall("bash", "{not json")).toEqual({ act: "other" });
    expect(classifyCall("atoma_builtin__load_skill", "{not json")).toEqual({});
  });

  test("a tool that is neither carries nothing", () => {
    expect(classifyCall("create_pr", args({}))).toEqual({});
  });
});
