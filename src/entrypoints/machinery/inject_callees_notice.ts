#!/usr/bin/env bun
/**
 * inject_callees_notice.ts — name the people this run may call.
 *
 * Usage: inject_callees_notice.ts --session PATH --people-file FILE
 *
 * ## Why the run is told, when it used to be told it did not need to know
 *
 * The machinery used to make the only call there was: when nothing was scheduled to
 * run next, it mentioned the person the work belongs to, and the prompt's advice was
 * to write no handle because one would be added. A run now ends by calling one thing
 * itself — one agent or one person — and a call to a person is an `@login`. A run
 * cannot make that call out of a list it has never seen: the participants are whoever
 * opened the thread, whoever commented, and the collaborators, which is a fact about
 * GitHub that no tool call hands it in one answer.
 *
 * So the machinery names them, once, at the start of the run. It is the list written
 * by `read_callees.ts` and accepted by `check_ending.ts` — one read, one file, so what
 * the run is told and what is accepted are the same set.
 *
 * ## Why a user message and not a template placeholder
 *
 * For the reason `inject_dispatcher_notice.ts` gives: the placeholders are the atoma
 * core's vocabulary, and this is a fact about this delivery system. The session is the
 * delivery system's way of putting a fact in front of the model, and it is where the
 * run reads the rest of the context it was given.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import type { Session } from "../../domain/work/session.ts";
import { readCalleesFile, type Callees } from "./lib/callees.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface InjectCalleesNoticeArgs {
  session: string;
  "people-file": string;
}

export const ref = defineScript<InjectCalleesNoticeArgs>(import.meta.url);

/** The notice, given who may be called and who the work belongs to. */
export function calleesNotice({ humans, notify }: Callees): string {
  if (humans.length === 0) {
    return (
      "No person can be called from this run: no owner is configured for this work and no " +
      "participant could be read. End by calling an agent, or by calling nobody; the machinery " +
      "has nobody it can name."
    );
  }
  const list = humans.map((login) => `@${login}`).join(", ");
  const owner = notify ? ` @${notify} is the one this work belongs to.` : "";
  return (
    `The people you may call in your closing message: ${list}.${owner}\n\n` +
    "A closing message calls at most one thing: one agent, as a line holding nothing but " +
    "`/name`; or one of those people, as a single `@login`; or nobody, and the machinery tells " +
    "the person this work belongs to. A mention of one of them is a call — write one only when " +
    "you are handing the work to them. Two calls, an agent and a person or two of either, are " +
    "refused: the message is posted with its mentions left as text, nothing in it is started, " +
    "and the machinery makes the call itself."
  );
}

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: { session: { type: "string" }, "people-file": { type: "string" } },
  });
  const path = values.session;
  const peopleFile = values["people-file"];
  if (!path || !peopleFile) {
    console.error("usage: inject_callees_notice.ts --session PATH --people-file FILE");
    process.exit(2);
  }
  if (!existsSync(path)) {
    // A session that was never written is a normal outcome for a run that failed
    // before its first turn; there is no model to tell.
    console.error(`inject_callees_notice: ${path} does not exist; nothing to do`);
    return;
  }

  const callees = readCalleesFile(peopleFile);
  const session = JSON.parse(readFileSync(path, "utf8")) as Session;
  const messages = session.messages ?? [];
  messages.push({ role: "user", content: calleesNotice(callees) });
  session.messages = messages;
  writeFileSync(path, JSON.stringify(session, null, 2));
  console.error(`inject_callees_notice: named ${callees.humans.length} callable people in ${path}`);
}

if (import.meta.main) main();
