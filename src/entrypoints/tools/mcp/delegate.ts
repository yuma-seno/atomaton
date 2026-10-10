#!/usr/bin/env bun
/**
 * delegate.ts — MCP server that runs one small piece of work in a sub-run of
 * `atoma` and returns what it found.
 *
 * ## What this is for
 *
 * An agent holding a large task often has a part of it that is cheaper to do
 * somewhere else: read four files and say which one defines a symbol, run one
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
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { buildMcpTools, defineMcpTool, serveMcpServer, z, type BuiltMcpTool, type McpToolResult } from "../../../adapters/mcp/mcp-tool.ts";
import { hardenCredentialHolder } from "../lib/harden.ts";
import { machineryPath } from "../../../adapters/runner/machinery.ts";
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
 * Where this server's own files are, when nothing says otherwise.
 *
 * `delegates/` sits beside `mcp/` in the deployed tree, and beside it in `src/`
 * too — `entrypoints/tools/delegates/` — so one relative step reaches it from
 * either. That is the same trick `shipped-servers.ts` documents getting wrong once:
 * the deployed tree flattens `src/domain/` into the script that imports it, so a
 * path derived from `import.meta.url` is right in one layout and wrong in the
 * other. Here the two DO agree, because `mcp/delegate.ts` deploys to
 * `tools/mcp/delegate.ts` and `delegates/` deploys to `tools/delegates/` — the
 * parent is `tools/` in both.
 *
 * A caller that knows better passes `--delegates-dir`, and the workflow does: the
 * machinery root is not always the working directory.
 */
function defaultDelegatesDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "delegates");
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
 * Both come from the command line rather than from a table here, because the
 * distinction between the two entries this server backs is a CONFIGURATION
 * distinction and belongs in `defaults.yaml` where a reader can see it:
 *
 *   `delegate`          --servers files,shell        --agent-def delegate.md
 *   `delegate_readonly` --servers files_readonly     --agent-def delegate_readonly.md
 *
 * The implementation is one program. What differs is what the sub-run may reach,
 * and that is the whole of the confinement: `delegate_readonly` exists so an agent
 * that holds `files_readonly` — the reviewer — cannot reach a writing server by
 * delegating to one. A sub-run's servers must be a subset of its caller's, and
 * making that a second entry rather than a runtime check is what keeps the rule
 * visible in the file a person reads.
 *
 * The agent definition is named here too, and not derived from the server list,
 * because atoma resolves the definition's `mcp_servers` against the tools file it
 * is handed: the two have to agree, and naming both in one place is what makes
 * that agreement checkable rather than hoped for.
 *
 * ## Why the definition and the tools file are NOT in `agent-definitions/`
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
 * So both live under the runtime root, beside the server that reads them, and
 * neither is in the namespace a person or a workflow resolves names against.
 */
const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    "agent-defs": { type: "string", multiple: true },
    "delegates-dir": { type: "string" },
  },
});

/**
 * Where the delegate's own files are.
 *
 * `--delegates-dir` when given, resolved against the machinery root so a workflow
 * can pass the layout-relative path; otherwise the directory beside this script.
 * The two agree in both layouts — see `defaultDelegatesDir`.
 */
const DELEGATES_DIR = values["delegates-dir"]
  ? resolve(machineryPath(values["delegates-dir"]))
  : defaultDelegatesDir();

/**
 * The agent definitions this server offers, each becoming one tool.
 *
 * Required, and there is no default. A default would be the name of one
 * definition, which is a choice only a caller can make: this program is four
 * servers in `tools/defaults.yaml` — a writing pair and a read-only pair — and
 * which of those a caller wants is the whole of what tells them apart. Guessing
 * wrong starts a server with the wrong reach.
 *
 * A list rather than one name, because two entries that differ only in the model
 * are the same offer at two prices, and an agent choosing between them should be
 * choosing between two tools rather than between two servers it cannot compare.
 * It is also what makes each tool's name distinct: `unprefixed` means a tool is
 * known by its own name, so two servers offering one name are fatal, and a single
 * hard-coded name here was exactly that.
 */
const AGENT_DEF_FILES = values["agent-defs"] ?? [];
if (AGENT_DEF_FILES.length === 0) {
  console.error(
    "[atomaton-delegate] no --agent-defs given. Pass the definition file(s) this server should " +
      "offer, naming one tool each; there is no default, because which definitions a server " +
      "offers is what tells the writing pair from the read-only pair.",
  );
  process.exit(2);
}

/**
 * One definition this server offers, with the files derived from its name.
 *
 * The tools file is derived from the definition name so the two cannot drift:
 * `delegate.md` reads `delegate.tools.yaml`, `delegate_readonly.md` reads
 * `delegate_readonly.tools.yaml`. There is no `--tools-file`: it named one of the
 * files under `delegates/`, and a caller that passed a definition and a server
 * list that disagreed was naming a delegate neither file described.
 */
interface DelegateDef {
  /** The definition's file name, as passed — `delegate_readonly.md`. */
  file: string;
  /** The tool's name and the server's own word for it: the file name without `.md`. */
  name: string;
  /** Absolute path to the sub-run's tools file. */
  toolsFile: string;
  /** That file, read at startup and handed to the sub-run as it is. */
  tools: Record<string, unknown>;
  /** The servers the sub-run gets, read from that file. */
  servers: string[];
  /** Whether the sub-run may change the tree — see `CAN_WRITE`. */
  canWrite: boolean;
  /** The role prompt in the definition, which the tool's description is built from. */
  role: string;
}

const DEFAULTS: DelegateDef[] = AGENT_DEF_FILES.map((file) => {
  const name = file.replace(/\.md$/, "");
  const toolsFile = join(DELEGATES_DIR, `${name}.tools.yaml`);
  const tools = readToolsFile(toolsFile);
  const servers = serverNames(tools, toolsFile);
  return { file, name, toolsFile, tools, servers, canWrite: servers.includes("files"), role: rolePrompt(readDefinition(join(DELEGATES_DIR, file))) };
});

// Two definitions of one name would be two tools of one name, which the core refuses
// at registration with a message about the SERVER — `delegate` and `delegate` — that
// says nothing about this file. Named here, where the list that caused it is.
const seenNames = new Set<string>();
for (const def of DEFAULTS) {
  if (seenNames.has(def.name)) {
    console.error(
      `[atomaton-delegate] '${def.name}' is offered twice by --agent-defs, so this server would ` +
        "advertise two tools with one name. atoma refuses that at registration and names the " +
        "server rather than the list; fix the list.",
    );
    process.exit(2);
  }
  seenNames.add(def.name);
}

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
        "search and report, make one change, run one command. It cannot reach GitHub, cannot open " +
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
interface RunEnvelope {
  response?: string | null;
  finish_reason?: string | null;
  ended_because?: string;
  seconds?: number;
  iterations?: number;
}

/**
 * The text to hand back, from the sub-run's envelope.
 *
 * `response` is the delegate's report and is what the caller wants. It is `null`
 * on every ending that is not a completion — a time limit, a stop, a failure — and
 * there the envelope's own word for the ending is the honest answer, because the
 * delegate produced no report to return.
 */
function reportFrom(envelope: RunEnvelope): string {
  const response = (envelope.response ?? "").trim();
  if (response) return response;
  const because = envelope.ended_because ?? "failed";
  return (
    `The delegate produced no report: the sub-run ended because of \`${because}\` ` +
    `after ${envelope.seconds ?? 0}s and ${envelope.iterations ?? 0} iteration(s). ` +
    "Nothing was returned to report. If the task needs longer than the sub-run's limit, " +
    "do the work here instead."
  );
}

async function handleDelegateRun(def: DelegateDef, args: z.infer<typeof DELEGATE_RUN_SCHEMA>): Promise<McpToolResult> {
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

    const agentDef = join(DELEGATES_DIR, def.file);
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

    const report = reportFrom(envelope);
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
 * program: `canWrite` decides two sentences, and the role prompt says the rest. A
 * description per definition would be four copies of this drifting apart.
 *
 * The middle sentence — what the sub-run holds — is the one a caller cannot see for
 * itself, and the `canWrite` branch is why it is here rather than in the definition:
 * the servers decide the reach, and the servers come from the tools file.
 */
function delegateDescription(def: DelegateDef, shared: string): string {
  return (
    "Do one small piece of work in a separate run and return what it found. Use it for reading, " +
    "searching and changing files, and for running one command to answer a question — the work " +
    "whose transcript you do not want in this session. " +
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
      ? "It works in the same tree, so a change it makes is a change you will commit. "
      : "It CANNOT change anything: it reads and searches only, and a change it was asked to make " +
        "comes back as a description rather than as an edit. ") +
    "It has a ten-minute limit and no session: it runs once and returns one report, and nothing " +
    "resumes it. If the task is larger than that, or needs a decision, do it here instead." +
    shared
  );
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
function definitionTool(def: DelegateDef): BuiltMcpTool {
  return defineMcpTool({
    name: def.name,
    description: delegateDescription(def, distinguishingText(def.role)),
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
