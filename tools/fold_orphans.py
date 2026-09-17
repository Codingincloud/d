"""Fold Chapter 1's four orphan sections into the sections the syllabus names.

The syllabus names 1.1-1.4 for Unit 1. The chapter also numbered 1.5 Advantages
and Disadvantages, 1.6 Main Problems and Challenges, 1.7 Types of Distributed
Systems and 1.8 Resource Sharing and the Web - four numbers that do not exist on
the syllabus, so the site appears to teach four topics the examiner never listed,
and `tools/syllabus_map.py` reports them as orphans.

The content is good; only its numbering and its position are wrong. Each block
already says where it belongs:

  * 1.5 advantages/disadvantages are 1.1's characteristics seen from both sides,
    so they become **1.1.3**;
  * 1.6 opens "they map onto the four goals of 1.2", so it becomes **1.2.1**;
  * 1.8 opens "Resource sharing is goal 1 of 1.2", so its first half becomes
    **1.2.2**, and the Web's own problems - the second half, which is an example
    of a distributed system - become **1.3.1**;
  * 1.7 (cluster, grid, cloud) is the taxonomy of 1.4's models, so it becomes
    **1.4.5**.

Nothing is rewritten, trimmed or deleted, and the blocks move to sit under their
parent so the numbering still matches the reading order. The tool asserts that
before it writes anything: every block's body must survive as a substring, the
renamed sub-headings of 1.6 must be demoted so they stay inside their new parent,
and the word count may change only by the exact delta of the two sentences that
are deliberately rewritten (the unit intro, which names 1.5-1.8, and one
cross-reference to "(1.8)").

    python tools/fold_orphans.py --apply
    python tools/fold_orphans.py --check    # gate step: no syllabus-less number
                                            # may reappear in Chapter 1
"""

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CH1 = ROOT / "dcc-site" / "ch1.js"
LEARN = re.compile(r"\n  learn: `(.*?)\n`,\n", re.S)

# The syllabus numbers Unit 1 actually has.
SYLLABUS = {"1.1", "1.2", "1.3", "1.4"}
ORPHAN_NUMBERS = {"1.5", "1.6", "1.7", "1.8", "1.9"}

H11 = "<h2>1.1 Definition and Characteristics</h2>"
H12 = "<h2>1.2 Goals of Distributed Systems</h2>"
H13 = "<h2>1.3 Examples of Distributed Systems</h2>"
H14 = "<h2>1.4 Models of Distributed Systems</h2>"
H15 = "<h2>1.5 Advantages and Disadvantages</h2>"
H16 = "<h2>1.6 Main Problems and Challenges</h2>"
H17 = "<h2>1.7 Types of Distributed Systems</h2>"
H18 = "<h2>1.8 Resource Sharing and the Web</h2>"

OLD_INTRO = ("Sections 1.5 to 1.8 are the deck's closing material &mdash; advantages, "
             "problems, types and resource sharing &mdash; and that is where the second "
             "half of a multi-part question usually comes from.")
NEW_INTRO = ("The deck's closing material sits inside those four sections rather than "
             "beside them: advantages and disadvantages are 1.1.3, the four problems are "
             "1.2.1, resource sharing is 1.2.2, the Web is 1.3.1, and the types of system "
             "are 1.4.5. That folded material is where the second half of a multi-part "
             "question usually comes from.")

DEMOTE = ["Heterogeneity", "Reliability", "Security", "Scalability"]


def cut(text: str, start: str, end: str) -> str:
    """The slice of `text` from `start` up to (not including) `end`."""
    i = text.index(start)
    j = text.index(end) if end else len(text)
    return text[i:j]


def fold(learn: str):
    """(new learn, report) - or raise AssertionError if a check does not hold."""
    pieces = {
        # from the very start of the field: the unit intro begins with blank lines
        "intro": learn[:learn.index(H11)],
        "1.1": cut(learn, H11, H12),
        "1.2": cut(learn, H12, H13),
        "1.3": cut(learn, H13, H14),
        "1.4": cut(learn, H14, H15),
        "1.5": cut(learn, H15, H16),
        "1.6": cut(learn, H16, H17),
        "1.7": cut(learn, H17, H18),
        "1.8": cut(learn, H18, None),
    }
    assert "".join(pieces.values()) == learn, "the pieces do not cover the learn string exactly"

    def after_heading(piece: str, heading: str) -> str:
        """A block's body, with its own heading removed."""
        assert piece.startswith(heading), f"expected {piece[:40]!r} to start with {heading!r}"
        return piece[len(heading):].lstrip("\n")

    # --- 1.5 -> 1.1.3 -----------------------------------------------------
    p11 = (pieces["1.1"]
           .replace("<h3>The three characteristics the definition implies</h3>",
                    "<h3>1.1.1 The three characteristics the definition implies</h3>")
           .replace("<h3>Further characteristics</h3>", "<h3>1.1.2 Further characteristics</h3>"))
    p153 = "<h3>1.1.3 Advantages and disadvantages</h3>\n" + after_heading(pieces["1.5"], H15)

    # --- 1.6 -> 1.2.1, with its four problems demoted to h4 so they stay
    #     inside their new parent rather than becoming siblings of it -------
    p16 = "<h3>1.2.1 Main problems and challenges</h3>\n" + after_heading(pieces["1.6"], H16)
    for name in DEMOTE:
        p16 = p16.replace(f"<h3>{name}</h3>", f"<h4>{name}</h4>")
    p16 = p16.replace("how the Web itself scales (1.8)", "how the Web itself scales (1.3.1)")

    # --- 1.8 -> 1.2.2 + 1.3.1, split where the subject changes ------------
    web_at = "<p>The deck also lists the Web's own challenges"
    body18 = after_heading(pieces["1.8"], H18)
    assert web_at in body18, "1.8 no longer splits where the Web begins"
    share, web = body18.split(web_at, 1)
    p182 = "<h3>1.2.2 Resource sharing, and what a service is</h3>\n" + share.rstrip() + "\n\n"
    p131 = "<h3>1.3.1 The Web as a distributed system</h3>\n" + web_at + web

    # --- 1.7 -> 1.4.5, grid layers demoted for the same reason ------------
    p17 = "<h3>1.4.5 Types: cluster, grid and cloud</h3>\n" + after_heading(pieces["1.7"], H17)
    p17 = p17.replace("<h3>The five layers of a grid</h3>", "<h4>The five layers of a grid</h4>")

    intro = pieces["intro"].replace(OLD_INTRO, NEW_INTRO)
    assert NEW_INTRO in intro, "the unit intro did not contain the sentence being rewritten"

    new = (intro + p11 + p153 + pieces["1.2"] + p16 + p182
           + pieces["1.3"] + p131 + pieces["1.4"] + p17)

    # --- nothing may be lost ---------------------------------------------
    # Compared with heading levels and heading numbers erased, because renaming a
    # heading and re-parenting a sub-section are the two edits this tool is FOR -
    # but erasing only those means lost prose still fails the check.
    def plain(h: str) -> str:
        h = re.sub(r"</?h[234]>", "<h>", h)
        return re.sub(r"<h>\s*\d+(?:\.\d+)*\s*", "<h>", h)

    plain_new = plain(new)
    # Cross-references to a number that no longer exists have to be updated, and
    # each one is listed here so the comparison knows it is expected - and so a
    # stale entry (one that no longer applies) can be caught below.
    edits = [("how the Web itself scales (1.8)", "how the Web itself scales (1.3.1)")]
    used = {old: 0 for old, _ in edits}
    for name, piece in pieces.items():
        if name == "intro":
            continue
        body = after_heading(piece, {"1.1": H11, "1.2": H12, "1.3": H13, "1.4": H14,
                                     "1.5": H15, "1.6": H16, "1.7": H17, "1.8": H18}[name]).strip()
        for old, new_text in edits:
            used[old] += body.count(old)
            body = body.replace(old, new_text)
        if name == "1.8":
            # this one is deliberately split in two, so check both halves
            for half in (share.strip(), (web_at + web).strip()):
                assert plain(half) in plain_new, "a half of the 1.8 block is missing from the result"
            continue
        assert plain(body) in plain_new, f"the body of block {name} is missing from the result"
    for old, count in used.items():
        assert count == 1, f"the cross-reference {old!r} was expected once and found {count} time(s)"

    def words(s):
        return len(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s)).split())

    # The word count may move for exactly three reasons, each listed here: the
    # rewritten intro sentence, the renamed headings, and nothing else. A fourth
    # reason - lost or invented prose - then shows up as a mismatch instead of
    # being absorbed into a plausible-looking number.
    heading_swaps = [
        (["1.1.1 The three characteristics the definition implies"],
         ["The three characteristics the definition implies"]),
        (["1.1.2 Further characteristics"], ["Further characteristics"]),
        (["1.1.3 Advantages and disadvantages"], ["1.5 Advantages and Disadvantages"]),
        (["1.2.1 Main problems and challenges"], ["1.6 Main Problems and Challenges"]),
        (["1.4.5 Types: cluster, grid and cloud"], ["1.7 Types of Distributed Systems"]),
        # one section becomes two, which is the split
        (["1.2.2 Resource sharing, and what a service is",
          "1.3.1 The Web as a distributed system"],
         ["1.8 Resource Sharing and the Web"]),
    ]
    delta = words(new) - words(learn)
    expected = (words(NEW_INTRO) - words(OLD_INTRO)
                + sum(sum(words(a) for a in added) - sum(words(r) for r in removed)
                      for added, removed in heading_swaps))
    assert delta == expected, (f"the word count moved by {delta}, and the intro sentence "
                               f"plus the heading renames account for {expected} - "
                               f"something else changed")
    assert not any(f"<h2>{n}" in new for n in ORPHAN_NUMBERS), "an orphan number survived"
    report = {"words_before": words(learn), "words_after": words(new), "delta": delta,
              "blocks": ["1.5->1.1.3", "1.6->1.2.1", "1.8->1.2.2 + 1.3.1", "1.7->1.4.5"]}
    return new, report


def orphans_in(learn: str) -> list:
    """Headings numbered for a Unit 1 topic the syllabus does not name."""
    out = []
    for m in re.finditer(r"<h([234])>(\d+\.\d+)(?:\.\d+)?\s", learn):
        if m.group(2) in ORPHAN_NUMBERS:
            out.append(m.group(0))
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    if not (args.apply or args.check):
        args.check = True

    raw = CH1.read_text(encoding="utf-8")
    m = LEARN.search(raw)
    if not m:
        print("fold_orphans: ch1.js has no learn field", file=sys.stderr)
        return 1
    learn = m.group(1)
    orphans = orphans_in(learn)

    if args.check:
        if orphans:
            for h in orphans:
                print(f"  {h}", file=sys.stderr)
            print(f"fold_orphans: FAIL - {len(orphans)} heading(s) numbered for a topic the "
                  f"syllabus does not name (1.1-1.4 are the only Unit 1 topics)", file=sys.stderr)
            return 1
        print("fold_orphans: OK - no syllabus-less section number in Chapter 1")
        return 0

    if not orphans and H15 not in learn:
        print("fold_orphans: already folded - nothing to do")
        return 0

    new, report = fold(learn)
    raw_new = raw[:m.start(1)] + new + raw[m.end(1):]
    CH1.write_text(raw_new, encoding="utf-8")
    print(f"fold_orphans: folded {len(report['blocks'])} blocks into the syllabus-numbered "
          f"sections ({', '.join(report['blocks'])})")
    print(f"  words {report['words_before']} -> {report['words_after']} "
          f"(delta {report['delta']:+d}, exactly the rewritten sentences)")
    print(f"  orphan headings left: {len(orphans_in(new))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
