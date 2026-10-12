import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.graphics.barcode import code128
from reportlab.pdfgen import canvas

von, bis = int(sys.argv[1]), int(sys.argv[2])
out = sys.argv[3] if len(sys.argv) > 3 else "Stellplatz_Etiketten.pdf"
COLS, ROWS = 3, 8
W, H = A4
cw, ch = W / COLS, H / ROWS
c = canvas.Canvas(out, pagesize=A4)
i = 0
for n in range(von, bis + 1):
    if i and i % (COLS * ROWS) == 0:
        c.showPage()
    k = i % (COLS * ROWS)
    x = (k % COLS) * cw
    y = H - (k // COLS + 1) * ch
    c.rect(x + 2*mm, y + 2*mm, cw - 4*mm, ch - 4*mm)
    bc = code128.Code128(str(n), barHeight=12*mm, barWidth=0.5*mm, quiet=False)
    bc.drawOn(c, x + (cw - bc.width) / 2, y + 14*mm)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(x + cw / 2, y + 5*mm, str(n))
    i += 1
c.save()
print(i, "Etiketten ->", out)
