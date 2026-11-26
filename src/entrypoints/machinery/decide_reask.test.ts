/**
 * decide_reask.test.ts — whether a run gets its one second turn, and why.
 *
 * The turn itself is `ask_again.test.ts`'s, in a step of its own: atoma deletes the
 * credentials file it read, so the second turn cannot be launched from here. What
 * this pins is the judgement and its bounds — a failed or stopped first turn is
 * never asked, a run with no time left is warned about instead of asked, the
 * session is only touched when a turn will actually follow, and the loop guard's
 * abort is reached through the session's verdict rather than through an ending word
 * or an exit code.
 *
 * The second turn is `sudo ... atoma run`, which tests cannot run, and nothing here
 * launches — that is the property, so no fake `sudo` is needed on PATH.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hermeticEnv, scriptPath } from "./testing/harness.ts";

/** The breaking ending: two calls, the fixture `check_ending` refuses. */
const BREAKING = "Done.\n\n/engineer\n\n@alice, your call.";
const PEOPLE = JSON.stringify({ humans: ["alice", "bob"], notify: "alice" });
const SESSION = JSON.stringify({ messages: [{ role: "assistant", content: BREAKING }] });

/**
 * A run that stopped on the sentence that announced its next step: `completed`, no
 * tool call in the last turn, nothing changed, and nobody named — the four facts
 * `domain/work/stalled-continuation.ts` reads. The ending word lives in the session,
 * which is where `read_run_ending.ts` reads it from.
 */
const STALLED_TEXT = "I will now read the file:";
const STALLED = JSON.stringify({
  messages: [{ role: "assistant", content: STALLED_TEXT }],
  atoma_runs: [{ ended_because: "completed" }],
});

/**
 * A run the loop guard stopped, in the shape a real one arrives in (#610): atoma
 * records the verdict beside `ended_because: "failed"`, because its `soft_stop_ending`
 * maps only a different guard that watches the model's own output. So the run reaches
 * here as a failure with exit 1 and the verdict in the session, and neither the exit
 * code nor the ending word may be what the decision reads.
 */
const LOOP_ABORT = {
  rule: "identical_answers",
  tool: "read",
  arguments: '{"path":"src/domain/tool_loop.rs"}',
  count: 4,
  call: 5,
  capped: false,
  last_error: null,
};
const LOOP = JSON.stringify({
  messages: [{ role: "assistant", content: "", tool_calls: [{ function: { name: "read" } }] }],
  atoma_runs: [{ ended_because: "failed", loop_abort: LOOP_ABORT }],
});

interface RunResult {
  status: number;
  stdout: string;
  /** The session's roles after the decision, in order. */
  messages: string[];
  /** What the machinery told the run, in order. */
  notes: string[];
  /** Whether the decision kept a copy of the session to restore from. */
  keptSession: boolean;
}

function run(opts: {
  exitCode: string;
  deadlineOffsetSecs?: number;
  output?: string;
  /** The session atoma left; the breaking ending by default. */
  session?: string;
  withStopFile?: boolean;
  /** Arguments to leave out, to hold the caller's contract. */
  omit?: string;
}): RunResult {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-decide-"));
  // The definitions live under the machinery root's `.github/atomaton/`, exactly
  // where a deployed tree carries them — the decision resolves them itself.
  const defs = join(dir, ".github", "atomaton", "agent-definitions");
  mkdirSync(defs, { recursive: true });
  writeFileSync(join(defs, "engineer.md"), "---\nname: engineer\n---\n");
  const runDir = join(dir, "run");
  mkdirSync(runDir, { recursive: true });
  writeFileSync(join(runDir, "session.json"), opts.session ?? SESSION);
  writeFileSync(join(runDir, "atomaton_output.txt"), opts.output ?? BREAKING);
  writeFileSync(join(runDir, "callees.json"), PEOPLE);
  const stopFile = join(dir, "stop-requested");
  if (opts.withStopFile) writeFileSync(stopFile, "stop");

  const deadline = Math.floor(Date.now() / 1000) + (opts.deadlineOffsetSecs ?? 3600);
  const args: Record<string, string> = {
    "run-dir": runDir,
    "stop-file": stopFile,
    "deadline-at": String(deadline),
    "min-budget-secs": "60",
    "exit-code": opts.exitCode,
  };
  const argv = ["run", scriptPath("decide_reask.ts")];
  for (const [flag, value] of Object.entries(args)) {
    if (flag === opts.omit) continue;
    argv.push(`--${flag}`, value);
  }

  const decided = spawnSync("bun", argv, {
    encoding: "utf8",
    env: { ...hermeticEnv(), AGENT: "engineer", ATOMATON_MACHINERY_ROOT: dir },
  });
  const session = JSON.parse(readFileSync(join(runDir, "session.json"), "utf8")) as {
    messages?: Array<{ role: string; content: string }>;
  };
  const messages = session.messages ?? [];
  return {
    status: decided.status ?? -1,
    stdout: decided.stdout ?? "",
    messages: messages.map((m) => m.role),
    notes: messages.filter((m) => m.role === "user").map((m) => m.content),
    keptSession: existsSync(join(runDir, "session_before_reask.json")),
  };
}

describe("decide_reask.ts", () => {
  test("a failed first turn is never asked", () => {
    const r = run({ exitCode: "3" });
    expect(r.status, r.stdout).toBe(0);
    expect(r.stdout).toContain("reask=\n");
    expect(r.stdout).toContain("exit_code=3");
    expect(r.stdout).toContain("ending_invalid=false");
    expect(r.messages, "the session stands as atoma wrote it").toEqual(["assistant"]);
    expect(r.keptSession, "and nothing is kept to restore from").toBe(false);
  });

  test("and nor is a run the person stopped", () => {
    const r = run({ exitCode: "0", withStopFile: true });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("reask=\n");
    expect(r.stdout).toContain("exit_code=0");
    expect(r.messages).toEqual(["assistant"]);
  });

  test("a breaking ending with no time left refuses its calls without a second turn", () => {
    const r = run({ exitCode: "0", deadlineOffsetSecs: -10 });
    expect(r.status).toBe(0);
    expect(r.stdout, "and there is no turn to hand a budget to").toContain("reask=\n");
    expect(r.stdout).toContain("budget_secs=0");
    expect(r.stdout).toContain("ending_invalid=true");
    expect(r.stdout).toContain("exit_code=0");
    expect(r.messages, "nothing is injected when there is no time to ask").toEqual(["assistant"]);
    expect(r.keptSession, "and nothing is kept to restore from").toBe(false);
  });

  test("a breaking ending is rejected in the session, and a second turn is asked for", () => {
    const r = run({ exitCode: "0" });
    expect(r.status, r.stdout).toBe(0);
    expect(r.stdout).toContain("reask=ending\n");
    expect(r.stdout, "the budget decided for the second turn travels with the reason").toMatch(/budget_secs=[1-9]\d*\n/);
    expect(r.stdout).toContain("injected=true");
    expect(r.stdout).toContain("exit_code=0");
    expect(r.messages, "the rejection is a user turn in the session").toContain("user");
    expect(r.keptSession, "the first ending is kept to restore from if the second turn dies").toBe(true);
  });

  test("a stalled run is continued the same way", () => {
    // The judgement is `should_continue_stalled.ts`'s, and its own tests hold it;
    // here it only has to be reachable, and to put its note in the session.
    const r = run({ exitCode: "0", session: STALLED, output: STALLED_TEXT });
    expect(r.status, r.stdout).toBe(0);
    expect(r.stdout).toContain("reask=stalled\n");
    expect(r.messages, "the note is a user turn in the session").toEqual(["assistant", "user"]);
    expect(r.keptSession).toBe(true);
  });

  test("a run the loop guard stopped is asked for one more turn", () => {
    const r = run({ exitCode: "1", session: LOOP });
    expect(r.status, r.stdout).toBe(0);
    expect(r.stdout, "the reason comes from the verdict, not the exit code").toContain("reask=loop\n");
    expect(r.stdout, "the first turn's exit travels unchanged: the second turn's is the one that counts").toContain("exit_code=1");
    expect(r.stdout).toContain("ending_invalid=false");
    expect(r.messages, "the note is a user turn in the session").toEqual(["assistant", "user"]);
    expect(r.notes[0], "and it names the call that repeated").toContain('{"path":"src/domain/tool_loop.rs"}');
    expect(r.keptSession).toBe(true);
  });

  test("a loop abort with no time left keeps the first turn's ending", () => {
    const r = run({ exitCode: "1", session: LOOP, deadlineOffsetSecs: -10 });
    expect(r.status, r.stdout).toBe(0);
    expect(r.stdout).toContain("reask=\n");
    expect(r.stdout, "nothing was asked, so nothing changed the exit").toContain("exit_code=1");
    expect(r.messages, "nothing is injected when there is no time to ask").toEqual(["assistant"]);
  });

  /**
   * The pin's other half: a binary older than v0.6.0 records no verdict, and an
   * ordinary failure has none either. There is nothing to tell the run, so it keeps
   * the ending it had -- and the word `loop`, which nothing here reads, changes
   * nothing.
   */
  test("a loop ending with no verdict is treated as it is today", () => {
    const r = run({
      exitCode: "1",
      session: JSON.stringify({
        messages: [{ role: "assistant", content: "Nothing here." }],
        atoma_runs: [{ ended_because: "loop" }],
      }),
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("reask=\n");
    expect(r.stdout).toContain("exit_code=1");
    expect(r.messages).toEqual(["assistant"]);
  });

  test("a caller that leaves an argument out is refused, not defaulted", () => {
    const r = run({ exitCode: "0", omit: "min-budget-secs" });
    expect(r.status, "a missing bound cannot be read as a budget").toBe(2);
  });
});
