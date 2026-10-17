// 補足検証: c6 の ended=done があるのに「後続の P が削除された」のは、ended が turn を
// person に戻した後だから。P が削除されたのは C(/atomaton) が asked を立てたから、で検証済み。
// ここでは「shapedThread に C が含まれる場合、P が消える」ことの最小ケースを示す。
import { shapedThread } from "/home/runner/work/atomaton/atomaton/src/domain/work/thread.ts";
import { readers } from "/home/runner/work/atomaton/atomaton/src/adapters/github/thread.ts";

const entries = [
  { body: "<!-- atomaton:ended=done -->\n結果コメント", isHuman: false },  // returned
  { body: "（通常コメント）補足。", isHuman: true },                        // person のターンで到着 → keep
  { body: "/atomaton", isHuman: true },                                    // asked → agent のターン
];
const shaped = shapedThread(entries, readers);
console.log("kept comments:", shaped.comments.length, "of", entries.length);
console.log("events:", shaped.events);
console.log("=> 通常コメントは shapedThread でも保持されるが、guard の判定はその時点のスレッドで行われる");
