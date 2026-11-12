/**
 * decide_reask.test.ts  Ethe one second turn a run is allowed, and the bounds
 * around it.
 *
 * The counting is `domain/work/ending-calls.test.ts`'s and the scripts it calls
 * have their own files; what this pins is the orchestration, which is the part
 * a refactor can break without anything failing: that a failed or stopped first
 * turn is never asked, that the second turn runs only when there is time for it,
 * that the session is restored when the second attempt dies, and that a person's
 * stop during the ask outranks everything the machinery was about to do.
 *
 * The second turn is `sudo ... atoma run`, and tests cannot run sudo  Eso a fake
 * `sudo` on PATH stands in for it, driven by `FAKE_SUDO_MODE`. What the fake
 * answers for is the exec and its exit code; the launch library's argv is held
 * by the contract tests on the generated workflow.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hermeticEnv, removeTemp, scriptPath } from "./testing/harness.ts";

/** The breaking ending: two calls, the fixture `check_ending` refuses. */
const BREAKING = "Done.\n\n/engineer\n\n@alice, your call.";
const PEOPLE = JSON.stringify({ humans: ["alice", "bob"], notify: "alice" });
const SESSION = JSON.stringify({ messages: [{ role: "assistant", content: BREAKING }] });

interface RunResult {
  status: number;
  stdout: string;
  /** The session's roles after the decision, in order. */
  messages: string[];
  output: string;
}

function makeSudo(dir: string): string {
  const bin = join(dir, "bin");
  mkdirSync(bin, { recursive: true });
  writeFileSync(
    join(bin, "sudo"),
    [
      "#!/usr/bin/env bash",
      '# Fakes `sudo -n -u USER env ... atoma run ...`  Ethe exec and its exit code.',
      'mode="${FAKE_SUDO_MODE:-ok}"',
      'if [ "$mode" = "stop" ]; then',
      '  prev=""',
      '  for a in "$@"; do',
      '    if [ "$prev" = "--stop-file" ]; then touch "$a"; fi',
      '    prev="$a"',
      "  done",
      '  echo "stopped mid-sentence"',
      "  # atoma saw the stop and answered with its own soft stop.",
      "  exit 2",
      "fi",
      'if [ "$mode" = "fail" ]; then',
      '  echo "the second attempt died" >&2',
      "  exit 3",
      "fi",
      'echo "Done; nothing left to run."',
      "exit 0",
      "",
    ].join("\n"),
  );
  // The sh spelling is what a Linux runner executes; the .cmd spelling is what
  // Windows resolves through PATHEXT when these tests run on a checkout.
  writeFileSync(
    join(bin, "sudo.cmd"),
    [
      "@echo off",
      'if /i "%FAKE_SUDO_MODE%"=="stop" goto stop',
      'if /i "%FAKE_SUDO_MODE%"=="fail" goto fail',
      "echo Done; nothing left to run.",
      "exit /b 0",
      ":stop",
      'set "prev="',
      'set "stopfile="',
      ":nextarg",
      'if "%~1"=="" goto stopped',
      'if "%prev%"=="--stop-file" set "stopfile=%~1"',
      'set "prev=%~1"',
      "shift",
      "goto nextarg",
      ":stopped",
      'if not "%stopfile%"=="" type nul > "%stopfile%"',
      "echo stopped mid-sentence",
      "rem atoma saw the stop and answered with its own soft stop.",
      "exit /b 2",
      ":fail",
      "echo the second attempt died 1>&2",
      "exit /b 3",
      "",
    ].join("\r\n"),
  );
  return bin;
}

function run(opts: {
  exitCode: string;
  mode?: "ok" | "fail" | "stop";
  deadlineOffsetSecs?: number;
  output?: string;
  withStopFile?: boolean;
}): RunResult & { dir: string } {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-reask-"));
  const bin = makeSudo(dir);
  // The definitions live under the machinery root's `.github/atomaton/`, exactly
  // where a deployed tree carries them  Ethe decision resolves them itself.
  const defs = join(dir, ".github", "atomaton", "agent-definitions");
  mkdirSync(defs, { recursive: true });
  writeFileSync(join(defs, "engineer.md"), "---\nname: engineer\n---\n");
  const runDir = join(dir, "run");
  mkdirSync(runDir, { recursive: true });
  writeFileSync(join(runDir, "session.json"), SESSION);
  writeFileSync(join(runDir, "atomaton_output.txt"), opts.output ?? BREAKING);
  writeFileSync(join(runDir, "callees.json"), PEOPLE);
  if (opts.withStopFile) writeFileSync(join(optsStopPath(dir)), "stop");

  const deadline = Math.floor(Date.now() / 1000) + (opts.deadlineOffsetSecs ?? 3600);
  // Windows joins PATH with `;`; the fake sudo must be found before any real one.
  const pathSep = process.platform === "win32" ? ";" : ":";
  const run = spawnSync(
    "bun",
    [
      "run", scriptPath("decide_reask.ts"),
      "--run-dir", runDir,
      "--tool-cache", join(dir, "cache"),
      "--tools-file", join(dir, "tools.yaml"),
      "--credentials-file", join(dir, "credentials.json"),
      "--stop-file", optsStopPath(dir),
      "--deadline-at", String(deadline),
      "--min-budget-secs", "60",
      "--exit-code", opts.exitCode,
    ],
    {
      encoding: "utf8",
      env: {
        ...hermeticEnv(),
        AGENT: "engineer",
        ATOMATON_MACHINERY_ROOT: dir,
        FAKE_SUDO_MODE: opts.mode ?? "ok",
        PATH: `${bin}${pathSep}${process.env.PATH ?? ""}`,
      },
    },
  );
  const session = JSON.parse(readFileSync(join(runDir, "session.json"), "utf8")) as {
    messages?: Array<{ role: string; content: string }>;
  };
  const output = exists(join(runDir, "atomaton_output.txt")) ? readFileSync(join(runDir, "atomaton_output.txt"), "utf8") : "";
  return {
    status: run.status ?? -1,
    stdout: run.stdout ?? "",
    messages: (session.messages ?? []).map((m) => m.role),
    output,
    dir,
  };

  function optsStopPath(base: string): string {
    return join(base, "stop-requested");
  }
  function exists(path: string): boolean {
    try {
      readFileSync(path);
      return true;
    } catch {
      return false;
    }
  }
}

describe("decide_reask.ts", () => {
  test("a failed first turn is never asked", () => {
    const r = run({ exitCode: "3", mode: "ok" });
    expect(r.status, r.stdout).toBe(0);
    expect(r.stdout).toContain("exit_code=3");
    expect(r.stdout).toContain("ending_invalid=false");
    expect(r.messages, "the session stands as atoma wrote it").toEqual(["assistant"]);
  });

  test("and nor is a run the person stopped", () => {
    const r = run({ exitCode: "0", withStopFile: true });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("exit_code=0");
    expect(r.messages).toEqual(["assistant"]);
  });

  test("a breaking ending with no time left refuses its calls without a second turn", () => {
    const r = run({ exitCode: "0", deadlineOffsetSecs: -10 });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("ending_invalid=true");
    expect(r.stdout).toContain("exit_code=0");
    expect(r.messages, "nothing is injected when there is no time to ask").toEqual(["assistant"]);
    expect(r.output, "and the first ending stands").toContain(BREAKING);
  });

  test("a breaking ending is rejected in the session, and the second turn replaces the first", () => {
    const r = run({ exitCode: "0", mode: "ok" });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("exit_code=0");
    expect(r.stdout, "the second ending kept the one-call rule").toContain("ending_invalid=false");
    expect(r.messages, "the rejection is a user turn in the session").toContain("user");
    expect(r.output, "the second attempt's report is the run's").toContain("Done; nothing left to run.");
    expect(r.output).not.toContain(BREAKING);
  });

  test("a stalled run is continued the same way", () => {
    // A clean ending is not a call, so the only reason left is the stall  Ewhich
    // `should_continue_stalled.ts` decides from the session and the ops log. Its
    // own tests hold the judgement; here it only has to be reachable, which is
    // visible in the session gaining a user turn while the ending stays valid.
    const r = run({ exitCode: "0", mode: "ok", output: "Done; nothing left to run." });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("exit_code=0");
  });

  test("the person stopping during the second turn makes the run a soft stop", () => {
    const r = run({ exitCode: "0", mode: "stop" });
    expect(r.status).toBe(0);
    expect(r.stdout, "the stop outranks the retry").toContain("exit_code=2");
    expect(r.messages, "the rejection was already in").toContain("user");
    expect(r.output, "whatever the second attempt wrote stands").toContain("stopped mid-sentence");
  });

  test("a second attempt that failed restores the first run's session", () => {
    const r = run({ exitCode: "0", mode: "fail" });
    expect(r.status).toBe(0);
    expect(r.stdout, "the first ending is the one the run had").toContain("exit_code=0");
    expect(r.stdout).toContain("ending_invalid=true");
    expect(r.messages, "the session is back as atoma wrote it").toEqual(["assistant"]);
  });
});
