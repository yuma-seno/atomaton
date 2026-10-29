#!/usr/bin/env bun
/**
 * notify_limit_reached.ts — Post a "the run reached its limit" comment on an
 * issue/PR, mentioning the notify login when known.
 *
 * ## The fallback, not the first word
 *
 * `post_result_comment.ts` posts the run's ending comment and already says the run
 * stopped and how to continue — including the mention, and the tool tally on its
 * footer. The runner asks that comment whether it named the person (its `notified`
 * output) and runs this notice only when it did not: when the comment was skipped,
 * when nobody is configured to mention, and when the mention was silenced by design
 * (a closed sub-issue). This used to run on every limit, so the common case was two
 * comments and two notifications for one event.
 *
 * ## What it carries, and what it does not
 *
 * One sentence: which agent, how it stopped, and the command that retries it. That is
 * the part a person acts on, and it is the whole reason this exists where the report
 * does not reach them — a run cut off before its final turn has a report to salvage,
 * and a failure has none at all.
 *
 * The tally is NOT here. It is computed once, by `post_result_comment.ts`, and written
 * on that comment's footer: two scripts reading the same session to say the same thing
 * is the duplication this repository keeps deleting, and the copy that drifted would
 * be this one, on the path nobody reads. The cost is stated rather than hidden: on the
 * failure path where no result comment is posted, the tally is not on the thread at
 * all. The sentence above still is.
 *
 * Usage: notify_limit_reached.ts --number N --agent AGENT [--notify LOGIN] [--ended-because runtime|iterations|loop]
 */
import { parseArgs } from "node:util";
import { gh } from "../../adapters/github/gh.ts";
import { LLM_CONTEXT_TAG } from "../../adapters/github/tags.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface NotifyLimitReachedArgs {
  number: string | number;
  agent: string;
  notify?: string;
  /**
   * How the core says the run ended: `runtime`, `iterations`, or `loop`.
   *
   * The three are one event to the caller -- the run stopped itself and a person has
   * to decide whether to retry -- and three different sentences here, because what a
   * person does next differs. A run that looped is the one where retrying is most
   * likely to work, and saying "ran out of time" about it would send them to re-scope
   * a task that was never too big.
   */
  "ended-because"?: string;
}

export const ref = defineScript<NotifyLimitReachedArgs>(import.meta.url);

/** What the run did, in the words for the person reading the comment. */
function howItStopped(endedBecause: string | undefined): string {
  if (endedBecause === "loop") return "got stuck repeating itself";
  return endedBecause === "iterations" ? "ran out of iterations" : "ran out of time";
}

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      number: { type: "string" },
      agent: { type: "string" },
      notify: { type: "string" },
      "ended-because": { type: "string" },
    },
  });

  if (!values.number || !values.agent) {
    console.error("usage: notify_limit_reached.ts --number N --agent AGENT [--notify LOGIN]");
    process.exit(2);
  }

  // Tagged out of the model's context. This is addressed to a person -- it names
  // one, and asks them to retry -- and the next run can do nothing with it but
  // carry it.
  //
  // Carrying it is not free. Measured: three failed runs left a session of
  // 425 messages, and the fourth spent 348k prompt tokens over four iterations and
  // then gave up without following its instructions. The same instructions on a
  // fresh issue took 61k and completed. Failure notices are part of what filled
  // that up, and the direction is the wrong one -- failing makes the context
  // heavier, and a heavier context fails more.
  const stopped = howItStopped(values["ended-because"]);
  const notice = values.notify
    ? `@${values.notify} Atomaton: \`${values.agent}\` ${stopped}. Review the issue and comment \`/${values.agent}\` to retry.`
    : `Atomaton: \`${values.agent}\` ${stopped}. Comment \`/${values.agent}\` to retry.`;

  // Not a turn comment, deliberately: on this path `post_result_comment` has already
  // posted the run's report and written the ending (`limit`), and that is what answers
  // "whose turn is this node". A second ending here would say the same thing twice, and
  // a second `ENDED_TAG` is a lie about how many turns ended. This is a notice ABOUT the
  // ending, and the one thing on it is the sentence a person acts on.
  gh("issue", "comment", values.number, "--body", `${LLM_CONTEXT_TAG.write("exclude")}\n${notice}`);
}

if (import.meta.main) main();
