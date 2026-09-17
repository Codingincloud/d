#!/usr/bin/env python3
"""Render every reading mode side by side into one sheet, and stand back.

A contrast ratio tells you a pair is legible. It does not tell you whether a mode
looks muddy, whether the callouts read as panels, or whether the two dark modes
are distinguishable from each other - and eight of those judgements per release,
made by squinting at one mode at a time in a browser, is how a palette ships with
four colours that all read the same.

So the sheet is a grid: one row per mode, one cell at laptop width and one at
phone width. AND THE CELLS ARE THE REAL PAGES, not a copy of their markup. Each
cell is an iframe pointed at the app with a shared appearance link -

    index.html?t=<mode>&w=<width>#/learn/ch/1

which is the same `?t=&w=&c=` format custom-theme.js defines for cross-device
sync (see the note there). A hand-drawn sample would have been half the size and
would have drifted the first time foundation.css changed a class name; this
cannot, because there is no second copy of anything.

    python tools/make_theme_sheet.py                 # write the sheet
    python tools/make_theme_sheet.py --check         # fail if it is out of date

Run it AFTER tools/build_deploy.py: the sheet lives inside the built bundle (so
it can be opened from the published URL, and so `index.html` next to it is the
bundle's), and the build rewrites that directory.

ONE SIDE EFFECT, IN FULL. A cell is the app, so a cell applies its own mode - and
the app persists what it applies. Opening the sheet therefore leaves the LAST
cell's mode stored on that device. That is why the sheet is an author tool
documented in .freebuff/run.md and not linked from the site: it is here to look
at, not to visit. The reader's own choice is one click away in the palette.
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path

# The mode list comes from app.js and the colours from tokens.css, borrowed from
# the theme gate rather than re-parsed here: the sheet has to agree with the
# picker about which modes exist, and two parsers is two things to drift.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from check_themes import APPJS, ROOT, app_registry, theme_blocks  # noqa: E402

TOKENS = ROOT / "assets" / "css" / "tokens.css"
DERIVATION = ROOT / "custom-theme.js"

# The same five roles a mode's strip is drawn from everywhere else (the top-bar
# button, the picker tiles, the boot cache): page, sidebar, tint, brand, ink.
# Read out of tokens.css rather than from app.js's literal `strip` array, because
# tokens.css is what actually renders - and for `custom` it is the seed palette,
# which is the point of showing it.
STRIP = ("bg", "bg-side", "pri-bg", "pri", "t1")

# Two colours the reader might plausibly pick, so the derived row shows the
# derivation doing something rather than showing the seed palette twice.
SAMPLES = [("#0f7b6c", "#f4f1ea"), ("#e0457b", "#141018")]

# Laptop width is a real 1440px viewport scaled down; phone is a real 390px one
# at 100%. The scale is what lets both fit in one row, and it is applied to the
# WRAPPER as well as the iframe so the row still lays out when the browser has
# `zoom` and clips gracefully when it does not.
LAPTOP_W, LAPTOP_ZOOM = 1440, 0.45
PHONE_W = 390
CELL_H = 560


def seed_palettes():
    """Run the derivation itself for the sample colours (never a second copy)."""
    script = (
        "const vm=require('vm'),fs=require('fs');"
        "const ctx={window:{}};vm.createContext(ctx);"
        f"vm.runInContext(fs.readFileSync({json.dumps(str(DERIVATION))},'utf8'),ctx,"
        "{filename:'custom-theme.js'});"
        "const ct=ctx.window.CustomTheme;"
        f"console.log(JSON.stringify({json.dumps(SAMPLES)}.map(function(p){{"
        "const t=ct.derive(p[0],p[1]);return {a:p[0],s:p[1],kind:t.kind,strip:"
        "ct.pack(t,p[0],p[1]).strip};})))"
    )
    try:
        out = subprocess.run(["node", "-e", script], cwd=ROOT, capture_output=True,
                             text=True, encoding="utf-8", errors="replace", timeout=60)
    except FileNotFoundError:
        print("node is not on PATH, and this tool needs it to run the derivation")
        return None
    if out.returncode != 0:
        print(out.stdout + out.stderr)
        return None
    return json.loads(out.stdout)


def rows():
    registry = app_registry(APPJS.read_text(encoding="utf-8"))
    blocks = theme_blocks(TOKENS.read_text(encoding="utf-8"))
    out = []
    for mid, meta in registry.items():
        t = blocks.get(mid)
        if not t:
            print(f"app.js lists the mode {mid!r} but tokens.css has no block for it")
            return None
        out.append({"id": mid, "name": meta["name"], "kind": meta["kind"],
                    "link": f"?t={mid}", "caveat": None,
                    "strip": [t[k] for k in STRIP]})
    samples = seed_palettes()
    if samples is None:
        return None
    for s in samples:
        accent, surface = s["a"].lstrip("#"), s["s"].lstrip("#")
        out.append({"id": "custom:" + accent, "name": "Yours · derived",
                    "kind": s["kind"], "link": f"?c={accent},{surface}",
                    "caveat": "from " + s["a"] + " + " + s["s"],
                    "strip": s["strip"]})
    return out


CSS = """
:root { color-scheme: light; }
* { box-sizing: border-box; }
body { margin: 0; padding: 28px 24px 64px; background: #f2f0ec; color: #22201c;
       font: 14px/1.55 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
h1 { font-size: 21px; margin: 0 0 6px; }
.lede { max-width: 76ch; margin: 0 0 8px; color: #4a463f; }
.note { max-width: 76ch; margin: 0 0 26px; padding: 10px 12px; background: #fdf6e8;
        border: 1px solid #e8d9b8; border-radius: 8px; font-size: 13px; color: #5b4a26; }
.sheet { display: grid; gap: 22px; max-width: 1180px; }
.row { background: #fff; border: 1px solid #ddd8ce; border-radius: 10px; overflow: hidden; }
.row > header { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px;
                padding: 10px 14px; background: #faf8f5; border-bottom: 1px solid #e7e2d8; }
.row h2 { font-size: 15px; margin: 0; }
.tag { font-size: 11px; text-transform: uppercase; letter-spacing: .07em; padding: 2px 7px;
       border-radius: 20px; background: #eee9e0; color: #5c574e; }
.tag.dark { background: #2b271f; color: #e8e2d5; }
.strip { display: flex; border-radius: 4px; overflow: hidden; box-shadow: inset 0 0 0 1px rgba(0,0,0,.14); }
.strip i { width: 26px; height: 24px; display: block; }
.hint { font-size: 12px; color: #6c665c; margin-left: auto; }
.cells { display: flex; gap: 16px; align-items: flex-start; padding: 14px; overflow-x: auto; }
.cell { flex: 0 0 auto; border: 1px solid #e2ddd3; border-radius: 8px; overflow: hidden; background: #fff; }
.cap { font-size: 11px; letter-spacing: .05em; text-transform: uppercase; color: #6c665c;
       padding: 5px 9px; background: #faf8f5; border-bottom: 1px solid #eee9e0; }
.cell iframe { border: 0; display: block; }
.laptop { width: 660px; }
.laptop iframe { width: 1440px; height: 560px; zoom: .45; }
.phone iframe { width: 390px; height: 560px; }
"""


def html(rs):
    out = ['<!DOCTYPE html>', '<html lang="en"><head><meta charset="utf-8">',
           '<title>Every reading mode, side by side</title>',
           '<meta name="viewport" content="width=device-width,initial-scale=1">',
           "<style>" + CSS + "</style></head><body>",
           "<h1>Every reading mode, side by side</h1>",
           '<p class="lede">One row per mode, each cell the real page: a 1440px '
           "laptop viewport scaled to fit beside a 390px phone, at chapter 1. The "
           "sample is the site itself, opened through the same <code>?t=&amp;w=&amp;c=</code> "
           "link the Sync button builds - so nothing here can drift from what ships.</p>",
           '<p class="note"><b>Read this once.</b> A cell <em>is</em> the app, so it '
           "remembers the mode it shows: after scrolling the sheet, this device keeps "
           "the mode of the last cell that loaded. Reset it in the palette, or open the "
           "site in a private window. This sheet is a screen for judging palettes - it "
           "is not part of the site.</p>",
           '<div class="sheet">']
    for r in rs:
        dark = " dark" if r["kind"] == "dark" else ""
        strip = "".join(f'<i style="background:{c}"></i>' for c in r["strip"])
        extra = (" · " + r["caveat"]) if r["caveat"] else ""
        hint = f'?t={r["id"].split(":")[0]}&amp;w=full' if not r["caveat"] else "derived"
        out += [
            '<div class="row">',
            "<header>",
            f'<span class="strip" aria-hidden="true">{strip}</span>',
            f'<h2>{r["name"]}</h2>',
            f'<span class="tag{dark}">{r["kind"]}</span>',
            f'<span class="hint">{hint}{extra}</span>',
            "</header>",
            '<div class="cells">',
            f'<div class="cell laptop"><div class="cap">Laptop · 1440px · full</div>'
            f'<iframe loading="lazy" title="{r["name"]} at laptop width" '
            f'src="index.html{r["link"]}&amp;w=full#/learn/ch/1"></iframe></div>',
            f'<div class="cell phone"><div class="cap">Phone · 390px · comfort</div>'
            f'<iframe loading="lazy" title="{r["name"]} at phone width" '
            f'src="index.html{r["link"]}&amp;w=comfort#/learn/ch/1"></iframe></div>',
            "</div></div>",
        ]
    out += ["</div>", "</body></html>", ""]
    return "\n".join(out)


def write_sheet(dest):
    """Build the sheet into `dest`. 0 on success, 1 on failure.

    Called by main(), and by tools/build_deploy.py when it is given `--sheet`.
    That second caller is the reason this is a function rather than ten lines
    inside main(): the sheet has to be written INSIDE a build, because the build
    CLEARS its output directory (rmtree) and the archive is then made by walking
    it. Generate the sheet before the build and this build deletes it; generate it
    after and the next one does - and it is missing from the archive either way.
    The builder has to own it. (Both mistakes were made while writing this file.)
    """
    rs = rows()
    if rs is None:
        return 1
    dest = Path(dest)
    if not dest.parent.exists():
        print(f"{dest.parent} does not exist - build the bundle first")
        return 1
    with open(dest, "w", encoding="utf-8", newline="\n") as handle:
        handle.write(html(rs))
    print(f"wrote {dest} - {len(rs)} rows, {len(rs) * 2} cells, "
          f"every mode at both widths")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out", default=str(ROOT / "dist-dcc" / "theme-sheet.html"),
                    help="where to write the sheet (default: the built DCC bundle)")
    ap.add_argument("--check", action="store_true",
                    help="do not write; fail if the sheet on disk is out of date")
    args = ap.parse_args()

    rs = rows()
    if rs is None:
        return 1
    want = html(rs)
    dest = Path(args.out)
    if args.check:
        # A fresh clone has no dist-dcc at all, and that is not a failure - there
        # is no sheet to be stale. A bundle that EXISTS with an out-of-date sheet
        # is the case worth failing on: the sheet is generated from app.js and
        # tokens.css, so a mode added without regenerating it is a missing row.
        if not dest.parent.exists():
            print(f"{dest.parent} does not exist - nothing built to check; "
                  f"run tools/build_deploy.py first if you want the sheet verified")
            return 0
        if not dest.exists():
            # Either the bundle was never built (handled above) or it was built
            # WITHOUT --sheet, which is the commoner case and the reason this is a
            # gate step: a bundle is not publishable until it carries its sheet,
            # because the archive is zipped from the directory and would ship
            # without one.
            print(f"{dest} is missing - that bundle was built without --sheet.\n"
                  f"  Rebuild it with `python tools/build_deploy.py ... --sheet`,\n"
                  f"  or write the sheet into the existing bundle with\n"
                  f"  `python tools/make_theme_sheet.py --out {dest}`.")
            return 1
        if dest.read_text(encoding="utf-8") != want:
            print(f"{dest} is OUT OF DATE - run tools/make_theme_sheet.py")
            return 1
        print(f"{dest.name} is up to date ({len(rs)} rows)")
        return 0
    return write_sheet(dest)


if __name__ == "__main__":
    sys.exit(main())
