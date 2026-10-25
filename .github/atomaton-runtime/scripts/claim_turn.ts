#!/usr/bin/env bun
// @bun
var __require = import.meta.require;

// src/entrypoints/machinery/claim_turn.ts
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
function splitConcatenatedJson(text) {
  const results = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let i = 0;i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escaped)
        escaped = false;
      else if (c === "\\")
        escaped = true;
      else if (c === '"')
        inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{" || c === "[") {
      if (depth === 0)
        start = i;
      depth++;
    } else if (c === "}" || c === "]") {
      depth--;
      if (depth === 0 && start !== -1) {
        results.push(JSON.parse(text.slice(start, i + 1)));
        start = -1;
      }
    }
  }
  return results;
}

// src/domain/work/agent-name.ts
var AGENT_NAME_PATTERN = "[a-z][a-z0-9-]*";
var AGENT_NAME_RE = new RegExp(`^${AGENT_NAME_PATTERN}$`);

// src/domain/work/mention.ts
var LOGIN_PATTERN = "[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}";
var MENTION = new RegExp(`(^|[^\\w@/-])@(${LOGIN_PATTERN})\\b(?!\\/)`, "g");

// src/adapters/github/tags.ts
var TAG_PREFIX = `atomaton:`;
var EVERY_TAG_PATTERN = [];
function makeTag(key, valuePattern, parse, render) {
  const pattern = `<!--\\s*${TAG_PREFIX}${key}=(?:${valuePattern})\\s*-->`;
  EVERY_TAG_PATTERN.push(pattern);
  const re = new RegExp(`<!--\\s*${TAG_PREFIX}${key}=(${valuePattern})\\s*-->`);
  const read = (text) => {
    const m = re.exec(text);
    return m ? parse(m[1]) : undefined;
  };
  return {
    marker: `${TAG_PREFIX}${key}`,
    write: (value) => `<!-- ${TAG_PREFIX}${key}=${render(value)} -->`,
    read,
    readProse: (text) => read(proseOnly(text)),
    has: (text) => re.test(text),
    hasProse: (text) => re.test(proseOnly(text)),
    search: (value) => `${TAG_PREFIX}${key}=${render(value)}`
  };
}
function numericTag(key) {
  return makeTag(key, "\\d+", Number, String);
}
function stringTag(key, valuePattern) {
  return makeTag(key, valuePattern, (raw) => raw, (value) => value);
}
function makeCompoundTag(key, valuePattern, parse, render, searchValue) {
  const pattern = `<!--\\s*${TAG_PREFIX}${key}=(?:${valuePattern})\\s*-->`;
  EVERY_TAG_PATTERN.push(pattern);
  const re = new RegExp(`<!--\\s*${TAG_PREFIX}${key}=(?:${valuePattern})\\s*-->`);
  const read = (text) => {
    const m = re.exec(text);
    return m ? parse(m) : undefined;
  };
  return {
    marker: `${TAG_PREFIX}${key}`,
    write: (value) => `<!-- ${TAG_PREFIX}${key}=${render(value)} -->`,
    read,
    readProse: (text) => read(proseOnly(text)),
    has: (text) => re.test(text),
    hasProse: (text) => re.test(proseOnly(text)),
    search: searchValue
  };
}
var STOP_TAG = stringTag("stop", "requested");
var ENDED_TAG = makeCompoundTag("ended", String.raw`(stopped|limit|done|handoff|waiting|refused) answers=(\d+) run=(\d+)`, (match) => {
  const verb = match[1];
  const answers = match[2];
  const run = match[3];
  if (verb === undefined || answers === undefined || run === undefined)
    return;
  return { verb, answers: Number(answers), run: Number(run) };
}, ({ verb, answers, run }) => `${verb} answers=${answers} run=${run}`, ({ verb }) => `atomaton:ended=${verb}`);
var TOOK_TAG = makeCompoundTag("took", String.raw`(\d+) run=(\d+)`, (match) => {
  const ask = match[1];
  const run = match[2];
  if (ask === undefined || run === undefined)
    return;
  return { ask: Number(ask), run: Number(run) };
}, ({ ask, run }) => `${ask} run=${run}`, ({ ask }) => `atomaton:took=${ask}`);
var PARENT_ISSUE_TAG = numericTag("parent-issue");
var NOTIFY_TAG = stringTag("notify", LOGIN_PATTERN);
var ORIGIN_AGENT_TAG = stringTag("origin-agent", AGENT_NAME_PATTERN);
var DISPATCH_TAG = stringTag("dispatch", AGENT_NAME_PATTERN);
var AGENT_TAG = stringTag("agent", AGENT_NAME_PATTERN);
var CHANGED_TAG = stringTag("changed", "yes|no");
var LLM_CONTEXT_TAG = stringTag("llm-context", "include|exclude");
var AGGREGATED_TAG = numericTag("aggregated");
var SUB_RESULT_TAG = numericTag("sub-result");
var CI_RETRY_TAG = numericTag("ci-retry");
var QUOTES_TAG = numericTag("quotes");
function proseOnly(text) {
  return fenceSegments(text).map((segment) => segment.code ? `
` : segment.text).join("");
}
function fenceSegments(text) {
  const lines = text.match(/[^\n]*\n|[^\n]+$/g) ?? [];
  const segments = [];
  let open = null;
  let current = { text: "", code: false };
  for (const line of lines) {
    const bare = line.replace(/\r?\n$/, "");
    const fence = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(bare);
    if (open === null) {
      const opens = fence !== null && (fence[1][0] !== "`" || !fence[2].includes("`"));
      if (opens) {
        if (current.text)
          segments.push(current);
        open = { char: fence[1][0], length: fence[1].length };
        current = { text: line, code: true };
      } else {
        current.text += line;
      }
      continue;
    }
    current.text += line;
    if (fence && fence[1][0] === open.char && fence[1].length >= open.length && fence[2].trim() === "") {
      segments.push(current);
      current = { text: "", code: false };
      open = null;
    }
  }
  if (current.text)
    segments.push(current);
  return segments;
}

// src/entrypoints/machinery/lib/script-ref.ts
import { basename } from "path";
import { fileURLToPath } from "url";

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

// src/entrypoints/machinery/lib/script-ref.ts
function defineScript(importMetaUrl) {
  return { runtimePath: `${SCRIPTS_DIR}/${basename(fileURLToPath(importMetaUrl))}` };
}

// src/entrypoints/machinery/claim_turn.ts
var ref = defineScript(import.meta.url);
var READ_DELAYS_MS = [1000, 2000, 4000];
function listBodies(repo, number) {
  const listed = ghRead("api", `repos/${repo}/issues/${number}/comments`, "--paginate", "--jq", ".");
  if (listed.code !== 0)
    throw new Error(`could not read #${number}'s comments: ${listed.stderr || listed.stdout}`);
  const comments = [];
  for (const page of splitConcatenatedJson(listed.stdout || "[]")) {
    if (!Array.isArray(page))
      continue;
    for (const entry of page) {
      if (typeof entry.id === "number")
        comments.push({ id: entry.id, body: entry.body ?? "" });
    }
  }
  return comments;
}
var CLAIM_NOTICE = "Atomaton: claimed this turn.";
function claimCommentBody(args) {
  return [LLM_CONTEXT_TAG.write("exclude"), TOOK_TAG.write(args), CLAIM_NOTICE].join(`
`);
}
function raceOutcome(comments, mine) {
  for (const comment of comments) {
    if (comment.id >= mine.id)
      break;
    const claim = TOOK_TAG.readProse(comment.body);
    if (claim !== undefined && claim.ask === mine.ask)
      return "backed-off";
  }
  return "held";
}
async function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      number: { type: "string" },
      ask: { type: "string" },
      "run-id": { type: "string" },
      repo: { type: "string" }
    }
  });
  const repo = values.repo ?? process.env.GITHUB_REPOSITORY ?? "";
  const number = Number(values.number);
  const runId = Number(values["run-id"] ?? process.env.GITHUB_RUN_ID ?? 0);
  const ask = Number(values.ask ?? 0) || 0;
  const record = (claimed) => {
    const out = process.env.GITHUB_OUTPUT;
    if (out) {
      const { appendFileSync } = __require("fs");
      appendFileSync(out, `claimed=${claimed ? "true" : "false"}
`);
    }
    console.error(`claim_turn: claimed=${claimed ? "true" : "false"} (ask=${ask}, run=${runId})`);
  };
  if (!Number.isInteger(number) || number <= 0)
    throw new Error("--number must be a positive number");
  if (ask <= 0) {
    record(true);
    return;
  }
  if (!Number.isInteger(runId) || runId <= 0)
    throw new Error("--run-id must be a positive number");
  const posted = gh("api", `repos/${repo}/issues/${number}/comments`, "--method", "POST", "-f", `body=${claimCommentBody({ ask, run: runId })}`, "--jq", ".id");
  if (posted.code !== 0)
    throw new Error(`could not post the claim on #${number}: ${posted.stderr || posted.stdout}`);
  const claimId = Number(posted.stdout.trim());
  if (!Number.isInteger(claimId) || claimId <= 0)
    throw new Error(`the claim's id came back unreadable: ${posted.stdout.trim()}`);
  let visible = false;
  for (let attempt = 0;attempt <= READ_DELAYS_MS.length; attempt += 1) {
    if (listBodies(repo, number).some((comment) => comment.id === claimId)) {
      visible = true;
      break;
    }
    const delay = READ_DELAYS_MS[attempt];
    if (delay === undefined)
      break;
    await Bun.sleep(delay);
  }
  if (!visible)
    throw new Error(`the claim on #${number} never became visible, so the race check cannot be trusted`);
  const outcome = raceOutcome(listBodies(repo, number), { id: claimId, ask });
  if (outcome === "held") {
    record(true);
    return;
  }
  const removed = gh("api", `repos/${repo}/issues/comments/${claimId}`, "--method", "DELETE");
  if (removed.code !== 0) {
    throw new Error(`could not take back the claim on #${number}: ${removed.stderr || removed.stdout}`);
  }
  record(false);
}
if (import.meta.main)
  main();
export {
  claimCommentBody,
  raceOutcome,
  ref
};
