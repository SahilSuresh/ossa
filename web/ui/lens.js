/* =========================================================
   THE BODY PAGE'S LENSES (19 Oct, Andrej: remove the 3D view's Muscle/Bones page "without losing anything"; the
   Body page gains only two small controls, the lens chips and the X-ray knob; then hold to flag a sore spot and pinch
   to fly into a region, "and make it great").
   - Lens chips, left of the body: Rank · Recovery · Bones. Rank and Recovery colour the muscles; Bones is the X-ray
     all the way down (locked below level 3, like the old layer).
   - The X-ray knob, a pill on a dotted track at the right edge: drag it down and the muscles turn to glass above a
     line while your skeleton shows through (a BODY_FX effect for the glass, the old SVG skeleton clipped to the
     same line). Tap it to sweep down or back up.
   - The lens drives the legend (bottom left of the hero), a readout line under the body, and the pick card:
     Rank "Your pick" / "Weak link", Recovery "Recovering" / "All ready", Bones "Joint watch".
   - The two quest tiles from the old page (Posture scan, Body check) sit under the card.
   - Hold a muscle or a joint (about half a second): it's flagged sore (a red pulse confirms; its fade pauses), or
     unflagged if it was. Pinch the body: the camera flies into that region and its sheet opens with "Train this
     region"; pinch in or close the sheet to fly back.
   - Every way into the old 3D view now lands here: rkShow3D (redefined), go("m:…"/"r:…"), setLayer("frame"), and a
     safety net that sends a bare 3D stage (nothing over it) back to the Body page.
   Owns rdxBuild/rdxDraw as no-ops (band.js is gone; the legacy rdLookSync still calls rdxDraw) and redefines
   drawBones (ossa.html keeps its copy; injury.js wraps this one). Prefix lx*. Function declarations only, state on
   function properties, no top-level const/let (see CLAUDE.md).
   ========================================================= */
function rdxBuild(){}
function rdxDraw(){}

function lxS(){ return lxS.s||(lxS.s={col:"rank",line:0,anim:0,flown:null,eat:0,joint:null,g:null,key:"",js:null,jsk:""}); }
/* the Body page is showing (not Train, the intro, a scrolled-away hero) */
function lxHome(){
  try{ if(typeof RDH==="undefined"||!RDH.on||TAB!=="today") return false;
    const c=$("app").classList; return !c.contains("train")&&!c.contains("onboarding")&&!c.contains("homeoff")&&!c.contains("minding"); }catch(e){ return false; }
}
function lxCanRoute(){ try{ return typeof uiHome3D==="function"&&uiHome3D()&&!$("app").classList.contains("onboarding")&&!!S.body; }catch(e){ return false; } }
function lxLocked(){ try{ return !bonesOn(); }catch(e){ return false; } }
function lxIsBones(){ return lxS().line>=0.98; }
function lxLens(){ return lxIsBones()?"bones":lxS().col; }
function lxRankOn(){ return lxS().col!=="rec"; }
function lxBonesOn(){ return lxHome()&&lxS().line>0.004&&!lxLocked(); }

/* ---------- the knob's track, in the hero's own px ---------- */
function lxTrack(){
  const h=$("rdHero"); if(!h) return null;
  const bar=h.querySelector(".u-rkbar"), top=bar?bar.offsetTop+bar.offsetHeight+18:64, bottom=Math.max(top+80,h.clientHeight-28);
  return {top,bottom,h};
}
/* the line in canvas CSS px from the canvas top: -1 none, a huge number for the whole skeleton */
function lxLineCss(){
  const s=lxS(); if(s.line<=0.004) return -1; if(s.line>=0.98) return 1e5;
  const T=lxTrack(), cv=$("stage")&&$("stage").querySelector("canvas"); if(!T||!cv) return -1;
  const hr=T.h.getBoundingClientRect(), cr=cv.getBoundingClientRect();
  return hr.top+T.top+s.line*(T.bottom-T.top)-cr.top;
}

/* ---------- markup ---------- */
function lxChipsHTML(){
  const L=lxLens(), lock=lxLocked();
  const b=(id,name,extra)=>`<button role="radio" data-lx="${id}" class="lx-chip${L===id?" on":""}${extra||""}" aria-checked="${L===id}"${id==="bones"&&lock?` aria-label="Bones, unlocks at level ${BONES_LV}"`:""}><i class="lx-d ${id==="bones"?"bn":id}" aria-hidden="true"></i>${name}${id==="bones"&&lock?`<svg class="lx-lock" viewBox="0 0 24 24" aria-hidden="true"><rect x="5.5" y="11" width="13" height="9" rx="2"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></svg>`:""}</button>`;
  return `<div class="lx-chips" id="lxChips" role="radiogroup" aria-label="Show your body by">${b("rank","Rank")}${b("rec","Recovery")}${b("bones","Bones",lock?" locked":"")}</div>`;
}
function lxKnobHTML(){
  return `<i class="lx-track" id="lxTrack" aria-hidden="true"></i><i class="lx-line" id="lxLine" aria-hidden="true"></i>
    <button class="lx-knob" id="lxKnob" role="slider" aria-label="X-ray: drag down to see your skeleton" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="Off"><span>X-ray</span></button>`;
}
/* the legend follows the lens */
function lxLegendHTML(){
  const L=lxLens();
  if(L==="rank") return uiRankRailHTML();
  const rows=L==="bones"?[["OK","var(--text-1)"],["Watch","var(--amber)"],["Sore","var(--alert)"]]
    :[["Ready","var(--glow)"],["Recovering","var(--amber)"],["Fading","var(--line-3)"],["Not trained","",1]];
  return `<div class="u-rkrail lx-leg" role="list" aria-label="${L==="bones"?"Joint colours":"Recovery colours"}">${rows.map(([n,c,ring])=>`<span role="listitem"><i class="${ring?"lx-o":""}"${c?` style="--c:${c}"`:""}></i>${n}</span>`).join("")}</div>`;
}
/* the readout line under the body */
function lxReadHTML(){
  const L=lxLens();
  try{
    if(L==="bones"){ const n={ok:0,watch:0,sore:0}; lxJointStates().list.forEach(x=>n[x.st]++);
      return `<span class="lx-n ok"><b>${n.ok}</b> OK</span><span class="lx-n wt"><b>${n.watch}</b> watch</span>${n.sore?`<button class="lx-n sore" id="lxSore"><b>${n.sore}</b> sore</button>`:`<span class="lx-n"><b>0</b> sore</span>`}<span class="lx-hint">Tap a joint</span>`; }
    if(L==="rec"){ const c={ready:0,recovering:0,fading:0,new:0}; GLORDER.forEach(k=>{ const s=stateOf(k); c[s]=(c[s]||0)+1; });
      return `<button class="lx-rd" id="lxRec"><span class="lx-n ready"><b>${c.ready}</b> ready</span><span class="lx-n rec"><b>${c.recovering}</b> recovering</span>${c.fading?`<span class="lx-n fade"><b>${c.fading}</b> fading</span>`:""}${c.new?`<span class="lx-n nw"><b>${c.new}</b> not trained</span>`:""}</button>`; }
    const o=overall(), t=rankTier(o), nx=toNext(o); let f=0; try{ f=vxSpots().length; }catch(e){}
    return `<button class="lx-rd" id="lxRank"><i class="sq${t>1?"":" lx-o"}" style="--c:var(--rk-${t})"></i><span><b>${rankOf(o)}</b> overall</span>${nx?`<span>${nx.pts} RP to ${nx.name}</span>`:`<span>Top rank</span>`}</button>${f?`<button class="lx-n sore" id="lxSore"><b>${f}</b> flagged</button>`:""}`;
  }catch(e){ console.warn("Ossa: lens readout",e); return ""; }
}
/* the two quests from the old 3D page: the last result, or the reason to do it now; one bone tile is the next quest */
function lxQuests(){
  const p=psLast(), b=bcLast(); let age=null; try{ age=rdBA(); }catch(e){}
  const when=d=>{ const n=dayDiff(d); return n<=0?"today":n===1?"1 day":`${n} days`; };
  const sc=p?Math.round(p.sc):0;
  const ps=!p?{s:"Never done · 2 min",k:"never"}:psDue()?{s:`Rescan due · ${sc}/100`,k:"due"}:{s:`${sc}/100 · ${when(p.d)}`,k:"ok"};
  let res=age!=null?`age ${age}`:""; if(!res&&b) try{ res=`${ckScoreOf(ckNow())}/100`; }catch(e){}
  const ck=!b?{s:"Never done · 10 min",k:"never"}:bcDue()?{s:res?`Retest due · ${res}`:"Retest due",k:"due"}:{s:`${age!=null?`Body age ${age}`:res||"Done"} · ${when(b.d)}`,k:"ok"};
  const hot=ps.k==="never"?"ps":ck.k==="never"?"ck":ps.k==="due"?"ps":ck.k==="due"?"ck":null;
  return {ps,ck,hot};
}
function lxQuestsHTML(){
  let q; try{ q=lxQuests(); }catch(e){ return ""; }
  const t=(id,w,ic,name,st)=>`<button class="u-quest${q.hot===w?" hot":st.k!=="ok"?" due":""}" id="${id}" aria-label="${name}, ${st.s.replace(" · ",", ")}${st.k==="ok"?". Opens the results":". Starts it"}"><span class="q-v">${ic}${name}</span><span class="q-s">${st.s}</span></button>`;
  return `<div class="lx-quests" id="lxQuests">${t("lxPs","ps",UI_IC.posture,"Posture scan",q.ps)}${t("lxCk","ck",UI_IC.age,"Body check",q.ck)}</div>`;
}

/* ---------- the pick card follows the lens (always #uWeak: prestige.js wraps it) ---------- */
function lxCardHTML(){
  const L=lxLens(), k=UIH.sel;
  if(L==="bones"||(lxS().joint&&lxBonesOn())) return lxJointCardHTML(lxS().joint);
  if(L==="rec") return lxRecCardHTML(k);
  return k?uiFocusCardHTML(k):uiWeakCardHTML();
}
/* the muscle the card is about when nothing is picked: the weak link (Rank), the least recovered or a fading one (Recovery) */
function lxFocusKey(){
  const L=lxLens(); if(L==="bones") return null; if(L==="rank") return UIH.weak||null;
  try{ const R=rcvLists(); return R.rec[0]||R.fad[0]||null; }catch(e){ return null; }
}
function lxRecCol(k){ const s=stateOf(k); return s==="ready"?"var(--glow)":s==="recovering"?"var(--amber)":s==="fading"?"var(--line-3)":"var(--line-2)"; }
function lxRecCardHTML(k){
  const card=(eb,t,sm,c,data,lab)=>`<button class="u-card u-weak u-lxc${k?" u-focus":""}" id="uWeak" ${data} style="--c:${c}" aria-label="${uiEsc(lab)}"><i class="rk-sq"></i>
    <span><em class="u-weak-eb">${eb}</em><b>${t}</b><small>${sm}</small></span>${UI_IC.chev}</button>`;
  try{
    if(k){ const r=readyText(k); return card("Your pick",`${uiEsc(rkSay(k))} · ${uiEsc(r.t)}`,uiEsc(r.s||vxStateShort(k)),lxRecCol(k),`data-k="${k}" data-rv="1"`,`${rkSay(k)}: ${r.t}. ${r.s||""}`); }
    const L=rcvLists();
    if(L.rec.length){ const w=L.rec[0], p=Math.round(recoveredPct(w)*100), more=L.rec.length-1;
      return card("Recovering",`${uiEsc(rkSay(w))} · ${p}% recovered`,`Ready ${leftText(hoursLeft(w))}.${more?` ${more} more recovering.`:""}`,"var(--amber)",`data-k="${w}" data-rv="1"`,`${rkSay(w)} is ${p}% recovered, ready ${leftText(hoursLeft(w))}`); }
    if(L.fad.length){ const f=L.fad[0];
      const n=daysSince(f);
      return card("Fading",`${uiEsc(rkSay(f))} · ${n} days`,"Its colour is fading. Train it to bring it back.","var(--line-3)",`data-k="${f}" data-rv="1"`,`${rkSay(f)} is fading: not trained for ${n} days`); }
    if(!L.ready) return card("Recovery","Nothing trained yet","Train once and recovery shows here.","var(--line-2)",`data-go="train"`,"Nothing trained yet");
    return card("All ready","Everything's recovered","Train whatever you like today.","var(--glow)",`data-go="train"`,"Everything is recovered");
  }catch(e){ console.warn("Ossa: lens card",e); return uiWeakCardHTML(); }
}
/* ---------- joints: OK / watch / sore from what you flagged, what you said aches, your scan and your check ---------- */
function lxJointStates(){
  const s=lxS(); let sp=[]; try{ sp=vxSpots(); }catch(e){}
  const key=JSON.stringify([sp,S.flagged||null,dkey(0),(typeof psLast==="function"&&psLast()||{}).d||0,(typeof bcLast==="function"&&bcLast()||{}).d||0]);
  if(s.js&&s.jsk===key) return s.js;
  const marks=[["neck",0],["shoulder",1],["shoulder",-1],["elbow",1],["elbow",-1],["wrist",1],["wrist",-1],["lowback",0],["hip",1],["hip",-1],["knee",1],["knee",-1],["ankle",1],["ankle",-1]];
  const sideOk=(f,sd)=>!sd||f.side==="b"||(sd>0?"l":"r")===f.side;
  const PSJ={fhp:"neck",head:"neck",round:"shoulder",sh:"shoulder",apt:"lowback",hip:"hip",shift:"hip"};
  let ps=null; try{ ps=psLast(); }catch(e){}
  const one=(j,sd)=>{
    const jf=sp.find(f=>f.kind==="j"&&f.id===j&&sideOk(f,sd));
    if(jf) return {st:"sore",f:jf,why:`Flagged ${dayDiff(jf.at)<=0?"today":dayDiff(jf.at)===1?"yesterday":dayDiff(jf.at)+" days ago"} · its muscles' fade is paused.`};
    const mf=sp.find(f=>f.kind==="m"&&vxMuscleJoint(f.id)===j&&sideOk(f,sd));
    if(mf) return {st:"watch",f:mf,why:`Flagged with your ${MUSCLES[mf.id].name.toLowerCase()}.`};
    try{ if(jointFlag(j)) return {st:"watch",why:"You said this area aches."}; }catch(e){}
    try{ if(ps&&ps.m) for(const k in PSJ) if(PSJ[k]===j&&ps.m[k]&&ps.m[k].lv>=1) return {st:"watch",why:"Your posture scan points here."}; }catch(e){}
    try{ const t=JOINTS[j].test&&ckT(JOINTS[j].test), r=t&&ckNow()[t.id]; if(r&&r.lv<=2) return {st:"watch",why:`${t.t}: ${CK_LV[r.lv].toLowerCase()}.`}; }catch(e){}
    return {st:"ok"};
  };
  const list=marks.map(([j,sd],i)=>({j,sd,i,...one(j,sd)}));
  s.js={list,by:list.reduce((a,x)=>{ a[x.i]=x.st; return a; },{})}; s.jsk=key;
  return s.js;
}
function lxJointLabel(x,both){ try{ return vxFlagLabel({kind:"j",id:x.j,side:x.sd===0||both?"b":x.sd>0?"l":"r"}); }catch(e){ return JOINTS[x.j]?JOINTS[x.j].name:x.j; } }
function lxJointCardHTML(j){
  const st=lxJointStates().list, rank={sore:0,watch:1,ok:2};
  let x=j?st.find(e=>e.j===j.j&&e.sd===j.sd):null;
  if(!x) x=st.slice().sort((a,b)=>rank[a.st]-rank[b.st])[0];
  const word={sore:"Sore",watch:"Watch",ok:"OK"}, col={sore:"var(--alert)",watch:"var(--amber)",ok:"var(--text-1)"};
  if(!x||(x.st==="ok"&&!j)) return `<button class="u-card u-weak u-lxc" id="uWeak" data-sore="1" style="--c:var(--text-1)" aria-label="Your frame: every joint OK. Hold a joint to flag it sore."><i class="rk-sq lx-jsq"></i>
    <span><em class="u-weak-eb">Your frame</em><b>14 joints · all clear</b><small>Hold a joint to flag it sore.</small></span>${UI_IC.chev}</button>`;
  const both=!j&&x.sd!==0&&st.some(e=>e.j===x.j&&e.sd===-x.sd&&e.st===x.st);   /* a joint you tapped keeps its side */
  let tip=""; try{ const reads=["neck","shoulder","lowback","hip"].includes(x.j);
    tip=x.st==="ok"?"Tap for its relief routine.":reads&&psDue()?"Posture scan suggested.":JOINTS[x.j].test&&bcDue()?"Body check suggested.":"Relief routine inside."; }catch(e){}
  return `<button class="u-card u-weak u-lxc${j?" u-focus":""}" id="uWeak" data-j="${x.j}" data-sd="${x.sd}" style="--c:${col[x.st]}" aria-label="${uiEsc(lxJointLabel(x,both))}: ${word[x.st]}. ${uiEsc(x.why||"")}"><i class="rk-sq lx-jsq"></i>
    <span><em class="u-weak-eb">${j?"Your pick":"Joint watch"}</em><b>${uiEsc(lxJointLabel(x,both))} · ${word[x.st]}</b><small>${x.why?uiEsc(x.why)+" ":""}${tip}</small></span>${UI_IC.chev}</button>`;
}

/* ---------- putting it on the page ---------- */
function lxRefresh(o){
  o=o||{};
  const h=$("rdHero"); if(!h) return;
  const ch=$("lxChips"); if(ch) ch.outerHTML=lxChipsHTML();
  const lg=h.querySelector(".u-rkrail"); if(lg) lg.outerHTML=lxLegendHTML();
  const rd=$("lxRead"); if(rd){ rd.innerHTML=lxReadHTML(); rd.dataset.l=lxLens(); }
  if(!o.keepCard){ const c=$("uWeak"); if(c){ c.outerHTML=lxCardHTML(); try{ uiFocusCardWire(); }catch(e){} } }
  const q=$("lxQuests"); if(q) q.outerHTML=lxQuestsHTML();
  lxWireParts();
  try{ $("app").classList.toggle("lx-rec",lxLens()==="rec"); UIHD.k=""; uiHeroDraw(true); }catch(e){}
}
function lxWireParts(){
  const ch=$("lxChips"); if(ch) ch.querySelectorAll("[data-lx]").forEach(b=>b.onclick=()=>lxSetLens(b.dataset.lx));
  if($("lxRank")) $("lxRank").onclick=()=>{ Pulse.buzz(6); openRanks(); };
  if($("lxSore")) $("lxSore").onclick=()=>{ Pulse.buzz(6); try{ vxSoreOpen(); }catch(e){} };
  if($("lxRec")) $("lxRec").onclick=()=>{ Pulse.buzz(6); setTab("recover"); try{ rcvGo("list"); }catch(e){} };
  if($("lxPs")) $("lxPs").onclick=()=>{ Pulse.buzz(8); track("body_cta",{w:"ps"}); psOpen(psDue()||!psLast()?{from:"home"}:{go:"results",from:"home"}); };
  if($("lxCk")) $("lxCk").onclick=()=>{ Pulse.buzz(8); track("body_cta",{w:"ck"}); openBodyCheck(bcDue()||!bcLast()?undefined:"results"); };
}
/* a lens chip: Rank / Recovery keep the muscles in colour (the X-ray goes back up); Bones takes it all the way down */
function lxSetLens(id,o){
  o=o||{}; const s=lxS();
  if(id==="bones"){
    if(lxLocked()){ const n=Math.max(0,vxLevelXp(BONES_LV)-vxXp()); toast(`Bones unlocks at level ${BONES_LV} · ${n} RP to go`); Pulse.buzz(6); return; }
    if(!o.quiet){ Pulse.buzz(8); track("lens",{l:"bones"}); }
    lxAnim(1); return; }
  const was=s.col; s.col=id==="rec"?"rec":"rank";
  if(!o.quiet){ Pulse.buzz(6); track("lens",{l:s.col}); }
  try{ if(Body.setRank) Body.setRank(s.col!=="rec"); Body.refresh&&Body.refresh(); }catch(e){}
  if(s.line>0.004) lxAnim(0); else lxRefresh();
  if(was!==s.col&&!o.quiet) try{ fxReplay($("rdHero"),"lx-swap"); }catch(e){}
}
/* the X-ray: ease the line to t (0 none, 1 the whole skeleton) */
function lxAnim(t,ms){
  const s=lxS(), from=s.line, d=reduced?0:(ms!=null?ms:Math.abs(t-from)*700+150), t0=performance.now(), was=lxLens();
  cancelAnimationFrame(s.anim); s.to=t;
  const step=now=>{ const k=d?Math.min(1,(now-t0)/d):1, e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
    s.line=from+(t-from)*e; lxApplyLine();
    if(k<1) s.anim=requestAnimationFrame(step); else { s.anim=0; s.line=t; if(t===0) s.joint=null; lxApplyLine(); if(lxLens()!==was||t===0||t===1) lxRefresh(); } };
  s.anim=requestAnimationFrame(step);
}
/* knob, line and skeleton follow lxS().line */
function lxApplyLine(){
  const s=lxS(), T=lxTrack(), k=$("lxKnob"), ln=$("lxLine"); if(!T||!k) return;
  const y=T.top+s.line*(T.bottom-T.top);
  k.style.transform=`translate3d(0,${(y-k.offsetHeight/2).toFixed(1)}px,0)`;
  if(ln){ ln.style.transform=`translate3d(0,${y.toFixed(1)}px,0)`; ln.classList.toggle("on",s.line>0.004&&s.line<0.98); }
  const tr=$("lxTrack"); if(tr){ tr.style.top=T.top+"px"; tr.style.height=(T.bottom-T.top)+"px"; }
  k.classList.toggle("on",s.line>0.004);
  k.setAttribute("aria-valuenow",Math.round(s.line*100)); k.setAttribute("aria-valuetext",s.line<=0.004?"Off":s.line>=0.98?"Whole skeleton":`${Math.round(s.line*100)}% of the way down`);
  try{ $("app").classList.toggle("lx-bn",lxBonesOn()); }catch(e){}
  try{ Body.fxKick&&Body.fxKick(); }catch(e){}
}
/* drag the knob; a tap sweeps it down, or back up */
function lxKnobWire(){
  const k=$("lxKnob"); if(!k||k.dataset.w) return; k.dataset.w="1";
  let d=null;
  k.addEventListener("pointerdown",e=>{ if(lxLocked()){ lxSetLens("bones"); return; } const T=lxTrack(); if(!T) return;
    d={y0:e.clientY,l0:lxS().line,moved:false,T,top:T.h.getBoundingClientRect().top}; cancelAnimationFrame(lxS().anim); lxS().anim=0;
    try{ k.setPointerCapture(e.pointerId); }catch(_){} e.preventDefault(); });
  k.addEventListener("pointermove",e=>{ if(!d) return; if(Math.abs(e.clientY-d.y0)>4) d.moved=true; if(!d.moved) return;
    const was=lxLens(), y=e.clientY-d.top, l=Math.max(0,Math.min(1,(y-d.T.top)/(d.T.bottom-d.T.top)));
    lxS().line=l>0.985?1:l<0.015?0:l; lxApplyLine(); if(lxLens()!==was){ Pulse.buzz(6); lxRefresh(); } });
  const up=e=>{ if(!d) return; const moved=d.moved; d=null; try{ k.releasePointerCapture(e.pointerId); }catch(_){}
    if(!moved){ Pulse.buzz(8); lxAnim(lxS().line>0.004?0:1); track("xray",{tap:1}); return; }
    if(lxS().line<=0.004) lxS().joint=null; track("xray",{at:Math.round(lxS().line*100)}); lxRefresh(); };
  k.addEventListener("pointerup",up); k.addEventListener("pointercancel",()=>{ d=null; });
  k.addEventListener("keydown",e=>{ const s=lxS(); let t=null; const b0=s.anim&&s.to!=null?s.to:s.line;
    if(e.key==="ArrowDown"||e.key==="ArrowRight") t=Math.min(1,b0+0.1); else if(e.key==="ArrowUp"||e.key==="ArrowLeft") t=Math.max(0,b0-0.1);
    else if(e.key==="Home") t=0; else if(e.key==="End") t=1;
    if(t==null) return; e.preventDefault(); if(lxLocked()){ lxSetLens("bones"); return; } lxAnim(t,120); });
}

/* ---------- on the hero's tap layer: drag to turn, pinch to zoom, hold to flag, double-tap a region ----------
   (19 Oct, Andrej: "turn the character by spinning him … a slight subtle clicking sound … pinch to zoom around")
   One finger that moves turns the body (momentum, and the engine's dial clicks every 10°: dialTick, Settings ›
   "Dial clicks when you turn the body"); when zoomed, up and down pans. Two fingers zoom around the point between them
   and pan with it (1× to 3.2×). A still finger held half a second flags a sore spot. Double-tap: back out when zoomed
   or in a region, otherwise fly into the region under your finger with its sheet (what the pinch did before). */
function lxEat(){ return performance.now()-lxS().eat<700; }
function lxGestureWire(){
  const t=$("uRkTap"); if(!t||t.dataset.lx) return; t.dataset.lx="1";
  const P=new Map(), s=lxS();
  const ring=(x,y,cls)=>{ const h=$("rdHero"); if(!h) return null; const r=h.getBoundingClientRect(), e=document.createElement("i");
    e.className="lx-ring "+(cls||""); e.style.left=(x-r.left)+"px"; e.style.top=(y-r.top)+"px"; h.appendChild(e); return e; };
  const clear=()=>{ if(s.g){ clearTimeout(s.g.tm); clearTimeout(s.g.tm0); if(s.g.ring){ s.g.ring.remove(); s.g.ring=null; } } };
  const B=(f,...a)=>{ try{ if(Body[f]) Body[f](...a); }catch(e){ console.warn(e); } };
  const turnFrom=(x,y)=>{ s.g={t:1,x0:x,y0:y,turn:true}; s.spinAt=performance.now(); B("turnStart"); };
  t.addEventListener("pointerdown",e=>{ P.set(e.pointerId,{x:e.clientX,y:e.clientY}); try{ t.setPointerCapture(e.pointerId); }catch(x){}
    if(P.size===1){ clear(); s.heldAt=0; const g={t:1,x0:e.clientX,y0:e.clientY,turn:false};
      g.tm0=setTimeout(()=>{ if(s.g===g&&!g.turn&&!s.flown) g.ring=ring(g.x0,g.y0,"hold"); },140);
      g.tm=setTimeout(()=>{ if(s.g!==g||g.turn) return; if(g.ring){ g.ring.remove(); g.ring=null; } s.g=null; s.heldAt=performance.now(); lxHold(g.x0,g.y0); },520);
      s.g=g; }
    else if(P.size===2){ clear(); if(s.g&&s.g.turn) B("gestureEnd"); const [a,b]=[...P.values()]; s.g={t:2}; s.spinAt=performance.now(); B("pinchStart",a.x,a.y,b.x,b.y); } });
  t.addEventListener("pointermove",e=>{ if(!P.has(e.pointerId)) return; P.set(e.pointerId,{x:e.clientX,y:e.clientY}); const g=s.g; if(!g) return;
    if(g.t===1){
      if(!g.turn&&Math.hypot(e.clientX-g.x0,e.clientY-g.y0)>9){ clear(); turnFrom(e.clientX,e.clientY); return; }
      if(g.turn){ s.spinAt=performance.now(); B("turnTo",e.clientX-g.x0,e.clientY-g.y0,e.clientX); } }
    else if(g.t===2&&P.size>1){ const [a,b]=[...P.values()]; s.spinAt=performance.now(); B("pinchTo",a.x,a.y,b.x,b.y); } });
  const end=e=>{ if(!P.has(e.pointerId)) return; P.delete(e.pointerId); const g=s.g;
    if(e.type==="pointerup"&&s.heldAt){ s.eat=performance.now(); s.heldAt=0; }
    if(g&&(g.turn||g.t===2)){ s.eat=performance.now(); s.spinAt=performance.now();
      if(g.t===2&&P.size===1){ B("gestureEnd"); const [a]=[...P.values()]; turnFrom(a.x,a.y); return; }   /* one finger left: it keeps turning */
      if(!P.size){ B("gestureEnd"); s.g=null; } return; }
    if(g&&g.t===1) clear(); if(!P.size) s.g=null; };
  t.addEventListener("pointerup",end); t.addEventListener("pointercancel",end); t.addEventListener("lostpointercapture",end);
  /* a finger on the body never scrolls the page or zooms it; no callout menu on a hold */
  t.addEventListener("touchmove",e=>{ e.preventDefault(); },{passive:false});
  t.addEventListener("touchstart",e=>{ if(e.touches.length>1) e.preventDefault(); },{passive:false});
  t.addEventListener("gesturestart",e=>e.preventDefault());
  t.addEventListener("contextmenu",e=>e.preventDefault());
  /* a trackpad pinch (ctrl + wheel) zooms the same way on a desktop */
  t.addEventListener("wheel",e=>{ if(!e.ctrlKey) return; e.preventDefault(); s.spinAt=performance.now(); B("wheelZoom",Math.exp(-e.deltaY*0.01),e.clientX,e.clientY); },{passive:false});
  /* Front | Back: the toggle wins over the last spin */
  const hero=$("rdHero"); if(hero) hero.addEventListener("click",e=>{ if(e.target.closest("[data-fv]")) s.spinAt=0; },true);
}
/* a double-tap on the body: back out (zoomed in, or in a region), otherwise into the region under the finger */
function lxDouble(x,y){
  const s=lxS(); s.eat=performance.now();
  if(s.flown){ lxFlyBack(true); return; }
  let z=1; try{ z=Body.zoom?Body.zoom():1; }catch(e){}
  if(z>1.05){ lxResetView(); return; }
  lxFly(x,y);
}
/* zoom back out to the whole body, on the side you're facing */
function lxResetView(){
  try{ Pulse.buzz(5); const v=UIH.view||"front"; Body.camTo({zoom:1,px:0,py:0,yaw:v==="back"?Math.PI:0},reduced?0.01:0.45); }catch(e){}
}
/* while you turn him (and for the momentum after), Front | Back follows the side that faces you */
(()=>{ if(typeof onFace!=="function") return; const _f=onFace;
  onFace=function(face,deg,zoom){ let v; try{ v=_f.apply(this,arguments); }catch(e){}
    try{ if(performance.now()-(lxS().spinAt||0)<1600&&lxHome()&&typeof UIH!=="undefined"&&UIH.view!==face){ UIH.view=face; uiHeroSide(face); } }catch(e){}
    /* zoomed in (a pinch or a region): .lx-zoom fades the body out under the header and hides the colour key (lens.css) */
    try{ const app=$("app"), on=+zoom>1.04&&lxHome();
      if(app.classList.contains("lx-zoom")!==on){ app.classList.toggle("lx-zoom",on); const h=$("rdHero"); if(on&&h){ const r=h.getBoundingClientRect(); app.style.setProperty("--lxTop",Math.round(r.top)+"px"); app.style.setProperty("--lxBot",Math.round(r.bottom)+"px"); } } }catch(e){}
    return v; }; })();
/* what's under a point: a joint where the skeleton shows, otherwise the muscle (with the side you pressed) */
function lxHit(cx,cy,o){
  o=o||{}; const cv=$("stage")&&$("stage").querySelector("canvas"); if(!cv) return null;
  const r=cv.getBoundingClientRect(), x=cx-r.left, y=cy-r.top, line=lxLineCss();
  if(lxBonesOn()&&y<line&&BN){
    let best=null; const reach=o.reach||24;
    document.querySelectorAll("#bnJ [data-j]").forEach(g=>{ const m=/translate\(([-\d.]+),([-\d.]+)\)/.exec(g.getAttribute("transform")||""); if(!m) return;
      const d=Math.hypot(+m[1]-x,+m[2]-y); if(d<reach&&(!best||d<best.d)){ const [j,sd]=BN.J[+g.dataset.i]; best={d,kind:"j",id:j,sd,side:sd>0?"l":sd<0?"r":"b"}; } });
    if(best||lxIsBones()) return best;
  }
  const k=uiHeroPick(cx,cy); if(!k||!MUSCLES[k]) return null;
  let side="b";
  try{ if(!(typeof vxSoreMid==="function"&&vxSoreMid(k))){ const m=MCEN[k], a=Body.project([Math.abs(m[0]),m[1],m[2]]), b=Body.project([-Math.abs(m[0]),m[1],m[2]]);
    if(a&&b) side=Math.hypot(a.x-x,a.y-y)<=Math.hypot(b.x-x,b.y-y)?"l":"r"; } }catch(e){}
  return {kind:"m",id:k,side};
}
/* a hold: flag it sore (or unflag it), with a red pulse to confirm */
function lxHold(cx,cy){
  lxS().eat=performance.now(); if(!lxHome()||lxS().flown) return;
  const h=lxHit(cx,cy,{reach:28});
  if(!h){ Pulse.buzz(5); return; }
  let had=null; try{ had=vxSpots().find(f=>f.kind===h.kind&&f.id===h.id&&(f.side==="b"||h.side==="b"||f.side===h.side)); }catch(e){}   /* the other side adds to the flag (it merges to both) */
  const ring=(cls)=>{ const hr=$("rdHero"); if(!hr) return; const r=hr.getBoundingClientRect(), e=document.createElement("i");
    e.className="lx-ring "+cls; e.style.left=(cx-r.left)+"px"; e.style.top=(cy-r.top)+"px"; hr.appendChild(e); setTimeout(()=>e.remove(),1200); };
  if(had){ const n=vxFlagLabel(had); vxFlagRemove(h.kind,h.id); Pulse.buzz([8,30,8]); ring("off"); toast(`${n} unflagged`); track("flag_hold",{kind:h.kind,on:0}); }
  else { const f=vxFlagAdd(h.kind,h.id,h.side); if(!f) return; Pulse.buzz([12,40,18]); ring("red");
    try{ vxSoreS().flash=performance.now(); Body.fxKick&&Body.fxKick(); }catch(e){}
    toast(`${vxFlagLabel(f)} flagged · fade paused`); track("flag_hold",{kind:h.kind,on:1});
    lxTip("pinch"); }
  if(h.kind==="j") lxS().joint={j:h.id,sd:h.sd};
  lxS().js=null; lxRefresh();
}
/* the region under a point: the muscle there, or the nearest muscle centre that faces you */
function lxRegionAt(mx,my){
  const k=uiHeroPick(mx,my); if(k&&MUSCLES[k]) return MUSCLES[k].region||regionOf(k);
  const cv=$("stage")&&$("stage").querySelector("canvas"); if(!cv||!Body.project) return null;
  const r=cv.getBoundingClientRect(); let b=null;
  GLORDER.forEach(k=>{ const m=MCEN[k]; [1,-1].forEach(sg=>{ const p=Body.project([m[0]*sg,m[1],m[2]]); if(!p) return;
    if(Math.cos(p.yaw-sg*((MUSCLES[k]&&MUSCLES[k].face)||0))<0.12) return;
    const d=Math.hypot(p.x+r.left-mx,p.y+r.top-my); if(!b||d<b.d) b={d,k}; }); });
  return b&&b.d<90?(MUSCLES[b.k].region||regionOf(b.k)):null;
}
/* fly into a region: the camera moves in, the region lights, its sheet opens with "Train this region" */
function lxFly(mx,my){ const r=lxRegionAt(mx,my); if(!r){ Pulse.buzz(5); return; } lxFlyTo(r); }
function lxFlyTo(r){
  const R=REGIONS[r]; if(!R||!lxHome()) return; const s=lxS(); if(s.flown===r) return;
  s.flown=r; Pulse.buzz([8,30,12]); track("pinch_region",{r});
  try{ $("app").classList.add("lx-flown"); s.pre=s.line; if(s.line>0.004) lxAnim(0,250); }catch(e){}
  try{ if(UIH.view!==(Math.cos(R.face)>=0?"front":"back")){ UIH.view=Math.cos(R.face)>=0?"front":"back"; uiHeroSide(UIH.view); } }catch(e){}
  try{ Body.setSel({t:"region",id:r},UI_SEL_FADE); Body.focusAt(rdRegionCen(r),R.face,1.85); Body.pulse&&Body.pulse(R.muscles); }catch(e){ console.warn(e); }
  setTimeout(()=>{ if(lxS().flown!==r) return; try{ openSel({t:"region",id:r},false); Body.setSel({t:"region",id:r},UI_SEL_FADE); }catch(e){ console.warn(e); } },reduced?0:420);
}
/* back out: the sheet closes (or was closed), the camera returns, your pick comes back */
function lxFlyBack(closeSheet){
  const s=lxS(); if(!s.flown) return;
  if(closeSheet&&typeof sheetState!=="undefined"&&sheetState!=="closed"){ setSheet("closed"); return; }   /* the setSheet wrapper flies back */
  s.flown=null; try{ $("app").classList.remove("lx-flown"); uiHomeFigure(); }catch(e){}
  lxRestorePre();
}
/* back from a region: the X-ray goes back to where it was (the Bones lens stays the Bones lens) */
function lxRestorePre(){ const s=lxS(); if(s.pre>0.004) lxAnim(s.pre); s.pre=0; }
/* one-time tips, in order: a tap teaches the hold, the first flag teaches the pinch */
function lxTip(w){
  try{ const t=S.lxTips||(S.lxTips={}); if(t[w]) return; t[w]=1; save();
    setTimeout(()=>toast(w==="hold"?"Tip: drag to turn your body, pinch to zoom, hold a muscle to flag it sore.":"Tip: double-tap a region to zoom into it."),w==="hold"?900:2600); }catch(e){}
}

/* ---------- the skeleton: the old Bones layer's SVG, clipped to the X-ray line on the Body page ---------- */
function drawBones(){
  const el=$("bones"); if(!el) return; const ap=$("app");
  const blocked=["train","onboarding","storying","minding"].some(c=>ap.classList.contains(c));
  const home=lxBonesOn();
  const on=!!Body.project&&!blocked&&(home||(curLayer==="frame"&&!ap.classList.contains("tabbed")));
  el.classList.toggle("on",on); if(!on) return; bonesBuild(); lxClip(el,home);
  const fig=S.body==="f"&&FIGURES.f?"f":"m", L=RIG[fig], P=(p)=>Body.project(p), m=(v,s)=>[v[0]*s,v[1],v[2]];
  const a=P([0,1,0]), b=P([0,1.1,0]); if(!a||!b) return; const k=Math.hypot(a.x-b.x,a.y-b.y)*10;   // pixels per metre
  const seg=(p,q)=>{ const A=P(p),B=P(q); return A&&B?`M${A.x.toFixed(1)},${A.y.toFixed(1)}L${B.x.toFixed(1)},${B.y.toFixed(1)}`:""; };
  const poly=pts=>{ const Q=pts.map(P); return Q.every(Boolean)?"M"+Q.map(q=>q.x.toFixed(1)+","+q.y.toFixed(1)).join("L"):""; };
  const nk=L.neck[1], wy=L.waist[1], hy=L.hip[1];
  let bone="";
  [1,-1].forEach(s=>{ bone+=seg([0,nk-0.06,0.03],m(L.sh,s))+seg(m(L.sh,s),m(L.el,s))+seg(m(L.el,s),m(L.wr,s))+seg(m(L.wr,s),m(L.hand,s))
    +seg(m(L.hip,s),m(L.kn,s))+seg(m(L.kn,s),m(L.an,s))+seg(m(L.an,s),m(L.toe,s))
    +poly([[0,wy-0.06,-0.04],m([0.13,wy-0.08,-0.01],s),m([0.14,hy+0.04,0.02],s),m(L.hip,s),m([0.05,hy-0.04,0.07],s),[0,hy-0.05,0.08]]); });
  bone+=seg([0,nk-0.1,0.1],[0,nk-0.34,0.1]);   // sternum
  let rib=""; [0.08,0.14,0.2,0.26,0.32].forEach((d,i)=>{ const y=nk-0.06-d, w=0.115+0.02*Math.sin(i/4*Math.PI);
    [1,-1].forEach(s=>{ rib+=poly([[0,y,-0.07],m([w*0.8,y+0.005,-0.05],s),m([w,y-0.02,0.01],s),m([w*0.75,y-0.05,0.07],s),[0,y-0.06,0.1]]); }); });
  let sp=""; for(let y=nk+0.02;y>hy-0.02;y-=0.04){ const q=P([0,y,-0.06]); if(!q) continue; const r=(0.011+(nk-y)*0.008)*k; sp+=`M${(q.x-r).toFixed(1)},${q.y.toFixed(1)}a${r.toFixed(1)},${(r*0.75).toFixed(1)} 0 1,0 ${(2*r).toFixed(1)},0a${r.toFixed(1)},${(r*0.75).toFixed(1)} 0 1,0 ${(-2*r).toFixed(1)},0`; }
  $("bnBone").setAttribute("d",bone); $("bnBone").setAttribute("stroke-width",(0.024*k).toFixed(2));
  $("bnRib").setAttribute("d",rib); $("bnRib").setAttribute("stroke-width",(0.011*k).toFixed(2));
  $("bnSpine").setAttribute("d",sp);
  const hc=P([0,nk+0.17,0.0]); if(hc){ const sk=$("bnSkull"); sk.setAttribute("cx",hc.x.toFixed(1)); sk.setAttribute("cy",hc.y.toFixed(1)); sk.setAttribute("rx",(0.082*k).toFixed(1)); sk.setAttribute("ry",(0.105*k).toFixed(1)); sk.setAttribute("stroke-width",(0.012*k).toFixed(2)); }
  $("bnJaw").setAttribute("d",poly([[-0.06,nk+0.1,0.05],[-0.035,nk+0.05,0.08],[0.035,nk+0.05,0.08],[0.06,nk+0.1,0.05]]));
  const pos={neck:()=>[0,nk-0.02,-0.04],shoulder:s=>m(L.sh,s),elbow:s=>m(L.el,s),wrist:s=>m(L.wr,s),lowback:()=>[0,wy-0.02,-0.07],hip:s=>m(L.hip,s),knee:s=>m(L.kn,s),ankle:s=>m(L.an,s)};
  const sj=sel&&sel.t==="joint"?sel.id:null, js=home?lxJointStates().by:null, pk=home&&lxS().joint;
  $("bnJ").querySelectorAll("[data-j]").forEach(g=>{ const [j,s]=BN.J[+g.dataset.i], q=P(pos[j](s||1)); if(!q) return; g.setAttribute("transform",`translate(${q.x.toFixed(1)},${q.y.toFixed(1)})`);
    g.classList.toggle("sel",j===sj||!!(pk&&pk.j===j&&pk.sd===s)); if(js) g.classList.toggle("ache",js[+g.dataset.i]==="watch"); });
}
/* the skeleton shows above the X-ray line only (the whole of it in the Bones lens, and on every other screen) */
function lxClip(el,home){
  if(!el.querySelector("#lxClip")){ const d=el.querySelector("defs"); if(!d) return;
    d.insertAdjacentHTML("beforeend",`<clipPath id="lxClip" clipPathUnits="userSpaceOnUse"><rect id="lxClipR" x="-4000" y="-4000" width="9000" height="99999"/></clipPath>`);
    el.querySelectorAll("g[filter],#bnJ").forEach(g=>g.setAttribute("clip-path","url(#lxClip)")); }
  const line=home?lxLineCss():1e5, r=$("lxClipR"); if(r) r.setAttribute("height",String(Math.max(0,4000+(line<0?0:Math.min(line,1e5)))));
}

/* ---------- the glass above the line: one BODY_FX effect ---------- */
(()=>{ try{
  if(!window.BODY_FX) return;
  BODY_FX.add({ id:"lx-split", uniforms:["uLxS"],
    decl:`uniform vec4 uLxS;   // x the X-ray line (gl_FragCoord.y, px from the bottom), y amount, z soft edge (px)`,
    final:`if(uLxS.y>0.001){ float lxa=smoothstep(uLxS.x-uLxS.z,uLxS.x+uLxS.z,gl_FragCoord.y)*uLxS.y;
  float lxg=dot(col0,vec3(0.299,0.587,0.114)); vec3 lxb=vec3(lxg)*0.36+HAIR*pow(1.-ndv,2.4)*0.34;
  col=mix(col,lxb,lxa); }`,
    draw(gl,U,pick){
      if(pick||!U||!U.uLxS) return;
      const fx=window.BODY_FX, shot=!!(fx&&fx.inShot), on=!shot&&lxBonesOn();
      if(!on){ gl.uniform4f(U.uLxS,0,0,1,0); return; }
      const c=gl.canvas, h=c.clientHeight||1, k=c.height/h, line=lxLineCss();
      gl.uniform4f(U.uLxS,line>=1e5?-1e5:(h-line)*k,1,1.5*k,0);
    },
    busy:()=>!!lxS().anim });
}catch(e){ console.warn("Ossa: lens fx",e); } })();

/* ---------- wiring into the rest of the app (run at include time; one each) ---------- */
(()=>{ try{
  /* the Body page keeps its lens's colours: Recovery when you chose it, otherwise Rank */
  const _k=rkSync; rkSync=function(){ const r=_k.apply(this,arguments); try{ if(typeof RDH!=="undefined"&&RDH.on&&TAB==="today"&&!$("app").classList.contains("train")) Body.setRank&&Body.setRank(lxRankOn()); }catch(e){} return r; };
  /* on the Body page the body stays muscle by muscle, even zoomed into a region */
  const _om=onMode; onMode=function(m){ if(lxHome()){ mode=1; return; } return _om.apply(this,arguments); };
  /* a sheet closing on the Body page: fly back out of a region, put your pick back */
  const _ss=setSheet; setSheet=function(st){ const r=_ss.apply(this,arguments);
    try{ if(st==="closed"&&typeof RDH!=="undefined"&&RDH.on&&TAB==="today"){ if(lxS().flown){ lxS().flown=null; $("app").classList.remove("lx-flown"); uiHomeFigure(); lxRestorePre(); }
      else Body.setSel&&Body.setSel(UIH.sel?{t:"muscle",id:UIH.sel}:null,UI_SEL_FADE); }
      else if(st==="closed"&&TAB==="body") lxBareNow(); }catch(e){}
    return r; };
  /* a muscle's sheet opened on the Body page makes it your pick */
  const _os=openSel; openSel=function(s,focus){ const home=typeof RDH!=="undefined"&&RDH.on&&TAB==="today";
    const r=_os.apply(this,home?[s,false]:arguments);
    try{ if(home&&s&&s.t==="muscle"&&UIH.sel!==s.id){ UIH.sel=s.id; lxS().joint=null; const c=$("uWeak"); if(c){ c.outerHTML=lxCardHTML(); uiFocusCardWire(); } UIHD.k=""; uiHeroDraw(true); }
      if(home&&lxS().col==="rec"&&typeof SHT!=="undefined"){ SHT="recover"; renderSheet(false); } }catch(e){}
    return r; };
  /* [data-go] links (search, plan chips, your regions) land on the Body page */
  const _go=go; go=function(tok){
    try{ const [t,id]=String(tok||"").split(":");
      if((t==="m"||t==="r")&&lxCanRoute()){ rkShow3D(); setTimeout(()=>{ try{ if(t==="r") lxFlyTo(id); else openSel({t:"muscle",id},false); }catch(e){} },reduced?0:380); return; } }catch(e){}
    return _go.apply(this,arguments); };
  /* "open the Bones layer" (the unlock row on Profile) is the Bones lens now */
  const _sl=setLayer; setLayer=function(id){
    try{ if(id==="frame"&&lxCanRoute()&&!(typeof vxSoreS==="function"&&vxSoreS().open)){ rkShow3D(); setTimeout(()=>{ try{ lxSetLens("bones"); }catch(e){} },reduced?0:380); return; } }catch(e){}
    return _sl.apply(this,arguments); };
  /* the skeleton moves with the page like the body does */
  const _rs=rdScroll; rdScroll=function(){ const r=_rs.apply(this,arguments); try{ const b=$("bones"); if(b) b.style.transform=RDH.on?$("stage").style.transform:""; }catch(e){} return r; };
  const _rh=rdHomeOn; rdHomeOn=function(on){ const r=_rh.apply(this,arguments);
    try{ if(!on){ const b=$("bones"); if(b) b.style.transform=""; $("app").classList.remove("lx-bn","lx-flown","lx-rec"); lxS().flown=null; } else lxApplyLine(); }catch(e){}
    return r; };
  /* a flag added or cleared anywhere: the card, the readout and the legend follow */
  vxOn("flag",()=>{ lxS().js=null; if(lxHome()) lxRefresh(); });
  vxOn("unflag",()=>{ lxS().js=null; if(lxHome()) lxRefresh(); });
  /* a log, a workout or a new day: the counts and the card change */
  ["log","workout","day"].forEach(ev=>vxOn(ev,()=>setTimeout(()=>{ try{ lxS().js=null; if(lxHome()) lxRefresh(); }catch(e){} },0)));
  /* the body-check and posture views on the 3D stage: "Done" comes home */
  const _cv=ckView; ckView=function(on){ const r=_cv.apply(this,arguments); if(!on) lxBareNow(); return r; };
  const _pv=psViewOff; psViewOff=function(){ const r=_pv.apply(this,arguments); lxBareNow(); return r; };
  /* the quest tiles read a new result as soon as its panel closes */
  const _pc=psClose; psClose=function(){ const v=_pc.apply(this,arguments); lxBareNow(); try{ if(TAB==="today"&&$("lxQuests")){ $("lxQuests").outerHTML=lxQuestsHTML(); lxWireParts(); } }catch(e){} return v; };
  const _cp=closePanels; closePanels=function(){ const v=_cp.apply(this,arguments); try{ if(TAB==="today"&&$("lxQuests")){ $("lxQuests").outerHTML=lxQuestsHTML(); lxWireParts(); } }catch(e){} return v; };
  /* the old 3D page has no way in any more: a bare 3D stage (nothing over it) goes back to the Body page */
  const _dt=drawTabs; drawTabs=function(){ const r=_dt.apply(this,arguments); try{ if(TAB==="body"){ clearTimeout(lxBare.t); lxBare.t=setTimeout(()=>lxBare(0),700); } }catch(e){} return r; };
}catch(e){ console.warn("Ossa: lens wrappers",e); } })();
function lxBare(n){
  try{
    if(TAB!=="body"||!lxCanRoute()) return;
    const c=$("app").classList;
    const busy=["train","onboarding","storying","minding","demoing","ckview","peek","full","timelining"].some(x=>c.contains(x))
      ||(typeof MIND!=="undefined"&&MIND.open)||(typeof vxSoreS==="function"&&vxSoreS().open)
      ||window.CHECKVIEW||(typeof DEMO!=="undefined"&&DEMO)||(typeof STORY!=="undefined"&&STORY)||(typeof RDL!=="undefined"&&RDL)||(typeof LDEMO!=="undefined"&&LDEMO)
      ||(typeof sheetState!=="undefined"&&sheetState!=="closed")||!!document.querySelector(".panel.on,.mindv:not([hidden]),#psX.on,.pwx,.share.on");
    clearTimeout(lxBare.t);
    if(busy){ lxBare.t=setTimeout(()=>lxBare(0),700); return; }   /* something is over the stage: look again */
    if(!n){ lxBare.t=setTimeout(()=>lxBare(1),600); return; }   /* still bare a moment later: go home */
    setTab("today");
  }catch(e){}
}
function lxBareNow(){ try{ clearTimeout(lxBare.t); lxBare.t=setTimeout(()=>lxBare(1),0); }catch(e){} }
/* every way into the old 3D view lands on the Body page, in a lens (o.lens "rank" | "rec" | "bones", o.view) */
function rkShow3D(o){
  o=o||{};
  try{ closePanels(); }catch(e){}
  const ap=$("app"); if(ap.classList.contains("train")) setMode("body");
  if(TAB!=="today") setTab("today");
  try{ if(o.view&&o.view!==UIH.view){ UIH.view=o.view; uiHeroSide(o.view); Body.setView&&Body.setView(o.view); } }catch(e){}
  try{ lxSetLens(o.lens||lxS().col||"rank",{quiet:true}); }catch(e){}
}
