#!/usr/bin/env bun
/**
 * guard_comment_during_run.ts — While the ball is with an agent on this node, a new
 * human comment would otherwise sit unseen until the current run finishes (or worse,
 * race a slash-command dispatch against the in-flight run). Instead: delete the
 * comment immediately and notify its author via mention so they know to wait and
 * re-comment once the run concludes. No-ops quietly (leaves the comment alone) when
 * the ball is with a person.
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
 * Usage:
 *   guard_comment_during_run.ts --number N --comment-id ID --commenter LOGIN
 * Writes `blocked=true|false` to $GITHUB_OUTPUT.
 */
import { appendFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { gh } from "../../adapters/github/gh.ts";
import { getLabel } from "../../adapters/runner/config.ts";
import { LLM_CONTEXT_TAG } from "../../adapters/github/tags.ts";
import { commentWouldBeRemoved } from "../../adapters/github/thread.ts";
import { mentionPrefix } from "../../domain/work/mention.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface GuardCommentDuringRunArgs {
  number: string | number;
  "comment-id": string | number;
  commenter: string;
}

export const ref = defineScript<GuardCommentDuringRunArgs>(import.meta.url);

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
  const label = getLabel("in_progress");
  const githubOutput = process.env.GITHUB_OUTPUT;

  // The comment being judged is excluded: a person's `/engineer` is itself an "asked"
  // event, and counting it would block the very command that is starting a run. The
  // question is whose turn it was BEFORE this comment.
  //
  // Comments alone, not the body: a pull request body naming a reviewer is a request
  // the validation dispatch is already handling, and deleting a person's comment on
  // the strength of it would tell them to wait for a run their comment was not racing.
  //
  // The rule itself is `shapedThread`'s, shared with the readers that run in the window
  // before this deletion lands -- so the guard does not re-derive it, it asks whether
  // the comment survived the shaping. See `commentWouldBeRemoved`.
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
  const what = deleted
    ? "Your comment was removed because"
    : "Your comment could not be removed, and will not be acted on, because";
  // Tagged out of the model's context, like every other notice addressed to a
  // person. This one is posted DURING a run, on the issue that run is working on,
  // so an untagged copy is read by that very agent as something it was told --
  // when what it actually says is that somebody else was asked to wait.
  gh(
    "issue", "comment", String(values.number), "--repo", repo,
    "--body",
    [
      LLM_CONTEXT_TAG.write("exclude"),
      `${mention}${what} Atomaton is currently processing this issue/PR (the \`${label}\` label is active). Please wait for the current run to finish, then comment again.`,
    ].join("\n"),
  );

  if (githubOutput) appendFileSync(githubOutput, "blocked=true\n");
  console.error(`Deleted comment #${values["comment-id"]} on #${values.number} (in-progress guard) and notified ${values.commenter || "(unknown)"}.`);
}

if (import.meta.main) main();
