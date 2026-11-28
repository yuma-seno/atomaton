/** Probe: which malformed argument strings does the core parse into "first key only"? */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hermeticEnv } from "/home/runner/work/atomaton/atomaton/src/entrypoints/machinery/testing/harness.ts";
import { startMockResponses } from "./mock-responses.ts";

const REPO = "/home/runner/work/atomaton/atomaton";
const fixture = mkdtempSync(join("/tmp", "probe-fixture-"));
writeFileSync(join(fixture, "agent.md"), `---
name: probe-args
description: Probe args.
model: test-model
provider: orcarouter-responses
mcp_servers: ["files"]
---
Probe.
`);
writeFileSync(join(fixture, "tools.yaml"), `files:
  unprefixed: true
  command: bun
  args: ["run", "${REPO}/.github/atomaton-runtime/tools/mcp/files.ts"]
`);
writeFileSync(join(fixture, "prompt.txt"), "Do it.");
writeFileSync(join(fixture, "f.txt"), "line-one\nline-two\nline-three\nline-four\nline-five\nline-six\n");

const CASES: [string, string][] = [
  ["valid", JSON.stringify({ path: "f.txt", offset: 3, limit: 2 })],
  ["concatenated", `{"path":"f.txt"}{"offset":3}`],
  ["trailing_comma", `{"path":"f.txt","offset":3,}`],
  ["missing_brace_start", `"path":"f.txt","offset":3,"limit":2}`],
  ["newline_separated", `{"path":"f.txt",\n"offset":3}`],
  ["duplicate_keys", `{"path":"f.txt","offset":3,"offset":5}`],
  ["markdown_wrapped", '```json\n{"path":"f.txt","offset":3,"limit":2}\n```'],
];

for (const [caseName, argStr] of CASES) {
  const dir = mkdtempSync(join("/tmp", "probe-args-"));
  const mock = startMockResponses([
    { calls: [{ name: "read", args: argStr, callId: "call_1" }] },
    { text: "done." },
  ]);
  const env = { ...hermeticEnv(), ORCAROUTER_API_KEY: "dummy", ORCAROUTER_BASE_URL: mock.url };
  const proc = Bun.spawn({
    cmd: ["/usr/local/bin/atoma", "run", "--agent-def", join(fixture, "agent.md"), "--tools-file", join(fixture, "tools.yaml"), "--prompt-file", join(fixture, "prompt.txt"), "--out-session", join(dir, "session.json"), "--max-iterations", "3"],
    env, cwd: fixture, stdout: "pipe", stderr: "pipe",
  });
  const [, stderr] = await Promise.all([proc.exited, new Response(proc.stderr).text()]);
  const clean = stderr.replace(/\x1b\[[0-9;]*m/g, "");
  const lines = clean.split("\n").filter((l) => l.includes("[atomaton-files] read ") || l.includes("LLM requested") || l.includes("Executing tool") || l.includes("Invalid") || l.includes("Run failed") || l.includes("WARN") || l.includes("ERROR"));
  console.log(`===== ${caseName}: ${JSON.stringify(argStr)}`);
  console.log(lines.slice(0, 8).join("\n").trim() || "(no matching lines)");
  mock.stop();
  rmSync(dir, { recursive: true, force: true });
}
rmSync(fixture, { recursive: true, force: true });
