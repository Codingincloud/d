# DCC portal — what from the uploaded material actually reached the site

Answers to three questions, measured rather than eyeballed:

1. **Is every resource used?** — No. The books are extracted and barely cited. The
   lab manuals are extracted and deliberately unused: they are extras, not exam material.
2. **Are the diagrams sufficient?** — They are now. **231 of the teacher's own images are
extracted and shown — 166 pictures from the 175 picture-bearing slides, and 65 of the 65
diagram-bearing lecture pages** — against 20 hand-built SVG figures when this was first
measured. The two counts are not 1:1: a slide can carry more than one diagram, and a few
pictures are filtered out as logos or rules. Each one sits inline under the note that
explains it, and `tools/audit_dcc_teaching.py` measures whether that is true.
3. **Is the past-question part done?** — Yes. **All 16 questions** on the syllabus's
   printed paper, and **all 33 cards** the old website recorded, are now on the site.

Sections 2 and 3 below still describe the gap as it was measured; each now ends with
what closed it, because the measurement is the thing worth keeping and the fix is only
the answer to it.

Every number below comes out of one tool:

```bash
python tools/audit_dcc_coverage.py              # all three sections
python tools/audit_dcc_coverage.py --inventory  # resources
python tools/audit_dcc_coverage.py --diagrams   # the diagram gap
python tools/audit_dcc_coverage.py --past       # the question gap

python tools/audit_dcc_teaching.py              # how long and how deep each section is
python tools/audit_dcc_teaching.py --list-thin 12   # the flagged sections, with reasons
```

The words on the site are measured too: **56,332 words of prose across 197
sections**, median 252 words per section, and **571 paragraphs at a median of 59
words, none over 243** — a section is long by having several sub-headings and
paragraphs, not by carrying a wall of text. The teaching audit reports any section
under 150 words, any stretch of prose over 420 words without a heading, and any
section whose figures its note does not discuss.

---

## 1. Resources: extracted vs used

`tools/dcc_extract.py` reads **every** uploaded file. Extraction coverage is 100%.
*Use* is a different number, and the gap is in the table's right-hand column.

| Category | Sources | Text files | Characters | Used in the site |
| :--- | ---: | ---: | ---: | :--- |
| Syllabus | 1 | 1 | 5,112 | **Fully** — unit list, marks, hours, the whole Model Question 2025 |
| Lecture decks and notes | 16 | 16 | 345,317 | **Used** for every unit that has a deck |
| Lab manuals | 3 | 3 | 27,701 | **No — out of scope** (extras) |
| **Books** | 4 (2,765 pages) | 17 chunks | 7,281,622 | **Barely** |
| `dcc-website_v2/` (old site) | 10 | — | — | **Merged** — all 33 cards are on the site |
| **TOTAL** | | **37** | **7,659,752** | |

**The lab manuals are out of scope, by decision — not a gap.** Three files, six
practicals (sockets, Java RMI, Lamport clocks, distributed election, cloud,
virtualization). They are extras rather than exam material, so the portal
intentionally does not carry them, and you will find no mention of a lab manual
anywhere on the site. Nothing on the printed paper asks about a practical, and the
*theory* those practicals would exercise is already covered (RMI 14 mentions,
sockets 7). They stay in the tree as an extracted resource and are excluded here.

**The books are extracted and barely cited.** 7.28 M characters, more than half
of everything extracted, the most authoritative material in the folder:

| Book | Mentions in the portal |
| :--- | ---: |
| Tanenbaum, *Distributed Systems* | 12 |
| Coulouris | 6 |
| Hwang, *Distributed and Cloud Computing* | 4 (+2 as "Kai Hwang") |
| Kindberg, *Concepts & Design* | 1 |
| *Cloud Computing Theory and Practice* | **0** |

**Two units have no source deck at all.** There is no Chapter 7 or Chapter 9
folder among the lecture files. Units 7 and 9 are written from the Unit 5/6 decks
and the textbooks, and both unit pages say so in a "About this unit's sources"
box rather than implying a deck exists.

---

## 2. Diagrams: the real gap

The portal's figures are hand-built SVG. Against them, the source material is
dense with diagrams.

**Slide decks** — signal: a picture shape on the slide.

| Deck | Slides | With a picture | Picture only | Text + picture |
| :--- | ---: | ---: | ---: | ---: |
| Chapter 1 | 26 | 10 | 1 | 9 |
| Chapter 2 | 48 | 25 | 22 | 3 |
| Chapter 3 | 94 | 45 | 18 | 27 |
| Chapter 4 | 41 | 14 | 2 | 12 |
| Chapter 6 | 47 | 40 | 38 | 2 |
| Chapter 5 reference (`Ref_CloudComptng`) | 114 | 31 | 26 | 5 |
| Chapter 8 | 24 | 10 | 8 | 2 |
| **Total** | **394** | **175** | **115** | **60** |

115 slides are a picture and nothing else — **the slide is the diagram**. (A
legacy `.ppt` deck is excluded because `python-pptx` cannot open it, so 175 is a
floor, not a ceiling.)

**Lecture PDFs** — signal: a page with more than 40 vector paths, which separates
a drawn architecture from a table rule or a page border.

| File | Pages | Diagram pages |
| :--- | ---: | ---: |
| `GFS_HDFS_Lecture.pdf` | 38 | **32** |
| `REST_SOAP_webservices_Lecture.pdf` | 15 | **15** |
| `MessagePassing_refnote2.pdf` | 14 | 10 |
| `Ch4_MessagingProtocol_MQTT_AMQP...pdf` | 7 | **7** |
| `HDFS_Note_4Std_lecture.pdf` | 5 | 1 |
| the other 6 lecture and lab PDFs | 69 | 0 |
| **Total** | **148** | **65** |

**So: 175 + 65 = 240 diagram-bearing slides or pages. The portal has 20 figures.
That is 8.3%.**

Per unit — "picture-blocks" is how much text the extractor recovered from *inside*
slide images, so it measures how much a unit leans on its diagrams:

| Unit | Marks | Picture-blocks | Text from pictures | **Figures drawn** |
| :--- | ---: | ---: | ---: | ---: |
| 1 | 6 | 8 | 101 | 1 |
| 2 | **10** | 27 | 759 | 3 |
| 3 | 6 | **54** | 1,807 | 3 |
| 4 | 6 | 12 | 240 | 3 |
| 5 | 6 | **124** | **4,148** | **2** |
| 6 | **8** | 41 | 1,386 | 3 |
| 7 | 6 | no source | — | 1 |
| 8 | **8** | 10 | 291 | 2 |
| 9 | 4 | no source | — | 2 |
| **Total** | 60 | **276** | **8,732** | **20** |

Worst for their weight on the paper:

* **Unit 5** — 31 picture slides and 4,148 characters of recovered picture text,
  the largest by a wide margin, against **2** figures.
* **Unit 3** — 45 picture slides. Synchronization, clock algorithms and election
  are inherently diagrammatic, and Lamport's clock is an exam question.
* **Unit 6** — 40 of 47 slides are pictures, and hypervisor Type I vs Type II is
  an exam question that is a diagram before it is a sentence.
* **Unit 2** — the heaviest unit on the paper at 10 marks; RPC's call flow and
  RMI's layers are diagrams in every textbook.
* **Unit 4** — 32 diagram pages in a single PDF, `GFS_HDFS_Lecture.pdf`.

None of this means the *text* is thin. 276 picture-blocks is 8,732 characters of
diagram labels, and those were recovered — Unit 3's sections quote Cristian's own
formula and NTP's timestamp definition, which exist only inside a slide image. The
gap is that the diagrams are described, not drawn.

**What closed it.** The decision was to show the teacher's own pictures rather than draw
more. `tools/extract_dcc_figures.py` now produces **231 images** — 166 slide pictures and
65 rendered lecture pages, 10.8 MB as WebP — and `tools/wire_dcc_figures.py` appends one
*Slides from the teacher's deck* section to each unit that has them. Units 7 and 9 still
have none, because there is no Chapter 7 or Chapter 9 deck to extract from: that is a
missing source, not a missing extraction.

The section is a *section* and not inline placement, deliberately. Matching a slide to the
note it illustrates needs a judgement about content, and a drawing filed under the wrong
heading teaches the wrong thing. A wrong diagram is worse than a distant one, so the
section claims nothing about which note a slide belongs to.

---

## 3. Past questions: the printed paper is done, the old site's is not

**Done — 16 of 16.** The audit counts the numbered questions in the extracted
syllabus and the cards on the site and both come to **16**. Every question on the
Model Question 2025 has a model answer, one card each, distributed
3 / 1 / 3 / 2 / 3 / 2 / 0 / 1 / 1 across Units 1–9.

Counting them took care: the scan of the syllabus OCRs `1` as `l`, `10` as `IO`
and `11` as `I I`, so the tool accepts a 1–3 character numeral token and reads the
group headers separately, because the headers state the structure outright —

```
Group A: Very Short Questions 2*4=8          ->  4 questions x 2 marks
Group B: Short Questions (Answer any 7)      ->  8 printed x 4 marks
Group C: Long Questions (Answer any three)   ->  4 printed x 8 marks
                                                8 + 28 + 24 = 60
```

**Not done — the old site's 33 cards.** `dcc-website_v2/` is JavaScript, so
`dcc_extract.py` (pptx/pdf/ppt) never read it. Its cards carry paper labels the
syllabus does not print:

| Label | Cards | Kind |
| :--- | ---: | :--- |
| 2025 Model | 9 | the syllabus's paper — **all 9 already on the site** |
| **2025 Final Exam** | 7 | **a paper that was sat** |
| **2025 Final** | 1 | **a paper that was sat** |
| 2025 Exam / Expected | 7 | predicted |
| Teacher Notes / 2025 Expected | 4 | predicted |
| Expected / 2025 Exam | 4 | predicted |
| Expected | 1 | predicted |

**24 cards came from a label other than the Model paper — 17 of them labelled as
a paper that was sat — and 20 of those had no wording match on the site at all**
— by unit: ch2:1, ch3:2, ch4:2, ch5:3, ch6:3, ch7:1, ch8:4, ch9:4. **All 20 are
now on the site: 0 unmatched, and 3 of them as a second wording inside an
existing card's trail rather than as a card of their own.**

```bash
python tools/import_old_site_past.py           # writes _source/dcc/
python tools/import_old_site_past.py --report   # lists them by label
```

The topics behind them **are** in the notes — the Final paper's 8-mark
Middleware/CORBA question lands on Unit 4's sections 4.3.1–4.3.4. What is missing
is the cards.

`import_old_site_past.py` deliberately does **not** decide whether "2025 Final
Exam" is real. That label is a claim made by the old site, not by the syllabus,
and only the person who sat the paper can settle it. The tool marks each label
`[paper]` or `[predicted]` and leaves the judgement on the record.

**What closed it.** `tools/merge_dcc_old_questions.py` merged all 20, and the split is
not arbitrary:

* **3 were another paper's wording of a question already here** — the 2025 Final's RPC/RMI,
  its Bully-with-a-diagram, and the predicted virtualisation/hypervisor question. Those went
  into the existing card's `occ` list, which is what the site's *"Same question in N
  papers"* trail reads. A second card would have split one question's history in two and left
  both looking half-answered.
* **17 needed real answers**, and they were written from the notes in `dcc-site/`, **not**
  copied from the old site — whose answers are short bullet lists (median 600 characters) and
  would sit visibly thinner beside the ones already here. Each says which paper it came from
  and, where the label is a prediction rather than a paper, says that too.

**16 cards became 33**, and 3 cards now carry a two-paper trail.

---

## What closed each gap

| Gap | Size | What was done | State |
| :--- | :--- | :--- | :--- |
| **Diagrams** | 240 source diagrams vs 20 figures | `tools/extract_dcc_figures.py` pulls the teacher's own pictures out of the decks and renders the lecture PDFs' diagram pages; `tools/place_dcc_figures.py` places each one **inline, in the section whose note explains it**. **231 images, 10.8 MB.** | **Closed** |
| Old site's questions | 24 cards from other labels; 20 unmatched | `tools/merge_dcc_old_questions.py`: 3 were other papers' wordings of a question already here, so they went into that card's occurrence trail; 17 needed real answers, written from these notes. **16 → 33 cards**, and the 33 wordings of the old site's 33 cards now all match (0 unmatched; 3 matched only through a trail). | **Closed** |
| Lab manuals | 6 practicals | Excluded as extras — the site never references them. | **Out of scope** |
| Books | 7.28 M chars, 1–12 citations | — | **Open** |

`tools/audit_dcc_coverage.py` re-runs the measurement above, so this file can be checked
against the tree rather than trusted.

### How the diagrams were done

Two formats, two treatments, and the difference was found by measuring rather than by
assuming:

* A picture on a **slide** is a picture shape with an image blob, so the blob is taken
  whole — **but not only `Picture` shapes**. In `Ref_CloudComptng.pptx`, 28 of the deck's
  31 diagrams are `PlaceholderPicture` (`shape_type` 14, not 13) because the deck was
  built from a template. Testing for `Picture` alone produced **three** images from that
  deck; testing for "has an image" produces thirty-seven.
* A **PDF's** embedded images are not whole diagrams. `REST_SOAP_webservices_Lecture.pdf`
  has 204 image objects across 15 pages — about fourteen per page — because a diagram
  exported from a drawing tool arrives as sliced bitmap fragments. The page is rendered
  instead, at 150 DPI where its smallest label still reads.

Filters keep bullet glyphs, logos and rules out (231 kept of 294 candidates), duplicates
are hashed away, and each image is WebP.

On the page a slide image is the *same object* as an SVG figure — same frame, same 560px
reading cap, same full-screen viewer — with `padding: 0` because a screenshot already has
its own margin. Its size floor comes from the `width`/`height` attributes written into the
markup, **not** from `naturalWidth`: these are `loading=lazy` images, so an off-screen one
reports no width at all, and reading it that way left every slide with no floor, rendering
at column width with no way to open it — on a phone, which is the reader the floor is for.

### Where each figure went, and how that is checked

Every figure sits **inline, under the paragraph whose note explains it**, not in a
section at the end of the unit. `tools/place_dcc_figures.py` decides the section by
two passes: the slide's own words against each section's note pick the **unit** and
the **section** (with the deck's slide order as a monotonicity constraint, so a
deck is not shuffled), then the same words pick the **paragraph** inside it.

That method is right about most of the 231 and has one blind spot it cannot see:
a slide whose text lives entirely *inside* its picture, or whose scan OCRs to noise,
has nothing to match on and gets placed by its position in its own deck. So the
score is reported split, and the split is the point:

```
slides placed here but the note does not discuss them: 9
        (4 of them a figure with under 25 words of its own, placed by its deck position)
sections the note contradicts (figure has text of its own): 5
```

All nine were then read by hand. Six were genuinely misfiled and are now corrected
by hand in `tools/dcc_figure_pins.json`, which re-applies on every run and fails
loudly if a pin would no longer land:

* **ch3 slide 34** (`Example: Lamport's Algorithm`) sat in 3.1 Clock Synchronization; it is
  inside the deck's Lamport run, so it went to **3.2.2**.
* **ch3 slide 45** (`Vector Clock: Example`) also sat in 3.1, between the vector-clock slides
  that are in 3.2.4; it went to **3.2.4**. Its picture OCRs to the single word "Time".
* **ch3 slide 57** (the Ricart–Agrawala worked example, whose only text frame is
  "Example:") sat in the unit intro; it went to **3.3.4**, with a caption written for it.
* **ch2 slide 33** (the send/copy/receive diagram) sat under 2.3.5; slides 32, 33 and 34 are
  one run describing the message-passing model, so it went to **2.3.2**.
* **ch2 slide 36** (`Basic MPI Sending and Receiving Messages`) sat alone in 2.4.1 Sockets,
  between the sockets slides 44 and 45, while slides 37–39 are in 2.3.4; it went to **2.3.4**.
* **ch1 slide 2** (the deck's title collage) sat under "The three characteristics the
  definition implies"; it is the unit's opening slide and went to **1.1** itself, the section
  before 1.1's sub-sections.

The five that remain are correct where they are, and the score is low because the
words are inside the pictures (the RPC, RMI and reference-note slides all annotate
labels in the image). They are 2.3.7 (whose section is *about* the reference note
those pages come from), 2.1.1 (the deck's own "How modern RPC works?" diagram and a
stub/MQ interface page), 2.2 RMI (the RMI architecture slide), 1.1 (the definition
slide and the tile) and 1.4.3 Multitier (the three-tier application slide). The
remaining low scores in ch5 and ch7 are single tiles with 11–20 words of their own,
which the audit now labels `unreadable` rather than counting as a misfiling.

Re-run it with `python tools/audit_dcc_teaching.py --list-thin 12`, which prints
each flagged section with its score, its slide count and the slide-words figure
that separates the two causes.
