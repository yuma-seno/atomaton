import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = "/tmp/sess/all/sessions";
const files: string[] = [];
function walk(d: string) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".json")) files.push(p);
  }
}
walk(root);

const sets = new Map<string, number>();
for (const f of files) {
  let j: any;
  try { j = JSON.parse(readFileSync(f, "utf8")); } catch { continue; }
  const agent = j?.metadata?.github_context?.agent ?? "?";
  for (const m of j.messages ?? []) {
    for (const tc of m.tool_calls ?? []) {
      const name = tc?.function?.name;
      if (name !== "read" && name !== "grep") continue;
      let args: any = {};
      try { args = JSON.parse(tc?.function?.arguments ?? "{}"); } catch { continue; }
      const keys = Object.keys(args).sort().join(",");
      const k = `${name} [${keys}]`;
      sets.set(k, (sets.get(k) ?? 0) + 1);
      const kk = `${agent} ${k}`;
      sets.set(kk + " (by agent)", (sets.get(kk + " (by agent)") ?? 0) + 1);
    }
  }
}
for (const [k, v] of [...sets.entries()].sort()) console.log(v + "\t" + k);
