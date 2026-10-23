#!/usr/bin/env bun
/**
 * inject_ending_rejection.ts — tell a run, in its own session, that its closing
 * message broke the one-call rule.
 *
 * Usage: inject_ending_rejection.ts --session PATH --problem-file FILE
 *
 * ## Why a user turn and not another invocation with a prompt
 *
 * The run is being asked to write the same closing message again. The model has to
 * see the message it wrote and the reason it was refused, and the conversation it
 * wrote it in — all of which are the session. A `--prompt-file` would arrive as the
 * same kind of user turn after the same history, so the choice would be free; it is
 * made here because the alternative is unproven. Atoma documents `--prompt-file` as
 * taking priority over stdin and the session as what a run continues from when no
 * prompt is given; putting the message into the session and passing no prompt makes
 * the run continue from it by the documented path, and is exactly what
 * `inject_dispatcher_notice.ts` does for the same reason.
 *
 * The message itself is `domain/work/ending-calls.ts`'s: one definition, so what the
 * agent is told and what the rule is cannot drift.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { rejectionMessage } from "../../domain/work/ending-calls.ts";
import type { Session } from "../../domain/work/session.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface InjectEndingRejectionArgs {
  session: string;
  "problem-file": string;
}

export const ref = defineScript<InjectEndingRejectionArgs>(import.meta.url);

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: { session: { type: "string" }, "problem-file": { type: "string" } },
  });
  const path = values.session;
  const problemFile = values["problem-file"];
  if (!path || !problemFile) {
    console.error("usage: inject_ending_rejection.ts --session PATH --problem-file FILE");
    process.exit(2);
  }

  const problem = existsSync(problemFile) ? readFileSync(problemFile, "utf8").trim() : "";
  if (!problem) {
    // Nothing was wrong with the message. Same shape as the dispatcher notice's empty
    // case: the caller is shared between two paths, and this is the one that has
    // nothing to say.
    console.error("inject_ending_rejection: no problem to report; nothing to do");
    return;
  }
  if (!existsSync(path)) {
    // A session that was never written is a normal outcome for a run that failed
    // before its first turn, and there is nobody to ask again.
    console.error(`inject_ending_rejection: ${path} does not exist; nothing to do`);
    return;
  }

  const session = JSON.parse(readFileSync(path, "utf8")) as Session;
  const messages = session.messages ?? [];
  messages.push({ role: "user", content: rejectionMessage(problem) });
  session.messages = messages;
  writeFileSync(path, JSON.stringify(session, null, 2));
  console.error(`inject_ending_rejection: appended the rejection to ${path}`);
}

if (import.meta.main) main();
