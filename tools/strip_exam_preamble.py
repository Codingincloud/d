"""Take the exam pitch out of the notes.

Two kinds of block sit at the top of every DCC chapter and are about the paper
rather than about the subject:

  * the **"What this unit is worth in the exam"** callout, which pitches the unit's
    marks and names the questions it expects; and
  * the **"Read the unit in the order the deck teaches it"** paragraph, which tells
    the reader how to read instead of teaching anything.

The reader called them useless and asked for them gone. They are gone - but not at
the cost of the exam information: every question either block names has to already
exist as a card in that chapter's `past` array, and the tool refuses to remove a
block whose questions are not all there. That check is the whole point, because the
blocks are deleted from the page and a question named only in one of them would
vanish from the site with them.

The removed HTML is not destroyed: it goes to `data/removed_learn_blocks.json` with
the index it sat at, and `--restore` puts each piece back exactly where it was.
`--check` is the gate step, so a chapter cannot quietly grow its pitch back.

    python tools/strip_exam_preamble.py --apply
    python tools/strip_exam_preamble.py --check
    python tools/strip_exam_preamble.py --restore
"""

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "dcc-site"
KEPT = ROOT / "data" / "removed_learn_blocks.json"
LEARN = re.compile(r"\n  learn: `(?P<body>.*?)\n`,\n", re.S)

WORTH = re.compile(r'<div class="concept-box asked">\s*<h4>[^<]*worth in the exam[^<]*</h4>', re.I)
# Any paragraph that opens by telling the reader HOW to read the unit - "Read the
# unit in two passes", "...as one question answered at three levels", "...in the
# order the deck builds it", "...in two halves". Anchored on "Read the unit" so an
# in-section note that happens to say "read the layers in the order the deck
# presents them" is left alone: that one is attached to specific content and
# explains it, which is not the same thing as a roadmap.
PREAMBLE = re.compile(r"<p>Read the unit\b", re.I)
QUESTION = re.compile(r"&ldquo;(.*?)&rdquo;", re.S)


def chapter_no(path: Path) -> int:
    return int(re.search(r"ch(\d+)", path.name).group(1))


def chapters() -> list:
    return sorted(SITE.glob("ch*.js"), key=chapter_no)


def with_trailing_blank(text: str, html: str, start: int) -> str:
    """`html` plus the blank line that follows it.

    A removed block has to take the newlines that separate it from what comes
    next, or the seam keeps both the line before it and the line after it and the
    chapter opens with a run of empty lines. Each span is taken from the original
    text, so `--restore` puts the same characters back at the same index.
    """
    end = start + len(html)
    while text[end:end + 1] == "\n":
        end += 1
    return text[start:end]


def paragraph_at(text: str, start: int) -> str:
    """The <p> that begins at `start`, through its closing tag (paragraphs do not
    nest, so the first </p> is the end)."""
    end = text.index("</p>", start) + len("</p>")
    while text[end:end + 1] == "\n":
        end += 1
    return text[start:end]


def balanced_div(text: str, start: int) -> str:
    """The whole <div> that begins at `start`, nested divs included."""
    assert text.startswith("<div", start)
    depth, i = 0, start
    for m in re.finditer(r"<div\b|</div>", text[start:]):
        depth += 1 if m.group(0) == "<div" else -1
        if depth == 0:
            i = start + m.end()
            break
    return text[start:i]


def flat(s: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s)).strip()


def past_questions(text: str) -> list:
    """Every wording in the chapter's past array - single and double quoted, since
    the file uses both and only one of them matches a naive pattern."""
    i = text.find("\n  past: [")
    if i < 0:
        return []
    seg = text[i:]
    out = []
    for m in re.finditer(r"""q:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")""", seg):
        out.append(flat((m.group(1) or m.group(2) or "")).lower())
    return out


def blocks_in(learn: str) -> list:
    """The blocks to remove, as (index, kind, html)."""
    out = []
    for m in WORTH.finditer(learn):
        out.append((m.start(), "worth-in-exam", with_trailing_blank(learn, balanced_div(learn, m.start()),
                                                                    m.start())))
    for m in PREAMBLE.finditer(learn):
        out.append((m.start(), "read-the-unit-roadmap", paragraph_at(learn, m.start())))
    return sorted(out)


def uncovered_questions(learn: str, block: str, cards: list) -> list:
    """Questions the block names that are NOT already a past card."""
    missing = []
    for q in QUESTION.findall(block):
        f = flat(q).lower()
        key = re.sub(r"\s+", " ", f)[:26]
        if key and not any(key in c for c in cards):
            missing.append(flat(q)[:80])
    return missing


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--restore", action="store_true")
    args = ap.parse_args()
    if not (args.apply or args.check or args.restore):
        args.check = True

    if args.restore:
        return do_restore()
    if args.check:
        return do_check()

    record, problems, touched = {}, [], []
    for path in chapters():
        raw = path.read_text(encoding="utf-8")
        m = LEARN.search(raw)
        if not m:
            continue
        learn = m.group("body")
        blocks = blocks_in(learn)
        if not blocks:
            continue
        cards = past_questions(raw)
        keep = []
        for idx, kind, html in blocks:
            missing = uncovered_questions(learn, html, cards)
            if missing:
                problems.append(f"{path.name}: {kind} names question(s) that are not in "
                                f"Past Questions, so it was NOT removed: " + "; ".join(missing))
                continue
            keep.append((idx, kind, html))
        if not keep:
            continue
        new = learn
        for idx, kind, html in sorted(keep, reverse=True):
            new = new[:idx] + new[idx + len(html):]
        # The remove is by exact index, so verify the result before writing: the
        # block must be gone and exactly this much text must be missing.
        assert len(new) == len(learn) - sum(len(h) for _, _, h in keep), "unexpected length"
        raw_new = raw[:m.start("body")] + new + raw[m.end("body"):]
        path.write_text(raw_new, encoding="utf-8")
        touched.append(f"{path.name}({len(keep)})")
        record[path.name] = [{"index": i, "kind": k, "html": h} for i, k, h in keep]

    if args.apply:
        existing = {}
        if KEPT.exists():
            try:
                existing = json.loads(KEPT.read_text(encoding="utf-8"))
            except Exception:
                existing = {}
        existing.update(record)
        KEPT.write_text(json.dumps(existing, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        total = sum(len(v) for v in record.values())
        print(f"strip_exam_preamble: removed {total} block(s) from {len(touched)} chapter(s)"
              + (f" ({', '.join(touched)})" if touched else ""))
        print(f"  kept, with the index each sat at, in {KEPT.relative_to(ROOT)}")
    for p in problems:
        print("  " + p, file=sys.stderr)
    return 1 if problems else 0


def do_check() -> int:
    bad = []
    for path in chapters():
        m = LEARN.search(path.read_text(encoding="utf-8"))
        if not m:
            continue
        learn = m.group("body")
        if "worth in the exam" in learn.lower():
            bad.append(f"{path.name}: the exam-worth callout is back in Learn")
        if PREAMBLE.search(learn):
            bad.append(f"{path.name}: a how-to-read-this-unit roadmap is back in Learn")
    if bad:
        for b in bad:
            print("  " + b, file=sys.stderr)
        print("strip_exam_preamble: FAIL - the exam pitch is in the notes", file=sys.stderr)
        return 1
    print("strip_exam_preamble: OK - no exam pitch at the top of any chapter")
    return 0


def do_restore() -> int:
    if not KEPT.exists():
        print("strip_exam_preamble: nothing recorded to restore")
        return 0
    record = json.loads(KEPT.read_text(encoding="utf-8"))
    done = []
    for name, items in record.items():
        path = SITE / name
        raw = path.read_text(encoding="utf-8")
        m = LEARN.search(raw)
        learn = m.group("body")
        for item in sorted(items, key=lambda it: it["index"], reverse=True):
            learn = learn[:item["index"]] + item["html"] + learn[item["index"]:]
        path.write_text(raw[:m.start("body")] + learn + raw[m.end("body"):], encoding="utf-8")
        done.append(f"{name}({len(items)})")
    print("strip_exam_preamble: restored " + ", ".join(done))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
