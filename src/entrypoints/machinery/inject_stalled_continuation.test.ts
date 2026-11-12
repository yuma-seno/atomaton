import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stalledContinuationMessage } from "../../domain/work/stalled-continuation.ts";
import { hermeticEnv, scriptPath } from "./testing/harness.ts";

const run = (args: string[]) =>
  spawnSync("bun", ["run", scriptPath("inject_stalled_continuation.ts"), ...args], {
    encoding: "utf8",
    env: hermeticEnv(),
  });

interface SessionShape {
  messages: { role: string; content: string }[];
}

describe("inject_stalled_continuation.ts", () => {
  test("appends the continuation note as one user turn", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    try {
      const sessionFile = join(dir, "session.json");
      writeFileSync(
        sessionFile,
        JSON.stringify({
          messages: [
            { role: "user", content: "have a look" },
            { role: "assistant", content: "Running the full suite." },
          ],
        }),
      );
      const r = run(["--session", sessionFile]);
      expect(r.status, r.stderr).toBe(0);
      const session = JSON.parse(readFileSync(sessionFile, "utf8")) as SessionShape;
      expect(session.messages).toHaveLength(3);
      expect(session.messages[2]).toEqual({ role: "user", content: stalledContinuationMessage() });
      expect(session.messages[1]?.content, "the message it wrote is still there to read").toBe(
        "Running the full suite.",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /**
   * A session that was never written is a normal outcome for a run that failed
   * before its first turn, and there is nobody to ask.
   */
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
