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
 * ## Why the thread rather than the label
 *
 * This used to read the `atomaton/in-progress` label, which the runner sets. Between
 * a person's command and the runner starting, the label is absent — minutes long on a
 * pull request, where a command goes through validation and CI before any agent
 * starts — so a comment made in that window went through. The label is a cache of the
 * answer, written late; the thread is the answer, written when the turn changes. See
 * `domain/work/thread.ts`.
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
import { LLM_CONTEXT_TAG, QUOTES_TAG } from "../../adapters/github/tags.ts";
import { commentWouldBeRemoved } from "../../adapters/github/thread.ts";
import { mentionPrefix } from "../../domain/work/mention.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface GuardCommentDuringRunArgs {
  number: string | number;
  "comment-id": string | number;
  commenter: string;
}

export const ref = defineScript<GuardCommentDuringRunArgs>(import.meta.url);

/**
 * Ceiling on the preserved text, so the notice stays well under GitHub's 65,536-character
 * limit on a comment body even when the removed comment did not.
 */
const MAX_PRESERVED_CHARS = 30_000;

/**
 * A code fence one run longer than the longest run of backticks in `text`.
 *
 * The fence is what keeps the quoted text verbatim. A comment that itself contains a
 * fence -- somebody's own code block, exactly the thing worth preserving -- closes an
 * ordinary triple fence early, and everything after it leaves the block and is read as
 * this notice's speech. One longer than the longest run in the text closes last. The
 * floor is three: the ordinary fence, for a body carrying none.
 */
function fenceFor(text: string): string {
  let longest = 0;
  for (const run of text.match(/`+/g) ?? []) longest = Math.max(longest, run.length);
  return "`".repeat(Math.max(3, longest + 1));
}

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
  deleted: boolean;
  couldNotRead: boolean;
  original: string;
  commentId: string | number;
}): string {
  const quote = opts.deleted && !opts.couldNotRead && opts.original !== "";
  const what = opts.deleted
    ? "Your comment was removed because"
    : "Your comment could not be removed, and will not be acted on, because";
  const lines = [
    LLM_CONTEXT_TAG.write("exclude"),
    ...(quote ? [QUOTES_TAG.write(Number(opts.commentId))] : []),
    `${opts.mention}${what} the ball is with an agent on this issue/PR: the last turn on the thread was a request to an agent, and it has not come back to a person yet. Please wait for that to finish, then comment again.`,
  ];

  if (quote) {
    const truncated = opts.original.length > MAX_PRESERVED_CHARS;
    const kept = truncated ? opts.original.slice(0, MAX_PRESERVED_CHARS) : opts.original;
    const fence = fenceFor(kept);
    lines.push(
      [
        "<details><summary>Your comment, as you wrote it</summary>",
        "",
        fence,
        kept,
        fence,
        ...(truncated ? ["", `The comment was longer than ${MAX_PRESERVED_CHARS.toLocaleString("en-US")} characters; the rest is not preserved here.`] : []),
        "",
        "</details>",
      ].join("\n"),
    );
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
    },
  });

  if (!values.number || !values["comment-id"]) {
    console.error("usage: guard_comment_during_run.ts --number N --comment-id ID --commenter LOGIN");
    process.exit(2);
  }

  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const githubOutput = process.env.GITHUB_OUTPUT;

  // The rule is `shapedThread`'s, applied to the whole thread in order: a person's
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
  let removed: boolean;
  try {
    removed = commentWouldBeRemoved(repo, values.number, values["comment-id"]);
  } catch (e) {
    // A failed read is not "the ball is with a person". This script exists to keep a
    // comment out of a race with a running agent, so the answer it could not determine
    // must not be the one that lets the comment through.
    console.error(`Could not read the thread on #${values.number}, so this cannot tell whose turn it is: ${e}`);
    process.exit(1);
  }

  if (!removed) {
    if (githubOutput) appendFileSync(githubOutput, "blocked=false\n");
    return;
  }

  // Read the comment's body back BEFORE deleting it: once the DELETE lands the id is
  // gone and the read 404s, so the content somebody spent time writing is only
  // retrievable while the comment still exists. A failed read does not hold the
  // deletion back -- stopping the race is the guard's job, and it outranks the
  // preservation -- and the failure is said, never presented as success (below).
  const readBack = ghRead("api", `repos/${repo}/issues/comments/${values["comment-id"]}`, "--jq", ".body");
  const couldNotRead = readBack.code !== 0;
  const original = couldNotRead ? "" : readBack.stdout ?? "";

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
      deleted,
      couldNotRead,
      original,
      commentId: values["comment-id"],
    }),
  );

  if (githubOutput) appendFileSync(githubOutput, "blocked=true\n");
  console.error(`Deleted comment #${values["comment-id"]} on #${values.number} (in-progress guard) and notified ${values.commenter || "(unknown)"}.`);
}

if (import.meta.main) main();
