#!/usr/bin/env bun
/**
 * read_callees.ts — write down who this run may call, in a step that has a token.
 *
 * Usage: read_callees.ts --out FILE [--number N] [--notify LOGIN]
 *
 * ## Why this is its own step
 *
 * The list comes from the GitHub API, and the step that starts atoma carries no
 * credentials on purpose: a tool server the agent starts can read that process's
 * environment for the minutes the run lasts, so no token goes in it. The validation
 * of the closing message happens inside that same credential-free step, so it cannot
 * read the API for itself — it reads this file instead. See `lib/callees.ts`.
 *
 * ## What counts as callable
 *
 * The thread's human participants — whoever opened the issue or pull request, whoever
 * commented, the repository's collaborators — and the login this work belongs to, even
 * when that login has never appeared on the thread. Bots are participants but never
 * take a turn, so they are not callable; `adapters/github/participants.ts` is the one
 * place that decides which is which.
 *
 * An empty read is written as an empty list rather than failing the step. The run is
 * then told that nobody can be called by name, which is true of what the machinery
 * could confirm, and an empty list cannot cause a message to be refused.
 */
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { humanParticipants } from "../../adapters/github/participants.ts";
import type { Callees } from "./lib/callees.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface ReadCalleesArgs {
  out: string;
  number?: string;
  notify?: string;
}

export const ref = defineScript<ReadCalleesArgs>(import.meta.url);

/**
 * The owner first, then the participants, without repeats that differ only in case.
 *
 * The owner goes first so its spelling wins: the notice says "`@login` is the one this
 * work belongs to" and lists the same login among the people it may call, and two
 * spellings of one account in one sentence read as two accounts.
 */
export function callablePeople(participants: readonly string[], notify: string): Callees {
  const owner = notify.trim();
  const seen = new Set<string>();
  const humans: string[] = [];
  for (const candidate of [owner, ...participants]) {
    const login = candidate.trim();
    const key = login.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    humans.push(login);
  }
  return { humans, notify: owner };
}

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      out: { type: "string" },
      number: { type: "string" },
      notify: { type: "string" },
    },
  });
  const out = values.out;
  if (!out) {
    console.error("usage: read_callees.ts --out FILE [--number N] [--notify LOGIN]");
    process.exit(2);
  }

  const people = callablePeople(
    humanParticipants(process.env.GITHUB_REPOSITORY ?? "", values.number ?? ""),
    values.notify ?? "",
  );
  writeFileSync(out, JSON.stringify(people, null, 2));
  console.error(
    people.humans.length === 0
      ? "read_callees: nobody can be called by name"
      : `read_callees: ${people.humans.join(", ")}${people.notify ? ` (owner ${people.notify})` : ""}`,
  );
}

if (import.meta.main) main();
