/**
 * delegate-yaml.test.ts — the delegate `tools.yaml` files, read as YAML and held to
 * the shape `mcp/delegate.ts` hands the core.
 *
 * ## Why this exists beside the checks that already read these files
 *
 * `agent-definitions.test.ts` and `resolveRoster` compare server NAMES between a
 * folder's two files, and `readToolsFile` parses a tools file only where a sub-run
 * is starting. No test read these files as YAML at all, so a malformed flow sequence
 * or a key the core refuses would fail at the moment somebody first delegates — late,
 * in a run nobody is watching, reported as a sub-run that never started rather than
 * as a file that disagrees. The same gap for the file agents start with is what
 * `tools-yaml.test.ts` closed; this is that check for the four files a sub-run
 * starts with.
 *
 * ## The one assertion that is this repository's own
 *
 * The core reads a fixed list of server keys; `unprefixed` is on it. Everything here
 * must set it to `true`: the sub-run's tools are promised under their own names
 * (`read`, not `files__read`), and a bare `tool_allowlist` pattern matches only a
 * bare name — a server that loses the setting does not degrade, it refuses every
 * call. A `false` here is therefore the one regression this file is shaped to catch.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TOOLS_DIR, sourceOf } from "../../src/domain/machinery/machinery-layout.ts";

const DELEGATES_DIR = join(process.cwd(), "src/content/delegates");

/**
 * The roster decides which folders are checked, so a delegate added later is held by
 * this file without another edit here. An unlisted folder stays unlisted: it is
 * ignored by design, and `resolveRoster` never sees it either.
 */
const roster = Bun.YAML.parse(readFileSync(join(DELEGATES_DIR, "delegates.yaml"), "utf8")) as Record<
  string,
  string[]
>;
const FOLDERS = [...new Set(Object.values(roster).flat())].sort();

/** The keys atoma reads for one server. Same list `tools-yaml.test.ts` holds the generated file to. */
const CORE_SERVER_KEYS = new Set([
  "command",
  "args",
  "env",
  "url",
  "headers",
  "hooks",
  "max_output_chars",
  "request_timeout_secs",
  "unprefixed",
]);
const CORE_HOOK_KEYS = new Set(["before_tool", "after_tool", "tool_allowlist", "tool_denylist"]);

/**
 * The only hooks a delegate's tools file may declare, and it is narrower than the
 * core's list on purpose. `before_tool` and `after_tool` are run-level guards —
 * `shell_guard` routes `gh` to a server this sub-run does not have, `files_guard`
 * counts a search streak a ten-minute sub-run does not keep — and the headers of
 * these files explain why none of them may appear here: a sub-run whose servers were
 * selected out of `tools/defaults.yaml` would inherit whatever hooks that file
 * gained. The allowlists are the exception, because a list inside one server's entry
 * says what THAT server may offer and nothing about the run around it.
 */
const DELEGATE_HOOK_KEYS = new Set(["tool_allowlist", "tool_denylist"]);

/** How a server entry's `args` name the deployed program, wherever the machinery is rooted. */
const ROOT_PREFIX = "${ATOMATON_MACHINERY_ROOT:-.}/";

interface DelegateServer {
  command?: unknown;
  args?: unknown;
  env?: unknown;
  hooks?: Record<string, unknown>;
  unprefixed?: unknown;
  request_timeout_secs?: unknown;
}

interface DelegateToolsFile {
  watch?: Record<string, unknown>;
  servers?: Record<string, DelegateServer>;
}

/**
 * The source file a server entry starts, resolved through the layout table the same
 * way `hardened-servers.test.ts` resolves one: the deployed path and the source tree
 * share no naming rule, so the correspondence is read from `BUILT_FROM` rather than
 * spliced.
 */
function sourceScriptOf(args: unknown): string | undefined {
  if (!Array.isArray(args)) return undefined;
  for (const arg of args.map(String)) {
    if (!arg.startsWith(ROOT_PREFIX)) continue;
    const deployed = arg.slice(ROOT_PREFIX.length);
    if (!deployed.startsWith(`${TOOLS_DIR}/`)) continue;
    return join("src", sourceOf(TOOLS_DIR), deployed.slice(TOOLS_DIR.length + 1));
  }
  return undefined;
}

describe("the delegate tools files", () => {
  for (const folder of FOLDERS) {
    describe(folder, () => {
      const path = join(DELEGATES_DIR, folder, "tools.yaml");
      const parsed = Bun.YAML.parse(readFileSync(path, "utf8").replaceAll("\r\n", "\n")) as DelegateToolsFile;

      test("parses, and carries only the two keys a tools file has", () => {
        const top = Object.keys(parsed).filter((key) => key !== "watch" && key !== "servers");
        expect(top, `${path}: a tools file's own keys are \`watch\` and \`servers\``).toEqual([]);
        expect(
          parsed.servers,
          `${path} declares no servers, so the sub-run would start with no tools at all`,
        ).toBeDefined();
      });

      /**
       * Empty, and that is the design rather than an omission: the file declares no
       * hooks of its own, so a sub-run inherits none of the parent's guards. A hook
       * here would be a routing rule naming a server the sub-run does not have.
       */
      test("declares no hooks of its own", () => {
        expect(parsed.watch ?? {}, `${path}: the file-wide hooks must stay empty`).toEqual({});
      });

      test("every server says only what atoma reads", () => {
        const unknown: string[] = [];
        for (const [name, entry] of Object.entries(parsed.servers ?? {})) {
          for (const key of Object.keys(entry)) {
            if (!CORE_SERVER_KEYS.has(key)) unknown.push(`${name}.${key}`);
          }
          for (const key of Object.keys(entry.hooks ?? {})) {
            if (!DELEGATE_HOOK_KEYS.has(key)) unknown.push(`${name}.hooks.${key}`);
          }
        }
        expect(
          unknown,
          `${path}: atoma refuses a tools file with a key it does not know, and the symptom is ` +
            "that no sub-run server starts at all",
        ).toEqual([]);
      });

      test("every server starts a bundled program that exists", () => {
        for (const [name, entry] of Object.entries(parsed.servers ?? {})) {
          expect(entry.command, `${path}: ${name}.command must be \`bun\``).toBe("bun");
          expect(Array.isArray(entry.args), `${path}: ${name}.args must be a list`).toBe(true);
          for (const arg of entry.args as unknown[]) {
            expect(typeof arg, `${path}: ${name}.args entries must all be strings`).toBe("string");
          }
          const script = sourceScriptOf(entry.args);
          expect(
            script,
            `${path}: ${name} must start one of this tree's programs — its args carry the deployed ` +
              "path under ATOMATON_MACHINERY_ROOT, resolved through the layout table",
          ).toBeDefined();
          expect(
            existsSync(script!),
            `${path}: ${name} starts ${script}, which does not exist in the source tree`,
          ).toBe(true);
        }
      });

      /**
       * The assertion the file header is about. Exactly `true`: `false`, a string,
       * or a missing key all leave the core prefixing tool names, and a bare
       * allowlist pattern then matches nothing.
       */
      test("every server publishes its tools under bare names", () => {
        for (const [name, entry] of Object.entries(parsed.servers ?? {})) {
          expect(
            entry.unprefixed,
            `${path}: ${name} must set \`unprefixed: true\`. The sub-run's tools are promised under ` +
              "their own names, and a bare tool_allowlist pattern is matched against the name the " +
              "sub-run calls the tool by — without this setting it is `server__tool` and no bare " +
              "pattern matches.",
          ).toBe(true);
        }
      });
    });
  }

  test("the roster offers at least one delegate, so this file checks something", () => {
    expect(FOLDERS.length, "delegates.yaml offers no folders").toBeGreaterThan(0);
  });
});
