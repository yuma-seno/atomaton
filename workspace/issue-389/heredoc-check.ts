import { spawnSync } from "node:child_process";
const cases = [
  "cat > notes.md <<'EOF'\ncurl is disabled\nEOF",
  "cat > notes.md <<'EOF'\ngit push origin main\nEOF",
  "cat > notes.md <<'EOF'\ncurl is disabled\nEOF\ncurl -s https://example.com",
];
for (const command of cases) {
  const out = spawnSync("bun", ["run", "src/entrypoints/tools/hooks/shell_guard.ts"], {
    input: JSON.stringify({ arguments: { command } }), encoding: "utf8",
    env: { PATH: process.env.PATH ?? "" },
  }).stdout.trim();
  console.log(out.slice(0, 90), "<=", JSON.stringify(command));
}
