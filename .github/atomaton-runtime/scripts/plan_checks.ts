#!/usr/bin/env bun
// @bun

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
var SECRET_SLOTS = 10;
var SECRET_SLOT_PREFIX = "ATOMATON_SECRET_";
var NAME_PATTERN = /^[A-Z][A-Z0-9_]*$/;
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
  "ATOMATON_UNTRUSTED_USER",
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
var PR_TREE_VAR = "ATOMATON_PR_TREE";
var CHECK_JOB_RESERVED = new Set([...JOB_ENV, MACHINERY_ROOT_VAR, PR_TREE_VAR]);
var DEPLOY_JOB_RESERVED = new Set([...JOB_ENV, "ATOMATON_DEPLOY_TARGET"]);
function resolveDeclaredSecrets(raw, destination) {
  const { field, reserved } = destination;
  if (raw === undefined || raw === null)
    return { names: [], problems: [] };
  if (!Array.isArray(raw)) {
    return { names: [], problems: [`\`${field}\` must be an array of secret names.`] };
  }
  const problems = [];
  const names = [];
  const seen = new Set;
  for (const entry of raw) {
    if (typeof entry !== "string") {
      problems.push(`\`${field}\` entries must be strings; found ${JSON.stringify(entry)}.`);
      continue;
    }
    const name = entry.trim();
    if (!NAME_PATTERN.test(name)) {
      problems.push(`\`${field}\`: '${name}' is not a usable secret name. Expected uppercase letters, digits and underscores, starting with a letter \u2014 e.g. 'SLACK_TOKEN'.`);
      continue;
    }
    if (reserved.has(name)) {
      problems.push(`\`${field}\`: '${name}' is already part of the environment this workflow provides, so declaring it would replace that value rather than add a credential. Give the secret another name.`);
      continue;
    }
    if (name.startsWith(SECRET_SLOT_PREFIX)) {
      problems.push(`\`${field}\`: '${name}' collides with the slots this mechanism uses internally. Give the secret another name.`);
      continue;
    }
    if (seen.has(name)) {
      problems.push(`\`${field}\`: '${name}' is declared more than once.`);
      continue;
    }
    seen.add(name);
    names.push(name);
  }
  if (names.length > SECRET_SLOTS) {
    problems.push(`\`${field}\` declares ${names.length} secrets but a run carries at most ${SECRET_SLOTS}. Raising the cap needs a new release, since each slot is a line of generated workflow YAML.`);
  }
  return problems.length > 0 ? { names: [], problems } : { names, problems };
}

// src/domain/delivery/runner-label.ts
var DEFAULT_RUNNER = "ubuntu-latest";
function resolveRunsOn(configured) {
  if (configured === undefined || configured === null)
    return { labels: [DEFAULT_RUNNER], problems: [] };
  if (typeof configured === "string") {
    const label = configured.trim();
    if (!label)
      return { labels: [DEFAULT_RUNNER], problems: ["runs_on is empty; using " + DEFAULT_RUNNER] };
    return { labels: [label], problems: [] };
  }
  if (Array.isArray(configured)) {
    const labels = configured.filter((entry) => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean);
    const problems = [];
    if (labels.length !== configured.length) {
      problems.push("runs_on has entries that are not non-empty strings; those are ignored");
    }
    if (labels.length === 0) {
      return { labels: [DEFAULT_RUNNER], problems: [...problems, `runs_on names no usable label; using ${DEFAULT_RUNNER}`] };
    }
    return { labels, problems };
  }
  return { labels: [DEFAULT_RUNNER], problems: [`runs_on must be a string or a list of strings; using ${DEFAULT_RUNNER}`] };
}
function runsOnOutput(labels) {
  return JSON.stringify(labels);
}

// src/domain/delivery/declared-jobs.ts
var NAME_PATTERN2 = /^[a-z0-9]+(-[a-z0-9]+)*$/;
var SHARED_KEYS = ["name", "runs_on", "commands", "secrets"];
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function resolveDeclaredJobs(raw, rules) {
  if (raw === undefined || raw === null)
    return { jobs: [], problems: [] };
  if (!Array.isArray(raw))
    return { jobs: [], problems: [`\`${rules.where}\` must be an array.`] };
  const problems = [];
  const jobs = [];
  const seen = new Set;
  const allowed = new Set([...SHARED_KEYS, ...rules.extra?.keys ?? []]);
  raw.forEach((entry, index) => {
    const where = `\`${rules.where}[${index}]\``;
    if (!isRecord(entry)) {
      problems.push(`${where} must be an object.`);
      return;
    }
    const unknown = Object.keys(entry).filter((key) => !allowed.has(key));
    if (unknown.length > 0) {
      problems.push(`${where}: unknown key(s) ${unknown.map((k) => `\`${k}\``).join(", ")}.`);
      return;
    }
    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    if (!NAME_PATTERN2.test(name)) {
      problems.push(`${where}: \`name\` must be lowercase letters, digits and hyphens \u2014 e.g. 'cloud-names'.`);
      return;
    }
    if (seen.has(name)) {
      problems.push(`${where}: '${name}' is declared more than once.`);
      return;
    }
    const commandsRaw = entry.commands ?? [];
    if (!Array.isArray(commandsRaw) || commandsRaw.some((c) => typeof c !== "string" || c.trim() === "")) {
      problems.push(`${where}: \`commands\` must be an array of non-empty shell commands.`);
      return;
    }
    const commands = commandsRaw.map((c) => c.trim());
    if (commands.length === 0) {
      problems.push(`${where}: \`commands\` is empty, so this job would do nothing and report success.`);
      return;
    }
    const secrets = readSecrets(entry.secrets, rules.secrets, `${rules.where}[${index}]`, where, problems);
    if (secrets === null)
      return;
    const extra = rules.extra ? rules.extra.read(entry, where, problems) : {};
    if (extra === null)
      return;
    const runner = resolveRunsOn(entry.runs_on);
    for (const problem of runner.problems)
      problems.push(`${where}: ${problem}`);
    seen.add(name);
    jobs.push({ name, runsOn: runner.labels, commands, secrets, ...extra });
  });
  return { jobs, problems };
}
function readSecrets(raw, reserved, path, where, problems) {
  if (raw === undefined || raw === null)
    return [];
  const { names, problems: found } = resolveDeclaredSecrets(raw, {
    field: `${path}.secrets`,
    reserved
  });
  problems.push(...found);
  return found.length > 0 ? null : names;
}

// src/domain/delivery/check-jobs.ts
var CHECKS = { where: "checks.jobs", secrets: CHECK_JOB_RESERVED };
var LEGACY_CHECK_KEYS = ["from_pull_request", "from_default_branch"];
function resolveChecks(section) {
  const container = typeof section === "object" && section !== null ? section : {};
  const problems = [];
  const jobs = [];
  const declaredIn = new Map;
  const deprecated = [];
  for (const key of ["jobs", ...LEGACY_CHECK_KEYS]) {
    const raw = container[key];
    if (raw === undefined)
      continue;
    const rules = key === "jobs" ? CHECKS : { where: `checks.${key}`, secrets: CHECK_JOB_RESERVED };
    if (key !== "jobs")
      deprecated.push(rules.where);
    const resolved = resolveDeclaredJobs(raw, rules);
    problems.push(...resolved.problems);
    for (const job of resolved.jobs) {
      const already = declaredIn.get(job.name);
      const spansTheOldArms = key !== "jobs" && already !== undefined && already !== rules.where && already !== CHECKS.where;
      if (already !== undefined && !spansTheOldArms) {
        problems.push(`\`${rules.where}\`: '${job.name}' is already declared in \`${already}\`.`);
        continue;
      }
      if (already === undefined)
        declaredIn.set(job.name, rules.where);
      jobs.push(job);
    }
  }
  return { jobs, problems, deprecated };
}
function deprecatedCheckNotice(keys) {
  const named = keys.map((key) => `\`${key}\``).join(" and ");
  return `${named} ${keys.length === 1 ? "is" : "are"} read into \`checks.jobs\`, the one list of checks. ` + "An entry from either spelling now runs the same way: the list comes from the default branch, and " + "each entry may name its own `secrets`. Move the entries under `checks.jobs` when convenient.";
}
var saidDeprecated = false;
function announceDeprecatedChecks(keys, log = console.error) {
  if (saidDeprecated || keys.length === 0)
    return;
  saidDeprecated = true;
  log(`::warning::${deprecatedCheckNotice(keys)}`);
}
var NO_CHECKS = "This check verified nothing: `checks.jobs` in .github/atomaton/config.yaml is empty, " + "so a pull request satisfying it has not been tested. Add the commands that check this project, " + "or point `checks.your_workflow` at a workflow of your own.";

// src/domain/work/agent-name.ts
var AGENT_NAME_PATTERN = "[a-z][a-z0-9-]*";
var AGENT_NAME_RE = new RegExp(`^${AGENT_NAME_PATTERN}$`);

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
function getChecks() {
  const { deprecated, ...resolution } = resolveChecks(loadConfig().checks);
  announceDeprecatedChecks(deprecated);
  return resolution;
}

// src/entrypoints/machinery/lib/publish-matrix.ts
import { appendFileSync } from "fs";
function partsOf(entry) {
  return "job" in entry ? entry : { job: entry, ref: "" };
}
function publishMatrix(jobs, options) {
  const include = jobs.map(partsOf).map(({ job, ref }) => ({
    name: job.name,
    runs_on: runsOnOutput(job.runsOn),
    commands: job.commands,
    secrets: job.secrets,
    ref
  }));
  const output = process.env.GITHUB_OUTPUT;
  const line = `jobs=${JSON.stringify(include)}
`;
  if (output)
    appendFileSync(output, line);
  else
    process.stdout.write(line);
  if (include.length === 0) {
    console.error(options.warnWhenEmpty ? `::warning::${options.warnWhenEmpty}` : `No ${options.what}s to run.`);
    return;
  }
  console.error(`${include.length} ${options.what}(s): ${include.map((job) => job.name).join(", ")}`);
}

// src/entrypoints/machinery/lib/script-ref.ts
import { basename } from "path";
import { fileURLToPath } from "url";
function defineScript(importMetaUrl) {
  return { runtimePath: `${SCRIPTS_DIR}/${basename(fileURLToPath(importMetaUrl))}` };
}

// src/entrypoints/machinery/plan_checks.ts
var ref = defineScript(import.meta.url);
function main() {
  const { jobs, problems } = getChecks();
  if (problems.length > 0) {
    for (const problem of problems)
      console.error(`::error::${problem}`);
    console.error("::error::`checks` could not be read, so none of its entries ran.");
    process.exit(1);
  }
  publishMatrix(jobs, { what: "`checks` job", warnWhenEmpty: NO_CHECKS });
}
if (import.meta.main)
  main();
export {
  main,
  ref
};
