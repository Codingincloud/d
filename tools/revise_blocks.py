#!/usr/bin/env python3
"""The revise layer: one short answer block at the top of every note section.

The problem this exists for
---------------------------
The DCC notes answer a heading in about 250 words of continuous prose, where the
Simulation notes at the repository root answer one in about 60 words - a sentence,
then the terms and numbers as bullets. Both are honest about the same material;
the DCC one is simply unreadable the night before, because the answer is buried in
the middle of a section rather than at the top of it.

So: one block per section, written by hand in `data/dcc_revise.json`, rendered
above that section's prose. The prose is not touched, not shortened and not
rewritten - the block is a second way into the same section. Nothing is lost, so
this pass cannot damage the notes, which is the whole reason it is the pass being
done rather than a rewrite.

What the guard refuses
----------------------
  * a section with no block            (completeness, so the layer cannot go stale)
  * a block longer than MAX_WORDS       (the layer stops being readable)
  * a block whose bolded term does not appear in that section's own text, or
    whose quoted number does not appear in it  (anti-invention: the block may only
    say what the section already says, in fewer words)
  * a block that talks about the source - "the deck", "the notes", "the reference
    note", "the exam", "the paper"  (the voice pass's rules apply here too, since
    this text is the first thing a reader meets)

Apply writes one `revise: {...}` field per chapter as a single physical line, and
`--restore` removes that line again, so the inverse is byte-exact and needs no
journal - a journal is what a second `--apply` once corrupted in this repository
(see the notes in tools/slim_dcc_figures.py).

Usage
-----
    python tools/revise_blocks.py --report       # what each section has
    python tools/revise_blocks.py --check        # the guard; exit 1 on a problem
    python tools/revise_blocks.py --apply        # write the blocks into the chapters
    python tools/revise_blocks.py --restore      # take the field out again
    python tools/revise_blocks.py --roundtrip    # apply + restore on copies, compare hashes
"""

from __future__ import annotations

import argparse
import hashlib
import html as htmllib
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "dcc_revise.json"
SITE = ROOT / "dcc-site"

# A block answers one heading. Past this it is a second section, not a summary.
# The median note section in this unit is 236 words; a block is a third of that
# at most, which is what makes it readable rather than merely shorter.
MAX_WORDS = 90

# The first heading of a unit is its title, not a section - nothing to answer.
UNIT_TITLE = re.compile(r"^\s*unit\s+\d+\b", re.I)

# A heading whose own prose is this thin is a container (its sub-headings carry
# the content), so it needs no block of its own.
CONTAINER_WORDS = 25

HEAD = re.compile(r"<h([23])>(.*?)</h\1>", re.S)

# The voice pass's tells (tools/voice_audit.py) applied to this layer, where the
# patterns can be plain, because a block is written to be short - and the yap
# families the reader named next ("just teach the topic dont yap"): a block that
# points at another unit, addresses the reader, comments on the section, or rates
# the material is a block with less than 90 words of teaching in it.
TELLS = [
    (re.compile(r"\bthe deck\b", re.I), "talks about the deck"),
    (re.compile(r"\bthe notes\b", re.I), "talks about the notes"),
    (re.compile(r"\breference note", re.I), "talks about the reference note"),
    (re.compile(r"\bthe (source|paper|syllabus)\b", re.I), "talks about the source"),
    (re.compile(r"\bthe (exam|question paper|marking)\b", re.I), "talks about the exam"),
    (re.compile(r"\bslide[s]? \d", re.I), "cites a slide number"),
    (re.compile(r"\bUnit \d|\bunit \d\.\d|\bthe rest of (the|this) (unit|course|chapter)\b", re.I),
     "points at another unit"),
    (re.compile(r"\bwe (now|can|have|will|saw|see|use|call|assume|treat|did|do)\b|\bYou can\b"
                r"|\b[Yy]ou cannot\b|\bremember that\b|\bnote that\b|\blet us\b", re.I),
     "addresses the reader"),
    # Only a *page* pointer, never the word on its own: "the primitive under
    # everything above" is the protocol stack, and it is teaching.
    (re.compile(r"\bthis (unit|sub-?topic|section|chapter)\b|\bin this sub-?topic\b"
                r"|\bthe (table|figure|figures|rows?|list|points?|columns?)\s+(above|below)\b"
                r"|\bsee (above|below)\b|\b(above|below)\s+(are|is|we)\b", re.I),
     "comments on the section or the reading order"),
    (re.compile(r"\bnot a (ranking|coincidence|list)\b|\bthe whole point\b|\bwhat matters\b"
                r"|\bworth (noting|knowing|saying|writing|remembering)\b", re.I),
     "rates the material instead of stating it"),
]


def read(p: pathlib.Path) -> str:
    """Read a chapter file with no newline translation.

    `Path.read_text()` translates CRLF to LF on the way in and back on the way
    out, which makes the line-ending question unanswerable inside this file - it
    reported every file as LF-only - and makes a byte-exact round trip depend on
    the platform rather than on the code.
    """
    with open(p, encoding="utf-8", newline="") as handle:
        return handle.read()


def write(p: pathlib.Path, text: str) -> None:
    with open(p, "w", encoding="utf-8", newline="") as handle:
        handle.write(text)


def plain(s: str) -> str:
    """The readable text of a fragment: tags off, entities decoded, spacing normal."""
    s = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", s, flags=re.S | re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = htmllib.unescape(s)
    s = s.replace("\u00a0", " ").replace("\u2019", "'")
    return re.sub(r"\s+", " ", s).strip()


def slug(text: str) -> str:
    """A heading with no number, as a key: the same rule the renderer implements."""
    s = text.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def key_of(heading_html: str) -> str:
    """The key a heading is looked up by: its number if it has one, else its slug."""
    text = plain(heading_html)
    m = re.match(r"^(\d+(?:\.\d+)*)\b", text)
    return m.group(1) if m else slug(text)


def learn_field(text: str) -> tuple[int, int, int]:
    """(start, end, insert_at) of the `learn` template literal in a chapter file.

    The field is a backtick literal; the next field's line is where `revise` is
    inserted, which keeps both the read and the write free of the literal's own
    contents. Line endings in these files are CRLF, so nothing here may assume a
    bare newline.
    """
    start = text.index("  learn: `") + len("  learn: `")
    m = re.search(r"\r?\n(  [A-Za-z_]+:)", text[start:])
    assert m is not None, "no field follows `learn`"
    nxt = start + m.start(1)
    end = text.rindex("`", start, nxt)
    assert text[end + 1] == ",", "learn field shape changed"
    return start, end, nxt


def sections(learn: str) -> list[dict]:
    """Every h2/h3 of a chapter's notes, in reading order, with its own prose.

    A section's body runs from just after its heading to just before the next
    one, so the first heading's body includes the unit preamble - which is what
    the reader sees under that heading, and therefore what the guard measures.
    """
    heads = list(HEAD.finditer(learn))
    out = []
    for i, h in enumerate(heads):
        stop = heads[i + 1].start() if i + 1 < len(heads) else len(learn)
        out.append(
            {
                "tag": h.group(1),
                "heading": h.group(2),
                "text": plain(h.group(2)),
                "key": key_of(h.group(2)),
                "body": learn[h.end() : stop],
                "head_end": h.end(),
            }
        )
    return out


def eligible(sec: dict) -> bool:
    """Whether this heading needs a block of its own."""
    if UNIT_TITLE.match(sec["text"]):
        return False
    if len(plain(sec["body"]).split()) < CONTAINER_WORDS:
        return False
    return True


def load_blocks() -> dict:
    return json.loads(DATA.read_text(encoding="utf-8"))["blocks"]


def chapter_files() -> list[pathlib.Path]:
    return sorted(SITE.glob("ch*.js"), key=lambda p: int(re.search(r"\d+", p.stem).group()))


def eol(text: str) -> str:
    """The line ending this file is written with. These chapter files are CRLF, and
    a single LF line inside one is a diff that shows up as a rewrite of the file."""
    return "\r\n" if "\r\n" in text else "\n"


def field_line(blocks: dict, nl: str = "\n", indent: str = "  ") -> str:
    """The `revise:` field as one physical line (JSON strings are JS strings)."""
    inner = ",".join(
        json.dumps(k) + ":" + json.dumps(v) for k, v in blocks.items()
    )
    return f"{indent}revise: {{{inner}}},{nl}"


# --------------------------------------------------------------------------
# the guard


def check_file(ch: pathlib.Path, blocks: dict, strict_site: bool = True,
               drift_ok: bool = False) -> tuple[list[str], dict]:
    problems: list[str] = []
    text = read(ch)
    start, end, _ = learn_field(text)
    learn = text[start:end]
    secs = sections(learn)
    by_key = {s["key"]: s for s in secs}

    if len(by_key) != len(secs):
        dupes = sorted({s["key"] for s in secs if [x["key"] for x in secs].count(s["key"]) > 1})
        problems.append(f"{ch.name}: two sections share the key(s) {dupes}")

    for s in secs:
        if eligible(s) and s["key"] not in blocks:
            problems.append(f"{ch.name}: section {s['key']} ({s['text'][:50]!r}) has no revise block")
        if not eligible(s) and s["key"] in blocks:
            problems.append(
                f"{ch.name}: a revise block is written for {s['key']}, which is a container section"
            )

    # The plan and the page are two things, and they can drift: a block can be
    # rewritten in data/dcc_revise.json and the chapter left carrying the version
    # before it. That is not a theoretical failure - the reader's own example of
    # the yap ("Unit 1 established that components communicate only by passing
    # messages") was still on the page after the plan had been fixed, so the page
    # is compared with the plan rather than trusted to have been re-applied.
    live = re.search(r"^  revise: \{(?P<body>.*)\},\r?$", text, re.M)
    if drift_ok:
        pass                            # --apply is the fix for drift, so it may run with it
    elif live is None:
        problems.append(f"{ch.name}: blocks are planned but the chapter has no revise field (run --apply)")
    else:
        try:
            on_page = json.loads("{" + live.group("body") + "}")
        except json.JSONDecodeError as exc:
            problems.append(f"{ch.name}: the revise field is not readable JSON: {exc}")
            on_page = None
        if on_page is not None and on_page != blocks:
            stale = sorted(k for k in set(on_page) | set(blocks)
                           if on_page.get(k) != blocks.get(k))
            problems.append(f"{ch.name}: the page is not the plan - {len(stale)} block(s) "
                            f"differ, run --apply -> {stale[:4]}")

    stats = {"sections": 0, "blocks": 0, "words": 0, "max": 0, "longest": ""}
    for key, block in blocks.items():
        sec = by_key.get(key)
        if sec is None:
            problems.append(f"{ch.name}: a block is keyed {key!r}, which is no heading in this chapter")
            continue
        stats["sections"] += 1
        body = plain(block)
        n = len(body.split())
        stats["words"] += n
        if n > stats["max"]:
            stats["max"], stats["longest"] = n, key
        if n > MAX_WORDS:
            problems.append(f"{ch.name} {key}: {n} words, over the {MAX_WORDS}-word cap")
        if n < 12:
            problems.append(f"{ch.name} {key}: {n} words - too short to answer the heading")
        if not block.lstrip().startswith("<"):
            problems.append(f"{ch.name} {key}: not markup")
        if block.count("<p>") != block.count("</p>") or block.count("<ul>") != block.count("</ul>"):
            problems.append(f"{ch.name} {key}: unbalanced <p>/<ul> tags")
        for rx, why in TELLS:
            m = rx.search(body)
            if m:
                problems.append(f"{ch.name} {key}: {why} ({m.group(0)!r})")
        stats["blocks"] += 1

        # The anti-invention rule: every term the block marks bold must be a term
        # the section itself uses, and every number it quotes must be in the
        # section. A block may compress the section; it may not add to it.
        sec_text = plain(sec["body"]).lower()
        for term in re.findall(r"<strong>(.*?)</strong>", block, re.S):
            t = plain(term).lower()
            if len(t) < 3:
                continue
            if t not in sec_text:
                problems.append(f"{ch.name} {key}: bolded term {plain(term)!r} is not in the section")
        for num in re.findall(r"(?<![\d.])(\d+(?:\.\d+)*)", body):
            if num in key or num in re.findall(r"\d+(?:\.\d+)*", sec["text"]):
                continue
            # A quoted number has to be in the section, but `(?![\d.])` alone
            # rejects one at the end of a sentence ("server stub step 7."), which
            # is where numbers usually land. Only an adjacent digit - or a
            # following sub-number - is barred.
            if not re.search(r"(?<![\d.])" + re.escape(num) + r"(?!\d)(?!\.\d)", sec_text):
                problems.append(f"{ch.name} {key}: number {num} is not in the section")

    # A key's presence in the file has to mean the block is *on* the page, which
    # only holds if the renderer's key rule is the one implemented above.
    if strict_site and problems:
        pass
    return problems, stats


def cmd_check(files: list[pathlib.Path], refs: dict, strict: bool = False, quiet: bool = False,
              drift_ok: bool = False) -> int:
    """The guard. A defect in a written chapter always fails; a chapter with no
    blocks yet fails only under --strict, because the layer is being written unit
    by unit and the runner holds the remainder as a known gap."""
    problems: list[str] = []
    pending: list[str] = []
    total = {"sections": 0, "blocks": 0, "words": 0, "max": 0, "longest": "", "pending": 0}
    for ch in files:
        name = ch.name
        blocks = refs.get(name, {})
        if not blocks:
            text = read(ch)
            start, end, _ = learn_field(text)
            todo = [s for s in sections(text[start:end]) if eligible(s)]
            if todo:
                total["pending"] += len(todo)
                pending.append(f"{name}: no revise blocks yet ({len(todo)} sections to write)")
            continue
        p, stats = check_file(ch, blocks, drift_ok=drift_ok)
        problems += p
        # Sum the totals, but *max* is a maximum rather than a sum: adding the
        # per-chapter maxima together reported a longest block of 804 words for
        # a layer whose cap is 90, which made the summary unreadable exactly
        # where it was meant to reassure.
        for k in ("sections", "blocks", "words"):
            total[k] += stats[k]
        if stats["max"] > total["max"]:
            total["max"] = stats["max"]
            total["longest"] = stats["longest"]
    if not quiet:
        for p in problems:
            print("  " + p, file=sys.stderr)
        for p in pending:
            print("  (pending) " + p, file=sys.stderr)
        print(
            f"  revise blocks: {total['blocks']} blocks over {total['sections']} sections, "
            f"{total['words']} words (mean {round(total['words'] / max(1, total['blocks']))}, "
            f"max {total['max']} at {total['longest'] or '-'}), "
            f"{total['pending']} section(s) still to write"
        )
    if problems:
        return 1
    return 1 if (strict and pending) else 0


# --------------------------------------------------------------------------
# apply / restore / roundtrip


def apply(files: list[pathlib.Path], refs: dict, dry: bool = False) -> int:
    wrote = 0
    for ch in files:
        blocks = refs.get(ch.name)
        text = read(ch)
        if not blocks:
            continue
        # Re-applying regenerates the field rather than refusing: the plan is the
        # source, and a re-run after a block is rewritten is the normal case.
        text, had = strip_field(text)
        if had:
            print(f"  {ch.name}: refreshing the revise field", file=sys.stderr)
        _, _, at = learn_field(text)
        out = text[:at] + field_line(blocks, eol(text)) + text[at:]
        if not dry:
            write(ch, out)
        wrote += 1
    print(f"  applied {wrote} chapter(s)")
    return 0


def strip_field(text: str) -> tuple[str, bool]:
    """Remove the `revise:` line. The field is written as one physical line."""
    m = re.search(r"^  revise: \{.*\},\r?\n", text, re.M)
    if m is None:
        return text, False
    return text[: m.start()] + text[m.end() :], True


def restore(files: list[pathlib.Path]) -> int:
    n = 0
    for ch in files:
        out, hit = strip_field(read(ch))
        if hit:
            write(ch, out)
            n += 1
    print(f"  removed the field from {n} chapter(s)")
    return 0


def sha(p: pathlib.Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def cmd_roundtrip(files: list[pathlib.Path], refs: dict) -> int:
    """Apply then restore on copies, and require the bytes to come back exactly."""
    import shutil
    import tempfile

    bad = 0
    with tempfile.TemporaryDirectory() as td:
        copies = []
        for ch in files:
            c = pathlib.Path(td) / ch.name
            # The copies start from the unapplied state, which is what the round
            # trip has to prove it can come back to - a live file that already
            # carries the field would fail this for the right reason.
            write(c, strip_field(read(ch))[0])
            copies.append(c)
        before = {c.name: sha(c) for c in copies}
        if apply(copies, refs) != 0:
            return 1
        mid = {c.name: sha(c) for c in copies}
        changed = [n for n in before if before[n] != mid[n]]
        want = sorted(n for n in refs if refs[n])
        if sorted(changed) != want:
            print(f"  apply changed {sorted(changed)}, expected {want}", file=sys.stderr)
            bad += 1
        restore(copies)
        after = {c.name: sha(c) for c in copies}
        for n in before:
            if before[n] != after[n]:
                print(f"  {n}: restore is not byte-exact", file=sys.stderr)
                bad += 1
    if not bad:
        print(f"  roundtrip: apply + restore byte-exact on {len(files)} chapter(s)")
    return 1 if bad else 0


def cmd_report(files: list[pathlib.Path], refs: dict) -> int:
    for ch in files:
        text = read(ch)
        start, end, _ = learn_field(text)
        secs = sections(text[start:end])
        blocks = refs.get(ch.name, {})
        need = [s for s in secs if eligible(s)]
        print(f"\n{ch.name} - {len(secs)} headings, {len(need)} need a block, {len(blocks)} written")
        for s in need:
            b = blocks.get(s["key"], "")
            n = len(plain(b).split())
            mark = "ok " if b else "-- "
            flag = "  OVER CAP" if n > MAX_WORDS else ""
            print(f"  {mark}{s['key']:<12} {n:>3}w  {s['text'][:58]}{flag}")
        for k in blocks:
            if k not in {s["key"] for s in secs}:
                print(f"  !! block {k!r} is on no heading")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--report", action="store_true", help="what each section has")
    g.add_argument("--check", action="store_true", help="the guard; exit 1 on a problem")
    g.add_argument("--apply", action="store_true", help="write the blocks into the chapters")
    g.add_argument("--restore", action="store_true", help="remove the field again")
    g.add_argument("--roundtrip", action="store_true", help="apply + restore on copies")
    ap.add_argument("--strict", action="store_true", help="with --check: a section with no block fails")
    a = ap.parse_args()

    refs = load_blocks()
    files = chapter_files()
    if not files:
        print("no chapter files found", file=sys.stderr)
        return 1

    if a.report:
        return cmd_report(files, refs)
    if a.check:
        return cmd_check(files, refs, strict=a.strict)
    if a.apply:
        # Only this chapter's own defects stop a write. A chapter with no blocks
        # yet is the work still to do, not a reason to refuse the work that is
        # done - --strict is the gate for that.
        rc = cmd_check(files, refs, strict=False, quiet=True, drift_ok=True)
        if rc != 0:
            print("  refusing to apply: the guard fails (run --check)", file=sys.stderr)
            return 1
        return apply(files, refs)
    if a.restore:
        return restore(files)
    if a.roundtrip:
        return cmd_roundtrip(files, refs)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
