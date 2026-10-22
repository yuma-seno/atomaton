import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
});
