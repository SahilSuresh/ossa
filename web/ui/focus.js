/* =========================================================
   FOCUS (Ossa 2.0, Phase 3 "Focus"): the Focus tab's home and its view dispatcher. Owner: package P5.
   Prefix fc*. Included LAST of the web/ui files (after heartbeat.js), so its goBack wrapper is the
   outermost. Design: design/redesign-v2/images/focus_aura.png, in Ossa's tokens (cyan is Focus).
   Start-up rule: function declarations only, no top-level const or let; state on function
   properties; never redeclare a name that web/ossa.html or another web/ui file declares.
   The only code that runs at include time: the 'home' registration and the renderMind, go and
   goBack wrappers at the bottom (every ossa.html const is ready by then; boot runs after).

   THE FOCUS SCREEN is the old Mind panel (#mind, .mindv). The Focus tab opens it at once on its
   home (uiFocusOpen in shell.js: no zoom into the head, no fade). Its views, by MIND.view:
     'home'            fcHome (here)
     'monk' 'focus'    Monk Mode (monk.js): setup, timer or finish; 'focus' is the setup alias
     'beat'            Heartbeat (heartbeat.js)
     anything else     the legacy screens in ossa.html: 'checkin', 'wind', 'reflect', 'support',
                       'breath' / 'breath:<even|box|exhale|478>' and 'calm' (the Breathe tool),
                       'learn:<id>'
   API
   fcView(name, {render(b, M, v), leave(next), full})   register a view (render is required).
                     b: #mindBody, M: mindState(), v: the full view string ('monk:done' finds 'monk').
                     leave(next) runs once when the screen moves to another view (next) or Focus
                     closes (next null). It does not run on a re-render of the same view.
                     full (bool, or a function of v): no tab bar, the screen runs to the bottom
                     (.app.fcfull, recomputed on every render, cleared on leave).
                     fcView(name) alone returns the registered view, or null.
   fcLeave(next)     leave the view on show (closeMind calls it first, on both ways out)
   fcHome(b, M)      the Focus home
   Wraps (one each): go (the body search's [data-go] click: body-part tokens only, see the bottom),
                     renderMind (the dispatcher: rdBrStop, .brv off, the previous view's leave(),
                     the registered view or the legacy one, then the header: '‹ Focus' back to the
                     home on every sub-view, no header on the home (.fh)) and goBack (a sub-view goes
                     back to the home; the plain home returns false; a panel, review, lesson,
                     timeline or Sore spots on top goes to the rest of the chain).
   Reads (all guarded): auView, auPreview, auRules, auToday, auSeen (aura.js); hlHero, hlLevel
                     (halo.js); mmRun, mmUnseen and S.monk (monk.js); beatSrc (heartbeat.js).
   Saved: S.mind.ui.fcSeed (the one-time "Your past breathing and focus counted." line).
   ========================================================= */

/* ---------- the view registry ---------- */
function fcView(name,def){
  const m=fcView.m||(fcView.m={}); name=String(name==null?"":name);
  if(!name) return null;
  if(arguments.length<2) return m[name]||null;
  if(def&&typeof def.render==="function") m[name]=def; else delete m[name];
  return m[name]||null;
}
/* the view a MIND.view string shows: an exact name first, then the part before ':' */
function fcViewOf(v){ const m=fcView.m||{}; v=String(v==null?"":v); return m[v]||m[v.split(":")[0]]||null; }
function fcFull(d,v){ try{ return !!(d&&(typeof d.full==="function"?d.full(v):d.full)); }catch(e){ return false; } }
function fcLeave(next){
  const v=fcLeave.v; fcLeave.v=null;
  if(v!=null){ const d=fcViewOf(v); if(d&&typeof d.leave==="function"){ try{ d.leave(next==null?null:next); }catch(e){ console.warn("Ossa: Focus leave "+v,e); } } }
  try{ $("app").classList.remove("fcfull"); }catch(e){}
}

/* ---------- small pieces ---------- */
/* the row icons: the breath tool's own shapes (square, two circles, a circle, a triangle), Calm's creature, a seated figure */
function fcIc(k){
  const I=fcIc.i||(fcIc.i={
    monk:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5.6" r="2.3"/><path d="M12 9.4v4.4M7.2 12.4l4.8 1.4 4.8-1.4M4.5 18.6c2.1-2 4.6-2.9 7.5-2.9s5.4.9 7.5 2.9"/></svg>`,
    box:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="4"/></svg>`,
    even:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="12" r="5.2"/><circle cx="15" cy="12" r="5.2"/></svg>`,
    exhale:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.2"/><circle cx="12" cy="12" r="2.6"/></svg>`,
    "478":`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5.2 19.4 18H4.6z"/></svg>`,
    calm:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6"/><ellipse cx="12" cy="12" rx="10" ry="3.4"/></svg>`,
    more:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="4.5" width="6" height="6" rx="1.6"/><rect x="13.5" y="4.5" width="6" height="6" rx="1.6"/><rect x="4.5" y="13.5" width="6" height="6" rx="1.6"/><rect x="13.5" y="13.5" width="6" height="6" rx="1.6"/></svg>`,
    check:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M8.4 12.2l2.5 2.5 4.8-5"/></svg>`,
    refl:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19.5 6 15 15.6 5.4a2 2 0 0 1 2.9 2.9L9 18z"/><path d="M13.8 7.2l2.9 2.9"/></svg>`
  });
  return I[k]||(typeof UI_IC!=="undefined"&&UI_IC[k])||"";
}
function fcEsc(t){ return typeof uiEsc==="function"?uiEsc(t):String(t==null?"":t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
function fcAura(){ try{ return typeof auView==="function"?auView():null; }catch(e){ console.warn(e); return null; } }
function fcXp(kind,min){
  try{ if(typeof auPreview==="function"){ const p=auPreview(kind,min); return {txt:p.txt||"",max:!(p.xp>0)}; } }catch(e){ console.warn(e); }
  return {txt:"",max:false};
}
function fcMonkRun(){ try{ return typeof mmRun==="function"?(mmRun()||null):null; }catch(e){ return null; } }
function fcMonkUnseen(){ try{ if(typeof mmUnseen==="function") return mmUnseen()||null; const L=S.monk&&S.monk.last; return L&&typeof L==="object"&&!L.seen&&+L.min>0?L:null; }catch(e){ return null; } }
function fcMonkPre(){ try{ const p=S.monk&&+S.monk.pre; return p>0?p:25; }catch(e){ return 25; } }
function fcMonkLeftTxt(run){
  const st=+run.start||+run.id||0, end=st+(+run.plan||0)*60000, left=end-Date.now();
  return left>0?`Monk Mode · ${Math.ceil(left/60000)} min left`:"Monk Mode · time's up";
}
function fcUi(M){ M=M||mindState(); if(!M.ui||typeof M.ui!=="object") M.ui={}; return M.ui; }

/* ---------- the hero: your own head and its aura, a still from the body's renderer (halo.js) ----------
   Drawn after the first paint so the tab opens at once; the last still is shown straight away while its
   level, figure and finish still match. No WebGL (or no still): a soft cyan ring and no figure. */
function fcHeroLv(V){ try{ if(typeof hlLevel==="function") return hlLevel(); }catch(e){} return V?V.lv:1; }
function fcHeroKey(V){
  let rim=""; try{ if(typeof rimColor==="function") rim=Array.from(rimColor(),x=>(+x).toFixed(2)).join(","); }catch(e){}
  return JSON.stringify([fcHeroLv(V),S.body||"",S.finish||"",rim,Math.min(2.5,window.devicePixelRatio||1),uiSafe(()=>typeof bxLookKey==="function"?bxLookKey():"","")]);
}
function fcHeroAlt(V){ return `Your head with its aura, Aura level ${V?V.lv:1}`; }
function fcHeroDraw(){
  const box=$("fcHeroBox"); if(!box||!box.isConnected||!MIND.open||String(MIND.view)!=="home") return;
  const w=Math.round(box.clientWidth), h=Math.round(box.clientHeight); if(w<40||h<40) return;
  const V=fcAura(), k=fcHeroKey(V), m=fcHero.m;
  if(m&&m.k===k&&m.w===w&&m.h===h&&box.querySelector("img")) return;   // already showing this one
  let url=null; try{ if(typeof hlHero==="function") url=hlHero(w,h); }catch(e){ console.warn(e); }
  if(!url){ box.classList.remove("wait"); if(!box.querySelector("img")) box.classList.add("flat"); return; }
  fcHero.m={k,w,h,url};
  let img=box.querySelector("img");
  if(!img){ img=document.createElement("img"); img.className="fc-hero-img"; img.alt=fcHeroAlt(V); img.decoding="async"; box.prepend(img); }
  if(img.getAttribute("src")!==url) img.src=url;
  box.classList.remove("wait","flat");
}
function fcHero(V){
  const m=fcHero.m, hit=m&&m.k===fcHeroKey(V);
  return `<div class="fc-hero-box${hit?"":" wait"}" id="fcHeroBox">${hit?`<img class="fc-hero-img" src="${m.url}" alt="${fcEsc(fcHeroAlt(V))}" decoding="async">`:""}<i class="fc-hero-glow" aria-hidden="true"></i></div>`;
}
function fcHeroLater(){
  const n=fcHeroLater.n=(fcHeroLater.n||0)+1;
  const go=()=>{ if(fcHeroLater.n!==n) return; fcHeroLater.n++; try{ fcHeroDraw(); }catch(e){ console.warn(e); } };
  requestAnimationFrame(()=>setTimeout(go,0)); setTimeout(go,200);   // after the first paint (the timer covers a page with no frames)
}

/* ---------- the Focus home ---------- */
function fcHome(b,M,more){
  fcHomeLeave();
  M=M||mindState();
  const V=fcAura(), c=todayCheck(), act=mindAction(), ins=mindInsights(), wk=mindWeek(M), low=lowMoodPatch();
  const run=fcMonkRun(), last=fcMonkUnseen(), hasMonk=!!fcView("monk"), hasBeat=!!fcView("beat");
  const ui=fcUi(M), seed=!!(V&&V.seed>0&&!ui.fcSeed);

  /* safety first: the care card stays on top when your mood has been low for a while */
  const care=low?`<div class="mv-card mv-care fc-care"><b>Your mood has been low for a while.</b><p>That's a lot to carry on your own. Talking to someone you trust, or your GP, can really help.</p><button class="mv-link" data-fc="support">Support and helplines ›</button></div>`:"";
  const head=`<header class="u-top"><div class="u-top-tx"><div class="u-eyebrow">${uiShortDate()}</div><h1 class="u-h1">Focus</h1></div></header>`;

  /* your Aura level */
  let lvl="";
  if(V){
    const right=V.xp>0||V.lv>1?`${V.to} aura to level ${V.next}`:"Breathe or focus to start";
    lvl=`<div class="fc-lv" role="img" aria-label="${fcEsc(V.aria+(V.fresh?". New level":""))}">
      <span class="u-bar" aria-hidden="true"><i style="width:${(Math.max(0,Math.min(1,V.f))*100).toFixed(1)}%"></i></span>
      <span class="fc-lv-l" aria-hidden="true"><span><b>Aura level ${V.lv}</b>${V.fresh?`<em class="fc-new">New level</em>`:""}</span><span>${right}</span></span>
    </div>${seed?`<p class="fc-seed">Your past breathing and focus counted.</p>`:""}`;
  }
  const pill=V&&V.stage?`<span class="fc-pill${V.stage.crystal?" on":""}"><i aria-hidden="true"></i>${fcEsc(V.stage.pill)}</span>`:"";
  const hero=`<section class="fc-hero" aria-label="Your aura">${fcHero(V)}${pill}</section>`;

  /* a Monk Mode session running (or finished and not seen yet) comes first */
  let live="";
  if(run) live=`<button class="u-card fc-live" data-fc="${hasMonk?"monk":"home"}"><i class="fc-live-dot" aria-hidden="true"></i><span><b id="fcMonkLeft">${fcMonkLeftTxt(run)}</b><small>${run.task?fcEsc(run.task):"Tap to go back to it"}</small></span>${UI_IC.chev}</button>`;
  else if(hasMonk&&last) live=`<button class="u-card fc-live done" data-fc="monk"><i class="fc-live-dot" aria-hidden="true"></i><span><b>Monk Mode · done</b><small>${last.xp>0?`+${Math.round(last.xp)} aura · `:""}See your session</small></span>${UI_IC.chev}</button>`;

  /* grow your aura: every aura chip is the real preview, "Max today" once the day's cap is used */
  const d=typeof RDBR!=="undefined"&&RDBR.dur>0?RDBR.dur:3, pre=fcMonkPre(), br=fcXp("breath",d);
  const nm=k=>{ try{ const t=RD_BR.find(x=>x.k===k); return t?t.n:k; }catch(e){ return k; } };
  let calmN="Float, Deep calm, Sleep drift"; try{ calmN=RD_CALM.map(x=>x.n).join(", "); }catch(e){}
  const rows=[
    {ic:"monk",go:"focus",t:"Monk Mode",s:`${pre} min · one task`,x:fcXp("monk",pre)},   // always the setup (or the running timer); the "done" card above opens the finish (22 Oct, BUG-25)
    {ic:"box",go:"breath:box",t:nm("box"),s:`4-4-4-4 · ${d} min`,x:br},
    {ic:"even",go:"breath:even",t:nm("even"),s:`5.5 in, 5.5 out · ${d} min`,x:br},
    {ic:"exhale",go:"breath:exhale",t:nm("exhale"),s:`4 in, 6 out · ${d} min`,x:br},
    {ic:"478",go:"breath:478",t:nm("478"),s:`4 in, 7 hold, 8 out · ${d} min`,x:br},
    {ic:"calm",go:"breath:float",t:"Calm sessions",s:`${calmN} · ${d} min`,x:br},
    {ic:"calm",go:"unwind",t:"Unwind",s:"Still water, fireflies, zen sand · no timer",x:{}}
  ];
  if(hasBeat){ let s="A beat at your resting heart rate"; try{ if(typeof beatSrc==="function"){ const B=beatSrc()||{}; s=B.row||(B.bpm?`${B.bpm} bpm resting · an estimate`:s); } }catch(e){}
    rows.push({ic:"heart",go:"beat",t:"Heartbeat",s,x:fcXp("breath",2),c:"var(--glow)"}); }
  const grow=`<div class="u-section-h"><span class="u-eyebrow">Grow your aura</span><button class="u-link" id="fcRules" aria-expanded="${!!fcHome.rules}" aria-controls="fcRulesB">How aura works</button></div>
    <div class="u-card fc-rules" id="fcRulesB"${fcHome.rules?"":" hidden"}>${fcRulesHTML()}</div>
    <div class="fc-rows">${rows.map(r=>`<button class="fc-row" data-fc="${r.go}"><span class="fc-row-ic"${r.c?` style="--c:${r.c}"`:""}>${fcIc(r.ic)}</span><span class="fc-row-tx"><b>${fcEsc(r.t)}</b><small>${fcEsc(r.s)}</small></span><span class="fc-row-r">${r.x.txt?`<em class="${r.x.max?"cap":""}">${r.x.txt}</em>`:""}${UI_IC.chev}</span></button>`).join("")}</div>`;

  /* the old Mind content, quieter, in its old order */
  const mind=`<div class="u-section-h"><span class="u-eyebrow">Your mind today</span></div>
    <section class="fc-mind">
      ${brainSVG(c,run?"focusing":"")}
      ${c?`<div class="mv-zones">${ZONES.filter(z=>c[z.k]!=null).map(z=>`<div class="mv-z" style="--c:${z.col}"><span>${z.name}</span><b>${z.words[c[z.k]-1]}</b><i><em style="width:${c[z.k]*20}%"></em></i></div>`).join("")}</div>
        <button class="mv-link" data-fc="checkin">Edit today's check-in</button>`
      :`<button class="mv-cta" data-fc="checkin"><b>Check in</b><span>One tap: how you feel and how you slept</span></button>`}
      <p class="mv-note">A simplified map, not real brain regions. It shows how you said you feel.</p>
    </section>
    <div class="u-section-h"><span class="u-eyebrow">One thing for your mind</span></div>
    <div class="mv-card mv-act"><p>${act.t}</p><button class="btn primary" data-fc="${act.go}">${act.b}</button></div>
    <div class="u-section-h"><span class="u-eyebrow">What's affecting your mind</span></div>
    ${ins.list.length?ins.list.map(i=>`<div class="mv-ins"><p>${i.t}</p><div class="mv-cmp">
        <span><i style="width:${Math.min(100,i.a/i.max*100)}%"></i><small>${i.al} · ${i.a.toFixed(1)}${i.unit||""}</small></span>
        <span class="b"><i style="width:${Math.min(100,i.b/i.max*100)}%"></i><small>${i.bl} · ${i.b.toFixed(1)}${i.unit||""}</small></span></div></div>`).join("")
      :`<p class="mv-note">Check in for a week or so and patterns will show up here.</p>`}
    <p class="mv-note">From ${ins.n} check-ins${M.demo?" (including demo data)":""}. Patterns in your own data, not proof of cause.</p>
    <div class="u-section-h"><span class="u-eyebrow">Tools</span></div>
    <div class="u-card u-list fc-tools">
      <button class="u-row" data-fc="wind"><span class="u-ic">${fcIc("moon")}</span><span><b>Wind-down</b><small>An evening routine for better sleep</small></span>${UI_IC.chev}</button>
      <button class="u-row" data-fc="reflect"><span class="u-ic">${fcIc("refl")}</span><span><b>Reflection</b><small>One question a day</small></span>${UI_IC.chev}</button>
    </div>
    <div class="u-section-h"><span class="u-eyebrow">Mindset</span></div>
    <p class="mv-quote">Discipline includes rest. Recovery is where you get stronger.</p>
    <div class="mv-chal">${CHALLENGES.map(ch=>{ const s=M.chal[ch.id], done=s?s.days.length:0, today=s&&s.days.includes(dkey(0));
      return `<div class="mv-ch"><div><b>${ch.t}</b><small>${s?`${done} of ${ch.n} ${ch.unit}`:ch.why}</small>
        ${s?`<div class="mv-dots">${Array.from({length:ch.n},(_,i)=>`<i class="${i<done?"on":""}"></i>`).join("")}</div>`:""}</div>
        <button class="mv-pill${today?" done":""}" data-ch="${ch.id}">${!s?"Join":today?"Done today":"Tick today"}</button></div>`; }).join("")}</div>
    <div class="u-section-h"><span class="u-eyebrow">Learn</span></div>
    <div class="mv-learn">${LEARN.map(l=>`<button class="mv-lc" data-fc="learn:${l.id}"><b>${l.t}</b><small>${l.s}</small></button>`).join("")}</div>
    <div class="u-section-h"><span class="u-eyebrow">This week</span></div>
    <div class="mv-stats"><span><b>${wk.breath}</b>min breathing</span><span><b>${wk.focus}</b>min focus</span><span><b>${wk.refl}</b>reflections</span></div>
    <footer class="mv-foot"><p>Your check-ins stay on this device. Nothing is uploaded.</p>
      <p>Ossa supports your wellbeing. It doesn't diagnose or treat anything.</p>
      <button class="mv-link" data-fc="support">Need to talk to someone? ›</button></footer>`;

  /* Andrej, 17 Oct: the home is one screen of big tiles, no reading and no scrolling. Everything else
     (XP rules, the mind map, insights, tools, challenges, lessons, the week, support) is one tap away in "More" */
  /* concept A, the orb dial (Andrej, 17 Oct): your aura as one breathing orb, the tools orbiting it.
     No body picture. The orb opens More (How aura works first); Check in and More sit under the dial */
  const sat=(pos,go,ic,t,x,c,live)=>`<button class="fc-sat ${pos}${live?" live":""}" data-fc="${go}"><span class="fc-sat-o"${c?` style="--c:${c}"`:""}>${fcIc(ic)}</span><b>${fcEsc(t)}</b>${live?`<em id="fcMonkLeft">${live}</em>`:x&&x.txt&&!x.max?`<em>${x.txt}</em>`:""}</button>`;
  /* a running (or finished, unseen) Monk session shows on its own orb, not as a card (Andrej, 17 Oct) */
  const monkLive=run?fcMonkLeftTxt(run).replace(/^Monk Mode · /,""):(hasMonk&&last?"Done · see it":"");
  const lv=V?V.lv:1;
  const tiles=`<div class="fc-dial" style="--lv:${Math.max(1,Math.min(15,lv))}">
    <i class="fc-ring" aria-hidden="true"></i>
    <button class="fc-orb" data-fc="more" aria-label="Aura level ${lv}. How aura works and more"><i class="fc-orb-g" aria-hidden="true"></i><span class="fc-orb-tx"><small>Aura</small><b>${lv}</b><small>${V&&V.stage&&V.stage.crystal?"Crystalline":"level"}</small></span></button>
    ${sat("n","breath","even","Breathe",br)}
    ${sat("e","unwind","calm","Unwind",null)}
    ${sat("s",hasMonk?"monk":"focus","monk","Monk Mode",fcXp("monk",pre),null,monkLive)}
    ${hasBeat?sat("w","beat","heart","Heartbeat",null,"var(--glow)"):sat("w","checkin","check","Check in",null)}
  </div>
  <div class="fc-under">${hasBeat?`<button class="fc-chip" data-fc="checkin">${fcIc("check")}${c?"Checked in":"Check in"}</button>`:""}<button class="fc-chip" data-fc="more">${fcIc("more")}More</button></div>`;
  if(more){
    b.innerHTML=`<div class="u-screen fc-home fc-more">${care}
      <div class="u-section-h"><span class="u-eyebrow">How aura works</span></div>
      <div class="u-card fc-rules">${fcRulesHTML()}</div>${mind}</div>`;
  } else b.innerHTML=`<div class="u-screen fc-home fc-main">${care}${head}${lvl}${tiles}</div>`;

  /* wiring */
  b.querySelectorAll("[data-fc]").forEach(x=>x.onclick=()=>{ const g=x.dataset.fc; Pulse.buzz(8); try{ Pulse.audio(); }catch(e){} mindGo(g); });
  const rb=$("fcRules"); if(rb) rb.onclick=()=>{ fcHome.rules=!fcHome.rules; Pulse.buzz(5); const p=$("fcRulesB"); if(p){ p.innerHTML=fcRulesHTML(); p.hidden=!fcHome.rules; } rb.setAttribute("aria-expanded",String(!!fcHome.rules)); };
  b.querySelectorAll("[data-ch]").forEach(x=>x.onclick=()=>{ const id=x.dataset.ch, ch=CHALLENGES.find(c=>c.id===id);
    if(!M.chal[id]){ M.chal[id]={start:dkey(0),days:[]}; toast(`Joined: ${ch.t}. Tick it off each day.`); }
    else if(!M.chal[id].days.includes(dkey(0))){ M.chal[id].days.push(dkey(0)); Pulse.chime(2); if(M.chal[id].days.length>=ch.n) toast(`${ch.t}: complete. Well done.`); }
    save(); renderMind(); });
  /* a running session's minutes stay right while you look */
  if(run) fcHome.t=setInterval(()=>{ const el=$("fcMonkLeft"), r=fcMonkRun();
    if(!el||!r||!MIND.open||String(MIND.view)!=="home"){ clearInterval(fcHome.t); fcHome.t=0; return; }
    el.textContent=fcMonkLeftTxt(r).replace(/^Monk Mode · /,""); },15000);
  /* a new level is shown once ("New level"), then counts as seen; the seeded-XP line shows once */
  try{ if(V&&V.fresh&&typeof auSeen==="function") auSeen(); }catch(e){ console.warn(e); }
  if(seed){ ui.fcSeed=1; save(); }

}
function fcHomeLeave(){ clearInterval(fcHome.t); fcHome.t=0; fcHeroLater.n=(fcHeroLater.n||0)+1; }
/* "How aura works": the numbers come from aura.js's rules; today's line from your own log */
function fcRulesHTML(){
  let R=null, T=null; try{ R=auRules(); }catch(e){} try{ T=auToday(); }catch(e){}
  if(!R) return `<p>Breathing and lock-ins grow your aura.</p>`;
  const br=T?R.br.cap-T.left.breath:0, mk=T?R.mk.cap-T.left.monk:0;
  /* 19 Oct audit: "Lock in" (not Monk Mode), the five tiers, every other way aura comes, and that a relapse can cost a level */
  return `<p><b>Levels</b> Study, Focus and Offline are skills. A session earns 3 XP a minute, +50% if you finish it, ×1.2 with a 3-day streak. Offline is time away from your phone: put it down and the timer runs. Your difficulty sets how much a level needs and what leaving costs.</p>
    <p><b>Aura is your discipline.</b> Show up daily, and it grows.</p>
    <p><b>Aura comes from</b> the nightly report (+5), today's directives, and your daily streak (+10 a day; +50 at 7, +200 at 30, +500 at 100). A day counts when you finish a session or report in.</p>
    <p><b>Tiers</b> Faint (1–4) · Steady (5–9) · Bright (10–14) · Radiant (15–19) · Ascended (20+).</p>
    <p>Training earns RP for your muscles.</p>`;
}

/* ---------- include time: the home, and the three wrappers (renderMind, go, goBack) ---------- */
fcView("more",{render:(b,M)=>fcHome(b,M,true)});
fcView("home",{render:(b,M)=>fcHome(b,M),leave:next=>{ fcHomeLeave(); if(next==null) fcHome.rules=false; }});   // "How aura works" folds away when Focus closes

/* the one view dispatcher. Registered views render here; the rest fall through to the legacy renderMind */
(function(){ const _r=renderMind; renderMind=function(){
  const v=String(MIND.view||"home"), m=$("mind"), b=$("mindBody");
  if(fcLeave.v!=null&&fcLeave.v!==v) fcLeave(v);
  fcLeave.v=v;
  let d=fcViewOf(v), r;
  if(d){
    try{ if(typeof rdBrStop==="function") rdBrStop(); }catch(e){ console.warn(e); }
    m.classList.remove("brv");
    try{ r=d.render(b,mindState(),v); }
    catch(e){ console.warn("Ossa: Focus view "+v,e);
      if(v!=="home"){ MIND.view="home"; return renderMind(); }   // a broken view lands on the home
      d=null; r=_r.apply(this,arguments); }
  } else r=_r.apply(this,arguments);
  try{
    m.classList.toggle("fh",v==="home");
    $("app").classList.toggle("fcfull",!!(MIND.open&&d&&fcFull(d,v)));
    const bk=$("mindBack");
    if(bk){ bk.textContent="‹ Focus"; bk.setAttribute("aria-label","Back to Focus"); bk.onclick=()=>{ Pulse.buzz(6); mindGo("home"); }; }
  }catch(e){ console.warn(e); }
  return r;
}; })();

/* the body search's click handler (ossa.html, document-wide) takes every [data-go] for a body part ('m:id', 'r:id').
   Focus's legacy screens use data-go for their own routes (wind-down's Start: 'breath:478'), which made it open
   a region of undefined and throw. Only body-part tokens reach it now. (The Focus home uses data-fc.) */
(function(){ const _go=go; go=function(tok){ if(!/^[mr]:./.test(String(tok))) return; return _go.apply(this,arguments); }; })();

/* back (the edge swipe): a Focus sub-view goes back to the Focus home; the Focus home opened from its tab
   stays (you leave it by the tab bar, like any tab). Anything on top of Focus goes to the rest of the chain */
(function(){ const _gb=goBack; goBack=function(){
  try{
    if(typeof MIND!=="undefined"&&MIND.open){
      const app=$("app"), mind=$("mind"), bo=$("breathO");
      if(bo&&!bo.hidden&&mind&&mind.hidden) return false;   // a Calm session over the screen: its End button ends it
      const busy=(typeof RDL!=="undefined"&&RDL)||(typeof RV!=="undefined"&&RV)||app.classList.contains("timelining")||document.querySelector(".panel.on")
        ||(typeof vxSoreS==="function"&&vxSoreS().open)||!mind||mind.hidden;
      if(!busy){ if(String(MIND.view)!=="home"){ mindGo("home"); return true; } if(MIND.plain) return false; }
    }
  }catch(e){ console.warn(e); }
  return _gb.apply(this,arguments); }; })();
