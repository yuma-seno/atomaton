import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function g(cwd: string, ...args: string[]): { code: number; out: string; err: string } {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  return { code: r.status ?? -1, out: (r.stdout ?? "").trim(), err: (r.stderr ?? "").trim() };
}

function fixture(): { root: string; work: string } {
  const root = mkdtempSync(join(tmpdir(), "gitexp3-"));
  const seed = join(root, "seed");
  mkdirSync(seed);
  const remote = join(root, "remote.git");
  g(root, "init", "--bare", "--initial-branch=main", remote);
  g(seed, "init", "--initial-branch=main");
  g(seed, "config", "user.name", "T");
  g(seed, "config", "user.email", "t@e.c");
  writeFileSync(join(seed, "diverged.txt"), "l1\nl2\nl3\n");
  writeFileSync(join(seed, "untouched.txt"), "u1\nu2\n");
  g(seed, "add", ".");
  g(seed, "commit", "-m", "base");
  g(seed, "remote", "add", "origin", remote);
  g(seed, "push", "-q", "-u", "origin", "main");
  g(seed, "checkout", "-q", "-b", "atomaton/issue-149");
  writeFileSync(join(seed, "diverged.txt"), "PARENT-l1\nl2\nl3\n");
  writeFileSync(join(seed, "parent-only.txt"), "from parent\n");
  g(seed, "add", "-A");
  g(seed, "commit", "-qm", "parent work");
  g(seed, "checkout", "-q", "main");
  writeFileSync(join(seed, "diverged.txt"), "MAIN-l1\nl2\nl3\n");
  g(seed, "commit", "-qam", "main work");
  g(seed, "push", "-q", "origin", "main", "atomaton/issue-149");
  const work = join(root, "work");
  g(root, "clone", "-q", "--depth=1", `file://${remote}`, work);
  g(work, "config", "user.name", "T");
  g(work, "config", "user.email", "t@e.c");
  return { root, work };
}

function show(label: string, work: string) {
  console.log(`\n=== ${label} ===`);
  console.log(`branch: ${g(work, "branch", "--show-current").out}`);
  console.log(`status: ${JSON.stringify(g(work, "status", "--porcelain").out)}`);
  console.log(`stash: ${JSON.stringify(g(work, "stash", "list").out)}`);
  console.log(`unmerged(diff-filter U): ${JSON.stringify(g(work, "diff", "--name-only", "--diff-filter=U").out)}`);
  console.log(`unmerged(ls-files -u): ${JSON.stringify(g(work, "ls-files", "-u").out.split("\n").map(l => l.split("\t")[1]).filter(Boolean))}`);
  for (const f of ["diverged.txt", "untouched.txt", "parent-only.txt", "run-new.txt"]) {
    const p = join(work, f);
    console.log(`  ${f}: ${existsSync(p) ? JSON.stringify(readFileSync(p, "utf8")) : "<absent>"}`);
  }
}

/** The exact sequence the fix will run. */
function stack(label: string, edit: (work: string) => void) {
  const { root, work } = fixture();
  edit(work);
  const fetched = g(work, "fetch", "origin", "refs/heads/atomaton/issue-149:refs/remotes/origin/atomaton/issue-149");
  console.log(`fetch exit=${fetched.code} err=${JSON.stringify(fetched.err)}`);
  const staged = g(work, "add", "-A");
  console.log(`add -A exit=${staged.code} err=${JSON.stringify(staged.err)}`);
  const push = g(work, "stash", "push", "--message", "atomaton: this run's work, carried onto atomaton/issue-149");
  console.log(`\n### ${label}: stash push exit=${push.code} out=${JSON.stringify(push.out)} err=${JSON.stringify(push.err)}`);
  const co = g(work, "checkout", "-b", "atomaton/issue-1", "origin/atomaton/issue-149");
  console.log(`checkout exit=${co.code} err=${JSON.stringify(co.err)}`);
  const pop = g(work, "stash", "pop");
  console.log(`stash pop exit=${pop.code}\n  out=${JSON.stringify(pop.out)}\n  err=${JSON.stringify(pop.err)}`);
  show(label, work);
  rmSync(root, { recursive: true, force: true });
}

stack("conflict on the file both sides changed", (work) => {
  writeFileSync(join(work, "diverged.txt"), "RUN-l1\nl2\nl3\n");
  writeFileSync(join(work, "untouched.txt"), "u1 RUN\nu2\n");
});

stack("no conflict: run touched only files the parent left alone", (work) => {
  writeFileSync(join(work, "untouched.txt"), "u1 RUN\nu2\n");
  writeFileSync(join(work, "run-new.txt"), "run new file\n");
});

stack("run created a file the parent also created", (work) => {
  writeFileSync(join(work, "parent-only.txt"), "run version\n");
});

stack("nothing edited", () => {});
