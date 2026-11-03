import os, uno
from com.sun.star.beans import PropertyValue
def prop(n,v):
    p=PropertyValue(); p.Name=n; p.Value=v; return p
ctx = uno.getComponentContext().ServiceManager.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", uno.getComponentContext()).resolve("uno:socket,host=localhost,port=2003;urp;StarOffice.ComponentContext")
desktop = ctx.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)
doc = desktop.loadComponentFromURL(uno.systemPathToFileUrl(os.path.abspath("minout/x.xlsx")), "_blank", 0, (prop("Hidden",True),))
doc.getSheets().getByIndex(0).getCellByPosition(0,0).setString("min-ok")
doc.storeToURL(uno.systemPathToFileUrl(os.path.abspath("minout2/x.xlsx")), (prop("FilterName","Calc MS Excel 2007 XML"),))
doc.close(False); desktop.terminate(); print("uno xlsx ok")
