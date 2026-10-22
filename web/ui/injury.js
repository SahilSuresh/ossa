/* =========================================================
   SORE SPOTS (Ossa 2.0, Phase 1)
   "Sore spots" is where you flag a joint or a muscle that's sore. A flag never changes a plan:
   it pauses that muscle's fade, keeps it out of dares and nudges, tags plan rows, and shows
   red on your 3D body (steady everywhere, pulsing only while this screen is open).
   The flag data and its helpers live in web/ui/vessel.js (vxSpots, vxFlagAdd, vxFlagRemove,
   vxFlagged, vxFlagFor, vxFlagLabel, vxJointMuscles, vxMuscleJoint).
   Side: 'l' is the user's own left = rest-space +x, shown on the viewer's RIGHT from the front
   and on the viewer's LEFT from the back (proved on screen, Phase 1 WP0). 'r' is -x.
   Included after body-fx.js and train.js. No top-level const or let: hoisted functions only,
   with their state on function properties, so nothing here can hit a TDZ at boot.
   ========================================================= */

/* the screen's state (not saved): open, where it was opened from, the selected spot, the add picker */
function vxSoreS(){ return vxSoreS.s||(vxSoreS.s={open:false,from:null,layer:null,sel:null,add:null,pick:"j"}); }
function vxSoreKey(f){ return f?f.kind+":"+f.id:""; }
/* active flags, oldest first */
function vxSoreList(){ try{ return vxSpots().slice().sort((a,b)=>a.at<b.at?-1:a.at>b.at?1:0); }catch(e){ return []; } }
function vxSoreCur(){ const st=vxSoreS(); if(st.add&&st.add.id) return st.add; const l=vxSoreList(); return l.find(f=>vxSoreKey(f)===st.sel)||l[0]||null; }
function vxSoreMid(id){ return id==="neck"||id==="lowback"||id==="abs"; }
function vxSoreJName(j){ return ({neck:"Neck",shoulder:"Shoulder",elbow:"Elbow",wrist:"Wrist",lowback:"Lower back",hip:"Hip",knee:"Knee",ankle:"Ankle"})[j]||j; }
function vxSoreName(f){ return f.kind==="j"?vxSoreJName(f.id):MUSCLES[f.id].name; }
/* "Left knee" for a flag, or for a spot being added */
function vxSoreLabel(f){ try{ return vxFlagLabel(f); }catch(e){ return vxSoreName(f); } }
function vxSoreAgo(f){ try{ return agoText(Math.max(0,dayDiff(f.at))); }catch(e){ return ""; } }
/* the relief routine for a flag: its joint, or the joint a muscle works around */
function vxSoreJoint(f){ return f?(f.kind==="j"?f.id:vxMuscleJoint(f.id)):null; }
/* the flag a plan row answers to: its primary muscle's own flag or a joint flag covering it, or the joint it loads */
function vxRowFlag(it){
  try{
    if(!it||it.jwhy||it.mob||!MUSCLES[it.primary]) return null;
    if(typeof vxIsStretch==="function"&&vxIsStretch(it.name)) return null;
    const f=vxFlagFor(it.primary); if(f) return f;
    const j=vxMuscleJoint(it.primary); return j?vxSpots().find(x=>x.kind==="j"&&x.id===j)||null:null;
  }catch(e){ return null; }
}
/* plan rows: a tag only. The plan itself never changes */
function vxRowTag(it){ return vxRowFlag(it)?`<em class="vul">Flagged</em>`:""; }
/* for the entry rows on the Body page and Recover tab: {n, t, s} */
function vxSoreRow(){
  const l=vxSoreList();
  if(!l.length) return {n:0,t:"Something aching?",s:"Flag a sore spot or find the likely cause."};
  return {n:l.length,t:"Sore spots",s:`${l.length} flagged · ${l.slice(0,2).map(vxSoreLabel).join(", ")}${l.length>2?"…":""}`};
}

/* ---------------------------------------------------------
   RED ON THE 3D BODY — one BODY_FX effect, "sore"
   Muscle flags tint that muscle on the flagged side; joint flags glow around the joint
   (a soft ellipsoid in rest space). Steady on every screen; it pulses, and the rest of the
   body goes quiet, only while Sore spots is open (never under reduced motion).
   Off in exercise demos and in Body.shot unless it asks for flags.
   --------------------------------------------------------- */
/* a joint's glow: centre (rest space, +x = the figure's left) and radii, for side s (1 left, -1 right, 0 middle) */
function vxSoreGeo(j,s,L){
  const m=v=>[v[0]*s,v[1],v[2]];
  switch(j){
    case "neck": return {c:[0,L.neck[1]-0.035,-0.01],r:[0.055,0.06,0.075]};
    case "lowback": return {c:[0,L.waist[1]+0.015,-0.085],r:[0.1,0.085,0.06]};
    case "shoulder": return {c:m(L.sh),r:[0.07,0.07,0.075]};
    case "elbow": return {c:m(L.el),r:[0.05,0.055,0.05]};
    case "wrist": return {c:m(L.wr),r:[0.04,0.045,0.04]};
    case "hip": return {c:m(L.hip),r:[0.08,0.08,0.09]};
    case "knee": return {c:[L.kn[0]*s,L.kn[1],L.kn[2]+0.035],r:[0.07,0.085,0.09]};
    case "ankle": return {c:m(L.an),r:[0.05,0.05,0.055]};
  }
  return null;
}
function vxSoreSides(f){ return vxSoreMid(f.id)?[0]:f.side==="l"?[1]:f.side==="r"?[-1]:[1,-1]; }
function vxSoreRig(){ try{ return RIG[S.body==="f"&&FIGURES.f?"f":"m"]; }catch(e){ return null; } }
/* the red, read once from tokens.css (--alert) */
function vxSoreColour(){
  if(vxSoreColour.c) return vxSoreColour.c;
  let c=[1,0.231,0.188];
  try{ const v=getComputedStyle(document.documentElement).getPropertyValue("--alert").trim(), m=/^#?([0-9a-f]{6})$/i.exec(v);
    if(m){ const n=parseInt(m[1],16); c=[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]; } }catch(e){}
  return (vxSoreColour.c=new Float32Array(c));
}
/* the arrays the shader reads, rebuilt only when something changes */
function vxSoreFX(){
  const st=vxSoreS(), L=vxSoreRig(), list=vxSoreList(), cur=st.open?vxSoreCur():null, add=st.open&&st.add&&st.add.id?st.add:null;
  const key=JSON.stringify([list,S.body,st.open,cur&&vxSoreKey(cur),add]);
  if(vxSoreFX.k===key&&vxSoreFX.v) return vxSoreFX.v;
  const N=GLORDER.length, A={n:0,m:new Float32Array(N*2),j:new Float32Array(14*4),r:new Float32Array(14*3).fill(1),c:vxSoreColour()};
  const J={};
  const put=(f,a)=>{
    if(f.kind==="m"){ const i=GLORDER.indexOf(f.id); if(i<0) return; vxSoreSides(f).forEach(s=>{ if(s>=0) A.m[i*2]=Math.max(A.m[i*2],a); if(s<=0) A.m[i*2+1]=Math.max(A.m[i*2+1],a); }); A.n++; return; }
    if(!L) return;
    vxSoreSides(f).forEach(s=>{ const g=vxSoreGeo(f.id,s,L); if(!g) return; const k=f.id+s; if(!J[k]) J[k]={g,a:0}; J[k].a=Math.max(J[k].a,a); });
    A.n++;
  };
  list.forEach(f=>put(f,st.open?(cur&&vxSoreKey(cur)===vxSoreKey(f)?1:0.6):0.9));
  if(add) put(add,0.8);
  Object.values(J).slice(0,14).forEach((e,i)=>{ A.j.set([...e.g.c,e.a],i*4); A.r.set(e.g.r,i*3); });
  vxSoreFX.k=key; vxSoreFX.v=A;
  return A;
}
(()=>{ try{
  if(!window.BODY_FX) return;
  BODY_FX.add({ id:"sore", uniforms:["uSoreM","uSoreJ","uSoreR","uSoreK","uSoreC"],
    decl:`uniform vec2 uSoreM[N];   // per muscle: x the figure's left (+x), y its right
uniform vec4 uSoreJ[14];  // joint glows: rest-space centre (+x is the figure's left), w amount
uniform vec3 uSoreR[14];  // their radii
uniform vec4 uSoreK;      // x on, y pulse (Sore spots open), z quiet the rest of the body
uniform vec3 uSoreC;      // the red (--alert)
float soreBeat(){ return uSoreK.y>0.5?0.62+0.38*sin(uFxT*3.4):1.; }`,
    muscle:`if(uSoreK.x>0.5&&uDemoOn<0.5){
  if(uSoreK.z>0.001){ vec3 gm=col0+HAIR*(w*0.08*(0.35+dif)+fib*0.07+bl*0.05+edge*w*0.04); col=mix(col,gm,uSoreK.z); }
  float sfm=(vR.x>0.?uSoreM[id].x:uSoreM[id].y)*w;
  if(sfm>0.001){ float sb=soreBeat(); col=mix(col,uSoreC*(0.55+0.5*dif),clamp(sfm*0.85*sb,0.,0.92)); col+=uSoreC*sfm*sb*(0.1+fib*0.3+edge*0.35); }
}`,
    final:`if(uSoreK.x>0.5&&uDemoOn<0.5&&lay==1){
  float sjg=0.;
  for(int i=0;i<14;i++){ vec4 J=uSoreJ[i]; if(J.w<=0.) continue; vec3 d=(vR-J.xyz)/uSoreR[i]; sjg+=J.w*exp(-dot(d,d)); }
  sjg=min(sjg,1.)*(1.-smoothstep(0.,1.,uX))*(1.-uHZ);
  if(sjg>0.003){ float sb=soreBeat(); col=mix(col,uSoreC*(0.62+0.5*dif),sjg*0.88*sb); col+=uSoreC*sjg*sb*(0.18+pow(1.-ndv,2.)*0.55); }
}`,
    draw(gl,U,pick){
      if(pick||!U||!U.uSoreK) return;
      const fx=window.BODY_FX, shot=!!(fx&&fx.inShot), A=vxSoreFX(), st=vxSoreS();
      /* red when there are flags (in Body.shot only if it asks); the quiet body whenever this screen is open */
      /* not on the workout screens either: there red would read as "worked hard" next to the trained muscles */
      const ap=document.getElementById("app"), wk=!!ap&&/(tactive|tdone|tplan)/.test(ap.className);
      const red=A.n>0&&!(shot&&!fx.shotFlags)&&!wk, live=st.open&&!shot;
      /* a hold on the Body page (lens.js) sets st.flash: the new flag pulses red for a moment to confirm it */
      const fla=!!st.flash&&!reduced&&performance.now()-st.flash<1300;
      gl.uniform4f(U.uSoreK,red||live?1:0,(red&&live&&!reduced)||(red&&fla)?1:0,live?0.9:0,0);
      if(!red&&!live) return;
      gl.uniform2fv(U.uSoreM,A.m); gl.uniform4fv(U.uSoreJ,A.j); gl.uniform3fv(U.uSoreR,A.r); gl.uniform3fv(U.uSoreC,A.c);
    },
    /* the Body page stays still: frames only while this screen is open and motion is allowed */
    busy:()=>{ const st=vxSoreS(); return (!!st.flash&&!reduced&&performance.now()-st.flash<1300)||(st.open&&!reduced&&(vxSpots().length>0||!!(st.add&&st.add.id))); } });
}catch(e){ console.warn(e); } })();

/* ---------------------------------------------------------
   THE SORE SPOTS SCREEN
   On the 3D tab, over the live body: a see-through top (header, the body, a callout for the
   selected spot) and a sheet below (the list, flag a spot, the relief routine, when to see someone).
   --------------------------------------------------------- */
function vxSorePanel(){
  let p=$("soreP"); if(p) return p;
  p=document.createElement("section"); p.className="panel u-own u-sore"; p.id="soreP"; p.setAttribute("aria-label","Sore spots");
  p.innerHTML=`<div class="sore-head"><div><span class="u-eyebrow" id="soreEb"></span><h2 class="u-h1">Sore spots</h2></div>
      <button class="u-icon-btn round u-x" id="soreX" aria-label="Close"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></div>
    <div class="sore-hero" id="soreHero">
      <svg class="sore-lead" id="soreLead" aria-hidden="true"></svg>
      <div class="sore-call" id="soreCall" hidden></div>
      <div class="u-seg sore-view" id="soreView" role="tablist" aria-label="Turn your body"><button data-v="0" role="tab">Front</button><button data-v="1" role="tab">Back</button></div>
    </div>
    <div class="sore-sheet" id="soreSheet"></div>`;
  $("app").appendChild(p);
  $("soreX").onclick=()=>{ Pulse.buzz(6); vxSoreClose(true); };
  $("soreView").addEventListener("click",e=>{ const b=e.target.closest("[data-v]"); if(!b) return; Pulse.buzz(6); Body.camTo&&Body.camTo({yaw:b.dataset.v==="1"?Math.PI:0},reduced?0.01:0.6); });
  /* the body under the screen: a tap picks the spot to flag, a swipe turns you round */
  const h=$("soreHero"); let g=null;
  h.addEventListener("pointerdown",e=>{ if(e.target.closest("button")) return; g={x:e.clientX,y:e.clientY,t:performance.now()}; });
  h.addEventListener("pointerup",e=>{ if(!g) return; const dx=e.clientX-g.x, dy=e.clientY-g.y, dt=performance.now()-g.t; g=null;
    if(Math.abs(dx)>50&&Math.abs(dy)<70){ const b=Math.cos(vxSoreYaw())<0; Pulse.buzz(6); Body.camTo&&Body.camTo({yaw:b?0:Math.PI},reduced?0.01:0.6); return; }
    if(Math.hypot(dx,dy)<10&&dt<600) vxSoreTap(e.clientX,e.clientY); });
  h.addEventListener("pointercancel",()=>{ g=null; });
  return p;
}
function vxSoreYaw(){ try{ const p=Body.project&&Body.project([0,1,0]); return p?p.yaw:0; }catch(e){ return 0; } }
/* pre: nothing, a flag to select ({kind,id}), or {add:true, kind, id, side} to start flagging one */
function vxSoreOpen(pre){
  const app=$("app"); if(!app||!S.body||app.classList.contains("onboarding")) return;
  const st=vxSoreS();
  if(!st.open){ st.from={tab:TAB,train:app.classList.contains("train")}; st.layer=curLayer; }
  try{ closePanels(); }catch(e){}
  if(sheetState!=="closed") setSheet("closed");
  if(typeof MIND!=="undefined"&&MIND.open){ if(typeof uiLeaveMind==="function") uiLeaveMind(); else closeMind(); }
  if(app.classList.contains("train")) setMode("body");
  const moved=TAB!=="body"; if(moved) setTab("body");
  if(curLayer!=="muscle") setLayer("muscle");
  st.open=true; st.add=null;
  if(pre&&pre.add){ st.add={kind:pre.kind||"j",id:pre.id||null,side:pre.side||"b"}; st.pick=st.add.kind; }
  else if(pre&&pre.id){ const f=vxSoreList().find(x=>x.kind===pre.kind&&x.id===pre.id)||(pre.kind==="m"?vxFlagFor(pre.id):null); if(f) st.sel=vxSoreKey(f); }
  if(!vxSoreList().some(f=>vxSoreKey(f)===st.sel)) st.sel=vxSoreKey(vxSoreList()[0]);
  const p=vxSorePanel(); app.classList.add("u-soreon"); vxSoreRender();
  /* coming from another tab, it fades in while that tab slides away */
  const show=()=>{ if(!st.open) return; p.classList.add("on"); try{ Body.reframe(); }catch(e){} vxSoreTurn(st.add&&st.add.id?st.add:vxSoreCur(),true); };
  if(moved&&!reduced) setTimeout(show,260); else requestAnimationFrame(show);
  try{ track("sore_open",{n:vxSoreList().length}); }catch(e){}   // a count only, never the spot
}
/* the cleanup every close path runs (closePanels calls it) */
function vxSoreDone(){
  const st=vxSoreS(); if(!st.open) return;
  st.open=false; st.add=null;
  const app=$("app"); app.classList.remove("u-soreon");
  const p=$("soreP"); if(p) p.classList.remove("on");
  try{ if(st.layer&&curLayer!==st.layer) setLayer(st.layer); }catch(e){}
  try{ Body.camTo&&Body.camTo({yaw:0},reduced?0.01:0.5); Body.reframe(); Body.fxKick&&Body.fxKick(); }catch(e){}
}
/* back: return to the screen it was opened from. false: just close (another screen opens next) */
function vxSoreClose(back){
  const st=vxSoreS(), from=st.from;
  closePanels();
  if(back===false||!from) return;
  if(from.train&&TR.view!=="done"){ setMode("train"); return; }
  if(from.tab&&from.tab!==TAB) setTab(from.tab);
}
/* turn the body so the spot shows: the lower back and back muscles from behind */
function vxSoreTurn(f,now){
  if(!f||!Body.camTo) return;
  const back=f.kind==="j"?f.id==="lowback":MUSCLES[f.id]&&MUSCLES[f.id].face>1.57;
  Body.camTo({yaw:back?Math.PI:0,zoom:1,px:0,py:0},reduced?0.01:now?0.7:0.55);
}
function vxSoreRender(){
  const st=vxSoreS(), sh=$("soreSheet"), eb=$("soreEb"); if(!sh) return;
  const l=vxSoreList(), cur=vxSoreCur(), esc=uiEsc;
  eb.textContent=l.length?`${l.length} flagged`:"Nothing flagged"; eb.classList.toggle("none",!l.length);
  let h="", bar="";
  if(st.add){
    const a=st.add, joints=["neck","shoulder","elbow","wrist","lowback","hip","knee","ankle"], ms=Object.values(REGIONS).flatMap(r=>r.muscles).filter(k=>MUSCLES[k]);
    const on=(kind,id)=>a.kind===kind&&a.id===id, has=(kind,id)=>l.some(f=>f.kind===kind&&f.id===id);
    const chip=(kind,id,n)=>`<button class="u-chip${on(kind,id)?" on":""}" data-pk="${kind}:${id}" aria-pressed="${on(kind,id)}">${has(kind,id)?`<i aria-hidden="true"></i>`:""}${esc(n)}</button>`;
    h=`<div class="sore-add"><div class="u-section-h"><span class="u-eyebrow">Flag a sore spot</span><button class="u-link" id="soreCancel">Cancel</button></div>
      <p class="u-small">Tap it on your body, or pick it here.</p>
      <div class="u-seg sore-kind" role="tablist" aria-label="Joint or muscle"><button data-kind="j" role="tab" class="${st.pick==="j"?"on":""}" aria-selected="${st.pick==="j"}">Joints</button><button data-kind="m" role="tab" class="${st.pick==="m"?"on":""}" aria-selected="${st.pick==="m"}">Muscles</button></div>
      <div class="u-chips sore-chips">${st.pick==="j"?joints.map(j=>chip("j",j,vxSoreJName(j))).join(""):ms.map(k=>chip("m",k,MUSCLES[k].name)).join("")}</div>
      </div>`;
    /* the side sits by the button, so it can't be missed below the list */
    bar=`${a.id&&!vxSoreMid(a.id)?`<div class="sore-side-h"><span class="u-eyebrow">Which side</span><span class="u-small">Your own left and right</span></div>
        <div class="u-seg sore-side" role="radiogroup" aria-label="Which side">${[["l","Left"],["r","Right"],["b","Both"]].map(([v,n])=>`<button role="radio" data-side="${v}" class="${a.side===v?"on":""}" aria-checked="${a.side===v}">${n}</button>`).join("")}</div>`:""}
      <button class="u-btn primary block sore-go" id="soreFlag"${a.id?"":" disabled"}>${a.id?`Flag ${esc(vxSoreLabel(a).toLowerCase())}`:"Pick a spot to flag"}</button>`;
  } else if(l.length){
    h=`<div class="u-section-h sore-lh"><span class="u-eyebrow">Flagged (${l.length})</span><span class="u-eyebrow">Fade paused</span></div>
      <div class="sore-list">${l.map(f=>{ const k=vxSoreKey(f), sel=cur&&vxSoreKey(cur)===k;
        return `<div class="sore-row${sel?" on":""}"><button class="sore-sel" data-sel="${k}" aria-pressed="${sel}"><i class="sore-dot" aria-hidden="true"></i><span><b>${esc(vxSoreLabel(f))}</b><small>Flagged ${esc(vxSoreAgo(f))}</small></span></button>
          <button class="u-btn small sore-off" data-off="${k}">Not sore now</button></div>`; }).join("")}</div>
      <button class="u-btn block sore-addb" id="soreAdd"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>Flag a sore spot</button>`;
    bar=cur&&vxSoreJoint(cur)?`<button class="u-btn primary block sore-go" id="soreRelief">Relief routine · ${esc(vxSoreLabel(cur))}</button>`:"";
  } else {
    h=`<div class="sore-empty"><b class="u-h2">Nothing flagged</b><p class="u-small">Flag a spot that's sore and it won't fade while you rest it.</p>
      <button class="u-link sore-why" id="soreCause">Not sure what's causing it? ›</button></div>`;
    bar=`<button class="u-btn primary block sore-go" id="soreAdd">Flag a sore spot</button>`;
  }
  sh.innerHTML=`<div class="sore-scroll" id="soreScroll">${h}<p class="sore-foot">${esc(typeof RED_FLAGS==="string"?RED_FLAGS:"")}</p></div>${bar?`<div class="sore-bar">${bar}</div>`:""}`;
  /* the callout for the selected spot (or the one being added) */
  const c=$("soreCall"), cf=st.add?(st.add.id?st.add:null):cur;
  if(c){ c.hidden=!cf;
    if(cf) c.innerHTML=st.add?`<span class="u-eyebrow">To flag</span><b>${esc(vxSoreLabel(cf))}</b><small>Flagging pauses the fade here.</small>`
      :`<span class="u-eyebrow">Flagged</span><b>${esc(vxSoreLabel(cf))}</b><small>You flagged this ${esc(vxSoreAgo(cf))}.</small>`; }
  vxSoreWire();
  /* the picked chip stays in view (picked on the body, or from a muscle's sheet) */
  const sc=$("soreScroll"), on=sc&&sc.querySelector(".sore-chips .u-chip.on");
  if(on){ const t=on.offsetTop-sc.offsetTop; if(t<sc.scrollTop||t+on.offsetHeight>sc.scrollTop+sc.clientHeight) sc.scrollTop=Math.max(0,t-sc.clientHeight/2); }
  try{ Body.reframe(); Body.fxKick&&Body.fxKick(); }catch(e){}
  vxSorePlace();
}
function vxSoreWire(){
  const st=vxSoreS(), sh=$("soreSheet"); if(!sh) return;
  const q=s=>sh.querySelector(s);
  sh.querySelectorAll("[data-sel]").forEach(b=>b.onclick=()=>{ Pulse.buzz(6); st.sel=b.dataset.sel; vxSoreRender(); vxSoreTurn(vxSoreCur()); });
  sh.querySelectorAll("[data-off]").forEach(b=>b.onclick=()=>{
    const [kind,id]=b.dataset.off.split(":"), f=vxSoreList().find(x=>x.kind===kind&&x.id===id), n=f?vxSoreLabel(f):"";
    Pulse.buzz(8); vxFlagRemove(kind,id); if(st.sel===b.dataset.off) st.sel=vxSoreKey(vxSoreList()[0]);
    vxSoreRender(); vxSoreTurn(vxSoreCur()); if(n) toast(`${n} unflagged`); });
  if(q("#soreAdd")) q("#soreAdd").onclick=()=>{ Pulse.buzz(6); st.add={kind:st.pick||"j",id:null,side:"b"}; vxSoreRender(); };
  if(q("#soreCancel")) q("#soreCancel").onclick=()=>{ Pulse.buzz(6); st.add=null; vxSoreRender(); vxSoreTurn(vxSoreCur()); };
  if(q("#soreCause")) q("#soreCause").onclick=()=>{ Pulse.buzz(6); vxSoreClose(false); openRelief(); };
  if(q("#soreRelief")) q("#soreRelief").onclick=()=>{ const j=vxSoreJoint(vxSoreCur()); Pulse.buzz(8); vxSoreClose(false); if(typeof trJointRelief==="function") trJointRelief(j); else openRelief(); };
  sh.querySelectorAll("[data-kind]").forEach(b=>b.onclick=()=>{ Pulse.buzz(6); st.pick=b.dataset.kind; vxSoreRender(); });
  sh.querySelectorAll("[data-pk]").forEach(b=>b.onclick=()=>{ const [kind,id]=b.dataset.pk.split(":"); Pulse.buzz(6);
    st.add={kind,id,side:vxSoreMid(id)?"b":st.add&&st.add.id&&!vxSoreMid(st.add.id)?st.add.side:"b"}; vxSoreRender(); vxSoreTurn(st.add); });
  sh.querySelectorAll("[data-side]").forEach(b=>b.onclick=()=>{ if(!st.add) return; Pulse.buzz(6); st.add.side=b.dataset.side; vxSoreRender(); });
  if(q("#soreFlag")) q("#soreFlag").onclick=()=>{ const a=st.add; if(!a||!a.id) return;
    const f=vxFlagAdd(a.kind,a.id,a.side); if(!f) return; Pulse.buzz([10,40,10]);
    st.add=null; st.sel=vxSoreKey(f); vxSoreRender(); vxSoreTurn(f); toast(`${vxSoreLabel(f)} flagged · fade paused`); };
}
/* a tap on the body: the nearest joint within reach, or the muscle under the finger, on the side you tapped */
function vxSoreTap(cx,cy){
  const st=vxSoreS(), cv=$("stage")&&$("stage").querySelector("canvas"), L=vxSoreRig(); if(!cv||!Body.project) return;
  const r=cv.getBoundingClientRect(), x=cx-r.left, y=cy-r.top, yaw=vxSoreYaw();
  /* a joint wins only for a tap close to it: about 9 cm on the body, 14 to 26 px on screen */
  const a=Body.project([0,1,0]), b=Body.project([0,1.1,0]), ppm=a&&b?Math.hypot(a.x-b.x,a.y-b.y)*10:200, reach=Math.max(14,Math.min(26,0.09*ppm));
  let best=null;
  if(L) ["neck","shoulder","elbow","wrist","lowback","hip","knee","ankle"].forEach(j=>(vxSoreMid(j)?[0]:[1,-1]).forEach(s=>{
    if(j==="lowback"&&Math.cos(yaw)>0) return;   // only from behind
    const g=vxSoreGeo(j,s,L), p=g&&Body.project(g.c); if(!p) return; const d=Math.hypot(p.x-x,p.y-y);
    if(d<reach&&(!best||d<best.d)) best={d,kind:"j",id:j,side:s>0?"l":s<0?"r":"b"}; }));
  if(!best){ const k=Body.pickAt&&Body.pickAt(x,y);
    if(k&&MUSCLES[k]&&MCEN[k]){ let side="b";
      if(!vxSoreMid(k)){ const m=MCEN[k], a=Body.project([Math.abs(m[0]),m[1],m[2]]), b=Body.project([-Math.abs(m[0]),m[1],m[2]]);
        if(a&&b) side=Math.hypot(a.x-x,a.y-y)<=Math.hypot(b.x-x,b.y-y)?"l":"r"; }
      best={kind:"m",id:k,side}; } }
  if(!best) return;
  Pulse.buzz(8); st.pick=best.kind; st.add={kind:best.kind,id:best.id,side:vxSoreMid(best.id)?"b":best.side}; vxSoreRender();
}
/* keeps the callout next to its spot as the body turns (called on every frame the body draws) */
function vxSorePlace(){
  const st=vxSoreS(); if(!st.open) return;
  const hero=$("soreHero"), call=$("soreCall"), svg=$("soreLead"), seg=$("soreView"); if(!hero||!call||!svg) return;
  const yaw=vxSoreYaw(), front=Math.cos(yaw)>=0;
  if(seg) seg.querySelectorAll("[data-v]").forEach(b=>{ const on=(b.dataset.v==="0")===front; b.classList.toggle("on",on); b.setAttribute("aria-selected",on); });
  const f=st.add?(st.add.id?st.add:null):vxSoreCur(), cv=$("stage")&&$("stage").querySelector("canvas"), L=vxSoreRig();
  if(!f||!cv||!Body.project||call.hidden){ if(svg.innerHTML) svg.innerHTML=""; call.style.visibility=f&&!call.hidden?"visible":"hidden"; return; }
  const hr=hero.getBoundingClientRect(), cr=cv.getBoundingClientRect(), W=hero.clientWidth, H=hero.clientHeight;
  /* the spot's anchor on screen, on each flagged side, and whether it faces you */
  const pts=[];
  vxSoreSides(f).forEach(s=>{
    let p3,face;
    if(f.kind==="j"){ const g=L&&vxSoreGeo(f.id,s,L); if(!g) return; p3=g.c; face=f.id==="lowback"?Math.PI:null; }
    else { const m=MCEN[f.id]; if(!m) return; p3=s?[Math.abs(m[0])*s,m[1],m[2]]:m; face=MUSCLES[f.id].face; }
    const p=Body.project(p3); if(!p) return;
    pts.push({x:cr.left-hr.left+p.x,y:cr.top-hr.top+p.y,y3:p3[1],vis:face==null||Math.cos(yaw-(s||1)*face)>0.25});
  });
  const v=pts.filter(p=>p.vis), a=(v.length?v:pts).sort((p,q)=>q.x-p.x)[0];
  if(!a){ svg.innerHTML=""; return; }
  /* the card sits beside the spot, outside the body's outline where there's room, never over the spot itself */
  const gut=16, minW=128, right=a.x>=W/2-4;
  const e=[0.3,-0.3].map(x=>Body.project([x,a.y3,0])).filter(Boolean).map(q=>cr.left-hr.left+q.x);
  const edgeR=e.length?Math.max(...e):a.x+30, edgeL=e.length?Math.min(...e):a.x-30;
  let left,cw;
  if(right){ left=Math.min(Math.max(a.x+22,edgeR+8),Math.max(a.x+22,W-gut-minW)); cw=Math.min(176,W-gut-left); }
  else { const r=Math.max(Math.min(a.x-22,edgeL-8),Math.min(a.x-22,gut+minW)); cw=Math.min(176,r-gut); left=r-cw; }
  cw=Math.max(96,Math.round(cw)); left=Math.max(gut-8,Math.min(W-gut-cw+8,left));
  if(call.style.width!==cw+"px") call.style.width=cw+"px";
  const ch=call.offsetHeight, top=Math.max(4,Math.min(H-ch-56,a.y-ch/2));
  call.style.transform=`translate(${Math.round(left)}px,${Math.round(top)}px)`; call.style.visibility="visible";
  if(a.vis){ const ex=right?left:left+cw, ey=Math.max(top+14,Math.min(top+ch-14,a.y));
    svg.innerHTML=`<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}"/><circle cx="${a.x.toFixed(1)}" cy="${a.y.toFixed(1)}" r="4"/>`; }
  else svg.innerHTML="";
}
/* the hero box the body is framed into while the screen is open (frameTo reads rdHeroBox) */
function vxSoreBox(){
  const h=$("soreHero"), app=$("app"); if(!h||!app) return null;
  const a=app.getBoundingClientRect(), r=h.getBoundingClientRect(); if(r.height<80) return null;
  return {top:r.top-a.top+6,bottom:r.bottom-a.top-50,cx:a.width/2};
}

/* ---------------------------------------------------------
   WRAPPERS (run at include time; one each)
   --------------------------------------------------------- */
(()=>{
  /* every close path (X, Back, swipe, another tab) runs the cleanup */
  const _cp=closePanels; closePanels=function(){ const r=_cp.apply(this,arguments); try{ vxSoreDone(); }catch(e){ console.warn(e); } return r; };
  /* the back swipe goes back to where Sore spots was opened from */
  const _gb=goBack; goBack=function(){ if(vxSoreS().open){ vxSoreClose(true); return true; } return _gb.apply(this,arguments); };
  /* frame the body into the see-through part of Sore spots */
  const _hb=rdHeroBox; rdHeroBox=function(){ if(vxSoreS().open){ const b=vxSoreBox(); if(b) return b; } return _hb.apply(this,arguments); };
  /* Bones layer: a steady red ring on each flagged joint, per side (1 is the figure's left) */
  const _db=drawBones; drawBones=function(){ const r=_db.apply(this,arguments);
    try{ const el=$("bones"); if(el&&el.classList.contains("on")&&BN){ const l=vxSoreList().filter(f=>f.kind==="j");
      el.querySelectorAll("[data-j]").forEach(g=>{ const [j,s]=BN.J[+g.dataset.i]||[], f=l.find(x=>x.id===j);
        g.classList.toggle("vul",!!f&&(!s||f.side==="b"||(s>0?"l":"r")===f.side)); }); } }catch(e){}
    try{ vxSorePlace(); }catch(e){}
    return r; };
  /* the joint sheet: "Flag it" with a side, or what's flagged */
  const _rj=renderJoint; renderJoint=function(){ const r=_rj.apply(this,arguments); try{ vxSoreJointUI(); }catch(e){ console.warn(e); } return r; };
  /* a muscle's sheet: a "Flag as sore" chip, or the flag that covers it */
  const _rs=renderSheet; renderSheet=function(){ const r=_rs.apply(this,arguments); try{ vxSoreSheetChip(); }catch(e){ console.warn(e); } return r; };
  /* plan rows: "You flagged your left knee…" (relief moves keep their own reason) */
  const _why=whyFor; whyFor=function(it){ try{ const f=vxRowFlag(it); if(f) return `You flagged your ${vxFlagLabel(f,true)}. Go easy, or swap it.`; }catch(e){} return _why.apply(this,arguments); };
  /* the weekly review never picks a flagged muscle as next week's focus */
  const _rw=reviewWeek; reviewWeek=function(){ const R=_rw.apply(this,arguments);
    try{ if(R&&R.focus&&R.focus.k&&/^Wake up/.test(R.focus.t)&&vxFlagged(R.focus.k)){
      const k=GLORDER.filter(x=>!isNew(x)&&!R.hit.includes(x)&&!vxFlagged(x)).sort((a,b)=>daysSince(b)-daysSince(a))[0];
      R.focus=k?{k,t:`Wake up your ${MUSCLES[k].name.toLowerCase()}`,s:`Not trained for ${daysSince(k)>=60?"a while":daysSince(k)+" days"}. Two sets of ${MUSCLES[k].ex[0][0].toLowerCase()} in your next session.`}
        :{k:null,t:"Keep the rhythm",s:`${plural(R.W.length,"session")} again next week and you're building something real.`}; } }catch(e){}
    return R; };
})();
/* a notification or link "sore" opens the screen */
try{ vxRoute("sore",()=>{ vxSoreOpen(); }); }catch(e){}
/* a flag added or cleared anywhere: redraw what shows it */
try{ vxOn("flag",()=>{ if(vxSoreS().open) vxSoreRender(); }); vxOn("unflag",()=>{ if(vxSoreS().open) vxSoreRender(); }); }catch(e){}

function vxSoreJointUI(){
  if(!sel||sel.t!=="joint") return;
  const j=sel.id, box=$("shIn")&&$("shIn").querySelector(".sh-top>div"); if(!box) return;
  const f=vxSoreList().find(x=>x.kind==="j"&&x.id===j), mid=vxSoreMid(j), sd=vxSoreJointUI.side||"b";
  const d=document.createElement("div"); d.className="jt-sore";
  d.innerHTML=f?`<div class="wkinfo vul">Flagged · ${uiEsc(vxSoreLabel(f))} · fade paused</div>
      <div class="jt-sore-acts"><button class="u-btn small" data-js="open">Sore spots</button><button class="u-btn small ghost" data-js="off">Not sore now</button></div>`
    :`<div class="jt-sore-acts">${mid?`<span class="u-small">Sore right now?</span>`:`<div class="u-seg jt-side" role="radiogroup" aria-label="Which side">${[["l","Left"],["r","Right"],["b","Both"]].map(([v,n])=>`<button role="radio" data-side="${v}" class="${v===sd?"on":""}" aria-checked="${v===sd}">${n}</button>`).join("")}</div>`}
      <button class="u-btn small" data-js="flag">Flag it</button></div>`;
  box.appendChild(d);
  d.querySelectorAll("[data-side]").forEach(b=>b.onclick=()=>{ Pulse.buzz(6); vxSoreJointUI.side=b.dataset.side; d.querySelectorAll("[data-side]").forEach(x=>{ const on=x===b; x.classList.toggle("on",on); x.setAttribute("aria-checked",on); }); });
  d.querySelectorAll("[data-js]").forEach(b=>b.onclick=()=>{ const a=b.dataset.js; Pulse.buzz(8);
    if(a==="open"){ vxSoreOpen({kind:"j",id:j}); return; }
    if(a==="flag"){ const g=vxFlagAdd("j",j,mid?"b":vxSoreJointUI.side||"b"); if(g) toast(`${vxSoreLabel(g)} flagged · fade paused`); }
    if(a==="off"){ const n=vxSoreLabel(f); vxFlagRemove("j",j); toast(`${n} unflagged`); }
    renderJoint(); });
  try{ uiFitPeek(); Body.reframe(); }catch(e){}
}
function vxSoreSheetChip(){
  if(typeof DEMO!=="undefined"&&DEMO) return;
  if(!sel||sel.t!=="muscle"||!MUSCLES[sel.id]) return;
  const k=sel.id, box=$("shIn")&&$("shIn").querySelector(".sh-top>div"); if(!box||box.querySelector(".sore-chip")) return;
  const f=vxFlagFor(k), b=document.createElement("button");
  b.className="u-chip sore-chip"+(f?" on":""); b.innerHTML=f?`<i aria-hidden="true"></i>Flagged · ${uiEsc(vxSoreLabel(f))}`:"Flag as sore";
  b.onclick=()=>{ Pulse.buzz(6); if(f) vxSoreOpen({kind:f.kind,id:f.id}); else vxSoreOpen({add:true,kind:"m",id:k,side:"b"}); };
  box.appendChild(b);
  try{ uiFitPeek(); }catch(e){}
}
