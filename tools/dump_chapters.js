// Dumps every chapter's runtime data as JSON so tools/validate_site.py can check it.
// Chapters assign to window.CHAPTERS[n], so a fresh global.window per file is enough.
const path = require('path');

const dir = path.resolve(__dirname, '..');
const out = {};

for (let n = 1; n <= 8; n++) {
  const file = path.join(dir, 'ch' + n + '.js');
  global.window = {};
  delete require.cache[require.resolve(file)];
  require(file);
  out[n] = global.window.CHAPTERS[n] || null;
}

process.stdout.write(JSON.stringify(out));
