/* Owns global search: the built index, the current hit list, the input wiring
   and jumping to a result. The matching itself lives in engine.js (SM.search);
   this module owns the panel and its keyboard. Registers `window.SMApp.Search`. */
(function(){
'use strict';
const App=window.SMApp=window.SMApp||{},SM=window.SM;
let IDX=[],SEARCH_HITS=[];
function build(){
  // window.REV and window.TEACH are the Revise card table and the Learn
  // Effectively topic table where the course ships them; the indexer takes both as
  // arguments so engine.js needs no global of its own.
  IDX=SM.buildIndex(App.Shell.chapters(),App.Shell.meta.map(m=>m.t),window.REV,window.TEACH);
}
function run(term){return SM.search(IDX,term)}
/* The panel is a real listbox: every hit is a `role="option"` with an id, the
   input is the combobox that owns it, and `aria-activedescendant` points at the
   arrow-key selection so a screen reader reads the option you are on. The count
   goes to a polite live region - a list of results appearing silently is the
   usual failure mode of an autocomplete. */
function wire(){
  const inp=document.getElementById('searchIn'),res=document.getElementById('searchRes'),live=document.getElementById('searchLive');
  let sel=-1;
  const optId=i=>'sr-opt-'+i;
  const announce=msg=>{if(live)live.textContent=msg};
  const close=()=>{
    res.classList.remove('show');sel=-1;
    inp.setAttribute('aria-expanded','false');
    inp.removeAttribute('aria-activedescendant');
  };
  const syncActive=()=>{
    if(sel<0){inp.removeAttribute('aria-activedescendant');return}
    inp.setAttribute('aria-activedescendant',optId(sel));
    // Keep the highlighted hit on screen: an arrow-key selection below the fold
    // would otherwise be invisible.
    const el=document.getElementById(optId(sel));
    if(el&&el.scrollIntoView)el.scrollIntoView({block:'nearest'});
  };
  const draw=()=>{
    if(!SEARCH_HITS.length){
      res.innerHTML='<div class="sr-empty" role="option" aria-disabled="true">No matches. Try "chi-square", "GPSS", "Markov", "auto-correlation".</div>';
      res.classList.add('show');
      inp.setAttribute('aria-expanded','true');
      inp.removeAttribute('aria-activedescendant');
      announce('No results for '+inp.value.trim());
      return;
    }
    const tagName={note:'Notes',revise:'Revise',teach:'Teach',quiz:'Quiz',past:'Past Q',reference:'Reference'};
    res.innerHTML=SEARCH_HITS.map((e,i)=>'<div class="sr-item'+(i===sel?' sel':'')+'" id="'+optId(i)+'" role="option" aria-selected="'+(i===sel?'true':'false')+'" data-i="'+i+'"><span class="sr-tag">'+(tagName[e.type]||'Past Q')+'</span>'+App.Shell.esc(e.title)+'<div class="sr-meta">Ch '+e.ch+' · '+App.Shell.esc(e.snip)+'</div></div>').join('');
    res.classList.add('show');
    inp.setAttribute('aria-expanded','true');
    syncActive();
    announce(SEARCH_HITS.length+' result'+(SEARCH_HITS.length===1?'':'s')+' for '+inp.value.trim());
  };
  inp.addEventListener('input',()=>{SEARCH_HITS=run(inp.value);sel=-1;if(inp.value.trim().length<2){close();announce('');return}draw()});
  inp.addEventListener('keydown',ev=>{
    if(ev.key==='Escape'){close();inp.blur();return}
    if(ev.key==='ArrowDown'){ev.preventDefault();sel=Math.min(sel+1,SEARCH_HITS.length-1);draw();return}
    if(ev.key==='ArrowUp'){ev.preventDefault();sel=Math.max(sel-1,0);draw();return}
    if(ev.key==='Home'&&res.classList.contains('show')){ev.preventDefault();sel=0;draw();return}
    if(ev.key==='End'&&res.classList.contains('show')){ev.preventDefault();sel=SEARCH_HITS.length-1;draw();return}
    if(ev.key==='Enter'&&SEARCH_HITS.length){ev.preventDefault();gotoResult(sel<0?0:sel)}
  });
  res.addEventListener('click',ev=>{const it=ev.target.closest('.sr-item');if(it)gotoResult(+it.dataset.i)});
  document.addEventListener('click',ev=>{if(!ev.target.closest('.search-wrap'))close()});
  document.addEventListener('keydown',ev=>{
    // '/' is a plain shortcut: leave the browser's own chords (Cmd+/, Ctrl+/) alone.
    if(ev.key==='/'&&!ev.ctrlKey&&!ev.metaKey&&!ev.altKey&&document.activeElement!==inp&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)){ev.preventDefault();inp.focus();inp.select()}
  });
}
function gotoResult(i){
  const e=SEARCH_HITS[i];if(!e)return;
  // One navigation through the shell's router, so a jump from search also
  // updates the address bar (and Back returns to the chapter, not the letter you
  // typed) instead of pushing two history entries.
  App.Shell.go({ch:e.ch,tab:e.type==='note'?'learn':e.type});
  const res=document.getElementById('searchRes'),inp=document.getElementById('searchIn');
  res.classList.remove('show');
  if(inp){inp.setAttribute('aria-expanded','false');inp.removeAttribute('aria-activedescendant')}
  setTimeout(()=>{
    // Each hit is drawn in its own panel, so the jump has to look in that one. A
    // reference hit goes to the Reference tab, where its heading is an h2/h3 like
    // a note's - the selector follows the panel, not the text.
    const panels={note:'panel-learn',revise:'panel-revise',teach:'panel-teach',quiz:'panel-quiz',past:'panel-past',reference:'panel-reference'};
    const sels={note:'h2,h3',revise:'h3',teach:'.teach-head',quiz:'.quiz-card',past:'.pq-card',reference:'h2,h3'};
    const panel=document.getElementById(panels[e.type]||'panel-past');
    const sel=sels[e.type]||'.pq-card';
    const key=e.key.replace(/\s+/g,' ').trim().slice(0,40).toLowerCase();
    const nodes=[...panel.querySelectorAll(sel)];
    const hit=nodes.find(n=>n.textContent.replace(/\s+/g,' ').trim().toLowerCase().includes(key));
    if(!hit)return;
    if(e.type==='past'&&hit.classList.contains('pq-card'))hit.classList.add('open');
    // A hit inside a folded section must reveal the section, or the jump would
    // land on something the reader cannot see.
    const sec=hit.closest('section.learn-sec');
    if(sec&&sec.classList.contains('collapsed'))App.Shell.setSection(sec,true,false);
    hit.scrollIntoView({behavior:'smooth',block:'center'});
    hit.classList.add('mark-flash');setTimeout(()=>hit.classList.remove('mark-flash'),2600);
  },80);
}
App.Search={build,run,wire,gotoResult};
})();
