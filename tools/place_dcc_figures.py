#!/usr/bin/env python3
"""Place each of the teacher's slides inline, beside the note it illustrates.

`tools/extract_dcc_figures.py` pulls the diagrams out of the decks and PDFs;
`tools/wire_dcc_figures.py` appended them in one section at the end of each unit,
which is safe but reads badly - a diagram three screens below the paragraph it
belongs to explains nothing. This tool puts each one next to the note that
explains it, as a `<figure class="figure-wrap">` with the same frame, reading cap
and full-screen viewer the hand-drawn SVG figures use.

The match, in three stages
--------------------------
The slide's own words are the query: the deck's text frames and, for a
picture-only slide, the OCR of the picture itself (kept in `_source/dcc/`),
scored against the notes as TF-IDF cosine similarity. One stage is not enough,
and each of these fixes a mistake the stage above it makes:

1.  **The unit, per source file.** A deck is a unit's material, and a file that
    is mostly one unit's must not be spread over nine because one page scores
    oddly elsewhere. `GFS_HDFS_Lecture.pdf` sits in the Chapter 1 folder and is
    entirely Unit 4's, and the reference cloud deck is Unit 5's for its first
    seven slides and Unit 7's for the twenty-four AWS slides after them. So each
    file is cut into contiguous runs, one unit per run, units never going
    backwards. Opening a run costs `SPLIT_PENALTY`, so a lone noisy page cannot
    peel itself off.
2.  **The section inside that unit** (`h3` under its `h2`, or the `h2` alone).
    A paragraph often does not name its own topic - the one under "Blocks" may
    say "64 MB" and never say "block" - so a whole section is scored as one
    document, which is a far more separable question than "which of 535
    paragraphs does this slide resemble".
3.  **The paragraph inside that section**, so the figure sits under the sentence
    it illustrates rather than at the end of the section.

Three rules keep the result honest:

*   **Order inside a file is sacred.** Within a run the sections are aligned by
    dynamic programming that forbids a later slide landing above an earlier one.
    A deck teaches in order, so slide 12 above slide 11 means the matcher is
    wrong, not the deck.
*   **A weak match is interpolated, not invented.** A slide that is nothing but
    a drawing has no words to match on. Those are placed between their confident
    neighbours in slide order, inside the same unit, and the count is reported -
    they are never given a heading they do not support.
*   **A figure only ever follows a paragraph, list, table or box**, never a
    heading, so a diagram can never separate a heading from the text it
    introduces. At most `PER_ANCHOR` sit under one paragraph; the extras move to
    another paragraph of the *same section*, never to a different topic.

Re-runnable: every placement is stripped and re-derived, so the markup can be
regenerated after the notes themselves are edited.

    python tools/place_dcc_figures.py --report     # match, write nothing
    python tools/place_dcc_figures.py              # write the chapters
    python tools/place_dcc_figures.py --revert     # remove every figure
"""
from __future__ import annotations

import argparse
import collections
import html
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'dcc-site'
SOURCE = ROOT / '_source' / 'dcc'
FIGURES = ROOT / 'assets' / 'dcc-slides' / 'FIGURES.json'
PINS = ROOT / 'tools' / 'dcc_figure_pins.json'
EXTRAS = ROOT / 'tools' / 'dcc_figure_extras.json'
# From dcc-site/index.html the shared assets are one level up; build_deploy
# re-bases this when it bundles the entry from the output root.
ASSET = '../assets/dcc-slides/'

FIG_OPEN = '<!-- dcc-fig:{} -->'
FIG_CLOSE = '<!-- /dcc-fig -->'
OLD_START = '<!-- dcc-slides:start -->'
EX_START = '<!-- dcc-fig-extras:start -->'
EX_END = '<!-- /dcc-fig-extras -->'
OLD_END = '<!-- dcc-slides:end -->'

# A figure lands after one of these - never after a heading, so no diagram can
# come between a heading and the text it introduces.
ANCHORS = {'p', 'ul', 'ol', 'dl', 'table', 'blockquote', 'pre',
           'div', 'figure', 'section', 'aside', 'details'}
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
        'meta', 'param', 'source', 'track', 'wbr'}
TAG_RE = re.compile(r'<(/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|\'[^\']*\'|[^>"\'])*?)(/?)>', re.S)
COMMENT_RE = re.compile(r'<!--.*?-->', re.S)

STOP = set("""
a about above after again against all also am an and any are as at be because been before being
below between both but by can cannot could did do does doing down during each few for from further had
has have having he her here hers herself him himself his how i if in into is it its itself just me more
most my myself no nor not now of off on once only or other ought our ours ourselves out over own same
she should so some such than that the their theirs them themselves then there these they this those
through to too under until up very was we were what when where which while who whom why will with would
you your yours yourself yourselves shall may might must one two three another use used using given etc
see seen shown show shows means mean way ways case cases part parts point points note notes example
examples thing things something anything nothing first second third next last figure table section
chapter unit slide page following follows like unlike rather instead thus hence however therefore
""".split())

# A term of art whose short form is the term itself.
KEEP_SHORT = {'vm', 'vms', 'io', 'ip', 'os', 'db', 'fs', 'rpc', 'rmi', 'gfs',
              'dns', 'ntp', 'cap', 'api', 'aws', 'soap', 'rest', 'uri', 'url',
              'sla', 'ids', 'ips', 'acl', 'iam', 'p2p', 'sid', 'hdfs', 'mqtt'}

# Trust a section for a match at least this strong; below it, interpolate.
CONFIDENT = 0.16
# A similarity below this is noise, and counts as no evidence at all when
# deciding which unit a file belongs to.
EVIDENCE_FLOOR = 0.06
# What a run's evidence must beat to justify opening a new one for its unit.
# Roughly two to four slides' worth of disagreement: measured against the real
# decks, 0.35 splits the reference cloud deck where it should be split (its
# first seven slides are cloud-introduction material, the twenty-four after them
# are AWS) and 0.8 does not.
SPLIT_PENALTY = 0.35
# A file stays in the unit its folder claims unless another unit wins on
# evidence. Small on purpose: at 0.06 it outweighs a real match on thirty
# slides and pins the reference cloud deck in Unit 5 against a 0.600 score in
# Unit 7.
HOME_PRIOR = 0.02
# How many diagrams may sit under one paragraph before the extras move on.
PER_ANCHOR = 3
# Cost of placing a figure in an earlier section than the figure before it, per
# section of the way back. Small enough that a much better match wins, large
# enough that a deck stays in order when two sections are roughly as good.
DROP = 0.04


# --------------------------------------------------------------------------- #
# text
# --------------------------------------------------------------------------- #
def tokenize(text: str) -> list[str]:
    out = []
    for tok in re.findall(r"[a-z][a-z0-9+#.\-]*", html.unescape(text or '').lower()):
        tok = tok.strip('.-')
        if not tok or tok in STOP:
            continue
        if len(tok) < 3 and tok not in KEEP_SHORT:
            continue
        # OCR noise: no vowel and long is a scan artefact, not a word.
        if len(tok) > 4 and not re.search(r'[aeiouy]', tok):
            continue
        out.append(tok)
    return out


def plain(html_text: str) -> str:
    """Visible text of a fragment, entities resolved."""
    text = COMMENT_RE.sub(' ', html_text)
    text = re.sub(r'<(script|style)\b.*?</\1>', ' ', text, flags=re.S | re.I)
    text = TAG_RE.sub(' ', text)
    return re.sub(r'\s+', ' ', html.unescape(text)).strip()


def top_level(html_text: str):
    """(start, end, tag) of every top-level element, in document order.

    The Learn content is a flat run of headings, paragraphs, lists, tables and
    boxes, so whether a tag opens at depth zero is enough to know it is a
    container - no parser needed. A stray close tag ends the element it was
    inside rather than derailing the rest of the walk, which matters because
    these files are hand-written.
    """
    out: list[tuple[int, int, str]] = []
    stack: list[tuple[int, str]] = []
    for m in TAG_RE.finditer(COMMENT_RE.sub(lambda c: ' ' * len(c.group(0)), html_text)):
        closing, tag = m.group(1) == '/', m.group(2).lower()
        self_closing = m.group(4) == '/' or tag in VOID
        if closing:
            if not stack:
                continue
            while stack and stack[-1][1] != tag:
                start, open_tag = stack.pop()
                if not stack:
                    out.append((start, m.end(), open_tag))
            if stack:
                start, open_tag = stack.pop()
                if not stack:
                    out.append((start, m.end(), open_tag))
        else:
            start = m.start() if not stack else stack[0][0]
            if not self_closing:
                stack.append((start, tag))
    return out


def usable_caption(text: str) -> str:
    """A slide's text, unless it is really just its own number."""
    text = (text or '').strip()
    if len(text) < 6 or re.fullmatch(r'[\d\s.,:/-]+', text):
        return ''
    if re.fullmatch(r'cont(inued)?\.*', text, re.I):
        return ''
    return text


# --------------------------------------------------------------------------- #
# sources
# --------------------------------------------------------------------------- #
def source_texts() -> dict[str, dict[tuple[str, int], str]]:
    """Every source's own text per slide or page, OCR included.

    The richest description of a slide is where it came from: a slide whose
    drawing is its whole content has empty text frames but real words inside the
    picture, and the extraction recorded those under the slide's own marker.
    Keyed by file name exactly as the manifest writes it, and by (kind, number)
    so a PDF page and a slide of the same number cannot collide.
    """
    out: dict[str, dict[tuple[str, int], str]] = {}
    for path in sorted(SOURCE.glob('*.txt')):
        head = path.open(encoding='utf-8', errors='replace').read(800)
        m = re.search(r'^source:\s*(.+)$', head, re.M)
        if not m:
            continue
        name = m.group(1).strip().replace('/', '\\').split('\\')[-1].strip()
        # These files are written with CRLF, and `$` does not match between a
        # `\r` and its `\n` - so without this every slide marker failed to
        # match while the PDF page markers, whose pattern tolerates the `\r`,
        # still did. Half the sources were silently matching on nothing.
        body = path.read_text(encoding='utf-8', errors='replace').replace('\r\n', '\n')
        sections: dict[tuple[str, int], str] = {}
        chunks = re.split(r'^(?:----- slide (\d+) -----|===== page (\d+) =====[^\n]*)$',
                          body, flags=re.M)
        for i in range(1, len(chunks), 3):
            slide_no, page_no, text = chunks[i], chunks[i + 1], chunks[i + 2] or ''
            if slide_no:
                sections[('slide', int(slide_no))] = text
            elif page_no:
                sections[('pdf', int(page_no))] = text
        out[name] = sections
    return out


# --------------------------------------------------------------------------- #
# notes as blocks and sections
# --------------------------------------------------------------------------- #
class Block:
    __slots__ = ('unit', 'start', 'end', 'tag', 'text', 'h2', 'h3', 'section')

    def __init__(self, unit, start, end, tag, text, h2, h3):
        self.unit, self.start, self.end, self.tag = unit, start, end, tag
        self.text, self.h2, self.h3 = text, h2, h3
        self.section: Section | None = None


class Section:
    """One `h3` under its `h2` - the unit of topic, and of the match."""
    __slots__ = ('unit', 'h2', 'h3', 'blocks', 'text', 'vec')

    def __init__(self, unit, h2, h3):
        self.unit, self.h2, self.h3, self.blocks = unit, h2, h3, []
        self.text, self.vec = '', {}

    @property
    def label(self) -> str:
        return ' > '.join(b for b in (self.h2, self.h3) if b) or '(untitled)'


def read_notes(body: str, unit: int) -> tuple[list[Block], list[Section]]:
    blocks: list[Block] = []
    sections: list[Section] = []
    by_key: dict[tuple[str, str], Section] = {}
    h2 = h3 = ''
    for start, end, tag in top_level(body):
        text = plain(body[start:end])
        if tag == 'h2':
            h2, h3 = text, ''
        elif tag == 'h3':
            h3 = text
        elif tag in ANCHORS and text:
            key = (h2, h3)
            section = by_key.get(key)
            if section is None:
                section = by_key[key] = Section(unit, h2, h3)
                sections.append(section)
            block = Block(unit, start, end, tag, text, h2, h3)
            block.section = section
            section.blocks.append(block)
            blocks.append(block)
    for s in sections:
        # The heading is part of the section's own text: a page titled "Chunks"
        # is about chunks even if the heading words never appear below it.
        s.text = f'{s.h2} {s.h3} ' + ' '.join(b.text for b in s.blocks)
    return blocks, sections


def learn_bounds(text: str) -> tuple[int, int]:
    m = re.search(r'\n\s*learn:\s*`\n', text)
    if not m:
        sys.exit('place_dcc_figures: no learn literal found')
    start = m.end()
    close = text.find('\n`', start)
    if close < 0:
        sys.exit('place_dcc_figures: learn literal is not closed')
    return start, close


# --------------------------------------------------------------------------- #
# matching
# --------------------------------------------------------------------------- #
def vectors(docs: list[list[str]]):
    """A function making a TF-IDF vector, with df taken over `docs`."""
    df: collections.Counter = collections.Counter()
    for tokens in docs:
        df.update(set(tokens))
    n = max(1, len(docs))
    default = math.log(1.0 + n)
    idf = {t: math.log(1.0 + n / (1.0 + c)) for t, c in df.items()}

    def make(tokens: list[str]) -> dict[str, float]:
        counts = collections.Counter(tokens)
        v = {t: (1.0 + math.log(c)) * idf.get(t, default) for t, c in counts.items()}
        norm = math.sqrt(sum(x * x for x in v.values())) or 1.0
        return {t: x / norm for t, x in v.items()}

    return make


def cos(a: dict[str, float], b: dict[str, float]) -> float:
    if len(a) > len(b):
        a, b = b, a
    return sum(x * b.get(t, 0.0) for t, x in a.items())


def align(scores: list[list[float]], drop: float = 0.0) -> list[int]:
    """Best alignment of rows to columns, with backwards cost `drop` per step.

    Plain argmax per figure scatters a deck: slides 9 and 12 both prefer the
    same paragraph and one of them lands under a heading that contradicts it,
    so the total is maximised subject to order - the standard sequence-alignment
    DP.

    Strictly non-decreasing is too strong for the notes, though. The GFS/HDFS
    deck teaches GFS first and Hadoop after it; the notes have it the other way
    round, HDFS in 4.2.4-4.2.8 and GFS last in 4.2.9. With no way back, every
    page after the first GFS match is pinned to 4.2.9 - the Hadoop architecture
    pages land under the GFS discussion at 0.171 while the section actually
    about the architecture sits there at 0.287. So moving *back* one column
    costs `drop`, which lets a page follow its own topic when the evidence is
    worth the disruption, and keeps it in order when it is not.
    """
    if not scores or not scores[0]:
        return [0] * len(scores)
    rows, cols = len(scores), len(scores[0])
    if rows == 1:
        return [max(range(cols), key=lambda k: scores[0][k])]
    dp = [[0.0] * cols for _ in range(rows)]
    back = [[-1] * cols for _ in range(rows)]
    dp[0] = list(scores[0])
    for i in range(1, rows):
        prev = dp[i - 1]
        for j in range(cols):
            # Everything up to j is free; everything past j pays per column.
            best, best_j = -1e18, j
            for j2 in range(cols):
                cand = prev[j2] - (drop * (j2 - j) if j2 > j else 0.0)
                if cand > best:
                    best, best_j = cand, j2
            dp[i][j] = best + scores[i][j]
            back[i][j] = best_j
    j = max(range(cols), key=lambda k: dp[rows - 1][k])
    out = [0] * rows
    out[rows - 1] = j
    for i in range(rows - 1, 0, -1):
        j = back[i][j]
        out[i - 1] = j
    return out


def align_units(unit_scores: list[dict[int, float]], units: list[int]) -> list[int]:
    """Which unit each figure of one file belongs to, allowing a split.

    A file is not always one unit's material, and a file that is mostly one
    unit's must not be spread over nine because one page scores oddly somewhere.
    So the figures are cut into contiguous runs with one unit each, units never
    going backwards along the file - a deck teaches in order and cannot return
    to a unit it has left. Opening a run costs `SPLIT_PENALTY`, which is what
    stops a single noisy page peeling itself off.
    """
    n = len(unit_scores)
    if not n:
        return []
    cols = len(units)
    dp = [[-1e18] * cols for _ in range(n)]
    back = [[-1] * cols for _ in range(n)]
    for i in range(n):
        running, running_j = -1e18, -1
        for j, u in enumerate(units):
            gain = unit_scores[i].get(u, 0.0)
            if i == 0:
                dp[i][j], back[i][j] = gain, -1
            else:
                stay = dp[i - 1][j]
                switch = (running - SPLIT_PENALTY) if running_j >= 0 else -1e18
                if stay >= switch:
                    dp[i][j], back[i][j] = stay + gain, j
                else:
                    dp[i][j], back[i][j] = switch + gain, running_j
            if dp[i - 1][j] > running:
                running, running_j = dp[i - 1][j], j
    j = max(range(cols), key=lambda k: dp[n - 1][k])
    out = [0] * n
    out[n - 1] = units[j]
    for i in range(n - 1, 0, -1):
        j = back[i][j]
        out[i - 1] = units[j]
    return out


def match(figures: list[dict], sections: list[Section]) -> dict[str, dict]:
    """Unit, section and paragraph for every figure, honouring slide order."""
    make_section = vectors([tokenize(s.text) for s in sections])
    for s in sections:
        s.vec = make_section(tokenize(s.text))
    make_fig = vectors([tokenize(f['_query']) for f in figures])
    for f in figures:
        f['_qvec'] = make_fig(tokenize(f['_query']))

    units = sorted({s.unit for s in sections})
    by_unit = {u: [k for k, s in enumerate(sections) if s.unit == u] for u in units}
    placed: dict[str, dict] = {}

    for source in sorted({f['source'] for f in figures}):
        group = sorted([f for f in figures if f['source'] == source],
                       key=lambda f: f.get('slide') or f.get('page') or 0)
        raw = [[cos(f['_qvec'], s.vec) for s in sections] for f in group]

        # 1. the unit each figure belongs to
        unit_scores = []
        for f, row in zip(group, raw):
            per_unit = {u: max(row[k] for k in ks) for u, ks in by_unit.items() if ks}
            scored = {u: max(0.0, v - EVIDENCE_FLOOR) for u, v in per_unit.items()}
            scored[f['unit']] = scored.get(f['unit'], 0.0) + HOME_PRIOR
            unit_scores.append(scored)
        chosen_units = align_units(unit_scores, units)

        runs: list[list[int]] = []
        for i, u in enumerate(chosen_units):
            if runs and runs[-1][2] == u:
                runs[-1][1] = i
            else:
                runs.append([i, i, u])

        # 2. the section inside that unit, 3. the paragraph inside that section
        for lo, hi, unit in runs:
            ks = by_unit[unit]
            rows = list(range(lo, hi + 1))
            picks = [ks[j] for j in align([[raw[i][k] for k in ks] for i in rows], drop=DROP)]
            good = [n for n, i in enumerate(rows) if raw[i][picks[n]] >= CONFIDENT]
            # A slide with weak-but-real evidence keeps its own best section.
            # Interpolation is for slides with nothing to go on, not for ones
            # the order constraint happened to pin into a narrow band: without
            # this, a page about cloud *storage* between two slides about
            # service models is filed under the models rather than under 7.2.1
            # Storage, which is where its words actually point.
            own = [max(ks, key=lambda k: raw[i][k]) for i in rows]
            for n, i in enumerate(rows):
                f, j = group[i], picks[n]
                if raw[i][own[n]] >= EVIDENCE_FLOOR:
                    j = own[n]
                elif raw[i][j] < CONFIDENT and good:
                    # The diagram-only slides: no words of their own, so their
                    # best section is noise. Interpolate between the confident
                    # neighbours of the same run, in slide order.
                    before = max([c for c in good if c < n], default=None)
                    after = min([c for c in good if c > n], default=None)
                    if before is not None and after is not None:
                        lo_k, hi_k = picks[before], picks[after]
                        frac = (n - before) / (after - before)
                    elif before is not None:
                        lo_k = hi_k = picks[before]
                        frac = 1.0
                    elif after is not None:
                        lo_k = hi_k = picks[after]
                        frac = 0.0
                    else:                                     # pragma: no cover
                        lo_k = hi_k = j
                        frac = 0.5
                    pool = [k for k in ks if lo_k <= k <= hi_k] or [lo_k]
                    j = pool[min(len(pool) - 1, max(0, round(frac * (len(pool) - 1))))]
                    f['_interpolated'] = True
                f['_unit'] = unit
                f['_section'] = sections[j]
                f['_score'] = raw[i][j]
                placed[f['name']] = {'figure': f, 'section': sections[j],
                                     'confident': raw[i][j] >= CONFIDENT,
                                     'score': raw[i][j]}
    return placed


def apply_pins(placed: dict[str, dict], sections: list[Section]) -> int:
    """Move the figures a person has checked to the section they belong in.

    The matcher places 231 figures and is right about most of them; the ones it
    gets wrong are the slides with almost no words of their own, where a caption
    reading "Example:" is the entire query. Those are decisions about content,
    so they are recorded by hand in `tools/dcc_figure_pins.json` and re-applied
    on every run - a pin that would no longer land is a hard error rather than a
    silent no-op, because a correction that quietly stops working is worse than
    no correction at all.
    """
    if not PINS.exists():
        return 0
    pins = json.loads(PINS.read_text(encoding='utf-8'))
    for name, pin in pins.items():
        unknown = set(pin) - {'unit', 'section', 'caption', 'why'}
        if unknown:
            sys.exit(f'place_dcc_figures: pin {name!r} has unknown key(s) '
                     f'{sorted(unknown)} - allowed: unit, section, caption, why')
    for name, pin in sorted(pins.items()):
        info = placed.get(name)
        if info is None:
            sys.exit(f'place_dcc_figures: pin names {name!r}, which is not a kept '
                     f'figure - re-run tools/extract_dcc_figures.py or fix the pin')
        unit = pin.get('unit')
        needle = pin['section'].lower()
        # A section is named by its h2 and its h3 joined with ' > ', so a
        # needle naming only the h2 also matches every h3 under it. When exactly
        # one section's label IS the needle, that is the one meant - which is
        # how a pin reaches a section that has no h3 of its own (a unit's
        # opening, where its cover slide belongs). Otherwise the needle is a
        # substring and has to land on exactly one section.
        match_ = [s for s in sections
                  if s.unit == unit and needle == s.label.lower()]
        if len(match_) != 1:
            match_ = [s for s in sections
                      if s.unit == unit and needle in s.label.lower()]
        if len(match_) != 1:
            sys.exit(f'place_dcc_figures: pin {name!r} looks for section '
                     f'{pin["section"]!r} in ch{unit} and finds {len(match_)} '
                     f'sections - the label must appear once')
        info['section'] = match_[0]
        info['confident'] = True
        info['score'] = 1.0
        info['pinned'] = True
        info['why'] = pin.get('why', '')
        info['figure']['_unit'] = unit
        info['figure']['_section'] = match_[0]
        # A slide whose only text frame is "Example:" has a caption that names
        # nothing, so a pin may supply one. It replaces the deck's words rather
        # than adding to them, which keeps the figure's provenance line honest.
        if pin.get('caption'):
            info['caption'] = pin['caption']
    return len(pins)


def apply_extras(placed: dict[str, dict], figures: list[dict]) -> list[dict]:
    """Pull the off-syllabus slides out of the match into one labelled section.

    A deck can contain a run of material the syllabus does not cover - here,
    slides 79-93 of the reference deck are a survey of network protocols
    (gossip, OSI, routing, SSH, XMPP, PTP, MTP) and the syllabus names none of
    them. Those slides match nothing, so the matcher files them wherever the
    noise points: a slide about routing landed under "the pizza analogy". A
    diagram filed under the wrong heading teaches the wrong thing, so instead
    of scattering them they are collected into one section that says what they
    are and that they are not examinable. Nothing is discarded; nothing is
    mis-filed; and the set is small enough to read through and check.
    """
    if not EXTRAS.exists():
        return []
    spec = json.loads(EXTRAS.read_text(encoding='utf-8'))
    out = []
    for group in spec['groups']:
        keep, missing = [], []
        for name in group['figures']:
            info = placed.pop(name, None)
            (keep if info is not None else missing).append(info or name)
        if missing:
            sys.exit(f'place_dcc_figures: extras names {missing}, which are not kept '
                     f'figures - re-run tools/extract_dcc_figures.py or fix the file')
        order = {name: n for n, name in enumerate(group['figures'])}
        keep.sort(key=lambda i: order[i['figure']['name']])
        out.append({'figures': keep, 'unit': group['unit'], 'heading': group['heading'],
                    'intro': group['intro'], 'why': group.get('why', {})})
    return out


def extras_markup(groups: list[dict]) -> str:
    """The labelled sections the off-syllabus slides live in."""
    out = []
    for extras in groups:
        if not extras['figures']:
            continue
        out += [EX_START, f'<h2>{extras["heading"]}</h2>', f'<p>{extras["intro"]}</p>']
        for info in extras['figures']:
            f = info['figure']
            why = extras['why'].get(f['name'], '')
            caption = why or info.get('caption') or usable_caption(f.get('caption') or '')
            out.append(figure_markup(f, caption))
        out.append(EX_END)
    return '\n'.join(out) + '\n' if out else ''


def place_blocks(placed: dict[str, dict], blocks: list[Block]) -> None:
    """Within its section, give every figure the paragraph it belongs under."""
    scores: dict[tuple[str, int], float] = {}
    for unit in sorted({b.unit for b in blocks}):
        unit_blocks = [b for b in blocks if b.unit == unit]
        make = vectors([tokenize(b.text) for b in unit_blocks])
        for name, info in placed.items():
            if info['section'].unit != unit:
                continue
            q = info['figure']['_qvec']
            for b in unit_blocks:
                scores[(name, b.start)] = cos(q, make(tokenize(b.text)))

    groups: dict[tuple[str, int], list[dict]] = collections.defaultdict(list)
    for name, info in placed.items():
        first = info['section'].blocks[0].start
        groups[(info['figure']['source'], info['section'].unit * 100000 + first)].append(info)

    # Keyed by (unit, offset), not offset alone. Paragraph offsets are into each
    # unit's own body, so two chapters share almost every offset value: keyed by
    # offset, figures in chapter 2 and chapter 7 competed for the same budget,
    # and re-placing one unit silently moved figures in another.
    load: collections.Counter = collections.Counter()
    for infos in groups.values():
        section = infos[0]['section']
        rows = sorted(infos, key=lambda i: i['figure'].get('slide')
                      or i['figure'].get('page') or 0)
        if len(section.blocks) == 1:
            chosen = [0] * len(rows)
        else:
            chosen = align([[scores.get((i['figure']['name'], b.start), 0.0)
                             for b in section.blocks] for i in rows])
        for info, j in zip(rows, chosen):
            block = section.blocks[j]
            if load[(block.unit, block.start)] >= PER_ANCHOR:
                # Another paragraph of the same section, best-scoring first:
                # never a different topic, just a different sentence.
                free = sorted((k for k in range(len(section.blocks))
                               if load[(block.unit, section.blocks[k].start)] < PER_ANCHOR),
                              key=lambda k: -scores.get(
                                  (info['figure']['name'], section.blocks[k].start), 0.0))
                if free:
                    block = section.blocks[free[0]]
            load[(block.unit, block.start)] += 1
            info['block'] = block


# --------------------------------------------------------------------------- #
# markup
# --------------------------------------------------------------------------- #
def figure_markup(f: dict, caption: str) -> str:
    w, h = f['px'].split('x')
    where = f'slide {f["slide"]}' if f['kind'] == 'slide' else f'page {f["page"]}'
    # An empty alt where the caption already says it, a described alt where
    # there is nothing else: that keeps a screen reader from saying it twice.
    alt = caption or f'Diagram from {f["source"]}, {where}'
    tail = f' &mdash; {html.escape(caption)}' if caption else ''
    return '\n'.join([
        FIG_OPEN.format(f['name']),
        '<figure class="figure-wrap">',
        f'<img class="figure wide slide" src="{ASSET}{f["name"]}" '
        f'alt="{html.escape(alt, quote=True)}" width="{w}" height="{h}" '
        f'loading="lazy" decoding="async">',
        f'<figcaption><strong>{where}</strong> &middot; '
        f'{html.escape(f["source"])}{tail}</figcaption>',
        '</figure>',
        FIG_CLOSE,
    ])


def strip_figures(body: str) -> str:
    """Remove every figure this tool placed, and the old end-of-unit section."""
    for start, end in ((OLD_START, OLD_END), (EX_START, EX_END)):
        body = re.sub(re.escape(start) + r'.*?' + re.escape(end) + r'\s*', '', body, flags=re.S)
    return re.sub(r'<!-- dcc-fig:.*?<!-- /dcc-fig -->\s*', '', body, flags=re.S)


# --------------------------------------------------------------------------- #
def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--report', action='store_true', help='print the match, write nothing')
    ap.add_argument('--revert', action='store_true', help='remove every figure')
    ap.add_argument('--examples', type=int, default=8, help='report: rows to show')
    ap.add_argument('--list', dest='list_all', action='store_true',
                    help='print every figure and the section it landed in')
    args = ap.parse_args()

    if not FIGURES.exists():
        sys.exit(f'place_dcc_figures: {FIGURES.relative_to(ROOT)} is missing - '
                 f'run tools/extract_dcc_figures.py first')
    figures = [f for f in json.loads(FIGURES.read_text(encoding='utf-8')) if f.get('kept')]
    texts = source_texts()

    # The notes, with anything already placed stripped out first, so a re-run
    # matches against the same text the first run matched against.
    bodies: dict[int, str] = {}
    blocks: list[Block] = []
    sections: list[Section] = []
    for n in range(1, 10):
        path = SITE / f'ch{n}.js'
        if not path.exists():
            continue
        text = path.read_text(encoding='utf-8')
        start, close = learn_bounds(text)
        bodies[n] = strip_figures(text[start:close])
        unit_blocks, unit_sections = read_notes(bodies[n], n)
        blocks.extend(unit_blocks)
        sections.extend(unit_sections)

    for f in figures:
        key = ('slide', f['slide']) if f['kind'] == 'slide' else ('pdf', f['page'])
        own = texts.get(f['source'], {}).get(key, '')
        f['_query'] = ' '.join([own, f.get('body') or '', f.get('caption') or '']).strip()

    placed = match(figures, sections)
    pinned = apply_pins(placed, sections)
    extras = apply_extras(placed, figures)
    place_blocks(placed, blocks)
    infos = list(placed.values())

    counts: collections.Counter = collections.Counter(i['block'].unit for i in infos)
    folder: collections.Counter = collections.Counter(f['unit'] for f in figures)
    moved = [i for i in infos if i['block'].unit != i['figure']['unit']]
    weak = [i for i in infos if not i['confident']]

    if args.list_all:
        for i in sorted(infos, key=lambda i: (i['block'].unit, i['figure']['source'],
                                              i['figure'].get('slide')
                                              or i['figure'].get('page') or 0)):
            f, s = i['figure'], i['section']
            where = f'slide {f["slide"]}' if f['kind'] == 'slide' else f'page {f["page"]}'
            mark = 'P' if i.get('pinned') else ('+' if i['confident'] else '~')
            print(f'{mark} ch{s.unit}  {f["name"].split("/")[-1][-36:]:<38} {where:<10}'
                  f' {s.label[:74]}')
        return 0

    if args.report:
        print(f'{len(figures)} figures, {len(blocks)} note blocks in {len(sections)} sections')
        print()
        print(f'{"unit":<7}{"figures":>8}{"folder":>8}')
        for u in range(1, 10):
            print(f'  ch{u:<4}{counts[u]:>8}{folder[u]:>8}')
        print()
        print(f'confident by text: {len(infos) - len(weak)}/{len(infos)}   '
              f'interpolated: {len(weak)}   placed outside its folder unit: {len(moved)}')
        for g in extras:
            print(f'off-syllabus extras (labelled section, ch{g["unit"]}): '
                  f'{len(g["figures"])} figures, not matched at all')
        if pinned:
            print()
            print(f'pinned by hand ({pinned}):')
            for i in sorted((i for i in infos if i.get('pinned')),
                            key=lambda i: (i['section'].unit, i['figure']['name'])):
                f, s = i['figure'], i['section']
                print(f'  {f["name"].split("/")[-1][-34:]:<36}  ch{s.unit}  {s.label[:58]}'
                      f'   {i.get("why", "")[:44]}')
        print()
        print('per file, the unit it was placed in:')
        for source in sorted({f['source'] for f in figures}):
            group = sorted([i for i in infos if i['figure']['source'] == source],
                           key=lambda i: (i['figure']['_unit'], i['figure'].get('slide')
                                          or i['figure'].get('page') or 0))
            where = collections.Counter(i['block'].unit for i in group)
            spread = '  '.join(f'ch{u}x{n}' for u, n in sorted(where.items()))
            interp = sum(1 for i in group if not i['confident'])
            print(f'  {source[:44]:<46} folder ch{group[0]["figure"]["unit"]:<2} -> {spread}'
                  f'   ({interp} interpolated)')
        print()
        print('strongest section matches:')
        for i in sorted(infos, key=lambda i: -i['score'])[:args.examples]:
            f, s = i['figure'], i['section']
            print(f'  {i["score"]:5.3f}  {f["name"].split("/")[-1][-34:]:<36}'
                  f'  ch{s.unit}  {s.label[:60]}')
        print()
        print('weakest section matches (interpolated):')
        for i in sorted(infos, key=lambda i: i['score'])[:args.examples]:
            f, s = i['figure'], i['section']
            print(f'  {i["score"]:5.3f}  {f["name"].split("/")[-1][-34:]:<36}'
                  f'  ch{s.unit}  {s.label[:60]}')
        return 0

    # --- write -------------------------------------------------------------
    # Offsets are into the stripped body of their own unit, so inserting from
    # the last offset backwards cannot invalidate an offset still to come.
    per_unit: dict[int, dict[int, list[str]]] = collections.defaultdict(
        lambda: collections.defaultdict(list))
    for i in infos:
        b, f = i['block'], i['figure']
        caption = i.get('caption') or usable_caption(f.get('caption') or '')
        per_unit[b.unit][b.end].append(figure_markup(f, caption))

    changed = 0
    for n in range(1, 10):
        path = SITE / f'ch{n}.js'
        if not path.exists():
            continue
        text = path.read_text(encoding='utf-8')
        start, close = learn_bounds(text)
        head, body, tail = text[:start], strip_figures(text[start:close]), text[close:]
        if not args.revert:
            for off in sorted(per_unit.get(n, {}), reverse=True):
                body = body[:off] + '\n' + '\n'.join(per_unit[n][off]) + body[off:]
            here = [g for g in extras if g['unit'] == n]
            if here:
                body = body.rstrip() + '\n\n' + extras_markup(here)
        body = body.rstrip() + '\n\n'
        new = head + body + tail
        if new == text:
            print(f'  ch{n}  unchanged')
            continue
        changed += 1
        print(f'  ch{n}  {sum(len(v) for v in per_unit.get(n, {}).values()):>3} figure(s) '
              f'after {len(per_unit.get(n, {}))} paragraph(s)')
        path.write_text(new, encoding='utf-8')
    print()
    print(f'{changed} chapter file(s) written')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
