#!/usr/bin/env bun
/**
 * notify_pr_rejected.ts — a pull request closed WITHOUT merging tells a person,
 * naming the agent that can resume the work.
 *
 * ## Why this exists as a job of its own
 *
 * `pull_request_target: closed` fires for a person's close as well as a
 * person's merge, and until #267 every job listening for it was gated on
 * `merged == true`: a close that merged nothing started nothing, and a rejected
 * pull request left its branch behind, its issue open, and nobody told. The
 * close is a person's decision, but whether it means "rejected" or "shipped
 * some other way" is not readable from the event.
 *
 * The judgement used to be returned to the origin agent as a re-invocation --
 * the machinery starting a run no call asked for, and one that raced the close
 * itself: the person closing and the agent waking read the same thread in
 * opposite directions. It is a mention now, naming the agent whose branch is
 * still there to resume, and the person decides. The machine closes nothing on
 * this path and starts nothing on it.
 *
 * ## Who is told
 *
 * The closer (`github.actor` of this run — a bot's close raises no cascade at
 * all, so the closer is always a person), with `resolveNotify` as the fallback
 * when the event carries no login. It is the person acting on this close, and
 * the same resolution every other notice uses when the actor is not the answer.
 *
 * The linked issue comes from `parse` -- which runs for BOTH outcomes of
 * `closed` now, and whose output the merge-side jobs share -- the origin agent
 * from the pull request body, and the issue's state from GitHub: the notice is
 * posted only when the issue is still open, because a closed issue is the
 * person saying it is finished. No origin agent tagged (a person's own pull
 * request) posts nothing too -- there is no agent to name for a pull request
 * no run of ours opened. `decideRejectionHandoff` holds that branch list.
 *
 * ## Who can reach it
 *
 * The job's `if:` carries the second half of the gate, and it is the trust
 * boundary: the head branch living in this repository (`isOwnPullRequest`),
 * beside `merged == false`. A merge is the one outcome an outside contributor
 * cannot produce, so the merge-side jobs need no membership test; a close is
 * not -- a contributor can close their own pull request, and a maintainer
 * rejecting an outside contribution fires the same event with the same body.
 * Without the head-repository test, two forged tags in that body would write a
 * notice on a number the contributor chose. The rule is the one
 * `docs/work/boundaries.md` states: an agent only starts when a repository
 * member triggered it -- and a notice that names one is written under the same
 * gate, so the fork's close writes nothing at all.
 *
 * The test is the HEAD REPOSITORY, not `author_association` — an agent's pull
 * request is authored by `github-actions[bot]`, association `NONE`, so an
 * association test would be false for every pull request the machinery opened
 * and the feature would never fire (the trap recorded on
 * `atomaton-sub-issue-closed.wac.ts`). The head repository holds both ways.
 *
 * ## What it does not write
 *
 * No `$GITHUB_OUTPUT`. The merge route reports `reinvoked=` so the aggregate
 * job can stand down; this route has no fallback to coordinate with. When the
 * notice does not go out the job FAILS (`exit 1`) instead — a silent close is
 * the defect #267 exists to remove, and a red job is the only way a close that
 * told nobody is visible at all.
 *
 * Env: PR_BODY, PR_NUMBER, ISSUE_NUMBER, OWNER, REPO, CLOSER
 */

import { gh } from "../../adapters/github/gh.ts";
import { LLM_CONTEXT_TAG, ORIGIN_AGENT_TAG } from "../../adapters/github/tags.ts";
import { readTargetState } from "../../adapters/github/target-state.ts";
import { resolveNotify } from "../../adapters/github/notify.ts";
import { mentionPrefix } from "../../domain/work/mention.ts";
import { decideRejectionHandoff } from "../../domain/work/handoff.ts";
import { defineScript } from "./lib/script-ref.ts";

export const ref = defineScript(import.meta.url);

function main(): void {
  const body = process.env.PR_BODY ?? "";
  const prNumber = (process.env.PR_NUMBER ?? "").trim();
  const issueRaw = (process.env.ISSUE_NUMBER ?? "").trim();
  const repo = `${process.env.OWNER ?? ""}/${process.env.REPO ?? ""}`;
  const closer = (process.env.CLOSER ?? "").trim();

  const say = (message: string): void => console.error(message);

  // From `parse`, not read out of the body again: parse already read the tag
  // for the merge-side jobs, and a second reader of one tag is the shape this
  // repository keeps removing.
  const issueNumber = issueRaw === "" ? undefined : Number(issueRaw);
  // Read, not assumed (same as dispatch_post_merge.ts): an unread state is
  // treated as NOT closed, so the judgement is preferred over a silent
  // stand-down.
  const state = issueNumber === undefined ? undefined : readTargetState(issueNumber, repo);
  const issueAlreadyClosed = state?.known === true && state.state !== "open";
  const originAgent = ORIGIN_AGENT_TAG.readProse(body);

  const handoff = decideRejectionHandoff({
    parentIssue: issueNumber,
    parentAlreadyClosed: issueAlreadyClosed,
    originAgent,
  });

  switch (handoff.kind) {
    case "nothing":
      say(`PR #${prNumber} was closed without merging; nobody is told from here (${handoff.why}).`);
      return;
    case "notify-person": {
      // The closer acted on this thread, so they are the person the notice is
      // for. An event without a usable login falls back to the same resolution
      // every other notice takes.
      const notify = closer !== "" ? closer : resolveNotify(repo, handoff.parentIssue);
      const notice =
        `${LLM_CONTEXT_TAG.write("include")}\n` +
        `${mentionPrefix(notify)}Atomaton: pull request #${prNumber} for this issue was closed without merging, ` +
        "and nobody has decided whether that settles what this issue asked for. The machine closes nothing " +
        "and starts nothing here. " +
        `The branch the pull request came from still exists and \`${handoff.agent}\` can resume from it: ` +
        `comment /${handoff.agent} on this issue to carry on, or close this issue if the close settled it.`;
      const posted = gh("issue", "comment", String(handoff.parentIssue), "--repo", repo, "--body", notice);
      if (posted.code !== 0) {
        say(`Could not post the close notice on #${handoff.parentIssue}: ${posted.stderr}`);
        process.exit(1);
      }
      say(`PR #${prNumber} was closed without merging; the close was told on #${handoff.parentIssue}.`);
      return;
    }
  }
}

if (import.meta.main) main();
