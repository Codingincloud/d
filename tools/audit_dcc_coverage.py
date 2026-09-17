#!/usr/bin/env python3
"""Measure how much of the uploaded DCC material actually reached the portal.

Answers three questions with numbers instead of impressions, because all three
were answered wrongly by eye at least once:

  1. Is every resource used?      -> inventory, by category, extracted vs cited
  2. Are the diagrams sufficient? -> diagram-bearing sources vs figures drawn
  3. Is the past-question part done? -> paper questions vs cards

Every number this prints comes from a file on disk, and it prints the file it
came from, so no figure here is a memory.

    python tools/audit_dcc_coverage.py                 # the whole audit
    python tools/audit_dcc_coverage.py --diagrams      # just the diagram gap
    python tools/audit_dcc_coverage.py --past          # just the question gap

Measuring "diagrams" needs care. For a slide deck the signal is a picture shape
on the slide; for a PDF it is a page dense in vector paths, which distinguishes a
diagram from a table rule or a page border. Neither is exact, and the tool says
so rather than presenting a rounded number as a truth.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / '_source' / 'dcc'
MANIFEST = SOURCE / 'MANIFEST.json'
DCC = ROOT / 'dcc'
SITE = ROOT / 'dcc-site'
OLD_SITE = DCC / 'dcc-website_v2'

# A page needs this many vector paths before it is called a diagram page. A
# ruled table is a handful of lines; a drawn architecture is dozens of boxes.
DIAGRAM_PATHS = 40
# Slides whose text frames hold less than this are "the slide IS a picture".
TEXT_LIGHT = 40


def category(key: str) -> str:
    low = key.lower()
    if 'books - all' in low or 'books_all' in low:
        return 'book'
    if 'lab_manual' in low:
        return 'lab manual'
    if 'syllabus' in low:
        return 'syllabus'
    if 'lecture notes' in low or 'lecture_notes' in low:
        return 'lecture file'
    return 'other'


def chapter_of(key: str) -> int | None:
    m = re.search(r'chapter[ _]?(\d+)', key, re.I)
    return int(m.group(1)) if m else None


def load_manifest() -> dict:
    if not MANIFEST.exists():
        sys.exit(f'no manifest at {MANIFEST} - run tools/dcc_extract.py first')
    return json.loads(MANIFEST.read_text(encoding='utf-8'))


def out_path(entry: dict) -> Path | None:
    """Where the manifest says this source's text went."""
    for field in ('out', 'output', 'text', 'path'):
        name = entry.get(field)
        if name:
            p = SOURCE / name
            if p.exists():
                return p
    return None


def sources() -> list[tuple[str, dict, Path]]:
    rows = []
    for key, entry in load_manifest().items():
        if not isinstance(entry, dict):
            continue
        p = out_path(entry)
        if p:
            rows.append((key, entry, p))
    return rows


def inventory() -> None:
    print('=' * 78)
    print('1. RESOURCES — extracted vs used')
    print('=' * 78)
    rows = sources()
    by_cat: dict[str, list[tuple[str, dict, Path]]] = defaultdict(list)
    for key, entry, p in rows:
        by_cat[category(key)].append((key, entry, p))

    total = 0
    for cat in ('syllabus', 'lecture file', 'lab manual', 'book'):
        group = by_cat.get(cat, [])
        chars = sum(e.get('chars', 0) or 0 for _, e, _ in group)
        total += chars
        files = len({k.split('#')[0] for k, _, _ in group})
        print(f'  {cat:<14} {len(group):>3} text file(s) from {files:>2} source(s)   '
              f'{chars:>10,} chars')
    print(f'  {"TOTAL":<14} {len(rows):>3} text file(s)                 {total:>10,} chars')
    print()

    # Is the site's text actually drawn from the lab manuals? Ask the chapters
    # for phrases only a lab manual would use, rather than guessing from vibes.
    chapters = '\n'.join(p.read_text(encoding='utf-8') for p in sorted(SITE.glob('ch*.js')))
    probes = ['lab manual', 'Lab 1', 'Lab 2', 'Lab 3', 'Lab 4', 'Lab 5', 'Lab 6',
              'practical', 'sockets', 'Java RMI']
    print('  Lab manuals used in the portal?')
    for probe in probes:
        n = len(re.findall(probe, chapters, re.I))
        print(f'    {probe:<14} {n:>3} mention(s)')
    print()

    print('  Books cited in the portal?')
    for probe in ('Tanenbaum', 'Kindberg', 'Coulouris', 'Hwang',
                  'Theory and Practice', 'Kai Hwang'):
        n = len(re.findall(probe, chapters, re.I))
        print(f'    {probe:<20} {n:>3} mention(s)')
    print()

    print('  Units with NO source deck at all:')
    have = {chapter_of(k) for k, _, _ in rows if category(k) == 'lecture file'}
    for n in range(1, 10):
        if n not in have:
            print(f'    Unit {n}  (written from other units\' decks and the textbooks)')
    print()


def figures_for(n: int) -> dict:
    p = SITE / f'ch{n}.js'
    if not p.exists():
        return {'figures': 0, 'bytes': 0}
    t = p.read_text(encoding='utf-8')
    return {'figures': len(re.findall(r'<figure', t)), 'bytes': len(t)}


def diagram_gap() -> None:
    print('=' * 78)
    print('2. DIAGRAMS — source diagrams vs figures drawn')
    print('=' * 78)

    # --- slide decks ---
    try:
        from pptx import Presentation
    except ImportError:
        Presentation = None

    deck_stats: dict[int, dict] = {}
    if Presentation:
        print('  slide decks (signal: a picture shape on the slide)')
        print(f'    {"deck":<44}{"slides":>7}{"w/pic":>7}{"pic only":>10}{"txt+pic":>9}')
        totals = Counter()
        for key, _, _ in sources():
            if not re.search(r'\.(pptx|ppt)\b', key, re.I):
                continue
            rel = key.split('#')[0].replace('\\', '/')
            path = DCC / rel
            if not path.exists() or path.suffix.lower() != '.pptx':
                continue  # legacy .ppt needs PowerPoint; python-pptx cannot open it
            prs = Presentation(str(path))
            stats = Counter()
            for slide in prs.slides:
                stats['slides'] += 1
                text = ' '.join(sh.text_frame.text for sh in slide.shapes
                                if sh.has_text_frame).strip()
                has_pic = any(
                    sh.shape_type == 13 or getattr(sh, 'image', None) is not None
                    for sh in slide.shapes)
                if has_pic:
                    stats['pic'] += 1
                    stats[('only' if len(text) < TEXT_LIGHT else 'both')] += 1
            deck_stats[chapter_of(key) or 0] = dict(stats)
            totals.update({k: v for k, v in stats.items() if isinstance(k, str)})
            name = path.name if len(path.name) < 42 else path.name[:39] + '...'
            print(f'    {name:<44}{stats["slides"]:>7}{stats["pic"]:>7}'
                  f'{stats["only"]:>10}{stats["both"]:>9}')
        print(f'    {"TOTAL":<44}{totals["slides"]:>7}{totals["pic"]:>7}'
              f'{totals["only"]:>10}{totals["both"]:>9}')
        print(f'    (legacy .ppt decks excluded: python-pptx cannot open them)')
        print()

    # --- PDFs ---
    print(f'  lecture PDFs (signal: a page with > {DIAGRAM_PATHS} vector paths)')
    try:
        import pypdfium2 as pdfium
        IMAGE = pdfium.raw.FPDF_PAGEOBJ_IMAGE
        PATH = pdfium.raw.FPDF_PAGEOBJ_PATH
        pdf_pages = pdf_diagram = 0
        for p in sorted(DCC.rglob('*.pdf')):
            if category(str(p)) in ('book', 'syllabus'):
                continue
            doc = pdfium.PdfDocument(str(p))
            diagram_pages = 0
            for i in range(len(doc)):
                page = doc[i]
                if len(list(page.get_objects(filter=(PATH,)))) > DIAGRAM_PATHS:
                    diagram_pages += 1
            pdf_pages += len(doc)
            pdf_diagram += diagram_pages
            name = p.name if len(p.name) < 42 else p.name[:39] + '...'
            print(f'    {name:<44}{len(doc):>4} pages{diagram_pages:>6} diagram page(s)')
        print(f'    {"TOTAL":<44}{pdf_pages:>4} pages{pdf_diagram:>6} diagram page(s)')
        print()
    except ImportError:
        pdf_diagram = 0
        print('    (pypdfium2 not installed — skipped)')
        print()

    # --- what the chapters have ---
    print('  per unit: picture text recovered vs figures drawn')
    print(f'    {"unit":<7}{"marks":>6}{"picture-blocks":>16}{"chars":>8}{"figures":>9}')
    blocks_total = chars_total = figs_total = 0
    for n in range(1, 10):
        # "picture-blocks" counts the [in the slide picture] blocks the extractor
        # wrote, which only exist where a slide carried text inside an image.
        blocks = chars = 0
        for key, _, p in sources():
            if chapter_of(key) != n:
                continue
            t = p.read_text(encoding='utf-8', errors='replace')
            found = re.findall(r'\[in the slide picture\]\s*(.*)', t)
            blocks += len(found)
            chars += sum(len(f) for f in found)
        f = figures_for(n)
        blocks_total += blocks
        chars_total += chars
        figs_total += f['figures']
        marks = MEDIA.get(n, '?')
        print(f'    ch{n:<5}{marks:>6}{blocks:>16}{chars:>8,}{f["figures"]:>9}')
    print(f'    {"TOTAL":<7}{"":>6}{blocks_total:>16}{chars_total:>8,}{figs_total:>9}')
    print()
    slide_diagrams = sum(d.get('pic', 0) for d in deck_stats.values())
    print(f'  diagram-bearing source slides: {slide_diagrams}')
    print(f'  diagram-bearing source PDF pages: {pdf_diagram}')
    print(f'  figures drawn on the site: {figs_total}')
    denom = slide_diagrams + pdf_diagram
    if denom:
        print(f'  coverage: {figs_total}/{denom} = {100 * figs_total / denom:.1f}%')
    print()


def past_gap() -> None:
    print('=' * 78)
    print('3. PAST QUESTIONS — papers known vs cards on the site')
    print('=' * 78)

    # Cards on the site. A question containing an apostrophe is written with
    # double quotes, so both quote styles have to be read or a card goes unseen.
    #
    # A card holds two kinds of wording: its own `q:`, and the `q:` of every
    # entry in its `occ` trail - a question set in a later paper in different
    # words. Both are wordings the site carries, so both are read here.
    # Comparing against the primary ones alone reports a merged paper wording as
    # missing when it is on the page, which is the bug this used to have.
    mine: list[str] = []
    prim: list[str] = []
    for n in range(1, 10):
        t = (SITE / f'ch{n}.js').read_text(encoding='utf-8')
        blk = t[t.index('  past: ['):]
        mine += [m.group(1) or m.group(2) for m in
                 re.finditer(r'''q: (?:'([^']*)'|"([^"]*)")''', blk)]
        prim += [m.group(1) or m.group(2) for m in
                 re.finditer(r'''^\s{6}q: (?:'([^']*)'|"([^"]*)"),?$''', blk, re.M)]
    print(f'  cards on the site: {len(prim)}  (wordings held: {len(mine)})')

    # The syllabus's printed paper: count its questions from the extracted text.
    # The OCR of this scan cannot be trusted on the numerals - it renders 1 as
    # `l` or `I`, 10 as `IO` and 11 as `I I` - so the pattern accepts a 1-to-3
    # character token followed by a full stop or comma, and the group headers
    # are read separately because they state the structure outright
    # (`2*4=8`, `Answer any 7 questions`, `Answer any three questions`).
    syl = next((p for _, _, p in sources() if 'syllabus' in p.name), None)
    paper_qs = 0
    if syl:
        t = syl.read_text(encoding='utf-8', errors='replace')
        head = t.find('Group A')
        body = t[head:] if head >= 0 else ''
        numbered = re.findall(r'(?m)^\s*([A-Za-z0-9][A-Za-z0-9 ]{0,2})[.,]\s+(\S.{14,})$', body)
        paper_qs = len(numbered)
    print(f'  questions printed on the Model Question 2025: {paper_qs}')
    if syl:
        for line in re.findall(r'(?m)^\s*Group [ABC]:.*$', syl.read_text(encoding='utf-8', errors='replace')):
            print(f'    {line.strip()}')
    print()

    # The old site: cards the portal does not have.
    if not OLD_SITE.is_dir():
        print('  old site not present; nothing to compare')
        return
    # Tokenisation lives here rather than in the import tool: matching wordings
    # is what an audit does, and reading the old site is not.
    def toks(s: str) -> set[str]:
        s = re.sub(r'\[[^\]]*\]', ' ', s)
        s = re.sub(r'[^a-z0-9 ]', ' ', s.lower())
        return {w for w in s.split() if len(w) > 3}

    sys.path.insert(0, str(ROOT / 'tools'))
    try:
        from import_old_site_past import classify, load
    except Exception as exc:
        print(f'  could not import tools/import_old_site_past.py: {exc}')
        return

    cards = load()
    by_label = Counter(c['year'] for c in cards)
    kind = Counter(classify(c['year']) for c in cards)
    print(f'  cards on the OLD site: {len(cards)}  ('
          + ', '.join(f'{k}={v}' for k, v in kind.most_common()) + ')')
    for label, n in by_label.most_common():
        print(f'    {label:<32} {n:>3}  [{classify(label)}]')
    print()

    def best_of(ct: set[str], pool: list[set[str]]) -> float:
        return max((len(ct & mt) / len(ct | mt) if ct and mt else 0 for mt in pool),
                   default=0)

    mine_tokens = [toks(q) for q in mine]
    prim_tokens = [toks(q) for q in prim]
    missing = []
    variant_only = []
    for c in cards:
        ct = toks(c['q'])
        best = best_of(ct, mine_tokens)
        if best < 0.5:
            missing.append((c, best))
        elif best_of(ct, prim_tokens) < 0.5:
            variant_only.append((c, best))
    print(f'  old-site cards NOT on the site: {len(missing)}')
    per_ch = Counter(c['chapter'] for c, _ in missing)
    if per_ch:
        print('    by unit: ' + '  '.join(f'ch{n}:{k}' for n, k in sorted(per_ch.items())))
    print(f'  cards held only as an occurrence wording: {len(variant_only)}'
          '  (present, in a merged card\'s `occ` trail)')
    for c, best in variant_only:
        print(f'    [{best:.2f}] {c["year"]:<20} {c["q"][:74]}')
    print()


MEDIA = {1: 6, 2: 10, 3: 6, 4: 6, 5: 6, 6: 8, 7: 6, 8: 8, 9: 4}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--diagrams', action='store_true', help='only the diagram gap')
    ap.add_argument('--past', action='store_true', help='only the question gap')
    ap.add_argument('--inventory', action='store_true', help='only the resource list')
    args = ap.parse_args()
    only = args.diagrams or args.past or args.inventory
    if not only or args.inventory:
        inventory()
    if not only or args.diagrams:
        diagram_gap()
    if not only or args.past:
        past_gap()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
