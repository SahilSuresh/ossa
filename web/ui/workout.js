/* =========================================================
   THE WORKOUT — redesign 2026-10-15, rebuilt 18 Oct (Andrej: "a lot better"; the completion "something the user
   goes through … so they can't just click away by accident").
   A plain black column: a sticky bar (back, the time, +RP · sets counting up as you log, Finish, a quest bar with
   one segment per set), the exercise strip, the exercise card (muscle chips, the name, the target, Watch, Insights,
   and the muscle meter: its rank, today's gain, the bar to the next rank), the nudge, the set table, and at the
   thumb one sticky dock: the steppers, plates, the bone Log button and Up next. While you rest, the bone rest sheet
   slides into the dock's slot with the effort question inside it.
   After the last set: THE RUN. One guided sequence inside #train you step through with Next: Results over your lit
   body, personal bests, rank points per muscle, the rank-up screens (ranks.js), a level-up on the hex emblem,
   trophies (evolve.js), the streak (ranks.js), then Next time and Done. No tab bar, no back, no edge swipe; the only
   shortcut is a two-button Skip to the last step. floatHTML and drawDoneFloat moved here from web/ossa.html.
   ========================================================= */

/* the columns a set has, by kind of exercise */
function wkCols(it,p){
  const k=p.kind;
  if(k==="load") return [["kg","kg"],["r","reps"]];
  if(k==="bw") return LOADABLE_BW.has(it.name)?[["kg","+kg"],["r","reps"]]:[["r","reps"]];
  if(k==="time") return [["s","secs"]];
  if(k==="carry") return [["kg","kg"]];
  return [];
}
const wkVal=(f,v)=>v==null||v===""?"–":f==="kg"?fkg(v):String(v);
/* the set table: done sets ticked, the current one editable, the rest waiting */
const WKJ={ex:-1,n:0};   // which set was logged last, so only that row flashes
function wkTableHTML(it,p,resting){
  const cols=wkCols(it,p), lg=TR.logs[TR.ex]||[], prev=p.last&&p.last.sets||[], n=it.sets;
  const nd=lg.filter(Boolean).length, just=WKJ.ex===TR.ex&&nd>WKJ.n?nd-1:-1; WKJ.ex=TR.ex; WKJ.n=nd;
  const head=`<div class="wk-tr wk-th" aria-hidden="true"><span>Set</span><span>Previous</span>${cols.map(([,l])=>`<span>${l}</span>`).join("")}<span></span></div>`;
  const rows=Array.from({length:n},(_,i)=>{
    const x=lg[i], cur=!resting&&i===TR.set&&!x, nextUp=resting&&i===TR.set&&!x, pv=prev[i]||prev[prev.length-1];
    const cells=cols.map(([f])=>{
      if(x) return `<span class="wk-v">${wkVal(f,x[f])}</span>`;
      if(cur) return `<span class="stp wk-in"><input id="in_${f}" data-f="${f}" inputmode="decimal" enterkeyhint="done" value="${wkVal(f,TR.cur[f]).replace("–","")}" aria-label="${f==="kg"?"Kilograms":f==="r"?"Reps":"Seconds"} for set ${i+1}"></span>`;
      const tv=f==="kg"?(p.kg||null):f==="r"?(p.reps[i]??null):f==="s"?(p.secs[i]??null):null;
      return `<span class="wk-v wk-dim">${wkVal(f,tv)}</span>`; }).join("");
    const tick=x?`<span class="u-tick" aria-label="Done">${UI_IC.check}</span>`:cur?`<span class="u-tick going" aria-hidden="true"></span>`:`<span class="u-tick todo" aria-hidden="true"></span>`;
    return `<div class="wk-tr${x?" wk-done":cur?" wk-cur":nextUp?" wk-next":""}${i===just?" wk-just":""}"><b>${i+1}</b><span class="wk-pv">${pv?setTxt(p.kind,pv):"–"}</span>${cells}${tick}</div>`; }).join("");
  return `<div class="wk-tbl" style="--cols:${cols.length}" role="group" aria-label="Sets">${cols.length?head:""}${rows}</div>`;
}
/* the steppers for the current set: big targets showing the value they change (the inputs live in the table row) */
function wkStepsHTML(it,p){
  const cols=wkCols(it,p); if(!cols.length) return "";
  return `<div class="wk-steps">${cols.map(([f,l])=>`<span class="stp wk-stp"><button data-f="${f}" data-d="-1" aria-label="Less ${l}">−</button><span class="wk-sv"><b class="u-num" data-sv="${f}">${wkVal(f,TR.cur&&TR.cur[f])}</b><small>${l}</small></span><button data-f="${f}" data-d="1" aria-label="More ${l}">+</button></span>`).join("")}</div>`;
}
/* keep the stepper values in step with the set (the buttons and the typed inputs both change TR.cur) */
function wkSyncSteps(){ document.querySelectorAll("#train [data-sv]").forEach(b=>{ b.textContent=wkVal(b.dataset.sv,TR.cur&&TR.cur[b.dataset.sv]); }); }

/* ---------- rank points as you log: the same dry run the engine's preview makes (vessel.js vxPreview); nothing is saved ---------- */
function wkMob(){ const s=TR.session; return !!s&&(s.kind==="mobility"||s.kind==="posture"); }
function wkRpNow(){ if(!TR.session||wkMob()) return {}; try{ const X=vxLoad(TR.session.items,TR.doneSets); return vxRP(X.L,X.prim,false).gains||{}; }catch(e){ return {}; } }
function wkRpSum(g){ return Object.values(g||{}).reduce((a,b)=>a+(+b||0),0); }
/* what the bar and the meter show now, so a redraw renders the old value and then counts up to the new one */
function wkRpState(){ const st=wkRpTick.st; return st&&st.t0===TR.t0?st:{t0:TR.t0,shown:0,done:0,last:0,g:{}}; }
function wkRpTick(){
  if(!TR.session||TR.view!=="active") return;
  const st=wkRpState(); wkRpTick.st=st;
  const g=wkRpNow(), rp=wkRpSum(g), done=(TR.doneSets||[]).reduce((a,b)=>a+b,0), el=$("wkRp");
  if(rp>st.shown){ if(el){ fxCount(el,st.shown,rp,500,v=>`+${v} RP`); fxReplay(el,"tick"); } st.last=rp-st.shown; }
  else if(done>st.done) st.last=0;
  const it=TR.session.items[TR.ex];
  if(it&&MUSCLES[it.primary]){ const k=it.primary, sc=S.scores[k]||0, g0=st.g[k]||0, g1=g[k]||0;
    if(g1>g0){ const up=rankIx(sc+g1)>rankIx(sc), b=$("wkMmB"), n=$("wkMmG"), sm=$("wkMmS");
      if(b) fxBar(b,rankFrac(sc+g0),up?1:rankFrac(sc+g1),false,600);
      if(n){ n.classList.remove("zero"); fxCount(n,g0,g1,500,v=>`+${v} RP`); }
      if(sm){ const nx=toNext(sc+g1); sm.textContent=up?"Rank up at the finish":nx?`${nx.pts} to ${nx.name}`:"Top rank"; } } }
  st.shown=rp; st.done=done; st.g=g;
}
/* the muscle meter in the exercise card: the muscle you are working, its rank, today's gain, the bar to the next rank */
function wkMeterHTML(it){
  if(!TR.session||wkMob()||!it||!MUSCLES[it.primary]) return "";
  const k=it.primary, sc=S.scores[k]||0, t=rankTier(sc), st=wkRpState(), g=st.g[k]||0, up=rankIx(sc+g)>rankIx(sc), f0=rankFrac(sc)*100, f1=up?100:rankFrac(sc+g)*100, nx=toNext(sc+g);
  return `<div class="wk-mm" style="--c:${t<=1?"var(--line-3)":`var(--rk-${t})`}"><span class="wk-mm-n"><i class="rk-sq"></i>${uiEsc(rkSay(k))} <em>· ${sc?rankOf(sc):"Unranked"}</em></span><b class="wk-mm-g${g?"":" zero"}" id="wkMmG">+${g} RP</b><span class="wk-mm-b"><i class="now" id="wkMmB" style="width:${f1.toFixed(1)}%"></i><i class="was" style="width:${f0.toFixed(1)}%"></i></span><small id="wkMmS">${up?"Rank up at the finish":nx?`${nx.pts} to ${nx.name}`:"Top rank"}</small></div>`;
}
/* the quest bar under the time: one segment per set, grouped per exercise; the set you just logged pops */
function wkQbarHTML(s,done,doneBefore){
  const segs=[]; let i=0;
  s.items.forEach((x,ei)=>{ for(let j=0;j<x.sets;j++,i++) segs.push(`<i class="${i<done?"on":i===done?"cur":""}${i===done-1&&done>doneBefore?" new":""}${j===0&&ei>0?" gap":""}"></i>`); });
  const tot=i;
  if(tot>40) return `<span class="wk-pbar" aria-hidden="true"><i style="width:${(done/Math.max(1,tot)*100).toFixed(1)}%"></i></span>`;
  return `<span class="wk-qbar${tot>24?" tight":""}" aria-hidden="true">${segs.join("")}</span>`;
}
function floatHTML(s,it,p,n,done,tot,next){
  const enter=TR._lastEx!==TR.ex, key=`${TR.ex}.${TR.set}.${TR.resting}`; TR._lastEx=TR.ex; TR._lastKey=key;
  const tgt=tgtLabel(it.target).replace("As many reps as you can","max reps");
  const left=Math.max(0,(TR.restEnd-Date.now())/1000), last=TR.set+1===it.sets&&TR.ex+1===n;
  const note=(p.note||"").replace(/^↑\s*/,"");
  const strip=wkStripHTML(s), eff=wkEffHTML(), plates=!TR.resting&&p.kind==="load"&&trIsBar(it.name)?`<p class="wk-plates" id="wkPlates">${trPlatesTxt(TR.cur&&TR.cur.kg)}</p>`:"";
  setTimeout(wkStripCenter,0); setTimeout(wkRpTick,0);
  const mob=wkMob(), st=wkRpState(), rpNow=wkRpSum(wkRpNow()), dLast=Math.max(0,rpNow-st.shown);
  /* each chip is a button: it opens Kinetic chain (discover.js) for this exercise, that muscle's row in focus */
  const chip=(k,on)=>`<button type="button" class="wk-chip${on?" on":""}" data-kc="${k}" aria-label="${uiEsc(MUSCLES[k].name)}: what ${uiEsc(it.name)} works">${uiEsc(MUSCLES[k].name)}</button>`;
  const chips=`<i id="tfDot"></i>`+[chip(it.primary,true),...it.sec.slice(0,2).map(k=>chip(k,false))].join("");
  const upnext=next.length?`<button class="tf-next rdt-qb" id="rdtQ" aria-label="Up next: ${uiEsc(next[0].name)}. Change the order"><span>Up next</span><b>${uiEsc(next[0].name)}</b><em>${next[0].sets} × ${uiEsc(next[0].target)}</em>${UI_IC.chev}</button>`:`<div class="tf-next"><span>Last exercise</span><b>Finish strong</b></div>`;
  const nextTxt=TR.set===0&&TR.ex>0?uiEsc(it.name):`set ${TR.set+1} of ${it.sets}`;
  const why=mob||it.mob?`Breathe. Next: ${TR.set===0&&TR.ex>0?it.name:`set ${TR.set+1}`}.`:TR.set===0&&TR.ex>0?`Shake it out: ${it.name} is next.`:`Let your ${MUSCLES[it.primary].name.toLowerCase()} recover for set ${TR.set+1}.`;
  return `<div class="wk-bar">
      <button class="u-icon-btn wk-min" id="tfMin" aria-label="Back to your body (the workout keeps running)">${UI_IC.back}</button>
      <div class="wk-clock"><b class="u-mono" id="elapsed">${fmt((Date.now()-TR.t0)/1000)}</b><span class="wk-hud">${mob?"":`<b id="wkRp">+${st.shown} RP</b> · `}${done}/${tot} sets</span></div>
      <button class="u-btn small lime wk-end${TR.endArm?" arm":""}" id="endW">${TR.endArm?"Tap to finish":"Finish"}</button>
      ${wkQbarHTML(s,done,st.done)}</div>
    ${strip}
    <div class="tf-top wk-top${enter?" enter":""}">
      <div class="wk-chips tf-eye">${chips}</div>
      <h2 class="tf-name">${uiEsc(it.name)}</h2>
      <div class="tf-meta"><em>${it.sets} × ${uiEsc(tgt)}</em><button class="tf-watch${TR.watching?" on":""}" id="watchDemo"><svg viewBox="0 0 12 12"><path d="M4 2.5v7l6-3.5z"/></svg>Watch</button><button class="tf-watch wk-ins" id="wkIns">${TR_IC.chart}Insights</button></div>
      ${wkMeterHTML(it)}
    </div>
    <div class="tf-bot wk-bot">
      ${!TR.resting&&note?`<p class="wk-nudge${p.up?" up":""}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 14.4 9l5.9.5-4.5 3.9 1.4 5.8L12 16.1l-5.2 3.1 1.4-5.8L3.7 9.5 9.6 9z"/></svg><span>${uiEsc(note)}</span></p>`:""}
      ${wkTableHTML(it,p,TR.resting)}
      <div class="wk-dock" id="wkDock">${TR.resting
        ?`<div class="wk-rest" role="timer" aria-label="Rest">${eff}
            <div class="wk-rest-h"><span class="u-eyebrow">Rest</span><em>Next · ${nextTxt}</em></div>
            <div class="wk-rest-t"><b class="u-num" id="rt">${fmt(Math.ceil(left))}</b><small>${TR.lastTxt?`Logged ${uiEsc(TR.lastTxt)}`:""}${dLast>0?`${TR.lastTxt?" · ":""}+${dLast} RP`:""}</small></div>
            <svg class="wk-rest-bar" viewBox="0 0 289 4" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="2" x2="289" y2="2" class="rbg"/><line x1="0" y1="2" x2="289" y2="2" class="rfg" id="ring" style="stroke-dashoffset:${((1-left/(TR.restLen||REST))*289).toFixed(1)}"/></svg>
            <p class="wk-rest-why">${uiEsc(why)}</p>
            <div class="wk-rest-b"><button class="wk-rb" data-rest="-15" aria-label="Fifteen seconds less">−15</button><button class="wk-rb" id="addRest" aria-label="Fifteen seconds more">+15</button><button class="wk-rb wk-skip" id="skipRest">Skip</button></div></div>`
        :`${wkStepsHTML(it,p)}${plates}<div class="tf-cta"><button class="btn primary big" id="setDone">${last?"Log set and finish":p.kind==="tick"?`Set ${TR.set+1} done`:`Log set ${TR.set+1}`}</button></div>`}
      ${upnext}</div>
    </div>
    <div class="wk-watchbar"><b>${uiEsc(it.name)}</b><button class="btn primary big" id="wkWatchX">Back to sets</button></div>`;
}
/* −15 s on the rest sheet (+15 and Skip are wired with the rest of the workout) */
(()=>{ const t=$("train"); if(t) t.addEventListener("click",e=>{ const b=e.target.closest("[data-rest]"); if(!b||!TR.resting) return; e.stopPropagation(); Pulse.buzz(5);
  TR.restEnd=Math.max(Date.now()+1000,TR.restEnd+(+b.dataset.rest)*1000); tick(); }); })();
/* the rest ran out: a small buzz (a wrapper, so a later edit to ossa.html's tick is never shadowed) */
(()=>{ const _t=tick; tick=function(){ const was=TR.resting; const v=_t.apply(this,arguments);
  if(was&&!TR.resting&&TR.view==="active"){ Pulse.buzz([30,50,30]);   /* heavier at zero (19 Oct, Train spec) */
    try{ if(!$("app").classList.contains("train")) toast("Rest over. Tap Train to carry on."); }catch(e){} }   /* you're on another page */
  return v; }; })();
/* a workout you've left running (another tab) never draws itself over the page you're on. The rest running out called
   drawTrain → drawActive, which turned .tactive back on: the workout showed through the Body page and the body vanished
   (Andrej's Samsung, 19 Oct). It draws again when you come back (setMode("train") calls drawTrain). */
(()=>{ const _a=drawActive; drawActive=function(){ try{ if(!$("app").classList.contains("train")) return; }catch(e){} return _a.apply(this,arguments); }; })();

/* every exercise in the session, under the bar: done ones ticked, yours now lit, the rest a tap away */
function wkStripHTML(s){
  return `<div class="wk-strip" id="wkStrip" role="group" aria-label="Exercises in this workout">${s.items.map((x,i)=>{ const dn=TR.doneSets[i]||0, full=dn>=x.sets, cur=i===TR.ex;
    return `<button class="wk-sx${cur?" on":full?" ok":dn?" part":""}" data-jx="${i}"${full||cur?" aria-disabled=\"true\"":""} aria-label="${uiEsc(x.name)}: ${dn} of ${x.sets} sets${full?", done":cur?", now":". Do it now"}">
      <span class="wk-sxn">${full?UI_IC.check:i+1}</span><span class="wk-sxt">${uiEsc(x.name)}</span>${!full&&dn?`<em>${dn}/${x.sets}</em>`:""}</button>`; }).join("")}</div>`;
}
function wkStripCenter(){ const st=$("wkStrip"), on=st&&st.querySelector(".wk-sx.on"); if(on) st.scrollLeft=Math.max(0,on.offsetLeft-(st.clientWidth-on.offsetWidth)/2); }
/* tap an exercise: do it now if you haven't started this one, otherwise it's next */
function wkJump(i){
  const s=TR.session, it=s&&s.items[i]; if(!it||i===TR.ex||(TR.doneSets[i]||0)>=it.sets||i<TR.ex) return;
  const started=(TR.doneSets[TR.ex]||0)>0; Pulse.buzz(8);
  if(!started){ rdtMoveEx(i,TR.ex); TR.set=0; try{ curDefaults(); }catch(e){} toast(`${it.name} now.`); }
  else { rdtMoveEx(i,TR.ex+1); toast(`${it.name} is next.`); }
  drawTrain();
}
/* the effort check, while you rest after an exercise's last set */
const WK_EFF=[[3,"3+","Easy","e3"],[1,"1–2","Just right","e1"],[0,"0","All-out","e0"]];
function wkEffQ(name,attr){ return `<div class="wk-eff-q"><span class="u-eyebrow">${uiEsc(name)} · last set</span><b>How many more reps could you have done?</b></div>
  <div class="wk-eff-b">${WK_EFF.map(([v,b,l,c])=>`<button class="${c}" ${attr}="${v}"><b>${b}</b><small>${l}</small></button>`).join("")}</div>`; }
function wkEffHTML(){
  if(!TR.resting||!TR.ask) return "";
  const it=TR.session.items.find(x=>x.name===TR.ask); if(!it) return "";
  const v=TR.rir&&TR.rir[it.name];
  if(v==null) return `<div class="wk-eff" role="group" aria-label="How hard was ${uiEsc(it.name)}">${wkEffQ(it.name,"data-rir")}</div>`;
  let pl=null; try{ pl=liftPlan(it,{sets:TR.logs[TR.session.items.indexOf(it)]||[],rir:v}); }catch(e){}
  return `<div class="wk-eff done"><span class="u-eyebrow">Next time · ${uiEsc(it.name)}</span><b>${pl&&pl.up?"↑ ":pl&&pl.adj==="down"?"↓ ":""}${uiEsc(trTargetTxt(pl))}</b><small>${uiEsc(((pl&&pl.note)||"").replace(/^↑\s*/,"").replace(/Last time felt/g,"Today felt").replace(/Last time was/g,"Today was").replace(/than last time/g,"than today"))}</small></div>`;
}
(()=>{ const t=$("train"); if(!t) return;
  const plates=()=>{ const el=$("wkPlates"); if(el&&TR.cur) el.textContent=trPlatesTxt(TR.cur.kg); };
  t.addEventListener("click",e=>{
    if(TR.view!=="active") return;
    const sb=e.target.closest(".stp button[data-f]");
    if(sb){ wkSyncSteps(); Pulse.buzz(4); const stp=sb.closest(".wk-stp"); fxReplay(stp&&stp.querySelector("[data-sv]"),"wk-tick"); }   /* a tick you can feel */
    if(e.target.closest('.stp button[data-f="kg"]')){ plates(); return; }
    const j=e.target.closest("[data-jx]"); if(j){ e.stopPropagation(); wkJump(+j.dataset.jx); return; }
    const r=e.target.closest("[data-rir]"); if(r&&TR.ask){ e.stopPropagation(); TR.rir=TR.rir||{}; TR.rir[TR.ask]=+r.dataset.rir; Pulse.buzz([8,40,12]); drawTrain(); return; }
    if(e.target.closest("#wkWatchX")){ e.stopPropagation(); const it=TR.session.items[TR.ex]; if(it&&TR.watching) trainWatch(it); return; }
    /* a muscle chip: Kinetic chain for this exercise over the workout (the timer keeps running) */
    const kc=e.target.closest(".wk-chip[data-kc]"); if(kc){ e.stopPropagation(); const it=TR.session.items[TR.ex];
      if(it&&typeof openKinetic==="function"){ Pulse.buzz(6); openKinetic(it.name,it.primary,{from:"workout",focus:kc.dataset.kc===it.primary?null:kc.dataset.kc}); }
      else if(it) openInsights(it.name,it);   // until Kinetic chain is in, the chips open Insights
      return; }
    if(e.target.closest("#wkIns")){ e.stopPropagation(); const it=TR.session.items[TR.ex]; if(it) openInsights(it.name,it); }
  });
  t.addEventListener("change",e=>{ if(TR.view!=="active"||!e.target.matches||!e.target.matches("input[data-f]")) return; wkSyncSteps(); if(e.target.dataset.f==="kg") plates(); });
  /* typing a value: the steppers step aside so Log stays above the keyboard */
  t.addEventListener("focusin",e=>{ if(TR.view==="active"&&e.target.matches&&e.target.matches("input[data-f]")) t.classList.add("wk-typing"); });
  t.addEventListener("focusout",()=>t.classList.remove("wk-typing"));
})();

/* =========================================================
   THE RUN — Workout complete as a guided sequence (18 Oct). One host inside #train holds every step's markup from
   the start, so the pieces other files add to the done page still land: Evolve's rows (evDoneLines: .wk-dn, .dn-top,
   .wk-gains), Recover's reset toggle (before #doneW), Where your sets went (density.js, #dzDone).
   ========================================================= */
/* next time: what the plan will ask for, set from today's sets and how they felt */
function wkNextHTML(R,s){
  const rows=[];
  (R.logs||[]).forEach(l=>{ if(l.kind!=="load"&&l.kind!=="bw") return; const it=s.items.find(x=>x.name===l.name); if(!it) return;
    let p=null; try{ p=liftPlan(it); }catch(e){} if(!p||!p.last) return; const rated=p.last.rir!=null; if(!rated&&!p.up) return; rows.push({it,p,rated}); });
  if(!rows.length) return "";
  return `<div class="wk-nx"><div class="dn-h"><span>Next time</span><b>${rows.some(r=>r.rated)?"From today's sets and how they felt":"From today's sets"}</b></div>
    ${rows.slice(0,4).map(({it,p})=>`<button class="wk-nxr" data-nxi="${encodeURIComponent(it.name)}"><b>${uiEsc(it.name)}</b><em class="${p.up?"up":p.adj==="down"?"dn":""}">${p.up?"↑ ":p.adj==="down"?"↓ ":""}${uiEsc(trTargetTxt(p))}</em>${UI_IC.chev}</button>`).join("")}</div>`;
}
function wkWireNext(s){ $("train").querySelectorAll("[data-nxi]").forEach(b=>b.onclick=()=>{ const nm=decodeURIComponent(b.dataset.nxi); openInsights(nm,s.items.find(x=>x.name===nm)); }); }
/* the steps this run has, from the result */
function wkRunSteps(R){
  R.ev=R.ev||{};
  const gains=R.gains||{}, keys=Object.keys(gains).filter(k=>gains[k]>0&&MUSCLES[k]);
  const N=sessionsN(), up=N>(R.n0||0), first=up&&(S.workouts||[]).filter(w=>w.d===dkey(0)).length===1;
  let moments=[]; try{ if(typeof evMomentsList==="function") moments=evMomentsList(R)||[]; }catch(e){ moments=[]; }
  let oUp=false; try{ oUp=rkOverallUp(R); }catch(e){}
  const steps=[{id:"results",name:"Results",lit:true}];
  if(R.prs&&R.prs.length) steps.push({id:"prs",name:"Personal best"});
  if(keys.length) steps.push({id:"gains",name:"Rank points"});
  if((R.ranks&&R.ranks.length)||oUp) steps.push({id:"ranks",name:"Rank-ups",ext:true});
  if(R.lv1>R.lv0||(R.unl&&R.unl.length)) steps.push({id:"level",name:R.lv1>R.lv0?"Level up":"Unlocked"});
  if(moments.length) steps.push({id:"moments",name:"Trophies",ext:true});
  if(first&&!document.querySelector(".sk-up")) steps.push({id:"streak",name:"Streak",ext:true});
  steps.push({id:"next",name:"Next time",lit:true,last:true});
  return steps;
}
function wkPlural(n,w){ return `${n} ${w}${n===1?"":"s"}`; }
/* the level emblem, the Body page's hex and ring, big */
function wkLvlHexHTML(lv0,lv1,pct){
  const HX="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5";
  return `<span class="u-lvl-hex wk-lvl-hex"><svg viewBox="0 0 64 64" aria-hidden="true"><polygon class="g" points="${HX}"/><polygon class="p" id="wkLvRing" pathLength="100" points="${HX}" style="stroke-dasharray:${pct.toFixed(1)} 100"/></svg><b>${lv1>lv0?`<span class="sk-roll" id="wkLvRoll"><span>${lv0}</span><span>${lv1}</span></span>`:lv1}</b></span>`;
}
/* one step's markup */
function wkRunStepHTML(st,i,N,R,s,keys){
  const gains=R.gains||{}, rp=keys.reduce((a,k)=>a+(gains[k]||0),0), n=GLORDER.length, mob=s.kind==="mobility"||s.kind==="posture";
  const hint=i<N-1?`<span class="wk-run-hint">${i+1} of ${N} · Next: ${wkRunStepName(st,i,N)}</span>`:"";
  const cta=st.last?`<button class="u-btn primary block" id="doneW">Done</button>`:`<button class="u-btn primary block wk-run-go" data-go="1">Next</button>`;
  let body="";
  if(st.id==="results"){
    const Nn=sessionsN(), up=Nn>(R.n0||0), ms=up&&MILES.find(m=>m[0]===Nn), ranks=(R.ranks||[]).length;
    let oUp=false; try{ oUp=rkOverallUp(R); }catch(e){}
    let moments=[]; try{ if(typeof evMomentsList==="function") moments=evMomentsList(R)||[]; }catch(e){}
    const first=up&&(S.workouts||[]).filter(w=>w.d===dkey(0)).length===1;
    const pills=[];
    /* the RP is already a stat above: no second "+N RP" pill (19 Oct) */
    if(R.prs&&R.prs.length) pills.push(`<span>${wkPlural(R.prs.length,"personal best")}</span>`);
    if(ranks||oUp) pills.push(`<span>${wkPlural(ranks+(oUp?1:0),"rank-up")}</span>`);
    if(R.lv1>R.lv0) pills.push(`<span>Level up</span>`); else if(R.unl&&R.unl.length) pills.push(`<span>Unlocked</span>`);
    if(moments.length) pills.push(`<span>${moments.length>1?`${moments.length} new trophies`:"New trophy"}</span>`);
    if(first) pills.push(`<span>Streak</span>`);
    body=`<div class="dn-top wk-res"><div class="wk-res-fig" aria-hidden="true"></div><div class="u-eyebrow wk-dn-eye">Workout complete</div><h1 class="u-h1">${uiEsc(s.title)}</h1>
      <div class="dn-stats"><div><b data-to="${R.mins}">0</b><span>${R.mins===1?"minute":"minutes"}</span></div><div><b data-to="${R.sets}">0</b><span>${R.sets===1?"set":"sets"}</span></div>${R.vol?`<div><b data-to="${R.vol}" data-vol="1">0</b><span>kg lifted</span></div>`:`<div><b data-to="${(R.logs||[]).length||s.items.length}">0</b><span>exercises</span></div>`}${rp&&!mob?`<div class="wk-rpst"><b data-to="${rp}" data-plus="1">0</b><span>rank points</span></div>`:""}</div>
      ${ms?`<div class="dn-ms"><span>Milestone · ${ms[1]}</span><b>${ms[2]}</b></div>`:""}
      ${pills.length?`<div class="wk-tease">${pills.join("")}</div>`:""}</div>`;
  } else if(st.id==="prs"){
    body=`<div class="wk-run-in"><span class="u-eyebrow wk-run-eye gold">New personal best${R.prs.length>1?"s":""}</span>
      <div class="wk-pb">${R.prs.slice(0,3).map((x,j)=>`<div style="--i:${j}"><b>${uiEsc(x.name)}</b><em>${uiEsc(x.now)}</em><small>was ${uiEsc(x.was)}</small></div>`).join("")}</div></div>`;
  } else if(st.id==="gains"){
    let oUp=false; try{ oUp=rkOverallUp(R); }catch(e){}
    const lead=keys[0], top=keys.slice(0,6);
    const row=(k,j)=>{ const sc=S.scores[k]||0, g=gains[k]||0, t=rankTier(sc), f0=rankFrac(Math.max(0,sc-g)), f1=rankFrac(sc), wrap=rankIx(sc)>rankIx(Math.max(0,sc-g));
      return `<div class="wk-rpr" style="--i:${j};--c:${t<=1?"var(--line-3)":`var(--rk-${t})`}"><i class="rk-sq"></i><b>${uiEsc(MUSCLES[k].name)}</b><em>${rankOf(sc)}</em><strong>+${g}</strong><span class="u-bar" data-f0="${f0.toFixed(3)}" data-f1="${f1.toFixed(3)}" data-wrap="${wrap?1:0}"><i style="width:${(f0*100).toFixed(1)}%"></i></span></div>`; };
    body=`<div class="wk-run-in"><span class="u-eyebrow wk-run-eye">Rank points</span>
      <b class="wk-run-big" data-to="${rp}" data-plus="1">+0 RP</b>
      <p class="wk-run-sub">${lead?`${uiEsc(MUSCLES[lead].name)} led`:""} · ${wkPlural(keys.length,"muscle")}</p>
      <div class="wk-gains"><div class="wk-rpl">${oUp?`<div class="wk-rpr ov" style="--i:0;--c:var(--rk-${rankTier(R.o1)})"><i class="rk-sq"></i><b>Overall</b><em>${rankOf(R.o1)}</em><strong aria-label="ranked up">↑</strong></div>`:""}${top.map((k,j)=>row(k,j+(oUp?1:0))).join("")}</div>${keys.length>6?`<p class="wk-run-more">+${wkPlural(keys.length-6,"more muscle")}</p>`:""}</div>
      <div class="dn-blk"><div class="dn-h"><span>This week</span><b>${R.hit1}/${n}${R.hit1>R.hit0?` <em>+${R.hit1-R.hit0}</em>`:""}</b></div>
        <div class="segs wk dn-segs">${GLORDER.map((k,j)=>`<i class="${j<R.hit0?"on":j<R.hit1?"on new":""}" style="--k:${Math.max(0,j-R.hit0)}"></i>`).join("")}</div></div></div>`;
  } else if(st.id==="level"){
    let L=null; try{ L=vxLevelInfo(); }catch(e){}
    const up=R.lv1>R.lv0, tier=rankTier(typeof overall==="function"?overall():0);
    const xp0=Math.max(0,(R.xp||0)-rp), a0=vxLevelXp(R.lv0), a1=vxLevelXp(R.lv0+1), frac0=a1>a0?Math.max(0,Math.min(1,(xp0-a0)/(a1-a0))):0;
    const line=L?(L.lv>=99?"Top level":`${L.xp} RP for life · ${L.toNext} to level ${L.lv+1}`):"";
    body=`<div class="wk-run-in"><span class="u-eyebrow wk-run-eye">${up?"Level up":"Unlocked"}</span>
      <div class="wk-lvl" style="--c:${tier<=1?"var(--text-1)":`var(--rk-${tier})`}" data-f0="${frac0.toFixed(3)}" data-f1="${(L?L.frac:0).toFixed(3)}" data-up="${up?1:0}">${wkLvlHexHTML(R.lv0,R.lv1,(up?frac0:(L?L.frac:0))*100)}</div>
      <div class="rk-up-tier u-impact wk-lvl-t">Level ${R.lv1}</div>
      <p class="wk-run-sub">${uiEsc(line)}</p>
      ${R.unl&&R.unl.length?`<div class="wk-unl"><span class="u-eyebrow wk-run-eye">Unlocked</span>${R.unl.map((u,j)=>`<div style="--i:${j}"><b>${uiEsc(u.name)}</b>${u.s?`<small>${uiEsc(u.s)}</small>`:""}</div>`).join("")}</div>`:""}</div>`;
  } else if(st.id==="next"){
    body=`<div class="dn-top wk-run-nt wk-res wk-fin"><div class="u-eyebrow wk-dn-eye">Done</div><h1 class="u-h1">Logged. Recovery starts now.</h1><div class="wk-res-fig" aria-hidden="true"></div></div>
      <div class="dn-low wk-done-low">
      ${R.ask?`<div class="wk-eff dn-eff" id="dnEff">${wkEffQ(R.ask,"data-drir")}</div>`:""}
      <div id="dnNext">${wkNextHTML(R,s)}</div>
      ${wkDensRow(R)}
      ${R.logs.length?`<details class="xlog"><summary>Your sets</summary>${R.logs.map(l=>`<div class="xl"><b>${uiEsc(l.name)}</b><span>${l.sets.map(x=>setTxt(l.kind,x)).join(" · ")}</span></div>`).join("")}</details>`:""}
      </div>`;
  }
  return `<section class="wk-run-s${st.lit?" lit":""}${st.ext?" ext":""}" data-step="${i}" data-id="${st.id}" hidden>${body}<div class="wk-run-cta">${cta}${hint}</div></section>`;
}
function wkRunStepName(st,i,N){ const r=TR.run; const nx=r&&r.steps[i+1]; return nx?nx.name:"Done"; }
/* the strip over everything: the run's progress and the one way to skip */
function wkRunStripHTML(N){
  return `<div class="wk-run-top" id="wkRunTop"><div class="wk-run-row"><div class="rk-segs" aria-hidden="true">${Array.from({length:N},()=>`<i><b></b></i>`).join("")}</div><span class="wk-run-lbl" id="wkRunLbl"></span><button class="wk-run-skip" id="wkRunSkip">Skip</button></div>
    <div class="wk-run-ask" id="wkRunAsk" hidden><span>Skip the rest?</span><button class="u-btn small primary" id="wkRunSkipGo">Skip to the end</button><button class="u-link" id="wkRunKeep">Keep reading</button></div></div>`;
}
function wkRunSeg(i){ const top=$("wkRunTop"); if(!top) return; top.querySelectorAll(".rk-segs i").forEach((e,j)=>{ e.className=j<i?"done":j===i?"now":""; }); const lbl=$("wkRunLbl"), r=TR.run; if(lbl&&r){ const st=r.steps[i]; lbl.textContent=st&&st.ext&&i<r.steps.length-1?`${i+1} of ${r.steps.length} · Next: ${wkRunStepName(st,i)}`:""; } top.hidden=!!(r&&r.steps[i]&&r.steps[i].last); }
/* the body behind the run, lit where you worked, turning slowly */
function wkRunBody(R,keys){
  const app=$("app");
  const faces=Object.keys(R.I||{}).filter(k=>R.I[k]>=0.5&&MUSCLES[k]).map(k=>MUSCLES[k].face);
  const back=faces.filter(f=>f>1.57).length, view=back>faces.length-back?Math.PI:0;
  TR.glowOn="done"; Body.setXray&&Body.setXray(false); Body.setOverview&&Body.setOverview(false,false); Body.stopDemo&&Body.stopDemo(); Body.refresh&&Body.refresh();
  Body.camTo&&Body.camTo({zoom:1,px:0,py:0,yaw:view},reduced?0.01:1.1);
  setTimeout(()=>Body.pulse&&Body.pulse(keys),reduced?0:500);
  clearInterval(TR.planSpin); if(!reduced){ let v=view; TR.planSpin=setInterval(()=>{ if(!app.classList.contains("tdone")||document.hidden) return; v=v?0:Math.PI; Body.camTo&&Body.camTo({zoom:1,px:0,py:0,yaw:v},1.8); },6500); }
  requestAnimationFrame(()=>Body.reframe());
}
function drawDoneFloat(R,s,keys){
  const app=$("app");
  /* a stray redraw (drawTrain runs trainGlowOff first) puts the classes back and never restarts the run */
  if(TR.run&&TR.run.R===R&&$("train").querySelector(".wk-run")){ app.classList.remove("tactive","tresting","tplan"); app.classList.add("tdone","wkrun"); wkRunBody(R,keys); return; }
  app.classList.remove("tactive","tresting","tplan"); app.classList.add("tdone","wkrun");
  const steps=wkRunSteps(R), N=steps.length;
  TR.run={R,s,keys,steps,i:-1,busy:false};
  $("train").innerHTML=`<div class="dn wk-dn wk-run" role="dialog" aria-label="Workout complete">${steps.map((st,i)=>{ try{ return wkRunStepHTML(st,i,N,R,s,keys); }catch(e){ console.warn("Ossa: run step",st.id,e); return `<section class="wk-run-s" data-step="${i}" data-id="${st.id}" hidden><div class="wk-run-cta">${st.last?`<button class="u-btn primary block" id="doneW">Done</button>`:`<button class="u-btn primary block wk-run-go" data-go="1">Next</button>`}</div></section>`; } }).join("")}</div>`;
  const old=$("wkRunTop"); if(old) old.remove();
  app.insertAdjacentHTML("beforeend",wkRunStripHTML(N));
  /* wiring: Next on every step, Skip on the strip, Done, the effort question, Next time, density */
  $("train").querySelectorAll(".wk-run-go").forEach(b=>b.onclick=()=>wkRunNext());
  $("doneW").onclick=()=>wkRunEnd();
  $("wkRunSkip").onclick=()=>{ Pulse.buzz(6); const a=$("wkRunAsk"); if(!a) return; a.hidden=!a.hidden; $("wkRunTop").classList.toggle("ask",!a.hidden); clearTimeout(wkRunSkipT.t); if(!a.hidden) wkRunSkipT.t=setTimeout(()=>{ if(a.isConnected){ a.hidden=true; $("wkRunTop").classList.remove("ask"); } },4000); };
  $("wkRunKeep").onclick=()=>{ Pulse.buzz(6); $("wkRunAsk").hidden=true; $("wkRunTop").classList.remove("ask"); };
  $("wkRunSkipGo").onclick=()=>wkRunSkipAll();
  $("train").querySelectorAll("[data-drir]").forEach(b=>b.onclick=()=>{ const h=S.lifts&&S.lifts[R.ask];
    if(h&&h.length){ h[h.length-1].rir=+b.dataset.drir; save(); }
    Pulse.buzz([8,40,12]); R.ask=null; const q=$("dnEff"); if(q) q.remove(); const nx=$("dnNext"); if(nx){ nx.innerHTML=wkNextHTML(R,s); wkWireNext(s); } });
  wkWireNext(s);
  wkDensWire(R);
  TR.doneLeave=wkRunEnd;
  wkRunBody(R,keys);
  const up=sessionsN()>(R.n0||0); if(up){ Pulse.buzz([12,50,20]); try{ Pulse.audio(); Pulse.chime(5); }catch(e){} }
  wkRunShow(0);
  track("workout_run",{steps:N});
}
function wkRunSkipT(){}
/* nothing logged (22 Oct, Sahil: the end screen with no sets "looks dead"): the body stays behind, lit softly where the
   plan aims, the plan sits under it, and the way back into the workout comes first (ending again picks up from there) */
function drawDoneEmpty(R,s){
  const app=$("app"); app.classList.remove("tactive","tresting","tplan","wkrun"); app.classList.add("tdone"); TR.run=null;
  const dstr=new Date().toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});
  const items=s.items||[], tot=items.reduce((a,it)=>a+(+it.sets||0),0);
  $("train").innerHTML=`<div class="dn wk-dn wk-empty" role="dialog" aria-label="Workout complete">
    <div class="dn-top"><div class="u-eyebrow wk-dn-eye">Workout complete · ${dstr}</div><h1 class="u-h1">${uiEsc(s.title)}</h1>
      <p class="wk-run-sub">No sets were logged, so nothing changed on your body.</p></div>
    <div class="dn-low wk-empty-low">
      <div class="dn-blk"><div class="dn-h"><span>Your plan</span><b>0 of ${tot} sets</b></div>
        <div class="wk-empty-list">${items.slice(0,5).map((it,i)=>`<div style="--i:${i}"><b>${uiEsc(it.name)}</b><span>${it.sets} × ${uiEsc(String(it.target))}</span></div>`).join("")}</div>
        ${items.length>5?`<p class="wk-run-more">+${wkPlural(items.length-5,"more exercise")}</p>`:""}</div>
      <div class="wk-empty-acts"><button class="u-btn primary block" id="wkResume">Back to workout</button><button class="u-btn block" id="doneW">Done</button></div>
    </div></div>`;
  $("wkResume").onclick=()=>{ Pulse.buzz(6); TR.view="active"; TR.endArm=false; TR.resting=false; clearInterval(TR.timer); TR.timer=setInterval(tick,250); drawTrain(); $("train").scrollTop=0; };
  $("doneW").onclick=()=>{ TR.view="plan"; TR.custom=false; TR.day=todayIdx; drawTrain(); $("train").scrollTop=0; };
  wkEmptyBody(s); requestAnimationFrame(()=>Body.reframe());
}
/* the plan's muscles on the body behind: the main ones brighter, the helpers faint, turned to face them */
function wkEmptyBody(s){
  const m={}; (s.items||[]).forEach(it=>{ if(MUSCLES[it.primary]) m[it.primary]=0.85; (it.sec||[]).forEach(k=>{ if(MUSCLES[k]&&!m[k]) m[k]=0.35; }); });
  const mask=Object.entries(m), faces=mask.filter(([,v])=>v>0.5).map(([k])=>MUSCLES[k].face), back=faces.filter(f=>f>1.57).length, view=back>faces.length-back?Math.PI:0;
  TR.glowOn="empty"; Body.setXray&&Body.setXray(false); Body.setOverview&&Body.setOverview(false,false);
  if(mask.length&&Body.startDemo) Body.startDemo({move:"still",period:2.8,view,mask});
  Body.camTo&&Body.camTo({zoom:1,px:0,py:0,yaw:view},reduced?0.01:1.1);
}
/* show step i: the host goes solid or see-through, the strip moves, the step's own motion starts; the outside screens run as steps */
function wkRunShow(i){
  const r=TR.run; if(!r) return; const st=r.steps[i]; if(!st){ wkRunEnd(); return; }
  r.i=i; wkRunSeg(i);
  const host=$("train").querySelector(".wk-run"); if(host) host.classList.toggle("solid",!st.lit);
  $("train").querySelectorAll(".wk-run-s").forEach(sec=>{ sec.hidden=+sec.dataset.step!==i; });
  if(st.ext){ wkRunExt(st,i); return; }
  const sec=$("train").querySelector(`.wk-run-s[data-step="${i}"]`); if(!sec) return;
  sec.scrollTop=0; fxReplay(sec,"in"); if(reduced) sec.classList.add("in");
  const R=r.R;
  /* the numbers count up, the bars fill, the emblem rolls; reduced motion lands at once */
  sec.querySelectorAll("[data-to]").forEach((b,j)=>{ const to=+b.dataset.to, vol=b.dataset.vol, plus=b.dataset.plus; const f=v=>vol?fvol(v):plus?(b.classList.contains("wk-run-big")?`+${v} RP`:String(v)):String(v);
    if(reduced){ b.textContent=f(to); return; } setTimeout(()=>fxCount(b,0,to,900,f),250+j*180); });
  sec.querySelectorAll(".wk-rpr .u-bar").forEach((bar,j)=>{ const el=bar.querySelector("i"); setTimeout(()=>fxBar(el,+bar.dataset.f0,Math.max(0.04,+bar.dataset.f1),bar.dataset.wrap==="1",900),300+j*120); });
  if(st.id==="results"){ setTimeout(()=>{ if(sec.isConnected&&r.i===i) fxConfetti(sec,{y:0.2,count:R.prs&&R.prs.length?96:72,colors:R.prs&&R.prs.length?["--glow","--cta","--rk-4"]:["--glow","--cta","--glow-soft"]}); },reduced?0:380); }
  if(st.id==="prs"){ Pulse.buzz([12,50,20]); setTimeout(()=>{ if(sec.isConnected&&r.i===i) fxConfetti(sec,{y:0.3,count:90,colors:["--rk-4","--cta","--glow"]}); },reduced?0:320); }
  if(st.id==="gains"){ try{ Body.pulse&&Body.pulse(r.keys); }catch(e){} }
  if(st.id==="level"){ const lv=sec.querySelector(".wk-lvl"), ring=$("wkLvRing"), roll=$("wkLvRoll"), f0=+lv.dataset.f0, f1=+lv.dataset.f1, up=lv.dataset.up==="1";
    const land=()=>{ Pulse.buzz([14,60,24]); try{ Pulse.audio(); Pulse.chime(5); }catch(e){} if(sec.isConnected&&r.i===i) fxConfetti(sec,{y:0.3,count:90,colors:["--glow","--rk-4","--cta"]}); };
    if(!up||reduced||!ring){ if(ring) ring.style.strokeDasharray=`${(f1*100).toFixed(1)} 100`; if(roll) roll.classList.add("go"); if(up) setTimeout(land,reduced?0:300); return; }
    setTimeout(()=>{ ring.style.strokeDasharray="100 100"; },120);
    setTimeout(()=>{ ring.classList.add("jump"); ring.style.strokeDasharray="0 100"; void ring.getBoundingClientRect(); ring.classList.remove("jump"); ring.style.strokeDasharray=`${(f1*100).toFixed(1)} 100`; if(roll) roll.classList.add("go"); land(); },820); }
}
/* the rank-up screens, the trophies and the streak are the app's own screens, run as steps */
function wkRunExt(st,i){
  const r=TR.run, R=r.R, go=()=>{ if(r.ran===i) return; r.ran=i; wkRunNext(); };
  try{
    if(st.id==="ranks"){ const was=R.ev.shown; R.ev.shown=true; rkCelebrate.lastLabel="Next"; rkCelebrate(R,()=>{ R.ev.shown=was; delete rkCelebrate.lastLabel; go(); }); return; }
    if(st.id==="moments"){ if(typeof evMoments!=="function"){ go(); return; } R.ev.shown=false; evMoments.lastLabel="Next"; evMoments(R,()=>{ delete evMoments.lastLabel; go(); }); return; }
    if(st.id==="streak"){ wkRunStreak(go); return; }
  }catch(e){ console.warn("Ossa: run",st.id,e); }
  go();
}
function wkRunStreak(next){
  openStreak(true); const h=document.querySelector(".sk-up"); if(!h){ next(); return; }
  const no=$("skNo"); if(no) no.textContent="Next";
  const ob=new MutationObserver(()=>{ if(!h.isConnected){ ob.disconnect(); if(TR.run) TR.run.ob=null; next(); } });
  ob.observe($("app"),{childList:true}); if(TR.run) TR.run.ob=ob;
}
function wkRunNext(){
  const r=TR.run; if(!r||r.busy) return; r.busy=true; Pulse.buzz(8);
  const i=r.i, sec=$("train").querySelector(`.wk-run-s[data-step="${i}"]`);
  const go=()=>{ r.busy=false; if(i+1>=r.steps.length) wkRunEnd(); else wkRunShow(i+1); };
  if(sec&&!r.steps[i].ext&&!reduced){ sec.classList.add("out"); setTimeout(go,150); } else go();
}
/* Skip to the end: close whatever moment is up and land on the last step; nothing is lost, it is all saved */
function wkRunSkipAll(){
  const r=TR.run; if(!r) return; Pulse.buzz(6);
  document.querySelectorAll(".rk-up,.ev-up,.sk-up").forEach(h=>h.remove());
  if(r.ob){ try{ r.ob.disconnect(); }catch(e){} r.ob=null; }
  r.R.ev=r.R.ev||{}; r.R.ev.shown=true; delete rkCelebrate.lastLabel; if(typeof evMoments==="function") delete evMoments.lastLabel;
  const a=$("wkRunAsk"); if(a) a.hidden=true; const t=$("wkRunTop"); if(t) t.classList.remove("ask");
  track("workout_run_skip",{at:r.i,steps:r.steps.length});
  r.busy=false; r.ran=r.steps.length; wkRunShow(r.steps.length-1);
}
/* Done: back to the Train home, where today's quest says Done and the HUD already shows the new level and XP */
function wkRunEnd(){
  const r=TR.run; Pulse.buzz(8); wkDensClose();
  wkRunTeardown();
  TR.view="plan"; TR.custom=false; TR.day=todayIdx; TR.hub=true; drawTrain(); $("train").scrollTop=0;
  if(typeof evTrain!=="undefined"&&evTrain&&evTrain.next&&typeof evTrainNext==="function") try{ evTrainNext(); }catch(e){}
  setTimeout(()=>{ if(TR.view==="plan"&&!TR.run) vxAskReview("run"); },1200);   /* after the first run: Apple's rating prompt */
}
function wkRunTeardown(){
  const t=$("wkRunTop"); if(t) t.remove();
  const r=TR.run; if(r&&r.ob){ try{ r.ob.disconnect(); }catch(e){} }
  delete rkCelebrate.lastLabel; if(typeof evMoments==="function") delete evMoments.lastLabel;
  TR.run=null; TR.doneLeave=null; $("app").classList.remove("wkrun");
}
/* leaving Train by any other route while the run is up (nothing should, but a route or a reload-free edge case could) tidies up */
(()=>{ const _o=trainGlowOff; trainGlowOff=function(){ const v=_o.apply(this,arguments); try{ if(TR.run&&TR.view!=="done"){ document.querySelectorAll(".rk-up,.ev-up,.sk-up").forEach(h=>h.remove()); wkRunTeardown(); } }catch(e){} return v; }; })();
/* no way out by accident: the back swipe, the tab bar and the app's routes wait until Done */
(()=>{ const _gb=goBack; goBack=function(){ if($("app").classList.contains("wkrun")){ Pulse.buzz(6); return true; } return _gb.apply(this,arguments); }; })();
(()=>{ const _st=setTab; setTab=function(){ if($("app").classList.contains("wkrun")&&TR.run){ Pulse.buzz(6); return; } return _st.apply(this,arguments); }; })();
(()=>{ const _ug=uiGo; uiGo=function(){ if($("app").classList.contains("wkrun")&&TR.run){ Pulse.buzz(6); return; } return _ug.apply(this,arguments); }; })();

/* "Where your sets went" on Workout complete (density.js draws the row and opens the screen, #densP).
   Both are hooks: without density.js the page simply has no row */
function wkDensRow(R){ try{ return typeof densDoneRowHTML==="function"&&R?densDoneRowHTML(R)||"":""; }catch(e){ console.warn(e); return ""; } }
function wkDensWire(R){ try{ if(typeof densWireDone==="function"&&R) densWireDone(R); }catch(e){ console.warn(e); } }
/* leaving Workout complete closes the screen if it's still open (Done never runs closePanels) */
function wkDensClose(){ try{ const p=$("densP"); if(p) p.classList.remove("on"); }catch(e){} }

/* without WebGL the older Workout complete page shows (drawDone in ossa.html). Its two buttons still go
   through the rank-up moment first, once, so every phone sees its rank-ups and the overall one.
   It gets the "Where your sets went" row too, above its buttons, and both buttons close that screen. */
(()=>{ const _d=drawDone;
  drawDone=function(){ const v=_d.apply(this,arguments);
    try{ const R=TR.result;
      if(R&&R.sets&&Body.kind!=="gl"){
        const via=b=>{ if(!b) return; const go=b.onclick;
          b.onclick=function(e){ const self=this; wkDensClose(); if(R.rkSeen){ if(go) go.call(self,e); return; } R.rkSeen=true; rkCelebrate(R,()=>{ if(go) go.call(self,e); }); }; };
        via($("doneW")); via($("seeBody"));
        const row=wkDensRow(R), cta=$("train").querySelector(".cta");
        if(row&&cta){ cta.insertAdjacentHTML("beforebegin",row); wkDensWire(R); } } }catch(e){}
    return v; }; })();

/* the workout has no body behind it; Watch brings it up full screen until the move ends or "Back to sets" */
(()=>{ const sync=()=>{ const a=$("app"), on=!!TR.watching&&TR.view==="active"; if(a.classList.contains("twatch")===on) return;
    a.classList.toggle("twatch",on); if(Body.reframe) Body.reframe(); };   // the body's frame: full screen above the name (ossa.html's frameTo)
  const _w=trainWatch, _g=trainGlow, _o=trainGlowOff;
  trainWatch=function(){ const v=_w.apply(this,arguments); sync(); return v; };
  trainGlow=function(){ const v=_g.apply(this,arguments); sync(); return v; };
  trainGlowOff=function(){ const v=_o.apply(this,arguments); $("app").classList.remove("twatch"); return v; }; })();
