import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FAKE_GH_IMPL } from "./testing/fake-gh-env.ts";
import { callablePeople } from "./read_callees.ts";

const SRC = join(import.meta.dir, "read_callees.ts");

/**
 * The one read of who a run may call, in a child process for the reason
 * `thread.test.ts` gives: the `gh` seam is an environment variable, and a child
 * spawned without an explicit `env` does not see one set after the runtime started.
 */
function read(rules: unknown[], notify: string): { humans: string[]; notify: string } {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-callees-"));
  try {
    const out = join(dir, "callees.json");
    // Run it as a program, which is what the workflow does; its `main` is private.
    const proc = Bun.spawnSync({
      cmd: [process.execPath, "run", SRC, "--out", out, "--number", "7", "--notify", notify],
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        ATOMATON_FAKE_GH: FAKE_GH_IMPL,
        FAKE_GH_RESPONSES: JSON.stringify(rules),
        GH_TOKEN: "fake-gh-must-be-used",
        GITHUB_TOKEN: "fake-gh-must-be-used",
        GITHUB_REPOSITORY: "o/r",
      },
    });
    if (proc.exitCode !== 0) throw new Error(`child failed: ${proc.stderr.toString()}`);
    return JSON.parse(readFileSync(out, "utf8")) as { humans: string[]; notify: string };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const THREAD = [
  {
    // First, because the issue read's pattern is a substring of this one.
    match: ["repos/o/r/issues/7/comments"],
    stdout: JSON.stringify([
      { user: { login: "author", type: "User" } },
      { user: { login: "github-actions", type: "Bot" } },
    ]),
  },
  {
    match: ["repos/o/r/issues/7"],
    stdout: JSON.stringify({ user: { login: "author", type: "User" } }),
  },
  {
    match: ["collaborators"],
    stdout: JSON.stringify([{ login: "collab", type: "User" }]),
  },
];

describe("read_callees.ts", () => {
  /**
   * The three sources, the owner first, and the bot left out: a bot is a participant,
   * but it never takes a turn, so it is not somebody a run can hand work to.
   */
  test("writes the thread's people, the owner first, and no bots", () => {
    expect(read(THREAD, "owner")).toEqual({
      humans: ["owner", "author", "collab"],
      notify: "owner",
    });
  });

  /** `resolveNotify` can name somebody who has never appeared on the thread. */
  test("the owner is callable even when the thread has never seen them", () => {
    expect(read([], "owner").humans).toEqual(["owner"]);
  });

  /**
   * The participant read failed and there is no owner: an empty list, not an error.
   * The run is told nobody can be called, and an empty list cannot refuse a message.
   */
  test("a failed read with nobody to own the work is an empty list", () => {
    expect(read([], "")).toEqual({ humans: [], notify: "" });
  });
});

describe("callablePeople", () => {
  /** GitHub logins are case-insensitive, and two spellings of one account read as two. */
  test("one account is listed once, under the owner's spelling", () => {
    expect(callablePeople(["Alice", "bob"], "alice")).toEqual({
      humans: ["alice", "bob"],
      notify: "alice",
    });
  });
});
