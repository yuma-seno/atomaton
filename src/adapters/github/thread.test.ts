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

/** Whether `runInFlight` says a run is working or coming on #7, read through the adapter. */
function inFlight(comments: unknown[]): boolean {
  const script = `
    const { runInFlight } = await import(${JSON.stringify(SRC)});
    process.stdout.write(JSON.stringify(runInFlight("o/r", 7)));
  `;
  const proc = Bun.spawnSync({
    cmd: [process.execPath, "-e", script],
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      ATOMATON_FAKE_GH: FAKE_GH_IMPL,
      FAKE_GH_RESPONSES: JSON.stringify([{ match: ["repos/o/r/issues/7/comments"], stdout: JSON.stringify(comments) }]),
      GH_TOKEN: "fake-gh-must-be-used",
      GITHUB_TOKEN: "fake-gh-must-be-used",
    },
  });
  const out = proc.stdout.toString();
  if (proc.exitCode !== 0) throw new Error(`child failed: ${proc.stderr.toString() || out}`);
  return JSON.parse(out);
}

/**
 * The chain a hand-off leaves behind, and what a refusal must change (#194).
 *
 * Ask, claim, hand-off: to every reader that walks the thread, the newest word is "a
 * hand-off" — `runInFlight` reads it as a run working or coming, and it stays that way
 * while the thread goes untouched, which is exactly what a refused successor leaves
 * behind. The refusal's own ending is what ends the flight: same readers, one verb.
 */
describe("runInFlight", () => {
  const handoff = [
    comment(10, "2026-10-24T09:00:00Z", "/engineer", "User"),
    comment(11, "2026-10-24T09:00:10Z", "<!-- atomaton:took=10 run=5 -->"),
    comment(12, "2026-10-24T09:14:00Z", "<!-- atomaton:agent=engineer -->\n<!-- atomaton:ended=handoff answers=10 run=5 -->\nHanding off."),
  ];

  test("an unanswered hand-off is a run in flight", () => {
    expect(inFlight(handoff)).toBe(true);
  });

  test("the refusal's own ending ends the flight", () => {
    const refused = [
      ...handoff,
      comment(
        13,
        "2026-10-24T09:14:05Z",
        "<!-- atomaton:llm-context=exclude -->\n<!-- atomaton:ended=refused answers=12 run=5 -->\nAtomaton: `reviewer` was not started on #7, because #7 is closed.",
      ),
    ];
    expect(inFlight(refused)).toBe(false);
  });
});

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

  // The tag decides an attribution, and the fence decides it is a sample (#304): a
  // dispatch marker quoted in a fenced block is somebody documenting the markers, and
  // must not move the turn to the agent it names.
  test("a dispatch marker quoted in a fenced sample is not the standing request", () => {
    const request = latestRequest("/reviewer", [
      comment(1, "2026-10-19T18:00:00Z", ["The dispatch markers, for the record:", "```html", "<!-- atomaton:dispatch=engineer -->", "```"].join("\n")),
    ]) as { newestRequestedAgent: string };

    expect(request.newestRequestedAgent).toBe("reviewer");
  });

  // The guard's notice preserving a removed comment carries `atomaton:quotes` and the
  // removed text verbatim. It is a QUOTATION of a person's words, not the machinery
  // speaking: the `/engineer` line inside it must not become the standing request, or
  // the deleted comment names the next agent after all — the power the guard removed
  // it to take away, handed back through the message that replaced it.
  test("the guard's quotation does not name the next agent", () => {
    const request = latestRequest("/reviewer", [
      comment(1, "2026-10-19T18:00:00Z", "<!-- atomaton:dispatch=reviewer -->\nAtomaton: `reviewer` starting."),
      comment(
        2,
        "2026-10-19T18:05:00Z",
        [
          "<!-- atomaton:quotes=9 -->",
          "<details><summary>Your comment, as you wrote it</summary>",
          "",
          "```",
          "/engineer",
          "```",
          "",
          "</details>",
        ].join("\n"),
      ),
    ]) as { newestRequestedAgent: string };

    expect(request.newestRequestedAgent).toBe("reviewer");
  });

  // The tag is read only on a machinery comment. A person writing `atomaton:quotes` in
  // their own text is prose about the machinery, and their command stays theirs: the
  // tag must not turn their comment into a quotation and silence it.
  test("a person's own comment carrying the quotes tag is not a quotation", () => {
    const request = latestRequest("/reviewer", [
      comment(1, "2026-10-19T18:00:00Z", "<!-- atomaton:quotes=3 -->\nPlease run this instead:\n\n/engineer", "User"),
    ]) as { newestRequestedAgent: string };

    expect(request.newestRequestedAgent).toBe("engineer");
  });
});
