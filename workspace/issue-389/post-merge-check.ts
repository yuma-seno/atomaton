// Post-merge determinism check for #389, run against the merged tree on main.
// Each shape is driven five times through the hook; one verdict per shape either
// way, or the issue is not satisfied.
import { spawnSync } from "node:child_process";

const SCRIPT = "src/entrypoints/tools/hooks/shell_guard.ts";
const shapes: [string, string][] = [
  [
    "call 1: do curl (no ; before it)",
    'cd /tmp && for n in 363; do curl -s "https://api.github.com/repos/o/r/issues/$n/events?per_page=100" -o ev-$n.json && echo ok; done',
  ],
  [
    "call 2: do curl, then ; command -v",
    'cd /tmp && for n in 348 371; do curl -s "https://api.github.com/repos/o/r/pulls/$n" -o pr-$n.json; done; command -v jq',
  ],
  [
    "call 4: do curl comments",
    'cd /tmp && for n in 363 368 348; do curl -s "https://api.github.com/repos/o/r/issues/$n/comments?per_page=100" -o cm-$n.json; echo $n; done',
  ],
  [
    "call 5: do sha=$(...); curl",
    'cd /tmp && for n in 348 359; do sha=$(jq -r .head.sha pr-$n.json); curl -s "https://api.github.com/repos/o/r/commits/$sha/check-runs?per_page=100" -o cr-$n.json; done',
  ],
  ["control: an allowed read", "git show HEAD:src/entrypoints/tools/hooks/shell_guard.ts | head -5"],
];

let failures = 0;
for (const [label, command] of shapes) {
  const verdicts = new Set<string>();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const out = spawnSync("bun", ["run", SCRIPT], {
      input: JSON.stringify({ arguments: { command } }),
      encoding: "utf8",
      env: { PATH: process.env.PATH ?? "" },
    }).stdout.trim();
    verdicts.add(JSON.parse(out).allow === true ? "allow" : "refuse");
  }
  const agreed = verdicts.size === 1;
  if (!agreed) failures += 1;
  console.log(`${agreed ? "consistent" : "INCONSISTENT"}  ${[...verdicts].join("/")}  ${label}`);
}
console.log(failures === 0 ? "all shapes consistent across 5 calls each" : `${failures} shape(s) inconsistent`);
