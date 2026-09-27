import { readFileSync, readdirSync } from "node:fs";
import { configProblems } from "/home/runner/work/atomaton/atomaton/src/domain/delivery/deliverable-integrity.ts";

for (const p of [".github/atomaton/config.yaml", "self/atomaton/config.yaml"]) {
  const cfg = Bun.YAML.parse(readFileSync(p, "utf8"));
  const names = readdirSync(".github/atomaton/agent-definitions").filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3));
  const wf = readdirSync(".github/workflows").filter((f) => /\.ya?ml$/.test(f));
  console.log(p, JSON.stringify(configProblems({ config: cfg, agentNames: names, workflowFiles: wf })));
  console.log("  has agents:", JSON.stringify((cfg as any).agents));
}
