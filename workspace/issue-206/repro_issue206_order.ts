// Race window の再現: guard の判定時点では /atomaton がまだ届いておらず(順序の問題)、
// 届いた後のスレッドでは普通のスレッドとして成立している、という逆転を示す。
import { rmSync } from "node:fs";
import {
  makeConfigDir,
  runWithFakeGh,
  scriptPath,
} from "/home/runner/work/atomaton/atomaton/src/entrypoints/machinery/testing/harness.ts";

const bot = (id: number, body: string) => ({ id, body, user: { type: "Bot" } });
const human = (id: number, body: string) => ({ id, body, user: { type: "User" } });

const c4 = bot(6231641059, "<!-- atomaton:agent=atomaton -->\n<!-- atomaton:changed=no -->\n<!-- atomaton:ended=done -->\nはい、#194のセッションで確定しています。");
const c5 = human(6232265375, "/atomaton\nそもそも、そんなことあるの？LLMのAPI仕様として。");
const c6 = bot(6232349429, "<!-- atomaton:agent=atomaton -->\n<!-- atomaton:changed=no -->\n<!-- atomaton:ended=done -->\nはい、あります。");

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

console.log("=== guard 判定スナップショット(incident の時系列再現) ===");
// 12:17:50頃: P が投稿される(直前の bot コメント c6 の直後)。guard 起動 → スレッドに C は未到着。
console.log("guard 読み取り時に C(/atomaton) が未到着のケース:");
const r1 = run([c4, c5, c6, human(9999000001, "（通常コメント）補足。")], 9999000001);
console.log("  DELETED:", deleted(r1));
console.log("guard 読み取り時に C が既に届いていたケース:");
const r2 = run([c4, c5, c6, human(9999000001, "（通常コメント）補足。"), human(6233787345, "/atomaton")], 9999000001);
console.log("  DELETED:", deleted(r2));
