// C が実際に削除された理由の再現: 12:18:05 のガード実行時、スレッドには
// ended=done の結果コメント(c4, c6)の後に C がある。C を除いたスレッドの最後の
// turn イベントは returned(c6)…のはず。しかし c2 (08:08) と c4 (08:17) と c6 (09:34) は
// いずれも ended=done を持つ。C を除いたスレッドの最終イベントは returned → person。
// つまり guard は C を削除しないはず。
// → では 12:18:05 の削除は何を見たのか。可能性1: c4/c6 のタグが fetch_events の
//   withoutTags と異なり、guard の readComments では別の形で読めた。
// 可能性2: 09:34 以降の c6 は llm-context タグも持つ。guard の判定はタグを読まない。
// 可能性3: そもそも 12:18:05 のガードは C を判定しておらず、P を判定した。
//   C の削除通知(12:18:05)は yuma-seno あてなので C を削除したことは確実。
// 可能性4: guard の --jq 読み取りで issue body が���めずエラー?
//   → issue body の読み取り失敗は process.exit(1) でステップ失敗になる。成功している。
// 可能性5: (決定打) — C がコマンドとして parse された直後、guard は C を除いた
//   スレッドを見るが、そのとき issue body の読み取り(readThread)は #204 の body。
//   #204 の body は「/atomaton\n#204 にて…」で始まる! issue の BODY に
//   /atomaton がある。しかし commentWouldBeRemoved は body を読まない…
//   → 違う。readThread は body を読むが commentWouldBeRemoved は events だけ使う。
// 残る可能性: c2 の body に「/engineer」等のスラッシュコマンド風の行がある?
//   → ない。
// 実際の判定を見るには、c4/c6 を除いた「C の前のスレッド」を its shaped events で見る。
import { shapedThread, whoseTurn } from "/home/runner/work/atomaton/atomaton/src/domain/work/thread.ts";
import { readers } from "/home/runner/work/atomaton/atomaton/src/adapters/github/thread.ts";

const c1 = { body: "#186で同様の現象が発生", isHuman: true };
const c2 = { body: "<!-- atomaton:llm-context=exclude -->\n<!-- atomaton:ended=done -->\n@yuma-seno **This issue...**", isHuman: false };
const c3 = { body: "/atomaton\nLLMのAPIが最終レスポンス空で返してきてるってこと？", isHuman: true };
const c4 = { body: "<!-- atomaton:agent=atomaton -->\n<!-- atomaton:changed=no -->\n<!-- atomaton:ended=done -->\nはい、#194のセッションで確定しています。", isHuman: false };
const c5 = { body: "/atomaton\nそもそも、そんなことあるの？LLMのAPI仕様として。", isHuman: false }; // ← c5 は Bot! 実際は human だが shapedThread で isHuman を機械側にすると
const c6 = { body: "<!-- atomaton:agent=atomaton -->\n<!-- atomaton:ended=done -->\nはい、あります。", isHuman: false };

const shaped = shapedThread([c1, c2, c3, c4, c5, c6], readers);
console.log("events:", shaped.events);
console.log("whoseTurn:", whoseTurn(shaped.events));
