#!/usr/bin/env python3
"""Put the extracted slide images into the DCC chapters' Learn content.

`tools/extract_dcc_figures.py` produces the images and `FIGURES.json`; this turns
that manifest into markup and appends one section per unit. The two are separate
tools because they fail differently: extraction fails on a deck, wiring fails on
a chapter file, and re-running the cheap one after editing the expensive one's
output is the normal way to work here.

Where the section goes, and why not inline
------------------------------------------
Each unit gets one `<h2>Slides from the teacher's deck</h2>` section at its end,
in slide order. Inline placement - each slide next to the note that explains it -
would read better, and it is the obvious next step, but it is not what this does:
matching a slide to a note needs a judgement about content, and a drawing filed
under the wrong heading teaches the wrong thing. A wrong diagram is worse than a
distant one, so the honest default is a section that claims nothing about which
note a slide belongs to.

Idempotent
----------
The block is bounded by `<!-- dcc-slides:start -->` / `<!-- dcc-slides:end -->` and
rewritten whole, so running this twice does not stack two copies, and re-running
after a change to the extraction is how the pages are regenerated.

    python tools/wire_dcc_figures.py --dry-run     # describe what would change
    python tools/wire_dcc_figures.py               # write the chapters
    python tools/wire_dcc_figures.py --revert      # remove the sections again
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'dcc-site'
FIGURES = ROOT / 'assets' / 'dcc-slides' / 'FIGURES.json'
START = '<!-- dcc-slides:start -->'
END = '<!-- dcc-slides:end -->'
# From dcc-site/index.html the shared assets are one level up. build_deploy
# re-bases this to `assets/...` when it bundles the entry from the output root.
ASSET = '../assets/dcc-slides/'

HEADING = 'Slides from the teacher\'s deck'


def usable_caption(text: str) -> str:
    """The slide's text, unless it is really just its own number.

    A deck that puts "17" in a corner as a page marker gives that as the slide's
    first text frame, and a caption reading `slide 17 - 17` is noise. Anything
    shorter than a phrase is treated as no caption at all, which sends the image
    down the described-alt path instead.
    """
    text = (text or '').strip()
    if len(text) < 6:
        return ''
    if re.fullmatch(r'[\d\s.,:/-]+', text):
        return ''
    # "Contd.." is a length that passes every other test and describes nothing.
    if re.fullmatch(r'cont(inued)?\.*', text, re.I):
        return ''
    return text


def block_for(unit: int, figures: list[dict]) -> str:
    slides = sum(1 for f in figures if f['kind'] == 'slide')
    pages = sum(1 for f in figures if f['kind'] == 'pdf')
    what = []
    if slides:
        what.append(f'{slides} slide{"s" if slides != 1 else ""}')
    if pages:
        what.append(f'{pages} lecture page{"s" if pages != 1 else ""}')
    out = [
        START,
        # quote=False: an apostrophe is not special in text content, and escaping
        # it puts &#x27; in the source where the word it belongs to should be.
        f'<h2>{html.escape(HEADING, quote=False)}</h2>',
        f'<p class="unit-meta">Every diagram from this unit\'s own material that is '
        f'identifiable as one &mdash; {" and ".join(what)}, shown as they were taught. '
        f'On a narrow screen they scroll sideways and open full screen; the notes above '
        f'are the explanation, these are the originals.</p>',
    ]
    for f in figures:
        w, h = f['px'].split('x')
        where = (f'slide {f["slide"]}' if f['kind'] == 'slide' else f'page {f["page"]}')
        source = f['source']
        caption = usable_caption(f.get('caption') or '')
        # An empty alt on an image that a caption already describes, and a
        # described alt only where there is nothing else: that is what keeps a
        # screen reader from reading the same sentence twice.
        if caption:
            alt = ''
            tail = f' &mdash; {html.escape(caption)}'
        else:
            alt = f'Diagram from {source}, {where}'
            tail = ''
        out.append('<figure class="figure-wrap">')
        out.append(f'<img class="figure wide slide" src="{ASSET}{f["name"]}" '
                   f'alt="{html.escape(alt, quote=True)}" width="{w}" height="{h}" '
                   f'loading="lazy" decoding="async">')
        out.append(f'<figcaption><strong>{where}</strong> &middot; {html.escape(source)}'
                   f'{tail}</figcaption>')
        out.append('</figure>')
    out.append(END)
    return '\n'.join(out)


def strip_block(text: str) -> str:
    return re.sub(re.escape(START) + r'.*?' + re.escape(END) + r'\n?', '', text, flags=re.S)


def learn_bounds(text: str) -> tuple[int, int]:
    """The offsets of the learn template literal's content."""
    m = re.search(r'\n\s*learn:\s*`\n', text)
    if not m:
        sys.exit('wire_dcc_figures: no learn literal found')
    start = m.end()
    close = text.find('\n`', start)
    if close < 0:
        sys.exit('wire_dcc_figures: learn literal is not closed')
    return start, close


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--dry-run', action='store_true', help='describe, write nothing')
    ap.add_argument('--revert', action='store_true', help='remove the sections')
    args = ap.parse_args()

    if not FIGURES.exists():
        sys.exit(f'wire_dcc_figures: {FIGURES.relative_to(ROOT)} is missing - '
                 f'run tools/extract_dcc_figures.py first')

    manifest = json.loads(FIGURES.read_text(encoding='utf-8'))
    by_unit: dict[int, list[dict]] = defaultdict(list)
    for f in manifest:
        by_unit[int(f['unit'])].append(f)
    # Slide order, not manifest order: the manifest is written deck by deck, so a
    # unit whose material spans a deck and a PDF would otherwise interleave them.
    for figs in by_unit.values():
        figs.sort(key=lambda f: (f['kind'] != 'slide', f.get('slide') or f.get('page') or 0))

    changed = 0
    for n in range(1, 10):
        path = SITE / f'ch{n}.js'
        if not path.exists():
            continue
        text = path.read_text(encoding='utf-8')
        start, close = learn_bounds(text)
        head, body, tail = text[:start], text[start:close], text[close:]
        had = START in body
        figs = by_unit.get(n, [])
        # A unit with no images and no section is left byte-for-byte alone. It
        # used to be rewritten anyway, by the body normalisation below, which
        # showed up as "ch7 add 0 image(s)" and would have put two chapters into
        # the diff for no gain.
        if not figs and not had:
            print(f'  ch{n}  unchanged (no images)')
            continue
        body = strip_block(body).rstrip() + '\n\n'
        if figs and not args.revert:
            body += block_for(n, figs) + '\n'
        new = head + body + tail
        if new == text:
            print(f'  ch{n}  unchanged')
            continue
        changed += 1
        if args.revert:
            print(f'  ch{n}  remove the slides section')
        else:
            print(f'  ch{n}  {"replace" if had else "add"} {len(figs)} image(s)')
        if not args.dry_run:
            path.write_text(new, encoding='utf-8')
    print()
    print(f'{changed} chapter file(s) {"would change" if args.dry_run else "changed"}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
