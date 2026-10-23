/* =========================================================
   RANK (19 Oct, Andrej: "the focus screen is quite confusing and doesn't really vibe well with the aura thing …
   make it a page showing the rankings and what the user can unlock after time"). Prefix rn*. Function declarations only.
   The second tab (key "breathe", now named Rank) opens on this page instead of the Aura core. Top to bottom:
     your rank        body level in a hex, your overall rank and the five-rank ladder with you on it,
                      and your aura level as its own bar (the aura is the mind's half of the character)
     next unlock      the soonest thing you'll unlock, "about N days at your pace" from your last 21 days of
                      training or 14 days of aura, and the one button that gets you there
     level up         the old Focus tools, one tap each: Train, Lock in, Breathe, Eyes, Reset, Check in,
                      Learn, How it works (Breathe took the habit tile's place on 23 Oct, when that feature left the app)
     your muscles     your three strongest and three weakest; a tap shows the muscle on the body
     unlock road      what you've unlocked (chips) and everything still to come, with how far along and when:
                      body unlocks (Bones, the Bio, Ember and Gold finishes) and the aura tiers
   It reads existing data only (vessel.js levels and UNLOCKS, ranks, aura.js). Nothing new is saved.
   "How aura works" (the old long Focus page) stays as the "more" view.
   ========================================================= */
function rnDayRP(){
  try{ const cut=dkey(21); let n=0; (S.workouts||[]).forEach(w=>{ if(w&&w.d>=cut&&w.rp) Object.values(w.rp).forEach(v=>n+=(+v||0)); }); return n/21; }catch(e){ return 0; }
}
function rnDaySessions(){
  try{ const cut=dkey(21); return (S.workouts||[]).filter(w=>w&&w.d>=cut).length/21; }catch(e){ return 0; }
}
function rnDayAura(){
  try{ const A=S.aura||{}, D=A.days||{}, cut=dkey(14); let n=0; Object.keys(D).forEach(d=>{ if(d>=cut) n+=(+D[d].breath||0)+(+D[d].monk||0); });
    const t=A.day&&A.day.d===dkey(0)?(+A.day.n||0):0; return Math.max(n/14,t/3); }catch(e){ return 0; }
}
/* days until "need" more at "perDay" (Infinity when there's no pace yet) */
function rnDays(need,perDay){ return need<=0?0:perDay>0.02?Math.ceil(need/perDay):Infinity; }
function rnWhen(d){
  if(d<=0) return "Ready now";
  if(!isFinite(d)) return "";
  return d<=1?"About a day":d<60?`About ${d} days`:d<365?`About ${Math.round(d/30)} months`:"Over a year";
}
/* the colour of each reward: finishes by their glow, aura tiers by theirs */
function rnCol(id){ return {bones:"var(--text-1)","finish:bio":"var(--cyan)","finish:ember":"var(--amber)","finish:gold":"var(--gold)"}[id]||"var(--glow)"; }
/* every unlock: done or not, how far along, and roughly when at your pace.
   Body unlocks open at their level or their workout count, whichever comes first (vxHas). */
function rnRoad(){
  const out=[], L=vxLevelInfo(), rpd=rnDayRP(), spd=rnDaySessions(), n=sessionsN();
  try{ UNLOCKS.forEach(u=>{ const done=vxHas(u.id), need=vxLevelXp(u.lv)-L.xp;
    const days=done?0:Math.min(rnDays(need,rpd),u.at?rnDays(u.at-n,spd):Infinity);
    const f=done?1:Math.max(0,Math.min(1,Math.max(L.xp/vxLevelXp(u.lv),u.at?n/u.at:0)));
    out.push({kind:"body",id:u.id,name:u.name,s:u.s,c:rnCol(u.id),label:u.at?`Level ${u.lv} or ${u.at} workouts`:`Level ${u.lv}`,done,days,f,
      idle:"Train to start the clock",when:done?"Unlocked":rnWhen(days)}); }); }catch(e){}
  try{ const A=S.aura||{xp:0}, xp=+A.xp||0, apd=rnDayAura();
    abTiers().slice(1).forEach(t=>{ const need=auXpFor(t.min)-xp, done=need<=0, days=done?0:rnDays(need,apd);
      out.push({kind:"aura",id:"aura:"+t.k,name:`${t.n} aura`,s:t.say,c:`var(${t.c})`,label:`Aura level ${t.min}`,done,days,
        f:done?1:Math.max(0,Math.min(1,xp/auXpFor(t.min))),idle:"Lock in or breathe to start the clock",when:done?"Unlocked":rnWhen(days)}); }); }catch(e){}
  return out;
}
/* soonest first; with no pace yet, the one you're furthest along */
function rnSoon(a,b){ return (a.days-b.days)||(b.f-a.f); }
function rnHexSVG(lv,frac,col){
  const P="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5";
  const f=Math.max(0,Math.min(1,+frac||0));
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><polygon class="g" points="${P}"/>${f>0.005?`<polygon class="p" pathLength="100" points="${P}" style="stroke:${col};stroke-dasharray:${(f*100).toFixed(1)} 100"/>`:""}</svg><b>${lv}</b>`;
}
function rnIc(k){
  const P={train:'<path d="M3 9.5v5M6 7v10M18 7v10M21 9.5v5M6 12h12"/>',
    lock:'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14.5v2"/>',
    breath:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".6"/>',
    eyes:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    reset:'<path d="M3 9h10.5a2.75 2.75 0 1 0-2.75-2.75M3 13.5h14a2.5 2.5 0 1 1-2.5 2.5M3 18h6"/>',
    check:'<path d="M3 12.5h4l2-5 4 10 2-5h6"/>',
    learn:'<path d="M12 6.8C9.6 5.2 6.6 4.8 3 5.6v12.8c3.6-.8 6.6-.4 9 1.2 2.4-1.6 5.4-2 9-1.2V5.6c-3.6-.8-6.6-.4-9 1.2zM12 6.8v12.8"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5v.2"/>'};
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${P[k]||""}</svg>`;
}
function rnTick(){ return `<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2l2.3 2.3 4.7-4.9"/></svg>`; }
function rnHome(b){
  try{ fhStop(); }catch(e){}
  const L=vxLevelInfo(), ov=overall(), tier=rankTier(ov), nx=toNext(ov), A=S.aura||{xp:0}, axp=Math.floor(+A.xp||0), al=auLevel(axp), at=abTier(al.n);
  const rcol=tier>=2?`var(--rk-${tier})`:"var(--text-1)", acol=`var(${at.c})`;
  const run=typeof mmRun==="function"?mmRun():null;
  const road=rnRoad(), done=road.filter(r=>r.done), todo=road.filter(r=>!r.done).sort(rnSoon), next=todo[0];
  /* your muscles: strongest and weakest of the ones with a score */
  const ks=Object.keys(MUSCLES).filter(k=>S.scores&&+S.scores[k]>0), by=ks.slice().sort((a,b)=>(S.scores[b]||0)-(S.scores[a]||0));
  const top=by.slice(0,3), low=by.length>=6?by.slice(-3).reverse():[];
  const mrow=k=>{ const s=+S.scores[k]||0, t=rankTier(s); return `<button class="rn-m" data-rn="muscle:${k}" aria-label="${uiEsc(rkSay(k))}, ${rankOf(s)}. Show on the body"><i style="background:${t>=1?`var(--rk-${t})`:"var(--line-3)"}"></i><b>${uiEsc(rkSay(k))}</b><em>${rankOf(s)}</em></button>`; };
  /* the ladder: five ranks, "You" inside your rank's rung at how far through it you are (first rung when unranked) */
  const you=Math.max(1,tier), lo=RANKS[you][0], hi=RANKS[you+1]?RANKS[you+1][0]:100, yp=Math.max(8,Math.min(92,(ov-lo)/Math.max(1,hi-lo)*100));
  const ladder=RANKS.slice(1).map((r,i)=>`<span class="rn-rung${tier>i+1?" past":""}${tier===i+1?" on":""}" style="--c:var(--rk-${i+1})"><i></i><small>${r[1]}</small>${you===i+1?`<span class="rn-you" style="left:${yp.toFixed(1)}%"><b>You</b></span>`:""}</span>`).join("");
  const aNext=auXpFor(al.n+1), aAt=auXpFor(al.n), af=Math.max(0,Math.min(1,(axp-aAt)/Math.max(1,aNext-aAt)));
  const nextGo=next?(next.kind==="aura"?"eyes":"train"):"", nextCta=next?(next.kind==="aura"?"Eyes":"Train"):"";
  const tools=[["train","train","Train","var(--glow)"],["home","lock","Sessions","var(--cyan)"],["breath","breath","Breathe","var(--glow)"],["eyes","eyes","Eyes","var(--cyan)"],
    ["reset","reset","Reset","var(--cyan)"],["checkin","check","Check in","var(--amber)"],["learn","learn","Learn","var(--gold)"],["more","info","How it works","var(--text-2)"]];
  b.innerHTML=`<div class="u-screen rn">
    <header class="u-top"><div class="u-top-tx"><div class="u-eyebrow">${uiShortDate()}</div><h1 class="u-h1">Rank</h1></div></header>
    ${run?`<button class="rn-run" data-rn="monk"><i aria-hidden="true"></i><span>Lock-in running</span><b id="rnRunT">${mmClock(mmLeft(run))}</b><em>Back to it ›</em></button>`:""}
    <section class="rn-hero" style="--rc:${rcol};--ac:${acol}" aria-label="Your rank">
      <button class="rn-me" data-rn="ranks" aria-label="Level ${L.lv}, ${ov?rankOf(ov):"Unranked"}. ${L.toNext} rank points to level ${L.lv+1}. All muscle ranks">
        <span class="rn-hex">${rnHexSVG(L.lv,L.frac,rcol)}</span>
        <span class="rn-who"><small class="u-eyebrow">Your rank</small><b>${uiEsc(ov?rankOf(ov):"Unranked")}</b>
          <span>Level ${L.lv} · ${L.lv>=99?"top level":`${L.toNext.toLocaleString("en-GB")} RP to level ${L.lv+1}`}</span></span></button>
      <div class="rn-ladder" aria-hidden="true">${ladder}</div>
      <p class="rn-to">${!ov?"Train to get your first rank":nx?`${nx.pts} RP average to ${uiEsc(nx.name)}`:"Top rank. Hold it."}</p>
      <button class="rn-aura" data-rn="more" aria-label="Aura level ${al.n}, ${at.n}. ${Math.max(0,aNext-axp)} aura to level ${al.n+1}. How aura works">
        <span class="ab-hex" aria-hidden="true"><b>${al.n}</b></span><span class="rn-at"><b>${at.n} aura</b></span>
        <span class="rn-abar"><i style="width:${(af*100).toFixed(1)}%"></i></span><span class="rn-an">${Math.max(0,aNext-axp)} to level ${al.n+1}</span></button>
    </section>
    ${next?`<button class="rn-next" data-rn="${nextGo}" style="--c:${next.c}" aria-label="Next unlock: ${uiEsc(next.name)}. ${uiEsc(next.label)}. ${uiEsc(next.when||next.idle)}. ${nextCta}">
      <span class="rn-nh"><span class="u-eyebrow">Next unlock</span><em>${nextCta} ›</em></span><b>${uiEsc(next.name)}</b>
      <small>${uiEsc(next.label)} · ${uiEsc(next.when?(next.days>0?next.when+" at your pace":next.when):next.idle)}</small>
      <span class="rn-bar"><i style="width:${(next.f*100).toFixed(1)}%"></i></span></button>`
      :`<div class="rn-next rn-all" style="--c:var(--gold)"><span class="u-eyebrow">Unlock road</span><b>Everything unlocked</b><small>Keep your ranks and your aura from fading.</small></div>`}
    <section class="rn-sec" aria-label="Level up"><div class="u-section-h"><span class="u-eyebrow">Level up</span></div>
      <div class="rn-tools">${tools.map(([g,ic,t,c])=>`<button class="rn-tool" data-rn="${g}" style="--c:${c}">${rnIc(ic)}<b>${t}</b></button>`).join("")}</div></section>
    ${top.length?`<section class="rn-sec" aria-label="Your muscles"><div class="u-section-h"><span class="u-eyebrow">Your muscles</span><button class="u-link" data-rn="ranks">All ranks ›</button></div>
      <div class="rn-ms${low.length?"":" one"}"><div><span class="rn-mh">Strongest</span>${top.map(mrow).join("")}</div>${low.length?`<div><span class="rn-mh">To work on</span>${low.map(mrow).join("")}</div>`:""}</div></section>`:""}
    <section class="rn-sec" aria-label="Unlock road"><div class="u-section-h"><span class="u-eyebrow">Unlock road</span><span class="rn-cnt">${done.length} of ${road.length} unlocked</span></div>
      ${done.length?`<div class="rn-got">${done.map(r=>`<span class="rn-chip" style="--c:${r.c}">${rnTick()}${uiEsc(r.name)}</span>`).join("")}</div>`:""}
      <ol class="rn-road">${todo.map((r,i)=>`<li class="rn-step${i===0?" next":""}" style="--c:${r.c}"><i class="rn-dot" aria-hidden="true"></i>
        <span class="rn-st"><b>${uiEsc(r.name)}</b><small>${uiEsc(r.label)}${r.when?` · ${uiEsc(r.when)}`:""}</small></span>
        <span class="rn-pc" aria-label="${Math.round(r.f*100)}% of the way"><span class="rn-mini"><i style="width:${(r.f*100).toFixed(1)}%"></i></span><small>${Math.round(r.f*100)}%</small></span></li>`).join("")}</ol></section>
  </div>`;
  b.querySelectorAll("[data-rn]").forEach(x=>x.onclick=()=>{ const g=x.dataset.rn; try{ Pulse.buzz(6); }catch(e){}
    if(g==="ranks") return openRanks();
    if(g==="train") return uiGo("train");
    if(g==="learn") return uiGo("explore");
    if(g==="reset"){ if(typeof fhReset==="function") return fhReset(); return mindGo("breath"); }
    if(g.startsWith("muscle:")){ const k=g.slice(7); uiGo("today"); setTimeout(()=>{ try{ if(UIH.sel!==k) uiHeroSelect(k); }catch(e){} },420); return; }
    mindGo(g); });
  /* a running lock-in counts down here too */
  clearInterval(rnHome.t); if(run) rnHome.t=setInterval(()=>{ const el=document.getElementById("rnRunT"), r=typeof mmRun==="function"?mmRun():null; if(!el||!el.isConnected||!r){ clearInterval(rnHome.t); return; } el.textContent=mmClock(mmLeft(r)); },1000);
}
/* the home view of the second tab is the Rank page; "more" stays the long How aura works page */
(()=>{ const _h=fcHome; fcHome=function(b,M,more){ if(more) return _h.apply(this,arguments); try{ return rnHome(b); }catch(e){ console.warn("Ossa: rank page",e); return _h.apply(this,arguments); } }; })();
/* lessons earn aura too (19 Oct audit, point 1: one less level to keep track of) */
(()=>{ if(typeof rdAward!=="function") return; const _a=rdAward; rdAward=function(xp,why){ const v=_a.apply(this,arguments); try{ if(+xp>0){ const g=auGrant(+xp,"lesson"); if(v&&typeof v==="object") v.au=g; } }catch(e){} return v; }; })();
