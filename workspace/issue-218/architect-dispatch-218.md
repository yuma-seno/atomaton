/architect

Issue #218(記憶の機構)のうち、エージェントが記憶を書き込む経路と、そこから出るPRのガバナンスの形を決定してください。実装は始めないでください。返すのは決定の文章だけです。

決めるべき点は次の五つです。

1. 置き場所と保存の保証: .github は upgrade で位置ごと置き換わり、このリポジトリの self-deploy は `rm -rf .github` から始まります。記憶をどこへ置き、このリポジトリと採用者環境の両方で消えない保証をどの経路に置くかを決めてください。
2. 除外の記法: governed_paths 自身の記法の中で除外を表現できるようにする設計を決めてください。「memory」を特殊パス名として扱う形は却下済みです。現状のマッチャーは include-list 固定で、`!` 始まりは検証を黙って通ったうえで何にも一致しない欠陥があります(#551)。
3. レビューの置き換え: 記憶PRは `policy: auto`(CI通過後にマージ)を前提にします。人の関与を「毎回のマージ」から何へ置き換えるか——定期監査、revert手順、サイズと頻度の上限、書き手の明示——を具体で決めてください。記憶は全エージェントのプロンプトに流れ込むため、書ける者は自分の指示を書ける状態になります。
4. 注入: 既存の `--template` 受渡しで、実行ごとに生成したテンプレートコピーの末尾に記憶の節を足す形が最有力です。この形で良いか、記憶を single file にするか directory にするか、サイズ上限を決めてください。
5. 書き込みツールの形: publish_draft と同じ refspec 直push型で、base から切って base へ向ける standalone PR を出します。対象を記憶ファイルだけに絞るか、.github 全般に開くかを決めてください。前提は「.github は一般に governed のままであるべき」です。

外形そのものが重いと判断する材料が出たら、その理由も決定の文章に書いてください。再検討は #218 のスレッドで扱います。

決まっていることは次の通りです。

- 記憶を作る方向は #218 スレッドで合意済みです。スキル経由は却下(PR を出してマージされるまで効かない、強制注入もできない)。
- 記憶の対象は .github 配下のファイルです。self フォルダは本リポジトリが独自に持つものなので、機能の対象から外れました。
- 記憶PRは通常のIssueツリーと独立したPRとして作られます。作業中の run の worktree は触りません。
- `policy: auto` への変更は commit 85799ff としてこの issue ブランチに既に存在します。main には未達です。
- 作業ログは記憶に入れません。スレッドとセッション JSON の仕事です。
- 記憶への書き込み頻度はかなり低いというユーザーの見込みです。軽さが必要なのは、書く機会が自然に現れないからです。

ここまでで確定できなかったことが二つあります。

- core(atoma 本体)が末尾差し替え後のテンプレートをどうキャッシュするかは、binary 挙動なので未検証です。
- 3. の締め方について、実装コストの裏付けは取っていません。締め方が重いほど何が増えるかを、決定の文章の中で対応づけて書いてください。

<details><summary>経緯とファイルの根拠(行番号つき)</summary>

スレッドの流れ(#218 本文と、その後のやり取りからの要点):

- 動機はスレッドの一文をそのまま引用します。「プロンプトの修正を出すタイミングがない。依頼された指示に対する PR に混ぜるのはおかしいし、別のIssueを切るのは重すぎる」。
- ユーザーの発想の原型は「base ブランチのファイルを直接編集できるツールを追加する」でした。CI を回す前提のレビューとマージの扱い、作業中の run のファイルを触らない前提は、その後のやり取りで整理されました。
- 修正事項: self フォルダは本リポジトリが独自に用意するもので採用者にはない → 対象を .github 配下へ。.github 配下は governed のままであるべきで、記憶の修正を毎回人がレビューする形は避けたい、という両立が要件です。
- 却下済みの形: governance から外すときに、道具側が「memory」という特殊パスを受け取る設計。記法の中で表現する形へ置き換えたいという指示がユーザーから出ています。

このチェックアウト内での実装の事実:

- governed_paths: スキーマは src/domain/delivery/declared-config.ts:86(文字列のみ、object は拒否)。既定は src/domain/delivery/merge-readiness.ts:289 の `DEFAULT_GOVERNED_PATHS = [".github/**"]`。読み込みは src/adapters/runner/config.ts:185 で、明示的な `[]` はゲートの無効化になります。効果は merge-readiness.ts:512-531 の `governance-change` blocker(「調査と報告はして、merge は人に」)。merge-signals.ts:378-383 が governancePaths を詰めます。
- マッチング: src/domain/delivery/path-patterns.ts:26 — リテラルか `dir/**` のみ。glob文字の拒否リストは同 :37 `/[*?[\]{}]/` で `!` を含まず、`!.github/**` は検証を通ったまま何にも一致しない(#551 に証拠つきで切り分け済み)。
- merge.policy: declared-config.ts:85(`"auto" | "manual" | string`)。現行値: .github/atomaton/config.yaml:85 が `auto`。テンプレート側 src/content/config.yaml と自己配置 self/atomaton/config.yaml:85 も同一状態です。
- プロンプト組み立て: atoma 本体が組み立てます。src/entrypoints/machinery/lib/atoma-launch.ts:57-61 が `--agent-def` `--template` `--skills-dir` を渡します。語彙は固定で `{{AGENT_NAME}} {{AGENT_ROLE_PROMPT}} {{AVAILABLE_SKILLS}} {{COLLEAGUES_LIST}} {{LOAD_SKILL_TOOL}} {{WORKING_DIRECTORY}}`。プロジェクト側がプレースホルダーを足せない理由は src/entrypoints/machinery/inject_dispatcher_notice.ts:9-15 に記載があり、`{{MEMORY}}` を使う模造テンプレートは `atoma validate` が拒否します。テンプレート本体は src/content/prompt-template.md(484行、末尾が {{AGENT_ROLE_PROMPT}})。inject_* 系(src/workflows/atomaton-runner.wac.ts:2102 など)は user メッセージの追加であって、システムプロンプトそのものではありません。
- run開始時の読み込み: src/domain/machinery/machinery-layout.ts:62/86/89/92/95(USER_ROOT, CONFIG_FILE, AGENT_DEFINITIONS_DIR, PROMPT_TEMPLATE, SKILLS_DIR)。config は src/adapters/runner/config.ts:26 と :40-45。起動呼び出しは src/workflows/atomaton-runner.wac.ts:914。tools file の生成は runner.wac.ts:869 から src/domain/machinery/tools-file.ts:92-114。
- self/: .github/workflows/self-deploy.yml:159-177 が `rm -rf .github` の後に self/. を .github へコピーします。契約テスト tests/contract/self-overlay.test.ts:70-72 と tests/contract/deployed-config.test.ts:37 が一致を見るため、このリポジトリで記憶ファイルを置くなら self/ 側に双子が必要です。採用者側の upgrade が新規ファイルを消すかどうかは、このツリーの情報では確定していません。
- refspec 直push型の既存実装: publish_draft は src/entrypoints/tools/mcp/attachments.ts:1344 で本体、push は :1459 `git push origin <sha>:refs/heads/<branch>`。worktree は触りません。配置済みの写しは .github/atomaton-runtime/tools/mcp/attachments.ts:18694-18742。
- ツール登録: declared-config.ts:150-177 の tools.servers に、プロジェクト独自の MCP server をフルエントリーで足せます。shipped 名は field-by-field 上書き(src/domain/machinery/tools-file.ts:104-114)。設定例は docs/tools/tasks/let-a-tool-server-reach-something-outside-github.md:24-31。`hooks` は予約名(tools-file.ts:232)。
- 関連の既存Issue: #390(新しいツールを本物の secrets で事前検証する経路が無い)。記憶ツールも新ツールなので、この経路の論点に触れます。

</details>
