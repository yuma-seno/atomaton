import { gh } from "../../../adapters/github/gh.ts";
import { resolveNotify } from "../../../adapters/github/notify.ts";
import {
  describeGateResult,
  dispatchOrchestratorIfSubIssueReady,
  type DispatchGateResult,
} from "../../../app/aggregation.ts";
import { closeRequestComment } from "../../../domain/work/close-request.ts";
import { isHumanAuthor } from "../../../domain/work/actor.ts";
import { turnCommentBody } from "../../../adapters/github/turn-comment.ts";
import type { GhIssueAuthor } from "../../../adapters/github/wire-types.ts";

export interface ConcludeIssueResult {
  /**
   * Whether this closed the issue or asked its author to.
   *
   * Both are conclusions, and the caller ends the session on either. The
   * distinction exists because the two leave the world differently — only a
   * closed issue wakes its parent — not because one of them failed. See
   * `domain/work/close-request.ts` for why the second is not a refusal.
   */
  outcome: "closed" | "close-requested";
  /**
   * What the parent's aggregation gate did afterwards, when this closed a
   * sub-issue.
   *
   * Carried out rather than discarded. `request_close_issue` ends the
   * atomaton's session, so if the gate could not read what it needed and
   * refused to dispatch, nothing else is left to notice -- the parent simply
   * waits for a re-invocation that will never come.
   */
  aggregation?: DispatchGateResult;
}

/**
 * Throw unless a mutation actually happened.
 *
 * The author lookup below already checks its exit code, with a comment
 * explaining that picking an answer on a failed read "asserts something this did
 * not determine". Both mutations then ignored theirs entirely, which asserts
 * something rather worse: `request_close_issue` is the atomaton's designated
 * terminal action, so it returns `outcome: "closed"`, tells the agent the issue
 * "has been closed automatically", and ends the session — after which nothing is
 * left running to notice that it is still open. `dispatchOrchestratorIfSubIssueReady`
 * then counts siblings against an issue that never closed.
 *
 * The close-requested half is the same shape, and worse now that it reports
 * success: a failed comment means the person named in it is never asked to close
 * anything, while the agent is told the issue is concluded and its session ends.
 *
 * Throwing reaches the agent as a tool error, which is the one moment it can
 * still act.
 */
function mustSucceed(result: { code: number; stdout: string; stderr: string }, what: string): void {
  if (result.code === 0) return;
  throw new Error(`Could not ${what}: ${result.stderr.trim() || result.stdout.trim() || `gh exited ${result.code}`}`);
}

/**
 * Concludes the issue: closes an agent-opened one, asks the author to close a
 * person-opened one.
 *
 * Neither branch fails, and the caller ends the session on both. Who opened the
 * issue is this function's question to ask, not its caller's to handle — see
 * `domain/work/close-request.ts` for the reports that came out of answering it
 * the other way.
 */
export async function concludeIssue(issue: number, reason: string, summary: string): Promise<ConcludeIssueResult> {
  const repo = process.env.GITHUB_REPOSITORY ?? "";
  // The exit code decides, not just the presence of output. An unread author is
  // not a human author: closing the issue outright and telling a person "this was
  // opened directly by a human" are different acts, and picking either one on a
  // failed lookup asserts something this did not determine. The same question is
  // asked fail-loud in `mcp/github.ts` via `ghJsonOrThrow`.
  const { code, stdout } = gh("issue", "view", String(issue), "--repo", repo, "--json", "author");
  if (code !== 0) {
    throw new Error(
      `Could not read the author of issue #${issue}, so this cannot tell whether closing it is yours to do.`,
    );
  }
  const authorInfo = stdout ? (JSON.parse(stdout) as GhIssueAuthor) : {};
  // Absent field still means "treat as a person", which is the cautious half of
  // the pair: it hands the decision to someone rather than taking it. The rule is
  // `domain/work/actor.ts`'s, shared with every other reader of the same fact.
  const isBot = !isHumanAuthor(authorInfo.author?.is_bot);

  let body = `Atomaton: the agent on this issue considers its work complete.\n\n**Reason:** ${reason}`;
  if (summary) {
    body += `\n\n${summary}`;
  }

  if (!isBot) {
    // The request goes above the reason and summary, not after them. It is the
    // only sentence in the comment addressed to the person reading it.
    //
    // `ended: "done"` because this IS the turn ending: the run is over, the issue stays
    // open, and the ball is with the person who was just asked to close it. Leaving it
    // out left the node's last turn event as the `asked` that started the run, so the
    // guard read "the ball is with an agent" and DELETED the person's next comment —
    // which, on this path, is their agreement to close the issue. #90 on the failure
    // notice, and the same defect here, in code written to fix #90. See `turn-comment.ts`.
    const request = closeRequestComment({ notify: resolveNotify(repo, issue), body });
    mustSucceed(
      gh("issue", "comment", String(issue), "--repo", repo, "--body", turnCommentBody({ ended: "done", audience: "person", body: request })),
      `comment on issue #${issue}`,
    );
    // stderr, where the tool's own decisions belong. Putting it in the result is
    // what put it in the agent's report.
    console.error(`close requested: issue=#${issue} (opened by a person, left open for them)`);
    return { outcome: "close-requested" };
  }

  // The conclusion itself. `audience: "model"` because this is what the parent agent
  // reads when it aggregates what its children found — the reason and the summary are
  // written for that reader, and were reaching it only because an untagged comment is
  // included by default rather than by anybody deciding.
  //
  // `ended: "done"` for the same reason as the branch above: this run is over and the
  // session ends on this call. It closes the issue just below, so the thread has an
  // answer either way — but a close is not an event to `domain/work/thread.ts`, and the
  // turn's ending has to be written down rather than inferred from one.
  mustSucceed(
    gh("issue", "comment", String(issue), "--repo", repo, "--body", turnCommentBody({ ended: "done", audience: "model", body })),
    `comment on issue #${issue}`,
  );
  mustSucceed(gh("issue", "close", String(issue), "--repo", repo), `close issue #${issue}`);
  console.error(`closed: issue=#${issue} (bot-authored)`);
  const aggregation = await dispatchOrchestratorIfSubIssueReady(repo, issue);
  console.error(describeGateResult(aggregation, issue));
  return { outcome: "closed", aggregation };
}