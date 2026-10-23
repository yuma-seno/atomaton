#!/usr/bin/env bun
// @bun

// src/entrypoints/machinery/read_callees.ts
import { writeFileSync } from "fs";
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

// src/adapters/github/participants.ts
function participantAccounts(repo, number) {
  if (!repo || !String(number).trim())
    return [];
  const found = new Map;
  const collect = (args, read) => {
    const { code, stdout } = gh(...args);
    if (code !== 0)
      return;
    try {
      for (const person of read(JSON.parse(stdout))) {
        const { login, bot } = person;
        if (typeof login !== "string" || !login)
          continue;
        const seen = found.get(login);
        found.set(login, (seen ?? true) && bot === true);
      }
    } catch {}
  };
  collect(["api", `repos/${repo}/issues/${number}`], (json) => {
    const issue = json;
    return issue.user ? [{ login: issue.user.login, bot: issue.user.type === "Bot" }] : [];
  });
  collect(["api", `repos/${repo}/issues/${number}/comments`, "--paginate"], (json) => json.map((comment) => ({
    login: comment.user?.login,
    bot: comment.user?.type === "Bot"
  })));
  collect(["api", `repos/${repo}/collaborators`, "--paginate"], (json) => json.map((person) => ({
    login: person.login,
    bot: person.type === "Bot"
  })));
  return [...found].map(([login, bot]) => ({ login, bot }));
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

// src/entrypoints/machinery/read_callees.ts
var ref = defineScript(import.meta.url);
function withOwner(owner, accounts) {
  const seen = new Set;
  const logins = [];
  for (const candidate of [owner, ...accounts]) {
    const login = candidate.trim();
    const key = login.toLowerCase();
    if (!key || seen.has(key))
      continue;
    seen.add(key);
    logins.push(login);
  }
  return logins;
}
function callablePeople(accounts, notify) {
  const owner = notify.trim();
  return {
    humans: withOwner(owner, accounts.filter((account) => !account.bot).map((account) => account.login)),
    participants: withOwner(owner, accounts.map((account) => account.login)),
    notify: owner
  };
}
function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      out: { type: "string" },
      number: { type: "string" },
      notify: { type: "string" }
    }
  });
  const out = values.out;
  if (!out) {
    console.error("usage: read_callees.ts --out FILE [--number N] [--notify LOGIN]");
    process.exit(2);
  }
  const people = callablePeople(participantAccounts(process.env.GITHUB_REPOSITORY ?? "", values.number ?? ""), values.notify ?? "");
  writeFileSync(out, JSON.stringify(people, null, 2));
  console.error(people.humans.length === 0 ? "read_callees: nobody can be called by name" : `read_callees: ${people.humans.join(", ")}${people.notify ? ` (owner ${people.notify})` : ""}`);
}
if (import.meta.main)
  main();
export {
  callablePeople,
  ref
};
