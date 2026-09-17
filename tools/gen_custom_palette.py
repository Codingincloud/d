#!/usr/bin/env python3
"""Regenerate [data-theme="custom"] in tokens.css from custom-theme.js.

The reader-tinted mode's palette is derived, so the block that stands in for it
in the stylesheet cannot be typed by hand - it would be a second, silent copy of
the derivation that no test could see drift. This asks the derivation itself for
the seed palette, renders it as a token block, and drops it in.

    python tools/gen_custom_palette.py            # rewrite it in place
    python tools/gen_custom_palette.py --check    # fail if it is out of date

`--check` is what CI-style use looks like: it is the same comparison
tools/test_custom_theme.js makes, available when node is not.

Change DEFAULT_ACCENT or DEFAULT_SURFACE in custom-theme.js, run this, and the
fallback follows. tools/test_custom_theme.js fails if you forget.
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOKENS = ROOT / "assets" / "css" / "tokens.css"
DERIVATION = ROOT / "custom-theme.js"

HEADER = '''/* ==========================================================================
   CUSTOM - the mode the reader tints. "Yours."

   Unlike the eight above, this palette is not written down anywhere: it is
   DERIVED at runtime by custom-theme.js from two colours the reader picks, and
   applied as inline custom properties on <html>, which outrank this block.

   So what is this? Two things, and both matter:

     1. THE FALLBACK. A reader who has selected Custom but has never opened the
        picker - or who has cleared site data mid-session - needs a palette, and
        without one every token in this mode is UNDEFINED, which is a blank
        page, not a default. This is the palette they get.
     2. THE FOURTH LIST. tokens.css, THEMES in app.js and the boot script in
        each entry page all have to agree about which mode ids exist, and
        tools/check_themes.py checks that they do. A derived mode still needs an
        id in all four.

   THIS BLOCK IS GENERATED, NOT EDITORIAL - by tools/gen_custom_palette.py, from
   what derive(DEFAULT_ACCENT, DEFAULT_SURFACE) actually returns. Do not retouch
   the values: change DEFAULT_ACCENT or DEFAULT_SURFACE in custom-theme.js and
   regenerate. tools/test_custom_theme.js fails if the two ever disagree, so the
   fallback can never become a palette the derivation itself would not produce.
   ========================================================================== */
'''

# The block AND its banner comment, because the banner is generated too. The
# comment is optional in the pattern so that a block written by an older version
# of this tool - with older wording in the banner - is still replaced rather than
# duplicated.
#
# The `(?:(?!\*/).)*` is not decoration. A plain `.*?` in that position can
# extend PAST the end of a comment it starts in, because `.*?` will happily eat
# `*/`; re.search then matches a span running from an arbitrary earlier comment
# all the way to this block, and the substitution deletes everything in between.
# That is not hypothetical: the first version of this file was exactly that, and
# it silently deleted the light palette, the print palette and all six of the
# extra modes from tokens.css, leaving a 67-line file that still parsed.
BLOCK_RE = re.compile(r'(?:/\*(?:(?!\*/).)*\*/\n)?\[data-theme="custom"\] \{.*?\n\}\n', re.S)


def ask_the_derivation():
    """Run custom-theme.js in node and read the seed palette out of it."""
    script = (
        "const vm=require('vm'),fs=require('fs');"
        "const ctx={window:{}};vm.createContext(ctx);"
        f"vm.runInContext(fs.readFileSync({json.dumps(str(DERIVATION))},'utf8'),ctx,"
        "{filename:'custom-theme.js'});"
        "const ct=ctx.window.CustomTheme,t=ct.seed();"
        "console.log(JSON.stringify({tokens:ct.TOKENS,t:t,kind:t.kind}));"
    )
    try:
        out = subprocess.run(["node", "-e", script], cwd=ROOT, capture_output=True,
                             text=True, encoding="utf-8", errors="replace", timeout=60)
    except FileNotFoundError:
        print("node is not on PATH, and this generator needs it to run the derivation")
        return None
    if out.returncode != 0:
        print(out.stdout + out.stderr)
        return None
    return json.loads(out.stdout)


def render(data):
    tokens, values, kind = data["tokens"], data["t"], data["kind"]
    width = max(len(n) for n in tokens)
    body = "\n".join(f"  --{n}:{' ' * (width - len(n) + 1)}{values[n]};" for n in tokens)
    return f'{HEADER}[data-theme="custom"] {{\n{body}\n\n  color-scheme: {kind};\n}}\n'


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true",
                    help="do not write; fail if tokens.css disagrees with the derivation")
    args = ap.parse_args()

    data = ask_the_derivation()
    if data is None:
        return 1
    want = render(data)
    src = TOKENS.read_text(encoding="utf-8")

    if not BLOCK_RE.search(src):
        if args.check:
            print('tokens.css has no [data-theme="custom"] block - run this generator')
            return 1
        # No block yet: place it after the last hand-written mode, so the modes
        # stay contiguous and a reader scrolling the file meets them in order.
        last = None
        for m in re.finditer(r'\[data-theme="[a-z0-9]+"\] \{.*?\n\}\n', src, re.S):
            last = m
        if last is None:
            print("could not find any [data-theme] block to insert after")
            return 1
        src = src[:last.end()] + "\n" + want + src[last.end():]
        TOKENS.write_text(src, encoding="utf-8", newline="")
        print(f'inserted [data-theme="custom"] after {last.group(0)[:24]}...')
        return 0

    if BLOCK_RE.search(src).group(0) == want:
        print(f'[data-theme="custom"] is up to date '
              f'({data["kind"]}, --bg {data["t"]["bg"]}, --pri {data["t"]["pri"]})')
        return 0

    if args.check:
        print('tokens.css [data-theme="custom"] is OUT OF DATE.')
        print("  the derivation's seed and the fallback block disagree - run")
        print("  python tools/gen_custom_palette.py")
        return 1

    out = BLOCK_RE.sub(lambda _: want, src, count=1)

    # THE GUARD. This tool rewrites a token file it does not own, and the failure
    # mode is silent: a substitution that eats more than it should leaves a CSS
    # file that still parses, still has a [data-theme="custom"] block, and has
    # lost the other eight palettes. So nothing is written unless the file still
    # has every marker it had before, plus one more token block and no fewer.
    before_tokens = src.count('[data-theme="custom"]')
    after_tokens = out.count('[data-theme="custom"]')
    for marker, want_count in [('[data-theme="light"]', 1), ('[data-theme="dark"]', 1),
                               ('@media print', 1), (':root', 1),
                               ('[data-width="full"]', 1)]:
        if out.count(marker) < want_count:
            print(f'REFUSING TO WRITE: the substitution removed {marker!r} from '
                  f'tokens.css (had it, no longer does).')
            print('  Nothing was changed. Check BLOCK_RE before retrying.')
            return 1
    if out.count('[data-theme="romantic"]') != 1 or after_tokens != before_tokens:
        print('REFUSING TO WRITE: the substitution changed the number of token blocks.')
        return 1

    TOKENS.write_text(out, encoding="utf-8", newline="")
    print(f'regenerated [data-theme="custom"] '
          f'({data["kind"]}, --bg {data["t"]["bg"]}, --pri {data["t"]["pri"]})')
    return 0


if __name__ == "__main__":
    sys.exit(main())
