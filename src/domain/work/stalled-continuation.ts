/**
 * stalled-continuation.ts — whether a run that ended on a text-only turn, changed
 * nothing and called nobody should be asked, once, for one more turn.
 *
 * # The two observed shapes
 *
 * #467 fixed a run that ended on the sentence introducing its next step — "Now the
 * tests:", "Committing, then a push:" — by re-asking when the final message ended on
 * a colon. Two more runs ended the same way with a full stop:
 *
 *   - "The test fails on exactly the defect the reviewer found. Running the full
 *     suite."
 *   - "CI was green on the pushed commit, but that's not the whole answer. Let me
 *     check what's actually on the branch."
 *
 * Both reported `completed` / `changed=no`, and the work the sentence announced was
 * never done. The punctuation was never the signal; it was one cheap way to see the
 * shape. The signal is that the run ended a text-only turn having changed nothing.
 *
 * # Why each condition is there
 *
 *   - `completed`: a run stopped by a person, a clock or a provider is not one to
 *     ask again — it was cut off, and asking it to finish would ignore whoever
 *     stopped it.
 *   - `!lastTurnCalledTools`: a session-ending tool leaves its call as the last
 *     assistant message while the core still records `completed`. That call was the
 *     run's ending, not a sentence that stopped short.
 *   - `!changed`: a run that pushed, opened a pull request or merged one already
 *     did something; there is no announced step to recover.
 *   - `!calledSomeone`: a closing message that names an agent or a person has handed
 *     the work on. That is a finished turn, and re-running it could post the same
 *     review or dispatch twice.
 *
 * # The cost, and why it is accepted
 *
 * A run that investigated and legitimately concluded "nothing needs changing" also
 * has all four properties, so it pays one extra turn. The note makes that turn cheap
 * and gives it a way out: say what the grounds are and stop. One turn against the
 * work a premature stop loses, and `read_run_ending.ts` already reads that loss off
 * the session when it happens.
 */
export interface StalledRunFacts {
  /** The core's `ended_because` for the run that just finished. */
  endedBecause: string | undefined;
  /** Whether the last assistant message carried tool calls. */
  lastTurnCalledTools: boolean;
  /** Whether the ops log recorded a commit, pull request or merge. */
  changed: boolean;
  /** Whether the closing message named an agent or a person. */
  calledSomeone: boolean;
}

export function shouldAskToContinue(facts: StalledRunFacts): boolean {
  return (
    facts.endedBecause === "completed" &&
    !facts.lastTurnCalledTools &&
    !facts.changed &&
    !facts.calledSomeone
  );
}

/**
 * The note a stalled run is handed before its one extra turn.
 *
 * It says what ended the run and what was not done, then names both ways out: make
 * the call the sentence announced, or state why no change is needed. The last line
 * is the one failure this is for, written as a rule the run can keep rather than as
 * a description of what went wrong.
 */
export function stalledContinuationMessage(): string {
  return `Your last message ended the run, and this run changed nothing: no commit was pushed, and no pull request was opened or merged.

A message that calls no tool ends the run, so a step your message announced never happened. If work remains, make that tool call now.

If the run is complete without a change -- you investigated and nothing needs editing -- say so and give the grounds: that is a finished report. Do not end on a sentence that introduces a next step.`;
}
