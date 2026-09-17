"""Make figure captions read like teaching, not like an inventory.

Every pasted figure carried its origin in the caption:

    slide 6 · LectureMain_Ch_2_Communication_in_DS.pptx — Figure: Principle of RPC...

which is the file name of a lecture deck in the middle of the notes. A reader
gains nothing from it, the same line is the title of the full-screen viewer, and
in an audit it is the single loudest "this is third-person" signal on the page
(221 captions). What a caption owes the reader is what the picture shows. So:

  * the caption becomes the description alone, cleaned of the source, of
    "Contd..", and of the run-ons the extractor produced when it glued two
    slides together (cut at the first sentence or 110 characters);
  * a description that says nothing usable ("Contd..", or a bare file title)
    falls back to the section it sits under, so the reader still knows what they
    are looking at — and every fallback is listed at the end of a run so a person
    can see them rather than trust them;
  * the `alt` attribute is set to the same description, because that string is
    also the viewer's title and the screen reader's only clue;
  * provenance is not deleted, it moves: one line per chapter names the deck and
    the reference notes the figures come from (`data/figure_provenance.json`);
  * hand-drawn figures ("Fig 1.1 — …") are left exactly as they are.

`--check` fails if a caption names a file again, and `--restore` rebuilds from
the record with a fingerprint check, like the other content tools.

    python tools/fix_captions.py --survey     # what would change, without writing
    python tools/fix_captions.py --apply
    python tools/fix_captions.py --check
    python tools/fix_captions.py --restore
"""

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "dcc-site"
RECORD = ROOT / "data" / "caption_changes.json"
PROVENANCE = ROOT / "data" / "figure_provenance.json"
LEARN = re.compile(r"\n  learn: `(?P<body>.*?)\n`,\n", re.S)
REFERENCE = re.compile(r"\n  reference: `(?P<body>.*?)\n`,\n", re.S)

BLOCK = re.compile(r"<!-- dcc-fig:(?P<src>\S+) -->\n(?P<figure><figure.*?</figure>)\n<!-- /dcc-fig -->", re.S)
CAPTION = re.compile(r"<figcaption>(?P<body>.*?)</figcaption>", re.S)
IMG = re.compile(r'(?P<head><img\b[^>]*?\balt=")(?P<alt>[^"]*)(?P<tail>")', re.S)
JUNK = re.compile(r"^(contd\.?|cont\'?d\.?|continued|communication \(?ii\)?|figure:?|slide \d+|page \d+)$", re.I)
# A description that is only a file name is the extractor echoing the origin back
# into the text - the same defect in a different shape.
FILENAME = re.compile(r"\.(pptx|ppt|pdf|docx?)\b", re.I)
META_TAIL = re.compile(r"\s*(—|&mdash;|-)\s*from the (reference|class) notes?.*$", re.I)
SENT_END = re.compile(r"(?<=[.!?])\s")

# The text a pasted slide or page carries after its origin marker.
ORIGIN = re.compile(
    r"^(?:<strong>)?(?P<kind>slide|page)\s+(?P<num>\d+)(?:</strong>)?\s*(?:&middot;|·)\s*"
    r"(?P<file>[^&<]*?)(?:&mdash;|—)\s*(?P<desc>.*)$", re.S)

DECK_LINE = re.compile(r"^(?P<num>\d+)\.\s")


def digest(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()[:16]


def text_of(html: str) -> str:
    t = re.sub(r"<[^>]+>", " ", html)
    for a, b in (("&middot;", "·"), ("&mdash;", "—"), ("&ndash;", "–"), ("&amp;", "&"),
                 ("&nbsp;", " "), ("&rsquo;", "’"), ("&#x27;", "'"), ("&quot;", '"'),
                 ("&hellip;", "…"), ("&lt;", "<"), ("&gt;", ">")):
        t = t.replace(a, b)
    return re.sub(r"\s+", " ", t).strip()


def clean_title(t: str) -> str:
    t = META_TAIL.sub("", t)
    return re.sub(r"\s+", " ", t).strip(" -—·.,;:")


def clean_desc(desc: str) -> str:
    """The description, cut to one readable line.

    The extractor sometimes glued the next slide's text onto this one, so a
    description can run to several hundred characters of a different topic; the
    first sentence is the part that belongs to this picture.
    """
    d = re.sub(r"^(<strong>)?(figure|fig\.)\s*:?\s*", "", desc, flags=re.I)
    d = text_of(d)
    d = re.sub(r"\s*\b(slide|page)\s+\d+\s*(·|&middot;)?\s*", " ", d, flags=re.I)
    d = re.sub(r"\s+", " ", d).strip(" -—·.,;:")
    if len(d) > 110:
        parts = SENT_END.split(d)
        d = parts[0] if 25 < len(parts[0]) <= 130 else " ".join(d[:110].split(" ")[:-1]) + "…"
    return d


def section_titles(raw: str) -> list:
    """(index, title) for every h2/h3 in the file, so a figure that needs a
    fallback description can name the section it sits under."""
    out = []
    for m in re.finditer(r"<h([23])>(.*?)</h\1>", raw, re.S):
        out.append((m.start(), clean_title(text_of(m.group(2)))))
    return out


def fallback_desc(titles: list, at: int, kind: str = "") -> str:
    """A caption for a picture whose own text says nothing usable.

    Naming the section it sits under is honest and still tells the reader what
    they are looking at, and the wording distinguishes a lecture slide from a page
    of the reference notes, because those are different things to the reader.
    """
    prior = [t for i, t in titles if i < at and t]
    title = (prior[-1] if prior else "this unit")[:70]
    if kind == "page":
        return f"Page from the notes for {title}"
    if kind == "slide":
        return f"Slide for {title}"
    return f"Figure for {title}"


def plan_file(path: Path):
    raw = path.read_text(encoding="utf-8")
    titles = section_titles(raw)
    changes, fallbacks = [], []
    # The Reference tab is left alone on purpose. Its captions name the deck and
    # the slide, because that is what that tab *is* - the teacher's marked slides,
    # presented as reference material - and its text is rebuilt from
    # data/reference_figs.json by tools/make_reference.py, whose --check compares the
    # field against those recorded cuts. Rewriting it here would break that record
    # and mean less than nothing to the reader.
    ref = REFERENCE.search(raw)
    ref_span = (ref.start("body"), ref.end("body")) if ref else None
    for m in BLOCK.finditer(raw):
        if ref_span and ref_span[0] <= m.start() < ref_span[1]:
            continue
        figure = m.group("figure")
        cap = CAPTION.search(figure)
        if not cap:
            continue
        old_cap = cap.group(0)
        current = text_of(cap.group("body"))
        if current.startswith("Fig "):        # a drawn figure: not ours to touch
            continue
        org = ORIGIN.match(cap.group("body").strip())
        if org:
            desc = clean_desc(org.group("desc"))
            kind, num, src_file = org.group("kind").lower(), org.group("num"), org.group("file").strip()
            if not desc or JUNK.match(desc) or FILENAME.search(desc) or len(desc) < 12:
                desc = fallback_desc(titles, m.start(), kind)
                fallbacks.append(f"{path.name} {kind} {num}: {desc}")
        else:
            # No origin marker but still a pasted picture: keep whatever text is
            # there, cleaned, and fall back only if it says nothing.
            desc = clean_desc(cap.group("body"))
            if not desc or JUNK.match(desc) or FILENAME.search(desc) or len(desc) < 12:
                desc = fallback_desc(titles, m.start())
                fallbacks.append(f"{path.name}: {desc}")
        new_cap = f"<figcaption>{desc}</figcaption>"
        new_figure = figure.replace(old_cap, new_cap, 1)
        alt = IMG.search(new_figure)
        if alt:
            new_figure = (new_figure[:alt.start("alt")] + desc + new_figure[alt.end("alt"):])
        new_block = f"<!-- dcc-fig:{m.group('src')} -->\n{new_figure}\n<!-- /dcc-fig -->"
        changes.append({"index": m.start(), "old": m.group(0), "new": new_block, "desc": desc})
    # The provenance line goes in once per chapter, right after the notes, and only
    # for a chapter that has reproduced figures and no note already.
    note = provenance_note(chapter_no(path))
    if note and changes and "fig-src-note" not in raw and LEARN.search(raw):
        at = LEARN.search(raw).end("body")
        changes.append({"index": at, "old": "", "new": "\n\n" + note, "desc": "provenance line"})
    return raw, changes, fallbacks


def provenance_note(unit: int) -> str:
    """One line per chapter naming where its figures came from.

    The file names still have to be somewhere - a reader who wants the original
    deck should be able to find it - but once per chapter in a small line at the
    end, not in the caption of every picture.
    """
    if not PROVENANCE.exists():
        return ""
    data = json.loads(PROVENANCE.read_text(encoding="utf-8"))
    parts = [f"{info['label']} ({deck})" for deck, info in data.get("decks", {}).items()
             if info.get("unit") == unit]
    parts += [f"{n['label']} ({n['file']})" for n in data.get("notes", [])
              if unit in (n.get("units") or [])]
    if not parts:
        return ""
    return ("<p class=\"fig-src-note\">Figures in this unit are reproduced from "
            + "; ".join(parts) + ". Slide and page numbers are kept with each picture.</p>")


def chapter_no(path: Path) -> int:
    m = re.search(r"ch(\d+)", path.name)
    return int(m.group(1)) if m else 0


def survey():
    total, fallbacks = 0, []
    for path in sorted(SITE.glob("ch*.js")):
        raw, changes, fb = plan_file(path)
        total += len(changes)
        fallbacks += fb
    print(f"captions that would be rewritten: {total}")
    print(f"descriptions that need the section fallback: {len(fallbacks)}")
    for f in fallbacks[:10]:
        print("  " + f)
    return 0


def apply():
    total, all_fallbacks, record = 0, [], {}
    for path in sorted(SITE.glob("ch*.js")):
        raw, changes, fallbacks = plan_file(path)
        if not changes:
            continue
        all_fallbacks += fallbacks
        new_raw = raw
        for ch in sorted(changes, key=lambda c: c["index"], reverse=True):
            new_raw = new_raw[:ch["index"]] + ch["new"] + new_raw[ch["index"] + len(ch["old"]):]
        path.write_text(new_raw, encoding="utf-8")
        record[path.name] = {"before": digest(raw), "after": digest(new_raw),
                             "entries": [{"index": c["index"], "old": c["old"], "new": c["new"]} for c in changes]}
        total += len(changes)
    if record:
        RECORD.write_text(json.dumps(record, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"fix_captions: rewrote {total} caption(s) in {len(record)} file(s)")
    print(f"  {len(all_fallbacks)} description(s) fell back to the section title")
    return 0


def restore():
    if not RECORD.exists():
        print("fix_captions: nothing recorded to restore")
        return 0
    record = json.loads(RECORD.read_text(encoding="utf-8"))
    for name, rec in record.items():
        path = SITE / name
        raw = path.read_text(encoding="utf-8")
        if digest(raw) != rec["after"]:
            print(f"fix_captions: {name} has changed since the pass; refusing to restore", file=sys.stderr)
            return 1
        # Ascending, which is the exact reverse of the apply's descending walk, so
        # every entry is back at the index it was recorded at: the apply shifted this
        # entry left by the changes before it, and by the time we reach it those
        # changes have already been undone in the same order. The two shifts cancel,
        # and that cancellation is why there is no delta here. Carrying one anyway is
        # what produced the first version of this function: it drifted 74 characters
        # and the assertion below refused to write rather than corrupt the chapter.
        body = raw
        for e in sorted(rec["entries"], key=lambda x: x["index"]):
            pos = e["index"]
            if body[pos:pos + len(e["new"])] != e["new"]:
                print(f"fix_captions: {name} entry {e['index']} is not where it was recorded", file=sys.stderr)
                return 1
            body = body[:pos] + e["old"] + body[pos + len(e["new"]):]
        if digest(body) != rec["before"]:
            print(f"fix_captions: {name} did not restore byte-exactly", file=sys.stderr)
            return 1
        path.write_text(body, encoding="utf-8")
    print(f"fix_captions: restored {len(record)} file(s) byte-exactly")
    return 0


def self_test():
    """Mirror the real order: apply backwards over original indices, restore
    forwards over the same indices, and require the input back byte for byte.

    The order is the whole point - the earlier version of this test applied at
    positions found in the text it was mutating, so it passed while the real
    restore, which uses positions recorded before the pass, did not.
    """
    fixture = ("<p>a</p>\n<!-- dcc-fig:x/one.webp -->\n<figure><img alt=\"slide 4 &middot; Deck.pptx &mdash; X\">"
               "<figcaption><strong>slide 4</strong> &middot; Deck.pptx &mdash; X</figcaption></figure>\n<!-- /dcc-fig -->\n"
               "<p>b</p>\n<!-- dcc-fig:x/two.webp -->\n<figure><img alt=\"long pasted page\">"
               "<figcaption>page 9 &middot; note.pdf &mdash; Communication (II)</figcaption></figure>\n<!-- /dcc-fig -->\n<p>c</p>")
    spans = [(m.start(), m.group(0)) for m in BLOCK.finditer(fixture)]
    if len(spans) != 2:
        return "self-test fixture no longer parses"
    entries = [
        {"index": spans[0][0], "old": spans[0][1], "new": "<!-- dcc-fig:x/one.webp -->\n<figure><img alt=\"X\"><figcaption>X</figcaption></figure>\n<!-- /dcc-fig -->"},
        {"index": spans[1][0], "old": spans[1][1], "new": "<!-- dcc-fig:x/two.webp -->\n<figure><img alt=\"Page from the notes for 2.3.7\"><figcaption>Page from the notes for 2.3.7</figcaption></figure>\n<!-- /dcc-fig -->"},
    ]
    body = fixture
    for e in sorted(entries, key=lambda x: x["index"], reverse=True):
        body = body[:e["index"]] + e["new"] + body[e["index"] + len(e["old"]):]
    for e in sorted(entries, key=lambda x: x["index"]):
        pos = e["index"]
        if body[pos:pos + len(e["new"])] != e["new"]:
            return "self-test: a replacement is not where the record says after applying backwards"
        body = body[:pos] + e["old"] + body[pos + len(e["new"]):]
    if body != fixture:
        return "self-test: apply then restore did not reproduce the input"
    return ""


def check():
    """Captions, and only captions.

    Deliberately not a whole-file fingerprint: the prose is edited by other passes
    afterwards (tools/voice_rewrite.py), and a check that fails because a different
    tool touched a paragraph is a check that gets ignored. What has to hold is that
    no caption names a file and that no recorded rewrite has been reverted; the
    fingerprint is kept for `--restore`, which is the operation that must refuse to
    run on a file that has moved on.
    """
    bad = []
    broken = self_test()
    if broken:
        print(f"fix_captions: FAIL - {broken}", file=sys.stderr)
        return 1
    for path in sorted(SITE.glob("ch*.js")):
        raw = path.read_text(encoding="utf-8")
        ref = REFERENCE.search(raw)
        ref_span = (ref.start("body"), ref.end("body")) if ref else None
        for m in CAPTION.finditer(raw):
            # The Reference tab is exempt for the same reason the rewrite skips it:
            # naming the deck and the slide is what that tab is for.
            if ref_span and ref_span[0] <= m.start() < ref_span[1]:
                continue
            t = text_of(m.group(0))
            if re.search(r"\.pptx|\.ppt\b|\.pdf|LectureMain|refnote|^(slide|page)\s+\d+\s*·", t, re.I):
                bad.append(f"{path.name}: {t[:90]}")
    if RECORD.exists():
        for name, rec in json.loads(RECORD.read_text(encoding="utf-8")).items():
            raw = (SITE / name).read_text(encoding="utf-8")
            for e in rec["entries"]:
                if e["new"] and e["new"] not in raw:
                    bad.append(f"{name}: a rewritten caption has been reverted: {e['new'][:70]}")
                if e["old"] and e["old"] in raw:
                    bad.append(f"{name}: the old caption is back: {e['old'][:70]}")
    if bad:
        print(f"fix_captions: FAIL - {len(bad)} caption problem(s)", file=sys.stderr)
        for b in bad[:10]:
            print("  " + b, file=sys.stderr)
        return 1
    print("fix_captions: OK - no caption names a source file")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--survey", action="store_true")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--restore", action="store_true")
    args = ap.parse_args()
    if args.restore:
        return restore()
    if args.check:
        return check()
    if args.apply:
        return apply()
    return survey()


if __name__ == "__main__":
    raise SystemExit(main())
