import { describe, expect, test } from "bun:test";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
// The servers are spawned with the ambient environment, and inside an Atomaton run that
// includes the run's own `TYPE` and `NUMBER`. See `hermeticEnv`.
import { hermeticEnv, makeConfigDir } from "../../../entrypoints/machinery/testing/harness.ts";

const SCRIPTS_DIR = join(process.cwd(), "src/entrypoints/tools/mcp");
import { FAKE_GH_IMPL } from "../../../entrypoints/machinery/testing/fake-gh-env.ts";
import { removeTemp } from "../../../entrypoints/machinery/testing/harness.ts";
import { readers } from "../../../adapters/github/thread.ts";
import { turnEvents, whoseTurn } from "../../../domain/work/thread.ts";
import { parseCommentCommand } from "../../../domain/work/comment-command.ts";
import { proseOnly } from "../../../adapters/github/tags.ts";

/**
 * Point this server's `gh` at the fake, and leave the real one unusable.
 *
 * PATH cannot carry this on Windows -- see `ghCommand` in `adapters/github/gh.ts`. It was tried
 * here too, and the way it failed was to reach the real CLI with the developer's own
 * credentials: a GraphQL fixture in this file was answered by GitHub itself.
 */
function fakeGhSeam(): Record<string, string> {
  return {
    ATOMATON_FAKE_GH: FAKE_GH_IMPL,
    GH_TOKEN: "fake-gh-must-be-used",
    GITHUB_TOKEN: "fake-gh-must-be-used",
  };
}

/**
 * Send one JSON-RPC request to a server and resolve its first response line.
 *
 * `timeoutMs` is a parameter rather than a fixed five seconds because how long a
 * server takes to answer `initialize` is a property of that server, not of this
 * harness. Every server answers well inside the default now, including `search.ts`,
 * which used to answer in minutes and had no test for that reason.
 */
function sendRequest(
  script: string,
  request: Record<string, unknown>,
  env: Record<string, string> = {},
  cwd = process.cwd(),
  extraArgs: string[] = [],
  timeoutMs = 5000,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const child = spawn("bun", ["run", `${SCRIPTS_DIR}/${script}`, ...extraArgs], {
      env: { ...hermeticEnv(), GITHUB_REPOSITORY: "owner/repo", ...env },
      cwd,
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
    child.stdin.write(JSON.stringify(request) + "\n");
  });
}

const INIT_PARAMS = {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "test-client", version: "1.0.0" },
};

const INIT_REQUEST = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: INIT_PARAMS,
};

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

/**
 * Git's answer as the bytes git wrote.
 *
 * `git()` decodes as UTF-8 and trims, which is exactly what must not happen to a binary
 * file: a round trip through a string is how a test ends up asserting the mangled bytes
 * it caused rather than the ones git held.
 */
function gitBytes(cwd: string, ...args: string[]): Buffer {
  return execFileSync("git", args, { cwd });
}

function makeRemoteBranchFixture(): { root: string; seed: string; work: string } {
  const root = mkdtempSync(join(tmpdir(), "atomaton-sync-branch-"));
  const remote = join(root, "remote.git");
  const seed = join(root, "seed");
  const work = join(root, "work");
  git(root, "init", "--bare", "--initial-branch=atomaton/issue-1", remote);
  git(root, "init", "--initial-branch=atomaton/issue-1", seed);
  git(seed, "config", "user.name", "Atomaton Test");
  git(seed, "config", "user.email", "atomaton@example.com");
  writeFileSync(join(seed, "value.txt"), "one\n");
  git(seed, "add", "value.txt");
  git(seed, "commit", "-m", "initial");
  git(seed, "remote", "add", "origin", remote);
  git(seed, "push", "-u", "origin", "atomaton/issue-1");
  git(root, "clone", "--branch", "atomaton/issue-1", remote, work);
  return { root, seed, work };
}

function advanceRemote(seed: string): string {
  writeFileSync(join(seed, "value.txt"), "two\n");
  git(seed, "add", "value.txt");
  git(seed, "commit", "-m", "remote update");
  git(seed, "push", "origin", "atomaton/issue-1");
  return git(seed, "rev-parse", "HEAD");
}

/**
 * A repository with a base branch and a work branch cut from it, which is the shape
 * `merge_base_into_branch` exists for: `main` moves, and `atomaton/issue-1` has to take
 * it in.
 */
function makeMergeBaseFixture(): { root: string; seed: string; work: string } {
  const root = mkdtempSync(join(tmpdir(), "atomaton-merge-base-"));
  const remote = join(root, "remote.git");
  const seed = join(root, "seed");
  const work = join(root, "work");
  git(root, "init", "--bare", "--initial-branch=main", remote);
  git(root, "init", "--initial-branch=main", seed);
  git(seed, "config", "user.name", "Atomaton Test");
  git(seed, "config", "user.email", "atomaton@example.com");
  writeFileSync(join(seed, "shared.txt"), "one\n");
  writeFileSync(join(seed, "README.md"), "readme\n");
  git(seed, "add", ".");
  git(seed, "commit", "-m", "initial");
  git(seed, "remote", "add", "origin", remote);
  git(seed, "push", "-u", "origin", "main");
  git(root, "clone", remote, work);
  git(work, "config", "user.name", "Atomaton Test");
  git(work, "config", "user.email", "atomaton@example.com");
  git(work, "checkout", "-b", "atomaton/issue-1");
  writeFileSync(join(work, "work.txt"), "the work\n");
  git(work, "add", "work.txt");
  git(work, "commit", "-m", "the work");
  git(work, "push", "-u", "origin", "atomaton/issue-1");
  return { root, seed, work };
}

/** A commit on `main` in the seed clone, pushed. Returns its sha. */
function commitOnMain(seed: string, file: string, content: string): string {
  git(seed, "checkout", "main");
  writeFileSync(join(seed, file), content);
  git(seed, "add", file);
  git(seed, "commit", "-m", `base change to ${file}`);
  git(seed, "push", "origin", "main");
  return git(seed, "rev-parse", "HEAD");
}

/** A commit on the work branch in the work clone, pushed. Returns its sha. */
function commitOnWork(work: string, file: string, content: string): string {
  writeFileSync(join(work, file), content);
  git(work, "add", file);
  git(work, "commit", "-m", `work change to ${file}`);
  git(work, "push", "origin", "atomaton/issue-1");
  return git(work, "rev-parse", "HEAD");
}

/**
 * The same shape, checked out the way a run's own checkout leaves it: depth 1.
 *
 * `file://` rather than a plain path, because `git clone` ignores `--depth` for a local
 * path and hardlinks the objects instead — a fixture that came out complete would be
 * testing nothing (#372). The work branch is made and pushed in the seed first, because
 * a depth-1 clone has to be told which branch to fetch.
 */
function makeShallowMergeBaseFixture(): { root: string; seed: string; work: string } {
  const root = mkdtempSync(join(tmpdir(), "atomaton-shallow-merge-"));
  const remote = join(root, "remote.git");
  const seed = join(root, "seed");
  const work = join(root, "work");
  git(root, "init", "--bare", "--initial-branch=main", remote);
  git(root, "init", "--initial-branch=main", seed);
  git(seed, "config", "user.name", "Atomaton Test");
  git(seed, "config", "user.email", "atomaton@example.com");
  writeFileSync(join(seed, "shared.txt"), "one\n");
  writeFileSync(join(seed, "README.md"), "readme\n");
  git(seed, "add", ".");
  git(seed, "commit", "-m", "initial");
  git(seed, "remote", "add", "origin", remote);
  git(seed, "push", "-u", "origin", "main");
  git(seed, "checkout", "-b", "atomaton/issue-1");
  writeFileSync(join(seed, "work.txt"), "the work\n");
  git(seed, "add", "work.txt");
  git(seed, "commit", "-m", "the work");
  git(seed, "push", "-u", "origin", "atomaton/issue-1");
  git(root, "clone", "--depth=1", "--branch", "atomaton/issue-1", `file://${remote}`, work);
  git(work, "config", "user.name", "Atomaton Test");
  git(work, "config", "user.email", "atomaton@example.com");
  return { root, seed, work };
}

/** The three byte strings `logo.bin` takes: base, the parent's, and this run's. A NUL
 * byte in each, so git and every tool here agree the file is binary. */
const BASE_LOGO = Buffer.from([0, 1, 2, 3]);
const PARENT_LOGO = Buffer.from([0, 1, 2, 3, 1]);
const RUN_LOGO = Buffer.from([0, 9, 9, 9]);

/**
 * The shape of #360: a sub-issue's run is checked out on the base branch, and the
 * branch its work has to land on — its parent's — has moved since.
 *
 * `main` and `atomaton/issue-149` disagree about `diverged.ts`, which is the file that
 * made the checkout refuse; `parent-only.ts` is the parent's work, which the run has
 * never seen and must not lose. The run's clone is depth 1, the way the runner leaves
 * it.
 *
 * `logo.bin` is #381: a file that cannot hold git's markers, so the run's version of it
 * is reachable only through the index once both sides have changed it. The parent's
 * bytes are here and `main`'s are not touched again, which leaves the run's edit and the
 * parent's edit as the two sides of the conflict.
 */
function makeStackedRunFixture(): { root: string; seed: string; work: string } {
  const root = mkdtempSync(join(tmpdir(), "atomaton-stacked-run-"));
  const remote = join(root, "remote.git");
  const seed = join(root, "seed");
  const work = join(root, "work");
  git(root, "init", "--bare", "--initial-branch=main", remote);
  git(root, "init", "--initial-branch=main", seed);
  git(seed, "config", "user.name", "Atomaton Test");
  git(seed, "config", "user.email", "atomaton@example.com");
  writeFileSync(join(seed, "diverged.ts"), "base\n");
  writeFileSync(join(seed, "touched.ts"), "one\n");
  writeFileSync(join(seed, "logo.bin"), BASE_LOGO);
  git(seed, "add", ".");
  git(seed, "commit", "-m", "initial");
  git(seed, "remote", "add", "origin", remote);
  git(seed, "push", "-u", "origin", "main");

  // The parent's branch, carrying work `main` has not got.
  git(seed, "checkout", "-b", "atomaton/issue-149");
  writeFileSync(join(seed, "diverged.ts"), "parent\n");
  writeFileSync(join(seed, "parent-only.ts"), "the parent's work\n");
  writeFileSync(join(seed, "logo.bin"), PARENT_LOGO);
  git(seed, "add", ".");
  git(seed, "commit", "-m", "the parent's work");
  git(seed, "push", "-u", "origin", "atomaton/issue-149");

  // And `main` moves on in the same file, which is what makes the two bases disagree.
  // `logo.bin` is left alone here, so the two sides of it are the parent's and the run's.
  git(seed, "checkout", "main");
  writeFileSync(join(seed, "diverged.ts"), "main\n");
  git(seed, "commit", "-am", "main moves on");
  git(seed, "push", "origin", "main");

  git(root, "clone", "--depth=1", "--branch", "main", `file://${remote}`, work);
  git(work, "config", "user.name", "Atomaton Test");
  git(work, "config", "user.email", "atomaton@example.com");
  return { root, seed, work };
}

/** The environment those runs have: issue #1, whose parent is #149, on no branch yet. */
function stackedRunEnv(dir: string): Record<string, string> {
  return {
    TYPE: "issue",
    NUMBER: "1",
    BRANCH: "",
    ATOMATON_OPS_LOG: join(dir, "ops.log"),
    FAKE_GH_LOG: join(dir, "gh.log"),
    ...fakeGhSeam(),
    FAKE_GH_RESPONSES: JSON.stringify([
      { match: ["graphql"], stdout: JSON.stringify({ data: { repository: { issue: { parent: { number: 149 } } } } }) },
      { match: ["matching-refs"], stdout: "[]" },
      { match: ["pr", "list"], stdout: "[]" },
      { match: ["workflow", "run"], stdout: "" },
    ]),
  };
}

/**
 * The environment a merge needs on an issue run with no `config.yaml` beside it.
 *
 * `parentIssueOf` is asked whether #1 is a sub-issue (it is not, so the base is the
 * configured base branch, which is empty) and the default branch then has to be named,
 * because `merge_base_into_branch` has to have something to fetch from.
 */
function mergeBaseEnv(dir: string, extra: Record<string, string> = {}): Record<string, string> {
  return {
    TYPE: "issue",
    NUMBER: "1",
    BRANCH: "atomaton/issue-1",
    ATOMATON_OPS_LOG: join(dir, "ops.log"),
    FAKE_GH_LOG: join(dir, "gh.log"),
    ...fakeGhSeam(),
    FAKE_GH_RESPONSES: JSON.stringify([
      { match: ["graphql"], stdout: JSON.stringify({ data: { repository: { issue: { parent: null } } } }) },
      { match: ["repo", "view"], stdout: JSON.stringify({ defaultBranchRef: { name: "main" } }) },
      { match: ["pr", "list"], stdout: "[]" },
    ]),
    ...extra,
  };
}

/** Every `logOp` entry this run wrote, in order. */
function opsLog(dir: string): Record<string, unknown>[] {
  const path = join(dir, "ops.log");
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe("mcp/github.ts", () => {
  test("initialize returns server info", async () => {
    const r = await sendRequest("github.ts", {
      jsonrpc: "2.0", id: 1, method: "initialize", params: INIT_PARAMS,
    });
    expect(r.result.serverInfo.name).toBe("atomaton-github-mcp");
  });

  test("tools/list exposes the expected tool set", async () => {
    const r = await sendRequest("github.ts", {
      jsonrpc: "2.0", id: 2, method: "tools/list", params: {},
    });
    const names = r.result.tools.map((t: { name: string }) => t.name);
    for (const tool of ["create_sub_issue", "create_root_issue", "create_pr", "get_issue", "search_remote_code", "get_pr_diff", "sync_branch", "merge_base_into_branch"]) {
      expect(names).toContain(tool);
    }
  });

  test("sync_branch fast-forwards a clean branch from origin", async () => {
    const { root, seed, work } = makeRemoteBranchFixture();

    try {
      const remoteHead = advanceRemote(seed);

      const response = await sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "sync_branch", arguments: {} } },
        { BRANCH: "atomaton/issue-1" },
        work,
      );
      const result = JSON.parse(response.result.content[0].text) as { status: string; behind: number };
      expect(result).toMatchObject({ status: "fast_forwarded", behind: 1 });
      expect(git(work, "rev-parse", "HEAD")).toBe(remoteHead);
    } finally {
      removeTemp(root);
    }
  });

  test("create_pr rejects an unsynchronized HEAD without pushing", async () => {
    const { root, seed, work } = makeRemoteBranchFixture();
    try {
      advanceRemote(seed);
      const localHead = git(work, "rev-parse", "HEAD");

      const response = await sendRequest(
        "github.ts",
        {
          jsonrpc: "2.0",
          id: 4,
          method: "tools/call",
          params: { name: "create_pr", arguments: { title: "Test PR" } },
        },
        { BRANCH: "atomaton/issue-1" },
        work,
      );
      expect(response.result.isError).toBe(true);
      expect(response.result.content[0].text).toContain("Call sync_branch");
      expect(git(work, "rev-parse", "HEAD")).toBe(localHead);
    } finally {
      removeTemp(root);
    }
  });

  /**
   * The base is the tree's, not the caller's. A sub-issue's pull request targets its
   * parent's branch so the parent's work accumulates in one place; the branch is read
   * from GitHub's own sub-issue link, and the resolved value comes back as `base`.
   */
  test("create_pr aims a sub-issue's pull request at its parent's branch", async () => {
    const { root, seed, work } = makeRemoteBranchFixture();
    const dir = mkdtempSync(join(tmpdir(), "atomaton-stacked-pr-"));
    const log = join(dir, "gh.log");
    try {
      // The parent branch has to exist on the remote: `stackedPrBase` checks with
      // `ls-remote` and falls back to the base branch when it is not there.
      git(seed, "branch", "atomaton/issue-12");
      git(seed, "push", "origin", "atomaton/issue-12");
      git(work, "fetch", "origin");

      const response = await sendRequest(
        "github.ts",
        {
          jsonrpc: "2.0",
          id: 5,
          method: "tools/call",
          params: { name: "create_pr", arguments: { title: "Test PR" } },
        },
        {
          BRANCH: "atomaton/issue-1",
          TYPE: "issue",
          NUMBER: "1",
          ...fakeGhSeam(),
          FAKE_GH_LOG: log,
          FAKE_GH_RESPONSES: JSON.stringify([
            // #1 is a sub-issue of #12, and #12's branch is the base.
            { match: ["graphql"], stdout: JSON.stringify({ data: { repository: { issue: { parent: { number: 12 } } } } }) },
            { match: ["pr", "list"], stdout: "[]" },
            { match: ["pr", "create"], stdout: "https://github.com/owner/repo/pull/123" },
            { match: ["workflow", "run"], stdout: "" },
            { match: ["api", "issues/123"], stdout: JSON.stringify({ body: "", login: "someone", type: "User" }) },
            { match: ["issue", "comment"], stdout: "" },
            { match: ["pr", "comment"], stdout: "" },
          ]),
        },
        work,
      );
      expect(response.result.isError, response.result.content?.[0]?.text).toBeFalsy();
      expect(JSON.parse(response.result.content[0].text).base).toBe("atomaton/issue-12");
      const created = readFileSync(log, "utf8")
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line) as string[])
        .find((argv) => argv.includes("pr") && argv.includes("create"));
      expect(created, "the parent's branch is the base, and nothing else is").toContain("atomaton/issue-12");
    } finally {
      removeTemp(root);
      removeTemp(dir);
    }
  }, 60_000);

  /**
   * Who opened the pull request, said in the body where a reader can see it. The
   * hidden `atomaton:origin-agent` tag was the only copy, and a tag is invisible
   * in every place a person reads the thread — and it is the routing input when a
   * review sends the pull request back: the agent `Opened by` names is the one
   * that fixes the findings.
   */
  test("create_pr writes the agent that opened it into the pull request body", async () => {
    const { root, seed, work } = makeRemoteBranchFixture();
    const dir = mkdtempSync(join(tmpdir(), "atomaton-opened-by-"));
    const log = join(dir, "gh.log");
    try {
      git(seed, "branch", "atomaton/issue-12");
      git(seed, "push", "origin", "atomaton/issue-12");
      git(work, "fetch", "origin");

      const response = await sendRequest(
        "github.ts",
        {
          jsonrpc: "2.0", id: 21, method: "tools/call",
          params: { name: "create_pr", arguments: { title: "Test PR" } },
        },
        {
          BRANCH: "atomaton/issue-1",
          TYPE: "issue",
          NUMBER: "1",
          AGENT: "engineer",
          ATOMATON_RUN_URL: "https://github.com/owner/repo/actions/runs/42",
          ...fakeGhSeam(),
          FAKE_GH_LOG: log,
          FAKE_GH_RESPONSES: JSON.stringify([
            { match: ["graphql"], stdout: JSON.stringify({ data: { repository: { issue: { parent: { number: 12 } } } } }) },
            { match: ["pr", "list"], stdout: "[]" },
            { match: ["pr", "create"], stdout: "https://github.com/owner/repo/pull/123" },
            { match: ["workflow", "run"], stdout: "" },
            { match: ["api", "issues/123"], stdout: JSON.stringify({ body: "", login: "someone", type: "User" }) },
            { match: ["issue", "comment"], stdout: "" },
            { match: ["pr", "comment"], stdout: "" },
          ]),
        },
        work,
      );
      expect(response.result.isError, response.result.content?.[0]?.text).toBeFalsy();
      const created = readFileSync(log, "utf8").trim().split("\n")
        .map((line) => JSON.parse(line) as string[])
        .find((argv) => argv.includes("pr") && argv.includes("create"));
      const body = created?.[created.indexOf("--body") + 1] ?? "";
      expect(body).toContain("_Opened by [`engineer`](https://github.com/owner/repo/actions/runs/42)_");
      // The hidden tag stays; the visible line is beside it, not instead of it.
      expect(body).toContain("<!-- atomaton:origin-agent=engineer -->");
    } finally {
      removeTemp(root);
      removeTemp(dir);
    }
  }, 60_000);

  /**
   * The comment this run ends on is recorded, so the machinery's footer goes onto
   * it instead of onto a second, content-free comment beside it — and the run's
   * tokens reach the metrics report, which counts token lines off comment bodies
   * and never saw them from these runs before. Recorded only when the session
   * actually ends here: a failed validation dispatch keeps it open, and the record
   * must not outlive the run it is about.
   */
  test("create_pr records the comment it ends the run on, and only when the session ends", async () => {
    const { root, seed, work } = makeRemoteBranchFixture();
    const dir = mkdtempSync(join(tmpdir(), "atomaton-ending-comment-"));
    const log = join(dir, "gh.log");
    try {
      git(seed, "branch", "atomaton/issue-12");
      git(seed, "push", "origin", "atomaton/issue-12");
      git(work, "fetch", "origin");

      const response = await sendRequest(
        "github.ts",
        {
          jsonrpc: "2.0", id: 22, method: "tools/call",
          params: { name: "create_pr", arguments: { title: "Test PR" } },
        },
        {
          BRANCH: "atomaton/issue-1",
          TYPE: "issue",
          NUMBER: "1",
          AGENT: "engineer",
          ATOMATON_RUN_DIR: dir,
          ATOMATON_RUN_URL: "https://github.com/owner/repo/actions/runs/42",
          ...fakeGhSeam(),
          FAKE_GH_LOG: log,
          FAKE_GH_RESPONSES: JSON.stringify([
            { match: ["graphql"], stdout: JSON.stringify({ data: { repository: { issue: { parent: { number: 12 } } } } }) },
            { match: ["pr", "list"], stdout: "[]" },
            { match: ["pr", "create"], stdout: "https://github.com/owner/repo/pull/123" },
            { match: ["workflow", "run"], stdout: "" },
            { match: ["api", "issues/123"], stdout: JSON.stringify({ body: "", login: "someone", type: "User" }) },
            { match: ["issue", "comment"], stdout: "https://github.com/owner/repo/issues/1#issuecomment-777" },
            { match: ["pr", "comment"], stdout: "" },
          ]),
        },
        work,
      );
      expect(response.result.isError, response.result.content?.[0]?.text).toBeFalsy();
      const recorded = JSON.parse(readFileSync(join(dir, "ending-comment.json"), "utf8"));
      expect(recorded).toEqual({ commentId: "777", node: "1" });
    } finally {
      removeTemp(root);
      removeTemp(dir);
    }
  }, 60_000);

  /**
   * A failed validation dispatch keeps the session open — the model gets another
   * turn and may still write prose of its own. Nothing is recorded, so the footer
   * cannot land on the confirmation comment while the run goes on.
   */
  test("create_pr records nothing when validation did not dispatch", async () => {
    const { root, seed, work } = makeRemoteBranchFixture();
    const dir = mkdtempSync(join(tmpdir(), "atomaton-ending-comment-"));
    try {
      git(seed, "branch", "atomaton/issue-12");
      git(seed, "push", "origin", "atomaton/issue-12");
      git(work, "fetch", "origin");

      const response = await sendRequest(
        "github.ts",
        {
          jsonrpc: "2.0", id: 23, method: "tools/call",
          params: { name: "create_pr", arguments: { title: "Test PR" } },
        },
        {
          BRANCH: "atomaton/issue-1",
          TYPE: "issue",
          NUMBER: "1",
          AGENT: "engineer",
          ATOMATON_RUN_DIR: dir,
          ...fakeGhSeam(),
          FAKE_GH_RESPONSES: JSON.stringify([
            { match: ["graphql"], stdout: JSON.stringify({ data: { repository: { issue: { parent: { number: 12 } } } } }) },
            { match: ["pr", "list"], stdout: "[]" },
            { match: ["pr", "create"], stdout: "https://github.com/owner/repo/pull/123" },
            { match: ["workflow", "run"], code: 1 },
            { match: ["api", "issues/123"], stdout: JSON.stringify({ body: "", login: "someone", type: "User" }) },
            { match: ["issue", "comment"], stdout: "" },
            { match: ["pr", "comment"], stdout: "" },
          ]),
        },
        work,
      );
      expect(response.result.isError, response.result.content?.[0]?.text).toBeFalsy();
      expect(JSON.parse(response.result.content[0].text).validation_dispatched).toBe(false);
      const recorded = existsSync(join(dir, "ending-comment.json"));
      expect(recorded, "a run that continues leaves no record behind").toBe(false);
    } finally {
      removeTemp(root);
      removeTemp(dir);
    }
  }, 60_000);

  /**
   * `create_pr` PARKS the turn (#351). The session ends inside the call and the work
   * it started runs on the pull request, so the node keeps its `atomaton/in-progress`
   * label until the merge route re-invokes it — the same treatment `launch_sub_agent`'s
   * children get. The runner reads that out of this run's own ops log, grepping for
   * `"op":"dispatch-elsewhere"`; with no entry it read the ending as `finished`,
   * released the guard, and the node went to `atomaton/waiting-for-person` while a
   * reviewer was working its pull request.
   *
   * The parked entry is also NOT a `"op":"dispatch"` entry: the two are what the runner
   * tells a park from a hand-off on this node with, and a run that wrote both would be
   * both at once.
   */
  test("create_pr parks the turn on the validation it dispatched", async () => {
    const { root, seed, work } = makeRemoteBranchFixture();
    const dir = mkdtempSync(join(tmpdir(), "atomaton-parked-pr-"));
    const log = join(dir, "gh.log");
    try {
      git(seed, "branch", "atomaton/issue-12");
      git(seed, "push", "origin", "atomaton/issue-12");
      git(work, "fetch", "origin");

      const response = await sendRequest(
        "github.ts",
        {
          jsonrpc: "2.0", id: 24, method: "tools/call",
          params: { name: "create_pr", arguments: { title: "Test PR", reviewer: "reviewer" } },
        },
        {
          BRANCH: "atomaton/issue-1",
          TYPE: "issue",
          NUMBER: "1",
          AGENT: "engineer",
          ATOMATON_RUN_DIR: dir,
          ATOMATON_OPS_LOG: join(dir, "ops.log"),
          ATOMATON_RUN_URL: "https://github.com/owner/repo/actions/runs/42",
          ...fakeGhSeam(),
          FAKE_GH_LOG: log,
          FAKE_GH_RESPONSES: JSON.stringify([
            { match: ["graphql"], stdout: JSON.stringify({ data: { repository: { issue: { parent: { number: 12 } } } } }) },
            { match: ["pr", "list"], stdout: "[]" },
            { match: ["pr", "create"], stdout: "https://github.com/owner/repo/pull/123" },
            { match: ["workflow", "run"], stdout: "" },
            { match: ["api", "issues/123"], stdout: JSON.stringify({ body: "", login: "someone", type: "User" }) },
            { match: ["issue", "comment"], stdout: "https://github.com/owner/repo/issues/1#issuecomment-777" },
            { match: ["pr", "comment"], stdout: "" },
          ]),
        },
        work,
      );
      expect(response.result.isError, response.result.content?.[0]?.text).toBeFalsy();
      expect(JSON.parse(response.result.content[0].text).validation_dispatched).toBe(true);

      const entries = opsLog(dir);
      const parked = entries.filter((entry) => entry.op === "dispatch-elsewhere");
      expect(parked).toHaveLength(1);
      // The pull request is the node the work runs on, and the reviewer the caller
      // named is the agent it routes toward.
      expect(parked[0]).toMatchObject({ target: "pr", agent: "reviewer", number: 123 });
      expect(
        entries.filter((entry) => entry.op === "dispatch"),
        "a parked run is not also a hand-off on its own node",
      ).toHaveLength(0);
    } finally {
      removeTemp(root);
      removeTemp(dir);
    }
  }, 60_000);

  /**
   * A failed validation dispatch keeps the session open — the agent gets another turn
   * and can retry — so the turn is not parked and no entry is written. An entry here
   * would hold the node's `atomaton/in-progress` guard on a run whose only live thing
   * is the agent still typing.
   */
  test("create_pr writes no park when validation was not dispatched", async () => {
    const { root, seed, work } = makeRemoteBranchFixture();
    const dir = mkdtempSync(join(tmpdir(), "atomaton-parked-pr-"));
    try {
      git(seed, "branch", "atomaton/issue-12");
      git(seed, "push", "origin", "atomaton/issue-12");
      git(work, "fetch", "origin");

      const response = await sendRequest(
        "github.ts",
        {
          jsonrpc: "2.0", id: 25, method: "tools/call",
          params: { name: "create_pr", arguments: { title: "Test PR", reviewer: "reviewer" } },
        },
        {
          BRANCH: "atomaton/issue-1",
          TYPE: "issue",
          NUMBER: "1",
          AGENT: "engineer",
          ATOMATON_RUN_DIR: dir,
          ATOMATON_OPS_LOG: join(dir, "ops.log"),
          ...fakeGhSeam(),
          FAKE_GH_RESPONSES: JSON.stringify([
            { match: ["graphql"], stdout: JSON.stringify({ data: { repository: { issue: { parent: { number: 12 } } } } }) },
            { match: ["pr", "list"], stdout: "[]" },
            { match: ["pr", "create"], stdout: "https://github.com/owner/repo/pull/123" },
            { match: ["workflow", "run"], code: 1 },
            { match: ["api", "issues/123"], stdout: JSON.stringify({ body: "", login: "someone", type: "User" }) },
            { match: ["issue", "comment"], stdout: "" },
            { match: ["pr", "comment"], stdout: "" },
          ]),
        },
        work,
      );
      expect(response.result.isError, response.result.content?.[0]?.text).toBeFalsy();
      expect(JSON.parse(response.result.content[0].text).validation_dispatched).toBe(false);
      expect(
        opsLog(dir).filter((entry) => entry.op === "dispatch-elsewhere"),
        "a run that continues is not parked",
      ).toHaveLength(0);
    } finally {
      removeTemp(root);
      removeTemp(dir);
    }
  }, 60_000);

  /**
   * `base` is not an argument any more. The base is resolved from the tree, so a
   * caller that names one is refused rather than obeyed -- a schema that strips it
   * would open the pull request somewhere else and report success.
   */
  test("create_pr refuses a base argument", async () => {
    const response = await sendRequest(
      "github.ts",
      {
        jsonrpc: "2.0",
        id: 6,
        method: "tools/call",
        params: { name: "create_pr", arguments: { title: "Test PR", base: "main" } },
      },
      { ...fakeGhSeam() },
    );
    expect(response.result.isError).toBe(true);
    expect(response.result.content[0].text).toContain("base");
  });

  /**
   * A `pr` run's worktree: checked out at `refs/pull/<n>/head` with no local branch,
   * which is what #803 hit. `git branch --points-at HEAD` prints git's own
   * description of the detached HEAD, and that description used to be handed to
   * `git push -u origin <that>` as a refspec.
   *
   * Two things have to hold, and the second is the one that matters: the refusal
   * says what the run cannot do, and NO COMMIT IS MADE -- `commitAndPush` resolves
   * the branch before `git add -A` and `git commit` for exactly this reason, so the
   * work stays in the worktree where the agent can still report it. A commit that
   * cannot be pushed is work the run loses.
   */
  test("commit_and_push on a detached HEAD refuses before committing", async () => {
    const { root, work } = makeRemoteBranchFixture();
    try {
      git(work, "config", "user.name", "Atomaton Test");
      git(work, "config", "user.email", "atomaton@example.com");
      git(work, "checkout", "--detach", "HEAD");
      git(work, "branch", "-D", "atomaton/issue-1");
      writeFileSync(join(work, "fix.txt"), "the fix\n");
      const before = git(work, "rev-parse", "HEAD");

      const response = await sendRequest(
        "github.ts",
        {
          jsonrpc: "2.0",
          id: 6,
          method: "tools/call",
          params: { name: "commit_and_push", arguments: { message: "fix the findings" } },
        },
        // What the runner sets on a `pr` run: the branch env is the literal HEAD.
        { BRANCH: "HEAD", TYPE: "pr", NUMBER: "802" },
        work,
      );

      expect(response.result.isError).toBe(true);
      const message = response.result.content[0].text as string;
      expect(message, "the refusal names the state, not a git refspec").toContain("no branch to push");
      expect(message).not.toContain("refspec");
      // The part that matters: no commit was created, and the change is still there.
      expect(git(work, "rev-parse", "HEAD"), "a commit was stranded").toBe(before);
      expect(git(work, "status", "--porcelain")).toContain("fix.txt");
    } finally {
      removeTemp(root);
    }
  });

  test("create_pr on a detached HEAD refuses with the same message", async () => {
    const { root, work } = makeRemoteBranchFixture();
    try {
      git(work, "checkout", "--detach", "HEAD");
      git(work, "branch", "-D", "atomaton/issue-1");

      const response = await sendRequest(
        "github.ts",
        {
          jsonrpc: "2.0",
          id: 7,
          method: "tools/call",
          params: { name: "create_pr", arguments: { title: "Test PR" } },
        },
        {
          BRANCH: "HEAD",
          // An ISSUE run, not a pull request run: `create_sub_issue`/`launch_sub_agent`
          // and now `create_pr` itself refuse on a pull request run (a pull request is
          // a leaf and opens nothing below it), so the detached-checkout refusal is
          // reached by the one run type that legitimately opens a pull request. The
          // detached case a pull request run hits is covered by
          // `commit_and_push`, which a pull request run may still call.
          TYPE: "issue",
          NUMBER: "802",
          ...fakeGhSeam(),
          FAKE_GH_RESPONSES: JSON.stringify([
            // `stackedPrBase` asks GitHub whether #802 is a sub-issue before
            // `resolveBranch` is reached, so the read has to answer -- `parent: null`
            // is "not a sub-issue", which falls through to the base branch.
            { match: ["graphql"], stdout: JSON.stringify({ data: { repository: { issue: { parent: null } } } }) },
          ]),
        },
        work,
      );

      expect(response.result.isError).toBe(true);
      expect(response.result.content[0].text).toContain("no branch to push");
    } finally {
      removeTemp(root);
    }
  });

  /**
   * A pull request body is read for the agent to dispatch by `extract_directive.ts`,
   * so an agent writing `/reviewer` into it would be asking for a run in the one place
   * a reader takes for a request. The route it meant is the `reviewer` argument, which
   * the machinery writes as that same line.
   */
  test("create_pr refuses a body carrying a command on its own line", async () => {
    const { root, work } = makeRemoteBranchFixture();
    try {
      const response = await sendRequest(
        "github.ts",
        {
          jsonrpc: "2.0",
          id: 8,
          method: "tools/call",
          params: { name: "create_pr", arguments: { title: "Test PR", body: "The change.\n\n/reviewer" } },
        },
        { BRANCH: "atomaton/issue-1", ...fakeGhSeam(), FAKE_GH_RESPONSES: "[]" },
        work,
      );
      expect(response.result.isError).toBe(true);
      expect(response.result.content[0].text).toContain("/reviewer");
      expect(response.result.content[0].text).toContain("reviewer` argument");
    } finally {
      removeTemp(root);
    }
  });

  /**
   * A pull request is a leaf of the tree, so a pull request run does not open another
   * one. `create_sub_issue` and `launch_sub_agent` already refuse on a PR run; this is the
   * third tool that could add a child, and it was the one left open.
   */
  test("create_pr refuses on a pull request run", async () => {
    const r = await sendRequest(
      "github.ts",
      {
        jsonrpc: "2.0", id: 35, method: "tools/call",
        params: { name: "create_pr", arguments: { title: "Test PR" } },
      },
      { ...fakeGhSeam(), TYPE: "pr", NUMBER: "21", FAKE_GH_RESPONSES: "[]" },
    );
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("pull request");
  });

  /**
   * The other half: the routes that must keep working. An `issue` run starts on the
   * base branch with no branch of its own, `commit_and_push` names one at the first
   * commit, and `create_pr` then reads that same branch back out of HEAD. Verifying
   * the branch with `show-ref` is new, so this is what says it did not break the
   * ordinary path.
   */
  // A whole git repository built, cloned and driven through two MCP tools, each of
  // which spawns a server and several `gh` calls. Bun`s default 5s does not cover
  // that on Windows -- and until the fake was reachable here, this never ran far
  // enough to say so.
  test("an issue run still creates its branch and opens a pull request from it", async () => {
    const { root, work } = makeRemoteBranchFixture();
    const dir = mkdtempSync(join(tmpdir(), "atomaton-issue-branch-"));
    const log = join(dir, "gh.log");
    try {
      git(work, "config", "user.name", "Atomaton Test");
      git(work, "config", "user.email", "atomaton@example.com");
      // The runner checks out the base branch when there is nothing to resume.
      git(work, "checkout", "-B", "main");
      git(work, "branch", "-D", "atomaton/issue-1");
      writeFileSync(join(work, "work.txt"), "the work\n");

      const env = {
        TYPE: "issue",
        NUMBER: "1",
        BRANCH: "",
        ...fakeGhSeam(),
        FAKE_GH_LOG: log,
        FAKE_GH_RESPONSES: JSON.stringify([
          { match: ["matching-refs"], stdout: "[]" },
          { match: ["issue", "view", "1"], stdout: "" },
          // Whether #1 is a sub-issue, which decides what its pull request targets.
          // GitHub's own link, not a body tag -- see `adapters/github/parent-issue.ts`. A read
          // that fails here is a tool error rather than a guessed base branch, so
          // the rule has to be here for the happy path to be the happy path.
          { match: ["graphql"], stdout: JSON.stringify({ data: { repository: { issue: { parent: null } } } }) },
          { match: ["pr", "list"], stdout: "[]" },
          { match: ["pr", "create"], stdout: "https://github.com/owner/repo/pull/123" },
          { match: ["workflow", "run"], stdout: "" },
          { match: ["api", "issues/123"], stdout: JSON.stringify({ body: "", login: "someone", type: "User" }) },
          { match: ["issue", "comment"], stdout: "" },
          { match: ["pr", "comment"], stdout: "" },
        ]),
      };

      const pushed = await sendRequest(
        "github.ts",
        {
          jsonrpc: "2.0",
          id: 8,
          method: "tools/call",
          params: { name: "commit_and_push", arguments: { message: "do the work" } },
        },
        env,
        work,
      );
      expect(pushed.result.isError, pushed.result.content?.[0]?.text).toBeFalsy();
      expect(JSON.parse(pushed.result.content[0].text)).toMatchObject({ committed: true, pushed: true });
      expect(git(work, "branch", "--show-current")).toBe("atomaton/issue-1");

      const opened = await sendRequest(
        "github.ts",
        {
          jsonrpc: "2.0",
          id: 9,
          method: "tools/call",
          params: { name: "create_pr", arguments: { title: "Test PR" } },
        },
        env,
        work,
      );
      expect(opened.result.isError, opened.result.content?.[0]?.text).toBeFalsy();
      expect(JSON.parse(opened.result.content[0].text).number).toBe(123);
      // `gh pr create` was handed the branch the commit created, not HEAD or a
      // detached-HEAD description.
      const created = readFileSync(log, "utf8")
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line) as string[])
        .find((argv) => argv.includes("pr") && argv.includes("create"));
      expect(created).toContain("atomaton/issue-1");
    } finally {
      removeTemp(root);
      removeTemp(dir);
    }
  }, 60_000);

  /**
   * #360. A sub-issue's run starts on the base branch and only learns where its work
   * goes at the first commit, so when the parent's branch had moved in a file the run
   * also edited, `git checkout -b` refused to switch — "Your local changes to the
   * following files would be overwritten" — and `commit_and_push` reported "Could not
   * create branch". The run had no way past it short of cloning the repository
   * elsewhere to find the divergence and hand-splitting the change.
   *
   * Both halves of what that cost are asserted here: the refusal is gone, replaced by a
   * named conflict in the file the two bases disagree about; and the parent's work in a
   * file the run never touched survives the move, which is the half that would have
   * been lost silently.
   */
  test("a stacked run's work is carried onto the parent's branch, and a real conflict is named", async () => {
    const { root, work } = makeStackedRunFixture();
    const dir = mkdtempSync(join(tmpdir(), "atomaton-stacked-env-"));
    try {
      // The run's edits, written against `main`, which disagrees with the parent about
      // `diverged.ts`.
      writeFileSync(join(work, "diverged.ts"), "the run's version\n");
      writeFileSync(join(work, "touched.ts"), "the run's work\n");

      const refused = await sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 40, method: "tools/call", params: { name: "commit_and_push", arguments: { message: "the work" } } },
        stackedRunEnv(dir),
        work,
      );
      expect(refused.result.isError).toBe(true);
      const why = refused.result.content[0].text as string;
      expect(why).toContain("diverged.ts");
      expect(why).toContain("atomaton/issue-149");
      // Not git declining to switch: that refusal was the defect, and it said nothing
      // about which file the two bases disagreed on.
      expect(why).not.toContain("Your local changes");

      // The branch exists and is the one checked out, cut from the parent's branch...
      expect(git(work, "branch", "--show-current")).toBe("atomaton/issue-1");
      expect(git(work, "merge-base", "--is-ancestor", "origin/atomaton/issue-149", "HEAD")).toBe("");
      // ...with both sides in the file they disagree about, and uncommitted.
      const conflicted = readFileSync(join(work, "diverged.ts"), "utf8");
      expect(conflicted).toContain("<<<<<<< ");
      expect(conflicted).toContain("parent\n");
      expect(conflicted).toContain("the run's version");
      // The run's other work came with it, and the parent's work is still here.
      expect(readFileSync(join(work, "touched.ts"), "utf8")).toBe("the run's work\n");
      expect(readFileSync(join(work, "parent-only.ts"), "utf8")).toBe("the parent's work\n");

      // A commit now would stage the markers and call them a resolution.
      const unresolved = await sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 41, method: "tools/call", params: { name: "commit_and_push", arguments: { message: "the work" } } },
        stackedRunEnv(dir),
        work,
      );
      expect(unresolved.result.isError).toBe(true);
      expect(unresolved.result.content[0].text).toContain("diverged.ts");
      // And says how: declaring the path is the resolution, and the marker file is refused.
      expect(unresolved.result.content[0].text).toContain("resolved_paths");
      expect(unresolved.result.content[0].text).toContain(":3:");

      // Removing the markers is not a resolution on its own, however resolved the file
      // looks: git's index is what knows, and a hidden edit would let a binary -- which
      // never holds markers -- through (#381).
      writeFileSync(join(work, "diverged.ts"), "parent and the run\n");
      const undeclared = await sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 42, method: "tools/call", params: { name: "commit_and_push", arguments: { message: "the work" } } },
        stackedRunEnv(dir),
        work,
      );
      expect(undeclared.result.isError).toBe(true);
      expect(undeclared.result.content[0].text).toContain("diverged.ts");

      // A declaration that leaves the markers behind is refused, as a backstop: one
      // `git add --` would otherwise put them in the branch.
      writeFileSync(
        join(work, "diverged.ts"),
        "<<<<<<< Updated upstream\nparent\n=======\nthe run's version\n>>>>>>> Stashed changes\n",
      );
      const careless = await sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 43, method: "tools/call", params: { name: "commit_and_push", arguments: { message: "the work", resolved_paths: ["diverged.ts"] } } },
        stackedRunEnv(dir),
        work,
      );
      expect(careless.result.isError).toBe(true);
      expect(careless.result.content[0].text).toContain("git's conflict markers");

      writeFileSync(join(work, "diverged.ts"), "parent and the run\n");
      const committed = await sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 44, method: "tools/call", params: { name: "commit_and_push", arguments: { message: "the work", resolved_paths: ["diverged.ts"] } } },
        stackedRunEnv(dir),
        work,
      );
      expect(committed.result.isError, committed.result.content?.[0]?.text).toBeFalsy();
      expect(JSON.parse(committed.result.content[0].text)).toMatchObject({ ok: true, committed: true, pushed: true });

      // Published onto the parent's branch, with the parent's own work still in it.
      // The remote-tracking ref is fetched rather than assumed: a depth-1 clone's
      // refspec names one branch, so `push -u` does not leave `origin/<new>` behind.
      const head = git(work, "rev-parse", "HEAD");
      expect(git(work, "ls-remote", "--heads", "origin", "refs/heads/atomaton/issue-1").split(/\s+/)[0]).toBe(head);
      git(work, "fetch", "origin", "refs/heads/atomaton/issue-1:refs/remotes/origin/atomaton/issue-1");
      expect(git(work, "show", "origin/atomaton/issue-1:parent-only.ts")).toBe("the parent's work");
      expect(git(work, "show", "origin/atomaton/issue-1:touched.ts")).toBe("the run's work");
    } finally {
      removeTemp(root);
      removeTemp(dir);
    }
  }, 60_000);

  /**
   * #381. The same collision in a file that cannot hold git's markers.
   *
   * Measured before the fix, on this fixture: `stash pop` exited 1 with "Cannot merge
   * binary files", the worktree copy was the PARENT's bytes, and `git diff
   * --diff-filter=U` named `logo.bin` — while the guard's marker test read "no markers
   * anywhere" as "resolved", staged the parent's copy with `git add -A`, and committed
   * the run's work away without a word. All three halves are asserted here: the refusal
   * names the path, the parent's bytes are not what gets committed, and the run's own
   * version is reachable and is what lands on the branch once the choice is declared.
   */
  test("a binary both sides changed is refused by name, not committed as the other side's bytes", async () => {
    const { root, work } = makeStackedRunFixture();
    const dir = mkdtempSync(join(tmpdir(), "atomaton-stacked-env-"));
    try {
      writeFileSync(join(work, "logo.bin"), RUN_LOGO);
      // From the remote: a depth-1 clone's refspec names `main`, so the parent's branch
      // is not in this checkout until `commit_and_push` fetches it.
      const parentHead =
        git(work, "ls-remote", "--heads", "origin", "refs/heads/atomaton/issue-149").split(/\s+/)[0] ?? "";

      const refused = await sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 50, method: "tools/call", params: { name: "commit_and_push", arguments: { message: "the work" } } },
        stackedRunEnv(dir),
        work,
      );
      expect(refused.result.isError).toBe(true);
      const why = refused.result.content[0].text as string;
      expect(why).toContain("logo.bin");
      // The half the old message got wrong: it promised markers for a path that can hold
      // none, and named no way to reach the side the worktree is not showing.
      expect(why).not.toContain("conflict markers are in those files");
      expect(why).toContain(":3:");
      expect(why).toContain("resolved_paths");

      // Nothing was committed and nothing was pushed: the branch is still the parent's tip.
      expect(git(work, "rev-parse", "HEAD")).toBe(parentHead);
      expect(git(work, "ls-remote", "--heads", "origin", "refs/heads/atomaton/issue-1")).toBe("");
      // The worktree holds the parent's bytes, which is the state that reads as "resolved"...
      expect(readFileSync(join(work, "logo.bin"))).toEqual(PARENT_LOGO);
      expect(git(work, "status", "--porcelain")).toContain("UU logo.bin");
      // ...and this run's version is in the index, not only in a stash entry.
      expect(gitBytes(work, "show", ":3:logo.bin")).toEqual(RUN_LOGO);

      // The silent loss itself: no markers in the file, so a guard that reads the file
      // would call this resolved and commit the parent's copy over the run's work.
      const undeclared = await sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 51, method: "tools/call", params: { name: "commit_and_push", arguments: { message: "the work" } } },
        stackedRunEnv(dir),
        work,
      );
      expect(undeclared.result.isError).toBe(true);
      expect(undeclared.result.content[0].text).toContain("logo.bin");
      expect(git(work, "rev-parse", "HEAD")).toBe(parentHead);
      expect(git(work, "ls-remote", "--heads", "origin", "refs/heads/atomaton/issue-1")).toBe("");

      writeFileSync(join(work, "logo.bin"), gitBytes(work, "show", ":3:logo.bin"));
      const committed = await sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 52, method: "tools/call", params: { name: "commit_and_push", arguments: { message: "the work", resolved_paths: ["logo.bin"] } } },
        stackedRunEnv(dir),
        work,
      );
      expect(committed.result.isError, committed.result.content?.[0]?.text).toBeFalsy();
      expect(JSON.parse(committed.result.content[0].text)).toMatchObject({ ok: true, committed: true, pushed: true });

      // What landed on the parent's branch is this run's bytes, chosen by the declaration.
      git(work, "fetch", "origin", "refs/heads/atomaton/issue-1:refs/remotes/origin/atomaton/issue-1");
      expect(gitBytes(work, "show", "origin/atomaton/issue-1:logo.bin")).toEqual(RUN_LOGO);
    } finally {
      removeTemp(root);
      removeTemp(dir);
    }
  }, 60_000);

  /**
   * The other way the two bases collide: a file the run created and the parent's branch
   * already has. It is the case `git stash pop` handles worst — an untracked file it
   * cannot restore leaves the parent's copy in the worktree and the run's in the stash,
   * which reads as a clean tree holding the wrong content.
   */
  test("a file the run created that the parent's branch already has is a conflict, not a silent loss", async () => {
    const { root, work } = makeStackedRunFixture();
    const dir = mkdtempSync(join(tmpdir(), "atomaton-stacked-env-"));
    try {
      writeFileSync(join(work, "parent-only.ts"), "the run's version\n");

      const refused = await sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 43, method: "tools/call", params: { name: "commit_and_push", arguments: { message: "the work" } } },
        stackedRunEnv(dir),
        work,
      );
      expect(refused.result.isError).toBe(true);
      expect(refused.result.content[0].text).toContain("parent-only.ts");

      const both = readFileSync(join(work, "parent-only.ts"), "utf8");
      expect(both).toContain("<<<<<<< ");
      expect(both).toContain("the parent's work");
      expect(both).toContain("the run's version");
    } finally {
      removeTemp(root);
      removeTemp(dir);
    }
  }, 60_000);

  /**
   * And the ordinary stacking path, where the parent's branch moved only in files this
   * run did not touch: the work is carried, the parent's versions win in those files,
   * and nothing is refused.
   */
  test("a run whose files the parent's branch did not move commits onto it unchanged", async () => {
    const { root, work } = makeStackedRunFixture();
    const dir = mkdtempSync(join(tmpdir(), "atomaton-stacked-env-"));
    try {
      writeFileSync(join(work, "touched.ts"), "the run's work\n");

      const committed = await sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 44, method: "tools/call", params: { name: "commit_and_push", arguments: { message: "the work" } } },
        stackedRunEnv(dir),
        work,
      );
      expect(committed.result.isError, committed.result.content?.[0]?.text).toBeFalsy();
      expect(JSON.parse(committed.result.content[0].text)).toMatchObject({ ok: true, committed: true, pushed: true });

      // The parent's version of the file `main` disagrees about, not `main`'s.
      const head = git(work, "rev-parse", "HEAD");
      expect(git(work, "ls-remote", "--heads", "origin", "refs/heads/atomaton/issue-1").split(/\s+/)[0]).toBe(head);
      git(work, "fetch", "origin", "refs/heads/atomaton/issue-1:refs/remotes/origin/atomaton/issue-1");
      expect(git(work, "show", "origin/atomaton/issue-1:diverged.ts")).toBe("parent");
      expect(git(work, "show", "origin/atomaton/issue-1:parent-only.ts")).toBe("the parent's work");
      expect(git(work, "show", "origin/atomaton/issue-1:touched.ts")).toBe("the run's work");
      // Nothing of the run's was left behind in a stash entry.
      expect(git(work, "stash", "list")).toBe("");
    } finally {
      removeTemp(root);
      removeTemp(dir);
    }
  }, 60_000);

  test("sync_branch reports divergence without rewriting local history", async () => {
    const { root, seed, work } = makeRemoteBranchFixture();
    try {
      advanceRemote(seed);
      git(work, "config", "user.name", "Atomaton Test");
      git(work, "config", "user.email", "atomaton@example.com");
      writeFileSync(join(work, "local.txt"), "local\n");
      git(work, "add", "local.txt");
      git(work, "commit", "-m", "local update");
      const localHead = git(work, "rev-parse", "HEAD");

      const response = await sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "sync_branch", arguments: {} } },
        { BRANCH: "atomaton/issue-1" },
        work,
      );
      const result = JSON.parse(response.result.content[0].text) as { status: string; ahead: number; behind: number };
      expect(result).toMatchObject({ status: "diverged", ahead: 1, behind: 1 });
      expect(git(work, "rev-parse", "HEAD")).toBe(localHead);
    } finally {
      removeTemp(root);
    }
  });

  /**
   * #264: a pull request whose base had moved ahead could be brought up to date by no
   * tool at all. `sync_branch` answers the other question -- this branch against its own
   * remote branch -- and the shell guard refused a raw merge by naming a tool set with
   * no merge in it, so the run that hit it built the merge out of `commit-tree` and
   * `update-ref`, where no ops log could see it.
   */
  test("merge_base_into_branch merges the base in and pushes the merge commit", async () => {
    const { root, seed, work } = makeMergeBaseFixture();
    const dir = mkdtempSync(join(tmpdir(), "atomaton-merge-base-env-"));
    try {
      const baseSha = commitOnMain(seed, "README.md", "readme, updated\n");
      const before = git(work, "rev-parse", "HEAD");

      const response = await sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 20, method: "tools/call", params: { name: "merge_base_into_branch", arguments: {} } },
        mergeBaseEnv(dir),
        work,
      );
      expect(response.result.isError, response.result.content?.[0]?.text).toBeFalsy();
      const result = JSON.parse(response.result.content[0].text) as {
        status: string; base: string; base_sha: string; commit: string;
      };
      expect(result).toMatchObject({ status: "merged", base: "main", base_sha: baseSha });

      // A merge commit: the branch's own work is the first parent, the base the second.
      const parents = git(work, "rev-list", "--parents", "-n", "1", "HEAD").split(/\s+/);
      expect(parents.length).toBe(3);
      expect(git(work, "rev-parse", "HEAD^1")).toBe(before);
      expect(git(work, "rev-parse", "HEAD^2")).toBe(baseSha);
      expect(git(work, "rev-parse", "HEAD")).toBe(result.commit);
      // Pushed, because a merge nobody can see is not a pull request that can merge.
      expect(git(work, "rev-parse", "origin/atomaton/issue-1")).toBe(result.commit);

      expect(opsLog(dir).find((entry) => entry.op === "merge_base_into_branch")).toMatchObject({
        status: "merged",
        base: "main",
        base_sha: baseSha,
      });
    } finally {
      removeTemp(root);
      removeTemp(dir);
    }
  }, 60_000);

  /**
   * #372: `actions/checkout` clones at depth 1 unless a workflow asks for more, so the
   * branch's own ancestry stops at the commit that was checked out. `git merge` then
   * finds no common ancestor and refuses with `fatal: refusing to merge unrelated
   * histories` — while GitHub has the merge base all along. The tool deepens the
   * checkout to where the merge base is and merges, rather than handing the run a
   * message about its own clone.
   */
  test("merge_base_into_branch deepens a depth-1 checkout rather than reporting unrelated histories", async () => {
    const { root, seed, work } = makeShallowMergeBaseFixture();
    const dir = mkdtempSync(join(tmpdir(), "atomaton-merge-base-env-"));
    try {
      expect(existsSync(join(work, ".git", "shallow"))).toBe(true);
      const baseSha = commitOnMain(seed, "README.md", "readme, updated\n");
      const before = git(work, "rev-parse", "HEAD");

      const response = await sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 26, method: "tools/call", params: { name: "merge_base_into_branch", arguments: {} } },
        mergeBaseEnv(dir),
        work,
      );
      expect(response.result.isError, response.result.content?.[0]?.text).toBeFalsy();
      const result = JSON.parse(response.result.content[0].text) as {
        status: string; base: string; base_sha: string; commit: string;
      };
      expect(result).toMatchObject({ status: "merged", base: "main", base_sha: baseSha });

      const parents = git(work, "rev-list", "--parents", "-n", "1", "HEAD").split(/\s+/);
      expect(parents.length).toBe(3);
      expect(git(work, "rev-parse", "HEAD^1")).toBe(before);
      expect(git(work, "rev-parse", "HEAD^2")).toBe(baseSha);
      expect(git(work, "rev-parse", "origin/atomaton/issue-1")).toBe(result.commit);
      expect(opsLog(dir).find((entry) => entry.op === "merge_base_into_branch")).toMatchObject({
        status: "merged",
        deepened: true,
      });
    } finally {
      removeTemp(root);
      removeTemp(dir);
    }
  }, 60_000);

  /**
   * The other half of the same truncation: on a depth-1 checkout `--is-ancestor` reads
   * history it does not have as "not an ancestor", so a base that is already in gets
   * merged again — or, with no merge base visible, fails instead. Nothing should be
   * committed when there is nothing to bring in.
   */
  test("merge_base_into_branch sees a base that is already an ancestor on a depth-1 checkout", async () => {
    const { root, work } = makeShallowMergeBaseFixture();
    const dir = mkdtempSync(join(tmpdir(), "atomaton-merge-base-env-"));
    try {
      const before = git(work, "rev-parse", "HEAD");

      const response = await sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 27, method: "tools/call", params: { name: "merge_base_into_branch", arguments: {} } },
        mergeBaseEnv(dir),
        work,
      );
      expect(response.result.isError, response.result.content?.[0]?.text).toBeFalsy();
      expect(JSON.parse(response.result.content[0].text)).toMatchObject({ status: "up_to_date" });
      expect(git(work, "rev-parse", "HEAD")).toBe(before);
      expect(existsSync(join(work, ".git", "MERGE_HEAD"))).toBe(false);
    } finally {
      removeTemp(root);
      removeTemp(dir);
    }
  }, 60_000);

  /**
   * A merge base that really is absent is the tool's to say plainly. git's own
   * `refusing to merge unrelated histories` is true of the branches here, and the run
   * should hear that with nothing half-done behind it.
   */
  test("merge_base_into_branch names a genuinely missing merge base and merges nothing", async () => {
    const { root, seed, work } = makeMergeBaseFixture();
    const dir = mkdtempSync(join(tmpdir(), "atomaton-merge-base-env-"));
    try {
      // `main` rewritten to an unrelated root: the one case where no common ancestor
      // exists in any checkout.
      git(seed, "checkout", "--orphan", "rewritten");
      git(seed, "rm", "-rf", ".");
      writeFileSync(join(seed, "README.md"), "an unrelated root\n");
      git(seed, "add", "README.md");
      git(seed, "commit", "-m", "a rewritten main");
      git(seed, "push", "-f", "origin", "rewritten:main");
      // The rewritten base is not a fast-forward, and the tool fetches the base with a
      // refspec that is not forced: without dropping the stale copy, this would fail on
      // the fetch and never reach the question the test is about.
      git(work, "update-ref", "-d", "refs/remotes/origin/main");
      const before = git(work, "rev-parse", "HEAD");

      const response = await sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 28, method: "tools/call", params: { name: "merge_base_into_branch", arguments: {} } },
        mergeBaseEnv(dir),
        work,
      );
      expect(response.result.isError).toBe(true);
      expect(response.result.content[0].text).toContain("share no common ancestor");
      expect(git(work, "rev-parse", "HEAD")).toBe(before);
      expect(existsSync(join(work, ".git", "MERGE_HEAD"))).toBe(false);
    } finally {
      removeTemp(root);
      removeTemp(dir);
    }
  }, 60_000);

  test("merge_base_into_branch reports a base that is already an ancestor", async () => {
    const { root, work } = makeMergeBaseFixture();
    const dir = mkdtempSync(join(tmpdir(), "atomaton-merge-base-env-"));
    try {
      const before = git(work, "rev-parse", "HEAD");

      const response = await sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 21, method: "tools/call", params: { name: "merge_base_into_branch", arguments: {} } },
        mergeBaseEnv(dir),
        work,
      );
      const result = JSON.parse(response.result.content[0].text) as { status: string };
      expect(result.status).toBe("up_to_date");
      expect(git(work, "rev-parse", "HEAD")).toBe(before);
      expect(opsLog(dir).find((entry) => entry.op === "merge_base_into_branch")).toMatchObject({
        status: "up_to_date",
      });
    } finally {
      removeTemp(root);
      removeTemp(dir);
    }
  }, 60_000);

  /**
   * A pull request run has no issue to resolve the tree from: its `NUMBER` is the pull
   * request, and the base that pull request aims at is the branch it has to take in.
   * Reading it from the pull request is what keeps a stacked pull request bringing in
   * its parent's branch rather than the release branch underneath it.
   */
  test("a pull request run brings in the base its own pull request aims at", async () => {
    const { root, seed, work } = makeMergeBaseFixture();
    const dir = mkdtempSync(join(tmpdir(), "atomaton-merge-base-env-"));
    try {
      git(seed, "checkout", "-b", "atomaton/issue-12");
      writeFileSync(join(seed, "README.md"), "the parent moved on\n");
      git(seed, "add", "README.md");
      git(seed, "commit", "-m", "parent update");
      git(seed, "push", "origin", "atomaton/issue-12");
      const parentSha = git(seed, "rev-parse", "HEAD");

      const response = await sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 25, method: "tools/call", params: { name: "merge_base_into_branch", arguments: {} } },
        {
          TYPE: "pr",
          NUMBER: "7",
          BRANCH: "atomaton/issue-1",
          ATOMATON_OPS_LOG: join(dir, "ops.log"),
          FAKE_GH_LOG: join(dir, "gh.log"),
          ...fakeGhSeam(),
          FAKE_GH_RESPONSES: JSON.stringify([
            { match: ["pr", "view"], stdout: JSON.stringify({ baseRefName: "atomaton/issue-12" }) },
            { match: ["pr", "list"], stdout: "[]" },
          ]),
        },
        work,
      );
      expect(response.result.isError, response.result.content?.[0]?.text).toBeFalsy();
      expect(JSON.parse(response.result.content[0].text)).toMatchObject({
        status: "merged",
        base: "atomaton/issue-12",
        base_sha: parentSha,
      });
    } finally {
      removeTemp(root);
      removeTemp(dir);
    }
  }, 60_000);

  /**
   * A conflict is the agent's to decide, not the tool's. Nothing is committed, the
   * markers are left where the agent will read them, and `commit_and_push` is what
   * closes the merge -- refusing until the path is declared in `resolved_paths`, because
   * `git add -A` would otherwise mark it resolved and commit whatever is in the file.
   */
  test("a conflict is left in the worktree, committed by nobody but the agent", async () => {
    const { root, seed, work } = makeMergeBaseFixture();
    const dir = mkdtempSync(join(tmpdir(), "atomaton-merge-base-env-"));
    try {
      const branchHead = commitOnWork(work, "shared.txt", "from the branch\n");
      const baseSha = commitOnMain(seed, "shared.txt", "from the base\n");

      const conflicted = await sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 22, method: "tools/call", params: { name: "merge_base_into_branch", arguments: {} } },
        mergeBaseEnv(dir),
        work,
      );
      expect(conflicted.result.isError, conflicted.result.content?.[0]?.text).toBeFalsy();
      const result = JSON.parse(conflicted.result.content[0].text) as { status: string; files: string[]; base_sha: string; note: string };
      expect(result).toMatchObject({ status: "conflicts", base_sha: baseSha });
      expect(result.files).toContain("shared.txt");
      // The note says how a conflict is closed now: a declaration, and both sides in the
      // index -- the same route a binary takes, since it can hold no markers.
      expect(result.note).toContain("resolved_paths");
      expect(result.note).toContain(":3:");
      // Nothing was committed, and the markers are in the file for the agent to read.
      expect(git(work, "rev-parse", "HEAD")).toBe(branchHead);
      expect(readFileSync(join(work, "shared.txt"), "utf8")).toContain("<<<<<<<");
      expect(git(work, "rev-parse", "-q", "--verify", "MERGE_HEAD")).toBe(baseSha);
      expect(opsLog(dir).find((entry) => entry.op === "merge_base_into_branch")).toMatchObject({
        status: "conflicts",
        base: "main",
      });

      const refused = await sendRequest(
        "github.ts",
        {
          jsonrpc: "2.0", id: 23, method: "tools/call",
          params: { name: "commit_and_push", arguments: { message: "resolve the conflict" } },
        },
        mergeBaseEnv(dir),
        work,
      );
      expect(refused.result.isError).toBe(true);
      expect(refused.result.content[0].text).toContain("shared.txt");
      // Both sides are named where they are, not as markers: a binary holds none.
      expect(refused.result.content[0].text).toContain(":2:");
      expect(refused.result.content[0].text).toContain(":3:");
      expect(git(work, "rev-parse", "HEAD")).toBe(branchHead);

      writeFileSync(join(work, "shared.txt"), "from the branch, and the base\n");
      const closed = await sendRequest(
        "github.ts",
        {
          jsonrpc: "2.0", id: 24, method: "tools/call",
          params: {
            name: "commit_and_push",
            arguments: { message: "resolve the conflict", resolved_paths: ["shared.txt"] },
          },
        },
        mergeBaseEnv(dir),
        work,
      );
      expect(closed.result.isError, closed.result.content?.[0]?.text).toBeFalsy();
      expect(JSON.parse(closed.result.content[0].text)).toMatchObject({ ok: true, committed: true, merge_head: baseSha });

      // Closed as a merge commit, not as a plain commit that happens to have the base's
      // tree: both parents are there, and the message says what was taken in.
      const parents = git(work, "rev-list", "--parents", "-n", "1", "HEAD").split(/\s+/);
      expect(parents.length).toBe(3);
      expect(git(work, "rev-parse", "HEAD^2")).toBe(baseSha);
      const message = git(work, "log", "-1", "--format=%B");
      expect(message).toContain("resolve the conflict");
      expect(message).toContain("Merge base branch 'main'");
      expect(message).toContain(baseSha.slice(0, 12));
      // ...and it reached origin, so the pull request's head is current.
      expect(git(work, "rev-parse", "origin/atomaton/issue-1")).toBe(git(work, "rev-parse", "HEAD"));
    } finally {
      removeTemp(root);
      removeTemp(dir);
    }
  }, 60_000);

  test("create_sub_issue rejects malformed gh output", async () => {
    const r = await sendRequest(
      "github.ts",
      {
        jsonrpc: "2.0", id: 3, method: "tools/call",
        params: { name: "create_sub_issue", arguments: { title: "Test" } },
      },
      {
        ...fakeGhSeam(),
        // A run on an issue, because a sub-issue needs a parent to be linked under.
        NUMBER: "1",
        FAKE_GH_RESPONSES: JSON.stringify([{ match: ["issue", "create"], stdout: "not-a-url" }]),
      },
    );
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("gh issue create: unexpected output");
  });

  /**
   * The sibling of the test above, for the tool whose whole purpose is having no
   * parent. Nothing is linked, so nothing has to be resolved first.
   */
  test("create_root_issue rejects malformed gh output", async () => {
    const r = await sendRequest(
      "github.ts",
      {
        jsonrpc: "2.0", id: 3, method: "tools/call",
        params: { name: "create_root_issue", arguments: { title: "Test" } },
      },
      {
        ...fakeGhSeam(),
        FAKE_GH_RESPONSES: JSON.stringify([{ match: ["issue", "create"], stdout: "not-a-url" }]),
      },
    );
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("gh issue create: unexpected output");
  });

  /**
   * The tag decides who hears about this work, so an agent that can write it can
   * redirect the report of its own failure or address it to a name nobody reads.
   * `create_pr` refused this and the issue-creating tools did not, and the asymmetry
   * mattered most exactly when the requester was unknown -- with no machine tag to win
   * the first match, the agent's was the only one in the body.
   */
  /**
   * Agent prose landing where people read gets its mentions checked.
   *
   * Written against `submit_pr_review`, which was the one such place that had never
   * had the check and the likeliest to name somebody. That tool is gone -- a review
   * the shared identity cannot approve or request changes on said the same thing as
   * the run's final message -- so the same property is held here on a body that is
   * still written.
   */
  test("a body an agent writes escapes a mention it cannot vouch for", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-body-mentions-"));
    const log = join(dir, "gh.log");
    try {
      await sendRequest(
        "github.ts",
        {
          jsonrpc: "2.0", id: 41, method: "tools/call",
          params: {
            name: "create_sub_issue",
            arguments: { title: "A defect", body: "Looks right. @torvalds should see this." },
          },
        },
        {
          ...fakeGhSeam(),
          NUMBER: "1",
          FAKE_GH_LOG: log,
          FAKE_GH_RESPONSES: JSON.stringify([
            { match: ["issue", "create"], stdout: "https://github.com/o/r/issues/7" },
            // The link has to succeed for the call to succeed: a sub-issue whose parent
            // could not be recorded is a failed call, which is the whole of #182.
            { match: ["graphql"], stdout: JSON.stringify({ data: { repository: { issue: { id: "I_x" } } } }) },
          ]),
        },
      );
      // The argv as issued, rather than the log as text: what matters is the string gh
      // was handed, and reading it back through JSON is how every other test here does it.
      // The element AFTER `--body`: the sub-issue label is appended after the body, and
      // `gh label create` runs first and carries no `--body`.
      const calls = readFileSync(log, "utf8")
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line) as string[]);
      const create = calls.find((argv) => argv.includes("--body"));
      const body = create ? (create[create.indexOf("--body") + 1] ?? "") : "";
      // Backticked, so GitHub sends no notification and the name still reads.
      expect(body).toContain("Looks right. `@torvalds` should see this.");
      // And the notice the other three paths add, so a person reading the review can see
      // that a mention was intended and did not happen.
      expect(body).toContain("had the notification removed");
    } finally {
      removeTemp(dir);
    }
  });

  test("create_sub_issue refuses a body that already names who to notify", async () => {
    const r = await sendRequest(
      "github.ts",
      {
        jsonrpc: "2.0", id: 31, method: "tools/call",
        params: {
          name: "create_sub_issue",
          arguments: { title: "Test", body: "<!-- atomaton:notify=someone-else -->" },
        },
      },
      {
        ...fakeGhSeam(),
        NUMBER: "1",
        FAKE_GH_RESPONSES: JSON.stringify([{ match: ["issue", "create"], stdout: "https://github.com/o/r/issues/1" }]),
      },
    );
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("already contains a notify tag");
  });

  /**
   * A command on a line of its own is a request from someone entitled to make it, and
   * a body an agent wrote is not one — but the next reader takes it for one:
   * `resolve_entry_agent.ts` reads an issue body for the agent to start, and
   * `extract_directive.ts` reads a pull request body the same way. So an agent writing
   * `/engineer` into a body would start a run by accident.
   */
  test("create_sub_issue refuses a body carrying a command on its own line", async () => {
    const r = await sendRequest(
      "github.ts",
      {
        jsonrpc: "2.0", id: 32, method: "tools/call",
        params: {
          name: "create_sub_issue",
          arguments: { title: "Test", body: "Do the thing.\n\n/engineer" },
        },
      },
      {
        ...fakeGhSeam(),
        NUMBER: "1",
        FAKE_GH_RESPONSES: JSON.stringify([{ match: ["issue", "create"], stdout: "https://github.com/o/r/issues/1" }]),
      },
    );
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("/engineer");
    expect(r.result.content[0].text).toContain("launch_sub_agent");
  });

  // The point of "on a line of its own": prose that mentions a command is not one.
  test("create_sub_issue allows a command mentioned inside a sentence", async () => {
    const r = await sendRequest(
      "github.ts",
      {
        jsonrpc: "2.0", id: 33, method: "tools/call",
        params: {
          name: "create_sub_issue",
          arguments: { title: "Test", body: "Comment /engineer to start one." },
        },
      },
      {
        ...fakeGhSeam(),
        NUMBER: "1",
        FAKE_GH_RESPONSES: JSON.stringify([
          { match: ["issue", "create"], stdout: "https://github.com/o/r/issues/1" },
          { match: ["graphql"], stdout: JSON.stringify({ data: { repository: { issue: { id: "I_x" } } } }) },
        ]),
      },
    );
    expect(r.result.isError).toBe(false);
  });

  /**
   * A pull request run reviews or fixes one pull request; it does not decompose work.
   * `NUMBER` on such a run is the pull request's own number, so a sub-issue created
   * here would hang under a node that was never decomposing anything -- and the pull
   * request's `atomaton/in-progress` guard would be held by a chain that had moved
   * elsewhere.
   */
  test("create_sub_issue refuses on a pull request run", async () => {
    const r = await sendRequest(
      "github.ts",
      {
        jsonrpc: "2.0", id: 34, method: "tools/call",
        params: { name: "create_sub_issue", arguments: { title: "Child task" } },
      },
      {
        ...fakeGhSeam(),
        TYPE: "pr",
        NUMBER: "21",
        FAKE_GH_RESPONSES: JSON.stringify([{ match: ["issue", "create"], stdout: "https://github.com/o/r/issues/1" }]),
      },
    );
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("pull request");
    // And is pointed at the tool that does work here, rather than left with no route.
    expect(r.result.content[0].text).toContain("create_root_issue");
  });

  test("create_sub_issue provisions the sub-issue label before creating a child", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-create-sub-issue-"));
    const log = join(dir, "gh.log");
    try {
      const response = await sendRequest(
        "github.ts",
        {
          jsonrpc: "2.0", id: 4, method: "tools/call",
          params: { name: "create_sub_issue", arguments: { title: "Child task" } },
        },
        {
          ...fakeGhSeam(),
          NUMBER: "3",
          FAKE_GH_LOG: log,
          FAKE_GH_RESPONSES: JSON.stringify([
            { match: ["label", "create", "atomaton/sub-issue"] },
            { match: ["issue", "create"], stdout: "https://github.com/owner/repo/issues/12" },
            { match: ["graphql"], stdout: JSON.stringify({ data: { repository: { issue: { id: "I_x" } } } }) },
          ]),
        },
      );
      expect(response.result.isError, response.result.content?.[0]?.text).toBeFalsy();
      const calls = readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line) as string[]);
      const label = calls.find((argv) => argv[0] === "label" && argv[1] === "create");
      expect(label, "the sub-issue label has to exist before it can be applied").toBeDefined();
      expect(label).toContain("--force");
      const created = calls.find((argv) => argv[0] === "issue" && argv[1] === "create");
      expect(created, "the child issue itself").toBeDefined();
      expect(created).toContain("atomaton/sub-issue");
      // And the link, which is now the only record of the edge (#182).
      const link = calls.find((argv) => argv.some((a) => a.includes("addSubIssue")));
      expect(link, "a sub-issue has to be linked under the issue the run is on").toBeDefined();
    } finally {
      removeTemp(dir);
    }
  });

  /**
   * A sub-issue with no parent is not a sub-issue.
   *
   * This used to succeed and file a `note` saying nothing would aggregate the issue --
   * an issue wearing the sub-issue label, counted as a sibling, and belonging to no
   * tree. Creating something outside the tree is `create_root_issue`'s job now, so the
   * refusal names it instead of producing the half-made issue.
   */
  test("create_sub_issue refuses when this run has no issue to link under", async () => {
    const r = await sendRequest(
      "github.ts",
      {
        jsonrpc: "2.0", id: 36, method: "tools/call",
        params: { name: "create_sub_issue", arguments: { title: "Orphan" } },
      },
      {
        ...fakeGhSeam(),
        FAKE_GH_RESPONSES: JSON.stringify([{ match: ["issue", "create"], stdout: "https://github.com/o/r/issues/1" }]),
      },
    );
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("create_root_issue");
  });

  /**
   * The root tool, on both run types.
   *
   * It is the one creating tool a pull request run may call, and that is the point of
   * it: #178/#179/#192 are three runs that found a defect in the tools, read the
   * prompt telling them to file one, and were refused by the only tool that could --
   * with nowhere else to put it. Nothing about an issue with no parent reproduces the
   * reasons `create_sub_issue` refuses on a pull request run.
   *
   * `label create` and `addSubIssue` are asserted absent from the argv actually issued,
   * not merely from the result: the label is what `countOpenSiblings` counts, so a root
   * issue wearing it corrupts the aggregation of a parent it does not have.
   */
  for (const [runType, article] of [["issue", "an"], ["pr", "a"]] as const) {
    test(`create_root_issue creates an unlabelled, unlinked issue on ${article} ${runType} run`, async () => {
      const dir = mkdtempSync(join(tmpdir(), `atomaton-create-root-${runType}-`));
      const log = join(dir, "gh.log");
      try {
        const response = await sendRequest(
          "github.ts",
          {
            jsonrpc: "2.0", id: 4, method: "tools/call",
            params: { name: "create_root_issue", arguments: { title: "A defect in the search server" } },
          },
          {
            ...fakeGhSeam(),
            TYPE: runType,
            NUMBER: "21",
            FAKE_GH_LOG: log,
            FAKE_GH_RESPONSES: JSON.stringify([{ match: ["issue", "create"], stdout: "https://github.com/owner/repo/issues/13" }]),
          },
        );
        expect(response.result.isError, response.result.content?.[0]?.text).toBeFalsy();
        expect(JSON.parse(response.result.content[0].text)).toMatchObject({
          number: 13,
          parent: null,
          root: true,
        });

        const calls = readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line) as string[]);
        expect(calls.some((argv) => argv[0] === "label" && argv[1] === "create"), "a root issue carries no sub-issue label").toBe(false);
        expect(calls.some((argv) => argv.some((a) => a.includes("addSubIssue"))), "a root issue has no parent to link").toBe(false);
        expect(calls.some((argv) => argv[0] === "issue" && argv[1] === "create")).toBe(true);
        expect(calls.flat().join(" ")).not.toContain("atomaton/sub-issue");
      } finally {
        removeTemp(dir);
      }
    });
  }

  // The acceptance criterion holds for every input, not just the default one: a caller
  // who names the sub-issue label on a root issue would otherwise get an issue that
  // `countOpenSiblings` counts among a parent's children with no edge to that parent.
  test("create_root_issue refuses the sub-issue label", async () => {
    const r = await sendRequest(
      "github.ts",
      {
        jsonrpc: "2.0", id: 37, method: "tools/call",
        params: {
          name: "create_root_issue",
          arguments: { title: "Orphan", labels: ["atomaton/sub-issue"] },
        },
      },
      {
        ...fakeGhSeam(),
        FAKE_GH_RESPONSES: JSON.stringify([{ match: ["issue", "create"], stdout: "https://github.com/o/r/issues/1" }]),
      },
    );
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("atomaton/sub-issue");
    expect(r.result.content[0].text).toContain("create_sub_issue");
  });

  test("create_root_issue refuses a body that already names who to notify", async () => {
    const r = await sendRequest(
      "github.ts",
      {
        jsonrpc: "2.0", id: 31, method: "tools/call",
        params: {
          name: "create_root_issue",
          arguments: { title: "Test", body: "<!-- atomaton:notify=someone-else -->" },
        },
      },
      {
        ...fakeGhSeam(),
        FAKE_GH_RESPONSES: JSON.stringify([{ match: ["issue", "create"], stdout: "https://github.com/o/r/issues/1" }]),
      },
    );
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("already contains a notify tag");
  });

  test("create_root_issue refuses a body carrying a command on its own line", async () => {
    const r = await sendRequest(
      "github.ts",
      {
        jsonrpc: "2.0", id: 32, method: "tools/call",
        params: {
          name: "create_root_issue",
          arguments: { title: "Test", body: "Do the thing.\n\n/engineer" },
        },
      },
      {
        ...fakeGhSeam(),
        FAKE_GH_RESPONSES: JSON.stringify([{ match: ["issue", "create"], stdout: "https://github.com/o/r/issues/1" }]),
      },
    );
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("/engineer");
  });

  test("create_root_issue escapes a mention it cannot vouch for", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-root-mentions-"));
    const log = join(dir, "gh.log");
    try {
      await sendRequest(
        "github.ts",
        {
          jsonrpc: "2.0", id: 41, method: "tools/call",
          params: {
            name: "create_root_issue",
            arguments: { title: "A defect", body: "Looks right. @torvalds should see this." },
          },
        },
        {
          ...fakeGhSeam(),
          NUMBER: "21",
          FAKE_GH_LOG: log,
          FAKE_GH_RESPONSES: JSON.stringify([{ match: ["issue", "create"], stdout: "https://github.com/o/r/issues/7" }]),
        },
      );
      const calls = readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line) as string[]);
      const create = calls.find((argv) => argv.includes("--body"));
      const body = create ? (create[create.indexOf("--body") + 1] ?? "") : "";
      expect(body).toContain("Looks right. `@torvalds` should see this.");
      expect(body).toContain("had the notification removed");
    } finally {
      removeTemp(dir);
    }
  });

  /**
   * The readers built on `gh api` returned the response whole.
   *
   * That is not a small waste. A tool result joins the session on the
   * `atomaton-data` branch and is resent on every later inference in it, so an
   * unread field is rent charged for the rest of the issue's life. Measured on
   * this repository before these projections existed: `get_check_runs` returned
   * 24,954 bytes for eight check runs, of which the `app` object was 2,244 bytes
   * PER RUN -- the same GitHub App description eight times -- and `get_branch`
   * returned 11,614 bytes to say a branch exists, 11,164 of it the head commit
   * object nobody asked for.
   *
   * The fixtures below carry the real field names from those payloads, so a
   * rename upstream shows up here rather than as a projection that silently
   * returns nothing.
   */
  describe("projections", () => {
    const call = (
      name: string,
      args: Record<string, unknown>,
      responses: unknown[],
      extraEnv: Record<string, string> = {},
    ) =>
      sendRequest(
        "github.ts",
        { jsonrpc: "2.0", id: 40, method: "tools/call", params: { name, arguments: args } },
        {
          ...fakeGhSeam(),
          FAKE_GH_RESPONSES: JSON.stringify(responses),
          ...extraEnv,
        },
      );

    /**
     * A stacked merge's answer has to say so, and it has to be ready under the
     * DEFAULT policy. `merge.policy`, `merge.governed_paths` and `merge.gates` all
     * describe the merge into the base branch; a sub-issue's pull request merges
     * into its parent issue's branch, which is a checkpoint rather than a delivery,
     * and the parent's own pull request is judged against all three on the whole
     * aggregate. Under the default `manual` the old answer stopped every child for a
     * person — five children, five human merges before the parent could be judged.
     */
    test("check_merge_readiness says a stacked merge skipped the delivery checks", async () => {
      const configDir = makeConfigDir({});
      try {
        const r = await call(
          "check_merge_readiness",
          {},
          [
            {
              match: ["pr", "view", "802", "isDraft,author"],
              stdout: JSON.stringify({
                isDraft: false,
                author: { is_bot: true },
                state: "OPEN",
                headRefOid: "abc123",
                headRefName: "atomaton/issue-300",
                baseRefName: "atomaton/issue-300",
                title: "Deliver #300",
                labels: [],
              }),
            },
            { match: ["pr", "view", "802", "mergeStateStatus"], stdout: JSON.stringify({ mergeStateStatus: "CLEAN" }) },
            { match: ["commits/abc123/check-runs"], stdout: JSON.stringify({ check_runs: [] }) },
            { match: ["actions/runs?head_sha=abc123"], stdout: JSON.stringify({ workflow_runs: [] }) },
            { match: ["rules/branches/atomaton/issue-300"], stdout: "[]" },
            { match: ["pulls/802/files"], stdout: "" },
          ],
          { TYPE: "pr", NUMBER: "802", ATOMATON_MACHINERY_ROOT: configDir },
        );
        const answer = JSON.parse(r.result.content[0].text) as {
          ready: boolean;
          blockers: { kind: string }[];
          stacked_merge: boolean;
          stacked_merge_note?: string;
        };
        // No config sets `merge.policy`, so it is `manual`: the delivery merge this
        // fixture describes would stop here, and the stacked one does not.
        expect(answer.blockers).toEqual([]);
        expect(answer.ready).toBe(true);
        expect(answer.stacked_merge).toBe(true);
        expect(answer.stacked_merge_note).toContain("atomaton/issue-300");
      } finally {
        removeTemp(configDir);
      }
    });

    /**
     * The reviewer's first readiness call on a fresh head, which is the window the
     * required context does not cover.
     *
     * `atomaton-check` is registered by the job that runs it, so early in a validation
     * run the commit carries the workflow run and no check run of that name. Answered
     * as a missing check it dispatched a second identical run against the same head,
     * so the review's own first call doubled the work it was waiting on. The answer is
     * `checks-pending` and nothing is dispatched — the dispatch rule would otherwise
     * have fired, which the `workflow run` rule below makes visible rather than
     * letting a failed dispatch stand in for a skipped one.
     */
    test("a required context that has not registered yet is pending, and dispatches nothing", async () => {
      const configDir = makeConfigDir({ merge: { policy: "auto" } });
      const dir = mkdtempSync(join(tmpdir(), "atomaton-readiness-inflight-"));
      const log = join(dir, "gh.log");
      try {
        const r = await call(
          "check_merge_readiness",
          {},
          [
            {
              match: ["pr", "view", "802", "isDraft,author"],
              stdout: JSON.stringify({
                isDraft: false,
                author: { is_bot: true },
                state: "OPEN",
                headRefOid: "abc123",
                headRefName: "atomaton/issue-300",
                baseRefName: "main",
                title: "Deliver #300",
                labels: [],
              }),
            },
            { match: ["pr", "view", "802", "mergeStateStatus"], stdout: JSON.stringify({ mergeStateStatus: "BLOCKED" }) },
            { match: ["commits/abc123/check-runs"], stdout: JSON.stringify({ check_runs: [] }) },
            {
              match: ["actions/runs?head_sha=abc123"],
              stdout: JSON.stringify({ workflow_runs: [{ name: "pull-request-checks", status: "in_progress" }] }),
            },
            {
              match: ["rules/branches/main"],
              stdout: JSON.stringify([
                {
                  type: "required_status_checks",
                  parameters: { required_status_checks: [{ context: "atomaton-check" }] },
                },
              ]),
            },
            { match: ["pulls/802/files"], stdout: "" },
            { match: ["workflow", "run"], stdout: "" },
          ],
          { TYPE: "pr", NUMBER: "802", ATOMATON_MACHINERY_ROOT: configDir, FAKE_GH_LOG: log },
        );
        const answer = JSON.parse(r.result.content[0].text) as {
          blockers: { kind: string; detail: string }[];
          ci_dispatched: boolean;
        };
        expect(answer.blockers.map((b) => b.kind)).toEqual(["checks-pending"]);
        expect(answer.blockers[0]?.detail).toContain('workflow run "pull-request-checks" (in_progress)');
        expect(answer.ci_dispatched).toBe(false);
        expect(readFileSync(log, "utf8")).not.toContain("workflow");
      } finally {
        removeTemp(dir);
        removeTemp(configDir);
      }
    });

    test("get_check_runs keeps what a reader acts on and drops the rest", async () => {
      const payload = {
        check_runs: [
          {
            id: 1,
            name: "atomaton-check",
            node_id: "CR_x",
            head_sha: "abc",
            external_id: "e",
            url: "https://api.github.com/x",
            html_url: "https://github.com/owner/repo/actions/runs/1/job/2",
            details_url: "https://github.com/owner/repo/actions/runs/1/job/2",
            status: "completed",
            conclusion: "success",
            started_at: "2026-01-01T00:00:00Z",
            completed_at: "2026-01-01T00:01:00Z",
            output: { title: null, summary: null, text: null },
            check_suite: { id: 9 },
            app: { id: 15368, slug: "github-actions", description: "x".repeat(2000) },
            pull_requests: [{ id: 7 }],
          },
        ],
      };
      const r = await call("get_check_runs", { ref: "abc" }, [
        { match: ["check-runs"], stdout: JSON.stringify(payload) },
      ]);
      const runs = JSON.parse(r.result.content[0].text);
      expect(runs).toEqual([
        {
          name: "atomaton-check",
          status: "completed",
          conclusion: "success",
          html_url: "https://github.com/owner/repo/actions/runs/1/job/2",
        },
      ]);
      // The 2KB App description is the whole point of the projection.
      expect(r.result.content[0].text).not.toContain("xxxx");
    });

    test("get_branch answers the question without the head commit object", async () => {
      const payload = {
        name: "main",
        commit: { sha: "deadbeef", commit: { message: "m".repeat(4000) }, author: { login: "a" } },
        _links: { self: "u" },
        protected: true,
        protection: { enabled: true },
        protection_url: "u",
      };
      // `branch`, the one name this tool declares. It used to be called with `name`
      // here, exercising a synonym table that folded that in before the schema saw it;
      // the table is gone -- see `adapters/mcp/mcp-tool.ts`.
      const r = await call("get_branch", { branch: "main" }, [
        { match: ["branches/main"], stdout: JSON.stringify(payload) },
      ]);
      expect(JSON.parse(r.result.content[0].text)).toEqual({
        branch: "main",
        exists: true,
        sha: "deadbeef",
        protected: true,
      });
      expect(r.result.content[0].text).not.toContain("mmmm");
    });

    /**
     * The branch that is not there.
     *
     * Six recorded calls asked about `atomaton/issue-104`, `atomaton/issue-190` and
     * `atomaton/issue-219` before creating them, and every one was charged an error for
     * asking a question this tool exists to answer. The property is that a missing
     * branch is a result -- not the exact wording of the field, which a later reader
     * may well improve.
     */
    test("a branch that does not exist is an answer, not an error", async () => {
      const r = await call("get_branch", { branch: "atomaton/issue-104" }, [
        { match: ["branches/atomaton/issue-104"], code: 1, stdout: "gh: Branch not found (HTTP 404)" },
      ]);
      expect(r.result.isError).toBe(false);
      expect(JSON.parse(r.result.content[0].text)).toEqual({ branch: "atomaton/issue-104", exists: false });
    });

    /**
     * A 404 is an answer; anything else is the absence of one. Reporting "no such
     * branch" because GitHub was down would be a confident wrong answer in exactly the
     * place a caller is deciding whether to create something.
     */
    test("a server error is still an error, not a missing branch", async () => {
      const r = await call("get_branch", { branch: "main" }, [
        { match: ["branches/main"], code: 1, stdout: "gh: Server Error (HTTP 500)" },
      ]);
      expect(r.result.isError).toBe(true);
      expect(r.result.content[0].text).not.toContain("exists");
    });

    /**
     * `merge_pr` takes no number: the pull request it merges is the node the run
     * sits on. On an issue run there is nothing to name and nothing to guess — the
     * refusal names the run's own node and the route a merge actually takes,
     * because a refusal that says what to do next is followed and one that only
     * restates a rule is not.
     */
    test("merge_pr on an issue run is refused, with the node named", async () => {
      const r = await sendRequest(
        "github.ts",
        {
          jsonrpc: "2.0", id: 44, method: "tools/call",
          params: { name: "merge_pr", arguments: {} },
        },
        {
          ...fakeGhSeam(),
          FAKE_GH_RESPONSES: "[]",
          TYPE: "issue",
          NUMBER: "305",
        },
      );
      expect(r.result.isError).toBe(true);
      expect(r.result.content[0].text).toContain("305");
      expect(r.result.content[0].text).toContain("reviewer");
    });

    /**
     * The other half of "no number": the run's own node is what it asks about.
     * No merge fixtures — the gate's first read fails and the call errors — but
     * the log shows WHICH pull request was asked about first, and it is the node
     * the environment named. Under the old env that number was the parent issue
     * the session is keyed to, which is exactly the #248 conflation.
     */
    test("merge_pr on a pull request run asks about the run's own pull request", async () => {
      const dir = mkdtempSync(join(tmpdir(), "atomaton-merge-node-"));
      const log = join(dir, "gh.log");
      try {
        await sendRequest(
          "github.ts",
          {
            jsonrpc: "2.0", id: 46, method: "tools/call",
            params: { name: "merge_pr", arguments: {} },
          },
          {
            ...fakeGhSeam(),
            FAKE_GH_LOG: log,
            FAKE_GH_RESPONSES: "[]",
            TYPE: "pr",
            NUMBER: "802",
          },
        );
        const calls = readFileSync(log, "utf8")
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line) as string[]);
        expect(calls.length, "the merge gate read something before it failed").toBeGreaterThan(0);
        expect(calls[0]!.some((a) => a.includes("802")), JSON.stringify(calls[0])).toBe(true);
      } finally {
        removeTemp(dir);
      }
    });

    /**
     * The full route the reviewer takes on every agent merge: the gate passes, the
     * merge lands, the body's parent tag resolves, and `dispatchPostMergeAgent`
     * wakes the delivered issue's agent. That dispatch is this run's own conclusion
     * — it must reach the ops log as `"op":"dispatch"`, which is what
     * `chain_continues` greps, or the merged pull request's result comment claims
     * "No agent will be automatically executed next" while a run has just been
     * started. Before the node env was renamed the node comparison stumbled into
     * this by accident (#259); the flag makes it explicit, and this test is the
     * route's only coverage.
     */
    test("merge_pr's post-merge restart is recorded as the chain continuing", async () => {
      const dir = mkdtempSync(join(tmpdir(), "atomaton-merge-chain-"));
      const opsLog = join(dir, "ops.log");
      const ghLog = join(dir, "gh.log");
      const configDir = makeConfigDir({ merge: { policy: "auto" } });
      try {
        const r = await sendRequest(
          "github.ts",
          {
            jsonrpc: "2.0", id: 47, method: "tools/call",
            params: { name: "merge_pr", arguments: {} },
          },
          {
            ...fakeGhSeam(),
            GITHUB_REPOSITORY: "owner/repo",
            TYPE: "pr",
            NUMBER: "802",
            ATOMATON_OPS_LOG: opsLog,
            ATOMATON_MACHINERY_ROOT: configDir,
            FAKE_GH_LOG: ghLog,
            FAKE_GH_RESPONSES: JSON.stringify([
              // The merge gate. The base branch is an issue branch, so the merge's
              // own CD dispatch is skipped (a sub-issue's merge never deploys).
              {
                match: ["pr", "view", "802", "isDraft,author"],
                stdout: JSON.stringify({
                  isDraft: false,
                  author: { is_bot: true, login: "engineer" },
                  state: "OPEN",
                  headRefOid: "abc123",
                  headRefName: "atomaton/issue-300",
                  baseRefName: "atomaton/issue-300",
                  title: "Deliver #300",
                  labels: [],
                }),
              },
              { match: ["pr", "view", "802", "mergeStateStatus"], stdout: JSON.stringify({ mergeStateStatus: "CLEAN" }) },
              {
                match: ["commits/abc123/check-runs"],
                stdout: JSON.stringify({ check_runs: [{ name: "validate", status: "completed", conclusion: "success" }] }),
              },
              { match: ["actions/runs?head_sha=abc123"], stdout: JSON.stringify({ workflow_runs: [] }) },
              { match: ["rules/branches/atomaton/issue-300"], stdout: "[]" },
              { match: ["pulls/802/files"], stdout: "" },
              // The merge, the branch deletion, and the body read for the handoff.
              { match: ["pr", "merge", "802"], stdout: "" },
              { match: ["git/refs/heads/atomaton/issue-300"], stdout: "" },
              {
                match: ["pr", "view", "802", "body"],
                stdout: JSON.stringify({
                  body: "<!-- atomaton:parent-issue=300 -->\n<!-- atomaton:origin-agent=engineer -->",
                }),
              },
              // The parent issue: open (so the re-invocation is chosen), and read
              // again by the notify walk and by the dispatch's own target check.
              // The marker POST is listed first because every needle of the plain
              // `issues/300` rule is a substring of its path too.
              { match: ["issues/300/comments", "POST"], stdout: "999" },
              { match: ["issues/300/comments", "--paginate"], stdout: JSON.stringify([
                {
                  id: 999,
                  body: "<!-- atomaton:llm-context=exclude -->\n<!-- atomaton:dispatch=engineer -->\nAtomaton: `engineer` starting on this issue.",
                },
              ]) },
              { match: ["api", "repos/owner/repo/issues/300"], stdout: JSON.stringify({ state: "open", body: "" }) },
              { match: ["graphql"], stdout: JSON.stringify({ data: { repository: { issueOrPullRequest: { __typename: "Issue", parent: null } } } }) },
              { match: ["issue", "comment", "300"], stdout: "https://github.com/owner/repo/issues/300#comment-1" },
              { match: ["workflow", "run", "atomaton-runner.yml"], stdout: "" },
            ]),
          },
        );
        expect(r.result.isError, r.result.content?.[0]?.text).toBeFalsy();
        const parsed = JSON.parse(r.result.content[0].text) as {
          merged: boolean;
          parent_outcome: string;
          reinvoked_agent?: string;
        };
        expect(parsed).toMatchObject({
          merged: true,
          parent_outcome: "reinvoked",
          reinvoked_agent: "engineer",
          // The merge's own answer says the delivery checks were not applied: this
          // fixture's base is a parent issue's branch.
          stacked_merge: true,
        });

        // The dispatch went to the parent issue, not to the pull request.
        const calls = readFileSync(ghLog, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as string[]);
        const run = calls.find((c) => c.includes("workflow") && c.includes("run"));
        expect(run?.some((a) => a.includes("number=300")), JSON.stringify(run)).toBe(true);

        // And the ops log carries it as the chain continuing — the exact literal
        // `chain_continues` greps for, and none of the elsewhere kind.
        const ops = readFileSync(opsLog, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as Record<string, unknown>);
        const dispatches = ops.filter((entry) => String(entry.op).startsWith("dispatch"));
        expect(dispatches.length, JSON.stringify(ops)).toBe(1);
        expect(dispatches[0]).toMatchObject({ op: "dispatch", target: "issue", agent: "engineer", number: 300 });
      } finally {
        removeTemp(dir);
        rmSync(configDir, { recursive: true, force: true });
      }
    }, 30_000);

    /**
     * `merge_pr`'s close-directly fallback closes the delivered issue itself when no
     * origin agent is tagged on the pull request — and it is one of the two IN-PROCESS
     * closes that used to reach the aggregation gate with nothing to hand the parent
     * (#149). No run wrote a summary on this path, so the report carries what GitHub
     * links to the issue, above all the pull request that delivered it.
     *
     * The gate's own fixture stops here — that is not what this test is about — so the
     * tool answers `undetermined`, which the shape below does not depend on.
     */
    test("merge_pr's close-directly leaves a report on the delivered issue's parent", async () => {
      const dir = mkdtempSync(join(tmpdir(), "atomaton-close-directly-"));
      const ghLog = join(dir, "gh.log");
      const configDir = makeConfigDir({ merge: { policy: "auto" } });
      try {
        const r = await sendRequest(
          "github.ts",
          { jsonrpc: "2.0", id: 48, method: "tools/call", params: { name: "merge_pr", arguments: {} } },
          {
            ...fakeGhSeam(),
            GITHUB_REPOSITORY: "owner/repo",
            TYPE: "pr",
            NUMBER: "802",
            ATOMATON_MACHINERY_ROOT: configDir,
            FAKE_GH_LOG: ghLog,
            FAKE_GH_RESPONSES: JSON.stringify([
              // First: the fake takes the first matching rule, and a GraphQL query's own text
              // carries "issue" and "close", so a later `gh issue close` rule swallows it.
              // #300 is a sub-issue: it is under #250, and #802 is what delivered it.
              {
                match: ["graphql"],
                stdout: JSON.stringify({
                  data: {
                    repository: {
                      issueOrPullRequest: {
                        __typename: "Issue",
                        parent: { number: 250, title: "the parent", state: "OPEN" },
                        subIssues: { nodes: [] },
                        closedByPullRequestsReferences: {
                          nodes: [{ number: 802, title: "Deliver #300", state: "MERGED", merged: true, body: "" }],
                        },
                        timelineItems: { nodes: [] },
                      },
                    },
                  },
                }),
              },
              {
                match: ["pr", "view", "802", "isDraft,author"],
                stdout: JSON.stringify({
                  isDraft: false,
                  author: { is_bot: true, login: "engineer" },
                  state: "OPEN",
                  headRefOid: "abc123",
                  headRefName: "atomaton/issue-300",
                  baseRefName: "atomaton/issue-300",
                  title: "Deliver #300",
                  labels: [],
                }),
              },
              { match: ["pr", "view", "802", "mergeStateStatus"], stdout: JSON.stringify({ mergeStateStatus: "CLEAN" }) },
              {
                match: ["commits/abc123/check-runs"],
                stdout: JSON.stringify({ check_runs: [{ name: "validate", status: "completed", conclusion: "success" }] }),
              },
              { match: ["actions/runs?head_sha=abc123"], stdout: JSON.stringify({ workflow_runs: [] }) },
              { match: ["rules/branches/atomaton/issue-300"], stdout: "[]" },
              { match: ["pulls/802/files"], stdout: "" },
              { match: ["pr", "merge", "802"], stdout: "" },
              { match: ["git/refs/heads/atomaton/issue-300"], stdout: "" },
              // The pull request delivers #300 and tags NO origin agent: nothing
              // re-invokes anything, so the merge closes the issue itself.
              { match: ["pr", "view", "802", "body"], stdout: JSON.stringify({ body: "<!-- atomaton:parent-issue=300 -->\n" }) },
              { match: ["api", "repos/owner/repo/issues/300"], stdout: JSON.stringify({ state: "open", body: "" }) },
              { match: ["issue", "view", "300"], stdout: JSON.stringify({ author: { is_bot: true, login: "atomaton[bot]" } }) },
              { match: ["issue", "close", "300"], stdout: "" },
            ]),
          },
        );
        expect(r.result.isError, r.result.content?.[0]?.text).toBeFalsy();
        const parsed = JSON.parse(r.result.content[0].text) as { merged: boolean; parent_outcome: string };
        expect(parsed).toMatchObject({ merged: true, parent_outcome: "closed" });

        const calls = readFileSync(ghLog, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as string[]);
        const report = calls.find((c) => c[0] === "issue" && c[1] === "comment" && c[2] === "250");
        expect(report, "a report on #300's parent #250").toBeDefined();
        const body = report?.[report.indexOf("--body") + 1] ?? "";
        expect(body).toContain("<details><summary>Report</summary>");
        expect(body).toContain("Sub-issue #300");
        // No run wrote a summary on this path, and the report says so rather than
        // leaving an empty fold — and the pull request that delivered the work is there.
        expect(body).toContain("Its closing run wrote no summary.");
        expect(body).toContain("#802 Deliver #300 (done)");
      } finally {
        removeTemp(dir);
        rmSync(configDir, { recursive: true, force: true });
      }
    }, 30_000);

    /**
     * GitHub allows ten code searches a minute, and a 429 names its own wait. Thirty
     * recorded failures were that, each one costing an iteration to learn something the
     * error had already said. The property is that the answer arrives, not how many
     * times it was asked for.
     */
    test("a rate-limited search waits out the limit instead of failing", async () => {
      const dir = mkdtempSync(join(tmpdir(), "atomaton-search-retry-"));
      const log = join(dir, "gh.log");
      try {
        const r = await sendRequest(
          "github.ts",
          {
            jsonrpc: "2.0", id: 45, method: "tools/call",
            params: { name: "search_remote_code", arguments: { query: "atomaton_github" } },
          },
          {
            ...fakeGhSeam(),
            FAKE_GH_LOG: log,
            FAKE_GH_RESPONSES: JSON.stringify([
              // A wait GitHub states in milliseconds keeps the test honest and quick:
              // the code reads the stated number rather than using its own backoff.
              { match: ["search", "code"], attempt: 1, code: 1, stdout: "HTTP 429: try again in 0.01s" },
              { match: ["search", "code"], stdout: "main.rs:12: atomaton_github" },
            ]),
          },
        );
        expect(r.result.isError).toBe(false);
        expect(r.result.content[0].text).toContain("atomaton_github");
        // Asked twice, which is the whole point.
        expect(readFileSync(log, "utf8").split("\n").filter(Boolean).length).toBe(2);
      } finally {
        removeTemp(dir);
      }
    });
    test("get_pr_reviews drops the fields nothing decides on", async () => {
      const payload = {
        reviews: [
          {
            id: "PRR_1",
            author: { login: "reviewer" },
            authorAssociation: "COLLABORATOR",
            body: "looks good",
            submittedAt: "2026-01-01T00:00:00Z",
            includesCreatedEdit: false,
            reactionGroups: [],
            state: "APPROVED",
            commit: { oid: "abc" },
          },
        ],
      };
      const r = await call("get_pr_reviews", { pull_number: 1 }, [
        { match: ["--json", "reviews"], stdout: JSON.stringify(payload) },
      ]);
      expect(JSON.parse(r.result.content[0].text)).toEqual({
        total: 1,
        omitted: 0,
        reviews: [
          { author: { login: "reviewer" }, state: "APPROVED", submittedAt: "2026-01-01T00:00:00Z", body: "looks good" },
        ],
      });
    });

    test("list_pr_review_comments keeps where it is and what it says", async () => {
      const payload = [
        {
          id: 1,
          user: { login: "reviewer", avatar_url: "u", url: "u", html_url: "u", followers_url: "u" },
          path: "src/x.ts",
          line: 42,
          original_line: 40,
          in_reply_to_id: 99,
          diff_hunk: "@@ -1 +1 @@\n-old\n+new",
          body: "rename this",
          author_association: "COLLABORATOR",
        },
      ];
      const r = await call("list_pr_review_comments", { pull_number: 1 }, [
        { match: ["pulls/1/comments"], stdout: JSON.stringify(payload) },
      ]);
      expect(JSON.parse(r.result.content[0].text)).toEqual({
        total: 1,
        omitted: 0,
        comments: [{ author: "reviewer", path: "src/x.ts", line: 42, in_reply_to: 99, body: "rename this" }],
      });
    });

    /**
     * The paginated half of the same read.
     *
     * `gh api` stops at one page unless it is told to follow them, and this tool read
     * without `--paginate`: every review comment past the first page was missing, and
     * `omitted` stayed 0, so the tool's own contract ("a non-zero `omitted` is the
     * reason to believe something was left out") said the list was complete. On a pull
     * request long enough to be reviewed twice, the older review is the one that is
     * not there.
     *
     * Both halves are asserted: that the request asks for every page, and that pages
     * arriving back to back are all read. With `--paginate`, `gh` writes one array per
     * page in sequence, so the second page only appears if the split is real.
     */
    test("list_pr_review_comments reads every page, not just the first", async () => {
      const dir = mkdtempSync(join(tmpdir(), "atomaton-review-pages-"));
      const log = join(dir, "gh.log");
      const first = [{ id: 1, user: { login: "reviewer" }, path: "src/x.ts", line: 4, body: "rename this" }];
      const second = [{ id: 2, user: { login: "engineer" }, path: "src/y.ts", line: 9, body: "done" }];
      try {
        const r = await call(
          "list_pr_review_comments",
          { pull_number: 1 },
          [{ match: ["pulls/1/comments"], stdout: `${JSON.stringify(first)}\n${JSON.stringify(second)}` }],
          { FAKE_GH_LOG: log },
        );
        expect(r.result.isError, r.result.content?.[0]?.text).toBeFalsy();
        const parsed = JSON.parse(r.result.content[0].text) as {
          total: number;
          omitted: number;
          comments: { author: string; body: string }[];
        };
        expect(parsed.total).toBe(2);
        expect(parsed.omitted).toBe(0);
        expect(parsed.comments.map((c) => `${c.author}: ${c.body}`)).toEqual([
          "reviewer: rename this",
          "engineer: done",
        ]);

        const argv = readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line) as string[]);
        expect(argv).toHaveLength(1);
        expect(argv[0]).toContain("--paginate");
      } finally {
        removeTemp(dir);
      }
    });

    // A count limit is not a volume limit: the range bounds how MANY comments come
    // back and said nothing about how big one is.
    test("get_issue_comments caps one oversized comment", async () => {
      const body = "y".repeat(40_000);
      const payload = { title: "t", state: "OPEN", comments: [{ author: { login: "a" }, body }] };
      const r = await call("get_issue_comments", { issue_number: 1, from: 1, to: 1 }, [
        { match: ["--json", "comments"], stdout: JSON.stringify(payload) },
      ]);
      const parsed = JSON.parse(r.result.content[0].text);
      expect(parsed.comments[0].body.length).toBeLessThan(body.length);
      expect(parsed.comments[0].body).toContain("characters");
      // The cut names the call that reads the rest: a marker with a count and no
      // way past it left the tail of a comment unreachable through the tool.
      expect(parsed.comments[0].body).toContain("body_offset:");
      // And it still says how many there were, which is what stops "not shown"
      // being read as "not there".
      expect(parsed.showing).toBeDefined();
    });

    /**
     * The per-comment cap was a fixed fifth of the budget, whatever the read
     * selected — so the common shape, ONE comment reached from a search hit, was
     * cut at 1,600 characters while 8,000 were available. On #149 that is where
     * the decision being looked for turned out to be.
     */
    test("get_issue_comments gives one comment the whole budget", async () => {
      const body = "y".repeat(6_000);
      const payload = { title: "t", state: "OPEN", comments: [{ author: { login: "a" }, body }] };
      const r = await call("get_issue_comments", { issue_number: 1, from: 1 }, [
        { match: ["--json", "comments"], stdout: JSON.stringify(payload) },
      ]);
      const parsed = JSON.parse(r.result.content[0].text);
      expect(parsed.comments[0].body).toBe(body);
    });

    // The half the marker exists for: the offset it names reads the rest, and the
    // part that reaches the end says so rather than looking like another cut.
    test("a cut comment's named body_offset reads it to the end", async () => {
      const body = `${"a".repeat(9_000)}THE-DECISION`;
      const payload = { title: "t", state: "OPEN", comments: [{ author: { login: "a" }, body }] };
      const response = [{ match: ["--json", "comments"], stdout: JSON.stringify(payload) }];

      const first = await call("get_issue_comments", { issue_number: 1, from: 1 }, response);
      const firstBody = JSON.parse(first.result.content[0].text).comments[0].body as string;
      expect(firstBody).not.toContain("THE-DECISION");
      const named = /body_offset: (\d+)/.exec(firstBody)?.[1];
      expect(named, firstBody.slice(-300)).toBeDefined();

      const second = await call("get_issue_comments", { issue_number: 1, from: 1, body_offset: Number(named) }, response);
      const secondBody = JSON.parse(second.result.content[0].text).comments[0].body as string;
      expect(secondBody).toContain("THE-DECISION");
      expect(secondBody).toContain("this is the last part");
      // Nothing more to read, and no marker saying there is.
      expect(secondBody).not.toContain("body_offset");
    });

    test("a multi-comment read splits the budget, and each cut names its own comment", async () => {
      const body = "z".repeat(20_000);
      const payload = { title: "t", state: "OPEN", comments: [{ author: { login: "a" }, body }, { author: { login: "b" }, body }] };
      const r = await call("get_issue_comments", { issue_number: 1, from: 1, to: 2 }, [
        { match: ["--json", "comments"], stdout: JSON.stringify(payload) },
      ]);
      const parsed = JSON.parse(r.result.content[0].text);
      expect(parsed.comments[0].body).toContain("from: 1, body_offset:");
      expect(parsed.comments[1].body).toContain("from: 2, body_offset:");
      for (const comment of parsed.comments) expect(comment.body.length).toBeLessThanOrEqual(4_000);
    });

    // An offset has no meaning across several comments. Applying it to each would
    // cut every one of them at a position taken from another, and say nothing.
    test("body_offset is refused on a range that selects more than one comment", async () => {
      const payload = { title: "t", state: "OPEN", comments: [{ body: "one" }, { body: "two" }] };
      const r = await call("get_issue_comments", { issue_number: 1, from: 1, to: 2, body_offset: 1 }, [
        { match: ["--json", "comments"], stdout: JSON.stringify(payload) },
      ]);
      expect(r.result.isError).toBe(true);
      expect(r.result.content[0].text).toContain("`body_offset` continues ONE comment");
      expect(r.result.content[0].text).toContain("comment(s) 1-2 of 2");
    });

    test("body_offset past a comment's end is refused with its length", async () => {
      const payload = { title: "t", state: "OPEN", comments: [{ body: "short" }] };
      const r = await call("get_issue_comments", { issue_number: 1, from: 1, body_offset: 99 }, [
        { match: ["--json", "comments"], stdout: JSON.stringify(payload) },
      ]);
      expect(r.result.isError).toBe(true);
      expect(r.result.content[0].text).toContain("Comment 1 is 5 characters long");
    });

    /**
     * The header carries all three links, not two.
     *
     * `children` was the one it left out, and nothing said why -- the same
     * `issueLinks` call already holds it. What its absence costs is the question a
     * reviewer asks most often of a parent: is anything under this still open. The
     * comments alone cannot answer that, which is the whole reason the header exists.
     */
    test("get_issue_comments carries children beside parent and pull requests", async () => {
      const payload = { title: "t", state: "OPEN", comments: [] };
      const links = {
        data: {
          repository: {
            issueOrPullRequest: {
              __typename: "Issue",
              parent: null,
              subIssues: { nodes: [{ number: 807, title: "child", state: "OPEN" }] },
              closedByPullRequestsReferences: { nodes: [] },
              timelineItems: { nodes: [] },
            },
          },
        },
      };
      const r = await call("get_issue_comments", { issue_number: 803 }, [
        { match: ["api", "graphql"], stdout: JSON.stringify(links) },
        { match: ["--json", "comments"], stdout: JSON.stringify(payload) },
      ]);
      const parsed = JSON.parse(r.result.content[0].text);
      expect(parsed.issue.children).toEqual([{ number: 807, title: "child", state: "open" }]);
      expect(parsed.issue.pull_requests).toEqual([]);
      expect(parsed.issue.links_unavailable).toBeUndefined();
    });
  });

  // The advertised JSON Schema is what teaches the model the correct shape, and
  // zod-to-json-schema is known to degrade silently to `{}` for schemas built
  // the wrong way (see lib/mcp-tool.ts). These assertions pin the emitted schema
  // so a lenient runtime never comes at the cost of a vague contract.
  test("tools/list advertises precise argument schemas", async () => {
    const r = await sendRequest("github.ts", {
      jsonrpc: "2.0", id: 20, method: "tools/list", params: {},
    });
    const byName = new Map<string, any>(r.result.tools.map((t: { name: string }) => [t.name, t]));

    // `.int()` makes zod-to-json-schema emit "integer" rather than "number".
    const getIssue = byName.get("get_issue").inputSchema;
    expect(getIssue.properties.issue_number.type).toBe("integer");
    expect(getIssue.required ?? []).not.toContain("issue_number");

    // `merge_pr` takes no number at all: what it merges is the node the run sits
    // on, so the schema is the empty object and there is no target to infer.
    const mergePr = byName.get("merge_pr").inputSchema;
    expect(mergePr.properties ?? {}).toEqual({});
    expect(mergePr.required ?? []).toEqual([]);

    // `labels` stays an array in the contract even though a bare string parses.
    const listIssues = byName.get("list_issues").inputSchema;
    expect(listIssues.properties.labels.type).toBe("array");
    expect(listIssues.properties.labels.items.type).toBe("string");
    expect(listIssues.properties.limit.type).toBe("integer");
  });

  test("get_issue accepts a stringified number", async () => {
    const r = await sendRequest(
      "github.ts",
      {
        jsonrpc: "2.0", id: 21, method: "tools/call",
        params: { name: "get_issue", arguments: { issue_number: "185" } },
      },
      {
        ...fakeGhSeam(),
        FAKE_GH_RESPONSES: JSON.stringify([
          { match: ["issue", "view", "185"], stdout: JSON.stringify({ number: 185, title: "Coerced" }) },
        ]),
      },
    );
    expect(r.result.isError).toBe(false);
    expect(JSON.parse(r.result.content[0].text)).toMatchObject({ number: 185 });
  });

  test("get_issue falls back to the run's issue when number is omitted", async () => {
    const r = await sendRequest(
      "github.ts",
      {
        jsonrpc: "2.0", id: 22, method: "tools/call",
        params: { name: "get_issue", arguments: {} },
      },
      {
        NUMBER: "42",
        ...fakeGhSeam(),
        FAKE_GH_RESPONSES: JSON.stringify([
          { match: ["issue", "view", "42"], stdout: JSON.stringify({ number: 42, title: "From context" }) },
        ]),
      },
    );
    expect(r.result.isError).toBe(false);
    expect(JSON.parse(r.result.content[0].text)).toMatchObject({ number: 42 });
  });

  /**
   * On a pull request run the node IS the pull request: issues and pull requests
   * share one number space, so the same omitted argument resolves — and the result
   * says which kind came back, because the number alone cannot. #248 is the other
   * direction this closes: the default used to be the parent issue the session is
   * keyed to, silently.
   */
  test("get_issue with no arguments on a pull request run returns that pull request, and says so", async () => {
    const r = await sendRequest(
      "github.ts",
      {
        jsonrpc: "2.0", id: 23, method: "tools/call",
        params: { name: "get_issue", arguments: {} },
      },
      {
        TYPE: "pr",
        NUMBER: "802",
        ...fakeGhSeam(),
        FAKE_GH_RESPONSES: JSON.stringify([
          { match: ["issue", "view", "802"], stdout: JSON.stringify({ number: 802, title: "The PR" }) },
          {
            match: ["graphql"],
            stdout: JSON.stringify({
              data: {
                repository: {
                  issueOrPullRequest: {
                    __typename: "PullRequest",
                    closingIssuesReferences: { nodes: [{ number: 300, title: "The issue", state: "OPEN" }] },
                  },
                },
              },
            }),
          },
        ]),
      },
    );
    expect(r.result.isError, r.result.content?.[0]?.text).toBeFalsy();
    const parsed = JSON.parse(r.result.content[0].text);
    expect(parsed).toMatchObject({ number: 802, kind: "pull_request" });
    expect(parsed.parent).toMatchObject({ number: 300 });
  });

  /**
   * The converse: an issue run's number is a valid-looking pull request number
   * belonging to a different thing entirely, so a PR read defaulting to it is
   * refused rather than resolved — the failure the PR-shaped schema exists for,
   * held here on the read that reaches it.
   */
  test("get_pr with no arguments on an issue run is refused, not defaulted", async () => {
    const r = await sendRequest(
      "github.ts",
      {
        jsonrpc: "2.0", id: 24, method: "tools/call",
        params: { name: "get_pr", arguments: {} },
      },
      {
        ...fakeGhSeam(),
        TYPE: "issue",
        NUMBER: "42",
        FAKE_GH_RESPONSES: "[]",
      },
    );
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("issue #42");
  });

  /**
   * The close-request half of #90, on the one tool that now does this:
   * `request_close_issue` on an issue a PERSON opened does not close it — it asks
   * them to, on the thread — and that comment is the turn ending. The reason the
   * agent gave rides on the request, because a close request that does not say why
   * asks a person to judge work they cannot see.
   *
   * Without the ending the node's last turn event stays the `asked` that started the run,
   * so the guard reads "the ball is with an agent" and DELETES the person's reply. On
   * this path that reply is their agreement to close the issue, so the issue stayed open
   * with nobody able to say yes. Checked through the guard's own reader rather than by
   * matching the tag text, because a tag nobody reads is exactly how this survived its
   * first fix.
   */
  test("request_close_issue asking a person to close ends the turn, so their reply survives", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-close-request-"));
    const log = join(dir, "gh.log");
    try {
      const r = await sendRequest(
        "atomaton.ts",
        {
          jsonrpc: "2.0", id: 26, method: "tools/call",
          params: {
            name: "request_close_issue",
            arguments: { reason: "the work is delivered", summary: "It landed in #123." },
          },
        },
        {
          ...fakeGhSeam(),
          NUMBER: "12",
          ATOMATON_RUN_DIR: dir,
          FAKE_GH_LOG: log,
          FAKE_GH_RESPONSES: JSON.stringify([
            // A person opened it, so the tool asks rather than closes.
            { match: ["issue", "view"], stdout: JSON.stringify({ author: { id: "1", is_bot: false, login: "alice", name: "Alice" } }) },
            // resolveNotify reads the issue's own body and author.
            { match: ["api"], stdout: JSON.stringify({ body: "no tag", login: "alice", type: "User" }) },
            { match: ["issue", "comment"], stdout: "https://github.com/owner/repo/issues/12#issuecomment-777" },
          ]),
        },
      );
      expect(r.result.isError, r.result.content?.[0]?.text).toBeFalsy();
      expect(r.result._meta).toEqual({ session_ends: true });
      expect(JSON.parse(readFileSync(join(dir, "ending-comment.json"), "utf8")))
        .toEqual({ commentId: "777", node: "12" });

      const calls = readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line) as string[]);
      expect(calls.some((c) => c[0] === "issue" && c[1] === "close")).toBe(false);
      const comment = calls.find((c) => c[0] === "issue" && c[1] === "comment");
      const body = comment?.join(" ") ?? "";
      expect(body).toContain("please close it yourself");
      // The reason and summary ride on the request: they are what the person reads
      // to decide whether the work is done.
      expect(body).toContain("**Reason:** the work is delivered");
      expect(body).toContain("It landed in #123.");
      // The ask comes before the report, because it is the sentence the reader acts on.
      expect(body.indexOf("please close it yourself")).toBeLessThan(body.indexOf("**Reason:**"));
      expect(readers.ending(body)).toBe("returned");
      expect(whoseTurn(turnEvents(["/engineer", body], readers))).toBe("person");
    } finally {
      removeTemp(dir);
    }
  });

  test("list_issues accepts a bare string for labels", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-list-issues-labels-"));
    const log = join(dir, "gh.log");
    try {
      const r = await sendRequest(
        "github.ts",
        {
          jsonrpc: "2.0", id: 24, method: "tools/call",
          params: { name: "list_issues", arguments: { labels: "atomaton/sub-issue", limit: "5" } },
        },
        {
          ...fakeGhSeam(),
          FAKE_GH_LOG: log,
          FAKE_GH_RESPONSES: JSON.stringify([{ match: ["issue", "list"], stdout: "[]" }]),
        },
      );
      expect(r.result.isError).toBe(false);
      const calls = readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line) as string[]);
      const issueList = calls[0] ?? [];
      expect(issueList).toContain("--label");
      expect(issueList).toContain("atomaton/sub-issue");
      // The stringified limit passed validation and reached `gh` as 5.
      expect(issueList[issueList.indexOf("--limit") + 1]).toBe("5");
    } finally {
      removeTemp(dir);
    }
  });
});

describe("mcp/shell.ts", () => {
  test("executes a foreground command and returns its output", async () => {
    const response = await sendRequest("shell.ts", {
      jsonrpc: "2.0", id: 1, method: "tools/call",
      params: { name: "bash", arguments: { command: "printf hello", timeout_seconds: 5 } },
    });
    const result = JSON.parse(response.result.content[0].text);
    expect(result).toMatchObject({ status: "completed", exit_code: 0, stdout: "hello", stderr: "" });
  });

  // The output goes into the session on the `atomaton-data` branch and can be
  // quoted into an issue comment, neither of which GitHub Actions masks. So it
  // has to leave this process already redacted.
  test("keeps a credential in its output from reaching the caller", async () => {
    const response = await sendRequest(
      "shell.ts",
      {
        jsonrpc: "2.0", id: 3, method: "tools/call",
        params: {
          name: "bash",
          arguments: { command: 'printf "key=$OPENAI_API_KEY shape=ghp_abcdefghijklmnopqrstuvwx"', timeout_seconds: 5 },
        },
      },
      { OPENAI_API_KEY: "sekrit-value-from-the-environment" },
    );
    const result = JSON.parse(response.result.content[0].text);
    expect(result.stdout).toBe("key=[redacted] shape=[redacted]");
  });

  test("terminates commands that exceed their timeout", async () => {
    const response = await sendRequest("shell.ts", {
      jsonrpc: "2.0", id: 2, method: "tools/call",
      params: { name: "bash", arguments: { command: "sleep 2", timeout_seconds: 1 } },
    });
    const result = JSON.parse(response.result.content[0].text);
    expect(result.status).toBe("timeout");
  });
});

describe("mcp/atomaton.ts", () => {
  test("initialize returns server info", async () => {
    const r = await sendRequest("atomaton.ts", {
      jsonrpc: "2.0", id: 1, method: "initialize", params: INIT_PARAMS,
    });
    expect(r.result.serverInfo.name).toBe("atomaton-mcp-server");
  });

  test("launch_sub_agent schema requires issue and agent", async () => {
    const r = await sendRequest("atomaton.ts", {
      jsonrpc: "2.0", id: 2, method: "tools/list", params: {},
    });
    const tool = r.result.tools.find((t: { name: string }) => t.name === "launch_sub_agent");
    expect(tool.inputSchema.required).toEqual(["tasks"]);
    const item = tool.inputSchema.properties.tasks.items;
    expect(item.properties).toHaveProperty("issue");
    expect(item.properties).toHaveProperty("agent");
  });

  test("launch_sub_agent rejects empty tasks", async () => {
    const r = await sendRequest("atomaton.ts", {
      jsonrpc: "2.0", id: 3, method: "tools/call",
      params: { name: "launch_sub_agent", arguments: { tasks: [] } },
    });
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("tasks must be a non-empty list");
  });

  /**
   * A pull request run reviews or fixes one pull request; it does not decompose work.
   * `NUMBER` on such a run is the pull request's own number, so a dispatch from here
   * would start sub-agents under a node that was never decomposing anything -- and the
   * pull request's `atomaton/in-progress` guard would be held by a chain that had
   * moved elsewhere. This is the shape #21 walked into.
   */
  test("launch_sub_agent refuses on a pull request run", async () => {
    const r = await sendRequest(
      "atomaton.ts",
      {
        jsonrpc: "2.0", id: 6, method: "tools/call",
        params: { name: "launch_sub_agent", arguments: { tasks: [{ issue: 7, agent: "engineer" }] } },
      },
      { ...fakeGhSeam(), TYPE: "pr", NUMBER: "21" },
    );
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("pull request");
  });

  /**
   * A pull request run has no issue to conclude. Its outcomes are the review it
   * posts, a fix pushed with commit_and_push, and merge_pr — and the issue it
   * delivers is concluded by a run on that issue, which merge_pr's post-merge
   * dispatch starts. Checked before the arguments, because the refusal is about
   * the node the run sits on, not about what the caller passed.
   */
  test("request_close_issue refuses on a pull request run", async () => {
    const r = await sendRequest(
      "atomaton.ts",
      {
        jsonrpc: "2.0", id: 7, method: "tools/call",
        params: { name: "request_close_issue", arguments: { reason: "done" } },
      },
      { ...fakeGhSeam(), TYPE: "pr", NUMBER: "21" },
    );
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("pull request");
    // And names the route the pull request run has instead.
    expect(r.result.content[0].text).toContain("merge_pr");
  });

  /**
   * `launch_sub_agent` used to dispatch whatever number it was handed, and the
   * dispatch comment says "sub-task" whatever the truth is — so an issue that is not
   * under this one was announced, counted and waited on as a child. The aggregation
   * counts GitHub's sub-issue links, so a dispatch onto an unlinked issue leaves the
   * parent waiting forever. The observed case and the numbers are #29's and #16's.
   */
  test("launch_sub_agent refuses an issue that is not a child of this one", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-launch-parent-"));
    const log = join(dir, "gh.log");
    try {
      const r = await sendRequest(
        "atomaton.ts",
        {
          jsonrpc: "2.0", id: 30, method: "tools/call",
          params: { name: "launch_sub_agent", arguments: { tasks: [{ issue: 7, agent: "engineer" }] } },
        },
        {
          ...fakeGhSeam(),
          NUMBER: "3",
          FAKE_GH_LOG: log,
          FAKE_GH_RESPONSES: JSON.stringify([
            // #7's parent is nothing — a root issue, not a child of #3.
            { match: ["api", "graphql", "num=7"], stdout: JSON.stringify({ data: { repository: { issue: { parent: null } } } }) },
          ]),
        },
      );
      expect(r.result.isError).toBe(true);
      expect(r.result.content[0].text).toContain("not a child of #3");
      const calls = readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line) as string[]);
      // Nothing was started, and no marker was written on #7: the refusal happens
      // before the dispatch, not after it.
      expect(calls.some((c) => c[0] === "workflow" && c[1] === "run")).toBe(false);
      expect(calls.some((c) => c.includes("POST") && c.some((a) => a.includes("issues/7/comments")))).toBe(false);
    } finally {
      removeTemp(dir);
    }
  });

  /**
   * #231: a dispatch that refused every task still posted the report on the parent.
   *
   * The run's own report is not this call's to post when nothing was dispatched: the
   * tool refuses, the session stays OPEN, and the agent writes its result comment on
   * the next turn. Posted here it landed BEFORE that comment, as a summary with no
   * dispatch line above it, and read as a conclusion the next comment contradicted.
   */
  test("launch_sub_agent posts no comment when nothing was dispatched", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-launch-nothing-"));
    const log = join(dir, "gh.log");
    try {
      const r = await sendRequest(
        "atomaton.ts",
        {
          jsonrpc: "2.0", id: 34, method: "tools/call",
          params: {
            name: "launch_sub_agent",
            arguments: {
              tasks: [{ issue: 7, agent: "engineer" }],
              summary: "Created #230 as a root issue and started it there.",
            },
          },
        },
        {
          ...fakeGhSeam(),
          NUMBER: "3",
          FAKE_GH_LOG: log,
          FAKE_GH_RESPONSES: JSON.stringify([
            // #7 is a root issue, so the one task is refused and nothing is dispatched.
            { match: ["api", "graphql", "num=7"], stdout: JSON.stringify({ data: { repository: { issue: { parent: null } } } }) },
          ]),
        },
      );
      expect(r.result.isError).toBe(true);
      const calls = readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line) as string[]);
      // No dispatch, and no comment on the parent: the refusal is the whole outcome.
      expect(calls.some((c) => c[0] === "workflow" && c[1] === "run")).toBe(false);
      expect(calls.some((c) => c[0] === "issue" && c[1] === "comment" && c[2] === "3")).toBe(false);
    } finally {
      removeTemp(dir);
    }
  });

  /** The converse: a child of SOME OTHER issue is not this one's to dispatch. */
  test("launch_sub_agent refuses an issue that is a child of a different parent", async () => {
    const r = await sendRequest(
      "atomaton.ts",
      {
        jsonrpc: "2.0", id: 31, method: "tools/call",
        params: { name: "launch_sub_agent", arguments: { tasks: [{ issue: 7, agent: "engineer" }] } },
      },
      {
        ...fakeGhSeam(),
        NUMBER: "3",
        FAKE_GH_RESPONSES: JSON.stringify([
          { match: ["api", "graphql", "num=7"], stdout: JSON.stringify({ data: { repository: { issue: { parent: { number: 99 } } } } }) },
        ]),
      },
    );
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("a child of #99");
  });

  /**
   * A parent that could not be read is not a parent that is absent. Dispatching on a
   * failed read is the same defect this check exists for, so the read failing refuses
   * too — and says which read failed.
   */
  test("launch_sub_agent refuses when the parent could not be read", async () => {
    const r = await sendRequest(
      "atomaton.ts",
      {
        jsonrpc: "2.0", id: 32, method: "tools/call",
        params: { name: "launch_sub_agent", arguments: { tasks: [{ issue: 7, agent: "engineer" }] } },
      },
      {
        ...fakeGhSeam(),
        NUMBER: "3",
        // No rule for it, so the fake exits 1 and the read does not answer.
        FAKE_GH_RESPONSES: JSON.stringify([]),
      },
    );
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("could not read its parent");
  });

  // The ordinary path with the check in force: the issue really is under this one.
  test("launch_sub_agent dispatches a genuine child of this issue", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-launch-child-"));
    const log = join(dir, "gh.log");
    try {
      const r = await sendRequest(
        "atomaton.ts",
        {
          jsonrpc: "2.0", id: 33, method: "tools/call",
          params: { name: "launch_sub_agent", arguments: { tasks: [{ issue: 7, agent: "engineer" }] } },
        },
        {
          ...fakeGhSeam(),
          NUMBER: "3",
          FAKE_GH_LOG: log,
          FAKE_GH_RESPONSES: JSON.stringify([
            { match: ["api", "graphql", "num=7"], stdout: JSON.stringify({ data: { repository: { issue: { parent: { number: 3 } } } } }) },
            { match: ["api", "issues/7/comments", "POST"], stdout: "555" },
            { match: ["api", "issues/7/comments"], stdout: JSON.stringify([{ id: 555, body: "<!-- atomaton:dispatch=engineer -->" }]) },
            { match: ["api", "issues/7", "--jq"], stdout: "" },
            { match: ["issue", "edit"] },
            { match: ["workflow", "run"] },
            { match: ["api", "issues"], stdout: JSON.stringify({ state: "open" }) },
          ]),
        },
      );
      expect(r.result.isError).toBe(false);
      const calls = readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line) as string[]);
      expect(calls.some((c) => c[0] === "workflow" && c[1] === "run")).toBe(true);
    } finally {
      removeTemp(dir);
    }
  });

  /**
   * A sub-issue is created by `create_sub_issue` and started here, and a person may
   * comment in between. If that comment asks for an agent, this dispatch would be a
   * second run on a node that already has one.
   *
   * The dispatch comment is posted first so the check has something to be ordered
   * against, and removed when it turns out to be a second one.
   */
  test("launch_sub_agent refuses when an agent was already asked for on the sub-issue", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-launch-guard-"));
    const log = join(dir, "gh.log");
    try {
      const r = await sendRequest(
        "atomaton.ts",
        {
          jsonrpc: "2.0", id: 4, method: "tools/call",
          params: { name: "launch_sub_agent", arguments: { tasks: [{ issue: 7, agent: "engineer" }] } },
        },
        {
          ...fakeGhSeam(),
          FAKE_GH_LOG: log,
          FAKE_GH_RESPONSES: JSON.stringify([
            // The dispatch marker, posted first, and the thread read that follows it.
            // Listed before the state rule, whose `["api", "issues"]` is a substring
            // of these paths too.
            { match: ["api", "issues/7/comments", "POST"], stdout: "555" },
            // The thread read: a person already asked for an agent. The marker (555)
            // is present, which is the freshness probe -- the read has caught up.
            { match: ["api", "issues/7/comments"], stdout: JSON.stringify([{ id: 555, body: "<!-- atomaton:dispatch=engineer -->" }, { id: 1, body: "/engineer" }]) },
            { match: ["api", "issues/7", "--jq"], stdout: "" },
            { match: ["api", "DELETE"] },
            { match: ["api", "issues"], stdout: JSON.stringify({ state: "open" }) },
          ]),
        },
      );
      expect(r.result.isError).toBe(true);
      expect(r.result.content[0].text).toContain("already has an agent asked for");
      const calls = readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line) as string[]);
      // The dispatch comment was removed, and nothing was dispatched.
      expect(calls.some((c) => c.includes("DELETE") && c.join(" ").includes("comments/555"))).toBe(true);
      expect(calls.some((c) => c[0] === "workflow" && c[1] === "run")).toBe(false);
    } finally {
      removeTemp(dir);
    }
  });

  // The ordinary path: nothing was asked for first, so the dispatch proceeds.
  test("launch_sub_agent dispatches when the sub-issue has no agent asked for", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-launch-ok-"));
    const log = join(dir, "gh.log");
    try {
      const r = await sendRequest(
        "atomaton.ts",
        {
          jsonrpc: "2.0", id: 5, method: "tools/call",
          params: { name: "launch_sub_agent", arguments: { tasks: [{ issue: 7, agent: "engineer" }] } },
        },
        {
          ...fakeGhSeam(),
          FAKE_GH_LOG: log,
          FAKE_GH_RESPONSES: JSON.stringify([
            { match: ["api", "issues/7/comments", "POST"], stdout: "555" },
            { match: ["api", "issues/7/comments"], stdout: JSON.stringify([{ id: 555, body: "<!-- atomaton:dispatch=engineer -->" }]) },
            { match: ["api", "issues/7", "--jq"], stdout: "" },
            { match: ["issue", "edit"] },
            { match: ["workflow", "run"] },
            { match: ["api", "issues"], stdout: JSON.stringify({ state: "open" }) },
          ]),
        },
      );
      expect(r.result.isError).toBe(false);
      const calls = readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line) as string[]);
      expect(calls.some((c) => c.includes("DELETE"))).toBe(false);
      expect(calls.some((c) => c[0] === "workflow" && c[1] === "run")).toBe(true);
    } finally {
      removeTemp(dir);
    }
  });

  /**
   * The dispatch comment has to carry the turn's ending, or the node's last event
   * stays the `asked` that started the run and the aggregation gate refuses the parent
   * with `parent-busy` once the children are done. The `waiting` value is what says the
   * run took the request up and left the work under the node.
   *
   * Checked through the same reader the guard uses, not by string-matching the tag: a
   * comment could carry a tag nobody read, which is the gap that made #90 survive its
   * own fix.
   */
  test("launch_sub_agent's dispatch comment ends the turn as `waiting`", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-launch-ending-"));
    const log = join(dir, "gh.log");
    try {
      const r = await sendRequest(
        "atomaton.ts",
        {
          jsonrpc: "2.0", id: 9, method: "tools/call",
          params: {
            name: "launch_sub_agent",
            arguments: { tasks: [{ issue: 7, agent: "engineer" }], summary: "Split the work." },
          },
        },
        {
          ...fakeGhSeam(),
          // The parent this run is on. `launch_sub_agent` posts its dispatch comment
          // THERE, not on the child, so an unset number skips the very comment this test
          // is about.
          NUMBER: "3",
          FAKE_GH_LOG: log,
          FAKE_GH_RESPONSES: JSON.stringify([
            { match: ["api", "graphql", "num=7"], stdout: JSON.stringify({ data: { repository: { issue: { parent: { number: 3 } } } } }) },
            { match: ["api", "issues/7/comments", "POST"], stdout: "555" },
            { match: ["api", "issues/7/comments"], stdout: JSON.stringify([{ id: 555, body: "<!-- atomaton:dispatch=engineer -->" }]) },
            { match: ["api", "issues/7", "--jq"], stdout: "" },
            { match: ["issue", "edit"] },
            { match: ["workflow", "run"] },
            { match: ["api", "issues"], stdout: JSON.stringify({ state: "open" }) },
          ]),
        },
      );
      expect(r.result.isError).toBe(false);
      const calls = readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line) as string[]);
      // The comment on the PARENT (this run's own issue), which is the one carrying the
      // ending. The dispatch marker on the child is a different comment.
      const parentComment = calls.find((c) => c[0] === "issue" && c[1] === "comment");
      const body = parentComment?.join(" ") ?? "";
      expect(body).toContain("Launched sub-agent(s)");
      expect(await readers.ending(body)).toBe("waiting");
      // The parked turn stays with the machinery (#208, 案1): a person's comment made
      // while the children run is an interruption the guard removes, not a turn the
      // person holds.
      expect(await whoseTurn(turnEvents(["/atomaton", body], readers))).toBe("agent");
    } finally {
      removeTemp(dir);
    }
  });

  /**
   * Closing the issue is the atomaton's ordinary way to end a run, and the comment
   * `concludeIssue` posts is the one that ended its turn — so it is the comment the
   * machinery's footer goes onto, and the one whose token line the metrics report
   * counts. Whether the session ends here is this call's answer (`ends`), which is
   * why the record is written from the same place that decides `session_ends`.
   */
  test("request_close_issue records the comment it ends the run on", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-ending-comment-"));
    try {
      const r = await sendRequest(
        "atomaton.ts",
        {
          jsonrpc: "2.0", id: 40, method: "tools/call",
          params: {
            name: "request_close_issue",
            arguments: { reason: "the work is delivered", summary: "It landed in #123." },
          },
        },
        {
          ...fakeGhSeam(),
          NUMBER: "5",
          ATOMATON_RUN_DIR: dir,
          FAKE_GH_RESPONSES: JSON.stringify([
            // Bot-authored: this tool closes the issue itself rather than asking a person.
            { match: ["issue", "view"], stdout: JSON.stringify({ author: { is_bot: true, login: "atomaton[bot]" } }) },
            { match: ["issue", "comment"], stdout: "https://github.com/owner/repo/issues/5#issuecomment-4242" },
            { match: ["issue", "close"], stdout: "" },
            // A root issue has no parent to aggregate, so nothing stalls and the session ends.
            { match: ["graphql"], stdout: JSON.stringify({ data: { repository: { issue: { parent: null } } } }) },
          ]),
        },
      );
      expect(r.result.isError, r.result.content?.[0]?.text).toBeFalsy();
      expect(r.result._meta).toEqual({ session_ends: true });
      expect(JSON.parse(readFileSync(join(dir, "ending-comment.json"), "utf8")))
        .toEqual({ commentId: "4242", node: "5" });
    } finally {
      removeTemp(dir);
    }
  });

  /**
   * The converse, and the half the record's contract depends on: a parent that could
   * not be read leaves the gate `undetermined`, the session open, and the model with
   * another turn. That comment is then not the run's ending, so nothing is recorded
   * and the footer cannot land on it while the run goes on.
   */
  test("request_close_issue records nothing when the aggregation gate stalls", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-ending-comment-"));
    try {
      const r = await sendRequest(
        "atomaton.ts",
        {
          jsonrpc: "2.0", id: 41, method: "tools/call",
          params: {
            name: "request_close_issue",
            arguments: { reason: "the work is delivered", summary: "It landed in #123." },
          },
        },
        {
          ...fakeGhSeam(),
          NUMBER: "5",
          ATOMATON_RUN_DIR: dir,
          FAKE_GH_RESPONSES: JSON.stringify([
            { match: ["issue", "view"], stdout: JSON.stringify({ author: { is_bot: true, login: "atomaton[bot]" } }) },
            { match: ["issue", "comment"], stdout: "https://github.com/owner/repo/issues/5#issuecomment-4242" },
            { match: ["issue", "close"], stdout: "" },
            // No rule for the parent read, so the fake exits 1 and the gate cannot answer.
          ]),
        },
      );
      expect(r.result.isError, r.result.content?.[0]?.text).toBeFalsy();
      expect(r.result._meta?.session_ends, "a stalled gate keeps the session open").toBeUndefined();
      expect(
        existsSync(join(dir, "ending-comment.json")),
        "a comment recorded as the ending while the run continues would take the footer off the real one",
      ).toBe(false);
    } finally {
      removeTemp(dir);
    }
  });

  /**
   * The child's result reaches the parent, and the parent's thread is the only place
   * it can reach it from (#149).
   *
   * `request_close_issue`'s `summary` is written for the aggregation that reads it, and
   * it used to be posted on the CHILD's thread — the one thread the parent never opens.
   * The two workflow-side paths never carried anything either, so a parent woken by an
   * agent's own close was re-invoked knowing nothing its children had done.
   */
  test("request_close_issue puts the child's report on its parent's thread", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-sub-issue-report-"));
    const log = join(dir, "gh.log");
    try {
      const r = await sendRequest(
        "atomaton.ts",
        {
          jsonrpc: "2.0", id: 42, method: "tools/call",
          params: {
            name: "request_close_issue",
            arguments: {
              reason: "the work is delivered",
              // A directive line, because that is how an agent's report ordinarily ends
              // and it must not reach the parent as a request for an agent — see the
              // assertion below.
              summary: "It landed in #123.\n\n/atomaton",
            },
          },
        },
        {
          ...fakeGhSeam(),
          NUMBER: "5",
          FAKE_GH_LOG: log,
          FAKE_GH_RESPONSES: JSON.stringify([
            // First, because the fake takes the first rule whose needles all appear
            // somewhere in the argv — and a GraphQL query's own text carries "issue"
            // and "close", so a later rule for `gh issue close` would swallow it.
            //
            // #5 is under #7, and #123 is the pull request that delivered it.
            {
              match: ["graphql"],
              stdout: JSON.stringify({
                data: {
                  repository: {
                    issueOrPullRequest: {
                      __typename: "Issue",
                      parent: { number: 7, title: "the parent", state: "OPEN" },
                      subIssues: { nodes: [] },
                      closedByPullRequestsReferences: {
                        nodes: [{ number: 123, title: "the fix", state: "MERGED", merged: true, body: "" }],
                      },
                      timelineItems: { nodes: [] },
                    },
                  },
                },
              }),
            },
            { match: ["issue", "view"], stdout: JSON.stringify({ author: { is_bot: true, login: "atomaton[bot]" } }) },
            { match: ["issue", "comment"], stdout: "https://github.com/owner/repo/issues/5#issuecomment-4242" },
            { match: ["issue", "close"], stdout: "" },
          ]),
        },
      );
      // The gate is not what this covers, and this fixture does not answer its parent
      // read, so it answers `undetermined` — a shape that keeps the session open and
      // says so in the result rather than failing.
      expect(r.result.isError, r.result.content?.[0]?.text).toBeFalsy();

      const calls = readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as string[]);
      const report = calls.find((c) => c[0] === "issue" && c[1] === "comment" && c[2] === "7");
      expect(report, "a report on the PARENT issue #7, not on the child").toBeDefined();
      const body = report?.[report.indexOf("--body") + 1] ?? "";
      expect(body).toContain("<!-- atomaton:llm-context=include -->");
      expect(body).toContain("<details><summary>Report</summary>");
      expect(body).toContain("Sub-issue #5");
      expect(body).toContain("the work is delivered");
      expect(body).toContain("It landed in #123.");
      // The pull request that delivered it, read from GitHub's own link rather than
      // searched for in a body.
      expect(body).toContain("#123 the fix (done)");
      // And the child's directive did not become a request to the parent: an ask nobody
      // claimed is what makes the gate refuse to re-invoke it.
      expect(parseCommentCommand(proseOnly(body)).agent).toBe("");
    } finally {
      removeTemp(dir);
    }
  });
});

/**
 * The delegate server, which is one program behind two entries and offers one tool
 * per folder its roster key names.
 *
 * What is checked here is the part that is a promise rather than an
 * implementation detail: a tool exists per folder, its name is the folder's, its
 * arguments are the two the design settled on, the tier is described from the
 * `model:` line rather than from the folder name, and the server refuses to start
 * when the roster would give it nothing — a server with no tools starts and offers
 * nothing, which is worse than not starting.
 *
 * The sub-run itself is not started here. It needs an `atoma` binary and a
 * provider key, neither of which a laptop running `bun test` has, and a test that
 * skipped itself in the environment it runs in would be a test that never runs.
 * What the sub-run does is covered by the `agent.md` definitions, which the contract
 * tests hold to the servers their `tools.yaml` declares.
 */
describe("mcp/delegate.ts", () => {
  /** The roster this repository ships, as both servers are pointed at it. */
  const ROSTER_DIR = "src/content/delegates";

  test("initialize returns server info", async () => {
    const r = await sendRequest("delegate.ts", INIT_REQUEST, {}, process.cwd(), [
      "--roster", "delegate", "--delegates-dir", ROSTER_DIR,
    ]);
    expect(r.result.serverInfo.name).toBe("atomaton-delegate-mcp");
  });

  test("advertises one tool per folder the roster names, taking task and context", async () => {
    const r = await sendRequest(
      "delegate.ts",
      { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
      {},
      process.cwd(),
      ["--roster", "delegate", "--delegates-dir", ROSTER_DIR],
    );
    // The names are the FOLDER names, which is what makes two definitions two tools
    // rather than two servers claiming one name.
    const names = r.result.tools.map((t: { name: string }) => t.name);
    expect(names).toEqual(["delegate", "delegate_large"]);
    const tool = r.result.tools[0];
    expect(tool.inputSchema.required).toEqual(["task"]);
    expect(tool.inputSchema.properties).toHaveProperty("task");
    expect(tool.inputSchema.properties).toHaveProperty("context");
  });

  /**
   * Every roster entry gets its own server, and neither sees the other's folders.
   *
   * This is the confinement, and it is why the roster is keyed by server rather
   * than being one flat list: an agent holding `files_readonly` is given
   * `delegate_readonly`, and a writing delegate on the same server would be one tool
   * call away from the reach that agent's whole tool set says it does not have.
   */
  test("each roster key offers only its own folders", async () => {
    const r = await sendRequest(
      "delegate.ts",
      { jsonrpc: "2.0", id: 20, method: "tools/list", params: {} },
      {},
      process.cwd(),
      ["--roster", "delegate_readonly", "--delegates-dir", ROSTER_DIR],
    );
    const names = r.result.tools.map((t: { name: string }) => t.name).sort();
    expect(names).toEqual(["delegate_readonly", "delegate_readonly_large"]);
  });

  /**
   * The read-only entry says so in the description, because the description is
   * what the model reads before deciding whether to ask for a change.
   */
  test("the read-only entry's description says it cannot change anything", async () => {
    const r = await sendRequest(
      "delegate.ts",
      { jsonrpc: "2.0", id: 3, method: "tools/list", params: {} },
      {},
      process.cwd(),
      ["--roster", "delegate_readonly", "--delegates-dir", ROSTER_DIR],
    );
    expect(r.result.tools[0].description).toContain("CANNOT change anything");
  });

  /**
   * The command promise follows the shell, and the two rosters never share it.
   *
   * The description was one text for both rosters, so the read-only one promised
   * "running one command" — and a caller that delegated a command spent a whole run
   * being told the capability did not exist. The split is pinned on both sides: the
   * writing delegate promises the command, the read-only one refuses it in so many
   * words, and the phrasing the old shared text used appears in neither.
   */
  test("the command promise follows the shell, and the rosters do not share it", async () => {
    const descriptions = async (roster: string) => {
      const r = await sendRequest(
        "delegate.ts",
        { jsonrpc: "2.0", id: 5, method: "tools/list", params: {} },
        {},
        process.cwd(),
        ["--roster", roster, "--delegates-dir", ROSTER_DIR],
      );
      return new Map(
        (r.result.tools as { name: string; description: string }[]).map((t) => [t.name, t.description]),
      );
    };
    const writing = await descriptions("delegate");
    const readOnly = await descriptions("delegate_readonly");

    for (const name of ["delegate", "delegate_large"]) {
      const d = writing.get(name) ?? "";
      expect(d, name).toContain("run one command to answer a question");
      expect(d, name).not.toContain("CANNOT run commands");
    }
    for (const name of ["delegate_readonly", "delegate_readonly_large"]) {
      const d = readOnly.get(name) ?? "";
      expect(d, name).toContain("CANNOT run commands");
      expect(d, name).toContain("no shell");
      expect(d, name).not.toMatch(/run(ning)? one command/);
    }
  });

  /**
   * `task` is one text for both rosters, so it may promise only what every delegate
   * can do. It used to say "make one change, run one command" — neither of which the
   * read-only half could do — and what else a delegate takes now lives in the
   * description, which is per-roster.
   */
  test("the shared task description promises neither a change nor a command", async () => {
    for (const roster of ["delegate", "delegate_readonly"]) {
      const r = await sendRequest(
        "delegate.ts",
        { jsonrpc: "2.0", id: 6, method: "tools/list", params: {} },
        {},
        process.cwd(),
        ["--roster", roster, "--delegates-dir", ROSTER_DIR],
      );
      for (const tool of r.result.tools as {
        name: string;
        inputSchema: { properties: { task: { description: string } } };
      }[]) {
        const task = tool.inputSchema.properties.task.description;
        expect(task, `${roster}/${tool.name}`).not.toContain("make one change");
        expect(task, `${roster}/${tool.name}`).not.toContain("run one command");
        expect(task, `${roster}/${tool.name}`).toContain("read and report");
      }
    }
  });

  /**
   * Which delegate is free is read from the `model:` line, not from the folder name.
   *
   * This is the whole reason the tier is in the description rather than in the
   * caller's prompt: a project that points a folder at a paid model, or renames one,
   * changes what the caller is told without touching an agent definition. A folder
   * named for a tier its model does not belong to would be the drift this catches.
   */
  test("the tier a caller is told about comes from the model, not from the name", async () => {
    const r = await sendRequest(
      "delegate.ts",
      { jsonrpc: "2.0", id: 4, method: "tools/list", params: {} },
      {},
      process.cwd(),
      ["--roster", "delegate", "--delegates-dir", ROSTER_DIR],
    );
    const byName = new Map(
      (r.result.tools as { name: string; description: string }[]).map((t) => [t.name, t.description]),
    );
    expect(byName.get("delegate")).toContain("FREE");
    expect(byName.get("delegate_large")).toContain("PAID");
    // And the shared-limit consequence, which is what makes a refusal readable
    // rather than a failure: the caller is told to try it and read the answer.
    expect(byName.get("delegate")).toContain("shared with every other agent");
    // #238: the exhaustion case is named, and names no other delegate — the paid
    // delegates are files a project renames or deletes, so the description points
    // at "the other delegates you were offered", never at a spelled name.
    expect(byName.get("delegate")).toContain("no task fits");
    // `delegate_readonly` lives on the other roster; this test reads the `delegate`
    // roster's tools alone.
    const ro = await sendRequest(
      "delegate.ts",
      { jsonrpc: "2.0", id: 5, method: "tools/list", params: {} },
      {},
      process.cwd(),
      ["--roster", "delegate_readonly", "--delegates-dir", ROSTER_DIR],
    );
    const readOnly = new Map(
      (ro.result.tools as { name: string; description: string }[]).map((t) => [t.name, t.description]),
    );
    expect(readOnly.get("delegate_readonly")).toContain("no task fits");
  });

  test("refuses to start when the roster names no folders for this server", async () => {
    // A real roster whose key is absent, rather than an empty one: the failure this
    // guards is a `tools/defaults.yaml` that disagrees with `delegates.yaml` about
    // which servers exist, and an absent roster would be a different fault. The
    // other key's list is empty so nothing else has to exist on disk.
    const dir = mkdtempSync(join(tmpdir(), "atomaton-delegate-roster-"));
    writeFileSync(join(dir, "delegates.yaml"), "someone_else: []\n");
    try {
      const child = spawn("bun", ["run", `${SCRIPTS_DIR}/delegate.ts`, "--roster", "delegate", "--delegates-dir", dir], {
        env: { ...hermeticEnv(), GITHUB_REPOSITORY: "owner/repo" },
        cwd: process.cwd(),
      });
      let stderr = "";
      child.stderr.on("data", (d) => (stderr += d.toString()));
      const code = await new Promise<number | null>((resolve) => child.on("exit", resolve));
      expect(code).toBe(2);
      expect(stderr).toContain("declares no folders under");
    } finally {
      removeTemp(dir);
    }
  });

  /**
   * A folder the roster lists but that is missing a file is fatal, and the message
   * names the path. The alternative — starting and offering a tool whose sub-run then
   * fails — reports it as a tool that would not answer, at the moment an agent tried
   * to delegate, which is the worst place to learn about a typo.
   */
  test("refuses to start when a listed folder is missing its tools file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-delegate-incomplete-"));
    writeFileSync(join(dir, "delegates.yaml"), "delegate:\n  - half\n");
    mkdirSync(join(dir, "half"), { recursive: true });
    writeFileSync(join(dir, "half", "agent.md"), "---\nname: half\nmcp_servers:\n  - files\n---\nbody\n");
    try {
      const child = spawn("bun", ["run", `${SCRIPTS_DIR}/delegate.ts`, "--roster", "delegate", "--delegates-dir", dir], {
        env: { ...hermeticEnv(), GITHUB_REPOSITORY: "owner/repo" },
        cwd: process.cwd(),
      });
      let stderr = "";
      child.stderr.on("data", (d) => (stderr += d.toString()));
      const code = await new Promise<number | null>((resolve) => child.on("exit", resolve));
      expect(code).toBe(2);
      expect(stderr).toContain("half/tools.yaml");
    } finally {
      removeTemp(dir);
    }
  });

  /**
   * No `--roster` at all is a configuration error, not a default. A default would be
   * one server's key, and guessing it starts a server with the wrong reach — the
   * read-only entry and the writing entry are told apart by this flag.
   */
  test("refuses to start with no --roster", async () => {
    const child = spawn("bun", ["run", `${SCRIPTS_DIR}/delegate.ts`], {
      env: { ...hermeticEnv(), GITHUB_REPOSITORY: "owner/repo" },
      cwd: process.cwd(),
    });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    const code = await new Promise<number | null>((resolve) => child.on("exit", resolve));
    expect(code).toBe(2);
    expect(stderr).toContain("no --roster");
  });

  /**
   * #25: the sub-run the reviewer's `delegate` starts must actually carry
   * `files_readonly`.
   *
   * A sub-run with no tools answers every task with "I could not read it", which reads
   * as a refusal rather than as the environment being wrong — and the reviewer has no
   * shell, so this is the one path it has for offloading a large read.
   *
   * Both spellings of the path are tried — layout-relative (what `defaults.yaml` passes,
   * resolved by `machineryPath`) and absolute (what a caller with no
   * `ATOMATON_MACHINERY_ROOT` gets) — because a path that resolves to nothing is fatal
   * at startup and looks from the outside like the entry not being wired at all.
   *
   * The third case is the one a workflow hits: no flag, and the layout constant
   * resolved against the machinery root. It is pointed at `dist`, because
   * `.github/atomaton/delegates/` is a build output — it exists in the deployed tree a
   * run works in, and in this checkout only after the build.
   */
  test("the read-only delegate's sub-run is given files_readonly, both ways the path resolves", async () => {
    const start = async (args: string[], env: Record<string, string> = {}) => {
      const child = spawn("bun", ["run", `${SCRIPTS_DIR}/delegate.ts`, ...args], {
        env: { ...hermeticEnv(), GITHUB_REPOSITORY: "owner/repo", ...env },
        cwd: process.cwd(),
      });
      let stderr = "";
      const started = new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`server did not start: ${stderr}`)), 5000);
        child.stderr.on("data", (d) => {
          stderr += d.toString();
          if (stderr.includes("Starting atomaton-delegate-mcp-server")) {
            clearTimeout(timer);
            resolve();
          }
        });
        child.on("exit", (code) => {
          clearTimeout(timer);
          reject(new Error(`delegate exited ${code}: ${stderr}`));
        });
      });
      await started;
      child.kill();
      return stderr;
    };

    // Layout-relative, which is what `tools/defaults.yaml` passes. `machineryPath`
    // resolves it against ATOMATON_MACHINERY_ROOT, and with that unset the cwd is the
    // job's own checkout — which is exactly the case a `bun test` run is in.
    const relative = await start(["--roster", "delegate_readonly", "--delegates-dir", ROSTER_DIR]);
    expect(relative).toContain("delegate_readonly=files_readonly");

    // And an absolute path, which is what a caller with no machinery root gets.
    const absolute = await start([
      "--roster", "delegate_readonly", "--delegates-dir", join(process.cwd(), ROSTER_DIR),
    ]);
    expect(absolute).toContain("delegate_readonly=files_readonly");

    // No flag: `defaultDelegatesDir()` resolves the layout constant against the
    // machinery root, which is the shape a workflow runs in — the flag is what a
    // caller passes precisely BECAUSE the root supplies the rest. Pointed at `dist`,
    // because `.github/atomaton/delegates/` is a build output and exists in the
    // deployed tree rather than in this checkout.
    const deployed = await start(["--roster", "delegate_readonly"], { ATOMATON_MACHINERY_ROOT: "dist" });
    expect(deployed).toContain("delegate_readonly=files_readonly");
  }, 20_000);
});

// The two servers that had no round-trip test at all.
//
// Worth having on its own, and worth having now in particular: `serveMcpServer`
// replaced five hand-written request handlers with one, and each of those had
// been dropping a different part of a tool's result. `web` is the only server
// whose tools return images, so it is the one place the newly-preserved `images`
// field is exercised -- and it was outside the covered set.
describe("mcp/web.ts", () => {
  test("initializes and advertises fetch", async () => {
    const init = await sendRequest("web.ts", INIT_REQUEST);
    expect(init.result.serverInfo.name).toBe("atomaton-web-mcp");

    const list = await sendRequest("web.ts", { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    const names = list.result.tools.map((t: { name: string }) => t.name);
    expect(names).toContain("fetch");
  });

  // Not "returns something": returns an ERROR. Every failure here used to come
  // back as an ordinary result whose body happened to be one English sentence,
  // so a model summarising several fetched pages had no structural signal that
  // one of them was never read.
  test("an unreachable host is an error, not a result", async () => {
    const r = await sendRequest("web.ts", {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "fetch", arguments: { url: "http://127.0.0.1:1/nothing" } },
    });
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("127.0.0.1");
  });

  test("a misspelled argument is refused rather than dropped", async () => {
    const r = await sendRequest("web.ts", {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "fetch", arguments: { url: "https://example.com", rawe: true } },
    });
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("rawe");
  });

  // This server declares `env: {}` so that it holds no credentials. Accepting
  // any scheme `new URL()` parses made it a local-file read instead -- the
  // cheapest route to `/proc/<pid>/environ` of a server that DOES hold one, and
  // to the `http.extraheader` line `actions/checkout` writes into `.git/config`.
  // No shell command, no routing rule to go around.
  test("refuses a file:// URL, which would make this a local-file read", async () => {
    for (const url of [
      "file:///proc/1/environ",
      "file:///home/runner/work/repo/repo/.git/config",
      "data:text/plain,hello",
    ]) {
      const r = await sendRequest("web.ts", {
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: { name: "fetch", arguments: { url } },
      });
      expect(r.result.isError, url).toBe(true);
      expect(r.result.content[0].text, url).toContain("http");
    }
  });
});

describe("mcp/files.ts", () => {
  /** A tree to work in, which is also the only place the server may reach. */
  function fixture(files: Record<string, string>): string {
    const root = mkdtempSync(join(tmpdir(), "atomaton-files-"));
    for (const [name, body] of Object.entries(files)) {
      const at = join(root, name);
      mkdirSync(dirname(at), { recursive: true });
      writeFileSync(at, body);
    }
    return root;
  }

  function call(root: string, name: string, args: Record<string, unknown>) {
    return sendRequest(
      "files.ts",
      { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } },
      {},
      root,
    );
  }

  const NUMBERED = Array.from({ length: 40 }, (_, i) => `line ${i + 1}`).join("\n");

  /**
   * The whole reason this server exists.
   *
   * A read that stops has to say where to start again. Without it an agent changes the
   * number it passed and tries once more -- measured, four reads of one file, because
   * `head: 760` and `head: 40` returned the same amount and nothing said why.
   */
  test("a truncated read names the offset to continue from", async () => {
    const root = fixture({ "big.txt": NUMBERED });
    const r = await call(root, "read", { path: "big.txt", offset: 5, limit: 10 });
    const text = r.result.content[0].text;
    expect(r.result.isError).toBe(false);
    expect(text).toContain("lines 5-14 of 40");
    expect(text).toContain("5\tline 5");
    expect(text).toContain("offset: 15");
  });

  test("a read that reaches the end says nothing about continuing", async () => {
    const root = fixture({ "small.txt": "one\ntwo\n" });
    const text = (await call(root, "read", { path: "small.txt" })).result.content[0].text;
    expect(text).toContain("lines 1-2 of 2");
    expect(text).not.toContain("offset:");
  });

  test("an offset past the end is an error, not an empty result", async () => {
    const root = fixture({ "small.txt": "one\n" });
    const r = await call(root, "read", { path: "small.txt", offset: 9 });
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("past the end");
  });

  test("grep returns file and line, and says when it stopped early", async () => {
    const root = fixture({ "a.ts": "const x = 1;\nconst wanted = 2;\n", "b.md": "wanted\n" });
    const text = (await call(root, "grep", { pattern: "wanted", glob: "*.ts" })).result.content[0].text;
    expect(text).toContain("a.ts:2:");
    // `glob` kept the markdown file out, so its line is not here.
    expect(text).not.toContain("b.md");

    const capped = (await call(root, "grep", { pattern: "wanted", max_matches: 1 })).result.content[0].text;
    expect(capped).toContain("further lines");
  });

  test("a pattern that matches nothing says so rather than failing", async () => {
    const root = fixture({ "a.ts": "nothing here\n" });
    const r = await call(root, "grep", { pattern: "absent" });
    expect(r.result.isError).toBe(false);
    expect(r.result.content[0].text).toContain("No match");
  });

  /**
   * `path` accepts one place or several, and the advertised schema is an `anyOf` of a
   * string and an array. A model reaching for "several" can send the array serialised
   * — `'["src/one.ts","src/deep"]'` — which the string arm accepts, so the whole text
   * reached `grep` as one path and the error named a file that does not exist. Both
   * spellings have to search the same places.
   */
  test("grep accepts several places, spelled as an array or as its JSON text", async () => {
    const root = fixture({
      "src/one.ts": "wanted\n",
      "src/deep/two.ts": "wanted\n",
      "other/three.ts": "wanted\n",
    });
    const asArray = (await call(root, "grep", { pattern: "wanted", path: ["src/one.ts", "src/deep"] })).result;
    const asText = (await call(root, "grep", { pattern: "wanted", path: '["src/one.ts","src/deep"]' })).result;
    expect(asArray.isError).toBe(false);
    expect(asText.isError).toBe(false);
    expect(asArray.content[0].text).toBe(asText.content[0].text);
    expect(asText.content[0].text).toContain("src/one.ts:1:");
    expect(asText.content[0].text).toContain("src/deep/two.ts:1:");
    expect(asText.content[0].text).not.toContain("other/three.ts");
    // A string that is not a serialised list stays one path, so an ordinary miss still
    // reports a missing file rather than searching something the caller did not name.
    const literal = (await call(root, "grep", { pattern: "wanted", path: "src/nope" })).result;
    expect(literal.isError).toBe(true);
  });

  test("glob finds files by path and grep finds them by content", async () => {
    const root = fixture({ "src/one.ts": "alpha\n", "src/deep/two.ts": "beta\n", "notes.md": "alpha\n" });
    const text = (await call(root, "glob", { pattern: "src/**/*.ts" })).result.content[0].text;
    expect(text).toContain("src/one.ts");
    expect(text).toContain("src/deep/two.ts");
    expect(text).not.toContain("notes.md");
  });

  /**
   * Ambiguity is refused rather than resolved: a caller that meant the second one has
   * no way to say so, and an edit made to the wrong line is found much later than an
   * error.
   */
  test("edit refuses text that appears more than once", async () => {
    const root = fixture({ "a.ts": "let x = 1;\nlet x = 1;\n" });
    const r = await call(root, "edit", { path: "a.ts", old_string: "let x = 1;", new_string: "let y = 2;" });
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("appears 2 times");

    const all = await call(root, "edit", {
      path: "a.ts", old_string: "let x = 1;", new_string: "let y = 2;", replace_all: true,
    });
    expect(all.result.isError).toBe(false);
    expect(readFileSync(join(root, "a.ts"), "utf8")).toBe("let y = 2;\nlet y = 2;\n");
  });

  test("edit refuses text that is not there", async () => {
    const root = fixture({ "a.ts": "let x = 1;\n" });
    const r = await call(root, "edit", { path: "a.ts", old_string: "absent", new_string: "x" });
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("not in");
  });

  test("write creates the directories above the file", async () => {
    const root = fixture({});
    const r = await call(root, "write", { path: "a/b/c.txt", content: "made" });
    expect(r.result.isError).toBe(false);
    expect(readFileSync(join(root, "a/b/c.txt"), "utf8")).toBe("made");
  });

  /**
   * The containment the official server gave by being handed one directory. `../`
   * resolves before the comparison, so walking out is refused rather than followed.
   */
  test("a path outside the roots is refused and says what is allowed", async () => {
    const root = fixture({ "a.ts": "x\n" });
    const r = await call(root, "read", { path: "../../../etc/passwd" });
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("outside the directories");
  });
});

describe("mcp/search.ts", () => {
  /**
   * This server used to be the one with no test at all.
   *
   * It imported `@huggingface/transformers` at module scope, so starting it cost the
   * import before it answered anything: the suite went from 42s to 3m28s and still
   * timed out. The note that stood here said to delete it if the import ever became
   * lazy. It has -- `loadRerankerOnce` imports the package when a search actually
   * reranks -- and starting the server now takes about a second.
   *
   * What this covers is that it starts and advertises what it should. Its own logic,
   * ranking and chunk selection, is pure and tested in `shared/bm25.ts`.
   */
  test("starts without loading the reranker, and advertises both searches", async () => {
    const r = await sendRequest("search.ts", { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
    const names = r.result.tools.map((t: { name: string }) => t.name);
    expect(names).toContain("search_code");
    expect(names).toContain("search_issues");
  });
});
