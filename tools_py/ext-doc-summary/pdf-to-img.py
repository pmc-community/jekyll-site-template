import sys
from pathlib import Path
import fitz  # PyMuPDF

def pdf_first_page_to_png(pdf_path):
    pdf_path = Path(pdf_path)

    if not pdf_path.exists() or pdf_path.suffix.lower() != ".pdf":
        print(f"Error: {pdf_path} is not a valid PDF file.")
        return

    doc = fitz.open(pdf_path)
    if len(doc) == 0:
        print("No pages found in PDF.")
        return

    page = doc.load_page(0)  # first page (0-indexed)

    # Render at high resolution first
    pix = page.get_pixmap(dpi=300)

    # Scale down if wider than 600px
    if pix.width > 600:
        scale_factor = 600 / pix.width
        pix = page.get_pixmap(matrix=fitz.Matrix(scale_factor, scale_factor) * fitz.Matrix(300/72, 300/72))

    # Output filename: <pdf_file_name_no_extension>__pdf_firstPage.png
    output_path = pdf_path.with_name(pdf_path.stem + "__pdf_firstpage.png")
    pix.save(output_path)
    print(f"Saved: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python script.py <file.pdf>")
    else:
        pdf_first_page_to_png(sys.argv[1])
