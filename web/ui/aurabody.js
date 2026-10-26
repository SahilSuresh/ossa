/* =========================================================
   AURA ON THE CHARACTER (19 Oct, Focus lab; Andrej: "yes").
   Prefix ab*. Function declarations only, state on abS().
   - Tiers by Aura level: Faint 1–4 · Steady 5–9 · Bright 10–14 · Radiant 15–19 · Ascended 20+ (abTier). Inside a tier,
     within = (lv − min)/5 makes each level a little stronger; a new tier is a visible jump.
   - On the Body page: the body's own GL glow (Body.setAura, drawn by its renderer outside the silhouette, so the
     muscle colours are never touched) in the tier colour and a slow breath; sparks rising off the body and a floor
     glow on a 2D canvas under the page's controls; the tier name under the figure; "N aura" and a bar in the header.
   - The gain: aura earned since the Body page last showed it (S.aura.unseen, aura.js) pops "+N aura" with its source,
     sparks fly into the chest, the glow flares, the number counts up; a level-up or a new tier gets a banner.
     A loss (S.aura.lost) flickers red: "−N aura · LEVEL IS SAFE", or "LEVEL DOWN" after a relapse.
   - Reduced motion: a still glow, no sparks, no flight.
   ========================================================= */
function abS(){ return abS.s||(abS.s={on:false,raf:0,sp:[],fly:[],flare:0,red:0,last:0,cv:null,t0:0}); }
function abTiers(){ return [
  {k:"faint",n:"Faint",min:1,c:"--stone-3",rgb:[[0.56,0.60,0.23],[0.40,0.44,0.16]],say:"A thin haze. Every session thickens it."},
  {k:"steady",n:"Steady",min:5,c:"--glow",rgb:[[0.78,0.91,0.29],[0.55,0.80,0.10]],say:"A glow that hugs the body."},
  {k:"bright",n:"Bright",min:10,c:"--gold",rgb:[[0.94,0.78,0.29],[1.0,0.62,0.12]],say:"Bigger, brighter, sparks off the shoulders."},
  {k:"radiant",n:"Radiant",min:15,c:"--cyan",rgb:[[0.37,0.84,0.89],[0.20,0.60,1.0]],say:"A flare and a halo above the head."},
  {k:"ascended",n:"Ascended",min:20,c:"--text-1",rgb:[[0.91,0.98,1.0],[0.37,0.84,0.89]],say:"The most a body can carry."}]; }
function abTier(lv){ const T=abTiers(); let i=0; T.forEach((t,j)=>{ if(lv>=t.min) i=j; }); const t=T[i]; return {...t,i,within:i<4?Math.max(0,Math.min(1,(lv-t.min)/5)):1}; }
function abLv(){ try{ return auLevel((S.aura&&S.aura.xp)||0).n; }catch(e){ return 1; } }
function abCss(v){ try{ return getComputedStyle(document.documentElement).getPropertyValue(v).trim()||"white"; }catch(e){ return "white"; } }
function abHere(){ try{ return !!(window.RDHOME&&$("rdHero")&&!$("app").classList.contains("train")&&!document.querySelector(".app.onboarding")); }catch(e){ return false; } }

/* the body's own glow, in the tier colour; k grows with the tier and the level inside it, plus the flare */
function abGlow(extra){
  try{ if(!Body.setAura||!abHere()) return; const st=abS(), t=abTier(abLv());
    const dim=(typeof clDimAny==="function"&&clDimAny()), red=st.red>0;
    const a=red?[1,0.23,0.19]:dim?[0.45,0.45,0.45]:t.rgb[0], b=red?[0.8,0.1,0.1]:dim?[0.3,0.3,0.3]:t.rgb[1];
    const k=Math.min(0.6,0.08+0.06*t.i+0.04*t.within+(extra||0)*0.5);   /* the body renderer's aura also washes the backdrop: keep it low */
    Body.setAura(a,b,red?0.3:dim?0.08:k); }catch(e){}
}
/* the header line and the tier label, added to the Body page each time it draws */
function abDress(){
  const hero=$("rdHero"); if(!hero) return;
  const A=S.aura||{xp:0}, lv=abLv(), t=abTier(lv), L=auLevel(A.xp||0), dim=(typeof clDimAny==="function"&&clDimAny());
  const col=dim?"var(--text-3)":`var(${t.c})`;
  let lab=hero.querySelector(".ab-tier"); if(!lab){ lab=document.createElement("div"); lab.className="ab-tier"; hero.appendChild(lab); }
  lab.style.color=col; lab.textContent=dim?"Glow dimmed · back tomorrow":`${t.n} aura`;
  let cv=hero.querySelector(".ab-cv"); if(!cv){ cv=document.createElement("canvas"); cv.className="ab-cv"; cv.setAttribute("aria-hidden","true"); hero.prepend(cv); }
  abS().cv=cv;
  const top=document.querySelector("#tv-today .u-top-tx"); if(top){ let bar=top.querySelector(".ab-line");
    if(!bar){ bar=document.createElement("button"); bar.className="ab-line"; bar.onclick=()=>{ try{ Pulse.buzz(6); uiFocusOpen("home"); }catch(e){} }; top.appendChild(bar); }
    bar.style.setProperty("--ac",col); bar.setAttribute("aria-label",`Aura level ${lv}, ${(A.xp||0).toLocaleString("en-GB")} aura. Open Focus`);
    bar.innerHTML=`<span class="ab-hex"><b>${lv}</b></span><span class="ab-tx">Aura level</span><span class="ab-bar"><i id="abBar" style="width:${(Math.max(0,Math.min(1,L.f))*100).toFixed(1)}%"></i></span><span class="ab-n"><b id="abNum">${Math.floor(A.xp||0).toLocaleString("en-GB")}</b></span>`; }   /* 19 Oct audit: "Aura level" spelled out, so it never reads as a second "Level" */
}

/* ---------- the loop: sparks rising off the body, the gain's flight, the breath of the glow (≤30 fps) ---------- */
function abBox(){ const st=abS(), cv=st.cv; if(!cv) return null; const r=cv.getBoundingClientRect(); return {w:r.width,h:r.height}; }
function abLoop(now){
  const st=abS(); st.raf=0; if(!st.on||!abHere()||document.hidden) return;
  if(now-st.last<33){ st.raf=requestAnimationFrame(abLoop); return; }
  const dt=Math.min(0.1,(now-(st.last||now))/1000); st.last=now;
  const cv=st.cv, B=abBox(); if(!cv||!B||!B.w){ st.raf=requestAnimationFrame(abLoop); return; }
  const dpr=Math.min(2,window.devicePixelRatio||1); if(cv.width!==Math.round(B.w*dpr)){ cv.width=Math.round(B.w*dpr); cv.height=Math.round(B.h*dpr); }
  const g=cv.getContext("2d"); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,B.w,B.h);
  const t=abTier(abLv()), dim=(typeof clDimAny==="function"&&clDimAny()), col=st.red>0?abCss("--danger"):dim?abCss("--text-3"):abCss(t.c), cx=B.w/2, top=B.h*0.16, bot=B.h*0.86;
  /* the floor glow */
  const fg=g.createRadialGradient(cx,bot,2,cx,bot,B.w*0.32); fg.addColorStop(0,col); fg.addColorStop(1,"transparent");
  g.globalAlpha=0.16+0.06*t.i; g.fillStyle=fg; g.beginPath(); g.ellipse(cx,bot,B.w*0.32,B.h*0.035,0,0,7); g.fill();
  /* Radiant and up: a halo above the head; Ascended: six small hexes orbiting */
  if(t.i>=3&&!dim){ g.globalAlpha=0.5; g.strokeStyle=col; g.lineWidth=1.5; g.beginPath(); g.ellipse(cx,top-B.h*0.02,B.w*0.07,B.h*0.012,0,0,7); g.stroke(); }
  if(t.i>=4&&!dim){ for(let k=0;k<6;k++){ const a=now/2600+k*Math.PI/3, x=cx+Math.cos(a)*B.w*0.24, y=(top+bot)/2+Math.sin(a)*B.h*0.06; g.globalAlpha=0.6; g.strokeStyle=abCss("--cyan"); g.beginPath(); for(let j=0;j<7;j++){ const b=j*Math.PI/3; g.lineTo(x+Math.cos(b)*5,y+Math.sin(b)*5); } g.stroke(); } }
  /* sparks: spawn inside the body area, drift up, fade over ~1.4 s */
  if(!dim&&!reduced){ let n=0.15+0.25*t.i+0.2*t.within+(st.flare>0?1.2:0); while(n>0&&st.sp.length<80){ if(Math.random()<n) st.sp.push({x:cx+(Math.random()-0.5)*B.w*0.26,y:top+Math.random()*(bot-top),v:18+Math.random()*30,a:0}); n-=1; } }
  st.sp=st.sp.filter(p=>(p.a+=dt/1.4)<1); g.fillStyle=t.i>=4?abCss("--cyan"):col;
  st.sp.forEach(p=>{ p.y-=p.v*dt; g.globalAlpha=Math.sin(p.a*Math.PI)*0.9; g.beginPath(); g.arc(p.x,p.y,1.4,0,7); g.fill(); });
  /* the gain's flight: from the bottom of the screen along a slight curve into the chest */
  if(st.fly.length){ const ch={x:cx,y:top+(bot-top)*0.25};
    st.fly=st.fly.filter(f=>{ f.t+=dt/f.d; if(f.t>=1){ if(!f.done){ f.done=1; abLanded(); } return false; } const e=1-Math.pow(1-f.t,3), x=f.x+(ch.x-f.x)*e+Math.sin(e*Math.PI)*f.bend, y=B.h+(ch.y-B.h)*e;
      g.globalAlpha=1; g.fillStyle=col; g.beginPath(); g.arc(x,y,2.2,0,7); g.fill(); return true; }); }
  g.globalAlpha=1;
  /* the breath (5.6 s, ±1.5 %) and the flare's decay; the red flicker */
  if(st.flare>0) st.flare=Math.max(0,st.flare-dt/1.5);
  if(st.red>0){ st.red=Math.max(0,st.red-dt); if(st.red===0) abGlow(0); }
  const br=Math.sin(now/5600*2*Math.PI)*0.015;
  if(Math.floor(now/200)!==st.gk){ st.gk=Math.floor(now/200); abGlow(br+st.flare*0.6); }
  st.raf=requestAnimationFrame(abLoop);
}
function abStart(){ const st=abS(); st.on=true; abDress(); abGlow(0); if(reduced){ return; } if(!st.raf) st.raf=requestAnimationFrame(abLoop); }
function abStop(){ const st=abS(); st.on=false; cancelAnimationFrame(st.raf); st.raf=0; st.sp=[]; }

/* ---------- the gain and the loss, shown once on the Body page ---------- */
function abBanner(text,sub,col,ms){
  const app=$("app"); if(!app) return; const el=document.createElement("div"); el.className="ab-banner"; el.style.setProperty("--ac",col);
  el.innerHTML=`<b>${uiEsc(text)}</b>${sub?`<small>${uiEsc(sub)}</small>`:""}`; app.appendChild(el); setTimeout(()=>{ try{ el.remove(); }catch(e){} },ms||2600);
}
function abPop(text,sub,col,cls){
  const app=$("app"), hero=$("rdHero"); if(!app||!hero) return; const el=document.createElement("div"); el.className="ab-pop"+(cls?" "+cls:""); el.style.setProperty("--ac",col);
  el.innerHTML=`<b>${uiEsc(text)}</b>${sub?`<small>${uiEsc(sub)}</small>`:""}`; app.appendChild(el); setTimeout(()=>{ try{ el.remove(); }catch(e){} },1900);
}
function abShowGain(){
  const A=S.aura; if(!A||!abHere()) return;
  const st=abS(), lv=abLv(), t=abTier(lv), col=`var(${t.c})`;
  if(+A.lost>0){
    const n=Math.round(A.lost), down=+A.lostLv>lv;
    abPop(`−${n} aura`,down?"":"Level is safe",abCss("--danger"),"loss"); st.red=1.2; abGlow(0); try{ hap("error"); }catch(e){}
    if(down){ const t0=abTier(+A.lostLv); setTimeout(()=>abBanner(t0.i>t.i?`Aura faded to ${t.n}`:`LEVEL DOWN · Aura LV ${lv}`,"Clean days bring it back.",abCss("--danger")),900); try{ hap("heavy"); }catch(e){} }
    A.lost=0; A.lostLv=0; A.unseen=0; A.unseenSrc=""; A.seenLv=lv; save(); abDress(); return;
  }
  const n=Math.round(+A.unseen||0); if(!(n>0)) { if(A.seenLv==null){ A.seenLv=lv; save(); } return; }
  const lv0=A.seenLv!=null?+A.seenLv:lv, src=String(A.unseenSrc||"").toUpperCase();
  abPop(`+${n} aura`,src,col); try{ hap("light"); }catch(e){}
  st.pend={n,lv0,lv,from:Math.max(0,Math.floor(A.xp||0)-n)};
  A.unseen=0; A.unseenSrc=""; A.seenLv=lv; save();
  if(reduced){ abLanded(); return; }
  const B=abBox(); const k=Math.min(40,8+Math.round(n/5)); st.fly=[]; for(let i=0;i<k;i++) st.fly.push({x:(B?B.w:390)*(0.15+Math.random()*0.7),bend:(Math.random()-0.5)*80,t:-i*0.03,d:1});
  if(!st.raf) st.raf=requestAnimationFrame(abLoop);
}
function abLanded(){
  const st=abS(), P=st.pend; if(!P) return; st.pend=null; st.flare=1;
  const el=$("abNum"); if(el&&typeof fxCount==="function") fxCount(el,P.from,P.from+P.n,900,v=>v.toLocaleString("en-GB"));
  if(P.lv>P.lv0){ const t0=abTier(P.lv0), t=abTier(P.lv), col=abCss(t.c);
    try{ hap("heavy"); Pulse.buzz([20,60,40,60,60]); }catch(e){}
    let next=0; try{ next=auXpFor(P.lv+1); }catch(e){}
    setTimeout(()=>{ if(t.i>t0.i) abBanner(`NEW AURA UNLOCKED · ${t.n}`,t.say,col); else abBanner(`LEVEL UP · Aura LV ${P.lv}`,`Mind is now ${P.lv}. Next level at ${next.toLocaleString("en-GB")} aura.`,col); },200);
    const hero=$("rdHero"); if(hero){ const r=document.createElement("i"); r.className="ab-ring"; r.style.setProperty("--ac",col); hero.appendChild(r); setTimeout(()=>{ try{ r.remove(); }catch(e){} },1400); }
  }
  setTimeout(abDress,950);
}

/* ---------- wiring ---------- */
(()=>{ const _o=rdHomeOn; rdHomeOn=function(on){ const v=_o.apply(this,arguments); try{ if(on&&window.UI3DHOME){ setTimeout(()=>{ if(abHere()){ abStart(); abShowGain(); } },450); } else abStop(); }catch(e){ console.warn("Ossa: aura body",e); } return v; }; })();
(()=>{ const _f=uiHomeFigure; uiHomeFigure=function(){ const v=_f.apply(this,arguments); try{ setTimeout(()=>{ if(abHere()){ abDress(); abGlow(0); } },60); }catch(e){} return v; }; })();
document.addEventListener("visibilitychange",()=>{ const st=abS(); if(!document.hidden&&st.on&&!st.raf&&!reduced) st.raf=requestAnimationFrame(abLoop); });
