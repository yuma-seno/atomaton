import { readFileSync, writeFileSync } from "node:fs";
const mode = process.argv[2];
const p = JSON.parse(readFileSync("package.json", "utf8"));
if (mode === "strip") {
  delete p.scripts.pretest;
  delete p.scripts["pretest:e2e"];
} else if (mode === "empty-hooks") {
  p.scripts.pretest = "true";
  p.scripts["pretest:e2e"] = "true";
} else {
  throw new Error(`unknown mode ${mode}`);
}
writeFileSync("package.json", `${JSON.stringify(p, null, 2)}\n`);
console.log(`package.json: ${mode} applied`);
