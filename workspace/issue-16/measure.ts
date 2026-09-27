// Measure report/comment lengths from the sessions saved in /tmp/atomaton-workspace/data/sessions.
// Pure reading: no repository writes.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = "/tmp/atomaton-workspace/data/sessions";

type Msg = {
  role: string;
  content?: unknown;
  tool_calls?: { function: { name: string; arguments: string } }[];
};

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

const rows: string[] = [];
for (const file of walk(root).sort()) {
  const session = JSON.parse(readFileSync(file, "utf8")) as { messages: Msg[] };
  const msgs = session.messages ?? [];
  let lastAssistant = 0;
  let assistantTextMessages = 0;
  let assistantTextChars = 0;
  for (const m of msgs) {
    if (m.role !== "assistant") continue;
    const t = textOf(m.content);
    if (t.trim()) {
      assistantTextMessages += 1;
      assistantTextChars += t.length;
      lastAssistant = t.length;
    }
  }
  const calls: Record<string, number[]> = {};
  for (const m of msgs) {
    if (m.role !== "assistant" || !m.tool_calls) continue;
    for (const c of m.tool_calls) {
      const name = c.function?.name ?? "";
      let args: any = {};
      try {
        args = JSON.parse(c.function?.arguments ?? "{}");
      } catch {
        args = {};
      }
      const push = (k: string, v: unknown) => {
        if (typeof v === "string" && v.length) (calls[k] ??= []).push(v.length);
      };
      if (name.endsWith("request_close_issue")) {
        push("close.reason", args.reason);
        push("close.summary", args.summary);
      }
      if (name.endsWith("launch_sub_agent")) push("launch.summary", args.summary);
      if (name.endsWith("create_pr")) push("pr.body", args.body);
      if (name.endsWith("reload_environment")) push("reload.reason", args.reason);
    }
  }
  const enc = (k: string) => (calls[k] ? calls[k].join(",") : "-");
  rows.push(
    [
      file.replace(root + "/", ""),
      `msgs=${msgs.length}`,
      `asstTextMsgs=${assistantTextMessages}`,
      `asstTextTotal=${assistantTextChars}`,
      `lastAsst=${lastAssistant}`,
      `close.reason=${enc("close.reason")}`,
      `close.summary=${enc("close.summary")}`,
      `launch.summary=${enc("launch.summary")}`,
      `pr.body=${enc("pr.body")}`,
      `reload.reason=${enc("reload.reason")}`,
    ].join("  "),
  );
}
console.log(rows.join("\n"));
