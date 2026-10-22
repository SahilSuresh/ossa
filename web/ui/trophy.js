/* =========================================================
   TROPHY ROOM (Ossa 2.0, Phase 5 "Evolve", package: trophy). Prefix: tro* (classes .tro-).
   What you've earned and what's next: 43 trophies, 93 grades, in four groups (Body, Training, Lifts, Mind).
   Grades 1 · 2 · 3 are called Bronze · Silver · Gold (--tro-1/2/3) in every line of copy, and drawn as
   1-3 pips under the badge's glyph, never as numerals (so "Iron Core II" can't read like a rank level).
   One-grade trophies have no grade word and no pips. pts are internal (the card's top trophy), never shown.

   Saved: S.trophies = {v:1,
            got:{ [id]: {g:1|2|3, at:"YYYY-MM-DD", seen:bool} },   only ever added or upgraded, never removed
            c:{ leg, prs, carry, best, first:{ [compound lift]: e1RM > 0 }, upto },
            bf:"YYYY-MM-DD" }                                       backfill done
          Created lazily by troState(); Load demo / Start fresh drop it and the next check backfills again.

   Awarding: troCheck(src) evaluates the catalogue and only ever raises a grade.
     "boot"    1.5 s after the first paint (silent, seen:true). The first check on a save also runs the
               backfill: leg days and carry sets from the retained records/lifts, the streak as it is now,
               Comeback from one scan of S.workouts, and upto = the newest record's end (no double count).
     "workout" vxOn("workout"): fills R.ev.tro for Workout complete (core draws it), counts leg days, personal
               bests and carry sets once per record (rec.end > c.upto), checks Comeback for that record only.
     "log"     vxOn("log"): a toast 1.8 s after quickLog's own toast.
     "aura" "day" "evolve" (not our own what:"trophy")  deferred with setTimeout(0), silent, seen:false.
     "hub"     core runs it after drawing the hub (silent, seen:false so the tile's dot shows).
     "dare"    vxOn("dare") when a dare is done: checked at once, the toast 1.8 s later (Weatherproof).
   Saves only on change; emits vxEmit("evolve",{what:"trophy"}) after the save when a grade moved (the
   backfill's too, though it is never tracked or reported). The room runs a deferred "hub" check when it is owed.
   troTile() never checks, never saves. Views never emit.

   Reads only (never seeds): S.mind.check / S.mind.log (never mindState()), S.learn.done (never rdL()),
   stdStreak(), ckAll(), psAll(), auLv(), uiStreak() all inside try. Lift trophies count compound lifts only
   (exInfo(name).type), sets with kg>0 and r>0, and only once c.first[name] > 0.

   Start-up rule: function declarations only, state on function properties, no top-level const or let.
   ========================================================= */

/* ---------- the catalogue ---------- */
function troCat(){
  if(troCat.c) return troCat.c;
  const T3=["Strong","Forged","Unbreakable"], RP=[20,45,80];
  const R=r=>((REGIONS[r]&&REGIONS[r].muscles)||[]).slice();
  const reg=(id,name,r,lead,pts,gl)=>({id,name,grp:"body",t:"tier",ks:R(r),n:3,pts:pts||RP,gl:gl||"shield",rules:T3.map(x=>`${lead} at ${x}`)});
  const cnt=(id,name,grp,th,rules,pts,v,gl,o)=>Object.assign({id,name,grp,t:"cnt",n:th.length,th,rules,pts,v,gl},o||{});
  const one=(id,name,grp,rule,pts,v,gl,o)=>Object.assign({id,name,grp,t:"one",n:1,rules:[rule],pts:[pts],v,gl},o||{});
  const lift=(id,name,pat,rule)=>one(id,name,"lift",rule,50,X=>troLiftX(X).ratio[pat]>=1.25,"bar",
    {p:X=>{ const r=troLiftX(X).ratio[pat]||0; if(!r) return {f:0,txt:"Not yet"}; const up=Math.max(0,Math.round((r-1)*100)); return {f:Math.min(1,up/25),txt:`+${Math.min(up,25)}% of 25%`}; }});
  const ml=k=>{ const L=S.mind&&Array.isArray(S.mind.log)?S.mind.log:[]; return L.filter(e=>e&&(k==="monk"?e.k==="focus"&&e.src==="monk":e.k===k)); };
  const keys=o=>o&&typeof o==="object"?Object.keys(o).length:0;
  troCat.c=[
    /* Body (12) */
    reg("iron_core","Iron Core","core","Abs and obliques",null,"core"),
    reg("apex_back","Apex Back","upperback","Traps, lats and rhomboids",null,"back"),
    reg("armour_plate","Armour Plate","chest","All three chest muscles",null,"shield"),
    reg("boulder","Boulder Shoulders","shoulders","All three delts",null,"delt"),
    reg("steel_arms","Steel Arms","arms","Biceps, triceps and forearms",null,"arm"),
    reg("solid_spine","Solid Spine","lowerback","Lower back",[15,35,70],"spine"),
    reg("powerhouse","Powerhouse","glutes","Both glute muscles",null,"bolt"),
    reg("pillars","Pillars","thighs","Quads, hamstrings and adductors",null,"pillar"),
    reg("ground_up","Ground Up","lowerlegs","Calves and shins",null,"up"),
    one("all_ranked","Every Muscle","body","Every muscle ranked",30,X=>GLORDER.every(k=>(+X.sc[k]||0)>=1),"body",
      {p:X=>{ const n=GLORDER.filter(k=>(+X.sc[k]||0)>=1).length; return {f:n/GLORDER.length,txt:`${n} of ${GLORDER.length}`}; }}),
    {id:"whole_body",name:"Whole Body",grp:"body",t:"tier",ks:GLORDER.slice(),n:3,pts:[60,120,200],gl:"body",rules:T3.map(x=>`Every muscle at ${x}`)},
    cnt("prestige","Prestige","body",[1,3,10],["Finish 1 prestige lap","Finish 3 prestige laps","Finish 10 prestige laps"],[100,160,250],X=>troMemo(X,"pz",troPzLaps),"star"),
    /* Training (11) */
    one("first","First Session","train","Train once",5,X=>troMemo(X,"n",sessionsN)>=1,"flag",{ms:true}),
    cnt("regular","Regular","train",[10,25,50],["10 sessions","25 sessions","50 sessions"],[10,25,50],X=>troMemo(X,"n",sessionsN),"cal",{ms:true}),
    cnt("centurion","Centurion","train",[100,250,500],["100 sessions","250 sessions","500 sessions"],[90,150,250],X=>troMemo(X,"n",sessionsN),"cal",{ms:true}),
    cnt("on_fire","On Fire","train",[7,30,100],["A 7-day streak","A 30-day streak","A 100-day streak"],[10,40,120],X=>Math.max(+X.st.c.best||0,troMemo(X,"stk",troStreakNow)),"flame"),
    cnt("leg_day","Leg Day Legend","train",[50],["50 leg days"],[60],X=>+X.st.c.leg||0,"leg"),
    cnt("grit","Grit Master","train",[5,15,25],["5 dares done","15 dares done","25 dares done"],[10,25,45],()=>+((S.dares||{}).won)||0,"bolt"),
    cnt("weatherproof","Weatherproof","train",[3,10,25],["3 weather dares done","10 weather dares done","25 weather dares done"],[10,25,45],()=>+((S.dares||{}).wxWon)||0,"rain"),
    cnt("standards","Standard Bearer","train",[7,30,100],["Keep your standards 7 days running","Keep your standards 30 days running","Keep your standards 100 days running"],[10,40,120],
      X=>troMemo(X,"std",()=>{ try{ return typeof stdStreak==="function"?+stdStreak()||0:0; }catch(e){ return 0; } }),"check"),
    one("comeback","Comeback","train","Train a muscle again after 10+ days away",10,X=>!!X.cb,"back2"),
    one("full_week","Full Week","train","All 23 muscles worked in one week",40,X=>troMemo(X,"wk",troWeekN)>=GLORDER.length,"grid",
      {p:X=>{ const n=troMemo(X,"wk",troWeekN); return {f:n/GLORDER.length,txt:`${n} of ${GLORDER.length}`}; }}),
    one("path_chosen","Path Chosen","train","Choose Tank or Scout",15,()=>!!(S.path&&S.path.arch),"fork"),
    /* Lifts (11) */
    cnt("records","Record Breaker","lift",[1,10,50],["1 personal best","10 personal bests","50 personal bests"],[5,25,70],X=>+X.st.c.prs||0,"cup"),
    lift("titan_squat","Titan Squat","squat","A squat's estimated max 25% over your first"),
    lift("iron_hinge","Iron Hinge","hinge","A hinge lift's estimated max 25% over your first"),
    lift("big_press","Big Press","push","A pressing lift's estimated max 25% over your first"),
    lift("big_pull","Big Pull","pull","A pulling lift's estimated max 25% over your first"),
    one("steel_bicep","Steel Bicep","lift","Biceps at Forged",35,X=>(+X.sc.biceps||0)>=60,"arm",
      {p:X=>{ const s=Math.max(0,Math.round(+X.sc.biceps||0)); return {f:Math.min(1,s/60),txt:`${Math.min(s,60)} of 60 RP`}; }}),
    cnt("ton_up","Ton Up","lift",[1000,5000,10000],["1,000 kg in one session","5,000 kg in one session","10,000 kg in one session"],[10,30,60],X=>troMemo(X,"vol",troBestVol),"bar",{u:" kg"}),
    cnt("heavy_hauler","Heavy Hauler","lift",[10,100,1000],["10 tonnes lifted in all","100 tonnes lifted in all","1,000 tonnes lifted in all"],[15,60,200],
      ()=>Math.floor((+((S.tally||{}).vol)||0)/1000),"stack",{u:" t"}),
    one("rep_machine","Rep Machine","lift","20 reps in one bodyweight set",20,X=>troLiftX(X).bwR>=20,"repeat",
      {p:X=>{ const r=troLiftX(X).bwR; return {f:Math.min(1,r/20),txt:`${Math.min(r,20)} of 20 reps`}; }}),
    one("iron_hold","Iron Hold","lift","Hold for 60 seconds in one set",20,X=>troLiftX(X).hold>=60,"timer",
      {p:X=>{ const s=troLiftX(X).hold; return {f:Math.min(1,s/60),txt:`${Math.min(s,60)} of 60 s`}; }}),
    cnt("loaded_carry","Loaded Carry","lift",[10],["10 carry sets"],[20],X=>+X.st.c.carry||0,"carry"),
    /* Mind (9) */
    cnt("monk_adept","Monk Adept","mind",[10],["10 Monk Mode sessions"],[40],X=>troMemo(X,"monk",()=>ml("monk").length),"target"),
    one("deep_focus","Deep Focus","mind","Finish a 90-minute Monk session",50,X=>troMemo(X,"deep",()=>troDeepMin(ml("monk")))>=90,"moon",
      {p:X=>{ const m=troMemo(X,"deep",()=>troDeepMin(ml("monk"))); return {f:Math.min(1,m/90),txt:`${Math.min(m,90)} of 90 min`}; }}),
    cnt("crystalline","Crystalline","mind",[15],["Reach Aura level 15"],[60],()=>{ try{ return typeof auLv==="function"?+auLv()||1:1; }catch(e){ return 1; } },"gem",
      {p:X=>{ let v=1; try{ v=typeof auLv==="function"?+auLv()||1:1; }catch(e){} v=Math.min(15,Math.max(1,Math.floor(v))); return {f:(v-1)/14,txt:`Level ${v} of 15`}; }}),   // everyone starts at level 1
    cnt("steady_breath","Steady Breath","mind",[10,50,100],["10 breathing sessions","50 breathing sessions","100 breathing sessions"],[10,35,70],X=>troMemo(X,"br",()=>ml("breath").length),"breathe"),
    cnt("scholar","Scholar","mind",[1,6,12],["1 lesson done","6 lessons done","12 lessons done"],[5,20,45],()=>keys(S.learn&&S.learn.done),"book"),
    cnt("checked_in","Checked In","mind",[7,30,100],["7 check-ins","30 check-ins","100 check-ins"],[5,20,60],()=>keys(S.mind&&S.mind.check),"heart"),
    cnt("body_check","Body Check","mind",[1,3,6],["1 body check","3 body checks","6 body checks"],[5,20,45],()=>{ try{ return typeof ckAll==="function"?ckAll().length:0; }catch(e){ return 0; } },"pulse"),
    cnt("stand_tall","Stand Tall","mind",[1,3,6],["1 posture scan","3 posture scans","6 posture scans"],[5,20,45],()=>{ try{ return typeof psAll==="function"?psAll().length:0; }catch(e){ return 0; } },"posture"),
    cnt("fuelled","Fuelled","mind",[7],["Log fuel on 7 days"],[15],troFuelDays,"drop")
  ];
  return troCat.c;
}
function troGroups(){ return [["body","Body"],["train","Training"],["lift","Lifts"],["mind","Mind"]]; }
function troGname(e,g){ return e&&e.n>1&&g>0?["Bronze","Silver","Gold"][g-1]:""; }
function troById(id){ return troCat().find(e=>e.id===id)||null; }

/* ---------- readers used by the catalogue (pure) ---------- */
function troMemo(X,k,f){ const m=X.memo||(X.memo={}); if(!(k in m)){ try{ m[k]=f(X); }catch(e){ console.warn("Ossa: trophy "+k,e); m[k]=0; } } return m[k]; }
function troPzLaps(){
  try{ if(typeof pzEarned!=="function") return 0; return (pzEarned()||[]).reduce((a,x)=>a+(+(x&&x.lv)||0),0); }catch(e){ return 0; }
}
function troStreakNow(){ try{ return typeof uiStreak==="function"?+uiStreak().n||0:0; }catch(e){ return 0; } }
function troWeekN(){ try{ return GLORDER.filter(k=>weekSets(k)>=1).length; }catch(e){ return 0; } }
function troBestVol(){ return (S.workouts||[]).reduce((a,w)=>Math.max(a,+(w&&w.vol)||0),0); }
function troDeepMin(L){ return L.reduce((a,e)=>e&&e.full?Math.max(a,Math.round(+e.plan||0)):a,0); }
function troFuelDays(){
  const D=S.fuel&&S.fuel.days; if(!D||typeof D!=="object") return 0;
  return Object.keys(D).filter(d=>{ const x=D[d]; return x&&((+x.p||0)>0||(+x.c||0)>0); }).length;
}
function troE1(kg,r){ try{ if(typeof trE1==="function") return trE1(kg,r); }catch(e){} return kg>0&&r>0?kg*(1+Math.min(r,12)/30):0; }
function troPat(name){ try{ const i=typeof exInfo==="function"?exInfo(name):null; return i?{type:i.type,pattern:i.pattern}:{type:"",pattern:"none"}; }catch(e){ return {type:"",pattern:"none"}; } }
/* the four lift patterns whose estimated max counts (compound lifts only) */
function troLiftPats(){ return ["squat","hinge","push","pull"]; }
/* one pass over S.lifts: best ratio over your first per pattern, the longest bodyweight set, the longest hold */
function troLiftX(X){
  return troMemo(X,"lift",()=>{
    const L=S.lifts||{}, first=(X.st&&X.st.c&&X.st.c.first)||{}, ratio={}, P=troLiftPats(); let bwR=0, hold=0;
    Object.keys(L).forEach(name=>{
      const ent=Array.isArray(L[name])?L[name]:[]; let best=0;
      ent.forEach(h=>((h&&h.sets)||[]).forEach(x=>{ if(!x) return;
        if(x.r>0&&!(x.kg>0)) bwR=Math.max(bwR,Math.round(+x.r)||0);
        if(x.s>0) hold=Math.max(hold,Math.round(+x.s)||0);
        if(x.kg>0&&x.r>0) best=Math.max(best,troE1(+x.kg,+x.r)); }));
      const f=+first[name]||0; if(!(f>0)||!(best>0)) return;
      const t=troPat(name); if(t.type!=="compound"||!P.includes(t.pattern)) return;
      ratio[t.pattern]=Math.max(ratio[t.pattern]||0,best/f);
    });
    return {ratio,bwR,hold};
  });
}

/* ---------- state ---------- */
function troState(){
  let T=S.trophies;
  if(!T||typeof T!=="object"||Array.isArray(T)) T=S.trophies={v:1,got:{},c:{}};
  if(!T.got||typeof T.got!=="object") T.got={};
  if(!T.c||typeof T.c!=="object") T.c={};
  const c=T.c; ["leg","prs","carry","best","upto"].forEach(k=>{ if(typeof c[k]!=="number") c[k]=+c[k]||0; });
  if(!c.first||typeof c.first!=="object") c.first={};
  if(!T.v) T.v=1;
  return T;
}
/* the grade a trophy has now: 0..n */
function troGot(id){ const T=S.trophies, x=T&&T.got&&T.got[id]; return x&&x.g>0?Math.min(3,Math.floor(x.g)):0; }

/* ---------- evaluation ---------- */
/* the highest grade met right now (0..n) */
function troGrade(e,X){
  if(e.t==="tier"){ for(let g=e.n;g>=1;g--){ if(e.ks.length&&e.ks.every(k=>rankTier(+X.sc[k]||0)>=2+g)) return g; } return 0; }
  const v=e.v(X);
  if(e.t==="one") return v?1:0;
  let g=0; e.th.forEach((t,i)=>{ if(v>=t) g=i+1; }); return g;
}
/* progress towards grade gt (1..n): {f:0..1, txt:"31 of 50"} */
function troProg(e,X,gt){
  gt=Math.max(1,Math.min(e.n,gt||1));
  try{
    if(e.t==="tier"){
      const T=RANKS[2+gt][0], ks=e.ks, tr=2+gt;
      const f=ks.length?ks.reduce((a,k)=>a+Math.min(+X.sc[k]||0,T)/T,0)/ks.length:0, n=ks.filter(k=>rankTier(+X.sc[k]||0)>=tr).length;
      if(ks.length===1){ const s=Math.min(T,Math.max(0,Math.round(+X.sc[ks[0]]||0))); return {f:Math.max(0,Math.min(1,f)),txt:`${s} of ${T} RP`}; }
      return {f:Math.max(0,Math.min(1,f)),txt:`${n} of ${ks.length}`,long:`${n} of ${ks.length} muscles at ${RANKS[tr][1]}`};
    }
    if(e.p) return e.p(X,gt);
    if(e.t==="one") return {f:e.v(X)?1:0,txt:e.v(X)?"Done":"Not yet"};
    const v=Math.max(0,+e.v(X)||0), t=e.th[gt-1], fmt=x=>Math.floor(x).toLocaleString("en-GB");
    return {f:Math.min(1,v/t),txt:`${fmt(Math.min(v,t))} of ${fmt(t)}${e.u||""}`};
  }catch(x){ return {f:0,txt:"Not yet"}; }
}
function troX(o){ const T=troState(); return Object.assign({st:T,sc:S.scores||{},memo:{},cb:false},o||{}); }

/* the muscles of a leg day, and its test */
function troLegKs(){ return [].concat(...["glutes","thighs","lowerlegs"].map(r=>(REGIONS[r]&&REGIONS[r].muscles)||[])); }
function troLegDay(w){ if(!w||!Array.isArray(w.ex)) return false; const ks=troLegKs(); return w.ex.reduce((a,x)=>a+(x&&!x.mob&&ks.includes(x.k)?(+x.s||0):0),0)>=3; }
function troCarrySets(w){ if(!w||!Array.isArray(w.ex)) return 0; return w.ex.reduce((a,x)=>a+(x&&!x.mob&&troPat(x.n).pattern==="carry"?(+x.s||0):0),0); }
/* Comeback for one record: a muscle you trained (a row, not mobility) last credited 10+ days before */
function troComeback(rec){
  if(!rec||!Array.isArray(rec.ex)) return false;
  const W=S.workouts||[], i=W.indexOf(rec), prev=(i>=0?W.slice(0,i):W.filter(w=>w&&w!==rec&&(+w.end||0)<(+rec.end||0)));
  return rec.ex.some(x=>{ if(!x||x.mob||!x.k) return false;
    for(let j=prev.length-1;j>=0;j--){ const w=prev[j]; if(w&&w.rp&&w.rp[x.k]>0) return dayDiff(w.d,rec.d)>=10; }
    return false; });
}
/* first estimated max for every compound lift that hasn't one yet: the best set (kg>0) of its oldest retained session */
function troSeedFirst(T){
  const L=S.lifts||{}, F=T.c.first; let ch=false;
  Object.keys(L).forEach(name=>{
    if(+F[name]>0) return;
    const t=troPat(name); if(t.type!=="compound") return;
    const ent=(Array.isArray(L[name])?L[name]:[]).slice().sort((a,b)=>String((a&&a.d)||"").localeCompare(String((b&&b.d)||"")));
    for(const h of ent){ const e=((h&&h.sets)||[]).reduce((a,x)=>x&&x.kg>0&&x.r>0?Math.max(a,troE1(+x.kg,+x.r)):a,0);
      if(e>0){ F[name]=Math.round(e*10)/10; ch=true; break; } }
  });
  return ch;
}
/* the one-time backfill: counters from what the phone still holds. rec (when the first check on a save is a
   finished workout, e.g. a new user's first session) is left out, so the workout pass counts and reports it */
function troBackfill(T,rec){
  const W=(S.workouts||[]).filter(w=>w&&w!==rec).sort((a,b)=>(+a.end||0)-(+b.end||0)), c=T.c;
  c.leg=W.filter(troLegDay).length;
  /* carry sets: from the records (ex on the newest 120) or the lift history (20 per exercise), whichever holds more */
  let carry=0; const L=S.lifts||{}, today=rec?rec.d:null;
  Object.keys(L).forEach(name=>{ if(troPat(name).pattern!=="carry") return; (Array.isArray(L[name])?L[name]:[]).forEach(h=>{ if(h&&h.d!==today) carry+=((h&&h.sets)||[]).length; }); });
  c.carry=Math.max(carry,W.reduce((a,w)=>a+troCarrySets(w),0));
  c.upto=W.reduce((a,w)=>Math.max(a,+w.end||0),0);
  c.best=Math.max(+c.best||0,troStreakNow());
  /* Comeback: one scan, oldest first */
  const last={}; let cb=false;
  W.forEach(w=>{
    if(!cb&&Array.isArray(w.ex)) cb=w.ex.some(x=>x&&!x.mob&&x.k&&last[x.k]&&dayDiff(last[x.k],w.d)>=10);
    Object.keys(w.rp||{}).forEach(k=>{ if(w.rp[k]>0) last[k]=w.d; });
  });
  T.bf=dkey(0);
  return cb;
}
/* award every grade met; returns [{id,g,up}] */
function troAward(X,seen,skip){
  const T=X.st, out=[];
  troCat().forEach(e=>{
    if(skip&&skip.includes(e.id)) return;
    let g=0; try{ g=troGrade(e,X); }catch(x){ console.warn("Ossa: trophy "+e.id,x); }
    const cur=T.got[e.id], g0=cur&&cur.g>0?cur.g:0;
    if(g>g0){ T.got[e.id]={g,at:dkey(0),seen:!!seen}; out.push({id:e.id,g,up:g0>0}); }
  });
  return out;
}
/* evaluate and award. src: "boot"|"workout"|"log"|"aura"|"day"|"evolve"|"hub" (anything else: silent, seen:false).
   ctx (workout only): {rec, R}. Returns the newly earned or upgraded grades [{id,g}] */
function troCheck(src,ctx){
  try{
    if(!S||typeof S!=="object"||!Array.isArray(GLORDER)) return [];
    const T=troState(); let ch=false;
    /* first check on this save: the silent backfill (seen, not tracked, not reported). When that first check is a
       finished workout, its awards are this session's news instead (a new user's First Session shows) */
    const wk=src==="workout"&&ctx&&ctx.rec?ctx.rec:null; let bcb=false, bo=[];
    if(!T.bf){ troSeedFirst(T); bcb=troBackfill(T,wk); if(!wk) bo=troAward(troX({cb:bcb}),true); ch=true; }
    if(troSeedFirst(T)) ch=true;
    const X=troX();
    if(wk){
      const rec=ctx.rec, c=T.c;
      if((+rec.end||0)>(+c.upto||0)){
        if(troLegDay(rec)) c.leg=(+c.leg||0)+1;
        c.prs=(+c.prs||0)+((ctx.R&&Array.isArray(ctx.R.prs))?ctx.R.prs.length:0);
        c.carry=(+c.carry||0)+troCarrySets(rec);
        c.upto=+rec.end||Date.now(); ch=true;
      }
      X.cb=bcb||troComeback(rec);
    }
    const sn=troMemo(X,"stk",troStreakNow); if(sn>(+T.c.best||0)){ T.c.best=sn; ch=true; }
    /* Comeback scans records: only the backfill and a finished workout evaluate it */
    const out=troAward(X,src==="boot",src==="workout"?null:["comeback"]);
    if(out.length) ch=true;
    if(ch) save();
    /* the backfill's awards stay silent (not tracked, not reported) but still emit, so the hub tile and an open
       room redraw with the new count. After the save and never inside a credit listener (troPre does that one) */
    out.forEach(x=>{ try{ track("tro_earn",{id:x.id,g:x.g}); }catch(e){} });
    if(out.length||bo.length){ try{ vxEmit("evolve",{what:"trophy"}); }catch(e){ console.warn(e); } }
    return out.map(x=>({id:x.id,g:x.g,up:x.up}));
  }catch(e){ console.warn("Ossa: troCheck",e); return []; }
}
/* the backfill, run from the "credit" event when a save has never been checked (Load demo, then straight to a
   workout). At that moment nothing of the session is stored yet except the scores, which are taken back by the
   session's gains, so the backfill sees the save as it was and the "workout" pass reports only this session.
   State only: no save (finishWorkout and quickLog save straight after), no emit, no tracking. */
function troPre(C){
  const T=troState(); if(T.bf) return;
  const sc={...(S.scores||{})}; Object.keys((C&&C.gains)||{}).forEach(k=>{ sc[k]=Math.max(0,(+sc[k]||0)-(+C.gains[k]||0)); });
  troSeedFirst(T); const cb=troBackfill(T,null);
  troAward(troX({cb,sc}),true);
}
/* one line of news per grade, for Workout complete and the moments (core renders R.ev.tro) */
function troNews(list){
  return (list||[]).map(x=>{ const e=troById(x.id); if(!e) return null;
    return {id:x.id,g:x.g,name:e.name,gname:troGname(e,x.g),rule:e.rules[x.g-1]||"",ms:!!e.ms,up:!!x.up,c:troCol(e,x.g)}; }).filter(Boolean);
}

/* ---------- the hub tile and the card (pure) ---------- */
function troTile(){
  try{
    const T=S.trophies, got=(T&&T.got)||{}, C=troCat(), n=C.filter(e=>got[e.id]&&got[e.id].g>0).length;
    return {sub:`${n} of ${C.length}`,bar:n/C.length,c:"var(--gold)",dot:C.some(e=>got[e.id]&&got[e.id].g>0&&got[e.id].seen===false)};
  }catch(e){ return {sub:"",bar:null,c:"var(--gold)",dot:false}; }
}
/* the earned grade with the most points: {id,name,g,gname,rule} or null */
function troTop(){
  try{
    const got=(S.trophies&&S.trophies.got)||{}; let best=null, bp=-1;
    troCat().forEach(e=>{ const x=got[e.id]; if(!x||!(x.g>0)) return; const g=Math.min(e.n,Math.floor(x.g)), p=e.pts[g-1]||0;
      if(p>bp){ bp=p; best={id:e.id,name:e.name,g,gname:troGname(e,g),rule:e.rules[g-1]||""}; } });
    return best;
  }catch(e){ return null; }
}

/* ---------- drawing ---------- */
function troGlyph(k){
  const G=troGlyph.g||(troGlyph.g={
    shield:'<path d="M12 3.5 19 6v5.2c0 4.3-2.9 7.7-7 9.3-4.1-1.6-7-5-7-9.3V6z"/>',
    core:'<path d="M8 5.5h8M7.5 9.5h9M7.5 13.5h9M8 17.5h8M12 5.5v13"/>',
    back:'<path d="M12 4v16M5 7.5l7 3 7-3M6.5 13l5.5 2.5 5.5-2.5"/>',
    delt:'<path d="M4.5 15.5c0-5 3.4-8.5 7.5-8.5s7.5 3.5 7.5 8.5M8.5 15.5c0-2.8 1.6-4.7 3.5-4.7s3.5 1.9 3.5 4.7"/>',
    arm:'<path d="M5 17.5c3-.4 4.6-2 5.5-4.6M10.5 12.9c.6-2.5 2.6-4.4 5.6-4.4 2 0 3.4 1.4 3.4 3.4 0 3-3.4 5.6-8.5 5.6H5"/>',
    spine:'<path d="M12 3.5v17M9.5 6h5M9 10h6M9 14h6M9.5 18h5"/>',
    bolt:'<path d="M13 3.5 6 13h5l-1 7.5 7-9.5h-5z"/>',
    pillar:'<path d="M6 4.5h12M6 19.5h12M8.5 4.5v15M15.5 4.5v15M12 4.5v15"/>',
    up:'<path d="M12 19.5v-14M6.5 11 12 5.5 17.5 11M7 19.5h10"/>',
    body:'<circle cx="12" cy="5" r="1.8"/><path d="M6 9h12M12 9v5.5M12 14.5l-3 5.5M12 14.5l3 5.5"/>',
    star:'<path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.3L12 15.9l-4.9 2.7 1.1-5.3-4-3.7 5.4-.6z"/>',
    flag:'<path d="M6.5 20.5v-16M6.5 5h10l-2 3.5 2 3.5h-10"/>',
    cal:'<rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    flame:'<path d="M12 3.5c.8 3.2 4.8 5.2 4.8 9.6a4.8 4.8 0 0 1-9.6 0c0-2.3 1.2-3.8 2.3-4.8.3 1.7 1.1 2.6 2.3 2.8-.3-2.6-.8-4.9.2-7.6z"/>',
    leg:'<path d="M9.5 3.5v8l-2 8.5h4l1.5-7.5 2.5 7.5h3l-4-10V3.5"/>',
    check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    back2:'<path d="M5 12a7 7 0 1 0 2.1-5"/><path d="M5 4.5V9h4.5"/>',
    grid:'<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    fork:'<path d="M12 20.5V13M12 13 6.5 7.5M12 13l5.5-5.5M6.5 11V7.5H10M17.5 11V7.5H14"/>',
    cup:'<path d="M7.5 4.5h9v4a4.5 4.5 0 0 1-9 0zM7.5 6.5H5a2.5 2.5 0 0 0 2.6 3M16.5 6.5H19a2.5 2.5 0 0 1-2.6 3M12 13v3.5M8.5 19.5h7M9.5 16.5h5v3h-5z"/>',
    bar:'<path d="M3 9.5v5M6 7v10M18 7v10M21 9.5v5M6 12h12"/>',
    stack:'<path d="M4.5 19h15M6 15h12M7.5 11h9M9 7h6"/>',
    repeat:'<path d="M5 10V8.5A2.5 2.5 0 0 1 7.5 6H18M15.5 3.5 18 6l-2.5 2.5M19 14v1.5a2.5 2.5 0 0 1-2.5 2.5H6M8.5 20.5 6 18l2.5-2.5"/>',
    timer:'<circle cx="12" cy="13.5" r="6.5"/><path d="M12 13.5V10M10 3.5h4"/>',
    carry:'<path d="M8.5 8a3.5 3.5 0 0 1 7 0M6 9h12l-1.5 10.5h-9z"/>',
    target:'<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3"/>',
    moon:'<path d="M18.5 14.5A7 7 0 0 1 9.5 5.5a7 7 0 1 0 9 9z"/>',
    gem:'<path d="M7 4.5h10l3.5 4.5L12 20 3.5 9zM3.5 9h17M9.5 4.5 8.5 9l3.5 11 3.5-11-1-4.5"/>',
    breathe:'<path d="M3.5 9h10a2.6 2.6 0 1 0-2.6-2.6M3.5 13.5h13.5a2.4 2.4 0 1 1-2.4 2.4M3.5 18h6"/>',
    book:'<path d="M12 6.8C9.6 5.2 6.6 4.8 3.5 5.6v12.6c3.1-.8 6.1-.4 8.5 1.2 2.4-1.6 5.4-2 8.5-1.2V5.6c-3.1-.8-6.1-.4-8.5 1.2zM12 6.8v12.6"/>',
    heart:'<path d="M12 19.5s-7-4.2-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.1c0 5.2-7 9.4-7 9.4z"/>',
    pulse:'<path d="M3.5 12.5h4l2-5 4 10 2-5h5"/>',
    posture:'<path d="M12 3.5v17M9.5 5.5h5M9 9.5h6M9 13.5h6M9.5 17.5h5"/>',
    drop:'<path d="M12 3.5c3.8 4.5 5.8 7.5 5.8 10.3a5.8 5.8 0 0 1-11.6 0c0-2.8 2-5.8 5.8-10.3z"/>',
    rain:'<path d="M7 14.5h9.5a3.5 3.5 0 0 0 .4-7A5 5 0 0 0 7.4 7.6 3.5 3.5 0 0 0 7 14.5z"/><path d="M9 17.5 8 20M12.5 17.5l-1 2.5M16 17.5l-1 2.5"/>',
    lock:'<rect x="6" y="10.5" width="12" height="9" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>'
  });
  return `<svg class="tro-gl" viewBox="0 0 24 24" aria-hidden="true">${G[k]||G.shield}</svg>`;
}
function troStar(){ return '<svg class="tro-star" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.8 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17l-5.7 3.1 1.2-6.3-4.6-4.4 6.3-.8z"/></svg>'; }
/* a badge: hex in the grade colour with 1-3 pips (multi-grade only); ghost when locked (pips show the grade it's working towards) */
function troHex(e,g,o){
  o=o||{}; const on=g>0, gc=on?g:Math.max(1,o.next||1), pips=e.n>1?`<span class="tro-pips">${"<i></i>".repeat(gc)}</span>`:"";
  return `<span class="u-hexw tro-hw${on?"":" off"}${o.lg?" lg":""}" style="--c:${troCol(e,gc)}"><span class="u-hex tro-hex${on?"":" ghost"}">${troGlyph(e.gl)}${pips}</span></span>`;
}
/* a grade's colour: Bronze, Silver, Gold; a one-grade trophy is complete, so gold */
function troCol(e,g){ return `var(--tro-${e&&e.n===1?3:Math.max(1,Math.min(3,g||1))})`; }
function troDate(d,yr){
  try{ const [Y,M,D]=String(d).split("-").map(Number); const t=new Date(Y,M-1,D);
    return t.toLocaleDateString("en-GB",yr?{day:"numeric",month:"short",year:"numeric"}:{day:"numeric",month:"short"}); }catch(e){ return ""; }
}
function troEsc(t){ return typeof uiEsc==="function"?uiEsc(t):String(t==null?"":t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
/* "A 7-day streak" → "a 7-day streak" after a grade word; an acronym's capitals stay */
function troLc(t){ t=String(t||""); return /^[A-Z](?![A-Z])/.test(t)?t[0].toLowerCase()+t.slice(1):t; }
/* the six locked grades closest to done (one per trophy: its next grade), by progress, ties by points.
   A grade that is already met but not yet awarded is left out (troRender runs the check that awards it) */
function troNext(X,n,skip){
  const out=[];
  troCat().forEach(e=>{ const g0=troGot(e.id); if(g0>=e.n||(skip&&skip.includes(e.id))) return; const gt=g0+1;
    let met=0; try{ met=troGrade(e,X); }catch(x){} if(met>=gt) return;
    const p=troProg(e,X,gt);
    if(e.id==="comeback"&&!p.f) p.txt="Not yet";
    out.push({e,gt,p,pts:e.pts[gt-1]||0}); });
  out.sort((a,b)=>b.p.f-a.p.f||a.pts-b.pts);
  return out.slice(0,n||6);
}
/* one trophy's line for other screens (Phase 6: the weather dare's reward line and done toast), pure: never
   troState(), never a check or a save. g is the grade earned or already met (a dare just done shows "3 of 10"
   before the deferred check awards Bronze). {name, g, n, gname, prog:"2 of 3"|"", done} or null */
function troLine(id){
  try{
    const e=troById(id); if(!e) return null;
    const X={st:S.trophies||{c:{}},sc:S.scores||{},memo:{},cb:false};
    if(!X.st.c||typeof X.st.c!=="object") X.st={c:{}};
    let met=0; try{ met=troGrade(e,X); }catch(x){ met=0; }
    const g=Math.max(0,Math.min(e.n,Math.max(troGot(id),met||0)));
    return {name:e.name,g,n:e.n,gname:troGname(e,g),prog:g<e.n?troProg(e,X,g+1).txt:"",done:g===e.n};
  }catch(x){ console.warn("Ossa: troLine",x); return null; }
}
function troCount(){ const C=troCat(); return {n:C.filter(e=>troGot(e.id)>0).length,of:C.length}; }
function troPill(){
  const c=troCount();
  return `<span class="tro-pill" role="img" aria-label="${c.n} of ${c.of} trophies earned">${troStar()}<b>${c.n} of ${c.of}</b></span>`;
}
/* mark these earned trophies seen (the room shows them); saves only on change, never emits */
function troSeen(ids){
  const T=S.trophies; if(!T||!T.got) return; let ch=false;
  ids.forEach(id=>{ const x=T.got[id]; if(x&&x.g>0&&x.seen===false){ x.seen=true; ch=true; } });
  if(ch) try{ save(); }catch(e){}
}
function troFeatured(){
  const got=(S.trophies&&S.trophies.got)||{};
  return troCat().filter(e=>got[e.id]&&got[e.id].g>0)
    .map(e=>({e,g:Math.min(e.n,got[e.id].g),at:String(got[e.id].at||""),seen:got[e.id].seen!==false}))
    .sort((a,b)=>b.at.localeCompare(a.at)||(a.seen-b.seen)||(b.e.pts[b.g-1]||0)-(a.e.pts[a.g-1]||0));   // same day: the unseen ones are the newer
}

/* the main page: two newest, "Next up" (3×2), "All trophies" */
function troMain(b,o){
  const X=troX(), F=troFeatured(), top=F.slice(0,2), nx=troNext(X,6,top.length?null:["first"]);
  const card=(x,wide)=>{ const e=x.e, gn=troGname(e,x.g), gc=troCol(e,x.g);
    return `<button class="tro-fc${wide?" wide":""}" data-tro="${e.id}" aria-label="${troEsc((x.seen?"":"New: ")+e.name+(gn?", "+gn:"")+". "+e.rules[x.g-1]+". Earned "+troDate(x.at,true))}">
      ${x.seen?"":`<i class="tro-new" aria-hidden="true">New</i>`}${troHex(e,x.g,{lg:1})}
      <span class="tro-ft"><b class="tro-fn">${troEsc(e.name)}</b>
      <span class="tro-fm">${gn?`<em style="color:${gc}">${gn}</em> · `:""}${troDate(x.at)}</span>
      <small class="tro-fr">${troEsc(e.rules[x.g-1])}</small></span></button>`; };
  let feat;
  if(!top.length){ const e=troById("first");
    feat=`<div class="tro-feat one"><button class="tro-fc wide" data-tro="first" aria-label="First Session. Train once to earn it.">${troHex(e,0,{lg:1})}
      <span class="tro-ft"><b class="tro-fn">First Session</b><small class="tro-fr">Train once to earn it.</small></span></button></div>`; }
  else feat=`<div class="tro-feat${top.length===1?" one":""}">${top.map(x=>card(x,top.length===1)).join("")}</div>`;
  const cell=x=>{ const e=x.e, gn=troGname(e,x.gt);
    return `<button class="tro-cell" data-tro="${e.id}" aria-label="${troEsc(e.name+(gn?", "+gn:"")+": "+x.p.txt)}">
      ${troHex(e,0,{next:x.gt})}<b>${troEsc(e.name)}</b><small>${troEsc(x.p.txt)}</small>
      <span class="tro-bar" aria-hidden="true"><i style="width:${Math.round(x.p.f*100)}%;--c:${troCol(e,x.gt)}"></i></span></button>`; };
  b.innerHTML=`<div class="tro-v tro-main">${feat}
    <div class="tro-next"><span class="u-eyebrow">Next up</span><div class="tro-ng">${nx.map(cell).join("")}</div></div>
    <button class="u-btn primary block tro-allb" id="troAllB">All trophies</button></div>`;
  troSeen(top.map(x=>x.e.id));
  troWire(b,X);
  const btn=b.querySelector("#troAllB");
  if(btn) btn.onclick=()=>{ try{ Pulse.buzz(6); }catch(e){}
    const un=troFeatured().find(x=>!x.seen&&!top.some(t=>t.e.id===x.e.id));
    troGo("trophies",{page:"all",group:un?un.e.grp:"body"}); };
}
/* the All page: Body · Training · Lifts · Mind, a 4×3 grid */
function troUnseen(id){ const x=S.trophies&&S.trophies.got&&S.trophies.got[id]; return !!(x&&x.g>0&&x.seen===false); }
function troAll(b,o){
  const X=troX(), G=troGroups(), grp=G.some(g=>g[0]===o.group)?o.group:"body", list=troCat().filter(e=>e.grp===grp);
  const un=new Set(troCat().filter(e=>troUnseen(e.id)).map(e=>e.id)), gun=new Set(troCat().filter(e=>un.has(e.id)&&e.grp!==grp).map(e=>e.grp));
  const cell=e=>{ const g=troGot(e.id), gn=troGname(e,g), nw=un.has(e.id);
    if(g>0) return `<button class="tro-cell on" data-tro="${e.id}" aria-label="${troEsc((nw?"New: ":"")+e.name+(gn?", "+gn:"")+", earned")}">${nw?`<i class="tro-dot" aria-hidden="true"></i>`:""}${troHex(e,g)}<b>${troEsc(e.name)}</b><span class="tro-bar none" aria-hidden="true"></span></button>`;
    const p=troProg(e,X,1);
    return `<button class="tro-cell" data-tro="${e.id}" aria-label="${troEsc(e.name+": "+p.txt)}">${troHex(e,0,{next:1})}<b>${troEsc(e.name)}</b><span class="tro-bar" aria-hidden="true"><i style="width:${Math.round(p.f*100)}%;--c:${troCol(e,1)}"></i></span></button>`; };
  b.innerHTML=`<div class="tro-v tro-allv">
    <div class="u-seg tro-seg" role="tablist" aria-label="Trophy groups">${G.map(g=>`<button role="tab" data-grp="${g[0]}" aria-selected="${g[0]===grp}"${g[0]===grp?' class="on"':""}${gun.has(g[0])?` aria-label="${g[1]}, new"`:""}>${g[1]}${gun.has(g[0])?`<i class="tro-dot" aria-hidden="true"></i>`:""}</button>`).join("")}</div>
    <div class="tro-ag">${list.map(cell).join("")}</div></div>`;
  troSeen(list.filter(e=>troGot(e.id)>0).map(e=>e.id));
  troWire(b,X);
  b.querySelectorAll("[data-grp]").forEach(x=>x.onclick=()=>{ if(x.dataset.grp===grp) return; try{ Pulse.buzz(6); }catch(e){} o.group=x.dataset.grp; troAll(b,o); });
}
function troWire(b){ b.querySelectorAll("[data-tro]").forEach(x=>x.onclick=()=>{ try{ Pulse.buzz(6); }catch(e){} troDetail(x.dataset.tro); }); }
/* the detail sheet */
function troDetail(id){
  const e=troById(id); if(!e) return;
  const X=troX(), g=troGot(id), x=(S.trophies&&S.trophies.got&&S.trophies.got[id])||null, max=g>=e.n, gt=max?g:g+1, p=max?null:troProg(e,X,gt);
  const gn=troGname(e,g), gnt=troGname(e,gt);
  const gline=e.n>1&&g>0?`<span class="tro-sg" style="color:${troCol(e,g)}">${gn} · ${g} of ${e.n}</span>`:"";
  const rule=max?troEsc(e.rules[g-1]):(e.n>1?`<em style="color:${troCol(e,gt)}">${gnt}</em>: ${troEsc(troLc(e.rules[gt-1]))}`:troEsc(e.rules[0]));
  const stat=max?`<p class="tro-sd">Earned ${troDate(x&&x.at,true)}</p>`
    :`<div class="tro-sp"><span class="tro-bar" aria-hidden="true"><i style="width:${Math.round(p.f*100)}%;--c:${troCol(e,gt)}"></i></span><small>${troEsc(p.long||p.txt)}</small></div>`;
  const share=g>0?`<button class="u-btn primary block tro-shb" id="troShare">Share on your card</button>`:"";
  const html=`<div class="tro-sh">${troHex(e,g,{lg:1,next:gt})}<b class="tro-sn">${troEsc(e.name)}</b>${gline}<p class="tro-sr">${rule}</p>${stat}${share}</div>`;
  troSeen([id]);
  const wire=()=>{ const s=document.getElementById("troShare");
    if(s) s.onclick=()=>{ try{ Pulse.buzz(8); }catch(x){} try{ if(typeof evSheetClose==="function") evSheetClose(); }catch(x){} troGo("card",{tro:id}); }; };
  if(typeof evSheet==="function"){ evSheet(html,wire); }
  else toast(`${e.name} · ${max?"Earned":p.txt}`);
}
function troGo(v,o){ try{ if(typeof evGo==="function") return evGo(v,o); if(typeof openEvolve==="function") return openEvolve(v,o); }catch(e){ console.warn(e); } }
/* the room shows what was awarded; this says whether a check is owed: the save was never checked, or a grade is
   met but not yet awarded (the hub's check is skipped for 5 s after the last one). Comeback isn't judged here */
function troStale(){
  if(!(S.trophies&&S.trophies.bf)) return true;
  const X=troX();
  return troCat().some(e=>{ if(e.id==="comeback") return false; const g0=troGot(e.id); if(g0>=e.n) return false;
    let g=0; try{ g=troGrade(e,X); }catch(x){} return g>g0; });
}
function troRender(b,o){
  o=o||{};
  let stale=false; try{ stale=troStale(); }catch(e){}
  try{ if(o.page==="all") troAll(b,o); else troMain(b,o); }
  catch(e){ console.warn("Ossa: trophy room",e); b.innerHTML=`<p class="u-small">The trophy room didn't load. Close it and try again.</p>`; }
  /* deferred, so the view never emits: the check saves and emits only on change, and core's evolve listener
     re-renders the room (once; the next render finds nothing owed) */
  if(stale) setTimeout(()=>{ try{ troCheck("hub"); }catch(e){ console.warn(e); } },0);
}

/* ---------- preview seed (core calls it under ?evo=1 on a localhost demo save) ---------- */
function troDemoSeed(){
  try{
    const lh=typeof evPreviewOn==="function"?evPreviewOn():/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    if(!lh||!S.demo) return;
    S.dares=S.dares||{scale:1,tone:"coach"}; S.dares.won=12; S.dares.wxWon=2;
    if(!S.learn||typeof S.learn!=="object") S.learn={xp:0,done:{},days:{}};
    S.learn.done=S.learn.done||{};
    const ids=[].concat(...RD_UNITS.map(u=>(u.ls||[]).map(l=>l.id))).slice(0,5);
    ids.forEach((id,i)=>{ if(!S.learn.done[id]) S.learn.done[id]={at:dkey(12-i*2),best:100,n:1}; });
    save();
  }catch(e){ console.warn("Ossa: troDemoSeed",e); }
}

/* ---------- include time: the view, the hooks, the boot check ---------- */
(()=>{ try{
  if(typeof evView==="function") evView("trophies",{
    title:o=>o&&o.page==="all"?"All trophies":"Trophy room",
    act:o=>o&&o.page==="all"?"":troPill(),   // the count only on the main page, so "‹ Trophy room" fits on the All page
    render:(b,o)=>troRender(b,o)
  });
  vxOn("credit",C=>{ try{ if(!(S.trophies&&S.trophies.bf)) troPre(C); }catch(e){ console.warn("Ossa: trophy backfill",e); } });
  vxOn("workout",(rec,R)=>{ if(!R) return; const n=troCheck("workout",{rec,R}); R.ev=R.ev||{}; R.ev.tro=troNews(n); });
  vxOn("log",()=>{ const n=troCheck("log"); if(!n.length) return;
    const N=troNews(n), t=N.length>1?`${N.length} new trophies · see Evolve`:N[0].up?`Trophy upgraded · ${N[0].name} · ${N[0].gname}`:`New trophy · ${N[0].name}`;
    setTimeout(()=>{ try{ toast(t); }catch(e){} },1800); });
  /* Phase 6: a dare done (weather dares count towards Weatherproof, every dare towards Grit Master). The check runs
     at once: "done" comes only from the engine's actions and deferred listeners (drFinish, after its save), never
     from a render, and an already queued deferred check (the "aura" one, when breathing is the last row) would
     otherwise award Weatherproof silently first. Only the toast waits, 1.8 s after the dare's own "Dare done."
     toast, so it replaces it rather than fighting it */
  vxOn("dare",m=>{ if(!m||m.st!=="done") return;
    try{ const N=troNews(troCheck("dare")); if(!N.length) return;
      const t=N.length>1?`${N.length} new trophies · see Evolve`:N[0].up?`Trophy upgraded · ${N[0].name} · ${N[0].gname}`:`New trophy · ${N[0].name}`;
      setTimeout(()=>{ try{ toast(t); }catch(e){} },1800);
    }catch(e){ console.warn("Ossa: trophy dare",e); } });
  vxOn("aura",()=>setTimeout(()=>troCheck("aura"),0));
  vxOn("day",()=>setTimeout(()=>troCheck("day"),0));
  vxOn("evolve",m=>{ if(m&&m.what==="trophy") return; setTimeout(()=>troCheck("evolve"),0); });
  setTimeout(()=>{ try{ if(S&&S.body) troCheck("boot"); }catch(e){ console.warn("Ossa: trophy boot",e); } },1500);
}catch(e){ console.warn("Ossa: trophy.js",e); } })();
