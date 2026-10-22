/**
 * handoff.ts — decision logic for the serial "Handoff" edges that follow a
 * pull request's outcome: who (if anyone) should be re-invoked to conclude the
 * linked parent WorkItem, versus closing it directly ourselves right now.
 *
 * Two decisions live here, and deliberately not one function with a flag --
 * they read the same three signals and answer the "no origin agent" case with
 * opposite defaults:
 *
 *   - `decidePostMergeHandoff` — what follows a MERGE. Something was delivered,
 *     so a completion has to be processed even when nobody is named to judge
 *     it: the machine closes the issue itself.
 *   - `decideRejectionHandoff` — what follows a close WITHOUT a merge (#267).
 *     Whether the person meant "rejected" or "shipped some other way" is not
 *     readable from the event, so when nobody can be asked, nothing happens.
 *
 * This module says nothing about GitHub, `gh`, or dispatch mechanics --
 * pure decision, testable with plain objects. The actual mechanism (gh pr
 * merge, gh workflow run, closing the issue) lives in mcp/github.ts's
 * mergePr()/dispatchPostMergeAgent()/closeIssueAndDispatch(), and in
 * dispatch-targets.ts's dispatchRejectedPrAgent() for the rejection route.
 *
 * Before this module existed, the post-merge 4-way branch lived inline inside
 * mergePr(), interleaved with the `gh`/dispatch calls that carry it out --
 * readable only by tracing through a single large imperative function.
 */

export type PostMergeHandoff =
  | { kind: "no-parent" }
  | { kind: "already-closed"; parentIssue: number }
  | { kind: "reinvoke-origin-agent"; parentIssue: number; agent: string }
  | { kind: "close-directly"; parentIssue: number };

export interface PostMergeSignals {
  /** The parent WorkItem this merged PR is linked to, if any (from PARENT_ISSUE_TAG). */
  parentIssue: number | undefined;
  /** Is the parent already closed (e.g. GitHub's native "Closes #N" auto-close already succeeded)? */
  parentAlreadyClosed: boolean;
  /** The agent that originally created this PR, if tagged (from ORIGIN_AGENT_TAG). */
  originAgent: string | undefined;
}

/**
 * Decides what should happen to the parent WorkItem right after a PR
 * merges:
 *
 *   1. no linked parent at all -> nothing to do.
 *   2. the parent is already closed (native auto-close beat us to it) ->
 *      nothing to do -- re-invoking an agent to close an already-closed
 *      issue would be a pointless extra LLM call AND risks racing
 *      lib/aggregation.ts's idempotency marker against an independent
 *      event-driven aggregation path for the exact same completion.
 *   3. an origin agent is tagged -> prefer re-invoking THEM to confirm and
 *      close (they get a chance to give a final summary). The caller is
 *      still responsible for falling back to closing directly if that
 *      dispatch attempt itself fails -- this decision only expresses the
 *      PREFERRED handoff, not the outcome of attempting it.
 *   4. no origin agent tagged -> close the parent directly ourselves.
 */
export function decidePostMergeHandoff(signals: PostMergeSignals): PostMergeHandoff {
  if (signals.parentIssue === undefined) return { kind: "no-parent" };
  if (signals.parentAlreadyClosed) return { kind: "already-closed", parentIssue: signals.parentIssue };
  if (signals.originAgent) {
    return { kind: "reinvoke-origin-agent", parentIssue: signals.parentIssue, agent: signals.originAgent };
  }
  return { kind: "close-directly", parentIssue: signals.parentIssue };
}

/**
 * The hand-off for a pull request that was closed WITHOUT merging.
 *
 * `nothing` carries why nothing should happen; `reinvoke-origin-agent` names the
 * agent to return the close to, on the issue the pull request delivers.
 */
export type RejectionHandoff =
  | { kind: "nothing"; why: "no-parent" | "already-closed" | "no-origin-agent" }
  | { kind: "reinvoke-origin-agent"; parentIssue: number; agent: string };

/**
 * Decides what should happen when a pull request is closed without merging --
 * the outcome `decidePostMergeHandoff` never sees, because every job that acted
 * on a closed pull request was gated on `merged == true` and a close-only event
 * started nothing at all (#267).
 *
 * A close is a person's decision, but WHICH decision it is -- "rejected" or
 * "shipped some other way" -- is not readable from the event. Rather than
 * guess, the close is returned to the agent that opened the pull request, which
 * can read the thread and decide; the machine closes nothing itself. That is
 * the same principle as returning a review result to the pull request's origin
 * agent (#215): the judgement is the agent's.
 *
 *   1. no linked issue -> nothing. There is nobody to return the close to.
 *   2. the issue is already closed -> nothing. The person closing the pull
 *      request is saying the issue is finished; starting a run on it would put
 *      an agent on a thread a person has ended.
 *   3. an origin agent is tagged -> return the close to THEM. The branch the
 *      pull request came from still exists and is theirs to resume.
 *   4. no origin agent tagged (a person's own pull request) -> nothing. The
 *      same rule the review path holds: no directive is written for a pull
 *      request no run of ours opened.
 *
 * The signals are `PostMergeSignals` shared for shape, not for meaning: for a
 * rejection, `parentIssue` is the issue the pull request DELIVERS (what
 * `PARENT_ISSUE_TAG` names) and `parentAlreadyClosed` is that issue's state --
 * not the orchestrator parent the merge route resolves.
 *
 * This is deliberately not `decidePostMergeHandoff` with a flag. The two read
 * the same three signals and answer the "no origin agent" case with opposite
 * defaults: a merge nobody authored the judgement for still has a completion to
 * process, so there the machine closes the issue directly (`close-directly`);
 * a close nobody can interpret means the machine does nothing. Sharing the
 * function would put one of the two cases on a default chosen for the other.
 */
export function decideRejectionHandoff(signals: PostMergeSignals): RejectionHandoff {
  if (signals.parentIssue === undefined) return { kind: "nothing", why: "no-parent" };
  if (signals.parentAlreadyClosed) return { kind: "nothing", why: "already-closed" };
  if (signals.originAgent) {
    return { kind: "reinvoke-origin-agent", parentIssue: signals.parentIssue, agent: signals.originAgent };
  }
  return { kind: "nothing", why: "no-origin-agent" };
}
