// 「ガードが消したコメントは run の context に載らない」という設計と、
// 「ガードは asked の立った後の全人間コメントを消す」という仕様の合成結果の検証。
// #204 の 12:17 の実害: ガードは「/atomaton が先に投稿した」という判定では正しいが、
// 実際の投稿順は P が先・C が後。C が asked を立てたのは P の後なので、
// ガードが P を消した結果、「P は C に先行していた」という事実がスレッドから消えた。
import { shapedThread, whoseTurn } from "/home/runner/work/atomaton/atomaton/src/domain/work/thread.ts";
import { readers } from "/home/runner/work/atomaton/atomaton/src/adapters/github/thread.ts";

// 実際の投稿順: P が先、C が後。
const actualOrder = [
  { body: "（通常コメント）補足。", isHuman: true },
  { body: "/atomaton", isHuman: true },
];
const shaped = shapedThread(actualOrder, readers);
console.log("actual order events:", shaped.events);
console.log("whoseTurn:", whoseTurn(shaped.events));

// ガードの判定: C が届いた後のスレッドを見て P を除外して判定
const guardView = [
  { body: "（通常コメント）補足。", isHuman: true },  // 除外対象だが、ここでは除外済みとして扱う
  { body: "/atomaton", isHuman: true },
].slice(1); // 除外
console.log("guard view (P excluded) events:", shapedThread(guardView, readers).events);
console.log("=> guard は「P の到着時点で既に agent のターンだった」と誤認する");
