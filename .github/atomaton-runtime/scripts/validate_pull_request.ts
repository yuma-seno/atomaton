#!/usr/bin/env bun
// @bun

// src/entrypoints/machinery/validate_pull_request.ts
import { appendFileSync as appendFileSync2, existsSync as existsSync2, readFileSync as readFileSync2 } from "fs";
import { parseArgs } from "util";

// src/domain/work/pr-validation.ts
var PASSING = new Set(["success", "skipped", "neutral"]);
var CI_RETRY_LIMIT = 3;
function contextsPassed(verdict) {
  return verdict === "passed";
}
function answeredByPush(latestAsk, headCommittedAt) {
  if (!latestAsk?.at || !headCommittedAt)
    return;
  const askAt = Date.parse(latestAsk.at);
  const commitAt = Date.parse(headCommittedAt);
  if (Number.isNaN(askAt) || Number.isNaN(commitAt))
    return;
  return commitAt > askAt ? latestAsk.author : undefined;
}
function handTo(agent) {
  const named = agent.trim();
  return named === "" ? {} : { next: { agent: named } };
}
function decideValidationOutcome(input) {
  const { conclusion, reviewerAgent, engineerAgent, askedByPerson = false, priorRetries = 0, headCommittedAt } = input;
  const deliverableProblems = input.deliverableProblems ?? [];
  if (deliverableProblems.length > 0) {
    const count = `${deliverableProblems.length} problem${deliverableProblems.length === 1 ? "" : "s"}`;
    if (priorRetries >= CI_RETRY_LIMIT) {
      return {
        verdict: "retries-exhausted",
        summary: `The deliverable is still not internally consistent (${count}) after ${priorRetries} attempts. ` + `Stopping rather than dispatching the engineer again; a human should look.`
      };
    }
    return {
      verdict: "deliverable-invalid",
      ...handTo(engineerAgent),
      summary: `.github/atomaton/ is not internally consistent (${count}), so CI was not run.`
    };
  }
  const normalised = conclusion.trim().toLowerCase();
  const passed = PASSING.has(normalised);
  if (passed) {
    const answered = answeredByPush(input.latestAsk, headCommittedAt);
    if (answered) {
      if (answered.kind === "agent") {
        return {
          verdict: "passed",
          ...handTo(answered.agent),
          summary: `CI concluded ${normalised}. The push answered the request ${answered.agent} made, so it is ${answered.agent}'s to judge.`
        };
      }
      return {
        verdict: "passed",
        summary: `CI concluded ${normalised}. The push answered the request a person made, so nobody is dispatched.`
      };
    }
    return { verdict: "passed", ...handTo(reviewerAgent), summary: `CI concluded ${normalised}.` };
  }
  if (!normalised) {
    return {
      verdict: "no-conclusion",
      summary: "CI never reported a conclusion. Nothing was dispatched; a human should look."
    };
  }
  if (priorRetries >= CI_RETRY_LIMIT) {
    return {
      verdict: "retries-exhausted",
      summary: `CI concluded ${normalised} after ${priorRetries} attempts at fixing it. ` + `Stopping rather than dispatching the engineer again; a human should look.`
    };
  }
  if (askedByPerson) {
    return {
      verdict: "failed",
      summary: `CI concluded ${normalised}. This run was asked for by a person, so nobody was dispatched.`
    };
  }
  return {
    verdict: "failed",
    ...handTo(engineerAgent),
    summary: `CI concluded ${normalised}. Returning to the engineer with the failing job.`
  };
}

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
function dispatchWorkflow(context, workflow, args = [], log = (m) => console.error(m)) {
  const { code, stdout, stderr } = gh("workflow", "run", workflow, ...args);
  if (code) {
    log(`${context}: WARN failed to dispatch ${workflow}: ${stderr || stdout}`);
    return false;
  }
  log(`${context}: dispatched ${workflow}`);
  return true;
}

// src/adapters/github/branch-rules.ts
var FEATURE_UNAVAILABLE = /upgrade to github|make this repository public/i;
function readBranchRules(repo, baseRef) {
  if (!baseRef)
    return { known: false, why: "no base branch was given" };
  const { code, stdout, stderr } = gh("api", `repos/${repo}/rules/branches/${baseRef}`);
  if (code) {
    if (FEATURE_UNAVAILABLE.test(`${stderr} ${stdout}`)) {
      return {
        known: true,
        enforceable: false,
        contexts: [],
        pullRequestRequired: false,
        why: "branch rules are not available on this repository (they are a paid feature on a " + "private one), so GitHub cannot require a status check or refuse a merge here"
      };
    }
    return { known: false, why: `the branch rules for ${baseRef} could not be read` };
  }
  try {
    const rules = JSON.parse(stdout || "[]");
    return {
      known: true,
      enforceable: true,
      contexts: rules.filter((rule) => rule.type === "required_status_checks").flatMap((rule) => rule.parameters?.required_status_checks ?? []).map((check) => check.context),
      pullRequestRequired: rules.some((rule) => rule.type === "pull_request")
    };
  } catch {
    return { known: false, why: `the branch rules for ${baseRef} were not valid JSON` };
  }
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
function shapedThread(comments, readers) {
  const kept = [];
  const events = [];
  let openClaim;
  for (const entry of comments) {
    if (entry.isHuman && openClaim !== undefined)
      continue;
    kept.push(entry);
    if (!entry.quoted) {
      const claim = readers.claim(entry.body);
      if (claim !== undefined) {
        openClaim = claim.ask;
      } else if (openClaim !== undefined) {
        const answered = readers.answeredAsk(entry.body);
        if (answered !== undefined && answered === openClaim)
          openClaim = undefined;
      }
    }
    const event = eventOf(entry, readers);
    if (event !== undefined)
      events.push(event);
  }
  return { comments: kept, events, holder: openClaim !== undefined ? "agent" : "person" };
}
function latestRequestedAgent(body, comments, readers) {
  const { comments: kept } = shapedThread(comments, readers);
  for (let index = kept.length - 1;index >= 0; index -= 1) {
    const entry = kept[index];
    if (entry.quoted)
      continue;
    const agent = readers.requestedAgent(entry.body);
    if (agent !== "")
      return agent;
  }
  return readers.requestedAgent(body);
}
function latestAsk(body, comments, readers) {
  const { comments: kept } = shapedThread(comments, readers);
  for (let index = kept.length - 1;index >= 0; index -= 1) {
    const entry = kept[index];
    if (entry.quoted)
      continue;
    const agent = readers.requestedAgent(entry.body);
    if (agent === "")
      continue;
    if (readers.isDispatchMarker(entry.body))
      continue;
    if (entry.isHuman)
      return { agent, author: { kind: "person" }, at: entry.at ?? "" };
    const author = readers.authoringAgent(entry.body);
    if (author === "")
      return;
    return { agent, author: { kind: "agent", agent: author }, at: entry.at ?? "" };
  }
  return;
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
function readComments(repo, number, excludeCommentId) {
  const excluded = String(excludeCommentId ?? "").trim();
  const comments = listComments(repo, number).filter((comment) => String(comment.id) !== excluded).map(entryOf);
  return shapedThread(comments, readers);
}
function readThread(repo, number, excludeCommentId) {
  const issue = ghRead("api", `repos/${repo}/issues/${number}`, "--jq", ".body");
  if (issue.code !== 0)
    throw new Error(`could not read #${number}: ${issue.stderr || issue.stdout}`);
  return { body: issue.stdout ?? "", shaped: readComments(repo, number, excludeCommentId) };
}
function latestRequestOn(repo, number, isKnownAgent) {
  const { body, shaped } = readThread(repo, number);
  const known = (name) => isKnownAgent(name) ? name : "";
  return {
    newestRequestedAgent: latestRequestedAgent(body, shaped.comments, {
      ...readers,
      requestedAgent: (text) => known(readers.requestedAgent(text))
    }),
    latestAsk: latestAsk(body, shaped.comments, {
      ...askReaders,
      requestedAgent: (text) => known(askReaders.requestedAgent(text))
    })
  };
}

// src/entrypoints/machinery/extract_directive.ts
import { existsSync, readFileSync, appendFileSync } from "fs";
import { join } from "path";

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

// src/entrypoints/machinery/extract_directive.ts
var ref = defineScript(import.meta.url);
var COMMAND_RE2 = new RegExp(`^\\/(${AGENT_NAME_PATTERN})$`);
function hasAgentDefinition(name, defDir) {
  return name !== "" && existsSync(join(defDir, `${name}.md`));
}
if (false)
  ;

// src/entrypoints/machinery/lib/flags.ts
function isTrue(value) {
  return value === "true";
}

// src/entrypoints/machinery/validate_pull_request.ts
var ref2 = defineScript(import.meta.url);
function log(message) {
  console.error(`[atomaton-validate-pr] ${message}`);
}
function pickDispatchedRun(runs, headSha, since) {
  const candidates = runs.filter((run) => run.event === "workflow_dispatch").filter((run) => run.head_sha === headSha).filter((run) => run.created_at >= since).sort((a, b) => a.created_at < b.created_at ? 1 : -1);
  const run = candidates[0];
  return run ? { id: run.id, status: run.status, conclusion: run.conclusion } : undefined;
}
function findExistingCiRun(runs, workflow, headSha) {
  const candidates = runs.filter((run) => run.event === "workflow_dispatch").filter((run) => run.head_sha === headSha).filter((run) => run.path.endsWith(`/${workflow}`)).sort((a, b) => a.created_at < b.created_at ? 1 : -1);
  const run = candidates[0];
  return run ? { id: run.id, status: run.status, conclusion: run.conclusion } : undefined;
}
function countPriorRetries(repo, number) {
  try {
    const bodies = ghPaginated("api", `repos/${repo}/issues/${number}/comments`, "--jq", "[.[].body]");
    return bodies.filter((body) => !isQuotation(body ?? "") && CI_RETRY_TAG.hasProse(body ?? "")).length;
  } catch {
    return 0;
  }
}
function reportFailure(repo, number, attempt, runUrl, summary, details = []) {
  const body = [
    LLM_CONTEXT_TAG.write("include"),
    CI_RETRY_TAG.write(attempt),
    `Atomaton: ${summary}`,
    ...details.length > 0 ? ["", ...details.map((detail) => `- ${detail}`)] : [],
    "",
    runUrl ? `Failing run: ${runUrl}` : ""
  ].filter(Boolean).join(`
`);
  const posted = gh("issue", "comment", number, "--repo", repo, "--body", body);
  if (posted.code)
    log(`WARN could not post the failure comment: ${posted.stderr}`);
}
function notifyCiWaiting(repo, number, askedByPerson, runUrl) {
  if (!askedByPerson)
    return;
  const body = [
    LLM_CONTEXT_TAG.write("exclude"),
    `Atomaton: CI is running on this pull request (${runUrl}). Its result decides who works next.`
  ].join(`
`);
  const posted = gh("issue", "comment", number, "--repo", repo, "--body", body);
  if (posted.code)
    log(`WARN could not post the CI-waiting comment: ${posted.stderr}`);
}
function runCiAndWait(repo, number, workflow, branch, headSha, timeoutSeconds, askedByPerson) {
  const runUrlFor = (id) => `https://github.com/${repo}/actions/runs/${id}`;
  const listRuns = () => {
    const listed = gh("api", `repos/${repo}/actions/runs?event=workflow_dispatch&head_sha=${headSha}`).stdout;
    const { workflow_runs = [] } = JSON.parse(listed || "{}");
    return workflow_runs;
  };
  const existing = findExistingCiRun(listRuns(), workflow, headSha);
  const reusable = existing?.status === "completed" && existing.conclusion && existing.conclusion !== "cancelled";
  if (reusable) {
    log(`reusing CI run ${existing.id} for ${headSha.slice(0, 7)}: ${existing.conclusion}`);
    return { conclusion: existing.conclusion, runUrl: runUrlFor(existing.id) };
  }
  const alreadyRunning = existing !== undefined && existing.status !== "completed";
  const since = new Date().toISOString();
  let notified = alreadyRunning;
  if (alreadyRunning) {
    log(`CI run ${existing.id} is already ${existing.status} for ${headSha.slice(0, 7)}; waiting for it`);
    notifyCiWaiting(repo, number, askedByPerson, runUrlFor(existing.id));
  } else {
    if (!dispatchWorkflow(`validate_pull_request: CI for ${branch}`, workflow, ["--repo", repo, "--ref", branch], log)) {
      process.exit(1);
    }
  }
  const deadline = Date.now() + timeoutSeconds * 1000;
  while (Date.now() < deadline) {
    Bun.sleepSync(1e4);
    const run = alreadyRunning ? listRuns().find((candidate) => candidate.id === existing.id) : pickDispatchedRun(listRuns(), headSha, since);
    if (!run)
      continue;
    if (!notified && run.status !== "completed") {
      notifyCiWaiting(repo, number, askedByPerson, runUrlFor(run.id));
      notified = true;
    }
    if (run.status !== "completed")
      continue;
    const conclusion = run.conclusion ?? "";
    log(`CI run ${run.id} concluded ${conclusion}`);
    return { conclusion, runUrl: runUrlFor(run.id) };
  }
  log(`no conclusion within ${timeoutSeconds}s`);
  return { conclusion: "", runUrl: "" };
}
function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      repo: { type: "string" },
      number: { type: "string" },
      branch: { type: "string" },
      workflow: { type: "string" },
      "def-dir": { type: "string" },
      "deliverable-report": { type: "string" },
      "asked-by-person": { type: "string" },
      "timeout-seconds": { type: "string" }
    }
  });
  const repo = values.repo ?? "";
  const branch = values.branch ?? "";
  const workflow = values.workflow ?? "";
  const defDir = values["def-dir"] ?? "";
  if (!repo || !branch || !workflow || !defDir) {
    console.error("usage: validate_pull_request.ts --repo owner/name --number N --branch B --workflow W --def-dir DIR");
    process.exit(1);
  }
  const reportPath = values["deliverable-report"] ?? "";
  if (!reportPath) {
    console.error("usage: validate_pull_request.ts ... --deliverable-report FILE");
    process.exit(1);
  }
  if (!existsSync2(reportPath)) {
    log(`cannot validate: no deliverable report at ${reportPath}`);
    process.exit(1);
  }
  const deliverableProblems = readFileSync2(reportPath, "utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (deliverableProblems.length > 0) {
    log(`the deliverable is inconsistent (${deliverableProblems.length} problem(s)); CI will not be dispatched`);
  }
  const githubOutput = process.env.GITHUB_OUTPUT;
  const write = (line) => {
    if (githubOutput)
      appendFileSync2(githubOutput, `${line}
`);
  };
  const prJson = gh("api", `repos/${repo}/pulls/${values.number}`).stdout;
  const pr = JSON.parse(prJson || "{}");
  const headSha = pr.head?.sha ?? "";
  const baseRef = pr.base?.ref ?? "";
  if (!headSha) {
    log("could not read the pull request's head SHA");
    process.exit(1);
  }
  const required = readBranchRules(repo, baseRef);
  if (!required.known) {
    log(`cannot validate: ${required.why}`);
    process.exit(1);
  }
  const requiredContexts = required.contexts;
  log(`required contexts on ${baseRef}: ${requiredContexts.join(", ") || "(none)"}`);
  if (!required.enforceable) {
    log(`::notice::${required.why}. Atomaton enforces the CI result itself when merging.`);
  } else if (requiredContexts.length === 0) {
    log(`::warning::${baseRef} requires no status checks, so CI results gate nothing here. ` + "Import .github/atomaton/rulesets/main.json if that was not intended.");
  }
  const { conclusion, runUrl } = deliverableProblems.length > 0 ? { conclusion: "", runUrl: "" } : runCiAndWait(repo, values.number ?? "", workflow, branch, headSha, Number(values["timeout-seconds"] ?? "1800"), isTrue(values["asked-by-person"]));
  const priorRetries = countPriorRetries(repo, values.number ?? "");
  const threadRequest = latestRequestOn(repo, values.number ?? "", (name) => hasAgentDefinition(name, defDir));
  const headCommittedAt = gh("api", `repos/${repo}/commits/${headSha}`, "--jq", ".commit.committer.date").stdout ?? "";
  const prBody = gh("api", `repos/${repo}/pulls/${values.number}`, "--jq", ".body").stdout ?? "";
  const engineerAgent = ORIGIN_AGENT_TAG.readProse(prBody) ?? "";
  const outcome = decideValidationOutcome({
    conclusion,
    reviewerAgent: threadRequest.newestRequestedAgent,
    engineerAgent,
    askedByPerson: isTrue(values["asked-by-person"]),
    priorRetries,
    deliverableProblems,
    latestAsk: threadRequest.latestAsk,
    headCommittedAt
  });
  const conclusionForContexts = contextsPassed(outcome.verdict) ? "success" : "failure";
  for (const check of requiredContexts.map((name) => ({ name, conclusion: conclusionForContexts }))) {
    const created = gh("api", "--method", "POST", `repos/${repo}/check-runs`, "-f", `name=${check.name}`, "-f", `head_sha=${headSha}`, "-f", "status=completed", "-f", `conclusion=${check.conclusion}`);
    if (created.code)
      log(`WARN could not write check "${check.name}": ${created.stderr}`);
    else
      log(`wrote check "${check.name}" as ${check.conclusion}`);
  }
  if (outcome.verdict !== "passed") {
    reportFailure(repo, values.number ?? "", priorRetries + 1, runUrl, outcome.summary, deliverableProblems);
  }
  write(`next_agent=${outcome.next?.agent ?? ""}`);
  write(`conclusion=${conclusion}`);
  write(`verdict_passed=${contextsPassed(outcome.verdict)}`);
  write(`summary=${outcome.summary}`);
}
if (import.meta.main)
  main();
export {
  countPriorRetries,
  findExistingCiRun,
  pickDispatchedRun,
  ref2 as ref
};
