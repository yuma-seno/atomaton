/**
 * delegate-tool-sets.test.ts — the four delegate tools files, held to the tool sets
 * their sub-runs are promised.
 *
 * ## Why this exists beside the checks that already read these files
 *
 * `agent-definitions.test.ts` checks that a folder's `agent.md` and `tools.yaml` name
 * the same servers, and `resolveRoster` checks it again where a sub-run starts. What
 * neither can see is the set of TOOLS the sub-run ends up holding, and for the
 * read-only pair that set is the whole promise: `files_readonly` is the same program
 * as `files`, so the allowlist is everything that separates a sub-run that may write
 * from one that may not. An allowlist entry deleted, or `unprefixed: true` lost from
 * a server entry, changes that set and leaves no dead pattern behind — the measured
 * shape of the second loss is a sub-run that refuses every tool it is offered. See
 * the section of the same name in `domain/machinery/delegates.ts`.
 *
 * ## The direction of the comparison
 *
 * `EXACT_DELEGATE_TOOL_SETS` is the authority and the YAML is what is checked against
 * it — never the reverse, for the reason `exact-tool-sets.test.ts` states for the
 * shipped servers: an expectation computed from `tool_allowlist` would move with
 * every edit to it, and a comparison that moves with the defect passes over it.
 *
 * ## What is modelled here
 *
 * The name the sub-run's model calls a tool by, and the allowlist applied to it.
 * A pattern is matched against that name, so the effective set is each server's
 * provided tools, narrowed by its allowlist and published bare or `server__`-prefixed
 * according to `unprefixed` — which is the one model under which the shipped
 * configuration works and a missing `unprefixed` refuses everything.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EXACT_DELEGATE_TOOL_SETS,
  delegateToolName,
  type DelegateToolSet,
} from "../../src/domain/machinery/delegates.ts";

const DELEGATES_DIR = join(process.cwd(), "src/content/delegates");

interface ShippedServer {
  command?: string;
  args?: unknown;
  unprefixed?: boolean;
  hooks?: { tool_allowlist?: string[] };
}

function delegateServers(delegate: string): Record<string, ShippedServer> {
  const path = join(DELEGATES_DIR, delegate, "tools.yaml");
  const parsed = Bun.YAML.parse(readFileSync(path, "utf8").replaceAll("\r\n", "\n")) as {
    watch?: Record<string, unknown>;
    servers?: Record<string, ShippedServer>;
  };
  return parsed.servers ?? {};
}

/**
 * The tools a sub-run holds from one server, modelled the way the core applies them:
 * provided tools narrowed by the allowlist, each published under the name
 * `unprefixed` decides it is called by.
 */
function toolsHeld(
  servers: Record<string, ShippedServer>,
  server: { server: string; provides: readonly string[] },
): string[] {
  const entry = servers[server.server];
  const allowlist = entry?.hooks?.tool_allowlist;
  const kept =
    allowlist === undefined ? [...server.provides] : server.provides.filter((tool) => allowlist.includes(tool));
  return kept.map((tool) => delegateToolName(entry?.unprefixed === true, server.server, tool));
}

describe("the tool sets the delegates hand their sub-runs", () => {
  for (const expected of EXACT_DELEGATE_TOOL_SETS) {
    describe(expected.delegate, () => {
      const servers = delegateServers(expected.delegate);

      test("its tools file names exactly the servers the promise is written over", () => {
        expect(
          Object.keys(servers).sort(),
          `${expected.delegate}/tools.yaml and delegates.ts disagree about what the sub-run is ` +
            `handed. ${expected.promise}`,
        ).toEqual(expected.servers.map((one) => one.server).sort());
      });

      /**
       * Both directions of the comparison are the two defects the table exists for:
       * an extra tool is a capability the promise does not cover, and a missing one
       * is how a server whose allowlist has gone from narrowing to forbidding turns
       * into a failure instead of a pass over an empty set.
       */
      test("the set of tools the sub-run holds is exactly the promised set", () => {
        const held = expected.servers.flatMap((one) => toolsHeld(servers, one));
        expect(
          held.sort(),
          `${expected.delegate}/tools.yaml hands its sub-run a different set than the promise. ` +
            `Held: ${JSON.stringify(held)}. ${expected.promise}`,
        ).toEqual([...expected.tools].sort());
      });

      /**
       * A pattern that matches nothing is applied as nothing — and inside an
       * allowlist, "nothing" is the whole server. Each entry must name a tool the
       * server's program actually provides, which is what keeps a rename inside the
       * program from turning the allowlist into a silent refusal of everything.
       */
      test("every allowlist pattern names a tool its server provides", () => {
        for (const one of expected.servers) {
          const allowlist = servers[one.server]?.hooks?.tool_allowlist;
          if (allowlist === undefined) continue;
          const dead = allowlist.filter((pattern) => !one.provides.includes(pattern));
          expect(
            dead,
            `${expected.delegate}/tools.yaml: ${one.server}'s tool_allowlist names ` +
              `${dead.join(", ")}, which its program (offering ${one.provides.join(", ")}) does not. ` +
              "A pattern matching nothing is applied as nothing, and inside an allowlist that is " +
              "a refusal of the whole server.",
          ).toEqual([]);
        }
      });
    });
  }

  /**
   * The premise the read-only delegates rest on, in the files themselves.
   *
   * `files_readonly` is the same program as `files`, so one allowlist is the whole
   * difference and `provides` is one list for both names. If the two ever stop
   * pointing at the same program, the allowlist stops being the thing that makes the
   * read-only delegate read-only, and the promise table needs rewriting rather than
   * adjusting.
   */
  test("delegate_readonly's files_readonly is the same program as delegate's files", () => {
    const writing = delegateServers("delegate");
    const reading = delegateServers("delegate_readonly");
    expect(reading.files_readonly?.command).toBe(writing.files?.command);
    expect(reading.files_readonly?.args).toEqual(writing.files?.args);
  });

  /**
   * The set a delegate hands its sub-run is what its caller is told it gets: the
   * tool descriptions promise bare names ("its own `grep`, `glob` and `read`"), and
   * every delegate in the table must deliver the names those sentences were written
   * against. A delegate absent from the table is a promise nobody holds — the table
   * is the only statement of the set, so a folder that skips it ships unchecked.
   */
  test("every delegate the roster offers is in the table", () => {
    const roster = Bun.YAML.parse(readFileSync(join(DELEGATES_DIR, "delegates.yaml"), "utf8")) as Record<
      string,
      string[]
    >;
    const offered = [...new Set(Object.values(roster).flat())].sort();
    const held = EXACT_DELEGATE_TOOL_SETS.map((one: DelegateToolSet) => one.delegate).sort();
    expect(
      offered,
      "delegates.yaml offers a folder the promise table does not hold. Add it to " +
        "EXACT_DELEGATE_TOOL_SETS, or its sub-run's tools ship unchecked.",
    ).toEqual(held);
  });
});
