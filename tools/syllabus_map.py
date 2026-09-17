"""The map: syllabus sub-topic -> the sections of the site that teach it.

Reads `data/syllabus.json` (the authority, extracted by tools/extract_syllabus.py)
and the chapter sources in `dcc-site/ch*.js` / `modules/ch*.js`, and answers four
questions that decide what the rebuild has to do:

  1. Which syllabus sub-topic does each section teach?  Answered EXACTLY, not by
     keyword guessing: every section heading in the notes already leads with its
     syllabus number ("3.2.5 Causal ordering ..."), so a heading belongs to the
     topic whose number is its first two components.  A section numbered 3.2.5
     teaches 3.2 - no similarity score involved.
  2. Which sub-topics are GAPS - named by the syllabus and taught by no section?
  3. Which sections are ORPHANS - numbered for a topic the syllabus does not name?
     These are the "extra content" candidates.  They are reported, never deleted
     on the tool's own authority (`plan.md` 0.2: no silent removal).
  4. Which sections carry practice-question material in the Learn text, which the
     user asked to move to Past Questions?  Detected by the shapes a question
     takes in this content: a "Q."/"Qn." lead-in, a marks badge, a "Answer:" or
     "Solution:" label.  Reported per section with the matched line.

    python tools/syllabus_map.py                 # the map + the four reports
    python tools/syllabus_map.py --course sim    # the other course
    python tools/syllabus_map.py --write         # also write data/syllabus_map.json
    python tools/syllabus_map.py --check         # exit 1 if any gap has no excuse

The output file is written for the record, and `--check` is the gate: a gap that
is not already proven untestable has to fail the build, or the map is decoration.
"""

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SYLLABUS = ROOT / "data" / "syllabus.json"

# Where each course's chapters live. DCC was converted to `dcc-site/`; the
# Simulation portal still reads its chapter files from `modules/`.
COURSES = {
    "dcc": {"dir": "dcc-site", "entry": "dcc-site/index.html"},
    "sim": {"dir": "modules", "entry": "index.html"},
}

# A heading looks like `<h2>3.2.5 Causal ordering of messages</h2>` or
# `<h3>3.0.1 How a computer timer actually works</h3>`.
HEADING = re.compile(r"<h([23])>\s*(?:Unit\s+)?(\d+(?:\.\d+){0,2})?\.?\s*([^<]*)</h\1>", re.I)
# A practice question in the Learn text. The hard part is that this content
# talks ABOUT the paper constantly - "Where this came from: Group A, question 2 of
# the Model Question 2025" is provenance, not a question, and it is everywhere.
# So a lead-in must look like a question that is being SET ("Q. 3", "Question 4:"),
# and a bare reference to "question 2" does not count.
QUESTION_SHAPES = [
    ("lead-in", re.compile(r"\bQ(?:n)?\.?\s*\d{1,2}[.):\s]|\bQuestion\s*\d{1,2}\s*[.):]", re.I)),
    ("card data", re.compile(r"\bocc\s*:\s*\[|\banswer\s*:\s*`|" + r"\bmarks\s*:\s*'\d+'")),
    ("answer label", re.compile(r"(?:^|>|\"|\u2014\s)(Answer|Solution|Model answer)\s*:", re.M)),
]

# The unit-meta line ("Syllabus: 5 hours 6 marks") mentions marks without setting
# anything, so it must not make a section look like it holds a question.
UNIT_META = re.compile(r"class=\"unit-meta\"[^>]*>[^<]{0,120}")

# Provenance is the thing a section says about where its material came from, and
# it is the dominant false positive for a bare "question N". Kept as a name so the
# report can say why a section did NOT count.
PROVENANCE = re.compile(r"came from|comes from|asks about|of the Model Question|Group [ABC],|paper asks", re.I)


def load_syllabus(course: str) -> dict:
    data = json.loads(SYLLABUS.read_text(encoding="utf-8"))
    return data["courses"][course]


def topics(syl: dict) -> dict:
    """{topic number -> topic title} for the sub-topics the syllabus names."""
    out = {}
    for unit in syl["units"]:
        for t in unit["topics"]:
            out[t["n"]] = t["t"]
    return out


def chapters_for(course: str) -> list:
    d = ROOT / COURSES[course]["dir"]
    def key(p):
        m = re.search(r"ch(\d+)", p.name)
        return int(m.group(1)) if m else 0
    return sorted(d.glob("ch*.js"), key=key)


def split_sections(html: str, chapter: int) -> list:
    """Cut a chapter's learn HTML at every h2/h3 into numbered sections."""
    marks = list(HEADING.finditer(html))
    sections = []
    # Anything before the first heading (the chapter's own footer/comment block)
    # is not a section; start at the first heading.
    for i, m in enumerate(marks):
        end = marks[i + 1].start() if i + 1 < len(marks) else len(html)
        body = html[m.end():end]
        num = m.group(2) or ""
        sections.append({
            "chapter": chapter,
            "level": int(m.group(1)),
            "number": num,
            "title": re.sub(r"\s+", " ", m.group(3)).strip(" &mdash;-"),
            "words": len(re.sub(r"<[^>]+>", " ", body).split()),
            "start": m.start(),
        })
    return sections


def major_of(number: str):
    """'3.2.5' -> '3.2'; '3.0.1' -> '3.0'; '7' -> '7'."""
    parts = number.split(".")
    if len(parts) >= 2:
        return ".".join(parts[:2])
    return number


def find_questions(html: str, start: int, end: int) -> list:
    """Practice-question material sitting in the Learn text.

    A hit counts only if the sentence around it is SETTING a question rather than
    citing the paper: a marks badge or an answer label is decisive on its own, a
    bare lead-in is dropped when the same sentence is provenance.
    """
    chunk = UNIT_META.sub(" ", html[start:end])
    hits = []
    for name, rx in QUESTION_SHAPES:
        for m in rx.finditer(chunk):
            around = chunk[max(0, m.start() - 140):m.end() + 140]
            if name == "lead-in" and PROVENANCE.search(around):
                continue
            line = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", around))
            hits.append({"shape": name, "text": line.strip()[:180]})
    return hits


def build(course: str) -> dict:
    syl = load_syllabus(course)
    names = topics(syl)
    covered = {n: [] for n in names}
    orphans, intro, empty = [], [], []

    for path in chapters_for(course):
        html = path.read_text(encoding="utf-8", errors="replace")
        secs = split_sections(html, 0)
        m = re.search(r"ch(\d+)", path.name)
        ch = int(m.group(1)) if m else 0
        for s in secs:
            s["chapter"] = ch
            s["file"] = path.name
            s["questions"] = []
        marks = list(HEADING.finditer(html))
        for i, s in enumerate(secs):
            end = marks[i + 1].start() if i + 1 < len(marks) else len(html)
            s["questions"] = find_questions(html, marks[i].start(), end)

        for s in secs:
            if not s["number"]:
                intro.append(s)
                continue
            major = major_of(s["number"])
            if major in names:
                covered[major].append(s)
            elif major.endswith(".0"):
                # 3.0, 3.0.1 ... the unit's own opening, not a sub-topic.
                intro.append(s)
            elif major == str(s["chapter"]):
                intro.append(s)
            else:
                orphans.append(s)

    gaps = {n: t for n, t in names.items() if not covered[n]}
    thin = {n: sum(s["words"] for s in covered[n]) for n in covered if covered[n]}
    return {
        "course": course,
        "code": syl["code"],
        "title": syl["title"],
        "topics": names,
        "covered": {n: [{"number": s["number"], "title": s["title"], "file": s["file"],
                         "words": s["words"]} for s in covered[n]] for n in covered},
        "words_per_topic": thin,
        "gaps": gaps,
        "orphans": [{"number": s["number"], "title": s["title"], "file": s["file"],
                     "words": s["words"]} for s in orphans],
        "intro": [{"number": s["number"] or "(unnumbered)", "title": s["title"],
                   "file": s["file"], "words": s["words"]} for s in intro],
        "questions_in_learn": [
            {"number": s["number"], "title": s["title"], "file": s["file"],
             "hits": s["questions"][:4], "count": len(s["questions"])}
            for s in [x for grp in covered.values() for x in grp] + orphans + intro
            if s["questions"]],
    }


def report(m: dict) -> None:
    print(f"== {m['title']} ({m['code']}) ==")
    print(f"{len(m['topics'])} syllabus sub-topics | "
          f"{sum(len(v) for v in m['covered'].values())} sections map to one | "
          f"{len(m['gaps'])} gaps | {len(m['orphans'])} orphans | "
          f"{len(m['intro'])} unit-intro sections")

    print("\n-- coverage, weakest first --")
    for n, words in sorted(m["words_per_topic"].items(), key=lambda kv: kv[1]):
        secs = m["covered"][n]
        pct = 100 * words / max(1, sum(m["words_per_topic"].values()))
        print(f"  {n:5} {words:6} words {pct:5.1f}%  {len(secs):2} sec  {m['topics'][n][:58]}")

    print("\n-- GAPS (syllabus names it, no section teaches it) --")
    for n, t in m["gaps"].items():
        print(f"  {n:5} {t}")
    if not m["gaps"]:
        print("  none")

    print("\n-- ORPHANS (numbered for a topic the syllabus does not name) --")
    for s in m["orphans"]:
        print(f"  {s['number']:7} {s['words']:5}w  {s['file']:10} {s['title'][:70]}")
    if not m["orphans"]:
        print("  none")

    print("\n-- QUESTION material sitting inside Learn (to move to Past Questions) --")
    total = sum(q["count"] for q in m["questions_in_learn"])
    print(f"  {len(m['questions_in_learn'])} sections, {total} matches "
          f"(a marks badge or an Answer: label; bare citations of the paper are excluded)")
    for q in sorted(m["questions_in_learn"], key=lambda q: -q["count"])[:14]:
        shapes = ", ".join(sorted({h["shape"] for h in q["hits"]}))
        print(f"  {q['number'] or '(unnumbered)':12} {q['count']:3}x [{shapes}]  {q['title'][:48]}")
        print(f"          e.g. {q['hits'][0]['text'][:120]}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--course", default="dcc", choices=sorted(COURSES))
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    m = build(args.course)
    if args.json:
        print(json.dumps(m, ensure_ascii=False, indent=1))
    else:
        report(m)

    if args.write:
        out = ROOT / "data" / "syllabus_map.json"
        existing = {}
        if out.exists():
            try:
                existing = json.loads(out.read_text(encoding="utf-8"))
            except Exception:
                existing = {}
        existing[args.course] = m
        out.write_text(json.dumps(existing, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"\nwrote {out.relative_to(ROOT)}[{args.course}]")

    if args.check and m["gaps"]:
        print(f"\nFAIL: {len(m['gaps'])} syllabus sub-topic(s) taught by no section", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
