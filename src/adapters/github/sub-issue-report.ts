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
 *
 * ## The one comment a completion gets
 *
 * The report is not the only thing the machinery wants to say about a finished child: a
 * gate that finds siblings still open posts a "N sub-task(s) still in progress" line.
 * That line used to be a comment of its own, next to the report the same completion had
 * already left on the same thread — two comments, and two notifications to everyone
 * watching, for one event. It is edited into the report now (`mergeProgressIntoReport`
 * below), because an edit reaches the same readers and notifies nobody. The line itself
 * is prose, never a command: the report is `llm-context=include`, so a line beginning
 * with `/` would read to the parent's own thread readers as somebody asking that node
 * for an agent — and an ask nothing claimed is what makes the gate answer `parent-busy`
 * and take its marker back.
 */
import { gh } from "./gh.ts";
import { issueLinks } from "./issue-links.ts";
import { listComments } from "./thread.ts";
import { LLM_CONTEXT_TAG, withoutTags } from "./tags.ts";
import { isHumanActor } from "../../domain/work/actor.ts";
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
 * The folded block the parent's thread carries: `<details>`, so a thread with
 * several finished children is still scannable, with `llm-context` written as
 * `include` because this is context the parent's aggregation is meant to read
 * rather than bookkeeping.
 *
 * The child's number is in the body rather than the summary line, so the summary keeps
 * the one spelling the folded-report convention has.
 */
export function subIssueReportBody(report: SubIssueReport): string {
  // The child's words are not this machinery's speech, and they land on a node whose
  // state readers act on: tags are stripped first (a quoted `atomaton:aggregated=N`
  // would make the gate answer `already-aggregated` and leave the parent with no marker
  // to take back), then command lines are defused. Our own `llm-context` line is added
  // below, so it cannot be stripped by either.
  const said = withoutCommands(withoutTags(report.report.trim()));
  const lines = [
    ...subIssueReportHeaderLines(report.child),
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
 * The opening of a report, which is the one thing that says "this child's report".
 *
 * Written by `subIssueReportBody` and matched by `findSubIssueReport` from this one
 * function, so the writer and the finder cannot drift. It is a PREFIX and not the
 * fold or the heading on their own, because both of those can appear later inside the
 * child's own words: a report whose text quotes `**Sub-issue #9**` must not be taken
 * for #9's report. Nothing the child wrote can precede this opening — the machinery
 * writes it first.
 *
 * The `sub-result` tag is deliberately not what the finder keys on either: the
 * fallback progress comment carries that tag too, and taking it for a report would
 * rewrite a person-facing sentence into a fold nobody asked for — while the child's
 * own run then posts its report after it, which is the two comments this exists to
 * avoid.
 */
const REPORT_FOLD_OPEN = "<details><summary>Report</summary>";

function subIssueReportHeaderLines(child: number): string[] {
  return [LLM_CONTEXT_TAG.write("include"), REPORT_FOLD_OPEN, "", `**Sub-issue #${child}**`];
}

/**
 * The line a parent's thread gets while its subtree is still open.
 *
 * Wording unchanged from the comment it replaces, because this is what a person reads
 * about a finished child that is not the last one. No leading `/` and no tag: see the
 * module comment for the one this lands in.
 */
export function subIssueProgressLine(child: number, remaining: number): string {
  return `Atomaton: Sub-task #${child} completed. ${remaining} sub-task(s) still in progress.`;
}

/** How every line of that family starts, which is how a later run recognises its own. */
const PROGRESS_OPENING = "Atomaton: Sub-task #";

/**
 * `body` with the progress line replaced by `line`.
 *
 * Replaced, not appended. The gate can run more than once over the same completion — a
 * retried event, two callers racing — and it is idempotent only if the second run
 * produces the same body as the first, while the count it carries can have changed in
 * between as siblings closed. The line is recognised by the opening of the sentence
 * family this module writes, so a body with no such line is simply appended to.
 */
export function withProgressLine(body: string, line: string): string {
  const kept = body.split("\n").filter((text) => !text.trimStart().startsWith(PROGRESS_OPENING));
  return `${kept.join("\n").replace(/\s+$/, "")}\n\n${line}`;
}

/** A comment on the parent's thread, as the merger below needs it. */
export interface SubIssueComment {
  /** What `--method PATCH repos/{repo}/issues/comments/{id}` takes. */
  id: string;
  body: string;
}

/**
 * `child`'s report on its parent, if the child's closing run has posted it yet.
 *
 * Throws when the thread cannot be read, like every other reader of it: "there is no
 * report" and "the report could not be looked for" lead to the same fallback here, and
 * the caller reports that in the log rather than deciding on a read that failed.
 */
export function findSubIssueReport(repo: string, parent: number, child: number): SubIssueComment | undefined {
  const header = subIssueReportHeaderLines(child).join("\n");
  for (const comment of listComments(repo, parent)) {
    const body = comment.body ?? "";
    // A person's words are their own, even when they quote this shape.
    if (isHumanActor(comment.user?.type)) continue;
    if (!body.trimStart().startsWith(header)) continue;
    return { id: String(comment.id), body };
  }
  return undefined;
}

/**
 * `child`'s report comment on `parent`, edited to carry `line`. True when the thread
 * has no second comment for this completion to make.
 *
 * False when there is no report to edit yet, or the edit did not land, and the gate then
 * posts the line as its own comment exactly as it did before. Losing the race costs a
 * comment and never information: the line says the same thing either way, and no
 * decision anywhere reads it.
 */
export function mergeProgressIntoReport(repo: string, parent: number, child: number, line: string): boolean {
  let found: SubIssueComment | undefined;
  try {
    found = findSubIssueReport(repo, parent, child);
  } catch (error) {
    console.error(`[atomaton-report] could not look for #${child}'s report on #${parent}: ${(error as Error).message}`);
    return false;
  }
  if (found === undefined) return false;

  const body = withProgressLine(found.body, line);
  // Already carrying this exact line (the second run over the same completion).
  if (body === found.body) return true;

  const { code, stdout, stderr } = gh(
    "api",
    `repos/${repo}/issues/comments/${found.id}`,
    "--method",
    "PATCH",
    "-f",
    `body=${body}`,
  );
  if (code !== 0) {
    console.error(
      `[atomaton-report] WARN could not add the progress line to #${child}'s report on #${parent}: ${stderr || stdout}`,
    );
    return false;
  }
  return true;
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
 * The child's words, with anything a reader would take for a command defused.
 *
 * The report lands on a node that is very much alive, and the gate under it is about to
 * wake that node's agent. Two forms count, and each does its own damage: a `/name` line
 * is somebody asking for an agent, and an ask nobody claimed is what makes the gate stand
 * down with `parent-busy` and take its `atomaton:aggregated` marker back; a
 * `<!-- atomaton:dispatch=name -->` line is the machinery's own marker, which
 * `mostRecentAgentOn` reads as the agent the parent was asked for. Neither is
 * hypothetical — a directive is the ordinary way a model's report ends.
 *
 * Escaped rather than removed: a backslash in front of the character the reader starts
 * at is rendered away by CommonMark, so the page reads unchanged while the stored text
 * no longer begins with a command.
 *
 * `commandLinesIn` is the definition of which lines those are, shared with the guards
 * that refuse an agent-written body for the same reason. It matches BOTH forms through
 * `parseCommentCommand`, which is why the escape cannot be a search for `/`.
 */
function withoutCommands(text: string): string {
  const commandLines = new Set(commandLinesIn(text));
  if (commandLines.size === 0) return text;
  return text
    .split("\n")
    .map((line) => (commandLines.has(line.trim()) ? defuseCommandStart(line) : line))
    .join("\n");
}

/**
 * A backslash in front of the character the parser starts at — `/` for a command, `<`
 * for a dispatch marker.
 *
 * Found by searching for the first of either and not by position, because `lineForms`
 * strips list bullets and quote markers before it reads: `- /engineer` is a command to
 * the ask reader, and the backslash has to go after the bullet rather than in front of
 * it.
 */
function defuseCommandStart(line: string): string {
  const at = line.search(/[<\/]/);
  return at < 0 ? line : `${line.slice(0, at)}\\${line.slice(at)}`;
}
