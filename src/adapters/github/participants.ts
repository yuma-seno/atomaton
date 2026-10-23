/**
 * participants.ts — who a comment may notify, and who a run may call.
 *
 * Read by everything that posts text an agent wrote: the result comment, and the
 * bodies of the issues and pull requests it opens. One place, because "who counts
 * as a participant" answered differently in two files is two policies nobody
 * decided on. What is done with the answer is `domain/work/mention.ts`.
 */
import { gh } from "./gh.ts";

export interface Participant {
  login: string;
  /** What GitHub says the account is, from whichever source named it. */
  bot: boolean;
}

/**
 * Everyone the three sources below name, with what kind of account each one is.
 *
 * Exported for the callers that need both answers from one read: the result comment
 * escapes against every participant and asks separately which of them the run
 * called, and reading the three endpoints twice to answer two questions about the
 * same list is two answers waiting to disagree.
 *
 * Three sources, each best-effort and each read separately so a failure of one
 * does not take the others with it:
 *
 *   - whoever opened the issue or pull request
 *   - whoever has commented on it
 *   - the repository's collaborators
 *
 * The `issues` endpoint rather than `gh issue view`, because a pull request is an
 * issue to that endpoint and is not to that command -- one call that works for
 * both beats two that each work for half.
 *
 * An empty result is the fail-closed case and is correct: nothing confirmed means
 * nothing is exempt, and `domain/work/mention.ts` explains why that is the cheaper of
 * the two mistakes.
 *
 * A login named by one source as a bot and by another as a person counts as a
 * person. The two readings disagree only for an account somebody registered twice,
 * and the direction that keeps the account callable is the one that does not turn a
 * person's own login into a silent failure.
 */
export function participantAccounts(repo: string, number: string | number): Participant[] {
  if (!repo || !String(number).trim()) return [];
  const found = new Map<string, boolean>();

  const collect = (args: string[], read: (json: unknown) => unknown[]) => {
    const { code, stdout } = gh(...args);
    if (code !== 0) return;
    try {
      for (const person of read(JSON.parse(stdout))) {
        const { login, bot } = person as { login?: unknown; bot?: unknown };
        if (typeof login !== "string" || !login) continue;
        const seen = found.get(login);
        // Bot only while every source that named it says bot -- see above.
        found.set(login, (seen ?? true) && bot === true);      }
    } catch {
      // A body that will not parse tells us nothing about who may be mentioned.
    }
  };

  collect(["api", `repos/${repo}/issues/${number}`], (json) => {
    const issue = json as { user?: { login?: string; type?: string } };
    return issue.user ? [{ login: issue.user.login, bot: issue.user.type === "Bot" }] : [];
  });
  collect(["api", `repos/${repo}/issues/${number}/comments`, "--paginate"], (json) =>
    (json as { user?: { login?: string; type?: string } }[]).map((comment) => ({
      login: comment.user?.login,
      bot: comment.user?.type === "Bot",
    })),
  );
  collect(["api", `repos/${repo}/collaborators`, "--paginate"], (json) =>
    (json as { login?: string; type?: string }[]).map((person) => ({
      login: person.login,
      bot: person.type === "Bot",
    })),
  );

  return [...found].map(([login, bot]) => ({ login, bot }));
}

/** Everyone an agent may mention from a thread without notifying a stranger. */
export function knownParticipants(repo: string, number: string | number): string[] {
  return participantAccounts(repo, number).map((person) => person.login);
}

/**
 * The people a run may hand the work to, by login.
 *
 * A bot is not one of them: `@dependabot` and the machinery's own accounts are in
 * the participant list, notify nobody who can decide anything, and are not a way to
 * end a turn — see `domain/work/ending-calls.ts`. Filtering here rather than there
 * keeps the answer to "may this be pinged" and the answer to "is this somebody's
 * turn" reading the same list of accounts.
 */
export function humanParticipants(repo: string, number: string | number): string[] {
  return participantAccounts(repo, number)
    .filter((person) => !person.bot)
    .map((person) => person.login);
}
