#!/usr/bin/env bun
// @bun

// src/entrypoints/machinery/guard_comment_during_run.ts
import { appendFileSync } from "fs";
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

// src/adapters/runner/config.ts
import { readFileSync } from "fs";

// src/domain/delivery/merge-readiness.ts
var CI_WOULD_BE_WASTED = new Set([
  "not-open",
  "draft",
  "conflicting",
  "behind",
  "mergeability-unknown",
  "checks-pending",
  "checks-failing"
]);
var PASSING = new Set(["success", "neutral", "skipped"]);

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
var MACHINERY_ROOT_VAR = "ATOMATON_MACHINERY_ROOT";

// src/domain/delivery/declared-secrets.ts
var RUN_CREDENTIALS = [
  "OPENAI_API_KEY",
  "OPENROUTER_API_KEY",
  "ORCAROUTER_API_KEY",
  "ANTHROPIC_API_KEY",
  "ATOMA_COPILOT_TOKEN",
  "GH_TOKEN"
];
var AGENT_ENV_NAMES = [
  "HOME",
  "PATH",
  "AGENT",
  MACHINERY_ROOT_VAR,
  "GITHUB_REPOSITORY",
  "BRANCH",
  "ISSUE_NUMBER",
  "ISSUE_NOTIFY",
  "ATOMATON_RUN_TYPE",
  "ATOMATON_RELOAD_COUNT",
  "ATOMATON_OPS_LOG",
  "ATOMATON_DISPATCHED_BY",
  "XDG_CACHE_HOME",
  "XDG_CONFIG_HOME",
  "XDG_DATA_HOME",
  "BUN_INSTALL_CACHE_DIR",
  "npm_config_cache",
  "PIP_CACHE_DIR",
  "CARGO_HOME",
  "OPENAI_BASE_URL",
  "ATOMA_PROVIDER"
];
var RUN_STEP_NAMES = [
  "GITHUB_RUN_ID",
  "OPENROUTER_BASE_URL",
  "ORCAROUTER_BASE_URL",
  "ANTHROPIC_BASE_URL",
  "COPILOT_BASE_URL",
  "ATOMA_PROVIDER_IN",
  "OPENAI_BASE_URL_IN"
];
var TOOL_SECRETS = {
  field: "tools.secrets",
  reserved: new Set([...RUN_CREDENTIALS, ...AGENT_ENV_NAMES, ...RUN_STEP_NAMES])
};
var JOB_ENV = ["ATOMATON_COMMANDS", "GH_TOKEN"];
var CHECK_JOB_RESERVED = new Set([...JOB_ENV, "ATOMATON_PR_TREE"]);
var DEPLOY_JOB_RESERVED = new Set([...JOB_ENV, "ATOMATON_DEPLOY_TARGET"]);

// src/domain/delivery/check-jobs.ts
var CHECKS_FROM_PULL_REQUEST = {
  where: "checks.from_pull_request",
  secrets: {
    refused: "These commands come from the pull request, which may rewrite them, so a credential " + "named beside them is one the change being judged can read. Move the check to " + "`checks.from_default_branch`, where the commands come from a branch a person approved."
  }
};
var NO_PULL_REQUEST_CHECKS = "This check verified nothing: `checks.from_pull_request` in .github/atomaton/config.yaml is empty, " + "so a pull request satisfying it has not been tested. Add the commands that check this project, " + "or point `checks.your_workflow` at a workflow of your own.";

// src/adapters/runner/machinery.ts
function machineryRoot() {
  return process.env[MACHINERY_ROOT_VAR]?.trim() || undefined;
}
function machineryPath(relative) {
  const root = machineryRoot();
  return root ? `${root}/${relative}` : relative;
}

// src/adapters/runner/config.ts
function configPath() {
  return machineryPath(CONFIG_FILE);
}
var cached;
function loadConfig() {
  if (!cached) {
    cached = Bun.YAML.parse(readFileSync(configPath(), "utf8"));
  }
  return cached;
}
var DEFAULT_LABELS = {
  sub_issue: "atomaton/sub-issue",
  launched: "atomaton/launched",
  in_progress: "atomaton/in-progress"
};
function getLabel(key) {
  return loadConfig().chain?.labels?.[key] ?? DEFAULT_LABELS[key];
}

// src/domain/work/agent-name.ts
var AGENT_NAME_PATTERN = "[a-z][a-z0-9-]*";
var AGENT_NAME_RE = new RegExp(`^${AGENT_NAME_PATTERN}$`);

// src/domain/work/mention.ts
var LOGIN_PATTERN = "[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}";
var MENTION = new RegExp(`(^|[^\\w@/-])@(${LOGIN_PATTERN})\\b(?!\\/)`, "g");
function mentionPrefix(login) {
  const name = (login ?? "").trim();
  return name ? `@${name} ` : "";
}

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
var ENDED_TAG = stringTag("ended", "stopped|limit|done|handoff|waiting");
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
  if (readers.waiting(body))
    return "waiting";
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
  waiting: (body) => ENDED_TAG.read(body) === "waiting",
  requestedAgent: (body) => parseCommentCommand(body).agent,
  isDispatchMarker: (body) => DISPATCH_TAG.has(body)
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
function readThread(repo, number, excludeCommentId) {
  const issue = ghRead("api", `repos/${repo}/issues/${number}`, "--jq", ".body");
  if (issue.code !== 0)
    throw new Error(`could not read #${number}: ${issue.stderr || issue.stdout}`);
  return { body: issue.stdout ?? "", shaped: readComments(repo, number, excludeCommentId) };
}
function commentWouldBeRemoved(repo, number, commentId) {
  return whoseTurn(readThread(repo, number, commentId).shaped.events) === "agent";
}

// src/entrypoints/machinery/lib/script-ref.ts
import { basename } from "path";
import { fileURLToPath } from "url";
function defineScript(importMetaUrl) {
  return { runtimePath: `${SCRIPTS_DIR}/${basename(fileURLToPath(importMetaUrl))}` };
}

// src/entrypoints/machinery/guard_comment_during_run.ts
var ref = defineScript(import.meta.url);
function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      number: { type: "string" },
      "comment-id": { type: "string" },
      commenter: { type: "string" }
    }
  });
  if (!values.number || !values["comment-id"]) {
    console.error("usage: guard_comment_during_run.ts --number N --comment-id ID --commenter LOGIN");
    process.exit(2);
  }
  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const label = getLabel("in_progress");
  const githubOutput = process.env.GITHUB_OUTPUT;
  let removed;
  try {
    removed = commentWouldBeRemoved(repo, values.number, values["comment-id"]);
  } catch (e) {
    console.error(`Could not read the thread on #${values.number}, so this cannot tell whose turn it is: ${e}`);
    process.exit(1);
  }
  if (!removed) {
    if (githubOutput)
      appendFileSync(githubOutput, `blocked=false
`);
    return;
  }
  const { code: delCode, stdout: delOut, stderr: delErr } = gh("api", "--method", "DELETE", `repos/${repo}/issues/comments/${values["comment-id"]}`);
  const deleted = delCode === 0;
  if (!deleted) {
    console.error(`Warning: failed to delete comment #${values["comment-id"]} on #${values.number}: ${delErr || delOut}`);
  }
  const mention = mentionPrefix(values.commenter);
  const what = deleted ? "Your comment was removed because" : "Your comment could not be removed, and will not be acted on, because";
  gh("issue", "comment", String(values.number), "--repo", repo, "--body", [
    LLM_CONTEXT_TAG.write("exclude"),
    `${mention}${what} Atomaton is currently processing this issue/PR (the \`${label}\` label is active). Please wait for the current run to finish, then comment again.`
  ].join(`
`));
  if (githubOutput)
    appendFileSync(githubOutput, `blocked=true
`);
  console.error(`Deleted comment #${values["comment-id"]} on #${values.number} (in-progress guard) and notified ${values.commenter || "(unknown)"}.`);
}
if (import.meta.main)
  main();
export {
  ref
};
