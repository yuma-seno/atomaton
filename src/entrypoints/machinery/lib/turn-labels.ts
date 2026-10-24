/**
 * turn-labels.ts — the two labels that say whose ball a node's turn is, moved together.
 *
 * `atomaton/in-progress` says work is in flight under the node: a run executing, or
 * a turn parked on agents working under it (#208). `atomaton/waiting-for-person`
 * says the turn came back and the machinery is waiting for a person (#223). The two
 * are complementary by construction, which is why one function moves both: a caller
 * that remembered to add one and forgot the other would leave a node wearing both
 * or neither, and neither state is readable.
 *
 * Best effort throughout, like every label write: the thread is the turn's record
 * and the labels are its cache. Every failure is a warning naming what was lost.
 */
import { gh } from "../../../adapters/github/gh.ts";
import { getLabel } from "../../../adapters/runner/config.ts";

export type TurnLabelPhase =
  /** A run took the turn: `in-progress` on, `waiting-for-person` off. */
  | "running"
  /** The turn came back to a person: `in-progress` off, `waiting-for-person` on. */
  | "with-person";

export function applyTurnLabels(phase: TurnLabelPhase, repo: string, number: string): void {
  const inProgress = getLabel("in_progress");
  const waitingForPerson = getLabel("waiting_for_person");
  const edit = (action: "--add-label" | "--remove-label", label: string) =>
    gh("issue", "edit", number, action, label, ...(repo ? ["--repo", repo] : []));

  // Created if missing, so a renamed label or a fresh config still lands. `--repo`
  // travels with every call: a caller working in one checkout may be applying the
  // labels to another repository, and a label created in the wrong one makes the
  // `issue edit` fail as "label not found" (the #223 review's third point).
  const create = (label: string, color: string, description: string) =>
    gh("label", "create", label, "--force", "-c", color, "-d", description, ...(repo ? ["--repo", repo] : []));

  if (phase === "running") {
    create(inProgress, "0366d6", "Issue is being worked on by an Atomaton agent");
    const added = edit("--add-label", inProgress);
    if (added.code !== 0) console.error(`::warning::could not add '${inProgress}' to #${number}`);
    const removed = edit("--remove-label", waitingForPerson);
    if (removed.code !== 0) console.error(`::warning::could not remove '${waitingForPerson}' from #${number}`);
    return;
  }

  create(waitingForPerson, "fbca04", "The turn is with a person on this issue or pull request");
  const removed = edit("--remove-label", inProgress);
  if (removed.code !== 0) console.error(`::warning::could not remove '${inProgress}' from #${number}`);
  const added = edit("--add-label", waitingForPerson);
  if (added.code !== 0) console.error(`::warning::could not add '${waitingForPerson}' to #${number}`);
}
