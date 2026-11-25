#!/usr/bin/env bun
/**
 * inject_loop_continuation.ts — tell a run the loop guard stopped, in its own
 * session, what it repeated and that it may take one more turn.
 *
 * Usage: inject_loop_continuation.ts --session PATH
 *
 * `domain/work/loop-continuation.ts` decides what is said, from the verdict atoma
 * recorded in the session; this puts it where the next turn will read it, as a user
 * turn — the same shape `inject_stalled_continuation.ts` writes and for the same
 * reason: atoma continues from the session when no prompt is given, so the run sees
 * the calls it made and the note after them, then carries on by the documented path.
 *
 * The verdict is read here rather than passed as arguments because the session is
 * where it lives and the run is already going to be read from it. A session with no
 * verdict — never written, or written by a binary older than v0.6.0 — has nothing to
 * be told, so this says so and appends nothing rather than inventing a note.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { loopAbortFromSession, loopContinuationMessage } from "../../domain/work/loop-continuation.ts";
import type { Session } from "../../domain/work/session.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface InjectLoopContinuationArgs {
  session: string;
}

export const ref = defineScript<InjectLoopContinuationArgs>(import.meta.url);

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: { session: { type: "string" } },
  });
  const path = values.session;
  if (!path) {
    console.error("usage: inject_loop_continuation.ts --session PATH");
    process.exit(2);
  }
  if (!existsSync(path)) {
    console.error(`inject_loop_continuation: ${path} does not exist; nothing to do`);
    return;
  }

  const session = JSON.parse(readFileSync(path, "utf8")) as Session;
  const abort = loopAbortFromSession(session);
  if (abort === undefined) {
    console.error(`inject_loop_continuation: ${path} records no loop verdict; nothing to say`);
    return;
  }
  const messages = session.messages ?? [];
  messages.push({ role: "user", content: loopContinuationMessage(abort) });
  session.messages = messages;
  writeFileSync(path, JSON.stringify(session, null, 2));
  console.error(`inject_loop_continuation: appended the continuation for the ${abort.rule} verdict to ${path}`);
}

if (import.meta.main) main();
