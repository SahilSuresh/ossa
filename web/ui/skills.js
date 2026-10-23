/* =========================================================
   SESSION SKILLS: the Focus tab (20 Oct, Andrej: "make it like a level up progression … for study sessions and
   focus sessions and also productive/away from phone sessions", and a difficulty picked in the intro).
   LEVELS-SPEC.md from the Focus redesign thread. Prefix lu*. Function declarations only, state on function props.
   - Three skills, each with a level and a rank: study, focus, off (Offline: only face-down minutes count).
     S.skills = {study:{lv,xp,min}, focus, off}; S.diff = easy|normal|hard|night; S.sessStreak = {days,last,chk,forg}.
     need(n) = round((100+25n) × M), M 0.5 / 1 / 2.5 / 5. Ranks E 1–4, D 5–9, C 10–19, B 20–34, A 35–49, S 50+.
   - A session is a lock-in (monk.js) with run.lu = {type, xp, min, face}: +3 XP a minute, live; +50% on a full
     finish; ×1.2 with a 3-day streak. Leaving (the lock-in break rule) costs by difficulty; so does a missed day.
   - Sessions give no aura any more (aura is discipline only: bones.js / BONES-SPEC.md); the daily streak gives it.
   - Views: the Focus home (fcHome wrapper), "road" (rank roads), "rank" (the old Rank page, now off Body), and the
     lock-in timer, finish and broken screens when the run is a session (mmTimer, mmDoneView, mmBrokenView wrappers).
   ========================================================= */
function luTypes(){ return {
  study:{n:"Study",c:"--sk-study",verb:"Start study",task:"What are you studying?",titles:["Reader","Scribe","Rune-reader","Lorekeeper","Archivist","Oracle"],
    status:["Reading. Phone out of reach.","Recall beats rereading.","Most people quit here. Keep going.","Almost there."],
    unl:["Plain bone","A rune on the forehead","Glyphs across the temples","Runes orbiting the head","A crown of light","A third eye"]},
  focus:{n:"Focus",c:"--sk-focus",verb:"Start focus",task:"What are you working on?",titles:["Glance","Gaze","Locked","Piercer","Hawkeye","All-Seeing"],
    status:["One task. Nothing else.","Attention is locking in.","Most people quit here. Keep going.","Almost there."],
    unl:["Dim eyes","Lime eyes","Cyan eyes with trails","Burning eyes","Eyes of light","Void eyes"]},
  off:{n:"Offline",c:"--sk-off",verb:"Go offline",task:"What are you doing instead?",titles:["Online","Muted","Unplugged","Off-grid","Ghost","Unreachable"],
    status:["Phone face down. Be somewhere.","The feed can wait.","Most people pick it up here. Don't.","Almost there."],
    unl:["No shadow","A purple floor shadow","An after-image","Smoke wisps","A phantom double","Phantom form"]}}; }
function luKeys(){ return ["study","focus","off"]; }
function luDiffs(){ return {
  easy:{n:"Easy",c:"--d-easy",m:0.5,t:"×0.5 XP",dur:[10,25,50],d:"Levels come twice as fast. 10-min sessions. Leaving keeps your XP. 2 missed days a week forgiven.",leave:"you keep the XP you've earned."},
  normal:{n:"Normal",c:"--d-normal",m:1,t:"×1 XP",dur:[25,50,90],d:"The default. Leaving a session loses the finish bonus. A missed day resets your streak.",leave:"you keep the minutes, but lose the finish bonus."},
  hard:{n:"Hard",c:"--d-hard",m:2.5,t:"×2.5 XP",dur:[25,50,90],d:"Leaving loses the session and 100 XP. Skip a day and lose 100 XP. Gold badge.",leave:"you lose this session's XP and 100 more."},
  night:{n:"Nightmare",c:"--d-night",m:5,t:"×5 XP",dur:[50,90,120],d:"50 min minimum. Leaving costs a level. Skip one day and every skill drops a level. Red badge and title.",leave:"you lose a level in this skill."}}; }
function luDiff(){ const k=S.diff; return luDiffs()[k]?k:"normal"; }
function luS(){
  let seed=0;
  if(!S.skills||typeof S.skills!=="object"){ S.skills={};
    /* existing users: every lock-in minute already logged counts as Focus (Normal pace), nothing is lost */
    try{ (S.mind&&Array.isArray(S.mind.log)?S.mind.log:[]).forEach(l=>{ if(l&&l.k==="focus") seed+=Math.max(0,+l.min||0); }); }catch(e){}
    if(!S.diff) S.diff="normal"; }
  luKeys().forEach(k=>{ const x=S.skills[k]; if(!x||typeof x!=="object") S.skills[k]={lv:1,xp:0,min:0}; else { x.lv=Math.max(1,Math.floor(+x.lv||1)); x.xp=Math.max(0,Math.floor(+x.xp||0)); x.min=Math.max(0,+x.min||0); } });
  if(!S.sessStreak||typeof S.sessStreak!=="object") S.sessStreak={days:0,last:null};
  if(!S.sess||typeof S.sess!=="object") S.sess={log:[]}; if(!Array.isArray(S.sess.log)) S.sess.log=[];
  if(seed>0){ const x=S.skills.focus; x.min=seed; x.xp=3*seed; while(x.xp>=luNeed(x.lv)){ x.xp-=luNeed(x.lv); x.lv++; } try{ save(); }catch(e){} }
  return S.skills;
}
function luUi(){ return luUi.s||(luUi.s={cur:null,mins:{},sheet:false}); }
function luCur(){ const u=luUi(); if(!u.cur) u.cur=(S.sess&&luTypes()[S.sess.type])?S.sess.type:"study"; return u.cur; }
function luNeed(n){ return Math.round((100+25*Math.max(1,n))*luDiffs()[luDiff()].m); }
/* E D C B A S → 0..5, with I / II / III by thirds inside a rank */
function luRanks(){ return [["E",1,4],["D",5,9],["C",10,19],["B",20,34],["A",35,49],["S",50,999]]; }
function luRank(lv){ const R=luRanks(); let i=0; R.forEach((r,j)=>{ if(lv>=r[1]) i=j; }); return i; }
function luTitle(k,lv){
  const T=luTypes()[k], i=luRank(lv), r=luRanks()[i], span=i===5?30:(r[2]-r[1]+1), step=Math.min(2,Math.floor((lv-r[1])/Math.max(1,span/3)));
  return `${luDiff()==="night"?"Nightmare ":""}${T.titles[i]} ${["I","II","III"][step]}`;
}
function luStreak(){ const s=luS()&&S.sessStreak; return s.last===dkey(0)||s.last===dkey(1)?(+s.days||0):0; }
function luMult(){ return luStreak()>=3?1.2:1; }
/* add (or take) XP; levels follow. Easy and Normal never lose a level */
function luAdd(k,n){
  const x=luS()[k], lv0=x.lv; x.xp+=Math.round(n);
  while(x.xp>=luNeed(x.lv)){ x.xp-=luNeed(x.lv); x.lv++; }
  const can=luDiff()==="hard"||luDiff()==="night";
  while(x.xp<0){ if(can&&x.lv>1){ x.lv--; x.xp+=luNeed(x.lv); } else { x.xp=0; } }
  return {lv0,lv:x.lv};
}
function luLevelDown(k,n){ const x=luS()[k], lv0=x.lv; x.lv=Math.max(1,x.lv-n); x.xp=Math.min(x.xp,luNeed(x.lv)-1); return lv0-x.lv; }
/* the daily streak: a day counts on a finished session or the nightly report. It pays aura (discipline) */
function luDay(){
  luS(); const s=S.sessStreak, t=dkey(0); if(s.last===t) return false;
  s.days=s.last===dkey(1)?(+s.days||0)+1:1; s.last=t;
  try{ auGrant(10,"daily streak"); const ms={7:50,30:200,100:500}[s.days]; if(ms) auGrant(ms,`${s.days}-day streak`); }catch(e){}
  save(); return true;
}
/* a missed day, checked once a day on open: what it costs depends on the difficulty */
function luMissCheck(){
  luS(); const s=S.sessStreak, t=dkey(0); if(s.chk===t) return; s.chk=t;
  if(!s.last||s.last>=dkey(1)){ save(); return; }
  let missed=0; for(let i=2;i<400&&dkey(i)>=s.last;i++) missed++;
  missed=Math.max(1,missed); const d=luDiff(), K=luKeys(); let down=null;
  if(d==="easy"){ const wk=luWeek(), f=s.forg&&s.forg.wk===wk?s.forg:(s.forg={wk,n:0});
    if(missed<=2-f.n){ f.n+=missed; s.last=dkey(1); } else s.days=0; }
  else { s.days=0;
    if(d==="hard"){ const m=Math.min(3,missed); down={xp:100*m,lv:K.map(k=>{ const r=luAdd(k,-100*m); return r.lv<r.lv0?k:null; }).filter(Boolean)}; }
    if(d==="night"){ const m=Math.min(3,missed); down={lv:K.filter(k=>luLevelDown(k,m)>0),n:m}; } }
  if(down) S.sess.down=Object.assign({at:Date.now(),d,missed},down);
  save();
}
function luWeek(){ const d=new Date(); d.setDate(d.getDate()-((d.getDay()+6)%7)); return d.toISOString().slice(0,10); }
function luDurs(){ return luDiffs()[luDiff()].dur; }
function luMins(){ const u=luUi(), D=luDurs(); let m=+u.mins[luCur()]; if(!m||m<5||m>240) m=D.includes(50)?50:D[1]; return m; }
function luCustom(k){ const u=luUi(); return +((u.custom||{})[k])||0; }
function luIsPreset(m){ return luDurs().includes(+m); }
function luPreview(m){ return Math.round(m*3*1.5*luMult()); }
function luCol(k){ return `var(${luTypes()[k].c})`; }
function luHex(k,lv,cls){ const T=luTypes()[k]; return `<span class="lu-hex ${cls||""}" style="--c:${luCol(k)}"><span><small>${T.n.toUpperCase()} LV</small><b>${lv}</b></span></span>`; }
function luBadge(){ const D=luDiffs()[luDiff()]; return `<span class="lu-mode" style="--dc:var(${D.c})">${D.n.toUpperCase()}</span>`; }

/* ---------- starting a session: a lock-in with run.lu ---------- */
function luStart(k,mins,task){
  if(typeof mmStart!=="function") return;
  try{ mmUi().stake=0; }catch(e){}
  const r=mmStart(mins,task||""); if(!r) return;
  r.lu={type:k,xp:0,min:0,face:0,faceAt:0}; S.sess.type=k; S.sess.mins=mins; S.sess.task=task||"";
  luUi().mins[k]=mins; save();
  if(k==="off"){ luFace.down=null; luFace.need=true; try{ nsend({t:"face",on:true}); }catch(e){} }
  try{ track("session_start",{k,mins,d:luDiff()}); }catch(e){}
  mindGo("monk");
}
/* face down or not (native/face.js through App.js); with no sensor every minute counts */
function luFace(){ return luFace.down; }
function luFaceDown(){ return luFace.ok===false||luFace.down!==false; }
/* every second while a session runs: count its minutes and pay their XP live */
function luTick(){
  const r=typeof mmRun==="function"?mmRun():null; if(!r||!r.lu) return;
  const L=r.lu, now=Date.now();
  let min;
  if(L.type==="off"){ const dt=L.faceAt?Math.min(5000,now-L.faceAt):0; L.faceAt=now; if(luFaceDown()) L.face=(+L.face||0)+dt; min=Math.min(Math.round(r.plan),Math.floor(L.face/60000)); }
  else min=mmMin(r);
  if(min>L.min){ const add=Math.round(3*(min-L.min)*luMult()), x=luAdd(L.type,add); L.xp+=add; L.min=min; luS()[L.type].min+=0; save(); luLive(x); }
  else luLive(null);
}
/* ---------- the views ---------- */
function luHome(b){
  luS(); luMissCheck(); const T=luTypes(), k=luCur(), t=T[k], x=S.skills[k], ri=luRank(x.lv), R=luRanks(), nx=R[ri+1], need=luNeed(x.lv);
  const st=luStreak(), mins=luMins(), down=S.sess.down;
  b.innerHTML=`<div class="u-screen lu" style="--c:${luCol(k)}">
    <header class="lu-top"><div><div class="u-eyebrow">${uiShortDate()}</div><h1 class="u-h1">Focus</h1></div>
      <div class="lu-tr">${luBadge()}${st?`<span class="lu-chip lu-fire">🔥 ${st}d${st>=3?" ×1.2":""}</span>`:""}<button class="lu-more" id="luMore" aria-label="More: Eyes, Breathe, Check in, Learn">⋯</button></div></header>
    ${down?`<button class="lu-down" id="luDown"><b>LEVEL DOWN</b><span>${down.d==="night"?`Missed ${down.missed} day${down.missed>1?"s":""}: every skill dropped a level.`:`Missed ${down.missed} day${down.missed>1?"s":""}: −${down.xp} XP on each skill.`}</span></button>`:""}
    <div class="lu-skills" role="tablist">${luKeys().map(j=>{ const y=S.skills[j]; return `<button class="lu-sk${j===k?" on":""}" data-k="${j}" role="tab" aria-selected="${j===k}" style="--c:${luCol(j)}"><b>${T[j].n}</b><small>LV ${y.lv} · ${R[luRank(y.lv)][0]}</small><i><em style="width:${(y.xp/luNeed(y.lv)*100).toFixed(1)}%"></em></i></button>`; }).join("")}</div>
    <div class="lu-hero" id="luHero"><canvas id="luCv" aria-hidden="true"></canvas>
      ${luHex(k,x.lv)}
      <span class="lu-rank">${R[ri][0]}-RANK</span>
      <h2 class="lu-title${luDiff()==="night"?" night":""}">${luTitle(k,x.lv)}</h2>
      <div class="lu-xp"><i><em style="width:${(x.xp/need*100).toFixed(1)}%"></em></i><span><small>XP</small><b>${x.xp} / ${need}</b></span></div>
      <button class="lu-next" id="luRoad">${nx?`Next rank: <b>${nx[0]}-Rank ${t.titles[ri+1]}</b> at LV ${nx[1]} ›`:"Top rank. Hold it ›"}</button>
    </div>
    <div class="lu-durs">${luDurs().map(m=>`<button data-m="${m}" class="${m===mins?"on":""}"><b>${m}</b><small>+${luPreview(m)} XP</small></button>`).join("")}${(()=>{ const cm=luCustom(k), onCust=!luIsPreset(mins); const n=onCust?mins:cm; return `<button data-cust="1" class="lu-cust${onCust?" on":""}">${n?`<b>${n}m</b><small>+${luPreview(n)} XP</small>`:`<b>Custom</b><small>Pick</small>`}</button>`; })()}</div>
    <button class="lu-go" id="luGo">${t.verb} · ${mins} min <small>+${luPreview(mins)} XP</small></button>
  </div>`;
  b.querySelectorAll("[data-k]").forEach(e=>e.onclick=()=>{ Pulse.buzz(6); luUi().cur=e.dataset.k; luHome(b); });
  b.querySelectorAll("[data-m]").forEach(e=>e.onclick=()=>{ Pulse.buzz(5); luUi().mins[k]=+e.dataset.m; luHome(b); });
  const cust=b.querySelector("[data-cust]"); if(cust) cust.onclick=()=>{ Pulse.buzz(6); luDurAsk(k,b); };
  $("luGo").onclick=()=>{ Pulse.buzz([10,40,14]); luTaskAsk(k,mins); };
  $("luRoad").onclick=()=>{ Pulse.buzz(6); luUi().road=k; mindGo("road"); };
  $("luMore").onclick=()=>{ Pulse.buzz(6); luSheet(); };
  if($("luDown")) $("luDown").onclick=()=>{ S.sess.down=null; save(); luHome(b); };
  luCanvas($("luCv"),k);
}
/* the task, asked once before the timer starts (optional, editable during it) */
function luTaskAsk(k,mins){
  const T=luTypes()[k]; let s=$("luAsk"); if(s) s.remove();
  s=document.createElement("div"); s.id="luAsk"; s.className="lu-sheet";
  s.innerHTML=`<div class="lu-sh-bg" data-x="1"></div><div class="lu-sh" style="--c:${luCol(k)}"><span class="u-eyebrow">${T.n} · ${mins} min</span>
    <input class="lu-task" id="luTaskIn" maxlength="80" placeholder="${T.task}" value="${uiEsc(S.sess.type===k&&S.sess.task||"")}" enterkeyhint="go">
    <button class="lu-go" id="luTaskGo">${T.verb} · ${mins} min</button><button class="u-link" id="luTaskSkip">Skip the task</button></div>`;
  $("app").appendChild(s); requestAnimationFrame(()=>s.classList.add("on"));
  const go=(t)=>{ s.remove(); luStart(k,mins,t); };
  $("luTaskGo").onclick=()=>go($("luTaskIn").value.trim());
  $("luTaskSkip").onclick=()=>go("");
  $("luTaskIn").onkeydown=e=>{ if(e.key==="Enter") go(e.target.value.trim()); };
  $("luTaskIn").onfocus=()=>luKbScroll($("luTaskIn"));   // iOS keyboard covers the Go button otherwise (22 Oct)
  s.querySelector(".lu-sh-bg").onclick=()=>s.remove();
}
/* custom minutes: a stepper sheet, 5-240 by 5; remembers the last pick per skill (22 Oct) */
function luDurAsk(k,home){
  const u=luUi(), T=luTypes()[k];
  const start=luCustom(k)||(luIsPreset(luMins())?50:luMins())||50;
  let s=$("luDurSh"); if(s) s.remove();
  s=document.createElement("div"); s.id="luDurSh"; s.className="lu-sheet";
  s.innerHTML=`<div class="lu-sh-bg" data-x="1"></div><div class="lu-sh" style="--c:${luCol(k)}"><span class="u-eyebrow">${T.n} · Custom minutes</span>
    <div class="lu-dur-row"><button class="lu-dur-step" data-d="-5" aria-label="Less">−</button>
      <input class="lu-dur-in u-num" id="luDurIn" type="number" min="5" max="240" step="5" inputmode="numeric" value="${start}">
      <button class="lu-dur-step" data-d="5" aria-label="More">+</button></div>
    <p class="lu-dur-note" id="luDurPrev">+${luPreview(start)} XP · 5 to 240 minutes</p>
    <button class="lu-go" id="luDurGo">Set ${start} min</button></div>`;
  $("app").appendChild(s); requestAnimationFrame(()=>s.classList.add("on"));
  const inp=$("luDurIn"), prev=$("luDurPrev"), go=$("luDurGo");
  const clip=v=>{ let n=Math.round((+v||0)/5)*5; if(!n||isNaN(n)) n=50; return Math.max(5,Math.min(240,n)); };
  const upd=v=>{ const n=clip(v); if(+inp.value!==n) inp.value=n; prev.textContent=`+${luPreview(n)} XP · 5 to 240 minutes`; go.textContent=`Set ${n} min`; };
  s.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{ Pulse.buzz(5); upd((+inp.value||start)+(+b.dataset.d)); });
  inp.oninput=()=>{ const n=+inp.value; if(n>=5&&n<=240){ prev.textContent=`+${luPreview(n)} XP · 5 to 240 minutes`; go.textContent=`Set ${n} min`; } };
  inp.onblur=()=>upd(inp.value);
  inp.onfocus=()=>luKbScroll(inp);
  const close=()=>s.remove();
  go.onclick=()=>{ const n=clip(inp.value); u.custom=u.custom||{}; u.custom[k]=n; u.mins[k]=n; close(); Pulse.buzz(6); if(home) luHome(home); };
  s.querySelector(".lu-sh-bg").onclick=close;
}
/* ⋯ : everything else the old Focus tab held */
function luSheet(){
  let s=$("luSh"); if(s) s.remove();
  s=document.createElement("div"); s.id="luSh"; s.className="lu-sheet";
  const rows=[["eyes","Eyes","Today's directives and screen time"],["breath","Breathe","Box, even, long exhale, 4-7-8"],["checkin","Check in","Mood and energy"],["learn","Learn","Three-minute lessons"],["more","How it works","Levels, difficulty and aura"]];
  s.innerHTML=`<div class="lu-sh-bg" data-x="1"></div><div class="lu-sh"><span class="u-eyebrow">More</span>
    ${rows.map(([g,t,d])=>`<button class="lu-row" data-g="${g}"><b>${t}</b><small>${d}</small></button>`).join("")}</div>`;
  $("app").appendChild(s); requestAnimationFrame(()=>s.classList.add("on"));
  s.onclick=e=>{ const r=e.target.closest("[data-g]"); if(r){ const g=r.dataset.g; s.remove(); Pulse.buzz(6);
      if(g==="learn") return uiGo("explore");
      return mindGo(g); }
    if(e.target.dataset.x) s.remove(); };
}
/* the session screen (the lock-in timer, dressed for the skill) */
function luTimer(b,r){
  const L=r.lu, T=luTypes()[L.type], x=luS()[L.type], D=luDiffs()[luDiff()];
  b.innerHTML=`<div class="u-screen lu lu-run" style="--c:${luCol(L.type)}"><i class="mm-v" hidden></i>
    <div class="lu-rt"><span class="lu-chip lu-skc">● ${T.n.toUpperCase()} · LV <b id="luRLv">${x.lv}</b></span>${luMult()>1?`<span class="lu-chip lu-fire">🔥 ×1.2</span>`:""}</div>
    <div class="lu-hero lu-runhero"><canvas id="luCv" aria-hidden="true"></canvas>
      <b class="lu-tm u-num" id="mmLeft" role="timer">${mmClock(mmLeft(r))}</b><span class="u-eyebrow">Left of ${Math.round(r.plan)} min</span>
      <b class="lu-gain" id="luGain">+${L.xp} XP</b>
      <div class="lu-xp"><i><em id="luXb" style="width:${(x.xp/luNeed(x.lv)*100).toFixed(1)}%"></em></i><span><small id="luLvl">LV ${x.lv}</small><b id="luXt">${x.xp} / ${luNeed(x.lv)}</b></span></div>
      <p class="lu-status" id="luSt">${T.status[0]}</p>
      ${L.type==="off"?`<span class="lu-face" id="luFace">▼ Face down · counting</span>`:""}
    </div>
    <input class="lu-task" id="luTask" maxlength="80" placeholder="${T.task}" value="${uiEsc(r.task||"")}">
    <p class="lu-warn"><b>If you leave:</b> ${D.leave}</p>
    <button class="lu-end" id="mmEnd">End early</button><p class="mm-endn" id="mmEndN" aria-hidden="true"></p><p class="u-sr" aria-live="polite" id="mmSr"></p>
  </div>`;
  $("luTask").onchange=e=>{ const t=mmTask(e.target.value); r.task=t; S.sess.task=t; save(); };
  $("luTask").onfocus=()=>luKbScroll($("luTask"));   // iOS keyboard covers it otherwise (22 Oct)
  $("mmEnd").onclick=luEndTap;
  luCanvas($("luCv"),L.type); mmTickGo(); mmArm(); luLive(null);
}
/* legacy: Focus's three inputs now go through the global uiKb (web/ui/kb.js). Kept as a thin wrapper so older
   callers (and the mid-session task input) still work without a rebuild everywhere. */
function luKbScroll(el){ if(typeof uiKbFocus==="function") return uiKbFocus(el); try{ el&&el.scrollIntoView({block:"center",behavior:"smooth"}); }catch(e){} }
function luEndTap(){
  const U=mmUi(), btn=$("mmEnd"), r=mmRun(); if(!btn||!r) return;
  if(!U.arm){ U.arm=true; btn.classList.add("arm"); btn.textContent="Tap again to end"; const n=$("mmEndN"); if(n) n.textContent="You keep the minutes. No finish bonus.";
    clearTimeout(U.armT); U.armT=setTimeout(()=>{ U.arm=false; const b2=$("mmEnd"); if(b2){ b2.classList.remove("arm"); b2.textContent="End early"; } const n2=$("mmEndN"); if(n2) n2.textContent=""; },3000); return; }
  clearTimeout(U.armT); U.arm=false;
  const L=mmFinish(false,Date.now());
  if(!L||L.none){ try{ toast("Ended. Under a minute, so nothing counted."); }catch(e){} mindGo("home"); return; }
  mmShow("done");
}
/* live bits on the session screen: XP, the bar, a level-up flash, the status line, face down */
function luLive(x){
  const r=mmRun(); if(!r||!r.lu||!$("luGain")) return;
  const L=r.lu, T=luTypes()[L.type], s=luS()[L.type];
  $("luGain").textContent=`+${L.xp} XP`; $("luXt").textContent=`${s.xp} / ${luNeed(s.lv)}`; $("luXb").style.width=(s.xp/luNeed(s.lv)*100).toFixed(1)+"%"; $("luLvl").textContent=`LV ${s.lv}`; $("luRLv").textContent=s.lv;
  const p=1-mmLeft(r)/(r.plan*60000), st=T.status[Math.min(3,Math.floor(p*4))]; if($("luSt").textContent!==st) $("luSt").textContent=st;
  if(x&&x.lv>x.lv0){ const h=document.querySelector(".lu-runhero"); if(h){ h.classList.remove("flash"); void h.offsetWidth; h.classList.add("flash"); } try{ hap("success"); }catch(e){ Pulse.buzz([10,40,14]); } luCanvas.burst=3; }
  else if(x) luCanvas.burst=1;
  const f=$("luFace"); if(f){ const dn=luFaceDown(); f.classList.toggle("up",!dn); f.textContent=dn?"▼ Face down · counting":"▲ Put it back face down"; }
}
/* the finish: LEVEL UP or SESSION COMPLETE, the three tiles, share and the rank road */
function luDone(b,L){
  const U=L.lu, k=U.type, T=luTypes()[k], x=luS()[k], R=luRanks(), up=U.lv>U.lv0, rk=U.rk>U.rk0, st=luStreak();
  b.innerHTML=`<div class="u-screen lu lu-fin" style="--c:${luCol(k)}"><i class="mm-v" hidden></i>
    <div class="lu-rt"><button class="u-back" id="luBack">‹ Focus</button>${luBadge()}</div>
    <div class="lu-hero"><canvas id="luCv" aria-hidden="true"></canvas>
      <span class="lu-rank">${T.n.toUpperCase()} · ${L.full?"SESSION COMPLETE":"ENDED EARLY"}</span>
      ${up?`<h2 class="lu-big">Level up</h2>`:`<h2 class="lu-big sm">+${U.xp+U.bonus} XP</h2>`}
      ${rk?`<span class="lu-rkup">RANK UP · ${R[U.rk][0]} · ${uiEsc(T.unl[U.rk])}</span>`:""}
      ${luHex(k,x.lv,"sm")}
      <span class="lu-rank">${R[luRank(x.lv)][0]}-RANK · ${luTitle(k,x.lv)}</span>
      <div class="lu-xp"><i><em style="width:${(x.xp/luNeed(x.lv)*100).toFixed(1)}%"></em></i><span><small>XP</small><b>${x.xp} / ${luNeed(x.lv)}</b></span></div>
    </div>
    <div class="lu-loot">
      <div><b style="color:${luCol(k)}">+${U.xp+U.bonus}</b><small>${T.n} XP${U.bonus?` · +${U.bonus} bonus`:""}</small></div>
      <button id="luDoneT" aria-pressed="${!!U.done}"><b>${L.min}m</b><small>${U.task?uiEsc(U.task)+" · ":""}${U.done?"Done ✓":"Not done"}</small></button>
      <div><b>🔥 ${st}</b><small>Day${st===1?"":"s"} in a row</small></div></div>
    <button class="lu-go" id="luShare">Share · ${T.n} LV ${x.lv}</button>
    <button class="lu-ghost" id="luSeeRoad">See rank road</button>
  </div>`;
  $("luBack").onclick=()=>{ Pulse.buzz(6); mindGo("home"); };
  $("luDoneT").onclick=()=>{ U.done=!U.done; const e=S.sess.log.find(l=>l.at===U.at); if(e) e.done=U.done; save(); luDone(b,L); };
  $("luShare").onclick=()=>luShare(k);
  $("luSeeRoad").onclick=()=>{ luUi().road=k; mindGo("road"); };
  if(L.seen!==true){ L.seen=true; save(); luCanvas.burst=up?4:2; try{ if(up){ hap("success"); Pulse.chime&&Pulse.chime(5); } }catch(e){} }
  luCanvas($("luCv"),k);
}
/* a broken session: what this difficulty took */
function luBroken(b,X){
  const k=X.lu.type, T=luTypes()[k], D=luDiffs()[luDiff()];
  b.innerHTML=`<div class="u-screen lu lu-fin" style="--c:${luCol(k)}"><i class="mm-v" hidden></i>
    <div class="lu-rt"><span class="lu-chip lu-red">SESSION BROKEN</span>${luBadge()}</div>
    <div class="lu-hero"><canvas id="luCv" aria-hidden="true"></canvas>
      <h2 class="lu-big sm red">You left at ${X.min} min</h2>
      <p class="lu-said">${X.lu.lost?`${uiEsc(X.lu.lost)}. `:""}${D.n} mode: ${D.leave}</p>
      ${luHex(k,luS()[k].lv,"sm")}</div>
    <button class="lu-go" id="luAgain">Try again</button><button class="lu-ghost" id="luBk">Back to Focus</button></div>`;
  const seen=()=>{ const M=mmState(); if(M.broken) M.broken.seen=true; save(); };
  $("luAgain").onclick=()=>{ seen(); luUi().cur=k; mindGo("home"); };
  $("luBk").onclick=()=>{ seen(); mindGo("home"); };
  luCanvas($("luCv"),k);
}
/* the rank road for one skill (tabs for all three), and the way to the muscle ranks */
function luRoad(b){
  luS(); const k=luUi().road||luCur(), T=luTypes(), t=T[k], x=S.skills[k], R=luRanks(), ci=luRank(x.lv);
  b.innerHTML=`<div class="u-screen lu lu-road" style="--c:${luCol(k)}">
    <div class="lu-rt"><button class="u-back" id="luBack">‹ ${luUi().fromBody?"Body":"Focus"}</button>${luBadge()}</div>
    <h1 class="u-h1">Rank road</h1>
    <div class="lu-skills">${luKeys().map(j=>`<button class="lu-sk${j===k?" on":""}" data-k="${j}" style="--c:${luCol(j)}"><b>${T[j].n}</b><small>LV ${S.skills[j].lv} · ${R[luRank(S.skills[j].lv)][0]}</small></button>`).join("")}</div>
    <ol class="lu-steps">${R.map((r,i)=>`<li class="lu-step${i<ci?" done":i===ci?" cur":""}"><i>${r[0]}</i><span><b>${t.titles[i]}</b><small>${uiEsc(t.unl[i])}</small></span><em>LV ${r[1]}${r[2]<999?"–"+r[2]:"+"}</em></li>`).join("")}</ol>
    <button class="u-link lu-musc" id="luMusc">Muscle ranks and unlocks ›</button>
    <button class="lu-go" id="luRoadGo">${t.verb} · ${luMins()} min</button></div>`;
  b.querySelectorAll("[data-k]").forEach(e=>e.onclick=()=>{ Pulse.buzz(5); luUi().road=e.dataset.k; luRoad(b); });
  $("luBack").onclick=()=>{ Pulse.buzz(6); if(luUi().fromBody){ luUi().fromBody=false; uiGo("today"); } else mindGo("home"); };
  $("luMusc").onclick=()=>{ Pulse.buzz(6); mindGo("rank"); };
  $("luRoadGo").onclick=()=>{ luUi().cur=k; luUi().fromBody=false; mindGo("home"); };
}
/* the hero's glow: the skill's colour, three slow hex outlines, rising sparks */
function luCanvas(cv,k){
  if(!cv) return; const g=cv.getContext("2d"); if(!g) return;
  const size=()=>{ const r=cv.getBoundingClientRect(), d=Math.min(2,devicePixelRatio||1); cv.width=Math.max(1,r.width*d); cv.height=Math.max(1,r.height*d); g.setTransform(d,0,0,d,0,0); return r; };
  let R=size(); const col=(typeof fxTok==="function"?fxTok(luTypes()[k].c):"white"), rgb=luRgb(col), ps=[];
  cancelAnimationFrame(luCanvas.raf); clearTimeout(luCanvas.nap);
  /* off screen (another tab: #mind is display:none) it naps, checking twice a second, instead of drawing 60 times a second (perf, 21 Oct) */
  const f=t=>{ if(!cv.isConnected){ return; } if(document.hidden||cv.offsetParent===null){ luCanvas.nap=setTimeout(()=>{ luCanvas.raf=requestAnimationFrame(f); },500); return; }
    if(Math.abs(cv.clientWidth-R.width)>1||Math.abs(cv.clientHeight-R.height)>1) R=size();   /* first drawn while the panel opened */
    const W=R.width, H=R.height, cx=W/2, cy=H*0.42, b=1+Math.sin(t/1100)*0.04; g.clearRect(0,0,W,H); if(W<2||H<2){ luCanvas.raf=requestAnimationFrame(f); return; }
    const gr=g.createRadialGradient(cx,cy,10,cx,cy,150*b); gr.addColorStop(0,`rgba(${rgb},.28)`); gr.addColorStop(1,`rgba(${rgb},0)`); g.fillStyle=gr; g.fillRect(0,0,W,H);   // token-ok: the skill token's own colour, as rgb
    g.strokeStyle=`rgba(${rgb},.18)`; g.lineWidth=1;   // token-ok: the skill token's own colour, as rgb
    for(let i=0;i<3;i++){ const rr=(80+i*26)*b; g.beginPath(); for(let j=0;j<=6;j++){ const a=Math.PI/6+j*Math.PI/3+(reduced?0:t/(9000+i*3000)*(i%2?-1:1)), x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr; j?g.lineTo(x,y):g.moveTo(x,y); } g.stroke(); }
    if(!reduced){ const bu=luCanvas.burst||0, n=bu?30:1; for(let i=0;i<n&&ps.length<120;i++) ps.push({x:cx+(Math.random()-.5)*(bu?60:200),y:cy+(bu?0:60),vx:(Math.random()-.5)*(bu?4:.3),vy:-(.4+Math.random()*(bu?3:.8)),l:0}); luCanvas.burst=Math.max(0,bu-1);
      for(let i=ps.length-1;i>=0;i--){ const p=ps[i]; p.l+=.012; p.x+=p.vx; p.y+=p.vy; if(p.l>=1){ ps.splice(i,1); continue; } g.fillStyle=`rgba(${rgb},${((1-p.l)*.9).toFixed(2)})`; g.beginPath(); g.arc(p.x,p.y,1.7,0,7); g.fill(); } }   // token-ok: the skill token's own colour, as rgb
    luCanvas.raf=requestAnimationFrame(f); };
  luCanvas.raf=requestAnimationFrame(f);
}
function luRgb(c){ const m=/^#?([0-9a-f]{6})$/i.exec(String(c).trim()); if(!m) return "255,255,255"; const n=parseInt(m[1],16); return `${n>>16&255},${n>>8&255},${n&255}`; }
/* the share card: skill, level, title, rank, the mode badge, minutes */
function luShare(k){
  const c=document.createElement("canvas"); c.width=1080; c.height=1920; const g=c.getContext("2d"), tk=v=>typeof fxTok==="function"?fxTok(v):"white";
  const T=luTypes()[k], x=luS()[k], col=tk(T.c), D=luDiffs()[luDiff()];
  g.fillStyle=tk("--bg"); g.fillRect(0,0,1080,1920);
  const gr=g.createRadialGradient(540,760,40,540,760,620); gr.addColorStop(0,`rgba(${luRgb(col)},.35)`); gr.addColorStop(1,`rgba(${luRgb(col)},0)`); g.fillStyle=gr; g.fillRect(0,0,1080,1920);   // token-ok: the skill token's own colour, as rgb
  g.textAlign="center"; g.fillStyle=col; g.font="800 44px Inter, sans-serif"; g.fillText(`OSSA · ${T.n.toUpperCase()}`,540,420);
  g.beginPath(); for(let j=0;j<6;j++){ const a=-Math.PI/2+j*Math.PI/3, X=540+Math.cos(a)*230, Y=760+Math.sin(a)*230; j?g.lineTo(X,Y):g.moveTo(X,Y); } g.closePath(); g.fill();
  g.fillStyle=tk("--bg"); g.font="900 200px Inter, sans-serif"; g.fillText(String(x.lv),540,830);
  g.fillStyle=tk("--text-1"); g.font="italic 900 92px Inter, sans-serif"; g.fillText(luTitle(k,x.lv).toUpperCase(),540,1150);
  g.fillStyle=col; g.font="800 56px Inter, sans-serif"; g.fillText(`${luRanks()[luRank(x.lv)][0]}-RANK · LV ${x.lv}`,540,1250);
  g.strokeStyle=tk(D.c); g.fillStyle=tk(D.c); g.lineWidth=4; g.font="800 40px Inter, sans-serif"; const w=g.measureText(`${D.n.toUpperCase()} MODE`).width+60; g.strokeRect(540-w/2,1320,w,72); g.fillText(`${D.n.toUpperCase()} MODE`,540,1370);
  g.fillStyle=tk("--text-2"); g.font="600 44px Inter, sans-serif"; g.fillText(`${Math.round(x.min||0)} minutes so far`,540,1500);
  if(typeof cdShareImage==="function") cdShareImage(c,`ossa-${k}.png`);
}
/* ---------- the difficulty: in the intro (after the questions) and in Settings ---------- */
function luDiffHTML(cur){ const D=luDiffs(); return Object.keys(D).map(k=>`<button class="lu-dd${k===cur?" on":""}" data-d="${k}" style="--dc:var(${D[k].c})" aria-pressed="${k===cur}"><b>${D[k].n}</b><em>${D[k].t}</em><small>${D[k].d}</small></button>`).join(""); }
async function luObDiff(alive){
  if(typeof obAsk!=="function") return "ok";
  return new Promise(res=>{
    let cur=(typeof OBD!=="undefined"&&OBD.diff)||"normal";
    const a=obAsk(`<div class="lu-ob"><div class="lu-sys"><span>[ SYSTEM ]</span><p>Before you begin, choose how the System will treat you. You can change it later.</p></div>
      <h2 class="lu-obh">Choose your difficulty</h2><div class="lu-dl lu-grid" id="luDl"></div><p class="lu-drule" id="luDr"></p>
      <button class="btn primary big" id="luObOk"></button><p class="lu-foot">Most people pick Normal. Nightmare is built to break you.</p></div>`);
    const draw=()=>{ $("luDl").innerHTML=luDiffHTML(cur); $("luObOk").textContent=`Start on ${luDiffs()[cur].n}`; $("luDr").textContent=luDiffs()[cur].d; $("luDr").style.setProperty("--dc",`var(${luDiffs()[cur].c})`);
      a.querySelectorAll("[data-d]").forEach(e=>e.onclick=()=>{ cur=e.dataset.d; Pulse.buzz(cur==="night"?[12,40,12]:6); draw(); }); };
    draw();
    a.querySelector("#luObOk").onclick=()=>{ try{ OBD.diff=cur; }catch(e){} try{ obBackOn(null); }catch(e){} Pulse.buzz(10); a.innerHTML=""; res("ok"); };
  });
}
function luDiffSheet(){
  let s=$("luDS"); if(s) s.remove(); let cur=luDiff();
  s=document.createElement("div"); s.id="luDS"; s.className="lu-sheet";
  s.innerHTML=`<div class="lu-sh-bg" data-x="1"></div><div class="lu-sh"><span class="u-eyebrow">Difficulty</span><div class="lu-dl" id="luDsl"></div><button class="lu-go" id="luDsOk"></button></div>`;
  $("app").appendChild(s); requestAnimationFrame(()=>s.classList.add("on"));
  const draw=()=>{ $("luDsl").innerHTML=luDiffHTML(cur); $("luDsOk").textContent=`Play on ${luDiffs()[cur].n}`;
    s.querySelectorAll("[data-d]").forEach(e=>e.onclick=()=>{ cur=e.dataset.d; Pulse.buzz(6); draw(); }); };
  draw();
  $("luDsOk").onclick=()=>{ S.diff=cur; save(); s.remove(); Pulse.buzz(10); try{ track("difficulty",{d:cur,from:"settings"}); }catch(e){} try{ renderYou(); }catch(e){} };
  s.querySelector(".lu-sh-bg").onclick=()=>s.remove();
}

/* ---------- wiring ---------- */
/* the intro: the difficulty after the last question, before the reveal; it reaches S with the rest */
(()=>{ if(typeof uiObSteps!=="function") return; const _s=uiObSteps; uiObSteps=function(){ const L=_s.apply(this,arguments);
  try{ if(!L.some(x=>x.id==="diff")){ const i=L.findIndex(x=>x.id==="phone"); L.splice(i>=0?i+1:Math.max(0,L.findIndex(x=>x.id==="read")),0,{id:"diff",fn:luObDiff,ch:"week",fit:true}); } }catch(e){ console.warn(e); }
  return L; }; })();
(()=>{ if(typeof uiObCommit!=="function") return; const _c=uiObCommit; uiObCommit=function(){ const v=_c.apply(this,arguments);
  try{ if(OBD.diff&&luDiffs()[OBD.diff]){ S.diff=OBD.diff; save(); } }catch(e){} return v; }; })();
/* Settings: a Difficulty row */
(()=>{ if(typeof renderYou!=="function") return; const _r=renderYou; renderYou=function(){ const v=_r.apply(this,arguments);
  try{ const d=$("yuDial"); if(d&&!$("yuDiff")){ const D=luDiffs()[luDiff()];
      d.insertAdjacentHTML("beforebegin",`<button class="yu-row" id="yuDiff"><span>Difficulty</span><em style="color:var(${D.c})">${D.n} ›</em></button>`);
      $("yuDiff").onclick=()=>{ Pulse.buzz(6); luDiffSheet(); }; } }catch(e){ console.warn(e); }
  return v; }; })();
/* the Focus tab's home is the session levels; the old Rank page and the road are views */
(()=>{ const _h=fcHome; fcHome=function(b,M,more){ if(more) return _h.apply(this,arguments); try{ return luHome(b); }catch(e){ console.warn("Ossa: focus levels",e); return _h.apply(this,arguments); } }; })();
try{ fcView("road",{render:b=>luRoad(b)}); fcView("rank",{render:b=>{ if(typeof rnHome==="function") rnHome(b); }}); }catch(e){ console.warn(e); }
/* the lock-in screens, when the run is a session */
(()=>{ const _t=mmTimer; mmTimer=function(b,r){ if(r&&r.lu) return luTimer(b,r); return _t.apply(this,arguments); };
  const _d=mmDoneView; mmDoneView=function(b,L){ if(L&&L.lu) return luDone(b,L); return _d.apply(this,arguments); };
  const _k=mmBrokenView; mmBrokenView=function(b,X){ if(X&&X.lu) return luBroken(b,X); return _k.apply(this,arguments); }; })();
/* the finish: minutes settle, the bonus on a full finish, the log, the streak day */
(()=>{ const _f=mmFinish; mmFinish=function(full,at){
  const r=mmRun(), lu=r&&r.lu?JSON.parse(JSON.stringify(r.lu)):null, plan=r?Math.round(r.plan):0, task=r?r.task||"":"";
  if(lu){ try{ luTick(); const r2=mmRun(); if(r2&&r2.lu) Object.assign(lu,r2.lu); }catch(e){} }
  const L=_f.apply(this,arguments);
  if(!lu) return L;
  try{ nsend({t:"face",on:false}); }catch(e){}
  if(!L||L.none){ return L; }
  const k=lu.type, x=luS()[k], lv0=x.lv-0, rk0=luRank(x.lv);
  let min=lu.min; if(full&&k!=="off") { const add=Math.round(3*(plan-min)*luMult()); if(add>0){ luAdd(k,add); lu.xp+=add; min=plan; } }
  const before={lv:lv0};
  const bonus=full?Math.round(lu.xp*0.5):0; const a=bonus?luAdd(k,bonus):null;
  x.min=(+x.min||0)+min;
  /* the level before the whole session: the live minutes already moved it */
  const lvStart=lu.lv0!=null?lu.lv0:before.lv, rkStart=luRank(lvStart);
  L.lu={type:k,xp:lu.xp,bonus,min,lv0:lvStart,lv:x.lv,rk0:rkStart,rk:luRank(x.lv),task,done:true,at:Date.now()};
  L.min=min; S.sess.log.push({type:k,mins:min,task,done:true,xp:lu.xp+bonus,at:L.lu.at,full:!!full}); if(S.sess.log.length>200) S.sess.log.shift();
  if(full) luDay();
  try{ track("session_end",{k,min,full:!!full,xp:lu.xp+bonus,lv:x.lv}); }catch(e){}
  save(); try{ vxEmit("skills",L.lu); }catch(e){}
  return L; }; })();
/* leaving: the break rule, priced by difficulty */
(()=>{ const _b=mmBreakCheck; mmBreakCheck=function(m){
  const r=mmRun(), lu=r&&r.lu?r.lu:null; const v=_b.apply(this,arguments);
  try{ const M=mmState(); if(lu&&!mmRun()&&M.broken&&!M.broken.lu){ const k=lu.type, d=luDiff(); let lost="";
      if(d==="hard"){ luAdd(k,-(lu.xp+100)); lost=`−${lu.xp+100} XP`; }
      else if(d==="night"){ if(luLevelDown(k,1)) lost="−1 level"; }
      else if(lu.xp) lost=`+${lu.xp} XP kept`;
      M.broken.lu={type:k,lost}; try{ nsend({t:"face",on:false}); }catch(e){} save();
      try{ if(typeof MIND!=="undefined"&&MIND.open&&/^monk/.test(String(MIND.view))) mmRender(null,"monk"); }catch(e){} } }catch(e){ console.warn(e); }
  return v; }; })();
/* sessions keep their level at the start (for the finish screen) */
(()=>{ const _s=luStart; luStart=function(k){ const lv=luS()[k].lv; const v=_s.apply(this,arguments); try{ const r=mmRun(); if(r&&r.lu) r.lu.lv0=lv; save(); }catch(e){} return v; }; })();
/* the phone's sensor */
try{ vxOn("native",m=>{ if(!m) return; if(m.t==="face"){ luFace.down=!!m.down; luLive(null); } else if(m.t==="face:status"){ luFace.ok=!!m.ok; } }); }catch(e){}
setInterval(()=>{ try{ luTick(); }catch(e){} },1000);
/* aura is discipline only (BONES-SPEC): no aura for session minutes, Breathe, a stake or passing your longest */
(()=>{ if(typeof auAdd!=="function") return; const _a=auAdd; auAdd=function(e){
  if(!e||typeof e!=="object"||e.xp!=null) return _a.apply(this,arguments);
  e.xp=0; const lv=(S.aura&&+S.aura.lv)||1; return {xp:0,raw:0,base:0,bonus:0,capped:false,key:e.k==="breath"?"breath":"monk",src:e.src||"",d:e.d||dkey(0),lv0:lv,lv,up:false,crystal:false}; }; })();
(()=>{ const _g=auGrant; auGrant=function(n,src){ if(src==="stake"||src==="ghost"||src==="lesson") return null; const v=_g.apply(this,arguments); try{ if(src==="report") luDay(); }catch(e){} return v; }; })();
