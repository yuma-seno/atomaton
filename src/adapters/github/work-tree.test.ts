import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { FAKE_GH_IMPL } from "../../entrypoints/machinery/testing/fake-gh-env.ts";

/**
 * `lastEnding`, as the subtree resume asks it of the real adapter with a fake `gh`
 * answering. The fold over the tag is one line; what this pins is the READ: the
 * comments arrive as whole objects from the shared `listComments` (so a body's end is
 * known), the walk is newest first, and the guard's notice quoting a removed comment
 * is stepped over -- the removed text is verbatim, so an `atomaton:ended` tag inside
 * it is the DELETED author's words, and a subtree resume reading it would treat the
 * quoted ending as the node's own.
 */
const SRC = join(import.meta.dir, "work-tree.ts");

/** A page of comments in the shape the API returns: whole objects, bodies inside. */
function asComments(bodies: string[]): { id: number; body: string }[] {
  return bodies.map((body, i) => ({ id: i + 1, body }));
}

/** How the last run on #9 ended, through the real adapter with the fake `gh` answering. */
function lastEnding(bodies: string[]): string | undefined {
  return lastEndingStdout(JSON.stringify(asComments(bodies)));
}

/** The same, from raw stdout — the shape `gh` itself writes past one page. */
function lastEndingStdout(stdout: string): string | undefined {
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
        { match: ["repos/o/r/issues/9/comments"], stdout },
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
      lastEnding(["<!-- atomaton:ended=stopped answers=0 run=0 -->", "<!-- atomaton:ended=waiting answers=0 run=0 -->"]),
    ).toBe("waiting");
  });

  test("finds nothing when no comment ends a run", () => {
    expect(lastEnding([])).toBeUndefined();
    expect(lastEnding(["just a remark"])).toBeUndefined();
  });

  // A person quoting the ending format in a fenced sample is writing ABOUT endings,
  // not ending anything (#304) -- the same fence rule the quotation skip applies to
  // the guard's notice, and the reason the walk reads prose.
  test("an ending quoted in a fenced sample is not the node's ending", () => {
    const quoted = [
      "Someone documenting the endings:",
      "```html",
      "<!-- atomaton:ended=waiting answers=0 run=0 -->",
      "```",
    ].join("\n");
    expect(lastEnding([quoted])).toBeUndefined();
    expect(lastEnding([quoted, "<!-- atomaton:ended=stopped answers=0 run=0 -->"])).toBe("stopped");
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
      "<!-- atomaton:ended=waiting answers=0 run=0 -->",
      "```",
      "",
      "</details>",
    ].join("\n");
    expect(lastEnding(["<!-- atomaton:ended=stopped answers=0 run=0 -->", notice])).toBe("stopped");
  });

  // With `--paginate`, `gh` writes one response body per page back to back: past one
  // page the stdout is TWO arrays, not one document, and a whole-output `JSON.parse`
  // throws. A read that parsed it as one document returned `undefined` for a thread
  // past 100 comments -- which `/resume` reads as "nothing was interrupted here",
  // silently skipping a stopped node. `listComments` splits the pages, so the answer
  // survives the boundary; this is the only test whose fake emits it.
  test("a thread past one page still names its ending", () => {
    const firstPage = JSON.stringify(asComments(["just a remark", "<!-- atomaton:ended=stopped answers=0 run=0 -->"]));
    const secondPage = JSON.stringify(asComments(["<!-- atomaton:ended=waiting answers=0 run=0 -->"]));
    expect(lastEndingStdout(firstPage + secondPage)).toBe("waiting");
  });

  test("a response with no JSON in it finds no ending", () => {
    // Not an error, and not the tag: the old line-split read answered the same
    // way for a body that carried no tag. Garbage is not a state a caller should
    // guess at, and `undefined` -- "nothing says" -- is the answer that starts no
    // work it was not asked for.
    expect(lastEndingStdout("not json at all")).toBeUndefined();
  });
});
