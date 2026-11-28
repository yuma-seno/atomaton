#!/usr/bin/env bun
/**
 * update_atomaton.ts — take a newer template release onto this tree.
 *
 * This is the other face of the machinery the notice serves. The notice (see
 * `notify_new_release.ts`) computes a plan and renders it read-only; this script
 * runs the same plan for real, on the checkout the workflow ran it in:
 *
 *     plan → apply to the tree → branch → commit → push → pull request
 *        → no conflict: wait for the checks, merge, close the notice
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
 * this carries `ATOMATON_UPDATE_TOKEN`, a personal access token with `repo` and
 * `workflow` scope, the second because the release ships workflows and GitHub
 * refuses a push that updates one without it. A run without the token fails
 * loudly and does nothing — a person who pressed the button is standing there, and
 * silence is not an answer.
 *
 * ## Why the stop is a pull request, and why the token does the writing
 *
 * A pull request is the one place this repository already has everything a
 * resolution needs: visible diffs, checks that refuse broken content, and an agent
 * loop a person can address with a comment. The pull request is opened, and when
 * the plan is clean merged, as the update token -- an identity that starts runs.
 * A pull request opened with the workflow's own token fires no `pull_request`
 * event, so its required check would never start; a merge made with it fires no
 * `push`, so `deploy.on_merge` would never run. The token is what makes this the
 * same shape as a person pressing the buttons: checks run on the pull request,
 * and the merge's push starts the deploy.
 *
 * The plan being clean is the plan's claim; the checks are what makes it true.
 * The script waits for the required check to exist and pass before merging, and
 * a red change stays unmerged.
 *
 * Usage:
 *   update_atomaton.ts --repo OWNER/REPO [--source N] [--tag vX.Y.Z]
 */
import { parseArgs } from "node:util";
import { gh, ghRead, ghAs } from "../../adapters/github/gh.ts";
import { readPullRequest } from "../../adapters/github/pull-request.ts";
import { LLM_CONTEXT_TAG } from "../../adapters/github/tags.ts";
import { machineryPath } from "../../adapters/runner/machinery.ts";
import { leftoversOf, planUpdate, verdictSentence, type UpdatePlan } from "../../domain/machinery/update-plan.ts";
import { defineScript } from "./lib/script-ref.ts";
import { openPrForHead } from "./lib/open-pull-request.ts";
import { dispatchUpdateConflictAgent } from "../../adapters/actions/dispatch-targets.ts";
import { tryGetUpdateConflictPolicy } from "../../adapters/runner/config.ts";
import { updateBranchFor } from "./lib/update-branch.ts";
import { findOpenNotice, NOTICE_MARKER } from "./lib/notice-issue.ts";
import { applyPlan, type HeldCollision } from "./lib/update-apply.ts";
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

/**
 * The branch every update lands on, named for the release it takes.
 *
 * Defined in `lib/update-branch.ts` because the notice reads the same name: a head
 * branch written twice is one that drifts once, and the drift is silent.
 */
export { updateBranchFor };

/** The pull request's title. */
export function updateTitle(tag: string): string {
  return `Take Atomaton ${tag} onto this tree`;
}

/** Everything the pull request's body is rendered from. */
export interface UpdateReport {
  readonly plan: UpdatePlan;
  /** Paths whose merge collided, as `applyPlan` measured them. */
  readonly conflicts: readonly string[];
  /** Paths whose merge collided and whose content stayed as the tree has it. */
  readonly held: readonly HeldCollision[];
  /** Paths whose merge resolved with no conflict. */
  readonly merged: readonly string[];
  /** Paths the target no longer ships — reported, never acted on. */
  readonly leftovers: readonly string[];
}

/** How many of a list a report renders before it counts the rest. */
const MAX_LISTED = 15;

/**
 * The body of the pull request, whatever the plan turned out to be.
 *
 * `conflictAgent` is the agent `update.on_new_release: pr-agent` names, or "": the
 * body is what a resolver reads first, so it has to say whether one is coming. A
 * promise made here and not kept is answered by `stopComment`, which is written
 * after the dispatch has actually answered.
 */
export function updateBody(report: UpdateReport, conflictAgent = ""): string {
  const { plan } = report;
  const lines: string[] = [
    "<!-- atomaton:update -->",
    verdictSentence(plan.base, plan.target, report.conflicts.length + report.held.length, plan.kept.length),
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
    `| Kept as this tree has it, both sides below | ${report.held.length} |`,
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

  if (report.held.length > 0) {
    lines.push(
      "## Kept as this tree has it, both sides below",
      "",
      "Markers are not written into a file the machinery reads as its own settings: with one in place",
      "nothing in this tree can read it — the checks are declared there, so the checks cannot even be",
      "planned, and no run started on this pull request can read them either. The tree's copy stays and",
      "the release's version is below; take what the release has by editing the file here.",
      "",
    );
    for (const collision of report.held) {
      lines.push(
        `<details><summary><code>${collision.path}</code> — both sides</summary>`,
        "",
        "````",
        collision.text.trimEnd(),
        "````",
        "",
        "</details>",
        "",
      );
    }
  }

  lines.push(
    "## What happens next",
    "",
    report.conflicts.length > 0
      ? conflictAgent !== ""
        ? `This pull request does not merge on its own: the conflicted files above carry markers naming both sides. \`${conflictAgent}\` is started on it to resolve them — the checks run on the resolved tree, and then it can merge. One kind is not the agent's: a path under \`.github/workflows/\` cannot be written with its token, so those markers are left for a person, and a pull request carrying both kinds is handled the same way.`
        : "This pull request does not merge on its own: the conflicted files above carry markers naming both sides. Comment on this pull request and ask an agent to resolve them — the checks will run on the resolved tree, and only then can this merge."
      : report.held.length > 0
        ? "This pull request does not merge on its own: the paths kept above show what the release has beside what this tree has, and choosing between them is a person's. Edit the files here to take what you want, and the checks run on the result."
        : plan.kept.length > 0
          ? "This pull request does not merge itself: the kept paths above are the plan declining to touch them without a person. Read them — each is a place this repository's words and the release disagree — and merge by hand when they read right, or ask an agent there to help."
          : "The repository's checks run on this pull request; when they pass, the update merges it and closes the notice.",
    "",
  );
  return `${lines.join("\n").trimEnd()}\n`;
}

/**
 * What became of the agent a `pr-agent` update started, or `null` when the mode
 * starts none.
 *
 * `started` is the dispatch's own answer rather than an intention: the comment below
 * tells the thread what is running, and a dispatch GitHub refused is a thread with
 * nobody on it.
 */
export interface ConflictResolution {
  readonly agent: string;
  readonly started: boolean;
}

/** The comment a stopped update leaves in the thread that asked for it. */
export function stopComment(
  report: UpdateReport,
  prNumber: number,
  resolution: ConflictResolution | null = null,
): string {
  const count = report.conflicts.length + report.held.length;
  const where =
    report.conflicts.length > 0
      ? "The conflicted files carry markers naming both sides."
      : "This tree's copy of each collided file stays, and both sides are in the pull request's body.";
  const next =
    resolution === null
      ? `Comment on that pull request and ask an agent to help — nothing merges until someone does.`
      : resolution.started
        ? `\`${resolution.agent}\` has been started on that pull request to resolve them. A conflicted ` +
          "path under `.github/workflows/` is left for a person, because an agent's token cannot write " +
          "a workflow file; a pull request carrying those alongside ordinary conflicts is handled the " +
          "same way. The checks run on " +
          "the resolved tree; the merge itself is a person's."
        : `\`${resolution.agent}\` was to be started on that pull request and could not be — the run's log says ` +
          "why. Comment there and ask an agent, or resolve them yourself; nothing merges until someone does.";
  return [
    // Tagged `exclude`: this is addressed to the person (or the agent they will
    // ask) ON the pull request — the thread that asked learns where the work
    // stands, and the next run reading this thread gains nothing from it.
    LLM_CONTEXT_TAG.write("exclude"),
    `Taking ${report.plan.target} stopped at a pull request: ${count} file(s) changed on both sides.`,
    "",
    ...report.conflicts.map((path) => `- \`${path}\``),
    ...report.held.map((collision) => `- \`${collision.path}\` — kept as this tree has it`),
    "",
    `The plan is applied on #${prNumber}. ${where} ${next}`,
  ].join("\n");
}

/**
 * The comment a clean-but-kept update leaves in the thread that asked for it.
 *
 * `keep` entries are not conflicts: the plan applied cleanly and touched nothing
 * it was not sure about — but each one is a place this repository's words and
 * the release disagree, and merging it needs a person's look. The merge gate
 * treats kept paths like conflicts for exactly this reason: the plan's own
 * report says "needs a decision here", and the run does not get to say so and
 * then make it.
 */
export function keptComment(report: UpdateReport, prNumber: number): string {
  return [
    LLM_CONTEXT_TAG.write("exclude"),
    `Taking ${report.plan.target} stopped for a look: ${report.plan.kept.length} path(s) the plan will not touch without a person.`,
    "",
    ...report.plan.kept.map((entry) => `- \`${entry.path}\` (${entry.upstream})`),
    "",
    `The plan is applied on #${prNumber}, which does not merge itself. Read the kept paths there — ` +
      "each is this repository's words or files against a release that moved elsewhere — and merge by hand when they read right, " +
      "or comment on that pull request and ask an agent to help.",
  ].join("\n");
}

/** The comment a settled update leaves, when it was asked for from a thread. */
export function doneComment(plan: UpdatePlan, prNumber: number, merging: boolean): string {
  return [
    LLM_CONTEXT_TAG.write("exclude"),
    `Taking ${plan.target} onto ${plan.base} is applied on #${prNumber}.`,
    merging
      ? "The repository's checks passed there, and the merge is made; the merge's push starts the deploy."
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
 * The argv that pushes `branch`, with the update token as the only credential
 * when the remote is a GitHub https one.
 *
 * Why the two `-c` resets: `actions/checkout` leaves `persist-credentials` on by
 * default, which writes `http.https://github.com/.extraheader` into the
 * repository's config. Git sends a configured `Authorization` header *instead of*
 * the userinfo in the URL, so the push would authenticate as the run's own token
 * — and `apply-to-self` runs with `contents: read`, so that push is a 403. An
 * empty `http.extraheader` value resets the header list to empty, and both the
 * unscoped and the URL-scoped forms are cleared because either one can be set.
 *
 * A remote that is not GitHub https (a test's file remote, an SSH remote the
 * checkout already carries) keeps the checkout's own credentials: no `-c`, no
 * rewrite, the URL exactly as the origin carries it.
 */
export function pushArgs(url: string, token: string, branch: string): string[] {
  const github = /^https:\/\/github\.com\/(.+?)(?:\.git)?$/.exec(url);
  if (!github) return ["push", "--force", url, `HEAD:refs/heads/${branch}`];
  return [
    "-c", "http.extraheader=",
    "-c", "http.https://github.com/.extraheader=",
    "push", "--force", `https://x-access-token:${token}@github.com/${github[1]}`, `HEAD:refs/heads/${branch}`,
  ];
}

/**
 * Push `branch`, with the update token if the remote is this script's to
 * credential.
 *
 * A `https://github.com/` remote gets the token as its only credential (see
 * `pushArgs`). Anything else (a test's file remote, an SSH remote the checkout
 * already carries) is pushed as-is, on the checkout's own credentials.
 */
function pushBranch(branch: string, token: string): { ok: true } | { fail: string } {
  const origin = gitOrFail(["remote", "get-url", "origin"], "read the origin remote");
  if ("fail" in origin) return origin;
  const pushed = gitOrFail(pushArgs(origin.stdout.trim(), token, branch), `push ${branch}`);
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
        "merge is meant to gate. Set the repository secret ATOMATON_UPDATE_TOKEN to a classic PAT " +
        "with repo and workflow scope, or a fine-grained token with Contents and Pull requests read " +
        "and write and Workflows write — the release ships workflows, and a push that updates one is " +
        "refused without it. Then run this again. Nothing has been changed.",
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
  const { conflicts, held, merged } = applied.result;
  log(
    `applied: ${applied.result.taken.length} taken, ${applied.result.added.length} added, ` +
      `${applied.result.removed.length} removed, ${merged.length} merged, ${conflicts.length} conflicted, ` +
      `${held.length} held as the tree has them`,
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
      conflicts.length === 0 && held.length === 0
        ? `Applied by the update machinery from ${plan.base}. Nothing here collided.`
        : `Applied by the update machinery from ${plan.base}. ` +
          `${conflicts.length + held.length} file(s) changed on both sides are left for a person on the pull request` +
          `${conflicts.length > 0 ? ` (${conflicts.length} carrying conflict markers)` : ""}.`,
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

  // The collision policy, read HERE rather than carried in from whoever started this
  // run. The notice read the same key to decide whether to start the run at all, and
  // a project can change the value in between; what happens on a collision is this
  // run's to decide, so this is the reading that counts. `kept` is deliberately not
  // covered: the plan declined to decide there, and a person decides -- whatever the
  // mode says.
  //
  // Non-throwing, because a config this run cannot read must not end the run HERE:
  // the push has already happened, so a throw would leave a pushed branch, no pull
  // request, and nobody told (#638). The apply no longer writes markers into the file
  // (`lib/update-apply.ts`), so what is left is a tree that arrived with a config
  // nothing can parse -- a person's edit, a release's copy that does not parse.
  const policy = tryGetUpdateConflictPolicy();
  if (!policy.readable) {
    log(
      "WARN config.yaml could not be read after the plan was applied. " +
        "The collision policy is unknown, so no agent is started and the run stops for a person at the pull request.",
    );
  }
  const conflictAgent = policy.agent;

  const report: UpdateReport = { plan, conflicts, held, merged, leftovers };
  const existing = openPrForHead(repo, branch);
  let prNumber: number;
  if (existing > 0) {
    const edited = gh("pr", "edit", String(existing), "--repo", repo, "--title", updateTitle(targetTag), "--body", updateBody(report, conflictAgent));
    if (edited.code !== 0) {
      console.error(`::error::could not update the pull request #${existing}: ${edited.stderr.trim() || `gh exited ${edited.code}`}`);
      process.exit(1);
    }
    prNumber = existing;
    log(`updated pull request #${existing}`);
    // An existing pull request was opened under the token on a previous run, so
    // its check is already running or done; a fresh push to the branch (this
    // run's) fires the pull_request `synchronize` event, which starts the check
    // again. Nothing to dispatch here either way.
  } else {
    // Opened as the update token, not as this workflow's own: GitHub starts no
    // `pull_request` run for a pull request the workflow's token opened, and the
    // check the ruleset requires is exactly that event. The token is an identity
    // that starts runs -- the same fact the push above already relies on.
    const created = ghAs(
      token,
      "pr", "create", "--repo", repo, "--base", base, "--head", branch,
      "--title", updateTitle(targetTag), "--body", updateBody(report, conflictAgent),
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

  // The merge gate is conflicts, held paths AND kept paths. A clean plan with
  // `keep` entries has applied everything but decided nothing where the plan was
  // not sure -- and the plan's own report says "needs a decision here", so the run
  // does not get to say so and then make it. A held path is the same judgement made
  // after measuring: `git merge-file` collided, and the machinery will not put that
  // collision into a file whose whole job is to be readable. The self-merging path
  // below runs only when there is none of the three.
  const selfMerging = conflicts.length === 0 && held.length === 0 && plan.kept.length === 0;
  let merging = false;
  if (selfMerging) {
    // Not `--auto`. Auto-merge is a repository setting, and depending on it made
    // every clean update on a repository that had not flipped the setting stop
    // at a WARN with its pull request standing. The wait it stood in for is one
    // this script can make itself: the pull request was opened as the update
    // token, so its `pull_request` event is real, and the check is coming. The
    // only wait that matters is for it to EXIST -- the check workflow runs in
    // two phases, plan jobs first and they dispatch the real check, so a merge
    // fired while the visible checks are green races that dispatch and loses.
    // The measured failure was a merge the base branch policy refused in
    // exactly that state, every check on screen green.
    let seen = "";
    for (let attempt = 0; attempt < 90; attempt++) {
      const rollup = readPullRequest<{ statusCheckRollup?: Array<{ name?: string }>}>(repo, prNumber, "statusCheckRollup");
      seen = rollup.known
        ? String((rollup.value.statusCheckRollup ?? []).filter((check) => check.name === "atomaton-check").length)
        : "0";
      if (seen !== "0") break;
      Bun.sleepSync(10_000);
    }
    if (seen === "0" || seen === "") {
      log(
        `WARN the required check never registered on #${prNumber} in fifteen minutes — the pull request stands, ` +
          "and merges when a person or a run asks again.",
      );
    } else if (
      gh("pr", "checks", String(prNumber), "--repo", repo, "--watch", "--fail-fast", "--interval", "10").code !== 0
    ) {
      // A red change is not merged, and the pull request stands with the checks
      // that said so.
      log(`WARN the checks on #${prNumber} did not pass — the pull request stands with them.`);
    } else {
      // Merged as the update token, like the opening above: a merge made with
      // the workflow's own token fires no `push`, and `deploy.on_merge` is what
      // a push starts. The token's merge IS the push, so the repository's
      // ordinary deploy chain runs with no bridge at all -- the same shape as a
      // person pressing merge.
      const requested = ghAs(token, "pr", "merge", String(prNumber), "--repo", repo, "--merge");
      merging = requested.code === 0;
      if (!merging) {
        log(
          `WARN the merge could not be made on #${prNumber}: ${requested.stderr.trim() || `gh exited ${requested.code}`}`,
        );
      }
    }
  }
  // A kept update stops like a conflicted one, and for the same reason in the
  // plan's own words: the run says "this needs a person", so it leaves the
  // person the deciding. The notice stays open -- no merge happened, so its
  // promise is still unkept -- and both advice lists name the paths.
  if (!selfMerging && plan.kept.length > 0) {
    const said = keptComment(report, prNumber);
    if (notice !== null && notice !== 0) {
      const told = gh("issue", "comment", String(notice), "--repo", repo, "--body", said);
      if (told.code !== 0) log(`WARN could not report to the notice #${notice}: ${told.stderr.trim()}`);
    }
    if (source > 0 && source !== notice) {
      const told = gh("issue", "comment", String(source), "--repo", repo, "--body", said);
      if (told.code !== 0) log(`WARN could not answer in #${source}: ${told.stderr.trim()}`);
    }
    log(`update to ${targetTag} is applied on #${prNumber}, held for a person: ${plan.kept.length} kept path(s)`);
    return;
  }
  // Collisions stop the run the way the plan says: the pull request carries the
  // markers it can, the two sides it cannot, and the threads that asked are told
  // where to resolve them. The notice stays open — no merge happened, so its
  // promise is still unkept.
  if (conflicts.length > 0 || held.length > 0) {
    // The agent first, so the comment below reports what actually happened to it
    // rather than what this run meant to do. A dispatch GitHub refuses leaves the
    // pull request for a person, which is `pr`'s behaviour and not a failed run.
    // Nothing to start for a held collision alone: its two sides are reported, not
    // written, so there is no marker on the branch for an agent to resolve.
    const resolution: ConflictResolution | null =
      conflictAgent === "" || conflicts.length === 0
        ? null
        : {
            agent: conflictAgent,
            started: dispatchUpdateConflictAgent(repo, prNumber, conflictAgent),
          };
    if (resolution !== null && !resolution.started) {
      log(`WARN could not start ${conflictAgent} on #${prNumber}; the pull request stands for a person`);
    }
    const said = stopComment(report, prNumber, resolution);
    if (notice !== null && notice !== 0) {
      const told = gh("issue", "comment", String(notice), "--repo", repo, "--body", said);
      if (told.code !== 0) log(`WARN could not report to the notice #${notice}: ${told.stderr.trim()}`);
    }
    if (source > 0 && source !== notice) {
      const told = gh("issue", "comment", String(source), "--repo", repo, "--body", said);
      if (told.code !== 0) log(`WARN could not answer in #${source}: ${told.stderr.trim()}`);
    }
    log(
      `stopped at pull request #${prNumber}: ${conflicts.length} conflicted file(s), ` +
        `${held.length} kept as this tree has them`,
    );
    return;
  }

  // selfMerging and past the poll above: the merge was made, or one of the WARN
  // paths left the pull request standing. Either way the notice closes only on
  // a merge that happened, and the thread that asked hears where things stand.
  if (merging && notice !== null && notice !== 0) {
    const closed = gh("issue", "close", String(notice), "--repo", repo, "--comment",
      `${NOTICE_MARKER}\n${LLM_CONTEXT_TAG.write("exclude")}\n${doneComment(plan, prNumber, merging)}`);
    if (closed.code !== 0) log(`WARN could not close the notice #${notice}: ${closed.stderr.trim()}`);
  }
  if (source > 0 && source !== notice) {
    const said = gh("issue", "comment", String(source), "--repo", repo, "--body", doneComment(plan, prNumber, merging));
    if (said.code !== 0) log(`WARN could not answer in #${source}: ${said.stderr.trim()}`);
  }
  log(`update to ${targetTag} is on #${prNumber}${merging ? ", merged after the repository's checks passed" : ""}`);
}

if (import.meta.main) main();
