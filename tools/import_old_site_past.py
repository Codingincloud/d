#!/usr/bin/env python3
"""Read the old DCC website's past-question cards into the evidence layer.

Why this exists
---------------
dcc/dcc-website_v2/ is the site the user had before this one: nine chapter files
plus an entry page, 176 KB. It is an INPUT, and tools/dcc_extract.py does not
read it - that tool handles pptx/pdf/ppt, and this is JavaScript. So for a while
the new portal was built as if this folder did not exist, and the most valuable
thing in it went unnoticed:

every card there carries a *paper label*, and its labels are not the syllabus's.
The syllabus prints one Model Question 2025. The old site records questions from
"2025 Final Exam" as well, and a further set of "Expected" / "Teacher Notes"
questions. Sixteen of its thirty-three entries are the Model paper (already in
the portal, wording for wording); the rest are not in the portal at all.

This tool exists because reading that folder by eye is how a whole paper gets
missed. It writes everything it finds to _source/dcc/, one line per question,
with the paper label, the marks and the answer's length - so the material is
greppable, diffable and reviewable, and so the next round of work starts from
the evidence rather than from a memory of the old site.

It deliberately does NOT decide whether a label can be trusted. "2025 Final
Exam" is a claim made by the old site, not by the syllabus; only the person who
sat the exam can confirm it. That judgement belongs on the record, so `--report`
prints the labels it found and how many questions each carries.

Usage
-----
    python tools/import_old_site_past.py --report      # just describe what is there
    python tools/import_old_site_past.py               # write the evidence files
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD_SITE = ROOT / 'dcc' / 'dcc-website_v2'
OUT_DIR = ROOT / '_source' / 'dcc'

# One card is a JS object literal:
#   { "year": "...", "q": "...", "marks": "...", "answer": "..." }
# The answer is the only field that can contain a brace or a nested quote, and it
# is always last, so it is captured greedily up to the final `"` on the line
# before the closing brace.
CARD_RE = re.compile(
    r'\{\s*"year":\s*"(?P<year>[^"]*)"\s*,'
    r'\s*"q":\s*"(?P<q>.*?)"\s*,'
    r'\s*"marks":\s*"(?P<marks>[^"]*)"\s*,'
    r'\s*"answer":\s*"(?P<answer>.*?)"\s*\}',
    re.S,
)

# Labels that name a paper the student actually sat, versus labels that name a
# guess at one. Kept as one list so the distinction is visible in the code and
# not buried in a scatter of conditionals.
SITTEN = ('model', 'final')
PREDICTED = ('expected', 'teacher')


def unescape(text: str) -> str:
    """The old site's answers are JS string bodies: \\n, \\" and \\u2014."""
    text = text.replace('\\u2014', '\u2014').replace('\\u2019', '\u2019')
    text = text.replace('\\"', '"').replace("\\'", "'")
    text = text.replace('\\n', '\n').replace('\\/', '/')
    return re.sub(r'\s+', ' ', text).strip()


def strip_tags(html: str) -> str:
    html = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', html, flags=re.S | re.I)
    html = re.sub(r'<br\s*/?>|</(p|li|tr|h[1-6]|div)>', '\n', html, flags=re.I)
    html = re.sub(r'<[^>]+>', ' ', html)
    html = html.replace('&nbsp;', ' ').replace('&mdash;', '\u2014')
    html = html.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    return '\n'.join(line.strip() for line in html.splitlines() if line.strip())


def load() -> list[dict]:
    cards: list[dict] = []
    for path in sorted(OLD_SITE.glob('ch*.js')):
        text = path.read_text(encoding='utf-8', errors='replace')
        # Only the past array: the quiz answers look similar and are not papers.
        start = text.find('past:')
        if start < 0:
            continue
        block = text[start:]
        for m in CARD_RE.finditer(block):
            cards.append({
                'chapter': int(re.sub(r'\D', '', path.stem) or 0),
                'year': unescape(m.group('year')),
                'marks': unescape(m.group('marks')),
                'q': unescape(m.group('q')),
                'answer_chars': len(strip_tags(unescape(m.group('answer')))),
            })
    return cards


def classify(label: str) -> str:
    low = label.lower()
    if any(w in low for w in SITTEN):
        return 'paper'
    if any(w in low for w in PREDICTED):
        return 'predicted'
    return 'unlabelled'


def main() -> int:
    if not OLD_SITE.is_dir():
        print(f'not found: {OLD_SITE}', file=sys.stderr)
        return 1

    cards = load()
    by_kind = Counter(classify(c['year']) for c in cards)
    by_label = Counter(c['year'] for c in cards)

    print(f'old site: {OLD_SITE.relative_to(ROOT)}')
    print(f'cards found: {len(cards)}')
    print()
    print('by label:')
    for label, n in by_label.most_common():
        print(f'  {label:<30} {n:>3}   [{classify(label)}]')
    print()
    print('by kind:')
    for kind, n in by_kind.most_common():
        print(f'  {kind:<30} {n:>3}')
    print()
    print('per chapter:')
    for ch in range(1, 10):
        n = sum(1 for c in cards if c['chapter'] == ch)
        print(f'  ch{ch}: {n}')

    if '--report' in sys.argv:
        print()
        print('questions, by label:')
        for label in by_label:
            print(f'\n--- {label} [{classify(label)}] ---')
            for c in cards:
                if c['year'] == label:
                    print(f"  ch{c['chapter']}  {c['marks']:>2}m  {c['q'][:84]}")
        return 0

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # JSON is the machine-readable form; the text file is the one a person reads
    # and greps, because the question wording is what the portal has to match.
    (OUT_DIR / 'old_site_past_questions.json').write_text(
        json.dumps(cards, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    lines = [
        'Past questions from dcc/dcc-website_v2/ (the site that preceded this one).',
        '',
        'Written by tools/import_old_site_past.py. The paper labels are the OLD',
        "SITE'S claims, not the syllabus's: the syllabus prints only the Model",
        'Question 2025. Labels naming a paper that was actually sat are marked',
        '[paper]; labels naming a guess at one are marked [predicted]. Only the',
        'person who sat the exam can settle the difference.',
        '',
        f'cards: {len(cards)}   ' + '   '.join(f'{k}={v}' for k, v in by_kind.most_common()),
        '',
        '=' * 78,
    ]
    for label in by_label:
        lines.append('')
        lines.append(f'### {label}   [{classify(label)}]   {by_label[label]} question(s)')
        lines.append('')
        for c in cards:
            if c['year'] != label:
                continue
            lines.append(f"ch{c['chapter']}  {c['marks']:>3} marks  {c['q']}")
    (OUT_DIR / 'old_site_past_questions.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')

    print()
    print('wrote:')
    print(f'  {(OUT_DIR / "old_site_past_questions.json").relative_to(ROOT)}')
    print(f'  {(OUT_DIR / "old_site_past_questions.txt").relative_to(ROOT)}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
