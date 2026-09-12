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

/* The syllabus weights, and the paper total as their sum — never a separate
   literal, so the header, the score and the breakdown cannot drift apart. */
const EXAM_WEIGHTS=[8,6,6,6,6,12,6,10];
const EXAM_TOTAL=EXAM_WEIGHTS.reduce((a,b)=>a+b,0);
const SEARCH_LIMIT=14;

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
   `titles` is the per-chapter title, indexed by chapter number - 1. */
function buildIndex(chapters,titles){
  const idx=[];
  for(let n=1;n<=8;n++){
    const c=chapters[n];if(!c)continue;
    const title=(titles&&titles[n-1])||('Chapter '+n);
    String(c.learn||'').split(/(?=<h[23]>)/).forEach(p=>{
      const h=p.match(/<h[23]>([^<]*)<\/h[23]>/);
      const body=stripTags(p);if(body.length<40)return;
      idx.push({ch:n,type:'note',title:h?h[1]:title,snip:body.slice(0,170),key:(h?h[1]:title)});
    });
    (c.quiz||[]).forEach(q=>idx.push({ch:n,type:'quiz',title:q.q,
      snip:stripTags(q.explanation).slice(0,150),key:q.q.slice(0,45)}));
    (c.past||[]).forEach(q=>idx.push({ch:n,type:'past',title:q.q,
      snip:(q.year||'')+' · '+(q.marks||'')+' marks'+(q.answer?' · model answer':' · practice question')
        +((q.occ||[]).length>1?' · also asked in '+(q.occ||[]).map(o=>o.year).join(', '):''),
      key:q.q.slice(0,45)}));
  }
  return idx;
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
    const hay=title+' '+String(e.snip||'').toLowerCase();
    let s=0;
    words.forEach(w=>{if(hay.includes(w))s+=title.includes(w)?3:1});
    if(s>0)scored.push([s,e]);
  });
  scored.sort((a,b)=>b[0]-a[0]);
  return scored.slice(0,SEARCH_LIMIT).map(x=>x[1]);
}

/* Exported: the constants the UI prints, and the behaviours the contract test
   and app.js actually call. stripTags and chapterOptions stay private - nothing
   outside this file reads them. */
window.SM={EXAM_WEIGHTS,EXAM_TOTAL,SEARCH_LIMIT,marksOf,
           buildPaper,paperScore,quizScore,buildIndex,search};
})();
