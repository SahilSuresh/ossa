/* =========================================================
   EVOLVE (Ossa 2.0, Phase 5 "Evolve") — package "core". Prefix ev, classes .ev-.
   Profile's first segment is now Evolve (its id stays "progress"): a one-screen hub with your overall
   rank and six tiles (Trophy room, Ideal self, Prestige, Your path, Your card, Your look) and a
   "Your history" row that opens the old Progress page. Each tile opens a view in one reusable full
   panel, #evV, that the other Phase 5 files register with evView(). Also here: the Workout complete
   lines and the Evolve moments after the rank-ups (from R.ev), the avatar (always lands on the hub),
   the ?sa= safe-area switch and the ?evo=1 demo seeds (localhost only).

   Contract (scratchpad brief §3.1):
     evView(name,{title,act,render,eye?})  register a view (title string|(o)=>string; act (o)=>html for the
                                           right slot; eye optional small caps line above the title;
                                           render(b,o,bar) writes .ev-body b. The bar is in the DOM first,
                                           so render can wire an act button by id.)
     openEvolve(view="home",o) → bool       "home" lands on the hub; any other view opens #evV
     evGo(view,o) · evBack() · evClose() · evRefresh() · evSheet(html,wire) · evSheetClose()
     evTrain(k) · evPx(el) → [w,h] · evS() · evPreviewOn()
   Screen state lives on function properties (evS.s, evView.m), never saved.
   Wrappers (outermost; this file is included after recover.js): goBack, setTab, renderYou, drawDone,
   rkCelebrate; the only wrappers of uiWireTodayHead, openRanks and wkDensClose. progressCards is
   redefined here (the hub needs none of it; History keeps the week review, ranks, body check,
   posture and patterns, without the old Milestones and Unlocks cards).
   Listens: vxOn("evolve"), vxOn("pro") → redraw the hub when it shows, evRefresh() when #evV is open.
   Start-up rule: function declarations only, state on function properties, include-time code inside
   try. No top-level const or let.
   ========================================================= */

/* ---------- screen state and the preview test ---------- */
function evS(){ return evS.s||(evS.s={v:null,o:{},stack:[],hist:false,troAt:0}); }
function evPreviewOn(){ try{ return /^(localhost|127\.0\.0\.1)$/.test(location.hostname)&&/[?&]evo=1\b/.test(location.search); }catch(e){ return false; } }
function evLocal(){ try{ return /^(localhost|127\.0\.0\.1)$/.test(location.hostname); }catch(e){ return false; } }

/* ---------- the view registry ---------- */
function evView(name,def){
  const m=evView.m||(evView.m={});
  if(def===undefined) return m[name]||null;
  if(def&&typeof def.render==="function") m[name]=def;
  return m[name]||null;
}
function evTitle(name,o){ const d=evView(name); if(!d) return ""; try{ return String(typeof d.title==="function"?d.title(o||{}):d.title||""); }catch(e){ console.warn(e); return ""; } }

/* ---------- the panel: a 48 px bar (plus the top inset) and a body that never scrolls ---------- */
function evPanel(){
  let p=$("evV"); if(p) return p;
  p=document.createElement("section"); p.className="panel u-own ev-v"; p.id="evV"; p.setAttribute("aria-label","Evolve");
  p.innerHTML=`<div class="ev-bar" id="evBar"></div><div class="ev-body" id="evBody"></div>`;
  $("app").appendChild(p);
  return p;
}
function evOn(){ const p=$("evV"); return !!(p&&p.classList.contains("on")); }
/* draw the current view: bar first (so render can wire its act button), then the body */
function evDraw(){
  const p=evPanel(), S0=evS(), name=S0.v, def=evView(name), o=S0.o||{};
  if(!def) return false;
  evSheetClose(true);
  p.dataset.view=name;
  const bar=$("evBar"), b=$("evBody");
  const prev=S0.stack.length?S0.stack[S0.stack.length-1]:null;
  /* the back label is the previous title up to its first " · " ("Prestige · Front delts" → "‹ Prestige") */
  const pt=prev?evTitle(prev.v,prev.o).split(" · ")[0]:"";
  const left=prev?`<button class="ev-back" id="evBack" aria-label="Back to ${uiEsc(pt)}">‹ <span>${uiEsc(pt)}</span></button>`
    :o.from==="hub"?`<button class="ev-back" id="evBack" aria-label="Back to Evolve">‹ <span>Evolve</span></button>`
    :`<button class="u-icon-btn round ev-x" id="evBack" aria-label="Close"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>`;
  let act=""; try{ act=typeof def.act==="function"?def.act(o)||"":""; }catch(e){ console.warn(e); act=""; }
  let eye=""; try{ eye=def.eye?String(typeof def.eye==="function"?def.eye(o)||"":def.eye):""; }catch(e){ eye=""; }
  const title=evTitle(name,o);
  bar.innerHTML=`<span class="ev-bar-l">${left}</span><span class="ev-bar-c">${eye?`<span class="ev-bar-eye">${uiEsc(eye)}</span>`:""}<b class="ev-bar-t">${uiEsc(title)}</b></span><span class="ev-bar-r">${act}</span>`;
  p.setAttribute("aria-label",title||"Evolve");
  $("evBack").onclick=()=>{ Pulse.buzz(6); if(evS().stack.length) evBack(); else evClose(); };
  b.innerHTML=""; b.scrollTop=0; b.className="ev-body ev-b-"+String(name).replace(/[^a-z0-9-]/gi,"");
  try{ def.render(b,o,bar); }
  catch(e){ console.warn("Ossa: Evolve view "+name,e); b.innerHTML=`<p class="u-small ev-err">That didn't load. Close and try again.</p>`; }
  if(evLocal()) try{ if(b.scrollHeight>b.clientHeight+1) console.warn("Evolve view overflows",name,b.scrollHeight,b.clientHeight); }catch(e){}
  return true;
}
/* open: "home" lands on the hub (Profile › Evolve); any other view opens #evV over whatever is showing */
function openEvolve(view,o){
  view=view||"home"; o=Object.assign({},o||{});
  const S0=evS();
  if(view==="home"){
    try{ closePanels(); }catch(e){}
    S0.hist=false; SUB.you="progress";
    try{ track("ev_open",{view:"home",from:String(o.from||"")}); }catch(e){}
    const inT=$("app").classList.contains("train");
    if(typeof TAB!=="undefined"&&TAB==="you"&&!inT){ renderYou(); const t=$("tv-you"); if(t) t.scrollTop=0; }
    else setTab("you");
    return true;
  }
  if(!evView(view)){ console.warn("Ossa: Evolve view not ready",view); try{ toast("That isn't ready yet."); }catch(e){} return false; }
  S0.v=view; S0.o=o; S0.stack=[];
  try{ track("ev_open",{view,from:String(o.from||"")}); }catch(e){}
  const p=evPanel();
  evDraw();
  try{ if(typeof uiPanelFront==="function") uiPanelFront(p); else $("app").appendChild(p); }catch(e){}
  void p.offsetWidth; p.classList.add("on");
  return true;
}
/* move to another view inside #evV; Back returns to this one */
function evGo(view,o){
  if(!evView(view)){ console.warn("Ossa: Evolve view not ready",view); try{ toast("That isn't ready yet."); }catch(e){} return false; }
  const S0=evS();
  if(!evOn()) return openEvolve(view,o);
  if(S0.v) S0.stack.push({v:S0.v,o:S0.o});
  if(S0.stack.length>8) S0.stack.shift();
  S0.v=view; S0.o=Object.assign({},o||{});
  try{ track("ev_open",{view,from:"evolve"}); }catch(e){}
  evDraw(); return true;
}
function evBack(){
  const S0=evS();
  if(evSheetOpen()){ evSheetClose(); return true; }
  const prev=S0.stack.pop();
  if(prev&&evView(prev.v)){ S0.v=prev.v; S0.o=prev.o||{}; evDraw(); return true; }
  evClose(); return true;
}
function evClose(){
  const p=$("evV"), S0=evS();
  evSheetClose(true);
  S0.stack=[];
  if(p) p.classList.remove("on");
  try{ if(evHubShowing()) evHubRedraw(); }catch(e){ console.warn(e); }
}
function evRefresh(){ if(evOn()&&evView(evS().v)) evDraw(); }

/* ---------- a bottom sheet inside #evV (scrim, ✕, 44 px rows). Back closes it first ---------- */
/* only a sheet you can see counts: closePanels hides #evV without touching its sheet (evDraw drops it later) */
function evSheetOpen(){ const s=document.querySelector("#evV.on .ev-sh"); return !!(s&&!s.dataset.closing); }
function evSheet(html,wire){
  const p=evPanel(); evSheetClose(true);
  const s=document.createElement("div"); s.className="ev-sh"; s.setAttribute("role","dialog"); s.setAttribute("aria-modal","true");
  s.innerHTML=`<div class="ev-sh-in"><button class="u-icon-btn round ev-sh-x" aria-label="Close"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button><div class="ev-sh-b">${html||""}</div></div>`;
  p.appendChild(s);
  s.addEventListener("click",e=>{ if(e.target===s){ Pulse.buzz(6); evSheetClose(); } });
  s.querySelector(".ev-sh-x").onclick=()=>{ Pulse.buzz(6); evSheetClose(); };
  try{ if(typeof wire==="function") wire(s.querySelector(".ev-sh-b"),s); }catch(e){ console.warn(e); }
  void s.offsetWidth; s.classList.add("on");
  return s;
}
function evSheetClose(now){
  let any=false;
  document.querySelectorAll("#evV .ev-sh").forEach(s=>{ any=true;
    if(now||reduced){ s.remove(); return; }
    if(s.dataset.closing) return; s.dataset.closing="1"; s.classList.remove("on"); setTimeout(()=>s.remove(),250); });
  /* news that came while the sheet was up (an "evolve" event): catch up now */
  if(any&&!now&&evS().dirty){ evS().dirty=false; setTimeout(()=>{ if(!evSheetOpen()) evRefresh(); },0); }
  if(now) evS().dirty=false;
}

/* ---------- helpers for the views ---------- */
/* start a session for muscle k (Ideal self, Prestige). From Workout complete it leaves that screen the usual
   way first (rank-ups, the Evolve moments, the streak screen), then opens the session: evTrain.next waits
   for the rkCelebrate wrapper's done (or runs at once when nothing celebrates). */
function evTrain(k){
  if(typeof TR!=="undefined"&&TR.view==="active"){ try{ toast("Finish or end your current workout first"); }catch(e){} return false; }
  if(!MUSCLES[k]) return false;
  if(typeof TR!=="undefined"&&TR.view==="done"&&$("app").classList.contains("train")){
    let lv=null;
    if(typeof TR.doneLeave==="function") lv=()=>TR.doneLeave(false);                     // 3D: Continue's own leave
    else { const b=$("doneW"); if(b&&typeof b.onclick==="function") lv=()=>b.onclick.call(b,null); }   // 2D: its Done button
    if(lv){
      evTrain.next={k,at:Date.now()};
      try{ evClose(); }catch(e){}
      try{ lv(); }catch(e){ console.warn("Ossa: Evolve leave",e); }
      if(evTrain.next&&TR.view!=="done"&&!document.querySelector(".rk-up")) evTrainNext();   // nothing to celebrate
      return true;
    }
  }
  return evTrainGo(k);
}
function evTrainGo(k){
  if(!MUSCLES[k]) return false;
  try{ closePanels(); }catch(e){}
  /* the session is named the way the button named the muscle ("Train chest" opens "Chest focus") */
  const s=trSessionFor({t:"muscle",id:k}), nm=typeof rkSay==="function"?String(rkSay(k)||""):"";
  TR={...TR,view:"plan",custom:true,hub:false,pick:null,ed:null,planSel:null,planEnter:true,session:s&&nm?{...s,title:`${nm[0].toUpperCase()+nm.slice(1)} focus`}:s};
  setMode("train"); try{ const tv=$("train"); if(tv) tv.scrollTop=0; }catch(e){}
  return true;
}
/* the session evTrain left waiting behind Workout complete's leave (10 minutes at most) */
function evTrainNext(){
  const n=evTrain.next; evTrain.next=null;
  if(!n||Date.now()-n.at>600000||(typeof TR!=="undefined"&&(TR.view==="active"||TR.view==="done"))) return false;
  return evTrainGo(n.k);
}
/* device pixels for Body.shot: the CSS box × the pixel ratio (2.5 at most) */
function evPx(el){
  if(!el) return [0,0];
  const r=el.getBoundingClientRect(), d=Math.min(window.devicePixelRatio||1,2.5);
  return [Math.round(r.width*d),Math.round(r.height*d)];
}

/* =========================================================
   THE HUB — Profile › Evolve: your overall rank, six tiles, "Your history"
   ========================================================= */
/* the six tiles: title fixed here, the rest from each owner's pure xxTile() (§3.2) */
function evTiles(){
  return [
    {v:"trophies",t:"Trophy room",ic:"trophy",c:"var(--gold)",f:()=>typeof troTile==="function"?troTile():null},
    {v:"ideal",t:"Ideal self",ic:"ideal",c:rankTier(overall())<1?"var(--text-2)":`var(--rk-${Math.min(rankTier(overall())+1,5)})`,f:()=>typeof idlTile==="function"?idlTile():null},
    {v:"prestige",t:"Prestige",ic:"star",c:"var(--gold)",f:()=>typeof pzTile==="function"?pzTile():null},
    {v:"path",t:"Your path",ic:"path",c:"var(--glow)",f:()=>typeof pthTile==="function"?pthTile():null},
    {v:"card",t:"Your card",ic:"card",c:"var(--text-1)",f:()=>typeof cdTile==="function"?cdTile():null},
    {v:"look",t:"Your look",ic:"look",c:"var(--cyan)",f:()=>typeof vtTile==="function"?vtTile():null}
  ];
}
function evIc(k){
  return ({
    trophy:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 4h9v5.5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 6H4.8a3.2 3.2 0 0 0 3.4 4.3M16.5 6h2.7a3.2 3.2 0 0 1-3.4 4.3M12 14v3.5M8.5 20.5h7M9.5 17.5h5"/></svg>`,
    ideal:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5.2" r="2"/><path d="M12 8.6v6.4M7.6 11.4 12 9.6l4.4 1.8M9.4 21l2.6-6 2.6 6"/><path d="M4 7.5V4h3.5M20 7.5V4h-3.5M4 16.5V20h3.5M20 16.5V20h-3.5"/></svg>`,
    star:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg>`,
    path:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21v-7.5M12 13.5 6 7.5M12 13.5l6-6M3.8 8.6V4.2h4.4M20.2 8.6V4.2h-4.4"/></svg>`,
    card:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2.5"/><circle cx="12" cy="9.5" r="2.6"/><path d="M8.5 15.5h7M9.5 18.2h5"/></svg>`,
    look:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3.9 4.6 6 7.7 6 10.6A6 6 0 0 1 6 13.6C6 10.7 8.1 7.6 12 3z"/><path d="M9.3 14a2.7 2.7 0 0 0 2.7 2.7"/></svg>`,
    hist:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4.5v3.8h3.8M12 8v4.5l3 1.8"/></svg>`
  })[k]||"";
}
/* a tile function's answer, checked: sub (escaped later), bar 0..1 or null, c a var(--token), dot */
function evTileData(x){
  let r=null; try{ r=x.f(); }catch(e){ console.warn("Ossa: Evolve tile "+x.v,e); r=null; }
  r=r&&typeof r==="object"?r:{};
  const bar=typeof r.bar==="number"&&isFinite(r.bar)?Math.max(0,Math.min(1,r.bar)):null;
  const c=typeof r.c==="string"&&/^var\(--[a-z0-9-]+\)$/i.test(r.c.trim())?r.c.trim():x.c;
  return {sub:r.sub==null?"":String(r.sub),bar,c,dot:!!r.dot};
}
function evHubOn(){ return typeof SUB!=="undefined"&&SUB.you==="progress"&&!evS().hist; }
/* something full-screen is over History (the list at ossa.html's scroll check, plus shell.js's and
   recover.js's busy tests): back then belongs to it, never to History */
function evBusy(){
  const app=$("app");
  if(document.querySelector(".panel.on,#psX.on,#psX.peek,.pwx,.rk-up,.sk-up,.share.on,.mindv:not([hidden])")) return true;
  if(app.classList.contains("train")||app.classList.contains("timelining")) return true;
  if(typeof RDL!=="undefined"&&RDL) return true;
  if(typeof RV!=="undefined"&&RV) return true;
  if(typeof MIND!=="undefined"&&MIND&&MIND.open) return true;
  if(typeof vxSoreS==="function"&&vxSoreS().open) return true;
  if(typeof sheetState!=="undefined"&&sheetState!=="closed") return true;
  if(typeof SYS!=="undefined"&&SYS&&SYS.id) return true;
  return false;
}
function evHubShowing(){ const t=$("tv-you"); return !!(t&&t.classList.contains("ev-hubon")&&typeof TAB!=="undefined"&&TAB==="you"&&evHubOn()); }
function evHubHTML(){
  const o=overall(), t=rankTier(o), nx=toNext(o), rk=rankOf(o);
  const more=nx?`${nx.pts} to ${nx.name}`:"Top rank";
  const strip=`<button class="u-card ev-strip" id="evStrip" aria-label="Overall ${uiEsc(rk)}, ${o} RP average, ${uiEsc(more)}. See your muscle ranks">
      <span class="ev-strip-b">${rkBadge(o,"lg")}</span>
      <span class="ev-strip-tx"><span class="u-eyebrow">Overall</span><b>${uiEsc(rk)}</b><small>${o} RP<span class="ev-avg"> average</span> · ${uiEsc(more)}</small>
        <span class="u-bar ev-strip-bar"><i style="width:${Math.round(rankFrac(o)*100)}%;--c:var(--rk-${t})"></i></span></span>${UI_IC.chev}</button>`;
  const tiles=evTiles().map(x=>{ const d=evTileData(x);
    return `<button class="ev-tile" data-evt="${x.v}" style="--c:${d.c}" aria-label="${uiEsc(x.t)}${d.sub?": "+uiEsc(d.sub):""}${d.dot?", new":""}">
      <span class="ev-tile-h"><span class="ev-tile-ic">${evIc(x.ic)}</span><b>${uiEsc(x.t)}</b></span>
      <small>${uiEsc(d.sub)}</small>${d.bar!=null?`<span class="u-bar ev-tile-bar"><i style="width:${Math.round(d.bar*100)}%"></i></span>`:""}${d.dot?`<i class="ev-dot" aria-hidden="true"></i>`:""}</button>`; }).join("");
  const hist=`<button class="ev-hist" id="evHist"><span class="ev-hist-ic">${evIc("hist")}</span><span class="ev-hist-tx"><b>Your history</b><small>Week review, scores, body check</small></span>${UI_IC.chev}</button>`;
  return `<div class="ev-hub">${strip}<div class="ev-tiles">${tiles}</div>${hist}</div>`;
}
function evHubWire(root){
  /* the strip's small line: "average" goes when the line would be cut (an Unbreakable target on a narrow phone) */
  try{ const sm=root.querySelector(".ev-strip-tx small"), av=sm&&sm.querySelector(".ev-avg");
    if(av&&sm.clientWidth>0&&sm.scrollWidth>sm.clientWidth) av.remove(); }catch(e){}
  const st=root.querySelector("#evStrip"); if(st) st.onclick=()=>{ Pulse.buzz(8); try{ openRanks(); }catch(e){ console.warn(e); } };
  root.querySelectorAll("[data-evt]").forEach(b=>b.onclick=()=>{ Pulse.buzz(8); openEvolve(b.dataset.evt,{from:"hub"}); });
  const h=root.querySelector("#evHist"); if(h) h.onclick=()=>{ Pulse.buzz(8); evS().hist=true; renderYou(); const t=$("tv-you"); if(t) t.scrollTop=0; };
}
/* redraw the hub in place (after an "evolve" event, or when #evV closes) */
function evHubRedraw(){
  const t=$("tv-you"), sb=t&&t.querySelector(".seg-body"); if(!sb||!evHubShowing()) return;
  sb.innerHTML=evHubHTML(); evHubWire(sb);
}
/* the hub's own trophy check: after it is drawn, at most every 5 s, never inside a tile */
function evHubTroLater(){
  const S0=evS(), now=Date.now(); if(now-(S0.troAt||0)<5000) return;
  S0.troAt=now;
  setTimeout(()=>uiSafe(()=>{ if(typeof troCheck==="function") troCheck("hub"); }),0);
}
/* after the original renderYou: the hub, or History reusing Profile's back bar */
function evYouAfter(){
  const b=$("tv-you"); if(!b) return;
  if(SUB.you!=="progress") evS().hist=false;
  const hub=evHubOn(), sb=b.querySelector(".seg-body");
  b.classList.toggle("ev-hubon",hub);
  if(hub&&sb){ sb.innerHTML=evHubHTML(); evHubWire(sb); evHubTroLater(); return; }
  if(SUB.you==="progress"&&evS().hist){
    const t=b.querySelector(".u-backbar-t"); if(t) t.textContent="History";
    const bk=$("uProfBack"); if(bk){ bk.setAttribute("aria-label","Back to Evolve"); bk.onclick=()=>{ Pulse.buzz(6); evS().hist=false; renderYou(); b.scrollTop=0; }; }
    const eb=sb&&sb.querySelector(".tv-head .eyebrow"); if(eb) eb.classList.add("ev-hide");
    const sg=b.querySelector('.seg3 [data-sub="progress"]'); if(sg) sg.onclick=()=>{ Pulse.buzz(8); evS().hist=false; renderYou(); b.scrollTop=0; };
  }
}

/* History: the old Progress cards, without Milestones and Unlocks (their jobs moved to Trophy room and
   Your look). In hub mode the original renderYou still runs, so this returns nothing at once. */
function progressCards(){
  if(evHubOn()) return "";
  const ckA=ckAll(), cf=ckA[0], cl=ckA[ckA.length-1], csc=cl?ckScoreOf(ckNow()):null, cs0=cf?ckScoreOf(ckProfile(0)):null, cfa=cl?rdBA(ckNow()):null, cfa0=cf?rdBA(ckProfile(0),cf.d):null;
  const bcc=`<div class="td-card"><div class="td-row"><div class="eyebrow">Body check</div>${cl?`<span class="td-n sm">${cfa!=null?`age ${cfa}`:`${csc}/100`}</span>`:""}</div>
    ${ckA.length>1?(cfa!=null&&cfa0!=null?`<p class="pg-p">Body age ${cfa0} on your first check, ${cfa} now. ${cfa<cfa0?"That's your body changing.":"Keep at it. Function changes slowly, then all at once."}</p>`:`<p class="pg-p">First check ${cs0} → latest ${csc}. ${csc>cs0?"That's your body changing.":"Keep at it. Function changes slowly, then all at once."}</p>`)
      :cl?`<p class="pg-p">Your baseline is set. Retest ${bcDue()?"now":`in ${plural(Math.max(1,21-dayDiff(cl.d)),"day")}`} to see the change.</p>`:`<p class="pg-p">Eleven simple tests of how well your body works: posture, mobility, strength, balance and breath. Do them now, then again in three weeks.</p>`}
    <div class="td-acts"><button class="btn" id="pgBc">${!cl?"Take it now":bcDue()?"Retest now":"See my results"}</button></div></div>`;
  const bf=balanceFlag(), sp=sleepPattern(), mi=mindInsights().list[0];
  const pat=`<div class="td-card"><div class="eyebrow">Your patterns</div>${bf?`<p class="pg-p"><b class="am">Balance.</b> ${bf.txt} Your plan adds back work until it evens out.</p>`:""}
    ${sp?`<p class="pg-p"><b>Sleep.</b> ${sp.t}</p>`:""}${mi?`<p class="pg-p"><b>Mind.</b> ${mi.t}</p>`:""}
    ${!bf&&!sp&&!mi?`<p class="pg-p">Patterns from your own data show up here after about three weeks of check-ins and sessions, like how your sleep changes how often you train.</p>`:""}</div>`;
  const R=reviewWeek(), T=timelineData();
  const wk=`<div class="td-card pg-wk"><div class="eyebrow">${R.partial?"This week so far":"Last week"} · ${R.label}</div>
    <h3>${R.W.length?`${plural(R.W.length,"session")}, ${R.hit.length} muscles trained.`:"A quiet week so far."}</h3>
    <div class="td-acts"><button class="btn primary" id="pgReview">Play the review</button><button class="btn" id="pgTl">Your timeline</button></div>
    ${T?`<p class="pg-p">${T.weeks} week${T.weeks===1?"":"s"} of you on the timeline · ${T.cum[T.cum.length-1].hit} muscles awake.</p>`:""}</div>`;
  const cnt={}; GLORDER.forEach(k=>{ const r=rankTierName(S.scores[k]); cnt[r]=(cnt[r]||0)+1; });
  const rk=`<div class="td-card pg-rk"><div class="eyebrow">Your ranks</div>
    <div class="rk-dist">${[...RANKS].reverse().map(([,r])=>`<span class="r-${r.toLowerCase()}"><b>${cnt[r]||0}</b>${r}</span>`).join("")}</div></div>`;
  return wk+rk+bcc+psProgHTML()+pat;
}

/* =========================================================
   WORKOUT COMPLETE — the Evolve lines, drawn from R.ev (each owner fills its own key)
   ========================================================= */
function evDnRow(id,ic,c,b,sub,o){
  o=o||{};
  return `<button class="ev-dn-row" id="${id}" style="--c:${c}"><span class="ev-dn-ic">${evIc(ic)}</span>
    <span class="ev-dn-tx"><b>${uiEsc(b)}</b><small>${uiEsc(sub)}</small>${o.bar!=null?`<span class="u-bar ev-dn-bar"><i style="width:${Math.round(Math.max(0,Math.min(1,o.bar))*100)}%"></i></span>`:""}</span>
    ${o.more?`<em class="ev-dn-more">${uiEsc(o.more)}</em>`:""}${UI_IC.chev}</button>`;
}
/* one trophy: its name (and grade word); more: the first name and "· +N more" (the moments carry the grades),
   so the line stays one or two lines in the 3D column */
function evTroNames(list){
  if(!list.length) return "";
  const x=list[0];
  return list.length>1?`${x.name} · +${list.length-1} more`:x.gname?`${x.name} · ${x.gname}`:x.name;
}
function evDoneLines(){
  const R=typeof TR!=="undefined"&&TR?TR.result:null, tv=$("train");
  if(!R||!R.ev||typeof R.ev!=="object"||!tv) return;
  if(tv.querySelector(".ev-dn-row,.ev-dn-tro")) return;            // drawn already
  const E=R.ev, dn=tv.querySelector(".wk-dn"), msOn=!!tv.querySelector(".dn-ms");
  const tro=(Array.isArray(E.tro)?E.tro:[]).filter(x=>x&&x.name&&!(msOn&&x.ms));
  const rows=[];
  /* the path bonus: leads with the sets, RP only when it rounds to 1 or more (§8 risk 2) */
  const P=E.path;
  if(P&&+P.n>0&&(P.arch==="tank"||P.arch==="scout")){
    const n=Math.round(+P.n), rp=Math.round(+P.rp||0);
    rows.push(evDnRow("evDnPath","path","var(--glow)",P.arch==="tank"?"Tank bonus":"Scout bonus",`${n} ${P.arch==="tank"?"heavy":"endurance"} set${n>1?"s":""}${rp>=1?` · +${rp} RP`:""}`));
  }
  /* prestige laps: one row, a finished lap first */
  const laps=(Array.isArray(E.laps)?E.laps:[]).filter(x=>x&&MUSCLES[x.k]).sort((a,b)=>(b.done?1:0)-(a.done?1:0));
  if(laps.length){
    const L=laps[0], nm=rkSay(L.k), of=+L.of||80, more=laps.length>1?`+${laps.length-1} more`:"";
    rows.push(L.done?evDnRow("evDnLap","star","var(--gold)",`${nm} lap done`,L.matName?`${L.matName} earned`:"Another prestige star",{more})
      :evDnRow("evDnLap","star","var(--gold)",`${nm} · prestige lap`,`${Math.round(+L.lap||0)} of ${of}`,{bar:(+L.lap||0)/of,more}));
  }
  const lapK=laps.length?laps[0].k:null;
  const wire=()=>{
    const p=$("evDnPath"); if(p) p.onclick=()=>{ Pulse.buzz(8); openEvolve("path",{from:"done"}); };
    const l=$("evDnLap"); if(l) l.onclick=()=>{ Pulse.buzz(8); openEvolve("prestige",{k:lapK,from:"done"}); };
    const t=$("evDnTro"); if(t) t.onclick=()=>{ Pulse.buzz(8); openEvolve("trophies",{from:"done"}); };
  };
  const troLab=tro.length>1?"New trophies":"New trophy";
  if(dn){
    /* 3D: the trophy line sits with the other headline lines; the rows go after the RP gains */
    if(tro.length){
      const top=dn.querySelector(".dn-top"), anchor=top&&[...top.querySelectorAll(".dn-ul,.dn-ms,.dn-stats")].pop();
      const html=`<button class="dn-ul ev-dn-tro" id="evDnTro"><span>${troLab}</span><b>${uiEsc(evTroNames(tro))}</b></button>`;
      if(anchor) anchor.insertAdjacentHTML("afterend",html); else if(top) top.insertAdjacentHTML("beforeend",html);
    }
    if(rows.length){
      const g=dn.querySelector(".wk-gains"), blk=dn.querySelector(".dn-blk"), html=`<div class="ev-dn">${rows.slice(0,2).join("")}</div>`;
      if(g) g.insertAdjacentHTML("afterend",html); else if(blk) blk.insertAdjacentHTML("beforebegin",html);
    }
  } else {
    /* 2D (no WebGL): the same rows above the buttons */
    if(tro.length) rows.push(evDnRow("evDnTro","trophy","var(--gold)",troLab,evTroNames(tro)));
    const cta=tv.querySelector(".cta");
    if(rows.length&&cta) cta.insertAdjacentHTML("beforebegin",`<div class="ev-dn">${rows.join("")}</div>`);
  }
  wire();
}

/* =========================================================
   THE EVOLVE MOMENTS — after the rank-ups, before Back and the streak screen
   ========================================================= */
function evLc(s){ s=String(s||""); return s?s[0].toLowerCase()+s.slice(1):s; }
function evMomentsList(R){
  const E=R&&R.ev; if(!E||typeof E!=="object") return [];
  const out=[];
  (Array.isArray(E.laps)?E.laps:[]).filter(x=>x&&x.done&&MUSCLES[x.k]).forEach(x=>out.push({kind:"lap",x}));
  (Array.isArray(E.ready)?E.ready:[]).filter(k=>MUSCLES[k]).forEach(k=>out.push({kind:"ready",k}));
  (Array.isArray(E.tro)?E.tro:[]).filter(x=>x&&x.name).forEach(x=>out.push({kind:"tro",x}));
  return out;
}
/* the badge: a hex in the grade colour (gold for prestige) with a glyph and, for graded trophies, pips */
function evUpBadge(col,glyph,pips){
  return `<div class="rk-up-badge ev-up-badge" style="--c:${col}"><span class="fx-rays" aria-hidden="true"></span><span class="fx-glow" aria-hidden="true"></span>
    <span class="u-hexw"><span class="u-hex ev-up-hex">${glyph}${pips?`<span class="ev-pips">${"<i></i>".repeat(pips)}</span>`:""}</span></span>${typeof fxEmbersHTML==="function"?fxEmbersHTML(12):""}</div>`;
}
function evMoments(R,done){
  const E=R&&R.ev;
  let list=[]; try{ list=E&&!E.shown?evMomentsList(R):[]; }catch(e){ console.warn(e); list=[]; }
  if(E&&typeof E==="object") E.shown=true;
  if(!list.length){ if(done) done(); return; }
  evMoments.on=true; evMoments.toRanks=false;
  const segs=list.slice(0,3), more=list.length-segs.length;
  let i=0, closing=false;
  const host=document.createElement("div"); host.className="rk-up ev-up"; host.setAttribute("role","dialog"); host.setAttribute("aria-label","Evolve");
  host.style.setProperty("--c","var(--gold)");
  $("app").appendChild(host);
  const fin=()=>{ evMoments.on=false; const toR=evMoments.toRanks; evMoments.toRanks=false;
    try{ if(done) done(); }catch(e){ console.warn(e); }
    if(toR) setTimeout(()=>{ try{ openRanks(); }catch(e){ console.warn(e); } },reduced?0:300); };
  const close=f=>{ if(closing) return; closing=true; host.classList.remove("on"); setTimeout(()=>{ host.remove(); if(f) f(); },reduced?0:300); };
  const show=()=>{
    const m=segs[i], last=i===segs.length-1;
    let eye="", title="", line="", see="", view="", vo={}, badge="";
    if(m.kind==="tro"){ const x=m.x, g=Math.max(1,Math.min(3,Math.round(+x.g||1))), up=x.up!=null?!!x.up:g>1;
      eye=up?"Trophy upgraded":"New trophy"; title=x.name; line=x.gname?`${x.gname}: ${evLc(x.rule)}.`:`${x.rule||""}.`;
      /* the trophy's own colour when it gives one (one-grade trophies are gold), else its grade's */
      const col=typeof x.c==="string"&&/^var\(--[a-z0-9-]+\)$/i.test(x.c)?x.c:`var(--tro-${x.gname?g:3})`;
      see="See your trophies"; view="trophies"; vo={from:"rankup"}; badge=evUpBadge(col,evIc("trophy"),x.gname?g:0); }
    else if(m.kind==="lap"){ const x=m.x, nm=rkSay(x.k);
      eye="Prestige lap done"; title=x.matName?`${nm} · ${x.matName}`:`${nm} · ★${Math.round(+x.lv||1)}`;   // the dot stays at the line's end
      line=x.matName?`${x.matName} on your ${nm.toLowerCase()}, for good. A star joins its rank.`:"Another star joins its rank.";
      see="See it"; view="prestige"; vo={k:x.k,from:"rankup"}; badge=evUpBadge("var(--gold)",evIc("star"),0); }
    else { const nm=rkSay(m.k);
      eye="Prestige ready"; title=nm; line="Unbreakable III. Start a prestige lap when you like.";
      see="See prestige"; view="prestige"; vo={k:m.k,from:"rankup"}; badge=evUpBadge("var(--gold)",evIc("star"),0); }
    host.innerHTML=`<div class="rk-up-in ev-up-in${last&&more>0?" more":""}">
      ${segs.length>1?`<div class="rk-segs" aria-hidden="true">${segs.map((_,j)=>`<i class="${j<i?"done":j===i?"ev-cur":""}"><b></b></i>`).join("")}</div>`:""}
      <span class="u-eyebrow rk-up-eye">${evIc("star")}${uiEsc(eye)}${segs.length>1?` · ${i+1} of ${segs.length}`:""}</span>
      ${badge}
      <div class="rk-up-tier u-impact ev-up-t">${uiEsc(title)}</div>
      <p class="u-p ev-up-line">${uiEsc(line)}</p>
      ${last&&more>0?`<p class="u-small rk-up-more">And ${more} more</p>`:""}
      <i class="ev-up-gap" aria-hidden="true"></i>
      <button class="u-btn primary block" id="evUpGo">${last?(evMoments.lastLabel||"Continue"):"Next"}</button>
      <button class="u-link" id="evUpSee">${uiEsc(see)}</button></div>`;
    Pulse.buzz([12,50,20]); try{ Pulse.audio(); Pulse.chime(5); }catch(e){}
    setTimeout(()=>{ if(host.isConnected&&typeof fxConfetti==="function") fxConfetti(host,{y:0.3,count:70,colors:["--gold","--cta","--glow-soft"]}); },reduced?0:320);
    $("evUpGo").onclick=()=>{ if(closing) return; Pulse.buzz(8); i++; if(i<segs.length) show(); else close(fin); };
    $("evUpSee").onclick=()=>{ if(closing) return; Pulse.buzz(6); close(()=>{ fin(); setTimeout(()=>{ try{ openEvolve(view,vo); }catch(e){ console.warn(e); } },reduced?0:300); }); };
  };
  try{ show(); }catch(e){ console.warn("Ossa: Evolve moments",e); host.remove(); fin(); return; }
  if(reduced) host.classList.add("on"); else requestAnimationFrame(()=>host.classList.add("on"));
}

/* =========================================================
   PREVIEW SWITCHES (localhost only) — ?sa= safe areas, ?evo=1 demo seeds
   ========================================================= */
/* ?evo=1 on a demo save: each package's optional seed, once per save (Load demo drops S.evoSeed) */
function evEvoSeed(){
  if(!evPreviewOn()||typeof S==="undefined"||!S||S.demo!==true||S.evoSeed) return false;
  S.evoSeed=1;
  [typeof pzDemoSeed==="function"?pzDemoSeed:null,typeof troDemoSeed==="function"?troDemoSeed:null,
   typeof pthDemoSeed==="function"?pthDemoSeed:null,typeof cdDemoSeed==="function"?cdDemoSeed:null]
    .forEach(f=>{ if(f) try{ f(); }catch(e){ console.warn("Ossa: evo seed",e); } });
  try{ save(); }catch(e){}
  try{ if(Body&&Body.refresh) Body.refresh(); }catch(e){}
  try{ if(typeof bxKick==="function") bxKick(); }catch(e){}
  return true;
}

/* =========================================================
   INCLUDE TIME — the segment's name, the safe-area switch, wrappers and listeners
   ========================================================= */
(()=>{ try{
  SUBS.you[0].name="Evolve";
  /* ?sa=se (top 20, bottom 0) · ?sa=14 (47/34) · ?sa=T,B — localhost only; evolve.css maps them */
  if(evLocal()){ const m=/[?&]sa=([a-z0-9,]+)/i.exec(location.search); if(m){ const v=m[1].toLowerCase(); let t=null, bt=null;
    if(v==="se"){ t=20; bt=0; } else if(v==="14"){ t=47; bt=34; } else { const p=v.split(","); if(p.length===2&&p.every(x=>/^\d{1,3}$/.test(x))){ t=+p[0]; bt=+p[1]; } }
    if(t!=null){ const h=document.documentElement; h.classList.add("ev-sa"); h.style.setProperty("--ev-sa-t",t+"px"); h.style.setProperty("--ev-sa-b",bt+"px"); } } }
}catch(e){ console.warn("Ossa: evolve.js",e); } })();

(()=>{ try{
  /* Profile: the hub (or History) after the original draws */
  const _r=renderYou; renderYou=function(){
    try{ evEvoSeed(); }catch(e){ console.warn(e); }
    const v=_r.apply(this,arguments);
    try{ evYouAfter(); }catch(e){ console.warn("Ossa: Evolve hub",e); }
    return v; };
  /* any tab change leaves History (never touches SUB.you, so the pro route still lands on Settings) */
  const _st=setTab; setTab=function(){ try{ evS().hist=false; }catch(e){} return _st.apply(this,arguments); };
  /* the avatar always lands on the hub */
  const _w=uiWireTodayHead; uiWireTodayHead=function(){ const v=_w.apply(this,arguments);
    try{ const a=$("uAvatar"); if(a) a.onclick=()=>{ Pulse.buzz(8); openEvolve("home",{from:"avatar"}); }; }catch(e){ console.warn(e); }
    return v; };
  /* back: when #evV is the top panel, its sheet, then the view stack; then History (never under an overlay) */
  const _gb=goBack; goBack=function(){
    try{
      const over=document.querySelector(".pwx,.rk-up,.sk-up,.share.on");
      if(!over){
        const p=$("evV");
        if(p&&p.classList.contains("on")){ const on=[...$("app").querySelectorAll(":scope > .panel.on")];
          if(on[on.length-1]===p){ if(evSheetOpen()) evSheetClose(); else if(evS().stack.length) evBack(); else evClose(); return true; } }
        if(typeof TAB!=="undefined"&&TAB==="you"&&SUB.you==="progress"&&evS().hist&&!evBusy()){
          evS().hist=false; renderYou(); const t=$("tv-you"); if(t) t.scrollTop=0; return true; }
      }
    }catch(e){ console.warn(e); }
    return _gb.apply(this,arguments); };
  /* Workout complete: the Evolve lines (both the 3D and the 2D page) */
  const _d=drawDone; drawDone=function(){ const v=_d.apply(this,arguments); try{ evDoneLines(); }catch(e){ console.warn("Ossa: Evolve lines",e); } return v; };
  /* leaving Workout complete closes an Evolve view opened from it */
  const _wc=wkDensClose; wkDensClose=function(){ const v=_wc.apply(this,arguments); try{ const p=$("evV"); if(p&&p.classList.contains("on")){ evSheetClose(true); evS().stack=[]; p.classList.remove("on"); } }catch(e){} return v; };
  /* the moments run after the rank-ups (and when there are none), before Back and the streak screen */
  /* then a session evTrain left waiting behind Workout complete (Prestige or Ideal self's "Train …") */
  const _c=rkCelebrate; rkCelebrate=function(R,done){ let ran=false; return _c.call(this,R,()=>{ if(ran) return; ran=true;
    evMoments(R,()=>{ try{ if(done) done(); }catch(e){ console.warn(e); } if(evTrain.next) try{ evTrainNext(); }catch(e){ console.warn(e); } }); }); };
  /* "See all your ranks" during the moments: Ranks opens after them, in today's order */
  const _o=openRanks; openRanks=function(){ if(evMoments.on&&document.querySelector(".ev-up")){ evMoments.toRanks=true; return; } return _o.apply(this,arguments); };
  /* an owner's news: redraw the hub when it shows, re-render an open view (never while its sheet is up) */
  const re=()=>{ clearTimeout(re.t); re.t=setTimeout(()=>{ try{ if(evHubShowing()) evHubRedraw(); if(evOn()){ if(evSheetOpen()) evS().dirty=true; else evRefresh(); } }catch(e){ console.warn(e); } },0); };
  vxOn("evolve",re); vxOn("pro",re);
  /* ?evo=1 at boot, once the other files have registered their seeds */
  setTimeout(()=>{ try{ if(evEvoSeed()&&typeof TAB!=="undefined"&&TAB==="you") renderYou(); }catch(e){ console.warn(e); } },0);
}catch(e){ console.warn("Ossa: evolve wrappers",e); } })();
