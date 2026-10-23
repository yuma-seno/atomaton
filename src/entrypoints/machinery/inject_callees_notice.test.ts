import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { removeTemp, runWithFakeGh, scriptPath, type FakeGhRule } from "./testing/harness.ts";

/** Run the notice against a session file and give back what it appended. */
function notice(rules: FakeGhRule[], notify: string): string {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-callees-"));
  try {
    const session = join(dir, "session.json");
    writeFileSync(session, JSON.stringify({ messages: [{ role: "user", content: "hi" }] }));
    const r = runWithFakeGh(
      scriptPath("inject_callees_notice.ts"),
      ["--session", session, "--number", "7", "--notify", notify],
      { env: { GITHUB_REPOSITORY: "o/r" }, rules },
    );
    expect(r.status, r.stderr).toBe(0);
    const written = JSON.parse(readFileSync(session, "utf8")) as {
      messages: { role: string; content: string }[];
    };
    return written.messages.at(-1)?.content ?? "";
  } finally {
    removeTemp(dir);
  }
}

const THREAD: FakeGhRule[] = [
  {
    // First: the issue read's pattern is a substring of this one.
    match: ["repos/o/r/issues/7/comments"],
    stdout: JSON.stringify([
      { user: { login: "alice", type: "User" } },
      { user: { login: "dependabot[bot]", type: "Bot" } },
    ]),
  },
  {
    match: ["repos/o/r/issues/7"],
    stdout: JSON.stringify({ user: { login: "alice", type: "User" } }),
  },
  { match: ["collaborators"], stdout: JSON.stringify([{ login: "bob", type: "User" }]) },
];

describe("inject_callees_notice.ts", () => {
  /**
   * The list a run has never been able to see: who opened the thread, who commented,
   * and the collaborators, with the one the work belongs to named as such.
   */
  test("names the people a run may call, and which one owns the work", () => {
    const text = notice(THREAD, "alice");
    expect(text).toContain("@alice");
    expect(text).toContain("@bob");
    expect(text).toContain("this work belongs to");
    // A bot is a participant but never takes a turn, so it is not offered as a call.
    expect(text).not.toContain("dependabot");
    expect(text).toContain("calls at most one thing");
  });

  /**
   * The reader it can reach when the API cannot be read: the owner, if there is one.
   * Saying nothing at all would leave the run believing it may call anybody.
   */
  test("still names the owner when the thread cannot be read", () => {
    const text = notice([], "alice");
    expect(text).toContain("@alice");
    expect(text).toContain("calls at most one thing");
  });

  /** And when there is nobody either way, it says so rather than inventing a list. */
  test("says there is nobody to call when there is nobody", () => {
    const text = notice([], "");
    expect(text).toContain("No person can be called");
  });
});
