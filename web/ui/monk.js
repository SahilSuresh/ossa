/* =========================================================
   MONK MODE (Ossa 2.0, Phase 3 "Focus"): a timed focus session with one optional task. Owner: package P3.
   Prefix mm*. Included after halo.js, before heartbeat.js and focus.js.
   Start-up rule: function declarations only, no top-level const or let; state on function
   properties; never redeclare a name that web/ossa.html or another web/ui file declares.

   DATA (S, saved on the phone; dropped by Load demo, Start fresh and Reset, like S.mind)
   S.monk {pre:25|50|90 (the last length picked),
           run:null|{id:start ms, start:ms, plan:min, task?:string ≤80}   running ⇔ !!run. No pause.
           last:null|{id, d (the day it ended), start, end, min, plan, full, xp, base, bonus, capped,
                      task, lv0, lv, up, crystal, cel? (confetti shown), seen (Done tapped)}}
   Minutes and aura live in S.mind.log through aura.js auLogFocus(run, full, now) ONLY (k:'focus',
   src:'monk', deduped on run.id, d = the day it ended). monk.js never pushes to the log itself.
   Everything is computed from timestamps, so a session survives leaving Ossa, a reload or a kill.

   VIEWS (registered with focus.js fcView; full:true, so no tab bar and the Mind header is hidden)
   'monk'         picks from state: running → the timer; a finished session not yet seen → the finish;
                  otherwise the setup. 'monk:setup' | 'monk:timer' | 'monk:done' ask for one.
   'focus'        the setup (the timer while one runs). Keeps mindAction's go:'focus' and old links working.
   Setup: 25 · 50 · 90 with real aura (auPreview), the rules, an optional task, the standing still
   (hlShot 'setup'), Start. A '2 min · test' chip only on localhost or while nvCheck.on.
   Timer: the countdown, the seated still (hlShot 'seated'), Focus today and the Aura level, the quiet
   line, End session (two taps, 3 s to confirm): whole minutes at 1 aura each, no finish bonus.
   Finish: '+N aura' with its breakdown, a level-up line and confetti once, Today so far
   (workouts with RP, breathing, focus), the task, Done (sets last.seen).

   API (for focus.js and shell.js; all safe to call any time)
   mmRun()            the running session {id,start,plan,task?} or null. Side-effect free (drawTabs).
   mmEndAt(r)         its planned end (ms). mmLeft(r): ms left, clamped. mmMin(r,t): whole minutes done.
   mmUnseen()         S.monk.last when finished and not yet seen (the Focus home's 'See your session'), or null
   mmOpen(k?)         open Monk Mode ('setup' | 'timer' | 'done'; default from state), instantly
   mmStart(plan,task) start a session (the setup's button). mmEndEarly(): End session.
   mmCheck(src)       idempotent auto-finish once the time is up (boot, fg, visible, the armed timeout,
                      the timer tick and the route). Never while the page is hidden or between bg and fg,
                      so the time's-up notification still fires.

   HOOKS AND WRAPPERS (include time)
   vxRemind           the time's-up item {at: planned end + 3 s, go:'monk', lead:35000}: no task text, no sound
   vxRemindQuiet      during a session, Ossa's own nudges in [start, end + 3 s] are dropped; the trial
                      notice ('pro') moves to the end + 60 s; 'monk' stays
   vxRoute('monk')    the notification tap: finish if due, then open (a toast only during a live workout)
   vxOn fg/bg/native  the auto-finish on return, and the permission answer's toast at Start
   uiBoot             wrapped: a running session reopens its timer (or finishes) after a reload
   startTour          wrapped: not over a Monk Mode screen (it runs next launch instead)
   Analytics: monk_start{dur}, monk_end{dur,min,full}. Never the task text.
   ========================================================= */

/* ---------- state ---------- */
function mmPres(){ return [25,50,90]; }
function mmOk(r){ return !!r&&typeof r==="object"&&+r.start>0&&+r.plan>=1&&+r.plan<=180; }
function mmRun(){ try{ const m=S.monk; return m&&typeof m==="object"&&mmOk(m.run)?m.run:null; }catch(e){ return null; } }
function mmState(){
  let m=S.monk;
  if(!m||typeof m!=="object"||Array.isArray(m)) m=S.monk={pre:25,run:null,last:null};
  if(!mmPres().includes(+m.pre)) m.pre=25;
  if(!mmOk(m.run)) m.run=null;
  if(!m.last||typeof m.last!=="object"||Array.isArray(m.last)) m.last=null;
  return m;
}
function mmEndAt(r){ r=r||mmRun(); return r?+r.start+Math.round(+r.plan)*60000:0; }
function mmLeft(r){ r=r||mmRun(); if(!r) return 0; return Math.max(0,Math.min(Math.round(+r.plan)*60000,mmEndAt(r)-Date.now())); }
function mmMin(r,t){ r=r||mmRun(); if(!r) return 0; return Math.floor(Math.max(0,Math.min(Math.round(+r.plan)*60000,(+t||Date.now())-r.start))/60000); }
function mmUnseen(){ try{ const L=S.monk&&S.monk.last; return L&&typeof L==="object"&&!L.seen&&+L.min>0?L:null; }catch(e){ return null; } }
function mmLast(){ try{ const L=S.monk&&S.monk.last; return L&&typeof L==="object"&&+L.min>0?L:null; }catch(e){ return null; } }
/* the task: one line, no tags or control characters, at most 80 characters */
function mmTask(t){ return String(t==null?"":t).replace(/[\u0000-\u001f\u007f-\u009f<>]/g," ").replace(/\s+/g," ").trim().slice(0,80); }
function mmEsc(t){ return String(t==null?"":t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function mmClock(ms){ const s=Math.max(0,Math.ceil((+ms||0)/1000)); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); }
/* the 2-minute test length: the preview on this computer, or the Build 9 phone check */
function mmTest(){
  try{ if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return true; }catch(e){}
  try{ return typeof nvCheck==="function"&&!!nvCheck.on; }catch(e){ return false; }
}
function mmPlat(){ try{ return typeof NPLAT==="function"?String(NPLAT()||""):""; }catch(e){ return ""; } }
function mmLv(){ try{ if(typeof auView==="function") return auView().lv; if(typeof auLv==="function") return auLv(); }catch(e){} return 1; }
/* Focus today: today's logged focus minutes plus the running session's whole minutes */
function mmTodayMin(){
  let n=0; try{ if(typeof auToday==="function") n=+auToday().focus.min||0; }catch(e){}
  const r=mmRun(); return n+(r?mmMin(r):0);
}
/* screen state (not saved): {want, pick, draft, arm, armT, said} */
function mmUi(){ return mmUi.s||(mmUi.s={want:"",pick:0,draft:"",arm:false,armT:0,said:""}); }
function mmPick(){ const p=+mmUi().pick; return mmPres().includes(p)||(p===2&&mmTest())?p:mmState().pre; }

/* ---------- the engine ---------- */
function mmStart(plan,task){
  const M=mmState(); if(mmRun()) return mmRun();
  plan=Math.round(+plan); if(!(plan>=1&&plan<=180)) plan=M.pre;
  const now=Date.now(), t=mmTask(task);
  M.run={id:now,start:now,plan}; if(t) M.run.task=t;
  const sk=+mmUi().stake||0; if(sk===20||sk===50) M.run.stake=sk; M.broken=null;
  try{ nsend({t:"lockin",on:true,title:"Your lock-in is breaking",body:"Come back to Ossa in 10 seconds to save it."}); }catch(e){}
  if(mmPres().includes(plan)) M.pre=plan;
  if(M.last) M.last.seen=true;
  const U=mmUi(); U.draft=""; U.pick=0;
  save();   // first: save() resets the sync delay, and the ask below must come after it
  try{ if(NATIVE.on&&NATIVE.caps&&!(NATIVE.rem&&NATIVE.rem.granted)){ mmNative.ask=true; nativeSoon(true); } }catch(e){}
  try{ hap("medium"); }catch(e){}
  try{ track("monk_start",{dur:plan}); }catch(e){}
  mmArm(); try{ drawTabs(); }catch(e){}
  return M.run;
}
/* end the running session (idempotent): full at the planned end, or early with whole minutes.
   Returns S.monk.last, {none:true} when under a minute (nothing logged), or null when nothing was running */
function mmFinish(full,at){
  const M=mmState(), r=M.run; if(!mmOk(r)) return null;
  const end=mmEndAt(r), t=full?end:Math.min(+at||Date.now(),end);
  let out=null; try{ if(typeof auLogFocus==="function") out=auLogFocus(r,!!full,t); }catch(e){ console.warn("Ossa: monk",e); }
  M.run=null; clearTimeout(mmArm.t);
  if(!out||!out.e){
    save(); mmAfter();
    try{ track("monk_end",{dur:Math.round(r.plan),min:0,full:false}); }catch(e){}
    return {none:true,plan:Math.round(r.plan)};
  }
  try{ nsend({t:"lockin",on:false}); }catch(e3){}
  const best0=mmBest(r.id);
  const e=out.e, x=out.r, xp=Math.max(0,Math.floor(+e.xp||0)), min=Math.floor(+e.min||0), lv=x?x.lv:mmLv();
  /* the lock-in extras (19 Oct): a won stake pays 2x, passing your longest pays 15, full sessions clear your eyes */
  let won=0, ghost=0, eyes=0;
  try{ if(full&&+r.stake>0){ won=2*r.stake; auGrant(won,"stake"); }
    if(best0&&min>best0.min){ ghost=15; auGrant(15,"ghost"); }
    if(full){ eyes=+r.plan>=90?10:+r.plan>=50?5:3; if(typeof eyAdd==="function") eyAdd(eyes); }
    if(typeof eyS==="function"){ const E=eyS(); E.back=(+E.back||0)+min; } }catch(e4){ console.warn("Ossa: lock-in extras",e4); }
  M.last={id:r.id,d:e.d,start:+r.start,end:+e.at||t,min,plan:Math.round(+r.plan),full:!!e.full,xp,
    base:x?x.base:Math.min(xp,min),bonus:x?x.bonus:Math.max(0,xp-min),capped:!!(x?x.capped:e.capped),
    task:typeof e.task==="string"?e.task:"",lv0:x?x.lv0:lv,lv,up:!!(x&&x.up),crystal:!!(x&&x.crystal),seen:false,stake:+r.stake||0,won,ghost,eyes};
  save(); mmAfter();
  try{ track("monk_end",{dur:M.last.plan,min,full:M.last.full}); }catch(e2){}
  return M.last;
}
/* after the end: the phone drops the time's-up notification now (the list no longer has it), the dot goes */
function mmAfter(){ try{ nativeSync(false); }catch(e){} try{ drawTabs(); }catch(e){} }
function mmEndEarly(){
  if(!mmRun()) return;
  const L=mmFinish(false,Date.now());
  try{ hap("warning"); }catch(e){}
  if(!L||L.none){ try{ toast("Ended. Under a minute, so nothing logged."); }catch(e){} mmShow("setup"); return; }
  mmShow("done");
}
/* the time is up: finish (once) and show it. Not while hidden: the notification fires, and the way back finishes */
function mmCheck(src){
  const r=mmRun(); if(!r) return false;
  const end=mmEndAt(r);
  if(Date.now()<end){ mmArm(); return false; }
  if(document.hidden||mmCheck.bg) return false;
  const here=mmHere(), home=!here&&typeof MIND!=="undefined"&&MIND.open&&MIND.view==="home";
  const L=mmFinish(true,end); if(!L||L.none) return false;
  if(here||home){ mmCheer(); mmShow("done"); return true; }
  if((src==="boot"||src==="open")&&mmCanOpen()){ mmOpen("done"); return true; }
  try{ toast(`Lock-in done · ${L.xp>0?`+${L.xp} aura`:"logged"}. It's waiting in Focus.`); }catch(e){}
  return true;
}
/* one timeout for the planned end (the tick only runs while the timer shows) */
function mmArm(){
  clearTimeout(mmArm.t); const r=mmRun(); if(!r) return;
  mmArm.t=setTimeout(()=>{ try{ mmCheck("timer"); }catch(e){ console.warn("Ossa: monk",e); } },Math.min(2147000000,mmLeft(r)+300));
}
/* a big finish: a short bell cascade and a long haptic, so the end of a Study/Focus/Offline session is unmissable
   (22 Oct, Sahil: "I want a big sound making sure they know it's ended"). Honours S.mind.ui.sound=false. */
function mmCheer(){
  try{ hap("success"); }catch(e){}
  try{ Pulse.buzz&&Pulse.buzz([40,90,40,90,40,90,80]); }catch(e){}
  try{
    const off=S.mind&&S.mind.ui&&S.mind.ui.sound===false;
    if(off||typeof Pulse==="undefined"||!Pulse.chime) return;
    if(Pulse.audio) Pulse.audio();
    /* a C-E-G-C arpeggio over ~0.9 s, then a brighter top note (indexes map to C5/E5/G5/C6/E6 in Pulse.chime's scale) */
    const notes=[0,2,3,5,4], gaps=[0,180,360,560,820];
    notes.forEach((n,i)=>setTimeout(()=>{ try{ Pulse.chime(n); }catch(e){} },gaps[i]));
    setTimeout(()=>{ try{ Pulse.audio&&Pulse.audio(); Pulse.chime&&Pulse.chime(5); }catch(e){} },1200);   // one more peal on top
  }catch(e){}
}
/* can a finish screen open over whatever is showing? Never over the intro, a story, the tour or a live workout */
function mmCanOpen(){
  try{
    const a=document.getElementById("app");
    if(!S.body||!a||["onboarding","storying","touring"].some(c=>a.classList.contains(c))) return false;
    return !(typeof TR!=="undefined"&&TR.view==="active");
  }catch(e){ return false; }
}
/* a Monk Mode screen is showing */
function mmHere(){ try{ return !!(MIND.open&&/^(monk|focus)(:|$)/.test(String(MIND.view))&&document.querySelector("#mind .mm-v")); }catch(e){ return false; } }
/* open Monk Mode on the screen k ('setup' | 'timer' | 'done'; default from state), instantly */
function mmOpen(k){
  if(k) mmUi().want=k;
  try{
    if(typeof MIND!=="undefined"&&MIND.open){ mindGo("monk"); return; }
    if(typeof uiFocusOpen==="function"){ uiFocusOpen("monk"); return; }
    MIND.next="monk"; openMind();
  }catch(e){ console.warn("Ossa: monk open",e); }
}
function mmShow(k){ mmOpen(k); }
function mmBoot(){
  mmReg();
  if(!S.monk||typeof S.monk!=="object") return;
  const r=mmState().run; if(!r) return;
  if(+r.start>Date.now()+60000){ r.start=Date.now(); save(); }   // the clock went back: count from now
  if(Date.now()>=mmEndAt(r)){ mmCheck("boot"); return; }
  mmArm();
  if(mmCanOpen()) mmOpen("timer");   // a reload mid-session looks like a crash: put the timer back
}
/* the notification tap (ossa://monk) */
function mmRoute(){
  mmCheck.bg=0;
  const r=mmRun(); if(r&&Date.now()>=mmEndAt(r)) mmFinish(true,mmEndAt(r));
  if(typeof TR!=="undefined"&&TR.view==="active"){
    const L=mmUnseen();
    try{ toast(mmRun()?`Lock-in · ${Math.ceil(mmLeft()/60000)} min left. It's in Focus.`:L?`Lock-in done · ${L.xp>0?`+${L.xp} aura`:"logged"}. It's in Focus.`:"Lock in is in Focus."); }catch(e){}
    try{ drawTabs(); }catch(e){}
    return true;
  }
  mmOpen(); return true;
}

/* ---------- reminders ---------- */
function mmRemind(){
  const out=[], r=mmRun(), M=S.monk||{}, d=M.defer, now=Date.now();
  /* a trial notice the session held back keeps coming until its new time has passed (even after the session ends) */
  if(d){ if(+d.at>now+31000) out.push(Object.assign({},d)); else if(+d.at<now) M.defer=null; }
  if(r) out.push({at:mmEndAt(r)+3000,go:"monk",lead:35000,title:"Time's up",body:`${Math.round(r.plan)} minute lock-in done. Tap for your aura.`});
  return out;
}
function mmQuiet(l){
  const r=mmRun(); if(!r||!Array.isArray(l)) return l;
  const a=+r.start, b=mmEndAt(r)+3000;
  return l.map(n=>{
    if(!n) return null;
    const g=String(n.go||"").split(":")[0], at=+n.at;
    if(g==="monk"||!(at>=a&&at<=b)) return n;
    if(g==="pro"){   // the trial notice waits for the end: saved, so mmRemind keeps it after the session too
      const M=S.monk||(S.monk={}); if(!M.defer) M.defer={at:mmEndAt(r)+60000,go:n.go,title:n.title,body:n.body,lead:n.lead};
      return null; }
    return null;
  }).filter(Boolean);
}
/* the answer to the permission ask at Start replaces the legacy 'Nudges on…' toast */
function mmNative(m){
  if(!m||m.t!=="remind"||!m.asked||!mmNative.ask) return;
  mmNative.ask=false;
  try{ toast(m.granted?"We'll tell you when time's up.":"Notifications are off for Ossa. The timer still runs."); }catch(e){}
}

/* ---------- the views ---------- */
function mmIc(k){
  const P={x:'<svg viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
    back:'<svg viewBox="0 0 24 24"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>',
    clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7.8v4.6l3 1.9"/></svg>',
    crown:'<svg viewBox="0 0 24 24"><path d="M4 8.5l4.2 3.8L12 6l3.8 6.3L20 8.5l-1.6 9.5H5.6z"/></svg>',
    star:'<svg class="f" viewBox="0 0 24 24"><path d="M12 3.5 14.4 9l5.9.5-4.5 3.9 1.4 5.8L12 16.1l-5.2 3.1 1.4-5.8L3.7 9.5 9.6 9z"/></svg>',
    focus:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>',
    train:'<svg viewBox="0 0 24 24"><path d="M3 9.5v5M6 7v10M18 7v10M21 9.5v5M6 12h12"/></svg>',
    breath:'<svg viewBox="0 0 24 24"><path d="M3 9h10.5a2.75 2.75 0 1 0-2.75-2.75M3 13.5h14a2.5 2.5 0 1 1-2.5 2.5M3 18h6"/></svg>'};
  return P[k]||"";
}
/* one live line for screen readers: start, end and finish only (the countdown itself is never announced) */
function mmSay(t){ const el=document.getElementById("mmSr"); if(!el) return; el.textContent=""; setTimeout(()=>{ if(el.isConnected) el.textContent=t; },60); }
function mmRender(b,v){
  b=b||document.getElementById("mindBody"); if(!b) return;
  const U=mmUi(), parts=String(v||"monk").split(":"), want=parts[1]||U.want||""; U.want="";
  mmTickStop(); clearTimeout(U.armT); U.arm=false;
  const m=document.getElementById("mind"); if(m) m.classList.add("mm-on");
  const r=mmRun(), L=mmLast();
  let k="setup";
  if(r) k="timer";
  else if(S.monk&&S.monk.broken&&!S.monk.broken.seen) k="broken";
  else if(want==="done"&&L) k="done";
  else if(want==="setup"||want==="timer"||parts[0]==="focus") k="setup";
  else if(mmUnseen()) k="done";
  mmRender.k=k;
  if(k==="timer") mmTimer(b,r); else if(k==="broken") mmBrokenView(b,S.monk.broken); else if(k==="done") mmDoneView(b,L); else mmSetup(b);
}
function mmLeave(){
  mmTickStop(); const U=mmUi(); clearTimeout(U.armT); U.arm=false;
  const m=document.getElementById("mind"); if(m) m.classList.remove("mm-on");
  const i=document.getElementById("mmTask"); if(i&&document.activeElement===i) i.blur();
}
function mmReg(){
  if(typeof fcView!=="function") return false;
  try{
    fcView("monk",{render:(b,M,v)=>mmRender(b,v||"monk"),leave:mmLeave,full:true});
    fcView("focus",{render:(b)=>mmRender(b,"focus"),leave:mmLeave,full:true});
    return true;
  }catch(e){ console.warn("Ossa: monk views",e); return false; }
}

/* setup: pick a length, read the rules, name the task, start */
function mmSetup(b){
  mmState(); const U=mmUi(), pick=mmPick(), test=mmTest();
  const pv=k=>{ try{ return typeof auPreview==="function"?auPreview("monk",k):null; }catch(e){ return null; } };
  const tile=k=>{ const p=pv(k);
    return `<button class="mm-dur" data-mm="${k}" aria-pressed="${k===pick}" aria-label="${k} minutes${p?p.xp>0?`, plus ${p.xp} aura if you finish`:", today's lock-in aura is used up":""}"><b class="u-num">${k}</b><small>min</small>${p?`<em>${mmEsc(p.txt)}</em>`:""}</button>`; };
  const note=(()=>{ try{ if(!NATIVE.on||!NATIVE.rem) return "";
    return NATIVE.rem.granted?`<p class="mm-note">Ossa will tell you when time's up.</p>`:`<p class="mm-note">Allow notifications and Ossa tells you when time's up. The timer runs either way.</p>`; }catch(e){ return ""; } })();
  b.innerHTML=`<div class="mm-v mm-setup">
    <div class="mm-top"><button class="u-back mm-x" id="mmX" aria-label="Back to Focus">‹ Focus</button><span class="u-eyebrow mm-eye">Deep work</span><span></span></div>
    <div class="mm-fig mm-fig-up" id="mmFig" aria-hidden="true"></div>
    <h1 class="u-impact mm-h">Lock in</h1>
    <p class="mm-line">Leave Ossa and the session breaks.</p>
    <div class="mm-durs" role="group" aria-label="Session length">${mmPres().map(tile).join("")}</div>
    <div class="mm-stake" role="group" aria-label="Stake">${[0,20,50].map(k=>`<button class="mm-sk" data-sk="${k}" aria-pressed="${(+U.stake||0)===k}"><b>${k?`${k} aura`:"None"}</b><small>${k?`win ${2*k}`:"no risk"}</small></button>`).join("")}</div>
    ${(()=>{ const B=mmBest(); return B?`<p class="mm-ghost">Your longest lock-in: <b>${B.min} min</b> on ${B.day}. Go past it for +15 aura.</p>`:""; })()}
    ${test?`<button class="u-chip mm-test" data-mm="2" aria-pressed="${pick===2}">2 min · test</button>`:""}
    <div class="mm-f"><label class="u-sr" for="mmTask">What are you working on? Optional</label>
      <input class="mm-in" id="mmTask" type="text" maxlength="80" enterkeyhint="done" autocomplete="off" autocapitalize="sentences" placeholder="What are you working on? (optional)" value="${mmEsc(U.draft)}"></div>
    <div class="mm-foot"><button class="u-btn cyan block mm-go" id="mmGo">Start lock-in</button></div>
    <p class="mm-rule1">${mmPlat()==="android"?"Turn on Do Not Disturb":"Turn on a Focus"} · no pause · end early and you keep the minutes</p>${note}
    <p class="u-sr" aria-live="polite" id="mmSr"></p>
  </div>`;
  b.querySelectorAll("[data-mm]").forEach(x=>x.onclick=()=>{
    U.pick=+x.dataset.mm; try{ hap("select"); }catch(e){}
    b.querySelectorAll("[data-mm]").forEach(y=>y.setAttribute("aria-pressed",String(y===x)));
  });
  b.querySelectorAll("[data-sk]").forEach(x=>x.onclick=()=>{ U.stake=+x.dataset.sk; try{ hap("select"); }catch(e){} b.querySelectorAll("[data-sk]").forEach(y=>y.setAttribute("aria-pressed",String(y===x))); });
  const inp=document.getElementById("mmTask");
  inp.oninput=()=>{ U.draft=inp.value.slice(0,80); };
  inp.onkeydown=e=>{ if(e.key==="Enter"){ e.preventDefault(); inp.blur(); } };
  document.getElementById("mmX").onclick=()=>{ try{ Pulse.buzz(6); }catch(e){} mindGo("home"); };
  document.getElementById("mmGo").onclick=()=>{
    if(inp===document.activeElement) inp.blur();
    if(!mmStart(mmPick(),inp.value)) return;
    mmShow("timer");
    setTimeout(()=>mmSay(`Lock-in started. ${Math.round(mmRun()?mmRun().plan:0)} minutes.`),120);
  };
  mmLotus(0);
}

/* the timer: computed from timestamps every second while it shows */
function mmTimer(b,r){
  const task=typeof r.task==="string"?r.task:"";
  b.innerHTML=`<div class="mm-v mm-timer">
    <div class="mm-top"><button class="u-back mm-x" id="mmX" aria-label="Back to Focus. The timer keeps going">‹ Focus</button><span class="mm-pill"><i aria-hidden="true"></i>Lock-in · on</span><span></span></div>
    <div class="mm-clock" role="timer" aria-label="Time left"><b class="u-num" id="mmLeft">${mmClock(mmLeft(r))}</b><span class="u-eyebrow">Left of ${Math.round(r.plan)} min</span></div>
    <div class="mm-fig mm-fig-seat" id="mmFig" aria-hidden="true"></div>
    ${task?`<p class="mm-task"><span>Working on</span>${mmEsc(task)}</p>`:""}
    <div class="mm-tiles">
      <div class="mm-tile"><span class="mm-ti" aria-hidden="true">${mmIc("clock")}</span><span><small>Focus today</small><b><span id="mmToday">${mmTodayMin()}</span> min</b></span></div>
      <div class="mm-tile"><span class="mm-ti" aria-hidden="true">${mmIc("crown")}</span><span><small>Aura level</small><b>${mmLv()}</b></span></div>
    </div>
    <p class="mm-stat" id="mmStat">${mmStatus(mmFrac(r))}</p>
    <p class="mm-leave"><b>If you leave:</b> the session breaks${+r.stake>0?`, you lose ${r.stake} aura`:""} and your eyes cool by 5.</p>
    <button class="u-btn primary block mm-end" id="mmEnd">End session</button>
    <p class="mm-endn" id="mmEndN" aria-hidden="true"></p>
    <p class="u-sr" aria-live="polite" id="mmSr"></p>
  </div>`;
  document.getElementById("mmX").onclick=()=>{ try{ Pulse.buzz(6); }catch(e){} mindGo("home"); };
  document.getElementById("mmEnd").onclick=mmEndTap;
  mmLotus(mmFrac(r)); mmTickGo(); mmArm();
}
function mmEndTap(){
  const U=mmUi(), btn=document.getElementById("mmEnd"), r=mmRun(); if(!btn||!r) return;
  if(!U.arm){
    U.arm=true; try{ hap("light"); }catch(e){}
    const n=mmMin(r);
    btn.classList.add("arm");
    const note=n>=1?`You keep ${n} min. No finish bonus.`:"Under a minute: nothing is logged.";
    btn.textContent="Tap again to end"; btn.setAttribute("aria-label",`Tap again to end. ${note}`);
    const en=document.getElementById("mmEndN"); if(en) en.textContent=note;   /* the detail under the button, so it never overflows */
    clearTimeout(U.armT);
    U.armT=setTimeout(()=>{ U.arm=false; const b2=document.getElementById("mmEnd"); if(b2){ b2.classList.remove("arm"); b2.textContent="End session"; b2.removeAttribute("aria-label"); } const en2=document.getElementById("mmEndN"); if(en2) en2.textContent=""; },3000);
    return;
  }
  clearTimeout(U.armT); U.arm=false; mmEndEarly();
}
/* the digits, on each whole second; Focus today once a minute */
function mmTickGo(){
  mmTickStop();
  if(document.hidden||!document.getElementById("mmLeft")||!mmRun()) return;
  const step=()=>{
    const el=document.getElementById("mmLeft"), r=mmRun();
    if(!el||!r||document.hidden){ mmTickGo.t=0; return; }
    const left=mmLeft(r); el.textContent=mmClock(left);
    if(left<=0){ mmTickGo.t=0; mmCheck("timer"); return; }
    mmLotusSet(mmFrac(r)); const so=document.getElementById("mmStat"); if(so){ const st=mmStatus(mmFrac(r)); if(so.textContent!==st) so.textContent=st; }
    const n=mmMin(r); if(n!==mmTickGo.n){ mmTickGo.n=n; const t=document.getElementById("mmToday"); if(t) t.textContent=String(mmTodayMin()); }
    mmTickGo.t=setTimeout(step,(left%1000||1000)+30);
  };
  step();
}
function mmTickStop(){ clearTimeout(mmTickGo.t); mmTickGo.t=0; }

/* the finish: what it earned, today so far, the task */
function mmWhy(L){
  let cap=400; try{ if(typeof auRules==="function") cap=auRules().mk.cap; }catch(e){}
  if(L.xp<=0) return L.capped?`You've had today's ${cap} lock-in aura.`:"";
  if(L.capped) return `That takes you to today's lock-in max of ${cap} aura.`;
  if(L.full) return `${L.base} for the minutes, ${L.bonus} for finishing.`;
  return "1 aura a minute. Ending early skips the finish bonus.";
}
function mmRows(L){
  let T=null; try{ if(typeof auToday==="function") T=auToday(L.d); }catch(e){}
  const pl=(n,w)=>`${n} ${w}${n===1?"":"s"}`;
  const row=(ic,c,t,s,v)=>`<div class="mm-row" style="--c:var(${c})"><span class="mm-ri" aria-hidden="true">${mmIc(ic)}</span><span class="mm-rt"><b>${mmEsc(t)}</b><small>${mmEsc(s)}</small></span>${v?`<em>${mmEsc(v)}</em>`:"<span></span>"}</div>`;
  const out=[row("focus","--cyan","Lock-in",`${L.min} min · ${L.full?"finished":"ended early"}`,L.xp>0?`+${L.xp} aura`:"")];
  if(T){
    (T.workouts||[]).forEach(w=>out.push(row("train","--glow",w.title,(w.sets>0?pl(w.sets,"set")+" · ":"")+`${w.mins} min`,w.rp>0?`+${w.rp} RP`:"")));
    if(T.breath&&T.breath.n>0) out.push(row("breath","--cyan","Breathing",`${pl(T.breath.n,"session")} · ${T.breath.min} min`,T.breath.xp>0?`+${T.breath.xp} aura`:""));
    const fn=(T.focus.n||0)-1, fm=Math.max(0,(T.focus.min||0)-L.min), fx=Math.max(0,(T.focus.xp||0)-L.xp);
    if(fn>0) out.push(row("focus","--cyan","Lock-ins, earlier",`${pl(fn,"session")} · ${fm} min`,fx>0?`+${fx} aura`:""));
  }
  return {html:out.join(""),xp:T?+T.xp||0:0};
}
function mmDoneView(b,L){
  const U=mmUi(), full=!!L.full, el=Math.round(((+L.end||0)-(+L.start||0))/1000);
  const secs=full?L.plan*60:Math.max(L.min*60,Math.min(L.plan*60,el>0?el:0));
  const title=full?`Done. ${L.plan} minutes.`:`${L.min} minute${L.min===1?"":"s"} in.`;
  let V=null; try{ if(typeof auView==="function") V=auView(); }catch(e){}
  const lvl=L.up?`<p class="mm-up">New level · Aura level ${L.lv}${L.crystal?" · Crystalline aura":""}</p>`:V?`<p class="mm-lv">${mmEsc(V.line)}</p>`:"";
  const R=mmRows(L), today=L.d===dkey(0), why=mmWhy(L);
  b.innerHTML=`<div class="mm-v mm-done">
    <div class="mm-head"><span class="u-eyebrow mm-eye">${full?"Session complete":"Ended early"}</span><h1 class="mm-title">${mmEsc(title)}</h1></div>
    <div class="mm-ring" role="img" aria-label="${Math.floor(secs/60)} minutes ${secs%60} seconds of focus"><i class="d1"></i><i class="d2"></i><i class="d3"></i><b class="u-num">${mmClock(secs*1000)}</b><span>Focus time</span></div>
    <div class="mm-xp"><span class="mm-xpp${L.xp>0?"":" none"}">${mmIc("star")}${L.xp>0?`+${L.xp} aura`:"No aura"}</span>${why?`<p class="mm-why">${mmEsc(why)}</p>`:""}${lvl}</div>
    ${(L.won||L.ghost||L.eyes)?`<div class="mm-extra">${L.won?`<span>Stake won · +${L.won} aura</span>`:""}${L.ghost?`<span>Past your longest · +15 aura</span>`:""}${L.eyes?`<span>Eyes +${L.eyes}</span>`:""}</div>`:""}
    <div class="u-section-h mm-sh"><span class="u-eyebrow">${today?"Today so far":"That day"}</span>${R.xp>0?`<span class="mm-tot">${R.xp} aura</span>`:""}</div>
    <div class="mm-rows">${R.html}</div>
    ${L.task?`<p class="mm-did"><span>You worked on</span>${mmEsc(L.task)}</p>`:""}
    <p class="mm-said">${full?"One thing, start to finish. That's how your aura grows.":"Some focus beats none. The minutes still count."}</p>
    <div class="mm-foot"><button class="u-btn primary block" id="mmDone">Done</button>${full?`<button class="u-link mm-share" id="mmShare">Share it</button>`:""}</div>
    <p class="u-sr" aria-live="polite" id="mmSr"></p>
  </div>`;
  document.getElementById("mmDone").onclick=()=>{
    try{ Pulse.buzz(6); }catch(e){}
    const M=mmState(); if(M.last) M.last.seen=true; save();
    mindGo("home");
  };
  const sh=document.getElementById("mmShare"); if(sh) sh.onclick=()=>{ try{ Pulse.buzz(6); mmShareCard(L); }catch(e){ console.warn(e); } };
  if(U.said!==String(L.id)){ U.said=String(L.id); mmSay(`${full?"Session complete":"Ended early"}. ${L.xp>0?`${L.xp} aura.`:""}`); }
  if(L.up){
    try{ if(typeof auSeen==="function") auSeen(); }catch(e){}
    if(!L.cel){
      L.cel=1; save();
      const host=b.querySelector(".mm-done"), ring=b.querySelector(".mm-ring");
      setTimeout(()=>{ try{ if(host&&host.isConnected&&typeof fxConfetti==="function"){
        const hr=host.getBoundingClientRect(), rr=ring?ring.getBoundingClientRect():null;
        fxConfetti(host,{y:rr&&hr.height?Math.max(0.05,Math.min(0.6,(rr.top+rr.height/2-hr.top)/hr.height)):0.25,count:90,colors:["--cyan","--cta","--glow-soft"]}); } }catch(e){} },reduced?0:320);
    }
  }
}

/* the body still for a view: the last one at once (no flash), then a fresh one after the first paint */
/* ---------- the lotus (Andrej, 17 Oct): instead of a human, a lotus that opens one petal per twelfth of the
   session, with a breathing orb at its centre (in 5.5 s, out 5.5 s). The petals change at most 12 times a session;
   the orb is a composited CSS transform, so the long timer stays cheap. Reduced motion: everything still. */
function mmLotusN(){ return 12; }
function mmFrac(r){ const p=Math.max(1,+r.plan||25)*60000; return Math.max(0,Math.min(1,1-mmLeft(r)/p)); }
function mmLotus(frac){
  const el=document.getElementById("mmFig"); if(!el) return;
  const n=mmLotusN(), petal="M0 0 C 14 -22, 14 -52, 0 -72 C -14 -52, -14 -22, 0 0Z";
  let g=""; for(let i=0;i<n;i++) g+=`<g transform="rotate(${(i*360/n).toFixed(1)})"><path class="mm-pt" data-i="${i}" d="${petal}"/></g>`;
  el.classList.add("mm-lot"); el.classList.remove("flat","on");
  el.innerHTML=`<svg class="mm-lotus" viewBox="-100 -100 200 200" aria-hidden="true">${g}</svg><span class="mm-orbw" aria-hidden="true"><i class="mm-orbr"></i><i class="mm-orb"></i></span>`;
  mmLotusSet.k=-1; mmLotusSet(frac);
}
function mmLotusSet(frac){
  const n=mmLotusN(), open=Math.max(0,Math.min(n,Math.floor((+frac||0)*n+1e-6)));
  if(open===mmLotusSet.k) return; mmLotusSet.k=open;
  /* a balanced order (top, bottom, sides, then the gaps), so the flower stays symmetric while it fills */
  const order=[0,6,3,9,1,7,4,10,2,8,5,11], rank={}; order.forEach((pi,k)=>{ rank[pi]=k; });
  document.querySelectorAll("#mmFig .mm-pt").forEach(p=>p.classList.toggle("on",rank[+p.dataset.i]<open));
}
function mmFig(kind){
  const el=document.getElementById("mmFig"); if(!el) return;
  const c=mmFig.c||(mmFig.c=[]), sz=()=>[Math.round(el.clientWidth),Math.round(el.clientHeight)];
  const put=url=>{ el.innerHTML=`<img alt="" src="${url}">`; el.classList.add("on"); el.classList.remove("flat"); };
  { const [w,h]=sz(), hit=c.find(x=>x.k===kind+w+"x"+h); if(hit) put(hit.url); }
  const tok=mmFig.tok=(mmFig.tok||0)+1;
  const go=n=>{
    if(n===0){ if(mmFig.ran===tok) return; mmFig.ran=tok; }
    if(!el.isConnected||mmFig.tok!==tok) return;
    const [w,h]=sz(); let url=null;
    try{ if(typeof hlShot==="function"&&w>=40&&h>=40) url=hlShot(kind,{w,h}); }catch(e){ console.warn("Ossa: monk still",e); }
    if(url){
      const k=kind+w+"x"+h, i=c.findIndex(x=>x.k===k), old=i>=0?c.splice(i,1)[0]:null;
      c.unshift({k,url}); if(c.length>3) c.length=3;
      if(!old||old.url!==url||!el.querySelector("img")) put(url);
      return;
    }
    if(n<1){ setTimeout(()=>go(1),300); return; }
    if(!el.querySelector("img")) el.classList.add("flat");   // no WebGL: a soft cyan glow instead
  };
  const t=setTimeout(()=>go(0),150);
  requestAnimationFrame(()=>{ clearTimeout(t); setTimeout(()=>go(0),0); });
}

/* ---------- the lock-in (19 Oct, Focus lab) ---------- */
/* your longest session before this one: {min, day} or null */
function mmBest(exceptId){
  try{ const L=(S.mind&&S.mind.log||[]).filter(l=>l&&l.k==="focus"&&+l.min>0&&String(l.id)!==String(exceptId)); if(!L.length) return null;
    const b=L.reduce((a,x)=>+x.min>+a.min?x:a); return {min:+b.min,day:new Date(b.d+"T12:00:00").toLocaleDateString("en-GB",{weekday:"short"})}; }catch(e){ return null; }
}
function mmStatus(f){ return f<0.25?"Eyes are recovering. Phone face down.":f<0.5?"Attention returning.":f<0.8?"Most people quit around here. Keep going.":"Almost there."; }
/* back from the background: more than 10 s away (and before the end) breaks the session. iOS "inactive" never counts */
function mmBreakCheck(m){
  const r=mmRun(); if(!r||!m||m.from!=="background") return;
  const away=+m.away||0, left=(+m.at||Date.now())-away; if(away<=10000) return;
  if(left>=mmEndAt(r)) return;   // the time was already up when you left: that's a finish
  const min=Math.max(0,Math.floor((left-r.start)/60000)), M=mmState();
  let lost=0; try{ if(+r.stake>0) lost=auraLose(r.stake,{floor:true,src:"stake"}).lost; }catch(e){}
  let eyes=null; try{ if(typeof eyAdd==="function"){ eyAdd(-5); eyes=eyS().score; } }catch(e){}
  M.run=null; clearTimeout(mmArm.t); M.broken={at:left,min,plan:Math.round(r.plan),stake:+r.stake||0,lost,eyes,seen:false};
  save(); mmAfter(); try{ nsend({t:"lockin",on:false}); }catch(e){} try{ track("lockin_break",{min,stake:+r.stake||0}); }catch(e){}
  try{ hap("error"); }catch(e){}
  if(mmCanOpen()) mmOpen("broken");
}
function mmBrokenView(b,X){
  b.innerHTML=`<div class="mm-v mm-broken">
    <div class="mm-head"><span class="u-eyebrow mm-eye mm-red">Session broken</span><h1 class="mm-title">You left at ${X.min} min</h1></div>
    <div class="mm-fig mm-fig-seat" id="mmFig" aria-hidden="true"></div>
    <p class="mm-said">${X.lost?`−${X.lost} aura. `:""}${X.eyes!=null?`Eyes cooled to ${X.eyes}. `:""}Your streak is safe.</p>
    <div class="mm-foot"><button class="u-btn cyan block" id="mmAgain">Try again</button><button class="u-link" id="mmBack">Back to Focus</button></div></div>`;
  const seen=()=>{ const M=mmState(); if(M.broken) M.broken.seen=true; save(); };
  document.getElementById("mmAgain").onclick=()=>{ seen(); Pulse.buzz(8); mmShow("setup"); };
  document.getElementById("mmBack").onclick=()=>{ seen(); Pulse.buzz(6); mindGo("home"); };
  mmLotus(0);
}
/* the share card: 1080x1920 on the starfield, only what you did */
function mmShareCard(L){
  const c=document.createElement("canvas"); c.width=1080; c.height=1920; const g=c.getContext("2d");
  const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim()||"white";
  g.fillStyle=css("--bg"); g.fillRect(0,0,1080,1920);
  for(let i=0;i<160;i++){ g.globalAlpha=0.2+((i*37)%60)/100; g.fillStyle=css("--text-2"); g.beginPath(); g.arc((i*173)%1080,(i*311)%1920,(i%4?1.2:2.4),0,7); g.fill(); }
  g.globalAlpha=1; g.textAlign="center";
  let day=1; try{ const W=S.workouts||[], f=(S.mind&&S.mind.log||[])[0], d0=(W[0]&&W[0].d)||(f&&f.d); if(d0) day=Math.max(1,Math.round((Date.now()-new Date(d0+"T12:00:00").getTime())/864e5)+1); }catch(e){}
  g.fillStyle=css("--cyan"); g.font="800 40px Inter, sans-serif"; g.fillText(`OSSA · DAY ${day}`,540,520);
  g.fillStyle=css("--text-1"); g.font="italic 900 300px Inter, sans-serif"; g.fillText(String(L.min),540,860);
  g.font="800 56px Inter, sans-serif"; g.fillText("minutes",540,950);
  g.fillStyle=css("--text-2"); g.font="600 52px Inter, sans-serif"; g.fillText("Locked in, phone down.",540,1060);
  try{ const E=eyS(), t=eyTier(E.score); g.fillStyle=css("--text-1"); g.font="800 48px Inter, sans-serif"; g.fillText(`Eyes ${E.score} · ${t.n}`,540,1220); }catch(e){}
  g.fillStyle=css("--glow"); g.font="900 64px Inter, sans-serif"; g.fillText(`+${(+L.xp||0)+(+L.won||0)+(+L.ghost||0)} aura`,540,1330);
  if(typeof cdShareImage==="function") cdShareImage(c,"ossa-lock-in.png"); else toast("Sharing isn't ready yet.");
}

/* ---------- wiring (include time) ---------- */
try{ mmReg(); }catch(e){ console.warn("Ossa: monk views",e); }
vxRemind(mmRemind);
vxRemindQuiet(mmQuiet);
vxRoute("monk",mmRoute);
vxOn("native",mmNative);
vxOn("bg",()=>{ mmCheck.bg=Date.now(); mmTickStop(); });
vxOn("fg",m=>{ try{ mmBreakCheck(m); }catch(e){ console.warn("Ossa: lock-in break",e); } });
vxOn("fg",()=>{ mmCheck.bg=0; try{ mmCheck("fg"); }catch(e){ console.warn(e); } if(mmRun()&&mmHere()) mmTickGo(); });
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){ mmTickStop(); return; }
  try{ if(!mmCheck.bg) mmCheck("visible"); }catch(e){ console.warn(e); }
  if(mmRun()&&mmHere()) mmTickGo();
});
(()=>{
  const _b=uiBoot;
  uiBoot=function(){ const r=_b.apply(this,arguments); try{ mmBoot(); }catch(e){ console.warn("Ossa: monk boot",e); } return r; };
  if(typeof startTour==="function"){ const _t=startTour; startTour=function(){ if(mmHere()) return; return _t.apply(this,arguments); }; }
})();
