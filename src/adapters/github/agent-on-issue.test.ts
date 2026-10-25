import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { FAKE_GH_IMPL } from "../../entrypoints/machinery/testing/fake-gh-env.ts";

/**
 * `mostRecentAgentOn`, as `/resume` and the aggregation gate ask it of the real
 * adapter with a fake `gh` answering. The walk in `mostRecentAgent` is a pure
 * function with its own tests; what this pins is the READ, and specifically the
 * shape `gh` emits past one page: with `--paginate`, `gh` writes one response body
 * per page back to back, so the stdout is concatenated arrays rather than one
 * document. A whole-output `JSON.parse` throws there, `mostRecentAgentOn` answers
 * "" -- and "" is "nobody to start", the answer that silently skips a node whose
 * last run named an agent. `listComments` splits the pages, and this test holds that.
 */
const SRC = join(import.meta.dir, "agent-on-issue.ts");

/** A page of comments in the shape the API returns: whole objects, bodies inside. */
function asComments(bodies: string[]): { id: number; body: string }[] {
  return bodies.map((body, i) => ({ id: i + 1, body }));
}

/** Who was last working on #9, through the real adapter with the fake `gh` answering. */
function mostRecentAgentOn(stdout: string): string {
  const script = `
    const { mostRecentAgentOn } = await import(${JSON.stringify(SRC)});
    process.stdout.write(mostRecentAgentOn("o/r", 9));
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
  return out.trim();
}

describe("mostRecentAgentOn", () => {
  test("answers from one page", () => {
    expect(mostRecentAgentOn(JSON.stringify(asComments(["<!-- atomaton:agent=engineer -->\nDone."])))).toBe("engineer");
  });

  test("answers past one page", () => {
    const firstPage = JSON.stringify(asComments(["just a remark"]));
    const secondPage = JSON.stringify(asComments(["<!-- atomaton:agent=reviewer -->\nDone."]));
    expect(mostRecentAgentOn(firstPage + secondPage)).toBe("reviewer");
  });

  // The notice quoting a removed comment carries that comment verbatim: the
  // `/engineer` line inside it is the DELETED author's words, and reading it would
  // name the agent the guard deleted the comment to prevent naming. See
  // `isQuotation`.
  test("the notice quoting a removed comment does not name the next agent", () => {
    const notice = [
      "<!-- atomaton:llm-context=exclude -->",
      "<!-- atomaton:quotes=3 -->",
      "@octocat Your comment was removed because the ball is with an agent on this issue/PR.",
      "<details><summary>Your comment, as you wrote it</summary>",
      "",
      "```",
      "/engineer",
      "```",
      "",
      "</details>",
    ].join("\n");
    expect(mostRecentAgentOn(JSON.stringify(asComments(["<!-- atomaton:agent=atomaton -->\nDone.", notice])))).toBe("atomaton");
  });

  // The tag decides an attribution, and the fence decides it is a sample: a person
  // quoting `atomaton:agent` in a code block is documenting the format, not reporting
  // a run (#304). The prose underneath still answers.
  test("a tag quoted in a fenced sample does not name the next agent", () => {
    const quoted = [
      "The result-comment format, for the record:",
      "```html",
      "<!-- atomaton:agent=engineer -->",
      "```",
    ].join("\n");
    expect(mostRecentAgentOn(JSON.stringify(asComments([quoted])))).toBe("");
    expect(mostRecentAgentOn(JSON.stringify(asComments([quoted, "<!-- atomaton:agent=atomaton -->\nDone."])))).toBe("atomaton");
  });

  test("a failed read is not a name", () => {
    expect(mostRecentAgentOn("")).toBe("");
  });
});
