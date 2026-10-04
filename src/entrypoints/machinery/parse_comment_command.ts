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
 * Writes `matched`, `agent`, `control`, `session_mode`, and `error` to
 * $GITHUB_OUTPUT.
 */
import { appendFileSync } from "node:fs";
import { parseCommentCommand } from "../../domain/work/comment-command.ts";
import { defineScript } from "./lib/script-ref.ts";

export const ref = defineScript(import.meta.url);

function main(): void {
  const body = process.env.ATOMATON_COMMENT_BODY ?? "";
  const { agent, control, sessionMode, error } = parseCommentCommand(body);
  const matched = agent ? "true" : "false";

  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    appendFileSync(githubOutput, `matched=${matched}\nagent=${agent}\ncontrol=${control}\n`);
    appendFileSync(githubOutput, `session_mode=${sessionMode}\nerror=${error}\n`);
  }
}

if (import.meta.main) main();
