#!/usr/bin/env bun
/**
 * ask_again.ts — the one second turn a run is allowed, run on the reason
 * `decide_reask.ts` decided and the note it already put in the session.
 *
 * ## Why this is a script of its own
 *
 * atoma reads the credentials file and deletes it before starting any tool server
 * — deliberate, tested, and what keeps the file and the servers from ever
 * coexisting — so the file this run wrote is gone once the first turn is over. A
 * second turn therefore needs a second file, and only a step holding the values can
 * write one. The decision step holds none, by the same rule that keeps them out of
 * "Run agent"; the step that calls this writes a fresh file and holds the values for
 * its own length. See the step's comment for what that window costs.
 *
 * ## What it carries
 *
 * Everything that has to happen after the note went in: the launch, the closing
 * check on the second message (a second message is a closing message too, whoever
 * asked for it), what a person's stop during the ask means, and the restore that
 * keeps the first turn's ending when the second attempt dies without one. The
 * decision itself stays in `decide_reask.ts`, so "two turns, no more" is held in
 * one file.
 *
 * Prints `exit_code=` and `ending_invalid=` to stdout. The caller's step writes both
 * into its outputs, and the ending classification reads them there.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { AGENT_DEFINITIONS_DIR } from "../../domain/machinery/machinery-layout.ts";
import { machineryRoot } from "../../adapters/runner/machinery.ts";
import { buildAgentEnv } from "./lib/agent-env.ts";
import { launchAtoma } from "./lib/atoma-launch.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface AskAgainArgs {
  "run-dir": string;
  "tool-cache": string;
  "tools-file": string;
  "credentials-file": string;
  "stop-file": string;
  reask: string;
  "budget-secs": string;
  "exit-code": string;
}

export const ref = defineScript<AskAgainArgs>(import.meta.url);

/** Runs one of the sibling scripts the way the runner always has, inheriting output. */
function sibling(script: string, args: string[]): void {
  const run = spawnSync("bun", ["run", join(import.meta.dir, script), ...args], { stdio: "inherit" });
  if (run.status !== 0) {
    throw new Error(`ask_again: ${script} exited ${run.status}`);
  }
}

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      "run-dir": { type: "string" },
      "tool-cache": { type: "string" },
      "tools-file": { type: "string" },
      "credentials-file": { type: "string" },
      "stop-file": { type: "string" },
      reask: { type: "string" },
      "budget-secs": { type: "string" },
      "exit-code": { type: "string" },
    },
  });
  for (const required of ["run-dir", "tool-cache", "tools-file", "credentials-file", "stop-file", "reask", "budget-secs", "exit-code"] as const) {
    if (values[required] === undefined) {
      console.error(`ask_again: --${required} is required`);
      process.exit(2);
    }
  }

  const runDir = values["run-dir"]!;
  const session = join(runDir, "session.json");
  const sessionBefore = join(runDir, "session_before_reask.json");
  const output = join(runDir, "atomaton_output.txt");
  const outputAgain = join(runDir, "atomaton_output_again.txt");
  const problemFile = join(runDir, "ending-problem.txt");
  const peopleFile = join(runDir, "callees.json");
  const stopFile = values["stop-file"]!;
  const root = machineryRoot() ?? ".";
  const reask = values.reask!;

  const checkArgs = ["--output-file", output, "--def-dir", join(root, AGENT_DEFINITIONS_DIR), "--problem-file", problemFile, "--people-file", peopleFile];

  let exitCode = values["exit-code"]!;
  // Nothing upstream can hand this in as refused: an ending whose calls were refused
  // for want of time is never asked, and the first ending survives only when the
  // second attempt dies without one -- which is the branch below that says so.
  let endingInvalid = false;

  // No prompt: the note is a user message in the session now, and a run with
  // no prompt source continues from the session -- the documented path, and
  // the reason this does not use `--prompt-file`.
  const secondExit = launchAtoma({
    agent: process.env.AGENT ?? "",
    machineryRoot: root,
    toolsFile: values["tools-file"]!,
    credentialsFile: values["credentials-file"]!,
    stopFile,
    session,
    logsFile: join(runDir, "atomaton_logs.txt"),
    appendLogs: true,
    envEntries: buildAgentEnv(process.env, {
      toolCache: values["tool-cache"]!,
      runDir,
    }),
    outFile: outputAgain,
    budgetSecs: Number(values["budget-secs"]),
  });

  if (secondExit === 0 && existsSync(outputAgain) && readFileSync(outputAgain, "utf8").length > 0) {
    rmSync(output, { force: true });
    copyFileSync(outputAgain, output);
    rmSync(outputAgain, { force: true });
    // The output published below is the second turn's, so the exit code that
    // accompanies it is that turn's too. For the two reasons that arrived at 0 this
    // changes nothing; a loop abort did not, and leaving its exit in place would
    // describe the run by the turn that was abandoned rather than by the one whose
    // report is being published.
    exitCode = "0";
    // The second message is a closing message too, whichever reason asked for
    // it, so it gets the same check. It is not asked again: one extra turn is
    // the bound.
    sibling("check_ending.ts", checkArgs);
    if (readFileSync(problemFile, "utf8").length > 0) {
      console.error("::warning::the closing message still calls more than one thing; nothing it calls will be started");
      endingInvalid = true;
    }
  } else if (existsSync(stopFile)) {
    // The person stopped while the machinery was asking again. That outranks
    // the retry: keep the second attempt's ending (a stop) and whatever it
    // managed to write, which is often nothing.
    exitCode = "2";
    if (existsSync(outputAgain) && readFileSync(outputAgain, "utf8").length > 0) {
      rmSync(output, { force: true });
      copyFileSync(outputAgain, output);
    } else {
      writeFileSync(output, "");
    }
    rmSync(outputAgain, { force: true });
  } else {
    // The second attempt failed or was cut off without the person asking. The
    // first run's ending is the one this run actually had, so put the session
    // back as it was. An ending that broke the rule keeps its calls refused; a
    // stalled run's own message stands.
    copyFileSync(sessionBefore, session);
    if (reask === "ending") endingInvalid = true;
    rmSync(outputAgain, { force: true });
  }

  console.error(`ask_again: exit_code=${exitCode} ending_invalid=${endingInvalid}`);
  process.stdout.write(`exit_code=${exitCode}\nending_invalid=${endingInvalid}\n`);
}

if (import.meta.main) main();
