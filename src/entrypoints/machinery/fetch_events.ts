#!/usr/bin/env bun
/**
 * fetch_events.ts — Fetch all GitHub events for an Issue or PR as a JSON
 * array (sorted by created_at), written to --out.
 *
 * Each event has: {id, event_type, content, author, created_at, sha?}
 *
 * Event types:
 *   issue_opened           — Issue body
 *   issue_comment          — Issue comment
 *   pr_opened               — PR body
 *   pr_diff                 — PR current diff (stable ID: "pr-{number}-diff")
 *   pr_comment               — PR conversation comment
 *   pr_review                — PR review submission (state + body)
 *   pr_review_comment        — PR inline review comment
 *
 * Usage:
 *   fetch_events.ts --type issue|pr --number N [--max-diff-chars N] --out events.json
 *
 * Requires GITHUB_REPOSITORY (owner/repo) in the environment.
 * Writes `session_type` / `session_number` to $GITHUB_OUTPUT: the node of the
 * CONVERSATION this run joins. A PR linked via `<!-- atomaton:parent-issue=N -->`
 * resolves to that canonical issue so issue and PR runs share one serial
 * conversation/session; a sub-issue resolves to itself. That resolution is
 * deliberate, and it is deliberately NOT the node the run sits on — the runner
 * puts the run's own node in the agent's `NUMBER` / `TYPE` (see
 * `adapters/runner/run-node.ts`). One env name carrying both meanings was what
 * #248 was.
 *
 * An issue with a parent carries `**Sub-issue of:** #N` on its body event —
 * the issue-side counterpart of the PR body's `**Linked Issue:** #N` — so a
 * child run can see where it sits in the tree without a lookup of its own.
 */
import { appendFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { parentIssueOf } from "../../adapters/github/parent-issue.ts";
import { gh, ghJson, ghPaginated, ghRead } from "../../adapters/github/gh.ts";
import { AGENT_TAG, LLM_CONTEXT_TAG, PARENT_ISSUE_TAG, withoutTags } from "../../adapters/github/tags.ts";
import { keptCommentIds, listComments, type Comment } from "../../adapters/github/thread.ts";
import { isNodeType } from "../../domain/work/node-type.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface FetchEventsArgs {
  type: string;
  number: string | number;
  "max-diff-chars"?: string | number;
  out: string;
}

export const ref = defineScript<FetchEventsArgs>(import.meta.url);

export interface GithubEvent {
  id: string | number;
  event_type: string;
  content: string;
  author: string;
  /**
   * `user.type` from the API: `"User"`, `"Bot"`, `"Organization"`, ...
   *
   * Carried so a reader can tell a person from the machinery by the rule the API
   * decides (`domain/work/actor.ts`) rather than by a `[bot]` suffix on the login,
   * which is part of a name anyone can choose. Absent for events the API does not
   * attribute to a user (the diff), which read as a person -- the cautious side.
   */
  author_type?: string;
  /**
   * The `llm-context` tag's value, read from the RAW body before `withoutTags` strips
   * it.
   *
   * It has to be carried rather than re-read downstream: `withoutTags` removes every
   * tag on the way out, so a reader that looked for `llm-context=exclude` in the
   * written file would never find it and the exclusion would silently never fire.
   * That is exactly what happened -- the filter in `reconcile_github_session.ts` was
   * dead, and every operational notice reached the model.
   */
  llm_context?: string;
  /**
   * The `atomaton:agent` tag's value, read from the RAW body before `withoutTags`
   * strips it. Same reason as `llm_context`: it names which agent wrote a result
   * comment, and the tag is gone by the time the file is read.
   */
  agent?: string;
  created_at: string;
  sha?: string;
}

interface GhIssueApi {
  number: number;
  title: string;
  body: string | null;
  labels: { name: string }[];
  user: { login: string; type?: string };
  created_at: string;
}

interface GhPrApi {
  number: number;
  title: string;
  body: string | null;
  user: { login: string; type?: string };
  created_at: string;
  updated_at: string;
  labels: { name: string }[];
  head: { sha: string };
}

interface GhReviewApi {
  id: number;
  body: string | null;
  state: string;
  user: { login: string; type?: string };
  submitted_at: string | null;
}

interface GhReviewCommentApi {
  id: number;
  path: string;
  line: number | null;
  original_line: number | null;
  body: string;
  user: { login: string; type?: string };
  created_at: string;
}

export interface FetchEventsResult {
  events: GithubEvent[];
  sessionType: "issue" | "pr";
  sessionNumber: number;
}

function repoParts(): [string, string] {
  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const [owner, name] = repo.split("/", 2);
  if (!owner || !name) throw new Error(`GITHUB_REPOSITORY is not set or malformed: "${repo}"`);
  return [owner, name];
}

/**
 * Fetch a list that adds context, tolerating a GitHub that cannot supply it.
 *
 * On 2026-08-17 `pulls/{n}/reviews` returned 404 for every pull request in this
 * repository while every other endpoint answered normally — a GitHub-side
 * failure, not ours. `ghPaginated` throws on any non-zero exit, so one degraded
 * endpoint took down every agent run at this step, and the surfaced error
 * ("Fetch GitHub events" failed) gave nobody a reason to suspect GitHub.
 *
 * A missing review list is not a reason to abandon a run. The engineer can still
 * implement, the reviewer can still read the diff and the comments. So the ones
 * that only enrich degrade to empty and say so, and only what the run cannot
 * have a subject without — the issue or the pull request itself — still fails.
 *
 * The diff already worked this way (`diffResult.code === 0 ? ... : ""`); this
 * applies the same judgement to the rest.
 */
function contextList<T>(what: string, ...args: string[]): T[] {
  try {
    return ghPaginated<T>(...args);
  } catch (error) {
    console.error(
      `::warning::Could not fetch ${what}: ${(error as Error).message}. Continuing without it — the run has less context than usual.`,
    );
    return [];
  }
}

/**
 * The node's whole thread, through `listComments` — the one reader of "every comment
 * on this node", so the pages past the first are split there instead of by whichever
 * caller remembered.
 *
 * A failed read is a warning and an empty list, the policy `contextList` had for the
 * same reads: this is enrichment, and a run whose thread could not be read still
 * works, with less context than usual.
 */
function threadComments(what: string, repo: string, number: number): Comment[] {
  try {
    return listComments(repo, number);
  } catch (error) {
    console.error(
      `::warning::Could not fetch ${what}: ${(error as Error).message}. Continuing without it — the run has less context than usual.`,
    );
    return [];
  }
}

/**
 * Fetch something the run cannot proceed without.
 *
 * Fails, but says why. `JSON.parse` on the empty stdout of a failed call throws
 * about unexpected input, which reads as a bug here rather than as the API call
 * that actually failed.
 */
function requiredJson<T>(what: string, ...args: string[]): T {
  // `ghRead`, because this is the call that has to succeed for the run to exist at
  // all, and one HTTP 504 on a pull request lookup ended a run that had nothing wrong
  // with it. Every caller here is a plain GET.
  const { code, stdout, stderr } = ghRead(...args);
  if (code !== 0) {
    throw new Error(`Could not fetch ${what}, which a run cannot proceed without: ${stderr || stdout}`);
  }
  return JSON.parse(stdout) as T;
}

function fetchIssueEvents(
  owner: string,
  repo: string,
  issueNum: number,
  openedType: string,
  commentType: string,
  idPrefix: string,
): GithubEvent[] {
  const issue = requiredJson<GhIssueApi>(`issue #${issueNum}`, "api", `repos/${owner}/${repo}/issues/${issueNum}`);

  // The parent, in the body event itself, because a sub-issue's run otherwise never
  // sees its parent anywhere: it would have to know to call `get_issue` and read the
  // native link for itself before it could learn there was anyone above it. The pull
  // request half of this is `**Linked Issue:** #N` below; this is the issue half,
  // and the pair is what makes the tree visible from inside a run's context.
  //
  // `known` is the distinction the read exists for: `parent: 0` is a root, and a
  // read that failed is neither answer. A failed read adds no line either -- adding
  // nothing is the honest "we do not know" here, and `parentIssueOf` has already
  // logged why. This is enrichment, so it never fails the run the way the issue
  // fetch above does.
  const found = parentIssueOf(`${owner}/${repo}`, issueNum);
  const parentLine = found.known && found.parent > 0 ? `**Sub-issue of:** #${found.parent}\n` : "";
  const labelsLine = issue.labels.length > 0 ? `**Labels:** ${issue.labels.map((l) => l.name).join(", ")}\n` : "";
  const openedEvent: GithubEvent = {
    id: `${idPrefix}-${issue.number}`,
    event_type: openedType,
    content: `Issue #${issue.number}: ${issue.title}\n${labelsLine}${parentLine}\n${issue.body ?? ""}`,
    author: issue.user.login,
    author_type: issue.user.type,
    created_at: issue.created_at,
  };

  const comments = threadComments(`comments on #${issueNum}`, `${owner}/${repo}`, issueNum);
  // The guard deletes a person's comment made while an agent is working, and the
  // deletion is not instant. The model's context is built from this list, so it has
  // to see the thread the guard is producing -- otherwise the agent reads a comment
  // the guard told its author would not be acted on. Same rule as every other reader:
  // `keptCommentIds` is `shapedThread`'s.
  const kept = keptCommentIds(comments);
  const commentEvents: GithubEvent[] = comments
    .filter((c) => kept.has(c.id))
    .map((c) => ({
      id: c.id,
      event_type: commentType,
      content: c.body ?? "",
      author: c.user?.login ?? "",
      author_type: c.user?.type,
      created_at: c.created_at ?? "",
    }));

  return [openedEvent, ...commentEvents];
}

function fetchPrEvents(owner: string, repo: string, number: number, maxDiffChars: number): { events: GithubEvent[]; parentIssue?: number } {
  const pr = requiredJson<GhPrApi>(`pull request #${number}`, "api", `repos/${owner}/${repo}/pulls/${number}`);
  const prBody = pr.body ?? "";
  const parentIssue = PARENT_ISSUE_TAG.readProse(prBody);
  const headSha = pr.head.sha.slice(0, 8);
  const events: GithubEvent[] = [];

  const labelsLine = pr.labels.length > 0 ? `**Labels:** ${pr.labels.map((label) => label.name).join(", ")}` : "";
  const linkedLine = parentIssue ? `**Linked Issue:** #${parentIssue}` : "";
  const prContentLines = [`PR #${number}: ${pr.title}`, labelsLine, linkedLine].filter(Boolean);
  prContentLines.push("", prBody);
  events.push({
    id: `pr-${number}`,
    event_type: "pr_opened",
    content: prContentLines.join("\n"),
    author: pr.user.login,
    author_type: pr.user.type,
    created_at: pr.created_at,
  });

  const diffResult = gh("api", `repos/${owner}/${repo}/pulls/${number}`, "-H", "Accept: application/vnd.github.v3.diff");
  const diff = diffResult.code === 0 ? diffResult.stdout : "";
  if (diff) {
    const truncated = diff.slice(0, maxDiffChars);
    let diffContent = "```diff\n" + truncated + "\n```";
    if (diff.length > maxDiffChars) diffContent += `\n\n*[Diff truncated at ${maxDiffChars} characters due to size]*`;
    events.push({
      id: `pr-${number}-diff`,
      event_type: "pr_diff",
      content: diffContent,
      sha: headSha,
      author: "github",
      created_at: pr.updated_at,
    });
  }

  const prComments = threadComments(`comments on #${number}`, `${owner}/${repo}`, number);
  // Same shaping as the issue path: the model must not read a comment the guard is
  // removing. See `keptCommentIds`.
  const keptPrComments = keptCommentIds(prComments);
  events.push(...prComments
    .filter((comment) => keptPrComments.has(comment.id))
    .map((comment) => ({
      id: comment.id,
      event_type: "pr_comment",
      content: comment.body ?? "",
      author: comment.user?.login ?? "",
      author_type: comment.user?.type,
      created_at: comment.created_at ?? "",
    })));

  // The endpoint that failed on 2026-08-17. See `contextList`.
  const reviews = contextList<GhReviewApi>(
    `reviews on #${number}`,
    "api",
    `repos/${owner}/${repo}/pulls/${number}/reviews`,
  );
  events.push(...reviews.filter((review) => review.submitted_at != null).map((review) => ({
    id: `pr-review-${review.id}`,
    event_type: "pr_review",
    content: `Review state: ${review.state}\n\n${review.body ?? ""}`,
    author: review.user.login,
    author_type: review.user.type,
    created_at: review.submitted_at!,
  })));

  const inlineComments = contextList<GhReviewCommentApi>(
    `inline review comments on #${number}`,
    "api",
    `repos/${owner}/${repo}/pulls/${number}/comments`,
  );
  events.push(...inlineComments.map((comment) => ({
    id: comment.id,
    event_type: "pr_review_comment",
    content: `On \`${comment.path}\` line ${comment.line ?? comment.original_line ?? "?"}:\n\n${comment.body}`,
    author: comment.user.login,
    author_type: comment.user.type,
    created_at: comment.created_at,
  })));

  return { events, parentIssue };
}

/**
 * The pull requests whose body carries `atomaton:parent-issue=N` for THIS issue.
 *
 * The search only enumerates candidates. GitHub tokenizes a query, so the bare
 * term matched every PR that merely mentions the number: PR #269's body says
 * "Version 0.21.21 — 0.21.20 is held by #263's PR", that `#263` was enough, and
 * #269's body, diff and comments joined #266's run — whose reviewer then reviewed
 * #269 instead of #266 (#270). Two guards, because they fail differently: the
 * quoted phrase is the candidate cut (measured on this repository — the quoted
 * form returned only the tagged PR where the bare term returned both), and the
 * `read` below decides on each candidate's CURRENT body whether it is linked at
 * all, so a stale index or a tag a person has since removed costs a candidate,
 * never a wrong PR. The same search is confirmed the same way in `readChildren`
 * (`adapters/github/work-tree.ts`) — `tags.ts`'s contract for `search`:
 * enumeration by search, confirmation by the tag on the body.
 */
function linkedPrNumbers(owner: string, repo: string, issueNumber: number): number[] {
  const prs = ghJson<{ number: number; body: string | null }[]>(
    "pr", "list", "--repo", `${owner}/${repo}`, "--state", "all",
    "--search", `"${PARENT_ISSUE_TAG.search(issueNumber)}" in:body`,
    "--limit", "1000", "--json", "number,body",
  ) ?? [];
  if (prs.length === 1000) {
    console.error(`::warning::Linked PR search for Issue #${issueNumber} reached GitHub's 1000-result search limit.`);
  }
  return prs
    // A body can quote the tag inside a fenced sample, and a link is a decision:
    // reading the prose is what keeps a quoted example from joining a run (#293,
    // and the shared `readProse` entry point since #304).
    .filter((pr) => PARENT_ISSUE_TAG.readProse(pr.body ?? "") === issueNumber)
    .map((pr) => pr.number);
}

function tryLinkedPrNumbers(owner: string, repo: string, issueNumber: number): number[] {
  try {
    return linkedPrNumbers(owner, repo, issueNumber);
  } catch {
    console.error(`::warning::Could not search linked PRs for Issue #${issueNumber}; using the available context.`);
    return [];
  }
}

function appendPrEvents(
  events: GithubEvent[],
  owner: string,
  repo: string,
  prNumber: number,
  maxDiffChars: number,
): void {
  try {
    events.push(...fetchPrEvents(owner, repo, prNumber, maxDiffChars).events);
  } catch {
    console.error(`::warning::Could not fetch linked PR #${prNumber}; skipping it.`);
  }
}

export function fetchEvents(
  type: "issue" | "pr",
  number: number,
  maxDiffChars: number,
): FetchEventsResult {
  const [owner, repo] = repoParts();

  if (type === "issue") {
    const events = fetchIssueEvents(owner, repo, number, "issue_opened", "issue_comment", "issue");
    for (const prNumber of tryLinkedPrNumbers(owner, repo, number)) {
      appendPrEvents(events, owner, repo, prNumber, maxDiffChars);
    }
    events.sort((a, b) => a.created_at.localeCompare(b.created_at));
    return { events, sessionType: "issue", sessionNumber: number };
  }

  const prResult = fetchPrEvents(owner, repo, number, maxDiffChars);
  let events = [...prResult.events];
  if (prResult.parentIssue) {
    try {
      events = fetchIssueEvents(owner, repo, prResult.parentIssue, "issue_opened", "issue_comment", "issue");
      const relatedPrNumbers = new Set([number, ...tryLinkedPrNumbers(owner, repo, prResult.parentIssue)]);
      for (const relatedPrNumber of relatedPrNumbers) {
        if (relatedPrNumber === number) events.push(...prResult.events);
        else appendPrEvents(events, owner, repo, relatedPrNumber, maxDiffChars);
      }
    } catch {
      console.error(`::warning::Linked Issue #${prResult.parentIssue} not found or inaccessible — using PR-local context.`);
      events.sort((a, b) => a.created_at.localeCompare(b.created_at));
      return { events, sessionType: "pr", sessionNumber: number };
    }
  }

  events.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return {
    events,
    sessionType: prResult.parentIssue ? "issue" : "pr",
    sessionNumber: prResult.parentIssue ?? number,
  };
}

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      type: { type: "string" },
      number: { type: "string" },
      "max-diff-chars": { type: "string" },
      out: { type: "string" },
    },
  });

  if (!isNodeType(values.type) || !values.number || !values.out) {
    console.error("usage: fetch_events.ts --type issue|pr --number N [--max-diff-chars N] --out events.json");
    process.exit(2);
  }

  const maxDiffChars = Number(values["max-diff-chars"] ?? 30000);
  const { events, sessionType, sessionNumber } = fetchEvents(values.type, Number(values.number), maxDiffChars);

  // One place, because there are six kinds of body above -- issue, pull request,
  // their comments, reviews, inline review comments -- and a seventh added later
  // would have to remember. Everything this file produces leaves through here.
  //
  // The two tags a downstream reader needs are read from the RAW body first, because
  // `withoutTags` is about to remove them. `llm_context` decides whether the event
  // reaches the model at all, and `agent` names which agent wrote a result comment --
  // both are decisions made on the raw text, and both were silently broken while the
  // reader looked for a tag that had already been stripped. "Raw" here means prose:
  // both readers skip fenced code, where a tag is a sample rather than a record.
  //
  // A diff leaves unshaped. It is not a body about the machinery but the change
  // under review: stripping a tag-shaped literal out of one handed a reviewer
  // `commandsIn("")` for a committed `commandsIn("<!-- atomaton:dispatch=reviewer -->")`
  // and it reviewed code that did not exist (#293). The event type is what knows a
  // diff from prose, so no fence heuristics and no tag reading are involved.
  const withoutBookkeeping = events.map((event) => {
    if (event.event_type === "pr_diff") return event;
    return {
      ...event,
      llm_context: LLM_CONTEXT_TAG.readProse(event.content),
      agent: AGENT_TAG.readProse(event.content),
      content: withoutTags(event.content),
    };
  });
  writeFileSync(values.out, JSON.stringify(withoutBookkeeping, null, 2));

  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) appendFileSync(githubOutput, `session_type=${sessionType}\nsession_number=${sessionNumber}\n`);

  console.error(`Fetched ${events.length} events → ${values.out}`);
}

if (import.meta.main) main();
