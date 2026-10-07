"""Generate deterministic, synthetic E2E PDFs. Requires reportlab and Pillow.

Never replaces the local/private fixtures. Run from any directory; output is
tests/fixtures/demo/. Use E2E_DEMO_FIXTURES=1 for standalone/compression suites.
"""

from io import BytesIO
from pathlib import Path
from random import Random

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


OUTPUT = Path(__file__).resolve().parents[1] / "tests" / "fixtures" / "demo"
OUTPUT.mkdir(parents=True, exist_ok=True)


def text_pdf(name, count):
    pdf = canvas.Canvas(str(OUTPUT / name), pagesize=(612, 792),
                        pageCompression=0, invariant=1)
    pdf.setTitle("CloakPDF synthetic document - " + name)
    for number in range(1, count + 1):
        pdf.setFillColorRGB(0.08, 0.15, 0.27)
        pdf.setFont("Helvetica-Bold", 22)
        pdf.drawString(48, 730, "CloakPDF demo document")
        pdf.setFont("Helvetica", 11)
        pdf.drawString(48, 704, "Synthetic fixture. No personal or confidential information.")
        pdf.setStrokeColorRGB(0.15, 0.39, 0.85)
        pdf.line(48, 690, 564, 690)
        for row in range(25):
            pdf.drawString(48, 660 - row * 21,
                           f"Page {number}, record {row + 1:02}: Sample text for lossless PDF editing.")
        pdf.setFont("Helvetica", 10)
        pdf.drawString(48, 42, f"Demo fixture | Page {number} of {count}")
        pdf.showPage()
    pdf.save()


text_pdf("single.pdf", 1)
text_pdf("multipage.pdf", 4)
text_pdf("text.pdf", 16)

# Raster-only pages exercise image extraction and lossy compression. Seeded
# light paper noise deliberately makes the lossless source larger than JPEG.
pdf = canvas.Canvas(str(OUTPUT / "scanned.pdf"), pagesize=(612, 792), invariant=1)
pdf.setTitle("CloakPDF synthetic raster scan")
table = bytes(235 + n % 21 for n in range(256))
font = ImageFont.load_default(size=34)
for number in range(1, 4):
    image = Image.frombytes("L", (1224, 1584),
                            Random(number).randbytes(1224 * 1584).translate(table)).convert("RGB")
    draw = ImageDraw.Draw(image)
    draw.text((96, 110), "SYNTHETIC SCAN - DEMO ONLY", fill=(20, 40, 65), font=font)
    for row in range(20):
        draw.text((96, 230 + row * 52), f"Record {row + 1:02}: image extraction and compression.",
                  fill=(20, 40, 65), font=ImageFont.load_default(size=25))
    draw.text((96, 1460), f"Demo page {number} of 3", fill=(20, 40, 65), font=font)
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    pdf.drawImage(ImageReader(buffer), 0, 0, width=612, height=792)
    pdf.showPage()
pdf.save()
print(f"Generated single (1), multipage (4), text (16), scanned (3) PDFs in {OUTPUT}")
