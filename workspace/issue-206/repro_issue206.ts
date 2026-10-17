// Issue #206 の再現: #204 の 2026-10-17 12:17 時点のスレッドで
// guard_comment_during_run.ts が「先に投稿した通常コメント」を削除するかを検証する。
import { rmSync } from "node:fs";
import {
  makeConfigDir,
  runWithFakeGh,
  scriptPath,
} from "/home/runner/work/atomaton/atomaton/src/entrypoints/machinery/testing/harness.ts";
import { keptCommentIds } from "/home/runner/work/atomaton/atomaton/src/adapters/github/thread.ts";

const bot = (id: number, body: string) => ({ id, body, user: { type: "Bot" } });
const human = (id: number, body: string) => ({ id, body, user: { type: "User" } });

// #204 の実コメント(要約)。c1..c6 は 12:17 時点で存在済み。
const c1 = human(6231005370, "#186で同様の現象が発生");
const c2 = bot(6231560351, "<!-- atomaton:llm-context=exclude -->\n<!-- atomaton:ended=done -->\n@yuma-seno **This issue was opened by a person...**");
const c3 = human(6231585989, "/atomaton\nLLMのAPIが最終レスポンス空で返してきてるってこと？");
const c4 = bot(6231641059, "<!-- atomaton:agent=atomaton -->\n<!-- atomaton:changed=no -->\n<!-- atomaton:ended=done -->\nはい、#194のセッションで確定しています。");
const c5 = human(6232265375, "/atomaton\nそもそも、そんなことあるの？LLMのAPI仕様として。");
const c6 = bot(6232349429, "<!-- atomaton:agent=atomaton -->\n<!-- atomaton:changed=no -->\n<!-- atomaton:ended=done -->\nはい、あります。");
// 削除された「最初のコメント」(スラッシュなしの通常コメント、12:17:50頃と推定)
const P = human(9999000001, "（通常コメント・スラッシュなし）この件の補足です。");
// その約7秒後に投稿した /atomaton (id 6233787345, 12:17:57)
const C = human(6233787345, "/atomaton");

const run = (comments: unknown[], judgedId: number) => {
  const configDir = makeConfigDir({});
  try {
    return runWithFakeGh(
      scriptPath("guard_comment_during_run.ts"),
      ["--number", "204", "--comment-id", String(judgedId), "--commenter", "yuma-seno"],
      {
        cwd: configDir,
        env: { GITHUB_REPOSITORY: "owner/repo" },
        rules: [
          { match: ["api", "/issues/204/comments"], stdout: JSON.stringify(comments) },
          { match: ["api", "/issues/204", "--jq"], stdout: "" },
          { match: ["api", "DELETE"] },
          { match: ["issue", "comment"] },
        ],
      },
    );
  } finally {
    rmSync(configDir, { recursive: true, force: true });
  }
};

const deletedP = (r: { ghCalls: string[][] }) =>
  r.ghCalls.some((c) => c.includes("DELETE") && c.join(" ").includes("comments/9999000001"));

console.log("=== CASE 1: incident — thread WITH the later /atomaton, judging the plain comment ===");
const r1 = run([c1, c2, c3, c4, c5, c6, P, C], P.id);
console.log("guard DELETED the plain comment:", deletedP(r1));
console.log("guard stderr tail:", r1.stderr.trim().split("\n").slice(-2).join(" | "));

console.log("=== CASE 2 (control): same thread WITHOUT the later /atomaton ===");
const r2 = run([c1, c2, c3, c4, c5, c6, P], P.id);
console.log("guard DELETED the plain comment:", deletedP(r2));

console.log("=== CASE 3: what the run's context builder (keptCommentIds, the same shapedThread rule fetch_events uses) keeps ===");
const kept = keptCommentIds([c1, c2, c3, c4, c5, c6, P, C] as never);
console.log("plain comment kept by shaping:", kept.has(P.id), "| /atomaton kept:", kept.has(C.id));
