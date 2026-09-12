"""Shared logic for the tools/ scripts — one owner per concept.

Everything in here used to be copied into two or three scripts. Each function
below is the single implementation; the scripts import it. If you change how
questions are normalised, how similarity is scored, how the chapter files are
read, or how a check reports, change it here and every tool moves with it.

Two normalisations live side by side because they answer different questions:

  normalise_question()  "are these the same question?"  -> stopword-free tokens,
                        which is what similarity() scores.
  normalise_text()      "does this text contain this marker?" -> punctuation
                        stripped, words kept. Used by the coverage check, where
                        dropping stopwords would hide a marker like "state".

They are deliberately not one function; merging them silently broke the
syllabus-coverage check once already.

    from sitelib import load_chapters, similarity, Reporter
"""

from __future__ import annotations

import difflib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

STOPWORDS = {"a", "an", "the", "of", "and", "with", "for", "to", "in", "on",
             "is", "are", "what", "which", "explain", "define", "write",
             "down", "by", "using", "use", "how", "why", "briefly", "short",
             "note", "give", "list", "mention", "discuss", "describe"}


def use_utf8_stdout() -> None:
    """Print em-dashes and curly quotes on a cp1252 Windows console."""
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")


# --------------------------------------------------------------------- chapters

def load_chapters() -> dict[int, dict]:
    """The eight chapter files, as parsed by node.

    `node tools/dump_chapters.js` is the only thing that can evaluate them:
    ch*.js assign to window.CHAPTERS, and a template literal is not JSON.
    A node failure is fatal — every caller needs real chapter data or nothing.
    """
    dumper = ROOT / "tools" / "dump_chapters.js"
    proc = subprocess.run(["node", str(dumper)], capture_output=True, cwd=str(ROOT))
    if proc.returncode != 0:
        print(proc.stderr.decode("utf-8", "replace"))
        sys.exit("node failed to load the chapter files")
    payload = json.loads(proc.stdout.decode("utf-8", "replace"))
    return {int(k): v for k, v in payload.items()}


# ------------------------------------------------------------------ comparison

def normalise_question(text: str) -> str:
    """Stopword-free token string — the input to every similarity score."""
    words = re.findall(r"[a-z0-9]+", (text or "").lower())
    keep = [w for w in words if w not in STOPWORDS]
    return " ".join(keep or words)


def normalise_text(text: str) -> str:
    """Punctuation-stripped, lower-cased text with every word kept."""
    return re.sub(r"[^a-z0-9]+", " ", (text or "").lower()).strip()


def norm_key(q: str) -> str:
    """Compare two question texts ignoring case and punctuation."""
    return re.sub(r"[^a-z0-9]+", " ", (q or "").lower()).strip()


def numeric_tokens(text: str) -> set[str]:
    return set(re.findall(r"\d+(?:\.\d+)?", text or ""))


def strict_similarity(a: str, b: str) -> float:
    """Sequence ratio + token overlap, with no containment shortcut.

    Used for bank-against-bank dedupe, where a short question like "Short Note:
    GPSS" must NOT be treated as the same question as every GPSS question.
    """
    na, nb = normalise_question(a), normalise_question(b)
    if not na or not nb:
        return 0.0
    ratio = difflib.SequenceMatcher(None, na, nb).ratio()
    ta, tb = set(na.split()), set(nb.split())
    jaccard = len(ta & tb) / len(ta | tb) if (ta | tb) else 0.0
    return max(ratio, jaccard)


def similarity(a: str, b: str) -> float:
    """Bank-against-site matching: adds a bounded containment rule.

    "Markov Chain (Short Note)" is the same question as "Markov Chain (Short
    Note)", but "Chi-Square Test" is not the same as "Use the Chi-Square test to
    test 50 random numbers". Containment therefore only counts when the shorter
    text still has at least three significant words and is more than half the
    length of the longer one.
    """
    score = strict_similarity(a, b)
    na, nb = normalise_question(a), normalise_question(b)
    shorter, longer = sorted((na, nb), key=len)
    if shorter and shorter in longer and len(shorter.split()) >= 3 \
            and len(shorter) / max(len(longer), 1) >= 0.5:
        score = max(score, 0.85)
    return score


# --------------------------------------------------------------------- reporting

class Reporter:
    """One line per re-derived figure, and a non-zero exit if any disagree.

    The three check_*.py scripts each had their own copy of this; the only
    difference was label width.
    """

    def __init__(self, width: int = 58) -> None:
        self.width = width
        self.problems: list[str] = []

    def check(self, label: str, got, want, tol: float = 5e-4) -> None:
        ok = abs(got - want) <= tol
        if not ok:
            self.problems.append(f"{label}: got {got!r}, expected {want!r}")
        print(f"  [{'ok' if ok else 'XX'}] {label:<{self.width}} {got}")

    def note(self, label: str, ok: bool) -> None:
        """For an assertion that is a boolean, not a number."""
        if not ok:
            self.problems.append(label)
        print(f"  [{'ok' if ok else 'XX'}] {label}")

    def finish(self, ok_message: str) -> int:
        print()
        if self.problems:
            print(f"{len(self.problems)} MISMATCH(ES):")
            for p in self.problems:
                print("  -", p)
            return 1
        print(ok_message)
        return 0
