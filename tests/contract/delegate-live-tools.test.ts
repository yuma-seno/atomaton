/**
 * delegate-live-tools.test.ts — the programs the delegate tools files name, asked
 * what they actually offer.
 *
 * ## Why a live server, when two static tests already read the files
 *
 * `atoma validate --with-live-tools` resolves every agent definition against the
 * tools file written for that run, out of `tools/defaults.yaml` and the project's
 * config. The delegate folders' own tools files are invisible to it, and so is the
 * question they rest on: does the program a delegate names still offer the tools the
 * promise table says it does? A tool renamed or dropped inside `mcp/files.ts` leaves
 * every static check green — the files still say `grep` — and hands the sub-run a
 * set no table describes. So this asks the server itself, the way a sub-run's core
 * does: one `tools/list` per program.
 *
 * ## The direction of the comparison
 *
 * The expectation is `EXACT_DELEGATE_TOOL_SETS`, never the server's own source: a
 * check that read the `defineMcpTool` calls out of `files.ts` would agree with
 * whatever the server had become, which is the one comparison worth nothing. The
 * table changes together with the program, and the tools files with both.
 *
 * One program, started once: `files` and `files_readonly` are the same script, and
 * the four entries that name it are checked against a single answer.
 */
import { describe, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { EXACT_DELEGATE_TOOL_SETS } from "../../src/domain/machinery/delegates.ts";
import { hermeticEnv } from "../../src/entrypoints/machinery/testing/harness.ts";

const DELEGATES_DIR = join(process.cwd(), "src/content/delegates");
const ROOT_PREFIX = "${ATOMATON_MACHINERY_ROOT:-.}/";

/** The source file a server entry starts, from the same resolution the static tests use. */
function sourceScriptOf(args: unknown): string | undefined {
  if (!Array.isArray(args)) return undefined;
  for (const arg of args.map(String)) {
    if (!arg.startsWith(ROOT_PREFIX)) continue;
    const deployed = arg.slice(ROOT_PREFIX.length);
    // The delegate servers run programs from the runtime tools directory; the source
    // of that tree is `src/entrypoints/tools/`, read here by its own name rather than
    // through the layout table, because the path is also what this test spawns.
    const file = deployed.replace(/^\.github\/atomaton-runtime\/tools\//, "src/entrypoints/tools/");
    return file.endsWith(".ts") ? file : undefined;
  }
  return undefined;
}

/**
 * Send one JSON-RPC request to a server and resolve its first response line.
 *
 * The same shape `mcp.test.ts` uses, for the same reason: a server answers
 * `tools/list` without an `initialize` first, and the first stdout line is the
 * answer. Spawned with `hermeticEnv()` so a run inside an agent run does not hand
 * the child the run's own variables.
 */
function sendRequest(script: string, request: Record<string, unknown>, timeoutMs = 15_000): Promise<any> {
  return new Promise((resolve, reject) => {
    const child = spawn("bun", ["run", script], {
      env: { ...hermeticEnv(), GITHUB_REPOSITORY: "owner/repo" },
      cwd: process.cwd(),
    });
    let out = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`timed out waiting for response from ${script}`));
    }, timeoutMs);
    child.stdout.on("data", () => {
      const line = out.split("\n").find((l) => l.trim());
      if (line) {
        clearTimeout(timer);
        child.kill();
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          reject(e);
        }
      }
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.stdin.write(JSON.stringify(request) + "\n");
  });
}

/** Every server the promise table covers, with the program its tools file names. */
const ENTRIES: { script: string; delegate: string; server: string; provides: readonly string[] }[] = [];
for (const expected of EXACT_DELEGATE_TOOL_SETS) {
  const parsed = Bun.YAML.parse(
    readFileSync(join(DELEGATES_DIR, expected.delegate, "tools.yaml"), "utf8"),
  ) as { servers?: Record<string, { args?: unknown }> };
  for (const one of expected.servers) {
    const script = sourceScriptOf(parsed.servers?.[one.server]?.args);
    if (script === undefined) {
      throw new Error(
        `${expected.delegate}/tools.yaml: ${one.server} does not name a bundled server script, ` +
          "so there is nothing live to ask. Fix the tools file; the static checks own that failure.",
      );
    }
    ENTRIES.push({ script, delegate: expected.delegate, server: one.server, provides: one.provides });
  }
}

/** The distinct programs, each with every table entry that names it. */
const BY_SCRIPT = new Map<string, typeof ENTRIES>();
for (const entry of ENTRIES) {
  const list = BY_SCRIPT.get(entry.script) ?? [];
  list.push(entry);
  BY_SCRIPT.set(entry.script, list);
}

describe("the programs behind the delegate tools files", () => {
  for (const [script, list] of BY_SCRIPT) {
    test(
      `${script} offers what the promise table says`,
      async () => {
        const r = await sendRequest(script, { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
        const live = ((r?.result?.tools ?? []) as { name?: string }[])
          .map((tool) => tool.name ?? "")
          .filter(Boolean)
          .sort();
        expect(live.length, `${script} advertised no tools at all`).toBeGreaterThan(0);

        for (const { delegate, server, provides } of list) {
          expect(
            live,
            `${delegate}'s ${server} is served by ${script}, and the promise table says it offers ` +
              `[${provides.join(", ")}]. ${script} advertised [${live.join(", ")}]. Change ` +
              "EXACT_DELEGATE_TOOL_SETS together with the program, and the tools files with both — " +
              "an allowlist pattern naming a tool the program dropped refuses the whole server.",
          ).toEqual([...provides].sort());
        }
      },
      30_000,
    );
  }
});
