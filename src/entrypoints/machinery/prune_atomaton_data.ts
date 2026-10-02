#!/usr/bin/env bun
/**
 * prune_atomaton_data.ts — remove the scratch a finished issue left behind.
 *
 * See `domain/machinery/atomaton-data-pruning.ts` for why the rule is the issue's state rather than
 * an age, and what is deliberately left alone. This file is the part that talks to
 * GitHub and to git.
 *
 * Runs when an issue closes -- that is when its stored files become dead, so the
 * trigger and the condition are the same event and no schedule has to approximate it.
 * Anything one run misses is taken by the next issue to close.
 *
 * Usage:
 *   prune_atomaton_data.ts [--repo OWNER/REPO] [--dry-run]
 *
 * `--dry-run` prints what it would delete and touches nothing, which is how to look at
 * a store before letting this loose on it.
 *
 * ## Why deleting files rather than rewriting history
 *
 * The history is where the bytes are, and only a force-push reclaims them. That is
 * exactly what must not happen here: sessions are written by runs that are going on
 * right now, from jobs that fetched this branch minutes ago, and a rewritten history
 * turns their next push into a conflict they have no handling for. So this removes
 * files and leaves the history, which keeps the working tree bounded and lets the
 * history grow slowly. Reclaiming it is a separate decision nobody has had to make yet.
 */
import { parseArgs } from "node:util";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ghPaginated, gitRun } from "../../adapters/github/gh.ts";
import { runInFlight } from "../../adapters/github/whose-turn.ts";
import { prunablePaths, pruneCommitMessage, issueNumberOf } from "../../domain/machinery/atomaton-data-pruning.ts";
import { defineScript } from "./lib/script-ref.ts";

export const ref = defineScript(import.meta.url);

const BRANCH = "atomaton-data";

function log(message: string): void {
  console.error(`[prune-atomaton-data] ${message}`);
}

interface IssueState {
  number: number;
  state: string;
  labels?: { name?: string }[];
  pull_request?: unknown;
}

/**
 * Every issue's state and labels, in one pass rather than one request per issue.
 *
 * A store with a hundred issues in it would otherwise be a hundred requests every time
 * an issue closes, which is the kind of cost that gets a job turned off.
 */
function issueStates(repo: string): Map<number, IssueState> {
  const byNumber = new Map<number, IssueState>();
  for (const state of ["open", "closed"]) {
    const page = ghPaginated<IssueState>("api", `repos/${repo}/issues?state=${state}&per_page=100`);
    for (const issue of page) {
      // Pull requests come back from this endpoint too, and nothing here is stored
      // under a pull request's number.
      if (issue.pull_request !== undefined) continue;
      byNumber.set(issue.number, issue);
    }
  }
  return byNumber;
}

/**
 * Whether this issue's stored files are dead.
 *
 * Three ways to answer no, and the two cautious ones matter more than the obvious one:
 * an issue that cannot be read is not evidence of anything, and an issue a run is
 * working on right now can be closed and still be live -- an agent closes the issue and
 * the job keeps going, so deleting under it would make its next save resurrect what
 * this just removed.
 *
 * "Still running" comes from the thread, not the `atomaton/in-progress` label. The
 * label is a cache written late: a run that died leaves it set, and a run that has been
 * asked for but not yet started has none -- so the label would keep a dead issue's files
 * forever and delete a live one's. `runInFlight` is the answer itself.
 */
function isOver(states: Map<number, IssueState>, isRunning: (issue: number) => boolean, issue: number): boolean {
  const found = states.get(issue);
  if (found === undefined) {
    log(`#${issue} could not be read; leaving its files alone`);
    return false;
  }
  if (found.state !== "closed") return false;
  if (isRunning(issue)) {
    log(`#${issue} is closed but a run is still in flight on it; leaving its files alone`);
    return false;
  }
  return true;
}

function storedPaths(): string[] {
  const listed = gitRun("ls-tree", "-r", "--name-only", `origin/${BRANCH}`);
  if (listed.code !== 0) {
    log(`could not list ${BRANCH}: ${listed.stderr || listed.stdout}`);
    return [];
  }
  return listed.stdout.split("\n").map((line) => line.trim()).filter(Boolean);
}

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: { repo: { type: "string" }, "dry-run": { type: "boolean" } },
  });
  const repo = values.repo ?? process.env.GITHUB_REPOSITORY ?? "";
  if (!repo) {
    console.error("usage: prune_atomaton_data.ts [--repo OWNER/REPO] [--dry-run]");
    process.exit(2);
  }

  if (gitRun("fetch", "origin", BRANCH).code !== 0) {
    log(`${BRANCH} does not exist; nothing to prune`);
    return;
  }

  const paths = storedPaths();
  const states = issueStates(repo);
  // A failed thread read is not "nothing is running": the cautious answer is to leave
  // the files alone, which is what `true` here means to `isOver`.
  const isRunning = (issue: number): boolean => {
    try {
      return runInFlight(repo, issue);
    } catch (e) {
      log(`could not read the thread on #${issue}; leaving its files alone: ${(e as Error).message}`);
      return true;
    }
  };
  const decision = prunablePaths(paths, (issue) => isOver(states, isRunning, issue));

  log(`${paths.length} stored files, ${decision.paths.length} belong to closed issues`);
  if (decision.paths.length === 0) return;
  log(`issues: ${decision.issues.map((n) => `#${n}`).join(", ")}`);

  if (values["dry-run"]) {
    for (const path of decision.paths) console.error(`  would delete ${path}`);
    return;
  }

  // A worktree, like `saveSession`: the current checkout may hold work in progress,
  // and this must not be the thing that disturbs it.
  const worktree = mkdtempSync(join(tmpdir(), "atomaton-data-prune-"));
  try {
    gitRun("worktree", "add", worktree, `origin/${BRANCH}`);
    const git = (...args: string[]) =>
      Bun.spawnSync({ cmd: ["git", ...args], cwd: worktree, stdout: "pipe", stderr: "pipe" });
    git("config", "user.email", "action@github.com");
    git("config", "user.name", "GitHub Actions");

    for (let attempt = 1; attempt <= 3; attempt++) {
      git("fetch", "origin", BRANCH);
      git("reset", "--hard", `origin/${BRANCH}`);

      // Re-checked against the freshly fetched tree: a run that finished since the
      // listing above may have written a file this decision does not know about, and
      // `git rm` on a path that is no longer there fails the whole batch.
      const present = decision.paths.filter((path) => existsSync(join(worktree, path)));
      if (present.length === 0) {
        log("nothing left to delete after the refetch");
        return;
      }

      // The decision was made from a read taken before this loop, and a run can start
      // on a closed issue in between -- an agent closes the issue and the job keeps
      // going, which is the case `isOver` exists for. So the thread is read again here,
      // immediately before the delete, and any issue that has come back to life is
      // dropped. Without this, the files a live run is about to write are the ones this
      // removes, and its next save resurrects what was just deleted.
      const stillDead = present.filter((path) => {
        const issue = issueNumberOf(path);
        if (issue === undefined) return true;
        if (!decision.issues.includes(issue)) return true;
        if (!isRunning(issue)) return true;
        log(`#${issue} has a run in flight again; leaving its files alone`);
        return false;
      });
      if (stillDead.length === 0) {
        log("every issue came back to life before the delete; nothing to do");
        return;
      }

      git("rm", "-q", "--", ...stillDead);
      git("commit", "-m", pruneCommitMessage({ ...decision, paths: stillDead }));

      if ((git("push", "origin", `HEAD:${BRANCH}`).exitCode ?? 1) === 0) {
        log(`deleted ${stillDead.length} files`);
        return;
      }
      log(`push attempt ${attempt} lost a race; refetching`);
      Bun.sleepSync(attempt * 2000);
    }
    log("gave up after three attempts; the next issue to close will try again");
  } finally {
    gitRun("worktree", "remove", "--force", worktree);
    rmSync(worktree, { recursive: true, force: true });
  }
}

if (import.meta.main) main();
