# 設計書サンプル: 添付層の通し実験（issue #166）

これは issue #166 の通し実験で使う設計書原稿のサンプル。#111 で作られた
`docs/design-doc` スキルの手順を 1 通、端から端まで通すための実物。

## 1. この設計書の目的

添付層（attachments サーバー）の 3 層 — 原稿（Markdown）、原本（docx / xlsx）、
閲覧用（PDF）— を 1 つの文書で通し、3 つの blob URL を issue のスレッドに貼れる
ことを確かめる���品質評価は目的ではない。手順が再現できることだけが目的。

## 2. 決定の経緯

uploads endpoint は Actions トークン（`ghs_`）からの実アップロードを全面的に
拒否する。#111 の run で、body 付き POST がサイズ（5B〜27MB）にも MIME にも
依存せずすべて 404 だったことが実測されている。このため添付層の資格情報として
は、orphan ブランチへの publish（B 案）が決定された。

| plan | 案 | 決定 |
| --- | --- | --- |
| A | PAT を tools.secrets に入れる | 否 |
| B | orphan-only（publish_draft 経由） | 採用 |
| C | リリース asset に添付 | 否 |

## 3. 構成

- 原稿はこの Markdown 1 通と、表の CSV 副ファイル。
- 原本は generate.mjs が原稿���ら生成する（docx と xlsx）。
- 閲覧用は docx から変換した PDF。

## 4. 検証項目

1. publish_draft で原稿（md + CSV）が orphan ブランチに載ること。
2. generate.mjs が原稿から原本と PDF を生成すること。
3. 生成物（binary）が publish_draft のもう 1 度の呼び出しで同じ orphan
   ブランチに載ること。これが本実験で新たに確かめる本体。
4. 3 層の blob URL が報告形式どおり（原稿 → 原本 → PDF）で並ぶこと。

## 5. 想定読者と成功条件

想定読者は、スキルを読んだだけの次の run。成功条件は、その run がこの原稿を
同じ手順で 3 つの blob URL に到達させられること。途中の層で失敗した場合は、
その失敗の記録それ自体が成果物になる。
