/* =========================================================
   RANKS AND STREAK — added in the 2026-10-15 redesign (the dares moved to dares.js in Ossa 2.0 Phase 6)
   - every muscle has a rank: Fragile → Stable → Strong → Forged → Unbreakable, three levels each
     (tiers and levels live in web/ossa.html next to the scores: RANKS, RK_STEPS, rankOf, toNext)
   - a 2D body coloured by rank, for the widget prompt and anywhere WebGL is missing
   - the Muscle ranks screen, weakest first, with FRONT and BACK stills of the 3D body (Body.shot)
   - the rank-up moment after a workout, the overall rank last (Ossa 2.0 Phase 1, 2026-10-16)
   - a streak that planned rest days never break
   Phase 5 seams (evolve.js owns them): Ranks comes to the front (uiPanelFront), the hero's "Ideal self ›"
   link, row tags from vxOn("rkTag") (rkTagX), and the body's look in the rkShots key (bxLookKey,
   look-fx.js). (rkDareMix now lives in dares.js)
   ========================================================= */

/* friendlier names where the anatomy name isn't what people say */
/* pec minor keeps its own name, "Pec minor": "Upper chest" is a zone of the chest (Ossa 2.0 Phase 2) */
const RK_SAY={erectors:"Lower back",gastrocnemius:"Calves",glute_max:"Glutes",glute_med:"Side glutes",pec_major:"Chest",tibialis:"Shins",serratus:"Serratus"};
const rkSay=k=>RK_SAY[k]||MUSCLES[k].name;
/* "Calves need you", "Chest needs you": names ending in s are plural, except Serratus and Soleus */
function rkNeeds(k){ const n=rkSay(k); return `${n} ${/s$/i.test(n)&&!/us$/i.test(n)?"need":"needs"} you`; }
const rkAvg=ks=>ks.reduce((a,k)=>a+(S.scores[k]||0),0)/ks.length;
/* what one session adds to a muscle at this score, on average: 3 hard sets on the curve vxRP uses
   (vessel.js). It isn't rounded because the RP carry keeps the fractions, so "n sessions to X" stays true. */
const rkGainPer=s=>Math.max(1,3.6*(1-(s||0)/125));
function rkSessionsToTier(s){ const t=rankTier(s); if(t>=5) return 0; const need=RANKS[t+1][0]-(s||0); let n=0, x=s||0; while(x<RANKS[t+1][0]&&n<40){ x+=rkGainPer(x); n++; } return Math.max(1,n); }
function rkBadge(s,size){ const t=rankTier(s), i=rankIx(s), lv=i?RK_LV[RK_STEPS[i-1][2]]:"–";
  return `<span class="rk-badge${size?" "+size:""}" style="--c:var(--rk-${t});--on-c:var(--on-rk-${t})" aria-hidden="true"><b>${lv}</b></span>`; }

/* sore spots and fading (vessel.js): a flagged muscle shows no fade, because a flag pauses it.
   The 3D body uses the same rule, so the 2D and 3D bodies always agree. */
function rkFlagged(k){ try{ return typeof vxFlagged==="function"&&vxFlagged(k); }catch(e){ return false; } }
function rkFadeShown(k){ try{ return rkFlagged(k)?0:(+fadeOf(k)||0); }catch(e){ return 0; } }

/* ---------- the 2D body, each muscle coloured by its rank ---------- */
/* a fading part goes see-through over the dark silhouette (a fully faded Strong still reads lighter than Fragile).
   No red here: a sore spot isn't a rank, so the rows say "Flagged" instead. o.fade:false turns fading off. */
function uiRankFig(v,o){
  o=o||{}; const parts=FIGPARTS[v], hl=o.hl||[];
  const half=m=>`<g${m?' transform="translate(200 0) scale(-1 1)"':""}><path class="rk-sil" d="${OUT}"/>${m?"":`<path class="rk-sil" d="M92.5,47 L107.5,47 L100,205 Z"/>`}${SVGMAP[v].map(([p])=>{ const ks=parts[p], t=rankTier(rkAvg(ks)), on=ks.some(k=>hl.includes(k));
      const f=o.fade===false?0:ks.reduce((a,k)=>a+rkFadeShown(k),0)/ks.length;
      return `<path class="rk-p${on?" hl":""}" d="${SP[p]}" style="--c:var(--rk-${t})${f>0.01?`;fill-opacity:${(1-0.55*f).toFixed(2)}`:""}" data-t="${t}"/>`; }).join("")}<path class="rk-out" d="${OUT}"/></g>`;
  return `<svg class="rk-fig" viewBox="38 4 124 396" role="img" aria-label="${v==="back"?"Back":"Front"} of your body, each muscle coloured by its rank">${half(false)}${half(true)}</svg>`;
}
/* the legend, strongest first */
function rkLegendHTML(){ return `<div class="rk-leg" aria-hidden="true">${[5,4,3,2,1].map(t=>`<span><i style="--c:var(--rk-${t})" data-t="${t}"></i>${RANKS[t][1]}</span>`).join("")}</div>`; }

/* ---------- the weak link: the muscle most worth your time, preferring your focus area ----------
   Never a flagged muscle: it's a nudge, and a sore spot gets no nudges. */
function rkWeak(){
  const ok=k=>!rkFlagged(k);
  const foc=(S.focus&&S.focus.regions?S.focus.regions.flatMap(r=>(REGIONS[r]||{muscles:[]}).muscles):[]).filter(ok);
  const trained=GLORDER.filter(k=>(S.scores[k]||0)>0&&ok(k));
  const pool=foc.filter(k=>trained.includes(k));
  const pick=(pool.length?pool:trained).slice().sort((a,b)=>(S.scores[a]||0)-(S.scores[b]||0))[0];
  return pick||foc[0]||(ok("erectors")?"erectors":GLORDER.find(ok))||"erectors";
}
function rkWeakView(k){ const fig=["rear_delt","triceps","traps","lats","rhomboids","erectors","glute_max","glute_med","hamstrings","gastrocnemius","soleus"].includes(k)?"back":"front"; return fig; }
function rkInToday(k){ try{ const s=rdTodaySession(); return !doneToday()&&s.items.some(it=>it.primary===k||(it.sec||[]).includes(k)); }catch(e){ return false; } }

/* =========================================================
   THE MUSCLE RANKS SCREEN
   ========================================================= */
function rkPanel(){
  let p=$("ranksP"); if(p) return p;
  p=document.createElement("section"); p.className="panel u-own"; p.id="ranksP"; p.setAttribute("aria-label","Muscle ranks");
  p.innerHTML=`<div class="p-head"><h2>Muscle ranks</h2><button class="u-icon-btn round u-x" id="ranksClose" aria-label="Close"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></div><div class="p-body" id="ranksBody"></div>`;
  $("app").appendChild(p); $("ranksClose").onclick=()=>{ Pulse.buzz(6); p.classList.remove("on"); };
  return p;
}
/* the FRONT and BACK cards: two stills of your own 3D body in rank colours, from Body.shot.
   No sore-spot red on them (red isn't a rank). Kept in memory until a score, a muscle's fade step,
   your figure or your finish changes. Null without WebGL, or when the 3D can't draw right now. */
function rkShots(){
  const c=rkShots.c||(rkShots.c={key:"",f:null,b:null});
  if(typeof Body==="undefined"||!Body||Body.kind!=="gl"||typeof Body.shot!=="function") return null;
  let fin=S.finish||""; try{ const F=FINISHES.find(x=>x.id===S.finish); fin+=F&&sessionsN()>=F.at?"+":""; }catch(e){}
  /* Phase 5: the body's look (Pro finishes, prestige materials, the path shape) is part of the key (look-fx.js) */
  const key=[S.body,fin,GLORDER.map(k=>(S.scores[k]||0)+":"+Math.round(rkFadeShown(k)*8)).join(","),uiSafe(()=>typeof bxLookKey==="function"?bxLookKey():"","")].join("|");
  if(c.key===key&&c.f&&c.b) return c;
  let f=null, b=null;
  try{ f=Body.shot({yaw:0}); b=f&&Body.shot({yaw:Math.PI}); }catch(e){ f=b=null; }
  if(!f||!b) return null;                       // not cached: the canvas may only be unsized for now
  c.key=key; c.f=f; c.b=b; return c;
}
function rkCardHTML(v,shots,weak){
  const nm=v==="back"?"Back":"Front", src=shots&&(v==="back"?shots.b:shots.f);
  return `<button class="rk-card" data-fv="${v}" aria-label="${nm} of your body, each muscle coloured by its rank. Open in 3D">${src?`<img class="rk-shot" src="${src}" alt="" draggable="false">`:uiRankFig(v,{hl:[weak]})}<small>${nm}</small></button>`;
}
function openRanks(){
  Pulse.buzz(8); track("ranks_open");
  const p=rkPanel(), b=$("ranksBody"), o=overall(), n=toNext(o), weak=rkWeak();
  const shots=rkShots();                        // before the panel slides in, so the slide doesn't stutter
  const rows=GLORDER.map(k=>({k,s:S.scores[k]||0})), on=rows.filter(r=>r.s>0).sort((a,b)=>a.s-b.s), off=rows.filter(r=>!r.s);
  const row=r=>{ const t=rankTier(r.s), nx=toNext(r.s), fl=rkFlagged(r.k), f=r.s>0?rkFadeShown(r.k):0, wk=r.k===weak&&r.s, tx=rkTagX(r.k);
    const tags=(wk?`<em>Weak link</em>`:"")+(f>0?`<i class="rk-tag fade">Fading</i>`:"")+(fl?`<i class="rk-tag flag">Flagged</i>`:"")+tx.h;
    return `<button class="rk-row${f>0?" fade":""}${fl?" flag":""}" data-rk="${r.k}" aria-label="${uiEsc(MUSCLES[r.k].name)}: ${rankOf(r.s)}${nx?`, ${nx.pts} to ${nx.name}`:""}${wk?", weak link":""}${f>0?", fading":""}${fl?", flagged":""}${uiEsc(tx.say)}">
      <i class="rk-sq" style="--c:var(--rk-${t})${f>0?`;--f:${f.toFixed(2)}`:""}" data-t="${t}"></i><span class="rk-n"><span>${uiEsc(MUSCLES[r.k].name)}</span>${tags?`<span class="rk-tags">${tags}</span>`:""}</span>
      <span class="rk-t" style="--c:var(--rk-${t})">${rankOf(r.s)}</span><span class="u-bar rk-b"><i style="width:${(rankFrac(r.s)*100).toFixed(0)}%;--c:var(--rk-${t})"></i></span></button>`; };
  const nd=typeof NEGLECT_DAYS==="number"?NEGLECT_DAYS:10;
  b.innerHTML=`<div class="rk-hero">${rkBadge(o,"lg")}
      <div class="rk-hero-tx"><span class="u-eyebrow">Overall</span><b class="u-h2">${rankOf(o)}</b>
        <span class="u-bar"><i style="width:${(rankFrac(o)*100).toFixed(0)}%;--c:var(--rk-${rankTier(o)})"></i></span>
        <span class="rk-hero-m"><span>${o} RP average</span><span>${n?`${n.pts} to ${n.name}`:"Top rank"}</span></span>
        <button class="u-link rk-ideal" id="rkIdeal">Ideal self ›</button></div></div>
    <div class="rk-figs${shots?" shot":""}">${rkCardHTML("front",shots,weak)}${rkCardHTML("back",shots,weak)}</div>
    ${rkLegendHTML()}
    <p class="u-small rk-how">Every set you log adds rank points (RP) to the muscles it works, and a share to the muscles that help. Each rank has three levels. A muscle you leave alone for ${nd} days starts to fade on your body, but never loses its rank. A sore spot you flag doesn't fade while you rest it.</p>
    ${on.length?`<div class="u-section-h"><span class="u-eyebrow">Weakest first</span><span class="u-eyebrow">Progress</span></div><div class="rk-list">${on.map(row).join("")}</div>`:""}
    ${off.length?`<div class="u-section-h"><span class="u-eyebrow">Not trained yet · ${off.length}</span></div><div class="rk-list">${off.map(row).join("")}</div>`:""}
    <button class="u-btn block rk-3d" id="rk3d">${UI_IC.body}See your ranks on your body</button>`;
  b.querySelectorAll("[data-rk]").forEach(x=>x.onclick=()=>{ Pulse.buzz(6); p.classList.remove("on"); rkShow3D(); setTimeout(()=>{ try{ openSel({t:"muscle",id:x.dataset.rk},true); }catch(e){} },reduced?0:500); });
  b.querySelectorAll("[data-fv]").forEach(x=>x.onclick=()=>{ Pulse.buzz(6); p.classList.remove("on"); rkShow3D({lens:"rank",view:x.dataset.fv}); });
  $("rk3d").onclick=()=>{ Pulse.buzz(8); p.classList.remove("on"); rkShow3D(); };
  /* Ideal self (evolve.js) stacks over Ranks; its ✕ comes back here */
  $("rkIdeal").onclick=()=>{ Pulse.buzz(8); if(typeof openEvolve==="function") openEvolve("ideal",{from:"ranks"}); };
  /* opened from an Evolve panel (the hub's rank strip lives under one), Ranks draws on top */
  if(typeof uiPanelFront==="function") uiPanelFront(p);
  b.parentNode.scrollTop=0; requestAnimationFrame(()=>p.classList.add("on"));
}
/* tags other files add to a muscle's row (Phase 5: prestige stars), through vxOn("rkTag",k=>({h,say})|null).
   Inside .rk-tags, never a fifth grid child (ranks.css) */
function rkTagX(k){ let h="",say=""; vxHooks("rkTag").forEach(f=>{ try{ const t=f(k); if(t&&t.h){ h+=t.h; if(t.say) say+=", "+t.say; } }catch(e){ console.warn(e); } }); return {h,say}; }
/* the 3D body, muscle layer, coloured by rank (redefined in lens.js: the Body page in a lens, 19 Oct) */
function rkShow3D(){
  closePanels(); if($("app").classList.contains("train")) setMode("body");
  if(TAB!=="body") setTab("body");
  if(curLayer!=="muscle") setLayer("muscle");
  RKV.on=true; Body.setRank&&Body.setRank(true); rkSync();
}
const RKV={on:false};
/* the Recovery / Rank switch on the 3D body, in the Muscle layer */
function rkSync(){
  const app=$("app"), tr=app.classList.contains("train"), ob=app.classList.contains("onboarding");
  /* the Body page always shows ranks; the 3D body shows whichever you picked */
  const home=typeof RDH!=="undefined"&&RDH.on&&TAB==="today"&&!tr&&!ob;
  const show=TAB==="body"&&curLayer==="muscle"&&!tr&&!ob&&!app.classList.contains("minding");
  if(Body.setRank) Body.setRank(home?true:show?RKV.on:false);
  let el=$("rkSw");
  if(!el){ el=document.createElement("div"); el.id="rkSw"; el.className="u-seg rk-sw"; el.setAttribute("role","tablist"); el.setAttribute("aria-label","Colour muscles by");
    el.innerHTML=`<button data-rkv="0" role="tab">Recovery</button><button data-rkv="1" role="tab">Rank</button>`;
    const hb=$("hudBottom"); if(hb) hb.insertBefore(el,hb.firstChild); else app.appendChild(el);
    el.addEventListener("click",e=>{ const b=e.target.closest("[data-rkv]"); if(!b) return; RKV.on=b.dataset.rkv==="1"; Pulse.buzz(6); track("rank_view",{on:RKV.on}); rkSync(); }); }
  el.classList.toggle("on",show);
  el.querySelectorAll("[data-rkv]").forEach(b=>{ const on=(b.dataset.rkv==="1")===RKV.on; b.classList.toggle("on",on); b.setAttribute("aria-selected",on); });
}
(()=>{ const _l=drawLayers; drawLayers=function(){ _l(); try{ rkSync(); }catch(e){} }; })();
/* panels made here close with the others (Back, swipe, opening another screen) */
(()=>{ const _c=closePanels; closePanels=function(){ _c(); document.querySelectorAll(".panel.u-own.on").forEach(p=>p.classList.remove("on")); }; })();

/* =========================================================
   THE RANK-UP MOMENT — after a workout: the muscles you trained (in the order you did them),
   then the ones that helped, then your overall rank when it climbs too
   ========================================================= */
/* the best set for muscle k: from the exercises it was the main muscle of, else the ones it helped.
   Only a loaded lift (kind "load") gets an estimated 1-rep max: for a bodyweight move the added kg
   isn't the whole load, so it shows as +kg × reps with no 1RM. */
function rkBestSet(R,k){
  const items=(TR.session&&TR.session.items)||[], ex=(R.rec&&R.rec.ex)||[];
  const itOf=l=>items.find(x=>x.name===l.name);
  const prim=l=>{ const it=itOf(l); if(it) return it.primary===k; const e=ex.find(x=>x.n===l.name); return !!e&&e.k===k; };
  const help=l=>{ const it=itOf(l); return !!it&&it.primary!==k&&(it.sec||[]).includes(k); };
  const pick=ls=>{ let best=null;
    ls.forEach(l=>(l.sets||[]).forEach(x=>{ if(!x) return;
      const load=l.kind==="load"&&x.kg>0&&x.r>0, bw=!load&&x.kg>0&&x.r>0;
      /* compare like with like: loaded sets first, then weighted bodyweight, then reps, a carry's kg, a hold */
      const v=load?3e6+x.kg*(1+x.r/30):bw?2e6+x.kg*(1+x.r/30):x.r>0?1e6+x.r:x.kg>0?5e5+x.kg:x.s>0?x.s:0;
      if(v>0&&(!best||v>best.v)) best={v,kg:x.kg>0?x.kg:0,r:x.r>0?x.r:0,s:x.s>0?x.s:0,e:load?x.kg*(1+x.r/30):0,bw,name:l.name}; }));
    return best; };
  const L=R.logs||[];
  return pick(L.filter(prim))||pick(L.filter(help));
}
function rkBestTxt(b){ return !b?"–":b.e?`${fkg(b.kg)}×${b.r}`:b.bw?`+${fkg(b.kg)}×${b.r}`:b.r?`${b.r} reps`:b.kg?`${fkg(b.kg)} kg`:b.s?`${b.s} s`:"–"; }
const RK_CHEV=`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8.5 8 4.5l4 4M4 12.5l4-4 4 4"/></svg>`;
/* did the overall rank climb? (R.oUp from finishWorkout; worked out from o0 → o1 for older results) */
function rkOverallUp(R){ return R.oUp!=null?!!R.oUp:R.o0!=null&&R.o1!=null&&rankIx(R.o1)>rankIx(R.o0); }
/* show each rank-up in turn, then call done. R.ranks comes in display order from finishWorkout (vxRP):
   the muscles you trained, in the order you did them, then helpers by gain. At most three muscles
   (the last says how many more), then the overall rank as the last segment when it climbed. */
function rkCelebrate(R,done){
  const all=(R.ranks||[]).filter(x=>x&&MUSCLES[x.k]).map(x=>{ const to=x.toS!=null?x.toS:(S.scores[x.k]||0);
    return {k:x.k,to,from:x.from!=null?x.from:to-((R.gains||{})[x.k]||0)}; });
  const ups=all.slice(0,3), more=all.length-ups.length, nMus=ups.length, oUp=rkOverallUp(R);
  if(oUp) ups.push({all:true,from:R.o0,to:R.o1});
  if(!ups.length){ done(); return; }
  const gains=R.gains||{}, sum=Object.values(gains).reduce((a,b)=>a+(+b||0),0);
  let i=0;
  const host=document.createElement("div"); host.className="rk-up"; host.setAttribute("role","dialog"); host.setAttribute("aria-label","Rank up");
  $("app").appendChild(host);
  const show=()=>{
    const u=ups[i], ov=!!u.all, t=rankTier(u.to), tierUp=rankTier(u.from)!==t, bs=ov?null:rkBestSet(R,u.k), nm=ov?"Your body":rkSay(u.k);
    const ixF=rankIx(u.from), ixT=rankIx(u.to), nx=toNext(u.to), gain=ov?u.to-u.from:(gains[u.k]||0), unit=ov?"RP average":"RP";
    host.style.setProperty("--c",t===1?"var(--line-3)":`var(--rk-${t})`);   // Fragile is too faint on black for the big moment
    host.setAttribute("aria-label",ov?"Overall rank up":"Rank up");
    const eye=ov?(tierUp?"New overall rank":"Overall rank up"):(tierUp?"New rank":"Rank up");
    /* a muscle: best set, 1-rep max, its RP. Overall: your RP average, how many muscles worked, the session's RP */
    const stats=ov
      ?`<div><b class="u-num">${u.to}</b><span>RP average</span></div>
        <div><b class="u-num">${Object.keys(gains).length}</b><span>Muscles worked</span></div>
        <div class="rk-up-gain"><b class="u-num">+${sum} RP</b><span>This session</span></div>`
      :`<div><b class="u-num">${rkBestTxt(bs)}</b><span>Best set</span></div>
        <div><b class="u-num">${bs&&bs.e?`${Math.round(bs.e)} kg`:"–"}</b><span>Est. 1-rep max</span></div>
        <div class="rk-up-gain"><b class="u-num">+${gain} RP</b><span>This session</span></div>`;
    const moreHere=!ov&&more>0&&i===nMus-1;
    host.innerHTML=`<div class="rk-up-in${ov?" rk-up-all":""}${moreHere?" more":""}">
      ${ups.length>1?`<div class="rk-segs" aria-hidden="true">${ups.map((_,j)=>`<i class="${j<i?"done":j===i?"now":""}"><b></b></i>`).join("")}</div>`:""}
      <span class="u-eyebrow rk-up-eye">${RK_CHEV}${eye}${ups.length>1?` · ${i+1} of ${ups.length}`:""}</span>
      <span class="rk-streaks" aria-hidden="true"><i></i><i></i><i></i></span>
      <div class="rk-up-badge"><span class="fx-rays" aria-hidden="true"></span><span class="fx-glow" aria-hidden="true"></span><span class="rk-hex" style="--on-c:var(--on-rk-${t})"><b>${RK_LV[RK_STEPS[ixT-1][2]]}</b><small>${RANKS[t][1]}</small></span>${fxEmbersHTML(16)}</div>
      <div class="rk-up-tier u-impact">${rankOf(u.to)}</div>
      <h1 class="u-h1 rk-up-m">${uiEsc(nm)} ${tierUp?`is ${RANKS[t][1]}`:"ranked up"}</h1>
      <p class="u-p rk-up-ft"><span>${rankOf(u.from)}</span> <i aria-hidden="true">›</i><span class="u-sr">to</span> <b>${rankOf(u.to)}</b></p>
      ${moreHere?`<p class="u-small rk-up-more">And ${more} more muscle${more>1?"s":""} ranked up</p>`:""}
      <div class="rk-up-rp"><span class="u-bar"><i id="rkRpBar"></i></span><span class="rk-up-rpt"><b id="rkRpN">+${gain} ${unit}</b><em>${nx?`${nx.pts} to ${nx.name}`:"Top rank"}</em></span></div>
      <div class="rk-up-stats">${stats}</div>
      <button class="u-btn primary block" id="rkUpGo">${i<ups.length-1?"Next":(rkCelebrate.lastLabel||"Continue")}</button>
      <button class="u-link" id="rkUpAll">See all your ranks</button></div>`;
    Pulse.buzz(ov?[14,60,24]:[12,50,20]); try{ Pulse.audio(); Pulse.chime(tierUp||ov?5:3); }catch(e){}
    /* the motion: the bar fills (across a level, it fills, empties and fills again), the points count up, and a burst for a new tier */
    fxBar($("rkRpBar"),rankFrac(u.from),Math.max(0.04,rankFrac(u.to)),ixT>ixF,1000);   // a sliver at least: you have started the next level
    fxCount($("rkRpN"),0,gain,900,v=>`+${v} ${unit}`);
    setTimeout(()=>{ if(host.isConnected) fxConfetti(host,{y:0.3,count:tierUp||ov?110:44,colors:[`--rk-${t}`,"--glow","--cta"]}); },reduced?0:320);
    $("rkUpGo").onclick=()=>{ if(closing) return; Pulse.buzz(8); i++; if(i<ups.length) show(); else close(done); };
    $("rkUpAll").onclick=()=>{ if(closing) return; Pulse.buzz(6); close(()=>{ done(); setTimeout(openRanks,reduced?0:300); }); };
  };
  /* once: a quick double tap on the last Continue mustn't run what comes next twice */
  let closing=false;
  const close=f=>{ if(closing) return; closing=true; host.classList.remove("on"); setTimeout(()=>{ host.remove(); f&&f(); },reduced?0:300); };
  show(); requestAnimationFrame(()=>host.classList.add("on"));
  track("rank_up",{n:all.length,overall:oUp});
}

/* =========================================================
   THE STREAK — days in a row you kept your plan. A planned rest day never breaks it,
   and today only counts once you've trained (it can't break it either).
   ========================================================= */
function uiTrainedDays(){
  const d=new Set((S.workouts||[]).map(w=>w.d));
  (S.log||[]).forEach(e=>{ if(e&&e.m&&Object.values(e.m).some(v=>v>0)) d.add(e.d); });
  return d;
}
function uiRestDay(wd){ try{ return !sessionForDay0(wd).items.length; }catch(e){ return PLAN[wd]&&/Rest|Recover/.test(PLAN[wd][1]); } }
function uiStreak(){
  const T=uiTrainedDays(), R=[0,1,2,3,4,5,6].map(uiRestDay); let n=0, pend=0, today=false;
  for(let i=0;i<400;i++){
    const d=dkey(i), wd=((todayIdx-i)%7+7)%7;
    if(T.has(d)){ n+=1+pend; pend=0; if(!i) today=true; continue; }
    if(!i) continue;                                  // today isn't over
    if(R[wd]){ pend++; continue; }                    // a planned rest day keeps it going
    break;
  }
  return {n,today};
}
/* this week, Monday to Sunday: done, rest, today, to do, missed */
function uiStreakWeek(){
  const T=uiTrainedDays(), first=[...T].sort()[0]||dkey(0), out=[];   // days before you started never count as missed
  for(let i=0;i<7;i++){ const back=todayIdx-i, d=dkey(back), rest=uiRestDay(i);
    out.push({l:DN[i].slice(0,1),name:DAYN[i],st:T.has(d)?"done":i===todayIdx?"today":rest?"rest":i<todayIdx&&d>first?"miss":"todo"}); }
  return out;
}
const SK_CLS={done:"sk-done",today:"sk-now",rest:"sk-rest",miss:"sk-miss",todo:"sk-todo"};
function uiWeekDotsHTML(hold){ return uiStreakWeek().map((x,i)=>hold&&i===todayIdx&&x.st==="done"?`<span class="sk-d sk-now" id="skToday" aria-label="${x.name}: today"><small>${x.l}</small><i></i></span>`:`<span class="sk-d ${SK_CLS[x.st]}" aria-label="${x.name}: ${{done:"trained",today:"today",rest:"rest day",miss:"missed",todo:"to do"}[x.st]}"><small>${x.l}</small><i>${x.st==="done"?UI_IC.check:x.st==="rest"?"Z":""}</i></span>`).join(""); }
const UI_FLAME=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22c-4.4 0-6.5-3.1-6.5-6 0-4.6 4-6 4.6-11 3.3 2 8.4 5.8 8.4 11 0 2.9-2.1 6-6.5 6z"/><path d="M12 22c-1.9 0-2.6-1.6-2.6-2.9 0-1.9 1.9-3.1 2.6-5 1.3 1.3 2.6 3.1 2.6 5 0 1.3-.7 2.9-2.6 2.9z"/></svg>`;
/* the streak screen: after a workout that grew it, or from the chip on Home */
function openStreak(after){
  if(document.querySelector(".sk-up")) return;   // already showing
  const st=uiStreak(), host=document.createElement("div"); host.className="sk-up"; host.setAttribute("role","dialog"); host.setAttribute("aria-label","Your streak");
  const ign=!!after&&st.today&&!reduced, prev=Math.max(0,st.n-1);   // after today's first workout you light the flame yourself
  const weak=rkWeak(), fig=uiRankFig(rkWeakView(weak),{hl:[weak]});
  const native=typeof NATIVE!=="undefined"&&NATIVE.on&&NATIVE.caps&&NATIVE.caps.widget;
  host.innerHTML=`<div class="sk-in${ign?" unlit":""}">
    <button class="u-icon-btn round u-x sk-x" id="skX" aria-label="Close"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>
    <div class="sk-head">${ign?`<button class="sk-fl sk-ign" id="skFlame" aria-label="Light today's flame"><span class="fx-burst" id="skBurst"></span>${UI_FLAME}</button>`:`<span class="sk-fl">${UI_FLAME}</span>`}
      <b class="u-num sk-n">${ign?`<span class="sk-roll" id="skRoll"><span>${prev}</span><span>${st.n}</span></span>`:st.n}</b><span class="sk-l">day streak</span>
      <p class="u-small" id="skMsg">${ign?"Tap the flame to light today.":`${st.today?"Kept today.":st.n?"Train today to keep it going.":"Train today to start one."} Planned rest days never break it.`}</p></div>
    <div class="u-card sk-week">${uiWeekDotsHTML(ign)}</div>
    <span class="u-eyebrow sk-eye">Keep your body on your home screen</span>
    <div class="sk-wg"><div class="sk-wg-i"><div class="sk-wg-l"><span class="sk-wg-fl">${UI_FLAME}</span><b class="u-num">${st.n}</b><small>days</small><em>${uiEsc(rkNeeds(weak)).replace(/ (needs?) you$/,"<br>$1 you")}</em></div><div class="sk-wg-f">${fig}</div></div></div>
    <div class="sk-acts"><button class="u-btn primary block" id="skWid">Add widget</button><button class="u-link" id="skNo">${after?"Not now":"Close"}</button></div></div>`;
  $("app").appendChild(host);
  const close=()=>{ if(host.dataset.closing) return; host.dataset.closing="1"; host.classList.remove("on"); setTimeout(()=>host.remove(),reduced?0:300); };
  $("skNo").onclick=()=>{ Pulse.buzz(6); close(); };
  $("skX").onclick=()=>{ Pulse.buzz(6); close(); };
  $("skWid").onclick=()=>{ Pulse.buzz(8); track("widget_prompt",{after:!!after});
    if(!(typeof NATIVE!=="undefined"&&NATIVE.on)){ toast("The widget lives in the Ossa phone app. Long-press your home screen to add it."); close(); return; }
    const c=NATIVE.caps;
    if(!c||!c.widget){ toast(c&&c.expoGo?"Expo Go can't show widgets. It works once Ossa is installed as its own app.":"Not available in this version."); close(); return; }
    if(NPLAT()==="ios"){ toast("Long-press your home screen, tap +, search Ossa, then Add Widget."); close(); return; }
    nativeSync(true); nsend({t:"widget:pin"}); close(); };
  if(!native) $("skWid").textContent="How to add the widget";
  requestAnimationFrame(()=>host.classList.add("on")); Pulse.buzz(after?[12,50,20]:6);
  if(ign){
    let lit=false;
    const light=()=>{ if(lit||!host.isConnected) return; lit=true; clearTimeout(auto);
      const fl=$("skFlame"); fl.classList.add("lit"); fl.disabled=true; fxReplay($("skBurst"),"go");
      Pulse.buzz([14,60,24]); try{ Pulse.audio(); Pulse.chime(5); }catch(e){}
      $("skRoll").classList.add("go");
      const td=$("skToday"); if(td){ setTimeout(()=>{ td.classList.remove("sk-now"); td.classList.add("sk-done"); td.querySelector("i").innerHTML=UI_IC.check; fxReplay(td.querySelector("i"),"fx-pop"); },reduced?0:380); }
      $("skMsg").textContent="Kept today. Planned rest days never break it.";
      setTimeout(()=>{ if(host.isConnected){ host.querySelector(".sk-in").classList.remove("unlit"); fxConfetti(host,{y:0.16,count:46,colors:["--glow","--glow-soft","--cta"]}); } },reduced?0:520);
      track("streak_lit",{n:st.n}); };
    $("skFlame").onclick=light;
    const auto=setTimeout(light,6000);   // if you just look at it, it lights by itself
  } else if(after&&!reduced){ const n=host.querySelector(".sk-n"); n.classList.add("pop"); }
}
