/**
 * control-commands.ts — the commands that act on the machinery instead of starting
 * a run.
 *
 * ## Why they have their own sigil
 *
 * An agent command asks a person-class worker to start work: `/engineer`. A control
 * command does not start anything — it acts on the state of the machine: stop a run,
 * resume one, upgrade the template. Some `/name` for the second kind read as a call
 * for an agent named `stop`, which is exactly what they are NOT, and the shared
 * syntax also competed with GitHub's own comment-box behaviour (a leading `/` opens
 * the saved-reply autocomplete under the person's fingers).
 *
 * So the two kinds carry different sigils: `/name` asks, `!name` commands. The bang
 * is the one ordinary symbol that survives a GitHub comment untouched — an image
 * needs `![`, a mention needs `@`, emphasis needs `*` or `_`, and a command is
 * anchored to a line with the word immediately after the sigil, so none of those
 * shapes can collide with it. `!stop` also reads as what it is: an imperative.
 *
 * The slash form of the two original control commands (`/stop`, `/resume`) is still
 * read, for the notices and receipts older runs left in live threads. Everything the
 * machinery GENERATES prefers `!`. The reservation of these names in the agent
 * namespace (see `deliverable-integrity.ts`) stays while the legacy form is read.
 *
 * ## What they mean
 *
 * `!stop` asks the run currently executing on this issue/PR to stop at its next turn
 * and save its session. It is not a cancel: a cancelled job never reaches the step
 * that writes the session, so cancelling would silently mean discarding.
 *
 * `!resume` starts the same agent again on the saved session, carrying no
 * instruction. That is the whole difference from `/<agent>`, which also resumes the
 * session but lets the person put an instruction on the following lines — which is
 * why `!resume` deliberately refuses one rather than accepting and ignoring it.
 *
 * `!upgrade` takes a newer template release onto this repository — the one command
 * that acts on the deployment rather than on a run. See the update workflow.
 *
 * Neither stop nor resume is a state. A stopped run has ended and handed back to a
 * person, which is the same terminal state as an agent that finished its turn, ran
 * out of time, or hit the handoff limit — `domain/work/turn.ts` tells them apart by
 * name and treats all of them alike when it comes to the guard, and a stop joins
 * them rather than adding a fourth. This is why there is no `paused` label: "nothing
 * is executing here" is already said by the in-progress label being gone.
 */

/** Every control command, as it is typed after the bang. */
export const CONTROL_COMMAND_NAMES = ["stop", "resume", "upgrade"] as const;

export type ControlCommand = (typeof CONTROL_COMMAND_NAMES)[number] | "";

/** Whether `name` is a control command rather than an agent name. */
export function isControlCommand(name: string): name is (typeof CONTROL_COMMAND_NAMES)[number] {
  return (CONTROL_COMMAND_NAMES as readonly string[]).includes(name);
}

/** The spelling this machinery itself writes when it names the command. */
export function controlLabel(name: (typeof CONTROL_COMMAND_NAMES)[number] | ""): string {
  return name ? `!${name}` : "";
}
