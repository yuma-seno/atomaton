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
var QUOTES_TAG = numericTag("quotes");
function isQuotation(body) {
  return QUOTES_TAG.has(body);
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
function commandsIn(body) {
  const found = [];
  if (!body)
    return found;
  for (const rawLine of body.split(`
`)) {
    const parsed = parseCommandLine(rawLine);
    if (parsed !== undefined)
      found.push({ line: rawLine.trim(), command: parsed });
  }
  return found;
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
    const event = eventOf(entry, readers);
    if (event !== undefined)
      events.push(event);
  }
  return { comments: kept, events };
}

// src/adapters/github/thread.ts
var readers = {
  ending: (body) => {
    const ended = ENDED_TAG.read(body);
    if (ended === "handoff")
      return "handed-off";
    if (ended === "waiting")
      return "waiting";
    if (ended === "stopped" || ended === "limit" || ended === "done")
      return "returned";
    return "";
  },
  requestedAgent: (body) => parseCommentCommand(body).agent,
  isDispatchMarker: (body) => DISPATCH_TAG.has(body)
};
var askReaders = {
  ...readers,
  requestedAgent: (body) => parseMangledCommand(body).agent,
  authoringAgent: (body) => AGENT_TAG.read(body) ?? ""
};
var endingWalkReaders = { ending: readers.ending, quoted: isQuotation };
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
function keptCommentIds(comments) {
  const entries = comments.map((comment) => ({ id: comment.id, ...entryOf(comment) }));
  return new Set(shapedThread(entries, readers).comments.map((entry) => entry.id));
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
function commentWouldBeRemoved(repo, number, commentId) {
  const comments = listComments(repo, number);
  const listed = comments.find((comment) => String(comment.id) === String(commentId));
  if (listed === undefined) {
    const entries = comments.map(entryOf);
    return whoseTurn(shapedThread(entries, readers).events) === "agent";
  }
  return !keptCommentIds(comments).has(listed.id);
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

// src/entrypoints/machinery/guard_comment_during_run.ts
var ref = defineScript(import.meta.url);
var MAX_PRESERVED_CHARS = 30000;
function fenceFor(text) {
  let longest = 0;
  for (const run of text.match(/`+/g) ?? [])
    longest = Math.max(longest, run.length);
  return "`".repeat(Math.max(3, longest + 1));
}
function noticeBody(opts) {
  const quote = opts.deleted && !opts.couldNotRead && opts.original !== "";
  const what = opts.deleted ? "Your comment was removed because" : "Your comment could not be removed, and will not be acted on, because";
  const reason = opts.several ? `it carries more than one command (${opts.commands.join(", ")}). Atomaton acts on one command per ` + "comment: it acts on the first and drops the rest, and which one won is not visible on the page. " + "Comment each command on its own, with what you want done on the lines under it." : "the ball is with an agent on this issue/PR: the last turn on the thread was a request to an agent, " + "and it has not come back to a person yet. Please wait for that to finish, then comment again.";
  const lines = [
    LLM_CONTEXT_TAG.write("exclude"),
    ...quote ? [QUOTES_TAG.write(Number(opts.commentId))] : [],
    `${opts.mention}${what} ${reason}`
  ];
  if (opts.several && opts.removed) {
    lines.push("", "The ball is also with an agent on this issue/PR right now, so a comment would not reach anyone until that run comes back.");
  }
  if (quote) {
    const truncated = opts.original.length > MAX_PRESERVED_CHARS;
    const kept = truncated ? opts.original.slice(0, MAX_PRESERVED_CHARS) : opts.original;
    const fence = fenceFor(kept);
    lines.push([
      "<details><summary>Your comment, as you wrote it</summary>",
      "",
      fence,
      kept,
      fence,
      ...truncated ? ["", `The comment was longer than ${MAX_PRESERVED_CHARS.toLocaleString("en-US")} characters; the rest is not preserved here.`] : [],
      "",
      "</details>"
    ].join(`
`));
  } else if (opts.deleted && opts.couldNotRead) {
    lines.push("The text of that comment could not be read back before it was removed, so it is not preserved here.");
  }
  return lines.join(`
`);
}
function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      number: { type: "string" },
      "comment-id": { type: "string" },
      commenter: { type: "string" },
      parsed: { type: "string" },
      state: { type: "string" }
    }
  });
  if (!values.number || !values["comment-id"]) {
    console.error("usage: guard_comment_during_run.ts --number N --comment-id ID --commenter LOGIN [--parsed true] [--state open]");
    process.exit(2);
  }
  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const githubOutput = process.env.GITHUB_OUTPUT;
  const readBack = ghRead("api", `repos/${repo}/issues/comments/${values["comment-id"]}`, "--jq", ".body");
  const couldNotRead = readBack.code !== 0;
  const original = couldNotRead ? "" : readBack.stdout ?? "";
  const commands = commandsIn(original).map((c) => c.command.error !== "" ? c.line : c.command.control ? `/${c.command.control}` : `/${c.command.agent}`);
  const parsed = values.parsed === "true";
  const closed = values.state === "closed";
  const several = parsed && !closed && commands.length > 1;
  let removed = false;
  try {
    removed = commentWouldBeRemoved(repo, values.number, values["comment-id"]);
  } catch (e) {
    if (!several) {
      console.error(`Could not read the thread on #${values.number}, so this cannot tell whose turn it is: ${e}`);
      process.exit(1);
    }
    console.error(`Could not read the thread on #${values.number} (${e}); removing the comment for its commands`);
  }
  if (!removed && !several) {
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
  gh("issue", "comment", String(values.number), "--repo", repo, "--body", noticeBody({
    mention,
    several,
    commands,
    removed,
    deleted,
    couldNotRead,
    original,
    commentId: values["comment-id"]
  }));
  if (githubOutput)
    appendFileSync(githubOutput, `blocked=true
`);
  console.error(`Deleted comment #${values["comment-id"]} on #${values.number} ` + `(${several ? "more than one command" : "in-progress guard"}) and notified ${values.commenter || "(unknown)"}.`);
}
if (import.meta.main)
  main();
export {
  ref
};
