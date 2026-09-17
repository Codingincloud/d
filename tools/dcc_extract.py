#!/usr/bin/env python3
"""dcc_extract.py — read every Distributed & Cloud Computing source into text.

Why this exists
---------------
The DCC material is 101 MB across four shapes, and only some of it can be read
the easy way:

    .pptx      python-pptx reads the nine decks directly
    .ppt       legacy binary; PowerPoint's own COM interface converts it
    .pdf text  pdfplumber, page by page
    .pdf scan  no text layer at all — must be OCR'd (the syllabus is one of these)

Half the PDFs are pure scans, so there is no way to read the material without an
OCR step. There is no Tesseract on this machine and installing one is not our
call, but Windows ships an OCR engine (Windows.Media.Ocr) that reads these pages
well; `tools/win_ocr.ps1` drives it. The whole pipeline therefore runs with no
install and no network.

Three findings shaped this tool, each of them a page that came back as garbage
before it was understood:

1. **The page is the unit of decision, not the file.** A PDF can carry a text
   layer on one page and a scan on the next, so every page is tried for text
   first and only rendered and OCR'd when that comes back empty. This is what
   makes `REST_SOAP_webservices.pdf` (31 pages, 560 chars of text layer in the
   first three) come out whole instead of mostly blank.

2. **600 DPI, not 300.** Half the decks here are landscape slides laid out on
   portrait pages, so their type renders at roughly half its natural size. At
   300 DPI Windows' engine returned four characters for a page and it looked
   like a broken render; the same page at 600 DPI reads as clean English. The
   ink is real either way — the resolution is what decides whether it is
   legible.

3. **Some decks are printed sideways.** With no `/Rotate` flag on the page, the
   only way to know is to ask the OCR engine: the orientation that recognises
   the most characters is the orientation of the text. That is probed once per
   file, and any single page that still comes back thin is retried in the other
   three orientations, because a file is not obliged to be consistent.

4. **The most valuable text is inside the pictures, and a slide can have both.**
   Chapter 6 is 47 slides carrying under 4 KB of text, because its slides *are*
   screenshots. But the worse case is the opposite one: measured across the nine
   decks there are 394 slides and 179 pictures, and **50 slides that carry a
   paragraph of text frames and a picture with text in it**. A rule that OCR'd
   only the apparently-empty slides skipped all 50 — 24 of them in Chapter 3,
   where the diagrams answer the question. So every slide is now rendered at
   3840 px and read, and the two readings are merged rather than concatenated:
   only the lines the text frames did not already contain are kept, tagged so a
   reader can tell which is which. A page with a text layer *and* an image gets
   the same treatment (`[image text]`), because a screenshot pasted into a PDF
   page is just as invisible to the text layer as a slide's is.

Output is one `.txt` per source under `_source/dcc/`, each with a header naming
the source, the method, the DPI and rotation used and the SHA-256 of the input,
plus a `MANIFEST.json` for the whole run. Nothing here is part of the site: this
is the evidence layer the chapter notes are written from.

Usage
-----
    python tools/dcc_extract.py --list                   # what would be read, and how
    python tools/dcc_extract.py                          # everything
    python tools/dcc_extract.py --only syllabus
    python tools/dcc_extract.py --only lecture --force
    python tools/dcc_extract.py --only Kindberg --pages 1-24
    python tools/dcc_extract.py --no-ocr --force         # text layers only (fast)
"""
from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'dcc'
OUT = ROOT / '_source' / 'dcc'
TMP = ROOT / '.freebuff' / 'dcc_ocr'
PS1 = ROOT / 'tools' / 'win_ocr.ps1'

# Below this many characters a page is treated as having no usable text layer.
PAGE_TEXT_MIN = 40
# A page that returns less than this from OCR is retried in every orientation:
# it means the engine saw ink but could not read it, which is what sideways type
# looks like. A genuinely empty page says so and is left alone.
OCR_THIN = 120
# See finding 2 in the module docstring.
RENDER_DPI = 600
# Rendered pages are written here as p0001.png; a batch directory is cleared
# before use so a page number can never pick up another file's image.
BATCH_DIR = 'batch'
# Chunk size for one PowerShell invocation. A whole book is ~1000 pages and the
# directory approach avoids any command-line length limit, but a chunk keeps a
# crash or a timeout from costing the entire run.
OCR_CHUNK = 120
# Slide export geometry. A 16:9 deck at 3840 px wide is ~288 DPI, which is where
# small footnote type on a slide stops dissolving. Every slide is exported and
# read (see read_pptx), so this is the resolution the whole course is read at.
SLIDE_W, SLIDE_H = 3840, 2160

ROTATIONS = (0, 90, 180, 270)


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def slug(text: str) -> str:
    """A filename-safe form of a title.

    Lowercased FIRST, then separated: doing it the other way round treats every
    capital as a separator, so `REST_SOAP_x` collapses to `webservices_x` and
    `Lecture Notes` to `ecture_otes` - the substitution eats the capital and the
    strip then eats the underscore it left at the front.
    """
    return re.sub(r'[^a-z0-9]+', '_', text.lower()).strip('_') or 'x'


def norm_for_compare(text: str) -> str:
    """Squash a string to letters and digits so two readings can be compared.

    OCR of a paragraph and that paragraph's own text layer differ in case,
    spacing, line breaks and punctuation ("Remote Procedure Call (RPC)" vs
    "Remote Procedure Call (RPC)"), and one of them may hyphenate at the line
    end. Stripping everything but a-z0-9 makes them the same string, which is
    what lets the merge below tell new text from a second reading of text we
    already have.
    """
    return re.sub(r'[^a-z0-9]+', '', text.lower())


# How alike two lines must be, once normalised, to count as the same line.
# Similarity rather than equality is needed because a slide that carries text as
# BOTH a text frame and a picture of that frame comes back with the OCR version
# misreading a character or two: "M1" comes back "MI", "A => B" comes back
# "A = > B". Those are the same sentence, and adding the second copy buries the
# diagram labels the merge exists to find.
NEAR_DUPLICATE = 0.72
# Below this many normalised characters, similarity is meaningless — two
# different three-letter words are 66% alike — so short lines are only ever
# matched by containment.
FUZZY_MIN_CHARS = 12


def _same_line(norm: str, known: list[str]) -> bool:
    """Is this normalised line already present, exactly or near enough?"""
    for k in known:
        if not k:
            continue
        if norm in k or k in norm:
            return True
        if len(norm) < FUZZY_MIN_CHARS or len(k) < FUZZY_MIN_CHARS:
            continue
        # Length is a cheap filter: lines that differ by half their length
        # cannot be near-duplicates, and this skips most comparisons.
        if abs(len(k) - len(norm)) > max(len(k), len(norm)) * 0.45:
            continue
        if difflib.SequenceMatcher(None, norm, k).ratio() >= NEAR_DUPLICATE:
            return True
    return False


def merge_ocr_text(known_text: str, ocr_text: str, tag: str = '[image text]') -> str:
    """Keep only the lines the OCR found that `known_text` did not already have.

    This is the whole answer to text embedded in pictures. A slide can carry
    both a paragraph of text frames *and* a screenshot of a diagram with real
    labels in it, and the text frames alone say nothing about the diagram. OCR
    the rendered slide and keeping only what the text frames did not already
    give us yields exactly the difference: the labels, the axis names, the notes
    written inside the screenshot.

    An empty `known_text` — a slide that is one big picture, which is most of
    Chapter 6 — keeps everything, because there is nothing to be a duplicate of.
    Lines are matched against both the known text and what has already been kept,
    so OCR repeating itself once is not added twice.
    """
    known = [n for n in (norm_for_compare(l)
                         for l in known_text.splitlines()) if n]
    kept: list[str] = []
    for line in ocr_text.splitlines():
        line = line.strip()
        if len(line) < 3:
            continue
        n = norm_for_compare(line)
        if not n or _same_line(n, known) or _same_line(n, [norm_for_compare(k) for k in kept]):
            continue
        kept.append(line)
    if not kept:
        return ''
    return f'{tag} ' + '\n'.join(kept)


def score_text(text: str) -> int:
    """How much *readable* text is this? Used to choose an orientation.

    Character count is the wrong measure. Sideways type comes back as hundreds
    of one- and two-character lines ('Q)', 'o', 'O'), and that noise out-counts
    a page of real prose - which is exactly how a correctly-oriented page got
    scored as the worst of the four. Weighting only lines long enough to be
    words fixes it: three characters or fewer is noise in every orientation.
    """
    return sum(len(l) for l in text.splitlines() if len(l.strip()) >= 4)


def out_name(path: Path) -> str:
    """A stable, readable name for a source, keeping its folder as a prefix."""
    rel = path.relative_to(SRC)
    parts = list(rel.parts)
    stem = slug(Path(parts[-1]).stem)
    folder = slug(parts[0]) if len(parts) > 1 else ''
    # Chapter folders all read "chapter n - ..."; the number is the useful bit.
    m = re.match(r'chapter_(\d+)', folder)
    if m:
        folder = f'ch{m.group(1)}'
    return f'{folder}_{stem}' if folder else stem


# --------------------------------------------------------------------------- #
# OCR
# --------------------------------------------------------------------------- #
def run_ocr(paths: list[Path]) -> dict[str, str]:
    """OCR image files in ONE PowerShell process each chunk; {filename: text}.

    Starting PowerShell costs about a second and a page costs about one more, so
    a per-page call would spend most of a book's runtime on process startup.
    """
    if not paths:
        return {}
    files = sorted({str(p) for p in paths})
    # The list goes over stdin, one path per line. Naming the files explicitly
    # rather than pointing the engine at their directory matters: those
    # directories are shared between a page render and the slide export, so
    # `-Dir` re-OCRs pages nobody asked about. stdin also has no length limit,
    # which a book's worth of paths would otherwise run into.
    result = subprocess.run(
        ['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass',
         '-File', str(PS1), '-FromStdin'],
        input='\n'.join(files), capture_output=True, text=True,
        encoding='utf-8', errors='replace', timeout=7200)
    if result.returncode != 0 and not result.stdout:
        raise RuntimeError(f'OCR failed: {(result.stderr or "").strip()[:400]}')
    out: dict[str, str] = {}
    name: str | None = None
    buf: list[str] = []
    for line in result.stdout.splitlines():
        m = re.match(r'^===== FILE: (.+) =====$', line)
        if m:
            if name is not None:
                out[name] = '\n'.join(buf).strip()
            name, buf = m.group(1), []
        elif name is not None:
            buf.append(line)
    if name is not None:
        out[name] = '\n'.join(buf).strip()
    return out


def batch_dir(tag: str) -> Path:
    """A fresh, empty render directory for one batch, so nothing can be reused.

    The process id is part of the name, and that is not decoration: two runs of
    this tool are expected to be in flight at once (that is how the reference
    books were read while the lecture notes were re-read), and a shared directory
    name means one run's `rmtree` lands in the middle of the other run's writes.
    That is exactly what happened — the orientation probe uses the fixed tag
    'probe', so pages 401-600 of a reference book died with
    `OSError: [Errno 22] Invalid argument ... batch/probe/r270.png` and were
    never written, silently, because the run had already reported its earlier
    chunks.
    """
    d = TMP / BATCH_DIR / f'{slug(tag)}-{os.getpid()}'
    if d.is_dir():
        shutil.rmtree(d, ignore_errors=True)
    d.mkdir(parents=True, exist_ok=True)
    return d


def render_pdf_pages(path: Path, pages: list[int], dpi: int, rotation: int,
                     tag: str) -> dict[int, Path]:
    """Render 1-based pages to PNGs, named so the OCR text maps back to a page."""
    import pypdfium2 as pdfium
    from PIL import Image, ImageOps

    d = batch_dir(tag)
    # Rotation is applied by transpose rather than rotate(): transpose is an exact
    # pixel permutation, while rotate() resamples and softens the very strokes
    # that decide whether a glyph is recognised.
    flip = {0: None, 90: Image.Transpose.ROTATE_90, 180: Image.Transpose.ROTATE_180,
            270: Image.Transpose.ROTATE_270}[rotation % 360]
    doc = pdfium.PdfDocument(str(path))
    out: dict[int, Path] = {}
    for n in pages:
        img = d / f'p{n:04d}.png'
        page = doc[n - 1]
        pil = page.render(scale=dpi / 72).to_pil().convert('L')
        if flip is not None:
            pil = pil.transpose(flip)
        # Blank-page detection before spending an OCR call on it.
        if pil.getextrema()[1] == pil.getextrema()[0]:
            out[n] = img  # do not write; handled as empty by the caller
            continue
        pil = ImageOps.autocontrast(pil)
        pil.save(img, optimize=True)
        out[n] = img
    return out


def probe_rotation(path: Path, page: int = 1, dpi: int = RENDER_DPI) -> int:
    """Which of 0/90/180/270 makes this file's text readable?

    Decided by asking the engine, not by looking at ink geometry: the rotation
    that recognises the most characters is the rotation of the text.
    """
    import pypdfium2 as pdfium
    from PIL import Image, ImageOps

    doc = pdfium.PdfDocument(str(path))
    if len(doc) < page:
        return 0
    base = doc[page - 1].render(scale=dpi / 72).to_pil().convert('L')
    flip = {0: None, 90: Image.Transpose.ROTATE_90, 180: Image.Transpose.ROTATE_180,
            270: Image.Transpose.ROTATE_270}
    d = batch_dir('probe')
    files = []
    for ang in ROTATIONS:
        im = ImageOps.autocontrast(base.transpose(flip[ang]) if flip[ang] else base)
        p = d / f'r{ang:03d}.png'
        im.save(p, optimize=True)
        files.append(p)
    got = run_ocr(files)
    best, best_score = 0, -1
    for ang in ROTATIONS:
        n = score_text(got.get(f'r{ang:03d}.png', ''))
        if n > best_score:
            best, best_score = ang, n
    return best


# --------------------------------------------------------------------------- #
# readers
# --------------------------------------------------------------------------- #
def read_pptx_slides(path: Path) -> list[tuple[int, str]]:
    """(slide number, text) for every slide: title + body + tables + notes."""
    from pptx import Presentation
    from pptx.enum.shapes import MSO_SHAPE_TYPE

    prs = Presentation(str(path))
    slides: list[tuple[int, str]] = []
    for i, slide in enumerate(prs.slides, 1):
        parts: list[str] = []
        for shape in slide.shapes:
            if shape.has_table:
                for row in shape.table.rows:
                    cells = [c.text.strip().replace('\n', ' ') for c in row.cells]
                    if any(cells):
                        parts.append(' | '.join(cells))
                continue
            if shape.shape_type == MSO_SHAPE_TYPE.GROUP:
                for sub in shape.shapes:
                    if sub.has_text_frame and sub.text_frame.text.strip():
                        parts.append(sub.text_frame.text.strip())
                continue
            try:
                if shape.has_text_frame and shape.text_frame.text.strip():
                    parts.append(shape.text_frame.text.strip())
            except Exception:
                continue
        try:
            if slide.has_notes_slide:
                notes = slide.notes_slide.notes_text_frame.text.strip()
                if notes:
                    parts.append(f'[notes] {notes}')
        except Exception:
            pass
        slides.append((i, '\n'.join(parts).strip()))
    return slides


def export_slides(path: Path, expected: int) -> dict[int, Path]:
    """Render every slide to PNG through PowerPoint.

    A cached export is reused only when it is COMPLETE. PowerPoint writes the
    PNGs one at a time, so a run interrupted in the middle leaves a directory
    that looks like a cache and is missing slides — and trusting it would mean
    those slides are never read, on this run or any later one, with nothing on
    screen to show it. `expected` comes from python-pptx's slide count.
    """
    tag = slug(path.stem)
    d = TMP / 'slides' / tag
    cached = _slide_files(d)
    if len(cached) >= expected:
        return cached
    if d.is_dir():
        shutil.rmtree(d, ignore_errors=True)
    d.mkdir(parents=True, exist_ok=True)
    script = f'''
$ErrorActionPreference = "Stop"
$app = New-Object -ComObject PowerPoint.Application
$app.DisplayAlerts = 1
try {{
  $pres = $app.Presentations.Open("{path}", $true, $false, $false)
  $pres.Export("{d}", "PNG", {SLIDE_W}, {SLIDE_H})
  $pres.Close()
}} finally {{
  $app.Quit()
}}
'''
    subprocess.run(['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass',
                    '-Command', script],
                   capture_output=True, text=True, timeout=3600)
    files = _slide_files(d)
    if len(files) < expected:
        print(f'      (PowerPoint exported {len(files)} of {expected} slides)')
    return files


def _slide_files(d: Path) -> dict[int, Path]:
    out: dict[int, Path] = {}
    for p in sorted(d.glob('Slide*.*')):
        m = re.search(r'(\d+)', p.stem)
        if m and p.suffix.lower() in ('.png', '.jpg', '.jpeg'):
            out.setdefault(int(m.group(1)), p)
    return out


def read_pptx(path: Path, ocr_slides: bool = True) -> tuple[str, int, int]:
    """Every slide's own text, plus whatever is written inside its pictures.

    EVERY slide is rendered and read, not only the ones that look empty. The
    first version of this only OCR'd a slide whose text frames held under 90
    characters, which is right for a slide that is one big screenshot and wrong
    for the far more common slide that carries a heading and a paragraph *and* a
    diagram whose labels are pixels. Measured across the nine decks: 394 slides,
    179 pictures, and **50 slides where that rule skipped the OCR entirely** —
    24 of them in Chapter 3 alone. Those are the slides where the exam question
    is answered in the picture.

    The two readings are then merged rather than concatenated, so a slide's text
    is not printed twice; see merge_ocr_text.
    """
    slides = read_pptx_slides(path)
    indexes = {n: t for n, t in slides}
    ocr_count = 0
    image_lines = 0
    if ocr_slides:
        try:
            files = export_slides(path, len(slides))
            picked = [files[n] for n, _ in slides if n in files]
            if picked:
                got = run_ocr(picked)
                for n, own_text in slides:
                    f = files.get(n)
                    if not f:
                        continue
                    read = got.get(f.name, '')
                    if not read:
                        continue
                    extra = merge_ocr_text(own_text, read, '[in the slide picture]')
                    if extra:
                        indexes[n] = f'{own_text}\n{extra}'.strip()
                        image_lines += 1
                ocr_count = len(picked)
        except Exception as exc:
            print(f'      (slide OCR skipped: {type(exc).__name__}: {exc})')
    if image_lines:
        print(f'      {image_lines} slide(s) had text inside their pictures')
    body = '\n\n'.join(f'----- slide {n} -----\n{indexes[n]}' for n, _ in slides)
    return body.strip(), len(slides), ocr_count


def convert_ppt(path: Path) -> Path:
    """Legacy .ppt -> .pptx through PowerPoint COM, cached next to the output."""
    target = TMP / 'pptx' / (slug(path.stem) + '.pptx')
    if target.is_file() and target.stat().st_size > 0:
        return target
    target.parent.mkdir(parents=True, exist_ok=True)
    script = f'''
$ErrorActionPreference = "Stop"
$app = New-Object -ComObject PowerPoint.Application
$app.DisplayAlerts = 1
try {{
  $pres = $app.Presentations.Open("{path}", $true, $false, $false)
  $pres.SaveAs("{target}", 24)
  $pres.Close()
}} finally {{
  $app.Quit()
}}
'''
    result = subprocess.run(['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass',
                             '-Command', script],
                            capture_output=True, text=True, timeout=900)
    if not target.is_file():
        raise RuntimeError(
            f'PowerPoint could not convert {path.name}: '
            f'{(result.stderr or result.stdout).strip()[:300]}')
    return target


def read_pdf(path: Path, pages: list[int] | None = None, allow_ocr: bool = True,
             dpi: int = RENDER_DPI, rotation: int | None = None,
             known: dict | None = None) -> tuple[str, int, int, int]:
    """Text per page where a text layer exists, OCR where it does not.

    Returns (text, page_count, ocr_page_count, rotation_used).
    """
    import pdfplumber
    with pdfplumber.open(str(path)) as pdf:
        total = len(pdf.pages)
        wanted = pages or list(range(1, total + 1))
        texts: dict[int, str] = {}
        need: list[int] = []
        # A page can have a perfectly good text layer AND a picture with text in
        # it — a screenshot of a SOAP envelope, a diagram, a table pasted in as
        # an image. Those pages are read too, and the result merged, rather than
        # being trusted because the text layer came back non-empty.
        augment: list[int] = []
        for n in wanted:
            page = pdf.pages[n - 1]
            text = (page.extract_text() or '').strip()
            if len(text) >= PAGE_TEXT_MIN:
                texts[n] = text
                try:
                    if page.images:
                        augment.append(n)
                except Exception:
                    pass
            else:
                need.append(n)

    ocr_text: dict[int, str] = {}
    image_text: dict[int, str] = {}
    used_rotation = 0
    if augment and allow_ocr:
        imgs = render_pdf_pages(path, augment, dpi, 0, f'{path.stem}_aug')
        got = run_ocr([p for p in imgs.values() if p.is_file()])
        for n, img in imgs.items():
            if img.is_file():
                merged = merge_ocr_text(texts.get(n, ''), got.get(img.name, ''))
                if merged:
                    image_text[n] = merged
    if need and allow_ocr:
        # A rotation recorded from a previous run is reused; otherwise ask.
        if rotation is None:
            rotation = (known or {}).get('rotation')
        if rotation is None:
            rotation = probe_rotation(path)
        used_rotation = rotation
        images = render_pdf_pages(path, need, dpi, rotation, path.stem)
        have = [p for p in images.values() if p.is_file()]
        raw = run_ocr(have)
        for n, img in images.items():
            ocr_text[n] = raw.get(img.name, '') if img.is_file() else ''
        # Any page the engine could not read but that clearly has ink is retried
        # in the other orientations. A deck is not obliged to be consistent.
        retry = [n for n in need
                 if score_text(ocr_text.get(n, '')) < OCR_THIN and images[n].is_file()]
        if retry:
            best = dict(ocr_text)
            for ang in ROTATIONS:
                if ang == rotation:
                    continue
                imgs = render_pdf_pages(path, retry, dpi, ang, f'{path.stem}_r{ang}')
                got = run_ocr([p for p in imgs.values() if p.is_file()])
                for n, img in imgs.items():
                    t = got.get(img.name, '') if img.is_file() else ''
                    if score_text(t) > score_text(best.get(n, '')):
                        best[n] = t
            ocr_text = best

    chunks: list[str] = []
    for n in wanted:
        if n in texts:
            body = texts[n]
            if n in image_text:
                body += '\n' + image_text[n]
            chunks.append(f'\n\n===== page {n} =====\n{body}')
        elif n in ocr_text:
            body = ocr_text[n] or '(no text recognised)'
            chunks.append(f'\n\n===== page {n} =====  [ocr]\n{body}')
    return ('\n'.join(chunks).strip(), total, len(need) + len(augment),
            used_rotation)


# --------------------------------------------------------------------------- #
# the run
# --------------------------------------------------------------------------- #
def classify(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == '.pptx':
        return 'pptx'
    if suffix == '.ppt':
        return 'pptx-via-powerpoint'
    if suffix == '.pdf':
        return 'pdf'
    return 'skip'


HEADER_SEP = '-' * 70
RANGE_SUFFIX = re.compile(r'_p(\d{4})-(\d{4})$')


def load_manifest(path: Path) -> dict:
    if path.is_file():
        try:
            return json.loads(path.read_text(encoding='utf-8'))
        except Exception:
            return {}
    return {}


def save_manifest(path: Path, updates: dict) -> dict:
    """Merge this run's entries into the manifest and swap the file in at once.

    Two extractor runs can be in flight together — that is how the four reference
    books were read while the lecture notes were being re-read — and each used to
    write out its whole in-memory copy at the end. Whichever finished last won,
    so the other's entries disappeared from a file that `check_dcc_extract.py`
    and `dcc_scaffold.py` both read; it showed up as 31 keys for 33 files on
    disk. Re-reading immediately before writing, and replacing the file in one
    atomic step, means a concurrent run adds to the manifest instead of
    overwriting it. The read-then-replace is still not a file lock, so the
    window is narrow rather than gone — which is the other half of why
    rebuild_manifest() exists.
    """
    current = load_manifest(path)
    current.update(updates)
    tmp = path.with_name(path.name + '.tmp')
    tmp.write_text(json.dumps(current, indent=2, sort_keys=True), encoding='utf-8')
    os.replace(tmp, path)
    return current


def rebuild_manifest() -> dict:
    """Reconstruct the manifest from the extracted files' own headers.

    Every output records the source it came from, the method, the input's
    SHA-256 and the settings used, so the manifest is recoverable from the
    outputs alone. That is the point of keeping the header: the manifest is a
    cache, not a source of truth, and a cache that can be rebuilt from what it
    indexes is one that can safely be thrown away.
    """
    out: dict[str, dict] = {}
    for path in sorted(OUT.glob('*.txt')):
        head, sep, body = path.read_text(encoding='utf-8').partition(HEADER_SEP)
        if not sep:
            continue
        info = {}
        for line in head.splitlines():
            key, _, value = line.partition(':')
            if key.strip():
                info[key.strip()] = value.strip()
        rel = info.get('source')
        if not rel:
            continue
        m = RANGE_SUFFIX.search(path.stem)
        key = f'{rel}#{int(m.group(1))}-{int(m.group(2))}' if m else rel
        def as_int(name: str, default: int = 0) -> int:
            first = (info.get(name, '') or '').split()[:1]
            return int(first[0]) if first and first[0].isdigit() else default
        out[key] = {
            'method': info.get('method', ''),
            'sha256': info.get('sha256', ''),
            'pages': as_int('pages'),
            'ocr_pages': as_int('ocr'),
            'rotation': as_int('rotation'),
            'dpi': as_int('dpi'),
            'chars': len(body.strip()),
            'out': path.name,
        }
    return out


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description='read the DCC sources into text')
    p.add_argument('--only', help='substring of the source path to restrict to')
    p.add_argument('--pages', help='page range, e.g. 1-20 (PDFs only)')
    p.add_argument('--dpi', type=int, default=RENDER_DPI)
    p.add_argument('--force', action='store_true', help='re-read what is already done')
    p.add_argument('--no-ocr', action='store_true',
                   help='skip scanning: text layers only (fast, incomplete)')
    p.add_argument('--no-slide-ocr', action='store_true',
                   help='do not render pptx slides that look like pictures')
    p.add_argument('--list', action='store_true', help='show the plan, read nothing')
    p.add_argument('--rebuild-manifest', action='store_true',
                   help='reconstruct MANIFEST.json from the extracted files and exit')
    return p


def main() -> int:
    args = build_parser().parse_args()
    if not SRC.is_dir():
        sys.exit(f'dcc_extract: {SRC} not found')

    if args.rebuild_manifest:
        OUT.mkdir(parents=True, exist_ok=True)
        rebuilt = rebuild_manifest()
        path = OUT / 'MANIFEST.json'
        path.write_text(json.dumps(rebuilt, indent=2, sort_keys=True), encoding='utf-8')
        print(f'  rebuilt {len(rebuilt)} entry/entries from the extracted files')
        print(f'  {sum(v["chars"] for v in rebuilt.values()):,} chars total')
        return 0

    sources = sorted(p for p in SRC.rglob('*') if p.is_file() and classify(p) != 'skip')
    if args.only:
        needle = args.only.lower()
        sources = [p for p in sources if needle in str(p.relative_to(SRC)).lower()]
    if not sources:
        sys.exit('dcc_extract: nothing matched')

    page_range: list[int] | None = None
    if args.pages:
        m = re.fullmatch(r'(\d+)\s*-\s*(\d+)', args.pages.strip())
        if not m:
            sys.exit('dcc_extract: --pages wants a range like 10-24')
        page_range = list(range(int(m.group(1)), int(m.group(2)) + 1))

    if args.list:
        for path in sources:
            print(f'  {classify(path):<22} {path.relative_to(SRC)}')
        print(f'  ({len(sources)} source(s))')
        return 0

    OUT.mkdir(parents=True, exist_ok=True)
    man_path = OUT / 'MANIFEST.json'
    manifest = load_manifest(man_path)
    # Only this run's own results are written back, merged into whatever is in
    # the file by the time we get there. See save_manifest.
    results: dict[str, dict] = {}

    for path in sources:
        rel = str(path.relative_to(SRC))
        base = out_name(path)
        # A 1000-page book is one very long job. Naming each chunk after the page
        # range it holds means the reading can be done in pieces, a finished
        # range is never re-OCR'd when the next starts, and an interrupted run
        # costs one chunk rather than the whole book.
        if page_range:
            dest = OUT / f'{base}_p{page_range[0]:04d}-{page_range[-1]:04d}.txt'
            man_key = f'{rel}#{page_range[0]}-{page_range[-1]}'
        else:
            dest = OUT / (base + '.txt')
            man_key = rel
        method = classify(path)
        digest = sha256(path)
        known = manifest.get(rel, {})
        # An unchanged source with an unchanged output is already read: re-OCRing
        # a 1000-page book to get the same bytes is the one thing this must not do.
        if (not args.force and not args.pages and dest.is_file()
                and known.get('sha256') == digest and known.get('chars')):
            print(f'  {rel}\n      unchanged, kept ({known["chars"]:,} chars)')
            results[man_key] = manifest.get(man_key) or {**known, 'out': dest.name}
            continue

        print(f'  {rel}')
        started = time.time()
        try:
            ocr_pages = 0
            rotation = 0
            if method == 'pptx':
                body, count, ocr_pages = read_pptx(path, not args.no_slide_ocr)
            elif method == 'pptx-via-powerpoint':
                body, count, ocr_pages = read_pptx(convert_ppt(path),
                                                   not args.no_slide_ocr)
            else:
                body, count, ocr_pages, rotation = read_pdf(
                    path, page_range, allow_ocr=not args.no_ocr,
                    dpi=args.dpi, known=known)
        except Exception as exc:
            print(f'      FAILED: {type(exc).__name__}: {exc}')
            results[man_key] = {**known, 'method': method, 'sha256': digest,
                                'error': str(exc)}
            continue

        header = (f'source: {rel}\n'
                  f'method: {method}\n'
                  f'sha256: {digest}\n'
                  f'pages:  {count}\n'
                  f'ocr:    {ocr_pages} page(s)\n'
                  f'rotation: {rotation}\n'
                  f'dpi:    {args.dpi if ocr_pages else "-"}\n'
                  f'{"-" * 70}\n')
        dest.write_text(header + body + '\n', encoding='utf-8')
        results[man_key] = {'method': method, 'sha256': digest, 'pages': count,
                            'ocr_pages': ocr_pages, 'rotation': rotation,
                            'dpi': args.dpi, 'chars': len(body), 'out': dest.name}
        note = f', {ocr_pages} OCR page(s)' if ocr_pages else ''
        rot = f', rot {rotation}' if rotation else ''
        print(f'      {len(body):>7,} chars, {count} page(s){note}{rot}'
              f'  [{time.time() - started:.0f}s] -> {dest.name}')

    final = save_manifest(man_path, results)
    ok = [v for v in final.values() if not v.get('error')]
    failed = [k for k, v in results.items() if v.get('error')]
    print(f'\n  this run wrote {len(results)} entry/entries; manifest now holds '
          f'{len(final)}')
    print(f'  {len(ok)} source(s) extracted, '
          f'{sum(v.get("chars", 0) for v in ok):,} chars total')
    print(f'  manifest: {man_path.relative_to(ROOT)}')
    if failed:
        # Non-zero so a shell loop over page ranges stops instead of walking on
        # past a chunk that produced nothing. Before this, a failed chunk looked
        # exactly like a successful one from the outside.
        print(f'\n  FAILED: {len(failed)} source(s) produced nothing:')
        for k in failed:
            print(f'    {k}')
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
