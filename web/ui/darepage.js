/* =========================================================
   DARE PAGE — Ossa 2.0 Phase 6 "Challenge" (package: page). Prefix dp, classes .dp-.
   One job: do today's weather dare. A view in Evolve's #evV panel (view "dare"), opened from the Home
   dare card. It draws engine's drView() and nothing else: the glyph, the eyebrow, the name, the
   conditions (or the amber warn line), the lead, three rows, the safety line, one row of actions and
   the MET Norway credit. Nothing scrolls; the glyph gives way first.
   - dpOpen(o)          openEvolve("dare", {from:"body", …o}), then drRefresh(true) (guarded). Returns the open result
   - dpGlyph(id, why)   our own line drawing for rain/cold/wind/bright/indoor (+ the reason mark)/place:
                        an inline SVG string, aria-hidden, strokes currentColor on --text-2, details --line-3,
                        the indoor reason mark --amber. Rain streaks fall (transform only, still under reduced motion)
   - view "dare"        title: drView().title ("London · 8 °C") · act: the Coach/Drill tone pill → drTone()
                        render: drView(); on localhost, o.mock (a view model) stands in for it
   Actions only call the engine (drAccept, drSkip, drRefresh, drFinish, drRow, drTone); the page redraws
   from the engine's "dare" and "day" events, a Health read ("native" health), coming back to the app ("fg")
   and after every row tap (deferred, only while this view shows, never under an open sheet).
   An accepted outdoor dare in the warn state shows no lead: nothing under "Skip the walk today" pitches it.
   The only timer in the view: a setTimeout(0) hand-off of drCheck out of the render (accepted dares only).
   Never saves, never emits, never fetches. Start-up rule: function declarations only, state on function
   properties, include-time code inside try. No top-level const or let. Tokens only.
   ========================================================= */

function dpLocal(){ try{ return /^(localhost|127\.0\.0\.1)$/.test(location.hostname); }catch(e){ return false; } }
/* the view model: engine's drView(), or on localhost a mock passed as o.mock */
function dpView(o){
  if(o&&o.mock&&typeof o.mock==="object"&&dpLocal()) return o.mock;
  if(typeof drView!=="function") return null;
  try{ const v=drView(); return v&&typeof v==="object"?v:null; }catch(e){ console.warn("Ossa: drView",e); return null; }
}
function dpMock(o){ return !!(o&&o.mock&&typeof o.mock==="object"&&dpLocal()); }

/* open the page (Home card, "See the dare"), then ask the phone for a fresh reading */
function dpOpen(o){
  if(typeof openEvolve!=="function") return false;
  const r=openEvolve("dare",Object.assign({from:"body"},o||{}));
  if(r&&typeof drRefresh==="function"&&!dpMock(o)){
    try{ const p=drRefresh(true); if(p&&typeof p.catch==="function") p.catch(e=>console.warn("Ossa: dare refresh",e)); }catch(e){ console.warn("Ossa: dare refresh",e); }
  }
  return r;
}

/* ---------- the glyphs: 120 × 120, our own lines ---------- */
function dpGlyph(id,why){
  const svg=(cls,body)=>`<svg class="dp-g dp-g-${cls}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">${body}</svg>`;
  /* rain streaks in a repeating 16-unit column, clipped by a nested viewport so the loop is seamless */
  const streaks=()=>{ let s=""; for(let y=38;y<=110;y+=16){ [46,74].forEach(x=>{ s+=`M${x} ${y}l-3 9`; }); [60,88].forEach(x=>{ s+=`M${x} ${y+8}l-3 9`; }); } return s; };
  const cloud=`M40 66H84A13 13 0 0 0 86 40A22 22 0 0 0 44 36A15 15 0 0 0 40 66Z`;
  if(id==="rain") return svg("rain",
    `<path d="${cloud}"/>`+
    `<svg x="26" y="70" width="70" height="40" viewBox="26 70 70 40" overflow="hidden"><g class="dp-fall"><path d="${streaks()}"/></g></svg>`+
    `<path class="dp-d" d="M30 113h16M56 113h24M88 113h4"/>`);
  if(id==="cold") return svg("cold",
    `<path d="M54 74V30a6 6 0 0 1 12 0V74"/><path d="M54 74A13 13 0 1 0 66 74"/>`+
    `<path class="dp-m" d="M60 90V62"/>`+
    `<path class="dp-d" d="M72 34h6M72 44h4M72 54h6M72 64h4"/>`+
    `<g class="dp-drift"><path class="dp-d" d="M14 52q6-6 12 0t12 0M20 66q6-6 12 0t12 0"/></g>`);
  if(id==="wind") return svg("wind",
    `<g class="dp-drift"><path d="M16 46H72a10 10 0 1 0-10-10"/><path d="M16 64H90a11 11 0 1 1-11 11"/><path d="M28 84H62a8 8 0 1 1-8 8"/></g>`+
    `<path class="dp-d" d="M88 40h14M98 54h8M74 102h14"/>`);
  if(id==="bright"){
    let r=""; for(let i=0;i<8;i++){ const a=i*Math.PI/4, c=Math.cos(a), s=Math.sin(a);
      r+=`M${(60+27*c).toFixed(1)} ${(56+27*s).toFixed(1)}L${(60+36*c).toFixed(1)} ${(56+36*s).toFixed(1)}`; }
    return svg("bright",`<circle cx="60" cy="56" r="17"/><g class="dp-spin"><path d="${r}"/></g><path class="dp-d" d="M20 106h80M38 114h44"/>`);
  }
  if(id==="indoor"){
    const mk=({
      thunder:`<path class="dp-r" d="M101 8 91 26h10l-8 16"/>`,
      gust:`<path class="dp-r" d="M84 16h18a5 5 0 1 0-5-5M80 26h28M86 36h14a5 5 0 1 1-5 5"/>`,
      heavy:`<path class="dp-r" d="M90 10l-3 8M100 10l-3 8M110 10l-3 8M85 24l-3 8M95 24l-3 8M105 24l-3 8"/>`,
      snow:`<path class="dp-r" d="M98 10v26M86.7 16.5l22.6 13M86.7 29.5l22.6-13"/>`,
      fog:`<path class="dp-r" d="M82 14h28M86 23h20M82 32h28"/>`,
      hot:`<circle class="dp-r" cx="98" cy="22" r="6"/><path class="dp-r" d="M98 8v4M98 32v4M84 22h4M108 22h4M88.1 12.1l2.8 2.8M105.1 29.1l2.8 2.8M88.1 31.9l2.8-2.8M105.1 14.9l2.8-2.8"/>`,
      dark:`<path class="dp-r" d="M109.2 21.7A12.6 12.6 0 1 1 95.5 8 9.8 9.8 0 0 0 109.2 21.7Z"/>`
    });
    mk.wind=mk.gust; mk.freeze=mk.snow; mk.ice=mk.snow;
    return svg("indoor",
      `<path d="M24 58 60 28l36 30"/><path d="M34 50v50h52V50"/>`+
      `<path class="dp-d" d="M63 100V83a6 6 0 0 1 12 0v17M43 65h11v11H43zM14 100h92"/>`+
      (Object.prototype.hasOwnProperty.call(mk,why)?mk[why]:""));
  }
  if(id==="place") return svg("place",
    `<path d="M60 100S34 72 34 50a26 26 0 0 1 52 0c0 22-26 50-26 50Z"/>`+
    `<circle class="dp-d" cx="60" cy="50" r="9"/>`+
    `<path class="dp-d" d="M86 32h18a6 6 0 0 0 1-12 10 10 0 0 0-19 2 5 5 0 0 0 0 10ZM40 108h40"/>`);
  return "";
}

/* ---------- small helpers ---------- */
function dpTone(){ try{ return S.dares&&S.dares.tone==="drill"?"drill":"coach"; }catch(e){ return "coach"; } }
function dpClock(ms){
  if(typeof ms!=="number"||!isFinite(ms)) return "";
  try{ if(typeof dwClock==="function") return String(dwClock(ms)||""); }catch(e){}
  try{ return new Date(ms).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false}); }catch(e){ return ""; }
}
function dpBuzz(p){ try{ Pulse.buzz(p); }catch(e){} }
/* call an engine action; a promise's failure is logged, never thrown into a click */
function dpRun(f){
  try{ const r=f(); if(r&&typeof r.catch==="function") r.catch(e=>console.warn("Ossa: dare action",e)); return r; }
  catch(e){ console.warn("Ossa: dare action",e); return null; }
}
function dpNotReady(){ try{ toast("That isn't ready yet."); }catch(e){} }

/* ---------- the bar ---------- */
function dpTitle(o){ const v=dpView(o); return v&&v.title?String(v.title):"Weather dare"; }
function dpAct(o){
  if(!dpView(o)) return "";
  const t=dpTone(), n=t==="drill"?"Drill":"Coach";
  return `<button class="dp-tone" id="dpTone" type="button" aria-label="Tone: ${n}. Tap to switch">${n}</button>`;
}

/* ---------- one objective row: a button only when it does something (after Accept, not done) ---------- */
function dpRowHTML(r){
  r=r&&typeof r==="object"?r:{};
  const done=!!r.done, tap=r.tap?String(r.tap):null, t=String(r.t||""), s=String(r.s||""), prog=r.prog?String(r.prog):"";
  const box=`<span class="dp-box${done?" on":""}" role="img" aria-label="${done?"Done":"Not done yet"}">${done&&typeof UI_IC!=="undefined"?UI_IC.check:""}</span>`;
  const tx=`<span class="dp-rt"><b>${uiEsc(t)}</b><small>${uiEsc(s)}</small></span>`;
  const right=prog?`<em class="dp-prog">${uiEsc(prog)}</em>`:tap&&tap!=="tick"&&typeof UI_IC!=="undefined"?UI_IC.chev:"";
  const lab=`${t}${prog?`, ${prog}`:""}${done?", done":tap==="tick"?", tap to tick":""}`;
  const cls=`${done?" dp-done":""}${prog?" dp-pg":""}`;
  return tap?`<button class="dp-row dp-tap${cls}" type="button" data-dp-row="${uiEsc(String(r.id||""))}" aria-label="${uiEsc(lab)}">${box}${tx}${right}</button>`
    :`<div class="dp-row${cls}">${box}${tx}${right}</div>`;
}

/* ---------- the one row of actions, by v.acts ---------- */
function dpActsHTML(v){
  const no=`<button class="u-btn ghost dp-no" type="button" data-dp="no">Not today</button>`;
  const a=String(v.acts||"");
  if(a==="new") return no+`<button class="u-btn lime dp-go" type="button" data-dp="accept">Accept dare</button>`;
  if(a==="pre"){ const c=dpClock(v.from); return no+`<button class="u-btn lime dp-go dp-off" type="button" data-dp="wait" aria-disabled="true">${uiEsc(c?`From ${c}`:"From sunrise")}</button>`; }
  if(a==="stale") return no+`<button class="u-btn lime dp-go" type="button" data-dp="check">Check the forecast</button>`;
  if(a==="busy") return no+`<button class="u-btn lime dp-go dp-off" type="button" data-dp="wait" aria-disabled="true" aria-busy="true">Checking the forecast…</button>`;
  if(a==="yes") return `<button class="u-btn lime dp-go" type="button" data-dp="done">Done</button>`;
  if(a==="warn") return `<button class="u-btn primary dp-go" type="button" data-dp="leave">Leave it for today</button><button class="u-link dp-did" type="button" data-dp="did">I already did it</button>`;
  return `<button class="u-btn primary dp-go" type="button" data-dp="close">Close</button>`;
}

/* ---------- the view ---------- */
function dpRender(b,o,bar){
  o=o||{};
  const v=dpView(o), mock=dpMock(o);
  if(!v){
    b.innerHTML=`<div class="dp dp-none"><p class="dp-none-t">Today's dare isn't a weather dare.</p>
      <div class="dp-acts"><button class="u-btn primary dp-go" type="button" data-dp="close">Close</button></div></div>`;
    dpWire(b,o,null,mock);
    return;
  }
  const st=String(v.st||"new"), rows=Array.isArray(v.rows)?v.rows:[];
  /* done: the page's own line; skipped: the Home card's line ("No problem…" / "Left for today…"), not the dare's pitch.
     warn (an accepted outdoor dare after the forecast turned or it got dark: thunder, ice, freezing, dark, far):
     no lead at all, so nothing under the amber "Skip the walk today" line still pitches the walk. The glyph takes
     the room. The nofresh caution (acts "yes") keeps the lead: the dare still stands there */
  const lead=st==="done"?"Every box ticked. A new dare tomorrow.":st==="no"&&v.card&&v.card.line?String(v.card.line):String(v.lead||"");
  const hold=v.acts==="warn";
  const line=v.warn?`<p class="dp-warn" role="status">${uiEsc(String(v.warn))}</p>`:`<p class="dp-cond">${uiEsc(String(v.cond||""))}</p>`;
  const foot=v.reward?`<p class="dp-foot"><i class="dp-hex" aria-hidden="true"></i><span>${uiEsc(String(v.reward))}</span></p>`:"";
  b.innerHTML=`<div class="dp dp-${uiEsc(st)}" data-kind="${uiEsc(String(v.id||""))}">
    <div class="dp-art">${uiSafe(()=>dpGlyph(String(v.glyph||v.id||""),v.why==null?"":String(v.why)),"")}</div>
    <p class="u-eyebrow dp-eye">${uiEsc(String(v.eye||"Weather dare"))}</p>
    <h2 class="dp-h">${uiEsc(String(v.name||"Weather dare"))}</h2>
    ${line}
    ${hold?"":`<p class="dp-lead">${uiEsc(lead)}</p>`}
    <div class="u-card dp-card">${rows.length===3?`<p class="u-eyebrow dp-card-eye">Three things</p>`:""}<div class="dp-rows">${rows.map(dpRowHTML).join("")}</div>${foot}</div>
    <p class="dp-safe">${uiEsc(String(v.safety||""))}</p>
    <div class="dp-acts" aria-live="polite">${dpActsHTML(v)}</div>
    <p class="dp-credit">${uiEsc(String(v.credit||"Weather data from MET Norway"))}</p>
  </div>`;
  dpWire(b,o,v,mock);
  /* the rows that tick themselves: let the engine look once the render has returned (accepted dares only) */
  if(!mock&&st==="yes"&&typeof drCheck==="function"&&Date.now()-(dpRender.ck||0)>1000){
    dpRender.ck=Date.now();
    setTimeout(()=>{ try{ drCheck(); }catch(e){ console.warn("Ossa: drCheck",e); } },0);
  }
}
function dpWire(b,o,v,mock){
  const tone=$("dpTone");
  if(tone) tone.onclick=()=>{ dpBuzz(5);
    if(mock){ try{ S.dares=S.dares||{}; S.dares.tone=dpTone()==="drill"?"coach":"drill"; }catch(e){} evRefresh(); return; }
    if(typeof drTone==="function") dpRun(()=>drTone()); else dpNotReady(); };
  /* a row tap can change a count without finishing the row ("0 of 2" → "1 of 2"), and the engine emits only when a
     row latches done: redraw once the tap has run, whatever it returned */
  b.querySelectorAll("[data-dp-row]").forEach(x=>x.onclick=()=>{ dpBuzz(6);
    if(mock) return;
    if(typeof drRow!=="function"){ dpNotReady(); return; }
    Promise.resolve(dpRun(()=>drRow(x.dataset.dpRow))).then(dpLater,dpLater); });
  b.querySelectorAll("[data-dp]").forEach(x=>x.onclick=()=>{
    const k=x.dataset.dp;
    if(k==="wait"){ dpBuzz(4); return; }
    if(k==="close"){ dpBuzz(6); try{ evClose(); }catch(e){ console.warn(e); } return; }
    dpBuzz(k==="accept"||k==="done"||k==="did"?[8,40,12]:6);
    if(mock) return;
    const f={no:typeof drSkip==="function"?()=>drSkip(false):null,
      leave:typeof drSkip==="function"?()=>drSkip(true):null,
      accept:typeof drAccept==="function"?()=>drAccept():null,
      check:typeof drRefresh==="function"?()=>drRefresh(true,{busy:true}):null,
      done:typeof drFinish==="function"?()=>drFinish("button"):null,
      did:typeof drFinish==="function"?()=>drFinish("button"):null}[k];
    if(!f){ dpNotReady(); return; }
    /* an outdoor Accept and "Check the forecast" ask the phone first: say so on the button at once, and
       redraw once the answer is in (the engine's "dare" events normally do; this makes sure nothing stays busy) */
    const asks=k==="check"||(k==="accept"&&v&&v.id!=="indoor");
    if(asks) dpBusyBtn(x);
    const r=dpRun(f);
    if(asks) Promise.resolve(r).then(dpLater,dpLater);
  });
}
function dpBusyBtn(x){
  x.dataset.dp="wait"; x.classList.add("dp-off");
  x.setAttribute("aria-disabled","true"); x.setAttribute("aria-busy","true");
  x.textContent="Checking the forecast…";
}

/* the engine's news: redraw this view when it shows (after the emit, never inside it; never under a sheet).
   The focus stays on the same row, button or tone pill across the redraw (VoiceOver, keyboards) */
function dpLater(){
  clearTimeout(dpLater.t);
  dpLater.t=setTimeout(()=>{ try{
    if(typeof evOn!=="function"||!evOn()||evS().v!=="dare") return;
    if(typeof evSheetOpen==="function"&&evSheetOpen()){ evS().dirty=true; return; }
    const p=$("evV"), f=document.activeElement, d=f&&p&&p.contains(f)&&f.dataset?f.dataset:null;
    const k=!d?null:f.id==="dpTone"?["#dpTone",null]:d.dpRow!=null?["[data-dp-row]",d.dpRow]:d.dp!=null?["[data-dp]",d.dp]:null;
    evRefresh();
    if(k&&p){ const x=[...p.querySelectorAll(k[0])].find(e=>k[1]==null||e.dataset[k[0]==="[data-dp]"?"dp":"dpRow"]===k[1]);
      if(x) x.focus({preventScroll:true}); }
  }catch(e){ console.warn("Ossa: dare page redraw",e); } },0);
}

/* ---------- include time: the view and its listeners (listeners only redraw; none of them emits) ---------- */
(()=>{ try{
  if(typeof evView==="function") evView("dare",{title:dpTitle,act:dpAct,render:dpRender});
  if(typeof vxOn==="function"){
    vxOn("dare",dpLater); vxOn("day",dpLater);
    /* counts the engine reads live but emits nothing for until a row latches: a Health read ("640 of 1,000") and
       coming back to the app. The engine's own deferred drCheck runs first (dares.js registers before this file) */
    vxOn("native",m=>{ if(m&&m.t==="health") dpLater(); });
    vxOn("fg",dpLater);
  }
}catch(e){ console.warn("Ossa: darepage.js",e); } })();
