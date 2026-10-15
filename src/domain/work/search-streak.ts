/**
 * search-streak.ts — refusing a search when nothing the last ones found has been opened.
 *
 * The three most expensive sessions in the store share one shape and only one:
 * long stretches of search with nothing opened. The session transcripts, the
 * per-session counts and the distribution they were measured against are in the
 * thread that set this limit; what carries here is the shape and the threshold.
 *
 * What separates those runs is semantic: **a search returns where something is,
 * not what it is.** A run that has searched many times without opening anything
 * has not used a single thing it found. That is not an expensive run, it is not
 * a run at all.
 *
 * # Why it refuses the act and not the run
 *
 * A refusal costs one search and tells the agent the thing it needs to hear. Stopping
 * the run costs the run. And a refusal is deterministic, so an agent that ignores it
 * gets the same refusal again — which the core's own `MAX_IDENTICAL_TOOL_FAILURES`
 * already stops. No new stopping rule anywhere.
 *
 * # What clears it
 *
 * A read through the `files` server clears the streak, the same as `sed -n` does.
 * It did not always: a guard has to be satisfiable by the act it asks for, and an
 * agent that OBEYS a refusal naming a tool that cannot satisfy the streak reaches
 * the same end as one that ignores it — refused again, identically, until the core
 * stops the run. The streak is therefore cleared by the tool that read, whichever
 * server it came from — `toolOpens` below — and `note_file_opened`, a hook on the
 * files servers, reports it.
 */

/**
 * Searches in a row, with nothing opened, before one is refused.
 *
 * Set above the measured distribution so only the pathological sessions it was taken
 * against touch it: the per-session counts, the percentiles and the transcripts are
 * in the thread that set this limit, not here.
 */
export const MAX_SEARCHES_WITHOUT_OPENING = 15;

/** What a shell command does, as far as this rule is concerned. */
export type ShellAct = "search" | "open" | "other";

/** Locates. Returns a path, a line number, a count — never the thing itself. */
const SEARCHES = /^(grep|egrep|fgrep|rg|ag|ack|ugrep|find)$/;

/** Opens. Returns the content. */
const OPENS = /^(cat|bat|head|tail|sed|less|more|nl|od|xxd)$/;

/**
 * What this command is doing.
 *
 * Read from the first command of the pipeline, so `grep x foo.ts | head` is a search
 * (the `head` is pagination) and `head -50 foo.ts` is an open. `sed` counts as an open
 * because `sed -n '10,40p' file` is how a range gets read; `sed -i` is a write and is
 * refused elsewhere in this guard.
 *
 * `find . -exec cat {} \;` reads as a search, which is the one classification here that
 * is arguably wrong. It makes the guard fire slightly sooner, and the threshold has
 * room for it.
 */
export function classifyShellAct(command: string): ShellAct {
  const first = command
    .trim()
    .split(/\s*(?:\|\||&&|[;|])\s*/)[0]
    ?.trim()
    .split(/\s+/)
    // `VAR=x grep ...` and `sudo grep ...`: step over what is not the command itself.
    .find((token) => token.length > 0 && !token.includes("=") && token !== "sudo" && token !== "time");
  if (first === undefined) return "other";

  const name = first.split("/").pop() ?? first;
  if (SEARCHES.test(name)) return "search";
  if (OPENS.test(name)) return "open";
  return "other";
}

/**
 * Whether this tool, named as the agent calls it, returned the content of a file.
 *
 * The prefix is the server, so this is deliberately not anchored to one name: read is
 * a read whichever server performed it, and the failure this repairs came from a rule
 * that knew about one server's reads and not another's.
 *
 * Listing is not opening. `list_directory` and `directory_tree` answer where things
 * are, which is what a search answers, and clearing the streak on them would let a run
 * enumerate for ever without reading anything — the shape this whole module exists to
 * catch. Neither is `grep` or `glob`, for the same reason.
 *
 * `read` is what the shipped `files` server calls it, and it is the only name left.
 * The four that `@modelcontextprotocol/server-filesystem` used are gone with that
 * server: `tools/packages.json` installs no npm package, and no agent definition
 * declares it. They were kept beside `read` when `files` arrived rather than replaced
 * by it, which is what kept a now-false invariant looking true — see `refusalReason`,
 * which named one of them for two releases after nothing could call it.
 */
const TOOLS_THAT_OPEN = /(^|__)read$/;

/** Whether a completed tool call counts as having opened something. */
export function toolOpens(tool: string): boolean {
  return TOOLS_THAT_OPEN.test(tool.trim());
}

/**
 * The streak after this act.
 *
 * Only opening clears it. Running the test suite between searches is work, but it is
 * not using what the searches found — and an agent that searches ten times, runs the
 * tests, then searches ten more has still not opened anything.
 */
export function nextStreak(streak: number, act: ShellAct): number {
  if (act === "search") return streak + 1;
  if (act === "open") return 0;
  return streak;
}

/**
 * Why this search is refused, or nothing.
 *
 * Says what a search is for, because the agent has to know why opening is the next act
 * rather than a better pattern. `engineer.md` already says two or three fruitless
 * searches will not be answered by a fourth; eighty-five happened anyway, so the
 * sentence has to arrive at the moment it applies.
 */
export function refusalReason(streak: number, limit = MAX_SEARCHES_WITHOUT_OPENING): string | undefined {
  if (streak < limit) return undefined;
  return (
    `${streak} searches in a row without opening any of the files they found. A search returns ` +
    "where something is, not what it is, so nothing found so far has been read. Do one of two " +
    "things before searching again: open the most promising result — with `read`, or `sed -n` " +
    "for a range — or, if you are guessing at what the thing is called, ask " +
    "search_code the same question in a sentence. Measured, that finds the right file " +
    "in the top five 70% of the time, against 41.5% for the regex patterns agents search with."
  );
}
