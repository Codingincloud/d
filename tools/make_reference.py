"""Collect the teacher's circled-i figures onto the Reference tab.

The teacher's decks carry a circled lower-case i on some slides - his sign for
material that is there for reference rather than for the paper. `tools/dcc_marks.py`
finds those slides by reading the icon's own id out of each deck, and the notes used
to carry a chip beside every figure taken from one.

The reader asked for the opposite shape: that sign means reference, so the marked
material belongs in its own section and the notes should read without it. So this
tool takes the figures that came from marked slides OUT of each chapter's `learn`
field and into a `reference` field, under the heading of the section they were
lifted from, with a line naming the deck and slide. The chapter's other content is
not touched: the section text stays, because the syllabus names it, and only the
picture moves.

Nothing here decides WHICH slides are marked - that lives in
data/off_syllabus_slides.json and is generated. This tool only carries out that
decision, and it refuses to write unless it can prove the move lost nothing:

    * every marked figure found in `learn` is accounted for, and the cut text is
      kept verbatim in the record (data/reference_figs.json), so --restore puts the
      notes back byte for byte;
    * `learn` must lose exactly the moved characters and nothing else;
    * `--check` rebuilds the Reference text from the marks data and fails when the
      page and the data disagree, or when a marked figure is still in the notes, or
      when a chip from the old treatment is still in the sources, or when a figure
      is no longer under the section the marks data files it under.

Each entry is recorded twice over: by the byte offset it was cut from (what
--restore inserts at) and by the SECTION it came out of, taken from the marks
data. The offset is exact and fragile - an edit above a figure moves it - and the
section is coarse and durable, so the section is what the guard checks and the
offset is what the restore uses. When an edit has moved an offset, `--repin`
derives a fresh one the only way it can be derived honestly: the figure goes to the
end of the section the marks data files it under, and --check fails until someone
has looked. The paragraph it used to sit under is not recoverable, and after a
re-anchor the record no longer pretends otherwise.

    python tools/make_reference.py --apply     # move the figures onto the tab
    python tools/make_reference.py --check     # exit 1 if notes and data disagree
    python tools/make_reference.py --repin     # re-anchor the record after an edit
    python tools/make_reference.py --restore   # put the notes back as they were
"""

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from figcaptions import build_caption, figure_meta, rewire  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "dcc-site"
MARKS = ROOT / "data" / "off_syllabus_slides.json"
RECORD = ROOT / "data" / "reference_figs.json"

# A figure as the notes write it: the comment naming the figure, the <figure>, then
# the comment that closes it. All three are one unit - stopping at </figure> leaves
# the closing marker behind in the notes, which is what an earlier version of this
# tool did, and the orphan marker then made every following offset wrong.
BLOCK = re.compile(r"<!-- dcc-fig:(?P<fig>[^\s]+) -->\s*<figure\b.*?</figure>"
                   r"(?:\s*<!-- /dcc-fig -->)?", re.S)

# The chip the previous treatment painted onto those figures. Kept as a name here
# only so --check can fail if one survives anywhere in the sources.
OLD_CHIP = "teacher-i"

# Every heading in the notes, which is how a section is found and how a cut is
# checked against the section it is filed under.
HEAD = re.compile(r"<h([1-6])>(.*?)</h\1>", re.S)

# Two blocks, one of them immediately after the other, and one of them preceded by a
# blank line - the two shapes where an offset that is off by a single newline shows
# up. --check cuts these out and puts them back, and fails if the text is not
# identical afterwards.
SELFTEST = (
    '<p>a</p>\n\n<!-- dcc-fig:x/one.webp -->\n<figure class="figure-wrap">\n<img>\n'
    '</figure>\n<!-- /dcc-fig -->\n\n<p>b</p>\n<!-- dcc-fig:x/two.webp -->\n'
    '<figure class="figure-wrap">\n<img>\n</figure>\n<!-- /dcc-fig -->\n'
    '<!-- dcc-fig:x/three.webp -->\n<figure class="figure-wrap">\n<img>\n</figure>\n'
    '<!-- /dcc-fig -->\n<p>c</p>\n')

INTRO = (
    '<h2>Reference material</h2>\n'
    '<p class="ref-intro">The teacher puts a circled <span class="tmark" aria-hidden="true">'
    '</span> on the slides he keeps for reference rather than for the paper. His decks '
    'carry the sign on {total} slides in all; {here} of them are pictures these notes '
    'had used, so they are collected here and the notes themselves teach only what the '
    'syllabus names. Each entry below says which section of the notes it came out of.'
    '</p>'
)


def chapter_files() -> list:
    def key(p):
        m = re.search(r"ch(\d+)", p.name)
        return int(m.group(1)) if m else 0
    return sorted(SITE.glob("ch*.js"), key=key)


def load_marks() -> dict:
    return json.loads(MARKS.read_text(encoding="utf-8"))


def field_span(text: str, name: str):
    """(start, end) of the inner text of a `name: ` ... `` ` `` field, or None."""
    m = re.search(rf"\n  {name}: `", text)
    if not m:
        return None
    start = m.end()
    end = text.find("`", start)
    if end < 0:
        return None
    return start, end


def cuts_in(learn: str, wanted: set) -> list:
    """Every wanted figure's block, with where it sits and the text to take out."""
    out = []
    for m in BLOCK.finditer(learn):
        if m.group("fig") not in wanted:
            continue
        s, e = cut_one(learn, m)
        out.append({"fig": m.group("fig"), "index": s, "cut": learn[s:e]})
    return out


def cut_out(learn: str, found: list) -> str:
    """The notes with the figures taken out: what `learn` reads after --apply."""
    new = learn
    for f in sorted(found, key=lambda f: -f["index"]):
        assert new[f["index"]:f["index"] + len(f["cut"])] == f["cut"], \
            f"the cut for {f['fig']} does not match the notes at {f['index']}"
        new = new[:f["index"]] + new[f["index"] + len(f["cut"]):]
    return new


def put_back(learn: str, found: list) -> str:
    """The notes with the figures back: what `learn` reads after --restore.

    The recorded index is a position in the text the figure was cut FROM, so it is
    not the position it goes back to in the text the figures were cut from: every
    block taken out ahead of it has already shortened the line. Inserting at the
    raw index puts the picture a few hundred characters further down the page, in
    the middle of whatever paragraph happens to be there - which is exactly what the
    round-trip self-test in --check exists to catch.
    """
    placed, offset = [], 0
    for f in sorted(found, key=lambda f: f["index"]):
        placed.append((f["index"] - offset, f["index"], f))
        offset += len(f["cut"])
    new = learn
    # Longest first, and on a tie the block that came LAST in the notes goes in
    # first: two figures that sit one after the other with nothing between them land
    # on the same position, and inserting them in note order would swap the pair -
    # the Bully algorithm lost its four slides that way.
    for pos, _index, f in sorted(placed, key=lambda p: (-p[0], -p[1])):
        new = new[:pos] + f["cut"] + new[pos:]
    return new


def learn_of(path: Path) -> str:
    """A chapter file's `learn` text, or "" when it has no such field."""
    text = path.read_text(encoding="utf-8")
    span = field_span(text, "learn")
    return text[span[0]:span[1]] if span else ""


def heading_text(s: str) -> str:
    """A heading as text, with the entities this site writes spelled out."""
    for a, b in (("&mdash;", "-"), ("&ndash;", "-"), ("&amp;", "&"), ("&nbsp;", " "),
                 ("&rsquo;", "'"), ("&ldquo;", '"'), ("&rdquo;", '"'), ("&#39;", "'")):
        s = s.replace(a, b)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s)).strip()


def anchor_of(marks: dict, fig: str) -> dict:
    """The section a marked figure is filed under - the marks data's own answer.

    `data/off_syllabus_slides.json` records, for every marked slide, the note
    section it was shown in. That section is the figure's home, and unlike a
    byte offset into the notes it does not move when the notes are edited.
    """
    for entry in marks["marked_slides"]:
        if entry.get("figure") != fig:
            continue
        section = (entry.get("shown_in") or [{}])[0].get("section") or {}
        return {"section": heading_text(section.get("title") or ""),
                "h": int(section.get("h") or 3)}
    return {}


def section_of(learn: str, pos: int, level: int = 6) -> str:
    """The heading a position sits under, at or above its own level, or "".

    Deeper headings are skipped deliberately: a section can carry an h4 of its own
    ("Where the name comes from" sits inside 3.4.2 The Bully algorithm), and the
    question being asked is which SECTION a picture is filed under, not which
    sub-heading happens to be the nearest one above it.
    """
    last = ""
    for m in HEAD.finditer(learn):
        if m.start() >= pos:
            break
        if int(m.group(1)) <= level:
            last = heading_text(m.group(2))
    return last


def section_end(learn: str, anchor: dict) -> int:
    """The end of the anchored section's body: where the next heading out starts.

    A section runs to the next heading at its own level or above, so its end is a
    position the notes can always recompute - which is the property a byte offset
    into a text under edit does not have. The section has to be named exactly once,
    so a title that matches two headings is refused rather than guessed at.
    """
    want, level = anchor.get("section"), int(anchor.get("h") or 3)
    heads = [(m.start(), int(m.group(1)), heading_text(m.group(2)))
             for m in HEAD.finditer(learn)]
    hits = [i for i, (_p, _l, t) in enumerate(heads) if t == want]
    if len(hits) != 1:
        raise LookupError(f"{want!r}, which {len(hits)} headings in the notes are called")
    for pos, lv, _t in heads[hits[0] + 1:]:
        if lv <= level:
            return pos
    return len(learn)


def repin(marks: dict) -> int:
    """Re-anchor the record to the page, and refuse unless the page agrees.

    WHY THIS EXISTS. `index` is a byte offset into the notes as they read when
    --apply last ran, so an edit ABOVE a figure moves that figure's number and the
    record quietly stops describing the page: on 2026-09-16 a heading pass shortened
    eleven headings in ch3 and ch4, and both chapters' records started rebuilding
    their notes with the pictures in the wrong paragraphs. The text the record was
    made against is not kept anywhere - the note files are not in git - so the fix
    is not to reconstruct it and not to guess where the figures used to be. It is
    to re-derive each position from the marks data's own anchor: the section the
    slide was shown in, which is recorded for exactly this purpose and survives any
    editing of the prose.

    A figure goes to the end of its own section's body, which is where the section
    can still be found; the tabs and the notes themselves do not change, and
    `--check` fails from now on if a recorded figure's anchor no longer agrees with
    where the record puts it. This is a re-anchor, not a recovery - the paragraph a
    figure sat under is not recoverable, and the record no longer claims it is.
    """
    data = json.loads(RECORD.read_text(encoding="utf-8"))["chapters"]
    out, notes = {}, []
    for n, c in data.items():
        path = SITE / c["file"]
        learn = learn_of(path)
        rows = []
        for f in c["found"]:
            anchor = anchor_of(marks, f["fig"])
            if not anchor:
                raise SystemExit(f"make_reference --repin: {f['fig']} is not in "
                                 f"{MARKS.relative_to(ROOT)}, so it has no section to be "
                                 f"anchored to")
            try:
                pos = section_end(learn, anchor)
            except LookupError as exc:
                raise SystemExit(f"make_reference --repin: {f['fig']} is filed under "
                                 f"{exc}; the notes have to carry that heading before the "
                                 f"picture can be anchored to it")
            rows.append((pos, f["index"], f, anchor))
        # In reading order, and on a tie in the order the figures were cut in - but
        # only if the anchors AGREE with that order. A figure filed under a section
        # that follows the next one's would mean the marks data and the record
        # describe different arrangements, and re-anchoring would hide it.
        rows.sort(key=lambda r: (r[0], r[1]))
        if [f["fig"] for _p, _i, f, _a in rows] != [f["fig"] for f in c["found"]]:
            raise SystemExit(f"{c['file']}: the sections the marks data files these figures "
                             f"under are not in the order the record cut them in - review "
                             f"both before re-anchoring")
        found, offset, moved = [], 0, []
        for pos, _old, f, anchor in rows:
            if pos != f["index"] - offset:
                moved.append(f"{f['fig'].split('/')[-1]} {f['index'] - offset}->{pos}")
            found.append({"fig": f["fig"], "index": pos + offset, "cut": f["cut"],
                          **anchor})
            offset += len(f["cut"])
        rebuilt = put_back(learn, found)
        if cut_out(rebuilt, found) != learn:
            raise SystemExit(f"{c['file']}: the re-anchored record does not invert on the notes")
        for f in found:
            if f["cut"] not in rebuilt:
                raise SystemExit(f"{c['file']}: {f['fig']} cannot be put back after re-anchoring")
            if section_of(rebuilt, f["index"], int(f["h"])) != f["section"]:
                raise SystemExit(f"{c['file']}: {f['fig']} does not land in "
                                 f"{f['section']!r} after re-anchoring")
        span = field_span(path.read_text(encoding="utf-8"), "reference")
        on_page = path.read_text(encoding="utf-8")[span[0]:span[1]][1:-1] if span else ""
        if build_reference(int(n), found, marks) != on_page:
            raise SystemExit(f"{c['file']}: re-anchoring would change the Reference tab, "
                             f"so something other than an offset moved")
        out[n] = {"file": c["file"], "found": found}
        notes.append(f"  {c['file']}: {len(found)} figure(s), {len(moved)} re-anchored"
                     + (f" ({'; '.join(moved[:3])}{' ...' if len(moved) > 3 else ''})"
                        if moved else ""))
    save_record(out)
    print("make_reference: re-anchored the record to the sections the marks data files "
          "each figure under")
    for line in notes:
        print(line)
    return check(marks)


def self_test():
    """None when cutting and putting back are exact inverses, else the reason."""
    wanted = {"x/one.webp", "x/two.webp", "x/three.webp"}
    found = cuts_in(SELFTEST, wanted)
    if len(found) != 3:
        return f"the self-test found {len(found)} of 3 blocks"
    back = cut_out(SELFTEST, found)
    if back == SELFTEST:
        return "the self-test cut nothing out"
    if put_back(back, found) != SELFTEST:
        return "cutting a figure out and putting it back does not reproduce the text"
    return None


def marked_by_chapter(marks: dict) -> dict:
    """chapter number -> {figure path: the data entry that put it there}."""
    out = {}
    for entry in marks["marked_slides"]:
        if not (entry.get("on_site") and entry.get("figure")):
            continue
        for seen in entry.get("shown_in") or []:
            m = re.match(r"ch(\d+)\.js$", seen.get("file", ""))
            if not m:
                continue
            out.setdefault(int(m.group(1)), {}).setdefault(entry["figure"], entry)
    return out


def cut_one(text: str, m: re.Match) -> tuple:
    """The span to remove for one figure, with one blank line tidied away.

    A figure sits between two paragraphs, so the newline that ended its own line and
    one of the two newlines that separated it from the text above are part of the
    block's own whitespace. Taking both is what stops the notes ending up with a
    double blank line where a picture used to be - and what makes --restore exact,
    because the recorded cut is the text that goes back.
    """
    s, e = m.start(), m.end()
    if text[e:e + 1] == "\n":
        e += 1
    if text[s - 2:s] == "\n\n":
        s -= 1
    return s, e


def plan(marks: dict) -> dict:
    """chapter number -> where each marked figure is and what to cut.

    A figure is either still in the notes (`found`, with the text to cut) or already
    on the Reference tab (`moved`). Anything in neither is a real problem: it means
    the figure left the site entirely, which is the failure this tool must never be
    able to hide, and --apply refuses to write.
    """
    by_ch = marked_by_chapter(marks)
    out = {}
    for path in chapter_files():
        n = int(re.search(r"ch(\d+)", path.name).group(1))
        wanted = by_ch.get(n)
        if not wanted:
            continue
        text = path.read_text(encoding="utf-8")
        span = field_span(text, "learn")
        learn = text[span[0]:span[1]] if span else ""
        rspan = field_span(text, "reference")
        reference = text[rspan[0]:rspan[1]] if rspan else ""
        found = cuts_in(learn, set(wanted))
        moved = [fig for fig in sorted(wanted) if fig in reference]
        seen = [f["fig"] for f in found]
        dupes = sorted({f for f in seen if seen.count(f) > 1})
        if dupes:
            raise SystemExit(f"{path.name}: figure(s) appear twice in the notes: "
                             f"{', '.join(dupes)}")
        out[n] = {"file": path.name, "learn": learn, "found": found,
                  "moved": moved,
                  "missing": sorted(set(wanted) - set(seen) - set(moved))}
    return out


def slide_list(slides: list) -> str:
    """`slides 76&ndash;78 and 84` - numbering a set the way a person would read it."""
    runs = []
    for s in sorted(set(slides)):
        if runs and s == runs[-1][1] + 1:
            runs[-1][1] = s
        else:
            runs.append([s, s])
    parts = [f"{a}" if a == b else f"{a}&ndash;{b}" for a, b in runs]
    if len(parts) == 1:
        head = parts[0]
    elif len(parts) == 2:
        head = f"{parts[0]} and {parts[1]}"
    else:
        head = ", ".join(parts[:-1]) + " and " + parts[-1]
    return ("slide " if len(set(slides)) == 1 else "slides ") + head


# What a marked picture says instead of a caption when its own slide carries no
# words the extractor could read. tools/slim_dcc_figures.py rewrites the captions
# on this same tab and uses the same string, so the two agree about every figure
# rather than each being right about half of them.
REF_ALT = "Illustration from the teacher's reference material"


def shown(cut: str, fig: str) -> str:
    """A marked figure as the tab shows it: the picture's own words as its
    caption, or no caption at all - never the deck's file name, which is what
    this tab used to read (`slide 35 · Chapter4_lecture_notes_all.pptx`)."""
    return rewire(cut, build_caption(figure_meta().get(fig, {})), REF_ALT)


def build_reference(n: int, found: list, marks: dict) -> str:
    """The Reference tab's HTML for one chapter, derived from the marks data.

    Figures are grouped under the section they were lifted out of, in the order
    those sections appear in the notes, because four separate headings all reading
    "3.4.2 The Bully algorithm" is noise - and the four Bully figures are one idea,
    not four.
    """
    entries = marked_by_chapter(marks)
    total = len(marks["marked_slides"])
    groups = {}
    for f in sorted(found, key=lambda f: f["index"]):
        entry = entries[n][f["fig"]]
        section = (entry.get("shown_in") or [{}])[0].get("section") or {}
        title = section.get("title") or "Reference figure"
        g = groups.setdefault(title, {"slides": [], "decks": [], "figs": []})
        g["slides"].append(entry["slide"])
        if entry["deck"] not in g["decks"]:
            g["decks"].append(entry["deck"])
        g["figs"].append(f)

    parts = [INTRO.format(total=total, here=len(found))]
    for title, g in groups.items():
        deck = ", ".join(f"<em>{d}</em>" for d in g["decks"])
        parts.append(f"<h3>{title}</h3>")
        parts.append(
            f'<p class="ref-meta">From {deck}, {slide_list(g["slides"])} &mdash; the '
            f'teacher marks these slides, so the pictures are kept here and the notes '
            f'keep the section itself, because the syllabus names it.</p>')
        parts.extend(shown(f["cut"], f["fig"]).rstrip("\n") for f in g["figs"])
    return "\n\n".join(parts)


def build_file(text: str, n: int, found: list, marks: dict) -> tuple:
    """(new file text, new learn text). Removes the cuts, adds the reference field."""
    span = field_span(text, "learn")
    learn = text[span[0]:span[1]]
    for f in sorted(found, key=lambda f: -f["index"]):
        assert learn[f["index"]:f["index"] + len(f["cut"])] == f["cut"], \
            f"ch{n}: cut at {f['index']} does not match the notes"
    new_learn = cut_out(learn, found)
    assert new_learn != learn or not found
    text = text[:span[0]] + new_learn + text[span[1]:]

    ref = build_reference(n, found, marks)
    block = f"  reference: `\n{ref}\n`,\n"
    # The prose fields end where the data arrays begin; the new field goes there so
    # a chapter's shapes (learn, pastSummary, reference) stay above its records.
    m = re.search(r"\n  (quiz|past): \[", text)
    if not m:
        raise SystemExit(f"ch{n}: no data array to anchor the new field to")
    return text[:m.start() + 1] + block + text[m.start() + 1:], new_learn


def save_record(chapters: dict):
    RECORD.write_text(json.dumps({
        "_comment": [
            "The figures tools/make_reference.py moved out of the notes and onto the",
            "Reference tab: where each was cut from (index into the chapter's `learn`",
            "text) and the text that was cut, kept verbatim so --restore is exact.",
            "`section` and `h` are the note section the marks data files the slide",
            "under - the half of the record an edit cannot invalidate, and the half",
            "--check tests. Entries written by --repin are anchored to the end of that",
            "section rather than to the paragraph the figure first sat under, which",
            "the notes no longer record. Generated by the tool; do not hand-edit.",
        ],
        "chapters": {str(n): {"file": c["file"], "found": c["found"]}
                     for n, c in chapters.items()},
    }, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")


def apply(marks: dict, chapters: dict) -> int:
    moved = 0
    for n, c in chapters.items():
        if c["missing"]:
            raise SystemExit(f"{c['file']}: the marks data says these figures are on the "
                             f"site, but they are in neither the notes nor the Reference "
                             f"tab: {', '.join(c['missing'])}")
        if not c["found"]:
            continue
        path = SITE / c["file"]
        before = path.read_text(encoding="utf-8")
        after, new_learn = build_file(before, n, c["found"], marks)
        # The notes must lose exactly the figures and nothing else. Counting the
        # characters that leave is the cheapest proof of that, and it is the check
        # that would have caught the missing content in the earlier move.
        moved_chars = sum(len(f["cut"]) for f in c["found"])
        want = len(c["learn"]) - moved_chars
        if len(new_learn) != want:
            raise SystemExit(f"{path.name}: notes lost {len(c['learn']) - len(new_learn)} "
                             f"characters, expected {moved_chars}")
        for f in c["found"]:
            if f["cut"].strip() not in after:
                raise SystemExit(f"{path.name}: {f['fig']} did not reach the Reference tab")
            if f["fig"] in new_learn:
                raise SystemExit(f"{path.name}: {f['fig']} is still in the notes")
        path.write_text(after, encoding="utf-8")
        moved += len(c["found"])
    return moved


def restore(marks: dict) -> int:
    """Put the notes back exactly as they were, and drop the reference fields."""
    if not RECORD.exists():
        print("make_reference: no record to restore from")
        return 0
    data = json.loads(RECORD.read_text(encoding="utf-8"))["chapters"]
    put = 0
    for n, c in data.items():
        path = SITE / c["file"]
        text = path.read_text(encoding="utf-8")
        span = field_span(text, "learn")
        # No leading newline in the pattern: the field's own text, including the
        # newline it ends on, is exactly what --apply inserted, so taking it out is
        # what puts the file back as it was.
        m = re.search(r"  reference: `\n.*?\n`,\n", text, re.S)
        if not m:
            raise SystemExit(f"{c['file']}: no reference field to remove")
        text = text[:m.start()] + text[m.end():]
        span = field_span(text, "learn")
        learn = text[span[0]:span[1]]
        text = text[:span[0]] + put_back(learn, c["found"]) + text[span[1]:]
        path.write_text(text, encoding="utf-8")
        put += len(c["found"])
    return put


def check(marks: dict) -> int:
    """Exit 1 when the page and the marks data disagree."""
    problems = []
    broken = self_test()
    if broken:
        problems.append(broken + " - do not run --apply and --restore until this passes")
    for path in chapter_files():
        if OLD_CHIP in path.read_text(encoding="utf-8"):
            problems.append(f"{path.name}: still carries the old {OLD_CHIP} chip")
    by_ch = marked_by_chapter(marks)
    for path in chapter_files():
        n = int(re.search(r"ch(\d+)", path.name).group(1))
        text = path.read_text(encoding="utf-8")
        lspan = field_span(text, "learn")
        learn = text[lspan[0]:lspan[1]] if lspan else ""
        rspan = field_span(text, "reference")
        reference = text[rspan[0]:rspan[1]] if rspan else ""
        for fig in sorted(by_ch.get(n, {})):
            if fig in learn:
                problems.append(f"{path.name}: {fig} is marked by the teacher but still in the notes")
            elif fig not in reference:
                problems.append(f"{path.name}: {fig} is marked by the teacher and is in "
                                f"neither the notes nor the Reference tab")
        if not by_ch.get(n):
            if rspan:
                problems.append(f"{path.name}: has a Reference field but no marked slide")
            continue
        if not rspan:
            problems.append(f"{path.name}: marked slides are shown here but there is no "
                            f"Reference field - run --apply")
            continue
        if not RECORD.exists():
            problems.append("data/reference_figs.json is missing - run --apply")
            continue
        rec = json.loads(RECORD.read_text(encoding="utf-8"))["chapters"].get(str(n))
        if not rec:
            problems.append(f"ch{n}: not in the record - run --apply")
            continue
        # Rebuild the tab from the data rather than trusting what is on the page: a
        # re-extracted deck that moves the icon has to show up as a failure here.
        want = build_reference(n, rec["found"], marks)
        if text[rspan[0]:rspan[1]] != "\n" + want + "\n":
            problems.append(f"{path.name}: the Reference tab no longer matches the marks data")
        for f in rec["found"]:
            # Compared as the tab shows it, not as it was in the notes: the caption
            # is rewritten on arrival (REF_ALT / shown), so the raw cut is the wrong
            # thing to look for - it is the text that was removed, and it is
            # deliberately not what is on the page.
            if shown(f["cut"], f["fig"]) not in text[rspan[0]:rspan[1]]:
                problems.append(f"{path.name}: {f['fig']} is not on the Reference tab")
        # The recorded cuts have to invert on the real notes, not just on the
        # self-test's snippet: the notes --restore would rebuild must be the notes
        # the figures came out of, so cutting that text back down must give the page
        # as it stands now. An offset recorded against the wrong text fails here.
        applied = text[lspan[0]:lspan[1]] if lspan else ""
        if lspan and rec["found"]:
            rebuilt = put_back(applied, rec["found"])
            if cut_out(rebuilt, rec["found"]) != applied:
                problems.append(f"{path.name}: the recorded cuts do not invert on the "
                                f"notes - a later edit moved a figure, run --repin")
            for f in rec["found"]:
                if f["cut"] not in rebuilt:
                    problems.append(f"{path.name}: {f['fig']} cannot be put back where it came from")
                # The anchor is the durable half of the record and the offset is the
                # fragile half, so the anchor is what gets checked against the page:
                # a heading renamed above a figure moves its index without moving its
                # section, and that is exactly the drift this catches.
                here = section_of(rebuilt, f["index"], int(f.get("h") or 3))
                if f.get("section") and here != f["section"]:
                    problems.append(f"{path.name}: {f['fig']} is filed under "
                                    f"{f['section']!r}, but the record now puts it in "
                                    f"{here!r} - run --repin")

    for p in problems:
        print("  " + p, file=sys.stderr)
    return 1 if problems else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--repin", action="store_true",
                    help="re-anchor the record after a chapter was edited above a figure")
    ap.add_argument("--restore", action="store_true")
    args = ap.parse_args()
    if not (args.apply or args.check or args.restore or args.repin):
        args.check = True

    marks = load_marks()
    if args.repin:
        return repin(marks)
    if args.restore:
        print(f"make_reference: put {restore(marks)} figure(s) back into the notes")
        return 0
    if args.apply:
        chapters = plan(marks)
        n = apply(marks, chapters)
        if n:
            save_record({k: c for k, c in chapters.items() if c["found"]})
        print(f"make_reference: moved {n} marked figure(s) onto the Reference tab in "
              f"{len([c for c in chapters.values() if c['found']])} chapter(s); "
              f"record in {RECORD.relative_to(ROOT)}")
        return check(marks)
    return check(marks)


if __name__ == "__main__":
    raise SystemExit(main())
