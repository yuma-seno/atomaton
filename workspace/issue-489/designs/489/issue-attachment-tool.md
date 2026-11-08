# 設計検討: エージェントによる Issue 添付ファイルのアップロード

- 起 案: #489(エージェントが画像や動画を添付できるようにする)の設計フェーズ
- 日 付: 2026-11-08
- 状 態: 起案者の承認待ち。承認後、実装は 1 本の PR(src/** への変更)になる見込み

## 1. 何をしたいのか

エージェントの報告コメントや、起票する Issue/PR の本文に、画像・動画(およびそれ以外のファイルも)を GitHub のネイティブ添付(`https://github.com/user-attachments/...`)として直接載せたい。現行の `publish_draft` のような「専用ブランチに載せてリンクを貼る」方式ではなく、人がドラッグ&ドロップしたときと同じ形で添付する。使えない形式はツールがエラーにする。

`publish_draft`(設計書 → orphan ブランチ)はこれからも設計書向けに使う。本設計は会話の中の証拠・資料向けの補完であり、置き換えではない。

## 2. 調査で確認した事実

### 2.1 GitHub 側(公式ドキュメント、2026-11-08 時点で取得)

出典: docs.github.com「Attaching files」/「Attaching files with GitHub CLI」

- **GitHub CLI に公式の `--attach` フラグが存在する**(gh issue create/edit/comment、gh pr create/edit/comment)。CLI がアップロードし、本文中のローカルパス参照をアップロード済み URL に書き換える。
- 対応形式(レンダリングされるメディア): `.png` `.gif` `.jpg` `.jpeg` `.svg`、動画 `.mp4` `.mov` `.webm`
- その他の添付可能形式(コメント内): `.pdf` `.docx` `.pptx` `.xlsx` `.xls` `.xlsm`、OpenDocument 各種、`.rtf` `.doc`、`.txt` `.md`、`.csv` `.tsv` `.log` `.json` `.jsonc`、主要コードファイル、`.zip` `.gz` `.tgz`、`.mp3` `.wav`、`.bmp` `.tif` `.tiff`、`.eml` など(ドキュメントに許可リストとして明記)
- サイズ上限: 画像 10MB / 動画 10MB(free プラン)・100MB(paid プラン)/ その他 25MB

### 2.2 gh の実装から読み取ったアップロードの形(cli/cli trunk、2026-11-08 時点で取得)

`internal/attachments/client.go` より。gh が実際に行うのは **1 リクエストのトークン認証アップロード** である:

```
POST https://uploads.github.com/user-attachments/assets
     ?name=<ファイル名>&content_type=<MIME>&repository_id=<リポジトリの数値ID>
Authorization: token <GH_TOKEN>
Content-Type: application/octet-stream
Accept: application/vnd.github+json
<ファイル本文>

→ 200 {"url": "https://github.com/user-attachments/assets/<id>"}
```

- `repository_id` は REST の数値 id(`GET /repos/{owner}/{repo}` の `id`)
- エラー: **404 = 書き込み権限がない(このエンドポイントは 403 ではなく 404 で答える)**、422 = ファイル自体の拒否(サーバーのメッセージが付く)、429 = レート制限(`Retry-After` 付き)
- gh 2.103.2(2026-10)で「どの GitHub App インストールトークンが添付できるかはサーバー側が裁定する」方式に変更済み(client 側のトークン種別チェックを削除。PR cli/cli#14804, #14805)
- **アップロードは取り消せない**(gh のコードに「no endpoint to delete one」と明記あり)

### 2.3 このリポジトリ側の現状

- 実行時の `GH_TOKEN` は `${{ github.token }}` = github-actions[bot] の GitHub App インストールトークン(`src/workflows/atomaton-runner.wac.ts:354` ほか)
- `attachments` MCP サーバ(`src/entrypoints/tools/mcp/attachments.ts`)は現在、**どのツールもトークンを送らない**(fetch は匿名、push は checkout の .git/config の資格情報。`src/entrypoints/tools/defaults.yaml:168-171` のコメントがその境界を明示している)
- `shell` からは `gh` も `curl` も拒否される(shell_guard)。ファイルの入出力はツールサーバの仕事という既存の設計判断と整合する
- テストの型: `tests/contract/attachments-fetch.test.ts` — 契約関数のエクスポート + ローカルスタブサーバでの形状検証。遠端の実測値は Issue スレッドに記録する運用

## 3. 方式の比較

| 方式 | 評価 |
| --- | --- |
| **A. uploads.github.com エンドポイントの直接呼び出し** | **推奨。** gh が公式に使う経路そのもの。1 リクエスト、トークン認証、URL だけを返せる(コメント投稿と結合していない)。gh が非メディアをクライアント側で拒否しているだけなら、エンドポイント自体は Web UI が PDF 等を載せる総合窓口のはず → 実機確認の対象(§7) |
| B. `gh issue comment --attach` をツールサーバから起動 | コメント投稿と一体化しており「URL を返す」契約に合わない。非メディア不可。gh バイナリの存在・バージョンに依存する。却不採用 |
| C. Release 資産(公式 API) | 動くが、Releases ページが汚れ、動画がプレイヤーでレンダリングされない恐れ、資産の削除ポリシー管理が発生する。**トークン裁定で A が拒否された場合の予備案** |
| D. 旧 web フロー(/upload/policies/assets 3 ステップ、セッション Cookie) | API トークンでは呼べない(2024 年時点の知見)。ユーザーセッション Cookie をエージェントに持たせるのは資格情報クラスとして最悪。不採用 |
| E. Gist | 非公開リポジトリの内容が gist 側に出る、動画がレンダリングされない。不採用 |
| F. publish_draft(現行) | 起案者が会話用途として却下した方式。設計書用途では現行のまま |

## 4. ツール設計

`attachments` サーバに第 3 のツール `attach_file` を追加する(fetch_attachment / publish_draft と同居)。

### 4.1 スキーマ

```yaml
attach_file:
  files:              # 1..N。publish_draft と同じ配列形式
    - path: string    # チェックアウト内の相対パス、または /tmp 配下の絶対パス
                      # (resolveDraftFiles と同じルール)
      name?: string   # GitHub に渡すファイル名。既定は path の basename
      alt?: string    # 画像の代替テキスト。動画には指定不可(gh と同じ)
```

### 4.2 戻り値(射影。API 応答は丸ごと返さない — write-a-tool.md の規則)

```yaml
files:
  - path: ...        # 呼び出し元が渡したパス(そのまま)
  - url: ...         # https://github.com/user-attachments/assets/<id>
  - markdown: ...    # そのまま貼れる形
  - contentType: ...
uploaded: 2          # 成功数
```

`markdown` の形(gh の実装に合わせる):

- 画像: `![alt](url)`(alt 未指定時はファイル名から拡張子を除いたもの。gh の alt エスケープ規則を踏襲)
- 動画: URL 単体(段落の唯一の内容のとき GitHub がプレイヤーに昇格する。ツールの説明文にこの規則を書く)
- その他: `[name](url)`

### 4.3 バリデーション(アップロード前に全部済ませる)

gh が明言する通り**アップロードは取り消せない**ため、1 件でも検証を通らないファイルがあれば何もアップロードしない(all-or-nothing)。

- 拡張子許可リスト: §2.1 のメディア + 追加形式(コード内の表として持つ。`svg` を含む — ドキュメントが対応形式として明記しており、レンダリングは GitHub 側でサニタイズされる)
- 未対応拡張子 → エラー。メッセージには対応形式の一覧を載せる(起案者の要件「利用できないファイル形式の場合はエラー」)
- サイズ: 画像 10MB、動画は上限 100MB まで送ってサーバーに裁定させる(gh と同じ判断。free プランの実際の上限 10MB を超えた場合は 422 のサーバーメッセージが返る)、その他 25MB
- 空ファイル、ディレクトリ、通常ファイル以外 → 拒否(gh と同じ)
- 拡張子のみを見て中身は検査しない(gh と同じ判断 — エンドポイントが取り違えを握るため)。この割り切りはコードに書き残す

### 4.4 エラー対応

| 状況 | ツールの振る舞い |
| --- | --- |
| 検証不合格 | アップロード前に全件拒否。どのファイルの何が悪いかを名指し |
| 404 | 「書き込み権限がない、またはこのトークン種別がエンドポイントに許可されていない(gh 2.103.2 以降はサーバー裁定)」の両方を名指す。§7 の確認手順への言及を添える |
| 422 | サーバーのメッセージをそのまま通す(形式・サイズの拒否はここに出る) |
| 429 | `Retry-After` を付けて報告。自動リトライはしない |
| 部分的失敗 | 最初の失敗で打ち切り(gh と同じ)。成功済みの URL は返す(取り消せないため捨てない) |

### 4.5 実装上の付随事項

- アップロード先ホストは `https://uploads.github.com` にハードピンし、リダイレクトは追わない(3xx はそのまま報告)。返ってきた URL も、既存の `attachmentUrlAllowed` と同じ 2 ホスト許可リストで検査してから返す
- repository_id は `GET /repos/{owner}/{repo}` から取得(トークン使用はこの 1 回とアップロードのみ)
- ファイルは読み込まずストリームする(fetch に body を渡す。100MB を想定)

## 5. 認証と境界

- この変更で `attachments` サーバは**初めて `GH_TOKEN` を送る**ようになる(送信先は `uploads.github.com` の 1 ホストのみ)。既存の `env:` ルーティングにより shell には渡らない
- 併せて更新する境界の記述: `defaults.yaml` の「neither tool sends it」コメント、`docs/tools/reference.md` のサーバ表の credential 列、`docs/tools/how-it-works/routing-a-credential.md` の該当段落
- 孤児資産: アップロードだけして使われない URL は削除できないため、検証はすべてアップロード前に置く(§4.3)

## 6. 実装で触るファイル

1. `src/entrypoints/tools/mcp/attachments.ts` — ツール本体(バリデーション表、markdown 生成、エラー対応は export してテストから契約検査する)
2. `src/entrypoints/tools/defaults.yaml` — ツール説明(どの markdown を返すか、動画の段落規則を含む)と GH_TOKEN コメントの更新
3. `docs/tools/reference.md` + `src/content/README.md` — サーバ表の更新
4. `src/content/agent-definitions/atomaton.md` / `engineer.md` — attachments のコメント行に attach_file を追加(機械的)
5. `tests/contract/attachments-attach.test.ts` — `attachments-fetch.test.ts` と同じ型: 許可リスト、サイズ表、markdown 形状、エラー対応、URL ホスト検査。遠端の実測値は本 Issue のスレッドに追記する運用

machinery 側の変更は不要。エージェントは戻り値の URL/markdown を、最終報告・`create_sub_issue`/`create_root_issue` の本文・`create_pr` の本文に埋め込むだけでよい。

## 7. 検証計画

**PR 内でできること(形状検証)**: stub に対する契約テストのみ。リクエストの形、パラメータ、応答の読み方、エラー対応表。遠端の実挙動は PR 内では検証できない — shell に資格情報は届かず、fetch は Authorization ヘッダを送れないため。この理由は PR の本文にも書く(次の読み手に再発見させないため)。

**マージ後の実機チェック(ツール自身の最初の実呼び出しがそのままチェックになる)**:

- 送るもの: 1KB 程度の `.png` 1 枚 + `.txt` 1 つ(非メディアの可否確認)
- つくれるもの: user-attachments の資産 2 件。**削除 API が存在しないため残る**(GitHub 側の GC の有無は未確認)
- 設計が正しいことを示す答え: 200 と `{"url": "https://github.com/user-attachments/assets/..."}`
- 設計が誤っていることを示す答え: **404** — github-actions[bot] のインストールトークンがエンドポイントの裁定で拒否された場合。このときの予備案: このリポジトリ限定・期限付き・contents:write のファイングレイン PAT をリポジトリシークレットに置き、`tools.secrets` 経由で attachments サーバの `env:` にのみルーティングしてこちらを使う(gh の旧許可リストでは PAT は常に対応)。予備案の実装は本体とは別の小さな PR になる

## 8. 起案者に確認したいこと

1. **方式 A での実装許可**。実機確認(§7)はマージ後にしか行えず、その呼び出しは削除できない資産を 2 件作る — この進め方の承認を含む
2. エラー時に「対応形式一覧」を出す仕様(§4.3)でよいか。より厳しく(例: メディアのみ許可)する場合は許可リストを詰めるだけでよい
3. ツール名 `attach_file`(候補: `attach_files` `upload_attachment`)

---
*本書は `publish_draft` により `business-docs` ブランチに公開される。議論は #489 のコメントで行う。*
