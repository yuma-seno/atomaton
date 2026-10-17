// 修正: A のケースは「C のガードが P を判定する」ので judgedId = P が正しい。
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

// 実際に起きたのは: 12:18:05 のガード実行(job 117394080364, run 39031967292)は
// C (/atomaton, 12:17:57) を判定したが、その時点でスレッドには P (12:17:5x) が既にあった。
// しかし P は削除されていない(コメント2の通知は C を指す)…それとも P を削除した?
// 削除通知の本文「Your comment was removed」は C の作者(yuma-seno)に宛てられているので、
// ガードが削除したのは C 自身。→ C が asked を立てる前に P があり、
// guard は P を除いたスレッドで判定するはずが、P は「C の前の通常コメント」なので
// turned-turn 判定に影響しない。ではなぜ C が削除された?
console.log("C のガードが C 自身を判定(P が直前にある):");
const r1 = run([c6, P, C], C.id);
console.log("  C が削除された:", r1.ghCalls.some((c) => c.includes("DELETE") && c.join(" ").includes("comments/6233787345")));
console.log("  C 削除の理由:", r1.stderr.trim().split("\n").slice(-1)[0]);
