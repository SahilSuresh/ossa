/* =========================================================
   AURA aura (Ossa 2.0, Phase 3 "Focus"): the data side of the aura. Owner: package P1. Prefix au*.
   Included after widget.js, before halo.js, monk.js, heartbeat.js and focus.js.

   Start-up rule: function declarations only, no top-level const or let; state on function
   properties; never redeclare a name that web/ossa.html or another web/ui file declares.
   The only code that runs at include time is the migration call and the rdBrFinish wrapper
   at the bottom (every ossa.html const is ready by then; boot runs after the includes).

   Currencies: aura is for the mind: breathing, focus, and since 19 Oct Learn's lessons too (rank.js wraps
   rdAward; there's no separate Learn level any more). RP stays muscles only. Heartbeat itself earns nothing; its "Breathe with it" earns breathing aura.

   RULES (auRules)
   breathing   2 aura a whole minute (minutes clamped to the planned length, paused time left out)
               +2 for finishing; at most 30 a day from breathing (Breathe tool, Calm, Heartbeat)
   Monk Mode   1 aura a whole minute (floored, at least 1 to log) +2 × planned minutes for finishing;
               at most 400 a day. A session counts on the day it ended.
   curve       XP to reach level n: T(n) = (n−1)(11n+50); the step from L to L+1 is 22L+50
               L2 72 · L3 166 · L4 282 · L5 420 · L10 1440 · L14 2652 · L15 3010 · L16 3390
   levels never drop: S.aura.lv is the highest level reached, and the running total S.aura.xp
   is the record (it is not summed from the log, so pruning the log never lowers a level).
   Only level 15 is named: "Crystalline aura" (cosmetic). No other stage names.

   DATA (S, saved on the phone)
   S.aura {v:1 (migration stamp, set last), xp:int ≥0, lv:int (max ever), seen:int (last level
           shown or celebrated), days:{'YYYY-MM-DD':{breath:int, monk:int}} (XP per source per
           day, 120 days, for the caps), since:'YYYY-MM-DD', seed?:int (XP seeded from past
           minutes), demo?:1 (demo sessions seeded)}
   S.mind.log entries (old readers use d, k and min only; kept 400 days):
           {d, k:'breath'|'focus', min:int ≥1, at?:ms end, plan?:min, full?:bool, xp?:int (its
            presence means awarded: the idempotence guard), capped?:1, seed?:1, src?:'tool'|'calm'|
            'beat'|'monk', pat?:'even'|'box'|'exhale'|'478', calm?:'float'|'deep'|'drift',
            id?:ms (Monk run id = start ms), task?:string ≤80 (Monk only; never sent to track)}

   API
   auRules()               the numbers above, for the "How aura works" sheet
   auXpFor(n)              XP to reach level n
   auLevel(xp)             {n, a:T(n), b:T(n+1), f (0–1), to:b−xp}
   auLv()                  int ≥1: max(S.aura.lv, auLevel(S.aura.xp).n). SIDE-EFFECT FREE (never
                           migrates, seeds or saves), so halo.js can call it inside GL draws
   auState()               S.aura, migrated and demo-seeded on demand (UI paths only)
   auView()                {lv, xp, a, b, f, to, into, span, next, crystal, stage, fresh, line, aria}
                           line: "Aura level 14 · 320 aura to level 15"; aria: "Aura level 14: 38 of 358 aura"
   auStage(lv)             {crystal, at:15, name, pill, g (0–1 look growth from level 2 to 14)}
   auPreview(kind, min)    kind 'breath'|'monk': {xp, raw, capped, left, txt ("+12 aura" | "Max today")}
   auLeft(kind, d?)        XP still to earn today (or on day d) from that source
   auSay(r)                "+12 aura" · "+6 aura, today's max" · "You've had today's 30 breathing aura"
   auAward(e)              award one log entry (already pushed): caps, save, track('aura_xp'),
                           vxEmit('aura', r, e). Returns r or null. Never celebrates.
                           r = {xp, raw, base, bonus, capped, key:'breath'|'monk', src, d, lv0, lv, up, crystal}
   auLogFocus(run,full,now) the ONLY Monk award path: pushes {k:'focus'} for the day it ended,
                           deduped on run.id → {e, r} | {e:dup, r:null, dup:true} | null (<1 min)
   auBreathDone(e, meta)   the Calm hook in ossa.html startBreathing (meta {src,calm,pat,plan,full});
                           idempotent; celebrates a level-up itself (toast + haptic)
   auSeen()                S.aura.seen = lv (call after showing a level-up anywhere)
   auCelebrate(r, pre?)    on r.up: toast "Aura level N" (+ " · Crystalline aura"), hap('success'), auSeen()
   auToday(d?)             {d, breath:{n,min,xp}, focus:{n,min,xp}, xp, left:{breath,monk},
                           workouts:[{title,mins,sets,rp}], rp, tasks:[string]} (escape tasks before use)
   auLast()                whole days since the newest breathing or focus entry, or null
   auDemo()                the demo's sessions: exactly 2690 aura = "Aura level 14 · 320 aura to level 15"

   Hooks: vxEmit('aura', r, e) after every award (e is null for the demo seed). track('aura_xp',
   {xp, src, lv}) — never task text, never a heart rate.
   Wraps: rdBrFinish (the Breathe tool): leaves paused and away time out, clamps minutes to the
   plan, takes the technique from the running pattern, reads the one-shot RDBR.src ('beat' from
   Heartbeat; default 'tool'), and shows the aura on the cue, or a toast on the quiet path.
   ========================================================= */

/* ---------- rules and the curve (pure) ---------- */
function auRules(){
  return auRules.r||(auRules.r={br:{perMin:2,fin:2,cap:30},mk:{perMin:1,finX:2,cap:400,pre:[25,50,90]},crystal:15,daysKeep:120,logDays:400});
}
function auXpFor(n){ n=Math.max(1,Math.floor(+n||1)); return (n-1)*(11*n+50); }
function auLevel(xp){
  xp=Math.max(0,Math.floor(+xp||0));
  let n=Math.max(1,Math.floor((Math.sqrt(3721+44*xp)-39)/22+1e-9));
  while(n>1&&auXpFor(n)>xp) n--;
  while(auXpFor(n+1)<=xp) n++;
  const a=auXpFor(n), b=auXpFor(n+1);
  return {n,a,b,f:(xp-a)/(b-a),to:b-xp};
}
function auStage(lv){
  const at=auRules().crystal, n=Math.max(1,Math.floor(+lv||1)), crystal=n>=at;
  return {crystal,at,name:crystal?"Crystalline aura":"",pill:crystal?"Crystalline aura":`Crystalline aura at level ${at}`,
    g:n<2?0:Math.min(1,(n-1)/(at-2))};
}
function auKind(k){ return k==="monk"||k==="focus"?"monk":k==="breath"||k==="breathe"?"breath":null; }
function auKey(e){ return e&&e.k==="breath"?"breath":e&&e.k==="focus"?"monk":null; }   // a log entry's cap bucket
function auDay(ms){
  const t=new Date(+ms||Date.now());
  return t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0");
}
/* the aura an entry is worth before the daily cap: {base, bonus} */
function auRaw(e){
  const R=auRules(), plan=+e.plan>0?+e.plan:0, m=Math.max(0,plan?Math.min(+e.min||0,plan):(+e.min||0));
  if(e.k==="focus") return {base:Math.floor(m)*R.mk.perMin,bonus:e.full&&plan?R.mk.finX*plan:0};
  return {base:R.br.perMin*Math.round(m),bonus:e.full?R.br.fin:0};
}

/* ---------- migration (include time, and lazily from auState). S, dkey and the pure functions only ---------- */
function auMigrate(){
  let dirty=false, A=S.aura;
  if(!A||typeof A!=="object"||Array.isArray(A)){ A=S.aura={xp:0,lv:1,seen:1,days:{}}; dirty=true; }
  if(!A.days||typeof A.days!=="object"||Array.isArray(A.days)){ A.days={}; dirty=true; }
  const x=Math.max(0,Math.floor(+A.xp||0)); if(x!==A.xp){ A.xp=x; dirty=true; }
  if(!(A.v>=1)){
    /* once: past breathing and focus minutes count (minutes only, no finishing bonus, each day's caps) */
    const R=auRules(), L=S.mind&&Array.isArray(S.mind.log)?S.mind.log:[]; let seeded=0;
    L.forEach(e=>{
      if(!e||typeof e!=="object"||e.xp!=null||typeof e.d!=="string"||!(+e.min>0)) return;
      const key=auKey(e); if(!key) return;
      const raw=key==="breath"?R.br.perMin*Math.round(+e.min):R.mk.perMin*Math.floor(+e.min);
      const D=A.days[e.d]||(A.days[e.d]={breath:0,monk:0}), cap=key==="breath"?R.br.cap:R.mk.cap;
      const xp=Math.max(0,Math.min(raw,cap-(+D[key]||0)));
      e.xp=xp; e.seed=1; if(xp<raw) e.capped=1;
      D[key]=(+D[key]||0)+xp; A.xp+=xp; seeded+=xp;
    });
    A.lv=Math.max(Math.floor(+A.lv)||1,auLevel(A.xp).n); A.seen=A.lv;   // nothing to celebrate
    if(!A.since) A.since=dkey(0); if(seeded) A.seed=seeded;
    A.v=1; dirty=true;                                                 // last: a throw re-runs next launch
  }
  const n=auLevel(A.xp).n;
  if(!(Math.floor(+A.lv)>=n)){ A.lv=Math.max(n,Math.floor(+A.lv)||1); dirty=true; }
  if(!(+A.seen>=0)||A.seen>A.lv){ A.seen=A.lv; dirty=true; }
  const cut=dkey(auRules().daysKeep);
  Object.keys(A.days).forEach(d=>{ if(d<cut){ delete A.days[d]; dirty=true; } });
  return dirty;
}
function auState(){
  if(!S.aura||typeof S.aura!=="object"||!(S.aura.v>=1)){
    try{ if(auMigrate()) save(); }catch(e){ console.warn("Ossa: aura migration",e); }
    if(!S.aura||typeof S.aura!=="object") S.aura={v:1,xp:0,lv:1,seen:1,days:{}};
    if(!S.aura.days||typeof S.aura.days!=="object") S.aura.days={};
  }
  if(S.demo&&!S.aura.demo){ try{ auDemo(); }catch(e){ console.warn("Ossa: aura demo",e); } }
  return S.aura;
}

/* ---------- reading (auLv never writes) ---------- */
function auLv(){
  try{
    const A=S.aura; let n=1;
    if(A&&typeof A==="object") n=Math.max(Math.floor(+A.lv)||1,auLevel(A.xp).n);
    /* Load demo swaps S without a reload; until a screen seeds it, report the level it will have */
    if(S.demo&&!(A&&A.demo)){ if(auLv.dx==null) auLv.dx=auDemoXp(); n=Math.max(n,auLevel(((A&&+A.xp)||0)+auLv.dx).n); }
    return n;
  }catch(e){ return 1; }
}
function auView(){
  const A=auState(), xp=Math.max(0,Math.floor(+A.xp||0)), lv=Math.max(Math.floor(+A.lv)||1,auLevel(xp).n);
  const a=auXpFor(lv), b=auXpFor(lv+1), span=b-a, into=Math.max(0,Math.min(span,xp-a)), to=Math.max(0,b-xp);
  return {lv,xp,a,b,f:span?into/span:0,to,into,span,next:lv+1,crystal:lv>=auRules().crystal,stage:auStage(lv),
    fresh:(+A.seen||0)<lv,seen:+A.seen||0,seed:+A.seed||0,
    line:`Aura level ${lv} · ${to} aura to level ${lv+1}`,aria:`Aura level ${lv}: ${into} of ${span} aura`};
}
function auLeft(kind,d){
  const key=auKind(kind); if(!key) return 0;
  const R=auRules(), A=auState(), D=A.days[d||dkey(0)]||{};
  return Math.max(0,(key==="breath"?R.br.cap:R.mk.cap)-(+D[key]||0));
}
function auPreview(kind,min){
  const key=auKind(kind), m=Math.max(1,Math.round(+min||0));
  if(!key) return {xp:0,raw:0,capped:false,left:0,txt:""};
  const w=auRaw({k:key==="monk"?"focus":"breath",min:m,plan:m,full:true}), raw=w.base+w.bonus;
  const left=auLeft(key), xp=Math.max(0,Math.min(raw,left));
  return {xp,raw,capped:xp<raw,left,txt:xp>0?`+${xp} aura`:"Max today"};
}
function auSay(r){
  if(!r) return "";
  const xp=Math.max(0,Math.floor(+r.xp||0)), R=auRules();
  if(xp>0) return `+${xp} aura${r.capped?", today's max":""}`;
  if(r.capped) return r.key==="monk"?`You've had today's ${R.mk.cap} lock-in aura`:`You've had today's ${R.br.cap} breathing aura`;
  return "";
}
function auToday(d){
  d=d||dkey(0);
  const A=auState(), D=A.days[d]||{}, L=(S.mind&&Array.isArray(S.mind.log))?S.mind.log:[];
  const pick=k=>{ const a=L.filter(l=>l&&l.d===d&&l.k===k);
    return {n:a.length,min:Math.round(a.reduce((s,l)=>s+(+l.min||0),0)),xp:a.reduce((s,l)=>s+(+l.xp||0),0)}; };
  const W=(Array.isArray(S.workouts)?S.workouts:[]).filter(w=>w&&w.d===d).map(w=>({title:w.title||"Workout",mins:Math.round(+w.mins||0),sets:Math.round(+w.sets||0),
    rp:Math.round(Object.values(w.rp&&typeof w.rp==="object"?w.rp:{}).reduce((s,v)=>s+(+v||0),0))}));
  return {d,breath:pick("breath"),focus:pick("focus"),xp:(+D.breath||0)+(+D.monk||0),left:{breath:auLeft("breath",d),monk:auLeft("monk",d)},
    workouts:W,rp:W.reduce((s,w)=>s+w.rp,0),tasks:L.filter(l=>l&&l.d===d&&l.k==="focus"&&typeof l.task==="string"&&l.task).map(l=>l.task)};
}
function auLast(){
  const L=(S.mind&&Array.isArray(S.mind.log))?S.mind.log:[]; let d="";
  L.forEach(l=>{ if(l&&(l.k==="breath"||l.k==="focus")&&typeof l.d==="string"&&l.d>d) d=l.d; });
  if(!d) return null;
  const p=s=>{ const [y,m,x]=s.split("-").map(Number); return new Date(y,m-1,x).getTime(); };
  return Math.max(0,Math.round((p(dkey(0))-p(d))/864e5));
}

/* ---------- awarding: one path for every source ---------- */
/* the quiet step: caps and totals only (no save, no events). Idempotent through e.xp */
function auAdd(e){
  const A=S.aura;
  if(!A||!A.days||!e||typeof e!=="object"||e.xp!=null||!(+e.min>0)) return null;
  const key=auKey(e); if(!key) return null;
  const R=auRules(), cap=key==="breath"?R.br.cap:R.mk.cap;
  const d=typeof e.d==="string"&&e.d?e.d:(e.d=dkey(0));
  const D=A.days[d]||(A.days[d]={breath:0,monk:0});
  const w=auRaw(e), raw=w.base+w.bonus, xp=Math.max(0,Math.min(raw,cap-(+D[key]||0)));
  const lv0=Math.max(Math.floor(+A.lv)||1,auLevel(A.xp).n);
  e.xp=xp; if(xp<raw) e.capped=1;
  D[key]=(+D[key]||0)+xp; A.xp=Math.max(0,Math.floor(+A.xp||0))+xp; auUnseen(xp,e.src||key,e.min);
  A.lv=Math.max(lv0,auLevel(A.xp).n);
  const base=Math.min(xp,w.base), src=/^[a-z]{2,12}$/.test(String(e.src||""))?e.src:key;
  return {xp,raw,base,bonus:xp-base,capped:xp<raw,key,src,d,lv0,lv:A.lv,up:A.lv>lv0,crystal:lv0<R.crystal&&A.lv>=R.crystal};
}
/* aura earned since the Body page last showed it (the gain animation, aurabody.js). src names it ("50 MIN LOCKED IN") */
function auUnseen(n,src,min){
  try{ const A=S.aura; if(!A||!(n>0)) return; A.unseen=(+A.unseen||0)+n;
    const t=src==="monk"&&min?`${min} min locked in`:src==="monk"?"locked in":src==="calm"||src==="breath"||src==="box"||src==="even"?"breathing":String(src||"");
    A.unseenSrc=A.unseenSrc&&A.unseenSrc!==t?"several wins":t; }catch(e){}
}
/* a grant outside the daily caps (19 Oct): Eyes directives, the nightly report, a won stake, clean days, an urge beaten.
   Levels follow the xp both ways (auLvOf), never a ratchet, so a relapse can take a level away. */
function auLvOf(xp){ return auLevel(xp).n; }
function auGrant(n,src){
  const A=auState(); n=Math.max(0,Math.round(+n||0)); if(!n) return null;
  const lv0=auLvOf(A.xp); A.xp=Math.max(0,Math.floor(+A.xp||0))+n; A.lv=Math.max(Math.floor(+A.lv)||1,auLvOf(A.xp));
  auUnseen(n,src); save();
  try{ vxEmit("aura",{xp:n,src:src||"grant",lv0,lv:A.lv,up:A.lv>lv0},null); }catch(e){}
  return {xp:n,lv0,lv:A.lv,up:A.lv>lv0};
}
/* losing aura. floor:true (a broken lock-in's stake) stops at the start of the current level; otherwise (a relapse)
   the level follows the xp down. A.lost/A.lostSrc feed the red flicker on Body. */
function auraLose(n,o){
  const A=auState(); n=Math.max(0,Math.round(+n||0)); const lv0=auLvOf(A.xp), xp0=Math.floor(+A.xp||0);
  let xp=Math.max(0,xp0-n); if(o&&o.floor) xp=Math.max(xp,auXpFor(lv0));
  A.xp=xp; A.lv=auLvOf(xp); A.seen=Math.min(+A.seen||A.lv,A.lv);
  const lost=xp0-xp; if(lost>0){ A.lost=(+A.lost||0)+lost; A.lostSrc=(o&&o.src)||""; A.lostLv=lv0>A.lv?lv0:0; }
  save(); try{ vxEmit("aura",{xp:-lost,src:(o&&o.src)||"loss",lv0,lv:A.lv,down:A.lv<lv0},null); }catch(e){}
  return {lost,lv0,lv:A.lv,down:A.lv<lv0};
}
function auKeep(){
  const R=auRules(), A=S.aura;
  if(A&&A.days){ const cut=dkey(R.daysKeep); Object.keys(A.days).forEach(d=>{ if(d<cut) delete A.days[d]; }); }
  const L=S.mind&&S.mind.log;
  if(Array.isArray(L)){ const cut=dkey(R.logDays); for(let i=L.length-1;i>=0;i--){ const l=L[i]; if(l&&typeof l.d==="string"&&l.d<cut) L.splice(i,1); } }
}
function auAward(e){
  auState();
  const r=auAdd(e); if(!r) return null;
  auKeep(); save();
  try{ if(typeof track==="function") track("aura_xp",{xp:r.xp,src:r.src,lv:r.lv}); }catch(x){}
  try{ if(typeof vxEmit==="function") vxEmit("aura",r,e); }catch(x){}
  return r;
}
/* Monk Mode: the only award path. A run is {id:start ms, start, plan, task?} */
function auLogFocus(run,full,now){
  if(!run||typeof run!=="object"||!(+run.plan>0)) return null;
  const start=+run.start||+run.id||0; if(!start) return null;
  const id=run.id!=null?run.id:start, M=mindState();
  const dup=M.log.find(l=>l&&l.k==="focus"&&l.id!=null&&String(l.id)===String(id));
  if(dup) return {e:dup,r:null,dup:true};
  const plan=Math.round(+run.plan), endP=start+plan*60000, end=full?endP:Math.min(+now||Date.now(),endP);
  const min=full?plan:Math.min(plan,Math.floor(Math.max(0,end-start)/60000));
  if(min<1) return null;
  const e={d:auDay(end),k:"focus",min,plan,full:!!full,at:end,id,src:"monk"};
  const t=typeof run.task==="string"?run.task.trim().slice(0,80):""; if(t) e.task=t;
  M.log.push(e);
  return {e,r:auAward(e)};
}
/* Calm (startBreathing in ossa.html) pushes e, then calls this. Idempotent */
function auBreathDone(e,meta){
  if(!e||typeof e!=="object") return null;
  if(e.xp!=null) return {xp:+e.xp||0,raw:+e.xp||0,base:+e.xp||0,bonus:0,capped:!!e.capped,key:"breath",src:e.src||"calm",d:e.d,lv0:auLv(),lv:auLv(),up:false,crystal:false,dup:true};
  const m=meta&&typeof meta==="object"?meta:{}, plan=+m.plan>0?Math.round(+m.plan):0;
  if(plan){ e.plan=plan; e.min=Math.max(1,Math.min(Math.round(+e.min||0)||1,plan)); }
  if(!e.at) e.at=Date.now();
  e.full=!!m.full; if(m.pat) e.pat=String(m.pat); e.src=m.src?String(m.src):"calm"; if(m.calm) e.calm=String(m.calm);
  const r=auAward(e);
  if(r&&r.up) auCelebrate(r);
  return r;
}
function auSeen(){ const A=auState(); if(A.seen!==A.lv){ A.seen=A.lv; save(); } return A.lv; }
function auCelebrate(r,pre){
  if(!r||!r.up) return;
  const t=`Aura level ${r.lv}${r.crystal?" · Crystalline aura":""}`;
  try{ if(typeof toast==="function") toast(pre?`${pre} · ${t}`:t); }catch(e){}
  try{ if(typeof hap==="function") hap("success"); }catch(e){}
  auSeen();
}

/* ---------- demo: 30 days of Monk Mode and breathing, today left empty ---------- */
function auDemoPlan(){
  const out=[], T=["Draft the report intro","Plan the week","Read two chapters","Clear the inbox","Sketch the new screen","Revise for the exam"], P=["box","even","exhale","478"];
  for(let i=30;i>=1;i--){
    const d=dkey(i), [y,mo,da]=d.split("-").map(Number), at=(h,mi)=>new Date(y,mo-1,da,h,mi).getTime();
    if(i%3){ const n=i%6===1?10:5; out.push({d,k:"breath",min:n,plan:n,full:true,at:at(7,30+n),pat:P[i%4],src:"tool"}); }
    if(i%7){ const p=i%5?25:50, st=at(9,0); out.push({d,k:"focus",min:p,plan:p,full:true,at:st+p*60000,id:st,src:"monk",task:T[i%T.length]}); }
  }
  return out;
}
function auDemoXp(){
  const R=auRules(), D={}; let xp=0;
  auDemoPlan().forEach(e=>{ const key=auKey(e), w=auRaw(e), b=D[e.d+key]||0, cap=key==="breath"?R.br.cap:R.mk.cap, x=Math.max(0,Math.min(w.base+w.bonus,cap-b)); D[e.d+key]=b+x; xp+=x; });
  return xp;
}
function auDemo(){
  const A=S.aura; if(!A||typeof A!=="object"||A.demo) return;
  A.demo=1;                                  // first: mindState() saves, and nothing may re-enter
  const M=mindState();                       // seeds the demo check-ins
  auDemoPlan().forEach(e=>{ M.log.push(e); auAdd(e); });
  M.log.sort((a,b)=>{ const x=(a&&a.d)||"", y=(b&&b.d)||""; return x<y?-1:x>y?1:((a&&+a.at)||0)-((b&&+b.at)||0); });
  A.seen=A.lv; save();
  const lv=A.lv; setTimeout(()=>{ try{ if(typeof vxEmit==="function") vxEmit("aura",{xp:0,raw:0,base:0,bonus:0,capped:false,key:null,src:"demo",lv0:lv,lv,up:false,crystal:false,demo:true},null); }catch(e){} },0);
}

/* ---------- the Breathe tool: XP on its cue, or a toast when it ends quietly ---------- */
function auPatOf(P){ try{ return Object.keys(BREATHS).find(k=>BREATHS[k]===P)||null; }catch(e){ return null; } }
function auCue(r,quiet){
  const say=auSay(r);
  if(quiet){ if(r.up) auCelebrate(r,"Breathing logged"); else if(r.xp>0&&typeof toast==="function") toast(`Breathing logged · ${say}`); return; }
  const cu=document.getElementById("brCue");
  if(cu&&say){
    cu.insertAdjacentHTML("beforeend",`<small class="br-xp" style="display:block;margin-top:4px;font-family:var(--body);font-size:var(--fs-2);font-weight:600;letter-spacing:0;text-transform:none;color:var(--cyan)">${say}</small>`);
    cu.dataset.v="";   // the idle frame would otherwise wipe the finish cue at once; rdBrFinish's own 4 s timer clears it
  } else if(say&&typeof toast==="function") toast(say);
  if(r.up) auCelebrate(r);
}
(()=>{ if(typeof rdBrFinish!=="function") return;
  const _f=rdBrFinish;
  rdBrFinish=function(full,quiet){
    const R=typeof RDBR!=="undefined"&&RDBR.run; if(!R) return _f.apply(this,arguments);
    let src="tool", M=null, n0=0, plan=1, pat=null;
    try{
      if(RDBR.src){ src=/^[a-z]{2,12}$/.test(String(RDBR.src))?String(RDBR.src):"tool"; } RDBR.src=null;   // one-shot ('beat' from Heartbeat)
      const now=performance.now();
      if(RDBR.pause) R.t0+=now-(+R.pAt||+RDBR.pause);                     // paused time isn't breathing
      if(+R.total>0) R.t0=Math.max(R.t0,now-R.total*1000);                // nor is time away past the end
      plan=Math.max(1,Math.round((+R.total||60)/60)); pat=auPatOf(R.P);
      M=mindState(); n0=M.log.length;
    }catch(e){ console.warn("Ossa: aura",e); }
    const out=_f.apply(this,arguments);
    try{
      if(M&&M===S.mind&&M.log.length>n0){
        const e=M.log[M.log.length-1];
        if(e&&e.k==="breath"&&e.xp==null){
          e.min=Math.max(1,Math.min(Math.round(+e.min||0)||1,plan));
          e.at=Date.now(); e.plan=plan; e.full=!!full; if(pat) e.pat=pat; e.src=src;
          const r=auAward(e); if(r) auCue(r,!!quiet);
        }
      }
      /* a short session (nothing logged, no aura) keeps its finish cue too: the idle frame would wipe it at once (BUG-21) */
      if(!quiet){ const cu=document.getElementById("brCue"); if(cu&&cu.dataset.v==="x") cu.dataset.v=""; }
    }catch(e){ console.warn("Ossa: aura",e); }
    return out;
  };
})();

/* migrate at include time (after every ossa.html const, before boot) */
try{ if(auMigrate()) save(); if(S.demo&&S.aura&&!S.aura.demo) auDemo(); }catch(e){ console.warn("Ossa: aura migration",e); }
