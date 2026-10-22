/* =========================================================
   VESSEL — the body's engine (Ossa 2.0, Phase 1)
   One owner for: saved-state migration, rank points (RP), the workout record and the lifetime
   tally, the one neglect rule (fading), recovery, sore-spot flags and the hooks later phases use.
   Phase 5: bonusL/bonus on credit; the rpBonus provider (vxBonusL, path.js's +10% on matching sets).
   Included FIRST of the web/ui files (before shell.js).

   Start-up rules (read before adding anything here):
   - vxMigrate runs in web/ossa.html right after the loader, and mkItem/stateOf run while the
     legacy code builds TR (let TR=… in ossa.html). Both happen BEFORE this file's top-level code.
     So everything they can reach is a hoisted function declaration that keeps its state on
     function properties (fn.cache), never in a top-level const/let here (that is a TDZ error
     that blanks the app). Only the IIFE wrappers at the bottom run at include time.
   - Never redeclare an ossa.html const (EXW, SEC, sessionsN, NEGLECT_DAYS, rankIx, overall…).
   - A later web/ui file that declares the same function name wins over this one, so edit the
     owner's file instead of overriding these.

   Data (S, saved on the phone):
   S.ver 2, S.verAt ms               version stamp (migration sets it last)
   S.tally {n,sets,mins,vol,rp,since,est?}  lifetime counts; sessionsN() = max(tally.n, workouts)
   S.rpCarry {k: -0.5..0.5}          the signed RP remainder, so S.scores stay whole numbers
   S.workouts [{d,title,mins,sets,vol,t,end,kind,ex:[{n,k,s,r?,kg?,top?,hold?,mob?}],rp:{k:int},ld?:{k:num}}]
                                     400 days by date; past the newest 120 they drop ex and ld
   S.spots [{id,kind:'m'|'j',side:'l'|'r'|'b',at:'YYYY-MM-DD',off:null|'YYYY-MM-DD'}]
                                     sore spots ("Flagged"). side is the user's own side
   localStorage 'corpus-v4-pre2'     a one-time raw copy of the pre-2.0 save
   localStorage 'corpus-v4-bad'      a save the loader rejected, kept instead of lost
   ========================================================= */

/* ---------------------------------------------------------
   1. MIGRATION (called once from ossa.html, right after the loader; literals only)
   --------------------------------------------------------- */
function vxTallyFrom(W){
  W=Array.isArray(W)?W:[];
  const sum=f=>W.reduce((a,w)=>a+(+((w||{})[f])||0),0);
  const T={n:W.length,sets:Math.round(sum("sets")),mins:Math.round(sum("mins")),vol:Math.round(sum("vol")),rp:0,since:(W[0]&&W[0].d)||null};
  if(W.length>=90) T.est=true;   // the old list stopped at 90, so the true count is unknowable
  return T;
}
function vxMigrate(){
  if(!S||typeof S!=="object") return;
  let dirty=false; const now=Date.now();
  if(!(S.ver>=2)){
    /* a one-time raw copy of what was on the phone before 2.0 */
    try{ if(typeof S_RAW==="string"&&S_RAW&&localStorage.getItem(KEY+"-pre2")==null) localStorage.setItem(KEY+"-pre2",S_RAW); }catch(e){ console.warn("Ossa: pre-2.0 copy skipped",e); }
    /* every logged muscle gets a time, never in the future (BUG-10) */
    (S.log||[]).forEach(e=>{ if(!e||!e.m||!e.d) return; e.h=e.h||{};
      const [Y,M,D]=String(e.d).split("-").map(Number), t=Math.min(now,new Date(Y,M-1,D,18,0).getTime());
      Object.keys(e.m).forEach(k=>{ if(e.m[k]>0&&!(e.h[k]>0)) e.h[k]=t; else if(e.h[k]>now) e.h[k]=now; }); });
    if(!S.tally||typeof S.tally!=="object") S.tally=vxTallyFrom(S.workouts);
    S.scores=S.scores||{};
    GLORDER.forEach(k=>{ S.scores[k]=Math.max(0,Math.min(100,Math.round(+S.scores[k]||0))); });
    S.ver=2; S.verAt=now; dirty=true;   // the stamp goes on last: a throw above simply re-runs next launch
  }
  /* the level (18 Oct): lifetime rank points. A tally from before they were counted gets the best estimate once:
     the points in the workout records, or at least what the muscles hold now; never lower than what it has */
  try{ const T=vxTally(); if(!T.rpOk){
      const fromW=(S.workouts||[]).reduce((a,w)=>a+Object.values((w&&w.rp)||{}).reduce((x,y)=>x+(+y||0),0),0), held=GLORDER.reduce((a,k)=>a+(+((S.scores||{})[k])||0),0);
      T.rp=Math.max(+T.rp||0,fromW,held); T.rpOk=1; dirty=true; } }catch(e){ console.warn("Ossa: level migration",e); }
  /* every launch: fill what's missing, and forget cleared sore spots after 60 days */
  if(!S.tally||typeof S.tally!=="object"){ S.tally=vxTallyFrom(S.workouts); dirty=true; }
  ["n","sets","mins","vol","rp"].forEach(f=>{ if(typeof S.tally[f]!=="number"){ S.tally[f]=+S.tally[f]||0; dirty=true; } });
  if(!S.rpCarry||typeof S.rpCarry!=="object"||Array.isArray(S.rpCarry)){ S.rpCarry={}; dirty=true; }
  if(!Array.isArray(S.spots)){ S.spots=[]; dirty=true; }
  const cut=dkey(60), n0=S.spots.length;
  S.spots=S.spots.filter(f=>f&&f.id&&(f.kind==="m"||f.kind==="j")&&(!f.off||f.off>=cut));
  if(S.spots.length!==n0) dirty=true;
  if(dirty) save();
}
function vxTally(){ if(!S.tally||typeof S.tally!=="object") S.tally=vxTallyFrom(S.workouts); return S.tally; }

/* ---------------------------------------------------------
   2. RANK POINTS
   EXW (ossa.html) gives each exercise its canonical primary and helper weights.
   An item picked for muscle k (mkItem's primary) credits k at 100%. If k isn't the
   exercise's canonical primary, that primary becomes a 60% helper (slot credit).
   Stretches, mobility items and posture drills earn no RP and no recovery load.
   --------------------------------------------------------- */
function vxStretchSet(){
  if(vxStretchSet.full) return vxStretchSet.full;
  const st=new Set(), lift=new Set(); let full=true;
  const addSt=a=>{ if(a&&a[0]) st.add(a[0]); };
  Object.values(MX).forEach(x=>{ (x.stretch||[]).forEach(addSt); addSt(x.mob); (x.lv||[]).forEach(a=>lift.add(a[0])); });
  Object.values(MUSCLES).forEach(m=>(m.ex||[]).forEach(a=>lift.add(a[0])));
  Object.keys(EXW).forEach(n=>{ if(!EXW[n][2]) lift.add(n); });
  /* posture drills and joint routines (declared later than the boot-time TR build, so read them carefully) */
  try{ Object.values(PS_MOVES).forEach(l=>l.forEach(addSt)); }catch(e){ full=false; }
  try{ Object.values(JOINT_RELIEF).forEach(R=>((R&&R.m)||[]).forEach(addSt)); }catch(e){ full=false; }
  /* a name that is also a training item stays a lift, unless it says it's a stretch ("Dead hang" stays a lift) */
  lift.forEach(n=>{ if(!/stretch/i.test(n)) st.delete(n); });
  if(full) vxStretchSet.full=st;
  return st;
}
function vxIsStretch(name){
  if(!name) return false;
  const r=EXW[name]; if(r) return !!r[2];
  if(vxStretchSet().has(name)) return true;
  /* names not in EXW: trust exInfo (22 Oct, BUG-14). "Supported deep squat hold" is a mobility fix, not a lift. */
  try{ const info=typeof exInfo==="function"?exInfo(name):null; if(info&&info.type==="mobility") return true; }catch(e){}
  return false;
}
/* weights for one exercise done for muscle ctx: {muscle: 0..1}, ctx always 1 */
function vxW(name,ctx){
  if(vxIsStretch(name)) return {};
  const r=EXW[name];
  if(!r) return ctx?{[ctx]:1}:{};
  const w={...r[1]}, p=ctx||r[0];
  if(p!==r[0]) w[r[0]]=Math.max(w[r[0]]||0,0.6);   // slot credit: the exercise's own primary becomes a 60% helper
  w[p]=1;
  return w;
}
/* the session item. Helpers are listed strongest first (screens show the top two) */
function mkItem(name,dose,primary){
  const {sets,target}=parseDose(dose||""), w=vxW(name,primary), own=(EXW[name]||[])[0]; delete w[primary];
  return {name,dose,sets,target,primary,sec:Object.keys(w).sort((a,b)=>w[b]-w[a]||(b===own)-(a===own))};
}
/* what a session asks of each muscle, in RP load (sets × 1.2 × weight).
   One muscle's summed helper load is capped at 1.8 a session (half a 3-set primary). */
function vxLoad(items,done,none){
  const P={}, H={}, L={}, prim=[];
  (items||[]).forEach((it,i)=>{
    const n=done?(+done[i]||0):(+it.sets||0); if(!(n>0)||none||it.mob||vxIsStretch(it.name)) return;
    if(!prim.includes(it.primary)) prim.push(it.primary);
    const w=vxW(it.name,it.primary);
    Object.keys(w).forEach(k=>{ if(!(w[k]>0)||!MUSCLES[k]) return; const v=n*1.2*w[k]; if(k===it.primary) P[k]=(P[k]||0)+v; else H[k]=(H[k]||0)+v; });
  });
  Object.keys(P).forEach(k=>L[k]=P[k]);
  Object.keys(H).forEach(k=>L[k]=(L[k]||0)+Math.min(H[k],1.8));
  return {L,prim,ex:vxExRows(items,done)};
}
/* load → whole-number gains with a signed carry. B (optional) is {scores,rpCarry} to use instead of S.
   ups: rank-ups, the muscles you trained first (session order), then helpers by gain */
function vxRP(L,prim,write,B){
  B=B||S; prim=prim||[];
  const sc=B.scores||{}, C=B.rpCarry||{}, gains={}, carry={}, ups=[];
  Object.keys(L||{}).forEach(k=>{
    const l=L[k]; if(!(l>0)||!(k in sc)) return;
    const s=Math.round(+sc[k]||0); if(s>=100) return;
    const raw=l*(1-s/125)+(+C[k]||0);
    let g=Math.max(0,Math.round(raw));
    if(g<1&&prim.includes(k)&&l>=1) g=1;   // the muscle you trained always moves
    g=Math.min(g,100-s);
    carry[k]=s+g>=100?0:Math.max(-0.5,Math.min(0.5,Math.round((raw-g)*1000)/1000));
    if(g>0){ gains[k]=g; if(rankIx(s+g)>rankIx(s)) ups.push({k,from:s,to:s+g,p:prim.includes(k)}); }
  });
  const at=k=>{ const i=prim.indexOf(k); return i<0?1e9:i; };
  ups.sort((a,b)=>at(a.k)-at(b.k)||gains[b.k]-gains[a.k]);
  if(write){ Object.keys(gains).forEach(k=>sc[k]=Math.round(+sc[k]||0)+gains[k]); B.rpCarry=B.rpCarry||{}; Object.assign(B.rpCarry,carry); }
  return {gains,carry,ups};
}
/* the "+N RP" a session would give if you finish every set */
function vxPreview(items){ const X=vxLoad(items); return vxRP(X.L,X.prim,false).gains; }
/* extra RP load from providers (Phase 5: the path bonus): vxOn("rpBonus",(ctx,X)=>({muscle:extraLoad})).
   Only muscles that already carry load this session can get more. */
function vxBonusL(X,ctx){
  const B={}, cap=0.1;   // the path bonus (+10%) is the only provider; a new provider raises this on purpose
  vxHooks("rpBonus").forEach(f=>{ try{ const r=f(ctx,X); if(r&&typeof r==="object") Object.keys(r).forEach(k=>{ const v=+r[k]; if(v>0&&MUSCLES[k]&&X.L[k]>0) B[k]=(B[k]||0)+v; }); }catch(e){ console.warn(e); } });
  Object.keys(B).forEach(k=>{ B[k]=Math.min(B[k],cap*X.L[k]); });
  return B;
}
/* credit a session (or one quick-logged exercise) to S.scores.
   C.bonusL {k: extra load} and C.bonus {k: extra RP} come from the rpBonus providers ({} when none apply);
   C.L, the gains, the carry, the rank-ups and T.rp already include them. */
function vxCredit(items,done,src,none){
  const X=vxLoad(items,done,none), o0=overall();
  const wk=src==="workout"&&typeof TR!=="undefined";
  const B=vxBonusL(X,{items,done,src,none,logs:wk?TR.logs:null,plans:wk?TR.plans:null});
  let base=null;
  if(Object.keys(B).length){ base=vxRP(X.L,X.prim,false).gains; const L={...X.L}; Object.keys(B).forEach(k=>L[k]+=B[k]); X.L=L; }
  const R=vxRP(X.L,X.prim,true), o1=overall();
  const T=vxTally(); T.rp=(+T.rp||0)+Object.values(R.gains).reduce((a,b)=>a+b,0);
  const bonus={}; if(base) Object.keys(R.gains).forEach(k=>{ const d=R.gains[k]-(base[k]||0); if(d>0) bonus[k]=d; });
  const out={...X,...R,o0,o1,oUp:rankIx(o1)>rankIx(o0),src,bonusL:B,bonus};
  vxEmit("credit",out);
  if(R.ups.length||out.oUp) vxEmit("rankup",{ups:R.ups,overall:out.oUp?{from:o0,to:o1}:null,src});
  return out;
}
/* ---------------------------------------------------------
   2b. THE LEVEL — one number that only goes up (Andrej, 18 Oct)
   Lifetime rank points (S.tally.rp, counted by vxCredit since Phase 1) make a level on the curve
   xp(n) = 12.7 · n^1.71: level 5 is about two weeks of training, 10 about six, 30 about ten months, 50 the
   long game. Ranks say where the body is now and can fade; the level never drops.
   - vxXp()         lifetime rank points
   - vxLevelXp(n)   the points level n starts at
   - vxLevelInfo()  {lv, xp, at, next, frac, toNext}
   - vxHas(id)      an unlock earned: by level (UNLOCKS[].lv), or by the old sessions rule (UNLOCKS[].at), so
                    nothing already earned is ever lost
   finishWorkout puts lv0/lv1 on TR.result and emits "levelup" {from, to} when the level climbs.
   --------------------------------------------------------- */
function vxXp(){ const T=vxTally(); return Math.max(0,Math.round(+T.rp||0)); }
/* bonus rank points for the level only (no muscle): a dare ticked (+15), a ghost beaten (+5). 19 Oct, Train spec.
   They go on the lifetime tally (so the level and its bar move) and are counted apart in T.bonus. */
function vxBonusXp(n,why){
  try{ n=Math.max(0,Math.round(+n||0)); if(!n) return 0; const T=vxTally(); T.rp=(+T.rp||0)+n; T.bonus=(+T.bonus||0)+n; save(); vxEmit("bonus",n,why||""); return n; }catch(e){ return 0; }
}
function vxLevelXp(n){ n=Math.max(0,Math.floor(n)); return n?Math.round(12.7*Math.pow(n,1.71)):0; }
function vxLevelInfo(){
  const xp=vxXp(); let lv=0; while(lv<99&&vxLevelXp(lv+1)<=xp) lv++;
  const at=vxLevelXp(lv), next=lv>=99?at:vxLevelXp(lv+1);
  return {lv,xp,at,next,frac:next>at?Math.max(0,Math.min(1,(xp-at)/(next-at))):1,toNext:Math.max(0,next-xp)};
}
function vxHas(id){
  try{ const u=UNLOCKS.find(x=>x.id===id); if(!u) return true;
    if(u.lv!=null&&vxLevelInfo().lv>=u.lv) return true;
    return !!(u.at&&sessionsN()>=u.at); }catch(e){ return false; }
}
/* one row per exercise you did, for the workout record */
function vxExRows(items,done,logs){
  const out=[];
  (items||[]).forEach((it,i)=>{
    const n=done?(+done[i]||0):(+it.sets||0); if(!(n>0)) return;
    const row={n:it.name,k:it.primary,s:n}; let r=0,v=0,top=0,hold=0;
    ((logs&&logs[i])||[]).forEach(x=>{ if(!x) return; if(x.r>0) r+=x.r; if(x.kg>0&&x.r>0) v+=x.kg*x.r; if(x.kg>top) top=x.kg; if(x.s>hold) hold=x.s; });
    if(r) row.r=r; if(v) row.kg=Math.round(v*10)/10; if(top) row.top=top; if(hold) row.hold=hold;
    if(it.mob||vxIsStretch(it.name)) row.mob=1;
    out.push(row);
  });
  return out;
}
function vxRound(o,dp){ const m=Math.pow(10,dp||0), r={}; Object.keys(o||{}).forEach(k=>{ r[k]=Math.round(o[k]*m)/m; }); return r; }
/* the friendly muscle name the rank screens use ("Chest", "Glutes") */
function vxSay(k){ try{ if(typeof rkSay==="function") return rkSay(k); }catch(e){} return MUSCLES[k]?MUSCLES[k].name:k; }
/* what lit up on the body (a picture, not credit): the old curve, stretches included */
function vxShowLoad(items,done){
  const L={};
  (items||[]).forEach((it,i)=>{ const n=done?(+done[i]||0):(+it.sets||0); if(!(n>0)) return;
    L[it.primary]=(L[it.primary]||0)+n; (it.sec||[]).forEach(k=>L[k]=(L[k]||0)+n*0.4); });
  return L;
}
/* recovery load (S.log): the primary gets n, helpers of 0.3 or more get 0.4 × n, lighter helpers none.
   Stretches and mobility items put no load into recovery. */
function loadOf(items,doneSets){
  const L={};
  (items||[]).forEach((it,i)=>{
    const n=doneSets?(+doneSets[i]||0):(+it.sets||0); if(!(n>0)||it.mob||vxIsStretch(it.name)) return;
    L[it.primary]=(L[it.primary]||0)+n;
    const w=vxW(it.name,it.primary);
    /* lighter helpers start no recovery window, but get a tiny marker so they count as trained (no false "Fading") */
    Object.keys(w).forEach(k=>{ if(k!==it.primary&&w[k]>0&&MUSCLES[k]) L[k]=(L[k]||0)+(w[k]>=0.3?n*0.4:0.1); });
  });
  return L;
}
/* history: 400 days by date; past the newest 120, records keep only their summary */
function vxKeepWorkouts(){
  const cut=dkey(400);
  S.workouts=(S.workouts||[]).filter(w=>w&&(!w.d||w.d>=cut));
  if(S.workouts.length>1500) S.workouts=S.workouts.slice(-1500);
  const n=S.workouts.length;
  S.workouts.forEach((w,i)=>{ if(i<n-120){ delete w.ex; delete w.ld; } });
}

/* ---------------------------------------------------------
   3. THE TWO WAYS RP IS EARNED (moved here from ossa.html)
   --------------------------------------------------------- */
function finishWorkout(){
  clearInterval(TR.timer);
  const s=TR.session, mob=s.kind==="mobility", st0=S.streak, n0=sessionsN(), T=vxTally();
  if(s.min) S.minDay=dkey(0);
  if(S.focusNext&&s.items.some((it,ix)=>it.primary===S.focusNext.k&&TR.doneSets[ix]>0)) S.focusNext=null;
  const hit0=GLORDER.filter(k=>weekSets(k)>=1).length;
  const L0=vxLevelInfo(), had0={}; try{ UNLOCKS.forEach(u=>{ had0[u.id]=vxHas(u.id); }); }catch(e){}
  const C=vxCredit(s.items,TR.doneSets,"workout",mob), gains=C.gains;
  const sets=TR.doneSets.reduce((a,b)=>a+b,0), mins=Math.max(1,Math.round((Date.now()-TR.t0)/60000));
  if(sets){ const today=new Date().toDateString(); if(S.last!==today){S.last=today;S.streak+=1;} }
  /* volume, personal bests, and the lift history */
  const prs=[], logs=[]; let vol=0;
  S.lifts=S.lifts||{};
  s.items.forEach((it,i)=>{ const lg=(TR.logs&&TR.logs[i])||[], p=TR.plans&&TR.plans[i]; if(!lg.length||!p) return;
    logs.push({name:it.name,kind:p.kind,sets:lg});
    lg.forEach(x=>{ if(x.kg&&x.r) vol+=x.kg*x.r; });
    const hist=S.lifts[it.name]||[];
    if(hist.length&&p.kind!=="tick"){
      const all=hist.flatMap(h=>h.sets), best=all.reduce((a,x)=>liftScore(p.kind,x)>liftScore(p.kind,a)?x:a,all[0]);
      const top=lg.reduce((a,x)=>liftScore(p.kind,x)>liftScore(p.kind,a)?x:a,lg[0]);
      if(liftScore(p.kind,top)>liftScore(p.kind,best)+1e-6) prs.push({name:it.name,now:setTxt(p.kind,top),was:setTxt(p.kind,best)});
    }
    (S.lifts[it.name]=S.lifts[it.name]||[]).push({d:dkey(0),sets:lg.map(x=>({...x})),p:it.primary,...(TR.rir&&TR.rir[it.name]!=null?{rir:TR.rir[it.name]}:{})});
    if(S.lifts[it.name].length>20) S.lifts[it.name].shift();
  });
  if(!mob) logLoad(loadOf(s.items,TR.doneSets));
  const hit1=GLORDER.filter(k=>weekSets(k)>=1).length;
  let rec=null;
  if(sets){
    const end=Date.now(), ld=vxRound(C.L,2);
    rec={d:dkey(0),title:vxTitle(s.title),mins,sets,vol:Math.round(vol),t:TR.t0||end-mins*60000,end,kind:s.kind||"train",
      ex:vxExRows(s.items,TR.doneSets,TR.logs),rp:{...gains},...(Object.keys(ld).length?{ld}:{})};
    S.workouts=S.workouts||[]; S.workouts.push(rec); vxKeepWorkouts();
    T.n=Math.max(+T.n||0,n0)+1; T.sets=(+T.sets||0)+sets; T.mins=(+T.mins||0)+mins; T.vol=(+T.vol||0)+Math.round(vol); if(!T.since) T.since=rec.d;
    track("workout_done",{mins,sets,n:sessionsN()});
    if(s.kind!=="posture"&&!mob) S.lastW=dkey(0);
  }
  save(); Body.refresh(); drawHeader(false); drawWeek();
  TR.result={st0,n0,ranks:C.ups.map(u=>({k:u.k,to:rankOf(u.to),from:u.from,toS:u.to,p:u.p})),
    unl:UNLOCKS.filter(u=>!had0[u.id]&&vxHas(u.id)),lv0:L0.lv,lv1:vxLevelInfo().lv,xp:vxXp(),gains,sets,mins,vol:Math.round(vol),prs,logs,hit0,hit1,
    ask:TR.ask&&!(TR.rir&&TR.rir[TR.ask]!=null)&&logs.some(l=>l.name===TR.ask)?TR.ask:null,
    I:norm01(vxShowLoad(s.items,TR.doneSets)),o0:C.o0,o1:C.o1,oUp:C.oUp,prim:C.prim,rec};
  if(rec) vxEmit("workout",rec,TR.result);
  if(TR.result.lv1>TR.result.lv0) vxEmit("levelup",{from:TR.result.lv0,to:TR.result.lv1});
  TR.view="done"; TR.keep=false; drawTrain(); $("train").scrollTop=0;
}
/* a quick session is titled with the minutes it was planned for ("Lower · 20 min"); the record keeps the real
   minutes, so its title drops them (BUG-39) */
function vxTitle(t){ return String(t||"Workout").replace(/\s*·\s*\d+\s*min$/,"")||"Workout"; }
/* the + on a muscle sheet's Train tab, and "Log it" after a demo */
function quickLog(e){
  if(!e||!e[0]) return;
  const it=mkItem(e[0],e[1]||"",e[2]), k=it.primary, has=!!sel&&(sel.t==="muscle"||sel.t==="region"), before=has?isSelScore():0;
  const today=new Date().toDateString();
  if(!S.done||S.done.day!==today) S.done={day:today,items:[]};
  S.done.items.push(k+"|"+it.name);
  if(S.last!==today){ S.last=today; S.streak=(S.streak||0)+1; }
  const st=vxIsStretch(it.name);
  let C=null;
  if(!st){ C=vxCredit([it],null,"quick"); logLoad(loadOf([it])); }   // a stretch: no RP and no recovery load (BUG-05)
  save(); Body.refresh(); Body.pulse([k,...(C?Object.keys(C.gains).filter(x=>x!==k):[])]); drawHeader(true); drawWeek();
  const keep=sheetState; renderSheet(false); if(keep==="full") setSheet("full");
  if(has&&$("shNum")) countTo($("shNum"),before,isSelScore());
  if(st) toast(`${it.name} logged · stretches earn no RP`);
  else{
    const g=C.gains, u=C.ups[0], at=x=>{ const i=C.prim.indexOf(x); return i<0?1e9:i; };
    if(u||C.oUp){ toast(u?`${vxSay(u.k)} ranked up: ${rankOf(u.to)}${C.oUp?` · Overall ${rankOf(C.o1)}`:""}`:`Overall rank up: ${rankOf(C.o1)}`); Pulse.buzz([12,50,20]); }
    else{ const ks=Object.keys(g).sort((a,b)=>at(a)-at(b)||g[b]-g[a]).slice(0,3);
      toast(ks.length?`${it.name} logged · ${ks.map(x=>`${vxSay(x)} +${g[x]} RP`).join(", ")}`:`${it.name} logged`); }
  }
  vxEmit("log",{name:it.name,k,gains:C?C.gains:{},stretch:st});
}

/* ---------------------------------------------------------
   4. FADING AND RECOVERY — one neglect rule
   A muscle starts to fade NEGLECT_DAYS (10) after you last trained it and is fully faded at
   FADE_FULL_DAYS (21). Both are consts in ossa.html, next to the loader. A flag pauses it:
   flagged days don't count, and a flagged muscle is never "fading" (no dares, no nudges).
   --------------------------------------------------------- */
function lastSession(k){
  for(let n=0;n<60;n++){ const d=dkey(n), e=S.log.find(x=>x.d===d);
    if(e&&e.m[k]>=1.5){ const [Y,M,D]=d.split("-").map(Number); const t=Math.min(Date.now(),(e.h&&e.h[k])||new Date(Y,M-1,D,18,0).getTime()); return {t,load:e.m[k]}; } }
  return null;
}
/* hours to recover from a session. Later phases adjust it with vxOn("recWindow",(k,s,w)=>newW) */
function vxWindowH(k,s){ let w=recWindow(s.load); vxHooks("recWindow").forEach(f=>{ try{ const x=f(k,s,w); if(x>0) w=x; }catch(e){ console.warn(e); } }); return w; }
function recoveredPct(k){ const s=lastSession(k); if(!s) return 1; return Math.max(0,Math.min(1,(Date.now()-s.t)/3.6e6/vxWindowH(k,s))); }
function hoursLeft(k){ const s=lastSession(k); if(!s) return 0; return Math.max(0,Math.ceil(vxWindowH(k,s)-(Date.now()-s.t)/3.6e6)); }
/* days a flag covered k since it was last trained (a day counts when it's after the flag day, up to the day it was cleared) */
function vxPausedDays(k,d){
  if(d==null) d=daysSince(k);
  let n=0;
  try{ const fl=(S.spots||[]).filter(f=>f&&vxSpotMuscles(f).includes(k)); if(!fl.length) return 0;
    for(let i=0;i<Math.min(d,60);i++){ const x=dkey(i); if(fl.some(f=>f.at<x&&(!f.off||x<=f.off))) n++; } }catch(e){}
  return n;
}
/* days since k was trained, minus flagged days */
function vxIdle(k){ const d=daysSince(k); return d>=99?99:Math.max(0,d-vxPausedDays(k,d)); }
function vxNeglected(k){ return !isNew(k)&&!vxFlagged(k)&&vxIdle(k)>=NEGLECT_DAYS; }
/* 0 below NEGLECT_DAYS, then a visible 0.35 rising to 1 at FADE_FULL_DAYS */
function vxFade(k){ if(isNew(k)) return 0; const d=vxIdle(k); return d<NEGLECT_DAYS?0:Math.min(1,0.35+0.65*(d-NEGLECT_DAYS)/(FADE_FULL_DAYS-NEGLECT_DAYS)); }
function fadeOf(k){ try{ return vxFade(k); }catch(e){ return 0; } }
function stateOf(k){ if(isNew(k)) return "new"; if(vxNeglected(k)) return "fading"; if(recoveredPct(k)<0.9) return "recovering"; return "ready"; }
/* one recovery number for one muscle or a group: the least recovered trained muscle, 0–100, or null */
function vxRecPct(ks){ ks=[].concat(ks).filter(k=>MUSCLES[k]&&!isNew(k)); return ks.length?Math.min(...ks.map(k=>Math.round(recoveredPct(k)*100))):null; }
/* the short state line: Body page card, Muscle ranks rows, the 3D label */
function vxStateShort(k){
  if(isNew(k)) return "Not trained yet";
  if(vxFlagged(k)) return "Flagged · fade paused";
  const st=stateOf(k);
  if(st==="recovering") return `Recovering · ${Math.round(recoveredPct(k)*100)}%`;
  if(st==="fading"){ const d=daysSince(k); return `Fading · ${d>=60?"over 60":d} days`; }
  return "Ready to train";
}
function vxReadyDay(h){
  const d=new Date(Date.now()+h*3.6e6);
  return h<20&&d.getDate()===new Date().getDate()?"later today":h<40&&d.getDate()===new Date(Date.now()+864e5).getDate()?"tomorrow":d.toLocaleDateString("en-GB",{weekday:"long"});
}
/* the Recover card on a muscle or region sheet: {t: title, s: line}. Takes a key or a list */
function readyText(x){
  const ks=[].concat(x).filter(k=>MUSCLES[k]), one=ks.length===1, name=k=>MUSCLES[k].name;
  if(!ks.length||ks.every(isNew)) return {t:"Unexplored",s:"Nothing to recover from yet. Train it and recovery shows here."};   // one word for one state (22 Oct, BUG-04)
  const tr=ks.filter(k=>!isNew(k)), nw=ks.filter(isNew);
  const rec=tr.filter(k=>stateOf(k)==="recovering").sort((a,b)=>recoveredPct(a)-recoveredPct(b));
  const fad=tr.filter(k=>stateOf(k)==="fading"), fl=tr.filter(k=>vxFlagged(k));
  const tail=one?"":[...fad.filter(k=>!rec.includes(k)).slice(0,2).map(k=>` ${name(k)}: not trained for ${NEGLECT_DAYS}+ days.`),...nw.slice(0,2).map(k=>` ${name(k)}: not trained yet.`)].join("");
  if(rec.length){ const w=rec[0], p=Math.round(recoveredPct(w)*100); return {t:`${p}% recovered`,s:`${one?"Ready":name(w)+" ready"} ${vxReadyDay(hoursLeft(w))}.${tail}`}; }
  if(fl.length===tr.length) return {t:"Flagged",s:`You flagged ${one?"this":"these"}. ${one?"It won't":"They won't"} fade while flagged.`};
  if(fad.length===tr.length){ const d=Math.min(...fad.map(daysSince));
    return {t:"Fading",s:`Not trained for ${one?(d>=60?"over 60":d):NEGLECT_DAYS+"+"} days. Fully recovered, so it's a good time to train ${one?"it":"them"}.`}; }
  const rd=tr.filter(k=>!fad.includes(k));
  return {t:"Ready",s:`${vxRecPct(rd)}% recovered. Good to train hard.${tail}`};
}
/* the line under a sheet's title */
function wkInfo(ks){
  ks=[].concat(ks).filter(k=>MUSCLES[k]); const many=ks.length>1;
  if(!ks.length||ks.every(isNew)) return `<div class="wkinfo fading">Unexplored · you haven't trained ${many?"these":"this"} yet</div>`;
  const tr=ks.filter(k=>!isNew(k)), nw=ks.length-tr.length;
  const rec=tr.filter(k=>stateOf(k)==="recovering").sort((a,b)=>recoveredPct(a)-recoveredPct(b)), fad=tr.filter(k=>stateOf(k)==="fading");
  const extra=many?(fad.length&&fad.length<tr.length?(fad.length===1?` · ${MUSCLES[fad[0]].name} fading`:` · ${fad.length} fading`):"")+(nw?` · ${nw} unexplored`:""):"";
  if(rec.length){ const w=rec[0], pct=Math.round(recoveredPct(w)*100);
    return `<div class="wkinfo recovering">Recovering · ${many?MUSCLES[w].name+" ":""}${pct}% recovered, ready ${leftText(hoursLeft(w))}${extra}</div>`; }
  if(tr.every(k=>vxFlagged(k))) return `<div class="wkinfo vul">Flagged · fade paused${many&&nw?` · ${nw} unexplored`:""}</div>`;
  if(fad.length===tr.length){ const d=Math.min(...fad.map(daysSince));
    return `<div class="wkinfo fading">Fading · not trained for ${d>=60?"over 60":d} days${many&&nw?` · ${nw} unexplored`:""}</div>`; }
  const rd=tr.filter(k=>!fad.includes(k)), sets=Math.round(ks.reduce((a,k)=>a+weekSets(k),0));
  return `<div class="wkinfo">Ready · ${vxRecPct(rd)}% recovered${sets?` · ${sets} set${sets===1?"":"s"} this week`:""}${extra}</div>`;
}
/* S.done and the day's labels when the app comes back after midnight (BUG-06) */
function vxDayCheck(){
  const t=new Date().toDateString(), d=dkey(0); let ch=false;
  if(!S.done||S.done.day!==t){ S.done={day:t,items:[]}; ch=true; save(); }
  if(vxDayCheck.d&&vxDayCheck.d!==d) ch=true;
  vxDayCheck.d=d;
  if(!ch) return;
  try{ Body.refresh&&Body.refresh(); }catch(e){}
  try{ drawWeek(); }catch(e){}
  try{ refreshWhole(); }catch(e){}
  vxEmit("day",d);
}

/* ---------------------------------------------------------
   5. SORE SPOTS ("Flagged")
   A flag never changes a plan: it pauses fading, removes the muscle from dares and neglect
   nudges, and tags plan rows. A joint flag covers the muscles around that joint.
   --------------------------------------------------------- */
function vxJointMuscles(j){
  return ({neck:["traps"],shoulder:["front_delt","side_delt","rear_delt"],elbow:["biceps","triceps","forearms"],wrist:["forearms"],
    lowback:["erectors"],hip:["glute_max","glute_med","adductors"],knee:["quads","hamstrings"],ankle:["gastrocnemius","soleus","tibialis"]})[j]||[];
}
/* the joint whose relief routine helps a muscle */
function vxMuscleJoint(k){
  return ({traps:"neck",front_delt:"shoulder",side_delt:"shoulder",rear_delt:"shoulder",pec_major:"shoulder",pec_minor:"shoulder",serratus:"shoulder",
    lats:"shoulder",rhomboids:"shoulder",biceps:"elbow",triceps:"elbow",forearms:"wrist",erectors:"lowback",abs:"lowback",obliques:"lowback",
    glute_max:"hip",glute_med:"hip",adductors:"hip",quads:"knee",hamstrings:"knee",gastrocnemius:"ankle",soleus:"ankle",tibialis:"ankle"})[k]||null;
}
function vxSpotMuscles(f){ return f.kind==="m"?[f.id]:vxJointMuscles(f.id); }
/* active flags */
function vxSpots(){ return (Array.isArray(S.spots)?S.spots:[]).filter(f=>f&&!f.off); }
/* the active flag covering muscle k (its own flag first, then its joint's), or null */
function vxFlagFor(k){ const a=vxSpots(); return a.find(f=>f.kind==="m"&&f.id===k)||a.find(f=>f.kind==="j"&&vxJointMuscles(f.id).includes(k))||null; }
/* vxFlagged(muscleKey), or vxFlagged(jointKey,"j") for the joint itself */
function vxFlagged(k,kind){ try{ if(kind==="j") return vxSpots().some(f=>f.kind==="j"&&f.id===k); return !!vxFlagFor(k); }catch(e){ return false; } }
/* flag a spot. kind 'm'|'j', side 'l'|'r'|'b' (the user's own side). Flagging l then r makes b */
function vxFlagAdd(kind,id,side){
  kind=kind==="j"||kind==="joint"?"j":"m";
  if(kind==="m"?!MUSCLES[id]:!vxJointMuscles(id).length) return null;
  side=["neck","lowback","abs"].includes(id)?"b":side==="l"||side==="r"?side:"b";
  if(!Array.isArray(S.spots)) S.spots=[];
  let f=S.spots.find(x=>x&&!x.off&&x.kind===kind&&x.id===id);
  if(f){ if(f.side!==side) f.side="b"; }
  else{ f={id,kind,side,at:dkey(0),off:null}; S.spots.push(f); }
  save(); try{ Body.refresh&&Body.refresh(); }catch(e){}
  track("flag",{n:vxSpots().length});   // never the spot itself: no health data leaves the phone
  vxEmit("flag",f);
  return f;
}
/* "Not sore now": the entry stays (with off) for 60 days so fading resumes from where it paused */
function vxFlagRemove(kind,id){
  kind=kind==="j"||kind==="joint"?"j":"m";
  const f=(S.spots||[]).find(x=>x&&!x.off&&x.kind===kind&&x.id===id); if(!f) return null;
  f.off=dkey(0);
  const cut=dkey(60); S.spots=S.spots.filter(x=>x&&(!x.off||x.off>=cut));
  save(); try{ Body.refresh&&Body.refresh(); }catch(e){}
  vxEmit("unflag",f);
  return f;
}
/* "Left knee", "Knees", "Lower back", "Left hamstrings". f is a spot or a muscle key; lower for mid-sentence */
function vxFlagLabel(f,lower){
  if(typeof f==="string") f=vxFlagFor(f);
  if(!f) return "";
  const J={neck:["Neck","Neck"],shoulder:["shoulder","Shoulders"],elbow:["elbow","Elbows"],wrist:["wrist","Wrists"],lowback:["Lower back","Lower back"],hip:["hip","Hips"],knee:["knee","Knees"],ankle:["ankle","Ankles"]};
  const sd=f.side==="l"?"Left ":f.side==="r"?"Right ":"";
  let t;
  if(f.kind==="j"){ const j=J[f.id]||[f.id,f.id]; t=sd?sd+j[0].toLowerCase():j[1]; }
  else t=sd+(sd?MUSCLES[f.id].name.toLowerCase():MUSCLES[f.id].name);
  return lower?t.toLowerCase():t;
}

/* ---------------------------------------------------------
   6. HOOKS — later phases subscribe here instead of wrapping finishWorkout, remindPlan or nativeOpen
   vxOn(event, fn) → off()     events: "workout"(rec,R) "credit"(C) "rankup"({ups,overall,src})
                               "log"({name,k,gains,stretch}) "flag"(f) "unflag"(f) "native"(m) "fg"(m)
                               "bg"(m) (native.js re-emits the app going to the background) "open"(go) "day"(dkey)
                               "aura"(r,e) (aura.js, after every Aura XP award; e is null for the demo seed).
                               "credit" carries bonusL {k: extra load} and bonus {k: extra RP} (Phase 5, both {} when
                               no provider applies; C.L and rec.ld include the bonus load).
                               "recWindow", "remind", "remindQuiet" and "rpBonus" are providers.
                               rpBonus (ctx,X) → {muscle: extra load ≥ 0}: read in vxBonusL, capped at 10% of X.L[k]
                               (path.js: the Tank/Scout +10% on matching sets). ctx = {items,done,src,none,logs,plans}.
   vxRoute(go, fn)             a notification or widget link "go" (or "go:…") opens fn(go); return false to fall through.
                               Taken: review train score check desk scan pro today sore phonecheck ranks streak, and
                               "monk" (monk.js: the Monk Mode finish or timer; a toast only during a live workout)
   vxRemind(fn)                fn(list) returns more reminders {at,title,body,go,lead?}; the list stays sorted, at most 60.
                               An item must be more than 60 s away (lead: a shorter minimum in ms, never under 31 s,
                               since the phone skips anything under 30 s; Monk Mode's time's-up uses 35 s)
   vxRemindQuiet(fn)           fn(list) returns the list to keep, after every provider: Monk Mode drops Ossa's own
                               nudges while a session runs and moves the trial notice ('pro') to its end + 60 s
   --------------------------------------------------------- */
function vxHooks(e){ const h=vxHooks.h||(vxHooks.h={}); return h[e]||(h[e]=[]); }
/* Apple's rating prompt (expo-store-review, 19 Oct). Asked at two high points, each once: "plan" (the intro's plan
   reveal, before the paywall) and "run" (the end of the first workout run). Apple decides whether it shows (3 a year,
   never in TestFlight). No question first, nothing gated on it (App Review 5.6.1). S.rev = {plan:day, run:day}. */
function vxAskReview(where){
  try{
    if(!NATIVE.on||S.demo) return false;
    const r=S.rev||(S.rev={}); if(r[where]) return false;
    r[where]=dkey(0); save(); nsend({t:"review",where}); return true;
  }catch(e){ return false; }
}
function vxOn(e,f){ if(typeof f==="function") vxHooks(e).push(f); return ()=>{ const a=vxHooks(e), i=a.indexOf(f); if(i>=0) a.splice(i,1); }; }
function vxEmit(e,...a){ vxHooks(e).slice().forEach(f=>{ try{ f(...a); }catch(x){ console.warn("Ossa hook "+e,x); } }); }
function vxRoute(go,fn){ (vxRoute.m||(vxRoute.m={}))[go]=fn; }
function vxRemind(fn){ if(typeof fn==="function") vxHooks("remind").push(fn); }
function vxRemindQuiet(fn){ if(typeof fn==="function") vxHooks("remindQuiet").push(fn); }

/* ---------------------------------------------------------
   7. DEMO DATA ("Load demo data" in Profile, and every screenshot)
   SEED scores (overall 43, Strong I, 4 to Strong II; tibialis Stable I is the weak link; glutes 51),
   workouts on the SEED_LIFTS dates, S.log derived from them (h on every entry, pec minor included),
   a left-knee and a lower-back flag, and adductors left alone long enough to fade.
   --------------------------------------------------------- */
function vxDemo(){
  const TITLE={41:"Legs",39:"Upper",34:"Legs",32:"Upper",27:"Legs",25:"Upper",20:"Legs",18:"Upper",13:"Legs",11:"Upper",7:"Pull",6:"Legs",4:"Upper",3:"Lower + core",1:"Push"};
  const DROP={6:["Back squat"],3:["Copenhagen plank"]};                       // adductors: last trained 13 days ago
  const ADD={4:{"Push-up plus":[{kg:0,r:12},{kg:0,r:12},{kg:0,r:10}]},   // serratus and pec minor (BUG-09)
    1:{"Incline dumbbell press":L_(24,10,9,8)}};                             // upper chest, so Where your sets went has a split to show
  const carry={triceps:0.35,front_delt:-0.2,serratus:0.45,hamstrings:0.2};
  const B={scores:{...SEED},rpCarry:carry};
  const yest=new Date(); yest.setDate(yest.getDate()-1);
  const D={ver:2,verAt:Date.now(),scores:{...SEED},streak:6,last:yest.toDateString(),layers:{muscles:true},done:{day:new Date().toDateString(),items:[]},
    body:null,log:[],lifts:{},workouts:[],demo:true,rpCarry:{...carry},lastW:dkey(1),
    spots:[{id:"knee",kind:"j",side:"l",at:dkey(2),off:null},{id:"lowback",kind:"j",side:"b",at:dkey(1),off:null}]};
  SEED_LIFTS.forEach(([n,m])=>{
    const day={...m}; (DROP[n]||[]).forEach(x=>delete day[x]); Object.assign(day,ADD[n]||{});
    const names=Object.keys(day).filter(x=>EXW[x]); if(!names.length) return;
    const items=names.map(x=>{ const l=day[x], f=l[0]||{}; return mkItem(x,`${l.length} × ${f.r?f.r:f.s?f.s+" s":1}`,EXW[x][0]); });
    const done=items.map(it=>day[it.name].length), logs=items.map(it=>day[it.name]);
    const d=dkey(n), [Y,M,Dd]=d.split("-").map(Number), end=new Date(Y,M-1,Dd,18,0).getTime();
    const sets=done.reduce((a,b)=>a+b,0), mins=Math.round(sets*2.4+6), vol=Math.round(logs.flat().reduce((a,x)=>a+(x.kg&&x.r?x.kg*x.r:0),0));
    const X=vxLoad(items,done), R=vxRP(X.L,X.prim,false,B), L=vxRound(loadOf(items,done),1), h={};
    Object.keys(L).forEach(k=>h[k]=end);
    D.log.push({d,m:L,h});
    D.workouts.push({d,title:TITLE[n]||"Workout",mins,sets,vol,t:end-mins*60000,end,kind:"train",ex:vxExRows(items,done,logs),rp:R.gains,ld:vxRound(X.L,2)});
    items.forEach((it,i)=>(D.lifts[it.name]=D.lifts[it.name]||[]).push({d,sets:logs[i].map(x=>({...x})),p:it.primary}));
  });
  /* 49 sessions in all: the older ones are counted, not listed */
  const W=D.workouts, k=49/Math.max(1,W.length), sum=f=>W.reduce((a,w)=>a+(w[f]||0),0);
  D.tally={n:49,sets:Math.round(sum("sets")*k),mins:Math.round(sum("mins")*k),vol:Math.round(sum("vol")*k),rp:Math.round(W.reduce((a,w)=>a+Object.values(w.rp).reduce((x,y)=>x+y,0),0)*k),since:dkey(112)};
  return D;
}

/* ---------------------------------------------------------
   8. WRAPPERS (run at include time; exactly one each)
   --------------------------------------------------------- */
(()=>{
  const _open=nativeOpen;
  nativeOpen=function(go){
    try{ vxEmit("open",go); const r=vxRoute.m&&vxRoute.m[String(go||"").split(":")[0]];
      if(r&&S.body&&!document.querySelector(".app.onboarding")&&r(go)!==false) return; }catch(e){ console.warn(e); }
    return _open.apply(this,arguments);
  };
  const _plan=remindPlan;
  remindPlan=function(){
    let l=_plan.apply(this,arguments)||[]; const now=Date.now();
    vxHooks("remind").forEach(f=>{ try{ const x=f(l.slice()); if(Array.isArray(x)) l=l.concat(x.filter(n=>n&&n.at>now+(+n.lead>=31000&&+n.lead<60000?+n.lead:60000))); }catch(e){ console.warn(e); } });
    /* then the quiet filters (Monk Mode): each gets the whole list and returns what to keep */
    vxHooks("remindQuiet").forEach(f=>{ try{ const x=f(l.slice()); if(Array.isArray(x)) l=x.filter(n=>n&&+n.at>0); }catch(e){ console.warn(e); } });
    return l.sort((a,b)=>a.at-b.at).slice(0,60);
  };
  const _recv=nrecv;
  nrecv=function(m){
    const r=_recv.apply(this,arguments);
    try{ vxEmit("native",m); if(m&&m.t==="fg") vxEmit("fg",m); }catch(e){ console.warn(e); }
    return r;
  };
})();
vxDayCheck.d=dkey(0);
vxOn("fg",vxDayCheck);
document.addEventListener("visibilitychange",()=>{ if(!document.hidden) try{ vxDayCheck(); }catch(e){ console.warn(e); } });
