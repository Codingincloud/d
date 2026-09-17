/* Owns the past-question list: the active filter, the rendering of one card per
   question, and the one-click wordings/answer expanders. Registers
   `window.SMApp.Past`. */
(function(){
'use strict';
const App=window.SMApp=window.SMApp||{};
let pastFilter='all';
const normQ=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
/* Every wording this ONE question was asked with: the card's own text first,
   then each paper found by tools/extract_occurrences.py. Normalised text is the
   key, so a paper whose wording repeats the card's is not shown twice. */
function pastVariants(q){
  const out=[],seen=new Set();
  const add=(year,marks,text,primary,answer)=>{
    const k=normQ(text);
    if(!text||seen.has(k))return;
    seen.add(k);
    out.push({year:String(year||''),marks:String(marks==null?'':marks),text,primary:!!primary,answer:answer||null});
  };
  add(q.year,q.marks,q.q,true,q.answer);
  // variants first: a variant carries the model answer written for that paper,
  // an occurrence carries only the wording. Either way the wording is kept.
  (q.variants||[]).forEach(v=>add(v.year,v.marks,v.q,false,v.answer));
  (q.occ||[]).forEach(o=>add(o.year,o.marks,o.q,false,null));
  // Only offer "its own model answer" when it actually differs from the one on
  // the card - the same answer twice under two wordings reads like a bug.
  const flat=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
  const seenAnswers=new Set([flat(q.answer)]);
  out.forEach(v=>{
    if(v.primary||!v.answer){v.answer=null;return}
    const k=flat(v.answer);
    if(!k||seenAnswers.has(k)){v.answer=null;return}
    seenAnswers.add(k);
  });
  return out;
}
/* `summary` is the chapter's exam-facing block - the "if the question says X,
   give Y" table, or the run of model answers - which used to sit at the end of
   the Learn text. It is paper-facing material, so it belongs on this tab, and
   tools/move_exam_summary.py is what moved it there. It renders below the cards
   and is NOT filtered: the pills select questions, and this is not a question. */
function render(questions,summary){
  const panel=document.getElementById('panel-past');
  if(!questions.length){panel.innerHTML='<p style="color:var(--t3)">No past questions available.</p>';return;}
  const rows=questions.map((q,i)=>({q,i}));
  const answered=rows.filter(r=>r.q.answer).length;
  const repeated=rows.filter(r=>(r.q.repeats||1)>=2).length;
  let list=rows;
  if(pastFilter==='answered')list=rows.filter(r=>r.q.answer);
  else if(pastFilter==='practice')list=rows.filter(r=>!r.q.answer);
  else if(pastFilter==='repeat')list=rows.filter(r=>(r.q.repeats||1)>=2);
  const practice=rows.length-answered;
  // The Practice pill only exists while there is something to practise: every
  // current card carries a model answer, so showing "Practice 0" would offer a
  // filter that can only ever come back empty.
  const ic=App.Shell.icon;
  let h='<div class="pq-filter">'+
    pill('all','All '+rows.length)+pill('answered',ic('check')+' Model answers '+answered)+(practice?pill('practice','Practice '+practice):'')+pill('repeat',ic('repeat')+' Repeated '+repeated)+'</div>';
  if(list.length){
    h+='<div class="pq-tools">'+
      '<button class="an-btn" onclick="APP.pastAll(true)">'+ic('chevron')+' Open every answer</button>'+
      '<button class="an-btn" onclick="APP.pastAll(false)">'+ic('chevronUp')+' Close every answer</button>'+
      '<button class="an-btn" onclick="APP.pastAllVariants()">'+ic('layers')+' Show every wording</button></div>';
  }
  h+='<h3>Exam questions <span class="pq-count">'+rows.length+' distinct questions · '+answered+' with a model answer · '+(rows.length-answered)+' practice</span></h3>';
  if(!list.length){
    panel.innerHTML=h+'<p style="color:var(--t3)">No questions in this filter.</p>'+summaryHtml(summary);
    return;
  }
  list.forEach(r=>{
    const q=r.q,i=r.i,rep=q.repeats||1;
    const variants=pastVariants(q);
    const others=variants.filter(v=>!v.primary);
    const papers=[...new Set(variants.map(v=>v.year).filter(Boolean))];
    const freq=rep>=4?'high':(rep>=2?'mid':'low');
    const body=q.answer?('<div class="pq-answer-inner">'+q.answer+'</div>')
      :'<div class="pq-pending"><strong>Practice question — model answer not written yet.</strong><br>Kept on the site so nothing is missing from the question list. Attempt it from the chapter notes: the same topic is worked in the answered questions above.</div>';
    const more=others.length?('<div class="pq-more">'+
        '<button class="pq-more-btn" aria-expanded="false" onclick="APP.tVariants('+i+',event)">'+ic('file')+' Same question in '+papers.length+' paper'+(papers.length>1?'s':'')+' — show each wording <span class="caret">'+ic('chevron')+'</span></button>'+
        '<div class="pq-variants" id="pv-'+i+'" hidden>'+variants.map((v,vi)=>
          '<div class="pq-variant'+(v.primary?' is-primary':'')+'">'+
          '<div class="pq-variant-meta">'+App.Shell.esc(v.year||'paper on record')+'<em>'+App.Shell.esc(v.marks?v.marks+' marks':'')+(v.primary?' · as written above':'')+'</em></div>'+
          '<p>“'+App.Shell.esc(v.text)+'”</p>'+
          (v.answer?'<button class="pq-var-btn" aria-expanded="false" onclick="APP.tVariantAnswer('+i+','+vi+',event)">its own model answer<span class="caret">'+ic('chevron')+'</span></button><div class="pq-var-answer" id="pva-'+i+'-'+vi+'" hidden></div>':'')+
          '</div>').join('')+
          (rep>papers.length?'<p class="pq-note">The question bank counts '+rep+' appearances in total; the remaining ones are paraphrases with no paper text on record.</p>':'')+
        '</div></div>'):'';
    h+='<div class="pq-card'+(q.answer?'':' practice')+'" id="pq-'+i+'"><div class="pq-question" role="button" tabindex="0" aria-expanded="false" aria-label="'+App.Shell.esc(q.year+' • '+q.marks+' marks: '+q.q).slice(0,140)+'" onclick="APP.tpq('+i+')">'+
      '<div class="pq-meta"><span class="pq-year">'+App.Shell.esc(q.year||'')+'</span><span class="pq-marks">'+App.Shell.esc(q.marks||'')+' marks</span>'+(rep>=2?'<span class="pq-repeat" data-freq="'+freq+'">asked '+rep+'×</span>':'')+'</div>'+pageChips(q)+
      '<div class="pq-text">'+App.Shell.esc(q.q)+((papers.length>1)?'<div class="pq-papers">'+papers.map(y=>'<span class="pq-paper">'+App.Shell.esc(y)+'</span>').join('')+'</div>':'')+'</div><div class="pq-toggle">'+ic('chevron')+'</div></div>'+
      '<div class="pq-answer">'+body+more+'</div></div>';
  });
  panel.innerHTML=h+summaryHtml(summary);
}
function summaryHtml(summary){
  if(!summary)return '';
  return '<section class="pq-summary">'+
    '<h3>How to answer them <span class="pq-count">the questions this unit has been asked with</span></h3>'+
    '<div class="pq-summary-body">'+summary+'</div></section>';
}
/* The pages of the class notes this answer's numbers were read off. The chip
   only names the page; app.js owns what a click does, so a citation is data. */
function pageChips(q){
  const ids=q.src||[];
  if(!ids.length)return '';
  return '<div class="pq-src">'+ids.map(id=>{
    const p=(window.NOTE_PAGES||{})[id];
    const label=p?p.p:id, title=p?(p.p+' — '+p.t):'Class notes';
    return '<button class="page-chip" type="button" data-page="'+App.Shell.esc(id)+'" title="'+App.Shell.esc(title)+'">'+App.Shell.esc(label)+'</button>';
  }).join('')+'</div>';
}
function pill(key,label){return '<button class="pq-pill'+(pastFilter===key?' on':'')+'" onclick="APP.pastFilter(\''+key+'\')">'+label+'</button>'}
function setFilter(f){pastFilter=f;const c=App.Shell.chapters()[App.Shell.cur()];if(c)render(c.past||[],c.pastSummary||'')}
function toggle(i){
  const c=document.getElementById('pq-'+i);if(!c)return;
  c.classList.toggle('open');
  const head=c.querySelector('.pq-question');
  if(head)head.setAttribute('aria-expanded',c.classList.contains('open')?'true':'false');
}
/* A variant that has a model answer of its own can show it, still inside the
   one card: the wording and the answer written for that paper. */
function toggleVariantAnswer(i,vi,ev){
  if(ev)ev.stopPropagation();
  const box=document.getElementById('pva-'+i+'-'+vi);
  if(!box)return;
  const btn=box.previousElementSibling;
  if(box.hasAttribute('hidden')){
    if(!box.dataset.filled){
      const v=pastVariants((App.Shell.chapters()[App.Shell.cur()].past||[])[i]||{})[vi];
      if(!v||!v.answer)return;
      box.innerHTML='<div class="pq-answer-inner">'+v.answer+'</div>';
      box.dataset.filled='1';
      App.Shell.enhanceContent(box);
    }
    box.removeAttribute('hidden');
    if(btn)btn.setAttribute('aria-expanded','true');
  }else{
    box.setAttribute('hidden','');
    if(btn)btn.setAttribute('aria-expanded','false');
  }
}
/* The one-click expander: reveal this question's other papers' wordings. */
function toggleVariants(i,ev){
  if(ev){ev.stopPropagation()}
  const box=document.getElementById('pv-'+i),btn=box&&box.previousElementSibling;
  if(!box)return;
  const open=box.hasAttribute('hidden');
  box.toggleAttribute('hidden',!open);
  if(btn)btn.setAttribute('aria-expanded',open?'true':'false');
}
function all(open){
  document.querySelectorAll('#panel-past .pq-card').forEach(c=>{
    c.classList.toggle('open',open);
    const head=c.querySelector('.pq-question');
    if(head)head.setAttribute('aria-expanded',open?'true':'false');
  });
}
/* Reveal one card by index, with its answer - what a `#/q/<ch>-<i>` link means.
   Returns false when the link names a card this chapter does not have, so the
   caller can skip the scroll instead of jumping to nowhere. */
function openOne(i){
  const card=document.getElementById('pq-'+i);
  if(!card)return false;
  card.classList.add('open');
  const head=card.querySelector('.pq-question');
  if(head)head.setAttribute('aria-expanded','true');
  return true;
}
function allVariants(){
  let any=false;
  document.querySelectorAll('#panel-past .pq-variants').forEach(v=>{if(v.hasAttribute('hidden'))any=true});
  document.querySelectorAll('#panel-past .pq-variants').forEach(v=>{
    v.toggleAttribute('hidden',!any);
    const b=v.previousElementSibling;if(b)b.setAttribute('aria-expanded',any?'true':'false');
  });
  document.querySelectorAll('#panel-past .pq-card').forEach(c=>{
    if(any)c.classList.add('open');
    const head=c.querySelector('.pq-question');
    if(head&&any)head.setAttribute('aria-expanded','true');
  });
}
App.Past={render,setFilter,toggle,toggleVariants,toggleVariantAnswer,all,allVariants,openOne};
})();
