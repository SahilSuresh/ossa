/* =========================================================
   FOCUS HOME: "AURA CORE" (19 Oct, Focus page redesign; Andrej: "I like 3 … do it").
   Mockup: https://claude.ai/artifact/HGbhmPa5B9DGWx14U42iRK, phone C. Prefix fh*. Function declarations only.
   Replaces the Focus home layout (the orb dial, the Eyes strip, the chip row); every screen they opened is still
   reached: the core opens More, the cards open Eyes, today's directives, a Reset sheet (Breathe,
   Unwind, Heartbeat) and Check-in; the button opens Lock in. "More" (fcHome(…, true)) is unchanged.
   23 Oct: Break free (web/ui/clean.js) and the urge button were taken out of the app for 1.0.
   - The core: a canvas (4 breathing tier-coloured glows, the level ring, rising sparks; Radiant adds a halo, Ascended
     orbiting hexes; grey with no sparks while a relapse dims the glow) behind the level, "xp / next · Tier".
   - The gain: aura earned since Focus last showed it (S.aura.fhXp) counts up, flares the glow and floats "+N aura";
     a level-up sends a shockwave. A running lock-in puts its time left in the core and its progress on the ring.
   - Today's aura: every "aura" hook adds to S.aura.day {d, n}.
   ========================================================= */
function fhS(){ return fhS.s||(fhS.s={raf:0,last:0,sp:[],flare:0,wave:0}); }
function fhLv(){ try{ return auLevel((S.aura&&S.aura.xp)||0).n; }catch(e){ return 1; } }
function fhToday(){ const A=S.aura||{}, d=A.day; return d&&d.d===dkey(0)?Math.max(0,Math.round(+d.n||0)):0; }
function fhCheckStreak(){ try{ const M=mindState(); let n=0; for(let i=M.check[dkey(0)]?0:1;i<400;i++){ if(M.check[dkey(i)]) n++; else break; } return n; }catch(e){ return 0; } }
function fhPre(){ try{ const p=S.monk&&+S.monk.pre; return [25,50,90].includes(p)?p:50; }catch(e){ return 50; } }

function fhCards(){
  const out=[];
  try{ const E=eyS(), t=eyTier(E.score), done=E.lastCheck===dkey(0);
    out.push({k:"eyes",eye:"Eyes",v:String(E.score),c:t.c,sub:done?`${t.n}${t.next?` · ${t.to} to ${t.next.n}`:""}`:`${t.n} · report in 21:30`,go:"eyes"}); }catch(e){}
  try{ const E=eyS(), D=eyToday(), dn=E.dir.date===dkey(0)?E.dir.done:[], nx=D.find(x=>!dn.includes(x.id)), sum=D.reduce((a,x)=>a+x.x,0);
    out.push({k:"quests",eye:"Directives",v:`${dn.length}/3`,c:"var(--text-1)",sub:nx?nx.t:`All done · +${sum} aura`,subc:nx?"":"var(--glow)",go:"eyes"}); }catch(e){}
  out.push({k:"reset",eye:"Reset",v:"≋",c:`var(${abTier(fhLv()).c})`,sub:"Breathe · Unwind · Pulse",go:"reset"});
  const cs=fhCheckStreak(); out.push({k:"check",eye:"Check in",v:cs?`${cs}d`:"—",c:"var(--amber)",sub:"Mood & energy",go:"checkin"});
  return out;
}
function fhHome(b){
  fhStop();
  const A=auState(), xp=Math.floor(+A.xp||0), lv=fhLv(), t=abTier(lv), nx=auXpFor(lv+1), dim=typeof clDimAny==="function"&&clDimAny();
  const today=fhToday(), run=typeof mmRun==="function"?mmRun():null, pre=fhPre();
  let pv=""; try{ const p=auPreview("monk",pre); pv=p&&p.xp>0?` · +${p.xp} aura`:""; }catch(e){}
  const col=dim?"var(--line-3)":`var(${t.c})`;
  b.innerHTML=`<div class="u-screen fh" style="--tc:${col}">
    <header class="u-top"><div class="u-top-tx"><div class="u-eyebrow">${uiShortDate()}</div><h1 class="u-h1">Focus</h1></div></header>
    <button class="fh-core" id="fhCore" aria-label="${run?"Back to your lock-in":`Aura level ${lv}, ${xp} of ${nx} aura. How aura works and more`}">
      <canvas id="fhCv" aria-hidden="true"></canvas>
      <span class="fh-tx" id="fhTx">${run?`<b class="fh-run" id="fhRun">${mmClock(mmLeft(run))}</b><small>Left of ${Math.round(run.plan)} min</small>`
        :`<small class="fh-eye">Aura level</small><b class="fh-lv">${lv}</b><small class="fh-xp"><span id="fhXp">${xp.toLocaleString("en-GB")}</span> / ${nx.toLocaleString("en-GB")} · ${dim?"Dimmed":t.n}</small>${dim?`<small class="fh-dim">Glow dimmed until tomorrow</small>`:""}`}</span>
    </button>
    <div class="fh-pills"><span class="fh-pill">${(nx-xp).toLocaleString("en-GB")} to LV ${lv+1}</span>${today>0?`<span class="fh-pill lime">+${today} today</span>`:""}</div>
    <div class="fh-cards" role="list">${fhCards().map(c=>`<button class="fh-card" role="listitem" data-fh="${c.go}"><span class="fh-ce">${uiEsc(c.eye)}</span><b style="color:${c.c}">${uiEsc(c.v)}</b><small${c.subc?` style="color:${c.subc}"`:""}>${uiEsc(c.sub)}</small></button>`).join("")}</div>
    <button class="fh-lock" id="fhLock">${run?`Back to lock-in · <span id="fhLockT">${mmClock(mmLeft(run))}</span>`:`Lock in · ${pre} min${pv}`}</button>
  </div>`;
  $("fhCore").onclick=()=>{ Pulse.buzz(8); mindGo(run?"monk":"more"); };
  $("fhLock").onclick=()=>{ Pulse.buzz(8); if(run){ mindGo("monk"); return; } try{ mmUi().pick=pre; }catch(e){} mindGo("monk:setup"); };
  b.querySelectorAll("[data-fh]").forEach(x=>x.onclick=()=>{ Pulse.buzz(6); const g=x.dataset.fh; if(g==="reset") fhReset(); else mindGo(g); });
  fhGain(); fhStart();
}
/* the Reset sheet: Breathe, Unwind, Heartbeat */
function fhReset(){
  let s=$("fhSheet"); if(s) s.remove();
  s=document.createElement("div"); s.id="fhSheet"; s.className="fh-sheet";
  const rows=[["breath","Breathe","Box, even, long exhale, 4-7-8"],["unwind","Unwind","Water, fireflies, sand · no timer"],["beat","Heartbeat","A beat at your resting pulse"]];
  s.innerHTML=`<div class="fh-sh-bg" data-x="1"></div><div class="fh-sh"><span class="u-eyebrow">Reset</span>${rows.map(([g,t,d])=>`<button class="fh-row" data-g="${g}"><b>${t}</b><small>${d}</small></button>`).join("")}</div>`;
  $("app").appendChild(s); requestAnimationFrame(()=>s.classList.add("on"));
  s.onclick=e=>{ const r=e.target.closest("[data-g]"); if(r){ s.remove(); mindGo(r.dataset.g); return; } if(e.target.dataset.x) s.remove(); };
}
/* ---------- the core's loop ---------- */
function fhStop(){ const st=fhS(); cancelAnimationFrame(st.raf); st.raf=0; }
function fhStart(){ const st=fhS(); st.sp=[]; fhDraw(performance.now(),true); if(!reduced) st.raf=requestAnimationFrame(fhLoop); }
function fhLoop(now){ const st=fhS(); st.raf=0; const cv=$("fhCv"); if(!cv||!cv.isConnected||document.hidden) return;
  if(now-st.last>=33){ fhDraw(now,false); st.last=now; } st.raf=requestAnimationFrame(fhLoop); }
function fhDraw(now,still){
  const st=fhS(), cv=$("fhCv"); if(!cv) return;
  const r=cv.getBoundingClientRect(), W=r.width, H=r.height; if(!W) return;
  const dpr=Math.min(2,window.devicePixelRatio||1); if(cv.width!==Math.round(W*dpr)){ cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); }
  const g=cv.getContext("2d"); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,W,H);
  const A=S.aura||{xp:0}, xp=+A.xp||0, lv=fhLv(), t=abTier(lv), dim=typeof clDimAny==="function"&&clDimAny();
  const col=dim?abCss("--line-3"):abCss(t.c), cx=W/2, cy=H/2, k=Math.min(1,H/330), dt=still?0:0.033;
  const run=typeof mmRun==="function"?mmRun():null;
  const frac=run?mmFrac(run):Math.max(0,Math.min(1,(xp-auXpFor(lv))/Math.max(1,auXpFor(lv+1)-auXpFor(lv))));
  const breath=reduced||dim?1:1+0.03*Math.sin(now/900), fl=st.flare>0?1+st.flare*0.6:1;
  /* four stacked glows */
  [[86,0.26],[112,0.2],[138,0.14],[164,0.1]].forEach(([rad,a])=>{ const R=rad*k*breath; const gr=g.createRadialGradient(cx,cy,0,cx,cy,R);
    g.globalAlpha=Math.min(1,a*(dim?0.6:1+0.25*t.i)*fl); gr.addColorStop(0,col); gr.addColorStop(1,"transparent"); g.fillStyle=gr; g.beginPath(); g.arc(cx,cy,R,0,7); g.fill(); });
  g.globalAlpha=1;
  /* the ring */
  const RR=104*k; g.lineCap="round"; g.lineWidth=6; g.strokeStyle=col; g.globalAlpha=0.18; g.beginPath(); g.arc(cx,cy,RR,0,7); g.stroke();
  g.globalAlpha=1; g.shadowColor=col; g.shadowBlur=dim?0:12; g.beginPath(); g.arc(cx,cy,RR,-Math.PI/2,-Math.PI/2+Math.max(0.001,frac)*Math.PI*2); g.stroke(); g.shadowBlur=0;
  /* Radiant: a halo; Ascended: six orbiting hexes */
  if(t.i>=3&&!dim){ g.globalAlpha=0.5; g.lineWidth=1.5; g.beginPath(); g.ellipse(cx,cy-RR-14*k,46*k,8*k,0,0,7); g.stroke(); }
  if(t.i>=4&&!dim){ g.strokeStyle=abCss("--cyan"); for(let j=0;j<6;j++){ const a=now/2600+j*Math.PI/3, x=cx+Math.cos(a)*(RR+22*k), y=cy+Math.sin(a)*(RR+22*k); g.globalAlpha=0.7; g.beginPath(); for(let q=0;q<7;q++){ const b2=q*Math.PI/3; g.lineTo(x+Math.cos(b2)*5,y+Math.sin(b2)*5); } g.stroke(); } }
  /* sparks */
  if(!dim&&!reduced&&!still){ let n=0.2+0.3*t.i+0.2*t.within+(st.flare>0?1.5:0); while(n>0&&st.sp.length<60){ if(Math.random()<n){ const a=Math.random()*7, rr=(60+Math.random()*50)*k; st.sp.push({x:cx+Math.cos(a)*rr,y:cy+Math.sin(a)*rr,a:0}); } n-=1; } }
  st.sp=st.sp.filter(p=>(p.a+=dt/2)<1); g.fillStyle=t.i>=4?abCss("--cyan"):col;
  st.sp.forEach(p=>{ p.y-=80*k*dt/2; g.globalAlpha=Math.sin(p.a*Math.PI)*0.9; g.beginPath(); g.arc(p.x,p.y,1.6,0,7); g.fill(); });
  /* the level-up shockwave */
  if(st.wave>0){ const w=1-st.wave; g.globalAlpha=st.wave; g.lineWidth=3; g.strokeStyle=col; g.beginPath(); g.arc(cx,cy,RR+w*120*k,0,7); g.stroke(); st.wave=Math.max(0,st.wave-dt/1.2); }
  if(st.flare>0) st.flare=Math.max(0,st.flare-dt/1.5);
  g.globalAlpha=1;
  /* a running lock-in's time left */
  if(run&&!still){ const el=$("fhRun"), lt=$("fhLockT"), txt=mmClock(mmLeft(run)); if(el&&el.textContent!==txt){ el.textContent=txt; if(lt) lt.textContent=txt; } }
}
/* aura earned since Focus last showed it */
function fhGain(){
  const A=auState(), xp=Math.floor(+A.xp||0); if(A.fhXp==null){ A.fhXp=xp; A.fhLv=fhLv(); save(); return; }
  const n=xp-A.fhXp, lv0=+A.fhLv||fhLv(), lv=fhLv(); A.fhXp=xp; A.fhLv=lv; save();
  if(n<=0) return; const st=fhS(); st.flare=1;
  const el=$("fhXp"); if(el&&typeof fxCount==="function") fxCount(el,xp-n,xp,900,v=>v.toLocaleString("en-GB"));
  const core=$("fhCore"); if(core){ const p=document.createElement("span"); p.className="fh-pop"; p.textContent=`+${n} aura`; core.appendChild(p); setTimeout(()=>{ try{ p.remove(); }catch(e){} },1800); }
  if(lv>lv0){ st.wave=1; try{ hap("heavy"); }catch(e){} } else { try{ hap("light"); }catch(e){} }
}
/* today's aura, from every grant */
vxOn("aura",r=>{ try{ if(!r||!(+r.xp>0)) return; const A=S.aura; if(!A) return; const d=dkey(0); if(!A.day||A.day.d!==d) A.day={d,n:0}; A.day.n+=+r.xp; }catch(e){} });
/* the home view: the new layout; "More" stays the old long page */
(()=>{ const _h=fcHome; fcHome=function(b,M,more){ if(more) return _h.apply(this,arguments); try{ return fhHome(b); }catch(e){ console.warn("Ossa: aura core",e); return _h.apply(this,arguments); } }; })();
document.addEventListener("visibilitychange",()=>{ if(!document.hidden&&$("fhCv")&&!fhS().raf&&!reduced) fhS().raf=requestAnimationFrame(fhLoop); });
