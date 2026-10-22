/* =========================================================
   BONE RANKS ON THE BODY (20 Oct, BONES-SPEC.md from the Focus redesign thread). Prefix bo*. Function declarations only.
   Each session skill's rank (skills.js, E–S = 0–5) changes one part of the character on Body:
     the material  the overall rank, floor((study + focus + off) / 3): Bone, Stone, Iron, Obsidian, Gold, Starforged.
                   A BODY_FX "base" chunk tints the figure's base (not the muscles) and adds an edge glow; Gold gets
                   a slow light sweep, Starforged twinkling stars.
     the head      Study: a forehead rune, temple glyphs, orbiting runes, a crown of light, a third eye (cumulative)
     the eyes      Focus: dim, lime, cyan with a trail, burning, light, void (one at a time; they blink)
     the shadow    Offline: a floor shadow, an after-image, smoke, a phantom double, phantom form (cumulative)
   Head, eyes and shadow are drawn on a canvas over the hero (#boCv), placed with Body.project every frame while the
   Body page shows. Body header: "BONES · IRON", a RANK hex (opens the rank road), three skill cards under the figure.
   The reforge: when the overall letter rises (on opening Body), cracks spread, a flash, the new material, a banner.
   A skill rank-up alone shows its own banner. S.bones = {seen, sk:{study,focus,off}} so each plays once.
   ========================================================= */
function boMats(){ return [["Bone","e"],["Stone","d"],["Iron","c"],["Obsidian","b"],["Gold","a"],["Starforged","s"]]; }
function boRanks(){ try{ const s=luS(); return {study:luRank(s.study.lv),focus:luRank(s.focus.lv),off:luRank(s.off.lv)}; }catch(e){ return {study:0,focus:0,off:0}; } }
function boOverall(){ const r=boRanks(); return Math.floor((r.study+r.focus+r.off)/3); }
function boS(){ if(!S.bones||typeof S.bones!=="object") S.bones={seen:boOverall(),sk:boRanks()}; return S.bones; }
function boTok(v){ return typeof fxTok==="function"?fxTok(v):"white"; }
function boRgbF(c){ const m=/^#?([0-9a-f]{6})$/i.exec(String(c).trim()); if(!m) return [1,1,1]; const n=parseInt(m[1],16); return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]; }
/* the material the figure wears: the reforge swaps boShow.mat to the new one at the flash */
function boShow(){ return boShow.s||(boShow.s={mat:null,crack:0,flash:0}); }
function boMatNow(){ const s=boShow(); if(s.mat!=null) return s.mat; const B=boS(); return B.wear!=null&&B.wear>=0&&B.wear<=B.seen?B.wear:B.seen; }
/* the glow finish in effect for the bones' edge: a preview (boShow().fin), else the worn finish when it's a glow */
function boFin(){ const s=boShow(); if(s.fin!==undefined&&s.fin!==null) return s.fin; try{ const f=S.finish; return FINISHES.some(x=>x.id===f)&&vxHas("finish:"+f)?f:null; }catch(e){ return null; } }
function boVaultOn(){ try{ const F=window.BODY_FX; if(F&&F.inShot&&F.shotFx&&F.shotFx.look&&Object.prototype.hasOwnProperty.call(F.shotFx.look,"fin")) return typeof vtIsId==="function"&&vtIsId(F.shotFx.look.fin); return typeof vtFinishNow==="function"&&!!vtFinishNow(); }catch(e){ return false; } }
function boMatCols(i){ const k=boMats()[i][1]; return [1,2,3].map(n=>boRgbF(boTok(`--mt-${k}${n}`))); }

/* ---------- the material on the 3D figure ---------- */
(()=>{ try{ if(!window.BODY_FX) return;
  BODY_FX.add({ id:"bones", uniforms:["uBoA","uBoB","uBoE","uBoK","uBoM","uBoC","uBoR"],
    decl:`uniform vec3 uBoA; uniform vec3 uBoB; uniform vec3 uBoE; uniform float uBoK; uniform float uBoM; uniform float uBoC; uniform float uBoR;
      float boH(vec3 x){ return fract(sin(dot(x,vec3(12.9898,78.233,37.719)))*43758.5453); }`,
    base:`if(uBoK>0.){
        /* the material: a lit gradient from shade to base, a fresnel edge, and each material's own surface */
        float lt=clamp(dif*.9+.1,0.,1.);
        vec3 bm=mix(uBoB,uBoA,pow(lt,1.1))*.62;   /* darker overall: a hint of the material, not a paint job (20 Oct) */
        vec3 hv=normalize(L-vd); float sp=pow(max(dot(n,hv),0.),28.);
        if(uBoM<0.5){ bm*=.94+.08*boH(floor(p*70.)); }                                   /* Bone: a little grain */
        else if(uBoM<1.5){ bm*=.78+.34*boH(floor(p*140.)); }                              /* Stone: speckle, matte */
        else if(uBoM<2.5){ bm+=uBoE*sp*.25; }                                             /* Iron: a cold shine */
        else if(uBoM<3.5){ bm=mix(bm,uBoE,pow(1.-ndv,2.2)*.3); bm+=vec3(.9,.8,1.)*sp*.18; }   /* Obsidian: glossy, purple sheen at the edges */
        else if(uBoM<4.5){ bm+=uBoE*sp*.3; float sw=smoothstep(.12,0.,abs(p.y-mod(uFxT*.35,2.4)+.3)); bm+=uBoE*sw*.18; }   /* Gold: shine and a slow sweep */
        else { float h=boH(floor(p*90.)); bm+=uBoE*step(.985,h)*(.35+.3*sin(uFxT*3.+h*40.)); bm=mix(bm,uBoE,pow(1.-ndv,2.5)*.2); }   /* Starforged: stars and an icy edge */
        col=mix(col,bm,uBoK)+uBoE*rim*uBoR;
        if(uBoC>0.){ float cr=step(.93,boH(floor(p*vec3(26.,40.,26.))))*step(abs(sin(p.y*60.+p.x*40.)),uBoC*.6); col=mix(col,vec3(1.),cr*uBoC); col+=vec3(uBoC*uBoC*.6); }
      }`,
    fill:`col=mix(col,vec3(dot(col,vec3(.3,.59,.11))),.14)*.86;`,   /* the muscle colours a touch calmer (20 Oct: "too bright") */
    draw(gl,U){ const m=boMatNow(), c=boMat.c&&boMat.c.i===m?boMat.c:(boMat.c={i:m,v:boMatCols(m)});
      const fin=boFin(), F=fin&&fin!=="ice"?FINISHES.find(x=>x.id===fin):null, vault=boVaultOn();
      gl.uniform3fv(U.uBoA,c.v[0]); gl.uniform3fv(U.uBoB,c.v[1]); gl.uniform3fv(U.uBoE,F?F.col:c.v[2]);
      gl.uniform1f(U.uBoR,vault?0:F?.75:.11);   /* a glow finish lights the edges in its colour (20 Oct: looks must differ) */
      gl.uniform1f(U.uBoK,vault?0:.5); gl.uniform1f(U.uBoM,m); gl.uniform1f(U.uBoC,boShow().crack); },
    busy:()=>{ const m=boMatNow(); return m===4||m===5||boShow().crack>0; } });
}catch(e){ console.warn("Ossa: bones fx",e); } })();
function boMat(){}

/* ---------- head, eyes and shadow: a canvas over the hero ---------- */
function boHere(){ try{ return typeof lxHome==="function"?lxHome():(TAB==="today"); }catch(e){ return false; } }
function boLoop(){
  if(boLoop.on) return; boLoop.on=true;
  /* ~30 fps like the scene behind it; off the Body page it naps (a check twice a second) instead of spinning every frame (perf, 21 Oct) */
  let last=0;
  const f=t=>{ if(document.hidden||!boHere()){ boLoop.raf=0; setTimeout(()=>{ boLoop.raf=requestAnimationFrame(f); },500); return; }
    boLoop.raf=requestAnimationFrame(f); if(t-last<30) return; last=t; try{ boDraw(t); }catch(e){} };
  boLoop.raf=requestAnimationFrame(f);
}
function boP(x,y,z){ try{ const p=Body.project([x,y,z]); return p; }catch(e){ return null; } }
function boDraw(t){
  const h=$("rdHero"); if(!h) return; let cv=$("boCv");
  if(!cv){ cv=document.createElement("canvas"); cv.id="boCv"; cv.className="bo-cv"; cv.setAttribute("aria-hidden","true"); h.appendChild(cv); }
  const hr=h.getBoundingClientRect(), st=$("stage"), sr=st?st.getBoundingClientRect():hr, d=Math.min(2,devicePixelRatio||1);
  if(cv.width!==Math.round(hr.width*d)||cv.height!==Math.round(hr.height*d)){ cv.width=Math.round(hr.width*d); cv.height=Math.round(hr.height*d); }
  const g=cv.getContext("2d"); g.setTransform(d,0,0,d,0,0); g.clearRect(0,0,hr.width,hr.height);
  const ox=sr.left-hr.left, oy=sr.top-hr.top, P=(x,y,z)=>{ const p=boP(x,y,z); return p?{x:p.x+ox,y:p.y+oy,yaw:p.yaw}:null; };
  const head=P(0,1.72,0), top=P(0,1.80,0), feet=P(0,0.02,0); if(!head||!top||!feet) return;
  const R=Math.max(8,Math.abs(head.y-top.y)*1.15), face=Math.cos(head.yaw), fr=face>0.15, m=reduced?0:t/1000;
  const r=boRanks(), col=v=>boTok(v), rgb=v=>{ const c=boRgbF(boTok(v)); return `${Math.round(c[0]*255)},${Math.round(c[1]*255)},${Math.round(c[2]*255)}`; };
  const OFF=rgb("--sk-off"), STU=rgb("--sk-study");   // token-ok: token colours as rgb
  /* the material's floor glow */
  const me=rgb(`--mt-${boMats()[boMatNow()][1]}3`), fw=Math.abs(head.y-feet.y)*0.32;   // token-ok: token colours as rgb
  { const gr=g.createRadialGradient(feet.x,feet.y,2,feet.x,feet.y,fw); gr.addColorStop(0,`rgba(${me},.12)`); gr.addColorStop(1,`rgba(${me},0)`); g.fillStyle=gr; g.beginPath(); g.ellipse(feet.x,feet.y,fw,fw*.22,0,0,7); g.fill(); }   // token-ok: the material's own edge colour
  /* Offline: the shadow (cumulative) */
  if(r.off>=1){ const gr=g.createRadialGradient(feet.x,feet.y,2,feet.x,feet.y,fw*1.3); gr.addColorStop(0,`rgba(${OFF},.22)`); gr.addColorStop(1,`rgba(${OFF},0)`); g.fillStyle=gr; g.beginPath(); g.ellipse(feet.x,feet.y+2,fw*1.3,fw*.28,0,0,7); g.fill(); }   // token-ok
  const bodyH=Math.abs(head.y-feet.y), cx=(head.x+feet.x)/2, cy=(head.y+feet.y)/2;
  if(r.off>=2){ const sx=Math.sin(m*1.3)*5; [-1,1].forEach(sd=>{ const gr=g.createLinearGradient(cx+sd*bodyH*.12,0,cx+sd*bodyH*.32,0); gr.addColorStop(0,`rgba(${OFF},0)`); gr.addColorStop(.5,`rgba(${OFF},.08)`); gr.addColorStop(1,`rgba(${OFF},0)`); g.fillStyle=gr; g.beginPath(); g.ellipse(cx+sd*(bodyH*.2+sx),cy,bodyH*.09,bodyH*.46,0,0,7); g.fill(); }); }   // token-ok
  if(r.off>=3){ for(let i=0;i<10;i++){ const k=(m*.22+i/10)%1, sd=i%2?1:-1, x=cx+sd*bodyH*(.2+.06*Math.sin(i*2.1+m)), y=feet.y-k*bodyH*1.0, rr=5+k*12, gr=g.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,`rgba(${OFF},${(.1*(1-k)).toFixed(3)})`); gr.addColorStop(1,`rgba(${OFF},0)`); g.fillStyle=gr; g.beginPath(); g.arc(x,y,rr,0,7); g.fill(); } }   // token-ok
  if(r.off>=4){ const gr=g.createRadialGradient(cx,cy-bodyH*.1,bodyH*.25,cx,cy-bodyH*.1,bodyH*.62); gr.addColorStop(0,`rgba(${OFF},0)`); gr.addColorStop(.6,`rgba(${OFF},.06)`); gr.addColorStop(1,`rgba(${OFF},0)`); g.fillStyle=gr; g.beginPath(); g.ellipse(cx,cy-bodyH*.1,bodyH*.34,bodyH*.62,0,0,7); g.fill(); }   // token-ok
  const ph=$("stage")&&$("stage").querySelector("canvas"); if(ph) ph.style.opacity=r.off>=5?".8":"";
  /* Study: the head (cumulative) */
  const ST=`rgba(${STU},`; g.shadowColor=col("--sk-study"); g.shadowBlur=5; g.globalAlpha=.7;   // token-ok
  if(fr&&r.study>=1){ g.strokeStyle=ST+".95)"; g.lineWidth=1.6; const x=head.x, y=head.y-R*.42, s=R*.16; g.beginPath(); g.moveTo(x,y-s); g.lineTo(x+s*.8,y); g.lineTo(x,y+s); g.lineTo(x-s*.8,y); g.closePath(); g.moveTo(x,y-s*1.4); g.lineTo(x,y+s*1.4); g.stroke(); }
  if(fr&&r.study>=2){ g.strokeStyle=ST+".8)"; g.lineWidth=1.2; [-1,1].forEach(sd=>{ for(let i=0;i<3;i++){ const y=head.y-R*.3+i*R*.18, x=head.x+sd*R*.78; g.beginPath(); g.moveTo(x,y); g.lineTo(x+sd*R*.22,y-R*.06); g.stroke(); } }); }
  if(r.study>=3){ for(let i=0;i<8;i++){ const a=i/8*Math.PI*2+m*.6, z=Math.sin(a), x=head.x+Math.cos(a)*R*1.6, y=head.y-R*.5+z*R*.25; g.strokeStyle=ST+(z>0?".95)":".35)"); g.lineWidth=1.4; const q=R*.16; g.beginPath(); g.moveTo(x,y-q); g.lineTo(x,y+q); if(i%2){ g.moveTo(x,y-q); g.lineTo(x+q*.8,y-q*.2); } else { g.moveTo(x-q*.7,y); g.lineTo(x+q*.7,y-q*.5); } g.stroke(); } }
  if(r.study>=4){ const w=R*1.05, y=top.y-R*.2, gr=g.createLinearGradient(0,y-R*.9,0,y); gr.addColorStop(0,ST+"0)"); gr.addColorStop(1,ST+".9)"); g.fillStyle=gr; g.beginPath(); g.moveTo(head.x-w,y);
    for(let i=0;i<5;i++){ const x0=head.x-w+i*w*.5, hh=(i===2?R*.95:i%2?R*.6:R*.75)*(1+.06*Math.sin(m*2+i)); g.lineTo(x0+w*.25,y-hh); g.lineTo(x0+w*.5,y); } g.closePath(); g.fill();
    g.fillStyle=ST+"1)"; for(let i=0;i<5;i++){ const x0=head.x-w+i*w*.5, hh=(i===2?R*.95:i%2?R*.6:R*.75)*(1+.06*Math.sin(m*2+i)); g.beginPath(); g.arc(x0+w*.25,y-hh,R*.07,0,7); g.fill(); } }
  if(fr&&r.study>=5){ const x=head.x, y=head.y-R*.3; g.fillStyle=ST+".35)"; g.beginPath(); g.ellipse(x,y,R*.32,R*.18,0,0,7); g.fill(); g.fillStyle=ST+"1)"; g.beginPath(); g.ellipse(x,y,R*.2,R*.1,0,0,7); g.fill(); g.fillStyle=col("--bg"); g.beginPath(); g.ellipse(x,y,R*.05,R*.09,0,0,7); g.fill(); }
  g.shadowBlur=0; g.globalAlpha=1;
  /* Focus: the eyes (one look; they blink) */
  if(fr){ const ek=["--eye-e","--glow","--sk-focus","--eye-b","--text-1","--mt-b3"][r.focus], ec=col(ek), blink=(!reduced&&(m%4.2)<.12)?.12:1;
    [-1,1].forEach(sd=>{ const x=head.x+sd*R*.36, y=head.y+R*.02;
      if(r.focus===5){ g.fillStyle=col("--bg"); g.strokeStyle=ec; g.lineWidth=1.5; g.shadowColor=ec; g.shadowBlur=10; g.beginPath(); g.ellipse(x,y,R*.2,R*.1*blink,sd*.25,0,7); g.fill(); g.stroke(); g.shadowBlur=0; return; }
      if(r.focus){ const hr=R*.55, gh=g.createRadialGradient(x,y,0,x,y,hr); gh.addColorStop(0,ec); gh.addColorStop(1,"rgba(0,0,0,0)"); g.globalAlpha=.2; g.fillStyle=gh; g.beginPath(); g.arc(x,y,hr,0,7); g.fill(); g.globalAlpha=1; }
      g.fillStyle=ec; g.shadowColor=ec; g.shadowBlur=r.focus?7:0; g.globalAlpha=.85; g.beginPath(); g.ellipse(x,y,R*.17,R*.07*blink,sd*.25,0,7); g.fill(); g.shadowBlur=0;
      g.globalAlpha=1; if(r.focus){ g.fillStyle="rgba(255,255,255,.5)"; g.beginPath(); g.ellipse(x,y,R*.05,R*.025*blink,0,0,7); g.fill(); }
      if(r.focus===3&&!reduced){ for(let i=0;i<3;i++){ const k=(m*1.5+i/3)%1; g.globalAlpha=.6*(1-k); g.beginPath(); g.arc(x+Math.sin(m*9+i)*2,y-k*R*.6,R*.06*(1-k),0,7); g.fill(); } g.globalAlpha=1; }
      if(r.focus===4){ const gr=g.createLinearGradient(x,y,x+sd*R*1.6,y-R*.2); gr.addColorStop(0,"rgba(255,255,255,.45)"); gr.addColorStop(1,"rgba(255,255,255,0)"); g.fillStyle=gr; g.beginPath(); g.moveTo(x,y-2); g.lineTo(x+sd*R*1.6,y-R*.35); g.lineTo(x+sd*R*1.6,y+R*.05); g.closePath(); g.fill(); } }); }
  /* the reforge: white cracks over the body, then a flash */
  const S2=boShow(); if(S2.flash>0){ g.fillStyle=`rgba(255,255,255,${S2.flash.toFixed(2)})`; g.fillRect(0,0,hr.width,hr.height); }
}
/* ---------- the Body page: the material line, the RANK hex, three skill cards ---------- */
function boHead(){
  /* the "Before" layout Andrej preferred (20 Oct), tidied: "BONES · IRON" under the title, a RANK hex beside the streak,
     three skill cards under the body. Each opens what it names */
  const tv=$("tv-today"); if(!tv) return; const top=tv.querySelector(".u-top"); if(!top) return;
  const m=boMatNow(), M=boMats()[m], L=luRanks()[m][0], tx=top.querySelector(".u-top-tx"), s=luS(), T=luTypes(), R=luRanks();
  if(tx&&!tx.querySelector(".bo-mat")) tx.querySelector(".u-h1").insertAdjacentHTML("afterend",`<span class="bo-mat" style="--me:var(--mt-${M[1]}3)">Bones · ${M[0]}</span>`);
  const rr=top.querySelector(".u-top-r");
  if(rr&&!$("boRank")){ rr.insertAdjacentHTML("afterbegin",`<button class="bo-rank" id="boRank" style="--m1:var(--mt-${M[1]}1);--m2:var(--mt-${M[1]}2);--me:var(--mt-${M[1]}3)" aria-label="Overall rank ${L}, ${M[0]} bones. Rank road"><small>Rank</small><b>${L}</b></button>`);
    $("boRank").onclick=()=>{ Pulse.buzz(8); try{ luUi().fromBody=true; luUi().road=luCur(); }catch(e){} uiFocusOpen("road"); }; }
  const read=$("lxRead"); if(read&&!$("boSk")){
    read.insertAdjacentHTML("beforebegin",`<div class="bo-sk" id="boSk">${luKeys().map(k=>{ const i=luRank(s[k].lv); return `<button data-k="${k}" style="--c:var(${T[k].c})" aria-label="${T[k].n}: rank ${R[i][0]}, ${T[k].titles[i]}, level ${s[k].lv}"><small>${T[k].n} · ${R[i][0]}</small><b>${T[k].titles[i]}</b><em>LV ${s[k].lv}</em></button>`; }).join("")}</div>`);
    $("boSk").querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{ Pulse.buzz(6); luUi().cur=b.dataset.k; uiFocusOpen("home"); }); }
}
/* ---------- the reforge and the skill rank-ups, once each, on Body ---------- */
function boCheck(){
  const B=boS(), now=boOverall(), R=boRanks();
  if(now>B.seen){ const from=B.seen; B.seen=now; B.sk=R; save(); boReforge(from,now); return; }
  if(now<B.seen){ B.seen=now; save(); }
  const T=luTypes(), up=luKeys().find(k=>R[k]>(+B.sk[k]||0));
  if(up){ B.sk=R; save(); boBanner(`${T[up].n.toUpperCase()} RANK ${luRanks()[R[up]][0]}`,T[up].titles[R[up]],`var(${T[up].c})`); try{ hap("success"); }catch(e){} return; }
  if(luKeys().some(k=>R[k]<(+B.sk[k]||0))){ B.sk=R; save(); }
}
function boReforge(from,to){
  const S2=boShow(); S2.mat=from; const M=boMats()[to];
  if(reduced){ S2.mat=null; boBanner(`BONES REFORGED · RANK ${luRanks()[to][0]}`,M[0],`var(--mt-${M[1]}3)`); try{ hap("heavy"); }catch(e){} return; }
  const t0=performance.now();
  const step=t=>{ const k=(t-t0)/1000;
    S2.crack=Math.min(1,k); if(k>1&&S2.mat!==null){ S2.mat=null; S2.flash=.9; try{ hap("heavy"); Pulse.buzz([30,60,40]); }catch(e){} boBanner(`BONES REFORGED · RANK ${luRanks()[to][0]}`,M[0],`var(--mt-${M[1]}3)`); }
    if(k>1) { S2.crack=Math.max(0,1-(k-1)*2); S2.flash=Math.max(0,S2.flash-.04); }
    try{ Body.fxKick&&Body.fxKick(); }catch(e){}
    if(k<1.8||S2.flash>0) requestAnimationFrame(step); else { S2.crack=0; S2.flash=0; } };
  requestAnimationFrame(step);
}
/* the header after a reforge: the material line and the RANK hex follow */
function boHeadSet(){
  ["boRank","boSk"].forEach(id=>{ const e=$(id); if(e) e.remove(); }); const ml=document.querySelector("#tv-today .bo-mat"); if(ml) ml.remove(); boHead();
}
function boBanner(a,b,c){ try{ boHeadSet(); }catch(e){}
  let el=$("boBan"); if(el) el.remove(); el=document.createElement("div"); el.id="boBan"; el.className="bo-ban"; el.style.setProperty("--c",c);
  el.innerHTML=`<small>${uiEsc(a)}</small><b>${uiEsc(b)}</b>`; el.setAttribute("role","status");
  const h=$("rdHero")||$("app"); h.appendChild(el); requestAnimationFrame(()=>el.classList.add("on"));
  setTimeout(()=>{ el.classList.remove("on"); setTimeout(()=>el.remove(),400); },3600);
}
/* wiring: the Body page gets the header bits and the check each time it draws */
(()=>{ if(typeof renderToday!=="function") return; const _r=renderToday; renderToday=function(){ const v=_r.apply(this,arguments);
  try{ boHead(); boLoop(); setTimeout(()=>{ try{ if(boHere()) boCheck(); }catch(e){} },900); }catch(e){ console.warn("Ossa: bones",e); }
  return v; }; })();
try{ vxOn("skills",()=>{ /* the next Body visit plays any reforge */ }); }catch(e){}
/* Posture scan and Body check live on Recover (Andrej, 20 Oct: "put posture scan and body check in the recover tab"):
   a "Checks" pair under Recover's tiles, with when each is due; the Body page no longer shows them */
(()=>{ if(typeof renderRecover!=="function") return; const _r=renderRecover; renderRecover=function(){ const v=_r.apply(this,arguments);
  try{ const t=document.querySelector("#tv-recover .rcv-tiles"); if(t&&!$("rcvChecks")&&typeof lxQuests==="function"){ const q=lxQuests();
      const one=(id,ic,name,st)=>`<button class="rcv-ck${st.k!=="ok"?" due":""}" id="${id}"><span class="u-ic">${ic}</span><span><b>${name}</b><small>${uiEsc(st.s)}</small></span></button>`;
      t.insertAdjacentHTML("afterend",`<section class="rcv-checks" id="rcvChecks"><div class="u-section-h"><span class="u-eyebrow">Checks</span></div><div class="rcv-cks">${one("rcvPs",UI_IC.posture,"Posture scan",q.ps)}${one("rcvCk",UI_IC.age,"Body check",q.ck)}</div></section>`);
      $("rcvPs").onclick=()=>{ Pulse.buzz(8); try{ track("recover_cta",{w:"ps"}); }catch(e){} psOpen(psDue()||!psLast()?{from:"recover"}:{go:"results",from:"recover"}); };
      $("rcvCk").onclick=()=>{ Pulse.buzz(8); try{ track("recover_cta",{w:"ck"}); }catch(e){} openBodyCheck(bcDue()||!bcLast()?undefined:"results"); }; } }catch(e){ console.warn("Ossa: recover checks",e); }
  return v; }; })();
