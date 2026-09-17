/* Owns the mock exam: the assembled paper, the countdown and the self-marking.
   The allocation and the marking live in engine.js (SM.buildPaper/SM.paperScore);
   this module owns `EXAM`, the timer and the rendering. Registers
   `window.SMApp.Exam`. */
(function(){
'use strict';
const App=window.SMApp=window.SMApp||{},SM=window.SM;
let EXAM=null,EXAM_TIMER=null;
function start(){
  const items=SM.buildPaper(App.Shell.chapters(),{shuffle:App.Shell.shuffle});
  EXAM={items,revealed:{},marked:{},submitted:false,
        total:items.reduce((a,i)=>a+i.marks,0),
        // The countdown is derived from a wall-clock deadline, never from a
        // decrementing counter: a throttled or backgrounded tab fires the
        // interval late, and decrementing would hand back time the candidate
        // never had. `left` is only the deadline rendered for the UI.
        deadline:Date.now()+180*60*1000,left:180*60};
  clearInterval(EXAM_TIMER);
  EXAM_TIMER=setInterval(tick,1000);
  render();
}
function tick(){
  if(!EXAM||EXAM.submitted)return;
  EXAM.left=Math.max(0,Math.round((EXAM.deadline-Date.now())/1000));
  const el=document.getElementById('examTimer');
  if(el){el.textContent=fmtClock(EXAM.left);el.classList.toggle('calm',EXAM.left>3600)}
  if(EXAM.left<=0){clearInterval(EXAM_TIMER);submit(true)}
}
// Returning to a throttled tab must correct the clock at once, not at the next
// late interval; tick() no-ops when there is no live paper.
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick()});
function fmtClock(s){s=Math.max(0,s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h+':'+String(m).padStart(2,'0')+':'+String(x).padStart(2,'0')}
function render(){
  const el=document.getElementById('panel-exam');
  const ic=App.Shell.icon;
  if(!EXAM){
    el.innerHTML='<div class="an-sec"><h3>'+ic('clock')+' Mock exam — a full '+SM.EXAM_TOTAL+'-mark paper</h3>'+
      '<p style="font-size:13.5px;color:var(--t2);line-height:1.75">A complete paper is assembled from the past questions that have model answers, and it always totals <strong>'+SM.EXAM_TOTAL+' marks</strong> taken in 3 hours. Each chapter contributes as close to its syllabus weight — <strong>8 + 6 + 6 + 6 + 6 + 12 + 6 + 10</strong> — as its pool of answered questions allows; where no set of answers in a chapter adds up to exactly its weight, the chapter contributes the nearest total instead and the breakdown after the paper names it.</p>'+
      '<ul style="font-size:13.5px;color:var(--t2);line-height:1.8;margin:10px 0 10px 20px"><li>Attempt each question on paper first, then reveal the model answer.</li>'+
      '<li>Mark yourself <strong>Got it</strong> or <strong>Missed it</strong> — the score is built from your own honest marking.</li>'+
      '<li>Questions marked as repeated are the ones that actually come back, so they carry the most exam value.</li>'+
      '<li>Take it with the timer running to practise the 3-hour pace.</li></ul>'+
      '<div class="an-btns"><button class="an-btn" onclick="APP.startExam()">'+ic('play')+' Start the 3-hour paper</button></div></div>';
    return;
  }
  const {score,markedCount,byChapter}=SM.paperScore(EXAM.items,EXAM.marked);
  let h='<div class="exam-head">'+
    '<div><div>Mock exam — '+EXAM.items.length+' questions · '+EXAM.total+' marks</div>'+
    '<div style="font-size:12px;color:var(--t3);margin-top:4px">'+(EXAM.submitted?'Paper submitted':'Attempt each question, then reveal and self-mark')+'</div></div>'+
    (EXAM.submitted?'':'<div class="exam-timer" id="examTimer">'+fmtClock(EXAM.left)+'</div>')+'</div>';
  if(EXAM.submitted){
    const pct=Math.round(score/EXAM.total*100);
    const verdict=pct>=70?'Distinction pace — keep this up':(pct>=50?'Solid — review the missed topics':'Needs revision — start with the missed chapters');
    h+='<div class="exam-result"><div class="big">'+score+'/'+EXAM.total+'</div><div class="sub">'+pct+'% self-assessed · '+verdict+'</div></div>';
    h+='<div class="an-sec"><h3>Breakdown by chapter</h3>'+
        '<p style="font-size:12px;color:var(--t3);margin-bottom:10px">Every bar is out of the marks this paper actually set for that chapter, so a chapter you answered perfectly reads 100%. The denominators add up to the '+EXAM.total+' marks above; a chapter that could not reach its syllabus weight carries that weight beside it.</p>';
    byChapter.forEach(({ch,got,avail})=>{
      const weight=SM.EXAM_WEIGHTS[ch-1];
      h+=App.Shell.bar('Ch '+ch+' · '+App.Shell.meta[ch-1].t.slice(0,14),Math.round(got/avail*100),got+'/'+avail+' marks'+(avail===weight?'':' (syllabus '+weight+')'));
    });
    h+='</div><div class="an-btns"><button class="an-btn" onclick="APP.startExam()">'+ic('refresh')+' New paper</button>'+
       '<button class="an-btn" onclick="APP.clearExam()">'+ic('arrowLeft')+' Back</button></div>';
  }
  h+='<div style="margin-top:16px">';
  EXAM.items.forEach((it,idx)=>{
    const rev=EXAM.revealed[idx],mk=EXAM.marked[idx];
    h+='<div class="exam-q"><div class="top"><div class="qt">'+(idx+1)+'. '+App.Shell.esc(it.q.q)+'</div><div class="qm">'+it.marks+' mark'+(it.marks>1?'s':'')+'</div></div>'+
      '<div class="qmeta">Ch '+it.ch+' — '+App.Shell.esc(App.Shell.meta[it.ch-1].t)+' · '+App.Shell.esc(it.q.year)+' · from '+App.Shell.esc(it.q.marks)+' marks in the original paper'+
      (it.repeats>=2?' · asked '+it.repeats+'× in past papers':'')+'</div>';
    if(!rev){
      h+='<div class="exam-actions"><button class="an-btn" onclick="APP.revealExam('+idx+')">'+ic('eye')+' Reveal model answer</button></div>';
    }else{
      h+='<div class="pq-answer-inner" style="border-top:1px solid var(--brd);padding:14px 0 0">'+(it.q.answer||'<em>No model answer.</em>')+'</div>';
      h+='<div class="exam-actions"><span class="exam-marked" style="color:'+(mk===true?'var(--sec-l)':mk===false?'var(--dan-l)':'var(--t3)')+'">'+(mk===true?'marked correct':mk===false?'marked missed':'not self-marked yet')+'</span></div>';
      h+='<div class="exam-actions"><button class="an-btn" onclick="APP.markExam('+idx+',true)">'+ic('check')+' I got this</button>'+
         '<button class="an-btn danger" onclick="APP.markExam('+idx+',false)">'+ic('x')+' I missed this</button></div>';
    }
    h+='</div>';
  });
  h+='</div>';
  if(!EXAM.submitted){
    h+='<div class="an-btns" style="margin-top:8px"><button class="an-btn" onclick="APP.submitExam(false)">'+ic('check')+' Finish and score ('+score+' marks so far, '+markedCount+'/'+EXAM.items.length+' self-marked)</button></div>';
  }
  el.innerHTML=h;
}
function reveal(i){EXAM.revealed[i]=true;render()}
function mark(i,ok){
  EXAM.marked[i]=!!ok;
  const p=App.Progress.state();
  if(ok)p.xp+=2;
  p.examAttempts=(p.examAttempts||0)+1;
  App.Progress.save();App.Progress.updateStats();render();
  if(ok)App.Shell.toast(App.Shell.icon('check')+' +2 XP');
}
function submit(auto){
  EXAM.submitted=true;clearInterval(EXAM_TIMER);
  const score=EXAM.items.reduce((a,i,idx)=>a+(EXAM.marked[idx]?i.marks:0),0);
  const p=App.Progress.state();
  p.examBest=Math.max(p.examBest||0,score);
  p.xp+=10;App.Progress.save();App.Progress.updateStats();render();
  App.Shell.toast((auto?'Time is up — ':'')+'paper scored '+score+'/'+EXAM.total+' · +10 XP');
}
function clear(){clearInterval(EXAM_TIMER);EXAM=null;render()}
App.Exam={start,render,reveal,mark,submit,clear};
})();
