#!/usr/bin/env bun
/**
 * save_agent_session.ts — Save session.json to the atomaton-data branch (via
 * lib/atomaton-data.ts's saveSession(), which handles push-race retries using
 * an isolated git worktree).
 *
 * No size work happens here anymore: atoma caps each tool result where it ARRIVES
 * (`domain/tool_output.rs`, 8,000 characters, from v0.4.3 / atoma#12), and a
 * session whose parts are already small needs no second cap at save. The save-side
 * cap this script used to run (4,000, and before it the restore-side shrink) was
 * the second of two ideas about how big a result is; this is the removal of the
 * one that saw the result too late. A run over its model's window is atoma's
 * COMPACTION to answer, not a save-time trim: the definition declares
 * `context_limit`, and the compacted session is what lands here.
 *
 * Usage: save_agent_session.ts --session session.json --type issue|pr --number N --agent NAME
 * No-ops quietly if --session doesn't exist.
 */
import { existsSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { saveSession, sessionTargetPath } from "./lib/atomaton-data.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface SaveAgentSessionArgs {
  session: string;
  type: string;
  number: string | number;
  agent: string;
}

export const ref = defineScript<SaveAgentSessionArgs>(import.meta.url);

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      session: { type: "string" },
      type: { type: "string" },
      number: { type: "string" },
      agent: { type: "string" },
    },
  });
  if (!values.session || !values.type || !values.number || !values.agent) {
    console.error("usage: save_agent_session.ts --session FILE --type issue|pr --number N --agent NAME");
    process.exit(2);
  }
  if (!existsSync(values.session)) {
    console.error("No session.json found, skipping save.");
    return;
  }

  const target = sessionTargetPath(values.type, values.number, values.agent);
  const content = readFileSync(values.session, "utf8");
  const runId = process.env.GITHUB_RUN_ID ?? "";
  const saved = saveSession(target, content, `session: ${values.agent} on ${values.type} ${values.number} (run ${runId})`);
  if (!saved) {
    console.log(`::warning::Failed to save session to atomaton-data:${target} after all retries.`);
  } else {
    console.error(`Session saved to atomaton-data:${target}`);
  }
}

if (import.meta.main) main();
