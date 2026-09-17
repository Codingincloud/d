#!/usr/bin/env node
/* Render a route of the DCC portal in a real browser and report what the DOM
   actually contains.

   Why this exists: chapters are written as HTML inside a JavaScript template
   literal. `node --check` proves the file parses and a regex can prove the
   tags balance, but neither proves the chapter renders — a stray `</div>` or a
   section that the renderer drops only shows up once a browser has run app.js.

   Usage (from the project root):
       node tools/check_dcc_ui.mjs "#/ch/2"
       node tools/check_dcc_ui.mjs "#/ch/3" --width 390 --height 844

   Node 24 ships a global WebSocket, so this needs no packages: it drives Edge
   over the DevTools Protocol directly. */

import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const EDGES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

const args = process.argv.slice(2);
/* Git Bash rewrites an argument that begins with `#/` into a Windows path
   (`#/ch/2` arrives as `#C:/Program Files/Git/ch/2`), so the route is accepted
   either way and the mangled prefix is stripped. */
const route = (() => {
  const raw = (args[0] || 'ch/1').replace(/^.*[Gg]it[\\/]/, '');
  return raw.startsWith('#') ? raw : '#/' + raw.replace(/^\/+/, '');
})();
const flag = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : dflt;
};
const WIDTH = +flag('width', 1280);
const HEIGHT = +flag('height', 900);
const BASE = flag('base', 'http://127.0.0.1:8341/dcc-site/index.html');
const PORT = +flag('port', 9700 + Math.floor(Math.random() * 200));

/* The battery. Runs in the page and returns everything the check needs in one
   round trip: what rendered, whether anything overflows the layout, and whether
   the figure viewer is reachable. */
const PROBE = `(() => {
  const q = (s) => document.querySelectorAll(s);
  const view = document.querySelector('.view, main, #app') || document.body;
  const wide = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > document.documentElement.clientWidth + 1) {
      const tag = el.tagName.toLowerCase();
      if (tag === 'svg' || tag === 'img' || tag === 'table' || el.className.toString().includes('figure'))
        wide.push(tag + '.' + String(el.className).slice(0, 30));
    }
  }
  /* Every tab panel is in the DOM at once and only one carries the active
     class, so counting widgets anywhere would report the same numbers on every
     route. What identifies a route is which panel is showing, and which tab
     button is on. */
  const activePanel = document.querySelector('.tab-panel.active');
  const activeBtn = document.querySelector('.tab-btn.active');
  /* Slide images: how many exist, how many actually decoded, and how many the
     browser was told a size for. A path that resolves in the source tree but not
     in a bundle shows up here as present-but-unloaded rather than as silence. */
  const slideImgs = [...q('figure img')];   // NodeList has no .filter
  return {
    slideImgs: slideImgs.length,
    slideImgsLoaded: slideImgs.filter(i => i.naturalWidth > 0).length,
    slideImgsSized: slideImgs.filter(i => i.getAttribute('width') && i.getAttribute('height')).length,
    slideFigWraps: q('.figure-wrap').length,
    activeTab: activeBtn ? activeBtn.dataset.tab : null,
    activePanel: activePanel ? activePanel.id : null,
    visibleSections: activePanel ? activePanel.querySelectorAll('section, .quiz-card, .past-card').length : 0,
    title: (document.querySelector('.view h2, main h2, h1') || {}).textContent || '',
    h3: q('.view h3, main h3').length,
    tables: q('table.comparison-table').length,
    figures: q('figure').length,
    svgs: q('figure svg').length,
    conceptBoxes: q('.concept-box').length,
    quizCards: q('.quiz-card, .q-card').length,
    pastCards: q('.past-card, .past-item, .pq-card').length,
    xvButtons: q('.xv-open').length,
    navItems: q('.nav-item').length,
    bodyScrollWidth: document.body.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    horizontalOverflow: document.body.scrollWidth > document.documentElement.clientWidth + 1,
    wideOverflowing: wide.length,
    emptyPlaceholder: q('.concept-box.warn').length > 0 &&
      /still being written/i.test(document.body.innerText || ''),
    unitsListed: q('.nav-item').length
  };
})()`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Killing a browser on Windows means killing its TREE.

   `proc.kill()` signals the process this script spawned and nothing else, and
   Edge's launcher exits immediately after starting its real browser processes -
   so every run left a renderer, a GPU process and a handful of utilities behind.
   Interrupted runs (a timeout, a Ctrl-C) leaked the whole set with nothing to
   clean them up: measured after one slow afternoon, 843 msedge.exe processes
   were alive, and the machine had become slow enough that the checks it was
   leaking from started timing out too. taskkill /T walks the children.

   The startup sweep is the other half. It targets only processes carrying this
   script's own `dccui-` user-data prefix, so a real Edge window is never a
   candidate. */
function killTree(child, userDir) {
  if (process.platform === 'win32') {
    /* Kill by the user-data directory, not by pid.

       `taskkill /PID` on the spawned process was the first attempt and it does
       nothing: Edge's launcher hands off to its real browser and exits, so by
       the time this runs the pid is already gone - which a `child.exitCode !==
       null` guard then turns into "nothing to do". The user-data directory is
       instead carried in the command line of the launcher AND of every child it
       started, so it names the whole tree without naming anyone else's browser. */
    const safe = String(userDir).replace(/'/g, "''");
    spawnSync('powershell', ['-NoProfile', '-Command',
      "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | " +
      `Where-Object { $_.CommandLine -like '*${safe}*' } | ` +
      'ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }'
    ], { stdio: 'ignore' });
  }
  if (child && child.exitCode === null) {
    try { child.kill('SIGKILL'); } catch { /* already gone */ }
  }
}

function sweepStrays() {
  if (process.platform !== 'win32') return;
  const ps = [
    '-NoProfile', '-Command',
    "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | " +
    "Where-Object { $_.CommandLine -like '*dccui-*' } | " +
    'ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }'
  ];
  spawnSync('powershell', ps, { stdio: 'ignore' });
}

async function main() {
  sweepStrays();
  const userDir = mkdtempSync(path.join(tmpdir(), 'dccui-'));
  const edge = process.env.EDGE_BIN || EDGES.find((p) => true);
  const proc = spawn(edge, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${userDir}`,
    `--window-size=${WIDTH},${HEIGHT}`, 'about:blank'
  ], { stdio: 'ignore' });

  let version = null;
  for (let i = 0; i < 60 && !version; i++) {
    await sleep(250);
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) version = await r.json();
    } catch { /* not listening yet */ }
  }
  if (!version) { console.error('could not reach Edge on port ' + PORT); killTree(proc, userDir); process.exit(1); }

  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?` + encodeURIComponent('about:blank'), { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 0;
  const pending = new Map();
  const logs = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')
      logs.push(m.params.args.map((a) => a.value || a.description || '').join(' '));
    if (m.method === 'Runtime.exceptionThrown')
      logs.push('EXCEPTION: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  };
  const send = (method, params = {}) => new Promise((res) => {
    const myId = ++id;
    pending.set(myId, res);
    ws.send(JSON.stringify({ id: myId, method, params }));
  });
  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.text);
    return r.result?.result?.value;
  };

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: WIDTH < 600
  });
  await send('Page.navigate', { url: BASE + route });

  // Poll rather than trusting a load event: app.js renders the chapter after
  // the chapter script has been parsed.
  let state = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      state = await evaluate(PROBE);
      if (state && state.tables + state.quizCards + state.figures > 0) break;
    } catch { /* page mid-navigation */ }
  }

  /* A second pass with the slide images actually scrolled past.

     They are `loading=lazy`, so a run that never scrolls reports 0 loaded - and
     0 loaded proves nothing either way: it is what a correct bundle and a bundle
     whose paths all 404 look like. This walks the image figures in a few steps
     and then re-measures, which is the only way this check can tell the two
     apart. It is skipped when there are no images, so it costs nothing on the
     Simulation site. */
  let afterScroll = null;
  if (state && state.slideImgs > 0) {
    await evaluate(`(() => {
      const wraps = [...document.querySelectorAll('.figure-wrap')].filter(w => w.querySelector('img'));
      if (!wraps.length) return 0;
      wraps[0].scrollIntoView({ block: 'center' });
      const last = wraps[wraps.length - 1];
      setTimeout(() => last.scrollIntoView({ block: 'center' }), 900);
      return wraps.length;
    })()`);
    await sleep(3500);
    afterScroll = await evaluate(PROBE);
  }

  console.log(JSON.stringify({
    route, width: WIDTH, height: HEIGHT,
    ...state,
    ...(afterScroll ? {
      slideImgsLoadedAfterScroll: afterScroll.slideImgsLoaded,
      xvButtonsAfterScroll: afterScroll.xvButtons
    } : {}),
    consoleErrors: logs
  }, null, 2));

  ws.close();
  killTree(proc, userDir);
  try { rmSync(userDir, { recursive: true, force: true }); } catch { /* windows lock */ }
}

main().catch((e) => { console.error(e); process.exit(1); });
