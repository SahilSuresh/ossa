/* =========================================================
   NATIVE BRIDGE v2, page side (Ossa 2.0 Build 9). Included straight after vessel.js, so every
   later file can call hap(), nvWeather() and the rest.
   Rules: function declarations only, state on function properties, no top-level const or let
   (the start-up rule in docs/UI-SYSTEM.md). No colours here. Never pass a town or coordinates
   to track(): it carries the user id.

   Page → native (nsend):  haptic{style|seq}  keepAwake{id,on,ms?}  locate{id,ask}  geocode{id,q}  weather{id,lat,lon}
   Native → page (nrecv):  bg{at}  fg{at,from,away}  location{id,…}  geocode{id,q,…}  weather{id,…}  keepAwake{id?,ok,on}
   Every request with an id gets exactly one reply, errors included. NATIVE.caps.v is 2 once App.js
   speaks this version; older builds (and the browser preview) get the fallbacks below.

   API
   hap(style)            "select" | "light" | "medium" | "heavy" | "soft" | "rigid" | "success" | "warning" | "error"
   hapSeq([[style,gapMs],…])   up to 8 steps, each gap 0–2000 ms after the previous one (e.g. a heartbeat)
   nvLocate(ask) → Promise     approximate place from the phone (2 decimals), saved in S.wx.place
   nvTown(q)     → Promise     a typed town; in the browser only its name is saved
   nvWeather(force) → Promise  MET Norway summary for S.wx.place, cached for max(1 h, Expires)
   nvAwake(on, ms) → Promise   keep the screen on (own tag, released after ms, 2 h by default)
   nvCheck()                   the hidden "Phone check" test panel (Settings row, ossa://phonecheck)
   vxOn("bg", m)               the app went to the background (m.at is the phone's time); NATIVE.bgAt
   ========================================================= */

/* ---------- core: ask and answer ---------- */
function nvOk(){ return !!(typeof NATIVE!=="undefined"&&NATIVE.on&&NATIVE.caps&&NATIVE.caps.v>=2); }
function nvNum(x){ return typeof x==="number"&&isFinite(x); }
function nvR2(x){ return Math.round(x*100)/100; }
/* send m with a fresh id; resolves with the reply, or {ok:false, why:"timeout"} after ms */
function nvAsk(m,ms){
  const w=nvAsk.w||(nvAsk.w={});
  /* ids start somewhere random, so a late reply meant for a page from before a reload can't answer this one */
  if(!nvAsk.n) nvAsk.n=1+Math.floor(Math.random()*1e9);
  const id=++nvAsk.n, want={locate:"location"}[m.t]||m.t;
  return new Promise(res=>{
    w[id]={f:res,t:want};
    nsend(Object.assign({},m,{id}));
    setTimeout(()=>{ if(w[id]&&w[id].f===res){ delete w[id]; res({ok:false,why:"timeout"}); } },ms||15000);
  });
}
/* every native message passes here (vessel.js emits "native" for each one) */
function nvRecv(m){
  if(!m||!m.t) return;
  const w=nvAsk.w||{};
  if(m.id!=null&&w[m.id]&&w[m.id].t===m.t){ const f=w[m.id].f, r=Object.assign({},m); delete w[m.id]; delete r.t; delete r.id; try{ f(r); }catch(e){ console.warn(e); } }
  if(m.t==="bg"){ NATIVE.bgAt=nvNum(m.at)?m.at:Date.now(); nvRecv.bg=m; vxEmit("bg",m); }
  else if(m.t==="fg") nvRecv.fg=m;
  else if(m.t==="keepAwake"&&m.id==null) nvAwake.on=!!m.on;           /* released by the phone's timer */
  if(/^(bg|fg|caps|keepAwake)$/.test(m.t)) nvCheckSoon();
}

/* ---------- haptics ---------- */
function hap(style){
  try{
    const s=String(style||"light");
    if(nvOk()&&NATIVE.caps.haptic){ nsend({t:"haptic",style:s}); return; }
    /* preview and older builds: a vibration length the old buzz mapping turns into the nearest feel */
    const F={select:6,soft:8,light:10,rigid:12,medium:14,heavy:20,success:[10,40,14],warning:[14,60,14],error:[20,40,20,40,20]};
    Pulse.buzz(F[s]!=null?F[s]:10);
  }catch(e){}
}
function hapSeq(seq){
  try{
    const s=(Array.isArray(seq)?seq:[]).slice(0,8).map(x=>Array.isArray(x)?[String(x[0]||"light"),Math.max(0,Math.min(2000,+x[1]||0))]:[String(x||"light"),0]);
    if(!s.length) return;
    if(nvOk()&&NATIVE.caps.haptic){ nsend({t:"haptic",seq:s}); return; }
    let t=0; s.forEach(([st,d])=>{ t+=d; setTimeout(()=>hap(st),t); });
  }catch(e){}
}

/* ---------- place and weather (S.wx: {place, last}; Load demo, Start fresh and Reset keep the place and drop the reading) ---------- */
function nvWx(){
  if(!S.wx||typeof S.wx!=="object") S.wx={place:null,last:null};
  return S.wx;
}
/* a typed town, tidied: one line, no tags, at most 80 characters, "leeds" → "Leeds" */
function nvTidy(q){
  let s=String(q==null?"":q).replace(/[\u0000-\u001f<>]/g," ").replace(/\s+/g," ").trim().slice(0,80);
  if(s&&s===s.toLowerCase()) s=s.replace(/(^|[\s,'-])([a-z])/g,(a,b,c)=>b+c.toUpperCase());
  return s;
}
function nvPlaceSet(p){ nvWx().place=p; save(); return p; }
async function nvLocate(ask){
  if(!NATIVE.on) return {ok:false,why:"browser"};
  if(!nvOk()) return {ok:false,why:"needs-build"};
  const r=await nvAsk({t:"locate",ask:!!ask},ask?60000:15000);
  if(r&&r.ok&&nvNum(r.lat)&&nvNum(r.lon)){
    nvPlaceSet({town:String(r.town||""),cc:String(r.cc||""),lat:nvR2(r.lat),lon:nvR2(r.lon),src:"gps",approx:r.approx!==false,at:Date.now()});
    if(NATIVE.caps) NATIVE.caps.loc="granted";
  } else if(r&&r.why==="denied"&&NATIVE.caps){
    /* Phase 6: a phone that was never asked answers "denied" with canAsk:true; only a real refusal is "denied" */
    if(r.canAsk===false) NATIVE.caps.loc="denied"; else if(r.canAsk===true) NATIVE.caps.loc="undetermined";
  }
  return r||{ok:false,why:"error"};
}
/* Phase 6: resolves true once the phone has answered hello (NATIVE.caps), false in the browser or after ms
   (8 s by default: caps can take about 6 s, two 3 s status calls on the phone) */
function nvReady(ms){
  return new Promise(res=>{
    try{
      if(typeof NATIVE==="undefined"||!NATIVE.on||NATIVE.caps){ res(!!(typeof NATIVE!=="undefined"&&NATIVE.caps)); return; }
      let done=false, off=null, t=null;
      const fin=v=>{ if(done) return; done=true; clearTimeout(t); try{ if(off) off(); }catch(e){} res(v); };
      off=vxOn("native",m=>{ if(m&&m.t==="caps") fin(true); });
      t=setTimeout(()=>fin(!!NATIVE.caps),+ms>0?+ms:8000);
    }catch(e){ res(!!(typeof NATIVE!=="undefined"&&NATIVE&&NATIVE.caps)); }
  });
}
async function nvTown(q){
  const s=nvTidy(q);
  if(!s) return {ok:false,why:"empty"};
  /* don't trade a working place (with coordinates) for a name-only result (22 Oct, BUG-33) */
  const curP=(()=>{ try{ const w=nvWx(); return w&&w.place; }catch(e){ return null; } })();
  const nameOnly=why=>{
    if(curP&&nvNum(curP.lat)&&nvNum(curP.lon)) return {ok:false,why,saved:"kept",town:curP.town,cc:curP.cc||"",lat:curP.lat,lon:curP.lon};
    const p=nvPlaceSet({town:s,cc:"",lat:null,lon:null,src:"typed",approx:true,at:Date.now()}); return {ok:true,saved:"name",why,town:p.town,cc:"",lat:null,lon:null};
  };
  if(!NATIVE.on) return nameOnly("browser");            /* the preview can't look a town up: keep its name */
  if(!nvOk()) return nameOnly("needs-build");
  const r=await nvAsk({t:"geocode",q:s},20000), h=r&&r.ok&&r.list&&r.list[0];
  if(h&&nvNum(h.lat)&&nvNum(h.lon)){
    const p=nvPlaceSet({town:String(h.town||s),cc:String(h.cc||""),lat:nvR2(h.lat),lon:nvR2(h.lon),src:"typed",approx:true,at:Date.now()});
    return Object.assign({ok:true},p);
  }
  if(r&&r.why==="needs-permission") return nameOnly("needs-permission");   /* Android looks towns up only with location allowed */
  return r||{ok:false,why:"error"};
}
function nvKey(p){ return p.lat.toFixed(2)+","+p.lon.toFixed(2); }
async function nvWeather(force){
  if(!NATIVE.on) return {ok:false,why:"preview"};           /* no live weather in the browser preview */
  const w=nvWx(), p=w.place;
  if(!p||!nvNum(p.lat)||!nvNum(p.lon)) return {ok:false,why:"no-place"};
  if(!nvOk()||!NATIVE.caps.wx) return {ok:false,why:"needs-build"};
  const key=nvKey(p), L=w.last, now=Date.now();
  if(!force&&L&&L.key===key&&now<Math.max((L.at||0)+36e5,L.exp||0)) return Object.assign({},L,{cached:true});
  if(document.hidden) return L&&L.key===key?Object.assign({},L,{stale:true}):{ok:false,why:"background"};
  const r=await nvAsk({t:"weather",lat:p.lat,lon:p.lon},20000);
  if(r&&r.ok){ const c=Object.assign({},r); delete c.t; delete c.id; w.last=c; save(); return c; }
  return r||{ok:false,why:"error"};
}

/* ---------- keep the screen on ---------- */
async function nvAwake(on,ms){
  on=!!on;
  if(NATIVE.on){
    if(!nvOk()||!NATIVE.caps.awake) return {ok:false,why:"needs-build",on:false};
    const r=await nvAsk({t:"keepAwake",on,ms:+ms||0},8000);
    nvAwake.on=!!(r&&r.ok&&r.on); nvCheckSoon(); return r;
  }
  /* browser: the Screen Wake Lock API, best effort */
  try{
    clearTimeout(nvAwake.t);
    if(on){
      if(!navigator.wakeLock) return {ok:false,why:"browser",on:false};
      if(!nvAwake.lock){ nvAwake.lock=await navigator.wakeLock.request("screen");
        nvAwake.lock.addEventListener("release",()=>{ nvAwake.lock=null; nvAwake.on=false; nvCheckSoon(); }); }
      nvAwake.t=setTimeout(()=>nvAwake(false),Math.min(+ms||72e5,144e5));
    } else if(nvAwake.lock){ const l=nvAwake.lock; nvAwake.lock=null; await l.release(); }
    nvAwake.on=on&&!!nvAwake.lock; return {ok:true,on:nvAwake.on};
  }catch(e){ nvAwake.on=false; return {ok:false,why:"browser",on:false}; }
}

/* =========================================================
   PHONE CHECK: a hidden test panel for Build 9 (Expo Go and TestFlight). It asks for location only
   from a tap. Switch it off before Build 10 by setting nvCheck.on=false (the Settings row and
   ossa://phonecheck both go with it).
   ========================================================= */
function nvWhy(why){
  const W={browser:"Works in the Ossa phone app.","needs-build":"Needs a newer build of Ossa.",denied:"Location is off for Ossa. You can type a town instead.",
    off:"Location services are off on this phone.",timeout:"That took too long. Try again.","not-found":"Couldn't find that town.",
    "needs-permission":"This phone looks towns up only with location allowed. Saved the name only.",preview:"No live weather in the preview.",
    "no-place":"Pick a place first (location or a typed town).",offline:"No connection.",background:"Only while Ossa is open.",empty:"Type a town first.",
    "bad-coords":"That place can't be used.","bad-data":"MET Norway sent something unexpected."};
  const w=String(why||"error");
  return W[w]||(/^http-/.test(w)?`MET Norway said no (${w.slice(5)}).`:"Something went wrong.");
}
function nvSky(sym){
  return String(sym||"").replace(/_(day|night|polartwilight)$/,"").replace(/(rain|snow|sleet|showers|thunder|sky|cloudy)/g," $1").replace(/and(?=\s|$)/g," and").replace(/\s+/g," ").trim()||"–";
}
function nvClock(t){ try{ return new Date(t).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",second:"2-digit"}); }catch(e){ return "–"; } }
function nvCheckSoon(){ const p=document.getElementById("nvP"); if(p&&p.classList.contains("on")) nvCheckDraw(); }
function nvCheckDraw(){
  const b=$("nvBody"); if(!b) return;
  const s=nvCheck.s||(nvCheck.s={}), c=NATIVE.caps, app=NATIVE.on, w=(S.wx&&typeof S.wx==="object")?S.wx:{}, p=w.place;
  const inp=$("nvTownIn"), typed=inp?inp.value:"", focused=inp&&document.activeElement===inp;   /* kept across redraws */
  const yn=v=>v?"yes":"no";
  const plat=c?(c.platform==="ios"?"iPhone":c.platform==="android"?"Android":c.platform||"phone"):"";
  const bridge=!app?"Browser preview. Haptics fall back to vibration; there's no live location or weather."
    :!c?"Waiting for the app to answer…"
    :`Bridge v${c.v||1} · ${plat}${c.expoGo?" · Expo Go":""}`;
  const capsLine=app&&c?`Location ${esc(c.loc||"–")} · Keep awake ${yn(c.awake)} · Haptic styles ${yn(c.haptic)} · Weather ${yn(c.wx)}`:"";
  const HS=[["select","Select"],["light","Light"],["medium","Medium"],["heavy","Heavy"],["soft","Soft"],["rigid","Rigid"],["success","Success"],["warning","Warning"],["error","Error"]];
  const place=p?`${esc(p.town||"Unnamed place")}${p.cc?", "+esc(p.cc):""} · ${nvNum(p.lat)?`${p.lat.toFixed(2)}, ${p.lon.toFixed(2)}`:"name only"} · ${p.src==="gps"?"from location":"typed"}${p.src==="gps"&&p.approx?" (approximate)":""}`:"No place yet";
  const locSub=s.loc==="busy"?"Finding you…":s.locR&&!s.locR.ok?esc(nvWhy(s.locR.why)):place;
  const T=s.townR, townSub=s.town==="busy"?"Looking it up…":!T?"":!T.ok?esc(nvWhy(T.why))
    :T.saved!=="name"?`Found ${esc(T.town)}${T.cc?", "+esc(T.cc):""}.`
    :T.why==="needs-permission"?esc(nvWhy(T.why)):T.why==="browser"?"Saved the name only. No live weather in the preview.":"Saved the name only.";
  const R=s.wxR, cur=R&&R.ok?R:null;
  const wxSub=s.wx==="busy"?"Asking MET Norway…":R&&!R.ok?esc(nvWhy(R.why)):cur?`${cur.cached?"Cached":cur.stale?"Stale":"Fresh"} · fetched ${esc(agoTxt(cur.at||Date.now()))}`:"Uses the place above";
  const wxLines=cur?`<p class="yu-p u-small">${cur.temp!=null?cur.temp+"°C":"–"} · ${esc(nvSky(cur.symbol))} · wind ${cur.wind!=null?cur.wind:"–"} m/s${cur.gust!=null?`, gusts ${cur.gust}`:""} · rain ${cur.precip!=null?cur.precip:0} mm · ${cur.thunder?"thunder":"no thunder"}${cur.fog?" · fog":""} · ${cur.dark?"dark":"daylight"}</p>
    <p class="yu-p u-small">Next 3 hours: ${esc(nvSky(cur.soon&&cur.soon.symbol))} · gusts ${cur.soon&&cur.soon.gust!=null?cur.soon.gust:"–"} m/s · rain ${cur.soon?cur.soon.precip:0} mm${cur.soon&&cur.soon.thunder?" · thunder":""}</p>
    <p class="yu-p u-small">${cur.polar?(cur.polar==="day"?"Sun up all day":"Sun down all day"):`Sunrise ${nvClock(cur.rise)} · sunset ${nvClock(cur.set)}`}</p>`:"";
  const bg=nvRecv.bg, fg=nvRecv.fg;
  const life=`${bg?`Last background ${nvClock(bg.at)}`:"No background yet"} · ${fg?`last back ${nvClock(fg.at||Date.now())}${fg.from?` from ${esc(fg.from)}`:""}${fg.away?`, away ${(fg.away/1000).toFixed(1)} s`:""}`:"no return yet"}`;
  b.innerHTML=`<div class="td-card"><div class="eyebrow">Bridge</div><p class="yu-p u-small">${esc(bridge)}</p>${capsLine?`<p class="yu-p u-small">${capsLine}</p>`:""}${typeof bxGlLine==="function"?`<p class="yu-p u-small">${uiEsc(uiSafe(bxGlLine,""))}</p>`:""}</div>
    <div class="td-card"><div class="eyebrow">Haptics</div><p class="yu-p u-small">Each one should feel different.${s.hap?` Last: ${esc(s.hap)}.`:""}</p>
      <div class="u-chips yu-p">${HS.map(([k,l])=>`<button class="u-chip" data-nvh="${k}">${l}</button>`).join("")}<button class="u-chip" data-nvh="beat">Heartbeat</button></div></div>
    <div class="td-card"><div class="eyebrow">Screen</div>
      <button class="yu-row" data-nva aria-pressed="${!!nvAwake.on}"><span>Keep the screen on<small>${s.awR&&!s.awR.ok?esc(nvWhy(s.awR.why)):"Released after 2 hours, or when you turn it off"}</small></span><em>${nvAwake.on?"On":"Off"}</em></button></div>
    <div class="td-card"><div class="eyebrow">Place</div>
      <button class="yu-row" data-nvl><span>Use my location<small>${locSub}</small></span><em>›</em></button>
      <div class="yu-p" style="display:flex;gap:var(--sp-2);align-items:center"><label class="sbox"><input id="nvTownIn" type="text" placeholder="Type your town" autocomplete="off" autocapitalize="words" maxlength="80" aria-label="Type your town"></label><button class="u-btn small" data-nvt>Save</button></div>
      ${townSub?`<p class="yu-p u-small">${townSub}</p>`:""}</div>
    <div class="td-card"><div class="eyebrow">Weather</div>
      <button class="yu-row" data-nvw><span>Get weather<small>${wxSub}</small></span><em>›</em></button>
      ${wxLines}<p class="yu-p u-small">Weather data from MET Norway (CC BY 4.0).</p></div>
    <div class="td-card"><div class="eyebrow">Leaving and coming back</div><p class="yu-p u-small">${life}</p></div>
    <p class="tv-foot">A test panel for Build 9. It goes before Build 10.</p>`;
  const i2=$("nvTownIn"); if(i2&&typed){ i2.value=typed; if(focused) i2.focus(); }
}
async function nvCheckTap(e){
  const t=e.target.closest("[data-nvh],[data-nva],[data-nvl],[data-nvt],[data-nvw]"); if(!t) return;
  const s=nvCheck.s||(nvCheck.s={});
  if(t.dataset.nvh){ const k=t.dataset.nvh; s.hap=k==="beat"?"Heartbeat":k;
    if(k==="beat") hapSeq([["rigid",0],["soft",120]]); else hap(k);
    nvCheckDraw(); return; }
  if(t.hasAttribute("data-nva")){ Pulse.buzz(6); s.awR=await nvAwake(!nvAwake.on); nvCheckDraw(); return; }
  if(t.hasAttribute("data-nvl")){ if(s.loc==="busy") return; Pulse.buzz(6); s.loc="busy"; s.locR=null; nvCheckDraw();
    try{ s.locR=await nvLocate(true); }finally{ s.loc=""; } nvCheckDraw(); return; }
  if(t.hasAttribute("data-nvt")){ nvCheckTown(); return; }
  if(t.hasAttribute("data-nvw")){ if(s.wx==="busy") return; Pulse.buzz(6); s.wx="busy"; nvCheckDraw();
    try{ s.wxR=await nvWeather(false); }finally{ s.wx=""; } nvCheckDraw(); }
}
async function nvCheckTown(){
  const s=nvCheck.s||(nvCheck.s={}), i=$("nvTownIn"); if(!i||s.town==="busy") return;
  Pulse.buzz(6); s.town="busy"; const q=i.value; nvCheckDraw();
  try{ s.townR=await nvTown(q); }finally{ s.town=""; } nvCheckDraw();
}
function nvCheck(){
  if(!nvCheck.on) return;
  let p=$("nvP");
  if(!p){
    p=document.createElement("section"); p.className="panel u-own"; p.id="nvP"; p.setAttribute("aria-label","Phone check");
    p.innerHTML=`<div class="p-head"><h2>Phone check</h2><button class="u-icon-btn round u-x" id="nvX" aria-label="Close"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></div><div class="p-body" id="nvBody"></div>`;
    $("app").appendChild(p);
    $("nvX").onclick=()=>{ Pulse.buzz(6); p.classList.remove("on"); };
    p.addEventListener("click",e=>{ nvCheckTap(e).catch(x=>console.warn(x)); });
    p.addEventListener("keydown",e=>{ if(e.key==="Enter"&&e.target&&e.target.id==="nvTownIn"){ e.preventDefault(); nvCheckTown(); } });
  }
  if(typeof uiPanelFront==="function") uiPanelFront(p);
  nvCheckDraw(); $("nvBody").scrollTop=0;
  requestAnimationFrame(()=>p.classList.add("on"));
}
nvCheck.on=false;  /* off for the App Store (19 Oct): true shows the Phone check panel and the 1-min reset test delay */

/* ---------- wiring (once, at include time) ---------- */
vxOn("native",nvRecv);
vxRoute("phonecheck",()=>{ if(!nvCheck.on) return false; nvCheck(); });
/* Settings › On your phone: the "Weather dares" row (Phase 6, wxplace.js draws and wires it; always there)
   and the "Phone check" row (Build 9 only), before the widget previews. The only phoneCard/wirePhone wrapper. */
(()=>{
  const _pc=phoneCard;
  phoneCard=function(){
    const h=_pc.apply(this,arguments);
    try{
      let rows="";
      if(typeof wpRowHTML==="function") rows+=uiSafe(wpRowHTML,"");
      if(nvCheck.on) rows+=`<button class="yu-row" id="phCheck"><span>Phone check<small>Test haptics, keep-awake, location and weather</small></span><em>›</em></button>`;
      if(!rows) return h;
      return h.includes('<div class="ph-wg">')?h.replace('<div class="ph-wg">',rows+'<div class="ph-wg">'):h.replace(/<\/div>\s*$/,rows+"</div>");
    }catch(e){ console.warn(e); return h; }
  };
  const _wp=wirePhone;
  wirePhone=function(){
    const r=_wp.apply(this,arguments);
    try{ const b=$("phCheck"); if(b) b.onclick=()=>{ Pulse.buzz(6); nvCheck(); };
      if(typeof wpRowWire==="function") wpRowWire(); }catch(e){ console.warn(e); }
    return r;
  };
})();
