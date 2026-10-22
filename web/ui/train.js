/* =========================================================
   TRAIN — redesign 2026-10-15, from what the top training apps do. Researched on ScreensDesign:
   Ladder, Hevy, Liftoff, Fitbod, Gymverse, Strong, Gravl, Lyfta, MacroFactor Workouts, Symmetry.
   - the session screen: the numbers up top, the muscles it works in their rank colours, exercise
     rows with swap and insights, one bone Start button (Gymverse, Fitbod, Symmetry, Liftoff)
   - exercise insights: estimated one-rep max over time, records, recent sessions and next time's
     target (Strong, Hevy, Liftoff, Gravl, Lyfta, MacroFactor)
   - in the workout (workout.js): a strip of every exercise so you can do another one first when a
     machine's taken (Symmetry), an effort check after each exercise that sets next time's weight
     (Gravl, Fitbod, MyFitCoach), plates per side for barbell lifts (Fitbod)
   - the hub: muscles ready vs still recovering (Fitbod, Gravl, Liftoff) and your main lifts with
     their trend (Hevy, Strong)
   ========================================================= */

const TR_IC={
  chart:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16"/><path d="M5 15.5l4.5-5 3.5 3 6-7"/></svg>`,
  swap:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>`
};

/* ---------- your lifts: one number per session, records, history (from S.lifts) ---------- */
const trE1=(kg,r)=>kg>0&&r>0?kg*(1+Math.min(r,12)/30):0;   // Epley; past 12 reps it stops being a fair guess
function trKind(name){
  const h=S.lifts&&S.lifts[name], x=(h&&h.length&&h[h.length-1].sets&&h[h.length-1].sets[0])||{};
  if(x.s!=null) return "time"; if(x.r==null&&x.kg!=null) return "carry"; if(BW_EX.has(name)) return "bw"; return "load";
}
/* the chart's number: lifts → best estimated one-rep max, bodyweight → most reps in a set, holds → longest, carries → heaviest */
function trMetric(kind,sets){
  sets=sets||[];
  if(kind==="time") return Math.max(0,...sets.map(x=>x.s||0));
  if(kind==="carry") return Math.max(0,...sets.map(x=>x.kg||0));
  if(kind==="bw") return Math.max(0,...sets.map(x=>x.r||0));
  return Math.max(0,...sets.map(x=>trE1(x.kg||0,x.r||0)));
}
const trRound=(kind,v)=>kind==="load"?Math.round(v*2)/2:Math.round(v);
function trFmt(kind,v){ v=trRound(kind,v); return kind==="time"?`${v} s`:kind==="bw"?`${v} rep${v===1?"":"s"}`:`${fkg(v)} kg`; }
const trMetricName=kind=>kind==="load"?"Estimated 1-rep max":kind==="bw"?"Most reps in a set":kind==="time"?"Longest hold":"Heaviest carry";
const trDay=d=>new Date(d+"T12:00").toLocaleDateString("en-GB",{day:"numeric",month:"short"});
const trWday=d=>new Date(d+"T12:00").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});
function trSeries(name){
  const kind=trKind(name);
  return ((S.lifts&&S.lifts[name])||[]).map(e=>({d:e.d,v:trMetric(kind,e.sets),e})).filter(p=>p.v>0);
}
function trRecords(name){
  const kind=trKind(name), h=(S.lifts&&S.lifts[name])||[], all=h.flatMap(e=>(e.sets||[]).map(x=>({...x,d:e.d}))), out=[];
  if(!all.length) return out;
  const best=(f)=>all.reduce((a,x)=>f(x)>f(a)?x:a,all[0]);
  if(kind==="load"){
    const hv=best(x=>(x.kg||0)+(x.r||0)/1000), e1=best(x=>trE1(x.kg||0,x.r||0)), mr=best(x=>(x.r||0)+(x.kg||0)/1000);
    const vol=h.reduce((a,e)=>{ const v=(e.sets||[]).reduce((s,x)=>s+(x.kg||0)*(x.r||0),0); return v>a.v?{v,d:e.d}:a; },{v:0,d:null});
    out.push({k:"Heaviest",v:`${fkg(hv.kg)} kg`,s:`× ${hv.r} · ${trDay(hv.d)}`});
    out.push({k:"Best set",v:`${fkg(e1.kg)} × ${e1.r}`,s:`about ${fkg(trRound("load",trE1(e1.kg,e1.r)))} kg for 1`});
    out.push({k:"Most reps",v:`${mr.r}`,s:`at ${fkg(mr.kg)} kg`});
    if(vol.v) out.push({k:"Best session",v:`${fvol(vol.v)} kg`,s:trDay(vol.d)});
  } else if(kind==="bw"){
    const mr=best(x=>x.r||0), tot=h.reduce((a,e)=>{ const t=(e.sets||[]).reduce((s,x)=>s+(x.r||0),0); return t>a.t?{t,d:e.d}:a; },{t:0,d:null});
    out.push({k:"Most reps",v:`${mr.r}`,s:`${mr.kg?`+${fkg(mr.kg)} kg · `:""}${trDay(mr.d)}`});
    out.push({k:"Most in a session",v:`${tot.t}`,s:trDay(tot.d)});
    const wt=all.filter(x=>x.kg>0); if(wt.length){ const w=wt.reduce((a,x)=>x.kg>a.kg?x:a,wt[0]); out.push({k:"Most added",v:`+${fkg(w.kg)} kg`,s:`× ${w.r}`}); }
  } else if(kind==="time"){
    const lg=best(x=>x.s||0); out.push({k:"Longest hold",v:`${lg.s} s`,s:trDay(lg.d)});
  } else {
    const hv=best(x=>x.kg||0); out.push({k:"Heaviest",v:`${fkg(hv.kg)} kg`,s:trDay(hv.d)});
  }
  return out;
}
/* where this exercise sits in your week (for next time's target and its muscles), as the Train screen
   shows each day: your swaps, your order and, at home, the bodyweight version (rdtKit) */
function trFindItem(name){
  for(let k=0;k<7;k++){ const i=(todayIdx+k)%7; let s=null; try{ s=rdtApplyOrder(applySwaps(sessionForDay(i))); if(typeof rdtKit==="function") s=rdtKit(s); }catch(e){ try{ s=sessionForDay(i); }catch(e2){} }
    const it=s&&s.items&&s.items.find(x=>x.name===name); if(it) return {it,day:i}; }
  return null;
}
/* the muscle an exercise is listed under first; for the rest (MX levels, stretches, home moves) its main muscle from exdata.js */
function trPrimaryOf(name){ return GLORDER.find(k=>((MUSCLES[k]&&MUSCLES[k].ex)||[]).some(e=>e[0]===name))||(typeof exPrimary==="function"?exPrimary(name):null)||null; }
/* next time's target, in words: "72.5 kg × 6" */
function trTargetTxt(p){
  if(!p) return "";
  if(p.kind==="time") return `${p.secs[0]} s`;
  if(p.kind==="carry") return `${fkg(p.kg)} kg a hand`;
  if(p.kind==="tick") return "";
  const r=p.reps[0]??p.lo;
  if(p.kind==="bw") return p.kg?`+${fkg(p.kg)} kg × ${r}`:`${r} reps`;
  return `${fkg(p.kg)} kg × ${r}`;
}

/* ---------- plates per side, for lifts on a 20 kg barbell ---------- */
function trIsBar(name){ return /barbell|bench press|back squat|front squat|deadlift|overhead press|hip thrust|good morning|bent-over row|pendlay/i.test(name)&&!/dumbbell|goblet|cable|machine|smith|kettlebell|landmine|single-leg|bulgarian|split/i.test(name); }
function trPlatesTxt(kg){
  if(!(kg>0)) return "";
  if(kg<20) return "Lighter than a 20 kg bar";
  if(kg===20) return "Just the bar (20 kg)";
  let side=Math.round((kg-20)/2*100)/100; const out=[];
  [25,20,15,10,5,2.5,1.25].forEach(pl=>{ while(side>=pl-1e-6){ out.push(pl); side=Math.round((side-pl)*100)/100; } });
  return `Each side: ${out.map(fkg).join(" + ")}${side>0.01?" + a little":""} · on a 20 kg bar`;
}

/* ---------- the chart: a lime line over your sessions, newest on the right ---------- */
let TR_GID=0;
function trChartSVG(pts,kind,o){
  o=o||{}; if(!pts.length) return "";
  const W=o.w||320, H=o.h||128, P=o.spark?{l:2,r:2,t:3,b:3}:{l:8,r:8,t:16,b:10};
  const ts=pts.map(p=>new Date(p.d+"T12:00").getTime()), t0=Math.min(...ts), t1=Math.max(...ts);
  const vs=pts.map(p=>p.v), lo=Math.min(...vs), hi=Math.max(...vs), pad=(hi-lo)*0.22||Math.max(1,hi*0.08), y0=lo-pad, y1=hi+pad;
  const X=t=>t1===t0?W/2:P.l+(W-P.l-P.r)*(t-t0)/(t1-t0), Y=v=>P.t+(H-P.t-P.b)*(1-(v-y0)/(y1-y0));
  const xy=pts.map((p,i)=>[X(ts[i]),Y(p.v)]);
  const line=xy.map(([x,y],i)=>`${i?"L":"M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const gid="trg"+(++TR_GID), base=H-P.b;
  const area=xy.length>1?`${line} L${xy[xy.length-1][0].toFixed(1)} ${base} L${xy[0][0].toFixed(1)} ${base} Z`:"";
  const last=xy[xy.length-1];
  if(o.spark) return `<svg class="tr-spark" viewBox="0 0 ${W} ${H}" aria-hidden="true">${xy.length>1?`<path class="tr-ln" d="${line}"/>`:""}<circle class="tr-end" cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.6"/></svg>`;
  const grid=[0.25,0.5,0.75].map(f=>`<line class="tr-gl" x1="0" x2="${W}" y1="${(P.t+(H-P.t-P.b)*f).toFixed(1)}" y2="${(P.t+(H-P.t-P.b)*f).toFixed(1)}"/>`).join("");
  return `<svg class="tr-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${uiEsc(trMetricName(kind))}: ${pts.map(p=>trFmt(kind,p.v)).join(", ")}">
    <defs><linearGradient id="${gid}" x1="0" y1="${P.t}" x2="0" y2="${base}" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:var(--glow);stop-opacity:.28"/><stop offset="1" style="stop-color:var(--glow);stop-opacity:0"/></linearGradient></defs>
    ${grid}${area?`<path d="${area}" fill="url(#${gid})"/>`:""}${xy.length>1?`<path class="tr-ln" d="${line}"/>`:""}
    ${xy.map(([x,y],i)=>`<circle class="tr-pt${i===xy.length-1?" last":""}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i===xy.length-1?4.5:3}"/>`).join("")}
  </svg>`;
}

/* ---------- exercise insights: a panel of its own ---------- */
function trInsPanel(){
  let p=$("trInsP"); if(p) return p;
  p=document.createElement("section"); p.className="panel u-own tr-ins"; p.id="trInsP"; p.setAttribute("aria-label","Exercise insights");
  p.innerHTML=`<div class="p-head"><h2 id="trInsT">Insights</h2><button class="icon-btn" id="trInsX" aria-label="Close"><svg viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></div><div class="p-body" id="trInsB"></div>`;
  $("app").appendChild(p); $("trInsX").onclick=()=>{ Pulse.buzz(6); p.classList.remove("on"); };
  return p;
}
function openInsights(name,it){
  if(!name) return; Pulse.buzz(8); try{ track("ex_insights",{n:EXW[name]?name:"custom"}); }catch(e){}   // a name someone typed (their own exercise) never leaves the phone
  /* in front of whatever opened it (Kinetic chain, Where your sets went …): shell.js uiPanelFront */
  const p=typeof uiPanelFront==="function"?uiPanelFront(trInsPanel()):trInsPanel(), b=$("trInsB"), f=it?{it,day:null}:trFindItem(name); it=it||(f&&f.it)||null;
  const has=!!(S.lifts&&S.lifts[name]&&S.lifts[name].length);
  const kind=has||!it?trKind(name):(()=>{ try{ const k=exKind(it); return k==="tick"?"tick":k; }catch(e){ return "load"; } })();
  const pts=trSeries(name), recs=trRecords(name), hist=((S.lifts&&S.lifts[name])||[]).slice().reverse();
  /* no item: the muscle you last did it for (the one Workout complete credited, S.lifts p), else its own
     main muscle (exdata.js, EXW first), else the first muscle that lists it */
  const lastP=(()=>{ const h=(S.lifts&&S.lifts[name])||[]; for(let i=h.length-1;i>=0;i--){ if(h[i]&&MUSCLES[h[i].p]) return h[i].p; } return null; })();
  let own=null; try{ own=typeof exPrimary==="function"?exPrimary(name):null; }catch(e){}
  const prim=it?it.primary:lastP||(own&&MUSCLES[own]?own:null)||trPrimaryOf(name);
  let sec=it?it.sec||[]:[];
  if(!it&&prim&&MUSCLES[prim]){ try{ sec=mkItem(name,"3 × 10",prim).sec||[]; }catch(e){ sec=[]; } }
  const mchip=(k,on)=>{ const t=rankTier(S.scores[k]||0); return `<span class="tr-mc${on?" on":""}"><i class="rk-sq" style="--c:var(--rk-${t})"></i>${uiEsc(MUSCLES[k].name)}${on?`<em>${rankOf(S.scores[k]||0)}</em>`:""}</span>`; };
  const chips=prim&&MUSCLES[prim]?`${mchip(prim,true)}${sec.filter(k=>MUSCLES[k]).slice(0,3).map(k=>mchip(k,false)).join("")}`:"";
  /* the muscles it works: one button into Kinetic chain (discover.js), when that's in */
  const kc=chips&&typeof openKinetic==="function";
  const muscles=!chips?"":kc?`<button class="tr-mcs tr-kc" id="trInsKc" aria-label="What ${uiEsc(name)} works: Kinetic chain">${chips}<span class="tr-kc-go">Kinetic chain${UI_IC.chev}</span></button>`
    :`<div class="tr-mcs">${chips}</div>`;
  /* next time: what the plan will ask for */
  let next="";
  if(it&&kind!=="tick"){ let pl=null; try{ pl=liftPlan(it); }catch(e){}
    const tx=trTargetTxt(pl);
    if(pl&&tx) next=`<div class="u-card tr-next${pl.up?" up":pl.adj==="down"?" down":""}"><span class="u-eyebrow">Next time${f&&f.day!=null&&!TR.custom?` · ${f.day===todayIdx?"today":DAYN[f.day]}`:""}</span>
      <b class="tr-next-v">${pl.up?"↑ ":""}${uiEsc(tx)}<small>${it.sets} sets</small></b><p class="u-small">${uiEsc((pl.note||"").replace(/^↑\s*/,""))}</p></div>`; }
  const cur=pts.length?pts[pts.length-1].v:0, first=pts.length?pts[0].v:0, dlt=trRound(kind,cur)-trRound(kind,first);
  const head=pts.length?`<div class="tr-big"><span class="u-eyebrow">${trMetricName(kind)}</span><b class="u-num">${uiEsc(trFmt(kind,cur))}</b>
      ${pts.length>1?`<span class="tr-dl${dlt>0?" up":dlt<0?" dn":""}">${dlt>0?"+":dlt<0?"−":""}${dlt?uiEsc(trFmt(kind,Math.abs(dlt))):"Level"} since ${trDay(pts[0].d)}</span>`:`<span class="tr-dl">Your first session · ${trDay(pts[0].d)}</span>`}</div>
    <div class="tr-chartw">${trChartSVG(pts,kind)}${pts.length>1?`<div class="tr-ax"><span>${trDay(pts[0].d)}</span><span>${trDay(pts[pts.length-1].d)}</span></div>`:""}</div>`
    :`<div class="tr-empty"><b>No sets logged yet</b><p class="u-small">Log this exercise once and your trend starts here.</p></div>`;
  const rows=hist.slice(0,6).map(e=>{ const v=trMetric(kind,e.sets); return `<div class="tr-h"><span class="tr-hd">${trWday(e.d)}</span><span class="tr-hs">${uiEsc(lastText(kind,e.sets||[]))}</span>${kind==="load"&&v?`<em>${uiEsc(trFmt(kind,v))}</em>`:""}</div>`; }).join("");
  $("trInsT").textContent=name;
  b.innerHTML=`<div class="tr-ins-b">
    ${muscles}${head}${next}
    ${recs.length?`<div class="u-section-h"><span class="u-eyebrow">Records</span></div><div class="tr-recs">${recs.map(r=>`<div class="tr-rec"><span>${uiEsc(r.k)}</span><b>${uiEsc(r.v)}</b><small>${uiEsc(r.s)}</small></div>`).join("")}</div>`:""}
    ${rows?`<div class="u-section-h"><span class="u-eyebrow">Recent sessions</span></div><div class="u-card tr-hist">${rows}</div>`:""}
    ${kind==="load"&&pts.length?`<p class="u-small tr-foot">The 1-rep max is estimated from your best set (Epley formula). It's a guide, not a test: you never have to lift it.</p>`:""}
  </div>`;
  if(kc&&$("trInsKc")) $("trInsKc").onclick=()=>openKinetic(name,prim,{from:"insights"});
  b.parentNode.scrollTop=0; b.scrollTop=0; void p.offsetWidth; p.classList.add("on");   // force layout, then add .on in the same task so the fade-in plays (22 Oct, BUG-19)
}

/* ---------- "Train this muscle" (or region): a session for it, for where you train ---------- */
/* At the gym it's the muscle's own exercises. At home (bodyweight only) each muscle gets its home
   move, any of its other exercises that need no kit, and for a single muscle its stretch to finish. */
function trSessionFor(s){
  const base=sessionFor(s); if(rdtMode()==="gym") return base;
  const a=rdtA(), one=s.t==="muscle", ks=one?[s.id]:REGIONS[s.id].muscles;
  const home=new Set([...Object.values(EQX).map(x=>x&&x[1]).filter(Boolean),...BW_EX]);
  const items=[], seen=new Set();
  const add=(nm,dose,k)=>{ if(!nm||seen.has(nm)) return null; seen.add(nm); const it=mkItem(nm,dose,k); items.push(it); return it; };
  ks.forEach(k=>{ const nm=rdtEx(k,a); add(nm,doseFor(nm,a,one?4:3),k); });
  const kit=/band|dip|hang|pull-up|chin-up|nordic|glute-ham|ab wheel|carry/i;   // need a bar, a band, a bench or weights: only if it's already the muscle's home move
  ks.forEach(k=>((MUSCLES[k]&&MUSCLES[k].ex)||[]).forEach(e=>{ if(items.length<4&&home.has(e[0])&&!kit.test(e[0])) add(e[0],e[1],k); }));
  if(one&&items.length<3){ const st=MX[s.id]&&MX[s.id].stretch&&MX[s.id].stretch[0]; if(st){ const it=add(st[0],st[1],s.id); if(it) it.mob=true; } }
  return items.length?{...base,items,note:`${base.note||""}`}:base;
}

/* ---------- the session screen, before you start (over your body, today's muscles lit) ---------- */
/* the muscles a session works, by share of its RP load (vessel.js: helper weights, slot credit, the
   1.8 helper cap), each with the whole rank points it gets if you finish every set. Those are the same
   numbers Workout complete gives (vxPreview). A mobility session earns none (finishWorkout credits it
   nothing), and neither does a stretch: then the chips list the muscles it moves, with no points.
   {k, p: % of the session's load, rp: +N RP} */
function trTargets(items,none){
  items=items||[];
  const g=none?{}:vxPreview(items); let L=none?{}:vxLoad(items).L;
  if(!Object.keys(L).length) L=vxShowLoad(items);
  const ks=Object.keys(L).filter(k=>MUSCLES[k]&&L[k]>0), tot=ks.reduce((a,k)=>a+L[k],0)||1;
  return ks.sort((a,b)=>L[b]-L[a]||(g[b]||0)-(g[a]||0)).map(k=>({k,p:Math.round(L[k]/tot*100),rp:g[k]||0}));
}
function trTargetsHTML(items,none){
  const T=trTargets(items,none).slice(0,6); if(!T.length) return "";
  const any=T.some(x=>x.rp>0);
  return `<div class="tp-tm" role="list" aria-label="Muscles this works${any?", and the rank points each gets if you finish every set":""}">${T.map(x=>{ const sc=S.scores[x.k]||0, t=rankTier(sc), nm=MUSCLES[x.k].name;
    return `<button class="tp-tmc" role="listitem" data-tm="${x.k}" style="--c:var(--rk-${t})" aria-label="${uiEsc(nm)}, ${x.rp?`plus ${x.rp} rank point${x.rp>1?"s":""}`:any?"less than a rank point":`${x.p}% of the work`}, ${rankOf(sc)}"><i class="rk-sq"></i>${uiEsc(nm)}${x.rp?`<em>+${x.rp} RP</em>`:""}</button>`; }).join("")}</div>`;
}
/* a tag the Sore spots screen (injury.js) adds to a plan row whose muscle or joint you flagged */
function trRowTag(it){ try{ return typeof vxRowTag==="function"?vxRowTag(it)||"":""; }catch(e){ console.warn(e); return ""; } }
function trPlanRowHTML(it,i){
  const t=rankTier(S.scores[it.primary]||0), hint=planHint(it);
  const tags=[it.fix?`<em class="fx">${/^ps:/.test(it.fix)?"Posture scan":"Body check"}</em>`:"",it.bal?`<em class="bl">Balance</em>`:"",trRowTag(it)].filter(Boolean).join(" · ");
  return `<li class="tp-r${TR.planSel===i?" sel":""}" data-i="${i}" style="--k:${i}">
    <span class="no">${String(i+1).padStart(2,"0")}</span>
    <div class="tx"><b>${uiEsc(it.name)}</b><small><i class="rk-sq" style="--c:var(--rk-${t})"></i>${uiEsc(MUSCLES[it.primary].name)}${tags?` · ${tags}`:""}${hint?` · ${hint}`:""}</small>${it.rec!=null?`<em class="rc">${Math.round(it.rec*100)}% recovered, 1 set fewer</em>`:""}</div>
    <span class="ds">${it.sets} × ${uiEsc(it.target)}</span>
    <p class="wy"><span>Why it's here</span>${whyFor(it)}</p>
    <div class="ac">${i?`<button data-first="${i}"><svg viewBox="0 0 12 12"><path d="M3 5.5L6 2.5l3 3M6 2.5v7"/></svg>Do first</button>`:""}<button data-watch="${i}"><svg viewBox="0 0 12 12"><path d="M4 2.5v7l6-3.5z"/></svg>Watch</button>${altsFor(it).length>1?`<button data-swap="${i}">${TR_IC.swap}Swap</button>`:""}<button data-ins="${i}">${TR_IC.chart}Insights</button></div></li>`;
}
function drawPlanFloat(){
  const el=$("train"), app=$("app"), s=TR.session, items=s.items, isToday=!TR.custom&&TR.day===todayIdx;
  app.classList.remove("tactive","tresting","tdone"); app.classList.add("tplan");
  if(TR.planSelForce) TR.planSelForce=false; else if(TR.planSel!=null&&(!items[TR.planSel]||TR.planSelKey!==s.title+TR.day)) TR.planSel=null;
  TR.planSelKey=s.title+TR.day;
  const d0=new Date(); d0.setDate(d0.getDate()-todayIdx);
  const week=PLAN.map((p,i)=>{ const dt=new Date(d0); dt.setDate(d0.getDate()+i); const ds=dayState(i);
    return `<button class="tw${i===TR.day&&!TR.custom?" on":""}${i===todayIdx?" tdy":""}" data-day="${i}" aria-label="${DAYN[i]}: ${ds.lab}, ${({ready:"ready",rec:"still recovering",done:"done",rest:"rest day",past:"missed"})[ds.st]}"><span>${p[0].slice(0,1)}</span><b>${dt.getDate()}</b><em>${ds.lab}</em><i class="${ds.st}"></i></button>`; }).join("");
  const wk=progWeek(), plan=TR.custom?`<button class="tp-plan" id="backToday">‹ This week's plan</button>`
    :S.program?`<button class="tp-plan" id="genOpen"><i></i>Build muscle · Week ${wk.n}${wk.deload?" · lighter":""}<em>Edit</em></button>`
    :`<button class="tp-plan cta" id="genOpen"><i></i>Build my plan<em>›</em></button>`;
  const why=planWhy(s,isToday), dayName=TR.custom?"Built from your body":isToday?`Today · ${DAYN[TR.day]}`:DAYN[TR.day];
  const restKs=items.length?null:GLORDER.filter(k=>stateOf(k)==="recovering").sort((a,b)=>hoursLeft(b)-hoursLeft(a));
  let lower;
  if(items.length){
    const mins=estMin(items), end=new Date(Date.now()+mins*60000).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}), again=isToday&&doneToday();
    const tchips=TR.custom?"":[15,30,45].filter(m=>m<TR.fullMin).map(m=>`<button class="tc${TR.mins===m?" on":""}" data-mins="${m}">${m}</button>`).join("")+`<button class="tc${!TR.mins||TR.mins>=TR.fullMin?" on":""}" data-mins="0">Full · ${TR.fullMin}</button>`;
    lower=`${trTargetsHTML(items,s.kind==="mobility")}
      <div class="tp-time">${tchips?`<span class="tl">Minutes</span>${tchips}`:""}${isToday?`<button class="tp-minb" id="tpMin">Bad day? 5-min minimum</button>`:""}</div>
      <ol class="tp-list" id="tpList">${items.map(trPlanRowHTML).join("")}</ol>
      <div class="tp-cta"><button class="u-btn ${again?"":"primary "}block tp-go" id="startW">${again?"Train again":`Start workout<span class="tp-end">done by ${end}</span>`}</button></div>`;
  } else {
    const mob=mobilitySession();
    lower=`<div class="tp-rest">${restKs.length?`<div class="u-eyebrow">Still recovering</div><ol class="tp-list rest">${restKs.slice(0,4).map(k=>{ const h=hoursLeft(k), pc=Math.round(recoveredPct(k)*100);
        return `<li class="tp-r"><span class="no"><i style="opacity:${(0.3+0.7*recOf(k)).toFixed(2)}"></i></span><div class="tx"><b>${uiEsc(MUSCLES[k].name)}</b><small><span class="u-bar tp-rb" aria-label="${pc}% recovered"><i style="width:${pc}%"></i></span></small></div><span class="ds">${h<=12?"fresh tonight":h<=30?"fresh tomorrow":`${Math.ceil(h/24)} days`}</span></li>`; }).join("")}</ol>`
        :`<p class="tp-restp">Rest days are when training turns into progress. Keep moving gently.</p>`}
      </div>
      <div class="tp-cta"><button class="u-btn primary block tp-go" id="startMob">Start mobility<span class="tp-end">${estMin(mob.items)} min</span></button></div>`;
    TR.mob=mob;
  }
  const stats=items.length?`<div class="tp-stats"><span><b class="u-num">${items.length}</b><small>exercises</small></span><span><b class="u-num">${totalSets(items)}</b><small>sets</small></span><span><b class="u-num">${estMin(items)}</b><small>min</small></span></div>`
    :`<div class="tp-meta">Rest · recover · move</div>`;
  /* the plan pill and the other ways in (something else, edit, the week) share one row at the top */
  const bar=rdTrainBar(), acts=bar.replace(/^<div class="rdt-bar">/,"").replace(/<\/div>\s*$/,"");
  el.innerHTML=`<div class="tp u-tp${TR.pick||TR.ed?" rdt-open":""}">
    <div class="tp-top"><div class="rdt-bar tp-acts">${plan}${acts}</div><div class="tp-week" role="tablist" aria-label="This week">${week}</div></div>
    <div class="tp-head${TR.planEnter?" enter":""}"><div class="u-eyebrow tp-eye">${dayName}</div><h1 class="tp-h">${uiEsc(items.length?s.title:"Recovery day")}</h1>
      ${stats}
      <div class="tp-why ${why.cls}"><b>${why.tag}</b><span>${why.txt}${why.link?` <button class="linkbtn" id="keepPlan">${why.link}</button>`:""}</span></div></div>
    <div class="tp-low">${TR.pick?rdtPickHTML():TR.ed?rdtEditHTML():lower}</div></div>`;
  TR.planEnter=false;
  // wiring
  el.querySelectorAll("[data-day]").forEach(b=>b.onclick=()=>{ if(TR.day===+b.dataset.day&&!TR.custom) return; TR.day=+b.dataset.day; TR.custom=false; TR.pick=TR.ed=null; TR.planSel=null; TR.planEnter=true; Pulse.buzz(6); drawTrain(); });
  if($("genOpen")) $("genOpen").onclick=openGen;
  el.querySelectorAll("[data-mins]").forEach(b=>b.onclick=()=>{ const v=+b.dataset.mins||null; if(v===TR.mins) return; TR.mins=v; TR.planSel=null; Pulse.buzz(6); drawTrain(); toast(v?`Sized to ${v} minutes: the most important work first.`:"Full session"); });
  if($("tpMin")) $("tpMin").onclick=()=>{ Pulse.buzz(8); TR.custom=true; TR.session=minimumSession(); TR.planSel=null; TR.planEnter=true; drawTrain(); };
  if($("backToday")) $("backToday").onclick=()=>{ TR.custom=false; TR.day=todayIdx; TR.planEnter=true; drawTrain(); };
  if($("keepPlan")) $("keepPlan").onclick=()=>{ TR.keep=true; drawTrain(); };
  if($("startW")) $("startW").onclick=()=>{ Pulse.buzz(12); if(reduced) return startWorkout(); el.querySelector(".tp").classList.add("go"); setTimeout(startWorkout,340); };
  if($("startMob")) $("startMob").onclick=()=>{ Pulse.buzz(12); TR.custom=true; TR.session=TR.mob; if(reduced) return startWorkout(); el.querySelector(".tp").classList.add("go"); setTimeout(startWorkout,340); };
  el.querySelectorAll(".tp-list:not(.rest) .tp-r").forEach(li=>{
    const i=+li.dataset.i; let sx=null, dx=0;
    li.addEventListener("pointerdown",e=>{ if(e.target.closest("button")) return; sx=e.clientX; dx=0; });
    li.addEventListener("pointermove",e=>{ if(sx==null) return; dx=Math.min(0,e.clientX-sx); if(dx<-6) li.style.transform=`translateX(${Math.max(-80,dx)}px)`; });
    const end=()=>{ if(sx==null) return; sx=null; li.style.transform=""; if(dx<-60) swapEx(i); else if(Math.abs(dx)<6) selRow(i); };
    li.addEventListener("pointerup",end); li.addEventListener("pointercancel",()=>{ sx=null; li.style.transform=""; });
  });
  el.querySelectorAll("[data-watch]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); const it=items[+b.dataset.watch]; TR.planTouch=Date.now(); TR.glowOn=null; startDemo(it.name,`${it.sets} × ${it.target}`,it.primary); });
  el.querySelectorAll("[data-swap]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); swapEx(+b.dataset.swap); });
  el.querySelectorAll("[data-ins]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); const it=items[+b.dataset.ins]; if(it) openInsights(it.name,it); });
  el.querySelectorAll("[data-tm]").forEach(b=>b.onclick=()=>{ Pulse.buzz(5); TR.planTouch=Date.now(); try{ Body.pulse&&Body.pulse([b.dataset.tm]); }catch(e){} });
  if(!TR.pick&&!TR.ed) planGlow(items,TR.planSel,restKs);
  rdWireTrainBar();
  el.scrollTop=0;   // the screen fits the phone; only the list scrolls
  requestAnimationFrame(()=>Body.reframe());
}

/* ---------- the hub: what's recovered, and your main lifts ---------- */
/* "ready" counts only muscles that are trained, recovered and not fading: unexplored and fading ones
   aren't "ready", they're their own line (one neglect rule, vessel.js) */
function trRecoveryHTML(){
  const st={}; GLORDER.forEach(k=>{ try{ st[k]=stateOf(k); }catch(e){ st[k]="ready"; } });
  const rec=GLORDER.filter(k=>st[k]==="recovering").sort((a,b)=>recoveredPct(a)-recoveredPct(b)), n=GLORDER.length, ready=GLORDER.filter(k=>st[k]==="ready").length;
  const fad=GLORDER.filter(k=>st[k]==="fading").sort((a,b)=>daysSince(b)-daysSince(a)), nw=GLORDER.filter(k=>st[k]==="new").length;
  const when=k=>{ const h=hoursLeft(k); return h<=12?"fresh tonight":h<=30?"fresh tomorrow":`fresh in ${Math.ceil(h/24)} days`; };
  const seg={ready:"tr-sg-ok",recovering:"tr-sg-rc",fading:"tr-sg-fd",new:"tr-sg-nw"};
  const fline=fad.length?`<p class="u-small tr-fd"><i aria-hidden="true"></i><span><b>${uiEsc(fad.slice(0,2).map(k=>MUSCLES[k].name).join(", "))}${fad.length>2?` +${fad.length-2}`:""}</b> fading: not trained for ${fad.length===1?(daysSince(fad[0])>=60?"over 60":daysSince(fad[0])):NEGLECT_DAYS+"+"} days.</span></p>`:"";
  return `<div class="u-section-h"><span class="u-eyebrow">Recovery</span><span class="u-eyebrow tr-rdy"><b>${ready}</b>/${n} ready</span></div>
    <section class="u-card tr-recv">
      <div class="tr-segs" aria-hidden="true">${GLORDER.map(k=>`<i class="${seg[st[k]]||"tr-sg-ok"}"></i>`).join("")}</div>
      ${rec.length?`<div class="tr-rl">${rec.slice(0,3).map(k=>{ const pc=Math.round(recoveredPct(k)*100);
          return `<div class="tr-rr"><b>${uiEsc(MUSCLES[k].name)}</b><span class="u-bar"><i style="width:${pc}%"></i></span><em>${pc}%</em><small>${when(k)}</small></div>`; }).join("")}</div>
        ${rec.length>3?`<p class="u-small">+${rec.length-3} more still recovering.${nw?` ${nw} not trained yet.`:""}${fad.length||nw?"":" Everything else is ready."}</p>`:fad.length?"":`<p class="u-small">${nw?`${nw} not trained yet. `:""}Everything else is ready to train.</p>`}`
      :`<p class="u-small tr-all"><b>Everything's recovered.</b> Train anything today.</p>`}
      ${fline}
    </section>`;
}
/* your main lifts: the ones you've logged most, with their trend */
function trTopLifts(n){
  const L=Object.entries(S.lifts||{}).map(([name,h])=>({name,h,kind:trKind(name)})).filter(x=>x.h.length>=2&&x.kind==="load");
  L.forEach(x=>{ x.pts=trSeries(x.name); x.last=x.h[x.h.length-1].d; });
  return L.filter(x=>x.pts.length>=2).sort((a,b)=>(b.h.length-a.h.length)||(a.last<b.last?1:-1)).slice(0,n);
}
function trLiftsHTML(){
  const L=trTopLifts(3); if(!L.length) return "";
  return `<div class="u-section-h"><span class="u-eyebrow">Your lifts</span><span class="u-eyebrow">Est. 1-rep max</span></div>
    <div class="u-card u-list tr-lifts">${L.map(x=>{ const a=x.pts[0].v, z=x.pts[x.pts.length-1].v, d=trRound("load",z)-trRound("load",a);
      return `<button class="u-row tr-lift" data-lift="${encodeURIComponent(x.name)}" aria-label="${uiEsc(x.name)}: about ${uiEsc(trFmt("load",z))} for one rep${d?`, ${d>0?"up":"down"} ${uiEsc(trFmt("load",Math.abs(d)))}`:""}. Insights">
        <span class="tr-sparkw">${trChartSVG(x.pts.slice(-8),"load",{spark:true,w:64,h:28})}</span>
        <span><b>${uiEsc(x.name)}</b><small>${uiEsc(trFmt("load",z))}${d?` · <em class="${d>0?"up":"dn"}">${d>0?"+":"−"}${uiEsc(trFmt("load",Math.abs(d)))}</em> since ${trDay(x.pts[0].d)}`:""}</small></span>${UI_IC.chev}</button>`; }).join("")}</div>`;
}
function trWireHub(el){
  el.querySelectorAll("[data-lift]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); openInsights(decodeURIComponent(b.dataset.lift)); });
}

/* ---- Bones › a joint › Relief routine: a short routine built for that joint, opened straight in
   Train (not the ache picker, which lumped elbows in with wrists and ankles in with knees).
   Each move: [name, dose, muscle, why it's here]. ---- */
const JOINT_RELIEF={
  neck:{c:"Looking down at a phone loads your neck with several times the weight of your head. Ease the sides of your neck, then wake up the muscles that hold your head back.",m:[
    ["Chin tucks","2 × 10","traps","Draws your head back over your spine, so your neck stops carrying it forward."],
    ["Upper trap stretch","2 × 30 s each side","traps","Eases the side of your neck that tightens when your shoulders creep up."],
    ["Doorway pec stretch","2 × 30 s","pec_minor","A tight chest pulls your shoulders and head forward. This opens it."],
    ["Prone Y-raise","2 × 10","traps","Strengthens the lower traps that hold your shoulders down and back."]]},
  shoulder:{c:"Your shoulders are held in place mostly by muscle. Hunching and lots of pressing tighten the front and leave the back weak, and that's where pinching starts.",m:[
    ["Wall slide","2 × 10","serratus","Teaches your shoulder blades to glide up as your arms rise, without pinching."],
    ["Doorway pec stretch","2 × 30 s","pec_major","Opens the front of the shoulder that pressing and sitting tighten."],
    ["Sleeper stretch","2 × 30 s each side","rear_delt","Loosens the back of the shoulder so the joint can turn freely."],
    ["Prone T-raise","2 × 10","rhomboids","Wakes up the muscles between your shoulder blades that keep the joint centred."]]},
  elbow:{c:"Elbow aches usually come from the forearm tendons that grip and curl. Ease them, then load them slowly so they get tougher.",m:[
    ["Wrist extensor stretch","2 × 30 s each side","forearms","Eases the tendon on the outside of your elbow, where most elbow aches start."],
    ["Wrist flexor stretch","2 × 30 s each side","forearms","Eases the inside of your elbow, where gripping and curling pull."],
    ["Slow wrist lowering","2 × 12 each side","forearms","Lowering a light weight slowly toughens elbow tendons. A water bottle works."],
    ["Forearm rotations","2 × 10 each side","forearms","Turns your forearm through its full range to keep the joint moving."]]},
  wrist:{c:"Phones, keyboards and push-ups keep your wrists bent for hours. Take them through their full range, then build a little grip.",m:[
    ["Wrist circles","1 × 10 each way","forearms","Takes your wrists through every direction they move."],
    ["Prayer stretch","2 × 30 s","forearms","Opens the palm side of your wrists, which typing keeps closed."],
    ["Reverse prayer stretch","2 × 20 s","forearms","Opens the back of your wrists."],
    ["Fist to spread","2 × 15","forearms","Gentle hand work that gets blood moving through your wrists."]]},
  lowback:{c:"Hours of sitting stiffen your lower back and switch your glutes off. Move it gently, then wake up the muscles that support it.",m:[
    ["Cat-cow","2 × 8","erectors","Moves your spine gently through bending and arching."],
    ["Knee-to-chest stretch","2 × 30 s each side","glute_max","Eases your lower back and the glute on that side."],
    ["Glute bridge","2 × 12","glute_max","Wakes up your glutes so your lower back doesn't do their job."],
    ["Bird dog","2 × 8 each side","erectors","Trains your back to stay steady while your arms and legs move."]]},
  hip:{c:"Long hours sitting shorten the front of your hips and switch your glutes off. Loosen the front, then wake up the side and back.",m:[
    ["Half-kneeling hip flexor stretch","2 × 30 s each side","quads","Lengthens the front of your hip, which sitting keeps short."],
    ["Figure-four stretch","2 × 30 s each side","glute_max","Loosens the deep muscles at the back of your hip."],
    ["90/90 hip switch","2 × 8","glute_med","Turns your hips in and out, which sitting never does."],
    ["Side-lying clamshell","2 × 15 each side","glute_med","Strengthens the side of your hip that keeps your knees and pelvis level."]]},
  knee:{c:"Knee aches usually start above or below the knee: tight thighs or weak hips. Loosen the front of your thigh and strengthen what holds the knee in line.",m:[
    ["Standing quad stretch","2 × 30 s each side","quads","Eases the front of your thigh, which pulls on the kneecap."],
    ["Straight-leg raise","2 × 12 each side","quads","Strengthens your thigh without bending a sore knee."],
    ["Side-lying leg raise","2 × 12 each side","glute_med","A stronger side of the hip stops your knee caving in."],
    ["Wall sit","2 × 20 s","quads","A steady hold that loads the knee gently. Only go as low as feels fine."]]},
  ankle:{c:"Stiff ankles limit your squat and push the strain up to your knees. Get them moving, then strengthen your calves.",m:[
    ["Ankle circles","1 × 10 each way","tibialis","Takes your ankles through their full range."],
    ["Wall calf stretch","2 × 30 s each side","gastrocnemius","Loosens your calf, which limits how far your ankle bends."],
    ["Knee-to-wall rock","2 × 10 each side","soleus","Drives your knee over your toes to free up the ankle."],
    ["Calf raises","2 × 12","gastrocnemius","Strengthens your calf and the tendon that takes every stride."]]}
};
function trJointSession(j){
  const J=JOINTS[j], R=JOINT_RELIEF[j]; if(!J||!R) return null;
  const items=R.m.filter(x=>MUSCLES[x[2]]).map(([n,d,k,w])=>{ const it=mkItem(n,d,k); it.mob=true; it.jwhy=w; return it; });
  const nm={shoulder:"Shoulder",elbow:"Elbow",wrist:"Wrist",hip:"Hip",knee:"Knee",ankle:"Ankle"}[j]||J.name;
  return {title:`${nm} relief`,note:"Gentle mobility for an ache",kind:"mobility",day:todayIdx,items,relief:R.c};
}
function trJointRelief(j){
  const s=trJointSession(j);
  setSheet("closed");
  if(!s){ const J=JOINTS[j]; return openRelief(J&&J.relief); }
  if(TR.view==="active"){ setMode("train"); toast("Finish or end your current workout first"); return; }
  TR={...TR,view:"plan",custom:true,hub:false,pick:null,ed:null,planSel:null,planEnter:true,session:s};
  try{ track("joint_relief",{j}); }catch(e){}
  setMode("train"); $("train").scrollTop=0;
}
/* a relief routine explains itself: the cause up top, each move's reason in its row */
(()=>{ const _why=whyFor, _pw=planWhy, _rs=reliefSession;
  reliefSession=function(id){ const s=_rs.apply(this,arguments); if(s&&RELIEF[id]) s.relief=RELIEF[id].c; return s; };
  whyFor=function(it){ return it&&it.jwhy?it.jwhy:_why.apply(this,arguments); };
  planWhy=function(s){ return s&&s.relief?{tag:"Relief",cls:"ok",txt:s.relief}:_pw.apply(this,arguments); }; })();
