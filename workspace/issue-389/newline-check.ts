// Verify newline-separated commands the way the hook does: real JSON, real newline.
import { spawnSync } from "node:child_process";

const cases = [
  "cd /tmp\ncurl -s https://example.com",
  "cd /tmp\nls\ngit push origin main",
  "cd /tmp\nls",
];

for (const command of cases) {
  const out = spawnSync("bun", ["run", "src/entrypoints/tools/hooks/shell_guard.ts"], {
    input: JSON.stringify({ arguments: { command } }),
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "" },
  }).stdout.trim();
  console.log(JSON.stringify(command), "->", out);
}
