import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loopContinuationMessage } from "../../domain/work/loop-continuation.ts";
import { hermeticEnv, scriptPath } from "./testing/harness.ts";

const run = (args: string[]) =>
  spawnSync("bun", ["run", scriptPath("inject_loop_continuation.ts"), ...args], {
    encoding: "utf8",
    env: hermeticEnv(),
  });

interface SessionShape {
  messages: { role: string; content: string }[];
}

/** The last entry atoma writes for a run its loop guard stopped. */
const VERDICT = {
  rule: "identical_answers",
  tool: "read",
  arguments: '{"path":"src/domain/tool_loop.rs"}',
  count: 4,
  call: 5,
  capped: false,
  last_error: null,
};

function withSession(dir: string, shape: unknown): string {
  const path = join(dir, "session.json");
  writeFileSync(path, JSON.stringify(shape));
  return path;
}

describe("inject_loop_continuation.ts", () => {
  test("appends the note for the recorded verdict as one user turn", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    try {
      const sessionFile = withSession(dir, {
        messages: [
          { role: "user", content: "have a look" },
          { role: "assistant", content: "", tool_calls: [{ function: { name: "read" } }] },
        ],
        atoma_runs: [{ ended_because: "loop", loop_abort: VERDICT }],
      });
      const r = run(["--session", sessionFile]);
      expect(r.status, r.stderr).toBe(0);
      const session = JSON.parse(readFileSync(sessionFile, "utf8")) as SessionShape;
      expect(session.messages).toHaveLength(3);
      expect(session.messages[2]).toEqual({
        role: "user",
        content: loopContinuationMessage({
          rule: "identical_answers",
          tool: "read",
          arguments: '{"path":"src/domain/tool_loop.rs"}',
          count: 4,
          capped: false,
        }),
      });
      expect(session.messages[2]?.content).toContain('{"path":"src/domain/tool_loop.rs"}');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /**
   * A session with no verdict is a binary older than v0.6.0, or a run that never
   * reached the guard. Either way there is nothing true to say, so nothing is
   * appended rather than a note that invents what repeated.
   */
  test("a session carrying no verdict is left alone", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    try {
      const sessionFile = withSession(dir, {
        messages: [{ role: "assistant", content: "" }],
        atoma_runs: [{ ended_because: "loop" }],
      });
      const r = run(["--session", sessionFile]);
      expect(r.status, r.stderr).toBe(0);
      expect(r.stderr).toContain("no loop verdict");
      const session = JSON.parse(readFileSync(sessionFile, "utf8")) as SessionShape;
      expect(session.messages).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a missing session file is reported and tolerated", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    try {
      const r = run(["--session", join(dir, "session.json")]);
      expect(r.status).toBe(0);
      expect(r.stderr).toContain("nothing to do");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("refuses to guess when given no session path", () => {
    const r = run([]);
    expect(r.status, "exits non-zero rather than picking a file").not.toBe(0);
    expect(r.stderr).toContain("--session");
  });
});
