/* The shell: it owns the shared data (the chapters, the chapter metadata, the
   chapter on screen), the design helpers, the navigation, the Analysis tab and
   the theme — and it wires the feature modules together.

   Each feature owns its own state in its own module:
     modules/progress.js   progress (localStorage 'sm-progress'), XP, streak,
                           the stats readout and export/import/reset
     modules/quiz.js       the live per-chapter quiz run
     modules/past.js       the past-question list and its filter
     modules/search.js     the search index and the current hit list
     modules/exam.js       the assembled mock paper, its timer and self-marking

   The modules read the chapter data and each other through `window.SMApp`;
   engine.js (window.SM) holds the pure decisions; this file registers
   `window.SMApp.Shell` for the handful of functions the modules call back into
   (render, navigate, toast, escape). It is loaded last, so the modules exist
   before it runs. */
(function(){
'use strict';
const App=window.SMApp=window.SMApp||{},SM=window.SM;
/* Which course this shell is running. `window.COURSE` is declared by the entry
   page before this file loads: index.html leaves it undefined, so the
   Simulation defaults below apply and nothing about that site changes;
   dcc-site/index.html defines its own course and gets the same shell with its
   own chapters, weights and storage namespace.

   `NS` is the localStorage namespace. Two courses on one origin must not share
   a progress record, and a reader who studies both should be able to keep both
   records - so every key is prefixed with the course id. */
const COURSE=window.COURSE||{};
const NS=COURSE.id||'sm';
const Progress=App.Progress,Quiz=App.Quiz,Past=App.Past,Search=App.Search,Exam=App.Exam;
// Only a course that lists a `reference` tab loads this module; the rest leave it
// undefined, which is how a tab a course does not have stays unreachable.
const Reference=App.Reference;
// Same rule for the byte-size tab: only a course that loads the module and ships
// data/rev.js has it, and a chapter with no cards shows no tab.
const Revise=App.Revise;
// And the teaching layer: the same rule again, so a course without
// data/teach.js is a course without the tab.
const Teach=App.Teach;
const CH=window.CHAPTERS||{};
let cur=1;
/* Chapter metadata. No emoji: the chapter number is the identifier a reader
   actually navigates by, and eight different pictograms competed with it for
   attention without adding one bit of information. */
const meta=COURSE.meta||[
  {n:1,t:'Concept of Simulation',m:8,h:6},
  {n:2,t:'Monte Carlo Method',m:6,h:4},
  {n:3,t:'Continuous Systems',m:6,h:5},
  {n:4,t:'Queuing System',m:6,h:5},
  {n:5,t:'Verification & Validation',m:6,h:4},
  {n:6,t:'Random Number Generation',m:12,h:6},
  {n:7,t:'Simulation Output Analysis',m:6,h:5},
  {n:8,t:'Simulation Language',m:10,h:5}
];
/* How many chapters there are. It used to be the literal 8 in five places
   across this file and two in engine.js; a nine-chapter course (DCC) is a
   config change now rather than a hunt for the numbers. */
const N=meta.length;
/* ---------------- Icons ---------------- */
/* One drawn alphabet for the whole interface, replacing the emoji it used to
   be built out of. Every icon is a 24x24 outline built from primitives -
   circles, rects, straight lines, simple polylines - so they share one stroke
   weight, take currentColor from the text they sit in, scale with the font
   size, and render identically on every OS instead of being whatever that
   platform's emoji font happens to draw.
   Geometry over decoration: this is a study tool, not a sticker book. */
const ICONS={
  book:'<path d="M12 6.6S9.7 4.6 6.2 4.6H4v13.1h2.2c3.5 0 5.8 2 5.8 2s2.3-2 5.8-2H20V4.6h-2.2C14.3 4.6 12 6.6 12 6.6Z"/><path d="M12 6.6v13.1"/>',
  checklist:'<path d="M4 6.2 5.6 7.8 8.6 4.8"/><path d="M4 12.4 5.6 14 8.6 11"/><path d="M4 18.6 5.6 20 8.6 17"/><path d="M11.8 6.4H20"/><path d="M11.8 12.4H20"/><path d="M11.8 18.6H20"/>',
  file:'<path d="M13.6 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8.4Z"/><path d="M13.6 3.5v4.9h4.9"/><path d="M9 13.2h6"/><path d="M9 16.6h4"/>',
  chart:'<path d="M4 20h16"/><path d="M7.2 20v-5.4"/><path d="M12 20V9.6"/><path d="M16.8 20V6"/>',
  clock:'<circle cx="12" cy="12" r="8.25"/><path d="M12 7.4V12l3.1 1.9"/>',
  target:'<circle cx="12" cy="12" r="8.25"/><circle cx="12" cy="12" r="3.4"/>',
  calendar:'<rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M3.5 10.2h17"/><path d="M8.2 3.4v4"/><path d="M15.8 3.4v4"/>',
  repeat:'<path d="M4 11.2V9.6a4 4 0 0 1 4-4h9"/><path d="M14.6 3 17.6 5.6 14.6 8.2"/><path d="M20 12.8v1.6a4 4 0 0 1-4 4H7"/><path d="M9.4 21 6.4 18.4 9.4 15.8"/>',
  alert:'<path d="M12 4.6 20.8 19.4H3.2Z"/><path d="M12 10v3.9"/><circle cx="12" cy="16.9" r=".9" fill="currentColor" stroke="none"/>',
  download:'<path d="M12 3.6v10.9"/><path d="M7.6 10.1 12 14.5l4.4-4.4"/><path d="M4.6 20.4h14.8"/>',
  upload:'<path d="M12 14.5V3.6"/><path d="M7.6 8 12 3.6 16.4 8"/><path d="M4.6 20.4h14.8"/>',
  trash:'<path d="M4.6 7h14.8"/><path d="M9.6 7V4.6h4.8V7"/><path d="M6.6 7l1 13.4h8.8l1-13.4"/><path d="M10.4 10.8v6"/><path d="M13.6 10.8v6"/>',
  eye:'<path d="M2.6 12S6.1 6.2 12 6.2 21.4 12 21.4 12 17.9 17.8 12 17.8 2.6 12 2.6 12Z"/><circle cx="12" cy="12" r="2.7"/>',
  play:'<path d="M8.2 5.6 18.4 12 8.2 18.4Z"/>',
  check:'<path d="M4.6 12.6 9.6 17.6 19.4 6.6"/>',
  x:'<path d="M6.2 6.2 17.8 17.8"/><path d="M17.8 6.2 6.2 17.8"/>',
  chevron:'<path d="M6.2 9.4 12 15.2l5.8-5.8"/>',
  chevronUp:'<path d="M6.2 14.6 12 8.8l5.8 5.8"/>',
  arrowUp:'<path d="M12 19.4V4.6"/><path d="M6.2 10.4 12 4.6l5.8 5.8"/>',
  arrowRight:'<path d="M4.6 12h14.8"/><path d="M13.6 6.2 19.4 12l-5.8 5.8"/>',
  arrowLeft:'<path d="M19.4 12H4.6"/><path d="M10.4 6.2 4.6 12l5.8 5.8"/>',
  refresh:'<path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 4.4V10h-5.6"/>',
  search:'<circle cx="10.75" cy="10.75" r="6.25"/><path d="M15.4 15.4 20 20"/>',
  menu:'<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9.5 4.5v15"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2"/><path d="M12 19.2v2"/><path d="M2.8 12h2"/><path d="M19.2 12h2"/><path d="M5.5 5.5 6.9 6.9"/><path d="M17.1 17.1l1.4 1.4"/><path d="M18.5 5.5 17.1 6.9"/><path d="M6.9 17.1 5.5 18.5"/>',
  moon:'<path d="M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8a8.6 8.6 0 1 0 10.8 10.8Z"/>',
  sparkle:'<path d="M12 3.4l1.9 5.7 5.7 1.9-5.7 1.9L12 18.6l-1.9-5.7L4.4 11l5.7-1.9Z"/>',
  info:'<circle cx="12" cy="12" r="8.25"/><path d="M12 11.2v5.4"/><circle cx="12" cy="7.9" r=".95" fill="currentColor" stroke="none"/>',
  layers:'<path d="M12 3.6 3.6 8 12 12.4 20.4 8Z"/><path d="M3.6 12.6 12 17l8.4-4.4"/><path d="M3.6 16.8 12 21.2l8.4-4.4"/>',
  expand:'<path d="M4.6 9.4V4.6h4.8"/><path d="M14.6 4.6h4.8v4.8"/><path d="M19.4 14.6v4.8h-4.8"/><path d="M9.4 19.4H4.6v-4.8"/>',
  /* The width pair. A narrow column and a wide one, drawn as the same rounded
     rectangle at two widths: the control is about how much of the window the
     text takes, so the glyph is about how much of the square the rectangle
     takes. */
  column:'<rect x="8.7" y="4" width="6.6" height="16" rx="1.4"/>',
  wide:'<rect x="3.2" y="4" width="17.6" height="16" rx="1.4"/>'
};
function icon(name,cls){
  const d=ICONS[name];
  if(!d)return '';
  return '<svg class="i'+(cls?' '+cls:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+d+'</svg>';
}
/* ---------------- Reading modes, and the two widths ----------------
   Paper is the default: the site is read far more often in daylight than in the
   dark, and the old default of a blue-black dashboard made every session start
   in the wrong room. Whatever the reader picks is remembered.

   Eight modes is why the top-bar control is a palette that opens a picker
   rather than the old sun/moon switch - with eight modes a two-state button has
   nothing to toggle. THEMES here is the source of truth for that picker, and it
   has to stay in step with two places that cannot read it:
     * assets/css/tokens.css, which declares one [data-theme="..."] block per id
       (a block that is missing means every token in it is UNDEFINED, not
       inherited from the base theme);
     * the boot script in each entry page, which has to set the mode before the
       first paint and so cannot wait for this file to load.
   tools/check_themes.py fails when the three lists drift apart.

   `strip` is the five swatches the mode was designed from - the picker shows
   them, so each tile reads like the palette it came from. `meta` is the browser
   chrome colour (a phone's address bar) and must match that mode's --bg. */
const THEMES=[
  /* The two defaults are the reader's reference palette (see tokens.css). The
     names describe it: white cards on a cool desk, and the same desk at night. */
  {id:'light',      name:'Daylight',            kind:'light', meta:'#f0f4f8', strip:['#f0f4f8','#ffffff','#eff6ff','#2563eb','#1e293b']},
  {id:'dark',       name:'Midnight',            kind:'dark',  meta:'#0f172a', strip:['#0f172a','#1e293b','#16233f','#60a5fa','#f1f5f9']},
  {id:'romantic',   name:'Romantic Blend',     kind:'light', meta:'#fcf2f5', strip:['#f5cdd0','#f4b3c7','#e69cba','#eb6e9b','#826e8b']},
  {id:'peacock',    name:'Peacock Feather',    kind:'light', meta:'#f4f9ee', strip:['#e1edd4','#cae5bc','#70d6c5','#4e9ce8','#4d52b4']},
  {id:'sunsetpeach',name:'Sunset View · Peach',kind:'light', meta:'#fdf6ea', strip:['#f5e4c4','#f5d6a2','#f5b297','#c78997','#8a99b1']},
  {id:'purpleblend',name:'Purple Blend',       kind:'dark',  meta:'#1a0a25', strip:['#2b103c','#3d2a5d','#572866','#8f529b','#ac91c0']},
  {id:'sunsetwine', name:'Sunset View · Wine', kind:'dark',  meta:'#230a11', strip:['#812d35','#934372','#b9689f','#c388a9','#536ca5']},
  {id:'eveningmix', name:'Evening Mix',        kind:'dark',  meta:'#0e0d15', strip:['#0e0d15','#182346','#3d5387','#7c83ad','#bfa9ba']},
  /* The ninth is derived, not declared - see custom-theme.js. What is fixed here
     is only what a reader who has never opened the picker sees, and it has to
     match [data-theme="custom"] in tokens.css, which tools/check_themes.py and
     tools/test_custom_theme.js both enforce. `kind`, `meta` and `strip` are
     replaced live by mode() below the moment there are two colours to derive
     from; these are the seed values. */
  {id:'custom',     name:'Yours',              kind:'light', meta:'#f6f5f2', strip:['#f6f5f2','#edebe4','#dedfee','#4f5bd5','#2b281e'], custom:true}
];
/* The other axis. Comfort is the phone and the small laptop; Full is a laptop
   run at full screen, where the centred column's margins were the complaint. */
const WIDTHS=[
  {id:'comfort', name:'Comfort', ico:'column', hint:'narrow centred column, short lines'},
  {id:'full',    name:'Full',    ico:'wide',   hint:'wide column, uses the whole screen'}
];
const html=document.documentElement,tBtn=document.getElementById('themeBtn'),wBtn=document.getElementById('widthBtn');
/* Derived palettes are memoised on the two colours they came from: derive()
   solves ~40 colours by walking, and mode() is called on every paint of the
   button and every open of the picker. */
let customMemo={key:'',val:null};
function customNow(){
  const s=CustomTheme.stored(),key=s.accent+'|'+s.surface;
  if(key!==customMemo.key){
    const pal=CustomTheme.derive(s.accent,s.surface);
    customMemo={key,val:{accent:s.accent,surface:s.surface,palette:pal,
                         record:CustomTheme.pack(pal,s.accent,s.surface)}};
  }
  return customMemo.val;
}
/* `mode(id)` is the single place that answers "what does this mode look like".
   Custom is the one id whose answer is not in the table above, so it is answered
   from the derivation instead - which means the top-bar swatches, the picker's
   Light/Dark label, the browser chrome and the applied palette all move together
   when the reader drags a colour, with nothing else to keep in step. */
const mode=id=>{
  const base=THEMES.find(t=>t.id===id)||THEMES[0];
  if(!base.custom)return base;
  const p=customNow().palette;
  return {id:'custom',name:base.name,kind:p.kind,meta:p.meta,strip:p.strip,custom:true};
};
const widthOf=id=>WIDTHS.find(w=>w.id===id)||WIDTHS[0];
function swatchRow(strip,cls){
  return '<span class="'+(cls||'tp-strip')+'" aria-hidden="true">'+
    strip.map(c=>'<i style="background:'+c+'"></i>').join('')+'</span>';
}
/* The button's own glyph is a strip of the current mode's five colours, so the
   swatch in the top bar already says which room you are in. */
function paintThemeBtn(){
  const t=mode(html.getAttribute('data-theme'));
  tBtn.innerHTML=swatchRow(t.strip,'btn-strip');
  const label='Reading mode: '+t.name+' ('+t.kind+')';
  tBtn.title=label+' - choose another';
  tBtn.setAttribute('aria-label',label+', choose another');
}
function setTheme(id,save){
  const t=mode(id);
  // Custom is the one mode whose colours live INLINE on <html>, because they
  // cannot be written into a stylesheet. Inline beats every selector, so leaving
  // them there while another mode is selected would leave every other palette
  // painted in the reader's own colours - hence the else branch, which is not
  // tidiness but the difference between the switch working and not.
  if(t.custom){
    const now=customNow();
    CustomTheme.apply(now.palette,html);
    CustomTheme.remember(now.accent,now.surface,now.palette);
  }else{
    CustomTheme.clear(html);
  }
  html.setAttribute('data-theme',t.id);
  // The browser's own chrome - the mobile address bar, the PWA title bar -
  // follows the mode the reader chose, not the one the OS guessed.
  const meta=document.getElementById('themeColor');
  if(meta)meta.setAttribute('content',t.meta);
  syncFigureDim();
  paintThemeBtn();
  syncPicker();
  if(save!==false)localStorage.setItem(NS+'-theme',t.id);
}
/* A slide is a screenshot of white paper, and the reader may have chosen a
   near-black page to read it on. Chapter 2 alone shows 56 of them, so at full
   brightness the mode is a lamp pointed at the reader.

   The amount is measured off the mode's OWN `--bg` rather than taken from a list
   of "the dark modes": the ninth mode is the reader's own colours, and it is
   answered by the colour they actually picked, the same way the eight declared
   ones are. 0.86 takes a slide's white from 255 to about 219 - still white paper,
   without the glare. It lands on the full-screen viewer too, because that is
   where the reader sits closest to the page. */
function syncFigureDim(){
  const bg=String(getComputedStyle(html).getPropertyValue('--bg')||'').trim();
  const l=window.CustomTheme&&CustomTheme.lum?CustomTheme.lum(bg):null;
  if(l==null){html.style.removeProperty('--fig-dim');return}
  html.style.setProperty('--fig-dim',l<0.2?'0.86':'1');
}
/* A colour input fires `input` continuously while the picker is open. Each one
   re-derives the whole palette, applies it, and rewrites the cached copy the
   boot script reads - which is the reason a reload does not flash the seed. */
function tuneCustom(which,value){
  const s=CustomTheme.stored();
  const accent=which==='accent'?value:s.accent, surface=which==='surface'?value:s.surface;
  // Colours first, then drop the memo: customNow() derives FROM storage, so
  // writing the new value after invalidating would re-derive the old palette
  // and cache it under the new key.
  CustomTheme.remember(accent,surface);
  customMemo={key:'',val:null};
  const now=customNow();
  CustomTheme.remember(now.accent,now.surface,now.palette);
  CustomTheme.apply(now.palette,html);
  html.setAttribute('data-theme','custom');
  syncFigureDim();
  const meta=document.getElementById('themeColor');
  if(meta)meta.setAttribute('content',now.palette.meta);
  paintThemeBtn();
  syncPicker();
  if(pop)localStorage.setItem(NS+'-theme','custom');
}
/* The two colour wells, and the live swatches on the Custom tile. They are a
   separate block from the radio grid rather than inside the Custom button,
   because an <input> inside a <button> is invalid markup and the click would be
   swallowed by the button underneath it. */
function paintTune(){
  const row=pop&&pop.querySelector('#tpTune');
  if(!row)return;
  const on=html.getAttribute('data-theme')==='custom';
  row.hidden=!on;
  if(!on)return;
  const s=CustomTheme.stored();
  const a=row.querySelector('#tpAccent'),f=row.querySelector('#tpSurface');
  if(a&&a.value.toLowerCase()!==s.accent)a.value=s.accent;
  if(f&&f.value.toLowerCase()!==s.surface)f.value=s.surface;
}
function paintCustomTile(){
  const tile=pop&&pop.querySelector('.tp-item[data-mode="custom"]');
  if(!tile)return;
  const t=mode('custom');
  const strip=tile.querySelector('.tp-strip');
  if(strip)strip.innerHTML=t.strip.map(c=>'<i style="background:'+c+'"></i>').join('');
  const kind=tile.querySelector('.tp-txt span');
  if(kind)kind.textContent=t.kind==='dark'?'Dark':'Light';
}
function paintWidthBtn(){
  const w=widthOf(html.getAttribute('data-width')),other=w.id==='full'?'Comfort':'Full';
  wBtn.innerHTML=icon(w.ico);
  wBtn.setAttribute('aria-pressed',w.id==='full'?'true':'false');
  const label='Layout: '+w.name+' - '+w.hint+'. Switch to '+other+'.';
  wBtn.title=label;wBtn.setAttribute('aria-label',label);
}
function setWidth(id,save){
  const w=widthOf(id);
  html.setAttribute('data-width',w.id);
  paintWidthBtn();
  if(save!==false)localStorage.setItem(NS+'-width',w.id);
}
/* The picker.

   A radiogroup rather than a menu: the modes are one choice out of eight, and
   that is exactly what a screen reader should announce. Choosing a mode does NOT
   close the panel - the point of eight palettes is comparing them, so the page
   behind repaints and the panel stays until you pick something else, press Esc,
   or click away. */
let pop=null;
function tiles(){return pop?Array.prototype.slice.call(pop.querySelectorAll('.tp-item')):[];}
function buildPicker(){
  const el=document.createElement('div');
  el.className='theme-pop';
  el.id='themePop';
  el.setAttribute('role','dialog');
  el.setAttribute('aria-label','Reading mode');
  el.hidden=true;
  el.innerHTML=
    '<p class="tp-head"><b>Reading mode</b><span>'+THEMES.length+' modes · remembered on this device</span>'+
      // Sync is here rather than in the top bar because it is about the MODE, and
      // the mode is what this panel is for. It copies a link; see applyLink().
      '<button type="button" class="tp-sync" id="tpSync" title="Copy a link that opens this mode and this width on another device">Sync</button></p>'+
    '<div class="tp-grid" role="radiogroup" aria-label="Reading mode">'+
      THEMES.map(id=>{
        // through mode(), not the table: the Custom tile shows the reader's own
        // five colours and its current kind, both of which move as they drag.
        const t=mode(id.id);
        return '<button type="button" class="tp-item" role="radio" aria-checked="false" data-mode="'+t.id+'" tabindex="-1">'+
          swatchRow(t.strip)+
          '<span class="tp-txt"><b>'+t.name+'</b><span>'+(t.kind==='dark'?'Dark':'Light')+'</span></span>'+
          '<svg class="i tp-tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.6 9.6 17 19 7"/></svg>'+
        '</button>';
      }).join('')+
    '</div>'+
    // Only shown while Custom is the chosen mode: two colour wells sitting under
    // eight finished palettes would read as a ninth palette you are meant to
    // colour in first, which is the wrong way round.
    '<div class="tp-tune" id="tpTune" hidden>'+
      '<p class="tp-sub">Your two colours - the rest is derived from them.</p>'+
      '<div class="tp-wells">'+
        '<label for="tpAccent">Accent<input type="color" id="tpAccent" aria-label="Accent colour"></label>'+
        '<label for="tpSurface">Page<input type="color" id="tpSurface" aria-label="Page colour"></label>'+
      '</div>'+
    '</div>';
  el.addEventListener('click',e=>{
    const b=e.target.closest('.tp-item');
    if(b){setTheme(b.dataset.mode);return;}
    if(e.target.closest('#tpSync'))shareAppearance();
  });
  // `input` and not `change`: dragging inside a colour well should repaint the
  // page behind the panel, which is the whole reason to have nine modes.
  el.addEventListener('input',e=>{
    if(e.target.id==='tpAccent')tuneCustom('accent',e.target.value);
    else if(e.target.id==='tpSurface')tuneCustom('surface',e.target.value);
  });
  el.addEventListener('keydown',e=>{
    // The colour wells are in this panel but not in the radio group: arrows
    // inside a colour input move its channel, and hijacking that would make the
    // well unusable.
    if(e.target.tagName==='INPUT'){
      if(e.key==='Escape'){e.preventDefault();closePicker();}
      return;
    }
    const list=tiles(),i=list.indexOf(document.activeElement);
    if(e.key==='Escape'){e.preventDefault();closePicker();return;}
    let n=null;
    if(e.key==='ArrowDown'||e.key==='ArrowRight')n=i+1;
    else if(e.key==='ArrowUp'||e.key==='ArrowLeft')n=i-1;
    else if(e.key==='Home')n=0;
    else if(e.key==='End')n=list.length-1;
    if(n===null)return;
    e.preventDefault();
    n=(n+list.length)%list.length;
    list.forEach(b=>b.tabIndex=-1);
    list[n].tabIndex=0;
    list[n].focus();
  });
  return el;
}
function syncPicker(){
  if(!pop)return;
  const cur=html.getAttribute('data-theme');
  tiles().forEach(b=>{
    const on=b.dataset.mode===cur;
    b.setAttribute('aria-checked',on?'true':'false');
    b.tabIndex=on?0:-1;
  });
  paintCustomTile();
  paintTune();
}
function openPicker(){
  if(!pop){
    pop=buildPicker();
    document.querySelector('.topbar-r').appendChild(pop);
  }
  syncPicker();
  pop.hidden=false;
  tBtn.setAttribute('aria-expanded','true');
  const cur=pop.querySelector('.tp-item[aria-checked="true"]')||tiles()[0];
  if(cur)cur.focus();
}
function closePicker(refocus){
  if(!pop||pop.hidden)return;
  pop.hidden=true;
  tBtn.setAttribute('aria-expanded','false');
  if(refocus!==false)tBtn.focus();
}
tBtn.setAttribute('aria-haspopup','true');
tBtn.setAttribute('aria-expanded','false');
tBtn.onclick=()=>{(pop&&!pop.hidden)?closePicker():openPicker();};
wBtn.onclick=()=>setWidth(html.getAttribute('data-width')==='full'?'comfort':'full');
document.addEventListener('pointerdown',e=>{
  if(!pop||pop.hidden)return;
  if(pop.contains(e.target)||tBtn.contains(e.target))return;
  closePicker(false);
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closePicker(false);});
/* ---------------- the link: how a choice reaches another device ----------------

   A reader who has picked their mode on a laptop should not have to pick it
   again on a phone, and the honest way to do that without an account or a
   backend is a URL - the format lives in custom-theme.js, with the reasoning.

   THE TWO HALVES MATTER EQUALLY. Sync() writes the reader's appearance into a
   link, and applyLink() is what makes opening that link on the other device
   change anything: without it the parameters would be decoration. */
function appearanceURL(){
  const s=CustomTheme.stored();
  return location.origin+location.pathname+location.hash+
    CustomTheme.link({theme:html.getAttribute('data-theme'),
                      width:html.getAttribute('data-width'),
                      accent:s.accent,surface:s.surface});
}
function shareAppearance(){
  const url=appearanceURL();
  const done=()=>toast('Link copied - open it on your other device');
  const ask=()=>window.prompt('Copy this link and open it on your other device',url);
  // Over https (GitHub Pages, Netlify) the clipboard API is available. Over
  // plain http it is not, which is exactly how this gets tested locally - hence
  // the prompt, which is not a fallback anyone should be embarrassed about: it
  // shows a selectable URL and works everywhere, including a denied permission.
  if(navigator.clipboard&&navigator.clipboard.writeText)
    navigator.clipboard.writeText(url).then(done,ask);
  else ask();
}
/* Opening a link that carries an appearance applies it AND stores it, so the
   next visit on this device needs no link. The parameters are then taken back
   off the URL: left in place, a reload would re-assert a mode the reader may
   have changed since - the link is a courier, not a setting. Only the SEARCH is
   rewritten; the site routes on the hash, and dropping that would lose the
   reader's place in the chapter. */
function applyLink(){
  let L;
  try{ L=CustomTheme.readLink(location.search); }catch(e){ return; }
  if(!L.theme&&!L.width)return;
  if(L.accent&&L.surface)CustomTheme.remember(L.accent,L.surface);
  if(L.theme&&THEMES.some(t=>t.id===L.theme))localStorage.setItem(NS+'-theme',L.theme);
  if(L.width)localStorage.setItem(NS+'-width',L.width);
  if(history.replaceState)history.replaceState(null,'',location.pathname+location.hash);
}
applyLink();
/* `false` = do not write these back: the boot script in the entry page already
   read the stored values and set both attributes before the first paint, so
   this call only paints the two buttons to match. */
setTheme(localStorage.getItem(NS+'-theme')||'light',false);
setWidth(localStorage.getItem(NS+'-width')||'comfort',false);
/* Toast */
/* A toast is the only feedback some actions give ("+10 XP", "Saved"), so it is
   a polite status region rather than a silent div. It enters and leaves with a
   transition rather than a keyframe animation: two "+2 XP" toasts a second
   apart must retarget from where the first one is, and a keyframe would snap
   it back to the top of the animation instead. */
function toast(msg){
  const t=document.createElement('div');
  t.className='toast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');
  t.innerHTML=msg;document.body.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('in'));
  setTimeout(()=>{t.classList.remove('in');t.classList.add('hide');setTimeout(()=>t.remove(),320)},2400);
}
/* ---------------- Helpers ---------------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

/* ---------------- Design layer helpers ---------------- */
/* Wide comparison tables scroll instead of breaking the reading column, and a
   cell that holds nothing but a number is right-aligned in tabular monospace so
   digit columns line up. Applied to the rendered HTML, so no chapter file,
   quiz question or past answer has to change. */
function enhanceContent(root){
  if(!root)return;
  root.querySelectorAll('table').forEach(tb=>{
    const p=tb.parentElement;
    if(!p||p.classList.contains('table-scroll'))return;
    const wrap=document.createElement('div');
    wrap.className='table-scroll';
    p.insertBefore(wrap,tb);wrap.appendChild(tb);
    // A long table gets a scrolling box and a pinned header so the column
    // titles stay visible while the numbers scroll.
    const rows=tb.querySelectorAll('tbody tr').length||tb.querySelectorAll('tr').length;
    if(rows>=9)wrap.classList.add('tall');
  });
  root.querySelectorAll('table td').forEach(td=>{
    if(td.classList.contains('num'))return;
    const t=td.textContent.trim();
    if(t&&t.length<=14&&/^[-+]?[\d][\d,]*\.?\d*%?$/.test(t))td.classList.add('num');
  });
  // A figure is drawn in its own coordinate space, so its labels are only as
  // legible as the scale it is finally rendered at. Each one gets a floor of
  // 100% of its own viewBox width - its designed size - and below that the
  // wrapper scrolls sideways instead of shrinking the drawing.
  //
  // That floor used to be 85%. It was measured against the figures and the two
  // longest ones - the Ch 1 twelve-step flowchart and the Ch 8 event loop -
  // were already sitting *on* the floor, so they were scrolling sideways AND
  // rendering their loop labels at 9.6px, which is below the 11px this site
  // promises nothing goes under. They were paying the scroll cost for nothing.
  // At 100% those labels render at their authored 11.5px. Measured across all
  // 163 figure labels: nothing below 11px now, against a 9.63px worst case.
  root.querySelectorAll('svg[viewBox]').forEach(sv=>{
    const w=parseFloat(String(sv.getAttribute('viewBox')).trim().split(/[\s,]+/)[2]);
    if(w>0)sv.style.setProperty('--fig-min',Math.round(w)+'px');
  });
  /* A bitmap figure - one of the teacher's slides, or a rendered page from a
     deck - has no viewBox, so there is no designed size to read off. It does
     have width and height attributes, written from each file's real size when
     the page was built, and those are known BEFORE the image decodes. That is
     what makes this pass synchronous.

     naturalWidth looked equivalent and was not. These images are `loading=lazy`,
     so an off-screen one has no naturalWidth at all: the floor was never set,
     the wrapper never overflowed, and the slide rendered at column width with no
     way to open it - on a phone, which is the one reader the floor exists for.
     Measured on Unit 8: twelve images, none loaded, none with a floor.

     The floor is a LEGIBILITY floor rather than a designed size, and capped at
     980px so a tablet or desktop column is never made to scroll a picture that
     would have fitted. Below that the true width wins. Under either, the wrapper
     scrolls and offers the full-screen viewer, exactly as a wide drawing does. */
  const IMG_FLOOR_MAX=980;
  root.querySelectorAll('figure img').forEach(img=>{
    const w=parseInt(img.getAttribute('width'),10)||img.naturalWidth;
    if(w>0)img.style.setProperty('--fig-min',Math.min(w,IMG_FLOOR_MAX)+'px');
  });
  syncScrollers(root);
}
/* The way into the full-screen viewer. It is a <button>, not a note: the text it
   replaces ("Scrolls sideways for the full figure") described a problem, and this
   is the same sentence with a solution attached. aria-label names the target
   because "View full screen" on its own does not say what of. */
function expandBtn(el,kind){
  const b=document.createElement('button');
  b.type='button';
  b.className='xv-open';
  b.innerHTML=icon('expand')+'<span>View full screen</span>';
  b.setAttribute('aria-label','View this '+kind+' full screen, with zoom and pan');
  b.onclick=()=>openExhibit(el,b);
  return b;
}
/* Wide exhibits - tables, figures, worked numericals - scroll sideways whenever
   the column is narrower than they are. Two things have to hold for that to be
   usable, and neither happens by itself.

   1. The region must be reachable without a mouse. Chromium does NOT put an
      overflow container in the tab order on its own: measured here, the Ch 1
      flowchart with 286px of itself off-screen reported tabIndex -1 and could be
      moved by drag and by nothing else, so a keyboard user could not read the
      half of a diagram that a phone reader sees by default. A tabindex plus a
      name (the documented focusable-scroll-region pattern) is the fix, and the
      name is why the region is announced as "Scrollable figure" rather than
      showing up as an unnamed box.

   2. A reader has to be able to tell the drawing continues. A figure that stops
      halfway across can read as a broken image rather than as "scroll me", so an
      overflowing figure's caption says so - and stops saying it as soon as the
      window is wide enough for the whole drawing, because a wide monitor should
      not carry a note about a problem it does not have.

   Both are decided from measurement rather than from a media query. Whether an
   exhibit overflows is a question about the column it landed in, not about the
   window: the same table fits at 900px with the drawer and scrolls at 1024px
   with the chapter list open. */
const SCROLL_LABEL={
  'figure-wrap':'Scrollable figure \u2014 use the arrow keys or drag to see all of it',
  'table-scroll':'Scrollable table \u2014 use the arrow keys or drag to see all of it'
};
function syncScrollers(root){
  const scope=root||document;
  scope.querySelectorAll('.figure-wrap,.table-scroll,.code-block,.formula-box,.worked').forEach(el=>{
    // Observing an element twice is a no-op, so this can run on every pass.
    if(scrollerRO)scrollerRO.observe(el);
    // Reading clientWidth forces layout once per element, so this pass is only
    // worth running where the answer can have changed: see the call sites.
    const over=el.scrollWidth-el.clientWidth>2;
    if(over){
      el.tabIndex=0;
      // A scrolling table wrapper, code block or worked example is a generic
      // element, and a name on a generic element is not announced - so it needs
      // a role to carry the name. A <figure> already has one and is left alone
      // (aria-label names the figure itself, which is exactly what is wanted).
      if(el.tagName!=='FIGURE'&&!el.hasAttribute('role'))el.setAttribute('role','group');
      if(!el.hasAttribute('aria-label')){
        const cls=[...el.classList].find(c=>SCROLL_LABEL[c]);
        el.setAttribute('aria-label',SCROLL_LABEL[cls]||'Scrollable content \u2014 use the arrow keys or drag to see all of it');
      }
    }else{
      // Nothing is hidden any more, so it is not a tab stop and not a named
      // region: all three attributes are this function's own, never the content's.
      el.removeAttribute('tabindex');
      el.removeAttribute('role');
      el.removeAttribute('aria-label');
    }
    /* Offer the whole picture when a THIRD OR MORE of an exhibit is off-screen,
       and stay quiet about the rest. A 2px overflow needs no affordance, and at
       390px Chapter 2 has ten tables that scroll - a button on every one of them
       would turn a control into a tic. A table missing a third of itself is a
       different thing from one missing its last digit.

       That leaves the lightly-overflowing exhibits without a button, which is
       why the second route in is a tap on the exhibit itself: a figure only has
       to be wider than its column to be worth opening whole, not a third wider.
       See the tap handler below openExhibit.

       Gated on `over` as well as on the two-thirds test, and not just as an
       optimisation. A collapsed answer or a hidden tab panel measures 0 wide AND
       0 of hidden content, and `0-0 >= 0/3` is TRUE - so the raw comparison
       counts every folded exhibit on the page as mostly hidden and plants a
       button in it. Resting on a positive width is what makes "a third is
       hidden" mean what it says. */
    const mostlyHidden=over&&el.scrollWidth-el.clientWidth>=el.scrollWidth/3;
    if(el.classList.contains('figure-wrap')){
      const btn=el.querySelector(':scope > .xv-open');
      // Above the drawing, not in the caption below it. A tall figure is 934px
      // in a 844px viewport, so a button under it is a button the reader has to
      // scroll a whole diagram to reach; the caption was chosen to keep the
      // affordance at the START of the horizontal scroller, and the top of the
      // figure is at that same edge without also being below the fold.
      if(mostlyHidden&&!btn)el.insertBefore(expandBtn(el,'figure'),el.firstChild);
      else if(btn&&!mostlyHidden)btn.remove();
    }else if(el.classList.contains('table-scroll')){
      const prev=el.previousElementSibling,btn=prev&&prev.classList.contains('xv-open')?prev:null;
      if(mostlyHidden&&!btn)el.parentNode.insertBefore(expandBtn(el,'table'),el);
      else if(btn&&!mostlyHidden)btn.remove();
    }
  });
}
let scrollerSyncT=0;
/* A drag-resize fires this on every frame and each pass reads layout, so settle
   first. 120ms is under the threshold where the change reads as lag. */
function queueScrollerSync(){clearTimeout(scrollerSyncT);scrollerSyncT=setTimeout(()=>syncScrollers(),120)}

/* ---------------- Full-screen exhibit viewer ----------------
   A figure is drawn at its designed width - 640 to 950px - and a phone column is
   about 278. So a phone reader sees 39-55% of a diagram at a time and has to
   scroll the page sideways 2.6 screens to read one whole; that is not reading,
   that is assembling. Tapping an exhibit that does not fit opens it here
   instead: the drawing is cloned in at its designed size, scaled to fit the
   screen, and the reader pans and pinches from that whole-picture start.

   It is a CLONE, not the original moved in. Moving the live node would leave the
   chapter short by one figure while the overlay is open - the page behind would
   reflow and the scroll position would jump on close - and it would put the
   reader's chapter at the mercy of a modal. Cloning costs one id-rewrite pass
   and changes nothing on the page at all.

   The transform lives on a zero-sized layer at the stage's origin, so "zoom
   about the point under my fingers" is one translate and one scale about (0,0)
   and the arithmetic below stays checkable by hand. */
const xvDlg=document.getElementById('exhibitViewer'),xvStage=document.getElementById('xvStage'),
      xvPan=document.getElementById('xvPan'),xvTitleEl=document.getElementById('xvTitle'),
      xvPctEl=document.getElementById('xvPct'),xvCloseBtn=document.getElementById('xvClose'),
      xvInBtn=document.getElementById('xvIn'),xvOutBtn=document.getElementById('xvOut'),
      xvFitBtn=document.getElementById('xvFit');
let xv=null,xvIdSeq=0,xvTrigger=null,xvMoved=0,xvLastTap=0,xvLastTapAt=null;
const xvPts=new Map();

/* Ids inside the clone have to be made unique. Every figure carries its arrowhead
   in a <defs> with an id, and its paths point at it with url(#fx) - so a second
   copy of that id in the document leaves the reference resolving to whichever of
   the two the browser meets first. Rewriting the ids and every reference to them
   keeps the clone self-contained, and 'self-contained' is what makes cloning safe
   for exhibits nobody has written yet. */
function rewriteIds(c){
  const map=new Map();
  const add=n=>{const old=n.id;if(!old)return;map.set(old,'xv'+(++xvIdSeq));n.id=map.get(old)};
  if(c.id)add(c);
  c.querySelectorAll('[id]').forEach(add);
  if(!map.size)return c;
  const fix=v=>v.replace(/url\(\s*#([^)\s'"]+)\s*\)/g,(m,id)=>map.has(id)?'url(#'+map.get(id)+')':m)
                  .replace(/^#([^#\s]+)$/,(m,id)=>map.has(id)?'#'+map.get(id):m);
  c.querySelectorAll('*').forEach(n=>{
    for(const a of [...n.attributes]){
      if(a.name==='id')continue;
      // aria-labelledby holds ids with no '#' in front, so it is a token list
      // rather than a reference URL and needs its own pass.
      const v=(a.name==='aria-labelledby'||a.name==='aria-describedby')
        ? a.value.split(/\s+/).map(t=>map.get(t)||t).join(' ')
        : fix(a.value);
      if(v!==a.value)n.setAttribute(a.name,v);
    }
  });
  return c;
}

/* The clone is sized to the exhibit's DESIGNED width, not to the column it
   happened to land in - that is the entire point of the overlay. For a figure
   that is its own viewBox; for a table it is the full width the in-page scroller
   was hiding, read off the wrapper before the clone is detached from it. */
function prepareClone(wrap){
  const isFig=wrap.classList.contains('figure-wrap');
  /* The exhibit is a DIRECT CHILD of the wrapper, and that is load-bearing.

     An <img> is a figure too, and leaving it out of this lookup made a bitmap
     figure unopenable - the button appeared, because the wrapper really did
     overflow, and the tap did nothing, because prepareClone found no source and
     returned null. A control that exists and does nothing is worse than none.

     Adding it as a third fallback after a bare `querySelector('svg')` looked
     right and was not: an overflowing figure's button is inserted as the FIRST
     child of the wrapper, and that button's icon is an <svg class="i">. So the
     fallback matched the 24x24 expand icon and opened the overlay holding it -
     measured, the pan layer contained `svg.i` with a 24px inline width, not the
     slide. Every lookup here is scoped to direct children, so chrome that lives
     inside a control cannot be mistaken for the exhibit. */
  const src=isFig?(wrap.querySelector('svg.figure')
               ||wrap.querySelector(':scope > img')
               ||wrap.querySelector(':scope > svg'))
              :wrap.querySelector('table');
  if(!src)return null;
  const c=rewriteIds(src.cloneNode(true));
  if(isFig){
    const vb=src.getAttribute('viewBox'),d=vb&&vb.trim().split(/[\s,]+/).map(Number);
    if(d&&d[2]>0&&d[3]>0){
      // box-sizing is border-box site-wide and .figure carries padding, so the
      // CONTENT box is what has to be the viewBox size for the drawing's labels
      // to render at the size they were authored at.
      c.style.boxSizing='content-box';
      c.style.width=d[2]+'px';
      c.style.height=d[3]+'px';
    }else if(src.tagName==='IMG'&&src.naturalWidth>0){
      // A bitmap's own pixels are its coordinate space the way a viewBox is a
      // drawing's. `loading=lazy` is dropped from the clone for the same reason
      // the size is set: a lazy image inside an overlay that is already open is
      // a picture that may never arrive, and an unsized one cannot be fitted.
      c.style.boxSizing='content-box';
      c.style.width=src.naturalWidth+'px';
      c.style.height=src.naturalHeight+'px';
      c.removeAttribute('loading');
    }
  }else{
    c.style.width=Math.max(wrap.scrollWidth,wrap.clientWidth)+'px';
  }
  // The in-page chrome (.figure's 560px cap, .table-scroll's margins) is about
  // fitting the column, and the column is what this overlay exists to escape.
  c.style.maxWidth='none';
  c.style.minWidth='0';
  c.style.margin='0';
  return c;
}

/* Pointer coordinates arrive in viewport space and the pan layer is positioned
   from the stage's origin, so every gesture has to be rebased or a phone's URL
   bar (and this dialog's own toolbar) lands in the middle of the zoom. */
function xvLocal(cx,cy){
  const r=xvStage.getBoundingClientRect();
  return{x:cx-r.left,y:cy-r.top};
}
/* Content smaller than the stage is centred; content larger is clamped to its own
   edges. Together those mean the drawing can never be flung off-screen and lost,
   which is the one failure a pan gesture has no way to recover from. */
function xvClamp(){
  const w=xv.cw*xv.s,h=xv.ch*xv.s;
  xv.tx=w<=xv.sw?(xv.sw-w)/2:Math.min(0,Math.max(xv.sw-w,xv.tx));
  xv.ty=h<=xv.sh?(xv.sh-h)/2:Math.min(0,Math.max(xv.sh-h,xv.ty));
}
function xvApply(){
  if(!xv)return;
  xv.s=Math.max(xv.min,Math.min(xv.max,xv.s));
  xvClamp();
  xvPan.style.transform='translate('+xv.tx.toFixed(2)+'px,'+xv.ty.toFixed(2)+'px) scale('+xv.s.toFixed(4)+')';
  xvPctEl.textContent=Math.round(xv.s/xv.fit*100)+'%';
  // aria-disabled rather than disabled: a control that switches itself off as you
  // reach for it takes the focus ring with it.
  const lim=(btn,at)=>btn.setAttribute('aria-disabled',at?'true':'false');
  lim(xvOutBtn,xv.s<=xv.min+1e-6);
  lim(xvInBtn,xv.s>=xv.max-1e-6);
  xvFitBtn.setAttribute('aria-disabled',xv.s<=xv.fit+1e-6?'true':'false');
}
function xvZoomAt(px,py,next){
  if(!xv)return;
  const s=Math.max(xv.min,Math.min(xv.max,next));
  if(s===xv.s)return;
  // The point of the drawing under the fingers stays under the fingers.
  const cx=(px-xv.tx)/xv.s,cy=(py-xv.ty)/xv.s;
  xv.s=s;xv.tx=px-cx*s;xv.ty=py-cy*s;
  xvApply();
}
function xvZoomBy(f,px,py){
  if(!xv)return;
  xvZoomAt(px==null?xv.sw/2:px,py==null?xv.sh/2:py,xv.s*f);
}
function xvReset(){if(!xv)return;xv.s=xv.fit;xvApply()}

function xvTitleFor(wrap){
  // Both buttons are SIBLINGS of the drawing, never inside it, so the caption is
  // still just the caption and can be read straight out.
  const cap=wrap.querySelector('figcaption')||wrap.querySelector('caption');
  if(cap){
    const t=cap.textContent.replace(/\s+/g,' ').trim();
    if(t)return t;
  }
  const sec=wrap.closest('.learn-sec');
  const h=sec&&sec.querySelector('h2');
  if(h){const t=h.textContent.replace(/\s+/g,' ').trim();if(t)return t}
  return wrap.classList.contains('figure-wrap')?'Figure':'Table';
}

function openExhibit(wrap,trigger){
  if(!wrap||xvDlg.open)return false;
  const node=prepareClone(wrap);
  if(!node)return false;
  xvTitleEl.textContent=xvTitleFor(wrap);
  xvPan.textContent='';
  xvPan.appendChild(node);
  if(typeof xvDlg.showModal==='function')xvDlg.showModal();else xvDlg.setAttribute('open','');
  // The chapter behind must not move while the overlay is up: on a phone the two
  // are the same surface, and a stray drag off the stage would scroll the notes.
  document.documentElement.classList.add('xv-locked');
  // Measured with the dialog already open (a closed dialog has no stage) and with
  // the transform cleared, or offsetWidth would report the last scaled box.
  xvPan.style.transform='none';
  const cw=node.offsetWidth||node.scrollWidth,ch=node.offsetHeight||node.scrollHeight,
        sw=xvStage.clientWidth,sh=xvStage.clientHeight;
  if(!cw||!ch||!sw||!sh){closeExhibit();return false}
  const fit=Math.min(sw/cw,sh/ch);
  xv={cw,ch,sw,sh,fit,min:fit,max:Math.max(fit*8,3),s:fit,tx:0,ty:0};
  xvReset();
  xvTrigger=trigger||null;
  // Focus the way out rather than the first zoom button: the first thing a
  // reader wants confirmed is that they can leave.
  xvCloseBtn.focus();
  return true;
}
function xvTeardown(){
  xvPan.textContent='';
  xvPan.style.transform='none';
  document.documentElement.classList.remove('xv-locked');
  xvStage.classList.remove('grabbing');
  xvPts.clear();
  xv=null;
  const t=xvTrigger;
  xvTrigger=null;
  // Back to the button that opened it, so the reader lands where they left off
  // rather than at the top of the document.
  if(t&&document.contains(t))t.focus();
}
function closeExhibit(){
  // Closed first so the overlay leaves the top layer in this same task - tearing
  // down first would show one frame of an empty stage - and then the state is
  // cleared immediately rather than waiting for an event to come back.
  if(xvDlg.open)xvDlg.close();
  xvTeardown();
}
/* Every way out of the dialog ends the same way - the close button, Escape (which
   the engine handles itself, without my code running at all) and a tap on the
   empty stage - and only the first is a click of mine. What all three share is
   the `open` attribute going away, so that is the thing to watch.

   Watching the ATTRIBUTE rather than the dialog's `close` event is a fix, not
   belt-and-braces. Measured in the desktop app's embedded browser (Electron 33 /
   Chromium 130): close() removes `open` and sets dialog.open to false WITHOUT
   ever dispatching `close` - for a bare <dialog> as well as for this one, so it
   is the build and not the markup. A teardown hung off that event leaves the
   chapter locked against scrolling with no way back, which is exactly what it
   did until this observer replaced it. The event is deliberately not used. */
new MutationObserver(()=>{if(!xvDlg.open)xvTeardown()}).observe(xvDlg,{attributeFilter:['open']});
xvCloseBtn.onclick=()=>closeExhibit();
xvInBtn.onclick=()=>{if(xvInBtn.getAttribute('aria-disabled')!=='true')xvZoomBy(1.3)};
xvOutBtn.onclick=()=>{if(xvOutBtn.getAttribute('aria-disabled')!=='true')xvZoomBy(1/1.3)};
xvFitBtn.onclick=()=>xvReset();

/* Pan and pinch. Pointer events cover mouse, touch and pen with one code path,
   and the pointer set is a Map so a third finger landing mid-pinch does not
   scramble the two that are doing the work. */
xvStage.addEventListener('pointerdown',ev=>{
  if(!xv)return;
  xvStage.setPointerCapture(ev.pointerId);
  xvPts.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
  xvMoved=0;
  xvStage.classList.add('grabbing');
  ev.preventDefault();
});
xvStage.addEventListener('pointermove',ev=>{
  if(!xv||!xvPts.has(ev.pointerId))return;
  const was=xvPts.get(ev.pointerId),before=new Map(xvPts);
  xvPts.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
  ev.preventDefault();
  xvMoved+=Math.abs(ev.clientX-was.x)+Math.abs(ev.clientY-was.y);
  const pts=[...xvPts.values()];
  if(pts.length===1){
    xv.tx+=pts[0].x-was.x;
    xv.ty+=pts[0].y-was.y;
    xvApply();
    return;
  }
  if(pts.length===2&&before.size===2){
    const p=[...before.values()];
    const mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
    const m0=mid(p[0],p[1]),m1=mid(pts[0],pts[1]);
    const d0=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)||1,
          d1=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y)||1;
    const l=xvLocal(m1.x,m1.y);
    // Scale about the fingers' midpoint first, then follow the midpoint: that
    // order is what makes a pinch feel attached to the drawing.
    xvZoomAt(l.x,l.y,xv.s*(d1/d0));
    xv.tx+=m1.x-m0.x;
    xv.ty+=m1.y-m0.y;
    xvApply();
  }
});
function xvRelease(ev){
  const had=xvPts.get(ev.pointerId);
  xvPts.delete(ev.pointerId);
  if(!xvPts.size)xvStage.classList.remove('grabbing');
  if(!xv||!had)return;
  // Double-tap toggles the whole picture and twice it, zoomed where the finger
  // landed - the fastest route from "too small to read" to "big enough".
  if(xvMoved>10||xvPts.size){
    xvLastTap=0;xvLastTapAt=null;return;
  }
  const now=Date.now(),l=xvLocal(ev.clientX,ev.clientY);
  if(xvLastTapAt&&now-xvLastTap<320&&Math.hypot(l.x-xvLastTapAt.x,l.y-xvLastTapAt.y)<32){
    xvLastTap=0;xvLastTapAt=null;
    if(xv.s>xv.fit*1.15)xvReset();
    else xvZoomAt(l.x,l.y,xv.fit*2);
  }else{
    xvLastTap=now;xvLastTapAt=l;
  }
}
xvStage.addEventListener('pointerup',xvRelease);
xvStage.addEventListener('pointercancel',xvRelease);
/* Wheel and trackpad pinch share one curve. A trackpad pinch arrives as a wheel
   with ctrlKey set and much smaller deltas, hence the stronger constant - and the
   page must not scroll behind it, hence preventDefault on a non-passive listener. */
xvStage.addEventListener('wheel',ev=>{
  if(!xv)return;
  ev.preventDefault();
  const l=xvLocal(ev.clientX,ev.clientY);
  xvZoomAt(l.x,l.y,xv.s*Math.exp(-ev.deltaY*(ev.ctrlKey?0.01:0.0018)));
},{passive:false});
/* Tap the empty part of the stage to leave. Guarded on xvMoved because a pan also
   ends in a click when the finger went down and up on the same element - without
   the guard, every pan would close the viewer. */
xvDlg.addEventListener('click',ev=>{
  if(xvMoved>10)return;
  if(ev.target===xvDlg||ev.target===xvStage||ev.target===xvPan)closeExhibit();
});
xvDlg.addEventListener('keydown',ev=>{
  if(!xv)return;
  const step=48;
  let hit=true;
  switch(ev.key){
    case '+':case '=':xvZoomBy(1.25);break;
    case '-':case '_':xvZoomBy(1/1.25);break;
    case '0':xvReset();break;
    case 'ArrowLeft':xv.tx+=step;xvApply();break;
    case 'ArrowRight':xv.tx-=step;xvApply();break;
    case 'ArrowUp':xv.ty+=step;xvApply();break;
    case 'ArrowDown':xv.ty-=step;xvApply();break;
    default:hit=false;
  }
  if(hit)ev.preventDefault();
});

/* The second way in, and the one that covers the exhibits the metered button rule
   leaves alone: a tap on the exhibit itself. What separates a tap from the two
   gestures that share it is movement and selection. A sideways drag to scroll, a
   press-and-hold to select a row of figures, a click on a citation chip or a
   summary inside the exhibit - all of them end in a click event, and none of them
   means "open this". */
let xvTapAt=null,xvTapT=0;
const contentEl=document.getElementById('contentArea');
contentEl.addEventListener('pointerdown',ev=>{xvTapAt={x:ev.clientX,y:ev.clientY};xvTapT=Date.now()},true);
contentEl.addEventListener('click',ev=>{
  if(xvDlg.open)return;
  const t=ev.target;
  const sc=t&&t.closest?t.closest('.figure-wrap,.table-scroll'):null;
  if(!sc||!xvTapAt)return;
  if(t.closest('a,button,summary,input,label,select,textarea,[data-page]'))return;
  if(Math.abs(ev.clientX-xvTapAt.x)>8||Math.abs(ev.clientY-xvTapAt.y)>8)return;
  if(Date.now()-xvTapT>800)return;   // a long press is a selection, not a tap
  const sel=window.getSelection&&window.getSelection();
  if(sel&&!sel.isCollapsed)return;
  if(sc.scrollWidth-sc.clientWidth<=2)return;   // nothing hidden, nothing to open
  openExhibit(sc,null);
},true);

/* Whether an exhibit overflows is a property of the box it was handed, so the
   thing worth listening to is the box changing - not the click that caused it.

   This replaces a click listener on the content area, which only ever saw the
   reveals a person made by hand. The PROGRAMMATIC ones went unnoticed: the
   Expand/Collapse-all buttons and a search result that opens the past question it
   matched both expand answers without firing a click inside the content area.
   Measured at 360px, two past-question tables in Chapter 1 that hide 45% and 55%
   of themselves opened with no note and no tabindex - reachable again only by
   dragging. A ResizeObserver sees every route to the change instead: a folded
   answer opening (0x0 becomes 278x620), a panel becoming the visible one, a
   window resize.

   The callback only queues. The pass mutates the DOM - a figure's note adds a
   line to its caption, which changes the figure's height - and mutating an
   observed element from inside its own ResizeObserver callback is how you land
   the "loop completed with undelivered notifications" error. */
const scrollerRO='ResizeObserver' in window?new ResizeObserver(()=>queueScrollerSync()):null;
/* ---------------- Chapter sections ---------------- */
/* A chapter is 30-60 screens of notes. Each h2 section gets its own chevron so
   one section can be folded away, and the chapter carries one Expand/Collapse
   All control. Sections start expanded: nothing is hidden unless asked. */
function buildSections(){
  const box=document.querySelector('#panel-learn .learn-content');
  if(!box||box.dataset.secs==='1')return;
  const kids=[...box.childNodes];
  let sec=null;
  kids.forEach(node=>{
    if(node.nodeType===1&&node.tagName==='H2'){
      sec=document.createElement('section');
      sec.className='learn-sec';
      box.insertBefore(sec,node);
      const head=document.createElement('div');
      head.className='sec-head';
      sec.appendChild(head);
      head.appendChild(node);
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='sec-toggle';
      btn.title='Collapse or expand this section';
      btn.setAttribute('aria-expanded','true');
      btn.innerHTML=icon('chevron','caret');
      const target=sec;              // capture: `sec` moves on to the next heading
      btn.onclick=()=>toggleSection(target);
      head.appendChild(btn);
      return;
    }
    if(sec)sec.appendChild(node);
  });
  box.dataset.secs='1';
  const key=NS+'-collapsed-'+cur;
  let stored=[];
  try{stored=JSON.parse(localStorage.getItem(key)||'[]')}catch(e){stored=[]}
  box.querySelectorAll('section.learn-sec').forEach((s,i)=>{if(stored.includes(i))setSection(s,false,false)});
}
function setSection(sec,open,remember){
  sec.classList.toggle('collapsed',!open);
  const b=sec.querySelector('.sec-toggle');
  if(b)b.setAttribute('aria-expanded',open?'true':'false');
  if(remember!==false){
    const all=[...document.querySelectorAll('#panel-learn section.learn-sec')];
    const idx=all.map(s=>s.classList.contains('collapsed'));
    try{localStorage.setItem(NS+'-collapsed-'+cur,JSON.stringify(idx.map((v,i)=>v?i:-1).filter(i=>i>=0)))}catch(e){}
  }
}
function toggleSection(sec){setSection(sec,sec.classList.contains('collapsed'))}
/* Revise mode: the reading switch on the notes. It is one class on <body>, so every
   rule that answers to it lives in foundation.css with the rest of the content
   styling and a re-render does not have to re-decide anything. It hides the
   explanatory paragraphs of each section and keeps the revise blocks, lists, tables,
   callouts and figures - the same notes, with the reading cut out of them. */
function reviseOn(){return document.body.classList.contains('revise-mode')}
function reviseMode(on){
  const want=on===undefined?!reviseOn():!!on;
  document.body.classList.toggle('revise-mode',want);
  // Turning it on is a request to see the answers, and an answer inside a folded
  // section is just hidden text - so the sections open. Without the toast: this
  // is not a command the reader issued to the fold control.
  if(want)expandSilently();
  try{localStorage.setItem(NS+'-revise',want?'1':'0')}catch(e){}
  const b=document.getElementById('reviseSwitch');
  if(b)b.setAttribute('aria-pressed',String(want));
  return want;
}
function expandSilently(){
  document.querySelectorAll('#panel-learn section.learn-sec').forEach(s=>setSection(s,true,false));
}
function reviseRestore(){
  let on=false;
  try{on=localStorage.getItem(NS+'-revise')==='1'}catch(e){on=false}
  if(on)reviseMode(true);
}
function setAllSections(open){
  document.querySelectorAll('#panel-learn section.learn-sec').forEach(s=>setSection(s,open,false));
  try{localStorage.setItem(NS+'-collapsed-'+cur,JSON.stringify(open?[]:[...document.querySelectorAll('#panel-learn section.learn-sec')].map((s,i)=>i)))}catch(e){}
  toast(open?'All sections expanded':'All sections collapsed');
}
/* Tab badges: what is behind each tab, and whether it is finished. The quiz
   badge turns green and shows the stored score once the chapter quiz is done. */
function updateTabBadges(){
  const progress=Progress.state();
  const c=CH[cur]||{},done=!!progress.done[cur],score=(progress.chapterQuiz||{})[cur];
  const set=(sel,text,cls,show)=>{
    const el=document.querySelector(sel);
    if(!el)return;
    el.textContent=text;
    el.className='tab-badge'+(cls?' '+cls:'');
    el.hidden=!show;
  };
  set('[data-badge="learn"]',done?'✓':'','done',done);
  set('[data-badge="quiz"]',score?score.pct+'%':String((c.quiz||[]).length||''),score?'done':'accent',(c.quiz||[]).length>0);
  set('[data-badge="past"]',String((c.past||[]).length||''),'accent',(c.past||[]).length>0);
  // How much there is to read on the Revise tab, in words: the tab's whole offer
  // is a size, so the size belongs on the strip.
  const revWords=Revise?Revise.words(cur):0;
  set('[data-badge="revise"]',revWords?revWords+' w':'','accent',revWords>0);
  // The Learn Effectively tab is a reading job too, and a bigger one, so it is
  // measured the same way - and in thousands once it passes a thousand, because
  // "4.9k w" is a decision and "4,912 w" is a number.
  const teachWords=Teach?Teach.words(cur):0;
  set('[data-badge="teach"]',teachWords?(teachWords>=1000?(teachWords/1000).toFixed(1).replace(/\.0$/,'')+'k w':teachWords+' w'):'',
    'accent',teachWords>0);
}

/* ---------------- Analysis tab ---------------- */
function bankCounts(){
  let answered=0,pending=0,total=0,repeated=0;
  for(let n=1;n<=N;n++){const c=CH[n];if(!c)continue;(c.past||[]).forEach(q=>{total++;q.answer?answered++:pending++;if((q.repeats||1)>=2)repeated++})}
  return{answered,pending,total,repeated}
}
function renderAnalysis(){
  const A=window.ANALYSIS||{};const el=document.getElementById('panel-analysis');
  const progress=Progress.state();
  const b=bankCounts();
  const doneCount=Object.keys(progress.done||{}).length;
  const acc=progress.totalQ>0?Math.round(progress.correctQ/progress.totalQ*100):0;
  let masterySum=0,masteryN=0;
  for(let n=1;n<=N;n++){const cq=(progress.chapterQuiz||{})[n];if(cq){masterySum+=(cq.pct||0);masteryN++}}
  const mastery=masteryN?Math.round(masterySum/N):0;
  let h='';
  h+='<div class="an-grid">'+
    card('Chapters read',doneCount+'/'+N,'marked complete')+
    card('Quiz accuracy',acc+'%',progress.correctQ+' of '+progress.totalQ+' answered correctly')+
    card('Question bank',b.answered+'/'+b.total,'past questions with a model answer'+(b.pending?' · '+b.pending+' practice-only':''))+
    card('Repeated questions',b.repeated,'asked in 2 or more papers')+
  '</div>';
  h+='<div class="an-sec"><h3>'+icon('target')+' Chapter mastery</h3>';
  for(let n=1;n<=N;n++){
    const m=meta[n-1],cq=(progress.chapterQuiz||{})[n],done=progress.done[n];
    let pct=cq?(cq.pct||0):0;
    if(done)pct=Math.round((pct+100)/2);
    h+=bar('Ch '+n+' · '+m.t.slice(0,18)+(done?' ✓':''),pct,cq?(cq.correct+'/'+cq.total+' quiz'):'not attempted');
  }
  h+='<div class="an-btns"><button class="an-btn" onclick="APP.exportProgress()">'+icon('download')+' Export progress</button>'+
     '<button class="an-btn" onclick="APP.importProgress(\'merge\')">'+icon('upload')+' Import (merge)</button>'+
     '<button class="an-btn" onclick="APP.importProgress(\'replace\')">'+icon('upload')+' Import (replace)</button>'+
     '<button class="an-btn danger" onclick="APP.resetProgress()">'+icon('trash')+' Reset</button></div></div>';
  if(A.topics&&A.topics.length){
    h+='<div class="an-sec"><h3>'+icon('repeat')+' Most repeated topics <span class="pq-count">the top '+A.topics.length+' of '+A.total_questions+' past questions, across '+A.papers.length+' papers</span></h3>';
    A.topics.forEach(t=>{h+=topicRow(t)});
    h+='</div>';
  }
  if(A.year_distribution){
    const yrs=Object.keys(A.year_distribution),max=Math.max(...Object.values(A.year_distribution));
    h+='<div class="an-sec"><h3>'+icon('calendar')+' Year-wise distribution</h3>';
    yrs.forEach(y=>{h+=bar(y,Math.round(A.year_distribution[y]/max*100),A.year_distribution[y]+' questions')});
    h+='<p style="font-size:11.5px;color:var(--t3);margin-top:10px">Papers analysed: '+esc(A.papers.join(', '))+'. A question listed in two papers is counted in both.</p></div>';
  }
  if(A.chapters){
    h+='<div class="an-sec"><h3>'+icon('layers')+' Bank coverage per chapter</h3><div class="table-scroll"><table><thead><tr><th>Chapter</th><th class="num">Weight</th><th class="num">Bank questions</th><th class="num">On the site</th><th class="num">Answered</th></tr></thead><tbody>';
    Object.keys(A.chapters).sort((a,b2)=>a-b2).forEach(k=>{
      const c=A.chapters[k],site=CH[k]?(CH[k].past||[]).filter(q=>q.answer).length:0;
      h+='<tr><td>Ch '+k+' — '+esc(c.title)+'</td><td class="num">'+c.weight+'</td><td class="num">'+c.questions+'</td><td class="num">'+((CH[k]&&CH[k].past||[]).length)+'</td><td class="num">'+site+'</td></tr>';
    });
    h+='</tbody></table></div></div>';
  }
  if(A.strategy&&A.strategy.length){
    h+='<div class="strategy-box"><h3>'+icon('alert')+' Exam strategy notes</h3>';
    A.strategy.forEach(s=>{h+='<h4>'+esc(s.heading)+'</h4><ul>'+s.items.map(i=>'<li>'+esc(i)+'</li>').join('')+'</ul>'});
    h+='</div>';
  }
  el.innerHTML=h;
}
function card(k,v,s){return '<div class="an-card"><div class="k">'+k+'</div><div class="v">'+v+'</div><div class="s">'+esc(s)+'</div></div>'}
function bar(lbl,pct,val){pct=Math.max(0,Math.min(100,pct||0));return '<div class="bar-row"><span class="lbl" title="'+esc(lbl)+'">'+esc(lbl)+'</span><span class="bar-track"><span class="bar-fill" style="width:'+pct+'%"></span></span><span class="val" title="'+esc(val)+'">'+esc(val)+'</span></div>'}
function topicsPct(t){const m=String(t).match(/\d+/g);if(!m)return 20;const v=+m[0];return Math.round(v/12*100)}
function topicRow(t){
  const ch=String(t.chapter).replace(/\D/g,'');
  return '<div class="topic-row"><span class="t-lbl"><strong>#'+t.rank+'</strong> <span class="t-ch">Ch '+ch+'</span> '+esc(t.topic)+'</span>'+
    '<span class="bar-track"><span class="bar-fill" style="width:'+topicsPct(t.times)+'%"></span></span>'+
    '<span class="t-val">'+esc(t.times)+' times</span></div>';
}

/* ---------------- Nav ---------------- */
function buildNav(){
  const progress=Progress.state();
  document.getElementById('chNav').innerHTML=meta.map(c=>{
    const done=progress.done[c.n];
    const seen=!!(progress.seen||{})[c.n];
    const state=done?' done':(seen?' progress':'');
    const score=(progress.chapterQuiz||{})[c.n];
    const stateWord=done?', completed':(seen?', in progress':'');
    // A real link, not a div with a click handler: the URL changes, Back works,
    // and middle-click / "copy link address" mean the chapter list behaves the
    // way a list of chapters should. aria-current is set only on the one you are
    // in, so a screen reader says "current page" instead of "1 of 8 buttons".
    return `<a class="nav-item${state}" data-ch="${c.n}" href="#/ch/${c.n}"${c.n===cur?' aria-current="page"':''} aria-label="Chapter ${c.n}: ${c.t}, ${c.m} marks${stateWord}"><span class="nav-num" aria-hidden="true">${done?'✓':c.n}</span><span class="nav-label">${c.t}</span><div class="nav-meta"><span class="nav-marks">${c.m}m</span>${score?`<span class="nav-quiz">${score.pct}%</span>`:''}</div></a>`;
  }).join('');
}
function load(n,opts){
  opts=opts||{};
  const progress=Progress.state();
  cur=n;const ch=CH[n],m=meta[n-1];
  if(!progress.seen)progress.seen={};
  if(!progress.seen[n]){progress.seen[n]=true;buildNav();Progress.save()}
  document.querySelectorAll('.nav-item').forEach(el=>{
    const on=+el.dataset.ch===n;
    el.classList.toggle('active',on);
    // aria-current is "the page I am on", so it is present or absent - never "false".
    if(on)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
  });
  document.getElementById('chNo').textContent='Ch '+n;
  document.getElementById('chTi').textContent=m.t;
  document.getElementById('chBd').textContent=m.m+' marks · '+m.h+' hrs';
  switchTab(opts.tab||'learn',{silent:true});
  if(!ch){document.getElementById('panel-learn').innerHTML='<p style="color:var(--t3)">Loading…</p>';return;}
  const done=!!progress.done[n];
  const doneHtml=`<div class="ch-complete-bar"><div class="label">${done?icon('check')+' <em>Chapter completed.</em>':'Finished reading this chapter?'}</div><button class="mark-done-btn ${done?'completed':'todo'}" onclick="APP.markDone(${n})">${done?icon('check')+' Completed':'Mark as complete <span style="opacity:.7">+10 XP</span>'}</button></div>`;
  /* What comes next. A reader who has just finished 8 500 words should not have to
     open the chapter menu to find out what unit follows, and the floating arrow is
     a one-way trip to the *next* unit only - so the end of the notes names the unit
     that follows and how much it is worth, or says plainly that there is no next one.
     The Simulation course and this one disagree about the chapter count, so the
     boundary is N, never a literal. */
  const nxt=meta[n]||null;
  const contHtml=n<N&&nxt
    ? '<div class="ch-next"><span class="cn-lead">Next in the course</span>'+'<button class="cn-btn" onclick="APP.load('+(n+1)+')">Unit '+(n+1)+' — '+esc(nxt.t)+'<span class="cn-m">'+nxt.m+' marks · '+nxt.h+' hrs</span>'+icon('arrowRight')+'</button></div>'
    : '<div class="ch-next"><span class="cn-lead">Unit '+n+' is the last one</span><span class="cn-note">Revise from Past Questions, or open the Analysis tab to see which chapter is costing you the most marks.</span></div>';
  /* The Revise switch exists only where there are revise blocks to show, so it is
     never a control that does nothing. What it does is hide each section's
     explanatory paragraphs and leave the blocks, the lists, the tables and the
     callouts - the reading a student wants when the exam is closer than the
     understanding. Nothing is deleted: the prose comes straight back. */
  const hasRevise=!!(ch.revise&&Object.keys(ch.revise).length);
  const tools='<div class="learn-tools">'+
      '<button class="an-btn" onclick="APP.sections(true)">'+icon('chevron')+' Expand all</button>'+
      '<button class="an-btn" onclick="APP.sections(false)">'+icon('chevronUp')+' Collapse all</button>'+
      (hasRevise?('<button class="an-btn revise-switch" id="reviseSwitch" aria-pressed="'+reviseOn()+'" onclick="APP.reviseMode(!reviseOn())">'+icon('checklist')+' Revise mode</button>'+'<span class="revise-hint">Answers only &mdash; the explanations are one click away.</span>'):'')+
      // Topics first: it is the size of the reading job, and it is the number a
      // reader decides "can I finish this tonight?" with.
      '<span class="meta">'+((ch.learn||'').match(/<h3>/g)||[]).length+' topics · '+(ch.quiz||[]).length+' quiz questions · '+(ch.past||[]).length+' past questions · '+m.h+' hrs of lectures</span>'+
    '</div>';
  /* Both bars sit *after* .learn-content, not inside it. buildSections() wraps
     everything that follows an <h2> into that section, so a bar in the last section
     disappears the moment the reader collapses it - and "Mark as complete" is
     exactly the thing a reader looks for after folding the text away. */
  document.getElementById('panel-learn').innerHTML=tools+'<div class="learn-content">'+SM.injectRevise(ch.learn,ch.revise)+'</div>'+doneHtml+contHtml;
  buildSections();
  // Boot happens before the notes exist, so a stored Revise mode is re-applied to
  // the sections here - otherwise a reader who left it on lands on folded sections.
  if(reviseOn())expandSilently();
  Quiz.render(n,ch.quiz||[]);
  Past.render(ch.past||[],ch.pastSummary||'');
  // The notes go to the tab as well: its group headings are the note sections, and
  // it links each one back to the section it names (modules/reference.js).
  if(Reference)Reference.render(ch.reference||'',ch.slides||'',ch.learn||'',n);
  // The Revise tab: one fixed-size card per syllabus sub-topic, drawn from
  // data/rev.js (window.REV). Its own module owns the drawing; this shell only
  // tells it which chapter is on screen.
  if(Revise)Revise.render(n);
  /* The Learn Effectively tab: every sub-topic of this chapter taught end to end,
     drawn from data/teach.js (window.TEACH) by its own module. It is the longest
     panel on the page, which is why it states its own size before the first word
     and carries an index of its topics at the top. */
  if(Teach)Teach.render(n);
  /* The tab carries two things: the figures the teacher's decks mark with his
     circled i, and the slides the notes no longer paste in (the first chapter to
     have the second kind is Unit 2, and eight of the nine have it). A tab that
     opens on "this chapter has no reference-only slides" is one more thing to read
     for nothing, so it exists only where there is something behind it, and a
     chapter with none can be reached by a link to it without landing on an empty
     panel. */
  const refTab=document.getElementById('tab-reference');
  if(refTab){
    const hasRef=!!(String(ch.reference||'').trim()||String(ch.slides||'').trim());
    refTab.hidden=!hasRef;
    if(!hasRef&&activeTab()==='reference'){
      switchTab('learn',{silent:true});
      opts.tab='learn';
      // Replace, not push: the reference view was never addressable for this
      // chapter, so it should not become a Back step.
      writeRoute({tab:'learn',ch:n},true);
    }
  }
  /* The Revise tab exists only where a chapter has cards, by the same rule the
     Reference tab uses: a tab that opens on nothing is one more thing to read for
     nothing. Its badge carries the size of the revision job - the one number the
     tab exists to give - and it is set in updateTabBadges(). */
  const revTab=document.getElementById('tab-revise');
  if(revTab){
    const hasRev=!!(Revise&&Revise.words(n));
    revTab.hidden=!hasRev;
    if(!hasRev&&activeTab()==='revise'){
      switchTab('learn',{silent:true});
      opts.tab='learn';
      writeRoute({tab:'learn',ch:n},true);
    }
  }
  // The Learn Effectively tab exists only where a chapter has teaching written,
  // by the same rule the Reference and Revise tabs use.
  const teachTab=document.getElementById('tab-teach');
  if(teachTab){
    const hasTeach=!!(Teach&&Teach.words(n));
    teachTab.hidden=!hasTeach;
    if(!hasTeach&&activeTab()==='teach'){
      switchTab('learn',{silent:true});
      opts.tab='learn';
      writeRoute({tab:'learn',ch:n},true);
    }
  }
  enhanceContent(document.getElementById('panel-learn'));
  enhanceContent(document.getElementById('panel-past'));
  if(Reference)enhanceContent(document.getElementById('panel-reference'));
  measureTopics();
  syncReadProg();
  updateTabBadges();
  setDrawer(false);
  const area=document.getElementById('contentArea');
  /* Only the boot load resumes. Picking a unit out of the menu is a deliberate
     "start here", and landing halfway down it would look like the tap did nothing. */
  const saved=opts.resume?((progress.pos||{})[n]||null):null;
  if(saved)restorePos(saved);else area.scrollTop=0;
  syncFabWrap();
  // Navigating to another chapter is a page change: the person should land on
  // the new content, not stay stranded in the sidebar they clicked from.
  // Skipped on the boot load so the page does not grab focus by itself.
  if(ready&&opts.focus!==false)area.focus({preventScroll:true});
  // Loading a chapter is what addresses it, so the address bar always matches
  // what is on screen - even when the change came from a button, not a link.
  if(!opts.silent)writeRoute({tab:opts.tab||'learn',ch:n});
}
function markDone(n){
  const progress=Progress.state();
  if(progress.done[n])return;
  progress.done[n]=true;progress.xp+=10;Progress.save();Progress.updateStats();
  buildNav();load(n);toast(icon('check')+' Chapter '+n+' complete · +10 XP');
}
function switchTab(t,opts){
  document.querySelectorAll('.tab-btn').forEach(b=>{
    const on=b.dataset.tab===t;
    b.classList.toggle('active',on);
    b.setAttribute('aria-selected',on?'true':'false');
    // Roving tabindex: the five views are one stop in the tab order, and the
    // arrow keys walk along them (the ARIA tabs pattern).
    b.tabIndex=on?0:-1;
  });
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.id==='panel-'+t));
  document.getElementById('contentArea').scrollTop=0;
  /* On a narrow window the strip scrolls sideways, and its scrollbar is hidden
     (scrollbar-width:none) - so the tab you just picked can sit entirely
     off-screen with nothing to say the strip moved, and a deep link can open on
     a tab the reader never sees selected. Park the active tab in the middle.
     Measured with rects rather than offsetLeft: .tabs is not positioned, so
     offsetLeft would be relative to whichever ancestor happens to be. Inert at
     any width where the strip fits, which is every desktop window. */
  const tabBar=document.querySelector('.tabs'),tabOn=tabBar&&tabBar.querySelector('.tab-btn.active');
  if(tabBar&&tabOn&&tabBar.scrollWidth>tabBar.clientWidth){
    const b=tabBar.getBoundingClientRect(),a=tabOn.getBoundingClientRect();
    tabBar.scrollLeft+=(a.left-b.left)-(b.width-a.width)/2;
  }
  if(t==='analysis')renderAnalysis();
  if(t==='exam'&&Exam)Exam.render();
  /* Last, and after the tab's own renderer: a panel that is display:none
     measures 0 for both scrollWidth and clientWidth, so the exhibits in a panel
     are only measurable once it is the visible one - and the Analysis tables
     only exist after renderAnalysis() has drawn them. */
  syncScrollers(document.getElementById('panel-'+t));
  syncReadProg();
  if(!(opts&&opts.silent))writeRoute({tab:t,ch:cur});
}
function activeTab(){
  const b=document.querySelector('.tab-btn.active');
  return (b&&b.dataset.tab)||'learn';
}

/* ---------------- The URL is the location ---------------- */
/* Every view is addressable (SM.parseRoute / SM.formatRoute in engine.js), so
   "Ch 6, the question I keep getting wrong" is a link: bookmark it, send it to
   a classmate, open it on a phone and land on the same card. Without this a
   refresh dropped you back on chapter 1, tab Learn, which is the single most
   annoying thing a study site can do.

   A navigation the user made pushes a history entry (that is what Back is for);
   the first paint replaces instead, so Back leaves the site rather than
   bouncing through #/ch/1. */
function writeRoute(route,replace){
  const h=SM.formatRoute(route);
  if(location.hash===h)return;
  if(replace&&window.history&&history.replaceState)history.replaceState(null,'',h);
  else location.hash=h;
}
/* One entry point for "show me this view", whether that came from a link, a
   button, the browser's Back or a fresh load. `fromHash` marks the last case, so
   we never write the hash back at ourselves. */
function go(route,opts){
  const fromHash=!!(opts&&opts.fromHash);
  const r=route||{};
  const tab=r.tab||'learn';
  const ch=r.ch||cur;
  if(r.ch&&r.ch!==cur)load(ch,{tab,silent:true,fromHash});
  else switchTab(tab,{silent:true});
  if(r.q!=null)openPastQuestion(r.q);
  if(!fromHash)writeRoute({tab,ch,q:r.q==null?null:r.q});
}
/* A #/q/<ch>-<i> link lands on one past question, answer revealed and flashed. */
function openPastQuestion(i){
  if(!App.Past.openOne(i))return;
  const card=document.getElementById('pq-'+i);
  if(card&&card.scrollIntoView)card.scrollIntoView({block:'center'});
  card.classList.add('mark-flash');
  setTimeout(()=>card.classList.remove('mark-flash'),2600);
}
function onHash(){
  const r=SM.parseRoute(location.hash);
  if(!r){
    // A hand-mangled hash is not an error state: put the address bar back in step
    // with the view instead of leaving a dead link on screen.
    writeRoute({tab:activeTab(),ch:cur},true);
    return;
  }
  // Our own writes also fire hashchange. Skip the route we are already showing,
  // so a tab click does not re-render the exam paper a second time behind itself.
  if(activeTab()===r.tab&&(r.ch==null||r.ch===cur)&&r.q==null)return;
  go(r,{fromHash:true});
}

/* Events */
/* One button, two jobs: on a laptop it compresses the sidebar to a rail of
   chapter numbers (remembered between visits); under 1025 px the sidebar is a
   drawer and the same button opens it. */
const appEl=document.querySelector('.app'),sideEl=document.getElementById('sidebar'),menuEl=document.getElementById('menuBtn');
const isDrawer=()=>window.matchMedia('(max-width:1024px)').matches;
function syncMenuBtn(){
  const on=isDrawer()?sideEl.classList.contains('open'):!appEl.classList.contains('rail');
  menuEl.setAttribute('aria-expanded',on?'true':'false');
  // The same button is a paperclip in a rail and a cross on a drawer, so its
  // face changes with the layout - set as markup, not text, or the icon is
  // replaced by its own name.
  const openDrawer=isDrawer()&&sideEl.classList.contains('open');
  menuEl.innerHTML=openDrawer?icon('x'):icon('menu');
}
function setRail(on,remember){
  appEl.classList.toggle('rail',on);
  menuEl.setAttribute('aria-expanded',on?'false':'true');
  menuEl.title=on?'Show the full chapter list':'Compress the chapter list';
  if(remember!==false){try{localStorage.setItem(NS+'-rail',on?'1':'0')}catch(e){}}
  syncMenuBtn();
}
/* The mobile drawer. Opening it moves focus into it, Escape closes it and hands
   focus back to the button that opened it, and the content behind it goes
   `inert` so Tab cannot wander into a page hidden under the overlay. The topbar
   stays live: the ✕ and the search box are how you get out. */
function setDrawer(open){
  if(open&&!isDrawer())return;
  sideEl.classList.toggle('open',open);
  document.getElementById('overlay').classList.toggle('show',open);
  const behind=[document.getElementById('contentArea'),document.querySelector('.tabs')];
  behind.forEach(el=>{if(el)el.inert=open});
  syncMenuBtn();
  if(open){
    const first=sideEl.querySelector('.nav-item.active')||sideEl.querySelector('.nav-item');
    if(first)first.focus();
  }
}
function closeDrawer(){
  if(!sideEl.classList.contains('open'))return false;
  setDrawer(false);
  return true;
}
menuEl.onclick=()=>{
  if(isDrawer())setDrawer(!sideEl.classList.contains('open'));
  else setRail(!appEl.classList.contains('rail'));
  syncMenuBtn();
};
document.getElementById('overlay').onclick=()=>{if(closeDrawer())menuEl.focus()};
window.addEventListener('resize',()=>{
  if(!isDrawer())closeDrawer();
  syncMenuBtn();
  // The ResizeObserver watches every exhibit already, but a browser without one
  // still has to re-decide this when the window changes.
  if(!scrollerRO)queueScrollerSync();
});
document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'&&closeDrawer())menuEl.focus();
});
document.querySelectorAll('.tab-btn').forEach(b=>b.onclick=()=>go({tab:b.dataset.tab,ch:cur}));
/* Arrow keys move along the tab strip (automatic activation - every panel is
   cheap to draw), and Home/End jump to the ends like a listbox. */
document.querySelector('.tabs').addEventListener('keydown',ev=>{
  const btns=[...document.querySelectorAll('.tab-btn')];
  const i=btns.indexOf(document.activeElement);
  if(i<0)return;
  let j=null;
  if(ev.key==='ArrowRight')j=(i+1)%btns.length;
  else if(ev.key==='ArrowLeft')j=(i-1+btns.length)%btns.length;
  else if(ev.key==='Home')j=0;
  else if(ev.key==='End')j=btns.length-1;
  if(j===null)return;
  ev.preventDefault();
  btns[j].focus();
  btns[j].click();
});
/* Persistent jump-to-top / next-chapter affordance: navigation should not live
   only in the sidebar. */
document.getElementById('fabTop').onclick=()=>document.getElementById('contentArea').scrollTo({top:0,behavior:'smooth'});
document.getElementById('fabNext').onclick=()=>load(cur<N?cur+1:1);
/* The floating controls belong to a page you are already reading, so they
   appear once the reader has moved into the chapter and stay out of the way
   until then. At the top of a chapter they would be two circles covering the
   first paragraph to offer "go up" and "go down". */
const fabWrap=document.querySelector('.fab-wrap');
function syncFabWrap(){
  const on=document.getElementById('contentArea').scrollTop>220;
  fabWrap.classList.toggle('show',on);
}
/* Where you are in a chapter. A unit is 4 600-8 600 words and 10-25 topics, which
   at reading speed is 30-60 screens with nothing but a scrollbar to say how much
   is left of it - the answer to "how long is this?" should not be scrolling to the
   bottom to look.

   Two instruments, because they answer two questions: the line in the header says
   how far through the page you are, and the counter in the floating controls says
   which syllabus topic you are reading of how many. `h3` is the topic level - a
   heading like 3.4.2 - and `h2` is the unit's parts, which the section folding in
   buildSections() moves around, so counting them would drift when a reader folds
   one away. */
const readProg=document.getElementById('readProg');
const readFill=readProg&&readProg.firstElementChild;
const readCount=document.getElementById('readCount');
let readTopics=[];
function measureTopics(){
  const panel=document.getElementById('panel-learn');
  readTopics=panel?[...panel.querySelectorAll('.learn-content h3')]:[];
}
function syncReadProg(){
  const area=document.getElementById('contentArea');
  const max=area.scrollHeight-area.clientHeight;
  const pct=max>8?Math.min(100,Math.round(area.scrollTop/max*100)):0;
  if(readProg){
    if(readFill)readFill.style.width=pct+'%';
    const text=pct+'% through chapter '+cur;
    readProg.setAttribute('aria-valuenow',pct);
    readProg.setAttribute('aria-valuetext',text);
    readProg.title=text;
    readProg.classList.toggle('show',area.scrollTop>4);
  }
  if(readCount){
    const at=activeTab()==='learn'&&readTopics.length>1;
    readCount.hidden=!at;
    if(at){
      const top=area.getBoundingClientRect().top;
      let i=0;
      // The last topic whose heading has passed the top of the reading area is the
      // one being read. A topic's own h3 sits below its sub-headings, so this is
      // the deepest heading level a reader navigates by.
      readTopics.forEach((h,k)=>{
        if(h.offsetParent===null)return;      // folded away: it is not where you are
        if(h.getBoundingClientRect().top-top<=2)i=k;
      });
      readCount.textContent=(i+1)+'/'+readTopics.length;
      readCount.title='Topic '+(i+1)+' of '+readTopics.length+' in this unit';
    }
  }
}
/* Where you stopped, remembered per unit. A unit is 30-60 screens long, so
   reopening the site on a phone must not drop the reader back at the top of the
   last unit they read; `resume` on the boot load is what reads this.

   Throttled rather than per-frame: localStorage is synchronous, and a scroll fires
   tens of times a second. 900ms is well under the time it takes to lose a scroll
   position to a closed tab, and the forced call on leaving the page catches the
   exact resting place. */
/* Where you stopped, stored as an anchor - the topic heading you were under, plus
   how far past it you had read - rather than as a scroll offset.

   A pixel offset cannot survive this page: figures below it load lazily, so the
   same number means a different paragraph on the next visit, and in testing a
   restore of 1500 landed 700px further down and *saved* the drift, which grows on
   every reopen until it clamps at the end of the unit. The offset of a heading is
   recomputed from the heading itself, so the anchor cannot drift; and the heading
   is already measured here for the topic counter, so this costs no extra reading of
   the layout. `y` is kept only as a fallback for the tabs that have no topics. */
function posAnchor(){
  const area=document.getElementById('contentArea');
  const top=area.getBoundingClientRect().top;
  let i=0,off=Math.round(area.scrollTop);
  readTopics.forEach((h,k)=>{
    if(h.offsetParent===null)return;
    const d=h.getBoundingClientRect().top-top;
    if(d<=2){i=k+1;off=Math.round(d)}        // 1-based: 0 means "above the first topic"
  });
  return {i,off,y:Math.round(area.scrollTop)};
}
function anchorScrollTop(a){
  const area=document.getElementById('contentArea');
  if(a&&a.i&&readTopics[a.i-1]&&readTopics[a.i-1].offsetParent!==null){
    const h=readTopics[a.i-1];
    const d=h.getBoundingClientRect().top-area.getBoundingClientRect().top;
    /* `off` is the heading's distance above the view top, so the scroll that
       reproduces it is (where the heading is now) minus (where it should be).
       Added instead of subtracted this is a fixed point only when the heading
       sits *below* the top, which is where a restore of 9886 settled at 9806. */
    return Math.max(0,Math.round(area.scrollTop+d-(a.off||0)));
  }
  return Math.max(0,Math.round((a&&a.y)||0));
}
/* True only while a saved position is being put back. Saves are suppressed during
   that window, and that is not a nicety: the restore is clamped while the page is
   still shorter than the target, and the clamp fires a real scroll event - saving it
   is what turned a resume of 1500 into a stored 500. */
let restoring=false;
function restorePos(a){
  const area=document.getElementById('contentArea');
  const y=anchorScrollTop(a);
  if(!y)return;
  restoring=true;
  const until=Date.now()+1600;
  /* Re-applied while the layout settles, and abandoned the moment the reader takes
     over - a restore that fights a deliberate scroll is worse than one that gives up. */
  const stop=()=>{restoring=false};
  area.addEventListener('wheel',stop,{passive:true});
  area.addEventListener('touchstart',stop,{passive:true});
  const apply=()=>{
    const want=anchorScrollTop(a);          // re-derived: it corrects any drift
    if(Math.abs(area.scrollTop-want)>2)area.scrollTop=want;
    syncFabWrap();syncReadProg();
    const settled=Math.abs(area.scrollTop-want)<=2;
    if(!settled&&!restoring)return;
    if(!settled&&Date.now()<until){requestAnimationFrame(apply);return}
    restoring=false;
    // Only a restore that actually landed is written back: a position that never
    // became reachable is left as it was, not replaced by wherever it clamped.
    if(settled)savePos(true);
  };
  apply();
  setTimeout(()=>{restoring=false},1800);    // rAF is throttled in a hidden tab
}
let posSavedAt=0;
function savePos(force){
  if(restoring&&!force)return;
  const now=Date.now();
  if(!force&&now-posSavedAt<900)return;
  posSavedAt=now;
  const progress=Progress.state();
  if(!progress.pos)progress.pos={};
  progress.pos[cur]=posAnchor();
  progress.lastCh=cur;
  Progress.save();
}
document.getElementById('contentArea').addEventListener('scroll',()=>{syncFabWrap();syncReadProg();savePos(false)},{passive:true});
// A tab closed mid-unit keeps the position it was last throttled to; a tab
// hidden (phone switching apps, laptop lid) keeps the exact one.
document.addEventListener('visibilitychange',()=>{if(document.hidden)savePos(true)});
window.addEventListener('pagehide',()=>savePos(true));
/* Keyboard access: the past-question headers and the quiz options are divs with
   click handlers, so give them Enter/Space support to match the buttons. (The
   chapter list no longer needs this - it is made of real links.) */
function wireKeys(){
  document.getElementById('panel-past').addEventListener('keydown',ev=>{
    const el=ev.target.closest('.pq-question');
    if(!el||!(ev.key==='Enter'||ev.key===' '))return;
    ev.preventDefault();el.click();
  });
  document.getElementById('contentArea').addEventListener('keydown',ev=>{
    const el=ev.target.closest('.q-option');
    if(!el||!(ev.key==='Enter'||ev.key===' '))return;
    ev.preventDefault();el.click();
  });
}

/* Source pages. The pages of the class notes the site's numbers were read off
   are copied in web-sized (tools/build_note_pages.py) and every citation is a
   chip carrying data-page="n2p58". One capture-phase handler covers the notes'
   own chips and the ones the past-question cards render, so adding a citation
   is markup rather than code - and capture is what stops a chip inside a
   past-question header from also toggling the question open. */
const pageDlg=document.getElementById('pageViewer'),pageImg=document.getElementById('pvImg'),
      pageTitle=document.getElementById('pvTitle'),pageOpen=document.getElementById('pvOpen');
function openPage(id){
  const p=(window.NOTE_PAGES||{})[id];
  if(!p){toast('No page "'+id+'" in the notes index');return false}
  pageImg.src=p.f;
  pageImg.hidden=false;   // the alt text is only correct once p is known
  pageImg.alt='Class notes, '+p.p+' — '+p.t;
  pageTitle.textContent=p.p+' — '+p.t;
  pageOpen.href=p.f;
  if(typeof pageDlg.showModal==='function')pageDlg.showModal();
  else pageDlg.setAttribute('open','');   // engines without <dialog>: still shown
  return true;
}
document.getElementById('pvClose').onclick=()=>pageDlg.close();
// A click on the backdrop has the dialog itself as its target, so it dismisses.
pageDlg.addEventListener('click',ev=>{if(ev.target===pageDlg)pageDlg.close()});
document.addEventListener('click',ev=>{
  const chip=ev.target.closest('[data-page]');
  if(!chip)return;
  ev.preventDefault();ev.stopPropagation();
  if(!openPage(chip.dataset.page)&&!pageDlg.open)return;
},true);

/* ---------------- The API the feature modules call back into ---------------- */
App.Shell={meta,chapters:()=>CH,cur:()=>cur,esc,shuffle,enhanceContent,toast,icon,ICONS,
  updateTabBadges,buildNav,load,switchTab,go,activeTab,setSection,renderAnalysis,bar};
window.reviseOn=reviseOn;reviseRestore();

/* Boot: the hash decides where you land, so a bookmark or a refresh reopens the
   view you were reading rather than chapter 1. */
let ready=false;
buildNav();Progress.updateStats();Search.build();Search.wire();wireKeys();
const opening=SM.parseRoute(location.hash);
/* Reopening the site continues the unit you were reading, unless the address names
   a unit itself - a bookmark, a shared link or a question deep link is an instruction
   to be there, not a request to resume. */
const lastCh=Number(Progress.state().lastCh)||0;
const startCh=(opening&&opening.ch)||(lastCh&&lastCh<=N?lastCh:0)||1;
const startTab=(opening&&opening.tab)||'learn';
const deepLink=!!(opening&&(opening.ch||opening.q!=null));
load(startCh,{tab:startTab,silent:true,resume:startTab==='learn'&&(!deepLink||startCh===lastCh)});
if(opening&&opening.q!=null)openPastQuestion(opening.q);
// Replace, not push: the entry that was never addressable should not be a Back step.
// activeTab(), not the requested one: a chapter with no Reference tab redirects the
// request to the notes, and the address has to say where the reader actually is.
writeRoute({tab:activeTab(),ch:startCh,q:opening?opening.q:null},true);
window.addEventListener('hashchange',onHash);
setRail(localStorage.getItem(NS+'-rail')==='1',false);
ready=true;
window.APP={load,ans:Quiz.answer,tpq:Past.toggle,markDone,pastFilter:Past.setFilter,gotoResult:Search.gotoResult,page:openPage,reviseMode,
  exhibit:openExhibit,closeExhibit,
  exportProgress:Progress.exportProgress,importProgress:Progress.importProgress,resetProgress:Progress.resetProgress,
  startExam:Exam&&Exam.start,revealExam:Exam&&Exam.reveal,markExam:Exam&&Exam.mark,submitExam:Exam&&Exam.submit,clearExam:Exam&&Exam.clear,
  sections:setAllSections,pastAll:Past.all,pastAllVariants:Past.allVariants,tVariants:Past.toggleVariants,tVariantAnswer:Past.toggleVariantAnswer,setRail};
})();
