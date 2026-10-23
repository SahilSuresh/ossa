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
    nvAwake.on=!!(r&&r.ok&&r.on); return r;
  }
  /* browser: the Screen Wake Lock API, best effort */
  try{
    clearTimeout(nvAwake.t);
    if(on){
      if(!navigator.wakeLock) return {ok:false,why:"browser",on:false};
      if(!nvAwake.lock){ nvAwake.lock=await navigator.wakeLock.request("screen");
        nvAwake.lock.addEventListener("release",()=>{ nvAwake.lock=null; nvAwake.on=false; }); }
      nvAwake.t=setTimeout(()=>nvAwake(false),Math.min(+ms||72e5,144e5));
    } else if(nvAwake.lock){ const l=nvAwake.lock; nvAwake.lock=null; await l.release(); }
    nvAwake.on=on&&!!nvAwake.lock; return {ok:true,on:nvAwake.on};
  }catch(e){ nvAwake.on=false; return {ok:false,why:"browser",on:false}; }
}


/* ---------- wiring (once, at include time) ---------- */
vxOn("native",nvRecv);
/* Settings › On your phone: the "Weather dares" row (Phase 6, wxplace.js draws and wires it; always there),
   before the widget previews. The only phoneCard/wirePhone wrapper. */
(()=>{
  const _pc=phoneCard;
  phoneCard=function(){
    const h=_pc.apply(this,arguments);
    try{
      let rows="";
      if(typeof wpRowHTML==="function") rows+=uiSafe(wpRowHTML,"");
      if(!rows) return h;
      return h.includes('<div class="ph-wg">')?h.replace('<div class="ph-wg">',rows+'<div class="ph-wg">'):h.replace(/<\/div>\s*$/,rows+"</div>");
    }catch(e){ console.warn(e); return h; }
  };
  const _wp=wirePhone;
  wirePhone=function(){
    const r=_wp.apply(this,arguments);
    try{ if(typeof wpRowWire==="function") wpRowWire(); }catch(e){ console.warn(e); }
    return r;
  };
})();
