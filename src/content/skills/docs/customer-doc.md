---
name: docs/customer-doc
description: Load when a run must deliver a document a customer will open — a docx report, a pptx deck or an xlsx estimate — by filling a template from a data file, rendering every page to an image and reading those images until the layout is right, then reporting what was produced and what a person still has to check.
---

# Producing a customer document: template, fill, then look at it

A document that leaves the building is judged by how it looks, not by whether the
file opened. So this procedure has two halves that cannot be separated: a **fill**
that puts the run's data into a template, and a **visual loop** that renders the
result and reads every page of it. A run that fills and does not look has not
finished the job; it has produced a file and does not know what is in it.

The scripts, both beside this file in the shipped tree:

| Script | What it is for |
| --- | --- |
| `customer-doc.mjs` | `deps`, `template`, `fill`, `render`, `uno` — this procedure |
| `deps.mjs` | the LibreOffice, CJK-font and venv install both legs below use |

Dependencies are installed on demand into the cache directory and never into
`environment.setup_commands`. `bun "${ATOMATON_MACHINERY_ROOT:-.}/.github/atomaton/skills/docs/customer-doc.mjs" deps` installs and reports
everything the other subcommands use, so a first run on a machine pays once:
measured 9–39 s for LibreOffice (a 213 MB tarball, 15 `.deb`s extracted, 584 MB
unpacked, the difference being the download), 3.4 s for the CJK fonts, 2.4 s for the venv, and under a second each
for the two pip packages. Every later run says `cached` for all of them and takes
under a second.

## 1. Which leg — decided by the template, not by preference

| Template | Leg | What it means |
| --- | --- | --- |
| `.fodt` / `.fodp` / `.fods`, or the name `docx`/`pptx`/`xlsx` | **flat ODF** | the placeholders are substituted in XML text, then converted to the binary format by LibreOffice |
| any other path — a customer's `.docx`, `.pptx`, `.xlsx` | **UNO** | a headless LibreOffice opens the template, replaces the placeholders in the document model, and stores it back |

```bash
bun "${ATOMATON_MACHINERY_ROOT:-.}/.github/atomaton/skills/docs/customer-doc.mjs" fill --template docx --data data.json --out out/report.docx
bun "${ATOMATON_MACHINERY_ROOT:-.}/.github/atomaton/skills/docs/customer-doc.mjs" fill --template /path/to/customer-form.docx --data data.json --out out/form.docx
bun "${ATOMATON_MACHINERY_ROOT:-.}/.github/atomaton/skills/docs/customer-doc.mjs" render out/report.docx --outdir out/render --dpi 120
```

The full path matters: the scripts are not in a run's working directory, so every
example spells the shipped location — `${ATOMATON_MACHINERY_ROOT:-.}` is where the
run's copy of the machinery lives, with the checkout as the `:-.` fallback.

Prefer the flat leg. Its source is text, so a fix is an edit in a diff and one
more conversion — not a round trip through a binary that rewrites everything it
touches. The UNO leg exists for the template you were handed, and for that one it
is the only leg there is.

## 2. The templates and the placeholder contract

Three defaults ship under `templates/`, each a flat ODF file with a comment header
that states what was measured about it:

| File | Format | Shape |
| --- | --- | --- |
| `report.fodt` | docx | A4 portrait, title page, 概要 / システム構成 / スケジュール / 費用 / 体制・連絡先, footer with page numbers |
| `deck.fodp` | pptx | 16:9, three slides: title, agenda, content-with-bullets |
| `book.fods` | xlsx | two sheets: 見積 (itemised, formulas for 小計/消費税/合計) and 前提条件 |

**A template a person attached to the issue.** The customer's own template usually
arrives as a file on the issue rather than as a path in the tree. `fetch_attachment`
turns it into one: pass the URL from the comment it was posted in
(`https://github.com/user-attachments/files/<id>/<name>`), and the bytes are saved
under `/tmp/atomaton-workspace/attachments` — the one `/tmp` directory that survives
into the next run on the issue. It reads only GitHub's two attachment hosts and sends
no credential, so an attachment on a private repository answers 404 and nothing is
written. That saved path is then what `--template` takes in §4: a customer's `.docx`
is the UNO leg.

A placeholder is `{{UPPER_SNAKE}}` and is substituted everywhere it appears,
including inside table cells. Values are XML-escaped, so a name with `&` or `<`
in it is safe. The data file is one JSON object, one key per placeholder.

Three properties of a *spreadsheet* template are not free choices, each measured
by filling and re-rendering:

- a numeric placeholder must be written into **both** `office:value` and the cell
  text. The value is what the format carries as a number and what a formula
  reads; the text is what the cell displays. Text alone makes it a text cell —
  no number format, no right alignment, and a formula pointing at it computes
  nothing;
- a **formula** cell must not carry a cached `office:value`: LibreOffice trusts a
  cached value and never recalculates, so every total came back 0 円 until the
  attribute was removed;
- `style:page-layout` must live in `office:automatic-styles`. Placed in
  `office:styles` it is not bound to the master page — the export carries
  `style:page-layout-name=""` and LibreOffice prints with its own default margins,
  which split a 16.5 cm table across two pages instead of one.

`fill` reports, in its JSON line, the three mistakes worth knowing about:

| Field | Meaning | What to do |
| --- | --- | --- |
| `keysNotInTemplate` | data keys no placeholder matched | the data or the template is wrong; do not ship |
| `leftInTemplate` | placeholders still in the output | a typo in the key, or the placeholder is not plain text |
| `unfilled` | keys the fill could not place | same as above, and the reason this field exists |

## 3. The flat leg, and the rules that cost a render each

Substituting text is trivial; making the *conversion* keep the document's
intent is not. These are the rules a Japanese document template needs, each one
found by rendering a draft that looked fine in the XML:

- **State the East Asian font, size and language on every text style.** Without
  `style:font-name-asian` the exported docx carries
  `w:eastAsia="Noto Serif CJK SC"` — LibreOffice's default Asian face, a
  Simplified-Chinese serif — instead of the Noto Sans JP the template asked for;
  without `style:language-asian="ja"` it carries `w:lang w:eastAsia="en-US"`, so
  the reader treats Japanese as English for line breaking and fallback. The
  second defect is invisible in a render and only shows in the XML, which is the
  argument for checking both.
- **docx:** a heading needs `fo:keep-with-next="always"` (otherwise it strands at
  the foot of a page) and a table needs `style:may-break-between-rows="false"`.
- **pptx:** the page is 28 × 15.75 cm — LibreOffice's own 16:9 — and a
  `style:page-layout` naming any other 16:9 size is ignored, which misplaces every
  frame laid out for it. Text styles must be `style:family="paragraph"` with names
  no built-in Impress style uses (`Title` resolves to the built-in `Title` and the
  styling is lost). Paragraph spacing inside a slide's text box does not survive
  the export; use `fo:line-height`.
- **Fix a copy of the template, never the filled file.** `fill` writes
  `<out>.fodt`/`.fodp`/`.fods` beside the output — the diffable record of what was
  filled — but `fill` re-reads its `--template` and rewrites that record on every
  run, so an edit there is discarded silently. The fix loop is three steps:
  `template docx --out work` makes an editable copy of the default template, you
  edit `work/report.fodt`, and `fill --template work/report.fodt …` re-substitutes
  and converts it.

## 4. The UNO leg, for a template someone handed over

```bash
bun "${ATOMATON_MACHINERY_ROOT:-.}/.github/atomaton/skills/docs/customer-doc.mjs" fill --template customer-form.docx --data data.json --out out/form.docx
```

It starts a headless LibreOffice with a pinned profile, opens the template
`Hidden`, replaces one key at a time so the report can name what matched nothing,
stores with the format's filter name, and terminates the office. Measured on a
docx holding a placeholder as a plain run, as two runs, inside a content control
and inside a mail-merge field: **five of six keys filled** — the run split in two
and the content control both worked, because the search runs over LibreOffice's
text model — and the one inside the `MERGEFIELD` result came back `unfilled`,
because a field's result is not part of the searchable text. Content controls and
fields survive the round trip, so the fix is to move that placeholder out of the
field (or let a person merge it), not to give up on the template.

The traps this had to be written around, all of them in the module comment:
`page.add` before `setString` for a shape added at run time; absolute paths
through `uno.systemPathToFileUrl`; `uno.Enum` rather than `getConstantByName`; a
killed office leaving `.~lock.<name>#` beside the file — which is why the fill
copies the template into a temporary directory rather than opening the caller's.

`bun "${ATOMATON_MACHINERY_ROOT:-.}/.github/atomaton/skills/docs/customer-doc.mjs" uno --script <file.py>` runs any UNO program against the
same listener, for the document a substitution cannot express.

## 5. The visual loop — render, read, fix, and say what you looked at

```bash
bun "${ATOMATON_MACHINERY_ROOT:-.}/.github/atomaton/skills/docs/customer-doc.mjs" render out/report.docx --outdir out/render --dpi 120   # every page
bun "${ATOMATON_MACHINERY_ROOT:-.}/.github/atomaton/skills/docs/customer-doc.mjs" render out/deck.pptx --outdir out/render --dpi 110 --pages 1-3
```

The render goes file → PDF → one PNG per page, and its JSON line carries each
page's path, pixel size and byte size. Read the images with the `read` tool, which
resolves a path under the run's checkout or under `/tmp/atomaton-workspace` — the
workspace is the only writable directory a run has that survives into the next
one, and `/tmp` outside it is not readable back. Render into the workspace or
beside the output, not into `/tmp`.

**Budget: pages × pixels, not tokens.** One A4 page at 120 dpi is 993 × 1404 px
and 40–190 KB; a 16:9 slide at 110 dpi is 1213 × 683. Three pages of report, three
slides and two sheets of a book are **eight images, roughly 1.5 MB, about 2 s to
render** — so the loop is cheap enough to run after *every* fix, and running it
three or four times is normal. Read every page; a defect that the first page
hides is what the second page is for.

Fix in the template, not in the output: the output is regenerated every time. The
editable thing is the template copy from §3 — `template docx --out work`, edit
`work/report.fodt`, then `fill --template work/report.fodt …` — not the filled flat
file beside the output, which the next `fill` overwrites.

What a render shows, and what only the file shows:

| A picture shows | Only the file shows |
| --- | --- |
| overflow past a cell or a frame edge, `###` where a number does not fit | a formula whose value is cached and never recalculated |
| a font that is not the one intended (serif where sans was asked for) | `w:lang w:eastAsia="en-US"` under a Japanese paragraph |
| a heading stranded at the foot of a page, a table split across two | a page layout that was dropped, so the print margins are the default |
| an empty footer, a missing page number, a colour on the wrong background | a placeholder left as `{{KEY}}` inside a field result |

So the loop is two checks, not one: read the pages, then confirm the rules in
§3 for any attribute that cannot be seen.

**Who can run it.** The loop needs an agent that can read an image, and `vision`
is a property of the agent definition, not of the model underneath it: `engineer`
(`vision: true`) and `reviewer` (`vision: true`) run it as written. `atomaton` and
`architect` are `vision: false`, so the loop is not theirs to run and a fill
without a look is a half-finished job: they hand the document work to `engineer`,
which is where a document that has to be looked at belongs. Do not hand the images
to a delegate — every shipped delegate is `vision: false` too, so a delegate
receives no picture and answers about a page it never saw. If no vision-capable
agent is reachable, say in the report that the visual loop was not run and what is
therefore unverified; do not describe a page you have not seen.

## 6. What the report carries

One table, in this order, then the open items:

| Step | Command | Duration | Result |
| --- | --- | --- | --- |
| dependencies | `bun "${ATOMATON_MACHINERY_ROOT:-.}/.github/atomaton/skills/docs/customer-doc.mjs" deps` | 46 s first run, <1 s after | `installed` / `cached` per dependency |
| fill | `bun "${ATOMATON_MACHINERY_ROOT:-.}/.github/atomaton/skills/docs/customer-doc.mjs" fill …` | about 0.3 s flat, 0.5–1.5 s UNO | `keysNotInTemplate` / `leftInTemplate` / `unfilled` |
| render | `bun "${ATOMATON_MACHINERY_ROOT:-.}/.github/atomaton/skills/docs/customer-doc.mjs" render …` | 0.6–0.8 s for 3–4 pages | page count and pixel size per page |
| visual loop | (the agent reading the images) | | what was wrong, what was changed, what is still wrong |

Then: the paths of the produced files, the page count, and a **"what still needs
a person"** list — every `unfilled` key, every field that must be merged in Word,
every place the sample data had to be shortened to fit. The durations are from
the run that ran it, not from this page.

## 7. Where the files go

The produced docx/pptx/xlsx are **published, not committed** — `publish_draft`
onto the orphan branch: no `branch` argument, one call per publication,
`blob_url` per file in the report. Putting the file into a comment instead would
mean the endpoint `gh issue comment --attach` posts to, and an Actions token is
not on that endpoint's allowlist — measured, a body-bearing POST answers 404 — so
the orphan branch is the route there is.

What *is* committed is the template and the scripts: they are text, they diff,
and they are the thing the next run changes. Never commit a generated `.docx`,
`.pptx`, `.xlsx`, `.pdf` or page image.

## 8. The limitation, stated in the report

This procedure **detects and fixes** layout defects; it does not **guarantee**
the document is right. The loop sees a LibreOffice render on this machine: it
does not see pagination as Word will compute it, font substitution on the
customer's machine, a mail-merge field that Word will fill from a data source, or
a CJK line break that differs between engines. Say that in the report, name what
was checked and how, and let a person open the file before it goes out.
