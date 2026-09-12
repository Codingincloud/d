#!/usr/bin/env python3
"""Find, for every past question on the site, which exam papers actually asked it.

Why this tool exists
--------------------
A site question carries a single `year` and a bare `repeats` count, so the UI can
say "asked 3x" but cannot say *which* three papers, and the other papers' exact
wordings were lost. The bank's Source column only lists several papers for 2 of
148 rows, so the only place the missing papers are recorded is the papers
themselves.

`_source/past_questions.ocr.txt` is the OCR of the user's bundle of old question
papers. The papers are printed (unlike the handwritten notes), so the OCR is
usable. This tool:

  1. splits the OCR text into papers and collapses duplicate scans,
  2. splits each paper into atomic question units ("1(a) ...", "(b) ..."),
  3. matches every site question against every unit with the same similarity
     function `merge_past.py` uses, keeping the best unit per paper,
  4. writes data/occurrences.json plus a human-reviewable report.

Nothing is invented: an occurrence only exists if it was found in a paper. Where
the found count disagrees with the recorded `repeats`, both are reported and the
larger is kept — the count is never lowered.

Usage (from the project root):

    python tools/extract_occurrences.py                 # report + write JSON
    python tools/extract_occurrences.py --threshold 0.8
    python tools/extract_occurrences.py --only 4        # one chapter
    python tools/extract_occurrences.py --papers        # just show the papers
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))

from sitelib import (load_chapters as load_site_chapters,  # noqa: E402
                     normalise_question as normalise, similarity,
                     use_utf8_stdout)

OCR = ROOT / "_source" / "past_questions.ocr.txt"
OUT = ROOT / "data" / "occurrences.json"
REPORT = ROOT / "data" / "occurrence_report.txt"

use_utf8_stdout()

# Every paper prints "Time: 03:00 hrs." exactly once, whereas the university
# banner is occasionally mangled by the OCR (e.g. "P_U_RB_AN_C_HA_L_U_N..."),
# which is how the 2010 Final paper went missing and its questions were being
# attributed to 2010 Chance.
PAPER_ANCHOR = re.compile(r"(?m)^.*Time:\s*0?3[:.]\s*00.*$")
FALLBACK_ANCHOR = re.compile(r"(?m)^.*(?:P?URBANCHAL|PU RBANCHAL).*UNIVERSITY.*$")
YEAR_RE = re.compile(r"\b(20\d\d)\b")
TERM_RE = re.compile(r"Semester\s*/\s*(Final|Chance|Chance\s*1)", re.I)
# "1(a) …", "1. …", "2) …" start a question; "(b) …" continues one. The OCR
# often joins a part onto the end of the previous line, so a part marker is
# also split mid-line.
UNIT_RE = re.compile(
    r"(?m)^[ \t]{0,12}(?:(?P<num>\d{1,2})[ \t]*(?:[.)][ \t]*|\((?P<ppart>[a-z])\)[ \t]*)"
    r"|\((?P<lpart>[a-z])\)[ \t]*)"
    r"|[ \t]\((?P<ipart>[a-z])\)[ \t]"
)
# a unit has to be prose, not a table fragment or a page header: at least
# three words of four letters or more, anywhere in the span
WORD_RE = re.compile(r"[A-Za-z]{4,}")
MARKS_RE = re.compile(r"(\d{1,2}(?:\s*\+\s*\d{1,2}){0,3})\s*\.?\s*$")
MAX_Q = 300  # the OCR sometimes joins several questions into one span

JUNK_RE = re.compile(
    r"(CamScanner|Contd\.*\s*\.{0,3}|^\s*\(\d\)\s*$|Downloaded from|Scanned with)",
    re.I | re.M,
)


def clean(text: str) -> str:
    """Whitespace-normalise an OCR span and drop scanner artefacts."""
    text = text.replace("\f", " ")
    text = JUNK_RE.sub(" ", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\s*\n\s*", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip(" .,;:|_-\u00ad")


def read_ocr() -> str:
    raw = OCR.read_bytes()
    for enc in ("utf-8", "cp1252", "latin-1"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", "replace")


def split_papers(text: str) -> list[dict]:
    anchors = [m.start() for m in PAPER_ANCHOR.finditer(text)]
    if len(anchors) < 8:
        anchors = [m.start() for m in FALLBACK_ANCHOR.finditer(text)]

    papers = []
    for i, start in enumerate(anchors):
        end = anchors[i + 1] if i + 1 < len(anchors) else len(text)
        body = text[start:end]
        # the year and the term are printed in the header ABOVE the Time line
        head = text[max(0, start - 400): start + 120]
        years = list(YEAR_RE.finditer(head))
        term = TERM_RE.search(head)
        papers.append({
            "block": i,
            "year": years[-1].group(1) if years else "?",
            "term": (term.group(1).strip().title().replace("1", "").strip()
                     if term else "Final"),
            "body": body,
        })
    for p in papers:
        p["id"] = (f"{p['year']} {p['term'][0].upper()}" if p["year"] != "?"
                    else f"unidentified block {p['block']}")
    return papers


def collapse_duplicates(papers: list[dict]) -> tuple[list[dict], list[dict]]:
    """Two scans of the same paper are ONE paper (never inflate a repeat count).

    Papers with two different known years are never collapsed, however similar
    their shared boilerplate reads.
    """
    kept: list[dict] = []
    collapsed: list[dict] = []
    for p in papers:
        body_n = normalise(p["body"])
        dupe = None
        for k in kept:
            if p["year"] != "?" and k["year"] != "?" and p["year"] != k["year"]:
                continue
            if similarity(body_n, normalise(k["body"])) >= 0.6:
                dupe = k
                break
        if dupe:
            dupe.setdefault("dup_blocks", []).append(p["block"])
            collapsed.append({"id": p["id"], "block": p["block"], "of_block": dupe["block"],
                              "of_id": dupe["id"]})
        else:
            kept.append(p)
    return kept, collapsed


def parse_units(paper: dict) -> list[dict]:
    """Atomic question units, e.g. 'Explain the phases and steps in simulation study. 5'."""
    body = paper["body"]
    marks_pos = [m.start() for m in re.finditer(r"(?m)^\s*Answer EIGHT questions|^\s*Time:\s*03", body)]
    start = marks_pos[-1] if marks_pos else 0
    body = body[start:]

    hits = list(UNIT_RE.finditer(body))
    units = []
    for i, m in enumerate(hits):
        end = hits[i + 1].start() if i + 1 < len(hits) else len(body)
        raw = body[m.end():end]
        text = clean(raw)
        if len(text) < 24 or len(WORD_RE.findall(text)) < 3:
            continue  # a bare marker, a table fragment or a page number
        num = m.group("num")
        part = m.group("ppart") or m.group("lpart") or m.group("ipart")
        marks = ""
        mm = MARKS_RE.search(text)
        if mm:
            marks = re.sub(r"\s+", "", mm.group(1))
            text = text[: mm.start()].strip(" .,;:-")
        if len(text) < 24:
            continue
        if len(text) > MAX_Q:
            cut = text[:MAX_Q]
            text = cut[: cut.rfind(" ")].rstrip(" .,;:-") + " …"
        units.append({
            "paper": paper["id"],
            "year": paper["year"],
            "num": num or "",
            "part": part or "",
            "marks": marks,
            "q": text,
        })
    return units


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--threshold", type=float, default=0.75,
                    help="similarity needed to call a paper unit a real occurrence")
    ap.add_argument("--only", type=int, help="restrict to one chapter")
    ap.add_argument("--papers", action="store_true", help="print the parsed papers and stop")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    if not OCR.exists():
        print(f"missing {OCR} - run pdftotext on the old-questions PDF first")
        return 1

    papers, collapsed = collapse_duplicates(split_papers(read_ocr()))
    for p in papers:
        p["units"] = parse_units(p)

    print(f"papers: {len(papers)} distinct  (duplicate scans collapsed: {len(collapsed)})")
    for p in papers:
        dup = ",".join(str(d) for d in p.get("dup_blocks", []))
        print(f"  {p['id']:9s} block {p['block']:2d}  {len(p['units']):3d} units"
              + (f"   (+ duplicate scan block {dup})" if dup else ""))
    if args.papers:
        return 0

    # A block whose year could not be read is never used to attribute an
    # occurrence: an occurrence has to name the paper it came from.
    usable = [p for p in papers if p["year"] != "?"]
    unusable = [p for p in papers if p["year"] == "?"]
    for p in unusable:
        print(f"  ! block {p['block']} has no readable year - its {len(p['units'])} "
              f"units are ignored for attribution")

    all_units = [u for p in usable for u in p["units"]]
    site = load_site_chapters()

    data: dict = {"threshold": args.threshold,
                  "papers": [{"id": p["id"], "year": p["year"], "term": p["term"],
                              "units": len(p["units"]),
                              "dup_blocks": p.get("dup_blocks", [])} for p in usable],
                  "blocks_without_readable_year": [
                      {"block": p["block"], "units": len(p["units"])} for p in unusable],
                  "duplicate_scans_collapsed": collapsed,
                  "chapters": {}}
    report: list[str] = []
    stats = {"questions": 0, "with_occ": 0, "occ_total": 0, "matched_claim": 0,
             "found_gt_claim": 0, "found_lt_claim": 0, "no_occ_but_repeats": 0}

    for n in range(1, 9):
        if args.only and n != args.only:
            continue
        entries = site[n].get("past") or []
        chapter_rows = []
        report.append(f"\n{'=' * 78}\nChapter {n}  —  {len(entries)} questions\n{'=' * 78}")
        for si, sq in enumerate(entries):
            claim = int(sq.get("repeats", 1) or 1)
            best: dict[str, tuple[float, dict]] = {}
            for u in all_units:
                score = similarity(sq.get("q", ""), u["q"])
                if score < args.threshold:
                    continue
                prev = best.get(u["paper"])
                if prev is None or score > prev[0]:
                    best[u["paper"]] = (score, u)

            occ = []
            def paper_year(key_value):
                y = key_value[1][1]["year"]
                return int(y) if str(y).isdigit() else 0

            for paper_id, (score, u) in sorted(best.items(),
                                               key=lambda kv: -paper_year(kv)):
                occ.append({"paper": paper_id, "year": u["year"], "marks": u["marks"],
                            "score": round(score, 3), "q": u["q"]})

            stats["questions"] += 1
            stats["occ_total"] += len(occ)
            if occ:
                stats["with_occ"] += 1
            if len(occ) == claim:
                stats["matched_claim"] += 1
            elif len(occ) > claim:
                stats["found_gt_claim"] += 1
            elif claim >= 2:
                stats["found_lt_claim"] += 1
                if not occ:
                    stats["no_occ_but_repeats"] += 1

            # Keyed by the question TEXT, never by position: merge_past.py
            # re-sorts the arrays, so an index would drift onto another question.
            chapter_rows.append({
                "site_index": si, "q": sq.get("q", ""), "year": sq.get("year", ""),
                "marks": str(sq.get("marks", "")), "repeats_claim": claim,
                "occ": occ, "occ_found": len(occ),
            })

            if not args.quiet:
                flag = "" if len(occ) == claim else ("  <-- found MORE" if len(occ) > claim
                                                     else "  <-- found FEWER")
                report.append(f"\n[ch{n}#{si}] x{claim} claimed{flag}   {sq.get('q','')[:96]}")
                for o in occ:
                    report.append(f"      {o['paper']:9s} {o['score']:.2f}  "
                                  f"{o['marks']:>4s}  {o['q'][:88]}")

        data["chapters"][str(n)] = chapter_rows

    data["stats"] = stats
    OUT.write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")
    REPORT.write_text("\n".join(report) + "\n", encoding="utf-8")

    print(f"\nquestions: {stats['questions']}   with at least one occurrence: {stats['with_occ']}")
    print(f"occurrences found: {stats['occ_total']}")
    print(f"  count agrees with the recorded repeats : {stats['matched_claim']}")
    print(f"  found MORE than recorded               : {stats['found_gt_claim']}")
    print(f"  found FEWER (repeat claimed, none/new)  : {stats['found_lt_claim']}")
    print(f"  repeated but no occurrence found        : {stats['no_occ_but_repeats']}")
    print(f"\nwritten: {OUT.relative_to(ROOT)}")
    print(f"report : {REPORT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
