/* Owns the Learn Effectively tab: every syllabus sub-topic of the chapter, taught
   end to end - but drawn as a summary card first.

   The text is written by hand in data/dcc_teach.json and generated into
   dcc-site/data/teach.js (window.TEACH) by tools/teach_notes.py, whose --check is
   a gate step. By the time this module runs, every syllabus sub-topic has a topic
   here, every topic carries a summary card - a definition, the points that have to
   be stated, the worked run-through, the traps and the answer skeleton - and behind
   it the same five parts as written teaching, and every term and number in both
   layers is one the unit's own notes already carry.

   Why the card is the shape it is. Read as five headed blocks of prose, a topic a
   thousand words long is a wall, and the reader who wanted the definition has to
   scroll through the mechanism to find it. The same content as blocks - a
   definition panel, a two-column table of the points, a numbered run-through, a
   traps panel and an answer panel - is skimmable in one screen, and the full
   teaching stays one click behind it rather than being replaced.

   Registers `window.SMApp.Teach`. */
(function(){
'use strict';
const App=window.SMApp=window.SMApp||{};

function esc(s){
  return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* The raw chapter table. Kept in a function so a missing file is a missing tab
   rather than a crash: the module is loaded by the DCC page only, and a course
   without a teaching layer never asks for it. */
function data(ch){
  const t=window.TEACH;
  if(!t||!t.chapters)return null;
  return t.chapters[String(ch)]||null;
}

/* Words with thousands separated: the size statement is there to be read at a
   glance, and "2,480" reads faster than "2480". */
function num(n){
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,',');
}

/* 200 words a minute is the slow end of adult silent reading, which is the right
   end to quote here: the estimate is there to be beaten, not missed. */
function minutes(w){
  return Math.max(1,Math.round(w/200));
}

/* The five parts of the written teaching, keyed by their heading. The guard holds
   the headings and their order, so this split is a read of a contract rather than
   a guess about the markup. */
function parts(html){
  const out={};
  const re=/<h4>(.*?)<\/h4>([\s\S]*?)(?=<h4>|$)/g;
  let m;
  while((m=re.exec(String(html||''))))out[m[1]]=m[2];
  return out;
}

/* A run-through is written as paragraphs in the plan and is read as steps here:
   each one is a stage of the same operation, and numbering says so. */
function steps(html){
  const ps=[...String(html||'').matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m=>m[1]);
  if(ps.length<2)return html;
  return '<ol class="teach-steps">'+ps.map(p=>'<li>'+p+'</li>').join('')+'</ol>';
}

function pointsTable(rows){
  if(!rows||!rows.length)return '';
  return '<table class="teach-points"><tbody>'+rows.map(r=>{
    const pair=Array.isArray(r)?r:['',''];
    return '<tr><th scope="row">'+esc(pair[0])+'</th><td>'+esc(pair[1])+'</td></tr>';
  }).join('')+'</tbody></table>';
}

/* The unit's own exam facts, from the two data files the page already loads: the
   syllabus table gives the marks and the hours (window.COURSE), and the model paper
   gives how many of its sixteen questions examined this unit (window.ANALYSIS, the
   file the Analysis tab draws). Nothing here is estimated. */
function unitFacts(ch){
  const c=window.COURSE||{},meta=(c.meta||[])[ch-1]||{};
  const an=(window.ANALYSIS&&window.ANALYSIS.chapters&&window.ANALYSIS.chapters[ch])||{};
  const chapter=((App.Shell&&App.Shell.chapters())||{})[ch]||{};
  const items=[];
  if(meta.m)items.push(['Syllabus weight',meta.m+' of '+total(c.meta,'m')+' marks']);
  if(meta.h)items.push(['Teaching hours',meta.h+' scheduled hours']);
  if(an.questions!==undefined)items.push(['Model paper',
    'examined by '+an.questions+' of '+(total(chaptersOf(window.ANALYSIS),'questions')||16)+' questions']);
  const past=(chapter.past||[]).length;
  if(past)items.push(['Past questions',past+' in the bank for this unit']);
  return items;
}
function chaptersOf(an){
  return an&&an.chapters?Object.keys(an.chapters).map(k=>an.chapters[k]):[];
}
function total(list,key){
  return (list||[]).reduce((s,x)=>s+(Number(x[key])||0),0);
}

function render(ch){
  const panel=document.getElementById('panel-teach');
  if(!panel)return;
  const d=data(ch);
  panel.dataset.ch=ch;
  if(!d||!d.topics||!d.topics.length){
    panel.innerHTML='<p class="teach-empty">This chapter has no teaching written yet.</p>';
    return;
  }
  const n=d.topics.length;
  const facts=unitFacts(ch);
  const head='<div class="teach-bar">'+
      '<div class="teach-bar-main">'+
        '<span class="teach-size">'+esc(n)+' topic'+(n===1?'':'s')+' &middot; '+
          esc(num(d.words))+' words &middot; about '+esc(minutes(d.words))+' minutes to read</span>'+
        '<span class="teach-how">Each topic opens with the definition, the points to state, '+
          'a worked run-through, the traps and the answer to write. The full teaching is one click below.</span>'+
      '</div>'+
      (facts.length?'<dl class="teach-facts">'+facts.map(f=>
        '<div><dt>'+esc(f[0])+'</dt><dd>'+esc(f[1])+'</dd></div>').join('')+'</dl>':'')+
    '</div>';
  /* The index is the tab's table of contents. Its links scroll inside the panel
     rather than writing to the address bar: the site's address space is the
     chapter and the tab, and a hash that changed on every jump would make Back
     walk through the page instead of leaving it. */
  const index='<nav class="teach-index" aria-label="Topics in this chapter">'+
    d.topics.map(t=>'<a class="teach-ix" href="#teach-'+esc(t.n)+'" data-go="teach-'+esc(t.n)+'">'+
      '<span class="ti-e" aria-hidden="true">'+esc(t.e)+'</span>'+
      '<span class="ti-n">'+esc(t.n)+'</span>'+
      '<span class="ti-t">'+esc(t.t)+'</span>'+
      '<span class="ti-w">'+esc(t.w)+'w</span></a>').join('')+'</nav>';
  panel.innerHTML=head+index+d.topics.map(card).join('');
  wire(panel);
}

function card(t){
  const p=parts(t.html);
  const title='teach-'+t.n;
  const blocks=[];
  if(p['In one line'])
    blocks.push('<div class="tbox tbox-def"><h5>&#128204; Definition</h5>'+p['In one line']+'</div>');
  if(t.points&&t.points.length)
    blocks.push('<div class="teach-block"><h5>&#128273; What you have to be able to state</h5>'+
      pointsTable(t.points)+'</div>');
  if(p['How it runs'])
    blocks.push('<div class="tbox tbox-run"><h5>&#9881;&#65039; How it runs</h5>'+steps(p['How it runs'])+'</div>');
  if(p['Exam traps'])
    blocks.push('<div class="tbox tbox-warn"><h5>&#9888;&#65039; Where marks are lost</h5>'+p['Exam traps']+'</div>');
  if(p['Full-marks answer'])
    blocks.push('<div class="tbox tbox-answer"><h5>&#9989; The answer to write</h5>'+p['Full-marks answer']+'</div>');
  return '<section class="teach-card" id="'+esc(title)+'" aria-labelledby="'+esc(title)+'-h">'+
    '<h3 class="teach-head" id="'+esc(title)+'-h">'+
      '<a class="teach-jump" href="#/ch/'+esc(panelCh())+'/learn" data-sec="'+esc(t.n)+'" '+
        'title="Open this topic in the notes">'+
        '<span class="teach-e" aria-hidden="true">'+esc(t.e)+'</span>'+
        '<span class="teach-n">'+esc(t.n)+'</span>'+
        '<span class="teach-t">'+esc(t.t)+'</span>'+
      '</a>'+
      (t.prereq?'<span class="teach-chip" title="Ground this unit stands on, outside the syllabus numbering">start here</span>':'')+
      '<span class="teach-w">'+esc(t.w)+'w</span>'+
    '</h3>'+
    blocks.join('')+
    /* The written teaching, unchanged and one click away. Closed by default for
       the same reason the card exists: the summary is what is read first, and the
       detail is what is read after it. */
    '<div class="teach-full" data-words="'+esc(num(t.w))+'" data-closed="Read the full teaching">'+
      '<button class="teach-more" type="button" aria-expanded="false">'+
        'Read the full teaching &middot; '+esc(num(t.w))+' words</button>'+
      '<div class="teach-full-body" hidden>'+t.html+'</div>'+
    '</div>'+
  '</section>';
}

/* The chapter this panel was last drawn for. Read from the panel rather than from
   the shell's current chapter, so a card's own link cannot disagree with the data
   the card was built from. */
function panelCh(){
  const panel=document.getElementById('panel-teach');
  return (panel&&panel.dataset.ch)||1;
}

function wire(panel){
  if(panel.dataset.wired)return;
  panel.dataset.wired='1';
  panel.addEventListener('click',ev=>{
    // The index scrolls within the panel.
    const ix=ev.target.closest('a.teach-ix');
    if(ix){
      ev.preventDefault();
      const to=document.getElementById(ix.dataset.go);
      if(!to)return;
      to.scrollIntoView({behavior:'smooth',block:'start'});
      to.classList.add('mark-flash');
      setTimeout(()=>to.classList.remove('mark-flash'),2600);
      return;
    }
    // The fold over the written teaching.
    const more=ev.target.closest('.teach-more');
    if(more){
      const box=more.closest('.teach-full');
      const body=box.querySelector('.teach-full-body');
      const open=box.classList.toggle('open');
      more.setAttribute('aria-expanded',open?'true':'false');
      body.hidden=!open;
      more.textContent=(open?'Close the full teaching':box.dataset.closed+" \u00b7 "+box.dataset.words+' words');
      return;
    }
    /* A card's heading opens the notes at the topic it is named after. The heading
       is found by its syllabus NUMBER, which is what the topic, the syllabus and
       the note heading all carry - so the jump keeps working when a heading is
       reworded. */
    const a=ev.target.closest('a.teach-jump');
    if(!a)return;
    ev.preventDefault();
    const want=String(a.dataset.sec||'').trim();
    const go=App.Shell&&App.Shell.go;
    if(go)go({ch:Number(panel.dataset.ch||1),tab:'learn'});
    setTimeout(()=>{
      const learn=document.getElementById('panel-learn');
      if(!learn)return;
      const hit=[...learn.querySelectorAll('h2,h3')].find(el=>{
        const s=el.textContent.replace(/\s+/g,' ').trim();
        return s===want||s.indexOf(want+' ')===0;
      });
      if(!hit)return;
      // A heading inside a folded section would scroll to something invisible.
      const sec=hit.closest('section.learn-sec');
      if(sec&&sec.classList.contains('collapsed')&&App.Shell.setSection){
        App.Shell.setSection(sec,true,false);
      }
      hit.scrollIntoView({behavior:'smooth',block:'center'});
      hit.classList.add('mark-flash');
      setTimeout(()=>hit.classList.remove('mark-flash'),2600);
    },90);
  });
}

/* What the tab badge reports: the size of the reading job in this unit, in words.
   It is the one number that answers "how much is this?" before the tab is opened,
   exactly as the Revise badge does for its cards. */
function words(ch){
  const d=data(ch);
  return d&&d.words?d.words:0;
}

App.Teach={render,words};
})();
