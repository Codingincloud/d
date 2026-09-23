/* Owns the Revise tab: the byte-size layer, one card per syllabus sub-topic.

   The cards are written by hand in data/dcc_rev.json and generated into
   dcc-site/data/rev.js (window.REV) by tools/rev_summaries.py, whose --check is a
   gate step - so by the time this module runs, every syllabus sub-topic has a
   card, every card is one lead paragraph plus four bullets inside a fixed word
   band, and every bolded term in it is a term the sections teaching that
   sub-topic already use. A card may compress the notes; it may not add to them.

   What this module adds is the room. The reader asked for it as its own section
   beside Learn ("make a new section like Learn, Quiz, Past Questions, Revise -
   not right there on click"), not as a switch inside the notes, and the reason is
   the whole point of the layer: the size of the revision job is stated before the
   reading starts - 4 cards, about 120 words each - rather than discovered halfway
   through a chapter. Learn stays where the depth lives; Revise is what is read
   when the exam is closer than the understanding.

   Each card's headline is a link back to the note topic it stands for, so a card
   that leaves a question open is one click from the answer.

   Registers `window.SMApp.Revise`. */
(function(){
'use strict';
const App=window.SMApp=window.SMApp||{};

function esc(s){
  return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* The raw chapter table. Kept in a function so a missing file is a missing tab
   rather than a crash: the module is loaded by the DCC page only, and a course
   without a Revise layer never asks for it. */
function data(ch){
  const rev=window.REV;
  if(!rev||!rev.chapters)return null;
  return rev.chapters[String(ch)]||null;
}

function render(ch){
  const panel=document.getElementById('panel-revise');
  if(!panel)return;
  const d=data(ch);
  if(!d||!d.cards||!d.cards.length){
    panel.dataset.ch=ch;
    panel.innerHTML='<p class="rev-empty">This chapter has no Revise cards yet.</p>';
    return;
  }
  panel.dataset.ch=ch;
  const n=d.cards.length;
  const head='<div class="rev-bar">'+
    '<span class="rev-size">'+esc(n)+' card'+(n===1?'':'s')+' &middot; about 120 words each &middot; '+
      esc(d.words)+' words to read</span>'+
    '<span class="rev-how">Tap a heading to open the topic in Learn</span>'+
    '</div>';
  panel.innerHTML=head+d.cards.map(card).join('');
  wire(panel);
}

function card(c){
  // The emoji rides on the headline (data/rev.js `e`) and one opens each bullet
  // (inside the card's own html), which is where the eye lands when the whole
  // unit is being skimmed in one sitting.
  const flag=c.prereq?'<span class="rev-chip" title="Ground this unit stands on, outside the syllabus numbering">start here</span>':'';
  return '<section class="rev-card" id="rev-'+esc(c.n)+'">'+
    '<h3 class="rev-head">'+
      '<a class="rev-jump" href="#/ch/'+esc(panelCh())+'/learn" data-sec="'+esc(c.n)+'">'+
        '<span class="rev-e" aria-hidden="true">'+esc(c.e)+'</span>'+
        '<span class="rev-n">'+esc(c.n)+'</span>'+
        '<span class="rev-t">'+esc(c.t)+'</span>'+
      '</a>'+flag+
      '<span class="rev-w">'+esc(c.w)+'w</span>'+
    '</h3>'+
    '<div class="rev-body">'+c.html+'</div>'+
  '</section>';
}

/* The chapter this panel was last drawn for. Read from the panel rather than
   from the shell's current chapter, so a card's own link cannot disagree with
   the data the card was built from. */
function panelCh(){
  const panel=document.getElementById('panel-revise');
  return (panel&&panel.dataset.ch)||1;
}

/* A card's headline opens the notes at the topic it is named after. The heading
   is found by its syllabus NUMBER, which is what the card, the syllabus and the
   note heading all carry - so the jump keeps working when a heading is reworded. */
function wire(panel){
  if(panel.dataset.jumpWired)return;
  panel.dataset.jumpWired='1';
  panel.addEventListener('click',ev=>{
    const a=ev.target.closest('a.rev-jump');
    if(!a)return;
    ev.preventDefault();
    const want=String(a.dataset.sec||'').trim();
    const go=App.Shell&&App.Shell.go;
    if(go)go({ch:Number(panel.dataset.ch||1),tab:'learn'});
    setTimeout(()=>{
      const learn=document.getElementById('panel-learn');
      if(!learn)return;
      const hit=[...learn.querySelectorAll('h2,h3')].find(el=>{
        const t=el.textContent.replace(/\s+/g,' ').trim();
        return t===want||t.indexOf(want+' ')===0;
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

/* What the tab badge reports: how much there is to read in this unit. Terse by
   design - the badge is the one number that answers "can I do this tonight?". */
function words(ch){
  const d=data(ch);
  return d&&d.words?d.words:0;
}

App.Revise={render,words};
})();
