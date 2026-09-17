#!/usr/bin/env python3
"""A reference to a section number the page no longer carries, as a gate step.

What this is for
----------------
The sub-numbers below the syllabus's own were stripped from the headings: the
syllabus numbers `1.4` and `8.4`, so those stay, and everything under them keeps
only its words (`1.4.4 Fundamental models` became `Fundamental models`). The
strip was checked with a heading-shaped search - `<h[234]>x.y.z` - and reported
as complete. It was complete *in the headings*: fifteen citations were sitting in
body text the whole time, where the heading search never looked.

  - "the failure model of 1.4.4"                       (ch1, a table cell)
  - "the isolation rule of 6.1.3"                      (ch6, prose)
  - "the extreme end of elasticity from 5.2.1"         (ch7, a list item)
  - "the container definition in 6.2.2"                (ch9, a table cell)
  - "It is the same idea as DBaaS in Unit 7.2.3"       (ch9, a quiz explanation)

Every one of those points a reader at a section that no longer exists. The lesson
is narrow and worth writing down: **a reference is not where the thing you
deleted used to be**, so the check has to read everything the reader can be
shown, not the place the edit happened.

What it reads
-------------
The same values `tools/escape_audit.py` walks - the nine chapter files through
node (`tools/dump_dcc.js`) and the hand-written catalogues applied into them -
plus the two data files the build renders into the page directly
(`off_syllabus_slides.json` for the Reference tab's group headings,
`reference_figs.json` for its catalogue). A three-part number anywhere in a
value the reader is shown fails.

Two things are deliberately *not* defects:

  * a **two-part** number - those are the syllabus's own sub-topics (`5.3`,
    `8.1`) and naming them is how a cross-reference stays useful;
  * a **version** such as `0.23` - two parts again, and HDFS's release series is
    the one that appears.

The other data files that carry three-part numbers (`syllabus_map.json`,
`caption_changes.json`, `emphasis_decisions.json`, `voice_curate_*.json`) are
journals of passes that ran while the numbering existed. They are read by their
own tools, not rendered, and rewriting a journal to hide what it recorded would
make it useless. The chapters and the two rendered catalogues are the boundary.

A key whose name starts with `_` is skipped as well: that is how these files
carry their own `_comment` blocks and how the voice catalogue keeps its
`_superseded` list, and all three are written for whoever reads the file next,
not for the page. A comment that explains the old numbering has to be able to
name it.

    python tools/stale_refs.py            # the check; exit 1 on a defect
    python tools/stale_refs.py --show 10  # show more than the first few hits
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

# `1.4.4`, `6.2.2`, `8.1.1` - a number three levels deep, which the syllabus
# never uses. Word boundaries keep `192.168.1.1` and `0.23.1`-style versions out
# where they do not start a token, and the two-part syllabus numbers are simply
# not matched.
THREE_PART = re.compile(r"(?<![\d.])\d\.\d\.\d(?![\d.])")

# The catalogues applied into the chapter fields, and the two data files the
# build renders into the page itself.
CATALOGUES = ("dcc_revise.json", "dcc_rev.json", "dcc_teach.json")
RENDERED = ("off_syllabus_slides.json", "reference_figs.json")


def walk(value, where, hits):
    """Every string under `value`, with the path that reaches it.

    One hit per string, not per number: a cell with two stale references is one
    cell to fix, and counting them pads the report without adding a place to look.
    """
    if isinstance(value, str):
        m = THREE_PART.search(value)
        if m:
            lo = max(0, m.start() - 60)
            hits.append((where, m.group(0), value[lo:m.end() + 60].replace("\r", "").replace("\n", " ")))
    elif isinstance(value, dict):
        for key, item in value.items():
            # `_comment`, `_superseded` and friends are addressed to the next
            # maintainer, not to the reader, so they are outside this check.
            if isinstance(key, str) and key.startswith("_"):
                continue
            walk(item, f"{where}/{key}", hits)
    elif isinstance(value, list):
        for i, item in enumerate(value):
            walk(item, f"{where}[{i}]", hits)


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
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError):
        pass
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0],
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--show", type=int, default=6, metavar="N",
                    help="how many hits to print (default 6)")
    args = ap.parse_args()

    hits: list[tuple[str, str, str]] = []

    data, problem = chapter_data()
    if problem:
        print(f"stale_refs: FAIL - {problem}", file=sys.stderr)
        return 1
    for n, chapter in sorted(data.items(), key=lambda kv: int(kv[0]) if kv[0].isdigit() else 999):
        walk(chapter, f"ch{n}", hits)

    for name in CATALOGUES + RENDERED:
        path = ROOT / "data" / name
        if not path.exists():
            print(f"stale_refs: FAIL - data/{name} is missing", file=sys.stderr)
            return 1
        try:
            walk(json.loads(path.read_text(encoding="utf-8")), name, hits)
        except json.JSONDecodeError as exc:
            print(f"stale_refs: FAIL - data/{name} does not parse: {exc}", file=sys.stderr)
            return 1

    if hits:
        print(f"stale_refs: FAIL - {len(hits)} three-part section reference(s) reach the page.",
              file=sys.stderr)
        print("  The syllabus numbers a sub-topic two levels deep (8.4), never three - so a",
              file=sys.stderr)
        print("  three-part number cites a heading that no longer carries it. Name the",
              file=sys.stderr)
        print("  section, or drop the pointer: the sentence usually already says what it",
              file=sys.stderr)
        print("  was pointing at.", file=sys.stderr)
        for where, number, excerpt in hits[:args.show]:
            print(f"    {where}: [{number}] …{excerpt}…", file=sys.stderr)
        if len(hits) > args.show:
            print(f"    … and {len(hits) - args.show} more", file=sys.stderr)
        return 1

    values = sum(1 for c in data.values() if isinstance(c, dict))
    print(f"stale_refs: OK - {values} chapter(s) and {len(CATALOGUES) + len(RENDERED)} "
          f"catalogue(s) cite no section the syllabus does not number")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
