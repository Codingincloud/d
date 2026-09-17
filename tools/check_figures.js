#!/usr/bin/env node
/* ==========================================================================
   check_figures.js - re-derive the contract every inline-SVG figure must meet.

   Thirteen figures were added by hand, so the rules that keep them one set are
   worth re-deriving instead of trusting. This is the headless half of the job;
   it cannot measure type, so it checks only what is exactly checkable:

     1. one <svg> and one <figcaption> per <figure>, and no <svg> outside one;
     2. <svg role="img"> with a descriptive aria-label and a sane viewBox;
     3. every marker id is defined once in the whole site, and every
        marker-end/start/mid reference resolves inside its own figure;
     4. no colour is written into a figure: no style="", no fill="#...",
        no stroke="#..." - a figure's colour comes from a class token only;
     5. every <text> carries a class (an unstyled <text> renders browser-black
        in both themes), and its box does not leave the viewBox;
     6. every caption's number exists in plan.md's figure table (and vice
        versa), and the numbers appear in reading order: a number seen for the
        first time is always greater than the greatest seen so far. A figure
        reused in a past answer keeps its number and is allowed to repeat.

   Widths are estimated per character and the estimate is deliberately a little
   wide; a box must exceed its viewBox by more than SLACK units to fail. Boxes
   whose position is set by a transform (the rotated axis labels) are skipped:
   their rendered box cannot be derived without a layout engine. The estimate
   is calibrated against the browser-measured widths of the current figures.

   Usage:  node tools/check_figures.js          # report + exit 1 on a failure
           node tools/check_figures.js --quiet  # only the failures
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const QUIET = process.argv.includes('--quiet');
const SLACK = 8; // units of viewBox overflow tolerated before failing

global.window = {};
for (let n = 1; n <= 8; n++) require('../ch' + n + '.js');

/* ---- the width estimate -------------------------------------------------
   Advance widths in em, by class of character. A monospaced face is a flat
   0.60 em, which is exact for JetBrains Mono. For the sans face the values are
   the average of the browser-measured widths of the strings already on the
   site, rounded up on the ambiguous characters so the estimate stays a little
   wide rather than a little narrow. */
function advance(ch) {
  if (ch === ' ') return 0.28;
  if ('iljftr'.includes(ch)) return 0.33;
  if ('mw'.includes(ch)) return 0.86;
  if ('IJ'.includes(ch)) return 0.30;
  if ('MW'.includes(ch)) return 0.88;
  if (ch >= 'a' && ch <= 'z') return 0.55;
  if (ch >= 'A' && ch <= 'Z') return 0.70;
  if (ch >= '0' && ch <= '9') return 0.60;
  if ('.,:;!|\'`"()[]'.includes(ch)) return 0.28;
  if ('-\u2212\u2013\u2014'.includes(ch)) return 0.75;
  return 0.72; // arrows, middle dots, Greek, the × of a gain block
}

function estWidth(text, size, mono) {
  if (mono) return text.length * 0.60 * size;
  let em = 0;
  for (const ch of text) em += advance(ch);
  return em * size;
}

/* Font size from the classes a figure uses. Anything without a recognised
   class is treated as the body 13px, which is the largest of the four, so an
   unknown class can only make the estimate wider, never narrower. */
function fontOf(attrs) {
  const mono = /class="[^"]*\bmono\b/.test(attrs);
  let size = 13;
  if (/\bsm\b/.test(attrs)) size = 11;
  if (mono) size = 12;
  if (/\bflow-text\b/.test(attrs)) size = 15;
  if (/\bflow-label\b/.test(attrs)) size = 11.5;
  return { mono, size };
}

/* ---- collect every figure, in reading order ---------------------------- */
const occurrences = [];
for (let n = 1; n <= 8; n++) {
  const c = global.window.CHAPTERS[n];
  if (!c) continue;
  if (c.learn) occurrences.push({ ch: n, where: 'learn', html: c.learn });
  (c.past || []).forEach((p, i) => {
    if (p.answer) occurrences.push({ ch: n, where: `ch${n} past[${i}]`, html: p.answer });
    (p.variants || []).forEach((v, j) => {
      if (v.answer) occurrences.push({ ch: n, where: `ch${n} past[${i}].variants[${j}]`, html: v.answer });
    });
  });
}

let problems = 0;
let figures = 0;
let markerCount = 0;
let textCount = 0;
const markerIds = new Map(); // id -> where last seen
const captions = []; // { num, ch, where }

function fail(msg) {
  problems++;
  console.log('FAIL  ' + msg);
}

for (const occ of occurrences) {
  const figuresIn = [...occ.html.matchAll(/<figure[\s\S]*?<\/figure>/g)].map((m) => m[0]);
  const svgTotal = (occ.html.match(/<svg\b/g) || []).length;
  if (svgTotal > figuresIn.length) {
    fail(`${occ.where}: ${svgTotal} <svg> but only ${figuresIn.length} <figure> — a figure must be wrapped`);
  }

  figuresIn.forEach((fig, index) => {
    figures++;
    const tag = `${occ.where} figure#${index + 1}`;
    const svgTags = [...fig.matchAll(/<svg\b([^>]*)>/g)];
    const captionsIn = [...fig.matchAll(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/g)];

    if (svgTags.length !== 1) return fail(`${tag}: expected exactly one <svg>, found ${svgTags.length}`);
    if (captionsIn.length !== 1) return fail(`${tag}: expected exactly one <figcaption>, found ${captionsIn.length}`);

    const attrs = svgTags[0][1];
    const body = fig.slice(fig.indexOf('>', fig.indexOf('<svg')) + 1);

    /* 2. role / aria-label / viewBox */
    if (!/role="img"/.test(attrs)) fail(`${tag}: <svg> has no role="img"`);
    const aria = (attrs.match(/aria-label="([^"]*)"/) || [])[1] || '';
    if (aria.trim().length < 20) fail(`${tag}: aria-label is missing or too short ("${aria}")`);
    const vb = (attrs.match(/viewBox="([^"]*)"/) || [])[1];
    if (!vb) return fail(`${tag}: <svg> has no viewBox`);
    const box = vb.trim().split(/[\s,]+/).map(Number);
    if (box.length !== 4 || box.some((v) => !isFinite(v)) || box[2] <= 0 || box[3] <= 0) {
      return fail(`${tag}: viewBox "${vb}" is not four numbers with a positive extent`);
    }
    const [vx, vy, vw, vh] = box;

    /* 4. colour comes from a class, never from the markup */
    if (/style="/.test(fig)) fail(`${tag}: inline style= inside a figure — use a class token`);
    const hex = fig.match(/(?:fill|stroke)="#[0-9a-fA-F]{3,8}"/g);
    if (hex) fail(`${tag}: hard-coded colour ${hex.join(', ')} inside a figure`);

    /* 3. markers */
    const defined = new Set([...body.matchAll(/<marker[^>]*\bid="([^"]+)"/g)].map((m) => m[1]));
    for (const id of defined) {
      markerCount++;
      if (markerIds.has(id)) fail(`${tag}: marker id "${id}" is already used in ${markerIds.get(id)}`);
      markerIds.set(id, tag);
    }
    for (const ref of body.matchAll(/marker-(?:end|start|mid)="url\(#([^)]+)\)"/g)) {
      if (!defined.has(ref[1])) fail(`${tag}: marker-end references #${ref[1]}, which is not defined in this figure`);
    }

    /* 5. text: classed, and inside the viewBox */
    for (const t of body.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
      textCount++;
      const tAttrs = t[1];
      const text = t[2].replace(/<[^>]*>/g, '');
      if (!/class="/.test(tAttrs)) fail(`${tag}: <text> "${text.slice(0, 24)}" has no class (it would render browser-black)`);
      if (/\btransform="/.test(tAttrs)) continue; // rotated: no box without a layout engine
      const { mono, size } = fontOf(tAttrs);
      const x = parseFloat((tAttrs.match(/\bx="([^"]+)"/) || [])[1]);
      const y = parseFloat((tAttrs.match(/\by="([^"]+)"/) || [])[1]);
      if (!isFinite(x) || !isFinite(y)) continue;
      const anchor = /class="[^"]*\bstart\b/.test(tAttrs) || /text-anchor="start"/.test(tAttrs) ? 'start'
        : /class="[^"]*\bend\b/.test(tAttrs) || /text-anchor="end"/.test(tAttrs) ? 'end'
        : 'middle';
      const w = estWidth(text, size, mono);
      const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
      const x1 = x0 + w;
      const y0 = y - size * 0.80;
      const y1 = y + size * 0.28;
      const over = Math.max(vx - x0, x1 - (vx + vw), vy - y0, y1 - (vy + vh));
      if (over > SLACK) {
        fail(
          `${tag}: <text> "${text.slice(0, 40)}" leaves the viewBox by ${over.toFixed(1)} ` +
          `(x ${x0.toFixed(0)}..${x1.toFixed(0)}, y ${y0.toFixed(0)}..${y1.toFixed(0)} in ${vb})`
        );
      }
    }

    /* 6. the caption's number */
    const caption = captionsIn[0][1].replace(/<[^>]*>/g, '').trim();
    const num = (caption.match(/^Fig\s+(\d)\.(\d)\b/) || []);
    if (!num) {
      fail(`${tag}: caption does not start with "Fig <chapter>.<n>": "${caption.slice(0, 40)}"`);
      return;
    }
    if (Number(num[1]) !== occ.ch) {
      fail(`${tag}: caption says Fig ${num[1]}.${num[2]} but it is in chapter ${occ.ch}`);
    }
    captions.push({ num: `${num[1]}.${num[2]}`, ch: Number(num[1]), where: tag });
  });
}

/* numbering: the first time a number is seen it must be the largest so far in
   its chapter. Repeats are the reused figures and are always allowed. */
const highByChapter = new Map(); // ch -> greatest figure number seen
const seenNumbers = new Set(); // "ch.n" -> already met
const orderProblems = [];
for (const c of captions) {
  const key = `${c.ch}.${c.num.split('.')[1]}`;
  if (seenNumbers.has(key)) continue;
  seenNumbers.add(key);
  const n = Number(c.num.split('.')[1]);
  const high = highByChapter.get(c.ch) || 0;
  if (n <= high) orderProblems.push(c);
  else highByChapter.set(c.ch, n);
}

/* the plan.md figure table is the single place the numbers are assigned */
const plan = fs.readFileSync(path.join(ROOT, 'plan.md'), 'utf8');
const planned = new Map(); // num -> ch
for (const line of plan.split(/\r?\n/)) {
  // The two tables in plan.md name the chapter differently - "Ch3" in the
  // notes figure table, a bare "3" in the past-answer table - so both forms
  // have to parse, or half the figures look unlisted.
  const m = line.match(/^\|\s*\*{0,2}(\d)\.(\d)\*{0,2}\s*\|\s*(?:Ch\s*)?(\d)\s*\|/);
  if (m) planned.set(`${m[1]}.${m[2]}`, Number(m[3]));
}
const captionNums = new Set(captions.map((c) => c.num));
for (const c of captions) {
  if (!planned.has(c.num)) fail(`${c.where}: Fig ${c.num} is not in plan.md's figure table`);
  else if (planned.get(c.num) !== c.ch) fail(`${c.where}: Fig ${c.num} is filed under Ch ${planned.get(c.num)} in plan.md but drawn in Ch ${c.ch}`);
}
for (const [num, ch] of planned) {
  if (!captionNums.has(num)) fail(`plan.md lists Fig ${num} (Ch ${ch}) but no caption on the site uses that number`);
}
for (const c of orderProblems) {
  fail(`reading order: Fig ${c.num} appears in ${c.where} after a later figure of chapter ${c.ch} (or is out of sequence)`);
}

if (!QUIET) {
  console.log(
    `check_figures: ${figures} figures, ${figures} captions, ${markerCount} markers, ${textCount} labels — ` +
    `${problems} problem(s)`
  );
} else if (problems) {
  console.log(`check_figures: ${problems} problem(s)`);
}
process.exit(problems ? 1 : 0);
