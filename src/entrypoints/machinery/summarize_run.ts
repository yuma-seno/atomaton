#!/usr/bin/env bun
/**
 * summarize_run.ts — write the step outputs the post steps consume, from the
 * run's own artifacts.
 *
 * Four of the six are greps over the structured ops log, and the greps carry
 * weights: `"op":"dispatch"` ends in a quote precisely so it cannot match
 * `"op":"dispatch-elsewhere"` — one run cannot read as both handing off to its
 * own chain and parking its turn on work under another node (#208). A refactor
 * once changed a log message's wording and the grep pattern silently stopped
 * matching; the op names are stable, documented JSON fields, and this file is
 * where the matching lives now that it is code rather than inline bash.
 *
 * `result` keeps the random-delimiter form — a run's report can contain any
 * string, including one that looks like a delimiter — and `directive` is empty
 * by contract when the closing message's calls were refused: nothing it named
 * is started, and the result comment says so.
 */
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { AGENT_DEFINITIONS_DIR } from "../../domain/machinery/machinery-layout.ts";
import { machineryPath } from "../../adapters/runner/machinery.ts";
import { changedSoFar } from "./lib/agent-env.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface SummarizeRunArgs {
  "run-dir": string;
  "ending-invalid": string;
}

export const ref = defineScript<SummarizeRunArgs>(import.meta.url);

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      "run-dir": { type: "string" },
      "ending-invalid": { type: "string" },
    },
  });
  const runDir = values["run-dir"];
  if (!runDir) {
    console.error("summarize_run: --run-dir is required");
    process.exit(2);
  }
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (!githubOutput) {
    console.error("summarize_run: GITHUB_OUTPUT is not set; there is nowhere to write the run's outputs");
    process.exit(2);
  }

  const endingInvalid = values["ending-invalid"] === "true";

  // Store multiline result as a step output, under a delimiter the agent's own
  // output cannot contain: the token is drawn fresh each run.
  const resultDelimiter = Array.from(crypto.getRandomValues(new Uint8Array(15)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const outputFile = join(runDir, "atomaton_output.txt");
  const result = existsSync(outputFile) ? readFileSync(outputFile, "utf8") : "";
  appendFileSync(
    githubOutput,
    `result<<${resultDelimiter}\n${result}${result.endsWith("\n") || result === "" ? "" : "\n"}${resultDelimiter}\n`,
  );

  if (endingInvalid) {
    appendFileSync(githubOutput, "directive=\n");
  } else {
    const directive = spawnSync("bun", [
      "run",
      join(import.meta.dir, "extract_directive.ts"),
      "--output-file", outputFile,
      "--def-dir", machineryPath(AGENT_DEFINITIONS_DIR),
    ], { encoding: "utf8", stdio: ["ignore", "inherit", "inherit"] });
    if (directive.status !== 0) {
      console.error(`summarize_run: extract_directive exited ${directive.status}`);
      process.exit(1);
    }
  }
  appendFileSync(githubOutput, `ending_invalid=${endingInvalid}\n`);

  const opsLog = join(runDir, "atomaton_ops.log");
  const opsContent = existsSync(opsLog) ? readFileSync(opsLog, "utf8") : "";

  // Whether a tool call already triggered an automatic follow-up dispatch ON THIS
  // NODE during this run, as opposed to the agent genuinely finishing with nothing
  // further happening. The trailing quote is the instrument: `"op":"dispatch"`
  // cannot match `"op":"dispatch-elsewhere"`.
  const chainContinues = opsContent.includes('"op":"dispatch"');
  appendFileSync(githubOutput, `chain_continues=${chainContinues}\n`);

  // Whether this run PARKED its turn on work under this node (#208): a
  // child-starting tool dispatches onto ANOTHER node, and the ops log says so
  // with `dispatch-elsewhere`. A parked run keeps the `atomaton/in-progress`
  // label -- the aggregation re-invocation is the collection of its turn, not a
  // new one.
  const parked = opsContent.includes('"op":"dispatch-elsewhere"');
  appendFileSync(githubOutput, `parked=${parked}\n`);

  // Whether this run changed anything: the most direct signal of a chain that is
  // not getting anywhere. The earlier read, before any second turn, was for the
  // stalled check; this is the final answer, and the second turn appended to the
  // same log.
  appendFileSync(githubOutput, `changed=${changedSoFar(opsLog)}\n`);
}

if (import.meta.main) main();
