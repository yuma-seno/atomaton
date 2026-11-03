/**
 * The end-to-end check #418's close condition asks for, from the MERGED head.
 *
 * Not the helpers this time: the server itself is started the way a run starts it
 * (`bun run src/entrypoints/tools/mcp/attachments.ts`) and the tool is called over
 * MCP JSON-RPC, so what is measured includes the registration and the handler —
 * the returned `path`, the saved file's first bytes, and the refusal of a URL
 * outside the allowlist.
 */
import { readFileSync } from "node:fs";

const SERVER = "src/entrypoints/tools/mcp/attachments.ts";
const REAL = "https://github.com/user-attachments/files/34306035/default.docx";

const child = Bun.spawn(["bun", "run", SERVER], {
  cwd: process.cwd(),
  stdin: "pipe",
  stdout: "pipe",
  stderr: "pipe",
});

let buffered = "";
const pending = new Map<number, (message: any) => void>();

async function pump(): Promise<void> {
  const decoder = new TextDecoder();
  for await (const chunk of child.stdout as unknown as AsyncIterable<Uint8Array>) {
    buffered += decoder.decode(chunk, { stream: true });
    let newline: number;
    while ((newline = buffered.indexOf("\n")) >= 0) {
      const line = buffered.slice(0, newline).trim();
      buffered = buffered.slice(newline + 1);
      if (!line) continue;
      const message = JSON.parse(line);
      const resolve = pending.get(message.id);
      if (resolve) {
        pending.delete(message.id);
        resolve(message);
      }
    }
  }
}

function send(id: number, method: string, params?: unknown): Promise<any> {
  const promise = new Promise<any>((resolve) => pending.set(id, resolve));
  const request = { jsonrpc: "2.0", id, method, ...(params ? { params } : {}) };
  child.stdin.write(`${JSON.stringify(request)}\n`);
  child.stdin.flush();
  return promise;
}

function notify(method: string): void {
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method })}\n`);
  child.stdin.flush();
}

const reader = pump();

const initialized = await send(1, "initialize", {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "issue-418-close-check", version: "1.0.0" },
});
console.log(`initialize: server=${initialized.result.serverInfo.name} protocol=${initialized.result.protocolVersion}`);
notify("notifications/initialized");

const listed = await send(2, "tools/list");
const names: string[] = (listed.result.tools ?? []).map((tool: { name: string }) => tool.name);
console.log(`tools/list: ${names.join(", ")}`);

const fetchTool = listed.result.tools.find((tool: { name: string }) => tool.name === "fetch_attachment");
if (fetchTool) {
  console.log(`fetch_attachment args: ${Object.keys(fetchTool.inputSchema.properties ?? {}).join(", ")}`);
}

const call = await send(3, "tools/call", { name: "fetch_attachment", arguments: { url: REAL } });
if (call.error || call.result?.isError) {
  console.log(`tools/call FAILED: ${JSON.stringify(call.error ?? call.result)}`);
} else {
  const text: string = call.result.content[0].text;
  const result = JSON.parse(text);
  const head = readFileSync(result.path).subarray(0, 8);
  console.log(`tools/call fetch_attachment -> ${text}`);
  console.log(`file head at the returned path: ${head.toString("hex")} ("${head.subarray(0, 2).toString("latin1")}")`);
}

const refused = await send(4, "tools/call", {
  name: "fetch_attachment",
  arguments: { url: "https://example.com/a.docx" },
});
console.log(
  refused.result?.isError
    ? `tools/call outside the allowlist -> isError: ${refused.result.content[0].text.split("\n")[0]}`
    : `tools/call outside the allowlist DID NOT REFUSE: ${JSON.stringify(refused)}`,
);

child.kill();
await reader;
