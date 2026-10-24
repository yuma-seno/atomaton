import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseCommentCommand } from "../../domain/work/comment-command.ts";
import { proseOnly } from "../../adapters/github/tags.ts";
import { SCRIPTS_DIR, hermeticEnv, parseGithubOutput } from "./testing/harness.ts";

/**
 * What `parse_comment_command.ts` writes to `$GITHUB_OUTPUT`.
 *
 * This is the seam the guard's commands rule (#217) hangs on: the workflow passes
 * `parsed` through to `guard_comment_during_run.ts --parsed`, and the guard compares it
 * to the string `"true"`. A typo on either side would leave the rule silently off -- CI
 * green, nothing refused -- so the seam is read here rather than assumed from the
 * script's own code.
 */
function runOutputs(body: string): Record<string, string> {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
  const outputFile = join(dir, "out");
  writeFileSync(outputFile, "");
  try {
    spawnSync("bun", ["run", `${SCRIPTS_DIR}/parse_comment_command.ts`], {
      encoding: "utf8",
      env: { ...hermeticEnv(), ATOMATON_COMMENT_BODY: body, GITHUB_OUTPUT: outputFile },
    });
    return parseGithubOutput(readFileSync(outputFile, "utf8"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("parse_comment_command.ts", () => {
  test("writes parsed=true for a command, and names it", () => {
    const out = runOutputs("/engineer\nfix it");
    expect(out.parsed).toBe("true");
    expect(out.matched).toBe("true");
    expect(out.agent).toBe("engineer");
  });

  // The distinction the guard needs: a step that DID NOT RUN leaves the outputs empty,
  // and a step that ran and found no command writes parsed=true with matched=false. The
  // two must not look alike, or a non-member's comment is refused for commands nothing
  // would have read.
  test("writes parsed=true and matched=false for a comment with no command", () => {
    const out = runOutputs("just a remark");
    expect(out.parsed).toBe("true");
    expect(out.matched).toBe("false");
    expect(out.agent).toBe("");
  });

  test("a malformed command is reported, and parsed is still true", () => {
    const out = runOutputs("/engineer fix the bug\n/reviewer");
    expect(out.parsed).toBe("true");
    expect(out.error).not.toBe("");
  });

  // #311: a command inside a fenced block is somebody quoting the format. The thread
  // readers do not take it for a request, so the entry must not either -- otherwise a
  // run starts on an ask the thread cannot see, and `latestRequest` loses it.
  test("does not start a run on a command quoted inside a fence", () => {
    const out = runOutputs("The format, for reference:\n\n```html\n/engineer\n```\n\nThat is how a dispatch is written.");
    expect(out.parsed).toBe("true");
    expect(out.matched).toBe("false");
    expect(out.agent).toBe("");
  });

  // A fence is not a wall for the whole body: the first command in PROSE is read, and
  // it is the same line the thread reader would take from the same body.
  test("reads the first command in prose, and agrees with the thread reader", () => {
    const body = "```\n/engineer\n```\n\n/reviewer\n\nlook at the diff, please";
    const out = runOutputs(body);
    expect(out.matched).toBe("true");
    expect(out.agent).toBe("reviewer");
    // The thread's own reader, on the same body.
    expect(parseCommentCommand(proseOnly(body)).agent).toBe("reviewer");
  });
});
