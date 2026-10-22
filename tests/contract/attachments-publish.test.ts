import { afterAll, describe, expect, test } from "bun:test";
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hermeticEnv, makeConfigDir } from "../../src/entrypoints/machinery/testing/harness.ts";
import {
  blobUrlFor,
  defaultBranchFrom,
  indexInfoFor,
  resolveDraftFiles,
} from "../../src/entrypoints/tools/mcp/attachments.ts";
import { DEFAULT_DOCS_BRANCH } from "../../src/adapters/runner/config.ts";

/**
 * `publish_draft`, held to what it puts on a branch.
 *
 * The contract tests in `attachments-shape.test.ts` check the request a probe builds,
 * because that is all a pull request can check about the upload endpoint. This one is
 * different: publishing runs `git` and nothing else, so a real remote can be built in
 * a temporary directory and the whole thing driven end to end. That matters more here
 * than anywhere — the tool's promise is that the run's own checkout is NOT disturbed,
 * and that promise is only checkable by looking at a checkout afterwards.
 *
 * No `gh` and no credential are involved. `publish_draft` authenticates by being a
 * server rather than a shell: it runs `git` in a process that inherited the checkout's
 * own `.git/config`. That is why this test can run on a pull request while the upload
 * endpoint's cannot.
 *
 * ## Windows: nine tests here are expected to fail there
 *
 * Not a defect left for later, and not a platform licence either — a decision, with
 * its reason, so the next person on Windows does not repeat this investigation.
 *
 * `resolveDraftFiles` accepts a draft under the work tree or under **`/tmp`**, which
 * it holds as a string literal. The fixture here builds its directories in
 * `os.tmpdir()`, which on Windows is `C:\Users\...\AppData\Local\Temp`. The two can
 * never meet: the check compares a `resolve()`d path against that literal, and on
 * Windows `resolve("/tmp/x")` is `C:\tmp\x` while the root it is compared to is still
 * `"/tmp"`. So the tool refuses every draft the fixture publishes, and the nine tests
 * that publish something fail on the refusal. Measured:
 *
 * ```
 * roots[1] (the literal)          = "/tmp"
 * resolve('/tmp/….md')            = "C:\\tmp\\….md"
 * source === roots[1]             ? false
 * source.startsWith(roots[1]+sep) ? false
 * ```
 *
 * Neither half is wrong. `/tmp` is the pinned interface — `/tmp/atomaton-workspace` is
 * the one directory of it that survives a run — and `os.tmpdir()` is the portable way
 * for a test to ask for a temporary directory. What makes it not worth reconciling is
 * **where the tool runs**: `publish_draft` is reached from an agent's run, and an
 * agent's run is a GitHub-hosted Ubuntu runner. A Windows-shaped fixture would arrange
 * for the test to pass in an environment the tool is never in, which is the one thing
 * a test must not do.
 *
 * `CONTRIBUTING.md`'s "Supported platform" states the same rule from the other side:
 * `bun run test` having failures on Windows is expected, and a Windows failure
 * **without** a reason written down is still a bug. See #169.
 */
const SCRIPTS_DIR = join(process.cwd(), "src/entrypoints/tools/mcp");

interface GitFixture {
  root: string;
  remote: string;
  work: string;
}

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", env: hermeticEnv() }).trim();
}

/**
 * A bare remote, a clone of it with `main` checked out, and a default branch.
 *
 * `--initial-branch=main` and a push of `main` are both needed before anything is
 * published: `publish_draft` reads the remote's default branch out of
 * `ls-remote --symref origin HEAD` and refuses to write to it, and a bare repository
 * with no ref has no HEAD to point at.
 */
function makeGitFixture(): GitFixture {
  const root = mkdtempSync(join(tmpdir(), "atomaton-publish-"));
  const remote = join(root, "remote.git");
  const seed = join(root, "seed");
  const work = join(root, "work");
  git(root, "init", "--quiet", "--bare", "--initial-branch=main", remote);
  git(root, "init", "--quiet", "--initial-branch=main", seed);
  git(seed, "config", "user.name", "Atomaton Test");
  git(seed, "config", "user.email", "atomaton@example.com");
  writeFileSync(join(seed, "README.md"), "the deliverable\n");
  git(seed, "add", "README.md");
  git(seed, "commit", "--quiet", "-m", "initial");
  git(seed, "remote", "add", "origin", remote);
  git(seed, "push", "--quiet", "origin", "main");
  git(root, "clone", "--quiet", "--branch", "main", remote, work);
  git(work, "config", "user.name", "Atomaton Engineer");
  git(work, "config", "user.email", "atomaton-engineer@users.noreply.github.com");
  return { root, remote, work };
}

/** Send one JSON-RPC request to a server started in `cwd` and resolve its first response line. */
function sendRequest(
  script: string,
  request: Record<string, unknown>,
  env: Record<string, string> = {},
  cwd = process.cwd(),
  timeoutMs = 20_000,
): Promise<any> {
  return new Promise((resolve, reject) => {
    // `process.execPath` rather than `"bun"`. Importing a tool server's module anywhere in
    // this process runs its own hardening, and one thing that does is drop writable
    // directories from PATH — a place a `bun` installed through npm lives. The runtime
    // already running this test is reached by an absolute path that cannot be a shim.
    const child = spawn(process.execPath, ["run", `${SCRIPTS_DIR}/${script}`], {
      env: { ...hermeticEnv(), GITHUB_REPOSITORY: "owner/repo", ...env },
      cwd,
    });
    let out = "";
    let err = "";
    child.stderr.on("data", (d) => (err += d.toString()));
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`timed out waiting for a response from ${script}; stderr=${err}`));
    }, timeoutMs);
    child.stdout.on("data", (d) => {
      out += d.toString();
      const line = out.split("\n").find((l) => l.trim());
      if (!line) return;
      clearTimeout(timer);
      child.kill();
      try {
        resolve(JSON.parse(line));
      } catch (error) {
        reject(error);
      }
    });
    child.stdin.write(JSON.stringify(request) + "\n");
  });
}

async function callPublish(cwd: string, args: Record<string, unknown>, env: Record<string, string> = {}): Promise<any> {
  return sendRequest(
    "attachments.ts",
    { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "publish_draft", arguments: args } },
    env,
    cwd,
  );
}

/**
 * A config directory whose `tools.servers.attachments.settings.branch` names
 * `branch`, pointed at by `ATOMATON_MACHINERY_ROOT`. That setting is the only
 * way a publish's branch is chosen now — there is no branch argument — so a test
 * that wants a branch other than the default speaks through the config the tool
 * reads, the same way a run does.
 */
function docsBranchConfig(branch: string): Record<string, string> {
  const dir = makeConfigDir({ tools: { servers: { attachments: { settings: { branch } } } } });
  configs.push(dir);
  return { ATOMATON_MACHINERY_ROOT: dir };
}

/** Every config directory a test made, removed in `afterAll` below. */
const configs: string[] = [];

afterAll(() => {
  for (const dir of configs) rmSync(dir, { recursive: true, force: true });
});

/** The result's payload, or the refusal the tool raised. */
function payloadOf(response: any): any {
  const text = response.result.content[0].text as string;
  if (response.result.isError) throw new Error(text);
  return JSON.parse(text);
}

describe("the tool the agents are handed", () => {
  test("tools/list offers publish_draft beside probe", async () => {
    const response = await sendRequest("attachments.ts", {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {},
    });
    const names = (response.result.tools as { name: string }[]).map((tool) => tool.name);
    expect(names).toContain("probe");
    expect(names).toContain("publish_draft");
  }, 30_000);

  /** The interface #111's skill is written against, pin names and all. */
  test("publish_draft advertises files and message — and no branch argument", async () => {
    const response = await sendRequest("attachments.ts", {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {},
    });
    const tool = (response.result.tools as { name: string; inputSchema: any }[]).find(
      (candidate) => candidate.name === "publish_draft",
    );
    expect(tool, "no publish_draft tool").toBeDefined();
    // No `branch`: the branch is the repository's own config setting, and an
    // argument naming one is what let a publish land on somebody's work branch.
    expect(Object.keys(tool!.inputSchema.properties).sort()).toEqual(["files", "message"]);
    expect(tool!.inputSchema.required).toContain("files");
    expect(tool!.inputSchema.required).toContain("message");
    const item = tool!.inputSchema.properties.files.items;
    expect(Object.keys(item.properties).sort()).toEqual(["path", "target"]);
  }, 30_000);
});

describe("what a caller names has to be publishable", () => {
  test("a draft that is not on disk is refused by name", () => {
    expect(() => resolveDraftFiles([{ path: "/tmp/atomaton-does-not-exist-3f8a.md", target: "designs/x.md" }])).toThrow(
      /no such file/,
    );
  });

  test("a target git will not accept is refused before anything is pushed", () => {
    const draft = join(tmpdir(), `atomaton-publish-target-${Date.now()}.md`);
    writeFileSync(draft, "draft\n");
    try {
      for (const target of ["/absolute/x.md", "../escape.md", "a/../b.md", ".git/hooks/x", "a//b.md", "back\\slash.md"]) {
        expect(() => resolveDraftFiles([{ path: draft, target }]), target).toThrow();
      }
    } finally {
      rmSync(draft, { force: true });
    }
  });

  test("two drafts for one target are refused, because one would win silently", () => {
    const draft = join(tmpdir(), `atomaton-publish-dupe-${Date.now()}.md`);
    writeFileSync(draft, "draft\n");
    try {
      expect(() =>
        resolveDraftFiles([
          { path: draft, target: "designs/x.md" },
          { path: draft, target: "designs/x.md" },
        ]),
      ).toThrow(/two drafts target/);
    } finally {
      rmSync(draft, { force: true });
    }
  });

  test("a path outside the checkout and /tmp is refused", () => {
    expect(() => resolveDraftFiles([{ path: "/etc/hostname", target: "designs/x.md" }])).toThrow(/outside the places/);
  });
});

describe("the strings whose exact shape decides what lands on the branch", () => {
  test("the index listing is NUL-separated, tab-before-path, mode first", () => {
    const listing = indexInfoFor([
      { blob: "a".repeat(40), target: "designs/12/one.md" },
      { blob: "b".repeat(40), target: "designs/12/a b.md" },
    ]);
    expect(listing).toBe(`${"100644"} blob ${"a".repeat(40)}\tdesigns/12/one.md\0${"100644"} blob ${"b".repeat(40)}\tdesigns/12/a b.md\0`);
    // NUL-separated, and the reason: a path with a space must survive as one record.
    expect(listing.split("\0").filter(Boolean)).toHaveLength(2);
  });

  test("the URL a person pastes is the blob view, which renders the document", () => {
    expect(blobUrlFor("owner/repo", "business-docs", "designs/12/one.md")).toBe(
      "https://github.com/owner/repo/blob/business-docs/designs/12/one.md",
    );
  });

  /**
   * A target is allowed to contain a space or a `#` — git accepts both — and neither is
   * legal unencoded in a URL: a space ends the path where the reader's client decides,
   * and a `#` starts a fragment, so the link would open the branch at nothing. Encoded
   * per segment so the separators survive, which is what a URL needs and what adding a
   * `.replace(" ", "%20")` over the whole path would not give.
   */
  test("a target with a space or a # is encoded, and its separators are not", () => {
    expect(blobUrlFor("owner/repo", "business-docs", "designs/12/a b.md")).toBe(
      "https://github.com/owner/repo/blob/business-docs/designs/12/a%20b.md",
    );
    expect(blobUrlFor("owner/repo", "business-docs", "designs/12/a#b.md")).toContain("a%23b.md");
    expect(blobUrlFor("owner/repo", "business-docs", "a/b/c.md").split("/blob/business-docs/")[1]).toBe("a/b/c.md");
  });

  test("the remote's default branch is read out of ls-remote --symref", () => {
    // Exactly what `git ls-remote --symref origin HEAD` prints, measured against a
    // temporary remote whose default branch is `trunk`.
    expect(defaultBranchFrom("ref: refs/heads/trunk\tHEAD\nbc47344\tHEAD\n")).toBe("trunk");
    // A remote that answers without the symref line leaves the question unanswered,
    // and the caller then cannot refuse a publish onto the default branch.
    expect(defaultBranchFrom("abc\tHEAD\n")).toBeUndefined();
  });
});

describe("publishing onto a real remote", () => {
  test("the first publish creates an orphan branch and leaves the checkout alone", async () => {
    const { root, remote, work } = makeGitFixture();
    try {
      const draft = join(root, "overview.md");
      writeFileSync(draft, "# Overview\n\nThe first draft.\n");
      // Uncommitted work in the run's tree, which is what a branch switch would lose.
      writeFileSync(join(work, "in-progress.txt"), "uncommitted\n");
      const headBefore = git(work, "rev-parse", "HEAD");
      const indexBefore = git(work, "write-tree");

      const published = payloadOf(
        await callPublish(work, {
          files: [{ path: draft, target: "designs/12/overview.md" }],
          message: "publish: overview",
        }),
      );

      expect(published.branch).toBe(DEFAULT_DOCS_BRANCH);
      expect(published.commit_sha).toMatch(/^[0-9a-f]{40}$/);
      expect(published.created).toBe(true);
      expect(published.files).toEqual([
        {
          target: "designs/12/overview.md",
          blob_url: `https://github.com/owner/repo/blob/${DEFAULT_DOCS_BRANCH}/designs/12/overview.md`,
        },
      ]);

      // An orphan: one commit, no parent, and `main` untouched.
      const parents = git(root, "--git-dir", remote, "rev-list", "--parents", "-n", "1", DEFAULT_DOCS_BRANCH).split(/\s+/);
      expect(parents).toHaveLength(1);
      expect(parents[0]).toBe(published.commit_sha);
      expect(git(root, "--git-dir", remote, "rev-parse", "main")).toBe(headBefore);
      expect(git(root, "--git-dir", remote, "show", `${DEFAULT_DOCS_BRANCH}:designs/12/overview.md`)).toContain(
        "The first draft.",
      );

      // And the run's own checkout: same HEAD, same index, same uncommitted work.
      expect(git(work, "rev-parse", "HEAD")).toBe(headBefore);
      expect(git(work, "write-tree")).toBe(indexBefore);
      expect(git(work, "branch", "--show-current")).toBe("main");
      expect(git(work, "status", "--porcelain")).toContain("in-progress.txt");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 60_000);

  test("a second publish appends to the same branch, so the history is there to diff", async () => {
    const { root, remote, work } = makeGitFixture();
    try {
      const first = join(root, "one.md");
      const second = join(root, "two.md");
      writeFileSync(first, "one\n");
      const created = payloadOf(
        await callPublish(work, { files: [{ path: first, target: "designs/12/one.md" }], message: "publish: one" }),
      );

      writeFileSync(second, "two\n");
      const appended = payloadOf(
        await callPublish(work, { files: [{ path: second, target: "designs/12/two.md" }], message: "publish: two" }),
      );

      expect(appended.created).toBe(false);
      expect(appended.commit_sha).not.toBe(created.commit_sha);
      // The parent is the first publish, which is what makes a diff readable.
      expect(git(root, "--git-dir", remote, "rev-parse", `${appended.commit_sha}^`)).toBe(created.commit_sha);
      // The first document is still there: append, not replace.
      expect(git(root, "--git-dir", remote, "ls-tree", "-r", "--name-only", DEFAULT_DOCS_BRANCH).split("\n").sort()).toEqual([
        "designs/12/one.md",
        "designs/12/two.md",
      ]);
      expect(git(root, "--git-dir", remote, "show", `${DEFAULT_DOCS_BRANCH}:designs/12/one.md`)).toBe("one");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 60_000);

  test("re-publishing a target replaces its content and keeps the branch's other files", async () => {
    const { root, remote, work } = makeGitFixture();
    try {
      const draft = join(root, "overview.md");
      writeFileSync(draft, "# v1\n");
      await callPublish(work, { files: [{ path: draft, target: "designs/12/overview.md" }], message: "publish: v1" });
      writeFileSync(draft, "# v2\n");
      await callPublish(work, {
        files: [
          { path: draft, target: "designs/12/overview.md" },
          { path: draft, target: "designs/12/copy.md" },
        ],
        message: "publish: v2 and a copy",
      });

      expect(git(root, "--git-dir", remote, "show", `${DEFAULT_DOCS_BRANCH}:designs/12/overview.md`)).toBe("# v2");
      expect(git(root, "--git-dir", remote, "show", `${DEFAULT_DOCS_BRANCH}:designs/12/copy.md`)).toBe("# v2");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 60_000);

  test("a document's bytes reach the branch unchanged", async () => {
    const { root, remote, work } = makeGitFixture();
    try {
      // Bytes a text-shaped round trip would damage: a CRLF pair, a lone high byte,
      // and a NUL. A `.docx` is the ordinary case; this is a `.docx`-shaped file.
      const bytes = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x0d, 0x0a, 0x00, 0xff, 0xfe, 0x41]);
      const draft = join(root, "original.docx");
      writeFileSync(draft, bytes);

      const published = payloadOf(
        await callPublish(work, { files: [{ path: draft, target: "designs/12/original.docx" }], message: "publish" }),
      );

      const stored = execFileSync("git", ["--git-dir", remote, "cat-file", "blob", `${DEFAULT_DOCS_BRANCH}:designs/12/original.docx`], {
        env: hermeticEnv(),
      });
      expect(Buffer.compare(stored, bytes)).toBe(0);
      expect(published.files[0].blob_url).toContain("designs/12/original.docx");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 60_000);

  test("publishing onto the remote's default branch is refused, and nothing is pushed", async () => {
    const { root, remote, work } = makeGitFixture();
    // The branch is what the config says it is, and the config here says `main` —
    // a settings mistake, which is exactly the case the guard exists to catch.
    const configEnv = docsBranchConfig("main");
    try {
      const draft = join(root, "overview.md");
      writeFileSync(draft, "# Overview\n");
      const mainBefore = git(root, "--git-dir", remote, "rev-parse", "main");

      const response = await callPublish(
        work,
        {
          files: [{ path: draft, target: "designs/12/overview.md" }],
          message: "publish onto main",
        },
        configEnv,
      );
      expect(response.result.isError).toBe(true);
      expect(response.result.content[0].text).toContain("default branch");
      expect(response.result.content[0].text).toContain("config.yaml");
      expect(git(root, "--git-dir", remote, "rev-parse", "main")).toBe(mainBefore);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 60_000);

  test("the configured branch is the one used, and its name is checked by git", async () => {
    const { root, remote, work } = makeGitFixture();
    const configEnv = docsBranchConfig("research-notes");
    try {
      const draft = join(root, "overview.md");
      writeFileSync(draft, "# Overview\n");
      const published = payloadOf(
        await callPublish(
          work,
          {
            files: [{ path: draft, target: "designs/12/overview.md" }],
            message: "publish elsewhere",
          },
          configEnv,
        ),
      );
      expect(published.branch).toBe("research-notes");
      expect(git(root, "--git-dir", remote, "rev-parse", "research-notes")).toBe(published.commit_sha);

      const bad = await callPublish(
        work,
        {
          files: [{ path: draft, target: "designs/12/overview.md" }],
          message: "publish",
        },
        docsBranchConfig("not a branch name"),
      );
      expect(bad.result.isError).toBe(true);
      expect(bad.result.content[0].text).toContain("not a branch name git accepts");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 60_000);

  test("publishing onto the branch this run is checked out on is refused too", async () => {
    const { root, work } = makeGitFixture();
    const configEnv = docsBranchConfig("atomaton/issue-152");
    try {
      const draft = join(root, "overview.md");
      writeFileSync(draft, "# Overview\n");
      // A branch other than the remote's default, so the refusal tested here is the
      // one about the run's own work — which is the case the orphan branch exists for.
      // The branch comes from the config now; there is no argument to name it with,
      // which is the point: the only branch a publish can reach is the configured one.
      git(work, "checkout", "--quiet", "-b", "atomaton/issue-152");
      const response = await callPublish(
        work,
        {
          files: [{ path: draft, target: "designs/12/overview.md" }],
          message: "publish onto the work branch",
        },
        configEnv,
      );
      expect(response.result.isError).toBe(true);
      expect(response.result.content[0].text).toContain("checked out");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 60_000);

  test("a branch configured with its full ref is published to the branch, not refs/heads/refs/heads", async () => {
    const { root, remote, work } = makeGitFixture();
    const configEnv = docsBranchConfig("refs/heads/business-docs");
    try {
      const draft = join(root, "overview.md");
      writeFileSync(draft, "# Overview\n");
      const published = payloadOf(
        await callPublish(
          work,
          {
            files: [{ path: draft, target: "designs/12/overview.md" }],
            message: "publish by full ref",
          },
          configEnv,
        ),
      );
      expect(published.branch).toBe("business-docs");
      expect(git(root, "--git-dir", remote, "rev-parse", "refs/heads/business-docs")).toBe(published.commit_sha);
      // The refspec adds `refs/heads/` itself, so the full spelling must not arrive twice.
      expect(git(root, "--git-dir", remote, "for-each-ref", "--format=%(refname)", "refs/heads").split("\n").sort()).toEqual([
        "refs/heads/business-docs",
        "refs/heads/main",
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 60_000);

  test("a target with a space, and one with a trailing space, both land where they say", async () => {
    const { root, remote, work } = makeGitFixture();
    try {
      const draft = join(root, "overview.md");
      writeFileSync(draft, "# Overview\n");
      // Two shapes a naive implementation loses: the space survives only because the
      // index listing is NUL-separated, and the TRAILING space is the one the
      // verification step reports wrongly if it searches a trimmed listing.
      const published = payloadOf(
        await callPublish(work, {
          files: [
            { path: draft, target: "designs/12/quarterly report.md" },
            { path: draft, target: "designs/12/trailing .md" },
          ],
          message: "publish names with spaces",
        }),
      );

      expect(git(root, "--git-dir", remote, "ls-tree", "-r", "--name-only", DEFAULT_DOCS_BRANCH).split("\n").sort()).toEqual([
        "designs/12/quarterly report.md",
        "designs/12/trailing .md",
      ]);
      expect(git(root, "--git-dir", remote, "show", `${DEFAULT_DOCS_BRANCH}:designs/12/quarterly report.md`)).toBe("# Overview");
      expect(published.files.map((file: { blob_url: string }) => file.blob_url)).toEqual([
        `https://github.com/owner/repo/blob/${DEFAULT_DOCS_BRANCH}/designs/12/quarterly%20report.md`,
        `https://github.com/owner/repo/blob/${DEFAULT_DOCS_BRANCH}/designs/12/trailing%20.md`,
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 60_000);

  test("a relative path is resolved against the work tree the server was started in", async () => {
    const { root, remote, work } = makeGitFixture();
    try {
      // Inside the checkout the server runs in, named relatively — the spelling the
      // pinned interface promises works ("a relative path inside the work tree").
      writeFileSync(join(work, "draft.md"), "# Relative\n");
      const published = payloadOf(
        await callPublish(work, {
          files: [{ path: "draft.md", target: "designs/12/draft.md" }],
          message: "publish a relative path",
        }),
      );
      expect(git(root, "--git-dir", remote, "show", `${DEFAULT_DOCS_BRANCH}:designs/12/draft.md`)).toBe("# Relative");
      expect(published.files[0].blob_url).toContain("/designs/12/draft.md");
      // The call wrote nothing else into the checkout: the draft it read is still the
      // only untracked file, and HEAD did not move.
      expect(git(work, "status", "--porcelain")).toBe("?? draft.md");
      expect(git(work, "branch", "--show-current")).toBe("main");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 60_000);

  test("a remote that cannot be read is reported rather than pushed to blind", async () => {
    const { root, work } = makeGitFixture();
    try {
      const draft = join(root, "overview.md");
      writeFileSync(draft, "# Overview\n");
      git(work, "remote", "set-url", "origin", join(root, "nowhere.git"));

      const response = await callPublish(work, {
        files: [{ path: draft, target: "designs/12/overview.md" }],
        message: "publish",
      });
      expect(response.result.isError).toBe(true);
      expect(response.result.content[0].text).toContain("could not read origin");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 60_000);
});

/** The file this suite is written against, so a renamed tool is a red check rather than a stale test. */
describe("the server file itself", () => {
  test("defines publish_draft with the pinned argument names", () => {
    const source = readFileSync(join(SCRIPTS_DIR, "attachments.ts"), "utf8");
    expect(source).toContain('name: "publish_draft"');
    expect(source).toContain("PUBLISH_DRAFT_SCHEMA");
  });
});
