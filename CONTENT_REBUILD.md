# Content rebuild — the syllabus is the scope

**Started 2026-09-15.** This file is the tracker for rebuilding the study portals
so that what is taught is what the paper asks for — no padding, nothing missing,
and no page the teacher marked as off-syllabus. It is the companion to `plan.md`
(which owns design, architecture and the past-question data model); **this file
owns scope**.

Rule for this rebuild, and the reason it can be checked rather than argued about:

> **A topic is on the site because the syllabus names it.** Not because a slide
> had a nice diagram, not because a book chapter covered it. `data/syllabus.json`
> is generated from the official syllabus by `tools/extract_syllabus.py`, and it
> is the only authority in this file.

---

## 0. What the user asked for (2026-09-15)

| # | Ask | Where it lands |
| :- | :--- | :--- |
| A1 | "the content is bad … current sucks so much" | §2, §4 — a rewrite pass with the syllabus as the filter |
| A2 | "the teacher put a mark in [the] pdf [on] pages not related to syllabus, which I don't need" | §1.3 — **needs the user's page numbers**, see §5 Q3 |
| A3 | "make me a website based on my syllabus" | §1 — `data/syllabus.json` now exists and is exact |
| A4 | "in learn page put [the notes]; past question in past question section" | §3 — the Learn/Past split is enforced, not fashionable |
| A5 | "efficient manner, keep track of everything, create files, full permissions" | this file, §4's iteration table, and the tooling in §1.2 |

### 0.1 What the user asked for (2026-09-16)

| # | Ask | Where it lands |
| :- | :--- | :--- |
| A6 | "u dont put slide images in there … images put only wehere needed dont just dump images everywhere … put diagram where figures is needed not everywhere" | §4f — 197 of the 201 inline screenshots moved to the Reference tab, 4 kept where a sentence points at one |
| A7 | "why is page 2 · GFS_HDFS_Lecture.pdf needed" | §4f — captions say what a picture shows or there is none; one source line per group instead of a file name per picture |
| A8 | "cant u extract content from on … overall chapters content … no structure" | §4f — the pictures were the second copy of prose that already carried the extracted content; the notes are now 22 pictures in total across 9 units instead of 201 |

## 1. Scope: what is examinable

### 1.1 The two syllabi, and where they come from

| Course | Source | Shape |
| :--- | :--- | :--- |
| **BCE7024** Distributed & Cloud Computing | `_source/dcc/syllabus_distbd_cloudcomptng.txt` — OCR of `syllabus_Distbd_CloudComptng.pdf` (5-page scan, in `Downloads/OneDrive_1_22-08-2026/`) | 9 units · 34 sub-topics · marks 6,10,6,6,6,8,6,8,4 = **60** · 45 scheduled hours · the teacher's **Model Question 2025 (16 questions)** on pages 4–5 |
| **BCE7026** Simulation and Modeling | pages 12–14 of `7BE-Computer-First-semester-Course-Structure-Syllabus-with-Electives.pdf` (university-wide, outside the repo) | 8 units · 55 sub-topics · hours 6,4,5,5,5,8,5,7 = 45 |

### 1.2 The tool that makes it checkable

```bash
python tools/extract_syllabus.py            # writes data/syllabus.json
python tools/extract_syllabus.py --show     # print the parse, write nothing
python tools/extract_syllabus.py --check    # fail if the file is stale
python tools/extract_syllabus.py --dcc-only # skip Simulation (its PDF is not in the repo)
```

It repairs the scan's own damage (`nit 5` → unit 5, `I .2` → 1.2, `I I.` → 11.)
and **checks its own work**: 9 units, 34 sub-topics, marks summing to the printed
60, hours to 45, 16 paper questions. A bad OCR read fails there, not on a page.
Where a number could not be read at all, the topic is marked `"inferred"` in the
JSON with the reason, so nothing is silently invented. Current state:

```
DCC units parsed: 9            DCC sub-topics parsed: 34
DCC marks: [6,10,6,6,6,8,6,8,4] = 60        DCC hours: [4,7,5,5,4,6,4,6,4] = 45
DCC model-question lines found: 16
Sim units parsed: 8            Sim sub-topics parsed: 55
```

### 1.3b The "i" sign — FOUND, and it does not mean what it looks like

The user's description ("in pdf or pptx there is i sign somewhere in pages with non
imp things") is right about the *sign* and, on the evidence, wrong about the
*meaning*. The sign is PowerPoint's standard **Information icon** — a circled
lowercase i — and it is machine-readable after all: the SVG in each deck carries
its own id, `Icons_Information`, which is what `tools/dcc_marks.py` searches for
by CONTENT rather than by filename.

It found **28 marked slides**: 22 in `Ch_3_Sync_and_Cordn.pptx`, 6 in
`Chapter4_lecture_notes_all.pptx`, none in Ch1, Ch2, Ch5 (`.ppt`, unreadable),
Ch6, Ch8 or the reference decks. Ten of the 28 are slides the site actually shows,
and here is what those ten are *about*:

| Marked slide | Section that shows it | Slide's own text |
| :--- | :--- | :--- |
| Ch3 s48 | `3.2.5 Causal ordering of messages using vector clocks` | "Causal Ordering of Messages using Vector Clock" |
| Ch3 s5 | `3.0.1 How a computer timer actually works` | "Drift Rate … different clocks … need synchronising" |
| Ch3 s68, s69 | `3.4.1 Basic concepts` | "Election Algorithm: Basic Concepts (1)/(2)" |
| Ch3 s76, s77, s78, s84 | `3.4.2 The Bully algorithm` | "Bully Algorithm: Detailed Algorithm" |
| Ch3 s8 | `3.0.2 What unsynchronized clocks break` | "when each machine has its own clock, an event that occurred after another may be assigned an earlier time" |
| Ch4 s35 | `4.3.2 CORBA` | — |

**Every one of those is examinable.** Vector clocks are syllabus 3.2; drift rate
is 3.1's problem statement; election algorithms — Bully, explicitly — are 3.4, and
the teacher's own Model Question 2025 asks "Describe in detail the working and
applications of the Bully election algorithm" as a **Group C long question**. Four
of the marked slides sit inside the Bully section.

So treating the icon as "delete this page" would delete, among other things, a
question the paper asks. The icon reads as a layout/emphasis marker on the
speaker's own template, not as a scope instruction — at least in this deck.

**What that changes, and what it does not.** Nothing is deleted on the strength of
this icon, and the icon is not used to decide scope. The syllabus decides scope
(§1.1). The mark list is still committed as `data/off_syllabus_slides.json`,
because it is a fact about the material and because it is the only measurement
anyone has of which slides carry a special sign.

**Settled by the user (2026-09-15):** the sign is for **reference / extra content**,
and they asked for a section of its own and for the notes to read without it. That
reconciles both readings: the sign is `i` for *information* (their description was
right), it is not a "delete this" instruction, and because four of the marked slides
are examinable the picture moves to the Reference tab while the section stays in the
notes (§4e, R2d). Nothing is deleted on the strength of the icon, and the icon still
does not decide scope — the syllabus does (§1.1). The mark list lives on as
`data/off_syllabus_slides.json`, which is now what the Reference tab is built from.

### 1.3 The teacher's marks — what I found, and what I cannot see

The user says the PDF has pages marked as not-in-syllabus. **Those marks are not
machine-readable, and I checked properly before saying so:**

| Document | Annotations found | Verdict |
| :--- | :--- | :--- |
| `syllabus_Distbd_CloudComptng.pdf` | 0 | the marking, if any, is ink on a scan |
| DCC chapter decks (`.pptx`/`.pdf`) + ref notes | only 1 `/FreeText` ("Web Services") | no page-level marks |
| All 4 recommended books | 3640+ links, 1 unrelated sticky note | none |
| Simulation handwritten notes (n1 53p, n2 58p) | `/Link` only, 0 text marks | no typed marks |
| Teacher question banks + 2025 paper | 0 | none |
| `Simulation Modeling old Questions-ocr.pdf` | 20 `/Link` | none |

So one of these is true and only the user can say which:

* the marks are **handwritten on a scan** — I cannot see images, so I need the page
  numbers (or the pages pasted into chat, which I *can* read);
* the "mark" is **the syllabus's own numbering** — i.e. the topics printed on the
  syllabus are the scope and anything else in the notes is not (this needs no file
  from the user: §1.1 is the answer);
* the marked document is **not in these folders** — point me at it and I will
  extract it the same way.

**Until that is settled, nothing is deleted.** Material that is not named by the
syllabus gets *flagged* (§2), not removed, because plan.md §0.2 forbids silent
removal and because guessing here costs a reader marks.

## 2. The filter, once §1.3 is settled

**Step 2.1 — the map.** For every syllabus sub-topic (34 DCC / 55 Sim), which page
of which source teaches it, and which note section on the site does. Output:
`data/syllabus_map.json`, built by a tool, so it is a table a reader could check by
hand. Any sub-topic with no section is a **gap** — those get written.

**Step 2.2 — the flag.** Note sections that teach something the syllabus does *not*
name get `off-syllabus: true` and are shown in a collapsed "beyond the syllabus"
block at the end of their unit, not deleted and not silently kept. This is the
honest reading of A2: the user does not want to study them, they did not ask me to
lose them.

**Step 2.3 — the cut.** Only if the user says "delete them" do they go, and then
`data/syllabus_map.json` records what was removed and why.

## 3. Learn vs Past Questions

A4 is a structural rule: **Learn teaches, Past Questions asks.** Concretely:

* Learn: definitions, worked examples, comparisons, the callouts. No question
  cards, no year tags, no marks badges.
* Past Questions: every question, with its year, marks and model answer — which
  for DCC is the teacher's 16-question Model Question 2025 (§1.1) plus whatever
  the old site recorded, and for Simulation is the existing 92-card set.
* A question that is currently *only* inside a Learn section moves to Past
  Questions and gets a one-line pointer from Learn where it was being used as an
  example.

Measured today: **the Learn content of both portals already contains 0 question
cards** (`<h2>… past question`, marks badges, `class="pq-"` all 0), so this rule is
about *keeping* them apart as content is rewritten, and about moving the
"solved example taken from a past paper" material into a Past-Questions card where
it belongs.

## 4. Iterations — status

| # | Iteration | Output | Status |
| :- | :--- | :--- | :--- |
| **R0** | Recon: syllabi, sources, marks, current content counts | this file | **done 2026-09-15** |
| **R1** | Syllabus extraction, self-checked, with provenance | `data/syllabus.json` + `tools/extract_syllabus.py` | **done 2026-09-15** |
| **R2** | The scope decision: which portal, and what "bad" means | **answered 2026-09-15**: **DCC**; bad = questions mixed into Learn + missing/wrong facts + too long and padded | **done** |
| **R2b** | The teacher's sign | **answered by measurement 2026-09-15**: the sign is the Information icon, it sits on examinable slides, so it decides nothing — §1.3b | **done** |
| **R2c** | Show the sign instead of obeying it | chip on each marked figure — **superseded by R2d** | **superseded 2026-09-15** |
| **R2d** | The sign means *reference*: move that material to its own tab | **done 2026-09-15**: `tools/make_reference.py` moves the 10 marked figures out of `learn` into a chapter `reference` field, `modules/reference.js` draws the **Reference** tab, and the chips are gone — §4e | **done** |
| **R2e** | The notes open on the subject, not on the paper | **done 2026-09-15**: `tools/strip_exam_preamble.py` removes the "what this unit is worth in the exam" box and the "read the unit in this order" paragraph — 14 blocks in 9 chapters, every named question already a Past card | **done** |
| **R3** | The map: the 34 DCC sub-topics → the section that teaches each | `data/syllabus_map.json` + `tools/syllabus_map.py` | **done 2026-09-15** |
| **R4a** | Fold the four syllabus-less sections of Chapter 1 into the ones the syllabus names | `tools/fold_orphans.py`, 0 orphans | **done 2026-09-15** |
| **R4b** | Fill the thinnest sections (1.1, 1.3, 6.3, 8.2) and cut padding | rewritten sections | **next** |
| **R5** | Questions out of Learn, into Past Questions (A4) | `pastSummary` + the Past tab renders it | **done 2026-09-15 for the exam-facing blocks; see §4c for what is left** |
| **R6** | Enforce the Learn/Past split (A4) | moved cards, pointers left behind | not started |
| **R7** | Gate it: the map must cover 100% of sub-topics, and the site must not teach an unflagged off-syllabus topic | map + orphans + exam-material + preamble + reference checks are in `tools/run_checks.py`; the off-syllabus-topic check is not | **partly done** |
| **R8** | Rebuild, verify rendered, redeploy both sites | new bundle + live links | not started |
| **R9** | The pictures out of the reading flow: the notes paste 201 slide screenshots inline, most captioned with the section heading echoed back | `tools/slim_dcc_figures.py` + a `slides` field + the Reference tab draws it | **done 2026-09-16** — §4f |
| **R10** | The tab the pictures moved to is a wall: 153 of the 217 carry no text at all, every one of those named `Illustration for 4.3.4 …` in its `alt`, and the group headings are copies of note sections that do not link back to them | `tools/ref_slide_notes.py` + `tools/dcc_slide_notes.json` + a link on each group heading | **in progress** — mechanism done, **4 of 217** lines written — §4g |
| **R11** | The wording: 112 sentences of the notes are about the deck, the paper or the exam instead of about the subject (`Those three requirements are the vocabulary to answer an RMI question with`) | `tools/voice_curate_ch*.json` + `voice_rewrite.py --curate/--apply` | **done 2026-09-16, 112 → 0** — §4h |
| **R12** | The shape: the Simulation site answers a heading in ~60 words so the answer is the first thing met; a DCC section is ~240 words of continuous prose, so it has to be found — *"current one is so bad for exam to read cant we change it?"* | `tools/revise_blocks.py` + `data/dcc_revise.json` + a `revise` field + the Revise-mode switch | **in progress** — mechanism done, **Unit 2 written (29 of 171 sections)** — §4i |
| **R14** | The look: the reader linked an earlier DCC portal and asked for its style — *"style is so good cant we adopt like this way just change content acc to note"* | `assets/css/tokens.css` light/dark + the print mirror, `foundation.css` (h3/h4/code), the two entry pages' boot maps, `app.js` registry | **done 2026-09-16** — §4k |
| **R13** | The rest of the yap: the notes still pointed at other units, addressed the reader, commented on their own sections and counted off what they were about to say — *"just teach the topic dont yap"*, *"the four sub-topics are stages of one argument … The reading order is the order to work through"* | seven more tells in `tools/voice_audit.py` + 108 curated edits | **done 2026-09-16, 108 → 0** — §4j |
| **R15** | The last piece of R14's look: that page is Inter throughout, this one set every heading in the Newsreader serif | a `--font-head` token + 13 rules moved to it, in `tokens.css`, `foundation.css` and the two entry pages' inline shell CSS | **done 2026-09-16** — §4l |

Each iteration ends by (a) updating this table, (b) running
`python tools/run_checks.py --all` (**32 steps** today, green in ~14 s — step 6 is the
map's own `--check`, step 13 is R9's, step 20 is R12's), (c) appending one line to §6.

### 4k. What R14 did — the reader's own reference page, adopted (2026-09-16)

**The ask.** The reader linked `WSOP-daily-bliz-main/dcc-website/index.html` — an
earlier generation of this portal — and said *"style is so good cant we adopt like
this way just change content acc to note no yapping ntg only req"*. Asked which half
they meant, they chose **the look only, as the new default**, with **that page's
cool blue + emerald** palette.

**What that page is.** A gamified tab shell over a Tailwind-ish palette: white cards
on `#f0f4f8`, `#2563eb` accent, `#059669` emerald, `#d97706` amber, Inter and
JetBrains Mono, a 12 px card radius, `h3` in the accent, `h4` in uppercase emerald,
`em` in the accent, `code` as a tinted chip, striped tables with a tinted uppercase
head, 32-boxed callouts with a 4 px left border, XP bar, streak, confetti.

**What was adopted.** The palette, and the three type treatments that go with it —
because the site already routes *every* colour through `tokens.css`, this is a change
of values in the light and dark blocks (plus the print mirror, which
`check_themes.py` requires to be the light block verbatim with a white page), the
global radius (8/5 px → 12/8 px), and three rules in `foundation.css`:
`h3` → `--pri-l`, the `h4` label → `--sec-l`, `code` → the `--pri-*` tint trio. The
mode ids stay `light` and `dark`, so a stored choice survives; the names became
**Daylight** and **Midnight**, since "Paper" and "Lamp" no longer describe a cool
blue desk. Nothing structural came over: the notes bar, tabs, Reference tab, Revise
mode and the theme picker are unchanged, and the reading measure and type scale stay
this site's own — the reference is 14.5 px in an 860 px column, which is the opposite
of what R12 measured.

**Three of the reference's colours could not be used as they stand.** `check_themes.py`
re-derives ~20 pairs per mode and fails below AA, and the reference violates three of
them: white on `#059669` is 3.35:1 and on `#d97706` 3.41:1 (both below AA for the
small type those fills carry), and `#94a3b8` metadata on `#f0f4f8` is 2.6:1. So the
fills are the 600/700 steps (`#047857` — 4.83:1 — and `#b45309` — 4.90:1), metadata
is `#5b6a80` (4.85:1), and the hairline is `#d8e0ea` because `#e2e8f0` against that
page measured 1.10:1. All nine modes pass, including the six untouched ones and the
derived one, and the print palette matches token for token.

**Gate.** 29 of 32 steps green, the same three known gaps. The generated artifacts
that had to move with it: `dist-dcc/theme-sheet.html` and `dist/theme-sheet.html`
(step 19 fails if they are older than the tokens), and both bundles.

**The lesson worth keeping** is in `run.md` §4a: a rebuilt `site.css` did not reach
the preview webview even after the document was re-loaded with a cache-busting query
— the new palette only appeared once the bundle was served from a *second port*, i.e.
a new origin with an empty cache.

### 4l. What R15 did — the heading face, and the serif that stopped being used (2026-09-16)

**The ask.** R14 adopted the look of the earlier portal the reader linked, with one
piece left out and named at the end of that pass: ours was **Inter for body and UI but
Newsreader for every heading**, and that page is Inter throughout. The request here was
to close exactly that gap and nothing else — *"headings use Inter … keeping the body
type as it is"*.

**How far it reached.** The serif was in **13 rules**, in three places, which is why
counting rendered elements was the only reliable way to find them: a headless pass over
the live page looking for `getComputedStyle(el).fontFamily` matching Newsreader returned
13 nodes, and every one of them was a heading, a brand mark or a display figure — no
body prose. In `foundation.css`: the section head (`h2`, the one everybody actually
sees), `.worked-head h4/strong`, `.quiz-header h3`, `.quiz-result .result-msg`,
`#panel-past > h3`, `.an-card .v`, `.an-sec h3` (which is what made the 12 px
`.pq-count` metadata serif, by inheritance), `.strategy-box h3`,
`.exam-head > div > div:first-child` and `.exam-result .big`. In the two entry pages'
inline shell CSS, which is not in a stylesheet at all: `.monogram`, `.brand-t strong`
and `.ch-ti` (the sidebar's chapter title).

**What was done.** A new token rather than a substitution: `--font-head`, which
currently resolves to the same stack as `--font-sans`. Headings are the one role worth
being able to change on their own, and naming them means the next type decision is one
line in `tokens.css` instead of a sweep of the sheets. Every one of the 13 rules now
asks for `--font-head`, and **the body is untouched** — no size, weight, measure,
colour or spacing changed anywhere, so nothing about the reading experience R11–R13
measured moved. `--font-serif` is left defined, and Newsreader's `@font-face` rules with
it: an unmatched `@font-face` downloads nothing, so the cost of keeping a one-line
revert available is zero bytes at runtime.

**What it looks like now.** Ranking comes from size, weight and colour only — the
section head is 21 px ink at 600 with a rule under it, `h3` is the accent, the `h4`
label is the uppercase emerald, and the paragraph beneath them is the same face at
16.5 px. It is a working document rather than a magazine, which is what the reference
page is and what R12 found this reader wants to revise from.

**Verified, not assumed.** Both bundles and both theme sheets rebuilt; `check_themes.py`
unchanged and green (all 9 modes hold AA, the print mirror still matches the light block
token for token — a face change cannot move a contrast ratio, but the check is what says
so); `run_checks.py --all` 29 of 32 with the same three known gaps. In the running
preview, after clearing the offline cache and loading with a new query: **0 elements
compute to Newsreader**, and every heading, plus the brand mark and the sidebar chapter
title, computes to Inter. Checked on the Learn and Past tabs.

**One consequence worth stating plainly.** `foundation.css` and `tokens.css` are the
**shared** design layer, so this changes the Simulation site's headings too — by design,
since sharing one layer is the point of it, but it is a change the reader did not ask
for and should know about. The root site's own bundle was rebuilt to match.

### 4j. What R13 did — the rest of the yap, and the one it was still announcing (2026-09-16)

**The ask, twice.** First *"you are one heck of a motherfucker i said so much cant you see
the entire website there is lot of place like ai written lik unit 1 established that
component and many more yaps broo just teach the topic dont yap there is lot of yapping
throughout the site"*; then, with Unit 3's opener pasted in as the example, *"sounds time
waste"*.

**The measurement.** R11 left six tells at zero and the reader still had examples, which
is the whole point: the six patterns answer *who is talking about what*, and the sentences
left were shaped differently. `tools/voice_audit.py` now carries **twelve**: R11's six,
then `crossref` (points at another unit instead of teaching this one), `reader` (addresses
the reader), `meta` (comments on the section or the reading order), `editorial` (rates the
material) and `recount` (counts off or rates what follows — the family the Unit 3 quote
names). Counts before the pass, over the `learn` field: **ch6 17, ch7 27, ch8 23,
ch9 32** for the pointer/reader/meta/editorial families and **9** for `recount`
(ch3 2, ch4 1, ch6 1, ch8 3, ch9 2). All twelve read **0** now.

**What the pattern was.** Each family has one move:

* **A cross-unit pointer is deleted and the fact kept.** `every cloud service is an API
  (Unit 7.3.4)` → `every cloud service is an API`; `Unit 6.1.2 defined storage
  virtualization as aggregating physical storage …` → `Storage virtualization is
  aggregating physical storage …`. Unit 7 had a whole closing section organised by what
  each *other* unit needed from its platform names — `Unit 5 (IaaS versus PaaS): IaaS is
  EC2, PaaS is Google App Engine or Windows Azure` — and it now reads `IaaS is EC2; PaaS
  is Google App Engine or Windows Azure` under the heading **The concrete names for each
  topic**. Not one platform name was lost; the address book around them went.
* **Second person becomes the subject.** `You cannot destroy what you cannot locate` →
  `What cannot be located cannot be destroyed`; `what happens when you don't get it` →
  `what happens when the service fails`.
* **A recount or meta lead-in is deleted**, and where the paragraph around it was advice
  about answering, the fact inside it is stated instead: ch8's *"Two habits hold the
  section together. First, attach a concrete mechanism to every named risk … Second,
  reach back into the earlier units …"* became **"What makes cloud security specific:
  the hypervisor is an attack surface, storage virtualisation is multi-tenancy, and the
  provider's promise is an SLA."**
* **Unit 3's opener is the family's clearest case**: `The four sub-topics are stages of one
  argument rather than four separate topics.` is gone, `The reading order is the order to
  work through: …` is gone, and `Every algorithm here answers to the four requirements in
  3.3.2 — … — and those four are what turn a list of algorithms into a comparison.` is now
  `Every algorithm here answers to the same four requirements — safety, liveness, fairness
  and, for mutual exclusion, the number of messages.`

**Two records had to be moved forward, and the reason is worth keeping.** When a later
pass rewrites the words an earlier one installed, `--check` excuses the earlier entry only
if it can see the chain, and it sees it when one span contains the other. Two cases did not
nest: ch8's `top-of-list challenges` entry (its `find` ran past the end of the earlier
entry's `to`, so the tool read a deliberate rewrite as a revert) and the two `prose` fixes
in `tools/dcc_figure_keepers.json`, whose sentences ch2's pass rewrote wholesale. Both were
fixed by moving the record to the wording now on the page — and the keepers' second fix now
says in the file why the Reference-tab pointer it installed is gone (the tab links back to
its own sections, so the notes do not also narrate a reading order).

**One block retired, with its heading.** Unit 2's intro had a `<h2>Where this unit sits</h2>`
whose paragraph said what the heading announced; the heading was cut by the earlier pass and
the paragraph kept, which left the revise block keyed `where-this-unit-sits` hanging on a
heading that no longer exists. The block went with it — the intro's own key box already
carries the same four mechanisms, and Revise mode keeps key boxes visible — so Unit 2 now
reads **29 blocks over 29 sections**.

**Why the reader saw the old text.** They were quoting a stale bundle. The words they
pasted (`Two points about this unit matter`, `Worked examples matter more here than
anywhere else in the course`) had already been cut from `dcc-site/ch3.js` in the first
round; only the built copy still had them. Both bundles are rebuilt here
(`dist-dcc/site.js` 996 KB, `dist/site.js` 692 KB), so the page and the files agree.

### 4i. What R12 is doing — the notes have to be revisable, not just readable (2026-09-16)

**The ask.** "isnt simulation website teaching content reqr directly upto point best
for exam but current one is so bad for exam to read cant we change it?"

**The measurement.** Not a hunch. The same section splitter the new tool uses, unit
titles excluded, over both sites' `learn` fields:

| | Simulation (root) | DCC |
| :--- | ---: | ---: |
| Sections | 125 | 194 |
| Median words per section | **57** | **252** |
| Mean words per section | 127 | 266 |
| Sections over 200 words | 23 | **128** |
| Longest single paragraph | 90 words | **216 words** |
| Words of notes in total | 16,388 | 53,434 |

(An earlier pass put the DCC figures at 136/203 sections, 236 median and a 453-word
longest paragraph. Those counted a different way — unit titles in, paragraphs and
list items concatenated — and the 453 in particular was a block of text that is not
a paragraph at all. The table above is reproducible: it is `plain()` over the
`<h2>`/`<h3>` split that `tools/revise_blocks.py` already implements, so a future
check can reproduce it rather than trust it.)

The look is not the difference: both sites link the same `tokens.css`, the same
`foundation.css` and the same app shell. It is the shape of the writing. The
Simulation notes answer a heading with a definition, then a **Key Formula** box, then
the bullets — about 60 words, so the answer is the first thing met. A DCC section is
240 words of continuous prose, so the answer is inside it somewhere.

**The change.** One short **revise block** above every section: the answer in a
sentence, then the terms and numbers as bullets, capped at 90 words (mean 70). The
prose below it is not touched — not shortened, not rewritten, not moved — so this
pass cannot lose a fact, which is why it is the pass being done instead of a rewrite
down to Simulation density. Rewriting 52,000 words to a third of their length is how
errors get in, and the long descriptive questions are answered from that material.

* `data/dcc_revise.json` holds the blocks, keyed by the section's number or, where a
  heading has none, by its text as a slug — written by hand, one unit at a time.
* `tools/revise_blocks.py` writes them into the chapter as one `revise:` field
  (`--apply`), removes it again byte-exactly (`--restore`), and proves that with
  `--roundtrip` on the real files. The inverse needs no journal: the field is one
  physical line, so `--restore` recomputes it rather than trusting a recorded file —
  a journal is what a second `--apply` destroyed in R9.
* `engine.js`'s `injectRevise` puts each block after its heading; the key rule lives
  there too and is pinned by four contracts in `tools/test_engine.js`, so the two
  languages cannot drift and leave a block matching nothing (which would be silent).
* The guard (`--check`, gate step 20) fails on a section with no block, a block over
  the cap, an unbalanced tag, a block that talks about the deck or the exam, and — the
  point of it — a block whose **bolded term** is not a term its section uses or whose
  **quoted number** is not in it. A block may compress its section; it may not add to
  it. `--strict` is the count still to write, held as a known gap and placed *after*
  this step so a real defect cannot hide inside it.
* **Revise mode** is the switch in the notes bar: it hides a section's explanatory
  paragraphs and keeps the blocks, lists, tables, callouts and figures. On Unit 2 the
  visible section prose goes from 58 paragraphs to none while all 30 blocks stay. It
  is one class on `<body>` (rules in `foundation.css` §22), it appears only where a
  chapter has blocks, and it prints complete — a printed chapter is read away from
  the switch.

**Not done, and named.** 141 sections in units 1 and 3–9 still need blocks (194
headings, minus the 23 that are containers holding only sub-headings, minus Unit 2's
30). The mechanism, the guard and the switch are finished and proven; the writing is
the work remaining, and it is reported as a count rather than pretended.

**Rejected.** Deriving the blocks from the notes. Scoring each of a section's
sentences against the heading was measured over all 203 sections and produced
headings glued to their opening sentence — the same filler, arrived at by machine,
that R10 rejected for the Reference tab's pictures.

### 4f. What R9 did (2026-09-16) — the pictures out of the reading flow

**The ask.** "Texts are thrown at it ntg else … u dont put slide images in there …
images put only wehere needed dont just dump images everywhere … why is page 2 ·
GFS_HDFS_Lecture.pdf needed tf cant u extract content from on … no student wants to
see current website."

**The measurement, and it agreed with the reader.** The prose is a real study guide —
50,626 words in 182 sections, median 249 words, longest paragraph 216. The pictures
were the problem: **201 of the teacher's slide screenshots were pasted inline in
`learn` across 8 units**, one per ~250 words (Unit 2 had 56, Unit 4 had 43, Unit 6
had 39); **157 of the 201 captions read `Figure for <section heading>`** — the machine's
fallback, which says nothing about the picture; 64 of them sat in runs of three or more
back to back; every unit ended with a `fig-src-note` line naming its source decks; and
Unit 4 and Unit 7 still carried an "Extra pages … not on the syllabus" dump of raw page
images on the **Past** tab. Every fact in those screenshots was already in the prose —
that is what the prose was written from — so each one was a second copy of the paragraph
above it, captioned with the heading above that.

**The decision (the reader's, 2026-09-16).** Screenshots move to the **Reference tab**,
grouped by the note section they belong to; the notes keep diagrams only, plus the very
few pictures a sentence actually points at. Nothing is deleted, and it is one flag to
revert.

**What moved, and what stayed.**

| | |
| :--- | :--- |
| moved | **197 of 201** pictures, into each chapter's new `slides` field |
| stayed in `learn` | **4** — §2.2.1, §2.4.5, §3.1.3 (NTP), §6.1.8 — each named by a sentence in its own section (`tools/dcc_figure_keepers.json`) |
| the diagrams | the 20 hand-built SVG figures, untouched: `--check` never looks at an `<svg>` |
| offline reading | unit 9 had none to move; units 1 and 5 keep none at all |
| the extras | the two off-syllabus dumps moved whole, heading and explanation included, off the Past tab |
| the source lines | the 7 `fig-src-note` paragraphs are gone; each Reference group names its deck and slides **once** |

**The captions.** A caption says what the picture shows, or there is none — never the
section heading and never a file name. That rule now lives in **`tools/figcaptions.py`**,
imported by both this tool and `tools/make_reference.py`, because the Reader's own
example ("page 2 · GFS_HDFS_Lecture.pdf") was a caption on the Reference tab: those 10
marked figures had been moved before `fix_captions.py` ran, so they never got cleaned.
A caption that already says something is **kept** — `tools/voice_rewrite.py`'s catalogue
carries hand-written replacements for some of them, and regenerating from the extraction
would undo that work (it did, on the first run, and the gate caught it).

**Three sentences had to move with the pictures.** §2.3.7 and §2.4.1 promised the reader
their figures "below" in a stated order; with the pictures gone the sentences are
re-pointed at the Reference tab, and both `voice_rewrites.json` entries were updated so
the catalogue stays in force. `voice_rewrite.py --check` now looks for an applied
replacement across `learn`, `reference` and `slides` rather than only `learn`, because a
caption travels with its picture when the picture is filed on another panel — the
chapter's data arrays are deliberately excluded, since a quiz question is not prose a
rewrite was written against.

**Two incidents, both caught by checks that already existed.**

* The first `--restore` put 7 of the 9 chapters back wrong. The recorded position of an
  operation is a position in the *original* text, and the worked-on position has to
  subtract what was taken out ahead of it **and add back what was put in**: for a pure
  cut the second term is zero, so the formula was accidentally right and the error only
  appeared on a block rewritten in place — where it lands the text tens of characters
  away, inside the next paragraph. It was found by hashing all nine chapters before the
  run and comparing after, not by reading the code; the fix is in `edit_field`, and the
  double-restore case now raises instead of guessing.
* The off-syllabus dump was cut twice, once as a block and once figure by figure, which
  is text that cannot add up. Found by the same hash round trip; the block is located
  first and its own span is skipped.

**Where it can be checked.** `slim_dcc_figures.py --check` is gate step 13: a picture
that no sentence points at may not be in the notes, no caption may name a file, the
`fig-src-note` lines and the off-syllabus dumps may not come back, and nothing may leave
the notes without arriving on the Reference tab. `--report` prints the plan per unit. The
check does not consult anything the tool wrote: it takes all 231 pictures from
`assets/dcc-slides/FIGURES.json`, requires each to be on exactly one page, and requires
everything left in `learn` to be one of the four keepers.

**The undo is gone, deliberately.** `data/slim_figures.json` recorded every change as
`{field, index, cut, put}` and `--restore` inverted it. It belonged to one run, and the
text it held existed nowhere else: a later `--apply` over an already-applied unit found
nothing left to cut and overwrote each entry with an empty move, which would have made a
`--restore` delete 106 pictures without a word. The guards are now in the tool — `--apply`
refuses a unit that already has a `slides` field, and `--restore` refuses to remove a tab
holding pictures its journal cannot put back — and the spent journal has been removed
rather than left for a future `--restore` to act on. Nothing on the site depends on it:
every picture is still under `assets/dcc-slides`, and `place_dcc_figures.py` re-derives
the placement.

**Tool order, because it matters.** `place_dcc_figures.py` strips every `<!-- dcc-fig: -->`
block it can find and re-derives the placement, so running it after this tool puts all
201 pictures back. And `make_reference.py --restore` records positions in the notes
text as it was *before* its own move, so it can only be run before this one. The order
is: extract and place → `make_reference` → **`slim_dcc_figures`**.

### 4h. What R11 did (2026-09-16) — the wording

**The ask.** "a lot of useless wording in website this is example fix everything and
text dumbed create precise reqr text in website", with the example quoted back:
*"Those three requirements are the vocabulary to answer an RMI question with."*

**The measurement.** `tools/voice_audit.py` classifies every sentence of every chapter
into six tells — `deck`, `source`, `paper`, `advice`, `frame`, and `answer` (that last
one added for the reader's own example, which none of the other five matched). Two of
the six chapters had already been done. The rest measured **112 sentences**: ch6 29,
ch7 21, ch8 33, ch9 23, plus the 9 `answer` hits across ch1–ch7.

**What was done.** All 112 are now zero, and the audit's `--check` guard holds it.
Each edit is recorded as the sentence to change and the sentence to put in its place,
in `data/voice_curate*.json` — one file per chapter, resolved against the chapter file
by `voice_rewrite.py --curate` and applied by `--apply`. The pattern across all of them
is the same: the sentence's subject is dropped and its claim kept (`The deck's
conclusion: <claim>` → `So: <claim>`), and where the sentence was advice about the exam
rather than about the subject, it goes.

Things worth recording:

* **Two whole callouts were deleted**, both addressed to whoever maintains the site
  rather than to a reader — ch7's "About this unit's sources" and ch9's, each saying
  there is no lecture deck for that unit and how the page was assembled. A deletion may
  span markup, so each went in one piece as an exact entry.
* **Nine of Unit 7's sentences had provenance where their subject should have been**
  (`The course's reference deck records the model as a market`, `Unit 5's deck names`,
  `The Web Services deck states`). None of them was caught by the audit, whose patterns
  are deliberately narrow so that a subject sentence using the word *deck* is not
  flagged. They were found by reading the rendered pages, and fixed the same way — see
  the note on narrow patterns in `data/voice_curate_prose.json`.
* **25 `deck`/`slide` mentions remain in the notes, all of them in figure captions**
  saying which slides a hand-drawn SVG was built from (`Fig 3.3 — … following the
  deck's slide 75`). That is a caption's job and the notes' own checks read it, so it
  was left alone rather than chased to zero.
* **112 sentences is enough for the same passage to be curated twice.** A second pass
  over a sentence consumes the first pass's replacement, and `voice_rewrite.py --check`
  read that as "a rewritten passage has been reverted". It now follows the chain: an
  entry counts as in force if a later entry was written over the same words *and* that
  one is in force, so the chain still has to end in a replacement that is really in the
  file. A revert of the whole passage still fails, which was tested by hand.

**Four tool changes this pass needed**, each because the edit could not be expressed
any other way:

* `--curate` reads *every* `data/voice_curate*.json`, so a chapter's batch is its own
  file instead of one file nobody scrolls to the end of.
* An entry may be written out in full (`find`/`to` instead of `old`/`new`) for the
  edits prose cannot span: a deletion that has to take a callout box with it, and any
  replacement whose words straddle a `<b>`/`<code>`.
* An entry may say `"which": n` when its words occur more than once — a table header
  that is also the first words of the sentence under it is the case that forced it.
* `check` counts a duplicated `find` *within one field* rather than across `learn` +
  `reference` + `slides`: a section heading legitimately appears in two of them, and
  counting that as ambiguous flagged every entry that touched a heading.

### 4g. What R10 is doing — the Reference tab has to teach, not dump (2026-09-16)

**The complaint, in the reader's words:** "make the Reference tab teach instead of dump".
Measured, it is **two** problems, and only one of them is about text.

* **153 of the 217 pictures on the tab carry no text of their own** — no caption, and
  nothing in the `alt` but the section heading echoed back, in the one place a screen
  reader reads out loud: nine pictures in a row on Unit 2 are all named "Illustration for
  2.4.2 Why web services exist". Half the tab is a column of anonymous images.
* **The group headings do not lead anywhere.** They are copies of the note sections the
  pictures came out of; the reader's next question is "what does the note say about
  this", and there was no way to get there from the picture.

**What was tried and rejected.** Deriving the line from the notes: score each sentence of
'the section the picture was cut from' against the picture's own words and quote the best
one. Measured over all 217 pictures, that produces a line for **36** of them, and the
lines it produces are the section heading glued to the section's opening sentence
("4.3.4 Messaging middleware: MQTT and AMQP The third family in the syllabus is
message-oriented middleware"). That is the filler this pass exists to remove, arrived at
by machine instead of by hand. It was thrown away.

**What ships instead.** A reviewed catalogue, `tools/dcc_slide_notes.json`: one written
line per picture, read off the picture itself, applied to the `alt` and to a `.ref-why`
note under it by `tools/ref_slide_notes.py`. The tool is the same shape as the others
here — `--apply`, `--check`, `--restore`, byte-exact, `--roundtrip` proves it on the real
files before anything is written — and the check fails on a line that reads as filler
(names a file, says "the deck", starts with "Figure for"), on a line longer than a caption,
or on a line that has gone missing since it was written. **A picture nobody has read is
left in the catalogue's absence rather than filled with a sentence about it**: `--check`
reports the count, `--strict` is the completeness gate, and the runner holds that one as a
known gap, so the number can only move when the number moved.

**The link.** `modules/reference.js` now turns each group heading into a link back to the
note section it is named after, matched on the heading text with entities decoded (the
notes write `&mdash;`, the tab had a literal —, which is what made 11 of 79 headings look
renamed when nothing had been). Clicking it goes to Learn, unfolds the section if it is
folded, scrolls to the heading and flashes it — the same jump the search results use. A
heading whose section is gone stays text rather than becoming a link to nowhere, and a
heading that carries a section number is *required* to exist in the notes, so a renamed
section cannot quietly cost the reader the way back.

**Still to do: 213 lines.** The pictures have to be looked at, and looking needs the
preview webview (`preview_screenshot`) — when it is not compositing there is no way to
read an image, and writing a description of a picture nobody has seen is exactly the
failure this iteration is being measured against. Unit by unit, worst wall first:
ch2 50, ch4 48, ch6 38, ch7 24, ch3 20, ch5 13, ch8 12, ch1 8.

### 4e. What R2d and R2e did (2026-09-15)

**The sign means reference, so the material moved rather than being annotated.** The
reader settled the open question in §1.3b: the circled i is the teacher's sign for
reference/extra material, and the notes should read without it. So the figures that
came from a marked slide left the teaching text for a tab of their own:

| | |
| :--- | :--- |
| chapter | figures moved (all of them from marked slides) |
| ch3 | 9 — 3.0.1 (slide 5), 3.0.2 (8), 3.2.5 (48), 3.4.1 (68, 69), 3.4.2 Bully (76, 77, 78, 84) |
| ch4 | 1 — 4.3.2 CORBA (slide 35) |
| the notes | 33 figures in ch3 -> 24, 47 in ch4 -> 46; the sections themselves untouched |
| the tab | 5 groups, headed by the section each figure came out of, each naming its deck and slides |

This **supersedes R2c**, which had painted a chip onto each of those figures inside
the notes because the first reading of the icon was "the teacher is excluding this,
but the slides are examinable". Both halves of that are still true: the icon is on
examinable slides (four of them are the Bully algorithm, an 8-mark question on his
own paper). What changed is what to *do* about it — the section stays, the picture
moves, and nothing is deleted. `make_reference.py --check` fails if a chip returns.

**The exam pitch is gone from the notes.** Every unit opened with a box headed
*What this unit is worth in the exam* and a paragraph on the order to read the deck
in. Both are comments about the paper rather than the subject, and the box's content
is already on the page in the unit-meta line ("Syllabus: 4 hours · 6 marks ·
sub-topics 1.1–1.4"). Every question the box named was verified to exist as a Past
Questions card first — including the Lamport one, which took a second look because
ch3 stores that wording with double quotes — so the removal costs no exam material.
14 blocks across all 9 chapters; the notes now open on the unit heading.

One judgement kept deliberately: ch3's paragraph that begins *"The unit has a shape
worth knowing before you start…"* stays, because it is about the subject — that the
four sub-topics are stages of one argument, and why the study order is the reading
order. It is the same genre as what was removed but not the same content, and a rule
that cannot tell them apart would take the useful one too.

**Incident, and what it was caught by.** The first version of `make_reference.py`
recorded each figure's position in the *full* notes and put it back at that same
position in the text the figures had been cut from — so every block cut ahead of it
shifted it. Two of the four Bully figures landed in the middle of a paragraph
hundreds of characters further down the page, and re-running it would have moved
them again. It was caught by the byte-exactness round trip (restore -> `cmp` against
the pre-move copy), which is the only reason the tool has `--restore` at all. Two
rules came out of it: the position is adjusted by everything cut before it, and two
blocks that sit directly after one another go back last-first, because they resolve
to the same position. Both are in the gate's self-test input, and either one missing
makes the self-test fail.

### 4d. What R4a folded (2026-09-15)

Chapter 1 numbered four of its sections 1.5-1.8. The syllabus names 1.1-1.4 only, so
the site looked like it taught four topics the examiner never listed, and the map
reported them as orphans. The content was good; the numbering and the position were
wrong, and each block already said where it belonged:

| was | is now | because |
| :--- | :--- | :--- |
| 1.5 Advantages and Disadvantages | **1.1.3** | the characteristics of 1.1 seen from both sides |
| 1.6 Main Problems and Challenges | **1.2.1** | it opens "they map onto the four goals of 1.2" |
| 1.8 Resource Sharing and the Web | **1.2.2** + **1.3.1** | "resource sharing is goal 1 of 1.2"; the Web's own problems are an example, which is 1.3 |
| 1.7 Types of Distributed Systems | **1.4.5** | cluster/grid/cloud is the taxonomy of 1.4's models |

Nothing was rewritten or deleted: the four blocks moved under their parents, 1.6's
four challenge headings were demoted from h3 to h4 so they stay inside their new
parent, one cross-reference to "(1.8)" became "(1.3.1)", and the unit intro sentence
that named "1.5 to 1.8" was rewritten to name the folded subsections instead. That
is a delta of **+34 words in a 4 811-word chapter**, and the tool asserts the delta
is *exactly* what those two rewrites account for - so a lost paragraph cannot hide
behind a plausible number. It also asserts every block's body survives as a
substring, with heading levels and numbers erased so the renames are excluded but
lost prose is not.

The map now reports **0 orphans and 0 gaps**, with 187 sections mapping to a
syllabus sub-topic (was 180). `tools/fold_orphans.py --check` is gate step 7: no
Chapter 1 section may be numbered for a topic the syllabus does not name.

### 4c. What R5 moved (2026-09-15)

Eight of the nine chapters ended their Learn text with an `Exam-facing summary`
block: the "if the question says X, give Y" table (ch3) or a run of
`Model answer - N marks` headings (ch2, 4-9). That is paper-facing material inside
the teaching text, and it is what "in learn page put past question in past question
section" meant. Chapter 1 has no such block.

It now lives in each chapter's `pastSummary` field and renders on the **Past tab**,
under that chapter's cards: the block itself is unchanged (verified char for char
against the pre-move source), Learn keeps a two-line pointer to where it went, and
`engine.js` indexes it so search still finds it and routes to the Past tab. Sizes of
what moved, per chapter: ch2 2 317 · ch3 3 033 · ch4 7 713 · ch5 3 231 · ch6 4 006 ·
ch7 10 296 · ch8 3 026 · ch9 2 606 characters.

**One incident, recorded because it was nearly silent.** The tool's first version
was only *nearly* invertible, and its `--restore` deleted the block it was meant to
restore - in eight files at once. My round-trip check did not catch it because it
took its "before" snapshot *after* the damage. What caught it was a content diff
against `dist-dcc/site.js`, the built bundle, which is a verbatim copy of every
source file and was written before the move: all eight blocks were recovered from it
and re-applied cleanly. The tool now refuses any file whose field boundary is not
the expected shape, and `--check` (gate step 7) runs a synthetic move-then-restore
that must reproduce the original byte for byte. See `.freebuff/run.md`.

**What R5 has not done yet:** the 48 in-prose `N marks` mentions and 17 paper
citations that sit inside the teaching text ("this was Group A question 3") are
still there. They are signposting rather than questions, so they are a judgement
call for the user, not a mechanical move.

### 4b. What R3 measured (2026-09-15)

`tools/syllabus_map.py` maps by **number, not by keyword**: every section heading
in the notes already leads with its syllabus number, so `3.2.5 Causal ordering`
belongs to syllabus 3.2 and no similarity score is involved. Four results:

**1. No gaps — all 34 sub-topics are taught.** 180 sections map to a syllabus
sub-topic, 0 sub-topics have none. So "the content is missing" is not true at the
level of *topics*; whatever the user is missing, it is inside a topic. That points
R4 away from "add units" and towards "the section that exists does not say the
thing". The weakest-covered sub-topics, by words, are where a wrong or thin
section would hide:

| sub-topic | words | sections | the sub-topic |
| :--- | ---: | ---: | :--- |
| 1.3 | 229 | 1 | Examples: Google File System, Hadoop, BitTorrent |
| 1.1 | 248 | 1 | Definition and characteristics |
| 6.3 | 442 | 3 | Cloud reference architecture |
| 8.2 | 497 | 3 | Identity and access management (IAM) |
| 1.2 | 590 | 1 | Goals of distributed systems |

**2. Four orphan sections in Chapter 1** — numbered 1.5–1.8, and the syllabus
names 1.1–1.4 only. These are the honest "extra content" candidates: *Advantages
and Disadvantages* (302 w), *Main Problems and Challenges* (33 w), *Types of
Distributed Systems* (192 w) and **Resource Sharing and the Web (2 377 w)**. They
are reported, not deleted: `plan.md` §0.2 forbids silent removal, and 1.5/1.7 are
standard exam material for "characteristics" even though the syllabus does not
list them as their own sub-topic.

**3. ~~Nine Learn sections carry 33 past-question records written inline.~~**
**This measurement was WRONG and is corrected here rather than deleted.** The
detector scanned each chapter file for question records, but its section split ran
from a heading to the *end of the file*, so the last "section" of every chapter
absorbed that chapter's `quiz: [...]` and `past: [...]` **data arrays** - which are
not Learn content at all, and are exactly where those records belong. The real
paper-facing material in Learn is one `Exam-facing summary` block per chapter
(eight chapters; Chapter 1 has none), plus in-prose paper mentions. R5 moved the
blocks; see §4c.

**4. The "not on the syllabus" labels already exist.** Two sections are titled
*Extra pages from the GFS/HDFS lecture, not on the syllabus* and *Extra slides from
the reference deck, not on the syllabus* — the content already knows it is out of
scope. R7's check should read those flags rather than re-derive them.

## 5. Open decisions — the user's, not mine

**Q1 — which site is "my current website"?** **Answered:** DCC.

**Q2 — what is "bad" about the content?** **Answered:** questions mixed into Learn,
missing or wrong facts, and padding.

**Q3 — the teacher's marked pages.** **Answered by measurement, then by the user:**
the mark is PowerPoint's `Icons_Information` (§1.3b), 28 slides, and the user's
reading of it — *reference/extra material* — is what R2d acts on.

**Q4 — the four thin sections.** R4b is still the next content iteration: 1.1
(248 w), 1.3 (229 w), 6.3 (442 w), 8.2 (497 w). A wrong or hollow answer hides in a
short section, and no mechanical check can find one — it needs the deck read against
the syllabus topic by topic.

## 6. Log

* **2026-09-16 (R15)** — the last piece of the look, and the smallest ask of the four:
  *"headings use Inter like the reference portal, keeping the body type as it is"*. The
  serif was in **13 rules** across `foundation.css` and the two entry pages' inline shell
  CSS — the section head, the quiz and past panel heads, the strategy and analysis
  card titles, the score figures, and the brand mark and sidebar chapter title — and
  none of them was body prose, which is why the change is invisible to everything R11
  to R13 measured. They now ask for a new `--font-head` token (same stack as
  `--font-sans` today) so the heading face can be revisited on its own; `--font-serif`
  and Newsreader's `@font-face` rules stay declared and unused, which costs nothing
  because an unmatched `@font-face` downloads nothing. Both bundles and both theme
  sheets rebuilt, `check_themes.py` green (all 9 modes AA, print mirror intact),
  `run_checks.py --all` 29/32 with the same three known gaps, and the rendered page
  checked for **0** Newsreader elements with every heading on Inter. Because the sheets
  are shared, the Simulation site's headings changed with it; its bundle was rebuilt.

* **2026-09-16 (R14)** — the look, which is the reader's fourth note and the only one
  that is not about the writing: *"style is so good cant we adopt like this way"*
  about an earlier DCC portal they linked. Asked to choose, they took **the look as
  the new default**, in **that page's cool blue + emerald**. The notes' own colours now
  come from it: white cards on `#f0f4f8`, `#2563eb`, emerald for the right answer, a
  12 px radius, `h3` in the accent, the label in the emerald, `code` as a tinted chip.
  Three of the reference's colours had to be stepped to clear the contrast contract
  this site holds and that page does not (white on its emerald is 3.35:1; its grey
  metadata on its own page is 2.6:1), which `tools/check_themes.py` decides — all nine
  modes pass, and the print mirror matches the light block token for token. Nothing
  structural came over: the tabs, the Reference tab, Revise mode, the theme picker and
  the reading measure are all unchanged, so the yap work above is untouched by it.
  Both bundles and both theme sheets rebuilt, gate 29/32 green, same three known gaps.

* **2026-09-16 (R13)** — the rest of the yap, which is the reader's third note and the
  one appended to their second: *"just teach the topic dont yap"*, then Unit 3's opener
  quoted back — *"the four sub-topics are stages of one argument … The reading order is
  the order to work through … sounds time waste"*. The audit went from six tells to
  **twelve**: `crossref`, `reader`, `meta` and `editorial` were already needed, and
  `recount` was added for this family (a sentence that announces, counts or rates what
  follows, so its subject is the writing). **108 → 0** — ch6 17, ch7 27, ch8 23, ch9 32,
  plus 9 `recount` hits — and **454 rewrites** are in force across the nine chapters. The
  moves are three: a pointer is deleted and its fact kept, a second-person clause becomes
  the subject it was about, and a lead-in goes with the fact inside it stated instead.
  Unit 7's closing section, which was organised by what each other unit needed from its
  platform names, now reads as those names. Two records had to be moved forward because a
  later entry rewrote the words an earlier one installed — see §4j for why the chain
  check needs the newer span to sit *inside* the older one. One revise block retired with
  the heading it hung on (Unit 2's intro; 29 blocks over 29 sections). Both bundles
  rebuilt, because the text the reader was quoting had already left the files and only
  lived on in the built copy.

* **2026-09-16 (R12)** — the shape of the notes, which is the reader's second
  complaint, and the last one in §0.1 that is about the writing rather than the
  material. Each DCC section now opens with a **revise block**: what the section says,
  in a sentence and a few bullets, capped at 90 words against a 236-word median
  section. **Unit 2 is written — 30 blocks, mean 70 words** — and 141 sections across
  the other eight units are the work remaining, held as a known gap. The prose is
  untouched: nothing was shortened, moved or reworded, so no fact was at risk. The
  guard is anti-invention rather than taste — a block may compress its section and may
  not add to it, so a bolded term or a quoted number that is not in the section fails
  the gate. `tools/revise_blocks.py` writes the field as one line, removes it
  byte-exactly, and proves it with `--roundtrip`; four contracts in
  `tools/test_engine.js` pin the heading-to-key rule the JS side implements. The
  reader also gets a **Revise mode** switch in the notes bar, which hides the
  explanatory paragraphs and leaves the answers: 58 visible paragraphs to none on
  Unit 2, with all 30 blocks in place. Gate steps **28 → 32**, one of them the new
  guard and one the completeness count. One incidental fix: the engine-contract step
  no longer pins a count ("All 65 engine contracts hold"), because adding a contract
  used to mean editing the runner — and a pinned number is how a check gets weakened
  rather than updated.

* **2026-09-16 (R11)** — the wording, which is the reader's own example. Every sentence
  of every chapter that talks about the deck, the source, the paper, the exam or about
  answering, instead of about the subject, is rewritten or gone: **112 → 0** across
  ch1–ch9, measured by `tools/voice_audit.py` and held by its `--check` guard as gate
  step 11. The reader's sentence — *"Those three requirements are the vocabulary to
  answer an RMI question with, and the order they come in is the order of the
  problem"* — is now *"The three requirements are listed in the order a remote
  invocation meets them."* Two callouts written for the site's maintainer rather than
  for a reader are deleted (ch7's and ch9's "About this unit's sources"). Nine
  provenance sentences in Unit 7 that the audit's narrow patterns miss were found by
  reading and fixed the same way; 25 `deck`/`slide` mentions are left, all inside
  figure captions, because that is where a caption's source belongs. Four small tool
  additions were needed to express the edits — see §4h. Gate steps stay at **28**, 11
  of them being `voice_rewrite.py --check`.

* **2026-09-16 (R9)** — the pictures out of the reading flow, which is A6–A8 of §0.1.
  **197 of the 201 slide screenshots pasted inline in `learn`** moved into each
  chapter's new `slides` field, drawn on the **Reference tab** under the note section
  each belongs to; 157 of them had been captioned `Figure for <section heading>`.
  Four stayed, each because a sentence in its own section names it
  (`tools/dcc_figure_keepers.json`): §2.2.1, §2.4.5, §3.1.3 (NTP) and §6.1.8. The 20
  hand-built SVG diagrams were not touched. The 7 per-unit `fig-src-note` lines are
  gone and each Reference group names its deck and slides once; the two off-syllabus
  dumps left the Past tab for the same shelf, heading and explanation intact. Captions
  now say what a picture shows or there is none — one rule, in `tools/figcaptions.py`,
  shared with `make_reference.py`, because the reader's own example ("page 2 ·
  GFS_HDFS_Lecture.pdf") was a caption on the Reference tab that the earlier caption
  pass never reached. Two sentences in ch2 were re-pointed at the tab, with their
  `voice_rewrites.json` entries updated to match, and `voice_rewrite.py --check` now
  reads `learn`, `reference` and `slides` together. **Two incidents:** the first
  `--restore` put 7 of 9 chapters back wrong because the position of a rewritten block
  needs the text put *in* ahead of it counted as well as the text taken out — invisible
  for a pure cut, and it lands the text in the next paragraph; and the off-syllabus dump
  was cut twice, once as a block and once figure by figure. Both were caught by hashing
  all nine chapters before and after, neither by reading the code. Gate steps are now
  **28 with `--all`**, step 13 being `slim_dcc_figures.py --check`.

* **2026-09-15 (R2d, R2e)** — the circled-i figures moved out of the notes and onto a
  **Reference** tab (10 figures: 9 in ch3, 1 in ch4), with the notes keeping the
  sections but not the pictures; the exam pitch (14 blocks) removed from the top of
  every unit after checking that each question it named is already a Past card. Both
  are gate steps now (**19 steps, green in ~11 s**). R2c's chips are reverted and
  `--check` fails if one returns. **Incident:** `make_reference.py`'s first version
  put cut figures back at their full-text position, which shifted every figure cut
  after the first — two Bully figures landed inside a paragraph further down the
  page, and a re-run would have moved them again. Caught by the restore byte
  round trip; fixed by subtracting the earlier cuts and by putting adjacent blocks
  back last-first, with both cases in the gate's self-test. Also fixed in this pass,
  found by reading the page rather than the code: search results drew raw
  `&mdash;` because the index carries page text as text — `buildIndex` decodes
  entities now, pinned by three engine contracts (65 in total).

* **2026-09-15 (R4a)** — Chapter 1's four syllabus-less sections (1.5-1.8) are folded
  into the sections the syllabus names: 1.5->1.1.3, 1.6->1.2.1, 1.8->1.2.2 + 1.3.1,
  1.7->1.4.5. No content lost - the block bodies are asserted to survive as
  substrings and the word count may move only by the two sentences deliberately
  rewritten (+34 of 4 811). The map is now **0 gaps, 0 orphans**, and
  `fold_orphans.py --check` is gate step 7 (18 steps green in 10.8 s).

  One trap worth recording, because it looked exactly like a failed edit: the page
  kept rendering the *old* Chapter 1 while `curl` showed the new file. The offline
  worker registered by a bundle page keeps its responses in `Cache Storage
  (offline-<hash>)`, and those entries were being served to the source page too.
  Clearing it from the console (`caches.keys().then(ks => Promise.all(ks.map(k =>
  caches.delete(k))))`) fixed it; the recipe is now in `.freebuff/run.md` §4a.

* **2026-09-15 (R5)** — the exam-facing block moved out of Learn for all eight
  chapters that had one (Chapter 1 has none), into `pastSummary`, rendered on the
  Past tab under the cards, indexed for search, with a pointer left in Learn. The
  move is byte-exact in both directions and gate step 7. **The first version of the
  tool destroyed the block in eight files** - its restore was only nearly
  invertible - and my round trip missed it because the "before" snapshot was taken
  after the damage. Recovery came from `dist-dcc/site.js`, the built bundle, which
  holds every source file verbatim; all eight blocks were restored from it and
  re-applied. The tool now refuses a file whose field boundary is unexpected and
  self-tests on a synthetic input every gate run. Also corrected in this pass: my
  §4b "33 past-question records written inline in 9 Learn sections" was wrong - the
  detector had run past the end of each `learn` string into the chapter's `quiz` and
  `past` data arrays. The real count of paper-facing material in Learn is one
  exam-facing block per chapter, which is what R5 moved.

* **2026-09-15 (R2c)** — the user chose (a) the syllabus decides scope and (b) the
  1.5–1.8 extras in Chapter 1 go, but "mention i in there or give some hint". So the
  mark is now **shown rather than obeyed**: `tools/mark_slides.py` paints a
  `teacher marks this slide` chip into the caption of every figure that came from a
  marked slide, with a hover title carrying the reasoning. Ten figures across ch3
  and ch4, measured live rather than eyeballed - the chip is 178×18, sits inside
  the caption's right edge, the circled i is centred inside it, and its ink on its
  own fill is **6.3:1 in the five light modes and 7.88:1 in the three dark ones**.
  The tool reverts byte-exactly (checked with `git diff`) and `--check` is gate
  step 7, so a re-extracted deck cannot leave a stale mark. Two markup bugs were
  found by looking rather than by testing: the class was first appended *outside*
  the class attribute, and the circled i then drifted onto the line above its own
  label instead of staying in the pill. Both fixed.

* **2026-09-15 (R3)** — `tools/syllabus_map.py` built the map and measured four
  things: **0 gaps** (all 34 sub-topics are taught by some section — so the fault
  is inside sections, not missing units); **4 orphans** in Chapter 1 (1.5–1.8,
  including the 2 377-word *Resource Sharing and the Web*); **33 past-question
  records with model answers embedded in 9 Learn sections**, which is the user's
  main complaint located precisely; and **2 sections that already label themselves
  as not on the syllabus**. The map is written to `data/syllabus_map.json`.
  `--check` fails the build when a gap appears, so the coverage claim cannot rot.
  Two detector traps were found and fixed rather than papered over: the word
  "question" in "came from Group A, question 2" is provenance, not a question, and
  the unit-meta line ("Syllabus: 5 hours · 6 marks") is not a marks badge.

* **2026-09-15 (R2, R2b)** — the user chose **DCC only**, and named three faults:
  practice questions inside Learn, missing or wrong facts, and padding. Their
  answer on the teacher's marks pointed at "an i sign somewhere in pages with non
  imp things", so I went looking for it in the decks: the sign exists, it is
  PowerPoint's `Icons_Information` (a circled i), `tools/dcc_marks.py` finds it by
  content across every deck (28 slides), and **the slides it marks are examinable
  — four of them carry the Bully algorithm, which is a Group C question on the
  teacher's own 2025 paper.** So the icon is recorded in
  `data/off_syllabus_slides.json` and is not used to decide scope; the syllabus
  decides. Two coverage limits are stated in the tool rather than hidden: Ch5's
  deck is a legacy `.ppt` (unreadable without LibreOffice) and PDF-sourced figures
  cannot be scanned for an icon at all.

* **2026-09-15** — R0 + R1. Read both syllabi and every teacher PDF's annotation
  layer; found no machine-readable exclusion marks (§1.3); extracted the DCC and
  Simulation syllabi into `data/syllabus.json` with the self-checks green
  (34 topics, marks 60, hours 45, 16 questions). Confirmed the Learn content of
  both portals currently holds zero question cards. Nothing deleted, nothing
  rewritten yet: R2 is a decision only the user can make.
