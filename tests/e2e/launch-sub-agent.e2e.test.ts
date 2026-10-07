/**
 * launch-sub-agent.e2e.test.ts — real end-to-end test for the
 * `atomaton__launch_sub_agent` tool: the actual `atoma` binary, its real
 * inference loop and real MCP client, driven against the REAL, compiled
 * `dist/.github/atomaton-runtime/tools/mcp/atomaton.ts` MCP server over real
 * stdio JSON-RPC, with a fake `gh` CLI so the real dispatch chain
 * (mcp/atomaton.ts -> dispatchSubAgent -> config/gh helpers)
 * runs without touching the real GitHub API or triggering a real
 * `gh workflow run`.
 *
 * See run-agent.e2e.test.ts for the general design notes (mock LLM server,
 * why this suite is opt-in/skipped without a pre-built atoma binary, etc.).
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setupFakeGh } from "./fake-gh.ts";
import { startMockLlmServer } from "./mock-llm-server.ts";
import { atomaAvailable, posixPath, REPO_ROOT, runAtoma } from "./run-atoma.ts";

const ATOMA_MCP_SCRIPT = join(REPO_ROOT, "dist/.github/atomaton-runtime/tools/mcp/atomaton.ts");

describe.skipIf(!atomaAvailable)("E2E: real atoma binary + real mcp/atomaton.ts", () => {
  test("agent calls atomaton__launch_sub_agent through the real MCP server", async () => {
    const mock = startMockLlmServer([
      {
        toolCalls: [
          { id: "call_1", name: "atomaton__launch_sub_agent", arguments: { tasks: [{ issue: 7, agent: "engineer" }] } },
        ],
      },
    ]);
    // Real invocations the real dispatch chain makes, in order. This is the order
    // `dispatchRunner` actually takes: the marker goes out FIRST, then the thread is
    // read and the marker is asked to be visible in it, and only then is the run
    // started. The marker is what the ordering check is ordered against, so a fixture
    // that never shows it back refuses the dispatch -- which is what this file used to
    // do, from the change that moved the comment and the ordering check into
    // `dispatchRunner` (this file was never updated, and had never run).
    //
    // The rules are ordered most-specific-first, because the first match wins and every
    // one of these URLs contains `issues/7`.
    //   1. readTargetState: `gh api repos/{owner}/{repo}/issues/7` -- no `--jq`, and the
    //      state is lower-case `open`, the way the REST endpoint spells it (the
    //      upper-case `OPEN` `gh issue view` prints is a different call this no longer
    //      makes)
    //   2. postDispatchMarker: `gh api .../issues/7/comments --method POST --jq .id`,
    //      and the marker's ID is what that call must answer with
    //   3. checkDispatchMarker: the same URL with `--paginate`, and the listing it
    //      answers with has to CONTAIN that same id -- that is the freshness probe, and
    //      a listing that does not show the marker back is the refusal below
    //   4. `gh label create` / `gh issue edit 7 --add-label atomaton/launched`
    //   5. `gh workflow run atomaton-runner.yml ...`
    //
    // The fake `gh` does not run `--jq` itself: its stdout IS the answer, so step 2's
    // rule answers with the bare id while step 3's answers with the listing. Answering
    // both with the listing leaves step 2 returning a JSON array where an id was
    // expected, and the marker is then looked for under an id that is not in it.
    const markerBody = "Atomaton: `engineer` starting on this issue.";
    const fakeGh = setupFakeGh([
      { match: ["api", "issues/7/comments", "--method"], stdout: "555" },
      {
        match: ["api", "issues/7/comments", "--paginate"],
        stdout: JSON.stringify([{ id: 555, body: markerBody, user: { type: "Bot" } }]),
      },
      { match: ["api", "issues/7"], stdout: JSON.stringify({ state: "open" }) },
      { match: ["label", "create"] },
      { match: ["issue", "edit"] },
      { match: ["workflow", "run"] },
    ]);

    const dir = mkdtempSync(join(tmpdir(), "atomaton-e2e-"));
    try {
      writeFileSync(
        join(dir, "agent.md"),
        `---
name: e2e-test-orchestrator
description: Minimal orchestrator agent for E2E testing.
model: test-model
provider: openai
mcp_servers: ["atomaton"]
---
You are a test orchestrator agent.
`,
      );

      writeFileSync(
        join(dir, "tools.yaml"),
        `atomaton:
  command: bun
  args: ["run", "${posixPath(ATOMA_MCP_SCRIPT)}"]
`,
      );

      writeFileSync(join(dir, "prompt.txt"), "Please dispatch an engineer on sub-issue #7.");

      const { exitCode, stderr } = await runAtoma({
        agentDefPath: join(dir, "agent.md"),
        toolsFilePath: join(dir, "tools.yaml"),
        promptFilePath: join(dir, "prompt.txt"),
        outSessionPath: join(dir, "session.json"),
        env: {
          ...fakeGh.env,
          // dispatchSubAgent reads .github/atomaton/config.yaml relative to this
          // test's cwd (the repository root).
          OPENAI_BASE_URL: mock.url,
          OPENAI_API_KEY: "dummy-test-key",
          ATOMA_PROVIDER: "openai",
        },
      });

      if (exitCode !== 0) {
        console.error("atoma stderr:", stderr);
      }
      expect(exitCode).toBe(0);

      // Prove the REAL dispatch chain actually ran: a comment was posted
      // mentioning the dispatched agent, the sub-issue got labeled
      // "launched" (proving get_config_value.ts's own real config.yaml
      // lookup ran), and the runner workflow was dispatched for the right
      // agent/issue -- none of this is hardcoded by this test.
      const calls = fakeGh.calls();
      // Substring, not `Array.includes`: the argv element carrying this is the whole
      // URL (`repos/{owner}/{repo}/issues/7/comments`), so an exact-element test for
      // `"comments"` finds nothing. It was written that way, and had never run.
      const commentCall = calls.find((c) => c.join(" ").includes("issues/7/comments"));
      expect(commentCall?.join(" ")).toContain("engineer");
      const editCall = calls.find((c) => c.includes("edit"));
      expect(editCall).toContain("atomaton/launched");
      const workflowCall = calls.find((c) => c[0] === "workflow" && c[1] === "run");
      expect(workflowCall?.join(" ")).toContain("agent=engineer");
      expect(workflowCall?.join(" ")).toContain("number=7");
      // launch_sub_agent's real response sets _meta.session_ends: true (it
      // ends the orchestrator session immediately, by design -- see
      // mcp/atomaton.ts's doc comment), so the atoma binary should NOT loop
      // back to the LLM for a second turn; only the one request is made.
      expect(mock.requests.length).toBe(1);
      const session = JSON.parse(readFileSync(join(dir, "session.json"), "utf8")) as {
        messages: { role: string; content: string }[];
      };
      const toolMessage = session.messages.find((m) => m.role === "tool");
      expect(toolMessage?.content).toContain("dispatched");
    } finally {
      mock.stop();
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30_000);
});
