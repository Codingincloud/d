#!/usr/bin/env python3
"""check_dcc_extract.py — is the extracted text complete, and how much came from pictures?

`tools/dcc_extract.py` reads every source twice: once from the file's own text
(a deck's text frames, or a PDF page's text layer) and once by rendering the page
and OCR-ing it. The second reading is merged into the first, keeping only the
lines the first did not already have — which is how text written *inside a
picture* gets into the notes at all.

That merge is the one place where content could silently disappear: a
similarity threshold that is a little too eager would treat a real paragraph as
a duplicate of a nearby one and drop it, and nothing on the site would look
wrong. So the merge is checked rather than trusted:

  * **Completeness.** Every line of a deck's own text frames, and every line of a
    PDF page's text layer, must appear in the extracted file. This is the
    direction that matters — the reliable source must never be lost.
  * **Recovery.** How much text was found only inside pictures, per source. This
    is the number the merge exists to make non-zero; it was 0 before, because
    the first version only read a slide whose text frames were empty and 50
    slides across the course carried both a paragraph *and* a picture with text.

Exits 1 if any line of a source's own text is missing from its extraction.

Usage
-----
    python tools/check_dcc_extract.py
    python tools/check_dcc_extract.py --only "Chapter 3"
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))

import dcc_extract as dx  # noqa: E402  (needs ROOT on the path)

# Marks the extractor writes in front of text it only found by OCR-ing a picture.
IMAGE_TAGS = ('[in the slide picture]', '[image text]')
# Below this length a line is not a useful uniqueness test: "RPC" appearing
# somewhere in a chapter says nothing about whether this particular slide's "RPC"
# survived.
MIN_LINE = 12


def image_stats(text: str) -> tuple[int, int]:
    """(blocks recovered from pictures, characters in them)."""
    blocks = 0
    chars = 0
    for line in text.splitlines():
        if any(line.startswith(t) for t in IMAGE_TAGS):
            blocks += 1
            chars += len(line) - len(next(t for t in IMAGE_TAGS if line.startswith(t)))
    return blocks, chars


def read_output(path: Path) -> str:
    if not path.is_file():
        return ''
    text = path.read_text(encoding='utf-8')
    # Drop the small key: value header the extractor writes.
    return text.split('-' * 70, 1)[-1].strip() if '-' * 70 in text else text


def outputs_for(rel: str, manifest: dict) -> str:
    """A source's extracted text: one file, or every chunk of a long book."""
    outs = [v['out'] for k, v in manifest.items()
            if (k == rel or k.startswith(rel + '#')) and v.get('out')]
    return '\n'.join(read_output(dx.OUT / o) for o in sorted(outs))


def check_pptx(path: Path, extracted: str) -> tuple[int, int, int]:
    """(lines checked, lines missing, slides)."""
    slides = dx.read_pptx_slides(path)
    checked = missing = 0
    flat = dx.norm_for_compare(extracted)
    for n, text in slides:
        for line in text.splitlines():
            line = line.strip()
            if len(line) < MIN_LINE:
                continue
            checked += 1
            if dx.norm_for_compare(line) not in flat:
                missing += 1
                if missing <= 3:
                    print(f'        MISSING slide {n}: {line[:90]}')
    return checked, missing, len(slides)


# Above this share of pages needing OCR, a PDF has no text layer worth
# comparing against — it is a scan.
SCAN_RATIO = 0.75


def scan_ratio(rel: str, manifest: dict) -> float:
    """What fraction of this file's pages had to be OCR'd?

    Decided from the manifest rather than by opening the PDF. pdfplumber costs
    about a fifth of a second per page even when the page is a scan with nothing
    in it, so probing the four reference books' 2,765 pages took longer than the
    OCR that produced them — and got the wrong answer anyway, because a scanned
    book's front matter often *does* carry a text layer on a page or two, which
    sent the walk down all 1,067 pages of Kindberg. The manifest already recorded
    exactly how many pages each run had to render, per chunk.
    """
    span = ocr = 0
    prefix = rel + '#'
    for key, info in manifest.items():
        if key != rel and not key.startswith(prefix):
            continue
        rng = key.split('#')[1] if '#' in key else None
        if rng:
            lo, hi = (int(x) for x in rng.split('-'))
            span += hi - lo + 1
        else:
            span += info.get('pages') or 0
        ocr += info.get('ocr_pages') or 0
    return (ocr / span) if span else 0.0


def check_pdf(path: Path, extracted: str, pages: list[int] | None) -> tuple[int, int, int]:
    """Only the pages that HAVE a text layer can be checked this way."""
    import pdfplumber
    flat = dx.norm_for_compare(extracted)
    checked = missing = 0
    with pdfplumber.open(str(path)) as pdf:
        total = len(pdf.pages)
        wanted = pages or range(1, total + 1)
        count = 0
        for n in wanted:
            text = (pdf.pages[n - 1].extract_text() or '').strip()
            if len(text) < dx.PAGE_TEXT_MIN:
                continue          # a scan: nothing authoritative to compare here
            count += 1
            for line in text.splitlines():
                line = line.strip()
                if len(line) < MIN_LINE:
                    continue
                checked += 1
                if dx.norm_for_compare(line) not in flat:
                    missing += 1
                    if missing <= 3:
                        print(f'        MISSING page {n}: {line[:90]}')
    return checked, missing, count


def main() -> int:
    p = argparse.ArgumentParser(description='check the DCC extraction is complete')
    p.add_argument('--only', help='substring of the source path')
    args = p.parse_args()

    man_path = dx.OUT / 'MANIFEST.json'
    if not man_path.is_file():
        sys.exit('check_dcc_extract: no manifest — run tools/dcc_extract.py first')
    manifest = json.loads(man_path.read_text(encoding='utf-8'))

    sources = sorted(p for p in dx.SRC.rglob('*')
                     if p.is_file() and dx.classify(p) != 'skip')
    if args.only:
        needle = args.only.lower()
        sources = [s for s in sources if needle in str(s.relative_to(dx.SRC)).lower()]

    total_checked = total_missing = 0
    total_img_blocks = total_img_chars = 0
    rows: list[tuple[str, int, int, int]] = []

    for path in sources:
        rel = str(path.relative_to(dx.SRC))
        extracted = outputs_for(rel, manifest)
        if not extracted:
            print(f'  {rel}\n      [ --] NOT EXTRACTED YET')
            continue
        method = dx.classify(path)
        # Name printed before the work, result after it: this runs over a 7 MB
        # corpus and can touch 2,765 book pages, so an interrupted run should
        # still show how far it got.
        print(f'  {Path(rel).name[:58]}', flush=True)
        checked = missing = units = 0
        ratio = scan_ratio(rel, manifest)
        note = ''
        if method in ('pdf',) and ratio >= SCAN_RATIO:
            note = f'scan ({ratio:.0%} of pages OCR\'d) — no text layer to compare'
        elif method == 'pptx':
            checked, missing, units = check_pptx(path, extracted)
        elif method == 'pdf':
            checked, missing, units = check_pdf(path, extracted, None)
        elif method == 'pptx-via-powerpoint':
            converted = dx.TMP / 'pptx' / (dx.slug(path.stem) + '.pptx')
            if converted.is_file():
                checked, missing, units = check_pptx(converted, extracted)
        blocks, chars = image_stats(extracted)
        total_checked += checked
        total_missing += missing
        total_img_blocks += blocks
        total_img_chars += chars
        rows.append((Path(rel).name[:52], len(extracted), blocks, chars))
        flag = 'ok ' if not missing else 'BAD'
        print(f'      [{flag}] {len(extracted):>9,} chars   '
              f'{checked:>6} lines checked, {missing:>3} missing   '
              f'{blocks:>3} picture-block(s)'
              + (f'   {note}' if note else ''), flush=True)

    print(f'\n  {len(rows)} source(s) extracted, {total_checked} lines of the sources\' own '
          f'text verified, {total_missing} missing')
    print(f'  text recovered from inside pictures: {total_img_blocks} block(s), '
          f'{total_img_chars:,} chars')
    if total_missing:
        print('\n  FAIL: the merge dropped text the source states in its own frames/layer.')
        return 1
    print('\n  Extraction is a superset of every source\'s own text. OK')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
