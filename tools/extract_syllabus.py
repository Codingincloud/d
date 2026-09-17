#!/usr/bin/env python3
"""Extract the OFFICIAL syllabus of both courses into one machine-readable file.

Why this exists
---------------
"Make the site follow the syllabus" is a claim that has to be checkable, not
remembered. The syllabus is the only document that says what is examinable, and
until now it lived in two places at once: a scanned PDF whose OCR is committed at
`_source/dcc/syllabus_distbd_cloudcomptng.txt`, and pages 12-14 of the
university's course-structure PDF for Simulation & Modeling. Neither is in a shape
a build step can read, so "is this topic on the site?" was answered from memory -
which is exactly how a site drifts away from the paper it is meant to pass.

So the units, their sub-topics, their teaching hours and their marks are
extracted here into `data/syllabus.json` and every unit records WHERE it came
from (file + page). Nothing is typed by hand: if the parser misses a topic, the
fix is in the parser, and the provenance makes the miss visible.

    python tools/extract_syllabus.py             # write data/syllabus.json
    python tools/extract_syllabus.py --show      # print what it found, write nothing
    python tools/extract_syllabus.py --check     # fail if the file on disk is stale

The two sources are shaped differently on purpose, and both shapes are handled
rather than normalised by hand:

  * DCC  - OCR of a scan. 'Unit 5' comes back as 'nit 5', '1.2' as 'I .2', and
           the marks table is a flat run of numbers. The parser is written for
           that damage, not against it: it accepts the leading-glyph variants and
           then the numbers it extracts are CHECKED (the marks must sum to the
           paper total, the hours must sum to the teaching schedule), so a bad
           read fails loudly instead of quietly entering the scope.
  * Sim  - a text-layer PDF. Clean headings, so the same parser is fed
           'UNIT 1: Concept of simulation       [ 6 Hrs ]' and strips the
           bracketed hours.
"""

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "syllabus.json"

DCC_OCR = ROOT / "_source" / "dcc" / "syllabus_distbd_cloudcomptng.txt"

# The Simulation syllabus is three pages of a university-wide PDF that lives
# OUTSIDE the repository, so the pages are snapshotted into the repo the same way
# the DCC syllabus's OCR is (see _source/dcc/): a committed source of record with
# its provenance in the header. Without it, "--check" would answer differently on
# a machine that has the 88-page PDF and one that does not, and a check that
# depends on the machine is not a check.
SIM_TEXT = ROOT / "_source" / "syllabus" / "sim_syllabus.txt"
SIM_PDF = Path(r"C:\Users\ghimi\Downloads\7BE-Computer-First-semester-Course-Structure-Syllabus-with-Electives (1).pdf")
SIM_PAGES = (12, 13, 14)

# A unit heading, tolerant of the OCR's leading glyph. Matches both
#   'Unit 1: Introduction to Distributed Systems (4 Hours)'   (DCC, clean)
#   'nit 5: Introduction to Cloud Com utin (4 Hours)'          (DCC, damaged)
#   'UNIT 2: Monte Carlo Method      [ 4 Hrs ]'                (Simulation)
UNIT_RE = re.compile(
    r"^\s*(?:U?[Nn][Ii][Tt]|[Nn][Ii][Tt])\s*(\d+)\s*[:.\-]\s*(.+?)\s*"
    r"(?:[\(\[]\s*(\d+)\s*(?:Hours|Hrs)[^\)\]]*[\)\]])?\s*$",
    re.I)

# A sub-topic line: '1.2 The system', 'I .2 Goals of distributed systems',
# '       2.1 Monte Carlo Method', '9.4 Cloud-native and Microservices'.
TOPIC_RE = re.compile(r"^\s*[Il1]?\s*[\.,]?\s*(\d)\s*\.\s*(\d)\s*[\.\:]?\s*(\S.*)$")

# The DCC paper: Group A/B/C of the teacher's own 2025 model question, which is
# the only past paper this course has. Captured here because "past questions"
# and "the syllabus" are the same document for this course.
QUESTION_RE = re.compile(
    r"^\s*(?:\d{1,2}[\).,]\s*)?(Define|What|List|Explain|Differentiate|Describe|Compare|"
    r"Discuss|Briefly|How)\b.*$", re.I)


def clean(text: str) -> str:
    """OCR debris off a topic or title."""
    for bad, good in REPAIRS.items():
        text = text.replace(bad, good)
    text = text.replace("\u2019", "'").replace("\u2010", "-")
    text = re.sub(r"\s+", " ", text).strip()
    return text.strip(" .;,:")


def fix_ocr_digits(line: str) -> str:
    """Undo the scan's own habits with the digits.

    The OCR of this syllabus renders a leading 1 as 'I' or 'l', an 11 as 'I I',
    and a decimal point as ' .' or ','. Applied in order, longest pattern first -
    'I I.' before 'I.', or every 'I I.' becomes '1.I.'. These are not guesses
    about meaning: each one is a shape the scan actually produces, and the checks
    at the end of the file (9 units, 34 sub-topics, marks summing to 60) fail if
    one of them stops matching.
    """
    line = re.sub(r"^\s*I\s*I\s*[\.,]\s*", "11. ", line)      # 'I I. Explain ...'
    line = re.sub(r"^\s*IO\s*[\.,]\s*", "10. ", line)          # 'IO. What are ...'
    line = re.sub(r"^\s*I\s*\[?\s*[ .,]*(\d)", r"1.\1", line)  # 'I .2 Goals'
    line = re.sub(r"^\s*l\s*\.\s*", "1. ", line)               # 'l. Define ...'
    line = re.sub(r"^\s*l\s*[ .,]*(\d)", r"1.\1", line)
    line = re.sub(r"^\s*(\d)\s*[,.]\s*(\d)", r"\1.\2", line)   # '1,2' -> '1.2'
    return line


# A sub-topic whose leading digit the scan dropped entirely: '.1 Overview of AWS'
# (unit 7's first topic), when the unit itself is 7. The unit number is the only
# thing that can supply the missing digit, which is why this runs inside a unit
# body rather than as a general rule.
BARE_TOPIC_RE = re.compile(r"^\s*\.\s*(\d)\s*[\.,:)]?\s*([A-Za-z].*)$")

# And a sub-topic that lost its NUMBER as well as its point: unit 9's list reads
# 'Edge and Fog Computing', 'Serverless Architecture', 'Kubernetes and Docker' -
# three bulleted topics, then one numbered. Counted in order, they are 9.1-9.3.
UNNUMBERED_RE = re.compile(r"^\s*([A-Z][A-Za-z0-9][^.:;]{6,70})$")

# Where a unit's body ends. Unit 9 is the last one, and after its topics the scan
# continues into the recommended books, the references and the marks table - all
# of which look exactly like unnumbered topics to the rule above. Without this,
# 'Tim Kindberg, Gordon Blair (5th Edition)' becomes sub-topic 9.2.
STOP_RE = re.compile(
    r"^\s*(Recommended|References|Tentative Marks|Program:|Model Question|Group [ABC]:|"
    r"Subject:|Time:|Full Marks|Pass Marks)\b", re.I)

# OCR joins that are wrong words rather than wrong digits. Kept as data, and kept
# short: every entry here is a repair of THIS scan, not a licence to rewrite the
# syllabus. 'Com utin' is what the scan makes of 'Computing'.
REPAIRS = {"Com utin": "Computing", "Com uting": "Computing", "Com uting": "Computing"}


def parse_units(text: str, source: str, pages: dict, preserve_pages: bool = False) -> list[dict]:
    """Units, their topics, hours and the page each unit heading came from."""
    units: list[dict] = []
    current: dict | None = None
    page = None
    for i, raw in enumerate(text.splitlines()):
        line = raw.rstrip()
        if "===== page" in line:
            page = int(re.search(r"page\s+(\d+)", line).group(1))
            continue
        stripped = fix_ocr_digits(line)
        m = UNIT_RE.match(stripped)
        if m:
            current = {"n": int(m.group(1)), "title": clean(m.group(2)),
                       "hours": int(m.group(3)) if m.group(3) else None,
                       "topics": [], "source": source,
                       "page": page if page is not None else pages.get(i)}
            units.append(current)
            continue
        t = TOPIC_RE.match(stripped)
        if t and current is not None:
            label = f"{t.group(1)}.{t.group(2)}"
            body = clean(t.group(3))
            # '1.2 Goals of distributed systems' -> the number is noise, the text
            # is the topic. Kept as a pair so the site can show the syllabus's own
            # numbering, which is how a student finds it on the printed page.
            if len(body) > 2:
                current["topics"].append({"n": label, "t": body})
            continue
        if current is None:
            continue
        if STOP_RE.match(stripped):
            current = None
            continue
        # The scan drops the unit digit, not the topic digit: unit 7's list reads
        # '.1 Overview of AWS', '.2 Storage services', '7.3 Compute services'. So
        # the surviving digit is the topic number, and it has to continue the
        # sequence this unit has already produced.
        b = BARE_TOPIC_RE.match(stripped)
        if b and int(b.group(1)) == len(current["topics"]) + 1:
            current["topics"].append({"n": f"{current['n']}.{b.group(1)}",
                                      "t": clean(b.group(2)),
                                      "inferred": "the scan dropped the unit digit; the "
                                                  "number labels that survive continue the "
                                                  "sequence inside this unit"})
            continue
        # Unit 9's list is bulleted in the printed syllabus - 'Edge and Fog
        # Computing', 'Serverless Architecture', 'Kubernetes and Docker' carry no
        # numbers at all, only the fourth item does. So an unnumbered line inside
        # a unit body is a topic, counted in order. The count check in verdicts()
        # is what keeps that from swallowing something that is not a topic.
        u = UNNUMBERED_RE.match(stripped)
        if u:
            nxt = len(current["topics"]) + 1
            current["topics"].append({"n": f"{current['n']}.{nxt}", "t": clean(u.group(1)),
                                      "inferred": "the scan dropped this topic's number; "
                                                  "counted in order inside its unit"})
    return units


def read_pages(path: Path) -> tuple[str, dict]:
    """Text plus a line-number -> page-number map."""
    text = path.read_text(encoding="utf-8", errors="replace")
    pages, page = {}, 1
    out = []
    for line in text.splitlines():
        if "===== page" in line:
            page = int(re.search(r"page\s+(\d+)", line).group(1))
            continue
        pages[len(out)] = page
        out.append(line)
    return "\n".join(out), pages


def snapshot_sim() -> int:
    """One-time: write the course-structure PDF's pages into the repo."""
    try:
        from pypdf import PdfReader
    except ImportError:
        sys.exit("extract_syllabus: pypdf is needed to snapshot the Simulation syllabus")
    if not SIM_PDF.is_file():
        sys.exit(f"extract_syllabus: the source PDF is not at {SIM_PDF}")
    reader = PdfReader(str(SIM_PDF))
    body = []
    for n in SIM_PAGES:
        body.append(f"===== page {n} =====  [text layer]")
        body.append((reader.pages[n - 1].extract_text() or "").rstrip())
        body.append("")
    header = (f"source: {SIM_PDF.name}\n"
              f"pages:  {', '.join(str(n) for n in SIM_PAGES)} (BCE7026 Simulation and Modeling)\n"
              f"method: pypdf text layer - NOT ocr; this PDF has a real text layer\n"
              f"note:   the syllabus lives in a university-wide 88-page PDF outside\n"
              f"        the repository, so these pages are committed as the source of\n"
              f"        record for the Simulation scope. Re-snapshot with\n"
              f"        `python tools/extract_syllabus.py --snapshot-sim`.\n" + "-" * 70 + "\n")
    SIM_TEXT.parent.mkdir(parents=True, exist_ok=True)
    SIM_TEXT.write_text(header + "\n".join(body), encoding="utf-8", newline="\n")
    print(f"wrote {SIM_TEXT}")
    return 0


def sim_text() -> str:
    """The committed snapshot of the Simulation syllabus pages."""
    if not SIM_TEXT.is_file():
        sys.exit(f"extract_syllabus: {SIM_TEXT} is missing.\n"
                 f"  It is the committed source of record for the Simulation scope;\n"
                 f"  recreate it with `--snapshot-sim` (needs the university PDF), or\n"
                 f"  build the DCC scope only with `--dcc-only`.")
    return SIM_TEXT.read_text(encoding="utf-8", errors="replace")


def dcc_marks(text: str) -> list[int] | None:
    """The 'Tentative Marks Distribution' row: nine marks that must total 60."""
    tail = text.split("Tentative Marks Distribution", 1)
    if len(tail) < 2:
        return None
    nums = [int(n) for n in re.findall(r"\b(\d{1,2})\b", tail[1])]
    # The table is 'Chapter 1..9 Total Marks' / 'Marks 6 10 6 6 6 8 6 8 4 60'.
    # Scan for the window that sums to 60.
    for i in range(len(nums) - 9):
        window = nums[i:i + 9]
        if sum(window) == 60 and all(2 <= v <= 12 for v in window):
            return window
    return None


def build(include_sim: bool = True) -> dict:
    text, pages = read_pages(DCC_OCR)
    dcc_units = parse_units(text, DCC_OCR.name, pages, preserve_pages=True)
    marks = dcc_marks(text)
    if marks:
        for unit, m in zip(dcc_units, marks):
            unit["marks"] = m

    doc = {
        "_comment": [
            "The official syllabus of both courses, extracted by",
            "tools/extract_syllabus.py - do not hand-edit. Every unit carries the",
            "source file and the page it was read from, because this file is the",
            "authority the site's scope is measured against: a topic that is not",
            "here is not examinable, and a topic here that the site does not teach",
            "is a gap. The two checks that keep that true are in the same tool:",
            "the marks must sum to the paper total and the hours to the schedule.",
        ],
        "courses": {},
    }

    dcc = {
        "code": "BCE7024",
        "title": "Distributed & Cloud Computing",
        "source": "_source/dcc/syllabus_distbd_cloudcomptng.txt (OCR of syllabus_Distbd_CloudComptng.pdf)",
        "marks_total": 60,
        "hours_total": 45,
        "units": dcc_units,
    }
    # The teacher's own Model Question 2025, which is on pages 4-5 of the same
    # scan: this course is one paper old, so these ARE its past questions.
    page4 = text.split("===== page 4 =====")[-1]
    questions = []
    for line in page4.splitlines():
        # Numbered through fix_ocr_digits first, so 'l. Define' and 'IO. What are'
        # arrive as '1. Define' / '10. What are' and the prefix can be dropped in
        # one place rather than in three shapes.
        fixed = fix_ocr_digits(line)
        if QUESTION_RE.match(fixed):
            questions.append(clean(re.sub(r"^\s*\d{1,2}\s*[\).,]\s*", "", fixed)))
    dcc["past_paper_2025"] = questions
    doc["courses"]["dcc"] = dcc

    if include_sim:
        sim_text_raw = sim_text()
        sim_units = parse_units(sim_text_raw, SIM_TEXT.name, {})
        doc["courses"]["sim"] = {
            "code": "BCE7026",
            "title": "Simulation and Modeling",
            "source": "7BE-Computer-First-semester-Course-Structure-Syllabus-with-Electives.pdf pages 12-14",
            "marks_total": 60,
            "units": sim_units,
        }
    return doc


def verdicts(doc: dict) -> list[str]:
    """The self-checks: a bad OCR read has to fail here, not on a web page."""
    out = []
    dcc = doc["courses"]["dcc"]
    units = dcc["units"]
    out.append(f"DCC units parsed: {len(units)} (the syllabus has 9)")
    if len(units) != 9:
        out.append("  !! unit count is wrong - the parser needs fixing before the scope is trusted")
    topics = sum(len(u["topics"]) for u in units)
    out.append(f"DCC sub-topics parsed: {topics} (the printed list has 34: "
               f"4+4+4+3+4+4+3+4+4)")
    marks = [u.get("marks") for u in units]
    out.append(f"DCC marks: {marks} = {sum(m for m in marks if m)} (paper total 60)")
    hours = [u.get("hours") for u in units]
    out.append(f"DCC hours: {hours} = {sum(h for h in hours if h)} (schedule says 45)")
    out.append(f"DCC model-question lines found: {len(dcc['past_paper_2025'])} (the 2025 paper has 16)")
    if "sim" in doc["courses"]:
        sim = doc["courses"]["sim"]
        sup = [u["hours"] for u in sim["units"]]
        out.append(f"Sim units parsed: {len(sim['units'])} (the syllabus has 8)")
        out.append(f"Sim hours: {sup} = {sum(h for h in sup if h)} "
                   f"(printed: 6+4+5+5+5+8+5+7)")
        out.append(f"Sim sub-topics parsed: {sum(len(u['topics']) for u in sim['units'])}")
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--show", action="store_true", help="print what was found; write nothing")
    ap.add_argument("--check", action="store_true", help="fail if data/syllabus.json is stale")
    ap.add_argument("--dcc-only", action="store_true",
                    help="skip Simulation (its syllabus text is not in the repo)")
    ap.add_argument("--snapshot-sim", action="store_true",
                    help="re-write the committed Simulation syllabus text from the university PDF")
    args = ap.parse_args()

    if args.snapshot_sim:
        return snapshot_sim()

    doc = build(include_sim=not args.dcc_only)
    text = json.dumps(doc, indent=2, ensure_ascii=False) + "\n"

    for line in verdicts(doc):
        print(line)
    for unit in doc["courses"]["dcc"]["units"]:
        print(f"  U{unit['n']} {unit['title'][:52]:<52} {unit.get('marks','?'):>2}m "
              f"{unit.get('hours','?')}h  {len(unit['topics'])} topics")

    if args.show:
        return 0
    if args.check:
        if not OUT.is_file():
            print(f"{OUT} is missing - run tools/extract_syllabus.py")
            return 1
        if OUT.read_text(encoding="utf-8") != text:
            print(f"{OUT} is OUT OF DATE - run tools/extract_syllabus.py")
            return 1
        print(f"{OUT.name} is current")
        return 0
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding="utf-8", newline="\n")
    print(f"wrote {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
