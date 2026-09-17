#!/usr/bin/env python3
"""Take the teacher's slide screenshots out of the reading flow.

The notes were *written from* the teacher's decks and lecture pages: every fact
those pictures carry was already extracted, matched and rewritten into the prose.
So each pasted screenshot was a second copy of the paragraph above it - and its
caption was the machine's own filler, `Figure for 4.3.4 Messaging middleware:
MQTT and AMQP`, which is the section heading echoed back at the reader. Across the
nine units that was **201 pictures inside `learn`**, one per 250 words, and 157 of
them captioned that way. The reader's verdict was that the site reads like notes
thrown at a page rather than a study guide.

The fix is not to lose anything. Each unit keeps a `slides` field holding every
picture that left the notes, grouped under the heading of the section it came out
of, and the Reference tab draws it below the teacher's circled-i material. What
the notes keep is the thing they need: the hand-drawn figures the prose is built
around (`tools/check_figures.js` owns those, and nothing here touches an `<svg>`),
plus the handful of pictures a sentence in the text actually points at - a
screenshot whose paragraph says "in the diagram, B and F can receive remote
invocations" cannot leave without leaving that sentence dangling.

    keep   - a picture the notes point at: `tools/dcc_figure_keepers.json` names
             it, with the caption to give it, because the caption the extractor
             produced for it was junk.
    move   - everything else. It is rewritten into `slides` with a caption that
             comes from the picture's own words, or with no caption at all when it
             has none - never with the section heading, and never with a file name.

Three other things the same complaint covers are handled here too:

  * the per-chapter `<p class="fig-src-note">` line, which named the source decks
    at the end of every unit - a file name in the middle of the notes. Provenance
    is not lost: each group on the Reference tab names its source once;
  * the two "Extra pages ... not on the syllabus" dumps, which sat on the Past
    Questions tab as four raw page images with a paragraph justifying them. They
    move to `slides` whole, heading and explanation included;
  * the two sentences that promised the reader "the figures below" a sequence of
    pictures. Those sentences are patched to point at the Reference tab, so no
    clause in the notes refers to a picture that is no longer there.

`--check` fails if a picture that is not a keeper comes back into the notes, if a
caption names a file, or if any of the three complaints above returns - and it
proves that on its own. The list of pictures that should have moved comes from
assets/dcc-slides/FIGURES.json, not from anything this tool wrote, so a pipeline
re-run that pasted all 201 back cannot pass by agreeing with its own journal.

`--apply` writes data/slim_figures.json as it goes: the field, the position in it,
and the exact text that came out, so `--restore` can put the notes back byte for
byte. That journal is the only copy of the text it holds, so two things are
refused rather than allowed to damage it - a second `--apply` over a unit that
already has a slides field (which would overwrite the journal with a run that has
nothing left to cut), and a `--restore` that would remove a slides field holding
pictures its journal cannot put back. The move has already been made across all
nine units and that run's journal is not in the repository, so `--restore` has
nothing to work from here; every picture is still on disk, and
`tools/place_dcc_figures.py` is what re-places them.

    python tools/slim_dcc_figures.py --report   # what would move, per unit
    python tools/slim_dcc_figures.py --apply    # move them
    python tools/slim_dcc_figures.py --check    # the gate
    python tools/slim_dcc_figures.py --restore  # put the notes back (see above)

Note for a future re-run of the extraction pipeline: `tools/place_dcc_figures.py`
strips every `<!-- dcc-fig: -->` block it can find and re-derives the placement
from scratch, so running it after this tool would put all 201 pictures back into
`learn`. Run this tool after it, not before.
"""

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from figcaptions import (BLOCK, build_caption, figure_meta, recaption,  # noqa: E402
                          rewire, text_of)

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "dcc-site"
FIGURES = ROOT / "assets" / "dcc-slides" / "FIGURES.json"
KEEP = ROOT / "tools" / "dcc_figure_keepers.json"
RECORD = ROOT / "data" / "slim_figures.json"

ETC = re.compile(r"<p class=\"fig-src-note\">.*?</p>", re.S)
EXTRAS = re.compile(r"<!-- dcc-fig-extras:start -->.*?<!-- /dcc-fig-extras -->", re.S)
EXTRAS_OPEN = "<!-- dcc-fig-extras:start -->"
EXTRAS_CLOSE = "<!-- /dcc-fig-extras -->"
HEAD = re.compile(r"<h([23])>(?P<title>.*?)</h\1>", re.S)
# Emphasis tags, and only those. A patched sentence is checked against the notes
# for being present, not for carrying the same markup: tools/emphasis_audit.py
# removes `<strong>` from prose it decides is over-emphasised, and that pass runs
# after this one, so a sentence whose words are all still there but whose bold has
# gone is a sentence that is still in force - comparing the raw markup would fail
# on a difference this tool does not own and cannot fix.
EMPHASIS = re.compile(r"</?(?:strong|em|b|i)\s*>", re.I)

# A caption that is doing the section heading's job or naming a source file.
FILLER = re.compile(r"^(figure|slide|page) for\b", re.I)
FILENAME = re.compile(r"\.(pptx|ppt|pdf|docx?)\b", re.I)

# Fields the tool moves pictures out of, in the order a chapter declares them.
FIELDS = ("learn", "pastSummary")
# Fields whose captions it rewrites in place. `reference` is the teacher's
# circled-i material, moved there by tools/make_reference.py before this tool
# existed - so its captions were never cleaned, and they are the reader's own
# example ("page 2 \u00b7 GFS_HDFS_Lecture.pdf"). make_reference.py's builder emits
# the same form, which is why both sides import tools/figcaptions.py.
REWRITE_FIELDS = ("reference",)


# Set by --only: a 9-unit reform is easier to check one unit at a time, and it is
# the only way to bring a single chapter back if one run is interrupted.
ONLY = None


def chapter_files() -> list:
    def key(p):
        m = re.search(r"ch(\d+)", p.name)
        return int(m.group(1)) if m else 0
    files = sorted(SITE.glob("ch*.js"), key=key)
    if ONLY:
        files = [p for p in files if chapter_no(p) in ONLY]
    return files


def chapter_no(path: Path) -> int:
    return int(re.search(r"ch(\d+)", path.name).group(1))


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


def text_of(html: str) -> str:
    t = re.sub(r"<[^>]+>", " ", html)
    for a, b in (("&mdash;", "—"), ("&ndash;", "–"), ("&middot;", "·"),
                 ("&amp;", "&"), ("&nbsp;", " "), ("&hellip;", "…")):
        t = t.replace(a, b)
    return re.sub(r"\s+", " ", t).strip()


def cut_one(text: str, m: re.Match) -> tuple:
    """The span to remove for one block, with one blank line tidied away.

    A picture sits between two paragraphs, so the newline that ended its own line
    and one of the two newlines that separated it from the text above belong to
    the block. Taking both is what stops the notes ending up with a double blank
    line where a picture used to be, and it is what makes --restore exact: the
    recorded cut is the text that goes back.
    """
    s, e = m.start(), m.end()
    if text[e:e + 1] == "\n":
        e += 1
    if text[s - 2:s] == "\n\n":
        s -= 1
    return s, e


def cut_out(text: str, found: list) -> str:
    new = text
    for f in sorted(found, key=lambda f: -f["index"]):
        assert new[f["index"]:f["index"] + len(f["cut"])] == f["cut"], \
            f"the cut at {f['index']} does not match the text"
        new = new[:f["index"]] + new[f["index"] + len(f["cut"]):]
    return new


def put_back(text: str, found: list) -> str:
    """The text with the blocks back: the inverse of cut_out.

    The recorded index is a position in the text the block was cut FROM, so it is
    not the position it goes back to in the text the blocks were cut from: every
    block removed ahead of it has already shortened the line. Longest first, and
    on a tie the block that came last goes in first, because two blocks with
    nothing between them resolve to the same position and inserting them in note
    order would swap the pair.
    """
    placed, offset = [], 0
    for f in sorted(found, key=lambda f: f["index"]):
        placed.append((f["index"] - offset, f["index"], f))
        offset += len(f["cut"])
    new = text
    for pos, _index, f in sorted(placed, key=lambda p: (-p[0], -p[1])):
        new = new[:pos] + f["cut"] + new[pos:]
    return new


SELFTEST = (
    '<p>a</p>\n\n<!-- dcc-fig:x/one.webp -->\n<figure class="figure-wrap">\n<img>\n'
    '</figure>\n<!-- /dcc-fig -->\n\n<p>b</p>\n<!-- dcc-fig:x/two.webp -->\n'
    '<figure class="figure-wrap">\n<img>\n</figure>\n<!-- /dcc-fig -->\n'
    '<!-- dcc-fig:x/three.webp -->\n<figure class="figure-wrap">\n<img>\n</figure>\n'
    '<!-- /dcc-fig -->\n<p>c</p>\n')


def self_test() -> str:
    """None when cutting and putting back are exact inverses, else the reason."""
    found = []
    for m in BLOCK.finditer(SELFTEST):
        s, e = cut_one(SELFTEST, m)
        found.append({"fig": m.group("fig"), "index": s, "cut": SELFTEST[s:e]})
    if len(found) != 3:
        return f"the self-test found {len(found)} of 3 blocks"
    back = cut_out(SELFTEST, found)
    if back == SELFTEST:
        return "the self-test cut nothing out"
    if put_back(back, found) != SELFTEST:
        return "cutting a block out and putting it back does not reproduce the text"
    return None


# ---------------------------------------------------------------- planning

def load_keepers() -> dict:
    return json.loads(KEEP.read_text(encoding="utf-8"))


def sections_of(body: str) -> list:
    """[(start, title)] for every h2/h3 in the notes, in reading order."""
    out = []
    for m in HEAD.finditer(body):
        out.append((m.start(), text_of(m.group("title"))))
    return out


# Every section heading in these notes leads with its syllabus number (see
# data/syllabus_map.json), so a heading that does not is not a content section.
NUMBERED = re.compile(r"^\d")
OTHER = "Other pictures from this unit"


def section_at(sections: list, pos: int) -> str:
    title = ""
    for start, t in sections:
        if start < pos:
            title = t
        else:
            break
    return title or "The unit"


def group_title(section: str) -> str:
    """The heading a group of pictures is filed under.

    Two pictures in the whole set sat after the exam-facing summary rather than
    inside a topic, so their nearest heading was "Exam-facing summary" - a fact
    about the paper, and the wrong label for a shelf of the teacher's slides. Any
    picture not tied to a numbered content section is filed as one group instead,
    with its deck and slides named in the meta line beneath.
    """
    return section if NUMBERED.match(section) else OTHER


CAPTION_TAG = re.compile(r"<figcaption>(?P<body>.*?)</figcaption>", re.S)


def caption_for(block: str, entry: dict) -> str:
    """The caption to give a moved picture.

    A caption that already says something keeps it. Two other passes have been
    here first - `tools/fix_captions.py` and `tools/voice_rewrite.py`, whose
    catalogue carries hand-written replacements for captions that were offending
    ("The benefits of cloud computing" for a slide whose caption named a paper
    question) - and regenerating from the extraction would undo that work and, in
    voice_rewrite's words, revert a rewritten passage. So the extractor's own words
    are the fallback, not the rule: they are used exactly when what is there is
    filler ("Figure for 4.3.4 ..."), a file name, or nothing at all.
    """
    found = CAPTION_TAG.search(block)
    existing = text_of(found.group("body")) if found else ""
    if existing and not FILLER.match(existing) and not FILENAME.search(existing):
        return existing
    return build_caption(entry)


def slide_list(nums: list, kind: str) -> str:
    """`slides 76–78 and 84` - numbering a set the way a person would read it."""
    runs = []
    for s in sorted(set(nums)):
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
    return ("slide " if len(set(nums)) == 1 else "slides ") + head


INTRO = (
    '<h2>The teacher\'s slides for this unit</h2>\n'
    '<p class="ref-intro">These are the pictures that came with this unit &mdash; the class '
    'deck, the reference notes and the pages handed out with them &mdash; collected here so '
    'that the notes above read as writing rather than as a pile of screenshots. Each group is '
    'headed by the section of the notes its pictures belong to, in that order, and names the '
    'file and the slides they came from. The diagrams the notes themselves need are drawn in '
    'the notes.</p>'
)


def build_slides(groups: list, extras: str, meta: dict) -> str:
    """The Reference tab's slides block: one group per section, in notes order."""
    parts = [INTRO]
    for g in groups:
        deck = ", ".join(f"<em>{d}</em>" for d in g["decks"])
        where = slide_list(g["nums"], "slide")
        parts.append(f"<h3>{g['section']}</h3>")
        parts.append(f'<p class="ref-meta">From {deck}, {where}.</p>')
        parts.extend(g["figures"])
    if extras:
        # The tooling markers come off: this is a copy on a page, not a block for
        # place_dcc_figures.py to find and re-derive. Its own captions are cleaned
        # in place first, because a block travels whole.
        block = extras.strip().replace(EXTRAS_OPEN, "").replace(EXTRAS_CLOSE, "")
        parts.append(recaption(block, "Illustration from material outside the syllabus").strip())
    return "\n\n".join(parts)


def plan(keepers: dict) -> dict:
    """chapter number -> the cuts, the groups, and the patched sentences.

    Every change is one operation: the text to take out, and the text to put in
    its place. A picture that moves puts nothing back; a kept picture whose
    caption was filler puts back the same block with a written caption. One shape
    for both is what lets --apply and --restore be exact inverses - the record
    holds the removed text verbatim, so putting it back cannot guess.
    """
    keep = keepers["keep"]
    meta = figure_meta()
    out = {}
    for path in chapter_files():
        n = chapter_no(path)
        text = path.read_text(encoding="utf-8")
        ops, moved = [], []
        extras = None
        for name in FIELDS:
            span = field_span(text, name)
            if not span:
                continue
            body = text[span[0]:span[1]]
            sections = sections_of(body)
            # An off-syllabus dump is moved as one block, so the figures inside it
            # must not also be cut one by one - two overlapping cuts on the same
            # characters is text that no longer adds up, and --restore could not
            # put it back. The block is found first and its own span skipped.
            dump = EXTRAS.search(body) if name == "pastSummary" else None
            inside = (dump.start(), dump.end()) if dump else None
            for m in BLOCK.finditer(body):
                if inside and inside[0] <= m.start() < inside[1]:
                    continue
                fig = m.group("fig")
                s, e = cut_one(body, m)
                section = section_at(sections, m.start())
                if fig in keep:
                    ops.append({"field": name, "fig": fig, "index": s, "cut": body[s:e],
                                "put": rewire(body[s:e], keep[fig],
                                              f"Illustration for {section}"),
                                "section": section, "moved": False})
                    continue
                ops.append({"field": name, "fig": fig, "index": s, "cut": body[s:e],
                            "put": "", "section": section,
                            "caption": caption_for(body[s:e], meta.get(fig, {})),
                            "moved": True})
                moved.append({"fig": fig, "section": section})
            for m in ETC.finditer(body):
                s, e = cut_one(body, m)
                ops.append({"field": name, "fig": None, "index": s, "cut": body[s:e],
                            "put": "", "section": None, "moved": False})
            if dump:
                s, e = cut_one(body, dump)
                held = [f.group("fig") for f in BLOCK.finditer(body[s:e])]
                extras = {"field": name, "fig": None, "figs": held, "index": s,
                          "cut": body[s:e], "put": "", "section": None,
                          "moved": True}
        # Captions on the Reference tab are rewritten where they stand. They are
        # not moved, so make_reference.py's own field stays its own: only the
        # wording of the caption changes.
        for name in REWRITE_FIELDS:
            span = field_span(text, name)
            if not span:
                continue
            body = text[span[0]:span[1]]
            for m in BLOCK.finditer(body):
                s, e = cut_one(body, m)
                fixed = rewire(body[s:e], build_caption(meta.get(m.group("fig"), {})),
                               "Illustration from the teacher's reference material")
                if fixed == body[s:e]:
                    continue
                ops.append({"field": name, "fig": m.group("fig"), "index": s,
                            "cut": body[s:e], "put": fixed, "recaptioned": True,
                            "section": None, "moved": False})
        out[n] = {"file": path.name, "ops": ops, "moved": moved,
                  "extras": extras, "meta": meta}
    return out


def group_moved(plan_entry: dict, extras_text: str, keep: dict) -> list:
    """The moved pictures as Reference-tab groups, in the order the notes had them."""
    meta = plan_entry["meta"]
    order = {"learn": 0, "pastSummary": 1}
    figs = [c for c in plan_entry["ops"] if c["moved"]]
    figs.sort(key=lambda c: (order.get(c["field"], 9), c["index"]))
    groups, seen = [], {}
    for c in figs:
        e = meta.get(c["fig"], {})
        key = group_title(c["section"])
        g = seen.get(key)
        if g is None:
            g = {"section": key, "decks": [], "nums": [], "figures": []}
            seen[key] = g
            groups.append(g)
        src = e.get("source") or "the unit's material"
        if src not in g["decks"]:
            g["decks"].append(src)
        num = e.get("slide") if e.get("kind") == "slide" else e.get("page")
        if num is not None:
            g["nums"].append(num)
        caption = c.get("caption") if c.get("caption") is not None else build_caption(e)
        g["figures"].append(rewire(c["cut"].strip(), caption,
                                   f"Illustration for {key}"))
    for g in groups:
        if not g["nums"]:
            g["nums"] = [0]
    return groups


def edit_field(body: str, ops: list, forward: bool) -> str:
    """Apply (or undo) one field's operations.

    Forward, each operation is `text[index:index+len(cut)]` replaced by its `put`.
    Backward it is the same exchange in reverse.

    `index` is a position in the ORIGINAL text, so in the worked-on text an
    operation sits at `index - (everything taken out ahead of it) + (everything
    put in ahead of it)`. Leaving the second term out is a subtle, silent way to
    be wrong: for a pure cut `put` is empty and the formula is accidentally right,
    so the error only shows on a block that was rewritten in place - and then it
    lands the text tens of characters from where it belongs, inside whatever
    paragraph happens to be there. Both terms are counted, and the loop goes in
    descending order so the operations still to come cannot shift the position of
    the one being handled.
    """
    ordered = sorted(ops, key=lambda o: o["index"])
    if forward:
        for o in reversed(ordered):
            if body[o["index"]:o["index"] + len(o["cut"])] != o["cut"]:
                raise SystemExit(f"the text at {o['index']} is not the block that was cut")
            body = body[:o["index"]] + o["put"] + body[o["index"] + len(o["cut"]):]
        return body
    delta, placed = 0, []
    for o in ordered:
        placed.append(o["index"] - delta)
        delta += len(o["cut"]) - len(o["put"])
    for o, pos in reversed(list(zip(ordered, placed))):
        if body[pos:pos + len(o["put"])] != o["put"]:
            raise SystemExit(f"the text at {pos} is not what --apply wrote")
        if o["cut"] and body[pos + len(o["put"]):pos + len(o["put"]) + len(o["cut"])] == o["cut"]:
            raise SystemExit(f"the text at {pos} is already back - --restore has run twice")
        body = body[:pos] + o["cut"] + body[pos + len(o["put"]):]
    return body


def apply(keepers: dict, plan_data: dict) -> int:
    total = 0
    record = {}
    patched = {}
    for path in chapter_files():
        n = chapter_no(path)
        p = plan_data[n]
        # Every chapter gets a record entry even when it has no pictures, so that
        # --check can tell "this unit needs no move" from "this unit was never run".
        record[str(n)] = {"file": path.name,
                          "ops": list(p["ops"]) + ([p["extras"]] if p["extras"] else []),
                          "prose": []}
        if not p["ops"] and not p["extras"]:
            continue
        text = path.read_text(encoding="utf-8")
        if field_span(text, "slides") is not None:
            # A second --apply over a unit that has already been through this tool
            # finds nothing left to cut, and would replace that unit's journal
            # entry - the only copy of the text that came out - with a run that
            # records an empty move. Refuse instead: the notes are already right.
            raise SystemExit(
                f"{path.name}: it already has a slides field, so its pictures have "
                f"already moved and the text this tool would cut out is not in the "
                f"file any more - nothing to do. Restore the unit first if it really "
                f"has to be run again, and see the module docstring for why "
                f"--restore is not available for the shipped nine.")
        learn_len = field_span(text, "learn")[1] - field_span(text, "learn")[0]

        extras_text = p["extras"]["cut"] if p["extras"] else ""
        groups = group_moved(p, extras_text, keepers["keep"])
        slides = build_slides(groups, extras_text, p["meta"])
        slides_block = f"  slides: `\n{slides}\n`,\n"

        ops = list(p["ops"]) + ([p["extras"]] if p["extras"] else [])
        per_field = {}
        for o in ops:
            per_field.setdefault(o["field"], []).append(o)
        for name, field_ops in per_field.items():
            span = field_span(text, name)
            body = text[span[0]:span[1]]
            new = edit_field(body, field_ops, True)
            want = len(body) + sum(len(o["put"]) - len(o["cut"]) for o in field_ops)
            if len(new) != want:
                raise SystemExit(f"{path.name}: {name} changed by "
                                 f"{len(new) - len(body)}, expected {want - len(body)}")
            text = text[:span[0]] + new + text[span[1]:]

        # The sentences the reader would otherwise find pointing at a picture that
        # has left, and the pointer to where it went. Applied after the operations
        # above, so every recorded index stays a position in the text they came
        # from - which is what makes --restore exact.
        for fix in keepers.get("prose", []):
            if fix["file"] != path.name:
                continue
            entry = {"old": fix["old"], "new": fix["new"]}
            if fix["old"] in text:
                text = text.replace(fix["old"], fix["new"], 1)
            elif fix["new"] not in text:
                # Neither form is there, so this is a stale entry rather than a
                # second run - and a stale entry is how a patch silently stops
                # matching the sentence it was written for.
                raise SystemExit(f"{path.name}: the sentence to patch is neither in the "
                                 f"file nor already patched: {fix['old'][:70]}")
            # Recorded either way, so --restore can undo the patch from a run that
            # applied it as well as from one that found it already applied - a
            # second --apply is a no-op rather than an error.
            patched.setdefault(path.name, []).append(entry)

        # The slides field goes with the prose fields, above the chapter's data.
        m = re.search(r"\n  (quiz|past): \[", text)
        if not m:
            raise SystemExit(f"{path.name}: no data array to anchor the slides field to")
        text = text[:m.start() + 1] + slides_block + text[m.start() + 1:]

        lspan = field_span(text, "learn")
        if lspan[1] - lspan[0] > learn_len:
            raise SystemExit(f"{path.name}: the notes grew - the move lost nothing but added text")
        for o in p["ops"]:
            if o["moved"] and o["fig"] in text[lspan[0]:lspan[1]]:
                raise SystemExit(f"{path.name}: {o['fig']} is still in the notes")
            if o["put"]:
                span2 = field_span(text, o["field"])
                held = text[span2[0]:span2[1]]
                if o["put"] not in held and o["put"] not in text:
                    raise SystemExit(f"{path.name}: the rewritten {o['fig']} or caption "
                                     f"did not reach the {o['field']} field")

        path.write_text(text, encoding="utf-8")
        record[str(n)]["ops"] = ops
        record[str(n)]["prose"] = patched.get(path.name, [])
        total += len(p["moved"])
    # Merged rather than replaced: --only writes one unit at a time, and a run that
    # dropped the other eight units' entries would make --restore unable to reach
    # them - the record is the only copy of the text that came out.
    if RECORD.exists():
        old = json.loads(RECORD.read_text(encoding="utf-8"))["chapters"]
        old.update(record)
        record = old
    RECORD.write_text(json.dumps({
        "_comment": [
            "Every change tools/slim_dcc_figures.py made to the DCC notes: the field it",
            "changed, the position in that field's text, the exact text that came out,",
            "and the exact text that went in. A picture that moved says put=\"\"; a",
            "kept picture whose caption was filler carries the written caption it got.",
            "Verbatim, so --restore is exact. Generated; do not hand-edit.",
        ],
        "chapters": record,
    }, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    return total


def restore() -> int:
    """Put the notes back byte for byte, and drop the slides fields."""
    if not RECORD.exists():
        print(f"slim_dcc_figures: no {RECORD.relative_to(ROOT)} to restore from. The "
              f"run that moved the pictures wrote one, and it is not here, so the "
              f"text it removed is gone. Nothing is lost from the site: every "
              f"picture is still under assets/dcc-slides, and "
              f"tools/place_dcc_figures.py re-places them.")
        return 0
    try:
        data = json.loads(RECORD.read_text(encoding="utf-8"))["chapters"]
    except (json.JSONDecodeError, KeyError) as exc:
        print(f"slim_dcc_figures: {RECORD.relative_to(ROOT)} is not a usable record "
              f"({exc}); nothing to restore from")
        return 0
    put = 0
    for n, c in data.items():
        if ONLY and int(n) not in ONLY:
            continue
        path = SITE / c["file"]
        text = path.read_text(encoding="utf-8")
        m = re.search(r"  slides: `\n.*?\n`,\n", text, re.S)
        if not m:
            # No slides field means this chapter has already been put back, or was
            # never applied. Say which: if every recorded block is present then the
            # file is its old self and skipping is right, and if one is missing then
            # something else has moved and guessing would corrupt it.
            missing = []
            for o in c["ops"]:
                span = field_span(text, o["field"])
                if not span or o["cut"] not in text[span[0]:span[1]]:
                    missing.append(o["fig"] or "(a fig-src-note line)")
            if missing:
                raise SystemExit(f"{c['file']}: no slides field and {len(missing)} "
                                 f"recorded block(s) are not in the file either "
                                 f"({', '.join(missing[:3])}) - refusing to guess")
            print(f"slim_dcc_figures: {c['file']} is already back as it was; skipped")
            continue
        # Removing the field is only safe if this journal can put back everything
        # in it. When a journal has been clobbered by a later run it accounts for
        # fewer pictures than the field holds, and restoring would delete the rest
        # without a word - the one way this tool can lose a picture.
        held = {b.group("fig") for b in BLOCK.finditer(text[m.start():m.end()])
                if b.group("fig")}
        acct = {o["fig"] for o in c["ops"] if o.get("moved") and o.get("fig")}
        acct |= {f for o in c["ops"] for f in o.get("figs", [])}
        if held - acct:
            raise SystemExit(
                f"{c['file']}: its slides field holds {len(held - acct)} picture(s) "
                f"this journal cannot put back "
                f"({', '.join(sorted(held - acct)[:3])}) - removing the field would "
                f"drop them, so refusing")
        text = text[:m.start()] + text[m.end():]
        # The retired sentences go back FIRST: the recorded indices were taken
        # before the patch, so the text has to be its old self before the blocks
        # are put back into it.
        for fix in c.get("prose", []):
            if fix["new"] not in text:
                raise SystemExit(f"{c['file']}: the patched sentence is not in the file")
            text = text.replace(fix["new"], fix["old"], 1)
        per_field = {}
        for o in c["ops"]:
            per_field.setdefault(o["field"], []).append(o)
        for name, field_ops in per_field.items():
            span = field_span(text, name)
            text = text[:span[0]] + edit_field(text[span[0]:span[1]], field_ops, False) \
                   + text[span[1]:]
        path.write_text(text, encoding="utf-8")
        put += len([o for o in c["ops"] if o["fig"] and o["moved"]])
        put += len([f for o in c["ops"] for f in o.get("figs", [])])
    return put


def check(keepers: dict) -> int:
    """Exit 1 when a complaint this tool answers has come back."""
    problems = []
    broken = self_test()
    if broken:
        problems.append(broken + " - do not run --apply or --restore until this passes")
    keep = set(keepers["keep"])
    for fix in keepers.get("prose", []):
        if fix["new"] and fix["old"] == fix["new"]:
            problems.append(f"{fix['file']}: a prose fix that changes nothing")
    for name in keep:
        if not (SITE / (name.split("/")[0] + ".js")).exists():
            problems.append(f"the keepers name {name}, which no chapter can hold")
    if "reference" not in REWRITE_FIELDS:
        problems.append("the tool no longer rewrites the Reference tab's captions")
    # What should be where comes from the extractor's own index, so this half of the
    # gate holds whether or not the journal is here - and cannot be satisfied by a
    # journal that merely agrees with a bad page.
    figs = [e["name"] for e in json.loads(FIGURES.read_text(encoding="utf-8"))]
    if len(set(figs)) != len(figs):
        problems.append(f"{FIGURES.name} names a picture twice")
    rec = None
    if RECORD.exists():
        rec = json.loads(RECORD.read_text(encoding="utf-8"))["chapters"]
    # A picture is named for the deck it came off, which is not always the unit that
    # shows it: the off-syllabus GFS/HDFS pages are named for the unit 1 notes and are
    # read in unit 4. So where the pictures ended up is checked site-wide rather than
    # against the name's own prefix.
    placed = {}
    for path in chapter_files():
        text = path.read_text(encoding="utf-8")
        n = chapter_no(path)
        lspan = field_span(text, "learn")
        learn = text[lspan[0]:lspan[1]] if lspan else ""
        sspan = field_span(text, "slides")
        slides = text[sspan[0]:sspan[1]] if sspan else ""
        # The moved blocks live inside `slides`, so the two markers this tool
        # removes are only "back" if they are somewhere other than there.
        outside = text if not sspan else text[:sspan[0]] + text[sspan[1]:]
        where = {}
        for name in ("learn", "slides", "reference"):
            fspan = field_span(text, name)
            if not fspan:
                continue
            names = {m.group("fig") for m in BLOCK.finditer(text[fspan[0]:fspan[1]])
                     if m.group("fig")}
            where[name] = names
            for fig in names:
                placed.setdefault(fig, []).append(f"{path.name} {name}")
        for fig in sorted(where.get("learn", set()) - keep):
            problems.append(f"{path.name}: {fig} is back in the notes")
        if ETC.search(outside):
            problems.append(f"{path.name}: a fig-src-note line is back")
        if EXTRAS.search(outside):
            problems.append(f"{path.name}: an off-syllabus slides dump is back")
        if EXTRAS_OPEN in slides or EXTRAS_CLOSE in slides:
            problems.append(f"{path.name}: the slides block still carries the tooling markers")
        for m in re.finditer(r"<figcaption>(.*?)</figcaption>", text, re.S):
            cap = text_of(m.group(1))
            if FILENAME.search(cap) or FILLER.match(cap):
                problems.append(f"{path.name}: a caption is filler again: {cap[:70]}")
        for fix in keepers.get("prose", []):
            if fix["file"] != path.name:
                continue
            if fix["old"] in learn:
                problems.append(f"{path.name}: a sentence still points at a picture "
                                f"that left: {fix['old'][:70]}")
            if fix["new"] not in learn and \
                    EMPHASIS.sub("", fix["new"]) not in EMPHASIS.sub("", learn):
                problems.append(f"{path.name}: the patched sentence is missing")
        # The journal does not prove the state; it is what says whether --restore can
        # undo the move. One that accounts for fewer pictures than this unit's tab holds
        # is a restore that would drop the difference, so say so rather than let it.
        if rec is not None:
            entry = rec.get(str(n))
            on_tab = where.get("slides", set())
            if entry is None:
                if on_tab:
                    problems.append(f"{path.name}: {RECORD.name} has no entry for it, so "
                                    f"--restore cannot put its {len(on_tab)} picture(s) back")
            else:
                acct = {o["fig"] for o in entry.get("ops", [])
                        if o.get("moved") and o.get("fig")}
                acct |= {f for o in entry.get("ops", []) for f in o.get("figs", [])}
                if acct != on_tab:
                    problems.append(f"{path.name}: {RECORD.name} accounts for {len(acct)} of "
                                    f"the {len(on_tab)} picture(s) on its tab, so --restore "
                                    f"would drop {len(on_tab - acct)}")
    for fig in sorted(set(figs) - set(placed)):
        problems.append(f"{fig} is in {FIGURES.name} and on none of the pages - a "
                        f"picture went missing from the site")
    for fig in sorted(set(placed) - set(figs)):
        problems.append(f"{fig} is on a page and not in {FIGURES.name} - it cannot be "
                        f"traced to a deck")
    for fig, spots in sorted(placed.items()):
        if len(spots) > 1:
            problems.append(f"{fig} is shown {len(spots)} times ({', '.join(spots)})")
    for p in problems:
        print("  " + p, file=sys.stderr)
    return 1 if problems else 0


def report(plan_data: dict, keepers: dict) -> int:
    keep = keepers["keep"]
    print(f"{'unit':6} {'pictures in learn now':>22} {'kept':>6} {'moved':>7}")
    shown = 0
    for n in sorted(plan_data):
        extra = plan_data[n]["extras"]
        moved = len(plan_data[n]["moved"]) + (len(extra["figs"]) if extra else 0)
        kept = len([k for k in keep if k.startswith(f"ch{n}/")])
        shown += moved
        print(f"ch{n:<4} {moved + kept:>12} {kept:>13} {moved:>7}")
    print(f"\n{shown} picture(s) leave the reading flow; {len(keep)} stay")
    print(f"\nkept in the notes ({len(keep)}) - each named by a sentence in its section:")
    for k in keep:
        print(f"  {k}")
    print("\nmoved to the Reference tab, by unit:")
    for n in sorted(plan_data):
        groups = {}
        for m in plan_data[n]["moved"]:
            groups[m["section"]] = groups.get(m["section"], 0) + 1
        if groups:
            extra = plan_data[n]["extras"]
            n_extra = len(extra["figs"]) if extra else 0
            tail = f" (+{n_extra} in the off-syllabus dump)" if n_extra else ""
            print(f"  ch{n}: {len(plan_data[n]['moved'])} pictures in {len(groups)} "
                  f"sections{tail}")
    print("\nblocks that are not pictures:")
    for n in sorted(plan_data):
        for o in plan_data[n]["ops"]:
            if not o["fig"]:
                print(f"  ch{n}: a fig-src-note line")
        if plan_data[n]["extras"]:
            print(f"  ch{n}: an off-syllabus slides dump")
    return 0


def main() -> int:
    global ONLY
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--restore", action="store_true")
    ap.add_argument("--report", action="store_true")
    ap.add_argument("--only", help="comma-separated unit numbers, e.g. 2,4")
    args = ap.parse_args()
    if args.only:
        ONLY = {int(x) for x in args.only.replace(" ", "").split(",") if x}
    if not (args.apply or args.check or args.restore or args.report):
        args.check = True

    keepers = load_keepers()
    if args.restore:
        # The record is kept rather than deleted, exactly as make_reference.py keeps
        # its own: --check is red after a restore, which is how "this tool is not
        # applied" reads on the gate. It is not in the repository for the run that
        # shipped - see the module docstring - so this reports that rather than
        # putting back nothing.
        back = restore()
        if back:
            print(f"slim_dcc_figures: put {back} picture(s) back into the notes")
        return 0
    if args.report:
        return report(plan(keepers), keepers)
    if args.apply:
        data = plan(keepers)
        n = apply(keepers, data)
        print(f"slim_dcc_figures: moved {n} picture(s) out of the notes onto the "
              f"Reference tab; record in {RECORD.relative_to(ROOT)}")
        return check(keepers)
    return check(keepers)


if __name__ == "__main__":
    raise SystemExit(main())
