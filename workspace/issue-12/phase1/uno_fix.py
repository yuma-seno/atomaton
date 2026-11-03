import os, time, uno
from com.sun.star.beans import PropertyValue
from com.sun.star.awt import Point, Size
def prop(n,v):
    p=PropertyValue(); p.Name=n; p.Value=v; return p
t0=time.time()
ctx = uno.getComponentContext().ServiceManager.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", uno.getComponentContext()).resolve("uno:socket,host=localhost,port=2002;urp;StarOffice.ComponentContext")
desktop = ctx.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)
doc = desktop.loadComponentFromURL(uno.systemPathToFileUrl(os.path.abspath("loop/before.pptx")), "_blank", 0, (prop("Hidden",True),))
page = doc.getDrawPages().getByIndex(0)
fixed = []
for i in range(page.getCount()):
    s = page.getByIndex(i)
    txt = s.getString() if hasattr(s, "getString") else ""
    if "{{TITLE}}" in txt:
        s.setString("基幹システム刷新 ご提案"); fixed.append("title filled")
    elif txt.startswith("本提案の目的"):
        s.setSize(Size(12000, 4500)); fixed.append("box A height 18->45mm")
    elif txt.startswith("移行は"):
        s.setPosition(Point(2000, 10200)); fixed.append("box B moved to y=102mm")
    elif txt.startswith("株式会社テスト"):
        s.setPosition(Point(14000, 13500)); s.setSize(Size(12000, 1500)); fixed.append("footer moved inside slide")
doc.storeToURL(uno.systemPathToFileUrl(os.path.abspath("loop/after.pptx")), (prop("FilterName","Impress MS PowerPoint 2007 XML"),))
print("edits:", fixed, f"script_seconds={time.time()-t0:.2f}")
doc.close(False); desktop.terminate()
