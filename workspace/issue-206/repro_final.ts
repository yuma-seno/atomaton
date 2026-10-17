// 最終再現: #204 の 12:17:57 の実事象を、実コメント ID で再現する。
// 実際の投稿順: ...(c6, 09:34) → P(通常コメント、12:17:5x、削除済みでID不明) → C(/atomaton, 12:17:57)
// ガードが C の到着を見て P を削除した(起動コメント 12:18:05 の通知が証拠)。
import { rmSync } from "node:fs";
import {
  makeConfigDir,
  runWithFakeGh,
  scriptPath,
} from "/home/runner/work/atomaton/atomaton/src/entrypoints/machinery/testing/harness.ts";

const bot = (id: number, body: string) => ({ id, body, user: { type: "Bot" } });
const human = (id: number, body: string) => ({ id, body, user: { type: "User" } });

const c6 = bot(6232349429, "<!-- atomaton:agent=atomaton -->\n<!-- atomaton:changed=no -->\n<!-- atomaton:ended=done -->\nはい、あります。");
const P = human(9999000001, "通常コメント(スラッシュなし)の補足。");
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
const deleted = (r: { ghCalls: string[][] }) =>
  r.ghCalls.some((c) => c.includes("DELETE") && c.join(" ").includes("comments/9999000001"));

console.log("A. C が届いた後のスレッド(C のガードが P を見る):", (() => { const r = run([c6, P, C], C.id); return deleted(r); })(), "← C が先に投稿されたという判定になって P が消える");
console.log("B. P のみ(C 未到着、P のガードが自分を見る):    ", (() => { const r = run([c6, P], P.id); return deleted(r); })(), "← P のガードなら削除しない");
