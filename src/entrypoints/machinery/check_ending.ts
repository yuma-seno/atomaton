#!/usr/bin/env bun
/**
 * check_ending.ts — did this run's closing message keep the one-call rule?
 *
 * A closing message calls at most one thing: one agent, one person, or nobody. The
 * rule and the counting are `domain/work/ending-calls.ts`; this is the machinery
 * around them — the agent definitions that make a directive real, and the people who
 * make a mention a call — and it hands the answer to the runner, which decides
 * whether to ask for the message again.
 *
 * Usage: check_ending.ts --output-file FILE --def-dir DIR --problem-file FILE
 *          --people-file FILE
 *
 * The people come from a file rather than from GitHub: this runs inside the step that
 * starts atoma, which carries no credentials, so the list was read before the run
 * started (`read_callees.ts`, see `lib/callees.ts`). It is the same list the run was
 * shown, which is the point — a call is accepted because the run was told it could
 * make it.
 *
 * The problem is written to `--problem-file`, empty when there is none. A file rather
 * than an exit code, because this runs inside the step that started atoma and must not
 * fail it: an ending that breaks the rule is a fact about the run, not a machinery
 * error, and the caller reads the fact and carries on.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { endingCallProblem, endingCalls } from "../../domain/work/ending-calls.ts";
import { hasAgentDefinition } from "./extract_directive.ts";
import { readCalleesFile } from "./lib/callees.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface CheckEndingArgs {
  "output-file": string;
  "def-dir": string;
  "problem-file": string;
  "people-file"?: string;
}

export const ref = defineScript<CheckEndingArgs>(import.meta.url);

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      "output-file": { type: "string" },
      "def-dir": { type: "string" },
      "problem-file": { type: "string" },
      "people-file": { type: "string" },
    },
  });
  const outputFile = values["output-file"];
  const defDir = values["def-dir"];
  const problemFile = values["problem-file"];
  if (!outputFile || !defDir || !problemFile) {
    console.error(
      "usage: check_ending.ts --output-file FILE --def-dir DIR --problem-file FILE --people-file FILE",
    );
    process.exit(2);
  }

  const output = existsSync(outputFile) ? readFileSync(outputFile, "utf8") : "";
  const callees = readCalleesFile(values["people-file"]);
  const calls = endingCalls(output, {
    knowsAgent: (name) => hasAgentDefinition(name, defDir),
    humans: callees.humans,
  });
  const problem = endingCallProblem(calls);

  writeFileSync(problemFile, problem ?? "", "utf8");
  const named = [...calls.agents.map((agent) => `/${agent}`), ...calls.humans.map((login) => `@${login}`)];
  console.error(
    named.length === 0
      ? "closing message calls nobody"
      : `closing message calls ${named.join(", ")}${problem ? " -- more than one" : ""}`,
  );
}

if (import.meta.main) main();
