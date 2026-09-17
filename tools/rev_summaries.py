#!/usr/bin/env python3
"""The Rev layer: one fixed-size card per syllabus sub-topic.

The reader's ask, in their words
--------------------------------
"byte size section named Rev next to Learn ... strictly based on syllabus ...
fixed amount of information with no major yaps."

So this is not another view of the notes. It is one card for each sub-topic the
syllabus itself lists - 1.1, 1.2, 2.3 - and every card is the same size as every
other, because the point of a revision page is that the work left is a number you
can see before you start rather than a length you discover halfway in.

Three layers now sit over the same material, and they are deliberately different:

  `learn`            the teaching, ~250 words per section, where depth lives
  `revise`           one <=90-word answer above each SECTION (data/dcc_revise.json)
  `rev` (this)       one ~120-word card per SYLLABUS SUB-TOPIC (data/dcc_rev.json)

The fixed shape is a contract, not a house style: one lead paragraph, exactly four
bullets, and the plain text inside BAND = [110, 130] words. A card outside the band
fails, because "fixed amount of information" is the whole property being sold.

The language is deliberately plain and every card carries an emoji on its headline
plus one per bullet - the reader asked for exactly that ("use emoji and simple
lang"). The emoji are decoration, so they are left OUT of the word count (see
words_of): a token with no letter or digit in it is not a word, and charging the
reader four words a card for pictures would make the fixed size a lie.

What the guard refuses
----------------------
  * a syllabus sub-topic with no card, or a card for a number the syllabus does not
    have unless it is declared `"prereq": true` (2.0 and 3.0 carry the ground the
    unit's first sub-topic stands on, and the syllabus numbers neither)
  * a card whose title is not the syllabus's own wording for that number
  * a card outside the band, or whose shape is not one <p> + exactly four <li>
  * a card whose bolded term does not appear in the sections that teach that
    sub-topic, or whose quoted number does not (the anti-invention rule the revise
    layer is held to, applied here to the same material)
  * a card that talks about the deck, the notes, the paper or the exam, addresses
    the reader, or comments on the reading order (tools/revise_blocks.py TELLS, so
    the two layers cannot drift apart on what a yap is)
  * a card with no emoji, or an `e` field holding something that is not one
  * cards out of reading order, and a dcc-site/data/rev.js that no longer matches
    the plan - that file is what the page loads, and a stale one is a page that
    quietly shows yesterday's cards

Usage
-----
    python tools/rev_summaries.py --report    # every card, its words, its band
    python tools/rev_summaries.py --check     # the guard; exit 1 on a problem
    python tools/rev_summaries.py --apply     # regenerate dcc-site/data/rev.js
"""

from __future__ import annotations

import argparse
import html as htmllib
import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "dcc_rev.json"
SYLLABUS = ROOT / "data" / "syllabus.json"
SITE = ROOT / "dcc-site"
OUT = SITE / "data" / "rev.js"

COURSE = "dcc"

# One lead paragraph, four bullets, and the band the plain text has to land in.
# The band is +/- 10 words around 120: wide enough to write a sentence in, narrow
# enough that two cards never look like different-sized jobs.
BAND = (110, 130)
BULLETS = 4

# The tags a card may use. Anything else is a card trying to be a section.
ALLOWED_TAGS = {"p", "ul", "li", "strong", "em", "code"}

# A card is a fragment, so it is parsed as one: <p>…</p> then <ul>…</ul>.
SHAPE = re.compile(r"^<p>(?P<lead>.*?)</p><ul>(?P<items>(?:<li>.*?</li>)+)</ul>$", re.S)
LI = re.compile(r"<li>(.*?)</li>", re.S)

# A unit's heading is its title, not a sub-topic, so it can never carry a card.
UNIT_TITLE = re.compile(r"^\s*unit\s+\d+\b", re.I)


def load_revise_blocks():
    """tools/revise_blocks.py, for the pieces that must not be written twice.

    `plain`, the section splitter and the TELLS list are the revise layer's own
    definitions of a tag, a heading and a yap. A second copy here would be a second
    opinion within a month, so this file imports them the way tools/voice_rewrite.py
    imports tools/voice_audit.py.
    """
    spec = importlib.util.spec_from_file_location("revise_blocks", ROOT / "tools" / "revise_blocks.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


RB = load_revise_blocks()
plain = RB.plain


# --------------------------------------------------------------------------
# the two sources


def syllabus_topics() -> list[dict]:
    """Every sub-topic of the course, in syllabus order, from the authority."""
    doc = json.loads(SYLLABUS.read_text(encoding="utf-8"))
    out = []
    for unit in doc["courses"][COURSE]["units"]:
        for t in unit["topics"]:
            out.append({"n": t["n"], "unit": unit["n"], "t": t["t"]})
    return out


def plan() -> dict:
    doc = json.loads(DATA.read_text(encoding="utf-8"))
    return doc


def chapter_sections(n: int) -> list[dict]:
    """The h2/h3 sections of chapter n's notes, with each one's own prose."""
    path = SITE / f"ch{n}.js"
    if not path.is_file():
        return []
    text = RB.read(path)
    start, end, _ = RB.learn_field(text)
    return RB.sections(text[start:end])


def numbered(sec: dict) -> str:
    """The section's own number, or '' when its heading carries none."""
    m = re.match(r"^(\d+(?:\.\d+)*)\b", sec["text"])
    return m.group(1) if m else ""


def card_ranges(n: int, keys: set[str]) -> dict[str, str]:
    """key -> the text of everything that teaches it, for the provenance rule.

    A card owns its own heading and every section under it until the next card's
    heading, which is the reading order the notes are already written in - so a
    sub-heading with no number of its own (ch2's "Where a local object and a
    distributed object differ") belongs to the card it sits under rather than to
    nothing.
    """
    out: dict[str, str] = {}
    cur: str | None = None
    for sec in chapter_sections(n):
        key = numbered(sec)
        if key in keys:
            cur = key
        if cur is None:
            continue
        out.setdefault(cur, "")
        out[cur] += " " + plain(sec["heading"]) + " " + plain(sec["body"])
    return out


def check_order(keys: list[str]) -> list[str]:
    """Cards must appear in the order the chapters read them."""
    problems: list[str] = []
    per_chapter: dict[int, list[str]] = {}
    secs = {n: [numbered(s) for s in chapter_sections(n)] for n in range(1, 10)}
    for k in keys:
        unit = int(k.split(".")[0])
        per_chapter.setdefault(unit, []).append(k)
    for unit, ks in per_chapter.items():
        seen = [k for k in secs.get(unit, []) if k in set(ks)]
        if seen != ks:
            problems.append(f"ch{unit}: cards are out of reading order - file has {ks}, the notes have {seen}")
    return problems


# --------------------------------------------------------------------------
# the guard


def check_plan() -> tuple[list[str], dict]:
    problems: list[str] = []
    doc = plan()
    cards: dict[str, dict] = doc.get("topics", {})
    band = tuple(doc.get("band") or BAND)
    if band != BAND:
        problems.append(f"the declared band {band} is not the band this guard implements ({BAND})")

    syllabus = {t["n"]: t for t in syllabus_topics()}
    keys = list(cards)

    # Coverage, both ways: every sub-topic has a card, and every card is a
    # sub-topic - unless it is declared as the ground a unit stands on.
    for n, t in syllabus.items():
        c = cards.get(n)
        if c is None:
            problems.append(f"{n}: no Rev card (the syllabus lists it as {t['t']!r})")
            continue
        if c.get("unit") != t["unit"]:
            problems.append(f"{n}: filed under unit {c.get('unit')}, but the syllabus has it in unit {t['unit']}")
        if norm(c.get("t", "")) != norm(t["t"]):
            problems.append(f"{n}: title is {c.get('t')!r}, the syllabus's wording is {t['t']!r}")
    for n, c in cards.items():
        if n not in syllabus and not c.get("prereq"):
            problems.append(f"{n}: not a syllabus sub-topic and not declared \"prereq\"")
        if n in syllabus and c.get("prereq"):
            problems.append(f"{n}: declared \"prereq\" but it is a syllabus sub-topic")

    problems += check_order(keys)

    # Per card: shape, size, voice, and the provenance of every term it bolds.
    ranges: dict[int, dict[str, str]] = {}
    stats = {"cards": 0, "words": 0, "min": 10 ** 6, "max": 0, "shortest": "", "longest": ""}
    per_unit: dict[int, int] = {}
    for n, c in cards.items():
        unit = int(n.split(".")[0])
        body = str(c.get("html", ""))
        text = plain(body)
        words = words_of(body)
        stats["cards"] += 1
        stats["words"] += words
        per_unit[unit] = per_unit.get(unit, 0) + words
        if words < stats["min"]:
            stats["min"], stats["shortest"] = words, n
        if words > stats["max"]:
            stats["max"], stats["longest"] = words, n
        if words < band[0] or words > band[1]:
            problems.append(f"{n}: {words} words, outside the {band[0]}-{band[1]} band")

        emoji = str(c.get("e", "")).strip()
        if not emoji:
            problems.append(f"{n}: no emoji - the card's headline carries one")
        elif re.search(r"[A-Za-z0-9]", emoji) or len(emoji) > 4:
            problems.append(f"{n}: the emoji field {emoji!r} is not a single emoji")

        m = SHAPE.match(body.strip())
        if m is None:
            problems.append(f"{n}: not one <p> followed by a <ul> of bullets")
        else:
            items = LI.findall(m.group("items"))
            if len(items) != BULLETS:
                problems.append(f"{n}: {len(items)} bullets, the shape is exactly {BULLETS}")
        for tag in set(re.findall(r"</?([a-zA-Z0-9]+)", body)):
            if tag.lower() not in ALLOWED_TAGS:
                problems.append(f"{n}: uses <{tag}>, which is not part of a card")
        if body.count("<p>") != body.count("</p>") or body.count("<ul>") != body.count("</ul>"):
            problems.append(f"{n}: unbalanced <p>/<ul> tags")

        for rx, why in RB.TELLS:
            hit = rx.search(text)
            if hit:
                problems.append(f"{n}: {why} ({hit.group(0)!r})")

        # The anti-invention rule, against the sections that teach this sub-topic.
        if unit not in ranges:
            ranges[unit] = card_ranges(unit, {k for k in cards if int(k.split(".")[0]) == unit})
        source = plain(ranges[unit].get(n, "")).lower()
        if not source.strip():
            problems.append(f"{n}: no section in ch{unit}.js teaches this sub-topic")
            continue
        for term in re.findall(r"<strong>(.*?)</strong>", body, re.S):
            t = plain(term).lower()
            if len(t) < 3:
                continue
            if t not in source:
                problems.append(f"{n}: bolded term {plain(term)!r} is not in the sections that teach it")
        for num in re.findall(r"(?<![\d.])(\d+(?:\.\d+)*)", text):
            if num in n or num in re.findall(r"\d+(?:\.\d+)*", n):
                continue
            if not re.search(r"(?<![\d.])" + re.escape(num) + r"(?!\d)(?!\.\d)", source):
                problems.append(f"{n}: number {num} is not in the sections that teach it")

    stats["per_unit"] = per_unit
    return problems, stats


def words_of(html: str) -> int:
    """The card's words: everything with a letter or a digit in it.

    An emoji is a whole token to `split()`, and every bullet starts with one, so
    counting them would charge the reader four words a card for decoration and
the band would stop describing how much there is to read.
    """
    return sum(1 for w in plain(html).split() if re.search(r"[A-Za-z0-9]", w))


def norm(s: str) -> str:
    """Text as it is compared: entities decoded, spacing collapsed, dashes alike."""
    s = htmllib.unescape(str(s or ""))
    s = s.replace("\u2013", "-").replace("\u2014", "-").replace("\u2019", "'")
    return re.sub(r"\s+", " ", s).strip()


def render_js() -> str:
    """dcc-site/data/rev.js - what the page loads, generated from the plan."""
    doc = plan()
    cards = doc.get("topics", {})
    chapters: dict[str, dict] = {}
    for n, c in cards.items():
        unit = str(c.get("unit") or int(n.split(".")[0]))
        ch = chapters.setdefault(unit, {"words": 0, "cards": []})
        words = words_of(c.get("html", ""))
        card = {"n": n, "t": c.get("t", ""), "e": c.get("e", ""),
                "html": c.get("html", ""), "w": words}
        if c.get("prereq"):
            card["prereq"] = True
        ch["cards"].append(card)
        ch["words"] += words
    payload = {"course": doc.get("course", COURSE), "band": list(doc.get("band") or BAND),
               "chapters": chapters}
    return (
        "/* Rev cards for the DCC portal - one fixed-size card per syllabus sub-topic,\n"
        "   for the tab beside Learn.\n"
        "\n"
        "   GENERATED by tools/rev_summaries.py --apply from data/dcc_rev.json. Do not\n"
        "   edit this file: the plan is the JSON, and --check fails when the two\n"
        "   disagree. Every card is one lead paragraph plus four bullets in the band\n"
        "   below, and every bolded term in it is a term the sections that teach that\n"
        "   sub-topic already use - which is what makes a page this short safe to\n"
        "   revise from.\n"
        "\n"
        "   Shape: window.REV = {course, band, chapters:{\"1\":{words, cards:[{n,t,e,html,w}]}}}\n"
        "   `e` is the headline's emoji and `w` the card's own word count, emoji excluded,\n"
        "   so the panel can state the reading job without measuring it in the browser. */\n"
        "window.REV=" + json.dumps(payload, ensure_ascii=False, indent=1) + ";\n"
    )


def cmd_check() -> int:
    problems, stats = check_plan()
    fresh = OUT.is_file() and OUT.read_text(encoding="utf-8") == render_js()
    if not OUT.is_file():
        problems.append("dcc-site/data/rev.js is missing (run --apply)")
    elif not fresh:
        problems.append("dcc-site/data/rev.js is not the plan (run --apply)")
    for p in problems:
        print("  " + p, file=sys.stderr)
    print(f"  rev cards: {stats['cards']} cards, {stats['words']} words "
          f"(mean {round(stats['words'] / max(1, stats['cards']))}, "
          f"min {stats['min']} at {stats['shortest'] or '-'}, max {stats['max']} at {stats['longest'] or '-'}), "
          f"band {BAND[0]}-{BAND[1]}, {len(stats['per_unit'])} chapters")
    if problems:
        print("  rev_summaries: the plan or the page is out of shape", file=sys.stderr)
        return 1
    print("  rev_summaries: OK")
    return 0


def cmd_report() -> int:
    problems, stats = check_plan()
    doc = plan()
    cards = doc.get("topics", {})
    syllabus = {t["n"]: t for t in syllabus_topics()}
    for unit in range(1, 10):
        ks = [k for k in cards if int(k.split(".")[0]) == unit]
        if not ks:
            continue
        print(f"\nUnit {unit} - {len(ks)} cards, {stats['per_unit'].get(unit, 0)} words")
        for k in ks:
            c = cards[k]
            w = words_of(c.get("html", ""))
            flag = "" if BAND[0] <= w <= BAND[1] else "  OUT OF BAND"
            kind = "syllabus" if k in syllabus else "prereq  "
            print(f"  {k:<5} {kind} {w:>4}w  {c.get('t', '')[:56]}{flag}")
    print(f"\n{stats['cards']} cards, {stats['words']} words, mean "
          f"{round(stats['words'] / max(1, stats['cards']))}, band {BAND[0]}-{BAND[1]}")
    for p in problems:
        print("  " + p, file=sys.stderr)
    return 0


def cmd_apply() -> int:
    problems, _ = check_plan()
    if problems:
        for p in problems:
            print("  " + p, file=sys.stderr)
        print("  refusing to apply: the plan fails the guard (run --check)", file=sys.stderr)
        return 1
    OUT.write_text(render_js(), encoding="utf-8", newline="")
    print(f"  wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size} bytes)")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--report", action="store_true", help="every card, its words, its band")
    g.add_argument("--check", action="store_true", help="the guard; exit 1 on a problem")
    g.add_argument("--apply", action="store_true", help="regenerate dcc-site/data/rev.js")
    a = ap.parse_args()
    if a.report:
        return cmd_report()
    if a.check:
        return cmd_check()
    return cmd_apply()


if __name__ == "__main__":
    raise SystemExit(main())
