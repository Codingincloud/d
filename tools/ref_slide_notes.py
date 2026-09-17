#!/usr/bin/env python3
"""Put a line under every picture on the Reference tab, saying what to notice in it.

`slim_dcc_figures.py` took the teacher's 197 screenshots out of the notes and
collected them per section on the Reference tab. That fixed the reading, but it
left the tab as what it had been in the notes: a column of pictures, 153 of them
with no text of their own at all (their slides are image-only, or a rendered page
from a deck with no text layer), and every one of those named `Illustration for
4.3.4 Messaging middleware: MQTT and AMQP` - the section heading echoed back - in
the one place a reader never looks and a screen reader always does, the `alt`.

So each picture gets one written line, read off the picture itself, and that line
doubles as its `alt`. Nothing is generated here: the words come from
`tools/dcc_slide_notes.json`, which is a reviewed catalogue, the same shape as the
voice rewrite catalogue beside it. A line that describes the picture from the
notes instead of from the picture is what the reader has already rejected twice -
"Figure for 4.3.4 ..." and "Illustration for 4.3.4 ..." - so the rule for what may
go in the catalogue is narrow:

  * it says what the picture shows and what is worth looking at in it;
  * it is one sentence, in the same voice as the notes: no "this slide shows",
    no deck talk ("the deck", "slide 22", "as taught"), no file name;
  * no figure is described from a list; if a picture is unreadable or says
    nothing, it is left out of the catalogue and `--check` reports it as pending
    rather than letting filler stand in for it.

    python tools/ref_slide_notes.py --report   # coverage, unit by unit
    python tools/ref_slide_notes.py --apply    # write the lines into the tab
    python tools/ref_slide_notes.py --check    # the gate
    python tools/ref_slide_notes.py --restore  # take them out again, byte-exact

`--restore` inverts the run from `data/ref_slide_notes.json`, and the tool proves
that with a sha256 round trip before it writes anything: the record is the only
copy of the `alt` text it replaced.
"""

import argparse
import html
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from figcaptions import BLOCK, text_of  # noqa: E402
from slim_dcc_figures import SITE, ROOT, chapter_files, chapter_no, field_span  # noqa: E402

CATALOGUE = ROOT / "tools" / "dcc_slide_notes.json"
RECORD = ROOT / "data" / "ref_slide_notes.json"

FIG = re.compile(r"<!-- dcc-fig:(?P<name>\S+) -->(?P<body>.*?)<!-- /dcc-fig -->", re.S)
ALT = re.compile(r'(?P<pre>\balt=")(?P<text>[^"]*)(?P<post>")')
NOTE_OPEN = '<p class="ref-why">'
NOTE = re.compile(r'\n<p class="ref-why">(?P<text>.*?)</p>', re.S)
HEAD = re.compile(r"<h([23])>(.*?)</h\1>", re.S)
# What the catalogue may not say. A note that matches any of these is the filler
# this tool exists to replace, or a caption the picture already carries.
BANNED = re.compile(r"^\s*(figure|fig|slide|page|illustration|image)\b"
                    r"|\b(the deck|the paper|the marker|as taught|taught in class)\b"
                    r"|\.(pptx|ppt|pdf|docx?|webp|png)\b", re.I)
MAX = 220          # a line longer than this is a paragraph, not a caption


def load_catalogue() -> dict:
    data = json.loads(CATALOGUE.read_text(encoding="utf-8"))
    notes = data["notes"]
    for name, note in notes.items():
        if not isinstance(note, str) or not note.strip():
            raise SystemExit(f"{CATALOGUE.name}: {name} has an empty note")
    return data


def slides_span(text: str):
    return field_span(text, "slides")


def figure_edits(text: str, notes: dict) -> list:
    """Every (index, old, new) this run makes inside a chapter's slides field."""
    span = slides_span(text)
    if not span:
        return []
    field = text[span[0]:span[1]]
    edits = []
    for m in FIG.finditer(field):
        name = m.group("name")
        note = notes.get(name)
        if note is None:
            continue
        start = span[0] + m.start()
        end = span[0] + m.end()
        block = text[start:end]
        am = ALT.search(block)
        if not am:
            raise SystemExit(f"the picture {name} has no alt attribute to replace")
        edits.append((start + am.start("text"), am.group("text"), html.escape(note, quote=True)))
        # The line goes directly under the picture, where a caption would be, so a
        # picture with no words of its own is not left as a bare image.
        close = block.rindex("<!-- /dcc-fig -->") + len("<!-- /dcc-fig -->")
        edits.append((start + close, "", "\n" + NOTE_OPEN + html.escape(note, quote=False)
                      + "</p>"))
    return edits


def apply(notes: dict) -> int:
    record = {}
    written = 0
    for path in chapter_files():
        text = path.read_text(encoding="utf-8")
        span = slides_span(text)
        if span and NOTE_OPEN in text[span[0]:span[1]]:
            # A second --apply would write a second line under every picture, and
            # would overwrite the record that holds the alt text it replaced. The
            # same guard slim_dcc_figures.py needed, for the same reason.
            raise SystemExit(f"{path.name}: its tab already carries written lines - "
                             f"nothing to do. --restore first if it has to run again.")
        edits = figure_edits(text, notes)
        if not edits:
            continue
        # Every index was taken on the untouched text, so applying them in that
        # order needs the running shift: each edit moves everything after it by
        # what it added minus what it took out. (Reading an index as an absolute
        # position is the bug that put ten chapters' blocks in the wrong paragraph
        # in slim_dcc_figures.py - see the note in .freebuff/run.md.)
        new = text
        off = 0
        for index, old, repl in edits:
            pos = index + off
            if new[pos:pos + len(old)] != old:
                raise SystemExit(f"{path.name}: the text at {index} is not what it was "
                                 f"when the edits were planned - refusing to write")
            new = new[:pos] + repl + new[pos + len(old):]
            off += len(repl) - len(old)
        path.write_text(new, encoding="utf-8")
        record[path.name] = {
            "before": __import__("hashlib").sha256(text.encode("utf-8")).hexdigest(),
            "after": __import__("hashlib").sha256(new.encode("utf-8")).hexdigest(),
            "edits": [{"index": i, "old": o, "new": r} for i, o, r in edits],
        }
        written += len(edits) // 2
    RECORD.write_text(json.dumps({
        "_comment": [
            "Every line tools/ref_slide_notes.py wrote into the DCC Reference tab:",
            "the position in the chapter's `slides` field, the exact text it replaced",
            "(the `alt` it overwrote) and the exact text it put in. Verbatim, so",
            "--restore is byte-exact, the same shape as the other tools' records.",
            "Generated; do not hand-edit.",
        ],
        "chapters": record,
    }, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    return written


def restore() -> int:
    """Take the lines out and put the alt text back, byte for byte."""
    if not RECORD.exists():
        print(f"ref_slide_notes: no {RECORD.relative_to(ROOT)} to restore from")
        return 0
    data = json.loads(RECORD.read_text(encoding="utf-8"))["chapters"]
    put = 0
    for name, entry in data.items():
        path = SITE / name
        text = path.read_text(encoding="utf-8")
        # In the recorded order, and with no shift - which is not the same thing as
        # --apply's running shift and is worth saying out loud, because getting it
        # backwards fails as "the file is corrupt" 120 characters from the truth.
        # Undoing the edits in order means every earlier edit's growth has already
        # been taken back out by the time the next one is looked for, so the index
        # taken on the original text is the position again. Reading that position
        # off the *applied* text (or un-applying in reverse) would need the shift
        # that --apply itself uses.
        for e in entry["edits"]:
            i, old, new = e["index"], e["old"], e["new"]
            if text[i:i + len(new)] != new:
                raise SystemExit(f"{name}: the line at {i} is not what --apply wrote - "
                                 f"refusing to guess")
            text = text[:i] + old + text[i + len(new):]
        path.write_text(text, encoding="utf-8")
        put += len(entry["edits"]) // 2
    return put


def plain(s: str) -> str:
    """The heading as a reader sees it: no tags, entities decoded, spaces collapsed."""
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]*>", "", s))).strip()


def link_problems(text: str, path) -> list:
    """Group headings that name a note section the notes no longer have.

    modules/reference.js turns each group heading into a link back to the section it
    names, and leaves it as text when the section is gone. That is the safe
    direction, but it also means a renamed section would silently cost the reader
    the way back - so a heading that carries a section number is required to exist
    in the notes. A heading without one ("Other pictures from this unit") is a
    labelled leftover of the move and links nowhere by design.
    """
    span = slides_span(text)
    if not span:
        return []
    learn_span = field_span(text, "learn")
    known = {plain(m.group(2)) for m in HEAD.finditer(text[learn_span[0]:learn_span[1]])}
    out = []
    for m in re.finditer(r"<h3>(.*?)</h3>", text[span[0]:span[1]], re.S):
        title = plain(m.group(1))
        if re.match(r"\d+\.\d+", title) and title not in known:
            out.append(f"{path.name}: the group headed {title[:60]!r} names a note "
                       f"section that does not exist, so it cannot link back to it")
    return out


def check(notes: dict, strict: bool = False) -> int:
    """Exit 1 on a line that should not be there, or a picture left without one.

    A pending picture is reported but not, on its own, a failure: writing the notes
    is a job in progress across nine units, and a red gate for "not finished yet"
    gets ignored within a week. `--strict` is the other half of that - the runner
    holds it as a known gap until the last picture is written, so the count cannot
    quietly stop moving. Filler, a missing line or an empty note fails either way.
    """
    problems = []
    pending = {}
    seen = set()
    for path in chapter_files():
        text = path.read_text(encoding="utf-8")
        span = slides_span(text)
        if not span:
            continue
        problems += link_problems(text, path)
        field = text[span[0]:span[1]]
        for m in FIG.finditer(field):
            name = m.group("name")
            seen.add(name)
            block = m.group("body")
            note = notes.get(name)
            found = NOTE.search(text[span[0] + m.end():span[0] + m.end() + 400])
            alt = ALT.search(block)
            alt_text = alt.group("text") if alt else ""
            if note is None:
                pending[path.name] = pending.get(path.name, 0) + 1
                if found:
                    problems.append(f"{path.name}: {name} carries a line that is not in "
                                    f"the catalogue")
                continue
            if not found:
                problems.append(f"{path.name}: {name} has a written line in the catalogue "
                                f"and none on the tab - run --apply")
                continue
            written = html.unescape(found.group("text")).strip()
            if written != note.strip():
                problems.append(f"{path.name}: {name} reads differently on the tab than in "
                                f"the catalogue")
            # The alt is attribute text, so quotes in a note are escaped there; the
            # catalogue holds it as written.
            if html.unescape(alt_text) != note:
                problems.append(f"{path.name}: {name} still has its old alt text "
                                f"({alt_text[:50]!r})")
            bad = BANNED.search(note)
            if bad:
                problems.append(f"{path.name}: {name} reads as filler: {note[:70]!r}")
            if len(note) > MAX:
                problems.append(f"{path.name}: {name} is {len(note)} characters - a caption, "
                                f"not a paragraph")
            if note.strip().endswith(("...", "…")):
                problems.append(f"{path.name}: {name} is cut off")
    for name in notes:
        if name not in seen:
            problems.append(f"the catalogue writes a line for {name}, which is on no tab")
    total = len(seen)
    done = total - sum(pending.values())
    if pending:
        where = ", ".join(f"{k} {v}" for k, v in sorted(pending.items()))
        if strict:
            problems.append(f"{total - done} of {total} picture(s) on the Reference tab "
                            f"still have no line: {where}")
        else:
            print(f"ref_slide_notes: {done} of {total} picture(s) carry a written line; "
                  f"still to write: {where}")
    for p in problems:
        print("  " + p, file=sys.stderr)
    return 1 if problems else 0


def report(notes: dict) -> int:
    print(f"{'unit':8} {'on the tab':>11} {'written':>8} {'pending':>8}")
    tot = don = 0
    for path in chapter_files():
        text = path.read_text(encoding="utf-8")
        span = slides_span(text)
        if not span:
            continue
        names = [m.group("name") for m in FIG.finditer(text[span[0]:span[1]])]
        have = [n for n in names if n in notes]
        tot += len(names)
        don += len(have)
        print(f"{path.name:<8} {len(names):>11} {len(have):>8} {len(names) - len(have):>8}")
    print(f"\n{don} of {tot} picture(s) written. Catalogue: "
          f"{CATALOGUE.relative_to(ROOT)} ({len(notes)} entries)")
    return 0


def roundtrip() -> int:
    """Prove --restore inverts --apply, on the real files, before trusting either.

    Both directions are proved against the files themselves, because the shift that
    made --restore look for a line 120 characters from where it was is invisible to
    reading the code. It ends where it started, lines and all: run against a tab
    that carries them, it takes them out to reach the state --apply expects, proves
    the round trip, and puts them back.
    """
    import hashlib
    notes = load_catalogue()["notes"]
    carried = any(NOTE_OPEN in p.read_text(encoding="utf-8") for p in chapter_files()
                  if slides_span(p.read_text(encoding="utf-8")))
    if carried:
        restore()
    before = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in chapter_files()}
    apply(notes)
    restore()
    after = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in chapter_files()}
    bad = [k for k in before if before[k] != after[k]]
    if bad:
        print("ref_slide_notes: the round trip changed " + ", ".join(bad), file=sys.stderr)
        return 1
    if carried:
        apply(notes)
    print(f"ref_slide_notes: {len(notes)} note(s) applied and taken out again; all "
          f"{len(before)} chapter(s) byte-identical"
          + ("" if carried else "; the tab had them out, so they are still out"))
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--restore", action="store_true")
    ap.add_argument("--report", action="store_true")
    ap.add_argument("--roundtrip", action="store_true")
    ap.add_argument("--strict", action="store_true",
                    help="also fail while a picture on the tab still has no line")
    ap.add_argument("--only", help="comma-separated unit numbers, e.g. 2,4")
    args = ap.parse_args()
    if args.only:
        import slim_dcc_figures
        slim_dcc_figures.ONLY = {int(x) for x in args.only.replace(" ", "").split(",") if x}
    if not (args.apply or args.check or args.restore or args.report or args.roundtrip):
        args.check = True
    catalogue = load_catalogue()
    notes = catalogue["notes"]
    if args.restore:
        back = restore()
        if back:
            print(f"ref_slide_notes: took {back} line(s) out of the tab")
        return 0
    if args.roundtrip:
        return roundtrip()
    if args.report:
        return report(notes)
    if args.apply:
        n = apply(notes)
        print(f"ref_slide_notes: wrote {n} line(s) under pictures on the Reference tab; "
              f"record in {RECORD.relative_to(ROOT)}")
    return check(notes, args.strict)


if __name__ == "__main__":
    raise SystemExit(main())
