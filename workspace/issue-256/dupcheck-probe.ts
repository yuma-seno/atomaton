/**
 * Scratch probe (run on issue #256): does the core's duplicate_tool check fire
 * when atomaton_env's allowlist gains request_close_issue, given the atomaton
 * server (same program, full set) also exists?
 *
 * Two runs:
 *   A. roster = [atomaton, atomaton_env]  (both in one definition)
 *   B. roster = engineer's (atomaton_env among the usual servers, no atomaton)
 * Each with the NEW allowlist. Findings would appear on stderr as
 * ATOMA_CONFIG_FINDING lines.
 */
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startMockLlmServer } from "/home/runner/work/atomaton/atomaton/tests/e2e/mock-llm-server.ts";
import { REPO_ROOT, runAtoma, posixPath } from "/home/runner/work/atomaton/atomaton/tests/e2e/run-atoma.ts";

const ATOMATON_MCP = join(REPO_ROOT, "src/entrypoints/tools/mcp/atomaton.ts");

function toolsFile(): string {
  return `atomaton:
  unprefixed: true
  command: bun
  args: ["run", "${posixPath(ATOMATON_MCP)}"]
  env: {}
  hooks: {}
atomaton_env:
  unprefixed: true
  command: bun
  args: ["run", "${posixPath(ATOMATON_MCP)}"]
  env: {}
  hooks:
    tool_allowlist:
      - reload_environment
      - request_close_issue
github:
  unprefixed: true
  command: bun
  args: ["run", "${posixPath(join(REPO_ROOT, "src/entrypoints/tools/mcp/github.ts"))}"]
  env: {}
  hooks: {}
files:
  unprefixed: true
  command: bun
  args: ["run", "${posixPath(join(REPO_ROOT, "src/entrypoints/tools/mcp/files.ts"))}"]
  env: {}
  hooks: {}
shell:
  unprefixed: true
  command: bun
  args: ["run", "${posixPath(join(REPO_ROOT, "src/entrypoints/tools/mcp/shell.ts"))}"]
  env: {}
  hooks: {}
web:
  unprefixed: true
  command: bun
  args: ["run", "${posixPath(join(REPO_ROOT, "src/entrypoints/tools/mcp/web.ts"))}"]
  env: {}
  hooks: {}
search:
  unprefixed: true
  command: bun
  args: ["run", "${posixPath(join(REPO_ROOT, "src/entrypoints/tools/mcp/search.ts"))}"]
  env: {}
  hooks: {}
attachments:
  unprefixed: true
  command: bun
  args: ["run", "${posixPath(join(REPO_ROOT, "src/entrypoints/tools/mcp/attachments.ts"))}"]
  env: {}
  hooks: {}
delegate:
  unprefixed: true
  command: bun
  args: ["run", "${posixPath(join(REPO_ROOT, "src/entrypoints/tools/mcp/delegate.ts"))}", "--roster", "delegate", "--delegates-dir", "${posixPath(join(REPO_ROOT, "src/content/delegates"))}"]
  env: {}
  hooks: {}
`;
}

function agentDef(servers: string[]): string {
  return `---
name: dupcheck
description: Scratch.
model: test
provider: openai
mcp_servers:
${servers.map((s) => `  - ${s}`).join("\n")}
---
Scratch agent.
`;
}

async function trial(name: string, servers: string[]): Promise<void> {
  const mock = startMockLlmServer([{ content: "Done." }]);
  const dir = mkdtempSync(join(tmpdir(), "dupcheck-"));
  try {
    writeFileSync(join(dir, "tools.yaml"), toolsFile());
    writeFileSync(join(dir, "agent.md"), agentDef(servers));
    writeFileSync(join(dir, "prompt.txt"), "Say done.");
    const { exitCode, stderr } = await runAtoma({
      agentDefPath: join(dir, "agent.md"),
      toolsFilePath: join(dir, "tools.yaml"),
      promptFilePath: join(dir, "prompt.txt"),
      outSessionPath: join(dir, "session.json"),
      maxIterations: 1,
      env: {
        ...mockEnv(mock.url),
        GITHUB_REPOSITORY: "owner/repo",
        ISSUE_NUMBER: "1",
      },
    });
    const findings = stderr.split("\n").filter((l) => l.includes("ATOMA_CONFIG_FINDING"));
    console.log(`\n=== ${name} (exit ${exitCode}) ===`);
    console.log(findings.length ? findings.join("\n") : "no ATOMA_CONFIG_FINDING lines");
    // Also note duplicate-shaped failures at startup
    const startup = stderr.split("\n").filter((l) => /duplicate|Duplicate|two servers|already claimed/i.test(l));
    if (startup.length) console.log("duplicate-shaped stderr lines:\n" + startup.join("\n"));
  } finally {
    mock.stop();
    rmSync(dir, { recursive: true, force: true });
  }
}

function mockEnv(url: string): Record<string, string> {
  return {
    OPENAI_BASE_URL: url,
    OPENAI_API_KEY: "scratch-key",
    ATOMA_PROVIDER: "openai",
  };
}

await trial("A: roster [atomaton, atomaton_env], NEW allowlist", ["atomaton", "atomaton_env"]);
await trial("B: engineer roster with atomaton_env NEW allowlist", ["files", "shell", "github", "web", "search", "attachments", "atomaton_env", "delegate"]);
