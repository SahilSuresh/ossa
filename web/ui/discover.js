/* =========================================================
   EXERCISES AND KINETIC CHAIN (Ossa 2.0 Phase 2, 2026-10-16; designs exercise_discovery.png and
   connectivity_map.png, built in Ossa's tokens with real data)

   EXERCISES (#dxP, openExercises). Every movement Ossa can put in a session (exdata.js: 190 listed),
   searchable, filtered by type (All / Compound / Isolation / Mobility; the chosen chip is lime) and by
   Home or Gym (the one app-wide switch, shell.js uiSetKit). Recommended: up to three muscles you haven't
   trained for 7+ days (never one you flagged as sore, or whose lift loads a flagged joint, or one today
   already trains), then never-trained muscles this week's plan doesn't reach, else your weak link. Each
   shows the lift "+" adds to today, the rank points that exact lift gives (vxPreview, what Workout
   complete then credits) and the next level. Then the 7 muscle groups with real counts (a movement sits in
   the group of its main muscle and of every muscle that lists it, so a card's count is exactly the rows it
   shows), then every movement. A row opens Kinetic chain. The tab bar stays visible under it (opened
   over another screen it fills the phone instead, discover.css).

   KINETIC CHAIN (#kcP, openKinetic). What one exercise works: front and back stills of your own 3D body
   with the main muscle lit and the helpers dimmer (Body.shot mask; the flat 2D figure without WebGL),
   the main muscle, the helpers with their share (the Phase 1 weights, vxW) and a plain job line
   (exdata.js), and "+N RP for 3 sets" (vxPreview). A stretch earns no rank points and lists the muscles
   it stretches. "View related lifts" opens Exercises for the main muscle. It opens from the workout's
   muscle chips, Insights, a muscle sheet's exercise rows and Exercises; the muscle the lift was picked
   for travels with it (slot credit, as quickLog and finishWorkout give).

   Rules: function declarations only, state on function properties, no top-level const or let (boot code
   can reach these through typeof checks). Panels come forward with uiPanelFront (shell.js); the back
   swipe closing only the top panel is shell.js's, so there is no goBack wrapper here.
   Wrappers (once, at include time): renderSheet (the sheet's exercise rows open Kinetic chain),
   whAct (the whisper's "Add to today" goes through exAddToday), closePanels (drops the search keyboard).
   ========================================================= */

/* ---------- shared ---------- */
/* screen state, not saved: q search, t type, g group, k muscle (View related lifts), added {k: lift} */
function dxS(){ return dxS.s||(dxS.s={q:"",t:"all",g:null,k:null,added:{},from:null}); }
function dxReady(){ return typeof exList==="function"&&typeof exInfo==="function"&&typeof exSearch==="function"; }
function dxKit(){ try{ return rdtMode()==="home"?"home":"gym"; }catch(e){ return "gym"; } }
function dxSay(k){ try{ return rkSay(k); }catch(e){ return MUSCLES[k]?MUSCLES[k].name:k; } }
function dxGroup(id){ return RDT_GROUPS.find(g=>g.id===id)||null; }
function dxTypeOf(n){ try{ const i=typeof exInfo==="function"?exInfo(n):null; if(i) return i.type; }catch(e){} try{ return vxIsStretch(n)?"mobility":"isolation"; }catch(e){ return "isolation"; } }
function dxTypeName(t){ return ({compound:"Compound",isolation:"Isolation",mobility:"Mobility"})[t]||""; }
function dxFlagged(k){ try{ return typeof vxFlagged==="function"&&vxFlagged(k); }catch(e){ return false; } }
function dxIdle(k){ try{ return vxIdle(k); }catch(e){ return 0; } }
/* the main muscle for an exercise: the muscle it was picked for, else its own (EXW, then whoever lists it) */
function dxPrim(name,ctx){
  if(ctx&&MUSCLES[ctx]) return ctx;
  let p=null;
  try{ if(typeof exPrimary==="function") p=exPrimary(name); }catch(e){}
  if(!p&&EXW[name]) p=EXW[name][0];
  if(!p){ try{ p=trPrimaryOf(name); }catch(e){} }
  return p&&MUSCLES[p]?p:null;
}
/* one exercise, 3 sets, for Kinetic chain's "+N RP for 3 sets" (the primary is always resolved:
   mkItem with no primary lists the main muscle as its own helper) */
function vxItem3(name,ctx){ const p=dxPrim(name,ctx); return p?mkItem(name,"3 × 10",p):null; }
function dxIc(k){ return (typeof UI_IC!=="undefined"&&UI_IC[k])||""; }
function dxMag(){ return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>`; }
function dxX(){ return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>`; }

/* ---------- Add to today: the one path for Exercises' "+" and the whisper ---------- */
/* the lift "+" really adds, as today's session will have it, so its RP is what Workout complete gives.
   The muscle joins today's extras for a moment (never saved) and today is built the way drawTrain builds
   it: the plan turns an extra muscle into its first exercise (sessionForDay1); a "Lighter today" or
   recovery trim takes a set off (adaptToday, unless you chose the full plan; on a rest or swap day the
   extra shows once you keep the plan, untrimmed); then your swaps, your order, at home the bodyweight
   version (rdtKit), and the minutes you picked (fitSession, when the lift survives it) */
function dxPickItem(k){
  const e=MUSCLES[k]&&MUSCLES[k].ex&&MUSCLES[k].ex[0]; if(!e) return null;
  const d=dkey(0), X=S.extra, last=s=>{ const m=((s&&s.items)||[]).filter(x=>x.primary===k); return m[m.length-1]||null; };
  let it=null;
  try{
    if(!((X&&X[d])||[]).includes(k)) S.extra={...(X||{}),[d]:[...((X&&X[d])||[]),k]};
    const base=sessionForDay(todayIdx); let s=base;
    if(!doneToday()&&!TR.keep&&!base.mine){ const a=adaptToday(base); if(a&&last(a.session)) s=a.session; }
    s=rdtApplyOrder(applySwaps(s)); if(typeof rdtKit==="function") s=rdtKit(s);
    it=last(s);
    if(it&&TR.mins&&TR.mins<estMin(s.items)){ const f=last({items:fitSession(s.items,TR.mins)}); if(f) it=f; }
  }catch(er){ console.warn(er); it=null; }
  finally{ if(X===undefined) delete S.extra; else S.extra=X; }
  if(it) return it;
  /* start-up or a plan that can't take it: the first exercise, your swap and the home version */
  it=mkItem(e[0],e[1],k);
  try{ const s=applySwaps({day:todayIdx,items:[it]}); if(s&&s.items&&s.items[0]) it=s.items[0]; }catch(er){}
  try{ if(typeof rdtKit==="function"){ const s=rdtKit({items:[it]}); if(s&&s.items&&s.items[0]) it=s.items[0]; } }catch(er){}
  return it;
}
/* S.extra keeps only today, a muscle once. Returns the item today's session now has (or would have) */
function exAddToday(k){
  if(!k||!MUSCLES[k]) return null;
  S.extra=S.extra||{}; const d=dkey(0);
  Object.keys(S.extra).forEach(x=>{ if(x!==d) delete S.extra[x]; });
  const l=S.extra[d]=S.extra[d]||[]; if(!l.includes(k)) l.push(k);
  save();
  let it=null;
  try{ const m=rdTodaySession().items.filter(x=>x.primary===k); it=m[m.length-1]||null; }catch(e){}
  const shown=!!it; if(!it) it=dxPickItem(k);
  const nm=it?it.name:MUSCLES[k].ex[0][0];
  /* the coach can swap today for what's ready or a rest day; the extra stays in the plan and shows
     once you keep the plan ("Do Push anyway", "Train anyway") */
  let keep=""; if(!shown){ try{ const b=sessionForDay(todayIdx), a=!doneToday()&&!b.mine?adaptToday(b):null; keep=(a&&a.keepLbl)||""; }catch(e){} }
  toast(shown?`Added ${nm} to today`:`Added ${nm} to today's plan. ${keep?`Tap “${keep}” on today's session to see it.`:"It shows when you use the full plan."}`);
  try{ drawWeek(); }catch(e){}
  try{ if($("app").classList.contains("train")&&TR.view==="plan") drawTrain(); }catch(e){ console.warn(e); }
  return it;
}

/* ---------- Recommended ---------- */
/* how many sessions of this lift to the next level: vxRP itself, run on a copy of your scores and
   carry (the same rounding, carry and "the trained muscle always moves" as Workout complete), so the
   first session is exactly the card's +N RP */
function dxNext(k,it){
  const s=Math.round(S.scores[k]||0), nx=toNext(s); if(!nx) return null;
  const goal=RK_STEPS[rankIx(s)][0]; let X=null;
  try{ X=vxLoad([it]); }catch(e){}
  if(!X||!((X.L||{})[k]>0)) return {name:nx.name,n:null};
  const B={scores:{...S.scores},rpCarry:{...(S.rpCarry||{})}}; let n=0;
  try{ while(Math.round(+B.scores[k]||0)<goal&&n<40){ vxRP(X.L,X.prim,true,B); n++; } }catch(e){ console.warn(e); return {name:nx.name,n:null}; }
  return {name:nx.name,n:Math.round(+B.scores[k]||0)>=goal?n:null};
}
function dxWhy(k,weak){
  if(weak) return "Your weak link";
  if(isNew(k)) return "Not trained yet";
  let st=""; try{ st=stateOf(k); }catch(e){}
  if(st==="fading"){ const d=daysSince(k); return `Not trained for ${d>=60?"over 60":d} days`; }
  return "Not trained in a week";
}
/* up to 3 picks: [{k, it, rp, next, weak, fade, why}] */
function dxPicks(){
  const st=dxS(); let today=null; try{ today=rdTodaySession(); }catch(e){}
  const items=(today&&today.items)||[], inT=new Set(items.map(x=>x.primary)), names=new Set(items.map(x=>x.name));
  ((S.extra||{})[dkey(0)]||[]).forEach(k=>inT.add(k));
  const ok=k=>!!MUSCLES[k]&&!dxFlagged(k)&&(!inT.has(k)||!!st.added[k]);
  const idle=GLORDER.filter(k=>ok(k)&&!isNew(k)&&dxIdle(k)>=7).sort((a,b)=>dxIdle(b)-dxIdle(a)||(S.scores[a]||0)-(S.scores[b]||0));
  /* never trained and not in any day of this week's plan (tibialis, soleus, erectors in some splits) */
  const planned=new Set(); for(let i=0;i<7;i++){ try{ sessionForDay(i).items.forEach(x=>planned.add(x.primary)); }catch(e){} }
  const filler=GLORDER.filter(k=>ok(k)&&isNew(k)&&(!planned.has(k)||!!st.added[k]));
  let ks=[...idle,...filler].map(k=>({k,weak:false}));
  if(!ks.length){ let w=null; try{ w=rkWeak(); }catch(e){} if(w&&ok(w)) ks=[{k:w,weak:true}]; }
  const G=st.g?dxGroup(st.g):null, out=[];
  ks.forEach(({k,weak})=>{
    if(out.length>=3) return;
    const it=dxPickItem(k); if(!it) return;
    if(!st.added[k]&&names.has(it.name)) return;                       // already in today's session
    try{ if(typeof vxRowFlag==="function"&&vxRowFlag({name:it.name,primary:k})) return; }catch(e){}   // loads a flagged joint
    if(st.t!=="all"&&dxTypeOf(it.name)!==st.t) return;
    if(G&&!G.ks.includes(k)) return;
    let rp=0; try{ rp=(vxPreview([it])||{})[k]||0; }catch(e){}
    let fade=false; try{ fade=stateOf(k)==="fading"; }catch(e){}
    out.push({k,it,rp,next:dxNext(k,it),weak,fade,why:dxWhy(k,weak)});
  });
  return out;
}
function dxPickHTML(P){
  const st=dxS(), s=Math.round(S.scores[P.k]||0), t=rankTier(s), nm=P.it.name, say=dxSay(P.k);
  const nx=P.next?(P.next.n?`${P.next.name} in ${P.next.n} session${P.next.n===1?"":"s"}`:P.next.name):"Top rank";
  const rp=P.rp>0?`<em class="dx-rp">+${P.rp} RP</em> · `:"";
  const add=TR.view==="active"?""
    :st.added[P.k]?`<span class="dx-add on" role="img" aria-label="${uiEsc(nm)} is in today's session"><span class="dx-add-c">${dxIc("check")}</span></span>`
    :`<button class="dx-add" data-add="${P.k}" aria-label="Add ${uiEsc(nm)} to today"><span class="dx-add-c">${dxIc("plus")}</span></button>`;
  return `<div class="dx-pick" style="--c:var(--rk-${t})">
    <button class="dx-pick-main" data-kc="${encodeURIComponent(nm)}" data-k="${P.k}" aria-label="${uiEsc(say)}: ${uiEsc(nm)}. ${P.rp>0?`Plus ${P.rp} rank point${P.rp===1?"":"s"}. `:""}${uiEsc(nx)}. ${uiEsc(P.why)}. Open the kinetic chain">
      ${rkBadge(s)}<span class="dx-pick-tx"><span class="u-eyebrow">${uiEsc(say)}${P.fade?` <i class="rk-tag fade">Fading</i>`:""}</span><b>${uiEsc(nm)}</b>
      <small>${rp}${uiEsc(nx)}</small><small>${uiEsc(P.why)}</small></span></button>${add}</div>`;
}

/* ---------- the list ---------- */
/* the muscle a row stands for: its own main muscle, or inside a filter the muscle there that lists it
   (Dips under Chest is Pec minor, and opens Kinetic chain with pec minor's slot credit) */
function dxCtx(n,ks){
  const p=dxPrim(n); if(!ks||!ks.length||(p&&ks.includes(p))) return p;
  let ms=[]; try{ ms=exMuscles(n); }catch(e){}
  return ms.find(k=>ks.includes(k))||p;
}
function dxRowHTML(n,k){
  const T=dxTypeOf(n), s=S.scores[k]||0, t=rankTier(s);
  let tag=""; try{ tag=typeof vxRowTag==="function"?vxRowTag({name:n,primary:k})||"":""; }catch(e){}
  return `<button class="dx-row" data-kc="${encodeURIComponent(n)}" data-k="${k}" aria-label="${uiEsc(n)}, ${uiEsc(dxSay(k))}, ${dxTypeName(T)}${tag?", flagged":""}. Open the kinetic chain">
    <span class="dx-tile" aria-hidden="true"><i class="rk-sq" style="--c:var(--rk-${t})" data-t="${t}"></i></span>
    <span class="dx-row-tx"><b>${uiEsc(n)}</b><small>${uiEsc(dxSay(k))} · ${dxTypeName(T)}${tag?` · ${tag}`:""}</small></span>${dxIc("chev")}</button>`;
}
function dxRenderList(){
  const st=dxS(), L=$("dxL"); if(!L) return;
  if(!dxReady()){ L.innerHTML=`<p class="u-small dx-none">Exercises are still loading.</p>`; return; }
  const o={type:st.t,kit:dxKit()}, head=(a,b)=>`<div class="u-section-h dx-lh"><span class="u-eyebrow">${a}</span>${b||""}</div>`;
  let html="";
  if(st.q){
    const r=exSearch(st.q,o);
    html=head(`${r.length} result${r.length===1?"":"s"}`)+(r.length?r.map(n=>dxRowHTML(n,dxPrim(n))).join("")
      :`<div class="dx-empty"><p class="u-small">Nothing matches “${uiEsc(st.q)}”${st.t!=="all"||o.kit==="home"?` in ${[st.t!=="all"?dxTypeName(st.t):"",o.kit==="home"?"Home":""].filter(Boolean).join(" · ")}`:""}. Try a muscle or a move:</p>
        <div class="u-chips">${["back","row","chest","squat"].map(q=>`<button class="u-chip" data-q="${q}">${q}</button>`).join("")}</div></div>`);
  } else if(st.k&&MUSCLES[st.k]){
    const r=exList({...o,k:st.k});
    /* the anatomy name, as on Kinetic chain ("Chest" alone would read as the whole group) */
    html=head(`${uiEsc(MUSCLES[st.k].name)} · ${r.length}`,`<button class="u-link" data-clear="1">All movements</button>`)+r.map(n=>dxRowHTML(n,dxCtx(n,[st.k]))).join("");
  } else if(st.g&&dxGroup(st.g)){
    const G=dxGroup(st.g), r=exList({...o,group:G.id});
    html=head(`${uiEsc(G.n)} · ${r.length}`,`<button class="u-link" data-clear="1">All groups</button>`)+r.map(n=>dxRowHTML(n,dxCtx(n,G.ks))).join("");
  } else {
    /* everything, each name once, under its main muscle's group */
    const r=exList(o); let cur=null;
    html=head(`All movements · ${r.length}`);
    r.forEach(n=>{ const p=dxPrim(n), g=RDT_GROUPS.find(G=>G.ks.includes(p));
      if(g&&g.id!==cur){ cur=g.id; html+=`<div class="u-eyebrow dx-sub">${uiEsc(g.n)}</div>`; }
      html+=dxRowHTML(n,p); });
  }
  L.innerHTML=html;
}
/* your plans: Posture plan today, more kinds later (22 Oct). Saved by psSavePlan from the posture scan's result page;
   opens as a workout through startSavedPlan. Only shown with no search and no group chosen */
function dxPlansHTML(){
  const plans=(typeof savedPlans==="function"?savedPlans():[]);
  if(!plans.length) return "";
  const row=p=>{ const n=p.items.length, full=typeof planItems==="function"?planItems(p):p.items, mins=typeof estMin==="function"?estMin(full):n*2, sub=p.findings&&p.findings.length?`${p.findings.slice(0,2).join(" and ")}`:"";
    return `<div class="dx-plan" data-plan="${uiEsc(p.id)}" role="group" aria-label="${uiEsc(p.name)}: ${n} exercise${n===1?"":"s"}, ${mins} minutes">
      <div class="dx-plan-ic">${dxIc("plan")||dxIc("train")}</div>
      <div class="dx-plan-tx"><b>${uiEsc(p.name)}</b><small>${n} exercise${n===1?"":"s"} · ${mins} min${sub?` · ${uiEsc(sub)}`:""}</small></div>
      <button class="u-btn primary small dx-plan-go" data-plan-go="${uiEsc(p.id)}" aria-label="Start ${uiEsc(p.name)}">Start</button></div>`; };
  return `<div class="u-section-h"><span class="u-eyebrow">Your plans</span></div><div class="dx-plans">${plans.map(row).join("")}</div>`;
}
function dxRenderTop(){
  const st=dxS(), top=$("dxTop"); if(!top) return;
  if(st.q||st.k||!dxReady()){ top.hidden=true; top.innerHTML=""; return; }
  top.hidden=false;
  let picks=[]; if(st.t!=="mobility"){ try{ picks=dxPicks(); }catch(e){ console.warn(e); } }
  const C=exCounts({type:st.t,kit:dxKit()});
  top.innerHTML=dxPlansHTML()
    +(picks.length?`<div class="u-section-h"><span class="u-eyebrow">Recommended</span></div><div class="dx-picks">${picks.map(dxPickHTML).join("")}</div>`:"")
    +`<div class="u-section-h"><span class="u-eyebrow">Muscle groups</span></div>
      <div class="dx-groups">${RDT_GROUPS.map(G=>{ const n=C[G.id]||0, t=rankTier(rkAvg(G.ks));
        return `<button class="dx-g" data-g="${G.id}" aria-pressed="${st.g===G.id}" style="--c:var(--rk-${t})" aria-label="${uiEsc(G.n)}: ${n} movement${n===1?"":"s"}"><i class="rk-sq" data-t="${t}" aria-hidden="true"></i><span><b>${uiEsc(G.n)}</b><small>${n} movement${n===1?"":"s"}</small></span></button>`; }).join("")}</div>`;
}
function dxRender(){
  const st=dxS(), kit=dxKit();
  const ks=$("dxKit"); if(ks) ks.querySelectorAll("[data-kit]").forEach(b=>{ const on=b.dataset.kit===kit; b.classList.toggle("on",on); b.setAttribute("aria-checked",on); });
  const T=$("dxT"); if(T) T.innerHTML=["all","compound","isolation","mobility"].map(t=>`<button class="u-chip" data-t="${t}" role="radio" aria-checked="${st.t===t}">${t==="all"?"All":dxTypeName(t)}</button>`).join("");
  dxRenderTop(); dxRenderList();
}

/* ---------- the panel ---------- */
function dxPanel(){
  let p=$("dxP"); if(p) return p;
  p=document.createElement("section"); p.className="panel u-own dx"; p.id="dxP"; p.setAttribute("aria-label","Exercises");
  p.innerHTML=`<div class="dx-head"><button class="u-back" id="dxBack" aria-label="Back">‹ Back</button><h2>Exercises</h2>
      <div class="u-seg dx-kit" id="dxKit" role="radiogroup" aria-label="Where you train"><button data-kit="home" role="radio">Home</button><button data-kit="gym" role="radio">Gym</button></div></div>
    <div class="p-body dx-b" id="dxB">
      <div class="dx-search">${dxMag()}<input id="dxQ" type="search" placeholder="Search movements" aria-label="Search movements" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"><button class="dx-qx" id="dxQx" aria-label="Clear the search" hidden>${dxX()}</button></div>
      <div class="dx-types" id="dxT" role="radiogroup" aria-label="Type"></div>
      <div id="dxTop"></div>
      <div id="dxL"></div>
    </div>`;
  $("app").appendChild(p);
  const q=$("dxQ"), qx=$("dxQx"), st=dxS();
  const setQ=v=>{ const had=!!st.q; st.q=v; qx.hidden=!v; if(had!==!!v) dxRenderTop(); dxRenderList(); };
  $("dxBack").onclick=()=>{ Pulse.buzz(6); p.classList.remove("on"); };
  q.addEventListener("input",()=>setQ(q.value.trim()?q.value:""));
  q.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); q.blur(); } });
  /* while typing the keyboard covers the tab bar, so give the list the whole height */
  q.addEventListener("focus",()=>$("app").classList.add("dx-typing"));
  q.addEventListener("blur",()=>$("app").classList.remove("dx-typing"));
  qx.onclick=()=>{ Pulse.buzz(5); q.value=""; setQ(""); q.focus(); };
  $("dxKit").addEventListener("click",e=>{ const b=e.target.closest("[data-kit]"); if(!b) return;
    if(typeof uiSetKit==="function"){ if(uiSetKit(b.dataset.kit)) dxRender(); }
    else if(dxKit()!==b.dataset.kit){ S.trainKit=b.dataset.kit; save(); Pulse.buzz(8); dxRender(); } });
  $("dxB").addEventListener("click",e=>{
    const pg=e.target.closest("[data-plan-go]"); if(pg){ e.stopPropagation(); Pulse.buzz(10); if(typeof startSavedPlan==="function") startSavedPlan(pg.dataset.planGo); return; }
    const t=e.target.closest("[data-t]"); if(t&&t.closest("#dxT")){ if(st.t===t.dataset.t) return; st.t=t.dataset.t; Pulse.buzz(5); dxRender(); return; }
    const g=e.target.closest("[data-g]"); if(g){ Pulse.buzz(6); st.g=st.g===g.dataset.g?null:g.dataset.g; st.k=null; dxRender();
      if(st.g){ const l=$("dxL"), b=$("dxB"); if(l&&b) b.scrollTo({top:Math.max(0,l.offsetTop-8),behavior:reduced?"auto":"smooth"}); } return; }
    const add=e.target.closest("[data-add]"); if(add){ e.stopPropagation(); const k=add.dataset.add;
      if(typeof hap==="function") hap("soft"); else Pulse.buzz([10,40,14]);
      const it=exAddToday(k); st.added[k]=it?it.name:true;
      const span=document.createElement("span"); span.className="dx-add on"; span.setAttribute("role","img"); span.setAttribute("aria-label",`${it?it.name:"It"} is in today's session`);
      span.innerHTML=`<span class="dx-add-c">${dxIc("check")}</span>`; add.replaceWith(span);
      try{ track("ex_add"); }catch(er){} return; }
    const kc=e.target.closest("[data-kc]"); if(kc){ const n=decodeURIComponent(kc.dataset.kc), k=kc.dataset.k;
      if(typeof openKinetic==="function") openKinetic(n,MUSCLES[k]?k:null,{from:"exercises"}); else openInsights(n); return; }
    const c=e.target.closest("[data-clear]"); if(c){ Pulse.buzz(5); st.g=null; st.k=null; dxRender(); $("dxB").scrollTop=0; return; }
    const qq=e.target.closest("[data-q]"); if(qq){ Pulse.buzz(5); q.value=qq.dataset.q; setQ(qq.dataset.q); }
  });
  /* however it closes (back, a tab, the swipe), drop the keyboard */
  try{ new MutationObserver(()=>{ if(!p.classList.contains("on")&&document.activeElement===q) q.blur(); }).observe(p,{attributes:true,attributeFilter:["class"]}); }catch(e){}
  return p;
}
/* o = {q, t, g, k, from}. Opened again while it's already underneath (Kinetic chain's "View related
   lifts"), it closes the screens above it instead of stacking a second copy */
function openExercises(o){
  o=o||{}; const st=dxS(), p=dxPanel();
  if(["all","compound","isolation","mobility"].includes(o.t)) st.t=o.t;
  st.q=typeof o.q==="string"?o.q:""; st.g=o.g&&dxGroup(o.g)?o.g:null; st.k=o.k&&MUSCLES[o.k]?o.k:null; st.added={}; st.from=o.from||null;
  if(!p.classList.contains("on")) uiBackSet($("dxBack"),st.from==="kinetic"?"Kinetic chain":uiPlaceName());
  const q=$("dxQ"); if(q){ q.value=st.q; } const qx=$("dxQx"); if(qx) qx.hidden=!st.q;
  if(p.classList.contains("on")){
    let above=false; [...$("app").children].forEach(x=>{ if(x===p){ above=true; return; } if(above&&x.classList.contains("panel")&&x.classList.contains("u-own")) x.classList.remove("on"); });
  } else if(typeof uiPanelFront==="function") uiPanelFront(p);
  dxRender(); $("dxB").scrollTop=0;
  Pulse.buzz(8); try{ track("ex_open",{from:st.from}); }catch(e){}
  void p.offsetWidth; p.classList.add("on");   /* same task, so a closePanels just before can't be undone a frame later */
}
/* the Train hub row's small line: "190 movements · 2 muscles to wake up" */
function dxHubLine(){
  if(!dxReady()) return "Every movement, with what it works";
  const kit=dxKit(), n=exList({kit}).length;
  const idle=GLORDER.filter(k=>{ try{ return !isNew(k)&&!dxFlagged(k)&&dxIdle(k)>=7; }catch(e){ return false; } }).length;
  return `${n} movements${kit==="home"?" at home":""}${idle?` · ${idle} muscle${idle===1?"":"s"} to wake up`:""}`;
}

/* =========================================================
   KINETIC CHAIN
   ========================================================= */
function kcJob(name,k){
  try{ if(typeof exJob==="function"){ const j=exJob(name,k); if(j) return j; } }catch(e){}
  return ((MUSCLES[k]&&MUSCLES[k].what)||"").split(/[.:]/)[0];
}
/* {name, prim, stretch, info, sc, rows:[{k, w, pct, rp, job, usual}], mask, mainRP, top} */
function kcData(name,ctx){
  const prim=dxPrim(name,ctx); if(!prim) return null;
  let stretch=false; try{ stretch=vxIsStretch(name); }catch(e){}
  let info=null; try{ info=typeof exInfo==="function"?exInfo(name):null; }catch(e){}
  const canon=EXW[name]?EXW[name][0]:null, sc=Math.round(S.scores[prim]||0);
  if(stretch){
    let ms=[]; try{ ms=typeof exMuscles==="function"?exMuscles(name):[]; }catch(e){}
    ms=[prim,...ms.filter(k=>MUSCLES[k]&&k!==prim)];
    const mask={}; ms.forEach(k=>mask[k]=0.6);
    /* no job line: exdata's lines say what a muscle does when it works, and a stretch does the opposite */
    return {name,prim,stretch:true,info,sc,rows:ms.map(k=>({k,job:""})),mask,mainRP:0,top:sc>=100};
  }
  const it=vxItem3(name,prim), w=vxW(name,prim); let g={}; try{ g=vxPreview([it])||{}; }catch(e){}
  const rows=(it.sec||[]).filter(k=>MUSCLES[k]&&w[k]>0).map(k=>({k,w:w[k],pct:Math.round(w[k]*100),rp:g[k]||0,job:kcJob(name,k),usual:k===canon&&canon!==prim}));
  const mask={[prim]:1}; rows.forEach(r=>mask[r.k]=Math.round(Math.min(0.9,0.3+0.6*r.w)*100)/100);
  return {name,prim,stretch:false,info,sc,rows,mask,mainRP:g[prim]||0,top:sc>=100};
}
/* the figures' height on screen (css px): about a third of the phone, 200 to 300 */
function kcFigH(){ const H=window.innerHeight||800; return Math.max(180,Math.min(300,Math.round(H*(H<=700?0.3:0.34)))); }
/* front and back stills, lit by the mask. The last four are kept (each is a few hundred KB);
   null without WebGL or while the 3D can't draw, and a null is never kept */
function kcShots(D){
  const c=kcShots.c||(kcShots.c=[]);
  if(typeof Body==="undefined"||!Body||Body.kind!=="gl"||typeof Body.shot!=="function") return null;
  const key=[D.name,D.prim,S.body,S.finish||"",JSON.stringify(D.mask),uiSafe(()=>typeof bxLookKey==="function"?bxLookKey():"","")].join("|"), hit=c.find(x=>x.key===key);
  if(hit) return hit;
  const h=Math.max(360,Math.min(1000,Math.round(kcFigH()*Math.min(3,window.devicePixelRatio||1))));
  let f=null, b=null;
  try{ f=Body.shot({yaw:0,mask:D.mask,h}); b=f&&Body.shot({yaw:Math.PI,mask:D.mask,h}); }catch(e){ console.warn(e); f=b=null; }
  if(!f||!b) return null;
  const x={key,f,b}; c.unshift(x); if(c.length>4) c.length=4;
  return x;
}
/* where you can do it, as Exercises' Home/Gym filter lists it (never "no kit": some moves need a band,
   a roller or a bench) */
function kcMeta(name,info){
  if(!info) return "";
  const kit=info.kit==="home"?"Home or gym":"Gym only";
  if(info.type==="mobility") return [/stretch/i.test(name)?"Stretch":"Mobility",kit].join(" · ");
  const P={push:"Push",pull:"Pull",hinge:"Hinge",squat:"Squat",lunge:"Lunge",core:"Core",calf:"Calf",carry:"Carry"}[info.pattern];
  return [dxTypeName(info.type),P,kit].filter(Boolean).join(" · ");
}
function kcHTML(D,shots,focus){
  const m=MUSCLES[D.prim], t=rankTier(D.sc);
  let fl=false; try{ fl=!!(typeof vxFlagFor==="function"&&vxFlagFor(D.prim)); }catch(e){}
  const isSt=/stretch/i.test(D.name);
  const rp=D.stretch?`<p class="kc-rp">${isSt?"A stretch":"A mobility move"}: no rank points. It still counts for your streak.</p>`
    :D.top?`<p class="kc-rp">${uiEsc(m.name)} is at the top rank.</p>`
    :`<p class="kc-rp"><b>+${D.mainRP} RP</b> to ${uiEsc(m.name)} for 3 sets</p>`;
  const figH=kcFigH(), lab=`${D.name}: ${m.name} lit${D.rows.length?`, with ${D.rows.slice(0,3).map(r=>MUSCLES[r.k].name).join(", ")}`:""}, front and back`;
  const figs=shots?`<div class="kc-figs" role="img" aria-label="${uiEsc(lab)}" style="--fh:${figH}px"><figure><img src="${shots.f}" alt="" draggable="false"><figcaption>Front</figcaption></figure><figure><img src="${shots.b}" alt="" draggable="false"><figcaption>Back</figcaption></figure></div>`
    :`<figure class="kc-figs kc-flat" role="img" aria-label="${uiEsc(lab)}">${heatSVG(D.mask,[D.prim],figH)}</figure>`;
  const hero=`<div class="kc-hero"><div class="kc-main" style="--c:var(--rk-${t});--on-c:var(--on-rk-${t})"><span class="kc-pill">Main</span>
      <span class="kc-main-tx"><b>${uiEsc(m.name)}</b><small>${uiEsc(m.latin||"")}${m.latin?" · ":""}${rankOf(D.sc)}${fl?` · <i class="rk-tag flag">Flagged</i>`:""}</small></span></div>${figs}</div>`;
  const row=r=>{ const s=S.scores[r.k]||0, tt=rankTier(s), sub=[r.usual?"Its usual main muscle":"",r.job||""].filter(Boolean).join(" · ");
    return `<div class="kc-r${focus===r.k?" on":""}" data-k="${r.k}" role="listitem"><i class="rk-sq" style="--c:var(--rk-${tt})" data-t="${tt}" aria-hidden="true"></i>
      <span class="kc-r-tx"><b>${uiEsc(MUSCLES[r.k].name)}</b>${sub?`<small>${uiEsc(sub)}</small>`:""}</span>
      ${D.stretch?"":`<b class="u-num kc-pct">${r.pct}%</b><em class="kc-g${r.rp?"":" low"}">${r.rp?`${dxIc("bolt")}+${r.rp} RP`:"&lt;1 RP"}</em>`}</div>`; };
  const list=D.rows.length?`<div class="u-card kc-list" role="list">${D.rows.map(row).join("")}</div>`
    :`<p class="u-small kc-none">No helpers: it works your ${uiEsc(m.name.toLowerCase())} on its own.</p>`;
  const sec=D.stretch?`<div class="u-section-h"><span class="u-eyebrow">${isSt?"Stretches":"Muscles it moves"}</span></div>`
    :`<div class="u-section-h"><span class="u-eyebrow">Helpers</span>${D.rows.length?`<span class="u-eyebrow">Share</span>`:""}</div>`;
  const foot=D.stretch||!D.rows.length?"":`<p class="u-small kc-foot">Shares are how Ossa splits rank points, not a lab measurement. RP is for 3 sets of this on its own. In a longer workout a helper's points are capped, and part-points carry over.</p>`;
  return `<h1 class="kc-name">${uiEsc(D.name)}</h1>${D.info?`<p class="kc-meta">${uiEsc(kcMeta(D.name,D.info))}</p>`:""}${rp}${hero}${sec}${list}${foot}`;
}
function kcPanel(){
  let p=$("kcP"); if(p) return p;
  p=document.createElement("section"); p.className="panel u-own kc"; p.id="kcP"; p.setAttribute("aria-label","Kinetic chain");
  p.innerHTML=`<div class="kc-head"><button class="u-back" id="kcBack" aria-label="Back">‹ Back</button><h2>Kinetic chain</h2><span aria-hidden="true"></span></div>
    <div class="p-body kc-b" id="kcB"></div>
    <div class="kc-cta"><button class="u-btn primary block" id="kcGo">View related lifts</button></div>`;
  $("app").appendChild(p);
  $("kcBack").onclick=()=>{ Pulse.buzz(6); p.classList.remove("on"); };
  $("kcGo").onclick=()=>{ const s=openKinetic.s; if(!s) return; if(typeof openExercises!=="function") return;
    const dx=$("dxP"); if(!(dx&&dx.classList.contains("on"))){ const kc=$("kcP"); if(kc) kc.classList.remove("on"); }   /* nothing underneath: Exercises replaces the chain */
    openExercises({k:s.prim,t:"all",from:"kinetic"}); };
  return p;
}
/* name: the exercise; ctx: the muscle it was picked for (null = its own main muscle);
   o = {from: 'workout'|'insights'|'sheet'|'exercises', focus: a helper's row to pick out} */
function openKinetic(name,ctx,o){
  if(!name) return; o=o||{};
  const D=kcData(name,ctx); if(!D){ try{ openInsights(name); }catch(e){} return; }
  openKinetic.s={name,ctx:ctx||null,prim:D.prim,from:o.from||null,focus:o.focus||null};
  const shots=kcShots(D);                       // before the panel slides in, so the slide doesn't stutter
  const p=kcPanel(), b=$("kcB");
  uiBackSet($("kcBack"),o.from==="exercises"?"Exercises":o.from==="workout"?"Workout":uiPlaceName());
  if(typeof uiPanelFront==="function") uiPanelFront(p);
  b.innerHTML=kcHTML(D,shots,o.focus&&o.focus!==D.prim?o.focus:null);
  b.scrollTop=0;
  if(o.from!=="workout") Pulse.buzz(8);         // the workout's chips buzz on their own
  try{ track("kinetic_open",{from:o.from||null}); }catch(e){}
  void p.offsetWidth; p.classList.add("on");
  requestAnimationFrame(()=>{
    const r=b.querySelector(".kc-r.on"); if(r){ const d=r.getBoundingClientRect().top-b.getBoundingClientRect().top-b.clientHeight/2+r.offsetHeight/2; if(d>0) b.scrollTop=d; } });
}

/* =========================================================
   WRAPPERS (once, at include time)
   ========================================================= */
/* the muscle sheet's Train tab: each exercise's name opens Kinetic chain (Play and + stay as they are).
   ossa.html marks the name with data-kcn (the name, encoded) and data-kck (the muscle it's listed for) */
function kcSheetRows(){
  const box=$("shIn"); if(!box) return;
  box.querySelectorAll("[data-kcn]").forEach(sp=>{
    if(sp.dataset.kcw) return; sp.dataset.kcw="1";
    const n=decodeURIComponent(sp.dataset.kcn), k=sp.dataset.kck;
    sp.classList.add("kc-link"); sp.setAttribute("role","button"); sp.tabIndex=0; sp.setAttribute("aria-label",`What ${n} works: Kinetic chain`);
    /* a small chevron right after the name (before the muscle line on a region sheet) */
    const tn=[...sp.childNodes].find(x=>x.nodeType===3&&x.textContent.trim());
    if(tn) tn.after(document.createRange().createContextualFragment(`<span class="kc-chev" aria-hidden="true">${dxIc("chev")}</span>`));
    const go=e=>{ e.stopPropagation(); if(typeof openKinetic==="function") openKinetic(n,MUSCLES[k]?k:null,{from:"sheet"}); };
    sp.addEventListener("click",go);
    sp.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); go(e); } });
  });
}
(()=>{
  if(typeof renderSheet==="function"){ const _rs=renderSheet; renderSheet=function(){ const r=_rs.apply(this,arguments); try{ kcSheetRows(); }catch(e){ console.warn(e); } return r; }; }
  /* the whisper's "Add to today": the same path as Exercises' "+" (today only, once, the lift you'll really do) */
  if(typeof whAct==="function"){ const _wa=whAct; whAct=function(a){
    const c=typeof WH!=="undefined"&&WH?WH.cur:null;
    if(a==="add"&&c&&c.k&&MUSCLES[c.k]){ Pulse.buzz(10); try{ whHide(true); }catch(e){} exAddToday(c.k); return; }
    return _wa.apply(this,arguments); }; }
  /* a tab tap closes every panel: the search keyboard goes with Exercises */
  if(typeof closePanels==="function"){ const _cp=closePanels; closePanels=function(){ const r=_cp.apply(this,arguments);
    try{ const q=$("dxQ"); if(q&&document.activeElement===q) q.blur(); }catch(e){} return r; }; }
})();
