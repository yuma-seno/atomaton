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
 * nothing is fetched, unpacked or written into the tree from here.
 *
 * ## The two versions, and which repository each comes from
 *
 * `local` is `.github/atomaton-release.json`, which ships in every release and
 * names the release it came from. `latest` is GitHub's own latest release of
 * `UPSTREAM_REPOSITORY`, the template. They are the same repository in this
 * repository, which is why a scheduled run here is a no-op: self-deploy keeps the
 * two equal.
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
 * and `unzip -o` never deletes anyway. The settle-by-close above is the one write
 * that is not about a release, and it can only close an issue this script opened.
 *
 * Usage:
 *   notify_new_release.ts --repo OWNER/REPO   (or set GITHUB_REPOSITORY)
 */
import { existsSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { gh, ghRead } from "../../adapters/github/gh.ts";
import { machineryPath } from "../../adapters/runner/machinery.ts";
import { RELEASE_MANIFEST } from "../../domain/machinery/machinery-layout.ts";
import { noLongerShipped, type ReleaseManifest } from "../../domain/machinery/release-manifest.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface NotifyNewReleaseArgs {
  /** `owner/name` of the repository the notice is opened in — the adopted tree's own. */
  repo: string;
}

export const ref = defineScript<NotifyNewReleaseArgs>(import.meta.url);

/**
 * Where a release comes from.
 *
 * Named in one place because two calls need it and they have to agree. It is the
 * same slug `src/content/README.md` links to and `atoma-cli.ts` downloads from: an
 * adopted tree reaches upstream by name, and the name is what it is.
 */
export const UPSTREAM_REPOSITORY = "yuma-seno/atomaton";

/** Where the recipe the notice points at lives, as an adopter can reach it. */
const UPGRADE_DOC = `https://github.com/${UPSTREAM_REPOSITORY}/blob/main/docs/runtime/tasks/move-to-a-newer-release.md`;

/**
 * The marker that makes the notice findable, and that keeps it to one.
 *
 * A comment rather than a label: labels are the project's to name and this is not,
 * and searching for a comment body needs no label to exist first.
 */
export const NOTICE_MARKER = "<!-- atomaton:new-release -->";

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
    "Nothing has been changed for you: this is a notice, and the upgrade is a decision.",
    "",
    "```bash",
    `gh release download ${input.latestVersion} -R ${UPSTREAM_REPOSITORY} -p atomaton-delivery.zip`,
    "unzip -o atomaton-delivery.zip   # the archive holds .github/, so run this at the repository root",
    "rm atomaton-delivery.zip",
    "git diff .github/                # every difference is now a decision",
    "```",
    "",
    `What to keep, and which files an upgrade replaces: [move to a newer release](${UPGRADE_DOC}).`,
    "",
    "## Files upstream no longer ships",
    "",
  ];

  if (input.removed === null) {
    lines.push(`Not computed: ${input.removedWhy}`, "", `Compare by hand — [the page](${UPGRADE_DOC}) has the command.`);
  } else if (input.removed.length === 0) {
    lines.push("None: everything the previous release shipped is still shipped by this one.");
  } else {
    lines.push(
      "Extracting never deletes, so these stay in the tree unless somebody removes them.",
      "The list comes from the previous release's own manifest rather than from your tree, so",
      "nothing you wrote is on it — but a path here can still be one you edited on purpose, and",
      "that is the judgement to make before deleting.",
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

/** The release this tree came from, or the reason it cannot be read. */
function readLocalManifest(): { manifest: ReleaseManifest } | { why: string } {
  const path = machineryPath(RELEASE_MANIFEST);
  if (!existsSync(path)) {
    // A tree that cannot say which release it is on cannot be compared with
    // anything, and inventing "up to date" for it would be the failure this whole
    // script exists to prevent. Failing is what `plan_deploy.ts` does with a
    // declaration it could not read, for the same reason.
    return { why: `${path} is missing, so this tree cannot say which release it came from` };
  }
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<ReleaseManifest>;
    if (typeof parsed.version !== "string" || !parsed.version || !Array.isArray(parsed.files)) {
      return { why: `${path} does not hold a version and a file list` };
    }
    return { manifest: { version: parsed.version, files: parsed.files.map(String) } };
  } catch (error) {
    return { why: `${path} could not be parsed: ${(error as Error).message}` };
  }
}

/** The latest release's tag, or null when it could not be read. */
function latestRelease(): { tag: string; url: string } | null {
  const result = ghRead(
    "api",
    `repos/${UPSTREAM_REPOSITORY}/releases/latest`,
    "--jq",
    "{tag: .tag_name, url: .html_url}",
  );
  if (result.code !== 0) {
    log(`WARN could not read ${UPSTREAM_REPOSITORY}'s latest release: ${result.stderr.trim() || `gh exited ${result.code}`}`);
    return null;
  }
  try {
    const parsed = JSON.parse(result.stdout) as { tag?: string; url?: string };
    if (!parsed.tag) {
      log("WARN the latest release came back with no tag");
      return null;
    }
    return { tag: parsed.tag, url: parsed.url ?? "" };
  } catch {
    log("WARN the latest release was not valid JSON");
    return null;
  }
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
 * The manifest the latest release shipped, or null.
 *
 * Read from the repository at that tag rather than out of the zip: the asset is a
 * download and an unpack for one JSON file, and the file is the same file.
 */
function upstreamManifest(tag: string): ReleaseManifest | null {
  const result = ghRead(
    "api",
    "-H",
    "Accept: application/vnd.github.raw",
    `repos/${UPSTREAM_REPOSITORY}/contents/${RELEASE_MANIFEST}?ref=${tag}`,
  );
  if (result.code !== 0) {
    log(`WARN could not read ${RELEASE_MANIFEST} at ${tag}: ${result.stderr.trim() || `gh exited ${result.code}`}`);
    return null;
  }
  try {
    const parsed = JSON.parse(result.stdout) as Partial<ReleaseManifest>;
    if (!Array.isArray(parsed.files)) {
      log(`WARN ${RELEASE_MANIFEST} at ${tag} holds no file list`);
      return null;
    }
    return { version: String(parsed.version ?? tag), files: parsed.files.map(String) };
  } catch {
    log(`WARN ${RELEASE_MANIFEST} at ${tag} was not valid JSON`);
    return null;
  }
}

/**
 * The open notice's number, `0` for none, or null when the list could not be read.
 *
 * The query is the title's own words, and the marker is then checked in the body
 * here rather than through the search index. Title words are certainly indexed; a
 * hidden HTML comment is not something this can be sure of from here, and a query
 * the index does not match would leave this run opening a fresh notice every day —
 * the one failure that compounds. Checking the body in TypeScript makes the other
 * direction safe too: an issue whose title happens to match, and which no run of
 * this wrote, is not edited.
 */
function existingNotice(repo: string): number | null {
  const result = ghRead(
    "issue", "list", "--repo", repo, "--state", "open",
    "--search", `"Template release" in:title`,
    "--json", "number,body",
  );
  if (result.code !== 0) {
    log(`WARN could not look for an existing notice in ${repo}: ${result.stderr.trim() || `gh exited ${result.code}`}`);
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(result.stdout || "[]");
  } catch {
    log(`WARN the issue search in ${repo} did not answer with JSON`);
    return null;
  }
  if (!Array.isArray(parsed)) {
    log(`WARN the issue search in ${repo} did not answer with a list`);
    return null;
  }
  const found = parsed.find((entry) => {
    const issue = entry as { number?: unknown; body?: unknown };
    return typeof issue.body === "string" && issue.body.includes(NOTICE_MARKER);
  }) as { number?: unknown } | undefined;
  const number = Number(found?.number ?? 0);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

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

  const latest = latestRelease();
  if (latest === null) {
    console.error(
      `::error::could not read ${UPSTREAM_REPOSITORY}'s latest release, so a newer one cannot be ` +
        "announced. A failed read is not an answer of 'up to date'.",
    );
    process.exit(1);
  }

  // Searched before the comparison, because both outcomes have something to do with
  // an open notice: one updates it and the other is the reason it should not still
  // be open. A search that fails stops the run either way — told apart from "there
  // is none", because opening a notice on every run the search blips is how a
  // repository gets one issue per day.
  const existing = existingNotice(repo);
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
      `${NOTICE_MARKER}\n\`.github/\` is on ${local.manifest.version}, which is the latest release, so this notice is settled and closes itself. A newer one opens a new notice.`,
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
  const shipped = upstreamManifest(latest.tag);

  const input: NoticeInput = {
    localVersion: local.manifest.version,
    latestVersion: latest.tag,
    window: notes === null ? null : releaseWindow(notes, local.manifest.version),
    windowWhy: `the release list could not be read.`,
    removed: shipped === null ? null : noLongerShipped(shipped, local.manifest.files),
    removedWhy: `${RELEASE_MANIFEST} could not be read at ${latest.tag}.`,
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
