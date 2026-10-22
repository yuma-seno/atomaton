/**
 * issue-links.ts — what an issue is attached to, and which attachments count.
 *
 * The relationships an issue has are the difference between reading a comment
 * correctly and reading it wrong. "Implemented it" on a sub-issue means a part
 * was implemented, not the feature. "We decided X" reads as settled when the
 * pull request carrying X is merged, and as a proposal when it is still open.
 * Neither is recoverable from the comment text.
 *
 * These are read from GitHub's own relationships rather than from Atomaton's
 * markers, because an issue a person drove by hand has no Atomaton markers on it
 * and is exactly the case that must not silently come back empty.
 *
 * Pure. The GraphQL half lives in `adapters/github/issue-links.ts`.
 */
import type { NodeState } from "./work-tree.ts";

export interface LinkedIssue {
  number: number;
  title: string;
  /**
   * How the work there stands, in the one vocabulary the tree uses.
   *
   * It was `string`, holding GitHub's own state lowercased, which is how this
   * module came to carry a second spelling of something `work-tree.ts` already
   * names — and why `LinkedPr` needed a `merged` flag beside it. See `NodeState`
   * for why `closed` was not an answer worth keeping.
   */
  state: NodeState;
}

/**
 * A sub-issue, with what a gate needs to judge it.
 *
 * `labels` is here and not on [`LinkedIssue`] because only the children are judged:
 * `sibling-check.ts` counts the ones Atomaton dispatched, and `work-tree.ts` needs to
 * know which are running before it stops a subtree. A parent or a pull request is
 * shown, not judged.
 *
 * It is also why the tool surface projects it away. These arrive in the same request
 * as the rest — one query, no extra round trip — but a label array per child in every
 * `get_issue` response is tokens spent on something no reader asked for.
 */
export interface LinkedChild extends LinkedIssue {
  readonly labels: readonly string[];
}

/**
 * A pull request linked to an issue.
 *
 * Nothing of its own any more. It carried `merged: boolean`, whose comment made
 * exactly the argument `NodeState` now makes — *GitHub says only `closed` for both
 * a merged pull request and an abandoned one, and those mean opposite things* —
 * and compensated for it with a second field. `state` answers it: a pull request
 * that is `done` is one that merged. Nothing ever read the flag.
 *
 * Kept as a name because the three lists on [`IssueLinks`] are three different
 * things and reading `LinkedIssue[]` for all of them would say they are not.
 */
export type LinkedPr = LinkedIssue;

export interface IssueLinks {
  /**
   * What the number resolved to: `issue` or `pull_request`.
   *
   * The same GraphQL request already answers it (`issueOrPullRequest` exists
   * because `issue(number:)` answers only for an issue), so carrying it costs
   * nothing — and it is what lets an issue-shaped read that was pointed at a
   * pull request say so, instead of leaving the caller to wonder why the links
   * read like a leaf. Absent when the links could not be read at all.
   */
  kind?: "issue" | "pull_request";
  parent?: LinkedIssue;
  children: LinkedChild[];
  pullRequests: LinkedPr[];
  /**
   * Why the links could not be read, when they could not.
   *
   * Absent means the lists above are the answer. Present means they are empty
   * because nobody could look, which is a different fact -- and the one
   * `get_issue_comments`' header rests its whole value on: "'Implemented it'
   * on a sub-issue whose pull request is still open is a proposal, not a
   * fact." A failed read silently produced exactly the reading that comment
   * exists to prevent.
   *
   * Not throwing stays right -- this decorates a read that already succeeded.
   * Reporting the degradation is the part that was missing.
   */
  unavailable?: string;
}

/**
 * GitHub's closing keywords, as GitHub documents them.
 *
 * Matching these ourselves is not a preference for reinventing the parser. It
 * is the only way to see a sub-issue's pull request at all: GitHub forms its
 * own closing link only for pull requests that target the default branch, and
 * Atomaton aims a sub-issue's pull request at its parent's branch. Measured on
 * this repository, #281's `Closes #281` in PR #284 produced no native link
 * because the pull request targeted `atomaton/issue-280`, while the parent's did because its pull
 * request targeted `main`.
 */
/**
 * Every keyword GitHub acts on, and only those.
 *
 * Checked against the documentation rather than remembered: close/closes/closed,
 * fix/fixes/fixed, resolve/resolves/resolved, and nothing else. Case and an optional
 * colon are handled where this is used, since GitHub accepts `CLOSES: #10` too.
 *
 * One definition because three callers read it, and a keyword missing from one of them
 * is a hole nobody sees: the reader would report no link, and the guard would allow what
 * it exists to stop.
 */
const CLOSING_KEYWORDS = "close[sd]?|fix(?:e[sd])?|resolve[sd]?";

/**
 * The line that names the issue a pull request belongs to, without asking GitHub
 * to act on it.
 *
 * `Closes #N` used to be written here, for a reason that was correct and is now
 * gone: GitHub forms its own closing link only for a pull request aimed at the
 * default branch, so a sub-issue's stacked pull request appeared linked by
 * nothing — and the keyword was the only thing that made a link at all. It also
 * closed the issue whenever the pull request was aimed at the default branch,
 * which is not the same thing as linking and is not always wanted. On #167 that
 * closed #166, whose own close condition was unmet (#171).
 *
 * GitHub has no keyword that links without closing. Measured against its
 * documentation: the closing keywords are interpreted **only** when the pull
 * request targets the default branch, and for any other branch "these keywords
 * are ignored, no links are created". So a link and a close cannot be separated
 * by choosing a keyword — only by not using one.
 *
 * `Part of #N` is not a keyword, so GitHub acts on it in neither direction and
 * the two paths agree for the first time: a pull request aimed anywhere carries
 * the same line, and merging closes nothing by itself. The link a person sees is
 * the cross-reference this produces — "referenced this issue" in the timeline —
 * and the machine's link is `PARENT_ISSUE_TAG`, which every reader here already
 * prefers. See `parent-issue.ts` for why the tag is what decides.
 */
export function partOfLine(issue: number): string {
  return `Part of #${issue}`;
}

/**
 * Every closing reference in a piece of text, in the order they appear.
 *
 * Asked of text an agent wrote, before it becomes something GitHub will act on.
 *
 * ## Why this one matches more than a reader
 *
 * GitHub documents two reference syntaxes after a keyword:
 *
 * ```text
 *   Closes #10                          same repository
 *   Fixes octo-org/octo-repo#100        another repository
 * ```
 *
 * A reader asking "which issue does this close" reads only the first, correctly: it
 * answers a question about issues in *this* repository, and a cross-repository
 * reference is not one. A guard cannot share that blind spot. A closing keyword
 * aimed at another repository is the more dangerous of the two, because nothing in
 * this repository shows it happened — measured here, the form has never been
 * written, which is exactly the kind of thing that is true until it is not.
 *
 * ## What is skipped
 *
 * Code spans and fenced blocks, because GitHub does not act on a keyword inside one
 * and neither should a rule about it. Documentation explaining `Closes #N` is not an
 * attempt to close anything, and refusing it would make the rule unwritable in its
 * own docs.
 */
export function closingReferences(text: string): string[] {
  const pattern = new RegExp(
    `\\b(?:${CLOSING_KEYWORDS})\\s*:?\\s+((?:[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)?#\\d+)\\b`,
    "gi",
  );
  const found: string[] = [];
  for (const segment of outsideCode(text)) {
    for (const match of segment.matchAll(pattern)) {
      const whole = match[0].trim();
      if (!found.includes(whole)) found.push(whole);
    }
  }
  return found;
}

/**
 * Why a piece of agent-written text cannot be sent as it stands, or nothing.
 *
 * A refusal rather than an escape, which is the opposite of what `mention.ts` does to a
 * mention it cannot vouch for. The difference is what is left behind: an escaped mention
 * reads as a name somebody wanted to reach, while an escaped \`Closes #1\` is litter in a
 * pull request a person has to read past. Refusing gets the body rewritten, so the human
 * receives the corrected version and nothing else.
 *
 * It names the route that does work. Measured three times in this project on three
 * different guards: a refusal that says what to do instead is followed, and one that
 * only states a rule is not.
 */
export function closingKeywordRefusal(found: readonly string[], what: string): string | undefined {
  if (found.length === 0) return undefined;
  const quoted = found.map((f) => `"${f}"`).join(", ");
  return (
    `This ${what} contains ${quoted}, which GitHub acts on: merging would close ` +
    "whatever issue that names, without going through the path that cleans up labels and " +
    "tells a parent its child is done. Remove it and try again. To close an issue, call " +
    "request_close_issue; to link this work to the issue it belongs to, do nothing -- " +
    "that link is added for you."
  );
}

/** A fenced code block, or an inline code span. The same rule `mention.ts` uses. */
const CODE = /```[\s\S]*?```|`[^`\n]*`/g;

/** The parts of `text` that are not inside code. */
function outsideCode(text: string): string[] {
  const out: string[] = [];
  let last = 0;
  for (const match of text.matchAll(CODE)) {
    const at = match.index ?? 0;
    out.push(text.slice(last, at));
    last = at + match[0].length;
  }
  out.push(text.slice(last));
  return out;
}


/** Combine link lists from several sources, first mention of a number winning. */
export function dedupeByNumber<T extends { number: number }>(...lists: T[][]): T[] {
  const seen = new Map<number, T>();
  for (const list of lists) for (const item of list) if (!seen.has(item.number)) seen.set(item.number, item);
  return [...seen.values()].sort((a, b) => a.number - b.number);
}
