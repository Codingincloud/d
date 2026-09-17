"""Move each chapter's exam-facing material out of Learn and into Past Questions.

The user's complaint, in their words: "in learn page put past question in past
question section". Every DCC chapter's Learn text ends with a `<h2>Exam-facing
summary</h2>` block - the "if the question says X, give Y" table, or a run of
`Model answer - N marks` headings - which is paper-facing material sitting in the
middle of the teaching text. It belongs with the past questions.

This tool moves it WITHOUT rewriting it:

  * the block moves, intact, into a new `pastSummary` field on the chapter;
  * Learn keeps a one-line pointer to the Past tab, so a reader is told where it
    went rather than finding a gap;
  * modules/past.js renders `pastSummary` under that chapter's cards, and
    engine.js indexes it for search, so nothing becomes un-findable.

Moving prose is the one operation that can silently lose content, so the tool is
written to make loss impossible to miss: `--check` fails if any Learn string still
carries the heading, if a chapter with a moved block has no `pastSummary`, or if
the moved text is not byte-identical to what was cut. `--restore` puts it back.

    python tools/move_exam_summary.py --apply
    python tools/move_exam_summary.py --check      # gate step
    python tools/move_exam_summary.py --restore
"""

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "dcc-site"

HEADING = "<h2>Exam-facing summary</h2>"
LEARN = re.compile(r"\n  learn: `(?P<body>.*?)\n`,\n", re.S)
SUMMARY = re.compile(r"\n  pastSummary: `(?P<body>.*?)\n`,\n", re.S)

# One sentence, and one only: it says where the questions went. The earlier version
# was a box that told the reader how to use the two tabs, which is coaching in the
# reading path - the voice audit retired that whole family (PLAN.md P2), so the
# pointer is now navigation and is measured as navigation (voice_audit
# pointer_defects).
POINTER = ('<p class="past-pointer">Questions on this unit, with model answers, are on the '
           '<a href="#/ch/{ch}/past">Past Questions</a> tab.</p>')


def chapters() -> list:
    def key(p):
        m = re.search(r"ch(\d+)", p.name)
        return int(m.group(1)) if m else 0
    return sorted(SITE.glob("ch*.js"), key=key)


def chapter_no(path: Path) -> int:
    m = re.search(r"ch(\d+)", path.name)
    return int(m.group(1)) if m else 0


def move_one(text: str, n: int, restore: bool = False):
    """(new text, action) where action is 'moved', 'restored' or 'clean'.

    Both directions are pure string surgery on the two fields' inner text, and
    neither trims anything: `head` (everything before the block) and `tail` (the
    block itself, trailing newlines included) are exactly the two halves the
    original `learn` string was cut into, so `head + tail` is that string again.
    The first version used `rstrip()` and was therefore only *nearly* reversible -
    it ate the blank lines around the block, which is the kind of difference that
    hides a real loss the next time someone edits around it.
    """
    learn = LEARN.search(text)
    summary = SUMMARY.search(text)

    if restore:
        if not summary or not learn:
            return text, "clean"
        moved = summary.group("body")
        inner = learn.group("body")
        pointer = POINTER.format(ch=n)
        if pointer in inner:
            inner = inner.replace(pointer, "")
        new_learn = f"\n  learn: `{inner}{moved}\n`,\n"
        text = text[:learn.start()] + new_learn + text[learn.end():]
        s = SUMMARY.search(text)
        if s:
            text = text[:s.start()] + text[s.end():]
        # An exact reversal, or nothing at all. The bug this guards against is
        # real and cost a pass: a `pastSummary` field whose closing backtick sat
        # on the previous line made LEARN match straight past its own field, so
        # the restore deleted the very block it was putting back - and reported
        # success, because nothing here checked that the block survived.
        if HEADING not in text:
            return text, "broken"
        return text, "restored"

    if summary or not learn:
        return text, "clean"
    body = learn.group("body")
    if HEADING not in body:
        return text, "clean"
    cut_at = body.index(HEADING)
    head, tail = body[:cut_at], body[cut_at:]
    if not tail.strip():
        return text, "broken"
    # The closing backtick goes on its OWN line. Written as `...</div>`,` on one
    # line, the learn field no longer ends at a `\n`,\n` boundary, so the learn
    # regex runs straight past it and swallows the new field whole.
    new_learn = (f"\n  learn: `{head}{POINTER.format(ch=n)}\n`,\n"
                 f"\n  pastSummary: `{tail}\n`,\n")
    out = text[:learn.start()] + new_learn + text[learn.end():]
    # Both fields must exist and hold what they are supposed to hold before this
    # is allowed to be written anywhere.
    l2, s2 = LEARN.search(out), SUMMARY.search(out)
    if not (l2 and s2) or HEADING in l2.group("body") or HEADING not in s2.group("body"):
        return text, "broken"
    return out, "moved"


def self_test() -> bool:
    """move then restore, on a synthetic chapter, must be the identity.

    This is the check that would have caught the boundary bug the moment it was
    written, instead of after it had already emptied eight files.
    """
    sample = ('window.CHAPTERS[9]={\n  learn: `\n<p>a</p>\n\n'
              '<h2>Exam-facing summary</h2>\n<p>b</p>\n\n`,\n\n  quiz: [],\n};\n')
    moved, a1 = move_one(sample, 9)
    back, a2 = move_one(moved, 9, restore=True)
    return a1 == "moved" and a2 == "restored" and back == sample


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--restore", action="store_true")
    args = ap.parse_args()
    if not (args.apply or args.check or args.restore):
        args.check = True

    problems, moved, restored = [], [], []
    if args.check and not self_test():
        problems.append("SELF-TEST FAILED: moving a synthetic block and putting it back "
                        "does not return the original - do not trust --apply or --restore")
    for path in chapters():
        text = path.read_text(encoding="utf-8")
        new, action = move_one(text, chapter_no(path), restore=args.restore)
        if action == "broken":
            problems.append(f"{path.name}: the field boundary is not what the tool expects - "
                            f"refusing to touch it (a field's closing backtick must sit on its own line)")
        elif action == "moved":
            moved.append(path.name)
        elif action == "restored":
            restored.append(path.name)
        elif not args.restore:
            # The contract: nothing paper-facing is left in Learn, and anything
            # that was moved is still present in full.
            l = LEARN.search(new)
            s = SUMMARY.search(new)
            if l and HEADING in l.group("body"):
                problems.append(f"{path.name}: '{HEADING}' is still inside learn")
            if s and f"href=\"#/ch/{chapter_no(path)}/past\"" not in (l.group("body") if l else ""):
                problems.append(f"{path.name}: pastSummary exists but Learn has no pointer to the Past tab")
        if new != text and (args.apply or args.restore):
            path.write_text(new, encoding="utf-8")

    if args.restore:
        print("move_exam_summary: restored " + (", ".join(restored) if restored else "nothing (already in Learn)"))
        for p in problems:
            print("  " + p, file=sys.stderr)
        return 1 if problems else 0
    print(f"move_exam_summary: {len(moved)} chapter(s) moved"
          + (f" ({', '.join(moved)})" if moved else " (nothing to move)")
          + ("" if args.apply else " - dry run, nothing written"))
    for p in problems:
        print("  " + p, file=sys.stderr)
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
