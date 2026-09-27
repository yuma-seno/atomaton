import { readFileSync, writeFileSync } from "node:fs";
const mode = process.argv[2];
const p = JSON.parse(readFileSync("package.json", "utf8"));
if (mode === "break") p.scripts.synth = "exit 9";
else if (mode === "restore") p.scripts.synth = "bun run src/synth-workflows.ts && bun run src/build-dist.ts";
writeFileSync("package.json", `${JSON.stringify(p, null, 2)}\n`);
console.log("synth:", p.scripts.synth);
