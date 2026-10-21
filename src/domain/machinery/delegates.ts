/**
 * delegates.ts — the roster, and the folder shape it names.
 *
 * Pure, and separate from `mcp/delegate.ts` for the reason every other rule in
 * `domain/` is: the server cannot be asked what it would do with a roster without
 * being started, and what it would do is the part worth getting right. The server
 * reads files and this decides what they mean.
 *
 * ## The shape it names
 *
 *   <dir>/delegates.yaml      server name -> folder names, one tool per folder
 *   <dir>/<folder>/agent.md   the sub-run's definition
 *   <dir>/<folder>/tools.yaml the servers that sub-run is handed
 *
 * A folder is the unit because its NAME is the tool name: `delegate/tools.yaml`
 * cannot disagree with `delegate/agent.md` about which delegate they describe,
 * where a `.tools.yaml` beside a `.md` had to be derived from it and could be
 * derived wrongly.
 *
 * ## What is fatal and what is not
 *
 * Fatal, because the symptom is otherwise a sub-run that does not start and a
 * report about a tool rather than about a file:
 *
 *   - the roster is unreadable, or is not a map of name to list
 *   - a server's entry is not a list of strings
 *   - a listed folder has no `agent.md`, or no `tools.yaml`
 *   - the two files name different servers
 *
 * Not fatal, and not even a warning: a folder that no server lists. A folder being
 * written, or one kept for reference, is an ordinary state — and a warning about it
 * would fire on every run of a project that has one.
 */
import { capText } from "../../shared/tool-output.ts";

/** One folder, resolved to the two files it must have. */
export interface DelegateDef {
  /** The folder name, which is the tool name. */
  readonly name: string;
  /** The server this definition belongs to, from the roster's key. */
  readonly server: string;
  /** Absolute path to `<folder>/agent.md`. */
  readonly agentFile: string;
  /** Absolute path to `<folder>/tools.yaml`. */
  readonly toolsFile: string;
}

/** What went wrong, as a sentence naming the file — or null when nothing did. */
export interface RosterProblem {
  readonly message: string;
}

export interface RosterResult {
  /** One entry per folder, in roster order with each server's list in its order. */
  readonly defs: readonly DelegateDef[];
  /** Non-empty means the server must refuse to start. */
  readonly problems: readonly string[];
}

/**
 * The server names in a tools file, whether it is the file as written or as
 * normalized.
 *
 * Both spellings of the reserved key are excluded, and that is the point of the
 * function rather than an accident: a tools file as a person writes it puts its hooks
 * under `watch`, and `readToolsFile` in `mcp/delegate.ts` renames that to `hooks` on
 * the way to the core. The two are compared against each other in `resolveRoster` —
 * a raw file against an `agent.md` — so excluding only the normalized name would read
 * a folder with hooks as declaring a server called `watch`.
 */
export function serverNamesOf(tools: unknown): string[] {
  if (!tools || typeof tools !== "object") return [];
  return Object.keys(tools as Record<string, unknown>).filter(
    (name) => name !== "hooks" && name !== "watch",
  );
}

/**
 * The servers an `agent.md` asks for, from its `mcp_servers` list.
 *
 * Walks the frontmatter block line by line rather than matching a list with one
 * regex: a pattern anchored on `mcp_servers:` followed by indented items also matches
 * every LATER indented line, so a definition with `knows_about:` under it would report
 * that field's values as servers. The walk stops at the first line that is not an
 * item, which is where the list ends and the next key begins.
 *
 * A deliberately small reader rather than a YAML parse of the whole file: the
 * frontmatter is `key: value` where the values that matter are scalars and one list,
 * and parsing the document would make a role prompt containing `---` an error about a
 * document rather than about this file. A list it cannot read produces an empty
 * answer, which disagrees with every non-empty tools file — a refusal rather than a
 * silent pass.
 */
export function requestedServersIn(agentText: string): string[] {
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(agentText);
  if (!block) return [];

  const lines = (block[1] ?? "").split(/\r?\n/);
  const at = lines.findIndex((line) => /^mcp_servers:\s*$/.test(line));
  if (at === -1) return [];

  const names: string[] = [];
  for (const line of lines.slice(at + 1)) {
    // Blank lines and comments are skipped rather than stopping the walk: every
    // shipped definition annotates its list, and the first annotation is usually the
    // one before the first name.
    if (/^\s*(#.*)?$/.test(line)) continue;
    // A run of `  - name` ends at the first line that is neither an item nor a
    // comment, which is where the next key begins.
    const item = /^\s+-\s*([^\s#]+)/.exec(line);
    if (!item) break;
    names.push(item[1] ?? "");
  }
  return names.filter(Boolean);
}

/**
 * Read the roster and resolve every folder it names.
 *
 * `read` and `exists` are passed in rather than imported so this is a pure function
 * of its inputs: the rules above are then testable without a directory on disk, and
 * the server supplies the real ones.
 */
export function resolveRoster(
  rosterPath: string,
  read: (path: string) => string,
  exists: (path: string) => boolean,
): RosterResult {
  const problems: string[] = [];
  const defs: DelegateDef[] = [];

  let parsed: unknown;
  try {
    parsed = Bun.YAML.parse(read(rosterPath));
  } catch (error) {
    return { defs, problems: [`${rosterPath} is not valid YAML: ${(error as Error).message}`] };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      defs,
      problems: [`${rosterPath} must be a map of server name to the folders it offers.`],
    };
  }

  // The directory the roster is in, which is where the folders are. Taken from the
  // path rather than passed separately: the roster and what it names move together,
  // and a second argument would be a second thing to keep in step.
  const dir = rosterPath.replace(/[\\/][^\\/]*$/, "");

  for (const [server, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!Array.isArray(value) || value.some((name) => typeof name !== "string" || name.trim() === "")) {
      problems.push(`${rosterPath}: \`${server}\` must be a list of folder names.`);
      continue;
    }
    for (const raw of value as string[]) {
      const name = raw.trim();
      const agentFile = `${dir}/${name}/agent.md`;
      const toolsFile = `${dir}/${name}/tools.yaml`;

      if (!exists(agentFile) || !exists(toolsFile)) {
        problems.push(
          `${rosterPath} names \`${server}: ${name}\`, but ${!exists(agentFile) ? agentFile : toolsFile} ` +
            "does not exist. A delegate folder holds agent.md and tools.yaml.",
        );
        continue;
      }

      // The two files have to name the same servers. Atoma resolves the
      // definition's `mcp_servers` against the tools file it is handed, so a name
      // in one and not the other is a server that does not start — reported as a
      // tool that is missing rather than as a file that disagrees.
      //
      // Under `servers:`, not at the top level: a tools file's own keys are `watch`
      // and `servers`, and reading the top level would compare every definition
      // against the literal name `servers`.
      const requested = requestedServersIn(read(agentFile)).sort();
      const parsedTools = Bun.YAML.parse(read(toolsFile)) as { servers?: Record<string, unknown> };
      const declared = serverNamesOf(parsedTools?.servers).sort();
      if (requested.join(",") !== declared.join(",")) {
        problems.push(
          `${agentFile} asks for [${requested.join(", ")}] and ${toolsFile} declares ` +
            `[${declared.join(", ")}]. They must name the same servers.`,
        );
        continue;
      }

      defs.push({ name, server, agentFile, toolsFile });
    }
  }

  // Two servers offering one folder would be two tools of one name, which the core
  // refuses at registration with a message about the SERVER rather than about the
  // roster. Named here, where the list that caused it is.
  const seen = new Map<string, string>();
  for (const def of defs) {
    const previous = seen.get(def.name);
    if (previous) {
      problems.push(
        `${rosterPath}: \`${def.name}\` is offered by both \`${previous}\` and \`${def.server}\`, ` +
          "so two tools would carry one name. atoma refuses that at registration.",
      );
      continue;
    }
    seen.set(def.name, def.server);
  }

  return { defs, problems };
}

/**
 * What the sub-run's `--output json` envelope carries that a caller needs.
 *
 * Only the fields that decide what to say back. `response` is the report; the rest
 * describe an ending that produced none.
 */
export interface RunEnvelope {
  response?: string | null;
  finish_reason?: string | null;
  ended_because?: string;
  seconds?: number;
  iterations?: number;
}

/**
 * The text to hand a caller, from the sub-run's envelope and what it printed on
 * stderr.
 *
 * `response` is the delegate's report and is what the caller wants. It is `null` on
 * every ending that is not a completion — a time limit, a stop, a failure — and
 * there the envelope's own word for the ending is the honest answer, because the
 * delegate produced no report to return.
 *
 * `stderr` is appended when there is one, and it is the only place the cause of a
 * failure survives: the envelope says `failed` for a provider refusal, a missing
 * server and everything else, and a caller handed only the word cannot tell a task
 * that was too large from a tier that is not answering. The wrapper captures this
 * stream already; discarding it was what made a provider refusal read as a timeout.
 *
 * The advice is conditional on the ending it fits. `iterations` of zero means the
 * sub-run never reached a model, so nothing timed out and no prompt was measured —
 * pointing the caller at the task's size there is the mistake #178 recorded.
 */
export function reportFrom(envelope: RunEnvelope, stderr = "", exitCode?: number | null): string {
  const response = (envelope.response ?? "").trim();
  if (response) return response;
  const because = envelope.ended_because ?? "failed";
  const why = stderr.trim() ? ` It reported: ${capText(stderr.trim(), 2_000, "tail").text}` : "";
  const neverReachedAModel = (envelope.iterations ?? 0) === 0;
  const advice = neverReachedAModel
    ? " Nothing was returned to report. The sub-run never reached a model, so the task's size " +
      "is not the answer; do the work here instead."
    : " Nothing was returned to report. If the task needs longer than the sub-run's limit, " +
      "do the work here instead.";
  const status = exitCode === undefined || exitCode === null ? "" : ` (exit ${exitCode})`;
  return (
    `The delegate produced no report: the sub-run ended because of \`${because}\` ` +
    `after ${envelope.seconds ?? 0}s and ${envelope.iterations ?? 0} iteration(s)${status}.` +
    why +
    advice
  );
}

/**
 * ## The tool sets that are a promise
 *
 * A delegate's tools file decides what its sub-run can reach, and the read-only pair
 * makes their whole promise with a `tool_allowlist` — the program behind the server
 * is `mcp/files.ts`, the same six-tool program `files` runs, so the allowlist is the
 * whole of what separates a sub-run that may write from one that may not. The set a
 * sub-run ends up holding is therefore written out here as a set, the way
 * `effective-tools.ts` writes out the shipped servers': not as the patterns that are
 * supposed to produce it.
 *
 * Three ways the set can change without leaving a dead pattern behind, all invisible
 * to a check that reads patterns:
 *
 *   - an allowlist entry is deleted, which widens the server and matches nothing
 *   - a server's entry loses `unprefixed: true`, so every tool arrives as
 *     `server__tool` and every bare pattern misses it — a read-only sub-run that
 *     refuses all four of its tools is what that looks like
 *   - the program behind a server renames or drops a tool, which the files read as
 *     unchanged configuration and the sub-run reads as a tool that is not there
 *
 * The first two are held by `tests/contract/delegate-tool-sets.test.ts` against the
 * YAML, the third by `tests/contract/delegate-live-tools.test.ts` against the running
 * server, both from the table below. The expectations are typed out here and never
 * derived from the files they check: an expectation computed from `tool_allowlist`
 * would move with every edit to it, which is precisely the defect the table exists
 * to catch.
 *
 * ## Whose promise this is
 *
 * Atomaton's, for the folders this repository ships. `delegates/` is the one
 * directory an adopter is told to edit, so a project that changes its own tools
 * files is making a different promise, and nothing here is a check on them.
 */

/** One server a delegate hands its sub-run, and what its program offers. */
export interface DelegateServerTools {
  /** The server as the delegate's `tools.yaml` names it. */
  readonly server: string;
  /** Everything the program behind it offers, before any allowlist narrows it. */
  readonly provides: readonly string[];
}

/** The tools one delegate's sub-run must end up holding, and what is lost if they change. */
export interface DelegateToolSet {
  /** The folder under `delegates/`, whose name is also the tool the parent calls. */
  readonly delegate: string;
  /** Every tool the sub-run holds, exactly, as the sub-run sees it. */
  readonly tools: readonly string[];
  /** The servers the sub-run is handed, each with what its program provides. */
  readonly servers: readonly DelegateServerTools[];
  /** What is lost if this stops being true. Printed with a failure. */
  readonly promise: string;
}

/**
 * The name a sub-run's model calls a tool by.
 *
 * `unprefixed: true` publishes a tool under its own name; without it the core keeps
 * the `server__tool` spelling. A `tool_allowlist` pattern is matched against THIS
 * name, which is why the read-only delegates' bare patterns narrow a server that
 * declares itself unprefixed and refuse everything on one that does not.
 */
export function delegateToolName(unprefixed: boolean, server: string, tool: string): string {
  return unprefixed ? tool : `${server}__${tool}`;
}

/**
 * What `mcp/files.ts` offers — typed out once because it is one program behind two
 * server names. `files` and `files_readonly` declare the same list here, and the
 * test that holds the read-only files to the same program as the writing ones is
 * what keeps that honest; the live check holds the list to the program itself.
 */
const FILES_PROGRAM_TOOLS: readonly string[] = ["read", "grep", "glob", "edit", "write", "list"];

/** What `mcp/shell.ts` offers. */
const SHELL_PROGRAM_TOOLS: readonly string[] = ["bash"];

/** The four delegates this repository ships, held to the sets their sub-runs hold. */
export const EXACT_DELEGATE_TOOL_SETS: readonly DelegateToolSet[] = [
  {
    delegate: "delegate",
    tools: ["read", "grep", "glob", "edit", "write", "list", "bash"],
    servers: [
      { server: "files", provides: FILES_PROGRAM_TOOLS },
      { server: "shell", provides: SHELL_PROGRAM_TOOLS },
    ],
    promise:
      "The writing sub-run holds the whole file surface and a shell — the description its caller " +
      "chooses it by promises reading, searching and changing files and one command to answer a " +
      "question, and its caller commits whatever the sub-run changes.",
  },
  {
    delegate: "delegate_large",
    tools: ["read", "grep", "glob", "edit", "write", "list", "bash"],
    servers: [
      { server: "files", provides: FILES_PROGRAM_TOOLS },
      { server: "shell", provides: SHELL_PROGRAM_TOOLS },
    ],
    promise:
      "The paid writing sub-run holds the same surface as the free one: the tier is a property of " +
      "the model, not of the tools, and a task the free tier could not finish is not a smaller task.",
  },
  {
    delegate: "delegate_readonly",
    tools: ["read", "grep", "glob", "list"],
    servers: [{ server: "files_readonly", provides: FILES_PROGRAM_TOOLS }],
    promise:
      "The read-only sub-run holds the four reading tools and nothing that writes. The allowlist " +
      "is the whole of what makes the delegate safe to hand to an agent that must not change the " +
      "tree, and it narrows only a server whose tools arrive under their bare names — the " +
      'description promises its caller "its own `grep`, `glob` and `read`".',
  },
  {
    delegate: "delegate_readonly_large",
    tools: ["read", "grep", "glob", "list"],
    servers: [{ server: "files_readonly", provides: FILES_PROGRAM_TOOLS }],
    promise:
      "The paid read-only sub-run holds the same four reading tools as the free one, for the same " +
      "reason: nothing in this tier may write, whoever is paying for the reading.",
  },
];
