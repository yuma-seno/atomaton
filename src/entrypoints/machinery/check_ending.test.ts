import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { removeTemp, runWithFakeGh, scriptPath } from "./testing/harness.ts";

/**
 * The rule the runner asks about after the agent stops: a closing message calls one
 * thing or nobody, and this is where the machinery can see whether it did.
 *
 * The counting itself is exercised in `domain/work/ending-calls.test.ts`. What these
 * pin is the half that lives here — that a directive counts only with a definition
 * behind it, that a mention counts only when the thread can be read, and that the
 * answer arrives in a file the caller can read rather than in the exit code of a step
 * that must not fail.
 */
function ending(output: string): string {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-ending-"));
  const defDir = join(dir, "definitions");
  mkdirSync(defDir);
  writeFileSync(join(defDir, "engineer.md"), "---\nname: engineer\n---\n");
  writeFileSync(join(dir, "output.txt"), output);
  const problemFile = join(dir, "problem.txt");
  try {
    const r = runWithFakeGh(
      scriptPath("check_ending.ts"),
      [
        "--output-file",
        join(dir, "output.txt"),
        "--def-dir",
        defDir,
        "--problem-file",
        problemFile,
        "--number",
        "7",
        "--notify",
        "octocat",
      ],
      {
        env: { GITHUB_REPOSITORY: "o/r" },
        rules: [
          {
            // First: the issue read's pattern is a substring of this one.
            match: ["repos/o/r/issues/7/comments"],
            stdout: JSON.stringify([
              { user: { login: "alice", type: "User" } },
              { user: { login: "bob", type: "User" } },
            ]),
          },
          {
            match: ["repos/o/r/issues/7"],
            stdout: JSON.stringify({ user: { login: "alice", type: "User" } }),
          },
          { match: ["collaborators"], stdout: "[]" },
        ],
      },
    );
    expect(r.status, r.stderr).toBe(0);
    return readFileSync(problemFile, "utf8").trim();
  } finally {
    removeTemp(dir);
  }
}

describe("check_ending.ts", () => {
  test("an agent and a person is the message the rule exists for", () => {
    const problem = ending("Done.\n\n/engineer\n\n@alice, your call.");
    expect(problem).toContain("it calls 2 things");
    expect(problem).toContain("`/engineer`");
    expect(problem).toContain("`@alice`");
  });

  test("one agent is a call and is allowed", () => {
    expect(ending("Done.\n\n/engineer")).toBe("");
  });

  test("one person is a call and is allowed", () => {
    expect(ending("@alice, your call.")).toBe("");
  });

  test("two people are two calls", () => {
    expect(ending("@alice and @bob, your call.")).toContain("it calls 2 things");
  });

  test("nobody is allowed", () => {
    expect(ending("Done; nothing left to run.")).toBe("");
  });

  /** A name with no definition dispatches nothing, so it is not a call here either. */
  test("a directive naming no definition is not a call", () => {
    expect(ending("Done.\n\n/not-an-agent\n\n@alice, your call.")).toBe("");
  });

  /** Nor is a name the thread cannot confirm: the comment escapes it, so nobody is reached. */
  test("a stranger is not a call", () => {
    expect(ending("Thanks to @torvalds.")).toBe("");
  });
});
