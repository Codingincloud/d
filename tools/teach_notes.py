#!/usr/bin/env python3
"""Learn Effectively: the whole course taught, topic by topic, as its own tab.

What this is, and why it is not the notes again
-----------------------------------------------
Three layers now sit over the same syllabus, and each answers a different
question:

  Learn              the notes as taught in class - 250 words a section, with the
                     deck's figures, tables and worked examples
  Revise             one fixed-size card per syllabus sub-topic - ~120 words, for
                     the night before
  Learn Effectively  this file: every sub-topic taught end to end, in plain words,
                     with no length limit - what it is, why it works that way, how
                     it runs, where marks are lost, and the shape of a full-marks
                     answer

The reader asked for it in exactly those terms: "present everything, summarize all
content yourself manually, no limit on how much to present, but must help me learn
the concept and get full marks, teach every topic properly."

The shape is a contract, not a house style. Every topic carries the same five parts,
in this order:

    In one line         the definition a paper can be answered from
    The explanation     the teaching - the mechanism, the why, the named lists
    How it runs         a concrete walk-through, with the numbers worked
    Exam traps          where marks are lost, and what the question really wants
    Full-marks answer   the skeleton to write under a question that names it

Uniform parts are what make the tab navigable at this length: a reader skimming for
the model answer of 3.4 knows it is the last block of the card, in every card.

The summary card comes first, and the five parts sit behind it
-------------------------------------------------------------
Read as five headed blocks of prose, a thousand words a topic is a wall, and it was
rejected as one - "dont text dumb give summary". So every topic also carries a
`points` list, and the tab draws that as the card: a definition panel, a table of
the points that have to be stated (a term and one sentence each), a numbered
run-through, a panel of traps and a panel holding the answer skeleton. The written
teaching above is still there, unchanged, one click below the card rather than
replaced by it.

Nothing is duplicated between the two layers: a point that only restates the
definition is removed rather than printed twice, which is why the card is shorter
than the teaching rather than a second copy of its opening.

What the guard refuses
----------------------
  * a syllabus sub-topic with no topic here, or a topic for a number the syllabus
    does not have unless it is declared `"prereq": true` (2.0 and 3.0)
  * a topic whose title is not the syllabus's own wording
  * a topic missing one of the five parts, or carrying them out of order
  * a topic under MIN_WORDS - "teach every topic properly" is the ask, and a
    paragraph is not a topic
  * a bolded term that is not in the notes of that unit, or a quoted number that is
    not in them (anti-invention, the same rule the revise and Revise layers are held
    to: a teaching page may explain the notes more slowly, never differently)
  * deck talk, reader-addressing and self-commentary in the teaching - the voice
    rules the rest of this site is held to. "Exam traps" and "Full-marks answer" are
    the two blocks where the exam is the subject, so the exam tells are not applied
    there; everywhere else they are.
  * a summary card with fewer than POINT_ROWS_MIN points, a point outside the word
    bounds a summary point is held to, a repeated term, a term or number that is not
    in the unit's notes, or a point written in the voice the teaching is refused -
    the summary is where a wrong fact would be believed fastest, so it is held to
    the same anti-invention rule as the teaching it summarises
  * topics out of reading order, and a dcc-site/data/teach.js that no longer
    matches this file - that is what the page loads

Usage
-----
    python tools/teach_notes.py --report      # every topic, its words, its parts
    python tools/teach_notes.py --check       # the guard; exit 1 on a problem
    python tools/teach_notes.py --apply       # regenerate dcc-site/data/teach.js
    python tools/teach_notes.py --check --strict   # a missing topic fails too
"""

from __future__ import annotations

import argparse
import html as htmllib
import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "dcc_teach.json"
SYLLABUS = ROOT / "data" / "syllabus.json"
SITE = ROOT / "dcc-site"
OUT = SITE / "data" / "teach.js"

COURSE = "dcc"

# The five parts, in the order a topic has to carry them.
SKELETON = ["In one line", "The explanation", "How it runs", "Exam traps", "Full-marks answer"]
# The two parts where the examination is the subject rather than what must not be
# mentioned: a page whose job is full marks has to be allowed to talk about marks.
EXAM_PARTS = {"Exam traps", "Full-marks answer"}

# "Teach every topic properly" as a number. The thinnest sub-topic on this syllabus
# (5.3, one sub-section) still has this much to say; a topic below it is a paragraph
# wearing a heading.
MIN_WORDS = 500

# The summary card, which is what the reader meets before anything is opened. One
# topic in a table, not a wall of text: a definition, then the points that have to
# be stated, each as a term and one sentence. Four rows is the floor because a
# taught sub-topic with fewer than four things to state is not a topic.
POINT_ROWS_MIN = 4
POINT_LABEL_MAX = 48
POINT_WORDS_MAX = 60

# Only these tags are part of a teaching topic. Anything else is a page trying to be
# a chapter: figures and callouts belong to the notes, and the link in the heading
# goes there.
ALLOWED_TAGS = {"p", "ul", "ol", "li", "strong", "em", "code", "h3", "h4",
                "table", "thead", "tbody", "tr", "th", "td", "caption", "br"}

# The five part headings are <h4>: the card's own title is the <h3> the renderer
# writes, so the page reads as one heading per topic with five steps under it.
HEAD = re.compile(r"<h4>(.*?)</h4>", re.S)
UNIT_TITLE = re.compile(r"^\s*unit\s+\d+\b", re.I)


def load_revise_blocks():
    """tools/revise_blocks.py, for `plain`, the section splitter and TELLS.

    The voice rules must not exist twice, and a change to what counts as a yap has
    to reach every layer at once - tools/voice_rewrite.py imports tools/voice_audit.py
    for the same reason.
    """
    spec = importlib.util.spec_from_file_location("revise_blocks", ROOT / "tools" / "revise_blocks.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


RB = load_revise_blocks()
plain = RB.plain


def words_of(html: str) -> int:
    """Words, with the emoji left out: a token with no letter or digit is not a word."""
    return sum(1 for w in plain(html).split() if re.search(r"[A-Za-z0-9]", w))


def norm(s: str) -> str:
    s = htmllib.unescape(str(s or ""))
    s = s.replace("\u2013", "-").replace("\u2014", "-").replace("\u2019", "'")
    return re.sub(r"\s+", " ", s).strip()


# --------------------------------------------------------------------------
# sources


def syllabus_topics() -> list[dict]:
    doc = json.loads(SYLLABUS.read_text(encoding="utf-8"))
    out = []
    for unit in doc["courses"][COURSE]["units"]:
        for t in unit["topics"]:
            out.append({"n": t["n"], "unit": unit["n"], "t": t["t"]})
    return out


def plan() -> dict:
    return json.loads(DATA.read_text(encoding="utf-8"))


def chapter_parts(n: int) -> tuple[list[dict], str]:
    """(sections, everything the unit says) - the notes plus the revise blocks.

    This is the anti-invention corpus for the unit: a teaching page may say more
    slowly what the unit already says, and may not introduce a term or a number the
    unit does not carry. It is deliberately the whole unit rather than one section -
    a topic taught end to end draws on the sections around it.
    """
    path = SITE / f"ch{n}.js"
    if not path.is_file():
        return [], ""
    text = RB.read(path)
    start, end, _ = RB.learn_field(text)
    learn = text[start:end]
    m = re.search(r"^  revise: \{(?P<body>.*)\},\r?$", text, re.M)
    blocks = json.loads("{" + m.group("body") + "}") if m else {}
    corpus = plain(learn) + " " + plain(" ".join(blocks.values()))
    return RB.sections(learn), corpus.lower()


def numbered(sec: dict) -> str:
    m = re.match(r"^(\d+(?:\.\d+)*)\b", sec["text"])
    return m.group(1) if m else ""


def check_order(keys: list[str]) -> list[str]:
    problems: list[str] = []
    per_chapter: dict[int, list[str]] = {}
    for k in keys:
        per_chapter.setdefault(int(k.split(".")[0]), []).append(k)
    for unit, ks in per_chapter.items():
        seen = [numbered(s) for s in chapter_parts(unit)[0]]
        seen = [k for k in seen if k in set(ks)]
        if seen != ks:
            problems.append(f"ch{unit}: topics are out of reading order - file has {ks}, the notes have {seen}")
    return problems


# --------------------------------------------------------------------------
# the guard


def check_plan(strict: bool = False) -> tuple[list[str], dict, list[str]]:
    problems: list[str] = []
    pending: list[str] = []
    doc = plan()
    topics: dict[str, dict] = doc.get("topics", {})
    syllabus = {t["n"]: t for t in syllabus_topics()}
    keys = list(topics)

    for n, t in syllabus.items():
        if n not in topics:
            pending.append(f"{n}: not written yet (the syllabus lists {t['t']!r})")
            continue
        c = topics[n]
        if c.get("unit") != t["unit"]:
            problems.append(f"{n}: filed under unit {c.get('unit')}, the syllabus has it in unit {t['unit']}")
        if norm(c.get("t", "")) != norm(t["t"]):
            problems.append(f"{n}: title is {c.get('t')!r}, the syllabus's wording is {t['t']!r}")
    for n, c in topics.items():
        if n not in syllabus and not c.get("prereq"):
            problems.append(f"{n}: not a syllabus sub-topic and not declared \"prereq\"")
        if n in syllabus and c.get("prereq"):
            problems.append(f"{n}: declared \"prereq\" but it is a syllabus sub-topic")

    problems += check_order(keys)

    stats = {"topics": 0, "words": 0, "min": 10 ** 6, "max": 0, "shortest": "", "longest": ""}
    per_unit: dict[int, int] = {}
    corpus: dict[int, str] = {}
    chapters: dict[int, str] = {}

    for n, c in topics.items():
        unit = int(n.split(".")[0])
        body = str(c.get("html", ""))
        words = words_of(body)
        stats["topics"] += 1
        stats["words"] += words
        per_unit[unit] = per_unit.get(unit, 0) + words
        if words < stats["min"]:
            stats["min"], stats["shortest"] = words, n
        if words > stats["max"]:
            stats["max"], stats["longest"] = words, n
        if words < MIN_WORDS:
            problems.append(f"{n}: {words} words, under the {MIN_WORDS}-word floor for a taught topic")

        emoji = str(c.get("e", "")).strip()
        if not emoji or re.search(r"[A-Za-z0-9]", emoji) or len(emoji) > 4:
            problems.append(f"{n}: the emoji field {emoji!r} is not a single emoji")

        # The five parts, in order, named exactly.
        parts = [plain(h) for h in HEAD.findall(body)]
        if parts != SKELETON:
            problems.append(f"{n}: parts are {parts}, the skeleton is {SKELETON}")

        for tag in set(re.findall(r"</?([a-zA-Z0-9]+)", body)):
            if tag.lower() not in ALLOWED_TAGS:
                problems.append(f"{n}: uses <{tag}>, which is not part of a taught topic")
        for t in ("p", "ul", "ol", "li", "table", "h4"):
            if body.count("<" + t) != body.count("</" + t + ">"):
                problems.append(f"{n}: unbalanced <{t}> tags")

        # Per part: the teaching is held to the voice rules, the exam parts are not.
        blocks = HEAD.split(body)[1:]          # ["In one line", body, "The explanation", body, ...]
        for i in range(0, len(blocks), 2):
            title = plain(blocks[i])
            chunk = blocks[i + 1] if i + 1 < len(blocks) else ""
            if title in EXAM_PARTS:
                continue
            text = plain(chunk)
            for rx, why in RB.TELLS:
                hit = rx.search(text)
                if hit:
                    problems.append(f"{n} · {title}: {why} ({hit.group(0)!r})")

        # Anti-invention, against the unit's own notes.
        if unit not in corpus:
            corpus[unit] = chapter_parts(unit)[1]
            chapters[unit] = " ".join(s["text"] for s in chapter_parts(unit)[0])
        src = corpus[unit]
        if not src.strip():
            problems.append(f"{n}: no notes found for chapter {unit}")
            continue
        for term in re.findall(r"<strong>(.*?)</strong>", body, re.S):
            t = plain(term).lower()
            if len(t) < 3:
                continue
            if t not in src:
                problems.append(f"{n}: bolded term {plain(term)!r} is not in the notes of unit {unit}")
        for num in re.findall(r"(?<![\d.])(\d+(?:\.\d+)*)", plain(body)):
            if num in n or num in re.findall(r"\d+(?:\.\d+)*", n):
                continue
            if not re.search(r"(?<![\d.])" + re.escape(num) + r"(?!\d)(?!\.\d)", src):
                problems.append(f"{n}: number {num} is not in the notes of unit {unit}")
        # The summary card above the fold is held to the same rules as the teaching
        # it summarises.
        problems += check_points(n, c, unit, src)

    stats["per_unit"] = per_unit
    stats["pending"] = len(pending)
    return problems, stats, pending


def check_points(n: str, c: dict, unit: int, src: str) -> list[str]:
    """The summary card's own contract.

    Same anti-invention rule as the teaching below it - a term that is not in the
    unit's notes, or a number it does not carry, is refused - because the summary is
    where a reader stops and where a wrong fact would be believed fastest.
    """
    problems: list[str] = []
    rows = c.get("points")
    if not isinstance(rows, list) or len(rows) < POINT_ROWS_MIN:
        return [f"{n}: the summary needs at least {POINT_ROWS_MIN} key points"]
    seen: set[str] = set()
    for row in rows:
        if not isinstance(row, list) or len(row) != 2:
            problems.append(f"{n}: a key point is not a [term, what it means] pair")
            continue
        label, value = str(row[0]), str(row[1])
        key = plain(label).strip().lower()
        words = words_of(value)
        if not key or len(label) > POINT_LABEL_MAX:
            problems.append(f"{n}: the key-point term {label!r} is empty or over {POINT_LABEL_MAX} characters")
        elif key in seen:
            problems.append(f"{n}: the key-point term {label!r} appears twice")
        else:
            seen.add(key)
            if len(key) >= 3 and key not in src:
                problems.append(f"{n}: key-point term {plain(label)!r} is not in the notes of unit {unit}")
        if words < 3 or words > POINT_WORDS_MAX:
            problems.append(f"{n}: the key point {plain(label)!r} is {words} words, outside the 3 to "
                            f"{POINT_WORDS_MAX} a summary point is held to")
        # The teaching's voice rules apply here too: a key point is explanation text.
        for rx, why in RB.TELLS:
            hit = rx.search(plain(value))
            if hit:
                problems.append(f"{n} · key point {plain(label)!r}: {why} ({hit.group(0)!r})")
        for num in re.findall(r"(?<![\d.])(\d+(?:\.\d+)*)", plain(value)):
            if num in n or num in re.findall(r"\d+(?:\.\d+)*", n):
                continue
            if not re.search(r"(?<![\d.])" + re.escape(num) + r"(?!\d)(?!\.\d)", src):
                problems.append(f"{n}: key-point number {num} is not in the notes of unit {unit}")
    return problems


def summary_line(html_s: str) -> str:
    """A topic's first line, for the search index.

    The search result for a taught topic should read as the topic's definition
    rather than as its markup: taking the top of the stored teaching would put the
    heading "In one line" in front of the sentence, which is a label and not a
    claim. The definition is what a searcher needs to see.
    """
    blocks = HEAD.split(str(html_s or ""))[1:]
    for i in range(0, len(blocks), 2):
        if plain(blocks[i]).strip() == "In one line":
            return re.sub(r"\s+", " ", plain(blocks[i + 1])).strip()[:170]
    return re.sub(r"\s+", " ", plain(html_s)).strip()[:170]


def render_js() -> str:
    doc = plan()
    topics = doc.get("topics", {})
    chapters: dict[str, dict] = {}
    for n, c in topics.items():
        unit = str(c.get("unit") or int(n.split(".")[0]))
        ch = chapters.setdefault(unit, {"words": 0, "topics": []})
        words = words_of(c.get("html", ""))
        card = {"n": n, "t": c.get("t", ""), "e": c.get("e", ""),
                "points": c.get("points", []),
                "snip": summary_line(c.get("html", "")),
                "html": c.get("html", ""), "w": words}
        if c.get("prereq"):
            card["prereq"] = True
        ch["topics"].append(card)
        ch["words"] += words
    payload = {"course": doc.get("course", COURSE),
               "parts": list(doc.get("parts") or SKELETON),
               "chapters": chapters}
    return (
        "/* Learn Effectively for the DCC portal - every syllabus sub-topic taught end\n"
        "   to end, in plain words, with no length limit.\n"
        "\n"
        "   GENERATED by tools/teach_notes.py --apply from data/dcc_teach.json. Do not\n"
        "   edit this file: the plan is the JSON, and --check fails when the two\n"
        "   disagree. Every topic carries a summary card - `points`, the definition,\n"
        "   the worked run-through, the traps and the answer, drawn as blocks - and\n"
        "   behind it the same five parts in the same order: In one line, The\n"
        "   explanation, How it runs, Exam traps, Full-marks answer. Every term and\n"
        "   number in both layers is one the unit's own notes already carry.\n"
        "\n"
        "   Shape: window.TEACH = {course, parts, chapters:{\"1\":{words, topics:[{n,t,e,points:[[term,what],...],html,w}]}}}\n"
        "   `w` is a topic's own word count and `words` the chapter's. */\n"
        "window.TEACH=" + json.dumps(payload, ensure_ascii=False, indent=1) + ";\n"
    )


def cmd_check(strict: bool = False) -> int:
    problems, stats, pending = check_plan()
    if OUT.is_file() and OUT.read_text(encoding="utf-8") != render_js():
        problems.append("dcc-site/data/teach.js is not the plan (run --apply)")
    if not OUT.is_file() and not pending:
        problems.append("dcc-site/data/teach.js is missing (run --apply)")
    for p in problems:
        print("  " + p, file=sys.stderr)
    if pending:
        for p in pending:
            print("  (pending) " + p, file=sys.stderr)
    print(f"  learn effectively: {stats['topics']} topics, {stats['words']} words "
          f"(mean {round(stats['words'] / max(1, stats['topics']))}, "
          f"min {stats['min'] if stats['topics'] else 0} at {stats['shortest'] or '-'}, "
          f"max {stats['max']} at {stats['longest'] or '-'}), floor {MIN_WORDS}, "
          f"{stats['pending']} topic(s) still to write")
    if problems:
        print("  teach_notes: the plan or the page is not in shape", file=sys.stderr)
        return 1
    print("  teach_notes: OK")
    return 1 if (strict and pending) else 0


def cmd_report() -> int:
    problems, stats, pending = check_plan()
    doc = plan()
    topics = doc.get("topics", {})
    syllabus = {t["n"]: t for t in syllabus_topics()}
    for unit in range(1, 10):
        ks = [k for k in topics if int(k.split(".")[0]) == unit]
        if not ks:
            missing = [t["n"] for t in syllabus.values() if t["unit"] == unit]
            print(f"\nUnit {unit} - nothing written yet ({len(missing)} topics pending)")
            continue
        print(f"\nUnit {unit} - {len(ks)} topics, {stats['per_unit'].get(unit, 0)} words")
        for k in ks:
            c = topics[k]
            w = words_of(c.get("html", ""))
            flag = "" if w >= MIN_WORDS else "  UNDER FLOOR"
            parts = ", ".join(plain(h) for h in HEAD.findall(str(c.get("html", ""))))
            print(f"  {k:<5} {w:>5}w  {c.get('t', '')[:44]:<46} {parts}{flag}")
    print(f"\n{stats['topics']} topics, {stats['words']} words, mean "
          f"{round(stats['words'] / max(1, stats['topics']))}, floor {MIN_WORDS}, "
          f"{stats['pending']} pending")
    for p in problems:
        print("  " + p, file=sys.stderr)
    for p in pending:
        print("  (pending) " + p, file=sys.stderr)
    return 0


def cmd_apply() -> int:
    problems, _, pending = check_plan()
    if problems:
        for p in problems:
            print("  " + p, file=sys.stderr)
        print("  refusing to apply: the plan fails the guard (run --check)", file=sys.stderr)
        return 1
    OUT.write_text(render_js(), encoding="utf-8", newline="")
    print(f"  wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size} bytes), "
          f"{len(plan().get('topics', {}))} topic(s) on the page")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--report", action="store_true", help="every topic, its words, its parts")
    g.add_argument("--check", action="store_true", help="the guard; exit 1 on a problem")
    g.add_argument("--apply", action="store_true", help="regenerate dcc-site/data/teach.js")
    ap.add_argument("--strict", action="store_true", help="with --check: an unwritten topic fails")
    a = ap.parse_args()
    if a.report:
        return cmd_report()
    if a.check:
        return cmd_check(strict=a.strict)
    return cmd_apply()


if __name__ == "__main__":
    raise SystemExit(main())
