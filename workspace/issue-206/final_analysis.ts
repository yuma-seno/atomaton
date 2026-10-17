// #206 の決定打: 12:17:57 の /atomaton (C) が削除された理由。
//
// 時系列(API で確認済み):
//   09:34:45  c6 (Bot, ended=done)      → person のターンに戻る
//   12:17:57  C  = /atomaton (human)     → asked (スレッドの最後のイベント)
//   12:18:00  Manual Comment run 39031967292 開始
//   12:18:03  parse: agent=atomaton
//   12:18:06  guard 開始
//   12:18:08  guard 終了 → C を削除(12:18:05 の通知は guard が投稿)
//   12:18:09  closed-guard 開始 → 12:18:09 終了(削除済みだが blocked 判定続行)
//
// guard の判定: C を除いたスレッド [c1..c6] の最後のイベント。
// c6 の ended=done は returned なので、events 最後は returned → person → 削除しないはず。
//
// しかし実測(repro_final2.ts): 同じスレッドで再現すると「削除しない」。
// つまり deployed な機械(12:18時点で走っていたコード)と現在の src/ の間に差分がある、
// あるいは、ガードが見たスレッドが違った。
//
// 差分の候補: c6 の ended=done タグが 12:18:06 時点で「まだ見えなかった」可能性。
// しかし c6 は 09:34 投稿で 3時間前。Read lag の可能性は低い。
//
// 残る候補(有力): guard が実行された 12:18:06 時点では、guard は C 以外に
// 「12:17:5x の P (通常コメント)」も見ていた。P を除いたスレッド…ではない。
//
// 実は最も有力な説明: 12:18:05 の通知は C の削除の通知。guard は C を判定した。
// C を除いたスレッドの最後のイベントが asked/handed-off になるには、
// c6 の ended=done が「returned として読めない」必要がある。
// deployed なバージョン (v0.21.7, 4e7c722) の guard コードは
// .github/atomaton-runtime/scripts/guard_comment_during_run.ts — 同梱の bundled 版。
// 現在の src/ 版と bundled 版で shapedThread の挙動が違う可能性を検証する。
