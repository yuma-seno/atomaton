/**
 * hardened-servers.test.ts — the list in `docs/tools/boundaries.md` of the servers
 * that harden themselves, held to the servers that actually do.
 *
 * ## Why this exists
 *
 * The page is prose and the call is code, and nothing connected the two. At the
 * commit this was written on the list named five servers, `atoma` among them — a
 * name no entry in `defaults.yaml` has ever had — while seven of the shipped
 * programs call `hardenCredentialHolder` at startup. `files` has called it since the
 * initial commit and was named by no version of that list; `attachments` was added
 * and never added to it. A reader has no reason to run the grep that would notice,
 * so a drift here ships.
 *
 * ## What is read
 *
 * `defaults.yaml` says which servers ship and which program each starts; `src/` says
 * which programs harden. Both directions are then required of the page: every program
 * that hardens is named, and nothing is named whose program does not.
 *
 * The comparison is over **programs, not names**, because three pairs of entries are
 * one program started twice — `files`/`files_readonly`, `atomaton`/`atomaton_env`,
 * `delegate`/`delegate_readonly`. A name is accepted if the program it starts hardens,
 * so either entry of a pair is a true statement about what the run does, and what is
 * refused is a name that hardens nothing.
 *
 * `files` is also why the `env` blocks are the wrong thing to read. It declares
 * `env: {}` and hardens anyway: hardening does not depend on holding a credential,
 * because a server that ships here makes itself unreadable whether or not its own
 * `env` names anything — `web` is the other one. A rule written from the credentials
 * would be wrong in both directions.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { toolDefaults } from "../../src/domain/machinery/shipped-servers.ts";
import { TOOLS_DIR, sourceOf } from "../../src/domain/machinery/machinery-layout.ts";

const PAGE = "docs/tools/boundaries.md";

/** The subject of the paragraph the list is in, on the page. */
const MARKER = "Credentials in the servers this project ships";

/** How a program that hardens calls it. `tools/lib/harden.ts` owns the function. */
const HARDEN_CALL = /^\s*hardenCredentialHolder\(/m;

/** What a server entry's `args` names, wherever the machinery tree is rooted. */
const PREFIX = "${ATOMATON_MACHINERY_ROOT:-.}/";

/**
 * The source file a server entry starts, or `undefined` when the entry runs something
 * that is not a script of ours — which is every server a project adds.
 */
function sourceScriptOf(args: unknown): string | undefined {
  if (!Array.isArray(args)) return undefined;
  for (const arg of args.map(String)) {
    if (!arg.startsWith(PREFIX)) continue;
    const deployed = arg.slice(PREFIX.length);
    // Through the layout table rather than by splicing the deployed path into `src/`:
    // the two trees' names have nothing in common, which is what `BUILT_FROM` is for.
    if (!deployed.startsWith(`${TOOLS_DIR}/`)) continue;
    return join("src", sourceOf(TOOLS_DIR), deployed.slice(TOOLS_DIR.length + 1));
  }
  return undefined;
}

/**
 * The shipped servers, grouped by the program each starts.
 *
 * A group is what the page has to name one of: `files` and `files_readonly` run the
 * same file, so a reader told `files` alone is told nothing false, while a page that
 * named only `files_readonly` would leave the server an agent reads files with
 * unmentioned.
 */
function shippedServers(): { script: string; names: string[]; hardens: boolean }[] {
  const groups = new Map<string, { script: string; names: string[]; hardens: boolean }>();
  for (const [name, server] of Object.entries(toolDefaults().servers)) {
    const script = sourceScriptOf(server.args);
    if (script === undefined) continue;
    let group = groups.get(script);
    if (group === undefined) {
      group = { script, names: [], hardens: HARDEN_CALL.test(readFileSync(script, "utf8")) };
      groups.set(script, group);
    }
    group.names.push(name);
  }
  return [...groups.values()];
}

/**
 * The server names the page's list holds, in the order it writes them.
 *
 * The paragraph and not the page: `docs/tools/boundaries.md` backticks a dozen other
 * names, and reading those would make the check mean nothing.
 */
function listedServers(page: string): string[] {
  const start = page.indexOf(MARKER);
  if (start < 0) return [];
  // Either line ending: the pages are written by whichever checkout produced them
  // (git's autocrlf makes the working copy CRLF on Windows), and `\n\n` finds
  // nothing in a CRLF file -- the "paragraph" then ran to the end of the page and
  // swept in every backticked word below it.
  const end = page.indexOf("\n\n", start) === -1
    ? page.indexOf("\r\n\r\n", start)
    : page.indexOf("\n\n", start);
  const paragraph = page.slice(start, end < 0 ? undefined : end);
  return [...paragraph.matchAll(/`([a-z_]+)`/g)].map(([, name]) => name!);
}

describe("the hardened servers the page lists", () => {
  const page = readFileSync(PAGE, "utf8");
  const programs = shippedServers();
  const listed = listedServers(page);

  test("there is something on each side of the comparison", () => {
    // Seven of the eight programs harden, at the commit this was written on. A floor
    // rather than the number: an eighth is a change to `defaults.yaml` and not a defect
    // here, while a walk that read nothing would make the checks below pass over an
    // empty list.
    expect(programs.filter((one) => one.hardens).length).toBeGreaterThanOrEqual(4);
    expect(
      programs.some((one) => one.names.includes("shell") && !one.hardens),
      "the walk reaches the servers, and reaches the one that does not harden",
    ).toBe(true);
    expect(listed.length, `${PAGE} has no list under "${MARKER}"`).toBeGreaterThan(0);
  });

  test("nothing is listed that does not harden", () => {
    const wrong = listed.filter((name) => !programs.some((one) => one.hardens && one.names.includes(name)));
    expect(
      wrong,
      "each of these names no shipped server whose program makes itself unreadable at startup " +
        "— a misspelling, a name that is not a server, or a server that does not harden",
    ).toEqual([]);
  });

  test("every program that hardens is named", () => {
    const named = new Set(listed);
    const missing = programs
      .filter((one) => one.hardens && !one.names.some((name) => named.has(name)))
      .map((one) => one.names.join("/"));
    expect(
      missing,
      `a server that protects itself and is not on the list in ${PAGE}. Entries sharing a ` +
        "program are one line; naming any one of them is enough",
    ).toEqual([]);
  });
});
