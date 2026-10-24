#!/usr/bin/env bun
// @bun

// src/entrypoints/machinery/dispatch_agent.ts
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
function dispatchWorkflow(context, workflow, args = [], log = (m) => console.error(m)) {
  const { code, stdout, stderr } = gh("workflow", "run", workflow, ...args);
  if (code) {
    log(`${context}: WARN failed to dispatch ${workflow}: ${stderr || stdout}`);
    return false;
  }
  log(`${context}: dispatched ${workflow}`);
  return true;
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
var DELEGATES_DIR = `${USER_ROOT}/delegates`;
var DELEGATES_FILE = `${DELEGATES_DIR}/delegates.yaml`;
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
  "NUMBER",
  "NOTIFY",
  "TYPE",
  "ATOMATON_RELOAD_COUNT",
  "ATOMATON_OPS_LOG",
  "ATOMATON_RUN_DIR",
  "ATOMATON_RUN_URL",
  "ATOMATON_DISPATCHED_BY",
  "ATOMATON_ASK_ID",
  "GITHUB_RUN_ID",
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
function isAgentName(value) {
  return AGENT_NAME_RE.test(value);
}

// src/domain/work/node-type.ts
function isNodeType(value) {
  return value === "issue" || value === "pr";
}

// src/adapters/runner/ops-log.ts
import { appendFileSync } from "fs";
var OPS_LOG_PATH = process.env.ATOMATON_OPS_LOG ?? "/tmp/atomaton_ops.log";
function logOp(op, payload = {}) {
  const entry = { ts: new Date().toISOString(), op, ...payload };
  try {
    appendFileSync(OPS_LOG_PATH, JSON.stringify(entry) + `
`);
  } catch (e) {
    console.error(`[ops-log] WARN: failed to write op log: ${e}`);
  }
}
function logDispatch(target, agent, extra = {}) {
  const { elsewhere, ...rest } = extra;
  logOp(elsewhere === true ? "dispatch-elsewhere" : "dispatch", { target, agent, ...rest });
}

// src/adapters/runner/run-node.ts
function nodeNumber() {
  const parsed = Number((process.env.NUMBER ?? "").trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

// src/adapters/github/outcome.ts
function issueOutcome(reason) {
  const said = (reason ?? "").toLowerCase();
  return said === "not_planned" || said === "duplicate" ? "abandoned" : "done";
}
function pullRequestOutcome(merged) {
  return merged ? "done" : "abandoned";
}

// src/adapters/github/target-state.ts
function readTargetState(number, repo) {
  const path = repo ? `repos/${repo}/issues/${number}` : `repos/{owner}/{repo}/issues/${number}`;
  const { code, stdout, stderr } = ghRead("api", path);
  if (code !== 0) {
    return { known: false, why: (stderr || stdout || `gh exited ${code}`).trim().split(`
`)[0] ?? "" };
  }
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return { known: false, why: "the response was not JSON" };
  }
  const isPr = parsed.pull_request !== undefined;
  const kind = isPr ? "pull-request" : "issue";
  if (parsed.state === "open")
    return { known: true, kind, state: "open" };
  if (parsed.state === "closed") {
    return {
      known: true,
      kind,
      state: isPr ? pullRequestOutcome(Boolean(parsed.pull_request?.merged_at)) : issueOutcome(parsed.state_reason)
    };
  }
  return { known: false, why: `unrecognised state ${JSON.stringify(parsed.state ?? null)}` };
}

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
function isQuotation(body) {
  return QUOTES_TAG.has(body);
}
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
    const parsed = parseCommandLine(rawLine);
    if (parsed !== undefined)
      return parsed;
  }
  return NOTHING;
}
function parseCommandLine(rawLine) {
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
  return;
}
function lineForms(rawLine) {
  let line = rawLine.trim();
  if (!line)
    return [];
  line = line.replace(/^(?:[-*+]\s+|>\s*)+/, "");
  const variants = [line];
  if (line.startsWith("`") && line.endsWith("`") && line.length > 2) {
    variants.push(line.slice(1, -1).trim());
  }
  if (line.startsWith("/`") && line.endsWith("`") && line.length > 3) {
    variants.push("/" + line.slice(2, -1).trim());
  }
  return variants;
}
function parseMangledCommand(body) {
  if (!body)
    return NOTHING;
  for (const rawLine of body.split(`
`)) {
    for (const form of lineForms(rawLine)) {
      const parsed = parseCommentCommand(form);
      if (parsed.agent !== "" || parsed.control !== "")
        return parsed;
    }
  }
  return NOTHING;
}

// src/domain/work/actor.ts
var BOT_TYPE = "Bot";
function isHumanActor(type) {
  return (type ?? "").trim().toLowerCase() !== BOT_TYPE.toLowerCase();
}

// src/domain/work/thread.ts
function eventOf(entry, readers) {
  if (entry.quoted)
    return;
  const ending = readers.ending(entry.body);
  if (ending !== "")
    return ending;
  if (readers.requestedAgent(entry.body) !== "")
    return "asked";
  return;
}
function requestOutstanding(events) {
  return events[events.length - 1] === "asked";
}
function askSuperseded(comments, readers, askId, agent, verdictPassed) {
  let answeredHere;
  let answeredBy = "";
  const answeredAsks = new Set;
  const claimedAsks = new Set;
  const asks = [];
  for (const entry of comments) {
    if (entry.quoted)
      continue;
    if (readers.requestedAgent(entry.body) !== "" || readers.isDispatchMarker(entry.body)) {
      asks.push({ id: entry.id, marker: readers.isDispatchMarker(entry.body) });
    }
    const claim = readers.claim(entry.body);
    if (claim !== undefined)
      claimedAsks.add(claim.ask);
    const answer = readers.answeredAsk(entry.body);
    if (answer !== undefined && answer > 0) {
      answeredAsks.add(answer);
      if (answer === askId) {
        answeredHere = readers.ending(entry.body) || undefined;
        answeredBy = readers.endingAgent(entry.body);
      }
    }
  }
  const quoted = asks.find((ask) => ask.id === askId);
  if (quoted?.marker === true && !claimedAsks.has(askId))
    return "run-coming";
  if (answeredHere === "handed-off")
    return "handed-off";
  if (answeredHere === "waiting")
    return "waiting";
  if (answeredHere === "returned") {
    const own = answeredBy === "" || answeredBy === agent;
    if (own && verdictPassed !== false)
      return "own-verdict";
  }
  for (let index = asks.length - 1;index >= 0; index -= 1) {
    const ask = asks[index];
    if (ask.id <= askId)
      break;
    if (!answeredAsks.has(ask.id))
      return "newer-open-ask";
  }
  return;
}
function shapedThread(comments, readers) {
  const kept = [];
  const events = [];
  let openClaim;
  let openClaimRun;
  for (const entry of comments) {
    if (entry.isHuman && openClaim !== undefined)
      continue;
    kept.push(entry);
    if (!entry.quoted) {
      const event = eventOf(entry, readers);
      const claim = readers.claim(entry.body);
      if (claim !== undefined) {
        openClaim = claim.ask;
        openClaimRun = claim.run;
      } else if (openClaim !== undefined) {
        const answered = readers.answeredAsk(entry.body);
        if (answered !== undefined && answered === openClaim && event !== "waiting")
          openClaim = undefined;
      }
      if (event !== undefined)
        events.push(event);
    }
  }
  return {
    comments: kept,
    events,
    holder: openClaim !== undefined ? "agent" : "person",
    ...openClaim !== undefined ? { openClaim: { ask: openClaim, run: openClaimRun ?? 0 } } : {}
  };
}

// src/adapters/github/thread.ts
var readers = {
  ending: (body) => {
    const ended = ENDED_TAG.readProse(body)?.verb;
    if (ended === "handoff")
      return "handed-off";
    if (ended === "waiting")
      return "waiting";
    if (ended === "stopped" || ended === "limit" || ended === "done" || ended === "refused")
      return "returned";
    return "";
  },
  requestedAgent: (body) => parseCommentCommand(proseOnly(body)).agent,
  isDispatchMarker: (body) => DISPATCH_TAG.hasProse(body),
  claim: (body) => TOOK_TAG.readProse(body),
  answeredAsk: (body) => {
    const answers = ENDED_TAG.readProse(body)?.answers;
    return answers !== undefined && answers > 0 ? answers : undefined;
  },
  endingAgent: (body) => AGENT_TAG.readProse(body) ?? ""
};
var askReaders = {
  ...readers,
  requestedAgent: (body) => parseMangledCommand(proseOnly(body)).agent,
  authoringAgent: (body) => AGENT_TAG.readProse(body) ?? ""
};
var endingWalkReaders = {
  ending: readers.ending,
  quoted: isQuotation,
  claim: (body) => TOOK_TAG.readProse(body),
  ended: (body) => ENDED_TAG.readProse(body)
};
function isHumanComment(comment) {
  return isHumanActor(comment.user?.type);
}
function entryOf(comment) {
  const isHuman = isHumanComment(comment);
  const body = comment.body ?? "";
  return {
    body,
    isHuman,
    quoted: !isHuman && QUOTES_TAG.has(body),
    at: comment.created_at
  };
}
function listComments(repo, number) {
  const listed = ghRead("api", `repos/${repo}/issues/${number}/comments`, "--paginate");
  if (listed.code !== 0)
    throw new Error(`could not read comments on #${number}: ${listed.stderr || listed.stdout}`);
  const pages = splitConcatenatedJson(listed.stdout);
  const flat = [];
  for (const page of pages) {
    if (Array.isArray(page))
      flat.push(...page);
  }
  return flat;
}
function checkDispatchMarker(repo, number, markerId) {
  const comments = listComments(repo, number);
  const marker = String(markerId);
  const markerVisible = comments.some((comment) => String(comment.id) === marker);
  const entries = comments.filter((comment) => String(comment.id) !== marker).map(entryOf);
  return { markerVisible, outstanding: requestOutstanding(shapedThread(entries, readers).events) };
}
function readAskState(repo, number, probeId) {
  const comments = listComments(repo, number);
  const probe = probeId === undefined ? undefined : String(probeId);
  const entries = comments.map((comment) => ({
    id: comment.id,
    ...entryOf(comment)
  }));
  return {
    probeVisible: probe === undefined ? undefined : comments.some((comment) => String(comment.id) === probe),
    comments: shapedThread(entries, readers).comments
  };
}
function isAskSuperseded(repo, number, args) {
  const read = readAskState(repo, number, args.probeId);
  return {
    superseded: askSuperseded(read.comments, readers, args.askId, args.agent, args.verdictPassed),
    probeVisible: read.probeVisible
  };
}

// src/domain/work/closed-target.ts
function mayStartWorkOn(target) {
  return target.known && target.state === "open";
}
function canBeReopened(target) {
  return target.known && !(target.kind === "pull-request" && target.state === "done");
}
function recoveryAdvice(state, number, command) {
  if (state.known && !canBeReopened(state)) {
    return `#${number} is merged, and GitHub cannot reopen a merged pull request. ` + `Open an issue for the follow-up instead.`;
  }
  return `Reopen #${number} and comment \`${command}\` to run it.`;
}
function mentionList(logins) {
  return logins.length > 0 ? `${logins.map((l) => `@${l}`).join(" ")} ` : "";
}
function dispatchRefusedNotice(refused) {
  const { agent, number, context, state, notify } = refused;
  const why = !state.known ? `the state of #${number} could not be read (${state.why})` : `#${number} is closed`;
  return [
    `${mentionList(notify ? [notify] : [])}Atomaton: \`${agent}\` was not started on #${number}, because ${why}.`,
    "",
    `What was about to happen: ${context}.`,
    "",
    "Nothing will retry this.",
    "",
    !state.known ? `Start it by hand once #${number} can be read: comment \`/${agent}\` on it.` : recoveryAdvice(state, number, `/${agent}`)
  ].join(`
`);
}
function dispatchFailedNotice(failed) {
  const { agent, number, context, notify } = failed;
  return [
    `${mentionList(notify ? [notify] : [])}Atomaton: \`${agent}\` was not started on #${number}, because GitHub rejected the dispatch call.`,
    "",
    `What was about to happen: ${context}.`,
    "",
    "Nothing will retry this. Start it by hand: comment `/" + agent + "` on this issue."
  ].join(`
`);
}
function dispatchUnconfirmedNotice(unconfirmed) {
  const { agent, number, context, notify } = unconfirmed;
  return [
    `${mentionList(notify ? [notify] : [])}Atomaton: \`${agent}\` was not started on #${number}, because the dispatch could not be confirmed.`,
    "",
    `What was about to happen: ${context}.`,
    "",
    "GitHub did not show the machinery its own marker in the thread, so it could not tell whether another run had already been asked for. Starting one anyway could put two runs on this issue at once.",
    "",
    "This is usually transient. Retry shortly by commenting `/`" + agent + "` on this issue."
  ].join(`
`);
}

// src/adapters/actions/dispatch.ts
function runnerWorkflow() {
  return process.env.ATOMATON_DISPATCH_WORKFLOW || "atomaton-runner.yml";
}
function refusalEndingLines(d) {
  if (d.refusalEnding === undefined)
    return [];
  return [
    LLM_CONTEXT_TAG.write("exclude"),
    ENDED_TAG.write({ verb: "refused", answers: d.refusalEnding.answers, run: d.refusalEnding.run })
  ];
}
function refuseClosedTarget(d, state) {
  const log = d.log ?? ((message) => console.error(message));
  const body = [
    ...refusalEndingLines(d),
    dispatchRefusedNotice({
      agent: d.agent,
      number: Number(d.number),
      context: d.context,
      state,
      notify: d.notify ?? ""
    })
  ].join(`
`);
  const { code, stdout, stderr } = gh("issue", "comment", String(d.number), ...d.repo ? ["--repo", d.repo] : [], "--body", body);
  if (code !== 0) {
    log(`${d.context}: refused to dispatch onto #${d.number} (not open), and could not post the notice: ${stderr || stdout}`);
  } else {
    log(`${d.context}: refused to dispatch onto #${d.number} (not open); notice posted`);
  }
  return "refused-closed";
}
function postDispatchMarker(d) {
  const log = d.log ?? ((message) => console.error(message));
  const body = `${LLM_CONTEXT_TAG.write("exclude")}
${DISPATCH_TAG.write(d.agent)}
` + `Atomaton: \`${d.agent}\` starting on this ${d.type === "pr" ? "pull request" : "issue"}.`;
  const { code, stdout, stderr } = gh("api", `repos/${d.repo ?? "{owner}/{repo}"}/issues/${d.number}/comments`, "--method", "POST", "-f", `body=${body}`, "--jq", ".id");
  if (code !== 0) {
    log(`${d.context}: could not post the dispatch marker on #${d.number}: ${stderr || stdout}`);
    return;
  }
  return stdout.trim();
}
function refuseOutstandingRequest(d, markerId) {
  const log = d.log ?? ((message) => console.error(message));
  const repoPath = d.repo ?? "{owner}/{repo}";
  const removeMarker = () => {
    if (markerId === undefined)
      return;
    gh("api", "--method", "DELETE", `repos/${repoPath}/issues/comments/${markerId}`);
  };
  if (markerId === undefined)
    return;
  const delays = [1000, 2000, 4000];
  let check;
  for (let attempt = 0;attempt <= delays.length; attempt++) {
    try {
      check = checkDispatchMarker(repoPath, d.number, markerId);
    } catch (e) {
      removeMarker();
      log(`${d.context}: could not read the thread on #${d.number}, so ${d.agent} was not started: ${e}`);
      return "refused-outstanding";
    }
    if (check.markerVisible)
      break;
    const delay = delays[attempt];
    if (delay === undefined)
      break;
    log(`${d.context}: the dispatch marker on #${d.number} is not visible yet; waiting ${delay}ms and reading again`);
    Bun.sleepSync(delay);
  }
  if (check === undefined || !check.markerVisible) {
    const reposted = postDispatchMarker(d);
    if (reposted !== undefined) {
      try {
        if (checkDispatchMarker(repoPath, d.number, reposted).markerVisible) {
          removeMarker();
          return;
        }
      } catch (e) {
        log(`${d.context}: could not read the thread on #${d.number} after reposting the marker: ${e}`);
      }
      gh("api", "--method", "DELETE", `repos/${repoPath}/issues/comments/${reposted}`);
    }
    log(`${d.context}: the dispatch marker on #${d.number} never became visible, so the ordering check could not be trusted ` + `and ${d.agent} was not started`);
    removeMarker();
    const body = [
      ...refusalEndingLines(d),
      dispatchUnconfirmedNotice({
        agent: d.agent,
        number: Number(d.number),
        context: d.context,
        notify: d.notify ?? ""
      })
    ].join(`
`);
    const { code, stdout, stderr } = gh("issue", "comment", String(d.number), ...d.repo ? ["--repo", d.repo] : [], "--body", body);
    if (code !== 0) {
      log(`${d.context}: could not post the unconfirmed notice on #${d.number}: ${stderr || stdout}`);
    }
    return "unconfirmed";
  }
  if (!check.outstanding)
    return;
  removeMarker();
  log(`${d.context}: #${d.number} already has an agent asked for on it, so ${d.agent} was not started; ` + "the dispatch marker was removed");
  return "refused-outstanding";
}
function refuseSupersededAsk(d) {
  const log = d.log ?? ((message) => console.error(message));
  const repoPath = d.repo ?? "{owner}/{repo}";
  const askId = Number(d.ask);
  if (!Number.isInteger(askId) || askId <= 0) {
    log(`${d.context}: the dispatch answers a request on #${d.number} but names no ask comment, ` + `so ${d.agent} was not started`);
    return "superseded";
  }
  const delays = [1000, 2000, 4000];
  let read;
  for (let attempt = 0;attempt <= delays.length; attempt++) {
    try {
      read = isAskSuperseded(repoPath, d.number, {
        askId,
        agent: d.agent,
        verdictPassed: d.verdictPassed,
        probeId: d.freshnessProbeId
      });
    } catch (e) {
      log(`${d.context}: could not read the thread on #${d.number}, so ${d.agent} was not started: ${e}`);
      return "superseded";
    }
    if (d.freshnessProbeId === undefined || read.probeVisible)
      break;
    const delay = delays[attempt];
    if (delay === undefined)
      break;
    log(`${d.context}: the comment this dispatch answers on #${d.number} is not visible yet; ` + `waiting ${delay}ms and reading again`);
    Bun.sleepSync(delay);
  }
  if (read === undefined || d.freshnessProbeId !== undefined && !read.probeVisible) {
    log(`${d.context}: whether #${d.number} still waits for ${d.agent} could not be established ` + "(the thread would not confirm it had caught up), so nothing was started");
    return "superseded";
  }
  const why = read.superseded;
  if (why === undefined)
    return;
  log(`${d.context}: the ask this dispatch answers on #${d.number} is no longer waiting ` + `(${why}), so ${d.agent} was not started`);
  return "superseded";
}
function dispatchRunner(d) {
  if (!d.agent.trim()) {
    const log = d.log ?? ((message) => console.error(message));
    log(`${d.context}: no agent was named, so nothing was dispatched (an empty agent is not a run).`);
    return "failed";
  }
  const state = readTargetState(d.number, d.repo);
  if (!mayStartWorkOn(state))
    return refuseClosedTarget(d, state);
  let ask;
  let markerId;
  if (d.answersRequest) {
    const refusal = refuseSupersededAsk(d);
    if (refusal !== undefined)
      return refusal;
    ask = d.ask;
  } else {
    markerId = postDispatchMarker(d);
    const refusal = refuseOutstandingRequest(d, markerId);
    if (refusal !== undefined)
      return refusal;
    ask = d.ask ?? markerId;
  }
  const args = [
    ...d.repo ? ["--repo", d.repo] : [],
    "--field",
    `agent=${d.agent}`,
    "--field",
    `number=${d.number}`,
    "--field",
    `type=${d.type}`,
    "--field",
    `notify=${d.notify ?? ""}`,
    "--field",
    `ask=${ask ?? ""}`,
    "--field",
    `reload_count=${d.reloadCount ?? 0}`,
    "--field",
    `dispatched_by=${d.dispatchedBy ?? ""}`
  ];
  if (!dispatchWorkflow(d.context, runnerWorkflow(), args, d.log)) {
    if (d.refusalEnding !== undefined) {
      if (markerId !== undefined) {
        gh("api", "--method", "DELETE", `repos/${d.repo ?? "{owner}/{repo}"}/issues/comments/${markerId}`);
      }
      const body = [
        ...refusalEndingLines(d),
        dispatchFailedNotice({
          agent: d.agent,
          number: Number(d.number),
          context: d.context,
          notify: d.notify ?? ""
        })
      ].join(`
`);
      gh("issue", "comment", String(d.number), ...d.repo ? ["--repo", d.repo] : [], "--body", body);
    }
    return "failed";
  }
  const here = nodeNumber();
  const elsewhere = d.continuesChain !== true && here !== undefined && String(d.number) !== String(here);
  logDispatch(d.type, d.agent, { number: Number(d.number), ...elsewhere ? { elsewhere: true } : {} });
  return "dispatched";
}

// src/entrypoints/machinery/lib/flags.ts
function isTrue(value) {
  return value === "true";
}

// src/entrypoints/machinery/lib/script-ref.ts
import { basename } from "path";
import { fileURLToPath } from "url";
function defineScript(importMetaUrl) {
  return { runtimePath: `${SCRIPTS_DIR}/${basename(fileURLToPath(importMetaUrl))}` };
}

// src/entrypoints/machinery/dispatch_agent.ts
var ref = defineScript(import.meta.url);
function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      agent: { type: "string" },
      number: { type: "string" },
      type: { type: "string" },
      notify: { type: "string" },
      repo: { type: "string" },
      ask: { type: "string" },
      "run-id": { type: "string" },
      "answers-request": { type: "string" },
      "verdict-passed": { type: "string" },
      context: { type: "string" }
    }
  });
  const agent = (values.agent ?? "").trim();
  const number = Number((values.number ?? "").trim());
  const type = (values.type ?? "").trim();
  const context = (values.context ?? "").trim();
  if (!isAgentName(agent)) {
    console.error(`::error::dispatch_agent: '${agent}' is not an agent name, so nothing was dispatched.`);
    process.exit(1);
  }
  if (!isNodeType(type)) {
    console.error(`::error::dispatch_agent: --type must be 'issue' or 'pr', not '${type}'.`);
    process.exit(1);
  }
  if (!Number.isInteger(number) || number <= 0) {
    console.error(`::error::dispatch_agent: --number must be a positive number, not '${values.number ?? ""}'.`);
    process.exit(1);
  }
  if (!context) {
    console.error("::error::dispatch_agent: --context is required; it is what a person reads if this is refused.");
    process.exit(1);
  }
  const runId = Number(values["run-id"]);
  const askId = Number(values.ask);
  const refusalEnding = Number.isInteger(runId) && runId > 0 && Number.isInteger(askId) && askId > 0 ? { answers: askId, run: runId } : undefined;
  const outcome = dispatchRunner({
    context,
    agent,
    type,
    number,
    notify: values.notify ?? "",
    repo: (values.repo ?? "").trim() || undefined,
    ask: (values.ask ?? "").trim() || undefined,
    answersRequest: isTrue(values["answers-request"]),
    verdictPassed: values["verdict-passed"] === undefined ? undefined : isTrue(values["verdict-passed"]),
    refusalEnding
  });
  if (refusalEnding !== undefined && (outcome === "refused-closed" || outcome === "unconfirmed" || outcome === "failed")) {
    const label = getLabel("in_progress");
    const { code } = gh("issue", "edit", String(number), "--remove-label", label, ...values.repo ? ["--repo", values.repo] : []);
    if (code !== 0) {
      console.error(`::warning::could not remove '${label}' from #${number}: the thread is settled, ` + "but the label will say an agent holds the ball until it is removed by hand");
    }
  }
  if (outcome === "failed") {
    console.error(`::error::Could not dispatch ${agent} on ${type} #${number}.`);
    process.exit(1);
  }
  if (outcome === "unconfirmed") {
    console.error(`::error::Could not confirm the dispatch marker on ${type} #${number}, so ${agent} was not started; ` + "the thread may not have caught up with the marker. Retry shortly.");
    process.exit(1);
  }
}
if (import.meta.main)
  main();
export {
  ref
};
