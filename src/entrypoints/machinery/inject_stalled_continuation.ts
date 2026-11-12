#!/usr/bin/env bun
/**
 * inject_stalled_continuation.ts — tell a run, in its own session, that it stopped
 * on a sentence having changed nothing, and may take one more turn.
 *
 * Usage: inject_stalled_continuation.ts --session PATH
 *
 * `domain/work/stalled-continuation.ts` decides when this is asked and writes the
 * note; this is the machinery that puts it where the next turn will read it. A user
 * turn in the saved session, the same shape `inject_ending_rejection.ts` uses and for
 * the same reason: atoma continues from the session when no prompt is given, so the
 * run sees the message it wrote and the note after it, then carries on by the
 * documented path.
 *
 * A session that was never written is a normal outcome for a run that failed before
 * its first turn. There is nobody to ask and nothing to append, so this says so and
 * leaves the caller to its ending.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { stalledContinuationMessage } from "../../domain/work/stalled-continuation.ts";
import type { Session } from "../../domain/work/session.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface InjectStalledContinuationArgs {
  session: string;
}

export const ref = defineScript<InjectStalledContinuationArgs>(import.meta.url);

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: { session: { type: "string" } },
  });
  const path = values.session;
  if (!path) {
    console.error("usage: inject_stalled_continuation.ts --session PATH");
    process.exit(2);
  }
  if (!existsSync(path)) {
    console.error(`inject_stalled_continuation: ${path} does not exist; nothing to do`);
    return;
  }

  const session = JSON.parse(readFileSync(path, "utf8")) as Session;
  const messages = session.messages ?? [];
  messages.push({ role: "user", content: stalledContinuationMessage() });
  session.messages = messages;
  writeFileSync(path, JSON.stringify(session, null, 2));
  console.error(`inject_stalled_continuation: appended the continuation to ${path}`);
}

if (import.meta.main) main();
