import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { FAKE_GH_IMPL } from "../../entrypoints/machinery/testing/fake-gh-env.ts";

/**
 * `lastEnding`, as the subtree resume asks it of the real adapter with a fake `gh`
 * answering. The fold over the tag is one line; what this pins is the READ: the bodies
 * arrive as one JSON array (so a body's end is known), the walk is newest first, and
 * the guard's notice quoting a removed comment is stepped over -- the removed text is
 * verbatim, so an `atomaton:ended` tag inside it is the DELETED author's words, and a
 * subtree resume reading it would treat the quoted ending as the node's own.
 */
const SRC = join(import.meta.dir, "work-tree.ts");

/** How the last run on #9 ended, through the real adapter with the fake `gh` answering. */
function lastEnding(bodies: string[]): string | undefined {
  const script = `
    const { lastEnding } = await import(${JSON.stringify(SRC)});
    const ended = lastEnding("o/r", 9);
    process.stdout.write(JSON.stringify(ended ?? null));
  `;
  const proc = Bun.spawnSync({
    cmd: [process.execPath, "-e", script],
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      ATOMATON_FAKE_GH: FAKE_GH_IMPL,
      FAKE_GH_RESPONSES: JSON.stringify([
        { match: ["repos/o/r/issues/9/comments"], stdout: JSON.stringify(bodies) },
      ]),
      // Nothing here may reach the real CLI; see `fake-gh-env.ts`.
      GH_TOKEN: "fake-gh-must-be-used",
      GITHUB_TOKEN: "fake-gh-must-be-used",
    },
  });
  const out = proc.stdout.toString();
  if (proc.exitCode !== 0) throw new Error(`child failed: ${proc.stderr.toString() || out}`);
  const parsed = JSON.parse(out);
  return parsed === null ? undefined : parsed;
}

describe("lastEnding", () => {
  test("returns the most recent ending", () => {
    expect(
      lastEnding(["<!-- atomaton:ended=stopped -->", "<!-- atomaton:ended=waiting -->"]),
    ).toBe("waiting");
  });

  test("finds nothing when no comment ends a run", () => {
    expect(lastEnding([])).toBeUndefined();
    expect(lastEnding(["just a remark"])).toBeUndefined();
  });

  // The notice's own line says the comment it replaced will not be acted on; the
  // quoted text inside it must not act either. The walk steps over the notice and
  // finds the ending underneath.
  test("the notice quoting a removed comment is not the node's ending", () => {
    const notice = [
      "<!-- atomaton:llm-context=exclude -->",
      "<!-- atomaton:quotes=5 -->",
      "@octocat Your comment was removed because the ball is with an agent on this issue/PR.",
      "<details><summary>Your comment, as you wrote it</summary>",
      "",
      "```",
      "<!-- atomaton:ended=waiting -->",
      "```",
      "",
      "</details>",
    ].join("\n");
    expect(lastEnding(["<!-- atomaton:ended=stopped -->", notice])).toBe("stopped");
  });
});
