/**
 * ask_again.test.ts — the one second turn itself, once the decision has been made.
 *
 * The second turn is `sudo ... atoma run`, and tests cannot run sudo — so a fake
 * `sudo` on PATH stands in for it, driven by `FAKE_SUDO_MODE`. What the fake
 * answers for is the exec and its exit code; the launch library's argv is held by
 * the contract tests on the generated workflow.
 *
 * What this pins is what the turn leaves behind, which is the part a refactor can
 * break without anything failing: a second report that arrived is the run's, a
 * person's stop during the ask outranks the retry, an attempt that died without one
 * leaves the first turn's ending standing, and a machinery failure of the script's
 * own is loud rather than silent. The fake is a shell script because the exec it
 * stands in for is the POSIX one, and the suite runs on ubuntu.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hermeticEnv, scriptPath } from "./testing/harness.ts";

/** The breaking ending the first turn left: two calls, which `check_ending` refuses. */
const BREAKING = "Done.\n\n/engineer\n\n@alice, your call.";
const PEOPLE = JSON.stringify({ humans: ["alice", "bob"], notify: "alice" });
const SESSION = JSON.stringify({ messages: [{ role: "assistant", content: BREAKING }] });

type Mode = "ok" | "fail" | "stop" | "breaking";

function makeSudo(dir: string): string {
  const bin = join(dir, "bin");
  mkdirSync(bin, { recursive: true });
  const sudo = join(bin, "sudo");
  writeFileSync(
    sudo,
    [
      "#!/usr/bin/env bash",
      "# Fakes `sudo -n -u USER env ... atoma run ...` — the exec and its exit code.",
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
      'if [ "$mode" = "breaking" ]; then',
      "  # A second closing message that breaks the one-call rule, like the first.",
      '  printf "Done.\\n\\n/engineer\\n\\n@alice, your call.\\n"',
      "  exit 0",
      "fi",
      'echo "Done; nothing left to run."',
      "exit 0",
      "",
    ].join("\n"),
  );
  chmodSync(sudo, 0o755);
  return bin;
}

interface RunResult {
  status: number;
  stdout: string;
  /** The run's output file after the second turn had its chance. */
  output: string;
  /** The session's roles after the second turn, in order. */
  messages: string[];
}

function run(opts: {
  /** The reason the decision gave; empty means no second turn was wanted, which is not this script's path. */
  reask?: string;
  mode?: Mode;
  /** The first turn's exit code, as the decision published it. */
  exitCode?: string;
  /** Leave the decision's copy of the session out, to make a machinery failure of the restore. */
  withoutKeptSession?: boolean;
  /** Arguments to leave out, to hold the caller's contract. */
  omit?: string;
}): RunResult {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-ask-again-"));
  const bin = makeSudo(dir);
  // The definitions live under the machinery root's `.github/atomaton/`, exactly
  // where a deployed tree carries them — the closing check resolves them itself.
  const defs = join(dir, ".github", "atomaton", "agent-definitions");
  mkdirSync(defs, { recursive: true });
  writeFileSync(join(defs, "engineer.md"), "---\nname: engineer\n---\n");
  const runDir = join(dir, "run");
  mkdirSync(runDir, { recursive: true });
  writeFileSync(join(runDir, "session.json"), SESSION);
  writeFileSync(join(runDir, "atomaton_output.txt"), BREAKING);
  writeFileSync(join(runDir, "callees.json"), PEOPLE);
  if (!opts.withoutKeptSession) writeFileSync(join(runDir, "session_before_reask.json"), SESSION);

  const args: Record<string, string> = {
    "run-dir": runDir,
    "tool-cache": join(dir, "cache"),
    "tools-file": join(dir, "tools.yaml"),
    "credentials-file": join(dir, "credentials.json"),
    "stop-file": join(dir, "stop-requested"),
    reask: opts.reask ?? "ending",
    "budget-secs": "600",
    "exit-code": opts.exitCode ?? "0",
  };
  const argv = ["run", scriptPath("ask_again.ts")];
  for (const [flag, value] of Object.entries(args)) {
    if (flag === opts.omit) continue;
    argv.push(`--${flag}`, value);
  }

  const asked = spawnSync("bun", argv, {
    encoding: "utf8",
    env: {
      ...hermeticEnv(),
      AGENT: "engineer",
      ATOMATON_MACHINERY_ROOT: dir,
      FAKE_SUDO_MODE: opts.mode ?? "ok",
      PATH: `${bin}:${process.env.PATH ?? ""}`,
    },
  });
  const session = JSON.parse(readFileSync(join(runDir, "session.json"), "utf8")) as {
    messages?: Array<{ role: string }>;
  };
  return {
    status: asked.status ?? -1,
    stdout: asked.stdout ?? "",
    output: readFileSync(join(runDir, "atomaton_output.txt"), "utf8"),
    messages: (session.messages ?? []).map((m) => m.role),
  };
}

describe("ask_again.ts", () => {
  test("the second turn's report becomes the run's, on its exit code", () => {
    const r = run({ mode: "ok" });
    expect(r.status, r.stdout).toBe(0);
    expect(r.stdout, "the turn that produced the report is the one that ended the run").toContain("exit_code=0");
    expect(r.stdout).toContain("ending_invalid=false");
    expect(r.output, "the second attempt's report is the run's").toContain("Done; nothing left to run.");
    expect(r.output).not.toContain(BREAKING);
  });

  test("a loop abort's exit is replaced by the turn whose report is published", () => {
    // The reason the exit code is rewritten at all: a loop abort arrives as exit 1,
    // and a second turn that produced a report did not fail.
    const r = run({ mode: "ok", exitCode: "1" });
    expect(r.status, r.stdout).toBe(0);
    expect(r.stdout).toContain("exit_code=0");
    expect(r.output).toContain("Done; nothing left to run.");
  });

  test("a second closing message that breaks the rule has its calls refused", () => {
    const r = run({ mode: "breaking" });
    expect(r.status, r.stdout).toBe(0);
    expect(r.output, "the second attempt's report is still the run's").toContain(BREAKING);
    expect(r.stdout, "and its calls are posted as text, not started").toContain("ending_invalid=true");
  });

  test("the person stopping during the second turn makes the run a soft stop", () => {
    const r = run({ mode: "stop" });
    expect(r.status, r.stdout).toBe(0);
    expect(r.stdout, "the stop outranks the retry").toContain("exit_code=2");
    expect(r.output, "whatever the second attempt wrote stands").toContain("stopped mid-sentence");
  });

  test("a second attempt that failed leaves the first ending standing, and restores the session", () => {
    const r = run({ mode: "fail", reask: "ending" });
    expect(r.status, r.stdout).toBe(0);
    expect(r.stdout, "the first ending is the one the run had").toContain("exit_code=0");
    expect(r.stdout, "and the rule-breaking calls stay refused").toContain("ending_invalid=true");
    expect(r.messages, "the session is back as atoma wrote it").toEqual(["assistant"]);
    expect(r.output, "and so is the first turn's report").toContain(BREAKING);
  });

  test("a stalled run's own message stands when the second attempt dies", () => {
    const r = run({ mode: "fail", reask: "stalled" });
    expect(r.status, r.stdout).toBe(0);
    expect(r.stdout, "no rule was broken, so nothing is refused").toContain("ending_invalid=false");
    expect(r.output).toContain(BREAKING);
    expect(r.messages).toEqual(["assistant"]);
  });

  test("a machinery failure of the script's own is loud, not a quiet second turn", () => {
    // No copy of the session to restore from: the restore is what fails, and a
    // silent success would publish the second attempt's exit code over a session
    // that was never put back.
    const r = run({ mode: "fail", withoutKeptSession: true });
    expect(r.status, "the script's own failure reaches the step").not.toBe(0);
  });

  test("a caller that leaves an argument out is refused, not defaulted", () => {
    const r = run({ mode: "ok", omit: "budget-secs" });
    expect(r.status, "a missing budget cannot be read as no limit").toBe(2);
  });
});
