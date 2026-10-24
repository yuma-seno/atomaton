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
  ask: 7,
 ${opts.continuesChain ? "continuesChain: true," : ""}
});
console.log(outcome);
`,
  );
  // The target must be open (`mayStartWorkOn`), and the dispatch itself is one
  // `workflow run`. `answersRequest` posts no marker and runs no ordering check — its
  // claim is verified against the thread instead (#285), so the fixture answers that
  // read with a `waiting` turn event that answers no ask: the state a validation
  // dispatch is still owed. Endings carry `answers=`/`run=` now (#285) — an old-format
  // ending is unreadable, which is the migration's own rule. The comments rule is
  // listed BEFORE the state rule, whose path is a substring of the comments path too.
  const rules: FakeGhRule[] = [
    {
      match: ["api", `repos/owner/repo/issues/${opts.target}/comments`],
      stdout: JSON.stringify([{ id: 7, body: "<!-- atomaton:ended=waiting answers=0 run=0 -->", user: { type: "Bot" } }]),
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

const WAITING = { id: 7, body: "<!-- atomaton:ended=waiting answers=0 run=0 -->", user: { type: "Bot" } };
const HANDOFF = { id: 7, body: "<!-- atomaton:ended=handoff answers=0 run=0 -->", user: { type: "Bot" } };

/**
 * A person's command as the ask a validation dispatch quotes: the dispatch names its
 * id, the run it starts claims it, and its answer closes it (#285).
 */
const COMMAND = (id: number, agent: string) => ({ id, body: `/${agent}`, user: { type: "User" } });
const CLAIM = (id: number, ask: number, run: number) => ({
  id,
  body: `<!-- atomaton:llm-context=exclude -->\n<!-- atomaton:took=${ask} run=${run} -->`,
  user: { type: "Bot" },
});
/** The push comment `commit_and_push` posts as the ask the re-validated run claims (#285). */
const PUSH_COMMENT = (id: number) => ({
  id,
  body: `<!-- atomaton:llm-context=exclude -->\nAtomaton: pushed abc1234 to this pull request. Running CI; the result routes what happens next.`,
  user: { type: "Bot" },
});
const RESULT = (id: number, o: { agent?: string; verb: string; answers: number; run: number }) => ({
  id,
  body: [
    ...(o.agent ? [`<!-- atomaton:agent=${o.agent} -->`] : []),
    `<!-- atomaton:ended=${o.verb} answers=${o.answers} run=${o.run} -->`,
  ].join("\n"),
  user: { type: "Bot" },
});

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
  /** The ask comment id the dispatch quotes (#285) — required for it to go at all. */
  ask?: number;
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
  ask: ${opts.ask ?? 1},
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

describe("the answers-request check (#285)", () => {
  test("a thread still waiting (`waiting`) is dispatched, and posts no marker", () => {
    const { outcome, ghCalls } = runAnswers({ target: 300, thread: [threadRule(300, [WAITING])] });
    expect(outcome).toBe("dispatched");
    expect(ghCalls.some((call) => call[0] === "workflow")).toBe(true);
    // An answers-request dispatch makes no marker: the request it answers is not one
    // it is making, and a second marker for one turn is what the marker check exists
    // to refuse.
    expect(ghCalls.some((call) => call.includes("POST"))).toBe(false);
  });

  test("a reviewer's own verdict on the quoted ask is refused — the #282 repro", () => {
    // The racing validations' thread, in order: the `waiting` ending that opened the
    // pull request (the ask both validations quote), the first run's claim of it, and
    // that reviewer's own verdict answering it. The dispatch would re-deliver exactly
    // the judgement the thread already holds, and the caller's green verdict confirms
    // it rather than refuting it.
    const comments = [WAITING, CLAIM(2, 1, 9), RESULT(3, { agent: "reviewer", verb: "done", answers: 1, run: 9 })];
    const { outcome, stderr, ghCalls } = runAnswers({
      target: 300,
      ask: 1,
      thread: [threadRule(300, comments)],
      verdictPassed: true,
    });
    expect(outcome).toBe("superseded");
    expect(ghCalls.some((call) => call[0] === "workflow")).toBe(false);
    // Quiet by design: nothing posted, nothing to take back. One log line is the
    // account, and it says what resolved.
    expect(ghCalls.some((call) => call.includes("POST") || call.includes("DELETE"))).toBe(false);
    expect(stderr).toContain("no longer waiting");
  });

  test("a green validation after a fix push dispatches the reviewer — the fix cycle (#211)", () => {
    // The ordinary shape the first cut of this gate broke: the reviewer's directive
    // sent the engineer to fix, the engineer pushed and ended with no directive of
    // its own (`ended=done`), and the green validation routes that push to the
    // reviewer whose directive it answered. The ask quoted here is the push comment
    // `commit_and_push` posted for exactly this dispatch — fresh, so no earlier
    // claim holds it and the claim race cannot eat the cycle (quoting the
    // engineer's own ask did exactly that, once). The check's own question: the
    // engineer's return is not the reviewer's verdict, and the reviewer has not
    // spoken on this work at all.
    const comments = [
      COMMAND(1, "engineer"),
      CLAIM(2, 1, 9),
      RESULT(3, { agent: "engineer", verb: "done", answers: 1, run: 9 }),
      PUSH_COMMENT(4),
    ];
    const { outcome, ghCalls } = runAnswers({
      target: 300,
      ask: 4,
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
      COMMAND(1, "engineer"),
      CLAIM(2, 1, 9),
      RESULT(3, { agent: "engineer", verb: "done", answers: 1, run: 9 }),
      PUSH_COMMENT(4),
    ];
    const { outcome, ghCalls } = runAnswers({
      target: 300,
      ask: 4,
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
    const comments = [COMMAND(1, "reviewer"), CLAIM(2, 1, 9), RESULT(3, { agent: "reviewer", verb: "done", answers: 1, run: 9 })];
    expect(runAnswers({ target: 300, ask: 1, thread: [threadRule(300, comments)] }).outcome).toBe("superseded");

    // A verdict comment that names no agent is treated the same way: unattributable
    // is not provably somebody else's, and the dispatch would still re-deliver a
    // judgement already on the thread.
    const anonymous = [COMMAND(1, "reviewer"), CLAIM(2, 1, 9), RESULT(3, { verb: "done", answers: 1, run: 9 })];
    expect(runAnswers({ target: 300, ask: 1, thread: [threadRule(300, anonymous)], verdictPassed: true }).outcome).toBe(
      "superseded",
    );
  });

  test("an unclaimed dispatch marker as the quoted ask is refused — a run is already coming", () => {
    // The marker is the machinery saying it started a run; until that run claims,
    // the ask it names is the marker itself, and a second dispatch for it would be a
    // second run on one node.
    const marker = [threadRule(300, [{ id: 1, body: "<!-- atomaton:dispatch=reviewer -->", user: { type: "Bot" } }])];
    expect(runAnswers({ target: 300, ask: 1, thread: marker }).outcome).toBe("superseded");
  });

  test("a person's command is dispatched — validation is what starts it", () => {
    // A person's `/reviewer` on a pull request reaches validation, not a runner: no
    // dispatch is queued for the node, and this dispatch is the only thing that turns
    // the command into a run. Refusing it dropped every review a person asked for
    // (found when a /reviewer typed on a pull request started nothing).
    const { outcome, ghCalls } = runAnswers({
      target: 300,
      ask: 3,
      thread: [threadRule(300, [COMMAND(3, "reviewer")])],
    });
    expect(outcome).toBe("dispatched");
    expect(ghCalls.some((call) => call[0] === "workflow")).toBe(true);
  });

  test("a quoted ask claimed but unanswered goes — the race separates the runs at claim time", () => {
    // Two validations reached for one command; the first dispatch's run claimed it
    // and is working. Refusing here would strand the fix cycle the same shape — the
    // engineer's claimed-but-unreported ask, whose push this dispatch routes — so
    // the dispatch goes, and the two runs' claims for one ask are separated by id
    // when the runner claims: the older claim holds the turn, the newer run backs
    // off and reports nothing.
    const comments = [COMMAND(1, "reviewer"), CLAIM(2, 1, 9)];
    expect(runAnswers({ target: 300, ask: 1, thread: [threadRule(300, comments)] }).outcome).toBe("dispatched");
  });

  test("a thread the caller just handed off (`handed-off`) is dispatched — the reload keeps working", () => {
    // The reload quotes its own hand-off comment as the ask: claimed by nobody yet
    // (the dispatch IS what starts the run that claims it) and answered by nothing.
    const { outcome, ghCalls } = runAnswers({ target: 300, ask: 7, thread: [threadRule(300, [HANDOFF])] });
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

  test("a dispatch that names no ask is refused — there is nothing to verify the wait against", () => {
    const { outcome, stderr } = runAnswers({ target: 300, ask: 0, thread: [threadRule(300, [])] });
    expect(outcome).toBe("superseded");
    expect(stderr).toContain("names no ask comment");
  });

  test("a thread with no turn events yet is dispatched — nothing has moved", () => {
    // A pull request whose body names a reviewer and whose thread is empty: the body
    // is not a comment and is deliberately not read as an event, so there is no
    // evidence the wait resolved and the dispatch is the one that should happen.
    const { outcome, ghCalls } = runAnswers({ target: 300, ask: 1, thread: [threadRule(300, [])] });
    expect(outcome).toBe("dispatched");
    expect(ghCalls.some((call) => call[0] === "workflow")).toBe(true);
  });

  test("a thread longer than one page is read whole, not refused as unreadable", () => {
    // `--paginate` writes one JSON array per page back to back, which is not one
    // JSON document: parsed whole, page two made the read throw and the gate stand
    // down on a thread it could have judged. The fix cycle, arriving past the page
    // boundary, must still be dispatched.
    const page1 = [
      COMMAND(1, "engineer"),
      { id: 2, body: "chatter", user: { type: "User" } },
      { id: 3, body: "<!-- atomaton:dispatch=engineer -->", user: { type: "Bot" } },
    ];
    const page2 = [{ id: 4, body: "<!-- atomaton:agent=engineer -->\n<!-- atomaton:ended=done answers=3 run=9 -->\nFixed, pushed.", user: { type: "Bot" } }];
    const { outcome, ghCalls } = runAnswers({
      target: 300,
      ask: 1,
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
    // The reload's lag: the handoff comment (id 99, the ask it quotes) is missing
    // from the first read, which would refuse the restart over an ask it cannot see.
    // The retry sees it: unclaimed, unanswered, nothing newer — the restart goes.
    const withoutProbe: unknown[] = [];
    const withProbe = [{ id: 99, body: "<!-- atomaton:ended=handoff answers=0 run=0 -->", user: { type: "Bot" } }];
    const { outcome } = runAnswers({
      target: 300,
      ask: 99,
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
        ask: 99,
        probeId: 99,
        thread: [threadRule(300, [])],
      });
      expect(outcome).toBe("superseded");
      expect(ghCalls.some((call) => call[0] === "workflow")).toBe(false);
      expect(stderr).toContain("could not be established");
    },
    15_000,
  );
});

/**
 * The refused hand-off (#194): a hand-off is a promise the dispatch either keeps or
 * withdraws. With `refusalEnding` the withdrawal is written on the thread —
 * `ended=refused answers=<the ask the successor was to claim> run=<the promising
 * run>` — so the thread's newest word stops being "a hand-off", which `runInFlight`
 * reads as a run working or coming, forever. Without it the notices stay the plain
 * escalations they always were.
 */
describe("the refused hand-off (#194)", () => {
  function runHandoff(opts: {
    target: number;
    /** The target's state; `closed` is refused before the marker goes out. */
    state: "open" | "closed";
    /** The dispatch call itself fails after the marker is up. */
    workflowFails?: boolean;
    /** The listing never shows the marker, so the ordering check stands down. */
    markerNeverVisible?: boolean;
    withIdentity?: boolean;
  }): { outcome: string; stderr: string; ghCalls: string[][] } {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-dispatch-refusal-"));
    const opsLog = join(dir, "ops.log");
    const shim = join(dir, "shim.ts");
    writeFileSync(
      shim,
      `import { dispatchRunner } from "${importable(join(LIB_DIR, "dispatch.ts"))}";
const outcome = dispatchRunner({
  context: "the engineer handed off",
  agent: "reviewer",
  type: "issue",
  number: ${opts.target},
  repo: "owner/repo",
  ${opts.withIdentity ? 'refusalEnding: { answers: 900, run: 42 },' : ""}
});
console.log(outcome);
`,
    );
    const rules: FakeGhRule[] = [
      // The marker POST, then the listing, then the state — first match wins, and the
      // state path is a substring of the comments paths.
      { match: ["api", `repos/owner/repo/issues/${opts.target}/comments`, "POST"], stdout: "555" },
      threadRule(opts.target, opts.markerNeverVisible ? [] : [{ id: 555, body: "<!-- atomaton:dispatch=reviewer -->", user: { type: "Bot" } }]),
      { match: ["api", `repos/owner/repo/issues/${opts.target}`], stdout: JSON.stringify({ state: opts.state }) },
      {
        match: ["workflow", "run", "atomaton-runner.yml"],
        ...(opts.workflowFails ? { code: 1, stdout: "boom" } : { stdout: "" }),
      } as FakeGhRule,
    ];
    try {
      const r = runWithFakeGh(shim, [], { rules, env: { TYPE: "issue", NUMBER: String(opts.target), ATOMATON_OPS_LOG: join(dir, "ops.log") } });
      return { outcome: r.stdout.trim(), stderr: r.stderr, ghCalls: r.ghCalls };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  test("a closed target's refusal carries the ending when the chain is named", () => {
    const { outcome, ghCalls } = runHandoff({ target: 400, state: "closed", withIdentity: true });
    expect(outcome).toBe("refused-closed");
    const notice = ghCalls.find((call) => call[0] === "issue" && call[1] === "comment") ?? [];
    expect(notice.join(" ")).toContain("<!-- atomaton:ended=refused answers=900 run=42 -->");
    expect(notice.join(" ")).toContain("llm-context=exclude");
    expect(notice.join(" ")).toContain("was not started");
    // No dispatch, and the marker was never posted: there is nothing to take back.
    expect(ghCalls.some((call) => call[0] === "workflow")).toBe(false);
    expect(ghCalls.some((call) => call.includes("DELETE"))).toBe(false);
  });

  test("without the chain identity the refusal stays a plain notice", () => {
    const { outcome, ghCalls } = runHandoff({ target: 400, state: "closed" });
    expect(outcome).toBe("refused-closed");
    const notice = ghCalls.find((call) => call[0] === "issue" && call[1] === "comment") ?? [];
    expect(notice.join(" ")).toContain("was not started");
    expect(notice.join(" ")).not.toContain("atomaton:ended=");
  });

  test("a rejected dispatch takes its phantom marker back and writes the ending", () => {
    const { outcome, ghCalls } = runHandoff({ target: 400, state: "open", workflowFails: true, withIdentity: true });
    expect(outcome).toBe("failed");
    expect(ghCalls.some((call) => call.includes("DELETE") && call.join(" ").includes("comments/555"))).toBe(true);
    const notice = ghCalls.find((call) => call[0] === "issue" && call[1] === "comment") ?? [];
    expect(notice.join(" ")).toContain("<!-- atomaton:ended=refused answers=900 run=42 -->");
    expect(notice.join(" ")).toContain("GitHub rejected the dispatch call");
  });

  test(
    "an unconfirmable marker is taken back, and its refusal carries the ending",
    () => {
      const { outcome, ghCalls } = runHandoff({ target: 400, state: "open", markerNeverVisible: true, withIdentity: true });
      expect(outcome).toBe("unconfirmed");
      // Both the original marker and the repost come down: either appearing later
      // would sit in the thread as a request nobody claimed.
      expect(ghCalls.filter((call) => call.includes("DELETE") && call.join(" ").includes("comments/")).length).toBe(2);
      const notice = ghCalls.find((call) => call[0] === "issue" && call[1] === "comment") ?? [];
      expect(notice.join(" ")).toContain("<!-- atomaton:ended=refused answers=900 run=42 -->");
      expect(notice.join(" ")).toContain("could not be confirmed");
    },
    15_000,
  );
});
