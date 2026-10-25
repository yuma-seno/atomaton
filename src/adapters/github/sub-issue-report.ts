/**
 * sub-issue-report.ts — how a finished sub-issue's result reaches its parent.
 *
 * ## The gap this fills
 *
 * Three things can notice that a sub-issue is done, and only one of them used to hand
 * the parent anything to read. A pull request merge triggered `aggregate_sub_issues.ts`,
 * which read every child's title and linked pull requests and wrote them into the
 * parent's persisted session on the `atomaton-data` branch (`beforeDispatch` in
 * `app/aggregation.ts`). The two IN-PROCESS closes — `request_close_issue`'s
 * `concludeIssue`, and `merge_pr`'s close-directly fallback — reached the same gate
 * having told nobody, so a parent woken by one of those was re-invoked with no idea what
 * its children had done. Worse, it was the path where the child's own words existed:
 * `request_close_issue`'s `summary` is written for the parent to read, and it was posted
 * to the CHILD's thread, which the parent never opens.
 *
 * ## Why a comment, and not the session file
 *
 * The injection was reachable only from the workflow-side path because it is a write to
 * a file on the `atomaton-data` orphan branch — a git artifact that the machinery
 * scripts own (`entrypoints/machinery/lib/atomaton-data.ts`) and that an MCP tool
 * running inside an agent's job has no reason to touch. But the summary the two
 * in-process paths hold does not need a file: it is text, and the parent's thread is
 * the one medium both sides already write to and both sides already read. So the report
 * is a comment on the parent, and the parent's next run reads it exactly the way it
 * reads everything else that happened there.
 *
 * ## What is NOT posted, and why that is right
 *
 * The two workflow-side completions — a person closing a sub-issue by hand, and a person
 * merging its pull request — have no summary to carry: no agent ran, and nothing wrote
 * down what it found. There is nothing to say beyond what GitHub already shows, so
 * nothing is said. That is the existing behaviour of both gates, unchanged.
 */
import { gh } from "./gh.ts";
import { issueLinks } from "./issue-links.ts";
import { LLM_CONTEXT_TAG } from "./tags.ts";
import { commandLinesIn } from "../../domain/work/comment-command.ts";
import type { LinkedPr } from "../../domain/work/issue-links.ts";

export interface SubIssueReport {
  /** The sub-issue that finished. */
  child: number;
  /** What its closing run said, in its own words. Empty when it said nothing. */
  report: string;
  /**
   * The pull requests GitHub links to the child.
   *
   * `undefined` means they could not be read, which is not the same answer as an empty
   * list and is reported as its own sentence — the same rule that made the old
   * `gatherSubResults` track "none found" and "could not look" apart.
   */
  pullRequests?: readonly LinkedPr[];
}

/**
 * The folded block the parent's thread carries: `<details>` like `launch_sub_agent`'s
 * report, so a thread with several finished children is still scannable, with
 * `llm-context` written as `include` because this is context the parent's aggregation
 * is meant to read rather than bookkeeping.
 *
 * The child's number is in the body rather than the summary line, so the summary keeps
 * the one spelling the folded-report convention has.
 */
export function subIssueReportBody(report: SubIssueReport): string {
  const said = withoutCommands(report.report.trim());
  const lines = [
    LLM_CONTEXT_TAG.write("include"),
    "<details><summary>Report</summary>",
    "",
    `**Sub-issue #${report.child}**`,
    "",
    ...(said === "" ? ["Its closing run wrote no summary."] : [said]),
    "",
  ];

  if (report.pullRequests === undefined) {
    lines.push("Its pull requests could not be read.");
  } else if (report.pullRequests.length === 0) {
    lines.push("No pull requests are linked to it.");
  } else {
    lines.push("Linked pull requests:", ...report.pullRequests.map((pr) => `- #${pr.number} ${pr.title} (${pr.state})`));
  }

  lines.push("", "</details>");
  return lines.join("\n");
}

/**
 * Post `child`'s report on the issue it is under.
 *
 * Returns whether anything was posted. A root issue has no parent and gets nothing —
 * there is no thread to carry it — and a read that failed posts nothing either, because
 * where the report goes is the one thing this cannot guess. Neither is an error: the
 * close it follows has already happened, and a parent that gets no report is where the
 * machinery was before this module existed.
 */
export function reportSubIssueToParent(repo: string, child: number, report: string): boolean {
  const links = issueLinks(repo, child);
  if (links.unavailable) {
    console.error(
      `[atomaton-report] WARN could not read #${child}'s parent, so nothing was posted there: ${links.unavailable}`,
    );
    return false;
  }

  const parent = links.parent?.number ?? 0;
  if (parent === 0) return false;

  const body = subIssueReportBody({ child, report, pullRequests: links.pullRequests });
  const { code, stdout, stderr } = gh("issue", "comment", String(parent), "--repo", repo, "--body", body);
  if (code !== 0) {
    console.error(`[atomaton-report] WARN could not post #${child}'s report on #${parent}: ${stderr || stdout}`);
    return false;
  }
  return true;
}

/**
 * The child's words, with any line a reader would take for a command escaped.
 *
 * The report lands on a node that is very much alive, and the note under it is about to
 * wake that node's agent. On the parent, a `/name` alone on a line is somebody asking
 * for an agent; an ask nobody claimed is exactly what makes the aggregation gate stand
 * down with `parent-busy` and take its marker back, so the report meant to shorten the
 * parent's wait would be the thing that cancelled it. This is not hypothetical: a
 * directive line is the ordinary way an agent's report ends.
 *
 * Escaped with a backslash rather than edited, because CommonMark renders `\/name` as
 * `/name` — the page reads unchanged while the stored text no longer begins with a
 * command. `commandLinesIn` is the definition of which lines those are, shared with the
 * guards that refuse an agent-written body for the same reason.
 */
function withoutCommands(text: string): string {
  const commandLines = new Set(commandLinesIn(text));
  if (commandLines.size === 0) return text;
  return text
    .split("\n")
    .map((line) => (commandLines.has(line.trim()) ? line.replace("/", "\\/") : line))
    .join("\n");
}
