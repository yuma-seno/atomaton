# #636 状態ノート（最終）

## 状態
- **完了**。PR #643 は main にマージ（846af68）。reviewer 承認（5点の根拠、blockers 空）。
- reviewer の未読2点はマージ後判定 run で消し込み済み:
  - ending writer は runner 内で3箇所、すべて `inputs.ask || steps.claim.outputs.ask`（runner.wac.ts:836/:1340/:1382）。素の `inputs.ask` は検証ステップ(:407)とclaim step(:687)のみ。
  - agent 名は入力検証で `[a-z][a-z0-9-]*`（runner.wac.ts:414, AGENT_NAME_PATTERN=domain/work/agent-name.ts）、ask は `^[0-9]*$`（:430）。marker本文への注入なし。
- `request_close_issue` で結論投稿済み（クローズ判断は機械側）。

## 残ること
- 実環境の検証条件（新規Issue本文 /atomaton → run中にコメント → 削除+通知）は、**リリース適用後でのみ確認可能**。リリース宣言は人の意思決定。適用後は確認1回で消化。
- PR本文で約束した「リリース適用後に確認コメント→close」は、適用後の run が自動で立たないため、結論コメント内で人に一手を明示する形に修正済み。

## 参照
- mint 本体: src/entrypoints/machinery/claim_turn.ts（markerBody/mintMarker、`## The minted ask (#636)` 節）
- テスト: claim_turn.test.ts の mint describe 4件 + 全体 2606 pass（マージ木と同一内容）
