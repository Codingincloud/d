# freebuff_simulation — build tracker

**This is the living document for this project.** It exists so nothing gets
forgotten between sessions: what the sources are, what has been decided, what
has shipped, what is next, and how to verify it. Update the *Status* and
*Changelog* sections at the end of every work session.

| | |
| :--- | :--- |
| **Course** | BCE7026 Simulation & Modeling — Semester VII, B.E. Computer, Purbanchal University |
| **Marks** | Full 60 / Pass 24 · 3:00 hrs · chapter weights 8+6+6+6+6+12+6+10 |
| **This folder** | `WSOP-daily-bliz-main/freebuff_simulation/` (working copy) |
| **Frozen original** | `../simulation-website` — **read-only, never edit** (hashes in `_audit/original.sha256`) |
| **Stack** | Static HTML + vanilla JS. No build step, no dependencies. Works from `file://`. |

Legend: `[x]` done · `[~]` in progress · `[ ]` not started · `[!]` blocked / needs a decision

---

## 0. Ground rules (non-negotiable)

1. **Never invent a past question.** No question, year, marks value or wording
   may be added from memory or "reconstructed". Every entry must trace to
   either the site's existing `ch*.js` data, the bank HTML
   (`_reference/Simulation_Modeling_Question_Bank.html`) or the OCR'd papers
   (`_source/past_questions.ocr.txt`).
2. **Never silently remove a past question.** 64 questions currently have no
   model answer; they stay visible as flagged *practice* questions. Deleting
   them would look like hiding gaps. If one is genuinely a duplicate it gets
   merged into the question it duplicates, and the merge is visible in the
   occurrence list.
3. **One question is shown once.** Repeats live in the badge and the expander,
   never as several near-identical cards.
4. **A repeat count must mean "distinct exam papers".** Two scans of the same
   paper are **one** paper. See §3.3 — the OCR bundle really does contain the
   2014 F paper three times and the 2010 F paper twice.
5. **The notes OCR is an index, not a source.** The text layer from pdf24 is
   noisy handwritten OCR (`"Sim lotton"` = "Simulation"). Use it to find *which
   page* something is on; read the page image for what it actually says.
6. **Numbers must be checked.** Every worked numerical is recomputed by hand
   before it goes on a page, and the intermediate steps are shown.
7. **Don't touch Analysis / Mock Exam yet.** The user has asked to finish Learn
   and Past Questions first and to be asked before moving on. (§5, P6)

---

## 1. Baseline snapshot

Captured **2026-09-12**, after the design-foundation pass.

### 1.1 What is on disk

| Path | Size / count | What it is |
| :--- | :--- | :--- |
| `index.html` | 1 115 lines | The whole app: shell, styles, tabs, search, exam, progress |
| `ch1.js … ch8.js` | 261 KB total | One file per chapter: `learn` HTML + `quiz[]` + `past[]` + `variants[]` |
| `assets/css/tokens.css` | 5.1 KB | colour / type / rhythm tokens (one source of truth) |
| `assets/css/foundation.css` | 27.8 KB | reading column, pills, tables, callouts, worked numerical, figures, sidebar rail, print |
| `assets/fonts/` | 212 KB, 6 woff2 | **new** — Inter + JetBrains Mono, self-hosted |
| `data/question_bank.json` | 148 rows, 9 papers | Parsed question bank (per-paper rows) |
| `data/qa_coverage.json` | 8 chapters | Site ↔ bank match report, threshold 0.75 |
| `data/same_question_merges.json` | 34 groups | **new** — the curated "these are one question" groups + the reasons the look-alikes stay apart |
| `data/bank_row_aliases.json` | 1 alias | **new** — curated "this bank row IS this site card" pairs |
| `data/variant_answers.json` | 15 answers | **new** — the per-paper model answers of folded wordings. `merge_past.py` re-attaches them on every run, by parent **text**, so no later `--apply` can drop them again |
| `data/occurrences.json` | 55 occurrences / 48 questions | **new** — which papers asked each question |
| `data/occurrence_report.txt` | — | **new** — human-reviewable match report with scores |
| `_audit/pre_merge/` | 8 files | The original wording, taken before the first merge — **never overwrite** |
| `_audit/pre_merge_2026-09-12/` | 8 files | Pre-change snapshot of this pass |
| `data/analysis.js` | — | `window.ANALYSIS` for the Analysis tab |
| `_reference/` | 92 KB | Bank HTML (merge source, read-only) |
| `_source/` | 264 KB | **new** — OCR text of notes + old papers, rendered note pages |
| `tools/validate_site.py` | — | Structure / data / coverage gate — **must pass** |
| `tools/check_ch4_queuing.py` | — | **new** — re-derives every Ch4 queuing figure |
| `tools/check_ch2_coin_game.py` | — | **new** — re-derives the coin-toss game (Ch2 §2.3) |
| `Simulation_Notes.pdf` | 159 pages | Generated printable PDF (rebuild with `build_pdf.py`) |

### 1.2 Content counts (verified, not estimated)

| | Ch1 | Ch2 | Ch3 | Ch4 | Ch5 | Ch6 | Ch7 | Ch8 | Total |
| :--- | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| Weight | 8 | 6 | 6 | 6 | 6 | 12 | 6 | 10 | **60** |
| Notes | 16.4 KB | 26.7 KB | 10.7 KB | 11.7 KB | 14.0 KB | 37.2 KB | 9.0 KB | 21.7 KB | 147.4 KB |
| Quiz | 10 | 10 | 10 | 10 | 15 | 14 | 10 | 10 | **89** |
| Past Q (as first imported) | 21 | 15 | 21 | 13 | 5 | 37 | 17 | 22 | **151** |
| Past Q before P2 consolidation | 19 | 15 | 21 | 13 | 5 | 36 | 17 | 20 | **146** |
| **Past Q (now: one card per question)** | **12** | **8** | **10** | **9** | **5** | **27** | **6** | **15** | **92** |
| — with a model answer on the card | 9 | 6 | 6 | 6 | 5 | 27 | 4 | 8 | **71** |
| — plus variant answers kept behind the card | | | | | | | | | **15** |
| — practice (no answer written yet) | 3 | 2 | 4 | 3 | 0 | 0 | 2 | 7 | **21** |
| — carrying `occ[]` | | | | | | | | | **50** (107 occurrences) |
| — `repeats ≥ 2` | 8 | 3 | 4 | 6 | 0 | 6 | 5 | 4 | **36** |

**92 cards, 86 model answers — the same 86 as before the consolidation**, so 54
near-identical cards were folded without losing a single question or a single
answer: the wording is kept as an occurrence of the surviving card, and a folded
question's own answer is kept as a `variants[]` entry behind the card's one-click
expander. `repeats` is live: it is printed by the merge as
`max(site, bank, distinct papers traced)`, never hand-maintained.

### 1.3 Current state of verification

```
python tools/validate_site.py            -> All structural checks passed.
python tools/validate_site.py --strict   -> Syllabus coverage: complete
python tools/merge_past.py --apply       -> site questions 92 | imported new 0
                                            (run twice: ch*.js byte-identical)
```

---

## 2. Sources

### 2.1 The user's material

| Source | Location | Notes |
| :--- | :--- | :--- |
| Syllabus | pasted in chat; mirrored in `COVERAGE.md` | 8 units, 40 lecture hours, weights total 60 |
| Model Question 2025 | pasted in chat | 16 questions, groups A/B/C (2/4/8 marks) |
| Notes part 1 | `Downloads/drive-download-…/Simulation-Note-1_250907_041457.pdf` | 53 handwritten pages |
| Notes part 2 | `Downloads/drive-download-…/Simulation-Note-2 1.pdf` | 58 handwritten pages |
| **Notes OCR** | `Downloads/pdf24_ocrPdf/…` (same two files) | same pages + a noisy text layer |
| Old question papers | `Downloads/Simulation Modeling old Questions-ocr.pdf` | OCR text extracted |
| Question bank HTML | `_reference/Simulation_Modeling_Question_Bank.html` | 148 per-paper rows, `#/Question/Source/Marks/Repeats` |

### 2.2 Extracted working copies (in `_source/`, never edited by hand)

| File | From | Use |
| :--- | :--- | :--- |
| `note1.ocr.txt` (101 KB) | pdf24 note 1 | noisy index: grep for a topic, get the page number |
| `note2.ocr.txt` (120 KB) | pdf24 note 2 | same |
| `past_questions.ocr.txt` (40 KB) | old questions PDF | **exact wording of every old question** |
| `notes/note<N>_p<NN>.jpg` | rendered on demand | the pages, readable |

Read a page:

```bash
python tools/render_notes.py --list                  # 53 + 58 = 111 pages
python tools/render_notes.py --note 1 --pages 18-24  # render a range
python tools/render_notes.py --all                   # everything (~22 MB)
```

`tools/fetch_fonts.py` re-downloads the two font families into
`assets/fonts/` (only needed if the woff2 files are ever lost — they are
already committed to this folder).

### 2.3 Notes: page → chapter map

Built from the OCR index. **Read the page before trusting the label.**

| Pages | Content |
| :--- | :--- |
| n1 p1–p6 | Simulation, modelling, simulation modelling; modelling vs simulation |
| n1 p7–p12 | The system: entities / attributes / activities / events; closed vs open; model; types of model (analytical, physical, mathematical) |
| n1 p13–p18 | Steps + phases of a simulation study; areas of application (p18 is the last application-area page) |
| n1 p19 | **Ch3** opens: continuous systems — variables that change continuously with time; why differential equations are used |
| n1 p20–p23 | **Ch3** water-reservoir ODE example (p20, `dh/dt = (Qin−Qout)/A`); **pure pursuit problem** — assumptions p21, formulation p22, pseudocode p23 |
| n1 p24–p27 | **Ch3** analog / digital / hybrid compared side by side; analog components; automobile suspension; liver (thyroxine) compartment model |
| n1 p28–p29 | **Ch3** hybrid simulation (DAC/ADC, artificial satellite); feedback systems — positive / negative, OPAM terminals |
| n1 p30–p31 | **Ch3** ODE vs PDE; why differential equations matter in simulation |
| n1 p32–p38 | **Ch4** queuing opens at p32 (queueing-system figure, elements/calling population); arrival-service mechanism, disciplines FIFO/LIFO, μ, P₀, worked numbers |
| n1 p39–p45 | Manual simulation tables (15 customers, library/bank); machine-failure queuing case |
| n1 p46–p47 | p46 is an application-area list (manufacturing, transportation) bound far from its Ch1 pages; p47 is the Markov chain: current-status distribution matrix |
| n1 p48–p53 | Verification & validation (real system vs model, validation considerations) |
| n2 p1–p9 | **Ch6** random numbers: definition, properties, random number tables, mid-square, LCM |
| n2 p9–p13 | Combined linear congruential method |
| n2 p13–p32 | Testing randomness: hypothesis framework, chi-square table (interval/O/E), independence, auto-correlation, K–S, poker test (p32 is still the poker test) |
| n2 p33–p37 | **Ch7** analysis of output: p33 opens “Analysis of Simulation O/P”; variance and interval estimation, IID + CLT (p35); run statistics / replications (p36); initial bias (p37) |
| n2 p37–p43 | **Ch2** Monte Carlo: significance, integral estimation, area of a rectangle |
| n2 p44–p45 | **Ch2** Monte Carlo vs stochastic simulation (the comparison table); the **coin-toss game** problem (p45) |
| n2 p46–p57 | **Ch8** simulation languages: tools, SIMSCRIPT's seven-section program structure + code, GPSS characteristics, the eight block types with their operands, four worked GPSS models (barber shop, supermarket, manufacturing shop, soap testing) |
| n2 p58 | **Ch8** a fifth GPSS program (telephone system: GENERATE / QUEUE / SEIZE / DEPART / ADVANCE / RELEASE / TERMINATE) and the notes' definition of **CSSL** |

So: **note 1 = Ch1, 3, 4, 5** and **note 2 = Ch6, 7, 2, 8** (note 2 is not in
chapter order — check the map, not the sequence).

**Corrected 2026-09-12 (P4, first pass):** the Ch8 block used to start at p44,
which was wrong by two pages. p44–p45 are the Monte Carlo-versus-stochastic
comparison and the coin-toss game, so they belong to Ch2; Ch8 opens at p46 with
"Chapter: Simulation Language". This is exactly the failure mode §2.3 warns
about — the label was trusted instead of the page.

**Corrected 2026-09-12 (P4, Ch3/Ch7 pass):** four more boundaries were off. Ch3
does **not** start at p23 — p19 opens “Continuous system are those in which
system variables change continuously according to time”, and p20–p23 carry the
reservoir ODE example and the whole pure-pursuit write-up; p24–p31 finish the
chapter (analog/digital/hybrid, suspension, liver, feedback, ODE/PDE). So **Ch3 =
n1 p19–p31** and n1 p18 is still Ch1's application-area list, which means Ch4
opens at **n1 p32** (“Queuing System … elements/calling population”), not p30. On
note 2, **Ch7 = p33–p37**: p32 is still the poker test (Ch6) and p37 is the
initial-bias page that the old `p32–p36` range cut off. And **n2 p58** is Ch8, not
leftover — it holds a fifth GPSS program and the CSSL definition.

### 2.4 Where the code lives (2026-09-12, architecture pass)

```
index.html            the shell: markup, styles, and the list of scripts
app.js                the application — tabs, quiz, past questions, search,
                      mock exam, progress. One IIFE; no inline script in the page
ch1.js … ch8.js       DATA only: window.CHAPTERS[n] = {learn, quiz, past}
data/analysis.js      generated: window.ANALYSIS for the Analysis tab
tools/
  sitelib.py          the shared owner (see below)
  merge_past.py       the only writer of ch*.js past[]
  validate_site.py    the gate
  extract_occurrences.py, find_duplicates.py, import_question_bank.py,
  gen_same_question_merges.js, extract_variant_answers.js
  check_ch2_coin_game.py, check_ch3_pure_pursuit.py, check_ch4_queuing.py
  dump_chapters.js    node → JSON bridge; the only reader of ch*.js
```

**Ownership rules, so the next pass builds with this rather than against it:**

| Concern | Owner | Note |
| :--- | :--- | :--- |
| “Are these the same question?” | `tools/sitelib.py` | `normalise_question`, `strict_similarity`, `similarity`, `norm_key`, `numeric_tokens`. Tools **import** these; none may re-implement them. |
| “Does this text contain this marker?” | `tools/sitelib.py` | `normalise_text` — punctuation only, **words kept**. Deliberately a second function: folding it into the question normaliser drops stopwords and silently breaks the syllabus-coverage check. |
| Reading the chapter files | `tools/sitelib.py` | `load_chapters()` — the one `node dump_chapters.js` call. |
| A re-derived figure, and whether it agrees | `tools/sitelib.py` | `Reporter.check/note/finish`. The three `check_*.py` are consumers. |
| Chapter content | `merge_past.py --apply` | The only writer. Dry by default; idempotent. |
| What the page loads, and whether it parses | `validate_site.py` | It resolves every `<script src>` in `index.html` to a file, checks it exists, and runs `node --check` on it. Code can move; the check follows. |
| Browser state | `app.js` | `progress` (localStorage `sm-progress`) is the only user state; `EXAM` the paper; `CH`/`cur` the chapter on screen. |

---

## 3. Past questions — data model and integrity rules

### 3.1 The gap

The user's requirement: *one question per topic, a badge showing how many times
it was asked, and a "see more" that lists **when** it was asked with the
**exact wording** of that paper.*

Today the site has the badge number only:

```js
// ch1.js (today)
{ year:"2019 F", marks:"5", repeats:3, q:"…", answer:"…" }
```

`repeats:3` is a bare number with no record of *which* three papers, so the UI
cannot show them. The 2011 C wording of a question is simply lost.

### 3.2 The shape that shipped

```js
{ year:"2019 F", marks:"5", repeats:4,
  q:"Explain the phases and steps in simulation study.",   // canonical wording
  occ:[                                                    // evidence, in papers
    { year:"2019 F", marks:"5", q:"<that paper's exact wording>" },
    { year:"2015 F", marks:"3+7", q:"<that paper's exact wording>" }
  ],
  answer:`…` }
```

* `occ` holds **only occurrences found in a real paper** — nothing is
  reconstructed, so the list can be shown as evidence (rule §0.1).
* `repeats = max(what the site had, what the bank says, len(occ))` — the count
  is **never lowered**. When the bank counted a paraphrase that has no paper
  text on record, the UI says so instead of hiding the gap:
  *"the question bank counts 4 appearances in total; the rest are paraphrases
  with no paper text on record"*.
* `q` stays the wording shown in the collapsed row, so nothing regresses.
* `occ` is keyed by **question text**, never by array position — `merge_past.py`
  re-sorts the arrays, so an index would drift onto another question.

**Where the occurrences come from.** The bank's `Source` column only lists
several papers for **2 of 148 rows**, so the papers themselves are the source.
`tools/extract_occurrences.py` splits `_source/past_questions.ocr.txt` into
papers, collapses duplicate scans, splits each paper into atomic question
units, and matches every site question against every unit with the same
similarity function the merge uses (default threshold 0.75).

### 3.2b Bug found and fixed on the way (2026-09-12)

The bank HTML carries real repeat counts:
`<td class="q-repeats"><span class="repeat-high">3 🔁</span></td>`.
`tools/import_question_bank.py` looked for `class="repeat-[a-z]+">(\d+)<` —
which requires the digit to be followed immediately by `<`. That matched only
the 126 plain `1` cells; **all 22 questions that actually repeat fell back to
`repeats: 1`**, which silently disabled the "bank repeats are authoritative"
step in the merge. Fixed to `class="repeat-[a-z]+">\s*(\d+)`, so the bank now
reports `{1:126, 2:3, 3:11, 4:7, 5:1}` and the merge can finally raise counts.

### 3.2c The three bugs that made the merge unsafe to re-run (2026-09-12)

Folding paraphrases introduced a class of bug that silently *deletes* questions,
so the whole step was hardened. All three were found by re-running the merge and
hashing `ch*.js` before and after — any difference is a bug by definition.

1. **Cluster members were addressed by array index.** `find_duplicates.py`
   records `{"index": 2, "q": "…"}`, but the merge re-sorts and re-writes the
   array, so on a second run index 2 pointed at a *different* question and
   unrelated cards were folded away. Members are now resolved **by their own
   text**, and `index` is deliberately ignored.
2. **A folded paraphrase was re-imported from the question bank.** Once the
   duplicate card was gone, the bank's copy of the same question looked "new"
   and was imported again, to be folded again next run. Texts that a fold
   removed are now recorded as `retired` and count as already present.
3. **Occurrences added by a fold were not persisted.** `occ` was rebuilt from
   `data/occurrences.json` on every run, which only knows about the extractor's
   matches — so the duplicate's wording, contributed by the fold, vanished on
   the next run. Occurrences already on disk are now **carried over** and
   unioned (deduped by wording) with the extractor's list.

Guards added: `fold_duplicates` refuses to write if the number of cards removed
does not equal the number of paraphrases folded, and the report prints the
removal count per chapter.

### 3.2d Figures corrected during P3 (2026-09-12)

The user's instruction was explicit: *"current numerical are written and done
poorly and make it hard to read"*. Reading the notes page-by-page turned up
figures that were not merely hard to read but **wrong**, so they are corrected
on the site and recorded here.

1. **Chi-square on the 50 two-digit numbers — observed counts were wrong.**
   The site had `Oᵢ = 11, 9, 13, 7, 10` for five intervals → χ² = 2.00. Counted
   from the number list actually printed in the question, the truth is
   `13, 8, 13, 6, 10` → χ² = 3.80. Worse, the notes' own table (ten intervals)
   gave `8, 5, 2, 4, 3, 8, 2, 4, 3, 6`, which **sums to 45, not 50** — five
   values were lost in transcription. The page now uses the notes' ten-interval
   layout with the counted values `8, 5, 3, 5, 5, 8, 2, 4, 3, 7` → **χ² = 8.00**,
   df = 9, χ²(0.05, 9) = 16.919 → fail to reject. The five-interval result is
   kept as a comparison so the grouping effect is visible. A `ΣOᵢ = N` check is
   now stated in the worked block.
2. **Mid-square was demonstrated on a seed the class never used.** The notes work
   X₀ = 1234 (n2 p13); the site used 7182. Both compute correctly, but the notes'
   seed is the one to recognise in the exam, and it exercises the pad-to-8-digits
   rule that 7182 happened to hide (3030² = 9 180 900 is only 7 digits). Reseeded.
3. **Auto-correlation, the multiplicative period, the combined LCM, the
   full-period check and two extra test numericals had no worked example at all** —
   only the formula. They are now worked, because they are past-paper questions
   (2014 F / 2012 C / 2010 C, 2010 C / 2011 F, 2015 F).
4. **A rounding convention trap.** The notes truncate R = X/m to two decimals
   (23/256 written as 0.08 where it is 0.09). The site now prints the exact
   fraction and one consistent convention, and says which one it is using —
   a marker cannot tell you wrote the right answer if they cannot see your
   convention.

### 3.2e The library card carried invented data (found and fixed 2026-09-12)

The 2010 C library question was on the site with **givens that no source
contains**: inter-arrival `5, 4, 2, 6, 4, 3, 5, 4, 2, 5, 3, 4, 6, 2, 4`,
service `6, 5, 4, 7, 5, 3, 6, 4, 5, 6, 4, 5, 7, 3, 5`, and answers of
8.6 min / 13.6 min / 93.8 %. The real paper
(`_source/past_questions.ocr.txt` line 936 onward, and n1 p41) hands out
**probability distributions**:

| Time (min) | 1 | 2 | 3 | 4 | 5 | 6 |
| :--- | --: | --: | --: | --: | --: | --: |
| Between arrivals | 0.23 | 0.37 | 0.25 | 0.15 | — | — |
| Service | 0.10 | 0.20 | 0.33 | 0.22 | 0.10 | 0.05 |

So the card was answering a different question from the one on the paper — what
rule §0.1 forbids. It survived the earlier passes because nobody had opened the
paper page or the note page for it. It is now rebuilt from the real question:
the interval tables, a 15-customer trace driven by a printed digit stream, and
the notes' own mean-rate check.

**What the corrected answer says.** The notes answer the question without
simulating at all — they replace each distribution by its mean:

```
A       = 1(0.23) + 2(0.37) + 3(0.25) + 4(0.15)          = 2.32 min
lambda  = 1 / 2.32                                       = 0.431 per min
S       = 1(0.10) + 2(0.20) + 3(0.33) + 4(0.22)
          + 5(0.10) + 6(0.05)                            = 3.17 min
rho     = lambda*S = 0.431 * 3.17                        = 1.366  -> OVERLOADED
Wq      = lambda*S^2 / 2(1-rho) = 4.331 / -0.732         = -5.91 min
Ws      = Wq + S                                         = -2.74 min
P(busy) = lambda*S                                       = 1.37  (over 100 %)
```

Those figures stay on the page because the class is marked against the notes,
and the page adds the reading the notes leave implicit: **a negative waiting
time and a probability above 1 are the formulas failing, not answers.** It also
states which Wq formula is in use, because the M/M/1 form gives −11.82 where
the notes' form gives −5.91 — both negative, so the formula has to be written
down to show intent.

**A caveat the page now states.** 15 customers is far too short a run to expose
ρ > 1: the illustrative trace averages only a 4.2 min wait because its digit
block happened to draw slower arrivals (mean 2.47 min) and shorter service
(mean 2.93 min) than the distributions' means. That is the honest reason the
mean-rate check is done alongside the trace, and it is worth a mark as a
limitation of the run.

**Every figure in the three Ch4 problems is now re-derived by
`tools/check_ch4_queuing.py`** (§6) — including the ones that were already
right: the 8-customer bank trace (ΣW = 11.1 → 1.3875 min, 6/8 = 0.75,
11.1/7.2 = 1.542) and the computer-facility figures (ρ = 1.30, Lq = −5.67,
Wq = −8.10, with μ rounded to 0.54 exactly as the notes do). The same script
prints the unrounded values beside the notes' convention so the difference is
visible rather than hidden.

### 3.3 Duplicate-scan warning (this is why rule §0.4 exists)

`_source/past_questions.ocr.txt` contains **~10 paper blocks for 8 distinct
papers**:

* 2019 F · 2015 F · 2012 C · 2011 F · 2011 C · 2010 C · 2010 F
* **2014 F appears three times** (identical text, three scans)
* **2010 F appears twice**

Counting occurrences by scanning the PDF would inflate 2014/2010 questions by
2–3×. Occurrences are keyed on `(year, paper-type)`, deduplicated, and any
question whose OCR evidence and bank `Repeats` disagree gets flagged for review
rather than silently adjusted.

### 3.4 Acceptance checks for P2

* [x] No question added and none dropped. After folding: **151 → 146 cards,
      `imported new 0`**, and the 5 removed cards are exactly the 5 folded
      paraphrases — each still readable in the survivor's `occ[]`.
* [x] Every `occ[]` entry traces to a real paper — an occurrence is only ever
      created from a matched paper unit; the report prints the score for each.
* [x] No `occ[]` contains the same paper twice (one best match per paper).
* [x] Duplicate scans collapsed: 2014 F's two extra scans are one paper, so a
      repeat count can never be inflated by rescanning.
* [x] `python tools/validate_site.py --strict` passes.
* [x] The expander renders year, marks and that paper's exact wording.
* [ ] **Open:** `repeats === occ.length`. It deliberately does not hold yet —
      35 questions agree, 4 have *more* evidence than claimed, and 13 repeat a
      question whose other appearances the bank counted as paraphrases. Those
      need either an OCR match or a visible "counted, not traced" note.
* [x] **Paraphrase duplicates folded.** Ch1 *"Explain the ways to study a
      system…"* and *"What are the criteria of classifying Simulation models…"*
      are now one card (Ch1 21 → 19 cards), with the second wording preserved as
      a paper occurrence. Same for 4 more clusters in Ch6 and Ch8.
* [x] **Idempotent**: `merge_past.py --apply` twice in a row leaves `ch*.js`
      byte-identical, so a re-run can never drift or lose content.

---

## 4. Design foundation — **shipped** (P0)

Palette: **Linear dark**. Fonts: **Inter** (UI/prose) + **JetBrains Mono**
(every number, formula and table cell).

### 4.1 Where everything lives now

```
assets/fonts/fonts.css        self-hosted @font-face (latin, latin-ext, greek)
assets/css/tokens.css         all colour + type + rhythm variables
assets/css/foundation.css     the component layer
index.html                    shell styles only; links the three files above
```

> **Load-order gotcha (cost a debugging round):** the three `<link>` tags must
> stay **after** `</style>`, at the end of `<head>`. `foundation.css` overrides
> the shell at equal specificity, so if it loads first nothing applies. The old
> inline `:root` / `[data-theme]` blocks were removed; tokens live only in
> `tokens.css` now.

The variable **names** are the ones the site already used (`--pri`, `--t2`,
`--brd`, …), so all 8 chapter files, the quiz, the past list, the analysis tab
and the mock exam picked up the new design without a single content edit.

### 4.2 Tokens (dark — the primary theme)

| Token | Value | Role |
| :--- | :--- | :--- |
| `--bg` | `#08090a` | app background (near-black, faint blue cast) |
| `--bg-side` | `#0d0e10` | sidebar / topbar |
| `--bg-card` | `#1c1d1f` | cards, quiz rows, past rows |
| `--bg-input` | `#1f2023` | inputs, chips, bars |
| `--brd` | `#2a2b2e` | separators |
| `--t1` `--t2` `--t3` | `#ededef` · `#c3c6cd` · `#8a8f98` | headings · body prose · metadata |
| `--pri` | `#5e6ad2` | accent (indigo) |
| `--sec` | `#4cb782` | success / exam tip / worked example |
| `--acc` | `#e5a03d` | caution |
| `--dan` | `#e5484d` | common mistake |
| `--vio` | `#9a7fe0` | **new** — "talked about / commonly asked" |
| `--reader-w` | `760px` | the reading column |

A light theme is kept in step with the same roles, so the ☀️/🌙 toggle still
works. Dark is the default (`data-theme="dark"`, and `setTheme(… || 'dark')`).

### 4.3 What shipped

**Reading column — 760 px, centred.** The single biggest readability fix;
prose no longer runs edge to edge. Wide tables scroll inside a
`.table-scroll` wrapper instead of breaking the column.

**Prose rhythm.** Body 15.5 px / 1.75 line-height, list items 9 px apart
(was 5 px), 1 px section rules, `scroll-margin-top` so heading jumps don't hide
under the sticky topbar.

**Pills.** Marks, hours, years and counts got a border + fill so they read as
*data*: `.ch-badge`, `.pq-year`, `.pq-repeat`, `.nav-marks`, `.exam-q .qm`.
Tabular numerals throughout.

**Tables.** Uppercase sticky-capable header, visible zebra stripe, row hover,
hairline dividers, and a **numeric column treatment**: `enhanceContent()`
detects cells containing nothing but a number and gives them
`td.num` → right-aligned, JetBrains Mono, tabular. (Ch6 alone: 355 cells;
Ch4: 63.) No content file needed editing.

**Callout pattern — one shape, five colours.** This is the "blue box =
memorise this" idea made systematic:

| Class | Kind | Colour |
| :--- | :--- | :--- |
| `.concept-box` | definition / key concept | indigo |
| `.formula-box` | key formula (mono, `.lines` for multi-line derivations) | indigo |
| `.concept-box.tip` | exam tip | green |
| `.concept-box.asked` | **new** — talked about / commonly asked | violet |
| `.concept-box.warn` | caution | amber |
| `.concept-box.important` | common mistake | red |
| `.example-box` | worked example | green |
| `.worked` | **new** — the worked-numerical block (see §4.4) | — |

**Sidebar states.** not-started → in-progress (indigo ring, chapter opened but
not finished) → done (green ✓). The chapter's quiz score appears as dim
metadata. `progress.seen` tracks the middle state.

**Tab badges.** Learn shows ✓ when the chapter is complete; Quiz shows the
question count and switches to the stored score (`68%`, green) once attempted;
Past Questions shows its count. So progress is readable without clicking.

**Jump-to-top / next-chapter.** A persistent floating pair bottom-right.

### 4.4 The worked-numerical block (`.worked`)

Current numericals are written inline and are hard to read — the user's own
complaint. The component is **built and styled**, ready for content:

```
┌ 8.4  Mid-square generator ─────────────────────────── 2019 F · 5 marks ┐
│ SEED X₀ 4319   DIGITS 4   ROWS 6                                       │
│  ①  X₁ = 4319² = 18 653 761 → middle 4 = 6537                          │
│  ②  X₂ = 6537² = 42 732 369 → middle 4 = 7323      seed already seen   │
│ RESULT   6537, 7323, …   period 2, not maximal                         │
└────────────────────────────────────────────────────────────────────────┘
```

Conversion of the existing numericals is **P3**, not done yet.

### 4.5 The design track (P1) — **shipped 2026-09-12**

* [x] Progress card → one slim bar with three inline numbers, not three boxes.
* [x] Per-subsection collapse/expand: every `h2` section gets a chevron and the
      chapter has one Expand/Collapse-all control. Which sections were folded is
      remembered per chapter (`sm-collapsed-<n>` in localStorage).
* [x] Sticky table headers: any table with 9+ rows becomes a scrolling box with
      a pinned header (`enhanceContent()` adds `.table-scroll.tall`).
* [x] Print stylesheet: chrome hidden, collapsed sections and answers expanded,
      black on white (Ctrl+P on the Learn tab produces the chapter).
* [ ] Self-rated confidence chip per subsection (Weak / OK / Strong) — still not
      built. It adds a control to every heading, so it stays an open question
      (§7.5).

### 4.6 Layout: the window is the layout (2026-09-12)

The complaint was exact: *"text only in centre, which looks good for mobile but
for a laptop it is bad — make it full screen."* The old 760 px reading column left
most of a laptop screen empty.

| Before | Now |
| :--- | :--- |
| `--reader-w: 760px`, centred | `--reader-w: 1180px` — the column grows with the window |
| `--wide-w: 960px` for quiz / past / analysis / exam | `--wide-w: 1400px`: they use the whole window, capped only on ultra-wide screens |
| Sidebar always 280 px, no way to fold it | One ☰ button compresses it to a 72 px rail of chapter numbers, and the choice is remembered (`sm-rail`) |
| Off-canvas drawer only below 768 px | Drawer below 1025 px — a 288 px column at 900 px left too little room for the notes |
| Topbar stacked into three short rows when narrow | Title + controls on one row, the search given its own full-width row |
| Tabs wrapped onto two lines | The tab strip scrolls sideways instead |

Numbers checked in the browser at 390 / 777 / 1280 / 1440 / 1920 px: no
horizontal overflow on any tab or width (`documentElement.scrollWidth` equals the
viewport), and the topbar is one row from 901 px up.

---

## 5. Roadmap (in order)

### P0 — Design foundation ✓ 2026-09-12
Tokens, local fonts, reading column, pills, tables, callout pattern, worked
block, sidebar states, tab badges, jump-to-top. Validation still green.

### P1 — Design polish ✓ 2026-09-12 (except confidence chips)
Progress card, per-section collapse, sticky table headers and the print sheet are
in (§4.5); the layout pass is in §4.6. The confidence chips are still open on
purpose: they add a control to every heading, so they need a yes from the user.

### P2 — Past questions: occurrences + dedupe [~] ← **highest value**

Done:
1. [x] Fixed the bank repeat-count parser (§3.2b) — the real bug behind "only
   23 questions repeat".
2. [x] `tools/extract_occurrences.py` builds `occ[]` from the real papers,
   collapsing duplicate scans, with a reviewable report
   (`data/occurrence_report.txt`).
3. [x] `tools/merge_past.py` now emits `occ[]`, raises `repeats` from the
   evidence, and backs up to a dated folder instead of clobbering
   `_audit/pre_merge/`.
4. [x] `merge_past.py --apply` run: 151 questions in, 151 out, no imports.
5. [x] UI: badge is `🔥 Asked N×` with `data-freq` (high/mid) colours; the
   collapsed row shows the papers it can be shown in; opening the card lists
   each paper with its exact wording, plus an honest note when the bank's count
   exceeds the traced evidence. Global search now also finds a question by the
   years it was asked in.
6. [x] `validate_site.py --strict` passes.
7. [x] `tools/find_duplicates.py` — conservative paraphrase report. It only
   proposes a merge when one text is *contained in* the other (or near
   identical); 5 clusters qualified and **23 related pairs were deliberately
   refused** (e.g. the three LCM questions with different parameters,
   `a=12/m=26` vs `a=13/m=64` vs `a=17/m=64`).
8. [x] Folding shipped — 151 cards → **146**, with every folded wording kept in
   `occ[]` (nothing deleted, nothing paraphrased by us). `find_duplicates.py`
   output lives in `data/duplicate_clusters.json` and is the record of intent.
9. [x] `merge_past.py` is now **idempotent**: re-running `--apply` produces
   byte-identical `ch*.js` (verified by hashing before/after). Three bugs had
   to be fixed to get there — see §3.2c.

10. [x] **Same-question consolidation (2026-09-12).** Similarity alone could not
    tell "we say the same thing differently" from "two different questions about
    the same topic", so the judgement is written down in
    `data/same_question_merges.json`: **34 groups, 54 cards folded, 146 → 92**,
    with 12 groups of look-alikes explicitly refused and the reason recorded
    (three LCM parameter sets, three auto-correlation samples, the poker-test
    short note vs its numerical, …). `tools/find_duplicates.py` feeds these into
    the same cluster file the merge consumes, and **fails loudly** if a listed
    question is no longer in a chapter.
11. [x] **A folded question's answer survives.** `fold_duplicates()` now carries a
    folded entry's own model answer as a `variants[]` entry on the surviving
    card, so the page can show "same question, 2011 C wording — and the answer
    written for that paper" behind one click. 86 model answers before the fold,
    71 on cards + 15 as variants after it — none lost.

11b. [x] **…but they were lost anyway, and are now owned by data.** The answer
    pass rewrote the chapter files from `data/tier_a_answers.json` and dropped
    every `variants[]` array; `_audit/pre_answer_pass/` proves 15 answers existed
    and a text match against all 8 live chapters finds **0 of 15 reachable**,
    while `index.html` kept rendering their "its own model answer" buttons.
    Those 15 answers are now extracted to `data/variant_answers.json`
    (`tools/extract_variant_answers.js`, machine-derived from the snapshot) and
    `tools/merge_past.py::attach_variants()` **re-attaches them on every run**,
    so a later `--apply` cannot drop them. Matching is by parent question *text*,
    never position, and a stale parent is a loud `SystemExit` rather than a
    silently discarded answer. Re-running `--apply` is byte-identical.
12. [x] A bank twin of a folded question can no longer be re-imported as a new
    card: `already_present()` checks a new bank question against *every* wording
    recorded for the chapter (card, occurrences, variants, retired texts) at 0.80,
    and refuses to fold wordings whose numbers differ. `imported new 0`.
13. [ ] Raise recall for the repeated questions with no traced occurrence —
    lower the threshold in a *review* run and hand-check the proposed matches
    rather than accepting them automatically.
14. [ ] Retype `repeats` by hand only where the bank's count beats the traced
    evidence (currently 0 such cases after the fold).

### P3 — Worked-numerical conversions [~] ← **in progress**

Rewrite every numerical as a `.worked` block (givens → numbered steps → boxed
result) and **recompute it**, not reformat it. The notes are the source of
truth for which numbers and which method; `_source/notes/` page images are the
only reliable way to read them.

**Rule for this pass: never trust the existing figure.** Every value is
re-derived (by a script where the arithmetic is long) and the derivation is
what goes on the page. Corrections found so far are listed in §3.2d.

**Ch6 — done (13 `.worked` blocks, was 8 inline `example-box` blocks).**

| # | Numerical | Source | Status |
| :-- | :--- | :--- | :--- |
| 1 | LCM X₀=27, a=17, c=43, m=100 → 2,77,52,27,2, period 4 | 2025 M Q16 | ✓ verified |
| 2 | LCM X₀=30, a=12, b=21, m=100 → 81,93,37,65,1 | n2 p6 | ✓ added |
| 3 | Multiplicative CGM period, a=13, m=64, X₀=2 → 8, X₀=4 → 4 | n2 p9 | ✓ added |
| 4 | Full-period check (Hull–Dobell), a=12, c=5, m=26 → period 2 | n2 p10 | ✓ added |
| 5 | Combined LCM → 2,11,0,1 | n2 p11–12 | ✓ added |
| 6 | Mid-square X₀=1234 → 5227,3215,3362,3030,1809 | n2 p13 | ✓ reseeded |
| 7 | Chi-square, 50 numbers, 10 intervals → χ² = 8.00 | n2 p20 | ✓ **recounted** |
| 8 | Auto-correlation, i=3, m=5, N=30 → ρ̂=−0.1945, Z₀=−0.196 | n2 p23–24 | ✓ added |
| 9 | Poker test, 1000 numbers → χ² = 47.659 | 2011 F | ✓ verified |
| 10 | Run test N=10 → a=7, Z₀=0.55 | — | ✓ verified |
| 11 | Run test N=40 → a=24, Z₀=−0.89 | n2 p21–22 | ✓ added |
| 12 | K–S N=10 → D=0.15 < 0.430 | — | ✓ verified |
| 13 | K–S N=6 → D=0.32 < 0.565 | n2 p15–16 | ✓ added |

Plus the two-sample K–S critical value (D_α = 1.36√[(n₁+n₂)/n₁n₂] = 0.172 for
n₁ = n₂ = 124) added as a tip, from n2 p18–19.

**Ch2 — done** (6 `.worked` blocks: ∫₁⁴(x+4)³ by sample mean, ∫₀³x² by hit-or-miss,
π from x²+y²=16, the vegetable-shopkeeper ordering table, Box–Muller and polar
normal generation).

**Ch4 — done** (2026-09-12). The hospital M/M/1 case is worked through all seven
measures with the stability check stated first, and the Honda–Yamaha Markov
chain shows P → P² → P³ by hand rather than "after calculation". The three
manual-simulation problems from n1 p39–p45 are now all on the page: the bank
8-customer trace (verified correct as it stood), the library 15-customer problem
**rebuilt from the real distributions the paper gives** (it had invented givens —
§3.2e), and the computer-facility card, which gained the two random-number
interval tables that its 30-day run needs. Every figure in all three is
re-derived by `tools/check_ch4_queuing.py`.

**Ch3 — the pure-pursuit step is now worked** (initial conditions from the site's
own statement, the distance check first, θ resolved into cos/sin per axis), and
this also fixed a real error: the step formula had x and y swapped, so the fighter
flew *away* from the bomber. The hit rule said 100 m in one place and 10 units in
another; both now say 10 units. The automobile-suspension block diagram is still
to come (P5).

**Ch7 — done** (2 blocks) and one wrong figure corrected: the confidence-interval
example had S = 0.508 and the interval (3.67, 4.93); the correct values are
S = 0.5244 and (3.65, 4.95) — the old figure divided the squared deviations by n
instead of n − 1. The replication example was recomputed and was already right.

**Still to do:** Ch1/5/8 have no inline arithmetic left to convert (their
`example-box` blocks are conceptual examples, which is the right box for them).
The remaining content jobs are the Ch8 GPSS worked model and the Ch3
suspension diagram; the Ch6/Ch4 manual simulation tables are done.

### P4 — Notes cross-check pass [~] started 2026-09-12
Read all 111 pages (note 1 = Ch1/3/4/5, note 2 = Ch6/7/2/8), chapter by chapter,
and diff them against the site: what the notes have that the site lacks, and
what the site lacks that the syllabus wants. Record findings here before
editing. The notes are the user's own class notes, so their emphasis is a good
guide to what the exam asks.

**Progress: ~70 of 111 pages read.** n1 p39–45 and n2 p1–24, p37–45 were read
during P3 (Ch4, Ch6, Ch2 numericals); the first P4 pass added **n2 p44–57**; this
pass covered **n1 p18–32** (Ch3 and the Ch4 boundary) and **n2 p30–38, p58**
(Ch6's last test, all of Ch7, the Ch2 boundary and n2 p58).

**Read this before trusting any of the above:** this pass could **not** open the
page images — `read_files` returns `[BLOCKED]` for every `note*.jpg` in this
session — so it worked from the pdf24 **text layer** (`_source/note1.ocr.txt`,
`_source/note2.ocr.txt`, split on form feed, so the page number is exact). That is
enough to settle **boundaries** and to quote a **heading or a stated definition**,
and not enough to trust **handwritten numbers**: the OCR renders “10 units” as
`(9 unite` and the telephone model's operands as `GENERATE3,1`. Everything below
is limited to what the text layer states plainly. **The visual page read is still
owed**, and the two items it is owed are recorded in §7.

#### Findings, Ch8 (n2 p46–p57) — the thinnest chapter by weight

| | Finding | Action |
| :-- | :--- | :--- |
| 1 | **GENERATE was taught as a triangle.** It is a **semicircle** — the notes draw it that way on every GPSS page, and the only diamond is TRANSFER/TEST | Fixed in the Learn table, **the quiz answer** and **two past-answer tables** (§8) |
| 2 | No statement of what GPSS *is* in the notes' terms: discrete clock, transactions passed service to service, network of blocks, **48 block types**, less flexible than SIMULA/SIMSCRIPT but easier and most popular, built for **non-programmer analysts** | Added as a concept box |
| 3 | The block table gave shapes but **no operand syntax** | Added a GENERATE/QUEUE/DEPART/SEIZE/RELEASE/ADVANCE/TERMINATE/TRANSFER syntax table with the notes' operand meanings |
| 4 | **One** worked GPSS model (bank queue) against **four** in the notes | Added barber shop (incl. the 420-min run-length problem), supermarket, manufacturing shop with 15 % rejects, soap testing with 90 % good |
| 5 | SIMSCRIPT was summarized in 3 rows; the notes answer the organization question with **7 sections** | Added the seven sections and the notes' worked SIMSCRIPT program |

#### Findings, Ch2 (n2 p44–p45) — and a page-map error

| | Finding | Action |
| :-- | :--- | :--- |
| 6 | **The page map was wrong**: p44–p45 were filed under Ch8 but are Monte Carlo-vs-stochastic plus the coin-toss game, which are Ch2 material | Map corrected in §2.3 |
| 7 | The Monte Carlo / stochastic comparison is **already covered** by §2.3 | None needed |
| 8 | The **coin-toss game problem was missing entirely** | Worked in full in §2.3, with `tools/check_ch2_coin_game.py` |

#### Findings, Ch3 + Ch7 + n2 p58 (n1 p18–p32, n2 p30–p38, p58)

| | Finding | Action |
| :-- | :--- | :--- |
| 9 | **The Ch3 pure-pursuit half-fix.** The first P3 pass corrected the swapped step in the **Learn** section and left it in the places a student actually reads the answer in: the quiz question/answer (n1 p21–p23) and the "Describe the pure pursuit problem" past-answer card still said `x_f(t+1) = … + V_p × sin θ`, and that card's own closing line still said "shot down at ≤ 100 m" beside its own assumption of **10 units**, plus an invented "escapes beyond 1000 m" rule that appears on no page | **All four places** now say cos θ → x, sin θ → y and a 10-unit firing range with escape on the time limit; `tools/check_ch3_pure_pursuit.py` re-derives the step and **fails on any of the four stale strings** (negative-tested against `git show HEAD:ch3.js`: 5 lines caught) |
| 10 | Ch3 had **no three-way analog / digital / hybrid comparison**; the notes lay one out at n1 p24 under "continuous system simulation can be done by simulating …", and only a two-column analog-vs-hybrid table existed, in a past answer | Added the **Analog vs Digital vs Hybrid** table to §3.3 (7 rows: built from, data, programmability, accuracy, real-time, interface, examples) |
| 11 | Ch7 replaced the notes' answer to "why analyse simulation output" with a two-sentence box; n2 p33 gives **five reasons** (validation & verification, understanding behaviour, evaluating design alternatives, predicting behaviour, informed decision) | Restored as the five-item list, with the notes' framing that analysis *is* estimation under stochastic dynamics |
| 12 | Ch7's interval-estimation page (n2 p35) states the **IID** assumption and the **central limit theorem** route to `Z = (X̄−μ)/(σ/√n)`; the site's §7.1 jumped straight to the t-interval | Noted only — §7.3 already introduces IID where the replication formula uses it, so the gap is ordering, not a missing fact |
| 13 | **n2 p58** carries a **fifth GPSS program** (telephone system) and the notes' CSSL definition. The CSSL wording is already covered by §8.2/§8.4 | The **CSSL half needs nothing**. The telephone GPSS program is **not transcribed**: the text layer renders its operands ambiguously (`GENERATE3,1`, `ADVANCE 5,9E`), and guessing operand values is the exact failure mode this pass exists to catch. Recorded in §7 as a page-read job |

**Method note for the remaining pages.** Open the page image; do not trust either
the map or a grep of the noisy OCR. Finding 1 and §3.2e were both invisible to
text search and obvious on the page within seconds. When the images cannot be
opened (see the note above §2.3), the text layer still settles **which page a
topic lives on** and **what a stated definition says** — which is how findings 9,
10, 11 and 13 were reached — but it cannot be trusted for handwritten numerals.

### P5 — Figures and diagrams [~] started 2026-09-12

**Fig 1.1 — Steps in a simulation study (Ch1, done).** An inline SVG flowchart of
the 12 steps with the two feedback loops that the exam question asks for: the
verification/validation loop back to model conceptualization, and the "more runs"
loop back to experimental design. It was the one figure a past question
explicitly required ("Explain the steps in a simulation study **with a
flowchart**") and the notes had none.

Still to draw, same technique: next-event time advance (Ch8), queuing structure
and the manual-simulation timing diagram (Ch4), GPSS block diagram (Ch8), feedback
loop (Ch3), analog-computer block diagram for `Ax″+Bx′+Cx+D=0` (Ch3), and the
verification/validation ladder (Ch5). SVGs, not rasters: they scale, they take the
theme colours and they survive into the PDF.

### P6 — Analysis + Mock Exam [~] examined 2026-09-12
Explicitly deferred in the notes: *"dont focus on analysis and mock exam for right
now ask me to do after every thing in learn section and past questions section is
totally topnotch"*. No new exam features were added; what happened on 2026-09-12 is
a **defect fix** the audit forced (§3.6) — the paper's mark total was a literal `60`
in three places while the breakdown rows divided by the syllabus weights, so a
chapter the paper never set 6 marks for could read `5/6 marks` and the bars did not
add up to the total the header claimed.

What a further pass could add, in value order: (1) the exam draws from the same
pool for every chapter every time, so the "New paper" button is the only variety —
a per-chapter filter or a "weakest chapters only" paper would use the self-marking
data that is already stored; (2) `progress.examAttempts` is written but never
shown; (3) there is no export of a marked paper. None of this should start without
being asked.

### P7 — Export + docs [ ]
Rebuild `Simulation_Notes.pdf` (`python build_pdf.py`), refresh `COVERAGE.md`
and `README.md` (new `assets/` and `_source/` layout, occurrence model).

Note: `build_pdf.py` carries its **own** inline print stylesheet (`STYLE` at
line 34) and does not read `assets/css/`, so the generated PDF keeps its own look.
Rebuilt 2026-09-12: **148 pages** (was 159 — fewer cards after the fold), and it
now carries the Ch4/Ch7 worked numericals and the checked figures.

**Known gap:** `xhtml2pdf` does not draw inline SVG, so Fig 1.1 (the simulation
study flowchart) is on screen but not in the PDF, and the same will be true of
every figure from P5. Before the PDF matters for print, either rasterise the SVGs
into `assets/figures/*.png` for the print build or add a reportlab drawing pass;
the print sheet is still the deliberately-last job it always was.

Note: adding source files means upstream merges need care — `_source/` and
`assets/` are part of this folder, not of `../simulation-website`.

---

## 6. Verification

```bash
python tools/validate_site.py            # must pass after ANY edit
python tools/validate_site.py --strict   # coverage markers become errors
python tools/dump_chapters.js            # node: prints chapter data as JSON
python tools/merge_past.py               # dry run + qa_coverage report
python tools/merge_past.py --apply       # rewrites ch*.js (backs up _audit/pre_merge/)
python tools/check_ch4_queuing.py        # re-derives every Ch4 queuing figure
python tools/check_ch2_coin_game.py      # re-derives the coin-toss game (Ch2)
node tools/extract_variant_answers.js     # regenerates data/variant_answers.json
                                         #   from _audit/pre_answer_pass/ (--dry-run first)
```

`validate_site.py` now also `node --check`s the **inline script in
`index.html`**. Until 2026-09-12 nothing parsed that file, and a single stray
apostrophe inside one of its strings cost a full browser round-trip to find: the
page rendered the shell and lost every tab with only an `[exception] SyntaxError`
in the console. The check fails on that slip and on an unbalanced brace.
python build_pdf.py --out Simulation_Notes.pdf
```

Preview locally:

```bash
python -m http.server 8099      # then http://127.0.0.1:8099/
```

`build_pdf.py` needs `xhtml2pdf` and `node` on `PATH`.

---

## 7. Open questions for the user

0. **What is left, stated plainly** (2026-09-12, after the Ch3/Ch7 pass): the Ch8
   GPSS worked model, the Ch3 suspension diagram, and the remaining P5 figures.
   **P4's remaining pages need a page read, not more grepping.** Whether
   `read_files` can open a `note*.jpg` **flips between sessions** — it worked for
   n1 p39–45 and the libraries pass and it returns `[BLOCKED]` now, for every
   page. The text layer is enough for boundaries and stated definitions (that is
   what this pass used) and is not enough for handwritten numerals: `10 units`
   OCRs as `(9 unite`. Two concrete items are therefore owed, in this order:
   **(a)** the **telephone-system GPSS program** on n2 p58 — its operands
   (`GENERATE 3,1`? `ADVANCE 5,2`?) have to be read off the page before they can
   be taught; **(b)** a **visual sweep of n1 p19–p31** (Ch3), where this pass
   could only confirm structure and definitions, and the automobile-suspension
   and liver equations in particular deserve an eye. The remaining unread pages
   are n1 p1–17 and p33–38, p46–53 (Ch1, Ch4, Ch5) and n2 p59. P6 (Analysis +
   Mock Exam) is still parked on the original instruction to finish Learn and
   Past Questions first; both are in good shape now, so say the word.

1. **Theme default.** Dark is now the default (it was light). Nothing else
   changed — say the word if you'd rather keep light as the default.
2. **Ch5 has only 5 past questions** against a 6-mark weight; three extra
   syllabus-based questions were added earlier and labelled `General`. Keep
   them, or drop them so that every entry is a real paper question?
3. **64 practice questions have no model answer.** Priority order for writing
   them: highest-repeat first, or chapter order?
4. **Figures:** SVG redraws (recommended) or AI-generated rasters?
5. **Confidence chips** per subsection — wanted, or too much UI?

---

## 8. Changelog

### 2026-09-12 (architecture) — the app is a file, and the tools have one owner
* **`index.html` 1122 → 354 lines: the application moved to `app.js` (767 lines).**
  It was one inline `<script>` holding navigation, quiz, past-question rendering,
  search, progress and the whole mock exam — the reason a single stray apostrophe
  once blanked every tab, and the reason every pass had to edit the biggest file
  in the project. The move is byte-for-byte: the extracted body hashes identical
  to the lines that left `index.html`, and the page loads it the way it already
  loads `ch*.js`, at the same point in the document.
* **`tools/sitelib.py` is the one owner of the duplicated tool logic** (147
  lines): `ROOT`, `load_chapters()`, `normalise_question`, `normalise_text`,
  `strict_similarity`, `similarity`, `norm_key`, `numeric_tokens`, `Reporter`,
  `use_utf8_stdout()`. `merge_past.py` −63 lines, the two older checkers −10 each;
  `validate_site.py` +25 because its script check got stronger, not because it
  kept a copy.
* **The syntax check now follows the code instead of the markup.**
  `check_page_scripts()` resolves every `<script src>` in `index.html`, errors if
  the file is missing, and runs `node --check` on it; any inline script left
  behind is still parsed. The validator caught the move by itself — it reported
  `expected 8 chapter meta entries, found 0` the moment the meta array left the
  page — and `page_code()` (the page plus the scripts it loads) is the fix, so
  the meta, weight and hours checks read the code wherever it is.
* **Negative-tested, because a check that cannot fail is not a check:** one
  injected stray apostrophe in `app.js` → `index.html -> app.js: does not parse`,
  exit 1; a dangling `src` → error; a page with no scripts → error. All three
  restored and re-run green afterwards.
* **Behaviour preserved, and proved where it could have slipped.**
  `merge_past.py --apply` twice: **8/8 chapter files byte-identical**,
  `imported new 0`. A/B on the two tools that were only imported: HEAD's
  `extract_occurrences.py` and the refactored one produce a **byte-identical**
  `data/occurrences.json` (md5 `a82ead50…`), so the refactor changed no
  behaviour — the committed `occurrences.json` is simply stale against the
  current chapter files, and it was left at its committed bytes rather than
  silently regenerated in a structure pass.
* Re-exercised in the live preview with a clean console: all 8 chapters render,
  5 tabs switch, Ch 6's 14-question quiz scores `✓ 14 ✗ 0`, the mock exam
  self-marks to **60/60** over 13 questions, and search for "chi-square" returns
  hits.

### 2026-09-12 (P4: Ch3 + Ch7) — the pure-pursuit fix completed in all four places, two gaps filled, four map boundaries corrected
* **The pure-pursuit half-fix is finished.** The first P3 pass corrected the
  swapped step in the Learn section and left it in the two places a student
  actually revises from: the quiz, and the "Describe the pure pursuit problem"
  past-answer card. That card also closed with "shot down at ≤ 100 m" while its
  own assumptions said **10 units**, and with an "escapes beyond 1000 m" rule that
  is on no page. All four places now agree: **cos θ → x, sin θ → y**, firing range
  **10 units**, escape on the time limit. `tools/check_ch3_pure_pursuit.py`
  re-derives the step (d = 102.96, cos = 0.8742, sin = −0.4856, and (17.48, 40.29)
  at V_p = 20) and **fails on any of the four stale strings** — run against the
  previous commit's `ch3.js` it catches 5 lines, and it also proves the pairing is
  not cosmetic: a correctly paired step closes the gap by exactly V_p, the swapped
  one **opens** it by 17.45.
* **Ch3 §3.3 gained the notes' Analog vs Digital vs Hybrid comparison** (n1 p24):
  seven rows, and the first place in the chapter with a **digital** column at all
  (the only comparison before it was a two-column analog-vs-hybrid table inside a
  past answer).
* **Ch7's "why analyse simulation output" box is now the notes' five reasons**
  (n2 p33) — validation & verification, understanding behaviour, evaluating design
  alternatives, predicting behaviour, informed decision — with the notes' framing
  that analysis *is* estimation under stochastic dynamics. It was a two-sentence
  box before.
* **Four page-map boundaries corrected** (§2.3): **Ch3 = n1 p19–p31** (not
  p23–26 + p27–29), **Ch4 opens at n1 p32** (not p30), **Ch7 = n2 p33–p37** (not
  p32–p36), and **n2 p58 = Ch8**. n1 p18 is still Ch1's application-area list, and
  n1 p46 is an application-area list bound far from its Ch1 pages.
* **Session constraint, recorded so the next session does not waste a pass on it:**
  `read_files` returns `[BLOCKED]` for every `note*.jpg` here. This pass worked
  from the form-feed-split text layer — exact for page numbers and headings, and
  **unusable for handwritten numerals** (`10 units` OCRs as `(9 unite`). The two
  items that owe a page read are in §7.0.
* Verification: `dump_chapters.js` parses; `validate_site.py` **and** `--strict`
  pass; `merge_past.py` reports `imported new 0`, and two `--apply` runs leave
  **8/8 chapter files byte-identical**; all three checker scripts pass; the changed
  content was read back **from the live page** — the Ch3 table's headers render as
  FEATURE / ANALOG / DIGITAL / HYBRID with 7 data rows, the quiz and the past
  answer both carry the 10-unit rule and cos → x, and Ch7's five reasons render as
  list items 1–5 — with a clean console.

### 2026-09-12 (adversarial fix) — 15 orphaned model answers restored, and the mock exam marks out of the total it claims

Two defects an audit proved, both fixed and both re-checked through the running
page rather than by reading code.

**1. The per-paper answers came back.** `_audit/pre_answer_pass/` (17:29–17:37)
holds `variants[]` entries carrying **15 model answers** for the wordings a fold
moved onto another card — three mid-square, chi-square short note, poker test, two
"testing of random numbers", replication of runs, internal bias, why the output
must be analysed, plus four short ones. The current tree had **0 variants**: the
answer pass rewrote the chapter files from `data/tier_a_answers.json`, which only
owns the surviving card's answer, and dropped the rest. Nothing failed loudly,
because `renderPast` still emitted the "its own model answer" button for every
wording — the button simply opened an empty box.

They are now restored *as data* so they cannot be lost again the same way:
`tools/extract_variant_answers.js` derives `data/variant_answers.json` from the
snapshot (chapter + parent question text + the paper's wording + that paper's
answer), and `tools/merge_past.py::attach_variants()` re-attaches them on **every**
run — dry or `--apply` — making that file the single owner. Matching is on the
parent's normalised **text**, never its index (the fold re-sorts the arrays), and a
parent that no longer exists is a `SystemExit`, not a dropped answer. Verified:
`imported new 0`, `--apply` twice byte-identical, 15/15 answered and reachable by
text match, and in the browser **15 of 15 buttons now render and fill** — 1 in Ch1,
1 in Ch2, 1 in Ch4, 9 in Ch6, 3 in Ch7 (no Ch3/5/8 wording ever had its own).

**2. The mock exam now marks out of the total it claims.** `EXAM_WEIGHTS` sums to
60 and the paper does total 60 (400 shuffles, every one exactly 60), but four
chapters cannot hit their own weight: Ch 2 and Ch 4 have no combination of
answered questions adding to 6 (they make 4, 5, 9 or 10) and Ch 5/Ch 7 make 7.
The paper therefore sets, say, 5 marks for Ch 2 — while the breakdown row divided
by the **syllabus** 6 and the score divided by `EXAM.total`. A perfectly answered
Ch 2 read `5/6 marks`, and the bars did not sum to the denominator the header
showed. Now each bar divides by the marks **this paper actually set** for that
chapter, the row appends `(syllabus 6)` where that differs, and the blurb states
that the denominators add up to the total above. `EXAM_TOTAL`
(`EXAM_WEIGHTS.reduce`) is the one owner of that number — the two hardcoded `60`s
in the allocator and the dead `EXAM.target` / `EXAM.duration` fields are gone, so
the header, the score and the denominators cannot drift apart again.
Live check: a partial attempt self-marked to 26 marks returned `26/60 · 43%`, the
full paper returned `60/60 · 100%`, and the eight bars summed to exactly 60.

**3. The validator was blind to `index.html`.** Fixing the copy put a stray
apostrophe inside a single-quoted JS string, and `validate_site.py` passed
happily — `ch*.js` go through `node`, but the page holding the exam, quiz, search
and progress code was parsed by nothing. A syntax slip there ships a page that
renders the shell and then silently loses every tab. `check_index_script()` now
runs `node --check` over the inline script; it fails on exactly that apostrophe
and on an unbalanced brace, and passes on the current page.

### 2026-09-12 (P4 opened) — Ch8 and Ch2 diffed against the notes; a wrong GPSS symbol corrected

Being able to read the note images meant P4 could finally start. Ch8 and Ch2
were diffed page by page against the site; the findings table is in §5 P4.

**A real error, in four places.** The site taught that **GENERATE is drawn as a
triangle**. It is a **semicircle** (flat side down) — the notes draw it that way
on every GPSS page (n2 p50, p53–p57), and the only diamond in a GPSS diagram is
TRANSFER/TEST. The error was not only in the Learn table: it was also **the quiz
answer** (`options:[... "Triangle" ...], answer:2`) and **two past-question answer
tables**. All four now say semicircle, and the quiz explanation adds that the
circle is TERMINATE and the diamond is TRANSFER. Same class of bug as the
library data (§3.2e): a plausible figure that no source supports, sitting in a
place nobody had re-read.

**Ch8 content added (Learn 9.6 KB → 21.7 KB).**
* What GPSS is, in the notes' own terms: discrete clock, transactions passed from
  service to service, a network of blocks, **48 block types**, less flexible than
  SIMULA/SIMSCRIPT but easier and the most popular, built for **non-programmer
  analysts**, suited to factory problems.
* **Block operand syntax** — GENERATE A,B / QUEUE A / DEPART A / SEIZE A /
  RELEASE A / ADVANCE A,B / TERMINATE A / TRANSFER A,B,C — with the notes'
  meaning for each operand, which the shape-only table never gave.
* **Four worked GPSS programs** (the site had one, the bank queue): barber shop
  9 AM–4 PM in both its three-block and seven-block forms, plus how a 420-minute
  run is actually stopped; supermarket checkout; manufacturing shop with an
  inspector and 15 % rejects; soap testing with 90 % good. Each one names the
  probability trap — the TRANSFER operand is the *rejected* fraction.
* **SIMSCRIPT's seven-section program organization**, which is what the notes
  answer “how is a program organized in SIMSCRIPT?” with, plus the worked program
  they carry.

**Ch2 addition.** The p44–p45 material had been filed under Ch8. The Monte
Carlo-versus-stochastic comparison was already covered by §2.3, but the
**coin-toss game was missing entirely** — now worked in full: the digit mapping
(even → H, odd → T), the payoff `net = 8 − flips`, a hand-run of eight games, the
trap it exposes — **5 wins to 3 losses and still −Rs.8** — and the expectation
E[flips] = 3 × 3 = 9, so E[net] = −Rs.1 and the game should not be played.
`tools/check_ch2_coin_game.py` re-derives all of it, including a 200 000-game
check of the expectation.

**Verification.** `dump_chapters.js` parses; `validate_site.py` and `--strict`
pass; `merge_past.py` still reports `imported new 0`; both checker scripts pass;
and the new content was confirmed live in the browser — 10 code blocks in Ch8,
the coin table rendering 10 rows with the −8 total, no overflow.

### 2026-09-12 (later still) — Ch4 manual-simulation problems finished, invented data removed

**The finding that matters.** The 2010 C library card was carrying **givens that
exist in no source** — inter-arrival `5, 4, 2, 6, …`, service `6, 5, 4, 7, …` —
with answers to match (8.6 min / 13.6 min / 93.8 %). Both the paper and the class
notes give **probability distributions** instead
(arrivals 1→0.23, 2→0.37, 3→0.25, 4→0.15; service 1→0.10 … 6→0.05). The card was
answering a different question from the one that was asked. It is rebuilt from
the real question — see §3.2e for the record, including what the notes actually
compute (ρ = 1.366 → overloaded, Wq = −5.91, Ws = −2.74, P(busy) = 1.37) and why
those negative numbers are the lesson rather than a mistake.

**Reading the notes worked.** `read_files` returns the rendered note JPEGs
legibly, so n1 p39–p45 were read page by page rather than guessed at. That is
what surfaced the error above, and it also confirmed the figures that were
already right.

**Ch4 content, finished.**
* Bank 8-customer trace — verified row by row against n1 p40–p41; correct as it
  stood, so it keeps its numbers.
* Library 15-customer — rebuilt: interval tables, a re-derived 15-customer trace
  (avg wait 4.2 min, avg time in system 7.13 min, P(busy) = 44/48 = 91.7 %), the
  notes' mean-rate check, and a warning box covering the probability-above-1
  trap and the two different Wq formulas.
* Computer facility — gained the two random-number interval tables its 30-day run
  needs, plus a statement of what the mean-rate verification is for.
* The card's `q` and `occ[]` now quote the real 2010 C question.

**New tooling.** `tools/check_ch4_queuing.py` re-derives every Ch4 queuing figure
in one command and prints the notes' rounded convention beside the unrounded
value (§6). It failed on its first run — on its own hard-coded busy time — which
is the point of writing it down.

**A trap the rewrite set for the merge, and the rule that catches it.** Rewriting
the card to the paper's own wording dropped its similarity to the bank's short
summary of the same question
(0.30, against a 0.80 dedupe bar), so `merge_past.py` read the bank row as a
*new* question — `imported new 1`, which `--apply` would have turned into a
second card for the same question. The similarity rules cannot settle this case:
the bank row is the bank author's compression, and its numbers differ from the
card's. Lowering the threshold is the wrong fix, because it would also start
folding genuinely different questions (the three LCM parameter sets). So the
judgement is written down instead, in the same spirit as
`data/same_question_merges.json`:

* **`data/bank_row_aliases.json`** — curated `bank row → site card` pairs, each
  with the reason it exists. `merge_past.py` consults it before importing a bank
  row, and **fails loudly** if an alias points at a wording the chapter no longer
  carries (card renamed or deleted ⇒ the alias is stale).
* Checked all three ways it can behave: it resolves when the wording is present,
  it leaves unrelated bank rows alone, and it raises `SystemExit` on a stale
  alias.
* Result: `imported new 0` again, and `--apply` is a **byte-identical no-op** on
  all eight chapter files (md5 compared before and after).

**Verification.** `node tools/dump_chapters.js` parses; `validate_site.py` and
`--strict` both pass; the card was checked live in the browser: three tables
(4 + 6 + 15 rows), row 2 reads `17 → 1 min, 58 → 3 min, arrives 4, starts 5,
waits 1, departs 8, 4 in system`, and nothing overflows. One real bug was caught
by the validator on the way: the Step 1 `worked-calc` span was left unclosed.

### 2026-09-12 (later) — layout pass, one-question-one-card, first figure

**The user's list, and what happened to each item.**

1. *"UI throughout is distorted."* → Layout pass (§4.6). Reading column 760 →
   1180 px, quiz/past/analysis/exam to 1400 px, one-row topbar with the search on
   its own row when narrow, tab strip scrolls instead of wrapping. Checked for
   horizontal overflow at 390 / 777 / 1280 / 1440 / 1920 px on all five tabs:
   none. One real bug found by that check: a long question text pushed the card's
   chevron off the edge because `.pq-text` had no `min-width: 0`.
2. *"Make the left side compress on a click, and it stays like that, which is
   bad."* → The sidebar now has a real toggle: ☰ compresses it to a 72 px rail of
   chapter numbers and remembers the choice; under 1025 px the same button opens
   the drawer. Whatever state it was stuck in can now be changed in one click.
3. *"Text only in centre … make it full screen."* → §4.6.
4. *"The same past question is repeated multiple times."* → 54 cards folded,
   146 → 92 (§5 P2 items 10–12). Nothing deleted: every wording is on the card as
   an occurrence, and 15 folded questions kept their own model answer as a
   `variant`.
5. *"One click expand button to see more question of same type."* → Each card has
   "📄 Same question in N papers — show each wording" (one click), and a variant
   that has its own answer offers "its own model answer" inside that. The tab also
   has *Open every answer* / *Close every answer* / *Show every wording*.
6. *"Wording-to-wording is the wrong way you are using now."* → The old card put
   the occurrence block **above** the answer, so a card opened with a wall of
   near-identical quotes and the answer was below the fold. It is now: question →
   model answer → optional "same question in other papers".
7. *"See everything and complete what's left."* → P1 shipped (except confidence
   chips), P2 finished, P3 continued into Ch3/Ch4/Ch7, P5 started (Fig 1.1),
   docs refreshed. What is left is listed honestly in §5 and §7.

**Content corrections this pass**
* **Ch7 confidence interval was wrong.** S = 0.508 → **0.5244**, interval
  (3.67, 4.93) → **(3.65, 4.95)**: the squared deviations were divided by n
  instead of n − 1. The example is now a `.worked` block with the arithmetic
  shown, and a *common mistake* box states the correct divisor.
* **Ch3 pure-pursuit step formula had x and y swapped** — the fighter flew away
  from the bomber. Also unified the hit rule (the assumptions said 10 units, the
  algorithm said 100 m); both say 10 units now.
* Ch4 hospital M/M/1 (ρ, L, Lq, W, Wq, P₀, plus the L = λW cross-check) and the
  Honda–Yamaha Markov chain (P² and P³ multiplied out by hand, not "after
  calculation") are now `.worked` blocks. Every figure re-derived by script.

**One near-miss worth recording** (the reason the two guards below exist)

After the fold landed, re-running the generator resolved its index groups against
the *already folded* chapters. Positions had shifted, so the groups named the
wrong questions — "Explain the steps in a simulation study" paired with
"Differentiate between discrete and continuous system simulation" — and the next
apply folded 17 unrelated cards (92 → 75). It was caught by hashing `ch*.js`
before and after and seeing a diff, and fixed by restoring the backup that
`merge_past.py` takes before every write. Two guards now make that impossible:

* **The merge file is the source of truth, not the positions.**
  `tools/gen_same_question_merges.js` keeps the wording already in
  `data/same_question_merges.json` and only refreshes notes/refusals; positions are
  used on first generation alone, and `--from-dump=<pre-fold dump>` is the explicit
  way to rebuild them.
* **Nothing may vanish.**`tools/find_duplicates.py` exits with an error if a listed
  question is neither a card nor recorded on one (in its `occ[]` or `variants[]`).
  An already-applied group is reported as *already one card*, verified against the
  surviving card, rather than being applied a second time.

The rebuilt groups were re-derived from the pre-fold dump
(`node tools/dump_chapters.js > before.json`) and the pipeline then reported
`imported new 0` with `--apply` a byte-identical no-op on the 92-card state.

**New tooling / data**
* `data/same_question_merges.json` — 34 curated same-question groups plus 12
  recorded refusals. Generated from exact chapter texts by
  `tools/gen_same_question_merges.js`, so a typo cannot point at the wrong
  question.
* `tools/find_duplicates.py` folds those groups into the cluster file the merge
  reads, reports groups that were already applied as *already one card* (verified
  against the surviving card), and exits with an error if a listed question is
  neither a card nor recorded on one. Generated with
  `node tools/gen_same_question_merges.js --from-dump=<pre-fold dump>`; the file
  itself is the source of truth, not the positions.
* `tools/merge_past.py`: folds now carry `variants[]` (a folded question's own
  answer), and `already_present()` stops a bank twin of a folded question from
  being re-imported (`imported new 0`). Re-run twice: `ch*.js` byte-identical.
* `Simulation_Notes.pdf` is now **stale** — it predates all of this. Rebuild with
  `python build_pdf.py`.

### 2026-09-12 — P3 started: Chapter 6 numericals rewritten and re-derived
* Read the Ch6 note pages (n2 p1–p24 of 111) and rebuilt every numerical from
  them. Chapter 6's Learn content went from **8 inline `example-box` blocks to
  13 `.worked` blocks** (37 KB, was 15.7 KB): givens → numbered steps → boxed
  result, arithmetic in JetBrains Mono with `pre-wrap` so the columns line up.
* **Corrected a wrong chi-square example** — the observed frequencies did not
  match the 50 numbers printed in the question (see §3.2d). The notes' own
  tally summed to 45 instead of 50, so the fix required recounting from the
  list, not copying. Corrected result: χ² = 8.00 over ten intervals.
* **Added five numericals that existed only as formulas**: multiplicative CGM
  period (a=13, m=64 → period 8 for X₀=2 and 4 for X₀=4), the Hull–Dobell
  full-period check (a=12, c=5, m=26 → period 2, conditions fail), combined LCM
  (Z = 2, 11, 0, 1), auto-correlation (i=3, m=5, N=30 → ρ̂ = −0.1945,
  σ = 0.9916, Z₀ = −0.196), and a second run-test example (N=40 → a = 24,
  Z₀ = −0.89).
* Reseeded the mid-square example to X₀ = 1234 so it matches the class work and
  exercises the pad-to-8-digits rule.
* Reshaped the poker test around the probability derivation (720/270/10 out of
  1000) and the K–S test around D⁺ / D⁻, with the two-sample critical-value
  formula as a tip.
* Every figure was re-derived by script before being written down (run-test
  `a`, the χ² ledger, the auto-correlation products, both period searches, the
  mid-square chain). `validate_site.py --strict` passes; the blocks render
  correctly in the browser (verified by computed style — screenshots are
  unavailable while the Preview pane is not compositing).

### 2026-09-12 — paraphrase folding + a merge that is safe to re-run (P2, part 2)
* Added `tools/find_duplicates.py`: conservative paraphrase clustering. It only
  proposes a merge when one question's text is *contained in* the other (or is
  near identical). Output: `data/duplicate_clusters.json` — 5 clusters, plus 23
  related pairs explicitly **refused** (different numerical parameters ⇒
  different question, e.g. the three LCM items and the two different integrals).
* `tools/merge_past.py` folds each cluster into one card: **151 → 146** cards.
  The duplicate's wording, paper and marks are appended to the survivor's
  `occ[]`, so nothing is ever deleted or rewritten by us.
* Fixed three bugs that made folding silently destructive (§3.2c): index-based
  cluster members, re-import of a folded question from the bank, and
  fold-contributed occurrences being dropped on the next run. The merge is now
  **idempotent** — `--apply` twice leaves `ch*.js` byte-identical — and refuses
  to write if a fold removes more cards than were folded.
* `index.html`/`foundation.css` unchanged this round; the UI already renders the
  folded cards correctly (verified live: Ch1 "🔥 Asked 3×", "Asked in 2 papers —
  exact wording of each").
* `validate_site.py --strict` passes.

### 2026-09-12 — past-question occurrences (P2, part 1)
* Fixed `tools/import_question_bank.py`: the repeat-count regex only matched
  the plain `1` cells, so the 22 questions that actually repeat were imported as
  `repeats: 1` and the merge's "bank is authoritative" step was dead code.
  Bank now reports `{1:126, 2:3, 3:11, 4:7, 5:1}`.
* Added `tools/extract_occurrences.py`: splits the OCR'd papers into 8 distinct
  papers (collapsing 2014 F's duplicate scans), extracts 97 atomic question
  units, matches all 151 site questions against them, and writes
  `data/occurrences.json` + `data/occurrence_report.txt`.
  Result: **48 questions now carry 55 paper-level occurrences** (35 agree with
  the recorded count, 4 have more evidence, 13 repeat but no paper text traced).
* `tools/merge_past.py`: emits `occ[]` (`year`/`marks`/`q` per paper), keys it by
  question text (not index), raises `repeats` from the evidence but never
  lowers it, and writes backups to a dated `_audit/pre_merge_<date>/` folder so
  the original pre-merge wording is never overwritten.
* `index.html`: `🔥 Asked N×` badge with frequency colours, the papers shown in
  the collapsed row, an expander listing each paper's exact wording, and an
  explicit note when the bank's count exceeds the traced evidence. Search also
  matches on the years a question was asked in.
* Found (not yet fixed): the 151 entries contain paraphrase duplicates, so some
  questions still appear as two cards — the remaining half of "show 1".

### 2026-09-12 — design foundation (P0)
* Added `assets/fonts/` (Inter + JetBrains Mono, 6 woff2 subsets, 212 KB,
  self-hosted + offline) and `tools/fetch_fonts.py`.
* Added `assets/css/tokens.css` (Linear dark + matching light) and
  `assets/css/foundation.css` (reading column, prose rhythm, pills, tables,
  callouts, `.worked`, sidebar states, tab badges, floating nav).
* `index.html`: fonts now local (no Google CDN); the two inline theme blocks
  removed in favour of `tokens.css`; CSS links moved after `</style>`;
  dark is the default theme; logo gradient and confetti recoloured.
* `index.html` JS: `enhanceContent()` (`.table-scroll` wrapper + numeric cells),
  `updateTabBadges()`, `progress.seen` + in-progress sidebar state, floating
  jump-to-top / next-chapter buttons.
* Extracted `_source/note1.ocr.txt`, `_source/note2.ocr.txt`,
  `_source/past_questions.ocr.txt`; added `tools/render_notes.py` and mapped
  all 111 note pages to chapters (§2.3).
* Audited the past-question data: 151 entries, 23 with `repeats ≥ 2`, and
  **no per-occurrence detail** — this is what P2 fixes. Confirmed the bank has
  148 per-paper rows and that the OCR bundle contains duplicate scans of 2014 F
  (×3) and 2010 F (×2).
* `validate_site.py` (normal + `--strict`) passes.
