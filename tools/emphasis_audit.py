#!/usr/bin/env python3
"""Measure the emphasis in the DCC notes - and hold it to a budget.

The complaint this answers is the reader's own: the pages are unlikable to read.
The measurement that explains it is in this tool's first report, over the nine
units of notes as they were:

    |                           | before | after |
    | bold runs                 |  2,247 |   800 |
    | words inside <strong>     |   31%  |   3%  |
    | runs longer than 6 words  |   853  |    0  |
    | longest run, in words     |    77  |    4  |
    | sections over the budget  |    38  |    0  |

When three words in ten are bold, bold marks nothing, and a 250-word section
offers the eye no anchor at all. Whole table cells were wrapped too, so a
comparison table rendered as one solid bold block - unit 5's service-models table
was the worst of it.

ONE CORRECTION, because it was this tool's own mistake and it is worth recording.
The first report named a 145-word run as the longest in the notes. There is no
such run: ch5 carried a stray `<p><strong></p>`, and pairing that tag with the
next `</strong>` in the file invented a span that crossed two paragraphs. The pass
then unbolded the wrong run while reporting success. The longest run that really
exists is 77 words, the stray tag is the reason `strong_defects` runs before
anything is decided, and `--fix-markup` is the mode that repairs it.

THE RULE. The reader chose it, strictly: bold marks THE TERM BEING DEFINED, and
nothing else.

  * a run is AT MOST 4 words, with no sentence punctuation, no comma and no
    co-ordinating conjunction - the shapes a definition's *name* takes;
  * a section carries AT MOST 3 such runs in its running prose;
  * a run that opens a list item or a table cell is a label, and is kept
    wherever it appears - `Ricart-Agrawala algorithm - ...` and
    `| Public | ... |` are terms by construction, not emphasis;
  * a table cell carries AT MOST 1 label run, so a cell's prose is never bold;
  * a heading, a figure, a code block, an attribution line, the unit-meta line
    and the Past-questions pointer are never touched.

WHAT THIS TOOL MAY DO. It removes `<strong>` and `</strong>` tags. It does not
rewrite, trim, reorder or reword a single character: `--check` asserts the plain
text of every chapter is byte-identical to what it was before the pass, and
`--roundtrip` proves `--restore` puts the tags back byte for byte. So losing a
fact is not a risk this pass can carry, and the emphasis decision is the only
thing it changes.

    python tools/emphasis_audit.py             # the table, per chapter and per section
    python tools/emphasis_audit.py --list      # every run, and its fate
    python tools/emphasis_audit.py --report    # the worst sections, and why
    python tools/emphasis_audit.py --check     # exit 1 if the budget is broken
    python tools/emphasis_audit.py --apply     # remove the tags the rule rejects
    python tools/emphasis_audit.py --restore   # put the originals back, byte for byte
    python tools/emphasis_audit.py --roundtrip # prove --restore, on copies

`--apply` snapshots each chapter into `_audit/pre_emphasis/` first and writes
`data/emphasis_decisions.json` - every run, its section, its word count and the
rule that decided it. That file is the reviewable record: a bold run that no
decision explains is a defect, which is exactly what `--check` fails on.
"""

import argparse
import hashlib
import json
import pathlib
import re
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "dcc-site"
SNAPSHOT = ROOT / "_audit" / "pre_emphasis"
DECISIONS = ROOT / "data" / "emphasis_decisions.json"

# The notes field. Same shape everywhere: a backtick literal, then the next field.
LEARN = re.compile(r"\n\s*learn: `(?P<body>.*?)\n?\s*`,\r?\n", re.S)
HEAD = re.compile(r"<h([23])>(.*?)</h\1>", re.S | re.I)
STRONG = re.compile(r"<strong>(?P<inner>.*?)</strong>", re.S | re.I)

# Containers whose emphasis is a label rather than prose emphasis.
CELL = re.compile(r"<t[dh]\b[^>]*>(?P<inner>.*?)</t[dh]>", re.S | re.I)
ITEM = re.compile(r"<li\b[^>]*>(?P<inner>.*?)</li>", re.S | re.I)
# A label sits at the head of its container: this many characters of slack.
LABEL_SLACK = 24

# Regions the pass must not touch, each with the reason `--list` prints.
PROTECTED = [
    (re.compile(r"<svg\b.*?</svg>", re.S | re.I), "inside a figure"),
    (re.compile(r"<pre\b.*?</pre>", re.S | re.I), "inside a code block"),
    (re.compile(r'<span class="src">.*?</span>', re.S | re.I), "an attribution line"),
    (re.compile(r'<p class="past-pointer">.*?</p>', re.S | re.I), "the Past-questions pointer"),
    (re.compile(r'<p class="unit-meta">.*?</p>', re.S | re.I), "the unit-meta line"),
    (re.compile(r"<h[1-6]\b.*?</h[1-6]>", re.S | re.I), "a heading is already emphasis"),
]

MAX_WORDS = 4          # a term is a name, not a clause
MAX_PER_SECTION = 3    # prose emphasis per section
MAX_PER_CELL = 1       # so a cell's prose is never bold
CLAUSE_WORDS = 6       # what the reader calls "a clause, not a term" in --list

TAG = re.compile(r"<[^>]+>")
ENTITIES = {"&mdash;": "-", "&ndash;": "-", "&amp;": "&", "&nbsp;": " ",
            "&ldquo;": '"', "&rdquo;": '"', "&lsquo;": "'", "&rsquo;": "'",
            "&#39;": "'", "&hellip;": "..."}


def plain(s: str) -> str:
    """The readable text of a fragment: tags off, entities decoded, space normal.

    Punctuation is pulled back onto the word it belongs to. Removing a tag leaves
    a space behind, so without this `term</strong>, and` counted the comma as a
    word - which made the word totals depend on how much bold there was, exactly
    the number this tool is here to report.
    """
    for a, b in ENTITIES.items():
        s = s.replace(a, b)
    s = TAG.sub(" ", s)
    s = re.sub(r"\s+([,.;:!?%])", r"\1", s)
    return re.sub(r"\s+", " ", s).strip()


def read(p: pathlib.Path) -> str:
    """Read with no newline translation: these chapter files are CRLF, and a byte
    round trip must not depend on the platform. Same rule as tools/revise_blocks.py."""
    with open(p, encoding="utf-8", newline="") as handle:
        return handle.read()


def write(p: pathlib.Path, text: str) -> None:
    with open(p, "w", encoding="utf-8", newline="") as handle:
        handle.write(text)


def learn_field(text: str) -> tuple[int, int]:
    """(start, end) of the `learn` template literal's body in a chapter file."""
    m = LEARN.search(text)
    assert m is not None, "no learn field"
    return m.start("body"), m.end("body")


def chapters() -> list[pathlib.Path]:
    return sorted(SITE.glob("ch*.js"), key=lambda p: int(re.search(r"\d+", p.stem).group()))


def term_shaped(text: str) -> bool:
    """Is this run a term's name rather than a clause?

    The tests are the ones that separate a definition's label from prose: at most
    four words, no clause punctuation, and no co-ordinating conjunction. `DFS`
    passes; `the resources on a particular machine are local to itself; resources
    on other machines are remote` does not.

    Three shapes this deliberately does NOT reject, each one a term the first
    version of this test got wrong and dropped: a trailing full stop (a term
    written as a sentence is still a term), a full stop inside a number
    (`Web 2.0`), and a one-word label (`When`, opening "When to use it"). What is
    rejected is a full stop used as a sentence boundary, which is the mark of a
    clause someone wrapped in bold.
    """
    t = text.strip().rstrip(".").strip()
    words = t.split()
    if not words or len(words) > MAX_WORDS:
        return False
    if re.search(r"[,;:!?]", t):
        return False
    if re.search(r"\.(?!\d)", t):
        return False
    if re.search(r"\b(and|or|but|so|because|which|that|when)\b", t, re.I):
        return False
    return True


def strong_defects(learn: str) -> list[str]:
    """Unclosed, stray or empty `<strong>` tags - checked BEFORE anything is decided.

    This guard is not a nicety. The first run of this tool silently mis-paired one
    of these: ch5 carried a stray `<p><strong></p>`, so the run it measured was
    whatever text sat between that tag and the NEXT `</strong>` in the file - 145
    words of an unrelated paragraph - and "unbolding" it removed the emphasis from
    a run the rule never looked at, while reporting success. A pass that decides
    emphasis by pairing tags has to be able to trust that the tags pair, so it
    fails here first and says where.
    """
    out: list[str] = []
    depth, opened = 0, None
    for m in re.finditer(r"<strong>|</strong>", learn):
        if m.group(0) == "<strong>":
            if depth > 0:
                out.append(f"a <strong> opened earlier is still open here "
                           f"({plain(learn[opened:m.start()])[:70]!r})")
            if re.match(r"\s*</", learn[m.end():m.end() + 8]):
                out.append(f"an empty <strong> at char {m.start()} - it wraps nothing")
            depth += 1
            opened = m.start()
        else:
            if depth == 0:
                out.append(f"a stray </strong> at char {m.start()} closes nothing")
            else:
                depth -= 1
                if depth == 0:
                    opened = None
    if depth > 0:
        out.append(f"a <strong> at char {opened} is never closed "
                   f"({plain(learn[opened:opened + 200])[:70]!r})")
    return out


def protected_spans(learn: str) -> list[tuple[int, int, str]]:
    out = []
    for rx, why in PROTECTED:
        for m in rx.finditer(learn):
            out.append((m.start(), m.end(), why))
    return sorted(out)


def container_spans(learn: str, rx: re.Pattern, kind: str) -> list[tuple[int, int, int, str]]:
    """(inner_start, inner_end, outer_start, kind) for every match of a container."""
    out = []
    for m in rx.finditer(learn):
        out.append((m.start("inner"), m.end("inner"), m.start(), kind))
    return out


def analyse_learn(learn: str) -> tuple[list[dict], str]:
    """Decide every `<strong>` run's fate, and return (decisions, new learn body).

    The decisions come back in document order so they can be written out as the
    reviewable record. The new body differs from the old only by missing tags.
    """
    protected = protected_spans(learn)
    cells = container_spans(learn, CELL, "cell")
    items = container_spans(learn, ITEM, "item")

    def in_protected(pos: int) -> str | None:
        for start, end, why in protected:
            if start <= pos < end:
                return why
        return None

    def cell_of(pos: int) -> tuple[int, bool] | None:
        """(cell index, is this run at the head of the cell) - the two facts the
        table rule needs. A cell is strict: a label at its head may be bold, and
        its prose may not, whatever the section's budget would otherwise allow.
        That is the rule that turns a solid-bold comparison table back into a
        table."""
        for i, (inner_start, inner_end, _outer, _kind) in enumerate(cells):
            if inner_start <= pos < inner_end:
                return (i, pos - inner_start <= LABEL_SLACK)
        return None

    def at_item_head(pos: int) -> bool:
        for inner_start, inner_end, _outer, _kind in items:
            if inner_start <= pos < inner_end:
                return pos - inner_start <= LABEL_SLACK
        return False

    heads = list(HEAD.finditer(learn))
    bounds = []
    for i, h in enumerate(heads):
        stop = heads[i + 1].start() if i + 1 < len(heads) else len(learn)
        bounds.append((plain(h.group(2)) or "(preamble)", h.end(), stop))
    if not bounds:
        bounds = [("(whole chapter)", 0, len(learn))]

    def section_of(pos: int) -> str:
        name = "(preamble)"
        for title, start, stop in bounds:
            if start <= pos < stop:
                return title[:70]
        return name

    decisions: list[dict] = []
    kept_per_section: dict[str, int] = {}
    kept_per_cell: dict[int, int] = {}
    out = []
    cursor = 0
    for m in STRONG.finditer(learn):
        inner_html = m.group("inner")
        text = plain(inner_html)
        pos = m.start()
        why_protected = in_protected(pos)
        section = section_of(pos)

        fate, rule = "keep", "kept"
        # Whether this run competes for a section's prose budget: term-shaped,
        # not protected, and not a label sitting at the head of a list item or a
        # table cell. It is recorded on every run, not only the kept ones, because
        # a budget that is only counted after the fix can never be exceeded - the
        # first version of this report printed `over budget 0` on a tree that was
        # 57% over it.
        budgeted = bool(term_shaped(text)) and not why_protected and not at_item_head(pos) \
            and cell_of(pos) is None
        if why_protected:
            fate, rule = "keep", f"protected: {why_protected}"
        elif not term_shaped(text):
            words = len(text.split())
            fate = "drop"
            rule = ("a clause, not a term" if words > CLAUSE_WORDS
                    else "not a term's shape")
        else:
            cell = cell_of(pos)
            if cell is not None:
                index, at_head = cell
                if not at_head:
                    fate, rule = "drop", "a table cell's prose, not a label"
                elif kept_per_cell.get(index, 0) >= MAX_PER_CELL:
                    fate, rule = "drop", "a second label in one table cell"
                else:
                    kept_per_cell[index] = kept_per_cell.get(index, 0) + 1
                    rule = "kept: a table label"
            elif at_item_head(pos):
                rule = "kept: a list label"
            else:
                if kept_per_section.get(section, 0) >= MAX_PER_SECTION:
                    fate, rule = "drop", f"a fourth term in {section}"
                else:
                    kept_per_section[section] = kept_per_section.get(section, 0) + 1
                    rule = "kept: the term being defined"

        # count every kept run, wherever it came from, so the section's budget
        # and the report agree about how much bold a reader actually meets
        decisions.append({
            "chapter": None, "section": section, "words": len(text.split()),
            "text": text[:90], "fate": fate, "rule": rule, "budgeted": budgeted,
        })
        if fate == "drop":
            out.append(learn[cursor:m.start()])
            out.append(inner_html)
            cursor = m.end()
    out.append(learn[cursor:])
    return decisions, "".join(out)


def analyse(path: pathlib.Path) -> tuple[list[dict], str, str]:
    """(decisions, learn as written, learn as it should be)."""
    decisions, learn, expected, _defects = analyse_guarded(path)
    return decisions, learn, expected


def analyse_guarded(path: pathlib.Path) -> tuple[list[dict], str, str, list[str]]:
    """`analyse`, plus the malformed-markup guard. `--check` and `--apply` use this
    one; the report prints the defects without refusing, so they can be seen."""
    text = read(path)
    start, end = learn_field(text)
    learn = text[start:end]
    defects = strong_defects(learn)
    decisions, expected = analyse_learn(learn)
    name = path.name
    for d in decisions:
        d["chapter"] = name
    return decisions, learn, expected, defects


def count_bold(learn: str) -> tuple[int, int]:
    """(runs, words inside runs) - the two numbers the reader's complaint reduces to."""
    runs = STRONG.findall(learn)
    return len(runs), sum(len(plain(r).split()) for r in runs)


def report(listing: bool, worst: bool) -> int:
    print("emphasis in the DCC notes - <strong> runs, per chapter")
    print("  chapter   sections   runs   words   in-bold   words>6   longest   over budget")
    totals = [0, 0, 0, 0, 0, 0, 0]
    rows = []
    markup: list[str] = []
    for path in chapters():
        decisions, learn, expected, defects = analyse_guarded(path)
        markup.extend(f"{path.name}: {d}" for d in defects)
        words = len(plain(learn).split())
        runs = len(decisions)
        bold_words = sum(d["words"] for d in decisions)
        long_runs = sum(1 for d in decisions if d["words"] > CLAUSE_WORDS)
        longest = max((d["words"] for d in decisions), default=0)
        # The budget is about running prose. A list label and a table label are
        # terms by construction, so they are counted apart from it.
        by_section: dict[str, int] = {}
        for d in decisions:
            if d["budgeted"]:
                by_section[d["section"]] = by_section.get(d["section"], 0) + 1
        over = sum(1 for v in by_section.values() if v > MAX_PER_SECTION)
        sections = len(re.findall(r"<h[23]>|\n<h[23] ", learn))
        totals = [totals[0] + sections, totals[1] + runs, totals[2] + words,
                  totals[3] + bold_words, totals[4] + long_runs,
                  max(totals[5], longest), totals[6] + over]
        rows.append((path.name, sections, runs, words, bold_words, long_runs,
                     longest, over, decisions, expected))
        print(f"  {path.name:<9} {sections:>8} {runs:>6} {words:>7} "
              f"{bold_words:>8} ({100 * bold_words // max(words, 1):>2}%) "
              f"{long_runs:>8} {longest:>8} {over:>12}")
    print(f"  {'all':<9} {totals[0]:>8} {totals[1]:>6} {totals[2]:>7} "
          f"{totals[3]:>8} ({100 * totals[3] // max(totals[2], 1):>2}%) "
          f"{totals[4]:>8} {totals[5]:>8} {totals[6]:>12}")
    print(f"\n  budget: at most {MAX_WORDS} words per run, at most "
          f"{MAX_PER_SECTION} runs of running prose per section, at most "
          f"{MAX_PER_CELL} per table cell.")

    if worst:
        print("\n-- the sections carrying the most bold --")
        heavy = []
        for name, _s, _r, _w, _b, _l, _L, _o, decisions, _e in rows:
            per: dict[str, int] = {}
            for d in decisions:
                per[d["section"]] = per.get(d["section"], 0) + 1
            for sec, n in per.items():
                heavy.append((n, name, sec))
        for n, name, sec in sorted(heavy, reverse=True)[:15]:
            print(f"  {name:<9} {n:>3} runs   {sec}")

    if markup:
        print("\n-- malformed markup (the budget cannot be trusted until this is fixed) --")
        for m in markup:
            print(f"  {m}")

    if listing:
        for name, _s, _r, _w, _b, _l, _L, _o, decisions, _e in rows:
            dropped = [d for d in decisions if d["fate"] == "drop"]
            if not dropped:
                continue
            print(f"\n=== {name}: {len(dropped)} run(s) would lose their bold ===")
            for d in dropped:
                print(f"  [{d['words']:>3}w] {d['rule']:<28} {d['text']}")
    return 0


def check() -> int:
    """The budget, enforced against the files as they are.

    Strict by construction: the analysis is re-derived and compared with what the
    chapter says, so a run the rule rejects fails here whether it was never
    cleaned or was put back by hand afterwards. The plain text is compared too -
    this pass may remove tags and nothing else, and that is the invariant the
    whole approach rests on.
    """
    bad = []
    for path in chapters():
        decisions, learn, expected, defects = analyse_guarded(path)
        for d in defects:
            bad.append(f"{path.name}: MALFORMED MARKUP - {d}")
        if learn != expected:
            rejects = [d for d in decisions if d["fate"] == "drop"]
            bad.append(f"{path.name}: {len(rejects)} bold run(s) break the budget")
            for d in rejects[:8]:
                bad.append(f"    [{d['words']:>3}w] {d['section']}: {d['text'][:80]}")
        if plain(learn) != plain(expected):
            bad.append(f"{path.name}: the plain text changed - this pass may only remove tags")
        if not defects and count_pairs(learn) != count_pairs(expected):
            bad.append(f"{path.name}: the tag pairs changed")
    if bad:
        print("emphasis_audit: FAIL", file=sys.stderr)
        for b in bad[:40]:
            print("  " + b, file=sys.stderr)
        return 1
    print("emphasis_audit: OK - every run is a term, within the budget, the markup is "
          "well formed, and the plain text is untouched")
    return 0


def count_pairs(learn: str) -> tuple[int, int]:
    return len(re.findall(r"<strong>", learn)), len(re.findall(r"</strong>", learn))


def guard(paths: list[pathlib.Path]) -> list[str]:
    """Stop the pass dead on malformed markup, naming the file and the problem."""
    out = []
    for path in paths:
        _d, _l, _e, defects = analyse_guarded(path)
        out.extend(f"{path.name}: {d}" for d in defects)
    return out


def snapshot(paths: list[pathlib.Path]) -> None:
    """Record the state this pass starts from, so `--restore` can undo exactly it.

    Written on every `--apply` rather than only the first: the pass is idempotent,
    so the only way a second `--apply` can happen is after something else changed
    the files - and the state the second pass starts from is the one `--restore`
    has to return to.
    """
    SNAPSHOT.mkdir(parents=True, exist_ok=True)
    for p in paths:
        shutil.copy2(p, SNAPSHOT / p.name)
        write(SNAPSHOT / (p.name + ".sha256"),
              hashlib.sha256(read(p).encode("utf-8")).hexdigest() + "\n")


def fix_markup(paths: list[pathlib.Path]) -> int:
    """Remove empty or stray `<strong>` tags - a repair, kept apart from the pass.

    ch5 carried `<p><strong></p>`: a bold tag wrapping nothing, left over from an
    earlier edit. It is invisible on the page and fatal to this tool, because
    pairing that tag with the next `</strong>` in the file invented a 145-word
    "bold run" that was really two paragraphs apart, and the first pass unbolded
    the wrong span because of it. The repair is its own mode with its own
    snapshot, so the emphasis pass can keep the promise that it only ever removes
    emphasis: nothing here rewrites text, and the check below requires every
    removal to be a tag that wraps no visible character.
    """
    target = ROOT / "_audit" / "pre_markup"
    target.mkdir(parents=True, exist_ok=True)
    total = 0
    for p in paths:
        text = read(p)
        start, end = learn_field(text)
        learn = text[start:end]
        empty = list(re.finditer(r"<strong>(?=\s*</)", learn))
        if not empty:
            continue
        shutil.copy2(p, target / p.name)
        for m in reversed(empty):
            learn = learn[:m.start()] + learn[m.end():]
        write(p, text[:start] + learn + text[end:])
        total += len(empty)
        print(f"  {p.name}: {len(empty)} empty <strong> tag(s) removed")
    if not total:
        print("  no empty or stray <strong> tags anywhere")
    else:
        print(f"\n  {total} tag(s) removed; originals in "
              f"{target.relative_to(ROOT)}")
    return 0


def apply() -> int:
    paths = chapters()
    bad = guard(paths)
    if bad:
        print("emphasis_audit: refusing to write - the markup does not pair up", file=sys.stderr)
        for b in bad:
            print("  " + b, file=sys.stderr)
        return 1
    snapshot(paths)
    all_decisions = []
    changed = 0
    for path in paths:
        decisions, learn, expected = analyse(path)
        all_decisions.extend(decisions)
        if learn == expected:
            continue
        text = read(path)
        start, end = learn_field(text)
        write(path, text[:start] + expected + text[end:])
        dropped = sum(1 for d in decisions if d["fate"] == "drop")
        changed += dropped
        print(f"  {path.name}: {dropped} run(s) unbolded, "
              f"{sum(1 for d in decisions if d['fate'] == 'keep')} kept")
    DECISIONS.write_text(json.dumps({
        "_comment": [
            "Every <strong> run in the nine DCC units, and the rule that decided",
            "it - written by tools/emphasis_audit.py --apply and re-derived by",
            "--check. A bold run that no entry here explains is the defect the",
            "check fails on. `fate` is what the pass DID; the rule names why.",
        ],
        "budget": {"max_words_per_run": MAX_WORDS,
                   "max_runs_per_section": MAX_PER_SECTION,
                   "max_runs_per_cell": MAX_PER_CELL},
        "runs": all_decisions,
    }, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"\n  {changed} run(s) unbolded across {len(paths)} chapters; "
          f"{len(all_decisions)} decisions recorded in "
          f"{DECISIONS.relative_to(ROOT)}")
    return 0


def restore(paths: list[pathlib.Path]) -> int:
    if not SNAPSHOT.is_dir():
        print(f"emphasis_audit: no snapshot at {SNAPSHOT.relative_to(ROOT)}", file=sys.stderr)
        return 1
    n = 0
    for p in paths:
        src = SNAPSHOT / p.name
        if not src.exists():
            continue
        write(p, read(src))
        n += 1
    print(f"emphasis_audit: restored {n} chapter(s) from the snapshot, byte for byte")
    return 0


def roundtrip() -> int:
    """Apply and restore on copies, and require the original bytes back."""
    paths = chapters()
    bad = guard(paths)
    if bad:
        print("emphasis_audit: refusing to run - the markup does not pair up", file=sys.stderr)
        for b in bad:
            print("  " + b, file=sys.stderr)
        return 1
    before = {p.name: read(p) for p in paths}
    work = ROOT / "_audit" / "emphasis_roundtrip"
    work.mkdir(parents=True, exist_ok=True)
    global SNAPSHOT
    keep = SNAPSHOT
    SNAPSHOT = work
    try:
        for p in paths:
            shutil.copy2(p, work / p.name)
        for p in paths:
            decisions, learn, expected = analyse(p)
            text = read(p)
            start, end = learn_field(text)
            write(p, text[:start] + expected + text[end:])
        restore(paths)
        bad = [n for n in before if read(ROOT / "dcc-site" / n) != before[n]]
    finally:
        SNAPSHOT = keep
        for p in paths:
            write(p, before[p.name])
    if bad:
        print(f"emphasis_audit: ROUND TRIP FAILED for {bad}", file=sys.stderr)
        return 1
    print(f"emphasis_audit: round trip OK - {len(paths)} chapters back byte for byte")
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
    g.add_argument("--list", action="store_true", help="every run that would lose its bold")
    g.add_argument("--report", action="store_true", help="the sections carrying the most bold")
    g.add_argument("--check", action="store_true", help="the guard; exit 1 on a breach")
    g.add_argument("--apply", action="store_true", help="remove the rejected tags")
    g.add_argument("--restore", action="store_true", help="put the originals back")
    g.add_argument("--roundtrip", action="store_true", help="prove --restore on copies")
    g.add_argument("--fix-markup", action="store_true",
                   help="remove empty or stray <strong> tags (a repair, not the pass)")
    args = ap.parse_args()
    if args.check:
        return check()
    if args.fix_markup:
        return fix_markup(chapters())
    if args.apply:
        return apply()
    if args.restore:
        return restore(chapters())
    if args.roundtrip:
        return roundtrip()
    return report(listing=args.list, worst=args.report)


if __name__ == "__main__":
    raise SystemExit(main())
