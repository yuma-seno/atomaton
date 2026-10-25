// How often any delegate tool is called, per session, from the metrics rows the
// project already generates (atomaton-data:metrics/rows.json).
// Re-run: git show origin/atomaton-data:metrics/rows.json > /tmp/rows.json && bun run /tmp/atomaton-workspace/delegate-usage.ts
const rows = JSON.parse(await Bun.file("/tmp/rows.json").text());
const isDel = (n: string) => /delegate/.test(n) && !n.startsWith("atomaton__");
let sessions = 0, withDel = 0, delCalls = 0, allCalls = 0;
const byDay: Record<string, { sessions: number; withDel: number; delCalls: number; calls: number }> = {};
let min = "z", max = "";
for (const r of rows) {
  sessions++;
  const calls = Object.keys(r.tools ?? {}).filter(isDel).reduce((s, n) => s + r.tools[n], 0);
  delCalls += calls; allCalls += r.calls ?? 0;
  if (calls > 0) withDel++;
  const ended = (r.runs ?? []).map((x: any) => x.ended).filter(Boolean).sort().pop();
  if (ended) { if (ended < min) min = ended; if (ended > max) max = ended; }
  const k = ended ? ended.slice(0, 10) : "no-date";
  byDay[k] ??= { sessions: 0, withDel: 0, delCalls: 0, calls: 0 };
  byDay[k].sessions++; byDay[k].calls += r.calls ?? 0;
  if (calls > 0) byDay[k].withDel++;
  byDay[k].delCalls += calls;
}
console.log(`sessions=${sessions} used_a_delegate=${withDel} delegate_calls=${delCalls} all_calls=${allCalls} share=${(delCalls / allCalls * 100).toFixed(2)}%`);
console.log(`data window: ${min.slice(0, 10)} .. ${max.slice(0, 10)}`);
for (const [k, v] of Object.entries(byDay).sort().slice(-4)) console.log(k, JSON.stringify(v));
