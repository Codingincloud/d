#!/usr/bin/env python3
"""Validate the Simulation & Modeling study portal.

Checks structure, question data, HTML balance, syllabus coverage, and reports
how many past questions still have no model answer.

Usage (from the project root, i.e. the folder holding index.html):

    python tools/validate_site.py            # warnings for coverage gaps
    python tools/validate_site.py --strict   # coverage gaps become errors

Exit code 0 = no errors.
"""
from __future__ import annotations

import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from sitelib import (ROOT, load_chapters,  # noqa: E402
                     normalise_text as normalise, use_utf8_stdout)

use_utf8_stdout()

# ---------------------------------------------------------------- syllabus map
# Sub-topics taken from the BCE7026 syllabus / past-question-bank table of
# contents. Each chapter must mention every listed marker somewhere in its notes.
SYLLABUS: dict[int, list[str]] = {
    1: ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9", "1.10",
        "1.11", "1.12", "Real-Time", "Advantages", "Limitations", "Application"],
    2: ["2.1", "2.2", "2.3", "Monte Carlo", "Box-Muller", "Central Limit",
        "Stochastic"],
    3: ["3.1", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "Pure Pursuit",
        "Analog", "Hybrid", "Feedback", "Differential"],
    4: ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "Kendall", "Markov"],
    5: ["5.1", "5.2", "5.3", "5.4", "Verification", "Validation", "Calibration",
        "Face Validity", "Sensitivity"],
    6: ["6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "6.9", "6.10", "6.11",
        "Linear Congruential", "Mid-Square", "Chi-Square", "Auto-Correlation",
        "Poker", "Run Test", "Kolmogorov"],
    7: ["7.1", "7.2", "7.3", "7.4", "Replication", "Batch Means", "Warm-Up"],
    8: ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "GPSS", "SIMSCRIPT", "CSSL",
        "Discrete", "Distributed Lag"],
}

EXPECTED_MARKS_TOTAL = 60
EXPECTED_HOURS_TOTAL = 40
VOID_TAGS = {"br", "hr", "img", "input", "meta", "link", "col", "source"}

errors: list[str] = []
warnings: list[str] = []
coverage_gaps: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


class Balance(HTMLParser):
    """Counts opening vs closing tags to catch malformed note HTML."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.counts: dict[str, list[int]] = {}

    def handle_starttag(self, tag, attrs):
        if tag in VOID_TAGS:
            return
        self.counts.setdefault(tag, [0, 0])[0] += 1

    def handle_endtag(self, tag):
        if tag in VOID_TAGS:
            return
        self.counts.setdefault(tag, [0, 0])[1] += 1

    def imbalances(self) -> dict[str, tuple[int, int]]:
        return {t: (o, c) for t, (o, c) in self.counts.items() if o != c}


def check_html(cid: int, where: str, html: str) -> None:
    parser = Balance()
    parser.feed(html)
    for tag, (opens, closes) in sorted(parser.imbalances().items()):
        err(f"ch{cid} {where}: unbalanced <{tag}> — {opens} open vs {closes} closed")


def check_quiz(cid: int, quiz) -> None:
    seen: dict[str, int] = {}
    for i, q in enumerate(quiz, 1):
        label = f"ch{cid} quiz #{i}"
        if not isinstance(q, dict):
            err(f"{label}: not an object")
            continue
        text = (q.get("q") or "").strip()
        if not text:
            err(f"{label}: empty question text")
        else:
            key = normalise(text)
            if key in seen:
                err(f"{label}: duplicate of quiz #{seen[key]}")
            seen[key] = i
        options = q.get("options") or []
        if not isinstance(options, list) or len(options) < 2:
            err(f"{label}: needs at least 2 options")
        elif any(not str(o).strip() for o in options):
            err(f"{label}: has an empty option")
        answer = q.get("answer")
        if not isinstance(answer, int) or not (0 <= answer < len(options or [])):
            err(f"{label}: answer index {answer!r} out of range for "
                f"{len(options or [])} options")
        if not (q.get("explanation") or "").strip():
            err(f"{label}: missing explanation")


def check_past(cid: int, past) -> tuple[int, int]:
    seen: dict[str, int] = {}
    pending = 0
    for i, q in enumerate(past, 1):
        label = f"ch{cid} past #{i}"
        if not isinstance(q, dict):
            err(f"{label}: not an object")
            continue
        text = (q.get("q") or "").strip()
        if not text:
            err(f"{label}: empty question text")
        else:
            key = normalise(text)
            if key in seen:
                err(f"{label}: duplicate of past #{seen[key]}")
            seen[key] = i
        for field in ("year", "marks"):
            if not str(q.get(field) or "").strip():
                err(f"{label}: missing {field}")
        repeats = q.get("repeats")
        if not isinstance(repeats, int) or repeats < 1:
            err(f"{label}: repeats must be a positive integer, got {repeats!r}")
        answer = q.get("answer")
        if answer is None:
            pending += 1
            if q.get("status") != "pending":
                err(f"{label}: answer is null but status is not 'pending'")
        else:
            if not str(answer).strip():
                err(f"{label}: empty answer")
            else:
                check_html(cid, f"past #{i} answer", str(answer))
    return len(past), pending


def page_code() -> str:
    """index.html plus the page's own scripts — the code we write, wherever it is.

    The chapter meta array, the tab list and the app logic used to sit in an
    inline <script>; they live in app.js now. Checks that read them therefore
    read the page *and* what it loads, so moving code does not silently move it
    out of the checks' view. ch*.js and data/ are excluded: ch*.js is parsed by
    node in load_chapters(), data/analysis.js is generated.
    """
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    parts = [html]
    for src in re.findall(r"<script[^>]*\bsrc=[\"']([^\"']+)[\"']", html):
        if re.match(r"^(ch\d+\.js|data/)", src):
            continue
        path = ROOT / src
        if path.is_file():
            parts.append(path.read_text(encoding="utf-8"))
    return "\n".join(parts)


def check_index() -> None:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    code = page_code()
    # Each entry is {n, t, m, h} and used to also carry e, the emoji the
    # chapter was labelled with in the sidebar. That pictogram is gone - the
    # chapter number is the identifier a reader navigates by - so `e` is now
    # optional rather than required. It is still *allowed* so an old entry does
    # not silently stop matching; what the check actually cares about is that
    # all eight chapters are present, in order, with weights that still total
    # the syllabus. Those assertions are unchanged.
    meta = re.findall(
        r"\{n:(\d+),t:'([^']*)',m:(\d+),h:(\d+)(?:,e:'[^']*')?\}", code)
    if len(meta) != 8:
        err(f"index.html + its scripts: expected 8 chapter meta entries, "
            f"found {len(meta)}")
        return
    chapters = [int(n) for n, *_ in meta]
    if chapters != list(range(1, 9)):
        err(f"index.html: chapter order is {chapters}, expected 1..8")
    marks = sum(int(m) for _, _, m, _ in meta)
    hours = sum(int(h) for _, _, _, h in meta)
    if marks != EXPECTED_MARKS_TOTAL:
        err(f"index.html: chapter weights total {marks}, expected {EXPECTED_MARKS_TOTAL}")
    if hours != EXPECTED_HOURS_TOTAL:
        err(f"index.html: chapter hours total {hours}, expected {EXPECTED_HOURS_TOTAL}")

    # every chapter file must be loaded by the page
    for n in range(1, 9):
        if f'<script src="ch{n}.js"></script>' not in html:
            err(f"index.html: does not load ch{n}.js")

    check_page_scripts(html)


def node_check(path: Path, where: str) -> None:
    """`node --check` on one file, reported as a site error.

    A single stray apostrophe inside a string (an easy slip when the copy
    mentions "a chapter's answers") ships a page that renders the shell and then
    dies with no tabs, no exam and no visible error. `node --check` catches that
    class in milliseconds, and it does not care where the file lives - which is
    the point: the app code moved from an inline block to app.js and this check
    followed it without being told.
    """
    proc = subprocess.run(["node", "--check", str(path)], capture_output=True)
    if proc.returncode != 0:
        first = proc.stderr.decode("utf-8", "replace").strip().splitlines()
        err(f"{where}: does not parse: {first[0] if first else 'syntax error'}")


def check_page_scripts(html: str) -> None:
    """Syntax-check every script the page actually loads, wherever it lives.

    index.html owns the tag list; the code may live in it or in a file it
    points at. Resolve each `<script src>` against the project root and check
    that it exists, then parse it - a dangling src is as fatal as a broken one.
    """
    srcs = re.findall(r"<script[^>]*\bsrc=[\"']([^\"']+)[\"'][^>]*>", html)
    if not srcs:
        err("index.html: loads no script files")
    for src in srcs:
        path = ROOT / src
        if not path.is_file():
            err(f"index.html: loads {src}, which does not exist")
            continue
        node_check(path, f"index.html -> {src}")

    # Any inline script left behind is still parsed; ~none is expected now.
    import tempfile

    for i, body in enumerate(re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>",
                                        html, re.S)):
        if not body.strip():
            continue
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False,
                                         encoding="utf-8") as tmp:
            tmp.write(body)
            path = tmp.name
        try:
            node_check(Path(path), f"index.html: inline script {i}")
        finally:
            Path(path).unlink(missing_ok=True)


def check_coverage(cid: int, learn: str) -> None:
    for marker in SYLLABUS.get(cid, []):
        if marker.lower() not in learn.lower():
            coverage_gaps.append(f"ch{cid}: syllabus marker not found in notes: {marker}")


def main() -> int:
    strict = "--strict" in sys.argv
    chapters = load_chapters()

    for n in range(1, 9):
        ch = chapters.get(n)
        if not ch:
            err(f"ch{n}.js: window.CHAPTERS[{n}] is missing (file not loaded?)")
            continue

        learn = ch.get("learn")
        if not isinstance(learn, str) or len(learn.strip()) < 200:
            err(f"ch{n}.js: learn content missing or too short")
            learn = learn if isinstance(learn, str) else ""

        for field in ("quiz", "past"):
            if not isinstance(ch.get(field), list) or not ch[field]:
                err(f"ch{n}.js: {field} must be a non-empty array")

        check_html(n, "learn", learn)
        check_quiz(n, ch.get("quiz") or [])
        count, pending = check_past(n, ch.get("past") or [])
        check_coverage(n, learn)

        print(f"  ch{n}  notes {len(learn):6,d} B   h2 {learn.count('<h2>'):2d}   "
              f"quiz {len(ch.get('quiz') or []):2d}   past {count:2d}   "
              f"pending {pending:2d}")

    check_index()

    print()
    if coverage_gaps:
        print(f"Syllabus coverage: {len(coverage_gaps)} gap(s)")
        for g in coverage_gaps:
            print(f"  - {g}")
    else:
        print("Syllabus coverage: complete")

    if warnings:
        print(f"\n{len(warnings)} warning(s)")
        for w in warnings:
            print(f"  ! {w}")

    if errors:
        print(f"\n{len(errors)} error(s)")
        for e in errors:
            print(f"  x {e}")
        return 1

    if strict and coverage_gaps:
        print("\nFAILED (--strict): syllabus coverage gaps above")
        return 1

    print("\nAll structural checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
