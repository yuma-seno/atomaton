const [script, dir] = process.argv.slice(2);
const init = { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "show", version: "1" } } };
const list = { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} };
const child = Bun.spawn(["bun", "run", script, "--roster", "delegate_readonly", "--delegates-dir", dir], { stdin: "pipe", stdout: "pipe", stderr: "pipe", env: { ...process.env, GITHUB_REPOSITORY: "owner/repo" } });
child.stdin.write(JSON.stringify(init) + "\n"); child.stdin.write(JSON.stringify(list) + "\n"); child.stdin.flush();
const reader = child.stdout.getReader(); let buf = ""; const lines: any[] = [];
while (lines.length < 2) { const { value, done } = await reader.read(); if (done) break; buf += new TextDecoder().decode(value); let i; while ((i = buf.indexOf("\n")) >= 0) { const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (l) { try { lines.push(JSON.parse(l)); } catch {} } } }
child.kill();
const tools = lines.map((l) => l.result?.tools).find(Boolean) as { name: string; description: string }[];
for (const t of tools) console.log(`### ${t.name} (${t.description.length})\n${t.description}\n`);
