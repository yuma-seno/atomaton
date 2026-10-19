import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { FAKE_GH_IMPL } from "../../entrypoints/machinery/testing/fake-gh-env.ts";

/**
 * The two answers the validation routing asks of one thread, as the adapter wires them.
 *
 * The folds are tested in `domain/work/thread.test.ts`; what this pins is that the ask
 * and the standing request are handed DIFFERENT readers here, which is the whole
 * defensibility of the routing. The ask is read the way the handoff was read — an
 * agent's result comment carries the model's own text, where markdown may have mangled
 * the directive — while the standing request keeps the strict parse a dispatch and the
 * guard act on.
 *
 * A regression that put both back on the strict parse restores #219: the directive the
 * runner posted back as `- /engineer` stops being an ask, so the green verdict
 * re-dispatches the agent the push already answered.
 *
 * ## Why a child process
 *
 * The `gh` seam is an environment variable (`ATOMATON_FAKE_GH`, see
 * `adapters/github/gh.ts`), and `Bun.spawnSync` without an explicit `env` does not see
 * a `process.env` mutated after the runtime started — measured on Bun 1.4.3: a child
 * sees the original value, not the one the test set. So the adapter is exercised in a
 * process whose environment is handed to it, the same way the machinery's own tests
 * reach their fake.
 */
const SRC = join(import.meta.dir, "thread.ts");

/** Read one thread through the real adapter, with the fake `gh` answering it. */
function latestRequest(body: string, comments: unknown[]): unknown {
  const script = `
    const { latestRequestOn } = await import(${JSON.stringify(SRC)});
    const answered = latestRequestOn("o/r", 7, (name) => name === "engineer" || name === "reviewer");
    process.stdout.write(JSON.stringify(answered));
  `;
  const proc = Bun.spawnSync({
    cmd: [process.execPath, "-e", script],
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      ATOMATON_FAKE_GH: FAKE_GH_IMPL,
      FAKE_GH_RESPONSES: JSON.stringify([
        // The body read is the one carrying `--jq`; the comments read is the one whose
        // path goes on to `/comments`.
        { match: ["repos/o/r/issues/7", "--jq"], stdout: body },
        { match: ["repos/o/r/issues/7/comments"], stdout: JSON.stringify(comments) },
      ]),
      // Nothing here may reach the real CLI; see `fake-gh-env.ts`.
      GH_TOKEN: "fake-gh-must-be-used",
      GITHUB_TOKEN: "fake-gh-must-be-used",
    },
  });
  const out = proc.stdout.toString();
  if (proc.exitCode !== 0) throw new Error(`child failed: ${proc.stderr.toString() || out}`);
  return JSON.parse(out);
}

/** A comment as the issues API returns it. */
function comment(id: number, createdAt: string, body: string, type = "Bot"): unknown {
  return { id, created_at: createdAt, body, user: { type } };
}

describe("latestRequestOn", () => {
  // #219's shape on the mangled variant: the reviewer's result comment ends with
  // `- /engineer`, the machinery takes it up, and the engineer publishes its fix. The
  // newest request in the thread is the marker naming the engineer, but the ASK is the
  // reviewer's directive — `- /engineer` included, because that is the line the handoff
  // was read from.
  test("a markdown-mangled directive is the ask, while the marker is the standing request", () => {
    const request = latestRequest(
      "/reviewer\n\nPart of #219",
      [
        comment(1, "2026-10-19T17:41:32Z", "Problems found.\n\nNeed a fix.\n\n- /engineer\n<!-- atomaton:agent=reviewer -->"),
        comment(2, "2026-10-19T17:41:46Z", "<!-- atomaton:dispatch=engineer -->\nAtomaton: `engineer` starting."),
        comment(3, "2026-10-19T18:05:00Z", "<!-- atomaton:agent=engineer -->\nFixed it."),
      ],
    ) as { newestRequestedAgent: string; latestAsk?: unknown };

    expect(request.newestRequestedAgent).toBe("engineer");
    expect(request.latestAsk).toEqual({
      agent: "engineer",
      author: { kind: "agent", agent: "reviewer" },
      at: "2026-10-19T17:41:32Z",
    });
  });

  // The strict half, and the reason the tolerance is scoped: a person's markdown bullet
  // was never a command the machinery acted on, so it is not the standing request a
  // dispatch is routed by — while the request already in the thread is.
  test("a person's bulleted command is not the standing request", () => {
    const request = latestRequest("/reviewer", [
      comment(1, "2026-10-19T18:00:00Z", "- /engineer", "User"),
    ]) as { newestRequestedAgent: string };

    expect(request.newestRequestedAgent).toBe("reviewer");
  });

  // The body's own `/<agent>` line is the standing request and never the ask: a push is
  // part of the work it asked for, so consuming it would hand the pull request back to
  // its opener on every push.
  test("the body's own line is the standing request, never the ask", () => {
    const request = latestRequest("/reviewer\n\nPart of #219", []) as {
      newestRequestedAgent: string;
      latestAsk?: unknown;
    };

    expect(request.newestRequestedAgent).toBe("reviewer");
    expect(request.latestAsk).toBeUndefined();
  });
});
