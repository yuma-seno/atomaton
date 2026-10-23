import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hermeticEnv, scriptPath } from "./testing/harness.ts";

/**
 * The rule the runner asks about after the agent stops: a closing message calls one
 * thing or nobody, and this is where the machinery can see whether it did.
 *
 * The counting itself is exercised in `domain/work/ending-calls.test.ts`. What these
 * pin is the half that lives here — that a directive counts only with a definition
 * behind it, that a mention counts only when the list says the run may call that
 * login, and that the answer arrives in a file the caller can read rather than in the
 * exit code of a step that must not fail.
 *
 * The list is a file because this script runs inside the credential-free step that
 * starts atoma. It used to read GitHub itself, which in that step meant reading
 * nothing: every call failed, the only callable login was `--notify`, and a message
 * that named another participant went through as a single call. `--people-file`
 * missing is the same fail-closed case now, and is tested as such.
 */
const PEOPLE = JSON.stringify({ humans: ["alice", "bob"], notify: "alice" });

function ending(output: string, people: string | null = PEOPLE): string {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-ending-"));
  try {
    const defDir = join(dir, "definitions");
    mkdirSync(defDir);
    writeFileSync(join(defDir, "engineer.md"), "---\nname: engineer\n---\n");
    writeFileSync(join(dir, "output.txt"), output);
    const problemFile = join(dir, "problem.txt");
    const peopleFile = join(dir, "people.json");
    // `null` is the file the failed step never wrote; the default is a written list.
    if (people !== null) writeFileSync(peopleFile, people);
    const r = spawnSync(
      "bun",
      [
        "run",
        scriptPath("check_ending.ts"),
        "--output-file",
        join(dir, "output.txt"),
        "--def-dir",
        defDir,
        "--problem-file",
        problemFile,
        "--people-file",
        peopleFile,
      ],
      { encoding: "utf8", env: hermeticEnv() },
    );
    expect(r.status, r.stderr).toBe(0);
    return readFileSync(problemFile, "utf8").trim();
  } finally {
    rmSync(dir, { recursive: true, force: true });
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

  /** Nor is a login the list leaves out: the comment escapes it, so nobody is reached. */
  test("a stranger is not a call", () => {
    expect(ending("Thanks to @torvalds.")).toBe("");
  });

  /**
   * The list is missing because the step that writes it failed. Nothing can be
   * confirmed, so no mention is a call — the same direction the comment's escaping
   * takes, and the one that cannot refuse a message for a call nobody could see.
   */
  test("a missing list makes a mention nobody's call", () => {
    expect(ending("Done.\n\n/engineer\n\n@alice, your call.", null)).toBe("");
  });
});
