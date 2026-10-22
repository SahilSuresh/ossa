/* =========================================================
   HEARTBEAT (Ossa 2.0, Phase 3 "Focus"): a lub-dub at your resting heart rate, an estimate.
   Owner: package P4. Prefix beat* (beatAt and beatT are taken in web/ossa.html: don't reuse them).
   Classes .hrt-* (heartbeat.css; .hb- is taken). Included after monk.js, before focus.js.
   Start-up rule: function declarations only, no top-level const or let; state on function
   properties; never redeclare a name that web/ossa.html or another web/ui file declares.
   Design: design/redesign-v2/images/bio_rhythm_sync.png, in Ossa's tokens. Lime is the one Focus
   exception: the heart belongs to the body.

   The Focus view 'beat' (registered with fcView from focus.js, tab bar kept). Back goes to the
   Focus home (the dispatcher's '‹ Focus'). The pill and the heart toggle sit in the screen's own
   header row (#mind .mv-top), shown only while #mind has .hrtv, and are removed on leave.
   Nothing here is live or measured: the phone plays back a stored resting rate as a buzz.

   WHERE THE BPM COMES FROM (beatSrc), first that has a value; every label says "an estimate":
     1 health  Apple Health / Health Connect connected and S.health.rhr (a 7-day average):
               "{HSRC()}, 7-day average · an estimate" (+ " from 3 October" once it is 14+ days old)
     2 check   the body check's resting heart rate, ckNow().rhr: "Counted by you on 17 October ·
               an estimate", or "From your body check ({HSRC()}) on … · an estimate"
     3 last    S.bpm, the last Health read (Health since disconnected): "Last read from {HSRC()} on …"
     4 none    ask: a 30-second count or a typed value (30–200), saved as a body-check result in
               S.bchecks (the same merge as ckSave), so Body age stays in step
   THE LOOP: tap the heart (or the waveform) to start; the choice is remembered in S.mind.ui.beat
   (true: it starts by itself when the screen opens; nothing restarts it on coming back to the app).
   One lub-dub a beat, hapSeq([['medium',0],['light',210]]) timed natively on bridge v2 (Pulse.buzz
   fallback in the preview), scheduled at absolute times from one JS timer (no drift). Tempo is the
   resting rate clamped to 40–110, nothing else (no recovery tempo: it would read as a measurement).
   It stops on leaving the view, closing Focus, the page hidden, the app in the background, or after
   5 minutes (the pill says "Stopped at 5 min"). The screen is kept awake only while it beats (beatAwake).
   Visuals: two cached stills of the chest from halo.js, hlShot('chest') plain and with the lime
   glow and ring, crossfaded with CSS on each beat; the waveform scrolls only while beating. Under
   reduced motion nothing scrolls or flashes (the glow sits still); the haptics still play.
   "Breathe with it": the Breathe tool on Even breath, 2 minutes, starting by itself, RDBR.src='beat'
   (aura.js's rdBrFinish wrapper logs it and gives breathing aura: 6 for a finished 2 minutes, inside
   the 30-a-day breathing cap). The Heartbeat itself earns no aura and writes no log.
   Analytics: track('beat_on',{src}) only; never the bpm.

   API
   beatSrc()        {bpm:int|null, kind:'health'|'check'|'last'|null, label, row, at?:ms, d?:'YYYY-MM-DD'}
                    row is the Focus home's sub-line: "58 bpm resting · an estimate" or
                    "A beat at your resting heart rate"
   beatTempo(bpm?)  the loop's rate, 40–110 (0 with no bpm)
   beatS()          runtime state {on, t0, per, n, tm, end, why:'time'|'bg'|'leave'|'off'|null, cnt, ask}
   beatSeq()        the haptic pattern for one beat (beatSeq.q, one tunable)
   beatStart(auto) / beatStop(why) / beatToggle()   the loop (beatToggle also remembers the choice)
   beatAwake(on)    keep-awake for the Heartbeat only: takes nvAwake only if nothing else holds it,
                    and releases only what it took
   beatSave(v)      a counted or typed rate → today's body-check entry (r.rhr = {lv, bpm, src:'you'})
   beatBreathe()    "Breathe with it"
   beatRender(b,re) / beatLeave()   the view's render and leave, as registered with fcView('beat');
                    re=true is a re-render in place (no auto-start)
   Wraps: healthIn (S.health.rhrAt, the time a read last carried a resting rate; re-renders the
   idle screen). Listens: visibilitychange and vxOn('bg') stop the beat and any count.
   ========================================================= */

/* ---------- state ---------- */
function beatS(){ return beatS.s||(beatS.s={on:false,t0:0,per:1000,n:0,tm:0,end:0,why:null,cnt:null,ask:false}); }
function beatSeq(){ return beatSeq.q||(beatSeq.q=[["medium",0],["light",210]]); }
function beatLen(){ return 5*60e3; }
function beatUi(){ const M=mindState(); if(!M.ui||typeof M.ui!=="object") M.ui={}; return M.ui; }
function beatOk(v){ v=Math.round(+v); return v>=30&&v<=220?v:null; }
function beatDay(ms){ try{ return new Date(ms).toLocaleDateString("en-GB",{day:"numeric",month:"long"}); }catch(e){ return ""; } }
function beatHs(){ try{ return HSRC(); }catch(e){ return "Health"; } }

/* ---------- where the bpm comes from ---------- */
function beatSrc(){
  const H=S.health, hs=beatHs();
  const out=(bpm,kind,label,x)=>Object.assign({bpm,kind,label,row:bpm?`${bpm} bpm resting · an estimate`:"A beat at your resting heart rate"},x||{});
  try{
    const v=H&&hOn()&&beatOk(H.rhr);
    if(v){ const at=+H.rhrAt||+H.at||0, old=at&&Date.now()-at>14*864e5;
      return out(v,"health",`${hs}, 7-day average${old?` from ${beatDay(at)}`:""} · an estimate`,{at:at||null}); }
  }catch(e){}
  try{
    const c=ckNow().rhr, v=c&&beatOk(c.bpm);
    if(v){ const when=ckDate(c.d);
      return out(v,"check",c.src==="health"?`From your body check (${hs}) on ${when} · an estimate`:`Counted by you on ${when} · an estimate`,{d:c.d}); }
  }catch(e){}
  try{
    const v=beatOk(S.bpm);
    if(v){ const at=H?(+H.rhrAt||+H.at||0):0;
      return out(v,"last",`Last read from ${hs}${at?` on ${beatDay(at)}`:""} · an estimate`,{at:at||null}); }
  }catch(e){}
  return out(null,null,"No resting heart rate yet");
}
function beatTempo(bpm){ const v=bpm!=null?+bpm:beatSrc().bpm; return v?Math.max(40,Math.min(110,Math.round(v))):0; }

/* ---------- the screen ---------- */
function beatHere(){ try{ return !!(MIND.open&&MIND.view==="beat"&&!$("mind").hidden&&$("hrt")); }catch(e){ return false; } }
/* the waveform: five beat tiles of a lub-dub (the 3D heart's envelope, ossa.html OBS.beat), not an ECG */
function beatWave(){
  if(beatWave.d) return beatWave.d;
  const g=(t,c,w)=>Math.exp(-Math.pow((t-c)/w,2)), p=[];
  for(let k=0;k<5;k++) for(let i=0;i<=80;i++){
    const t=i/80, y=g(t,.2,.032)-.32*g(t,.255,.026)+.55*g(t,.41,.04)-.12*g(t,.46,.03);
    p.push(`${i||k?"L":"M"}${(k*100+t*100).toFixed(1)} ${(42-30*y).toFixed(1)}`);
  }
  return (beatWave.d=p.join(""));
}
function beatXpLine(){
  try{ if(typeof auPreview==="function"){ const p=auPreview("breath",2); return p.xp>0?`+${p.xp} aura when you finish`:"Today's breathing aura is full"; } }catch(e){}
  return "";
}
function beatRender(b,re){
  b=b||$("mindBody"); if(!b) return;
  const B=beatS(), s=beatSrc(), has=!!s.bpm, ask=!has||B.ask, m=$("mind");
  beatCountStop(); if(B.on) beatStop("leave");
  if(B.why!=="time") B.why=null;
  m.classList.add("hrtv");
  beatHd();
  const hc=!hOn()&&NATIVE&&NATIVE.caps&&NATIVE.caps.health==="ok", hs=esc(beatHs());
  b.innerHTML=`<div class="hrt${ask?" ask":""}${has?"":" none"}" id="hrt">
    <button class="hrt-hero nogl${has?"":" dim"}" id="hrtHero" aria-label="${has?"Feel your resting heart rate as a heartbeat":"No resting heart rate yet"}"${has?"":" disabled"}><i class="hrt-ring" aria-hidden="true"></i><i class="hrt-fb" aria-hidden="true">${UI_IC.heart}</i></button>
    <div class="hrt-read"><div class="hrt-num"><b class="u-num" id="hrtBpm">${has?s.bpm:"–"}</b><em>bpm</em></div>
      <div class="u-eyebrow">Resting heart rate</div>
      <p class="hrt-src" id="hrtSrc">${esc(s.label)}</p>
      ${has&&s.kind!=="health"&&!ask?`<button class="u-link hrt-again" id="hrtAgain">Count it again</button>`:""}</div>
    ${ask?`<div class="hrt-ask" id="hrtAsk">
      <p class="u-small">Sit still for a minute. Then count your pulse at your wrist or neck for 30 seconds and double it.</p>
      <button class="u-btn small block hrt-cnt" id="hrtCnt">Count for 30 seconds</button>
      <div class="hrt-in"><button class="u-icon-btn round" data-hd="-1" aria-label="One less">−</button>
        <label><input id="hrtIn" inputmode="numeric" enterkeyhint="done" maxlength="3" placeholder="${has?s.bpm:70}" aria-label="Beats a minute"><small>beats a minute</small></label>
        <button class="u-icon-btn round" data-hd="1" aria-label="One more">+</button></div>
      <button class="u-btn small block primary" id="hrtSave">Save</button>
      ${hc?`<button class="u-link hrt-hc" id="hrtHC">Connect ${hs}</button>`:""}
      ${has?`<button class="u-link hrt-hc" id="hrtNo">Not now</button>`:""}</div>`:""}
    <button class="hrt-wave" id="hrtWave" aria-pressed="false"${has?"":" disabled"}>
      <span class="hrt-trw"><svg class="hrt-tr" viewBox="0 0 500 60" preserveAspectRatio="none" aria-hidden="true"><path d="${beatWave()}"/></svg></span>
      <em class="hrt-go" id="hrtRate">${has?"Feel it":"Add your rate first"}</em></button>
    <button class="u-btn block hrt-br" id="hrtBr">Breathe with it · 2 min</button>
    <p class="hrt-xp" id="hrtXp">${esc(beatXpLine())}</p>
    <p class="u-foot hrt-foot">An estimate played back as a gentle buzz. Not medical advice.</p>
  </div>`;
  beatPill();
  $("hrtWave").onclick=()=>beatToggle();
  $("hrtHero").onclick=()=>beatToggle();
  $("hrtBr").onclick=()=>beatBreathe();
  if($("hrtAgain")) $("hrtAgain").onclick=()=>{ hap("select"); B.ask=true; beatRender(null,true); const a=$("hrtAsk"); if(a&&a.scrollIntoView) a.scrollIntoView({block:"nearest",behavior:reduced?"auto":"smooth"}); };
  if($("hrtNo")) $("hrtNo").onclick=()=>{ hap("select"); B.ask=false; beatRender(null,true); };
  if($("hrtHC")) $("hrtHC").onclick=()=>{ hap("select"); healthConnect(); };
  if($("hrtCnt")) $("hrtCnt").onclick=()=>beatCount();
  const inp=$("hrtIn");
  if(inp){
    inp.oninput=()=>{ inp.value=inp.value.replace(/\D/g,"").slice(0,3); };
    inp.onkeydown=e=>{ if(e.key==="Enter"){ e.preventDefault(); beatSave(inp.value); } };
    b.querySelectorAll("[data-hd]").forEach(x=>x.onclick=()=>{ hap("select"); const base=inp.value!==""?+inp.value:+(inp.placeholder||70); inp.value=Math.max(30,Math.min(200,base+(+x.dataset.hd))); });
    $("hrtSave").onclick=()=>beatSave(inp.value);
  }
  /* the stills after the first paint (and on a timer too: a background tab may never paint) */
  const tok=beatRender.n=(beatRender.n||0)+1; let done=false;
  const go=()=>{ if(done||beatRender.n!==tok||!beatHere()) return; done=true; beatShots();
    if(!re&&!ask&&beatUi().beat===true&&!B.on) setTimeout(()=>{ if(beatHere()&&!beatS().on&&!beatS().cnt&&!beatS().ask&&!document.hidden) beatStart(true); },400); };   // only on opening the screen
  try{ requestAnimationFrame(()=>setTimeout(go,0)); }catch(e){}
  setTimeout(go,150);
}
/* the pill and the heart toggle, in the screen's header row */
function beatHd(){
  const top=document.querySelector("#mind .mv-top"); if(!top) return;
  let p=$("hrtPill"); if(!p){ p=document.createElement("span"); p.id="hrtPill"; p.className="hrt-pill"; p.setAttribute("role","status"); p.setAttribute("aria-live","polite"); top.appendChild(p); }
  let t=$("hrtTgl"); if(!t){ t=document.createElement("button"); t.id="hrtTgl"; t.className="u-icon-btn round hrt-tgl"; t.innerHTML=UI_IC.heart; top.appendChild(t); }
  t.onclick=()=>beatToggle();
}
function beatPill(){
  const B=beatS(), has=!!beatSrc().bpm, p=$("hrtPill"), t=$("hrtTgl"), w=$("hrtWave"), r=$("hrtRate");
  const txt=B.on?"Heartbeat · on":B.why==="time"?"Stopped at 5 min":"Heartbeat";
  if(p&&p.dataset.v!==txt){ p.dataset.v=txt; p.innerHTML=`<i aria-hidden="true"></i><span>${txt}</span>`; }
  if(p) p.classList.toggle("on",B.on);
  if(t){ t.disabled=!has; t.setAttribute("aria-pressed",String(B.on)); t.setAttribute("aria-label",B.on?"Stop the heartbeat":"Start the heartbeat"); }
  if(w){ w.setAttribute("aria-pressed",String(B.on)); w.setAttribute("aria-label",B.on?"Stop the heartbeat":"Feel your resting heart rate as a heartbeat"); }
  if(r&&has) r.textContent=B.on?`Stop · ${beatTempo()} a minute`:"Feel it";
}
/* the chest: plain, and with the lime heart glow and ring (black PNGs from halo.js, cached there) */
function beatShots(){
  const h=$("hrtHero"); if(!h) return false;
  if(!$("hrtBase")){ h.classList.add("nogl"); return false; }   // the heart alone now (Andrej, 17 Oct: no body picture)
  const w=Math.round(h.clientWidth), hh=Math.round(h.clientHeight);
  const dim=h.classList.contains("dim");   // no rate yet: the plain chest only
  let base=null, glow=null;
  try{ if(typeof hlShot==="function"&&w>=40&&hh>=40){ base=hlShot("chest",{w,h:hh,glow:0}); glow=base&&!dim?hlShot("chest",{w,h:hh,glow:1,ring:0.6}):null; } }catch(e){ console.warn("Ossa: heartbeat still",e); }
  if(!base||(!glow&&!dim)){ h.classList.add("nogl"); return false; }
  h.classList.remove("nogl"); $("hrtBase").src=base; if(glow) $("hrtGlow").src=glow; h.classList.add("ready");
  return true;
}

/* ---------- the loop ---------- */
function beatStart(auto){
  const B=beatS(), s=beatSrc();
  if(B.on||!s.bpm||document.hidden||!beatHere()) return false;
  beatCountStop();
  const now=performance.now();
  B.on=true; B.why=null; B.per=60000/beatTempo(s.bpm); B.n=0; B.t0=now+120; B.end=B.t0+beatLen();
  beatAwake(true);
  const w=$("hrtWave"), h=$("hrtHero");
  if(w){ w.style.setProperty("--per",Math.round(B.per)+"ms"); w.classList.remove("on"); void w.offsetWidth; w.classList.add("on"); }
  if(h) h.classList.add("on");
  beatPill();
  try{ track("beat_on",{src:s.kind}); }catch(e){}   // never the bpm
  clearTimeout(B.tm); B.tm=setTimeout(beatTick,Math.max(0,B.t0-performance.now()));
  return true;
}
function beatTick(){
  const B=beatS(); if(!B.on) return;
  if(document.hidden){ beatStop("bg"); return; }
  if(!beatHere()){ beatStop("leave"); return; }
  const now=performance.now();
  if(now>=B.end){ beatStop("time"); return; }
  hapSeq(beatSeq());
  try{ const h=$("hrtHero"); fxReplay(h&&h.classList.contains("nogl")?h.querySelector(".hrt-fb"):$("hrtGlow"),"go"); }catch(e){}   // a no-op under reduced motion
  B.n++;
  let next=B.t0+B.n*B.per;
  if(next<now-B.per*0.5){ B.n=Math.ceil((now-B.t0)/B.per); next=B.t0+B.n*B.per; }   // a late timer skips beats, never bursts
  B.tm=setTimeout(beatTick,Math.max(0,next-performance.now()));
}
function beatStop(why){
  const B=beatS(); clearTimeout(B.tm); B.tm=0;
  const was=B.on; B.on=false;
  if(was){
    B.why=why||"off";
    try{ if(nvOk()&&NATIVE.caps.haptic) nsend({t:"haptic",seq:[]}); }catch(e){}   // drops a pending dub (App.js clears its sequence)
    beatAwake(false);
  }
  const w=$("hrtWave"), h=$("hrtHero"); if(w) w.classList.remove("on"); if(h) h.classList.remove("on");
  beatPill();
  return was;
}
function beatToggle(){
  const B=beatS(); if(!beatSrc().bpm) return;
  const on=!B.on;
  try{ beatUi().beat=on; save(); }catch(e){}
  hap("select");
  if(on) beatStart(false); else beatStop("off");
}
/* keep the screen on while it beats; only what this screen took is released */
function beatAwake(on){
  try{
    if(typeof nvAwake!=="function") return;
    if(on){ if(beatAwake.mine||nvAwake.on) return; beatAwake.mine=true; Promise.resolve(nvAwake(true,beatLen()+15e3)).catch(()=>{}); }
    else if(beatAwake.mine){ beatAwake.mine=false; Promise.resolve(nvAwake(false)).catch(()=>{}); }
  }catch(e){}
}

/* ---------- no rate yet: count it or type it ---------- */
function beatCount(){
  const B=beatS(), el=$("hrtCnt"); if(!el) return;
  if(B.cnt){ beatCountStop(); el.textContent="Count for 30 seconds"; return; }
  if(B.on) beatStop("off");
  const end=Date.now()+30e3; hap("light");
  const tick=()=>{ const e=$("hrtCnt"); if(!e||!beatS().cnt){ beatCountStop(); return; }
    const left=Math.max(0,Math.ceil((end-Date.now())/1000));
    if(left<=0){ beatCountStop(); e.textContent="Time. Double your count and enter it below."; hap("success"); const i=$("hrtIn"); if(i) i.focus(); return; }
    const t=`${left} s left · tap to stop`; if(e.textContent!==t) e.textContent=t; };
  B.cnt={end,iv:setInterval(tick,250)}; tick();
}
function beatCountStop(){ const B=beatS(); if(B.cnt){ clearInterval(B.cnt.iv); B.cnt=null; } }
function beatSave(v){
  v=Math.round(+v);
  if(!(v>=30&&v<=200)){ toast("That doesn't look right. Count again?"); hap("warning"); return false; }
  const r={lv:ckLevel(ckT("rhr"),v),bpm:v,src:"you"};
  S.bchecks=S.bchecks||[]; const today=dkey(0), last=S.bchecks[S.bchecks.length-1];
  if(last&&last.d===today&&last.r) last.r.rhr=r; else S.bchecks.push({d:today,v:2,r:{rhr:r}});
  if(S.bchecks.length>40) S.bchecks.splice(0,S.bchecks.length-40);
  save(); hap("success"); toast("Saved with your body check.");
  beatS().ask=false;
  if(beatHere()) beatRender(null,true);
  return true;
}

/* ---------- Breathe with it: the Breathe tool, Even breath, 2 minutes ---------- */
function beatBreathe(){
  beatStop("leave"); beatCountStop(); hap("select");
  try{ RDBR.dur=2; RDBR.src="beat"; }catch(e){}
  MIND.autoplay=true;
  mindGo("breath:even");
  setTimeout(()=>{ try{ if(!RDBR.run&&RDBR.src==="beat") RDBR.src=null; }catch(e){} },3000);   // never started: don't tag a later session
}

/* ---------- the view ---------- */
function beatLeave(){
  beatStop("leave"); beatCountStop();
  const B=beatS(); B.ask=false; B.why=null;
  try{ $("mind").classList.remove("hrtv"); }catch(e){}
  ["hrtPill","hrtTgl"].forEach(id=>{ const e=$(id); if(e) e.remove(); });
}
function beatReg(){
  try{ if(typeof fcView==="function") fcView("beat",{render:(b)=>beatRender(b),leave:()=>beatLeave(),full:false}); }
  catch(e){ console.warn("Ossa: heartbeat view",e); }
}

/* ---------- include time ---------- */
/* Health: remember when a read last carried a resting rate (S.health.rhrAt), and refresh the idle screen */
(()=>{ if(typeof healthIn!=="function") return;
  const _h=healthIn;
  healthIn=function(m){
    const r=_h.apply(this,arguments);
    try{
      if(m&&m.ok&&m.rhr&&S.health){ S.health.rhrAt=+m.at||Date.now(); save(); }
      const B=beatS(), a=document.activeElement;
      if(beatHere()&&!B.on&&!B.cnt&&!(a&&a.id==="hrtIn")) beatRender(null,true);
    }catch(e){ console.warn("Ossa: heartbeat",e); }
    return r;
  };
})();
try{
  document.addEventListener("visibilitychange",()=>{ if(document.hidden){ beatStop("bg"); beatCountStop(); } });
  if(typeof vxOn==="function") vxOn("bg",()=>{ beatStop("bg"); beatCountStop(); });
}catch(e){ console.warn("Ossa: heartbeat",e); }
/* register now, and again once every file has run (focus.js comes after this one) */
beatReg(); setTimeout(beatReg,0);
