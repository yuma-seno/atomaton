/**
 * Negative control on the MERGED tree: remove the two `pre` hooks and the
 * ratchet (and the two behavioural tests) must go red.
 */
import { cpSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = "/tmp/merged-tree";
const DEST = "/tmp/merged-negative";

const mode = process.argv[2];
if (mode === "copy") {
  rmSync(DEST, { recursive: true, force: true });
  cpSync(SRC, DEST, { recursive: true, filter: (path) => !/(\/|\\)(node_modules|dist)$/.test(path) });
  symlinkSync(join(SRC, "node_modules"), join(DEST, "node_modules"), "junction");
  console.log("copied");
} else {
  const p = join(DEST, "package.json");
  const pkg = JSON.parse(readFileSync(p, "utf8"));
  if (mode === "strip") {
    delete pkg.scripts.pretest;
    delete pkg.scripts["pretest:e2e"];
  } else if (mode === "empty") {
    pkg.scripts.pretest = "true";
    pkg.scripts["pretest:e2e"] = "true";
  }
  writeFileSync(p, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`applied: ${mode}`);
}
