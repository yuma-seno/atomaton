#!/usr/bin/env bun
/**
 * guard_comment_during_run.ts — While the ball is with an agent on this node, a new
 * human comment would otherwise sit unseen until the current run finishes (or worse,
 * race a slash-command dispatch against the in-flight run). Instead: delete the
 * comment immediately and notify its author via mention so they know to wait and
 * re-comment once the run concludes. The comment's text is read back BEFORE the
 * delete and folded into the notice inside a `<details>` block, so what somebody
 * spent time writing survives on the page instead of vanishing with the comment --
 * tagged `atomaton:quotes`, so the machinery reads the notice as a quotation rather
 * than as its own speech. No-ops quietly (leaves the comment alone) when the ball is
 * with a person.
 *
 * ## The second rule: one command per comment (#217)
 *
 * A comment carrying two commands is refused the same way, whoever's turn it is. The
 * machinery acts on the FIRST one (`parseCommentCommand`) and reads the rest as prose,
 * so a `/engineer` followed by a `/reviewer` silently starts one agent and loses the
 * other -- and the person cannot see which of two requests won. Refused, the comment
 * is deleted and the notice says which commands it carried and that each belongs in its
 * own comment. A malformed first line counts too: the parser stops there, so the valid
 * command under it is lost exactly as silently and the person is only ever told about
 * the first line's error. The commands are counted with the same line reader the
 * dispatch uses, so a directive quoted inside somebody's prose (`> /engineer`) is not a
 * second command: it is not one the machinery would act on either.
 *
 * Two gates keep the rule from answering comments the machinery would not have read:
 * `--parsed` (the parse step ran -- it does not for somebody who is not a repository
 * member) and `--state` (a closed node's commands belong to the closed guard, which
 * keeps the comment because nothing is running). A caller that passes neither gets no
 * commands rule: the comment stays, which is the side that loses nothing.
 *
 * A comment whose FIRST command is `/stop` is not read here at all -- the workflow
 * skips this step for it (`control != 'stop'`), because a stop has to reach a running
 * agent. That comment's other commands are the stop path's to report: `request_stop.ts`
 * names them in its receipt and says they were not acted on (#297).
 *
 * ## Why the thread rather than the label
 *
 * This used to read the `atomaton/in-progress` label, which the runner sets — and
 * before that, the thread's last event, where an unclaimed command read as the
 * agent's. What it reads now is the claim (#285): a run says it took the turn
 * (`atomaton:took`), and until an ending hands it back, a person's comment here
 * would sit unseen or race the run. The claim is written at runner start, so the
 * window it leaves open is the one before any run exists — a person's comment there
 * is kept, and reaches the run that does start. See `domain/work/thread.ts`.
 *
 * The notice below says "the ball is with an agent", NOT "the label is active".
 * Naming the label told a person to remove it and re-comment, which does nothing:
 * the decision never read the label, and `commentWouldBeRemoved` still finds the
 * last turn event "asked" and deletes the comment anyway. Observed on #17.
 *
 * Usage:
 *   guard_comment_during_run.ts --number N --comment-id ID --commenter LOGIN
 * Writes `blocked=true|false` to $GITHUB_OUTPUT.
 */
import { appendFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { gh, ghRead } from "../../adapters/github/gh.ts";
import { LLM_CONTEXT_TAG, QUOTES_TAG, proseOnly } from "../../adapters/github/tags.ts";
import { commentWouldBeRemoved } from "../../adapters/github/thread.ts";
import { commandLabel, commandsIn } from "../../domain/work/comment-command.ts";
import { mentionPrefix } from "../../domain/work/mention.ts";
import { preservedCommentBlock } from "./lib/removed-comment.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface GuardCommentDuringRunArgs {
  number: string | number;
  "comment-id": string | number;
  commenter: string;
  /** `"true"` when the parse step ran for this comment; see the rule in the header. */
  parsed?: string;
  /** The node's `open`/`closed` state; see the rule in the header. */
  state?: string;
}

export const ref = defineScript<GuardCommentDuringRunArgs>(import.meta.url);

/**
 * The notice's body, tags first, with the removed comment's text where it was preserved.
 *
 * The text goes in inside `<details>`, so a person can open what took them time to
 * write and copy it back once the run ends -- instead of the notice saying only that
 * the words were taken away. It is not model context: the notice stays
 * `llm-context=exclude`, so the guard keeps doing its one job (nothing joins a run
 * mid-turn) while the person gets their text back.
 *
 * Three cases, each saying what actually happened:
 *
 *   - Comment deleted and body read back: the `<details>` block, and the
 *     `atomaton:quotes` tag naming the comment the quotation came from. The tag is
 *     what makes the fold read the notice as a QUOTATION rather than as the machinery
 *     speaking -- see `domain/work/thread.ts`'s `quoted`.
 *   - Comment deleted but the body could not be read: one line saying so. Presenting
 *     the notice as complete when the text is gone would be the loss this exists to
 *     prevent, wearing a message that claims otherwise.
 *   - Delete failed: no quotation. The comment is still on the page; quoting it here
 *     would be showing it twice.
 */
function noticeBody(opts: {
  mention: string;
  /** Why the comment was taken away; when both hold, the commands are the actionable one. */
  several: boolean;
  /** Whether the thread rule would also have removed it, so the notice can say to wait too. */
  removed: boolean;
  /** The commands the comment carried, as they were written, when `several`. */
  commands: string[];
  deleted: boolean;
  couldNotRead: boolean;
  original: string;
  commentId: string | number;
}): string {
  const quote = opts.deleted && !opts.couldNotRead && opts.original !== "";
  const what = opts.deleted
    ? "Your comment was removed because"
    : "Your comment could not be removed, and will not be acted on, because";
  const reason = opts.several
    ? `it carries more than one command (${opts.commands.join(", ")}). Atomaton acts on one command per ` +
      "comment: it acts on the first and drops the rest, and which one won is not visible on the page. " +
      "Comment each command on its own, with what you want done on the lines under it."
    : "the ball is with an agent on this issue/PR: a run has claimed the turn and has not handed it back yet. " +
      "Please wait for that to finish, then comment again.";
  const lines = [
    LLM_CONTEXT_TAG.write("exclude"),
    ...(quote ? [QUOTES_TAG.write(Number(opts.commentId))] : []),
    `${opts.mention}${what} ${reason}`,
  ];
  if (opts.several && opts.removed) {
    lines.push(
      "",
      "A run also holds the turn on this issue/PR right now, so a comment would not reach anyone until it comes back.",
    );
  }

  if (quote) {
    lines.push("", ...preservedCommentBlock(opts.original));
  } else if (opts.deleted && opts.couldNotRead) {
    lines.push("The text of that comment could not be read back before it was removed, so it is not preserved here.");
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
      // `true` when the parse step ran for this comment -- it does not run for a person
      // who is not a repository member -- so the commands rule only speaks where the
      // command would have been read.
      parsed: { type: "string" },
      // The node's state; a closed node's commands are the closed guard's to answer.
      state: { type: "string" },
    },
  });

  if (!values.number || !values["comment-id"]) {
    console.error("usage: guard_comment_during_run.ts --number N --comment-id ID --commenter LOGIN [--parsed true] [--state open]");
    process.exit(2);
  }

  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const githubOutput = process.env.GITHUB_OUTPUT;

  // The body decides both rules, and decides the commands rule before the thread rule
  // is even asked. Read once, up front: the comment still exists here, and after the
  // DELETE its text is gone. A failed read leaves the commands unknown; the notice says
  // so if it is removed for the other reason (below), and the thread rule still decides.
  const readBack = ghRead("api", `repos/${repo}/issues/comments/${values["comment-id"]}`, "--jq", ".body");
  const couldNotRead = readBack.code !== 0;
  const original = couldNotRead ? "" : readBack.stdout ?? "";
  // Counted as prose (#311), the same way the entry parses and the thread reads: a
  // command inside a fenced sample would be acted on by nothing, so refusing the
  // comment for it would punish a quotation. The rule refuses what would be dropped;
  // a fenced line is not dropped, because it was never picked up.
  const commands = commandsIn(proseOnly(original)).map(commandLabel);

  // The rules only reach a comment the machinery would have read. A command from
  // somebody who is not a repository member is refused by the parse step (which does not
  // run), and a command on a closed node is the closed guard's to answer -- it keeps the
  // comment, on the grounds that nothing is running, and deleting it here would take
  // that answer away with a reason that does not hold. `parsed` is the parse step's own
  // word that it ran (see `parse_comment_command.ts`); a caller that passes nothing gets
  // no commands rule, which is the side that keeps the comment.
  const parsed = values.parsed === "true";
  const closed = values.state === "closed";

  // The first rule: a comment carrying two commands starts one and loses the rest.
  // Refused whoever's turn it is — nothing about the turn makes the second request
  // reachable — as long as it would have been read at all.
  const several = parsed && !closed && commands.length > 1;

  // The second rule is `shapedThread`'s, applied to the whole thread in order: a person's
  // comment is removed when the ball was already with an agent WHEN IT ARRIVED. The
  // comment is judged at its own position in that walk, not by removing it and asking
  // whose turn the rest leaves — judged by exclusion, a `/agent` command posted
  // seconds AFTER the comment being judged moved the turn first, and an ordinary
  // comment written on a person's turn was deleted for racing a run that started
  // after it was written (#206). See `commentWouldBeRemoved`.
  //
  // Comments alone, not the body: a pull request body naming a reviewer is a request
  // the validation dispatch is already handling, and deleting a person's comment on
  // the strength of it would tell them to wait for a run their comment was not racing.
  //
  // Asked even when the commands rule already decides, because a person about to split
  // the comment in two needs to know the ball is with an agent as well — otherwise they
  // post the first half, it is refused by this same guard, and they are told the other
  // reason a comment later.
  let removed = false;
  try {
    removed = commentWouldBeRemoved(repo, values.number, values["comment-id"]);
  } catch (e) {
    // A failed read is not "the ball is with a person" when this is the only rule in
    // play. This script exists to keep a comment out of a race with a running agent, so
    // the answer it could not determine must not be the one that lets the comment
    // through. When the commands rule already removes it, the turn does not have to be
    // known to answer, so the comment is not left alone over a failed read.
    if (!several) {
      console.error(`Could not read the thread on #${values.number}, so this cannot tell whose turn it is: ${e}`);
      process.exit(1);
    }
    console.error(`Could not read the thread on #${values.number} (${e}); removing the comment for its commands`);
  }

  if (!removed && !several) {
    if (githubOutput) appendFileSync(githubOutput, "blocked=false\n");
    return;
  }

  const { code: delCode, stdout: delOut, stderr: delErr } = gh(
    "api", "--method", "DELETE", `repos/${repo}/issues/comments/${values["comment-id"]}`,
  );
  const deleted = delCode === 0;
  if (!deleted) {
    console.error(`Warning: failed to delete comment #${values["comment-id"]} on #${values.number}: ${delErr || delOut}`);
  }

  // Says which of the two actually happened. Telling someone their comment was
  // removed when it is still on the page — and will not be parsed as a command
  // either, since `blocked=true` suppresses that — leaves them waiting for a run
  // that is not coming, with the evidence in front of them saying otherwise.
  const mention = mentionPrefix(values.commenter);
  // Tagged out of the model's context, like every other notice addressed to a
  // person. This one is posted DURING a run, on the issue that run is working on,
  // so an untagged copy is read by that very agent as something it was told --
  // when what it actually says is that somebody else was asked to wait.
  gh(
    "issue", "comment", String(values.number), "--repo", repo,
    "--body",
    noticeBody({
      mention,
      several,
      commands,
      removed,
      deleted,
      couldNotRead,
      original,
      commentId: values["comment-id"],
    }),
  );

  if (githubOutput) appendFileSync(githubOutput, "blocked=true\n");
  console.error(
    `Deleted comment #${values["comment-id"]} on #${values.number} ` +
      `(${several ? "more than one command" : "in-progress guard"}) and notified ${values.commenter || "(unknown)"}.`,
  );
}

if (import.meta.main) main();
