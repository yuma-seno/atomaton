/**
 * actor.ts — whether the actor behind a GitHub event is a person or the machinery.
 *
 * ## One rule, two encodings
 *
 * GitHub answers "who did this" in two shapes, and both are read in this repository:
 *
 *   - `user.type` on a comment, issue or pull request: `"User"`, `"Bot"`,
 *     `"Organization"`, `"Mannequin"`.
 *   - `author.is_bot` on `gh issue view --json author` / `gh pr view --json author`:
 *     a boolean.
 *
 * They are the same fact, so they are the same rule here. The rule is: **a person is
 * anything that is not a bot.** A missing or unrecognised value reads as a person,
 * because the alternative — reading a person as a bot — is the failure that hides a
 * runaway chain, and because a value nobody could read is not evidence of a bot.
 *
 * ## Why it is one function
 *
 * It was nine, and two of them had already drifted. `thread.ts` read
 * `user.type !== "Bot"` (so `Organization` was a person) while `dispatch-chain.ts`
 * read `user.type === "User"` (so `Organization` was not). The guard would delete an
 * `Organization` comment as a person's, and the handoff tally would not reset for it
 * — two readers, one thread, two answers. That is the same shape as the bug
 * `shapedThread` was written to close, and this is its other half.
 *
 * The login-suffix form (`login.endsWith("[bot]")`) is deliberately NOT here: the
 * suffix is part of a name anyone can choose, and `user.type` is what the API
 * decides. Where a caller has only a login, it should ask for the type instead.
 */

/** The one `user.type` value that means the machinery rather than a person. */
export const BOT_TYPE = "Bot";

/**
 * Whether a `user.type` value is a person.
 *
 * Case-insensitive, because the REST API capitalises (`"User"`) and a caller that
 * lowercased on the way in should not get a different answer. Missing and
 * unrecognised values read as a person — see the header.
 */
export function isHumanActor(type: string | undefined): boolean {
  return (type ?? "").trim().toLowerCase() !== BOT_TYPE.toLowerCase();
}

/**
 * Whether an `author.is_bot` value is a person.
 *
 * The boolean encoding of the same rule. `undefined` reads as a person, which is
 * what every caller already did (`is_bot ?? false`) and is the cautious direction:
 * it hands the decision to someone rather than taking it.
 */
export function isHumanAuthor(isBot: boolean | undefined): boolean {
  return !(isBot ?? false);
}
