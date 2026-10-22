/engineer

#264 の決定コメント（[issuecomment-6338484800](https://github.com/yuma-seno/atomaton/issues/264#issuecomment-6338484800)）どおり、base ブランチを自ブランチに取り込む MCP ツール `merge_base_into_branch` を **1本の PR** で実装する。範囲: ツール本体 + `commit_and_push` の merge 中間状態チェック + reviewer/engineer 定義の `sync_branch` 経路修正 + docs + 版 0.21.24 + ユニットテスト。

<details><summary>スコープ・制約・検証（実装地図つき）</summary>

## スコープ

1. **新ツール `merge_base_into_branch`** — `src/entrypoints/tools/mcp/github.ts` の `buildMcpTools([...])`（:1624）に `defineMcpTool` 1件追加、zod schema は既存の隣（CREATE_PR :264 / SYNC_BRANCH :292 / COMMIT_AND_PUSH :296）。ツール名の roster（tools.yaml 等）は不要 — github server に `tool_allowlist` は無い（`src/entrypoints/tools/defaults.yaml:97`）。挙動:
   - base 解決は `create_pr` と**同一経路を共用**: `github.ts:914` の `stackedPrBase(REPO) ?? getBaseBranch()`（`src/adapters/github/branch-placement.ts:221`、`src/adapters/runner/config.ts:88`）。
   - base を fetch → すでに HEAD の祖先なら `{status: "up_to_date"}`。
   - 2-way merge（rebase / force-push なし）。衝突なし → merge commit を作って push、`{status: "merged", base_sha, commit}`。衝突あり → **commit せず** worktree に conflict marker を残して `{status: "conflicts", files, base_sha}`。
   - push は `commit_and_push` と共通経路。現状は inline（`logOp("commit_and_push")` :1108、PR lookup + `dispatchPrValidation` :1139）なので **共用関数に括り出す**（コピーしない — 決定コメントの明示条件）。ops log 本体は `src/adapters/runner/ops-log.ts:23`。
   - 全結果（up_to_date / merged / conflicts / 失敗）を `logOp("merge_base_into_branch", ...)` に残す。
2. **`commit_and_push`**（`github.ts:1066`）: `MERGE_HEAD` ありで未解決パス → 拒否して未解決ファイルを列挙。全部解決済み → merge commit として閉じる（メッセージに取り込んだ base と sha）。
3. **shell_guard**（`src/entrypoints/tools/hooks/shell_guard.ts`）: raw `git merge` は引き続き不可。routed 拒否文（:311）に新しいツール名を書いて経路案内を真にする — これは決定コメントには明示がないが issue 本題（「github tools を使え」と案内するズレ）に対応する1行。`MUTATING_GIT_COMMANDS`（:224-228）・`ROUTED_GIT_COMMANDS`（:172-175）の**リスト自体は変更しない**。
4. **プロンプト経路** — `sync_branch` は自ブランチの origin fast-forward 専用、base 取り込みは新ツール、という修正を 3箇所: `src/content/agent-definitions/reviewer.md:143`、`src/content/agent-definitions/engineer.md:140`、`src/domain/delivery/merge-readiness.ts:326,332`（check_merge_readiness が返す "call sync_branch" blocker 文面。こちらも同じ誤り）。
5. **docs**: `docs/work/how-it-works/the-branch-a-run-commits-to.md` を中心に決定の構造を書く（base は親ブランチ1本 / 取り込みは各ノードが自分で引く / 連鎖も cross-node write も無い）+ #186 へのリ��ク（この道具で解ける）。docs/ はリポジトリ固有文書で template に含まれない — `src/content/` に置かない。
6. **版**: `package.json` → **0.21.24**。

## 制約

- **1ノード・1ブランチ**: カスケード、他人のブランチへの書き込み、rebase/force-push はしない。readiness への「版の後退」検査は足さない（決定で却下済み）。
- **ツリーの規則**（`self/atomaton/skills/project/` の conventions）: ツール実装は `src/**` のみ。**`.github/atomaton/agent-definitions/` は編集しない** — 実行コピーであり、src/content の変更はリリース + self-deploy で届く。`self/` に agent-definitions は無いので overlay ペア問題にはならない。
- **governed paths**: `package.json` は `merge.governed_paths`（`.github/atomaton/config.yaml:85-111`）に入っている → 版バンプのある本 PR は **person がマージする**（正常系であり、ブロッカーとして潰さない）。また `merge-readiness.ts` を触ると merge gate（同 :106、'Read it before merging'）が発火する — 期待された動作、回避しない。
- **版の順序**: PR #274（0.21.23、現時点 open）が**先にマージ**されること。本 PR を先にマージすると 0.21.24 のリリースが 0.21.23 を追い越し、#271 の修正が取り残される。後にマージされる場合の package.json 1行衝突は 0.21.24 側に解消する。
- `dist/**` は gitignored 生成物。触らない（`bun run synth` による検査は可）。
- 衝突の中身（`package.json` の版を含む）の判断は agent に任せる — ツールがどちらかの版を機械的に選ばない。

## 検証

- **ユニット**（`src/entrypoints/tools/mcp/mcp.test.ts` の形式 — サーバ spawn + JSON-RPC。test スクリプトは mcp と hooks の dir をすでに網羅）: (a) 衝突なし → merge commit + push、(b) 衝突 → commit せずファイル列挙、(c) up_to_date、(d) MERGE_HEAD + 未解決で `commit_and_push` が拒否 / 解決済みで merge commit として閉じる。guard 文面は `shell_guard.test.ts`。
- `bun run typecheck` / `bun run test`（CI の `verify` は scan_secrets + typecheck + synth + test）。
- **実測**（#269/#272 形: main が進んで package.json 1行衝突をこの道具で解く）��� **PR の外**。ツールが live になるのはリリース + self-deploy 後であり、マージ後に issue 側で子ブランチで行う。

## close condition

上記ユニット (a)-(d) + typecheck/test が緑の PR が開き、CI の `check` が通ること。PR のマージ（person）後、#264 側で受入確認と実測を行い、#264 を閉じる。

</details>

**結論**: 決定済みの仕様は 1 engineer-ready leaf として成立するため、engineer に1本の PR として渡した。sub-issue は作らない（親をなぞる子になりスコープも減らない）し、architect も不要（構造・範囲・検証は決定コメントにすべて書かれている）。

**根拠**:

- 決定コメント [issuecomment-6338484800](https://github.com/yuma-seno/atomaton/issues/264#issuecomment-6338484800)（全項目・検証・やらないこと）
- 実装地図は有料 delegate の実測: base 解決 `src/entrypoints/tools/mcp/github.ts:914`、`commit_and_push` :1066 / push 経路 inline :1108-1139、registry :1624、`src/adapters/runner/ops-log.ts:23`、guard :224-228 と :311、`src/content/agent-definitions/reviewer.md:143` / `engineer.md:140`、`src/domain/delivery/merge-readiness.ts:326,332`
- governed paths に `package.json`、merge gate は `merge-readiness.ts` 等に発火（`.github/atomaton/config.yaml:85-111`）
- PR #274（0.21.23）は open、main は 0.21.22、checkout は main と同期（ahead/behind 0）

**確立できなかったこと**: free delegate は `402 free_quota_exhausted` で起動できず、パスマップは paid delegate で取得した（quota 枯渇はツールの欠陥ではなく、issue も立てない）。synth 時の tools-file が allowlist を schema 検証するかは未確認 — github server に allowlist が無いため無関係のはずと delegate が報告。実測検証はツールが live になる（リリース + self-deploy）まで実行不能で、この run では確認のしようがない。

**次に何が起きるか**: engineer が実装・検証し PR を開く（reviewer 指定）。governed path のため person がマージし、その後この issue に再介入して受入確認と実測（子ブランチで #269/#272 形を再現）を行い、#264 を締める。
