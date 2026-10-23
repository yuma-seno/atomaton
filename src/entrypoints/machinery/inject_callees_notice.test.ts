import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hermeticEnv, scriptPath } from "./testing/harness.ts";

/** Run the notice against a session file and give back what it appended. */
function notice(people: string | undefined): string {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-callees-"));
  try {
    const session = join(dir, "session.json");
    writeFileSync(session, JSON.stringify({ messages: [{ role: "user", content: "hi" }] }));
    const peopleFile = join(dir, "callees.json");
    if (people !== undefined) writeFileSync(peopleFile, people);
    const r = spawnSync(
      "bun",
      ["run", scriptPath("inject_callees_notice.ts"), "--session", session, "--people-file", peopleFile],
      { encoding: "utf8", env: hermeticEnv() },
    );
    expect(r.status, r.stderr).toBe(0);
    const written = JSON.parse(readFileSync(session, "utf8")) as {
      messages: { role: string; content: string }[];
    };
    return written.messages.at(-1)?.content ?? "";
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("inject_callees_notice.ts", () => {
  /**
   * The list a run has never been able to see: the participants, with the one the work
   * belongs to named as such. It is the same file `check_ending.ts` accepts against.
   */
  test("names the people a run may call, and which one owns the work", () => {
    const text = notice(JSON.stringify({ humans: ["alice", "bob"], notify: "alice" }));
    expect(text).toContain("@alice");
    expect(text).toContain("@bob");
    expect(text).toContain("@alice is the one this work belongs to");
    expect(text).toContain("calls at most one thing");
    expect(text).toContain("A mention of one of them is a call");
  });

  /** No owner and no participant read: it says so rather than inventing a list. */
  test("says there is nobody to call when there is nobody", () => {
    const text = notice(JSON.stringify({ humans: [], notify: "" }));
    expect(text).toContain("No person can be called");
  });

  /**
   * The file is missing because the step that writes it failed. Saying nothing would
   * leave the run believing a mention is a call, so it says the safe thing instead.
   */
  test("says there is nobody to call when the list is missing", () => {
    expect(notice(undefined)).toContain("No person can be called");
  });
});
