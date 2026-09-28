/**
 * Reconstruct the merged tree (atomaton/issue-18 @ b8615700) in a scratch
 * directory: copy this checkout, then overwrite every file the two pull
 * requests changed with its content from that commit, and report the git blob
 * hash of each so it can be compared with GitHub's own.
 */
import { cpSync, mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const SHA = "b861570043c408385c717d3b5e401f8a40b7731a";
const SRC = "/home/runner/work/atomaton/atomaton";
const DEST = "/tmp/merged-tree";

const FILES = [
  // PR #21
  ".github/atomaton/config.yaml",
  "self/atomaton/config.yaml",
  "src/entrypoints/machinery/decide_turn_ending.test.ts",
  "src/entrypoints/machinery/extract_notify_tag.test.ts",
  "src/entrypoints/machinery/inject_uncommitted_notice.test.ts",
  "src/entrypoints/machinery/parse_pr_metadata.test.ts",
  "src/entrypoints/machinery/read_run_ending.test.ts",
  "src/entrypoints/machinery/read_secret_names.test.ts",
  "src/entrypoints/machinery/redact_stream.test.ts",
  "src/entrypoints/machinery/resolve_entry_agent.test.ts",
  "src/entrypoints/machinery/run_environment_setup.test.ts",
  "src/entrypoints/machinery/testing/harness.ts",
  "src/entrypoints/machinery/write_credentials_file.test.ts",
  "src/entrypoints/tools/hooks/shell_guard.test.ts",
  "tests/contract/deployed-config.test.ts",
  "tests/contract/test-hermetic-env.test.ts",
  // PR #24
  "CONTRIBUTING.md",
  "package.json",
  "tests/contract/test-builds-first.test.ts",
];

rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });
cpSync(SRC, DEST, {
  recursive: true,
  filter: (src) => !/(\/|\\)(node_modules|\.git|dist)$/.test(src),
});
symlinkSync(join(SRC, "node_modules"), join(DEST, "node_modules"), "junction");

function gitBlob(bytes) {
  const header = `blob ${bytes.length}\0`;
  return createHash("sha1").update(Buffer.concat([Buffer.from(header, "utf8"), bytes])).digest("hex");
}

for (const file of FILES) {
  const url = `https://raw.githubusercontent.com/yuma-seno/atomaton/${SHA}/${file}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  const path = join(DEST, file);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, bytes);
  console.log(`${gitBlob(bytes)}  ${file}`);
}
console.log(`\nreconstructed ${FILES.length} files in ${DEST}`);
