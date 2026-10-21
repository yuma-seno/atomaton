/**
 * ending-comment.ts — which comment a run ended on, recorded and read back.
 *
 * ## Why a file at all
 *
 * A run ends two ways, and the machinery used to know only one of them. When the
 * model returns prose, `post_result_comment.ts` posts the report with the footer
 * (run link, tokens, metrics, tool trouble) attached. When a tool ends the session
 * — `create_pr`, `launch_sub_agent`, `request_close_issue`, `reload_environment` —
 * that tool posts its own turn-ending comment and the machinery skips, so the
 * footer never went out on those runs at all, and the token figure the metrics
 * report reads off comment footers (`token-line.ts` → `write_metrics_report.ts`)
 * missed every one of them.
 *
 * The two halves run in different processes, hours apart: the tool server writes
 * this record mid-run, and the machinery step reads it after the agent has
 * stopped. A file in `$ATOMATON_RUN_DIR` is the one place both can reach without
 * a second GitHub read, and the directory is per-run, so nothing outlives the run
 * it belongs to.
 *
 * ## The rule this serves
 *
 * The footer goes on the ONE comment that ended the run's turn — not on a second
 * comment beside it, and not on the artifacts a tool also leaves (sub-issue
 * bodies, PR bodies, dispatch notices), which outlive the run the footer is about.
 * `post_result_comment.ts` appends the footer onto the comment recorded here
 * instead of posting a new one.
 *
 * ## What it does not decide
 *
 * Not whether a comment ends a run's turn — the callers do, from the same fact
 * that decides their `session_ends` meta. A record written for a call that did
 * NOT end the session would put the footer on a comment while the run went on to
 * write another one, and the rule above would be broken by the very code that
 * holds it.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { gh } from "./gh.ts";

export interface EndingComment {
  /** The comment's id, as `gh issue comment` printed it. */
  commentId: string;
  /** The issue or pull request the comment is on. */
  node: string;
}

/** Where the record lives, or nothing when this run does not know its own directory. */
export function endingCommentPath(): string | undefined {
  const dir = (process.env.ATOMATON_RUN_DIR ?? "").trim();
  return dir ? `${dir}/ending-comment.json` : undefined;
}

/**
 * The comment id in what `gh issue comment` printed, or nothing.
 *
 * `gh` prints the comment's URL — `.../issues/5#issuecomment-42` — and the number
 * after the fragment is the id the API PATCH takes. Empty output is a comment that
 * failed or a fake that printed nothing; the callers treat it as "no id to record",
 * which is what the machinery's own fallback is for.
 */
export function commentIdFromUrl(stdout: string): string | undefined {
  const match = /#issuecomment-(\d+)\s*$/.exec(stdout.trim());
  return match?.[1];
}

/**
 * Record the comment a run ended on.
 *
 * Silent when the run's directory is unknown or the id is missing: the footer is
 * an addition to a comment that already went out, never a precondition for it, and
 * a recording that failed must not fail the tool that just posted successfully.
 */
export function recordEndingComment(commentId: string | undefined, node: string): void {
  if (!commentId) return;
  const path = endingCommentPath();
  if (!path) return;
  try {
    writeFileSync(path, JSON.stringify({ commentId, node } satisfies EndingComment));
  } catch (e) {
    console.error(`could not record the ending comment: ${(e as Error).message}`);
  }
}

/**
 * The recorded comment, or nothing.
 *
 * Every failure here is a real outcome, not an error: without a record the
 * machinery posts as it always did, and the only cost is the old behavior for one
 * run. A file that is missing, unreadable or holds no id means "no comment to
 * append onto" — there is nothing to guess a comment from.
 */
export function readEndingComment(path: string | undefined): EndingComment | undefined {
  if (!path || !existsSync(path)) return undefined;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<EndingComment>;
    if (typeof parsed.commentId !== "string" || !parsed.commentId) return undefined;
    return { commentId: parsed.commentId, node: parsed.node ?? "" };
  } catch {
    return undefined;
  }
}

/**
 * Post a comment that ends a run's turn, and record it when the caller's result
 * ends the session.
 *
 * `sessionEnds` is the caller's own answer, known where the comment is built:
 * `create_pr` (`validationDispatched`), `launch_sub_agent` (`complete`). A caller
 * that learns it only after posting — `reload_environment`, whose dispatch is
 * attempted after the comment is up — passes nothing and calls
 * `recordEndingComment` itself once the dispatch has succeeded.
 *
 * Returns the comment id, so such a caller has it to record. A failed post is
 * logged, not thrown: the comment is one of several things the call has already
 * done by the time it can fail, and a throw would make the caller retry work
 * that did succeed.
 */
export function postTurnComment(args: {
  number: string;
  body: string;
  /** Passed through to `gh`; the CLI resolves the repository from the environment without it. */
  repo?: string;
  sessionEnds?: boolean;
}): string | undefined {
  const cmd = ["issue", "comment", args.number];
  if (args.repo) cmd.push("--repo", args.repo);
  cmd.push("--body", args.body);
  const { code, stdout, stderr } = gh(...cmd);
  if (code !== 0) {
    console.error(`could not comment on issue ${args.number}: ${stderr || stdout}`);
    return undefined;
  }
  const commentId = commentIdFromUrl(stdout);
  if (args.sessionEnds) recordEndingComment(commentId, args.number);
  return commentId;
}
