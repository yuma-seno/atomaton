---
name: docs/design-doc
description: Load when a run must turn a document draft into issue-visible artifacts — publish the Markdown draft to the orphan branch, generate Office originals and a PDF on demand, publish them onto the same branch, and report the three blob URLs in the closing report.
---

# Publishing a design document: draft, originals, PDF

A document this run was asked to produce is delivered in three layers:

| Layer | Format | Where it lives |
| --- | --- | --- |
| 原稿 (the draft) | Markdown, tables as CSV sidecars | an orphan branch, via the `attachments` server's `publish_draft` |
| 原本 (the originals) | xlsx / docx / pptx | the same orphan branch — a second `publish_draft` |
| 閲覧用 (the reading copy) | PDF | the same branch, the same second call |

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

## 2. Publishing the draft — `publish_draft` (the `attachments` server)

Tool names here are bare: `publish_draft`, `probe`, `bash`, `read`. Every shipped
server is `unprefixed: true`, so a tool is called by its own name, and a name carrying
its server as a prefix is one no run has — the call fails as an unknown tool, and the
"not among your tools" branch below then reads as a deployment gap about a tool that is
right there. `<server>__<tool>` is the spelling for a server a project adds, not for
these.

```json
publish_draft({
  "files": [
    { "path": "draft/design.md", "target": "designs/111/design.md" },
    { "path": "draft/tables/layers.csv", "target": "designs/111/tables/layers.csv" }
  ],
  "message": "design draft: <title>"
})
```

- `path` is where the file is in this run's world (a checkout-relative path, or
  an absolute one under `/tmp`); `target` is where it goes on the branch.
- There is no `branch` argument. The branch is this repository's own setting —
  `tools.servers.attachments.settings.branch` in `.github/atomaton/config.yaml`,
  defaulting to `business-docs` — so a publish cannot be aimed at a branch the
  tool's guards do not see. If the request names a different branch, that is a
  settings change, not a tool argument: say so and stop.
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

**If `publish_draft` is not among your tools**, the running layer predates the
server's publish capability — record that, publish nothing, and
do not route around it. The shell cannot push (`git push` and every other
mutating git subcommand are refused there, by design), and `commit_and_push`
can only create a run's own work branch, which is exactly where a document
must not go. The draft leg waits for the deploy; run the rest of this
procedure and mark the draft URL as not yet available.

## 3. Generating the originals and the PDF — `generate.mjs`

Next to this skill file sits `generate.mjs`. Run it with bun (or node):

```bash
bun "${ATOMATON_MACHINERY_ROOT:-.}/.github/atomaton/skills/docs/generate.mjs" \
  <draft.md> --outdir <output-dir>
```

`ATOMATON_MACHINERY_ROOT` is where the run's own copy of the machinery is; the
`:-.` is the repository-relative fallback every other script here uses, so an
unset variable points at the checkout rather than at `/`.

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
  Japanese document does not convert to tofu. They are installed into
  `<cache>/atomaton-docgen/.fonts`, which is what LibreOffice reads as `~/.fonts`
  during the conversion. If this one fails the PDF still converts — the glyphs
  are the only casualty, and quality is not this procedure's concern.

The script's JSON output names every dependency `installed` or `cached` with
its seconds — quote that in the report when the run was the first on the
machine. A second run on the same machine says `cached` for every one of them
and takes under a second, which is the record that the install is on demand
rather than repeated. If an install fails, the script still exits with a summary
of what it did produce; deliver that, plus the draft URL, and say which layer is
missing.

## 4. Publishing the originals and the PDF — `publish_draft`, a second call

The generated files go onto the same branch the draft went to, by the same
tool — `publish_draft` again, with the output directory's files as `path` and
their place on the branch as `target`:

```json
publish_draft({
  "files": [
    { "path": "<output-dir>/design.docx", "target": "designs/111/design.docx" },
    { "path": "<output-dir>/design.xlsx", "target": "designs/111/design.xlsx" },
    { "path": "<output-dir>/design.pdf",  "target": "designs/111/design.pdf" }
  ],
  "message": "design originals and PDF: <title>"
})
```

- `target` carries no extension rule: the schema takes any file name
  (`DRAFT_FILE_SCHEMA`, in the attachments server), so the binaries go up as
  they are. One call per publication; the result's `blob_url` per file is what
  the report carries.
- A file on the branch is an ordinary git object — publishing over it replaces
  it, so a corrected original goes up as another call to the same `target`.
  That is a property of this route, not the reason it was chosen.
- **The upload route is closed, and measured so.** GitHub's user-asset upload
  endpoint refuses every body-bearing POST from the Actions token (`ghs_`),
  whatever the size or MIME type — a 20KB PDF, a 5-byte text and a 27MB random
  `.bin` all came back 404, while the same session's credential passed the
  endpoint's own validation. That refusal is why the originals and the PDF go
  onto the branch: for this run's credential it is the route that is left. The
  route's own limits stay its own — a body over 25MB is refused there, and a
  stored asset has no documented deletion API — so nothing published is weighed
  against either. The `probe` tool remains as the instrument that measured
  this; do not reach for it to deliver a file.
- If the attachments server is not among your tools, the same rule as the
  publish leg applies: record it, publish nothing, do not route around it.

## 5. What the closing report carries, in this order

1. **The draft URL** — the `blob_url` from `publish_draft` (the branch's blob
   view, which renders the Markdown).
2. **The originals** — one line per original with its `blob_url` from the
   second call.
3. **The PDF** — its `blob_url`, from the same call.

Three lines, in that order — all three of them blob URLs on the same branch —
plus one line saying which layers are missing if any are. There is no
comment-posting tool on the attachments server: the closing report is where
the URLs reach the issue.
