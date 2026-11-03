"""Build a 'user-supplied' binary .docx to try the UNO leg against.

It has the four ways a real customer template holds a placeholder, which is the
point of the leg: a plain run, a run split in two, a content control (SDT), and a
mail-merge field result. The theme font is set through rFonts *Theme attributes,
so the export has to resolve the theme rather than read a font name off the run.
"""
import sys
from docx import Document
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

out = sys.argv[1]
doc = Document()

# Normal style: theme fonts, not literal names
style = doc.styles["Normal"]
rpr = style.element.get_or_add_rPr()
fonts = rpr.find(qn("w:rFonts"))
if fonts is None:
    fonts = OxmlElement("w:rFonts")
    rpr.append(fonts)
for attr in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
    if fonts.get(qn(attr)) is not None:
        del fonts.attrib[qn(attr)]
fonts.set(qn("w:asciiTheme"), "minorHAnsi")
fonts.set(qn("w:hAnsiTheme"), "minorHAnsi")
fonts.set(qn("w:eastAsiaTheme"), "minorEastAsia")


def para(text_runs):
    p = doc.add_paragraph()
    for kind, text in text_runs:
        if kind == "run":
            p.add_run(text)
        elif kind == "sdt":
            sdt = OxmlElement("w:sdt")
            pr = OxmlElement("w:sdtPr")
            tag = OxmlElement("w:tag")
            tag.set(qn("w:val"), "customer-name")
            pr.append(tag)
            sdt.append(pr)
            content = OxmlElement("w:sdtContent")
            r = OxmlElement("w:r")
            t = OxmlElement("w:t")
            t.text = text
            r.append(t)
            content.append(r)
            sdt.append(content)
            p._p.append(sdt)
        elif kind == "mergefield":
            name, result = text
            b = OxmlElement("w:r")
            fc = OxmlElement("w:fldChar")
            fc.set(qn("w:fldCharType"), "begin")
            b.append(fc)
            p._p.append(b)
            i = OxmlElement("w:r")
            instr = OxmlElement("w:instrText")
            instr.set(qn("xml:space"), "preserve")
            instr.text = " MERGEFIELD %s " % name
            i.append(instr)
            p._p.append(i)
            s = OxmlElement("w:r")
            sep = OxmlElement("w:fldChar")
            sep.set(qn("w:fldCharType"), "separate")
            s.append(sep)
            p._p.append(s)
            r = OxmlElement("w:r")
            t = OxmlElement("w:t")
            t.text = result
            r.append(t)
            p._p.append(r)
            e = OxmlElement("w:r")
            end = OxmlElement("w:fldChar")
            end.set(qn("w:fldCharType"), "end")
            e.append(end)
            p._p.append(e)
    return p


para([("run", "{{TITLE}}")])                       # plain run
para([("run", "御客様名："), ("sdt", "{{CLIENT}}")])   # content control
para([("run", "ご担当："), ("mergefield", ("AUTHOR", "{{AUTHOR}}"))])  # field result
para([("run", "版：{{VER"), ("run", "SION}}")])     # one placeholder split over two runs
para([("run", "発行日：{{DATE}}")])
table = doc.add_table(rows=1, cols=1)
table.cell(0, 0).text = "{{SUMMARY}}"
doc.save(out)
print("wrote", out)
