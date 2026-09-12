(function(){
'use strict';
const CH=window.CHAPTERS||{},KEY='sm-progress';
let cur=1,qs={},progress=JSON.parse(localStorage.getItem(KEY)||'{}');
if(!progress.xp)progress={xp:0,done:{},quizzes:0,totalQ:0,correctQ:0,streak:0,lastDay:''};
const meta=[
  {n:1,t:'Concept of Simulation',m:8,h:6,e:'📘'},
  {n:2,t:'Monte Carlo Method',m:6,h:4,e:'🎲'},
  {n:3,t:'Continuous Systems',m:6,h:5,e:'📈'},
  {n:4,t:'Queuing System',m:6,h:5,e:'🏦'},
  {n:5,t:'Verification & Validation',m:6,h:4,e:'✅'},
  {n:6,t:'Random Number Generation',m:12,h:6,e:'🔢'},
  {n:7,t:'Simulation Output Analysis',m:6,h:5,e:'📊'},
  {n:8,t:'Simulation Language',m:10,h:5,e:'💻'}
];
function save(){localStorage.setItem(KEY,JSON.stringify(progress))}
function updateStreak(){
  const today=new Date().toDateString();
  if(progress.lastDay!==today){
    const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
    if(progress.lastDay===yesterday.toDateString())progress.streak++;
    else if(progress.lastDay!==today)progress.streak=1;
    progress.lastDay=today;save();
  }
}
updateStreak();
function updateStats(){
  const doneCount=Object.keys(progress.done).length;
  const pct=progress.totalQ>0?Math.round(progress.correctQ/progress.totalQ*100):0;
  document.getElementById('xpVal').textContent=progress.xp+' XP';
  document.getElementById('xpFill').style.width=Math.min(progress.xp/800*100,100)+'%';
  document.getElementById('statChap').textContent=doneCount+'/8';
  document.getElementById('statQuiz').textContent=progress.quizzes;
  document.getElementById('statPct').textContent=pct+'%';
  document.getElementById('streakBadge').textContent='🔥 '+progress.streak;
  document.querySelectorAll('.nav-item').forEach(el=>{
    const ci=el.dataset.ch;
    if(progress.done[ci])el.classList.add('done');else el.classList.remove('done');
    el.classList.toggle('progress',!progress.done[ci]&&!!(progress.seen||{})[ci]);
  });
  updateTabBadges();
}
/* Theme */
const html=document.documentElement,tBtn=document.getElementById('themeBtn');
function setTheme(t){html.setAttribute('data-theme',t);tBtn.textContent=t==='dark'?'🌙':'☀️';localStorage.setItem('sm-theme',t)}
tBtn.onclick=()=>setTheme(html.getAttribute('data-theme')==='dark'?'light':'dark');
setTheme(localStorage.getItem('sm-theme')||'dark');
/* Toast */
function toast(msg){
  const t=document.createElement('div');t.className='toast';t.innerHTML=msg;document.body.appendChild(t);
  setTimeout(()=>{t.classList.add('hide');setTimeout(()=>t.remove(),300)},2500);
}
/* Confetti */
function confetti(){
  const c=document.createElement('div');c.className='confetti-container';document.body.appendChild(c);
  const colors=['#5e6ad2','#4cb782','#e5a03d','#e5484d','#9a7fe0','#8b94e4'];
  for(let i=0;i<60;i++){const p=document.createElement('div');p.className='confetti-piece';p.style.left=Math.random()*100+'%';p.style.background=colors[Math.floor(Math.random()*colors.length)];p.style.animationDelay=Math.random()*1+'s';p.style.animationDuration=(2+Math.random()*2)+'s';p.style.borderRadius=Math.random()>.5?'50%':'2px';p.style.width=(6+Math.random()*8)+'px';p.style.height=(6+Math.random()*8)+'px';c.appendChild(p);}
  setTimeout(()=>c.remove(),4000);
}
/* ---------------- Helpers ---------------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function stripTags(s){return String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}
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
}
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
      btn.innerHTML='<span class="caret">▼</span>';
      const target=sec;              // capture: `sec` moves on to the next heading
      btn.onclick=()=>toggleSection(target);
      head.appendChild(btn);
      return;
    }
    if(sec)sec.appendChild(node);
  });
  box.dataset.secs='1';
  const key='sm-collapsed-'+cur;
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
    try{localStorage.setItem('sm-collapsed-'+cur,JSON.stringify(idx.map((v,i)=>v?i:-1).filter(i=>i>=0)))}catch(e){}
  }
}
function toggleSection(sec){setSection(sec,sec.classList.contains('collapsed'))}
function setAllSections(open){
  document.querySelectorAll('#panel-learn section.learn-sec').forEach(s=>setSection(s,open,false));
  try{localStorage.setItem('sm-collapsed-'+cur,JSON.stringify(open?[]:[...document.querySelectorAll('#panel-learn section.learn-sec')].map((s,i)=>i)))}catch(e){}
  toast(open?'📖 All sections expanded':'📕 All sections collapsed');
}
/* Tab badges: what is behind each tab, and whether it is finished. The quiz
   badge turns green and shows the stored score once the chapter quiz is done. */
function updateTabBadges(){
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
}

/* ---------------- Global search ---------------- */
let IDX=[],SEARCH_HITS=[];
function buildIndex(){
  IDX=[];
  for(let n=1;n<=8;n++){
    const c=CH[n];if(!c)continue;const m=meta[n-1];
    String(c.learn||'').split(/(?=<h[23]>)/).forEach(p=>{
      const h=p.match(/<h[23]>([^<]*)<\/h[23]>/);
      const body=stripTags(p);if(body.length<40)return;
      IDX.push({ch:n,type:'note',title:h?h[1]:m.t,snip:body.slice(0,170),key:(h?h[1]:m.t)});
    });
    (c.quiz||[]).forEach(q=>IDX.push({ch:n,type:'quiz',title:q.q,snip:stripTags(q.explanation).slice(0,150),key:q.q.slice(0,45)}));
    (c.past||[]).forEach(q=>IDX.push({ch:n,type:'past',title:q.q,snip:(q.year||'')+' · '+(q.marks||'')+' marks'+(q.answer?' · model answer':' · practice question')+((q.occ||[]).length>1?' · also asked in '+(q.occ||[]).map(o=>o.year).join(', '):''),key:q.q.slice(0,45)}));
  }
}
function search(term){
  const t=term.trim().toLowerCase();if(t.length<2)return[];
  const words=t.split(/\s+/),scored=[];
  IDX.forEach(e=>{
    const title=e.title.toLowerCase(),hay=(title+' '+e.snip.toLowerCase());
    let s=0;words.forEach(w=>{if(hay.includes(w))s+=title.includes(w)?3:1});
    if(s>0)scored.push([s,e]);
  });
  scored.sort((a,b)=>b[0]-a[0]);
  return scored.slice(0,14).map(x=>x[1]);
}
function wireSearch(){
  const inp=document.getElementById('searchIn'),res=document.getElementById('searchRes');
  let sel=-1;
  const close=()=>{res.classList.remove('show');sel=-1};
  const draw=()=>{
    if(!SEARCH_HITS.length){res.innerHTML='<div class="sr-empty">No matches. Try "chi-square", "GPSS", "Markov", "auto-correlation".</div>';res.classList.add('show');return}
    res.innerHTML=SEARCH_HITS.map((e,i)=>'<div class="sr-item'+(i===sel?' sel':'')+'" data-i="'+i+'"><span class="sr-tag">'+(e.type==='note'?'Notes':e.type==='quiz'?'Quiz':'Past Q')+'</span>'+esc(e.title)+'<div class="sr-meta">Ch '+e.ch+' · '+esc(e.snip)+'</div></div>').join('');
    res.classList.add('show');
  };
  inp.addEventListener('input',()=>{SEARCH_HITS=search(inp.value);sel=-1;if(inp.value.trim().length<2){close();return}draw()});
  inp.addEventListener('keydown',ev=>{
    if(ev.key==='Escape'){close();inp.blur();return}
    if(ev.key==='ArrowDown'){ev.preventDefault();sel=Math.min(sel+1,SEARCH_HITS.length-1);draw();return}
    if(ev.key==='ArrowUp'){ev.preventDefault();sel=Math.max(sel-1,0);draw();return}
    if(ev.key==='Enter'&&SEARCH_HITS.length){ev.preventDefault();APP.gotoResult(sel<0?0:sel)}
  });
  res.addEventListener('click',ev=>{const it=ev.target.closest('.sr-item');if(it)APP.gotoResult(+it.dataset.i)});
  document.addEventListener('click',ev=>{if(!ev.target.closest('.search-wrap'))close()});
  document.addEventListener('keydown',ev=>{
    if(ev.key==='/'&&document.activeElement!==inp&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)){ev.preventDefault();inp.focus();inp.select()}
  });
}
function gotoResult(i){
  const e=SEARCH_HITS[i];if(!e)return;
  load(e.ch);switchTab(e.type==='note'?'learn':e.type);
  document.getElementById('searchRes').classList.remove('show');
  setTimeout(()=>{
    const panel=document.getElementById(e.type==='note'?'panel-learn':(e.type==='quiz'?'panel-quiz':'panel-past'));
    const sel=e.type==='note'?'h2,h3':(e.type==='quiz'?'.quiz-card':'.pq-card');
    const key=e.key.replace(/\s+/g,' ').trim().slice(0,40).toLowerCase();
    const nodes=[...panel.querySelectorAll(sel)];
    const hit=nodes.find(n=>n.textContent.replace(/\s+/g,' ').trim().toLowerCase().includes(key));
    if(!hit)return;
    if(e.type==='past'&&hit.classList.contains('pq-card'))hit.classList.add('open');
    // A hit inside a folded section must reveal the section, or the jump would
    // land on something the reader cannot see.
    const sec=hit.closest('section.learn-sec');
    if(sec&&sec.classList.contains('collapsed'))setSection(sec,true,false);
    hit.scrollIntoView({behavior:'smooth',block:'center'});
    hit.classList.add('mark-flash');setTimeout(()=>hit.classList.remove('mark-flash'),2600);
  },80);
}

/* ---------------- Progress tools ---------------- */
function bankCounts(){
  let answered=0,pending=0,total=0,repeated=0;
  for(let n=1;n<=8;n++){const c=CH[n];if(!c)continue;(c.past||[]).forEach(q=>{total++;q.answer?answered++:pending++;if((q.repeats||1)>=2)repeated++})}
  return{answered,pending,total,repeated};
}
function exportProgress(){
  const data={exported:new Date().toISOString(),progress,version:1};
  const blob=new Blob([JSON.stringify(data,null,1)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='simulation-progress-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();a.remove();
  toast('💾 Progress exported');
}
function importProgress(mode){
  const inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';
  inp.onchange=()=>{
    const f=inp.files&&inp.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=()=>{
      try{
        const d=JSON.parse(r.result);const inc=d.progress||d;
        if(!inc||typeof inc!=='object')throw new Error('bad file');
        progress=(mode==='merge')?Object.assign({},progress,inc,{done:Object.assign({},progress.done,inc.done||{}),chapterQuiz:Object.assign({},progress.chapterQuiz,inc.chapterQuiz||{})}):inc;
        if(!progress.xp)progress={xp:0,done:{},quizzes:0,totalQ:0,correctQ:0,streak:0,lastDay:''};
        save();buildNav();updateStats();renderAnalysis();toast('📥 Progress imported');
      }catch(err){toast('❌ Could not read that file')}
    };
    r.readAsText(f);
  };
  inp.click();
}
function resetProgress(){
  if(!confirm('Reset all progress — XP, completed chapters, quiz scores and streak? This cannot be undone.'))return;
  localStorage.removeItem(KEY);localStorage.removeItem('sm-theme');location.reload();
}

/* ---------------- Analysis tab ---------------- */
function renderAnalysis(){
  const A=window.ANALYSIS||{};const el=document.getElementById('panel-analysis');
  const b=bankCounts();
  const doneCount=Object.keys(progress.done||{}).length;
  const acc=progress.totalQ>0?Math.round(progress.correctQ/progress.totalQ*100):0;
  let masterySum=0,masteryN=0;
  for(let n=1;n<=8;n++){const cq=(progress.chapterQuiz||{})[n];if(cq){masterySum+=(cq.pct||0);masteryN++}}
  const mastery=masteryN?Math.round(masterySum/8):0;
  let h='';
  h+='<div class="an-grid">'+
    card('Study progress',doneCount+'/8','chapters marked complete')+
    card('Quiz accuracy',acc+'%',progress.correctQ+' of '+progress.totalQ+' questions answered correctly')+
    card('Question bank',b.answered+'/'+b.total,'past questions with a model answer ('+b.pending+' practice-only)')+
    card('Most repeated',b.repeated,'questions that have appeared 2+ times')+
  '</div>';
  h+='<div class="an-sec"><h3>🎯 Chapter mastery</h3>';
  for(let n=1;n<=8;n++){
    const m=meta[n-1],cq=(progress.chapterQuiz||{})[n],done=progress.done[n];
    let pct=cq?(cq.pct||0):0;
    if(done)pct=Math.round((pct+100)/2);
    h+=bar('Ch '+n+' · '+m.t.slice(0,18)+(done?' ✓':''),pct,cq?(cq.correct+'/'+cq.total+' quiz'):'not attempted');
  }
  h+='<div class="an-btns"><button class="an-btn" onclick="APP.exportProgress()">💾 Export progress</button>'+
     '<button class="an-btn" onclick="APP.importProgress(\'merge\')">📥 Import (merge)</button>'+
     '<button class="an-btn" onclick="APP.importProgress(\'replace\')">📥 Import (replace)</button>'+
     '<button class="an-btn danger" onclick="APP.resetProgress()">🗑 Reset</button></div></div>';
  if(A.topics&&A.topics.length){
    h+='<div class="an-sec"><h3>🔥 Top 15 most repeated topics <span class="pq-count">across '+A.total_questions+' past questions from '+A.papers.length+' papers</span></h3>';
    A.topics.forEach(t=>{h+=topicRow(t)});
    h+='</div>';
  }
  if(A.year_distribution){
    const yrs=Object.keys(A.year_distribution),max=Math.max(...Object.values(A.year_distribution));
    h+='<div class="an-sec"><h3>📅 Year-wise distribution</h3>';
    yrs.forEach(y=>{h+=bar(y,Math.round(A.year_distribution[y]/max*100),A.year_distribution[y]+' questions')});
    h+='<p style="font-size:11.5px;color:var(--t3);margin-top:10px">Papers analysed: '+esc(A.papers.join(', '))+'. A question listed in two papers is counted in both.</p></div>';
  }
  if(A.chapters){
    h+='<div class="an-sec"><h3>📚 Bank coverage per chapter</h3><table><tr><th>Chapter</th><th>Weight</th><th>Bank questions</th><th>On the site</th><th>Answered</th></tr>';
    Object.keys(A.chapters).sort((a,b2)=>a-b2).forEach(k=>{
      const c=A.chapters[k],site=CH[k]?(CH[k].past||[]).filter(q=>q.answer).length:0;
      h+='<tr><td>Ch '+k+' — '+esc(c.title)+'</td><td>'+c.weight+'</td><td>'+c.questions+'</td><td>'+((CH[k]&&CH[k].past||[]).length)+'</td><td>'+site+'</td></tr>';
    });
    h+='</table></div>';
  }
  if(A.strategy&&A.strategy.length){
    h+='<div class="strategy-box"><h3 style="font-size:15px;margin-bottom:10px">⚠️ Exam strategy notes</h3>';
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

/* ---------------- Mock exam ---------------- */
const EXAM_WEIGHTS=[8,6,6,6,6,12,6,10];
/* The paper's mark total is the sum of the weights - never a separate literal,
   so the header, the score and the breakdown denominators cannot drift apart. */
const EXAM_TOTAL=EXAM_WEIGHTS.reduce((a,b)=>a+b,0);
let EXAM=null,EXAM_TIMER=null;
function marksOf(s){const m=String(s||'').match(/\d+/g);if(!m)return 2;const v=m.reduce((a,b2)=>a+ +b2,0);return v>0?v:2}
/* Every subset of a chapter's answered questions that stays under cap,
   so the allocator can choose between several mark totals for each chapter. */
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
/* Assemble a paper that totals exactly EXAM_TOTAL marks.

   Each chapter prefers its own syllabus weight, but a chapter whose pool cannot
   hit that weight exactly (Ch 2, 4, 5 and 7 have no combination adding to 6)
   may take a slightly larger or smaller set instead. A global dynamic program
   then picks one option per chapter so that the paper still comes to EXAM_TOTAL
   with the smallest possible deviation from the published weights. */
function buildPaper(){
  const perCh={};
  for(let n=1;n<=8;n++){
    const c=CH[n];
    if(!c){perCh[n]=[[0,[]]];continue;}
    const pool=shuffle((c.past||[]).filter(q=>q.answer).map(q=>({ch:n,q,marks:marksOf(q.marks),repeats:q.repeats||1})));
    perCh[n]=chapterOptions(pool,EXAM_WEIGHTS[n-1]+5);
  }
  // State = total marks so far -> the lowest-deviation set of chapter picks
  // reaching that total. Comparing deviation (not just first-found) is what
  // lets the allocator keep every chapter close to its own weight.
  let states=new Map([[0,{dev:0,picks:[]}]]);
  for(let n=1;n<=8;n++){
    const weight=EXAM_WEIGHTS[n-1],next=new Map();
    for(const [tot,st] of states){
      for(const [sum,combo] of perCh[n]){
        const nt=tot+sum;
        if(nt>EXAM_TOTAL)continue;
        const dev=st.dev+Math.abs(sum-weight);
        const cur=next.get(nt);
        if(!cur||dev<cur.dev)next.set(nt,{dev,picks:st.picks.concat([{ch:n,sum,combo}])});
      }
    }
    if(next.size)states=next;
  }
  let best=null,bestScore=Infinity,bestTotal=0;
  for(const [tot,st] of states){
    const score=Math.abs(EXAM_TOTAL-tot)*10+st.dev;
    if(score<bestScore){bestScore=score;best=st.picks;bestTotal=tot}
  }
  const items=[];
  (best||[]).forEach(p=>p.combo.forEach(x=>items.push(x)));
  return items;
}
function startExam(){
  const items=buildPaper();
  EXAM={items,revealed:{},marked:{},submitted:false,
        total:items.reduce((a,i)=>a+i.marks,0),
        left:180*60};
  clearInterval(EXAM_TIMER);
  EXAM_TIMER=setInterval(tickExam,1000);
  renderExam();
}
function tickExam(){
  if(!EXAM||EXAM.submitted)return;
  EXAM.left--;
  const el=document.getElementById('examTimer');
  if(el){el.textContent=fmtClock(EXAM.left);el.classList.toggle('calm',EXAM.left>3600)}
  if(EXAM.left<=0){clearInterval(EXAM_TIMER);submitExam(true)}
}
function fmtClock(s){s=Math.max(0,s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h+':'+String(m).padStart(2,'0')+':'+String(x).padStart(2,'0')}
function renderExam(){
  const el=document.getElementById('panel-exam');
  if(!EXAM){
    el.innerHTML='<div class="an-sec"><h3>🕐 Mock Exam — full '+EXAM_TOTAL+'-mark paper</h3>'+
      '<p style="font-size:13.5px;color:var(--t2);line-height:1.75">A complete paper is assembled from the past questions that have model answers, and it always totals <strong>'+EXAM_TOTAL+' marks</strong> taken in 3 hours. Each chapter contributes as close to its syllabus weight — <strong>8 + 6 + 6 + 6 + 6 + 12 + 6 + 10</strong> — as its pool of answered questions allows; where no set of answers in a chapter adds up to exactly its weight, the chapter contributes the nearest total instead and the breakdown after the paper names it.</p>'+
      '<ul style="font-size:13.5px;color:var(--t2);line-height:1.8;margin:10px 0 10px 20px"><li>Attempt each question on paper first, then reveal the model answer.</li>'+
      '<li>Mark yourself <strong>Got it</strong> or <strong>Missed it</strong> — the score is built from your own honest marking.</li>'+
      '<li>Repeated questions (🔥) are the ones that actually come back, so they carry the most exam value.</li>'+
      '<li>Take it with the timer running to practise the 3-hour pace.</li></ul>'+
      '<div class="an-btns"><button class="an-btn" onclick="APP.startExam()">▶ Start the 3-hour paper</button></div></div>';
    return;
  }
  const score=EXAM.items.reduce((a,i,idx)=>a+(EXAM.marked[idx]?i.marks:0),0);
  const markedCount=Object.keys(EXAM.marked).length;
  let h='<div class="exam-head">'+
    '<div><div style="font-size:17px;font-weight:700">🕐 Mock Exam — '+EXAM.items.length+' questions · '+EXAM.total+' marks</div>'+
    '<div style="font-size:12px;color:var(--t3);margin-top:4px">'+(EXAM.submitted?'Paper submitted':'Attempt each question, then reveal and self-mark')+'</div></div>'+
    (EXAM.submitted?'':'<div class="exam-timer" id="examTimer">'+fmtClock(EXAM.left)+'</div>')+'</div>';
  if(EXAM.submitted){
    const pct=Math.round(score/EXAM.total*100);
    const verdict=pct>=70?'🏆 Distinction pace — keep this up':(pct>=50?'⭐ Solid — review the missed topics':'📚 Needs revision — start with the missed chapters');
    h+='<div class="exam-result"><div class="big">'+score+'/'+EXAM.total+'</div><div class="sub">'+pct+'% self-assessed · '+verdict+'</div></div>';
    h+='<div class="an-sec"><h3>Breakdown by chapter</h3>'+
        '<p style="font-size:12px;color:var(--t3);margin-bottom:10px">Every bar is out of the marks this paper actually set for that chapter, so a chapter you answered perfectly reads 100%. The denominators add up to the '+EXAM.total+' marks above; a chapter that could not reach its syllabus weight carries that weight beside it.</p>';
    for(let n=1;n<=8;n++){
      const got=EXAM.items.reduce((a,i,idx)=>a+(i.ch===n&&EXAM.marked[idx]?i.marks:0),0);
      const avail=EXAM.items.reduce((a,i)=>a+(i.ch===n?i.marks:0),0);
      if(!avail)continue;
      const weight=EXAM_WEIGHTS[n-1];
      h+=bar('Ch '+n+' · '+meta[n-1].t.slice(0,14),Math.round(got/avail*100),got+'/'+avail+' marks'+(avail===weight?'':' (syllabus '+weight+')'));
    }
    h+='</div><div class="an-btns"><button class="an-btn" onclick="APP.startExam()">🔄 New paper</button>'+
       '<button class="an-btn" onclick="APP.clearExam()">← Back</button></div>';
  }
  h+='<div style="margin-top:16px">';
  EXAM.items.forEach((it,idx)=>{
    const rev=EXAM.revealed[idx],mk=EXAM.marked[idx];
    h+='<div class="exam-q"><div class="top"><div class="qt">'+(idx+1)+'. '+esc(it.q.q)+'</div><div class="qm">'+it.marks+' mark'+(it.marks>1?'s':'')+'</div></div>'+
      '<div class="qmeta">Ch '+it.ch+' — '+esc(meta[it.ch-1].t)+' · '+esc(it.q.year)+' · from '+esc(it.q.marks)+' marks in the original paper'+
      (it.repeats>=2?' · 🔥 repeated '+it.repeats+'×':'')+'</div>';
    if(!rev){
      h+='<div class="exam-actions"><button class="an-btn" onclick="APP.revealExam('+idx+')">👁 Reveal model answer</button></div>';
    }else{
      h+='<div class="pq-answer-inner" style="border-top:1px solid var(--brd);padding:14px 0 0">'+(it.q.answer||'<em>No model answer.</em>')+'</div>';
      h+='<div class="exam-actions"><span class="exam-marked" style="color:'+(mk===true?'var(--sec)':mk===false?'var(--dan)':'var(--t3)')+'">'+(mk===true?'✅ marked correct':mk===false?'❌ marked missed':'not self-marked yet')+'</span></div>';
      h+='<div class="exam-actions"><button class="an-btn" onclick="APP.markExam('+idx+',true)">✅ I got this</button>'+
         '<button class="an-btn danger" onclick="APP.markExam('+idx+',false)">❌ I missed this</button></div>';
    }
    h+='</div>';
  });
  h+='</div>';
  if(!EXAM.submitted){
    h+='<div class="an-btns" style="margin-top:8px"><button class="an-btn" onclick="APP.submitExam(false)">📤 Finish and score ('+score+' marks so far, '+markedCount+'/'+EXAM.items.length+' self-marked)</button></div>';
  }
  el.innerHTML=h;
}
function revealExam(i){EXAM.revealed[i]=true;renderExam()}
function markExam(i,ok){
  EXAM.marked[i]=!!ok;
  if(ok)progress.xp+=2;
  progress.examAttempts=(progress.examAttempts||0)+1;
  save();updateStats();renderExam();
  if(ok)toast('✅ +2 XP');
}
function submitExam(auto){
  EXAM.submitted=true;clearInterval(EXAM_TIMER);
  const score=EXAM.items.reduce((a,i,idx)=>a+(EXAM.marked[idx]?i.marks:0),0);
  progress.examBest=Math.max(progress.examBest||0,score);
  progress.xp+=10;save();updateStats();renderExam();
  toast((auto?'⏰ Time up! ':'')+'Paper scored '+score+'/'+EXAM.total+' · +10 XP');
}
function clearExam(){clearInterval(EXAM_TIMER);EXAM=null;renderExam()}

/* Nav */
function buildNav(){
  document.getElementById('chNav').innerHTML=meta.map(c=>{
    const done=progress.done[c.n];
    const seen=!!(progress.seen||{})[c.n];
    const state=done?' done':(seen?' progress':'');
    const score=(progress.chapterQuiz||{})[c.n];
    const stateWord=done?', completed':(seen?', in progress':'');
    return `<div class="nav-item${c.n===1?' active':''}${state}" data-ch="${c.n}" role="button" tabindex="0" aria-current="${c.n===1?'true':'false'}" aria-label="Chapter ${c.n}: ${c.t}, ${c.m} marks${stateWord}" onclick="APP.load(${c.n})"><span class="nav-num">${done?'✓':c.n}</span><span class="nav-label">${c.e} ${c.t}</span><div class="nav-meta"><span class="nav-marks">${c.m}m</span>${score?`<span class="nav-quiz">${score.pct}%</span>`:''}</div></div>`;
  }).join('');
}
function load(n){
  cur=n;const ch=CH[n],m=meta[n-1];
  if(!progress.seen)progress.seen={};
  if(!progress.seen[n]){progress.seen[n]=true;buildNav();save()}
  document.querySelectorAll('.nav-item').forEach(el=>{const on=+el.dataset.ch===n;el.classList.toggle('active',on);el.setAttribute('aria-current',on?'true':'false')});
  document.getElementById('chTi').textContent=m.e+' Ch '+n+': '+m.t;
  document.getElementById('chBd').textContent=m.m+' Marks · '+m.h+' hrs';
  switchTab('learn');
  if(!ch){document.getElementById('panel-learn').innerHTML='<p style="color:var(--t3)">Loading...</p>';return;}
  const doneHtml=`<div class="ch-complete-bar"><div class="label">${progress.done[n]?'✅ Chapter completed! +10 XP earned':'📖 Finished reading? Mark as complete for +10 XP'}</div><button class="mark-done-btn ${progress.done[n]?'completed':'todo'}" onclick="APP.markDone(${n})">${progress.done[n]?'✅ Completed':'Mark Complete ✨'}</button></div>`;
  const tools='<div class="learn-tools">'+
      '<button class="an-btn" onclick="APP.sections(true)">▾ Expand all sections</button>'+
      '<button class="an-btn" onclick="APP.sections(false)">▴ Collapse all sections</button>'+
      '<span class="meta">Chapter ' +n+' · '+(ch.quiz||[]).length+' quiz questions · '+(ch.past||[]).length+' past questions</span>'+
    '</div>';
  document.getElementById('panel-learn').innerHTML=tools+'<div class="learn-content">'+ch.learn+doneHtml+'</div>';
  buildSections();
  renderQuiz(n,ch.quiz||[]);
  renderPast(ch.past||[]);
  enhanceContent(document.getElementById('panel-learn'));
  enhanceContent(document.getElementById('panel-past'));
  updateTabBadges();
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('contentArea').scrollTop=0;
}
function markDone(n){
  if(progress.done[n])return;
  progress.done[n]=true;progress.xp+=10;save();updateStats();
  buildNav();load(n);confetti();toast('🎉 +10 XP! Chapter '+n+' completed!');
}
function switchTab(t){
  document.querySelectorAll('.tab-btn').forEach(b=>{const on=b.dataset.tab===t;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false')});
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.id==='panel-'+t));
  document.getElementById('contentArea').scrollTop=0;
  if(t==='analysis')renderAnalysis();
  if(t==='exam')renderExam();
}
/* Quiz */
function renderQuiz(cn,questions){
  if(!questions.length){document.getElementById('panel-quiz').innerHTML='<p style="color:var(--t3)">No quiz available.</p>';return;}
  qs={total:questions.length,answered:0,correct:0};
  const L='ABCDEF';
  let h=`<div class="quiz-header"><h3>🧠 Chapter ${cn} Quiz</h3><div class="quiz-progress"><div class="progress-bar"><div class="progress-fill" id="qProg" style="width:0%"></div></div><span class="progress-text" id="qProgT">0/${questions.length}</span></div><div class="quiz-score"><span class="score-badge score-correct" id="sC">✓ 0</span><span class="score-badge score-wrong" id="sW">✗ 0</span></div></div>`;
  questions.forEach((q,i)=>{h+=`<div class="quiz-card" id="qc-${i}"><div class="q-number">Question ${i+1} of ${questions.length}</div><div class="q-text">${q.q}</div><div class="q-options">${q.options.map((o,j)=>`<div class="q-option" role="button" tabindex="0" aria-label="Option ${L[j]}: ${o}" onclick="APP.ans(${i},${j})"><span class="opt-letter">${L[j]}</span><span>${o}</span></div>`).join('')}</div><div class="q-explanation" id="qe-${i}"><strong>💡 Explanation:</strong> ${q.explanation||''}</div></div>`;});
  h+=`<div class="quiz-result" id="quizResult"><div class="big-emoji"></div><div class="result-msg"></div><div class="result-sub"></div><div class="xp-earned"></div></div>`;
  h+=`<button class="quiz-reset" onclick="APP.load(${cn})">🔄 Reset Quiz</button>`;
  document.getElementById('panel-quiz').innerHTML=h;
}
function ans(qi,oi){
  const ch=CH[cur];if(!ch||!ch.quiz)return;
  const q=ch.quiz[qi],card=document.getElementById('qc-'+qi);
  if(card.classList.contains('answered-correct')||card.classList.contains('answered-wrong'))return;
  const opts=card.querySelectorAll('.q-option');
  opts.forEach(o=>o.classList.add('disabled'));
  const ok=oi===q.answer;
  opts[oi].classList.add(ok?'correct':'wrong');
  if(!ok)opts[q.answer].classList.add('correct');
  card.classList.add(ok?'answered-correct':'answered-wrong');
  document.getElementById('qe-'+qi).classList.add('show');
  qs.answered++;if(ok){qs.correct++;progress.xp+=2;progress.correctQ++;}
  progress.totalQ++;save();updateStats();
  document.getElementById('qProg').style.width=(qs.answered/qs.total*100)+'%';
  document.getElementById('qProgT').textContent=qs.answered+'/'+qs.total;
  document.getElementById('sC').textContent='✓ '+qs.correct;
  document.getElementById('sW').textContent='✗ '+(qs.answered-qs.correct);
  if(ok)toast('✅ +2 XP! Correct!');
  // Check quiz completion
  if(qs.answered===qs.total){
    progress.quizzes++;save();updateStats();
    const pct=Math.round(qs.correct/qs.total*100);
    progress.chapterQuiz=progress.chapterQuiz||{};
    progress.chapterQuiz[cur]={correct:qs.correct,total:qs.total,pct:pct};save();
    const res=document.getElementById('quizResult');
    let emoji='🎯',msg='',sub='';
    if(pct>=90){emoji='🏆';msg='Outstanding!';sub='You really know this chapter!';}
    else if(pct>=70){emoji='⭐';msg='Great Job!';sub='Keep up the excellent work!';}
    else if(pct>=50){emoji='👍';msg='Good Effort!';sub='Review the explanations to improve.';}
    else{emoji='📚';msg='Keep Studying!';sub='Re-read the chapter and try again.';}
    res.querySelector('.big-emoji').textContent=emoji;
    res.querySelector('.result-msg').textContent=msg+' '+pct+'%';
    res.querySelector('.result-sub').textContent=sub;
    res.querySelector('.xp-earned').textContent='💎 +'+qs.correct*2+' XP earned from this quiz';
    res.classList.add('show');
    if(pct>=70)confetti();
  }
}
/* Past */
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
function renderPast(questions){
  const panel=document.getElementById('panel-past');
  if(!questions.length){panel.innerHTML='<p style="color:var(--t3)">No past questions available.</p>';return;}
  const rows=questions.map((q,i)=>({q,i}));
  const answered=rows.filter(r=>r.q.answer).length;
  const repeated=rows.filter(r=>(r.q.repeats||1)>=2).length;
  let list=rows;
  if(pastFilter==='answered')list=rows.filter(r=>r.q.answer);
  else if(pastFilter==='practice')list=rows.filter(r=>!r.q.answer);
  else if(pastFilter==='repeat')list=rows.filter(r=>(r.q.repeats||1)>=2);
  let h='<div class="pq-filter">'+
    pill('all','All '+rows.length)+pill('answered','✅ Model answers '+answered)+pill('practice','📝 Practice '+(rows.length-answered))+pill('repeat','🔥 Repeated '+repeated)+'</div>';
  if(list.length){
    h+='<div class="pq-tools">'+
      '<button class="an-btn" onclick="APP.pastAll(true)">▾ Open every answer</button>'+
      '<button class="an-btn" onclick="APP.pastAll(false)">▴ Close every answer</button>'+
      '<button class="an-btn" onclick="APP.pastAllVariants()">🔤 Show every wording</button></div>';
  }
  h+='<h3 style="font-size:18px;margin:0 0 16px">📝 Exam Questions <span class="pq-count">'+rows.length+' distinct questions · '+answered+' with a model answer · '+(rows.length-answered)+' practice</span></h3>';
  if(!list.length){h+='<p style="color:var(--t3)">No questions in this filter.</p>';panel.innerHTML=h;return;}
  list.forEach(r=>{
    const q=r.q,i=r.i,rep=q.repeats||1;
    const variants=pastVariants(q);
    const others=variants.filter(v=>!v.primary);
    const papers=[...new Set(variants.map(v=>v.year).filter(Boolean))];
    const freq=rep>=4?'high':(rep>=2?'mid':'low');
    const body=q.answer?('<div class="pq-answer-inner">'+q.answer+'</div>')
      :'<div class="pq-pending"><strong>Practice question — model answer not written yet.</strong><br>Kept on the site so nothing is missing from the question list. Attempt it from the chapter notes: the same topic is worked in the answered questions above.</div>';
    const more=others.length?('<div class="pq-more">'+
        '<button class="pq-more-btn" aria-expanded="false" onclick="APP.tVariants('+i+',event)">📄 Same question in '+papers.length+' paper'+(papers.length>1?'s':'')+' — show each wording <span class="caret">▼</span></button>'+
        '<div class="pq-variants" id="pv-'+i+'" hidden>'+variants.map((v,vi)=>
          '<div class="pq-variant'+(v.primary?' is-primary':'')+'">'+
          '<div class="pq-variant-meta">'+esc(v.year||'paper on record')+'<em>'+esc(v.marks?v.marks+' marks':'')+(v.primary?' · as written above':'')+'</em></div>'+
          '<p>“'+esc(v.text)+'”</p>'+
          (v.answer?'<button class="pq-var-btn" aria-expanded="false" onclick="APP.tVariantAnswer('+i+','+vi+',event)">▸ its own model answer<span class="caret">▼</span></button><div class="pq-var-answer" id="pva-'+i+'-'+vi+'" hidden></div>':'')+
          '</div>').join('')+
          (rep>papers.length?'<p class="pq-note">The question bank counts '+rep+' appearances in total; the remaining ones are paraphrases with no paper text on record.</p>':'')+
        '</div></div>'):'';
    h+='<div class="pq-card'+(q.answer?'':' practice')+'" id="pq-'+i+'"><div class="pq-question" role="button" tabindex="0" aria-expanded="false" aria-label="'+esc(q.year+' • '+q.marks+' marks: '+q.q).slice(0,140)+'" onclick="APP.tpq('+i+')">'+
      '<div class="pq-meta"><span class="pq-year">'+esc(q.year||'')+'</span><span class="pq-marks">'+esc(q.marks||'')+' marks</span>'+(rep>=2?'<span class="pq-repeat" data-freq="'+freq+'">🔥 Asked '+rep+'×</span>':'')+'</div>'+
      '<div class="pq-text">'+esc(q.q)+((papers.length>1)?'<div class="pq-papers">'+papers.map(y=>'<span class="pq-paper">'+esc(y)+'</span>').join('')+'</div>':'')+'</div><div class="pq-toggle">▼</div></div>'+
      '<div class="pq-answer">'+body+more+'</div></div>';
  });
  panel.innerHTML=h;
}
function pill(key,label){return '<button class="pq-pill'+(pastFilter===key?' on':'')+'" onclick="APP.pastFilter(\''+key+'\')">'+label+'</button>'}
function setPastFilter(f){pastFilter=f;if(CH[cur])renderPast(CH[cur].past||[])}
function tpq(i){
  const c=document.getElementById('pq-'+i);if(!c)return;
  c.classList.toggle('open');
  const head=c.querySelector('.pq-question');
  if(head)head.setAttribute('aria-expanded',c.classList.contains('open')?'true':'false');
}
/* A variant that has a model answer of its own can show it, still inside the
   one card: the wording and the answer written for that paper. */
function tVariantAnswer(i,vi,ev){
  if(ev)ev.stopPropagation();
  const box=document.getElementById('pva-'+i+'-'+vi);
  if(!box)return;
  const btn=box.previousElementSibling;
  if(box.hasAttribute('hidden')){
    if(!box.dataset.filled){
      const v=pastVariants((CH[cur].past||[])[i]||{})[vi];
      if(!v||!v.answer)return;
      box.innerHTML='<div class="pq-answer-inner">'+v.answer+'</div>';
      box.dataset.filled='1';
      enhanceContent(box);
    }
    box.removeAttribute('hidden');
    if(btn)btn.setAttribute('aria-expanded','true');
  }else{
    box.setAttribute('hidden','');
    if(btn)btn.setAttribute('aria-expanded','false');
  }
}
/* The one-click expander: reveal this question's other papers' wordings. */
function tVariants(i,ev){
  if(ev){ev.stopPropagation()}
  const box=document.getElementById('pv-'+i),btn=box&&box.previousElementSibling;
  if(!box)return;
  const open=box.hasAttribute('hidden');
  box.toggleAttribute('hidden',!open);
  if(btn)btn.setAttribute('aria-expanded',open?'true':'false');
}
function pastAll(open){
  document.querySelectorAll('#panel-past .pq-card').forEach(c=>{
    c.classList.toggle('open',open);
    const head=c.querySelector('.pq-question');
    if(head)head.setAttribute('aria-expanded',open?'true':'false');
  });
}
function pastAllVariants(){
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

/* Events */
/* One button, two jobs: on a laptop it compresses the sidebar to a rail of
   chapter numbers (remembered between visits); under 1025 px the sidebar is a
   drawer and the same button opens it. */
const appEl=document.querySelector('.app'),sideEl=document.getElementById('sidebar'),menuEl=document.getElementById('menuBtn');
const isDrawer=()=>window.matchMedia('(max-width:1024px)').matches;
function syncMenuBtn(){
  const on=isDrawer()?sideEl.classList.contains('open'):!appEl.classList.contains('rail');
  menuEl.setAttribute('aria-expanded',on?'true':'false');
  menuEl.textContent=isDrawer()?(sideEl.classList.contains('open')?'✕':'☰'):'☰';
}
function setRail(on,remember){
  appEl.classList.toggle('rail',on);
  menuEl.setAttribute('aria-expanded',on?'false':'true');
  menuEl.title=on?'Show the full chapter list':'Compress the chapter list';
  if(remember!==false){try{localStorage.setItem('sm-rail',on?'1':'0')}catch(e){}}
  syncMenuBtn();
}
menuEl.onclick=()=>{
  if(isDrawer()){sideEl.classList.toggle('open');document.getElementById('overlay').classList.toggle('show')}
  else setRail(!appEl.classList.contains('rail'));
  syncMenuBtn();
};
document.getElementById('overlay').onclick=()=>{sideEl.classList.remove('open');document.getElementById('overlay').classList.remove('show');syncMenuBtn()};
window.addEventListener('resize',()=>{
  if(!isDrawer()){sideEl.classList.remove('open');document.getElementById('overlay').classList.remove('show')}
  syncMenuBtn();
});
document.querySelectorAll('.tab-btn').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
/* Persistent jump-to-top / next-chapter affordance: navigation should not live
   only in the sidebar. */
document.getElementById('fabTop').onclick=()=>document.getElementById('contentArea').scrollTo({top:0,behavior:'smooth'});
document.getElementById('fabNext').onclick=()=>load(cur<8?cur+1:1);
/* Keyboard access: the chapter nav and the past-question headers are divs with
   click handlers, so give them Enter/Space support to match the buttons. */
function wireKeys(){
  document.getElementById('chNav').addEventListener('keydown',ev=>{
    const el=ev.target.closest('.nav-item');
    if(!el||!(ev.key==='Enter'||ev.key===' '))return;
    ev.preventDefault();load(+el.dataset.ch);
  });
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
buildNav();updateStats();buildIndex();wireSearch();wireKeys();load(1);
setRail(localStorage.getItem('sm-rail')==='1',false);
window.APP={load,ans,tpq,markDone,pastFilter:setPastFilter,gotoResult,exportProgress,importProgress,resetProgress,startExam,revealExam,markExam,submitExam,clearExam,
  sections:setAllSections,pastAll,pastAllVariants,tVariants,tVariantAnswer,setRail};
})();
