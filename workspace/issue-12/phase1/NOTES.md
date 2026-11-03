# フェーズ1 実測メモ（issue #232）— 再現手順と落とし穴

LibreOffice 25.8.7 / Ubuntu 26.04 runner / root なし。

## 導入（tarball + dpkg-deb -x）
```
curl -sSL -o lo.tar.gz https://download.documentfoundation.org/libreoffice/stable/25.8.7/deb/x86_64/LibreOffice_25.8.7_Linux_x86-64_deb.tar.gz   # 213MB, 1.9s
tar -xzf lo.tar.gz -C debs --strip-components=1
for d in libreoffice25.8 libreoffice25.8-ure libreoffice25.8-en-us libreoffice25.8-writer \
         libreoffice25.8-calc libreoffice25.8-impress libobasis25.8-core libobasis25.8-writer \
         libobasis25.8-calc libobasis25.8-impress libobasis25.8-graphicfilter libobasis25.8-ooofonts \
         libobasis25.8-images libobasis25.8-en-us libobasis25.8-pyuno; do dpkg-deb -x debs/DEBS/$d*.deb root; done
```
15 deb / 582MB / 3.7s。soffice = `root/opt/libreoffice25.8/program/soffice`。
generate.mjs の wanted 9件には calc/impress/pyuno が無い → 3形式+UNO には不足。

## UNO
同梱 Python = `program/python`（sh wrapper）→ python 3.11.15、`import uno` 0.045s。
listener: `soffice --headless --norestore --invisible -env:UserInstallation=file://<dir> --accept='socket,host=localhost,port=2002;urp;'`（起動待ち ~2s）
接続 1.0s。fill 実測: docx 0.31s / pptx 0.09s / xlsx 0.10s（スクリプト全体 1.57s）。
フィルタ名: `MS Word 2007 XML` / `Impress MS PowerPoint 2007 XML` / `Calc MS Excel 2007 XML`。
ハマり:
- 図形は `page.add(s)` してから `s.setString(...)`。逆順だと保存ファイルにテキストが残らない。
- 相対パス不可 → `uno.systemPathToFileUrl(os.path.abspath(p))`。
- 列挙値は `uno.Enum("com.sun.star.drawing.FillStyle","SOLID")`（getConstantByName は不可）。
- listener を kill すると出力先に `.~lock.<name>#` が残り、次の store が
  `impl_store ... 0x11b (Io/Abort Code:27)` で失敗する。ロックを消すか terminate で終了。

## flat ODF
`.fodt`→docx 1.41s（初回・プロファイル生成込み）/ `.fodp`→pptx 0.37s / `.fods`→xlsx 0.31s。
automatic-styles 無しの最小 XML で十分。`{{PLACEHOLDER}}` はそのまま OOXML に残る。

## 画像化
- `--convert-to png` は **1 文書 1 枚（1ページ目だけ）**。pptx 3枚でも deck3.png 1枚。
  filter data JSON で解像度指定可: `'png:impress_png_Export:{"PixelWidth":{"type":"long","value":1920}}'` → 1920x1080。
  既定: pptx 1058x595 / docx・xlsx 795x1124。0.45〜0.59s。
- PDF 経由 + pypdfium2 が全ページの正解: pptx→pdf 0.44s、`page.render(scale=dpi/72).to_pil()` で 3ページ 150dpi 0.11s（1654x931）。
  `pip install pypdfium2 pillow` = 3.9s。`draw_png_Export` の PageRange 指定は効かなかった。
- render 先は `/tmp/atomaton-workspace`（5MB上限）かリポジトリ内。`/tmp` の他は files サーバーが読めない。

## 視覚ループ1周
before.pptx（UNO で欠陥を仕込み）→ pdf 0.44s → png 3枚 0.11s → 画像 read →
検出（豆腐 / {{TITLE}} 未置換 / 枠あふれ / 重なり / 右端見切れ）→ UNO fix 0.24s → 再 render 0.59s → 再度 read。
**CJK フォント無しだと全部豆腐**。`apt-get download fonts-noto-cjk`（59MB, 2.0s）+ dpkg-deb -x + `~/.fonts` に .ttc 4本（90MB, 0.4s）。
