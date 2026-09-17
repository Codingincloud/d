#!/usr/bin/env node
/* ==========================================================================
   check_note_pages.js - every citation of the class notes resolves.

   The site teaches numbers that were read off handwritten pages, and each of
   those places carries a chip (data-page="n2p58" in the notes, `src:["n2p58"]`
   on a past card) that opens the page image in one click. Three things can go
   wrong, and all three are silent in the browser:

     1. a citation names an id no manifest entry defines  -> the chip is a
        button that does nothing (app.js toasts "No page ... in the notes
        index", which is a worse experience than the check failing here);
     2. a manifest entry is cited nowhere                  -> dead paperwork in
        assets/notes/, and the repository carries the weight for nothing;
     3. a manifest entry's page image was never built      -> a 404 inside the
        dialog, which is easy to miss because it only shows up on the click.

   It also holds the label in step with the manifest: the chip's visible text
   must be the manifest's own `p` value ("n2 p58"), so a reader never sees one
   page named two ways.

   The two halves of the contract are split by language: this script owns the
   content side (ch*.js citations, the label, the orphan rule) and
   `tools/build_note_pages.py --check` owns the artifact side (rebuildable,
   in sync with the manifest, no orphan images). Run both.

   Usage:  node tools/check_note_pages.js           # report + exit 1
           node tools/check_note_pages.js --quiet   # only the failures
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const QUIET = process.argv.includes('--quiet');

global.window = {};
for (let n = 1; n <= 8; n++) require('../ch' + n + '.js');

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'note_pages.json'), 'utf8'));
const pageById = new Map(manifest.pages.map((p) => [p.id, p]));

let problems = 0;
const fail = (msg) => {
  problems++;
  console.log('FAIL ' + msg);
};

/* 1 + 3. every citation resolves, and its image is on disk. */
const cited = new Map(); // id -> [where, ...]
function cite(id, where) {
  if (!cited.has(id)) cited.set(id, []);
  cited.get(id).push(where);
  if (!pageById.has(id)) {
    fail(`${where}: cites note page "${id}", which data/note_pages.json does not define`);
    return;
  }
  const file = path.join(ROOT, 'assets', 'notes', id + '.jpg');
  if (!fs.existsSync(file)) {
    fail(`${where}: cites "${id}" but assets/notes/${id}.jpg is not built ` +
         `(run python tools/build_note_pages.py)`);
  }
}

let chips = 0;
let cards = 0;
for (let n = 1; n <= 8; n++) {
  const ch = global.window.CHAPTERS[n];
  if (!ch) continue;

  /* Notes content, and quiz answers, which are chapters' other prose: the chip
     is <button class="page-chip" ... data-page="n2p58">n2 p58</button>. The
     label is checked against the manifest because two names for one page is
     exactly how a citation starts lying. */
  const prose = [['notes', ch.learn || '']];
  (ch.quiz || []).forEach((k, i) => {
    prose.push([`quiz[${i}] answer`, k.answer || '']);
    prose.push([`quiz[${i}] explanation`, k.explanation || '']);
  });
  (ch.past || []).forEach((q, i) => {
    prose.push([`past[${i}]`, q.answer || '']);
    (q.occ || []).forEach((o, j) => prose.push([`past[${i}] occ[${j}]`, o.answer || '']));
  });
  for (const [where, raw] of prose) {
    const html = typeof raw === 'string' ? raw : '';   // an answer may be a list of parts
    for (const m of html.matchAll(/<button[^>]*class="page-chip"[^>]*data-page="([^"]+)"[^>]*>([^<]*)<\/button>/g)) {
      chips++;
      const [, id, label] = m;
      cite(id, `ch${n} ${where}`);
      const p = pageById.get(id);
      if (p && label.trim() !== `n${p.note} p${String(p.page).padStart(2, '0')}`) {
        fail(`ch${n} ${where}: label "${label.trim()}" does not match the manifest's ` +
             `"n${p.note} p${String(p.page).padStart(2, '0')}" for ${id}`);
      }
    }
    if (/data-page="/.test(html) && !/class="page-chip"/.test(html)) {
      fail(`ch${n} ${where}: has data-page= markup that is not a .page-chip button`);
    }
  }

  /* Past cards: src:["n2p58"]. A bare string instead of an array is the easy
     mistake, so say so rather than skipping it. */
  (ch.past || []).forEach((q, i) => {
    if (q.src === undefined) return;
    cards++;
    if (!Array.isArray(q.src)) {
      fail(`ch${n} past[${i}]: src is ${typeof q.src}, expected an array of page ids`);
      return;
    }
    for (const id of q.src) cite(id, `ch${n} past[${i}]`);
  });
}

/* 2. nothing in the manifest is dead weight. */
const orphans = manifest.pages.filter((p) => !cited.has(p.id)).map((p) => p.id);
if (orphans.length) {
  fail(`data/note_pages.json lists ${orphans.length} page(s) no content cites: ${orphans.join(', ')}`);
}

/* The generated lookup is what the browser actually reads, so its ids are the
   ids the chips must be using. build_note_pages.py --check owns freshness; this
   owns agreement. */
try {
  const js = fs.readFileSync(path.join(ROOT, 'data', 'note_pages.js'), 'utf8');
  for (const id of cited.keys()) {
    if (!new RegExp(`"${id}"\\s*:`).test(js)) {
      fail(`data/note_pages.js has no entry for "${id}" — regenerate it`);
    }
  }
  if (/window\.NOTE_PAGES\s*=\s*\{\}/.test(js) && cited.size) {
    fail('data/note_pages.js is empty while ch*.js cites pages');
  }
} catch (e) {
  fail('data/note_pages.js is missing — run python tools/build_note_pages.py');
}

if (!QUIET) {
  console.log(
    `check_note_pages: ${cited.size} of ${manifest.pages.length} note page(s) cited ` +
    `(${chips} notes chip(s), ${cards} past card(s)) — ${problems} problem(s)`
  );
}
process.exit(problems ? 1 : 0);
