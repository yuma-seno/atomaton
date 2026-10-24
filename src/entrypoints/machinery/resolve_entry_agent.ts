#!/usr/bin/env bun
/**
 * resolve_entry_agent.ts — Parse the "/agent-name" slash command from the
 * first visible line of a newly-opened issue's body, and emit
 * agent/number/type/notify as step outputs for atomaton-entry.wac.ts.
 *
 * Env: NUMBER, SENDER (issue number + the user who opened it), GITHUB_EVENT_PATH
 * Writes to $GITHUB_OUTPUT: agent, number, type, notify -- only if a valid
 * slash command was found on the first line; otherwise writes nothing, so a
 * downstream `if: steps.resolve.outputs.agent != ''` naturally stays false.
 */
import { readFileSync, appendFileSync } from "node:fs";
import { isAgentName } from "../../domain/work/agent-name.ts";
import { proseOnly } from "../../adapters/github/tags.ts";
import { defineScript } from "./lib/script-ref.ts";

export const ref = defineScript(import.meta.url);

interface GithubIssueOpenedEvent {
  issue?: { body?: string };
}

/**
 * The line the command must be on: the first one that shows up when the issue is
 * read.
 *
 * Blank lines and HTML comments are skipped because neither is visible on the
 * rendered issue, so requiring the command literally first would fail on a body
 * that looks exactly right. Atomaton writes such comments itself — the
 * `atomaton:notify` tag `create_sub_issue` prefixes a body with is one — and an issue
 * that carried one silently started nothing.
 *
 * Nothing else is skipped in PROSE. A command below a paragraph of prose is not a command
 * at the top, and reading further would turn any mention of `/engineer` in a
 * discussion into a dispatch.
 *
 * Fenced code is skipped too (#311), for the opposite reason: it is perfectly visible.
 * A `/engineer` inside a code block is somebody quoting the format, not making a
 * request, and the thread readers do not take it for one. `proseOnly` blanks the
 * fences, so the line this returns is the body's first line of prose, and the entry
 * and the thread answer "is this a command" the same way about the same body.
 */
function commandLine(body: string): string {
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("<!--") && line.endsWith("-->")) continue;
    return line;
  }
  return "";
}

function main(): void {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  const number = process.env.NUMBER ?? "";
  const sender = process.env.SENDER ?? "";
  const githubOutput = process.env.GITHUB_OUTPUT;

  if (!eventPath) {
    console.error("resolve_entry_agent: GITHUB_EVENT_PATH is not set");
    return;
  }

  const event = JSON.parse(readFileSync(eventPath, "utf8")) as GithubIssueOpenedEvent;
  const body = proseOnly(event.issue?.body ?? "");

  if (!commandLine(body).startsWith("/")) return;
  const agent = commandLine(body).slice(1).trim();
  if (!agent) return;

  // The name is spliced into shell text downstream (`AGENT="${{ inputs.agent }}"`
  // in atomaton-runner) and into an agent-definition path, so anything that is not
  // a bare name stops here. Emitting no output leaves the caller's
  // `if: steps.resolve.outputs.agent != ''` false, which is the same no-op as an
  // issue that opened with no slash command at all.
  //
  // A warning rather than silence because the two realistic causes are a typo
  // and the documented-elsewhere habit of writing instructions on the command
  // line: `/engineer implement X` reads as valid to a human and is not.
  if (!isAgentName(agent)) {
    console.error(
      `::warning::Ignoring '/${agent}': an agent command must be a bare name on its own line ` +
        `(for example '/engineer'), with any instructions on the lines after it.`,
    );
    return;
  }

  if (githubOutput) {
    appendFileSync(githubOutput, [`agent=${agent}`, `number=${number}`, "type=issue", `notify=${sender}`].join("\n") + "\n");
  }
}

if (import.meta.main) main();
