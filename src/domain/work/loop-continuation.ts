/**
 * loop-continuation.ts — what a run the loop guard stopped is told, and what its
 * comment says when it got no second turn.
 *
 * # The abort, and who had the facts
 *
 * A run that calls one tool with the same arguments, gets the same answer back and
 * does it again is stopped by atoma's loop guard. The guard is right, and since
 * v0.6.0 the abort is typed: the last `atoma_runs` entry carries a `loop_abort`
 * verdict naming the rule, the tool, the arguments, how many times it repeated, and
 * whether the answer was cut by the output cap.
 *
 * Recovering from that used to be a person's job — read the log, work out which file
 * was being re-read, write a scoped instruction, comment again. The run had every one
 * of those facts the whole time. So the same one-second-turn machinery the other two
 * premature endings are offered is offered here, and this is the note it is handed.
 *
 * # The verdict is the signal, not the ending word
 *
 * atoma records this abort under `ended_because: "failed"`, not `loop`: its
 * `soft_stop_ending` maps only `Repetition`, a different guard that watches the
 * model's own output, so a tool-loop abort comes back as an ordinary failure with a
 * verdict attached. Detection here keyed on the word first and therefore found
 * nothing on any real run — the second turn and the comment section were both
 * skipped while the verdict sat in the session unread (#610).
 *
 * So `loop_abort` is what is read, and `ended_because` is not consulted at all. It is
 * the fact the core actually writes, it is unambiguous about what stopped the run,
 * and the day the core gives this abort an ending word of its own this keeps working.
 *
 * # Why each rule is worded separately
 *
 * `identical_answers` is the one everybody means by "loop": the same answer came
 * back, so re-reading cannot produce anything new. `empty_results` and
 * `identical_failures` are not that — nothing came back, or the same error came
 * back — and a note telling the run its answer was already above would be
 * describing a fact that is not true of it. `cycle` is a run of calls coming back
 * round to where it started, where no single answer repeated at all. `last_error` is the tool's own sentence about the
 * failure, quoted rather than paraphrased.
 *
 * # Why there is no `changed` test
 *
 * `stalled-continuation.ts` refuses to ask a run that already committed, because a
 * run that did something has no announced step to recover. Here the opposite is the
 * ordinary shape: the run pushes or opens its pull request and then loops while
 * re-reading a file before the report, and the extra turn is what turns that into a
 * comment a person can read. A run that handed the work on is not reachable here
 * either — the guard fires on a tool call, and a message that calls somebody called
 * no tool.
 *
 * # The session written by an older binary
 *
 * `loop_abort` arrives with atoma v0.6.0. A session written by anything older records
 * no verdict at all, and `loopAbortFromSession` answers `undefined` for it, so the run
 * is treated exactly as it is today — whichever word its ending carries.
 */
import type { Session } from "./session.ts";

/**
 * The verdict atoma's loop guard records, as this reader needs it.
 *
 * The object a run entry carries when the guard stopped it. `ended_because` is not
 * part of this and is not read beside it: the entry this arrives on says `failed`, so
 * the word is not the signal — see the module comment for why.
 *
 * A projection, not the wire shape: `call` — the index of the tool call the verdict
 * was reached on — is recorded and not read, because the note names the call rather
 * than counting to it, and a field nothing reads is a field a reader has to check. What
 * is kept is what the note and the comment say, so the two of them can never disagree
 * with what was recorded.
 */
export interface LoopAbort {
  /**
   * `identical_answers`, `cycle`, `empty_results` or `identical_failures` — the
   * snake_case wire values of atoma's `LoopRule`.
   */
  rule: string;
  /** The tool that repeated. */
  tool: string;
  /** Its arguments, as one line. */
  arguments: string;
  /** How many times it repeated. */
  count: number;
  /** Whether the answer was cut off by the per-server output cap. */
  capped: boolean;
  /** The tool's own sentence about the failure, for `identical_failures`. */
  lastError?: string;
}

/**
 * The verdict, when this run was stopped by the loop guard.
 *
 * `undefined` is every other case: an ordinary ending, and the one a pin has to allow
 * for — a session written by a binary before v0.6.0, which records no verdict
 * whichever word its ending carries.
 *
 * The last entry only, because a session is resumed and an earlier run's verdict is
 * not this run's ending. A run that was stopped by the guard and then finished on its
 * second turn has a later entry without one, and reads as the finished run it is.
 */
export function loopAbortFromSession(session: Session | undefined): LoopAbort | undefined {
  const runs = session?.atoma_runs;
  if (!Array.isArray(runs) || runs.length === 0) return undefined;
  const last = runs[runs.length - 1] as { loop_abort?: unknown };
  const recorded = last?.loop_abort;
  if (typeof recorded !== "object" || recorded === null) return undefined;
  const verdict = recorded as Record<string, unknown>;
  if (typeof verdict.rule !== "string" || verdict.rule === "") return undefined;
  return {
    rule: verdict.rule,
    tool: typeof verdict.tool === "string" ? verdict.tool : "",
    arguments: typeof verdict.arguments === "string" ? verdict.arguments : "",
    count: typeof verdict.count === "number" ? verdict.count : 0,
    capped: verdict.capped === true,
    lastError: typeof verdict.last_error === "string" && verdict.last_error !== "" ? verdict.last_error : undefined,
  };
}

/** `4 times in a row`, or the words that fit a count worth no number. */
function times(count: number): string {
  return count > 1 ? `${count} times in a row` : "over and over";
}

/**
 * What repeated, in the rule's own terms.
 *
 * Shared by the note and by the comment section so one fact is written once: a rule
 * described as "the same answer came back" in one place and "returned nothing" in the
 * other would be two accounts of one verdict.
 *
 * The arguments are deliberately not in here. They are their own line in both
 * readers, because one call's arguments can be a whole shell command and burying that
 * in a sentence makes the sentence unreadable and the arguments unquotable.
 */
export function repeatedCallSentence(abort: LoopAbort): string {
  const call = abort.tool === "" ? "a tool" : `\`${abort.tool}\``;
  const count = times(abort.count);
  switch (abort.rule) {
    case "identical_answers":
      return `it called ${call} ${count} and got the same answer back every time`;
    case "empty_results":
      return `it called ${call} ${count} and every call returned nothing`;
    case "identical_failures":
      return `it called ${call} ${count} and every call failed the same way`;
    case "cycle":
      return `the same calls, starting with ${call}, came round in a circle ${count}`;
    // A rule this reader does not know, which a newer core may add. It names the rule
    // and claims nothing else: describing an unknown rule as one of the four above is
    // the one thing this note must not do, because the run would act on a false fact.
    default:
      return `it called ${call} ${count} and repeating it got no further (\`${abort.rule}\`)`;
  }
}

/** The line of arguments both readers show, or nothing when the verdict carried none. */
export function repeatedArguments(abort: LoopAbort): string | undefined {
  return abort.arguments === "" ? undefined : abort.arguments;
}

/**
 * The note a loop-stopped run is handed before its one extra turn.
 *
 * It names the call, its arguments and the count, says in the rule's own words what
 * repeating it produced, and then names the way out: write the closing report or
 * verdict from what is already in hand. The cap gets its own paragraph because it
 * changes what "in hand" means — part of the answer was never delivered, so the run
 * has to work around it or change approach rather than read harder.
 */
export function loopContinuationMessage(abort: LoopAbort): string {
  const parts = [`Your run was stopped by the loop guard: ${repeatedCallSentence(abort)}.`];
  const argumentsItRepeated = repeatedArguments(abort);
  if (argumentsItRepeated !== undefined) parts.push(`The arguments it repeated were \`${argumentsItRepeated}\`.`);
  if (abort.capped) {
    parts.push(
      "The answer was also cut off by the output cap, so calling it again cannot reach what was cut. Work from what is there, or change the approach.",
    );
  }
  if (abort.lastError !== undefined) parts.push(`The failure it reported was:\n\n${abort.lastError}`);
  parts.push(nextStep(abort));
  return parts.join("\n\n");
}

/** What to do instead of the call that repeated, per rule. */
function nextStep(abort: LoopAbort): string {
  switch (abort.rule) {
    case "identical_answers":
      return "That answer is already in this session above, so reading it again returns the same text. Use what is in hand: write the closing report, verdict or commit from what you have already read, or take the step that reading was for. Do not call it again.";
    case "empty_results":
      return "Calling it again returns nothing again. Either it is the wrong tool for what you are after, or what you are after is not there — answer from what the other calls already gave you, and write the closing report or the verdict now.";
    case "identical_failures":
      return "It will fail the same way again. Fix what the error names, reach for a different tool, or write the closing report and say what you could not do.";
    case "cycle":
      return "Each round is the same work over again, so repeating the calls cannot get past it. Take the next step the cycle was circling: write the closing report or the verdict from what is in hand.";
    default:
      return "Repeating it will not move the run on. Work from what is in hand, and write the closing report or the verdict next.";
  }
}

/**
 * The section a result comment carries for a run the loop guard stopped.
 *
 * A run that never got its second turn, or that spent it on nothing, still tells the
 * person which call repeated without them opening the log. The blockquote is the
 * shape the other warnings on this comment already use, and it is a new section
 * rather than a restyle of the notice beside it.
 */
export function loopAbortLines(abort: LoopAbort): string[] {
  const lines = ["> [!WARNING]", `> The loop guard stopped this run: ${repeatedCallSentence(abort)}.`];
  const argumentsItRepeated = repeatedArguments(abort);
  if (argumentsItRepeated !== undefined) lines.push(`> The arguments it repeated were \`${argumentsItRepeated}\`.`);
  if (abort.capped) {
    lines.push("> The answer was cut off by the output cap, so repeating the call cannot reach what was cut.");
  }
  // Every line quoted, because a tool's error is often several: an unprefixed one
  // would fall out of the blockquote and read as the comment's own words.
  if (abort.lastError !== undefined) {
    lines.push("> It said:", ...abort.lastError.split("\n").map((line) => `> ${line}`));
  }
  return lines;
}
