/* =========================================================
   TRAIN — HOME (Andrej, 18 Oct, from two references he sent: a health "snapshot" home and an anime gym app).
   The Train hub is a home page laid out like an RPG, without the 3D body (the Body tab owns it; Andrej, 18 Oct:
   "if it's not necessary then we can get rid of it"): a header ("Hey, Andrej · Welcome back", the state line,
   the avatar, the rank hex, the Home/Gym switch); a status bar (your rank, the XP bar to the next level, your
   path, the streak); today's quest as the hero card (a still of your body with the session's muscles lit, the
   region, the title, minutes and moves, the reward in rank points, the one bone play button); a week strip with
   today ringed; the week's other quests; then, lower, "Your progress": the status bar, the Today / This week
   stat cards with small charts, and the attributes (every region's rank as a bar). Training first, ranks second
   (Andrej, 18 Oct). The page scrolls; the body stays
   behind the hero and the black sheet slides over it. Replaces rdTrainHub in shell.js (last declaration wins)
   and dresses the session screen (a drawPlanFloat wrapper: thumbnails on the rows, a bigger title).
   Prefix dk*. No 3D on this screen: the stage stays hidden under .thub (ossa.html's own rule).
   - dkCards()   the sessions: {id, kind: today|done|rest|day, d, s, ks, ok, h, rec, targets…}, the day's own
                 card first, then recovered sessions, then recovering ones by how soon they're back
   - dkDraw()    the whole page; dkTopHTML the header; dkHudHTML the status bar; dkQuestHTML today's quest, the
                 hero card; dkStats(c) the three stat cards for the chosen tab; dkAttrsHTML the attributes;
                 dkRowHTML(c) a quest row; dkSay: the header's line answers a tap on a stat card
   - dkShot(c)   a still of your body with the card's muscles lit (Body.shot as a canvas, cached); dkThumb(k) one muscle;
                 dkFill puts the canvas in the box
   - dkAct(c,k)  what the buttons do; dkIgnite: Start sweeps lime across the screen; dkMore() the More panel
   Wraps drawPlanFloat (dkPlanDress). Bugs it closes (docs/BUGS.md 39–42): see the notes there.
   ========================================================= */
function dkS(){ return dkS.s||(dkS.s={i:0,key:"",cards:[],tab:"today"}); }
function dkOn(){ return !!($("app")&&$("app").classList.contains("train")&&$("app").classList.contains("thub")&&$("dkHome")); }

/* ---------- the sessions ---------- */
/* a session's readiness: the muscles it's for, which are still recovering (slowest first), the hours until
   all of them are back, and whether it's good to go now (within the two hours dayState allows) */
function dkReady(items){
  const ks=[...new Set((items||[]).map(it=>it.primary).filter(k=>MUSCLES[k]))];
  const rec=ks.filter(k=>uiSafe(()=>stateOf(k),"ready")==="recovering").sort((a,b)=>hoursLeft(b)-hoursLeft(a));
  const h=rec.length?Math.max(...rec.map(hoursLeft)):0;
  return {ks,rec,h,ok:h<=2};
}
/* when a recovering session comes back, as a label and as a short word */
function dkWhen(h){
  if(h<=2) return {tag:"Ready",short:"ready"};
  if(h<=12) return {tag:"Ready tonight",short:"tonight"};
  if(h<=30) return {tag:"Ready tomorrow",short:"tomorrow"};
  const d=new Date(Date.now()+h*3.6e6), days=Math.ceil(h/24);
  if(days>=6) return {tag:`Ready in ${days} days`,short:`${days} days`};
  const w=d.toLocaleDateString("en-GB",{weekday:"long"});
  return {tag:`Ready ${w}`,short:w.slice(0,3)};
}
function dkTitle(t){ return String(t||"Workout").replace(/\s*·\s*\d+\s*min$/,""); }
function dkSession(d){
  try{ let s=d===todayIdx?rdTodaySession():rdtApplyOrder(applySwaps(sessionForDay(d))); if(d!==todayIdx&&typeof rdtKit==="function") s=rdtKit(s); return s; }catch(e){ console.warn(e); return {title:"Rest",items:[],day:d}; }
}
/* the next day with a session, looking past the end of the week (nextTrainIdx stops at Sunday) */
function dkNextDay(){ for(let n=1;n<=7;n++){ const d=(todayIdx+n)%7; if((dkSession(d).items||[]).length) return d; } return -1; }
function dkTodayRec(){ const W=S.workouts||[], d=dkey(0); for(let i=W.length-1;i>=0;i--){ if(W[i].d===d&&W[i].kind!=="posture") return {rec:W[i],i}; } return null; }
function dkCards(){
  const done=doneToday(), seen=new Set(), cards=[];
  const targets=(items,none)=>uiSafe(()=>trTargets(items,none),[]);
  for(let n=0;n<7;n++){
    const d=(todayIdx+n)%7, s=dkSession(d), items=s.items||[];
    if(n===0){
      if(done){ const r=dkTodayRec(); if(r){ const rp=Object.entries(r.rec.rp||{}).filter(([k])=>MUSCLES[k]).sort((a,b)=>b[1]-a[1]);
          cards.push({id:"done",kind:"done",d,w:r.rec,wi:r.i,title:dkTitle(r.rec.title),ks:rp.map(x=>x[0]),ld:r.rec.ld||null,rp,
            earned:rp.reduce((a,x)=>a+x[1],0),ok:true,h:0,rec:[]}); }
        if(items.length){ seen.add(dkTitle(s.title)); } continue; }   // what you did today; the day's plan is done
      if(!items.length){ const m=uiSafe(mobilitySession,{title:"Mobility",items:[]}), R=dkReady(GLORDER.map(k=>({primary:k})));
        cards.push({id:"rest",kind:"rest",d,s:m,title:"Recovery day",ks:[],rec:R.rec,h:0,ok:true,mob:true}); continue; }
      const R=dkReady(items); seen.add(dkTitle(s.title));
      cards.push({id:"today",kind:"today",d,s,title:dkTitle(s.title),...R,targets:targets(items,s.kind==="mobility")}); continue;
    }
    if(!items.length) continue;
    const t=dkTitle(s.title); if(seen.has(t)) continue; seen.add(t);
    const R=dkReady(items);
    cards.push({id:"d"+d,kind:"day",d,n,s,title:t,...R,targets:targets(items,s.kind==="mobility")});
  }
  /* saved plans (today, the Posture plan from the scan): their own cards so the Train deck surfaces them too */
  const sp=uiSafe(()=>typeof savedPlans==="function"?savedPlans():[],[]);
  const planCards=sp.map(p=>{ const items=uiSafe(()=>typeof planItems==="function"?planItems(p):(p.items||[]),p.items||[]);
    return {id:"plan:"+p.id,kind:"plan",d:todayIdx,s:{title:p.name,note:p.note||"",items,kind:p.kind,fix:p.kind==="posture"},
      title:p.name,ks:[],rec:[],h:0,ok:true,plan:p,targets:targets(items,p.kind==="posture")}; });
  /* the day's own card stays first; the rest: recovered first, then by how soon they're back, then the week's order */
  const head=cards.filter(c=>c.kind!=="day"), rest=cards.filter(c=>c.kind==="day").sort((a,b)=>(b.ok-a.ok)||(a.h-b.h)||(a.n-b.n));
  return head.concat(planCards,rest).slice(0,6);
}
function dkState(c){ return c.kind==="done"?"done":c.kind==="rest"?"rest":c.ok?"ready":"rec"; }
function dkEnd(items){ const m=estMin(items); return new Date(Date.now()+m*60000).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}); }
function dkWeek(){
  const planned=PLAN.filter((p,i)=>uiSafe(()=>sessionForDay(i).items.length>0,false)).length;
  let wk=0; for(let n=0;n<=todayIdx;n++){ if((S.workouts||[]).some(w=>w.d===dkey(n)&&w.kind!=="posture")) wk++; }
  return {wk,planned};
}
/* the region words for a session: "Legs & glutes", "Chest & shoulders", else its regions */
function dkRegion(c){
  if(c.kind==="done") return "Done today";
  if(c.kind==="rest") return "Mobility";
  const L=typeof DAY_LABEL!=="undefined"&&DAY_LABEL[c.title]; if(L) return L;
  const r=uiSafe(()=>uiSessionRegions(c.s.items),[]); return r.length?r.slice(0,2).join(" & "):"Your session";
}

/* ---------- the stills ---------- */
/* a still of your body with the card's muscles lit, from the side most of them face, cropped to their half;
   cached by body, finish, look and muscles (twelve at most). dkThumb: one muscle, for the session screen's rows */
function dkMask(c){
  const m={};
  if(c.kind==="done"){ const src=c.ld&&Object.keys(c.ld).length?c.ld:(c.w.rp||{}); const mx=Math.max(0.001,...Object.values(src));
    Object.entries(src).forEach(([k,v])=>{ if(MUSCLES[k]) m[k]=Math.round((0.3+0.7*v/mx)*100)/100; }); return m; }
  if(c.kind==="rest"){ c.rec.slice(0,6).forEach(k=>{ m[k]=0.5; }); return m; }
  (c.s.items||[]).forEach(it=>{ if(MUSCLES[it.primary]) m[it.primary]=1; (it.sec||[]).slice(0,3).forEach(k=>{ if(MUSCLES[k]&&!m[k]) m[k]=0.3; }); });
  return m;
}
function dkFrame(mask){
  let fr=0,bk=0,up=0,lo=0,all=0;
  Object.entries(mask).forEach(([k,v])=>{ all+=v; if((MUSCLES[k].face||0)>1.57) bk+=v; else fr+=v;
    const g=MUSCLES[k].region; if(["glutes","thighs","lowerlegs"].includes(g)) lo+=v; else up+=v; });
  if(!all) return {yaw:0,crop:null};
  return {yaw:bk/all>=0.6?Math.PI:0,crop:up/all>=0.75?[0.04,0.56]:lo/all>=0.75?[0.4,0.98]:[0.04,0.8]};
}
function dkShotFor(mask,h){
  if(typeof Body==="undefined"||!Body||Body.kind!=="gl"||typeof Body.shot!=="function"||!Object.keys(mask).length) return null;
  const f=dkFrame(mask), look=uiSafe(()=>typeof bxLookKey==="function"?bxLookKey():"","");
  const key=[S.body,S.finish||"",look,f.yaw,f.crop?f.crop.join(","):"",h,Object.keys(mask).sort().map(k=>k+mask[k]).join(",")].join("|");
  /* a canvas, not a PNG: no GPU read-back and no encode, which held up taps on Train for a moment per thumbnail (perf, 21 Oct).
     A cached still that's already on the page is copied, since an element can only sit in one place */
  const C=dkShot.c||(dkShot.c=[]), hit=C.find(e=>e.key===key); if(hit) return hit.cv.isConnected?dkCopy(hit.cv):hit.cv;
  let cv=null; try{ cv=Body.shot({yaw:f.yaw,mask,...(f.crop?{crop:f.crop}:{}),h,canvas:true}); }catch(e){ console.warn(e); cv=null; }
  if(cv){ C.unshift({key,cv}); C.length=Math.min(C.length,12); }
  return cv;
}
function dkCopy(cv){ const c=document.createElement("canvas"); c.width=cv.width; c.height=cv.height; c.getContext("2d").drawImage(cv,0,0); return c; }
function dkShot(c){ return dkShotFor(dkMask(c),200); }
function dkThumb(k){ if(!MUSCLES[k]) return null; const m={}; m[k]=1; return dkShotFor(m,160); }
/* after the page has painted: one still per thumbnail, one per tick, so the first paint never waits */
function dkFill(sel,get){
  const els=[...document.querySelectorAll(sel)];
  const step=()=>{ const el=els.shift(); if(!el) return; if(!el.isConnected){ setTimeout(step,0); return; }
    try{ const cv=get(el); if(cv){ const cs=getComputedStyle(el), fit=/contain/.test(cs.backgroundSize)?"contain":"cover";   /* the still sits the way the box's background would */
        el.querySelectorAll("canvas.dk-shot").forEach(c=>c.remove()); cv.className="dk-shot";
        cv.style.cssText=`display:block;width:100%;height:100%;border-radius:inherit;object-fit:${fit};object-position:${cs.backgroundPosition}`;
        el.appendChild(cv); el.classList.add("pic"); } }catch(e){}
    setTimeout(step,40); };
  setTimeout(step,80);
}

/* ---------- the readout ---------- */
/* the header's line is the page's readout: an answer sits there for a moment, then the state line comes back */
function dkSay(text,ms){
  const st=dkS(), el=document.querySelector("#dkHome .dk-hsub"); if(!el) return;
  if(st.sayT){ clearTimeout(st.sayT); st.sayT=0; }
  if(text==null){ if(el.dataset.base!=null){ el.innerHTML=el.dataset.base; delete el.dataset.base; } el.classList.remove("say"); return; }
  if(el.dataset.base==null) el.dataset.base=el.innerHTML;
  el.textContent=text; el.classList.add("say");
  st.sayT=setTimeout(()=>{ st.sayT=0; dkSay(null); },ms||2500);
}

/* ---------- the stat cards ---------- */
function dkBars(vals,cols,w,h){   // vals 0-1, one bar each, in the colours given
  const n=vals.length||1, gap=4, bw=Math.max(4,(w-gap*(n-1))/n);
  return `<svg class="dk-chart" viewBox="0 0 ${w} ${h}" aria-hidden="true">${vals.map((v,i)=>{ const bh=Math.max(3,Math.round(v*(h-2))); return `<rect x="${((bw+gap)*i).toFixed(1)}" y="${h-bh}" width="${bw.toFixed(1)}" height="${bh}" rx="2" fill="${cols[i]||"var(--glow)"}"/>`; }).join("")}</svg>`;
}
function dkSegs(vals,w,h){   // a line of segments, lime for yes and amber for not yet
  const n=vals.length||1, gap=3, sw=Math.max(4,(w-gap*(n-1))/n);
  return `<svg class="dk-chart" viewBox="0 0 ${w} ${h}" aria-hidden="true">${vals.map((v,i)=>`<rect x="${((sw+gap)*i).toFixed(1)}" y="${h/2-2}" width="${sw.toFixed(1)}" height="4" rx="2" fill="${v?"var(--glow)":"var(--amber)"}"/>`).join("")}</svg>`;
}
function dkArc(frac,col){   // a ring, frac of it filled
  const r=15, c=2*Math.PI*r, f=Math.max(0.02,Math.min(1,frac||0));
  return `<svg class="dk-ring" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="${r}" fill="none" stroke="var(--line-2)" stroke-width="5"/><circle cx="20" cy="20" r="${r}" fill="none" stroke="${col||"var(--glow)"}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(c*f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 20 20)"/></svg>`;
}
/* three cards for the chosen tab: {big, unit, label, chart | ring, tall, lit, dot, keys (lit on the body when
   tapped), say (the hero's line), k (the screen a second tap opens)} */
function dkStats(c){
  const st=dkS(), W=dkWeek(), nm=k=>uiSafe(()=>MUSCLES[k].name,k), col=k=>`var(--rk-${rankTier(S.scores[k]||0)})`;
  if(st.tab==="week"){
    const per=[0,0,0,0,0,0,0]; (S.workouts||[]).forEach(w=>{ for(let i=0;i<=todayIdx;i++){ if(w.d===dkey(todayIdx-i)&&w.kind!=="posture") per[i]+=(+w.sets||0); } });
    const mx=Math.max(1,...per), sets=per.reduce((a,b)=>a+b,0), stk=uiStreak();
    return [
      {big:String(sets),label:"sets this week",chart:dkBars(per.map(v=>v/mx),per.map((v,i)=>i===todayIdx?"var(--glow)":v?"var(--glow-soft)":"var(--line-2)"),120,56),tall:true,say:DN.map((d,i)=>per[i]?`${d} ${per[i]}`:"").filter(Boolean).join(" · ")||"No sets yet this week",k:"more"},
      {big:`${W.wk}/${W.planned}`,label:"sessions",chart:dkSegs(Array.from({length:Math.max(1,W.planned)},(_,i)=>i<W.wk),100,12),lit:W.planned&&W.wk>=W.planned?"ready":"",say:`${W.wk} of ${W.planned} planned sessions done`,k:"more"},
      {big:String(stk.n),label:"day streak",ring:dkArc(Math.min(1,stk.n/7),stk.today?"var(--glow)":"var(--amber)"),say:stk.today?"Trained today: the streak is safe":"Train today to keep the streak",k:"streak"},
    ];
  }
  if(c.kind==="done"){ const r=c.w, rp=c.rp.slice(0,5), mx=Math.max(1,...rp.map(x=>x[1]));
    return [
      {big:`+${c.earned}`,unit:"RP",label:"earned today",chart:dkBars(rp.map(x=>x[1]/mx),rp.map(x=>col(x[0])),120,56),tall:true,lit:"ready",keys:rp.map(x=>x[0]),say:rp.slice(0,3).map(x=>`+${x[1]} ${nm(x[0])}`).join(" · "),k:"ranks"},
      {big:String(+r.sets||0),label:r.vol?`sets · ${fvol(r.vol)} kg`:"sets",chart:dkSegs(Array.from({length:Math.min(12,+r.sets||1)},()=>true),100,12),say:"Where your sets went",k:"sets"},
      {big:String(+r.mins||0),unit:"min",label:"trained",ring:dkArc(Math.min(1,(+r.mins||0)/60)),say:`${+r.mins||0} minutes today`,k:"sets"},
    ];
  }
  if(c.kind==="rest"){ const rec=c.rec.slice(0,5), nx=dkNextDay(), nxt=nx>=0?dkSession(nx):null, m=c.s.items||[];
    return [
      {big:String(c.rec.length),label:c.rec.length===1?"muscle recovering":"muscles recovering",chart:dkBars(rec.map(k=>recoveredPct(k)),rec.map(()=>"var(--amber)"),120,56),tall:true,lit:c.rec.length?"amber":"ready",keys:rec,say:rec.length?rec.map(k=>`${nm(k)} ${Math.round(recoveredPct(k)*100)}%`).join(" · "):"Everything's recovered",k:"recover"},
      {big:nxt?dkTitle(nxt.title):"Rest",label:nxt?(nx===(todayIdx+1)%7?"tomorrow":DAYN[nx]):"all week",small:true,say:nxt?`${dkTitle(nxt.title)} is next`:"A rest week",k:nxt?"day":"more",d:nx},
      {big:String(estMin(m)),unit:"min",label:"mobility",ring:dkArc(Math.min(1,estMin(m)/30)),say:`${m.length} moves · ${estMin(m)} min`,k:"moves"},
    ];
  }
  const items=c.s.items, T=(c.targets||[]).filter(x=>x.rp>0).slice(0,5), mx=Math.max(1,...T.map(x=>x.rp)), rp=(c.targets||[]).reduce((a,x)=>a+(x.rp||0),0);
  const up=(c.targets||[]).find(x=>{ const nx=toNext(S.scores[x.k]||0); return x.rp>0&&nx&&nx.pts<=x.rp; }), n=c.ks.length, w=dkWhen(c.h);
  return [
    {big:`+${rp}`,unit:"RP",label:up?`${rkSay(up.k)} ranks up`:"if you finish",chart:dkBars(T.map(x=>x.rp/mx),T.map(x=>col(x.k)),120,56),tall:true,dot:!!up,keys:T.map(x=>x.k),say:T.slice(0,3).map(x=>`+${x.rp} ${nm(x.k)}`).join(" · ")||"A mobility session earns no RP",k:"ranks"},
    {big:c.ok?`${n}/${n}`:`${n-c.rec.length}/${n}`,label:c.ok?"ready":`${nm(c.rec[0]).toLowerCase()} · ${w.short}`,chart:dkSegs(c.ks.map(k=>!c.rec.includes(k)),100,12),lit:c.ok?"ready":"amber",keys:c.ok?c.ks:c.rec,say:c.ok?`${c.ks.map(nm).join(", ")}: all ready`:c.rec.slice(0,3).map(k=>`${nm(k)} ${Math.round(recoveredPct(k)*100)}% · ${dkWhen(hoursLeft(k)).short}`).join(" · "),k:"recover"},
    {big:String(estMin(items)),unit:"min",label:`done by ${dkEnd(items)}`,ring:dkArc(Math.min(1,estMin(items)/60)),say:`${items.length} moves · ${estMin(items)} min`,k:"moves"},
  ];
}
function dkStatHTML(t,i){
  const lab=`${t.big}${t.unit?" "+t.unit:""}, ${t.label}${t.dot?". A rank-up if you finish":""}`;
  return `<button class="dk-stat${t.tall?" tall":""}${t.lit?" lit "+t.lit:""}${t.small?" sm":""}" data-ds="${i}" style="--i:${i}" aria-label="${uiEsc(lab)}">${t.dot?`<i class="dk-dot" aria-hidden="true"></i>`:""}
    <b class="u-num">${uiEsc(t.big)}${t.unit?`<small>${uiEsc(t.unit)}</small>`:""}</b><span>${uiEsc(t.label)}</span>${t.chart||""}${t.ring||""}</button>`;
}

/* ---------- the page ---------- */
/* 19 Oct (Andrej): no greeting; Train is about training. The date, the title, the rank hex and the kit switch */
function dkTopHTML(c){
  const nm=(S.name||"").trim(), mode=rdtMode(), ov=overall(), tier=rankTier(ov), lv=tier?["I","II","III"][RK_STEPS[rankIx(ov)-1][2]]:"";
  const kit=mode==="gym"?`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10v4M6 8v8M9 10.5h6M18 8v8M21 10v4"/><rect x="6" y="9" width="3" height="6" rx="1"/><rect x="15" y="9" width="3" height="6" rx="1"/></svg>`
    :`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5M6 10.3V19h12v-8.7M10 19v-5h4v5"/></svg>`;
  let line;
  if(c.kind==="done") line=`${uiEsc(c.title)} done · +${c.earned} RP`;
  else if(c.kind==="rest") line=c.rec.length?`Rest day · ${c.rec.length} recovering`:"Rest day · all recovered";
  else if(c.ok) line=`${uiEsc(c.title)} is ready · ${estMin(c.s.items)} min`;
  else line=`${uiEsc(c.title)} · ${uiEsc(MUSCLES[c.rec[0]].name.toLowerCase())} ${dkWhen(c.h).tag.toLowerCase()}`;
  return `<header class="dk-top">
    <div class="dk-htx"><span class="u-eyebrow dk-hey">${uiShortDate()}</span><h1 class="dk-hh">Train</h1></div>
    <div class="dk-hbtns"><button class="dk-rank" data-dk="ranks" aria-label="Overall rank ${uiEsc(rankOf(ov))}. Muscle ranks"><i class="dk-hex" style="--c:var(--rk-${tier})">${lv}</i></button>
    <button class="dk-kit" data-dk="kit" aria-label="Where you train: ${mode==="gym"?"gym":"home"}. Switch to ${mode==="gym"?"home":"gym"}">${kit}</button></div>
  </header>`;
}
/* today's quest, the page's hero: a still of your body with the session's muscles lit on the right, the region,
   the title, minutes and moves, the reward, and the one bone play button */
/* the quest's one-line reason (19 Oct, Train spec): the fading or never-trained muscles it heats, else the weak link, else the split */
function dkReason(c){
  try{
    const ks=[...new Set((c.s&&c.s.items||[]).map(it=>it.primary).filter(k=>MUSCLES[k]))];
    const nm=k=>rkSay(k).toLowerCase(), pl=k=>/s$/.test(nm(k))?"are":"is";
    const fad=ks.filter(k=>stateOf(k)==="fading"), grey=ks.filter(k=>stateOf(k)==="new");
    if(fad.length&&grey.length) return `Your ${nm(fad[0])} ${pl(fad[0])} fading and ${nm(grey[0])} ${pl(grey[0])} still grey. This session heats both.`;
    if(fad.length) return `Your ${nm(fad[0])} ${pl(fad[0])} fading${fad[1]?` and so ${pl(fad[1])} ${nm(fad[1])}`:""}. This session heats ${fad[1]?"them":"it"} back up.`;
    if(grey.length) return `Your ${nm(grey[0])} ${pl(grey[0])} still grey${grey[1]?`, and ${nm(grey[1])} too`:""}. This session lights ${grey[1]?"them":"it"} up.`;
    const w=rkWeak(); if(ks.includes(w)) return `Your weak link, ${nm(w)}, gets the first sets today.`;
  }catch(e){}
  return `${dkRegion(c)} day, from your plan.`;
}
function dkQuestHTML(c){
  const s=dkState(c), items=c.s&&c.s.items||[];
  let meta, rew="", eye=dkRegion(c), why="", play, side="";
  if(c.kind==="done"){ meta=`${+c.w.sets||0} sets · ${+c.w.mins||0} min${c.w.vol?` · ${fvol(c.w.vol)} kg`:""}`; rew=`<span class="dk-rew">${UI_IC.check}+${c.earned} RP earned</span>`;
    play=`<span class="dk-qplay tick" aria-hidden="true">${UI_IC.check}</span>`;
    side=`<button class="dk-swap" data-dk="cold">Train something else</button>`; }
  else if(c.kind==="rest"){ meta=`Mobility · ${estMin(items)} min · ${items.length} moves`;
    why=c.rec.length?`${c.rec.length} muscle${c.rec.length>1?"s are":" is"} still recovering. Rest is when they grow.`:"Everything is recovered. A light day keeps the streak warm.";
    rew=c.rec.length?`<span class="dk-rew amb">${c.rec.length} recovering</span>`:`<span class="dk-rew">All recovered</span>`;
    play=`<button class="dk-qplay soft" data-go="0" aria-label="Start the 5-minute minimum">${UI_IC.play}</button>`;
    side=`<button class="dk-swap" data-dk="recover">Recover ›</button>`; }
  else { meta=`${uiEsc(eye)} · ${items.length} moves`; why=dkReason(c);
    const rp=(c.targets||[]).reduce((a,x)=>a+(x.rp||0),0), up=(c.targets||[]).find(x=>{ const nx=toNext(S.scores[x.k]||0); return x.rp>0&&nx&&nx.pts<=x.rp; });
    rew=(c.ok?"":`<span class="dk-rew amb">${uiEsc(dkWhen(c.h).tag)}</span>`)+(rp?`<span class="dk-rew">+${rp} RP</span>`:"")
      +`<span class="dk-rew up">${uiEsc(up?rkSay(up.k):eye)} ↑</span><span class="dk-rew min">${estMin(items)} min</span>`;
    play=`<button class="dk-qplay${c.ok?"":" soft"}" data-go="0" aria-label="${c.ok?`Start ${uiEsc(c.title)}`:`Start ${uiEsc(c.title)} anyway`}">${UI_IC.play}</button>`;
    side=`<button class="dk-swap" data-dk="cold">Swap for my cold muscles</button>`; }
  const ttl=c.kind==="rest"?"Rest day":c.title, eyeT=c.kind==="done"?"Quest cleared":c.kind==="rest"?"Today · rest day":"Today's quest";
  return `<section class="dk-quest is-${s}" aria-label="${eyeT}">
    <span class="dk-qth dk-th" data-row="0" aria-hidden="true">${dkFig(c)}</span>
    <button class="dk-qtap" data-open="0" aria-label="${uiEsc(ttl)}: ${uiEsc(eye)}. ${uiEsc(meta)}. ${uiEsc(rew.replace(/<[^>]+>/g," ").trim())}. ${c.kind==="done"?"Where your sets went":"See the moves"}">
      <span class="u-eyebrow dk-qeye">${eyeT}</span>
      <h2 class="dk-qh">${uiEsc(ttl)}</h2>
      ${why?`<span class="dk-qwhy">${uiEsc(why)}</span>`:""}
      <span class="dk-qmeta">${meta}</span>
      <span class="dk-rews">${rew}</span></button>
    ${play}</section>${side?`<div class="dk-swaprow">${side}</div>`:""}`;
}
/* the status bar (an RPG HUD): your level in the rank's hex, the XP bar to the next level, the rank and path
   under it, the next unlock, the streak. The level is lifetime rank points (vessel.js vxLevelInfo). */
function dkHudHTML(){
  const L=uiSafe(vxLevelInfo,{lv:0,xp:0,frac:0,toNext:0}), ov=overall(), tier=rankTier(ov), stk=uiStreak();
  let path=""; try{ if(typeof pthCur==="function"){ const a=pthCur(); if(a&&typeof pthName==="function") path=pthName(a); else if(typeof pthStats==="function"){ const ps=pthStats(); if(ps&&!ps.few&&ps.lean&&ps.lean!=="balanced"&&typeof pthName==="function") path=`Leaning ${pthName(ps.lean)}`; } } }catch(e){ path=""; }
  const nextUn=uiSafe(()=>UNLOCKS.filter(u=>!vxHas(u.id)).sort((a,b)=>(a.lv||0)-(b.lv||0))[0],null);
  const line=L.lv>=99?"Top level":`${L.toNext} RP to level ${L.lv+1}`;
  return `<button class="dk-hud" data-dk="ranks" aria-label="Level ${L.lv}, ${line}. Overall rank ${uiEsc(rankOf(ov))}${path?`, path ${uiEsc(path)}`:""}${nextUn?`. Next unlock: ${uiEsc(nextUn.name)} at level ${nextUn.lv}`:""}. ${stk.n} day streak. Muscle ranks">
    <i class="dk-hex dk-lv" style="--c:var(--rk-${tier})" aria-hidden="true">${L.lv}</i>
    <span class="dk-hudtx"><b>Level ${L.lv} <em>· ${uiEsc(rankOf(ov))}${path?` · ${uiEsc(path)}`:""}</em></b><span class="u-bar dk-xp"><i style="width:${Math.round(L.frac*100)}%"></i></span><small>${line}${nextUn?` · ${uiEsc(nextUn.name)} at ${nextUn.lv}`:""}</small></span>
    <span class="dk-hudstk${stk.today?" on":""}" aria-hidden="true">${UI_FLAME}<b>${stk.n}</b></span></button>`;
}
/* the attributes: every region's rank as a bar in its tier colour, the weak link marked */
function dkAttrsHTML(){
  let weak=null; try{ const k=rkWeak(); weak=MUSCLES[k]&&MUSCLES[k].region; }catch(e){}
  const rows=REGION_ORDER.map(r=>{ const sc=uiSafe(()=>rScore(r),0), t=rankTier(sc), nm=REGIONS[r].name;
    return `<span class="dk-attr${r===weak?" weak":""}" role="listitem" aria-label="${uiEsc(nm)}: ${uiEsc(rankOf(sc))}${r===weak?", the weak link":""}"><span class="dk-attr-n">${uiEsc(nm)}${r===weak?`<i>weak link</i>`:""}</span><span class="u-bar dk-attr-b"><i style="width:${Math.max(2,Math.round(sc))}%;background:var(--rk-${t})"></i></span><small style="color:var(--rk-${t})">${uiEsc(rankOf(sc))}</small></span>`; }).join("");
  return `<button class="dk-attrs" data-dk="ranks" role="list" aria-label="Attributes: your regions by rank">${rows}</button>`;
}
function dkDayHTML(i){
  const d0=new Date(); d0.setDate(d0.getDate()-todayIdx); const dt=new Date(d0); dt.setDate(d0.getDate()+i);
  let ds; try{ ds=dayState(i); }catch(e){ ds={lab:"",st:""}; }
  const cls=[i===todayIdx?"is-today":"",ds.st==="done"?"is-done":"",ds.st==="rest"?"is-rest":"",i<todayIdx&&ds.st!=="done"?"is-past":"",ds.st==="rec"?"is-rec":"",ds.st==="ready"?"is-ready":""].filter(Boolean).join(" ");
  return `<button class="dk-day ${cls}" data-dd="${i}" aria-label="${DAYN[i]} ${dt.getDate()}: ${uiEsc(ds.lab||"Rest")}${ds.st==="done"?", done":i===todayIdx?", today":""}"><b>${ds.st==="done"?UI_IC.check:dt.getDate()}</b><span>${DN[i]}</span><i aria-hidden="true"></i></button>`;
}
function dkRowHTML(c,j){
  const s=dkState(c), items=c.s&&c.s.items||[];
  const play=c.kind==="done"?`<span class="dk-tick" aria-hidden="true">${UI_IC.check}</span>`:`<button class="dk-play${c.ok?"":" soft"}" data-go="${j}" aria-label="${c.kind==="rest"?"Start mobility":c.ok?`Start ${uiEsc(c.title)}`:`Start ${uiEsc(c.title)} anyway`}">${UI_IC.play}</button>`;
  let meta, rew="";
  if(c.kind==="done"){ meta=`${+c.w.sets||0} sets · ${+c.w.mins||0} min${c.w.vol?` · ${fvol(c.w.vol)} kg`:""}`; rew=`<span class="dk-rew">+${c.earned} RP</span>`; }
  else if(c.kind==="rest") meta=`${estMin(items)} min · ${items.length} moves`;
  else { meta=`${estMin(items)} min · ${items.length} moves · <em class="is-${s}">${c.ok?"Ready":uiEsc(dkWhen(c.h).tag)}</em>`;
    const rp=(c.targets||[]).reduce((a,x)=>a+(x.rp||0),0), up=(c.targets||[]).find(x=>{ const nx=toNext(S.scores[x.k]||0); return x.rp>0&&nx&&nx.pts<=x.rp; });
    rew=(rp?`<span class="dk-rew">+${rp} RP</span>`:"")+(up?`<span class="dk-rew up">${uiEsc(rkSay(up.k))} ranks up</span>`:""); }
  return `<article class="dk-row is-${s}" data-row="${j}"><button class="dk-rowtap" data-open="${j}" aria-label="${uiEsc(c.title)}: ${uiEsc(dkRegion(c))}. ${uiEsc(meta.replace(/<[^>]+>/g,""))}${rew?`. Reward: ${uiEsc(rew.replace(/<[^>]+>/g," ").trim())}`:""}. ${c.kind==="done"?"Where your sets went":"See the moves"}">
      <span class="dk-th" aria-hidden="true">${dkFig(c)}</span>
      <span class="dk-rowtx"><span class="dk-roweye">${uiEsc(dkRegion(c))}</span><b>${uiEsc(c.title)}</b><small>${meta}</small>${rew?`<span class="dk-rews">${rew}</span>`:""}</span></button>${play}</article>`;
}
function dkFig(c){
  const st={}; (c.ks||[]).forEach(k=>{ st[k]=["rec",1]; });
  try{ return `<span class="dk-fig">${figSvg(118,st).replace(/width="\d+" height="\d+"/,"")}</span>`; }catch(e){ return ""; }
}
function dkDraw(){
  const st=dkS(), el=$("dkHome"); if(!el||!st.cards.length) return;
  const c=st.cards[0], stats=dkStats(c), rest=st.cards.slice(1);
  el.dataset.state=dkState(c);
  el.innerHTML=`${dkTopHTML(c)}
    <div class="dk-sheet">
      ${dkQuestHTML(c)}
      <div class="dk-week" role="group" aria-label="This week">${[0,1,2,3,4,5,6].map(dkDayHTML).join("")}</div>
      ${rest.length?`<div class="u-section-h dk-sh"><span class="dk-sht">Quests this week</span><button class="u-link" data-dk="more">View all ›</button></div>${rest.map((x,j)=>dkRowHTML(x,j+1)).join("")}`:`<div class="u-section-h dk-sh"><span class="dk-sht">More ways to train</span><button class="u-link" data-dk="more">View all ›</button></div>`}
      ${(S.dares&&S.dares.cur&&typeof uiDareHTML==="function")?`<div class="u-section-h dk-sh"><span class="dk-sht">Side quest</span></div>${uiSafe(uiDareHTML,"")}`:""}
      <div class="u-section-h dk-sh dk-prog"><span class="dk-sht">Your progress</span><button class="u-link" data-dk="ranks">Muscle ranks ›</button></div>
      ${dkHudHTML()}
      <div class="dk-tabs" role="tablist" aria-label="Stats"><button role="tab" data-tab="today" aria-selected="${st.tab!=="week"}" class="${st.tab!=="week"?"on":""}">Today</button><button role="tab" data-tab="week" aria-selected="${st.tab==="week"}" class="${st.tab==="week"?"on":""}">This week</button></div>
      <div class="dk-stats">${stats.map(dkStatHTML).join("")}</div>
      <div class="u-section-h dk-sh"><span class="dk-sht">Attributes</span></div>
      ${dkAttrsHTML()}
    </div>`;
  el.querySelectorAll("[data-dk]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); dkAct(c,b.dataset.dk); });
  el.querySelectorAll("[data-dd]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); Pulse.buzz(6); const d=+b.dataset.dd; dkAct({kind:"day",d,s:dkSession(d)},"moves"); });
  el.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{ if(st.tab===b.dataset.tab) return; st.tab=b.dataset.tab; Pulse.buzz(5); dkDraw(); });
  el.querySelectorAll("[data-ds]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); const t=stats[+b.dataset.ds]; if(!t) return; Pulse.buzz(6); track("train_hub",{k:"stat:"+(t.k||"say")});
    const again=st.said===b.dataset.ds&&Date.now()-(st.saidAt||0)<2600; st.said=b.dataset.ds; st.saidAt=Date.now();
    if(again||!t.say){ st.said=null; dkSay(null);
      if(t.k==="ranks") openRanks(); else if(t.k==="recover") setTab("recover"); else if(t.k==="moves") dkAct(c,"moves"); else if(t.k==="sets") dkAct(c,"sets"); else if(t.k==="streak") openStreak(false); else if(t.k==="day"&&t.d>=0) dkAct({kind:"day",d:t.d,s:dkSession(t.d)},"moves"); else dkMore(t.k==="more"?"week":null); return; }
    dkSay(t.say); });
  el.querySelectorAll("[data-open]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); const x=st.cards[+b.dataset.open]; if(!x) return; Pulse.buzz(6); dkAct(x,x.kind==="done"?"sets":"moves"); });
  el.querySelectorAll("[data-go]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); const x=st.cards[+b.dataset.go]; if(x) dkAct(x,"go"); });
  try{ if(typeof uiWireDare==="function") uiWireDare(el,()=>dkDraw()); }catch(e){ console.warn("Ossa: side quest",e); }
  dkFill("#dkHome .dk-th",th=>{ const row=th.closest("[data-row]"); const j=+(row?row.dataset.row:th.dataset.row); const x=st.cards[j]; return th.classList.contains("dk-qth")?dkShotFor(dkMask(x),300):dkShot(x); });
}
/* the ignition: lime sweeps the screen from the right (260 ms), the workout appears behind it, the sweep fades */
function dkIgnite(start){
  const app=$("app");
  if(reduced||!app){ start(); return; }
  const sw=document.createElement("div"); sw.className="dk-sweep"; app.appendChild(sw);
  requestAnimationFrame(()=>sw.classList.add("on"));
  setTimeout(()=>{ start(); sw.classList.add("off"); setTimeout(()=>{ try{ sw.remove(); }catch(e){} },260); },270);
}
/* what the buttons do */
function dkAct(c,k){
  track("train_hub",{k:k+":"+c.kind});
  if(k==="go"){ Pulse.buzz([10,40,14]);
    const start=()=>{
      if(c.kind==="plan"&&c.plan){ try{ startSavedPlan(c.plan.id); }catch(e){ console.warn("Ossa: saved plan",e); } return; }
      if(c.kind==="rest"){ TR.custom=true; TR.session=c.s; TR.hub=false; startWorkout(); return; }
      TR.custom=false; TR.day=c.d; TR.session=c.s; TR.pick=TR.ed=null; TR.hub=false; startWorkout(); };
    dkIgnite(start); return; }
  if(k==="moves"){ Pulse.buzz(8); TR.custom=false; TR.day=c.d; TR.pick=TR.ed=null; TR.planSel=null; TR.planEnter=true; TR.hub=false; drawTrain(); $("train").scrollTop=0; return; }
  if(k==="edit"){ Pulse.buzz(8); const base=applySwaps(sessionForDay(c.d));
    TR.custom=false; TR.day=c.d; TR.pick=null; TR.planSel=null; TR.ed={items:base.items.map(it=>({n:it.name,d:`${it.sets} × ${it.target}`,k:it.primary})),add:null}; TR.hub=false; drawTrain(); return; }
  if(k==="sets"){ Pulse.buzz(8); if(typeof openDensity==="function"&&c.w) openDensity(densId(c.w,c.wi),{from:"hub"}); return; }
  if(k==="ranks"){ Pulse.buzz(8); openRanks(); return; }
  if(k==="profile"){ Pulse.buzz(8); setTab("you"); return; }
  if(k==="kit"){ uiSetKit(rdtMode()==="gym"?"home":"gym"); return; }
  if(k==="more"){ Pulse.buzz(8); dkMore(null); }
  if(k==="cold"){ Pulse.buzz(8); if(typeof fgColdOpen==="function") fgColdOpen(); return; }
  if(k==="recover"){ Pulse.buzz(8); uiGo("recover"); return; }
}

/* ---------- the hub ---------- */
function rdTrainHub(){
  const el=$("train"), app=$("app"); clearInterval(TR.planSpin); TR.planSpin=0; app.classList.remove("tplan","tactive","tdone"); app.classList.add("thub");
  const st=dkS(), cards=dkCards(), key=dkey(0)+"|"+cards.map(c=>c.id).join(",");
  if(st.key!==key){ st.key=key; } st.cards=cards;
  el.innerHTML=`<div class="dk" id="dkHome"></div>`;
  try{ dkDraw(); }
  catch(e){ console.warn("Ossa: Train home",e); dkFallback(el,e); return; }   // the tab is never left blank
  if(!reduced){ $("dkHome").classList.add("dk-enter"); setTimeout(()=>{ const h=$("dkHome"); if(h) h.classList.remove("dk-enter"); },900); }
  el.scrollTop=0;
}
/* if the home can't draw (a bad save, a missing table), a plain list still gets you to today's session */
function dkFallback(el,err){
  const st=dkS(), rows=(st.cards||[]).map((c,j)=>`<button class="u-row" data-fb="${j}"><span><b>${uiEsc(c.title)}</b><small>${c.kind==="rest"?"Mobility":c.kind==="done"?"Done today":`${(c.s&&c.s.items||[]).length} moves`}</small></span>${UI_IC.chev}</button>`).join("");
  el.innerHTML=`<div class="u-screen u-train dk-fb"><header class="u-top"><div class="u-top-tx"><div class="u-eyebrow">${uiShortDate()}</div><h1 class="u-h1">Train</h1></div></header>
    <div class="u-card u-list">${rows||`<p class="u-small">Nothing planned today.</p>`}</div>
    <p class="u-foot">The Train home couldn't draw${err&&err.message?`: ${uiEsc(String(err.message)).slice(0,80)}`:""}. The moves still work.</p></div>`;
  el.querySelectorAll("[data-fb]").forEach(b=>b.onclick=()=>{ const c=st.cards[+b.dataset.fb]; if(c) dkAct(c,c.kind==="done"?"sets":"moves"); });
}

/* ---------- the session screen, dressed (the second reference): thumbnails on the rows, a bigger title ---------- */
function dkPlanDress(){
  const tp=document.querySelector("#train .tp"); if(!tp) return; tp.classList.add("dk-tp");
  const rows=[...tp.querySelectorAll(".tp-list:not(.rest) .tp-r")], items=TR.session&&TR.session.items||[];
  rows.forEach(li=>{ if(li.querySelector(".dk-th")) return; const th=document.createElement("span"); th.className="dk-th dk-th-row"; th.setAttribute("aria-hidden","true"); const it=items[+li.dataset.i]; th.dataset.k=it?it.primary:""; li.insertBefore(th,li.firstChild); });
  dkFill("#train .dk-th-row",th=>th.dataset.k?dkThumb(th.dataset.k):null);
}
/* the session screen is dressed after it draws */
(()=>{ try{
  const _dp=drawPlanFloat; drawPlanFloat=function(){ const r=_dp.apply(this,arguments); try{ dkPlanDress(); }catch(e){ console.warn("Ossa: plan dress",e); } return r; };
}catch(e){ console.warn("Ossa: deck hooks",e); } })();

/* ---------- More: everything else the tab had ---------- */
function dkMore(at){
  let p=$("dkMore");
  if(!p){ p=document.createElement("section"); p.className="panel u-own dk-more"; p.id="dkMore"; p.setAttribute("aria-label","More");
    p.innerHTML=`<div class="p-head dk-mhead"><button class="u-back" id="dkMoreX" aria-label="Back to Train">‹ Train</button><span class="dk-mt">More</span><span aria-hidden="true"></span></div><div class="p-body dk-mbody"></div>`;
    $("app").appendChild(p); $("dkMoreX").onclick=()=>{ Pulse.buzz(6); p.classList.remove("on"); }; }
  const b=p.querySelector(".dk-mbody"), mode=rdtMode(), wkn=uiSafe(progWeek,null), W=dkWeek(), st=uiStreak();
  const past=uiSafe(()=>typeof densRecs==="function"?densRecs().length:0,0);
  b.innerHTML=`<div class="dk-min">
    <div class="u-section-h" id="dkMWeek"><span class="u-eyebrow">This week</span><button class="u-link" data-mk="days">Change days ›</button></div>
    <div class="u-week">${uiWeekHTML().replace(/data-wd=/g,"data-mday=")}</div>
    <div class="u-section-h"><span class="u-eyebrow">Quick session · ${mode==="gym"?"gym":"home"}</span></div>
    <section class="u-card u-quick">
      <div class="u-chips" role="radiogroup" aria-label="Goal">${RD_QG.map(g=>`<button class="u-chip" data-qg="${g.k}" role="radio" aria-checked="${RDT.g===g.k}">${g.n}</button>`).join("")}</div>
      <div class="u-quick-row"><div class="u-seg" role="radiogroup" aria-label="Minutes">${[10,20,30].map(m=>`<button data-qm="${m}" role="radio" aria-checked="${RDT.m===m}" class="${RDT.m===m?"on":""}">${m} min</button>`).join("")}</div>
        <button class="u-play quiet" data-mk="quick" aria-label="Start a quick session">${UI_IC.play}</button></div>
      <p class="u-small" id="dkQs">${rdtQuickLine()}</p></section>
    <div class="u-card u-list">
      <button class="u-row" data-mk="pick"><span class="u-ic" style="--c:var(--fuel)">${UI_IC.target}</span><span><b>Train something else</b><small>Pick muscles and minutes, get a session</small></span>${UI_IC.chev}</button>
      <button class="u-row" data-mk="edit"><span class="u-ic" style="--c:var(--text-2)">${UI_IC.plan}</span><span><b>Edit today's session</b><small>Swap, add or remove moves</small></span>${UI_IC.chev}</button>
      <button class="u-row" data-mk="gen"><span class="u-ic" style="--c:var(--glow)">${UI_IC.plan}</span><span><b>${S.program?"Your plan":"Build my plan"}</b><small>${S.program&&wkn?`Week ${wkn.n} · ${W.planned} day${W.planned===1?"":"s"} a week`:"A weekly split built around your days and kit"}</small></span>${UI_IC.chev}</button>
      ${past?`<button class="u-row" data-mk="past"><span class="u-ic" style="--c:var(--text-2)">${typeof densIc==="function"?densIc():UI_IC.train}</span><span><b>Past sessions</b><small>${past} session${past===1?"":"s"} · where your sets went</small></span>${UI_IC.chev}</button>`:""}
      ${typeof openExercises==="function"?`<button class="u-row" data-mk="ex"><span class="u-ic" style="--c:var(--glow-soft)">${UI_IC.train}</span><span><b>Exercises</b><small>${uiEsc(typeof dxHubLine==="function"?uiSafe(dxHubLine,"Every movement, with what it works"):"Every movement, with what it works")}</small></span>${UI_IC.chev}</button>`:""}
      <button class="u-row" data-mk="streak"><span class="u-ic" style="--c:var(--amber)">${UI_FLAME}</span><span><b>${st.n} day streak</b><small>${st.today?"Trained today":"Train today to keep it"}</small></span>${UI_IC.chev}</button>
    </div></div>`;
  const leave=()=>p.classList.remove("on");
  b.querySelectorAll("[data-mk]").forEach(x=>x.onclick=e=>{ e.stopPropagation(); const k=x.dataset.mk; Pulse.buzz(k==="quick"?[10,40,14]:8); track("train_hub",{k:"more:"+k});
    if(k==="quick"){ leave(); TR.custom=true; TR.session=rdtQuick(RDT.g,RDT.m); TR.hub=false; startWorkout(); return; }
    if(k==="pick"){ leave(); TR.custom=false; TR.day=todayIdx; TR.hub=false; TR.pick={groups:[],mins:45}; TR.planSel=null; drawTrain(); $("train").scrollTop=0; return; }
    if(k==="edit"){ leave(); dkAct({kind:"day",d:todayIdx},"edit"); return; }
    if(k==="gen"){ leave(); openGen(); return; }
    if(k==="days"){ leave(); rdtOpenWeek(); return; }
    if(k==="past"){ leave(); if(typeof densListOpen==="function") densListOpen(); return; }
    if(k==="ex"){ leave(); if(typeof openExercises==="function") openExercises({from:"hub"}); return; }
    if(k==="streak"){ leave(); openStreak(false); } });
  b.querySelectorAll("[data-qg]").forEach(x=>x.onclick=()=>{ RDT.g=x.dataset.qg; Pulse.buzz(5); b.querySelectorAll("[data-qg]").forEach(y=>y.setAttribute("aria-checked",y===x)); $("dkQs").textContent=rdtQuickLine(); });
  b.querySelectorAll("[data-qm]").forEach(x=>x.onclick=()=>{ RDT.m=+x.dataset.qm; Pulse.buzz(5); b.querySelectorAll("[data-qm]").forEach(y=>{ y.classList.toggle("on",y===x); y.setAttribute("aria-checked",y===x); }); $("dkQs").textContent=rdtQuickLine(); });
  b.querySelectorAll("[data-mday]").forEach(x=>x.onclick=()=>{ Pulse.buzz(6); leave(); TR.custom=false; TR.day=+x.dataset.mday; TR.pick=TR.ed=null; TR.planEnter=true; TR.hub=false; drawTrain(); $("train").scrollTop=0; });
  try{ if(typeof uiPanelFront==="function") uiPanelFront(p); }catch(e){}
  b.scrollTop=0; void p.offsetWidth; p.classList.add("on");
  if(at==="week"){ const w=$("dkMWeek"); if(w) w.scrollIntoView({block:"start"}); }
}
