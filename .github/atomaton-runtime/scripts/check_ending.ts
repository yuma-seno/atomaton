#!/usr/bin/env bun
// @bun

// src/entrypoints/machinery/check_ending.ts
import { existsSync as existsSync3, readFileSync as readFileSync3, writeFileSync } from "fs";
import { parseArgs } from "util";

// src/domain/work/agent-name.ts
var AGENT_NAME_PATTERN = "[a-z][a-z0-9-]*";
var AGENT_NAME_RE = new RegExp(`^${AGENT_NAME_PATTERN}$`);

// src/domain/work/comment-command.ts
var COMMAND_RE = new RegExp(`^\\/(${AGENT_NAME_PATTERN})(?:\\s+(.*))?$`);
var DISPATCH_RE = new RegExp(`^<!--\\s*atomaton:dispatch\\s*=\\s*(${AGENT_NAME_PATTERN})\\s*-->`);
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

// src/domain/work/mention.ts
var LOGIN_PATTERN = "[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}";
var MENTION = new RegExp(`(^|[^\\w@/-])@(${LOGIN_PATTERN})\\b(?!\\/)`, "g");
var CODE = /```[\s\S]*?```|`[^`\n]*`/g;
function mentionsIn(text) {
  const found = [];
  const seen = new Set;
  for (const match of text.replace(CODE, " ").matchAll(new RegExp(MENTION.source, "g"))) {
    const login = match[2];
    const key = login.toLowerCase();
    if (seen.has(key))
      continue;
    seen.add(key);
    found.push(login);
  }
  return found;
}

// src/domain/work/ending-calls.ts
var DIRECTIVE = new RegExp(`^\\/(${AGENT_NAME_PATTERN})$`);
function endingCalls(output, callable) {
  const agents = [];
  for (const rawLine of output.split(`
`)) {
    for (const candidate of lineForms(rawLine)) {
      const match = DIRECTIVE.exec(candidate);
      if (!match)
        continue;
      const agent = match[1];
      if (!callable.knowsAgent(agent))
        continue;
      if (!agents.includes(agent))
        agents.push(agent);
    }
  }
  return { agents, humans: calledHumans(output, callable.humans) };
}
function calledHumans(text, humans) {
  const allowed = new Set([...humans].map((login) => login.trim().toLowerCase()).filter(Boolean));
  const called = [];
  for (const login of mentionsIn(text)) {
    if (!allowed.has(login.toLowerCase()))
      continue;
    if (called.some((seen) => seen.toLowerCase() === login.toLowerCase()))
      continue;
    called.push(login);
  }
  return called;
}
function callCount(calls) {
  return calls.agents.length + calls.humans.length;
}
function namedCalls(calls) {
  return [
    ...calls.agents.map((agent) => `\`/${agent}\``),
    ...calls.humans.map((login) => `\`@${login}\``)
  ].join(", ");
}
function endingCallProblem(calls) {
  const count = callCount(calls);
  if (count <= 1)
    return;
  return `it calls ${count} things: ${namedCalls(calls)}`;
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

// src/entrypoints/machinery/lib/callees.ts
import { existsSync as existsSync2, readFileSync as readFileSync2 } from "fs";
var NO_CALLEES = { humans: [], participants: [], notify: "" };
function readCalleesFile(path) {
  if (!path || !existsSync2(path))
    return NO_CALLEES;
  try {
    const parsed = JSON.parse(readFileSync2(path, "utf8"));
    const logins = (value) => Array.isArray(value) ? value.filter((login) => typeof login === "string" && login !== "") : [];
    return {
      humans: logins(parsed.humans),
      participants: logins(parsed.participants),
      notify: typeof parsed.notify === "string" ? parsed.notify : ""
    };
  } catch {
    return NO_CALLEES;
  }
}

// src/entrypoints/machinery/check_ending.ts
var ref2 = defineScript(import.meta.url);
function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      "output-file": { type: "string" },
      "def-dir": { type: "string" },
      "problem-file": { type: "string" },
      "people-file": { type: "string" }
    }
  });
  const outputFile = values["output-file"];
  const defDir = values["def-dir"];
  const problemFile = values["problem-file"];
  if (!outputFile || !defDir || !problemFile) {
    console.error("usage: check_ending.ts --output-file FILE --def-dir DIR --problem-file FILE --people-file FILE");
    process.exit(2);
  }
  const output = existsSync3(outputFile) ? readFileSync3(outputFile, "utf8") : "";
  const callees = readCalleesFile(values["people-file"]);
  const calls = endingCalls(output, {
    knowsAgent: (name) => hasAgentDefinition(name, defDir),
    humans: callees.humans
  });
  const problem = endingCallProblem(calls);
  writeFileSync(problemFile, problem ?? "", "utf8");
  const named = [...calls.agents.map((agent) => `/${agent}`), ...calls.humans.map((login) => `@${login}`)];
  console.error(named.length === 0 ? "closing message calls nobody" : `closing message calls ${named.join(", ")}${problem ? " -- more than one" : ""}`);
}
if (import.meta.main)
  main();
export {
  ref2 as ref
};
