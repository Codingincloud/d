#!/usr/bin/env python3
"""Measure every section's teaching depth, so "too short" is a number not a mood.

"Teach properly, not too short and not very long, at the pace of a teacher who
understands everything" is a real requirement and an unfalsifiable one until it
is measured. This turns it into numbers per section, each with a threshold that
can be argued with:

*   **Words of prose.** A section teaching one exam sub-topic lands around
    150-450 words, plus its tables and figures - one lecture's worth of
    explanation written out. Under `--thin` it is a stub; over `--long` it is a
    wall of text that should have been two sections.
*   **Coverage.** What fraction of the words *inside the slides placed in this
    section* also appear in the section's prose. This is the "extracted AND
    properly placed" check: the extraction recovered that text from the deck,
    and coverage asks whether the note beside the diagram is about the same
    thing. A low number means a diagram landed somewhere that does not explain
    it - the exact failure the placement work exists to prevent.
*   **Support.** The fraction of the section's own content words that occur
    anywhere in the course sources. Below this, a section is prose that the
    teacher's material does not back, which is either my writing or my mistake.
*   **Figures.** Drawn diagrams plus slides placed in the section. Reported, not
    judged: a section about an architecture with no diagram is suspicious, but a
    definition section needs none.

    python tools/audit_dcc_teaching.py                 # the table
    python tools/audit_dcc_teaching.py --unit 4        # one unit
    python tools/audit_dcc_teaching.py --thin 120 --long 800
    python tools/audit_dcc_teaching.py --json          # for other tools
"""
from __future__ import annotations

import argparse
import collections
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
from place_dcc_figures import (                                    # noqa: E402
    ANCHORS, EXTRAS, FIGURES, SITE, SOURCE, learn_bounds, plain,
    source_texts, strip_figures, tokenize, top_level,
)

EXTRA_HEADINGS = ([g['heading'] for g in json.loads(
    EXTRAS.read_text(encoding='utf-8'))['groups']] if EXTRAS.exists() else [])

THIN = 150          # a section below this is a stub, not a lesson
LONG = 900          # a whole section above this is a wall of text
LONG_RUN = 420      # and so is any stretch of prose this long without a heading
MIN_COVER = 0.30    # the note beside a diagram must be about the diagram
MIN_SUPPORT = 0.45  # the section's own words must exist in the sources
MIN_SLIDE_WORDS = 25  # under this a figure has no text to score against at all

FIG_RE = re.compile(r'<!-- dcc-fig:(.*?) -->')


def sections_of(body: str) -> list[dict]:
    """Every section with its prose, tables, boxes and figures, as on the page."""
    out: list[dict] = []
    by_key: dict[tuple[str, str], dict] = {}
    h2 = h3 = h4 = ''
    for start, end, tag in top_level(body):
        raw = body[start:end]
        text = plain(raw)
        if tag == 'h2':
            h2, h3, h4 = text, '', ''
            continue
        if tag == 'h3':
            h3, h4 = text, ''
            continue
        if tag == 'h4':
            # A sub-heading breaks the page without breaking the topic, which is
            # the difference between a long section and a wall of text.
            h4 = text
            continue
        key = (h2, h3)
        section = by_key.get(key)
        if section is None:
            section = by_key[key] = {'h2': h2, 'h3': h3, 'prose': [], 'tables': 0,
                                     'boxes': 0, 'drawn': 0, 'slides': [], 'words': 0,
                                     'runs': []}
            out.append(section)
        if tag == 'figure':
            # The marker comment sits *before* the figure it labels, so the
            # placed-slide count has to be read from the text just above it.
            marker = FIG_RE.search(body[max(0, start - 300):start])
            if marker:
                section['slides'].append(marker.group(1))
            else:
                section['drawn'] += 1
            continue
        if tag not in ANCHORS or not text:
            continue
        section['prose'].append(text)
        # Prose since the last heading of any kind: what the reader actually
        # faces without a break. A section of 1,500 words in six chunks is fine;
        # one paragraph of 600 words is not.
        #   a sentinel, not the current heading: the first block of a section
        #   always starts a run, even when the section has no sub-heading yet.
        run = section.setdefault('_run', [None, 0])
        if run[0] != h4:
            run[0] = h4
            section['runs'].append(0)
        section['runs'][-1] += len(text.split())
        if tag == 'table':
            section['tables'] += 1
        elif tag == 'div':
            section['boxes'] += 1
    for section in out:
        section['text'] = ' '.join(section['prose'])
        section['words'] = len(section['text'].split())
        section['maxrun'] = max(section['runs'] or [0])
        section.pop('_run', None)
    # A parent section's lead-in is *meant* to be short: its subsections carry
    # the teaching. Judging it against a subsection's floor would flag every
    # well-organised unit, so the two are reported apart.
    for i, section in enumerate(out):
        key = (section['h2'], section['h3'])
        section['children'] = sum(1 for other in out[i + 1:]
                                  if other['h2'] == key[0] and other['h3']) \
            if not section['h3'] else 0
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--unit', type=int, help='only this unit')
    ap.add_argument('--thin', type=int, default=THIN)
    ap.add_argument('--long', type=int, default=LONG)
    ap.add_argument('--json', action='store_true', help='raw numbers, for other tools')
    ap.add_argument('--list-thin', type=int, help='show at most this many thin sections')
    args = ap.parse_args()

    manifest = {f['name']: f for f in json.loads(FIGURES.read_text(encoding='utf-8'))
                if f.get('kept')}
    texts = source_texts()

    # Everything the teacher's material says, for the support measure. The books
    # are included: a term the notes use that only a book uses is still sourced.
    corpus: set[str] = set()
    for path in sorted(SOURCE.glob('*.txt')):
        corpus.update(tokenize(path.read_text(encoding='utf-8', errors='replace')))
    # Slide pictures carry words too, and those live in the images, not the text.
    for f in manifest.values():
        key = ('slide', f['slide']) if f['kind'] == 'slide' else ('pdf', f['page'])
        corpus.update(tokenize(texts.get(f['source'], {}).get(key, '')))

    units = [args.unit] if args.unit else list(range(1, 10))
    rows: list[dict] = []
    for n in units:
        path = SITE / f'ch{n}.js'
        if not path.exists():
            continue
        body = strip_figures_stale(path)
        for s in sections_of(body):
            own = set(tokenize(s['text']))
            slides = [manifest[name] for name in s['slides'] if name in manifest]
            source_words: set[str] = set()
            for f in slides:
                key = ('slide', f['slide']) if f['kind'] == 'slide' else ('pdf', f['page'])
                source_words.update(tokenize(texts.get(f['source'], {}).get(key, '')))
            supported = len(own & corpus) / len(own) if own else 1.0
            rows.append({
                'unit': n,
                'label': ' > '.join(b for b in (s['h2'], s['h3']) if b) or '(untitled)',
                'words': s['words'],
                'maxrun': s['maxrun'],
                'children': s['children'],
                'paragraphs': len(s['prose']),
                'tables': s['tables'],
                'boxes': s['boxes'],
                'drawn': s['drawn'],
                'slides': len(s['slides']),
                'coverage': (len(own & source_words) / len(source_words)
                             if source_words else None),
                # How much text the placed figures carry between them. A low
                # coverage score on a section whose figures hold almost no
                # words says nothing about the note; this is what tells the two
                # apart, so it is recorded per row rather than inferred.
                'slide_words': len(source_words),
                'support': round(supported, 3),
            })

    if args.json:
        print(json.dumps(rows, indent=1))
        return 0

    per_unit: dict[int, list[dict]] = collections.defaultdict(list)
    for r in rows:
        per_unit[r['unit']].append(r)

    print(f'{len(rows)} sections across {len(per_unit)} units')
    print()
    print(f'{"unit":<6}{"sects":>6}{"words":>8}{"median":>8}{"min":>6}{"max":>7}'
          f'{"tables":>8}{"boxes":>7}{"drawn":>7}{"slides":>8}')
    for u in sorted(per_unit):
        in_unit = per_unit[u]
        w = sorted(r['words'] for r in in_unit)
        print(f'  ch{u:<4}{len(in_unit):>6}{sum(w):>8}{w[len(w) // 2]:>8}{w[0]:>6}{w[-1]:>7}'
              f'{sum(r["tables"] for r in in_unit):>8}'
              f'{sum(r["boxes"] for r in in_unit):>7}'
              f'{sum(r["drawn"] for r in in_unit):>7}'
              f'{sum(r["slides"] for r in in_unit):>8}')
    w = sorted(r['words'] for r in rows)
    print()
    print(f'total {sum(w):,} words of prose, median {w[len(w) // 2]}, mean {sum(w) // len(w)}')

    # A section is only thin as prose if it is meant to be prose. The labelled
    # off-syllabus buckets are appendices whose whole job is to say what they
    # are and stop, so they are excluded here and from the misfiling count, and
    # reported separately instead.
    extras = [r for r in rows
              if any(h in r.get('label', '') for h in EXTRA_HEADINGS)]
    prose = [r for r in rows if r not in extras]

    thin = [r for r in prose if r['words'] < args.thin and not r['children']]
    leads = [r for r in prose if r['words'] < args.thin and r['children']]
    long_ = [r for r in prose if r['words'] > args.long or r['maxrun'] > LONG_RUN]
    unsupported = [r for r in prose if r['support'] < MIN_SUPPORT]
    misplaced = [r for r in prose if r['slides'] and (r['coverage'] or 0) < MIN_COVER]

    # A low shared-vocabulary score has two very different causes, and they need
    # separating or the number overstates the problem. Either the note beside the
    # figure is about something else - a real misfiling - or the figure itself
    # carries almost no recoverable text (a picture-only slide, or a scan whose
    # OCR is noise), in which case there is nothing to share and the score is a
    # statement about the slide, not the placement. The second kind is placed by
    # its position in its own deck, which is the only evidence available.
    unreadable = [r for r in misplaced if r['slide_words'] < MIN_SLIDE_WORDS]
    misfiled = [r for r in misplaced if r['slide_words'] >= MIN_SLIDE_WORDS]
    print(f'content sections under {args.thin} words: {len(thin)}    '
          f'with a run over {LONG_RUN} words: {len(long_)}    '
          f'(short lead-ins to a group: {len(leads)})')
    print(f'support < {MIN_SUPPORT:.2f}: {len(unsupported)}    '
          f'slides placed here but the note does not discuss them: {len(misplaced)}'
          f'  ({len(unreadable)} of them a figure with under {MIN_SLIDE_WORDS} words of '
          f'its own, placed by its deck position)')
    if extras:
        print(f'off-syllabus extras section: {sum(r["slides"] for r in extras)} slides '
              f'in {len(extras)} labelled section (excluded above)')
    if misfiled:
        print(f'sections the note contradicts (figure has text of its own): {len(misfiled)}')

    # The reading question a phone actually asks is how long a paragraph is,
    # not how many words sit between two sub-headings: a 700-word stretch with
    # five paragraphs in it reads fine, while one 400-word paragraph does not.
    # Report the paragraphs directly, so "not too long" is a measurement.
    paras = []
    for n in range(1, 10):
        path = SITE / f'ch{n}.js'
        if not path.exists():
            continue
        body = re.sub(r'<svg\b.*?</svg>', ' ', path.read_text(encoding='utf-8'), flags=re.S)
        for m in re.finditer(r'<p\b[^>]*>(.*?)</p>', body, re.S):
            paras.append((len(re.sub(r'<[^>]+>', ' ', m.group(1)).split()), n))
    pw = sorted(w for w, _ in paras)
    print()
    print(f'{len(paras)} paragraphs, median {pw[len(pw) // 2]}w, mean {sum(pw) // len(pw)}w, '
          f'max {pw[-1]}w; over 250w: {sum(1 for w in pw if w > 250)}   '
          f'over 300w: {sum(1 for w in pw if w > 300)}')

    limit = args.list_thin or 0
    if limit:
        print(f'\nthinnest {limit} content sections:')
        for r in sorted(thin, key=lambda r: r['words'])[:limit]:
            print(f'  {r["words"]:>5}w  ch{r["unit"]}  {r["label"][:74]:<76}'
                  f'para={r["paragraphs"]} tbl={r["tables"]} dr={r["drawn"]} '
                  f'sl={r["slides"]}')
        # Sorted by how many figures are at stake, not by the ratio. A section
        # holding one picture-only slide scores low on shared vocabulary however
        # well the note explains it, because there is almost no text in the
        # slide to share; a section holding seven is a pile worth looking at.
        print(f'\nsections with slides but little shared vocabulary:')
        for r in sorted(misplaced, key=lambda r: (-r['slides'], r['coverage']))[:limit]:
            mark = 'unreadable' if r['slide_words'] < MIN_SLIDE_WORDS else 'REVIEW'
            print(f'  cov={r["coverage"]:.2f}  ch{r["unit"]}  {r["label"][:66]:<68}'
                  f'slides={r["slides"]} words={r["words"]} '
                  f'slide_words={r["slide_words"]} [{mark}]')
        print('\nleast supported sections:')
        for r in sorted(unsupported, key=lambda r: r['support'])[:limit]:
            print(f'  sup={r["support"]:.2f}  ch{r["unit"]}  {r["label"][:74]:<76}'
                  f'words={r["words"]}')
        print(f'\nlongest unbroken runs of prose (a heading every ~{LONG_RUN} words is fine):')
        for r in sorted(rows, key=lambda r: -r['maxrun'])[:limit]:
            print(f'  run={r["maxrun"]:>4}  total={r["words"]:>5}  ch{r["unit"]}  '
                  f'{r["label"][:70]:<72} tbl={r["tables"]} sl={r["slides"]}')
    return 0


def strip_figures_stale(path: Path) -> str:
    """The Learn body as it is on disk, with the wrapper comments left in place.

    The placement tool's own `strip_figures` removes the figures, which is what
    matching wants and exactly what this audit must not do: the question here is
    which figures are on the page. Only the tool's markers are dropped, and the
    `figure` elements they wrap are read by `sections_of`.
    """
    text = path.read_text(encoding='utf-8')
    start, close = learn_bounds(text)
    return text[start:close]


if __name__ == '__main__':
    raise SystemExit(main())
