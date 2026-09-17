#!/usr/bin/env python3
"""Make every h2 in the DCC notes the syllabus's own number and wording.

The reader's question was "is everything same as syllabus, same to same?" and the
honest answer was: by number, yes - all 34 sub-topics have a section, 0 gaps, 0
orphans - and by wording, no. Eleven headings dropped the technologies the
syllabus names by name:

    1.3  Examples of Distributed Systems      -> ... Google File System, Hadoop, BitTorrent
    1.4  Models of Distributed Systems        -> ... Client-server, Peer-to-peer, Multitier
    3.3  Mutual Exclusion Algorithms          -> ... (Ricart-Agrawala, Token Ring)
    4.1  Distributed File System concepts     -> DFS concepts: Transparency, Naming, ...
    4.3  Middleware                           -> ... CORBA, Java RMI, Messaging MQTT, AMQP
    5.3  Cloud service (delivery) models      -> ... IaaS, PaaS, SaaS
    5.4  Cloud deployment models              -> ... Public, Private, Hybrid, Community
    6.1  Basics of virtualization             -> ... Hypervisors (Type I & II)
    7.2  Storage services                     -> ... (S3, Blob, etc.)
    7.3  Compute services                     -> ... (EC2, Lambda, GCE)

Those named technologies are exactly what a question is set on, so a reader
revising from the contents list was not meeting the syllabus. The rest were
punctuation and case ("Clock Synchronization: Cristian's Algorithm and NTP" where
the syllabus prints a comma; "Data security, privacy and compliance" where it
prints an Oxford comma).

THE RULE. A heading whose text starts with a syllabus sub-topic number must be

    <number> <the syllabus's wording, character for character>(<clarifier>)

where the parenthesised clarifier is optional and must be DECLARED in
`data/syllabus_headings_allow.json`. The clarifier is where a site may keep a
phrase of its own - the reader chose "the syllabus is the label, the clarification
is additive" - and declaring it is what stops it from quietly drifting back into a
paraphrase. Nothing is declared today: the syllabus's own wording reads well
enough, and a clarifying phrase can be added per topic when one is wanted.

`--apply` rewrites heading text and nothing else: the section number, the
heading level and the order are untouched, and the previous wording is recorded in
`data/syllabus_headings.json` so `--restore` can put it back byte for byte. It also
carries the rename into the `slides` group headings, which quote the section they
hold pictures for and are turned into links back to it by `modules/reference.js`:
five of those labels were left behind by the first run, and a group whose heading
names a section the notes no longer have is a link that quietly stops resolving
(`tools/ref_slide_notes.py` is the guard that caught it). `--retitle` repeats that
carry for a tree that was already renamed.

    python tools/syllabus_headings.py            # what differs, per unit
    python tools/syllabus_headings.py --check    # exit 1 if a heading paraphrases
    python tools/syllabus_headings.py --apply    # write the syllabus's wording
    python tools/syllabus_headings.py --retitle  # carry a rename into the labels
    python tools/syllabus_headings.py --restore  # put the headings back
    python tools/syllabus_headings.py --roundtrip
"""

import argparse
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "dcc-site"
SYLLABUS = ROOT / "data" / "syllabus.json"
ALLOW = ROOT / "data" / "syllabus_headings_allow.json"
RECORD = ROOT / "data" / "syllabus_headings.json"

LEARN = re.compile(r"\n\s*learn: `(?P<body>.*?)\n?\s*`,\r?\n", re.S)
H2 = re.compile(r"<h2>(?P<body>.*?)</h2>", re.S)

# The unit's `slides` field, where a picture that left the notes is filed under the
# heading of the section it came out of. `modules/reference.js` turns such a heading
# into a link back to that section, so a heading whose wording this pass changed has
# to be changed here too, or the group names a section that no longer exists and the
# reader loses the way back to it. tools/ref_slide_notes.py is the guard that this
# happened; this is the repair, and --apply now does it in the same run.
SLIDES = re.compile(r"\n\s*slides: `\r?\n(?P<body>.*?)\r?\n\s*`,\r?\n", re.S)
NUMBERED = re.compile(r"^(?P<number>\d+\.\d+)\s+(?P<rest>.*)$", re.S)
TAG = re.compile(r"<[^>]+>")

# A unit's own title ("Unit 4 &mdash; Distributed File Systems and Middleware").
UNIT_TITLE = re.compile(r"^(?:Unit|Chapter)\s+\d+\b", re.I)


def plain(s: str) -> str:
    for a, b in (("&mdash;", "-"), ("&ndash;", "-"), ("&amp;", "&"), ("&nbsp;", " "),
                 ("&ldquo;", '"'), ("&rdquo;", '"'), ("&rsquo;", "'"), ("&#39;", "'")):
        s = s.replace(a, b)
    return re.sub(r"\s+", " ", TAG.sub("", s)).strip()


def read(p: pathlib.Path) -> str:
    with open(p, encoding="utf-8", newline="") as handle:
        return handle.read()


def write(p: pathlib.Path, text: str) -> None:
    with open(p, "w", encoding="utf-8", newline="") as handle:
        handle.write(text)


def chapters() -> list[pathlib.Path]:
    return sorted(SITE.glob("ch*.js"), key=lambda p: int(re.search(r"\d+", p.stem).group()))


def topics() -> dict[str, str]:
    data = json.loads(SYLLABUS.read_text(encoding="utf-8"))
    return {t["n"]: t["t"] for u in data["courses"]["dcc"]["units"] for t in u["topics"]}


def clarifiers() -> dict[str, str]:
    if not ALLOW.exists():
        return {}
    return json.loads(ALLOW.read_text(encoding="utf-8")).get("clarifiers", {})


def expected_heading(number: str, syl: dict[str, str], allow: dict[str, str]) -> str:
    wording = syl[number]
    extra = allow.get(number, "").strip()
    return f"{number} {wording}" + (f" ({extra})" if extra else "")


def findings() -> list[dict]:
    """Every numbered h2 whose wording is not the syllabus's, in reading order."""
    syl, allow = topics(), clarifiers()
    out = []
    for path in chapters():
        text = read(path)
        m = LEARN.search(text)
        if not m:
            continue
        learn = m.group("body")
        for h in H2.finditer(learn):
            want = plain_of_h2(h)
            if UNIT_TITLE.match(want):
                continue
            num = NUMBERED.match(want)
            if not num:
                out.append({"chapter": path.name, "number": None, "found": want,
                            "wanted": None, "why": "an h2 with no syllabus number"})
                continue
            number = num.group("number")
            if number not in syl:
                out.append({"chapter": path.name, "number": number, "found": want,
                            "wanted": None, "why": "numbered for a topic the syllabus does not name"})
                continue
            target = expected_heading(number, syl, allow)
            if want != target:
                out.append({"chapter": path.name, "number": number, "found": want,
                            "wanted": target, "why": "paraphrases the syllabus"})
    return out


def plain_of_h2(m: re.Match) -> str:
    return plain(m.group("body"))


def carry(previous: dict, dry: bool = False) -> list:
    """Re-title the `slides` groups that quote a heading this pass renamed.

    A rename is not finished when the heading has changed: the same wording is
    quoted by the records built from the notes - the `slides` group headings are
    the one the site renders - and a quoted copy that is left behind is a link that
    quietly stops resolving. Returns the lines to print; writes unless `dry`.
    """
    syl, allow = topics(), clarifiers()
    out = []
    for path in chapters():
        if path.name not in previous:
            continue
        text = read(path)
        learn = LEARN.search(text)
        slides = SLIDES.search(text)
        if not learn or not slides:
            continue
        body = slides.group("body")
        moved = []
        for number, old in previous[path.name].items():
            want = expected_heading(number, syl, allow)
            needle, target = f"<h3>{old}</h3>", f"<h3>{want}</h3>"
            hits = body.count(needle)
            if not hits:
                continue
            if want not in {plain_of_h2(h) for h in H2.finditer(learn.group("body"))}:
                out.append(f"  {path.name} [{number}]: {want!r} is not a heading in the "
                           f"notes, so the group cannot be re-titled to it")
                continue
            body = body.replace(needle, target)
            moved.append(f"{number} ({hits} group{'' if hits == 1 else 's'})")
        if not moved:
            continue
        if not dry:
            start, end = slides.start("body"), slides.end("body")
            write(path, text[:start] + body + text[end:])
        out.append(f"  {path.name}: {len(moved)} group heading(s) re-titled: "
                   f"{', '.join(moved)}")
    leftovers = stale_in_records(previous)
    out += leftovers
    if not out:
        out.append("  every quoted heading already reads as the notes do")
    return out


def stale_in_records(previous: dict) -> list:
    """Anywhere else a renamed heading is still quoted verbatim, as a note.

    Only a report: a journal such as `data/emphasis_decisions.json` says which
    section a decision was taken in, and re-writing a journal is not this tool's
    business. But a silent one is how a guard that reads it stops finding it.
    """
    out = []
    for path in sorted((ROOT / "data").glob("*.json")) + [ROOT / "tools" / "dcc_figure_pins.json"]:
        if path.resolve() == RECORD.resolve() or not path.exists():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        for _file, keys in previous.items():
            for old in keys.values():
                if old in text:
                    out.append(f"  note: {path.relative_to(ROOT)} still quotes {old!r}")
                    break
    return out


def retitle() -> int:
    """Carry the renames in the record into the copies other records quote."""
    if not RECORD.exists():
        print("syllabus_headings: no record of a rename to carry", file=sys.stderr)
        return 1
    previous = json.loads(RECORD.read_text(encoding="utf-8"))["previous"]
    for line in carry(previous):
        print(line)
    return 0


def report() -> int:
    rows = findings()
    if not rows:
        print("syllabus_headings: every h2 is the syllabus's own number and wording")
        return 0
    print(f"{len(rows)} heading(s) are not the syllabus's wording\n")
    for r in rows:
        print(f"  {r['chapter']}  [{r['number'] or '-':<5}] {r['why']}")
        print(f"      now:    {r['found']}")
        if r["wanted"]:
            print(f"      syll:   {r['wanted']}")
    print(f"\n  {len(rows)} to fix. `--apply` writes the syllabus's wording.")
    return 0


def check() -> int:
    """Fail on a paraphrase; report a heading numbered outside the syllabus.

    The split is deliberate and it is the same policy `tools/syllabus_map.py`
    applies to orphans: a numbered heading that words a syllabus sub-topic
    differently is a defect with one correct fix, so it fails the build, while a
    heading numbered for a topic the syllabus does not name (units 2.0 and 3.0) is
    a *content* decision - where its material belongs, and whether the sections
    under it renumber into the topics that follow - and is reported rather than
    fixed on this tool's authority.
    """
    rows = findings()
    paraphrase = [r for r in rows if r["why"] == "paraphrases the syllabus"]
    orphans = [r for r in rows if r["why"] != "paraphrases the syllabus"]
    for r in orphans:
        print(f"  note: {r['chapter']} [{r['number'] or '-'}] {r['why']}: {r['found'][:70]}")
    if paraphrase:
        print(f"syllabus_headings: FAIL - {len(paraphrase)} heading(s) do not match the syllabus",
              file=sys.stderr)
        for r in paraphrase[:20]:
            print(f"  {r['chapter']} [{r['number']}]: {r['found']}", file=sys.stderr)
            print(f"      expected: {r['wanted']}", file=sys.stderr)
        return 1
    print(f"syllabus_headings: OK - 34 sub-topics, every h2 in the syllabus's own words"
          f" ({len(orphans)} heading(s) numbered outside it, reported above)")
    return 0


def apply() -> int:
    """Rewrite the wording of every numbered h2 to the syllabus's, recording the old."""
    syl, allow = topics(), clarifiers()
    previous: dict[str, dict] = {}
    changed = 0
    for path in chapters():
        text = read(path)
        m = LEARN.search(text)
        if not m:
            continue
        learn = m.group("body")
        edits = []
        for h in H2.finditer(learn):
            found = plain_of_h2(h)
            if UNIT_TITLE.match(found):
                continue
            num = NUMBERED.match(found)
            if not num or num.group("number") not in syl:
                continue
            number = num.group("number")
            target = expected_heading(number, syl, allow)
            if found == target:
                continue
            edits.append((h, target))
            previous.setdefault(path.name, {})[number] = found
        if not edits:
            continue
        for h, target in reversed(edits):
            learn = learn[:h.start()] + f"<h2>{target}</h2>" + learn[h.end():]
        start, end = m.start("body"), m.end("body")
        write(path, text[:start] + learn + text[end:])
        changed += len(edits)
        print(f"  {path.name}: {len(edits)} heading(s) -> the syllabus's wording")
    if not changed:
        print("  every heading already carries the syllabus's wording")
        return 0
    # The rename is carried into the `slides` group labels in the same run: they
    # quote these headings, and a run that renamed eleven headings and left five
    # labels behind is what put this line here.
    for line in carry(previous):
        print(line)
    RECORD.write_text(json.dumps({
        "_comment": [
            "The heading wording this pass replaced, written by",
            "tools/syllabus_headings.py --apply and read back by --restore.",
            "The syllabus's wording is in data/syllabus.json; a clarifying",
            "phrase, if one is ever wanted, is declared in",
            "data/syllabus_headings_allow.json and appears in brackets.",
        ],
        "previous": previous,
    }, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"\n  {changed} heading(s) rewritten; the previous wording is in "
          f"{RECORD.relative_to(ROOT)}")
    return 0


def restore() -> int:
    if not RECORD.exists():
        print("syllabus_headings: no record to restore from", file=sys.stderr)
        return 1
    previous = json.loads(RECORD.read_text(encoding="utf-8"))["previous"]
    n = 0
    for path in chapters():
        if path.name not in previous:
            continue
        text = read(path)
        m = LEARN.search(text)
        learn = m.group("body")
        for number, old in previous[path.name].items():
            want = expected_heading(number, topics(), clarifiers())
            needle = f"<h2>{want}</h2>"
            if needle in learn:
                learn = learn.replace(needle, f"<h2>{old}</h2>", 1)
                n += 1
        write(path, text[:m.start("body")] + learn + text[m.end("body"):])
    print(f"syllabus_headings: restored {n} heading(s)")
    return 0


def roundtrip() -> int:
    """Prove that `--apply` and `--restore` are exact inverses, on the real files.

    The order matters and the first version got it wrong. `apply()` on a tree that
    already carries the syllabus's wording does nothing and records nothing, so
    running `apply()` then `restore()` reverted the headings to the *previous*
    pass's old wording and reported a failure - which was true, and was its own
    bug, not the files'. The sequence that means something is: restore to the
    paraphrased state, apply, restore, and require the bytes back.

    The originals are written back in a `finally`, whatever happens. This project
    has already paid once for a tool that failed its own check and left the tree
    damaged - `tools/move_exam_summary.py` deleted eight chapters' exam summaries
    and reported success - so a failure here must not be destructive.
    """
    paths = chapters()
    entered = {p.name: read(p) for p in paths}
    record_before = RECORD.read_text(encoding="utf-8") if RECORD.exists() else None
    bad: list[str] = []
    try:
        if record_before is not None:
            restore()
        mid = {p.name: read(p) for p in paths}
        apply()
        restore()
        bad = [n for n in mid if read(ROOT / "dcc-site" / n) != mid[n]]
    finally:
        for p in paths:
            write(p, entered[p.name])
        if record_before is not None:
            RECORD.write_text(record_before, encoding="utf-8")
    if bad:
        print(f"syllabus_headings: ROUND TRIP FAILED for {bad}", file=sys.stderr)
        return 1
    print(f"syllabus_headings: round trip OK - {len(entered)} chapters back byte for byte")
    return 0


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError):
        pass
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--check", action="store_true", help="the guard; exit 1 on a paraphrase")
    g.add_argument("--apply", action="store_true", help="write the syllabus's wording")
    g.add_argument("--restore", action="store_true", help="put the headings back")
    g.add_argument("--roundtrip", action="store_true", help="apply + restore on the real files")
    g.add_argument("--retitle", action="store_true",
                   help="carry the renamed headings into the slides group labels")
    args = ap.parse_args()
    if args.check:
        return check()
    if args.retitle:
        return retitle()
    if args.apply:
        return apply()
    if args.restore:
        return restore()
    if args.roundtrip:
        return roundtrip()
    return report()


if __name__ == "__main__":
    raise SystemExit(main())
