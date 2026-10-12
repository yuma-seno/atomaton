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
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

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
const deps = [];
function record(name, state, seconds) {
  deps.push({ name, state, seconds: Math.round(seconds * 10) / 10 });
  console.error(`generate: ${name}: ${state} (${Math.round(seconds * 10) / 10}s)`);
}

// ------------------------------------------------------- dependency installs

/** A directory that survives a run, so "first run installs, later runs skip" holds across runs too. */
const CACHE = process.env.XDG_CACHE_HOME ?? join(process.env.HOME ?? tmpdir(), ".cache");
const DOCGEN_CACHE = join(CACHE, "atomaton-docgen");
mkdirSync(DOCGEN_CACHE, { recursive: true });

function secondsSince(t) {
  return (Date.now() - t) / 1000;
}

/** python3 with a venv module, or the record of its absence. */
function pythonBin() {
  for (const bin of ["python3", "python"]) {
    const p = spawnSync(bin, ["-c", "import venv"], { encoding: "utf8" });
    if (p.status === 0) return bin;
  }
  return undefined;
}

const needPy = formats.includes("docx") || formats.includes("xlsx") || wantPptx;
let venvPython;
if (needPy) {
  const t0 = Date.now();
  const py = pythonBin();
  if (!py) {
    record("python3-venv", "failed", secondsSince(t0));
  } else {
    venvPython = join(DOCGEN_CACHE, "venv", "bin", "python");
    if (existsSync(venvPython)) {
      record("python-docgen-venv", "cached", secondsSince(t0));
    } else {
      const made = spawnSync(py, ["-m", "venv", join(DOCGEN_CACHE, "venv")], { encoding: "utf8" });
      if (made.status !== 0) {
        record("python-docgen-venv", "failed", secondsSince(t0));
        venvPython = undefined;
      } else {
        record("python-docgen-venv", "installed", secondsSince(t0));
      }
    }
  }
  if (venvPython) {
    // The distribution name pip installs is not the name the module imports under, and
    // for these three the two never agree: `python-docx` imports as `docx` and
    // `python-pptx` as `pptx`. Deriving the import from the pip name by replacing `-`
    // with `_` therefore probes `python_docx`, which is not importable even when the
    // package is installed -- so the probe failed every run and the package was
    // reinstalled every run. Measured: the second run reported `python-docx: installed
    // (0.2s)` where the whole point of the install step is that it says `cached`.
    const packages = [
      { pip: "openpyxl", module: "openpyxl" },
      { pip: "python-docx", module: "docx" },
      ...(wantPptx ? [{ pip: "python-pptx", module: "pptx" }] : []),
    ];
    for (const { pip: pkg, module } of packages) {
      const t1 = Date.now();
      const probe = spawnSync(venvPython, ["-c", `import ${module}`], { encoding: "utf8" });
      if (probe.status === 0) {
        record(pkg, "cached", secondsSince(t1));
        continue;
      }
      const installed = spawnSync(join(DOCGEN_CACHE, "venv", "bin", "pip"), ["install", "--quiet", pkg], {
        encoding: "utf8",
      });
      record(pkg, installed.status === 0 ? "installed" : "failed", secondsSince(t1));
    }
  }
}

/** LibreOffice, extracted under the cache; returns the soffice path or undefined. */
function soffice() {
  const onPath = spawnSync("soffice", ["--version"], { encoding: "utf8" });
  if (onPath.status === 0) return "soffice";
  if (!formats.includes("pdf")) return undefined;
  const t0 = Date.now();
  const loRoot = join(DOCGEN_CACHE, "lo-root");
  const sofficePath = join(loRoot, "opt/libreoffice25.8/program/soffice");
  if (existsSync(sofficePath)) {
    record("libreoffice", "cached", secondsSince(t0));
    return sofficePath;
  }
  const url = "https://download.documentfoundation.org/libreoffice/stable/25.8.7/deb/x86_64/LibreOffice_25.8.7_Linux_x86-64_deb.tar.gz";
  const tgz = join(DOCGEN_CACHE, "lo.tar.gz");
  const dl = spawnSync("curl", ["-sSL", "-o", tgz, url], { encoding: "utf8" });
  if (dl.status !== 0 || !existsSync(tgz)) {
    record("libreoffice", "failed", secondsSince(t0));
    return undefined;
  }
  const extractDir = mkdtempSync(join(tmpdir(), "lo-debs-"));
  try {
    const wanted = [
      "libreoffice25.8_*.deb", // the program
      "libreoffice25.8-ure_*.deb", // libuno_sal
      "libreoffice25.8-en-us_*.deb", // UI language
      "libobasis25.8-en-us_*.deb", // the en-US langpack; without it startup dies on "The user interface language cannot be determined."
      "libobasis25.8-core_*.deb",
      "libobasis25.8-writer_*.deb",
      "libobasis25.8-graphicfilter_*.deb",
      "libobasis25.8-ooofonts_*.deb",
      "libobasis25.8-images_*.deb",
    ];
    for (const pattern of wanted) {
      spawnSync("tar", ["-xzf", tgz, "-C", extractDir, "--wildcards", `LibreOffice_*/DEBS/${pattern}`]);
    }
    for (const deb of readdirSync(join(extractDir, readdirSync(extractDir)[0], "DEBS"))) {
      spawnSync("dpkg-deb", ["-x", join(extractDir, readdirSync(extractDir)[0], "DEBS", deb), loRoot]);
    }
  } finally {
    rmSync(extractDir, { recursive: true, force: true });
  }
  const ok = existsSync(sofficePath);
  record("libreoffice", ok ? "installed" : "failed", secondsSince(t0));
  return ok ? sofficePath : undefined;
}
const sofficePath = soffice();

/**
 * CJK fonts, best effort: without them a Japanese PDF is tofu, which is a quality
 * problem, not a delivery problem.
 *
 * They go into `$DOCGEN_CACHE/.fonts`, which is `~/.fonts` for the conversion below --
 * the one place LibreOffice is guaranteed to look. It also reads
 * `$XDG_DATA_HOME/fonts`, and that is the path this used to install into; a live run
 * sets `XDG_DATA_HOME` to the runner's own cache (`atomaton-runner.yml`), where nothing
 * here writes, so the fonts were installed, reported `installed`, and never read.
 * Measured on a draft with Japanese text: all 74 CJK characters came out through a
 * single glyph code of `BAAAAA+NotoSans-Bold`, a Latin-only face, where the same
 * conversion with the fonts on the path LibreOffice reads embeds
 * `NotoSansCJKhk-Regular`. Text still extracted correctly -- the glyphs are what broke.
 */
function cjkFonts() {
  if (!formats.includes("pdf")) return;
  const fontsDir = join(DOCGEN_CACHE, ".fonts");
  if (existsSync(fontsDir)) {
    record("fonts-noto-cjk", "cached", 0);
    return;
  }
  if (existsSync("/usr/share/fonts/opentype/noto")) {
    record("fonts-noto-cjk", "system", 0);
    return;
  }
  const t0 = Date.now();
  const dl = spawnSync("apt-get", ["download", "fonts-noto-cjk"], { cwd: DOCGEN_CACHE, encoding: "utf8" });
  const deb = readdirSync(DOCGEN_CACHE).find((f) => f.startsWith("fonts-noto-cjk") && f.endsWith(".deb"));
  if (dl.status !== 0 || !deb) {
    record("fonts-noto-cjk", "failed", secondsSince(t0));
    return;
  }
  const root = join(DOCGEN_CACHE, "font-root");
  spawnSync("dpkg-deb", ["-x", join(DOCGEN_CACHE, deb), root]);
  mkdirSync(fontsDir, { recursive: true });
  for (const f of readdirSync(join(root, "usr/share/fonts/opentype/noto"))) {
    copyFileSync(join(root, "usr/share/fonts/opentype/noto", f), join(fontsDir, f));
  }
  rmSync(root, { recursive: true, force: true });
  record("fonts-noto-cjk", "installed", secondsSince(t0));
}
cjkFonts();

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
  const t0 = Date.now();
  // `HOME` is `$DOCGEN_CACHE`, which is where `cjkFonts` above puts the fonts. Nothing
  // else is redirected: the caller's `XDG_DATA_HOME` and `XDG_CACHE_HOME` are inherited,
  // because a run sets them to directories it owns and LibreOffice's own profile is
  // already pinned by `-env:UserInstallation` below.
  const r = spawnSync(
    sofficePath,
    [
      "--headless",
      "--norestore",
      `-env:UserInstallation=file://${join(DOCGEN_CACHE, "lo-home")}`,
      "--convert-to",
      "pdf",
      "--outdir",
      outdir,
      docx,
    ],
    { encoding: "utf8", env: { ...process.env, HOME: DOCGEN_CACHE } },
  );
  const ok = r.status === 0 && existsSync(join(outdir, `${slug}.pdf`));
  record("pdf-convert", ok ? "done" : "failed", secondsSince(t0));
  return ok;
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
