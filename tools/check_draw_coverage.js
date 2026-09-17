#!/usr/bin/env node
/* ==========================================================================
   check_draw_coverage.js - every past question that asks you to draw, draws.

   check_figures.js checks the figures that exist. This checks that the ones
   that must exist do: it scans every past card's wording - the canonical `q`
   *and* every paper wording in `occ[]`, because a paper can ask for a drawing
   the canonical wording does not mention - and fails when a card that asks for
   a figure has none in its answer.

   The detector is about the verb or the object, never about a topic:
     draw / sketch / illustrate / plot
     flow chart, flowchart
     diagram (which also catches "block diagram")
     "GPSS symbols" (the 2012 C wording asks for a figure without ever saying
                     the word "diagram")

   The rule is meant to hold with no exceptions, so a genuine exception has to
   be written down with its reason in data/draw_exceptions.json:

     [{"where": "ch8 past[1]", "reason": "…"}]

   and a stale entry is a failure in its own right: an exception whose card no
   longer matches, or whose card now has a figure, is dead paperwork and is
   reported rather than left to rot.

   Usage:  node tools/check_draw_coverage.js          # report + exit 1
           node tools/check_draw_coverage.js --quiet  # only the failures
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const QUIET = process.argv.includes('--quiet');

global.window = {};
for (let n = 1; n <= 8; n++) require('../ch' + n + '.js');

const DRAW = /\b(draw|sketch|illustrate|plot)\b|\bflow ?chart\b|\bblock[- ]?diagram\b|\bdiagram\b|gpss symbols/i;

let problems = 0;
function fail(msg) {
  problems++;
  console.log('FAIL  ' + msg);
}

/* The curated exceptions, if any. */
const exceptions = new Map(); // where -> reason
const exPath = path.join(ROOT, 'data', 'draw_exceptions.json');
if (fs.existsSync(exPath)) {
  for (const e of JSON.parse(fs.readFileSync(exPath, 'utf8'))) {
    if (!e.where || !e.reason) {
      fail(`data/draw_exceptions.json: every entry needs both "where" and "reason"`);
      continue;
    }
    if (exceptions.has(e.where)) fail(`data/draw_exceptions.json: ${e.where} is listed twice`);
    exceptions.set(e.where, e.reason);
  }
}
const used = new Set();

let asked = 0;
let drawn = 0;
const unanswered = [];

for (let n = 1; n <= 8; n++) {
  const c = global.window.CHAPTERS[n];
  if (!c) continue;
  (c.past || []).forEach((p, i) => {
    const where = `ch${n} past[${i}]`;
    const wordings = [p.q || '', ...(p.occ || []).map((o) => o.q || '')];
    const hits = [...new Set(wordings.filter((w) => DRAW.test(w)))];
    if (!hits.length) return; // does not ask for a drawing
    asked++;

    const hasFigure = /<svg\b/.test(p.answer || '');
    if (hasFigure) {
      drawn++;
      if (exceptions.has(where)) {
        used.add(where); // so the stale-entry pass does not report it twice
        fail(
          `${where} is listed as needing no figure, but it has one now — ` +
          `remove the entry from data/draw_exceptions.json`
        );
      }
      return;
    }
    if (exceptions.has(where)) {
      used.add(where);
      return;
    }
    unanswered.push({ where, year: p.year, q: p.q || '', hits });
  });
}

for (const u of unanswered) {
  fail(`${u.where} (${u.year}) asks for a drawing but its answer has no figure:`);
  console.log(`        q:   ${u.q.slice(0, 100)}`);
  for (const h of u.hits) console.log(`        hit: ${h.slice(0, 110)}`);
}

for (const [where, reason] of exceptions) {
  if (used.has(where)) continue;
  if (!unanswered.some((u) => u.where === where)) {
    fail(`data/draw_exceptions.json: ${where} no longer matches the detector — stale exception ("${reason}")`);
  }
}

if (!QUIET) {
  console.log(
    `check_draw_coverage: ${asked} past cards ask for a drawing, ${drawn} carry one, ` +
    `${used.size} exception(s) — ${problems} problem(s)`
  );
} else if (problems) {
  console.log(`check_draw_coverage: ${problems} problem(s)`);
}
process.exit(problems ? 1 : 0);
