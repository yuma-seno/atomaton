#!/usr/bin/env bun
/**
 * decide_reask.ts — whether the one second turn a run is allowed is wanted, and
 * why it is being asked for.
 *
 * An ending that calls two things, a run that stopped on a sentence having
 * changed nothing, and a run the loop guard stopped are different failures with
 * the same remedy: a user turn in the session, then the same atoma invocation
 * again. So a run gets at most ONE extra turn, and the ending is checked first — a
 * message that calls somebody has handed the work on and must not also be read
 * as stalled.
 *
 * ## Why the turn itself is not here
 *
 * atoma reads the credentials file and deletes it before starting any tool server
 * — deliberate, tested, and what keeps the file and the servers from ever
 * coexisting — so the file this run wrote is gone by the time the first turn is
 * over. A second turn needs a second one, and only a step that holds the values can
 * write one. Holding them here would mean holding them in the step whose bash lives
 * for the whole of the first turn, which is the one thing the two-mechanism design
 * exists to prevent (`write_credentials_file.ts`, and the step in
 * `src/workflows/atomaton-runner.wac.ts`).
 *
 * So this decides, backs the session up and puts the note in, and `ask_again.ts`
 * in the next step runs the turn on a credentials file of its own. The bound is
 * unchanged and still held in one place: no second reason is ever looked for.
 *
 * The scripts this orchestrates are spawned rather than imported, because that
 * is exactly how the runner called them — same argv, same fail-open shapes. A
 * check that cannot run is a machinery error here (it fails the step, leaving
 * the boundary flag unwritten), which is what the inline version's `-e` did.
 *
 * Prints `reask=`, `budget_secs=`, `exit_code=`, `ending_invalid=` and
 * `injected=` to stdout — the caller's step reads the first four into its outputs.
 * `injected` is printed for the log alone: it is the record of whether the session
 * was already mutated when the next step was entered, which is what makes a failed
 * ask legible after the fact.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { AGENT_DEFINITIONS_DIR } from "../../domain/machinery/machinery-layout.ts";
import { machineryRoot } from "../../adapters/runner/machinery.ts";
import { loopAbortFromSession } from "../../domain/work/loop-continuation.ts";
import { agentBudget, changedSoFar } from "./lib/agent-env.ts";
import { defineScript } from "./lib/script-ref.ts";
import { parseSession } from "./read_run_ending.ts";

export interface DecideReaskArgs {
  "run-dir": string;
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
      "stop-file": { type: "string" },
      "deadline-at": { type: "string" },
      "min-budget-secs": { type: "string" },
      "exit-code": { type: "string" },
    },
  });
  for (const required of ["run-dir", "stop-file", "deadline-at", "min-budget-secs", "exit-code"] as const) {
    if (values[required] === undefined) {
      console.error(`decide_reask: --${required} is required`);
      process.exit(2);
    }
  }

  const runDir = values["run-dir"]!;
  const session = join(runDir, "session.json");
  const sessionBefore = join(runDir, "session_before_reask.json");
  const output = join(runDir, "atomaton_output.txt");
  const problemFile = join(runDir, "ending-problem.txt");
  const peopleFile = join(runDir, "callees.json");
  const stopFile = values["stop-file"]!;
  const root = machineryRoot() ?? ".";
  const exitCode = values["exit-code"]!;

  const checkArgs = ["--output-file", output, "--def-dir", join(root, AGENT_DEFINITIONS_DIR), "--problem-file", problemFile, "--people-file", peopleFile];

  // The reason for the second turn, if there is one. The ending check runs only
  // for a run that ended of its own accord: a run that was stopped or ran out of
  // time was cut off mid-sentence, and asking it to finish the sentence would be
  // asking it to ignore the person who said stop.
  //
  // A loop abort is the one ending that is not `completed` and is still asked. The
  // guard stopped a run that was working, the verdict in the session names exactly
  // what it repeated, and one turn is what turns that into a report a person can
  // read -- see `domain/work/loop-continuation.ts` for why that run is worth asking
  // and what it is told. The verdict is what is read, not the ending word or the exit
  // code: atoma records this abort as `failed`, so both of those say only that the run
  // did not finish.
  let reask = "";
  if (!existsSync(stopFile)) {
    if (exitCode === "0") {
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
    } else if (loopAbortFromSession(parseSession(existsSync(session) ? readFileSync(session, "utf8") : undefined)) !== undefined) {
      reask = "loop";
    }
  }

  let budgetSecs = 0;
  let endingInvalid = false;
  let injected = false;

  if (reask !== "") {
    const { budget, floored } = agentBudget(Number(values["deadline-at"]), Date.now() / 1000, Number(values["min-budget-secs"]));
    if (floored) {
      // No time for a second turn. An ending that calls two things is posted with
      // its calls left as text, and the result comment says so -- see
      // post_result_comment.ts's --ending-invalid. A stalled run simply keeps the
      // message it ended on, and a loop abort keeps the ending and the verdict the
      // session already holds, which is what names the repeated call in its comment.
      if (reask === "ending") {
        console.error("::warning::the closing message calls more than one thing and there is no time left to ask again; nothing it calls will be started");
        endingInvalid = true;
      } else if (reask === "loop") {
        // The loop guard's verdict stays in the session, which is where
        // post_result_comment.ts reads it: a run that gets no second turn still
        // names the call that repeated in its comment.
        console.error("::warning::the loop guard stopped this run and there is no time left to ask again");
      } else {
        console.error("::warning::the run stopped on a sentence having changed nothing, and there is no time left to ask again");
      }
      reask = "";
    } else {
      budgetSecs = budget;
      // The session as the first turn left it, kept before the note goes in: the
      // second turn may die, and the ending this run actually had is the one above.
      copyFileSync(session, sessionBefore);
      if (reask === "ending") {
        console.error("::warning::the closing message calls more than one thing; asking for it again");
        sibling("inject_ending_rejection.ts", ["--session", session, "--problem-file", problemFile]);
      } else if (reask === "loop") {
        console.error("::warning::the loop guard stopped this run; asking for one more turn");
        sibling("inject_loop_continuation.ts", ["--session", session]);
      } else {
        console.error("::warning::the run stopped on a sentence having changed nothing; asking for it again");
        sibling("inject_stalled_continuation.ts", ["--session", session]);
      }
      injected = true;
    }
  }

  console.error(`decide_reask: reask=${reask || "none"} budget_secs=${budgetSecs} injected=${injected} ending_invalid=${endingInvalid}`);
  process.stdout.write(`reask=${reask}\nbudget_secs=${budgetSecs}\nexit_code=${exitCode}\nending_invalid=${endingInvalid}\ninjected=${injected}\n`);
}

if (import.meta.main) main();
