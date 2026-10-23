#!/usr/bin/env bun
/**
 * dispatch_rejected.ts — return a pull request that was closed WITHOUT merging
 * to the agent that opened it, as a rejection.
 *
 * ## Why this exists as a job of its own
 *
 * `pull_request_target: closed` fires for a person's close as well as a
 * person's merge, and until #267 every job listening for it was gated on
 * `merged == true`: a close that merged nothing started nothing, and a rejected
 * pull request left its branch behind, its issue open, and nobody told. The
 * close is a person's decision, but whether it means "rejected" or "shipped
 * some other way" is not readable from the event — so this job returns it to
 * the origin agent and decides nothing itself. The machine closes nothing on
 * this path; the judgement is the agent's, the same as a review result's (#215).
 *
 * The linked issue comes from `parse` — which runs for BOTH outcomes of
 * `closed` now, and whose output the merge-side jobs share — the origin agent
 * from the pull request body, and the issue's state from GitHub: the close is
 * returned only when the issue is still open, because a closed issue is the
 * person saying it is finished. No origin agent tagged (a person's own pull
 * request) returns nothing too — no directive is written for a pull request no
 * run of ours opened. `decideRejectionHandoff` holds that branch list.
 *
 * ## Who can reach it
 *
 * The job's `if:` carries the second half of the gate, and it is the trust
 * boundary: the head branch living in this repository (`isOwnPullRequest`),
 * beside `merged == false`. A merge is the one outcome an outside contributor
 * cannot produce, so the merge-side jobs need no membership test; a close is
 * not — a contributor can close their own pull request, and a maintainer
 * rejecting an outside contribution fires the same event with the same body.
 * Without the head-repository test, two forged tags in that body would start an
 * agent on a number the contributor chose. The rule is the one
 * `docs/work/boundaries.md` states: an agent only starts when a repository
 * member triggered it.
 *
 * The test is the HEAD REPOSITORY, not `author_association` — an agent's pull
 * request is authored by `github-actions[bot]`, association `NONE`, so an
 * association test would be false for every pull request the machinery opened
 * and the feature would never fire (the trap recorded on
 * `atomaton-sub-issue-closed.wac.ts`). The head repository holds both ways: in
 * this repository means pushed by write access or by the bot; a fork's means
 * outside.
 *
 * ## What it does not write
 *
 * No `$GITHUB_OUTPUT`. The merge route reports `reinvoked=` so the aggregate
 * job can stand down; this route has no fallback to coordinate with. When the
 * dispatch does not go out the job FAILS (`exit 1`) instead — a silent close is
 * the defect #267 exists to remove, and a red job is the only way a close that
 * woke nobody is visible at all.
 *
 * Env: PR_BODY, PR_NUMBER, ISSUE_NUMBER, OWNER, REPO
 */

import { dispatchRejectedPrAgent } from "../../adapters/actions/dispatch-targets.ts";
import { ORIGIN_AGENT_TAG } from "../../adapters/github/tags.ts";
import { readTargetState } from "../../adapters/github/target-state.ts";
import { decideRejectionHandoff } from "../../domain/work/handoff.ts";
import { defineScript } from "./lib/script-ref.ts";

export const ref = defineScript(import.meta.url);

function main(): void {
  const body = process.env.PR_BODY ?? "";
  const prNumber = (process.env.PR_NUMBER ?? "").trim();
  const issueRaw = (process.env.ISSUE_NUMBER ?? "").trim();
  const repo = `${process.env.OWNER ?? ""}/${process.env.REPO ?? ""}`;

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
      say(`PR #${prNumber} was closed without merging; nothing re-invoked (${handoff.why}).`);
      return;
    case "reinvoke-origin-agent": {
      const dispatched = dispatchRejectedPrAgent(repo, handoff.parentIssue, handoff.agent, Number(prNumber));
      if (dispatched) {
        say(`Re-invoked ${handoff.agent} on #${handoff.parentIssue} to judge the rejection.`);
        return;
      }
      // The merge route stands the aggregate job up when its dispatch fails;
      // this route has no fallback -- nothing here a failed dispatch could
      // land on except silence, and silence is what #267 is about. Fail the
      // job so the missed hand-off is visible.
      say(`Could not re-invoke ${handoff.agent} on #${handoff.parentIssue}; failing the job rather than ending silently.`);
      process.exit(1);
    }
  }
}

if (import.meta.main) main();
