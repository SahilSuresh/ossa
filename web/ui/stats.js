/* =========================================================
   LIFE STATS: the character sheet (19 Oct, Andrej: "an RPG level up, get better and improve your life").
   The body is the character; its four stats are your life. Prefix st*. Function declarations only.
   - Every name, colour and line of copy lives in stDefs()/stCopy(), so a new tone (the "System" draft:
     Dormant … Beyond) can drop in by editing those two tables.
   - Each stat is 0–100 = a starting point from the intro's answers + what you have actually done.
     Starting points are game scores from your own answers, never a health measure.
       Strength   training days you said you do, then your muscle ranks (S.scores)
       Mind       hours sitting you said, then Focus and Breathe (the aura level)
       Recovery   aches you named, then how many trained muscles are ready again
       Discipline days you committed to and whether plans usually fade, then your streak and sessions
   - stSheetHTML(o) draws the sheet: the intro's "sheet" step and the panel the level emblem opens.
   ========================================================= */
function stDefs(){ return stDefs.L||(stDefs.L=[
  {k:"str",n:"Strength",ab:"STR",c:"var(--glow)",from:"Train"},
  {k:"mind",n:"Mind",ab:"MND",c:"var(--mind)",from:"Focus"},
  {k:"rec",n:"Recovery",ab:"REC",c:"var(--recover)",from:"Recover"},
  {k:"dis",n:"Discipline",ab:"DIS",c:"var(--gold)",from:"Your streak"}]); }
function stCopy(){ return stCopy.C||(stCopy.C={
  eye:"Your character", title:"Your stats", overall:"Life score", plan:"With your plan, 12 weeks",
  foot:"Game scores from your answers and what you log. Not a health measure.",
  weak:"Weak link", lowest:"Lowest stat" }); }
function stClamp(v){ return Math.max(1,Math.min(100,Math.round(+v||0))); }

/* starting points from the intro's answers: o = {activity, sit, aches, days, quit} (OBD or S.profile) */
function stBase(o){
  o=o||{}; const days=Array.isArray(o.days)?o.days.length:(+o.days||0), aches=Array.isArray(o.aches)?o.aches.length:(+o.aches||0);
  return {
    str:stClamp(({rare:14,"1-2":24,"3-4":36,"5+":48})[o.activity]||20),
    mind:stClamp(({lt4:50,"4-6":42,"6-8":33,"8+":25})[o.sit]||40),
    rec:stClamp(o.noAche?56:52-aches*8),
    dis:stClamp((o.quit?18:30)+Math.min(7,days)*3) };
}
/* what you've done since: added to the starting points */
function stGain(){
  const g={str:0,mind:0,rec:0,dis:0};
  try{ const ks=Object.keys(MUSCLES), sc=ks.map(k=>+S.scores[k]||0); g.str=sc.reduce((a,b)=>a+b,0)/Math.max(1,ks.length)*0.9; }catch(e){}
  try{ g.mind=(typeof auLv==="function"?auLv()-1:0)*4; }catch(e){}
  try{ let rd=0,tr=0; GLORDER.forEach(k=>{ const s=stateOf(k); if(s==="ready"){ rd++; tr++; } else if(s==="recovering") tr++; }); g.rec=tr?rd/tr*30:0; }catch(e){}
  try{ g.dis=Math.min(36,(+S.streak||0)*2)+Math.min(24,(typeof sessionsN==="function"?sessionsN():0)); }catch(e){}
  return g;
}
function stNow(){
  const p=S.profile||{}, b=stBase({activity:p.activity,sit:p.sit,aches:S.flagged||[],noAche:!(S.flagged||[]).length,days:p.days,quit:p.quit}), g=stGain(), o={};
  stDefs().forEach(d=>o[d.k]=stClamp(b[d.k]+g[d.k])); return o;
}
/* a plan-shaped projection, shown as a ghost: what 12 weeks of the plan adds as game points */
function stPlan(v,days){ const n=Math.max(1,Math.min(7,days||3)); return {str:stClamp(v.str+18+n*4),mind:stClamp(v.mind+16),rec:stClamp(v.rec+20),dis:stClamp(v.dis+24+n*2)}; }
/* the character's rank is the body's: the mean of the muscle scores (a new body is Fragile) */
function stBody(){ try{ const ks=Object.keys(MUSCLES); return ks.reduce((a,k)=>a+(+S.scores[k]||0),0)/Math.max(1,ks.length); }catch(e){ return 0; } }
function stAvg(v){ const D=stDefs(); return Math.round(D.reduce((a,d)=>a+v[d.k],0)/D.length); }
function stRankName(v){ try{ const i=Math.max(1,RANKS.reduce((a,r,j)=>v>=r[0]?j:a,1)); return {i,n:RANKS[i][1]}; }catch(e){ return {i:1,n:"Fragile"}; } }

/* the radar: four stats on a diamond, the plan as a dashed ghost */
function stRadar(v,p){
  const D=stDefs(), C=60, R=48, pt=(i,val)=>{ const a=-Math.PI/2+i*Math.PI*2/D.length, r=R*val/100; return [(C+Math.cos(a)*r).toFixed(1),(C+Math.sin(a)*r).toFixed(1)]; };
  const poly=o=>D.map((d,i)=>pt(i,o[d.k]).join(",")).join(" "), ring=f=>D.map((d,i)=>pt(i,f).join(",")).join(" ");
  return `<svg class="st-rad" viewBox="0 0 120 120" aria-hidden="true">
    ${[25,50,75,100].map(f=>`<polygon class="st-grid" points="${ring(f)}"/>`).join("")}
    ${D.map((d,i)=>`<line class="st-grid" x1="${C}" y1="${C}" x2="${pt(i,100)[0]}" y2="${pt(i,100)[1]}"/>`).join("")}
    ${p?`<polygon class="st-ghost" points="${poly(p)}"/>`:""}
    <polygon class="st-shape" points="${poly(v)}"/>
    ${D.map((d,i)=>{ const [x,y]=pt(i,v[d.k]); return `<circle cx="${x}" cy="${y}" r="2.6" style="fill:${d.c}"/>`; }).join("")}
  </svg>`;
}
/* o: {v, plan?, name?, lv?, weak?, intro?} */
function stSheetHTML(o){
  const D=stDefs(), T=stCopy(), v=o.v, avg=stAvg(v), rk=stRankName(o.body||0), low=D.slice().sort((a,b)=>v[a.k]-v[b.k])[0];
  const nm=(o.name||"").trim();
  return `<div class="st-sheet${o.intro?" intro":""}">
    <div class="st-head">
      <span class="st-hex" style="--c:var(--rk-${rk.i})"><b>${o.lv||0}</b><small>LV</small></span>
      <div class="st-who"><span class="u-eyebrow">${T.eye}</span><b>${nm?uiEsc(nm):"You"}</b><em style="color:${rk.i<2?"var(--text-2)":`var(--rk-${rk.i})`}">${uiEsc(rk.n)} · ${T.overall} ${avg}</em></div>
    </div>
    <div class="st-mid">${stRadar(v,o.plan)}
      <ul class="st-list">${D.map(d=>`<li style="--c:${d.c}"><span class="st-ab">${d.ab}</span><span class="st-bar"><i style="width:${v[d.k]}%"></i>${o.plan?`<s style="width:${o.plan[d.k]}%"></s>`:""}</span><b class="st-n">${v[d.k]}</b>${o.plan?`<small class="st-up">→ ${o.plan[d.k]}</small>`:""}</li>`).join("")}</ul>
    </div>
    <div class="st-rows">
      ${o.weak?`<div class="st-row"><span>${T.weak}</span><b>${uiEsc(o.weak)}</b></div>`:""}
      <div class="st-row"><span>${T.lowest}</span><b style="color:${low.c}">${low.n} · ${v[low.k]}</b></div>
      ${o.plan?`<div class="st-row"><span>${T.plan}</span><b class="st-good">${T.overall} ${stAvg(o.plan)}</b></div>`:""}
      ${o.intro?`<div class="st-row"><span>Aura</span><b class="st-aura">Faint · LV 1</b></div><p class="st-earn">Earn aura to light yourself up.</p>`:""}
    </div>
    <p class="st-foot">${T.foot}</p>
  </div>`;
}

/* the intro step (after the report, before the plan) */
async function uiObSheet(alive,can){
  const R=OBX.R||(OBX.R=uiObReport());
  await say("Here's your *character*. Every stat can level up."); if(!alive()) return;
  const v=stBase({activity:OBD.activity,sit:OBD.sit,aches:OBD.acheIds||[],noAche:OBD.noAche,days:OBD.days,quit:OBD.quit}), plan=stPlan(v,(OBD.days||[]).length);
  OBD.st0=v;
  return new Promise(res=>{
    const a=obAsk(`${stSheetHTML({v,plan,name:OBD.name,lv:1,weak:R.chain.name,intro:true})}<button class="btn primary big" id="o2Ok">Level me up</button>`);
    try{ Pulse.buzz(12); }catch(e){}
    a.querySelector("#o2Ok").onclick=()=>{ obBackOn(null); Pulse.buzz(10); a.innerHTML=""; res("ok"); };
  });
}

/* the same sheet in the app: tapping the level emblem on the Body page */
/* a sheet that slides up over the dimmed Body page (19 Oct): the body stays drawn behind it, so closing never shows a
   blank stage for a moment (a full-screen panel over the 3D canvas did, on Andrej's Samsung) */
function stOpen(){
  let p=$("stP");
  if(!p){ p=document.createElement("div"); p.id="stP"; p.className="st-wrap"; p.setAttribute("role","dialog"); p.setAttribute("aria-label",stCopy().title); $("app").appendChild(p); }
  let lv=0; try{ lv=vxLevelInfo().lv; }catch(e){}
  let weak=""; try{ const c=S.focus&&typeof CHAINS!=="undefined"&&CHAINS.find(x=>x.id===S.focus.chain); weak=c?c.name:""; }catch(e){}
  const v=stNow(), D=stDefs();
  p.innerHTML=`<div class="st-bg" data-stx="1"></div><div class="st-p"><span class="st-grab" aria-hidden="true"></span>
    ${stSheetHTML({v,name:S.name,lv,weak,body:stBody()})}
    <div class="st-how">${D.map(d=>`<div style="--c:${d.c}"><b>${d.n}</b><span>${uiEsc(d.from)}</span></div>`).join("")}</div>
    <button class="u-btn block st-close" id="stX">Close</button></div>`;
  p.onclick=e=>{ if(e.target.dataset&&e.target.dataset.stx) stClose(); };
  $("stX").onclick=stClose;
  clearTimeout(stClose.t); void p.offsetWidth; p.classList.add("on");
  try{ Body.refresh&&Body.refresh(); }catch(e){}
  try{ Pulse.buzz(8); track("stats_open"); }catch(e){}
}
function stClose(){
  const p=$("stP"); if(!p) return; p.classList.remove("on");
  try{ Body.refresh&&Body.refresh(); }catch(e){}
  clearTimeout(stClose.t); stClose.t=setTimeout(()=>{ try{ if(!p.classList.contains("on")) p.remove(); Body.refresh&&Body.refresh(); }catch(e){} },400);
}
/* the emblem opens it (it is drawn fresh with the Body page, so listen on the document) */
document.addEventListener("click",e=>{ try{ if(e.target.closest&&e.target.closest(".u-lvl")&&!document.querySelector(".app.onboarding")) stOpen(); }catch(x){} });
