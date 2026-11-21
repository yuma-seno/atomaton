#!/usr/bin/env bun
/**
 * update_atomaton.ts — take a newer template release onto this tree.
 *
 * This is the other face of the machinery the notice serves. The notice (see
 * `notify_new_release.ts`) computes a plan and renders it read-only; this script
 * runs the same plan for real, on the checkout the workflow ran it in:
 *
 *     plan → apply to the tree → branch → commit → push → pull request
 *        → no conflict: request the auto-merge, close the notice
 *        → conflicts:   stop at the pull request, report where and why
 *
 * Nothing here decides policy. Whether a path is take/add/delete/merge is the
 * plan's answer (`domain/machinery/update-plan.ts`); whether a merge collides is
 * `git merge-file`'s measured answer (`lib/update-apply.ts`). A collision is not a
 * failure of the run: stopping at a pull request IS the design, and the run exits
 * green after reporting it. What is a failure is being unable to run at all — no
 * token, no manifest, no readable release — which exits red with the reason.
 *
 * ## Why the token, and why it is not the workflow's own
 *
 * The branch this pushes must run the repository's checks, and a push made with
 * the workflow's own `GITHUB_TOKEN` deliberately triggers none. The merge those
 * checks gate would then be merging unverified content. So the workflow that runs
 * this carries `ATOMATON_UPDATE_TOKEN`, a personal access token with repo scope,
 * and a run without it fails loudly and does nothing — a person who pressed the
 * button is standing there, and silence is not an answer.
 *
 * ## Why the stop is a pull request, and why the merge is requested, not done
 *
 * A pull request is the one place this repository already has everything a
 * resolution needs: visible diffs, checks that refuse broken content, and an agent
 * loop a person can address with a comment. The update asks for the auto-merge
 * (`gh pr merge --auto`) rather than merging outright, so the repository's own
 * checks stand between the release and the default branch even when nothing
 * collided — the plan being clean is the plan's claim, and the checks are what
 * makes it true.
 *
 * Usage:
 *   update_atomaton.ts --repo OWNER/REPO [--source N] [--tag vX.Y.Z]
 */
import { parseArgs } from "node:util";
import { gh, ghRead } from "../../adapters/github/gh.ts";
import { LLM_CONTEXT_TAG } from "../../adapters/github/tags.ts";
import { machineryPath } from "../../adapters/runner/machinery.ts";
import { leftoversOf, planUpdate, verdictSentence, type UpdatePlan } from "../../domain/machinery/update-plan.ts";
import { defineScript } from "./lib/script-ref.ts";
import { findOpenNotice, NOTICE_MARKER } from "./lib/notice-issue.ts";
import { applyPlan } from "./lib/update-apply.ts";
import {
  UPSTREAM_REPOSITORY,
  latestReleaseTag,
  readLocalManifest,
  readTreeFiles,
  releaseFiles,
  treePaths,
} from "./lib/release-files.ts";

export interface UpdateAtomatonArgs {
  /** `owner/name` of the repository being updated — the adopted tree's own. */
  repo: string;
  /**
   * The thread to answer in: the issue a `!upgrade` came from, or the notice. As
   * the workflow passes it, an empty string means nobody asked — which is what
   * starting from the Actions tab looks like.
   */
  source?: number | string;
  /** A specific release to take, instead of the newest one upstream has. */
  tag?: string;
}

export const ref = defineScript<UpdateAtomatonArgs>(import.meta.url);

/**
 * Who the machinery says this commit is from.
 *
 * A plain `atomaton[bot]` identity, not a person's: a tree that later wants to
 * audit what the machinery touched finds it by author, and the machinery must not
 * borrow whoever happened to be running the workflow.
 */
const COMMIT_NAME = "atomaton[bot]";
const COMMIT_EMAIL = "atomaton[bot]@users.noreply.github.com";

/** The branch every update lands on, named for the release it takes. */
export function updateBranchFor(tag: string): string {
  return `atomaton/update-${tag}`;
}

/** The pull request's title. */
export function updateTitle(tag: string): string {
  return `Take Atomaton ${tag} onto this tree`;
}

/** Everything the pull request's body is rendered from. */
export interface UpdateReport {
  readonly plan: UpdatePlan;
  /** Paths whose merge collided, as `applyPlan` measured them. */
  readonly conflicts: readonly string[];
  /** Paths whose merge resolved with no conflict. */
  readonly merged: readonly string[];
  /** Paths the target no longer ships — reported, never acted on. */
  readonly leftovers: readonly string[];
}

/** How many of a list a report renders before it counts the rest. */
const MAX_LISTED = 15;

/** The body of the pull request, whatever the plan turned out to be. */
export function updateBody(report: UpdateReport): string {
  const { plan } = report;
  const lines: string[] = [
    "<!-- atomaton:update -->",
    verdictSentence(plan.base, plan.target, report.conflicts.length, plan.kept.length),
    "",
    "## The plan",
    "",
    "| | |",
    "| --- | --- |",
    `| Files updated (untouched here) | ${plan.take.length} |`,
    `| Files added | ${plan.add.length} |`,
    `| Files removed (unmodified here) | ${plan.delete.length} |`,
    `| Files changed on **both** sides | ${plan.merge.length} |`,
    `| Resolved by the merge itself | ${report.merged.length} |`,
    `| Left with conflict markers | ${report.conflicts.length} |`,
    `| Paths the plan will not touch | ${plan.kept.length} |`,
    "",
  ];

  const list = (title: string, paths: readonly string[]): void => {
    if (paths.length === 0) return;
    lines.push(title, "", ...paths.slice(0, MAX_LISTED).map((path) => `- \`${path}\``));
    if (paths.length > MAX_LISTED) lines.push(`- …and ${paths.length - MAX_LISTED} more`);
    lines.push("");
  };
  list("Conflicted — resolve here, then the checks finish the job:", report.conflicts);
  list("Merged cleanly by the machinery:", report.merged);
  list(
    "Left alone for a person to look at:",
    plan.kept.map((entry) => entry.path),
  );

  if (report.leftovers.length > 0) {
    lines.push(
      "## Files upstream no longer ships",
      "",
      "Reported only — the manifest cannot tell these from files the adopter wrote,",
      "so nothing here deletes them on a guess:",
      "",
      ...report.leftovers.slice(0, MAX_LISTED).map((path) => `- \`${path}\``),
      ...(report.leftovers.length > MAX_LISTED ? [`- …and ${report.leftovers.length - MAX_LISTED} more`] : []),
      "",
    );
  }

  lines.push(
    "## What happens next",
    "",
    report.conflicts.length === 0
      ? "The auto-merge is requested on this pull request; the repository's checks run first. If they pass, this merges itself and the notice closes."
      : "This pull request does not merge on its own: the conflicted files above carry markers naming both sides. Comment on this pull request and ask an agent to resolve them — the checks will run on the resolved tree, and only then can this merge.",
    "",
  );
  return `${lines.join("\n").trimEnd()}\n`;
}

/** The comment a stopped update leaves in the thread that asked for it. */
export function stopComment(report: UpdateReport, prNumber: number): string {
  return [
    // Tagged `exclude`: this is addressed to the person (or the agent they will
    // ask) ON the pull request — the thread that asked learns where the work
    // stands, and the next run reading this thread gains nothing from it.
    LLM_CONTEXT_TAG.write("exclude"),
    `Taking ${report.plan.target} stopped at a pull request: ${report.conflicts.length} file(s) changed on both sides.`,
    "",
    ...report.conflicts.map((path) => `- \`${path}\``),
    "",
    `The plan is applied on #${prNumber}, where the conflicts carry markers naming both sides. ` +
      "Comment on that pull request and ask an agent to resolve them — nothing merges until someone does.",
  ].join("\n");
}

/** The comment a settled update leaves, when it was asked for from a thread. */
export function doneComment(plan: UpdatePlan, prNumber: number, merging: boolean): string {
  return [
    LLM_CONTEXT_TAG.write("exclude"),
    `Taking ${plan.target} onto ${plan.base} is applied on #${prNumber}.`,
    merging
      ? "The auto-merge is requested there; the repository's checks run first, and the merge follows them."
      : "The repository's checks run on it; once they pass, it can merge.",
  ].join("\n");
}

function log(message: string): void {
  console.error(`[update] ${message}`);
}

/** One `git` invocation in the checkout this run is in. */
function git(args: string[]): { code: number; stdout: string; stderr: string } {
  const run = Bun.spawnSync({ cmd: ["git", ...args], stdout: "pipe", stderr: "pipe" });
  return {
    code: run.exitCode ?? 1,
    stdout: run.stdout?.toString("utf8") ?? "",
    stderr: run.stderr?.toString("utf8") ?? "",
  };
}

/** `git` failing is a red run with the command that failed, not a stack trace. */
function gitOrFail(args: string[], what: string): { stdout: string } | { fail: string } {
  const result = git(args);
  if (result.code !== 0) {
    return { fail: `could not ${what}: ${result.stderr.trim() || `git exited ${result.code}`}` };
  }
  return { stdout: result.stdout };
}

/**
 * Push `branch`, with the update token if the remote is this script's to
 * credential.
 *
 * A `https://github.com/` remote gets the token inline — the only credential this
 * run may add. Anything else (a test's file remote, an SSH remote the checkout
 * already carries) is pushed as-is, on the checkout's own credentials.
 */
function pushBranch(branch: string, token: string): { ok: true } | { fail: string } {
  const origin = gitOrFail(["remote", "get-url", "origin"], "read the origin remote");
  if ("fail" in origin) return origin;
  const url = origin.stdout.trim();
  const github = /^https:\/\/github\.com\/(.+?)(?:\.git)?$/.exec(url);
  const pushUrl = github ? `https://x-access-token:${token}@github.com/${github[1]}` : url;
  const pushed = gitOrFail(["push", "--force", pushUrl, `HEAD:refs/heads/${branch}`], `push ${branch}`);
  return "fail" in pushed ? pushed : { ok: true };
}

/** The repository's default branch, as the pull request's base. */
function defaultBranch(repo: string): string | null {
  const result = ghRead("api", `repos/${repo}`, "--jq", ".default_branch");
  if (result.code !== 0) {
    log(`WARN could not read ${repo}'s default branch: ${result.stderr.trim() || `gh exited ${result.code}`}`);
    return null;
  }
  const branch = result.stdout.trim();
  return branch === "" ? null : branch;
}

/** An open pull request already standing on `branch`, or `0`. */
function openPrForHead(repo: string, branch: string): number {
  const result = ghRead(
    "pr", "list", "--repo", repo, "--head", branch, "--state", "open", "--json", "number",
  );
  if (result.code !== 0) return 0;
  try {
    const parsed = JSON.parse(result.stdout || "[]") as Array<{ number?: unknown }>;
    const number = Number(parsed[0]?.number ?? 0);
    return Number.isInteger(number) && number > 0 ? number : 0;
  } catch {
    return 0;
  }
}

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      repo: { type: "string" },
      source: { type: "string" },
      tag: { type: "string" },
    },
  });

  const repo = (values.repo ?? process.env.GITHUB_REPOSITORY ?? "").trim();
  if (!repo) {
    console.error("usage: update_atomaton.ts --repo OWNER/REPO [--source N] [--tag vX.Y.Z]");
    process.exit(2);
  }
  const source = values.source !== undefined && values.source !== "" ? Number(values.source) : 0;

  const token = process.env.ATOMATON_UPDATE_TOKEN?.trim() ?? "";
  if (!token) {
    console.error(
      "::error::ATOMATON_UPDATE_TOKEN is not set. The update pushes a branch and asks for a merge, " +
        "which this workflow's own token may not do: a push from it would run none of the checks the " +
        "merge is meant to gate. Set the repository secret ATOMATON_UPDATE_TOKEN to a token with repo " +
        "scope, and run this again. Nothing has been changed.",
    );
    process.exit(1);
  }

  const local = readLocalManifest();
  if (!("manifest" in local)) {
    console.error(`::error::${local.why}. An update cannot be applied to a tree that cannot say what it is on.`);
    process.exit(1);
  }

  const targetTag = (values.tag ?? "").trim() || latestReleaseTag();
  if (targetTag === null) {
    console.error(
      `::error::could not read ${UPSTREAM_REPOSITORY}'s latest release, so there is nothing to take. ` +
        "A failed read is not an answer of 'up to date'.",
    );
    process.exit(1);
  }

  if (targetTag === local.manifest.version) {
    log(`${local.manifest.version} is the release this tree is on; nothing to take`);
    if (source > 0) {
      const said = gh("issue", "comment", String(source), "--repo", repo, "--body",
        `${LLM_CONTEXT_TAG.write("exclude")}\nThis tree is already on ${targetTag}, which is the release asked for. Nothing to do.`);
      if (said.code !== 0) log(`WARN could not answer in #${source}: ${said.stderr.trim()}`);
    }
    return;
  }

  // The run is about to write to the checkout and push a branch. A dirty tree
  // would mix a person's or another run's work into the update's commit — refuse
  // before anything is written, not after.
  const status = gitOrFail(["status", "--porcelain"], "read the working tree's status");
  if ("fail" in status) {
    console.error(`::error::${status.fail}. The update applies to a checkout, and this run is not standing in one it can trust.`);
    process.exit(1);
  }
  if (status.stdout.trim() !== "") {
    console.error(
      "::error::the working tree is not clean. The update writes whole files and pushes a branch; " +
        "uncommitted work would be mixed into its commit. Run it from a clean checkout.",
    );
    process.exit(1);
  }

  // The three sides, read before anything is decided. A release that cannot be
  // read is a red run with the reason — never a guess about what it held.
  const baseRelease = releaseFiles(local.manifest.version);
  if ("why" in baseRelease) {
    console.error(`::error::this tree's own release (${local.manifest.version}) could not be read: ${baseRelease.why}`);
    process.exit(1);
  }
  const targetRelease = releaseFiles(targetTag);
  if ("why" in targetRelease) {
    console.error(`::error::the target release (${targetTag}) could not be read: ${targetRelease.why}`);
    process.exit(1);
  }

  const paths = new Set([...baseRelease.files.files.keys(), ...targetRelease.files.files.keys()]);
  const tree = readTreeFiles(paths);
  const plan = planUpdate(local.manifest.version, targetTag, baseRelease.files.files, targetRelease.files.files, tree);
  if (plan.take.length + plan.add.length + plan.delete.length + plan.merge.length === 0) {
    log(`${targetTag} changes nothing here; nothing to apply`);
    if (source > 0) {
      const said = gh("issue", "comment", String(source), "--repo", repo, "--body",
        `${LLM_CONTEXT_TAG.write("exclude")}\n${targetTag} differs from ${local.manifest.version} by name only: applying it would change nothing on this tree.`);
      if (said.code !== 0) log(`WARN could not answer in #${source}: ${said.stderr.trim()}`);
    }
    return;
  }

  const leftovers = leftoversOf(targetRelease.files.manifest, treePaths());
  const applied = applyPlan(machineryPath("."), plan, baseRelease.files.files, targetRelease.files.files, tree);
  if ("why" in applied) {
    console.error(`::error::the plan could not be applied: ${applied.why}. The tree is left as it was before this run.`);
    process.exit(1);
  }
  const { conflicts, merged } = applied.result;
  log(
    `applied: ${applied.result.taken.length} taken, ${applied.result.added.length} added, ` +
      `${applied.result.removed.length} removed, ${merged.length} merged, ${conflicts.length} conflicted`,
  );

  const branch = updateBranchFor(targetTag);
  const branched = gitOrFail(["switch", "-C", branch], `create the branch ${branch}`);
  if ("fail" in branched) {
    console.error(`::error::${branched.fail}. The tree holds the applied plan but nothing has been committed.`);
    process.exit(1);
  }
  const staged = gitOrFail(["add", "-A"], "stage the applied plan");
  if ("fail" in staged) {
    console.error(`::error::${staged.fail}. The tree holds the applied plan but nothing has been committed.`);
    process.exit(1);
  }
  const committed = gitOrFail(
    ["-c", `user.name=${COMMIT_NAME}`, "-c", `user.email=${COMMIT_EMAIL}`, "commit",
      "-m", updateTitle(targetTag), "-m",
      conflicts.length === 0
        ? `Applied by the update machinery from ${plan.base}. Nothing here collided.`
        : `Applied by the update machinery from ${plan.base}. ${conflicts.length} file(s) carry conflict markers for a person or an agent to resolve on the pull request.`,
    ],
    "commit the applied plan",
  );
  if ("fail" in committed) {
    console.error(`::error::${committed.fail}. The tree holds the applied plan but nothing has been committed.`);
    process.exit(1);
  }

  const pushed = pushBranch(branch, token);
  if ("fail" in pushed) {
    console.error(`::error::${pushed.fail}. The commit exists locally as ${branch}; nothing has been opened upstream.`);
    process.exit(1);
  }

  const base = defaultBranch(repo);
  if (base === null) {
    console.error(`::error::could not read ${repo}'s default branch, so no pull request can be opened against it.`);
    process.exit(1);
  }

  const report: UpdateReport = { plan, conflicts, merged, leftovers };
  const existing = openPrForHead(repo, branch);
  let prNumber: number;
  if (existing > 0) {
    const edited = gh("pr", "edit", String(existing), "--repo", repo, "--title", updateTitle(targetTag), "--body", updateBody(report));
    if (edited.code !== 0) {
      console.error(`::error::could not update the pull request #${existing}: ${edited.stderr.trim() || `gh exited ${edited.code}`}`);
      process.exit(1);
    }
    prNumber = existing;
    log(`updated pull request #${existing}`);
  } else {
    const created = gh(
      "pr", "create", "--repo", repo, "--base", base, "--head", branch,
      "--title", updateTitle(targetTag), "--body", updateBody(report),
    );
    if (created.code !== 0) {
      console.error(`::error::could not open the pull request: ${created.stderr.trim() || `gh exited ${created.code}`}`);
      process.exit(1);
    }
    const number = /\/pull\/(\d+)/.exec(created.stdout.trim())?.[1];
    if (number === undefined) {
      console.error(
        `::error::the pull request was opened (${created.stdout.trim()}) but its number could not be read, ` +
          "so the merge request and the notices cannot reference it.",
      );
      process.exit(1);
    }
    prNumber = Number(number);
    log(`opened pull request #${prNumber}`);
  }

  const notice = findOpenNotice(repo);

  if (conflicts.length === 0) {
    // The plan was clean and every merge measured clean: ask for the merge and
    // let the repository's own checks stand between this and the default branch.
    const requested = gh("pr", "merge", String(prNumber), "--repo", repo, "--auto", "--merge");
    const merging = requested.code === 0;
    if (!merging) {
      log(
        `WARN the auto-merge could not be requested on #${prNumber}: ${requested.stderr.trim() || `gh exited ${requested.code}`}` +
          " — the pull request stands, and merges when the checks pass and a person or a run asks again.",
      );
    }
    // The notice's promise is now being kept; a notice that stayed open would
    // keep asking for what is already underway.
    if (notice !== null && notice !== 0) {
      const closed = gh("issue", "close", String(notice), "--repo", repo, "--comment",
        `${NOTICE_MARKER}\n${LLM_CONTEXT_TAG.write("exclude")}\n${doneComment(plan, prNumber, merging)}`);
      if (closed.code !== 0) log(`WARN could not close the notice #${notice}: ${closed.stderr.trim()}`);
    }
    if (source > 0 && source !== notice) {
      const said = gh("issue", "comment", String(source), "--repo", repo, "--body", doneComment(plan, prNumber, merging));
      if (said.code !== 0) log(`WARN could not answer in #${source}: ${said.stderr.trim()}`);
    }
    log(`update to ${targetTag} is on #${prNumber}${merging ? " with the auto-merge requested" : ""}`);
    return;
  }

  // Stopped — which is the design, not a failure. The pull request carries the
  // markers; the thread that asked is told where to resolve them.
  if (notice !== null && notice !== 0) {
    const said = gh("issue", "comment", String(notice), "--repo", repo, "--body", stopComment(report, prNumber));
    if (said.code !== 0) log(`WARN could not report to the notice #${notice}: ${said.stderr.trim()}`);
  }
  if (source > 0 && source !== notice) {
    const said = gh("issue", "comment", String(source), "--repo", repo, "--body", stopComment(report, prNumber));
    if (said.code !== 0) log(`WARN could not answer in #${source}: ${said.stderr.trim()}`);
  }
  log(`stopped at pull request #${prNumber}: ${conflicts.length} conflicted file(s)`);
}

if (import.meta.main) main();
