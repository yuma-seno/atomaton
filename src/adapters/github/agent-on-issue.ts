/**
 * agent-on-issue.ts — which agent last worked on a node, read from its thread.
 *
 * ## Why this exists
 *
 * "Who was working here" is asked in three places that have nothing else in common:
 * `/resume` fills in the name a person left out, the aggregation gate re-invokes
 * whoever was on the parent, and a subtree resume walks every node asking the same
 * thing. Each answered it its own way, and one of them answered it with a literal
 * `"atomaton"` -- so a project that renamed its atomaton got an aggregation
 * that dispatched an agent with no definition, from a workflow nobody was watching.
 *
 * ## Where the answer is
 *
 * The thread, not a store. A node's thread names an agent in two places, written at
 * opposite ends of a run: a RESULT comment carries `atomaton:agent` (written by
 * `post_result_comment.ts`), and a REQUEST carries the name too -- a person's
 * `/agent` command, or the `atomaton:dispatch` marker `dispatchRunner` writes when it
 * starts a run. The newest of the two is the answer, and there is nothing extra to
 * keep in sync. A store would be a second answer to a question the thread already
 * answers, and the half that falls behind is the half nobody reads.
 *
 * Reading only the result comment was a defect: a run that ends by calling a
 * session-ending tool (`launch_sub_agent`, `create_pr`, `request_close_issue`) posts
 * no result comment at all, and an atomaton that decomposes work ends exactly that
 * way -- so the parent of every orchestrated subtree had no `atomaton:agent` on it,
 * and the aggregation gate read `""`. The request that started the run is always
 * there, so it is the fallback. See `mostRecentAgent` below.
 *
 * ## Why newest first
 *
 * An issue worked by an atomaton and then an engineer must resume the engineer.
 * Taking the first match in chronological order would resume whoever went first,
 * every time, for the whole life of the issue.
 *
 * ## Why it lives here rather than in `domain/`
 *
 * The pure half -- "the last body that names an agent" -- is a fold over strings,
 * but the question the callers ask is about a GitHub node, and answering it needs
 * `gh`. `domain/` may not reach the world, so the reader is here beside the other
 * modules that read a thread, and the tag format stays in `tags.ts` where it is
 * defined.
 */
import { ghPaginated } from "./gh.ts";
import { AGENT_TAG, isQuotation, proseOnly } from "./tags.ts";
import { parseCommentCommand } from "../../domain/work/comment-command.ts";

/**
 * The agent named by the most recent comment that names one, or `""`.
 *
 * Empty is a real answer and not an error: a node nothing has run on has no agent
 * to resume, and every caller says so in its own way rather than dispatching an
 * agent called "".
 *
 * ## Two records, and why both are read
 *
 * A node's thread names an agent in two places, written at opposite ends of a run:
 *
 *   - a RESULT comment carries `atomaton:agent`, written by `post_result_comment.ts`
 *     when a run ends and reports
 *   - a REQUEST carries the name too -- a person's `/agent` command, or the
 *     `atomaton:dispatch` marker `dispatchRunner` writes when it starts a run
 *
 * Reading only the first was the defect this fallback fixes. A run that ends by
 * calling a session-ending tool -- `launch_sub_agent`, `create_pr`,
 * `request_close_issue` -- posts no result comment at all (atoma's loop stops the
 * moment the tool returns, so there is no closing text to post), and an atomaton
 * that decomposes work ends exactly that way. So the parent of every orchestrated
 * subtree had no `atomaton:agent` on it, and the aggregation gate -- which asks this
 * question to re-invoke the parent -- read `""` and dispatched an agent called "".
 *
 * The request is always there: a run is started by a person's command or by the
 * machinery's marker, and neither is skipped. So the newest of the two records is
 * the answer, and a node whose last run left no report is still named by the request
 * that started it.
 *
 * Newest-first across BOTH, not "result first": a node asked for `/engineer` after an
 * atomaton's result comment must answer `engineer`, and preferring the result would
 * answer `atomaton` for the rest of the node's life.
 */
export function mostRecentAgent(bodies: readonly string[]): string {
  for (let i = bodies.length - 1; i >= 0; i--) {
    const body = bodies[i] ?? "";
    // The notice quoting a removed comment carries that comment verbatim: an
    // `atomaton:agent` tag or a `/agent` line inside it is the DELETED author's
    // words, not this repository's, and reading it would name the agent the guard
    // deleted the comment to prevent naming -- which the notice's own line says will
    // not be acted on. See `isQuotation`.
    if (isQuotation(body)) continue;
    const result = AGENT_TAG.readProse(body);
    if (result) return result;
    // `parseCommentCommand` reads both a person's `/agent` command and the
    // `atomaton:dispatch` marker the machinery writes -- one definition of "this body
    // asks for an agent", shared with the thread reader and the parser. Prose only,
    // for the same reason the tag read above is (#304): a marker or command quoted in
    // a fenced sample is documentation, and the machinery writes both in prose.
    const asked = parseCommentCommand(proseOnly(body)).agent;
    if (asked) return asked;
  }
  return "";
}

/**
 * The same question, asked about a node.
 *
 * A failed read returns `""` rather than throwing, which is the same answer as a
 * node nothing ran on. The callers treat both as "nobody to start", and the
 * alternative -- failing a dispatch over a mention-like lookup -- would turn a
 * transient API error into work that never resumes.
 */
export function mostRecentAgentOn(repo: string, number: number): string {
  // `ghPaginated`, not a `JSON.parse` of the whole stdout: with `--paginate`, `gh`
  // evaluates `--jq` once per page and writes each page's result to the same
  // stream, so past one page the output is back-to-back arrays and a whole-output
  // parse throws -- which would return "" here, and `/resume` reads "" as "nobody
  // to start", silently skipping the node.
  try {
    return mostRecentAgent(ghPaginated<string>("api", `repos/${repo}/issues/${number}/comments`, "--jq", "[.[].body]"));
  } catch {
    return "";
  }
}
