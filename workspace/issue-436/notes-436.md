# Issue #436 調査ノート (2026-11-08 run)

## 確定した事実

### 1. compaction はシステムプロンプトを保持しない(設計認識との差分)
- atoma コア `src/domain/context_budget.rs:135-178` `compact()` — messages[0] (system) を含む全リストを `[user(注記+要約), ...直近ターン]` に置換
- 再挿入は run 開始のみ `src/application/runner/mod.rs:437-439` (retain + insert(0, system))。run 内で compaction が起きると、その run の残りはシステムプロンプトなし
- 直近ターン保持(RECENT_SHARE=1/3)・要約側への前提伝達(SUMMARY_PROMPT :101-107)・継続側への注記(compaction_notice :88-93)は認識どおり実装済み
- 記録された設計 (yuma-seno/atoma#12 クローズコメント, PR #13) にはシステムプロンプトへの言及なし → 実装は記録と整合、認識と不整合
- テストは user/assistant/tool しか作らないので未カバー (context_budget.rs:203+ のヘルパ)

### 2. 実走の証拠 (atomaton-data ブランチ, 2026-11-08 時点)
- 判定方法: jq で `.content | startswith("[session compacted: the ")` (単純含有だと調査ツール結果の引用まで拾う)
- 実際の通知を持つセッション 31件
- うち **9件が現在も通知@idx0 = システムプロンプトなしのまま保存された状態**:
  - issue-364/engineer (23 msgs), issue-410/engineer (30) + reviewer (24), issue-424/engineer (31), issue-449/reviewer (99), issue-462/engineer (224), issue-96/engineer (21), pr-474/reviewer (264), pr-477/reviewer (261), pr-463/archive/engineer-1 (341, recoveryでアーカイブ=破棄して再開)
  - 数字 = compaction 後に追加されたメッセージ数を含む総数。compaction 後の残りランがそのままシステムレスで走った
- システムプロンプト実測: atomaton 41,173文字 / engineer 36,470文字 (issue-436/atomaton.json, issue-420/engineer.json の messages[0].content)
- 通知+要約メッセージは engineer で ~5.3-5.9KB — 要約自体は機能している
- issue-436 自身のセッションに実際の通知は 0 (4件は前回調査のツール結果の誤一致)

### 3. 要約推論の usage がどこにも載らない
- `src/application/runner/execution.rs:408-422` — compact_session が response.usage を読み捨て
- facts への加算はメインループのみ (:875-920)、last_prompt_tokens も (:908) → 再 compaction ループは無い(1超過=1回)
- 読み手: post_result_comment.ts:217-227 / atomaton-runner.wac.ts:1257-1267 / token-line.ts / envelope report.rs:200-220 — 全部 ATOMA_TOKEN_USAGE 由来
- tools=None 維持のため compaction 1回 ≈ キャッシュなし ≳200k プロンプトトークンが未計上。実走 31回以上 → ≳6M トークンの下限(現存データのみ)

## 修正の方向性 (いずれも atoma コア側・小さい)
1. compact() が role=="system" の messages[0] を保持 (out = [system, notice+summary, ...kept]) + 通知のカウント調整 + system を含むテスト
2. 要約推論の usage を facts.usage に加算 (または専用ログ行)

embedder 側緩和は不可能: hook はメモリ上のセッション置換前に呼ばれるのみ、ファイル編集は上書きされる、compaction は拒否不可 (fail-open)

## 再現コマンド
```
git clone --depth 1 https://github.com/yuma-seno/atoma /tmp/atomaton-workspace/atoma-src  # HEAD 3f56a92 = v0.4.4
git clone --depth 1 -b atomaton-data https://github.com/yuma-seno/atomaton /tmp/atomaton-workspace/atomaton-data
```
(データクローンは ~180MB なので調査後削除すること)
