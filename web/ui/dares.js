/* =========================================================
   DARES: once a day your body dares you to do one thing. Moved out of ranks.js in Ossa 2.0 Phase 6.
   Start-up rule: function declarations only, state on function properties, no top-level const or let.
   Andrej's rules: it dares a muscle that has started to fade (the one neglect rule in vessel.js:
   untouched for NEGLECT_DAYS, so fully recovered, and never a flagged sore spot), never more than
   about 1.5× what you've logged before; half the dares aren't lifts at all. Coach tone by default, Drill if you switch it on.
   It roasts the neglect, never the person. Saying no costs nothing: no streak loss, no guilt,
   and the next dare is a little smaller.

   WEATHER DARES (Phase 6, prefix dr). On a day with notable weather, and only when the forecast allows,
   today's LIFE dare becomes a short weather dare (kind "wx": rain, cold, wind, bright, or "indoor" on a
   day that's too rough or too dark to be out). One dare a day, at most one swap, and only before you
   touch the dare. The rules and the words live in wxgate.js (dw*, pure, checked by
   scripts/check-dares.js); this file only glues them to S, the phone and the screens.
   - S.dares.wxOpt "on"|"off"|undefined is the opt-in; S.wx {place, last} is native.js's; cur.seen is the
     reading a dare was picked on (never a town or coordinates).
   - Readings come only from nvWeather (drWx). Every draw reads the cached reading; nothing renders
     while waiting on the network. Accepting an outdoor dare forces a fresh re-summary on the phone
     ("Checking the forecast…") and needs it under 30 min old on a fetch under an hour old.
   - Events: vxEmit("dare",{what,st,kind,id}), what = check|wx|accept|skip|tick|done|tone|opt. Emitted only
     from actions, drRefresh and deferred listeners, after saving; never from dareToday, drApply,
     drView or a render.
   - Wrappers (the only ones here): addWater, rdWaterLog (ossa.html), uiWaterAdd (shell.js): each calls
     the original, returns its value, then defers drCheck.
   - Preview (localhost only): ?wx=<fixture> | ?wx=ask, &src=gps, ?steps=N (docs/UI-SYSTEM.md).
   ========================================================= */
function dareLife(){ return dareLife.L||(dareLife.L=[
  {id:"cold",ic:"drop",t:s=>`Finish your shower with ${Math.max(20,Math.round(60*s/10)*10)} seconds of cold water`,coach:"It wakes you up better than coffee. Probably.",drill:"Cold water. No negotiating with the tap."},
  {id:"steps",ic:"pulse",t:s=>`${(Math.round(10000*s/500)*500).toLocaleString("en-GB")} steps before the day's out`,coach:"A walk counts. So does pacing on a call.",drill:"Your legs have been on a sofa sabbatical. End it."},
  {id:"phone",ic:"recover",t:s=>`Phone down by ${s<0.9?"10:30":"10"} tonight`,coach:"Your sleep will thank you tomorrow.",drill:"The feed will still be there. Your sleep won't."},
  {id:"protein",ic:"bolt",t:s=>`${Math.max(20,Math.round(40*s/5)*5)} g of protein before noon`,coach:"Eggs, yoghurt or a shake all get you there.",drill:"Breakfast is not a coffee. Feed the muscle."},
  {id:"mob",ic:"posture",t:s=>`${Math.max(3,Math.round(6*s))} minutes of hip mobility before bed`,coach:"Easy moves. Your lower back will notice.",drill:"Your hips are stiffer than your excuses. Six minutes.",go:"mob"}
]); }
function dareRand(seed){ let h=2166136261; for(const c of seed){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return ((h>>>0)%10000)/10000; }
function dareMuscle(){
  /* fading: "fading" already means untouched for NEGLECT_DAYS, not recovering and not flagged */
  const ks=GLORDER.filter(k=>{ let st=""; try{ st=stateOf(k); }catch(e){} return st==="fading"&&(S.scores[k]||0)>0&&MUSCLES[k].ex&&MUSCLES[k].ex.length; });
  if(!ks.length) return null;
  return ks.sort((a,b)=>daysSince(b)-daysSince(a)||(S.scores[a]-S.scores[b]))[0];
}
/* the dare mix: half lifts, any life dare, unless a provider changes it (Phase 5: your path), through
   vxOn("dareMix",()=>({lift?:0..1, life?:[dareLife() ids]})). A change applies from tomorrow (today's dare is cached) */
function rkDareMix(){ const m={lift:0.5,life:null}; vxHooks("dareMix").forEach(f=>{ try{ const x=f(); if(x){ if(x.lift>=0&&x.lift<=1) m.lift=x.lift; if(Array.isArray(x.life)&&x.life.length) m.life=x.life; } }catch(e){ console.warn(e); } }); return m; }
/* the lift a muscle is dared: its first exercise counted in reps. A carry ("40 m") or a hold ("20 s", "max hold")
   can't be "3 × 10" (BUG-30), so it's skipped; a muscle with only those gets no lift dare that day */
function drLiftEx(k){
  const L=(MUSCLES[k]&&Array.isArray(MUSCLES[k].ex))?MUSCLES[k].ex:[];
  const e=L.find(x=>Array.isArray(x)&&x[0]&&!/\d\s*s\b|max hold|\d\s*m\b/i.test(String(x[1]||"")));
  return e?e[0]:null;
}
function dareToday(){
  S.dares=S.dares||{scale:1,tone:"coach"};
  const D=S.dares, day=dkey(0), now=Date.now(), fxn=drFxName();
  let life=false;
  if(D.cur&&D.cur.d===day){
    const c=D.cur;
    /* preview: a new dare picks again when the ?wx= fixture changes */
    const refx=!!fxn&&c.st==="new"&&c.fx!==fxn;
    if(!refx){
      /* you flagged the dared muscle after the dare came: today's dare becomes one that isn't a lift
         (a sore spot gets no dares). A dare you've done or turned down stays as it is. */
      if(!(c.kind==="lift"&&(c.st==="new"||c.st==="yes")&&rkFlagged(c.k))){
        /* the weather may still change a new dare (the only allowed changes are in drApply) */
        let r=null; try{ r=drApply(drReading(),now); }catch(e){ console.warn("Ossa: dares",e); }
        if(r&&r.save) save();
        return D.cur;
      }
      life=true;
    }
  }
  const r=dareRand(day+(S.name||"")), sc=Math.max(0.5,Math.min(1,D.scale||1)), M=rkDareMix();
  if(fxn) M.lift=0;                                   // preview: weather dares replace the life half only
  const k=!life&&r<M.lift?dareMuscle():null;  // half the time a muscle (your path can change the mix), if one is due
  const ex=k?drLiftEx(k):null;
  let cur;
  if(k&&ex){
    const hist=(S.lifts||{})[ex]||[], all=hist.flatMap(h=>h.sets||[]);
    const bestR=all.reduce((a,x)=>Math.max(a,x.r||0),0), bestKg=all.reduce((a,x)=>Math.max(a,x.kg||0),0);
    /* never more than 1.5× the reps you've logged, even under 4 */
    const reps=bestR?Math.min(Math.round(bestR*1.5),Math.max(5,Math.round(Math.min(bestR*1.5,bestR+4)*sc))):Math.max(5,Math.round(10*sc)), sets=sc<0.75?2:3;
    cur={d:day,kind:"lift",k,ex,sets,reps,kg:bestKg?Math.round(bestKg*0.8/2.5)*2.5:0,days:daysSince(k),st:"new"};
  } else {
    /* the life dares to pick from: all of them, or the mix a provider asks for (unknown ids dropped) */
    const pool=(M.life||[]).map(id=>dareLife().find(x=>x.id===id)).filter(Boolean), P=pool.length?pool:dareLife();
    const L=P[Math.floor(dareRand(day+"life")*P.length)];
    cur={d:day,kind:"life",id:L.id,st:"new",sc,at:now};
    if(fxn) cur.fx=fxn;
  }
  D.cur=cur;
  try{ drApply(drReading(),now); }catch(e){ console.warn("Ossa: dares",e); }
  save(); return D.cur;
}
function dareText(c){
  const tone=(S.dares&&S.dares.tone)||"coach";
  if(c.kind==="wx"){ const K=drKind(c.id)||{}; return {t:K.name||"Weather dare", why:drLead(c,K,tone)}; }
  if(c.kind==="lift"){ const nm=rkSay(c.k).toLowerCase(), plural=/s$/.test(nm);
    const what=`${c.sets} × ${c.reps} ${c.ex}${c.kg?` at ${fkg(c.kg)} kg`:""}`;
    const ago=c.days>=60?"over two months":`${c.days} days`;
    return {t:what, why:tone==="drill"
      ?`${c.days>=60?"Two months":`${c.days} days`}. Your ${nm} ${plural?"have":"has"} forgotten what work feels like. Remind ${plural?"them":"it"}.`
      :`Your ${nm} ${plural?"haven't":"hasn't"} had any work in ${ago}. Fully recovered and ready.`}; }
  const L=dareLife().find(x=>x.id===c.id)||dareLife()[0];
  return {t:L.t(c.sc||1), why:tone==="drill"?L.drill:L.coach};
}

/* ---------- the Home card ---------- */
function uiDareHTML(){
  try{
    if(!S.body) return "";
    const c=dareToday(), h=c.kind==="wx"?drCardHTML(c):drPlainHTML(c);
    drSoon();
    return h;
  }catch(e){
    try{ if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) console.warn("Ossa: dare card",e); }catch(x){}
    return "";
  }
}
function drToneBtn(){ const t=(S.dares&&S.dares.tone)==="drill"?"Drill":"Coach";
  return `<button class="dare-tone" id="dareTone" aria-label="Tone: ${t}. Tap to switch">${t}</button>`; }
/* life and lift: today's copy and flow (Accept, then Done / Start now), in the new styles */
function drPlainHTML(c){
  const T=dareText(c);
  if(c.st==="done") return `<section class="u-card dare dare-done" aria-label="Today's dare"><span class="u-eyebrow dare-eye">Dare done</span><p class="dare-t">${uiEsc(T.t)}</p><p class="u-small dare-why">${c.kind==="lift"?`Your ${uiEsc(rkSay(c.k).toLowerCase())} noticed.`:"That's one more thing you said you'd do, done."} A new one tomorrow.</p></section>`;
  if(c.st==="no") return `<section class="u-card dare dare-quiet" aria-label="Today's dare"><span class="u-eyebrow">Dare skipped</span><p class="u-small dare-why">No problem. Tomorrow's will be a little smaller.</p></section>`;
  const acc=c.st==="yes", go=c.kind==="lift"||(dareLife().find(x=>x.id===c.id)||{}).go;
  const ask=!acc&&c.kind==="life"&&typeof wpOpen==="function"&&drWxState()===null&&drWxAvail()===true
    ?`<button class="u-link dare-ask" id="dareWxAsk">Let the weather pick some dares ›</button>`:"";
  return `<section class="u-card dare" aria-label="Your body dares you">
    <div class="dare-top"><span class="u-eyebrow dare-eye">${acc?"Dare accepted":"Your body dares you"}</span>${drToneBtn()}</div>
    <p class="dare-t">${uiEsc(T.t)}</p><p class="u-small dare-why">${uiEsc(T.why)}</p>
    <div class="dare-acts">${acc
      ?`<button class="u-btn lime" id="dareDone">${UI_IC.check}Done</button>${go?`<button class="u-link" id="dareGo">Start now</button>`:""}`
      :`<button class="u-btn lime" id="dareYes">Accept</button><button class="u-link" id="dareNo">Not today</button>`}</div>${ask}</section>`;
}
/* the weather card: eyebrow and line from drView().card; Accept happens only on the page.
   The tone pill shows only while the dare is new (its line is the toned one; "Dare accepted · 1 of 3 done" needs the width) */
function drCardHTML(c){
  const v=drView(); if(!v) return "";
  const nm=uiEsc(v.name), card=v.card||{eye:"Weather dare",line:""};
  if(c.st==="no") return `<section class="u-card dare dare-quiet dare-wx" aria-label="Today's dare"><span class="u-eyebrow">${uiEsc(card.eye)}</span><p class="u-small dare-why">${uiEsc(card.line)}</p></section>`;
  const done=c.st==="done", warn=c.st==="yes"&&!!v.warn;
  const acts=done?"":c.st==="yes"
    ?`<div class="dare-acts"><button class="u-btn lime" id="dareSee">See the dare</button></div>`
    :`<div class="dare-acts"><button class="u-btn lime" id="dareSee">See the dare</button><button class="u-link" id="dareNo">Not today</button></div>`;
  return `<section class="u-card dare dare-wx${done?" dare-done":""}" id="dareCard" aria-label="Weather dare">
    <div class="dare-top"><span class="u-eyebrow dare-eye">${uiEsc(card.eye)}</span>${c.st==="new"?drToneBtn():""}</div>
    <button class="dare-main" id="dareMain" aria-label="${nm}. Open the weather dare"><span class="dare-t">${nm}</span><span class="dare-line${warn?" dare-warn":""}">${uiEsc(card.line)}</span></button>
    ${acts}</section>`;
}
function uiWireDare(root,redraw){
  uiWireDare.r=redraw;
  const c=S.dares&&S.dares.cur; if(!c) return;
  const on=(id,f)=>{ const el=$(id); if(el) el.onclick=e=>{ if(e) e.stopPropagation(); f(); }; };
  const see=()=>{ try{ Pulse.buzz(8); }catch(e){} if(typeof dpOpen==="function") dpOpen({from:"body"}); else toast("That isn't ready yet."); };
  on("dareYes",()=>{ drAccept(); });
  on("dareNo",()=>{ try{ Pulse.buzz(6); }catch(e){} drSkip(false); });
  on("dareDone",()=>{ try{ Pulse.buzz([12,50,20]); }catch(e){} drFinish("button"); });
  on("dareTone",()=>{ try{ Pulse.buzz(5); }catch(e){} drTone(); });
  on("dareSee",see);
  on("dareMain",see);
  on("dareWxAsk",()=>{ try{ Pulse.buzz(8); }catch(e){} if(typeof wpOpen==="function") wpOpen({from:"body"}); });
  /* the whole weather card (outside its buttons) opens the page too */
  const card=$("dareCard"); if(card&&c.st!=="no") card.onclick=e=>{ if(e&&e.target&&e.target.closest&&e.target.closest("button")) return; see(); };
  on("dareGo",()=>{ try{ Pulse.buzz([10,40,14]); }catch(e){}
    if(c.kind==="lift"){ TR.custom=true; TR.session={title:`Dare · ${rkSay(c.k)}`,items:[mkItem(c.ex,`${c.sets} × ${c.reps}`,c.k)]}; TR.hub=false; setMode("train"); startWorkout(); return; }
    const m=mobilitySession(); rdPlaySession(m,true); });
}

/* ---------- weather dares: state and where the reading comes from ---------- */
/* screen state, never saved. sumAt/sumKey: the last forced reply that came back ok and not stale.
   busy shows "Checking the forecast…" while busyN (the checks a tap is waiting on) is above 0; wxN counts "wx" emits.
   gen moves on every opt-out (fgen: the last one that forgot the place); pg is the gen the running check started under */
function drS(){ return drS.s||(drS.s={soonAt:0,sig:"",busy:false,busyN:0,wxN:0,p:null,pf:false,pg:0,q:null,gen:0,fgen:0,sumAt:null,sumKey:null,brDur:null,homeT:0}); }
function drNum(x){ return typeof x==="number"&&isFinite(x); }
function drLocal(){ try{ return /^(localhost|127\.0\.0\.1)$/.test(String(location.hostname||"")); }catch(e){ return false; } }
/* localhost only: ?wx=<anything> (a fixture name, or "ask") */
function drWxPreview(){ if(!drLocal()) return null; try{ const m=/[?&]wx=([a-z]+)/.exec(String(location.search||"")); return m?m[1]:null; }catch(e){ return null; } }
function drFxName(){ const f=drWxFx(); return f?f.name:null; }
/* the fixture named by ?wx= (with &src=gps applied), built once per page and name. Nothing is saved */
function drWxFx(){
  const n=drWxPreview(); if(!n||typeof dwFixture!=="function"||typeof dwFixtures!=="function") return null;
  let gps=false; try{ gps=/[?&]src=gps\b/.test(String(location.search||"")); }catch(e){}
  const k=n+(gps?"+gps":""), C=drWxFx.c;
  if(C&&C.k===k) return C.v;
  let v=null;
  try{
    if(dwFixtures().indexOf(n)>=0){ const now=Date.now(), f=dwFixture(n,now);
      if(f&&f.place&&f.w){ const place=Object.assign({},f.place); if(gps){ place.src="gps"; if(n!=="gpsold") place.at=now; }
        v={name:n,place,w:f.w}; } }
  }catch(e){ console.warn("Ossa: dares fixture",e); v=null; }
  drWxFx.c={k,v}; return v;
}
/* can weather dares work here? true | false | null (the phone hasn't answered hello yet) */
function drWxAvail(){
  if(drWxPreview()!==null) return true;
  if(typeof dwChoose!=="function") return false;
  if(typeof NATIVE==="undefined"||!NATIVE||!NATIVE.on) return false;
  if(!NATIVE.caps) return null;
  return !!(NATIVE.caps.v>=2&&NATIVE.caps.wx);
}
function drWxState(){
  if(drWxPreview()!==null) return drWxFx()?"on":null;
  const o=S.dares&&S.dares.wxOpt; return o==="on"||o==="off"?o:null;
}
function drHasLL(){ if(drWxFx()) return true; const p=S.wx&&S.wx.place; return !!(p&&drNum(p.lat)&&drNum(p.lon)); }
function drWxOn(){ if(drWxState()!=="on") return false; if(!drHasLL()) return false; return drWxAvail(); }
/* the place, for copy: a town and how it was found, never coordinates */
function drPlace(){ const f=drWxFx(), p=f?f.place:(S.wx&&S.wx.place); if(!p||typeof p!=="object") return null;
  return {town:String(p.town||""),cc:String(p.cc||""),src:p.src==="gps"?"gps":"typed"}; }
function drLL(){ const f=drWxFx(), p=f?f.place:(S.wx&&S.wx.place); return p&&drNum(p.lat)&&drNum(p.lon)?[p.lat,p.lon]:null; }
function drKey(){ const f=drWxFx(); if(f) return typeof f.w.key==="string"?f.w.key:null;
  if(!drHasLL()) return null; try{ return nvKey(S.wx.place); }catch(e){ return null; } }
/* the cached reading for the current place; never fetches */
function drReading(){ const f=drWxFx(); if(f) return f.w; const k=drKey(), L=S.wx&&S.wx.last;
  return k&&L&&typeof L==="object"&&L.key===k?L:null; }
function drCtx(now,m){
  const f=drWxFx(), p=(f?f.place:(S.wx&&S.wx.place))||{}, s=drS();
  let tz=NaN; try{ tz=-new Date(now).getTimezoneOffset(); }catch(e){}
  const c={tz,src:p.src,placeAt:p.at,sumAt:s.sumKey!=null&&s.sumKey===drKey()?s.sumAt:null,m,quiet:true};
  if(f){ c.quiet=false; c.sumAt=now; c.placeAt=f.name==="gpsold"?p.at:now; }
  return c;
}
function drGate(){
  if(typeof dwCheck!=="function"||!drHasLL()) return null;
  const now=Date.now(), c=S.dares&&S.dares.cur;
  try{ return dwCheck(drReading(),now,drKey(),drCtx(now,c&&c.kind==="wx"?c.m:undefined)); }catch(e){ console.warn("Ossa: dares gate",e); return null; }
}
function drHere(){ const ll=drLL(); if(!ll||typeof dwHere!=="function") return null; const now=Date.now();
  try{ const h=dwHere(ll[0],ll[1],now,drCtx(now)); return h?{ok:!!h.ok,why:h.why||null}:null; }catch(e){ return null; } }
/* the light for today's dare, from the place's coordinates (the reading's own sun times when it's usable) */
function drLight(now,g,m){ const ll=drLL(); if(!ll||typeof dwLight!=="function") return null;
  try{ return dwLight(ll[0],ll[1],now,drCtx(now,m),g&&g.use?drReading():null); }catch(e){ return null; } }
/* ask for a reading: the fixture, else the phone (never a page fetch).
   Weather dares turned off while this waits (the gen moved, or they're no longer on): stop before anything reaches
   the phone or MET, and stamp nothing. A silent location refresh that lands after "Turn weather dares off" has
   written the place back (native.js nvPlaceSet): forget it again */
async function drWx(force){
  const f=drWxFx();
  if(f){ if(force) await new Promise(r=>setTimeout(r,700)); return f.w; }   // preview: a forced check takes a moment, as on the phone
  const s=drS(), g0=s.gen||0, off=()=>(drS().gen||0)!==g0||drWxOn()!==true;
  if(typeof nvReady==="function"){ try{ await nvReady(8000); }catch(e){} }
  if(off()) return {ok:false,why:"off"};
  const p=S.wx&&S.wx.place;
  /* a GPS place over 3 h old gets a silent refresh first (never asks) */
  if(p&&p.src==="gps"&&!(drNum(p.at)&&Date.now()-p.at<=3*36e5)){
    try{ await nvLocate(false); }catch(e){}
    if(off()){
      const t=drS();
      if((t.fgen||0)>g0&&S.dares&&S.dares.wxOpt==="off"&&S.wx){ delete S.wx; save(); }
      return {ok:false,why:"off"};
    }
  }
  let r=null; try{ r=await nvWeather(!!force); }catch(e){ r=null; }
  if(!r) r={ok:false,why:"error"};
  if((drS().gen||0)!==g0) return {ok:false,why:"off"};
  if(force&&r.ok&&!r.stale){ const t=drS(); t.sumAt=Date.now(); t.sumKey=r.key; }
  return r;
}

/* ---------- the kinds (copy and rows from the gate's dwKinds) ---------- */
function drKind(id){
  if(typeof dwKinds!=="function") return null;
  let T=null; try{ T=dwKinds(); }catch(e){ return null; }
  const k=T&&T[id]; return k&&typeof k==="object"?k:null;
}
function drFill(s,c){ const m=+c.m||0, h=+c.h||0;
  if(typeof dwFill==="function") return dwFill(s,{m,h,n:m*100});
  return String(s==null?"":s).replace(/\{m\}/g,m).replace(/\{h\}/g,h).replace(/\{n\}/g,(m*100).toLocaleString("en-GB")); }
function drPick2(x,tone){ if(!x) return ""; if(typeof x==="string") return x; if(Array.isArray(x)) return tone==="drill"?(x[1]||x[0]||""):(x[0]||"");
  return tone==="drill"?(x.drill||x.coach||""):(x.coach||x.drill||""); }
function drLead(c,K,tone){
  const dark=c.id==="indoor"&&c.why==="dark", x=dark?(K.dark||K.leadDark||(K.lead&&K.lead.dark)||K.lead):K.lead;
  return drFill(drPick2(x,tone),c);
}
function drDose(id,sc){
  if(id==="indoor") return {m:0};
  if(id==="wind"){ const h=Math.max(3,Math.round(5*sc)); return {m:2*h,h}; }
  const K=drKind(id)||{}; return {m:Math.max(5,Math.round((+K.min||10)*sc))};
}
function drRowDef(K,id){ return ((K&&Array.isArray(K.rows))?K.rows:[]).find(r=>r&&r.id===id)||null; }
/* the rows for a kind at this scale; walk rows get src "steps" only at Accept */
function drRows(id,sc){
  const K=drKind(id), d=drDose(id,sc), rows=(K&&Array.isArray(K.rows))?K.rows:[];
  return rows.map(r=>{
    const walk=r.id==="walk";
    const n=walk?d.m*100:(r.id==="into"||r.id==="back")?(d.h||0):drNum(+r.n)&&+r.n>0?+r.n:(r.id==="water"&&id==="indoor"?2:1);
    return {id:r.id,n,src:walk?null:(r.src==="water"||r.src==="breath"||r.src==="flow"?r.src:null),base:null,done:false};
  });
}

/* ---------- today's allowed changes (the only ones) ---------- */
function drBack(c,now){ const alt=dareLife().some(x=>x.id===c.alt)?c.alt:"steps";
  const b={d:c.d,kind:"life",id:alt,st:"new",sc:c.sc,at:now,wxTry:true}; if(c.fx) b.fx=c.fx; return b; }
function drSeen(w){ return w?{temp:w.temp,symbol:w.symbol,wind:w.wind,gust:w.gust,at:w.at}:null; }
function drMake(c,id,why,w,now,alt){
  const sc=Math.max(0.5,Math.min(1,+c.sc||(S.dares&&S.dares.scale)||1)), d=drDose(id,sc);
  const x={d:c.d,kind:"wx",id,why:id==="indoor"?(why||null):null,alt,sc,m:d.m,st:"new",at:now,acc:null,doneAt:null,free:false,
    seen:drSeen(w),obj:drRows(id,sc),wxTry:true};
  if(d.h) x.h=d.h;
  if(c.fx) x.fx=c.fx;
  return x;
}
/* mutates S.dares.cur only (no save, no emit). Only while today's dare is new; never after Accept,
   Not today or Done; never indoor → outdoor; never a lift */
function drApply(w,now){
  const out={save:false,swap:false}, D=S.dares, c=D&&D.cur;
  if(!c||c.d!==dkey(0)||c.st!=="new") return out;
  if(c.kind==="life"){
    if(c.wxTry||drWxOn()!==true||typeof dwChoose!=="function") return out;
    const ch=dwChoose(w,now,drKey(),drCtx(now,undefined));
    if(!ch||!ch.g||!ch.g.use||!ch.g.fresh) return out;     // wait for a usable, fresh reading
    c.wxTry=true; out.save=true;
    if(ch.id){ D.cur=drMake(c,ch.id,ch.why,w,now,c.id); out.swap=true; }
    return out;
  }
  if(c.kind!=="wx") return out;
  const on=drWxOn();
  if(on===false){ D.cur=drBack(c,now); out.save=out.swap=true; return out; }   // opted out, no coordinates, or no weather here
  if(on!==true||c.id==="indoor"||typeof dwCheck!=="function") return out;      // unknown caps: change nothing
  const g=dwCheck(w,now,drKey(),drCtx(now,c.m));
  if(!g||!g.use) return out;                                                    // stale, absent or malformed: the page says so
  if(!g.safe||g.light==="late"||g.light==="night"){ D.cur=drMake(c,"indoor",g.safe?"dark":g.why,w,now,c.alt); out.save=out.swap=true; return out; }
  if(!g.here){ D.cur=drBack(c,now); out.save=out.swap=true; }                    // the forecast isn't for where you are
  return out;
}

/* ---------- refreshing ---------- */
function drEmit(what){ const c=S.dares&&S.dares.cur;
  if(what==="wx"){ const s=drS(); s.wxN=(s.wxN||0)+1; }
  try{ vxEmit("dare",{what,st:c?c.st:null,kind:c?c.kind:null,id:c?(c.kind==="lift"?c.k:c.id):null}); }catch(e){ console.warn(e); } }
/* what the screens draw: the reading's content and the view's state */
function drSig(){
  try{ const w=drReading(), v=drView(), s=w&&w.soon&&typeof w.soon==="object"?w.soon:{};
    return JSON.stringify([w?[w.temp,w.symbol,w.wind,w.gust,w.precip,w.thunder,w.fog,s.gust,s.wind,s.precip,s.thunder,s.symbol,w.at]:null,
      v?[v.id,v.st,v.acts,v.warn,v.card]:null]); }catch(e){ return ""; }
}
/* one check at a time; a forced one made during a plain one waits for it, then runs. o.busy (a tap: Accept or
   "Check the forecast") shows "Checking the forecast…" for exactly as long as the promise it gets back, whatever
   path ran (drBusy). With the phone still unknown (caps not here yet) a tap waits for hello first; nothing else does */
function drRefresh(force,o){
  o=o||{};
  const on=drWxOn();
  if(on===null&&o.busy&&typeof nvReady==="function"){
    try{ if(typeof document!=="undefined"&&document.hidden) return Promise.resolve(false); }catch(e){}
    return drBusy(Promise.resolve().then(()=>nvReady(8000)).then(()=>drWxOn()===true?drRefresh(force):false));
  }
  if(on!==true) return Promise.resolve(false);
  try{ if(typeof document!=="undefined"&&document.hidden) return Promise.resolve(false); }catch(e){}
  const s=drS();
  let p;
  /* a forced check queues behind a plain one, or behind any check that started before an opt-out (it stops early) */
  if(s.p&&force&&(!s.pf||s.pg!==(s.gen||0))){
    if(!s.q){ const q=s.p.then(()=>0,()=>0).then(()=>{ if(s.q===q) s.q=null; return drRefresh(true); })
        .then(x=>x,e=>{ if(s.q===q) s.q=null; console.warn("Ossa: dares refresh",e); return false; });
      s.q=q; }
    p=s.q;
  } else if(s.p) p=s.p;
  else {
    s.pf=!!force; s.pg=s.gen||0;
    const q=drRun(!!force).then(x=>{ if(s.p===q) s.p=null; return x; },e=>{ if(s.p===q) s.p=null; console.warn("Ossa: dares refresh",e); return false; });
    s.p=q; p=q;
  }
  return o.busy?drBusy(p):p;
}
/* "Checking the forecast…" while p runs: counted, so it ends when the last waiting tap's check ends, on every path.
   When it ends the screens redraw (one "wx" emit, unless the check already sent one) */
function drBusy(p){
  const s=drS(), n0=s.wxN||0;
  s.busyN=(s.busyN||0)+1;
  if(!s.busy){ s.busy=true; drEmit("check"); }
  const end=x=>{ s.busyN=Math.max(0,(s.busyN||0)-1);
    if(!s.busyN&&s.busy){ s.busy=false; if((s.wxN||0)===n0) drEmit("wx"); drHome(); }
    return x; };
  return Promise.resolve(p).then(end,()=>end(false));
}
async function drRun(force){
  const before=drSig(), g0=drS().gen||0;
  await drWx(force);
  /* turned off meanwhile: drSetWx has already settled today's dare, saved, emitted and redrawn */
  if((drS().gen||0)!==g0||drWxState()!=="on") return false;
  const r=drApply(drReading(),Date.now());
  if(r.save) save();
  if(force||r.swap||drSig()!==before){ drEmit("wx"); drHome(); }
  return r.swap;
}
/* after Home draws the card: at most once a minute, out of the render */
function drSoon(){
  const s=drS(), now=Date.now();
  if(s.soonAt&&now-s.soonAt<60000&&now>=s.soonAt) return;
  s.soonAt=now;
  setTimeout(()=>{ try{ drDurBack(); drCheck(); drRefresh(false); }catch(e){ console.warn("Ossa: dares",e); } },0);
}
/* redraw Home through the redraw uiWireDare last got, after this action's listeners have run */
function drHome(){
  const s=drS(); if(s.homeT) return;
  s.homeT=setTimeout(()=>{ s.homeT=0;
    try{ if(typeof TAB!=="undefined"&&TAB==="today"&&typeof uiWireDare.r==="function") uiWireDare.r(); }catch(e){ console.warn("Ossa: dares",e); } },0);
}

/* ---------- the opt-in ---------- */
async function drSetWx(on,o){
  o=o||{}; on=!!on;
  S.dares=S.dares||{scale:1,tone:"coach"};
  const D=S.dares, c=D.cur;
  D.wxOpt=on?"on":"off";
  if(!on){
    /* a check already running stops before it reaches the phone again (drWx, drRun) */
    const s=drS(); s.gen=(s.gen||0)+1;
    if(o.forget!==false){ delete S.wx; s.fgen=s.gen; s.sumAt=null; s.sumKey=null; }
    if(c&&c.kind==="wx"&&c.d===dkey(0)){
      if(c.st==="new") D.cur=drBack(c,Date.now());
      /* with the place gone nothing can warn about the dark or the weather any more: left for today, at no cost */
      else if(c.st==="yes"&&c.id!=="indoor"){ c.st="no"; c.free=true; }
    }
  }
  save();
  const p=drPlace();
  try{ track("dare_wx",{on,src:on&&p?p.src:null}); }catch(e){}
  drEmit("opt"); drHome();
  if(!on) return {changed:false};
  const sw=await drRefresh(true);
  const n=S.dares&&S.dares.cur;
  return {changed:!!sw&&!!n&&n.kind==="wx"};
}

/* ---------- accepting ---------- */
function drCanAccept(){
  const c=S.dares&&S.dares.cur;
  if(!c||c.kind!=="wx"||c.id==="indoor") return {ok:true,why:null};
  const now=Date.now(), g=drGate(), L=drLight(now,g,c.m);
  if(!L) return {ok:false,why:"far"};                  // no coordinates (a town saved by name only): no forecast for where you are
  const light=L.light;
  if(light==="pre") return {ok:false,why:"pre",at:L.from};
  if(light==="late"||light==="night") return {ok:false,why:"late"};
  if(!g||!g.use||!g.fresh) return {ok:false,why:"stale"};
  if(!g.here) return {ok:false,why:"far"};
  if(!g.safe) return {ok:false,why:"unsafe",reason:g.why};
  if(!g.recent) return {ok:false,why:"stale"};
  return {ok:true,why:null};
}
function drRefuse(r){
  if(r.why==="pre") return `It's not light yet. From ${dwClock(r.at)}.`;
  if(r.why==="late") return "It's getting dark. This one waits for tomorrow.";
  if(r.why==="stale") return "Couldn't get a fresh forecast. Try again in a minute.";
  if(r.why==="far") return "This forecast isn't for where you are.";
  /* unsafe: normally the forced check has already switched the page to the indoor dare. If it couldn't
     (the phone hadn't answered hello), the dare is still outdoor: say why, so the tap isn't silent */
  const c=S.dares&&S.dares.cur;
  if(r.why==="unsafe"&&c&&c.kind==="wx"&&c.id!=="indoor"&&r.reason){ try{ return dwWarn(r.reason)||""; }catch(e){ return ""; } }
  return "";
}
/* a weather dare belongs to its day (§8 risk 7). On a screen left open past midnight nothing counts any more:
   say no, and move the screens on to today (vxDayCheck emits "day" only when the day really changed) */
function drOld(c){
  if(!c||c.d===dkey(0)) return false;
  setTimeout(()=>{ try{ if(typeof vxDayCheck==="function") vxDayCheck(); drHome(); }catch(e){ console.warn("Ossa: dares",e); } },0);
  return true;
}
async function drAccept(){
  const D=S.dares, c=D&&D.cur;
  if(!c||c.st!=="new"||drOld(c)) return false;
  let msg="Dare accepted. Tick it off when it's done.";
  if(c.kind==="wx"){
    msg="Dare accepted. Tick them off as you go.";
    if(c.id!=="indoor"){
      if(drS().busy) return false;
      const ref=c, id0=c.id;
      await drRefresh(true,{busy:true});            // a fresh re-summary on the phone, for this hour
      if(S.dares.cur!==ref||ref.id!==id0||ref.st!=="new") return false;   // the dare changed: you decide again
      const r=drCanAccept();
      if(!r.ok){ const t=drRefuse(r); if(t) toast(t); drEmit("wx"); drHome(); return false; }
    }
    c.st="yes"; c.acc=Date.now();
    (c.obj||[]).forEach(o=>{
      if(o.src==="water") o.base=waterToday();
      if(o.id==="walk"&&drStepsOn()){ o.src="steps"; o.n=(+c.m||0)*100; o.base=drStepsNow(); }
    });
    if((c.obj||[]).some(o=>o.src==="steps")){ try{ if(typeof healthPoll==="function") healthPoll(true); }catch(e){} }
  } else { c.st="yes"; c.acc=Date.now(); }
  try{ if(typeof hap==="function") hap("success"); else if(typeof Pulse!=="undefined") Pulse.buzz([8,40,12]); }catch(e){}
  toast(msg);
  save(); track("dare",{st:"yes",kind:c.kind}); drEmit("accept"); drHome();
  return true;
}

/* ---------- progress, read live and latched ---------- */
function drStepsPreview(){ if(!drLocal()) return null; try{ const m=/[?&]steps=(\d+)/.exec(String(location.search||"")); return m?+m[1]:null; }catch(e){ return null; } }
function drStepsOn(){ if(drStepsPreview()!=null) return true;
  try{ return !!(hOn()&&typeof NATIVE!=="undefined"&&NATIVE&&NATIVE.caps&&NATIVE.caps.health==="ok"); }catch(e){ return false; } }
function drStepsNow(){ const p=drStepsPreview(); if(p!=null) return p; try{ const s=hSteps(0); return drNum(s)?s:null; }catch(e){ return null; } }
function drBreathMin(c){ const L=S.mind&&Array.isArray(S.mind.log)?S.mind.log:[];
  return L.reduce((a,e)=>a+(e&&e.k==="breath"&&e.d===c.d&&(e.at==null||+e.at>=(+c.acc||0))?(+e.min||0):0),0); }
function drMet(c,o){
  if(o.src==="steps"){ const s=drStepsNow(); return s!=null&&o.base!=null&&s-o.base>=o.n; }
  if(o.src==="water") return o.base!=null&&waterToday()-o.base>=o.n;
  if(o.src==="breath") return drBreathMin(c)>=o.n;
  if(o.src==="flow") return (Array.isArray(S.workouts)?S.workouts:[]).some(w=>w&&w.d===c.d&&w.kind==="mobility"&&+w.end>=(+c.acc||0));
  return false;
}
/* re-read the rows that tick themselves; a done row stays done; the last one finishes the dare */
function drCheck(){
  const D=S.dares, c=D&&D.cur;
  if(!c||c.kind!=="wx"||c.st!=="yes"||c.d!==dkey(0)||!Array.isArray(c.obj)) return false;
  let ch=false;
  c.obj.forEach(o=>{
    if(o.done) return;
    if((o.src==="steps"||o.src==="water")&&o.base==null){                       // the first reading after Accept is the base
      const b=o.src==="steps"?drStepsNow():waterToday(); if(b!=null){ o.base=b; ch=true; } return; }
    if(drMet(c,o)){ o.done=true; ch=true; }
  });
  if(!ch) return false;
  if(c.obj.every(o=>o.done)) return drFinish("auto");
  save(); drEmit("tick"); drHome(); return true;
}
function drRow(id){
  const c=S.dares&&S.dares.cur;
  if(!c||c.kind!=="wx"||c.st!=="yes"||!Array.isArray(c.obj)||drOld(c)) return false;   // rows ticked after midnight don't count
  const o=c.obj.find(x=>x.id===id); if(!o) return false;
  const R=drRowDef(drKind(c.id),id)||{}, go=R.go||null;
  if(go==="breath"&&!o.done){ drBreathe(); return true; }
  if(go==="flow"&&!o.done){ try{ if(typeof closePanels==="function") closePanels(); if(typeof rdPlaySession==="function"&&typeof mobilitySession==="function") rdPlaySession(mobilitySession(),true); }catch(e){ console.warn(e); } return true; }
  if(go==="water"&&!o.done){
    if(typeof uiWaterAdd==="function"){ const n=uiWaterAdd(1); toast(`${n} of ${RD_WGOAL} glasses today`); }
    drCheck(); return true;
  }
  /* a hand tick (a walk ticked by steps can be ticked by hand too) */
  try{ if(typeof hap==="function") hap("light"); }catch(e){}
  o.done=!o.done;
  if(c.obj.every(x=>x.done)) return drFinish("tick");
  save(); drEmit("tick"); drHome(); return true;
}
/* idempotent: only an accepted dare finishes, once ("Done" ticks whatever is left: today's honour rule).
   A weather dare finishes only on its own day; life and lift keep today's Done */
function drFinish(how){
  const D=S.dares, c=D&&D.cur;
  if(!c||c.st!=="yes") return false;
  if(c.kind==="wx"&&drOld(c)) return false;
  if(c.kind==="wx"&&Array.isArray(c.obj)) c.obj.forEach(o=>{ o.done=true; });
  c.st="done"; c.doneAt=Date.now();
  D.scale=Math.min(1,(D.scale||1)+0.05); D.won=(D.won||0)+1;
  if(c.kind==="wx") D.wxWon=(D.wxWon||0)+1;
  save(); track("dare",{st:"done",kind:c.kind});
  try{ Pulse.audio(); Pulse.chime(3); }catch(e){}
  if(c.kind==="wx"){ let t="Dare done.";
    try{ if(typeof troLine==="function"){ const T=troLine("weatherproof"); if(T) t+=` Weatherproof · ${T.done?(T.gname||"Gold"):T.prog}.`; } }catch(e){}
    toast(t); }
  drEmit("done"); drHome(); return true;
}
function drSkip(free){
  const D=S.dares, c=D&&D.cur;
  if(!c||c.st==="done"||c.st==="no") return false;
  if(c.kind==="wx"&&drOld(c)) return false;            // yesterday's weather dare: nothing to skip, no shrink
  c.st="no";
  if(free) c.free=true; else D.scale=Math.max(0.5,(D.scale||1)*0.85);
  save(); track("dare",{st:"no",kind:c.kind});
  if(free) toast("Left for today. It costs nothing.");
  drEmit("skip"); drHome(); return true;
}
function drTone(){ S.dares=S.dares||{scale:1}; S.dares.tone=S.dares.tone==="drill"?"coach":"drill"; save(); drEmit("tone"); drHome(); }
/* one minute of breathing: borrow Breathe's shared length and give it back afterwards */
function drBreathe(){
  try{ if(drS().brDur==null) drS().brDur=RDBR.dur; RDBR.dur=1; }catch(e){}
  try{ if(typeof uiFocusOpen==="function") uiFocusOpen("breath:even",{autoplay:true}); }catch(e){ console.warn(e); }
}
function drDurBack(){
  const s=drS(); if(s.brDur==null) return;
  try{ if(typeof RDBR==="undefined") { s.brDur=null; return; } if(RDBR.run) return; if(RDBR.dur===1) RDBR.dur=s.brDur; }catch(e){}
  s.brDur=null;
  /* the Breathe screen may still be showing the dare's 1 min: redraw its length chips and Start label */
  try{ if(typeof brPlaySync==="function") brPlaySync(); }catch(e){}
}

/* ---------- what the dare page and the Home card draw (pure; raw text, the renderers escape) ---------- */
function drView(){
  const D=S.dares, c=D&&D.cur;
  if(!c||c.kind!=="wx"||c.d!==dkey(0)||typeof dwTemp!=="function") return null;
  const now=Date.now(), id=c.id, out=id!=="indoor", K=drKind(id)||{}, tone=D.tone==="drill"?"drill":"coach";
  const w=drReading(), g=drGate(), use=!!(g&&g.use&&w), fresh=use&&!!g.fresh;
  const L=drLight(now,g,c.m), light=L?L.light:"night";
  /* a new outdoor dare that's too late or dark, or whose reading says no (unsafe, or not for here). drApply turns it
     indoor or back to life as soon as it may act; until then (the phone hasn't answered hello) it's drawn as needing a
     fresh forecast, with the reason in amber, never as a walk */
  const dark=out&&c.st==="new"&&!!L&&(light==="late"||light==="night");
  const bad=dark||(out&&c.st==="new"&&use&&(!g.safe||!g.here));
  const P=drPlace()||{town:"",cc:"",src:"typed"}, town=P.town, where=town?`in ${town}`:"near you";
  const name=K.name||"Weather dare", acc=c.st==="yes";
  const picked=c.seen&&drNum(c.seen.at)?`Picked on the ${dwClock(c.seen.at)} forecast. Needs a fresh one to start.`:"No fresh forecast.";
  /* the page's pitch; while the reading says no (bad), it says what's needed instead of inviting the walk */
  const lead=c.st==="done"?"Every box ticked. A new dare tomorrow.":bad?picked:drLead(c,K,tone);
  /* a skipped outdoor dare isn't drawn against the live sky (a walk line under thunder): the pick's own snapshot */
  let cond="";
  if(use&&!(out&&c.st==="no")){ try{ cond=dwCond(w,now,drKey(),drCtx(now,c.m),id,c.why)||""; }catch(e){ cond=""; } }
  if(!cond) cond=c.seen&&drNum(c.seen.temp)&&drNum(c.seen.at)?`${dwTemp(c.seen.temp)} at ${dwClock(c.seen.at)}`:"No fresh forecast.";
  /* the amber line on an accepted outdoor dare, whatever the reading's state (dark from the place itself) */
  let warn=null, wk=0;
  if(acc&&out){
    const SK=" Skip the walk today. It costs nothing.";
    if(!L){ warn=dwWarn("far")+SK; wk=3; }                                   // no coordinates any more: nothing can vouch for the walk
    else if(light==="late"||light==="night"){ warn=dwWarn("dark")+SK; wk=1; }
    else if(use&&!g.safe){ warn=dwWarn(g.why)+SK; wk=2; }
    else if(use&&!g.here){ warn=dwWarn("far")+SK; wk=3; }
    else if(!fresh){ warn=dwWarn("nofresh"); wk=4; }
  } else if(bad) warn=dwWarn(dark?"dark":g.safe?"far":g.why);              // alone: "Not today" sits right under it
  let acts;
  if(c.st==="done") acts="done";
  else if(c.st==="no") acts="no";
  else if(acc) acts=wk>=1&&wk<=3?"warn":"yes";
  else if(drS().busy) acts="busy";
  else if(!out) acts="new";
  else if(bad) acts="stale";
  else if(light==="pre") acts="pre";
  else if(light==="late"||light==="night"||!fresh) acts="stale";
  else acts="new";
  const fmt=x=>Math.round(x).toLocaleString("en-GB");
  const rows=(Array.isArray(c.obj)?c.obj:[]).map(o=>{
    const R=drRowDef(K,o.id)||{}, live=acc&&!o.done;
    let prog=null;
    if(live&&o.src==="steps"){ const st=drStepsNow(); if(st!=null) prog=`${fmt(Math.min(o.n,Math.max(0,o.base==null?0:st-o.base)))} of ${fmt(o.n)}`; }
    else if(live&&o.src==="water"){ prog=`${Math.min(o.n,Math.max(0,waterToday()-(o.base==null?waterToday():o.base)))} of ${o.n}`; }
    /* hand-ticked rows (no auto source) can toggle off; tracked ones (steps/water/breath/flow) stay ticked by their reading (22 Oct, BUG-35) */
    const tap=live?(R.go||"tick"):(acc&&o.done&&!o.src?"tick":null);
    return {id:o.id,t:drFill(R.t,c),s:drFill(o.src==="steps"&&R.sH?R.sH:R.s,c),done:!!o.done,prog,tap};
  });
  let T=null; try{ if(typeof troLine==="function") T=troLine("weatherproof"); }catch(e){ T=null; }
  const tail=T?(T.done?`Weatherproof · ${T.gname||"Gold"}`:`Weatherproof · ${T.prog}`):"";
  /* a skipped dare counts towards nothing: no footer */
  const reward=!T||c.st==="no"?null:T.done||c.st==="done"?tail:`Counts towards ${tail}`;
  /* the Home card: the live reading when it's usable and fresh, else the pick's own snapshot */
  const nDone=rows.filter(r=>r.done).length;
  let ce, cl;
  if(c.st==="done"){ ce="Dare done"; cl=(T?`${tail}. `:"")+"A new one tomorrow."; }
  else if(c.st==="no"){ ce="Dare skipped"; cl=c.free?"Left for today. Tomorrow's stays the same size.":"No problem. Tomorrow's will be a little smaller."; }
  else if(acc){ ce=`Dare accepted · ${nDone} of ${rows.length} done`; cl=warn||"Tick the rest off as you go."; }
  else if(!out){ ce="Weather dare · indoors"; cl=`${dwWhy(c.why||"dark")} ${where}. Mobility, breathing and water, indoors.`; }
  else if(!fresh||light==="late"||light==="night"||bad){ ce="Weather dare"; cl=picked; }
  else { const sky=dwSky(w.symbol); ce=`Weather dare · ${dwTemp(w.temp)}`;
    cl=light==="pre"?`${sky} ${where}. The walk starts from ${dwClock(L.from)}.`:`${sky} ${where}. ${lead}`; }
  const eye=c.st==="done"?"Dare done":c.st==="no"?"Dare skipped":acc?"Weather dare · accepted":out?"Weather dare":"Weather dare · indoors";
  return {
    id, why:c.why||null, st:c.st, name, glyph:id, eye,
    title:use?`${town||"Near you"} · ${dwTemp(w.temp)}`:"Weather dare",
    cond, lead, rows, reward, safety:drFill(K.safety||"",c),
    warn, acts, from:L&&drNum(L.from)?L.from:null, busy:!!drS().busy,
    place:{town:P.town,cc:P.cc,src:P.src}, credit:"Weather data from MET Norway", temp:use?dwTemp(w.temp):"",
    card:{eye:ce,line:cl}
  };
}

/* ---------- listeners and the three water wrappers (include time) ---------- */
(()=>{ try{
  vxOn("native",m=>{ if(!m) return;
    if(m.t==="caps") setTimeout(()=>{ try{ drS().soonAt=0; drSoon(); }catch(e){ console.warn("Ossa: dares",e); } },0);   // the phone has answered: the first refresh
    else if(m.t==="health") setTimeout(()=>{ try{ drCheck(); }catch(e){ console.warn("Ossa: dares",e); } },0);
  });
  vxOn("aura",(r,e)=>{ if(e&&e.k==="breath") setTimeout(()=>{ try{ drDurBack(); drCheck(); }catch(x){ console.warn("Ossa: dares",x); } },0); });
  vxOn("workout",rec=>{ if(rec&&rec.kind==="mobility") setTimeout(()=>{ try{ drCheck(); }catch(e){ console.warn("Ossa: dares",e); } },0); });
  vxOn("fg",()=>setTimeout(()=>{ try{ drCheck(); drRefresh(false); }catch(e){ console.warn("Ossa: dares",e); } },0));
  vxOn("day",()=>{ try{ const s=drS(); s.soonAt=0; s.busyN=0; s.busy=false; drDurBack(); }catch(e){} });
}catch(e){ console.warn("Ossa: dares",e); } })();
(()=>{ try{ if(typeof addWater!=="function") return; const _f=addWater;
  addWater=function(){ const r=_f.apply(this,arguments); setTimeout(()=>{ try{ drCheck(); }catch(e){ console.warn("Ossa: dares",e); } },0); return r; };
}catch(e){ console.warn("Ossa: dares",e); } })();
(()=>{ try{ if(typeof rdWaterLog!=="function") return; const _f=rdWaterLog;
  rdWaterLog=function(){ const r=_f.apply(this,arguments); setTimeout(()=>{ try{ drCheck(); }catch(e){ console.warn("Ossa: dares",e); } },0); return r; };
}catch(e){ console.warn("Ossa: dares",e); } })();
(()=>{ try{ if(typeof uiWaterAdd!=="function") return; const _f=uiWaterAdd;
  uiWaterAdd=function(){ const r=_f.apply(this,arguments); setTimeout(()=>{ try{ drCheck(); }catch(e){ console.warn("Ossa: dares",e); } },0); return r; };
}catch(e){ console.warn("Ossa: dares",e); } })();
