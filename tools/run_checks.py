#!/usr/bin/env python3
"""The whole gate, in one command.

Before this existed the gate was a list of shell lines in .freebuff/run.md that a
human retyped. That is a gate with a memory requirement: the line that gets
skipped is the one that would have failed, and a result read off a terminal
scrollback is not a result anybody can check. This runs those steps, in the same
order, stops at the first failure, and exits non-zero - so it works the same from
a shell, from an editor, or from a hook.

    python tools/run_checks.py            # the gate run.md §4 documents
    python tools/run_checks.py --all      # plus the slower content audits
    python tools/run_checks.py -v         # stream every step's output live

WHAT IT COVERS: that the eight chapter files parse, the engine's pure contracts
hold, the site's structure and coverage are intact, all nine reading modes hold
AA and agree about their ids, the derived palette survives 168 awkward inputs
and still clears AA, the print palette is still the light theme, the comparison
sheet lists the modes that actually exist, the offline worker hashes to the bytes
it caches, every past-question import is idempotent, and the worked-numerical
checkers pass.

WHAT IT DOES NOT COVER: anything that has to be rendered. No layout claim - a
void on the right, a column that stops early, a phone top bar that overflows -
can be settled by reading CSS, and none of these steps open a browser. That is
§4a in .freebuff/run.md, and it is a separate job on purpose: it needs a
screenshot and a pair of eyes, and pretending otherwise is how a layout bug
survives a green gate.
"""

import argparse
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# (label, argv, must-contain-or-None). The `must` column exists for the one
# check whose failure mode is a *successful* command: merge_past.py exits 0
# whether or not it found new questions, so only its output can tell you that
# the importer has started double-counting.
GATE = [
    ("chapter files parse",
     ["node", "tools/dump_chapters.js"], None),
    # The count is deliberately not pinned: contracts are added as the app grows,
    # and a `must` string holding a number turns each one into an edit here. The
    # line only prints on success, so it still fails a test file that stops
    # running or starts failing.
    ("engine contracts",
     ["node", "tools/test_engine.js"], "engine contracts hold"),
    ("site structure + coverage",
     ["python", "tools/validate_site.py"], "All structural checks passed"),
    ("syllabus coverage is complete",
     ["python", "tools/validate_site.py", "--strict"], "Syllabus coverage: complete"),
    # The scope of the whole site is measured against this file, so a stale one is
    # not a stale artifact - it is a claim about what is examinable that no longer
    # matches the syllabus. See CONTENT_REBUILD.md.
    ("the syllabus scope is current",
     ["python", "tools/extract_syllabus.py", "--check"], None),
    # The map is the actual question the user asked for - is every syllabus
    # sub-topic taught by a named section - and it is answered by section number,
    # so a sub-topic that loses its sections fails here even if the page still
    # builds. A gap is a content decision, which is why the check is red the
    # moment one appears rather than a number to watch. See CONTENT_REBUILD.md 4b.
    ("every sub-topic has a section",
     ["python", "tools/syllabus_map.py", "--check"], None),
    # Chapter 1 used to number four of its sections 1.5-1.8, which the syllabus does
    # not have. They are folded into 1.1-1.4 (tools/fold_orphans.py); this fails if
    # a syllabus-less number comes back, or if a section loses its sections.
    ("no section is numbered off-syllabus",
     ["python", "tools/fold_orphans.py", "--check"], None),
    # Exam-facing material belongs on the Past tab, not at the end of the Learn
    # text: this fails if a chapter's summary reappears in `learn`, or if Learn
    # has no pointer to where it went. See tools/move_exam_summary.py.
    ("exam material is out of Learn",
     ["python", "tools/move_exam_summary.py", "--check"], None),
    # The exam pitch that used to open every unit ("what this unit is worth in the
    # exam", then a paragraph telling the reader which order to read the deck in)
    # is a comment about the paper, not about the subject, so it is out of the notes
    # - every question it named is already a Past Questions card. This fails if one
    # comes back. See tools/strip_exam_preamble.py.
    ("the notes open on the subject",
     ["python", "tools/strip_exam_preamble.py", "--check"], None),
    # Every retired third-person sentence is applied from one reviewed catalogue,
    # and this proves each entry is still in force: the original wording gone, the
    # replacement present, nothing reverted by a later pass. It also runs the
    # undo-then-redo self-test.
    ("the voice catalogue is in force",
     ["python", "tools/voice_rewrite.py", "--check"], "voice_rewrite: OK"),
    # The measurement itself, now that there is nothing left to be red about: all
    # twelve tells at zero across the nine units. The twelfth was added when the
    # first eleven reached zero and the pages still read as if somebody were
    # watching the reader work - it finds sentences that instruct the reader or
    # frame the subject as an answer, and it was 36 sentences when it was written.
    ("no tell survives in the notes",
     ["python", "tools/voice_audit.py", "--check"], "voice_audit: OK"),
    # Attribution spans and the Past-questions pointer are exempt from the prose
    # tells, so they are guarded instead: an attribution may name a book and not a
    # deck or a file, and the pointer must stay one line of navigation.
    ("attributions and the Past pointer stay honest",
     ["python", "tools/voice_audit.py", "--guard"], None),
    # The reader said the pages were unlikable to read, and the measurement that
    # explained it was emphasis: 31% of the words in the notes sat inside
    # `<strong>`, with 853 runs longer than six words and a comparison table whose
    # every cell was bold. This holds the budget the reader chose - a run of at
    # most four words, at most three in a section's running prose, at most one per
    # table cell - and it fails if the plain text of a chapter changed, because the
    # pass is only ever allowed to remove tags.
    ("emphasis stays within its budget",
     ["python", "tools/emphasis_audit.py", "--check"], "emphasis_audit: OK"),
    # "is everything same as syllabus, same to same?" - by number the answer was
    # yes, by wording no: eleven headings had dropped the technologies the syllabus
    # names (GFS/Hadoop/BitTorrent, IaaS/PaaS/SaaS, S3/Blob, EC2/Lambda/GCE). This
    # requires every h2 to be the syllabus's own number and wording, with a
    # clarifying phrase allowed only when it is declared. A heading numbered
    # outside the syllabus is reported rather than failed: that is a content
    # decision, the same policy syllabus_map.py applies to orphans.
    ("headings are the syllabus's own words",
     ["python", "tools/syllabus_headings.py", "--check"], "syllabus_headings: OK"),
    # "Make every figure caption say what the picture shows instead of citing the
    # deck and slide it came from." Eighteen captions and `alt` attributes were
    # still answering the other question - which lecture file and which slide -
    # and a caption is the one line a reader meets before deciding whether to look
    # at the picture. This fails if a caption or an alt names a file, a slide
    # number, or the deck. Provenance is not lost: it lives in the one
    # `fig-src-note` line per chapter and the Reference tab's own attribution.
    ("caption describes the picture, not its source",
     ["python", "tools/caption_plain.py", "--check"], "caption_plain: OK"),
    # The teacher's circled-i slides are reference material rather than notes: the
    # figures that came from them are moved onto the Reference tab by
    # tools/make_reference.py. This fails if a marked figure is still in the notes,
    # if the tab stops matching data/off_syllabus_slides.json after a deck is
    # re-extracted, or if cutting and putting back stop being exact inverses - the
    # check that caught the offsets that silently dropped two Bully figures.
    ("the marked figures are on the Reference tab",
     ["python", "tools/make_reference.py", "--check"], None),
    # The reader's own complaint, as a check: the notes pasted 201 of the teacher's
    # slide screenshots inline, most captioned with the section heading echoed back,
    # and every unit ended by naming its source decks. This fails if a picture that
    # no sentence points at comes back into the reading flow, if a caption names a
    # file again, or if one leaves the notes without reaching the Reference tab.
    ("the notes read as writing, not as slides",
     ["python", "tools/slim_dcc_figures.py", "--check"], None),
    # The other half of that move: the pictures that left the notes have to be
    # readable where they land, and 153 of them carry no text of their own - no
    # caption, nothing in the alt but the section heading echoed back. This is the
    # guard on the lines tools/ref_slide_notes.py writes: a line that goes missing,
    # reads differently from the catalogue or reverts to filler fails here. The
    # separate --strict step below is the count of pictures still to write.
    ("every picture on the Reference tab reads as something",
     ["python", "tools/ref_slide_notes.py", "--check"], None),
    # The reader's second complaint, as a check: a DCC section answers its heading in
    # about 240 words of continuous prose, where a Simulation section answers in
    # about 60 - a sentence, then the terms and numbers as bullets. tools/
    # revise_blocks.py writes one short answer block above every section (reviewed by
    # hand in data/dcc_revise.json; the prose is not touched). This fails if a
    # section's block goes missing, if a block is over the length cap, or if a term it
    # marks bold is not a term that section uses - the block may compress its section,
    # never add to it. The separate --strict step below is the count still to write,
    # and it comes after this one so a real defect cannot hide inside that gap.
    ("every note section answers its own heading",
     ["python", "tools/revise_blocks.py", "--check"], None),
    # The reader's third ask, as a check: a tab beside Learn holding one byte-size
    # card per SYLLABUS SUB-TOPIC - "fixed amount of information with no major
    # yaps". data/dcc_rev.json is written by hand and this is its guard: every
    # sub-topic has a card, every card is one lead paragraph plus four bullets
    # inside a fixed word band, every card carries its emoji, and every bolded term
    # and quoted number is one the sections teaching that sub-topic already use -
    # a card may compress them and may not add to them. It fails as well when
    # dcc-site/data/rev.js, which is what the page loads, stops matching the plan.
    ("the Revise cards are uniform and sourced",
     ["python", "tools/rev_summaries.py", "--check"], "rev_summaries: OK"),
    # The reader's fourth ask, and the one with no length limit on it: a second tab
    # beside Learn that teaches every topic properly - "present everything,
    # summarize all content yourself manually, must help me to learn concept and
    # get full marks". data/dcc_teach.json is written by hand and this is its
    # guard: every syllabus sub-topic taught, the SAME five parts in the same order
    # under every heading (the definition, the explanation, the worked run-through,
    # the exam traps, the full-marks answer), a floor on length so a topic is
    # taught rather than mentioned, and the same anti-invention rule the other two
    # layers carry - a bolded term or quoted number has to be in the unit's own
    # notes. A topic still to be written is reported as pending rather than failed,
    # which is how the tab can be built and read while it is being filled in; the
    # --report step under DEEPER is the count.
    ("every syllabus sub-topic is taught end to end",
     ["python", "tools/teach_notes.py", "--check"], "teach_notes: OK"),
    # Unit 8's Revise block was written with doubled backslashes, so its line
    # breaks showed on the page as the text `\r\n` while every other check stayed
    # green - the words were right, the block was under the cap, and the plan
    # agreed with the page. This reads the values the browser is given (the
    # chapters through node, the three hand-written catalogues directly) and
    # fails on a literal `\r` or `\n` anywhere in them. See tools/escape_audit.py.
    ("no literal escape reaches the page",
     ["python", "tools/escape_audit.py"], "escape_audit: OK"),
    # The sub-number strip was checked with a heading-shaped search and reported
    # complete; fifteen citations were sitting in body text, captions and quiz
    # explanations the whole time, pointing at sections that no longer carried
    # the number. A reference is not where the text you deleted used to be, so
    # this reads every value the browser is given and fails on a three-part
    # number anywhere in one. The syllabus numbers a sub-topic two levels deep
    # (8.4), never three - see tools/stale_refs.py.
    ("no section number the page no longer carries",
     ["python", "tools/stale_refs.py"], "stale_refs: OK"),
    # check_figures.js re-derives this contract for the Simulation portal, whose
    # chapters are the root-level ch1..8.js; the DCC site's nine chapters live in
    # dcc-site/, so its twenty-two hand-drawn figures had never been through any
    # check. Two of them were putting text outside the viewBox - clipped in half
    # on the page - while every word, caption and syllabus line was correct. See
    # tools/dcc_figures.py.
    ("the notes' drawings keep their text inside the frame",
     ["python", "tools/dcc_figures.py"], "dcc_figures: OK"),
    ("nine reading modes hold AA",
     ["python", "tools/check_themes.py"], "check_themes: OK"),
    # The reader-tinted mode is derived rather than declared, so it gets two
    # steps: the derivation's own contracts, then the SAME contrast gate the
    # eight static modes go through, applied to 168 awkward inputs written out in
    # this checker's own input format. This step depends on the one above it
    # having written that file, which is why the runner stops at the first
    # failure instead of ploughing on.
    ("derived palettes are well-formed",
     ["node", "tools/test_custom_theme.js"], "custom-theme: OK"),
    ("derived palettes hold AA",
     ["python", "tools/check_themes.py", "--palettes", ".freebuff/custom_grid.css"],
     "check_themes --palettes: OK"),
    # The comparison sheet is generated from app.js's mode list and tokens.css's
    # colour blocks, and its whole purpose is to be the one place a palette can be
    # judged by eye. A sheet that is missing a mode is worse than no sheet, so its
    # freshness is a contract rather than a chore - see tools/make_theme_sheet.py.
    # It passes when nothing has been built yet; there is nothing to be stale.
    ("the comparison sheet is current",
     ["python", "tools/make_theme_sheet.py", "--check"], None),
    # The offline worker's cache name is a hash of the bytes it caches, so this
    # step fails the moment a bundle is published with a worker that would serve
    # the previous build - the one failure mode of an offline site that looks
    # exactly like success from the outside.
    ("the offline worker matches the bundle",
     ["python", "tools/make_sw.py", "--check"], None),
    ("past-question import is idempotent",
     ["python", "tools/merge_past.py"], "imported new 0"),
    ("ch2 coin-game arithmetic",
     ["python", "tools/check_ch2_coin_game.py"], None),
    ("ch3 pure pursuit",
     ["python", "tools/check_ch3_pure_pursuit.py"], None),
    ("ch4 queuing",
     ["python", "tools/check_ch4_queuing.py"], None),
]

# Not in the gate because they are content audits rather than contracts: they
# ask whether the notes are good, not whether the build is sound. Still worth a
# single flag on the way to a release.
DEEPER = [
    ("figures are intact", ["node", "tools/check_figures.js"], None),
    ("DCC figures are intact", ["python", "tools/dcc_figures.py", "--show", "20"], None),
    ("tables add up", ["node", "tools/check_tables.js"], None),
    ("draw-style questions are covered", ["node", "tools/check_draw_coverage.js"], None),
    ("note pages match their slides", ["node", "tools/check_note_pages.js"], None),
    ("the Reference tab's pictures are all written up",
     ["python", "tools/ref_slide_notes.py", "--strict"], None),
    ("every note section has an answer block",
     ["python", "tools/revise_blocks.py", "--check", "--strict"], None),
    ("every Revise card is inside its band",
     ["python", "tools/rev_summaries.py", "--report"], None),
    ("every taught topic is complete",
     ["python", "tools/teach_notes.py", "--report"], None),
    ("DCC syllabus coverage", ["python", "tools/audit_dcc_coverage.py"], None),
    ("DCC teaching coverage", ["python", "tools/audit_dcc_teaching.py"], None),
]

# Minutes, not seconds: these re-read the source PDFs under _source/, which is
# ignored - so on a fresh clone they cannot run at all. Behind --slow rather
# than in --all, because a suite that takes longer than a coffee break stops
# being something anyone runs before a commit.
SLOW = [
    ("DCC extract is lossless", ["python", "tools/check_dcc_extract.py"], None),
]

# Every step gets a ceiling. Without one, a check that blocks on a missing
# input hangs the whole suite with no output at all - which is exactly what
# check_dcc_extract.py did, for eleven minutes, before this constant existed.
TIMEOUT = 240

# A step that is known to fail, because the failure is a real finding about the
# CONTENT that nobody has fixed yet - not a defect in the build. These are
# reported every run so they cannot quietly become permanent, but they do not
# make the runner exit non-zero: a suite that is always red gets ignored within
# a week, and then the checks that DO matter go unread with it.
#
# Delete an entry the moment its check passes; the runner prints a notice if a
# known gap starts passing, so this list cannot rot either way.
KNOWN_GAPS = {
    "the Reference tab's pictures are all written up":
        "4 of the 217 pictures on the Reference tab carry a written line of their "
        "own. The rest are pending, and meanwhile they keep the honest label they "
        "had - the deck and slide they came from, under a heading that links back "
        "to the note section that explains them. Nothing invented stands in for a "
        "picture nobody has read, so the count moves only as lines are written.",
    "note pages match their slides":
        "19 of the 41 rendered note pages in data/note_pages.json are not cited "
        "by any note, quiz or past card. That is a gap in the Simulation notes' "
        "coverage of the teacher's decks, not a build failure - closing it means "
        "writing citations for those pages, which needs the source PDFs.",
}


def use_utf8_stdout():
    """Windows' console encoding is cp1252, and these checkers print real
    typography - section signs, en dashes, and the subscript digits in the
    chapter formulas (\u2080 in `a\u2080`). Writing those to a cp1252 stdout
    raises UnicodeEncodeError *while printing a passing step*, and the traceback
    is easy to mistake for the checker failing. Ask for utf-8 and let
    unmappable characters degrade instead of raising.
    """
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass          # already wrapped, or not a real stream - not fatal


def tail(text, lines=8):
    """The last few non-blank lines of a step's output.

    A failing checker almost always says what to do - "run tools/make_theme_sheet.py"
    - and in non-verbose mode that sentence was the only thing being thrown away,
    leaving a bare "exit 1". So the tail is returned with the verdict and printed
    under the failure.
    """
    rows = [line for line in text.splitlines() if line.strip()]
    return "\n".join(rows[-lines:])


def run(label, argv, must, verbose):
    """Run one step. Returns (ok, seconds, note, detail)."""
    started = time.time()
    try:
        # encoding and errors are both explicit. Without them Python decodes
        # with the locale codec (cp1252 here) and a checker that prints a box
        # glyph or an en dash raises UnicodeDecodeError inside subprocess's
        # reader thread - which comes back as EMPTY output, i.e. as a step that
        # silently passes because it printed nothing.
        proc = subprocess.run(argv, cwd=ROOT, capture_output=True, text=True,
                              encoding="utf-8", errors="replace", timeout=TIMEOUT)
    except FileNotFoundError as exc:
        # A missing interpreter or a missing script is a gate failure too -
        # reporting it as "skipped" is how a renamed file goes unnoticed.
        return False, time.time() - started, f"{argv[0]} not found ({exc.strerror})", ""
    except subprocess.TimeoutExpired:
        return False, time.time() - started, f"timed out after {TIMEOUT}s", ""

    output = (proc.stdout or "") + (proc.stderr or "")
    if verbose:
        print(output, end="" if output.endswith("\n") else "\n")

    if proc.returncode != 0:
        return False, time.time() - started, f"exit {proc.returncode}", tail(output)

    if must and must not in output:
        return False, time.time() - started, f"output did not contain {must!r}", tail(output)

    return True, time.time() - started, "", ""


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--all", action="store_true",
                    help="also run the deeper content audits")
    ap.add_argument("--slow", action="store_true",
                    help="also run the audits that re-read the source PDFs (minutes)")
    ap.add_argument("-v", "--verbose", action="store_true",
                    help="stream each step's output instead of only the failures")
    args = ap.parse_args()
    use_utf8_stdout()

    steps = GATE + (DEEPER if args.all else []) + (SLOW if args.slow else [])
    width = max(len(s[0]) for s in steps)
    failures = []
    started = time.time()

    known_gaps = []
    ran = []
    for i, (label, argv, must) in enumerate(steps, 1):
        print(f"[{i:>2}/{len(steps)}] {label:<{width}}  ", end="", flush=True)
        ok, secs, note, detail = run(label, argv, must, args.verbose)
        ran.append(label)
        if not ok and label in KNOWN_GAPS:
            known_gaps.append(label)
            print(f"{'known':<4} {secs:5.1f}s  {note}")
            continue
        print(f"{'ok' if ok else 'FAIL':<4} {secs:5.1f}s  {note}")
        if not ok:
            failures.append((label, argv, note, detail))
            # Stop at the first failure: later steps read the outputs of earlier
            # ones, so their results would be noise. The first failure is the
            # one to fix anyway.
            break

    # Only a step that actually ran can say its gap has closed. The loop stops at the
    # first failure, and the steps it never reached would otherwise all read as
    # closed - which is how this list talks a reader into deleting an entry that is
    # still holding a real failure quiet.
    stale = [g for g in KNOWN_GAPS if g not in known_gaps and g in ran]

    print()
    if known_gaps:
        print(f"Known gaps - real, unfixed, and NOT counted as failures ({len(known_gaps)}):")
        for label in known_gaps:
            print(f"  * {label}")
            for line in KNOWN_GAPS[label].split("\n"):
                print(f"    {line.strip()}")
        print()
    if stale:
        # The other direction: a gap that has been closed. Left in the list it
        # would silence a real regression later.
        print("These are listed as known gaps but PASSED - delete them from "
              "KNOWN_GAPS in tools/run_checks.py:")
        for label in stale:
            print(f"  * {label}")
        print()
    if failures:
        label, argv, note, detail = failures[0]
        print(f"FAILED: {label}  ({note})")
        print(f"  {' '.join(argv)}")
        if detail:
            for line in detail.split("\n"):
                print(f"    {line}")
        print(f"\n  {len(ran)} of {len(steps)} steps ran; "
              f"the rest were not attempted.")
        print("\nrun_checks: FAILED")
        return 1

    passed = len(steps) - len(known_gaps) - len(stale)
    tail = f" ({len(known_gaps)} known gap(s) excluded)" if known_gaps else ""
    print(f"All {passed} checks passed in {time.time() - started:.1f}s{tail}.")
    print("Nothing here renders a page - a layout change still needs §4a in run.md.")
    print("run_checks: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
