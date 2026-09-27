import { readFileSync, writeFileSync } from "node:fs";
const p = "src/entrypoints/machinery/run_environment_setup.test.ts";
let s = readFileSync(p, "utf8");
s = s.replace('import { makeConfigDir, scriptPath } from "./testing/harness.ts";',
              'import { hermeticEnv, makeConfigDir, scriptPath } from "./testing/harness.ts";');
s = s.replaceAll('{ encoding: "utf8", cwd: dir }', '{ encoding: "utf8", cwd: dir, env: hermeticEnv() }');
writeFileSync(p, s);
console.log("applied PR #21's change to", p, "| hermeticEnv occurrences:", (s.match(/hermeticEnv/g)??[]).length);
