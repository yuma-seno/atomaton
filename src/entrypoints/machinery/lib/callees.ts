/**
 * callees.ts — the people a run may call, as the list travels from the step that can
 * read GitHub to the steps that cannot.
 *
 * ## Why a file and not a read in each consumer
 *
 * The participant list comes from the GitHub API, and the step that starts atoma is
 * deliberately credential-free: every tool server the agent starts can read that
 * process's environment for minutes, so no token is put in it. The read therefore
 * happens once, in a step that has a token (`read_callees.ts`), and the answer travels
 * in the run directory to the two consumers that need it:
 *
 *   - `inject_callees_notice.ts`, which names the people to the run so the run can
 *     write one of those logins in its closing message;
 *   - `check_ending.ts`, which decides whether that message called more than one thing.
 *
 * One file rather than two reads, because "who the run was told it may call" and "who
 * the machinery accepts as a call" have to be the same set by construction. Two reads
 * are two answers, and the first time they disagree the run is refused for calling
 * somebody it was told about.
 *
 * `humans` already contains `notify`: the owner of the work is one of the people a run
 * may call, and is listed with the rest. `notify` is carried separately only so the
 * notice can say which of them the work belongs to.
 */
import { existsSync, readFileSync } from "node:fs";

export interface Callees {
  /** Logins a run may call, the owner first. Empty when nothing could be read. */
  humans: string[];
  /** The login the work belongs to, or `""`. Always one of `humans` when set. */
  notify: string;
}

export const NO_CALLEES: Callees = { humans: [], notify: "" };

/**
 * The list written by `read_callees.ts`, or `NO_CALLEES` when the file is absent or
 * unreadable.
 *
 * Absent is the fail-closed case, and the consequence is the safe one: a mention of
 * nobody in particular counts as no call, so a message that names a person is only
 * ever refused for something the machinery could actually see. The result comment
 * reads the participants again on its own token before it posts, so an unreadable
 * file cannot turn an escaping decision into a notification either.
 */
export function readCalleesFile(path: string | undefined): Callees {
  if (!path || !existsSync(path)) return NO_CALLEES;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as {
      humans?: unknown;
      notify?: unknown;
    };
    const humans = Array.isArray(parsed.humans)
      ? parsed.humans.filter((login): login is string => typeof login === "string" && login !== "")
      : [];
    const notify = typeof parsed.notify === "string" ? parsed.notify : "";
    return { humans, notify };
  } catch {
    // A body that will not parse tells us nothing about who may be called.
    return NO_CALLEES;
  }
}
