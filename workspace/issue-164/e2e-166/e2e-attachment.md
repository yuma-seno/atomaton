# 添付経路の実測サンプル — B（orphan-only）

これは attachments 層の通し実験 (#166 / #164) のために書かれたサンプル設計書で、
内容そのものが実験の記録になっている。

## 決定

2026-10-13、#164 で資格情報の方針は **B（orphan-only）** に決まった。
uploads endpoint は Actions トークン（`ghs_`）からの body 付き POST を、
サイズと MIME によらず 404 で拒否する（#111 の対照実験）。PAT を新たに
出す代わりに、原稿・原本・PDF をすべて orphan ブランチに置く。

## 3 層の行き先

この文書が実際に通った経路が、次の表のとおり。

!table tables/layers.csv

## 確かめたこと

- 原稿（この Markdown と CSV）が `publish_draft` で orphan ブランチに載ること。
- `generate.mjs` が原本（docx / xlsx）と PDF を生成すること。xlsx は
  上の CSV を 1 シートとして持つ。
- **生成物（バイナリ）も `publish_draft` で同じブランチに載ること** —
  これが #166 の時点で未実測だった脚。
- 報告が 3 本の blob URL（原稿 → 原本 → PDF）で閉じること。
