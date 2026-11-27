# #636 状態ノート（2025年終盤run）

## 状態
- **実装完了、テスト全件 green**（`bun run test` 2606/2606、lint/typecheck/synth OK）。
- ブランチ `atomaton/issue-636`、コミット 1件（046bb90、メッセージは誤って「test: probe…」になっている — worktree 全変更がこの1コミットに乗った。PR 本文で説明）。
- 残り: create_pr + re-invocation でのマージ判定。

## 実装した設計（確定済み）
**本文起点runもclaimを書く — ただし ask コメントを自分で mint する方式。**
- `claim_turn.ts`: `ask<=0` なら `--agent` を使って dispatch marker（`postDispatchMarker` と同型の3行）をPOSTし、そのコメントidをaskとして既存のmarker-in-place経路へ。خرج力に `ask=<id>` を追加。`--agent` 空は非ゼロ終了。mint後、表示が確認できるまで READ_DELAYS_MS でpoll。
- runner: `ATOMATON_ASK_ID`・`post-result ask`・`reportCancelled ASK` を `${{ inputs.ask || steps.claim.outputs.ask }}` に。claim env に AGENT/TYPE 追加、outputs に `ask` 追加。
- shapedThread 以下の読み手・ガードは**無変更**。
- 追従プローズ更新: tags.ts(TOOK_TAG), thread.ts readers, turn-identity.ts, post_result_comment.ts, dispatch.ts, run-watch.wac.ts, reconcile_run_ending.ts, docs/work/how-it-works/what-keeps-two-runs-off-one-issue.md, dispatch.test.ts コメント。

## 検証
- claim_turn.test.ts に mint の describe 追加（mint+in-place claim+ask出力、PR用語、agent空は拒否、不可視markerはfail）27/27 pass。
- guard や shapedThread の個別テストは追加不要（既存の marker disaptch と同形になったため）。

## 注意
- scan_secrets は gitleaks の最新リリース解決に失敗し、credentials スキャンがスキップ警告（環境起因）。CI の verify で同じ警告が出る可能性。
- 実環境検証（body run 中にコメント→削除+通知）はリリース適用後に scratch issue で確認する（issue本文の閉条件を参照）。
