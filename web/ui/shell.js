/* =========================================================
   SHELL — five tabs: Body · Train · Focus · Recover · Learn (redesign 2026-10-15; Focus, Phase 3).
   Body is home: your muscles by rank, today's one thing, a dare, then your score and the rest.
   The 3D body opens from Home and from the Ranks screen; Focus is the Mind screen (#mind): the
   Focus home, Monk Mode, breathing and Heartbeat (web/ui/focus.js; its tab key stays 'breathe').
   Recover gathers what's recovering, mobility, aches and resets. Profile sits behind your avatar.
   Function declarations here win over the older ones of the same name.
   ========================================================= */
const UI_IC={
  today:`<svg viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5V20h-5v-5.5H9V20H4z"/></svg>`,
  body:`<svg viewBox="0 0 24 24"><circle cx="12" cy="4.8" r="2"/><path d="M12 8.6c-2.2 0-3.6.6-4.3 2.6L6.6 15h2.6l.9 6h3.8l.9-6h2.6l-1.1-3.8c-.7-2-2.1-2.6-4.3-2.6z"/></svg>`,
  train:`<svg viewBox="0 0 24 24"><path d="M3 9.5v5M6 7v10M18 7v10M21 9.5v5M6 12h12"/></svg>`,
  explore:`<svg viewBox="0 0 24 24"><path d="M12 6.8C9.6 5.2 6.6 4.8 3 5.6v12.8c3.6-.8 6.6-.4 9 1.2 2.4-1.6 5.4-2 9-1.2V5.6c-3.6-.8-6.6-.4-9 1.2zM12 6.8v12.8"/></svg>`,
  play:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>`,
  chev:`<svg class="u-chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5"/></svg>`,
  back:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>`,
  plus:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`,
  check:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
  drop:`<svg viewBox="0 0 24 24"><path d="M12 3c3.9 4.6 6 7.7 6 10.6A6 6 0 0 1 6 13.6C6 10.7 8.1 7.6 12 3z"/></svg>`,
  breathe:`<svg viewBox="0 0 24 24"><path d="M3 9h10.5a2.75 2.75 0 1 0-2.75-2.75M3 13.5h14a2.5 2.5 0 1 1-2.5 2.5M3 18h6"/></svg>`,
  posture:`<svg viewBox="0 0 24 24"><path d="M12 3v18M9.5 5.5h5M9 9.5h6M9 13.5h6M9.5 17.5h5"/></svg>`,
  recover:`<svg viewBox="0 0 24 24"><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/></svg>`,
  pulse:`<svg viewBox="0 0 24 24"><path d="M3 12.5h4l2-5 4 10 2-5h6"/></svg>`,
  age:`<svg viewBox="0 0 24 24"><path d="M4.5 16.5a8 8 0 1 1 15 0M12 16.5l3.5-5"/></svg>`,
  bolt:`<svg viewBox="0 0 24 24"><path d="M13 3 5.5 13.5H11L10 21l8-11h-5.5z"/></svg>`,
  cal:`<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></svg>`,
  target:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>`,
  heart:`<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.3-7-9.7A4 4 0 0 1 12 8a4 4 0 0 1 7 2.3c0 5.4-7 9.7-7 9.7z"/></svg>`,
  user:`<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/></svg>`,
  plan:`<svg viewBox="0 0 24 24"><path d="M5 19V9M10 19V5M15 19v-7M20 19v-4"/></svg>`,
  cube:`<svg viewBox="0 0 24 24"><path d="M12 3 4 7.5v9L12 21l8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/></svg>`,
  scene:`<svg viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="15" rx="3"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 15.5l-4.5-4.5-6 6M9 19.5l2.5-2.5"/></svg>`,
  desk:`<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="11" rx="2"/><path d="M8 20h8M12 15.5V20"/></svg>`,
  moon:`<svg viewBox="0 0 24 24"><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/><path d="M16 3.5v3M14.5 5h3"/></svg>`
};
/* the tab bar's own glyphs: filled, so the bar reads at a glance (Ossa 2.0). .s parts are drawn as lines */
const UI_NAV={
  today:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle class="k" cx="12" cy="7.4" r="1.6"/><path class="k" d="M7.6 10.6 12 11.6l4.4-1M12 11.6v3.4M12 15l-2.4 3.6M12 15l2.4 3.6"/></svg>`,
  train:`<svg viewBox="0 0 24 24"><rect x="1.8" y="9.2" width="2.6" height="5.6" rx="1.1"/><rect x="5.2" y="6.4" width="3.6" height="11.2" rx="1.4"/><rect x="15.2" y="6.4" width="3.6" height="11.2" rx="1.4"/><rect x="19.6" y="9.2" width="2.6" height="5.6" rx="1.1"/><rect x="8.6" y="10.7" width="6.8" height="2.6" rx=".6"/></svg>`,
  breathe:`<svg viewBox="0 0 24 24"><path d="M12 1.6 21 6.8v10.4L12 22.4 3 17.2V6.8z"/><path class="k" d="M7.8 14.4 12 10.2l4.2 4.2"/></svg>`,   /* Rank (19 Oct): a hex with a chevron up */
  recover:`<svg viewBox="0 0 24 24"><path d="M18.6 15.2A8 8 0 0 1 8.8 5.4a8 8 0 1 0 9.8 9.8z"/><path class="s" d="M15 3.5h3.5L15 7h3.5M19.5 8.5h2.2l-2.2 2.2h2.2"/></svg>`,
  explore:`<svg viewBox="0 0 24 24"><path d="M6 2.8h8.6L19 7.2V19a2.2 2.2 0 0 1-2.2 2.2H6A2.2 2.2 0 0 1 3.8 19V5A2.2 2.2 0 0 1 6 2.8z"/><path class="k" d="M7.6 11h8.8M7.6 14.6h8.8M7.6 18h5"/></svg>`
};
const UI_TABS=[{k:"today",n:"Body",ic:"body"},{k:"train",n:"Train",ic:"train"},{k:"breathe",n:"Focus",ic:"breathe"},{k:"recover",n:"Recover",ic:"recover"},{k:"explore",n:"Learn",ic:"explore"}];
const uiEsc=t=>String(t==null?"":t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const UI_TIER_C={Thriving:"var(--glow)",Good:"var(--glow-soft)",Okay:"var(--text-1)",Low:"var(--amber)"};
const UIH={view:null};   // Home's figure: front or back

/* which tab is showing. Train is a mode of the body screen underneath; Focus is the Mind screen;
   the 3D body and Profile both belong to Body */
function uiCurTab(){
  const app=$("app"); if(app&&app.classList.contains("train")) return "train";
  if(typeof MIND!=="undefined"&&MIND.open) return "breathe";
  if(TAB==="body"||TAB==="you") return "today";
  return TAB;
}

/* ---------- the tab bar ---------- */
function rdNavBuild(){
  if($("uNav")) return;
  RING.bar=true;
  const old=$("tabs"); if(old) old.classList.add("u-gone");
  const nav=document.createElement("nav"); nav.className="u-nav"; nav.id="uNav"; nav.setAttribute("aria-label","Main");
  nav.innerHTML=UI_TABS.map(t=>`<button data-u="${t.k}"><span class="u-nav-ic" aria-hidden="true">${UI_NAV[t.k]||UI_IC[t.ic]}</span><span class="u-nav-l">${t.n}</span></button>`).join("");
  (old?old.after(nav):$("app").append(nav));
  nav.addEventListener("click",e=>{ const b=e.target.closest("[data-u]"); if(b) uiGo(b.dataset.u); });
  /* in Train's details, back goes to the Train screen */
  const tb=$("trainBack"); if(tb) tb.onclick=()=>{
    const tr=$("app").classList.contains("train");
    if(tr&&TR.view==="done"&&typeof TR.doneLeave==="function"){ TR.doneLeave(true); return; }   // Workout complete → your body (rank-ups first)
    if(tr&&TR.view==="plan"&&TR.hub===false){ TR.hub=true; TR.custom=false; TR.day=todayIdx; TR.pick=TR.ed=null; Pulse.buzz(6); drawTrain(); }
    else uiGo("today"); };
}
/* leaving Focus (the Mind screen) from the tab bar: don't let it send you back where you came from */
function uiLeaveMind(){ if(typeof MIND!=="undefined"&&MIND.open){ MIND.from=null; closeMind(); return true; } return false; }
function uiGo(k){
  Pulse.buzz(8);
  const app=$("app"), tr=app.classList.contains("train");
  /* Body in the tab bar on Workout complete: the rank-ups first, then your body */
  if(k==="today"&&tr&&TR.view==="done"&&typeof TR.doneLeave==="function"){ TR.doneLeave(true); return; }
  /* a tab tap always lands on that tab: shut whatever sheet or panel was open over it */
  try{ closePanels(); if(typeof sheetState!=="undefined"&&sheetState!=="closed") setSheet("closed"); }catch(e){}
  /* Focus: always its home, at once. Tapped again on a sub-view: back to the home; on the home: to the top */
  if(k==="breathe"){ uiFocusOpen("home"); track("tab",{k}); return; }
  uiLeaveMind();
  if(k==="train"){
    if(tr&&TR.view==="plan"&&TR.hub===false){ TR.hub=true; TR.custom=false; TR.day=todayIdx; TR.pick=TR.ed=null; drawTrain(); $("train").scrollTop=0; return; }
    if(tr){ $("train").scrollTo({top:0,behavior:reduced?"auto":"smooth"}); return; }
    if(TR.view!=="active"&&TR.view!=="done"){ TR.custom=false; TR.day=todayIdx; TR.hub=true; TR.view="plan"; }
    setMode("train"); return;
  }
  setTab(k);
}
/* the one instant way into Focus (the Focus tab, Recover's wind-down, Monk Mode's notification, Heartbeat):
   no zoom into the head, no bloom, no fade (Andrej, 2026-10-16). view: 'home' (the default) or any Focus view
   ('wind', 'monk', 'beat', 'breath:even' …). Already open: another view switches to it, the same view scrolls
   back to the top. o.autoplay starts a breathing view by itself. The other ways into the mind (the head tap on
   the 3D body, Learn's Mind lessons, the Score card) still zoom, for now */
function uiFocusOpen(view,o){
  view=String(view||"home"); o=o||{};
  if(typeof MIND==="undefined") return;
  if(MIND.open){
    if(String(MIND.view)!==view){ if(o.autoplay) MIND.autoplay=true; mindGo(view); }
    else { const m=$("mind"); if(m) m.scrollTo({top:0,behavior:reduced?"auto":"smooth"}); }
    MIND.from=null; drawTabs(); return;
  }
  try{ closePanels(); if(typeof sheetState!=="undefined"&&sheetState!=="closed") setSheet("closed"); }catch(e){}
  if($("app").classList.contains("train")) setMode("body");
  MIND.tab=true; MIND.next=view; MIND.autoplay=!!o.autoplay;
  openMind();
  MIND.tab=false; MIND.from=null; drawTabs();
}
/* the 3D body */
function rdGoMe(){ uiLeaveMind(); if($("app").classList.contains("train")) setMode("body"); if(TAB!=="body") setTab("body"); else drawTabs(); }
(()=>{ const _o=openMind, _c=closeMind;
  openMind=function(){ _o.apply(this,arguments); try{ drawTabs(); }catch(e){} };
  closeMind=function(){ _c.apply(this,arguments); try{ drawTabs(); }catch(e){} }; })();
function drawTabs(){
  setTimeout(()=>{ try{ rdLookSync(); }catch(e){} },0);
  const app=$("app"), tr=app.classList.contains("train"), cur=uiCurTab();
  /* the Body page's layout (rdx) moves the bottom bar up, so the frame the body fits in changes with it: reframe when
     the class flips, otherwise the first visit is framed for the old layout and the body jumps on the next (18 Oct) */
  const wasRdx=app.classList.contains("rdx"), isRdx=TAB==="body"&&!tr;
  app.classList.toggle("rdx",isRdx);
  if(wasRdx!==isRdx) requestAnimationFrame(()=>{ try{ Body.reframe&&Body.reframe(); }catch(e){} });
  app.classList.toggle("u-profile",TAB==="you"&&!tr);
  const nav=$("uNav");
  if(nav){
    nav.querySelectorAll("[data-u]").forEach(b=>{ const on=b.dataset.u===cur; b.classList.toggle("on",on); if(on) b.setAttribute("aria-current","page"); else b.removeAttribute("aria-current"); });
    nav.classList.toggle("live",TR.view==="active");
    /* a Monk Mode session running: a steady cyan dot on Focus (monk.js) */
    let ml=false; try{ ml=typeof mmRun==="function"&&!!mmRun(); }catch(e){}
    nav.classList.toggle("mlive",ml);
    const t=nav.querySelector('[data-u="today"]'); if(t) t.classList.toggle("due",!!S.body&&!todayCheck());
  }
  const old=$("tabs"); if(old) old.classList.toggle("live",TR.view==="active");
  drawLayers();
}

/* ---------- shared pieces ---------- */
function uiRing(size,stroke,frac,col){
  const r=(size-stroke)/2, C=2*Math.PI*r, f=Math.max(0,Math.min(1,frac||0));
  return `<svg viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle class="t" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}"/>${f>0.005?`<circle class="f" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}" style="--c:${col};stroke-dasharray:${(C*f).toFixed(1)} ${C.toFixed(1)}"/>`:""}</svg>`;
}
function uiGreeting(){ const h=new Date().getHours(); return h<5?"Still up":h<12?"Good morning":h<18?"Good afternoon":"Good evening"; }
/* the name of the tab you're on, for a back pill on a panel that opens over it ("‹ Train") */
function uiPlaceName(){ try{ const k=uiCurTab(), t=UI_TABS.find(x=>x.k===k); return t?t.n:"Back"; }catch(e){ return "Back"; } }
function uiBackSet(el,pl){ if(!el) return; el.textContent="‹ "+pl; el.setAttribute("aria-label","Back to "+pl); }
function uiShortDate(){ return new Date().toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"}).replace(",",""); }
/* the regions a session works, as words: "Hinge · Core · Glutes" */
function uiSessionRegions(items){
  const regs=[]; try{ (items||[]).forEach(it=>{ const r=MUSCLES[it.primary]&&MUSCLES[it.primary].region; if(r&&!regs.includes(r)) regs.push(r); }); }catch(e){}
  return regs.slice(0,3).map(r=>REGIONS[r].name);
}
/* the little figure with today's muscles lit, and the regions as chips */
function uiSessionArt(items){
  let fig="", chips="";
  try{ if(items&&items.length){ const st={};
      items.forEach(it=>{ st[it.primary]=["rec",1]; (it.sec||[]).forEach(x=>{ if(!st[x]) st[x]=["rec",0.15]; }); });
      fig=`<div class="u-next-fig" aria-hidden="true">${figSvg(118,st).replace(/width="\d+" height="\d+"/,"")}</div>`;
      chips=`<div class="u-chips">${uiSessionRegions(items).map(r=>`<span class="u-chip static">${r}</span>`).join("")}</div>`; } }catch(e){}
  return {fig,chips};
}
/* the "Next up" card: what to do now, and one big play button. o.bone makes it the screen's one inverted card */
function uiNextHTML(T,o){
  o=o||{}; const art=o.art===false||o.bone?{fig:"",chips:""}:uiSessionArt(T.glow);
  const regs=o.bone&&T.glow?uiSessionRegions(T.glow):[];
  return `<section class="u-card u-next${o.bone?" bone":""}${o.cls?" "+o.cls:""}" ${o.id?`id="${o.id}"`:""} aria-label="${uiEsc(o.label||"Next up")}">
    <div class="u-next-tx"><div class="u-eyebrow">${T.cap}</div><h2 class="u-h2 u-next-h">${uiEsc(T.title)}</h2>${o.bone?(regs.length?`<p class="u-small">${regs.join(" · ")}</p>`:T.sub?`<p class="u-small">${T.sub}</p>`:""):T.sub?`<p class="u-small">${T.sub}</p>`:""}${art.chips}</div>
    ${art.fig}
    <div class="u-next-go">${o.second||""}<button class="u-play${o.quiet?" quiet":""}" ${o.goId?`id="${o.goId}"`:""} ${o.goData||""} aria-label="${uiEsc(T.aria||"Start")}">${UI_IC.play}</button></div></section>`;
}
/* today's session, worded for the bone card: "Today · 24 min · 5 exercises" */
function uiTodayCard(){
  const done=doneToday()&&TR.view!=="active", T=done?rdTabData("recover"):rdTabData("train");
  if(done){ const lw=S.workouts&&S.workouts[S.workouts.length-1]; T.cap=`Trained today${lw?` · ${lw.title}`:""}`; T.title="Wind down"; T.glow=null; }
  else if(TR.view==="active"){ T.cap="Workout in progress"; }
  else if(T.glow&&T.glow.length){ T.cap=`Today · ${estMin(T.glow)} min · ${T.glow.length} exercise${T.glow.length>1?"s":""}`; }
  return {T,done};
}

/* the level mark (18 Oct, Andrej: "something in the background", "better and nicer", "even better"): behind the
   body in the Body tab's hero, "LEVEL", a thin line to the next level, and the number as a huge outline in the
   overall rank's colour with a slow light sweeping through it and a soft halo, fading towards the floor. The first
   time the Body tab shows a new level it says "LEVEL UP" and the number lands with a lime flash (S.lvSeen remembers
   the last level shown; a save from before the level starts quietly). Decoration with a label for VoiceOver; the
   full status bar is on Train. */
function uiLevelMarkHTML(){
  if(typeof vxLevelInfo!=="function") return "";
  const L=uiSafe(vxLevelInfo,null); if(!L) return "";
  const ov=uiSafe(overall,0), tier=rankTier(ov), line=L.lv>=99?"top level":`${L.toNext} rank points to level ${L.lv+1}`;
  let up=false;
  try{ if(S.lvSeen==null){ S.lvSeen=L.lv; save(); } else if(L.lv>S.lvSeen){ up=true; S.lvSeen=L.lv; save(); } }catch(e){}
  /* the emblem: a hex plate with the number, the way to the next level drawn as a ring round it (from the top, clockwise) */
  const pct=Math.max(0,Math.min(100,Math.round(L.frac*100)));
  return `<div class="u-lvl${up?" up":""}" style="--c:var(--rk-${tier})" role="img" aria-label="${up?"Level up. ":""}Level ${L.lv}, ${line}">
    <span class="u-lvl-hex"><svg viewBox="0 0 64 64" aria-hidden="true"><polygon class="g" points="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5"/><polygon class="p" pathLength="100" points="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5" style="stroke-dasharray:${pct} 100"/></svg><b>${L.lv}</b></span>
    <span class="u-lvl-tx"><small>${up?"Level up":"Level"}</small><em>${L.lv>=99?"Top level":`${L.toNext} RP to go`}</em></span></div>`;
}
/* the scene behind your body (Settings has the same five): a quiet button bottom right of the hero, a strip of the
   five scenes above it when tapped (Andrej, 18 Oct: "add the actual wallpaper option there too but subtle") */
function uiSceneHTML(){
  if(typeof SCENES==="undefined"||typeof setScene!=="function") return "";
  const cur=S.scene??1;
  /* 19 Oct: the old 3D page's water pill lives here now, as a switch: show today's water inside your body */
  const hv=!!S.hydView, n=typeof waterToday==="function"?waterToday():0;
  return `<button class="u-icon-btn round u-scn-btn" id="uScnBtn" aria-label="Change the scene behind your body" aria-expanded="false">${UI_IC.scene}</button>
    <div class="scn u-scn-pop" id="uScnPop" role="group" aria-label="Scene" hidden>${SCENES.map((x,i)=>`<button class="scn-i s${i}${cur===i?" on":""}" data-scn="${i}" aria-pressed="${cur===i}"><i></i><b>${x}</b></button>`).join("")}
      <button class="u-scn-water${hv?" on":""}" id="uScnWater" aria-pressed="${hv}">${UI_IC.drop}<span>Water in your body</span><b>${n}/8</b><i aria-hidden="true"></i></button></div>`;
}
function uiSceneOpen(on){
  const btn=$("uScnBtn"), pop=$("uScnPop"); if(!btn||!pop) return;
  pop.hidden=!on; btn.setAttribute("aria-expanded",on?"true":"false"); btn.classList.toggle("on",!!on);
}
function uiSceneWire(root){
  const btn=$("uScnBtn"), pop=$("uScnPop"); if(!btn||!pop) return;
  btn.onclick=()=>{ Pulse.buzz(6); uiSceneOpen(pop.hidden); };
  pop.querySelectorAll("[data-scn]").forEach(x=>x.onclick=()=>{ const i=+x.dataset.scn; setScene(i); track("scene",{i,from:"body"});
    pop.querySelectorAll("[data-scn]").forEach(y=>{ const on=y===x; y.classList.toggle("on",on); y.setAttribute("aria-pressed",on); });
    setTimeout(()=>uiSceneOpen(false),reduced?0:260); });
  const wa=$("uScnWater"); if(wa) wa.onclick=()=>{ S.hydView=!S.hydView; save(); Pulse.buzz(8); track("water_view",{on:S.hydView});
    wa.classList.toggle("on",!!S.hydView); wa.setAttribute("aria-pressed",!!S.hydView); try{ rdWaterSync(false); }catch(e){} };
  const tap=$("uRkTap"); if(tap) tap.addEventListener("click",e=>{ if(!pop.hidden){ uiSceneOpen(false); e.stopImmediatePropagation(); } },true);
}
/* the rank colours, bottom left of the hero: five dots and names, your overall rank brighter (Andrej, 18 Oct: "on the side too but subtle") */
function uiRankRailHTML(){
  const me=rankTier(uiSafe(overall,0));
  return `<div class="u-rkrail" role="list" aria-label="Rank colours">${[5,4,3,2,1].map(t=>`<span role="listitem"${t===me?' class="me"':""}><i style="--c:var(--rk-${t})"></i>${RANKS[t][1]}</span>`).join("")}</div>`;
}

/* =========================================================
   HOME (the Body tab) — your muscles by rank, the weak link, today's one thing, a dare,
   then your score, quick logs, your week.
   ========================================================= */
function renderToday(){
  const b=$("tv-today"); if(!b) return;
  const P=pillars(0), c=todayCheck(), start=isStart(), tier=bodyTier(P.score), col=start?"var(--text-2)":UI_TIER_C[tier]||"var(--text-2)";
  const d=P.score-pillars(1).score;
  const nm=(S.name||"").trim(), st=uiStreak();
  const head=`<header class="u-top"><div class="u-top-tx"><div class="u-eyebrow">${uiShortDate()}</div><h1 class="u-h1">Your body</h1></div>
    <div class="u-top-r"><button class="u-streak${st.today?" on":""}" id="uStreak" aria-label="${st.n} day streak">${UI_FLAME}<b>${st.n}</b></button>
    <button class="u-avatar${nm?"":" anon"}" id="uAvatar" aria-label="Profile and settings">${nm?uiEsc(nm[0].toUpperCase()):UI_IC.user}</button></div></header>`;
  /* your muscles, by rank: your own 3D body when the phone can draw it, the flat figure when it can't */
  const weak=rkWeak(), view=UIH.view||"front", ws=S.scores[weak]||0, wnx=toNext(ws), wt=rankTier(ws);
  const sess=rkSessionsToTier(ws), inToday=rkInToday(weak);
  UIH.weak=weak;
  const g3=uiHome3D();
  const side=`<div class="u-seg u-rkview" role="tablist" aria-label="Side"><button data-fv="front" role="tab" aria-selected="${view==="front"}" class="${view==="front"?"on":""}">Front</button><button data-fv="back" role="tab" aria-selected="${view==="back"}" class="${view==="back"?"on":""}">Back</button></div>`;
  /* 19 Oct (lens.js): the old 3D page folded in. Lens chips left of the body, the X-ray knob at its right edge, the
     scene button beside Front | Back (the cube is gone); under the body a readout line, the pick card, the two quests */
  const lx=g3&&typeof lxChipsHTML==="function";
  const hero=g3?`<section class="u-rkhero u-rk3dh" id="rdHero" data-pad="72" aria-label="Your body">
      ${uiLevelMarkHTML()}${lx?lxLegendHTML():uiRankRailHTML()}
      <div class="u-rkbar">${side}${uiSceneHTML()}</div>
      <button class="u-rk-tap" id="uRkTap" aria-label="Your body. Tap a muscle to see it, drag to turn, pinch to zoom, hold to flag it sore, double-tap a region to zoom into it."></button>
      ${lx?lxChipsHTML()+lxKnobHTML():""}
      <svg class="u-rk-lead" id="uRkLead" aria-hidden="true"><polyline points="0,0 0,0"/><circle class="r" r="10"/><circle class="d" r="4"/></svg>
      <span class="u-rkcall u-rkcall3" id="uRkCall" aria-hidden="true" hidden><b></b></span>
      <i class="rh-low" aria-hidden="true"></i>
    </section>`:`<section class="u-rkhero" aria-label="Your muscle ranks">
      ${rkLegendHTML()}${side}
      <button class="u-rkfig" id="uRkFig" aria-label="See all your muscle ranks">${uiRankFig(view,{hl:[weak]})}</button>
      <span class="u-rkcall" id="uRkCall" aria-hidden="true"><i></i><b>Weak link</b></span>
    </section>`;
  const weakCard=lx?lxCardHTML():g3&&UIH.sel?uiFocusCardHTML(UIH.sel):uiWeakCardHTML();
  /* under the body: what the lens reads, the card, the two quests */
  const below=lx?`<div class="lx-read" id="lxRead" data-l="${lxLens()}">${lxReadHTML()}</div>${weakCard}${lxQuestsHTML()}`:weakCard;
  b.innerHTML=`<div class="u-screen u-home${g3?" u-home3d":""}">${head}${hero}${g3?`<div class="u-below">${below}</div>`:below}</div>`;
  /* wiring */
  uiWireTodayHead();
  uiFocusCardWire();
  if(g3){
    if(!RDH.on&&TAB==="today"&&!$("app").classList.contains("train")&&!$("app").classList.contains("onboarding")) rdHomeOn(true);
    uiHeroWire(); uiSceneWire(b);
    if(lx){ lxWireParts(); lxKnobWire(); lxGestureWire(); requestAnimationFrame(()=>{ try{ lxApplyLine(); }catch(e){} }); }
    b.querySelectorAll("[data-fv]").forEach(x=>x.onclick=()=>{ Pulse.buzz(5); UIH.view=x.dataset.fv; uiHeroSide(UIH.view); try{ Body.setView(UIH.view); }catch(e){}
      /* the muscle you picked is out of sight from this side: let it go */
      if(UIH.sel){ const f=(MUSCLES[UIH.sel]&&MUSCLES[UIH.sel].face)||0, v=UIH.view==="back"?Math.PI:0; if(Math.max(Math.cos(v-f),Math.cos(v+f))<0) uiHeroSelect(UIH.sel); } });
    if(RDH.on){ requestAnimationFrame(()=>{ try{ Body.reframe&&Body.reframe(); rdScroll(); uiHeroDraw(true); }catch(e){} }); }
  } else {
    uiPlaceCallout();
    $("uRkFig").onclick=()=>openRanks();
    b.querySelectorAll("[data-fv]").forEach(x=>x.onclick=()=>{ if(UIH.view===x.dataset.fv) return; UIH.view=x.dataset.fv; Pulse.buzz(5); renderToday(); });
  }
}

/* =========================================================
   YOUR DAY (18 Oct, Andrej: the Body page is "just this": the body, the level, the weak link). Everything that
   used to sit under the weak-link card lives here now, at the top of the Profile: the check-in, the Body Score,
   the quick tiles (water, rank, posture, body age), For you, Standards, and the rows (week in review, Health,
   sore spots). Today's session and the week are on Train; the dare is Train's side quest.
   ========================================================= */
function uiDayHTML(){
  const P=pillars(0), c=todayCheck(), start=isStart(), tier=bodyTier(P.score), col=start?"var(--text-2)":UI_TIER_C[tier]||"var(--text-2)";
  const d=P.score-pillars(1).score;
  /* score: before your first check-in, the starting score from the intro stands in */
  const s0=start&&S.startScore!=null?S.startScore:null;
  const score=`<div class="u-section-h"><span class="u-eyebrow">Body Score</span></div><button class="u-card u-score" id="tdScore" aria-label="Body Score ${s0!=null?"starting at "+s0:start?"not set yet":P.score+", "+tier}. How it works">
      <span class="u-ring u-score-ring">${uiRing(112,8,s0!=null?s0/100:start?0:P.score/100,s0!=null?"var(--text-2)":col)}<span class="u-score-n"><b class="u-num">${s0!=null?s0:start?"–":P.score}</b><small style="color:${col}">${s0!=null?"Starting":start?"Body Score":tier}</small></span></span>
      <span class="u-pils">${PILLARS.map(p=>{ const v=P[p.k]; return `<span class="u-pil" style="--c:var(--${p.k})"><span class="u-pil-h"><b>${p.name}</b><em>${v??"–"}</em></span><span class="u-bar"><i style="width:${v??0}%"></i></span></span>`; }).join("")}</span>
      <span class="u-score-foot">${start?"Check in to get your first score":c?`${d>=0?"+":"−"}${Math.abs(d)} vs yesterday`:P.recover!=null?"From your last check-in. Check in for today":"Check in to fill in Recover, Fuel and Mind"}${UI_IC.chev}</span>
    </button>`;
  /* check-in: one tap, right here (uiCheckCard fills it in) */
  const check=`<div class="u-ck-host" id="uCkHost"></div>`;
  /* quick tiles */
  const w=waterToday(), l=psLast(); let ba=null; try{ ba=rdBodyAge(); }catch(e){}
  const tile=(k,ic,cv,label,val,unit,extra)=>`<div class="u-tile" style="--c:${cv}" data-q="${k}" role="button" tabindex="0" aria-label="${uiEsc(label+": "+String(val).replace(/<[^>]+>/g,"")+(unit||""))}"><span class="u-ic">${ic}</span><span class="u-tile-l">${label}</span><span class="u-tile-v"><b class="u-num">${val}</b>${unit?`<small>${unit}</small>`:""}</span>${extra||""}</div>`;
  const tiles=`<div class="u-section-h"><span class="u-eyebrow">Quick</span></div><div class="u-tiles">
    ${tile("water",UI_IC.drop,"var(--recover)","Water",`<span id="uWaterN">${w}</span>`,` / ${RD_WGOAL} glasses`,`<button class="u-tile-add" id="uWaterAdd" aria-label="Log a glass of water">${UI_IC.plus}</button>`)}
    ${tile("ranks",`<svg viewBox="0 0 24 24"><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/></svg>`,`var(--rk-${rankTier(overall())})`,"Overall rank",rankOf(overall()).split(" ")[0],` ${rankOf(overall()).split(" ")[1]||""}`)}
    ${tile("posture",UI_IC.posture,"var(--glow-soft)","Posture",l?l.sc:"Scan",l?" / 100":" · 2 min")}
    ${tile("age",UI_IC.age,"var(--fuel)","Body age",ba?`${ba.src==="check"?"":"~"}${ba.age}`:"Find",ba?(ba.d!=null?(ba.d<=-1?` · ${-ba.d} yrs younger`:ba.d>=1?` · ${ba.d} yrs older`:" · on track"):" years"):" yours")}
  </div>`;
  /* for you */
  const forYou=uiForYouHTML();
  const rows=[];
  if(reviewReady()) rows.push(`<button class="u-row" id="tdReview"><span class="u-ic" style="--c:var(--glow-soft)">${UI_IC.cal}</span><span><b>Your week in review</b><small>${reviewWeek().label} · about a minute</small></span>${UI_IC.chev}</button>`);
  if(typeof NATIVE!=="undefined"&&NATIVE&&NATIVE.caps&&NATIVE.caps.health==="ok"&&!hOn()&&!S.hNo) rows.push(`<button class="u-row" id="tdHealth"><span class="u-ic" style="--c:var(--glow)">${UI_IC.heart}</span><span><b>Connect ${HSRC()}</b><small>Steps and sleep fill in by themselves</small></span>${UI_IC.chev}</button>`);
  rows.push(uiSoreRowHTML("tdRelief"));
  /* standards and any programme you're on: the same cards as before, with one primary button per screen */
  const pd=protoDay(), std=`<section id="secStd"><div class="u-section-h"><span class="u-eyebrow">Standards</span></div>${(stdCardHTML()+(pd&&!pd.over?protoHTML():"")).replace(/btn primary/g,"btn")}</section>`;
  return `${check}${score}${tiles}${forYou}${std}<div class="u-card u-list">${rows.join("")}</div><p class="u-foot">Everything you log stays on this device.</p>`;
}
function uiDayWire(b,redraw){
  if(!b) return;
  $("tdScore").onclick=openScore;
  uiCheckCard($("uCkHost"));
  b.querySelectorAll("[data-q]").forEach(x=>{ const go=()=>uiQuick(x.dataset.q); x.onclick=e=>{ if(e.target.closest("#uWaterAdd")) return; go(); }; x.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); go(); } }; });
  $("uWaterAdd").onclick=e=>{ e.stopPropagation(); const n=uiWaterAdd(1); $("uWaterN").textContent=n; toast(n>=RD_WGOAL?(n===RD_WGOAL?"That's your eight. Topped up.":`${n} glasses today.`):`${n} of ${RD_WGOAL} glasses today`); };
  if($("tdReview")) $("tdReview").onclick=()=>openReview(0);
  if($("tdHealth")) $("tdHealth").onclick=healthConnect;
  $("tdRelief").onclick=uiSoreGo;
  wireStdCard(b);
  if($("prLeave")) $("prLeave").onclick=function(){ if(this.dataset.a!=="1"){ this.dataset.a="1"; this.textContent="Tap again to leave"; return; } leaveProto(); };
  if($("tdC30")) $("tdC30").onclick=()=>startProto("c30");
  if($("sdProto")) $("sdProto").onclick=openProto;
  uiWireForYou(b);
}
/* =========================================================
   THE DAILY CHECK-IN — one tap, on the Body page itself. It used to be ten questions on a page of
   their own (Andrej, 2026-10-15: "wayyyyyy too long"). Now "How do you feel?" is the only question.
   Last night's sleep comes from Apple Health, or from your last answer, and sits under the question
   so you can change it. The answer stands in for energy and mood; focus, stress, caffeine, food and
   soreness are no longer asked, and everything that reads a check-in treats them as unknown.
   ========================================================= */
const UI_FEEL=["Drained","Tired","Okay","Good","Charged"];
const UI_SLEEP_SHORT={4:"Under 5h",5:"5–6h",6:"6–7h",7:"7–8h",8:"8h+"};
/* last night: the phone's figure, else today's answer, else your last one, else what you usually sleep */
function uiCkSleep(){
  const hs=typeof hSleep==="function"?hSleep():null; if(hs!=null) return {v:sleepBucket(hs),h:hs,src:"health"};
  const c=todayCheck(); if(c&&c.sleep) return {v:c.sleep,src:"today"};
  const M=mindState(); for(let i=1;i<8;i++){ const c0=M.check[dkey(i)]; if(c0&&c0.sleep) return {v:c0.sleep,src:"last"}; }
  const p=S.profile&&S.profile.sleepH; if(typeof p==="number"&&p>0) return {v:sleepBucket(p),src:"usual"};
  return {v:7,src:"guess"};
}
const uiCkHsrc=()=>{ try{ return HSRC(); }catch(e){ return "Apple Health"; } };
const uiCkSleepWord=v=>(UI_SLEEP_SHORT[v]||"").replace(/^Under/,"under");
function uiCkSleepTxt(c){
  const hs=typeof hSleep==="function"?hSleep():null;
  if(hs!=null&&c&&c.sleep===sleepBucket(hs)) return `Slept ${fmtH(hs)}`;
  return c&&UI_SLEEP_SHORT[c.sleep]?`Slept ${uiCkSleepWord(c.sleep)}`:"";
}
/* what your answer changes today, in the plan's own terms (adaptToday makes the session lighter) */
function uiCkSays(c){
  if(!c) return "";
  try{
    if(doneToday()) return "You've trained today. Sleep well tonight.";
    const base=sessionForDay(todayIdx);
    if(!base||!base.items||!base.items.length) return "Rest day. A walk counts.";
    const a=base.mine?null:adaptToday(base);
    if(a&&a.kind==="rest") return "Most of you is still recovering, so today works better as a rest day.";
    if(a&&a.light) return c.sleep<=5?"Short night, so today's session is one set lighter.":"Running low, so today's session is one set lighter.";
    return "Good to go for today's session.";
  }catch(e){ return ""; }
}
function uiCkSave(feel,sleep){
  const old=todayCheck(), ha=typeof stepsAct==="function"?stepsAct():null;
  const c={sore:[],caf:null,food:null,focus:null,stress:null,act:ha,...(old||{}),sleep,energy:feel,mood:feel,water:waterToday(),quick:1};
  mindState().check[dkey(0)]=c; save(); track("checkin_done",{feel,sleep,edit:!!old});
  return c;
}
/* the card. host: where it goes. o.page: it has a screen to itself (the Mind screen); o.onSave / o.onCancel */
function uiCheckCard(host,o){
  if(!host) return; o=o||{};
  let pick=null, open=false, dirty=false;   // a sleep picked before answering; the sleep choices showing; saved while editing
  const sfx=o.page?"M":"";   // the Mind screen's copy sits over the Body page's: keep their ids apart
  const tick=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12.5l4.2 4.2 8.8-9.4"/></svg>`;
  const doneHTML=(c,anim)=>`<section class="u-card u-ck done${anim?" in":""}" id="secCheck" aria-live="polite">
      <span class="u-ck-tick">${tick}</span>
      <span class="u-ck-sum"><b>Checked in · ${UI_FEEL[(c.energy||3)-1]}</b><small>${[uiCkSleepTxt(c),uiCkSays(c)].filter(Boolean).join(". ")}</small></span>
      <button class="u-link" data-ck="edit" aria-label="Change today's check-in">Change</button></section>`;
  const askHTML=()=>{
    const c=todayCheck(), editing=!!c, sl=uiCkSleep(), sv=pick!=null?pick:(c&&c.sleep)||sl.v, cur=c&&c.energy;
    const sleep=sl.src==="health"&&pick==null
      ?`<p class="u-ck-sl"><span>${UI_IC.moon}Slept <b>${fmtH(sl.h)}</b></span><span class="u-ck-src">from ${uiEsc(uiCkHsrc())}</span></p>`
      :open?`<div class="u-ck-sl open"><span>${UI_IC.moon}How long did you sleep?</span></div>
        <div class="u-ck-chips" role="radiogroup" aria-label="How long you slept">${SLEEPS.map(([v])=>`<button class="u-ck-chip${v===sv?" on":""}" role="radio" aria-checked="${v===sv}" data-sleep="${v}">${UI_SLEEP_SHORT[v]}</button>`).join("")}</div>`
      :`<p class="u-ck-sl"><span>${UI_IC.moon}Slept <b>${uiCkSleepWord(sv)}</b></span><button class="u-link" data-ck="sleep" aria-label="Change how long you slept">Change</button></p>`;
    return `<section class="u-card u-ck${editing?"":" accent"}${o.page?" page":""}" id="secCheck${sfx}" aria-labelledby="uCkQ${sfx}">
      <div class="u-ck-h"><span class="u-eyebrow">Daily check-in</span>${editing||o.page?`<button class="u-link" data-ck="close">${editing?"Done":"Not now"}</button>`:`<span class="u-ck-one">One tap</span>`}</div>
      <h2 class="u-h2" id="uCkQ${sfx}">How do you feel today?</h2>
      <div class="u-ck-feel" role="radiogroup" aria-labelledby="uCkQ${sfx}">${UI_FEEL.map((w,i)=>`<button class="u-ck-o${cur===i+1?" sel":""}" role="radio" aria-checked="${cur===i+1}" data-feel="${i+1}" style="--s:${(0.62+0.38*i/4).toFixed(2)}"><i><em></em></i><small>${w}</small></button>`).join("")}</div>
      ${sleep}
    </section>${o.page?`<p class="u-ck-note">Stays on this device. Nothing is uploaded.</p>`:""}`;
  };
  const refresh=()=>{ const v=$("tv-today"), y=v?v.scrollTop:0; refreshWhole(); if(v) v.scrollTop=y; };
  const draw=anim=>{ const c=todayCheck(); host.innerHTML=c&&!UIH.ckEdit&&!o.page?doneHTML(c,anim):askHTML(); wire(); };
  const wire=()=>{
    host.querySelectorAll("[data-feel]").forEach(x=>x.onclick=()=>{
      if(host.dataset.busy) return; host.dataset.busy="1";
      const feel=+x.dataset.feel, c0=todayCheck(), sleep=pick!=null?pick:(c0&&c0.sleep)||uiCkSleep().v;
      host.querySelectorAll(".u-ck-o").forEach(y=>{ const on=y===x; y.classList.toggle("sel",on); y.setAttribute("aria-checked",String(on)); });
      fxReplay(x,"pop"); Pulse.buzz(8); try{ Pulse.audio(); Pulse.chime(Math.min(5,feel)); }catch(e){}
      const c=uiCkSave(feel,sleep); UIH.ckEdit=false; pick=null; open=false; dirty=false;
      setTimeout(()=>{
        delete host.dataset.busy;
        if(o.page){ try{ refreshWhole(); }catch(e){} if(o.onSave) o.onSave(c); return; }
        if(!host.isConnected) return;
        host.innerHTML=doneHTML(c,true); wire(); try{ Pulse.buzz([10,50,18]); }catch(e){}
        setTimeout(()=>{ if(host.isConnected) refresh(); },reduced?200:1100);   // the score and today's plan catch up
      },reduced?60:360);
    });
    host.querySelectorAll("[data-sleep]").forEach(x=>x.onclick=()=>{
      pick=+x.dataset.sleep; open=false; Pulse.buzz(5);
      const c=todayCheck(); if(c){ c.sleep=pick; save(); dirty=true; }   // already checked in: a new sleep answer saves straight away
      draw();
    });
    const sb=host.querySelector('[data-ck="sleep"]'); if(sb) sb.onclick=()=>{ Pulse.buzz(5); open=true; draw(); };
    const ed=host.querySelector('[data-ck="edit"]'); if(ed) ed.onclick=()=>{ Pulse.buzz(6); UIH.ckEdit=true; draw(); };
    const cl=host.querySelector('[data-ck="close"]'); if(cl) cl.onclick=()=>{ Pulse.buzz(5); UIH.ckEdit=false; pick=null; open=false;
      if(o.page){ if(o.onCancel) o.onCancel(); return; }
      if(dirty){ dirty=false; refresh(); } else draw(); };
  };
  draw(false);
}
/* "Check in" anywhere else in the app: bring you to the card on the Body page (open to change it if you already have) */
function uiCheckOpen(){
  if(todayCheck()) UIH.ckEdit=true;
  uiLeaveMind();
  const go=()=>{ const v=$("tv-today"), el=$("secCheck"); if(!v||!el) return;
    const r=el.getBoundingClientRect(), rv=v.getBoundingClientRect();
    v.scrollTo({top:Math.max(0,v.scrollTop+r.top-rv.top-Math.round(rv.height*0.3)),behavior:reduced?"auto":"smooth"});
    fxReplay(el,"u-ck-hi"); };
  if(TAB!=="today"||$("app").classList.contains("train")){ setTab("today"); setTimeout(()=>requestAnimationFrame(go),reduced?0:TAB_MS); }
  else { renderToday(); requestAnimationFrame(go); }
}
/* =========================================================
   THE BODY PAGE IN 3D — your own figure stands at the top of the page, muscles coloured by rank.
   The page is see-through there (the old home-figure machinery in ossa.html: rdHomeOn, rdHeroBox,
   rdScroll). Drag sideways to turn it, tap it to open the full 3D body.
   ========================================================= */
window.UI3DHOME=true;
function uiHome3D(){ return !!window.UI3DHOME&&typeof Body!=="undefined"&&Body.kind==="gl"; }
/* how the figure looks on the Body page (called by rdTabFigure when Home opens or scrolls back into view):
   standing still, muscles coloured by rank, one muscle at a time can be picked out */
function uiHomeFigure(){
  try{
    if(RDH.obs){ Body.obEnd(); RDH.obs=false; }
    if(TR.glowOn){ TR.glowOn=null; Body.stopDemo&&Body.stopDemo(); }
    clearInterval(TR.planSpin); TR.planSpin=0;
    Body.setXray&&Body.setXray(false);
    Body.setOverview&&Body.setOverview(false,false);
    Body.setRank&&Body.setRank(typeof lxRankOn==="function"?lxRankOn():true);   // the lens (lens.js): Rank or Recovery
    mode=1;   // muscle by muscle, not region by region
    Body.setSel&&Body.setSel(UIH.sel?{t:"muscle",id:UIH.sel}:null,UI_SEL_FADE);
    const v=UIH.view||(UIH.sel?rkWeakView(UIH.sel):"front");   // starts facing you (Andrej, 19 Oct); a picked muscle turns to its side
    Body.camTo&&Body.camTo({zoom:1,px:0,py:0,yaw:v==="back"?Math.PI:0},reduced?0.01:0.7);
    Body.setAura&&Body.setAura(null,null,0);
  }catch(e){}
}
const UI_SEL_FADE=0.6;   // how far the rest of the body steps back while one muscle is picked
/* leaving the Body page hands the figure back to the 3D screen as it was */
(()=>{ const _o=rdHomeOn; rdHomeOn=function(on){
  const was=typeof RDH!=="undefined"&&RDH.on;
  const r=_o.apply(this,arguments);
  if(!on&&was){ UIH.sel=null; try{ Body.setSel&&Body.setSel(typeof sel!=="undefined"?sel:null); const z=Body.zoom?Body.zoom():1; onMode(z>=MUSCLE_ZOOM?1:0); }catch(e){} }
  /* coming on: the Body page shows its own pick (or none) in rank colours, whatever the 3D screen or Train left behind
     (18 Oct, Andrej: the body came back "greyed out" after a trip to Train) */
  if(on){ try{ Body.setSel&&Body.setSel(UIH.sel?{t:"muscle",id:UIH.sel}:null,UI_SEL_FADE); }catch(e){} try{ if(typeof rkSync==="function") rkSync(); else if(Body.setRank) Body.setRank(true); }catch(e){} }
  return r; }; })();
/* Front / Back */
function uiHeroSide(v){
  document.querySelectorAll("#rdHero [data-fv]").forEach(b=>{ const on=b.dataset.fv===v; b.classList.toggle("on",on); b.setAttribute("aria-selected",on); });
}
/* the muscle under a finger, forgiving: if the exact point is a gap, look a little around it */
function uiHeroPick(cx,cy){
  const cv=$("stage")&&$("stage").querySelector("canvas"); if(!cv||!Body.pickAt) return null;
  const r=cv.getBoundingClientRect(), x=cx-r.left, y=cy-r.top;
  for(const [dx,dy] of [[0,0],[0,-9],[9,0],[0,9],[-9,0],[0,-18],[16,0],[0,18],[-16,0]]){
    const k=Body.pickAt(x+dx,y+dy); if(k&&typeof k==="string"&&MUSCLES[k]) return k; }
  return null;
}
/* tap a muscle: it lights up, the rest steps back, its name points at it and the card below shows its rank */
function uiHeroSelect(k){
  if(k===UIH.sel) k=null;   // a second tap lets go
  UIH.sel=k||null; if(typeof lxS==="function") lxS().joint=null;
  try{ Body.setSel&&Body.setSel(k?{t:"muscle",id:k}:null,UI_SEL_FADE); if(k&&Body.pulse) Body.pulse([k]); }catch(e){}
  Pulse.buzz(k?[6,30,10]:5); if(k) track("home_muscle",{k});
  const c=$("uWeak"); if(c){ c.outerHTML=typeof lxCardHTML==="function"&&uiHome3D()?lxCardHTML():k?uiFocusCardHTML(k):uiWeakCardHTML(); uiFocusCardWire(); }
  UIHD.k=""; uiHeroDraw(true);
  if(k&&typeof lxTip==="function") lxTip("hold");
}
/* the card under the body: the muscle you picked, or your weak link */
function uiFocusCardHTML(k){
  const s=S.scores[k]||0, t=rankTier(s), nx=toNext(s), fresh=isNew(k);
  const st=vxStateShort(k);   // Not trained yet · Flagged · fade paused · Recovering · N% · Fading · N days · Ready to train
  const next=fresh?"Train it once to rank it.":t>=5&&!nx?"Top rank. Keep it there.":nx?`${nx.pts} to ${nx.name}.`:"";
  return `<button class="u-card u-weak u-focus" id="uWeak" data-k="${k}" data-t="${t}" style="--c:var(--rk-${t})" aria-label="${uiEsc(rkSay(k))}: ${s?rankOf(s):"not ranked yet"}. Open in 3D"><i class="rk-sq" data-t="${t}"></i>
    <span><em class="u-weak-eb">Your pick</em><b>${uiEsc(rkSay(k))} · ${s?rankOf(s):"Unranked"}</b><small>${st} · ${next}${rkInToday(k)?" Today trains it.":""}</small></span>${UI_IC.chev}</button>`;
}
function uiWeakCardHTML(){
  const weak=UIH.weak||rkWeak(), ws=S.scores[weak]||0, wt=rankTier(ws), sess=rkSessionsToTier(ws), inToday=rkInToday(weak);
  return `<button class="u-card u-weak" id="uWeak" data-t="${wt}" style="--c:var(--rk-${wt})"><i class="rk-sq" data-t="${wt}"></i>
      <span><em class="u-weak-eb">Weak link</em><b>${ws?`${uiEsc(rkSay(weak))} · ${rankOf(ws)}`:uiEsc(rkSay(weak))}</b><small>${ws?(wt>=5?"Top rank. Keep it there.":`${sess} session${sess>1?"s":""} to ${RANKS[wt+1][1]}.`):"Not trained yet. Start here."}${inToday?" Today targets it.":""}</small></span>${UI_IC.chev}</button>`;
}
function uiFocusCardWire(){
  const c=$("uWeak"); if(!c) return;
  c.onclick=()=>{ Pulse.buzz(8); const k=c.dataset.k;
    /* the card follows the lens (lens.js): a joint opens its sheet, "all clear" opens Sore spots, "all ready" goes to Train */
    if(c.dataset.j){ openJoint(c.dataset.j); return; }
    if(c.dataset.sore){ try{ vxSoreOpen(); }catch(e){} return; }
    if(c.dataset.go==="train"){ uiGo("train"); return; }
    if(!k){ openRanks(); return; }
    /* a muscle: its sheet opens over the Body page (19 Oct: the 3D page is gone) */
    if(uiHome3D()&&typeof RDH!=="undefined"&&RDH.on){ openSel({t:"muscle",id:k},false); return; }
    rkShow3D(); setTimeout(()=>{ try{ openSel({t:"muscle",id:k},true); }catch(e){} },reduced?0:500); };
}
/* tapping the body picks a muscle (or lets it go). Turning, pinching and holding are lens.js's (lxGestureWire). */
function uiHeroWire(){
  const t=$("uRkTap"); if(!t) return;
  t.addEventListener("click",e=>{
    if(typeof lxEat==="function"&&lxEat()) return;   /* the click after a hold, a turn or a pinch */
    /* a double-tap (lens.js): back out when zoomed or in a region, otherwise into the region under the finger */
    if(typeof lxDouble==="function"){ const now=performance.now(), L=uiHeroWire.last;
      if(L&&now-L.t<330&&Math.hypot(e.clientX-L.x,e.clientY-L.y)<36){ uiHeroWire.last=null;
        if((UIH.sel||null)!==(L.sel||null)){ try{ uiHeroSelect(L.sel||UIH.sel); }catch(x){} }   /* the first tap's pick is undone */
        lxDouble(e.clientX,e.clientY); return; }
      uiHeroWire.last={t:now,x:e.clientX,y:e.clientY,sel:UIH.sel||null}; }
    /* where the skeleton shows (lens.js), a tap picks a joint: the card below names it */
    if(typeof lxBonesOn==="function"&&lxBonesOn()){ const h=lxHit(e.clientX,e.clientY); if(h&&h.kind==="j"){ Pulse.buzz([6,30,10]); lxS().joint={j:h.id,sd:h.sd}; lxS().js=null; lxRefresh(); track("home_joint",{j:h.id}); return; }
      if(lxIsBones()){ if(lxS().joint){ lxS().joint=null; lxRefresh(); } return; }
      if(lxS().joint){ lxS().joint=null; lxRefresh(); } }
    const k=uiHeroPick(e.clientX,e.clientY);
    if(typeof sheetState!=="undefined"&&sheetState!=="closed"){ if(k) openSel({t:"muscle",id:k},false); return; }   /* a sheet is open: it follows the tap */
    if(k||UIH.sel) uiHeroSelect(k); });
}
/* every frame: the ring follows the muscle (your pick, or the weak link); the card under the body names it.
   A tapped muscle also gets its name as a tag beside the body with a short line to the ring, on the muscle's own side
   (Andrej, 18 Oct: a tap with only the ring and the card felt mute). The weak link has no tag: the card says it. */
const UIHD={k:""};
function uiHeroDraw(force){
  if(typeof RDH==="undefined"||!RDH.on||TAB!=="today") return;
  const app=$("app"); if(app.classList.contains("train")||app.classList.contains("homeoff")) return;
  const h=$("rdHero"), lead=$("uRkLead"), call=$("uRkCall"); if(!h||!lead||!Body.project) return;
  const k=UIH.sel||(typeof lxFocusKey==="function"&&uiHome3D()?lxFocusKey():UIH.weak), m=k&&typeof MCEN!=="undefined"&&MCEN[k];   /* the ring follows the card (lens.js) */
  let best=null;
  if(m) [1,-1].forEach(sg=>{ const pr=Body.project([m[0]*sg,m[1],m[2]]); if(!pr) return; const f=Math.cos(pr.yaw-sg*((MUSCLES[k]&&MUSCLES[k].face)||0)); if(!best||f>best.f) best={x:pr.x,y:pr.y,f}; });
  if(!best||best.f<0.12){ if(UIHD.k!=="off"){ lead.style.opacity="0"; if(call) call.hidden=true; UIHD.k="off"; } return; }
  if(typeof lxIsBones==="function"&&lxIsBones()){ if(UIHD.k!=="off"){ lead.style.opacity="0"; if(call) call.hidden=true; UIHD.k="off"; } return; }   /* the Bones lens: joints, not muscles */
  const pick=!!UIH.sel; lead.classList.toggle("pick",pick);
  const tv=$("tv-today"), W=h.clientWidth, H=h.clientHeight, x=best.x-(tv.offsetLeft+h.offsetLeft), y=best.y-(tv.offsetTop+h.offsetTop);
  const line=lead.querySelector("polyline");
  /* the tag: the muscle's name on its own side, clear of the level (top left), the bar (top right), the rank key (bottom left) and the scene button (bottom right) */
  let lx=0, ly=0, ex=x, left=x<W/2;
  if(pick&&call){
    const name=rkSay(UIH.sel), b=call.querySelector("b");
    if(b&&b.textContent!==name){ b.textContent=name; UIHD.k=""; fxReplay(call,"u-pop"); }
    if(call.hidden) call.hidden=false;
    const bw=call.offsetWidth||84, bh=call.offsetHeight||28;
    /* clear of the lens chips (left, under the level) and the X-ray knob (right edge) */
    const chips=$("lxChips"), cb=chips?chips.offsetTop+chips.offsetHeight+10+bh/2:164, kr=$("lxKnob")?52:8;
    ly=left?Math.max(cb,Math.min(H-128,y)):Math.max(144,Math.min(H-64,y));
    lx=left?8:W-bw-kr; ex=left?lx+bw:lx;
    call.style.transform=`translate(${lx.toFixed(1)}px,${(ly-bh/2).toFixed(1)}px)`;
  } else if(call&&!call.hidden) call.hidden=true;
  const key=`${k},${pick?1:0},${x.toFixed(0)},${y.toFixed(0)},${lx.toFixed(0)},${ly.toFixed(0)},${best.f>0.42?1:best.f.toFixed(2)}`;
  if(!force&&key===UIHD.k) return; UIHD.k=key;
  ["r","d"].forEach(c=>{ const e=lead.querySelector("."+c); e.setAttribute("cx",x.toFixed(1)); e.setAttribute("cy",y.toFixed(1)); });
  if(line) line.setAttribute("points",pick?`${x.toFixed(1)},${y.toFixed(1)} ${ex.toFixed(1)},${ly.toFixed(1)}`:`${x.toFixed(1)},${y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`);
  const o=Math.min(1,(best.f-0.12)/0.3).toFixed(2); lead.style.opacity=o; if(call) call.style.opacity=o;
}
/* the figure moves with the page as you scroll (and rests once it's out of sight) */
(()=>{ const tv=$("tv-today"); if(tv) tv.addEventListener("scroll",()=>{ if(typeof RDH!=="undefined"&&RDH.on) rdScroll(); },{passive:true}); })();

/* the "Weak link" label points at the weak muscle on the flat figure (when there's no 3D) */
function uiPlaceCallout(){
  const hero=document.querySelector(".u-rkhero"), call=$("uRkCall"), p=hero&&hero.querySelector(".rk-p.hl");
  if(!hero||!call) return;
  if(!p){ call.hidden=true; return; }
  requestAnimationFrame(()=>{ const hr=hero.getBoundingClientRect(), r=p.getBoundingClientRect(); if(!r.width){ call.hidden=true; return; }
    const y=r.top+r.height/2-hr.top, x=r.right-hr.left;
    call.style.top=(y-14).toFixed(0)+"px"; call.style.left=(x+4).toFixed(0)+"px"; call.style.setProperty("--w",Math.max(16,hr.width-x-call.querySelector("b").offsetWidth-34).toFixed(0)+"px"); });
}
function uiWireTodayHead(){
  if($("uAvatar")) $("uAvatar").onclick=()=>{ Pulse.buzz(8); setTab("you"); };
  if($("uStreak")) $("uStreak").onclick=()=>{ Pulse.buzz(8); track("streak_open"); openStreak(false); };
}
function uiWaterAdd(d){
  S.water=S.water||{}; const k=dkey(0), n=Math.max(0,Math.min(16,(S.water[k]||0)+d)); S.water[k]=n;
  const c=todayCheck(); if(c) c.water=n; save(); Pulse.buzz(d>0?[8,40,12]:6); track("water",{n}); return n;
}
function uiQuick(k){
  Pulse.buzz(8); track("home_open",{k});
  /* the water shows in your body on the Body page for a few seconds (19 Oct: the 3D page and its water pill are gone) */
  if(k==="water"){ setTab("today"); setTimeout(()=>{ try{ rdWaterPeek(4500,false); }catch(e){} },reduced?0:450); return; }
  if(k==="breathe"){ uiGo("breathe"); return; }
  if(k==="ranks"){ openRanks(); return; }
  if(k==="posture"){ const l=psLast(); if(l) psView(l); else psOpen({from:"home"}); return; }
  if(k==="age"){ openBodyCheck(bcLast()?"results":undefined); return; }
}
function uiWeekHTML(){
  const d0=new Date(); d0.setDate(d0.getDate()-todayIdx);
  return PLAN.map((p,i)=>{ let ds; try{ ds=dayState(i); }catch(e){ ds={lab:p[1],st:""}; } const dt=new Date(d0); dt.setDate(d0.getDate()+i);
    const st=ds.st==="done"?"u-done":i===todayIdx?"u-today":i<todayIdx?"u-past":"";
    return `<button class="u-day ${st}" data-wd="${i}" aria-label="${DAYN[i]} ${dt.getDate()}: ${uiEsc(ds.lab)}${ds.st==="done"?", done":""}"><span>${DN[i].slice(0,1)}</span><b>${ds.st==="done"?UI_IC.check:dt.getDate()}</b><em>${uiEsc(ds.lab)}</em></button>`; }).join("");
}

/* ---------- for you: a lesson, or one quick question that makes your score sharper ---------- */
/* what onboarding no longer asks, asked here instead, one a day, into the same profile keys */
const UI_ASK=[
  {k:"sleepH",pil:"recover",why:"Sharper Recover score",q:"How much do you usually sleep?",o:[["5","5 h or less"],["6","6 h"],["7","7 h"],["8","8 h"],["9","9 h +"]],
    set:v=>{ const h=+v; S.profile.sleepH=h; S.profile.sleep=h<6?"bad":h<7?"ok":h<8?"good":"great"; }},
  {k:"stress",pil:"mind",why:"Sharper Mind score",q:"How stressed have you been lately?",o:[["calm","Pretty calm"],["tense","A bit tense"],["high","Stressed"],["fumes","Running on fumes"]],
    set:v=>{ S.profile.stress=v; }},
  {k:"diet",pil:"fuel",why:"Sharper Fuel score",q:"How do you eat, most days?",o:[["quick","Whatever's quick"],["mix","A bit of everything"],["good","Mostly good"],["dialled","Dialled in"]],
    set:v=>{ S.profile.diet=v; }},
  {k:"sit",pil:"move",why:"Better desk resets",q:"How many hours a day do you sit?",o:[["lt4","Under 4"],["4-6","4 to 6"],["6-8","6 to 8"],["8+","8 or more"]],
    set:v=>{ S.profile.sit=v; }}
];
function uiAskNext(){
  if(!S.body) return null; S.profile=S.profile||{};
  if(S.uAsk&&S.uAsk.d===dkey(0)) return null;   // one a day
  return UI_ASK.find(a=>S.profile[a.k]==null&&!(S.uAskNo||[]).includes(a.k))||null;
}
function uiForYouHTML(){
  const a=uiAskNext();
  if(a) return `<div class="u-section-h"><span class="u-eyebrow">One quick question</span><button class="u-link" id="uAskNo">Not now</button></div>
    <section class="u-card u-ask" style="--c:var(--${a.pil})"><span class="u-eyebrow u-ask-why"><i></i>${a.why}</span><h2 class="u-h2">${a.q}</h2>
      <div class="u-chips">${a.o.map(([v,t])=>`<button class="u-chip" data-ask="${v}">${t}</button>`).join("")}</div></section>`;
  try{ const L=rdTabData("learn"); if(L&&L.title&&L.go) return `<div class="u-section-h"><span class="u-eyebrow">Learn</span></div>
    <button class="u-card u-lesson" id="uLesson"><span class="u-ic" style="--c:var(--fuel)">${UI_IC.explore}</span><span><span class="u-eyebrow">${L.cap}</span><b class="u-h2">${uiEsc(L.title)}</b><small class="u-small">${L.sub}</small></span>${UI_IC.chev}</button>`; }catch(e){}
  return "";
}
function uiWireForYou(b){
  const a=uiAskNext();
  b.querySelectorAll("[data-ask]").forEach(x=>x.onclick=()=>{ if(!a) return; Pulse.buzz([8,40,12]); a.set(x.dataset.ask); S.uAsk={d:dkey(0),k:a.k}; save(); track("ask",{k:a.k,v:x.dataset.ask});
    x.classList.add("on"); setTimeout(()=>{ renderToday(); toast("Thanks. Your plan just got a little sharper."); },reduced?0:380); });
  if($("uAskNo")) $("uAskNo").onclick=()=>{ Pulse.buzz(6); if(a){ S.uAsk={d:dkey(0),k:a.k,skip:true}; save(); } renderToday(); };
  if($("uLesson")) $("uLesson").onclick=()=>{ Pulse.buzz(8); const L=rdTabData("learn"); L.go(); };
}

/* =========================================================
   RECOVER — what's still recovering, today's mobility, aches, resets and wind-down
   ========================================================= */
/* "ready" counts only trained muscles that are recovered and not fading (unexplored ones aren't counted);
   fading muscles get one line of their own under the list, which opens the first of them */
function renderRecover(){
  const b=$("tv-recover"); if(!b) return;
  let rec=[], fad=[], ready=0;
  try{ const st={}; GLORDER.forEach(k=>st[k]=stateOf(k));
    rec=GLORDER.filter(k=>st[k]==="recovering").sort((x,y)=>recoveredPct(x)-recoveredPct(y));
    fad=GLORDER.filter(k=>st[k]==="fading").sort((x,y)=>daysSince(y)-daysSince(x));
    ready=GLORDER.filter(k=>st[k]==="ready").length; }catch(e){ console.warn(e); }
  let fade="";
  if(fad.length){ const nm=uiEsc(fad.slice(0,2).map(k=>MUSCLES[k].name).join(", "))+(fad.length>2?` +${fad.length-2}`:""), d=daysSince(fad[0]);
    const days=fad.length===1?(d>=60?"over 60":d):NEGLECT_DAYS+"+";
    fade=`<button class="u-recfd" data-rm="${fad[0]}" aria-label="${nm}: fading, not trained for ${days} days"><i aria-hidden="true"></i><span><b>${nm}</b><small>Fading · not trained for ${days} days</small></span>${UI_IC.chev}</button>`; }
  const now=`<section class="u-card u-recnow" aria-label="Recovering now">
      <div class="u-recnow-h"><span class="u-eyebrow">Recovering now</span><span class="u-recnow-n"><b style="color:var(--glow)">${ready}</b> ready · <b style="color:var(--amber)">${rec.length}</b> recovering</span></div>
      ${rec.length?`<div class="u-recl">${rec.slice(0,6).map(k=>{ const p=recoveredPct(k), h=hoursLeft(k); return `<button class="u-recr" data-rm="${k}" aria-label="${uiEsc(MUSCLES[k].name)}: ${Math.round(p*100)}% recovered, ready ${leftText(h)}">
          <span class="u-recr-n">${uiEsc(MUSCLES[k].name)}</span><span class="u-bar" style="--c:var(--amber)"><i style="width:${Math.round(p*100)}%"></i></span><em>Ready ${leftText(h)}</em></button>`; }).join("")}</div>
        ${rec.length>6?`<p class="u-small">+${rec.length-6} more, all ready within ${leftText(Math.max(...rec.map(hoursLeft)))}.</p>`:""}`
      :`<p class="u-recnow-ok">Everything's recovered. Train whatever you like.</p>`}
      ${fade}
    </section>`;
  const R=rdTabData("recover");
  const flow=`<div class="u-section-h"><span class="u-eyebrow">Today's reset</span></div>`+uiNextHTML({...R,cap:rec.length?`${rec.length} muscle${rec.length>1?"s":""} recovering`:"Everything's ready"},{goId:"rcGo",art:false});
  const l=psLast(), hs=typeof hOn==="function"&&hOn()&&typeof hSleep==="function"?(()=>{ try{ return hSleep(); }catch(e){ return null; } })():null;
  const rows=[
    uiSoreRowHTML("rcAche"),
    `<button class="u-row" id="rcDesk"><span class="u-ic" style="--c:var(--glow-soft)">${UI_IC.desk}</span><span><b>60-second desk reset</b><small>Four moves for your neck and back</small></span>${UI_IC.chev}</button>`,
    `<button class="u-row" id="rcPs"><span class="u-ic" style="--c:var(--move)">${UI_IC.posture}</span><span><b>Posture scan</b><small>${l?`Last scan ${l.sc}/100`:"Two photos, two minutes"}</small></span>${UI_IC.chev}</button>`,
    `<button class="u-row" id="rcWind"><span class="u-ic" style="--c:var(--mind)">${UI_IC.moon}</span><span><b>Wind-down</b><small>An evening routine for better sleep</small></span>${UI_IC.chev}</button>`
  ];
  b.innerHTML=`<div class="u-screen u-recover">
    <header class="u-top"><div class="u-top-tx"><div class="u-eyebrow">${uiShortDate()}</div><h1 class="u-h1">Recover</h1></div></header>
    ${now}${flow}
    <div class="u-section-h"><span class="u-eyebrow">Look after it</span></div><div class="u-rowcards">${rows.join("")}</div>
    <p class="u-foot">Sharp, numb or spreading pain isn't soreness. See a physio or GP.</p></div>`;
  b.querySelectorAll("[data-rm]").forEach(x=>x.onclick=()=>{ Pulse.buzz(6); rkShow3D(); RKV.on=false; rkSync(); setTimeout(()=>{ try{ openSel({t:"muscle",id:x.dataset.rm},true); }catch(e){} },reduced?0:500); });
  $("rcGo").onclick=()=>{ Pulse.buzz([10,40,14]); track("recover_play"); R.go(); };
  $("rcAche").onclick=uiSoreGo;
  $("rcDesk").onclick=()=>{ Pulse.buzz(8); deskOpen(); };
  $("rcPs").onclick=()=>{ Pulse.buzz(8); if(l) psView(l); else psOpen({from:"recover"}); };
  $("rcWind").onclick=()=>{ Pulse.buzz(8); uiFocusOpen("wind"); };
}
/* the way into Sore spots, on the Body page and Recover (the screen itself is injury.js's vxSoreOpen).
   Until that screen exists the row stays "Something aching?" and opens the ache picker */
function uiSoreRowHTML(id){
  let t="Something aching?", sub="Tap where. Get the likely cause and a 5-minute routine.", lab="";
  if(typeof vxSoreOpen==="function"){
    t="Sore spots";
    let a=[]; try{ a=vxSpots(); }catch(e){}
    if(a.length){ const names=a.slice(0,2).map(f=>{ try{ return vxFlagLabel(f); }catch(e){ return ""; } }).filter(Boolean).join(", ")+(a.length>2?` +${a.length-2}`:"");
      sub=`<em class="u-sore-n">${a.length} flagged</em>${names?` · ${uiEsc(names)}`:""}`; lab=`Sore spots: ${a.length} flagged${names?", "+names:""}`; }
    else sub="Something aching? Flag it, or find the likely cause.";
  }
  return `<button class="u-row" id="${id}"${lab?` aria-label="${uiEsc(lab)}"`:""}><span class="u-ic" style="--c:var(--alert)">${UI_IC.target}</span><span><b>${t}</b><small>${sub}</small></span>${UI_IC.chev}</button>`;
}
function uiSoreGo(){ Pulse.buzz(8); if(typeof vxSoreOpen==="function") vxSoreOpen(); else openRelief(); }

/* =========================================================
   PROFILE — the old You tab, opened from your avatar, with a way back
   ========================================================= */
(()=>{ const _r=renderYou; renderYou=function(){ _r();
  const b=$("tv-you"); if(!b||b.querySelector(".u-backbar")) return;
  b.insertAdjacentHTML("afterbegin",`<div class="u-backbar"><button class="u-back" id="uProfBack" aria-label="Back to Body">‹ Body</button><span class="u-backbar-t">You</span><span></span></div>`);
  $("uProfBack").onclick=()=>{ Pulse.buzz(6); setTab("today"); };
  /* "Your day" (the pieces that left the Body page, 18 Oct) lives on the Profile sub-tab, at the top of its scrolling
     content. Not on Evolve: that hub fills the height that is left and never scrolls (evolve.css), so anything put
     above it squeezed the hub to nothing. */
  const sb=b.querySelector(".seg-body");
  if(sb&&typeof SUB!=="undefined"&&SUB.you==="profile"){
    sb.insertAdjacentHTML("afterbegin",`<section class="u-yday" id="uDay" aria-label="Your day"><div class="u-section-h"><span class="u-eyebrow">Your day</span></div>${uiSafe(uiDayHTML,"")}</section>`);
    try{ uiDayWire($("uDay"),()=>{ const y=b.scrollTop; renderYou(); b.scrollTop=y; }); }catch(e){ console.warn("Ossa: your day",e); }
  }
}; })();

/* =========================================================
   TRAIN — today's session, your week, what's recovered, a quick session for any goal and time,
   your main lifts (train.js), your plan
   ========================================================= */
function rdTrainHub(){
  const el=$("train"), app=$("app"); try{ trainGlowOff(); }catch(e){} app.classList.remove("tplan","tactive","tdone"); app.classList.add("thub");
  const mode=rdtMode(), T=rdtKit(rdTodaySession()), done=doneToday(), act=TR.view==="active", rec=!T.items.length;
  const tCap=act?"Workout in progress":done?"Trained today":rec?"Rest day":`Today · ${estMin(T.items)} min · ${mode==="gym"?"gym":"home"}`;
  const tTitle=act?TR.session.title:rec?"Recovery day":T.title, tSub=act?`Exercise ${TR.ex+1} of ${TR.session.items.length}`:rec?`Mobility · ${estMin(mobilitySession().items)} min`:`${T.items.length} exercises · ${estMin(T.items)} min`;
  const planned=PLAN.filter((p,i)=>{ try{ return sessionForDay(i).items.length>0; }catch(e){ return false; } }).length;
  let wk=0; for(let n=0;n<=todayIdx;n++){ if((S.workouts||[]).some(w=>w.d===dkey(n))) wk++; }
  const hit=GLORDER.filter(k=>weekSets(k)>=1).length, st=uiStreak();
  const next=uiNextHTML({cap:tCap,title:tTitle,sub:tSub,aria:act?"Back to your workout":rec?"Start mobility":done?"Train again":"Start "+tTitle,glow:rec?null:T.items},
    {bone:true,goData:'data-tk="go"',second:`<button class="u-link" data-tk="list">See exercises ›</button>`});
  el.innerHTML=`<div class="u-screen u-train">
    <header class="u-top"><div class="u-top-tx"><div class="u-eyebrow">${uiShortDate()}</div><h1 class="u-h1">Train</h1></div>
      <div class="u-seg u-kit" role="tablist" aria-label="Where you train"><button data-kit="home" role="tab" aria-selected="${mode==="home"}" class="${mode==="home"?"on":""}">Home</button><button data-kit="gym" role="tab" aria-selected="${mode==="gym"}" class="${mode==="gym"?"on":""}">Gym</button></div></header>
    ${next}
    <div class="u-section-h"><span class="u-eyebrow">This week</span><button class="u-link" data-tk="week">Change days ›</button></div>
    <div class="u-week">${uiWeekHTML().replace(/data-wd=/g,"data-tday=")}</div>
    <div class="u-stats">
      <div class="u-stat"><b class="u-num">${wk}<small>/${planned}</small></b><span>sessions</span></div>
      <div class="u-stat"><b class="u-num">${hit}<small>/${GLORDER.length}</small></b><span>muscles hit</span></div>
      <button class="u-stat" data-tk="streak"><b class="u-num">${st.n}</b><span>day streak</span></button></div>
    ${trRecoveryHTML()}
    <div class="u-section-h"><span class="u-eyebrow">Quick session · ${mode==="gym"?"gym":"home"}</span></div>
    <section class="u-card u-quick">
      <div class="u-chips" role="radiogroup" aria-label="Goal">${RD_QG.map(g=>`<button class="u-chip" data-qg="${g.k}" role="radio" aria-checked="${RDT.g===g.k}">${g.n}</button>`).join("")}</div>
      <div class="u-quick-row"><div class="u-seg" role="radiogroup" aria-label="Minutes">${[10,20,30].map(m=>`<button data-qm="${m}" role="radio" aria-checked="${RDT.m===m}" class="${RDT.m===m?"on":""}">${m} min</button>`).join("")}</div>
        <button class="u-play quiet" data-tk="quick" aria-label="Start a quick session">${UI_IC.play}</button></div>
      <p class="u-small" id="tkQs">${rdtQuickLine()}</p></section>
    ${trLiftsHTML()}
    ${typeof densPastHTML==="function"?uiSafe(()=>densPastHTML(4),""):""}
    <div class="u-card u-list">
      <button class="u-row" data-tk="ranks"><span class="u-ic" style="--c:var(--rk-${rankTier(overall())})"><svg viewBox="0 0 24 24"><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/></svg></span><span><b>Muscle ranks</b><small>Overall ${rankOf(overall())} · weak link: ${uiEsc(rkSay(rkWeak()))}</small></span>${UI_IC.chev}</button>
      <button class="u-row" data-tk="gen"><span class="u-ic" style="--c:var(--glow)">${UI_IC.plan}</span><span><b>${S.program?"Your plan":"Build my plan"}</b><small>${S.program?`Week ${progWeek().n} · ${S.program.a.days} days a week`:"A weekly split built around your days and kit"}</small></span>${UI_IC.chev}</button>
      <button class="u-row" data-tk="pick"><span class="u-ic" style="--c:var(--fuel)">${UI_IC.target}</span><span><b>Train something else</b><small>Pick muscles and minutes, get a session</small></span>${UI_IC.chev}</button>
      ${typeof openExercises==="function"?`<button class="u-row" data-tk="ex"><span class="u-ic" style="--c:var(--glow-soft)">${UI_IC.train}</span><span><b>Exercises</b><small>${uiEsc(typeof dxHubLine==="function"?uiSafe(dxHubLine,"Every movement, with what it works"):"Every movement, with what it works")}</small></span>${UI_IC.chev}</button>`:""}
    </div>
  </div>`;
  const today=()=>{ TR.custom=false; TR.day=todayIdx; TR.session=T; };
  el.querySelectorAll("[data-tk]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); const k=b.dataset.tk; Pulse.buzz(k==="go"||k==="quick"?[10,40,14]:8); track("train_hub",{k});
    if(k==="go"){ if(act){ drawTrain(); return; } if(rec){ TR.custom=true; TR.session=mobilitySession(); } else today(); TR.hub=false; startWorkout(); return; }
    if(k==="quick"){ TR.custom=true; TR.session=rdtQuick(RDT.g,RDT.m); TR.hub=false; startWorkout(); return; }
    if(k==="gen"){ openGen(); return; }
    if(k==="week"){ rdtOpenWeek(); return; }
    if(k==="ranks"){ openRanks(); return; }
    if(k==="streak"){ openStreak(false); return; }
    if(k==="pick"){ TR.custom=false; TR.day=todayIdx; TR.hub=false; TR.pick={groups:[],mins:45}; TR.planSel=null; drawTrain(); $("train").scrollTop=0; return; }
    if(k==="ex"){ if(typeof openExercises==="function") openExercises({from:"hub"}); return; }   // Exercises (discover.js)
    TR.custom=false; TR.day=todayIdx; TR.hub=false; drawTrain(); });
  el.querySelectorAll("[data-kit]").forEach(b=>b.onclick=()=>uiSetKit(b.dataset.kit));
  el.querySelectorAll("[data-qg]").forEach(b=>b.onclick=()=>{ RDT.g=b.dataset.qg; Pulse.buzz(5); el.querySelectorAll("[data-qg]").forEach(x=>x.setAttribute("aria-checked",x===b)); $("tkQs").textContent=rdtQuickLine(); });
  el.querySelectorAll("[data-qm]").forEach(b=>b.onclick=()=>{ RDT.m=+b.dataset.qm; Pulse.buzz(5); el.querySelectorAll("[data-qm]").forEach(x=>{ x.classList.toggle("on",x===b); x.setAttribute("aria-checked",x===b); }); $("tkQs").textContent=rdtQuickLine(); });
  el.querySelectorAll("[data-tday]").forEach(b=>b.onclick=()=>{ Pulse.buzz(6); TR.custom=false; TR.day=+b.dataset.tday; TR.hub=false; drawTrain(); });
  trWireHub(el);
  if(typeof densWireHub==="function") uiSafe(()=>densWireHub(el));   // Past sessions (density.js)
  el.scrollTop=0;
}
/* Home or Gym: one switch for the whole app (the Train hub and Exercises). Returns false when nothing changed */
function uiSetKit(kit){
  if((kit!=="home"&&kit!=="gym")||rdtMode()===kit) return false;
  S.trainKit=kit; save(); Pulse.buzz(8);
  toast(kit==="gym"?"Gym: machines, barbells and dumbbells.":"Home: bodyweight only, no kit needed.");
  try{ if($("app").classList.contains("train")&&rdTrainHubOn()) rdTrainHub(); }catch(e){ console.warn(e); }
  return true;
}

/* =========================================================
   PANELS THAT STACK (Ossa 2.0 Phase 2) — every .panel sits at the same z-index, so the last one in #app
   is on top. Opening one panel from another (Exercises → Kinetic chain → Insights, Where your sets went …)
   brings it forward with uiPanelFront, and the back swipe closes only the top one.
   ========================================================= */
/* bring a panel to the front. Moving it resets its scroll, so it only moves when another panel is above it */
function uiPanelFront(p){
  const app=$("app"); if(!p||!app) return p;
  try{ const all=app.querySelectorAll(":scope > .panel"); if(p.parentNode!==app||all[all.length-1]!==p) app.appendChild(p); }catch(e){ console.warn(e); }
  return p;
}
/* call a hook another file may not have yet; a hook that throws never takes the screen down with it */
function uiSafe(f,d){ try{ const v=f(); return v==null?d:v; }catch(e){ console.warn(e); return d; } }
/* the back swipe with two or more panels open: close only the top one when it's one of ours (.u-own).
   Sore spots (injury.js) wraps this and still handles its own back first. */
(()=>{ const _gb=goBack; goBack=function(){
  try{
    const busy=(typeof RDL!=="undefined"&&RDL)||(typeof RV!=="undefined"&&RV)||$("app").classList.contains("timelining");
    const on=busy?[]:[...$("app").querySelectorAll(":scope > .panel.on")];
    if(on.length>=2){ const top=on[on.length-1]; if(top.classList.contains("u-own")){ top.classList.remove("on"); return true; } }
  }catch(e){ console.warn(e); }
  return _gb.apply(this,arguments); }; })();

/* =========================================================
   FIRST RUN — two coach marks instead of a six-step tour
   ========================================================= */
TOUR.splice(0,TOUR.length,
  {t:"urank",eye:"Your body",h:"Every muscle has a rank.",p:"Train a muscle and it climbs from Fragile to Unbreakable, three levels at a time. Tap any muscle to see its rank."},
  {t:"utoday",eye:"Today",h:"One thing to do.",p:"Your session for today. Planned rest days never break your streak. Check in each day and your plan gets sharper.",cta:"Check in now"}
);
function tourRect(t){
  const app=$("app").getBoundingClientRect(), W=app.width, H=app.height, rel=r=>({x:r.left-app.left,y:r.top-app.top,w:r.width,h:r.height});
  const pad=(r,p,rad)=>({x:r.x-p,y:r.y-p,w:r.w+2*p,h:r.h+2*p,r:rad});
  if(t==="urank"){ const e=document.querySelector(".u-rkhero"); if(e) return pad(rel(e.getBoundingClientRect()),4,22); }
  if(t==="utoday"){ const e=$("tdGo")&&$("tdGo").closest(".u-next"); if(e) return pad(rel(e.getBoundingClientRect()),4,22); }
  if(t==="uscore"){ const e=$("tdScore"); if(e) return pad(rel(e.getBoundingClientRect()),6,20); }
  return {x:W/2-40,y:H/2-40,w:80,h:80,r:40};
}
/* startTour lives in guide.js now (19 Oct): the guide that walks the real screens after the intro */

/* after the intro, you land on your body */
(()=>{ const _f=finishOnboarding; finishOnboarding=function(skipped){ _f(skipped);
  /* the voice picked in the intro sets the tone of the dares */
  try{ if(typeof OBD!=="undefined"&&OBD&&(OBD.tone==="drill"||OBD.tone==="coach")){ S.dares=S.dares||{scale:1}; S.dares.tone=OBD.tone; save(); } }catch(e){}
  try{ setTab("today"); if(!RDH.on&&TAB==="today"&&!$("app").classList.contains("train")) rdHomeOn(true); }catch(e){} }; })();

/* boot: open on your body once you have one */
function uiBoot(){
  /* straight onto Home, with no slide from the body screen underneath */
  if(S.body&&!$("app").classList.contains("onboarding")){
    TAB="today";
    try{ renderToday(); }catch(e){ console.warn(e); }
    ["today","recover","explore","you"].forEach(x=>{ const v=$("tv-"+x); if(v){ const on=x==="today"; v.classList.toggle("on",on); v.setAttribute("aria-hidden",!on); } });
    $("app").classList.add("tabbed");
  }
  drawTabs();
  /* your 3D body at the top of the Body page */
  if(S.body&&TAB==="today"&&!$("app").classList.contains("onboarding")) try{ rdHomeOn(true); }catch(e){ console.warn(e); }
}

/* =========================================================
   BODY (3D) — the band under the figure (rdxBuild, the Recovery/Rank switch, the readout, Posture scan and
   Body check) moved to web/ui/band.js on 18 Oct.
   ========================================================= */

/* the licences screen also credits the typeface (Inter, SIL Open Font License 1.1), Ossa 2.0,
   and the weather (MET Norway, CC BY 4.0), Build 9 */
(()=>{ const _o=ossNotices; ossNotices=function(){ _o.apply(this,arguments);
  try{ const btn=$("psX1"); if(btn&&!document.querySelector('[data-oss="inter"]')) btn.insertAdjacentHTML("beforebegin",`<div class="ps-sec" data-oss="inter"><h4>Inter typeface</h4><p class="ps-note">Copyright 2016 The Inter Project Authors (github.com/rsms/inter). Licensed under the SIL Open Font License, Version 1.1. Used for all the text in Ossa.</p><p class="ps-note">The licence is at openfontlicense.org. The font is provided "as is", without warranty of any kind.</p></div>`); }catch(e){}
  try{ const btn=$("psX1"); if(btn&&!document.querySelector('[data-oss="met"]')) btn.insertAdjacentHTML("beforebegin",`<div class="ps-sec" data-oss="met"><h4>Weather</h4><p class="ps-note">Weather data from MET Norway (CC BY 4.0), the Norwegian Meteorological Institute's api.met.no. Ossa shows a short summary of it.</p><p class="ps-note">The licence is at creativecommons.org/licenses/by/4.0.</p></div>`); }catch(e){} }; })();

/* the peek sheet is exactly as tall as what it shows, so "Train this region" never sits under the phone's edge
   (a fixed height clipped it on Android, where long names wrap and the system bar takes room) */
function uiFitPeek(){
  const sh=$("sheet"); if(!sh||sheetState!=="peek") return;
  sh.style.maxHeight="none"; const h=sh.offsetHeight; sh.style.maxHeight="";
  if(h>0) sh.style.setProperty("--peekH",Math.min(h,Math.round(innerHeight*.7))+"px");
}
(()=>{ const _r=renderSheet; renderSheet=function(){ const v=_r.apply(this,arguments); try{ uiFitPeek(); Body.reframe(); }catch(e){} return v; };
  const _s=setSheet; setSheet=function(st){ const v=_s.apply(this,arguments); if(st==="peek") try{ uiFitPeek(); }catch(e){} return v; };
  addEventListener("resize",()=>{ try{ uiFitPeek(); }catch(e){} }); })();

/* Focus opens straight onto its page: no zoom into the head, no bloom (Andrej, 2026-10-16). uiFocusOpen sets
   MIND.tab (one open only) and MIND.next (the view). Other ways into the mind keep the zoom.
   Closing, either way, first leaves the Focus view on show (fcLeave, focus.js: Heartbeat stops, Monk's tick ends). */
(()=>{ const _o=openMind, _c=closeMind;
  openMind=function(){
    const tab=!!MIND.tab; MIND.tab=false;
    if(!tab||MIND.open||$("app").classList.contains("train")) return _o.apply(this,arguments);
    if(TAB!=="body") setTab("body");
    MIND.open=true; MIND.plain=true; MIND.view=MIND.next||"home"; MIND.next=null; MIND.from=null; Pulse.buzz(12);
    if(typeof hideHint==="function") hideHint();
    setSheet("closed"); $("app").classList.add("minding");
    const m=$("mind"); m.classList.add("plain"); renderMind(); m.hidden=false; m.scrollTop=0; m.classList.add("on");   /* straight on, like any other tab */
    try{ drawTabs(); }catch(e){}
  };
  closeMind=function(){
    try{ if(typeof fcLeave==="function") fcLeave(); }catch(e){ console.warn(e); }
    if(!MIND.plain) return _c.apply(this,arguments);
    MIND.plain=false; if(!MIND.open) return; MIND.open=false; MIND.from=null;
    if(typeof rdBrStop==="function") rdBrStop();
    const m=$("mind"); m.classList.remove("on"); m.hidden=true; m.classList.remove("plain");   /* straight off, like any other tab */
    $("app").classList.remove("minding"); refreshWhole();
    try{ drawTabs(); }catch(e){}
  }; })();
