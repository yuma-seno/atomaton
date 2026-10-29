#!/usr/bin/env bun
/**
 * claim_turn.ts — claim the turn: which run took up which ask (#285).
 *
 * The runner records the turn at start — either by appending a claim line to the
 * ask comment when the ask is the machinery's own dispatch marker, or by writing
 * one comment when it is somebody else's:
 *
 *     <!-- atomaton:llm-context=exclude -->
 *     <!-- atomaton:took=<ask comment id> run=<run id> -->
 *     Atomaton: claimed this turn.
 *
 * That comment (or that line) is the turn's identity from the taking side. The run watch
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
 * smaller comment id. Found one, this run backs off: it removes its own claim and
 * writes `claimed=false`, and the workflow steps that would take the turn are
 * gated off it. The other run — its claim is older — holds the turn, and a backed
 * off run leaves no ending, because it took no turn the thread names.
 *
 * ## Why a marker is claimed in place
 *
 * A dispatch marker is the machinery's own comment, and its id IS the ask
 * (`dispatch.ts` passes `ask = markerId`). The claim used to be a second comment
 * beside it, which left every dispatch as two comments on the same node — one
 * saying "an agent is starting" and one saying "the agent took it". Appending
 * the took line to the marker says both in one comment, and every reader of the
 * claim (`shapedThread`'s holder, `askSuperseded`'s claimed-ask set, the race
 * check below) reads it off the body exactly as before.
 *
 * The one thing that changes is how two claims on one marker are separated. A
 * separate claim had its own comment id and the smaller id held; a marker has one
 * id for both runs, so the marker can carry only one took line. Two runs on one
 * ask are already prevented by the dispatch-level checks and serialised by the
 * runner's per-node concurrency, so the second finds the marker claimed and backs
 * off there; the pre-check below is what makes that the same answer the id
 * comparison gave. A backed-off run that wrote the line itself (the read-back
 * shows somebody else's run) leaves the marker alone rather than restoring it —
 * the other run's claim is the one that landed.
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
import { gh } from "../../adapters/github/gh.ts";
import { isHumanActor } from "../../domain/work/actor.ts";
import { DISPATCH_TAG, LLM_CONTEXT_TAG, TOOK_TAG } from "../../adapters/github/tags.ts";
import { listComments } from "../../adapters/github/thread.ts";
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

/**
 * Every comment on the node, oldest first, as the claim reads them.
 *
 * The read is the shared `listComments`; the projection to ids, bodies and
 * authorship is this caller's, and a failed read THROWS here: the claim is the
 * turn's identity, and a run that could not see the older claims must not decide
 * it holds the turn.
 */
function readComments(repo: string, number: number): { id: number; body: string; human: boolean }[] {
  return listComments(repo, number).map((comment) => ({
    id: comment.id,
    body: comment.body ?? "",
    human: isHumanActor(comment.user?.type),
  }));
}

/**
 * The line a person reads under the two tags.
 *
 * GitHub renders neither tag, so a body of tags alone reaches the page as an empty
 * comment — a run announcing itself looked like a comment somebody had posted and
 * left blank (#349). The tags are the record and must stay; this is the part a
 * person sees, written in the shape the dispatch marker uses for the same reason.
 * It carries no tag and no `/agent` command: prose that read as either would move
 * the turn this comment exists to name.
 */
const CLAIM_NOTICE = "Atomaton: claimed this turn.";

export function claimCommentBody(args: { ask: number; run: number }): string {
  return [LLM_CONTEXT_TAG.write("exclude"), TOOK_TAG.write(args), CLAIM_NOTICE].join("\n");
}

/**
 * The claim line appended to a dispatch marker, which is this run's ask.
 *
 * Only the took line is added, and nothing else is rewritten: the marker's own
 * `llm-context` tag stays exactly as its writer set it. Turning a marker
 * `include` (the post-merge and rejection directives, which are the first user
 * message the re-invoked run reads) into `exclude` here would remove that
 * directive from the run's context — the claim would delete the instruction it
 * exists to let the run take up.
 */
export function claimOnMarkerBody(original: string, args: { ask: number; run: number }): string {
  return `${original.replace(/\s+$/, "")}\n${TOOK_TAG.write(args)}`;
}

/**
 * The marker's body with a took line removed — what a run's own earlier attempt
 * added, taken back.
 *
 * By line and `has`, not `readProse` over the whole body: only the line the claim
 * wrote is the claim, and a marker never carries a second took tag.
 */
function withoutClaimLine(body: string): string {
  return body
    .split("\n")
    .filter((line) => !TOOK_TAG.has(line))
    .join("\n")
    .replace(/\s+$/, "");
}

/** Write a comment's body in place, as the footer append does. */
function patchCommentBody(repo: string, commentId: number, body: string): { code: number; stdout: string; stderr: string } {
  return gh("api", `repos/${repo}/issues/comments/${commentId}`, "--method", "PATCH", "-f", `body=${body}`);
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
    // Prose only: a comment quoting a took tag in a fenced sample has not claimed
    // anything (#304).
    const claim = TOOK_TAG.readProse(comment.body);
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

  const comments = readComments(repo, number);
  const askComment = comments.find((comment) => comment.id === ask);
  // The machinery's own dispatch marker: it is not a person's comment, and its
  // body carries the dispatch tag that makes it the ask. Edited in place rather
  // than answered with a second comment — see the module comment.
  const isMarker = askComment !== undefined && !askComment.human && DISPATCH_TAG.hasProse(askComment.body);
  if (askComment !== undefined && isMarker) {
    const original = askComment.body;
    const existing = TOOK_TAG.readProse(original);
    if (existing !== undefined) {
      // The marker already carries a claim, and only one can (the marker has one
      // id, so the older-id comparison the separate claim used cannot apply
      // here). This run backs off, exactly as it did when an older claim comment
      // existed — and if the claim is this run's own earlier attempt, it is
      // taken back the way that attempt's comment used to be deleted.
      if (existing.run === runId) {
        const restored = patchCommentBody(repo, ask, withoutClaimLine(original));
        if (restored.code !== 0) {
          throw new Error(`could not take back this run's claim on #${number}: ${restored.stderr || restored.stdout}`);
        }
      }
      record(false);
      return;
    }

    const edited = patchCommentBody(repo, ask, claimOnMarkerBody(original, { ask, run: runId }));
    if (edited.code !== 0) {
      throw new Error(`could not claim the dispatch marker on #${number}: ${edited.stderr || edited.stdout}`);
    }

    // GitHub does not guarantee read-after-write, and that now applies to the
    // EDIT: until the listing shows this run's took line, the read may predate
    // it. A claim that never appeared is the same untrustworthy read the posted
    // claim refuses to judge a race on.
    let held: boolean | undefined;
    for (let attempt = 0; attempt <= READ_DELAYS_MS.length; attempt += 1) {
      const current = readComments(repo, number).find((comment) => comment.id === ask);
      const claim = current === undefined ? undefined : TOOK_TAG.readProse(current.body);
      if (claim !== undefined) {
        // Somebody else's claim overwrote this run's between the PATCH and this
        // read: the marker holds one claim, and it is not this run's.
        held = claim.run === runId;
        break;
      }
      const delay = READ_DELAYS_MS[attempt];
      if (delay === undefined) break;
      await Bun.sleep(delay);
    }
    if (held === undefined) throw new Error(`the claim on #${number} never became visible, so the race check cannot be trusted`);
    if (!held) {
      record(false);
      return;
    }

    // The separate-claim comparison still runs: a claim posted on this ask
    // BEFORE the marker could carry one (the shape this replaced, or a claim
    // somebody wrote) is older and holds, and this run takes its line back.
    const outcome = raceOutcome(readComments(repo, number), { id: ask, ask });
    if (outcome === "held") {
      record(true);
      return;
    }
    const restored = patchCommentBody(repo, ask, original);
    if (restored.code !== 0) {
      // Leaving the line would name a run that never worked the ask — the
      // open-claim state the watch reads as an unanswered request. A failed
      // restore is the one back-off that cannot stay quiet: red, so it is
      // re-run, and the re-run's own claim either holds or is taken back by the
      // comparison above.
      throw new Error(`could not take back the claim on #${number}: ${restored.stderr || restored.stdout}`);
    }
    record(false);
    return;
  }

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
    if (readComments(repo, number).some((comment) => comment.id === claimId)) {
      visible = true;
      break;
    }
    const delay = READ_DELAYS_MS[attempt];
    if (delay === undefined) break;
    await Bun.sleep(delay);
  }
  if (!visible) throw new Error(`the claim on #${number} never became visible, so the race check cannot be trusted`);

  const outcome = raceOutcome(readComments(repo, number), { id: claimId, ask });
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
