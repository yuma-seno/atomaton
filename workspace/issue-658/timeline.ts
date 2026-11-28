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

type Row = { session: string; agent: string; started: string; read: number; readMulti: number; grep: number; grepMulti: number };
const rows: Row[] = [];
for (const f of files) {
  let j: any;
  try { j = JSON.parse(readFileSync(f, "utf8")); } catch { continue; }
  const agent = j?.metadata?.github_context?.agent ?? "?";
  const runs = j.atoma_runs ?? [];
  const started = runs.map((r: any) => r.started).filter(Boolean).sort()[0] ?? "?";
  const r: Row = { session: f.replace(root + "/", "").replace(".json", ""), agent, started: String(started), read: 0, readMulti: 0, grep: 0, grepMulti: 0 };
  for (const m of j.messages ?? []) {
    for (const tc of m.tool_calls ?? []) {
      const name = tc?.function?.name;
      let args: any = {};
      try { args = JSON.parse(tc?.function?.arguments ?? "{}"); } catch { args = null; }
      const n = args && typeof args === "object" ? Object.keys(args).length : -1;
      if (name === "read") { r.read++; if (n > 1) r.readMulti++; }
      else if (name === "grep") { r.grep++; if (n > 1) r.grepMulti++; }
    }
  }
  rows.push(r);
}
rows.sort((a, b) => (a.started < b.started ? 1 : -1));
console.log(["started", "session", "agent", "read", "read+", "grep", "grep+"].join("\t"));
for (const r of rows.slice(0, 45)) console.log([r.started, r.session, r.agent, r.read, r.readMulti, r.grep, r.grepMulti].join("\t"));
