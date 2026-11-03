import os, uno
from com.sun.star.beans import PropertyValue
from com.sun.star.awt import Point, Size
def prop(n,v):
    p=PropertyValue(); p.Name=n; p.Value=v; return p
ctx = uno.getComponentContext().ServiceManager.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", uno.getComponentContext()).resolve("uno:socket,host=localhost,port=2002;urp;StarOffice.ComponentContext")
desktop = ctx.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)

def text_shape(doc, page, x, y, w, h, text, height_pt, bordered=False):
    s = doc.createInstance("com.sun.star.drawing.TextShape")
    page.add(s)
    s.setPosition(Point(x, y)); s.setSize(Size(w, h))
    if bordered:
        s.FillStyle = uno.Enum("com.sun.star.drawing.FillStyle", "SOLID")
        s.FillColor = 0xEEEEEE
        s.LineStyle = uno.Enum("com.sun.star.drawing.LineStyle", "SOLID")
        s.LineColor = 0x333333
    s.setString(text)
    s.CharHeight = height_pt
    return s

doc = desktop.loadComponentFromURL(uno.systemPathToFileUrl(os.path.abspath("out/deck.pptx")), "_blank", 0, (prop("Hidden",True),))
page = doc.getDrawPages().getByIndex(0)
# defect 1: a bordered box whose text overflows its own height
text_shape(doc, page, 2000, 4500, 12000, 1800,
           "本提案の目的は基幹システムの刷新により業務効率を高めることです。現行システムの課題を整理し、"
           "段階的な移行計画と費用対効果を示します。", 18, bordered=True)
# defect 2: a second bordered box overlapping the first
text_shape(doc, page, 3000, 5200, 12000, 1800,
           "移行は 3 フェーズで実施し、各フェーズの完了条件を明確にします。", 18, bordered=True)
# defect 3: footer running off the right edge of the slide
text_shape(doc, page, 24000, 13500, 9000, 1500, "株式会社テスト / 2026-11-03", 12, bordered=True)
doc.storeToURL(uno.systemPathToFileUrl(os.path.abspath("loop/before.pptx")), (prop("FilterName","Impress MS PowerPoint 2007 XML"),))
print("written loop/before.pptx")
doc.close(False); desktop.terminate()
