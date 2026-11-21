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
 * is anything to download. This is the announcement, and it is the whole of it:
 * nothing is written into the tree from here.
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
  return `Template release ${input.latestVersion} is available; .github/ is on ${input.localVersion}`;
}

/** The issue's body: what is there, how to take it, what it drops, and what changed. */
export function noticeBody(input: NoticeInput): string {
  const lines: string[] = [
    NOTICE_MARKER,
    `Upstream has published **${input.latestVersion}**. This repository's \`.github/\` came from **${input.localVersion}**.`,
    "",
    "| | |",
    "| --- | --- |",
    `| This repository's \`.github/\` is from | \`${input.localVersion}\` |`,
    `| The latest release is | \`${input.latestVersion}\` |`,
    "",
    "## Taking it",
    "",
  ];

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

  // Searched before the comparison, because both outcomes have something to do with
  // an open notice: one updates it and the other is the reason it should not still
  // be open. A search that fails stops the run either way — told apart from "there
  // is none", because opening a notice on every run the search blips is how a
  // repository gets one issue per day.
  const existing = findOpenNotice(repo);
  if (existing === null) {
    console.error(`::error::could not search ${repo} for an existing notice, so this run wrote nothing.`);
    process.exit(1);
  }

  if (latest.tag === local.manifest.version) {
    // Caught up. An open notice that says otherwise is worse than no notice: the
    // next release would then be announced by editing an issue whose whole body is
    // about a version that is no longer the one waiting.
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

  const notes = releaseNotes();
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
    removed,
    removedWhy,
    plan,
    planWhy,
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
