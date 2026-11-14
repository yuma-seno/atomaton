#!/usr/bin/env bun
// @bun

// src/entrypoints/machinery/notify_new_release.ts
import { existsSync, mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { parseArgs } from "util";

// src/adapters/github/gh.ts
function run(cmd) {
  const proc = Bun.spawnSync({
    cmd,
    stdout: "pipe",
    stderr: "pipe"
  });
  return {
    code: proc.exitCode ?? 1,
    stdout: proc.stdout ? proc.stdout.toString("utf8").trim() : "",
    stderr: proc.stderr ? proc.stderr.toString("utf8").trim() : ""
  };
}
function ghCommand() {
  const fake = (process.env.ATOMATON_FAKE_GH ?? "").trim();
  return fake ? [process.execPath, fake] : ["gh"];
}
function gh(...args) {
  return run([...ghCommand(), ...args]);
}
function ghRead(...args) {
  let result = gh(...args);
  for (const delay of [2000, 6000]) {
    if (result.code === 0 || !looksTransient(result))
      return result;
    console.error(`::warning::gh ${args.slice(0, 2).join(" ")} failed transiently, retrying: ${result.stderr || result.stdout}`);
    Bun.sleepSync(delay);
    result = gh(...args);
  }
  return result;
}
function looksTransient(result) {
  const text = `${result.stderr} ${result.stdout}`;
  if (/HTTP (429|5[0-9][0-9])(?![0-9])/.test(text))
    return true;
  return /(timeout|timed out|connection reset|unexpected EOF|TLS handshake|temporary failure)/i.test(text);
}

// src/domain/machinery/machinery-layout.ts
var USER_ROOT = ".github/atomaton";
var RUNTIME_ROOT = ".github/atomaton-runtime";
var CONFIG_FILE = `${USER_ROOT}/config.yaml`;
var AGENT_DEFINITIONS_DIR = `${USER_ROOT}/agent-definitions`;
var PROMPT_TEMPLATE = `${USER_ROOT}/prompt-template.md`;
var SKILLS_DIR = `${USER_ROOT}/skills`;
var TOOLS_DIR = `${RUNTIME_ROOT}/tools`;
var TOOL_DEFAULTS_FILE = `${TOOLS_DIR}/defaults.yaml`;
var DELEGATES_DIR = `${USER_ROOT}/delegates`;
var DELEGATES_FILE = `${DELEGATES_DIR}/delegates.yaml`;
var TOOL_HOOKS_DIR = `${TOOLS_DIR}/hooks`;
var TOOL_PACKAGES_FILE = `${TOOLS_DIR}/packages.json`;
var RULESETS_DIR = `${USER_ROOT}/rulesets`;
var SCRIPTS_DIR = `${RUNTIME_ROOT}/scripts`;
var RELEASE_MANIFEST = ".github/atomaton-release.json";
var MACHINERY_ROOT_VAR = "ATOMATON_MACHINERY_ROOT";

// src/adapters/runner/machinery.ts
function machineryRoot() {
  return process.env[MACHINERY_ROOT_VAR]?.trim() || undefined;
}
function machineryPath(relative) {
  const root = machineryRoot();
  return root ? `${root}/${relative}` : relative;
}

// src/domain/machinery/release-manifest.ts
function noLongerShipped(manifest, tree) {
  const shipped = new Set(manifest.files);
  return [...tree].map((path) => path.replace(/\\/g, "/")).filter((path) => !shipped.has(path)).sort();
}

// src/entrypoints/machinery/lib/script-ref.ts
import { basename } from "path";
import { fileURLToPath } from "url";
function defineScript(importMetaUrl) {
  return { runtimePath: `${SCRIPTS_DIR}/${basename(fileURLToPath(importMetaUrl))}` };
}

// src/entrypoints/machinery/notify_new_release.ts
var ref = defineScript(import.meta.url);
var UPSTREAM_REPOSITORY = "yuma-seno/atomaton";
var ASSET_NAME = "atomaton-delivery.zip";
var UPGRADE_DOC = `https://github.com/${UPSTREAM_REPOSITORY}/blob/main/docs/runtime/tasks/move-to-a-newer-release.md`;
var NOTICE_MARKER = "<!-- atomaton:new-release -->";
var MAX_RELEASES = 20;
var MAX_NOTES_CHARS = 1200;
function releaseWindow(notes, localVersion, max = MAX_RELEASES) {
  const at = notes.findIndex((note) => note.tag === localVersion);
  const newer = at === -1 ? [...notes] : notes.slice(0, at);
  return { newer: newer.slice(0, max), omitted: Math.max(0, newer.length - max), found: at !== -1 };
}
function notesOf(body) {
  const demoted = body.trim().split(`
`).map((line) => /^#{1,4}\s/.test(line) ? `##${line}` : line).join(`
`);
  if (demoted.length <= MAX_NOTES_CHARS)
    return demoted;
  return `${demoted.slice(0, MAX_NOTES_CHARS).trimEnd()}

\u2026the rest is on the release page.`;
}
function noticeTitle(input) {
  return `Template release ${input.latestVersion} is available; .github/ is on ${input.localVersion}`;
}
function noticeBody(input) {
  const lines = [
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
    `gh release download ${input.latestVersion} -R ${UPSTREAM_REPOSITORY} -p ${ASSET_NAME}`,
    `unzip -o ${ASSET_NAME}   # the archive holds .github/, so run this at the repository root`,
    `rm ${ASSET_NAME}`,
    "git diff .github/                # every difference is now a decision",
    "```",
    "",
    `What to keep, and which files an upgrade replaces: [move to a newer release](${UPGRADE_DOC}).`,
    "",
    "## Files upstream no longer ships",
    ""
  ];
  if (input.removed === null) {
    lines.push(`Not computed: ${input.removedWhy}`, "", `Compare by hand \u2014 [the page](${UPGRADE_DOC}) has the command.`);
  } else if (input.removed.length === 0) {
    lines.push("None: everything the previous release shipped is still shipped by this one.");
  } else {
    lines.push("Extracting never deletes, so these stay in the tree unless somebody removes them.", "The list is the difference between your release's manifest and the one inside the", "release above, so nothing you wrote is on it \u2014 but a path here can still be one you", "edited on purpose, and that is the judgement to make before deleting.", "", ...input.removed.map((path) => `- \`${path}\``));
  }
  lines.push("", "## Release notes", "");
  if (input.window === null) {
    lines.push(`Not read: ${input.windowWhy}`, "", `What changed is on [the releases page](https://github.com/${UPSTREAM_REPOSITORY}/releases).`);
  } else if (input.window.newer.length === 0) {
    lines.push(`No notes: ${input.localVersion} is not in the list of releases the API returned, so`, `everything between there and ${input.latestVersion} is on [the releases page](https://github.com/${UPSTREAM_REPOSITORY}/releases).`);
  } else {
    for (const note of input.window.newer) {
      lines.push(`### ${note.tag}`, "", notesOf(note.body) || "_No notes on the release._", "");
    }
    if (input.window.omitted > 0) {
      lines.push(`\u2026and ${input.window.omitted} older release(s), which [the releases page](https://github.com/${UPSTREAM_REPOSITORY}/releases) lists.`, "");
    }
    if (!input.window.found) {
      lines.push(`${input.localVersion} is older than the releases above, so the notes here are the newest ones`, "rather than everything since yours.", "");
    }
  }
  return `${lines.join(`
`).trimEnd()}
`;
}
function log(message) {
  console.error(`[new-release] ${message}`);
}
function readLocalManifest() {
  const path = machineryPath(RELEASE_MANIFEST);
  if (!existsSync(path)) {
    return { why: `${path} is missing, so this tree cannot say which release it came from` };
  }
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    if (typeof parsed.version !== "string" || !parsed.version || !Array.isArray(parsed.files)) {
      return { why: `${path} does not hold a version and a file list` };
    }
    return { manifest: { version: parsed.version, files: parsed.files.map(String) } };
  } catch (error) {
    return { why: `${path} could not be parsed: ${error.message}` };
  }
}
function latestRelease() {
  const result = ghRead("api", `repos/${UPSTREAM_REPOSITORY}/releases/latest`, "--jq", "{tag: .tag_name, url: .html_url}");
  if (result.code !== 0) {
    log(`WARN could not read ${UPSTREAM_REPOSITORY}'s latest release: ${result.stderr.trim() || `gh exited ${result.code}`}`);
    return null;
  }
  try {
    const parsed = JSON.parse(result.stdout);
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
function releaseNotes() {
  const result = ghRead("api", `repos/${UPSTREAM_REPOSITORY}/releases?per_page=100`, "--jq", '[.[] | {tag: .tag_name, body: (.body // ""), url: .html_url}]');
  if (result.code !== 0) {
    log(`WARN could not read ${UPSTREAM_REPOSITORY}'s releases: ${result.stderr.trim() || `gh exited ${result.code}`}`);
    return null;
  }
  try {
    const parsed = JSON.parse(result.stdout);
    if (!Array.isArray(parsed)) {
      log("WARN the release list was not an array");
      return null;
    }
    return parsed.filter((entry) => {
      const note = entry;
      return typeof note.tag === "string" && note.tag !== "";
    }).map((note) => ({ tag: note.tag, body: String(note.body ?? ""), url: String(note.url ?? "") }));
  } catch {
    log("WARN the release list was not valid JSON");
    return null;
  }
}
function upstreamManifest(tag) {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-release-"));
  try {
    const asset = join(dir, ASSET_NAME);
    const downloaded = ghRead("release", "download", tag, "-R", UPSTREAM_REPOSITORY, "-p", ASSET_NAME, "-D", dir);
    if (downloaded.code !== 0) {
      log(`WARN could not download ${tag}'s ${ASSET_NAME}: ${downloaded.stderr.trim() || `gh exited ${downloaded.code}`}`);
      return null;
    }
    if (!existsSync(asset)) {
      log(`WARN ${tag}'s download reported success but left no ${ASSET_NAME}`);
      return null;
    }
    let printed;
    try {
      const proc = Bun.spawnSync({ cmd: ["unzip", "-p", asset, RELEASE_MANIFEST], stdout: "pipe", stderr: "pipe" });
      printed = {
        code: proc.exitCode ?? 1,
        stdout: proc.stdout?.toString("utf8") ?? "",
        stderr: proc.stderr?.toString("utf8") ?? ""
      };
    } catch (error) {
      log(`WARN could not run unzip on ${tag}'s ${ASSET_NAME}: ${error.message}`);
      return null;
    }
    if (printed.code !== 0) {
      log(`WARN ${tag}'s ${ASSET_NAME} holds no readable ${RELEASE_MANIFEST}: ${printed.stderr.trim()}`);
      return null;
    }
    const parsed = JSON.parse(printed.stdout);
    if (!Array.isArray(parsed.files)) {
      log(`WARN ${RELEASE_MANIFEST} in ${tag}'s ${ASSET_NAME} holds no file list`);
      return null;
    }
    return { version: String(parsed.version ?? tag), files: parsed.files.map(String) };
  } catch (error) {
    log(`WARN could not read ${RELEASE_MANIFEST} out of ${tag}'s ${ASSET_NAME}: ${error.message}`);
    return null;
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    } catch {}
  }
}
function existingNotice(repo) {
  const result = ghRead("issue", "list", "--repo", repo, "--state", "open", "--search", `"Template release" in:title`, "--json", "number,body,state");
  if (result.code !== 0) {
    log(`WARN could not look for an existing notice in ${repo}: ${result.stderr.trim() || `gh exited ${result.code}`}`);
    return null;
  }
  let parsed;
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
    const issue = entry;
    return typeof issue.body === "string" && issue.body.includes(NOTICE_MARKER) && (issue.state === undefined || issue.state === "OPEN");
  });
  const number = Number(found?.number ?? 0);
  return Number.isInteger(number) && number > 0 ? number : 0;
}
function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: { repo: { type: "string" } }
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
    console.error(`::error::could not read ${UPSTREAM_REPOSITORY}'s latest release, so a newer one cannot be ` + "announced. A failed read is not an answer of 'up to date'.");
    process.exit(1);
  }
  const existing = existingNotice(repo);
  if (existing === null) {
    console.error(`::error::could not search ${repo} for an existing notice, so this run wrote nothing.`);
    process.exit(1);
  }
  if (latest.tag === local.manifest.version) {
    if (existing === 0) {
      log(`${local.manifest.version} is the latest release; nothing to announce`);
      return;
    }
    const closed = gh("issue", "close", String(existing), "--repo", repo, "--comment", `${NOTICE_MARKER}
\`.github/\` is on ${local.manifest.version}, which is the latest release, so this notice is settled and closes itself. A newer one opens a new notice.`);
    if (closed.code !== 0) {
      console.error(`::error::this tree caught up to ${local.manifest.version}, but the open notice #${existing} could not ` + `be closed: ${closed.stderr.trim() || `gh exited ${closed.code}`}`);
      process.exit(1);
    }
    log(`caught up to ${local.manifest.version}; closed the settled notice #${existing}`);
    return;
  }
  const notes = releaseNotes();
  const shipped = upstreamManifest(latest.tag);
  const input = {
    localVersion: local.manifest.version,
    latestVersion: latest.tag,
    window: notes === null ? null : releaseWindow(notes, local.manifest.version),
    windowWhy: `the release list could not be read.`,
    removed: shipped === null ? null : noLongerShipped(shipped, local.manifest.files),
    removedWhy: `${RELEASE_MANIFEST} could not be read out of ${latest.tag}'s release asset.`
  };
  const title = noticeTitle(input);
  const body = noticeBody(input);
  const written = existing === 0 ? gh("issue", "create", "--repo", repo, "--title", title, "--body", body) : gh("issue", "edit", String(existing), "--repo", repo, "--title", title, "--body", body);
  if (written.code !== 0) {
    console.error(`::error::could not ${existing === 0 ? "open" : `update #${existing} in`} ${repo} with the notice for ` + `${latest.tag}: ${written.stderr.trim() || `gh exited ${written.code}`}`);
    process.exit(1);
  }
  const where = existing === 0 ? written.stdout.trim() : `#${existing}`;
  log(`announced ${latest.tag} (this tree is on ${local.manifest.version}) at ${where}`);
}
if (import.meta.main)
  main();
export {
  ASSET_NAME,
  MAX_NOTES_CHARS,
  MAX_RELEASES,
  NOTICE_MARKER,
  UPSTREAM_REPOSITORY,
  noticeBody,
  noticeTitle,
  ref,
  releaseWindow
};
