// Serve a stub provider, run atoma on an attachments-only definition, and print
// the tool names the model's request carried -- i.e. exactly what the agent is handed.
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const seen = { tools: [], completions: 0 };
const server = Bun.serve({
  hostname: "127.0.0.1", port: 0,
  async fetch(request) {
    let body = {};
    try { body = await request.json(); } catch {}
    if (Array.isArray(body.messages)) {
      if (seen.completions === 0) for (const t of body.tools ?? []) seen.tools.push(t.function?.name);
      seen.completions++;
    }
    return Response.json({ choices: [{ message: { role: "assistant", content: "done" }, finish_reason: "stop" }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } });
  },
});
const work = mkdtempSync(join(tmpdir(), "toollist-"));
const def = join(work, "att-only.md");
writeFileSync(def, ["---", "name: att-only", "description: probes one server's tools", "provider: openai", "model: probe", "mcp_servers:", "  - attachments", "---", "", "Say done.", ""].join("\n"));
writeFileSync(join(work, "prompt.txt"), "Say done.\n");
const { GH_TOKEN: _drop, ...env } = process.env;
const run = Bun.spawn(["atoma", "run", "--agent-def", def, "--tools-file", "/home/runner/work/_temp/atomaton-run/tools.yaml", "--prompt-file", join(work, "prompt.txt"), "--max-iterations", "2", "--max-runtime-secs", "90"], {
  stdout: "inherit", stderr: "inherit",
  env: { ...env, ATOMATON_MACHINERY_ROOT: "/home/runner/work/_temp/atomaton-machinery", ATOMA_PROVIDER: "openai", OPENAI_API_KEY: "probe", OPENAI_BASE_URL: `http://127.0.0.1:${server.port}` },
});
await run.exited;
server.stop(true);
console.log("TOOLS HANDED TO THE MODEL:", JSON.stringify(seen.tools));
