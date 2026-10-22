/* =========================================================
   PRESTIGE (Ossa 2.0, Phase 5 "Evolve") — package "goals". Prefix pz, classes .pz-.
   One job: start or follow a prestige lap on a muscle at Unbreakable III (score 94+).
   A lap is a game rule on its own 0 → 80 curve: the muscle's own load counts 1.5× (vxRP run on a
   separate book, never the rank's), it ends at 80, and each finished lap adds a star to the muscle's
   rank and, for the first three laps, a material on that muscle: Black marble, Silver, Gold
   (laps 4+ a star only, pending Andrej). The rank and S.scores are never touched.

   Saved state (created lazily by pzState(); Load demo / Start fresh drop it):
     S.prestige = {v:1, m:{ [muscle]: {lv, lap:null|0..79, c, at, mats:[], mat} }, show:true}
       lv laps finished · lap the running lap's points (null = none running) · c its signed carry ·
       at the day the lap started · mats the materials earned, in order · mat the one worn
   API (other packages): pzState() pzReady(k) pzStart(k) pzEarned() → [{k,lv,mats,mat}]
     pzShow(on?) pzMatList() pzMatsNow() (render's pure reader) pzTile() (core's hub) pzDemoSeed() (?evo=1)
   Hooks: vxOn("credit") changes S.prestige.m only (it runs before the session is saved) and stashes
     pzOnCredit.last; vxOn("workout") fills R.ev.laps / R.ev.ready, then bxKick, track and a deferred
     vxEmit("evolve",{what:"lap"}) when a lap finished; vxOn("log") does the same for a quick log plus
     its 3.6 s toast; vxOn("rkTag") puts the stars on the Muscle ranks rows; vxOn("evolve") (lap, look)
     and vxOn("log") redraw the muscle sheet's Prestige row and the focus card under #evV (pzRedrawSeen).
   Wrappers (outermost, once each): renderSheet (the muscle sheet's Prestige row), uiFocusCardHTML and
     uiFocusCardWire (the Body page's focus card at 94+).
   Start-up rule: function declarations only, state on function properties, include-time code in try.
   ========================================================= */

/* ---------- state ---------- */
function pzMatList(){ return [{id:"marble",name:"Black marble"},{id:"silver",name:"Silver"},{id:"gold",name:"Gold"}]; }
function pzMatName(id){ const m=pzMatList().find(x=>x.id===id); return m?m.name:""; }
/* read only: never creates or saves (tiles, readers, the GL draw) */
function pzPeek(){ const P=S.prestige; return P&&typeof P==="object"&&P.m&&typeof P.m==="object"?P:{v:1,m:{},show:true}; }
function pzState(){
  if(!S.prestige||typeof S.prestige!=="object"||!S.prestige.m||typeof S.prestige.m!=="object") S.prestige={v:1,m:{},show:true};
  if(typeof S.prestige.show!=="boolean") S.prestige.show=true;
  return S.prestige;
}
function pzM(k){ const e=pzPeek().m[k]; return e&&typeof e==="object"?e:null; }
function pzScore(k){ return Math.round(+((S.scores||{})[k])||0); }
function pzRunning(k){ const e=pzM(k); return !!(e&&e.lap!=null); }
function pzLv(k){ const e=pzM(k); return e?(+e.lv||0):0; }
/* ready: Unbreakable III (94+) and no lap running */
function pzReady(k){ return !!MUSCLES[k]&&pzScore(k)>=94&&!pzRunning(k); }
/* the material a lap would earn on k now (null from lap 4: a star only) */
function pzNextMat(k){ const l=pzMatList(), lv=pzLv(k); return lv<l.length?l[lv]:null; }
function pzStart(k){
  if(!pzReady(k)) return false;
  const P=pzState(), e=P.m[k]&&typeof P.m[k]==="object"?P.m[k]:(P.m[k]={lv:0,lap:null,c:0,at:null,mats:[],mat:null});
  if(!Array.isArray(e.mats)) e.mats=[];
  e.lv=+e.lv||0; e.lap=0; e.c=0; e.at=dkey(0);
  save();
  try{ track("pz_start"); }catch(e2){}
  vxEmit("evolve",{what:"lap",k});
  return true;
}
/* a lap reached 80: state only (called inside the credit listener; the session saves right after) */
function pzFinishLap(k){
  const e=pzState().m[k]; if(!e) return;
  e.lv=(+e.lv||0)+1; e.lap=null; e.c=0;
  if(!Array.isArray(e.mats)) e.mats=[];
  const nx=pzMatList().find(x=>!e.mats.includes(x.id));
  if(nx){ e.mats.push(nx.id); e.mat=nx.id; }
  return nx||null;
}
function pzEarned(){
  const m=pzPeek().m;
  return Object.keys(m).filter(k=>MUSCLES[k]&&m[k]&&(+m[k].lv||0)>0).map(k=>({k,lv:+m[k].lv||0,mats:(m[k].mats||[]).slice(),mat:m[k].mat||null}));
}
/* prestige materials shown on the body: getter, or setter (saves, kicks the look, emits) */
function pzShow(on){
  if(on===undefined) return pzPeek().show!==false;
  const P=pzState(), v=!!on; if(P.show===v) return v;
  P.show=v; save();
  try{ if(typeof bxKick==="function") bxKick(); }catch(e){}
  vxEmit("evolve",{what:"look"});
  return v;
}
/* render's pure reader: {muscle: "marble"|"silver"|"gold"} for every muscle wearing one ({} when hidden) */
function pzMatsNow(){
  const P=pzPeek(), out={}; if(P.show===false) return out;
  Object.keys(P.m).forEach(k=>{ const e=P.m[k], id=e&&e.mat; if(MUSCLES[k]&&id&&(+e.lv||0)>0&&(id==="marble"||id==="silver"||id==="gold")) out[k]=id; });
  return out;
}

/* ---------- picking a muscle: newly ready, else a running lap, else ready again, else the closest ---------- */
function pzPick(){
  const ks=GLORDER.filter(k=>MUSCLES[k]);
  const by=(a,b)=>pzScore(b)-pzScore(a)||ks.indexOf(a)-ks.indexOf(b);
  const fresh=ks.filter(k=>pzReady(k)&&!pzLv(k)).sort(by);
  if(fresh.length) return {k:fresh[0],st:"ready"};
  const run=ks.filter(pzRunning).sort((a,b)=>(+pzM(b).lap||0)-(+pzM(a).lap||0)||by(a,b));
  if(run.length) return {k:run[0],st:"run"};
  const again=ks.filter(pzReady).sort(by);
  if(again.length) return {k:again[0],st:"ready"};
  return {k:ks.slice().sort(by)[0]||"pec_major",st:"locked"};
}
function pzStateOf(k){ return pzRunning(k)?"run":pzReady(k)?"ready":"locked"; }
/* sessions of 3 direct sets (load 3.6 × 1.5) to finish k's running lap, simulated on its own book */
function pzLapSess(k){
  const e=pzM(k); if(!e||e.lap==null) return null;
  const B={scores:{[k]:+e.lap||0},rpCarry:{[k]:+e.c||0}}; let n=0;
  try{ while(B.scores[k]<80&&n<200){ vxRP({[k]:3.6*1.5},[k],true,B); n++; } }catch(e2){ return null; }
  return B.scores[k]>=80?Math.max(1,n):null;
}

/* ---------- the hub tile ---------- */
/* the sub fits the tile at 375 px for every name ("Lower back · 34 of 80"): the gold bar says it's a lap,
   and "· ready" reads right for plural names too ("Glutes · ready") */
function pzTile(){
  const p=pzPick(), k=p.k, nm=rkSay(k);
  const dot=GLORDER.some(x=>pzReady(x)&&!pzLv(x));
  if(p.st==="run"){ const lap=+pzM(k).lap||0; return {sub:`${nm} · ${lap} of 80`,bar:Math.max(0,Math.min(1,lap/80)),c:"var(--gold)",dot}; }
  if(p.st==="ready") return {sub:`${nm} · ready`,bar:null,c:"var(--gold)",dot};
  const s=pzScore(k);
  return {sub:s>0?`${nm} · ${94-s} to go`:"At Unbreakable III",bar:null,c:"var(--gold)",dot:false};
}

/* ---------- small pieces ---------- */
function pzStarSvg(){ return `<svg class="pz-st" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.9 6.2 20.1l1.4-6.4L2.7 9.3l6.5-.7z"/></svg>`; }
function pzSwHTML(id,cls){ return `<i class="pz-sw pz-sw-${id||"none"}${cls?" "+cls:""}" aria-hidden="true"></i>`; }
/* the short state used by the sheet row, the focus card and the Change list */
function pzShort(k){
  const e=pzM(k);
  if(pzRunning(k)) return `Lap ${(+e.lv||0)+1} · ${+e.lap||0} of 80`;
  if(pzLv(k)) return `★${pzLv(k)}${e.mat?` · ${pzMatName(e.mat)}`:""}`;
  if(pzReady(k)) return "Prestige ready";
  return "";
}

/* ---------- the still: the muscle close up, in the material it's earning or wearing ---------- */
function pzShot(k,mat,px){
  if(typeof Body==="undefined"||!Body||Body.kind!=="gl"||typeof Body.shot!=="function"||typeof MCEN==="undefined"||!MCEN[k]) return null;
  const w=Math.max(64,Math.min(1400,px[0]||0)), h=Math.max(64,Math.min(1400,px[1]||0));
  const look=typeof bxLookKey==="function"?uiSafe(()=>bxLookKey(),""):"";
  const key=[k,mat||"-",w,h,S.body||"",pzScore(k),look].join("|");
  const c=pzShot.c||(pzShot.c={});
  if(c[key]) return c[key];
  const m=MCEN[k], yaw=+MUSCLES[k].face||0, sg=Math.sin(yaw)<-0.01?-1:1;
  const fx=mat?{look:{mats:{[k]:mat}}}:undefined;
  let url=null;
  try{ url=Body.shot({at:[Math.abs(m[0])*sg,m[1],m[2]],span:0.6,yaw,size:[w,h],...(fx?{fx}:{})}); }catch(e){ console.warn("Ossa: prestige still",e); url=null; }
  if(!url) return null;
  const ks=Object.keys(c); if(ks.length>=6) delete c[ks[0]];
  c[key]=url; return url;
}
function pzMatsOk(){ try{ return typeof bxOk==="function"&&!!bxOk("mats"); }catch(e){ return false; } }

/* ---------- the view ---------- */
function pzK(o){ o=o||{}; if(!o.k||!MUSCLES[o.k]) o.k=pzPick().k; return o.k; }
function pzTitle(o){ return `Prestige · ${rkSay(pzK(o))}`; }
function pzEye(o){ const k=pzK(o); return pzScore(k)>=94?"Unbreakable III":rankOf(pzScore(k)); }
function pzAct(){ return `<button class="pz-chg" id="pzChg" aria-label="Change muscle">Change</button>`; }
function pzRender(b,o,bar){
  o=o||{};
  const k=pzK(o), st=pzStateOf(k), e=pzM(k)||{lv:0,lap:null,c:0,mats:[],mat:null}, lv=+e.lv||0, nm=rkSay(k), low=nm.toLowerCase();
  const nx=pzNextMat(k), worn=e.mat||null;
  /* the material on the hero: the one being earned (ready, running), else the one worn; a pill tap shows the worn one */
  const showWorn=!!o.worn&&!!worn;
  const mat=st==="locked"?null:showWorn?worn:(nx?nx.id:worn);
  const lapOf=id=>pzMatList().findIndex(x=>x.id===id)+1;
  const pillTx=st==="locked"?`${pzMatName("marble")} · lap 1`:mat?`${pzMatName(mat)} · lap ${lapOf(mat)}`:`★${lv}`;
  const canCycle=(e.mats||[]).length>=2&&st!=="locked";
  const matsOk=pzMatsOk();
  /* "Your chest sets…", but "Sets for your glutes…" (plural names: ranks.js's rule, Serratus and Soleus stay singular) */
  const plural=/s$/i.test(nm)&&!/us$/i.test(nm);
  const rows=[
    nx?[pzSwHTML(nx.id,"pz-ri"),`${nx.name} on your ${uiEsc(low)}, for good`]:[pzStarSvg(),"Another prestige star"],
    [`<b class="pz-x" aria-hidden="true">1.5×</b>`,plural?`Sets for your ${uiEsc(low)} count 1.5× on the&nbsp;lap`:`Your ${uiEsc(low)} sets count 1.5× on the&nbsp;lap`],
    [pzStarSvg(),"A prestige star next to its rank"]
  ];
  const rowsHTML=`<div class="pz-rows">${rows.map(r=>`<div class="pz-row"><span class="pz-ic">${r[0]}</span><span>${r[1]}</span></div>`).join("")}</div>`;
  let mid="", btn="";
  if(st==="run"){
    const lap=+e.lap||0, n=pzLapSess(k);
    mid=`<div class="pz-prog" role="img" aria-label="Lap ${lv+1}: ${lap} of 80"><div class="pz-prog-h"><b>Lap ${lv+1} · ${lap} of 80</b></div>
      <span class="u-bar pz-bar"><i style="width:${Math.round(lap/80*100)}%;--c:var(--gold)"></i></span>
      <small>${n==null?"A long way to go":`about ${n} session${n===1?"":"s"} to go`}</small></div>${rowsHTML}`;
    btn=`<button class="u-btn primary block pz-go" id="pzGo">Train ${uiEsc(low)}</button>`;
  } else if(st==="ready"){
    mid=rowsHTML;
    btn=`<button class="u-btn gold block pz-go pz-start" id="pzGo"><span>Start prestige lap</span><small>Your rank stays</small></button>`;
  } else {
    /* "Closest:" only when no muscle is at 94+ and this one is (one of) the closest; else just this muscle's gap */
    const s=pzScore(k), ks=GLORDER.filter(x=>MUSCLES[x]);
    const none=!ks.some(x=>pzScore(x)>=94||pzRunning(x)), best=Math.max(0,...ks.map(pzScore));
    const lock=none&&s===best
      ?["Prestige opens at Unbreakable III.",s>0?`Closest: ${uiEsc(nm)}, ${94-s} to go.`:"Train any muscle to the top rank to start one."]
      :["Opens at Unbreakable III.",`${uiEsc(nm)}: ${94-s} to go.`];
    mid=`<div class="pz-lock"><p>${lock[0]}</p><small>${lock[1]}</small></div>${rowsHTML.replace('class="pz-rows"','class="pz-rows pz-dim"')}`;
    btn=`<button class="u-btn primary block pz-go" id="pzGo">Train ${uiEsc(low)}</button>`;
  }
  b.innerHTML=`<div class="pz pz-${st}">
    <div class="pz-hero">
      <div class="pz-pic" id="pzPic" role="img" aria-label="Your ${uiEsc(low)}${mat&&matsOk?` in ${pzMatName(mat).toLowerCase()}`:""}"></div>
      <${canCycle?"button":"span"} class="pz-pill${st==="locked"?" off":""}" id="pzPill"${canCycle?` aria-label="${uiEsc(pillTx)}. Tap to wear the next one"`:""}><span>${uiEsc(pillTx)}</span></${canCycle?"button":"span"}>
    </div>
    <div class="pz-mid">${mid}</div>
    ${btn}
  </div>`;
  /* the picture: a framed still at the box's own size; plain rank colours without render's materials */
  const pic=$("pzPic");
  if(pic){
    const px=typeof evPx==="function"?evPx(pic):[0,0];
    const url=pzShot(k,matsOk?mat:null,px);
    pic.innerHTML=url?`<img src="${url}" alt="" draggable="false">`
      :`<span class="u-hexw pz-hexw" style="--c:var(--rk-5)"><span class="u-hex pz-hex" style="--hx:120px">${pzStarSvg()}</span></span>`;
    /* the material can't be seen on the hero (no still, or render can't draw it): a swatch on the pill instead */
    const pl=$("pzPill"); if(pl&&mat&&!(url&&matsOk)){ pl.classList.add("sw"); pl.insertAdjacentHTML("afterbegin",pzSwHTML(mat)); }
  }
  pzRender.n=(pzRender.n||0)+1;
  /* after a change: core's "evolve" listener redraws #evV on its own setTimeout(0), queued by the emit.
     Ours is queued after it, so it only draws when core didn't: one render per tap */
  const redraw=n0=>setTimeout(()=>{ try{ if(pzRender.n!==n0) return;
    if(typeof evRefresh==="function"&&typeof evOn==="function"&&evOn()) evRefresh(); else if(b.isConnected) pzRender(b,o,bar); }catch(e){ console.warn(e); } },0);
  const pill=$("pzPill");
  if(pill&&canCycle) pill.onclick=()=>{
    const P=pzState(), x=P.m[k]; if(!x||!Array.isArray(x.mats)||x.mats.length<2) return;
    Pulse.buzz(6);
    const i=x.mats.indexOf(x.mat); x.mat=x.mats[(i+1)%x.mats.length];
    o.worn=true; save();
    try{ if(typeof bxKick==="function") bxKick(); }catch(e2){}
    toast(`${pzMatName(x.mat)} on your ${low}`);
    const n0=pzRender.n; vxEmit("evolve",{what:"look"}); redraw(n0); };
  const go=$("pzGo");
  if(go) go.onclick=()=>{
    if(st==="ready"){ Pulse.buzz([12,50,20]); const n0=pzRender.n; if(pzStart(k)){ toast(`${nm} prestige lap started`); redraw(n0); } return; }
    Pulse.buzz(8); if(typeof evTrain==="function") evTrain(k); else toast("That isn't ready yet."); };
  const chg=$("pzChg");
  if(chg) chg.onclick=()=>{ Pulse.buzz(6); pzChange(o); };
}
/* "Change": every muscle with a lap or at 94+ (always), then the 5 closest while there is room.
   One column of 44 px rows; when that would scroll, two columns of 44 px cells (name over state, no rank line);
   still too tall, the closest go from the end; then the list moves up under the eyebrow (pz-tight: every muscle
   at 94+ on a 375x667 phone with insets). Only a list longer than that scrolls (core's sheet scrolls). */
function pzChange(o){
  if(typeof evSheet!=="function") return;
  const ks=GLORDER.filter(k=>MUSCLES[k]);
  const pri=k=>pzRunning(k)?0:pzReady(k)&&!pzLv(k)?1:pzReady(k)?2:3;
  const top=ks.filter(k=>pzRunning(k)||pzScore(k)>=94||pzLv(k)>0).sort((a,b)=>pri(a)-pri(b)||pzScore(b)-pzScore(a));
  const near=ks.filter(k=>!top.includes(k)).sort((a,b)=>pzScore(b)-pzScore(a)).slice(0,5);
  const cur=pzK(o);
  const row=(k,nr)=>{ const s=pzScore(k), t=rankTier(s), sh=pzShort(k)||(s>0?`${94-s} to go`:"Not trained yet");
    return `<button class="pz-pick${k===cur?" on":""}${nr?" nr":""}" data-pzk="${k}" aria-label="${uiEsc(rkSay(k))}: ${uiEsc(rankOf(s))}, ${uiEsc(sh)}"><i class="rk-sq" style="--c:var(--rk-${t})" data-t="${t}"></i><span class="pz-pick-n">${uiEsc(rkSay(k))}<small>${uiEsc(rankOf(s))}</small></span><em>${uiEsc(sh)}</em></button>`; };
  const html=`<span class="u-eyebrow pz-sh-eye">Choose a muscle</span><div class="pz-picks">${top.map(k=>row(k,false)).join("")}${near.map(k=>row(k,true)).join("")}</div>`;
  evSheet(html,(root,s)=>{
    root=root||document;
    /* fit: measured now (layout is synchronous; the sheet's slide-in transform doesn't change its sizes) */
    try{
      const box=root.closest?root.closest(".ev-sh-in"):null, list=root.querySelector(".pz-picks");
      const over=()=>box&&box.scrollHeight>box.clientHeight+1;
      if(box&&list&&over()){
        list.classList.add("pz-two");
        let nr=list.querySelectorAll(".pz-pick.nr");
        for(let i=nr.length-1;i>=0&&over();i--) if(nr[i].dataset.pzk!==cur) nr[i].remove();
        if(over()){ list.classList.add("pz-tight"); const ey=root.querySelector(".pz-sh-eye"); if(ey) ey.classList.add("pz-tight"); }
        pzChange.fit={rows:list.querySelectorAll(".pz-pick").length,two:true,tight:list.classList.contains("pz-tight"),scroll:over()};
      } else pzChange.fit={rows:list?list.querySelectorAll(".pz-pick").length:0,two:false,tight:false,scroll:false};
    }catch(e){ console.warn(e); }
    root.querySelectorAll("[data-pzk]").forEach(x=>x.onclick=()=>{
      Pulse.buzz(6); const k=x.dataset.pzk; if(typeof evSheetClose==="function") evSheetClose(true);
      if(k===pzK(o)) return; o.k=k; o.worn=false; if(typeof evRefresh==="function") evRefresh(); }); });
}

/* ---------- the lap engine (hooks) ---------- */
/* credit: state only. Runs inside vxCredit, before finishWorkout / quickLog save, so no save, no emit, no kick */
function pzOnCredit(C){
  pzOnCredit.last=null;
  const P=S.prestige; if(!C||!P||!P.m||typeof P.m!=="object") return;
  const m=P.m, ks=Object.keys(m).filter(k=>MUSCLES[k]&&m[k]&&m[k].lap!=null);
  if(!ks.length) return;
  const L={}; ks.forEach(k=>{ const l=+((C.L||{})[k])||0; if(l>0) L[k]=l*1.5; });
  const laps=[], done=[]; let G=null;
  if(Object.keys(L).length){
    const Bk={scores:{},rpCarry:{}}; ks.forEach(k=>{ Bk.scores[k]=+m[k].lap||0; Bk.rpCarry[k]=+m[k].c||0; });
    G=vxRP(L,C.prim||[],true,Bk);
    ks.forEach(k=>{ if(!(L[k]>0)) return;
      m[k].lap=Math.round(+Bk.scores[k]||0); m[k].c=+((Bk.rpCarry||{})[k])||0;
      const moved=(G.gains[k]||0)>0;
      if(m[k].lap>=80){ const got=pzFinishLap(k); done.push(k);
        laps.push({k,lv:+m[k].lv||0,lap:80,of:80,done:true,mat:got?got.id:null,matName:got?got.name:""}); }
      else if(moved){ const nx=pzNextMat(k); laps.push({k,lv:+m[k].lv||0,lap:m[k].lap,of:80,done:false,mat:nx?nx.id:null,matName:nx?nx.name:""}); } });
  }
  /* the order Workout complete shows: finished laps, then the muscles you trained (session order), then the most lap points */
  const pr=C.prim||[], at=k=>{ const i=pr.indexOf(k); return i<0?1e9:i; }, gain=k=>(G&&G.gains&&G.gains[k])||0;
  laps.sort((a,b)=>(b.done-a.done)||at(a.k)-at(b.k)||gain(b.k)-gain(a.k));
  pzOnCredit.last={src:C.src,laps,done,at:Date.now()};
}
/* after the session is saved: what core's Workout complete shows, then the look and the news */
function pzAfter(last){
  if(!last||!last.done.length) return;
  try{ if(typeof bxKick==="function") bxKick(); }catch(e){}
  last.done.forEach(k=>{ try{ track("pz_lap",{lv:pzLv(k)}); }catch(e){} });
  const k=last.done[0]; setTimeout(()=>vxEmit("evolve",{what:"lap",k}),0);
}
function pzOnWorkout(rec,R){
  const last=pzOnCredit.last; pzOnCredit.last=null;
  if(!R) return;
  const ok=last&&last.src==="workout"&&Date.now()-last.at<120000;
  R.ev=R.ev||{};
  R.ev.laps=ok?last.laps.slice():[];
  R.ev.ready=(R.ranks||[]).filter(u=>u&&MUSCLES[u.k]&&(+u.from||0)<94&&(+u.toS||0)>=94&&!pzRunning(u.k)).map(u=>u.k);
  if(ok) pzAfter(last);
}
function pzOnLog(){
  const last=pzOnCredit.last; pzOnCredit.last=null;
  if(!last||last.src!=="quick"||Date.now()-last.at>120000||!last.done.length) return;
  pzAfter(last);
  const L=last.laps.filter(x=>x.done);
  const msg=L.length>1?`${L.length} prestige laps done · see Evolve`:L[0]?`${rkSay(L[0].k)} lap done · ${L[0].matName||`★${L[0].lv}`}`:"";
  if(msg) setTimeout(()=>{ try{ toast(msg); }catch(e){} },3600);
}
/* Muscle ranks rows (core's rkTagX): a gold star with the lap count, or "Prestige ready" */
function pzRkTag(k){
  if(!MUSCLES[k]) return null;
  const lv=pzLv(k);
  if(lv>0) return {h:`<i class="rk-tag pz-star">${pzStarSvg()}${lv}</i>`,say:`prestige ${lv}`};
  if(pzReady(k)) return {h:`<i class="rk-tag pz-ready">Prestige ready</i>`,say:"prestige ready"};
  return null;
}

/* ---------- the muscle sheet and the Body page's focus card ---------- */
function pzSheetRow(){
  if(typeof DEMO!=="undefined"&&DEMO) return;
  if(!sel||sel.t!=="muscle"||!MUSCLES[sel.id]) return;
  const k=sel.id; if(pzScore(k)<94) return;
  const box=$("shIn")&&$("shIn").querySelector(".sh-score"); if(!box||box.querySelector(".pz-sh")) return;
  const b=document.createElement("button"); b.className="pz-sh"; b.type="button";
  /* the star icon leads every state; "★2 · Black marble" lends it its ★ so there is one star, not two */
  const tx=pzShort(k)||"Prestige ready", lead=/^★/.test(tx), vis=tx.replace(/^★/,"");
  b.innerHTML=lead?`<span class="pz-sh-n">${pzStarSvg()}${uiEsc(vis)}</span><i aria-hidden="true">›</i>`
    :`${pzStarSvg()}<span>${uiEsc(vis)}</span><i aria-hidden="true">›</i>`;
  b.setAttribute("aria-label",`${tx.replace(/^★(\d+)/,"Prestige $1")}. Open prestige`);
  b.onclick=()=>{ Pulse.buzz(8); if(typeof openEvolve==="function") openEvolve("prestige",{k,from:"sheet"}); };
  box.appendChild(b);
  try{ uiFitPeek(); }catch(e){}
}
function pzFocusLabel(k){
  if(!MUSCLES[k]||pzScore(k)<94) return "";
  if(pzRunning(k)) return `Prestige lap · ${+pzM(k).lap||0} of 80`;
  if(pzLv(k)){ const e=pzM(k); return `★${pzLv(k)}${e.mat?` · ${pzMatName(e.mat)}`:""}`; }
  return "Top rank · Prestige ready";
}
/* after a prestige change (a lap started or finished, a material worn, a quick log moving a lap):
   the muscle sheet's Prestige row and the Body page's focus card, which may sit under #evV, show the
   new state when it closes. Deferred (after the emit's own redraws), never emits, never saves.
   The sheet: only its Prestige row is swapped (no renderSheet: that would stop a learn demo and reframe) */
function pzRedrawSeen(){
  clearTimeout(pzRedrawSeen.t);
  pzRedrawSeen.t=setTimeout(()=>{
    try{
      if(typeof sel!=="undefined"&&sel&&sel.t==="muscle"&&MUSCLES[sel.id]&&sheetState!=="closed"){
        const box=$("shIn")&&$("shIn").querySelector(".sh-score");
        if(box){ const old=box.querySelector(".pz-sh"), had=!!old; if(old) old.remove(); pzSheetRow(); if(had&&!box.querySelector(".pz-sh")) try{ uiFitPeek(); }catch(e){} }
      }
    }catch(e){ console.warn(e); }
    try{
      const c=$("uWeak"), k=c&&c.dataset.k;
      if(k&&MUSCLES[k]&&typeof UIH!=="undefined"&&UIH.sel===k){ c.outerHTML=(typeof lxCardHTML==="function"&&uiHome3D())?lxCardHTML():uiFocusCardHTML(k); uiFocusCardWire(); }
    }catch(e){ console.warn(e); }
    pzRedrawSeen.n=(pzRedrawSeen.n||0)+1;
  },0);
}

/* ---------- ?evo=1 (localhost, demo saves only; core calls it) ---------- */
function pzDemoSeed(){
  if(!S||S.demo!==true||typeof evPreviewOn!=="function"||!evPreviewOn()) return;
  S.scores.pec_major=96; S.scores.front_delt=95;
  const P=pzState();
  P.m.front_delt={lv:1,lap:34,c:0,at:dkey(9),mats:["marble"],mat:"marble"};
  save();
  try{ Body.refresh&&Body.refresh(); }catch(e){}
  try{ if(typeof bxKick==="function") bxKick(); }catch(e){}
}

/* ---------- include time: the view, the hooks and the wrappers ---------- */
(()=>{ try{
  if(typeof evView==="function") evView("prestige",{title:pzTitle,eye:pzEye,act:pzAct,render:pzRender});
  vxOn("credit",pzOnCredit);
  vxOn("workout",pzOnWorkout);
  vxOn("log",pzOnLog);
  vxOn("rkTag",pzRkTag);
  vxOn("evolve",m=>{ if(m&&(m.what==="lap"||m.what==="look")) pzRedrawSeen(); });
  vxOn("log",()=>{ if(GLORDER.some(pzRunning)) pzRedrawSeen(); });
  const _rs=renderSheet; renderSheet=function(){ const r=_rs.apply(this,arguments); try{ pzSheetRow(); }catch(e){ console.warn(e); } return r; };
  const _fh=uiFocusCardHTML; uiFocusCardHTML=function(k){ let h=_fh.apply(this,arguments);
    try{ const t=pzFocusLabel(k); if(t&&typeof h==="string") h=h.replace("Top rank. Keep it there.",uiEsc(t)).replace(". Open in 3D",". Open prestige"); }catch(e){ console.warn(e); } return h; };
  const _fw=uiFocusCardWire; uiFocusCardWire=function(){ const r=_fw.apply(this,arguments);
    try{ const c=$("uWeak"), k=c&&c.dataset.k; if(k&&!c.dataset.rv&&pzFocusLabel(k)) c.onclick=()=>{ Pulse.buzz(8); if(typeof openEvolve==="function") openEvolve("prestige",{k,from:"body"}); }; }catch(e){ console.warn(e); }
    return r; };
}catch(e){ console.warn("Ossa: prestige.js",e); } })();
