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
