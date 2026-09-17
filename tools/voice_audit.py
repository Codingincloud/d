"""Find the third-person voice in the notes - and count it.

The complaint that started this, in the reader's words: the notes read like
somebody *describing* a class deck and a question paper ("the deck states", "both
halves of the first definition are load-bearing", "the exam answer is stronger if
you say why") instead of teaching the subject. Every one of those sentences is
about the material or about the exam, never about the thing being learned, and
together they are most of why the page reads as copy-paste.

This tool is the measurement, not the fix. It classifies every sentence of every
chapter's `learn` field into the voice tells below, so a pass over the notes can
be judged by a number that goes down instead of by opinion, and so that the same
pass can be re-run after an edit. `--check` fails when a tell that has been
retired comes back.

    python tools/voice_audit.py            # the table, per chapter and per tell
    python tools/voice_audit.py --list     # every matched sentence, grouped
    python tools/voice_audit.py --check    # exit 1 if a retired tell is present
"""

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "dcc-site"
# The indentation is not fixed: dcc-site indents its fields by two spaces, the
# Simulation site at the repository root does not indent at all. Reading either one
# is the point - the two sites were written the same way and are cleaned by the same
# passes, and a count that only exists for one of them cannot show that.
LEARN = re.compile(r"\n\s*learn: `(?P<body>.*?)\n?\s*`,\n", re.S)
# The revise blocks - the answer-in-a-few-lines that opens each section. They are
# reader-visible prose in the same notes pane, and the first version of this audit
# missed them because they live in their own field: the sentence the reader quoted
# back as the example of the problem ("Unit 1 established that components
# communicate only by passing messages") is in a revise block, not in `learn`.
REVISE = re.compile(r"\n\s*revise: \{(?P<body>.*?)\},?\n", re.S)

# Each tell is (key, human label, pattern). The patterns match the *plain text*
# of a sentence, so they are written the way a reader hears them.
TELLS = [
    ("deck", "talks about the class deck",
     r"\b(the|this|his|that)\s+(class\s+|teacher'?s\s+)?deck\b|\bdeck'?s\b|\bslides?\b|\bthe material\b|\bclass material\b"),
    ("source", "cites the source instead of teaching",
     r"\bthe textbook\b|\brecommended textbook\b|\bTanenbaum\b|\bCoulouris\b|\bthe book\b|\bin the notes\b"),
    ("paper", "talks about the question paper",
     r"\bthe (question )?paper\b|\bthe marker\b|\bexaminer\b|\bexaminable\b|\bGroup [AB]\b|\b(Model|Past) Question\b|\bthe exam\b|\bexam answer\b|\bearn the marks?\b|\bfor \d+ marks?\b|\bmarks?-per\b"
     # "in an exam" and "an exam" were missing, and two headings carried them:
     # "Two lists of five, and how to keep them apart in an exam" and a sentence about
     # what "a question that asks ... rewards". Both are the paper's business rather
     # than the subject's, which is the whole point of this tell.
     r"|\bin an exam\b|\ban exam\b|\bthe mark scheme\b"),
    ("advice", "gives exam strategy instead of the subject",
     r"\bthe strongest way\b|\breads better\b|\bthe number to quote\b|\bworth (knowing|naming|keeping|quoting|saying|remembering|stating)\b|\bstudy notes?\b|\bstudy order\b|\bif you can only remember\b|\bthe structure alone\b|\bscores? (one|two|most)\b|\bwhat the marker\b|\bself-mark"),
    ("frame", "frames the unit instead of starting it",
     r"\bworth knowing before you start\b|\bthis unit (rewards|asks|is)\b|\bthe unit has a shape\b|\bStrictly speaking\b|\bIt is worth noting\b|\bnote that\b|\bit bears\b"),
    # The reader's own words, quoted back at the tool: "those three requirements are
    # the vocabulary to answer an RMI question with". This family is not deck talk,
    # paper talk or strategy about the exam - it is a sentence about *answering the
    # question* standing where the answer should be, and it was invisible to all five
    # categories above. The patterns stay narrow: "answer" is a subject word in
    # protocol text ("the receiver may have to answer 'may I send?'"), so what is
    # matched is the phrasing about answering, never the verb on its own.
    # The reader's next note, in their words: "just teach the topic dont yap there is
    # lot of yapping throughout the site". Their example was a sentence *I* had
    # written - "Unit 1 established that components communicate only by passing
    # messages" - and it is the shape of the whole family: a sentence whose subject is
    # the writing, the course, the reader or the reading order rather than the material.
    # Nothing in it can be asked for in an exam.
    #
    # Five families, kept separate because they are fixed differently: a cross-unit
    # pointer is usually deleted, a meta sentence is rewritten to state the fact it was
    # circling, and an editorial clause is cut out of a sentence that is otherwise fine.
    ("crossref", "points at another unit instead of teaching this one",
     r"\bUnit \d|\bunit \d\.\d|\bthe rest of (the|this) (unit|course|chapter|book)\b"
     r"|\blater in (this unit|the course|the chapter)\b|\breturn(s|ed)? (to it )?later\b"
     r"|\bcomes? back in\b|\bthe whole subject of Unit\b|\bwhich Unit \d\b"
     r"|\bin Unit \d|\bUnit \d (builds|develops|rewards)\b"),
    ("reader", "addresses the reader instead of stating the fact",
     r"\bwe (now|can|have|will|saw|see|use|call|assume|treat|did|do)\b|\bYou can\b"
     # `remember that` as an instruction is sentence-initial ("Remember that a vector
     # clock carries one counter per process"); in lower case it is the subject of the
     # sentence remembering something ("a stateless server cannot remember that a
     # client holds a file"), and that is teaching.
     r"|\b[Yy]ou cannot\b|\b(?-i:Remember that)\b|\bnote that\b|\bnote the\b|\blet us\b"
     r"|\bit is worth (noting|saying|knowing)\b|\bwhat you (do|get|need)\b"),
    ("meta", "comments on the section or the reading order",
     r"\bthis (unit|sub-?topic|section|chapter)\b|\bthe (table|figure|figures|rows?|list|points?|answers?|columns?|sections?) (above|below)\b"
     r"|\bsee (below|above)\b|\b(above|below) (are|is|we)\b|\bin this sub-?topic\b"
     r"|\bthe (two|three|four|five|six) (things|points|cases|parts|rows) (above|below|that follow)\b"
     r"|\bpick up (the|from)\b|\bstart (from|with) the\b"),
    ("editorial", "rates the material instead of stating it",
     # `the reason is` is deliberately not here: it states a cause ("The reason is
     # serialization") and is exactly the teaching this pass wants, while `the
     # reason to` is a rating. The pattern was catching both.
     r"\bthe (thing|point|detail|part|one|number|list|column|row) (to|is|worth)\b"
     r"|\bthe reason (to|worth)\b"
     r"|\bworth (noting|knowing|saying|writing|remembering|quoting|naming|stating)\b"
     r"|\bnot a (ranking|coincidence|list|definition)\b|\bthe whole point\b|\bwhat matters\b"
     r"|\bthe (useful|important|interesting|key) (detail|thing|point|part|bit)\b"
     # `is what makes it ...` was here and is not: it states a cause ("serialization
     # is what makes it possible to put a value in a message") far more often than it
     # rates the material, and the four sentences it was catching in these notes were
     # all teaching.
     r"|\bare (the|two|the two) halves of\b"),
    # The reader's third note quoted ch3's unit opener - "the four sub-topics are
    # stages of one argument rather than four separate topics", "The reading order is
    # the order to work through", "Two points about this unit matter" - and the unit
    # opener is exactly where this family lives. These are sentences that announce,
    # count off or rate what is about to be said, so their subject is the writing
    # itself; none of them can be asked for in an exam, and none of them names the
    # deck, the paper, a unit or the reader, which is why every category above missed
    # them. The patterns name the shapes that occur here rather than trying to catch
    # "a sentence about the notes": a lead-in of the form "Two sentences ... pull" is
    # the tell, while "Four things have to be kept under control" is a list label and
    # is deliberately left alone.
    ("recount", "counts off or rates what follows instead of saying it",
     r"\bthe reading order\b|\bworth reading (?:it )?(?:twice|in this order)\b|\ba good closing line\b"
     r"|\b(?:in|from) (?:that|this) (?:list|definition|table)\b[^.]{0,40}\b(?:worth|carries?|pulls?)\b"
     r"|\b(?:two|three|four|five) (?:sentences|habits|things|points) (?:close|closes|pull|pulls|hold|holds|keep|keeps|in)\b"
     r"|\bstages of one argument\b|\bwhat to practise\b"),
    # The twelfth tell, and the reason it exists. When the eleven above reached
    # zero, the pages still read as if somebody were watching the reader work, and
    # the sentences doing it were invisible to every pattern here: "Read the tiers
    # as a division of labour, not a diagram", "Keep the two kinds of transparency
    # apart, because an answer that mixes them reads as if the student has not
    # noticed the difference", "the sentence to write in an answer is the one-line
    # rule". Their subject is the writing, the reading or the answer - never the
    # material - and there were 36 of them.
    #
    # Narrow on purpose. Most imperative sentences in these notes are mathematics
    # ("Consider a circle x2 + y2 = r2 inscribed in a square of side 2r") and most
    # second-person ones are ordinary English ("similar to how you are billed for
    # gas or electricity", inside a quoted definition). What this catches is the
    # shape that is about the reader's performance instead: an instruction to read
    # or keep something in mind, and a claim about what an answer, a question or a
    # mark scheme wants.
    # The imperative has to OPEN the sentence and be capitalised. Without both
    # guards the pattern matched the middle of ordinary prose - "a local file and a
    # remote file are read the same way" matched "read the", "a server that crashes
    # needs no recovery state - but a stateless server cannot remember that"
    # matched "remember that" - and a tell that fires on "read the interface" is a
    # tell nobody can act on. `(?-i:)` is the same device the `reader` tell already
    # uses for `Remember that`.
    ("direct", "instructs the reader, or frames the subject as an answer",
     r"^(?:Now\s+|So\s+|Also\s+|And\s+|First\s+|Second\s+|Finally\s+)?"
     r"(?-i:(?:Read|Keep|Note|Notice|Remember|Learn))\b(?:\s+(?:the|them|it|that|this|how|why|one|both|all|a|an)\b)"
     r"|\banswers? (?:that|which) (?:mixes|names|gives|reads|is)\b"
     r"|\bthe (?:sentence|shape|skeleton|vocabulary|words|way) to (?:write|state|use) in an answer\b"
     r"|\b(?:worth making|to make|to state|to name|to write|to draw) in an answer\b"
     r"|\bin an answer\b|\ban answer should\b|\bwhat an? answer\b"
     r"|\bshows you know\b|\basks you to\b|\bwhat (?:the )?students? (?:lose|get wrong)\b"
     r"|\bmark scheme\b|\bwild what (?:the|an) (?:answer|marker)\b"
     r"|\bHow to draw it in an answer\b|\bthe one-line definition for an answer\b"
     r"|\bthe distinction students lose\b|\bworth (?:making|writing down) in an answer\b"
     r"|\bto use precisely in an answer\b|\bnumber to make the availability row\b"
     r"|\b(?:Read|Learn) (?:that|one) (?:last sentence|number) twice\b"
     r"|\bopen an answer\b|\bclose an answer\b|\bready-made\b|\bthe list to (open|start|close)\b"
     r"|\bthe order of the problem\b|\bone to remember\b|\bthis is the answer\b"),
    # The eleventh family, unchanged. It is kept separate from `direct` because the
    # two are fixed differently: this one is about a sentence standing where the
    # answer should be ("the vocabulary to answer an RMI question with"), while
    # `direct` is an instruction to the reader or a claim about the paper.
    ("answer", "talks about answering the question instead of answering it",
     r"\bthe vocabulary\b|\bvocabulary to\b|\bto answer (a|an|the|this|that)\b"
     r"|\banswers? (are|is) marked\b|\bmarked on\b|\bthe one to know\b"),
]

SENT = re.compile(r"(?<=[.!?])\s+")


def chapter_no(path: Path) -> int:
    return int(re.search(r"ch(\d+)", path.name).group(1))


def chapters() -> list:
    return sorted(SITE.glob("ch*.js"), key=chapter_no)


CAPTION = re.compile(r"<figcaption>.*?</figcaption>", re.S)
# Inline SVG is a drawing: its labels are words inside a picture ("T0", "request",
# "Time server S"), and reading them as prose produced sentences like "Client P
# Time server S (UTC) T0 request" that a person would never write. The drawing is
# still checked - by tools/check_draw_coverage.js and the figure pass.
SVG = re.compile(r"<svg\b.*?</svg>", re.S)
# The one line per chapter that says where the figures came from. It names the
# deck on purpose - that is provenance, and the alternative was naming the deck in
# every caption instead - so it is metadata like a caption, not prose that teaches.
PROVENANCE = re.compile(r'<p class="fig-src-note">.*?</p>', re.S)
# The attribution next to a definition ("(Tanenbaum & Van Steen)"). The editorial
# standard in PLAN.md allows the notes to name a book once, where a definition
# comes from one, and an attribution in brackets is metadata exactly as a caption
# is - it says where a sentence came from, it does not teach the sentence.
# tools/voice_audit.py --check still requires such a span to be an attribution:
# short, and naming no deck, slide or file (see src_defects).
SRC = re.compile(r'<span class="src">.*?</span>', re.S)
# The one navigation line per chapter that says where the question material went
# (the constant tools/move_exam_summary.py writes). It names the Past Questions
# tab, which is a destination rather than a claim about the exam, so it is
# structural like the provenance line. pointer_defects below keeps it to one
# sentence of navigation.
PASTPTR = re.compile(r'<p class="past-pointer">.*?</p>', re.S)
# The unit's own title ("Unit 2 &mdash; Communication in Distributed Systems"). It is
# the page's name, not a sentence of prose, and it is the one heading in the notes
# whose whole job is to name the unit - so the cross-unit pattern read it as a
# pointer to another unit. Exempt by construction: a heading is the title only when
# its text starts with `Unit N` or `Chapter N`.
TITLE = re.compile(r"<h2>\s*(?:Unit|Chapter)\s+\d+[^<]*</h2>", re.I)


def plain(html: str) -> str:
    """Text with the block tags turned into sentence breaks, so that a heading
    cannot be glued onto the prose that follows it and read as one sentence.

    Figure captions are excluded: a caption is metadata about a picture, and its
    "slide 6 - deck.pptx" is provenance rather than a sentence claiming to teach
    something. Captions are measured on their own by `tools/fix_captions.py`
    (`--check` fails if one names a source file), so counting them here would
    double-count a different defect in the number this pass is judged by."""
    s = SVG.sub(" ", SRC.sub(" ", PASTPTR.sub(" ", PROVENANCE.sub(" ", TITLE.sub(" ", CAPTION.sub(" ", html))))))
    s = re.sub(r"</(p|li|h[1-6]|td|th|caption|div|tr|table|ul|ol|section)>", ". ", s)
    s = re.sub(r"<br\s*/?>", ". ", s)
    s = re.sub(r"<[^>]+>", " ", s)
    s = (s.replace("&ldquo;", '"').replace("&rdquo;", '"').replace("&amp;", "&")
          .replace("&mdash;", "-").replace("&ndash;", "-").replace("&nbsp;", " ")
          .replace("&hellip;", "...").replace("&#39;", "'").replace("&rsquo;", "'")
          .replace("&lsquo;", "'"))
    return re.sub(r"\s+", " ", s).strip()


def sentences(text: str) -> list:
    return [s.strip() for s in SENT.split(text) if s.strip()]


def scan(chapter_html: str) -> list:
    """Every tell found, as (key, sentence). One sentence can carry two tells and
    is reported once per tell: collapsing that would hide the worse sentence."""
    out = []
    for key, _label, pattern in TELLS:
        rx = re.compile(pattern, re.I)
        for s in sentences(plain(chapter_html)):
            if rx.search(s):
                out.append((key, s))
    return out


def field(path: Path) -> str:
    """The prose a reader sees in the notes pane: `learn`, plus the revise blocks.

    `reference` and `slides` are not here: their text is a caption under a picture
    or a line in the Reference tab, and they are measured by the figure pass
    (`tools/fix_captions.py`). The revise blocks are prose in the notes and are
    measured here.
    """
    raw = path.read_text(encoding="utf-8")
    body = LEARN.search(raw)
    blocks = REVISE.search(raw)
    return "\n".join(x.group("body") for x in (body, blocks) if x)


def report(listing: bool) -> int:
    labels = {k: v for k, v, _ in TELLS}
    rows, total = [], 0
    for path in chapters():
        hits = scan(field(path))
        per = {k: sum(1 for key, _ in hits if key == k) for k in labels}
        rows.append((path.name, per, len(hits)))
        total += len(hits)
    width = max(len(labels[k]) for k in labels)
    keys = list(labels)
    print("sentences carrying a voice tell, by chapter")
    print("  " + "chapter".ljust(10) + "".join(k.ljust(9) for k in keys) + "total")
    for name, per, tot in rows:
        print("  " + name.ljust(10) + "".join(str(per[k]).ljust(9) for k in keys) + str(tot))
    print("  " + "-" * (10 + 9 * len(keys) + 5))
    print("  " + "all".ljust(10)
          + "".join(str(sum(r[1][k] for r in rows)).ljust(9) for k in keys)
          + str(total))
    print()
    for k in keys:
        print(f"  {k:<9} {labels[k]}")
    if not listing:
        print(f"\n{len(labels)} tells, {total} matching sentences of prose. "
              f"`--list` prints every one of them.")
        return 0
    for path in chapters():
        hits = scan(field(path))
        if not hits:
            continue
        print(f"\n=== {path.name} ({len(hits)}) ===")
        for key, s in hits:
            print(f"  [{key}] {s[:220]}")
    return 0


def check() -> int:
    """The retired tells. These are the two the reader quoted by name, plus the
    unit-framing openers, and each one is required to be absent everywhere."""
    retired = {
        "deck": r"\bthe (class )?deck\b|\bdeck'?s\b",
        "advice": r"\bworth knowing before you start\b|\bif you can only remember\b|\bthe number to quote\b",
        "frame": r"\bthe unit has a shape\b",
    }
    bad = src_defects() + pointer_defects() + quiz_defects()
    for path in chapters():
        body = plain(field(path))
        for key, pattern in retired.items():
            for s in sentences(body):
                if re.search(pattern, s, re.I):
                    bad.append(f"{path.name} [{key}]: {s[:120]}")
    if bad:
        print(f"voice_audit: FAIL - {len(bad)} voice problem(s)", file=sys.stderr)
        for b in bad[:12]:
            print("  " + b, file=sys.stderr)
        return 1
    print("voice_audit: OK - no retired tell; attributions and the Past pointer are clean")
    return 0


def src_defects() -> list:
    """Attribution spans that are doing something other than attributing.

    The span is exempt from the prose tells, so it needs its own guard: it must
    name a source and nothing else - no deck, no slide, no file, and not a whole
    sentence of commentary smuggled in as an attribution.
    """
    out = []
    for path in chapters():
        for m in SRC.finditer(field(path)):
            t = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", m.group(0))).strip()
            if re.search(r"\bdeck\b|\.pptx|\.ppt\b|\.pdf|\bslides? \d", t, re.I):
                out.append(f"{path.name}: attribution names course material: {t[:90]}")
            elif len(t) > 90:
                out.append(f"{path.name}: attribution is a sentence, not a source: {t[:90]}")
    return out


def pointer_defects() -> list:
    """The past-questions pointer, which is exempt from the prose tells.

    Exempt, so it needs its own guard: one sentence, under 120 characters, a link
    to this chapter's own Past tab, and no advice word in it. The box it replaced
    was exempt-able only by accident; this one cannot grow back into coaching.
    """
    out = []
    advice = re.compile(r"\bworth\b|\bbest way\b|\bremember\b|\bscore\b|\bmarks?\b|\bmarker\b|\bstrongest\b|\bif you\b", re.I)
    for path in chapters():
        found = PASTPTR.findall(field(path))
        if len(found) > 1:
            out.append(f"{path.name}: {len(found)} past-question pointers, expected at most 1")
        for m in found:
            t = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", m)).strip()
            if f'href="#/ch/{chapter_no(path)}/past"' not in m:
                out.append(f"{path.name}: pointer does not link to this chapter's Past tab")
            if len(t) > 120:
                out.append(f"{path.name}: pointer is longer than one line of navigation: {t[:90]}")
            if advice.search(t):
                out.append(f"{path.name}: pointer has gone back to coaching: {t[:90]}")
    return out


# The line ending is `\r?\n` rather than `\n`: these chapter files are CRLF, and the
# first version of this pattern required a bare LF, so `search` returned None on
# every chapter, `quiz_defects` returned an empty list, and the guard passed while
# checking nothing. Caught by the negative test, which is the only reason to write
# one.
# The close is anchored to the field's own indentation rather than to `\s*`: the
# quiz field contains nested arrays (`options: [ ... ]`), and a loose `\n\s*\],`
# matched the first question's `options` close, so the scan saw 454 characters of a
# 40 000-character field and reported nothing. `(?P=ind)` is what makes the capture
# end at the field's own `],`. The line ending is `\r?\n` because these chapter
# files are CRLF and a bare `\n` matched none of them.
QUIZ = re.compile(r"\n(?P<ind>[ \t]*)quiz: \[(?P<body>.*?)\r?\n(?P=ind)\],\r?\n", re.S)

# The quiz explanations are read the moment an answer is checked, so the same
# retired family has to be absent from them - and it was not: the first pass over
# the notes cleaned `learn` and left 37 sentences such as "The deck's map has
# three rows" and "Why does the deck say that data destruction in the cloud is
# difficult to prove?" sitting in the feedback a student sees after every
# question. The notes were the measurement, so the notes were all that was
# cleaned; this guard is what stops the same drift recurring in the field the
# measurement did not open.
QUIZ_TELL = (r"\b(the|this|that|a|the teacher'?s)\s+(class\s+|teacher'?s\s+)?deck\b"
             r"|\bdeck'?s\b|\bcourse material\b|\breference deck\b|\bthe course'?s\b")


def quiz_defects() -> list:
    """Deck talk in the quiz feedback, which is prose the reader meets on answer."""
    out = []
    rx = re.compile(QUIZ_TELL, re.I)
    for path in chapters():
        m = QUIZ.search(path.read_text(encoding="utf-8"))
        if m is None:
            continue
        for s in sentences(plain(m.group("body"))):
            if rx.search(s):
                out.append(f"{path.name} [quiz]: {s[:120]}")
    return out


def caption_defects() -> list:
    """Captions that name the file they came out of. Separate from the prose tells
    because the fix is a template, not a rewrite: see tools/fix_captions.py."""
    out = []
    for path in chapters():
        for m in CAPTION.finditer(field(path)):
            t = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", m.group(0))).strip()
            if re.search(r"\.pptx|\.ppt\b|\.pdf|LectureMain|_refnote|slide \d+ \u00b7|", t):
                out.append(f"{path.name}: {t[:100]}")
    return out


def main() -> int:
    # The notes are not ASCII: the Simulation chapters alone carry pi, mu and
    # x-dot. A Windows console defaults to cp1252 and `--list` died on the first
    # such sentence, which is the one command whose whole job is to print them.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError):
        pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", metavar="DIR",
                    help="the site to measure (default: dcc-site). The Simulation site "
                         "at the repository root is `--site .`")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--captions", action="store_true", help="list captions that name a source file")
    ap.add_argument("--attributions", action="store_true", help="list attribution spans that do more than attribute")
    ap.add_argument("--guard", action="store_true",
                    help="fail if an attribution span or the Past-questions pointer is doing something other than its job")
    args = ap.parse_args()
    reporting = not (args.check or args.guard or args.captions or args.attributions)
    if args.site and reporting:
        # Only the measurement moves. --check and --guard read the DCC catalogue and
        # the exempt spans written for it, so they stay pointed at dcc-site.
        global SITE
        SITE = (ROOT / args.site).resolve()
    elif args.site:
        print("voice_audit: --site is for the report only; ignoring it here", file=sys.stderr)
    if args.check:
        return check()
    if args.captions:
        bad = caption_defects()
        print(f"captions naming their source file: {len(bad)}")
        for b in bad[:20]:
            print("  " + b)
        return 0
    if args.attributions:
        bad = src_defects()
        print(f"attribution spans that are not attributions: {len(bad)}")
        for b in bad[:20]:
            print("  " + b)
        return 0
    if args.guard:
        bad = src_defects() + pointer_defects() + quiz_defects()
        if bad:
            print(f"voice_audit: FAIL - {len(bad)} exempt element(s) are not doing their job", file=sys.stderr)
            for b in bad[:12]:
                print("  " + b, file=sys.stderr)
            return 1
        print("voice_audit: OK - attributions name sources, the Past pointer is one line")
        return 0
    return report(args.list)


if __name__ == "__main__":
    raise SystemExit(main())
