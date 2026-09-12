/* ===========================================================================
   gen_same_question_merges.js — build data/same_question_merges.json

   Why this exists
   ---------------
   "Show one question, however many times the papers asked it" needs a judgement
   that similarity scores cannot make: "Explain the mid square random number
   generator" and "Explain the Mid square method for generating random numbers
   with an example" are ONE exam question, while the three LCM questions with
   different parameters are three different questions that look alike. So the
   judgement is written down here, once, and the file it produces is what
   tools/find_duplicates.py feeds to tools/merge_past.py.

   The groups below name questions by their POSITION in ch<N>.js. Positions are
   used only here, at generation time, and are checked against the real text
   before anything is written — the file itself stores the exact text, so a later
   re-run of the merge never depends on a position.

   Usage (from the project root):
       node tools/gen_same_question_merges.js
   Then, to apply the groups:
       python tools/find_duplicates.py --json
       python tools/merge_past.py --apply
   =========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST = path.join(ROOT, 'data', 'same_question_merges.json');

/* --- the groups: [chapter, [ [indices...], "why" ], ...] ------------------ */
const SPEC = {
  1: [
    [[0, 9], 'Steps/phases of a simulation study - the "with a flowchart" variant is the same question'],
    [[3, 11], 'What simulation and modeling mean - the 3-mark version drops the "steps" half'],
    [[5, 10], 'Where simulation and modeling can be used / application areas'],
    [[6, 14], 'Types of simulation models (the 3+7 split repeats its own second half)'],
    [[4, 12], 'Real-time simulation + advantages and disadvantages'],
    [[7, 17, 18], 'Purposes and limitations of simulation (three papers, three cuts of one answer)'],
  ],
  2: [
    [[0, 1, 12], 'pi by Monte Carlo from x^2+y^2=16 (and the bare "estimate pi" version)'],
    [[2, 3], 'Monte Carlo against stochastic simulation'],
    [[4, 5, 11], 'Purpose / significance / basic philosophy of Monte Carlo'],
    [[6, 7], 'Green-vegetable shopkeeper simulation - one question, two records'],
    [[8, 14], 'Integral of cos x from 0 to pi/2 by Monte Carlo'],
  ],
  3: [
    [[0, 4, 12, 17, 18], 'Feedback system - short note, "with application", "with example", the hybrid pairing and the applications+GPSS variant'],
    [[1, 8, 16], 'Continuous system simulation'],
    [[2, 5, 13], 'Differential equations in simulation'],
    [[3, 14, 20], 'Pure pursuit problem'],
    [[6, 7], 'Analog against hybrid simulation (both 2025 M, one is a longer version of the other)'],
  ],
  4: [
    [[1, 2], 'Purbanchal computing-facility failure/repair simulation'],
    [[4, 7], 'Elements / characteristics of a queuing system'],
    [[5, 11], "Kendall's notation"],
    [[6, 9], 'Bank counter simulation for 8 customers'],
  ],
  6: [
    [[0, 1], 'Methods used for testing random numbers'],
    [[3, 11, 15, 25], 'Mid-square generator (the 2011 C version also asks what goes wrong with it)'],
    [[9, 16], 'Qualities of a good / efficient random number generator'],
    [[6, 23], 'What a pseudo-random number is'],
    [[12, 26], 'Why the randomness of numbers has to be tested'],
    [[20, 29], 'Poker test on 1000 three-digit numbers (680/289/31) - the same numerical twice'],
    [[27, 28], 'Significance of the chi-square test / short note on it'],
  ],
  7: [
    [[0, 10], 'Why simulation output has to be analysed'],
    [[1, 6, 14], 'Why output analysis + replication of runs (+ initial bias) as one compound question'],
    [[2, 5, 7, 12, 15], 'Replication of runs - why it is needed, how it is done, its mathematical model'],
    [[3, 8, 11, 13, 16], 'Initial bias and its elimination (the papers write "internal" for "initial")'],
  ],
  8: [
    [[1, 4, 7, 18], 'GPSS as a language - short note, features, "in brief with example", applications'],
    [[2, 8], 'GPSS block-diagram symbols'],
    [[3, 14], 'Discrete-event / discrete system simulation - principle, components and organisation'],
  ],
};

/* Pairs that look similar and must NOT fold: each carries content the other does
   not, and merging them would delete a real question. Kept in the file so the
   refusal is as visible as the merges. */
const REFUSED = [
  [1, 'Differentiation questions kept apart: "continuous vs discrete system simulation", "deterministic vs stochastic simulation" and "the concept of a system plus all four comparisons" are three separate answers.'],
  [1, '"Define real time simulation + advantages/disadvantages" and "advantages/disadvantages + purposes" stay separate: the first half of each is its own question.'],
  [2, 'Monte Carlo integrals stay separate when the integrand or the limits differ (cos x, 1^e, (x+4)^3 from 1 to 4).'],
  [2, 'Box-Muller / normal-generation and the vegetable-shopkeeper numbers are single questions with their own parameters.'],
  [3, 'Analog-method numericals (the X1/X2/X3 system, Ax+Bx+Cx+D=0) and the analogy method note stay separate.'],
  [4, 'The library 15-customer table, the hospital M/M/1 case and the 30-day machine-failure case are three different simulations.'],
  [6, 'The three LCM/multiplicative questions differ in their parameters (a=12/c=5/m=26, a=13/m=64, a=17/m=64): same topic, different answers.'],
  [6, 'The auto-correlation questions sample different positions (2nd/7th/12th, 3rd/8th/13th, 2nd/9th/16th), so they are different numericals.'],
  [6, '"Poker test" as a short note and the poker-test numerical stay separate: one is theory, the other is a worked test.'],
  [6, 'The Kolmogorov-Smirnov steps note and the K-S numerical stay separate.'],
  [7, 'Estimation method and run statistics are their own topics, not repetitions of output analysis.'],
  [8, 'SIMSCRIPT, CSSL and the simulation-tools list are separate languages/topics; only the GPSS questions fold together.'],
];

/* Positions refer to the chapter BEFORE any folding. If the chapters on disk are
   already folded, pass a dump of the unfolded state instead:

       node tools/dump_chapters.js > /tmp/before.json     # before folding
       node tools/gen_same_question_merges.js --from-dump=/tmp/before.json
*/
const dumpArg = process.argv.find(a => a.startsWith('--from-dump='));

function loadChapters() {
  if (dumpArg) {
    const dumped = JSON.parse(fs.readFileSync(dumpArg.split('=')[1], 'utf8'));
    console.log('resolving positions against ' + dumpArg.split('=')[1]);
    return dumped;
  }
  const out = {};
  for (let n = 1; n <= 8; n++) {
    const file = path.join(ROOT, 'ch' + n + '.js');
    global.window = {};
    delete require.cache[require.resolve(file)];
    require(file);
    out[n] = global.window.CHAPTERS[n] || { past: [] };
  }
  return out;
}

const CH = loadChapters();
const out = {
  note: 'Curated same-question groups. Generated by tools/gen_same_question_merges.js from exact chapter texts; edit the SPEC there and regenerate, never hand-type a question here.',
  generated: new Date().toISOString().slice(0, 10),
  chapters: {},
  refused: [],
};

/* ===========================================================================
   IMPORTANT: indices are only ever used on FIRST generation.

   Once the groups have been applied, every group has folded down to a single
   card, so position 14 in the array is no longer the question position 14 meant
   when SPEC was written. Re-resolving the indices then silently pairs unrelated
   questions - which is exactly how a run on 2026-09-12 folded 17 wrong cards
   ("Explain the steps in a simulation study" merged with "Differentiate between
   discrete and continuous system simulation"). The stored file is therefore the
   source of truth from then on; `--reindex` is the deliberate opt-in for the
   day someone really does want to rebuild the groups from positions (and it
   should be run against unfolded chapters).
   =========================================================================== */
const existing = fs.existsSync(DEST) ? JSON.parse(fs.readFileSync(DEST, 'utf8')) : null;
const REINDEX = process.argv.includes('--reindex') || !!dumpArg;
const kept = [];

for (const [ch, groups] of Object.entries(SPEC)) {
  const past = (CH[ch] || {}).past || [];
  const before = (existing && existing.chapters && existing.chapters[ch]) || [];
  out.chapters[ch] = groups.map(([idxs, note], gi) => {
    const old = before[gi];
    const stored = old && Array.isArray(old.q) ? old.q : null;
    if (stored && !REINDEX) {
      if (stored.length !== idxs.length) {
        throw new Error('ch' + ch + ' group ' + (gi + 1) + ': the stored group has ' +
          stored.length + ' questions but SPEC now lists ' + idxs.length +
          ' - fix one of them, the two disagree.');
      }
      kept.push('ch' + ch + ' group ' + (gi + 1));
      return { note, q: stored };
    }
    const missing = idxs.filter(i => !past[i]);
    if (missing.length) {
      throw new Error('ch' + ch + ' group ' + (gi + 1) + ': index ' + missing[0] +
        ' does not exist in the current ch' + ch + '.js. The chapter is probably ' +
        'already folded - the stored wordings are used instead unless you pass ' +
        '--reindex.');
    }
    return { note, q: idxs.map(i => past[i].q) };
  });
}
for (const [ch, reason] of REFUSED) out.refused.push({ chapter: ch, reason });

const dest = path.join(ROOT, 'data', 'same_question_merges.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 1) + '\n', 'utf8');

const groups = Object.values(out.chapters).reduce((a, g) => a + g.length, 0);
const groupsTotal = groups;
const folded = Object.values(out.chapters)
  .reduce((a, g) => a + g.reduce((b, c) => b + c.q.length - 1, 0), 0);
console.log(`wrote ${path.relative(ROOT, dest)}`);
console.log(`same-question groups: ${groups}   cards they fold away: ${folded}`);
console.log(`look-alike pairs deliberately left apart: ${REFUSED.length}`);
if (kept.length && !REINDEX) {
  console.log('kept the wording already in the file for ' + kept.length +
    ' of ' + groupsTotal + ' groups (indices are only used on first generation).');
}
