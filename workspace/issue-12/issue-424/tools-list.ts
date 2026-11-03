// Ask the attachments server for its tools/list, over the same stdio JSON-RPC a run uses.
const server = Bun.spawn(["bun", "run", "src/entrypoints/tools/mcp/attachments.ts"], {
  stdin: "pipe",
  stdout: "pipe",
  stderr: "pipe",
});
server.stdin.write(
  JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "check", version: "1" } } }) + "\n",
);
server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }) + "\n");
await server.stdin.flush();
const reader = server.stdout.getReader();
const decoder = new TextDecoder();
let text = "";
const deadline = Date.now() + 15_000;
while (Date.now() < deadline) {
  const { value, done } = await reader.read();
  if (done) break;
  text += decoder.decode(value);
  if (text.includes('"id":2')) break;
}
server.kill();
for (const line of text.split("\n").filter(Boolean)) {
  const message = JSON.parse(line);
  if (message.id === 1) console.log("initialize:", message.result?.serverInfo?.name);
  if (message.id === 2) {
    const names = message.result.tools.map((tool: { name: string }) => tool.name);
    console.log("tools/list:", names.join(", "));
    console.log("count:", names.length);
  }
}
