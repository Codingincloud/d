#!/usr/bin/env python3
"""Theme gate: every reading mode, checked for contrast and for drift.

Eight modes sit on one token contract, and every way that goes wrong is
invisible in a screenshot of the mode you happen to be looking at:

  * a fill that carries white text is a shade too light, and the quiz option
    letters or the "+10 XP" chip quietly fall under AA (the Lamp mode shipped
    with two of these: #3e8a62 was 4.18:1 and #b8862f was 3.24:1 under white);
  * a mode forgets a token, and because an undefined custom property is NOT
    inherited from the base theme, that element renders with no background at
    all rather than with the base theme's;
  * a mode's id exists in tokens.css but not in the picker, so it can never be
    chosen - or in the picker but not in tokens.css, so choosing it blanks the
    page;
  * the boot script's per-mode browser-chrome colour drifts away from the
    mode's own --bg, which shows up as a phone address bar in the wrong colour.

Only the first is a judgement call. The rest are facts, so all four are checked
here, and this file is part of the §4 gate in .freebuff/run.md.

    python tools/check_themes.py            # exits 1 on any failure

Colour maths is WCAG 2.1 relative luminance, with alpha composited over the
surface it sits on, because several tints are declared as rgba.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOKENS = ROOT / "assets" / "css" / "tokens.css"
APPJS = ROOT / "app.js"
ENTRIES = {"Simulation": ROOT / "index.html", "DCC": ROOT / "dcc-site" / "index.html"}

AA = 4.5          # body text
AA_GRAPHIC = 3.0  # WCAG 1.4.11: a border that IS the content (figure strokes)
HAIRLINE = 1.15   # a rule that only has to be visible at all
WHISPER = 1.05    # the inner rule: a table row separator, not a border


# ---------------------------------------------------------------- colour ----

def parse(value):
    """'#abc' / '#aabbcc' / 'rgb(...)' / 'rgba(...)' -> (r, g, b, a), or None."""
    value = value.strip()
    m = re.fullmatch(r"#([0-9a-fA-F]{3})", value)
    if m:
        return tuple(int(c * 2, 16) for c in m.group(1)) + (1.0,)
    m = re.fullmatch(r"#([0-9a-fA-F]{6})", value)
    if m:
        h = m.group(1)
        return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 1.0)
    m = re.fullmatch(
        r"rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)", value)
    if m:
        r, g, b = (float(m.group(i)) for i in (1, 2, 3))
        a = float(m.group(4)) if m.group(4) is not None else 1.0
        return (r, g, b, a)
    return None


def over(fg, bg):
    """Composite fg over an opaque bg."""
    if fg[3] >= 1.0:
        return fg
    a = fg[3]
    return (fg[0] * a + bg[0] * (1 - a),
            fg[1] * a + bg[1] * (1 - a),
            fg[2] * a + bg[2] * (1 - a), 1.0)


def _lin(v):
    v /= 255.0
    return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4


def luminance(c):
    return 0.2126 * _lin(c[0]) + 0.7152 * _lin(c[1]) + 0.0722 * _lin(c[2])


def ratio(fg_text, bg_text, page_bg):
    fg, bg = parse(fg_text), parse(bg_text)
    if fg is None or bg is None:
        return None
    if bg[3] < 1.0:                      # a translucent surface sits on the page
        bg = over(bg, parse(page_bg) or (255.0, 255.0, 255.0, 1.0))
    fg = over(fg, bg)
    a, b = luminance(fg), luminance(bg)
    return (max(a, b) + 0.05) / (min(a, b) + 0.05)


# ----------------------------------------------------------------- input ----

def read(path):
    return path.read_text(encoding="utf-8")


def theme_blocks(css):
    """[data-theme="x"] { --tok: value; ... } -> {id: {token: value}}"""
    out = {}
    for m in re.finditer(r'\[data-theme="([a-z0-9]+)"\]\s*\{(.*?)\n\}', css, re.S):
        out[m.group(1)] = {t.group(1): t.group(2).strip()
                           for t in re.finditer(r"--([a-z0-9-]+)\s*:\s*([^;]+);", m.group(2))}
    return out


def print_block(css):
    """@media print { html[data-theme] { --tok: value; ... } } -> {token: value}

    Deliberately NOT matched by theme_blocks: that regex wants a quoted id, so
    the print block is not mistaken for a ninth mode.
    """
    m = re.search(r"@media print \{\s*html\[data-theme\] \{(.*?)\n  \}", css, re.S)
    if not m:
        return None
    return {t.group(1): t.group(2).strip()
            for t in re.finditer(r"--([a-z0-9-]+)\s*:\s*([^;]+);", m.group(1))}


def norm(value):
    """Compare token values without caring about internal whitespace."""
    return re.sub(r"\s+", " ", value).strip().lower()


def app_registry(js):
    """THEMES = [{id:'..', name:'..', kind:'..', meta:'..', strip:[...]}]"""
    out = {}
    for m in re.finditer(
        r"\{id:'([a-z0-9]+)',\s*name:'([^']*)',\s*kind:'(light|dark)',\s*meta:'(#[0-9a-fA-F]{6})'",
        js):
        out[m.group(1)] = {"name": m.group(2), "kind": m.group(3), "meta": m.group(4).lower()}
    return out


def boot_map(html):
    """var MODES={light:'#fbfaf8', ...} in an entry page."""
    m = re.search(r"var MODES=\{(.*?)\};", html, re.S)
    if not m:
        return {}
    return {k.lower(): v.lower() for k, v in
            re.findall(r"([a-z0-9]+)\s*:\s*'(#[0-9a-fA-F]{6})'", m.group(1))}


# ---------------------------------------------------------------- checks ----

def mode_checks(tokens):
    """Every (text, surface) pair the stylesheet actually puts on screen."""
    fails = []
    page = tokens.get("bg", "#ffffff")

    def need(label, fg, bg, minimum):
        got = ratio(tokens.get(fg, "#000"), tokens.get(bg, "#fff"), page)
        if got is None:
            fails.append(f"{label}: {fg}/{bg} is not a colour "
                         f"({tokens.get(fg)!r} / {tokens.get(bg)!r})")
        elif got < minimum:
            fails.append(f"{label}: {fg} on {bg} is {got:.2f}:1, needs {minimum}:1")

    # ink on every surface it can land on
    for ink in ("t1", "t2", "t3"):
        for surface in ("bg", "bg-card", "bg-side"):
            need("ink", ink, surface, AA)

    # a callout is prose on a tint, and its label is the accent made legible
    for kind in ("pri", "sec", "acc", "dan", "vio"):
        need("callout label", kind + "-l", kind + "-bg", AA)
        for ink in ("t1", "t2"):
            need("callout text", ink, kind + "-bg", AA)

    # hardcoded white text on the accent FILLS (quiz option letters, +XP chips,
    # the Mark-done button, the active chapter number). --t1 is NOT one of them:
    # the two fills built on ink - the toast and the "on" filter pill - carry
    # --bg as their text, which the t1-on-bg ink rule above already covers.
    for kind in ("pri", "sec", "acc", "dan", "vio"):
        need("white on fill", "@white", kind, AA)
    need("inverse pair", "t1", "bg", AA)

    # accent text on the page and on a card
    for kind in ("pri-l", "sec-l", "acc-l", "dan-l", "vio-l"):
        for surface in ("bg", "bg-card"):
            need("accent text", kind, surface, AA)
    need("formula box", "pri-l", "bg-code", AA)

    # controls
    need("input text", "t1", "bg-input", AA)
    need("placeholder", "t3", "bg-input", AA)
    need("table head", "th-c", "th-bg", AA)
    need("sidebar hover", "t1", "bg-side-h", AA)
    need("active nav", "t1", "bg-side-a", AA)

    # structure: hairlines, and the strokes that are themselves the content
    for surface in ("bg", "bg-card", "bg-side"):
        need("hairline", "brd", surface, HAIRLINE)
    need("inner rule", "brd-l", "bg-card", WHISPER)
    need("figure line", "fig-line", "bg-card", AA_GRAPHIC)
    need("figure line", "fig-line", "bg", AA_GRAPHIC)
    return fails


def check_palettes(path):
    """Run the same pair list over any file of [data-theme] blocks.

    This is how the READER-TINTED mode gets checked. Its palette is derived by
    custom-theme.js rather than written down, so there is nothing in tokens.css
    to read - tools/test_custom_theme.js derives a grid of awkward inputs and
    writes them out in this file's own input format, and the contrast contract
    then applies unchanged. One list of pairs, one implementation, so the
    hand-written modes and the derived ones cannot be held to different bars.
    """
    blocks = theme_blocks(read(Path(path)))
    if not blocks:
        print(f"  [x] no [data-theme=...] blocks in {path}")
        return 1
    bad = 0
    for tid in sorted(blocks):
        tokens = dict(blocks[tid])
        tokens["@white"] = "#ffffff"
        fails = mode_checks(tokens)
        if fails:
            bad += 1
            for f in fails:
                print(f"  [x] [{tid}] {f}")
    print()
    if bad:
        print(f"{bad} of {len(blocks)} derived palettes fail the contract")
        print("check_themes --palettes: FAILED")
        return 1
    print(f"All {len(blocks)} derived palettes hold AA on every pair the "
          f"stylesheets paint.")
    print("check_themes --palettes: OK")
    return 0


def main():
    if len(sys.argv) > 2 and sys.argv[1] == "--palettes":
        return check_palettes(sys.argv[2])

    css, js = read(TOKENS), read(APPJS)
    blocks = theme_blocks(css)
    registry = app_registry(js)
    boot = {name: boot_map(read(path)) for name, path in ENTRIES.items()}

    # the checker writes @white as a sentinel; resolve it here so `need` stays
    # one function
    for tokens in blocks.values():
        tokens["@white"] = "#ffffff"

    problems = []
    if not blocks:
        print("  [x] no [data-theme=...] blocks parsed out of tokens.css")
        return 1

    # 1. the four lists of ids must agree
    lists = {"tokens.css": set(blocks), "app.js": set(registry)}
    lists.update({f"{name} entry page": set(ids) for name, ids in boot.items()})
    every = set().union(*lists.values())
    for tid in sorted(every):
        missing = [name for name, ids in lists.items() if tid not in ids]
        if missing:
            problems.append(f"[{tid}] is missing from {', '.join(missing)} - the four lists "
                            f"(tokens.css, app.js, and both entry pages) have to match")

    # 2. every mode has to declare the same token set
    reference = set(blocks.get("light", {}))
    reference.discard("@white")
    for tid, tokens in blocks.items():
        names = set(tokens) - {"@white"}
        missing, extra = reference - names, names - reference
        if missing:
            problems.append(f"[{tid}] does not declare {', '.join(sorted(missing))} - an "
                            f"undeclared token is UNDEFINED, not inherited")
        if extra:
            problems.append(f"[{tid}] declares {', '.join(sorted(extra))}, which the light "
                            f"block does not")

    # 3. contrast, and 4. the browser-chrome colour
    rows = []
    for tid, tokens in blocks.items():
        fails = mode_checks(tokens)
        for f in fails:
            problems.append(f"[{tid}] {f}")
        meta = registry.get(tid, {}).get("meta")
        if meta and meta != tokens.get("bg", "").lower():
            problems.append(f"[{tid}] app.js says the browser chrome is {meta} but --bg is "
                            f"{tokens.get('bg')} - a phone's address bar will not match")
        for name, ids in boot.items():
            if tid in ids and ids[tid] != tokens.get("bg", "").lower():
                problems.append(f"[{tid}] the boot map in the {name} page carries {ids[tid]} but "
                                f"--bg is {tokens.get('bg')}")
        rows.append((tid, registry.get(tid, {}).get("name", "?"),
                     registry.get(tid, {}).get("kind", "?"), len(fails)))

    # 5. printing is paper, and paper is the light theme. The print palette is a
    #    copy of [data-theme="light"], and this is what keeps the copy honest:
    #    it is the one duplication a palette set cannot avoid, because a media
    #    query cannot inherit from a selector.
    printed = print_block(css)
    light = {k: v for k, v in blocks.get("light", {}).items() if k != "@white"}
    if printed is None:
        problems.append("tokens.css has no `@media print { html[data-theme] { ... } }` "
                        "block - without one, a dark mode prints as a dark page")
    else:
        for name, value in sorted(light.items()):
            if name == "bg":
                # the one intentional difference: paper is pure white
                if norm(printed.get(name, "")) != "#ffffff":
                    problems.append(f"the print palette sets --bg to "
                                    f"{printed.get(name)!r}; paper is #ffffff")
                continue
            if name not in printed:
                problems.append(f"the print palette does not declare {name} - printing in a "
                                f"dark mode would leave the dark theme's value on the page")
            elif norm(printed[name]) != norm(value):
                problems.append(f"the print palette has {name}: {printed[name]} but the light "
                                f"theme has {value} - print is paper, so it has to match light")
        extra = set(printed) - set(light)
        if extra:
            problems.append(f"the print palette declares {', '.join(sorted(extra))}, which the "
                            f"light theme does not")

    width = max((len(r[1]) for r in rows), default=10)
    for tid, name, kind, n in rows:
        flag = "ok" if n == 0 else f"{n} FAIL"
        print(f"  {name:<{width}}  {tid:<12} {kind:<5} {flag}")
    print()

    if problems:
        print(f"{len(problems)} theme problem(s):\n")
        for p in problems:
            print(f"  [x] {p}")
        print("\ncheck_themes: FAILED")
        return 1
    print(f"All {len(rows)} reading modes hold AA, and the id lists agree.")
    if printed is not None:
        print(f"The print palette matches the light theme token for token "
              f"({len(printed)} of them), so nothing prints on ink.")
    print("check_themes: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
