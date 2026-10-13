import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SCRIPTS_DIR, hermeticEnv, parseGithubOutput } from "./testing/harness.ts";

describe("parse_pr_metadata.ts", () => {
  test("reads the issue the pull request belongs to, from the tag", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    const outputFile = join(dir, "out");
    writeFileSync(outputFile, "");
    spawnSync("bun", ["run", `${SCRIPTS_DIR}/parse_pr_metadata.ts`], {
      encoding: "utf8",
      env: {
        ...hermeticEnv(),
        // A `Closes #N` line is present and deliberately ignored: it was the second
        // output and the same number, and reading it would let the two drift (#171).
        PR_BODY: "<!-- atomaton:parent-issue=42 -->\nCloses #42\nsome body",
        PR_NUMBER: "99",
        GITHUB_OUTPUT: outputFile,
      },
    });
    const out = parseGithubOutput(await Bun.file(outputFile).text());
    expect(out.parent_number).toBe("42");
    expect(out.sub_number, "sub_number is gone; one number is the whole output").toBeUndefined();
    rmSync(dir, { recursive: true, force: true });
  });

  test("empty output when no metadata present", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    const outputFile = join(dir, "out");
    writeFileSync(outputFile, "");
    spawnSync("bun", ["run", `${SCRIPTS_DIR}/parse_pr_metadata.ts`], {
      encoding: "utf8",
      env: { ...hermeticEnv(), PR_BODY: "plain body", PR_NUMBER: "1", GITHUB_OUTPUT: outputFile },
    });
    const out = parseGithubOutput(await Bun.file(outputFile).text());
    expect(out.parent_number).toBe("");
    expect(out.sub_number).toBeUndefined();
    rmSync(dir, { recursive: true, force: true });
  });
});
