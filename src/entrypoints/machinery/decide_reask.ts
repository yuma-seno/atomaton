#!/usr/bin/env bun
/**
 * decide_reask.ts  Ethe one second turn a run is allowed, and why it is being
 * asked for.
 *
 * An ending that calls two things and a run that stopped on a sentence having
 * changed nothing are different failures with the same remedy: a user turn in
 * the session, then the same atoma invocation again. They share one block here
 * so a run gets at most ONE extra turn, and the ending is checked first  Ea
 * message that calls somebody has handed the work on and must not also be read
 * as stalled.
 *
 * This used to be inline in the agent step, and moved here with the rest of the
 * step's logic when the step outgrew GitHub's 21,000-character bound on one
 * expression. The behaviour is the one that shipped: the same checks, the same
 * injections, the same bounds.
 *
 * The scripts this orchestrates are spawned rather than imported, because that
 * is exactly how the runner called them  Esame argv, same fail-open shapes. A
 * check that cannot run is a machinery error here (it fails the step, leaving
 * the boundary flag unwritten), which is what the inline version's `-e` did.
 *
 * Prints `exit_code=<n>` and `ending_invalid=<bool>` to stdout  Ethe caller's
 * step reads both, because the ending classification below consumes the exit
 * code this may have rewritten (a person stopping during the second turn makes
 * the run a soft stop), and stdout is the only channel into the same step.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { AGENT_DEFINITIONS_DIR } from "../../domain/machinery/machinery-layout.ts";
import { machineryRoot } from "../../adapters/runner/machinery.ts";
import { agentBudget, buildAgentEnv, changedSoFar } from "./lib/agent-env.ts";
import { launchAtoma } from "./lib/atoma-launch.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface DecideReaskArgs {
  "run-dir": string;
  "tool-cache": string;
  "tools-file": string;
  "credentials-file": string;
  "stop-file": string;
  "deadline-at": string;
  "min-budget-secs": string;
  "exit-code": string;
}

export const ref = defineScript<DecideReaskArgs>(import.meta.url);

/** Runs one of the sibling scripts the way the runner always has, inheriting output. */
function sibling(script: string, args: string[]): void {
  const run = spawnSync("bun", ["run", join(import.meta.dir, script), ...args], { stdio: "inherit" });
  if (run.status !== 0) {
    throw new Error(`decide_reask: ${script} exited ${run.status}`);
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
      "deadline-at": { type: "string" },
      "min-budget-secs": { type: "string" },
      "exit-code": { type: "string" },
    },
  });
  for (const required of ["run-dir", "tool-cache", "tools-file", "credentials-file", "stop-file", "deadline-at", "min-budget-secs", "exit-code"] as const) {
    if (values[required] === undefined) {
      console.error(`decide_reask: --${required} is required`);
      process.exit(2);
    }
  }

  const runDir = values["run-dir"]!;
  const session = join(runDir, "session.json");
  const sessionBefore = join(runDir, "session_before_reask.json");
  const output = join(runDir, "atomaton_output.txt");
  const outputAgain = join(runDir, "atomaton_output_again.txt");
  const logs = join(runDir, "atomaton_logs.txt");
  const problemFile = join(runDir, "ending-problem.txt");
  const peopleFile = join(runDir, "callees.json");
  const stopFile = values["stop-file"]!;
  const root = machineryRoot() ?? ".";

  const checkArgs = ["--output-file", output, "--def-dir", join(root, AGENT_DEFINITIONS_DIR), "--problem-file", problemFile, "--people-file", peopleFile];
  const envEntries = buildAgentEnv(process.env, {
    toolCache: values["tool-cache"]!,
    runDir,
  });
  const launchArgs = {
    agent: process.env.AGENT ?? "",
    machineryRoot: root,
    toolsFile: values["tools-file"]!,
    credentialsFile: values["credentials-file"]!,
    stopFile,
    session,
    logsFile: logs,
    appendLogs: true,
    envEntries,
  };

  let exitCode = values["exit-code"]!;
  let endingInvalid = false;

  // The reason for the second turn, if there is one. The ending check runs only
  // for a run that ended of its own accord: a run that was stopped or ran out of
  // time was cut off mid-sentence, and asking it to finish the sentence would be
  // asking it to ignore the person who said stop.
  let reask = "";
  if (exitCode === "0" && !existsSync(stopFile)) {
    sibling("check_ending.ts", checkArgs);
    if (readFileSync(problemFile, "utf8").length > 0) {
      reask = "ending";
    } else {
      const stalled = spawnSync(
        "bun",
        ["run", join(import.meta.dir, "should_continue_stalled.ts"), "--session", session, "--output-file", output, "--def-dir", join(root, AGENT_DEFINITIONS_DIR), "--people-file", peopleFile, "--changed", String(changedSoFar(join(runDir, "atomaton_ops.log")))],
        { encoding: "utf8" },
      );
      if (stalled.status === 0 && stalled.stdout.trim() === "true") reask = "stalled";
    }
  }

  if (reask !== "") {
    const { budget: reaskBudget, floored } = agentBudget(Number(values["deadline-at"]), Date.now() / 1000, Number(values["min-budget-secs"]));
    if (floored) {
      // No time for a second turn. An ending that calls two things is posted with
      // its calls left as text, and the result comment says so  Esee
      // post_result_comment.ts's --ending-invalid. A stalled run simply keeps the
      // message it ended on.
      if (reask === "ending") {
        console.error("::warning::the closing message calls more than one thing and there is no time left to ask again; nothing it calls will be started");
        endingInvalid = true;
      } else {
        console.error("::warning::the run stopped on a sentence having changed nothing, and there is no time left to ask again");
      }
    } else {
      copyFileSync(session, sessionBefore);
      if (reask === "ending") {
        console.error("::warning::the closing message calls more than one thing; asking for it again");
        sibling("inject_ending_rejection.ts", ["--session", session, "--problem-file", problemFile]);
      } else {
        console.error("::warning::the run stopped on a sentence having changed nothing; asking for it again");
        sibling("inject_stalled_continuation.ts", ["--session", session]);
      }
      // No prompt: the note is a user message in the session now, and a run with
      // no prompt source continues from the session -- the documented path, and
      // the reason this does not use `--prompt-file`.
      const secondExit = launchAtoma({
        ...launchArgs,
        outFile: outputAgain,
        budgetSecs: reaskBudget,
      });

      if (secondExit === 0 && existsSync(outputAgain) && readFileSync(outputAgain, "utf8").length > 0) {
        rmSync(output, { force: true });
        copyFileSync(outputAgain, output);
        rmSync(outputAgain, { force: true });
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
    }
  }

  console.error(`decide_reask: exit_code=${exitCode} ending_invalid=${endingInvalid}`);
  process.stdout.write(`exit_code=${exitCode}\nending_invalid=${endingInvalid}\n`);
}

if (import.meta.main) main();
