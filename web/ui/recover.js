/* =========================================================
   RECOVER (Ossa 2.0, Phase 4 "Recover"). Prefixes: fu* (Fuel), rcv* (the Recover tab), rst* (the reset).
   Andrej's picks (17 Oct, "go phase 4", the plan's recommended answers):
     - Protein in grams at 1.6 g per kg if you add your weight; portions (meals with protein, of 4) if you skip
       it, and always under 18. Carbs as meals, of 3. Water stays the old log (addWater).
     - Game rule: logged fuel makes muscles ready up to 8 h a day sooner, never more than a quarter of the wait.
       It goes through vessel.js's "recWindow" provider, so every "ready in" in the app agrees.
     - The 3-minute reset reminder, 45 min after a workout, is asked once on Workout complete (S.resetOn).
     - Fuel is free.
   Layout, like Focus (one job per screen, no scrolling): the Recover home is a readiness card, the reset card
   (only for 6 h after a workout) and four tiles: Fuel, Mobility, Aching? and More. Each opens its own view with
   "‹ Recover": 'list' (everything recovering), 'fuel', 'more'. Re-tapping Recover goes home.
   Saved: S.fuel = {kg:null|35..200, skip:bool, days:{'YYYY-MM-DD':{p:grams or protein meals, c:0..3, e:[[ms,k,v]]}}}
          S.recNudge = {d, end, title, ks:[muscle keys], at, snooze, n, done, off}
          S.resetOn = undefined (not asked yet) | true | false
   Start-up rule: function declarations only, state on function properties, no top-level const or let.
   Health wording: logged by you, an estimate, a game rule. Never "synthesis", "repair" or a percentage.
   Analytics never carry grams or weight.
   ========================================================= */

/* ---------- Fuel: the log ---------- */
function fuS(){
  if(!S.fuel||typeof S.fuel!=="object") S.fuel={kg:null,skip:false,days:{}};
  if(!S.fuel.days||typeof S.fuel.days!=="object") S.fuel.days={};
  return S.fuel;
}
function fuDay(n){ const F=fuS(), d=dkey(n||0); return F.days[d]||{p:0,c:0,e:[]}; }
function fuDayW(){ const F=fuS(), d=dkey(0); if(!F.days[d]) F.days[d]={p:0,c:0,e:[]}; return F.days[d]; }
function fuPrune(){ const F=fuS(), cut=dkey(30); Object.keys(F.days).forEach(d=>{ if(d<cut) delete F.days[d]; }); }
function fuAge(){ try{ const a=+(S.profile&&S.profile.age); return a>0?a:null; }catch(e){ return null; } }
function fuMinor(){ const a=fuAge(); return a!=null&&a<18; }
/* grams mode needs a weight and an adult; otherwise portions (meals with protein, of 4) */
function fuGrams(){ const F=fuS(); return !fuMinor()&&+F.kg>=35; }
function fuTarget(){ if(!fuGrams()) return 4; const t=1.6*fuS().kg; return Math.round(Math.max(60,Math.min(220,t))/5)*5; }
/* today's protein in the current unit: grams, or meals with protein. A day logged in the other unit converts
   (about 25 g a meal), so switching between grams and meals never mixes them */
function fuUnit(){ return fuGrams()?"g":"m"; }
function fuP(D){ if(!D) return 0; const p=+D.p||0, u=D.u||(p>6?"g":fuUnit()), cur=fuUnit(); if(u===cur) return p; return cur==="m"?Math.min(6,Math.round(p/25)):p*25; }
function fuPFrac(n){ const t=fuTarget(); return Math.max(0,Math.min(1,fuP(fuDay(n))/t)); }
function fuCFrac(n){ return Math.max(0,Math.min(1,(+fuDay(n).c||0)/3)); }
function fuLogged(n){ const D=fuDay(n); return fuP(D)>0||(+D.c||0)>0; }
function fuHit(n){ return fuPFrac(n)>=1; }
/* the one logger: k 'p' (grams, or one protein meal in portion mode) or 'c' (a meal with carbs, ±1) */
function fuAdd(k,v){
  const D=fuDayW(), now=Date.now();
  if(k==="p"){ if(D.u!==fuUnit()){ D.p=fuP(D); D.u=fuUnit(); D.e=(D.e||[]).filter(x=>x[1]!=="p"); }   // a unit change: no undo across it
    const was=+D.p||0; D.p=Math.max(0,Math.min(fuGrams()?400:6,was+v)); v=D.p-was; }
  else { const was=+D.c||0; D.c=Math.max(0,Math.min(3,was+v)); v=D.c-was; }
  if(!v) return false;
  D.e=(D.e||[]).concat([[now,k,v]]).slice(-40);
  fuPrune(); save();
  try{ Pulse.buzz(8); }catch(e){}
  try{ track("fuel",{k}); }catch(e){}   // never the grams
  fuUndo.at=now;
  return true;
}
function fuUndo(){
  const D=fuDayW(), e=(D.e||[]).pop(); if(!e) return false;
  if(e[1]==="p"){ if(D.u&&D.u!==fuUnit()) return false; D.p=Math.max(0,(+D.p||0)-e[2]); } else D.c=Math.max(0,(+D.c||0)-e[2]);
  save(); try{ Pulse.buzz(6); }catch(e2){}
  return true;
}

/* ---------- the game rule ----------
   A day's fuel takes up to 6 h off for protein (in proportion) plus 2 h for carbs at 3 of 3 meals: 8 h at most.
   It counts on the day you trained and the day after (never a day still to come), and the wait never drops
   below three quarters of the window. Hours, so "ready in" moves everywhere at once. */
function fuDayH(d){ const D=fuS().days[d]; if(!D) return 0; const t=fuTarget();
  return Math.min(8,6*Math.max(0,Math.min(1,fuP(D)/t))+((+D.c||0)>=3?2:0)); }
function fuCutH(s,w){
  try{ if(!s||!(w>0)) return 0;
    const t=new Date(s.t), d0=dkey(0), a=fuKey(t), b=fuKey(new Date(t.getFullYear(),t.getMonth(),t.getDate()+1));
    let h=fuDayH(a); if(b<=d0) h+=fuDayH(b);
    return Math.max(0,Math.min(h,w*0.25)); }catch(e){ return 0; }
}
function fuKey(t){ return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`; }
/* hours the rule took off k's current wait (for the "−6 h fuel" tags) */
function fuBoostH(k){ try{ const s=lastSession(k); if(!s) return 0; return Math.round(fuCutH(s,recWindow(s.load))); }catch(e){ return 0; } }
/* what more fuel today would do: hours sooner for the muscles you trained today or yesterday */
function fuNext(){
  let ks=[]; try{ ks=GLORDER.filter(k=>stateOf(k)==="recovering"&&[dkey(0),dkey(1)].includes(fuKey(new Date(lastSession(k).t)))).sort((a,b)=>recoveredPct(a)-recoveredPct(b)); }catch(e){}
  return ks;
}

/* ---------- Fuel in the Body score: when you log fuel, protein and carbs count in the Fuel pillar ---------- */
(()=>{ try{ const _p=pillars;
  pillars=function(n){ const r=_p.apply(this,arguments); try{
      const day=n||0; if(!fuLogged(day)) return r;
      const f=0.7*fuPFrac(day)+0.3*fuCFrac(day);
      r.fuel=Math.min(100,r.fuel==null?Math.round(100*f):Math.round(0.5*r.fuel+50*f));
      const v=[r.move,r.recover,r.fuel,r.mind].filter(x=>x!=null); r.score=Math.round(v.reduce((a,b)=>a+b,0)/v.length);
    }catch(e){} return r; };
  const s=STDS.find(x=>x.id==="protein"); if(s){ s.auto=()=>fuHit(0); s.s="Ticks itself when you hit your protein"; }
}catch(e){ console.warn("Ossa: fuel pillar",e); } })();
try{ vxOn("recWindow",(k,s,w)=>{ const c=fuCutH(s,w); return c>0?w-c:0; }); }catch(e){ console.warn(e); }

/* ---------- the Recover tab: home and its views ---------- */
function rcvS(){ return rcvS.s||(rcvS.s={v:"home",ask:false,undoT:0}); }
/* anything open over the Recover tab (the back swipe goes to that first) */
function rcvBusy(){
  const app=$("app"), ps=$("psX");
  return app.classList.contains("train")||app.classList.contains("timelining")||!!document.querySelector(".panel.on")
    ||(typeof MIND!=="undefined"&&MIND.open)||(typeof RDL!=="undefined"&&!!RDL)||(typeof RV!=="undefined"&&!!RV)
    ||(typeof vxSoreS==="function"&&vxSoreS().open)||(typeof sheetState!=="undefined"&&sheetState!=="closed")||!!(ps&&!ps.hidden&&ps.offsetParent)
    ||!!(window.CHECKVIEW);
}
function rcvGo(v){ const V=rcvS(); V.v=v||"home"; if(V.v!=="fuel"){ V.ask=false; V.editKg=false; } try{ Pulse.buzz(6); }catch(e){} renderRecover(); const t=$("tv-recover"); if(t) t.scrollTop=0; }
function rcvLists(){
  const o={rec:[],fad:[],ready:0};
  try{ const st={}; GLORDER.forEach(k=>st[k]=stateOf(k));
    o.rec=GLORDER.filter(k=>st[k]==="recovering").sort((x,y)=>recoveredPct(x)-recoveredPct(y));
    o.fad=GLORDER.filter(k=>st[k]==="fading").sort((x,y)=>daysSince(y)-daysSince(x));
    o.ready=GLORDER.filter(k=>st[k]==="ready").length; }catch(e){ console.warn(e); }
  return o;
}
function rcvNames(ks,n){ const a=ks.slice(0,n||2).map(k=>MUSCLES[k].name); return a.length>1?a.slice(0,-1).join(", ")+" and "+a[a.length-1]:a[0]||""; }
function rcvTop(t,back){
  return back?`<div class="rcv-bar"><button class="rcv-back" id="rcvBack">‹ Recover</button><span class="rcv-t">${uiEsc(t)}</span><span></span></div>`
    :`<header class="u-top"><div class="u-top-tx"><div class="u-eyebrow">${uiShortDate()}</div><h1 class="u-h1">Recover</h1></div></header>`;
}
function renderRecover(){
  const b=$("tv-recover"); if(!b) return;
  const V=rcvS(), L=rcvLists();
  let html="";
  if(V.v==="list") html=rcvListHTML(L);
  else if(V.v==="fuel") html=fuViewHTML();
  else if(V.v==="more") html=rcvMoreHTML();
  else { V.v="home"; html=rcvHomeHTML(L); }
  b.innerHTML=`<div class="u-screen u-recover rcv rcv-${V.v}">${html}</div>`;
  const bk=$("rcvBack"); if(bk) bk.onclick=()=>rcvGo("home");
  b.querySelectorAll("[data-rv]").forEach(x=>x.onclick=()=>rcvGo(x.dataset.rv));
  b.querySelectorAll("[data-rm]").forEach(x=>x.onclick=()=>{ Pulse.buzz(6); rkShow3D({lens:"rec"}); setTimeout(()=>{ try{ openSel({t:"muscle",id:x.dataset.rm},true); }catch(e){} },reduced?0:500); });   /* the Body page, Recovery lens (lens.js) */
  if(V.v==="home") rcvHomeWire(b);
  if(V.v==="fuel") fuViewWire(b);
  if(V.v==="more") rcvMoreWire(b);
  if(V.v==="fuel") fuShotLater();
}

/* home: the readiness card, the reset card (6 h after a workout) and four tiles */
function rcvHomeHTML(L){
  const tot=L.rec.length+L.ready, frac=tot?L.ready/tot:1, r=34, c=2*Math.PI*r;
  const first=L.rec.length?`${uiEsc(MUSCLES[L.rec[0]].name)} ready ${leftText(hoursLeft(L.rec[0]))}`:"";
  const hero=`<button class="u-card rcv-hero" data-rv="list" aria-label="${L.ready} ready, ${L.rec.length} recovering. See the list">
    <svg class="rcv-ring" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="${r}" class="bg"/><circle cx="40" cy="40" r="${r}" class="fg" stroke-dasharray="${(c*frac).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 40 40)"/></svg>
    <span class="rcv-hero-tx">${!tot?`<b>All fresh</b><small>Train something and its recovery shows here.</small>`:`<b><em>${L.ready}</em> ready</b>${L.rec.length?`<small><i aria-hidden="true"></i>${L.rec.length} recovering · ${first}</small>`:`<small>Everything's recovered. Train whatever you like.</small>`}`}</span>${UI_IC.chev}</button>`;
  const R=(()=>{ try{ return rdTabData("recover"); }catch(e){ return null; } })();
  const D=fuDay(0), g=fuGrams(), t=fuTarget();
  const fuSub=g?`${Math.round(fuP(D))} of ${t} g protein`:`Protein at ${fuP(D)} of 4 meals`;
  const tile=(go,ic,col,ti,sub,extra)=>`<button class="rcv-tile" ${go}><span class="u-ic" style="--c:${col}">${ic}</span><b>${ti}</b><small>${sub}</small>${extra||""}</button>`;
  const tiles=`<div class="rcv-tiles">
    ${tile('data-rv="fuel"',rstIc("fuel"),"var(--fuel)","Fuel",fuSub,`<span class="u-bar rcv-tb" style="--c:var(--fuel)"><i style="width:${Math.round(fuPFrac(0)*100)}%"></i></span>`)}
    ${tile('id="rcvFlow"',rstIc("flow"),"var(--move)","Mobility",R&&R.sub?uiEsc(R.sub):"A short flow")}
    ${tile('id="rcvAche"',UI_IC.pin||rstIc("ache"),"var(--amber)","Aching?","Tap where it hurts")}
    ${tile('data-rv="more"',rstIc("more"),"var(--text-2)","More","Desk reset, posture, sleep")}
  </div>`;
  return `${rcvTop()}${hero}${rstCardHTML()}${tiles}`;
}
function rcvHomeWire(b){
  const R=(()=>{ try{ return rdTabData("recover"); }catch(e){ return null; } })();
  const fl=$("rcvFlow"); if(fl) fl.onclick=()=>{ Pulse.buzz([10,40,14]); try{ track("recover_play"); }catch(e){} if(R&&R.go) R.go(); };
  const ac=$("rcvAche"); if(ac) ac.onclick=uiSoreGo;
  rstCardWire(b);
}
function rcvListHTML(L){
  const row=k=>{ const p=recoveredPct(k), h=hoursLeft(k), fb=fuBoostH(k);
    return `<button class="u-recr" data-rm="${k}" aria-label="${uiEsc(MUSCLES[k].name)}: ${Math.round(p*100)}% recovered, ready ${leftText(h)}${fb?`, ${fb} hours sooner from fuel`:""}">
      <span class="u-recr-n">${uiEsc(MUSCLES[k].name)}</span><span class="u-bar" style="--c:var(--amber)"><i style="width:${Math.round(p*100)}%"></i></span><em>Ready ${leftText(h)}${fb?` <span class="rcv-fb">−${fb} h fuel</span>`:""}</em></button>`; };
  let fade="";
  if(L.fad.length){ const nm=uiEsc(rcvNames(L.fad,2))+(L.fad.length>2?` +${L.fad.length-2}`:""), d=daysSince(L.fad[0]);
    const days=L.fad.length===1?(d>=60?"over 60":d):NEGLECT_DAYS+"+";
    fade=`<button class="u-recfd" data-rm="${L.fad[0]}"><i aria-hidden="true"></i><span><b>${nm}</b><small>Fading · not trained for ${days} days</small></span>${UI_IC.chev}</button>`; }
  return `${rcvTop("Recovering",1)}
    <p class="rcv-sum"><b style="color:var(--glow)">${L.ready}</b> ready · <b style="color:var(--amber)">${L.rec.length}</b> recovering</p>
    ${L.rec.length?`<div class="u-card rcv-list"><div class="u-recl">${L.rec.map(row).join("")}</div></div>`:`<p class="u-recnow-ok">Everything's recovered. Train whatever you like.</p>`}
    ${fade}
    <p class="u-foot">Ossa's estimate from what you logged. Sharp, numb or spreading pain isn't soreness: see a physio or GP.</p>`;
}
function rcvMoreHTML(){
  const l=psLast();
  const on=S.resetOn===true;
  return `${rcvTop("More",1)}
    <div class="u-rowcards">
      <button class="u-row" id="rcDesk"><span class="u-ic" style="--c:var(--glow-soft)">${UI_IC.desk}</span><span><b>60-second desk reset</b><small>Four moves for your neck and back</small></span>${UI_IC.chev}</button>
      <button class="u-row" id="rcPs"><span class="u-ic" style="--c:var(--move)">${UI_IC.posture}</span><span><b>Posture scan</b><small>${l?`Last scan ${l.sc}/100`:"Two photos, two minutes"}</small></span>${UI_IC.chev}</button>
      <button class="u-row" id="rcWind"><span class="u-ic" style="--c:var(--mind)">${UI_IC.moon}</span><span><b>Wind-down</b><small>An evening routine for better sleep</small></span>${UI_IC.chev}</button>
      <button class="u-row" id="rcvRst" aria-pressed="${on}"><span class="u-ic" style="--c:var(--glow)">${rstIc("flow")}</span><span><b>Reset reminder</b><small>${on?"On · 45 min after a workout":"Off · a 3-minute reset 45 min after a workout"}</small></span><em class="rcv-sw${on?" on":""}" aria-hidden="true"><i></i></em></button>
    </div>
    <p class="u-foot">Sharp, numb or spreading pain isn't soreness. See a physio or GP.</p>`;
}
function rcvMoreWire(b){
  const l=psLast();
  $("rcDesk").onclick=()=>{ Pulse.buzz(8); deskOpen(); };
  $("rcPs").onclick=()=>{ Pulse.buzz(8); if(l) psView(l); else psOpen({from:"recover"}); };
  $("rcWind").onclick=()=>{ Pulse.buzz(8); uiFocusOpen("wind"); };
  $("rcvRst").onclick=()=>{ rstSetOn(S.resetOn!==true); renderRecover(); };
}

/* ---------- the Fuel view ---------- */
function fuViewHTML(){
  const D=fuDay(0), g=fuGrams(), t=fuTarget(), p=fuP(D), c=+D.c||0, minor=fuMinor(), V=rcvS();
  const ks=fuNext(), who=ks.length?rcvNames(ks,2).toLowerCase():"";
  /* the boost line: what more would do, or what today's fuel did */
  let boost="";
  if(ks.length){
    const k=ks[0], s=lastSession(k), w=recWindow(s.load), got=fuBoostH(k);
    const dP=g?Math.max(0,t-p):Math.max(0,4-p), more=Math.min(8,6*(1-fuPFrac(0))+(c>=3?0:2));
    const capLeft=Math.max(0,w*0.25-got), gain=Math.round(Math.min(more,capLeft));
    const what=[dP>0?(g?`${dP} g more protein`:`${dP} more protein meal${dP>1?"s":""}`):"",c<3?"carbs at every meal":""].filter(Boolean).join(" and ");
    boost=gain>=1&&what?`${what[0].toUpperCase()+what.slice(1)} today and your ${who} ${ks.length>1?"are":"is"} ready about ${gain} hour${gain>1?"s":""} sooner.`
      :got>0?`Fuelled. Your ${who} ${ks.length>1?"are":"is"} ready ${got} hour${got>1?"s":""} sooner.`:"";
  } else boost="Train something and fuel on the day makes it ready sooner.";
  const ask=V.ask&&!minor&&(V.editKg||(!g&&!fuS().skip));
  const pCard=ask?fuAskHTML():`<div class="fu-card" aria-label="Protein">
      <div class="fu-h"><b>Protein</b><span>${g?`<em>${Math.round(p)} g</em> of ${t} g`:`<em>${p}</em> of 4 meals`}</span></div>
      <span class="u-bar fu-bar" style="--c:var(--fuel)"><i style="width:${Math.round(fuPFrac(0)*100)}%"></i></span>
      <div class="fu-chips">${g?[[15,"a yoghurt"],[25,"a palm of chicken"],[40,"a shake and eggs"]].map(([v,h])=>`<button class="fu-chip" data-fp="${v}"><b>+${v} g</b><small>about ${h}</small></button>`).join("")
        :`<button class="fu-chip wide" data-fp="1"><b>+1 meal with protein</b><small>meat, fish, eggs, dairy, tofu or beans</small></button>`}</div></div>`;
  const cCard=`<div class="fu-card" aria-label="Carbs">
      <div class="fu-h"><b>Carbs</b><span><em>${c}</em> of 3 meals</span></div>
      <div class="fu-meals" role="group" aria-label="Meals with carbs">${[1,2,3].map(i=>`<button class="fu-meal${i<=c?" on":""}" data-fc="${i}" aria-pressed="${i<=c}">Meal ${i}</button>`).join("")}</div></div>`;
  const undo=(fuDay(0).e||[]).length&&Date.now()-(fuUndo.at||0)<6000?`<button class="u-link fu-undo" id="fuUndo">Undo</button>`:"";
  const kgLine=g?`<button class="u-link fu-kg" id="fuKg">Target from ${fuS().kg} kg · change</button>`:(!minor&&!ask?`<button class="u-link fu-kg" id="fuKgAdd">Use grams instead (add your weight)</button>`:"");
  return `${rcvTop("Fuel",1)}
    <div class="fu-hero" id="fuHero" aria-hidden="true">${ks.length?`<span class="fu-tag">Recovering: ${uiEsc(rcvNames(ks,2))}</span>`:""}</div>
    ${pCard}${cCard}
    <p class="fu-boost">${boost?`<span class="fu-rule">Game rule</span>${uiEsc(boost)}`:""}</p>
    ${undo||kgLine?`<div class="fu-links">${undo}${kgLine}</div>`:""}
    <p class="u-foot fu-foot">Logged by you, as an estimate. A kidney condition or a medical diet? Check with your GP or a dietitian.</p>`;
}
function fuAskHTML(){
  const kg=fuAskHTML.kg||70;
  return `<div class="fu-card fu-ask"><b>What do you weigh?</b><small>Only used for your protein target. It stays on this phone.</small>
    <div class="fu-step"><button class="u-icon-btn round" data-kd="-1" aria-label="Less">−</button><span><b id="fuKgV">${kg}</b> kg</span><button class="u-icon-btn round" data-kd="1" aria-label="More">+</button></div>
    <div class="fu-ask-b"><button class="u-btn small" id="fuSkip">Skip, count meals</button><button class="u-btn small primary" id="fuKgSave">Save</button></div></div>`;
}
function fuViewWire(b){
  const V=rcvS();
  b.querySelectorAll("[data-fp]").forEach(x=>x.onclick=()=>{
    if(!fuGrams()&&!fuMinor()&&!fuS().skip&&fuS().kg==null&&!V.asked){ V.ask=true; V.asked=true; fuAskHTML.kg=70; V.pend=+x.dataset.fp; renderRecover(); return; }
    fuAdd("p",+x.dataset.fp); fuRefresh(); });
  b.querySelectorAll("[data-fc]").forEach(x=>x.onclick=()=>{ const i=+x.dataset.fc, c=+fuDay(0).c||0; fuAdd("c",i<=c?i-1-c:i-c); fuRefresh(); });
  const u=$("fuUndo"); if(u) u.onclick=()=>{ fuUndo(); fuRefresh(); };
  b.querySelectorAll("[data-kd]").forEach(x=>x.onclick=()=>{ fuAskHTML.kg=Math.max(35,Math.min(200,(fuAskHTML.kg||70)+(+x.dataset.kd))); const v=$("fuKgV"); if(v) v.textContent=fuAskHTML.kg; try{ Pulse.buzz(4); }catch(e){} });
  const sv=$("fuKgSave"); if(sv) sv.onclick=()=>{ fuS().kg=fuAskHTML.kg||70; fuS().skip=false; V.ask=false; V.editKg=false; V.pend=0; save(); fuRefresh(); };
  const sk=$("fuSkip"); if(sk) sk.onclick=()=>{ const F=fuS(); F.skip=true; F.kg=null; V.ask=false; V.editKg=false; save(); if(V.pend){ fuAdd("p",1); V.pend=0; } fuRefresh(); };
  const kg=$("fuKg"); if(kg) kg.onclick=()=>{ V.ask=true; V.editKg=true; fuAskHTML.kg=fuS().kg||70; renderRecover(); };
  const ka=$("fuKgAdd"); if(ka) ka.onclick=()=>{ V.ask=true; fuS().skip=false; fuAskHTML.kg=70; renderRecover(); };
}
/* a log re-renders the view, then again after the undo window so the Undo link goes */
function fuRefresh(){ renderRecover(); clearTimeout(fuRefresh.t); fuRefresh.t=setTimeout(()=>{ if(rcvS().v==="fuel"&&typeof TAB!=="undefined"&&TAB==="recover") renderRecover(); },6100); }
/* the recovering muscles, lit on our own body (a Body.shot still, ice-blue on dark), after the first paint */
function fuShotLater(){
  const n=fuShotLater.n=(fuShotLater.n||0)+1;
  const go=()=>{ if(fuShotLater.n!==n) return; fuShotLater.n++;
    const h=$("fuHero"); if(!h||!h.isConnected) return;
    const ks=fuNext().length?fuNext():rcvLists().rec; if(!ks.length){ h.classList.add("none"); return; }
    const key=ks.slice(0,4).join(",")+"|"+(S.body||"");
    let url=fuShotLater.c&&fuShotLater.c.k===key?fuShotLater.c.u:null;
    if(!url){ try{ if(Body&&typeof Body.shot==="function"){
      const mask={}; ks.slice(0,4).forEach((k,i)=>mask[k]=i?0.6:1);
      const back=ks.slice(0,4).filter(k=>MUSCLES[k].face>1.57).length>ks.slice(0,4).length/2;
      const low=ks.slice(0,4).every(k=>/quad|ham|glute|calf|calves|adduct|abduct|shin|tib/i.test(k));
      url=Body.shot({yaw:back?Math.PI:0,mask,crop:low?[0.42,1]:[0.06,0.62]}); } }catch(e){ console.warn("Ossa: fuel still",e); }
      if(url) fuShotLater.c={k:key,u:url}; }
    if(!url){ h.classList.add("none"); return; }
    let im=h.querySelector("img"); if(!im){ im=document.createElement("img"); im.alt=""; h.prepend(im); }
    im.src=url; h.classList.add("ready");
  };
  try{ requestAnimationFrame(()=>setTimeout(go,0)); }catch(e){}
  setTimeout(go,180);
}

/* ---------- the 3-minute reset and its reminder ---------- */
function rstIc(k){
  return ({fuel:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h10M8 3.5v4.2c0 1-.4 1.9-1.1 2.6A5.4 5.4 0 0 0 5.4 14v4.5A2 2 0 0 0 7.4 20.5h9.2a2 2 0 0 0 2-2V14c0-1.4-.5-2.7-1.5-3.7-.7-.7-1.1-1.6-1.1-2.6V3.5"/><path d="M5.6 14h12.8"/></svg>`,
    flow:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4.6" r="1.9"/><path d="M12 7.4v6.2M12 13.6l-4.6 6M12 13.6l4.6 6M5.4 9.4c2.2 1.2 4.4 1.8 6.6 1.8s4.4-.6 6.6-1.8"/></svg>`,
    ache:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>`,
    more:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></svg>`})[k]||"";
}
function rstOk(n){ return !!(n&&typeof n==="object"&&+n.end>0&&!n.done&&!n.off&&Date.now()-(+n.end)<6*3.6e6); }
function rstWho(ks){ return rcvNames((ks||[]).filter(k=>MUSCLES[k]),2).toLowerCase()||"what you trained"; }
/* after a workout (not a mobility, posture or reset session): remember what you trained, for 45 min on */
function rstOnWorkout(rec,R){
  try{
    const s=TR.session||{};
    if(s.reset){ if(S.recNudge){ S.recNudge.done=Date.now(); save(); } return; }
    if(!rec||rec.kind==="mobility"||rec.kind==="posture"||s.kind==="mobility"||s.kind==="posture"||!(rec.sets>0)) return;
    const I=(R&&R.I)||{}, ks=Object.keys(I).filter(k=>MUSCLES[k]&&(MX[k]&&MX[k].stretch&&MX[k].stretch.length)).sort((a,b)=>I[b]-I[a]).slice(0,3);
    if(!ks.length) return;
    const end=+rec.end||Date.now();
    S.recNudge={d:dkey(0),end,title:String(rec.title||"").slice(0,60),ks,at:end+rstDelay(),snooze:null,n:0,done:null,off:null};
    save(); rstSync();
  }catch(e){ console.warn("Ossa: reset nudge",e); }
}
/* 45 min; one minute only when a desktop test sets rstDelay.test */
function rstDelay(){ return rstDelay.test?60e3:45*60e3; }
function rstSync(){ try{ if(typeof nativeSoon==="function") nativeSoon(false); if(typeof nativeSync==="function") nativeSync(false); }catch(e){} }
function rstRemind(){
  const n=S.recNudge; if(!rstOk(n)||!(S.resetOn===true||n.snooze)) return [];
  const at=+(n.snooze||n.at); if(!(at>Date.now()+31000)) return [];
  return [{at,go:"reset",lead:35000,title:`3 minutes for your ${rstWho(n.ks)}`,body:`You trained ${n.snooze?"a while":(m=>`${m} minute${m>1?"s":""}`)(Math.max(1,Math.round((n.at-n.end)/60000)))} ago. A few easy stretches, then you're done.`}];
}
function rstSetOn(on){
  S.resetOn=!!on; save();
  try{ if(on&&NATIVE.on&&!(NATIVE.rem&&NATIVE.rem.granted)) nativeSoon(true); }catch(e){}
  rstSync(); try{ Pulse.buzz(6); }catch(e){}
}
function rstSnooze(){
  const n=S.recNudge; if(!rstOk(n)) return;
  if((n.n||0)>=2){ toast("That's the last reminder. Start it whenever you like."); return; }
  n.snooze=Date.now()+15*60e3; n.n=(n.n||0)+1; save(); rstSync();
  const t=new Date(n.snooze); toast(`I'll remind you at ${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}.`);
  if(typeof TAB!=="undefined"&&TAB==="recover") renderRecover();
}
/* the session: one stretch for each muscle you trained, 40 s, three moves at most */
function rstSession(ks){
  ks=(ks||[]).filter(k=>MX[k]&&MX[k].stretch&&MX[k].stretch.length);
  const seen={}, items=[];
  ks.forEach(k=>{ const st=MX[k].stretch[0]; if(!st||seen[st[0]]||items.length>=3) return; seen[st[0]]=1;
    const each=/each side/i.test(st[1]||""), it=mkItem(st[0],each?"1 × 40 s each side":"1 × 40 s",k);
    it.mob=true; it.jwhy=`Eases your ${MUSCLES[k].name.toLowerCase()} after today's session.`; items.push(it); });
  if(!items.length) return null;
  try{ while(items.length>1&&estMin(items)>3) items.pop(); }catch(e){}   // it has to be a 3-minute reset
  const n=S.recNudge, t=n&&n.end?new Date(n.end):null;
  return {title:"3-minute reset",note:"Easy stretches for what you just trained",kind:"mobility",reset:true,day:todayIdx,items,
    relief:`For the ${rstWho(ks)} you trained${t?` at ${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`:" today"}.`};
}
function rstOpen(){
  const n=S.recNudge;
  if(!rstOk(n)){ try{ setTab("recover"); }catch(e){} return; }
  const s=rstSession(n.ks); if(!s){ try{ setTab("recover"); }catch(e){} return; }
  if(TR.view==="active"){ setMode("train"); toast("Finish or end your current workout first"); return; }
  try{ setSheet("closed"); }catch(e){}
  TR={...TR,view:"plan",custom:true,hub:false,pick:null,ed:null,planSel:null,planEnter:true,session:s};
  try{ track("reset_open"); }catch(e){}
  setMode("train"); const tv=$("train"); if(tv) tv.scrollTop=0;
}
/* the card on the Recover home, while a reset is due */
function rstCardHTML(){
  const n=S.recNudge; if(!rstOk(n)) return "";
  const ago=Math.max(1,Math.round((Date.now()-n.end)/60000)), when=ago<60?`${ago} min ago`:`${Math.round(ago/60)} h ago`;
  return `<div class="u-card rst-card"><span class="u-eyebrow rst-eye">After ${uiEsc(n.title||"your workout")} · ${when}</span>
    <b class="rst-t">3-minute reset</b><small>Easy stretches for your ${uiEsc(rstWho(n.ks))}</small>
    <div class="rst-b"><button class="u-btn small lime" id="rstGo">Start</button><button class="u-link" id="rstLater">In 15 min</button><button class="u-link" id="rstOff">Not today</button></div></div>`;
}
function rstCardWire(){
  const g=$("rstGo"); if(g) g.onclick=()=>{ Pulse.buzz([10,40,14]); rstOpen(); };
  const l=$("rstLater"); if(l) l.onclick=()=>{ try{ if(NATIVE.on&&!(NATIVE.rem&&NATIVE.rem.granted)) nativeSoon(true); }catch(e){} rstSnooze(); };
  const o=$("rstOff"); if(o) o.onclick=()=>{ if(S.recNudge){ S.recNudge.off=Date.now(); save(); rstSync(); } renderRecover(); };
}
/* Workout complete: one row that asks once ("In 45 min: a 3-minute reset for your chest"), then remembers */
function rstDoneRow(){
  const n=S.recNudge; if(!rstOk(n)||n.end<Date.now()-5*60e3||(S.resetOn===false&&!rstRowWire.seen)) return "";
  const on=S.resetOn===true;
  return `<button class="rst-row" id="rstRow" aria-pressed="${on}"><span><b>In 45 min: a 3-minute reset</b><small>${on?`Ossa will remind you, for your ${uiEsc(rstWho(n.ks))}`:`Easy stretches for your ${uiEsc(rstWho(n.ks))}. Remind me?`}</small></span><em class="rcv-sw${on?" on":""}" aria-hidden="true"><i></i></em></button>`;
}
function rstRowWire(){ const x=$("rstRow"); if(!x) return; x.onclick=()=>{ rstRowWire.seen=true; rstSetOn(S.resetOn!==true); const y=$("rstRow"); if(y){ y.outerHTML=rstDoneRow(); rstRowWire(); } }; }
(()=>{ try{
  vxOn("workout",rstOnWorkout);
  vxRemind(rstRemind);
  vxRoute("reset",()=>{ rstOpen(); });
  /* the reset's plan says why: the cause up top */
  const _pw=planWhy; planWhy=function(s){ return s&&s.reset?{tag:"Reset",cls:"ok",txt:s.relief}:_pw.apply(this,arguments); };
  /* Workout complete gets the reminder row above Continue */
  const _dd=drawDoneFloat; drawDoneFloat=function(){ const r=_dd.apply(this,arguments); try{
      rstRowWire.seen=false; const row=rstDoneRow(), btn=$("doneW"); if(row&&btn){ btn.insertAdjacentHTML("beforebegin",row); rstRowWire(); } }catch(e){ console.warn(e); }
    return r; };
  /* the Recover tab: a tab tap goes home; the back swipe leaves a view for the home */
  const _st=setTab; setTab=function(t){ try{ if(t==="recover"){ const was=typeof TAB!=="undefined"?TAB:null, inT=$("app").classList.contains("train");
      if(was==="recover"&&!inT&&rcvS().v!=="home"){ rcvS().v="home"; rcvS().ask=false; renderRecover(); return; }
      if(was!=="recover") { rcvS().v="home"; rcvS().ask=false; rcvS().editKg=false; } } }catch(e){} return _st.apply(this,arguments); };
  const _gb=goBack; goBack=function(){ try{ if(typeof TAB!=="undefined"&&TAB==="recover"&&rcvS().v!=="home"&&!rcvBusy()){ rcvGo("home"); return true; } }catch(e){} return _gb.apply(this,arguments); };
}catch(e){ console.warn("Ossa: recover hooks",e); } })();
