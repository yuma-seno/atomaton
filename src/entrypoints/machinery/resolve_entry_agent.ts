#!/usr/bin/env bun
/**
 * resolve_entry_agent.ts — Parse the "/agent-name" slash command from a
 * newly-opened issue's body, and emit agent/number/type/notify as step
 * outputs for atomaton-entry.wac.ts.
 *
 * Env: NUMBER, SENDER (issue number + the user who opened it), GITHUB_EVENT_PATH
 * Writes to $GITHUB_OUTPUT: agent, number, type, notify -- only if a valid
 * slash command was found; otherwise writes nothing, so a downstream
 * `if: steps.resolve.outputs.agent != ''` naturally stays false.
 *
 * The command may sit anywhere in the body on a line of its own -- an issue
 * that argues its case and closes with `/atomaton` dispatches (#488, #489
 * each closed with one and started nothing). What keeps the scan from
 * mistaking prose for a dispatch is that the WHOLE line must be the command:
 * an agent mentioned inside a sentence never matches.
 */
import { readFileSync, appendFileSync } from "node:fs";
import { isAgentName, AGENT_NAME_PATTERN } from "../../domain/work/agent-name.ts";
import { proseOnly } from "../../adapters/github/tags.ts";
import { defineScript } from "./lib/script-ref.ts";

export const ref = defineScript(import.meta.url);

interface GithubIssueOpenedEvent {
  issue?: { body?: string };
}

/**
 * The prose lines a command may sit on, in order.
 *
 * Blank lines and HTML comments are skipped because neither is visible on the
 * rendered issue: an issue that carries only an `atomaton:notify` tag before
 * its command looks exactly right to a person. Atomaton writes such comments
 * itself — the `atomaton:notify` tag `create_sub_issue` prefixes a body with
 * is one — and an issue that carried one silently started nothing.
 *
 * A command may also sit below the prose, on a line of its own (#488, #489).
 * What keeps reading past the opening paragraph from turning a discussion's
 * mention of `/engineer` into a dispatch is that the WHOLE line has to be the
 * command: an agent named inside a sentence never matches.
 *
 * Fenced code is skipped too (#311), for the opposite reason: it is perfectly visible.
 * A `/engineer` inside a code block is somebody quoting the format, not making a
 * request, and the thread readers do not take it for one. `proseOnly` blanks the
 * fences, so these lines are the body's prose, and the entry and the thread
 * answer "is this a command" the same way about the same body.
 */
function proseLines(body: string): string[] {
  const lines: string[] = [];
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("<!--") && line.endsWith("-->")) continue;
    lines.push(line);
  }
  return lines;
}

/** A line that is exactly one slash command and nothing else: `/engineer`. */
const BARE_COMMAND = new RegExp(`^/(${AGENT_NAME_PATTERN})$`);

function bareCommand(line: string): string | undefined {
  const m = BARE_COMMAND.exec(line);
  return m?.[1];
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
  const lines = proseLines(body);

  /** The one place agent + number + type + notify are written from. */
  const emit = (agent: string): void => {
    if (githubOutput) {
      appendFileSync(
        githubOutput,
        [`agent=${agent}`, `number=${number}`, "type=issue", `notify=${sender}`].join("\n") + "\n",
      );
    }
  };

  // The opening line keeps the strict reading it always had: a slash there that
  // is not a bare name is the typo / instructions-on-the-line case, worth a
  // warning rather than a scan. The name is spliced into shell text downstream
  // (`AGENT="${{ inputs.agent }}"` in atomaton-runner) and into an
  // agent-definition path, so anything that is not a bare name stops before
  // anything reaches that text. Emitting no output leaves the caller's
  // `if: steps.resolve.outputs.agent != ''` false, which is the same no-op as an
  // issue that opened with no slash command at all.
  //
  // A warning rather than silence because the two realistic causes are a typo
  // and the documented-elsewhere habit of writing instructions on the command
  // line: `/engineer implement X` reads as valid to a human and is not.
  const first = lines[0] ?? "";
  if (first.startsWith("/")) {
    const agent = first.slice(1).trim();
    if (agent && !isAgentName(agent)) {
      console.error(
        `::warning::Ignoring '/${agent}': an agent command must be a bare name on its own line ` +
          `(for example '/engineer'), with any instructions on the lines after it.`,
      );
    } else if (agent) {
      emit(agent);
      return;
    }
    // A first line that is merely "/" writes nothing and falls through.
  }

  // Everywhere else, an entire line that is exactly one bare command counts --
  // the issue that argues its case first and calls at the end. Sentences that
  // mention an agent, and slash-leading paths like `/tmp/x`, are whole prose
  // lines that are not commands, and never match. The scan runs even after a
  // warned opening line: the warning is about that line, not a veto on the body.
  for (const line of lines.slice(1)) {
    const agent = bareCommand(line);
    if (agent !== undefined) {
      emit(agent);
      return;
    }
  }
}

if (import.meta.main) main();
