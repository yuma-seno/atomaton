#!/usr/bin/env bun
/**
 * should_continue_stalled.ts — should this run be asked, once, for one more turn?
 *
 * A run that ends on a text-only turn, changed nothing and called nobody may have
 * stopped on the sentence that announced its next step. #467 caught the shape when
 * the sentence ended on a colon; two more runs ended it with a full stop and were
 * recorded as `completed` / `changed=no`. The predicate is
 * `domain/work/stalled-continuation.ts`, which explains why each fact is read and
 * what the one extra turn costs.
 *
 * Usage: should_continue_stalled.ts --session FILE --output-file FILE
 *          --def-dir DIR --people-file FILE --changed true|false
 *
 * Writes `true` or `false` to stdout. The caller asks the question before starting a
 * second turn, so the answer reaches it as a value rather than through an exit code
 * that would fail the step.
 *
 * The facts come from the same places the other readers use: the ending and the last
 * assistant message out of the saved session (`read_run_ending.ts`'s parsers and
 * `domain/record/closing-report.ts`), the calls out of the closing message with the
 * same definitions and people list `check_ending.ts` counts against, and `--changed`
 * from the caller because the ops log is bash's to read. Asking a second, differently
 * spelled way here would be a second answer waiting to disagree with the one that
 * stopped the chain.
 */
import { existsSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { lastTurnCalledTools } from "../../domain/record/closing-report.ts";
import { endingCalls } from "../../domain/work/ending-calls.ts";
import { shouldAskToContinue } from "../../domain/work/stalled-continuation.ts";
import { hasAgentDefinition } from "./extract_directive.ts";
import { readCalleesFile } from "./lib/callees.ts";
import { defineScript } from "./lib/script-ref.ts";
import { endingFromSession, parseSession } from "./read_run_ending.ts";

export interface ShouldContinueStalledArgs {
  session: string;
  "output-file": string;
  "def-dir": string;
  "people-file"?: string;
  changed: string;
}

export const ref = defineScript<ShouldContinueStalledArgs>(import.meta.url);

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      session: { type: "string" },
      "output-file": { type: "string" },
      "def-dir": { type: "string" },
      "people-file": { type: "string" },
      changed: { type: "string" },
    },
  });
  const sessionPath = values.session;
  const outputFile = values["output-file"];
  const defDir = values["def-dir"];
  if (!sessionPath || !outputFile || !defDir) {
    console.error(
      "usage: should_continue_stalled.ts --session FILE --output-file FILE --def-dir DIR --people-file FILE --changed true|false",
    );
    process.exit(2);
  }

  const session = parseSession(existsSync(sessionPath) ? readFileSync(sessionPath, "utf8") : undefined);
  const output = existsSync(outputFile) ? readFileSync(outputFile, "utf8") : "";
  const callees = readCalleesFile(values["people-file"]);
  const calls = endingCalls(output, {
    knowsAgent: (name) => hasAgentDefinition(name, defDir),
    humans: callees.humans,
  });

  const answer = shouldAskToContinue({
    endedBecause: endingFromSession(session),
    lastTurnCalledTools: lastTurnCalledTools(session),
    changed: values.changed === "true",
    calledSomeone: calls.agents.length + calls.humans.length > 0,
  });
  console.log(answer ? "true" : "false");
  console.error(`should_continue_stalled: ${answer}`);
}

if (import.meta.main) main();
