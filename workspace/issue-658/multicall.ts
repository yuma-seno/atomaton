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

const SINCE = "2026-11-27T16:00:00Z";
const buckets = new Map<string, { lost: number; kept: number }>();
const bump = (k: string, lost: boolean) => {
  const b = buckets.get(k) ?? { lost: 0, kept: 0 };
  if (lost) b.lost++; else b.kept++;
  buckets.set(k, b);
};

for (const f of files) {
  let j: any;
  try { j = JSON.parse(readFileSync(f, "utf8")); } catch { continue; }
  const runs = j.atoma_runs ?? [];
  const started = runs.map((r: any) => r.started).filter(Boolean).sort()[0] ?? "";
  if (String(started) < SINCE) continue;
  const agent = j?.metadata?.github_context?.agent ?? "?";
  for (const m of j.messages ?? []) {
    const calls = m.tool_calls ?? [];
    if (calls.length === 0) continue;
    for (const tc of calls) {
      const name = tc?.function?.name;
      if (name !== "read" && name !== "grep") continue;
      let args: any = {};
      try { args = JSON.parse(tc?.function?.arguments ?? "{}"); } catch { continue; }
      const n = Object.keys(args).length;
      const lost = n <= 1;
      bump(`${agent} ${name} in ${calls.length === 1 ? "1" : calls.length === 2 ? "2" : "3+"}-call message`, lost);
      bump(`${agent} ${name} total`, lost);
    }
  }
}
for (const [k, v] of [...buckets.entries()].sort()) {
  const pct = ((v.lost / (v.lost + v.kept)) * 100).toFixed(0);
  console.log(`${k}\tlost ${v.lost}\tkept ${v.kept}\t${pct}% lost`);
}
