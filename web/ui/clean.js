/* =========================================================
   QUIT TRACKER (19 Oct, Focus lab). First a porn-only clean streak; then (Andrej, 19 Oct: "instead of quitting porn,
   make it like an addiction overview in general") one streak per habit you're quitting, under one overview.
   Kinds: porn, nicotine or vaping, alcohol, weed, doomscrolling, gaming, junk food and sugar, gambling, or your own.
   S.clean = {v:2, habits:[habit], cur:id}; each habit = {id, kind, name, …the fields below}. The old single streak
   becomes the first habit (kind "porn"). Everything below works on the current habit (clS()).
   Prefix cl*. Function declarations only.
   Quitting porn, as an opt-in Focus tool (never in the intro). Copy stays clinical; share cards never name it.
   Discreet mode renames it "Willpower" everywhere. Every clean day earns aura; a relapse costs it and can drop the level.
   - S.clean = {start, best, total, granted (full days already paid), ms:[days], urges:{date,n}, dimUntil, discreet,
                reasons:[3], log:[{at,days,lost,trig}], earned, pendMs}
   - Views (focus.js fcView): "clean" (the streak, or the opt-in), "urge", "relapse", "relapsed", "milestone".
   - Aura: +10 a clean day (paid on open for every full day since), milestones 3/7/14/30/60/90 → +25/50/100/200/300/500,
     an urge beaten +15 (3 a day), a relapse −min(400, 20 × days) through auraLose (the level can drop), +5 for an honest log.
   ========================================================= */
function clKinds(){ return [
  {k:"porn",n:"Porn",d:"Willpower",why:["I want my energy and focus back."]},
  {k:"nicotine",n:"Nicotine & vaping",why:["I want to breathe easy again.","My money, not theirs."]},
  {k:"alcohol",n:"Alcohol",why:["Clear mornings.","I'm better without it."]},
  {k:"weed",n:"Weed",why:["I want my drive back.","Clear head, real sleep."]},
  {k:"socials",n:"Doomscrolling",why:["My time is mine.","I want to be here, not on a feed."]},
  {k:"gaming",n:"Gaming",why:["Level up real life.","Sleep before 1am."]},
  {k:"sugar",n:"Junk food & sugar",why:["Fuel, not filler.","Steady energy all day."]},
  {k:"gambling",n:"Gambling",why:["My money stays mine.","No more chasing."]},
  {k:"custom",n:"Something else",why:["I want my life back."]}]; }
function clKind(k){ return clKinds().find(x=>x.k===k)||clKinds()[8]; }
function clNew(kind,name){ return {id:"h"+Date.now().toString(36),kind,name:name||"",start:null,best:0,total:0,granted:0,ms:[],urges:{date:"",n:0},dimUntil:null,discreet:kind==="porn",reasons:[],log:[],earned:0}; }
function clRoot(){
  const C=S.clean;
  if(C&&C.v===2&&Array.isArray(C.habits)) return C;
  const R={v:2,habits:[],cur:null};
  if(C&&typeof C==="object"&&C.start){ const h=Object.assign(clNew("porn"),C); delete h.v; h.kind="porn"; R.habits.push(h); R.cur=h.id; }
  S.clean=R; try{ save(); }catch(e){} return R;
}
function clCur(id){ const R=clRoot(); if(id) R.cur=id; return R.habits.find(h=>h.id===R.cur)||null; }
/* the habit the screens work on (a fresh draft while you're picking one) */
function clS(){ const h=clCur(); if(h) return h; return clS.draft||(clS.draft=clNew("custom")); }
function clName(h){ h=h||clS(); const K=clKind(h.kind); return h.discreet&&K.d?K.d:h.kind==="custom"&&h.name?h.name:K.n; }
function clDimAny(){ try{ return clRoot().habits.some(h=>h.dimUntil&&h.dimUntil>Date.now()); }catch(e){ return false; } }
function clMs(){ return [[1,0],[3,25],[7,50],[14,100],[30,200],[60,300],[90,500]]; }
function clDays(h){ const C=h||clS(); return C.start?Math.max(0,Math.floor((Date.now()-C.start)/864e5)):0; }
function clGrant(n,src){ const C=clS(); try{ const r=auGrant(n,src); C.earned=(+C.earned||0)+n; return r; }catch(e){ return null; } }
/* pay every full clean day since the last payment, and any milestone reached */
function clCatchUpAll(){ const R=clRoot(), cur=R.cur; R.habits.forEach(h=>{ R.cur=h.id; clCatchUp(); }); R.cur=cur; }
function clCatchUp(){
  const C=clS(); if(!C.start) return;
  const d=clDays(); let paid=+C.granted||0;
  if(d>paid){ const n=d-paid; clGrant(10*n,"clean days"); C.total=(+C.total||0)+n; C.granted=d; }
  clMs().forEach(([m,x])=>{ if(d>=m&&!C.ms.includes(m)){ C.ms.push(m); if(x){ clGrant(x,`${m} days free`); } C.pendMs=m; } });
  if(d>(+C.best||0)) C.best=d;
  save();
}
function clPad(n){ return String(n).padStart(2,"0"); }
function clTimer(){ const C=clS(); if(!C.start) return "0d 00:00:00"; const s=Math.floor((Date.now()-C.start)/1000), d=Math.floor(s/86400); return `<b>${d}d</b> ${clPad(Math.floor(s%86400/3600))}:${clPad(Math.floor(s%3600/60))}:${clPad(s%60)}`; }
function clDim(){ const C=clS(); return !!(C.dimUntil&&C.dimUntil>Date.now()); }
function clPathHTML(d,fresh){
  const M=clMs(), nx=M.find(([m])=>m>d);
  return `<div class="cl-path">${M.map(([m],i)=>`<span class="cl-node ${d>=m?"on":nx&&nx[0]===m?"next":""}${fresh===m?" fresh":""}"><i></i><small>${m}</small></span>${i<M.length-1?`<em class="${d>=M[i+1][0]?"on":""}"></em>`:""}`).join("")}</div>
    ${nx?`<p class="cl-nx">Day ${nx[0]}: +${nx[1]} aura · ${nx[0]-d} to go</p>`:`<p class="cl-nx">Every milestone reached.</p>`}`;
}
function clOrb(){ const A=S.aura||{xp:0}, dim=clDim(); return `<div class="cl-orb${dim?" dim":""}"><b>${Math.floor(A.xp||0).toLocaleString("en-GB")}</b><small>aura</small></div>${dim?`<p class="cl-dim">Glow dimmed · back tomorrow</p>`:""}`; }

/* ---------- the streak screen (and the opt-in) ---------- */
/* the overview: every habit you're quitting, and "Quit something" */
function clOverview(b){
  const R=clRoot(); clCatchUpAll();
  let lv=1; try{ lv=auView().lv; }catch(e){}
  const tot=R.habits.reduce((a,h)=>a+(+h.earned||0),0);
  b.innerHTML=`<div class="u-screen cl-v">
    <div class="ey-top"><span></span><div><h1 class="u-h1">Break free</h1><p class="ey-sub">Every clean day earns aura. A relapse costs it.</p></div><span class="ey-hex"><b>${lv}</b></span></div>
    ${R.habits.length?`<div class="cl-list">${R.habits.map(h=>{ const d=clDays(h), nx=clMs().find(([m])=>m>d), dim=h.dimUntil&&h.dimUntil>Date.now();
      return `<button class="cl-h${dim?" dim":""}" data-ch="${h.id}"><span class="cl-hd"><b>${d}</b><small>day${d===1?"":"s"}</small></span>
        <span class="cl-ht"><b>${uiEsc(clName(h))}</b><small>${dim?"Glow dimmed · back tomorrow":nx?`Day ${nx[0]}: +${nx[1]} aura`:"Every milestone reached"} · best ${Math.max(+h.best||0,d)}</small></span>${UI_IC.chev}</button>`; }).join("")}</div>
      <p class="cl-sum">${tot.toLocaleString("en-GB")} aura earned by staying clean</p>`
    :`<section class="cl-card"><p class="cl-lead">Pick what you want to quit. Each one gets its own streak, urge help and milestones.</p><p>Only you see this. Nothing leaves your phone.</p></section>`}
    <span class="u-eyebrow">${R.habits.length?"Quit something else":"What do you want to quit?"}</span>
    <div class="cl-kinds">${clKinds().filter(K=>K.k==="custom"||!R.habits.some(h=>h.kind===K.k)).map(K=>`<button class="cl-t" data-kind="${K.k}">${uiEsc(K.n)}</button>`).join("")}</div>
  </div>`;
  b.querySelectorAll("[data-ch]").forEach(x=>x.onclick=()=>{ Pulse.buzz(8); clCur(x.dataset.ch); save(); mindGo("clean:"+x.dataset.ch); });
  b.querySelectorAll("[data-kind]").forEach(x=>x.onclick=()=>{ Pulse.buzz(8); clS.draft=clNew(x.dataset.kind); clOptIn.r=null; mindGo("clean:new"); });
}
function clView(b,v){
  const arg=String(v||"").split(":")[1]||"";
  if(!arg) return clOverview(b);
  if(arg==="new") return clOptIn(b);
  const h=clCur(arg); if(!h){ return clOverview(b); }
  const C=clS();
  if(!C.start) return clOptIn(b);
  clCatchUp();
  if(C.pendMs){ const m=C.pendMs; C.pendMs=null; save(); if(m>1){ mindGo("milestone:"+m); return; } }
  try{ uiEsc; }catch(e){}
  const d=clDays(), earned=+C.earned||0; let lv=1; try{ lv=auView().lv; }catch(e){}
  b.innerHTML=`<div class="u-screen cl-v">
    <div class="ey-top"><span></span><div><h1 class="u-h1">${uiEsc(clName())}</h1><p class="ey-sub">+10 aura for every clean day</p></div><span class="ey-hex"><b>${lv}</b></span></div>
    <section class="cl-card"><div class="ey-row"><span class="u-eyebrow">${C.discreet?"Holding for":"Free for"}</span>${clKind(C.kind).d?`<button class="cl-pill" id="clDis">Discreet ${C.discreet?"on":"off"}</button>`:""}</div>
      <p class="cl-time" id="clTime">${clTimer()}</p>${clPathHTML(d)}</section>
    ${clOrb()}
    <div class="cl-stats"><span><b>${Math.max(+C.best||0,d)}</b>Best</span><span><b>${+C.total||0}</b>Clean days</span><span><b>${earned.toLocaleString("en-GB")}</b>Aura earned</span></div>
    <button class="u-btn lime block" id="clUrge">I feel an urge</button>
    <button class="u-link cl-rel" id="clRel">I relapsed</button>
    <button class="u-link cl-rel" id="clAll">All habits ›</button>
  </div>`;
  const dz=$("clDis"); if(dz) dz.onclick=()=>{ C.discreet=!C.discreet; save(); Pulse.buzz(5); clView(b,"clean:"+C.id); };
  $("clAll").onclick=()=>{ Pulse.buzz(6); mindGo("clean"); };
  $("clUrge").onclick=()=>{ Pulse.buzz(8); mindGo("urge"); };
  $("clRel").onclick=()=>{ Pulse.buzz(6); mindGo("relapse"); };
  clearInterval(clView.t); clView.t=setInterval(()=>{ const el=$("clTime"); if(!el){ clearInterval(clView.t); return; } el.innerHTML=clTimer(); },1000);
}
function clOptIn(b){
  const C=clS.draft&&!clS.draft.start?clS.draft:clS(), K=clKind(C.kind), R=clOptIn.r||(clOptIn.r=["","",""]);
  b.innerHTML=`<div class="u-screen cl-v">
    <div class="ey-top"><span></span><div><h1 class="u-h1">Quit ${uiEsc(C.kind==="custom"?"something":K.n.toLowerCase())}</h1><p class="ey-sub">Opt in. Only you see this.</p></div><span></span></div>
    <section class="cl-card">${C.kind==="custom"?`<span class="u-eyebrow">What are you quitting?</span><input class="mm-in cl-in" id="clNm" maxlength="40" placeholder="e.g. Energy drinks" value="${uiEsc(C.name||"")}">`:""}
      <p class="cl-lead">Each clean day earns aura. A relapse costs it.</p>
      <span class="u-eyebrow">Why you're starting (optional)</span>
      ${[0,1,2].map(i=>`<input class="mm-in cl-in" data-cr="${i}" maxlength="80" placeholder="${uiEsc(K.why[i]||"Another reason")}" value="${uiEsc(R[i]||"")}">`).join("")}
      ${K.d?`<label class="cl-tog"><input type="checkbox" id="clDisc" ${C.discreet?"checked":""}> Discreet mode: call it "${K.d}"</label>`:""}</section>
    <button class="u-btn lime block" id="clGo">Start my streak</button><button class="u-link cl-rel" id="clAll">Back</button></div>`;
  const nm=$("clNm"); if(nm) nm.oninput=()=>{ C.name=nm.value.slice(0,40); };
  $("clAll").onclick=()=>{ Pulse.buzz(6); mindGo("clean"); };
  b.querySelectorAll("[data-cr]").forEach(x=>x.oninput=()=>{ R[+x.dataset.cr]=x.value.slice(0,80); });
  const dc=$("clDisc"); if(dc) dc.onchange=e=>{ C.discreet=!!e.target.checked; };
  $("clGo").onclick=()=>{ if(C.kind==="custom"&&!String(C.name||"").trim()){ toast("Name what you're quitting."); return; }
    C.reasons=R.map(x=>String(x||"").trim()).filter(Boolean).slice(0,3); C.start=Date.now(); C.granted=0;
    const Rt=clRoot(); if(!Rt.habits.includes(C)) Rt.habits.push(C); Rt.cur=C.id; clS.draft=null; save();
    try{ hap("success"); track("clean_start",{kind:C.kind}); }catch(e){} mindGo("clean:"+C.id); };
}

/* ---------- the urge: ride it out ---------- */
function clUrge(b){
  const C=clS(), d=clDays(), today=dkey(0); if(C.urges.date!==today) C.urges={date:today,n:0};
  const rs=C.reasons&&C.reasons.length?C.reasons:[clKind(C.kind).why[0],`Day ${d}. Don't throw it away.`];
  b.innerHTML=`<div class="u-screen cl-v cl-urge">
    <span class="u-eyebrow cl-red">Urge · ride it out</span><h1 class="u-h1">Breathe first</h1>
    <p class="ey-sub">Urges rise and pass like a wave. Stay with this minute.</p>
    <div class="cl-br" id="clBr"><i></i><b id="clLeft">60</b><small id="clCue">Breathe in</small></div>
    <span class="u-eyebrow">Why you started</span>
    <div class="cl-rs">${rs.map(r=>`<p>${uiEsc(r)}</p>`).join("")}</div>
    <button class="u-btn lime block" id="clPass" disabled>The urge passed · +15 aura</button>
    <button class="u-link" id="clLock">Still strong? Lock in for 25 min</button></div>`;
  const t0=Date.now(); clearInterval(clUrge.t);
  clUrge.t=setInterval(()=>{ const el=$("clLeft"); if(!el){ clearInterval(clUrge.t); return; } const s=Math.max(0,60-Math.floor((Date.now()-t0)/1000)), ph=((Date.now()-t0)/1000)%10;
    el.textContent=s; $("clCue").textContent=s?ph<4?"Breathe in":"Breathe out":"You made it through the peak."; if(!s){ clearInterval(clUrge.t); $("clPass").disabled=false; try{ hap("success"); }catch(e){} } },250);
  $("clPass").onclick=()=>{ const r=$("clPass").getBoundingClientRect();
    if(C.urges.n<3){ C.urges.n++; clGrant(15,"urge beaten"); save(); if(typeof fgPop==="function") fgPop(r.left+r.width/2,r.top,"+15 aura"); setTimeout(()=>mindGo("clean:"+C.id),700); }
    else { $("clPass").textContent="Max 3 a day. Proud of you."; setTimeout(()=>mindGo("clean:"+C.id),1200); } };
  $("clLock").onclick=()=>{ try{ mmUi().pick=25; }catch(e){} mindGo("monk:setup"); };
}

/* ---------- the relapse ---------- */
function clLoss(d){ return Math.min(400,20*d); }
function clRelapse(b){
  const C=clS(), d=clDays(), loss=clLoss(d), A=S.aura||{xp:0}, lv0=auLevel(A.xp||0).n, lv1=auLevel(Math.max(0,(A.xp||0)-loss)).n, T=clRelapse.t||(clRelapse.t=new Set());
  const trig=["Boredom","Late night","Stress","Lonely","Scrolling","In bed"];
  b.innerHTML=`<div class="u-screen cl-v">
    <h1 class="u-h1">It happens.</h1><p class="ey-sub">Being honest is how you get stronger. Here's what changes.</p>
    <div class="cl-rows">
      <div class="cl-r bad"><span>Streak</span><b>${d} day${d===1?"":"s"} → 0</b></div>
      <div class="cl-r bad"><span>Aura</span><b>−${loss}</b></div>
      <div class="cl-r bad"><span>Aura level · Mind</span><b>${lv1<lv0?`LV ${lv0} → ${lv1}`:`LV ${lv0} (close to dropping)`}</b></div>
      <div class="cl-r bad"><span>Glow</span><b>Dimmed for 24 hours</b></div>
      <div class="cl-r good"><span>Best streak · clean days</span><b>Kept</b></div></div>
    <span class="u-eyebrow">What set it off? (+5 aura for being honest)</span>
    <div class="cl-trig">${trig.map(t=>`<button class="cl-t${T.has(t)?" on":""}" data-tg="${t}">${t}</button>`).join("")}</div>
    <button class="u-btn block cl-reset" id="clReset">Reset my streak</button>
    <button class="u-link" id="clCancel">Cancel</button></div>`;
  b.querySelectorAll("[data-tg]").forEach(x=>x.onclick=()=>{ const t=x.dataset.tg; T.has(t)?T.delete(t):T.add(t); x.classList.toggle("on"); Pulse.buzz(5); });
  $("clCancel").onclick=()=>{ T.clear(); mindGo("clean:"+C.id); };
  $("clReset").onclick=()=>{
    const trigs=[...T]; T.clear();
    C.best=Math.max(+C.best||0,d); C.log.push({at:Date.now(),days:d,lost:loss,trig:trigs}); if(C.log.length>60) C.log.shift();
    C.start=Date.now(); C.granted=0; C.ms=[]; C.dimUntil=Date.now()+864e5;
    const r=auraLose(loss,{src:"relapse"}); if(trigs.length) clGrant(5,"honest log");
    save(); try{ track("clean_reset",{d}); }catch(e){}
    clRelapse.res={d,loss,lv0:r.lv0,lv:auLevel((S.aura&&S.aura.xp)||0).n,trigs}; mindGo("relapsed"); };
}
function clRelapsed(b){
  const C=clS(), R=clRelapse.res||{d:0,loss:0,lv0:1,lv:1,trigs:[]}, down=R.lv<R.lv0;
  b.innerHTML=`<div class="u-screen cl-v">
    <h1 class="u-h1">Day 0 · Start again tonight</h1><p class="ey-sub">Your best is ${+C.best||0} days. Beat it.</p>
    <div class="cl-orb red" id="clOrbR"><b id="clOrbN">${(Math.floor((S.aura&&S.aura.xp)||0)+R.loss).toLocaleString("en-GB")}</b><small>aura</small></div>
    ${down?`<p class="cl-down">LEVEL DOWN · LV ${R.lv}</p>`:""}
    <p class="cl-line">${R.trigs.length?"+5 for being honest. ":""}${down?`Aura level dropped to ${R.lv}. `:""}Glow dimmed until tomorrow.</p>
    <section class="cl-card"><span class="u-eyebrow">Tonight</span><p>Phone out of the bedroom.${R.trigs.includes("Late night")?" Late nights are when it's hardest: lights out a little earlier.":""}</p></section>
    <button class="u-btn primary block" id="clBack">Back</button></div>`;
  const el=$("clOrbN"), to=Math.floor((S.aura&&S.aura.xp)||0); if(el&&typeof fxCount==="function") fxCount(el,to+R.loss,to,1200,v=>v.toLocaleString("en-GB"));
  setTimeout(()=>{ const o=$("clOrbR"); if(o){ o.classList.remove("red"); o.classList.add("dim"); } },1300);
  if(down){ try{ hap("heavy"); Pulse.buzz([30,60,30,60,60]); }catch(e){} }
  $("clBack").onclick=()=>{ Pulse.buzz(6); mindGo("clean:"+C.id); };
}

/* ---------- a milestone ---------- */
function clMilestone(b,v){
  const m=+(String(v).split(":")[1])||clDays(), x=(clMs().find(y=>y[0]===m)||[0,0])[1];
  const say={3:"Three days. The hardest part is behind you.",7:"A full week of saying no.",14:"Two weeks of saying no.",30:"A month. This is who you are now.",60:"Two months strong.",90:"Ninety days. Rewired."}[m]||"Keep going.";
  b.innerHTML=`<div class="u-screen cl-v cl-ms">${clPathHTML(m,m)}
    <b class="cl-msx">+${x} aura</b><h1 class="u-h1">${m} days</h1><p class="ey-sub">${say}</p>
    <button class="u-btn lime block" id="clShare">Share</button><button class="u-link" id="clBack">Back</button></div>`;
  $("clShare").onclick=()=>clShare(m,x);
  $("clBack").onclick=()=>mindGo("clean:"+clS().id);
  try{ hap("success"); }catch(e){}
}
/* always discreet: "Willpower", never what it's about */
function clShare(m,x){
  const c=document.createElement("canvas"); c.width=1080; c.height=1920; const g=c.getContext("2d");
  const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim()||"white";
  g.fillStyle=css("--bg"); g.fillRect(0,0,1080,1920);
  for(let i=0;i<160;i++){ g.globalAlpha=0.2+((i*37)%60)/100; g.fillStyle=css("--text-2"); g.beginPath(); g.arc((i*173)%1080,(i*311)%1920,(i%4?1.2:2.4),0,7); g.fill(); }
  g.globalAlpha=1; g.textAlign="center";
  g.fillStyle=css("--glow"); g.font="800 40px Inter, sans-serif"; g.fillText("OSSA · WILLPOWER",540,560);
  g.fillStyle=css("--text-1"); g.font="italic 900 300px Inter, sans-serif"; g.fillText(String(m),540,900);
  g.font="800 64px Inter, sans-serif"; g.fillText("days strong.",540,1000);
  g.fillStyle=css("--glow"); g.font="900 64px Inter, sans-serif"; g.fillText(`+${x} aura`,540,1160);
  const nx=clMs().find(y=>y[0]>m); if(nx){ g.fillStyle=css("--text-2"); g.font="600 48px Inter, sans-serif"; g.fillText(`Next: ${nx[0]} days`,540,1260); }
  if(typeof cdShareImage==="function") cdShareImage(c,"ossa-willpower.png");
}

/* ---------- wiring: the views, the Focus home chip, the Eyes card, catching up on open ---------- */
function clReg(){ try{
  fcView("clean",{render:(b,M,v)=>clView(b,v),leave:()=>clearInterval(clView.t)});
  fcView("urge",{render:b=>clUrge(b),leave:()=>clearInterval(clUrge.t),full:true});
  fcView("relapse",{render:b=>clRelapse(b)});
  fcView("relapsed",{render:b=>clRelapsed(b)});
  fcView("milestone",{render:(b,M,v)=>clMilestone(b,v),full:true}); }catch(e){ console.warn("Ossa: clean views",e); } }
clReg();
(()=>{ const _h=fcHome; fcHome=function(b,M,more){ const v=_h.apply(this,arguments);
  try{ if(!more&&b){ const u=b.querySelector(".fc-under"); if(u){ const C=clS();
      const H=clRoot().habits, one=H.length===1?H[0]:null;
      u.insertAdjacentHTML("beforeend",`<button class="fc-chip cl-chip${clDimAny()?" dim":""}" data-fc="clean">${one?`${uiEsc(clName(one).split(" ")[0])} · ${clDays(one)}d`:H.length?`Quitting · ${H.length}`:"Break free"}</button>`);
      u.querySelector(".cl-chip").onclick=()=>{ Pulse.buzz(8); mindGo("clean"); }; } } }catch(e){ console.warn(e); }
  return v; }; })();
(()=>{ const _e=eyView; eyView=function(b){ const v=_e.apply(this,arguments);
  try{ const H=clRoot().habits, go=b.querySelector(".ey-go"); if(go) go.insertAdjacentHTML("beforebegin",`<button class="ey-dir cl-card-row" data-fc="clean"><span><b>Break free</b> · ${H.length?H.map(h=>`${uiEsc(clName(h))} ${clDays(h)}d`).join(" · "):"quit a habit"}</span><em>+10 aura a day</em></button>`);
    const r=b.querySelector(".cl-card-row"); if(r) r.onclick=()=>{ Pulse.buzz(8); mindGo("clean"); }; }catch(e){}
  return v; }; })();
vxOn("fg",()=>{ try{ if(S.clean) clCatchUpAll(); }catch(e){} });
window.addEventListener("load",()=>setTimeout(()=>{ try{ if(S.clean) clCatchUpAll(); }catch(e){} },1200));
