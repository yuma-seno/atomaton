# issue 432 — report.fodt page-layout → office:automatic-styles

Measured pgMar (twips) in the exported docx, A4:
- before (HEAD report.fodt): left/right/top 1134, bottom 1417  (LibreOffice defaults 2.0/2.5 cm)
- after  (fixed report.fodt): left 1361, right 1361, top 1247, bottom 1530  (2.40/2.40/2.20/2.70 cm)
pgSz identical both ways: w=11906 h=16838 (A4).
Pagination identical before/after (3 pages, same first/last line per page, cost table on p3 both).

deck.fodp: page-layout pm1 sits in office:styles (same pattern). Moving it to
office:automatic-styles in a work copy changed nothing in the pptx:
sldSz cx=10080625 cy=5670550 EMU both ways (28.00 x 15.75 cm — LibreOffice's own
16:9 default, which is what the layout names), so no defect shows in the output.
book.fods: page-layout pmA4 already in office:automatic-styles — rule-compliant.

Reproduce: bun $MACHINERY_ROOT/.github/atomaton/skills/docs/customer-doc.mjs fill \
  --template src/content/skills/docs/templates/report.fodt --data data.json --out out/x.docx
then unzip -p out/x.docx word/document.xml | grep -o '<w:pgMar[^/]*/>'
