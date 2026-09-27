// Per-part "checkable sentence" share, computed the way #13's baseline describes it:
// a sentence containing an identifier, a file name, `#N`, `path:line`, or a number with a unit.
// Applied per report part, so the trade-off in #16 can be read against something measured.
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

// The shape #13 measured: an anchor is one of these forms.
const ANCHOR =
  /(`[^`]+`|\b[\w./-]+\.(?:ts|md|ya?ml|json|sh|wac)\b|#\d+|[\w./-]+:\d+|\b\d[\d,_]*\s*(?:characters?|chars|tokens?|runs?|sessions?|seconds?|minutes?|hours?|files?|items?|bullets?|%)\b|\b\d[\d,_]{2,}\b)/;

function sentences(text: string): string[] {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .split(/(?<=[.!?。])\s+|\n(?=[-*]\s)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

const PARTS: [string, RegExp][] = [
  ["before-any-part", /$^/],
  ["What I concluded", /^#{1,3}[^\n]*What I concluded/m],
  ["How I know", /^#{1,3}[^\n]*How I know/m],
  ["What I could not establish", /^#{1,3}[^\n]*What I could not establish/m],
  ["What happens next", /^#{1,3}[^\n]*What happens next/m],
];

for (const file of walk(root).sort()) {
  const s = JSON.parse(readFileSync(file, "utf8")) as { messages: Msg[] };
  let last = "";
  for (const m of s.messages ?? []) {
    if (m.role !== "assistant") continue;
    const t = textOf(m.content);
    if (t.trim()) last = t;
  }
  if (!last) continue;
  const marks: { name: string; at: number; ends: number }[] = [];
  for (const [name, re] of PARTS.slice(1)) {
    const m = re.exec(last);
    if (m) marks.push({ name, at: m.index, ends: m.index + m[0].length });
  }
  marks.sort((a, b) => a.at - b.at);
  console.log(`\n${file.replace(root + "/", "")} total=${last.length} chars`);
  let prev = 1; // skip the slab before the first part; for these reports it is the deliverable
  for (const mk of marks) {
    const body = last.slice(mk.ends, marks.find((x) => x.at > mk.at)?.at ?? last.length);
    const ss = sentences(body);
    const anchored = ss.filter((x) => ANCHOR.test(x)).length;
    const pct = ss.length ? Math.round((100 * anchored) / ss.length) : 0;
    console.log(`   ${mk.name}: sentences=${ss.length} anchored=${anchored} (${pct}%) chars=${body.length}`);
    prev = mk.at;
  }
  if (marks.length === 0) {
    const ss = sentences(last);
    const anchored = ss.filter((x) => ANCHOR.test(x)).length;
    console.log(
      `   (whole message, no contract headings): sentences=${ss.length} anchored=${anchored} ` +
        `(${ss.length ? Math.round((100 * anchored) / ss.length) : 0}%)`,
    );
  }
}
