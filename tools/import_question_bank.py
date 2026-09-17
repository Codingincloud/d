#!/usr/bin/env python3
"""Parse _reference/Simulation_Modeling_Question_Bank.html into data/question_bank.json.

The bank holds every past question from 2010-2025 with year, marks and repeat
counts but no answers, plus a frequency analysis and an exam-strategy section.
This script extracts all of it so the site can be rebuilt from data instead of
hand-copied text.

Run from the project root:  python tools/import_question_bank.py
"""
from __future__ import annotations

import json
import re
import sys
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "_reference" / "Simulation_Modeling_Question_Bank.html"
OUT = ROOT / "data" / "question_bank.json"
ANALYSIS_JS = ROOT / "data" / "analysis.js"

for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, "reconfigure"):
        stream.reconfigure(encoding="utf-8", errors="replace")

# Emoji, dingbats and the symbols-and-arrows block. The class used to stop at
# U+27BF, which left U+2B00-U+2BFF uncovered - and the source bank's own
# importance marker, U+2B50 (a star), lives there. So "CHAPTER 6: Random Number
# <star> MOST IMPORTANT" was the one heading that kept its emoji all the way to
# the Analysis tab. U+2B00-U+2BFF is entirely emoji-presentation characters, so
# nothing legitimate is caught by widening the class; arrows below it (U+2190-
# U+21FF) are deliberately NOT included, since the notes use them as notation.
EMOJI = re.compile("[\U0001F300-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF\uFE0F]")
WS = re.compile(r"\s+")


def clean(fragment: str) -> str:
    """Strip tags/entities and the 🔥 importance markers from an HTML fragment."""
    text = re.sub(r"<br\s*/?>", ", ", fragment or "")
    text = re.sub(r"<[^>]+>", "", text)
    text = unescape(text)
    text = EMOJI.sub("", text)
    text = text.replace("\u00a0", " ").replace("\u2019", "'")
    return WS.sub(" ", text).strip(" ,;.")


def chapter_weight(section: str, chapter: int) -> int | None:
    m = re.search(r"Weightage:\s*(\d+)\s*Marks", section)
    return int(m.group(1)) if m else None


def parse() -> dict:
    html = SOURCE.read_text(encoding="utf-8", errors="ignore")

    parts = re.split(r"<h2>\s*CHAPTER\s+(\d+)\s*:\s*([^<]*)</h2>", html)
    chapters: dict[str, dict] = {}
    weights: dict[int, int | None] = {}

    # the table of contents lists the weight for every chapter
    toc = html[: html.find("CHAPTER 1:")]
    for m in re.finditer(r"Chapter\s+(\d+):\s*([^<]*?)<span[^>]*>Weightage:\s*(\d+)\s*Marks",
                         toc):
        weights[int(m.group(1))] = int(m.group(3))

    for i in range(1, len(parts), 3):
        num = int(parts[i])
        title = clean(parts[i + 1])
        body = parts[i + 2].split("<h2>")[0]  # stop at the next section

        questions = []
        current_sub = ""
        for chunk in re.finditer(
                r'<div class="sub-header">(.*?)</div>|<tr>(.*?)</tr>', body, re.S):
            sub, row = chunk.group(1), chunk.group(2)
            if sub is not None:
                current_sub = clean(sub)
                continue
            if "q-text" not in row:
                continue  # header row
            def cell(cls: str) -> str:
                m = re.search(rf'<td class="{cls}">(.*?)</td>', row, re.S)
                return clean(m.group(1)) if m else ""

            number = cell("q-num")
            if not number.isdigit():
                continue
            # The bank marks repeats as <span class="repeat-high">3 🔁</span>.
            # The old pattern required the digit to be followed immediately by
            # "<", so it only ever matched the plain "1" cells and every
            # question that actually repeats was imported with repeats=1.
            rep = re.search(r'class="repeat-[a-z]+">\s*(\d+)', row)
            questions.append({
                "num": int(number),
                "sub": current_sub,
                "year": cell("q-source"),
                "marks": cell("q-marks"),
                "repeats": int(rep.group(1)) if rep else 1,
                "q": cell("q-text"),
            })

        # the bank restarts row numbers inside every sub-section, so give each
        # question a stable chapter-scoped id ("6-07") to key answers against
        for idx, q in enumerate(questions, 1):
            q["id"] = f"{num}-{idx:02d}"

        chapters[str(num)] = {
            "title": title,
            "weight": weights.get(num),
            "questions": questions,
        }

    # ---------------------------------------------------- frequency + strategy
    tail = html[html.find("OVERALL FREQUENCY"):]

    topics = []
    for row in re.finditer(r"<tr[^>]*>(.*?)</tr>", tail, re.S):
        cells = [clean(c) for c in re.findall(r"<td[^>]*>(.*?)</td>", row.group(1), re.S)]
        if len(cells) >= 4 and cells[0].isdigit():
            topics.append({"rank": int(cells[0]), "topic": cells[1],
                           "chapter": cells[2], "times": cells[3]})

    strategy = []
    start = tail.find('<div class="strategy-section')
    strategy_html = tail[start:] if start >= 0 else ""
    blocks = re.split(r"<h4[^>]*>(.*?)</h4>", strategy_html, flags=re.S)
    for i in range(1, len(blocks), 2):
        heading = clean(blocks[i])
        body_html = blocks[i + 1]
        items = [clean(li) for li in re.findall(r"<li>(.*?)</li>", body_html, re.S)]
        if heading and items:
            strategy.append({"heading": heading, "items": items})

    # year distribution across the whole bank
    years: dict[str, int] = {}
    for ch in chapters.values():
        for q in ch["questions"]:
            for y in re.findall(r"20\d\d", q["year"]):
                years[y] = years.get(y, 0) + 1

    # sources can list several papers separated by commas ("2015 F, 2011 F")
    paper_set: set[str] = set()
    for ch in chapters.values():
        for q in ch["questions"]:
            paper_set.update(f"{y} {s}" for y, s in
                             re.findall(r"(20\d\d)\s*([FCM])\b", q["year"]))
    papers = sorted(paper_set)
    total = sum(len(ch["questions"]) for ch in chapters.values())

    return {
        "source": SOURCE.name,
        "total_questions": total,
        "papers": papers,
        "year_distribution": dict(sorted(years.items())),
        "topics": topics,
        "strategy": strategy,
        "chapters": chapters,
    }


def write_analysis_js(data: dict) -> None:
    """Emit the same analysis data as a script tag payload.

    The site is opened from file://, where fetch() of a .json file is blocked,
    so the Analysis tab reads window.ANALYSIS from a plain script instead.
    """
    payload = {
        "total_questions": data["total_questions"],
        "papers": data["papers"],
        "year_distribution": data["year_distribution"],
        "topics": data["topics"],
        "strategy": data["strategy"],
        "chapters": {
            num: {"title": ch["title"], "weight": ch["weight"],
                  "questions": len(ch["questions"])}
            for num, ch in data["chapters"].items()
        },
    }
    body = json.dumps(payload, indent=1, ensure_ascii=False)
    ANALYSIS_JS.write_text(
        "// Generated by tools/import_question_bank.py — do not edit by hand.\n"
        f"window.ANALYSIS = {body};\n", encoding="utf-8")


def main() -> int:
    if not SOURCE.exists():
        sys.exit(f"missing {SOURCE}")
    data = parse()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")
    write_analysis_js(data)

    print(f"parsed {data['total_questions']} questions from {SOURCE.name}")
    for num in sorted(data["chapters"], key=int):
        ch = data["chapters"][num]
        print(f"  ch{num}: {len(ch['questions']):3d} questions  "
              f"syllabus weight {ch['weight']}  — {ch['title']}")
    print(f"  topics: {len(data['topics'])}   strategy blocks: {len(data['strategy'])}")
    print(f"  papers: {', '.join(data['papers'])}")
    print(f"written to {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
