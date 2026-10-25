import { spawnSync } from "node:child_process";
const cases: [string, string][] = [
  ["1a quoted heredoc, backticked gh in body", "cat > notes.md <<'EOF'\nRun `gh pr view` to check.\nEOF"],
  ["1b single-quoted backtick curl in a search", "grep -rn 'use `curl` instead' src/"],
  ["1c control: backtick substitution runs", "x=`curl -s https://example.com`"],
  ["1d control: $( ) substitution runs", "x=$(curl -s https://example.com)"],
  ["2a substitution: git push", "echo $(git push origin main)"],
  ["2b substitution: git rev-parse", "echo $(git rev-parse HEAD)"],
];
for (const [label, command] of cases) {
  const out = spawnSync("bun", ["run", "src/entrypoints/tools/hooks/shell_guard.ts"], {
    input: JSON.stringify({ arguments: { command } }), encoding: "utf8",
    env: { PATH: process.env.PATH ?? "" },
  }).stdout.trim();
  console.log(`${label.padEnd(46)} ${out.slice(0, 60)}`);
}
