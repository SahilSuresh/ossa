/* =========================================================
   THE GUIDE: how Ossa works, right after the intro (19 Oct, Andrej: "make a very very good tutorial … when the user
   after goes through onboarding so he knows how it works"). Prefix gd*. Function declarations only, state on gdS.
   A spotlight walks the real screens, one thing at a time: the body (spin it, then tap a muscle: you do both for real),
   your level, today's quest on Train, Rank and aura, Recover, Learn, then the tabs. Each step is one card with Back and
   Next, and Skip ends it. It ends on "Start my first quest". Replaces the old tour: startTour() is redefined here, so the
   boot and finishOnboarding calls (when !S.toured) and Settings › "How Ossa works" all land on it. S.toured marks done.
   Never over the intro, the paywall or a workout: it waits and tries again.
   ========================================================= */
function gdS(){ return gdS.s||(gdS.s={on:false,i:-1,tries:0,poll:0,ok:false}); }
function gdSteps(){
  const first=(typeof sessionsN==="function"?sessionsN():0)===0;
  return [
    {k:"body",tab:"today",el:"#rdHero",pad:-2,eye:"Your body",h:"This is you",p:"Every muscle has a rank. Drag across me to spin me round, and pinch to zoom in.",act:"spin",hint:"Drag to spin"},
    {k:"tap",tab:"today",el:"#rdHero",pad:-2,eye:"Your muscles",h:"Tap a muscle",p:"See its rank and what trains it. Hold one instead to flag it sore.",act:"tap",hint:"Tap any muscle"},
    {k:"level",tab:"today",el:".u-lvl",pad:8,eye:"Your level",h:"Train it and it climbs",p:"Every set earns RP. It ranks muscles up from Fragile to Unbreakable and raises your level. Leave a muscle for 10 days and it fades."},
    {k:"train",tab:"train",el:".dk-quest",pad:6,eye:"Train",h:"Today's quest",p:"Built from your plan and what's recovered. Press play when you're ready, and finish it to earn RP."},
    {k:"rank",tab:"breathe",el:".lu-skills",pad:6,eye:"Focus",h:"Level up your mind",p:"Study, Focus and Offline sessions are skills. Every minute earns XP, and their ranks change your body's bones, eyes and shadow."},
    {k:"recover",tab:"recover",el:".rcv-hero",pad:6,eye:"Recover",h:"What's ready",p:"Worked muscles need time. See what's ready to train, with your sleep and fuel underneath."},
    {k:"learn",tab:"explore",el:".rdp-stats",pad:8,eye:"Learn",h:"Three minutes a lesson",p:"Short lessons on how your body works. Each one earns aura."},
    {k:"nav",tab:"today",el:"#uNav",pad:6,eye:"Getting around",h:"Five tabs, one tap",p:"Or swipe left and right across the screen to move between them."},
    {k:"end",tab:"today",end:true,eye:"You're set",h:first?"Your first quest is waiting":"That's Ossa",
      p:first?"Finish it to earn your first rank. Your body lights up as you go.":"Today's quest is on Train whenever you're ready."}
  ];
}
/* not over the intro, the paywall, a workout or its run */
function gdBlocked(){
  try{ const a=$("app").classList;
    return !S.body||a.contains("onboarding")||a.contains("wkrun")||a.contains("tactive")||TR.view==="active"||(typeof gtLocked==="function"&&gtLocked())||!!document.getElementById("o2"); }catch(e){ return true; }
}
function startTour(o){
  o=o||{}; const st=gdS(); if(st.on) return;
  if(gdBlocked()){ if(!o.manual&&++st.tries<150) setTimeout(()=>{ if(!S.toured) startTour(o); },2500); return; }
  st.on=true; st.i=-1; st.tries=0;
  try{ closePanels(); if(typeof sheetState!=="undefined"&&sheetState!=="closed") setSheet("closed"); }catch(e){}
  try{ S.hinted=true; S.lxTips=Object.assign(S.lxTips||{},{hold:1,pinch:1}); save(); }catch(e){}   /* the guide teaches what the tips would */
  const app=$("app"); app.classList.add("touring","gding");
  let g=$("gd"); if(!g){ g=document.createElement("div"); g.id="gd"; g.className="gd"; app.appendChild(g); }
  g.innerHTML=`<div class="gd-hole" id="gdHole"></div><i class="gd-blk" data-b="t"></i><i class="gd-blk" data-b="b"></i><i class="gd-blk" data-b="l"></i><i class="gd-blk" data-b="r"></i><i class="gd-blk gd-cover" id="gdCover"></i>
    <section class="gd-card" id="gdCard" role="dialog" aria-modal="true" aria-live="polite" aria-label="How Ossa works"></section><i class="gd-probe" aria-hidden="true"></i>`;
  requestAnimationFrame(()=>g.classList.add("on"));
  try{ track("tour",{e:"start",manual:!!o.manual}); }catch(e){}
  gdGo(0);
}
/* go to step i: the right tab first, then the spotlight and the card */
function gdGo(i){
  const st=gdS(), S0=gdSteps(), s=S0[i]; if(!st.on) return; if(!s) return gdEnd("done");
  clearInterval(st.poll); st.ok=false; const prev=st.i; st.i=i;
  const card=$("gdCard"); if(card) card.classList.remove("in");
  const here=gdTab(), moved=here!==s.tab;
  if(moved){ try{ uiGo(s.tab); }catch(e){ console.warn(e); } }
  if(s.k==="body"){ try{ Body.camTo&&Body.camTo({zoom:1,px:0,py:0,yaw:0},reduced?0.01:0.5); UIH.view="front"; uiHeroSide("front"); }catch(e){} }
  if(s.k==="tap"){ try{ if(UIH.sel) uiHeroSelect(UIH.sel); }catch(e){} }   /* nothing picked, so the tap is yours */
  let n=0; const place=()=>{ if(!gdS().on||gdS().i!==i) return;
    const el=s.el?document.querySelector(s.el):null, r=el&&el.getBoundingClientRect();
    if(s.el&&(!r||r.width<4||r.height<4)&&++n<20){ setTimeout(place,100); return; }
    if(el&&r&&(r.top<0||r.bottom>innerHeight)){ try{ el.scrollIntoView({block:"center"}); }catch(e){} }
    gdShow(i,el); };
  setTimeout(place,moved?560:(prev<0?(reduced?60:420):80));
}
/* which tab is showing, in uiGo's keys */
function gdTab(){ try{ return typeof uiCurTab==="function"?uiCurTab():"today"; }catch(e){ return "today"; } }
function gdShow(i,el){
  const st=gdS(), s=gdSteps()[i], g=$("gd"), app=$("app"), hole=$("gdHole"), card=$("gdCard"); if(!g||!card) return;
  const A=app.getBoundingClientRect(), W=A.width, H=A.height;
  let r=null;
  if(el&&!s.end){ const b=el.getBoundingClientRect(), p=s.pad||0; r={x:b.left-A.left-p,y:b.top-A.top-p,w:b.width+2*p,h:b.height+2*p}; }
  g.classList.toggle("gd-full",!r);
  if(r){ const rad=s.k==="nav"?999:s.k==="level"?20:24;
    Object.assign(hole.style,{left:r.x+"px",top:r.y+"px",width:r.w+"px",height:r.h+"px",borderRadius:rad+"px"});
    const set=(k,x,y,w,h)=>{ const b=g.querySelector(`[data-b="${k}"]`); Object.assign(b.style,{left:x+"px",top:y+"px",width:Math.max(0,w)+"px",height:Math.max(0,h)+"px"}); };
    set("t",0,0,W,r.y); set("b",0,r.y+r.h,W,H-r.y-r.h); set("l",0,r.y,r.x,r.h); set("r",r.x+r.w,r.y,W-r.x-r.w,r.h);
    const cv=$("gdCover"); Object.assign(cv.style,{left:r.x+"px",top:r.y+"px",width:r.w+"px",height:r.h+"px"}); cv.hidden=!!s.act; }
  else { Object.assign(hole.style,{left:W/2+"px",top:H/2+"px",width:"0px",height:"0px"}); g.querySelectorAll(".gd-blk").forEach(b=>Object.assign(b.style,{left:0,top:0,width:W+"px",height:H+"px"})); $("gdCover").hidden=false; }
  const steps=gdSteps().filter(x=>!x.end), n=steps.length, idx=steps.indexOf(steps.find(x=>x.k===s.k));
  card.innerHTML=s.end
    ?`<span class="gd-badge" aria-hidden="true"><svg viewBox="0 0 64 64"><polygon points="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5"/><path d="M21 33.5l7.5 7.5L44 25"/></svg></span>
      <span class="gd-eye">${s.eye}</span><h2 class="gd-h">${s.h}</h2><p class="gd-p">${s.p}</p>
      <div class="gd-acts gd-col"><button class="gd-next" id="gdGo">${gdFirst()?"Start my first quest":"Go to Train"}</button><button class="gd-back" id="gdStay">Look around first</button></div>`
    :`<div class="gd-top"><span class="gd-eye">${s.eye}</span><span class="gd-dots" aria-label="Step ${idx+1} of ${n}">${steps.map((x,j)=>`<i class="${j<idx?"done":j===idx?"on":""}"></i>`).join("")}</span><button class="gd-skip" id="gdSkip">Skip</button></div>
      <h2 class="gd-h">${s.h}</h2><p class="gd-p">${s.p}</p>
      ${s.act?`<div class="gd-acts gd-do"><div class="gd-try" id="gdTry"><i class="gd-ic ${s.act}" aria-hidden="true"></i><span>${s.hint}</span></div><button class="gd-next gd-sm" id="gdNext">Next</button></div>`
        :`<div class="gd-acts">${idx>0?`<button class="gd-back" id="gdBack">Back</button>`:`<span></span>`}<button class="gd-next" id="gdNext">${idx===n-1?"Finish":"Next"}</button></div>`}`;
  /* the card sits below the spotlight if it fits, else above it, else over its lower edge */
  card.style.top=card.style.bottom="";
  requestAnimationFrame(()=>{ if(gdS().i!==i) return;
    const ch=card.offsetHeight, gap=14, pad=12, safeT=gdSafe("top")+pad, navT=gdNavTop()-pad;
    let top;
    if(!r) top=Math.max(safeT,(H-ch)/2);
    else if(r.y+r.h+gap+ch<=(s.k==="nav"?r.y-gap:navT)) top=r.y+r.h+gap;
    else if(r.y-gap-ch>=safeT) top=r.y-gap-ch;
    else top=Math.max(safeT,Math.min(H-ch-pad,(s.k==="nav"?r.y:navT)-ch));
    if(s.k==="nav") top=Math.max(safeT,r.y-gap-ch);
    card.style.top=top+"px"; card.classList.add("in"); });
  const go=(j)=>{ Pulse.buzz(6); gdGo(j); };
  if($("gdNext")) $("gdNext").onclick=()=>go(i+1);
  if($("gdBack")) $("gdBack").onclick=()=>go(i-1);
  if($("gdSkip")) $("gdSkip").onclick=()=>{ Pulse.buzz(5); gdEnd("skip"); };
  if($("gdGo")) $("gdGo").onclick=()=>{ Pulse.buzz([10,40,14]); gdEnd("train"); };
  if($("gdStay")) $("gdStay").onclick=()=>{ Pulse.buzz(6); gdEnd("done"); };
  if(s.end){ try{ Pulse.chime&&Pulse.chime(4); }catch(e){} setTimeout(()=>{ try{ const cr=card.getBoundingClientRect(), gr=g.getBoundingClientRect(); if(typeof fxConfetti==="function") fxConfetti(g,{x:0.5,y:Math.max(0.05,(cr.top-gr.top+30)/gr.height),count:60}); }catch(e){} },260); }
  try{ track("tour",{e:"step",k:s.k}); }catch(e){}
  /* a hands-on step: watch for it, then a tick and on to the next */
  if(s.act){ let y0=null, sel0=null; try{ y0=Body.yaw?Body.yaw():null; sel0=UIH.sel||null; }catch(e){}
    st.poll=setInterval(()=>{ if(!gdS().on||gdS().i!==i){ clearInterval(st.poll); return; }
      let ok=false; try{ ok=s.act==="spin"?(y0!=null&&Math.abs(Body.yaw()-y0)>1.1):(!!UIH.sel&&UIH.sel!==sel0); }catch(e){}
      if(!ok) return; clearInterval(st.poll); st.ok=true; const t=$("gdTry"); if(t){ t.classList.add("ok"); t.querySelector("span").textContent=s.act==="spin"?"Nice spin":"That's the one"; }
      Pulse.buzz([8,30,12]); setTimeout(()=>{ if(gdS().on&&gdS().i===i) gdGo(i+1); },reduced?300:1100); },150); }
  try{ if(!matchMedia("(pointer:coarse)").matches) (s.end?$("gdGo"):$("gdNext")).focus({preventScroll:true}); }catch(e){}   /* keyboards get focus; a finger doesn't need the ring */
}
function gdFirst(){ try{ return sessionsN()===0; }catch(e){ return true; } }
/* the phone's safe area (status bar), read off a probe in the guide's layer */
function gdSafe(side){ try{ const p=document.querySelector("#gd .gd-probe"); if(!p) return 0; const cs=getComputedStyle(p); return parseFloat(side==="top"?cs.paddingTop:cs.paddingBottom)||0; }catch(e){ return 0; } }
function gdNavTop(){ try{ const n=$("uNav"), A=$("app").getBoundingClientRect(); if(n&&n.offsetParent){ const r=n.getBoundingClientRect(); if(r.height>0) return r.top-A.top; } return A.height; }catch(e){ return innerHeight; } }
function gdEnd(how){
  const st=gdS(); if(!st.on) return; st.on=false; clearInterval(st.poll);
  try{ S.toured=true; save(); }catch(e){}
  try{ track("tour",{e:how==="skip"?"skip":"end",at:(gdSteps()[st.i]||{}).k,via:how}); }catch(e){}
  const g=$("gd"), app=$("app"); if(g){ g.classList.remove("on"); setTimeout(()=>{ if(!gdS().on) g.remove(); },reduced?0:320); }
  app.classList.remove("touring","gding");
  try{ if(how==="train") uiGo("train"); else if(gdTab()!=="today") uiGo("today"); }catch(e){}
}
/* the guide follows the screen: re-place on a resize (rotation, keyboard) */
(()=>{ window.addEventListener("resize",()=>{ const st=gdS(); if(st.on&&st.i>=0) setTimeout(()=>{ if(gdS().on){ const s=gdSteps()[st.i]; gdShow(st.i,s.el?document.querySelector(s.el):null); } },120); }); })();
/* Android back while the guide is up: a step back, or out */
(()=>{ if(typeof goBack!=="function") return; const _b=goBack; goBack=function(){ const st=gdS(); if(st.on){ if(st.i>0) gdGo(st.i-1); else gdEnd("skip"); return true; } return _b.apply(this,arguments); }; })();
