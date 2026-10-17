# Issue #206 分析メモ(次の run 向け)

## 結論
ガード(guard_comment_during_run)は判定対象コメントを「時系列の位置」ではなく「除外して」判定するため、
判定対象より後に投稿された /atomaton が「先に立った asked」と誤認され、先前の通常コメントが削除される。
ユーザーの仮説(前後を正しく検知できていない)は正しい。

## 時系列(2026-10-17, API 実測)
- ~12:17:52-54: 通常コメント(スラッシュなし)投稿 → Manual Comment run 39031967292(run #77)起動
- 12:17:57: /atomaton コメント 6233787345 投稿 → run 39031972930(run #78)起動(12:18:00作成)
- 12:18:03-06: run #77 の guard ステップ(job 117394080364)。判定対象(通常コメント)を除外した
  スレッドの最終イベント = /atomaton の asked → agent ターン判定 → **通常コメントを削除**
- 12:18:05: 削除通知 6233788575(@yuma-seno "Your comment was removed because the ball is with an agent...")
- 12:18:06-08: run #78 の guard(job 117394098318)。通常コメントは既に消済み → 残スレッドは
  ended=done(09:34 の結果コメント 6232349429)で終わり person 判定 → /atomaton は blocked=false、
  runner 正常起動(12:18:14-12:23:56、/stop で停止したやつ)
- /atomaton コメント(6233787345)は現在も存在 → 削除されたのはそれ以前の通常コメント

## コード位置
- src/adapters/github/thread.ts:158-160 — commentWouldBeRemoved: whoseTurn(readThread(repo, number, commentId).shaped.events)
- src/adapters/github/thread.ts:121 — readComments が excludeCommentId でフィルタ(除外が原因)
- src/domain/work/thread.ts:236-239 — shapedThread の設計文書「walk it oldest first, and drop each
  such comment as it is reached」に違反(全 walk なら通常コメントは person ターン中の到着で保持される)
- src/domain/work/thread.ts:255-265 — shapedThread 本体
- src/entrypoints/machinery/guard_comment_during_run.ts:75 — ガードからの呼び出し箇所

## 再現済み(/tmp/atomaton-workspace のスクリプト)
- repro_issue206.ts / repro_deployed.ts: デプロイ済み bundled ガード(.github/atomaton-runtime/scripts/
  guard_comment_during_run.ts)を fake gh で実行。
  - 後発 /atomaton ありで通常コメントを判定 → DELETE 発行(本件どおり)
  - /atomaton なし → DELETE なし
  - /atomaton 自身を判定 → DELETE なし(run が正常起動したことと整合)

## 影響範囲
- 起動コマンドの約10秒以内(checkout+bun setup+parse の窓)に投稿された「先前コメント」が誤削除。
- 逆向き(コマンド後に投稿)は現行どおり正しく削除される非対称な欠陥。
- #205/#207(空レスポンス系)とは独立の欠陥。

## 修正案(承認待ち)
1. commentWouldBeRemoved を「除外して判定」→「全コメントを時系列のまま shapedThread に通し、
   判定対象が shaping で落とされるか」に変更(= keptCommentIds と同じ walk)。
2. 判定対象 ID がコメント一覧に無い場合は fail-closed(既存の exit 1 経路)。
3. テスト: guard_comment_during_run.test.ts の2フィクスチャ("deletes the comment..." と
   "a pull request body...")に判定対象コメントを一覧へ追加 + 本件回帰テスト
   (通常コメント→/atomaton の順で最初が保持される)+ 判定対象不在で fail closed のテスト。
- src/** の1ファイル+テスト。self-deploy(人のマージ)後に効く。
- 判定対象が最新の通常ケースは判定不変。後発コメントが届くケースのみ挙動が変わる。
