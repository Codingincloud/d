// The executable contract for engine.js (window.SM) — the app's pure logic.
//
// Run:  node tools/test_engine.js
//
// Loads engine.js the way tools/dump_chapters.js loads the chapter files: a
// fresh vm context with a `window` global, so none of it needs a browser. Every
// assertion below is a behaviour the app depends on, and the marking ones exist
// because the breakdown bars once divided by the syllabus weight while the score
// divided by the paper's total — a defect no eye caught until an audit.
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..');

function loadEngine() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(dir, 'engine.js'), 'utf8'), ctx, { filename: 'engine.js' });
  return ctx.window.SM;
}

function loadChapters() {
  const out = {};
  for (let n = 1; n <= 8; n++) {
    const file = path.join(dir, 'ch' + n + '.js');
    global.window = {};
    delete require.cache[require.resolve(file)];
    require(file);
    out[n] = global.window.CHAPTERS[n] || null;
  }
  return out;
}

let checks = 0;
const failures = [];

function ok(label, condition, detail) {
  checks++;
  if (!condition) failures.push(label + (detail === undefined ? '' : ' — ' + detail));
  console.log("  [" + (condition ? 'ok' : 'XX') + "] " + label + (condition || detail === undefined ? '' : '  (' + detail + ')'));
}

function eq(label, got, want) {
  ok(label, JSON.stringify(got) === JSON.stringify(want), 'got ' + JSON.stringify(got) + ', want ' + JSON.stringify(want));
}

// A deterministic shuffle: the allocator has to reach the same paper twice.
function seeded(seed) {
  let s = seed;
  return (a) => {
    const out = a.slice();
    for (let i = out.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const j = s % (i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
}

function main() {
  const SM = loadEngine();
  const CH = loadChapters();

  console.log("1. The paper's total is the sum of its weights, never a separate literal");
  eq("EXAM_WEIGHTS is the 8 syllabus weights", SM.EXAM_WEIGHTS, [8, 6, 6, 6, 6, 12, 6, 10]);
  eq("EXAM_TOTAL = sum(EXAM_WEIGHTS)", SM.EXAM_TOTAL, SM.EXAM_WEIGHTS.reduce((a, b) => a + b, 0));
  eq("EXAM_TOTAL = 60", SM.EXAM_TOTAL, 60);

  console.log("\n2. marksOf reads the paper's marks, including compound ones");
  const marksTable = [["5", 5], ["2+8", 10], ["4+3+3", 10], ["10", 10], ["", 2], [undefined, 2], ["0", 2], [null, 2]];
  for (const [input, want] of marksTable) {
    ok("marksOf(" + JSON.stringify(input) + ") = " + want, SM.marksOf(input) === want, "got " + SM.marksOf(input));
  }

  console.log("\n3. buildPaper: 60 marks, from the chapters' own answered questions");
  const papers = [];
  for (let seed = 1; seed <= 60; seed++) papers.push(SM.buildPaper(CH, { shuffle: seeded(seed) }));
  const bad = papers.filter(items => SM.paperScore(items, {}).total !== SM.EXAM_TOTAL);
  ok("every paper totals EXAM_TOTAL", bad.length === 0, bad.length + " papers off");
  const sizes = papers.map(p => p.length);
  ok("papers have between 8 and 40 questions", Math.min(...sizes) >= 8 && Math.max(...sizes) <= 40,
     "min " + Math.min(...sizes) + ", max " + Math.max(...sizes));
  const chaptersSeen = new Set();
  papers.forEach(p => p.forEach(i => chaptersSeen.add(i.ch)));
  eq("all 8 chapters are represented across the papers", [...chaptersSeen].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8]);
  const everyItem = papers.every(p => p.every(i => i.q && i.marks > 0 && i.q.answer));
  ok("every question on a paper has a model answer and a positive mark value", everyItem);
  const offWeight = new Set();
  papers.forEach(p => SM.paperScore(p, {}).byChapter.forEach(c => {
    if (c.avail !== SM.EXAM_WEIGHTS[c.ch - 1]) offWeight.add(c.ch);
  }));
  eq("only the chapters whose pool cannot hit their weight deviate", [...offWeight].sort((a, b) => a - b), [2, 4, 5, 7]);

  console.log("\n4. paperScore: the marking is out of what the paper actually set");
  const paper = SM.buildPaper(CH, { shuffle: seeded(7) });
  const bare = SM.paperScore(paper, {});
  eq("an unmarked paper scores 0", bare.score, 0);
  eq("its total is the sum of the questions' marks", bare.total, paper.reduce((a, i) => a + i.marks, 0));
  const barSum = bare.byChapter.reduce((a, c) => a + c.avail, 0);
  eq("the breakdown denominators sum to the paper's total", barSum, bare.total);
  const perfect = {};
  paper.forEach((_, i) => { perfect[i] = true; });
  const all = SM.paperScore(paper, perfect);
  eq("a fully marked paper scores its total", all.score, all.total);
  eq("every bar then reads 100%", all.byChapter.every(c => c.got === c.avail), true);
  eq("markedCount counts the marked questions", all.markedCount, paper.length);
  // Partial marking is the case the old bug mis-reported: a chapter the paper set
  // 5 marks for must read x/5, not x/syllabus-weight-6.
  const ch2 = paper.map((i, idx) => (i.ch === 2 ? idx : null)).filter(x => x !== null);
  const partialMark = {};
  ch2.forEach(i => { partialMark[i] = true; });
  const partial = SM.paperScore(paper, partialMark);
  const bar2 = partial.byChapter.find(c => c.ch === 2);
  ok("a chapter answered perfectly reads its own marks, not the syllabus weight",
     bar2.got === bar2.avail, bar2.got + "/" + bar2.avail + " (syllabus " + SM.EXAM_WEIGHTS[1] + ")");
  eq("the score is the marked questions' marks", partial.score, bar2.avail);
  eq("unmarked chapters read 0", partial.byChapter.filter(c => c.ch !== 2).every(c => c.got === 0), true);
  eq("out-of-range marks are ignored", SM.paperScore(paper, { 9999: true }).score, 0);
  eq("a chapter the paper never set is absent from the breakdown",
     bare.byChapter.length <= 8 && bare.byChapter.every(c => c.avail > 0), true);

  console.log("\n5. quizScore counts right, wrong and unanswered");
  const quiz = [{ answer: 0 }, { answer: 1 }, { answer: 2 }, { answer: 3 }];
  const quizTable = [
    ["all four right", { 0: 0, 1: 1, 2: 2, 3: 3 }, { correct: 4, wrong: 0, answered: 4, pct: 100 }],
    ["all four wrong", { 0: 1, 1: 2, 2: 3, 3: 0 }, { correct: 0, wrong: 4, answered: 4, pct: 0 }],
    ["two right, one wrong, one skipped", { 0: 0, 1: 9, 2: 2 }, { correct: 2, wrong: 1, answered: 3, pct: 50 }],
    ["nothing answered", {}, { correct: 0, wrong: 0, answered: 0, pct: 0 }],
  ];
  for (const [label, answers, want] of quizTable) {
    const got = SM.quizScore(quiz, answers);
    eq(label, { correct: got.correct, wrong: got.wrong, answered: got.answered, pct: got.pct }, want);
  }
  eq("an empty quiz does not divide by zero", SM.quizScore([], {}), { total: 0, answered: 0, wrong: 0, correct: 0, pct: 0 });
  eq("the denominator is the quiz length, unanswered included", SM.quizScore(quiz, { 0: 0 }).total, 4);

  console.log("\n6. search matches the expected term, and only from two characters");
  const idx = SM.buildIndex(CH, ['Concept of Simulation', 'Monte Carlo Method', 'Continuous Systems',
    'Queuing System', 'Verification & Validation', 'Random Number Generation',
    'Simulation Output Analysis', 'Simulation Language']);
  ok("the index has entries for every chapter", idx.length > 100, idx.length + " entries");
  const chi = SM.search(idx, 'chi-square');
  ok("'chi-square' finds the Chi-Square note", chi.length > 0 && chi.some(e => /chi-?square/i.test(e.title)),
     chi.length + " hits");
  eq("'CHI-SQUARE' matches the same entries (case-insensitive)",
     SM.search(idx, 'CHI-SQUARE').map(e => e.title), chi.map(e => e.title));
  ok("'gpss' finds the simulation-language chapter", SM.search(idx, 'gpss').length > 0);
  eq("a one-character term matches nothing", SM.search(idx, 'x'), []);
  eq("an empty term matches nothing", SM.search(idx, '   '), []);
  ok("results are capped", SM.search(idx, 'simulation').length <= SM.SEARCH_LIMIT, SM.search(idx, 'simulation').length);
  const synth = [{ title: 'alpha', snip: 'beta' }, { title: 'gamma', snip: 'alpha beta' }];
  eq("a title hit outranks a snippet hit", SM.search(synth, 'alpha')[0].title, 'alpha');

  console.log("\n" + (failures.length ? failures.length + " FAILURE(S):" : "All " + checks + " engine contracts hold. OK"));
  failures.forEach(f => console.log("  - " + f));
  return failures.length ? 1 : 0;
}

if (require.main === module) process.exit(main());
