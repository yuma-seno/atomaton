#!/usr/bin/env bun
/**
 * notify_new_release.ts — open, or update, the one issue that says a newer
 * template release exists.
 *
 * ## What this is for
 *
 * An adopted tree is a copy, and nothing tells its owner a copy is stale. The
 * documented upgrade (`docs/runtime/tasks/move-to-a-newer-release.md`) starts with
 * `gh release download` — so the barrier is not the diff, it is not knowing there
 * is anything to download. This is the announcement.
 *
 * ## Which is sometimes the whole of it, and sometimes the first step
 *
 * `update.on_new_release` decides. In `issue` mode — the default — the notice is
 * written and the release waits for a person. In `pr` and `pr-agent` modes the
 * machinery takes the release itself, and a notice would then be a second thread
 * about work already under way: the update is dispatched from here and the pull
 * request it opens is where everything is reported. So no notice is written on that
 * path, and none of the comparison below runs either — the update is about to do the
 * same work on the same tree.
 *
 * The exception is the case a person has to act on: no `ATOMATON_UPDATE_TOKEN`, or
 * GitHub refusing the dispatch. Then the notice IS written, headed by a warning that
 * says the repository asked for an automatic update and did not get one. The log of a
 * cron nobody watches is not where somebody looks for that.
 *
 * It downloads the release's asset twice — the release this tree came from, and
 * the one being announced — into temporary directories it then deletes, because
 * the interesting answer needs file contents, not version numbers: what taking
 * the new release would do to THIS tree. `lib/release-files.ts` puts the three
 * content maps on the table and `domain/machinery/update-plan.ts` classifies every
 * path; the notice renders that dry run as a table, headed by the same verdict
 * sentence the update workflow itself will lead with (`verdictSentence`). A tree
 * that is up to date learns nothing, which is why its notice closes itself below.
 * What it never does is apply the release — that is the update workflow's job.
 *
 * ## The two versions, and which repository each comes from
 *
 * `local` is `.github/atomaton-release.json`, which ships in every release and
 * names the release it came from. `latest` is GitHub's own latest release of
 * `UPSTREAM_REPOSITORY`, the template. They are the same repository in this
 * repository, which is why a scheduled run here is a no-op: applying a release keeps
 * the two equal.
 *
 * ## One issue, updated
 *
 * A notice per run would bury the repository the first time a release sat
 * unadopted for a week, so the notice carries a marker and an OPEN issue wearing
 * it is edited in place. A closed one is not reused — closing it is the owner
 * saying they have read it, and re-opening it from under them is not this
 * script's call. The next run opens a new one.
 *
 * And the open one closes itself once the tree catches up. A notice that outlives
 * the comparison it made is worse than no notice: the next release would be
 * announced by editing an issue whose whole body is about a version that is no
 * longer waiting, so a reader would see the settled one and the new one at once.
 * Closing it is not a claim about the thread — the marker in the closing comment
 * says which machinery did it, and a person who disagrees can reopen it.
 *
 * ## What it will not do
 *
 * It never writes `.github/`. The deleted-file list is a list to read: the paths
 * on it are the release's own, but which of them the owner wants gone is theirs,
 * and `unzip -o` never deletes anyway. The asset it reads that list out of is
 * downloaded to a temp directory and removed again, so nothing of the release lands
 * in the tree. The settle-by-close above is the one write that is not about a
 * release, and it can only close an issue this script opened.
 *
 * Usage:
 *   notify_new_release.ts --repo OWNER/REPO   (or set GITHUB_REPOSITORY)
 */
import { parseArgs } from "node:util";
import { gh, ghRead } from "../../adapters/github/gh.ts";
import { LLM_CONTEXT_TAG } from "../../adapters/github/tags.ts";
import { RELEASE_MANIFEST } from "../../domain/machinery/machinery-layout.ts";
import { noLongerShipped } from "../../domain/machinery/release-manifest.ts";
import type { PlanEntry } from "../../domain/machinery/update-plan.ts";
import { planUpdate, verdictSentence } from "../../domain/machinery/update-plan.ts";
import { defineScript } from "./lib/script-ref.ts";
import { findOpenNotice, NOTICE_MARKER } from "./lib/notice-issue.ts";
import { openPrForHead } from "./lib/open-pull-request.ts";
import { updateBranchFor } from "./lib/update-branch.ts";
import { dispatchUpdate } from "../../adapters/actions/dispatch-targets.ts";
import { getNewReleaseMode, getNewReleaseScope } from "../../adapters/runner/config.ts";
import type { NewReleaseMode } from "../../domain/delivery/declared-config.ts";
import {
  ASSET_NAME,
  UPSTREAM_REPOSITORY,
  latestReleaseTag,
  readLocalManifest,
  readTreeFiles,
  releaseFiles,
} from "./lib/release-files.ts";

export { ASSET_NAME, UPSTREAM_REPOSITORY };

export interface NotifyNewReleaseArgs {
  /** `owner/name` of the repository the notice is opened in — the adopted tree's own. */
  repo: string;
}

export const ref = defineScript<NotifyNewReleaseArgs>(import.meta.url);

/** Where the recipe the notice points at lives, as an adopter can reach it. */
const UPGRADE_DOC = `https://github.com/${UPSTREAM_REPOSITORY}/blob/main/docs/runtime/tasks/move-to-a-newer-release.md`;

/** The marker that finds the notice; defined in `lib/notice-issue.ts`, shared with the update. */
export { NOTICE_MARKER } from "./lib/notice-issue.ts";

/** How many releases a notice lists before it stops and says how many it left out. */
export const MAX_RELEASES = 20;

/** How much of one release's notes a notice carries. Release bodies can be whole release posts. */
export const MAX_NOTES_CHARS = 1200;

/** One release, as the API answers for it. */
export interface ReleaseNote {
  readonly tag: string;
  readonly body: string;
  readonly url: string;
}

/** The releases newer than the tree's own version, and what the notice does not carry. */
export interface ReleaseWindow {
  /** Newest first, at most `max` of them. */
  readonly newer: ReleaseNote[];
  /** How many newer releases exist beyond those listed. */
  readonly omitted: number;
  /**
   * Whether the tree's own version was in the list the API answered with.
   *
   * False means the tree is older than the page the API returned, so the notices it
   * carries are the newest ones rather than all of them — which a reader has to be
   * told, or "what changed since mine" reads as complete when it is not.
   */
  readonly found: boolean;
}

/**
 * The releases between the tree's version and the latest, newest first.
 *
 * The API answers newest-first, so the tree's own version is the cut: everything
 * before it is newer, everything from it on is already here.
 */
export function releaseWindow(
  notes: readonly ReleaseNote[],
  localVersion: string,
  max: number = MAX_RELEASES,
): ReleaseWindow {
  const at = notes.findIndex((note) => note.tag === localVersion);
  const newer = at === -1 ? [...notes] : notes.slice(0, at);
  return { newer: newer.slice(0, max), omitted: Math.max(0, newer.length - max), found: at !== -1 };
}

/**
 * The token a release's notes carry when it should be adopted promptly.
 *
 * The mark is the release's own claim, which is what lets `update.detection_scope:
 * marked` mean something a version number cannot: a patch that closes a vulnerability
 * is marked, and a minor nobody is waiting for is not. Matched as a substring, so the
 * line around it is free to explain itself -- what has to stay fixed is this token,
 * and `CONTRIBUTING.md` quotes it from here rather than keeping a second copy.
 */
export const ADOPT_MARKER = "atomaton:adopt";

/** Whether one release's notes carry the mark. */
export function isMarked(note: ReleaseNote): boolean {
  return note.body.includes(ADOPT_MARKER);
}

/**
 * The tags, newer than `localVersion`, whose notes carry the mark -- newest first.
 *
 * The whole newer side of the list, not the `MAX_RELEASES` a notice prints: this feeds
 * the gate that decides whether a notice exists at all, and a mark that fell off the
 * end of what the notice would print is still the reason to print one.
 *
 * The `per_page=100` the list is read with is the ceiling underneath this -- the same
 * one the notice's own window has. A tree more than a hundred releases behind cannot
 * see a mark older than that, and the notice says so for the notes it carries.
 */
export function markedReleases(notes: readonly ReleaseNote[], localVersion: string): string[] {
  return releaseWindow(notes, localVersion, notes.length)
    .newer.filter(isMarked)
    .map((note) => note.tag);
}

/**
 * One release's notes, bounded and demoted.
 *
 * Demoted because release notes carry their own `##` and `###` headings, and a
 * notice where every release is an `###` and so is every section inside one reads
 * as a flat list of sections belonging to nothing. Two levels down puts them under
 * the release's own heading, which is the only thing that was true of them.
 */
function notesOf(body: string): string {
  const demoted = body
    .trim()
    .split("\n")
    .map((line) => (/^#{1,4}\s/.test(line) ? `##${line}` : line))
    .join("\n");
  if (demoted.length <= MAX_NOTES_CHARS) return demoted;
  return `${demoted.slice(0, MAX_NOTES_CHARS).trimEnd()}\n\n…the rest is on the release page.`;
}

/** Everything a notice is written from. `null` is "could not be read", never "none". */
export interface NoticeInput {
  readonly localVersion: string;
  readonly latestVersion: string;
  /** The releases in between, or `null` when the list could not be read. */
  readonly window: ReleaseWindow | null;
  /** Why the list is `null`, for the notice to say instead of showing nothing. */
  readonly windowWhy: string;
  /**
   * The window's releases whose notes carry [`ADOPT_MARKER`], or `null` when
   * `update.detection_scope` is `all`.
   *
   * `null` rather than an empty list because the two say opposite things: `all` makes
   * no claim about marks, and the notice for such a repository reads exactly as it
   * always has.
   */
  readonly markedReleases: readonly string[] | null;
  /** Paths the latest release no longer ships, or `null` when that could not be worked out. */
  readonly removed: readonly string[] | null;
  readonly removedWhy: string;
  /**
   * What taking the target would do on THIS tree, or `null` when the assets or the
   * comparison could not be read. Computed the same way the update workflow will:
   * the release the tree came from, the release being taken, and the tree itself.
   */
  readonly plan: PlanSummary | null;
  readonly planWhy: string;
  /**
   * What stopped the automatic update, when `update.on_new_release` asked it to take
   * the release. `null` in `issue` mode, which is the whole reason a notice from such
   * a repository reads exactly as it always has.
   */
  readonly autoUpdateFailure: AutoUpdateFailure | null;
}

/**
 * The automatic half of the notice: the mode the repository chose, when nothing came
 * of it.
 *
 * This exists only for the notice that should not have been necessary — the
 * repository asked for the update to be taken and it was not. `null` in `issue` mode,
 * which is the whole reason a notice from such a repository reads exactly as it
 * always has, and `null` too on the path where the dispatch landed, because that path
 * writes no notice at all.
 */
export interface AutoUpdateFailure {
  /** The mode, which is never `issue` here. */
  readonly mode: Exclude<NewReleaseMode, "issue">;
  /** Why nothing was started, in the notice's own words. */
  readonly why: string;
}

/**
 * The warning a notice opens with when the repository asked for an automatic update
 * and did not get one.
 *
 * At the top rather than in "Taking it": the body is a long page about a release, and
 * the sentence that says why nothing is happening has to be readable before it. The
 * alert is GitHub's own syntax, so it renders as a callout instead of as one more
 * paragraph to scroll past.
 */
function autoUpdateWarningLines(failure: AutoUpdateFailure): string[] {
  return [
    "> [!WARNING]",
    `> \`update.on_new_release\` is \`${failure.mode}\` here, but nothing was started: ${failure.why}.`,
    `> Take the release by hand with the steps below, or see [move to a newer release](${UPGRADE_DOC}).`,
    "",
  ];
}

/** The dry-run shape the notice renders. Counts and lists, no contents. */
export interface PlanSummary {
  /** Files upstream changed that this tree never touched. */
  readonly take: readonly string[];
  /** Files upstream added that nothing here is in the way of. */
  readonly add: readonly string[];
  /** Files upstream removed that this tree still has, unmodified. */
  readonly deleted: readonly string[];
  /** Files changed on BOTH sides: the ones a merge has to reconcile. */
  readonly both: readonly string[];
  /** Paths the plan will not touch without a person. */
  readonly kept: readonly PlanEntry[];
}

/** The issue's title: what changed, and where this tree stands. */
export function noticeTitle(input: NoticeInput): string {
  return `Atomaton release ${input.latestVersion} is available; .github/ is on ${input.localVersion}`;
}

/** The issue's body: what is there, how to take it, what it drops, and what changed. */
export function noticeBody(input: NoticeInput): string {
  const lines: string[] = [NOTICE_MARKER];

  // Only when the repository asked for an automatic update and nothing started. In
  // `issue` mode this is absent and the rest of the body is untouched -- which is
  // what "unset behaves exactly as it always did" means, in the one place a reader
  // can see it.
  if (input.autoUpdateFailure !== null) lines.push(...autoUpdateWarningLines(input.autoUpdateFailure));

  lines.push(
    `Upstream has published **${input.latestVersion}**. This repository's \`.github/\` came from **${input.localVersion}**.`,
    "",
    "| | |",
    "| --- | --- |",
    `| This repository's \`.github/\` is from | \`${input.localVersion}\` |`,
    `| The latest release is | \`${input.latestVersion}\` |`,
    "",
  );

  // Only on the `marked` path; `all` writes the notice it always wrote. It names the
  // releases the setting actually noticed, which matters because the notice always
  // announces the latest: when the marked release is an older one, this line is what
  // says which release made the notice appear.
  if (input.markedReleases !== null) {
    const tags = input.markedReleases.map((tag) => `\`${tag}\``).join(", ");
    lines.push(
      `\`update.detection_scope\` is \`marked\`: of the releases newer than ${input.localVersion}, ` +
        `${tags} ${input.markedReleases.length === 1 ? "carries" : "carry"} \`${ADOPT_MARKER}\`. ` +
        "That mark is the reason this notice exists, and taking the latest release takes it too.",
      "",
    );
  }

  lines.push("## Taking it", "");

  // The same sentence the update workflow leads with, so the notice and the run it
  // offers never disagree. Its inputs are the plan's counts, which is why it walks
  // in with the plan (or walks out again below): a verdict the notice cannot compute
  // is a section saying so, not a guess.
  if (input.plan === null) {
    lines.push(
      `What this update would touch here: not computed — ${input.planWhy}.`,
      "",
      "Nothing has been changed for you: this is a notice, and the upgrade is a decision.",
      "",
      "Comment **`!upgrade`** on this issue, or run the **Atomaton Update** workflow from the Actions tab.",
      "",
    );
  } else {
    lines.push(
      verdictSentence(input.localVersion, input.latestVersion, input.plan.both.length, input.plan.kept.length),
      "",
      "Nothing has been changed for you: this is a notice, and the upgrade is a decision.",
      "",
      "Comment **`!upgrade`** on this issue, or run the **Atomaton Update** workflow from the Actions tab.",
      "The update applies the release to `.github/` on a branch and merges it itself when nothing in this",
      "tree collides; a file this tree changed AND upstream changed is what stops it at a pull request,",
      "where the resolution is yours to make — comment on that pull request and ask an agent to help.",
      "",
    );
    const plan = input.plan;
    lines.push(
      "What it would do on this tree:",
      "",
      "| | |",
      "| --- | --- |",
      `| Files updated (this tree never changed them) | ${plan.take.length} |`,
      `| Files added | ${plan.add.length} |`,
      `| Files removed (unmodified here) | ${plan.deleted.length} |`,
      `| Files changed on **both** sides | ${plan.both.length} |`,
      `| Paths the plan will not touch without a person | ${plan.kept.length} |`,
      "",
    );
    if (plan.both.length > 0) {
      lines.push(
        "The both-sides files are where your edits and upstream's meet:",
        "",
        ...plan.both.slice(0, 10).map((path) => `- \`${path}\``),
        ...(plan.both.length > 10 ? [`- …and ${plan.both.length - 10} more`] : []),
        "",
      );
    }
    if (plan.kept.length > 0) {
      lines.push(
        "The plan leaves these alone until a person says otherwise:",
        "",
        ...plan.kept.slice(0, 10).map((entry) => `- \`${entry.path}\``),
        ...(plan.kept.length > 10 ? [`- …and ${plan.kept.length - 10} more`] : []),
        "",
      );
    }
  }

  lines.push(
    "Or by hand — the documented procedure, which is what the workflow automates:",
    "",
    "```bash",
    `gh release download ${input.latestVersion} -R ${UPSTREAM_REPOSITORY} -p ${ASSET_NAME}`,
    `unzip -o ${ASSET_NAME}   # the archive holds .github/, so run this at the repository root`,
    `rm ${ASSET_NAME}`,
    "git diff .github/                # every difference is now a decision",
    "```",
    "",
    `What to keep, and which files an upgrade replaces: [move to a newer release](${UPGRADE_DOC}).`,
    "",
    "## Files upstream no longer ships",
    "",
  );

  if (input.removed === null) {
    lines.push(`Not computed: ${input.removedWhy}`, "", `Compare by hand — [the page](${UPGRADE_DOC}) has the command.`);
  } else if (input.removed.length === 0) {
    lines.push("None: everything the previous release shipped is still shipped by this one.");
  } else {
    lines.push(
      "Extracting never deletes, so these stay in the tree unless somebody removes them.",
      "The list is the difference between your release's manifest and the one inside the",
      "release above, so nothing you wrote is on it — but a path here can still be one you",
      "edited on purpose, and that is the judgement to make before deleting.",
      "",
      ...input.removed.map((path) => `- \`${path}\``),
    );
  }

  lines.push("", "## Release notes", "");
  if (input.window === null) {
    lines.push(`Not read: ${input.windowWhy}`, "", `What changed is on [the releases page](https://github.com/${UPSTREAM_REPOSITORY}/releases).`);
  } else if (input.window.newer.length === 0) {
    lines.push(
      `No notes: ${input.localVersion} is not in the list of releases the API returned, so`,
      `everything between there and ${input.latestVersion} is on [the releases page](https://github.com/${UPSTREAM_REPOSITORY}/releases).`,
    );
  } else {
    for (const note of input.window.newer) {
      lines.push(`### ${note.tag}`, "", notesOf(note.body) || "_No notes on the release._", "");
    }
    if (input.window.omitted > 0) {
      lines.push(
        `…and ${input.window.omitted} older release(s), which [the releases page](https://github.com/${UPSTREAM_REPOSITORY}/releases) lists.`,
        "",
      );
    }
    if (!input.window.found) {
      lines.push(
        `${input.localVersion} is older than the releases above, so the notes here are the newest ones`,
        "rather than everything since yours.",
        "",
      );
    }
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function log(message: string): void {
  console.error(`[new-release] ${message}`);
}

/** The releases the API lists, newest first, or null when they could not be read. */
function releaseNotes(): ReleaseNote[] | null {
  const result = ghRead(
    "api",
    `repos/${UPSTREAM_REPOSITORY}/releases?per_page=100`,
    "--jq",
    '[.[] | {tag: .tag_name, body: (.body // ""), url: .html_url}]',
  );
  if (result.code !== 0) {
    log(`WARN could not read ${UPSTREAM_REPOSITORY}'s releases: ${result.stderr.trim() || `gh exited ${result.code}`}`);
    return null;
  }
  try {
    const parsed = JSON.parse(result.stdout) as unknown;
    if (!Array.isArray(parsed)) {
      log("WARN the release list was not an array");
      return null;
    }
    return parsed
      .filter((entry): entry is ReleaseNote => {
        const note = entry as Partial<ReleaseNote>;
        return typeof note.tag === "string" && note.tag !== "";
      })
      .map((note) => ({ tag: note.tag, body: String(note.body ?? ""), url: String(note.url ?? "") }));
  } catch {
    log("WARN the release list was not valid JSON");
    return null;
  }
}

/**
 * The open notice's number, `0` for none, or null when the list could not be read.
 *
 * The search itself lives in `lib/notice-issue.ts`, where the update script shares
 * it: that script closes the notice when it makes the notice's promise true.
 */


function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: { repo: { type: "string" } },
  });

  const repo = (values.repo ?? process.env.GITHUB_REPOSITORY ?? "").trim();
  if (!repo) {
    console.error("usage: notify_new_release.ts --repo OWNER/REPO  (or set GITHUB_REPOSITORY)");
    process.exit(2);
  }

  const local = readLocalManifest();
  if (!("manifest" in local)) {
    console.error(`::error::${local.why}. An upgrade cannot be announced for a tree that cannot be compared.`);
    process.exit(1);
  }

  const latestTag = latestReleaseTag();
  if (latestTag === null) {
    console.error(
      `::error::could not read ${UPSTREAM_REPOSITORY}'s latest release, so a newer one cannot be ` +
        "announced. A failed read is not an answer of 'up to date'.",
    );
    process.exit(1);
  }
  const latest = { tag: latestTag };

  if (latest.tag === local.manifest.version) {
    // Caught up, and this branch is entirely about the notice: settle it, or say
    // there is nothing to settle. A search that fails stops the run rather than
    // reading as "there is none", because it is the only thing that can close a
    // notice whose comparison no longer holds.
    const existing = findOpenNotice(repo);
    if (existing === null) {
      console.error(`::error::could not search ${repo} for an existing notice, so this run wrote nothing.`);
      process.exit(1);
    }
    // An open notice that says otherwise is worse than no notice: the next release
    // would then be announced by editing an issue whose whole body is about a
    // version that is no longer the one waiting.
    if (existing === 0) {
      log(`${local.manifest.version} is the latest release; nothing to announce`);
      return;
    }
    const closed = gh(
      "issue", "close", String(existing), "--repo", repo,
      "--comment",
      // Tagged `exclude`: this is bookkeeping addressed to nobody who will act
      // on it -- the notice is settled, and a newer release opens a new notice.
      `${NOTICE_MARKER}\n${LLM_CONTEXT_TAG.write("exclude")}\n\`.github/\` is on ${local.manifest.version}, which is the latest release, so this notice is settled and closes itself. A newer one opens a new notice.`,
    );
    if (closed.code !== 0) {
      console.error(
        `::error::this tree caught up to ${local.manifest.version}, but the open notice #${existing} could not ` +
          `be closed: ${closed.stderr.trim() || `gh exited ${closed.code}`}`,
      );
      process.exit(1);
    }
    log(`caught up to ${local.manifest.version}; closed the settled notice #${existing}`);
    return;
  }

  // Which releases are noticed at all. `marked` narrows the comparison to the ones the
  // release itself flagged, and a window with no flag in it ends the run here: before a
  // mode is dispatched, before anything is downloaded, and without touching an open
  // notice -- a setting is not a release, and closing that notice would say one had
  // been taken.
  //
  // The list is read once and reused by the notice below. In `all` mode nothing here
  // reads it, so that path makes exactly the calls it always made.
  const scope = getNewReleaseScope();
  const scoped = scope === "marked" ? releaseNotes() : undefined;
  let marked: string[] | null = null;
  if (scope === "marked") {
    if (scoped === null || scoped === undefined) {
      // "Could not read" is not "nothing is marked": reading it as one would stop the
      // watch for as long as the API was blipping, and say nothing about having done so.
      console.error(
        `::error::\`update.detection_scope\` is \`marked\` and ${UPSTREAM_REPOSITORY}'s release list could not be ` +
          "read, so there is nothing to compare against. A failed read is not the answer 'nothing is marked'.",
      );
      process.exit(1);
    }
    marked = markedReleases(scoped, local.manifest.version);
    if (marked.length === 0) {
      log(
        `nothing to announce: \`update.detection_scope\` is \`marked\`, and no release newer than ` +
          `${local.manifest.version} carries ${ADOPT_MARKER}`,
      );
      return;
    }
  }

  // What the repository asked the machinery to do with a newer release, read before
  // anything is downloaded: in `pr` and `pr-agent` modes the answer can end this run
  // here -- no notice, and none of the two asset downloads the update is about to do
  // for itself on the same tree.
  //
  // In `issue` mode nothing below runs, down to the pull-request search, because that
  // path has to stay the one it always was.
  const mode = getNewReleaseMode();
  const updateToken = (process.env.ATOMATON_UPDATE_TOKEN ?? "").trim();

  // Set only where the repository asked for the update and did not get it. A notice is
  // written exactly then; the path that dispatched writes none at all.
  let autoUpdateFailure: AutoUpdateFailure | null = null;
  if (mode !== "issue") {
    if (updateToken === "") {
      // Not a failure, and deliberately not one: a missing secret would otherwise cost
      // the repository the announcement as well. The WARN is for whoever reads the run
      // log; the notice carries the same sentence to the person who can set it.
      //
      // Nothing is searched for either. The search would have to run as this
      // workflow's own token, which cannot list pull requests on a private repository
      // -- and the refusal reads as "no pull request is open".
      log(`WARN update.on_new_release is ${mode}, but ATOMATON_UPDATE_TOKEN is not set — nothing was started`);
      autoUpdateFailure = {
        mode,
        why:
          "no `ATOMATON_UPDATE_TOKEN` secret is set here, and the update cannot push, open " +
          "its pull request or merge without it",
      };
    } else {
      // Read as the update's PAT, not this workflow's own token: `atomaton-new-release.yml`
      // declares no `pull-requests`, and a scope a workflow does not list is `none` -- so a
      // private repository refuses this read to the notice, and a refused read is the answer
      // "no update pull request is open". That answer dispatches, so the refusal would cost
      // one update run and one re-push per day for as long as the release waits on its pull
      // request.
      //
      // The dispatch below is not part of that: it runs as this workflow's own token, the
      // way every other dispatch here does, and the `actions: write` that makes it work is
      // in the workflow's permission block where a reader can see it. The secret is what
      // the update then pushes, opens its pull request and merges with.
      const open = openPrForHead(repo, updateBranchFor(latest.tag), updateToken);
      if (open > 0) {
        // The update is already under way, and its pull request is the thread its
        // report belongs on. Nothing to start, and a notice here would be a second
        // thread about the same release.
        log(`an update pull request for ${latest.tag} (#${open}) is already open; nothing was started`);
        return;
      }
      if (dispatchUpdate(repo, 0)) {
        // `source` is empty, so this is the Actions-button run: no thread asked for it,
        // and the pull request it opens is where everything is reported.
        log(`started the update to ${latest.tag}; its report lands on the pull request it opens`);
        return;
      }
      // A refused dispatch is the one case somebody has to be told about, and the
      // reason GitHub gave stays in this run's log rather than in an issue: it names a
      // credential, and an issue body is not where a credential is described.
      log(`WARN GitHub refused the dispatch of the update to ${latest.tag}`);
      autoUpdateFailure = {
        mode,
        why: "GitHub refused the dispatch, and this run's log is where the reason is",
      };
    }
  }

  // Searched only on the path that writes a notice -- the one where the release is
  // waiting for somebody. A search that fails stops the run rather than reading as
  // "there is none", because opening a notice on every run the search blips is how a
  // repository gets one issue per day.
  const existing = findOpenNotice(repo);
  if (existing === null) {
    console.error(`::error::could not search ${repo} for an existing notice, so this run wrote nothing.`);
    process.exit(1);
  }

  // `marked` already read the list above, and the tag list it produced proves the read
  // landed; `all` reads it here, at the point it always did.
  const notes = scoped !== undefined ? scoped : releaseNotes();
  const targetRelease = releaseFiles(latest.tag);

  // What the target release no longer ships: the manifest inside its asset against
  // the tree's own. Degraded to "not computed" with the reason, never an empty list.
  // (`existing` was taken before this: valueless work remains valueless work.)
  const removed =
    "why" in targetRelease ? null : noLongerShipped(targetRelease.files.manifest, local.manifest.files);
  const removedWhy = `${RELEASE_MANIFEST} could not be read out of ${latest.tag}'s release asset.`;

  // The plan is the notice's "what would this actually do here" table. It needs the
  // release the tree came from as well as the target, which is two asset downloads
  // where this used to be one — the price of answering concretely rather than
  // announcing a version number. Degraded, not failed: a plan that cannot be read
  // leaves the notice without its table, never leaves the tree with a wrong one.
  const baseRelease = releaseFiles(local.manifest.version);
  let plan: PlanSummary | null = null;
  let planWhy = "";
  if ("why" in baseRelease) {
    planWhy = `this tree's own release (${local.manifest.version}) could not be read: ${baseRelease.why}`;
  } else if ("why" in targetRelease) {
    planWhy = `the target release (${latest.tag}) could not be read: ${targetRelease.why}`;
  } else {
    const paths = new Set([...baseRelease.files.files.keys(), ...targetRelease.files.files.keys()]);
    const tree = readTreeFiles(paths);
    const computed = planUpdate(
      local.manifest.version,
      latest.tag,
      baseRelease.files.files,
      targetRelease.files.files,
      tree,
    );
    plan = {
      take: computed.take,
      add: computed.add,
      deleted: computed.delete,
      both: computed.merge,
      kept: computed.kept,
    };
  }

  const input: NoticeInput = {
    localVersion: local.manifest.version,
    latestVersion: latest.tag,
    window: notes === null ? null : releaseWindow(notes, local.manifest.version),
    windowWhy: `the release list could not be read.`,
    markedReleases: marked,
    removed,
    removedWhy,
    plan,
    planWhy,
    autoUpdateFailure,
  };

  const title = noticeTitle(input);
  const body = noticeBody(input);

  const written =
    existing === 0
      ? gh("issue", "create", "--repo", repo, "--title", title, "--body", body)
      : gh("issue", "edit", String(existing), "--repo", repo, "--title", title, "--body", body);
  if (written.code !== 0) {
    console.error(
      `::error::could not ${existing === 0 ? "open" : `update #${existing} in`} ${repo} with the notice for ` +
        `${latest.tag}: ${written.stderr.trim() || `gh exited ${written.code}`}`,
    );
    process.exit(1);
  }

  const where = existing === 0 ? written.stdout.trim() : `#${existing}`;
  log(`announced ${latest.tag} (this tree is on ${local.manifest.version}) at ${where}`);
}

if (import.meta.main) main();
