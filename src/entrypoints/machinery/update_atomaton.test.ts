import { afterAll, describe, expect, test } from "bun:test";
import { crc32 } from "node:zlib";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { NOTICE_MARKER } from "./notify_new_release.ts";
import { updateBranchFor, updateTitle, pushArgs } from "./update_atomaton.ts";
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
function fixtureRepo(
  entries: Tree,
  version: string,
  config = "base_branch: main\ndeploy: {}\n",
): { dir: string; bare: string } {
  const dir = temp("update-repo-");
  for (const [path, content] of Object.entries(entries)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  mkdirSync(dirname(join(dir, RELEASE_MANIFEST)), { recursive: true });
  writeFileSync(join(dir, RELEASE_MANIFEST), `${manifestJson(version, Object.keys(entries))}\n`);
  // The configuration the machinery reads in a real adopted tree. It is in
  // neither release, so the plan must never propose touching it -- a path in
  // neither release is invisible to the plan, and this is that property under a
  // file the run itself reads through another door.
  mkdirSync(dirname(join(dir, ".github/atomaton/config.yaml")), { recursive: true });
  writeFileSync(join(dir, ".github/atomaton/config.yaml"), config);
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
    // The rollup poll: the required check exists, so the wait ends on its first
    // attempt. The answer is the projection `readPullRequest` returns, not a
    // jq'd count -- the read goes through the one module that reads a pull
    // request, and the filter is this script's.
    { match: ["pr", "view"], stdout: JSON.stringify({ statusCheckRollup: [{ name: "atomaton-check" }] }) },
    { match: ["pr", "checks"], stdout: "" },
    { match: ["pr", "merge"], stdout: "" },
    {
      match: ["issue", "list", `"Atomaton release" in:title`],
      stdout: JSON.stringify(
        options.notice
          ? [{ number: options.notice, state: "OPEN", body: `${NOTICE_MARKER}\nAtomaton release v0.1.0 is available.` }]
          : [],
      ),
    },
    { match: ["issue", "close"], stdout: "" },
    { match: ["issue", "comment"], stdout: "" },
  ];
}

/**
 * The two modes, as the trees that declare them.
 *
 * `pr-agent` names `engineer`; `pr` names nobody, because nothing would be read.
 */
const PR_AGENT = "base_branch: main\ndeploy: {}\nupdate:\n  on_new_release: pr-agent\nagents:\n  on_update_conflict: engineer\n";
const PR_ONLY = "base_branch: main\ndeploy: {}\nupdate:\n  on_new_release: pr\n";

/** The id the fake `gh` answers with where the directive comment is posted. */
const DIRECTIVE_ID = 555;

/**
 * What a run for an agent on pull request #9 asks GitHub, in the order that decides it.
 *
 * The dispatch is the runner's own machinery -- target state, then the thread read
 * that proves the directive comment is visible, then the dispatch. Written as rules
 * rather than asserted from the outside because the real thing is exercised: the
 * closed-target guard and the marker check run here, and a run that skipped them
 * would pass a shallower test.
 */
function dispatchRules(): FakeGhRule[] {
  return [
    // More specific first: the comments URL contains the issue URL, and the generic
    // `issue comment` rule in `rules()` matches both.
    {
      match: ["api", "repos/owner/repo/issues/9/comments", "POST"],
      stdout: String(DIRECTIVE_ID),
    },
    {
      match: ["api", "repos/owner/repo/issues/9/comments"],
      stdout: JSON.stringify([{ id: DIRECTIVE_ID, body: "", user: { type: "Bot" } }]),
    },
    {
      match: ["api", "repos/owner/repo/issues/9"],
      stdout: JSON.stringify({ state: "open", pull_request: {}, labels: [] }),
    },
    // The dispatch itself, matched on the workflow's name as well: `workflow` and
    // `run` are short enough to appear inside a pull request BODY, and a rule that
    // answers `pr create` with this one is a test measuring itself.
    { match: ["workflow", "run", "atomaton-runner.yml"], stdout: "" },
  ];
}

const run = (
  dir: string,
  extraArgs: string[] = [],
  env: Record<string, string> = {},
  options: { notice?: number } = {},
  // Prepended, because the rules for a dispatch are MORE specific than the ones
  // above: a `gh api .../issues/9/comments` call would otherwise match the generic
  // `issue comment` rule, whose match is two substrings that argv carries inside one
  // path segment.
  extraRules: FakeGhRule[] = [],
) =>
  runWithFakeGh(scriptPath("update_atomaton.ts"), ["--repo", "owner/repo", ...extraArgs], {
    cwd: dir,
    rules: [...extraRules, ...rules("v0.2.0", options)],
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
  test("applies the plan, pushes the branch, opens the pull request, merges after the checks", () => {
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

    // The merge is the script's own, made after the checks it waited for: the
    // rollup was polled for the required check's existence, the checks were
    // watched, and the merge carries no `--auto` -- the script does not depend
    // on the repository having auto-merge enabled, because the wait is one it
    // can make itself.
    const viewed = r.ghCalls.filter((call) => call[0] === "pr" && call[1] === "view");
    expect(viewed.length).toBeGreaterThan(0);
    const watched = r.ghCalls.filter((call) => call[0] === "pr" && call[1] === "checks");
    expect(watched).toHaveLength(1);
    const merged = r.ghCalls.filter((call) => call[0] === "pr" && call[1] === "merge");
    expect(merged).toHaveLength(1);
    expect(merged[0]).not.toContain("--auto");
    // The merge is made as the update token -- the identity that opened the pull
    // request -- so its push is real, and `deploy.on_merge` runs on its own. No
    // dispatch follows a clean update: the repository's ordinary chain does the
    // deploying, the way a person's merge would.
    expect(r.ghCalls.filter((call) => call[0] === "workflow")).toEqual([]);
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
    // And this tree is on the default mode, so no agent is started for the collision:
    // the pull request standing is all the run leaves behind for whoever reads it.
    expect(r.ghCalls.filter((call) => call[0] === "workflow")).toEqual([]);

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

  /**
   * A plan with `keep` entries is clean -- nothing collided, nothing of the
   * tree's was overwritten -- and the run does not get to say "this needs a
   * decision here" and then make it. Kept paths are the plan declining to act
   * without a person, so the merge gate treats them like conflicts: the pull
   * request stands with the plan applied, and the notice stays open.
   */
  test("a clean plan with kept paths stops for a person, and says which paths", () => {
    // The keep comes from upstream ADDING a file at a path the tree already
    // holds as its own -- the plan reports the collision and writes nothing:
    // an update must not clobber an adopter's file with the release's new one.
    // Zero conflicts, one keep. (A tree-deletion keep needs the fixture's base
    // zip to know the file, which it does not when the tree lacks it.)
    const tree: Tree = { ...BASE_FILES, ".github/atomaton/adopted.md": "the adopter's own file\n" };
    const target: Tree = { ...TARGET_FILES, ".github/atomaton/adopted.md": "a file upstream started shipping\n" };
    const { dir } = fixtureRepo(tree, "v0.1.0");
    const r = runWithFakeGh(scriptPath("update_atomaton.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      env: { ATOMATON_UPDATE_TOKEN: "tok" },
      rules: rules("v0.2.0", { target, notice: 12 }),
    });
    expect(r.status).toBe(0);

    const created = r.ghCalls.filter((call) => call[0] === "pr" && call[1] === "create");
    expect(created).toHaveLength(1);
    // The stop: no merge was asked for and nothing was watched.
    expect(r.ghCalls.filter((call) => call[0] === "pr" && call[1] === "merge")).toEqual([]);
    expect(r.ghCalls.filter((call) => call[0] === "pr" && call[1] === "checks")).toEqual([]);
    // The notice is NOT closed: no merge, so its promise is unkept.
    expect(r.ghCalls.filter((call) => call[0] === "issue" && call[1] === "close")).toEqual([]);

    const body = (created[0] ?? [])[(created[0] ?? []).indexOf("--body") + 1] ?? "";
    expect(body).toContain("a decision here");
    expect(body).toContain("the plan will not touch without a person");

    // Whatever conflicted, the tree shows it, and it is not the adopted file:
    // a keep never gets markers, and the adopter's own file is still theirs.
    expect(readFileSync(join(dir, ".github/atomaton/adopted.md"), "utf8")).toBe("the adopter's own file\n");

    // The comment names the kept path and where the decision lives.
    const comments = r.ghCalls.filter((call) => call[0] === "issue" && call[1] === "comment");
    const comment = (comments[0] ?? [])[(comments[0] ?? []).indexOf("--body") + 1] ?? "";
    expect(comment).toContain("adopted.md");
    expect(comment).toContain("#9");
    expect(comment).toContain("merge by hand");
  });

  /**
   * `update.on_new_release: pr-agent`, and the collision it was configured for.
   *
   * The agent is started on the pull request itself, not on the notice: the notice is
   * where the release was announced, and the work is on the branch. Resolving markers
   * is a judgement about two edits, and the conflict is the whole input it needs.
   */
  test("`pr-agent` starts the named agent on the pull request that stopped", () => {
    const { dir } = fixtureRepo({ ...BASE_FILES, [CHECK]: "customised by the adopter\n" }, "v0.1.0", PR_AGENT);
    const r = run(dir, [], { ATOMATON_UPDATE_TOKEN: "tok" }, { notice: 12 }, dispatchRules());
    expect(r.status).toBe(0);

    // The stop is unchanged: nothing was merged and no check was watched.
    expect(r.ghCalls.filter((call) => call[0] === "pr" && call[1] === "merge")).toEqual([]);
    expect(r.ghCalls.filter((call) => call[0] === "pr" && call[1] === "checks")).toEqual([]);

    const sent = r.ghCalls.filter((call) => call[0] === "workflow");
    expect(sent, "one run, for the agent the config names").toHaveLength(1);
    expect(sent[0]).toContain("atomaton-runner.yml");
    expect(sent[0]).toContain("agent=engineer");
    expect(sent[0], "on the pull request, not the issue that announced it").toContain("type=pr");
    expect(sent[0]).toContain("number=9");

    // The directive is a comment on the pull request, and it is this dispatch's ask.
    const directive = r.ghCalls.find((call) => call[0] === "api" && call.includes("POST"));
    expect(directive, "the agent is told what to do on the thread it will read").toBeDefined();
    expect((directive ?? []).join(" ")).toContain("repos/owner/repo/issues/9/comments");

    // The notice reports what actually started, not what was meant to.
    const comments = r.ghCalls.filter((call) => call[0] === "issue" && call[1] === "comment");
    const toNotice = (comments[0] ?? [])[(comments[0] ?? []).indexOf("--body") + 1] ?? "";
    expect(toNotice).toContain("engineer");
    expect(toNotice).toContain("has been started");
  });

  /** The pull request body says an agent is coming, so a reader there is not told to go find one. */
  test("`pr-agent` writes the resolution into the pull request body as well", () => {
    const { dir } = fixtureRepo({ ...BASE_FILES, [CHECK]: "customised\n" }, "v0.1.0", PR_AGENT);
    const r = run(dir, [], { ATOMATON_UPDATE_TOKEN: "tok" }, { notice: 12 }, dispatchRules());
    const created = r.ghCalls.find((call) => call[0] === "pr" && call[1] === "create") ?? [];
    const body = created[created.indexOf("--body") + 1] ?? "";
    expect(body).toContain("engineer");
    expect(body).toContain("is started on it to resolve them");
  });

  /**
   * The conflict the agent cannot carry through: `.github/workflows/` is a path its
   * token may not write, so resolving those markers is a push GitHub rejects. The
   * machinery does not pre-sort the list — the agent is started with the whole
   * conflict and told which part is a person's — so a pull request mixing the two
   * kinds stops half-resolved rather than not at all.
   */
  test("a workflow conflict is a person's, and a mixed pull request still starts the agent", () => {
    const ORDINARY = "docs/page.md";
    const base: Tree = { ...BASE_FILES, [ORDINARY]: "the adopter's words\n" };
    const target: Tree = { ...TARGET_FILES, [ORDINARY]: "the release's words\n" };
    const { dir } = fixtureRepo(
      { ...base, [CHECK]: "customised by the adopter\n", [ORDINARY]: "the adopter's words, edited\n" },
      "v0.1.0",
      PR_AGENT,
    );
    const r = runWithFakeGh(scriptPath("update_atomaton.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      env: { ATOMATON_UPDATE_TOKEN: "tok" },
      rules: [...dispatchRules(), ...rules("v0.2.0", { base, target, notice: 12 })],
    });
    expect(r.status).toBe(0);

    // Both sides collided: one path under `.github/workflows/`, one outside it.
    expect(readFileSync(join(dir, CHECK), "utf8")).toContain("<<<<<<<");
    expect(readFileSync(join(dir, ORDINARY), "utf8")).toContain("<<<<<<<");

    // Started anyway, on the pull request: no path is withheld from what it reads.
    const sent = r.ghCalls.filter((call) => call[0] === "workflow");
    expect(sent, "one run, for the agent the config names").toHaveLength(1);
    expect(sent[0]).toContain("agent=engineer");

    const directive = r.ghCalls.find((call) => call[0] === "api" && call.includes("POST")) ?? [];
    const told = directive.find((arg) => arg.startsWith("body=")) ?? "";
    expect(told, "the agent is told where its token stops").toContain("`.github/workflows/`");
    expect(told).toContain("a person's");

    // The pull request body and the thread that asked carry the same exception.
    const created = r.ghCalls.find((call) => call[0] === "pr" && call[1] === "create") ?? [];
    expect(created[created.indexOf("--body") + 1] ?? "").toContain("`.github/workflows/`");
    const commented = r.ghCalls.filter((call) => call[0] === "issue" && call[1] === "comment")[0] ?? [];
    expect(commented[commented.indexOf("--body") + 1] ?? "").toContain("`.github/workflows/`");
  });

  /**
   * The mode is a policy for the collision, not for the command that started the run.
   * A person's `!upgrade` on a `pr-agent` repository collides exactly like the notice's
   * dispatch does, and the repository said what should happen then.
   */
  test("`pr-agent` starts the agent however the update was started", () => {
    const { dir } = fixtureRepo({ ...BASE_FILES, [CHECK]: "customised\n" }, "v0.1.0", PR_AGENT);
    const r = run(dir, ["--source", "31"], { ATOMATON_UPDATE_TOKEN: "tok" }, { notice: 12 }, dispatchRules());
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((call) => call[0] === "workflow")).toHaveLength(1);
  });

  /**
   * `pr` is the mode that stops at the pull request, and stopping there means starting
   * nobody: the whole difference between the two modes is this one dispatch.
   */
  test("`pr` leaves the same conflict for a person, and starts no agent", () => {
    const { dir } = fixtureRepo({ ...BASE_FILES, [CHECK]: "customised\n" }, "v0.1.0", PR_ONLY);
    const r = run(dir, [], { ATOMATON_UPDATE_TOKEN: "tok" }, { notice: 12 }, dispatchRules());
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((call) => call[0] === "workflow"), "no mode, no run").toEqual([]);
    expect(r.ghCalls.filter((call) => call[0] === "api" && call.includes("POST"))).toEqual([]);

    const comments = r.ghCalls.filter((call) => call[0] === "issue" && call[1] === "comment");
    const toNotice = (comments[0] ?? [])[(comments[0] ?? []).indexOf("--body") + 1] ?? "";
    expect(toNotice).toContain("nothing merges until someone does");
    expect(toNotice).not.toContain("engineer");
  });

  /**
   * A kept path is the plan declining to decide -- not a collision -- and no mode
   * starts an agent for a question the plan refused to answer.
   */
  test("`pr-agent` starts nobody for a kept path", () => {
    const tree: Tree = { ...BASE_FILES, ".github/atomaton/adopted.md": "the adopter's own file\n" };
    const target: Tree = { ...TARGET_FILES, ".github/atomaton/adopted.md": "a file upstream started shipping\n" };
    const { dir } = fixtureRepo(tree, "v0.1.0", PR_AGENT);
    const r = runWithFakeGh(scriptPath("update_atomaton.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      env: { ATOMATON_UPDATE_TOKEN: "tok" },
      rules: [...dispatchRules(), ...rules("v0.2.0", { target, notice: 12 })],
    });
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((call) => call[0] === "workflow")).toEqual([]);
  });
});

/**
 * The machinery applies a release, and `.github/atomaton/config.yaml` is the file
 * every job reads to know what to run — the checks, the setup commands, the merge
 * policy, the reach of each tool server. A collision there is still a decision only
 * a person can make, but the markers it used to be written with made the file
 * unparseable, and an unparseable config is a pull request whose checks cannot even
 * be planned and whose runs die on the way in (#668). So this file's collision is
 * reported instead of written: the tree keeps its copy, the two sides go into the
 * pull request's body, and the run still stops there.
 */
describe("an update whose own config.yaml collided", () => {
  const CONFIG = ".github/atomaton/config.yaml";
  /**
   * `pr-agent`, so a policy that WAS read would name an agent. This tree has no
   * marker on its branch to resolve, so nothing is started either way — the test
   * below pins that this is the reason, not a config nobody could read.
   */
  const CONFIG_BASE = "base_branch: main\ndeploy: {}\nupdate:\n  on_new_release: pr-agent\nagents:\n  on_update_conflict: engineer\n";
  // Both sides change the same line, so `git merge-file` collides: what the body
  // reports is a real three-way merge's output, not a hand-written fixture.
  const CONFIG_TREE = CONFIG_BASE.replace("base_branch: main", "base_branch: trunk");
  const CONFIG_TARGET = CONFIG_BASE.replace("base_branch: main", "base_branch: mainline");

  test("the pull request stands with both sides reported and this tree's copy kept", () => {
    const base: Tree = { ...BASE_FILES, [CONFIG]: CONFIG_BASE };
    const target: Tree = { ...TARGET_FILES, [CONFIG]: CONFIG_TARGET };
    const { dir } = fixtureRepo(BASE_FILES, "v0.1.0", CONFIG_TREE);
    // The manifest is a shipped path too, and this test is about the config alone:
    // standing the tree's manifest where the base release has it leaves config.yaml
    // as the only path both sides changed.
    writeFileSync(join(dir, RELEASE_MANIFEST), `${manifestJson("v0.1.0", Object.keys(base))}\n`);
    gitIn(dir, ["add", "-A"]);
    gitIn(dir, ["-c", "user.name=fixture", "-c", "user.email=fixture@example.test", "commit", "-m", "manifest"]);

    const r = runWithFakeGh(scriptPath("update_atomaton.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      env: { ATOMATON_UPDATE_TOKEN: "tok" },
      rules: [...dispatchRules(), ...rules("v0.2.0", { base, target, notice: 12 })],
    });
    expect(r.status).toBe(0);

    // The pull request exists and stops there; nothing merged itself.
    const created = r.ghCalls.filter((call) => call[0] === "pr" && call[1] === "create");
    expect(created).toHaveLength(1);
    expect(r.ghCalls.filter((call) => call[0] === "pr" && call[1] === "merge")).toEqual([]);
    expect(r.ghCalls.filter((call) => call[0] === "pr" && call[1] === "checks")).toEqual([]);

    // Both sides are in the body, which is where a person reads a diff.
    const body = (created[0] ?? [])[(created[0] ?? []).indexOf("--body") + 1] ?? "";
    expect(body).toContain("needs a decision");
    expect(body).toContain("Kept as this tree has it");
    expect(body).toContain(`<code>${CONFIG}</code>`);
    expect(body).toContain("<<<<<<< config.yaml (ours)");
    expect(body).toContain("base_branch: trunk");
    expect(body).toContain("base_branch: mainline");

    // And the committed file is the tree's own: no marker for any job to trip on.
    const committed = readFileSync(join(dir, CONFIG), "utf8");
    expect(committed).toBe(CONFIG_TREE);
    expect(committed).not.toContain("<<<<<<<");

    // `pr-agent`, and nothing on the branch carries a marker: nobody is started.
    expect(r.ghCalls.filter((call) => call[0] === "workflow")).toEqual([]);

    // The thread that asked is told where the decision is, and the notice stays
    // open: no merge happened, so its promise is still unkept.
    const comments = r.ghCalls.filter((call) => call[0] === "issue" && call[1] === "comment");
    expect(comments).toHaveLength(1);
    const comment = (comments[0] ?? [])[(comments[0] ?? []).indexOf("--body") + 1] ?? "";
    expect(comment).toContain(`\`${CONFIG}\``);
    expect(comment).toContain("kept as this tree has it");
    expect(comment).toContain("#9");
    expect(comment).toContain("nothing merges until someone does");
    expect(r.ghCalls.filter((call) => call[0] === "issue" && call[1] === "close")).toEqual([]);

    // The run's own log counts it, instead of reporting a clean apply.
    expect(r.stderr).toContain("1 held as the tree has them");
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

/**
 * The push argv, asserted as argv.
 *
 * The fixture above pushes to a bare repository over a file path, which takes the
 * other branch of `pushArgs` and cannot see a credential at all. Which credentials
 * a push carries is decided entirely in the argv, so that is what these read:
 * a checkout's `http.https://github.com/.extraheader` is reset, or it authenticates
 * the push as the run's own token and a `contents: read` job gets a 403.
 */
describe("the push argv", () => {
  const BRANCH = "atomaton/update-v0.24.0";

  test("a GitHub https remote is pushed with the update token, the checkout's header reset", () => {
    expect(pushArgs("https://github.com/owner/repo", "ATOMATON_TOKEN", BRANCH)).toEqual([
      "-c",
      "http.extraheader=",
      "-c",
      "http.https://github.com/.extraheader=",
      "push",
      "--force",
      "https://x-access-token:ATOMATON_TOKEN@github.com/owner/repo",
      `HEAD:refs/heads/${BRANCH}`,
    ]);
  });

  test("a `.git` suffix is not carried into the URL the token is put in", () => {
    expect(pushArgs("https://github.com/owner/repo.git", "ATOMATON_TOKEN", BRANCH)).toContain(
      "https://x-access-token:ATOMATON_TOKEN@github.com/owner/repo",
    );
  });

  test("a remote that is not GitHub https keeps the checkout's own credentials", () => {
    // A test's file remote, and an SSH remote the checkout already carries: the
    // update token is not this run's to add there, and no header is reset.
    for (const url of ["/tmp/atomaton-fixture/remote.git", "git@github.com:owner/repo.git"]) {
      expect(pushArgs(url, "ATOMATON_TOKEN", BRANCH)).toEqual([
        "push",
        "--force",
        url,
        `HEAD:refs/heads/${BRANCH}`,
      ]);
    }
  });
});
