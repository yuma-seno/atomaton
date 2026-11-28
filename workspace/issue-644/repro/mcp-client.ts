// Minimal MCP client over stdio: list tools, then call one, printing raw JSON.
import { spawn } from "node:child_process";

const server = process.argv[2];
const callName = process.argv[3];
const args = JSON.parse(process.argv[4] ?? "{}");

const child = spawn("bun", ["run", server], { cwd: process.cwd(), stdio: ["pipe", "pipe", "pipe"] });
let buf = "";
const pending = new Map<number, (v: unknown) => void>();

function send(obj: unknown) {
  child.stdin.write(JSON.stringify(obj) + "\n");
}
function request(method: string, params: unknown): Promise<unknown> {
  const id = pending.size + 1;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    send({ jsonrpc: "2.0", id, method, params });
  });
}
child.stdout.on("data", (chunk) => {
  buf += chunk.toString();
  while (buf.includes("\n")) {
    const line = buf.slice(0, buf.indexOf("\n"));
    buf = buf.slice(buf.indexOf("\n") + 1);
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id && pending.has(msg.id)) {
        const resolve = pending.get(msg.id)!;
        pending.delete(msg.id);
        resolve(msg.result ?? msg.error);
      } else if (msg.method) {
        // notification from server; log to stderr
        console.error("<< " + line.slice(0, 200));
      }
    } catch { console.error("unparseable: " + line.slice(0, 120)); }
  }
});
child.stderr.on("data", (c) => console.error("SRV-ERR: " + c.toString().trim().slice(0, 300)));

await request("initialize", {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "repro-client", version: "0" },
});
send({ jsonrpc: "2.0", method: "notifications/initialized" });

if (callName === "__list__") {
  const tools = (await request("tools/list", {})) as { tools?: { name: string; inputSchema: unknown }[] };
  for (const t of tools.tools ?? []) console.log(JSON.stringify({ name: t.name, schema: t.inputSchema }));
} else {
  const result = (await request("tools/call", { name: callName, arguments: args })) as {
    content?: { type: string; text?: string }[];
  };
  const text = (result.content ?? []).map((c) => c.text ?? JSON.stringify(c)).join("\n");
  console.log(text.slice(0, 1500));
}
child.kill();
