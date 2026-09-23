# freebuff_simulation — Simulation & Modeling Study Portal (BCE7026)

Working copy of the **Simulation & Modeling** study portal, created so the
original folder stays frozen while it is improved.

| | |
| :--- | :--- |
| **Course** | BCE7026 — Simulation and Modeling, Semester VII, B.E. Computer Engineering |
| **University** | Purbanchal University |
| **Marks** | Full 60 / Pass 24, 3:00 hrs (chapter weights 8+6+6+6+6+12+6+10) |
| **Stack** | Static HTML + vanilla JS. No build step, no dependencies, no server. |
| **Design** | Nine reading modes (2 original + 6 palettes + one the reader tints) and a comfort/full width toggle. Inter for headings, body and UI (`--font-head` when a heading face of its own is wanted) + JetBrains Mono for figures, bundled locally. |
| **Tracker** | **`plan.md`** — the living build plan, sources, data model and changelog. |

**Contents:** 8 chapters · 148 KB of notes · 89 quiz questions with explanations ·
**92 past-question cards, every one carrying a model answer**, plus **15 further
answers kept behind 13 cards** for the other papers' wordings — **107 answers in
all** · **108 paper occurrences** · a 12-step flowchart · global search · mock exam ·
printable PDF.

---

## A second course: Distributed & Cloud Computing (BCE7024)

`dcc-site/` is a second study portal for a second subject, built on the **same
shell**. Engine, modules, stylesheets and fonts live once, at the project root;
the two courses differ only in a config file and their own chapter data.

| | Simulation | DCC |
| :--- | :--- | :--- |
| Entry page | `index.html` | `dcc-site/index.html` |
| Course config | *(none — the built-in defaults)* | `dcc-site/course.js` |
| Chapters | 8 | 9 |
| Tabs | Learn, Quiz, Past, Analysis, Mock Exam | Learn, Quiz, Past, Reference, Analysis |
| `localStorage` | `sm-progress`, `sm-theme`, … | `dcc-progress`, `dcc-theme`, … |
| Marks | 60 (8+6+6+6+6+12+6+10) | 60 (6+10+6+6+6+8+6+8+4) |

**Open it** from the project root, not from `dcc-site/` — the page loads the
shared design layer as `../assets/…`, so a server has to be above both:

```bash
python -m http.server 8341 --directory .     # http://127.0.0.1:8341/dcc-site/
```

### Learn teaches, Past Questions examines

A chapter's Learn text used to end with an `Exam-facing summary` block — the "if
the question says X, give Y" table, or a run of `Model answer — N marks` headings.
That is paper-facing material inside the teaching text, so it moved: each chapter
now carries it as `pastSummary`, the **Past Questions** tab renders it below the
chapter's cards, search indexes it (and routes a hit there, not to Learn), and Learn
keeps a short pointer to where it went. Eight chapters had a block; Chapter 1 does
not, and is untouched.

The move is done by `tools/move_exam_summary.py`, which neither rewrites nor trims:
the block is the same characters it always was, `--restore` returns the file byte
for byte, and `--check` (gate step 7) runs a synthetic move-then-restore plus the
real check that no `Exam-facing summary` heading is left in a `learn` string. Its
first version was **not** exactly invertible and its restore deleted the block in
eight files; `dist-dcc/site.js` — the built bundle, a verbatim copy of every source
written before the move — is what it was recovered from. Both the guard and the
self-test exist because of that.

The **exam pitch** that used to open every unit went the same way. Each chapter
began with a box headed *What this unit is worth in the exam* — a list of the paper's
questions with their marks — followed by a paragraph telling the reader which order
to read the deck in. That is a comment about the paper, not about the subject, and
every question it named was already a card on the Past Questions tab, so
`tools/strip_exam_preamble.py` removes it (14 blocks across all 9 chapters) and
`--check` keeps it out. What the box quantified — the unit's weight — is already on
the page above, in the unit-meta line the syllabus itself provides.

### Revising a section instead of reading it

The two portals answer a heading at very different lengths, and the Simulation one
is the easier of the two to revise from for a reason that has nothing to do with
the design: its sections are **about 57 words** — a definition, a key formula, then
the bullets — so the answer is the first thing met. A DCC section is **about 252
words of continuous prose**, so the answer has to be found in it. Measured with
`tools/revise_blocks.py`'s own section splitter, unit titles excluded:

| | Simulation | DCC |
| :--- | ---: | ---: |
| Sections | 125 | 194 |
| Median words per section | **57** | **252** |
| Sections over 200 words | 23 | **128** |
| Longest single paragraph | 90 words | **216 words** |
| Words of notes in total | 16,388 | 53,434 |

So each DCC section now opens with a **revise block**: what the section says, in a
sentence and a few bullets, capped at 90 words. The prose stays exactly as it was —
the depth is what the long descriptive questions are answered from — and the block
sits above it, which is why the pass cannot lose a fact: nothing is removed. It is
written by hand in `data/dcc_revise.json` and written into the chapter by
`tools/revise_blocks.py`; **Unit 2 is done** (30 blocks, mean 70 words) and the
other 141 sections are the work still to do, counted as a known gap rather than
hidden. (194 headings minus 23 that are containers — a heading whose own text is
under 25 words, whose sub-headings hold the material — is the 171 a block is written
for.)

The guard is the interesting part. A block may compress its section; it may not add
to it, so `--check` fails if a term the block marks **bold** is not a term that
section uses, or if a number it quotes is not in the section. It also fails on a
section with no block, a block over the cap, an unbalanced tag, or a block that
talks about the deck, the notes, the source or the exam. Written from the notes by
machine was measured and rejected once already, for the Reference tab's pictures:
scoring the notes' sentences against the pictures produced a line for 36 of 217,
most of them the section heading glued to its opening sentence.

**Revise mode** is the switch in the notes bar. It hides each section's explanatory
paragraphs and leaves the blocks, the bullet lists, the tables and the callouts —
the same notes with the reading cut out — and it is one class on `<body>`, so a
print or a copy still carries every line. On Unit 2 it takes the visible prose from
58 paragraphs to none while all 30 blocks stay. The switch appears only where a
chapter has blocks, so it is never a control that does nothing.

### Reading comfort, measured rather than guessed

Two things that made a figure-heavy unit hard to read, both fixed by measuring the
page instead of by adding options.

**Dark modes no longer shine a lamp at you.** A slide screenshot is white paper, and
Chapter 2 shows 56 of them; at full brightness a dark theme was worse than the light
one on exactly the units with the most pictures. Slide bitmaps are now dimmed to
86 % in dark modes and left alone in light ones. The amount comes from the mode's
own `--bg` luminance (`syncFigureDim`), **not from a hand-kept list of the dark
modes** — so the ninth mode, the one the reader tints, is answered by the colour
they actually picked. Redrawn SVG figures are untouched: they are built from the
theme's own tokens and already match the page.

**The site says how far through a unit you are.** A unit is 4 600–8 600 words and
10–25 topics, which is 30–60 screens with nothing but a scrollbar to say how much is
left. A hairline on the header's bottom edge fills as you scroll (so it costs no
reading area), and a counter beside the floating buttons answers the other question
— *which topic of how many* — e.g. `16/25`, checked against the heading actually on
screen. The unit's meta line now opens with the topic count, because that is the
number a reader decides "can I finish this tonight?" with.

### The teacher's circled-i material, on its own tab

The lecturer's own decks mark some slides with PowerPoint's **Information icon** —
a circled lowercase i — and he uses that sign for material that is there for
reference rather than for the paper. It is answerable by machine: the icon carries
its own id inside the `.pptx`, `Icons_Information`, so `tools/dcc_marks.py` finds it
by searching the deck's XML rather than by guessing at pictures. **28 slides carry
it**, 10 of which are figures this site displays.

Those 10 figures now live on the **Reference** tab instead of inside the notes, so
Learn reads as the subject and nothing else. They are collected under the heading of
the section they came out of, each with a line naming the deck and the slides, and
`tools/make_reference.py` does the moving without rewriting anything: the figure's
markup is the same characters it always was, `--restore` returns the file byte for
byte (proved by a cut/put-back self-test that runs in the gate), and `--check` fails
if a marked figure is still in the notes or if the tab stops matching
`data/off_syllabus_slides.json` after a deck is re-extracted.

What stays in the notes is the **section**, not the picture. Four of the marked
slides are the Bully algorithm, and the teacher's own Model Question 2025 asks
*"Describe in detail the working and applications of the Bully election algorithm"*
for **8 marks** — so the mark decides where a figure lives, never whether a topic is
taught. Vector clocks and the drift-rate slide are marked too. Ch5's deck is a
legacy `.ppt`, which needs LibreOffice to read, and a figure taken from a PDF cannot
be scanned for an icon at all — both limits are stated in the tool instead of being
quietly absent.

### How one shell serves two courses

`window.COURSE` is declared by the entry page before `engine.js` loads. Every
number that is really a fact about the syllabus comes from it: the chapter table
(`meta`), the paper weights (`examWeights`, which `engine.js` sums rather than
taking a separate total), the chapter count, and the list of tabs. With no
`window.COURSE` — the Simulation page — the built-in defaults apply and nothing
about that site changes. The `sm-` prefixes in `app.js`, `modules/progress.js`
and `index.html`'s pre-paint theme script became `NS`-prefixed the same way, so
two courses on one origin keep two independent progress records.

A tab a course does not have is a tab it cannot reach: `engine.js` returns `null`
for `#/exam` when `'exam'` is not in `COURSE.tabs`, `app.js` feature-detects
`Exam` before calling into it, and `dcc-site/index.html` does not load
`modules/exam.js` at all. That is why the DCC portal has no mock exam — the
course is one paper old, so there is no bank to build a weighted 60-mark paper
from yet — and why the route refuses rather than opening an empty panel.

### Where the DCC notes come from

`dcc/` holds the material that was uploaded (101 MB, untracked): nine lecture
decks, the reference books, the lab manuals and the syllabus. **None of it is
readable as the site needs it** — the syllabus itself has no text layer, and
neither do several of the decks. (The lab manuals are **extras** and are not used
as notes anywhere on the site; they are read only so the extraction stays
complete.)

```bash
python tools/dcc_extract.py --list                 # what would be read, and how
python tools/dcc_extract.py                        # read everything
python tools/dcc_extract.py --only "Chapter 3"     # one unit
python tools/dcc_extract.py --only Kindberg --pages 1-24   # a page range
```

It writes one text file per source into `_source/dcc/` plus a `MANIFEST.json`.
**37 files, 7.7 M characters**: 378 KB from the decks, the labs and the syllabus,
and 7.3 M from the four reference books (2,765 pages).

A long source is written in page-range chunks (`_p0401-0600.txt`), so a book can
be read in pieces and an interrupted run costs one chunk rather than the whole
thing. Five things about the tool are worth knowing, because each cost a
debugging round:

* **There is no Tesseract.** `tools/win_ocr.ps1` drives the OCR engine that
  ships with Windows (`Windows.Media.Ocr`), so the pipeline needs no install and
  no network. It is invoked with `-ExecutionPolicy Bypass` for the one process,
  since script execution is disabled on this machine.
* **Scans are read at 600 DPI, and some decks are sideways.** Half the decks are
  landscape slides laid out on portrait pages, so their type renders at about
  half size; at 300 DPI Windows' engine returned *four characters* for a page
  that reads as clean English at 600. Orientation is probed once per file by
  asking the engine — the rotation that recognises the most characters is the
  rotation of the text — and any single page that still comes back thin is
  retried in the other three, because a file need not be consistent.
* **The page, not the file, decides.** Every page is tried for a text layer
  first and only rendered and OCR'd when that comes back empty, which is what
  makes `REST_SOAP_webservices.pdf` (31 pages, under 600 characters of text
  layer between them) come out whole instead of mostly blank.
* **Two runs at once, and a shared scratch directory.** The four books were
  being read in one process while the lecture notes were re-read in another, and
  both used the same hard-coded temporary directory for the orientation probe.
  One run's `rmtree` landed in the middle of the other's writes, so pages
  401–600 of a reference book died with `OSError: [Errno 22]` — and, because the
  run had already reported its earlier chunks, it looked exactly like a
  successful one. The scratch directory now carries the process id, and a source
  that produces nothing makes the tool exit non-zero instead of reporting
  success. `tools/check_dcc_extract.py` is what found it: 6,532 lines of that
  book were missing, and nothing else would have noticed.
* **The text that matters most is inside the pictures, and a slide can have
  both.** Chapter 6 is 47 slides carrying under 4 KB of text, because its slides
  *are* screenshots. The harder case is the opposite one: across the nine decks
  there are 394 slides and 179 pictures, and **50 slides that carry a paragraph
  of text frames *and* a picture with text in it** — 24 of them in Chapter 3,
  where the diagrams answer the question. A first attempt that OCR'd only the
  apparently-empty slides skipped all 50. Now every slide is rendered at 3840 px
  and read, and the two readings are **merged rather than concatenated**: only
  the lines the text frames did not already contain are kept, matched fuzzily so
  that a second OCR reading of the same paragraph ("M1" read as "MI") is
  recognised as a duplicate while a real diagram label is not. A PDF page with a
  text layer *and* an image gets the same treatment, because a screenshot pasted
  into a page is as invisible to the text layer as a slide's is.

There is one more piece of state, and it was wrong in a way worth recording:
`MANIFEST.json` is written by whichever run finishes last, so two concurrent
runs each replaced the other's entries — 31 keys for 33 files on disk. The write
now re-reads and merges before replacing the file in one step, and
`--rebuild-manifest` reconstructs the whole thing from the output files' own
headers, because the manifest is a cache and a cache that can be rebuilt from
what it indexes is one that can be thrown away:

```bash
python tools/dcc_extract.py --rebuild-manifest
```

That merge is the one place content could silently vanish, so it is checked
rather than trusted. `tools/check_dcc_extract.py` re-reads every deck's own text
frames and every PDF page's own text layer and asserts each line appears in the
extraction — the reliable source must never be lost — and reports how much text
was found only inside pictures:

```bash
python tools/check_dcc_extract.py            # 0 lines missing, or exit 1
python tools/check_dcc_extract.py --only "Chapter 3"
```

It walks a while — the reference books' text layers are 66,000 lines between them
— and it only checks files that *have* a text layer, since a pure scan has
nothing authoritative to compare against. Worth knowing: Kindberg looks like a
scan (its cover and title pages are) but its body has a real text layer, so only
~16 of its 1,067 pages needed OCR. A file-level decision would have thrown that
away and read the whole book as pictures; deciding per page is what kept it.

What it bought, measured rather than assumed — the "before" column is the pass
that read only the apparently-empty slides, the "after" is everything above:

| Source | Before | After | Slides whose pictures gave text |
| :--- | ---: | ---: | ---: |
| Chapter 6 deck | 3,890 | **24,026** | 41 of 47 |
| Chapter 3 deck | 33,825 | 43,738 | 54 of 94 |
| Chapter 5 deck | 20,617 | 23,414 | 12 of 37 |
| Chapter 4 deck | 23,832 | 25,439 | 12 of 41 |
| Chapter 2 deck | 25,733 | 24,375 | 27 of 48 |

Two of those need a word. **Chapter 6 is the point of the exercise**: 47 slides,
46 pictures, under 4 KB of text between them, and it is Unit 6 — Virtualization,
the second-heaviest unit on the paper at 8 marks. With the merge it carries
24 KB, and the pictures are where all of it was.

**Chapter 2's total falls**, and that is the dedupe doing its job: its earlier
figure included picture text that was a second OCR reading of paragraphs the
text frames already held. What it gained instead is the RPC and RMI call-flow
labels, which were invisible before — "Call remote procedure / Wait for result",
"Data / implementation of methods / A proxy for server". Chapter 3 gained
Cristian's algorithm's own formula and NTP's timestamp definition, neither of
which appears anywhere in that deck's text boxes: `(T1 − T0 − 1)`, and `seconds
since Jan 1, 1900 with a resolution of 200 pico-s`.

`tools/dcc_scaffold.py` writes the chapters that are not written yet. It reads
the unit list from `dcc-site/course.js` and the source list from the extraction
manifest, so a placeholder names the file that actually exists, and it never
touches a chapter that carries real notes:

```bash
python tools/dcc_scaffold.py --list
```

It is idle now — all nine chapters carry real notes, so running it would rewrite
nothing. It stays because a tenth unit, or a re-extraction that changes the
source list, is the case it was written for.

### The old website, and the paper the syllabus does not print

`dcc/dcc-website_v2/` is the site the user already had — nine chapter files and
an entry page, 176 KB — and it is an **input that `dcc_extract.py` does not
read**, because that tool handles pptx, pdf and ppt, and this is JavaScript. So
the new portal was built as though the folder did not exist, and the most
valuable thing in it was missed for a while.

Every card in the old site carries a *paper label*, and its labels are not the
syllabus's. The syllabus prints one Model Question 2025; the old site also
records questions from a **2025 Final Exam**, and a further set of *Expected* /
*Teacher Notes* questions:

```bash
python tools/import_old_site_past.py --report
```

**33 cards: 9 labelled 2025 Model, 8 a 2025 Final Exam, 16 predicted** (labels
like *2025 Exam / Expected* and *Teacher Notes / 2025 Expected*). The nine Model
ones are the portal's nine, wording for wording. The other 24 are not in the
portal at all.

`tools/import_old_site_past.py` writes all 33 into `_source/dcc/`
(`old_site_past_questions.json` and a readable `.txt`), exactly so a whole paper
cannot go missing again — it is **a source that is read by a tool**, not a
folder someone has to remember to look inside.

The tool marks each label `[paper]` or `[predicted]` and deliberately does not
settle which is which beyond that, because **only the person who sat the exam
can**. "2025 Final Exam" is a claim made by the old site, not by the syllabus —
and the distinction matters, since a past paper is evidence and a prediction is
not — the tool marks each label `[paper]` or `[predicted]` and leaves the judgement
on the record rather than in a comment.

```bash
python tools/merge_dcc_old_questions.py     # 16 cards -> 33
```

The merge splits the 24 non-Model cards two ways, and the split is the point:

* **3 were another paper's wording of a question already here** — the 2025 Final's
  RPC/RMI, its Bully-with-a-diagram, and the predicted virtualisation question. Those
  went into the existing card's `occ` trail, which is what *"Same question in N papers"*
  reads; a second card would have split one question's history in two.
* **17 needed real answers**, written from the notes here rather than copied from the old
  site — whose answers are short bullet lists (median 600 characters) and would sit
  visibly thinner beside the ones already written. Each card names the paper it came
  from, and says so when the label is a prediction rather than a paper.

The portal now has **33 cards**, which is every question on the syllabus's printed paper
and every card in the old site.

### The teacher's own diagrams

The units' figures were originally 20 hand-built SVGs against **240 diagram-bearing slides
and lecture pages**. `tools/extract_dcc_figures.py` closes that by pulling the teacher's own
pictures out of the material, and `tools/place_dcc_figures.py` puts each one **inline, in
the section whose note explains it**:

```bash
python tools/extract_dcc_figures.py --report    # what would be kept, and what filtered out
python tools/extract_dcc_figures.py             # 231 images into assets/dcc-slides/
python tools/place_dcc_figures.py --report      # where each image would land, and why
python tools/place_dcc_figures.py               # place them in dcc-site/ch*.js
python tools/audit_dcc_coverage.py --diagrams   # measure it
```

**231 images, 10.8 MB** — 166 pictures out of the 175 picture-bearing slides, and all 65
diagram-bearing lecture pages rendered. The counts are not 1:1 because a slide can carry
more than one diagram and a few pictures are filtered out as logos or rules. Where they
*end up* is a separate decision, and now a separate tool: `place_dcc_figures.py` puts
each one beside the note that explains it, and `tools/slim_dcc_figures.py` then takes the
197 that the note does not actually point at out of the reading flow and onto the
Reference tab — see **The Reference tab** below.

Two findings shaped the tool, both from measuring rather than assuming:

* **A diagram is not always a `Picture` shape.** In `Ref_CloudComptng.pptx`, 28 of the
deck's 31 diagrams are `PlaceholderPicture` (type 14), because the deck was built from a
template. Filtering on type 13 produced three images from a deck that has thirty-seven.
* **A PDF's embedded images are not diagrams.** `REST_SOAP_webservices_Lecture.pdf` carries
204 image objects across 15 pages — about fourteen a page — because a drawing exported
from a diagramming tool arrives as sliced fragments. The page is rendered instead, at
150 DPI where its smallest label still reads.

On the page a slide image is the same object as an SVG figure: same frame, same reading
cap, same full-screen viewer, and the same measured overflow that decides whether a phone
reader is offered it. Units 7 and 9 have no slides because there is **no Chapter 7 or
Chapter 9 deck** in the uploaded material — a missing source, not a missing extraction.

**Where a slide goes is decided by the notes, not by the deck's order.** Each source is
assigned to a unit as a whole, then each image is matched to the section and paragraph that
discusses it, so `GFS_HDFS_Lecture.pdf` files its GFS pages under Unit 4's GFS section and
its HDFS pages under that section's HDFS subsection rather than piling all twenty into one.
`--report` prints the assignment for every image so it can be checked without rendering
anything.

That method has one blind spot: a slide whose text sits entirely *inside* its picture has
nothing to match on, so it is placed by its position in its own deck. Six such slides were
wrong, found by reading the flagged placements, and are corrected in
**`tools/dcc_figure_pins.json`** — which re-applies on every run and fails loudly if a pin
would no longer land. Run it twice to reach a fixed point: the first pass after a pin change
can leave one blank line that the second removes, and nothing else moves.

```bash
python tools/audit_dcc_teaching.py              # section length, depth, and placement support
python tools/audit_dcc_teaching.py --list-thin 12
```

The teaching audit is what makes "properly placed" and "not too long, not too short"
checkable rather than an opinion. It reports any section under 150 words, any stretch of prose
over 420 words without a heading, and — separately — a section whose placed figures are not
discussed by its note. The placement number is split, because a low shared-vocabulary score
means one of two things: either the note is about something else (a real misfiling, 5
sections) or the figure carries under 25 words of its own, in which case the score describes
the slide and not the placement (4 sections).

**Being placed correctly is not the same as being wanted there.** Placed correctly, the site
still read as notes with a deck pasted through them: **201 screenshots inline in `learn`**,
one per ~250 words, **157 of them captioned `Figure for <section heading>`** — the machine's
fallback where a description should be — 64 in runs of three or more, and a `fig-src-note`
line naming the source files at the end of every unit. Every fact in those pictures had
already been extracted into the prose, so each was a second copy of the paragraph above it.
`tools/slim_dcc_figures.py` moves the 197 that no sentence in the notes points at into each
chapter's `slides` field, which the **Reference** tab draws under the heading of the note
section they belong to. Four stay in the notes
(`tools/dcc_figure_keepers.json`) because a sentence names them — §2.2.1, §2.4.5, §3.1.3's
NTP subnet, §6.1.8 — and the hand-built SVG diagrams are never touched.

```bash
python tools/slim_dcc_figures.py --report    # what would move, and what stays, per unit
python tools/slim_dcc_figures.py --apply
python tools/slim_dcc_figures.py --check     # gate step 13
```


The move was recorded as it was made, so `--restore` used to put the notes back byte for
byte. That journal belonged to one run and the text it held existed nowhere else, so it is
not in the repository — a second `--apply` over an already-moved unit would have overwritten
it with an empty move and a restore would then have deleted 106 pictures in silence. The
tool now refuses both of those things, and `--check` proves the state on its own: the 231
pictures come from `assets/dcc-slides/FIGURES.json`, each has to be on exactly one page, and
anything left in `learn` has to be one of the four keepers.

A caption now says what a picture shows, or there is none: never the section heading, and
never a file name. That rule lives in **`tools/figcaptions.py`** and is imported by both this
tool and `make_reference.py`, because the reader's own example — a caption reading
`page 2 · GFS_HDFS_Lecture.pdf` — was on the Reference tab, which the earlier caption pass
had never reached. A caption that already says something is kept rather than regenerated:
the voice catalogue has hand-written replacements among them.

**And the tab has to teach, not dump.** Moving the pictures fixed the reading and left the
tab as a wall: 153 of the 217 carry no text of their own, and every one of those was named
`Illustration for 4.3.4 Messaging middleware: MQTT and AMQP` in its `alt` — the section
heading echoed back, in the one place a screen reader reads aloud. So two things changed.
Each group heading is now **a link back to the note section it is named after**
(`modules/reference.js`; it goes to Learn, unfolds the section, scrolls to it and flashes
it), and each picture carries **one written line saying what to notice in it**, in
`tools/dcc_slide_notes.json`, applied to the `alt` and to a `.ref-why` note under the
picture by `tools/ref_slide_notes.py`. The lines are read off the pictures: deriving them
from the notes was measured and rejected — it produced a line for 36 of 217, most of them
the section heading glued to the section's opening sentence, which is the filler this pass
exists to remove. A picture nobody has read is left without a line, the count is reported,
and the runner holds `--strict` as a known gap until the last one is written.

```bash
python tools/ref_slide_notes.py --report     # how many pictures carry a line, per unit
python tools/ref_slide_notes.py --apply
python tools/ref_slide_notes.py --check      # gate: a missing or filler line fails
python tools/ref_slide_notes.py --strict     # gate: also fails while lines are pending
python tools/ref_slide_notes.py --roundtrip  # proves --restore byte-exact, on the real files
```

**And the words have to be about the subject, not about the class.** The notes were
written from the decks, and they read that way: **220 sentences** across the nine units —
112 in the first round and 108 in the second — said what *the deck* does, what *the paper*
asks, what is *examinable*, what another unit covered, what the reader should do, or what
*the notes themselves* are about ("Two sentences close the unit"). The first sentence the
reader quoted was `Those three requirements are the vocabulary to answer an RMI question
with, and the order they come in is the order of the problem`, now `The three requirements
are listed in the order a remote invocation meets them.` The second was Unit 3's opener,
which announced its own shape: `The four sub-topics are stages of one argument rather than
four separate topics … The reading order is the order to work through …`, both of which are
gone. `tools/voice_audit.py` is the measurement — **twelve tells**, per chapter, and
`--check` fails if a retired one returns; the fix is a reviewed catalogue, not a regex. A round of edits is written as **prose** in
`data/voice_curate*.json` — the sentence to change, the sentence to put in its place, the
tell it retires and why — and `voice_rewrite.py --curate` resolves each one against the
chapter file, refuses anything that is not one place in the file, and appends the exact
markup to `data/voice_rewrites.json`. Two whole callouts addressed to whoever maintains
the site rather than to a reader are gone with it.

```bash
python tools/voice_audit.py                 # the table: tells per chapter, per category
python tools/voice_audit.py --check         # gate: a retired tell must not come back
python tools/voice_rewrite.py --context ch6 # each tell, with the exact HTML around it
python tools/voice_rewrite.py --curate      # resolves data/voice_curate*.json
python tools/voice_rewrite.py --apply
python tools/voice_rewrite.py --check       # gate: every applied edit is still in force
```

A pass covers the `learn` field. The quiz explanations, the Past tab's answers and the
captions in the `slides` and `reference` fields carry the same tells — 147 of them when
the notes reached zero, most of them captions that R10's written lines will replace — and
they are a separate pass.

**Run the tools in this order, and only from the state each expects.**
`place_dcc_figures.py` strips and re-derives every `<!-- dcc-fig: -->` block it can find, so
running it after this tool puts all 201 pictures back; and `make_reference.py --restore`
records positions in the notes text as it was before *its* move, so it is only valid before
this one. The order is extract → place → `make_reference` → `slim_dcc_figures`; `--check`
reports when the notes and the record disagree rather than repairing them.

### Status: all nine units are written

Every unit is real notes drawn from the extracted decks, the reference books
and the syllabus — there is no placeholder left anywhere in `dcc-site/`. Counted
from the chapter files themselves:

| Unit | Topic | Marks | Sections | Tables | Figures | MCQs | Model-2025 questions |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | Introduction to distributed systems | 6 | 11 | 9 | 1 | 12 | 1, 5, 6 |
| 2 | Communication in distributed systems | 10 | 25 | 16 | 3 | 15 | 7 |
| 3 | Synchronization and election | 6 | 23 | 11 | 3 | 16 | 3, 8, 14 |
| 4 | Distributed file systems | 6 | 20 | 13 | 3 | 18 | 9, 16 |
| 5 | Introduction to cloud computing | 6 | 14 | 11 | 2 | 16 | 2, 10, 13 |
| 6 | Virtualization and cloud architecture | 8 | 21 | 10 | 3 | 17 | 4, 11 |
| 7 | Cloud platforms and services | 6 | 14 | 9 | 1 | 16 | — |
| 8 | Security and challenges | 8 | 16 | 10 | 2 | 18 | 12 |
| 9 | Emerging trends | 4 | 14 | 8 | 2 | 18 | 15 |
| | **Total** | **60** | **158** | **97** | **20** | **146** | **16 of 16** (+ 17 more cards from the old site) |

The **Figures** column counts the hand-built SVG figures, which are what the notes are
built around. The teacher's own pictures are **not** in those pages: 197 of the 201
screenshots that used to be pasted inline went to the **Reference** tab under the note
section each belongs to (`tools/slim_dcc_figures.py`), and 4 stayed beside the one
sentence in their own section that names them. Unit 9 has no pictures, and units 1 and 5
keep none in the notes. The **Sections** column counts the top-level sections in the
chapter files; the teaching audit counts every h2 and h3 row, which is the 182 it reports.

Measured across the site: **50,437 words of prose in 182 sections**, median 247 words per
section, and 658 paragraphs at a median of 51 words with none over 216. Of the 9 units,
6 keep at least one screenshot inline and each of those is named by a sentence in its own
section — the section it illustrates would otherwise point at nothing.

The **Model-2025 questions** column is the point of the exercise: the syllabus
prints the paper, and every one of its sixteen questions has a model answer
written against the same marker's arithmetic. Group A is four questions worth
2 marks (`2*4=8`), Group B lists eight with *answer any seven* at 4 each (28),
Group C lists four with *answer any three* at 8 each (24) — 8 + 28 + 24 = 60,
and 4 + 8 + 4 = 16 questions. Unit 7 has none because no question on that paper
asks about it, which the empty cell says rather than hides.

Two notes on provenance, because they are not the same kind of evidence:

* **Unit 7 is the one unit with no lecture deck.** It is written from the
  reference decks (the cloud-platforms and AWS material) and the textbooks, and
  the unit page says so instead of implying a teacher's deck exists.
* **Units 2 and 3 carry the extracted picture text that mattered most.** Unit 3's
  sections cite Cristian's own formula and NTP's timestamp definition, both of
  which exist only inside a slide image in the teacher's deck.

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

## Publishing it

Both courses are live, each from its own public repo, each with `index.html` at
the repo root and Pages deploying from `main` at `/`:

| Site | URL | Repo |
| :--- | :--- | :--- |
| Simulation & Modeling (BCE7026) | https://codingincloud.github.io/simulation-study-portal/ | `Codingincloud/simulation-study-portal` |
| Distributed & Cloud Computing (BCE7024) | https://codingincloud.github.io/dcc-study-portal-v2/ | `Codingincloud/dcc-study-portal-v2` |

Both survive living at a subpath rather than `/` because nothing in a bundle is an
absolute path — the same property that lets `dist/` and `dist-dcc/` be served as
plain directories. Each site also carries its comparison sheet at
`theme-sheet.html` next to `index.html`. `Codingincloud/dcc-study-portal` is the
**superseded** first build (uncorrected layout, first dark palette): leave it
where it is, but do not hand its URL out.

```bash
python tools/build_deploy.py --sheet --zip                             # Simulation
python tools/build_deploy.py --entry dcc-site/index.html --out dist-dcc \
                             --sheet --zip --zip-name dcc-study-portal.zip  # DCC
```

`--sheet` adds the mode comparison sheet to the bundle and therefore to the
archive; it has to be a flag on the build rather than a command run afterwards,
because the build clears its output directory and then zips what is in it.

That writes `dist/` + `simulation-study-portal.zip` (53 entries, 8.0 MB) and
`dist-dcc/` + `dcc-study-portal.zip` (244 entries, 12.5 MB), each containing its
own `index.html` at the root, its mode sheet beside it, and its own assets: the
DCC bundle carries the teacher's 231 slide images and **not** the Simulation
site's rendered note pages, because the DCC entry never loads them. **Serve the bundle, not the source tree.** The source
page loads 17 scripts and 3 sheets as classic `<script>`/`<link>` tags, and a
classic script is not even *discovered* until the one before it has run — so a
visitor pays 21 round trips in series. That is a second of pure latency on a
fast host and about a minute behind a tunnel, which is where the bundle came
from: same files, same order, one sheet and one script, marked `defer`.

Any of these hosts takes it as-is, and all of them are free for a site this size:

| Host | How |
| :--- | :--- |
| **Netlify Drop** | Drag `simulation-study-portal.zip` — or `dcc-study-portal.zip`, or both as two separate drops — onto <https://app.netlify.com/drop>. No CLI, no build command: the archive is already the site. |
| **Cloudflare Pages** | Create a project → *Direct Upload* → drop the same zip. |
| **GitHub Pages** | Needs `dist/` committed: delete the `dist/` lines from `.gitignore`, run the build, and point Pages at the repo root (or at `dist/` with a workflow). The source tree is the only thing that changes; the bundle has no build step of its own. |

`dist/` is regenerated and git-ignored, so it is never the thing you edit.

For a link on the local network or through a tunnel, serve the bundle from
*outside* it:

```bash
python -m http.server 8331 --directory dist
ssh -R 80:127.0.0.1:8331 nokey@localhost.run      # prints a public https URL
```

The `--directory` flag matters: a server started *inside* `dist/` (the obvious
`cd dist && python -m http.server`) holds the directory open, and on Windows the
next build then fails to clear it — having already deleted half the files. The
same applies to a free tunnel: the URL lives only as long as that ssh session,
and localhost.run's free tier starts answering `503` after a while, so treat it
as a way to show someone the site, not as a place to host it.

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

The window is the layout, within the width mode you choose: in **comfort** the
notes column is a centred 720 px and the quiz / past-question / analysis / exam
panels 820 px, and in **full** every one of those caps is lifted, so the column
takes the whole content area minus its gutter and a laptop never reads like an
oversized phone beside a void.

| Control | Where | What it does |
| :--- | :--- | :--- |
| ☰ | topbar | Compresses the sidebar to a 72 px rail of chapter numbers, and remembers the choice; below 1025 px the same button opens the sidebar as a drawer. |
| ▾ on a section heading | Learn | Folds that section away. *Expand all* / *Collapse all sections* at the top of the chapter; which sections you folded is remembered per chapter. |
| *Open every answer* / *Show every wording* | Past Questions | Expand or collapse the whole list in one click. |
| ▴ ▾ | bottom right | Jump to the top, or into the next chapter. |
| Ctrl+P | anywhere | Print stylesheet: chrome hidden, folded sections and answers expanded, black on white. |

### Global search

Search box in the top bar (or press `/`) searches the notes, the quiz questions
and the past-question cards at once. Clicking a result jumps to the chapter, opens
the right tab, scrolls to the match and flashes it. The panel is a real
combobox/listbox: arrow keys move the selection, `Escape` closes it, and a live
region announces how many results there are.

### Deep links and the URL

Every view is addressable, so the question you keep getting wrong is a link you
can bookmark, send to a classmate, or reopen on your phone.

| Link | Opens |
| :--- | :--- |
| `#/ch/4` | chapter 4, Learn |
| `#/ch/4/quiz` | chapter 4, Quiz (also `/past`) |
| `#/analysis` | the Analysis tab |
| `#/exam` | the mock exam |
| `#/q/6-2` | chapter 6, Past Questions, the 3rd card open |

`engine.js` owns the grammar (`SM.parseRoute` / `SM.formatRoute`) and it is
pinned by the contract test, including the round trip — `formatRoute(parseRoute(x))`
returns `x` for all 8 chapters × 5 tabs. The chapter list is built from real
links, and a user navigation pushes a history entry, so the browser's Back button
returns to the previous view. A mangled hash is not an error state: the address
bar is put back in step with what is on screen. The first paint *replaces* the
entry instead, so Back leaves the site rather than bouncing through `#/ch/1`.

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
  No card is in that state today — all 92 carry an answer — but the mechanism
  stays, and the Past Questions tab hides its *Practice* filter while the count
  is zero.
* `variants[]` holds questions that were folded into this card during the
  one-question-one-card pass, each **with the model answer written for that
  paper**. Without it, folding a repeated question would throw away the other
  papers' answers — it is why folding 54 cards cost no model answer.
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
├── app.js                        # the shell: nav, tabs, Analysis, theme — wires the modules
├── engine.js                     # pure logic, no DOM: paper allocator + marking, quiz scoring, search
├── modules/                      # one file per feature, each owning its own state
│   ├── progress.js               # localStorage 'sm-progress', XP, streak, stats, export/import/reset
│   ├── quiz.js                   # the live quiz run
│   ├── past.js                   # the past-question list and its filter
│   ├── search.js                 # the search index and the current hit list
│   └── exam.js                   # the assembled mock paper, its timer and self-marking
├── ch1.js … ch8.js               # one file per chapter: notes + quiz + past questions
├── plan.md                       # living build plan / tracker (read this first)
├── assets/
│   ├── css/tokens.css            # colour, type and rhythm tokens (dark + light)
│   ├── css/foundation.css        # reading column, pills, tables, callouts, worked
│   └── fonts/                    # Inter + JetBrains Mono woff2 (offline, no CDN);
│                                 # Newsreader's files remain, no rule uses them
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
│   ├── check_tables.js           # re-derives every "Total" row in ch*.js
│   ├── check_figures.js          # re-derives every figure contract (ids, numbering, viewBox, colour)
│   ├── check_draw_coverage.js    # every "draw…" past card actually carries a figure
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

### Application structure

`index.html` loads `engine.js` (the pure decisions, `window.SM`), then the five
feature modules in `modules/` (each owns its own state and registers on
`window.SMApp`), then `app.js` (the shell: the chapters, navigation, Analysis
and theme, plus the wiring). A module never reaches into another's state: it
calls back through `window.SMApp.Shell` for rendering, navigation and toasts.
So the mock exam, quiz, past list, search and progress can each be reasoned
about — and tested — on their own.

---

## The design layer

The shell markup and the eight chapter files use plain class names
(`.concept-box`, `.formula-box`, `.comparison-table`, …). All styling now lives
in two sheets:

* **`assets/css/tokens.css`** — the single source of truth for colour, type and
  rhythm. It defines the same variable names the site always used (`--pri`,
  `--t2`, `--brd`, …), so every chapter, quiz, past question, analysis card and
  exam row inherits the theme with no content edits. A new reader gets
  **Daylight** (light). See **Reading modes** below for the nine palettes and the
  width toggle.
* **`assets/css/foundation.css`** — the component layer: the reading column
  (capped by `--reader-w` — 720 px in comfort, `100%` in full; the wide tabs by
  `--wide-w`), prose rhythm,
  pill treatments, table striping and numeric columns, the
  callout pattern (definition / formula / exam tip / talked-about / caution /
  mistake / worked example), sidebar chapter states, tab badges and the floating
  jump-to-top and next-chapter buttons.

Three things worth knowing before editing them:

1. The `<link>` tags sit **after** `</style>` in `index.html`. The foundation
   sheet overrides the shell at equal specificity, so loading it earlier makes
   it silently do nothing.
2. Cell alignment is automatic. `enhanceContent()` wraps every table in
   `.table-scroll` (so wide comparison tables scroll instead of breaking the
   reading column) and marks cells that contain nothing but a number with
   `td.num` — right aligned, tabular monospace. Content files need no changes.
   **Numbers belong in a real `<table>`, never in a monospaced column layout.**
   A hand-spaced block inside `.worked-calc` looks aligned in the file and
   falls apart the moment the column narrows or a phone wraps it; it also
   cannot be right-aligned, checked or printed. Every such block has been
   converted, and `node tools/check_tables.js` now re-derives the arithmetic of
   any row whose first cell says `Total`, so a table that stops adding up fails
   a check instead of a reader.
3. Accent colours come in pairs, and the pair matters. The bare value is a
   **fill**: `--pri` is the indigo pill, active-nav and "Mark complete"
   background, and white on it is 4.70:1. The `-l` value is the same accent
   made legible as **text** — `--pri-l`, `--sec-l`, `--acc-l`, `--dan-l`,
   `--vio-l`. `--pri` as text on a card is only 3.59:1 and `--dan` 4.31:1, so
   coloured *text* always takes the `-l` value while borders, fills and
   gradients take the bare one. `-l` means lighter in the dark theme and darker
   in the light one, so a rule can use one token in both.

### Reading modes, and the width toggle

Nine modes. The two defaults keep their ids (`light`, `dark`), so a stored choice
survives every palette change; their *values* are now the palette the reader asked
for — see below.

| Mode | id | Kind |
| :--- | :--- | :--- |
| Daylight *(the default)* | `light` | light |
| Midnight | `dark` | dark |
| Romantic Blend | `romantic` | light |
| Peacock Feather | `peacock` | light |
| Sunset View · Peach | `sunsetpeach` | light |
| Purple Blend | `purpleblend` | dark |
| Sunset View · Wine | `sunsetwine` | dark |
| Evening Mix | `eveningmix` | dark |
| Yours *(derived)* | `custom` | either |

As with the two originals, every new mode declares the **full** token contract in
its own `[data-theme="…"]` block, so chapters, quizzes, tables, callouts and
figures re-colour with no content edits. A missing block is not an inheritance —
it leaves every token in that mode *undefined*, which is why
`tools/check_themes.py` exists: it fails when the ids in `tokens.css`, the
`THEMES` list in `app.js` and the boot script in each entry page drift apart, and
it re-derives roughly twenty contrast pairs per mode (each ink on each surface,
each `-l` on its own `-bg`, white on every fill, hairlines against their
surfaces), failing below AA. **A ninth mode cannot be added without passing it.**

The palette colours drive surfaces, ink and the brand accent. The four semantic
roles — green = success, ochre = caution, brick = danger, plum = "commonly
asked" — keep their hue families and are only retuned to the surface, because
recolouring "success" pink would break the meaning the notes depend on.

**Where Daylight and Midnight come from.** The reader linked an earlier DCC portal
— white cards on a cool `#f0f4f8` desk, a `#2563eb` accent, emerald for the right
answer, flat surfaces, a 12 px card radius — and asked for it: *"style is so good
cant we adopt like this way"*. So those two blocks carry that palette, plus the
three type treatments that belong to it: `h3` in the accent, the small-caps `h4`
label in the emerald, and `code` as a tinted chip instead of a grey box.

Three of the reference's own colours could not be used as they stand, because this
site holds a contrast contract the reference does not: white on `#059669` is
3.35:1 and on `#d97706` 3.41:1, both below AA for the small type the fills carry,
so the fills are the 600/700 steps (`#047857`, `#b45309`, white at 4.83:1 and
4.90:1); `#94a3b8` metadata on `#f0f4f8` is 2.6:1, so metadata is `#5b6a80`
(4.85:1); and `#e2e8f0` hairlines against that page were 1.10:1, so the rule is
`#d8e0ea`. `tools/check_themes.py` is what decides this, not taste: it re-derives
the ~20 pairs per mode and fails below AA, and all nine modes pass.

**Yours** is the ninth mode and it is not written down anywhere: `custom-theme.js`
*derives* it from two colours the reader picks in the picker, solving each of the
39 tokens rather than offsetting it — walk a colour along its own hue until it
clears the contrast it has to clear, with a margin, and land on a value that
cannot fail. A reader may pick white-on-white or the exact hue of the "success"
callout for their accent, so `tools/test_custom_theme.js` runs the derivation
over a grid of 168 awkward inputs and `tools/check_themes.py --palettes` then puts
that whole grid through the *same* contrast list the eight static modes go
through. The derived palette is cached as a flat list of custom properties, which
is how the boot script paints it before first paint without the solver. Its
`[data-theme="custom"]` block in `tokens.css` is the seed fallback and is
**generated** by `tools/gen_custom_palette.py`, never hand-edited.

The second axis is `data-width` on the same `<html>` element. **Comfort** is the
centred 720 px reading column (prose capped at `--measure: 35em`, ~74
characters). **Full** lifts every cap — `--measure`, `--reader-w` and `--wide-w`
all become `100%`, and the gutter narrows — because a cap of *any* fixed size
leaves a void on a screen wider than it: an earlier `1180px` still parked 250 px
at each edge of a 1680 px window, which is the same complaint at a smaller size.
Measured at 1920 px in full, the column runs 301→1891 px, so the only space left
beside the text is the 29 px gutter. Below ~820 px the caps are inert, so phones
are unchanged — and the toggle hides itself under 700 px rather than offering a
switch that would do nothing.

Both choices persist under `dcc-theme` / `dcc-width`, are applied by the boot
script *before first paint* (so there is no flash of the wrong theme), and are
announced to the browser chrome through a per-mode `theme-color` meta.

### Sync: the same mode on your other device

There is no account and no backend, so a choice travels as a **link**. `Sync` in
the picker head writes the appearance into three short parameters —
`?t=<mode>&w=<width>`, plus `&c=<accent>,<surface>` for Yours — and copies it.
Opening that link on the other device applies the appearance *and stores it*, so
one link is enough and the two devices then agree without staying connected;
`custom-theme.js` owns the format, and `tools/test_custom_theme.js` holds the boot
script's inline copy of it (the boot script runs before the bundle exists) to the
same three names. The parameters are stripped from the URL once applied, so a
reload cannot re-assert a mode the reader has changed since.

### Judging the modes by eye

`tools/make_theme_sheet.py` writes `theme-sheet.html` into the built bundle: one
row per mode, each row a 1440 px laptop cell and a 390 px phone cell. The cells
are **the real pages**, opened through that same `?t=&w=&c=` link, so the sheet
cannot drift from what ships. It is an author tool — a cell is the app, so it
persists the last mode it showed — and it is not linked from the site. After a
rebuild: `python tools/make_theme_sheet.py`, then open
`dist-dcc/theme-sheet.html`. `tools/run_checks.py` fails if a mode exists that the
built sheet does not list.

### Figures

Twelve figures, one per topic that a question asks you to *draw*: the twelve
steps of a study (Ch 1), the hit-or-miss rectangle (Ch 2), the analog wiring
of the suspension equation, the negative-feedback loop and the 2012
compartment model (Ch 3), the structure of a queuing system and the four
channel/server configurations (Ch 4), the three-level model-building triangle
(Ch 5), mid-square extraction (Ch 6), replication and the confidence interval
(Ch 7), the next-event loop and the two clock-advancing approaches (Ch 8).

Those live next to the notes. **The past-question answers that ask you to draw
now draw too:** the GPSS block symbols and the five worked GPSS models (Ch 8),
the analog wiring of `Ax'' + Bx' + Cx + D = 0` (Ch 3), and the chapter figures
themselves — the twelve-step flowchart, the feedback loop and the three-level
triangle — copied into the answer that needs them. A copied figure keeps its
number and gets a marker id of its own, because both panels are in the DOM at
once.

They are **inline SVG, never rasters**, and they draw from one alphabet of
classes in `foundation.css` (`.fig-node`, `.fig-t`, `.fig-edge`, `.fig-curve`,
`.fig-head`, …). Every one of those classes reads a theme token rather than a
hex value, so a figure re-colours with the theme toggle, stays sharp at any
zoom, and survives into the PDF. Two rules keep them from rotting:

* **A figure may not assert anything the chapter text does not already say.**
  They are redrawings of definitions, equations and worked examples that are on
  the page — the caption says which ones, so the picture and the arithmetic can
  be checked against each other. Where a figure summarises a table, it uses
  that table's own values (Fig 2.1 plots the ten rows of the hit-or-miss table,
  and Fig 6.1 uses the seed from the mid-square worked example).
* **Markers need unique ids.** Every figure names its arrowhead marker after
  itself (`fg4a`, `fg5a`, …). Two figures sharing an id means the second one
  silently borrows the first one's arrowhead, and only one arrowhead is ever
  rendered — an easy bug to ship because it looks fine until both are on the
  page at once.
* **The rules are checked, not trusted.** `node tools/check_figures.js`
  re-derives them headlessly: one `<svg>` and one `<figcaption>` per figure,
  `role="img"` with a real `aria-label`, every marker id defined exactly once
  across the whole site, every `marker-end` resolving inside its own figure, no
  colour written into the markup at all (no `style=`, no `fill="#…"`), every
  `<text>` classed and inside its `viewBox`, and every caption number present in
  `plan.md`'s figure table and appearing in reading order. It measures type by
  estimate (a little wide, 8 units of slack) rather than pretending to be a
  layout engine, and it was negative-tested against injected breakages before it
  was trusted. Its companion `node tools/check_draw_coverage.js` covers the other
  direction — that a past question asking you to *draw* actually contains a
  figure — scanning the canonical wording and every paper wording, with any
  genuine exception written down (and a stale exception treated as a failure).

**A figure has a size floor.** A figure is drawn in its own coordinate space, so
its labels are only as legible as the scale it ends up rendered at. On load each
figure's own `viewBox` width is read and `--fig-min` is set to 85% of it, which
`.figure` uses as `min-width`; the `.figure-wrap` around it scrolls sideways
rather than letting the drawing shrink past the floor. At that floor a 13px
label renders at ~11px. This replaced a per-figure `.wide` opt-in that two
figures never received — the Ch 1 flowchart and the Ch 8 loop chart shrank to
6.4px labels at 375px until the floor became universal.

Stroke contrast is a rule, not a per-figure decision: a diagram's outline *is*
its content, so `.fig-node` / `.fig-edge` / `.flow-box` / `.flow-arrow` draw in
`--fig-line` (3.34:1 on a white card, 3.45:1 on the original dark one, and checked
against `--bg-card` and `--bg` in **all nine modes** by `tools/check_themes.py`)
and tinted boxes in
the `-l` accent of their colour, all clear of the 3:1 that WCAG 1.4.11 asks of a
graphical object. The bare `--*-bd` borders, which run 1.3–2.3:1, are for card
and table hairlines and must never be used inside a figure.

Where a figure *replaced* a hand-typed ASCII sketch
that came from the class notes, the sketch is kept collapsed behind
`<details class="fig-source">` — the figure is what you read, the sketch is the
evidence that the figure is faithful to the answer that was written in class.

## Accessibility

* Every page has a `<main>` landmark plus a skip link ("Skip to the chapter
   content") that appears on focus — the sidebar is eight chapters of
   navigation before the chapter you asked for.
* Global search is a real combobox/listbox: the input owns the panel with
   `aria-controls`, every hit is a `role="option"` with an id, arrow keys set
   `aria-activedescendant` (and scroll the option into view), and a polite live
   region announces the result count. `Escape` closes it; `/` focuses it.
* Toasts are `role="status"` regions, so "+10 XP" and "All sections expanded"
   are announced rather than silently drawn.
* The mobile drawer takes focus when it opens, closes on `Escape` (returning
   focus to the button), and puts the content behind it `inert` so `Tab` cannot
   wander into a page hidden under the overlay.
* No type below **11px** anywhere, in either theme. `prefers-reduced-motion`
   disables the confetti, the reveal animations and the slide-in.
* Contrast was audited in place — every visible text node on all five tabs, in
   both themes — and passes AA (4.5:1, or 3:1 for the 40px exam score). The
   figures in Ch1 and Ch8 were already `role="img"` with a descriptive
   `aria-label`.

### Colour roles used by the callouts

| Class | Kind |
| :--- | :--- |
| `.concept-box` | definition / key concept |
| `.concept-box.revise` | the short answer block at the top of a DCC note section — see *Revising a section instead of reading it* |
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
node   tools/check_tables.js              # re-derives every "Total" row in ch*.js
node   tools/check_figures.js             # re-derives every figure contract
node   tools/check_draw_coverage.js       # every "draw…" card carries a figure
node   tools/test_engine.js               # the app's pure contracts, no browser
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
page can show inside the surviving card. Result: **146 → 92 cards, 0 questions
lost** — the fold preserved all 86 answers that existed at the time, and the
2026-09-12 answer pass wrote the remaining 21, so every card now carries one.

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
(`"6-33"`, `"3-07"`, …) and re-run `merge_past.py --apply`. A question with no
answer stays visible on the site with an explicit "model answer pending" badge —
it is never silently dropped. **There are none left as of 2026-09-12** (the answer
pass closed the last 21), but the path stays open for any new question, and the
Past Questions *Practice* filter appears only while it has something to show.

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
worked numericals) plus the 92 question cards, each with its model answer. One caveat: `xhtml2pdf` does not draw inline SVG, so the Ch1 flowchart
appears on screen but not in the PDF; it needs a raster fallback for print.
