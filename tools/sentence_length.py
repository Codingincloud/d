#!/usr/bin/env python3
"""How long is a sentence in these notes?

"These content seem hard" is a real complaint and an unmeasurable one, so this tool
makes it a number: the notes' prose, sentence by sentence, with the mean, the
longest, and the count over the two thresholds that matter for a reader on a phone.

Three things are excluded, because counting them makes the number meaningless:

  * **tables.** A row of a table is not a sentence. `plain()` on a table glues its
    cells into one string ("Public Private Community Hybrid Ease of setup and use
    Easy Requires IT proficiency ..."), which measured 104 words in the first run of
    this tool and is not a sentence anybody has to read.
  * **quotations.** A passage in quotes is the source's wording, kept as it stands,
    and rewriting it would be a fabrication. Its words are taken out of the
    measurement - but its punctuation is kept, because that is where the sentence
    ends - and it is counted on its own, because a long quotation is still a hard
    thing to meet on the page even though it is not the notes' own prose.
  * **figures**, whose text is the labels inside a picture ("Edge - the devices
    milliseconds · tiny compute  Fog - nodes near the edge"), and which `plain()`
    glues into one 109-word "sentence" that nobody is asked to read.
  * **headings.** "1.3 Examples: Google File System, Hadoop, BitTorrent, etc" is a
    label, not a sentence anybody parses, and 157 of the runs this tool first
    counted were headings. None of them was long (the longest is 12 words), but
    they still belong in the sentence count only as headings, and leaving them in
    is what made the mean look lower than the prose really is.

And one thing is read the way a reader reads it rather than the way the markup is
written: **a block is a sentence.** The first version of this tool replaced every
tag with a space, so a paragraph, the list item under it and the heading above it
became one run of 73 words that no reader ever meets as a sentence - the count was
149 over 45 words, of which 43 were that artifact. Breaking on `</p>`, `</li>`,
`</h3>` and the like (the reader `tools/voice_audit.py` already uses for the prose
tells) leaves 106 real ones, and the longest falls from 96 words to 78.

Measured both ways, across the nine units:

| reading | sentences | mean | over 34 | over 45 | longest |
| :--- | ---: | ---: | ---: | ---: | ---: |
| tags to spaces, quoted words counted | 1192 | 28.0 | 323 | 149 | 96 |
| blocks end a sentence | 1436 | 22.3 | 269 | 105 | 78 |
| headings out, quotations excluded | **1279** | **24.3** | **269** | **105** | **78** |


    python tools/sentence_length.py            # the table
    python tools/sentence_length.py --list     # the worst sentences, with their section
"""

from __future__ import annotations

import argparse
import html as htmllib
import pathlib
import re
import statistics
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "dcc-site"

# Long, not short: a 34-word sentence is readable, a 45-word one usually is not.
WATCH = 34
LONG = 45

TABLE = re.compile(r"<table\b.*?</table>", re.S)
PRE = re.compile(r"<pre\b.*?</pre>", re.S)
# A figure is a drawing or a pasted slide. Its text is the labels inside a picture
# ("Edge - the devices  milliseconds · tiny compute  Fog - nodes near the edge"), and
# `plain()` glues them into one 109-word "sentence" that nobody is asked to read.
FIGURE = re.compile(r"<figure\b.*?</figure>", re.S)
HEAD = re.compile(r"<h[1-6]>.*?</h[1-6]>", re.S)
QUOTE = re.compile(r"&ldquo;.*?&rdquo;|\u201c.*?\u201d", re.S)
SENT = re.compile(r"(?<=[.!?])\s+")
HEADING = re.compile(r"<h([23])>(.*?)</h\1>", re.S)
# Where one reading run ends and the next begins. The same list `voice_audit.py`
# uses, and for the same reason: a paragraph, a list item, a table row and a heading
# are separate things on the page, and glueing them together measures a sentence the
# reader never meets. The closing tags of the wrappers are included - `</div>` ends a
# block that holds several paragraphs and would otherwise run two of them together.
BLOCK = re.compile(r"</(?:p|li|h[1-6]|td|th|caption|div|tr|table|ul|ol|section)>", re.I)
# A block that already ends in punctuation - and a great many do, because that is
# what a full stop is for - ends its sentence without help. Turning its close tag
# into another full stop produced `nothing else..` and `does not block the other..`
# in a third of the listed sentences, which is the tool inventing a typo and then
# reporting it as prose. The tag is swallowed with the whitespace in front of it so
# the next block does not inherit a leading space.
BLOCK_ENDED = re.compile(r"(?<=[.!?])\s*</(?:p|li|h[1-6]|td|th|caption|div|tr|table|ul|ol|section)>", re.I)
BR = re.compile(r"<br\s*/?>", re.I)
TAG = re.compile(r"<[^>]+>")


def read(p: pathlib.Path) -> str:
    with open(p, encoding="utf-8", newline="") as handle:
        return handle.read()


def plain(s: str) -> str:
    s = TAG.sub(" ", s)
    s = htmllib.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def readable(s: str) -> str:
    """The text as a reader meets it: a block boundary is a sentence boundary.

    A tag is a space, as it was before; a block's closing tag is a full stop, which
    is what stops `</p><ul><li>` from joining a paragraph to the list item under it.
    """
    s = BLOCK_ENDED.sub(" ", s)
    s = BLOCK.sub(". ", s)
    s = BR.sub(". ", s)
    s = TAG.sub(" ", s)
    s = htmllib.unescape(s)
    s = re.sub(r"\s+", " ", s).strip()
    # An emphasis tag is not a block, so `word.</strong></p>` arrives as `word. .`:
    # the same invented full stop, one tag deeper.
    return re.sub(r"([.!?]) \.", r"\1", s)


def unquoted(s: str) -> str:
    """The reading text with each quotation's words taken out, its punctuation kept.

    Only the words go: a quotation that ends mid-paragraph ends *with* a full stop
    inside the closing quote mark, and dropping that too would join the sentence
    before it to the sentence after it. What is left is punctuation, which is what a
    boundary needs and is not prose to be measured.
    """
    return QUOTE.sub(lambda m: "".join(c for c in plain(m.group(0)) if not c.isalnum()), s)


def learn_body(path: pathlib.Path) -> str:
    """The `learn` literal alone.

    The end marker is `\\r?\\n`, not `\\n`: these chapter files are CRLF, so the first
    version of this line never found the close, fell through to `len(text)`, and
    measured the quiz and past-question arrays as if they were note prose. That is
    why the first run reported a 306-word "sentence" containing `' }, { q: '...`.
    """
    text = read(path)
    start = text.index("  learn: `") + len("  learn: `")
    m = re.search(r"\r?\n`,\r?\n", text[start:])
    end = start + m.start() if m else len(text)
    return text[start:end]


def prose_only(body: str) -> str:
    body = TABLE.sub(" ", body)
    body = PRE.sub(" ", body)
    body = FIGURE.sub(" ", body)
    return body


def measured(body: str) -> str:
    """The prose this tool scores: the notes' own sentences, quotations aside.

    Headings are taken out here rather than in `prose_only`, because the section
    reader below still needs them to say which section an offender sits in.
    """
    return unquoted(readable(HEAD.sub(" ", prose_only(body))))


def sentences_of(piece: str) -> list:
    return [s.strip() for s in SENT.split(piece) if len(s.split()) >= 6]


def quoted_blocks(body: str) -> list:
    """The quotations the measurement leaves out, with their word counts."""
    out = []
    for m in QUOTE.finditer(prose_only(body)):
        words = len(plain(m.group(0)).split())
        if words >= 6:
            out.append((words, plain(m.group(0))))
    return out


def sections(body: str) -> list:
    """(heading text, text of the section) so an offender can be located."""
    heads = list(HEADING.finditer(body))
    out = []
    for i, h in enumerate(heads):
        stop = heads[i + 1].start() if i + 1 < len(heads) else len(body)
        out.append((plain(h.group(2)), body[h.end():stop]))
    return out


def chapters() -> list:
    return sorted(SITE.glob("ch*.js"), key=lambda p: int(re.search(r"\d+", p.stem).group()))


def report(listing: bool) -> int:
    print("  chapter   sentences   mean   over 34   over 45   longest")
    rows = []
    quotes = []
    for path in chapters():
        body = prose_only(learn_body(path))
        sents = sentences_of(measured(body))
        if not sents:
            continue
        lengths = [len(s.split()) for s in sents]
        rows.append((path.name, len(sents), statistics.mean(lengths),
                     sum(1 for n in lengths if n > WATCH),
                     sum(1 for n in lengths if n > LONG), max(lengths)))
        quotes.extend(quoted_blocks(body))
    for name, n, mean, watch, long_, longest in rows:
        print(f"  {name:<10}{n:>9}{mean:>8.1f}{watch:>11}{long_:>10}{longest:>10}")
    tot = sum(r[1] for r in rows)
    if tot:
        print(f"  {'all':<10}{tot:>9}"
              f"{statistics.mean([r[2] for r in rows]):>8.1f}"
              f"{sum(r[3] for r in rows):>11}{sum(r[4] for r in rows):>10}")
    print(f"\n  prose sentences over {WATCH} words: {sum(r[3] for r in rows)} of {tot} "
          f"({round(100 * sum(r[3] for r in rows) / max(1, tot))}%)")
    print(f"  over {LONG} words: {sum(r[4] for r in rows)}")
    over = [q for q in quotes if q[0] > LONG]
    print(f"  quotations kept as the source's wording, not measured: {len(quotes)} "
          f"({len(over)} over {LONG} words, longest "
          f"{max([q[0] for q in quotes], default=0)})")
    if not listing:
        return 0
    print("\n-- the longest sentences, by section --")
    found = []
    for path in chapters():
        body = prose_only(learn_body(path))
        for title, piece in sections(body):
            for s in sentences_of(measured(piece)):
                n = len(s.split())
                if n > LONG:
                    found.append((n, path.name, title, s))
    for n, name, title, s in sorted(found, reverse=True):
        print(f"\n  {n}w  {name}  [{title[:60]}]")
        print(f"    {s[:400]}")
    if over:
        print("\n-- quotations over the same length, kept verbatim --")
        for n, q in sorted(over, reverse=True):
            print(f"\n  {n}w  {q[:400]}")
    return 0


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError):
        pass
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args()
    return report(a.list)


if __name__ == "__main__":
    raise SystemExit(main())
