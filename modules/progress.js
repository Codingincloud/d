/* Owns the user's progress — the app's one piece of persisted state
   (localStorage '<course>-progress'), plus the XP/streak bookkeeping, the stats
   readout and export/import/reset.

   Everything else reads it through state() and changes it through
   state() + save(), so this file remains the only place that creates,
   persists or clears it. Registers `window.SMApp.Progress`. */
(function(){
'use strict';
const App=window.SMApp=window.SMApp||{};
/* The record is namespaced per course: the same origin can hold a Simulation
   record and a DCC one, and neither can overwrite the other. */
const NS=(window.COURSE&&window.COURSE.id)||'sm';
const KEY=NS+'-progress';
/* The XP bar is full when every chapter has been read, so both the target and
   the "n/m chapters" readout follow the course rather than the literal 8. */
const N=((window.COURSE&&window.COURSE.meta)||new Array(8)).length || 8;
/* The record is replaced only when there is genuinely no usable one. It used to
   be replaced whenever `xp` was falsy - and `xp` is 0 until the reader marks a
   unit complete, so every reload before the first completed unit threw away the
   streak, the read marks and the saved place. A key check asks "is this a record?",
   which is the question that was meant; a missing or corrupt value still falls back
   to a fresh one instead of breaking the page. */
let progress=null;
try{progress=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){progress=null}
if(!progress||typeof progress!=='object'||Array.isArray(progress)||!('xp' in progress))
  progress={xp:0,done:{},quizzes:0,totalQ:0,correctQ:0,streak:0,lastDay:''};

function state(){return progress}
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
  document.getElementById('xpFill').style.width=Math.min(progress.xp/(N*100)*100,100)+'%';
  document.getElementById('statChap').textContent=doneCount+'/'+N;
  document.getElementById('statQuiz').textContent=progress.quizzes;
  document.getElementById('statPct').textContent=pct+'%';
  document.getElementById('streakBadge').textContent=progress.streak;
  const xpBar=document.getElementById('xpBar');
  if(xpBar)xpBar.setAttribute('aria-valuenow',String(doneCount));
  document.querySelectorAll('.nav-item').forEach(el=>{
    const ci=el.dataset.ch;
    if(progress.done[ci])el.classList.add('done');else el.classList.remove('done');
    el.classList.toggle('progress',!progress.done[ci]&&!!(progress.seen||{})[ci]);
  });
  App.Shell.updateTabBadges();
}
function exportProgress(){
  const data={exported:new Date().toISOString(),progress,version:1};
  const blob=new Blob([JSON.stringify(data,null,1)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);    // Named after the course it came from: the two portals share one shell and one
    // download folder, so "simulation-progress" on a DCC export is a file the reader
    // cannot identify later - and the import is manual, so it has to be identifiable.
    a.download=NS+'-progress-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();a.remove();
  App.Shell.toast(App.Shell.icon('download')+' Progress exported');
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
        // Same test as on load: an exported record with 0 XP is a real record, not a
        // missing one - a reader who exports before completing a unit must get their
        // streak and their quiz scores back, not an empty record.
        if(!progress||typeof progress!=='object'||Array.isArray(progress)||!('xp' in progress))
          progress={xp:0,done:{},quizzes:0,totalQ:0,correctQ:0,streak:0,lastDay:''};
        save();App.Shell.buildNav();updateStats();App.Shell.renderAnalysis();App.Shell.toast(App.Shell.icon('upload')+' Progress imported');
      }catch(err){App.Shell.toast(App.Shell.icon('alert')+' That file could not be read')}
    };
    r.readAsText(f);
  };
  inp.click();
}
function resetProgress(){
  if(!confirm('Reset all progress — XP, completed chapters, quiz scores and streak? This cannot be undone.'))return;
  localStorage.removeItem(KEY);localStorage.removeItem(NS+'-theme');location.reload();
}
App.Progress={state,save,updateStats,exportProgress,importProgress,resetProgress};
})();
