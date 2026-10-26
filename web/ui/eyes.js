/* =========================================================
   EYES (19 Oct, "Focus tab design lab"; Andrej: "yes I like it, implement it").
   Prefix ey*. Function declarations only.
   Your eyes are a 0–100 score with the Body tiers (Fragile 0–19 … Unbreakable 80+). Screen time lowers it,
   lock-ins, directives and a falling nightly total raise it. Eyes feed the Mind side through aura.
   - S.eyes = {score, hist:{date:min}, dir:{date, done:[]}, checkStreak, lastCheck, back (minutes taken back)}
   - S.onb.phoneHours from the intro's "phone" step; start score clamp(50 − h×4, 10, 45), 30 if skipped.
   - Views (focus.js fcView): "eyes" (the Eyes screen), "report" (the nightly screen-time report).
   - The Focus home gets the Eyes strip, a Lock in button and the report streak (a fcHome wrapper).
   - The intro gets the "phone" step after "sit" (onboarding.js uiObSteps): the years-on-a-screen math.
   - A 21:30 reminder: "Report in: how much screen time today?" (vxRemind).
   ========================================================= */
function eyTiers(){ return [{n:"Fragile",min:0,i:1},{n:"Stable",min:20,i:2},{n:"Strong",min:40,i:3},{n:"Forged",min:60,i:4},{n:"Unbreakable",min:80,i:5}]; }
function eyClamp(v){ return Math.max(0,Math.min(100,Math.round(+v||0))); }
function eyTier(sc){ const T=eyTiers(); let t=T[0]; T.forEach(x=>{ if(sc>=x.min) t=x; }); const nx=T.find(x=>x.min>sc); return {...t,next:nx||null,to:nx?nx.min-sc:0,c:`var(--rk-${t.i<2?3:t.i})`}; }
function eyStart(){ const h=S.onb&&+S.onb.phoneHours; return h>0?Math.max(10,Math.min(45,Math.round(50-h*4))):30; }
function eyS(){
  if(!S.eyes||typeof S.eyes!=="object") S.eyes={score:eyStart(),hist:{},dir:{date:"",done:[]},checkStreak:0,lastCheck:"",back:0};
  const E=S.eyes; if(!E.hist||typeof E.hist!=="object") E.hist={}; if(!E.dir) E.dir={date:"",done:[]}; E.score=eyClamp(E.score);
  return E;
}
function eyAdd(n,why){ const E=eyS(), s0=E.score; E.score=eyClamp(E.score+(+n||0)); save(); return E.score-s0; }
function eyHm(min){ min=Math.max(0,Math.round(+min||0)); const h=Math.floor(min/60), m=min%60; return h?`${h}h${m?` ${m}m`:""}`:`${m}m`; }

/* the eye: an almond lid, an iris in the tier colour, a haze that clears as the score rises, a dashed ring at 60+ */
function eyeSVG(sc,size){
  sc=eyClamp(sc); const t=eyTier(sc), id="ey"+Math.random().toString(36).slice(2,7), haze=(0.78*(1-Math.min(90,sc)/90)).toFixed(2);
  return `<svg class="ey-eye" viewBox="0 0 260 140" width="${size||260}" aria-hidden="true" style="--ec:${t.c}">
    <defs><radialGradient id="${id}i" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="var(--bg)"/><stop offset=".35" stop-color="var(--ec)"/><stop offset="1" stop-color="var(--surface-3)"/></radialGradient>
      <clipPath id="${id}c"><path d="M14 70 Q130 -8 246 70 Q130 148 14 70 Z"/></clipPath>
      <filter id="${id}g" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter></defs>
    <path d="M14 70 Q130 -8 246 70 Q130 148 14 70 Z" class="ey-glow" filter="url(#${id}g)"/>
    <path d="M14 70 Q130 -8 246 70 Q130 148 14 70 Z" class="ey-white"/>
    <g clip-path="url(#${id}c)"><circle cx="130" cy="70" r="44" fill="url(#${id}i)"/><circle cx="130" cy="70" r="17" class="ey-pupil"/><circle cx="143" cy="57" r="7" class="ey-hi"/>
      <rect x="0" y="0" width="260" height="140" class="ey-haze" style="opacity:${haze}"/></g>
    <path d="M14 70 Q130 -8 246 70 Q130 148 14 70 Z" class="ey-lid"/>
    ${sc>=60?`<ellipse cx="130" cy="70" rx="124" ry="66" class="ey-ring"/>`:""}
  </svg>`;
}
/* the last 7 days of reported screen time, today lime (red if it went up) */
function eyBars(o){
  const E=eyS(), days=[6,5,4,3,2,1,0].map(n=>({d:dkey(n),n,m:+E.hist[dkey(n)]||0})), max=Math.max(60,...days.map(x=>x.m));
  const up=days[6].m&&days[5].m&&days[6].m>days[5].m;
  return `<div class="ey-bars${o&&o.small?" small":""}" aria-hidden="true">${days.map(x=>`<i class="${x.n===0?(up?"up":"now"):""}${x.m?"":" none"}" style="height:${x.m?Math.max(8,x.m/max*100):6}%"></i>`).join("")}</div>`;
}

/* ---------- today's directives: three from the pool, rotated by the date ---------- */
function eyPool(){ return [
  {id:"wake",t:"No phone for the first 30 minutes",x:10},{id:"meal",t:"One meal with the phone in another room",x:8},
  {id:"delete",t:"Delete one app for 24 hours",x:12},{id:"bed",t:"Phone out of the bedroom tonight",x:10},
  {id:"walk",t:"A 1-hour walk without your phone",x:12},{id:"grey",t:"Grayscale mode for the day",x:8}]; }
function eyToday(){ const P=eyPool(), d=dkey(0), seed=+d.replace(/-/g,"")%P.length; return [0,2,4].map(k=>P[(seed+k)%P.length]); }
function eyDirTick(id){
  const E=eyS(); if(E.dir.date!==dkey(0)) E.dir={date:dkey(0),done:[]};
  const D=eyToday().find(x=>x.id===id); if(!D) return;
  const i=E.dir.done.indexOf(id);
  if(i<0){ E.dir.done.push(id); eyAdd(1); try{ auGrant(D.x,"directive"); }catch(e){} try{ hap("select"); }catch(e){ Pulse.buzz(8); } }
  else { E.dir.done.splice(i,1); eyAdd(-1); try{ auraLose(D.x,{floor:true,src:"directive"}); }catch(e){} try{ Pulse.buzz(5); }catch(e){} }
  save();
}

/* ---------- the Eyes screen ---------- */
function eyView(b){
  const E=eyS(), t=eyTier(E.score), D=eyToday(), done=E.dir.date===dkey(0)?E.dir.done:[];
  const today=+E.hist[dkey(0)]||0, wk=+E.hist[dkey(7)]||0, dlt=today&&wk?today-wk:null;
  let lv=1; try{ lv=auView().lv; }catch(e){}
  b.innerHTML=`<div class="u-screen ey-v">
    <div class="ey-top"><span></span>
      <div><h1 class="u-h1">Eyes</h1><p class="ey-sub">They feed your Mind stat</p></div>
      <span class="ey-hex" aria-label="Aura level ${lv}"><b>${lv}</b></span></div>
    <section class="ey-card" style="--ec:${t.c}">
      <div class="ey-row"><span class="u-eyebrow">Your eyes</span><span class="ey-tier">${t.n}${t.next?` · ${t.to} to ${t.next.n}`:""}</span></div>
      <b class="ey-score">${E.score}</b>
      ${eyeSVG(E.score,240)}
      <div class="ey-row"><span class="u-eyebrow">Screen time · 7 days</span><span class="ey-d ${dlt==null?"":dlt>0?"bad":"good"}">${dlt==null?"Report in tonight":`${dlt>0?"+":"−"}${eyHm(Math.abs(dlt))} vs last week`}</span></div>
      ${eyBars()}
      ${E.back>0?`<p class="ey-back">${eyHm(E.back)} taken back so far</p>`:""}
    </section>
    <div class="u-section-h"><span class="u-eyebrow">Today's directives</span><span class="ey-n">${done.length}/3</span></div>
    <div class="ey-dirs">${D.map(x=>{ const on=done.includes(x.id); return `<button class="ey-dir${on?" on":""}" data-ey="${x.id}" role="checkbox" aria-checked="${on}"><i aria-hidden="true"></i><span>${uiEsc(x.t)}</span><em>+${x.x} aura</em></button>`; }).join("")}</div>
    <button class="u-btn primary block ey-go" id="eyLock">Start lock-in</button>
    <button class="u-link ey-rep" id="eyRep">${E.lastCheck===dkey(0)?"Today's screen time is in":"Report today's screen time"} ›</button>
  </div>`;
  $("eyLock").onclick=()=>{ Pulse.buzz(8); mindGo("monk:setup"); };
  $("eyRep").onclick=()=>{ Pulse.buzz(6); mindGo("report"); };
  b.querySelectorAll("[data-ey]").forEach(x=>x.onclick=()=>{ const r=x.getBoundingClientRect(), was=x.classList.contains("on"); eyDirTick(x.dataset.ey);
    if(!was&&typeof fgPop==="function"){ const D1=eyToday().find(y=>y.id===x.dataset.ey); fgPop(r.right-40,r.top,`+${D1?D1.x:8} aura`); } eyView(b); });
}

/* ---------- the nightly report ---------- */
function eyReport(b){
  const E=eyS(), y=+E.hist[dkey(1)]||(S.onb&&+S.onb.phoneHours?Math.round(S.onb.phoneHours*60):0), U=eyReport.u||(eyReport.u={v:+E.hist[dkey(0)]||Math.max(60,Math.min(600,y||300))});
  const pts=v=>y?Math.max(-8,Math.min(8,Math.round((y-v)/10))):0;
  const line=v=>{ if(!y) return "Your first report sets the line to beat."; const d=y-v; return d>0?`${eyHm(d)} less than yesterday. Your eyes are clearing.`:d<0?`${eyHm(-d)} more than yesterday. Your eyes are clouding.`:"Same as yesterday."; };
  const draw=()=>{ const v=U.v, p=pts(v), sc=eyClamp(E.score+p);
    $("eyRv").textContent=eyHm(v); $("eyRl").textContent=line(v); $("eyRl").className="ey-rl "+(p>0?"good":p<0?"bad":"");
    $("eyRe").innerHTML=eyeSVG(sc,200); $("eyRp").textContent=`${p>0?"+":""}${p} eyes`; };
  b.innerHTML=`<div class="u-screen ey-v ey-rep-v">
    <div class="ey-top"><span></span><div><h1 class="u-h1">Report in</h1><p class="ey-sub">Settings › Screen Time › today's total</p></div><span></span></div>
    <section class="ey-card"><b class="ey-big" id="eyRv"></b>
      <input type="range" id="eyR" min="60" max="600" step="10" value="${U.v}" aria-label="Today's screen time">
      <div class="ey-scale"><span>1h</span><span>10h</span></div>
      <div id="eyRe" class="ey-prev"></div><p class="ey-rl" id="eyRl"></p><p class="ey-pts" id="eyRp"></p></section>
    <button class="u-btn primary block" id="eyRs">Log it · +5 aura</button>
  </div>`;
  $("eyR").oninput=e=>{ U.v=+e.target.value; draw(); };
  $("eyRs").onclick=()=>{ eyLog(U.v); const r=$("eyRs").getBoundingClientRect(); if(typeof fgPop==="function") fgPop(r.left+r.width/2,r.top,`${pts(U.v)>=0?"+":""}${pts(U.v)} eyes · +5 aura`); try{ hap("success"); }catch(e){} setTimeout(()=>mindGo("eyes"),700); };
  draw();
}
function eyLog(min){
  const E=eyS(), d=dkey(0), first=E.lastCheck!==d, y=+E.hist[dkey(1)]||(S.onb&&+S.onb.phoneHours?Math.round(S.onb.phoneHours*60):0);
  const p=y?Math.max(-8,Math.min(8,Math.round((y-min)/10))):0;
  E.hist[d]=Math.round(min);
  if(first){ E.checkStreak=E.lastCheck===dkey(1)?(+E.checkStreak||0)+1:1; E.lastCheck=d; eyAdd(p); try{ auGrant(5,"report"); }catch(e){} if(y>min) E.back=(+E.back||0)+(y-min); }
  const cut=dkey(60); Object.keys(E.hist).forEach(k=>{ if(k<cut) delete E.hist[k]; });
  save(); try{ track("eyes_report",{min,p}); }catch(e){}
}
/* 21:30 every night, unless today's report is in */
function eyRemind(){
  try{ if(!S.body) return []; const E=eyS(), out=[], now=Date.now();
    for(let n=0;n<3;n++){ const t=new Date(); t.setDate(t.getDate()+n); t.setHours(21,30,0,0); if(t.getTime()<=now+60000) continue; if(n===0&&E.lastCheck===dkey(0)) continue;
      out.push({at:t.getTime(),go:"report",title:"Report in",body:"How much screen time today?"}); }
    return out; }catch(e){ return []; }
}

/* ---------- the Focus home: the Eyes strip, Lock in, the report streak ---------- */
function eyStripHTML(){
  const E=eyS(), t=eyTier(E.score);
  return `<button class="ey-strip" data-fc="eyes" style="--ec:${t.c}" aria-label="Your eyes: ${E.score}, ${t.n}. Open Eyes">${eyeSVG(E.score,56)}
    <span class="ey-st"><b>${E.score}</b><small>${t.n}${t.next?` · ${t.to} to ${t.next.n}`:""}</small></span>${eyBars({small:true})}</button>`;
}
(()=>{ const _h=fcHome; fcHome=function(b,M,more){
  const v=_h.apply(this,arguments);
  try{ if(!more&&b){ const dial=b.querySelector(".fc-under"), lv=b.querySelector(".fc-lv"); if(dial){ const E=eyS(), pre=fcMonkPre();
      const fm=b.querySelector(".fc-main"); if(fm) fm.classList.add("ey-on");
      if(lv) lv.outerHTML=eyStripHTML(); else dial.insertAdjacentHTML("beforebegin",eyStripHTML());
      dial.insertAdjacentHTML("afterend",`<button class="u-btn lime block ey-lock" data-fc="monk:setup">Lock in · ${pre} min</button>`);
      const ci=b.querySelector('.fc-under [data-fc="checkin"]'); if(ci&&E.checkStreak>1) ci.insertAdjacentHTML("beforeend",`<em class="ey-streak">${E.checkStreak} days</em>`);
      b.querySelectorAll(".ey-lock,.ey-strip").forEach(x=>x.onclick=()=>{ Pulse.buzz(8); mindGo(x.dataset.fc); }); } } }catch(e){ console.warn("Ossa: eyes home",e); }
  return v; }; })();
function eyReg(){ try{ fcView("eyes",{render:b=>eyView(b)}); fcView("report",{render:b=>eyReport(b)}); }catch(e){ console.warn("Ossa: eyes views",e); } }
eyReg();
vxRemind(eyRemind);

/* ---------- the intro: "How long are you on your phone each day?" ---------- */
async function uiObPhone(alive,can){
  await say("How long are you on your *phone* each day?"); if(!alive()) return;
  const yrs=h=>Math.round(h/24*64);
  return new Promise(res=>{
    let h=+OBD.phoneHours||6;
    const a=obAsk(`<div class="ey-ob"><b class="ey-obh" id="eyObH"></b>
      <input type="range" id="eyObR" min="1" max="12" step="0.5" value="${h}" aria-label="Hours on your phone a day">
      <div class="ey-scale"><span>1h</span><span>avg teen 7h 22m</span><span>12h</span></div>
      <div class="ey-math"><span class="u-eyebrow">The math</span><b class="ey-yrs" id="eyObY"></b><p>years of the next 64 spent looking at a screen.</p>
        <div class="ey-grid" id="eyObG" aria-hidden="true"></div><small>Each square is one year, from age 16 to 80.</small></div>
      <button class="btn primary big" id="eyObOk">Take them back</button></div>`);
    const draw=()=>{ const n=yrs(h); $("eyObH").textContent=(h%1?`${Math.floor(h)}h 30m`:`${h}h`); $("eyObY").textContent=n;
      $("eyObG").innerHTML=Array.from({length:64},(_,i)=>`<i class="${i>=64-n?"hot":""}"></i>`).join(""); };
    a.querySelector("#eyObR").oninput=e=>{ h=+e.target.value; draw(); try{ Pulse.buzz(3); }catch(x){} };
    a.querySelector("#eyObOk").onclick=()=>{ OBD.phoneHours=h; obBackOn(null); Pulse.buzz(10); a.innerHTML=""; res("ok"); };
    draw();
  });
}
/* the answer reaches S with the rest of the intro */
(()=>{ const _c=uiObCommit; uiObCommit=function(){ const v=_c.apply(this,arguments);
  try{ if(OBD.phoneHours){ S.onb=Object.assign({},S.onb||{},{phoneHours:+OBD.phoneHours}); if(!S.eyes) eyS(); else if(!S.eyes.hist||!Object.keys(S.eyes.hist).length) S.eyes.score=eyStart(); save(); } }catch(e){}
  return v; }; })();
/* the nightly reminder opens the report; a lock-in running at launch tells the phone again (the app may have restarted) */
vxRoute("report",()=>{ try{ if(typeof uiFocusOpen==="function") uiFocusOpen("report"); else { MIND.next="report"; openMind(); } }catch(e){ console.warn(e); } });
window.addEventListener("load",()=>setTimeout(()=>{ try{ if(typeof mmRun==="function"&&mmRun()) nsend({t:"lockin",on:true,title:"Your lock-in is breaking",body:"Come back to Ossa in 10 seconds to save it."}); }catch(e){} },1500));
/* the phone's real system bar sizes (App.js, Android): the safe-area tokens --sat/--sab take the larger of these and env() */
vxOn("native",m=>{ try{ if(!m||m.t!=="insets") return; const r=document.documentElement.style;
  r.setProperty("--nst",(Math.max(0,+m.top||0))+"px"); r.setProperty("--nsb",(Math.max(0,+m.bottom||0))+"px"); }catch(e){} });
