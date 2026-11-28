/** Probe B: does a multi-argument tool call survive core -> files server? */
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { hermeticEnv } from "/home/runner/work/atomaton/atomaton/src/entrypoints/machinery/testing/harness.ts";
import { startMockLlmServer } from "/home/runner/work/atomaton/atomaton/tests/e2e/mock-llm-server.ts";

const REPO = "/home/runner/work/atomaton/atomaton";
const ATOMA = "/usr/local/bin/atoma";
const dir = mkdtempSync(join("/tmp", "probe-b-"));
writeFileSync(join(dir, "f.txt"), "line-one\nline-two\nline-three\nline-four\nline-five\nline-six\n");
writeFileSync(join(dir, "agent.md"), `---
name: probe-b
description: Probe B.
model: test-model
provider: openai
mcp_servers: ["files"]
---
You are a probe.
`);
writeFileSync(join(dir, "tools.yaml"), `files:
  unprefixed: true
  command: bun
  args: ["run", "${REPO}/.github/atomaton-runtime/tools/mcp/files.ts"]
`);
writeFileSync(join(dir, "prompt.txt"), "Do it.");

const mock = startMockLlmServer([
  { toolCalls: [{ id: "c1", name: "read", arguments: { path: "f.txt", offset: 3, limit: 2 } }] },
  { content: "STEP-2." },
]);
const env = { ...hermeticEnv(), OPENAI_BASE_URL: mock.url, OPENAI_API_KEY: "dummy", ATOMA_PROVIDER: "openai" };
const proc = Bun.spawn({
  cmd: [ATOMA, "run", "--agent-def", join(dir, "agent.md"), "--tools-file", join(dir, "tools.yaml"), "--prompt-file", join(dir, "prompt.txt"), "--out-session", join(dir, "session.json"), "--max-iterations", "3"],
  env, cwd: dir, stdout: "pipe", stderr: "pipe",
});
const [exit, stderr] = await Promise.all([proc.exited, new Response(proc.stderr).text()]);
const reqs = (mock as any).requests as any[];
console.log("exit:", exit);
const toolMsg = reqs[1]?.messages.find((m: any) => m.role === "tool");
console.log("=== tool result the provider got for read(path, offset=3, limit=2):");
console.log(String(toolMsg?.content).slice(0, 400));
console.log("=== session record (what the core recorded as the call):");
const session = JSON.parse(readFileSync(join(dir, "session.json"), "utf8"));
const dumped = JSON.stringify(session);
const idx = dumped.indexOf("f.txt");
console.log(dumped.slice(Math.max(0, idx - 300), idx + 200).replace(/\\n/g, "\n").slice(0, 700));
mock.stop();
rmSync(dir, { recursive: true, force: true });
