#!/usr/bin/env bun
/**
 * post_result_comment.ts — Post the agent's final output as a GitHub
 * comment, including token usage and (when nothing further will
 * happen automatically) a mention.
 *
 * Reads atomaton_output.txt (required) and atomaton_logs.txt (optional, for the
 * ATOMA_TOKEN_USAGE: line) from the current directory.
 *
 * Usage:
 *   post_result_comment.ts --number N --agent NAME [--notify LOGIN]
 *     [--directive NAME] [--chain-continues true|false]
 *     [--ended-because completed|runtime|iterations|stopped|loop|failed]
 *     [--outcome success|failure] [--atoma-failed true]
 *     --run-url URL [--ending-comment PATH]
 * Writes `comment_id=<id>` to $GITHUB_OUTPUT when a comment is posted.
 *
 * ## This is the only writer of a run's ending
 *
 * It used to speak only for a run whose "Run agent" step SUCCEEDED. The step can also
 * die — atoma exits non-zero, or the machinery inside the step does — and nothing
 * later in the run posted in that shape, so a second script (`report_run_failure.ts`)
 * posted the same notice from a step of its own. Two writers for one event, with the
 * second reachable only through a step outcome the first could not see, and the cost
 * is the bug that ordering invites: a run the core filed `failed` whose step succeeded
 * reached neither writer, and the thread got nothing at all.
 *
 * So the step now runs for both outcomes — `--outcome` carries GitHub's own word — and
 * `ended_because` is read through it: a step that failed with no ending recorded IS
 * `failed`, the word every decision below already keys off. One writer, one set of
 * sentences, one place where the run's colour is decided.
 *
 * ## The exit code is that colour
 *
 * A comment that landed heals the thread, and the run's colour then has to say what
 * the comment cannot. Three cases:
 *
 *   - **the agent's own failure, notice posted — 0.** The notice IS the run's report;
 *     a red run beside it would repeat that news in Notifications, where it drowns the
 *     runs whose red is their only signal.
 *   - **the machinery's failure, notice posted — non-zero.** A machinery failure inside
 *     the step (the tools file it could not write, a `sudo` it was refused, an ending it
 *     could not read) still says everything the thread needs, and the run goes red
 *     anyway: red is the machinery's signal, and the thread is healed beside it, not
 *     instead of it.
 *   - **a notice that could not be written — non-zero, raised.** Red is then the only
 *     signal left.
 *
 * Whose the failure was arrives as `--atoma-failed`, the output "Run agent" writes when
 * atoma's own exit is a failure and nothing else writes. Absent reads as NOT atoma's —
 * the machinery's, wherever it struck — so a future rename that loses the output turns
 * every failure red again, which is the conservative direction.
 */
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { gh } from "../../adapters/github/gh.ts";
import { AGENT_TAG, CHANGED_TAG, ENDED_TAG } from "../../adapters/github/tags.ts";
import { parentIssueOf } from "../../adapters/github/parent-issue.ts";
import { readTargetState } from "../../adapters/github/target-state.ts";
import { readPullRequestObject } from "../../adapters/github/pull-request.ts";
import { PARENT_ISSUE_TAG } from "../../adapters/github/tags.ts";
import { isMerged, type TargetState } from "../../domain/work/closed-target.ts";
import { shouldMentionOnCompletion } from "../../domain/work/completion-mention.ts";
import { endingOf, type TurnEnding } from "../../domain/work/turn.ts";
import { redact } from "../../shared/redaction.ts";
import { renderTokenLine } from "../../domain/record/token-line.ts";
import { toolTroubleLine } from "../../domain/record/tool-trouble.ts";
import { toolCallTally } from "../../domain/record/tool-tally.ts";
import { escapedMentionNotice, escapeUnknownMentions } from "../../domain/work/mention.ts";
import { calledHumans } from "../../domain/work/ending-calls.ts";
import { readCalleesFile } from "./lib/callees.ts";
import { failureLines, logExcerptFrom } from "./lib/failure-notice.ts";
import { readEndingComment } from "../../adapters/github/ending-comment.ts";
import type { Session } from "../../domain/work/session.ts";
import { isTrue } from "./lib/flags.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface PostResultCommentArgs {
  number: string | number;
  agent: string;
  type?: string;
  notify?: string;
  directive?: string;
  "chain-continues"?: string;
  /** How the core says the run ended. See `read_run_ending.ts`. */
  "ended-because"?: string;
  /**
   * Whether the run left a report, read off the session by `read_run_ending.ts`.
   *
   * Not derived here from `--output` being empty, though that is right there. The
   * output file is empty for every session-ending tool call as well — `create_pr`,
   * `launch_sub_agent`, `request_close_issue` all stop atoma's loop before the model
   * gets another turn — so reading it that way would call a hand-off silent. The
   * session says which of the two happened; this carries that answer.
   */
  reported?: string;
  "messages-before"?: string | number;
  /** "true" when this run pushed a commit, opened a pull request, or merged one. */
  changed?: string;
  /**
   * The session, read only to salvage something when the run ran out of iterations.
   *
   * Optional: a run that ends normally never opens it.
   */
  session?: string;
  "run-url": string;
  /**
   * The agent's stdout, and the log it wrote alongside.
   *
   * Arguments rather than the bare names this used to open. Those were relative
   * paths, correct only while the run's files sat in the repository root -- they
   * moved them to `$RUNNER_TEMP/atomaton-run` and every result comment since was
   * silently dropped, because `existsSync("atomaton_output.txt")` was false and the
   * skip branch reads exactly like a session that ended via a tool call.
   *
   * Two full releases went out that way. The step reported success, the agent wrote
   * its report -- 3,914 characters in the run that found this -- and nobody received
   * it.
   */
  output: string;
  "logs-file": string;
  /**
   * Where a session-ending tool recorded the comment this run ended on, when one
   * did (`ending-comment.ts`).
   *
   * Read only when the output is empty. That record is the ONE proof this run already
   * has an ending on the thread — the comment a session-ending tool posted — and the
   * footer goes onto it. Absent means nothing spoke for this run, so this script does.
   */
  "ending-comment"?: string;
  /**
   * "true" when the run's closing message called more than one thing.
   *
   * The runner asks such a run to write the message again, once. This is the answer
   * when the second attempt broke the rule too, or when there was no time left to
   * ask: the message was never a call, so nothing in it is made — its mentions are
   * left as text, the directive is dropped by the runner, and the machinery makes the
   * one call it still can. See `domain/work/ending-calls.ts`.
   */
  "ending-invalid"?: string;
  /**
   * The people the run was told it may call, written by `read_callees.ts` before the
   * run started (`lib/callees.ts`).
   *
   * Read here rather than asked of GitHub again: this comment's escaping and the
   * ending check's counting have to be the same set, and they were two reads once.
   * Absent or unreadable means nothing is confirmed, so every mention is escaped and
   * the machinery's own sentence reaches the person the work belongs to.
   */
  "people-file"?: string;
  /**
   * The ask comment id this run claimed (`TOOK_TAG`), and its own run id (#285).
   *
   * Together they are the second half of the turn's identity: the ending this comment
   * carries names what it answers and who answered. The runner passes both — the ask
   * it claimed at start, its own `github.run_id`. Absent (`0`) is the honest "claimed
   * no ask" — the body of a new issue is not a comment — and matches nothing, so a
   * reader comparing ids reads it as an answer to no ask rather than guessing one.
   */
  ask?: string | number;
  "run-id"?: string | number;
  /**
   * `steps.atoma.outcome` — whether the step the agent ran in came back at all.
   *
   * This is the one thing `ended_because` cannot carry on a hard crash: the reads that
   * turn atoma's own exit into an ending run only for the two statuses atoma handles
   * itself, so a step that failed leaves no ending behind, and the absence is the
   * answer. Absent, or anything but `"failure"`, reads as a step that came back — the
   * shape this script had before it was the only writer.
   */
  outcome?: string;
  /**
   * Whether atoma itself failed — the output "Run agent" writes when its exit is
   * neither success nor the soft stop. Absent, or anything but `"true"`, reads as the
   * machinery's, wherever it struck, which is the conservative direction: the notice
   * still posts, and the run stays red. See "The exit code is that colour".
   */
  "atoma-failed"?: string;
}

export const ref = defineScript<PostResultCommentArgs>(import.meta.url);

/**
 * The token counts the run reported, and deliberately no money.
 *
 * This used to multiply the counts by a hardcoded `0.15 / 0.6` per million and
 * print an `Estimated cost`. That number could not be right, for three reasons
 * at once, pulling in different directions:
 *
 *   1. The rate was one model's, applied to every model. It matched no model
 *      any agent here runs — the three agents are on three different ones.
 *   2. `prompt` is not the input total. Providers report the tokens that missed
 *      the cache, so a cached prefix is absent from the number entirely.
 *   3. Whatever `prompt` did contain was charged at the full uncached rate,
 *      though most of it is cache reads at a fraction of that.
 *
 * The errors did not even share a sign, so the printed figure could not be
 * called high or low — only meaningless. A confident wrong number is worse than
 * no number, so it is gone.
 *
 * Getting it right needs one of two things, and neither is wanted here. A price
 * table is configuration that silently goes stale and then produces confident
 * wrong numbers again — the state this is leaving. Reading the real charge from
 * the provider works, but only one of the four providers Atoma supports reports
 * one at all: OpenRouter returns `usage.cost`, while OpenAI and Anthropic report
 * tokens only, and GitHub Copilot bills per request rather than per token, so
 * the figure does not exist there even in principle.
 *
 * So: tokens, which every provider reports and which are a measurement rather
 * than a derivation. Add money here only when it arrives from the provider as
 * money.
 */
function tokenUsageLine(logsFile: string): string | undefined {
  if (!existsSync(logsFile)) return undefined;
  const usageLine = readFileSync(logsFile, "utf8")
    .split("\n")
    .find((l) => l.includes("ATOMA_TOKEN_USAGE:"));
  if (!usageLine) return undefined;

  const prompt = /prompt=(\d+)/.exec(usageLine)?.[1];
  const completion = /completion=(\d+)/.exec(usageLine)?.[1];
  const total = /total=(\d+)/.exec(usageLine)?.[1];
  // Atoma prints `cached=unknown` when no inference reported one, and this clause
  // is then absent rather than zero. Zero is a claim that the cache did nothing;
  // absent says the provider never told us, and the two want opposite responses.
  // The digits-only pattern is what makes `unknown` fall through to absent.
  const cached = /cached=(\d+)/.exec(usageLine)?.[1];

  return renderTokenLine({ total, prompt, completion, cached });
}

/** The pull request fields this file needs, as the REST object carries them. */
interface PullRequestFacts {
  state?: string;
  /** Only this tells a merged pull request from one closed unmerged; `state` says `closed` for both. */
  merged_at?: string | null;
  /** Carries `atomaton:parent-issue`, the issue the pull request delivered. */
  body?: string;
}

/**
 * What the mention decision needs to know about the node this run worked on.
 *
 * The four facts answer two different questions, and they are read for two different
 * reasons:
 *
 * - `isSubIssue` and `issueClosed` feed `shouldMentionOnCompletion`, and every run needs
 *   them. A failed read answers "no" for both: a run mentioning a person it need not have
 *   is a smaller harm than a run that silently drops the only signal that work has
 *   stopped.
 * - `target` and `parentIssue` are what `mentionLine` reads to decide whether its advice
 *   can be followed, and they are only asked for an INTERRUPTED ending — the other two
 *   endings say what the run did, which no thread state can change. On a pull request that
 *   is the read that costs nothing on the ordinary review.
 *
 * Skipped for a pull request until something is interrupted: `--number` is a PR number
 * there, and `gh issue view` on one is an error rather than an answer, so the pull
 * request half goes through `readPullRequestObject` — the reader that answers for one and
 * carries the body in the same response.
 *
 * The state is `readTargetState`'s, not a second read of `gh issue view --json state`.
 * That copy looked for the literal `"CLOSED"` and could not tell a merged pull request
 * from a closed one — the distinction `target-state.ts` exists to make, and the one that
 * decides whether "resume it" is advice a person can follow.
 */
function nodeFacts(
  number: string,
  type: string | undefined,
  interrupted: boolean,
): { isSubIssue: boolean; issueClosed: boolean; target?: TargetState; parentIssue?: number } {
  const repo = process.env.GITHUB_REPOSITORY ?? "";

  if (type !== "issue") {
    if (!interrupted) return { isSubIssue: false, issueClosed: false };
    const read = readPullRequestObject<PullRequestFacts>(repo, Number(number));
    if (!read.known) {
      return { isSubIssue: false, issueClosed: false, target: { known: false, why: read.why } };
    }
    const { state, merged_at: mergedAt, body } = read.value;
    if (state !== "open" && state !== "closed") {
      const why = `unrecognised pull request state ${JSON.stringify(state ?? null)}`;
      return { isSubIssue: false, issueClosed: false, target: { known: false, why } };
    }
    return {
      isSubIssue: false,
      issueClosed: false,
      target: { known: true, kind: "pull-request", state: state === "open" ? "open" : mergedAt ? "done" : "abandoned" },
      parentIssue: PARENT_ISSUE_TAG.readProse(body ?? ""),
    };
  }

  const target = readTargetState(number, repo);
  // GitHub's own link, like every other reader of this relationship. The body's
  // `atomaton:parent` tag is gone -- it recorded the parent at creation and nothing
  // rewrote it. `known: false` falls in with the rest of this function's failures.
  const found = parentIssueOf(repo, Number(number));
  const parent = found.known && found.parent > 0 ? found.parent : undefined;
  return {
    isSubIssue: parent !== undefined,
    issueClosed: target.known && target.state !== "open",
    target,
    parentIssue: parent,
  };
}

/**
 * The last thing the agent actually said, out of the session.
 *
 * For the iteration-limit case only. Walks backwards for an assistant message with
 * text, because the last few turns of a run that ran out are tool calls with no
 * words -- which is why the output file was empty in the first place.
 *
 * **And for the models this repository runs today, it finds nothing.** Measured over
 * 244 stored sessions after this was written: these agents write prose exactly once,
 * in their final turn (450 assistant turns, 1 with text; 204 turns, 1; 200 turns, 0).
 * When the loop ends the turn before that, there is nothing earlier to recover. The
 * only place that can produce the report is the inference loop itself, which is
 * the run's own files.
 *
 * Kept rather than removed: it costs nothing when there is nothing, and it works for
 * a model that narrates as it goes. But it is not the fix, and reading it as one
 * would leave the real gap open.
 *
 * `undefined` when there is nothing to salvage, which is a real outcome -- a run that
 * made 324 tool calls and never wrote a sentence has nothing to report, and saying so
 * is better than posting an empty comment.
 */
/**
 * The last thing THIS run said, if it said anything.
 *
 * `from` is where this run's own messages begin -- everything below it was written by
 * an earlier run or is the GitHub context put in front of this one. Without that
 * boundary this walks the whole accumulated session and finds the previous run's
 * final report, which it then publishes under a warning saying "this run ended before
 * it wrote a report, below is the last thing it said, from the middle of the work".
 * Every clause of that is false about the text it shows.
 *
 * Measured: a run stopped after 19 iterations republished the previous run's
 * complete conclusion. It is easy to reach because these models write prose exactly
 * once, in their final turn -- so a run that is stopped has no assistant text of its
 * own at all, and the newest one in the session always belongs to somebody else.
 *
 * An absent or unreadable boundary salvages nothing. The failure of showing a person
 * less than they could have had is smaller than the failure of showing them an old
 * conclusion labelled as a new fragment.
 */
/**
 * The session, or nothing.
 *
 * Every failure here is silent on purpose. The comment is the thing that has to go
 * out; what is read from the session -- the salvaged last message, the count of what
 * the tools did -- is an addition to it and never a precondition for it.
 */
function readSession(path: string | undefined): Session | undefined {
  if (!path || !existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Session;
  } catch {
    return undefined;
  }
}

export function lastAgentText(sessionPath: string | undefined, from?: number): string | undefined {
  if (from === undefined || !Number.isFinite(from)) return undefined;
  const messages = readSession(sessionPath)?.messages ?? [];
  for (let i = messages.length - 1; i >= from; i -= 1) {
    const message = messages[i];
    if (message?.role !== "assistant") continue;
    const content = message.content;
    if (typeof content === "string" && content.trim() !== "") return content;
  }
  return undefined;
}

/**
 * The ending as `atomaton:ended` spells it: what `/resume` asks the thread.
 *
 * `stopped` is the only value with a reader — `lastEnding` compares against it —
 * so the rest collapse to "not interrupted". Kept as its own function so the
 * projection is visible rather than inlined into a tag write.
 *
 * Written as an exhaustive switch rather than the two-line `if` it was, so that
 * adding an ending is a type error here instead of a silent landing on `done`. That
 * silence is what `no-report` cost: it reached this projection as "not stopped, not
 * spent" and was filed with the runs that finished.
 *
 * `no-report` still answers `done`, and that is a decision rather than a fall-through.
 * The tag says whether a node was INTERRUPTED, because `/resume` picks the nodes a
 * person can pick up where something left off. A run that reported nothing was not
 * interrupted — it ended believing itself finished — so resuming it would restart an
 * agent with nothing left to do. What that run needs is a person, and the mention
 * below is what fetches one.
 */
function endedTag(ending: TurnEnding): string {
  switch (ending.ended) {
    case "stopped":
      return "stopped";
    case "spent":
    case "looped":
      return "limit";
    // The one ending that leaves the node with an agent. `domain/work/thread.ts`
    // reads it to tell a comment arriving mid-turn from one arriving after the work
    // came back, which the three older values could not answer.
    case "handed-off":
      return "handoff";
    // A parked run's own ending was written by the tool that parked it — this
    // switch answers for the shape only, and the shape a park leaves on the thread
    // is `waiting` (#208).
    case "parked":
      return "waiting";
    case "failed":
    case "chain-over":
    case "no-report":
    case "finished":
      return "done";
  }
}

/**
 * Whether the run ended before it was done, either way round.
 *
 * `failed` belongs here and the three places that read this agree on why: each asks
 * "did the run reach its own closing judgement?". A failed run did not — it died
 * mid-work — so its salvaged text is a fragment rather than a conclusion
 * (`buildCommentBody`'s warning), its mentions are names in a sentence rather than
 * calls (`notACall` in `main`), and the footer says the run did not finish. Leaving
 * it out made a failed run read as one that finished, which is how a failure filed
 * itself with the runs that reported.
 *
 * `context_limit` is here for the same "did it reach its closing judgement?" question,
 * and it is also in `reachedLimit`: the window filling is a ceiling, not a failure.
 *
 * It is deliberately NOT in `reachedLimit`: a failure is not a ceiling, and the tool
 * tally that explains a limit decision would be an explanation of the wrong thing.
 */
function cutShort(endedBecause: string | undefined): boolean {
  return (
    endedBecause === "stopped" ||
    endedBecause === "runtime" ||
    endedBecause === "iterations" ||
    endedBecause === "loop" ||
    endedBecause === "context_limit" ||
    endedBecause === "failed"
  );
}

/**
 * The ways a run stops itself at a limit: the clock, an iteration ceiling, the
 * repetition circuit breaker, or the model's context window. The tally these share
 * is what a person deciding between retrying and re-scoping needs; the old limit
 * notice named only the first three, and this comment is now the one that says it.
 */
function reachedLimit(endedBecause: string | undefined): boolean {
  return (
    endedBecause === "runtime" ||
    endedBecause === "iterations" ||
    endedBecause === "loop" ||
    endedBecause === "context_limit"
  );
}

/**
 * How it was cut short, in the words for the person reading the comment.
 *
 * `runtime` and `iterations` are one ending to `turn.ts` — the decisions below it
 * turn on the same answer for either — and two different sentences here, which is
 * why the core's own word travels this far rather than a boolean.
 *
 * This said "ran out of iterations" for both, and the runner passes
 * `--max-runtime-secs` and no `--max-iterations`. So the ceiling it hits is always
 * the clock, and that sentence was always the wrong one.
 *
 * `context_limit` is the fourth ceiling and gets its own sentence rather than being
 * folded into "ran out of time": the window filled, and the way out -- a larger
 * `context_limit`, or a smaller task -- is different from waiting less.
 */
function howItWasCutShort(endedBecause: string | undefined): string {
  if (endedBecause === "stopped") return "was stopped";
  if (endedBecause === "loop") return "got stuck repeating itself";
  if (endedBecause === "failed") return "did not finish";
  if (endedBecause === "context_limit") return "ran out of context";
  return endedBecause === "iterations" ? "ran out of iterations" : "ran out of time";
}

/**
 * The sentence that fetches a person, named by how the run actually ended.
 *
 * It used to say "task completed" whatever happened, which no one saw on a stopped
 * run because a stopped run rarely got a mention at all -- and the moment it did, it
 * was telling the person who had just stopped it that it had finished. "Review the
 * results" is dropped for the same reason: a run cut short may have none.
 *
 * `failed` gets its own sentence because "did not finish before it finished" is what
 * the cut-short wording would build from it, and because it is the one interrupted
 * ending whose text may be a fragment of ordinary work rather than a stop landing
 * between sentences.
 *
 * `no-report` is the third sentence, and it is here rather than sharing the ordinary
 * one because the ordinary one is the false claim this change exists to stop making.
 * A run that produced no closing text has no results to review; what it did is in a
 * saved session, and the person is being told so they can go and look.
 *
 * ## Why the two interrupted arms read the thread's state (#455)
 *
 * "Resume it" is advice, and advice can be wrong. On a merged pull request it is: the
 * review target is on the default branch, GitHub cannot reopen the pull request, and no
 * run can be started there — so the sentence invited a person to resume work that had
 * already landed. It was observed exactly that way, in a stopped reviewer's report on a
 * merged pull request.
 *
 * The branch is taken on the THREAD's state rather than on `endedBecause`, because the
 * state is what makes the advice wrong, and it is the same wrong for a merge-derived stop
 * and for a failure that happened to land on a merged pull request. Only the continuation
 * sentence changes: what the run did, and that nothing runs next, are true either way.
 */
function mentionLine(
  ending: TurnEnding,
  args: {
    agent: string;
    notify?: string;
    endedBecause?: string;
    /** What became of the node this run worked on. Absent keeps the resume sentence. */
    target?: TargetState;
    /** The issue a merged pull request delivered, when there is one to point at. */
    parentIssue?: number;
  },
): string {
  if (args.endedBecause === "failed") {
    return (
      `@${args.notify} — **${args.agent}** stopped mid-run, and no agent will run next. ` +
      continuation(args, "Resume it, or say what to do instead.")
    );
  }
  if (cutShort(args.endedBecause)) {
    return (
      `@${args.notify} — **${args.agent}** ${howItWasCutShort(args.endedBecause)} ` +
      `before it finished, and no agent will run next. ` +
      continuation(args, "Resume it, or say what to do instead.")
    );
  }
  if (ending.ended === "no-report") {
    return (
      `@${args.notify} — **${args.agent}** ended without writing a report. Nothing interrupted it ` +
      `and nothing runs next; it simply left no closing text, so there is nothing here to review. ` +
      `What it did is in its saved session.`
    );
  }
  return `@${args.notify} — **${args.agent}** task completed. No agent will be automatically executed next. Please review the results or provide instructions for the next step.`;
}

/**
 * What can be done about an interrupted run, given what became of the node it ran on.
 *
 * `resume` is the caller's sentence for the common case, and it is passed in rather than
 * written here because it is the wording this comment has always had and nothing about
 * the states below should be able to change it.
 *
 * A merged pull request gets its own sentence, and no `/resume`: the work is in, the pull
 * request cannot be reopened, and a resume there would produce something that is not the
 * work it was for. What is left is the thread the follow-up belongs on.
 *
 * Any other ending — a closed issue, a pull request closed without merging — is a state a
 * person can undo, so the advice names the undo rather than offering a resume that cannot
 * run. `known: false` keeps the resume sentence: an unread state is not evidence that the
 * thread is closed, and the resume is what the person can act on once it is read.
 */
function continuation(
  args: { target?: TargetState; parentIssue?: number },
  resume: string,
): string {
  if (args.target === undefined) return resume;
  if (isMerged(args.target)) {
    const elsewhere =
      args.parentIssue !== undefined && args.parentIssue > 0
        ? `Continue on #${args.parentIssue}, the issue this pull request delivered.`
        : "Continue on the issue this pull request delivered.";
    return `The work this pull request carried is merged already, so there is nothing here to resume. ${elsewhere}`;
  }
  if (args.target.known && args.target.state !== "open") {
    return "That thread is closed, so there is nothing left to resume here — reopen it to continue, or say what to do instead.";
  }
  return resume;
}

/**
 * How this turn ended, as far as this comment can know.
 *
 * `succeeded` is true by construction: the workflow only runs this step when the
 * agent step succeeded. That is not the same as the run succeeding — a run the core
 * filed `failed` arrives here with the step green, which is the whole shape of #441 —
 * so `--ended-because` is what decides, and it carries `failed` like any other word.
 *
 * `loopLimitReached` is NOT known yet, and cannot be. The chain's own limit is
 * counted from the thread by `manage_dispatch_loop.ts`, which runs after this
 * because the tally includes the comment this is writing. Passing `false` is
 * therefore not a guess:
 *
 *   - it can only turn a `chain-over` into a `handed-off`, and
 *   - both carry the same `next`, which is the only thing read here.
 *
 * So the one signal this cannot see is the one that does not change the answer.
 * Deriving the ending here rather than re-deriving the parts is what removes the
 * two copies this file used to hold — one for the mention, one for the tag.
 */
function endingHere(args: {
  directive?: string;
  chainContinues?: string;
  endedBecause?: string;
  reported?: boolean;
}): TurnEnding {
  return endingOf({
    succeeded: true,
    endedBecause: args.endedBecause ?? "",
    loopLimitReached: false,
    chainContinues: isTrue(args.chainContinues),
    directive: args.directive ?? "",
    reported: args.reported === true,
  });
}

/**
 * Whether this comment names the person nothing else will reach.
 *
 * One function because two places ask it: the comment's own mention, and the
 * runner's decision whether the separate "the run reached its limit" notice has
 * anything left to say. The limit notice used to repeat this sentence and the same
 * `@login` immediately after the comment that already contained it — two
 * notifications for one event.
 */
export function makesCompletionMention(signals: {
  notify?: string;
  directive?: string;
  chainContinues?: string;
  endedBecause?: string;
  reported?: boolean;
  agentCalledHuman?: boolean;
  isSubIssue?: boolean;
  issueClosed?: boolean;
}): boolean {
  return shouldMentionOnCompletion({
    ending: endingHere(signals),
    chainContinues: isTrue(signals.chainContinues),
    notify: signals.notify,
    agentCalledHuman: signals.agentCalledHuman === true,
    isSubIssue: signals.isSubIssue ?? false,
    issueClosed: signals.issueClosed ?? false,
  });
}

export function buildCommentBody(args: {
  agent: string;
  notify?: string;
  directive?: string;
  chainContinues?: string;
  endedBecause?: string;
  /**
   * Whether the run left a report — its last assistant message had words in it.
   *
   * Absent means it did not, which is the direction that speaks up: an unobserved run
   * is treated as one that said nothing, and the cost of being wrong is one mention
   * too many rather than a silent run filed as a success.
   */
  reported?: boolean;
  runUrl: string;
  /**
   * The ask this run claimed and its own run id (#285), written onto the ending tag.
   * Absent or `0` is "claimed no ask", which matches no real comment id.
   */
  ask?: string | number;
  "run-id"?: string | number;
  /** `owner/name`, for linking to the metrics report. Absent when unknown. */
  repo?: string;
  output: string;
  /** The token line, as the run's log gave it up. Absent when the log carried no usage. */
  tokenLine?: string;
  isSubIssue?: boolean;
  issueClosed?: boolean;
  /**
   * What became of the node this run worked on, for the mention's advice (#455).
   *
   * Absent is "nobody asked", and the resume sentence — the wording this comment carried
   * before the state was read — is what an absent state keeps.
   */
  target?: TargetState;
  /**
   * The issue a merged pull request delivered, so the mention can point at it.
   *
   * Read from the pull request's `atomaton:parent-issue` tag, the one record of that edge
   * that survives here — see `adapters/github/tags.ts`.
   */
  parentIssue?: number;
  /** Logins the agent wrote as mentions that were escaped instead. */
  escapedMentions?: readonly string[];
  /**
   * Why those mentions were escaped. Passed through to `escapedMentionNotice`, which
   * says a different thing when the text was not a call than when an account could
   * not be confirmed.
   */
  escapedMentionsReason?: "unknown" | "not-a-call";
  /**
   * Whether the closing message called more than one thing, and was posted anyway
   * with its calls left as text. See `PostResultCommentArgs["ending-invalid"]`.
   */
  endingInvalid?: boolean;
  /**
   * Whether the closing message called a person, which is what silences the
   * machinery's own mention: somebody has already been handed the turn.
   */
  agentCalledHuman?: boolean;
  /**
   * Whether `output` is the agent's last message rather than its report.
   *
   * Said in the comment, because presenting a sentence from the middle of the work
   * as a conclusion is worse than posting nothing: a reader would act on it.
   */
  salvaged?: boolean;
  /**
   * Whether the run was cut short having said nothing at all, so `output` is this
   * file's own sentence rather than anything the agent produced.
   *
   * The common shape rather than the odd one: a stop lands at the next turn
   * boundary, so a run in the middle of reading files when it arrives has no text
   * and nothing to salvage either.
   */
  wroteNothing?: boolean;
  /**
   * Whether this run pushed a commit, opened a pull request or merged one.
   *
   * Written into the comment because that is where the next run can read it.
   * `domain/work/progress.ts` counts consecutive runs that changed nothing, and it
   * counts them from the thread rather than from a counter -- so the thread has to
   * carry the fact.
   */
  changed?: boolean;
  /**
   * What the tools did to this run, counted from its session by `tool-trouble.ts`.
   *
   * Measured over 396 sessions (#940): 30 runs carried a problem a server reported
   * about itself and 3 said so; 107 carried a refused or errored call and 33 said so.
   * The prompt asks for all of it by name, so what is left is to stop asking and
   * count -- and the count belongs in the footer, where every other thing the machine
   * knows about the run already is, rather than in the agent's text where a reader
   * would take it for something the agent chose to say.
   *
   * Absent when there was none, which is the ordinary run.
   */
  toolTrouble?: string;
  /**
   * What the run spent its budget on, for a run that stopped itself at a limit.
   *
   * A person reading a cut-short comment has to decide whether to retry or to re-scope,
   * and the tally is what tells them apart; it used to live in a second comment
   * posted right after this one, which repeated this comment's mention to the same
   * person. It is the footer's now, where every other fact about the run already is.
   */
  spentOn?: string;
  /**
   * The lines of the run's log that might say what went wrong, for a failed run.
   *
   * Only `failed` reads it. The failure notice (`lib/failure-notice.ts`) is the one
   * spelling of what a person is told about a failure, and its excerpt is usually
   * about the infrastructure rather than the work — kept because occasionally it is
   * the answer. Absent is a run whose log said nothing, which is not a reason to
   * withhold the notice.
   */
  excerpt?: string;
}): string {
  // Once, and asked twice below. It was derived twice, which is one derivation more
  // than there are facts.
  const ending = endingHere(args);
  // A failed run is the one ending whose body is not the agent's text: the failure
  // notice is (see `lib/failure-notice.ts`), because a run that died mid-work has no
  // closing judgement to publish. #441 is the case — the step succeeded, so the
  // workflow's own failure notice never ran, and the thread got nothing at all.
  const failed = args.endedBecause === "failed";

  // This comment is the agent's own report, not a turn comment of the kind
  // `turn-comment.ts` wraps: it carries `AGENT_TAG` and `CHANGED_TAG` as bookkeeping
  // (which `withoutBookkeeping` strips on the way back in) and it is deliberately NOT
  // `llm-context`-tagged, because it is the thing the next run is supposed to read. The
  // one thing it shares with every other turn-ending comment is the ending, so that is
  // what it has in common with them and nothing else.
  const lines = [
    AGENT_TAG.write(args.agent),
    CHANGED_TAG.write(args.changed === true ? "yes" : "no"),
    // How this run ended, so the thread can be asked later. `/resume` over a work tree
    // needs to know which nodes under the one it was given were interrupted, and the
    // alternative -- "has a saved session" -- is true of every node that ever ran.
    //
    // Three wire values rather than the domain's seven, because this tag answers one
    // question and `/resume` is its only reader. A projection, taken from the ending
    // rather than re-derived from the signals beside it -- which is what it was, in
    // this same file, twelve lines from the other copy.
    //
    // `answers` and `run` are the turn's identity closing (#285): what this comment
    // answers, and which run answered it. The runner passes the ask it claimed and its
    // own run id; `0` on either is "claimed nothing", which matches no real id.
    ENDED_TAG.write({
      verb: endedTag(ending),
      answers: Number(args.ask ?? 0) || 0,
      run: Number(args["run-id"] ?? 0) || 0,
    }),
  ];
  if (failed) {
    lines.push(...failureLines({ agent: args.agent, excerpt: args.excerpt ?? "" }), "");
  }

  if (args.endingInvalid === true) {
    lines.push(
      "> [!WARNING]",
      "> This run's closing message called more than one thing, so none of its calls",
      "> was made: nothing it named is started or notified. It was asked to write the",
      "> message again. Below is what it wrote.",
      "",
    );
  } else if (args.salvaged === true) {
    lines.push(
      "> [!WARNING]",
      "> This run ended before it wrote a report. Below is the last thing it said,",
      "> from the middle of the work — not a conclusion, and not a summary of what it found.",
      "",
    );
  } else if (args.wroteNothing === true) {
    // The run said nothing at all, so there is not even a middle to show. Said
    // outright, because a comment with no report in it otherwise reads as a run that
    // finished and had nothing to say.
    lines.push(
      "> [!WARNING]",
      "> This run ended before it said anything at all, so there is no report below —",
      "> not even a partial one. What it had done is in its saved session.",
      "",
    );
  }
  // Nothing rather than an empty string when there is nothing to show -- a failed run
  // that said nothing gets its body from the notice above, and a blank line in its
  // place would be spacing pretending to be content.
  if (args.output.trim() !== "") lines.push(args.output, "");

  // Directly under what the agent wrote, because that is what it is about, and
  // above the run footer, which nobody reads for this.
  const escapedNotice = escapedMentionNotice(args.escapedMentions ?? [], args.escapedMentionsReason ?? "unknown");
  if (escapedNotice !== undefined) lines.push("", escapedNotice, "");

  if (makesCompletionMention(args)) {
    lines.push(mentionLine(ending, args), "");
  }

  // One footer, one function — the same one `appendFooter` puts on the comment a
  // session-ending tool posted. Everything below it is the machinery's: tokens,
  // run link, metrics, tool trouble, and the cut-short notices.
  lines.push(buildFooter({
    agent: args.agent,
    runUrl: args.runUrl,
    repo: args.repo,
    tokenLine: args.tokenLine,
    toolTrouble: args.toolTrouble,
    endedBecause: args.endedBecause,
    target: args.target,
    spentOn: args.spentOn,
  }));

  return lines.join("\n");
}

/**
 * The footer, as one block — the only place its pieces are assembled.
 *
 * Two kinds of comment carry it. The result comment this file posts when the
 * model returned prose, and — through `appendFooter` — the comment a
 * session-ending tool posted instead, which used to end the run with no footer
 * and whose tokens the metrics report (`token-line.ts`) then never counted. The
 * footer is about ONE run, so it goes on the ONE comment that ended that run's
 * turn, whichever of the two that was.
 *
 * The report link is to the branch tip rather than to a commit, because the
 * report is written after this comment is posted — which is what somebody
 * following it wants anyway: the current state, including this run. A permalink
 * would show the metrics as they were a moment before.
 *
 * Omitted rather than guessed when the repository is unknown, because a broken
 * link in every comment is worse than no link at all.
 */
export function buildFooter(args: {
  agent: string;
  runUrl: string;
  repo?: string;
  /** The token line, as the run's log gave it up. Absent when the log carried no usage. */
  tokenLine?: string;
  /**
   * What the tools did to this run, counted from its session by `tool-trouble.ts`.
   * Absent when there was none, which is the ordinary run.
   */
  toolTrouble?: string;
  /** How the run ended, for the cut-short notices. Empty in the appended footer. */
  endedBecause?: string;
  /** What became of the node this run worked on, when the advice depends on it. */
  target?: TargetState;
  /** What a run that hit a limit spent its budget on, from `tool-tally.ts`. */
  spentOn?: string;
}): string {
  const lines: string[] = ["---"];
  if (args.tokenLine !== undefined) lines.push(args.tokenLine);
  const metrics = args.repo
    ? ` · [metrics](https://github.com/${args.repo}/blob/atomaton-data/metrics/report.md)`
    : "";
  lines.push(`_run by [${args.agent}](${args.runUrl})${metrics}_`);
  // Under the run link and above the notice saying how to continue: this is a fact
  // about the run, the notice is the action, and the action reads last.
  //
  // No `⚠️`, in the same voice as the token line and the run link above it. The
  // marker means one thing in this footer -- the run was cut off and a person has to
  // continue it -- and this line is not that. Most of what it counts is a guard doing
  // its job, which `looksRefused` exists to distinguish from a tool breaking;
  // measured, 107 of 396 runs carried a refused or errored call, so a warning sign
  // here would appear on a quarter of all comments and the one below it would stop
  // being read. The line's job is to make the count impossible to lose, not to claim
  // a fault.
  if (args.toolTrouble !== undefined) lines.push(`_${args.toolTrouble}_`);
  if (args.endedBecause === "stopped") {
    // Says the session survived, because that is the whole difference between this
    // and cancelling the job, and the person who stopped it cannot tell from here
    // which one they got.
    //
    // The command it offers has to be one the thread can still take. On a merged pull
    // request neither `/resume` nor `/<agent>` can run, so the footer says what is true
    // and stops there; the mention above names where the follow-up belongs (#455).
    const saved = "⏸️ _Stopped on request. **The session is saved.**";
    if (args.target !== undefined && isMerged(args.target)) {
      lines.push(
        `${saved} The work this pull request carried is merged already, so there is ` +
          `nothing here to resume._`,
      );
    } else if (args.target !== undefined && args.target.known && args.target.state !== "open") {
      lines.push(
        `${saved} That thread is closed, so there is nothing left to resume here — ` +
          `reopen it to continue._`,
      );
    } else {
      lines.push(
        `${saved} Comment \`/resume\` to continue from here, or \`/${args.agent}\` ` +
          `with an instruction on the following lines._`,
      );
    }
  } else if (reachedLimit(args.endedBecause)) {
    // The limits only. A failed run's footer would repeat what the failure notice above
    // it already says -- that it did not finish, and how to continue.
    lines.push(`⚠️ _The run ${howItWasCutShort(args.endedBecause)}. Comment \`/${args.agent}\` to continue._`);
  }
  // Under the line that says what to do, because it is the fact that decides
  // whether that is the right thing to do — see `tool-tally.ts`.
  if (args.spentOn !== undefined) lines.push(`_${args.spentOn}_`);

  return lines.join("\n");
}

/**
 * Append the footer onto the comment a session-ending tool posted, in place.
 *
 * A tool that ends the session (`create_pr`, `launch_sub_agent`,
 * `request_close_issue`, `reload_environment`) posts its own turn-ending comment
 * and records it (`ending-comment.ts`, in the run's own directory). This reads it
 * back and PATCHes the footer onto it, so the run's tokens reach the metrics
 * report — which counts token lines off comment bodies — and a person reading the
 * thread sees the same run facts they would under any result comment.
 *
 * Reading the body back rather than recording it at post time: the file carries an
 * id, which is the only fact still true hours later. A body read fresh is the
 * body that is really there, whatever touched the comment in between.
 */
function appendFooter(args: {
  repo: string;
  commentId: string;
  agent: string;
  runUrl: string;
  tokenLine?: string;
  toolTrouble?: string;
}): void {
  const current = gh(
    "api",
    `repos/${args.repo}/issues/comments/${args.commentId}`,
    "--jq",
    ".body",
  );
  if (current.code !== 0 || !current.stdout.trim()) {
    console.error(
      `could not read the ending comment ${args.commentId}: ` +
        `${current.stderr || current.stdout || "(empty body)"} -- the footer is not appended`,
    );
    return;
  }
  const body = `${current.stdout.trim()}\n\n${buildFooter({
    agent: args.agent,
    runUrl: args.runUrl,
    repo: args.repo,
    tokenLine: args.tokenLine,
    toolTrouble: args.toolTrouble,
  })}`;
  const updated = gh(
    "api",
    `repos/${args.repo}/issues/comments/${args.commentId}`,
    "--method",
    "PATCH",
    "-f",
    `body=${body}`,
  );
  if (updated.code !== 0) {
    console.error(`could not append the footer: ${updated.stderr || updated.stdout}`);
    return;
  }
  console.error(`footer appended to the ending comment ${args.commentId}`);
}

/**
 * The colour a run keeps once its ending reached the thread.
 *
 * The comment heals the thread, and the run's colour then has to carry what the comment
 * cannot. Two shapes are green: a step that came back — every ordinary run and every
 * soft stop — and an agent failure whose notice landed, which has said everything there
 * is to say and whose red run would only repeat that news in Notifications. Every other
 * shape is red: the machinery failed inside the step (a tools file it could not write,
 * a `sudo` it was refused, an ending it could not read), or atoma's own exit was a
 * failure and the flag was never written, which is the conservative direction.
 */
function colourForStepFailure(stepFailed: boolean, atomaFailed: boolean): void {
  if (!stepFailed || atomaFailed) return;
  console.error("The machinery failed, not the agent; the notice healed the thread, but the run stays red.");
  process.exitCode = 1;
}

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      number: { type: "string" },
      agent: { type: "string" },
      type: { type: "string" },
      notify: { type: "string" },
      directive: { type: "string" },
      "chain-continues": { type: "string" },
      "ended-because": { type: "string" },
      reported: { type: "string" },
      "messages-before": { type: "string" },
      "run-url": { type: "string" },
      changed: { type: "string" },
      session: { type: "string" },
      output: { type: "string" },
      "logs-file": { type: "string" },
      "ending-comment": { type: "string" },
      "ending-invalid": { type: "string" },
      "people-file": { type: "string" },
      ask: { type: "string" },
      "run-id": { type: "string" },
      outcome: { type: "string" },
      "atoma-failed": { type: "string" },
    },
  });

  if (!values.number || !values.agent || !values["run-url"]) {
    console.error("usage: post_result_comment.ts --number N --agent NAME --run-url URL [...]");
    process.exit(2);
  }

  // Redacted on the way out, by shape only.
  //
  // GitHub Actions masks registered secrets in the workflow LOG and does nothing
  // for an issue comment, and this comment is the agent's own text -- whatever it
  // saw and chose to repeat. `redact()` with no literals applies the credential
  // shape patterns, which needs no knowledge of any particular value and so works
  // in this step, which deliberately holds none.
  //
  // A net, not a control: see shared/redaction.ts on what a shape check cannot
  // catch. The reason it is here at all is that this is one of the two sinks that
  // publish unmasked text (the other is the failure excerpt in
  // atomaton-runner.wac.ts).
  // Required, not defaulted. A default would put the old relative path back and
  // restore the exact silence this is fixing: a caller that forgot the argument
  // would look in the work tree, find nothing, and report a session that ended via
  // a tool call.
  const outputFile = values.output;
  if (!outputFile) {
    console.error("post_result_comment.ts: --output is required (the agent's stdout file)");
    process.exit(2);
  }
  const redacted = redact(existsSync(outputFile) ? readFileSync(outputFile, "utf8") : "");

  // `atomaton_output.txt` is empty whenever the run ended via a session-ending
  // tool call (launch_sub_agent, request_close_issue, create_pr -- see
  // src/content/tools/scripts/mcp/{atoma,github}.ts's `_meta.session_ends`):
  // atoma's own inference loop stops immediately in that case, before the
  // model ever gets a further turn to produce text. Each of those tools
  // already posts its OWN dedicated, meaningful comment (e.g. "Launched
  // sub-agent(s): ...", "PR #N created..."), so posting a second, essentially
  // content-free "run by [agent](url)" comment on top of that would be noise.
  //
  // But an empty file is a shape, not a fact, and the shapes are many: a tool that
  // spoke and ended the session; #194's run the core filed `completed` whose last
  // assistant message was empty (the model answered silence); #186's run with no
  // session at all; a stop landing between turns; and #441's failed run whose
  // session died mid-work. Every one of them looks identical from here.
  //
  // So the question is asked of EVIDENCE rather than of the file: has anything
  // already ended this run's turn on the thread? The one thing that says yes is the
  // record a session-ending tool writes when it posts its comment
  // (`ending-comment.ts`, in the run's own directory) -- and where that record
  // exists the footer is appended onto THAT comment, because it is the one that
  // ended this run.
  //
  // No record means nothing spoke for this run, and this step is the only thing left
  // that can. That direction is deliberate: a second comment under one a tool already
  // posted is noise a person reads past, while a run that ends with nothing on its
  // thread deletes the `atomaton:ended` tag that releases the thread's guard -- the
  // defect that let a guard delete a person's later comments forever (#194, #186).
  // Holding a thread's guard on a guess about another component is the larger harm.
  let output = redacted;
  let salvaged = false;
  let wroteNothing = false;
  // A step that failed left no ending behind: the reads that turn atoma's own exit into
  // one run only for the two statuses atoma handles itself, and a crash writes the
  // boundary flag instead. So the step's outcome IS the ending in that shape, and the
  // word it becomes is the one every decision below already keys off.
  const stepFailed = values.outcome === "failure";
  const endedBecause = values["ended-because"] || (stepFailed ? "failed" : "");
  const endedEarly = cutShort(endedBecause);
  const failed = endedBecause === "failed";

  if (!output.trim() && endedEarly) {
    const last = lastAgentText(values.session, Number(values["messages-before"]));
    if (last !== undefined) {
      output = redact(last);
      salvaged = true;
      console.error("salvaged the agent's last message from the session (cut short)");
    }
  }

  if (!output.trim()) {
    // Not asked of a failed step: what a session-ending tool recorded is the comment
    // THAT tool posted, and the old arrangement posted the failure notice beside it
    // anyway — the tool says what the run did, the notice says that it then died, and
    // only the second is an ending. Reading the record here would turn a crash into a
    // footer on a comment that reads as a hand-off.
    const ending = stepFailed ? undefined : readEndingComment(values["ending-comment"]);
    if (ending) {
      console.error(`appending the result footer onto the tool's ending comment ${ending.commentId} (on ${ending.node})`);
      appendFooter({
        repo: process.env.GITHUB_REPOSITORY ?? "",
        commentId: ending.commentId,
        agent: values.agent,
        runUrl: values["run-url"],
        tokenLine: tokenUsageLine(values["logs-file"] ?? ""),
        toolTrouble: toolTroubleLine(readSession(values.session), Number(values["messages-before"])),
      });
      return;
    }
    if (failed) {
      // Nothing to show, and nothing to invent: the failure notice itself is the body
      // (#441), so `output` stays empty rather than gaining a placeholder under it.
      // The same arm answers a hard crash now — the step failed, no ending was recorded,
      // and this is the only writer left to say so.
      console.error("the run failed with nothing to report -- posting the failure notice rather than nothing.");
    } else if (endedEarly) {
      // It is wrong for a run that was cut short, and this is the common shape
      // rather than the odd one. A stop lands at the next turn boundary, so a run
      // reading files when it arrives has said nothing at all and there is nothing
      // to salvage -- a run that spent nine iterations in tool calls and produced
      // no assistant text is the observed case (#831). Skipping there drops the
      // machinery's own sentence along with the agent's silence: that it stopped,
      // that the session survived, and how to resume.
      wroteNothing = true;
      output = endedBecause === "stopped"
        ? "_This run was stopped before it said anything._"
        : `_This run ${howItWasCutShort(endedBecause)} before it said anything._`;
      console.error("the run was cut short with nothing to report -- posting the notice rather than nothing.");
    } else {
      // A run that ended of its own accord without saying anything: the shape of
      // #194 (an empty final response `completed`) and #186 (no session at all).
      // Same treatment, no-report wording: the comment is the machinery's only
      // sentence on this thread, the `atomaton:ended` tag under it is what releases
      // the thread's guard, and the mention is what fetches a person -- see
      // `completion-mention.ts`, which already forces one for a run the session
      // shows reported nothing.
      wroteNothing = true;
      output = "_This run ended without saying anything._";
      console.error(
        "atomaton_output.txt is empty and no session-ending tool recorded a comment " +
          "-- posting the no-report notice rather than skipping.",
      );
    }
  }

  // A failed run reached no closing judgement of its own, so whatever text it left is
  // a fragment of the work rather than a conclusion -- the warning a salvage gets.
  // Without it the comment would present the last thing said before the failure as a
  // result, which is the false claim `salvaged` exists to prevent.
  if (failed && !salvaged && output.trim() !== "") salvaged = true;

  // Checked on the way out for the same reason it is redacted on the way out:
  // this text is whatever the agent decided to write, and a comment is the one
  // place it reaches people. A `@name` here notifies a real account -- see
  // `domain/work/mention.ts` for why a name it read somewhere is enough.
  //
  // The mention the RUNNER adds is not part of this. It is put in by
  // `buildCommentBody` below from a login `resolveNotify` produced, and never
  // passes through here.
  //
  // Three texts are not a call, and every mention in them is escaped rather than
  // confirmed: a salvaged fragment, a run that was cut short (its last message is
  // where the stop landed, not a hand-off), and a closing message the one-call rule
  // refused. In all three a name is a name in a sentence, not somebody being asked,
  // and letting one through would notify a person on the strength of a sentence the
  // machinery already knows is not the run's call. The notice under the text says
  // which of the three it was, and the machinery's own mention is what reaches
  // somebody.
  const endingInvalid = isTrue(values["ending-invalid"]);
  const notACall = endingInvalid || salvaged || endedEarly;
  // The two lists the run was given, from the same file the notice and the ending
  // check read: one read of the thread at the start of the run, not three that have
  // to agree. `known` may notify; `callable` may be handed the turn.
  //
  // Nothing in a text that was not a call is allowed to notify — a salvaged fragment,
  // a run that was cut short, a message the one-call rule refused. Every mention in
  // those is escaped, the owner's included: the machinery's own sentence is what
  // reaches them, and a live mention beside it would say "your turn" while that
  // sentence says nothing is running.
  const callees = readCalleesFile(values["people-file"]);
  const known = notACall ? [] : callees.participants;
  const callable = notACall ? [] : callees.humans;
  const checked = escapeUnknownMentions(output, known);
  if (checked.escaped.length > 0) {
    console.error(`escaped ${checked.escaped.length} mention(s): ${checked.escaped.join(", ")}`);
  }

  // Read off the unescaped text, against the people the run was told it may call.
  const called = calledHumans(output, callable);

  // One read of the node, because the mention decision is asked twice: for the
  // comment's own sentence, and for the output the runner gates the limit notice on.
  //
  // The state and the parent are read only when the ending is interrupted: they decide
  // whether the mention's advice can be followed, and the other two endings state what the
  // run did, which no thread can change. On a pull request that is the read that costs
  // nothing on the ordinary review.
  const facts = nodeFacts(values.number, values.type, cutShort(values["ended-because"]));
  const mentionSignals = {
    notify: values.notify,
    directive: values.directive,
    chainContinues: values["chain-continues"],
    // The ending this script resolved, not the flag it was handed: a crash carries no
    // `--ended-because` at all, and a mention decision that read the absent flag would
    // file the failure with the runs that finished.
    endedBecause,
    reported: isTrue(values.reported),
    agentCalledHuman: called.length === 1,
    isSubIssue: facts.isSubIssue,
    issueClosed: facts.issueClosed,
  };
  // Kept apart from `mentionSignals` so the runner's gate sees exactly the signals it did
  // before, and spread in beside them: `mentionLine` receives the whole object and reads
  // these two only for the sentence about continuing.
  const advice = { target: facts.target, parentIssue: facts.parentIssue };

  const body = buildCommentBody({
    ...mentionSignals,
    ...advice,
    agent: values.agent,
    salvaged,
    wroteNothing,
    endingInvalid,
    runUrl: values["run-url"],
    ask: values.ask,
    "run-id": values["run-id"],
    // From the environment rather than a flag: every caller is a workflow step, and
    // one more argument to thread through is one more place to forget it.
    repo: process.env.GITHUB_REPOSITORY ?? "",
    output: checked.text,
    escapedMentions: checked.escaped,
    escapedMentionsReason: notACall ? "not-a-call" : "unknown",
    changed: isTrue(values.changed),
    // The same boundary the salvage uses, for the same reason: a session accumulates
    // across runs, and a count taken from the top would put an earlier run's trouble
    // under this one's comment.
    toolTrouble: toolTroubleLine(readSession(values.session), Number(values["messages-before"])),
    tokenLine: tokenUsageLine(values["logs-file"] ?? ""),
    // The tally a person needs to decide between retrying and re-scoping. The
    // separate limit notice used to be the only place it appeared; it belongs on
    // the comment that already tells them the run stopped, and this is that comment.
    spentOn: reachedLimit(endedBecause) ? toolCallTally(readSession(values.session)) : undefined,
    // Only a failed run reads these, and only to say why it stopped — so the log is
    // opened only then. Read here rather than inside `buildCommentBody` because the
    // log is this file's input, not the body's: the same separation as the output,
    // the tokens and the session.
    excerpt: failed ? logExcerptFrom(values["logs-file"]) : undefined,
  });

  const { code, stdout, stderr } = gh(
    "api",
    `repos/${process.env.GITHUB_REPOSITORY}/issues/${values.number}/comments`,
    "--method",
    "POST",
    "-f",
    `body=${body}`,
    "--jq",
    ".id",
  );
  if (code !== 0) {
    // Not converted into a comment, because there is nowhere left to put one: red is
    // then the only signal the run leaves, and the workflow log is where the reason
    // reaches somebody. See "The exit code is that colour".
    throw new Error(`Failed to post result comment: ${stderr || stdout}`);
  }

  const commentId = stdout.trim();
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    appendFileSync(githubOutput, `comment_id=${commentId}\n`);
    // Whether the comment named the person. The runner posts the separate limit
    // notice only when it did not: that notice says the same thing and mentions the
    // same login, and one event does not need two of them.
    appendFileSync(githubOutput, `notified=${makesCompletionMention(mentionSignals) ? "true" : "false"}\n`);
  }
  console.error(`Posted comment ID: ${commentId}`);

  // The comment landed, so the thread is healed. What is left is the run's colour —
  // the one thing the thread cannot carry. See "The exit code is that colour".
  colourForStepFailure(stepFailed, isTrue(values["atoma-failed"]));
}

if (import.meta.main) main();
