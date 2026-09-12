# freebuff_simulation — Simulation & Modeling Study Portal (BCE7026)

Working copy of the **Simulation & Modeling** study portal, created so the
original folder stays frozen while it is improved.

| | |
| :--- | :--- |
| **Course** | BCE7026 — Simulation and Modeling, Semester VII, B.E. Computer Engineering |
| **University** | Purbanchal University |
| **Marks** | Full 60 / Pass 24, 3:00 hrs (chapter weights 8+6+6+6+6+12+6+10) |
| **Stack** | Static HTML + vanilla JS. No build step, no dependencies, no server. |
| **Design** | Linear-style dark theme. Inter + JetBrains Mono, bundled locally. |
| **Tracker** | **`plan.md`** — the living build plan, sources, data model and changelog. |

**Contents:** 8 chapters · 129 KB of notes · 89 quiz questions with explanations ·
**92 past-question cards** carrying **86 model answers** (71 on the card, 15 kept
as another paper's own answer behind the card's expander), 107 paper occurrences
and 21 practice questions · a 12-step flowchart · global search · mock exam ·
printable PDF.

---

## The frozen original

`../simulation-website` is the untouched original. Its SHA-256 hashes were
recorded **before** anything was copied:

```
_audit/original.sha256     # every file hash, taken from ../simulation-website
```

Verify the original is still intact at any time (run from the parent folder):

```bash
sha256sum -c freebuff_simulation/_audit/original.sha256
```

**Do not edit `../simulation-website`.** All changes belong in this folder.

---

## How to open it

Double-click `index.html`, or:

```bash
python -m http.server 8099        # then http://127.0.0.1:8099/
```

Opening `index.html` directly from the filesystem (`file://`) works too — the
chapters, and the analysis data, are loaded as plain `<script>` tags rather than
`fetch()` calls, so nothing is blocked by the browser's file:// rules.

---

## What the site does

### Tabs

| Tab | What it gives you |
| :--- | :--- |
| 📖 **Learn** | Chapter notes, syllabus sub-topic by sub-topic, with worked numericals, formula boxes and comparison tables. "Mark complete" awards XP. |
| 🧠 **Quiz** | 10–15 MCQs per chapter with instant explanations, a progress bar and a scored result. Per-chapter scores are stored and drive the mastery bars. |
| 📝 **Past Questions** | **One card per question.** Filter by *All / Model answers / Practice / 🔥 Repeated*, and use *Open every answer* / *Close every answer* / *Show every wording*. A card shows the question, its model answer, and — behind one click, *"📄 Same question in N papers — show each wording"* — the exact wording used in every paper it appeared in. Where one of those wordings had a model answer of its own, that answer opens inside the same card. |
| 📊 **Analysis** | Per-chapter mastery, quiz accuracy, question-bank coverage, the top 15 most repeated topics, year-wise distribution, syllabus weights and the exam-strategy notes. Also hosts progress export/import/reset. |
| 🕐 **Mock Exam** | Builds a fresh full **60-mark, 3-hour** paper weighted like the syllabus, with a countdown timer, reveal-model-answer and self-marking; ends with a score and a per-chapter breakdown. |

### Layout and controls

The window is the layout: the notes column grows with the screen (up to 1180 px)
and the quiz / past-question / analysis / exam panels use up to 1400 px, so a
laptop does not read like an oversized phone.

| Control | Where | What it does |
| :--- | :--- | :--- |
| ☰ | topbar | Compresses the sidebar to a 72 px rail of chapter numbers, and remembers the choice; below 1025 px the same button opens the sidebar as a drawer. |
| ▾ on a section heading | Learn | Folds that section away. *Expand all* / *Collapse all sections* at the top of the chapter; which sections you folded is remembered per chapter. |
| *Open every answer* / *Show every wording* | Past Questions | Expand or collapse the whole list in one click. |
| ▴ ▾ | bottom right | Jump to the top, or into the next chapter. |
| Ctrl+P | anywhere | Print stylesheet: chrome hidden, folded sections and answers expanded, black on white. |

### Global search

Search box in the top bar (or press `/`) searches the notes, the quiz questions
and all 146 past questions at once. Clicking a result jumps to the chapter, opens
the right tab, scrolls to the match and flashes it.

### Progress

Stored in `localStorage` under `sm-progress` (XP, completed chapters, per-chapter
quiz scores, streak, exam best). Theme is under `sm-theme`. Use **Analysis → Export
progress** to save it as JSON and import it back on another browser or device.

---

## Data shapes

Each `ch*.js` defines one chapter:

```js
window.CHAPTERS[1] = {
  learn: `<h2>1.1 Introduction to Simulation</h2>…`,   // notes HTML
  quiz:  [ { q:"…", options:["…"], answer:1, explanation:"…" } ],
  past:  [ { year:"2019 F", marks:"5", repeats:4, q:"…",
             occ:[ { year:"2015 F", marks:"3+7", q:"…" } ],       // other wordings
             variants:[ { year:"2011 F", marks:"5", q:"…",
                          answer:`<h4>Answer</h4>…` } ],           // + their answers
             answer:`<h4>Answer</h4>…` } ]
};
```

* `answer` in a quiz item is the **index** of the correct option.
* `answer` in a past item is the model answer HTML. When it is `null` the entry
  must also carry `status:"pending"` and renders as a flagged practice question.
* `variants[]` holds questions that were folded into this card during the
  one-question-one-card pass, each **with the model answer written for that
  paper**. Without it, folding a repeated question would throw away the other
  papers' answers — it is why the 54 folded cards cost none of the 86 answers.
* `repeats` is how many times the question has appeared across past papers. It
  is never lowered: the merge takes the largest of the site's own count, the
  question bank's count and the number of papers that could actually be traced.
* `occ` is the evidence behind that count — one entry per paper the question was
  really found in, with that paper's exact wording:

```js
occ:[ { year:"2019 F", marks:"5",   q:"Explain the phases and steps in simulation study" },
      { year:"2015 F", marks:"3+7", q:"What do you mean by simulation and modeling? …" } ]
```

When the bank's count is higher than the number of traced papers, the card says
so out loud rather than implying the missing papers were found.

---

## Layout

```
freebuff_simulation/
├── index.html                    # the app shell: markup + the list of scripts
├── app.js                        # the app: tabs, quiz, past questions, search, exam, progress
├── engine.js                     # pure logic, no DOM: paper allocator + marking, quiz scoring, search
├── ch1.js … ch8.js               # one file per chapter: notes + quiz + past questions
├── plan.md                       # living build plan / tracker (read this first)
├── assets/
│   ├── css/tokens.css            # colour, type and rhythm tokens (dark + light)
│   ├── css/foundation.css        # reading column, pills, tables, callouts, worked
│   └── fonts/                    # Inter + JetBrains Mono woff2 (offline, no CDN)
├── build_pdf.py                  # printable PDF of all 8 chapters
├── Simulation_Notes.pdf          # generated: 159 pages, notes + question bank
├── temp_pdf.html                 # generated intermediate for the PDF
├── COVERAGE.md                   # syllabus sub-topic matrix + question-bank stats
├── README.md                     # this file
├── data/                         # generated datasets
│   ├── question_bank.json        # 148 parsed bank questions + topics + strategy
│   ├── analysis.js               # the same analysis as window.ANALYSIS for the UI
│   ├── qa_coverage.json          # dedupe/match report per chapter
│   ├── same_question_merges.json # 34 curated "these are one question" groups (+12 refusals)
│   └── tier_a_answers.json       # the 26 hand-written model answers
├── tools/
│   ├── sitelib.py               # shared owner: chapter loading, normalisation, similarity, Reporter
│   ├── dump_chapters.js          # loads the chapter files, prints their data as JSON
│   ├── test_engine.js            # headless contract test for engine.js (node tools/test_engine.js)
│   ├── validate_site.py          # structure, quiz/past data, HTML balance, coverage
│   ├── import_question_bank.py   # bank HTML -> data/question_bank.json + analysis.js
│   ├── merge_past.py             # dedupe + import the bank into ch*.js
│   ├── extract_occurrences.py    # old papers -> which papers asked each question
│   ├── find_duplicates.py        # paraphrase + same-question clusters (report only)
│   ├── gen_same_question_merges.js  # rebuild the curated same-question groups
│   ├── render_notes.py           # handwritten notes -> readable page images
│   └── fetch_fonts.py            # re-download the bundled webfonts (rarely needed)
├── _audit/
│   ├── original.sha256           # hashes of the frozen original
│   └── pre_merge/                # chapter files as they were before merge_past.py
├── _source/                     # extracted working copies of the user's material
│   ├── note1.ocr.txt             # committed · noisy OCR index of notes 1
│   ├── note2.ocr.txt             # committed · noisy OCR index of notes 2
│   ├── past_questions.ocr.txt    # committed · OCR of the old papers (exact wording)
│   └── notes/                    # ignored · rendered note pages (render_notes.py)
└── _reference/                   # read-only merge source, not part of the site
    └── Simulation_Modeling_Question_Bank.html
```

---

## The design layer

The shell markup and the eight chapter files use plain class names
(`.concept-box`, `.formula-box`, `.comparison-table`, …). All styling now lives
in two sheets:

* **`assets/css/tokens.css`** — the single source of truth for colour, type and
  rhythm. It defines the same variable names the site always used (`--pri`,
  `--t2`, `--brd`, …), so every chapter, quiz, past question, analysis card and
  exam row inherits the theme with no content edits. Dark is the default; a
  matching light theme is kept for the toggle.
* **`assets/css/foundation.css`** — the component layer: the 760 px reading
  column, prose rhythm, pill treatments, table striping and numeric columns, the
  callout pattern (definition / formula / exam tip / talked-about / caution /
  mistake / worked example), sidebar chapter states, tab badges and the floating
  jump-to-top and next-chapter buttons.

Two things worth knowing before editing them:

1. The `<link>` tags sit **after** `</style>` in `index.html`. The foundation
   sheet overrides the shell at equal specificity, so loading it earlier makes
   it silently do nothing.
2. Cell alignment is automatic. `enhanceContent()` wraps every table in
   `.table-scroll` (so wide comparison tables scroll instead of breaking the
   reading column) and marks cells that contain nothing but a number with
   `td.num` — right aligned, tabular monospace. Content files need no changes.

Colour roles used by the callouts:

| Class | Kind |
| :--- | :--- |
| `.concept-box` | definition / key concept |
| `.formula-box` (`.lines` for multi-line derivations) | key formula |
| `.concept-box.tip` | exam tip |
| `.concept-box.asked` | talked about / commonly asked |
| `.concept-box.warn` | caution |
| `.concept-box.important` | common mistake |
| `.example-box` | worked example |
| `.worked` | worked numerical: givens → numbered steps → boxed result. Markup: `.worked-head` (title + `.meta`), `.worked-givens` (`<div><span>LABEL</span><b>VALUE</b></div>`), `.worked-steps` (`<ol>` / `<li>` with `.worked-calc` + `.worked-note`), `.worked-result` (`<span>` + `<b>`). Chapter 6 is converted; the rest is P3 in `plan.md`. |

### Reading the handwritten notes

The notes are scans with no usable text layer. `_source/*.ocr.txt` is a noisy
index ("grep for the topic, learn the page number"); the page image is the
source of truth:

```bash
python tools/render_notes.py --list                  # 53 + 58 = 111 pages
python tools/render_notes.py --note 1 --pages 18-24  # pure pursuit, etc.
```

The page-to-chapter map is in `plan.md` §2.3 (note 1 = Ch1/3/4/5, note 2 =
Ch6/7/2/8).

---

## Sources and the tools that read them

Three inputs are committed so the whole pipeline is reproducible from a fresh
clone; two are machine-local because they are large, are rendered from files
outside the repo, or both.

| Source | In the repo? | Read by |
| :--- | :--- | :--- |
| `_source/past_questions.ocr.txt` | **yes** (255 KB total, all three) | `tools/extract_occurrences.py` — the only evidence behind every `occ[]` and `repeats` value |
| `_source/note1.ocr.txt`, `note2.ocr.txt` | **yes** | the notes cross-check (grep the topic, learn the page); `tools/render_notes.py` renders from the source PDFs, not the OCR |
| `_reference/Simulation_Modeling_Question_Bank.html` | **yes** | `tools/import_question_bank.py`, `tools/merge_past.py` |
| `_source/notes/*.jpg` | no — ignored | human page reading only (`tools/render_notes.py` writes them) |
| the source note/work PDFs | no — outside the repo | `tools/render_notes.py` |

The three `*.ocr.txt` files are committed because the occurrence trail is
rebuilt from them — without `past_questions.ocr.txt` a fresh clone cannot
re-derive which papers asked each question. The ~12 MB of rendered pages and
the PDFs behind them are inputs only and stay untracked. `.freebuff/run.md` has
the full rebuild matrix and how to serve the site on a free port.

---

## Working with the question bank

```bash
python tools/validate_site.py             # must pass before and after any edit
python tools/import_question_bank.py      # re-parse the bank (writes data/*.json + analysis.js)
python tools/extract_occurrences.py       # find which papers asked each question
node   tools/gen_same_question_merges.js  # rebuild data/same_question_merges.json
python tools/find_duplicates.py --json    # write data/duplicate_clusters.json
python tools/merge_past.py                # dry run: match report, no files written
python tools/merge_past.py --apply        # rewrite the past arrays (backs up _audit/)
python build_pdf.py --out Simulation_Notes.pdf
```

`tools/merge_past.py --apply` must be a no-op when nothing changed: `sha256sum
ch*.js` before and after has to be identical. That check is what caught a run
that folded 17 wrong cards; see the changelog in `plan.md`.

### Occurrences ("which papers asked this?")

`tools/extract_occurrences.py` reads `_source/past_questions.ocr.txt`, splits it
into papers (collapsing duplicate scans, so a rescan can never inflate a repeat
count), splits each paper into atomic question units, and matches every site
question against every unit. It writes `data/occurrences.json` and a
human-reviewable `data/occurrence_report.txt`:

```bash
python tools/extract_occurrences.py                # report + JSON
python tools/extract_occurrences.py --papers       # just list the parsed papers
python tools/extract_occurrences.py --only 6       # one chapter
python tools/extract_occurrences.py --threshold 0.8
```

The report flags every question whose found occurrences disagree with its
recorded `repeats`, so gaps stay visible instead of being papered over.

`merge_past.py --apply` writes `occ` into `ch*.js`. It backs up to
`_audit/pre_merge/` **only if that backup does not already exist** — that folder
holds the only copy of the original wording — and otherwise to a dated folder
such as `_audit/pre_merge_2026-09-12/`.

`merge_past.py` is idempotent: questions already on the site are matched (so their
existing model answers are kept) and only genuinely new ones are imported. Bank
repeats are authoritative, so a matched question's `repeats` count is raised to the
bank's value.

### One question, one card

Two kinds of duplicate are folded into one card:

* **Automatic fragments** — one text is contained in the other, or the two are
  near identical. `tools/find_duplicates.py` finds these by similarity.
* **Same-question groups** — the same question asked again with different wording
  ("Short Note: GPSS" / "Explain GPSS in brief with suitable example" / "What is
  GPSS language & its application?"). Similarity cannot separate these from the
  three LCM questions with different parameters that must *not* fold, so the
  judgement is written down in `data/same_question_merges.json` (34 groups, plus 12
  recorded refusals with reasons) and regenerated from positions by
  `tools/gen_same_question_merges.js`.

The fold keeps everything: the duplicate's wording and marks go to the survivor's
`occ[]`, and if it had a model answer, that answer becomes a `variants[]` entry the
page can show inside the surviving card. Result: **146 → 92 cards, 86 → 86 model
answers, 0 questions lost.**

Re-running `merge_past.py --apply` is a no-op: `ch*.js` comes out byte-identical.
If a fold would ever remove more cards than it folded, the tool refuses to write,
and a folded question's bank twin can never be re-imported as a new card
(`already_present()` checks the new question against every wording recorded on the
chapter).

After the fold, the positions in the generator's spec no longer line up with the
chapter arrays. The generator therefore keeps the wording already in
`data/same_question_merges.json` and only refreshes notes/refusals; positions are
used on first generation, or deliberately with `--from-dump=<pre-fold dump>`.

### Writing missing model answers

`tools/merge_past.py` reports which questions are still Tier A (repeated twice or
more, or any Ch5 / Ch6 question) without an answer:

```bash
python tools/merge_past.py | grep "Tier-A"
```

Add each answer to `data/tier_a_answers.json` keyed by the question's bank id
(`"6-33"`, `"3-07"`, …) and re-run `merge_past.py --apply`. The remaining practice
questions stay visible on the site with an explicit "model answer pending" badge —
they are never silently dropped.

---

## PDF

```bash
python build_pdf.py                            # all 8 chapters
python build_pdf.py --chapters 5,6,7           # a subset
python build_pdf.py --no-practice              # omit the practice-only questions
python build_pdf.py --answers-only --out bank.pdf
```

Requires `xhtml2pdf` (`pip install xhtml2pdf`) and `node` on `PATH`. The current
`Simulation_Notes.pdf` is **148 pages** and covers the full notes (including the
worked numericals) plus the 92 question cards — 71 with a model answer, 21 as
practice. One caveat: `xhtml2pdf` does not draw inline SVG, so the Ch1 flowchart
appears on screen but not in the PDF; it needs a raster fallback for print.
