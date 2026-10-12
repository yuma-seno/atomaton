import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
function run(cwd, args, opts = {}) {
  const p = spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: 1<<28, ...opts });
  return { code: p.status ?? 1, out: (p.stdout ?? "").trim(), err: (p.stderr ?? "").trim() };
}
const root = mkdtempSync(join(tmpdir(), "fs-"));
const remote = join(root, "r.git"), seed = join(root, "seed"), clone = join(root, "clone");
run(root, ["init","-q","--bare","--initial-branch=main",remote]);
run(root, ["init","-q","--initial-branch=main",seed]);
run(seed,["remote","add","origin",remote]);
writeFileSync(join(seed,"a"),"a\n"); run(seed,["add","a"]); run(seed,["-c","user.name=S","-c","user.email=s@e","commit","-qm","i"]);
run(seed,["push","-q","origin","main"]);
// build a docs branch in seed
const idx = join(root,"idx");
const env = { ...process.env, GIT_INDEX_FILE: idx };
run(seed,["read-tree","--empty"],{env});
const f = join(root,"d.md"); writeFileSync(f,"d\n");
const b = run(seed,["hash-object","-w","--no-filters","--",f]).out;
run(seed,["update-index","--add","--cacheinfo",`100644,${b},designs/d.md`],{env});
const t = run(seed,["write-tree"],{env}).out;
const c = run(seed,["-c","user.name=S","-c","user.email=s@e","commit-tree",t,"-m","docs"]).out;
run(seed,["push","-q","origin",`${c}:refs/heads/business-docs`]);
// independent clone: fetch the branch with --no-write-fetch-head, then read-tree the ls-remote sha
run(root, ["clone","-q","--bare",remote,clone]);
console.log("clone has branch?", run(clone,["rev-parse","--verify","refs/heads/business-docs"]).code);
const tip = run(clone,["ls-remote","--heads","origin","refs/heads/business-docs"]).out.split(/\s+/)[0];
console.log("tip", tip);
console.log("fetch no-write-fetch-head:", JSON.stringify(run(clone,["fetch","--no-tags","--no-write-fetch-head","origin","refs/heads/business-docs"])));
console.log("object present now?", run(clone,["cat-file","-t",tip]).code, run(clone,["cat-file","-t",tip]).out);
console.log("FETCH_HEAD written?", run(clone,["cat-file","-e","FETCH_HEAD"]).code);
const idx2 = join(root,"idx2");
console.log("read-tree tip:", JSON.stringify(run(clone,["read-tree",tip],{ env: { ...process.env, GIT_INDEX_FILE: idx2 } })));
// and without --no-write-fetch-head as a comparison
console.log("fetch normal:", JSON.stringify(run(clone,["fetch","--no-tags","origin","refs/heads/business-docs"])));
console.log("FETCH_HEAD:", JSON.stringify(run(clone,["rev-parse","FETCH_HEAD"])));
rmSync(root,{recursive:true,force:true});
