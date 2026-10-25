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
 * A closed node — an issue closed, a pull request merged or dropped — carries
 * NEITHER (#352). The turn is over, and a label naming who holds it names nobody:
 * a closed issue cannot be replied to through the machinery, so the waiting side
 * reads as a request nobody can act on, and the running side outlives the work it
 * describes. This takes back half of #223's rule — that label deliberately stayed
 * on a closed node as the filter of work that stopped there — because the filter
 * caught the person's eye as a live question on work that was over (#348, #335,
 * #338 on the pull-request side, #342 on the issue side); the thread tells that
 * story instead.
 *
 * The close is enforced here, at the one function every label writer calls, rather
 * than at each caller: a run that merges its own pull request and ends, a hand-off
 * refused because the target closed, the watch healing a run that died after its
 * node closed — all of them arrive here carrying a phase the node has already left.
 * The state is read, not assumed; the writers that run AFTER a close are exactly
 * the ones whose phase knowledge is stale. The readers that name `closed` directly
 * (the close-event strips and the runner's end-of-run strip) make the same read,
 * for a different half: the state names nothing new to them, but it names what the
 * node is wearing, and the removals take only what is on — so a strip that fires
 * on a node with neither label makes no write at all, and the repository's
 * unlabeled closes stay silent.
 *
 * Best effort throughout, like every label write: the thread is the turn's record
 * and the labels are its cache. Every failure is a warning naming what was lost.
 */
import { gh } from "../../../adapters/github/gh.ts";
import { getLabel } from "../../../adapters/runner/config.ts";
import { readTargetState } from "../../../adapters/github/target-state.ts";

export type TurnLabelPhase =
  /** A run took the turn: `in-progress` on, `waiting-for-person` off. */
  | "running"
  /** The turn came back to a person: `in-progress` off, `waiting-for-person` on. */
  | "with-person"
  /** The node is closed (#352): both come off, neither goes on. */
  | "closed";

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

  // What the node is wearing, from the same read that answers whether it is still
  // open. A caller that could not read it removes unconditionally, the way every
  // caller did before #352: a failed read is not an answer, and the release still
  // has to take its guard down. The window between this read and the removal is
  // the same best-effort window every label write here has always had.
  const state = readTargetState(number, repo);
  const present = state.known ? new Set(state.labels ?? []) : undefined;
  const remove = (label: string) => {
    if (present !== undefined && !present.has(label)) return;
    const removed = edit("--remove-label", label);
    if (removed.code !== 0) console.error(`::warning::could not remove '${label}' from #${number}`);
  };

  // A caller that arrived here after the node closed — a release following its own
  // merge, a refusal aimed at a closed target — has its phase bent to `closed`
  // (#352). A caller that could not read the state is not told the node is open:
  // it keeps the phase it brought, the pre-#352 behavior, rather than guessing.
  let effective = phase;
  if (phase !== "closed") {
    if (!state.known) {
      console.error(`::warning::could not read #${number}'s state (${state.why}); applying '${phase}' labels without the closed guard`);
    } else if (state.state !== "open") {
      console.error(`#${number} is closed; the turn labels come off and neither goes on (#352)`);
      effective = "closed";
    }
  }

  if (effective === "closed") {
    remove(waitingForPerson);
    remove(inProgress);
    return;
  }

  if (effective === "running") {
    create(inProgress, "0366d6", "Issue is being worked on by an Atomaton agent");
    const added = edit("--add-label", inProgress);
    if (added.code !== 0) console.error(`::warning::could not add '${inProgress}' to #${number}`);
    remove(waitingForPerson);
    return;
  }

  create(waitingForPerson, "fbca04", "The turn is with a person on this issue or pull request");
  remove(inProgress);
  const added = edit("--add-label", waitingForPerson);
  if (added.code !== 0) console.error(`::warning::could not add '${waitingForPerson}' to #${number}`);
}
