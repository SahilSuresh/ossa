/* =========================================================
   ONBOARDING — "Out of the Stone" (19 Oct, Andrej: "make it like Opal … the body is covered in rock … after answering
   it is slowly breaking apart that rock, forming the body"). Paced like Opal's: pure black, one question per screen,
   the headline at the top, big cards and a bone pill at the thumb, a chapter bar of a few segments. Your body stands in
   stone at the centre of every screen and each answer cracks the part it is about (web/ui/rock.js): your name frees the
   head, your goals the chest or back or legs, your aches crack red where they hurt, your week frees the legs.
   Then: reading your body, a four-card report (the hard news, your weak link, the good news), your plan, a seal you
   hold, the hard paywall (only stone boots are left), and after Pro one tap frees the body: First form, a reminder,
   Day 1. Every answer writes the same OBD fields as before; S is written at purchase (uiObCommit) and again at the
   finish, and S.obIn keeps a half-done intro coming back at the next launch.
   The older steps' research (MyFitnessPal, Flo, Runna, Yazio, BetterMe, GymStreak…) is kept in the copy and the data.
   ========================================================= */
const UI_OB_IC={
  info:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>`,
  neck:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="6" r="3"/><path d="M4 19c1.6-4.4 4.4-6.5 8-6.5s6.4 2.1 8 6.5M10.5 9.5v3M13.5 9.5v3"/></svg>`,
  upper:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6c2.5 1.5 4.6 2 7 2s4.5-.5 7-2M7 7.5 9 15M17 7.5 15 15M12 8v13"/></svg>`,
  lower:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5v19M9 6h6M8.5 10h7M8.5 14h7M9 18h6"/></svg>`,
  hips:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8c2.6-1.6 5.3-2.4 8-2.4S17.4 6.4 20 8l-2 6H6z"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/></svg>`,
  knees:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2.5 10.5 12 8 21.5M16 2.5 13.5 12 16 21.5"/><circle cx="12" cy="12" r="1.6"/></svg>`,
  wrists:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21v-6.5L5 11a2 2 0 0 1 3.4-2l1.6 2.5V4.5a1.5 1.5 0 0 1 3 0V10m0-3a1.5 1.5 0 0 1 3 0v4m0-2a1.5 1.5 0 0 1 3 0V15c0 3-2 6-5 6"/></svg>`,
  strong:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5v5M6 7v10M18 7v10M21 9.5v5M6 12h12"/></svg>`,
  no:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>`,
  quote:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15c0-5 2.5-8 5-8M4 15h4v4H4zM13 15c0-5 2.5-8 5-8M13 15h4v4h-4z"/></svg>`
};
const UI_OB_CHS={you:"You",body:"Your body",week:"Your week",plan:"Your plan"};
/* what each goal breaks first, and the tag that floats up from it */
const UI_GOAL_R={muscle:["chest","Chest"],posture:["upperback","Upper back"],strength:["thighs","Thighs"],feel:["core","Core"]};
const UI_OB_TIERS=[[1,"Fragile"],[2,"Stable"],[3,"Strong"],[4,"Forged"],[5,"Unbreakable"]];
const UI_KIT=[["gym","Gym","Full equipment"],["db","Home","Dumbbells"],["bw","Anywhere","Just my body"]];
const UI_SIT=[["lt4","Under 4 h"],["4-6","4–6 h"],["6-8","6–8 h"],["8+","8 h or more"]];
const UI_TONE=[
  ["coach","Coach","Kind and steady","Three weeks since your hamstrings worked. Ten easy minutes today?"],
  ["drill","Drill","Tough love","Your hamstrings have been on holiday for three weeks. Bring them back."]];
const UI_REL=[
  {k:"quit",q:"I've started workout plans before and dropped them after a few weeks.",
    yes:"You're not alone. Most plans fade by week three. Yours is short, and a *rest day* never breaks your streak.",
    no:"Good. Then let's make this one your *best* yet."},
  {k:"form",q:"I'm not always sure an exercise is working the muscle it should.",
    yes:"Then you'll like this. Every exercise lights up on *your* body, so you see what it works.",
    no:"Nice. You'll still see every exercise light up on *your* body."}
];

/* ---------- the steps: id, function, chapter, the stone's tide after it, a loud crack, Back, skipped on the way back ---------- */
function uiObSteps(){ return uiObSteps.L||(uiObSteps.L=[
  {id:"welcome",fn:uiObWelcome,back:false},
  {id:"name",fn:stName,ch:"you",rock:0.03,back:false},
  {id:"frame",fn:uiStFrame,ch:"you",rock:0.05},
  {id:"ranks",fn:uiStRanks,ch:"you",rock:0.06},
  {id:"goals",fn:stGoal,ch:"body",rock:0.08},
  {id:"aches",fn:uiStPainSay,ch:"body",rock:0.10,fit:true},
  {id:"quit",fn:(a,c)=>uiStRelate(a,c,0),ch:"body",rock:0.11},
  {id:"form",fn:(a,c)=>uiStRelate(a,c,1),ch:"body",rock:0.12},
  {id:"voice",fn:uiStTone,ch:"body",rock:0.13},
  {id:"days",fn:uiStDays,ch:"week",rock:0.15},
  {id:"kit",fn:uiStKit,ch:"week",rock:0.16},
  {id:"age",fn:uiStAge,ch:"week",rock:0.17,loud:true},
  {id:"sit",fn:uiStSit,ch:"week",rock:0.18},
  {id:"phone",fn:(a,c)=>typeof uiObPhone==="function"?uiObPhone(a,c):"ok",ch:"week",rock:0.19,fit:true},
  {id:"read",fn:uiObRead,skip:true,back:false},
  {id:"report",fn:uiObStory,fit:true},
  {id:"sheet",fn:uiObSheet,fit:true},
  {id:"plan",fn:async(a,c)=>{ const r=await uiObPlan(a,c); if(r!=="__back"&&a()) vxAskReview("plan"); return r; },ch:"plan",rock:0.30,loud:true,fit:true},
  {id:"seal",fn:uiStPromise,ch:"plan",rock:0.58},
  {id:"pro",fn:uiStPaywall,ch:"plan",back:false},
  {id:"free",fn:uiObFree,back:false},
  {id:"remind",fn:obRemind,back:false},
  {id:"day1",fn:uiObDay1,back:false}]); }

async function obFlow(){
  const tok=OBT, alive=()=>tok===OBT;
  S.obIn=true; try{ save(); }catch(e){}
  try{ Body.obTissue(false); }catch(e){}
  uiObChrome(); obRockStart(); uiObLight(0);
  try{ Body.obScan(); }catch(e){}
  wireSkipTap();
  const L=uiObSteps(); let i=0, stepTok=0;
  while(i<L.length){
    const st=L[i]; uiObBar(i);
    const my=++stepTok, al=()=>alive()&&my===stepTok, can=i>0&&st.back!==false;
    let backRes; const back=new Promise(r=>backRes=r);
    const o2=$("o2"); if(o2){ o2.dataset.step=st.id; o2.classList.toggle("ob-fit",!!st.fit); }
    if(can) obBackOn(()=>{ const a=$("o2Act"); if(a) a.innerHTML=""; backRes("__back"); }); else obBackOn(null);
    let r; try{ r=await Promise.race([st.fn(al,can),back]); }catch(e){ console.warn("Ossa: onboarding step",st.id,e); r="ok"; }
    if(!alive()) return;
    if(r==="__back"){ stepTok++; try{ sayTok++; }catch(e){} uiObTidy(); do{ i--; }while(i>1&&L[i].skip); i=Math.max(1,i); continue; }
    if(st.rock){ obRock(st.rock,{quiet:!st.loud}); uiObLight(st.rock); }
    i++;
  }
  if(alive()) finishOnboarding(false);
}
/* whatever a step left behind when you go back */
function uiObTidy(){
  const o2=$("o2"); if(o2) o2.classList.remove("ob-story","ob-read");
  const st=$("stage"); if(st) st.classList.remove("rk-hum");
  const sp=$("o2Space"); if(sp){ sp.onclick=null; sp.style.pointerEvents=""; }
  const sub=$("uObSub"); if(sub) sub.innerHTML="";
  try{ obRockTint(null); }catch(e){}
  try{ obFrame(); }catch(e){}
}
/* the chrome: Back · the chapter's segments · sound, then the chapter eyebrow, then the headline at the top */
function uiObChrome(){
  const o=$("o2"); if(!o||o.classList.contains("ob2")) return; o.classList.add("ob2");
  const top=o.querySelector(".o2-top"); if(!top) return; top.classList.add("u-ob-top");
  const prog=o.querySelector(".o2-prog"); if(prog) prog.hidden=true;
  const seg=document.createElement("div"); seg.className="u-ob-seg"; seg.id="uObSeg"; seg.setAttribute("aria-hidden","true"); top.insertBefore(seg,top.querySelector(".o2-tr"));
  const eye=document.createElement("div"); eye.className="u-ob-eye"; eye.id="uObEye"; top.after(eye);
  const say=$("o2Say"); if(say){ eye.after(say); const sub=document.createElement("div"); sub.className="u-ob-subw"; sub.id="uObSub"; say.after(sub); }
  const sp=$("o2Space"); if(sp&&!$("uObHalo")) sp.insertAdjacentHTML("afterbegin",`<i class="u-ob-halo" id="uObHalo" aria-hidden="true"></i>`);
  const b=$("o2Back"); if(b){ b.innerHTML=UI_IC.back; b.setAttribute("aria-label","Back: change your last answer"); }
}
(()=>{ const _s=startOnboarding; startOnboarding=function(){ _s.apply(this,arguments); try{ uiObChrome(); }catch(e){ console.warn(e); } }; })();
/* the chapter bar: a few segments, the current one filling, and "YOUR BODY · 2 OF 5" above the headline */
function uiObBar(i){
  const L=uiObSteps(), st=L[i], seg=$("uObSeg"), eye=$("uObEye"); if(!st) return;
  if(uiObBar.last!==i){ uiObBar.last=i; track("onboarding_step",{step:i,id:st.id,v:2}); }
  if(!seg||!eye) return;
  const C=UI_OB_CHS[st.ch];
  if(!C){ seg.innerHTML=""; seg.hidden=true; eye.textContent=""; eye.hidden=true; return; }
  const inCh=L.filter(x=>x.ch===st.ch), k=inCh.indexOf(st);
  seg.hidden=false; eye.hidden=false;
  seg.innerHTML=inCh.map((x,j)=>`<i class="${j<k?"on":j===k?"now":""}"></i>`).join("");
  eye.textContent=`${C} · ${k+1} of ${inCh.length}`;
}
/* the glass under the stone lights a little more with every answer, so a hole shows a body, not black */
function uiObLight(v){ try{ Body.obSet({rim:Math.min(1,0.4+1.4*v),body:Math.min(0.45,0.16+0.8*v),heart:Math.min(0.8,0.35+v)}); }catch(e){} const o2=$("o2"); if(o2) o2.style.setProperty("--halo",Math.min(0.7,v*1.2).toFixed(2)); }
/* the headline: words fade up together (it used to type for two seconds); tap to skip still works.
   The head only bobs as it talks once it is out of the stone. */
function say(text,append){
  const el=$("o2Say"); if(!el) return Promise.resolve();
  const my=++sayTok, plain=text.replace(/\*/g,""); el.dataset.t=(append?(el.dataset.t||""):"")+plain; el.__skip=false;
  try{ Body.obTalk(!!text&&rkFace()); }catch(e){}
  return new Promise(async res=>{
    if(!append){ const sub=$("uObSub"); if(sub) sub.innerHTML=""; }
    if(!append&&el.querySelector(".w")&&!reduced){ el.classList.add("out"); await new Promise(r=>setTimeout(r,180)); }
    if(my!==sayTok){ try{ Body.obTalk(false); }catch(e){} return res(); }
    el.classList.remove("out");
    let d=0, k=false;
    const html=text.split(/(\s+)/).map(tok=>{ if(!tok) return ""; if(/^\s+$/.test(tok)) return tok;
      const open=tok.startsWith("*"), close=tok.replace(/[.,!?…:;]+$/,"").endsWith("*"); if(open) k=true;
      const w=`<span class="w${k?" k":""}" style="--d:${Math.min(240,d)}ms">${uiEsc(tok.replace(/\*/g,""))}</span>`; d+=18; if(close) k=false; return w; }).join("");
    if(!append) el.innerHTML=""; el.insertAdjacentHTML("beforeend",html);
    const fin=()=>{ try{ Body.obTalk(false); }catch(e){} res(); };
    if(reduced||!text){ el.querySelectorAll(".w").forEach(w=>w.classList.add("now")); return fin(); }
    let done=false; const tm=setTimeout(()=>{ if(!done){ done=true; fin(); } },Math.min(240,d)+560);
    const iv=setInterval(()=>{ if(done||my!==sayTok){ clearInterval(iv); if(!done){ done=true; clearTimeout(tm); fin(); } return; } if(el.__skip){ el.__skip=false; el.querySelectorAll(".w").forEach(w=>w.classList.add("now")); done=true; clearTimeout(tm); clearInterval(iv); fin(); } },50);
  });
}
function uiObClear(){ const el=$("o2Say"); if(el){ el.innerHTML=""; el.dataset.t=""; } const sub=$("uObSub"); if(sub) sub.innerHTML=""; try{ sayTok++; Body.obTalk(false); }catch(e){} }
/* the answers go at the thumb; a step's sub-line (.u-ob-sub) moves up under the headline, as Opal has it */
function obAsk(html){ const a=$("o2Act"); a.innerHTML=html; const slot=$("uObSub"); if(slot){ slot.innerHTML=""; const s=a.querySelector(".u-ob-sub"); if(s) slot.appendChild(s); } obOpts(a); return a; }
/* the old HUD (readout, systems row) has no place on Opal black */
function ro(){}
function obCx(){ OBX.side=false; const o=$("o2"); if(o) o.classList.remove("ro-on"); try{ obFrame(); }catch(e){} }
/* the frame you picked, swapped in for the intro only (S.body is kept in memory: the renderer needs it) */
function obFigure(f){
  if(!FIGURES[f]) f="m"; S.body=f;
  MESH=FIGURES[f].mesh(); PARTS=FIGURES[f].parts(); computeMCEN(); if(Body&&Body.setFigure) Body.setFigure();
  try{ rkFit(); }catch(e){} try{ obFrame(); }catch(e){}
}
/* answer cards: full width, bone when picked */
function uiObCards(items,cls){ return `<div class="u-ob-cards${cls?" "+cls:""}" role="group">${items.map(x=>`<button class="u-ob-card${x.on?" sel":""}" data-v="${x.v}"${x.on?' aria-pressed="true"':' aria-pressed="false"'}><span class="u-ob-ct"><b>${x.t}</b>${x.s?`<small>${x.s}</small>`:""}</span>${x.tick?`<em class="u-ob-tk" aria-hidden="true">${UI_IC.check}</em>`:""}</button>`).join("")}</div>`; }
/* one tap and on: the card turns bone, the crack lands, then the next screen */
function uiObPick(a,can,res,ms){
  backable(can,a,res); let picked=false;
  a.querySelectorAll(".u-ob-card[data-v]").forEach(b=>b.onclick=()=>{ if(picked) return; picked=true; obBackOn(null);
    Pulse.audio(); Pulse.buzz(6); b.classList.add("sel"); b.setAttribute("aria-pressed","true"); Music.accent&&Music.accent("answer");
    setTimeout(()=>{ a.innerHTML=""; res(b.dataset.v); },reduced?150:(ms||450)); });
}

/* ---------- 0 · welcome ---------- */
async function uiObWelcome(alive){
  obBackOn(null); uiObClear();
  return new Promise(res=>{
    const L=["Rank every muscle.","Find your weak link.","Break out stronger."];
    const a=obAsk(`<div class="u-ob-wel"><div class="u-ob-rot" id="uObRot" aria-hidden="true">${L.map((l,i)=>`<span${i?"":' class="on"'}>${l}</span>`).join("")}</div>
        <h1 class="u-ob-wt">Welcome to Ossa</h1><p class="o2-p u-ob-wsub">Your body is in there. Let's break it out.</p></div>
      <button class="btn primary big" id="o2Start">Get started</button>
      <p class="o2-fine">About three minutes. No account. Everything stays on this phone.</p>`);
    let k=0; const iv=setInterval(()=>{ const r=$("uObRot"); if(!r||!alive()){ clearInterval(iv); return; } k=(k+1)%L.length; r.querySelectorAll("span").forEach((s,j)=>s.classList.toggle("on",j===k)); },1600);
    const t=setTimeout(()=>{ if(alive()){ obRock(0.02,{quiet:true}); try{ Body.obBeat(); }catch(e){} } },1200);
    $("o2Start").onclick=()=>{ clearInterval(iv); clearTimeout(t); Pulse.audio(); Pulse.buzz(10); obRock(0.04); a.innerHTML=""; res("ok"); };
  });
}

/* ---------- You · 1 · your name frees the head ---------- */
async function stName(alive){
  await say("What should I *call* you?"); if(!alive()) return;
  return new Promise(res=>{
    const a=obAsk(`<p class="o2-p u-ob-sub">Your body will answer to it.</p>
      <div class="o2-in"><input id="o2Name" maxlength="20" autocomplete="given-name" autocapitalize="words" placeholder="Your first name" value="${OBD.name?uiEsc(OBD.name):""}"></div>
      <button class="btn primary big" id="o2NameOk">Continue</button><button class="o2-link u-ob-skip" id="o2NoName">Skip</button>`);
    const go=v=>{ OBD.name=(v||"").trim().replace(/[<>]/g,"").slice(0,20); const i=$("o2Name"); if(i) i.blur();
      Pulse.buzz(10); Music.accent&&Music.accent("answer"); a.innerHTML=""; obStrike("head",{tag:"Head"}); res(OBD.name); };
    $("o2NameOk").onclick=()=>go($("o2Name").value); $("o2NoName").onclick=()=>go("");
    $("o2Name").onkeydown=e=>{ if(e.key==="Enter") go($("o2Name").value); };
  });
}
/* ---------- You · 2 · your frame (the stone re-seats on it) and the shoulders break ---------- */
async function uiStFrame(alive,can){
  await say(OBD.name?`Nice to meet you, ${OBD.name}. Which body is *closer* to yours?`:"Which body is *closer* to yours?"); if(!alive()) return;
  const v=await new Promise(res=>{
    const cur=OBD.body||null;
    const a=obAsk(`<p class="o2-p u-ob-sub">It sets your frame. You can change it in Profile.</p>${uiObCards([{v:"m",t:"Male",s:"Broader frame",on:cur==="m"},{v:"f",t:"Female",s:"Narrower frame",on:cur==="f"}])}`);
    uiObPick(a,can,res);
  });
  if(!alive()||v==="__back") return v;
  if(S.body!==v){ const was=(S.body==="f"&&FIGURES.f)?"f":"m"; if(v!==was){ rkChips(40,{all:true}); try{ Body.obFlash(); }catch(e){} } obFigure(v); }
  OBD.body=v; obStrike("shoulders",{tag:"Shoulders"}); return v;
}
/* ---------- You · 3 · under the stone, every muscle has a rank (each badge lights the seams its colour) ---------- */
async function uiStRanks(alive,can){
  await say("Under the stone, every muscle has a *rank*."); if(!alive()) return;
  return new Promise(res=>{
    const a=obAsk(`<div class="u-ob-ladder" role="img" aria-label="Five ranks: Fragile, Stable, Strong, Forged, Unbreakable">${UI_OB_TIERS.map(([t,n],i)=>`<span class="u-ob-rung" style="--c:var(--rk-${t});--on-c:var(--on-rk-${t});--k:${i}"><span class="rk-badge"><b>${i+1}</b></span><small>${n}</small></span>`).join("")}</div>
      <p class="o2-p u-ob-sub">Train a muscle and it climbs, three levels at a time. Your lowest one is your <b>weak link</b>. That's where your plan starts.</p>
      <button class="btn primary big" id="o2Ok">Got it</button>`);
    backable(can,a,res);
    UI_OB_TIERS.forEach(([t],i)=>setTimeout(()=>{ if(a.isConnected&&alive()){ if(!reduced) Pulse.buzz(4+i*2); obRockTint("--rk-"+t,300); } },250+i*160));
    $("o2Ok").onclick=()=>{ obBackOn(null); Pulse.buzz(8); Music.accent&&Music.accent("answer"); a.innerHTML=""; res("ok"); };
  });
}

/* ---------- Your body · 1 · goals: each one breaks the place it is about ---------- */
async function stGoal(alive,can){
  await say("What do you want to get *better* at?"); if(!alive()) return;
  return new Promise(res=>{
    const sel=[...(OBD.goals&&OBD.goals.length?OBD.goals:(OBD.goal?[OBD.goal]:[]))];
    const a=obAsk(`<p class="o2-p u-ob-sub">Pick all that apply.</p>${uiObCards(GOALS.map(g=>({v:g.id,t:g.name,s:g.sub,on:sel.includes(g.id),tick:true})),"multi")}
      <button class="btn primary big" id="o2Ok" disabled>Continue</button>`);
    backable(can,a,res);
    const draw=()=>{ a.querySelectorAll("[data-v]").forEach(b=>{ const on=sel.includes(b.dataset.v); b.classList.toggle("sel",on); b.setAttribute("aria-pressed",on); }); $("o2Ok").disabled=!sel.length; };
    a.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{ const id=b.dataset.v, k=sel.indexOf(id); if(k>=0) sel.splice(k,1); else sel.push(id); Pulse.buzz(6); draw(); });
    $("o2Ok").onclick=()=>{ if(!sel.length) return; Pulse.audio(); Pulse.buzz(10); Music.accent&&Music.accent("answer"); obBackOn(null);
      OBD.goals=sel.slice(); OBD.goal=sel[0]; try{ lightSys("brain"); }catch(e){}
      a.innerHTML=""; const n=Math.min(3,sel.length);
      sel.slice(0,3).forEach((id,j)=>setTimeout(()=>{ const g=UI_GOAL_R[id]||["chest","Chest"]; obStrike(g[0],{tag:g[1]}); },j*250));
      setTimeout(()=>res("ok"),reduced?150:300+n*250); };
    draw();
  });
}
/* ---------- Your body · 2 · aches: a red hairline where it hurts; Continue breaks it open ---------- */
function uiPainLine(){
  const ids=OBD.acheIds||[];
  if(OBD.noAche||!ids.length) return "Then we build *strength* everywhere, starting with what you use least.";
  const L={lower:"Lower back: one of the most common aches there is. The right *strength* work helps most people.",
    neck:"Neck and shoulders: the desk ache. Short *resets* through the day help.",
    upper:"Upper back: usually a stiff spine and tired shoulders. We'll *open* it up.",
    hips:"Tight hips usually come from sitting. We'll *open* them up.",
    knees:"Knees mostly need stronger hips and thighs. That's in your *plan*.",
    wrists:"Wrists like strength and mobility. We'll train *both*."};
  const k=["lower","neck","upper","hips","knees","wrists"].find(x=>ids.includes(x));
  return L[k]||"Noted. Your plan trains the *weak links* behind it.";
}
async function uiStPainSay(alive,can){
  const r=await uiStPain(alive,can); if(r!=="ok"||!alive()) return r;
  await say(uiPainLine()); if(!alive()) return;
  await obWait(reduced?300:1100); return r;
}
async function uiStPain(alive,can){
  await say("Where does your body *complain*?"); if(!alive()) return;
  return new Promise(res=>{
    const sel=new Set(OBD.acheIds||[]); let none=!!OBD.noAche; const pend=new Set();
    const a=obAsk(`<p class="o2-p u-ob-sub">Tap all that apply, or tap the body.</p>
      <div class="u-ob-pain">${ACHES.map(x=>`<button class="u-ob-pc${sel.has(x.id)?" on":""}" data-a="${x.id}" aria-pressed="${sel.has(x.id)}"><span class="u-ob-pi">${UI_OB_IC[x.id]||UI_OB_IC.lower}</span><b>${x.name}</b></button>`).join("")}
        <button class="u-ob-pc wide${none?" on":""}" data-none="1" aria-pressed="${none}"><span class="u-ob-pi">${UI_OB_IC.strong}</span><b>Nothing aches, I just want to get stronger</b></button></div>
      <p class="u-ob-warn">${UI_OB_IC.info}<span>Sharp or numb pain? See a physio or GP first.</span></p>
      <button class="btn primary big" id="o2Ok">Continue</button>`);
    const regs=()=>[...new Set([...sel].flatMap(id=>ACHES.find(x=>x.id===id).regions))];
    /* the hairlines follow what is picked */
    const sync=()=>{ const want=new Set(regs()); [...pend].forEach(r=>{ if(!want.has(r)){ obStrikeOff(r); pend.delete(r); } }); want.forEach(r=>{ if(!pend.has(r)){ obStrike(r,{pending:true}); pend.add(r); } }); };
    const draw=()=>{ a.querySelectorAll("[data-a]").forEach(b=>{ const on=sel.has(b.dataset.a); b.classList.toggle("on",on); b.setAttribute("aria-pressed",on); });
      const nb=a.querySelector("[data-none]"); nb.classList.toggle("on",none); nb.setAttribute("aria-pressed",none);
      $("o2Ok").disabled=!sel.size&&!none; try{ Body.obAche(regs()); }catch(e){} sync(); };
    const toggle=id=>{ sel.has(id)?sel.delete(id):sel.add(id); none=false; Pulse.buzz(6); draw(); };
    a.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>toggle(b.dataset.a));
    a.querySelector("[data-none]").onclick=()=>{ none=!none; if(none) sel.clear(); Pulse.buzz(6); draw(); };
    /* tap the statue: the nearest ache within 44 px of where you tapped */
    const sp=$("o2Space"), tap=e=>{ if(!Body.project) return; const ar=$("app").getBoundingClientRect(); let best=null, bd=44;
      ACHES.forEach(x=>{ const c=rkCen(x.regions[0]); if(!c) return; [1,-1].forEach(sg=>{ const p=Body.project([c[0]*sg,c[1],c[2]]); if(!p) return; const d=Math.hypot(p.x+ar.left-e.clientX,p.y+ar.top-e.clientY); if(d<bd){ bd=d; best=x.id; } }); });
      if(best){ e.stopPropagation(); toggle(best); } };
    if(sp){ sp.style.pointerEvents="auto"; sp.onclick=tap; }
    const off=()=>{ if(sp){ sp.onclick=null; sp.style.pointerEvents=""; } };
    backable(can,a,v=>{ off(); [...pend].forEach(r=>obStrikeOff(r)); res(v); });
    $("o2Ok").onclick=()=>{ off(); obBackOn(null); OBD.acheIds=[...sel]; OBD.aches=regs(); OBD.noAche=none;
      try{ lightSys("nerve"); }catch(e){} Music.accent&&Music.accent("answer"); a.innerHTML="";
      const R=regs(); if(none||!R.length) obStrike("core",{tag:"Core"});
      else R.forEach((r,j)=>setTimeout(()=>obStrike(r,{tag:j===0?(REGIONS[r]&&REGIONS[r].name):null}),j*180));
      res("ok"); };
    draw();
  });
}
/* ---------- Your body · 3, 4 · does this sound like you? ---------- */
async function uiStRelate(alive,can,i){
  const R=UI_REL[i];
  await say("Does this sound like *you*?"); if(!alive()) return;
  const v=await new Promise(res=>{
    const a=obAsk(`<div class="u-ob-rel"><span class="u-ob-relic">${UI_OB_IC.quote}</span><p class="u-ob-relq">${R.q}</p></div>
      <div class="u-ob-yn"><button class="u-ob-card" data-v="no"><b>No</b></button><button class="u-ob-card" data-v="yes"><b>Yes</b></button></div>`);
    uiObPick(a,can,res,520);
  });
  if(!alive()||v==="__back") return v;
  OBD[R.k]=v==="yes";
  if(i===0) obStrike("arms",{tag:"Arms"});
  else { const s=rkS(), r=["chest","upperback","lowerback"].find(x=>!s.F.some(f=>f.id===x&&f.w>0)); obStrike(r||"chest",r?{tag:REGIONS[r].name}:{reach:0.12}); }
  await say(OBD[R.k]?R.yes:R.no); if(!alive()) return;
  await obWait(reduced?300:1100);
  return v;
}
/* ---------- Your body · 5 · how your body talks to you (the head opens down to the jaw) ---------- */
async function uiStTone(alive,can){
  await say("How should your body *talk* to you?"); if(!alive()) return;
  const v=await new Promise(res=>{
    const a=obAsk(`<div class="u-ob-tone" role="radiogroup">${UI_TONE.map(([v,t,s,q])=>`<button class="u-ob-tc u-ob-card${OBD.tone===v?" sel":""}" data-v="${v}" role="radio" aria-checked="${OBD.tone===v}"><span class="u-ob-tch"><b>${t}</b><small>${s}</small></span><span class="u-ob-tq">${UI_OB_IC.quote}<span>${q}</span></span></button>`).join("")}</div>
      <p class="o2-hint">You can switch any time.</p>`);
    uiObPick(a,can,res,420);
  });
  if(!alive()||v==="__back") return v;
  OBD.tone=v; obStrike("head",{reach:0.16,tag:"Voice"});
  await say(v==="drill"?"Fine. No more *excuses*.":"Kind and steady it is. I'll keep you *going*."); if(!alive()) return;
  await obWait(reduced?300:900); return v;
}

/* ---------- Your week · 1 · days (each tap runs light through the seams; Continue frees the legs) ---------- */
async function uiStDays(alive,can){
  await say("Which days could you *train*?"); if(!alive()) return;
  return new Promise(res=>{
    const sel=new Set(OBD.days&&OBD.days.length?OBD.days:[0,2,4]), DL=["M","T","W","T","F","S","S"];
    const a=obAsk(`<p class="o2-p u-ob-sub">Pick the days that usually work.</p>
      <div class="o2-days u-ob-days">${DL.map((d,i)=>`<button class="o2-day${sel.has(i)?" on":""}" data-i="${i}" aria-label="${DAYN[i]}" aria-pressed="${sel.has(i)}"><span>${d}</span></button>`).join("")}</div>
      <p class="o2-hint" id="o2DaysN"></p>
      <button class="btn primary big" id="o2Ok">Continue</button><button class="o2-link u-ob-skip" id="o2NoDays">Not sure yet</button>`);
    backable(can,a,res);
    const upd=()=>{ const n=sel.size; $("o2DaysN").textContent=n?`${n} day${n>1?"s":""} a week${n>5?" · we'll keep one easy":""}`:"Tap the days that usually work for you"; $("o2Ok").disabled=!n; };
    a.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.i; sel.has(i)?sel.delete(i):sel.add(i); b.classList.toggle("on",sel.has(i)); b.setAttribute("aria-pressed",sel.has(i)); Pulse.buzz(5); obRockTint("--glow-soft",180); upd(); });
    const go=days=>{ obBackOn(null); OBD.days=days; const n=days.length; OBD.activity=n===0?"rare":n<=2?"1-2":n<=4?"3-4":"5+";
      try{ lightSys("mus"); }catch(e){} Music.accent&&Music.accent("answer"); a.innerHTML=""; obStrike("thighs",{reach:0.08+0.012*n,tag:"Legs"}); res(n); };
    $("o2Ok").onclick=()=>go([...sel].sort());
    $("o2NoDays").onclick=()=>go([]);
    upd();
  });
}
/* ---------- Your week · 2 · where ---------- */
async function uiStKit(alive,can){
  await say("Where will you *train*?"); if(!alive()) return;
  const v=await new Promise(res=>{ const a=obAsk(uiObCards(UI_KIT.map(([v,t,s])=>({v,t,s,on:OBD.kit===v})))); uiObPick(a,can,res); });
  if(!alive()||v==="__back") return v;
  OBD.kit=v; obStrike("core",{reach:0.11,tag:"Core"}); return v;
}
/* ---------- Your week · 3 · age ---------- */
async function uiStAge(alive,can){
  await say("How old are *you*?"); if(!alive()) return;
  return new Promise(res=>{
    let age=OBD.age||28;
    const a=obAsk(`<p class="o2-p u-ob-sub">It helps set your recovery.</p>
      <div class="o2-age u-ob-age"><button data-d="-1" aria-label="Younger">−</button><label><input id="o2AgeIn" inputmode="numeric" value="${age}" aria-label="Age in years"><small>years</small></label><button data-d="1" aria-label="Older">+</button></div>
      <button class="btn primary big" id="o2Ok">Continue</button>`);
    backable(can,a,res);
    const inp=$("o2AgeIn"), setAge=n=>{ const was=age; age=Math.max(13,Math.min(100,Math.round(n)||28)); inp.value=age;
      if(age!==was&&inp.animate&&!reduced) inp.animate([{transform:`translateY(${age>was?8:-8}px)`,opacity:.3},{transform:"none",opacity:1}],{duration:200,easing:"cubic-bezier(.2,.8,.2,1)"}); };
    a.querySelectorAll("[data-d]").forEach(b=>{ let rep=0; const go=()=>{ setAge(age+ +b.dataset.d); Pulse.buzz(4); };
      b.onpointerdown=e=>{ e.preventDefault(); go(); rep=setTimeout(function r(){ go(); rep=setTimeout(r,70); },420); };
      b.onpointerup=b.onpointerleave=b.onpointercancel=()=>clearTimeout(rep); });
    inp.onfocus=()=>inp.select(); inp.onchange=()=>setAge(parseInt(inp.value,10));
    $("o2Ok").onclick=()=>{ setAge(parseInt(inp.value,10)); inp.blur(); obBackOn(null); OBD.age=age; Music.accent&&Music.accent("answer"); a.innerHTML=""; res("ok"); };
  });
}
/* ---------- Your week · 4 · sitting: the more you sit, the bigger the break at the hips ---------- */
async function uiStSit(alive,can){
  await say("How many hours do you *sit*, most days?"); if(!alive()) return;
  const v=await new Promise(res=>{ const a=obAsk(`<p class="o2-p u-ob-sub">Your best guess is fine.</p>${uiObCards(UI_SIT.map(([v,t])=>({v,t,on:OBD.sit===v})),"grid2")}`); uiObPick(a,can,res); });
  if(!alive()||v==="__back") return v;
  OBD.sit=v; obStrike("glutes",{reach:{lt4:0.07,"4-6":0.09,"6-8":0.11,"8+":0.13}[v]||0.09,tag:"Hips"});
  try{ lightSys("heart"); Body.obAche(OBD.aches||[]); }catch(e){}
  return v;
}

/* ---------- reading your body: the cracks spread by themselves, the systems light through the holes ---------- */
async function uiObRead(alive){
  obBackOn(null); uiObClear();
  const o2=$("o2"); if(o2) o2.classList.add("ob-read");
  const L=["Reading your body…","Mapping your weak links…","Choosing your exercises…","Calibrating your ranks…"], T=[0.20,0.21,0.22,0.23], order=["heart","brain","mus","sleep","gut","nerve"];
  const a=obAsk(`<div class="u-ob-read" role="status" aria-live="polite"><p id="uObReadL">${L[0]}</p><span class="u-ob-readbar"><i id="uObReadB"></i></span></div>`);
  const st=$("stage"); if(st&&!reduced) st.classList.add("rk-hum");
  try{ Body.obSet({rim:1,body:0.45,hull:0.55,ring:1}); }catch(e){}
  if(!reduced&&Body.camTo){ setTimeout(()=>{ if(alive()) Body.camTo({zoom:1,px:0,py:0,yaw:Math.PI*0.5},0.9); },900); setTimeout(()=>{ if(alive()) Body.camTo({zoom:1,px:0,py:0,yaw:0},0.9); },2200); }
  requestAnimationFrame(()=>{ const b=$("uObReadB"); if(b) b.style.width="100%"; });
  for(let i=0;i<L.length;i++){
    if(!alive()) break;
    const l=$("uObReadL"); if(l&&i){ l.textContent=L[i]; fxReplay(l,"in"); }
    obRock(T[i],{quiet:true}); if(!reduced){ Pulse.buzz(4); rkChips(8,{}); }
    order.slice(Math.floor(i*1.5),Math.floor((i+1)*1.5)).forEach(s=>{ try{ Body.obSet(SYS_LEVEL[s]); }catch(e){} });
    await obWait(reduced?250:1000);
  }
  if(st) st.classList.remove("rk-hum");
  OBX.R=uiObReport(); OBX.P=uiObProjData();
  try{ Pulse.chime(4); }catch(e){} Pulse.buzz([10,60,20]);
  if(o2) o2.classList.remove("ob-read"); if(alive()) a.innerHTML="";
}
/* the report, from only what you told us */
function uiObReport(){
  const R=obReportData(), F=[], names=(OBD.acheIds||[]).map(id=>ACHES.find(x=>x.id===id).name.toLowerCase());
  if(names.length) F.push({c:"var(--danger)",t:`Your ${names.slice(0,2).join(" and ")} point to a weak link in your ${R.chain.name.toLowerCase()}.`});
  if(OBD.sit==="6-8"||OBD.sit==="8+") F.push({c:"var(--amber)",t:"Long hours sitting tighten your hips and chest. Short resets through the day will help."});
  if(OBD.quit) F.push({c:"var(--glow)",t:"Sessions stay short, and planned rest days never break your streak. That's how this one sticks."});
  F.push({c:"var(--mind)",t:`${R.goal.name} starts with your ${R.chain.name.toLowerCase()}. That's where your plan focuses first.`});
  return {...R,findings:F.slice(0,3)};
}
/* your weak link's rank in a few weeks, from the same points the app uses */
function uiObProjData(){
  const days=Math.max(1,(OBD.days||[]).length||3), per=Math.max(1,Math.round(days*2/3)), pts=[0];
  let x=0; for(let w=1;w<=12;w++){ for(let j=0;j<per;j++) x+=rkGainPer(x); pts.push(Math.min(100,x)); }
  const top=rankTier(pts[12]); let wk=12; for(let w=0;w<=12;w++){ if(rankTier(pts[w])>=top){ wk=w; break; } }
  const when=new Date(Date.now()+Math.max(1,wk)*7*864e5).toLocaleDateString("en-GB",{day:"numeric",month:"short"});
  return {days,per,pts,top,wk,when};
}
/* ---------- the report: four story cards (tap to go on, the left third to go back) ---------- */
async function uiObStory(alive,can){
  const R=OBX.R||(OBX.R=uiObReport()), P=OBX.P||(OBX.P=uiObProjData());
  const hrs={lt4:3,"4-6":5,"6-8":7,"8+":9}[OBD.sit]||5, yr=hrs*365, dys=Math.round(yr/24);
  const nm=(OBD.name||"").trim(), chain=R.chain, area=chain.name.toLowerCase(), wk=Math.max(1,P.wk||12), n=P.days;
  const aches=(OBD.acheIds||[]).map(id=>ACHES.find(x=>x.id===id)).filter(Boolean).map(x=>x.name.toLowerCase());
  const cards=[
    {h:`${nm?`${uiEsc(nm)}, we've`:"We've"} read your body.`,p:"Some hard news, and some good news."},
    {eye:"The hard news",pre:`Every year, at about ${hrs} hours a day, you sit for`,big:`${yr.toLocaleString("en-GB")} hours`,cold:true,p:`That's ${dys} whole days in a chair.`,foot:`From your answer: about ${hrs} hours a day, × 365.`},
    {eye:"Your weak link",title:chain.name,p:aches.length?`Your ${uiEsc(aches.slice(0,2).join(" and "))} point to it. When one link is weak, the others take the strain.`:`${uiEsc(obGoals()[0].name)} starts here. When one link is weak, the others take the strain.`},
    {eye:"The good news",pre:`Train ${n} time${n>1?"s":""} a week and your ${uiEsc(area)} reaches`,big:`${wk} week${wk>1?"s":""}`,p:`to <b style="color:var(--rk-${P.top})">${RANKS[P.top][1]}</b>, by ${P.when}. Ranks never drop.`,foot:`Worked out from Ossa's rank points if you train ${n} time${n>1?"s":""} a week. Your pace may vary.`}];
  uiObClear();
  const o2=$("o2"); if(o2) o2.classList.add("ob-story");
  return new Promise(res=>{
    let k=-1, gone=false; const a=$("o2Act"), seg=$("uObSeg"), eye=$("uObEye");
    const done=()=>{ gone=true; if(o2){ o2.removeEventListener("click",tap); o2.classList.remove("ob-story"); } try{ obRockTint(null); }catch(e){} };
    const show=j=>{ if(gone) return; const fwd=j>k; k=j; const c=cards[j];
      if(seg){ seg.hidden=false; seg.innerHTML=cards.map((_,x)=>`<i class="${x<j?"on":x===j?"now":""}"></i>`).join(""); } if(eye) eye.hidden=true;
      a.innerHTML=`<div class="u-ob-story">${c.eye?`<span class="u-ob-se">${c.eye}</span>`:""}${c.h?`<h2 class="u-ob-sh">${c.h}</h2>`:""}${c.title?`<h2 class="u-ob-stt">${uiEsc(c.title)}</h2>`:""}
          ${c.pre?`<p class="u-ob-sp">${c.pre}</p>`:""}${c.big?`<b class="u-ob-big${c.cold?" cold":""}">${c.big}</b>`:""}${c.p?`<p class="u-ob-sp">${c.p}</p>`:""}${c.foot?`<p class="u-ob-foot">${c.foot}</p>`:""}</div>
        ${j===cards.length-1?`<button class="btn primary big" id="o2Ok">Continue</button>`:`<p class="u-ob-tap">Tap to continue</p>`}`;
      obBackOn(()=>{ if(k>0) show(k-1); else { done(); a.innerHTML=""; res("__back"); } });
      if(fwd){
        if(j===1){ obRockTint("--text-3",0); try{ Body.obSet({rim:0.25}); }catch(e){} Pulse.buzz(20); }
        if(j===2){ obRockTint(null); try{ Body.obSet({rim:0.6}); Body.obAche(chain.regions); }catch(e){}
          chain.regions.forEach((r,x)=>setTimeout(()=>obStrike(r,{reach:0.10,tag:x?null:chain.name}),x*160));
          if(chain.id==="posterior"&&Body.camTo&&!reduced) Body.camTo({zoom:1,px:0,py:0,yaw:Math.PI},0.9); }
        if(j===3){ if(Body.camTo&&!reduced) Body.camTo({zoom:1,px:0,py:0,yaw:0},0.9); try{ Body.obSet({rim:1}); Pulse.chime(4); }catch(e){} obRock(0.27); }
      }
      if(j===cards.length-1) $("o2Ok").onclick=e=>{ e.stopPropagation(); done(); obBackOn(null); Pulse.buzz(10); Music.accent&&Music.accent("answer"); a.innerHTML=""; res("ok"); };
    };
    const tap=e=>{ if(gone||e.target.closest("button,input,a,.pw")) return; const r=o2.getBoundingClientRect();
      if(e.clientX-r.left<r.width/3){ if(k>0){ Pulse.buzz(5); show(k-1); } } else if(k<cards.length-1){ Pulse.buzz(5); show(k+1); } };
    if(o2) o2.addEventListener("click",tap);
    show(0);
  });
}
/* ---------- Your plan · 1 · what Ossa can do for you this week ---------- */
async function uiObPlan(alive,can){
  const R=OBX.R||(OBX.R=uiObReport());
  await say("This week, based on your answers, Ossa can help you:"); if(!alive()) return;
  const n=(OBD.days||[]).length, kit=OBD.kit||"bw", area=R.chain.name.toLowerCase();
  const exp=OBD.activity==="5+"||OBD.activity==="3-4"?"some":"new", focus={muscle:"balanced",posture:"back",strength:"lower",feel:"balanced"}[OBD.goal]||"balanced";
  let week=[]; try{ const prog=genPlan({days:R.days,exp,kit,mins:45,focus}); const picked=(OBD.days||[]).slice().sort(), ss=prog.week.filter(Boolean);
    if(picked.length===ss.length){ const wk=Array(7).fill(null); picked.forEach((d,j)=>wk[d]=ss[j]); prog.week=wk; }
    week=prog.week.map((d,i)=>({d:["M","T","W","T","F","S","S"][i],t:d?d.title:"Rest",on:!!d})); }catch(e){ week=[]; }
  const sess=week.filter(w=>w.on).length||n||3;
  const rows=[
    n?`<b>${sess}</b> short sessions, ${kit==="gym"?"built for the gym":kit==="db"?"for dumbbells at home":"anywhere, no kit"}`:`<b>${sess}</b> short sessions, on the days that suit you`,
    `<b>1</b> weak link first: your ${uiEsc(area)}`,
    OBD.sit==="6-8"||OBD.sit==="8+"?`<b>2</b> quick resets a day for your hips`:`<b>${Math.max(0,7-sess)}</b> rest days that never break your streak`,
    OBD.form?`<b>0</b> guesswork: every exercise lights up on your body`:OBD.quit?`<b>12</b> weeks of short sessions, built to stick`:`<b>5</b> ranks for every muscle to climb`];
  return new Promise(res=>{
    const a=obAsk(`<ul class="u-ob-plan">${rows.map((r,i)=>`<li style="--k:${i}"><span class="u-ob-pk">${UI_IC.check}</span><span>${r}</span></li>`).join("")}</ul>
      ${week.length?`<div class="u-ob-wkp" aria-label="Your week">${week.map(w=>`<span class="${w.on?"on":""}"><b>${w.d}</b><small>${uiEsc(w.on?w.t:"Rest")}</small></span>`).join("")}</div>`:""}
      <button class="btn primary big" id="o2Ok">Continue</button>`);
    backable(can,a,res);
    $("o2Ok").onclick=()=>{ obBackOn(null); Pulse.buzz(10); Music.accent&&Music.accent("answer"); a.innerHTML=""; res("ok"); };
  });
}
/* ---------- Your plan · 2 · seal it: hold the stone; when the ring closes, the upper body bursts free ---------- */
async function uiStPromise(alive,can){
  await say("Let's *seal* it."); if(!alive()) return;
  return new Promise(res=>{
    const n=(OBD.days||[]).length||3, foc=((OBX.R&&OBX.R.chain&&OBX.R.chain.name)||"body").toLowerCase(), nm=(OBD.name||"").trim();
    const a=obAsk(`<div class="u-ob-pact"><p>I${nm?`, <b>${uiEsc(nm)}</b>,`:""} will train <b>${n} time${n>1?"s":""} a week</b>, stop ignoring my <b>${uiEsc(foc)}</b>, and show up even on the days I don't feel like it.</p></div>
      <div class="u-ob-sign"><button class="u-ob-seal" id="o2Fp" aria-label="Press and hold to seal it"><svg class="u-ob-sealr" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" class="hb"/><circle cx="50" cy="50" r="46" class="hf" id="o2FpR"/></svg><i aria-hidden="true"></i></button>
        <p class="o2-hint" id="o2FpH">Press and hold</p></div>
      <button class="o2-link u-ob-skip" id="o2FpNo">Not now</button>`);
    backable(can,a,res);
    const b=$("o2Fp"), ring=$("o2FpR"), st=$("stage"), D=reduced?400:1300; let p=0, held=false, last=0, raf=0, done=false;
    const loop=now=>{ const dt=Math.min(0.05,(now-(last||now))/1000); last=now;
      p=Math.max(0,Math.min(1,p+(held?dt*1000/D:-dt*2))); ring.style.strokeDashoffset=(289*(1-p)).toFixed(1);
      if(held&&Math.random()<0.25) Pulse.buzz(3);
      if(p>=1&&!done){ done=true; held=false; obBackOn(null); b.classList.add("done"); if(st) st.classList.remove("rk-hum"); obRockTint(null);
        obRock(0.58); try{ rkChips(60,{at:rkS().heart,r:0.3}); Body.obBeat(); Pulse.chime(5); }catch(e){} Pulse.buzz([18,60,30]); Music.accent&&Music.accent("answer");
        OBD.commit={at:dkey(0),weeks:12,days:n}; track("promise_signed",{days:n});
        setTimeout(async()=>{ a.innerHTML=""; await say(nm?`Sealed. I'll hold you to it, *${nm}*.`:"Sealed. I'll hold you to *it*."); await obWait(reduced?200:700); res("ok"); },450); return; }
      if(p>0||held) raf=requestAnimationFrame(loop); else raf=0; };
    const down=e=>{ e.preventDefault(); if(done) return; held=true; b.classList.add("on"); $("o2FpH").textContent="Keep holding…"; if(st&&!reduced) st.classList.add("rk-hum"); obRockTint("--glow-soft",0); last=0; if(!raf) raf=requestAnimationFrame(loop); };
    const up=()=>{ if(done) return; held=false; b.classList.remove("on"); if(st) st.classList.remove("rk-hum"); obRockTint(null); if(p>0.02) $("o2FpH").textContent="Hold until the ring closes"; };
    b.addEventListener("pointerdown",down); ["pointerup","pointerleave","pointercancel"].forEach(t=>b.addEventListener(t,up));
    b.addEventListener("contextmenu",e=>e.preventDefault());
    b.addEventListener("keydown",e=>{ if((e.key==="Enter"||e.key===" ")&&!done){ e.preventDefault(); p=1; held=true; last=0; if(!raf) raf=requestAnimationFrame(loop); } });
    $("o2FpNo").onclick=()=>{ obBackOn(null); Pulse.buzz(6); OBD.commit=null; obRock(0.58,{quiet:true}); rkChips(15,{}); a.innerHTML=""; res("skip"); };
  });
}
/* ---------- Your plan · 3 · Pro (the hard paywall). Its Back comes back to the seal. ---------- */
function uiStPaywall(alive){
  if(isPro()){ uiObCommit(); return Promise.resolve("paid"); }
  return new Promise(res=>{ uiPwBack.res=res; paywall(); });
}
function uiPwBack(pw){
  const res=uiPwBack.res; if(!res) return; uiPwBack.res=null;
  Pulse.buzz(8); if(pw){ pw.classList.remove("on"); setTimeout(()=>{ try{ pw.remove(); }catch(e){} },reduced?0:300); }
  const lo=$("o2Low"); if(lo) lo.classList.remove("gone"); const sy=$("o2Sys"); if(sy) sy.classList.remove("up"); const o=$("o2"); if(o) o.classList.remove("pwon");
  try{ obFrame(); }catch(e){} res("__back");
}
/* bought (or restored): S is written now, the sheet slides away, and the body is freed on the next screen */
function uiObPaid(pw,o){
  const res=uiPwBack.res; uiPwBack.res=null; OBX.restored=!!(o&&o.restored);
  uiObCommit();
  if(pw){ pw.classList.remove("on"); setTimeout(()=>{ try{ pw.remove(); }catch(e){} },reduced?0:300); }
  const lo=$("o2Low"); if(lo) lo.classList.remove("gone"); const sy=$("o2Sys"); if(sy) sy.classList.remove("up"); const o2=$("o2"); if(o2) o2.classList.remove("pwon");
  try{ obFrame(); }catch(e){}
  if(res) res("paid"); else finishOnboarding(false);
}
/* the "write S" half of finishOnboarding, at purchase, so a quit during the reveal still opens onboarded */
function uiObCommit(){
  try{
    if(OBD.body) S.body=OBD.body; else if(!S.body) S.body="m";
    if(OBD.name) S.name=OBD.name;
    const {chain,top}=obFocus();
    S.goal=OBD.goal||S.goal||null; S.goals=(OBD.goals&&OBD.goals.length)?OBD.goals.slice():(S.goals||null); S.flagged=OBD.aches||[]; S.focus={chain:chain.id,regions:top};
    S.profile={age:OBD.age,activity:OBD.activity,sleep:OBD.sleep,sleepH:OBD.sleepH,diet:OBD.diet,stress:OBD.stress,kit:OBD.kit,days:OBD.days,sit:OBD.sit,quit:!!OBD.quit};
    if(OBD.commit) S.commit=OBD.commit;
    if(OBX.R){ S.startScore=OBX.R.score; S.target=OBX.R.target; }
    if(OBX.prog&&!S.program){ S.program=OBX.prog; try{ applyProgram(); TR.custom=false; TR.day=todayIdx; TR.session=sessionForDay(todayIdx); }catch(e){} }
    if(OBD.tone==="drill"||OBD.tone==="coach"){ S.dares=S.dares||{scale:1}; S.dares.tone=OBD.tone; }
  }catch(e){ console.warn("Ossa: onboarding commit",e); }
  delete S.obIn; save();
}
/* ---------- free your body: one tap breaks the last of the stone ---------- */
async function uiObFree(alive){
  obBackOn(null); uiObClear();
  const trial=!!(S.pro&&S.pro.trial), nm=(OBD.name||S.name||"").trim(), eye=$("uObEye"), seg=$("uObSeg");
  if(seg){ seg.hidden=true; seg.innerHTML=""; }
  if(eye){ eye.hidden=false; eye.textContent=OBX.restored?"Welcome back":trial?"Your free week has started":"You're in"; }
  return new Promise(res=>{
    const a=obAsk(`<button class="u-ob-free" id="uObFree" aria-label="Free your body"><span>Tap to free your body</span></button>`);
    const sp=$("o2Space"); let done=false;
    const go=()=>{ if(done||!alive()) return; done=true; if(sp){ sp.onclick=null; sp.style.pointerEvents=""; }
      obRockFinal(); try{ Body.obSet({rim:1,body:0.5,heart:1,org:1}); Pulse.audio(); Pulse.chime(5); }catch(e){}
      const o2=$("o2"); if(o2) o2.classList.add("ob-free");
      a.innerHTML="";
      setTimeout(()=>{ if(!alive()) return;
        a.innerHTML=`<div class="u-ob-form"><b class="u-ob-impact">First form</b><p class="u-ob-sp">${nm?`${uiEsc(nm)} · `:""}every muscle Unranked</p>
            <div class="u-ob-stones" aria-hidden="true">${[1,2,3,4,5].map(t=>`<i style="--c:var(--rk-${t})"></i>`).join("")}</div>
            <p class="u-ob-foot">Your first rank unlocks after one session.</p></div>
          <button class="btn primary big u-ob-free-cta" id="o2Ok">Continue</button>`;
        $("o2Ok").onclick=()=>{ Pulse.buzz(10); a.innerHTML=""; res("ok"); }; },reduced?300:1600);
      track("onboarding_step",{id:"freed",v:2}); };
    $("uObFree").onclick=go; if(sp){ sp.style.pointerEvents="auto"; sp.onclick=go; }
  });
}
/* ---------- the reminder (after Pro, so only subscribers get the iOS prompt) ---------- */
async function obRemind(alive){
  const eye=$("uObEye"); if(eye){ eye.hidden=true; }
  await say("When should I *nudge* you?"); if(!alive()) return;
  return new Promise(res=>{
    const T=[["morning","Morning","07:30"],["lunch","Lunchtime","12:30"],["evening","Evening","18:30"]];
    let pick="evening";
    const a=obAsk(`<p class="o2-p u-ob-sub">One nudge on your training days. Nothing else.</p>${uiObCards(T.map(([v,t,h])=>({v,t,s:h,on:v===pick})))}
      <button class="btn primary big u-ob-free-cta" id="o2RemOk">Remind me</button><button class="o2-link u-ob-skip" id="o2NoRem">Not now</button>`);
    a.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{ pick=b.dataset.v; a.querySelectorAll("[data-v]").forEach(x=>{ x.classList.toggle("sel",x===b); x.setAttribute("aria-pressed",x===b); }); Pulse.buzz(5); });
    $("o2RemOk").onclick=()=>{ const t=T.find(x=>x[0]===pick); OBD.remind={slot:pick,time:t[2]}; Pulse.buzz(10); if(NATIVE.on) nsend({t:"remind",on:true,list:[],ask:true}); a.innerHTML=""; res("ok"); };
    $("o2NoRem").onclick=()=>{ OBD.remind=null; a.innerHTML=""; res("ok"); };
  });
}
/* ---------- day one: your week as uncut stones ---------- */
async function uiObDay1(alive){
  uiObClear(); const eye=$("uObEye"); if(eye){ eye.hidden=false; eye.textContent="Your week"; }
  return new Promise(res=>{
    const days=OBD.days&&OBD.days.length?OBD.days:[0,2,4];
    const a=obAsk(`<div class="u-ob-day1"><b class="u-ob-impact big">Day 1</b>
        <div class="u-ob-wk1" aria-label="Your training days">${["M","T","W","T","F","S","S"].map((d,i)=>`<span class="${days.includes(i)?"tr":""}${i===todayIdx?" now":""}"><i></i><small>${d}</small></span>`).join("")}</div>
        <p class="u-ob-sp">Each session breaks one open.</p></div>
      <button class="btn primary big u-ob-free-cta" id="o2Ok">Enter my body</button>`);
    $("o2Ok").onclick=()=>{ Pulse.buzz(12); res("ok"); };
  });
}
/* the finish: the intro is done, the stone comes out of the shader */
(()=>{ const _f=finishOnboarding; finishOnboarding=function(){ delete S.obIn; try{ obRockStop(); }catch(e){} try{ const st=$("stage"); if(st) st.classList.remove("rk-hum"); }catch(e){} return _f.apply(this,arguments); }; })();


/* =========================================================
   THE PAYWALL — what you get today, when we remind you, when billing starts.
   Prices, the free week and eligibility come from the App Store (proOffer); nothing here is hard-coded
   except the browser-preview fallback in web/ossa.html (PRO_FALLBACK), which a phone never shows as a price:
   until the App Store answers (o.loading) or when it can't (o.stale), the prices are hidden and the button waits.
   Ossa 2.0 Phase 5 (Evolve): proPerks() is the one list of what Pro adds; the in-app sheet shows the three
   new materials under the label "Vault" (only when this phone can draw them: vtOn() in vault.js, never on the
   onboarding paywall); openPaywall moved here from web/ossa.html. 18 Oct: no free tier, so no "Not now" (web/ui/gate.js).
   ========================================================= */
/* what Pro adds: the single source for every Pro list. o.where==="onboarding", or a phone that can't draw
   the materials (vtOn() false), gets the first two only. Never a plan length, "weights that progress", ads or experts. */
function proPerks(o){
  o=o||{};
  const L=proPerks.L||(proPerks.L=[
    {id:"plan",t:"Your training plan",s:"Built from your answers: four build weeks, then a lighter one"},
    {id:"fixes",t:"Fixes in every week",s:"Your weakest body-check and posture results, worked in"},
    {id:"mats",t:"Three new materials",s:"Obsidian, Chrome and Carbon fibre for your whole body"}]);
  const vt=o.where!=="onboarding"&&uiSafe(()=>typeof vtOn==="function"&&vtOn(),false);
  return L.slice(0,vt?3:2).map(p=>({...p}));
}
/* the App Store's offerings, one request at a time: the paywall and the lock screen share a request in flight
   (proOffer's iapAsk keeps one waiter per key, so a second call would orphan the first) */
function pwOffer(){
  if(!pwOffer.p) pwOffer.p=Promise.resolve().then(()=>proOffer()).catch(e=>{ console.warn("Ossa: offerings",e); return null; }).then(x=>{ pwOffer.p=null; return x; });
  return pwOffer.p;
}
/* the plan you just built, in one line of chips (Runna, Luvu and Foodvisor sum it up right before the price) */
function uiPwSummary(ctx){
  const n=(OBD.days||[]).length, kit={gym:"Gym",db:"Dumbbells",bw:"Bodyweight"}[OBD.kit||"bw"], area=ctx.chain||(OBX.R&&OBX.R.chain&&OBX.R.chain.name)||"";
  const chips=[n?`${n}× a week`:"Flexible days",kit,area?`${area} first`:"",OBD.tone==="drill"?"Drill voice":"Coach voice"].filter(Boolean);
  return `<div class="u-pw-sum" aria-label="Your plan">${chips.map(c=>`<span>${uiEsc(c)}</span>`).join("")}</div>`;
}
/* ctx: {where, eye, head, close?, later?, done, preview?, days?, chain?, plan?, mat?} (mat: the Vault id to ring) */
function pwMount(pw,ctx){
  let plan=ctx.plan||"year", o=IAP.cur||(iapLive()?{...PRO_FALLBACK,loading:true}:PRO_FALLBACK);
  const live=()=>pw.isConnected&&!!pw.querySelector("#pwGo");   // false once something else has drawn over it
  const draw=()=>{
    if(!o[plan]) plan=o.year?"year":"month";
    const wait=!!(o.loading||o.stale), Y=o.year, M=o.month, tr=wait?"":trialTxt(Y), trial=plan==="year"&&!!tr;
    const inApp=ctx.where!=="onboarding", vt=inApp&&uiSafe(()=>typeof vtOn==="function"&&vtOn(),false);
    const days=tr==="7 days"?[["Today",vt?"Your plan, fixes in every week and three new materials.":"Your plan and fixes in every week."],["Day 5","We remind you before your free week ends."],["Day 7",`${Y.priceString} a year starts. Cancel any time before.`]]:null;
    const off=!tr&&!wait&&Y&&M&&Y.currency===M.currency&&M.price>0?Math.floor((1-Y.price/(12*M.price))*100):0;
    const mats=vt&&typeof vtMats==="function"?uiSafe(()=>vtMats(),[]):[];
    const radio=on=>`<span class="u-pw-rad${on?" on":""}" aria-hidden="true"><i></i></span>`;
    pw.classList.toggle("pw-wait",wait);
    pw.innerHTML=`${ctx.close?`<button class="pw-x" id="pwX" aria-label="Close">×</button>`:""}${ctx.back?`<button class="pw-back" id="pwBack" aria-label="${inApp?"Back":"Back to your promise"}">${UI_IC.back}</button>`:""}
    <div class="pw-eye"><i></i>${ctx.eye}</div>
    <h2 class="pw-h">${inApp?ctx.head:"Unlock your whole body."}</h2>
    ${inApp?"":uiPwSummary(ctx)}
    ${trial&&days?`<ol class="u-pw-tl" aria-label="How your free week works">${inApp?"":`<li class="u-pw-done"><span class="u-pw-dot">${UI_IC.check}</span><span><b>Body read</b><small>You've started. Your plan is built.</small></span></li>`}${days.map(([d,t],i)=>`<li class="${i?"":"u-pw-now"}"><span class="u-pw-dot">${i===0?`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0"/></svg>`:i===1?`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15zM10 20.5h4"/></svg>`:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M3.5 10h17"/></svg>`}</span><span><b>${d}</b><small>${t}</small></span></li>`).join("")}</ol>`
      :`<ul class="pw-f u-pw-perks">${proPerks({where:ctx.where}).map(p=>`<li><b>${p.t}</b><small>${p.s}</small></li>`).join("")}</ul>`}
    ${mats.length?`<div class="vt-pw"><span class="u-eyebrow vt-pw-eye">Vault</span><div class="vt-pw-row">${mats.map(m=>`<figure class="vt-pw-m${ctx.mat===m.id?" on":""}"><span class="vt-pw-c" role="img" aria-label="${uiEsc(m.name)}" data-vt="${m.id}" style="--c:var(${m.tok})"></span><figcaption>${uiEsc(m.name)}</figcaption></figure>`).join("")}</div><p class="vt-pw-p">Earned finishes and prestige materials stay free.</p></div>`:""}
    ${ctx.preview&&ctx.preview.length?`<div class="pw-wk">${ctx.preview.map(x=>`<div class="${x.on?"on":""}"><span>${x.d}</span><b>${x.on?x.t.replace(/^Full body/,"Full"):"Rest"}</b>${x.on?`<i class="lk"><svg viewBox="0 0 12 12"><rect x="2.5" y="5.5" width="7" height="5" rx="1.2"/><path d="M4 5.5V4a2 2 0 0 1 4 0v1.5"/></svg></i>`:""}</div>`).join("")}</div>`:""}
    <div class="u-pw-plans" role="radiogroup" aria-label="Plan">
      ${Y?`<button class="u-pw-plan${plan==="year"?" sel":""}" data-p="year" role="radio" aria-checked="${plan==="year"}">${radio(plan==="year")}<span class="u-pw-pt"><b>Yearly</b>${wait?"":`<small>${tr?`${tr} free, then `:""}${Y.priceString} a year</small>`}</span>${wait?"":`<span class="u-pw-pr"><b>${Y.priceString}</b><small>${perWeek(Y)?`${perWeek(Y)} a week`:"a year"}</small></span>`}<em class="u-pw-badge">${tr?"Free week":off>0?`Save ${off}%`:"Best value"}</em></button>`:""}
      ${M?`<button class="u-pw-plan${plan==="month"?" sel":""}" data-p="month" role="radio" aria-checked="${plan==="month"}">${radio(plan==="month")}<span class="u-pw-pt"><b>Monthly</b>${wait?"":`<small>${M.priceString} a month · cancel any time</small>`}</span>${wait?"":`<span class="u-pw-pr"><b>${M.priceString}</b><small>a month</small></span>`}</button>`:""}
    </div>
    <button class="btn primary big pw-go fx-shine" id="pwGo"${IAP.busy||wait?" disabled":""}>${wait?"Prices are loading from the App Store":IAP.busy?"Opening the App Store…":pwCta(o,plan)}</button>
    <p class="pw-fine">${wait?"Renews automatically unless you cancel at least 24 hours before the end of the period. Cancel any time in Settings › your name › Subscriptions.":`${trial?"No payment today. ":""}${pwFine(o,plan)}`}</p>
    <div class="pw-links">${o.stale?`<button class="o2-link" id="pwRetry">Try again</button>`:""}<button class="o2-link" id="pwRestore">Restore</button><button class="o2-link" id="pwTerms">Terms</button><button class="o2-link" id="pwPriv">Privacy</button></div>`;
    /* in the app's sheet nothing scrolls: optional parts come off one step at a time, only while it still would
       (the order is in onboarding.css: week preview · plans' second lines · smaller headline · material names) */
    if(inApp&&ctx.where!=="lock"){ const F=ctx.where==="plan"?[4,2,3,1]:[1,2,3,4];   // opened for the plan: its week preview goes last
      pw.classList.remove("pw-fit1","pw-fit2","pw-fit3","pw-fit4"); for(let i=0;i<F.length&&pw.scrollHeight>pw.clientHeight+1;i++) pw.classList.add("pw-fit"+F[i]); }
    /* during onboarding the paywall fits too (Andrej, 18 Oct): the plan chips, the week preview, the free-week timeline
       (the plan cards and the fine print say the same), a smaller headline and tighter cards come off one step at a time,
       only while the sheet would still scroll. The price, the Start button, the fine print and Restore/Terms/Privacy stay. */
    else { pw.classList.remove("pw-ob1","pw-ob2","pw-ob3","pw-ob4","pw-ob5"); for(let i=1;i<=5&&pw.scrollHeight>pw.clientHeight+1;i++) pw.classList.add("pw-ob"+i); }   // also the lock screen (gate.js)
    /* the three materials as small stills of the chest and shoulders in each material alone (vault.js's vtShot:
       no muscle colours, cached per id and size) */
    if(mats.length) pw.querySelectorAll(".vt-pw-c").forEach(el=>{ const u=uiSafe(()=>typeof vtShot==="function"?vtShot(el.dataset.vt,el):null,null); if(u) el.innerHTML=`<img src="${u}" alt="" draggable="false">`; });
    pw.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{ plan=b.dataset.p; Pulse.buzz(5); draw(); });
    pw.querySelector("#pwGo").onclick=async()=>{ if(wait) return; Pulse.buzz(10); const busy=proBuy(plan,ctx.where); draw(); const r=await busy; if(!pw.isConnected) return;
      if(r&&r.ok&&isPro()){ if(ctx.where==="onboarding"&&uiPwBack.res) uiObPaid(pw,{}); else ctx.done(); } else if(live()) draw(); };
    if(pw.querySelector("#pwRetry")) pw.querySelector("#pwRetry").onclick=()=>{ Pulse.buzz(6); o={...o,stale:false,loading:true}; draw();
      pwOffer().then(x=>{ if(!live()) return; o=x||{...PRO_FALLBACK,stale:true}; draw(); }); };
    if(ctx.close) pw.querySelector("#pwX").onclick=()=>ctx.close();
    if(ctx.back) pw.querySelector("#pwBack").onclick=()=>ctx.back();
    pw.querySelector("#pwRestore").onclick=async()=>{ const r=await proRestore(); if(r&&r.ok&&isPro()&&pw.isConnected){ if(ctx.where==="onboarding"&&uiPwBack.res) uiObPaid(pw,{restored:true}); else ctx.done(); } };
    pw.querySelector("#pwTerms").onclick=()=>openLink(PRO_LINKS.terms);
    pw.querySelector("#pwPriv").onclick=()=>openLink(PRO_LINKS.privacy);
  };
  draw();
  pwOffer().then(x=>{ if(!live()) return; o=x||{...PRO_FALLBACK,stale:true}; draw(); });
  return {redraw:draw};
}
/* the paywall as a sheet, from anywhere in the app (moved from web/ossa.html in Phase 5).
   reason: where it was opened ("plan", "check", "posture", "settings", "vault", "material"…); o.mat: the Vault id
   that opened it (Your look). Every older caller passes only the reason. */
function openPaywall(reason,o){
  o=o||{};
  if(document.querySelector(".pwx")) return;
  track("paywall_view",{where:reason});
  const vt=uiSafe(()=>typeof vtOn==="function"&&vtOn(),false), mat=vt&&o.mat?(uiSafe(()=>vtMats(),[]).find(m=>m.id===o.mat)||null):null;
  const host=document.createElement("div"); host.className="pwx";
  const pw=document.createElement("div"); pw.className="pw pw2"; pw.setAttribute("role","dialog"); pw.setAttribute("aria-label","Ossa Pro");
  host.appendChild(pw); $("app").appendChild(host);
  const prev=S.program&&S.program.week?S.program.week.map((d,i)=>({d:["M","T","W","T","F","S","S"][i],t:d?d.title:"Rest",on:!!d})):[];
  const close=()=>{ host.classList.remove("on"); pw.classList.remove("on"); setTimeout(()=>host.remove(),450); };
  const head=reason==="plan"?(S.program?"Your plan is ready when you are.":"A plan built around you."):reason==="check"?"Turn your body check into a programme."
    :reason==="posture"?"Turn your posture scan into a daily routine.":reason==="vault"&&vt?"Three new materials for your body.":reason==="material"&&mat?`Wear ${mat.name}.`:"Train with a plan built for you.";
  pwMount(pw,{where:reason,close,eye:"Ossa Pro",head,mat:mat?mat.id:null,
    preview:prev,days:S.program&&S.program.a&&S.program.a.days,
    done:()=>{ close();
      const on=uiSafe(()=>typeof vtOn==="function"&&vtOn(),false), what=on?"Your plan and the new materials are on.":"Your plan is on.";
      if(mat&&on&&isPro()&&typeof vtPick==="function") uiSafe(()=>vtPick(mat.id,{quiet:true}));   // bought from a swatch: wear it
      toast(S.pro&&S.pro.trial?`Your free week has started. ${what}`:`Welcome to Ossa Pro. ${what}`); }});
  host.onclick=e=>{ if(e.target===host) close(); };
  requestAnimationFrame(()=>{ host.classList.add("on"); pw.classList.add("on"); });
}
