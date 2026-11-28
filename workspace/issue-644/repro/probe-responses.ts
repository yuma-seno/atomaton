/** Probe: real binary + orcarouter-responses route + local mock Responses server. */
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { hermeticEnv } from "/home/runner/work/atomaton/atomaton/src/entrypoints/machinery/testing/harness.ts";
import { startMockResponses } from "./mock-responses.ts";

const REPO = "/home/runner/work/atomaton/atomaton";
const ATOMA = "/usr/local/bin/atoma";
const dir = mkdtempSync(join("/tmp", "probe-resp-"));
writeFileSync(join(dir, "f.txt"), "line-one\nline-two\nline-three\nline-four\nline-five\nline-six\n");
writeFileSync(join(dir, "agent.md"), `---
name: probe-resp
description: Probe responses route.
model: test-model
provider: orcarouter-responses
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

const mock = startMockResponses([
  // args as a full JSON string, exactly as a provider would deliver:
  { calls: [{ name: "read", args: JSON.stringify({ path: "f.txt", offset: 3, limit: 2 }), callId: "call_1" }] },
  { text: "finished." },
]);
const env = {
  ...hermeticEnv(),
  ORCAROUTER_API_KEY: "dummy",
  ORCAROUTER_BASE_URL: mock.url,
};
const proc = Bun.spawn({
  cmd: [ATOMA, "run", "--agent-def", join(dir, "agent.md"), "--tools-file", join(dir, "tools.yaml"), "--prompt-file", join(dir, "prompt.txt"), "--out-session", join(dir, "session.json"), "--max-iterations", "4"],
  env, cwd: dir, stdout: "pipe", stderr: "pipe",
});
const [exit, stderr] = await Promise.all([proc.exited, new Response(proc.stderr).text()]);
console.log("exit:", exit);
console.log("stderr tail:\n" + stderr.trim().split("\n").slice(-12).join("\n").replace(/\x1b\[[0-9;]*m/g, ""));
const reqs = mock.requests as any[];
console.log("\n=== responses request count:", reqs.length);
const first = reqs[0];
console.log("tools as sent:", JSON.stringify((first?.tools ?? []).filter((t: any) => t.type === "function" && (t.name === "read" || t.name === "grep")).map((t: any) => ({ name: t.name, parameters: Object.keys(t.parameters?.properties ?? {}) })), null, 1));
if (reqs[1]) {
  const input = reqs[1].input;
  const callOut = (Array.isArray(input) ? input : input?.input ?? []).filter((i: any) => i?.type === "function_call");
  console.log("=== function_call items echoed into request 2 (what the core recorded of the call):");
  console.log(JSON.stringify(callOut, null, 1).slice(0, 600));
  const toolOutputs = (Array.isArray(input) ? input : input?.input ?? []).filter((i: any) => i?.type === "function_call_output");
  console.log("=== function_call_output:");
  for (const t of toolOutputs) console.log(String(t.output).slice(0, 300));
}
mock.stop();
rmSync(dir, { recursive: true, force: true });
