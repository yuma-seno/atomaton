// deployed な bundled 版 (.github/atomaton-runtime/scripts/guard_comment_during_run.ts)
// を #204 の 12:18:06 のスレッド状態で実行して、C が削除されるかを実測する。
import { rmSync } from "node:fs";
import {
  makeConfigDir,
  runWithFakeGh,
} from "/home/runner/work/atomaton/atomaton/src/entrypoints/machinery/testing/harness.ts";

const bot = (id: number, body: string) => ({ id, body, user: { type: "Bot" } });
const human = (id: number, body: string) => ({ id, body, user: { type: "User" } });

// 12:18:06 時点で存在したコメント(API実測):
const c1 = human(6231005370, "#186で同様の現象が発生");
const c2 = bot(6231560351, "<!-- atomaton:llm-context=exclude -->\n<!-- atomaton:ended=done -->\n@yuma-seno **This issue was opened by a person...**");
const c3 = human(6231585989, "/atomaton\nLLMのAPIが最終レスポンス空で返してきてるってこと？");
const c4 = bot(6231641059, "<!-- atomaton:agent=atomaton -->\n<!-- atomaton:changed=no -->\n<!-- atomaton:ended=done -->\nはい、#194のセッションで確定しています。");
const c5 = human(6232265375, "/atomaton\nそもそも、そんなことあるの？LLMのAPI仕様として。");
const c6 = bot(6232349429, "<!-- atomaton:agent=atomaton -->\n<!-- atomaton:changed=no -->\n<!-- atomaton:ended=done -->\nはい、あります。");
const C = human(6233787345, "/atomaton");
// もし 12:17:5x に P (通常コメント) が投稿されていたら:
const P = human(9999000001, "（通常コメント・スラッシュなし）");

const run = (comments: unknown[], judgedId: number) => {
  const configDir = makeConfigDir({});
  try {
    return runWithFakeGh(
      "/home/runner/work/atomaton/atomaton/.github/atomaton-runtime/scripts/guard_comment_during_run.ts",
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
const deletedC = (r: { ghCalls: string[][] }) =>
  r.ghCalls.some((c) => c.includes("DELETE") && c.join(" ").includes("comments/6233787345"));
const deletedP = (r: { ghCalls: string[][] }) =>
  r.ghCalls.some((c) => c.includes("DELETE") && c.join(" ").includes("comments/9999000001"));

console.log("=== deployed bundled 版で再現 ===");
console.log("1. C を判定、P 無し: C が削除された?", deletedC(run([c1,c2,c3,c4,c5,c6,C], C.id)));
console.log("2. C を判定、P 有り: C が削除された?", deletedC(run([c1,c2,c3,c4,c5,c6,P,C], C.id)), "| P が削除された?", deletedP(run([c1,c2,c3,c4,c5,c6,P,C], C.id)));
console.log("3. P を判定、C 有り: P が削除された?", deletedP(run([c1,c2,c3,c4,c5,c6,P,C], P.id)));
