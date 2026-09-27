// Bullet/sentence counts per report part, to ground the item bounds in something real.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = "/tmp/atomaton-workspace/data/sessions";
type Msg = { role: string; content?: unknown };
function textOf(c: unknown): string {
  if (typeof c === "string") return c;
  if (!Array.isArray(c)) return "";
  return c.map((b: any) => (b?.type === "text" ? b.text : "")).join("");
}
function walk(d: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".json")) out.push(p);
  }
  return out;
}
const PARTS = [
  ["concluded", /^#{1,3}[^\n]*What I concluded/m],
  ["know", /^#{1,3}[^\n]*How I know/m],
  ["couldnot", /^#{1,3}[^\n]*What I could not establish/m],
  ["next", /^#{1,3}[^\n]*What happens next/m],
] as const;

for (const file of walk(root).sort()) {
  const s = JSON.parse(readFileSync(file, "utf8")) as { messages: Msg[] };
  let last = "";
  for (const m of s.messages ?? []) {
    if (m.role !== "assistant") continue;
    const t = textOf(m.content);
    if (t.trim()) last = t;
  }
  if (!last) continue;
  const marks: { name: string; at: number; len: number }[] = [];
  for (const [name, re] of PARTS) {
    const m = re.exec(last);
    if (m) marks.push({ name, at: m.index, len: m[0].length });
  }
  marks.sort((a, b) => a.at - b.at);
  const line = [`${file.replace(root + "/", "")} total=${last.length}`];
  for (let i = 0; i < marks.length; i += 1) {
    const end = i + 1 < marks.length ? marks[i + 1].at : last.length;
    const body = last.slice(marks[i].at + marks[i].len, end);
    const bullets = body.split("\n").filter((l) => /^\s*(?:[-*]|\d+\.)\s+\S/.test(l)).length;
    const sentences = body.split(/(?<=[.!?。])\s+/).filter((x) => x.trim().length > 1).length;
    line.push(`    ${marks[i].name}: chars=${end - marks[i].at} bullets=${bullets} sentences=${sentences}`);
  }
  console.log(line.join("\n"));
}
