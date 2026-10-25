import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function g(cwd: string, ...args: string[]): { code: number; out: string; err: string } {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  return { code: r.status ?? -1, out: (r.stdout ?? "").trim(), err: (r.stderr ?? "").trim() };
}

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "gitexp-"));
  const seed = join(root, "seed");
  mkdirSync(seed);
  g(seed, "init", "--initial-branch=main");
  g(seed, "config", "user.name", "T");
  g(seed, "config", "user.email", "t@e.c");
  writeFileSync(join(seed, "diverged.txt"), "l1\nl2\nl3\n");
  writeFileSync(join(seed, "clean.txt"), "c1\nc2\n");
  g(seed, "add", ".");
  g(seed, "commit", "-m", "base");
  // parent branch diverges on diverged.txt AND on clean.txt
  g(seed, "checkout", "-b", "parent");
  writeFileSync(join(seed, "diverged.txt"), "PARENT-l1\nl2\nl3\n");
  writeFileSync(join(seed, "clean.txt"), "PARENT-c1\nc2\n");
  g(seed, "commit", "-am", "parent work");
  g(seed, "checkout", "main");
  writeFileSync(join(seed, "diverged.txt"), "MAIN-l1\nl2\nl3\n");
  g(seed, "commit", "-am", "main work");
  return seed;
}

function scenario(name: string, opts: { stage: boolean; mergeFlag: boolean; editClean: boolean; editDiverged: boolean }) {
  const root = fixture();
  g(root, "checkout", "-q", "main");
  if (opts.editDiverged) writeFileSync(join(root, "diverged.txt"), "RUN-l1\nl2\nl3\n");
  if (opts.editClean) writeFileSync(join(root, "clean.txt"), "RUN-c1\nc2\n");
  writeFileSync(join(root, "brand-new.txt"), "new file\n");
  if (opts.stage) g(root, "add", "diverged.txt", "clean.txt");
  const args = opts.mergeFlag
    ? ["checkout", "-m", "-b", "atomaton/issue-9", "parent"]
    : ["checkout", "-b", "atomaton/issue-9", "parent"];
  const r = g(root, ...args);
  console.log(`\n=== ${name} (${args.join(" ")}) ===`);
  console.log(`exit=${r.code}`);
  if (r.err) console.log(`stderr: ${r.err}`);
  if (r.out) console.log(`stdout: ${r.out}`);
  console.log(`branch: ${g(root, "branch", "--show-current").out}`);
  console.log(`status: ${JSON.stringify(g(root, "status", "--porcelain").out)}`);
  for (const f of ["diverged.txt", "clean.txt", "brand-new.txt"]) {
    const p = join(root, f);
    console.log(`  ${f}: ${existsSync(p) ? JSON.stringify(readFileSync(p, "utf8")) : "<absent>"}`);
  }
}

scenario("A: run edits the file parent diverged on, unstaged, plain checkout", { stage: false, mergeFlag: false, editClean: false, editDiverged: true });
scenario("B: same, checkout -m", { stage: false, mergeFlag: true, editClean: false, editDiverged: true });
scenario("C: same, staged, checkout -m", { stage: true, mergeFlag: true, editClean: false, editDiverged: true });
scenario("D: run edits a non-divergent file only, checkout -m", { stage: false, mergeFlag: true, editClean: true, editDiverged: false });
scenario("E: run edits the parent's clean file, checkout -m", { stage: false, mergeFlag: true, editClean: false, editDiverged: false });
