// The contract for the reader-tinted mode: custom-theme.js.
//
// Run:  node tools/test_custom_theme.js
//
// The other eight modes are static, so tools/check_themes.py can read their
// colours straight out of tokens.css and check them. This one is a FUNCTION,
// and a function is only as good as its worst input - "the reader picks two
// colours" means white-on-white, pure primaries, mid-greys and the exact hues of
// the semantic callouts all have to produce a readable page. Three of those a
// human would try by hand; the grid below is 168 of them.
//
// Two things are checked, and they are deliberately different in kind:
//
//   1. STRUCTURE, here in node: every palette declares the full token contract,
//      the ladder is actually visible, the seed matches the fallback block in
//      tokens.css, and the same input gives the same output.
//   2. CONTRAST, by the Python gate: this tool writes the whole grid out as a
//      CSS file of [data-theme] blocks and tools/check_themes.py --palettes runs
//      the SAME pair list on it that it runs on the hand-written modes. The
//      contract is therefore stated once, in one language, and cannot drift
//      between the two.
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..');
const GRID_CSS = path.join(dir, '.freebuff', 'custom_grid.css');

function load() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(dir, 'custom-theme.js'), 'utf8'), ctx,
                  { filename: 'custom-theme.js' });
  return ctx.window.CustomTheme;
}

let checks = 0;
const failures = [];
function ok(label, condition, detail) {
  checks++;
  if (!condition) failures.push(label + (detail === undefined ? '' : ' — ' + detail));
  if (!condition) console.log('  [XX] ' + label + (detail === undefined ? '' : '  (' + detail + ')'));
}
function eq(label, got, want) {
  ok(label, JSON.stringify(got) === JSON.stringify(want),
     'got ' + JSON.stringify(got) + ', want ' + JSON.stringify(want));
}

const CT = load();
const CT_TOKENS = CT.TOKENS;

// Three tokens are not colours and must not be held to being one: the two
// shadows are whole `box-shadow` values, and the grain is an opacity. The
// stylesheet declares them beside the colours, and so does the derivation.
const NOT_A_COLOUR = ['sh', 'sh-md', 'grain'];
const COLOUR_TOKENS = CT_TOKENS.filter(function (n) { return NOT_A_COLOUR.indexOf(n) < 0; });

// ---------------------------------------------------------------- the css ----
// The tokens the light theme declares, parsed here rather than duplicated, so
// "the derived palette declares what the stylesheet needs" is checked against
// the stylesheet.
function cssTokens() {
  const css = fs.readFileSync(path.join(dir, 'assets', 'css', 'tokens.css'), 'utf8');
  const m = css.match(/\[data-theme="light"\]\s*\{([\s\S]*?)\n\}/);
  const names = [];
  const re = /--([a-z0-9-]+)\s*:/g;
  let t;
  while ((t = re.exec(m[1]))) names.push(t[1]);
  return names;
}

function customBlock() {
  const css = fs.readFileSync(path.join(dir, 'assets', 'css', 'tokens.css'), 'utf8');
  const m = css.match(/\[data-theme="custom"\]\s*\{([\s\S]*?)\n\}/);
  if (!m) return null;
  const out = {};
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/g;
  let t;
  while ((t = re.exec(m[1]))) out[t[1]] = t[2].trim();
  return out;
}

console.log('custom-theme.js — the reader-tinted mode\n');

// ------------------------------------------------------------------ 1. shape ----
console.log('1. the derived palette declares the whole contract');

const lightNames = cssTokens();
eq('TOKENS is the light theme\'s token list, in order', CT_TOKENS, lightNames);
eq('no duplicates in TOKENS', CT_TOKENS.length, new Set(CT_TOKENS).size);

const seed = CT.derive(CT.DEFAULT_ACCENT, CT.DEFAULT_SURFACE);
const SEED_BG = seed.bg;
const missing = CT_TOKENS.filter(function (n) { return seed[n] === undefined; });
eq('the seed palette has every token', missing, []);
ok('the seed is a light palette on a light surface', seed.kind === 'light', seed.kind);
eq('the seed\'s browser-chrome colour is its own --bg', seed.meta, seed.bg);
eq('the seed shows five swatches', seed.strip.length, 5);

// ------------------------------------------------------------------ 2. fallback ----
console.log('2. the fallback block in tokens.css is the seed palette');

const block = customBlock();
if (!block) {
  ok('[data-theme="custom"] exists in tokens.css', false,
     'without it, a reader who has never opened the picker gets an undefined palette');
} else {
  eq('the fallback declares the same token set', Object.keys(block).sort(), CT_TOKENS.slice().sort());
  const drift = CT_TOKENS.filter(function (n) {
    return String(block[n]).toLowerCase() !== String(seed[n]).toLowerCase();
  });
  eq('the fallback matches what derive() produces for the seed', drift, []);
}

// ------------------------------------------------------------------ 3. the grid ----
console.log('3. 168 awkward inputs still produce a palette');

const SURFACES = ['#ffffff', '#f6f5f2', '#fdf6ea', '#f5cdd0', '#f4f9ee', '#e8e4dc', '#d9d4c8',
                  '#8a8a8a', '#4a4a4a', '#1a1a1a', '#000000',
                  '#1c0b28', '#25090f', '#0e0d15'];
const ACCENTS = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00',
                 '#4f5bd5', '#8a6118', '#2f6b4a', '#a33230', '#6b4e7a', '#828282'];

const grid = [];
const kinds = { light: 0, dark: 0 };
let structural = 0;

SURFACES.forEach(function (surface, si) {
  ACCENTS.forEach(function (accent, ai) {
    const t = CT.derive(accent, surface);
    // ids stay inside [a-z0-9] so the shared block parser in
    // tools/check_themes.py reads this file with the exact same regex it uses
    // on the hand-written modes
    const id = 'g' + si + 'x' + ai;
    const where = accent + ' on ' + surface;

    // every token, every time
    const gone = CT_TOKENS.filter(function (n) { return t[n] === undefined || t[n] === ''; });
    ok('[' + where + '] declares every token', gone.length === 0, gone.join(', '));

    // ... and a value the browser can actually paint. `rgba(` is allowed: all
    // four hand-written dark modes carry a translucent --stripe.
    const bad = COLOUR_TOKENS.filter(function (n) {
      const v = String(t[n]);
      return !/^#[0-9a-f]{6}$/i.test(v) && !/^rgba\(/.test(v);
    });
    ok('[' + where + '] every token is a paintable colour', bad.length === 0,
       bad.map(function (n) { return n + '=' + t[n]; }).join(' '));

    // the kind follows the surface, and a token set is never mixed
    ok('[' + where + '] kind is light or dark', t.kind === 'light' || t.kind === 'dark', t.kind);
    kinds[t.kind]++;

    // A palette where the ladder has collapsed still passes contrast - one flat
    // colour always does - so the ladder has to be asserted separately, or the
    // gate would green-light a page with no visible cards.
    const distinct = { 'bg!=bg-card': t.bg !== t['bg-card'], 'bg!=bg-side': t.bg !== t['bg-side'],
                       'card!=side': t['bg-card'] !== t['bg-side'], 'bg!=bg-input': t.bg !== t['bg-input'],
                       't1!=t2': t.t1 !== t.t2, 't2!=t3': t.t2 !== t.t3,
                       't1!=bg': t.t1 !== t.bg, 'brd!=bg': t.brd !== t.bg };
    const flat = Object.keys(distinct).filter(function (k) { return !distinct[k]; });
    ok('[' + where + '] the surface ladder is visible', flat.length === 0, flat.join(', '));

    // each role has its own hue family, so a callout cannot hide inside another
    [['pri', 'sec'], ['pri', 'acc'], ['pri', 'dan'], ['pri', 'vio'],
     ['sec', 'acc'], ['sec', 'dan'], ['sec', 'vio'], ['acc', 'dan']].forEach(function (pair) {
      ok('[' + where + '] ' + pair[0] + ' and ' + pair[1] + ' are different colours',
         t[pair[0] + '-bg'] !== t[pair[1] + '-bg'] && t[pair[0]] !== t[pair[1]],
         t[pair[0] + '-bg'] + ' vs ' + t[pair[1] + '-bg']);
    });

    // determinism: the same two colours are the same palette, always
    const again = CT.derive(accent, surface);
    ok('[' + where + '] is deterministic', JSON.stringify(again) === JSON.stringify(t));

    structural++;
    grid.push([id, t]);
  });
});

ok('the grid covers both kinds', kinds.light > 0 && kinds.dark > 0,
   JSON.stringify(kinds));
console.log('   ' + structural + ' palettes derived (' + kinds.light + ' light, ' + kinds.dark + ' dark)');

// ------------------------------------------------------------------ 4. the surface band ----
console.log('4. a mid-grey page is pulled into one band or the other');

// L 0.5 is neither paper nor lamp; the ladder and both ink walks need a side,
// so the surface is clamped into one band. The threshold is luminance 0.20,
// which is about #808080 - mid-grey goes with the paper themes, because a page
// pulled from mid-grey toward near-white loses less of what was picked than one
// pulled to near-black.
const mid = CT.derive('#4f5bd5', '#808080');
ok('a mid-grey surface still yields a coherent palette',
   ['bg', 'bg-card', 'bg-side', 't1', 't2', 't3'].every(function (n) { return !!mid[n]; }),
   JSON.stringify(mid).slice(0, 80));
ok('mid-grey goes with the paper themes', mid.kind === 'light', 'L 0.50 -> ' + mid.kind);
ok('a luminance just under the threshold goes with the lamp themes',
   CT.derive('#4f5bd5', '#7a7a7a').kind === 'dark',
   '#7a7a7a -> ' + CT.derive('#4f5bd5', '#7a7a7a').kind);
ok('white is a paper theme', CT.derive('#4f5bd5', '#ffffff').kind === 'light');
ok('black is a lamp theme', CT.derive('#4f5bd5', '#000000').kind === 'dark');

// ---------------------------------------------------------------- 5. the accent ----
console.log('5. the accent the reader picked is the accent they get');

function hue(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255,
        b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (!d) return null;                 // a true grey has no hue to preserve
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) : max === g ? ((b - r) / d + 2) : ((r - g) / d + 4);
  return h * 60;
}
function gap(a, b) { const x = Math.abs(a - b) % 360; return x > 180 ? 360 - x : x; }

// The semantic hues, as custom-theme.js holds them. Kept here as a list rather
// than exported, because these five numbers ARE the meaning of the callouts - if
// one moves, this whole assertion should be re-read by a human, not silently
// follow it.
const SEMANTIC = [148, 38, 6, 288];

// Away from every semantic hue, the accent is returned EXACTLY: the solver only
// ever moves lightness, so the hue must survive to the degree.
['#4f5bd5', '#c2185b', '#0891b2', '#7c3aed', '#3f6212'].forEach(function (accent) {
  const t = CT.derive(accent, '#f6f5f2');
  const want = hue(accent), got = hue(t.pri);
  const near = SEMANTIC.some(function (h) { return gap(want, h) < CT.TOLERANCE; });
  if (near) return;                    // covered below by the tie-break case
  ok('the accent ' + accent + ' keeps its hue (' + want.toFixed(0) + ' deg)',
     gap(want, got) <= 1, 'came out at ' + got.toFixed(0) + ' deg');
});

// The only exception: an accent sitting ON a semantic hue, which would otherwise
// produce two roles of literally the same colour.
[['#2f6b4a', 148], ['#8a6118', 38], ['#a33230', 6], ['#6b4e7a', 288]].forEach(function (pair) {
  const t = CT.derive(pair[0], '#f6f5f2');
  const roles = ['pri', 'sec', 'acc', 'dan', 'vio'];
  let worst = 360;
  for (let i = 0; i < roles.length; i++) {
    for (let j = i + 1; j < roles.length; j++) {
      const a = hue(t[roles[i]]), b = hue(t[roles[j]]);
      if (a === null || b === null) continue;
      worst = Math.min(worst, gap(a, b));
    }
  }
  // 14 degrees of nudge is what the derivation applies, so any two roles are at
  // least a hair apart - and the accent is still recognisably itself, which is
  // the whole point of the tie-break being this narrow.
  ok('an accent of ' + pair[0] + ' is nudged off the ' + pair[1] + ' deg role, not away from it',
     worst >= 13, 'closest pair ' + worst.toFixed(0) + ' degrees');
  ok('  ... and is still the same colour family',
     gap(hue(t.pri), hue(pair[0])) <= CT.TOLERANCE + CT.NUDGE + 1,
     'moved ' + gap(hue(t.pri), hue(pair[0])).toFixed(0) + ' degrees');
});

// A grey accent stays grey. The saturation floor exists so white-on-fill can be
// solved at all, but it is 0.15 rather than the 0.30 that turned #808080 into a
// colour nobody picked - so a neutral accent must come out near-neutral.
function chroma(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255,
        b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  return (l === 0 || l === 1) ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
}
['#828282', '#8a8a8a', '#999999', '#4a4a4a'].forEach(function (greyAccent) {
  const t = CT.derive(greyAccent, '#f6f5f2');
  // The brand LAYER must be neutral, not merely quiet. An earlier version
  // allowed 0.15 saturation, and 0.15 of hue 0 - which is what rgb2hsl reports
  // for a grey - is a muted rose: a colour the reader did not pick, from a
  // colour that has no hue at all.
  ['pri', 'pri-l', 'pri-bg', 'pri-bd'].forEach(function (name) {
    ok('[' + greyAccent + '] --' + name + ' is neutral, not a tinted grey',
       chroma(t[name]) <= 0.05, 'chroma ' + chroma(t[name]).toFixed(3));
  });
  // The meaning of the callouts is not the reader's to lose, though: the four
  // semantic roles keep their own hues whatever the brand does.
  ['sec', 'acc', 'dan', 'vio'].forEach(function (name) {
    ok('[' + greyAccent + '] --' + name + ' keeps its hue', chroma(t[name]) >= 0.15,
       'chroma ' + chroma(t[name]).toFixed(3));
  });
});

// And a saturated accent is not washed out to a pastel by the same floor.
const vivid = CT.derive('#c2185b', '#f6f5f2');
ok('a saturated accent keeps its chroma', chroma(vivid.pri) >= 0.45,
   '--pri chroma ' + chroma(vivid.pri).toFixed(2));

// ------------------------------------------------------------------ 6. the boot coupling ----
console.log('6. each page can read back what the picker stored');

// This is the one coupling in the whole feature that no type system and no
// contrast check can see, so it is asserted here. The boot script runs in
// <head>, before any course file, so it cannot ask window.COURSE which
// namespace this page uses: it carries the namespace as a literal. custom-theme.js
// reads the SAME namespace off window.COURSE at call time. If the two ever
// disagree, the reader picks custom colours, the picker caches them under one
// key, the boot script looks under another, and every reload quietly falls back
// to the seed palette - which still passes every other check in this suite.
const PAGES = [
  { label: 'Simulation', html: 'index.html', ns: 'sm' },
  { label: 'DCC', html: 'dcc-site/index.html', ns: 'dcc' }
];

// The DCC page declares its id in course.js; the Simulation page declares none,
// and custom-theme.js falls back to 'sm'.
const dccCourse = fs.readFileSync(path.join(dir, 'dcc-site', 'course.js'), 'utf8');
const dccMatch = dccCourse.match(/id:\s*'([a-z0-9]+)'/);
ok('dcc-site/course.js declares a course id', !!dccMatch, 'no id found');
if (dccMatch) eq('the DCC page\'s expected namespace matches its course id', dccMatch[1], 'dcc');

PAGES.forEach(function (page) {
  const html = fs.readFileSync(path.join(dir, page.html), 'utf8');
  const key = html.match(/localStorage\.getItem\('([a-z0-9]+)-custom-palette'\)/);
  const acc = html.match(/localStorage\.getItem\('([a-z0-9]+)-accent'\)/);
  ok('[' + page.label + '] the boot script reads a custom palette cache', !!key,
     'no <ns>-custom-palette read found');
  if (key) eq('[' + page.label + '] the boot script\'s namespace', key[1], page.ns);
  ok('[' + page.label + '] the boot script re-checks the accent it cached', !!acc,
     'no <ns>-accent read found');
  if (acc) eq('[' + page.label + '] both keys use one namespace', acc[1], page.ns);

  // The cached record is only trusted at a version the boot script knows, so a
  // derivation that starts returning different colours must bump both.
  const cv = html.match(/var chrome=MODES\[t\], CV=(\d+);/);
  ok('[' + page.label + '] the boot script carries a cache version', !!cv,
     'no CV=<n> found');
  if (cv) eq('[' + page.label + '] CV matches CustomTheme.VERSION', Number(cv[1]), CT.VERSION);

  // And it must be reachable at all: the palette block has to exist for the
  // fallback, and the id has to be in the boot map.
  ok('[' + page.label + '] the boot map knows about custom',
     /custom:'#[0-9a-f]{6}'/.test(html), 'no custom entry in MODES');
  ok('[' + page.label + '] the boot map\'s custom colour is the seed palette\'s --bg',
     (html.match(/custom:'(#[0-9a-f]{6})'/) || [])[1] === SEED_BG,
     'boot map says ' + (html.match(/custom:'(#[0-9a-f]{6})'/) || [])[1] +
     ', the seed is ' + SEED_BG);
});

// ------------------------------------------------------------------ 6b. the shared link ----
console.log('6b. a link carries the whole appearance to another device');

// The link format has TWO implementations that cannot import each other: this
// module, and the inline copy in each page's boot script - which runs during
// parse, before the bundle that contains custom-theme.js exists. A typo in that
// copy is the quietest bug in the feature: the page would simply keep the mode
// it already had, with no error anywhere. So the boot copies are read here and
// held to the parameter names in PARAMS.
eq('PARAMS is the three short names every link uses', CT.PARAMS, { theme: 't', width: 'w', colours: 'c' });
Object.keys(CT.PARAMS).forEach(function (key) {
  const p = CT.PARAMS[key];
  PAGES.forEach(function (page) {
    const html = fs.readFileSync(path.join(dir, page.html), 'utf8');
    ok('[' + page.label + '] the boot script reads the ' + p + '= parameter',
       new RegExp('P\\.' + p + '\\b').test(html),
       'no P.' + p + ' in the boot script');
    ok('[' + page.label + '] the boot script reads the appearance off the URL',
       /location\.search/.test(html), 'no location.search in the boot script');
  });
});

// What the picker writes has to be exactly what the other device reads - so the
// round trip is asserted rather than described.
[
  [{ theme: 'eveningmix', width: 'full' },
   { theme: 'eveningmix', width: 'full', accent: null, surface: null }],
  [{ theme: 'custom', width: 'comfort', accent: '#4f5bd5', surface: '#f6f5f2' },
   { theme: 'custom', width: 'comfort', accent: '#4f5bd5', surface: '#f6f5f2' }],
  [{ theme: 'custom', accent: '#ABC123', surface: '#FFFFFF' },
   { theme: 'custom', width: null, accent: '#abc123', surface: '#ffffff' }]
].forEach(function (pair) {
  eq('round trip: ' + CT.link(pair[0]), CT.readLink(CT.link(pair[0])), pair[1]);
});

// Two colours and no mode named can only mean Custom. Without this the link would
// carry a palette that nothing had been told to display.
eq('colours alone mean the custom mode', CT.readLink('?c=112233,445566'),
   { theme: 'custom', width: null, accent: '#112233', surface: '#445566' });
eq('a three-digit colour is expanded', CT.readLink('?c=abc,def').accent, '#aabbcc');
// The eight shipped modes have no colours of their own, so a link never carries
// any for them - a reader who shares Lamp shares the palette, not their last
// custom colours.
eq('a shipped mode carries no colours', CT.link({ theme: 'dark', accent: '#112233', surface: '#445566' }),
   '?t=dark');
// Anything that does not parse cleanly changes NOTHING: the device keeps what it
// had rather than half-applying a mangled link.
['', '?', '?x=1', '?w=wide', '?t=', '?c=nope', '?c=111111', '?c=ffffff,zzzzzz'].forEach(function (bad) {
  eq('a link that does not parse (' + JSON.stringify(bad) + ') is ignored', CT.readLink(bad),
     { theme: null, width: null, accent: null, surface: null });
});

// ------------------------------------------------------------------ 7. write the grid ----
// The Python gate reads this file with --palettes, so the contrast contract
// lives in exactly one place.
const lines = ['/* GENERATED by tools/test_custom_theme.js — do not edit, do not commit.\n' +
               '   One block per grid sample; tools/check_themes.py --palettes checks them\n' +
               '   against the same pair list it uses on the eight hand-written modes. */', ''];
grid.forEach(function (entry) {
  const id = entry[0], t = entry[1];
  lines.push('[data-theme="' + id + '"] {');
  CT_TOKENS.forEach(function (n) { lines.push('  --' + n + ': ' + t[n] + ';'); });
  lines.push('}');
  lines.push('');
});
fs.mkdirSync(path.dirname(GRID_CSS), { recursive: true });
fs.writeFileSync(GRID_CSS, lines.join('\n'), 'utf8');
console.log('   wrote ' + path.relative(dir, GRID_CSS) + ' (' + grid.length + ' blocks)');

// ------------------------------------------------------------------ verdict ----
console.log('');
if (failures.length) {
  console.log(failures.length + ' of ' + checks + ' checks FAILED:');
  failures.slice(0, 20).forEach(function (f) { console.log('  [x] ' + f); });
  if (failures.length > 20) console.log('  ... and ' + (failures.length - 20) + ' more');
  console.log('\ncustom-theme: FAILED');
  process.exit(1);
}
console.log('All ' + checks + ' custom-theme contracts hold.');
console.log('Now check the derived palettes for contrast:');
console.log('  python tools/check_themes.py --palettes .freebuff/custom_grid.css');
// A marker the runner can look for, like every other checker in tools/: the
// success and failure lines above both contain the words "contracts hold", so
// matching on prose is not something a gate should have to do.
console.log('custom-theme: OK');
