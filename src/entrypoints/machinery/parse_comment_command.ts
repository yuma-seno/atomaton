#!/usr/bin/env bun
/**
 * parse_comment_command.ts — Parse a GitHub comment and extract either a
 * slash-command agent name and optional session mode, or a control command, from
 * any line.
 *
 * Human commands must occupy their own line: `/engineer` or
 * `/engineer recover`. Instructions belong on following lines. Internal
 * dispatch comments remain accepted for automation.
 *
 * The syntax itself is `domain/work/comment-command.ts`, shared with the thread reader
 * and with the refusal that keeps an agent from writing a command into a body.
 *
 * Env: ATOMATON_COMMENT_BODY
 * Writes `parsed`, `matched`, `agent`, `control`, `session_mode`, and `error` to
 * $GITHUB_OUTPUT. `parsed` is `true` whenever this script ran -- a step that does not
 * run leaves every output empty, and a comment with no command in it writes
 * `matched=false`, so the guard cannot tell those apart without it.
 */
import { appendFileSync } from "node:fs";
import { proseOnly } from "../../adapters/github/tags.ts";
import { parseCommentCommand } from "../../domain/work/comment-command.ts";
import { defineScript } from "./lib/script-ref.ts";

export const ref = defineScript(import.meta.url);

function main(): void {
  // Read as prose (#311): a `/engineer` inside a fenced code block is somebody
  // quoting the command format, and the thread readers do not take it for a request
  // either. The entry and the thread must answer "is this a command" the same way,
  // or a run starts on an ask the thread cannot see.
  const body = proseOnly(process.env.ATOMATON_COMMENT_BODY ?? "");
  const { agent, control, sessionMode, error } = parseCommentCommand(body);
  const matched = agent ? "true" : "false";

  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    // `parsed` says this step RAN, which `matched` cannot: a step that does not run
    // leaves every output empty, and so does a comment with no command in it. The
    // guard's commands rule turns on the difference -- a comment from somebody who is
    // not a repository member is never read here, so it must not be refused for what it
    // would have asked for (#217).
    appendFileSync(githubOutput, `parsed=true\n`);
    appendFileSync(githubOutput, `matched=${matched}\nagent=${agent}\ncontrol=${control}\n`);
    appendFileSync(githubOutput, `session_mode=${sessionMode}\nerror=${error}\n`);
  }
}

if (import.meta.main) main();
