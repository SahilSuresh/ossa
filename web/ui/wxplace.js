/* =========================================================
   WEATHER DARES PAGE — Ossa 2.0 Phase 6 "Challenge" (package: place). Prefix wp, classes .wp-.
   One job: turn weather dares on with a place (approximate location or a typed town), or off.
   A view in Evolve's #evV panel (view "wxplace"), opened from the Home teaser (from:"body") and from
   Settings › On your phone › Weather dares (from:"settings"). Nothing scrolls; the glyph gives way first.
   - wpOpen(o)              openEvolve("wxplace", {from:"body", …o})
   - wpRowHTML() / wpRowWire()   the Settings row, drawn and wired by native.js's phoneCard/wirePhone wrapper
   - wpWhy(why)             the error lines (§4.4)
   States: Off (never answered, off, or a place without coordinates) · the Off page's success (found and
   turned on in this visit: the main button becomes Done) · On (a place with coordinates, or a ?wx= fixture).
   Keyboard mode: while the town field has focus the view gets .wp-kb, which leaves only the eyebrow, the
   field, the status and the privacy line, so the field sits in the top 260 px above the iOS keyboard.
   Writes nothing itself: the place goes through native.js (nvLocate(true) only from a tap, nvTown only in
   the app with bridge v2), the opt-in through the engine's drSetWx. Screen state lives on the open's o.wp,
   never saved. One action at a time, and the user's last answer wins: "Not now" and "Turn weather dares off"
   cut a running one, and a closed page never switches weather dares on behind itself (wpAct … wpGone).
   Redraws on the engine's "dare" event (what "opt" | "wx"), deferred, only while this view
   shows, never under an open sheet or while the field has focus. Never emits, never fetches.
   Start-up rule: function declarations only, state on function properties, include-time code inside try.
   No top-level const or let. Tokens only.
   ========================================================= */

/* ---------- reading the engine (every call guarded: the page works, honestly, without it) ---------- */
function wpEsc(t){ return typeof uiEsc==="function"?uiEsc(t):String(t==null?"":t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
function wpFx(){ try{ return typeof drWxFx==="function"?drWxFx():null; }catch(e){ return null; } }
/* true | false | null (the phone hasn't answered hello yet) */
function wpAvail(){
  try{ if(typeof drWxAvail==="function") return drWxAvail(); }catch(e){ console.warn(e); }
  if(typeof NATIVE==="undefined"||!NATIVE.on) return false;
  if(!NATIVE.caps) return null;
  return !!(NATIVE.caps.v>=2&&NATIVE.caps.wx);
}
function wpState(){
  try{ if(typeof drWxState==="function") return drWxState(); }catch(e){ console.warn(e); }
  const d=typeof S!=="undefined"&&S&&S.dares; return d&&(d.wxOpt==="on"||d.wxOpt==="off")?d.wxOpt:null;
}
function wpHasLL(){
  try{ if(typeof drHasLL==="function") return !!drHasLL(); }catch(e){ console.warn(e); }
  const p=S.wx&&S.wx.place, n=x=>typeof x==="number"&&isFinite(x);
  return !!(p&&n(p.lat)&&n(p.lon));
}
/* weather dares count as on only with a place that has coordinates (a name-only place gives none) */
function wpOn(){ return wpState()==="on"&&wpHasLL(); }
function wpPlace(){
  try{ if(typeof drPlace==="function") return drPlace(); }catch(e){ console.warn(e); }
  const p=S.wx&&S.wx.place; return p?{town:p.town,cc:p.cc,src:p.src}:null;
}
function wpTown(p){ return p&&typeof p.town==="string"?p.town.trim():""; }
function wpHere(){ try{ return typeof drHere==="function"?drHere():null; }catch(e){ console.warn(e); return null; } }
/* "8 °C · Light rain · 10 min ago" from a usable reading, else "" */
function wpReadLine(){
  try{
    if(typeof drReading!=="function"||typeof dwTemp!=="function"||typeof dwSky!=="function") return "";
    const w=drReading(), now=Date.now(); if(!w||w.ok!==true) return "";
    if(typeof dwCheck==="function"&&typeof drKey==="function"&&typeof drCtx==="function"){
      const g=dwCheck(w,now,drKey(),drCtx(now)); if(!g||!g.use) return "";
    } else {
      const n=x=>typeof x==="number"&&isFinite(x), R=typeof dwRules==="function"?dwRules():{showH:6};
      if(!n(w.temp)||!n(w.at)||now<w.at||now-w.at>(R.showH||6)*36e5) return "";
    }
    const sky=dwSky(w.symbol); if(!sky) return "";
    return `${dwTemp(w.temp)} · ${sky}${typeof agoTxt==="function"?` · ${agoTxt(w.at)}`:""}`;
  }catch(e){ console.warn("Ossa: wxplace reading",e); return ""; }
}
function wpWhy(why){
  const W={browser:"Works in the Ossa phone app.","needs-build":"Needs a newer build of Ossa.",
    denied:"Location is off for Ossa in Settings. You can type a town instead.",
    off:"Location services are off on this phone. You can type a town instead.",
    timeout:"That took too long. Try again.","not-found":"Couldn't find that town.",
    offline:"No connection. Try again when you're online.",empty:"Type a town first.",
    "needs-permission":"This phone looks towns up only with location allowed."};
  return W[String(why||"")]||"Something went wrong. Try again.";
}

/* ---------- open, and the Settings row ---------- */
function wpOpen(o){
  if(typeof openEvolve!=="function"){ try{ toast("That isn't ready yet."); }catch(e){} return false; }
  return openEvolve("wxplace",Object.assign({from:"body"},o||{}));
}
/* Settings › On your phone: "Weather dares", one line of state, On / Off. Never a temperature (so no credit) */
function wpRowHTML(){
  try{
    const fx=wpFx(), av=wpAvail(), p=wpPlace(), town=wpTown(p)||"Near you";
    let sub="", val="";
    if(fx){ sub=`${town} · preview`; val="On"; }
    else if(av===false) sub=typeof NATIVE!=="undefined"&&NATIVE.on?"Needs a newer build of Ossa":"Works in the Ossa phone app";
    else if(wpOn()){ const h=wpHere(); val="On";
      sub=h&&!h.ok&&h.why==="gps"?`${town} · out of date`:h&&!h.ok&&h.why==="zone"?`${town} · far from here`
        :`${town} · ${p&&p.src==="gps"?"approximate location":"typed"}`; }
    else { sub="A rainy or cold day can pick your dare"; val="Off"; }
    return `<button class="yu-row" id="phWx"><span>Weather dares<small>${wpEsc(sub)}</small></span><em>${val}</em></button>`;
  }catch(e){ console.warn("Ossa: wxplace row",e); return ""; }
}
function wpRowWire(){
  const b=typeof $==="function"?$("phWx"):null;
  if(b) b.onclick=()=>{ try{ Pulse.buzz(6); }catch(e){} wpOpen({from:"settings"}); };
}

/* ---------- screen state: on this open's o (evRefresh keeps it; a new open starts clean) ---------- */
function wpSt(o){
  o=o||{};
  return o.wp||(o.wp={mode:null,busy:"",act:null,msg:null,news:null,field:false,q:"",dirty:false,blurT:0});
}
function wpMine(o){ try{ return typeof evOn==="function"&&evOn()&&evS().v==="wxplace"&&evS().o===o; }catch(e){ return false; } }
function wpRedraw(o){
  if(!wpMine(o)) return;
  try{ if(typeof evSheetOpen==="function"&&evSheetOpen()){ evS().dirty=true; return; } }catch(e){}
  try{ evRefresh(); }catch(e){ console.warn(e); }
}
/* Settings underneath catches up */
function wpYou(){ try{ if(typeof TAB!=="undefined"&&TAB==="you"&&typeof renderYou==="function") renderYou(); }catch(e){ console.warn(e); } }
function wpBuzz(p){ try{ Pulse.buzz(p||6); }catch(e){} }

/* ---------- drawing ---------- */
function wpArt(){ const g=typeof dpGlyph==="function"?(typeof uiSafe==="function"?uiSafe(()=>dpGlyph("place"),""):""):""; return `<div class="wp-art" aria-hidden="true">${g}</div>`; }
/* the status line: busy, an error (amber) or a success (lime); kept even when empty on the Off page so nothing jumps */
function wpMsgHTML(st,keep){
  const m=st.msg;
  if(!m) return keep?`<p class="wp-st wp-keep" role="status" aria-live="polite"></p>`:"";
  return `<p class="wp-st wp-keep${m.t==="err"?" err":m.t==="ok"?" ok":""}" role="status" aria-live="polite"${m.t==="busy"?' aria-busy="true"':""}>${wpEsc(m.s)}</p>`;
}
/* after a place was found: the success line, today's swap, and "far from here" */
function wpNewsHTML(st,skipZone){
  const n=st.news; if(!n) return "";
  return `<p class="wp-st ok" role="status" aria-live="polite">${wpEsc(n.ok)}</p>`+
    (n.changed?`<p class="wp-st wp-chg">Today's dare is a weather dare now.</p>`:"")+
    (n.zone&&!skipZone?`<p class="wp-st err">That's far from here. Weather dares follow your own area.</p>`:"");
}
function wpFieldHTML(st){
  return `<span class="u-eyebrow wp-eye wp-keep">Type your town</span>
    <div class="wp-frow wp-keep"><label class="wp-field"><input id="wpIn" type="text" placeholder="Type your town" autocomplete="off" autocapitalize="words" autocorrect="off" spellcheck="false" enterkeyhint="done" maxlength="80" aria-label="Type your town" value="${wpEsc(st.q)}"></label>
      <button class="u-btn wp-save" id="wpSave"${st.busy?' aria-disabled="true"':""}>Save</button></div>`;
}
function wpPriv(cls){ return `<p class="wp-priv wp-keep${cls?" "+cls:""}">Only your rounded spot goes to MET Norway, for the forecast.</p>`; }
function wpBody(){ return `<p class="wp-p">A rainy, cold or windy day can turn your life dare into a short walk. Not when the forecast shows thunder, ice, strong wind or heat, or after dark.</p>`; }

function wpOffHTML(st){
  /* success: found and turned on in this visit; the main button becomes Done */
  if(st.news&&wpOn()) return `${wpArt()}<h2 class="wp-h">Let the weather dare you</h2>${wpBody()}
    <div class="wp-news">${wpNewsHTML(st)}</div>
    <button class="u-btn primary block wp-main" id="wpDone">Done</button>${wpPriv()}`;
  return `${wpArt()}<h2 class="wp-h">Let the weather dare you</h2>${wpBody()}
    <button class="u-btn primary block wp-main" id="wpLoc"${st.busy?' aria-disabled="true"':""}>Use my location</button>
    <p class="wp-hint">Approximate, about 1 km. Your phone asks first.</p>
    <p class="wp-or" aria-hidden="true">or</p>
    ${wpFieldHTML(st)}${wpMsgHTML(st,true)}${wpPriv()}
    <button class="u-link wp-link" id="wpNot">Not now</button>`;
}
function wpOnHTML(st){
  const p=wpPlace(), town=wpTown(p), h=wpHere(), bad=h&&!h.ok&&(h.why==="gps"||h.why==="zone")?h.why:"";
  const chev=typeof UI_IC==="object"&&UI_IC.chev?UI_IC.chev:"";
  let rd="";
  if(bad) rd=`<p class="wp-warn">${bad==="gps"?"Your location is out of date. Tap Use my location.":"That's far from here. Weather dares follow your own area."}</p>`;
  else { const L=wpReadLine(); if(L) rd=`<p class="wp-rd">${wpEsc(L)}</p><p class="wp-cr">Weather data from MET Norway</p>`; }
  return `${wpArt()}<h2 class="wp-h">Weather dares are on</h2>
    <div class="wp-pl"><b>${wpEsc(town||"Near you")}</b><small>${p&&p.src==="gps"?"Approximate location":"Typed"}</small></div>
    ${rd}${wpNewsHTML(st,!!bad)}${st.field?"":wpMsgHTML(st,false)}
    <button class="u-btn primary block wp-main" id="wpDone">Done</button>
    <div class="wp-rows">
      <button class="wp-row" id="wpLoc"${st.busy?' aria-disabled="true"':""}><span><b>Use my location</b><small>Approximate, about 1 km</small></span>${chev}</button>
      ${st.field?"":`<button class="wp-row" id="wpType"><span><b>Type a different town</b></span>${chev}</button>`}
    </div>
    ${st.field?wpFieldHTML(st)+wpMsgHTML(st,false)+wpPriv("wp-kbonly"):""}
    <button class="u-link wp-link" id="wpOff">Turn weather dares off</button>`;
}
function wpRender(b,o){
  const st=wpSt(o);
  /* the mode follows the facts: On needs a place with coordinates; a success stays on the Off page's layout */
  if(!st.mode) st.mode=wpOn()?"on":"off";
  if(st.mode==="on"&&!wpOn()){ st.mode="off"; st.field=false; }
  if(st.mode==="off"&&wpOn()&&!st.news) st.mode="on";
  b.innerHTML=st.mode==="on"?wpOnHTML(st):wpOffHTML(st);
  b.classList.toggle("wp-busy",!!st.busy);
  wpWire(b,o);
}

/* ---------- wiring ---------- */
function wpWire(b,o){
  const st=wpSt(o), q=s=>b.querySelector(s);
  const done=q("#wpDone"); if(done) done.onclick=()=>{ wpBuzz(6); try{ evClose(); }catch(e){} };
  const loc=q("#wpLoc"); if(loc) loc.onclick=()=>{ wpLocate(o).catch(e=>console.warn("Ossa: wxplace locate",e)); };
  const ty=q("#wpType"); if(ty) ty.onclick=()=>{ wpBuzz(6); st.field=true; st.msg=null; wpRedraw(o); const i=$("wpIn"); if(i) try{ i.focus(); }catch(e){} };
  const off=q("#wpOff"); if(off) off.onclick=()=>{ wpTurnOff(o).catch(e=>console.warn("Ossa: wxplace off",e)); };
  const not=q("#wpNot"); if(not) not.onclick=()=>wpNotNow(o);
  const i=q("#wpIn"), sv=q("#wpSave");
  if(i){
    i.addEventListener("input",()=>{ st.q=i.value; });
    i.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); wpSaveTown(o).catch(x=>console.warn("Ossa: wxplace town",x)); } });
    i.addEventListener("focus",()=>{ clearTimeout(st.blurT); b.classList.add("wp-kb"); });
    /* blur restores the layout a moment later, so a tap on Save lands before anything moves */
    i.addEventListener("blur",()=>{ clearTimeout(st.blurT);
      st.blurT=setTimeout(()=>{ if(document.activeElement===i) return; b.classList.remove("wp-kb");
        if(st.dirty){ st.dirty=false; wpRedraw(o); } },200); });
  }
  if(sv){
    sv.addEventListener("mousedown",e=>e.preventDefault());   /* keeps the field focused on a desktop click */
    sv.onclick=()=>{ wpSaveTown(o).catch(x=>console.warn("Ossa: wxplace town",x)); };
  }
}

/* ---------- actions ---------- */
/* the phone answers hello a few seconds after start-up: until then the bridge looks like an old build */
async function wpCaps(){
  try{ if(typeof NATIVE!=="undefined"&&NATIVE.on&&!NATIVE.caps&&typeof nvReady==="function") await nvReady(8000); }catch(e){}
}
/* One action at a time: st.act = {k, cut, was}. The user's last answer wins. "Not now" and "Turn weather
   dares off" cut a running action, so it switches nothing on when it comes back; a page closed with ✕ or
   Done mid-action never asks the phone after that and never switches weather dares on behind itself. */
function wpAct(st,k,s){ const a={k,cut:"",was:wpOn()}; st.act=a; st.busy=k; st.msg={t:"busy",s}; st.news=null; return a; }
function wpActEnd(st,a){ if(st.act===a){ st.act=null; st.busy=""; } }
/* true when an action was running (it is now cut: "not" or "off") */
function wpCut(st,why){ const a=st.act; if(!a) return false; a.cut=why; st.act=null; st.busy=""; st.msg=null; return true; }
/* may this action carry on? Not once it was cut, nor once its page has closed (a new open is another page) */
function wpGo(o,a){ return !a.cut&&wpMine(o); }
/* after an action: a cut one only tidies up, a closed page only says what changed, an open one redraws */
function wpEnd(o,a){
  if(a.cut) wpCutDone(o,a);
  else if(!wpMine(o)) wpGone(a);
  else wpRedraw(o);
  wpYou();
}
/* cut by "Turn weather dares off": the phone may have saved a place since, so forget it again */
function wpCutDone(o,a){
  if(a.cut!=="off") return;
  try{
    if(wpSt(o).act||wpState()!=="off"||typeof S==="undefined"||!S||!S.wx||typeof drSetWx!=="function") return;
    const p=drSetWx(false,{forget:true}); if(p&&typeof p.catch==="function") p.catch(e=>console.warn("Ossa: drSetWx",e));
  }catch(e){ console.warn(e); }
}
/* a closed page switched nothing on; if weather dares are on now all the same (turned on just before the
   page closed, or an "on" that was waiting for coordinates got them), a toast says so */
function wpGone(a){ try{ if(!a.was&&wpOn()) toast("Weather dares are on."); }catch(e){} }

/* a place with coordinates was saved by native.js: turn weather dares on and say what happened */
async function wpTurnOn(o,a){
  const st=wpSt(o), p=wpPlace(), town=wpTown(p), gps=!!(p&&p.src==="gps");
  if(typeof drSetWx!=="function"){ st.msg=null; try{ toast("That isn't ready yet."); }catch(e){} return; }
  let r=null; try{ r=await drSetWx(true); }catch(e){ console.warn("Ossa: drSetWx",e); }
  if(!wpGo(o,a)) return;                                   /* cut or closed while the forecast loaded: wpEnd */
  const h=wpHere();
  st.news={ok:!town?"Found you. Weather dares are on.":gps?`Found you: ${town}. Weather dares are on.`:`Found ${town}. Weather dares are on.`,
    changed:!!(r&&r.changed), zone:!!(h&&!h.ok&&h.why==="zone")};
  st.msg=null; st.field=false; st.q="";
  try{ hap("success"); }catch(e){}
}
async function wpLocate(o){
  const st=wpSt(o); if(st.busy) return;
  wpBuzz(6);
  const a=wpAct(st,"loc","Finding you…"); wpRedraw(o);
  try{
    await wpCaps();
    if(wpGo(o,a)){                                         /* never asks the phone after "Not now" or a close */
      let r=null; try{ r=await nvLocate(true); }catch(e){ console.warn(e); r={ok:false,why:"error"}; }
      if(wpGo(o,a)){
        if(r&&r.ok&&wpHasLL()) await wpTurnOn(o,a);
        else st.msg={t:"err",s:wpWhy(r&&r.ok?"error":r&&r.why)};
      }
    }
  } finally { wpActEnd(st,a); }
  wpEnd(o,a);
}
async function wpSaveTown(o){
  const st=wpSt(o); if(st.busy) return;
  const i=$("wpIn"), q=i?i.value:st.q; st.q=q;
  wpBuzz(6);
  if(!String(q||"").trim()){ st.msg={t:"err",s:wpWhy("empty")}; wpRedraw(o); return; }
  const a=wpAct(st,"town","Looking it up…");
  if(i) try{ i.blur(); }catch(e){}
  wpRedraw(o);
  try{
    await wpCaps();
    if(wpGo(o,a)){
      /* the browser and older builds can't look a town up: never let them replace a working place with a name */
      const app=typeof NATIVE!=="undefined"&&NATIVE.on, v2=typeof nvOk==="function"&&nvOk();
      let r=null;
      if(!app||!v2) r={ok:false,why:app?"needs-build":"browser"};
      else try{ r=await nvTown(q); }catch(e){ console.warn(e); r={ok:false,why:"error"}; }
      if(wpGo(o,a)){
        if(r&&r.ok&&r.saved!=="name"&&wpHasLL()) await wpTurnOn(o,a);
        else if(r&&r.ok&&r.saved==="name") st.msg={t:"err",s:wpWhy(r.why||"needs-permission")};   /* saved by name only: not on */
        else st.msg={t:"err",s:wpWhy(r&&r.ok?"error":r&&r.why)};
      }
    }
  } finally { wpActEnd(st,a); }
  wpEnd(o,a);
}
async function wpTurnOff(o){
  const st=wpSt(o); if(st.busy==="off") return;
  wpBuzz(6);
  if(typeof drSetWx!=="function"){ try{ toast("That isn't ready yet."); }catch(e){} return; }
  wpCut(st,"off");                                         /* the last answer wins over a running action */
  st.busy="off";
  try{ await drSetWx(false,{forget:true}); }catch(e){ console.warn("Ossa: drSetWx",e); }
  finally { st.busy=""; }
  try{ toast("Weather dares off. Your town is forgotten."); }catch(e){}
  st.mode="off"; st.news=null; st.msg=null; st.field=false; st.q="";
  wpRedraw(o); wpYou();
}
/* "Not now": a first answer is remembered as off (the Home teaser stops asking); then close. A running
   action is cut, and an "on" it may already have set (or an "on" still waiting for coordinates) goes off
   too, keeping the place, so "Not now" is the answer that stays */
function wpNotNow(o){
  wpBuzz(6);
  const ran=wpCut(wpSt(o),"not");
  try{
    const v=S.dares&&S.dares.wxOpt, first=v!=="on"&&v!=="off";
    if((first||(ran&&v==="on"))&&typeof drSetWx==="function"){
      const p=drSetWx(false,{forget:false}); if(p&&typeof p.catch==="function") p.catch(e=>console.warn("Ossa: drSetWx",e));
    }
  }catch(e){ console.warn(e); }
  try{ evClose(); }catch(e){}
  wpYou();
}

/* ---------- include time: the view and the engine's news ---------- */
(()=>{ try{
  if(typeof evView==="function") evView("wxplace",{title:"Weather dares",render:(b,o)=>wpRender(b,o)});
  vxOn("dare",m=>{ if(!m||(m.what!=="opt"&&m.what!=="wx")) return;
    setTimeout(()=>{ try{
      if(typeof evOn!=="function"||!evOn()||evS().v!=="wxplace") return;
      if(typeof evSheetOpen==="function"&&evSheetOpen()){ evS().dirty=true; return; }
      const st=wpSt(evS().o), i=$("wpIn");
      if(st.busy) return;                                              /* the action redraws when it ends */
      if(i&&document.activeElement===i){ st.dirty=true; return; }     /* never under the keyboard */
      evRefresh();
    }catch(e){ console.warn("Ossa: wxplace redraw",e); } },0); });
}catch(e){ console.warn("Ossa: wxplace.js",e); } })();
