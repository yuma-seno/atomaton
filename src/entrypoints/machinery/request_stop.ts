#!/usr/bin/env bun
/**
 * request_stop.ts — Act on a `/stop` comment: remove it, and post the request the
 * running job polls for.
 *
 * ## Why the request is a comment
 *
 * Nothing outside a workflow job can reach into that job's filesystem, so a stop has
 * to be left somewhere both sides can see. A comment is that place, and it is also
 * the record of who asked and when — a label would have needed a second thing to
 * carry the same information.
 *
 * The running job polls for `STOP_TAG` and, when it finds one newer than its own
 * start, writes the file `atoma run --stop-file` is watching. See `watch_for_stop.ts`.
 *
 * ## Why the human's comment is deleted
 *
 * A stop must not become the next run's context. The whole point is that the run is
 * paused rather than told something; a `/stop` sitting in the session would be read
 * by the resumed agent as an instruction it has to account for.
 *
 * The notice this posts is tagged `llm-context=exclude`, so it is dropped by
 * `reconcile_github_session.ts` on the way into a session for the same reason.
 *
 * ## The rest of the comment (#297)
 *
 * The in-progress guard skips a comment whose FIRST command is `/stop`, because a stop
 * has to reach the running agent. That leaves the second command with no reader: the
 * parser acts on the first and drops the rest, so `/stop` + `/reviewer` stopped the
 * run and silently lost the review request. The receipt now names the commands after
 * the stop and says they were not acted on, and the removed text is preserved under
 * `<details>` (tagged `quotes`, so the thread readers do not take the quoted command
 * lines for fresh requests).
 *
 * The comment is still deleted. Keeping it would leave `/reviewer` in the thread as a
 * request that never ran -- the silent outcome this is meant to end, wearing a
 * different shape.
 *
 * ## Ending a park (#208)
 *
 * A node whose agent launched children and stopped is PARKED: its thread's newest
 * event is a `waiting` ending, and the claim it holds open has no run left to answer
 * it — the run that parked ended, and the aggregation re-invocation is not coming
 * for a stopped node. The person's `/stop` is what returns the turn, so when the
 * target's thread is parked the receipt carries `ended=stopped answers=<the open
 * claim's ask> run=0`: no run wrote it, the person did. Without this the park would
 * hold the node shut forever — the guard would keep removing everything said there.
 *
 * ## Why it says the comment was deleted
 *
 * Because the existing in-progress guard also deletes comments, and says so. Someone
 * whose `/stop` vanished with no explanation would have no way to tell "your stop is
 * being acted on" from "your comment was refused because a run is in progress".
 *
 * Usage:
 *   request_stop.ts --number N --comment-id ID --commenter LOGIN
 */
import { parseArgs } from "node:util";
import { gh } from "../../adapters/github/gh.ts";
import { ENDED_TAG, LLM_CONTEXT_TAG, QUOTES_TAG, STOP_TAG, proseOnly } from "../../adapters/github/tags.ts";
import { commandLabel, commandsIn } from "../../domain/work/comment-command.ts";
import { descendants, nodesToStop, subtree } from "../../domain/work/work-tree.ts";
import { openClaimOn } from "../../adapters/github/thread.ts";
import { readWorkTree, requestStopAcross } from "../../adapters/github/work-tree.ts";
import { preservedCommentBlock } from "./lib/removed-comment.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface RequestStopArgs {
  number: string | number;
  "comment-id": string | number;
  commenter: string;
}

export const ref = defineScript<RequestStopArgs>(import.meta.url);

/**
 * What the receipt says about the rest of a comment that began with `/stop`.
 *
 * A comment whose first command is `/stop` takes the stop path, which the in-progress
 * guard skips. Anything else the comment asked for was therefore read by nobody, and a
 * person cannot tell "it ran" from "it was dropped" (#297). The receipt names them and
 * says they did not run; `commands` are the lines as the thread reader sees them.
 */
export interface StopNoticeExtra {
  /** Command lines after the `/stop`, as written. */
  commands: string[];
  /** The removed comment's text, preserved when it said more than the stop. */
  original: string;
  /** Its id, for the `quotes` tag: the preserved text is a quotation, not this notice. */
  commentId: string | number;
}

/**
 * The command lines after the `/stop`, as the receipt names them.
 *
 * Pure and exported so the rule is testable without a fake GitHub: the first command
 * is the stop (the workflow only takes this path when it is), and everything the same
 * reader finds after it was read by nobody.
 *
 * Read as prose (#311), like every other reader of a person's comment: a command
 * inside a fenced sample was never picked up, so the receipt must not name it as
 * something that was "not acted on" -- nothing was ever going to act on it.
 */
export function commandsAfterStop(original: string): string[] {
  return commandsIn(proseOnly(original)).slice(1).map(commandLabel);
}

/**
 * The receipt, as the person who typed `/stop` will read it.
 *
 * A receipt, and deliberately not a record. The run posts its own result comment
 * seconds later, and the two used to say the same thing twice and mention the same
 * person twice. So this says only what is true when it is posted: the command was
 * received, what became of the comment, and that the stop is not instant. Whether
 * the run stopped, whether the session survived, and that `/resume` works are the
 * run's to say — it is the one that does them.
 *
 * No mention either. A mention means "your turn", and the person who just typed
 * `/stop` has taken theirs; the turn comes back when the run reports, and that
 * comment mentions them. The login is still named, because whose comment was removed
 * is a fact worth recording — written without the `@`, which is what would turn a
 * record into a second notification.
 */
export function stopRequestedNotice(
  commenter: string,
  deleted: boolean,
  alsoReached: number[],
  extra?: StopNoticeExtra,
  park?: { ask: number; run: number },
): string {
  const whose = commenter ? `${commenter}'s` : "The";
  const quoted = extra !== undefined && deleted && extra.original !== "";
  const lines = [
    LLM_CONTEXT_TAG.write("exclude"),
    ...(quoted ? [QUOTES_TAG.write(Number(extra.commentId))] : []),
    STOP_TAG.write("requested"),
    // A stop on a PARKED node is what returns the turn (#208): the park holds a
    // claim no run will ever answer, so the receipt carries the ending itself.
    // `run=0` says no run wrote it — the person did — and `answers` names the ask
    // the parked claim holds open. The guard reads it, releases the node, and the
    // person can comment again; without it the park would hold the node shut
    // forever, because nothing else was ever going to write an ending there.
    ...(park ? [ENDED_TAG.write({ verb: "stopped", answers: park.ask, run: 0 })] : []),
    "Atomaton: stop requested.",
    "",
    deleted
      ? `${whose} \`/stop\` comment was removed so it does not become part of the agent's context.`
      : `${whose} \`/stop\` comment could not be removed, so it may end up in the agent's context.`,
  ];
  if (extra && extra.commands.length > 0) {
    const named = extra.commands.map((line) => `\`${line}\``).join(", ");
    lines.push(
      "",
      `It also carried ${named}, which was not acted on. Atomaton acts on one command per comment, and a stop ` +
        "is the one command that has to reach a running agent, so the stop is the one that ran. Comment " +
        `${extra.commands.length > 1 ? "each of them" : "it"} on its own once the run has reported.`,
    );
  }
  lines.push(
    "",
    // The lag is real and it is the thing people will misread. A stop is picked up on
    // the next poll and taken at the next turn, so the agent can finish a tool call
    // and start another one after the request. Without this line that reads as the
    // command having done nothing.
    "The run will stop after its current step, so it may take a minute, and it will report here when it has.",
  );
  if (extra && quoted) {
    // Deleted, and there was more in it than the stop: show the text so it can be
    // copied back. The `quotes` tag above is what keeps the command lines inside this
    // block from being read as fresh requests by the thread readers.
    lines.push("", ...preservedCommentBlock(extra.original));
  }
  if (alsoReached.length > 0) {
    // Named rather than counted, so a person can see whether the stop went where they
    // meant it to. This used to be the opposite list — the work a stop could NOT
    // reach, with instructions to go and stop each piece by hand — which was the
    // machinery handing somebody a checklist because its own vocabulary was one node
    // wide. See `domain/work/work-tree.ts`.
    lines.push(
      "",
      `It also reached the work running on ${alsoReached.map((n) => `#${n}`).join(", ")}, ` +
        "which is under this issue. `/resume` here brings all of it back.",
    );
  }
  return lines.join("\n");
}

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      number: { type: "string" },
      "comment-id": { type: "string" },
      commenter: { type: "string" },
    },
  });

  if (!values.number || !values["comment-id"]) {
    console.error("usage: request_stop.ts --number N --comment-id ID --commenter LOGIN");
    process.exit(2);
  }

  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const number = String(values.number);

  // The comment's own text, not the page: it is deleted just below, and a comment that
  // began with `/stop` may have asked for more. The reader is the one the dispatch and
  // the guard use, so a command quoted in somebody's prose is not a second command here
  // either. Absent in a direct call, which leaves the receipt exactly as it was.
  const original = process.env.ATOMATON_COMMENT_BODY ?? "";
  const others = commandsAfterStop(original);
  const extra =
    others.length > 0
      ? { commands: others, original, commentId: values["comment-id"]! }
      : undefined;

  const { code: delCode, stdout: delOut, stderr: delErr } = gh(
    "api", "--method", "DELETE", `repos/${repo}/issues/comments/${values["comment-id"]}`,
  );
  const deleted = delCode === 0;
  if (!deleted) {
    console.error(`Warning: failed to delete comment #${values["comment-id"]} on #${number}: ${delErr || delOut}`);
  }

  // The subtree, not this node. A person points at an issue and means the work under
  // it — `domain/work/work-tree.ts` has why stop and close differ in finality rather than
  // in reach.
  //
  // Read before posting, so the receipt can name what the stop actually reached rather
  // than what it could not.
  const root = Number(number);
  const { nodes } = readWorkTree(repo, root);
  const under = nodesToStop(descendants(subtree(nodes, root), root)).map((node) => node.number);

  // The target's own thread, read for the park (#208): a `/stop` on a node whose
  // turn is parked on its subtree is the ONLY thing that returns the turn — the run
  // that parked it is long gone, and nothing else writes an ending there. Undefined
  // unless a claim is open; the ending rides the receipt only when the hold is a
  // park (newest event `waiting`), never on a node with a live run.
  const park = openClaimOn(repo, number);

  const result = requestStopAcross(
    repo,
    root,
    stopRequestedNotice(values.commenter ?? "", deleted, under, extra, park),
  );
  // Fatal only when the root got nothing. That comment IS the request: without it the
  // run polls, finds nothing, and keeps going, and the person is told a stop is coming
  // that never arrives. A descendant that could not be reached is a warning — the rest
  // of the stop stands, and failing the step would report that none of it happened.
  for (const problem of result.problems) console.error(`::warning::${problem}`);
  if (!result.rootNotified) process.exit(1);

  console.error(`Stop requested across #${root}: ${result.stopped.length ? result.stopped.map((n) => `#${n}`).join(", ") : "no run was holding anything"}`);
}

if (import.meta.main) main();
