/* =========================================================
   WHERE YOUR SETS WENT and PAST SESSIONS (Ossa 2.0 Phase 2, 2026-10-16)
   - Past sessions on the Train hub: the newest 4 and "All N", which opens the full list by month
   - Where your sets went (#densP): one session, or "Your last 4 weeks" (the 28 days ending on that
     session's day), with a still of your own body lit where the sets went, the split of the muscle
     that did the most work, every muscle's sets, the lifts and how they felt
   - a row on Workout complete that opens the session you just finished
   Data only from S.workouts (and S.lifts for old records). Nothing new is saved.

   HOW SETS ARE COUNTED (decided). A set counts fully for a muscle when it does at least 60% of the
   work there (vxW(name, ctx) >= 0.6, slot credit included): the main muscle, plus helpers at 0.6
   such as the chest in dips or the glutes in squats. So every number is a whole set, and a muscle's
   zones (exZoneOf in exdata.js) add up exactly to its sets. Mobility moves and stretches count no sets.
   Zoned muscles: chest upper/middle/lower, triceps, biceps, hamstrings. The others show their region.

   Start-up rules: function declarations only, state on function properties (openDensity.s,
   densShot.c, densListOpen.n), no top-level const or let. Hooks shell.js and workout.js call (each
   behind a typeof guard): densPastHTML(n), densWireHub(el), densDoneRowHTML(R), densWireDone(R).
   Also: openDensity(id, {from, mode}), densListOpen(). Panels: #densP (a session) and #densL (the
   list), both .panel.u-own, brought to the front with uiPanelFront, so Back closes only the top one.
   Class prefix dz- (dn- belongs to the old Workout complete page). Analytics: track("sets_open",{from}).
   Every sentence here is "Andrej to confirm" (docs/DECISIONS.md).
   ========================================================= */

/* ---------- dates: local 'YYYY-MM-DD' like dkey (never toISOString, which is UTC) ---------- */
function densShift(d,n){
  const p=String(d).split("-").map(Number), x=new Date(p[0],p[1]-1,p[2]-(n||0),12);
  return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");
}
function densDate(d,o){ try{ return new Date(d+"T12:00").toLocaleDateString("en-GB",o); }catch(e){ return d; } }
function densPl(n,one,many){ return `${n} ${n===1?one:(many||one+"s")}`; }
function densIc(){ return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16"/><path d="M7 15.5V11M12 15.5V6.5M17 15.5V9"/></svg>`; }

/* ---------- the records ---------- */
/* a session's id: its end time (2.0 records), else its start, else its place in S.workouts (pre-2.0) */
function densId(w,i){ return w&&w.end?"e"+w.end:w&&w.t?"t"+w.t:"i"+i; }
/* every saved session, newest first: [{w, i, id}] */
function densRecs(){
  const W=Array.isArray(S.workouts)?S.workouts:[];
  return W.map((w,i)=>({w,i,id:densId(w,i)})).filter(x=>x.w&&x.w.d)
    .sort((a,b)=>a.w.d<b.w.d?1:a.w.d>b.w.d?-1:(((b.w.end||b.w.t||0)-(a.w.end||a.w.t||0))||b.i-a.i));
}
function densFind(id){ id=String(id); return densRecs().find(x=>x.id===id)||null; }
/* a session's exercise rows: {rows, src:'rec'|'lifts'|'none', same}. Pre-2.0 records and those past the
   newest 120 have no ex, so they're rebuilt from the lift history, which can't tell two sessions on one
   day apart (same = how many sessions share that day) */
function densRows(w){
  if(w&&Array.isArray(w.ex)&&w.ex.length) return {rows:w.ex,src:"rec",same:1};
  const rows=[], L=(S&&S.lifts)||{};
  if(w&&w.d) Object.keys(L).forEach(n=>(L[n]||[]).forEach(e=>{
    if(!e||e.d!==w.d||!Array.isArray(e.sets)||!e.sets.length) return;
    let k=e.p&&MUSCLES[e.p]?e.p:EXW[n]?EXW[n][0]:null;
    if(!k&&typeof exPrimary==="function"){ try{ k=exPrimary(n); }catch(x){} }
    if(!k||!MUSCLES[k]) return;
    const row={n,k,s:e.sets.length}; let r=0,v=0,top=0,hold=0;
    e.sets.forEach(x=>{ if(!x) return; if(x.r>0) r+=x.r; if(x.kg>0&&x.r>0) v+=x.kg*x.r; if(x.kg>top) top=x.kg; if(x.s>hold) hold=x.s; });
    if(r) row.r=r; if(v) row.kg=Math.round(v*10)/10; if(top) row.top=top; if(hold) row.hold=hold;
    if(vxIsStretch(n)) row.mob=1;
    rows.push(row); }));
  if(!rows.length) return {rows:[],src:"none",same:1};
  return {rows,src:"lifts",same:(S.workouts||[]).filter(x=>x&&x.d===w.d).length};
}

/* ---------- counting ---------- */
function densRegion(k){ return (MUSCLES[k]&&MUSCLES[k].region)||null; }
function densZoned(k){ try{ return typeof exZoneList==="function"&&exZoneList(k).length>0; }catch(e){ return false; } }
/* whole sets per muscle. M[k] = {n, main, help, z:{zone: n}}: main when k is the muscle the lift was
   picked for or its own main muscle, help otherwise. R[region] = sets that counted for any muscle there
   (a set that works two thigh muscles is one thigh set). lifts/mob: the rows, tot: sets that counted */
function densCount(rows){
  const M={}, R={}, lifts=[], mob=[]; let tot=0;
  (rows||[]).forEach(r=>{
    if(!r||!r.n||!(r.s>0)) return;
    if(r.mob||vxIsStretch(r.n)){ mob.push(r); return; }
    lifts.push(r);
    const w=vxW(r.n,r.k), own=EXW[r.n]?EXW[r.n][0]:null, regs={};
    let hit=false;
    Object.keys(w).forEach(m=>{
      if(!(w[m]>=0.6)||!MUSCLES[m]) return;
      hit=true;
      const o=M[m]||(M[m]={n:0,main:0,help:0,z:{}});
      o.n+=r.s; if(m===r.k||m===own) o.main+=r.s; else o.help+=r.s;
      if(densZoned(m)){ let z=null; try{ z=exZoneOf(r.n,m); }catch(e){} z=z||"_"; o.z[z]=(o.z[z]||0)+r.s; }
      const g=densRegion(m); if(g) regs[g]=1; });
    Object.keys(regs).forEach(g=>R[g]=(R[g]||0)+r.s);
    if(hit) tot+=r.s;
  });
  return {M,R,lifts,mob,tot};
}
function densMerge(list){
  const T={M:{},R:{},lifts:[],mob:[],tot:0};
  list.forEach(C=>{
    Object.keys(C.M).forEach(k=>{ const a=C.M[k], o=T.M[k]||(T.M[k]={n:0,main:0,help:0,z:{}});
      o.n+=a.n; o.main+=a.main; o.help+=a.help; Object.keys(a.z).forEach(z=>o.z[z]=(o.z[z]||0)+a.z[z]); });
    Object.keys(C.R).forEach(g=>T.R[g]=(T.R[g]||0)+C.R[g]);
    T.lifts=T.lifts.concat(C.lifts); T.mob=T.mob.concat(C.mob); T.tot+=C.tot;
  });
  return T;
}
/* the muscle with the most sets (a zoned muscle wins a tie, then body order) */
function densTop(C){
  const ks=Object.keys(C.M).filter(k=>C.M[k].n>0); if(!ks.length) return null;
  const at=k=>{ const i=GLORDER.indexOf(k); return i<0?99:i; };
  return ks.sort((a,b)=>C.M[b].n-C.M[a].n||densZoned(b)-densZoned(a)||at(a)-at(b))[0];
}
/* one session and its 4 weeks: the 28 days ending on its day, local dates, this session included.
   Two bare records on one day would rebuild the same lifts twice, so a day is rebuilt only once. */
function densWindow(x){
  const from=densShift(x.w.d,27), to=x.w.d, list=densRecs().filter(y=>y.w.d>=from&&y.w.d<=to);
  const me=densRows(x.w), seen={}; if(me.src==="lifts") seen[x.w.d]=1;
  const per=[]; let bare=0;
  list.forEach(y=>{
    if(y.id===x.id){ per.push({y,C:densCount(me.rows),me:true}); if(me.src==="none") bare++; return; }
    let R=densRows(y.w);
    if(R.src==="lifts"){ if(seen[y.w.d]) R={rows:[],src:"none"}; else seen[y.w.d]=1; }
    if(R.src==="none") bare++;
    per.push({y,C:densCount(R.rows),me:false});
  });
  const others=per.filter(p=>!p.me);
  return {from,to,list,per,bare,me,C:per.find(p=>p.me).C,O:densMerge(others.map(p=>p.C)),A:densMerge(per.map(p=>p.C)),others};
}

/* ---------- the words ---------- */
function densRegionWord(g){ return ({chest:"chest",shoulders:"shoulder",arms:"arm",core:"core",upperback:"upper-back",lowerback:"lower-back",glutes:"glute",thighs:"thigh",lowerlegs:"lower-leg"})[g]||"muscle"; }
function densRegionName(g){ return ({chest:"Chest",shoulders:"Shoulders",arms:"Arms",core:"Core",upperback:"Upper back",lowerback:"Lower back",glutes:"Glutes",thighs:"Thighs",lowerlegs:"Lower legs"})[g]||"Muscles"; }
function densSay(k){ try{ return vxSay(k); }catch(e){ return (MUSCLES[k]&&MUSCLES[k].name)||k; } }
function densFlag(k){ try{ return typeof vxFlagged==="function"&&vxFlagged(k); }catch(e){ return false; } }
/* a lift that trains k, for where you train (its home move at home) */
function densLiftFor(k){
  const ex=((MUSCLES[k]&&MUSCLES[k].ex)||[]).map(e=>e[0]); if(!ex.length) return "";
  let home=false; try{ home=rdtMode()==="home"; }catch(e){}
  if(home&&typeof exInfo==="function"){ const h=ex.find(n=>{ try{ return (exInfo(n)||{}).kit==="home"; }catch(e){ return false; } }); if(h) return h; }
  return ex[0];
}
/* the split for muscle k in counts C: its zones, or its region's muscles */
function densParts(k,C){
  if(densZoned(k)){
    const o=C.M[k]||{n:0,z:{}}, parts=exZoneList(k).map(z=>({id:z.id,label:z.label,work:z.work,a:o.z[z.id]||0}));
    if(o.z._) parts.push({id:"_",label:"Other work",work:"other lifts",a:o.z._});
    return {kind:"zone",k,t:o.n||0,parts,noun:densSay(k).toLowerCase(),head:densSay(k)};
  }
  const g=densRegion(k), ks=g&&REGIONS[g]?REGIONS[g].muscles.filter(m=>MUSCLES[m]):[k];
  /* most sets first; the muscles with none keep the region's order at the end */
  const parts=ks.map((m,i)=>({id:m,label:densSay(m),a:(C.M[m]||{}).n||0,i})).sort((a,b)=>b.a-a.a||a.i-b.i);
  return {kind:"region",k,g,t:(g&&C.R[g])||((C.M[k]||{}).n||0),parts,noun:densRegionWord(g),head:densRegionName(g)};
}
function densPart(P,id){ return (P&&P.parts.find(p=>p.id===id))||{a:0}; }
/* one line of the split, as a sentence:
   "Upper chest · 3 of 11 sets · incline work", "Lower chest · none this session · dips train it",
   "Quads · 9 of 12 thigh sets", "Adductors · none this session · Sumo squat trains it" (flagged: "· flagged") */
function densPartSub(P,p,weeks){
  const none=weeks?"none in 4 weeks":"none this session";
  if(P.kind==="zone"){
    if(p.a>0) return p.work;
    return `${none} · ${densFlag(P.k)?"flagged":`${p.work} ${/s$/.test(p.work)?"train":"trains"} it`}`;
  }
  if(p.a>0) return `${P.noun} sets`;
  const lift=densLiftFor(p.id);
  return `${none} · ${densFlag(p.id)?"flagged":lift?`${lift} trains it`:"not trained"}`;
}
function densPartLine(P,p,weeks){
  if(p.a>0) return P.kind==="zone"?`${p.label} · ${p.a} of ${densPl(P.t,"set")} · ${p.work}`:`${p.label} · ${p.a} of ${densPl(P.t,P.noun+" set")}`;
  return `${p.label} · ${densPartSub(P,p,weeks)}`;
}
/* this session's split against the rest of the 4 weeks. "counted": helper work under 60% isn't in these
   numbers, so the words never say there was no other work */
function densCompare(P,Po){
  if(!Po.t) return `Nothing to compare yet: no other counted ${P.noun} sets in your last 4 weeks.`;
  if(Po.t<3) return `Nothing to compare yet: only ${densPl(Po.t,"other counted "+P.noun+" set")} in your last 4 weeks.`;
  if(!P.t) return "";
  let best=null;
  P.parts.forEach(p=>{ if(p.id==="_") return; const q=densPart(Po,p.id), d=p.a/P.t-q.a/Po.t;
    if(!best||Math.abs(d)>Math.abs(best.d)+1e-9) best={p,q,d}; });
  if(!best||Math.abs(best.d)<0.15) return "About your usual split.";
  const what=P.kind==="zone"?best.p.work:best.p.label.toLowerCase();
  return `${best.d>0?"More":"Less"} ${what} than usual: ${best.p.a} of ${densPl(P.t,"set")} this session, ${best.q.a} of ${Po.t} in the rest of your last 4 weeks.`;
}
/* the sub line of a muscle row */
function densMainLine(o){
  if(!o.help) return "All as the main muscle";
  if(!o.main) return "All helping";
  return `${o.main} as the main muscle · ${o.help} helping`;
}
/* counted sets only: a muscle can have done helper work under 60% in those weeks */
function densUsual(k,W){
  const xs=W.others.map(p=>(p.C.M[k]||{}).n||0).filter(n=>n>0);
  if(!xs.length) return `first counted ${((W.C.M[k]||{}).n||0)===1?"set":"sets"} in 4 weeks`;
  if(xs.length===1) return `last time ${xs[0]}`;
  return `usually ${Math.round(xs.reduce((a,b)=>a+b,0)/xs.length)}`;
}
/* How it felt, from the effort check (rir on that day's S.lifts entries) */
function densFelt(w,rows){
  const L=(S&&S.lifts)||{}, names=new Set((rows||[]).map(r=>r.n)), c={};
  names.forEach(n=>((L[n])||[]).forEach(e=>{ if(e&&e.d===w.d&&e.rir!=null) c[e.rir]=(c[e.rir]||0)+1; }));
  const lab=v=>{ try{ const x=WK_EFF.find(e=>e[0]===+v); if(x) return x[2].toLowerCase(); }catch(e){} return ({3:"easy",1:"just right",0:"all-out"})[v]||""; };
  const ks=Object.keys(c).filter(v=>lab(v)).sort((a,b)=>c[b]-c[a]||b-a); if(!ks.length) return "";
  return "How it felt: "+ks.map((v,i)=>`${lab(v)} on ${i?c[v]:densPl(c[v],"lift")}`).join(", ")+".";
}
function densMovedLine(mob){
  const ks=[]; mob.forEach(r=>{ let ms=[r.k]; try{ if(typeof exMuscles==="function"){ const x=exMuscles(r.n); if(x.length) ms=x; } }catch(e){} ms.forEach(k=>{ if(MUSCLES[k]&&!ks.includes(k)) ks.push(k); }); });
  const n=ks.slice(0,5).map(k=>densSay(k).toLowerCase());
  const list=ks.length>5?n.join(", ")+" and more":n.length>1?n.slice(0,-1).join(", ")+" and "+n[n.length-1]:n[0];
  return {ks,txt:n.length?`It moved your ${list}.`:""};
}

/* ---------- the picture: a still of your own body, lit where the sets went ---------- */
/* L = {muscle: weight}. Front, back or both (whichever holds the work), cropped to the upper or lower body
   when three quarters of it is there. Without WebGL (or when the 3D can't draw right now) the 2D heat figure. */
function densShot(L,label){
  const ks=Object.keys(L).filter(k=>L[k]>0&&MUSCLES[k]); if(!ks.length) return "";
  const mx=Math.max(...ks.map(k=>L[k])), I={}, mask={};
  let fr=0,bk=0,up=0,lo=0,all=0;
  ks.forEach(k=>{ const v=L[k]; I[k]=v/mx; mask[k]=Math.round((0.25+0.75*I[k])*100)/100; all+=v;
    if((MUSCLES[k].face||0)>1.57) bk+=v; else fr+=v;
    const g=densRegion(k); if(["chest","shoulders","arms","core","upperback"].includes(g)) up+=v; else if(["glutes","thighs","lowerlegs"].includes(g)) lo+=v; });
  const yaws=fr/all>=0.75?[0]:bk/all>=0.75?[Math.PI]:[0,Math.PI];
  const crop=up/all>=0.75?[0.08,0.6]:lo/all>=0.75?[0.42,1]:null;
  const aria=`role="img" aria-label="${uiEsc(label)}"`;
  let urls=null;
  if(typeof Body!=="undefined"&&Body&&Body.kind==="gl"&&typeof Body.shot==="function"){
    const c=densShot.c||(densShot.c=[]);
    const key=[S.body,S.finish||"",yaws.join(","),crop?crop.join(","):"",ks.sort().map(k=>k+mask[k]).join(","),uiSafe(()=>typeof bxLookKey==="function"?bxLookKey():"","")].join("|");
    const hit=c.find(e=>e.key===key);
    if(hit) urls=hit.urls;
    else{
      try{ urls=yaws.map(y=>Body.shot({yaw:y,mask,...(crop?{crop}:{}),h:900})); }catch(e){ urls=null; }
      if(urls&&urls.every(Boolean)){ c.unshift({key,urls}); c.length=Math.min(c.length,4); } else urls=null;
    }
  }
  if(urls) return `<div class="dz-hero${urls.length>1?" two":""}" ${aria}>${urls.map(u=>`<img class="dz-shot" src="${u}" alt="" draggable="false">`).join("")}</div>`;
  let h=200; try{ if(matchMedia("(max-height:700px)").matches) h=150; }catch(e){}
  return `<div class="dz-hero dz-heat" ${aria}>${heatSVG(I,null,h)}</div>`;
}

/* ---------- the panels ---------- */
function densPanel(id,label){
  let p=$(id); if(p) return p;
  p=document.createElement("section"); p.className="panel u-own dz"; p.id=id; p.setAttribute("aria-label",label);
  p.innerHTML=`<div class="p-head dz-head"><button class="u-back dz-back" aria-label="Back">‹ Back</button>
    <div class="dz-hd"><span class="u-eyebrow dz-eye"></span><h2 class="dz-t"></h2></div><span aria-hidden="true"></span></div><div class="p-body dz-body"></div>`;
  $("app").appendChild(p);
  p.querySelector(".dz-back").onclick=()=>{ Pulse.buzz(6); p.classList.remove("on"); };
  return p;
}
function densFront(p){ try{ if(typeof uiPanelFront==="function") return uiPanelFront(p); }catch(e){} $("app").appendChild(p); return p; }
/* slide in now (a forced layout keeps the transition), so a quick Back can never be undone by a late frame */
function densShow(p){ densFront(p); void p.offsetWidth; p.classList.add("on"); }

/* ---------- Where your sets went ---------- */
/* id: a densId; o.from 'hub'|'list'|'done', o.mode 'session'|'weeks' */
function openDensity(id,o){
  o=o||{};
  const x=densFind(id);
  if(!x){ try{ toast("That session isn't saved any more."); }catch(e){} return; }
  openDensity.s={id:x.id,mode:o.mode==="weeks"?"weeks":"session",from:o.from||"hub",focus:null};
  Pulse.buzz(8); try{ track("sets_open",{from:openDensity.s.from}); }catch(e){}
  const p=densPanel("densP","Where your sets went");
  uiBackSet(p.querySelector(".dz-back"),o.from==="list"?"Past sessions":o.from==="done"?"Workout":uiPlaceName());
  densDraw();                                   // the still is taken here, before the panel slides in
  p.querySelector(".dz-body").scrollTop=0;
  densShow(p);
}
function densDraw(keepScroll){
  const st=openDensity.s, p=$("densP"); if(!st||!p) return;
  const x=densFind(st.id); if(!x){ p.classList.remove("on"); return; }
  const w=x.w, b=p.querySelector(".dz-body"), y0=b.scrollTop, weeks=st.mode==="weeks";
  const W=densWindow(x), me=W.me, C=weeks?W.A:W.C;
  p.querySelector(".dz-eye").textContent=`${densDate(w.d,{weekday:"short",day:"numeric",month:"short"})} · ${w.title||"Workout"}`;
  p.querySelector(".dz-t").textContent="Where your sets went";
  const mob=w.kind==="mobility"||w.kind==="posture"||(me.src!=="none"&&!W.C.lifts.length&&W.C.mob.length>0);
  /* the 4 weeks' sets are the ones that counted (W.A.tot), like every number below: no stretch rounds */
  const sum=weeks
    ?`${densPl(W.list.length,"session")} · ${densPl(W.A.tot,"set")} · ${densDate(W.from,{day:"numeric",month:"short"})} to ${densDate(W.to,{day:"numeric",month:"short"})}`
    :mob?[w.kind==="posture"?"Posture":"Mobility",me.rows.length?densPl(me.rows.length,"move"):"",`${+w.mins||0} min`].filter(Boolean).join(" · ")
    :[densPl(+w.sets||0,"set"),`${+w.mins||0} min`,w.vol?`${fvol(w.vol)} kg lifted`:""].filter(Boolean).join(" · ");
  const top=densTop(C);
  let focus=st.focus&&C.M[st.focus]?st.focus:(weeks?densTop(W.C)||top:top);
  if(focus&&!(C.M[focus]&&C.M[focus].n>0)) focus=top;
  /* notes about missing detail */
  const notes=[];
  if(!weeks){
    if(me.src==="lifts") notes.push(`Rebuilt from your lift history.${me.same>1?` ${me.same===2?"Two":me.same} sessions on this day are shown together.`:""}`);
    if(me.src==="none") notes.push("Only the totals were kept for this session.");
  } else {
    if(W.list.length===1) notes.push("This is your only session in the last 4 weeks.");
    if(W.bare) notes.push(`${W.bare===1?"One session":W.bare+" sessions"} in these 4 weeks kept only ${W.bare===1?"its":"their"} totals, so ${W.bare===1?"it isn't":"they aren't"} counted here.`);
  }
  /* the picture and the chip */
  let hero="", chip="";
  if(top){
    const L={}; Object.keys(C.M).forEach(k=>{ if(C.M[k].n>0) L[k]=C.M[k].n; });
    const names=Object.keys(L).sort((a,b)=>L[b]-L[a]).slice(0,4).map(densSay);
    hero=densShot(L,`Your body, lit where the sets went: ${names.join(", ")}`);
    chip=`<p class="dz-chip"><span class="dz-chip-ic">${densIc()}</span><span>${weeks?"Most work in 4 weeks":"Most work"}: <b>${uiEsc(densSay(top))} · ${densPl(C.M[top].n,"set")}</b></span></p>`;
  } else if(mob&&!weeks){
    const mv=densMovedLine(W.C.mob), L={}; mv.ks.forEach(k=>L[k]=1);
    hero=mv.ks.length?densShot(L,`Your body, lit where this session moved: ${mv.ks.slice(0,4).map(densSay).join(", ")}`):"";
  }
  /* the split of the focus muscle */
  let split="";
  if(focus){
    const P=densParts(focus,C), Po=weeks?null:densParts(focus,W.O), mark=!weeks&&Po&&Po.t>=3;
    const cards=P.parts.map(q=>{ const pc=P.t?Math.round(q.a/P.t*100):0, o=mark?Math.round(densPart(Po,q.id).a/Po.t*100):null;
      return `<div class="dz-zc${q.a?"":" none"}" role="group" aria-label="${uiEsc(densPartLine(P,q,weeks))}">
        <div class="dz-zt"><b>${uiEsc(q.label)}</b><small>${uiEsc(densPartSub(P,q,weeks))}</small></div>
        <span class="dz-n" aria-hidden="true"><b>${q.a}</b><small>of ${P.t}</small></span>
        <span class="dz-barw" aria-hidden="true"><span class="u-bar"><i style="width:${pc}%"></i></span>${o!=null?`<i class="dz-mk" style="left:${o}%"></i>`:""}</span></div>`; }).join("");
    const cmp=weeks?"":densCompare(P,Po);
    split=`<section class="dz-focus" aria-label="${uiEsc(P.head)}">
      <div class="u-section-h"><span class="u-eyebrow">${uiEsc(P.head)} · ${densPl(P.t,P.kind==="zone"?"set":P.noun+" set")}</span>${P.kind==="zone"?`<span class="u-eyebrow">Zones</span>`:""}</div>
      <div class="dz-zcs">${cards}</div>
      ${mark?`<p class="dz-key"><i aria-hidden="true"></i>The rest of your last 4 weeks</p>`:""}
      ${cmp?`<p class="dz-cmp">${uiEsc(cmp)}</p>`:""}</section>`;
  }
  /* every muscle */
  const ms=Object.keys(C.M).filter(k=>C.M[k].n>0).sort((a,b)=>C.M[b].n-C.M[a].n||GLORDER.indexOf(a)-GLORDER.indexOf(b));
  const mrow=k=>{ const o=C.M[k], t=rankTier(S.scores[k]||0), on=k===focus;
    let sub;
    if(weeks){ const pw=Math.round(o.n/4), ns=W.per.filter(q=>((q.C.M[k]||{}).n||0)>0).length; sub=`${pw?pw+" a week":"Under 1 a week"} · ${densPl(ns,"session")}`; }
    else sub=`${densMainLine(o)} · ${densUsual(k,W)}`;
    return `<button class="u-row dz-mrow${on?" on":""}" data-dm="${k}" aria-pressed="${on}" aria-label="${uiEsc(densSay(k))}: ${densPl(o.n,"set")}. ${uiEsc(sub)}. Show its split">
      <i class="rk-sq" style="--c:var(--rk-${t})" data-t="${t}"></i><span><b>${uiEsc(densSay(k))}</b><small>${uiEsc(sub)}</small></span><em>${densPl(o.n,"set")}</em></button>`; };
  const muscles=ms.length?`<div class="u-section-h"><span class="u-eyebrow">Every muscle${weeks?" · 4 weeks":""}</span><span class="u-eyebrow">Sets</span></div>
    <div class="u-card u-list dz-ms">${ms.map(mrow).join("")}</div>`:"";
  /* the lifts (this session only) and how they felt */
  let lifts="", felt="";
  if(!weeks&&me.rows.length){
    /* a lift: "4 sets · 29 reps · 2,030 kg". A stretch or mobility move counts no sets, so it says rounds
       (and says so, unless the whole session is moves that count nothing: the card below says it then) */
    const lrow=r=>{ const st=r.mob||vxIsStretch(r.n), bits=[densPl(r.s,st?"round":"set")];
      if(r.r) bits.push(densPl(r.r,"rep")); if(r.kg) bits.push(`${fvol(r.kg)} kg`); if(!r.r&&r.hold) bits.push(`longest ${r.hold} s`);
      if(st&&(!mob||W.C.tot>0)) bits.push("mobility, no sets counted");
      return `<button class="u-row dz-lrow" data-dl="${encodeURIComponent(r.n)}" aria-label="${uiEsc(r.n)}: ${uiEsc(bits.join(", "))}. Insights"><span><b>${uiEsc(r.n)}</b><small>${uiEsc(bits.join(" · "))}</small></span>${UI_IC.chev}</button>`; };
    lifts=`<div class="u-section-h"><span class="u-eyebrow">${mob?"The moves":"The lifts"}</span></div><div class="u-card u-list dz-ls">${me.rows.map(lrow).join("")}</div>`;
    felt=densFelt(w,me.rows);
  }
  /* a mobility or posture session where nothing counted. Posture days with real lifts (Day 8 on: wall slide,
     glute bridge…) earn RP, so their sets count and show like any session's, with no "don't count" card */
  let mobTxt="";
  if(mob&&!weeks&&me.src!=="none"&&!W.C.tot){
    const mv=densMovedLine(W.C.mob);
    mobTxt=`<div class="u-card dz-mob"><b>${w.kind==="posture"?"A posture session":"A mobility session"}</b><p class="u-small">${w.kind==="posture"?"Posture drills don't count as sets.":"Mobility moves don't count as sets."} It still counts for your streak.${mv.txt?" "+uiEsc(mv.txt):""}</p></div>`;
  }
  /* nothing counted: the totals-only note says why for this session; the 4 weeks get a card */
  const empty=!top&&!mobTxt&&(weeks||me.src!=="none")?`<div class="u-card dz-mob"><b>${weeks?"No sets counted in these 4 weeks":"No sets counted"}</b><p class="u-small">${weeks?"Lifts you log show here, muscle by muscle.":"Nothing in this session counted as a set."}</p></div>`:"";
  b.innerHTML=`<div class="dz-in">
    <p class="dz-sum">${uiEsc(sum)}</p>
    ${notes.length?`<p class="dz-note">${uiEsc(notes.join(" "))}</p>`:""}
    ${hero}${chip}
    <div class="u-seg dz-seg" role="tablist" aria-label="Show"><button role="tab" data-dzm="session" aria-selected="${!weeks}" class="${weeks?"":"on"}">This session</button><button role="tab" data-dzm="weeks" aria-selected="${weeks}" class="${weeks?"on":""}">Your last 4 weeks</button></div>
    ${mobTxt}${empty}${split}${muscles}${lifts}
    ${felt?`<p class="dz-felt">${uiEsc(felt)}</p>`:""}
    ${top?`<p class="u-foot dz-foot">A set counts for a muscle when it does at least 60% of the work. One set can count for two muscles. Zones come from the lifts you chose, not from measuring the muscle.</p>`:""}
  </div>`;
  b.querySelectorAll("[data-dzm]").forEach(e=>e.onclick=()=>{ if(e.dataset.dzm===st.mode) return; Pulse.buzz(6); st.mode=e.dataset.dzm; densDraw(true); });
  b.querySelectorAll("[data-dm]").forEach(e=>e.onclick=()=>{ Pulse.buzz(6); st.focus=e.dataset.dm; densDraw(true);
    const f=b.querySelector(".dz-focus"); if(f){ const d=f.getBoundingClientRect().top-b.getBoundingClientRect().top-8; b.scrollTo({top:b.scrollTop+d,behavior:reduced?"auto":"smooth"}); } });
  b.querySelectorAll("[data-dl]").forEach(e=>e.onclick=()=>{ const n=decodeURIComponent(e.dataset.dl);
    if(typeof openInsights!=="function") return;
    try{ if(typeof trInsPanel==="function") densFront(trInsPanel()); }catch(x){}
    openInsights(n); });
  if(keepScroll) b.scrollTop=y0;
}

/* ---------- Past sessions: the Train hub (newest n) and the full list by month ---------- */
function densTitle(w){ return String((w&&w.title)||"Workout").replace(/\s*·\s*\d+\s*min$/,"")||"Workout"; }
function densRowHTML(x){
  const w=x.w, day=densDate(w.d,{day:"numeric"}), wd=densDate(w.d,{weekday:"short"}), full=densDate(w.d,{weekday:"long",day:"numeric",month:"long"});
  const mob=w.kind==="mobility"||w.kind==="posture";
  const sub=mob?`${w.kind==="posture"?"Posture":"Mobility"} · ${+w.mins||0} min`:[densPl(+w.sets||0,"set"),`${+w.mins||0} min`,w.vol?`${fvol(w.vol)} kg`:""].filter(Boolean).join(" · ");
  const lab=`${densTitle(w)}, ${full}: ${mob?(w.kind==="posture"?"posture":"mobility")+", ":densPl(+w.sets||0,"set")+", "}${densPl(+w.mins||0,"minute")}. Where your sets went`;
  return `<button class="u-row dz-srow" data-dw="${x.id}" aria-label="${uiEsc(lab)}"><span class="dz-date" aria-hidden="true"><b>${day}</b><small>${wd}</small></span>
    <span><b>${uiEsc(densTitle(w))}</b><small>${uiEsc(sub)}</small></span>${UI_IC.chev}</button>`;
}
/* the hub's section, right after Your lifts: "" when there are no sessions */
function densPastHTML(n){
  n=n||4; const R=densRecs(); if(!R.length) return "";
  return `<div class="u-section-h"><span class="u-eyebrow">Past sessions</span>${R.length>n?`<button class="u-link" data-dall="1" aria-label="All ${R.length} past sessions">All ${R.length} ›</button>`:""}</div>
    <div class="u-card u-list dz-past">${R.slice(0,n).map(densRowHTML).join("")}</div>`;
}
function densWireHub(el){
  if(!el) return;
  el.querySelectorAll("[data-dw]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); openDensity(b.dataset.dw,{from:"hub"}); });
  el.querySelectorAll("[data-dall]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); Pulse.buzz(8); densListOpen(); });
}
function densListOpen(){
  const p=densPanel("densL","Past sessions"), R=densRecs();
  uiBackSet(p.querySelector(".dz-back"),uiPlaceName());
  densListOpen.n=100;
  p.querySelector(".dz-eye").textContent=densPl(R.length,"session");
  p.querySelector(".dz-t").textContent="Past sessions";
  densListDraw();
  p.querySelector(".dz-body").scrollTop=0;
  densShow(p);
}
function densListDraw(){
  const p=$("densL"); if(!p) return;
  const R=densRecs(), b=p.querySelector(".dz-body"), y0=b.scrollTop, show=R.slice(0,densListOpen.n||100), groups=[];
  show.forEach(x=>{ const m=x.w.d.slice(0,7), g=groups[groups.length-1]; if(g&&g.m===m) g.xs.push(x); else groups.push({m,xs:[x]}); });
  b.innerHTML=`<div class="dz-in">${R.length?groups.map(g=>`<div class="u-section-h"><span class="u-eyebrow">${densDate(g.m+"-15",{month:"long",year:"numeric"})}</span><span class="u-eyebrow">${densPl(g.xs.length,"session")}</span></div>
      <div class="u-card u-list dz-past">${g.xs.map(densRowHTML).join("")}</div>`).join(""):`<div class="u-empty"><b class="u-h2">No sessions yet</b><p class="u-small">Finish a workout and it shows here.</p></div>`}
    ${R.length>show.length?`<button class="u-btn block dz-more" id="dzMore">Show older sessions</button>`:""}
    <p class="u-foot">Sessions are kept for 400 days. Past your newest 120, only the totals are kept.</p></div>`;
  b.querySelectorAll("[data-dw]").forEach(e=>e.onclick=()=>openDensity(e.dataset.dw,{from:"list"}));
  const more=$("dzMore"); if(more) more.onclick=()=>{ Pulse.buzz(6); densListOpen.n=(densListOpen.n||100)+100; densListDraw(); };
  b.scrollTop=y0;
}

/* ---------- Workout complete: one row that opens the session you just finished ---------- */
function densDoneRowHTML(R){
  const rec=R&&R.rec; if(!rec) return "";
  const C=densCount(densRows(rec).rows), top=densTop(C); if(!top) return "";   // nothing counted (mobility, stretch-only posture days): no row
  const most=`${densSay(top)} · ${densPl(C.M[top].n,"set")}`;
  return `<div class="u-card u-list dz-done"><button class="u-row" id="dzDone" aria-label="Where your sets went. Most work: ${uiEsc(most)}">
    <span class="u-ic" style="--c:var(--glow)">${densIc()}</span><span><b>Where your sets went</b><small>Most work: ${uiEsc(most)}</small></span>${UI_IC.chev}</button></div>`;
}
function densWireDone(R){
  const b=$("dzDone"); if(!b||!R||!R.rec) return;
  b.onclick=e=>{ e.stopPropagation(); const i=(S.workouts||[]).indexOf(R.rec); openDensity(densId(R.rec,i),{from:"done"}); };
}
