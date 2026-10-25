/**
 * Measures what the real `atoma` binary records as a run's ending when a tool call
 * returns `_meta.session_ends: true` — the path `create_pr` takes when its validation
 * dispatch succeeds.
 *
 * Run with: ATOMA_BIN=/usr/local/bin/atoma bun run measure.ts
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startMockLlmServer } from "/home/runner/work/atomaton/atomaton/tests/e2e/mock-llm-server.ts";
import { runAtoma, posixPath } from "/home/runner/work/atomaton/atomaton/tests/e2e/run-atoma.ts";

const SERVER = "/tmp/atomaton-workspace/measure-park/park-server.ts";
const dir = mkdtempSync(join(tmpdir(), "atomaton-measure-park-"));
try {
  writeFileSync(
    join(dir, "agent.md"),
    `---
name: measure-park
description: Measures the recorded ending of a session_ends run.
model: test-model
provider: openai
mcp_servers: ["park"]
---
You call park_it.
`,
  );
  writeFileSync(
    join(dir, "tools.yaml"),
    `park:
  unprefixed: true
  command: bun
  args: ["run", "${posixPath(SERVER)}"]
`,
  );
  writeFileSync(join(dir, "prompt.txt"), "Park the turn.");

  const mock = startMockLlmServer([
    { toolCalls: [{ id: "call_1", name: "park_it", arguments: {} }] },
    { content: "a second turn happened, which means session_ends was not honoured" },
  ]);
  try {
    const { exitCode, stderr } = await runAtoma({
      agentDefPath: join(dir, "agent.md"),
      toolsFilePath: join(dir, "tools.yaml"),
      promptFilePath: join(dir, "prompt.txt"),
      outSessionPath: join(dir, "session.json"),
      env: {
        OPENAI_BASE_URL: mock.url,
        OPENAI_API_KEY: "dummy-test-key",
        ATOMA_PROVIDER: "openai",
      },
    });
    const session = JSON.parse(readFileSync(join(dir, "session.json"), "utf8")) as Record<string, unknown>;
    console.log(JSON.stringify({
      exitCode,
      llmRequests: mock.requests.length,
      atoma_runs: session.atoma_runs,
      sessionKeys: Object.keys(session),
      stderrTail: stderr.split("\n").slice(-6).join("\n"),
    }, null, 2));
  } finally {
    mock.stop();
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
