/**
 * Probe the real atoma binary with a mock LLM:
 *  A) what `read`/`grep` inputSchema the core forwards to the provider,
 *  B) whether a tool call with many arguments reaches the files server intact.
 */
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { hermeticEnv } from "/home/runner/work/atomaton/atomaton/src/entrypoints/machinery/testing/harness.ts";
import { startMockLlmServer, type QueuedResponse } from "/home/runner/work/atomaton/atomaton/tests/e2e/mock-llm-server.ts";

const REPO = "/home/runner/work/atomaton/atomaton";
const ATOMA = process.env.ATOMA_BIN ?? "/usr/local/bin/atoma";
const dir = mkdtempSync(join("/tmp", "probe-atoma-"));
writeFileSync(join(dir, "f.txt"), "line-one\nline-two\nline-three\nline-four\nline-five\nline-six\n");

function runOnce(responses: QueuedResponse[], prompt: string, fixtureName: string): { requests: any[]; stderr: string; exit: number } {
  return { requests: (globalThis as any).__lastRequests, stderr: "", exit: 0 };
}

// --- Probe A: ask the binary to run one turn with no tool call; capture the request it sent.
const mockA = startMockLlmServer([
  { content: "OK." },
]);
writeFileSync(join(dir, "agent.md"), `---
name: probe-agent
description: Probe agent.
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
writeFileSync(join(dir, "prompt.txt"), "Do nothing but reply.");

const spawn = { async: (cmd: string[], env: any, cwd: string) => Bun.spawn({ cmd, env, cwd, stdout: "pipe", stderr: "pipe" }) };
const envA = { ...hermeticEnv(), OPENAI_BASE_URL: mockA.url, OPENAI_API_KEY: "dummy", ATOMA_PROVIDER: "openai" };
const procA = Bun.spawn({
  cmd: [ATOMA, "run", "--agent-def", join(dir, "agent.md"), "--tools-file", join(dir, "tools.yaml"), "--prompt-file", join(dir, "prompt.txt"), "--out-session", join(dir, "session-a.json"), "--max-iterations", "2"],
  env: envA, cwd: dir, stdout: "pipe", stderr: "pipe",
});
const [exitA, stderrA] = await Promise.all([procA.exited, new Response(procA.stderr).text()]);

// The mock's requests array is inspected here directly before stopping:
const reqsA = (mockA as any).requests as any[];
console.log("=== PROBE A: provider-visible tools ===");
console.log("exit:", exitA);
if (stderrA.trim()) console.log("stderr(tail):", stderrA.trim().split("\n").slice(-6).join(" | "));
for (const tool of reqsA[0]?.tools ?? []) {
  const f = tool.function ?? {};
  if (["read", "grep"].includes(f.name ?? "")) {
    console.log(`\n--- provider-visible schema for ${f.name}:`);
    console.log(JSON.stringify(f.parameters ?? f.input_schema ?? f, null, 1));
  }
}
console.log("tool names seen:", (reqsA[0]?.tools ?? []).map((t: any) => t.function?.name).join(", "));
mockA.stop();
