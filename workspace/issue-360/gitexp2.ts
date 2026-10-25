import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function g(cwd: string, ...args: string[]): { code: number; out: string; err: string } {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  return { code: r.status ?? -1, out: (r.stdout ?? "").trim(), err: (r.stderr ?? "").trim() };
}

function fixture(withRemote = false): { root: string; repo: string; work: string } {
  const root = mkdtempSync(join(tmpdir(), "gitexp2-"));
  const seed = join(root, "seed");
  mkdirSync(seed);
  let repo = seed;
  if (withRemote) {
    repo = join(root, "remote.git");
    g(root, "init", "--bare", "--initial-branch=main", repo);
  }
  g(seed, "init", "--initial-branch=main");
  g(seed, "config", "user.name", "T");
  g(seed, "config", "user.email", "t@e.c");
  writeFileSync(join(seed, "diverged.txt"), "l1\nl2\nl3\n");
  writeFileSync(join(seed, "untouched.txt"), "u1\nu2\n");
  writeFileSync(join(seed, "gone.txt"), "g1\n");
  g(seed, "add", ".");
  g(seed, "commit", "-m", "base");
  if (withRemote) {
    g(seed, "remote", "add", "origin", repo);
    g(seed, "push", "-q", "-u", "origin", "main");
  }
  // parent branch diverges
  g(seed, "checkout", "-q", "-b", "parent");
  writeFileSync(join(seed, "diverged.txt"), "PARENT-l1\nl2\nl3\n");
  writeFileSync(join(seed, "new-on-parent.txt"), "parent version\n");
  g(seed, "rm", "-q", "gone.txt");
  g(seed, "add", "-A");
  g(seed, "commit", "-qm", "parent work");
  g(seed, "checkout", "-q", "main");
  writeFileSync(join(seed, "diverged.txt"), "MAIN-l1\nl2\nl3\n");
  g(seed, "commit", "-qam", "main work");
  if (withRemote) {
    g(seed, "push", "-q", "origin", "parent", "main");
    const work = join(root, "work");
    g(root, "clone", "-q", repo, work);
    g(work, "config", "user.name", "T");
    g(work, "config", "user.email", "t@e.c");
    return { root, repo, work };
  }
  return { root, repo: seed, work: seed };
}

function show(label: string, work: string) {
  console.log(`\n=== ${label} ===`);
  console.log(`branch: ${g(work, "branch", "--show-current").out}`);
  console.log(`status: ${JSON.stringify(g(work, "status", "--porcelain").out)}`);
  console.log(`stash: ${JSON.stringify(g(work, "stash", "list").out)}`);
  console.log(`unmerged: ${JSON.stringify(g(work, "diff", "--name-only", "--diff-filter=U").out)}`);
  for (const f of ["diverged.txt", "untouched.txt", "new-on-parent.txt", "run-file.txt", "gone.txt"]) {
    const p = join(work, f);
    console.log(`  ${f}: ${existsSync(p) ? JSON.stringify(readFileSync(p, "utf8")) : "<absent>"}`);
  }
}

// 1. conflict case, from a clone tracking origin
{
  const { root, work } = fixture(true);
  writeFileSync(join(work, "diverged.txt"), "RUN-l1\nl2\nl3\n");
  const r = g(work, "checkout", "-m", "-b", "atomaton/issue-9", "origin/parent");
  console.log(`\n### conflict: exit=${r.code} stderr=${JSON.stringify(r.err)}`);
  show("conflict result", work);
  rmSync(root, { recursive: true, force: true });
}

// 2. clean case: run edits only files the parent did not touch
{
  const { root, work } = fixture(true);
  writeFileSync(join(work, "untouched.txt"), "u1 RUN\nu2\n");
  writeFileSync(join(work, "run-file.txt"), "run new file\n");
  g(work, "rm", "-q", "diverged.txt");
  const r = g(work, "checkout", "-m", "-b", "atomaton/issue-9", "origin/parent");
  console.log(`\n### clean: exit=${r.code} stderr=${JSON.stringify(r.err)}`);
  show("clean result", work);
  rmSync(root, { recursive: true, force: true });
}

// 3. run created a file the parent also created, different content
{
  const { root, work } = fixture(true);
  writeFileSync(join(work, "new-on-parent.txt"), "RUN version\n");
  const r = g(work, "checkout", "-m", "-b", "atomaton/issue-9", "origin/parent");
  console.log(`\n### untracked collision: exit=${r.code} stderr=${JSON.stringify(r.err)}`);
  show("untracked collision result", work);
  rmSync(root, { recursive: true, force: true });
}

// 4. control: nothing edited at all
{
  const { root, work } = fixture(true);
  const r = g(work, "checkout", "-m", "-b", "atomaton/issue-9", "origin/parent");
  console.log(`\n### no edits: exit=${r.code} stderr=${JSON.stringify(r.err)}`);
  show("no edits result", work);
  rmSync(root, { recursive: true, force: true });
}

// 5. staged-then-partially-committed? staged changes with conflict
{
  const { root, work } = fixture(true);
  writeFileSync(join(work, "diverged.txt"), "RUN-l1\nl2\nl3\n");
  g(work, "add", "diverged.txt");
  const r = g(work, "checkout", "-m", "-b", "atomaton/issue-9", "origin/parent");
  console.log(`\n### staged conflict: exit=${r.code} stderr=${JSON.stringify(r.err)}`);
  show("staged conflict result", work);
  rmSync(root, { recursive: true, force: true });
}
