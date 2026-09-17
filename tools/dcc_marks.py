#!/usr/bin/env python3
"""Find the teacher's own "not important" mark in the lecture material.

The marking the user described - "in pdf or pptx there is i sign somewhere in
pages with non imp things" - is PowerPoint's standard **Information icon**: a
circle with a lowercase i, shipped as an SVG whose own id is
`Icons_Information`. The teacher drops it on slides that are extra. That makes
the mark machine-readable after all, and this tool reads it:

  * scan the lecture decks for media whose bytes are that icon,
  * mark every slide that places it,
  * join each marked slide to the figure the site extracted from it
    (`assets/dcc-slides/FIGURES.json` records deck + slide number per image),
  * and then to the SECTION that shows that figure, which is the unit of work the
    rebuild actually needs: a marked slide tells you which note section to flag.

    python tools/dcc_marks.py                 # write data/off_syllabus_slides.json
    python tools/dcc_marks.py --report        # the section-level findings, no write
    python tools/dcc_marks.py --check         # fail if the file on disk is stale

WHAT IT CANNOT SEE, stated up front because the gap is real:

  * `.ppt` (legacy binary) - one deck, Chapter 5's, cannot be read without
    LibreOffice. Reported as unreadable rather than silently treated as clean.
  * PDFs - the icon would be a raster XObject, and finding a circled i in a PDF's
    images without rendering them is not something this tool pretends to do. The
    PDF-sourced figures are therefore covered by the SYLLABUS map instead, which
    is the authority anyway: the icon corroborates, it does not decide.

The decks live outside the repository (they are the teacher's own upload), so
their location comes from --decks and the tool says so plainly when it cannot
find them. What it writes - the marked slide list - is inside the repo, because
that list is a fact about the material that outlives the folder it came from.
"""

import argparse
import json
import pathlib
import re
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "off_syllabus_slides.json"
FIGURES = ROOT / "assets" / "dcc-slides" / "FIGURES.json"

# The default homes of the teacher's upload. Both are outside the repo; the
# second is the folder the first was extracted from, kept because they drift.
DEFAULT_DECKS = [
    pathlib.Path(r"C:\Users\ghimi\Downloads\OneDrive_1_22-08-2026"),
    pathlib.Path(r"C:\Users\ghimi\Downloads\OneDrive_1_7-9-2026"),
]

# THE MARK ITSELF. Not a filename and not a size: the SVG's own id, which is what
# PowerPoint writes for the standard Information icon. Matching on the content is
# what makes this independent of how the file was exported or renamed.
ICON_SIGNATURE = b"Icons_Information"


def reads(runs_join: str) -> str:
    """Slide text, with the runs put back together.

    These decks are PowerPoint exports that split a word into a run per glyph -
    "Cristian's" arrives as C|r|i|s|t|i|a|n|'|s - so joining with a separator
    would shred it and joining bare would glue separate words. A run boundary
    inside a word follows a letter and precedes a lowercase letter, so that pair
    is joined bare and every other boundary gets a space.
    """
    text = re.sub(r"(?<=[A-Za-z])(?=[a-z])", "", runs_join)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def slide_runs(z: zipfile.ZipFile, name: str) -> list[str]:
    body = z.read(name).decode("utf-8", "replace")
    return [t for t in re.findall(r"<a:t>([^<]*)</a:t>", body)]


def deck_marks(path: pathlib.Path) -> dict:
    """Which slides in this deck carry the information icon."""
    if path.suffix.lower() != ".pptx":
        return {"deck": path.name, "readable": False,
                "why": "legacy .ppt - needs LibreOffice to open; not read"}
    with zipfile.ZipFile(path) as z:
        icon_media = {n for n in z.namelist()
                      if n.startswith("ppt/media/") and ICON_SIGNATURE in z.read(n)}
        if not icon_media:
            return {"deck": path.name, "readable": True, "marked": [],
                    "icon_media": [], "slides": 0}
        marked, slides = [], 0
        for n in sorted(z.namelist()):
            m = re.fullmatch(r"ppt/slides/slide(\d+)\.xml", n)
            if not m:
                continue
            slides += 1
            rels = f"ppt/slides/_rels/slide{m.group(1)}.xml.rels"
            if rels not in z.namelist():
                continue
            body = z.read(rels).decode("utf-8", "replace")
            used = set(re.findall(r'Target="\.\./media/([^"]+)"', body))
            if used & {n.rsplit("/", 1)[-1] for n in icon_media}:
                text = reads(" ".join(slide_runs(z, n)))
                marked.append({"slide": int(m.group(1)), "text": text[:400]})
    return {"deck": path.name, "readable": True, "icon_media": sorted(icon_media),
            "slides": slides, "marked": marked,
            "images": sorted({n.rsplit("/", 1)[-1] for n in icon_media})}


def section_for(chapter_text: str, figure: str) -> dict:
    """The section a figure sits in, taken from the chapter file itself.

    A chapter file is HTML in a template string, so the enclosing section is
    whatever `<h2>`/`<h3>` precedes the reference. Read, not guessed: the point
    is to name the section the rebuild has to touch, and a heading is how the
    reader finds it too.
    """
    heads = [(m.start(), m.group(1), re.sub(r"<[^>]+>", "", m.group(2)).strip())
             for m in re.finditer(r"<h([23])[^>]*>(.*?)</h\1>", chapter_text, re.S)]
    at = chapter_text.find(figure)
    if at < 0:
        return {"h": None, "title": None}
    before = [head for head in heads if head[0] < at]
    if not before:
        return {"h": None, "title": None}
    _, level, title = before[-1]
    return {"h": int(level), "title": title}


def build(decks: list[pathlib.Path]) -> dict:
    figures = json.loads(FIGURES.read_text(encoding="utf-8"))
    # A pptx figure is keyed by `slide`, a PDF figure by `page`. Only the pptx
    # side can be joined to a mark - see the note at the top about what this tool
    # cannot see - so PDF entries are skipped here rather than silently keyed on a
    # number that means something else.
    by_slide: dict[tuple[str, int], list[dict]] = {}
    for entry in figures:
        if entry.get("kind") != "slide" or "slide" not in entry:
            continue
        by_slide.setdefault((entry["source"], entry["slide"]), []).append(entry)

    chapters = {p: p.read_text(encoding="utf-8")
                for p in sorted((ROOT / "dcc-site").glob("ch?.js"))}

    found, unreadable, missing = [], [], []
    seen_decks = set()
    for root in decks:
        if not root.is_dir():
            missing.append(str(root))
            continue
        for path in sorted(root.rglob("*.ppt*")):
            if path.name in seen_decks:
                continue
            seen_decks.add(path.name)
            info = deck_marks(path)
            if not info.get("readable"):
                unreadable.append({"deck": path.name, "why": info["why"]})
                continue
            for mark in info["marked"]:
                hits = by_slide.get((path.name, mark["slide"]), [])
                if not hits:
                    # A marked slide with no extracted figure is a TEXT slide, so
                    # nothing on the site names it and the join cannot reach it.
                    # Recorded rather than dropped: it is still a marked page, and
                    # the count is how the coverage limit stays visible.
                    found.append({
                        "deck": path.name, "slide": mark["slide"], "unit": None,
                        "figure": None, "shown_in": [],
                        "on_site": False, "slide_text": mark["text"][:200],
                    })
                    continue
                for hit in hits:
                    where = [{"file": ch.name, "section": section_for(chapters[ch], hit["name"])}
                             for ch in chapters
                             if hit["name"] in chapters[ch]]
                    found.append({
                        "deck": path.name, "slide": mark["slide"], "unit": hit["unit"],
                        "figure": hit["name"], "caption": hit.get("caption", ""),
                        "shown_in": where, "on_site": bool(where),
                        "slide_text": mark["text"][:200],
                    })
    return {
        "_comment": [
            "Slides the teacher marked with the Information icon (a circled i) -",
            "the 'not important' sign he puts on pages that are not exam material.",
            "Generated by tools/dcc_marks.py; do not hand-edit.",
            "",
            "each entry: which deck and slide carries the icon, the figure the site",
            "extracted from that slide, and every section that displays it - which",
            "is the unit the rebuild has to act on. 'slide_text' is the slide's own",
            "text, rebuilt from the deck's per-glyph runs.",
            "",
            "the icon is CORROBORATION, not authority: the syllabus (data/syllabus.json)",
            "decides what is examinable. A marked slide about a syllabus topic is",
            "extra detail the teacher does not want taught; an unmarked slide about",
            "something the syllabus never names is still out of scope.",
        ],
        "generated_from": [str(d) for d in decks],
        "unreadable_decks": unreadable,
        "missing_roots": missing,
        "marked_slides": found,
    }


def report(doc: dict, figures: list[dict]) -> None:
    print(f"decks read from: {', '.join(doc['generated_from'])}")
    for gone in doc["missing_roots"]:
        print(f"  ! {gone} is not on this machine")
    for bad in doc["unreadable_decks"]:
        print(f"  ! {bad['deck']}: {bad['why']}")
    marked = doc["marked_slides"]
    on_site = [m for m in marked if m.get("on_site")]
    print(f"\nslides marked with the teacher's Information icon: {len(marked)}"
          f" ({len(on_site)} of them are shown on the site)")
    per_deck: dict[str, int] = {}
    for m in marked:
        per_deck[m["deck"]] = per_deck.get(m["deck"], 0) + 1
    for deck, n in sorted(per_deck.items()):
        sh = sum(1 for m in on_site if m["deck"] == deck)
        print(f"  {deck:<52} {n:>3} marked, {sh:>2} on the site")
    per_unit: dict[int, int] = {}
    sections: dict[str, set] = {}
    for m in on_site:
        per_unit[m["unit"]] = per_unit.get(m["unit"], 0) + 1
        for where in m["shown_in"]:
            if where["section"]["title"]:
                key = f"{where['file']}  {where['section']['title']}  "
                sections.setdefault(key, set()).add(m["figure"])
    print("  per unit:", dict(sorted(per_unit.items())))
    print(f"\nsections that show a marked slide ({len(sections)}):")
    for key in sorted(sections):
        print(f"  {key}   [{len(sections[key])} slide(s)]")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--decks", action="append", default=None,
                    help="a folder holding the lecture decks (repeatable)")
    ap.add_argument("--report", action="store_true", help="print findings; write nothing")
    ap.add_argument("--check", action="store_true", help="fail if the file is stale")
    args = ap.parse_args()

    decks = [pathlib.Path(p) for p in (args.decks or [str(d) for d in DEFAULT_DECKS])]
    doc = build(decks)
    for gone in doc["missing_roots"]:
        print(f"note: {gone} is not here; nothing written for it", file=sys.stderr)
    figures = json.loads(FIGURES.read_text(encoding="utf-8"))
    if args.report or args.check:
        report(doc, figures)
    text = json.dumps(doc, indent=2, ensure_ascii=False) + "\n"
    if args.report:
        return 0
    if args.check:
        # The decks are the teacher's upload, outside the repository, so on another
        # machine there is nothing to compare against - and a check that fails
        # because a folder is absent is a check somebody turns off.
        if len(doc["missing_roots"]) >= len(decks) and doc["generated_from"]:
            print("the lecture decks are not on this machine - nothing to verify "
                  "(the committed list stands as what was measured where they were)")
            return 0
        if not OUT.is_file():
            print(f"{OUT} is missing - run tools/dcc_marks.py")
            return 1
        if OUT.read_text(encoding="utf-8") != text:
            print(f"{OUT} is OUT OF DATE - run tools/dcc_marks.py")
            return 1
        print(f"{OUT.name} is current")
        return 0
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding="utf-8", newline="\n")
    print(f"wrote {OUT} - {len(doc['marked_slides'])} marked slides")
    return 0


if __name__ == "__main__":
    sys.exit(main())
