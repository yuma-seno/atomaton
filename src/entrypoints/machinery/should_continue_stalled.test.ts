import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hermeticEnv, removeTemp, scriptPath } from "./testing/harness.ts";

/**
 * The judgement the runner asks between the first run and a second turn: a run that
 * ended `completed`, made no tool call, changed nothing and called nobody may have
 * stopped on the sentence that announced its next step.
 *
 * The predicate is `domain/work/stalled-continuation.ts`; what these pin is the
 * half that lives here — that every fact arrives from the source the rest of the
 * machinery reads it from, and that the answer is a printed value the caller can
 * branch on rather than an exit code that would fail the step.
 */
const PEOPLE = JSON.stringify({ humans: ["alice", "bob"], notify: "alice" });

interface Case {
  /** The core's `ended_because`; no run record when omitted. */
  ending?: string;
  /** The session's messages; the last assistant message carries `output` by default. */
  messages?: Record<string, unknown>[];
  output?: string;
  changed?: "true" | "false";
  /** `null` is the people file the failed step never wrote. */
  people?: string | null;
}

function answer(c: Case): string {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-stalled-"));
  try {
    const defDir = join(dir, "definitions");
    mkdirSync(defDir);
    writeFileSync(join(defDir, "engineer.md"), "---\nname: engineer\n---\n");
    const output = c.output ?? "Done.";
    writeFileSync(
      join(dir, "session.json"),
      JSON.stringify({
        messages: c.messages ?? [{ role: "assistant", content: output }],
        atoma_runs: c.ending === undefined ? [] : [{ ended_because: c.ending }],
      }),
    );
    writeFileSync(join(dir, "output.txt"), output);
    const peopleFile = join(dir, "people.json");
    if (c.people !== null) writeFileSync(peopleFile, c.people ?? PEOPLE);
    const r = spawnSync(
      "bun",
      [
        "run",
        scriptPath("should_continue_stalled.ts"),
        "--session",
        join(dir, "session.json"),
        "--output-file",
        join(dir, "output.txt"),
        "--def-dir",
        defDir,
        "--people-file",
        peopleFile,
        "--changed",
        c.changed ?? "false",
      ],
      { encoding: "utf8", env: hermeticEnv() },
    );
    expect(r.status, r.stderr).toBe(0);
    return r.stdout.trim();
  } finally {
    removeTemp(dir);
  }
}

describe("should_continue_stalled.ts", () => {
  test("a completed run that changed nothing and called nobody is asked to continue", () => {
    expect(answer({ ending: "completed" })).toBe("true");
  });

  /**
   * The shape #491 observed: the announcing sentence ended on a full stop. The
   * predicate never reads punctuation, so the colon shape #467 caught and this one
   * get the same answer.
   */
  test("the punctuation that ended the sentence does not decide", () => {
    expect(answer({ ending: "completed", output: "Running the full suite." })).toBe("true");
    expect(answer({ ending: "completed", output: "Now the tests:" })).toBe("true");
  });

  test("a run cut off by a clock, a person or a failure is not asked again", () => {
    for (const ending of ["runtime", "iterations", "stopped", "loop", "failed"]) {
      expect(answer({ ending }), ending).toBe("false");
    }
  });

  /** No run record is no answer, which is not the same as `completed`. */
  test("a session with no run record is not asked again", () => {
    expect(answer({})).toBe("false");
  });

  /**
   * A session-ending tool leaves its call as the last assistant message while the
   * core still records `completed`. That call was the ending; there is no sentence
   * that stopped short.
   */
  test("a last turn that called a tool is a finished ending", () => {
    expect(
      answer({
        ending: "completed",
        messages: [
          { role: "assistant", content: "Opening the pull request." },
          { role: "assistant", content: "", tool_calls: [{ function: { name: "create_pr" } }] },
        ],
      }),
    ).toBe("false");
  });

  test("a run that pushed or merged already did something", () => {
    expect(answer({ ending: "completed", changed: "true" })).toBe("false");
  });

  test("a closing message that calls an agent has handed the work on", () => {
    expect(answer({ ending: "completed", output: "Done.\n\n/engineer" })).toBe("false");
  });

  test("a closing message that calls a person has handed the work on", () => {
    expect(answer({ ending: "completed", output: "Done.\n\n@alice, your call." })).toBe("false");
  });

  /** A directive with no definition dispatches nothing, so it hands nothing on. */
  test("a directive naming no definition is not a call", () => {
    expect(answer({ ending: "completed", output: "Done.\n\n/not-an-agent" })).toBe("true");
  });

  /** Nor is a login nobody could be notified by: the comment escapes it. */
  test("a stranger is not a call", () => {
    expect(answer({ ending: "completed", output: "Thanks to @torvalds." })).toBe("true");
  });

  /** The same fail-closed direction `check_ending.ts` takes when the list is missing. */
  test("a missing people file makes a mention nobody's call", () => {
    expect(answer({ ending: "completed", output: "Done.\n\n@alice, your call.", people: null })).toBe("true");
  });
});
