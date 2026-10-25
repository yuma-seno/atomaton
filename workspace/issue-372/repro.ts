import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

function git(cwd: string, ...args: string[]): string {
  const p = Bun.spawnSync({ cmd: ["git", ...args], cwd, stdout: "pipe", stderr: "pipe" });
  if ((p.exitCode ?? 1) !== 0) {
    console.log(`git ${args.join(" ")} -> ${p.exitCode}\n${p.stderr?.toString()}\n${p.stdout?.toString()}`);
  }
  return (p.stdout?.toString() ?? "").trim();
}

const root = mkdtempSync(join(tmpdir(), "repro-"));
const remote = join(root, "remote.git");
const seed = join(root, "seed");
const work = join(root, "work");
git(root, "init", "--bare", "--initial-branch=main", remote);
git(root, "init", "--initial-branch=main", seed);
git(seed, "config", "user.name", "t");
git(seed, "config", "user.email", "t@e");
writeFileSync(join(seed, "shared.txt"), "one\n");
git(seed, "add", ".");
git(seed, "commit", "-m", "initial");
git(seed, "remote", "add", "origin", remote);
git(seed, "push", "-u", "origin", "main");
git(seed, "checkout", "-b", "atomaton/issue-1");
writeFileSync(join(seed, "work.txt"), "work\n");
git(seed, "add", ".");
git(seed, "commit", "-m", "the work");
git(seed, "push", "-u", "origin", "atomaton/issue-1");
git(root, "clone", "--depth=1", "--branch", "atomaton/issue-1", `file://${remote}`, work);

// main advances
git(seed, "checkout", "main");
writeFileSync(join(seed, "README.md"), "readme\n");
git(seed, "add", ".");
git(seed, "commit", "-m", "base change");
git(seed, "push", "origin", "main");

console.log("shallow:", readFileSync(join(work, ".git/shallow"), "utf8").trim());
console.log("is-shallow:", git(work, "rev-parse", "--is-shallow-repository"));
git(work, "fetch", "origin", "refs/heads/main:refs/remotes/origin/main");
console.log("merge-base:", JSON.stringify(git(work, "merge-base", "HEAD", "refs/remotes/origin/main")));
const m = Bun.spawnSync({ cmd: ["git", "merge", "--no-ff", "-m", "m", "refs/remotes/origin/main"], cwd: work, stdout: "pipe", stderr: "pipe" });
console.log("merge exit:", m.exitCode, JSON.stringify(m.stderr?.toString()));
git(work, "merge", "--abort");
console.log("--- now unshallow with explicit refspec ---");
const u = Bun.spawnSync({ cmd: ["git", "fetch", "--unshallow", "origin", "+refs/heads/*:refs/remotes/origin/*"], cwd: work, stdout: "pipe", stderr: "pipe" });
console.log("unshallow exit:", u.exitCode, u.stderr?.toString());
console.log("is-shallow after:", git(work, "rev-parse", "--is-shallow-repository"));
console.log("merge-base after:", git(work, "merge-base", "HEAD", "refs/remotes/origin/main"));
console.log("root:", root);
