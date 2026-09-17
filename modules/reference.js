/* Owns the Reference tab. It draws two things, in this order:

   1. `reference` - the slides the teacher marks with his circled i, his sign for
      material that is for reference rather than for the paper. They used to sit
      inside the notes with a chip on each figure; the reader asked for them out of
      the teaching text and collected here instead. tools/make_reference.py moves
      them and `--check` keeps the notes and the marks data in step.

   2. `slides` - the teacher's other slides, which the notes used to paste in
      inline (201 of them, one per 250 words, most captioned with the section
      heading echoed back). tools/slim_dcc_figures.py moves every picture no
      sentence in the notes points at into this field, grouped under the heading of
      the note section it belongs to, so Learn reads as writing and the pictures are
      still here. Its `--check` fails if one comes back, and
      tools/ref_slide_notes.py writes the one-line note under each picture.

   Both fields are content, headings included. What is added here is the way back:
   every group heading is a link to the note section it is named after, so a reader
   who wants the explanation behind a picture is one click from it, and the tab is
   a way into the notes rather than a place to scroll.

   Registers `window.SMApp.Reference`. */
(function(){
'use strict';
const App=window.SMApp=window.SMApp||{};

/* The heading text, entity-decoded and space-normalised, so a tab heading and the
   note heading it copies match even though one is written `&mdash;` and the other
   may not be. Exported through SM.plainHeading so the contract test can hold it. */
function plainHeading(html){
  const d=document.createElement('div');
  d.innerHTML=String(html==null?'':html);
  return (d.textContent||'').replace(/\s+/g,' ').trim();
}

function noteHeadings(learn){
  const out=new Set();
  const re=/<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/g;
  let m;
  while((m=re.exec(String(learn||''))))out.add(plainHeading(m[2]));
  return out;
}

function attr(s){
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;')
                 .replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* Each group of pictures is headed by the note section they came out of. Where
   that section still exists in the notes, the heading becomes a link to it; where
   it does not (the two off-syllabus dumps, which no section owns), it stays text
   rather than becoming a link that goes nowhere. */
function linkGroups(html, learn, ch){
  const known=noteHeadings(learn);
  if(!known.size)return html;
  return html.replace(/<h3>([\s\S]*?)<\/h3>/g,(all,inner)=>{
    const text=plainHeading(inner);
    if(!known.has(text))return all;
    return '<h3><a class="ref-jump" data-sec="'+attr(text)+'" '
      +'href="#/ch/'+ch+'/learn">'+inner+'</a></h3>';
  });
}

function wireJump(panel){
  if(panel.dataset.jumpWired)return;
  panel.dataset.jumpWired='1';
  panel.addEventListener('click',ev=>{
    const a=ev.target.closest('a.ref-jump');
    if(!a)return;
    ev.preventDefault();
    const want=String(a.dataset.sec||'').replace(/\s+/g,' ').trim();
    const route=App.Shell&&App.Shell.go?App.Shell.go:null;
    // The chapter is the one this panel was drawn for, recorded at render time:
    // reading it back off the address bar would race the router.
    if(route)route({ch:Number(panel.dataset.ch||1),tab:'learn'});
    setTimeout(()=>{
      const learn=document.getElementById('panel-learn');
      if(!learn)return;
      const hit=[...learn.querySelectorAll('h2,h3')]
        .find(n=>plainHeading(n.innerHTML)===want);
      if(!hit)return;
      /* A hit inside a folded section must be revealed first, or the jump lands
         on something the reader cannot see - the same rule the search jump uses. */
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

function render(reference,slides,learn,ch){
  const panel=document.getElementById('panel-reference');
  if(!panel)return;
  const html=String(reference||'')+String(slides||'');
  panel.dataset.ch=ch||1;
  panel.innerHTML=html.trim()?linkGroups(html,learn,ch||1)
    :('<h2>Reference material</h2><p class="ref-intro">This chapter has no '
      +'reference-only slides: everything in its notes comes from a slide the teacher does not mark.</p>');
  wireJump(panel);
}
App.Reference={render,plainHeading};
})();
