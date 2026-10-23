import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { FAKE_GH_IMPL } from "../../entrypoints/machinery/testing/fake-gh-env.ts";

const SRC = join(import.meta.dir, "participants.ts");

/**
 * Read both answers from the real adapter, with the fake `gh` answering all three
 * sources.
 *
 * A child process for the reason `thread.test.ts` gives: the `gh` seam is an
 * environment variable, and a child spawned without an explicit `env` does not see
 * one set after the runtime started.
 */
function participants(): { known: string[]; humans: string[] } {
  const script = `
    const { knownParticipants, humanParticipants } = await import(${JSON.stringify(SRC)});
    process.stdout.write(JSON.stringify({
      known: knownParticipants("o/r", 7),
      humans: humanParticipants("o/r", 7),
    }));
  `;
  const proc = Bun.spawnSync({
    cmd: [process.execPath, "-e", script],
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      ATOMATON_FAKE_GH: FAKE_GH_IMPL,
      FAKE_GH_RESPONSES: JSON.stringify([
        // First, because the issue read's pattern is a substring of this one.
        {
          match: ["repos/o/r/issues/7/comments"],
          stdout: JSON.stringify([
            { user: { login: "commenter", type: "User" } },
            { user: { login: "github-actions", type: "Bot" } },
          ]),
        },
        {
          match: ["repos/o/r/issues/7"],
          stdout: JSON.stringify({ user: { login: "author", type: "User" } }),
        },
        {
          match: ["collaborators"],
          stdout: JSON.stringify([
            { login: "collab", type: "User" },
            { login: "renovate", type: "Bot" },
          ]),
        },
      ]),
      GH_TOKEN: "fake-gh-must-be-used",
      GITHUB_TOKEN: "fake-gh-must-be-used",
    },
  });
  const out = proc.stdout.toString();
  if (proc.exitCode !== 0) throw new Error(`child failed: ${proc.stderr.toString() || out}`);
  return JSON.parse(out) as { known: string[]; humans: string[] };
}

describe("who a thread's participants are", () => {
  test("all three sources are read, in the order they answered", () => {
    expect(participants().known).toEqual([
      "author",
      "commenter",
      "github-actions",
      "collab",
      "renovate",
    ]);
  });

  /**
   * A bot is a participant — it may be mentioned without pinging a stranger — but it
   * is not somebody a run can hand work to: it never takes a turn, so a closing
   * message that "called" one called nobody.
   */
  test("a run may only call the people, not the bots", () => {
    expect(participants().humans).toEqual(["author", "commenter", "collab"]);
  });
});
