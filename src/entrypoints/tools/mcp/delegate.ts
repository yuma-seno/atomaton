#!/usr/bin/env bun
/**
 * delegate.ts — MCP server that runs one small piece of work in a sub-run of
 * `atoma` and returns what it found.
 *
 * ## What this is for
 *
 * An agent holding a large task often has a part of it that is cheaper to do
 * somewhere else: read a handful of files and say which one defines a symbol, run one
 * command and report its output, search a tree for a call site. Doing it in the
 * agent's own session means the reading, the searching and the dead ends all stay
 * in that session and are resent on every later inference. `delegate` does it
 * in a separate run whose transcript is thrown away, and hands back one paragraph.
 *
 * ## What it is not
 *
 * It is not a second agent. There is no session, nothing resumes it, and it cannot
 * hand work on: the sub-run is given `files` and `shell` and nothing else, so it
 * cannot reach GitHub, cannot dispatch, and cannot delegate again. See
 * `content/agent-definitions/delegate.md` for the role prompt it is started with.
 *
 * ## Why MCP rather than the shell
 *
 * `atoma` is a CLI binary and it is already on the agent's PATH — the runner puts
 * it at `/usr/local/bin/atoma` and `shell_guard` does not block it. Wrapping it
 * here is the "everything through MCP" rule: the agent calls a named tool with a
 * described argument rather than composing an argv it has to get right, and the
 * confinement (which servers the sub-run gets, which credentials it holds) is
 * decided here rather than by whatever the agent typed.
 *
 * ## The credentials, which are the hard part
 *
 * This process holds the provider keys, because a tool server receives a
 * credential only through its `env:` block in `tools/defaults.yaml`. It hardens
 * itself at startup for that reason — see `../lib/harden.ts`.
 *
 * The sub-run is handed the keys through `--credentials-file`, NOT through the
 * environment, and the environment it is spawned with has every credential name
 * REMOVED. That is the whole point: `atoma` reads the file and deletes it before
 * starting any tool server, so the key is never in the sub-run's environment block
 * and `/proc/<pid>/environ` has no window in which to read it. Inheriting the
 * environment instead would put the key there for the sub-run's whole lifetime.
 *
 * `GH_TOKEN` is deliberately not written to the file. The sub-run has no `github`
 * server, so it has nothing to authenticate with it, and a token it cannot use is
 * a token that can only leak.
 *
 * IMPORTANT: this process's `process.stdout` IS the JSON-RPC transport — never
 * `console.log()` anywhere in this file or in anything it calls in-process;
 * always `console.error()` (stderr) for logging.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { buildMcpTools, defineMcpTool, serveMcpServer, z, type BuiltMcpTool, type McpToolResult } from "../../../adapters/mcp/mcp-tool.ts";
import { hardenCredentialHolder } from "../lib/harden.ts";
import { machineryPath } from "../../../adapters/runner/machinery.ts";
import { DELEGATES_DIR } from "../../../domain/machinery/machinery-layout.ts";
import { requestedServersIn, resolveRoster, serverNamesOf, type DelegateDef } from "../../../domain/machinery/delegates.ts";
import { reportFrom } from "../../../domain/machinery/delegates.ts";
import { TOOL_OUTPUT_BACKSTOP } from "../../../shared/tool-output.ts";
import { RUN_CREDENTIALS } from "../../../domain/delivery/declared-secrets.ts";
import { literalsFrom, redact } from "../../../shared/redaction.ts";
import { capText, TOOL_OUTPUT_BUDGET } from "../../../shared/tool-output.ts";

function log(message: string): void {
  console.error(`[atomaton-delegate] ${message}`);
}

// Same OS user as every other tool server, including the one that runs arbitrary
// commands — so this process makes itself unreadable to its peers and drops
// writable directories from its PATH. It holds the provider keys, which is exactly
// the situation `../lib/harden.ts` exists for.
hardenCredentialHolder(log);

/**
 * Where the delegates are, when nothing says otherwise.
 *
 * `DELEGATES_DIR` from the layout, resolved through `machineryPath` — the same
 * mechanism every other layout path uses, and what makes this correct in both trees
 * without a relative step from `import.meta.url`. That trick worked while the
 * definitions were beside this script under the runtime root, and stopped working
 * when they moved under `.github/atomaton/`, which is a different tree entirely.
 *
 * A caller passes `--delegates-dir` when the machinery root is not the working
 * directory, and the workflow does.
 */
function defaultDelegatesDir(): string {
  return machineryPath(DELEGATES_DIR);
}

/**
 * Everything one definition contributes: its sub-run's servers and its role prompt.
 *
 * The servers decide whether the description promises a change, and the role prompt
 * is where the case for this delegate over another is argued, so both are read from
 * the files the definition names rather than restated here.
 *
 * A file that cannot be read is fatal rather than defaulted. A sub-run with no
 * tools looks like a confused delegate rather than a broken configuration, and the
 * log line here names the path.
 */
function readDefinition(defPath: string): string {
  try {
    return readFileSync(defPath, "utf8");
  } catch (e) {
    console.error(`[atomaton-delegate] could not read ${defPath}: ${(e as Error).message}`);
    process.exit(2);
  }
}

/**
 * The servers a sub-run is given, from its tools file.
 *
 * A sub-run with no servers is a run with no tools, which looks like a confused
 * delegate rather than a broken configuration. Fail at startup, where the log line
 * names the cause.
 */
function serverNames(tools: Record<string, unknown>, toolsPath: string): string[] {
  const servers = Object.keys(tools).filter((name) => name !== "hooks");
  if (servers.length === 0) {
    console.error(`[atomaton-delegate] ${toolsPath} declares no servers; refusing to start`);
    process.exit(2);
  }
  return servers;
}

/**
 * The definition's frontmatter, as the pairs it is written in.
 *
 * A small reader rather than a YAML parse: the frontmatter of every definition here
 * is `key: value` with no nesting, and parsing it as YAML would make a role prompt
 * that contains `---` an error about a document rather than about this file. A
 * malformed block is fatal, for the same reason a missing tools file is.
 */
function frontmatter(text: string, defPath: string): Map<string, string> {
  const out = new Map<string, string>();
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!block) {
    console.error(`[atomaton-delegate] ${defPath} has no frontmatter block`);
    process.exit(2);
  }
  for (const line of (block[1] ?? "").split(/\r?\n/)) {
    const at = line.indexOf(":");
    if (at === -1) continue;
    out.set(line.slice(0, at).trim(), line.slice(at + 1).trim());
  }
  return out;
}

/**
 * The body of the definition: the role prompt, with the frontmatter removed.
 *
 * This is what the tool's description is built from, so it is the part of the
 * definition a model reads when it is choosing between delegates. The frontmatter
 * above it is metadata for `atoma`, and repeating it here would spend the tool
 * schema on something the caller is not choosing by.
 */
function rolePrompt(text: string): string {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
}

/**
 * The sub-run's tools file, read and given the core's output cap.
 *
 * The cap is added here rather than written into the YAML, for the reason
 * `domain/machinery/tools-file.ts` gives about the project's own file: the servers
 * spend `TOOL_OUTPUT_BUDGET` from `shared/tool-output.ts`, and a YAML copy of the
 * number the core is asked for is the same fact spelled twice, agreeing until
 * somebody changes one.
 */
function readToolsFile(path: string): Record<string, unknown> {
  let parsed: { watch?: Record<string, unknown>; servers?: Record<string, unknown> };
  try {
    parsed = Bun.YAML.parse(readFileSync(path, "utf8")) as typeof parsed;
  } catch (e) {
    const message = (e as Error).message;
    console.error(`[atomaton-delegate] could not read ${path}: ${message}`);
    process.exit(2);
  }

  const out: Record<string, unknown> = {};
  const watch = parsed.watch ?? {};
  if (Object.keys(watch).length > 0) out.hooks = watch;
  for (const [name, server] of Object.entries(parsed.servers ?? {})) {
    out[name] = { max_output_chars: TOOL_OUTPUT_BACKSTOP, ...(server as Record<string, unknown>) };
  }
  return out;
}

/**
 * Which servers the sub-run is given, and which definition it is started with.
 *
 * The roster decides, and it lives with the definitions rather than here:
 *
 *   delegate:          [delegate, delegate_large]
 *   delegate_readonly: [delegate_readonly, delegate_readonly_large]
 *
 * The implementation is one program. What differs is what the sub-run may reach,
 * and that is the whole of the confinement: `delegate_readonly` exists so an agent
 * that holds `files_readonly` — the reviewer — cannot reach a writing server by
 * delegating to one. A sub-run's servers must be a subset of its caller's, and
 * making that a second entry rather than a runtime check is what keeps the rule
 * visible in the file a person reads.
 *
 * The definition and its tools file are checked against each other at startup,
 * because atoma resolves the definition's `mcp_servers` against the tools file it
 * is handed: a name in one that is not in the other is a server that does not start,
 * reported as a missing tool rather than as a file that disagrees.
 *
 * ## Why the definitions are NOT in `agent-definitions/`
 *
 * They were, and it was wrong. `agent-definitions/` is the namespace a PERSON
 * dispatches from: `/<name>` on an issue starts a run, `{{COLLEAGUES_LIST}}` is
 * built from it, `extract_directive.ts` accepts a `/<name>` handoff only when
 * `<name>.md` is there, and `agents.on_config_finding` may name any of them. A
 * delegate is none of those things — it is started by this server and by nothing
 * else, and it has no `task` argument a person could supply. Sitting in that
 * directory made `/delegate` a dispatchable agent that would fail on its first
 * turn, put it in every agent's colleague list, and offered it as a value for a
 * config key that starts a run.
 *
 * ## Why they are under `.github/atomaton/` rather than the runtime root
 *
 * They were under the runtime root, beside this script, and that was wrong too —
 * for the reason `docs/runtime/boundaries.md` gives. `.github/atomaton-runtime/` is
 * a build output: an upgrade replaces it wholesale. A `model:` line is the single
 * thing a project most wants to change about a delegate, and it was in a file that
 * the next release overwrote.
 */
const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    roster: { type: "string" },
    "delegates-dir": { type: "string" },
  },
});

/**
 * Where the delegates are, and the roster that names them.
 *
 * `--delegates-dir` when given, resolved through `machineryPath` so a workflow can
 * pass the layout-relative path; otherwise the layout constant. The roster is
 * `delegates.yaml` inside it, so one flag moves both.
 */
const DELEGATES_ROOT = values["delegates-dir"]
  ? machineryPath(values["delegates-dir"])
  : defaultDelegatesDir();

/**
 * Which of them this server offers.
 *
 * Required, and there is no default. A default would be a name, and this program is
 * two servers in `tools/defaults.yaml` — a writing one and a read-only one — so
 * which roster entry is wanted is the whole of what tells them apart. Guessing wrong
 * starts a server with the wrong reach.
 */
const ROSTER_KEY = values["roster"] ?? "";
if (!ROSTER_KEY) {
  console.error(
    "[atomaton-delegate] no --roster given. Pass the roster key this server should offer, " +
      "which is its own name in `tools/defaults.yaml`: `delegate` offers the writing folders " +
      "and `delegate_readonly` the read-only ones. There is no default, because which entry is " +
      "wanted is what tells the two apart.",
  );
  process.exit(2);
}

/**
 * One definition this server offers, with its two files read.
 *
 * The roster resolves the paths and checks that the pair exists; this adds what the
 * server needs to run one, which is the parsed tools file and the role prompt. The
 * division is deliberate: what a roster MEANS is `domain/machinery/delegates.ts` and
 * is tested there, and this file only does the reading.
 */
interface ResolvedDelegate extends DelegateDef {
  /** The sub-run's tools file, read at startup and handed over as it is. */
  tools: Record<string, unknown>;
  /** The servers the sub-run gets, read from that file. */
  servers: string[];
  /** Whether the sub-run may change the tree — see the `canWrite` branch below. */
  canWrite: boolean;
  /** Whether the sub-run has a shell, and so can run a command — see the `hasShell` branch below. */
  hasShell: boolean;
  /** The role prompt, which the tool's description is built from. */
  role: string;
}

const { defs, problems } = resolveRoster(
  join(DELEGATES_ROOT, "delegates.yaml"),
  (path) => readFileSync(path, "utf8"),
  (path) => existsSync(path),
);

// Every problem at once, then stop. A roster is read once at startup, so the log is
// the only place a person will see this, and one round trip per mistake in a file
// they are editing is the difference between a fix and a guess.
if (problems.length > 0) {
  for (const problem of problems) console.error(`[atomaton-delegate] ${problem}`);
  process.exit(2);
}

/**
 * The definitions this server's roster entry names, in roster order.
 *
 * Empty is fatal here where an unlisted FOLDER is not: the roster deliberately does
 * not care about folders nobody offers, but a server that was started with a key
 * this project does not declare is a `tools/defaults.yaml` that disagrees with
 * `delegates.yaml`, and a server with no tools starts and offers nothing.
 */
const MINE = defs.filter((def) => def.server === ROSTER_KEY);
if (MINE.length === 0) {
  console.error(
    `[atomaton-delegate] the roster declares no folders under \`${ROSTER_KEY}\`, so this server ` +
      `would offer no tools. Declared: ${[...new Set(defs.map((d) => d.server))].join(", ") || "(nothing)"}. ` +
      "Add the entry to delegates.yaml, or take the server out of tools/defaults.yaml.",
  );
  process.exit(2);
}

const DEFAULTS: ResolvedDelegate[] = MINE.map((def) => {
  const tools = readToolsFile(def.toolsFile);
  const servers = serverNamesOf(tools);
  // `files` and not `files_readonly`: the writing delegate is the one that can change
  // the tree, and the allowlist is what makes the other read-only rather than the
  // program being different.
  const canWrite = servers.includes("files");
  // `shell` is a separate reach, and a second false promise waits where it is
  // assumed: the read-only sub-run has no shell — a shell is a way to write, as its
  // own tools file says — so the command promise belongs to the branch that has one.
  const hasShell = servers.includes("shell");
  return { ...def, tools, servers, canWrite, hasShell, role: rolePrompt(readFileSync(def.agentFile, "utf8")) };
});

/**
 * How long the sub-run may take, in seconds.
 *
 * Ten minutes, and the number is a budget rather than a preference. The outer run
 * is blocked for the whole of it and its own time limit is checked only at
 * iteration boundaries — see `docs/tools/reference.md` and the note in
 * `atomaton-runner.wac.ts` — so a sub-run that runs long is time the outer run
 * cannot get back. Ten minutes is enough for reading and one command, and small
 * enough that an outer run with a normal budget survives it.
 */
const SUB_RUN_MAX_RUNTIME_SECS = 600;

/**
 * How long this server waits before killing the sub-run.
 *
 * Above the sub-run's own limit, so the sub-run stops itself and reports why
 * rather than being killed mid-inference with nothing to say. The gap is the time
 * `atoma` needs to write its envelope after the limit fires.
 */
const WRAPPER_TIMEOUT_MS = (SUB_RUN_MAX_RUNTIME_SECS + 60) * 1000;

/**
 * The provider keys, and only those.
 *
 * `RUN_CREDENTIALS` minus `GH_TOKEN`: the sub-run needs a provider key to call a
 * model, and has no use for a GitHub token. Written as a filter rather than a
 * second list, so a provider added to `RUN_CREDENTIALS` reaches the sub-run
 * without this file learning about it.
 */
const PROVIDER_CREDENTIALS = RUN_CREDENTIALS.filter((name) => name !== "GH_TOKEN");

/** Read once, at startup: the values do not change during a run. */
const SECRET_LITERALS = literalsFrom(process.env, RUN_CREDENTIALS);

const DELEGATE_RUN_SCHEMA = z.object({
  task: z
    .string()
    .min(1)
    .describe(
      "What to do, as an instruction to the delegate. One small piece of work: read and report, " +
        "search and report. Whether this delegate can also change files or run a command is said " +
        "in its own description, not here — every delegate this server offers reads this text, " +
        "and they do not all have the same reach. It cannot reach GitHub, cannot open " +
        "an issue or a pull request, and cannot delegate further. " +
        "It CAN look around on its own, so a task that is a question rather than a file is " +
        "delegatable too — and that is often the better call, because the searching is what fills " +
        "this session with transcripts. Write four things: WHAT you want to know, in the words of " +
        "the answer you are hoping for; WHERE it may be (a directory, a file, the whole tree) if " +
        "you know, and say so when you do not; WHAT counts as an answer, so a partial one is not " +
        "mistaken for a complete one; and WHEN to stop — for a search, say outright that finding " +
        "nothing is a useful report, because a delegate that has not found something will " +
        "otherwise keep looking until its ten minutes are gone.",
    ),
  context: z
    .string()
    .optional()
    .describe(
      "What the delegate should start from: files and line numbers you already know are " +
        "relevant, what is already known, what has been ruled out, and anything about the " +
        "repository it would otherwise have to rediscover. It starts with no memory of this " +
        "conversation, so anything you do not write here it has to find or do without.",
    ),
});

/**
 * The prompt the sub-run is started with.
 *
 * `task` first and `context` under a heading, because the delegate's report is
 * judged against the task and the context is only there to be read. A single
 * concatenation with no structure is what makes a delegate answer the context
 * instead of the task.
 */
function buildPrompt(task: string, context: string | undefined): string {
  const trimmed = (context ?? "").trim();
  if (!trimmed) return task.trim();
  return `${task.trim()}\n\n## Context\n\n${trimmed}`;
}

/**
 * The credentials the sub-run is handed, as the file `--credentials-file` reads.
 *
 * Empty values are omitted rather than written as `""`, for the reason
 * `write_credentials_file.ts` gives: a present-but-empty key tells atoma's provider
 * detection that a provider is configured when it is not.
 */
function providerCredentials(env: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of PROVIDER_CREDENTIALS) {
    const value = env[name];
    if (value) out[name] = value;
  }
  return out;
}

/**
 * The environment the sub-run is spawned with: this process's, minus every
 * credential.
 *
 * The removal is the point of the whole arrangement. `atoma` is given the keys
 * through `--credentials-file` and reads them from there, so it does not need them
 * in its environment — and a key that is not in the environment block is a key
 * `/proc/<pid>/environ` cannot show to a peer process for the sub-run's lifetime.
 *
 * `ATOMA_PROVIDER` is deliberately NOT removed: it is not a credential, it is how
 * the run is told which provider to use, and `resolve_provider` reads it from the
 * environment directly. Removing it would make the sub-run auto-detect from the
 * credential instead, which is the same answer only when exactly one key is set.
 */
function subRunEnv(env: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(env)) {
    if (value === undefined) continue;
    if (RUN_CREDENTIALS.includes(name)) continue;
    out[name] = value;
  }
  return out;
}

/** What the sub-run's `--output json` envelope carries that this tool reads. */
type RunEnvelope = Parameters<typeof reportFrom>[0];

async function handleDelegateRun(def: ResolvedDelegate, args: z.infer<typeof DELEGATE_RUN_SCHEMA>): Promise<McpToolResult> {
  const credentials = providerCredentials(process.env);
  if (Object.keys(credentials).length === 0) {
    // A sub-run with no provider key fails at its first inference with a message
    // about a provider, which names nothing near the real cause. Say it here.
    throw new Error(
      "Cannot delegate: this run holds no provider credential, so the sub-run could not call a model. " +
        "Do the work here instead.",
    );
  }

  const dir = mkdtempSync(join(tmpdir(), "atomaton-delegate-"));
  const toolsFile = join(dir, "tools.yaml");
  const credentialsFile = join(dir, "credentials.json");

  try {
    // The tools file, read at startup from `delegates/` and handed to the sub-run
    // as it is.
    //
    // It is NOT selected out of `tools/defaults.yaml`. That file is the servers
    // every agent run starts with, hooks and all, and a sub-run that inherited
    // them would inherit the next routing rule added there — `shell_guard` sends
    // `gh` to `github`, which a delegate does not have, so the first such rule
    // would break every delegate. The sub-run's surface is its own file, and the
    // core's output cap is added by `readToolsFile` from the module that owns it.
    writeFileSync(toolsFile, Bun.YAML.stringify(def.tools, null, 2));

    // Mode 0600, and it is not only a gesture: atoma deletes this file before
    // starting any server, and until then it is the only place the keys are.
    writeFileSync(credentialsFile, JSON.stringify(credentials), { mode: 0o600 });

    const agentDef = def.agentFile;
    const prompt = buildPrompt(args.task, args.context);

    log(`delegating: ${args.task.slice(0, 120).replace(/\s+/g, " ")}`);

    const child = Bun.spawn(
      [
        "atoma",
        "run",
        "--agent-def",
        agentDef,
        "--credentials-file",
        credentialsFile,
        "--tools-file",
        toolsFile,
        "--max-runtime-secs",
        String(SUB_RUN_MAX_RUNTIME_SECS),
        "--output",
        "json",
      ],
      {
        cwd: process.cwd(),
        env: subRunEnv(process.env),
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    if (!child.stdin) throw new Error("the sub-run's stdin is unavailable");
    child.stdin.write(prompt);
    child.stdin.end();

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, WRAPPER_TIMEOUT_MS);

    const [exitCode, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]).finally(() => clearTimeout(timer));

    // Redacted before it is returned or logged: a sub-run's stderr can carry a
    // provider error that quotes a request, and this value enters the outer
    // session, which GitHub Actions does not mask.
    const safeErr = redact(stderr, SECRET_LITERALS);

    if (timedOut) {
      log(`sub-run killed after ${WRAPPER_TIMEOUT_MS}ms`);
      return (
        `The delegate was stopped after ${Math.round(WRAPPER_TIMEOUT_MS / 1000)}s without finishing. ` +
        "Nothing was returned to report. If the task needs longer, do the work here instead."
      );
    }

    // The envelope is the last non-empty line of stdout: `--output json` prints one
    // JSON object there, and anything before it is a stray write this tool does not
    // control.
    const lastLine = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .pop();

    if (!lastLine) {
      log(`sub-run exited ${exitCode} with no output`);
      return (
        `The delegate produced no output (exit ${exitCode}). ` +
        (safeErr.trim() ? `It reported: ${capText(safeErr.trim(), 2_000, "tail").text}` : "It reported nothing.")
      );
    }

    let envelope: RunEnvelope;
    try {
      envelope = JSON.parse(lastLine) as RunEnvelope;
    } catch {
      // Not JSON: the sub-run died before it could print an envelope, and what it
      // printed instead is the only thing worth returning.
      log(`sub-run exited ${exitCode} with unparseable output`);
      return capText(redact(stdout, SECRET_LITERALS).trim(), TOOL_OUTPUT_BUDGET, "both").text;
    }

    const report = reportFrom(envelope, safeErr, exitCode);
    log(`sub-run ended: ${envelope.ended_because ?? "?"} in ${envelope.seconds ?? 0}s`);

    // The report is the delegate's own text and is returned whole up to the shared
    // budget. A delegate that overran it is a delegate that was asked for too much.
    return capText(report, TOOL_OUTPUT_BUDGET, "both").text;
  } finally {
    // The credentials file is normally already gone — atoma deletes it — and this
    // is the path where the sub-run never started. Best-effort, because a failure
    // to clean up must not replace the report with an error.
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      // The message is pulled out first rather than interpolated inline: a log
      // line whose literal text contains the word `Error` is read by atoma's
      // stderr fallback as a severity, and promoted in front of an agent as a
      // problem. See `tests/contract/server-reports.test.ts`.
      const message = (e as Error).message;
      log(`could not remove ${dir}: ${message}`);
    }
  }
}

/**
 * The description a model reads when it is choosing between this delegate and another.
 *
 * Written once and shared by every delegate this server offers, because the
 * differences that matter are facts about the definition rather than about the
 * program: `canWrite` and `hasShell` decide one sentence each, and the role prompt
 * says the rest. A description per definition would be four copies of this drifting apart.
 *
 * The middle sentences — what the sub-run holds — are the ones a caller cannot see
 * for itself, and the `canWrite` and `hasShell` branches are why they are here rather
 * than in the definition: the servers decide the reach, and the servers come from the
 * tools file. A promise left in the shared text reached every roster regardless of
 * reach, and the caller learned it was hollow only after spending a run on it.
 *
 * ## Why the tier is described here rather than in the caller's prompt
 *
 * The caller is told which delegate to reach for by THIS text, and not by a line in
 * its own role prompt, for a reason that is the whole point of the roster: which
 * delegates exist is a project's decision. A prompt that named `delegate_free`
 * said something that stopped being true the moment that project renamed a folder,
 * changed `provider:`, or pointed both entries at one model — and a prompt cannot be
 * edited without editing an agent definition, which is the file a project least
 * wants to fork.
 *
 * So the caller's prompt says "delegate this" and this text says "which one", and
 * the roster is what keeps the second sentence honest.
 */
function delegateDescription(def: ResolvedDelegate, shared: string): string {
  return (
    "Do one small piece of work in a separate run and return what it found. Use it for reading " +
    "and searching — the work whose transcript you do not want in this session. " +
    "The investigation you do not know how to start is the case it is most for: it does have " +
    "its own `grep`, `glob` and `read`, so \"find where X is defined and everywhere it is " +
    "called\" is a task you can hand over rather than a search you have to do first. Say what " +
    "an answer looks like and when to stop looking, and read `task` before calling. " +
    "It starts with NO memory of this conversation: put everything it needs in `task` and " +
    "`context`. Name the files when you already know them; when you do not, say so and give " +
    "it the ground to cover. " +
    "It CANNOT reach GitHub — no issues, no pull requests, no comments — cannot dispatch anything, " +
    "and cannot delegate further. " +
    (def.canWrite
      ? "Use it for changing files too: it works in the same tree, so a change it makes is a " +
        "change you will commit. "
      : "It CANNOT change anything: it reads and searches only, and a change it was asked to make " +
        "comes back as a description rather than as an edit. ") +
    (def.hasShell
      ? "It can also run one command to answer a question — the measurement a static reading of " +
        "the code cannot give you. "
      : "It CANNOT run commands: it has no shell, so a task that needs a measured result — stdout, " +
        "an exit code, a test run — comes back as a reading, not a measurement. Ask a run that has " +
        "a shell, or a person, for that. ") +
    "It has a ten-minute limit and no session: it runs once and returns one report, and nothing " +
    "resumes it. If the task is larger than that, or needs a decision, do it here instead." +
    shared
  );
}

/**
 * The tier this definition runs on, said in the words a caller chooses by.
 *
 * Read from the definition's frontmatter rather than written here, because the
 * frontmatter is what a project edits: a folder that has been pointed at a paid
 * model must stop being offered as the free one, and that is a change to the file
 * that says `model:`, not to this program.
 *
 * `orcarouter/free` is the one value that means the shared tier. It is a literal
 * rather than a classifier of the model name because the tier is not a property of
 * a name — it is what this particular deployment serves without charge and with a
 * request cap shared by every agent using it.
 *
 * A caller told "try the free one and read a refusal as an answer" needs to know
 * which tool that is, and this is where it finds out. Nothing else about the
 * difference is here: that a paid model also costs more is something a caller does
 * not spend, so it is not something the caller is asked to weigh.
 *
 * The free tier's refusal is described by its OBSERVED shape, never by the paid
 * delegates' names (#238): those are files a project renames and deletes, and a
 * name spelled here would outlive the file it named — the same layering rule that
 * keeps every other definition fact in the definitions. The refusal itself carries
 * the cause verbatim (`402`, `free_quota_exhausted`, the billing URL), so the
 * caller that wants a paid path reads the report and picks among the delegates it
 * was actually offered.
 */
function tierText(frontmatter: Map<string, string>): string {
  const free = (frontmatter.get("model") ?? "").endsWith("/free");
  return free
    ? " This one is FREE, and its request limit is shared with every other agent using that tier " +
        "— so the way to find out whether a task fits is to try it. A refusal before you get an " +
        "answer means the task was too large for the tier, not that the task was wrong: ask for " +
        "less, or do the work here instead. When the shared allowance itself is used up, the " +
        "refusal says so (a 402 that names the exhausted free allowance) and no task fits: read " +
        "the report, and use one of the other delegates you were offered, or do the work here."
    : " This one is PAID, so reach for the free delegate first and come here when it has said the " +
        "task is too large — or when the task is obviously big enough that the refusal is certain.";
}

/**
 * How this delegate differs from the others this server offers.
 *
 * Read from the definition's own body rather than written here, so adding a delegate
 * is adding a file. That body is a role prompt for the sub-run, so its first
 * paragraph is a fair description of what the caller would get — which is what a
 * model needs to choose between this one and its siblings.
 */
function distinguishingText(role: string): string {
  const firstParagraph = role.split(/\n\s*\n/)[0]?.trim() ?? "";
  return firstParagraph ? ` ${firstParagraph.replace(/\s+/g, " ")}` : "";
}

/** One definition as the MCP tool a model calls. */
function definitionTool(def: ResolvedDelegate): BuiltMcpTool {
  const front = frontmatter(readFileSync(def.agentFile, "utf8"), def.agentFile);
  return defineMcpTool({
    name: def.name,
    description: delegateDescription(def, distinguishingText(def.role) + tierText(front)),
    schema: DELEGATE_RUN_SCHEMA,
    handler: (args) => handleDelegateRun(def, args),
  });
}

const { tools, dispatch } = buildMcpTools(DEFAULTS.map(definitionTool));

async function main(): Promise<void> {
  log(
    `Starting atomaton-delegate-mcp-server (stdio transport): ` +
      DEFAULTS.map((def) => `${def.name}=${def.servers.join("+")}`).join(", "),
  );
  await serveMcpServer({ name: "atomaton-delegate-mcp", version: "1.0.0", tools, dispatch, log });
}

if (import.meta.main) void main();
