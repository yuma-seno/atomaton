/**
 * base-edit.test.ts — `open_base_edit_pr`, held to what it puts on a branch and what it
 * leaves alone.
 *
 * ## Why a real remote
 *
 * Two of the promises cannot be checked any other way. The first is that the commit is
 * built on the BASE BRANCH's tree: the only evidence is the remote's branch and the
 * commit its tree hangs from. The second is that the run's own checkout is untouched —
 * and that is a fact about `HEAD`, the index and the working tree AFTER the call, which
 * a fixture can look at directly because it built them.
 *
 * `gh` is the seam, and it is faked: `pr create`, the comment that carries the ask, and
 * the validation dispatch are the three writes the tool makes through it, and every one
 * of them is asserted on the argv the fake recorded. No credential is involved, and
 * nothing here reaches GitHub.
 *
 * ## The base branch, and how the fixture names it
 *
 * `baseBranch()` reads `base_branch` from `config.yaml` through `MACHINERY_ROOT_VAR`,
 * and `hermeticEnv()` strips that variable — so the server reads the fixture's own
 * `.github/atomaton/config.yaml`, in the working directory it is started in. That is the
 * same file the tool refuses to amend, which is why it is written by the fixture and
 * never by a call.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { hermeticEnv } from "../../src/entrypoints/machinery/testing/harness.ts";
import { FAKE_GH_IMPL } from "../../src/entrypoints/machinery/testing/fake-gh-env.ts";
import {
  amendBranchName,
  amendPathProblem,
  baseEditPrBody,
  editedText,
  overlayTwinPath,
} from "../../src/domain/machinery/base-edit.ts";

const SCRIPTS_DIR = join(process.cwd(), "src/entrypoints/tools/mcp");
const BASE = "atomaton/issue-218";

/** Every temporary root a test made, removed in `afterAll`. */
const roots: string[] = [];

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", env: hermeticEnv() }).trim();
}

/** Write a file under `root`, creating its directories. */
function put(root: string, path: string, text: string): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}

interface Fixture {
  root: string;
  remote: string;
  /** The clone the tool runs in: a work branch checked out, and uncommitted work in it. */
  work: string;
  /** What `git show <base>:<path>` answers on the remote, as the seed committed it. */
  baseTip: string;
}

/**
 * A bare remote whose base branch holds a small machinery tree, and a clone of it.
 *
 * The clone is deliberately DIRTY — a modified file and a staged new one — because the
 * promise being checked is that this tool does not disturb a run that is in the middle
 * of its own work. A clean fixture would pass whether or not the tool touched the tree.
 */
function makeFixture(): Fixture {
  const root = mkdtempSync(join(tmpdir(), "atomaton-base-edit-"));
  roots.push(root);
  const remote = join(root, "remote.git");
  const seed = join(root, "seed");
  const work = join(root, "work");

  git(root, "init", "--quiet", "--bare", "--initial-branch", BASE, remote);
  git(root, "init", "--quiet", "--initial-branch", BASE, seed);
  git(seed, "config", "user.name", "Atomaton Test");
  git(seed, "config", "user.email", "atomaton@example.com");

  put(seed, ".github/atomaton/config.yaml", `base_branch: "${BASE}"\n`);
  put(seed, ".github/atomaton/skills/project/conventions.md", "line one\nline two\n");
  put(seed, "self/atomaton/skills/project/conventions.md", "line one\nline two\n");
  put(seed, ".github/atomaton/prompt-template.md", "you are an agent\n");
  put(seed, ".github/atomaton/scripts/run.sh", "#!/usr/bin/env bash\necho hi\n");
  git(seed, "add", ".");
  git(seed, "update-index", "--chmod=+x", ".github/atomaton/scripts/run.sh");
  git(seed, "commit", "--quiet", "-m", "initial");
  git(seed, "remote", "add", "origin", remote);
  git(seed, "push", "--quiet", "origin", BASE);

  git(root, "clone", "--quiet", "--branch", BASE, remote, work);
  git(work, "config", "user.name", "Atomaton Engineer");
  git(work, "config", "user.email", "atomaton-engineer@users.noreply.github.com");
  // The run's own work, on top of the base branch: a change to a file and a staged one.
  // Both must still be there afterwards, byte for byte.
  writeFileSync(join(work, "README.md"), "the run's own file\n");
  writeFileSync(join(work, ".github/atomaton/prompt-template.md"), "a local edit the run is delivering\n");
  git(work, "add", "README.md");

  return { root, remote, work, baseTip: git(seed, "rev-parse", "HEAD") };
}

/** A fake `gh`, its call log, and the env that points a child at it. */
function fakeGh(root: string, rulesAfter: Record<string, unknown>[] = []): Record<string, string> {
  const dir = join(root, "fake-gh");
  mkdirSync(dir, { recursive: true });
  const log = join(dir, "calls.jsonl");
  writeFileSync(log, "");
  const rules = [
    // First: nothing else may match a `gh pr create` and answer it with an id.
    { match: ["pr", "create"], stdout: "https://github.com/owner/repo/pull/41\n" },
    { match: ["issues/41/comments"], stdout: "9001\n" },
    { match: ["workflow", "run"], stdout: "" },
    ...rulesAfter,
  ];
  return {
    ATOMATON_FAKE_GH: FAKE_GH_IMPL,
    FAKE_GH_RESPONSES: JSON.stringify(rules),
    FAKE_GH_LOG: log,
    GH_TOKEN: "fake-gh-must-be-used",
    GITHUB_TOKEN: "fake-gh-must-be-used",
    GH_CONFIG_DIR: dir,
    ATOMATON_OPS_LOG: join(dir, "ops.log"),
  };
}

/** The `gh` invocations the fake recorded, oldest first. */
function ghCalls(root: string): string[][] {
  return readFileSync(join(root, "fake-gh", "calls.jsonl"), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as string[]);
}

/** One JSON-RPC call to `github.ts`, in `cwd`, and its first response line. */
function callTool(
  name: string,
  args: Record<string, unknown>,
  env: Record<string, string>,
  cwd: string,
): Promise<any> {
  return new Promise((resolve, reject) => {
    // `process.execPath` rather than `"bun"`: importing a tool server anywhere in this
    // process runs its own hardening, and that drops writable directories from PATH.
    const child = spawn(process.execPath, ["run", join(SCRIPTS_DIR, "github.ts")], {
      env: { ...hermeticEnv(), GITHUB_REPOSITORY: "owner/repo", ...env },
      cwd,
    });
    let out = "";
    let err = "";
    child.stderr.on("data", (d) => (err += d.toString()));
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`timed out waiting for ${name}; stderr=${err}`));
    }, 30_000);
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
    child.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }) + "\n",
    );
  });
}

/** The result's payload, or the refusal the tool raised. */
function payloadOf(response: any): any {
  const text = response.result.content[0].text as string;
  if (response.result.isError) throw new Error(text);
  return JSON.parse(text);
}

function refusal(response: any): string {
  if (!response.result.isError) throw new Error(`expected a refusal, got ${JSON.stringify(response.result)}`);
  return response.result.content[0].text as string;
}

describe("open_base_edit_pr", () => {
  test("builds one commit on the base branch, opens a pull request against it, and leaves this run's checkout alone", async () => {
    const fixture = makeFixture();
    const env = fakeGh(fixture.root);
    const head = git(fixture.work, "rev-parse", "HEAD");
    const status = git(fixture.work, "status", "--porcelain");
    const localPrompt = readFileSync(join(fixture.work, ".github/atomaton/prompt-template.md"), "utf8");

    const payload = payloadOf(
      await callTool(
        "open_base_edit_pr",
        {
          title: "Sharpen the conventions skill",
          message: "sharpens one line of the conventions skill",
          body: "The line was ambiguous; say which side wins.",
          files: [{ path: ".github/atomaton/skills/project/conventions.md", old: "line two\n", new: "line 2\n" }],
        },
        env,
        fixture.work,
      ),
    );

    // What it reports: the pull request, the commit, and that the twin was staged with it.
    expect(payload.number).toBe(41);
    expect(payload.url).toBe("https://github.com/owner/repo/pull/41");
    expect(payload.base).toBe(BASE);
    expect(payload.files).toEqual([
      { path: ".github/atomaton/skills/project/conventions.md", twin: "self/atomaton/skills/project/conventions.md" },
    ]);
    expect(payload.validation_dispatched).toBe(true);
    expect(payload.commit).toMatch(/^[0-9a-f]{40}$/);

    // One commit, on the base branch's tip, holding both copies of the file.
    expect(git(fixture.remote, "rev-list", "--count", `${fixture.baseTip}..${payload.branch}`)).toBe("1");
    expect(git(fixture.remote, "rev-parse", `${payload.branch}^`)).toBe(fixture.baseTip);
    expect(git(fixture.remote, "show", `${payload.branch}:.github/atomaton/skills/project/conventions.md`)).toBe(
      "line one\nline 2",
    );
    expect(git(fixture.remote, "show", `${payload.branch}:self/atomaton/skills/project/conventions.md`)).toBe(
      "line one\nline 2",
    );

    // And the run's own checkout, untouched: same HEAD, same index, same uncommitted work.
    expect(git(fixture.work, "rev-parse", "HEAD")).toBe(head);
    expect(git(fixture.work, "status", "--porcelain")).toBe(status);
    expect(readFileSync(join(fixture.work, ".github/atomaton/prompt-template.md"), "utf8")).toBe(localPrompt);

    // The pull request aims at the base branch and names the reviewer, and carries no
    // parent-issue tag: it belongs to no node, so nothing waits on it.
    const create = ghCalls(fixture.root).find((argv) => argv[0] === "pr" && argv[1] === "create");
    expect(create).toBeDefined();
    const bodyAt = create!.indexOf("--body") + 1;
    const body = create![bodyAt] ?? "";
    expect(create![create!.indexOf("--base") + 1]).toBe(BASE);
    expect(create![create!.indexOf("--head") + 1]).toBe(payload.branch);
    expect(body.startsWith("/reviewer\n\n")).toBe(true);
    expect(body).not.toContain("atomaton:parent-issue");

    // The ask, then the dispatch that names it. Without the id the dispatched run has
    // nothing to claim, and the thread has no record of what it was answering.
    const dispatch = ghCalls(fixture.root).find((argv) => argv[0] === "workflow" && argv[1] === "run");
    expect(dispatch).toBeDefined();
    expect(dispatch![dispatch!.indexOf("--repo") + 1]).toBe("owner/repo");
    expect(dispatch).toContain("number=41");
    expect(dispatch).toContain("ask=9001");
  }, 60_000);

  test("a path with no overlay twin is staged alone, and the reply says so", async () => {
    const fixture = makeFixture();
    const payload = payloadOf(
      await callTool(
        "open_base_edit_pr",
        {
          title: "Clarify the prompt template",
          message: "clarifies the prompt template",
          files: [{ path: ".github/atomaton/prompt-template.md", old: "you are an agent\n", new: "you are an agent.\n" }],
        },
        fakeGh(fixture.root),
        fixture.work,
      ),
    );

    expect(payload.files).toEqual([{ path: ".github/atomaton/prompt-template.md", twin: null }]);
    expect(payload.staged).toEqual([".github/atomaton/prompt-template.md"]);
    // The deployed copy moved; no `self/` copy of it exists on the base branch.
    expect(git(fixture.remote, "show", `${payload.branch}:.github/atomaton/prompt-template.md`)).toBe("you are an agent.");
    expect(git(fixture.remote, "ls-tree", "--name-only", payload.branch, "self/atomaton/prompt-template.md")).toBe("");
  }, 60_000);

  /**
   * The mode is a fact about the file that content cannot carry: a script written back as
   * `100644` stops being runnable, and nothing would say so.
   */
  test("an executable file stays executable", async () => {
    const fixture = makeFixture();
    const payload = payloadOf(
      await callTool(
        "open_base_edit_pr",
        {
          title: "Say it twice",
          message: "says it twice",
          files: [{ path: ".github/atomaton/scripts/run.sh", old: "echo hi\n", new: "echo hi\necho hi\n" }],
        },
        fakeGh(fixture.root),
        fixture.work,
      ),
    );

    expect(git(fixture.remote, "ls-tree", payload.branch, "--", ".github/atomaton/scripts/run.sh")).toBe(
      `100755 blob ${git(fixture.remote, "rev-parse", `${payload.branch}:.github/atomaton/scripts/run.sh`)}\t.github/atomaton/scripts/run.sh`,
    );
  }, 60_000);

  test("`old` that the base branch no longer holds is refused, and nothing is pushed", async () => {
    const fixture = makeFixture();
    const response = await callTool(
      "open_base_edit_pr",
      {
        title: "A change against a stale read",
        message: "nothing",
        files: [{ path: ".github/atomaton/prompt-template.md", old: "the line this run remembered\n", new: "x\n" }],
      },
      fakeGh(fixture.root),
      fixture.work,
    );

    expect(refusal(response)).toContain("does not appear in the file");
    expect(git(fixture.remote, "branch", "--list", "atomaton/amend-*")).toBe("");
    expect(ghCalls(fixture.root).some((argv) => argv[0] === "pr")).toBe(false);
  }, 60_000);

  test("`config.yaml` is refused before anything is read or pushed", async () => {
    const fixture = makeFixture();
    const response = await callTool(
      "open_base_edit_pr",
      {
        title: "Widen a credential",
        message: "widens a credential",
        files: [{ path: ".github/atomaton/config.yaml", content: "base_branch: main\n" }],
      },
      fakeGh(fixture.root),
      fixture.work,
    );

    expect(refusal(response)).toContain("credentials");
    expect(ghCalls(fixture.root)).toEqual([]);
  }, 60_000);

  /**
   * `reviewer: ""` is a legitimate answer — CI still runs — and the silent failure it
   * creates is a pull request nobody was told about. Both halves are held here: no
   * reviewer line in the body, and a notice on the pull request itself.
   */
  test("no reviewer named writes no line, and a notice saying nobody is coming", async () => {
    const fixture = makeFixture();
    const payload = payloadOf(
      await callTool(
        "open_base_edit_pr",
        {
          title: "A change nobody is asked to review",
          message: "leaves it for a person",
          reviewer: "",
          files: [{ path: ".github/atomaton/prompt-template.md", old: "you are an agent\n", new: "you are an agent.\n" }],
        },
        fakeGh(fixture.root),
        fixture.work,
      ),
    );
    expect(payload.validation_dispatched).toBe(true);

    const create = ghCalls(fixture.root).find((argv) => argv[0] === "pr" && argv[1] === "create")!;
    const body = create[create.indexOf("--body") + 1] ?? "";
    expect(body.startsWith("Atomaton:")).toBe(true);
    expect(body).not.toContain("/reviewer");

    const notice = ghCalls(fixture.root).find((argv) => argv[0] === "pr" && argv[1] === "comment");
    expect(notice).toBeDefined();
    expect(notice![notice!.indexOf("--body") + 1]).toContain("nothing is scheduled to look at it");
  }, 60_000);

  /**
   * The reviewer line is written BY THE TOOL, and a command on a line of its own is
   * otherwise refused -- so the check runs on the caller's own words rather than on the
   * assembled body. Both halves are held here: the tool's own line goes through, and a
   * `/<agent>` the caller wrote does not.
   */
  test("a command the caller wrote in `body` is refused; the reviewer line is not", async () => {
    const fixture = makeFixture();
    const refused = await callTool(
      "open_base_edit_pr",
      {
        title: "Ask for a run",
        message: "asks for a run",
        body: "/engineer",
        files: [{ path: ".github/atomaton/prompt-template.md", old: "you are an agent\n", new: "x\n" }],
      },
      fakeGh(fixture.root),
      fixture.work,
    );
    expect(refusal(refused)).toContain("/engineer");
    // Refused before the push: a branch carrying a commit no pull request describes is
    // work somebody has to find and delete.
    expect(ghCalls(fixture.root)).toEqual([]);
    expect(git(fixture.remote, "branch", "--list", "atomaton/amend-*")).toBe("");
  }, 60_000);

  test("a file the base branch does not have is created from `content`, and one without it is refused", async () => {
    const fixture = makeFixture();
    const created = payloadOf(
      await callTool(
        "open_base_edit_pr",
        {
          title: "Add a skill",
          message: "adds a skill",
          files: [{ path: ".github/atomaton/skills/project/new.md", content: "a new skill\n" }],
        },
        fakeGh(fixture.root),
        fixture.work,
      ),
    );
    expect(created.staged).toEqual([".github/atomaton/skills/project/new.md"]);
    expect(created.files).toEqual([{ path: ".github/atomaton/skills/project/new.md", twin: null }]);
    expect(git(fixture.remote, "show", `${created.branch}:.github/atomaton/skills/project/new.md`)).toBe("a new skill");

    const refused = await callTool(
      "open_base_edit_pr",
      {
        title: "Replace a file that is not there",
        message: "nothing",
        files: [{ path: ".github/atomaton/skills/project/gone.md", old: "x", new: "y" }],
      },
      fakeGh(fixture.root),
      fixture.work,
    );
    expect(refusal(refused)).toContain("does not exist");
  }, 60_000);
});

describe("the rules the tool runs on", () => {
  test("only `.github/atomaton/` may be amended, and never the config", () => {
    expect(amendPathProblem(".github/atomaton/prompt-template.md")).toBeUndefined();
    expect(amendPathProblem(".github/atomaton/skills/x.md")).toBeUndefined();
    expect(amendPathProblem(".github/atomaton/config.yaml")).toContain("credentials");
    expect(amendPathProblem(".github/workflows/ci.yml")).toContain("outside");
    expect(amendPathProblem("src/domain/x.ts")).toContain("outside");
    expect(amendPathProblem("/etc/passwd")).toContain("absolute");
    expect(amendPathProblem(".github/atomaton/../config.yaml")).toContain("`..`");
    expect(amendPathProblem(" .github/atomaton/x.md")).toContain("whitespace");
  });

  test("a `self/` twin is the same path with the deployed root swapped", () => {
    expect(overlayTwinPath(".github/atomaton/skills/x.md")).toBe("self/atomaton/skills/x.md");
    expect(overlayTwinPath(".github/atomaton/scripts/run.sh")).toBe("self/atomaton/scripts/run.sh");
  });

  test("a replacement lands at one place, or nowhere", () => {
    const edit = { path: "p" };
    expect(editedText("a\nb\na\n", { ...edit, old: "b", new: "B" }, "base")).toBe("a\nB\na\n");
    // Two matches is not a place to apply a change: `new` would land where nobody looked.
    expect(() => editedText("a\nb\na\n", { ...edit, old: "a", new: "A" }, "base")).toThrow(/appears 2 times/);
    expect(() => editedText("a\n", { ...edit, old: "z", new: "Z" }, "base")).toThrow(/does not appear/);
    // An empty search matches everywhere, so it is refused rather than accepted once.
    expect(() => editedText("a\n", { ...edit, old: "", new: "Z" }, "base")).toThrow(/`old` is empty/);
    // Whole-file and replacement are two answers to one question.
    expect(() => editedText("a\n", { ...edit, old: "a", new: "A", content: "b\n" }, "base")).toThrow(/not both/);
    expect(editedText("a\n", { ...edit, content: "b\n" }, "base")).toBe("b\n");
    // `$&` in the replacement is text, not a reference to the match.
    expect(editedText("x\n", { ...edit, old: "x", new: "$& and $'" }, "base")).toBe("$& and $'\n");
  });

  test("the branch name is outside the issue namespace and sorts by when it was made", () => {
    const early = amendBranchName(1_700_000_000_000);
    const later = amendBranchName(1_700_000_001_000);
    expect(early).toMatch(/^atomaton\/amend-[0-9a-z]+$/);
    expect(early.startsWith("atomaton/issue-")).toBe(false);
    expect(later > early).toBe(true);
    expect(amendBranchName(1_700_000_000_000)).toBe(early);
  });

  test("the body names the reviewer, the observing thread, and no parent-issue tag", () => {
    const body = baseEditPrBody({
      observing: "#562",
      base: BASE,
      reviewer: "reviewer",
      files: [
        { path: ".github/atomaton/a.md", twin: "self/atomaton/a.md" },
        { path: ".github/atomaton/b.md", twin: undefined },
      ],
      note: "why this is right",
    });
    expect(body.startsWith("/reviewer\n\n")).toBe(true);
    expect(body).toContain("#562");
    expect(body).toContain("`self/atomaton/a.md`");
    expect(body).toContain("no `self/atomaton/b.md`");
    expect(body).toContain("why this is right");
    expect(body).not.toContain("atomaton:parent-issue");

    // No reviewer named: the line goes, and the rest stays readable.
    const unattended = baseEditPrBody({ observing: "", base: BASE, reviewer: "", files: [{ path: ".github/atomaton/a.md", twin: undefined }] });
    expect(unattended.startsWith("Atomaton:")).toBe(true);
    expect(unattended).toContain("the run that made this change");
  });
});
