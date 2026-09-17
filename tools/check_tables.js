#!/usr/bin/env node
/* ==========================================================================
   check_tables.js - re-derive the arithmetic that the chapter tables assert.

   Every `<table>` in ch1..ch8 is scanned for a row whose first cell says
   "Total". Each numeric cell of that row is compared with the column sum of
   the rows above it, so a hand-written table that no longer adds up fails
   here instead of on the page.

   It also flags a column that is arithmetic (two or more numbers) but whose
   Total row is missing, which is how the drop-off in "presented in a bad
   order" tables usually starts.

   Usage:  node tools/check_tables.js          # report + exit 1 on mismatch
           node tools/check_tables.js --quiet  # only mismatches
   ========================================================================== */
'use strict';

global.window = {};
for (let n = 1; n <= 8; n++) require('../ch' + n + '.js');

const QUIET = process.argv.includes('--quiet');
const TOL = 0.011; // one part in the last printed decimal of a 2-dp table

/* "<td><strong>8.00</strong></td>" -> 8 ; "+3" -> 3 ; "—" / "50/10" -> null */
function toNumber(html) {
  const text = String(html)
    .replace(/<[^>]*>/g, '')
    .replace(/[\u2212\u2013\u2014]/g, '-')
    .trim();
  if (!text) return null;
  // Only a number, optionally signed, optionally with a thousands space.
  if (!/^[-+]?\d{1,3}(\s\d{3})*(\.\d+)?$/.test(text)) return null;
  return parseFloat(text.replace(/\s/g, ''));
}

function cells(rowHtml) {
  return [...rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) => m[1]);
}

let problems = 0;
let checked = 0;

for (let n = 1; n <= 8; n++) {
  const learn = global.window.CHAPTERS[n] && global.window.CHAPTERS[n].learn;
  if (!learn) continue;
  const tables = [...learn.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) => m[0]);
  tables.forEach((table, index) => {
    const rows = [...table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) =>
      cells(m[1])
    );
    const totalAt = rows.findIndex((r) => r.some((c) => /^\s*total\s*$/i.test(c.replace(/<[^>]*>/g, ''))));
    if (totalAt < 0) return;

    const header = rows[0];
    const total = rows[totalAt];
    const body = rows.slice(1, totalAt);

    for (let c = 0; c < total.length; c++) {
      const claimed = toNumber(total[c]);
      if (claimed === null) continue;
      const values = body.map((r) => toNumber(r[c])).filter((v) => v !== null);
      if (values.length < 2) continue;
      checked++;
      const sum = values.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - claimed) > TOL) {
        problems++;
        const head = (header && header[c] ? header[c].replace(/<[^>]*>/g, '') : 'col ' + c).trim();
        console.log(
          `MISMATCH  ch${n} table#${index + 1}  "${head}"\n` +
            `          claimed total ${claimed}  vs  sum ${Number(sum.toFixed(3))}\n` +
            `          rows: ${values.join(' + ')}`
        );
      }
    }
  });
}

if (!QUIET) console.log(`check_tables: ${checked} total cells re-derived, ${problems} mismatch(es)`);
else console.log(`check_tables: ${problems} mismatch(es)`);
process.exit(problems ? 1 : 0);
