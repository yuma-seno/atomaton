#!/usr/bin/env bun
/**
 * manage_dispatch_loop.ts — decide whether the agent chain has gone on long
 * enough to stop and ask a person.
 *
 * The I/O half. Every decision is in `domain/work/dispatch-chain.ts`, which explains
 * why this counts comments instead of keeping a counter -- briefly: the counter it
 * used to keep could not reach 1, because the reset fired on any new event and
 * every run posts a result comment.
 *
 * Usage:
 *   manage_dispatch_loop.ts --number 123 [--repo owner/name]
 *
 * Writes `auto_dispatch_count=N`, `loop_limit_reached=true|false`,
 * `handoff_limit=N`, `runs_without_change=N` and `stop_reason=<sentence>` to
 * $GITHUB_OUTPUT. The first two names are unchanged so the workflow's guards and
 * `decide_turn_ending`'s input keep working.
 *
 * `loop_limit_reached` now covers two limits: consecutive handoffs and
 * consecutive runs that changed nothing. One guard, because the workflow's
 * response to both is the same -- withhold the handoff and tell a person -- and
 * `stop_reason` is what makes the message say which.
 *
 * No longer takes `--session`. Nothing is written back: the tally is derived, so
 * there is nothing to persist and nothing for a stale session to contradict. Old
 * sessions still carry `metadata.github_context.auto_dispatch_count`; it is dead
 * and nothing reads it.
 */
import { appendFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { handoffsSincePerson, resolveHandoffLimit, type ChainComment } from "../../domain/work/dispatch-chain.ts";
import { resolveNoProgressLimit, runsWithoutChange, stopReason } from "../../domain/work/progress.ts";
import { getHandoffLimit, getNoProgressLimit } from "../../adapters/runner/config.ts";
import { listComments } from "../../adapters/github/thread.ts";
import { CHANGED_TAG, isResultComment } from "../../adapters/github/tags.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface ManageDispatchLoopArgs {
  number: string | number;
  repo?: string;
}

export const ref = defineScript<ManageDispatchLoopArgs>(import.meta.url);

/**
 * The target's comments, oldest first, reduced to what the decision reads.
 *
 * `--paginate` (inside the shared `listComments`) because a long-running issue passes
 * 100 comments, and the tally is read from the END of the list: a truncated read would
 * silently drop the recent handoffs, which are the only ones that matter.
 *
 * A failed read returns an empty list, which counts zero handoffs and lets the
 * chain continue. That is the wrong direction for a safety limit, and it is
 * deliberate: this bounds a loop that wastes model runs, and refusing to hand off
 * because GitHub was briefly unreachable would stop work that is going fine. The
 * caller logs it so a run that could not check says so. The projection to
 * `ChainComment` is this caller's; the pages are the reader's.
 */
function readComments(repo: string, number: string): { comments: ChainComment[]; read: boolean } {
  try {
    return {
      comments: listComments(repo, number).map((comment) => ({ authorType: comment.user?.type, body: comment.body ?? "" })),
      read: true,
    };
  } catch {
    return { comments: [], read: false };
  }
}

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      number: { type: "string" },
      repo: { type: "string" },
    },
  });

  const number = values.number ?? "";
  const repo = values.repo ?? process.env.GITHUB_REPOSITORY ?? "";
  if (!number || !repo) {
    console.error("usage: manage_dispatch_loop.ts --number N [--repo owner/name]");
    process.exit(2);
  }

  const limit = resolveHandoffLimit(getHandoffLimit());
  const noProgressLimit = resolveNoProgressLimit(getNoProgressLimit());
  const { comments, read } = readComments(repo, number);
  if (!read) console.error(`WARN could not read comments on ${repo}#${number}; treating the chain as fresh`);

  // `isResultComment` is where the three shapes that look like a result comment from
  // the outside are sorted out (#354): a quotation of one, a body inside a fenced
  // sample, and a `waiting` ending — the run parked on work UNDER the node, which is a
  // decomposition progressing rather than one agent handing the node to the next. The
  // domain stays pure; the tag rules are composed into the reader there, which is where
  // the raw bodies' vocabulary lives.
  const handoffs = handoffsSincePerson(comments, isResultComment);
  // A result comment that says it changed nothing. Both halves: the result tag says it
  // is a result comment at all, and the changed tag says what the run did. A comment
  // from before this tag existed has no `changed` value and is read as something else,
  // which ends the walk -- old threads count zero rather than guessing.
  const stalled = runsWithoutChange(
    comments,
    (body) => isResultComment(body) && CHANGED_TAG.readProse(body) === "no",
  );
  const decision = stopReason({
    handoffs,
    handoffLimit: limit,
    runsWithoutChange: stalled,
    noProgressLimit,
  });

  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    // The limits travel with the counts, and now so does the sentence. The
    // escalation comment used to build its own from the handoff count whatever the
    // reason -- with a second limit beside it, that comment would have told a person
    // their chain was too long when it was not.
    appendFileSync(
      githubOutput,
      `auto_dispatch_count=${handoffs}\n` +
        `loop_limit_reached=${decision.stop}\n` +
        `handoff_limit=${limit}\n` +
        `runs_without_change=${stalled}\n` +
        `stop_reason=${decision.reason ?? ""}\n`,
    );
  }
  console.error(
    `Agent handoffs since a person last commented: ${handoffs}/${limit}; ` +
      `consecutive runs that changed nothing: ${stalled}/${noProgressLimit} (stop=${decision.stop})`,
  );
}

if (import.meta.main) main();
