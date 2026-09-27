// Break the stored reports into the report-contract's four parts vs whatever else
// the run was asked to produce. Reads the sessions under data/sessions plus the
// comment bodies fetched from the API, saved under data/comments/.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = "/tmp/atomaton-workspace/data/sessions";

type Msg = { role: string; content?: unknown };

function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((b: any) => (b?.type === "text" ? b.text : "")).join("");
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".json")) out.push(p);
  }
  return out;
}

const PARTS = ["What I concluded", "How I know", "What I could not establish", "What happens next"];
const ALT: Record<string, string[]> = {
  "What I concluded": ["結論", "依据", "未能确定", "接下来"],
};

function split(report: string): { part: string; chars: number }[] {
  const marks: { part: string; at: number }[] = [];
  for (const part of PARTS) {
    for (const spelling of [part, ...(ALT[part] ?? [])]) {
      const re = new RegExp(`(^|\\n)#{1,3}[^\\n]*${spelling}`, "g");
      let m: RegExpExecArray | null;
      while ((m = re.exec(report))) marks.push({ part, at: m.index + (m[1] ? 1 : 0) });
    }
  }
  marks.sort((a, b) => a.at - b.at);
  const out: { part: string; chars: number }[] = [];
  if (marks.length === 0) return [{ part: "(no contract headings)", chars: report.length }];
  if (marks[0].at > 0) out.push({ part: "(before the first heading)", chars: marks[0].at });
  for (let i = 0; i < marks.length; i += 1) {
    const end = i + 1 < marks.length ? marks[i + 1].at : report.length;
    out.push({ part: marks[i].part, chars: end - marks[i].at });
  }
  return out;
}

const files = walk(root).sort();
const lines: string[] = [];
for (const file of files) {
  const session = JSON.parse(readFileSync(file, "utf8")) as { messages: Msg[] };
  const msgs = session.messages ?? [];
  let last = "";
  for (const m of msgs) {
    if (m.role !== "assistant") continue;
    const t = textOf(m.content);
    if (t.trim()) last = t;
  }
  if (!last) continue;
  const report = last;
  const parts = split(report);
  const detail = parts.map((p) => `${p.part}=${p.chars}`).join(" ");
  const nonContractish = parts
    .filter((p) => p.part.startsWith("(before"))
    .reduce((n, p) => n + p.chars, 0);
  lines.push(
    `${file.replace(root + "/", "")}  total=${report.length}  beforeFirstHeading=${nonContractish}\n    ${detail}`,
  );
}
console.log(lines.join("\n"));
