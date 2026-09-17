#!/usr/bin/env python3
"""Take the deck out of the captions.

What a caption owes the reader is what the picture shows. Fourteen captions and
eight `alt` attributes in these notes still answered a different question - which
lecture the picture came from and which slide of it:

    Fig 5.2 — The three delivery models as a stack, following the deck's slides 22 and 26.
    Fig 3.3 — The Bully algorithm's five steps, following the deck's slide 75 (P2 initiates, ...
    From LectureMain_Ch_2_Communication_in_DS.pptx, slide 6 · Message passing in the deck's diagram

The description in each of those is real and stays; the citation is the part that
has to go, because a reader looking at a picture does not care which file it was
cut out of, and the citation is what makes a caption read as an inventory entry
rather than as something that tells you what you are looking at.

Provenance is not deleted, it moves. Each chapter already carries one small
`fig-src-note` line naming the decks its figures came from, and the Reference tab
keeps a `ref-meta` line per picture, which is what that tab is for. This pass edits
the caption and the `alt` of a picture in the reading path - nothing else.

The rewrites are hand-written rather than generated, because only a person knows
which clause of a sentence is the citation and which is the description, and the
catalogue over-collects on purpose: every entry is a (find, to) pair in
`data/caption_citations.json`, each `find` must occur at least once in the chapter
it names, and `--apply` refuses if a `to` reintroduces a citation.

    python tools/caption_plain.py --report    # every caption/alt that cites a source
    python tools/caption_plain.py --check     # exit 1 if one comes back
    python tools/caption_plain.py --apply     # write the catalogue, then sync alts
    python tools/caption_plain.py --restore   # put the citations back
"""

from __future__ import annotations

import argparse
import hashlib
import html as htmllib
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "dcc-site"
CATALOGUE = ROOT / "data" / "caption_citations.json"
RECORD = ROOT / "data" / "caption_citations_applied.json"

CAPTION = re.compile(r"(?P<open><figcaption[^>]*>)(?P<body>.*?)(?P<close></figcaption>)", re.S)
ALT = re.compile(r'(?P<open><img\b[^>]*?\balt=")(?P<body>[^"]*)(?P<close>")', re.S)
FIGURE = re.compile(r"<figure\b.*?</figure>", re.S)

# What makes a caption an inventory entry: a file name, a slide or page number, or
# the deck itself. Written the way a reader hears it, like the voice tells.
CITE = re.compile(
    r"\.(pptx|ppt|pdf|docx?)\b"
    r"|\bslides?\s+\d"
    r"|\b(the|this|his|that)\s+(class\s+|teacher'?s\s+)?deck\b"
    r"|\bdeck'?s\b"
    r"|\bfrom the (reference|class) notes\b"
    r"|\breference (note|deck)s?\b",
    re.I,
)


def read(p: pathlib.Path) -> str:
    """No newline translation: these chapter files are CRLF and a byte-exact write
    depends on the platform's idea of a line ending, not this file's."""
    return p.read_text(encoding="utf-8", newline="")


def write(p: pathlib.Path, text: str) -> None:
    p.write_text(text, encoding="utf-8", newline="")


def plain(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s)
    s = htmllib.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def chapters() -> list[pathlib.Path]:
    return sorted(SITE.glob("ch*.js"), key=lambda p: int(re.search(r"\d+", p.stem).group()))


def digest(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()[:16]


def offences(text: str) -> list:
    """Every caption and alt in one chapter that still cites a source.

    The figure's own comment marker is reported too, so a defect can be found by
    the picture it belongs to rather than by the sentence alone.
    """
    out = []
    for m in CAPTION.finditer(text):
        if CITE.search(m.group("body")):
            out.append(("caption", m.group("body").strip()[:160]))
    for m in ALT.finditer(text):
        if CITE.search(m.group("body")):
            out.append(("alt", m.group("body").strip()[:160]))
    return out


def load_catalogue() -> dict:
    if not CATALOGUE.exists():
        return {}
    return json.loads(CATALOGUE.read_text(encoding="utf-8"))


def cmd_report() -> int:
    total = 0
    for path in chapters():
        bad = offences(read(path))
        if not bad:
            continue
        total += len(bad)
        print(f"=== {path.name} ({len(bad)})")
        for kind, text in bad:
            print(f"  [{kind}] {text}")
    print(f"\ncaption/alt text citing a source: {total}")
    return 0


def cmd_check() -> int:
    bad = []
    for path in chapters():
        bad += [f"{path.name} [{kind}]: {text}" for kind, text in offences(read(path))]
    if bad:
        print(f"caption_plain: FAIL - {len(bad)} caption(s) or alt(s) cite a source", file=sys.stderr)
        for b in bad[:12]:
            print("  " + b, file=sys.stderr)
        return 1
    print("caption_plain: OK - no caption or alt cites a source")
    return 0


def sync_alts(text: str) -> tuple[str, int]:
    """An `alt` that still cites a source becomes its own caption's text.

    `alt` is the viewer's title and the screen reader's only clue to the picture, so
    it has to answer the same question the caption answers. Only a citing one is
    touched: an `alt` written as a fuller description than its caption is better for
    a reader who cannot see the picture, and this pass has no business shortening
    it.
    """
    changed = 0

    # Walk figure by figure so an alt can borrow the description its caption carries.
    def walk(m: re.Match) -> str:
        nonlocal changed
        figure = m.group(0)
        cap = CAPTION.search(figure)
        desc = plain(cap.group("body")) if cap else ""
        if not desc:
            return figure
        for alt in ALT.finditer(figure):
            if not CITE.search(alt.group("body")):
                continue
            figure = (figure[: alt.start("body")] + desc + figure[alt.end("body") :])
            changed += 1
            break
        return figure

    return FIGURE.sub(walk, text), changed


def cmd_apply() -> int:
    cat = load_catalogue()
    if not cat:
        print("no catalogue at data/caption_citations.json", file=sys.stderr)
        return 1
    applied, record = 0, {}
    for path in chapters():
        text = read(path)
        before = dict(text=digest(text))
        entries = cat.get(path.name, [])
        for find, to in entries:
            n = text.count(find)
            if n < 1:
                # An entry whose replacement is already present is in force, not
                # missing: --apply is re-runnable, and the first run is the normal
                # case for it. An entry that deletes says the same thing by being
                # absent - the citation is gone, which is the point. Only an entry
                # with neither side on disk is a defect.
                if not to or to in text:
                    continue
                print(f"  {path.name}: catalogue entry not found ({find[:60]!r})", file=sys.stderr)
                return 1
            text = text.replace(find, to)
            applied += n
        text, synced = sync_alts(text)
        applied += synced
        # Compare the digest, not the text: `text` is a string and `before` holds a
        # hash, so the first version of this line wrote every chapter in the site -
        # including the two the catalogue does not name.
        if digest(text) == before["text"]:
            continue
        write(path, text)
        record[path.name] = {"before": before["text"], "after": digest(text),
                             "entries": len(entries), "alts_synced": synced}
    if record:
        RECORD.write_text(json.dumps(record, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"caption_plain: applied {applied} change(s) across {len(record)} chapter(s)")
    return 0


def cmd_restore() -> int:
    if not RECORD.exists():
        print("no record to restore from", file=sys.stderr)
        return 1
    record = json.loads(RECORD.read_text(encoding="utf-8"))
    cat = load_catalogue()
    n = 0
    for path in chapters():
        info = record.get(path.name)
        if not info:
            continue
        text = read(path)
        if digest(text) != info["after"]:
            print(f"  {path.name}: changed since the pass, refusing to restore", file=sys.stderr)
            continue
        for find, to in reversed(cat.get(path.name, [])):
            # `replace("", ...)` inserts between every character, so an entry that
            # deletes has to be skipped rather than reversed: there is nothing to
            # put back. The catalogue writes a deletion as a replacement that keeps
            # an anchor, which is why this case no longer arises - the guard stays
            # for the next person who writes one.
            if not to or to not in text:
                continue
            text = text.replace(to, find)
        write(path, text)
        n += 1
    print(f"caption_plain: restored {n} chapter(s)")
    return 0


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError):
        pass
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--report", action="store_true")
    g.add_argument("--check", action="store_true")
    g.add_argument("--apply", action="store_true")
    g.add_argument("--restore", action="store_true")
    a = ap.parse_args()
    if a.report:
        return cmd_report()
    if a.check:
        return cmd_check()
    if a.apply:
        return cmd_apply()
    return cmd_restore()


if __name__ == "__main__":
    raise SystemExit(main())
