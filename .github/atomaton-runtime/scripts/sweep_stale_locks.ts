#!/usr/bin/env bun
// @bun

// src/entrypoints/machinery/sweep_stale_locks.ts
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

// src/shared/fence.ts
function fenceSegments(text) {
  const lines = text.match(/[^\n]*\n|[^\n]+$/g) ?? [];
  const segments = [];
  let open = null;
  let current = { text: "", code: false };
  let startsBlock = true;
  let previousDepth = 0;
  const flush = () => {
    if (current.text)
      segments.push(current);
    current = { text: "", code: false };
  };
  for (let index = 0;index < lines.length; index += 1) {
    const line = lines[index];
    const bare = line.replace(/\r?\n$/, "");
    const { depth, rest } = stripQuotes(bare, Number.POSITIVE_INFINITY);
    if (depth > previousDepth)
      startsBlock = true;
    previousDepth = depth;
    if (open !== null && depth < open.depth) {
      flush();
      open = null;
      startsBlock = true;
    }
    if (open === null) {
      const fence = FENCE.exec(rest);
      if (fence !== null && (fence[1][0] !== "`" || !fence[2].includes("`"))) {
        flush();
        open = { char: fence[1][0], length: fence[1].length, depth, indent: null };
        current = { text: line, code: true };
        startsBlock = false;
        continue;
      }
      const indented = INDENTED_FENCE.exec(rest);
      const opensIndented = indented !== null && startsBlock && (indented[2][0] !== "`" || !indented[3].includes("`")) && hasIndentedCloser(lines, index, depth, indented[1].length, indented[2]);
      if (opensIndented) {
        flush();
        open = {
          char: indented[2][0],
          length: indented[2].length,
          depth,
          indent: indented[1].length
        };
        current = { text: line, code: true };
        startsBlock = false;
        continue;
      }
      current.text += line;
      startsBlock = indented !== null && !startsBlock ? false : endsBlock(rest);
      continue;
    }
    current.text += line;
    if (closesFence(stripQuotes(bare, open.depth).rest, open)) {
      flush();
      open = null;
      startsBlock = true;
    }
  }
  flush();
  return segments;
}
var FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
var INDENTED_FENCE = /^( {4,})(`{3,}|~{3,})(.*)$/;
var ATX_HEADING = /^ {0,3}#{1,6}(?:[ \t]|$)/;
var THEMATIC_BREAK = /^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/;
var LIST_ITEM = /^ {0,3}(?:[-+*]|\d{1,9}[.)])(?:[ \t]+|$)/;
function endsBlock(rest) {
  if (rest.trim() === "")
    return true;
  return ATX_HEADING.test(rest) || THEMATIC_BREAK.test(rest) || LIST_ITEM.test(rest) || FENCE.test(rest) || INDENTED_FENCE.test(rest);
}
function closesFence(rest, open) {
  if (open.indent === null) {
    const normal = FENCE.exec(rest);
    return normal !== null && normal[1][0] === open.char && normal[1].length >= open.length && normal[2].trim() === "";
  }
  const indented = INDENTED_FENCE.exec(rest);
  if (indented === null)
    return false;
  const indent = indented[1].length;
  return indent >= 4 && indent <= open.indent + 3 && indented[2][0] === open.char && indented[2].length >= open.length && indented[3].trim() === "";
}
function hasIndentedCloser(lines, opener, depth, indent, marker) {
  for (let index = opener + 1;index < lines.length; index += 1) {
    const bare = lines[index].replace(/\r?\n$/, "");
    const { depth: lineDepth, rest } = stripQuotes(bare, depth);
    if (lineDepth < depth)
      return false;
    if (rest.trim() !== "" && rest.length - rest.trimStart().length < indent)
      return false;
    if (closesFence(rest, { char: marker[0], length: marker.length, depth, indent }))
      return true;
  }
  return false;
}
function stripQuotes(line, limit) {
  let rest = line;
  let depth = 0;
  while (depth < limit) {
    const marker = /^ {0,3}> ?/.exec(rest);
    if (marker === null)
      break;
    rest = rest.slice(marker[0].length);
    depth += 1;
  }
  return { depth, rest };
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

// src/domain/work/control-commands.ts
var CONTROL_COMMAND_NAMES = ["stop", "resume"];
function isControlCommand(name) {
  return CONTROL_COMMAND_NAMES.includes(name);
}

// src/domain/work/comment-command.ts
var COMMAND_RE = new RegExp(`^\\/(${AGENT_NAME_PATTERN})(?:\\s+(.*))?$`);
var DISPATCH_RE = new RegExp(`^<!--\\s*atomaton:dispatch\\s*=\\s*(${AGENT_NAME_PATTERN})\\s*-->`);
function recoveryLines(agent) {
  return [
    `- Continue: comment \`/${agent}\` and put what to do next on the following lines.`,
    `- Start clean: comment \`/${agent} recover\`, which archives this session and rebuilds`,
    "  it from the issue."
  ];
}
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
function commentBodies(repo, number) {
  return listComments(repo, number).map((comment) => comment.body ?? "");
}
function lockOf(entries, shaped) {
  const park = shaped.events[shaped.events.length - 1] === "waiting" ? newestWaiting(entries) : undefined;
  const open = shaped.openClaim;
  const lock = park === undefined ? {} : { park };
  if (open === undefined)
    return lock;
  const at = newestWith(entries, (body) => {
    const claim = readers.claim(body);
    return claim !== undefined && claim.ask === open.ask && claim.run === open.run;
  });
  return { ...lock, claim: { ...open, at } };
}
function newestWith(entries, which) {
  for (let index = entries.length - 1;index >= 0; index -= 1) {
    const entry = entries[index];
    if (entry.quoted)
      continue;
    if (which(entry.body))
      return entry.at ?? "";
  }
  return "";
}
function newestWaiting(entries) {
  for (let index = entries.length - 1;index >= 0; index -= 1) {
    const entry = entries[index];
    if (entry.quoted)
      continue;
    const ended = ENDED_TAG.readProse(entry.body);
    if (ended?.verb === "waiting")
      return { at: entry.at ?? "", answers: ended.answers };
  }
  return;
}
function lockOn(repo, number) {
  const entries = listComments(repo, number).map(entryOf);
  return lockOf(entries, shapedThread(entries, readers));
}

// src/adapters/github/agent-on-issue.ts
function mostRecentAgent(bodies) {
  for (let i = bodies.length - 1;i >= 0; i--) {
    const body = bodies[i] ?? "";
    if (isQuotation(body))
      continue;
    const result = AGENT_TAG.readProse(body);
    if (result)
      return result;
    const asked = parseCommentCommand(proseOnly(body)).agent;
    if (asked)
      return asked;
  }
  return "";
}
function mostRecentAgentOn(repo, number) {
  try {
    return mostRecentAgent(commentBodies(repo, number));
  } catch {
    return "";
  }
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
      kind: "pull_request",
      parent: closes[0] ? normalise(closes[0]) : undefined,
      children: [],
      pullRequests: []
    };
  }
  const declared = (issue.closedByPullRequestsReferences?.nodes ?? []).map(asPr);
  const referenced = (issue.timelineItems?.nodes ?? []).map((node) => node.source).filter((source) => Boolean(source?.number) && PARENT_ISSUE_TAG.readProse(source?.body ?? "") === number).map(asPr);
  return {
    kind: "issue",
    parent: issue.parent ? normalise(issue.parent) : undefined,
    children: (issue.subIssues?.nodes ?? []).map(asChild),
    pullRequests: dedupeByNumber(declared, referenced)
  };
}

// src/adapters/github/run-status.ts
function readRunStatus(repo, runId) {
  const read = ghRead("api", `repos/${repo}/actions/runs/${runId}`, "--jq", ".status");
  if (read.code !== 0) {
    return { read: false, why: (read.stderr || read.stdout || `gh exited ${read.code}`).trim().split(`
`)[0] ?? "" };
  }
  const status = (read.stdout ?? "").trim();
  if (status === "")
    return { read: false, why: "the run read returned no status" };
  return { read: true, status };
}

// src/domain/work/stale-lock.ts
var CLAIM_WITHOUT_RUN_MINUTES = 360;
var PARK_COLLECTION_MINUTES = 30;
function ageMinutes(at, nowMs) {
  const parsed = Date.parse(at);
  if (!Number.isFinite(parsed))
    return;
  return (nowMs - parsed) / 60000;
}
function claimFreshness(claim, run, nowMs) {
  if (claim.run > 0) {
    if (!run.read)
      return "unknown";
    return run.status === "completed" ? "stale" : "fresh";
  }
  const age = ageMinutes(claim.at, nowMs);
  if (age === undefined)
    return "unknown";
  return age >= CLAIM_WITHOUT_RUN_MINUTES ? "stale" : "fresh";
}
function parkOverdue(parkedSince, nowMs) {
  const age = ageMinutes(parkedSince, nowMs);
  return age !== undefined && age >= PARK_COLLECTION_MINUTES;
}
function lockVerdict(args) {
  if (args.parked) {
    if (args.openUnder === undefined)
      return "undetermined";
    if (args.openUnder > 0)
      return "hold";
    if (!parkOverdue(args.parkedSince, args.nowMs))
      return "hold";
    if (args.claim === undefined)
      return "release";
    const parkedClaim = claimFreshness(args.claim, args.run, args.nowMs);
    return parkedClaim === "fresh" ? "hold" : parkedClaim === "unknown" ? "undetermined" : "release";
  }
  if (args.claim === undefined)
    return "hold";
  const freshness = claimFreshness(args.claim, args.run, args.nowMs);
  if (freshness === "unknown")
    return "undetermined";
  return freshness === "fresh" ? "hold" : "release";
}

// src/adapters/github/node-lock.ts
function openUnderOf(repo, number) {
  const links = issueLinks(repo, Number(number));
  if (links.unavailable !== undefined)
    return;
  const open = (nodes) => nodes.filter((node) => node.state === "open").length;
  return open(links.children) + open(links.pullRequests);
}
function readNodeLock(repo, number, nowMs) {
  const lock = lockOn(repo, number);
  const run = lock.claim !== undefined && lock.claim.run > 0 ? readRunStatus(repo, lock.claim.run) : null;
  const openUnder = lock.park !== undefined ? openUnderOf(repo, number) : 0;
  const verdict = lockVerdict({
    claim: lock.claim,
    parked: lock.park !== undefined,
    parkedSince: lock.park?.at ?? "",
    openUnder,
    run: run ?? { read: false, why: "the claim names no run" },
    nowMs
  });
  return { lock, verdict, run };
}

// src/adapters/github/turn-comment.ts
function turnHeader(h) {
  const context = h.audience === "model" ? "include" : "exclude";
  const agent = (h.agent ?? "").trim();
  return [
    LLM_CONTEXT_TAG.write(context),
    ...agent === "" ? [] : [AGENT_TAG.write(agent)],
    ENDED_TAG.write({ verb: h.ended, answers: h.answers ?? 0, run: h.run ?? 0 })
  ];
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
  in_progress: "atomaton/in-progress",
  waiting_for_person: "atomaton/waiting-for-person"
};
function getLabel(key) {
  return loadConfig().chain?.labels?.[key] ?? DEFAULT_LABELS[key];
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
  const labels = (parsed.labels ?? []).map((label) => label.name ?? "").filter((name) => name !== "");
  if (parsed.state === "open")
    return { known: true, kind, state: "open", labels };
  if (parsed.state === "closed") {
    return {
      known: true,
      kind,
      state: isPr ? pullRequestOutcome(Boolean(parsed.pull_request?.merged_at)) : issueOutcome(parsed.state_reason),
      labels
    };
  }
  return { known: false, why: `unrecognised state ${JSON.stringify(parsed.state ?? null)}` };
}

// src/entrypoints/machinery/lib/turn-labels.ts
function applyTurnLabels(phase, repo, number) {
  const inProgress = getLabel("in_progress");
  const waitingForPerson = getLabel("waiting_for_person");
  const edit = (action, label) => gh("issue", "edit", number, action, label, ...repo ? ["--repo", repo] : []);
  const create = (label, color, description) => gh("label", "create", label, "--force", "-c", color, "-d", description, ...repo ? ["--repo", repo] : []);
  const state = readTargetState(number, repo);
  const present = state.known ? new Set(state.labels ?? []) : undefined;
  const remove = (label) => {
    if (present !== undefined && !present.has(label))
      return;
    const removed = edit("--remove-label", label);
    if (removed.code !== 0)
      console.error(`::warning::could not remove '${label}' from #${number}`);
  };
  let effective = phase;
  if (phase === "closed") {
    if (state.known && state.state === "open")
      return;
  } else if (!state.known) {
    console.error(`::warning::could not read #${number}'s state (${state.why}); applying '${phase}' labels without the closed guard`);
  } else if (state.state !== "open") {
    console.error(`#${number} is closed; the turn labels come off and neither goes on (#352)`);
    effective = "closed";
  }
  if (effective === "closed") {
    remove(waitingForPerson);
    remove(inProgress);
    return;
  }
  if (effective === "running") {
    create(inProgress, "0366d6", "Issue is being worked on by an Atomaton agent");
    const added = edit("--add-label", inProgress);
    if (added.code !== 0)
      console.error(`::warning::could not add '${inProgress}' to #${number}`);
    remove(waitingForPerson);
    return;
  }
  create(waitingForPerson, "fbca04", "The turn is with a person on this issue or pull request");
  remove(inProgress);
  const added = edit("--add-label", waitingForPerson);
  if (added.code !== 0)
    console.error(`::warning::could not add '${waitingForPerson}' to #${number}`);
}

// src/entrypoints/machinery/lib/stale-sweep.ts
var SWEEP_LIMIT = 200;
function staleClaimNotice(agent, ask, sweepRunId) {
  return [
    ...turnHeader({ ended: "done", audience: "person", answers: ask, run: sweepRunId }),
    "Atomaton: this request was taken up, but no answer was posted for it \u2014 and the run that",
    "took it up has finished. The turn had stayed with that run, so nothing was running here.",
    "",
    "Nothing was decided by that run: whatever it reached \u2014 commits, pull requests, saved",
    "history \u2014 is whatever reached GitHub before it stopped.",
    "",
    ...recoveryLines(agent)
  ].join(`
`);
}
function staleParkNotice(agent, ask, sweepRunId) {
  return [
    ...turnHeader({ ended: "done", audience: "person", answers: ask, run: sweepRunId }),
    "Atomaton: this node's run parked the turn on the work started under it, and the resume that",
    "was to collect it never arrived. Nothing under this node is still open, and nothing is running here.",
    "",
    ...recoveryLines(agent)
  ].join(`
`);
}
function inProgressNodes(repo, label) {
  const path = `repos/${repo}/issues?state=open&labels=${encodeURIComponent(label)}&per_page=100`;
  let nodes;
  try {
    nodes = ghPaginated("api", path);
  } catch (error) {
    throw new Error(`could not list the nodes wearing '${label}': ${error.message}`);
  }
  return nodes.map((node) => Number(node.number)).filter((number) => Number.isInteger(number) && number > 0).slice(0, SWEEP_LIMIT);
}
function sweepStaleLocks(opts) {
  const log = opts.log ?? ((message) => console.error(message));
  const nodes = inProgressNodes(opts.repo, getLabel("in_progress"));
  log(`stale sweep: ${nodes.length} node(s) wearing the in-progress label`);
  let released = 0;
  let held = 0;
  let undetermined = 0;
  let failed = 0;
  for (const number of nodes) {
    let read;
    try {
      read = readNodeLock(opts.repo, number, opts.nowMs);
    } catch (error) {
      undetermined += 1;
      log(`stale sweep: could not read #${number}'s thread, so it is left alone: ${error.message}`);
      continue;
    }
    if (read.verdict === "hold") {
      held += 1;
      continue;
    }
    const ask = read.lock.claim?.ask ?? read.lock.park?.answers;
    if (read.verdict === "undetermined" || ask === undefined) {
      undetermined += 1;
      log(`stale sweep: #${number}'s lock is not something this sweep can call; left alone`);
      continue;
    }
    const parked = read.lock.park !== undefined;
    const agent = mostRecentAgentOn(opts.repo, number) || "atomaton";
    const body = parked ? staleParkNotice(agent, ask, opts.runId) : staleClaimNotice(agent, ask, opts.runId);
    const posted = gh("issue", "comment", String(number), "--repo", opts.repo, "--body", body);
    if (posted.code !== 0) {
      failed += 1;
      log(`::error::stale sweep: could not post the ending on #${number}: ${posted.stderr || posted.stdout}`);
      continue;
    }
    released += 1;
    log(`stale sweep: ${parked ? "released a missed park" : "released a dead claim"} on #${number}`);
    const answeredLock = read.lock.claim;
    let stillHeld;
    try {
      const after = lockOn(opts.repo, number).claim;
      stillHeld = answeredLock !== undefined ? after?.ask === answeredLock.ask && after?.run === answeredLock.run : after !== undefined && after.ask === ask;
    } catch (error) {
      failed += 1;
      log(`::error::stale sweep: released #${number} but could not read the thread back to check it: ${error.message}`);
      continue;
    }
    if (stillHeld) {
      failed += 1;
      log(`::error::stale sweep: #${number} still holds a claim after the ending was posted; this sweep will report it again`);
      continue;
    }
    applyTurnLabels("with-person", opts.repo, String(number));
  }
  log(`stale sweep: examined ${nodes.length}, released ${released}, held ${held}, ` + `undetermined ${undetermined}, failed ${failed}`);
  return { examined: nodes.length, released, held, undetermined, failed };
}

// src/entrypoints/machinery/lib/script-ref.ts
import { basename } from "path";
import { fileURLToPath } from "url";
function defineScript(importMetaUrl) {
  return { runtimePath: `${SCRIPTS_DIR}/${basename(fileURLToPath(importMetaUrl))}` };
}

// src/entrypoints/machinery/sweep_stale_locks.ts
var ref = defineScript(import.meta.url);
function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: { repo: { type: "string" }, "run-id": { type: "string" } }
  });
  const repo = values.repo ?? process.env.GITHUB_REPOSITORY ?? "";
  if (!repo) {
    console.error("usage: sweep_stale_locks.ts [--repo OWNER/REPO] [--run-id N]  (or set GITHUB_REPOSITORY)");
    process.exit(2);
  }
  const runId = Number(values["run-id"] ?? process.env.GITHUB_RUN_ID ?? 0);
  const summary = sweepStaleLocks({
    repo,
    runId: Number.isInteger(runId) && runId > 0 ? runId : 0,
    nowMs: Date.now()
  });
  if (summary.failed > 0) {
    console.error(`::error::stale sweep: ${summary.failed} release(s) did not take effect and were left for a person; ` + `see the lines above for the nodes`);
    process.exitCode = 1;
  }
}
if (import.meta.main)
  main();
export {
  ref
};
