---
name: docs/design-doc
description: Load when a run must turn a document draft into issue-visible artifacts — publish the Markdown draft to the orphan branch, generate Office originals and a PDF on demand, attach them, and report the three URLs in the closing report.
---

# Publishing a design document: draft, originals, PDF

A document this run was asked to produce is delivered in three layers:

| Layer | Format | Where it lives |
| --- | --- | --- |
| 原稿 (the draft) | Markdown, tables as CSV sidecars | an orphan branch, via `attachments__publish_draft` |
| 原本 (the originals) | xlsx / docx / pptx | user-attachment upload, via `attachments__probe` mode `upload` |
| 閲覧用 (the reading copy) | PDF | user-attachment upload, same route |

**The draft is the deliverable.** The originals and the PDF are how it is shown.
Every generation step below may fail; when one does, deliver what was produced
and say which layer is missing. A draft URL alone is a complete delivery of the
first layer — never hold the whole report hostage to LibreOffice.

## 1. The draft's contract

Write the draft as Markdown. A table is a separate `.csv` file next to the
draft, and the draft refers to it by its relative path (for example
`tables/layers.csv`) in the text where the table belongs. One CSV per table;
the first row is the header row. No other structure is required — the
converters read headings, list items and paragraphs, and pass everything else
through as text.

Lay the files out on the branch as `designs/<issue-number>/<slug>.md`, with
tables under `designs/<issue-number>/tables/`.

## 2. Publishing the draft — `attachments__publish_draft`

```json
attachments__publish_draft({
  "files": [
    { "path": "draft/design.md", "target": "designs/111/design.md" },
    { "path": "draft/tables/layers.csv", "target": "designs/111/tables/layers.csv" }
  ],
  "message": "design draft: <title>"
})
```

- `path` is where the file is in this run's world (a checkout-relative path, or
  an absolute one under `/tmp`); `target` is where it goes on the branch.
- `branch` defaults to `business-docs`. Omit it unless the request names
  another branch.
- The branch is created as an **orphan** the first time (a root commit with no
  parent in the default branch's history) and fast-forwarded after, so one
  branch accumulates the documents' history and a document's diff stays
  readable — while the default branch's history stays clean.
- The run's own checkout is not touched: no switch, no worktree, no index
  change. Nothing you have staged or uncommitted can be lost by publishing.
- The tool returns `{ branch, commit_sha, files: [{ target, blob_url }] }`.
  The `blob_url` values are the draft URLs for the report.
- Publishing to the remote's default branch, or to the branch this run has
  checked out, is refused by the tool. That is the design, not an obstacle:
  a document lands on the orphan branch or nowhere.

**If `attachments__publish_draft` is not among your tools**, the running layer
predates the server's publish capability — record that, publish nothing, and
do not route around it. The shell cannot push (`git push` and every other
mutating git subcommand are refused there, by design), and `commit_and_push`
can only create a run's own work branch, which is exactly where a document
must not go. The draft leg waits for the deploy; run the rest of this
procedure and mark the draft URL as not yet available.

## 3. Generating the originals and the PDF — `generate.mjs`

Next to this skill file sits `generate.mjs`. Run it with bun (or node):

```bash
bun "${ATOMATON_MACHINERY_ROOT}/.github/atomaton/skills/docs/generate.mjs" \
  <draft.md> --outdir <output-dir>
```

It produces, into the output directory: `<slug>.docx` (the document), an xlsx
holding one sheet per referenced CSV, and `<slug>.pdf` (converted from the
docx). `--formats docx,xlsx,pdf` narrows it; `--pptx` adds a slide deck for a
draft that has one (xlsx→pdf and pptx→pdf are not supported; the PDF is of the
document).

**Dependencies are installed on demand, into a cache directory, and never into
`environment.setup_commands`.** The first run on a machine installs; every run
after that skips the install and says so in its output:

- python3 with a venv, and `pip install openpyxl python-docx` (plus
  `python-pptx` only when `--pptx` is asked) — seconds;
- LibreOffice, when no `soffice` is on the `PATH`: the release tarball is
  downloaded and the needed `.deb`s extracted under the cache with
  `dpkg-deb -x` — no root, tens of seconds, and the conversion itself is a
  couple of seconds;
- CJK fonts, best-effort (`fonts-noto-cjk`, extracted the same way), so a
  Japanese document does not convert to tofu. If this one fails the PDF still
  converts — the glyphs are the only casualty, and quality is not this
  procedure's concern.

The script's JSON output names every dependency `installed` or `cached` with
its seconds — quote that in the report when the run was the first on the
machine. If an install fails, the script still exits with a summary of what it
did produce; deliver that, plus the draft URL, and say which layer is missing.

## 4. Attaching the originals and the PDF — `probe` mode `upload`

```json
attachments__probe({ "mode": "upload", "file": "<output-dir>/design.docx" })
```

One file per call, at or under 25 MB; the result carries the permanent asset
URL. The other `probe` modes are measurement tools — this procedure uses
`upload` and nothing else.

- **A stored attachment has no documented deletion API.** Upload finished
  artifacts only, and never a second copy of something already uploaded.
- Over 25 MB the endpoint refuses with 404 and stores nothing. Do not split
  the artifact on a guess: regenerate from the draft, or split the CSV tables
  into more files, so each piece is under the ceiling on its own.
- If the attachments server is not among your tools, the same rule as the
  publish leg applies: record it, attach nothing, do not route around it.

## 5. What the closing report carries, in this order

1. **The draft URL** — the `blob_url` from `publish_draft` (the branch's blob
   view, which renders the Markdown).
2. **The originals** — one line per uploaded original with its URL.
3. **The PDF** — its URL.

Three lines, in that order, plus one line saying which layers are missing if
any are. There is no comment-posting tool on the attachments server: the
closing report is where the URLs reach the issue.
