# Issue #621 調査メモ (孤立ノード)

## 現象の分解
「Gitツール使用後にrunが失敗 → ノード孤立・ツリー崩壊・エージェント進行不能・人に通知なし」

## 特定した2つの経路

### 経路1: park の親が死んだ子に気づかない (主犯・通知されない)
- run が子開始ツール呼び出し中に終わると turn が park: `src/domain/work/turn.ts:243`
- 回収条件は「子 issue が閉じること」= 集約 gate のみ
- `src/domain/work/stale-lock.ts:189-191`: 子 (`openUnder > 0`) が開いたままなら park は無期限 hold (安全側の意図)
- 子の engineer run が死ぬ → 子 issue は閉じられない → 親 park が残る
- 通知経路: `stale-lock.ts:126` `parkOverdue` (`PARK_COLLECTION_MINUTES=30`) は子が開いていると hold のままで期限を評価しない
- guard は人のコメントを protected/parked として削除 → 人が介入するにもノートが消える形になりがち (旧 #462 の観測と同じ)
- 「エージェントが進行できず、人にも通知が来ない」の実体

### 経路2: 集約 dispatch 失敗後の孤立親 (失敗後何も再試行しない)
- 全子が閉じたあとの集約が `gh workflow run` 失敗すると marker は外れるが、
  次 close イベントを起点にしない → 親が孤立 (旧 #7 / #30 と同型)
- `src/app/aggregation.ts` の `dispatch-failed` / `undetermined` 結果型あり、`needsAttention` はあっても
  通知の扱いは各 caller 任せ (aggregate_sub_issues.ts の `process.exit(1)` は赤 run を作るだけ)

## 既存の守り (調べた範囲で現行有効)
- #351: create_pr は dispatch 失敗時に session を開いたままにする (GM の事故は自力で復帰可能)
- #620 PR マージ済み: red 判定でも呼び出しが待っていれば agent 起動。通知削除。
- run watch (`reconcile_run_ending.ts`): workflow_run 完了時の claim/park 未報告 run の通知。

## 前例
- #462/#469: schedule 化された stale sweep が過去に存在 (`sweep_stale_locks.ts` + `stale-sweep.ts`)。
  現行 `src/workflows/atomaton-run-watch.wac.ts:39` の docstring: scheduled sweep は削除済み
  (追加の定期ジョブとして restoring will need a decision)。
  ※判定 domain (`src/domain/work/stale-lock.ts`) は現行ツリーに残っていて共通判定として使える。

## 対応案 (2案ベース + 1 optional)
1. `stale-lock.ts` の park 判定に「子 run の生死確認」を追加し、子 run が死んでいる場合は
   warn + 通知行を出す。既存 judge 共有のため小さく済む。
2. 集約 dispatch 失敗時に marker を外したまま人に通知し、再試行可能にする。
   通知先は `resolveNotify(repo, parent)` が使える。
3. (optional) scheduled sweep の復活。ただし現行 docstring には削除理由つき。
   判定 domain は `stale-lock.ts` に残っている。

## 未確認
- `.github` の稼働済み機構が `src/` の直近マージ (#620) を反映しているか
- #616 の事故 run のログファイル
- `rounding: 子 run の死そのもの (`claim_turn` が子側で拾うか) の再読 (worker run が死ぬと guard が
  繰り返し削除するのは #462 で出てきた話。現行ガードとの整合も要確認)
