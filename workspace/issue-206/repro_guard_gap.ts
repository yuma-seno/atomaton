// ガードの欠陥の最小再現: shapedThread の「全 walk」規則と、ガードの「除外して判定」の差。
import { shapedThread, whoseTurn } from "/home/runner/work/atomaton/atomaton/src/domain/work/thread.ts";
import { readers } from "/home/runner/work/atomaton/atomaton/src/adapters/github/thread.ts";

// 投稿順: 結果コメント(Bot, ended=done) → 通常コメン��(人) → /atomaton(人)
const thread = [
  { body: "<!-- atomaton:ended=done -->\n結果", isHuman: false },
  { body: "普通の補足コメント", isHuman: true },
  { body: "/atomaton", isHuman: true },
];

// shapedThread の全 walk(設計文書どおり): 通常コメントは person ターン中の到着なので保持
const shaped = shapedThread(thread, readers);
console.log("全 walk の kept:", shaped.comments.length, "/", thread.length, "| events:", shaped.events);
console.log("=> shapedThread の規則では通常コメントは保持される");

// ガードの実際の判定: 判定対象(通常コメント)を除外した残り 2 件
const guardView = thread.filter((_, i) => i !== 1);
const guardEvents = shapedThread(guardView, readers).events;
console.log("ガードの判定(除外後):", guardEvents, "→ whoseTurn:", whoseTurn(guardEvents));
console.log("=> /atomaton の asked が最後のイベントになり、agent ターン判定 → 通常コメントが削除される");
