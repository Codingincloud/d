/* The app's pure logic — how a paper is assembled, how it is marked, how a quiz
   is scored, which entries a search term matches.

   No DOM, no localStorage, no state of its own: every function takes the data it
   needs and returns a value. app.js renders; this file decides. That split is
   what lets tools/test_engine.js pin these contracts in node, which matters
   because the marking bug (the breakdown bars divided by the syllabus weight
   while the score divided by the paper's total) was invisible to every check the
   project had and only ever found by eye.

   Loaded as a plain script before app.js; exposes `window.SM`. */
(function(){
'use strict';

/* This file is the pure logic for whichever course is on screen. `window.COURSE`
   is declared by the entry page before this script runs: index.html leaves it
   undefined (Simulation, the defaults below), and dcc-site/index.html defines
   its own. Every number that is really a fact about the syllabus therefore
   comes from there rather than being written into the logic.

   The defaults are the Simulation syllabus, so a page that does not set
   `window.COURSE` behaves exactly as it always did. */
const COURSE=(typeof window!=='undefined'&&window.COURSE)||{};

/* The syllabus weights, and the paper total as their sum — never a separate
   literal, so the header, the score and the breakdown cannot drift apart. */
const EXAM_WEIGHTS=COURSE.examWeights||[8,6,6,6,6,12,6,10];
const EXAM_TOTAL=EXAM_WEIGHTS.reduce((a,b)=>a+b,0);
const SEARCH_LIMIT=14;
/* The chapters this course has. Nine units are nine units; nothing else in here
   should have to know the number. */
const CHAPTER_COUNT=COURSE.chapterCount||8;

/* "2+8" -> 10. A card with no parseable marks is worth 2, which is the smallest
   mark a past question has ever carried. */
function marksOf(s){
  const m=String(s||'').match(/\d+/g);
  if(!m)return 2;
  const v=m.reduce((a,b)=>a+ +b,0);
  return v>0?v:2;
}
function stripTags(s){
  return String(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
}
/* The index carries text, not markup: a heading written `3.4.4 Bully versus Ring
   &mdash; ...` is read off the page as text and a search hit is drawn as text, so
   the entity has to become the character it stands for. Without this the result
   list reads `&mdash;` and `&ndash;` - a typo the reader has to decode. The
   renderer escapes what it draws, so decoding `&lt;` here is safe; the map is a
   table rather than the DOM because this file also runs under node in
   tools/test_engine.js, where there is no document to ask. */
const ENTITIES={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',mdash:'\u2014',
  ndash:'\u2013',middot:'\u00b7',hellip:'\u2026',rarr:'\u2192',larr:'\u2190',
  minus:'\u2212',times:'\u00d7',prime:'\u2032',Prime:'\u2033',deg:'\u00b0',
  ldquo:'\u201c',rdquo:'\u201d',lsquo:'\u2018',rsquo:'\u2019',copy:'\u00a9',
  le:'\u2264',ge:'\u2265',ne:'\u2260',equiv:'\u2261',infin:'\u221e'};
function decodeEntities(s){
  return String(s||'').replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g,(m,name)=>{
    if(name[0]==='#'){
      const cp=name[1]==='x'||name[1]==='X'?parseInt(name.slice(2),16):parseInt(name.slice(1),10);
      return Number.isFinite(cp)&&cp>0?String.fromCodePoint(cp):m;
    }
    const v=ENTITIES[name];
    return v==null?m:v;
  });
}

/* Every subset of a chapter's answered questions that stays under cap, so the
   allocator can choose between several mark totals for each chapter. */
function chapterOptions(pool,cap){
  const dp=new Map();dp.set(0,[]);
  for(const it of pool){
    for(const [s,cb] of [...dp]){
      const ns=s+it.marks;
      if(ns<=cap&&!dp.has(ns))dp.set(ns,cb.concat([it]));
    }
  }
  return [...dp.entries()];
}

/* Assemble a paper that totals exactly `total` marks.

   Each chapter prefers its own syllabus weight, but a chapter whose pool cannot
   hit that weight exactly (Ch 2, 4, 5 and 7 have no combination adding to 6) may
   take a slightly larger or smaller set instead. A global dynamic program then
   picks one option per chapter so that the paper still comes to `total` with the
   smallest possible deviation from the published weights.

   `shuffle` is injected so the same paper can be rebuilt in a test. */
function buildPaper(chapters,opts){
  const o=opts||{},weights=o.weights||EXAM_WEIGHTS,total=o.total||EXAM_TOTAL;
  const mix=o.shuffle||(a=>a);
  const perCh={};
  for(let n=1;n<=weights.length;n++){
    const c=chapters[n];
    if(!c){perCh[n]=[[0,[]]];continue}
    const pool=mix((c.past||[]).filter(q=>q.answer)
      .map(q=>({ch:n,q,marks:marksOf(q.marks),repeats:q.repeats||1})));
    perCh[n]=chapterOptions(pool,weights[n-1]+5);
  }
  // State = total marks so far -> the lowest-deviation set of chapter picks
  // reaching that total. Comparing deviation (not just first-found) is what
  // lets the allocator keep every chapter close to its own weight.
  let states=new Map([[0,{dev:0,picks:[]}]]);
  for(let n=1;n<=weights.length;n++){
    const weight=weights[n-1],next=new Map();
    for(const [tot,st] of states){
      for(const [sum,combo] of perCh[n]){
        const nt=tot+sum;
        if(nt>total)continue;
        const dev=st.dev+Math.abs(sum-weight);
        const cur=next.get(nt);
        if(!cur||dev<cur.dev)next.set(nt,{dev,picks:st.picks.concat([{ch:n,sum,combo}])});
      }
    }
    if(next.size)states=next;
  }
  let best=null,bestScore=Infinity;
  for(const [tot,st] of states){
    const score=Math.abs(total-tot)*10+st.dev;
    if(score<bestScore){bestScore=score;best=st.picks}
  }
  const items=[];
  (best||[]).forEach(p=>p.combo.forEach(x=>items.push(x)));
  return items;
}

/* Mark a paper. `marked` maps an item index to true/false.

   `byChapter` reports, per chapter, the marks this paper actually set — that is
   the denominator a bar must use. Dividing by the syllabus weight instead makes
   a perfectly answered chapter read "5/6 marks" and the bars stop summing to the
   total in the header. */
function paperScore(items,marked){
  const mk=marked||{};
  const byChapter=[],seen={};
  let score=0,markedCount=0,total=0;
  items.forEach((it,idx)=>{
    total+=it.marks;
    if(mk[idx]){score+=it.marks;markedCount++}
    seen[it.ch]=(seen[it.ch]||0)+it.marks;
  });
  Object.keys(seen).map(Number).sort((a,b)=>a-b).forEach(ch=>{
    byChapter.push({ch,avail:seen[ch],got:items.reduce(
      (a,i,idx)=>a+(i.ch===ch&&mk[idx]?i.marks:0),0)});
  });
  return {score,total,markedCount,byChapter};
}

/* Score a quiz. `answers` maps a question index to the chosen option; an absent
   or null entry is unanswered and counts against nothing but still sits in the
   denominator, which is how the chapter badge has always read. */
function quizScore(quiz,answers){
  const a=answers||{},list=quiz||[];
  let answered=0,correct=0;
  list.forEach((q,i)=>{
    if(a[i]==null)return;
    answered++;
    if(a[i]===q.answer)correct++;
  });
  const total=list.length;
  return {total,answered,wrong:answered-correct,correct,
          pct:total?Math.round(correct/total*100):0};
}

/* The searchable corpus: every note section, quiz question and past question.
   `titles` is the per-chapter title, indexed by chapter number - 1, and `rev` is
   the byte-size card table (data/rev.js) where a course ships one - passed in
   rather than read from the page, so this file stays the pure logic it is tested
   as, with no global to stub. */
function buildIndex(chapters,titles,rev,teach){
  const idx=[];
  for(let n=1;n<=CHAPTER_COUNT;n++){
    const c=chapters[n];if(!c)continue;
    const title=(titles&&titles[n-1])||('Chapter '+n);
    String(c.learn||'').split(/(?=<h[23]>)/).forEach(p=>{
      const h=p.match(/<h[23]>([^<]*)<\/h[23]>/);
      const body=stripTags(p);if(body.length<40)return;
      idx.push({ch:n,type:'note',title:h?h[1]:title,snip:body.slice(0,170),key:(h?h[1]:title)});
    });
    (c.quiz||[]).forEach(q=>idx.push({ch:n,type:'quiz',title:q.q,
      snip:stripTags(q.explanation).slice(0,150),key:q.q.slice(0,45)}));
    // The chapter's exam-facing summary lives in `pastSummary` (moved out of
    // Learn by tools/move_exam_summary.py). Indexed as a past entry, so a search
    // hit routes to the Past tab - the panel this text is actually rendered in.
    String(c.pastSummary||'').split(/(?=<h[234]>)/).forEach(p=>{
      const h=p.match(/<h[234]>([^<]*)<\/h[234]>/);
      const body=stripTags(p);if(body.length<40)return;
      idx.push({ch:n,type:'past',title:h?h[1]:title,snip:body.slice(0,170),key:(h?h[1]:'Exam-facing summary')});
    });
    // The reference-only slides (the teacher's circled i) have their own tab, and
    // a hit has to land on the panel the text is actually drawn in - which is why
    // the entry carries its own type rather than being folded into one of these.
    String(c.reference||'').split(/(?=<h[23]>)/).forEach(p=>{
      const h=p.match(/<h[23]>([^<]*)<\/h[23]>/);
      const body=stripTags(p);if(body.length<40)return;
      idx.push({ch:n,type:'reference',title:h?h[1]:title,snip:body.slice(0,170),key:(h?h[1]:'Reference material')});
    });
    // The teacher's other slides - every picture the notes no longer paste in
    // (tools/slim_dcc_figures.py). They are drawn on the Reference tab too, so a
    // hit routes there; the heading a search reports is the note section the
    // picture belongs to, which is the thing a reader is looking for.
    String(c.slides||'').split(/(?=<h[23]>)/).forEach(p=>{
      const h=p.match(/<h[23]>([^<]*)<\/h[23]>/);
      const body=stripTags(p);if(body.length<40)return;
      idx.push({ch:n,type:'reference',title:h?h[1]:title,snip:body.slice(0,170),key:(h?h[1]:'The teacher\u2019s slides')});
    });
    /* The Revise cards: the same sub-topics at a fixed size, drawn on their own
       tab, so a hit routes there - `revise` is the panel it is read in, exactly
       as `reference` is for the slides. The key is the card's syllabus number,
       which is what its heading on that panel carries. */
    const cards=(rev&&rev.chapters&&rev.chapters[n]&&rev.chapters[n].cards)||[];
    cards.forEach(k=>idx.push({ch:n,type:'revise',title:k.n+' \u00b7 '+k.t,
      snip:stripTags(k.html).slice(0,150),key:k.n}));
    /* The Learn Effectively topics: the same sub-topics again, taught end to end on
       their own tab. A hit routes to that tab (`teach` is the panel the text is
       drawn in) and the key is the topic's syllabus number, which its heading there
       carries. The snippet is the top of the card - the first line of the teaching,
       which is where a searcher's eye needs to land. */
    const taught=(teach&&teach.chapters&&teach.chapters[n]&&teach.chapters[n].topics)||[];
    taught.forEach(k=>idx.push({ch:n,type:'teach',title:k.n+' \u00b7 '+k.t,
      snip:(k.snip||stripTags(k.html)).slice(0,170),key:k.n,
      // What the searcher typed is matched against the whole topic - the written
      // teaching and the summary card's points - while the result shows the
      // definition. A term that appears only in a key point is still findable.
      hay:stripTags(k.html)+' '+(k.points||[]).map(pa=>pa.join(' ')).join(' ')}));
    (c.past||[]).forEach(q=>idx.push({ch:n,type:'past',title:q.q,
      snip:(q.year||'')+' · '+(q.marks||'')+' marks'+(q.answer?' · model answer':' · practice question')
        +((q.occ||[]).length>1?' · also asked in '+(q.occ||[]).map(o=>o.year).join(', '):''),
      key:q.q.slice(0,45)}));
  }
  /* One pass at the end, so every entry is covered whichever field it came from.
     `key` is left alone: it is compared against the heading text in the page, so
     it has to stay exactly what the markup says. */
  return idx.map(e=>({...e,title:decodeEntities(e.title),snip:decodeEntities(e.snip)}));
}

/* Rank the index against a term. A hit in the title outranks a hit in the
   snippet; terms shorter than two characters match nothing, so a keystroke
   cannot open the panel with half the site in it. */
function search(index,term){
  const t=String(term||'').trim().toLowerCase();
  if(t.length<2)return[];
  const words=t.split(/\s+/),scored=[];
  (index||[]).forEach(e=>{
    const title=String(e.title||'').toLowerCase();
    const hay=title+' '+String(e.hay||e.snip||'').toLowerCase();
    let s=0;
    words.forEach(w=>{if(hay.includes(w))s+=title.includes(w)?3:1});
    if(s>0)scored.push([s,e]);
  });
  scored.sort((a,b)=>b[0]-a[0]);
  return scored.slice(0,SEARCH_LIMIT).map(x=>x[1]);
}

/* The location, small enough to live in the URL hash. A view has to be
   addressable for the study flow to work: bookmark the question you keep
   getting wrong, send a friend the chapter you are both revising, come back on
   a phone and land on the same box you left.

     #/ch/4          chapter 4, Learn
     #/ch/4/quiz     chapter 4, Quiz
     #/analysis      the Analysis tab
     #/exam          the mock exam
     #/q/6-2         chapter 6, Past Questions, question #2 open

   parseRoute returns null for anything it does not recognise, so a mangled or
   hand-edited link falls back to the default view instead of throwing. The
   interesting decision is that an unknown tab is calmly treated as Learn while
   an unknown chapter is refused - a wrong tab still shows you a real page, a
   wrong chapter would show you nothing. */
const TABS=COURSE.tabs||['learn','quiz','past','analysis','exam'];
const CHAPTERS=CHAPTER_COUNT;
function parseRoute(hash){
  const raw=String(hash==null?'':hash).replace(/^#\/?/,'').trim();
  if(!raw)return null;
  let parts;
  try{parts=raw.split('/').filter(Boolean).map(decodeURIComponent)}
  catch(e){return null}
  const [head,arg,sub]=parts;
  if(head==='analysis')return {tab:'analysis',ch:null,q:null};
  /* A course without a mock exam (DCC has none yet) must not answer to
     `#/exam`; falling through to the default view is better than routing to a
     panel that does not exist. */
  if(head==='exam'&&TABS.indexOf('exam')>=0)return {tab:'exam',ch:null,q:null};
  if(head==='q'&&arg){
    const m=/^(\d+)-(\d+)$/.exec(arg);
    if(!m)return null;
    const ch=+m[1],q=+m[2];
    if(!(ch>=1&&ch<=CHAPTERS)||q<0)return null;
    return {tab:'past',ch,q};
  }
  if(head==='ch'&&arg){
    const ch=+arg;
    if(!(ch>=1&&ch<=CHAPTERS))return null;
    const tab=TABS.indexOf(sub)>=0?sub:'learn';
    return {tab,ch,q:null};
  }
  return null;
}
/* formatRoute is the inverse, so a route survives a round trip through the
   address bar - the property the contract test pins down. */
function formatRoute(route){
  const r=route||{};
  if(r.ch!=null&&r.q!=null&&r.q>=0)return '#/q/'+r.ch+'-'+r.q;
  if(r.tab==='analysis')return '#/analysis';
  if(r.tab==='exam'&&TABS.indexOf('exam')>=0)return '#/exam';
  const ch=r.ch||1;
  const tab=TABS.indexOf(r.tab)>=0?r.tab:'learn';
  return tab==='learn'?'#/ch/'+ch:'#/ch/'+ch+'/'+tab;
}

/* The revise layer: one short answer block above each note section, so a section
   can be read at the top instead of hunted through (tools/revise_blocks.py, whose
   guard writes these blocks against the section they sit in).

   The key a block is filed under is the heading's own number, or, where the
   heading carries none, its text as a slug - the same rule tools/revise_blocks.py
   writes the file by, which is why the rule is here and pinned by the contract
   test rather than written out in two languages.

   The prose is not touched: the block is inserted after the heading and in front
   of everything the section already said. */
function reviseKey(headingHtml){
  const text=decodeEntities(stripTags(headingHtml||'')).replace(/[\u2018\u2019]/g,"'");
  // A unit's first heading is its title, not a section, so it can never hold a
  // block - the empty key matches nothing, which is what tools/revise_blocks.py
  // assumes when it refuses to require one there.
  if(/^unit\s+\d+\b/i.test(text))return '';
  const m=/^(\d+(?:\.\d+)*)\b/.exec(text);
  if(m)return m[1];
  return text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
function injectRevise(learn,revise){
  const html=String(learn||'');
  if(!revise||typeof revise!=='object')return html;
  let placed=0;
  const out=html.split(/(?=<h[23]>)/).map(part=>{
    const m=/^<h[23]>([\s\S]*?)<\/h[23]>/.exec(part);
    if(!m)return part;
    const block=revise[reviseKey(m[1])];
    if(!block)return part;
    placed++;
    // `revise-lead`, not a callout: the block is the section's own teaching - the
    // answer first, then the reasoning in the prose under it - so it carries no
    // label and no card. It stays a <div> rather than loose paragraphs because
    // revise mode hides `.learn-sec > p`, and a lead that vanished in the mode
    // built for reading leads would leave an empty section.
    return part.slice(0,m[0].length)+
      '<div class="revise-lead">'+block+'</div>'+
      part.slice(m[0].length);
  }).join('');
  return placed?out:html;
}

/* Exported: the constants the UI prints, and the behaviours the contract test
   and app.js actually call. stripTags and chapterOptions stay private - nothing
   outside this file reads them. */
window.SM={EXAM_WEIGHTS,EXAM_TOTAL,SEARCH_LIMIT,marksOf,TABS,
           buildPaper,paperScore,quizScore,buildIndex,search,
           reviseKey,injectRevise,
           parseRoute,formatRoute};
})();
