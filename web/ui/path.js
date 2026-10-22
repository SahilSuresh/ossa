/* =========================================================
   YOUR PATH — Ossa 2.0 Phase 5 "Evolve" (package: path, prefix pth / .pth-)
   One job: read your Tank/Scout radar, then choose or switch your path.

   Rules (game rules, labelled as such in the copy):
   - The radar is read from day one: the last 30 days of workouts and lift sets (pthStats).
     Tank = Strength, Load, Volume. Scout = Stamina, Steps, Pace. A lean needs a 10-point gap.
   - Choosing opens at Overall Strong I (40). You can switch once a week (S.path.next).
   - Perks: +10% RP on matching sets (Tank: heavy sets; Scout: sets of 15+, holds and carries),
     a matching dare mix, and the body's look (look-fx.js reads pthArchNow()).
   - The +10% goes through vessel.js's rpBonus provider seam (vxBonusL), never a copy of the formula:
     pthBonus builds ONE list of matching sets and calls vxLoad once, so the 1.8 helper cap
     applies to the bonus exactly as it does to the session.

   State (saved): S.path = {v:1, arch:null|"tank"|"scout", at:null|"YYYY-MM-DD", next:null|"YYYY-MM-DD", n:0}
     created lazily by pthState(); only pthChoose() writes it. Load demo / Start fresh drop it.
   Readers (pure, safe anywhere): pthK() (EV_PATH), pthArchNow(), pthStats(), pthCanChoose(), pthTile().
   Hooks: vxOn("rpBonus") provider, vxOn("dareMix") provider, vxOn("credit") stash, vxOn("workout") → R.ev.path.
   View: evView("path") (evolve.js), the radar numbers in evSheet.
   Start-up: function declarations only, state on function properties; include-time code only in the IIFE.
   ========================================================= */

/* EV_PATH: every number the path uses */
function pthK(){ return pthK.k||(pthK.k={days:30,minSessions:6,balanced:10,unlock:40,switchDays:7,bonus:0.10,
  heavyReps:6,heavyPct:0.8,endureReps:15,holdS:30,
  tStrength:30,tLoad:40000,tVolume:120,tStamina:30,tSteps:10000,paceLo:0.25,paceHi:0.5}); }

function pthIsArch(a){ return a==="tank"||a==="scout"; }
function pthName(a){ return a==="scout"?"Scout":"Tank"; }
/* the chosen path or null (a reader: never creates S.path) */
function pthCur(){ try{ const a=S&&S.path&&S.path.arch; return pthIsArch(a)?a:null; }catch(e){ return null; } }
/* S.path, created lazily (not saved here: the next save carries it) */
function pthState(){
  const p=S.path;
  if(!p||typeof p!=="object"||p.v!==1) S.path={v:1,arch:null,at:null,next:null,n:0};
  else if(!pthIsArch(p.arch)) p.arch=null;
  return S.path;
}
/* for render (look-fx.js), safe inside a GL draw: no save, no DOM */
function pthArchNow(){ const a=pthCur(); return a?{a,amt:1}:{a:null,amt:0}; }

/* ---------- what counts as a heavy or an endurance set ---------- */
function pthE1(kg,r){ try{ if(typeof trE1==="function") return trE1(kg,r); }catch(e){} return kg>0&&r>0?kg*(1+Math.min(r,12)/30):0; }
/* the best estimated max over every retained set of that exercise (S.lifts; today's sets aren't in yet when vxCredit runs) */
function pthBest(name){
  let E=0; ((S.lifts||{})[name]||[]).forEach(h=>((h&&h.sets)||[]).forEach(x=>{ if(x){ const e=pthE1(+x.kg,+x.r); if(e>E) E=e; } }));
  return E;
}
function pthCarry(name){ try{ const x=typeof exInfo==="function"?exInfo(name):null; return !!(x&&x.pattern==="carry"); }catch(e){ return false; } }
function pthStretch(name){ try{ return typeof vxIsStretch==="function"&&vxIsStretch(name); }catch(e){ return false; } }
function pthHeavy(x,E){ const K=pthK(); if(!x) return false; const r=+x.r||0, kg=+x.kg||0;
  return (r>0&&r<=K.heavyReps)||(kg>0&&r>0&&E>0&&kg>=K.heavyPct*E); }
function pthEndure(x,carry){ const K=pthK(); if(!x) return false; return (+x.r||0)>=K.endureReps||(+x.s||0)>=K.holdS||!!carry; }
/* a workout: how many of the logged sets match the path */
function pthSetsMatch(logs,name,arch){
  if(!Array.isArray(logs)||!logs.length) return 0;
  let m=0;
  if(arch==="tank"){ const E=pthBest(name); logs.forEach(x=>{ if(pthHeavy(x,E)) m++; }); }
  else{ const c=pthCarry(name); logs.forEach(x=>{ if(pthEndure(x,c)) m++; }); }
  return m;
}
/* a quick log has no sets, only its dose ("8-10", "30 s", "12 each side", "2 min"): the upper bound counts.
   A hold with no number ("max hold", Dead hang) is held as long as you can, so it counts as a full hold (holdS):
   a hold for Scout, never heavy for Tank (it has seconds, not reps). "AMRAP" has no number and matches neither. */
function pthDose(t){
  t=String(t==null?"":t);
  let m=t.match(/(\d+)(?:\s*[-–]\s*(\d+))?\s*(s|sec|secs|seconds)\b/i); if(m) return {s:+(m[2]||m[1])};
  m=t.match(/(\d+)(?:\s*[-–]\s*(\d+))?\s*(min|mins|minutes)\b/i); if(m) return {s:60*+(m[2]||m[1])};
  if(/\bhold\b/i.test(t)&&!/\d/.test(t)) return {s:pthK().holdS,max:true};
  m=t.match(/(\d+)(?:\s*[-–]\s*(\d+))?/); return m?{r:+(m[2]||m[1])}:{};
}
function pthDoseMatch(it,arch){
  const K=pthK(), x=pthDose(it&&it.target);
  if(arch==="tank") return x.s==null&&x.r>0&&x.r<=K.heavyReps;
  return (x.r||0)>=K.endureReps||(x.s||0)>=K.holdS||pthCarry(it&&it.name);
}

/* ---------- the perks (providers read by vessel.js and ranks.js) ---------- */
/* rpBonus: extra load = 10% of the load from the matching sets alone ({} without a path) */
function pthBonus(ctx,X){
  pthBonus.last=null;
  const arch=pthCur();
  if(!arch||!ctx||!Array.isArray(ctx.items)||ctx.none) return {};
  const K=pthK(), items=ctx.items;
  const d=i=>ctx.done?(+ctx.done[i]||0):(+((items[i]||{}).sets)||0);
  const M=items.map((it,i)=>{ const n=d(i); if(!(n>0)||!it||it.mob||pthStretch(it.name)) return 0;
    return Math.min(n,ctx.src==="quick"?(pthDoseMatch(it,arch)?n:0):pthSetsMatch(ctx.logs&&ctx.logs[i],it.name,arch)); });
  const n=M.reduce((a,b)=>a+b,0); if(!n) return {};
  const Y=vxLoad(items,M,ctx.none), B={};
  Object.keys(Y.L).forEach(k=>{ B[k]=K.bonus*Y.L[k]; });   // Y.L[k] ≤ X.L[k], so B ≤ 10%; vxBonusL clamps at 10% too
  pthBonus.last={arch,n,src:ctx.src};
  return B;
}
/* credit runs inside vxCredit, before the save: only stash what the bonus did */
function pthOnCredit(C){
  const L=pthBonus.last; pthBonus.last=null;
  pthOnCredit.last=L&&C&&C.src===L.src?{src:C.src,arch:L.arch,n:L.n,rp:Object.values(C.bonus||{}).reduce((a,b)=>a+(+b||0),0)}:null;
}
/* after the save, before Workout complete draws: fill only our own key */
function pthOnWorkout(rec,R){
  const L=pthOnCredit.last; pthOnCredit.last=null;
  if(!R||!L||L.src!=="workout"||!(L.n>0)) return;
  R.ev=R.ev||{}; R.ev.path={arch:L.arch,n:L.n,rp:L.rp};
}
/* dareMix: Tank leans to lift dares (they still need a fading muscle), Scout to steps and mobility */
function pthDareMix(){
  const a=pthCur();
  return a==="tank"?{lift:0.65}:a==="scout"?{lift:0.35,life:["steps","mob","steps","mob","cold","phone","protein"]}:null;
}

/* ---------- the radar ---------- */
function pthFmt(n){ return Math.round(+n||0).toLocaleString("en-GB"); }
function pthSrc(){ try{ return typeof HSRC==="function"?HSRC():"Apple Health"; }catch(e){ return "Apple Health"; } }
/* {axes:[{id,label,v,raw,unit}], tank, scout, lean, n, few, need}. Cached until the data changes */
function pthStats(){
  const K=pthK(), cut=dkey(K.days-1), today=dkey(0), WS=Array.isArray(S.workouts)?S.workouts:[], H=S.health;
  const last=WS[WS.length-1], LF=S.lifts||{};
  const key=[today,WS.length,last&&last.end,Object.keys(LF).length,H&&H.on,H&&H.at,H&&H.steps?Object.keys(H.steps).length:0].join("|");
  const c=pthStats.c; if(c&&c.s===S&&c.key===key) return c.v;
  const W=WS.filter(w=>w&&w.d>=cut&&(+w.sets>0)&&w.kind!=="mobility");   // §4.5: posture sessions count (they earn RP)
  const n=W.length;
  let heavy=0, endure=0;
  Object.keys(LF).forEach(name=>{
    const hs=Array.isArray(LF[name])?LF[name].filter(h=>h&&h.d>=cut):[];
    if(!hs.length||pthStretch(name)) return;
    const E=pthBest(name), car=pthCarry(name);
    hs.forEach(h=>(h.sets||[]).forEach(x=>{ if(pthHeavy(x,E)) heavy++; if(pthEndure(x,car)) endure++; }));
  });
  const sum=f=>W.reduce((a,w)=>a+(+w[f]||0),0), vol=sum("vol"), sets=sum("sets"), mins=sum("mins");
  const pc=(x,t)=>Math.max(0,Math.min(100,100*x/t));
  /* steps: whole days only (today's partial count is left out), at least 3 of them */
  let steps=null, sRaw;
  const on=!!(H&&H.on&&H.steps&&typeof H.steps==="object");
  if(on){ const ds=Object.keys(H.steps).filter(d=>d>=cut&&d<today&&H.steps[d]!=null&&isFinite(+H.steps[d]));
    if(ds.length>=3){ const m=ds.reduce((a,d)=>a+(+H.steps[d]),0)/ds.length; steps=pc(m,K.tSteps); sRaw=`${pthFmt(m)} a day`; }
    else sRaw="Needs 3 days of steps"; }
  else sRaw=`Connect ${pthSrc()}`;
  const pace=mins>0?Math.max(0,Math.min(1,(sets/mins-K.paceLo)/(K.paceHi-K.paceLo)))*100:null;
  const st=pc(heavy,K.tStrength), ld=pc(vol,K.tLoad), vo=pc(sets,K.tVolume), sa=pc(endure,K.tStamina);
  const s=(x,w)=>`${pthFmt(x)} ${w}${Math.round(x)===1?"":"s"}`;
  const axes=[
    {id:"strength",label:"Strength",v:Math.round(st),raw:s(heavy,"heavy set"),unit:"sets"},
    {id:"load",label:"Load",v:Math.round(ld),raw:`${pthFmt(vol)} kg`,unit:"kg"},
    {id:"volume",label:"Volume",v:Math.round(vo),raw:s(sets,"set"),unit:"sets"},
    {id:"stamina",label:"Stamina",v:Math.round(sa),raw:s(endure,"endurance set"),unit:"sets"},
    {id:"steps",label:"Steps",v:steps==null?null:Math.round(steps),raw:sRaw,unit:"steps a day"},
    {id:"pace",label:"Pace",v:pace==null?null:Math.round(pace),raw:pace==null?"No sessions yet":`${(mins/Math.max(1,sets)).toFixed(1)} min a set`,unit:"sets a minute"}];
  const sc=[sa,steps,pace].filter(v=>v!=null);
  const tank=Math.round((st+ld+vo)/3), scout=Math.round(sc.reduce((a,b)=>a+b,0)/sc.length);
  const lean=tank-scout>=K.balanced?"tank":scout-tank>=K.balanced?"scout":"balanced";
  const few=n<K.minSessions;
  const v={axes,tank,scout,lean,n,few,need:few?K.minSessions-n:0};
  pthStats.c={s:S,key,v};
  return v;
}
/* {ok, pts, next, arch, lock}: opens at Strong I; a switch waits for S.path.next */
function pthCanChoose(){
  const K=pthK(); let o=0; try{ o=overall(); }catch(e){}
  const pts=Math.max(0,Math.ceil(K.unlock-o)), arch=pthCur(), nx=arch&&S.path&&S.path.next?S.path.next:null;
  return {ok:pts===0&&(!nx||dkey(0)>=nx),pts,next:nx,arch,lock:pts>0};
}
function pthChoose(arch){
  if(!pthIsArch(arch)) return false;
  const c=pthCanChoose(); if(!c.ok||c.arch===arch) return false;
  const K=pthK(), old=pthState();
  S.path={v:1,arch,at:dkey(0),next:dkey(-K.switchDays),n:(+old.n||0)+1};
  save();
  try{ if(typeof bxKick==="function") bxKick(); }catch(e){ console.warn(e); }
  vxEmit("evolve",{what:"path",arch});
  const pc=Math.round(K.bonus*100);
  toast(arch==="tank"?`Tank path on. Heavy sets earn ${pc}% more RP.`:`Scout path on. Sets of ${K.endureReps}+, holds and carries earn ${pc}% more RP.`);
  try{ track("path_choose",{arch}); }catch(e){}
  return true;
}

/* ---------- the hub tile (pure) ---------- */
function pthTile(){
  const a=pthCur(), c=pthCanChoose();
  if(a) return {sub:pthName(a),bar:null,c:"var(--glow)",dot:false};
  const st=pthStats();
  const sub=st.few?`Train ${st.need} more time${st.need===1?"":"s"}`:st.lean==="balanced"?"Balanced":`Leaning ${pthName(st.lean)}`;
  /* the dot: it has just opened and you've never chosen */
  return {sub,bar:null,c:c.lock?"var(--text-2)":"var(--glow)",dot:c.ok&&!(+((S.path||{}).n)>0)};
}
function pthDemoSeed(){ return false; }   // nothing: the demo leaves the path unchosen so the choose flow shows

/* ---------- the view ---------- */
function pthLocal(){ try{ return /^(localhost|127\.0\.0\.1)$/.test(location.hostname); }catch(e){ return false; } }
/* the two figures can show the shape: WebGL, and render's arch effect (before render lands: the preview only) */
function pthShapeOk(){
  try{ if(typeof Body==="undefined"||!Body||Body.kind!=="gl"||typeof Body.shot!=="function") return false;
    return typeof bxOk==="function"?!!bxOk("arch"):pthLocal(); }catch(e){ return false; }
}
function pthPx(el){
  try{ if(typeof evPx==="function") return evPx(el); }catch(e){}
  const r=el.getBoundingClientRect(), k=Math.min(window.devicePixelRatio||1,2.5);
  return [Math.round(r.width*k),Math.round(r.height*k)];
}
/* a framed still from above the knee to the top of the head (the head tops out near 1.81 m, so the frame is
   0.57-1.83 m: about 2 px a centimetre at 390x844), cached per look, size and scores */
function pthShot(a,el){
  const sz=pthPx(el); if(!sz||!(sz[0]>0&&sz[1]>0)) return null;
  const look=uiSafe(()=>typeof bxLookKey==="function"?bxLookKey():"","");
  const key=[S.body||"m",a,sz[0],sz[1],look,S.finish||"",dkey(0),GLORDER.map(k=>Math.round(+S.scores[k]||0)).join(",")].join("|");
  const c=pthShot.c||(pthShot.c=[]), hit=c.find(e=>e.key===key); if(hit) return hit.url;
  let url=null;
  try{ url=Body.shot({at:[0,1.2,0],span:1.26,yaw:0.35,size:sz,fx:{look:{arch:{a,amt:1}}}}); }catch(e){ console.warn(e); url=null; }
  if(url){ c.unshift({key,url}); c.length=Math.min(c.length,4); }
  return url;
}
function pthPerks(a){
  const K=pthK(), pc=Math.round(K.bonus*100), I=typeof UI_IC==="object"?UI_IC:{};
  const L=a==="scout"
    ?[{ic:"bolt",t:`+${pc}% RP on sets of ${K.endureReps}+, holds and carries`},{ic:"pulse",t:"Dares lean to steps and mobility"}]
    :[{ic:"bolt",t:`+${pc}% RP on heavy sets`,br:` (${K.heavyReps} reps or fewer, or ${Math.round(K.heavyPct*100)}% of your best)`},{ic:"train",t:"More lift dares when a muscle is fading"}];
  return L.map(p=>`<li class="pth-perk"><i aria-hidden="true">${I[p.ic]||""}</i><span>${uiEsc(p.t)}${p.br?`<span class="pth-br">${uiEsc(p.br)}</span>`:""}</span></li>`).join("");
}
function pthDay(d){ try{ return new Date(d+"T12:00").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"}); }catch(e){ return d; } }
/* the one button: {t, off} */
function pthBtn(sel){
  const c=pthCanChoose(), cur=c.arch, K=pthK();
  let rk="Strong I"; try{ rk=rankOf(K.unlock); }catch(e){}
  const lock={t:`Opens at ${rk} · ${c.pts} RP to go`,off:true};
  if(cur===sel) return {t:`On the ${pthName(cur)} path`,off:true};
  if(c.lock) return lock;
  if(!cur) return {t:`Choose ${pthName(sel)}`,off:false};
  if(!c.ok) return {t:`Switch from ${pthDay(c.next)}`,off:true};
  return {t:`Switch to ${pthName(sel)}`,off:false};
}
/* the 6-axis radar: Tank's axes on the left, Scout's on the right. viewBox 100, sized by CSS */
function pthRadar(st){
  const ang={strength:240,load:180,volume:120,stamina:300,steps:0,pace:60}, R=44, P=(deg,r)=>{ const t=deg*Math.PI/180; return [50+r*Math.cos(t),50+r*Math.sin(t)]; };
  const f=p=>p.map(v=>v.toFixed(1)).join(",");
  const order=["strength","stamina","steps","pace","volume","load"].sort((a,b)=>((ang[a]+90)%360)-((ang[b]+90)%360));
  const ring=k=>order.map(id=>f(P(ang[id],R*k))).join(" ");
  const ax=id=>st.axes.find(a=>a.id===id);
  const spokes=order.map(id=>{ const e=P(ang[id],R), nul=ax(id).v==null; return `<line class="${nul?"pth-nul":""}" x1="50" y1="50" x2="${e[0].toFixed(1)}" y2="${e[1].toFixed(1)}"/>`; }).join("");
  const pts=order.filter(id=>ax(id).v!=null).map(id=>P(ang[id],R*Math.max(3,ax(id).v)/100));
  const dots=pts.map(p=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="1.8"/>`).join("");
  return `<svg class="pth-radar${st.few?" few":""}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <g class="pth-grid"><polygon points="${ring(1)}"/><polygon points="${ring(2/3)}"/><polygon points="${ring(1/3)}"/>${spokes}</g>
    <polygon class="pth-poly" points="${pts.map(f).join(" ")}"/><g class="pth-dots">${dots}</g></svg>`;
}
function pthLeanTxt(st){ return st.lean==="balanced"?"Balanced":`Leaning ${pthName(st.lean)}`; }
/* the six raw numbers, in a sheet */
function pthSheet(){
  if(typeof evSheet!=="function") return;
  const st=pthStats(), row=a=>`<div class="pth-sr${a.v==null?" nul":""}"><b>${uiEsc(a.label)}</b><span>${uiEsc(a.raw)}</span></div>`;
  const g=(name,score,ids)=>`<div class="pth-sg"><span class="u-eyebrow">${name}</span><em>${score}</em></div>${ids.map(id=>row(st.axes.find(a=>a.id===id))).join("")}`;
  evSheet(`<div class="pth-sh"><h3 class="pth-sh-t">Last ${pthK().days} days</h3>
    <p class="pth-sh-s">${st.n} session${st.n===1?"":"s"}</p>
    ${g("Tank",st.tank,["strength","load","volume"])}${g("Scout",st.scout,["stamina","steps","pace"])}</div>`,()=>{});
}
/* paint the parts that follow the selection (no new stills) */
function pthPaint(b,o){
  const sel=o.sel;
  b.querySelectorAll(".pth-fig").forEach(f=>{ const on=f.dataset.a===sel; f.classList.toggle("on",on); f.classList.toggle("dim",!on); f.setAttribute("aria-pressed",on?"true":"false"); });
  const pk=b.querySelector(".pth-perks"); if(pk){ pk.innerHTML=pthPerks(sel); pk.setAttribute("aria-label",`${pthName(sel)} perks`); }
  const B=pthBtn(sel), go=b.querySelector(".pth-go");
  if(go){ go.textContent=B.t; go.disabled=!!B.off; go.classList.toggle("off",!!B.off);
    go.onclick=()=>{ if(B.off) return; try{ Pulse.buzz([10,40,14]); }catch(e){}
      if(pthChoose(sel)&&typeof evRefresh!=="function") pthRender(b,o); }; }
}
function pthRender(b,o){
  o=o||{};
  const st=pthStats(), cur=pthCur();
  if(!pthIsArch(o.sel)) o.sel=cur||(!st.few&&st.lean==="scout"?"scout":"tank");
  const shape=pthShapeOk();
  const fig=a=>`<button class="pth-fig${shape?"":" plain"}${o.sel===a?" on":" dim"}" data-a="${a}" aria-label="${pthName(a)}${cur===a?", your path":""}">
      <span class="pth-shot" role="img" aria-label="Your body as a ${pthName(a)}">${shape?`<img alt="" draggable="false">`:`<b>${pthName(a)}</b>`}</span>
      <span class="pth-nm">${shape?pthName(a):""}${cur===a?`<em class="pth-yours">Yours</em>`:""}</span></button>`;
  const right=st.few
    ?`<span class="pth-rt"><span class="u-eyebrow">Last ${pthK().days} days</span><small class="pth-few">Train ${st.need} more time${st.need===1?"":"s"} this month to read your path.</small></span>`
    :`<span class="pth-rt"><span class="u-eyebrow">Last ${pthK().days} days</span><b>${pthLeanTxt(st)}</b><small>Tank ${st.tank} · Scout ${st.scout}</small></span>`;
  const say=st.few?`Your path: train ${st.need} more time${st.need===1?"":"s"} to read it.`:`Your path over the last ${pthK().days} days: ${pthLeanTxt(st)}, Tank ${st.tank}, Scout ${st.scout}.`;
  b.innerHTML=`<div class="pth">
    <div class="pth-figs" role="group" aria-label="Tank or Scout">${fig("tank")}${fig("scout")}</div>
    <button class="pth-rd" aria-label="${uiEsc(say)} Show the numbers">${pthRadar(st)}${right}${typeof UI_IC==="object"?UI_IC.chev:""}</button>
    <ul class="pth-perks"></ul>
    <button class="u-btn primary block pth-go"></button></div>`;
  /* the stills, taken now (before the panel shows), sized from the laid-out boxes */
  if(shape){
    const imgs=[...b.querySelectorAll(".pth-fig")].map(f=>({a:f.dataset.a,box:f.querySelector(".pth-shot"),img:f.querySelector("img")}));
    const urls=imgs.map(x=>pthShot(x.a,x.box));
    if(urls.every(Boolean)) imgs.forEach((x,i)=>{ x.img.src=urls[i]; });
    else b.querySelectorAll(".pth-fig").forEach(f=>{ const a=f.dataset.a; f.classList.add("plain"); f.querySelector(".pth-shot").innerHTML=`<b>${pthName(a)}</b>`; f.querySelector(".pth-nm").innerHTML=cur===a?`<em class="pth-yours">Yours</em>`:""; });
  }
  b.querySelectorAll(".pth-fig").forEach(f=>{ f.onclick=()=>{ if(o.sel===f.dataset.a) return; try{ Pulse.buzz(6); }catch(e){} o.sel=f.dataset.a; pthPaint(b,o); }; });
  b.querySelector(".pth-rd").onclick=()=>{ try{ Pulse.buzz(6); }catch(e){} pthSheet(); };
  pthPaint(b,o);
}

/* ---------- include time ---------- */
(()=>{ try{
  if(typeof evView==="function") evView("path",{title:"Your path",render:pthRender});
  vxOn("rpBonus",pthBonus);
  vxOn("credit",pthOnCredit);
  vxOn("workout",pthOnWorkout);
  vxOn("dareMix",pthDareMix);
}catch(e){ console.warn("Ossa: path.js",e); } })();
