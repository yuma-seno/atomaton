#!/usr/bin/env bun
// @bun

// src/entrypoints/machinery/prune_atomaton_data.ts
import { parseArgs } from "util";
import { existsSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

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
function gitRun(...args) {
  return run(["git", ...args]);
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
function ghPaginated(...args) {
  const { code, stdout, stderr } = gh(...args, "--paginate");
  if (code !== 0) {
    throw new Error(`gh ${args.join(" ")} --paginate: ${stderr || stdout}`);
  }
  if (!stdout.trim())
    return [];
  const flat = [];
  for (const page of splitConcatenatedJson(stdout)) {
    if (Array.isArray(page))
      flat.push(...page);
  }
  return flat;
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
  return {
    marker: `${TAG_PREFIX}${key}`,
    write: (value) => `<!-- ${TAG_PREFIX}${key}=${render(value)} -->`,
    read: (text) => {
      const m = re.exec(text);
      return m ? parse(m[1]) : undefined;
    },
    has: (text) => re.test(text),
    search: (value) => `${TAG_PREFIX}${key}=${render(value)}`
  };
}
function numericTag(key) {
  return makeTag(key, "\\d+", Number, String);
}
function stringTag(key, valuePattern) {
  return makeTag(key, valuePattern, (raw) => raw, (value) => value);
}
var STOP_TAG = stringTag("stop", "requested");
var ENDED_TAG = stringTag("ended", "stopped|limit|done|handoff");
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

// src/domain/work/control-commands.ts
var CONTROL_COMMAND_NAMES = ["stop", "resume"];
function isControlCommand(name) {
  return CONTROL_COMMAND_NAMES.includes(name);
}

// src/domain/work/comment-command.ts
var COMMAND_RE = new RegExp(`^\\/(${AGENT_NAME_PATTERN})(?:\\s+(.*))?$`);
var DISPATCH_RE = new RegExp(`^<!--\\s*atomaton:dispatch\\s*=\\s*(${AGENT_NAME_PATTERN})\\s*-->`);
var NOTHING = { agent: "", control: "", sessionMode: "continue", error: "" };
function parseCommentCommand(body) {
  if (!body)
    return NOTHING;
  for (const rawLine of body.split(`
`)) {
    const line = rawLine.trim();
    const commandMatch = COMMAND_RE.exec(line);
    if (commandMatch) {
      const name = commandMatch[1];
      const modifier = commandMatch[2]?.trim() ?? "";
      if (isControlCommand(name)) {
        if (!modifier)
          return { ...NOTHING, control: name };
        return {
          ...NOTHING,
          error: `'/${name}' takes nothing after it. To resume with an instruction, use '/<agent>' and put the instruction on the following lines.`
        };
      }
      if (!modifier)
        return { ...NOTHING, agent: name };
      if (modifier === "recover")
        return { ...NOTHING, agent: name, sessionMode: "recover" };
      return {
        ...NOTHING,
        error: `Unknown command syntax: '/${name} ${modifier}'. Put instructions on the lines after '/${name}', or use '/${name} recover'.`
      };
    }
    const dispatchMatch = DISPATCH_RE.exec(line);
    if (dispatchMatch)
      return { ...NOTHING, agent: dispatchMatch[1] };
  }
  return NOTHING;
}

// src/domain/work/actor.ts
var BOT_TYPE = "Bot";
function isHumanActor(type) {
  return (type ?? "").trim().toLowerCase() !== BOT_TYPE.toLowerCase();
}

// src/domain/work/thread.ts
function eventOf(body, readers) {
  if (readers.isAgentResult(body))
    return readers.handedOff(body) ? "handed-off" : "returned";
  if (readers.requestedAgent(body) !== "")
    return "asked";
  return;
}
function whoseTurn(events) {
  const last = events[events.length - 1];
  return last === "asked" || last === "handed-off" ? "agent" : "person";
}
function shapedThread(comments, readers) {
  const kept = [];
  const events = [];
  for (const entry of comments) {
    if (entry.isHuman && whoseTurn(events) === "agent")
      continue;
    kept.push(entry);
    const event = eventOf(entry.body, readers);
    if (event !== undefined)
      events.push(event);
  }
  return { comments: kept, events };
}

// src/adapters/github/thread.ts
var readers = {
  isAgentResult: (body) => AGENT_TAG.has(body),
  handedOff: (body) => ENDED_TAG.read(body) === "handoff",
  requestedAgent: (body) => parseCommentCommand(body).agent
};
function isHumanComment(comment) {
  return isHumanActor(comment.user?.type);
}
function readComments(repo, number, excludeCommentId) {
  const listed = ghRead("api", `repos/${repo}/issues/${number}/comments`, "--paginate");
  if (listed.code !== 0)
    throw new Error(`could not read comments on #${number}: ${listed.stderr || listed.stdout}`);
  const excluded = String(excludeCommentId ?? "").trim();
  const comments = JSON.parse(listed.stdout || "[]").filter((comment) => String(comment.id) !== excluded).map((comment) => ({ body: comment.body ?? "", isHuman: isHumanComment(comment) }));
  return shapedThread(comments, readers);
}
function runInFlight(repo, number) {
  return whoseTurn(readComments(repo, number).events) === "agent";
}

// src/domain/machinery/data-layout.ts
var WORKSPACE_TREE = "workspace/";

// src/domain/machinery/atomaton-data-pruning.ts
var OWNED_TREES = [WORKSPACE_TREE];
function issueNumberOf(path) {
  const tree = OWNED_TREES.find((prefix) => path.startsWith(prefix));
  if (tree === undefined)
    return;
  const rest = path.slice(tree.length);
  const match = /^issue-(\d+)(?:[-/.]|$)/.exec(rest);
  if (match === undefined || match === null)
    return;
  const number = Number(match[1]);
  return Number.isSafeInteger(number) && number > 0 ? number : undefined;
}
function prunablePaths(paths, isOver) {
  const verdicts = new Map;
  const out = [];
  const issues = new Set;
  for (const path of paths) {
    const issue = issueNumberOf(path);
    if (issue === undefined)
      continue;
    if (!verdicts.has(issue))
      verdicts.set(issue, isOver(issue));
    if (!verdicts.get(issue))
      continue;
    out.push(path);
    issues.add(issue);
  }
  return { paths: out, issues: [...issues].sort((a, b) => a - b) };
}
function pruneCommitMessage(decision) {
  const files = `${decision.paths.length} file${decision.paths.length === 1 ? "" : "s"}`;
  const listed = decision.issues.map((n) => `#${n}`).join(", ");
  return `atomaton: prune ${files} from closed issues (${listed})`;
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
var DELEGATES_DIR = `${TOOLS_DIR}/delegates`;
var TOOL_HOOKS_DIR = `${TOOLS_DIR}/hooks`;
var TOOL_PACKAGES_FILE = `${TOOLS_DIR}/packages.json`;
var RULESETS_DIR = `${USER_ROOT}/rulesets`;
var SCRIPTS_DIR = `${RUNTIME_ROOT}/scripts`;

// src/entrypoints/machinery/lib/script-ref.ts
function defineScript(importMetaUrl) {
  return { runtimePath: `${SCRIPTS_DIR}/${basename(fileURLToPath(importMetaUrl))}` };
}

// src/entrypoints/machinery/prune_atomaton_data.ts
var ref = defineScript(import.meta.url);
var BRANCH = "atomaton-data";
function log(message) {
  console.error(`[prune-atomaton-data] ${message}`);
}
function issueStates(repo) {
  const byNumber = new Map;
  for (const state of ["open", "closed"]) {
    const page = ghPaginated("api", `repos/${repo}/issues?state=${state}&per_page=100`);
    for (const issue of page) {
      if (issue.pull_request !== undefined)
        continue;
      byNumber.set(issue.number, issue);
    }
  }
  return byNumber;
}
function isOver(states, isRunning, issue) {
  const found = states.get(issue);
  if (found === undefined) {
    log(`#${issue} could not be read; leaving its files alone`);
    return false;
  }
  if (found.state !== "closed")
    return false;
  if (isRunning(issue)) {
    log(`#${issue} is closed but a run is still in flight on it; leaving its files alone`);
    return false;
  }
  return true;
}
function storedPaths() {
  const listed = gitRun("ls-tree", "-r", "--name-only", `origin/${BRANCH}`);
  if (listed.code !== 0) {
    log(`could not list ${BRANCH}: ${listed.stderr || listed.stdout}`);
    return [];
  }
  return listed.stdout.split(`
`).map((line) => line.trim()).filter(Boolean);
}
function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: { repo: { type: "string" }, "dry-run": { type: "boolean" } }
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
  const isRunning = (issue) => {
    try {
      return runInFlight(repo, issue);
    } catch (e) {
      log(`could not read the thread on #${issue}; leaving its files alone: ${e.message}`);
      return true;
    }
  };
  const decision = prunablePaths(paths, (issue) => isOver(states, isRunning, issue));
  log(`${paths.length} stored files, ${decision.paths.length} belong to closed issues`);
  if (decision.paths.length === 0)
    return;
  log(`issues: ${decision.issues.map((n) => `#${n}`).join(", ")}`);
  if (values["dry-run"]) {
    for (const path of decision.paths)
      console.error(`  would delete ${path}`);
    return;
  }
  const worktree = mkdtempSync(join(tmpdir(), "atomaton-data-prune-"));
  try {
    gitRun("worktree", "add", worktree, `origin/${BRANCH}`);
    const git = (...args) => Bun.spawnSync({ cmd: ["git", ...args], cwd: worktree, stdout: "pipe", stderr: "pipe" });
    git("config", "user.email", "action@github.com");
    git("config", "user.name", "GitHub Actions");
    for (let attempt = 1;attempt <= 3; attempt++) {
      git("fetch", "origin", BRANCH);
      git("reset", "--hard", `origin/${BRANCH}`);
      const present = decision.paths.filter((path) => existsSync(join(worktree, path)));
      if (present.length === 0) {
        log("nothing left to delete after the refetch");
        return;
      }
      const stillDead = present.filter((path) => {
        const issue = issueNumberOf(path);
        if (issue === undefined)
          return true;
        if (!decision.issues.includes(issue))
          return true;
        if (!isRunning(issue))
          return true;
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
if (import.meta.main)
  main();
export {
  ref
};
