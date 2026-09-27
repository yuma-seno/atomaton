#!/usr/bin/env bun
/**
 * inject_dispatcher_notice.ts — Append a "who started this run" notice to the
 * agent's session.json messages array, so the run knows who is waiting on its
 * result and reports back to them.
 *
 * Usage: inject_dispatcher_notice.ts --session <path> --dispatched-by <agent>
 *
 * ## Why this is a user message and not a template placeholder
 *
 * The system prompt is built by the atoma core from a fixed set of placeholders
 * (`{{AGENT_NAME}}`, `{{COLLEAGUES_LIST}}`, ...), and adding one is a change to
 * the core's own vocabulary -- a change to what `atoma` takes as an argument. The
 * fact here is not the core's: who started a run is a fact about this delivery
 * system, and the delivery system already has a way to put a fact in front of the
 * agent -- a `role: "user"` message in the session, which is exactly what
 * `inject_uncommitted_notice.ts` does for the same reason.
 *
 * ## Why the run cannot work this out for itself
 *
 * The dispatch comment on the sub-issue names the agent being STARTED, never the
 * one starting it, and the sub-issue body carries no such field. So an engineer
 * dispatched by an atomaton had no way to tell that an atomaton was waiting, and
 * ended with a plain comment on its own sub-issue instead of reporting back. The
 * name travels as `ATOMATON_DISPATCHED_BY` (see `RunnerDispatch.dispatchedBy`),
 * and this puts it where the model reads it.
 *
 * Empty when a person or the machinery started the run: there is no agent to
 * report to, and the notice says so rather than inventing one.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { defineScript } from "./lib/script-ref.ts";
import type { Session } from "../../domain/work/session.ts";

export interface InjectDispatcherNoticeArgs {
  session: string;
  "dispatched-by": string;
}

export const ref = defineScript<InjectDispatcherNoticeArgs>(import.meta.url);

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: { session: { type: "string" }, "dispatched-by": { type: "string" } },
  });
  const path = values.session;
  if (!path) {
    console.error("usage: inject_dispatcher_notice.ts --session <path> --dispatched-by <agent>");
    process.exit(2);
  }
  const dispatchedBy = (values["dispatched-by"] ?? "").trim();
  if (!dispatchedBy) {
    // A person or the machinery started this run. There is nobody to report to,
    // and saying nothing is the honest answer -- the prompt's own handoff rules
    // already cover a run with no dispatcher.
    console.error("inject_dispatcher_notice: no dispatcher; nothing to do");
    return;
  }
  if (!existsSync(path)) {
    // Not an error. The step that calls this runs after a failed or short run
    // too, and a session that was never written is a normal outcome there.
    console.error(`inject_dispatcher_notice: ${path} does not exist; nothing to do`);
    return;
  }
  const session = JSON.parse(readFileSync(path, "utf8")) as Session;
  const messages = session.messages ?? [];
  messages.push({
    role: "user",
    content:
      `This run was started by the \`${dispatchedBy}\` agent, which is waiting on your result. ` +
      `When you finish, report back to it: end your response with a line holding nothing but ` +
      `\`/${dispatchedBy}\`, followed by what you concluded and what it should do next. ` +
      `Do not end with a plain comment and no such line -- the agent that started you would ` +
      `never be told the work is done.`,
  });
  session.messages = messages;
  writeFileSync(path, JSON.stringify(session, null, 2));
  console.error(`inject_dispatcher_notice: appended notice to ${path} (dispatched by ${dispatchedBy})`);
}

if (import.meta.main) main();
