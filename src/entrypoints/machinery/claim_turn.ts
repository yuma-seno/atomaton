#!/usr/bin/env bun
/**
 * claim_turn.ts — claim the turn: which run took up which ask (#285).
 *
 * The runner writes one comment at start —
 *
 *     <!-- atomaton:llm-context=exclude -->
 *     <!-- atomaton:took=<ask comment id> run=<run id> -->
 *
 * — and that comment is the turn's identity from the taking side. The run watch
 * compares it against the endings by run id ("did THIS run take a turn", "did THIS
 * run report"), and the guard's shaping reads it as the ball being with an agent.
 * What the claim replaces is estimation: a marker or a command inside a run's
 * lifetime used to be attributed by timestamp, and two runs close together were
 * attributed to the wrong one — #281's both halves.
 *
 * ## The race, and why it cannot happen here
 *
 * Two runs reaching for one ask is a dispatch-level failure (the ordering check or
 * the ask check should have stopped the second dispatch), so this is defence in
 * depth — but it is depth that cannot itself race, because the runner runs under
 * `atomaton-<type>-<number>` concurrency with `cancel-in-progress: false`: two runs
 * on one node are serialised, so the second claims only after the first has
 * finished. The check still runs, because queues are exactly when identity
 * mistakes are made: post the claim, wait until the listing shows it (GitHub does
 * not guarantee read-after-write — the same instrument `postDispatchMarker` runs),
 * then read the thread again and look for ANOTHER claim on the same ask with a
 * smaller comment id. Found one, this run backs off: it deletes its own claim and
 * writes `claimed=false`, and the workflow steps that would take the turn are
 * gated off it. The other run — its claim is older — holds the turn, and a backed
 * off run leaves no ending, because it took no turn the thread names.
 *
 * ## The exit code
 *
 * A claim GitHub refused is a machinery failure and exits non-zero: the run would
 * otherwise work without its identity on the thread, which is the state every
 * later comparison misreads. A backed-off claim is `0` — the back-off is the
 * correct outcome, not a fault — and the job goes green having done nothing,
 * which is what losing a race looks like.
 *
 * Usage:
 *   claim_turn.ts --number N --ask ID --run-id ID [--repo R]
 * Writes `claimed=true|false` to $GITHUB_OUTPUT.
 */
import { parseArgs } from "node:util";
import { gh, ghRead, splitConcatenatedJson } from "../../adapters/github/gh.ts";
import { LLM_CONTEXT_TAG, TOOK_TAG } from "../../adapters/github/tags.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface ClaimTurnArgs {
  number: string | number;
  /** The ask comment id this run takes up; empty for a run whose ask is the body. */
  ask?: string;
  "run-id"?: string;
  repo?: string;
}

export const ref = defineScript<ClaimTurnArgs>(import.meta.url);

/** Delays between reads while waiting for the listing to show the claim. */
const READ_DELAYS_MS = [1_000, 2_000, 4_000];

/** Every comment on the node, oldest first, as the race check reads them. */
function listBodies(repo: string, number: number): { id: number; body: string }[] {
  const listed = ghRead("api", `repos/${repo}/issues/${number}/comments`, "--paginate", "--jq", ".");
  if (listed.code !== 0) throw new Error(`could not read #${number}'s comments: ${listed.stderr || listed.stdout}`);
  const comments: { id: number; body: string }[] = [];
  for (const page of splitConcatenatedJson(listed.stdout || "[]")) {
    if (!Array.isArray(page)) continue;
    for (const entry of page as { id?: number; body?: string }[]) {
      if (typeof entry.id === "number") comments.push({ id: entry.id, body: entry.body ?? "" });
    }
  }
  return comments;
}

export function claimCommentBody(args: { ask: number; run: number }): string {
  return [LLM_CONTEXT_TAG.write("exclude"), TOOK_TAG.write(args)].join("\n");
}

/**
 * Whether this run holds the turn for its ask: the claim is posted, visible, and
 * no older claim on the same ask exists.
 *
 * Split out of `main` so the read-after-write and the id comparison are testable
 * without GitHub: the caller hands in the comments as they stand and the id the
 * run's own claim carries.
 */
export function raceOutcome(
  comments: readonly { id: number; body: string }[],
  mine: { id: number; ask: number },
): "held" | "backed-off" {
  for (const comment of comments) {
    if (comment.id >= mine.id) break; // oldest first; nothing newer can have claimed first
    const claim = TOOK_TAG.read(comment.body);
    if (claim !== undefined && claim.ask === mine.ask) return "backed-off";
  }
  return "held";
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      number: { type: "string" },
      ask: { type: "string" },
      "run-id": { type: "string" },
      repo: { type: "string" },
    },
  });

  const repo = values.repo ?? process.env.GITHUB_REPOSITORY ?? "";
  const number = Number(values.number);
  const runId = Number(values["run-id"] ?? process.env.GITHUB_RUN_ID ?? 0);
  const ask = Number(values.ask ?? 0) || 0;

  const record = (claimed: boolean): void => {
    const out = process.env.GITHUB_OUTPUT;
    if (out) {
      const { appendFileSync } = require("node:fs") as typeof import("node:fs");
      appendFileSync(out, `claimed=${claimed ? "true" : "false"}\n`);
    }
    console.error(`claim_turn: claimed=${claimed ? "true" : "false"} (ask=${ask}, run=${runId})`);
  };

  // No ask comment to claim: a run started by a new issue's body, or by anything
  // else that is not a comment. It takes no turn the thread can name, writes no
  // claim, and the watch stays silent on it — the honest shape of "the body is
  // not an ask".
  if (!Number.isInteger(number) || number <= 0) throw new Error("--number must be a positive number");
  if (ask <= 0) {
    record(true);
    return;
  }
  if (!Number.isInteger(runId) || runId <= 0) throw new Error("--run-id must be a positive number");

  const posted = gh("api", `repos/${repo}/issues/${number}/comments`, "--method", "POST", "-f", `body=${claimCommentBody({ ask, run: runId })}`, "--jq", ".id");
  if (posted.code !== 0) throw new Error(`could not post the claim on #${number}: ${posted.stderr || posted.stdout}`);
  const claimId = Number(posted.stdout.trim());
  if (!Number.isInteger(claimId) || claimId <= 0) throw new Error(`the claim's id came back unreadable: ${posted.stdout.trim()}`);

  // GitHub does not guarantee read-after-write. Until the listing shows THIS
  // comment, the read may still predate it, and a race judged on that read would
  // judge a thread that has not caught up — the same instrument the dispatch
  // marker runs before its ordering check is trusted.
  let visible = false;
  for (let attempt = 0; attempt <= READ_DELAYS_MS.length; attempt += 1) {
    if (listBodies(repo, number).some((comment) => comment.id === claimId)) {
      visible = true;
      break;
    }
    const delay = READ_DELAYS_MS[attempt];
    if (delay === undefined) break;
    await Bun.sleep(delay);
  }
  if (!visible) throw new Error(`the claim on #${number} never became visible, so the race check cannot be trusted`);

  const outcome = raceOutcome(listBodies(repo, number), { id: claimId, ask });
  if (outcome === "held") {
    record(true);
    return;
  }

  // Another run's claim is older: it holds the turn. Take this one back.
  const removed = gh("api", `repos/${repo}/issues/comments/${claimId}`, "--method", "DELETE");
  if (removed.code !== 0) {
    // The claim staying up would name a run that never worked the ask — the
    // open-claim state the watch reads as an unanswered request. A failed delete
    // is the one back-off that cannot stay quiet: red, so it is re-run, and the
    // re-run's own claim either holds or deletes this one by the same comparison.
    throw new Error(`could not take back the claim on #${number}: ${removed.stderr || removed.stdout}`);
  }
  record(false);
}

if (import.meta.main) void main();
