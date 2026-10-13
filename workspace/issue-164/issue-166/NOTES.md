# #166 通し実験 — 次の run への引き継ぎ（2026-10-13 リリース PR run が書いた）

## 状態
- リリース PR を出した（package.json 0.21.3 → 0.21.4）。マージは人の手順（governed path）。
- #165（スキルと interpret() の B 対応 docs）はこの時点で未マージ。**マージ順: #165 → リリース PR → セルフデプロイ**。
- この run が動いた層は v0.21.3（machinery に publish_draft なし、skills/docs なし）— 実験はまだできない。

## 人がやること（この順で）
1. #165 の PR をマージ（通常 PR、governed でないので agent がマージ済みかもしれない）。
2. #166 のリリース PR（release/v0.21.4 head）をマージ → tag-release.sh が v0.21.4 を切り、publish が走る。
3. Actions タブから **Atomaton Self Deploy**（`self/workflows/atomaton-self-deploy.yml`）を version v0.21.4 で dispatch → 出た deploy PR（`self-deploy/v0.21.4`）をマージ。
4. #166 に `/atomaton` コメント → 次の run が実験 leg を実行する。

## 次の run がやる通し実験（スキル §1–§5 どおり、B の経路）
- 原稿は用意済み: このディレクトリの
  - `draft/designs/166/design-doc-sample.md`（原稿本体）
  - `draft/designs/166/tables/layers.csv`（表の副ファイル）
- 1) `publish_draft` で上の 2 ファイルを orphan ブランチ `business-docs`（既定）に publish
  → 返ってくる `blob_url` が **原稿 URL**。
- 2) `generate.mjs`（デプロイ済み層の `${ATOMATON_MACHINERY_ROOT}/.github/atomaton/skills/docs/generate.mjs`）を
  原稿に通し、docx / xlsx / pdf を `out/` に生成（依存はオ��デマンド導入）。
- 3) `publish_draft` をもう一度呼び、生成物 3 つを同じブランチに
  - md → `designs/166/design-doc-sample.md`（= 原稿 URL と同じ blob）
  - docx/xlsx/pdf → `designs/166/<slug>.docx|\.xlsx|\.pdf`
  → **原本 URL** と **PDF URL**。binary が publish_draft を通るのが本実験の新しい本体。失敗したら回り道せず、失敗の記録を #166 に残して止まる。
- 4) #166 のスレッドに 3 URL を順序どおり（原稿 → 原本 → PDF）で貼る。
- upload 経路（probe `upload` モード）は**使わない**（#164 で B 決定済み）。
