/* =========================================================
   THE FORGE (19 Oct, "Train tab design lab"; Andrej: "yes I like your idea, implement it").
   Mockups: https://claude.ai/artifact/FxKHBaUx66eHLinSt1zB1Y. Prefix fg*. Function declarations only.
   - The cold-muscle swap: a sheet of every muscle coloured by stateOf (fading and never-trained picked),
     one move each for your kit, total RP and minutes, "Start this workout" opens the Session screen with them.
   - The side quest ticks in place: a checkbox row, +15 RP (vxBonusXp) with a pop, the dare struck through.
   - The workout: a ghost line (last time's best set of this lift; beat it for +5 RP once per exercise),
     a +RP pop from Log set, a heat colour on the muscle meter (cooling, warm, hot by sets this session),
     and the rest countdown in a draining ring (r 46, so ossa.html's tick drives it as before).
   The quest card's reason line, chips, cleared and rest-day states live in deck.js (dkQuestHTML).
   ========================================================= */
function fgS(){ return fgS.s||(fgS.s={sel:null}); }

/* ---------- the +RP pop ---------- */
function fgPop(x,y,text,cls){
  const app=$("app"); if(!app) return;
  const r=app.getBoundingClientRect(), el=document.createElement("div");
  el.className="fg-pop"+(cls?" "+cls:""); el.textContent=text;
  el.style.left=(x-r.left)+"px"; el.style.top=(y-r.top-8)+"px";
  app.appendChild(el); setTimeout(()=>{ try{ el.remove(); }catch(e){} },950);
}
function fgPopAt(node,text,cls){ if(!node) return; const b=node.getBoundingClientRect(); fgPop(b.left+b.width/2,b.top,text,cls); }

/* ---------- the cold-muscle swap ---------- */
function fgHeat(k){
  const st=stateOf(k);
  if(st==="recovering") return {c:"rec",t:`back in ${Math.max(1,Math.round(hoursLeft(k)))}h`};
  if(st==="new") return {c:"grey",t:"never trained"};
  if(st==="fading") return {c:"fade",t:"fading"};
  const fresh=(S.log||[]).some(e=>e.d===dkey(0)&&e.m&&e.m[k]>0)||(S.log||[]).some(e=>e.d===dkey(1)&&e.m&&e.m[k]>0);
  return fresh?{c:"hot",t:"hot"}:{c:"ready",t:"ready"};
}
function fgColdItems(ks){
  const a=rdtA(), seen=new Set(), items=[];
  ks.forEach(k=>{ try{ const nm=rdtEx(k,a); if(!nm||seen.has(nm)) return; seen.add(nm); items.push(mkItem(nm,doseFor(nm,a,3),k)); }catch(e){} });
  return items;
}
function fgColdOpen(){
  const S0=fgS(), ks=GLORDER.filter(k=>MUSCLES[k]);
  if(!S0.sel){ S0.sel=new Set(ks.filter(k=>{ const c=fgHeat(k).c; return c==="fade"||c==="grey"; }).slice(0,6)); }
  let p=$("fgCold");
  if(!p){ p=document.createElement("section"); p.id="fgCold"; p.className="panel fg-p"; p.setAttribute("role","dialog"); p.setAttribute("aria-label","Train my cold muscles"); $("app").appendChild(p); }
  fgColdDraw(); void p.offsetWidth; p.classList.add("on"); track("cold_swap",{n:S0.sel.size});
}
function fgColdClose(){ const p=$("fgCold"); if(p) p.classList.remove("on"); }
function fgColdDraw(){
  const p=$("fgCold"); if(!p) return;
  const S0=fgS(), ks=GLORDER.filter(k=>MUSCLES[k]), sel=[...S0.sel].filter(k=>ks.includes(k));
  const items=fgColdItems(sel), T=uiSafe(()=>trTargets(items,false),[]), rp=T.reduce((a,x)=>a+(x.rp||0),0), min=items.length?estMin(items):0;
  const chip=k=>{ const h=fgHeat(k), on=S0.sel.has(k), off=h.c==="rec";
    return `<button class="fg-m ${h.c}${on?" on":""}" data-fk="${k}" ${off?"disabled":""} aria-pressed="${on}"><b>${uiEsc(rkSay(k))}</b><small>${uiEsc(h.t)}</small></button>`; };
  p.innerHTML=`<div class="fg-top"><button class="fg-xb" id="fgX" aria-label="Close"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></div>
    <div class="fg-h"><span class="u-eyebrow">Heat map</span><h2>Train my cold muscles</h2><p>Fading and grey muscles are picked. Tap to change.</p></div>
    <div class="fg-leg"><span class="hot">Hot</span><span class="ready">Ready</span><span class="fade">Fading</span><span class="grey">Grey</span><span class="rec">Recovering</span></div>
    <div class="fg-grid">${ks.map(chip).join("")}</div>
    <div class="fg-card">${items.length?`<ul>${items.map(it=>`<li><b>${uiEsc(it.name)}</b><span>${uiEsc(rkSay(it.primary))} · ${it.sets} × ${uiEsc(it.target)}</span></li>`).join("")}</ul>
      <div class="fg-sum"><span class="dk-rew">+${rp} RP</span><span class="dk-rew min">${min} min</span><span class="fg-n">${items.length} move${items.length>1?"s":""}</span></div>`:`<p class="fg-none">Pick a muscle to build the workout.</p>`}
      <button class="btn primary big" id="fgGo" ${items.length?"":"disabled"}>Start this workout</button></div>`;
  $("fgX").onclick=()=>{ Pulse.buzz(5); fgColdClose(); };
  p.querySelectorAll("[data-fk]").forEach(b=>b.onclick=()=>{ const k=b.dataset.fk; if(S0.sel.has(k)) S0.sel.delete(k); else S0.sel.add(k); try{ Pulse.buzz(5); }catch(e){} fgColdDraw(); });
  const go=$("fgGo"); if(go) go.onclick=()=>{ if(!items.length) return; Pulse.buzz([10,40,14]);
    const ses={title:"Cold muscles",note:"Your fading and grey muscles",items:fgColdItems([...S0.sel])};
    fgColdClose(); TR.custom=true; TR.session=ses; TR.view="plan"; TR.hub=false; TR.pick=TR.ed=null; setMode("train"); try{ drawTrain(); $("train").scrollTop=0; }catch(e){} track("cold_start",{n:ses.items.length}); };
}

/* ---------- the side quest ticks in place ---------- */
function fgDareTick(){
  try{
    const D=S.dares, c=D&&D.cur; if(!c||c.kind==="wx"||c.st==="done"||c.st==="no") return;
    if(c.st!=="yes"){ c.st="yes"; c.acceptedAt=Date.now(); }
    if(!drFinish("tick")) return;
    const b=$("fgDareTick"); fgPopAt(b,"+15 RP");
    try{ if(NATIVE.on&&typeof hap==="function") hap("selection"); else Pulse.buzz(10); }catch(e){}
    vxBonusXp(15,"dare");
    setTimeout(()=>{ try{ dkDraw(); }catch(e){} },420);
  }catch(e){ console.warn("Ossa: dare tick",e); }
}
function fgDareDress(root){
  const card=root&&root.querySelector(".dare:not(.dare-wx):not(.dare-quiet)"), c=S.dares&&S.dares.cur; if(!card||!c) return;
  if(c.st==="done"){ card.classList.add("fg-struck"); return; }
  const acts=card.querySelector(".dare-acts"); if(!acts) return;
  acts.outerHTML=`<button class="fg-tick" id="fgDareTick" role="checkbox" aria-checked="false"><i aria-hidden="true"></i><span>Mark it done</span><em>+15 RP</em></button>
    ${c.st==="new"?`<button class="u-link fg-not" id="dareNo">Not today</button>`:""}`;
  $("fgDareTick").onclick=e=>{ e.stopPropagation(); fgDareTick(); };
  const no=$("dareNo"); if(no) no.onclick=e=>{ e.stopPropagation(); try{ Pulse.buzz(6); }catch(x){} drSkip(false); };
}
(()=>{ const _d=dkDraw; dkDraw=function(){ const v=_d.apply(this,arguments); try{ fgDareDress($("dkHome")); }catch(e){ console.warn(e); } return v; }; })();

/* ---------- the workout ---------- */
/* last time's best set of this lift (weight × reps), or null */
function fgGhost(it){
  try{ const L=lastLift(it.name); if(!L||!Array.isArray(L.sets)||!L.sets.length) return null;
    const b=L.sets.filter(x=>x&&+x.r>0).sort((a,b)=>((+b.kg||0)*(+b.r))-((+a.kg||0)*(+a.r))||(+b.r-+a.r))[0]; if(!b) return null;
    const day=new Date(L.d+"T12:00:00").toLocaleDateString("en-GB",{weekday:"short"});
    return {kg:+b.kg||0,r:+b.r,day}; }catch(e){ return null; }
}
function fgBeats(g,c){ if(!g||!c) return false; const kg=+c.kg||0, r=+c.r||0; return (kg*r>g.kg*g.r&&kg>=g.kg)||(kg===g.kg&&r>g.r)||(g.kg===0&&r>g.r); }
function fgGhostHTML(it){
  const g=fgGhost(it); if(!g) return "";
  const won=TR.fgWon&&TR.fgWon[TR.ex];
  return `<div class="fg-ghost${won?" won":""}" id="fgGhost"><span>${won?"Ghost beaten":`Your ghost from last ${g.day}: <b>${g.r} × ${g.kg?`${fmtKg(g.kg)} kg`:"bodyweight"}</b>`}</span><em>${won?"+5 RP":"Beat it for +5 RP"}</em></div>`;
}
function fmtKg(v){ return (Math.round(v*10)/10).toString(); }
function fgHeatOf(k){ let n=0; (TR.session&&TR.session.items||[]).forEach((x,i)=>{ if(x.primary===k) n+=(TR.doneSets&&TR.doneSets[i])||0; }); return n>=3?"hot":n>=1?"warm":"cool"; }
(()=>{ const _f=floatHTML; floatHTML=function(s,it,p,n){
  let h=_f.apply(this,arguments);
  try{
    if(!TR.resting&&!wkMob()&&(p.kind==="load"||p.kind==="bw")){ const st=wkStepsHTML(it,p), gh=fgGhostHTML(it); if(gh&&h.includes(st)) h=h.replace(st,gh+st); }
    if(it&&MUSCLES[it.primary]) h=h.replace('<div class="wk-mm" ',`<div class="wk-mm" data-heat="${fgHeatOf(it.primary)}" `);
    let ring="";
    h=h.replace(/<svg class="wk-rest-bar"[\s\S]*?<\/svg>/,m=>{ const off=(m.match(/stroke-dashoffset:([\d.]+)/)||[])[1]||0;
      ring=`<svg class="fg-ring" viewBox="0 0 104 104" aria-hidden="true"><circle cx="52" cy="52" r="46" class="rbg"/><circle cx="52" cy="52" r="46" class="rfg" id="ring" style="stroke-dashoffset:${off}"/></svg>`; return ""; });
    if(ring) h=h.replace(/<div class="wk-rest-t"><b class="u-num" id="rt">([^<]*)<\/b>/,(m,t)=>`<div class="wk-rest-t fg-rt"><span class="fg-rw">${ring}<b class="u-num" id="rt">${t}</b></span>`);
  }catch(e){ console.warn("Ossa: forge",e); }
  return h; }; })();
(()=>{ const _s=setDone; setDone=function(){
  let before=0, g=null, cur=null, ex=TR.ex, anchor=null;
  try{ before=wkRpSum(wkRpNow()); const it=TR.session.items[TR.ex], p=TR.plans[TR.ex]; if(p&&(p.kind==="load"||p.kind==="bw")) g=fgGhost(it);
    document.querySelectorAll(".stp input").forEach(inp=>{ const v=parseFloat(inp.value.replace(",",".")); if(!isNaN(v)&&v>=0) TR.cur[inp.dataset.f]=Math.round(v*100)/100; });
    cur=Object.assign({},TR.cur); const b=$("setDone"); if(b) anchor=b.getBoundingClientRect(); }catch(e){}
  const v=_s.apply(this,arguments);
  try{
    TR.fgWon=TR.fgWon||{}; let won=false;
    if(g&&!TR.fgWon[ex]&&fgBeats(g,cur)){ TR.fgWon[ex]=true; won=true; vxBonusXp(5,"ghost"); }
    if(TR.view==="active"&&anchor){ const d=Math.max(0,wkRpSum(wkRpNow())-before)+(won?5:0);
      if(d>0) fgPop(anchor.left+anchor.width/2,anchor.top,`+${d} RP${won?" · ghost beaten":""}`,won?"won":""); }
  }catch(e){ console.warn("Ossa: forge set",e); }
  return v; }; })();
/* a new workout starts with no ghosts beaten */
(()=>{ const _w=startWorkout; startWorkout=function(){ TR.fgWon={}; return _w.apply(this,arguments); }; })();

/* ---------- Train by area (19 Oct, Andrej: "a list of collections of what part to train for easy access") ----------
   A row of cards on the Train home under today's quest: each is a ready session for one area, built from your kit,
   with how many of its muscles are ready. A tap opens the Session screen (time chips, Edit and the 5-min minimum work). */
function fgCols(){ return [
  {k:"chest",n:"Chest",ks:["pec_major","pec_minor","serratus"]},
  {k:"back",n:"Back",ks:["lats","rhomboids","traps","erectors"]},
  {k:"shoulders",n:"Shoulders",ks:["front_delt","side_delt","rear_delt"]},
  {k:"arms",n:"Arms",ks:["biceps","triceps","forearms"]},
  {k:"legs",n:"Legs",ks:["quads","hamstrings","adductors","gastrocnemius","soleus"]},
  {k:"glutes",n:"Glutes",ks:["glute_max","glute_med"]},
  {k:"core",n:"Core",ks:["abs","obliques","erectors"]},
  {k:"upper",n:"Upper body",ks:["pec_major","lats","front_delt","rhomboids","side_delt","biceps","triceps"]},
  {k:"lower",n:"Lower body",ks:["quads","glute_max","hamstrings","glute_med","gastrocnemius","adductors"]},
  {k:"full",n:"Full body",ks:["quads","pec_major","lats","glute_max","front_delt","hamstrings","abs"]},
  {k:"mob",n:"Mobility",ks:null}].map(c=>({...c,ks:c.ks&&c.ks.filter(k=>MUSCLES[k])})); }
function fgColSession(c){
  if(!c.ks) return uiSafe(()=>Object.assign({},mobilitySession(),{title:"Mobility"}),{title:"Mobility",items:[]});
  const ord=[...c.ks].sort((a,b)=>(stateOf(a)==="recovering")-(stateOf(b)==="recovering"));
  let items=fgColdItems(ord).slice(0,c.ks.length<=3?4:6);
  return {title:c.n,note:"Train by area",items};
}
function fgColHTML(){
  const C=fgCols();
  return `<div class="u-section-h dk-sh"><span class="dk-sht">Train by area</span></div>
    <div class="fg-cols" role="list">${C.map(c=>{ const ready=c.ks?c.ks.filter(k=>stateOf(k)!=="recovering").length:0;
      return `<button class="fg-col" role="listitem" data-col="${c.k}"><span class="fg-cth" data-colk="${c.k}" aria-hidden="true"></span>
        <b>${uiEsc(c.n)}</b><small>${c.ks?`${ready}/${c.ks.length} ready`:"Loosen up · 10 min"}</small></button>`; }).join("")}</div>`;
}
function fgColWire(root){
  root.querySelectorAll("[data-col]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); const c=fgCols().find(x=>x.k===b.dataset.col); if(!c) return;
    Pulse.buzz(8); const ses=fgColSession(c); if(!ses.items.length){ toast("No moves for your kit here yet."); return; }
    TR.custom=true; TR.session=ses; TR.view="plan"; TR.hub=false; TR.pick=TR.ed=null; setMode("train"); try{ drawTrain(); $("train").scrollTop=0; }catch(x){} track("train_area",{k:c.k}); });
  if(typeof dkFill==="function"&&typeof dkShotFor==="function") dkFill("#dkHome .fg-cth",th=>{ const c=fgCols().find(x=>x.k===th.dataset.colk); if(!c||!c.ks) return null; const m={}; c.ks.forEach(k=>m[k]=1); return dkShotFor(m,160); });
}
(()=>{ const _d=dkDraw; dkDraw=function(){ const v=_d.apply(this,arguments);
  try{ const h=$("dkHome"), wk=h&&h.querySelector(".dk-week"), q=h&&h.querySelector(".dk-quest"); if(wk&&!h.querySelector(".fg-cols")){
      /* the order (19 Oct): the week strip, today's quest, Train by area, then the rest */
      if(q) q.before(wk); const after=(h.querySelector(".dk-swaprow")||q||wk); after.insertAdjacentHTML("afterend",fgColHTML()); fgColWire(h); } }catch(e){ console.warn("Ossa: train by area",e); }
  return v; }; })();

/* ---------- Workout complete, the first slide (19 Oct, Andrej: "Fix this") ----------
   The body gets its own box under the top row (no more sitting on the progress bars and Skip): the 3D framing asks
   rdHeroBox, so while the results show, the box is the frame. Stats, then one row of pills, spread down to Next. */
(()=>{ const _hb=rdHeroBox; rdHeroBox=function(){
  try{ const app=$("app"); if(app.classList.contains("tdone")){ const sec=document.querySelector('.wk-run-s.lit:not([hidden])'), f=sec&&sec.querySelector(".wk-res-fig");
      if(f){ const a=app.getBoundingClientRect(), r=f.getBoundingClientRect(); if(r.height>40) return {top:r.top-a.top,bottom:r.bottom-a.top,cx:r.left-a.left+r.width/2}; } } }catch(e){}
  return _hb.apply(this,arguments); }; })();
(()=>{ const _s=wkRunShow; wkRunShow=function(i){ const v=_s.apply(this,arguments);
  try{ requestAnimationFrame(()=>{ try{ fgFigWindow(); Body.reframe&&Body.reframe(); }catch(e){} });
    const sec=document.querySelector(`.wk-run-s[data-step="${i}"]`); if(sec&&sec.dataset.id==="results") fgGainsAnim(); }catch(e){ console.warn(e); }
  return v; }; })();
/* the lit steps: black everywhere except a soft window round the body's box (no glow behind the status bar) */
function fgFigWindow(){
  const sec=document.querySelector(".wk-run-s.lit:not([hidden])"), f=sec&&sec.querySelector(".wk-res-fig"); if(!f) return;
  const H=innerHeight||1, r=f.getBoundingClientRect(), t=r.top/H*100, b=r.bottom/H*100;
  sec.style.setProperty("--fgA",Math.max(0,t-7).toFixed(1)+"%"); sec.style.setProperty("--fgB",Math.max(0,t-1).toFixed(1)+"%");
  sec.style.setProperty("--fgC",Math.min(100,b-2).toFixed(1)+"%"); sec.style.setProperty("--fgD",Math.min(100,b+6).toFixed(1)+"%");
}
/* Workout complete: what you did, shown on the body. The worked muscles light up one by one (biggest gain first),
   each with "+N Name" rising off it, while the numbers count up beside it (19 Oct, Andrej: "make it visible on the body
   like an animation"). Reduced motion: one pulse of everything, no tags. */
function fgGainsAnim(){
  const R=TR.result; if(!R||!R.gains) return;
  const keys=Object.keys(R.gains).filter(k=>MUSCLES[k]&&R.gains[k]>0).sort((a,b)=>R.gains[b]-R.gains[a]).slice(0,6); if(!keys.length) return;
  clearTimeout(fgGainsAnim.t); (fgGainsAnim.q||[]).forEach(clearTimeout); fgGainsAnim.q=[];
  if(reduced){ try{ Body.pulse&&Body.pulse(keys); }catch(e){} return; }
  const live=()=>{ const sec=document.querySelector('.wk-run-s[data-id="results"]:not([hidden])'); return !!sec&&$("app").classList.contains("tdone"); };
  fgGainsAnim.t=setTimeout(()=>{ keys.forEach((k,j)=>fgGainsAnim.q.push(setTimeout(()=>{ if(!live()) return;
      try{ Body.pulse&&Body.pulse([k]); }catch(e){}
      fgMuscleTag(k,`+${Math.round(R.gains[k])} ${rkSay(k)}`); try{ if(j<3) Pulse.buzz(4); }catch(e){} },j*420))); },1250);
}
function fgMuscleTag(k,text){
  const m=typeof MCEN!=="undefined"&&MCEN[k], app=$("app"); if(!m||!Body.project||!app) return;
  let best=null; [1,-1].forEach(sg=>{ const pr=Body.project([m[0]*sg,m[1],m[2]]); if(!pr) return; const f=Math.cos(pr.yaw-sg*((MUSCLES[k]&&MUSCLES[k].face)||0)); if(!best||f>best.f) best={x:pr.x,y:pr.y,f}; });
  if(!best||best.f<0.1) return;
  const el=document.createElement("div"); el.className="fg-mtag"; el.innerHTML=`<i></i><b>${uiEsc(text)}</b>`;
  el.style.left=best.x+"px"; el.style.top=best.y+"px"; app.appendChild(el); setTimeout(()=>{ try{ el.remove(); }catch(e){} },1700);
}
