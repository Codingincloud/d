#!/usr/bin/env node
/* ==========================================================================
   dump_dcc.js - every DCC chapter's runtime data, as JSON, on stdout.

   The DCC chapters live in `dcc-site/ch1.js` … `ch9.js` and each one assigns
   to `window.CHAPTERS[n]`. Reading them as *text* is what most tools do, and it
   is right for a structural edit - but it cannot answer a question about the
   value a reader is given, because the escapes in the source are resolved by the
   JavaScript engine first. This dumper is the small bridge: require the nine
   files with a fresh `window`, and print what they produced.

   That distinction is the whole point of tools/escape_audit.py. A note that
   contains the two characters `\` `n` renders them as visible text, and whether
   the source says `\n`, `\\n` or a real newline is exactly what a text scan
   cannot tell you - so the audit reads the value, not the file.

   Usage:  node tools/dump_dcc.js          # JSON object, keys "1"…"9"
           node tools/dump_dcc.js --fields # only data keys, no n/t/m metadata
   ========================================================================== */
'use strict';

const path = require('path');

global.window = {};
for (let n = 1; n <= 9; n++) {
  require(path.join(__dirname, '..', 'dcc-site', 'ch' + n + '.js'));
}

const out = global.window.CHAPTERS || {};
if (process.argv.includes('--fields')) {
  for (const key of Object.keys(out)) {
    const ch = out[key];
    if (ch && typeof ch === 'object') out[key] = { learn: ch.learn, revise: ch.revise,
      reference: ch.reference, slides: ch.slides, quiz: ch.quiz, past: ch.past,
      pastSummary: ch.pastSummary };
  }
}

process.stdout.write(JSON.stringify(out));
