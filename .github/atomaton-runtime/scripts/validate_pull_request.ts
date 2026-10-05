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
function handTo(agent) {
  const named = agent.trim();
  return named === "" ? {} : { next: { agent: named } };
}
function decideValidationOutcome(input) {
  const { conclusion, reviewerAgent, engineerAgent, askedByPerson = false, priorRetries = 0 } = input;
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
function latestRequestedAgent(body, comments, readers) {
  const { comments: kept } = shapedThread(comments, readers);
  for (let index = kept.length - 1;index >= 0; index -= 1) {
    const agent = readers.requestedAgent(kept[index].body);
    if (agent !== "")
      return agent;
  }
  return readers.requestedAgent(body);
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
function latestRequestedAgentOn(repo, number, isKnownAgent, excludeCommentId) {
  const { body, shaped } = readThread(repo, number, excludeCommentId);
  const known = {
    ...readers,
    requestedAgent: (text) => {
      const name = readers.requestedAgent(text);
      return isKnownAgent(name) ? name : "";
    }
  };
  return latestRequestedAgent(body, shaped.comments, known);
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
var DELEGATES_DIR = `${TOOLS_DIR}/delegates`;
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
  const { code, stdout } = gh("api", `repos/${repo}/issues/${number}/comments`, "--paginate", "--jq", ".[].body");
  if (code)
    return 0;
  try {
    const bodies = JSON.parse(stdout || "[]");
    return bodies.filter((body) => CI_RETRY_TAG.has(body ?? "")).length;
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
function runCiAndWait(repo, workflow, branch, headSha, timeoutSeconds) {
  const listRuns = () => {
    const listed = gh("api", `repos/${repo}/actions/runs?event=workflow_dispatch&head_sha=${headSha}`).stdout;
    const { workflow_runs = [] } = JSON.parse(listed || "{}");
    return workflow_runs;
  };
  const existing = findExistingCiRun(listRuns(), workflow, headSha);
  const reusable = existing?.status === "completed" && existing.conclusion && existing.conclusion !== "cancelled";
  if (reusable) {
    log(`reusing CI run ${existing.id} for ${headSha.slice(0, 7)}: ${existing.conclusion}`);
    return { conclusion: existing.conclusion, runUrl: `https://github.com/${repo}/actions/runs/${existing.id}` };
  }
  const alreadyRunning = existing !== undefined && existing.status !== "completed";
  const since = new Date().toISOString();
  if (alreadyRunning) {
    log(`CI run ${existing.id} is already ${existing.status} for ${headSha.slice(0, 7)}; waiting for it`);
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
    if (run.status !== "completed")
      continue;
    const conclusion = run.conclusion ?? "";
    log(`CI run ${run.id} concluded ${conclusion}`);
    return { conclusion, runUrl: `https://github.com/${repo}/actions/runs/${run.id}` };
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
  const { conclusion, runUrl } = deliverableProblems.length > 0 ? { conclusion: "", runUrl: "" } : runCiAndWait(repo, workflow, branch, headSha, Number(values["timeout-seconds"] ?? "1800"));
  const priorRetries = countPriorRetries(repo, values.number ?? "");
  const prBody = gh("api", `repos/${repo}/pulls/${values.number}`, "--jq", ".body").stdout ?? "";
  const reviewerAgent = latestRequestedAgentOn(repo, values.number ?? "", (name) => hasAgentDefinition(name, defDir));
  const engineerAgent = ORIGIN_AGENT_TAG.read(prBody) ?? "";
  const outcome = decideValidationOutcome({
    conclusion,
    reviewerAgent,
    engineerAgent,
    askedByPerson: isTrue(values["asked-by-person"]),
    priorRetries,
    deliverableProblems
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
  write(`summary=${outcome.summary}`);
}
if (import.meta.main)
  main();
export {
  findExistingCiRun,
  pickDispatchedRun,
  ref2 as ref
};
