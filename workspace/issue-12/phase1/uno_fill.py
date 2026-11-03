import os, time, uno
from com.sun.star.beans import PropertyValue

def prop(n, v):
    p = PropertyValue(); p.Name = n; p.Value = v; return p

t0 = time.time()
local = uno.getComponentContext()
resolver = local.ServiceManager.createInstanceWithContext(
    "com.sun.star.bridge.UnoUrlResolver", local)
ctx = None
for i in range(60):
    try:
        ctx = resolver.resolve("uno:socket,host=localhost,port=2002;urp;StarOffice.ComponentContext")
        break
    except Exception:
        time.sleep(0.25)
print(f"connect_seconds={time.time()-t0:.2f}")
desktop = ctx.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)

def load(path):
    t = time.time()
    doc = desktop.loadComponentFromURL(uno.systemPathToFileUrl(os.path.abspath(path)), "_blank", 0,
                                       (prop("Hidden", True),))
    print(f"  load {path.split('/')[-1]}: {time.time()-t:.2f}s")
    return doc

def store(doc, path, filt):
    t = time.time()
    doc.storeToURL(uno.systemPathToFileUrl(os.path.abspath(path)),
                   (prop("FilterName", filt), prop("Overwrite", True)))
    print(f"  store {path.split('/')[-1]} [{filt}]: {time.time()-t:.2f}s")

# ---------------------------------------------------------------- docx
t = time.time()
doc = load("out/spec.docx")
search = doc.createSearchDescriptor()
search.SearchString = "{{CLIENT}}"
search.ReplaceString = "株式会社テスト"
n = doc.replaceAll(search)
search = doc.createSearchDescriptor()
search.SearchString = "{{BODY}}"
search.ReplaceString = "本設計書は UNO 経由で充填した本文です。"
m = doc.replaceAll(search)
table = doc.TextTables.getByName("Table1")
table.getRows().insertByIndex(1, 1)
table.getCellByName("A2").setString("サーバ台数")
table.getCellByName("B2").setString("3 台")
print(f"docx: replaced text ({n}+{m} hits), filled table row 2")
store(doc, "out2/spec.docx", "MS Word 2007 XML")
doc.close(False)
print(f"docx_total={time.time()-t:.2f}s")

# ---------------------------------------------------------------- pptx
t = time.time()
doc = load("out/deck.pptx")
page = doc.getDrawPages().getByIndex(0)
shapes = []
for i in range(page.getCount()):
    s = page.getByIndex(i)
    shapes.append(s)
    if s.supportsService("com.sun.star.drawing.TextShape") or hasattr(s, "String"):
        s.setString("顧客提案: 基幹システム刷新")
        s.CharHeight = 28
box = doc.createInstance("com.sun.star.drawing.TextShape")
box.setPosition(uno.createUnoStruct("com.sun.star.awt.Point", 2000, 9000))
box.setSize(uno.createUnoStruct("com.sun.star.awt.Size", 20000, 3000))
box.setString("2026-11 / atomaton")
page.add(box)
print(f"pptx: {len(shapes)} shape(s) touched, 1 text shape added")
store(doc, "out2/deck.pptx", "Impress MS PowerPoint 2007 XML")
doc.close(False)
print(f"pptx_total={time.time()-t:.2f}s")

# ---------------------------------------------------------------- xlsx
t = time.time()
doc = load("out/book.xlsx")
sheet = doc.getSheets().getByIndex(0)
sheet.getCellByPosition(2, 1).setValue(14400)
sheet.getCellByPosition(0, 2).setString("合計")
sheet.getCellByPosition(2, 2).setFormula("=C2*12")
sheet.getColumns().getByIndex(0).Width = 4000
print("xlsx: 3 cells written, column A width 40mm")
store(doc, "out2/book.xlsx", "Calc MS Excel 2007 XML")
doc.close(False)
print(f"xlsx_total={time.time()-t:.2f}s")

# quit the office
try:
    desktop.terminate()
except Exception as e:
    print("terminate:", e)
