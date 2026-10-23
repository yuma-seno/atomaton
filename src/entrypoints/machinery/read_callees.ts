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
 * ## What it writes
 *
 * Two lists from one read. The **participants** — whoever opened the issue or pull
 * request, whoever commented, the repository's collaborators, bots included — are
 * everybody a comment may name without notifying a stranger. The **humans** are the
 * subset that can take a turn: the same list without bots, plus the login this work
 * belongs to even when that login has never appeared on the thread. A bot is a
 * participant; nobody's turn is a bot's. `adapters/github/participants.ts` is the one
 * place that decides which is which.
 *
 * An empty read is written as empty lists rather than failing the step. The run is
 * then told that nobody can be called by name, which is true of what the machinery
 * could confirm, and an empty list cannot cause a message to be refused.
 */
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { participantAccounts, type Participant } from "../../adapters/github/participants.ts";
import type { Callees } from "./lib/callees.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface ReadCalleesArgs {
  out: string;
  number?: string;
  notify?: string;
}

export const ref = defineScript<ReadCalleesArgs>(import.meta.url);

/**
 * The owner first, then the accounts, without repeats that differ only in case.
 *
 * The owner goes first so its spelling wins: the notice says "`@login` is the one this
 * work belongs to" and lists the same login among the people it may call, and two
 * spellings of one account in one sentence read as two accounts.
 */
function withOwner(owner: string, accounts: readonly string[]): string[] {
  const seen = new Set<string>();
  const logins: string[] = [];
  for (const candidate of [owner, ...accounts]) {
    const login = candidate.trim();
    const key = login.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    logins.push(login);
  }
  return logins;
}

/** The two lists `read_callees.ts` writes, from one participant read. */
export function callablePeople(accounts: readonly Participant[], notify: string): Callees {
  const owner = notify.trim();
  return {
    humans: withOwner(
      owner,
      accounts.filter((account) => !account.bot).map((account) => account.login),
    ),
    participants: withOwner(
      owner,
      accounts.map((account) => account.login),
    ),
    notify: owner,
  };
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
    participantAccounts(process.env.GITHUB_REPOSITORY ?? "", values.number ?? ""),
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
