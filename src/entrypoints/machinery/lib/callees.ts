/**
 * callees.ts — who a run may call, as the list travels from the step that can read
 * GitHub to the steps that cannot.
 *
 * ## Why a file and not a read in each consumer
 *
 * The participant list comes from the GitHub API, and the step that starts atoma is
 * deliberately credential-free: every tool server the agent starts can read that
 * process's environment for minutes, so no token is put in it. The read therefore
 * happens once, in a step that has a token (`read_callees.ts`), and the answer travels
 * in the run directory to the three consumers that need it:
 *
 *   - `inject_callees_notice.ts`, which names the people to the run so the run can
 *     write one of those logins in its closing message;
 *   - `check_ending.ts`, which decides whether that message called more than one thing;
 *   - `post_result_comment.ts`, which decides which mentions in it may notify.
 *
 * One file rather than three reads, because those answers have to be the same set by
 * construction. Three reads are three answers, and the first time they disagree a run
 * is refused for calling somebody it was told about — or, the other way round, a
 * mention is escaped while the machinery believes a call was made, and nobody is told
 * anything at all.
 *
 * ## Two lists, because "may mention" and "may call" are not the same question
 *
 * `participants` is everybody a comment may name without notifying a stranger — the
 * thread's people and the collaborators, bots included. `humans` is the subset that
 * can take a turn: the same list without bots, plus the owner of the work. A bot is a
 * participant; nobody's turn is a bot's.
 */
import { existsSync, readFileSync } from "node:fs";

export interface Callees {
  /** Logins a run may call: non-bot participants and the owner, owner first. */
  humans: string[];
  /** Logins a comment may mention without notifying a stranger: all of them, owner first. */
  participants: string[];
  /** The login the work belongs to, or `""`. Always one of `humans` when set. */
  notify: string;
}

export const NO_CALLEES: Callees = { humans: [], participants: [], notify: "" };

/**
 * The list written by `read_callees.ts`, or `NO_CALLEES` when the file is absent or
 * unreadable.
 *
 * Absent is the fail-closed case, and the consequence is the safe one: a mention of
 * nobody in particular counts as no call, so a message that names a person is only
 * ever refused for something the machinery could actually see. The comment then
 * escapes every mention and the machinery mentions the owner itself, so the turn still
 * comes back to a person — it is the notification that gets narrower, never the work.
 */
export function readCalleesFile(path: string | undefined): Callees {
  if (!path || !existsSync(path)) return NO_CALLEES;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as {
      humans?: unknown;
      participants?: unknown;
      notify?: unknown;
    };
    const logins = (value: unknown): string[] =>
      Array.isArray(value) ? value.filter((login): login is string => typeof login === "string" && login !== "") : [];
    return {
      humans: logins(parsed.humans),
      participants: logins(parsed.participants),
      notify: typeof parsed.notify === "string" ? parsed.notify : "",
    };
  } catch {
    // A body that will not parse tells us nothing about who may be called.
    return NO_CALLEES;
  }
}
