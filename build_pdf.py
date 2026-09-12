#!/usr/bin/env python3
"""Build a printable PDF of the whole study portal (notes + question bank).

Replaces the old script, which hardcoded an absolute path and only handled
Chapters 1-4. This version reads the chapters through tools/dump_chapters.js, so
it always sees exactly what the site sees — including practice questions that
have no model answer yet.

Usage (from this folder):

    python build_pdf.py                       # all 8 chapters -> Simulation_Notes.pdf
    python build_pdf.py --out notes.pdf
    python build_pdf.py --chapters 5,6,7      # just those chapters
    python build_pdf.py --no-practice         # omit questions without answers
    python build_pdf.py --answers-only        # question bank + model answers only

Requires: xhtml2pdf (pip install xhtml2pdf) and node on PATH.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
WEIGHTS = {1: 8, 2: 6, 3: 6, 4: 6, 5: 6, 6: 12, 7: 6, 8: 10}

for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, "reconfigure"):
        stream.reconfigure(encoding="utf-8", errors="replace")

STYLE = """
@page { size: A4; margin: 1.4cm 1.2cm; }
body { font-family: Helvetica, Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #1e293b; }
h1 { color: #2563eb; text-align: center; font-size: 20pt; margin-bottom: 4px; }
h2 { color: #2563eb; font-size: 14pt; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 4px;
     margin-top: 22px; page-break-before: always; }
h2.first { page-break-before: auto; }
h3 { color: #059669; font-size: 11.5pt; margin-top: 14px; margin-bottom: 4px; }
h4 { color: #d97706; font-size: 10.5pt; margin: 10px 0 4px; }
p { margin: 5px 0; }
ul, ol { margin: 5px 0 8px 18px; }
li { margin-bottom: 2px; }
table { width: 100%; border-collapse: collapse; margin: 8px 0; }
th, td { border: 1px solid #cbd5e1; padding: 5px 7px; text-align: left; font-size: 9.5pt; }
th { background: #f1f5f9; }
.concept-box, .important, .tip, .example-box, .formula-box {
  border-left: 3px solid #2563eb; background: #f8fafc; padding: 8px 10px; margin: 8px 0; }
.important { border-left-color: #dc2626; background: #fef2f2; }
.tip { border-left-color: #059669; background: #ecfdf5; }
.example-box { border-left-color: #64748b; }
.formula-box { border-left-color: #2563eb; border: 1px dashed #93c5fd; font-family: monospace; }
.cover { text-align: center; margin-top: 26%; page-break-after: always; }
.cover p { font-size: 12pt; color: #475569; }
.cover .meta { font-size: 10pt; color: #94a3b8; margin-top: 18px; }
.toc { page-break-after: always; }
.toc td { border: none; padding: 4px 6px; font-size: 10.5pt; }
.pq { border: 1px solid #cbd5e1; border-radius: 3px; padding: 9px 11px; margin: 9px 0;
      page-break-inside: avoid; background: #fbfdff; }
.pq .head { font-size: 9pt; color: #2563eb; font-weight: bold; margin-bottom: 3px; }
.pq .q { font-weight: bold; margin-bottom: 5px; }
.pq .a { border-top: 1px solid #e2e8f0; padding-top: 6px; }
.practice { border-left: 3px solid #d97706; background: #fffbeb; }
.practice .q { font-weight: normal; }
.sec-intro { background: #eff6ff; border: 1px solid #bfdbfe; padding: 8px 10px; margin: 8px 0; }
"""


def load_chapters() -> dict:
    dumper = ROOT / "tools" / "dump_chapters.js"
    if not dumper.exists():
        sys.exit(f"missing {dumper}")
    proc = subprocess.run(["node", str(dumper)], capture_output=True, cwd=str(ROOT))
    if proc.returncode != 0:
        sys.exit(proc.stderr.decode("utf-8", "replace"))
    return {int(k): v for k, v in json.loads(proc.stdout.decode("utf-8")).items()}


def counts(chapters: dict, which: list[int]) -> tuple[int, int, int]:
    total = answered = 0
    for n in which:
        for q in (chapters[n].get("past") or []):
            total += 1
            answered += 1 if q.get("answer") else 0
    return total, answered, total - answered


def build_html(chapters: dict, which: list[int], include_notes: bool,
               include_practice: bool) -> str:
    total, answered, pending = counts(chapters, which)
    parts = [f"<html><head><style>{STYLE}</style></head><body>"]

    parts.append(
        "<div class='cover'>"
        "<h1>Simulation &amp; Modeling</h1>"
        "<p><strong>BCE7026</strong> — Semester VII, B.E. Computer Engineering</p>"
        "<p>Purbanchal University · Full Marks 60 · Pass Marks 24 · 3:00 hrs</p>"
        f"<div class='meta'>Complete notes, quiz answers and the past-question bank<br>"
        f"{len(which)} chapters · {total} past questions ({answered} with model answers, "
        f"{pending} practice-only)<br>Theory weights: "
        + " + ".join(str(WEIGHTS[n]) for n in which)
        + " marks</div></div>")

    parts.append("<div class='toc'><h1>Contents</h1><table>")
    for n in which:
        title = TITLES.get(n, chapters[n].get("title", ""))
        nq = len(chapters[n].get("past") or [])
        parts.append(f"<tr><td><strong>{n}.</strong> {title}</td>"
                     f"<td style='text-align:right'>{WEIGHTS[n]} marks</td>"
                     f"<td style='text-align:right'>{nq} past questions</td></tr>")
    parts.append("</table>"
                 "<div class='sec-intro'>Model answers are written for the questions that "
                 "have appeared in real papers two or more times, and for every question in "
                 "Chapters 5 and 6. Remaining questions are printed as practice questions so "
                 "nothing is missing from the list.</div></div>")

    for n in which:
        ch = chapters[n]
        title = TITLES.get(n, ch.get("title", ""))
        parts.append(f"<h2>Chapter {n} — {title} "
                     f"<span style='font-size:10pt;color:#94a3b8'>({WEIGHTS[n]} marks)</span></h2>")
        if include_notes:
            parts.append(ch.get("learn") or "")

        past = ch.get("past") or []
        if past:
            shown = [q for q in past if q.get("answer") or include_practice]
            parts.append(f"<h3>Past questions ({len(shown)} of {len(past)})</h3>")
            for q in shown:
                rep = q.get("repeats") or 1
                badge = f" · repeated {rep}x" if rep >= 2 else ""
                cls = "pq" if q.get("answer") else "pq practice"
                parts.append(
                    f"<div class='{cls}'>"
                    f"<div class='head'>{q.get('year','')} · {q.get('marks','')} marks{badge}</div>"
                    f"<div class='q'>{q.get('q','')}</div>")
                if q.get("answer"):
                    parts.append(f"<div class='a'>{q['answer']}</div>")
                else:
                    parts.append("<div class='a'><em>Practice question — model answer not "
                                 "written yet. Attempt it from the chapter notes.</em></div>")
                parts.append("</div>")

    parts.append("</body></html>")
    return "\n".join(parts)


TITLES = {
    1: "Concept of Simulation",
    2: "Monte Carlo Method",
    3: "Simulation of Continuous Systems",
    4: "Queuing System",
    5: "Verification &amp; Validation",
    6: "Random Number Generation",
    7: "Analysis of Simulation Output",
    8: "Simulation Language",
}


def main() -> int:
    ap = argparse.ArgumentParser(description="Build the printable PDF of the study portal.")
    ap.add_argument("--out", default="Simulation_Notes.pdf", help="output PDF path")
    ap.add_argument("--chapters", default="1,2,3,4,5,6,7,8",
                    help="comma-separated chapter numbers")
    ap.add_argument("--no-notes", action="store_true", help="omit the notes, print questions only")
    ap.add_argument("--no-practice", action="store_true",
                    help="omit questions that have no model answer")
    ap.add_argument("--answers-only", action="store_true",
                    help="shorthand for --no-notes")
    args = ap.parse_args()

    try:
        from xhtml2pdf import pisa
    except ImportError:
        sys.exit("xhtml2pdf is not installed — run: pip install xhtml2pdf")

    chapters = load_chapters()
    which = [int(x) for x in args.chapters.split(",") if x.strip().isdigit()]
    which = [n for n in which if n in chapters and chapters[n]]
    if not which:
        sys.exit("no valid chapters selected")

    html = build_html(chapters, which,
                      include_notes=not (args.no_notes or args.answers_only),
                      include_practice=not args.no_practice)

    (ROOT / "temp_pdf.html").write_text(html, encoding="utf-8")

    out = Path(args.out)
    if not out.is_absolute():
        out = ROOT / out
    with open(out, "wb") as fh:
        status = pisa.CreatePDF(html, dest=fh)

    total, answered, pending = counts(chapters, which)
    if status.err:
        print("PDF generation reported errors — see temp_pdf.html")
        return 1
    size_kb = out.stat().st_size / 1024
    print(f"chapters: {', '.join(str(n) for n in which)}")
    print(f"past questions: {total} ({answered} answered, {pending} practice-only)")
    print(f"written: {out} ({size_kb:.0f} KB)")
    print(f"debug html: {ROOT / 'temp_pdf.html'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
