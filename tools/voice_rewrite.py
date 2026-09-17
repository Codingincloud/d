"""Rewrite the third-person voice out of the notes, from a reviewed catalogue.

The catalogue (`data/voice_rewrites.json`) is the plan of record: one entry per
edit, each carrying the exact HTML fragment to find, what to put in its place
(often nothing), which tell it retires, and a one-line reason. Editing prose by
rule was the alternative and it is the wrong tool - "the deck gives these as two
columns, and the two columns are the same properties seen from opposite sides"
has to become "the two columns are the same properties seen from opposite sides",
and no regex knows that. So a person decides, and this tool makes the decision
safe to apply:

  * `find` must occur **exactly once** in the chapter's notes, or the entry is
    refused and nothing is written for that file;
  * a replacement may **not introduce a tell** - the same patterns the audit
    counts are run over `to`, and an entry that puts "the deck" or "the paper"
    back in is rejected before it is applied;
  * the notes are fingerprinted before and after, and `--restore` rebuilds them
    from the catalogue and **verifies the fingerprint**, so a round trip that
    loses or duplicates a character fails loudly instead of quietly;
  * `--check` re-verifies every applied entry and runs a synthetic
    apply-then-restore self-test, so the gate catches a catalogue that has gone
    stale against the text.

    python tools/voice_rewrite.py --context ch2     # what to curate, with exact HTML
    python tools/voice_rewrite.py --curate        # plain writing -> catalogue entries
    python tools/voice_rewrite.py --apply
    python tools/voice_rewrite.py --check
    python tools/voice_rewrite.py --restore
    python tools/voice_rewrite.py --retire ch8.js --match "the boundary" \\
        --reason "the sentence was rewritten by the length pass"
"""

import argparse
import contextlib
import hashlib
import importlib.util
import io
import json
import re
import sys
from html import unescape as unescape_html
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "dcc-site"
CATALOGUE = ROOT / "data" / "voice_rewrites.json"
APPLIED = ROOT / "data" / "voice_applied.json"
LEARN = re.compile(r"\n  learn: `(?P<body>.*?)\n`,\n", re.S)


def load_audit():
    spec = importlib.util.spec_from_file_location("voice_audit", ROOT / "tools" / "voice_audit.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


AUDIT = load_audit()


def body_of(path: Path):
    m = LEARN.search(path.read_text(encoding="utf-8"))
    return m


def digest(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()[:16]


def load_catalogue() -> dict:
    if not CATALOGUE.exists():
        return {}
    data = json.loads(CATALOGUE.read_text(encoding="utf-8"))
    return {k: v for k, v in data.items() if not k.startswith("_")}


def introduces_tell(text: str) -> str:
    """The first tell a proposed replacement would put back in, or ''.

    The replacement is read as prose, through the audit's own reader
    (`AUDIT.plain`), so the exemptions apply to it exactly as they apply to the
    notes: an attribution span may name the book a definition comes from - that is
    the one place the standard allows a source to be named - while the prose
    around it may not narrate one. Checking the raw HTML instead refused the
    attribution the standard permits.
    """
    prose = AUDIT.plain(text)
    for key, label, pattern in AUDIT.TELLS:
        if re.search(pattern, prose, re.I):
            return f"{key} ({label})"
    return ""


def sentence_span(body: str, sentence: str):
    """Where a sentence the audit found sits in the HTML, tags and all.

    The audit scans the *text*, so what it hands back has no markup - and an entry
    has to carry the markup exactly. The words are the same in both, so the span is
    found by matching the words in order with anything tag-or-entity-shaped allowed
    between them. Returned as an (start, end, html) triple, or None when the
    sentence crosses a boundary no single span covers.
    """
    words = re.findall(r"[A-Za-z']+", sentence)
    if not words:
        return None
    pat = r"(?:\s|<[^>]*>|&[a-z]+;)+".join(re.escape(w) for w in words)
    hits = list(re.finditer(pat, body))
    if len(hits) != 1:
        return None
    h = hits[0]
    return h.start(), h.end(), body[h.start():h.end()]


def plain_index(markup: str):
    """The readable text of a fragment, plus the HTML index behind each character.

    Entries are written as prose and have to become exact markup. Matching word by
    word loses the punctuation - a clause ending `slides 6&ndash;9.` cannot be
    expressed by its words at all - so the plain text is built here and every
    character of it remembers where it came from. An edit written against the plain
    text then turns into the exact span, tags and entities included.
    """
    chars, where = [], []
    i, n = 0, len(markup)
    while i < n:
        ch = markup[i]
        if ch == '<':
            j = markup.find('>', i)
            if j < 0:
                break
            i = j + 1
            continue
        if ch == '&':
            j = markup.find(';', i)
            ent = markup[i:j + 1] if j > 0 and j - i <= 10 else ''
            if ent and re.fullmatch(r'&[a-zA-Z#0-9]+;', ent):
                for d in unescape_html(ent):
                    chars.append(d)
                    where.append(i)
                i = j + 1
                continue
        chars.append(ch)
        where.append(i)
        i += 1
    return ''.join(chars), where


def spell_span(body: str, old: str, which: int = 0):
    """(start, end, html) for a plain-text edit, or None when it is ambiguous.

    The end carries the whitespace after it, so deleting a sentence does not leave
    two spaces behind where it used to be.

    `which` picks among identical occurrences. It exists for the repeated phrases
    markup is full of - a table header that is also the first words of the sentence
    below it, the same caption on two figures - where the tool's refusal to guess is
    right but the author's intent is not ambiguous at all. Counting from 1.
    """
    plain, where = plain_index(body)
    seen = plain.count(old)
    if seen != 1 and not (which and 1 <= which <= seen):
        return None
    start_p = plain.index(old) if seen == 1 else -1
    if start_p < 0:                     # the nth occurrence, counted from 1
        for _ in range(which):
            start_p = plain.index(old, start_p + 1)
    start = where[start_p]
    end = where[start_p + len(old) - 1] + 1
    # The trailing space is NOT taken here: it belongs to the sentence either way,
    # and taking it for a replacement joins the new text to the next word (`is
    # exact:the resources`, `(Section 12.3)puts`). A deletion takes it, in curate,
    # so that removing a whole sentence does not leave two spaces behind.
    return start, end, body[start:end]


def paragraph_of(body: str, at: int) -> str:
    """The readable text of the block an offset sits in, from its own start."""
    lo = max(body.rfind("<p", 0, at), body.rfind("<td", 0, at), body.rfind("<li", 0, at),
             body.rfind("<h", 0, at))
    if lo < 0:
        lo = 0
    hi = len(body)
    for tag in ("</p>", "</td>", "</li>", "</h", "</div>"):
        j = body.find(tag, at)
        if j >= 0:
            hi = min(hi, j)
    plain, _ = plain_index(body[lo:hi])
    return re.sub(r"[ \t]+", " ", plain).strip()


def context(chapter: str, full: bool = False, plain: bool = False) -> int:
    """Print each tell in one chapter with the exact HTML around it, so an entry
    can be written by copying what is really in the file rather than by guessing
    at the markup. With `full`, the whole sentence is printed as one line and
    unbroken: that line is the `find` an entry needs."""
    path = SITE / f"{chapter}.js"
    m = body_of(path)
    if not m:
        print(f"no learn field in {chapter}.js", file=sys.stderr)
        return 1
    body = m.group("body")
    n = 0
    for key, s in AUDIT.scan(body):
        n += 1
        span = sentence_span(body, s)
        print(f"\n--- {chapter} #{n} [{key}] {s if full else s[:150]}")
        if plain and span:
            # The text an entry has to be written against: the file's own reading,
            # without the spaces the audit inserts where a tag sits.
            print("    PLAIN: " + paragraph_of(body, span[0]))
        if span:
            print("    EXACT: " + span[2].replace("\n", "\\n"))
        else:
            # No single span: the sentence is built from more than one element, or
            # the same words recur. Say so rather than printing a near-miss that
            # looks like an exact answer.
            words = re.findall(r"[A-Za-z']+", s)[:3]
            pat = r"(?:\s|<[^>]*>|&[a-z]+;)+".join(re.escape(w) for w in words)
            hit = re.search(pat, body)
            if hit:
                lo = max(0, hit.start() - 90)
                hi = min(len(body), hit.end() + 130)
                print("    NEAR : " + body[lo:hi].replace("\n", "\\n"))
            else:
                print("    (not located - grep for a distinctive word)")
    print(f"\n{chapter}: {n} tell hits")
    return 0


def passes(log: dict, name: str) -> list:
    """The record is a list of passes per file, not one entry set.

    It was one entry set until a second --apply replaced it: the entries of the
    first pass were computed against a body the second pass no longer saw, so
    keeping them in one flat list made the indexes uncomparable and the first
    pass's work unrecordable. A pass carries the fingerprints of the file before
    and after it ran, and passes are undone newest first, which keeps every
    index valid for the exact state it was recorded against.
    """
    return (log.get(name) or {}).get("passes", []) if isinstance(log.get(name), dict) else (log.get(name) or [])


def all_records(log: dict, name: str) -> list:
    return [e for p in passes(log, name) for e in p["entries"]]


CURATE = ROOT / "data" / "voice_curate.json"


def curate_plans() -> list:
    """Every `data/voice_curate*.json`, in name order, merged.

    One file holds a hand's turn of edits. A chapter's worth of them is long enough
    that keeping every chapter in one file made it the thing you scroll rather than
    read, so each batch gets its own (`voice_curate_ch6.json`); the tool reads the
    lot and neither knows nor cares which file an edit came from.
    """
    plans = []
    for path in sorted(CURATE.parent.glob("voice_curate*.json")):
        try:
            edits = json.loads(path.read_text(encoding="utf-8")).get("edits", [])
        except (OSError, json.JSONDecodeError) as exc:
            print(f"voice_rewrite: {path.name} cannot be read: {exc}", file=sys.stderr)
            continue
        plans.append((path, edits))
    return plans


def curate() -> int:
    """Turn plain-language edits into catalogue entries carrying the exact markup.

    Curating a chapter means deciding, one sentence at a time, what the subject
    sentence is - and writing that decision out in HTML is where the time goes and
    where mistakes get made. So the decision is written as prose (`data/voice_
    curate*.json`: the sentence to change, the sentence to put in its place, the tell
    and the reason) and this resolves each one against the file: the words are
    matched in order with anything tag-shaped allowed between them, and the span is
    required to occur exactly once.

    Two cases are refused rather than guessed at:

      * a sentence that shares its words with another place in the file, because
        there is no way to tell which one was meant;
      * a replacement that has to change text *inside* a markup tag (a bolded term
        in the middle of the clause). A deletion may span tags - nothing of the
        markup survives it - but a rewrite has to be written by hand, so that the
        `<strong>` on the term a student is meant to remember is a decision rather
        than a side effect of a string replace.

    Refusals are printed with the exact span, to paste into the catalogue by hand.
    """
    plans = curate_plans()
    if not plans:
        print(f"voice_rewrite: no {CURATE.relative_to(ROOT).parent}/voice_curate*.json to curate from")
        return 0
    cat = json.loads(CATALOGUE.read_text(encoding="utf-8"))
    edits = [e for _path, batch in plans for e in batch]
    added, refused = 0, []
    for e in edits:
        name, old = e["ch"], e.get("old", "")
        new = e.get("new", "")
        body_m = body_of(SITE / name)
        if not body_m:
            refused.append(f"{name}: no learn field")
            continue
        body = body_m.group("body")
        if "find" in e:
            # An entry written out in full, for the edit prose cannot express. Two
            # cases want it: a deletion that spans markup (a whole callout box that
            # is a note to the site's author rather than to the reader - nothing of
            # the markup survives a deletion, so it can go in one piece), and words
            # that occur more than once with the same neighbours. The `find` is
            # checked against the file here rather than trusted, so a stale one is
            # refused at curating time instead of at applying time.
            html, new = e["find"], e.get("to", "")
            seen = body.count(html)
            which = e.get("which", 0)
            if seen == 0 and any(x["find"] == html and x.get("which", 0) == which
                                 for x in cat.get(name, [])):
                # An exact entry that has already been applied occurs zero times,
                # which is the edit working rather than the edit lost. Without this
                # the file reported every entry it had ever applied as refused on
                # the second run, and a real typo would have been buried in that
                # noise - the same distinction the prose path already makes.
                print(f"  already curated: {name}: {html[:60]!r}")
                continue
            if seen != 1 and not (which and 1 <= which <= seen):
                refused.append(f"{name}: an exact entry occurs {seen} time(s) in the field: "
                               f"{html[:70]!r}")
                continue
            if new:
                bad = introduces_tell(new)
                if bad:
                    refused.append(f"{name}: the replacement would re-introduce {bad}: "
                                   f"{new[:60]!r}")
                    continue
            if any(x["find"] == html and x.get("which", 0) == which
                   for x in cat.get(name, [])):
                print(f"  already curated: {name}: {html[:60]!r}")
                continue
            cat.setdefault(name, []).append({"find": html, "to": new,
                                             "tell": e.get("tell", ""),
                                             "why": e.get("why", ""),
                                             "which": which})
            added += 1
            continue
        span = spell_span(body, old, e.get("which", 0))
        if not span and (e.get("which") and any(
                x.get("plain") == old and x.get("which", 0) == e.get("which", 0)
                for x in cat.get(name, []))):
            # An entry leaves the curate file readable in prose, and the catalogue
            # records the prose it was written as (`plain`), so a re-run can tell a
            # mistake from the work it already did. Without this, every applied
            # entry refuses on the second run - the words it was written against are
            # gone by design - and a genuine typo hides in the noise.
            print(f"  already curated: {name}: {old[:60]!r}")
            continue
        if not span and new and plain_index(body)[0].count(new) == 1:
            # Same case for the entries curated before the catalogue recorded the
            # prose: the replacement is in place and the original is not, which is
            # the edit done rather than the edit lost.
            print(f"  already in force: {name}: {old[:60]!r}")
            continue
        if not span:
            plain, _ = plain_index(body)
            near = ""
            head = old.split(" ")[:4]
            if head:
                at = plain.find(head[0])
                if at >= 0:
                    near = " - nearest: " + repr(plain[max(0, at - 40):at + 120])
            seen = plain.count(old)
            where = f" (it appears {seen} times - add \"which\" to say which one)" if seen > 1 else ""
            refused.append(f"{name}: {old[:70]!r} is not one place in the file{where}{near}")
            continue
        start, end, html = span
        if new:
            if "<" in html:
                refused.append(f"{name}: {old[:60]!r} spans markup - write this entry by "
                               f"hand as {html[:90]!r}")
                continue
            bad = introduces_tell(new)
            if bad:
                refused.append(f"{name}: the replacement would re-introduce {bad}: "
                               f"{new[:60]!r}")
                continue
        else:
            # A deletion takes the whitespace after it as well, so removing a whole
            # sentence does not leave two spaces or a line of blank markup behind.
            while end < len(body) and body[end] in " \t":
                end += 1
            html = body[start:end]
        if any(x["find"] == html and x.get("which", 0) == e.get("which", 0)
               for x in cat.get(name, [])):
            # --curate is meant to be safe to re-run: an edit already in the
            # catalogue is done, not an error, and appending it again is how the
            # catalogue came to hold the same edit twice.
            print(f"  already curated: {name}: {old[:60]!r}")
            continue
        cat.setdefault(name, []).append({"find": html, "to": new,
                                         "tell": e.get("tell", ""),
                                         "why": e.get("why", ""),
                                         "which": e.get("which", 0),
                                         "plain": old})
        added += 1
    CATALOGUE.write_text(json.dumps(cat, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"voice_rewrite: {added} entry(ies) appended to {CATALOGUE.relative_to(ROOT)}")
    for r in refused:
        print("  refused: " + r, file=sys.stderr)
    return 1 if refused else 0


def apply_catalogue(only=None, log_file=None) -> int:
    """Apply the catalogue. `only` limits it to some chapter files and `log_file`
    writes the pass record somewhere else - both exist so --roundtrip can undo and
    redo a pass against a scratch record without touching the real one."""
    cat = load_catalogue()
    if only is not None:
        cat = {k: v for k, v in cat.items() if k in only}
    if not cat:
        print("voice_rewrite: the catalogue is empty")
        return 0
    record = Path(log_file) if log_file else APPLIED
    log = {}
    if record.exists():
        log = json.loads(record.read_text(encoding="utf-8"))
    problems, applied = [], 0
    for name, entries in cat.items():
        # `problems` is the report for the whole run, so it accumulates. The
        # decision to skip a file has to be about *this* file: with a bare
        # `if problems:` the first refusal abandoned every later chapter in
        # silence, and the pass printed "applied N edits" as if it had finished.
        mark = len(problems)
        path = SITE / name
        raw = path.read_text(encoding="utf-8")
        m = body_of(path)
        body = m.group("body")
        before = digest(body)
        # Work out every replacement first: a file is only written when all of
        # its entries fit, so a typo in one entry cannot leave a half-edited file.
        # The catalogue is a to-do list, not a re-apply-later list: an entry whose
        # text is already gone is done, provided the record agrees that this file had
        # it applied. An absent `find` with no record behind it is a stale or
        # mistyped entry, and that is the case worth refusing over - it is how a
        # rewrite silently stops matching the text it was written for.
        # The same edit listed twice is not a harmless repetition: both copies plan
        # against the untouched body, both find one occurrence, and the second one
        # splices its replacement into the text the first one just wrote - which
        # reads as corruption (`exact:ources on other machines`), not as a duplicate
        # edit. A catalogue is written by hand and by --curate, and --curate used to
        # append a second copy on every re-run, so this is checked rather than
        # assumed.
        dupes = [f for f in {(e["find"], e.get("which", 0)) for e in entries}
                 if len([1 for e in entries
                         if (e["find"], e.get("which", 0)) == f]) > 1]
        if dupes:
            problems.append(f"{name}: the catalogue lists {len(dupes)} edit(s) twice, which "
                            f"would splice the second copy into the first's output -> "
                            f"{dupes[0][0][:60]!r}")
            continue
        done_finds = {r["find"] for r in all_records(log, name)} | {e["find"] for e in entries if e.get("applied")}
        flagged = {e2["find"] for e2 in entries if e2.get("applied")}
        planned = []
        for e in entries:
            find, to = e["find"], e.get("to", "")
            # An entry already recorded or flagged as applied is done, whatever the
            # text looks like now. That check has to come before the count: an
            # *insertion* keeps its anchor (`find` sits inside `to`), so the anchor is
            # still there afterwards and the earlier version of this loop applied the
            # pointer line a second time in chapter 2.
            if find in done_finds or find in flagged:
                continue
            count = body.count(find)
            which = e.get("which", 0)
            if count != 1 and not (which and 1 <= which <= count):
                problems.append(f"{name}: `find` occurs {count} time(s), expected 1 -> "
                                f"{find[:70]!r}")
                continue
            if count == 1:
                at = body.index(find)
            else:                       # the nth occurrence, counted from 1
                at = -1
                for _ in range(which):
                    at = body.index(find, at + 1)
            bad = introduces_tell(to)
            if bad:
                problems.append(f"{name}: replacement would re-introduce {bad} in {to[:60]!r}")
                continue
            planned.append((at, find, to, e))
        # Two spans over the same words are not two edits, they are one edit written
        # twice by different routes - and the result is text nobody wrote: each entry
        # plans against the untouched body, so the second splice lands on the first
        # one's output and takes whatever followed it with it. This is not
        # theoretical. An entry whose span was written by hand with the wrong end
        # (both "pictures for this section" sentences start with the same words)
        # covered six thousand characters of Unit 2, and the apply deleted them;
        # they were recovered from the last build in dist-dcc/. A refusal is cheap.
        planned.sort(key=lambda p: p[0])
        for (a1, f1, _t1, _e1), (a2, _f2, _t2, e2) in zip(planned, planned[1:]):
            if a2 < a1 + len(f1):
                problems.append(f"{name}: two entries overlap at {a1} and {a2} - "
                                f"{f1[:50]!r} and {e2['find'][:50]!r}")
        if len(problems) > mark:
            continue
        # Apply from the end backwards so that every earlier index stays valid.
        new_body, records = body, []
        for idx, find, to, e in sorted(planned, key=lambda p: p[0], reverse=True):
            records.append({"index": idx, "find": find, "to": to,
                            "tell": e.get("tell", ""), "why": e.get("why", "")})
            new_body = new_body[:idx] + to + new_body[idx + len(find):]
        path.write_text(raw[:m.start("body")] + new_body + raw[m.end("body"):], encoding="utf-8")
        entry = log.get(name)
        history = entry.get("passes") if isinstance(entry, dict) else entry
        log[name] = {"passes": list(history or []) + [{"before": before, "after": digest(new_body), "entries": records}]}
        applied += len(records)
    if json.dumps(log, sort_keys=True) != (json.dumps(json.loads(record.read_text(encoding="utf-8")), sort_keys=True)
                                           if record.exists() else ""):
        record.write_text(json.dumps(log, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"voice_rewrite: applied {applied} edit(s) across {len(log)} chapter(s)")
    for p in problems:
        print("  refused: " + p, file=sys.stderr)
    return 1 if problems else 0


def restore() -> int:
    if not APPLIED.exists():
        print("voice_rewrite: nothing recorded to restore")
        return 0
    log = json.loads(APPLIED.read_text(encoding="utf-8"))
    for name in log:
        path = SITE / name
        raw = path.read_text(encoding="utf-8")
        body = body_of(path).group("body")
        # Newest pass first: each pass's indexes are valid for the state it ran on,
        # so undoing in that order is what makes them comparable at all. Both
        # fingerprints are checked, so a file edited by hand in between is refused
        # rather than half-restored.
        for p in reversed(passes(log, name)):
            if digest(body) != p["after"]:
                print(f"voice_rewrite: {name} has changed since that pass; refusing to restore",
                      file=sys.stderr)
                return 1
            spans = sorted((e["index"], e["index"] + len(e["find"])) for e in p["entries"])
            if any(c < b for (_a, b), (c, _d) in zip(spans, spans[1:])):
                print(f"voice_rewrite: {name} has a pass with overlapping entries, which "
                      f"cannot be undone by position; refusing to restore", file=sys.stderr)
                return 1
            for e in reversed(p["entries"]):
                # Reverse of the order they were written (largest index first), which
                # is the only order in which every recorded index is still valid.
                pos = e["index"]
                if body[pos:pos + len(e["to"])] != e["to"]:
                    print(f"voice_rewrite: {name} entry {e['index']} is not where it was recorded",
                          file=sys.stderr)
                    return 1
                body = body[:pos] + e["find"] + body[pos + len(e["to"]):]
            if digest(body) != p["before"]:
                print(f"voice_rewrite: {name} did not restore to the state before that pass",
                      file=sys.stderr)
                return 1
        path.write_text(raw[:body_of(path).start("body")] + body + raw[body_of(path).end("body"):],
                        encoding="utf-8")
    print(f"voice_rewrite: restored {len(log)} chapter(s) byte-exactly")
    return 0


def reindex() -> int:
    """Rebuild a file's record from the catalogue, for work applied before the record
    kept passes.

    The catalogue says find -> to. Reverse-applying an entry (to -> find) at the one
    place its replacement sits reconstructs the text as it was before that entry,
    and recording the position it sat at makes the forward direction replayable. The
    reconstruction is then checked by applying it forwards again and comparing with
    the file on disk: a rebuilt record that cannot reproduce the current text is not
    written at all.
    """
    cat = load_catalogue()
    log = json.loads(APPLIED.read_text(encoding="utf-8")) if APPLIED.exists() else {}
    rebuilt = 0
    for name, entries in cat.items():
        path = SITE / name
        body = body_of(path).group("body")
        recorded = {r["find"] for r in all_records(log, name)}
        missing = [e for e in entries if e["find"] not in recorded]
        if not missing:
            continue
        current = body
        recovered = []
        # Catalogue order, which is ascending: the original apply walked backwards
        # (highest index first), so its inverse has to walk forwards. Reversing here
        # instead produced a reconstruction that replayed to a different text, and
        # the replay check below refused to record it.
        for e in missing:
            find, to = e["find"], e.get("to", "")
            # An insertion keeps its anchor, so `find` sitting in the notes is the
            # rewrite working, not the rewrite missing. Only a replacement or a
            # deletion has to have taken `find` away; the earlier version of this
            # check refused every insertion, which is why ch2's pointer could not be
            # recorded at all.
            if find in current and find not in to:
                problems = f"{name}: {find[:50]!r} is still in the notes, so it was never applied"
                print("voice_rewrite: " + problems, file=sys.stderr)
                return 1
            if to and current.count(to) != 1:
                print(f"voice_rewrite: {name}: cannot locate {to[:50]!r} (found "
                      f"{current.count(to)}) to rebuild its record", file=sys.stderr)
                return 1
            if to:
                idx = current.index(to)
            elif e.get("before"):
                # A deletion leaves nothing to search for, so the catalogue names the
                # text it was deleted from in front of. Without that the position is
                # unrecoverable, and a record that cannot put the text back is not a
                # record.
                if current.count(e["before"]) != 1:
                    print(f"voice_rewrite: {name}: cannot place the deleted block "
                          f"({current.count(e['before'])} anchors for {e['before'][:40]!r})", file=sys.stderr)
                    return 1
                idx = current.index(e["before"])
            else:
                print(f"voice_rewrite: {name}: {find[:40]!r} deletes text and names no "
                      f"`before` anchor, so its position cannot be recovered", file=sys.stderr)
                return 1
            recovered.append({"index": idx, "find": find, "to": to,
                              "tell": e.get("tell", ""), "why": e.get("why", "")})
            current = current[:idx] + find + current[idx + len(to):]
        # The reconstruction must replay: apply the recovered entries the way the
        # tool would have, and require the file back exactly.
        replay = current
        for e in sorted(recovered, key=lambda x: x["index"], reverse=True):
            replay = replay[:e["index"]] + e["to"] + replay[e["index"] + len(e["find"]):]
        if replay != body:
            print(f"voice_rewrite: {name}: the rebuilt record does not replay to the file "
                  f"on disk - refusing to write it", file=sys.stderr)
            return 1
        entry = log.get(name)
        history = entry.get("passes") if isinstance(entry, dict) else entry
        log[name] = {"passes": [{"before": digest(current), "after": digest(body),
                                 "entries": sorted(recovered, key=lambda x: x["index"])}] + list(history or [])}
        rebuilt += len(recovered)
    if rebuilt:
        APPLIED.write_text(json.dumps(log, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"voice_rewrite: rebuilt the record for {rebuilt} earlier rewrite(s)")
    return 0


def roundtrip() -> int:
    """Undo every recorded pass and redo it, then require the files back byte for byte.

    This is the claim `--restore` makes, tested end to end rather than argued: the
    notes are snapshotted in memory, restored (which refuses if any pass's
    fingerprints do not match), re-applied from the catalogue against a scratch
    record, and compared with the snapshot. Whatever happens, the snapshot is
    written back - a failed round trip must not leave the notes already undone - so
    the worst case is that this reports a failure and changes nothing.

    Chapters whose entries are only flagged `applied` (no index-based record, the
    limitation the ch2 pass carries) are skipped and named, rather than counted as
    proven.
    """
    if not APPLIED.exists():
        print("voice_rewrite: no record to round-trip")
        return 0
    log = json.loads(APPLIED.read_text(encoding="utf-8"))
    provable = {n for n, entry in log.items() if all_records(log, n)}
    flagged = {k for k, v in load_catalogue().items()
               if any(e.get("applied") for e in v)} - provable
    if not provable:
        print(f"voice_rewrite: nothing to prove ({len(flagged)} chapter(s) carry only the "
              f"applied flag: {', '.join(sorted(flagged))})")
        return 0
    scratch = ROOT / ".freebuff" / "roundtrip_log.json"
    if scratch.exists():
        scratch.unlink()
    whole = {n: (SITE / n).read_text(encoding="utf-8") for n in provable}
    bodies = {n: body_of(SITE / n).group("body") for n in provable}
    bad = None
    try:
        if restore():
            bad = "restore refused"
        elif apply_catalogue(only=provable, log_file=scratch):
            bad = "re-apply refused"
        else:
            for n, want in bodies.items():
                got = body_of(SITE / n).group("body")
                if got != want:
                    bad = f"{n} came back different after undo then redo"
                    break
    finally:
        # Put the notes back exactly as they were, win or lose, then drop the
        # scratch record: the real one was never touched, so the gate's --check
        # still describes the file that is on disk.
        for n, text in whole.items():
            (SITE / n).write_text(text, encoding="utf-8")
        if scratch.exists():
            scratch.unlink()
    if bad:
        print(f"voice_rewrite: FAIL - {bad}", file=sys.stderr)
        return 1
    print(f"voice_rewrite: round trip OK - {len(provable)} chapter(s) undone and redone "
          f"byte for byte" + (f"; skipped (applied flag only): {', '.join(sorted(flagged))}" if flagged else ""))
    return 0


def self_test() -> str:
    """A synthetic apply-then-restore that must reproduce its input exactly.

    Two entries with overlapping-by-proximity text, applied **descending** over
    indices recorded against the fixture and restored **ascending** over the same
    indices - the order the real tool uses. The earlier version of this test looked
    its indices up in the text as it mutated it, so it passed while the real restore
    (which uses positions recorded before the pass) could not: the test has to
    reproduce the flow, not a flow.

    This is the guard the earlier content tool did not have, and its absence is why
    one bad delimiter cost eight chapters their exam summaries.
    """
    fixture = ("<h2>4.3 Middleware</h2>\n\n<p>The deck gives CORBA as its example, and CORBA is a broker.</p>\n"
               "<p>The deck names four families, and each family is a broker pattern.</p>\n")
    plan = [
        ("The deck gives CORBA as its example, and ", ""),
        ("The deck names ", ""),
    ]
    entries = []
    for find, to in plan:
        if fixture.count(find) != 1:
            return f"self-test fixture is stale: {find!r} appears {fixture.count(find)} times"
        entries.append({"index": fixture.index(find), "find": find, "to": to})
    body = fixture
    for e in sorted(entries, key=lambda x: x["index"], reverse=True):
        body = body[:e["index"]] + e["to"] + body[e["index"] + len(e["find"]):]
    for e in sorted(entries, key=lambda x: x["index"]):
        if body[e["index"]:e["index"] + len(e["to"])] != e["to"]:
            return "self-test: a replacement is not where the record says after applying backwards"
        body = body[:e["index"]] + e["find"] + body[e["index"] + len(e["to"]):]
    if body != fixture:
        return "self-test: apply then restore did not reproduce the input"
    return ""


PROSE_FIELDS = ("learn", "reference", "slides")


def prose_fields(path: Path) -> list:
    """Each prose field of a chapter separately - `learn`, `reference`, `slides`.

    Kept apart as well as joined, because the two questions asked of them want
    different scopes. "Is the replacement still in force?" spans the fields: a
    rewrite of a figure's caption travels with the figure when the picture moves to
    the Reference tab (`tools/slim_dcc_figures.py`), so the panel changed and the
    caption a reader sees is the same sentence. "Is this entry ambiguous?" does not
    span them: a section heading legitimately appears in `learn` and again in
    `reference`, and counting that as the same sentence in two places flagged every
    entry that touched a heading.

    The chapter's data arrays are deliberately in neither: a quiz question is not
    prose that a rewrite was written against, and the retired wording may
    legitimately appear inside one as the subject being asked about.
    """
    raw = path.read_text(encoding="utf-8")
    out = []
    for name in PROSE_FIELDS:
        m = re.search(rf"\n  {name}: `(?P<body>.*?)\n`,\n", raw, re.S)
        if m:
            out.append(m.group("body"))
    return out


def prose_of(path: Path) -> str:
    """Every prose field of a chapter, concatenated. See `prose_fields`."""
    return "\n".join(prose_fields(path))


STRONG = re.compile(r"</?strong>")


def strip_emphasis(s: str) -> str:
    """The text with emphasis tags taken out, so a rewrite survives an emphasis pass.

    Only `<strong>` is touched. It is the one tag `tools/emphasis_audit.py` may
    remove, and it carries no words of its own - so this is a comparison of the
    words, which is what "the rewrite is still in force" means.
    """
    return STRONG.sub("", s)


def in_force(entry: dict, peers: list, body: str, _seen: tuple = ()) -> bool:
    """Is this rewrite still doing its job in `body`?

    The obvious test - the entry's `to` is somewhere in the file - is wrong for a
    pass that curates prose: the second pass over a sentence rewrites the first
    pass's replacement, so the earlier `to` is gone while nothing has been undone.
    What that looks like on Unit 4's citation is a chain: `(the course's first
    recommended textbook, Section 12.3)` was trimmed to `(Section 12.3)`, and then
    that very phrase became the anchor for the attribution span. The earlier entry's
    replacement is absent because a later entry's `find` ate it.

    So an entry counts as in force when its `to` is in the body, or when a peer
    written over the same words is - where `find` and `to` overlapping in either
    direction is the evidence that two entries touch the same words. The recursion
    is what keeps this from being a licence to ignore a revert: a chain is only
    excused if it ends in a replacement that really is in the file, and a revert of
    the whole passage puts an original `find` back, which the caller still reports.
    """
    if not entry["to"]:
        return True                     # a deletion: verified by its `find` being gone
    if body.count(entry["to"]) >= 1:
        return True
    # A second pass is allowed to change EMPHASIS without reverting a rewrite:
    # `tools/emphasis_audit.py` removes `<strong>` tags from runs that are not the
    # term being defined, and it may remove one that sits inside a replacement this
    # catalogue recorded. The words are untouched, so the rewrite is still in force
    # and this check must not call it a revert. Comparing with the emphasis tags
    # stripped is what makes the two passes compose; the original wording coming
    # back is still caught by the `find` test the caller runs, because that test is
    # about words rather than tags.
    if strip_emphasis(body).count(strip_emphasis(entry["to"])) >= 1:
        return True
    for other in peers:
        if other is entry or not other.get("find"):
            continue
        # Overlap in either direction is the evidence that two entries touch the
        # same words, and it is read as text as well as markup: one entry's span
        # ends at the `</p>` and the next one's stops at the full stop, so exact
        # containment alone misses the chain and reports two edits over one sentence
        # as a revert. A very short `to` (".", `</p>`) is left to exact containment,
        # because plain text that short overlaps everything.
        a = plain_index(other["find"])[0]
        b = plain_index(entry["to"])[0]
        if not (other["find"] in entry["to"] or entry["to"] in other["find"]
                or (len(b) >= 12 and (a in b or b in a))):
            continue
        if id(other) in _seen:
            continue
        if in_force(other, peers, body, _seen + (id(entry),)):
            return True
    return False


def check(only=None) -> int:
    """The gate step, over every chapter - or, with `only`, over one of them.

    `only` exists for `retire`: its transaction has to judge *the chapter it is
    changing*, and a check that also reports another chapter's problem would refuse
    a retirement for a defect it did not cause. That is not hypothetical - retiring
    two chain-linked entries in two chapters at once deadlocked, each one refusing
    because the other was still broken.
    """
    broken = self_test()
    if broken:
        print(f"voice_rewrite: FAIL - {broken}", file=sys.stderr)
        return 1
    problems = []
    cat = load_catalogue()
    log = json.loads(APPLIED.read_text(encoding="utf-8")) if APPLIED.exists() else {}
    for name in log:
        if only and name != only:
            continue
        m = body_of(SITE / name)
        if not m:
            problems.append(f"{name}: the learn field cannot be read")
            continue
        body = prose_of(SITE / name)
        # Per-entry, not a whole-body fingerprint: other passes edit this text too
        # (tools/fix_captions.py, tools/make_reference.py), and a gate step that
        # fails because a different tool touched a paragraph is a gate step people
        # learn to skip. The fingerprint still guards `--restore`, which is the
        # operation that must refuse to run on a file that has moved on.
        records = all_records(log, name)
        for e in records:
            # The replacement must still be present, and the original gone - unless a
            # later entry rewrote the same words, which `in_force` follows.
            if e["to"] and not in_force(e, records, body):
                problems.append(f"{name}: a rewritten passage has been reverted: {e['to'][:60]!r}")
            # `find` inside `to` is an insertion (the anchor is kept and something is
            # added in front of it), so seeing it again is the rewrite working, not
            # the rewrite being undone.
            if body.count(e["find"]) > 0 and e["find"] not in e["to"]:
                problems.append(f"{name}: the original wording is back: {e['find'][:60]!r}")
    # An entry whose `find` no longer fits anywhere is a stale catalogue entry,
    # which is exactly how a rewrite silently stops being applied.
    for name, entries in cat.items():
        if only and name != only:
            continue
        m = body_of(SITE / name)
        if not m:
            continue
        body = prose_of(SITE / name)
        fields = prose_fields(SITE / name)
        for e in entries:
            # Within one field is ambiguous; across fields is a heading that is
            # simply in two places. An entry that says which occurrence it means is
            # not ambiguous at all - the index is the disambiguation.
            if not e.get("which") and max((f.count(e["find"]) for f in fields), default=0) > 1:
                problems.append(f"{name}: `find` matches more than once now: {e['find'][:60]!r}")
            # An entry flagged applied has to prove it, every gate run: the original
            # wording gone and the replacement present. It carries the flag because it
            # was applied before this tool kept pass records, so there is no index to
            # undo it with - a limitation, stated rather than hidden.
            if e.get("applied"):
                if body.count(e["find"]) > 0:
                    problems.append(f"{name}: a flagged-applied entry is still in the notes: {e['find'][:60]!r}")
                elif not in_force(e, entries, body):
                    problems.append(f"{name}: a flagged-applied replacement is missing: {e['to'][:60]!r}")
    if problems:
        print(f"voice_rewrite: FAIL - {len(problems)} problem(s)", file=sys.stderr)
        for p in problems[:12]:
            print("  " + p, file=sys.stderr)
        return 1
    done = sum(len(all_records(log, name)) for name in log)
    print(f"voice_rewrite: OK - {done} rewrite(s) in place across {len(log)} chapter(s), self-test green")
    return 0


SUPERSEDED = "_superseded"


def retire(chapter: str, match: str, which: int, reason: str) -> int:
    """Move one pinned entry out of the catalogue and out of the applied record.

    A rewrite is pinned by two files at once. `data/voice_rewrites.json` holds the
    plan (`find` -> `to`) and `data/voice_applied.json` holds the pass that carried
    it out; `--check` reads the record, so removing a retired entry from the
    catalogue alone leaves the gate failing on a rewrite that is no longer there,
    and removing it from the record alone leaves the catalogue still insisting on
    an edit nobody wants. Doing it by hand is two JSON edits and a chance to leave
    the two disagreeing - which is why this is one command.

    The entry moves to the catalogue's `_superseded` list, carrying the reason it
    was retired; the pass that applied it loses that entry and keeps the
    fingerprints it was recorded with, and a pass that held nothing else is dropped
    rather than left as an empty shell. The chapter's text is not touched: a
    retirement is a statement that the record no longer owns those words, and the
    next pass is free to edit them.

    `--match` has to fit exactly one entry, and it is read against the entry's
    `find` and its `to` - the fragments are long HTML, so a substring is the only
    practical handle, and the half worth naming is sometimes the rewrite (a whole
    sentence a later pass wants to split) rather than the original it replaced.
    "Exactly one" is what keeps a typo from retiring the wrong sentence, and
    `--which N` disambiguates when the same fragment was curated twice.

    The write is **transactional**: the gate is run against the retired state, and
    if it goes red both files are put back and nothing changes. The case that needs
    this is a *chain* - one entry's replacement became the next entry's anchor, so
    dropping the second leaves the first with a replacement the neighbour was
    excusing. That is a real thing to fix, but it is not a thing to discover as a
    red gate afterwards, and a retire that half-applied would be worse than none.
    """
    if not (SITE / chapter).exists():
        print(f"voice_rewrite: {chapter} is not a chapter file", file=sys.stderr)
        return 1
    cat_text = CATALOGUE.read_text(encoding="utf-8")
    app_text = APPLIED.read_text(encoding="utf-8") if APPLIED.exists() else None
    cat = json.loads(cat_text)
    entries = cat.get(chapter) or []
    hits = [e for e in entries
            if (match in e.get("find", "") or match in (e.get("to") or ""))
            and (not which or e.get("which", 0) == which)]
    if not hits:
        gone = [s for s in cat.get(SUPERSEDED, [])
                if s.get("ch") == chapter
                and (match in s.get("find", "") or match in (s.get("to") or ""))]
        if gone:
            print(f"voice_rewrite: already retired - {match[:60]!r}")
            return 0
        print(f"voice_rewrite: no entry in {chapter} has {match!r} in it", file=sys.stderr)
        return 1
    if len(hits) > 1:
        print(f"voice_rewrite: {match!r} fits {len(hits)} entries in {chapter}; "
              f"add --which to say which one", file=sys.stderr)
        for e in hits[:8]:
            print(f"    which={e.get('which', 0)}: {e.get('find', '')[:70]!r}", file=sys.stderr)
        return 1
    entry = hits[0]
    cat[chapter] = [e for e in entries if e is not entry]
    if not cat[chapter]:
        del cat[chapter]
    cat.setdefault(SUPERSEDED, []).append({**entry, "ch": chapter, "reason": reason})

    dropped = 0
    removed_passes = 0
    log = json.loads(app_text) if app_text else None
    if log is not None and chapter in log:
        kept = []
        for p in passes(log, chapter):
            rest = [e for e in p["entries"]
                    if not (e["find"] == entry["find"]
                            and e.get("to", "") == entry.get("to", ""))]
            dropped += len(p["entries"]) - len(rest)
            if rest or not p["entries"]:
                # A pass that already held nothing stays as it is; only a pass that
                # *became* empty is dropped.
                kept.append({**p, "entries": rest})
            else:
                removed_passes += 1
        log[chapter] = {"passes": kept}

    CATALOGUE.write_text(json.dumps(cat, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    if log is not None:
        APPLIED.write_text(json.dumps(log, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    # Transactional: the gate decides. A retire that would leave a peer entry with
    # nothing to excuse its missing replacement is refused and both files go back.
    quiet = io.StringIO()
    with contextlib.redirect_stdout(quiet), contextlib.redirect_stderr(quiet):
        verdict = check(only=chapter)
    if verdict:
        CATALOGUE.write_text(cat_text, encoding="utf-8")
        if app_text is not None:
            APPLIED.write_text(app_text, encoding="utf-8")
        print(f"voice_rewrite: refusing to retire {entry.get('find', '')[:50]!r} - the gate "
              f"would go red:", file=sys.stderr)
        for line in [ln for ln in quiet.getvalue().splitlines() if ln.strip()][:4]:
            print("  " + line.strip(), file=sys.stderr)
        print("  The entry is probably a link in a chain: another entry's replacement is "
              "only in force because this one is. Retire the peer too, or retire it in "
              "plan.md's sense (edit the text, then the catalogue).", file=sys.stderr)
        return 1

    if removed_passes:
        print(f"voice_rewrite: dropped {removed_passes} pass(es) that held only that entry")
    print(f"voice_rewrite: retired {chapter} {entry.get('find', '')[:50]!r} "
          f"({dropped} applied record(s) removed); reason recorded in {SUPERSEDED}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--context", metavar="CH")
    ap.add_argument("--full", action="store_true",
                    help="with --context, print each sentence whole instead of clipped")
    ap.add_argument("--plain", action="store_true",
                    help="with --context, print the readable text an entry is written against")
    ap.add_argument("--curate", action="store_true",
                    help="turn data/voice_curate.json into catalogue entries")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--restore", action="store_true")
    ap.add_argument("--roundtrip", action="store_true",
                    help="undo every recorded pass, redo it, and require the files back byte for byte")
    ap.add_argument("--reindex", action="store_true",
                    help="rebuild the record from the catalogue for work applied before passes were kept")
    ap.add_argument("--retire", metavar="CH",
                    help="move one pinned entry to _superseded and out of the applied record")
    ap.add_argument("--match", metavar="TEXT",
                    help="with --retire, a substring that fits exactly one entry (`find` or `to`)")
    ap.add_argument("--which", type=int, default=0,
                    help="with --retire, the occurrence to retire when the fragment repeats")
    ap.add_argument("--reason", default="",
                    help="with --retire, why the entry is being retired (recorded with it)")
    args = ap.parse_args()
    if args.retire:
        if not args.match:
            ap.error("--retire needs --match")
        if not args.reason:
            ap.error("--retire needs --reason")
        return retire(args.retire, args.match, args.which, args.reason)
    if args.context:
        return context(args.context, args.full, args.plain)
    if args.curate:
        return curate()
    if args.reindex:
        return reindex()
    if args.restore:
        return restore()
    if args.roundtrip:
        return roundtrip()
    if args.check:
        return check()
    if args.apply:
        return apply_catalogue()
    ap.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
