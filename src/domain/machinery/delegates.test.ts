/**
 * delegates.test.ts — the roster, as a pure function of files that are not there.
 *
 * The rules this holds are the ones whose failure mode is a LATE one: a roster that
 * names a folder with no `agent.md` starts the server, and the fault surfaces when an
 * agent delegates, in a run nobody is watching, as a tool that would not answer.
 * Every case below is written against an in-memory tree for that reason — the point
 * is what the resolver decides, not what the shipped tree happens to contain.
 */
import { describe, expect, test } from "bun:test";
import {
  requestedServersIn,
  reportFrom,
  resolveRoster,
  serverNamesOf,
} from "./delegates.ts";

/** A filesystem of literal contents, keyed by path. */
function tree(files: Record<string, string>): {
  read: (path: string) => string;
  exists: (path: string) => boolean;
} {
  return {
    read: (path) => {
      const value = files[path];
      if (value === undefined) throw new Error(`ENOENT: ${path}`);
      return value;
    },
    exists: (path) => path in files,
  };
}

const ROSTER = "/d/delegates.yaml";

/** The two files of one folder, so a case only has to say what it varies. */
function folder(
  files: Record<string, string>,
  name: string,
  servers: string[],
): Record<string, string> {
  return {
    ...files,
    [`/d/${name}/agent.md`]: `---\nname: ${name}\nmcp_servers:\n${servers.map((s) => `  - ${s}`).join("\n")}\n---\nbody\n`,
    [`/d/${name}/tools.yaml`]: `watch: {}\nservers:\n${servers.map((s) => `  ${s}:\n    command: bun`).join("\n")}\n`,
  };
}

describe("resolveRoster", () => {
  test("resolves a folder to the two files it must have", () => {
    const files = folder({ [ROSTER]: "delegate:\n  - one\n" }, "one", ["files"]);
    const { defs, problems } = resolveRoster(ROSTER, tree(files).read, tree(files).exists);
    expect(problems).toEqual([]);
    expect(defs).toEqual([
      { name: "one", server: "delegate", agentFile: "/d/one/agent.md", toolsFile: "/d/one/tools.yaml" },
    ]);
  });

  test("names the missing file when a folder is incomplete", () => {
    const files = folder({ [ROSTER]: "delegate:\n  - one\n" }, "one", ["files"]);
    delete files["/d/one/tools.yaml"];
    const { defs, problems } = resolveRoster(ROSTER, tree(files).read, tree(files).exists);
    expect(defs).toEqual([]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("/d/one/tools.yaml");
    expect(problems[0]).toContain("delegate: one");
  });

  test("refuses when the definition and its tools file name different servers", () => {
    const files = folder({ [ROSTER]: "delegate:\n  - one\n" }, "one", ["files"]);
    // The tools file declares something the definition did not ask for. Atoma would
    // drop it silently; this is where that becomes a refusal.
    files["/d/one/tools.yaml"] = "watch: {}\nservers:\n  files:\n    command: bun\n  shell:\n    command: bun\n";
    const { problems } = resolveRoster(ROSTER, tree(files).read, tree(files).exists);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("[files]");
    expect(problems[0]).toContain("[files, shell]");
  });

  test("refuses two servers that offer one folder, because that is two tools of one name", () => {
    const files = folder(
      { [ROSTER]: "delegate:\n  - one\ndelegate_readonly:\n  - one\n" },
      "one",
      ["files"],
    );
    const { defs, problems } = resolveRoster(ROSTER, tree(files).read, tree(files).exists);
    expect(defs).toHaveLength(2);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("both");
  });

  test("a folder nobody lists is not a problem", () => {
    // A folder being written, or kept for reference, is an ordinary state. A warning
    // here would fire on every run of a project that has one, which is how a warning
    // stops being read.
    const files = folder(
      folder({ [ROSTER]: "delegate:\n  - one\n" }, "one", ["files"]),
      "draft",
      ["files"],
    );
    const { defs, problems } = resolveRoster(ROSTER, tree(files).read, tree(files).exists);
    expect(problems).toEqual([]);
    expect(defs.map((d) => d.name)).toEqual(["one"]);
  });

  test("refuses a server whose entry is not a list of names", () => {
    const files = { [ROSTER]: "delegate: one\n" };
    const { problems } = resolveRoster(ROSTER, tree(files).read, tree(files).exists);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("must be a list of folder names");
  });

  test("refuses a roster that is not valid YAML, and names the file", () => {
    const files = { [ROSTER]: "delegate: [one\n" };
    const { problems } = resolveRoster(ROSTER, tree(files).read, tree(files).exists);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(ROSTER);
  });

  test("keeps roster order, so the tools are offered in the order a person wrote them", () => {
    const files = folder(
      folder({ [ROSTER]: "delegate:\n  - second\n  - first\n" }, "first", ["files"]),
      "second",
      ["files"],
    );
    const { defs } = resolveRoster(ROSTER, tree(files).read, tree(files).exists);
    expect(defs.map((d) => d.name)).toEqual(["second", "first"]);
  });
});

describe("requestedServersIn", () => {
  test("reads the list, ignoring comments and the keys around it", () => {
    const text = [
      "---",
      "name: one",
      "extra_headers:",
      "  X-Session: one",
      "mcp_servers:",
      "  # why this one",
      "  - files  # and this is the server",
      "  - shell",
      "knows_about: []",
      "---",
      "body",
    ].join("\n");
    expect(requestedServersIn(text)).toEqual(["files", "shell"]);
  });

  test("a file with no frontmatter asks for nothing", () => {
    expect(requestedServersIn("just a body\n")).toEqual([]);
  });

  test("a definition with no mcp_servers asks for nothing", () => {
    expect(requestedServersIn("---\nname: one\n---\nbody\n")).toEqual([]);
  });
});

describe("serverNamesOf", () => {
  test("takes the server keys and not the core's own", () => {
    expect(serverNamesOf({ hooks: { tool_allowlist: ["read"] }, files: {}, shell: {} })).toEqual([
      "files",
      "shell",
    ]);
  });

  test("an empty file declares nothing", () => {
    expect(serverNamesOf({ watch: {} })).toEqual([]);
  });
});

/**
 * A sub-run that produced no report, and what the caller is told about it.
 *
 * The caller holds only this text, so what it omits is what the caller cannot find
 * out. Two omissions were defects rather than brevity:
 *
 *   - the sub-run's stderr was discarded, so a provider refusal, a missing tool
 *     server and a crash all read as one word, `failed`;
 *   - the advice named a timeout on an ending with zero iterations, where nothing
 *     timed out — which is the wrong lesson to take from a free-tier refusal.
 */
describe("reportFrom", () => {
  test("a completed sub-run's own text is returned as it stands", () => {
    expect(reportFrom({ response: "  the answer  " })).toBe("the answer");
  });

  test("a failure carries what the sub-run printed on stderr", () => {
    const text = reportFrom(
      { response: null, ended_because: "failed", seconds: 1, iterations: 0 },
      "error: prompt exceeds the free tier's per-request cap (41234 > 16384)\n",
    );
    expect(text).toContain("prompt exceeds the free tier's per-request cap");
  });

  /**
   * The distinction the summary used to lose. Zero iterations means the sub-run
   * never reached a model, so no limit was hit and the task's size is not the
   * answer — the caller is told to do the work here, not to narrow the task.
   */
  test("zero iterations points at the delegate rather than at the task's size", () => {
    const text = reportFrom({ response: null, ended_because: "failed", seconds: 0, iterations: 0 });
    expect(text).not.toContain("needs longer than the sub-run's limit");
    expect(text).toContain("never reached a model");
  });

  test("an ending after real work keeps the time-limit advice", () => {
    const text = reportFrom({ response: null, ended_because: "runtime", seconds: 600, iterations: 12 });
    expect(text).toContain("needs longer than the sub-run's limit");
  });

  test("names the exit code when there was one", () => {
    const text = reportFrom({ response: null, ended_because: "failed", iterations: 0 }, "", 3);
    expect(text).toContain("exit 3");
  });
});
