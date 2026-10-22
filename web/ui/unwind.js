/* =========================================================
   UNWIND (Andrej, 17 Oct): the second tab of the Focus breathing screen. No guidance, no timer, no aura:
   three toys to touch, swiped between with the arrows or the name strip.
     water      tap for a ripple, drag for a wake
     fireflies  hold to gather them, let go and they scatter
     sand       drag to rake lines; they smooth away by themselves
   Soft haptics on touch (bridge v2 hap('soft'), else Pulse.buzz), an optional Tidal sound that puts your
   music back when you leave. The loop draws only while something moves and stops itself when the screen is
   still (fireflies rest after 20 s untouched), so it costs nothing sitting open. Reduced motion: ripples
   fade without spreading and fireflies don't wander. Colours from tokens (calmTok, web/ui/calm.js).
   rdBreathScreen is wrapped: tab 'unwind' (and the old 'calm') renders this page; rdBrStop also stops it.
   Function declarations only, state on function properties (start-up rule).
   ========================================================= */
function uwToys(){ return [
  {k:"water",n:"Still water",d:"Tap for a ripple. Drag for a wake."},
  {k:"fireflies",n:"Fireflies",d:"Hold to gather them. Let go and they scatter."},
  {k:"sand",n:"Zen sand",d:"Drag to rake. The lines smooth away by themselves."}
]; }
function uwS(){ return uwS.s||(uwS.s={i:0,snd:false,prev:null,raf:0,cv:null,x:null,w:0,h:0,d:1,down:false,px:0,py:0,
  rip:[],fl:null,hold:null,sand:null,grain:null,lastTouch:0,lastHap:0,lastDrop:0,sandAt:0,col:null}); }

function uwHap(ms){
  const S_=uwS(), now=performance.now(); if(now-S_.lastHap<(ms||140)) return; S_.lastHap=now;
  try{ if(typeof hap==="function") hap("soft"); else Pulse.buzz(4); }catch(e){}
}
function uwColours(){
  const S_=uwS(); if(S_.col) return S_.col;
  const t=(n,f)=>typeof calmTok==="function"?calmTok(n,f):f;
  return S_.col={bg:t("--bg","black"),cyan:t("--cyan","cyan"),glow:t("--glow","yellowgreen"),
    sand:t("--surface-2","dimgray"),grainA:t("--surface-3","gray"),grainB:t("--line","gray"),groove:t("--line-3","darkgray")};
}

/* ---------- the screen ---------- */
function uwScreen(b){
  const S_=uwS();
  rdBrStop();
  RDBR.tab="unwind";
  const m=$("mind"); m.classList.add("brv");
  let tb=$("brTabs"); if(!tb){ tb=document.createElement("div"); tb.id="brTabs"; tb.className="br-tabs"; tb.setAttribute("role","tablist"); m.querySelector(".mv-top").appendChild(tb); }
  tb.innerHTML=[["breathe","Breathe"],["unwind","Unwind"]].map(([k,n])=>`<button class="br-tb${RDBR.tab===k?" on":""}" data-brt="${k}" role="tab" aria-selected="${RDBR.tab===k}">${n}</button>`).join("");
  tb.querySelectorAll("[data-brt]").forEach(x=>x.onclick=()=>{ if(RDBR.tab===x.dataset.brt) return; Pulse.buzz(6); RDBR.tab=x.dataset.brt; MIND.view=RDBR.tab==="unwind"?"unwind":"breath"; rdBreathScreen(b,null); });
  const T=uwToys()[S_.i];
  b.innerHTML=`<div class="uw">
    <div class="uw-stage"><canvas class="uw-cv" id="uwCv" aria-label="${uwEsc(T.n)}. ${uwEsc(T.d)}" role="img"></canvas>
      <button class="br-snd uw-sndp" id="uwSnd" aria-pressed="${S_.snd}">Sound: <span id="uwSndV">${S_.snd?"Tidal":"Off"}</span></button>
      <p class="uw-hint" id="uwName">${uwEsc(T.d)}</p></div>
    <div class="br-pick uw-pick" id="uwPick" hidden></div>
    <div class="br-chips uw-toys" role="group" aria-label="Toys">${uwToys().map((x,i)=>`<button class="br-chip${i===S_.i?" on":""}" data-uw="${i}" aria-pressed="${i===S_.i}"><span class="br-ci">${uwIc(x.k)}</span><span>${uwEsc(x.n)}</span></button>`).join("")}</div>
  </div>`;
  b.querySelectorAll("#uwPick .br-ar").forEach(x=>x.onclick=()=>uwStep(+x.dataset.d));
  b.querySelectorAll("[data-uw]").forEach(x=>x.onclick=()=>{ const i=+x.dataset.uw; if(i!==uwS().i) uwStep(i-uwS().i); });
  let g=null; const pk=$("uwPick");
  pk.addEventListener("pointerdown",e=>{ g={x:e.clientX,y:e.clientY}; });
  pk.addEventListener("pointerup",e=>{ if(!g) return; const dx=e.clientX-g.x, dy=e.clientY-g.y; g=null; if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.4) uwStep(dx<0?1:-1); });
  $("uwSnd").onclick=uwSound;
  uwBind($("uwCv"));
}
function uwEsc(s){ return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
function uwNameHTML(T){ return `<h2>${uwEsc(T.n)}</h2><p>${uwEsc(T.d)}</p>`; }
function uwStep(d){
  const S_=uwS(), L=uwToys(); S_.i=(S_.i+d+L.length)%L.length; Pulse.buzz(6);
  const T=L[S_.i], nm=$("uwName"); if(nm) nm.textContent=T.d;
  document.querySelectorAll("[data-uw]").forEach((x,i)=>{ x.classList.toggle("on",i===S_.i); x.setAttribute("aria-pressed",String(i===S_.i)); });
  const cv=$("uwCv"); if(cv) cv.setAttribute("aria-label",`${T.n}. ${T.d}`);
  S_.rip=[]; S_.fl=null; S_.hold=null; S_.sand=null; uwKick(true);
}
function uwSound(){
  const S_=uwS(); S_.snd=!S_.snd;
  try{
    if(S_.snd){ S_.prev={on:Music.on,track:Music.track}; Music.play("tidal"); }
    else uwSoundOff();
  }catch(e){}
  const v=$("uwSndV"); if(v) v.textContent=S_.snd?"Tidal":"Off";
  const b=$("uwSnd"); if(b) b.setAttribute("aria-pressed",String(S_.snd));
  Pulse.buzz(5);
}
function uwSoundOff(){
  const S_=uwS(), p=S_.prev; S_.prev=null;
  try{ if(p&&p.on&&p.track!=="tidal") Music.play(p.track); else if(p&&!p.on) Music.stop(); }catch(e){}
}
/* leaving the page: stop the loop and give the music back */
function uwStop(){
  const S_=uwS(); cancelAnimationFrame(S_.raf); S_.raf=0; S_.cv=null; S_.x=null;
  if(S_.snd){ S_.snd=false; uwSoundOff(); }
}

/* ---------- touch ---------- */
function uwBind(cv){
  const S_=uwS(); S_.cv=cv; S_.x=cv.getContext("2d"); S_.col=null;
  const pos=e=>{ const r=cv.getBoundingClientRect(); return [(e.clientX-r.left)*S_.d,(e.clientY-r.top)*S_.d]; };
  cv.addEventListener("pointerdown",e=>{ e.preventDefault(); try{ cv.setPointerCapture(e.pointerId); }catch(x){}
    S_.down=true; const [x,y]=pos(e); S_.px=x; S_.py=y; S_.lastTouch=performance.now(); uwTouch(x,y,true); uwKick(); });
  cv.addEventListener("pointermove",e=>{ if(!S_.down) return; const [x,y]=pos(e); uwDrag(S_.px,S_.py,x,y); S_.px=x; S_.py=y; S_.lastTouch=performance.now(); uwKick(); });
  const up=()=>{ if(!S_.down) return; S_.down=false; uwRelease(); uwKick(); };
  cv.addEventListener("pointerup",up); cv.addEventListener("pointercancel",up); cv.addEventListener("pointerleave",up);
  uwKick(true);
}
function uwTouch(x,y){
  const S_=uwS(), k=uwToys()[S_.i].k;
  if(k==="water"){ S_.rip.push({x,y,t:performance.now(),m:1}); uwHap(60); }
  else if(k==="fireflies"){ S_.hold={x,y}; uwHap(60); }
  else { uwRake(x,y,x+0.01,y); uwHap(60); }
}
function uwDrag(x0,y0,x1,y1){
  const S_=uwS(), k=uwToys()[S_.i].k, now=performance.now();
  if(k==="water"){ if(now-S_.lastDrop>80){ S_.lastDrop=now; S_.rip.push({x:x1,y:y1,t:now,m:0.45}); uwHap(220); } }
  else if(k==="fireflies"){ S_.hold={x:x1,y:y1}; }
  else { uwRake(x0,y0,x1,y1); uwHap(260); }
}
function uwRelease(){
  const S_=uwS(), k=uwToys()[S_.i].k;
  if(k==="fireflies"&&S_.hold&&S_.fl){ S_.fl.forEach(f=>{ const a=Math.random()*Math.PI*2; f.vx+=Math.cos(a)*3*S_.d; f.vy+=Math.sin(a)*3*S_.d; }); uwHap(0); }
  S_.hold=null;
}

/* ---------- the loop: runs only while something moves ---------- */
function uwKick(force){
  const S_=uwS(); if(force) S_.lastTouch=performance.now();
  if(!S_.raf&&S_.cv) S_.raf=requestAnimationFrame(uwFrame);
}
function uwSize(){
  const S_=uwS(), cv=S_.cv; if(!cv) return false;
  const d=Math.min(window.devicePixelRatio||1,2), w=Math.max(1,Math.round(cv.clientWidth*d)), h=Math.max(1,Math.round(cv.clientHeight*d));
  if(cv.width!==w||cv.height!==h){ cv.width=w; cv.height=h; S_.sand=null; S_.grain=null; S_.fl=null; }
  S_.w=w; S_.h=h; S_.d=d; return true;
}
function uwFrame(now){
  const S_=uwS(); S_.raf=0;
  if(!S_.cv||!S_.cv.isConnected||$("mind").hidden){ S_.cv=null; return; }
  if(!uwSize()) return;
  const k=uwToys()[S_.i].k, x=S_.x; x.setTransform(1,0,0,1,0,0); x.globalAlpha=1;
  let more=S_.down;
  if(k==="water") more=uwWater(now)||more;
  else if(k==="fireflies") more=uwFlies(now)||more;
  else more=uwSand(now)||more;
  if(more) S_.raf=requestAnimationFrame(uwFrame);
}

/* still water */
function uwWater(now){
  const S_=uwS(), x=S_.x, C=uwColours(), m=Math.min(S_.w,S_.h), still=typeof reduced!=="undefined"&&reduced, life=4200;
  x.fillStyle=C.bg; x.fillRect(0,0,S_.w,S_.h);
  S_.rip=S_.rip.filter(r=>now-r.t<life);
  x.strokeStyle=C.cyan; x.lineWidth=1.5*S_.d;
  S_.rip.forEach(r=>{ const p=(now-r.t)/life;
    for(let j=0;j<3;j++){ const q=Math.max(0,p-j*0.1); if(q<=0) continue;
      const rad=still?m*0.08*r.m:4*S_.d+q*m*0.45*r.m;
      x.globalAlpha=Math.max(0,(1-q)*(0.8-j*0.22)*r.m); x.beginPath(); x.arc(r.x,r.y,rad,0,Math.PI*2); x.stroke(); } });
  x.globalAlpha=1;
  return S_.rip.length>0;
}
/* fireflies */
function uwFlies(now){
  const S_=uwS(), x=S_.x, C=uwColours(), d=S_.d, still=typeof reduced!=="undefined"&&reduced;
  if(!S_.fl){ x.fillStyle=C.bg; x.fillRect(0,0,S_.w,S_.h); S_.fl=[]; for(let i=0;i<46;i++) S_.fl.push({x:Math.random()*S_.w,y:Math.random()*S_.h,vx:0,vy:0,p:Math.random()*6.28}); }
  const awake=S_.down||now-S_.lastTouch<20000;   // they rest (and the loop stops) 20 s after your last touch
  x.globalAlpha=0.25; x.fillStyle=C.bg; x.fillRect(0,0,S_.w,S_.h); x.globalAlpha=1;
  S_.fl.forEach(f=>{
    f.p+=0.02;
    if(S_.hold){ f.vx+=(S_.hold.x-f.x)*0.0009; f.vy+=(S_.hold.y-f.y)*0.0009; }
    if(!still){ f.vx+=Math.cos(f.p)*0.02*d; f.vy+=Math.sin(f.p*1.3)*0.02*d; }
    f.vx*=0.96; f.vy*=0.96; f.x+=f.vx; f.y+=f.vy;
    if(f.x<0||f.x>S_.w) f.vx*=-1; if(f.y<0||f.y>S_.h) f.vy*=-1;
    const a=awake?0.45+0.45*Math.sin(f.p*3):0.35, r=9*d;
    const g=x.createRadialGradient(f.x,f.y,0,f.x,f.y,r); g.addColorStop(0,C.glow); g.addColorStop(1,"transparent");
    x.globalAlpha=Math.max(0,a); x.fillStyle=g; x.beginPath(); x.arc(f.x,f.y,r,0,Math.PI*2); x.fill(); x.globalAlpha=1;
  });
  return awake;
}
/* zen sand: grooves on an offscreen layer that eases back to smooth sand */
function uwSandBase(){
  const S_=uwS(), C=uwColours();
  if(S_.grain) return S_.grain;
  const g=document.createElement("canvas"); g.width=S_.w; g.height=S_.h; const gx=g.getContext("2d");
  gx.fillStyle=C.sand; gx.fillRect(0,0,g.width,g.height);
  const n=Math.round(g.width*g.height/90);
  for(let i=0;i<n;i++){ gx.globalAlpha=0.35+Math.random()*0.4; gx.fillStyle=Math.random()<0.5?C.grainA:C.grainB; gx.fillRect(Math.random()*g.width,Math.random()*g.height,S_.d,S_.d); }
  gx.globalAlpha=1;
  return S_.grain=g;
}
function uwSandLayer(){
  const S_=uwS(); if(S_.sand) return S_.sand;
  const c=document.createElement("canvas"); c.width=S_.w; c.height=S_.h; c.getContext("2d").drawImage(uwSandBase(),0,0);
  return S_.sand=c;
}
function uwRake(x0,y0,x1,y1){
  const S_=uwS(), C=uwColours(); if(!S_.w) uwSize();
  const L=uwSandLayer(), x=L.getContext("2d"), dx=x1-x0, dy=y1-y0, len=Math.hypot(dx,dy)||1, nx=-dy/len, ny=dx/len, d=S_.d;
  x.lineCap="round";
  for(let i=-2;i<=2;i++){ const o=i*9*d;
    x.globalAlpha=0.9; x.strokeStyle=C.bg; x.lineWidth=2.2*d; x.beginPath(); x.moveTo(x0+nx*o,y0+ny*o); x.lineTo(x1+nx*o,y1+ny*o); x.stroke();
    x.globalAlpha=0.7; x.strokeStyle=C.groove; x.lineWidth=1.1*d; x.beginPath(); x.moveTo(x0+nx*(o+1.6*d),y0+ny*(o+1.6*d)); x.lineTo(x1+nx*(o+1.6*d),y1+ny*(o+1.6*d)); x.stroke(); }
  x.globalAlpha=1; S_.sandAt=performance.now();
}
function uwSand(now){
  const S_=uwS(), x=S_.x, L=uwSandLayer();
  const age=now-(S_.sandAt||0), fading=S_.sandAt&&age<26000;
  if(fading){ const lx=L.getContext("2d"); lx.globalAlpha=0.012; lx.drawImage(uwSandBase(),0,0); lx.globalAlpha=1; }   // the lines smooth away over about 25 s
  x.drawImage(L,0,0);
  return !!fading;
}

/* the screen hooks: tab 'unwind' (or the old 'calm') shows this page; rdBrStop stops it */
(()=>{
  const _r=rdBreathScreen;
  rdBreathScreen=function(b,pat,tab){
    if(tab==="calm") tab="unwind";
    if(tab) RDBR.tab=tab;
    if(!pat&&RDBR.tab==="unwind"){ const o=uwScreen(b); brTitle("Unwind"); return o; }
    uwStop();
    if(RDBR.tab!=="breathe") RDBR.tab="breathe";
    const out=_r.call(this,b,pat,"breathe");
    brTitle("Breathe");
    try{ brChips(b); brFocus(b); }catch(e){ console.warn(e); }
    return out;
  };
  const _st=rdBrStart, _fin=rdBrFinish;
  rdBrStart=function(){ const v=_st.apply(this,arguments); try{ brPlaySync(); }catch(e){} return v; };
  rdBrFinish=function(){ const v=_fin.apply(this,arguments); try{ brPlaySync(); }catch(e){} return v; };
  const _set=rdBrSet;
  rdBrSet=function(){ const v=_set.apply(this,arguments); try{ brChipsSync(); }catch(e){} return v; };
  const _s=rdBrStop;
  rdBrStop=function(){ uwStop(); return _s.apply(this,arguments); };
})();

/* ---------- Breathe: every option on show (Andrej, 17 Oct): two labelled chip rows under the name,
   Techniques and Calm sessions, instead of hunting with the arrows ---------- */
function brChips(b){
  const pk=document.getElementById("brPick"); if(!pk||document.getElementById("brGroups")) return;
  const chip=(x,i)=>`<button class="br-chip${i===RDBR.i?" on":""}" data-bi="${i}" aria-pressed="${i===RDBR.i}" aria-label="${uwEsc(x.n)}"><span class="br-ci">${brIc(x)}</span><span>${uwEsc(brShort(x))}</span></button>`;
  const n=RD_BR.length;
  pk.insertAdjacentHTML("afterend",`<div class="br-groups" id="brGroups">
    <div class="br-grp"><span class="u-eyebrow">Techniques</span><div class="br-chips c4" role="group" aria-label="Techniques">${RD_BR.map((x,i)=>chip(x,i)).join("")}</div></div>
    <div class="br-grp"><span class="u-eyebrow">Calm sessions</span><div class="br-chips c3" role="group" aria-label="Calm sessions">${RD_CALM.map((x,j)=>chip(x,n+j)).join("")}</div></div>
  </div>`);
  b.querySelectorAll("[data-bi]").forEach(x=>x.onclick=()=>{ if(RDBR.run) return; const i=+x.dataset.bi; if(i===RDBR.i) return;
    const d=i>RDBR.i?1:-1; RDBR.i=i; Pulse.buzz(6); rdBrSet(d); });
  brChipsSync();
}
function brChipsSync(){
  document.querySelectorAll("[data-bi]").forEach(x=>{ const on=+x.dataset.bi===RDBR.i; x.classList.toggle("on",on); x.setAttribute("aria-pressed",String(on));
    if(on&&x.parentNode&&x.parentNode.scrollWidth>x.parentNode.clientWidth) x.parentNode.scrollLeft=Math.max(0,x.offsetLeft-x.parentNode.clientWidth/2+x.offsetWidth/2); });
}
/* Longer exhale's tag was "Calm", which now reads like the Calm sessions */
(()=>{ try{ const t=RD_BR.find(x=>x.k==="exhale"); if(t&&t.tag==="Calm") t.tag="Settle"; }catch(e){} })();

/* ---------- Breathe on its own (Andrej, 17 Oct): "purely on breathe, way better and more focused".
   No Breathe | Unwind switch (each Focus orb opens its own screen, titled), the name with its rhythm in
   one line, the picker as icon tiles, the length as one row, and one big Start that becomes End with the
   time left. While a session runs only the shape, the cue and End stay. ---------- */
function brTitle(t){ const tb=document.getElementById("brTabs"); if(!tb) return; tb.removeAttribute("role"); tb.innerHTML=`<span class="br-title">${uwEsc(t)}</span>`; }
function brShort(x){ return {even:"Even",box:"Box",exhale:"Exhale","478":"4-7-8"}[x.k]||x.n; }
function brIc(x){
  try{ if(typeof fcIc==="function"){ if(!x.pat) return fcIc(x.k); return x.k==="drift"&&typeof UI_IC!=="undefined"&&UI_IC.moon?UI_IC.moon:fcIc("calm"); } }catch(e){}
  return "";
}
/* the rhythm in a line: "In 4 · Hold 4 · Out 4 · Hold 4" */
function brPat(T){
  try{ const P=BREATHS[T.pat||T.k]; if(!P) return "";
    return P.ph.map(([n,l])=>`${/in$/i.test(n)?"In":/out$/i.test(n)?"Out":"Hold"} ${l}`).join(" · "); }catch(e){ return ""; }
}
function rdBrNameHTML(T){
  return `<h2>${T.n}</h2><p class="br-pat">${brPat(T)}${T.pat?" · with a visual":""}</p>`;
}
function brFocus(b){
  const br=b.querySelector(".br"), pl=document.getElementById("brPlay"), g=document.getElementById("brGroups"); if(!br||!pl||!g) return;
  const old=document.getElementById("brCDv"); if(old&&!pl.contains(old)) old.id="brCDv0";   // the hidden card's; the Start button shows the time now
  const durs=[1,2,3,5,10];
  g.insertAdjacentHTML("afterend",`<div class="br-durs" role="group" aria-label="Length">${durs.map(n=>`<button class="br-dur${n===RDBR.dur?" on":""}" data-dur="${n}" aria-pressed="${n===RDBR.dur}">${n} min</button>`).join("")}</div>`);
  br.appendChild(pl); br.insertAdjacentHTML("beforeend",`<p class="br-xp" id="brXp"></p>`);
  const st=document.getElementById("brStage");
  if(st&&!document.getElementById("brSnd")){ st.insertAdjacentHTML("beforeend",`<button class="br-snd" id="brSnd"></button>`);
    document.getElementById("brSnd").onclick=e=>{ e.stopPropagation(); const c=document.getElementById("brCS"); if(c) c.click(); brPlaySync(); }; }
  b.querySelectorAll("[data-dur]").forEach(x=>x.onclick=()=>{ if(RDBR.run) return; RDBR.dur=+x.dataset.dur; Pulse.buzz(5); brPlaySync(); });
  brPlaySync();
}
function brPlaySync(){
  const pl=document.getElementById("brPlay"); if(!pl) return;
  const run=!!RDBR.run, v=document.getElementById("brCDv");
  const t=run?(v&&/:/.test(v.textContent)?v.textContent:""):`${RDBR.dur} min`;
  pl.classList.toggle("end",run); pl.setAttribute("aria-label",run?"End":"Start");
  pl.innerHTML=`<span>${run?"End":"Start"}</span><span id="brCDv">${t}</span>`;
  document.querySelectorAll("[data-dur]").forEach(x=>{ const on=+x.dataset.dur===RDBR.dur; x.classList.toggle("on",on); x.setAttribute("aria-pressed",String(on)); });
  const sb=document.getElementById("brSnd"); if(sb){ const n=(RD_SND.find(x=>x[0]===RDBR.snd)||RD_SND[0])[1]; sb.textContent=`Sound: ${n}`; sb.setAttribute("aria-label",`Sound: ${n}. Tap to change`); }
  const xp=document.getElementById("brXp");
  if(xp){ let t2=""; try{ if(typeof auPreview==="function"){ const p=auPreview("breath",RDBR.dur); t2=p&&p.xp>0?`${String(p.txt).replace(/ aura$/,"")} aura when you finish`:"Today's breathing aura is used up"; } }catch(e){} xp.textContent=run?"":t2; }
}

/* the toy icons (Andrej, 17 Oct: Unwind on its own, like Breathe) */
function uwIc(k){
  return ({water:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.2"/><circle cx="12" cy="12" r="5.6"/><circle cx="12" cy="12" r="9"/></svg>`,
    fireflies:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6.5" cy="8" r="1.6"/><circle cx="15" cy="5.5" r="1.3"/><circle cx="17.5" cy="14" r="1.8"/><circle cx="9" cy="16.5" r="1.4"/></svg>`,
    sand:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8c3-2.4 6-2.4 9 0s6 2.4 9 0M3 13c3-2.4 6-2.4 9 0s6 2.4 9 0M3 18c3-2.4 6-2.4 9 0s6 2.4 9 0"/></svg>`})[k]||"";
}

/* ---------- Unwind, full screen (19 Oct, Andrej: "this area … entirely dedicated to just seeing the main part") ----------
   The toy takes the whole screen: no header, no tab strip. A small close button top left, the sound as an icon top right,
   the three toys as a slim pill near the bottom that fades after 3 s without a touch (any touch brings it back),
   and the hint fades after the first drag. */
(()=>{ const _s=uwScreen; uwScreen=function(b){ const v=_s.apply(this,arguments);
  try{ const app=$("app"); app.classList.add("uwfull");
    const host=b.querySelector(".uw"); if(host&&!$("uwX")){ host.insertAdjacentHTML("afterbegin",`<button class="u-back uw-x" id="uwX" aria-label="Back to Focus">‹ Focus</button>`);
      $("uwX").onclick=()=>{ try{ Pulse.buzz(6); }catch(e){} mindGo("home"); }; }
    const snd=$("uwSnd"); if(snd){ snd.classList.add("uw-sndi"); snd.setAttribute("aria-label",`Sound: ${uwS().snd?"Tidal":"off"}`); }
    const wake=()=>{ const t=b.querySelector(".uw-toys"); if(!t) return; t.classList.remove("idle"); clearTimeout(uwScreen.t); uwScreen.t=setTimeout(()=>{ if(t.isConnected) t.classList.add("idle"); },3000); };
    wake(); b.addEventListener("pointerdown",wake);
    const cv=$("uwCv"), hint=$("uwName"); let moved=0; if(cv&&hint) cv.addEventListener("pointermove",e=>{ if(e.buttons&&++moved>6) hint.classList.add("gone"); });
  }catch(e){ console.warn("Ossa: unwind full",e); }
  return v; }; })();
(()=>{ const _o=uwStop; uwStop=function(){ try{ $("app").classList.remove("uwfull"); clearTimeout(uwScreen.t); }catch(e){} return _o.apply(this,arguments); }; })();
(()=>{ const _g=mindGo; mindGo=function(v){ try{ if(String(v)!=="unwind") $("app").classList.remove("uwfull"); }catch(e){} return _g.apply(this,arguments); }; })();
(()=>{ if(typeof closeMind!=="function") return; const _c=closeMind; closeMind=function(){ try{ $("app").classList.remove("uwfull"); }catch(e){} return _c.apply(this,arguments); }; })();
