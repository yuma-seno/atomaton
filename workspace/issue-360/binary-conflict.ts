/**
 * What `createStackedBranch`'s stash round trip does when the file both sides changed
 * is binary: git cannot put markers in it, so what is in the worktree afterwards?
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function g(cwd: string, ...args: string[]): { code: number; out: string; err: string } {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  return { code: r.status ?? -1, out: (r.stdout ?? "").trim(), err: (r.stderr ?? "").trim() };
}

const root = mkdtempSync(join(tmpdir(), "gitexp-binary-"));
const remote = join(root, "remote.git");
const seed = join(root, "seed");
mkdirSync(seed);
g(root, "init", "--bare", "--initial-branch=main", remote);
g(seed, "init", "--initial-branch=main");
g(seed, "config", "user.name", "T");
g(seed, "config", "user.email", "t@e.c");
writeFileSync(join(seed, "logo.bin"), Buffer.from([0, 1, 2, 3, 0, 255]));
g(seed, "add", ".");
g(seed, "commit", "-m", "base");
g(seed, "remote", "add", "origin", remote);
g(seed, "push", "-u", "origin", "main");

g(seed, "checkout", "-b", "atomaton/issue-149");
writeFileSync(join(seed, "logo.bin"), Buffer.from([0, 1, 2, 3, 0, 254]));
g(seed, "add", "-A");
g(seed, "commit", "-m", "parent's binary");
g(seed, "push", "-u", "origin", "atomaton/issue-149");

const work = join(root, "work");
g(root, "clone", "--depth=1", "--branch", "main", `file://${remote}`, work);
g(work, "config", "user.name", "T");
g(work, "config", "user.email", "t@e.c");
g(work, "fetch", "origin", "refs/heads/atomaton/issue-149:refs/remotes/origin/atomaton/issue-149");

// The run rewrites the binary, its own way.
writeFileSync(join(work, "logo.bin"), Buffer.from([9, 9, 9, 9, 9, 9]));

console.log("add -A:", g(work, "add", "-A").code);
console.log("stash push:", g(work, "stash", "push", "--message", "atomaton").code);
console.log("checkout:", g(work, "checkout", "-b", "atomaton/issue-1", "origin/atomaton/issue-149").code);
const pop = g(work, "stash", "pop");
console.log(`stash pop exit=${pop.code}\n  out=${JSON.stringify(pop.out)}\n  err=${JSON.stringify(pop.err)}`);
console.log("unmerged:", JSON.stringify(g(work, "diff", "--name-only", "--diff-filter=U").out));
console.log("status:", JSON.stringify(g(work, "status", "--porcelain").out));
console.log("stash:", JSON.stringify(g(work, "stash", "list").out));
const bytes = readFileSync(join(work, "logo.bin"));
console.log("worktree logo.bin:", [...bytes].join(","));
console.log("has markers:", bytes.includes(Buffer.from("<<<<<<<")));
rmSync(root, { recursive: true, force: true });
