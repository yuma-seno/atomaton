// Count, per session, how many `read`/`grep` calls carried more than the one required
// argument. Also counts optional-key use on other servers' tools as a control.
import { readdirSync, readFileSync, statSync, readdirSync as rd } from "node:fs";
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

type Row = {
  session: string;
  agent: string;
  read: number; readMulti: number;
  grep: number; grepMulti: number;
  ctrlMulti: number; ctrl: number;
};

const rows: Row[] = [];
for (const f of files) {
  let j: any;
  try { j = JSON.parse(readFileSync(f, "utf8")); } catch { continue; }
  const agent = j?.metadata?.github_context?.agent ?? "?";
  const ctrlNames = new Set(["create_root_issue", "create_sub_issue", "bash", "edit", "get_issue_comments", "delegate", "delegate_readonly", "delegate_large", "delegate_readonly_large", "fetch", "search_issues"]);
  const r: Row = { session: f.replace(root + "/", "").replace(".json", ""), agent, read: 0, readMulti: 0, grep: 0, grepMulti: 0, ctrl: 0, ctrlMulti: 0 };
  for (const m of j.messages ?? []) {
    for (const tc of m.tool_calls ?? []) {
      const name = tc?.function?.name;
      let args: any = {};
      try { args = JSON.parse(tc?.function?.arguments ?? "{}"); } catch { args = null; }
      const n = args && typeof args === "object" ? Object.keys(args).length : -1;
      if (name === "read") { r.read++; if (n > 1) r.readMulti++; }
      else if (name === "grep") { r.grep++; if (n > 1) r.grepMulti++; }
      else if (ctrlNames.has(name)) { r.ctrl++; if (n > 1) r.ctrlMulti++; }
    }
  }
  rows.push(r);
}

rows.sort((a, b) => (a.session < b.session ? 1 : -1));
console.log(["session", "agent", "read", "read+", "grep", "grep+", "ctrl", "ctrl+"].join("\t"));
for (const r of rows) {
  if (r.read + r.grep + r.ctrl === 0) continue;
  console.log([r.session, r.agent, r.read, r.readMulti, r.grep, r.grepMulti, r.ctrl, r.ctrlMulti].join("\t"));
}

const byAgent = new Map<string, Row>();
for (const r of rows) {
  const a = byAgent.get(r.agent) ?? { session: "", agent: r.agent, read: 0, readMulti: 0, grep: 0, grepMulti: 0, ctrl: 0, ctrlMulti: 0 };
  a.read += r.read; a.readMulti += r.readMulti; a.grep += r.grep; a.grepMulti += r.grepMulti; a.ctrl += r.ctrl; a.ctrlMulti += r.ctrlMulti;
  byAgent.set(r.agent, a);
}
console.log("\n== totals by agent ==");
console.log(["agent", "read", "read+", "grep", "grep+", "ctrl", "ctrl+"].join("\t"));
for (const a of [...byAgent.values()].sort((x, y) => (x.agent < y.agent ? -1 : 1))) {
  console.log([a.agent, a.read, a.readMulti, a.grep, a.grepMulti, a.ctrl, a.ctrlMulti].join("\t"));
}
