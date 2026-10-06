#!/usr/bin/env bun
// @bun

// src/entrypoints/machinery/stop_on_close.ts
import { parseArgs } from "util";

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

// src/domain/work/actor.ts
var BOT_TYPE = "Bot";
function isHumanActor(type) {
  return (type ?? "").trim().toLowerCase() !== BOT_TYPE.toLowerCase();
}

// src/domain/work/closed-target.ts
function stopOnCloseNotice(number) {
  return [
    "Atomaton: this issue was closed while an agent was working on it, so the run has been asked to stop.",
    "",
    "Closing does not stop a run by itself \u2014 it kept going until this request reached it. The run stops after its current step, so it may take a minute.",
    "",
    `#${number} stays closed, and the run will report here when it has stopped.`
  ].join(`
`);
}
function closedTheTreeNotice(closed, stopped) {
  const lines = [];
  if (closed.length > 0) {
    lines.push("", `The work under it is closed too: ${closed.map((n) => `#${n}`).join(", ")}.`);
  }
  if (stopped.length > 0) {
    lines.push("", `Runs were going on ${stopped.map((n) => `#${n}`).join(", ")}, and each has been asked to stop.`);
  }
  return lines.join(`
`);
}

// src/domain/work/work-tree.ts
var MAX_DEPTH = 10;
function subtree(nodes, root) {
  const byParent = new Map;
  const byNumber = new Map;
  for (const node of nodes) {
    byNumber.set(node.number, node);
    if (node.parent === undefined)
      continue;
    const siblings = byParent.get(node.parent) ?? [];
    siblings.push(node);
    byParent.set(node.parent, siblings);
  }
  const start = byNumber.get(root);
  if (!start)
    return [];
  const found = [start];
  const seen = new Set([root]);
  let frontier = [root];
  for (let depth = 0;depth < MAX_DEPTH && frontier.length > 0; depth += 1) {
    const next = [];
    for (const parent of frontier) {
      for (const child of byParent.get(parent) ?? []) {
        if (seen.has(child.number))
          continue;
        seen.add(child.number);
        found.push(child);
        next.push(child.number);
      }
    }
    frontier = next;
  }
  return found;
}
function nodesToStop(nodes) {
  return nodes.filter((node) => node.running);
}
function nodesToClose(nodes) {
  return nodes.filter((node) => node.state === "open");
}
function descendants(nodes, root) {
  return nodes.filter((node) => node.number !== root);
}
function closeReachedNotice(root) {
  return [
    `Atomaton: #${root} was closed, and this work was under it, so it is closed too.`,
    "",
    "Any run here has been asked to stop."
  ].join(`
`);
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
function graphqlArgs(query, variables) {
  const args = ["api", "graphql", "-f", `query=${query}`];
  for (const [key, value] of Object.entries(variables)) {
    args.push("-F", `${key}=${value}`);
  }
  return args;
}
function graphqlResult({ code, stdout, stderr }) {
  if (code !== 0) {
    throw new Error(`GraphQL query failed: ${stderr || stdout.slice(0, 200)}`);
  }
  const result = JSON.parse(stdout);
  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }
  return result.data;
}
function ghGraphqlRead(query, variables = {}) {
  return graphqlResult(ghRead(...graphqlArgs(query, variables)));
}

// src/adapters/github/outcome.ts
function issueOutcome(reason) {
  const said = (reason ?? "").toLowerCase();
  return said === "not_planned" || said === "duplicate" ? "abandoned" : "done";
}
function pullRequestOutcome(merged) {
  return merged ? "done" : "abandoned";
}
function saysOpen(state) {
  return (state ?? "").toLowerCase() === "open";
}

// src/domain/work/issue-links.ts
var CLOSING_KEYWORDS = "close[sd]?|fix(?:e[sd])?|resolve[sd]?";
function claimsToClose(body, issue) {
  return new RegExp(`\\b(?:${CLOSING_KEYWORDS})\\s*:?\\s+#${issue}\\b`, "i").test(body);
}
function dedupeByNumber(...lists) {
  const seen = new Map;
  for (const list of lists)
    for (const item of list)
      if (!seen.has(item.number))
        seen.set(item.number, item);
  return [...seen.values()].sort((a, b) => a.number - b.number);
}

// src/adapters/github/issue-links.ts
var LINK_LIMIT = 50;
var LABEL_LIMIT = 20;
var QUERY = `
query($owner:String!, $name:String!, $number:Int!, $limit:Int!, $labelLimit:Int!) {
  repository(owner:$owner, name:$name) {
    issueOrPullRequest(number:$number) {
      __typename
      ... on Issue {
        parent { number title state stateReason }
        subIssues(first:$limit) { nodes { number title state stateReason labels(first:$labelLimit) { nodes { name } } } }
        closedByPullRequestsReferences(first:$limit, includeClosedPrs:true) {
          nodes { number title state merged body }
        }
        timelineItems(last:$limit, itemTypes:[CROSS_REFERENCED_EVENT]) {
          nodes { ... on CrossReferencedEvent { source { ... on PullRequest { number title state merged body } } } }
        }
      }
      ... on PullRequest {
        closingIssuesReferences(first:$limit) { nodes { number title state stateReason } }
      }
    }
  }
}`;
function normalise(node) {
  return {
    number: node.number,
    title: node.title,
    state: saysOpen(node.state) ? "open" : issueOutcome(node.stateReason)
  };
}
function asChild(node) {
  return { ...normalise(node), labels: (node.labels?.nodes ?? []).map((label) => label.name) };
}
function asPr(node) {
  return {
    number: node.number,
    title: node.title,
    state: saysOpen(node.state) ? "open" : pullRequestOutcome(Boolean(node.merged))
  };
}
function issueLinks(repo, number) {
  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    return { children: [], pullRequests: [], unavailable: `"${repo}" is not an owner/name repository` };
  }
  let issue = null;
  try {
    issue = ghGraphqlRead(QUERY, { owner, name, number, limit: LINK_LIMIT, labelLimit: LABEL_LIMIT }).repository?.issueOrPullRequest ?? null;
  } catch (error) {
    const why = error.message;
    console.error(`[atomaton-github] WARN could not read links for #${number}: ${why}`);
    return { children: [], pullRequests: [], unavailable: `GitHub could not be reached: ${why}` };
  }
  if (!issue)
    return { children: [], pullRequests: [], unavailable: `#${number} was not found` };
  if (issue.__typename === "PullRequest") {
    const closes = issue.closingIssuesReferences?.nodes ?? [];
    return {
      parent: closes[0] ? normalise(closes[0]) : undefined,
      children: [],
      pullRequests: []
    };
  }
  const declared = (issue.closedByPullRequestsReferences?.nodes ?? []).map(asPr);
  const referenced = (issue.timelineItems?.nodes ?? []).map((node) => node.source).filter((source) => Boolean(source?.number) && claimsToClose(source?.body ?? "", number)).map(asPr);
  return {
    parent: issue.parent ? normalise(issue.parent) : undefined,
    children: (issue.subIssues?.nodes ?? []).map(asChild),
    pullRequests: dedupeByNumber(declared, referenced)
  };
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

// src/domain/work/thread.ts
function eventOf(body, readers) {
  const ending = readers.ending(body);
  if (ending !== "")
    return ending;
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

// src/adapters/github/work-tree.ts
function parseListed(stdout) {
  try {
    return JSON.parse(stdout || "[]");
  } catch {
    return null;
  }
}
function runningOn(repo, number) {
  try {
    return { running: runInFlight(repo, number) };
  } catch (e) {
    return { running: false, problem: `could not read the thread on #${number}: ${e.message}` };
  }
}
function readNode(repo, number) {
  const { code, stdout, stderr } = ghRead("api", `repos/${repo}/issues/${number}`);
  if (code !== 0) {
    return { problem: `could not read #${number}: ${(stderr || stdout).trim().split(`
`)[0] ?? ""}` };
  }
  let raw;
  try {
    raw = JSON.parse(stdout);
  } catch {
    return { problem: `the response for #${number} was not JSON` };
  }
  const isPr = raw.pull_request !== undefined;
  if (raw.state !== "open" && raw.state !== "closed") {
    return { problem: `#${number} reported an unrecognised state ${JSON.stringify(raw.state ?? null)}` };
  }
  const state = raw.state === "open" ? "open" : isPr ? pullRequestOutcome(Boolean(raw.pull_request?.merged_at)) : issueOutcome(raw.state_reason);
  const { running, problem } = runningOn(repo, number);
  if (problem)
    return { problem };
  return {
    node: {
      number,
      kind: isPr ? "pull-request" : "issue",
      state,
      parent: isPr ? PARENT_ISSUE_TAG.read(raw.body ?? "") : undefined,
      running
    }
  };
}
function readChildren(repo, parent) {
  const nodes = [];
  const problems = [];
  const prs = ghRead("pr", "list", "--repo", repo, "--state", "all", "--limit", "200", "--search", `${PARENT_ISSUE_TAG.search(parent)} in:body`, "--json", "number,body,state,labels");
  if (prs.code !== 0)
    problems.push(`could not list the pull requests for #${parent}`);
  const listedPrs = parseListed(prs.stdout);
  if (listedPrs === null)
    problems.push(`the pull request listing for #${parent} was not readable`);
  for (const found of listedPrs ?? []) {
    if (PARENT_ISSUE_TAG.read(found.body ?? "") !== parent)
      continue;
    const { running, problem } = runningOn(repo, found.number);
    if (problem) {
      problems.push(problem);
      continue;
    }
    nodes.push({
      number: found.number,
      kind: "pull-request",
      state: saysOpen(found.state) ? "open" : pullRequestOutcome(found.state === "MERGED"),
      parent,
      running
    });
  }
  const links = issueLinks(repo, parent);
  if (links.unavailable) {
    problems.push(`could not read GitHub's own links for #${parent}: ${links.unavailable}`);
  }
  const already = new Set(nodes.map((node) => node.number));
  for (const child of links.children) {
    if (already.has(child.number))
      continue;
    const { running, problem } = runningOn(repo, child.number);
    if (problem) {
      problems.push(problem);
      continue;
    }
    already.add(child.number);
    nodes.push({
      number: child.number,
      kind: "issue",
      state: child.state,
      parent,
      running
    });
  }
  for (const linked of links.pullRequests) {
    if (already.has(linked.number))
      continue;
    const { node, problem } = readNode(repo, linked.number);
    if (!node) {
      problems.push(problem ?? `could not read #${linked.number}`);
      continue;
    }
    already.add(linked.number);
    nodes.push({ ...node, parent });
  }
  return { nodes, problems };
}
function readWorkTree(repo, root) {
  const { node, problem } = readNode(repo, root);
  if (!node)
    return { nodes: [], problems: [problem ?? `could not read #${root}`] };
  const nodes = [node];
  const problems = [];
  const seen = new Set([root]);
  let frontier = [root];
  for (let depth = 0;depth < MAX_DEPTH && frontier.length > 0; depth += 1) {
    const next = [];
    for (const parent of frontier) {
      const found = readChildren(repo, parent);
      problems.push(...found.problems);
      for (const child of found.nodes) {
        if (seen.has(child.number))
          continue;
        seen.add(child.number);
        nodes.push(child);
        if (child.kind === "issue")
          next.push(child.number);
      }
    }
    frontier = next;
  }
  return { nodes, problems };
}
function commentOn(repo, number, body) {
  return gh("issue", "comment", String(number), "--repo", repo, "--body", body).code === 0;
}
function closeSubtreeUnder(repo, root, rootBody) {
  const { nodes, problems } = readWorkTree(repo, root);
  const all = subtree(nodes, root);
  const stopped = [];
  const closed = [];
  const rootNotified = commentOn(repo, root, rootBody);
  if (!rootNotified)
    problems.push(`could not post the stop request on #${root}`);
  else if (all.find((node) => node.number === root)?.running)
    stopped.push(root);
  const under = descendants(all, root);
  for (const node of nodesToStop(under)) {
    const body = [LLM_CONTEXT_TAG.write("exclude"), STOP_TAG.write("requested"), closeReachedNotice(root)].join(`
`);
    if (commentOn(repo, node.number, body))
      stopped.push(node.number);
    else
      problems.push(`could not post the stop request on #${node.number}`);
  }
  for (const node of nodesToClose(under)) {
    const closeIt = node.kind === "pull-request" ? gh("pr", "close", String(node.number), "--repo", repo) : gh("issue", "close", String(node.number), "--repo", repo);
    if (closeIt.code === 0)
      closed.push(node.number);
    else
      problems.push(`could not close #${node.number}`);
  }
  return { stopped, closed, rootNotified, problems };
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

// src/entrypoints/machinery/stop_on_close.ts
var ref = defineScript(import.meta.url);
function stopOnCloseBody(number, closed, stopped) {
  return [
    LLM_CONTEXT_TAG.write("exclude"),
    STOP_TAG.write("requested"),
    stopOnCloseNotice(number),
    closedTheTreeNotice(closed, stopped)
  ].join(`
`);
}
function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      number: { type: "string" },
      closer: { type: "string" },
      "closer-type": { type: "string" }
    }
  });
  if (!values.number) {
    console.error("usage: stop_on_close.ts --number N --closer LOGIN [--closer-type Bot|User]");
    process.exit(2);
  }
  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const number = String(values.number);
  const closer = (values.closer ?? "").trim();
  if (!isHumanActor(values["closer-type"])) {
    console.error(`#${number} was closed by a bot, which is how an agent finishes its own work. Nothing to stop.`);
    return;
  }
  const root = Number(number);
  const { nodes, problems: readProblems } = readWorkTree(repo, root);
  if (nodes.length === 0) {
    console.error(`::error::Could not read the work under #${root}: ${readProblems.join("; ")}`);
    process.exit(1);
  }
  const all = subtree(nodes, root);
  const under = descendants(all, root);
  const toStop = nodesToStop(all);
  const toClose = nodesToClose(under);
  if (toStop.length === 0 && toClose.length === 0) {
    console.error(`Nothing is running under #${root} and nothing under it is open. Nothing to do.`);
    return;
  }
  const result = closeSubtreeUnder(repo, root, stopOnCloseBody(root, toClose.map((n) => n.number), nodesToStop(under).map((n) => n.number)));
  result.problems.push(...readProblems);
  for (const problem of result.problems)
    console.error(`::warning::${problem}`);
  if (!result.rootNotified)
    process.exit(1);
  console.error(`#${root} was closed by ${closer || "(unknown)"}. ` + `Stopped: ${result.stopped.map((n) => `#${n}`).join(", ") || "none"}. ` + `Closed under it: ${result.closed.map((n) => `#${n}`).join(", ") || "none"}.`);
}
if (import.meta.main)
  main();
export {
  ref,
  stopOnCloseBody
};
