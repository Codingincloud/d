#!/usr/bin/env python3
"""The doubled-backslash artifact, as a gate step.

What this is for
----------------
Unit 8's Revise block was written with doubled backslashes. Its line breaks
rendered as the visible text `\\r\\n` on the page, and every existing check
stayed green while it did: the words were correct, the block was under the word
cap, and the plan and the page agreed with each other. The only thing that caught
it was a person looking at the built page. A gate that needs a person looking is
not a gate, so this is the missing step.

The distinction it draws is between two strings a source file can produce and a
reader cannot tell apart until it renders:

  * a **real** line break - the source writes a newline (or, in JSON, the escape
    `\\n`, which the parser resolves) and the reader gets a break;
  * a **literal** escape - the source writes `\\\\n`, the parser resolves that to
    the two characters `\\` and `n`, and the reader gets those two characters as
    visible text in the middle of a sentence.

Only the second is a defect, and it cannot be found by reading the source: the
question is what the *value* is, after the engine has resolved the escapes. So
this tool asks the engine. It requires the nine DCC chapter files with a fresh
`window` (`tools/dump_dcc.js`) and walks every string a reader can be shown -
`learn`, `reference`, `slides`, `revise`, `quiz`, `past` - then walks the three
hand-written catalogues that are applied *into* those fields (`dcc_revise.json`,
`dcc_rev.json`, `dcc_teach.json`), so a bad block is caught at the plan as well
as at the page.

A literal `\\r` or `\\n` anywhere in a value fails. There is no length floor and no
carve-out: a line break is a line break, and the fix is always to write one.

    python tools/escape_audit.py            # the check; exit 1 on a defect
    python tools/escape_audit.py --show 10  # show more than the first few hits
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

# The two sequences a reader must never be shown, as the characters that reach
# the page: a backslash followed by r or n.
LITERAL = re.compile(r"\\[rn]")

# The catalogues applied into the chapter fields, with the key path each value
# lives at so a failure names the block rather than the file.
CATALOGUES = ("dcc_revise.json", "dcc_rev.json", "dcc_teach.json")


def walk(value, where, hits):
    """Every string under `value`, with the path that reaches it.

    One hit per string, not per match: a block with four bad line breaks is one
    block to fix, and counting its escapes pads the report without adding a
    place to look.
    """
    if isinstance(value, str):
        m = LITERAL.search(value)
        if m:
            lo = max(0, m.start() - 40)
            hits.append((where, value[lo:m.end() + 40].replace("\r", "").replace("\n", " ")))
    elif isinstance(value, dict):
        for key, item in value.items():
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

    hits: list[tuple[str, str]] = []

    data, problem = chapter_data()
    if problem:
        print(f"escape_audit: FAIL - {problem}", file=sys.stderr)
        return 1
    for n, chapter in sorted(data.items(), key=lambda kv: int(kv[0]) if kv[0].isdigit() else 999):
        walk(chapter, f"ch{n}", hits)

    for name in CATALOGUES:
        path = ROOT / "data" / name
        if not path.exists():
            print(f"escape_audit: FAIL - data/{name} is missing", file=sys.stderr)
            return 1
        try:
            walk(json.loads(path.read_text(encoding="utf-8")), name, hits)
        except json.JSONDecodeError as exc:
            print(f"escape_audit: FAIL - data/{name} does not parse: {exc}", file=sys.stderr)
            return 1

    if hits:
        print(f"escape_audit: FAIL - {len(hits)} literal \\r or \\n escape(s) reach the page.",
              file=sys.stderr)
        print("  The value contains the two characters, not a line break. Write a real",
              file=sys.stderr)
        print("  newline instead of \\\\n (in JSON, a source \\n - one backslash).", file=sys.stderr)
        for where, excerpt in hits[:args.show]:
            print(f"    {where}: …{excerpt}…", file=sys.stderr)
        if len(hits) > args.show:
            print(f"    … and {len(hits) - args.show} more", file=sys.stderr)
        return 1

    fields = sum(1 for c in data.values() if isinstance(c, dict))
    print(f"escape_audit: OK - {fields} chapter(s) and {len(CATALOGUES)} catalogue(s) "
          f"carry no literal \\r or \\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
