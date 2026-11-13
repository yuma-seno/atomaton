#!/usr/bin/env bun
/**
 * stop_on_pr_close.ts — closing a pull request an agent is working on asks that run to
 * stop, the way closing its issue already does.
 *
 * ## Why a pull request's close has to mean something
 *
 * A run was reviewing a pull request when the pull request merged. The merge reached
 * nothing: the run kept going for another nine minutes and stopped only when an unrelated
 * issue was closed, which reached it through the issue path. The structure was right and
 * the coverage was not — `issues: closed` stops a run, and `pull_request_target: closed`
 * did not, for either outcome (merged or closed unmerged).
 *
 * ## The mechanism is the existing one
 *
 * No second stop path. `STOP_TAG` in a comment, polled for by the running job, is the only
 * way anything outside a job reaches it — `/stop` and the issue close both work that way.
 * This is one more writer of the same tag.
 *
 * ## Why the gate is the claim, and not `runInFlight`
 *
 * Whether a run is in flight here is asked of the thread's open CLAIM
 * (`openClaimStopState`), not of `work-tree.ts`'s `runningOn`. That reader is right for
 * the tree and wrong for this: it is handed `merged`, and a merged pull request answers
 * "no run" by design (#449) — nothing can ever be started on one, so the "a request is
 * the newest word" half stops being evidence. That is exactly the node this has to reach:
 * the reviewer that merged its own pull request and is still watching its own thread. The
 * claim is written by a run that actually started, and a merge cannot invalidate it.
 *
 * ## Why a bot is not refused here, unlike an issue's close
 *
 * `stop_on_close.ts` no-ops a bot's close because an agent closing its own issue is how it
 * finishes, and stopping that run would cut it off mid-wrap-up. A pull request is the
 * other case: closing one is never how a run ends its own work. And there is nothing to
 * sift — a bot's merge or close raises no `pull_request_target` cascade at all (the header
 * of `atomaton-pr-closed.wac.ts` records that), so the event structure already answers
 * what the issue path's caller has to pass in.
 *
 * ## Why a stop that is already there is not repeated
 *
 * A close can reach the same run twice within a few seconds: this job, and an issue
 * close's subtree propagation, which posts its own tag on any node that is running. The
 * second write would be a second comment saying the same thing, so the thread is read
 * before it is written and a stop newer than the claim suppresses the write. A stop OLDER
 * than the claim is ignored by the watcher (it honours only what arrived after it started
 * watching) and so suppresses nothing.
 *
 * What that cannot cover is the propagation arriving AFTER this write — it has no gate of
 * its own. The cost is one duplicate comment; the watcher stops on the first one, so the
 * run behaves the same either way.
 *
 * Usage:
 *   stop_on_pr_close.ts --number N --merged true|false
 */
import { parseArgs } from "node:util";
import { LLM_CONTEXT_TAG, STOP_TAG } from "../../adapters/github/tags.ts";
import { openClaimStopState } from "../../adapters/github/thread.ts";
import { commentOnDetailed } from "../../adapters/github/work-tree.ts";
import { looksTransient } from "../../adapters/github/gh.ts";
import { stopOnPullRequestCloseNotice } from "../../domain/work/closed-target.ts";
import { isTrue } from "./lib/flags.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface StopOnPrCloseArgs {
  number: string | number;
  /** `true` when the close was a merge. Both outcomes of `closed` are a close. */
  merged: string | boolean;
}

export const ref = defineScript<StopOnPrCloseArgs>(import.meta.url);

/**
 * The whole comment, tags included.
 *
 * `STOP_TAG` is what the running job reads; `LLM_CONTEXT_TAG` keeps this out of the next
 * session, for the same reason `/stop`'s own notice is excluded — it is addressed to a
 * person, and an agent reading it would take it as something it was told.
 */
export function stopOnPrCloseBody(args: { number: number; merged: boolean }): string {
  return [
    LLM_CONTEXT_TAG.write("exclude"),
    STOP_TAG.write("requested"),
    stopOnPullRequestCloseNotice(args.number, args.merged),
  ].join("\n");
}

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      number: { type: "string" },
      merged: { type: "string" },
    },
  });

  if (!values.number) {
    console.error("usage: stop_on_pr_close.ts --number N --merged true|false");
    process.exit(2);
  }

  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const number = Number(values.number);
  const merged = isTrue(String(values.merged ?? ""));

  // A failed read is not "nothing is running" — the rule `guard_comment_during_run.ts`
  // follows for the same reason: the answer this could not determine must not be the one
  // that stays quiet.
  let state: { claimed: boolean; requested: boolean };
  try {
    state = openClaimStopState(repo, number);
  } catch (e) {
    console.error(`::error::Could not read the thread on #${number}: ${(e as Error).message}`);
    process.exit(1);
  }

  if (!state.claimed) {
    console.error(`No run is holding #${number}, so nothing here has to be stopped.`);
    return;
  }
  if (state.requested) {
    console.error(`#${number} has already been asked to stop since the run claimed it. Nothing to add.`);
    return;
  }

  // Fatal when it does not land: this comment IS the stop. Without it the run polls, finds
  // nothing, and keeps going — while the person who merged has every reason to believe it
  // is winding down.
  //
  // One retry, and only behind a re-read. The write here either landed or did not, and
  // a 5xx says only that GitHub did not confirm it — retrying blind could post the stop
  // twice, and the second is a second comment saying the same thing on a thread the
  // run is polling. So a failed post re-reads the claim state first: a stop newer than
  // the claim (ours, landed despite the error, or somebody else's) means the run will
  // stop either way and the retry is skipped; a transient-shaped failure gets its one
  // retry; anything else fails with GitHub's own words, which is the part this script
  // used to throw away -- `commentOn` answered only "did it land", and the #536 close
  // failed as `Could not post the stop request` with no cause attached.
  let posted = commentOnDetailed(repo, number, stopOnPrCloseBody({ number, merged }));
  if (!posted.ok) {
    let state2;
    try {
      state2 = openClaimStopState(repo, number);
    } catch (e) {
      console.error(`::error::Could not re-read the thread on #${number} after a failed stop post: ${(e as Error).message}`);
      process.exit(1);
    }
    if (state2.requested) {
      console.error(`#${number} has a stop newer than its claim, so the run will stop despite the failed post.`);
      return;
    }
    if (looksTransient({ code: 1, stdout: posted.stdout, stderr: posted.stderr })) {
      console.error(`::warning::the stop post failed transiently, retrying once: ${posted.stderr || posted.stdout}`);
      posted = commentOnDetailed(repo, number, stopOnPrCloseBody({ number, merged }));
    }
  }
  if (!posted.ok) {
    console.error(`::error::Could not post the stop request on #${number}: ${posted.stderr || posted.stdout}`);
    process.exit(1);
  }

  console.error(`#${number} was ${merged ? "merged" : "closed"} while a run held it. The run has been asked to stop.`);
}

if (import.meta.main) main();
