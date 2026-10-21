import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const mod = await import("/home/runner/work/atomaton/atomaton/tests/e2e/mock-llm-server.ts");
const run = await import("/home/runner/work/atomaton/atomaton/tests/e2e/run-atoma.ts");
const REPO_ROOT = run.REPO_ROOT;
const ATOMATON_MCP = join(REPO_ROOT, "src/entrypoints/tools/mcp/atomaton.ts");
const mock = mod.startMockLlmServer([{ content: "Done." }]);
const dir = mkdtempSync(join(tmpdir(), "dupcheck-b-"));
const P = (p: string) => p.replaceAll("\\", "/");
writeFileSync(join(dir, "tools.yaml"), `atomaton_env:
  unprefixed: true
  command: bun
  args: ["run", "${P(ATOMATON_MCP)}"]
  env: {}
  hooks:
    tool_allowlist:
      - reload_environment
      - request_close_issue
`);
writeFileSync(join(dir, "agent.md"), `---
name: env-only
description: Scratch.
model: test
provider: openai
mcp_servers:
  - atomaton_env
---
Scratch.
`);
writeFileSync(join(dir, "prompt.txt"), "Say done.");
const { exitCode, stderr } = await run.runAtoma({
  agentDefPath: join(dir, "agent.md"),
  toolsFilePath: join(dir, "tools.yaml"),
  promptFilePath: join(dir, "prompt.txt"),
  outSessionPath: join(dir, "session.json"),
  maxIterations: 1,
  env: { OPENAI_BASE_URL: mock.url, OPENAI_API_KEY: "scratch-key", ATOMA_PROVIDER: "openai" },
});
console.log("exit", exitCode);
console.log("findings:", (stderr.match(/ATOMA_CONFIG_FINDING/g) ?? []).length);
console.log("stderr tail:", stderr.split("\n").slice(-6).join("\n"));
const session = JSON.parse(readFileSync(join(dir, "session.json"), "utf8"));
const tools = (session.messages?.[0]?.content ?? "") || JSON.stringify(session).slice(0, 0);
console.log("advertised tools mentioning close:", JSON.stringify(session).includes("request_close_issue"));
mock.stop();
rmSync(dir, { recursive: true, force: true });
