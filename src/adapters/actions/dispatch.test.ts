import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { importable, runWithFakeGh, type FakeGhRule } from "../../entrypoints/machinery/testing/harness.ts";

/**
 * dispatch.test.ts — how `dispatchRunner` classifies a dispatch in the ops log.
 *
 * The op name is the ONE structured signal `chain_continues` reads
 * (`ops-log.ts`), so the classification is load-bearing twice over: the audit
 * trail, and the result comment's claim about whether anything runs next. The
 * default is a comparison against the node the run sits on; `continuesChain` is
 * the caller's override for the dispatch that comparison cannot see — a merged
 * pull request's re-invocation of the issue it delivers, which is neither on the
 * run's node nor under it, and is exactly the run's own outcome.
 *
 * Run through a subprocess, like `aggregation.test.ts`: mutating PATH and
 * calling a `gh`-shelling function in the long-lived bun:test process has given
 * wrong results before.
 */

const LIB_DIR = import.meta.dir;

interface Run {
  ops: Record<string, unknown>[];
  dispatched: boolean;
}

function run(opts: { type: string; number: string; target: number; continuesChain?: boolean }): Run {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-dispatch-"));
  const opsLog = join(dir, "ops.log");
  const shim = join(dir, "shim.ts");
  writeFileSync(
    shim,
    `import { dispatchRunner } from "${importable(join(LIB_DIR, "dispatch.ts"))}";
const outcome = dispatchRunner({
  context: "dispatch.test.ts",
  agent: "engineer",
  type: "${opts.type}",
  number: ${opts.target},
  repo: "owner/repo",
  answersRequest: true,
 ${opts.continuesChain ? "continuesChain: true," : ""}
});
console.log(outcome);
`,
  );
  // The target must be open (`mayStartWorkOn`), and the dispatch itself is one
  // `workflow run`. `answersRequest` posts no marker and runs no ordering check — its
  // claim is verified against the thread instead (#283), so the fixture answers that
  // read with a `waiting` turn event: the state a validation dispatch is still owed.
  // The comments rule is listed BEFORE the state rule, whose path is a substring of
  // the comments path too.
  const rules: FakeGhRule[] = [
    {
      match: ["api", `repos/owner/repo/issues/${opts.target}/comments`],
      stdout: JSON.stringify([{ id: 7, body: "<!-- atomaton:ended=waiting -->", user: { type: "Bot" } }]),
    },
    { match: ["api", `repos/owner/repo/issues/${opts.target}`], stdout: JSON.stringify({ state: "open" }) },
    { match: ["workflow", "run", "atomaton-runner.yml"], stdout: "" },
  ];
  try {
    const r = runWithFakeGh(shim, [], {
      rules,
      env: {
        TYPE: opts.type,
        NUMBER: opts.number,
        ATOMATON_OPS_LOG: opsLog,
      },
    });
    expect(r.stdout.trim()).toBe("dispatched");
    const ops = readFileSync(opsLog, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    return { ops, dispatched: true };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("dispatchRunner's ops-log classification", () => {
  test("a dispatch onto the node this run sits on is `dispatch`", () => {
    const { ops } = run({ type: "issue", number: "300", target: 300 });
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ op: "dispatch", target: "issue", agent: "engineer", number: 300 });
  });

  test("a dispatch onto another node from a pull request run is `dispatch-elsewhere`", () => {
    const { ops } = run({ type: "issue", number: "802", target: 300 });
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ op: "dispatch-elsewhere", target: "issue", agent: "engineer", number: 300 });
  });

  test("continuesChain records the run's own conclusion as `dispatch` wherever it lands", () => {
    // The post-merge restart: the run sits on pull request #802, the run it wakes
    // sits on issue #300, and the dispatch is the merge's own outcome. This is the
    // case the node comparison gets wrong and the caller has to name.
    const { ops } = run({ type: "issue", number: "802", target: 300, continuesChain: true });
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ op: "dispatch", target: "issue", agent: "engineer", number: 300 });
  });
});

/**
 * dispatch.test.ts — the answers-request check (#283).
 *
 * `answersRequest` claims the thread still waits for what the dispatch delivers. The
 * claim is the caller's (the validation workflow passes `--answers-request true`
 * unconditionally); the verification lives in `refuseResolvedWait`, which reads the
 * thread and refuses when the ball has moved on. #282 is the case: while validation
 * polled CI, the run handed off to the reviewer, that reviewer reviewed and returned
 * the ball — and validation then dispatched the same reviewer onto the same head
 * again, posting no marker and so leaving the thread silent about who started it.
 *
 * A `returned` verdict is two facts wearing one event, and the gate tells them apart:
 * the reviewer's own verdict on the head (#282, refused) against the engineer's fix
 * report with no directive of its own — the ordinary fix cycle, whose green
 * validation routes the push to the reviewer whose directive it answered (#211), and
 * whose red validation sends the engineer back to fix CI. The verdict comment names
 * its author (`atomaton:agent`); whether that verdict still stands is not in the
 * thread at all, so validation passes it (`verdictPassed`).
 *
 * Run through a subprocess like the classification tests above.
 */

const WAITING = { id: 7, body: "<!-- atomaton:ended=waiting -->", user: { type: "Bot" } };
const HANDOFF = { id: 7, body: "<!-- atomaton:ended=handoff -->", user: { type: "Bot" } };

/** The thread a `waiting`-thread test reads, as one `gh` rule. */
function threadRule(target: number, comments: unknown[]): FakeGhRule {
  return { match: ["api", `repos/owner/repo/issues/${target}/comments`], stdout: JSON.stringify(comments) };
}

function runAnswers(opts: {
  target: number;
  thread: FakeGhRule[];
  probeId?: number;
  agent?: string;
  verdictPassed?: boolean;
}): { outcome: string; stderr: string; ghCalls: string[][] } {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-dispatch-"));
  const opsLog = join(dir, "ops.log");
  const shim = join(dir, "shim.ts");
  writeFileSync(
    shim,
    `import { dispatchRunner } from "${importable(join(LIB_DIR, "dispatch.ts"))}";
const outcome = dispatchRunner({
  context: "dispatch.test.ts",
  agent: ${JSON.stringify(opts.agent ?? "reviewer")},
  type: "pr",
  number: ${opts.target},
  repo: "owner/repo",
  answersRequest: true,
  ${opts.probeId !== undefined ? `freshnessProbeId: ${opts.probeId},` : ""}
  ${opts.verdictPassed !== undefined ? `verdictPassed: ${opts.verdictPassed},` : ""}
});
console.log(outcome);
`,
  );
  const rules: FakeGhRule[] = [
    ...opts.thread,
    { match: ["api", `repos/owner/repo/issues/${opts.target}`], stdout: JSON.stringify({ state: "open" }) },
    { match: ["workflow", "run", "atomaton-runner.yml"], stdout: "" },
  ];
  try {
    const r = runWithFakeGh(shim, [], { rules, env: { TYPE: "pr", NUMBER: "802", ATOMATON_OPS_LOG: opsLog } });
    return { outcome: r.stdout.trim(), stderr: r.stderr, ghCalls: r.ghCalls };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("the answers-request check (#283)", () => {
  test("a thread still waiting (`waiting`) is dispatched, and posts no marker", () => {
    const { outcome, ghCalls } = runAnswers({ target: 300, thread: [threadRule(300, [WAITING])] });
    expect(outcome).toBe("dispatched");
    expect(ghCalls.some((call) => call[0] === "workflow")).toBe(true);
    // An answers-request dispatch makes no marker: the request it answers is not one
    // it is making, and a second marker for one turn is what the marker check exists
    // to refuse.
    expect(ghCalls.some((call) => call.includes("POST"))).toBe(false);
  });

  test("a reviewer's own verdict on the work is refused — the #282 repro", () => {
    // The incident's thread, in order: the hand-off's marker (reviewer asked for),
    // then the reviewer's own result comment giving the ball back. The dispatch
    // would re-deliver exactly the judgement the thread already holds, and the
    // caller's green verdict confirms it rather than refuting it.
    const comments = [
      { id: 1, body: "<!-- atomaton:dispatch=reviewer -->", user: { type: "Bot" } },
      { id: 2, body: "<!-- atomaton:agent=reviewer -->\n<!-- atomaton:ended=done -->\nNo defects found.", user: { type: "Bot" } },
    ];
    const { outcome, stderr, ghCalls } = runAnswers({
      target: 300,
      thread: [threadRule(300, comments)],
      verdictPassed: true,
    });
    expect(outcome).toBe("superseded");
    expect(ghCalls.some((call) => call[0] === "workflow")).toBe(false);
    // Quiet by design: nothing posted, nothing to take back. One log line is the
    // account, and it says what resolved.
    expect(ghCalls.some((call) => call.includes("POST") || call.includes("DELETE"))).toBe(false);
    expect(stderr).toContain("had already resolved");
  });

  test("a green validation after a fix push dispatches the reviewer — the fix cycle (#211)", () => {
    // The ordinary shape the first cut of this gate broke: the reviewer's directive
    // sent the engineer to fix, the engineer pushed and ended with no directive of
    // its own (`ended=done`), and the green validation routes that push to the
    // reviewer whose directive it answered. The engineer's return is not the
    // reviewer's verdict, and the reviewer has not spoken on this work at all.
    const comments = [
      { id: 1, body: "<!-- atomaton:dispatch=engineer -->", user: { type: "Bot" } },
      { id: 2, body: "<!-- atomaton:agent=engineer -->\n<!-- atomaton:ended=done -->\nFixed, pushed, no agent runs next.", user: { type: "Bot" } },
    ];
    const { outcome, ghCalls } = runAnswers({
      target: 300,
      thread: [threadRule(300, comments)],
      verdictPassed: true,
    });
    expect(outcome).toBe("dispatched");
    expect(ghCalls.some((call) => call[0] === "workflow")).toBe(true);
  });

  test("a red validation after a fix push sends the engineer back — the retry", () => {
    // The same thread with CI red: the engineer's "done" was wrong about its own
    // push, and the retry the verdict calls for is the one dispatch that can happen.
    const comments = [
      { id: 1, body: "<!-- atomaton:dispatch=engineer -->", user: { type: "Bot" } },
      { id: 2, body: "<!-- atomaton:agent=engineer -->\n<!-- atomaton:ended=done -->\nFixed, pushed, no agent runs next.", user: { type: "Bot" } },
    ];
    const { outcome, ghCalls } = runAnswers({
      target: 300,
      agent: "engineer",
      thread: [threadRule(300, comments)],
      verdictPassed: false,
    });
    expect(outcome).toBe("dispatched");
    expect(ghCalls.some((call) => call[0] === "workflow")).toBe(true);
  });

  test("a `returned` verdict the caller says nothing about is treated as standing", () => {
    // The conservative side of the fact validation supplies: an unrefuted verdict of
    // the dispatched agent's own stands, and #282's refusal survives a caller that
    // forgot `verdictPassed`.
    const comments = [
      { id: 1, body: "<!-- atomaton:agent=reviewer -->\n<!-- atomaton:ended=done -->\nNo defects found.", user: { type: "Bot" } },
    ];
    expect(runAnswers({ target: 300, thread: [threadRule(300, comments)] }).outcome).toBe("superseded");

    // A verdict comment that names no agent is treated the same way: unattributable
    // is not provably somebody else's, and the dispatch would still re-deliver a
    // judgement already on the thread.
    const anonymous = [{ id: 2, body: "<!-- atomaton:ended=done -->\nDone.", user: { type: "Bot" } }];
    expect(runAnswers({ target: 300, thread: [threadRule(300, anonymous)], verdictPassed: true }).outcome).toBe(
      "superseded",
    );
  });

  test("an untaken request (`asked`) is refused — a run is already coming", () => {
    // The same shape with the reviewer still queued: the hand-off's marker is the
    // last event, so the run it starts is on its way and a second dispatch would be
    // a second run on one node.
    const marker = [threadRule(300, [{ id: 1, body: "<!-- atomaton:dispatch=reviewer -->", user: { type: "Bot" } }])];
    expect(runAnswers({ target: 300, thread: marker }).outcome).toBe("superseded");

    // A person's outstanding command is the same answer: the machinery's dispatch of
    // it is the run that is coming.
    const command = [threadRule(300, [{ id: 3, body: "/reviewer", user: { type: "User" } }])];
    expect(runAnswers({ target: 300, thread: command }).outcome).toBe("superseded");
  });

  test("a thread the caller just handed off (`handed-off`) is dispatched — the reload keeps working", () => {
    const { outcome, ghCalls } = runAnswers({ target: 300, thread: [threadRule(300, [HANDOFF])] });
    expect(outcome).toBe("dispatched");
    expect(ghCalls.some((call) => call[0] === "workflow")).toBe(true);
  });

  test("a thread that cannot be read is refused, not dispatched blind", () => {
    const { outcome, stderr, ghCalls } = runAnswers({
      target: 300,
      thread: [{ match: ["api", "repos/owner/repo/issues/300/comments"], code: 1, stdout: "gh: boom" }],
    });
    expect(outcome).toBe("superseded");
    expect(ghCalls.some((call) => call[0] === "workflow")).toBe(false);
    expect(stderr).toContain("could not read the thread");
  });

  test("a thread with no turn events yet is dispatched — nothing has moved", () => {
    // A pull request whose body names a reviewer and whose thread is empty: the body
    // is not a comment and is deliberately not read as an event, so there is no
    // evidence the wait resolved and the dispatch is the one that should happen.
    const { outcome, ghCalls } = runAnswers({ target: 300, thread: [threadRule(300, [])] });
    expect(outcome).toBe("dispatched");
    expect(ghCalls.some((call) => call[0] === "workflow")).toBe(true);
  });

  test("a thread longer than one page is read whole, not refused as unreadable", () => {
    // `--paginate` writes one JSON array per page back to back, which is not one
    // JSON document: parsed whole, page two made the read throw and the gate stand
    // down on a thread it could have judged. The fix cycle, arriving past the page
    // boundary, must still be dispatched.
    const page1 = [
      { id: 1, body: "<!-- atomaton:ended=waiting -->", user: { type: "Bot" } },
      { id: 2, body: "chatter", user: { type: "User" } },
      { id: 3, body: "<!-- atomaton:dispatch=engineer -->", user: { type: "Bot" } },
    ];
    const page2 = [
      { id: 4, body: "<!-- atomaton:agent=engineer -->\n<!-- atomaton:ended=done -->\nFixed, pushed.", user: { type: "Bot" } },
    ];
    const { outcome, ghCalls } = runAnswers({
      target: 300,
      thread: [
        {
          match: ["api", "repos/owner/repo/issues/300/comments"],
          stdout: JSON.stringify(page1) + JSON.stringify(page2),
        },
      ],
      verdictPassed: true,
    });
    expect(outcome).toBe("dispatched");
    expect(ghCalls.some((call) => call[0] === "workflow")).toBe(true);
  });

  test("a probe the read has not caught up with is retried, then judged on what it shows", () => {
    // The reload's lag: the handoff comment (id 99) is missing from the first read,
    // which would show the still-outstanding command and refuse the restart. The
    // retry sees it, and the `handed-off` answer the claim rests on is there.
    const withoutProbe = [{ id: 1, body: "<!-- atomaton:dispatch=engineer -->", user: { type: "Bot" } }];
    const withProbe = [
      { id: 1, body: "<!-- atomaton:dispatch=engineer -->", user: { type: "Bot" } },
      { id: 99, body: "<!-- atomaton:ended=handoff -->", user: { type: "Bot" } },
    ];
    const { outcome } = runAnswers({
      target: 300,
      probeId: 99,
      thread: [
        { match: ["api", "repos/owner/repo/issues/300/comments"], attempt: 1, stdout: JSON.stringify(withoutProbe) },
        { match: ["api", "repos/owner/repo/issues/300/comments"], attempt: 2, stdout: JSON.stringify(withProbe) },
      ],
    });
    expect(outcome).toBe("dispatched");
  });

  test(
    "a probe that never becomes visible stands down",
    // The retry widens past bun's default 5s test timeout by design: 1s + 2s + 4s of
    // widening is what the marker check runs, and the point of the test is that the
    // whole of it is not enough.
    () => {
      const { outcome, stderr, ghCalls } = runAnswers({
        target: 300,
        probeId: 99,
        thread: [threadRule(300, [{ id: 1, body: "<!-- atomaton:dispatch=engineer -->", user: { type: "Bot" } }])],
      });
      expect(outcome).toBe("superseded");
      expect(ghCalls.some((call) => call[0] === "workflow")).toBe(false);
      expect(stderr).toContain("could not be established");
    },
    15_000,
  );
});
