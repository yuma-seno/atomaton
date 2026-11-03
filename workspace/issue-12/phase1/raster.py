import sys, time, pypdfium2 as pdfium
pdf = sys.argv[1]; out = sys.argv[2]; dpi = int(sys.argv[3]) if len(sys.argv)>3 else 150
t=time.time(); doc = pdfium.PdfDocument(pdf); n=len(doc)
for i in range(n):
    page = doc[i]
    img = page.render(scale=dpi/72).to_pil()
    img.save(f"{out}/page{i+1}.png")
    print(f"page{i+1} {img.size[0]}x{img.size[1]} {page.get_width()/72*25.4:.0f}x{page.get_height()/72*25.4:.0f}mm")
print(f"pages={n} seconds={time.time()-t:.2f}")
