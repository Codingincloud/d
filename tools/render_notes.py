"""Render the handwritten notes to legible JPEGs so they can be read page by page.

The notes are scanned handwriting, so they have no usable text layer: the only
way to read them reliably is to look at the page. The user's OCR'd copies
(pdf24) give a noisy index of *where* things are, but the content itself must
come from the images.

  python tools/render_notes.py --list                 # page counts
  python tools/render_notes.py --note 1 --pages 18-24 # render a range
  python tools/render_notes.py --note 2 --pages 32-43
  python tools/render_notes.py --all                  # all 111 pages

Output: _source/notes/note<N>_p<NN>.jpg  (~200 KB each, 1100 px wide - the
largest size that can be attached/viewed directly).
"""

from __future__ import annotations

import argparse
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "_source", "notes")

# The pdf24 OCR copies also carry a (noisy) text layer, which makes them the
# better master to render from - same pages, plus grep-ability.
NOTES = {
    1: r"C:\Users\ghimi\Downloads\pdf24_ocrPdf\Simulation-Note-1_250907_041457.pdf",
    2: r"C:\Users\ghimi\Downloads\pdf24_ocrPdf\Simulation-Note-2 1.pdf",
}

WIDTH = 1100
QUALITY = 72


def parse_pages(spec: str, total: int) -> list[int]:
    """'18-24' or '5' or '1-3,9' -> zero-based page list."""
    out: list[int] = []
    for chunk in spec.split(","):
        chunk = chunk.strip()
        if not chunk:
            continue
        if "-" in chunk:
            a, b = chunk.split("-", 1)
            out.extend(range(int(a), int(b) + 1))
        else:
            out.append(int(chunk))
    return [p - 1 for p in out if 1 <= p <= total]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--note", type=int, choices=[1, 2])
    ap.add_argument("--pages", default="")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--scale", type=float, default=1.6)
    args = ap.parse_args()

    try:
        import pypdfium2 as pdfium
        from PIL import Image
    except ImportError:
        print("Needs pypdfium2 and Pillow:  pip install pypdfium2 Pillow")
        return 1

    os.makedirs(OUT, exist_ok=True)
    notes = [args.note] if args.note else [1, 2]

    for n in notes:
        path = NOTES[n]
        if not os.path.exists(path):
            print(f"note {n}: missing {path}")
            continue
        doc = pdfium.PdfDocument(path)
        total = len(doc)
        if args.list:
            print(f"note {n}: {total} pages  ({os.path.basename(path)})")
            continue
        pages = list(range(total)) if (args.all or not args.pages) else parse_pages(args.pages, total)
        for i in pages:
            img = doc[i].render(scale=args.scale).to_pil().convert("L")
            h = int(img.height * WIDTH / img.width)
            img = img.resize((WIDTH, h), Image.LANCZOS)
            dest = os.path.join(OUT, f"note{n}_p{i + 1:02d}.jpg")
            buf = io.BytesIO()
            img.save(buf, "JPEG", quality=QUALITY, optimize=True)
            with open(dest, "wb") as fh:
                fh.write(buf.getvalue())
            print(f"  {os.path.relpath(dest, ROOT)}  {len(buf.getvalue()) // 1024} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
