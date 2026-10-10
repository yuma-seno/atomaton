#!/usr/bin/env bun
/**
 * dispatch_post_merge.ts — re-invoke the agent that opened a merged pull request,
 * so it judges whether what merged satisfies the issue it delivers.
 *
 * ## Why this exists as a job of its own
 *
 * `merge_pr` (the agent's own merge) already does this: `decidePostMergeHandoff`
 * names the `atomaton:origin-agent` tagged in the pull request body, and
 * `dispatchPostMergeAgent` re-invokes it. But a merge made by a PERSON — the only
 * route under `merge.policy: manual`, and always available — goes through
 * `atomaton-pr-merged.wac.ts` instead, and that workflow only aggregated the parent.
 *
 * So a sub-issue's pull request merged by hand skipped the judgement entirely: the
 * parent was aggregated while the sub-issue was still open, on the belief that a
 * merged pull request means the sub-issue is done. It does not — a merge is evidence
 * a change was accepted, not that a requirement was satisfied, which is the whole
 * reason the judgement exists (see `dispatchPostMergeAgent`'s doc comment).
 *
 * This is the workflow's half of that one decision. It reads the same two tags the
 * tool reads, applies the same `decidePostMergeHandoff`, and dispatches the same
 * `dispatchPostMergeAgent` — so the two routes agree by construction rather than by
 * two readers happening to match.
 *
 * ## What it writes
 *
 * `reinvoked=true` when the origin agent was dispatched, so the aggregate job stands
 * down (the judgement re-invokes the parent once the sub-issue is closed). Otherwise
 * `false`, and the aggregate job runs as before: there was no origin agent to ask, or
 * the dispatch failed, and aggregating is the fallback either way — the same fallback
 * `mergePr` takes when its own `dispatchPostMergeAgent` returns false.
 *
 * Env: PR_BODY, PR_NUMBER, OWNER, REPO
 */

import { appendFileSync } from "node:fs";
import { dispatchPostMergeAgent } from "../../adapters/actions/dispatch-targets.ts";
import { ORIGIN_AGENT_TAG, PARENT_ISSUE_TAG } from "../../adapters/github/tags.ts";
import { readTargetState } from "../../adapters/github/target-state.ts";
import { decidePostMergeHandoff } from "../../domain/work/handoff.ts";
import { defineScript } from "./lib/script-ref.ts";

export const ref = defineScript(import.meta.url);

function main(): void {
  const body = process.env.PR_BODY ?? "";
  const prNumber = (process.env.PR_NUMBER ?? "").trim();
  const repo = `${process.env.OWNER ?? ""}/${process.env.REPO ?? ""}`;
  const githubOutput = process.env.GITHUB_OUTPUT;

  const say = (message: string): void => console.error(message);
  const write = (reinvoked: boolean): void => {
    if (githubOutput) appendFileSync(githubOutput, `reinvoked=${reinvoked}\n`);
  };

  const parentIssue = PARENT_ISSUE_TAG.read(body);
  const originAgent = ORIGIN_AGENT_TAG.read(body);
  // Read, not assumed. A pull request body names its parent only when it was opened
  // from an issue run; a root pull request has none, and there is nobody to re-invoke.
  //
  // `readTargetState` with an explicit repo: this job runs in a checkout of the
  // MACHINERY, which may not be the repository the pull request is in. An unread state
  // is treated as NOT closed, so the judgement is preferred over silently aggregating.
  const parentState = parentIssue === undefined ? undefined : readTargetState(parentIssue, repo);
  const parentAlreadyClosed = parentState?.known === true && parentState.state !== "open";

  const handoff = decidePostMergeHandoff({ parentIssue, parentAlreadyClosed, originAgent });

  switch (handoff.kind) {
    case "no-parent":
      say(`PR #${prNumber} has no parent issue; nothing to re-invoke.`);
      write(false);
      return;
    case "already-closed":
      say(`Parent issue #${handoff.parentIssue} is already closed; nothing to re-invoke.`);
      write(false);
      return;
    case "close-directly":
      // No origin agent tagged. This is the fallback the aggregate job already is, so
      // it is left to run rather than duplicated here.
      say(`PR #${prNumber} has no origin agent tagged; the parent will be aggregated.`);
      write(false);
      return;
    case "reinvoke-origin-agent": {
      const dispatched = dispatchPostMergeAgent(repo, handoff.parentIssue, handoff.agent);
      if (dispatched) {
        say(`Re-invoked ${handoff.agent} on #${handoff.parentIssue} to judge the merge.`);
        write(true);
      } else {
        // The intended hand-off failed. Aggregate as the fallback, the same choice
        // `mergePr` makes when its dispatch returns false -- better than a silent wait.
        say(`Could not re-invoke ${handoff.agent} on #${handoff.parentIssue}; the parent will be aggregated.`);
        write(false);
      }
      return;
    }
  }
}

if (import.meta.main) main();
