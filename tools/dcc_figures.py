#!/usr/bin/env python3
"""The contract every hand-drawn DCC figure must meet, as a gate step.

What this is for
----------------
`tools/check_figures.js` re-derives this contract for the *Simulation* portal,
and it reads that portal's chapters: `require('../ch' + n + '.js')`, root level,
one to eight. The DCC site's nine chapters live in `dcc-site/`, so its
twenty-two hand-drawn SVG figures have never been through a check at all - they
were drawn by hand and trusted.

Two defects were sitting in them, both invisible to every other gate because
every other gate reads text:

  * **Fig 6.2** (two-level memory mapping) put its two footnote lines at
    `x="150"` with `text-anchor="middle"`. The strings are 89 and 85 characters
    wide, so they began at x = -95 in a 760-wide viewBox: the first half of both
    sentences was clipped off the left edge, and the second line's descenders ran
    past the bottom of a 260-tall box as well.
  * **Fig 9.1** (edge, fog and cloud) had a fourth line inside the cloud box
    ending 26 units past the right edge, so the last word of "…archives, heavy
    analytics" was cut in half.

The words were right, the captions were right, the syllabus was right, and the
gate was green. What was wrong was geometry, and no check looked at geometry.

What it checks
--------------
The same rules `check_figures.js` applies, over `dcc-site` instead of the root:
every `<svg>` is wrapped in exactly one `<figure>` carrying exactly one
`<figcaption>`; the `<svg>` is `role="img"` with a descriptive `aria-label` and
a viewBox of four numbers with positive extent; no figure writes a colour or a
`style=""` into its markup; every marker id is defined once in the whole site and
every `marker-end` resolves inside its own figure; every `<text>` carries a class
(an unstyled one renders browser-black in both themes); no text box leaves its
viewBox; and the captions are numbered `Fig <chapter>.<n>` in reading order.

Two things here are *not* in `check_figures.js`, and are additions:

  * the SVG is **parsed as XML**, so an unclosed tag or a stray `<` fails. The
    JavaScript checker matches tags with regular expressions, which cannot see
    either. HTML entities are neutralised before parsing (`&mdash;` and friends
    are legal in the page but undefined in bare XML), so this is a check for
    well-formed *markup*, not for entity declarations;
  * the figure is identified by the **number in its caption** (`ch9 learn
    figure#3 (Fig 9.3)`) rather than by index, because that is the name a
    maintainer has in front of them.

Widths are estimated per character with `check_figures.js`'s own table, so the
two checkers agree on any figure they both see, and a box must exceed its viewBox
by more than SLACK units to fail. Boxes positioned by a transform (rotated axis
labels) are skipped: no layout engine, no box. The estimate is a little wide by
design - it fails the gross case, it does not prove a layout.

    python tools/dcc_figures.py          # the check; exit 1 on a defect
"""

from __future__ import annotations

import argparse
import html
import json
import pathlib
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent

SLACK = 8.0  # units of viewBox overflow tolerated before failing

FIGURE = re.compile(r"<figure[\s\S]*?</figure>")
SVG_OPEN = re.compile(r"<svg\b([^>]*)>")
CAPTION = re.compile(r"<figcaption[^>]*>([\s\S]*?)</figcaption>")
TEXT = re.compile(r"<text\b([^>]*)>([\s\S]*?)</text>")
MARKER_DEF = re.compile(r'<marker[^>]*\bid="([^"]+)"')
MARKER_REF = re.compile(r'marker-(?:end|start|mid)="url\(#([^)]+)\)"')
CAPTION_NUM = re.compile(r"^Fig\s+(\d)\.(\d)\b")

# Entities the page may use that bare XML does not define. `&lt;` and `&amp;`
# stay, because a document that means them has to escape them and an unescaped
# `<` is exactly what this parse is here to catch.
XML_BUILTIN = {"amp", "lt", "gt", "quot", "apos"}

# The tags the HTML parser treats as a break out of foreign content. Inside an
# <svg> any one of them ends the SVG and hands the rest of the markup back to the
# HTML parser, so the labels after it are never drawn - they reappear as loose
# text under the diagram. Fig 4.2 wrote `<em>where</em>` inside a label and lost
# its last two lines that way. `<tspan>` is the SVG element for this; the CSS
# class `.flow-em` is what makes it italic.
HTML_BREAKOUT = re.compile(
    r"</?(?:b|big|blockquote|body|br|center|code|dd|div|dl|dt|em|embed|h[1-6]|head|hr"
    r"|i|img|li|listing|menu|meta|nobr|ol|p|pre|ruby|s|small|span|strong|strike|sub"
    r"|sup|table|tt|u|ul|var|font)\b[^>]*>", re.I)


def xml_safe(svg: str) -> str:
    return re.sub(r"&([A-Za-z][A-Za-z0-9]*);",
                  lambda m: m.group(0) if m.group(1) in XML_BUILTIN else "X", svg)


def advance(ch: str) -> float:
    """Advance width in em. The table is check_figures.js's, character for character."""
    if ch == " ":
        return 0.28
    if ch in "iljftr":
        return 0.33
    if ch in "mw":
        return 0.86
    if ch in "IJ":
        return 0.30
    if ch in "MW":
        return 0.88
    if "a" <= ch <= "z":
        return 0.55
    if "A" <= ch <= "Z":
        return 0.70
    if "0" <= ch <= "9":
        return 0.60
    if ch in ".,:;!|'`\"()[]":
        return 0.28
    if ch in "-\u2212\u2013\u2014":
        return 0.75
    return 0.72  # arrows, middle dots, Greek


def est_width(text: str, size: float, mono: bool, tracking: float) -> float:
    """The advance table plus the class's own letter-spacing.

    Letter-spacing is not decoration to a width estimate: `.flow-label` carries
    `letter-spacing: 0.04em`, which is 0.46px on every character. Ignoring it put
    a browser-measured 412.6-unit label at 372 - and that 10% is the difference
    between `check_figures.js`'s flat estimate and the truth, which is how Fig
    9.1's cloud line sat 46 units past the edge while an estimate said 26.
    """
    if mono:
        return len(text) * 0.60 * size
    return (sum(advance(c) for c in text) + tracking * len(text)) * size


def font_of(attrs: str) -> tuple[bool, float, float]:
    """Font size and tracking from the classes a figure uses; an unknown class
    assumes the largest size and no tracking, the same as the body text.

    `.flow-label { font-size: 11.5px; letter-spacing: 0.04em }` and
    `.flow-text { font-size: 15px }` in assets/css/foundation.css are the only
    two classes any DCC figure puts on a `<text>`, and both are read from there.
    """
    mono = bool(re.search(r'class="[^"]*\bmono\b', attrs))
    size, tracking = 13.0, 0.0
    if re.search(r"\bsm\b", attrs):
        size = 11.0
    if mono:
        size = 12.0
    if re.search(r"\bflow-text\b", attrs):
        size = 15.0
    if re.search(r"\bflow-label\b", attrs):
        size, tracking = 11.5, 0.04
    return mono, size, tracking


def anchor_of(attrs: str) -> str:
    """Where the text is anchored - the attribute first, then the class.

    Only `.flow-text` declares `text-anchor: middle` in CSS. A `.flow-label`
    without the attribute anchors at `start` like any other SVG text, so
    assuming `middle` for it would quietly halve an overflow to the right.
    """
    if 'text-anchor="start"' in attrs or re.search(r'class="[^"]*\bstart\b', attrs):
        return "start"
    if 'text-anchor="end"' in attrs or re.search(r'class="[^"]*\bend\b', attrs):
        return "end"
    if 'text-anchor="middle"' in attrs or re.search(r"\bflow-text\b", attrs):
        return "middle"
    return "start"


def chapter_data() -> tuple[dict, str]:
    """The runtime chapter data, or a message saying why it could not be read."""
    try:
        proc = subprocess.run(["node", "tools/dump_dcc.js", "--fields"], cwd=ROOT,
                              capture_output=True, text=True, encoding="utf-8",
                              errors="replace", timeout=120)
    except FileNotFoundError:
        return {}, "node is not on PATH, so the chapter values cannot be read"
    except subprocess.TimeoutExpired:
        return {}, "node timed out reading the chapter values"
    if proc.returncode != 0:
        return {}, f"tools/dump_dcc.js exited {proc.returncode}: {proc.stderr.strip()[:300]}"
    try:
        return json.loads(proc.stdout), ""
    except json.JSONDecodeError as exc:
        return {}, f"tools/dump_dcc.js did not print JSON: {exc}"


def main() -> int:
    # Both streams: a failure message quotes the label that left its viewBox, and
    # a label is page text - it can carry an em dash or a middle dot that the
    # console's default code page cannot encode.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, OSError):
            pass
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0],
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--show", type=int, default=8, metavar="N",
                    help="how many defects to print (default 8)")
    args = ap.parse_args()

    data, problem = chapter_data()
    if problem:
        print(f"dcc_figures: FAIL - {problem}", file=sys.stderr)
        return 1

    problems: list[str] = []
    marker_ids: dict[str, str] = {}
    figures = labels = drawn = 0
    order_high: dict[int, int] = {}
    seen_numbers: set[str] = set()

    def fail(msg: str) -> None:
        problems.append(msg)

    for key, chapter in sorted(data.items(), key=lambda kv: int(kv[0]) if kv[0].isdigit() else 999):
        if not isinstance(chapter, dict):
            continue
        ch = int(key) if key.isdigit() else 0
        occurrences = [("learn", chapter.get("learn") or "")]
        for i, p in enumerate(chapter.get("past") or []):
            if isinstance(p, dict) and p.get("answer"):
                occurrences.append((f"past[{i}]", p["answer"]))

        for where, source in occurrences:
            found = FIGURE.findall(source)
            if source.count("<svg") > len(found):
                fail(f"ch{ch} {where}: {source.count('<svg')} <svg> but only {len(found)} "
                     f"<figure> - a figure must be wrapped")

            for index, fig in enumerate(found, 1):
                figures += 1
                svgs = SVG_OPEN.findall(fig)
                kind = svgs[0] if svgs else ""
                caps = CAPTION.findall(fig)
                caption = re.sub(r"<[^>]*>", "", caps[0]).strip() if caps else ""
                num = CAPTION_NUM.match(caption)
                if not svgs:
                    continue                      # a deck picture placed in the notes
                drawn += 1
                tag = f"ch{ch} {where} figure#{index}" + (f" (Fig {num.group(1)}.{num.group(2)})"
                                                          if num else "")

                if len(svgs) != 1:
                    fail(f"{tag}: expected exactly one <svg>, found {len(svgs)}")
                    continue
                if len(caps) != 1:
                    fail(f"{tag}: expected exactly one <figcaption>, found {len(caps)}")
                    continue

                attrs = kind
                if 'role="img"' not in attrs:
                    fail(f"{tag}: <svg> has no role=\"img\"")
                aria = (re.search(r'aria-label="([^"]*)"', attrs) or [None, ""])[1]
                if len(aria.strip()) < 20:
                    fail(f'{tag}: aria-label is missing or too short ("{aria}")')
                vb = (re.search(r'viewBox="([^"]*)"', attrs) or [None, ""])[1]
                box = [float(v) for v in re.split(r"[\s,]+", vb.strip())] if vb else []
                if len(box) != 4 or box[2] <= 0 or box[3] <= 0:
                    fail(f'{tag}: viewBox "{vb}" is not four numbers with a positive extent')
                    continue
                vx, vy, vw, vh = box

                if 'style="' in fig:
                    fail(f"{tag}: inline style= inside a figure - use a class token")
                hexes = re.findall(r'(?:fill|stroke)="#[0-9a-fA-F]{3,8}"', fig)
                if hexes:
                    fail(f"{tag}: hard-coded colour {', '.join(hexes)} inside a figure")

                svg = fig[fig.index("<svg"):fig.index("</svg>") + 6]
                try:
                    ET.fromstring(xml_safe(svg))
                except ET.ParseError as exc:
                    fail(f"{tag}: the drawing is not well-formed XML: {exc}")

                breakout = HTML_BREAKOUT.findall(svg)
                if breakout:
                    fail(f"{tag}: {', '.join(sorted(set(breakout)))} inside the <svg> - the "
                         f"HTML parser leaves the drawing there and drops every label "
                         f"after it (use <tspan class=\"flow-em\"> for emphasis)")

                defined = set(MARKER_DEF.findall(svg))
                for mid in defined:
                    if mid in marker_ids:
                        fail(f'{tag}: marker id "{mid}" is already used in {marker_ids[mid]}')
                    marker_ids[mid] = tag
                for ref in MARKER_REF.findall(svg):
                    if ref not in defined:
                        fail(f"{tag}: marker references #{ref}, which is not defined in this figure")

                for t in TEXT.finditer(svg):
                    labels += 1
                    t_attrs, raw = t.group(1), t.group(2)
                    # Unescape for the report only: `&mdash;` is one character to
                    # the reader, and quoting the source form in a failure makes
                    # the message harder to find on the page.
                    text = html.unescape(re.sub(r"<[^>]*>", "", raw))
                    if 'class="' not in t_attrs:
                        fail(f'{tag}: <text> "{text[:24]}" has no class '
                             f"(it would render browser-black)")
                    if re.search(r"\btransform=", t_attrs):
                        continue                  # rotated: no box without a layout engine
                    mono, size, tracking = font_of(t_attrs)
                    xm = re.search(r'\bx="([^"]+)"', t_attrs)
                    ym = re.search(r'\by="([^"]+)"', t_attrs)
                    if not xm or not ym:
                        continue
                    try:
                        x, y = float(xm.group(1)), float(ym.group(1))
                    except ValueError:
                        continue
                    anchor = anchor_of(t_attrs)
                    w = est_width(text, size, mono, tracking)
                    x0 = x if anchor == "start" else (x - w if anchor == "end" else x - w / 2)
                    x1 = x0 + w
                    y0, y1 = y - size * 0.80, y + size * 0.28
                    over = max(vx - x0, x1 - (vx + vw), vy - y0, y1 - (vy + vh))
                    if over > SLACK:
                        side = ("left" if vx - x0 == over else "right" if x1 - (vx + vw) == over
                                else "top" if vy - y0 == over else "bottom")
                        fail(f'{tag}: <text> "{text[:40]}" leaves the viewBox by {over:.1f} '
                             f"at the {side} (x {x0:.0f}..{x1:.0f}, y {y0:.0f}..{y1:.0f} "
                             f"in {vw:g}x{vh:g})")

                if not num:
                    fail(f'{tag}: caption does not start with "Fig <chapter>.<n>": '
                         f'"{caption[:40]}"')
                    continue
                if int(num.group(1)) != ch:
                    fail(f"{tag}: caption says Fig {num.group(1)}.{num.group(2)} but it is "
                         f"in chapter {ch}")
                number = f"{num.group(1)}.{num.group(2)}"
                if number in seen_numbers:
                    continue                      # a reused figure keeps its number
                seen_numbers.add(number)
                n = int(num.group(2))
                if n <= order_high.get(ch, 0):
                    fail(f"{tag}: Fig {number} appears after a later figure of chapter {ch}")
                else:
                    order_high[ch] = n

    if problems:
        print(f"dcc_figures: FAIL - {len(problems)} defect(s) in the notes' drawings.",
              file=sys.stderr)
        print("  A drawing is checked as a drawing: a label whose box leaves the viewBox is",
              file=sys.stderr)
        print("  text the reader cannot read, and an HTML tag inside the <svg> costs the",
              file=sys.stderr)
        print("  labels after it their place in the drawing. Fix the x/y, the viewBox, the",
              file=sys.stderr)
        print("  line break or the tag - not the caption.", file=sys.stderr)
        for p in problems[:args.show]:
            print(f"    {p}", file=sys.stderr)
        if len(problems) > args.show:
            print(f"    … and {len(problems) - args.show} more", file=sys.stderr)
        return 1

    print(f"dcc_figures: OK - {drawn} drawn figure(s) and {labels} label(s) read, "
          f"{len(marker_ids)} marker(s), every box inside its viewBox")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
