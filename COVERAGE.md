# Syllabus coverage — BCE7026 Simulation & Modeling

Course: **BCE7026 Simulation and Modeling**, Semester VII, B.E. Computer Engineering,
Purbanchal University. Full marks **60**, pass marks 24, duration 3:00 hrs,
40 lecture hours, 3 credits.

Chapter weights are taken from the past-question bank's table of contents, which
matches the weights already coded into `index.html`:

| Ch | Topic | Weight | Hours | Notes | Quiz | Past Q | With answer | Practice |
| :-: | :--- | :-: | :-: | ---: | :-: | :-: | :-: | :-: |
| 1 | Concept of Simulation | 8 | 6 | 16.4 KB | 10 | 12 | 12 | 0 |
| 2 | Monte Carlo Method | 6 | 4 | 26.7 KB | 10 | 8 | 8 | 0 |
| 3 | Simulation of Continuous Systems | 6 | 5 | 10.7 KB | 10 | 10 | 10 | 0 |
| 4 | Queuing System | 6 | 5 | 11.7 KB | 10 | 9 | 9 | 0 |
| 5 | Verification & Validation | 6 | 4 | 14.7 KB | 15 | 5 | 5 | 0 |
| 6 | Random Number Generation | 12 | 6 | 37.2 KB | 14 | 27 | 27 | 0 |
| 7 | Simulation Output Analysis | 6 | 5 | 9.0 KB | 10 | 6 | 6 | 0 |
| 8 | Simulation Language | 10 | 5 | 21.7 KB | 10 | 15 | 15 | 0 |
| | **Totals** | **60** | **40** | 148.1 KB | **89** | **92** | **92** | **0** |

Chapter weights sum to 60 and lecture hours sum to 40, both verified against
`index.html` by `tools/validate_site.py`.

**One question, one card.** The past-question count is 92 *cards*, not 92
questions found in the papers: 54 cards were folded away because they were the
same question asked again ("Short Note: GPSS", "Explain GPSS in brief with
suitable example" and "What is GPSS language & its application?" are one
question in three papers). Nothing was deleted — each folded wording lives on the
surviving card as an occurrence (`occ[]`), and where a folded wording had a model
answer of its own, that answer is kept as a `variants[]` entry behind one click.
The card counts model answers preserved: **all 92 cards carry a model answer**, and
**15 further answers** are kept as `variants[]` behind **13** of them — **107
answers in total**. The consolidation itself preserved the 86 answers the site had
at the time; the remaining 21 were written in the 2026-09-12 answer pass, which is
why the *Practice* column above is now zero. The groups, and the reasons for the
look-alike pairs that were deliberately *not* merged, are in
`data/same_question_merges.json`; the raw evidence is in
`data/duplicate_clusters.json`.

---

## Sub-topic matrix

Every sub-topic below is checked automatically: `python tools/validate_site.py --strict`
fails if any marker is missing from the corresponding chapter's notes.

### Chapter 1 — Concept of Simulation (8 marks)

| Sub-topic | Where it lives | Status |
| :--- | :--- | :-- |
| 1.1 Introduction / system simulation | `1.1 Introduction to Simulation` | present |
| 1.2 The System (components, events, types) | `1.2 The System` + 3 `h3`s | present |
| 1.3 Continuous vs discrete systems | `1.3 Continuous vs Discrete Systems` | present |
| 1.4 Deterministic vs stochastic systems | `1.4 Deterministic vs Stochastic Systems` | present |
| 1.5 Real-time simulation | `1.5 Real-Time Simulation` | present |
| 1.6 When to use / not use simulation | `1.6 When to Use Simulation` | present |
| 1.7 Types of simulation models | `1.7 Types of Simulation Models` | present |
| 1.8 Steps in a simulation study | `1.8 Steps in Simulation Study` | present |
| 1.9 Phases of a simulation study | `1.9 Phases of Simulation Study` | present |
| 1.10 Advantages | `1.10 Advantages of Simulation` | present |
| 1.11 Limitations | `1.11 Limitations of Simulation` | present |
| 1.12 Areas of application | `1.12 Areas of Application` | present |

### Chapter 2 — Monte Carlo Method (6 marks)

| Sub-topic | Where it lives | Status |
| :--- | :--- | :-- |
| 2.1 Monte Carlo method | `2.1 Monte Carlo Method` | present |
| ↳ steps, integration, π, business simulation | four `h3` blocks, all with worked tables | **expanded** |
| ↳ error, convergence, standard error, variance reduction | `Error and Convergence of Monte Carlo Estimates` | **new** |
| 2.2 Normally distributed random numbers | `2.2 Normally Distributed Random Numbers` | present |
| ↳ Box-Muller (with derivation + worked example) | `Box-Muller Transform`, `Solved Example: Box-Muller Transform` | **expanded** |
| ↳ Central Limit Theorem method (why 12 works) | `Why Summing 12 Uniform Numbers Works` | **expanded** |
| ↳ polar (Marsaglia) method, method comparison table | `Polar (Marsaglia) Method`, `Comparison of the Two Methods` | **new** |
| 2.3 Monte Carlo vs stochastic simulation | `2.3 Monte Carlo Method vs Stochastic Simulation` | present |

### Chapter 3 — Simulation of Continuous Systems (6 marks)

| Sub-topic | Where it lives | Status |
| :--- | :--- | :-- |
| 3.1 Pure pursuit problem | `3.1 A Pure Pursuit Problem` (assumptions, formulation, algorithm) | present |
| 3.2 Continuous system models | `3.2 Continuous System Models` | present |
| 3.3 Analog computer | `3.3 Analog Computer` | present |
| 3.4 Analog methods | `3.4 Analog Methods — Components` | present |
| 3.5 Hybrid simulation | `3.5 Hybrid Simulation` | present |
| 3.6 Feedback systems | `3.6 Feedback Systems` | present |
| 3.7 Differential equations | `3.7 Differential & Partial Differential Equations` | present |

### Chapter 4 — Queuing System (6 marks)

| Sub-topic | Where it lives | Status |
| :--- | :--- | :-- |
| 4.1 Elements | `4.1 Elements of Queuing System` | present |
| 4.2 Characteristics | `4.2 Characteristics of a Queuing System` | **added** (was folded into 4.1) |
| ↳ transient vs steady state, balking/reneging/jockeying | two concept boxes in 4.2 | **new** |
| 4.3 Types of queuing system | `4.3 Types of Queuing System` | present |
| 4.4 Kendall's notation | `4.4 Kendall's Notation` | present |
| 4.5 Measurement of system performance | `4.5 Measurement of System Performance` (9 formulas + solved example) | present |
| 4.6 Application of queuing systems | `4.6 Application of Queuing System` | present |
| 4.7 Markov chain | `4.7 Markov Chain` (properties + solved example) | present |

### Chapter 5 — Verification & Validation (6 marks) — *flagged high risk by the question bank*

| Sub-topic | Where it lives | Status |
| :--- | :--- | :-- |
| 5.1 Model building | `5.1 Model Building` | present |
| 5.2 Verification & validation | `5.2 Verification & Validation` (comparison table) | present |
| 5.3 Verification of models | `5.3 Verification of Simulation Models` | present |
| ↳ three classes of verification technique | `Three Classes of Verification Techniques` | **new** |
| ↳ static vs dynamic verification | `Static vs Dynamic Verification` table | **new** |
| ↳ degenerate / extreme-condition / continuity tests, trace, graphics | `Additional Checks` (4 concept boxes) | **new** |
| 5.4 Calibration & validation | `5.4 Calibration & Validation of Models` | present |
| ↳ three ways to validate the I/O transformation + Turing test | `Three Ways to Validate the Input–Output Transformation`, `The Turing Test in Simulation` | **new** |
| ↳ subjective vs objective validation | `Objective vs Subjective Validation` table | **new** |
| ↳ statistical comparison methods | `Statistical Methods for Comparing Model and System Output` | **new** |
| ↳ model confidence levels 0–3 (attributed to Sargent) | `Sargent's Model Confidence Levels` table | **new** — *unsourced; flagged in §5.4 as standard literature, not class notes* |
| ↳ sources of invalidity | `Why Validation is Difficult — Sources of Invalidity` | **new** |

Risk note: the bank records only **one** Ch5 past question (2025 M, 4 marks) while the
chapter carries 6 marks, so three additional syllabus-based questions were written and
labelled `General` (the same label the site already used for non-paper questions).

Consequence for the Mock Exam tab: because the Ch5 pool contains only 4, 5, 7 and 10-mark
questions, no combination adds to exactly 6. The exam allocator therefore solves a global
dynamic program over all eight chapters so that the assembled paper still totals exactly
**60 marks**, letting a chapter deviate from its weight by the smallest possible amount
(typically ±1) rather than leaving the paper short.

### Chapter 6 — Random Number Generation (12 marks)

| Sub-topic | Where it lives | Status |
| :--- | :--- | :-- |
| 6.1 Random numbers | `6.1 Random Numbers` | present |
| 6.2 Random number tables | `6.2 Random Number Tables` | present |
| 6.3 Pseudo-random numbers | `6.3 Pseudo Random Numbers` | present |
| 6.4 Generation of random numbers / LCM | `6.4 Generation of Random Numbers` + solved tables | present |
| 6.5 Mid-square method | `6.5 Mid-Square Random Number Generator` | present |
| 6.6 Qualities of a good RNG | `6.6 Qualities of an Efficient Random Number Generator` | present |
| 6.7–6.8 Testing for randomness | `6.7–6.8 Testing for Randomness` | **expanded** (hypothesis framework, test categories, frequency test) |
| ↳ hypothesis-testing framework, H₀/H₁, α | concept box in 6.7–6.8 | **new** |
| 6.9 Chi-square test | `6.9 Chi-Square Test` | present |
| 6.10 Auto-correlation test | `6.10 Testing for Auto-Correlation` | present |
| 6.11 Poker test | `6.11 Poker Test` | present |
| **Run test** | `6.12 Run Test (Runs Up and Down Test)` | **added — was missing entirely** |
| **Kolmogorov–Smirnov test** | `6.13 Kolmogorov–Smirnov (K–S) Test` | **added — was missing entirely** |
| ↳ choosing the right test | `Choosing the Right Test` table (6 tests) | **new** |

Course-level gap closed: the syllabus lists "Run Test & K–S Test" and both have already
appeared in past papers (2015 F and 2011 C / 2010 C) but neither existed anywhere in the
site. Both are now written up with full worked numericals over the **12-mark** chapter.

### Chapter 7 — Analysis of Simulation Output (6 marks)

| Sub-topic | Where it lives | Status |
| :--- | :--- | :-- |
| 7.1 Estimation methods | `7.1 Estimation Methods` | present |
| 7.2 Simulation run statistics | `7.2 Simulation Run Statistics` (batch means) | present |
| 7.3 Replication of runs | `7.3 Replication of Runs` | present |
| 7.4 Elimination of initial bias | `7.4 Elimination of Initial Bias` (warm-up problem) | present |

### Chapter 8 — Simulation Language (10 marks)

| Sub-topic | Where it lives | Status |
| :--- | :--- | :-- |
| 8.1 Simulation tools | `8.1 Basic Concept of Simulation Tools` | present |
| 8.2 CSSL / GPSS | `8.2 CSSLs and GPSS` | present |
| 8.3 Discrete systems modelling & simulation | `8.3 Discrete Systems Modeling and Simulation` | present |
| 8.4 Continuous systems modelling & simulation | `8.4 Continuous Systems Modeling and Simulation` | present |
| 8.5 Structural, data and control statements | `8.5 Structural, Data and Control Statements` (SIMSCRIPT) | present |
| 8.6 Feedback systems — typical applications | `8.6 Feedback Systems: Typical Applications` (distributed lag) | present |

---

## Past-question coverage

The site's own question set has been merged with the 148-question bank in
`_reference/Simulation_Modeling_Question_Bank.html`:

| Step | Result |
| :--- | :--- |
| Bank questions parsed | **148** across 9 papers (2010 F/C, 2011 F/C, 2012 C, 2014 F, 2015 F, 2019 F, 2025 M) |
| Already on the site (matched) | **52** |
| Imported as new | **90** (6 further bank rows were internal duplicates and skipped) |
| Site questions after the merge | **151** — 87 with model answers, 64 practice-only |
| Paraphrase duplicates folded | **−5** → **146** cards, 86 with model answers, 60 practice-only. Each folded wording is kept in the survivor's `occ[]` |
| Questions with paper-level occurrences | **51** (108 occurrences) across 8 distinct old papers |
| **Current state (after consolidation + answer pass)** | **92 cards, all with a model answer, 0 practice-only** |

The full per-chapter match report is in `data/qa_coverage.json`.

Answer-status rule used by the merge:

| Tier | Rule | Treatment |
| :--- | :--- | :--- |
| **A** | repeated **2+ times** in past papers, plus every question in Ch5 and Ch6 | full model answer written |
| **B** | everything else | imported with `answer: null` and `status: "pending"`, shown as a flagged practice question. The 2026-09-12 answer pass has since filled every one, so no Tier-B question remains pending |

---

## How to re-check all of this

```bash
python tools/validate_site.py            # structure, question data, HTML balance, coverage
python tools/validate_site.py --strict   # same, but coverage gaps become errors
python tools/import_question_bank.py     # rebuild data/question_bank.json + data/analysis.js
python tools/merge_past.py                # dry run + data/qa_coverage.json report
python tools/merge_past.py --apply        # rewrite the past arrays in ch*.js
python build_pdf.py --out Simulation_Notes.pdf   # printable PDF of all 8 chapters
```

`tools/merge_past.py --apply` backs up every chapter file to `_audit/pre_merge/` before
writing, and the merge is idempotent — running it again on already-merged files imports
nothing new.
