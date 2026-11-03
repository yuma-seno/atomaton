#!/usr/bin/env bun
/**
 * generate.mjs — turn a Markdown draft into the layers a reader opens.
 *
 * Input: the draft .md (the design-doc skill's contract). Output, into --outdir:
 *   <slug>.docx  — the document
 *   <slug>.xlsx  — one sheet per CSV the draft references (tables/<name>.csv or <name>.csv)
 *   <slug>.pdf   — the docx converted with LibreOffice
 *   --pptx adds <slug>.pptx (python-pptx); xlsx/pptx do not convert to PDF.
 *
 * Dependencies are installed on demand into a cache directory and never into
 * environment.setup_commands: python3 venv with openpyxl/python-docx (+python-pptx
 * for --pptx), LibreOffice from the release tarball via dpkg-deb -x (no root), and
 * best-effort CJK fonts. A failed install is not a failed run: the script still
 * exits 0 with the summary of what it produced, because the draft is the deliverable
 * and this script only makes the showing layers. Exit 1 only when nothing could be
 * produced at all (bad arguments, unreadable draft).
 *
 * Output ends with one JSON line: {"draft", "outdir", "artifacts": [...],
 * "deps": [{"name", "state": "cached"|"installed"|"failed"|"skipped", "seconds"}]}.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, join, resolve } from "node:path";
import { convert, deps, ensure, record } from "./deps.mjs";

// ---------------------------------------------------------------- arguments

const argv = process.argv.slice(2);
function argOf(flag) {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
}
const draftArg = argv.find((a, i) => !a.startsWith("--") && (i === 0 || !["--outdir", "--formats"].includes(argv[i - 1])));
const outdir = resolve(argOf("--outdir") ?? "docgen-out");
const wantPptx = argv.includes("--pptx");
const formats = (argOf("--formats") ?? "docx,xlsx,pdf").split(",").map((s) => s.trim()).filter(Boolean);

function fail(message) {
  console.error(`generate: ${message}`);
  process.exit(1);
}
if (!draftArg || !existsSync(draftArg)) fail("usage: generate.mjs <draft.md> [--outdir DIR] [--formats docx,xlsx,pdf] [--pptx]");
const draft = resolve(draftArg);
if (!statSync(draft).isFile()) fail(`${draft} is not a file`);
mkdirSync(outdir, { recursive: true });

const slug = basename(draft).replace(/\.md$/i, "");

// ------------------------------------------------------- dependency installs

const needPy = formats.includes("docx") || formats.includes("xlsx") || wantPptx;
const { soffice: sofficePath, python: venvPython } = ensure({
  lo: formats.includes("pdf"),
  cjk: formats.includes("pdf"),
  packages: needPy
    ? [
        { pip: "openpyxl", module: "openpyxl" },
        { pip: "python-docx", module: "docx" },
        ...(wantPptx ? [{ pip: "python-pptx", module: "pptx" }] : []),
      ]
    : [],
});
if (!needPy) record("python-venv", "skipped", 0);

// ------------------------------------------------------------------ builders

/** The CSVs the draft references, as sheet name -> matrix. */
function referencedCsvs() {
  const text = readFileSync(draft, "utf8");
  const dir = draft.slice(0, draft.lastIndexOf("/")) || ".";
  const names = new Set();
  for (const m of text.matchAll(/([\w./-]+\.csv)/g)) {
    const p = resolve(dir, m[1]);
    if (existsSync(p)) names.add(p);
  }
  const sheets = [];
  for (const p of names) {
    const rows = readFileSync(p, "utf8")
      .split(/\r?\n/)
      .filter((l) => l.trim())
      .map((l) => l.split(","));
    sheets.push({ name: basename(p).replace(/\.csv$/i, "").slice(0, 31), rows });
  }
  return sheets;
}

function buildXlsx() {
  if (!formats.includes("xlsx") || !venvPython) return false;
  const sheets = referencedCsvs();
  if (sheets.length === 0) return false;
  const script = `
import json, sys
from openpyxl import Workbook
sheets = json.loads(sys.argv[1])
wb = Workbook()
wb.remove(wb.active)
for s in sheets:
    ws = wb.create_sheet(s["name"][:31])
    for row in s["rows"]:
        ws.append(row)
wb.save(sys.argv[2])
`;
  const scriptPath = join(outdir, ".build-xlsx.py");
  writeText(scriptPath, script);
  const r = spawnSync(venvPython, [scriptPath, JSON.stringify(sheets), join(outdir, `${slug}.xlsx`)], { encoding: "utf8" });
  rmSync(scriptPath, { force: true });
  if (r.status !== 0) {
    console.error(`generate: xlsx failed: ${(r.stderr || r.stdout).slice(0, 300)}`);
    return false;
  }
  return true;
}

const require = createRequire(import.meta.url);

function writeText(path, text) {
  const { writeFileSync } = require("node:fs");
  writeFileSync(path, text);
}

function buildDocx() {
  if (!formats.includes("docx") || !venvPython) return false;
  // The draft's own words are the document: headings, list items, paragraphs.
  // Tables stay in the xlsx and in the CSVs; the docx names them where they sat.
  const text = readFileSync(draft, "utf8");
  const script = `
import json, sys
from docx import Document
from docx.shared import Pt
blocks = json.loads(sys.argv[1])
doc = Document()
for b in blocks:
    if b["t"] == "h":
        doc.add_heading(b["x"], level=min(b["lvl"], 4))
    elif b["t"] == "li":
        doc.add_paragraph(b["x"], style="List Bullet")
    elif b["t"] == "p":
        doc.add_paragraph(b["x"])
doc.save(sys.argv[2])
`;
  const blocks = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.trim() || line.trim().startsWith("```")) continue;
    const h = /^(#{1,6})\s+(.*)$/.exec(line.trim());
    if (h) {
      blocks.push({ t: "h", lvl: h[1].length, x: h[2] });
    } else if (/^[-*]\s+/.test(line.trim())) {
      blocks.push({ t: "li", x: line.trim().replace(/^[-*]\s+/, "") });
    } else {
      blocks.push({ t: "p", x: line.trim() });
    }
  }
  const scriptPath = join(outdir, ".build-docx.py");
  writeText(scriptPath, script);
  const r = spawnSync(venvPython, [scriptPath, JSON.stringify(blocks), join(outdir, `${slug}.docx`)], { encoding: "utf8" });
  rmSync(scriptPath, { force: true });
  if (r.status !== 0) {
    console.error(`generate: docx failed: ${(r.stderr || r.stdout).slice(0, 300)}`);
    return false;
  }
  return true;
}

function convertToPdf() {
  if (!formats.includes("pdf") || !sofficePath) return false;
  const docx = join(outdir, `${slug}.docx`);
  if (!existsSync(docx)) return false;
  const converted = convert(sofficePath, { file: docx, to: "pdf", outdir });
  record("pdf-convert", converted.ok ? "done" : "failed", converted.seconds);
  return converted.ok;
}

function buildPptx() {
  if (!wantPptx || !venvPython) return false;
  const text = readFileSync(draft, "utf8");
  const script = `
import json, sys
from pptx import Presentation
from pptx.util import Pt
slides = json.loads(sys.argv[1])
prs = Presentation()
title = prs.slides.add_slide(prs.slide_layouts[0])
title.shapes.title.text = slides["title"]
body = title.placeholders[1]
body.text = slides["subtitle"] or ""
for s in slides["slides"]:
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    slide.shapes.title.text = s["title"]
    tf = slide.placeholders[1].text_frame
    for i, b in enumerate(s["bullets"][:6]):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = b
prs.save(sys.argv[2])
`;
  const headings = [];
  for (const raw of text.split(/\r?\n/)) {
    const m = /^(#{1,3})\s+(.*)$/.exec(raw.trim());
    if (m) headings.push({ lvl: m[1].length, x: m[2] });
  }
  const slides = { title: headings[0]?.x ?? slug, subtitle: null, slides: [] };
  for (let i = 1; i < headings.length; i++) {
    if (headings[i].lvl === 1) continue;
    const bullets = [];
    let j = i + 1;
    while (j < headings.length && headings[j].lvl !== 2) {
      bullets.push(headings[j].x);
      j++;
    }
    slides.slides.push({ title: headings[i].x, bullets });
    i = j - 1;
  }
  const scriptPath = join(outdir, ".build-pptx.py");
  writeText(scriptPath, script);
  const r = spawnSync(venvPython, [scriptPath, JSON.stringify(slides), join(outdir, `${slug}.pptx`)], { encoding: "utf8" });
  rmSync(scriptPath, { force: true });
  if (r.status !== 0) {
    console.error(`generate: pptx failed: ${(r.stderr || r.stdout).slice(0, 300)}`);
    return false;
  }
  return true;
}

// -------------------------------------------------------------------- main

const artifacts = [];
if (formats.includes("docx") && buildDocx()) artifacts.push(join(outdir, `${slug}.docx`));
if (formats.includes("xlsx") && buildXlsx()) artifacts.push(join(outdir, `${slug}.xlsx`));
if (wantPptx && buildPptx()) artifacts.push(join(outdir, `${slug}.pptx`));
if (formats.includes("pdf") && convertToPdf()) artifacts.push(join(outdir, `${slug}.pdf`));

const anyInstallFailed = deps.some((d) => d.state === "failed");
console.log(
  JSON.stringify(
    { draft, outdir, artifacts, deps, note: anyInstallFailed ? "a dependency failed to install; the draft is still the deliverable — publish it and report which layers are missing" : "ok" },
    null,
    2,
  ),
);
