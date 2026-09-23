/* Owns the quiz: the live per-chapter run (`qs`) and its rendering and scoring.
   The score itself comes from engine.js (SM.quizScore); this module owns the
   badges, the completion result and the live state. Registers `window.SMApp.Quiz`. */
(function(){
'use strict';
const App=window.SMApp=window.SMApp||{},SM=window.SM;
let qs={};
function render(cn,questions){
  if(!questions.length){document.getElementById('panel-quiz').innerHTML='<p style="color:var(--t3)">No quiz available.</p>';return;}
  qs={total:questions.length,answered:0,correct:0,answers:{}};
  const ic=App.Shell.icon;
  const L='ABCDEF';
  let h=`<div class="quiz-header"><h3>Chapter ${cn} Quiz</h3><div class="quiz-progress"><div class="progress-bar" role="progressbar" aria-label="Questions answered" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="0" id="qBar"><div class="progress-fill" id="qProg" style="width:0%"></div></div><span class="progress-text" id="qProgT">0/${questions.length}</span></div><div class="quiz-score"><span class="score-badge score-correct" id="sC">${ic('check')} 0</span><span class="score-badge score-wrong" id="sW">${ic('x')} 0</span></div></div>`;
  questions.forEach((q,i)=>{h+=`<div class="quiz-card" id="qc-${i}"><div class="q-number">Question ${i+1} of ${questions.length}</div><div class="q-text">${q.q}</div><div class="q-options">${q.options.map((o,j)=>`<div class="q-option" role="button" tabindex="0" aria-label="Option ${L[j]}: ${o}" onclick="APP.ans(${i},${j})"><span class="opt-letter">${L[j]}</span><span>${o}</span></div>`).join('')}</div><div class="q-explanation" id="qe-${i}"><strong>Why:</strong> ${q.explanation||''}</div></div>`;});
  h+=`<div class="quiz-result" id="quizResult"><div class="big-emoji"></div><div class="result-msg"></div><div class="result-sub"></div><div class="xp-earned"></div></div>`;
  h+=`<button class="quiz-reset" onclick="APP.load(${cn})">${ic('refresh')} Retake this quiz</button>`;
  document.getElementById('panel-quiz').innerHTML=h;
}
function answer(qi,oi){
  const ch=App.Shell.chapters()[App.Shell.cur()];if(!ch||!ch.quiz)return;
  const q=ch.quiz[qi],card=document.getElementById('qc-'+qi);
  if(card.classList.contains('answered-correct')||card.classList.contains('answered-wrong'))return;
  const opts=card.querySelectorAll('.q-option');
  opts.forEach(o=>o.classList.add('disabled'));
  const ok=oi===q.answer;
  opts[oi].classList.add(ok?'correct':'wrong');
  if(!ok)opts[q.answer].classList.add('correct');
  card.classList.add(ok?'answered-correct':'answered-wrong');
  document.getElementById('qe-'+qi).classList.add('show');
  qs.answers=qs.answers||{};qs.answers[qi]=oi;
  const tally=SM.quizScore(ch.quiz,qs.answers);
  qs.answered=tally.answered;qs.correct=tally.correct;qs.total=tally.total;
  const p=App.Progress.state();
  if(ok){p.xp+=2;p.correctQ++;}
  p.totalQ++;App.Progress.save();App.Progress.updateStats();
  document.getElementById('qProg').style.width=(qs.answered/qs.total*100)+'%';
  document.getElementById('qProgT').textContent=qs.answered+'/'+qs.total;
  const qBar=document.getElementById('qBar');
  if(qBar)qBar.setAttribute('aria-valuenow',String(qs.answered));
  const ic=App.Shell.icon;
  document.getElementById('sC').innerHTML=ic('check')+' '+qs.correct;
  document.getElementById('sW').innerHTML=ic('x')+' '+(qs.answered-qs.correct);
  if(ok)App.Shell.toast(ic('check')+' Correct · +2 XP');
  // Check quiz completion
  if(qs.answered===qs.total){
    p.quizzes++;App.Progress.save();App.Progress.updateStats();
    const pct=SM.quizScore(ch.quiz,qs.answers).pct;
    p.chapterQuiz=p.chapterQuiz||{};
    p.chapterQuiz[App.Shell.cur()]={correct:qs.correct,total:qs.total,pct:pct};App.Progress.save();
    const res=document.getElementById('quizResult');
    /* The verdict states what the score means and what to do about it. No
       medal, no star, no congratulations: the number is the feedback, and a
       reader who got 4 of 10 needs the next action more than applause. */
    let sub='';
    if(pct>=90)sub='Every answer on this chapter was right. Move on to the next one.';
    else if(pct>=70)sub='Solid. Re-read the sections behind the ones you missed, then retake this.';
    else if(pct>=50)sub='Half there — the explanations above name what to revise.';
    else sub='Read the chapter through once more before retaking this quiz.';
    res.querySelector('.result-msg').textContent=pct+'%';
    res.querySelector('.result-sub').textContent=sub;
    res.querySelector('.xp-earned').textContent='+'+qs.correct*2+' XP from this quiz';
    res.classList.add('show');
  }
}
App.Quiz={render,answer};
})();
