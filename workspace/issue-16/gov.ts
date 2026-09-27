import { readFileSync } from "node:fs";
import { pathMatches } from "/home/runner/work/atomaton/atomaton/src/domain/delivery/path-patterns.ts";
const cfg = Bun.YAML.parse(readFileSync(".github/atomaton/config.yaml", "utf8")) as { merge?: { governed_paths?: string[] } };
const pats = cfg.merge?.governed_paths ?? [];
for (const f of [".github/atomaton/config.yaml", "self/atomaton/config.yaml", "src/content/prompt-template.md", "tests/contract/agent-prompts.test.ts"]) {
  console.log(f, pats.some((p) => pathMatches(f, p)) ? "GOVERNED" : "not governed");
}
