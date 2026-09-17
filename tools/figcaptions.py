#!/usr/bin/env python3
"""One caption rule for every picture on the DCC site.

A caption's job is to say what the picture shows. The extraction pipeline gave
each one an origin instead - `slide 6 · LectureMain_Ch_2_Communication_in_DS.pptx
— Figure: Principle of RPC`, or `page 2 · GFS_HDFS_Lecture.pdf` - and
`tools/fix_captions.py` cleaned the ones inside the notes, but only there: the
figures that had already moved to the Reference tab, and every picture that was
never in `learn` at all, kept the old shape. That is the caption the reader
quoted back, and it is why the rule lives in one module now rather than in the
one tool that happened to run first.

    build_caption(entry)  - what the picture shows, from the picture's own words
                            (the deck's own title, or the first line of the text
                            the slide carries), or "" when it has none.
    rewire(figure, ...)   - the same markup with that caption and a matching alt.

The fallback matters: a picture whose own text the extractor could not read gets
**no caption at all** rather than the section heading or a file name. The
full-screen viewer falls back to the section the picture sits under
(`app.js` xvTitleFor), and the group heading above it already names the source -
so the reader is told where the picture is, which is all that is honestly known
about it.

`tools/slim_dcc_figures.py` and `tools/make_reference.py` both write Reference-tab
markup and must agree about it, which is why they both import from here.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FIGURES = ROOT / "assets" / "dcc-slides" / "FIGURES.json"

BLOCK = re.compile(r"<!-- dcc-fig:(?P<fig>[^\s]+) -->\s*<figure\b.*?</figure>"
                   r"(?:\s*<!-- /dcc-fig -->)?", re.S)

JUNK = re.compile(r"^(contd\.?|cont'd\.?|continued|figure:?|slide \d+|page \d+|\d+|\W*)$", re.I)
FILENAME = re.compile(r"\.(pptx|ppt|pdf|docx?)\b", re.I)
NUM_PREFIX = re.compile(r"^\d+(\.\d+)*\.?\s+")
# The shape the extractor wrote: the origin, then the slide's own words.
ORIGIN = re.compile(r"^(?:slide|page)\s+\d+\s*(?:\u00b7|&middot;|&mdash;|—|-)\s*"
                    r"(?:[A-Za-z0-9_ .\-]*\.(?:pptx|ppt|pdf))\s*(?:&mdash;|—|-)?\s*", re.I)
SENT_END = re.compile(r"(?<=[.!?])\s")

_cache = None


def figure_meta() -> dict:
    global _cache
    if _cache is None:
        _cache = {e["name"]: e for e in json.loads(FIGURES.read_text(encoding="utf-8"))}
    return _cache


def text_of(html: str) -> str:
    t = re.sub(r"<[^>]+>", " ", html)
    for a, b in (("&mdash;", "—"), ("&ndash;", "–"), ("&middot;", "·"),
                 ("&amp;", "&"), ("&nbsp;", " "), ("&hellip;", "…")):
        t = t.replace(a, b)
    return re.sub(r"\s+", " ", t).strip()


def tidy(s: str) -> str:
    t = ORIGIN.sub("", text_of(s or "")).strip()
    t = NUM_PREFIX.sub("", t).strip()
    t = t.strip(" …·—-–\t")
    if not t or JUNK.match(t) or FILENAME.search(t):
        return ""
    return t


def as_caption(s: str) -> str:
    """One readable line: the first sentence if it stands alone, else a cut."""
    t = tidy(s)
    if not t:
        return ""
    m = SENT_END.search(t)
    if m and m.start() >= 30:
        t = t[:m.start()]
    if len(t) > 110:
        cut = t[:110]
        if " " in cut:
            cut = cut[:cut.rindex(" ")]
        t = cut.rstrip(" ,;:") + "…"
    return t


def build_caption(entry: dict) -> str:
    for raw in (entry.get("caption"), (entry.get("body") or "").split("\n")[0]):
        got = as_caption(raw or "")
        if got:
            return got
    return ""


def rewire(figure: str, caption: str, alt_fallback: str) -> str:
    """The figure markup with this caption, and an alt that matches it."""
    alt = (caption or alt_fallback).replace('"', "&quot;")
    out = re.sub(r'(<img\b[^>]*?\balt=")[^"]*(")',
                 lambda m: m.group(1) + alt + m.group(2), figure, count=1)
    cap = f"<figcaption>{caption}</figcaption>\n" if caption else ""
    return re.sub(r"<figcaption>.*?</figcaption>\n?", cap, out, count=1, flags=re.S)


def recaption(chunk: str, fallback: str) -> str:
    """Rewrite every figure inside a block, so a block can travel whole."""
    meta = figure_meta()
    out, pos = [], 0
    for m in BLOCK.finditer(chunk):
        out.append(chunk[pos:m.start()])
        out.append(rewire(m.group(0), build_caption(meta.get(m.group("fig"), {})), fallback))
        pos = m.end()
    out.append(chunk[pos:])
    return "".join(out)
