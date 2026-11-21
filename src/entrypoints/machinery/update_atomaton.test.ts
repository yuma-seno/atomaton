import { afterAll, describe, expect, test } from "bun:test";
import { crc32 } from "node:zlib";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { NOTICE_MARKER } from "./notify_new_release.ts";
import { updateBranchFor, updateTitle } from "./update_atomaton.ts";
import { RELEASE_MANIFEST } from "../../domain/machinery/machinery-layout.ts";
import { ASSET_NAME } from "./notify_new_release.ts";
import { removeTemp, runWithFakeGh, scriptPath, hermeticEnv, type FakeGhRule } from "./testing/harness.ts";

/**
 * The update, end to end against a real git repository and a fake `gh`.
 *
 * Everything the script does is either a write into a tree, a git command, or a
 * `gh` call — so the fixture is all three: a checkout whose files exist, an origin
 * that is a real bare repository the push can land in (measured afterwards by
 * asking the bare repo for the branch), and a `gh` that answers the reads the run
 * makes. Nothing about the push or the commit is mocked; only GitHub's API is.
 */

/** Temp directories this file made, removed in one place rather than at every call site. */
const MADE: string[] = [];
afterAll(() => {
  for (const dir of MADE) removeTemp(dir);
});

function temp(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  MADE.push(dir);
  return dir;
}

/** A tree's files beyond the manifest itself. */
type Tree = Record<string, string>;

const CHECK = ".github/workflows/atomaton-check.yml";
const GONE = ".github/workflows/atomaton-gone.yml";
const BASE_FILES: Tree = { [CHECK]: "check: one\n", [GONE]: "gone: one\n" };
const TARGET_FILES: Tree = { [CHECK]: "check: two\n" };
const UPSTREAM_REPO = "yuma-seno/atomaton";

const manifestJson = (version: string, files: string[]): string =>
  JSON.stringify({ version, files: [RELEASE_MANIFEST, ...files] });

/** One zip archive of `entries` plus the manifest naming them, as the release carries them. */
function zipOf(name: string, version: string, entries: Tree): string {
  const listed = Object.keys(entries);
  const members = new Map<string, string>([
    [RELEASE_MANIFEST, `${manifestJson(version, listed)}\n`],
    ...Object.entries(entries),
  ]);
  const bytes: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const [entry, content] of members) {
    const data = Buffer.from(content, "utf8");
    const nameBytes = Buffer.from(entry, "utf8");
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(crc32(data), 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    bytes.push(local, nameBytes, data);
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt32LE(crc32(data), 16);
    header.writeUInt32LE(data.length, 20);
    header.writeUInt32LE(data.length, 24);
    header.writeUInt16LE(nameBytes.length, 28);
    header.writeUInt32LE(offset, 42);
    central.push(header, nameBytes);
    offset += local.length + nameBytes.length + data.length;
  }
  const directory = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(members.size, 8);
  eocd.writeUInt16LE(members.size, 10);
  eocd.writeUInt32LE(directory.length, 12);
  eocd.writeUInt32LE(offset, 16);
  const path = join(temp("update-asset-"), name);
  writeFileSync(path, Buffer.concat([...bytes, directory, eocd]));
  return path;
}

/** `git` in `dir`, throwing when it fails — the fixtures must stand, not degrade. */
function gitIn(dir: string, args: string[]): string {
  const r = spawnSync("git", args, { cwd: dir, encoding: "utf8", env: hermeticEnv() });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr}`);
  return r.stdout;
}

/**
 * A checkout standing in for the adopted tree: the manifest and its files
 * committed on `main`, with a bare repository as `origin` the push can reach.
 */
function fixtureRepo(entries: Tree, version: string): { dir: string; bare: string } {
  const dir = temp("update-repo-");
  for (const [path, content] of Object.entries(entries)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  mkdirSync(dirname(join(dir, RELEASE_MANIFEST)), { recursive: true });
  writeFileSync(join(dir, RELEASE_MANIFEST), `${manifestJson(version, Object.keys(entries))}\n`);
  gitIn(dir, ["-c", "init.defaultBranch=main", "init"]);
  gitIn(dir, ["add", "-A"]);
  gitIn(dir, ["-c", "user.name=fixture", "-c", "user.email=fixture@example.test", "commit", "-m", "seed"]);
  const bare = join(temp("update-origin-"), "origin.git");
  gitIn(dir, ["clone", "--bare", "--quiet", dir, bare]);
  gitIn(dir, ["remote", "add", "origin", bare]);
  return { dir, bare };
}

/** The branch's tip in the bare origin, or null when it was never pushed. */
function pushedTip(bare: string, branch: string): string | null {
  const r = spawnSync("git", ["--git-dir", bare, "rev-parse", `refs/heads/${branch}`], {
    encoding: "utf8",
    env: hermeticEnv(),
  });
  return r.status === 0 ? r.stdout.trim() : null;
}

/**
 * The `gh` answers an update run makes, in the order the rules must stand.
 *
 * Order is load-bearing: the run's PR body QUOTES the words its own calls are
 * matched by ("merge" appears throughout a body), so a specific rule must come
 * before a loose one — `pr create` before `pr merge`, `issue close` before
 * `issue comment` (a close carries a `--comment` flag).
 */
function rules(
  latest: string,
  options: {
    base?: Tree;
    target?: Tree;
    baseTag?: string;
    downloadFail?: "base" | "target" | "both";
    openPr?: number;
    notice?: number;
    defaultBranch?: string;
  } = {},
): FakeGhRule[] {
  const baseTag = options.baseTag ?? "v0.1.0";
  const fail = options.downloadFail;
  const download = (tag: string, entries: Tree): FakeGhRule =>
    fail === "both" || fail === (tag === baseTag ? "base" : "target")
      ? { match: [tag, "release", "download", "-D"], code: 1, stdout: "no such asset" }
      : {
          match: [tag, "release", "download", "-D"],
          writes: [{ name: ASSET_NAME, from: zipOf(`${tag}.zip`, tag, entries) }],
        };
  return [
    { match: [`repos/${UPSTREAM_REPO}/releases/latest`], stdout: latest },
    download(baseTag, options.base ?? BASE_FILES),
    download(latest, options.target ?? TARGET_FILES),
    { match: [`repos/owner/repo`], stdout: options.defaultBranch ?? "main" },
    { match: ["pr", "list"], stdout: JSON.stringify(options.openPr ? [{ number: options.openPr }] : []) },
    { match: ["pr", "create"], stdout: `https://example.test/owner/repo/pull/9` },
    { match: ["pr", "edit"], stdout: "" },
    { match: ["pr", "merge"], stdout: "" },
    {
      match: ["issue", "list"],
      stdout: JSON.stringify(
        options.notice
          ? [{ number: options.notice, state: "OPEN", body: `${NOTICE_MARKER}\nTemplate release v0.1.0 is available.` }]
          : [],
      ),
    },
    { match: ["issue", "close"], stdout: "" },
    { match: ["issue", "comment"], stdout: "" },
  ];
}

const run = (
  dir: string,
  extraArgs: string[] = [],
  env: Record<string, string> = {},
  options: { notice?: number } = {},
) =>
  runWithFakeGh(scriptPath("update_atomaton.ts"), ["--repo", "owner/repo", ...extraArgs], {
    cwd: dir,
    rules: rules("v0.2.0", options),
    env,
  });

describe("a run that cannot start", () => {
  test("no token is a red run that touches nothing", () => {
    const { dir } = fixtureRepo(BASE_FILES, "v0.1.0");
    const r = run(dir, [], { ATOMATON_UPDATE_TOKEN: "" });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("ATOMATON_UPDATE_TOKEN");
    expect(r.ghCalls.filter((call) => call[0] === "pr" || call[0] === "issue")).toEqual([]);
  });

  test("a dirty working tree is refused before anything is written", () => {
    const { dir, bare } = fixtureRepo(BASE_FILES, "v0.1.0");
    writeFileSync(join(dir, CHECK), "a person's uncommitted edit\n");
    const r = run(dir, [], { ATOMATON_UPDATE_TOKEN: "tok" });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("not clean");
    expect(r.ghCalls.filter((call) => call[0] === "pr")).toEqual([]);
    expect(pushedTip(bare, updateBranchFor("v0.2.0"))).toBeNull();
  });

  test("a checkout with no manifest is refused, rather than reading as up to date", () => {
    const bare = temp("update-bare-nothing-");
    const r = run(bare, [], { ATOMATON_UPDATE_TOKEN: "tok" });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("cannot say which release it came from");
  });

  test("an unreadable target release is a red run, not an empty one", () => {
    const { dir } = fixtureRepo(BASE_FILES, "v0.1.0");
    const r = runWithFakeGh(scriptPath("update_atomaton.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      env: { ATOMATON_UPDATE_TOKEN: "tok" },
      rules: rules("v0.2.0", { downloadFail: "target" }),
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("the target release (v0.2.0) could not be read");
    expect(r.ghCalls.filter((call) => call[0] === "pr")).toEqual([]);
  });
});

describe("a run that is already settled", () => {
  test("the tree is on the release asked for: nothing is done, nothing is called", () => {
    const { dir } = fixtureRepo(BASE_FILES, "v0.2.0");
    const r = run(dir, [], { ATOMATON_UPDATE_TOKEN: "tok" });
    expect(r.status).toBe(0);
    // The one read it makes is the latest release's tag; no write follows.
    expect(r.ghCalls.filter((call) => call[0] === "pr" || call[0] === "issue")).toEqual([]);
  });
});

describe("a clean update", () => {
  test("applies the plan, pushes the branch, opens the pull request, asks for the merge", () => {
    const { dir, bare } = fixtureRepo(BASE_FILES, "v0.1.0");
    const r = run(dir, [], { ATOMATON_UPDATE_TOKEN: "tok" });
    expect(r.status).toBe(0);

    // The tree now holds the target's content, and the dropped file is gone.
    expect(readFileSync(join(dir, CHECK), "utf8")).toBe("check: two\n");
    expect(existsSync(join(dir, GONE))).toBe(false);

    // The branch reached the origin, and its commit is the machinery's.
    expect(pushedTip(bare, updateBranchFor("v0.2.0"))).not.toBeNull();

    const created = r.ghCalls.filter((call) => call[0] === "pr" && call[1] === "create");
    expect(created).toHaveLength(1);
    const create = created[0] ?? [];
    expect(create).toContain("--head");
    expect(create).toContain(updateBranchFor("v0.2.0"));
    expect(create).toContain(updateTitle("v0.2.0"));

    const merged = r.ghCalls.filter((call) => call[0] === "pr" && call[1] === "merge");
    expect(merged).toHaveLength(1);
    expect(merged[0]).toContain("--auto");
  });

  test("a notice standing open is closed, with the pull request named", () => {
    const { dir } = fixtureRepo(BASE_FILES, "v0.1.0");
    const r = run(dir, [], { ATOMATON_UPDATE_TOKEN: "tok" }, { notice: 12 });
    expect(r.status).toBe(0);
    const closed = r.ghCalls.filter((call) => call[0] === "issue" && call[1] === "close");
    expect(closed).toHaveLength(1);
    const close = closed[0] ?? [];
    expect(close).toContain("12");
    const comment = close[close.indexOf("--comment") + 1] ?? "";
    expect(comment).toContain(NOTICE_MARKER);
    expect(comment).toContain("#9");
  });

  test("the pull request body reports the plan, and the leftovers it did not touch", () => {
    const { dir } = fixtureRepo(BASE_FILES, "v0.1.0");
    const r = run(dir, [], { ATOMATON_UPDATE_TOKEN: "tok" });
    expect(r.status).toBe(0);
    const body = (r.ghCalls.find((call) => call[0] === "pr" && call[1] === "create") ?? [])[
      (r.ghCalls.find((call) => call[0] === "pr" && call[1] === "create") ?? []).indexOf("--body") + 1
    ] ?? "";
    expect(body).toContain("the update applies itself");
    expect(body).toContain(`\`${GONE}\``);
  });
});

describe("a stopped update", () => {
  /**
   * The file both sides changed: the machinery applies the whole plan, commits it
   * with markers where the collision is, and opens the pull request WITHOUT asking
   * for the merge — the stop is the design, and the report is the deliverable.
   */
  test("the pull request stands, the merge is not requested, and the thread is told where", () => {
    const { dir } = fixtureRepo({ ...BASE_FILES, [CHECK]: "check: customised by the adopter\n" }, "v0.1.0");
    const r = run(dir, [], { ATOMATON_UPDATE_TOKEN: "tok" }, { notice: 12 });
    expect(r.status).toBe(0);

    const created = r.ghCalls.filter((call) => call[0] === "pr" && call[1] === "create");
    expect(created).toHaveLength(1);
    expect(r.ghCalls.filter((call) => call[0] === "pr" && call[1] === "merge")).toEqual([]);

    const body = (created[0] ?? [])[(created[0] ?? []).indexOf("--body") + 1] ?? "";
    expect(body).toContain("needs a decision");
    expect(body).toContain(`\`${CHECK}\``);

    // The markers live in the committed file, not in the body — that is what an
    // agent resolving on the pull request sees, named by both sides.
    const collided = readFileSync(join(dir, CHECK), "utf8");
    expect(collided).toContain("<<<<<<<");
    expect(collided).toContain("(ours)");
    expect(collided).toContain("(theirs)");

    const comments = r.ghCalls.filter((call) => call[0] === "issue" && call[1] === "comment");
    expect(comments).toHaveLength(1);
    const comment = (comments[0] ?? [])[(comments[0] ?? []).indexOf("--body") + 1] ?? "";
    expect(comment).toContain(`\`${CHECK}\``);
    expect(comment).toContain("#9");
    expect(comment).toContain("nothing merges until someone does");
  });

  test("a run that came from a thread answers that thread too", () => {
    const { dir } = fixtureRepo({ ...BASE_FILES, [CHECK]: "customised\n" }, "v0.1.0");
    const r = run(dir, ["--source", "31"], { ATOMATON_UPDATE_TOKEN: "tok" }, { notice: 12 });
    expect(r.status).toBe(0);
    const comments = r.ghCalls.filter((call) => call[0] === "issue" && call[1] === "comment");
    // One to the notice, one to the thread that asked.
    expect(comments).toHaveLength(2);
    const toSource = (comments[1] ?? [])[(comments[1] ?? []).indexOf("--body") + 1] ?? "";
    expect(toSource).toContain("stopped at a pull request");
  });
});

describe("an update that is nothing but a name", () => {
  test("a target whose contents match the tree's release changes nothing and opens nothing", () => {
    const { dir, bare } = fixtureRepo(BASE_FILES, "v0.1.0");
    // The target zip's manifest names the same release the tree came from, so the
    // plan is empty however the tag is spelled.
    const r = runWithFakeGh(scriptPath("update_atomaton.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      env: { ATOMATON_UPDATE_TOKEN: "tok" },
      rules: [
        { match: ["repos/yuma-seno/atomaton/releases/latest"], stdout: "v0.2.0" },
        { match: ["v0.1.0", "release", "download", "-D"], writes: [{ name: ASSET_NAME, from: zipOf("base.zip", "v0.1.0", BASE_FILES) }] },
        { match: ["v0.2.0", "release", "download", "-D"], writes: [{ name: ASSET_NAME, from: zipOf("target.zip", "v0.1.0", BASE_FILES) }] },
        { match: ["repos/owner/repo"], stdout: "main" },
      ],
    });
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((call) => call[0] === "pr" || call[0] === "issue")).toEqual([]);
    expect(pushedTip(bare, updateBranchFor("v0.2.0"))).toBeNull();
  });
});
