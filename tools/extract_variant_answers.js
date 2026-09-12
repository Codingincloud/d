// Recovers the per-paper model answers of folded questions from the pre-change
// snapshot and writes them to data/variant_answers.json.
//
// Why this exists: the answer pass that gave every card a full model answer
// dropped the `variants[]` blocks that carried the folded papers' own answers.
// 15 model answers became unreachable while index.html still rendered the
// "its own model answer" affordance for them, and for 10 of the 15 this snapshot
// is the ONLY surviving copy - data/tier_a_answers.json holds just 5.
//
// tools/merge_past.py reads data/variant_answers.json on every run and
// re-attaches the variants to their surviving card, so a later --apply can no
// longer drop them. This extractor is the documented provenance for that file
// and only needs re-running if the snapshot is the thing that changes.
//
//   node tools/extract_variant_answers.js --dry-run   # show what it would write
//   node tools/extract_variant_answers.js             # write data/variant_answers.json
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SNAPSHOT = path.join(ROOT, '_audit', 'pre_answer_pass');
const DEST = path.join(ROOT, 'data', 'variant_answers.json');

const variants = [];
for (let n = 1; n <= 8; n++) {
  const file = path.join(SNAPSHOT, 'ch' + n + '.js');
  if (!fs.existsSync(file)) continue;
  global.window = {};
  delete require.cache[require.resolve(file)];
  require(file);
  const past = (global.window.CHAPTERS[n] || {}).past || [];
  for (const p of past) {
    for (const v of p.variants || []) {
      if (!v.q || !v.answer) continue;
      variants.push({
        chapter: n,
        parent: p.q || '',
        year: String(v.year || ''),
        marks: String(v.marks == null ? '' : v.marks),
        q: v.q,
        answer: v.answer
      });
    }
  }
}

const doc = {
  _note: 'Per-paper model answers for the wordings that were folded into another card. ' +
         'Each entry names the surviving card in `parent` (matched by question TEXT, never by ' +
         'position - the fold re-sorts the arrays). tools/merge_past.py re-attaches these on ' +
         'every run, so a later --apply cannot drop them the way the answer pass did.',
  _source: 'tools/extract_variant_answers.js < _audit/pre_answer_pass/*.js',
  variants
};

if (process.argv.includes('--dry-run')) {
  console.log(JSON.stringify(doc.variants.slice(0, 2), null, 2));
  console.log('... ' + variants.length + ' variants across ' +
              new Set(variants.map(v => v.chapter)).size + ' chapters');
} else {
  fs.writeFileSync(DEST, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  console.log('wrote ' + path.relative(ROOT, DEST) + ' - ' + variants.length + ' variants');
}
