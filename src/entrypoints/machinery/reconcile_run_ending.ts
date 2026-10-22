#!/usr/bin/env bun
/**
 * reconcile_run_ending.ts — the run watch's reconciliation: notice the run that
 * never wrote its ending, from OUTSIDE the run, and hand the node back.
 *
 * ## Why outside
 *
 * Everything that reports a run's ending is a step INSIDE the run. A run whose
 * runner vanished, that GitHub cancelled or timed out, or that the machinery
 * skipped whole (the `new_event_count == 0` path ends green with every agent step
 * skipped) reaches no step that could write one. The thread's last turn event
 * stays the `asked` that started the run, and the guard — which reads the thread,
 * never the label — keeps deleting what a person writes next, forever, because no
 * run will ever arrive to heal it. Removing the label does not help; the thread is
 * the answer and it still says "an agent holds the turn". That is #252.
 *
 * This script runs in `Atomaton Run Watch`, triggered by `workflow_run: completed`
 * of the three workflows that can take a node's turn: `Atomaton Runner` itself, and
 * the two entry workflows whose runs START a chain. The distinction matters, because
 * GitHub records no run for a CALLED workflow: `Atomaton Entry` and `Atomaton
 * Manual Comment` execute the runner as a reusable workflow, so the first run of
 * every chain — the one a person's command or a new issue starts — exists only as
 * its CALLER's run. Without the callers in the trigger list, a first run that was
 * cancelled or timed out would jam its thread with no watch on it at all — the
 * commonest path a person walks, invisible. The runner's completion, meanwhile,
 * fires only after all of its own steps have finished, so:
 *
 *   - a run that reported (its own result comment, or its failure notice) has the
 *     ending on the thread ALREADY, timestamped at or after the run's start — and
 *     this script reads it and stays silent. That is why the two cannot double-post:
 *     the inside report, when it lands at all, always lands first, and the watch is
 *     the second line of defence for the run whose report never landed — insurance,
 *     not a replacement. The run's colour still belongs to the inside report alone:
 *     it is decided at completion, before any outside step could speak.
 *   - a run that never posted one has the thread stuck at its `asked`, and this
 *     script posts the notice that ends the turn — the same `done` ending the
 *     failure notice uses — and releases the `atomaton/in-progress` label the dead
 *     run left behind.
 *
 * ## The two gates
 *
 * Which gate decides "this run owes an ending" follows the title, because the title
 * is what says which kind of run completed:
 *
 *   - a runner run's title carries the agent ("`agent` on `#N`"), and the question
 *     is only `needsEnding` — is there no ending at or after the run started?
 *   - an entry run's title carries the node alone ("`#N`"), and most of its runs
 *     never took a turn at all — a comment the guard removed, an ordinary remark, a
 *     route that chose no agent. A notice on one would land mid another run's turn
 *     and unjam the guard while that run was still working. So the notice waits on
 *     `requestOutstanding` (the thread is stuck at an ask) AND `tookTurn` (that ask
 *     is this run's doing — a dispatch marker posted inside the run, or a person's
 *     command, when this run is one whose trigger consumes a command, the run did
 *     not end `success`, and the command was written before the run started).
 *
 * Two of those facts are the caller's knowledge, not the domain's, and each
 * arrives as an argument the caller derives:
 *
 *   - which runs consume a command comes from `--run-event`, the watched run's
 *     `workflow_run.event`, and `runConsumesCommands` below maps it. #281 pinned
 *     the distinction: an entry run started by a new issue found the command the
 *     person posted seconds later and claimed it, posting the notice while the
 *     command's own run worked.
 *   - whether the run may fall back to a command at all comes from
 *     `--conclusion`, which the workflow already passed, and
 *     `runEndedUnsuccessfully` below maps it. A second measurement on the same
 *     issue pinned this one: a run that ended `success` decided something — it
 *     dispatched, with its marker on the thread, or it decided there was nothing
 *     to do — so only a run that died before any marker may fall back to the
 *     command. The first incident's shape was `issues` × success, the second's
 *     `issue_comment` × success; the two flags between them close both.
 *
 * ## What it deliberately does not do
 *
 * It does not ask WHY the run went silent (that is #12/#11's ground), does not
 * re-dispatch anything, does not close the issue, and does not change the guard's
 * rule. It posts one notice and, best-effort, removes one label.
 *
 * ## The title
 *
 * A `workflow_run` event carries no inputs, so the node is read out of the
 * watched run's display title. Two shapes arrive — the runner's "`agent` on `#N`"
 * and the entry workflows' "`#N`" — and anything else (old-format titles, runs of
 * unrelated workflows) exits 0 and does nothing: silence on what cannot be read is
 * the safe direction here, because a guessed node would post a notice onto a
 * thread whose run may be fine. An entry run's agent, when the notice needs one,
 * is read off the thread (`mostRecentAgentOn` — the person's command, or the
 * dispatch marker), falling back to `atomaton`, whose command is the one path that
 * always resumes a node.
 *
 * Conclusion `skipped` is silent for the same reason by a different route: the
 * calling job's condition never started the runner, so there is no run here to
 * reconcile. Every other conclusion — success included, which is the green run
 * that finished without reporting — goes through the thread check.
 *
 * ## The exit code
 *
 * This run's colour is its own verdict on ITS OWN work, never a re-statement of
 * the watched run's: the watched run already has its colour, and a red beside a
 * notice that landed would only repeat the news in Notifications. So: silent
 * paths exit 0, a notice that posted exits 0, and the only non-zero exits are the
 * reads and writes this reconciliation could not complete — a thread that cannot
 * be read, a comment GitHub refuses. There the red run is the signal, and the
 * re-run is the recovery, the same as for the watched run itself.
 *
 * The label release is best-effort and never fails the step: the thread — which
 * the notice just healed — is what the guard reads, and the label is only its
 * cache.
 *
 * Usage:
 *   reconcile_run_ending.ts --display-title "agent on #N" | "#N"
 *     [--run-started-at ISO] [--run-url URL] [--conclusion WORD] [--run-event EVENT]
 *
 * Requires GITHUB_REPOSITORY (owner/repo) in the environment.
 */
import { parseArgs } from "node:util";
import { gh, ghRead } from "../../adapters/github/gh.ts";
import { mostRecentAgentOn } from "../../adapters/github/agent-on-issue.ts";
import { getLabel } from "../../adapters/runner/config.ts";
import { endingWalkReaders, readRunWatchThread, readers, type RunWatchThread } from "../../adapters/github/thread.ts";
import { turnHeader } from "../../adapters/github/turn-comment.ts";
import { recoveryLines } from "../../domain/work/comment-command.ts";
import { requestOutstanding } from "../../domain/work/thread.ts";
import {
  lastEndingComment,
  needsEnding,
  parseRunTitle,
  releasesLabel,
  tookTurn,
} from "../../domain/work/run-report.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface ReconcileRunEndingArgs {
  /** The triggering run's display title — the runner's "`agent` on `#N`", or an entry run's "`#N`". */
  "display-title": string;
  /** When the watched run started running; endings before it are earlier turns'. */
  "run-started-at"?: string;
  /** The watched run's URL, for the notice. */
  "run-url"?: string;
  /** The watched run's conclusion; `skipped` means no run happened to reconcile. */
  conclusion?: string;
  /** The GitHub event that started the watched run — `workflow_run.event`. */
  "run-event"?: string;
}

export const ref = defineScript<ReconcileRunEndingArgs>(import.meta.url);

/**
 * Whether the event that started the watched run is one that can consume a
 * person's command — the only kind of run a command on the thread can be the ask
 * OF.
 *
 * The event arrives as `workflow_run.event`, so the mapping is spelled here and
 * the domain stays ignorant of event names. In this repository exactly one
 * surface consumes a comment: an `issue_comment` run of `Atomaton Manual
 * Comment` on an issue. `Atomaton Entry` starts from `issues: opened` — the new
 * issue's body is its ask, and it consumes no comment — so a command sitting on
 * that thread belongs to the run the command itself started. The runner runs
 * from `workflow_dispatch`, and a manual-comment run for a comment on a PULL
 * REQUEST takes no turn either — but its title names no node, so it never
 * reaches this gate. Anything unknown lands on false: a watch that cannot say
 * what started the run stays silent, the same direction the unreadable-time
 * cases take.
 */
export function runConsumesCommands(runEvent: string | undefined): boolean {
  return runEvent === "issue_comment";
}

/**
 * Whether the watched run ended other than by carrying its own judgment through
 * — the only shape the person's-command fallback of `tookTurn` exists for.
 *
 * A run that ends `success` decided something: it dispatched, and its marker is
 * on the thread where `tookTurn`'s marker branch reads it whatever the
 * conclusion, or it decided there was nothing to do, which is exactly the
 * silence this gate owes the thread. The fallback is for a run that died before
 * posting any marker, and GitHub reports that death as anything but `success` —
 * `cancelled`, `failure`, `timed_out`, `startup_failure`. An absent or
 * unreadable conclusion lands on false, the silent direction every unreadable
 * input here takes: the workflow always passes one, so this only answers a
 * caller from before the field existed.
 */
export function runEndedUnsuccessfully(conclusion: string | undefined): boolean {
  const word = (conclusion ?? "").trim();
  return word !== "" && word !== "success";
}

/**
 * The notice a run that never reported leaves behind, addressed to a person.
 *
 * It says what happened, that nothing was decided, and the two ways forward —
 * and it does NOT say the session was saved, because for the deaths this covers
 * that would be a claim nobody made: the report step that would know is the step
 * that never ran. What the run reached is described only as "whatever reached
 * GitHub", which is true of every way a run can stop short.
 *
 * The header tags are the whole of the turn mechanics here: `ended: done` is what
 * changes the thread's last turn event from the dead run's `asked` to a returned
 * turn, which is the unjamming itself — the guard reads this comment, not this
 * script. No `atomaton:agent` tag: like the failure notice, this is not the
 * agent's result comment, and tagging it as one would file it with the runs that
 * reported.
 */
export function missingEndingNotice(agent: string, runUrl: string): string {
  const lines = [
    ...turnHeader({ ended: "done", audience: "person" }),
    `Atomaton: \`${agent}\`'s run ended without posting its result. It was cancelled, lost its runner, timed out, or finished without reporting one.`,
    "",
    "Nothing was decided by that run: whatever it reached — commits, pull requests,",
    "saved history — is whatever reached GitHub before it stopped. Its log:",
    runUrl,
    "",
    ...recoveryLines(agent),
  ];
  return lines.join("\n");
}

/** Whether the issue currently carries a label, said either way when the read fails. */
function hasLabel(repo: string, number: number, label: string): boolean {
  const read = ghRead("api", `repos/${repo}/issues/${number}`, "--jq", "[.labels[].name]");
  if (read.code !== 0) {
    console.error(`Warning: could not read #${number}'s labels, so the stale label is not touched: ${read.stderr || read.stdout}`);
    return false;
  }
  try {
    return (JSON.parse(read.stdout || "[]") as string[]).includes(label);
  } catch {
    console.error(`Warning: #${number}'s labels were not readable as a list, so the stale label is not touched`);
    return false;
  }
}

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      "display-title": { type: "string" },
      "run-started-at": { type: "string" },
      "run-url": { type: "string" },
      conclusion: { type: "string" },
      "run-event": { type: "string" },
    },
  });

  const repo = process.env.GITHUB_REPOSITORY ?? "";

  // Nothing ran by design — the caller's own condition skipped the runner — so
  // there is no run here whose ending could be missing.
  if ((values.conclusion ?? "") === "skipped") {
    console.error("reconcile_run_ending: the run was skipped before it started; nothing to reconcile");
    return;
  }

  const title = parseRunTitle(values["display-title"]);
  if (title === undefined) {
    // A run this machinery did not title — the runner's own name before `run-name`
    // existed, or anything else. Silence, said in the log, is the whole action.
    console.error(`reconcile_run_ending: title "${values["display-title"] ?? ""}" names no node; nothing to do`);
    return;
  }

  const { agent: titledAgent, number } = title;

  // The thread decides, so the thread must be readable. A failed read is the one
  // thing this script refuses to guess past — "no ending" drawn from an unreadable
  // thread would post a notice beside a run that may have reported fine.
  let thread: RunWatchThread;
  try {
    thread = readRunWatchThread(repo, number);
  } catch (error) {
    console.error(`::error::reconcile_run_ending: could not read the thread on #${number}: ${(error as Error).message}`);
    process.exitCode = 1;
    return;
  }

  // Which kind of watched run this is decides the gate, and the title is what says.
  // A runner run's title carries the agent, and its only question is whether an
  // ending postdates it. An entry run's title carries the node alone, and most of
  // its runs never took a turn at all — so the notice waits on the thread being
  // stuck at an ask AND that ask being this run's doing (see `tookTurn`): the
  // event that started the run decides whether a person's command can be that
  // ask, and whether the run ended `success` decides whether it may fall back
  // to one — the domain learns neither vocabulary.
  const endingMissing = titledAgent !== undefined
    ? needsEnding(thread.dated, values["run-started-at"], endingWalkReaders)
    : requestOutstanding(thread.events) &&
      tookTurn(
        thread.entries,
        values["run-started-at"],
        readers,
        runConsumesCommands(values["run-event"]),
        runEndedUnsuccessfully(values["conclusion"]),
      );
  if (!endingMissing) {
    console.error(`reconcile_run_ending: the run on #${number} owes no ending; nothing to do`);
    return;
  }

  // The agent the notice names: the title's for a runner run; off the thread for an
  // entry run — the person's command, or the marker the machinery posted — and
  // `atomaton` when the thread names nobody, whose command is the one path that
  // always resumes a node.
  const agent = titledAgent ?? (mostRecentAgentOn(repo, number) || "atomaton");

  // The ending the run owed. Posted before the label work, because the comment —
  // not the label — is what the guard reads: this is the step that unjams the
  // thread, and the label is only the cache beside it.
  const body = missingEndingNotice(agent, values["run-url"] ?? "");
  const posted = gh("issue", "comment", String(number), "--repo", repo, "--body", body);
  if (posted.code !== 0) {
    console.error(`::error::reconcile_run_ending: could not post the notice on #${number}: ${posted.stderr || posted.stdout}`);
    process.exitCode = 1;
    return;
  }
  console.error(`reconcile_run_ending: posted the missing-ending notice on #${number}`);

  // The label the dead run left, judged by the turn the thread had BEFORE it took
  // the ball — `thread` predates the notice above, so the notice's own ending
  // cannot answer here. Best-effort: a warning, never a failed step, because the
  // thread is healed and the label is a cache of an answer the thread now gives.
  const label = getLabel("in_progress");
  if (!hasLabel(repo, number, label)) return;
  if (!releasesLabel(lastEndingComment(thread.dated, endingWalkReaders), endingWalkReaders)) {
    console.error(`reconcile_run_ending: '${label}' stays on #${number}; the thread's last ending keeps the turn with an agent`);
    return;
  }
  const removed = gh("issue", "edit", String(number), "--repo", repo, "--remove-label", label);
  if (removed.code !== 0) {
    console.error(`Warning: could not remove '${label}' from #${number}: ${removed.stderr || removed.stdout}`);
  }
}

if (import.meta.main) main();
