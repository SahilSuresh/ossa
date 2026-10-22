/* =========================================================
   ROCK — the onboarding body starts as stone and breaks away as you answer (the Opal-style onboarding, 19 Oct).
   A BODY_FX effect ("ob-rock") whose GLSL goes in at FX:decl and FX:ob (the onboarding branch of the body's shader).
   It is added only while the intro runs (obRockStart / obRockStop), so day-to-day users never compile or pay for it.
   obRock(v)                the tide, 0..0.98: breaks from the heart outwards. Only moves forward
   obStrike(id,o)           break one place: a region of REGIONS, or "head". o:{reach, pending, tag, quiet}
                            pending: a red hairline only (an ache you've tapped); obStrikeOff(id) takes a pending one away;
                            obStrike(id) again without pending breaks it. A reach only grows, so a chip never comes back
   obRockTint(tok,ms)       the light in the seams takes a token colour for ms (0: until obRockTint(null))
   obRockFinal()            the rest breaks with a flash (the reveal, after Pro)
   rkFace()                 true once the head is out (the head only bobs as it talks after that)
   Shown only while #app has .onboarding. Reduced motion: the shell still breaks (it is the progress), with no easing,
   flares or falling chips. No WebGL, or the effect didn't compile: a stone CSS filter on #stage that lifts as it breaks.
   ========================================================= */
/* the GLSL: decl (uniforms and helpers, at FX:decl) and ob (the shell, at FX:ob in the onboarding branch) */
function rkGlsl(){ return rkGlsl.g||(rkGlsl.g={decl:`
uniform vec4 uRock;      // onboarding rock: x tide 0..1 (eased), y seconds since the last crack, z on, w seed
uniform vec4 uRockB;     // x order (0 scatter, 1 heart outwards, 2 head down), y seconds since the final break (<0 none), z calm (reduced motion)
uniform vec4 uRockC;     // xyz where the tide starts (the heart, for this figure), w the boots line: chips below it wait for the final break
uniform vec4 uRockT;     // rgb a tint for the light in the seams, a how much (rank flashes, the cold light on the hard news)
uniform vec4 uRockF[12]; // strikes: xyz centre in rest space (x mirrored, >=0), w reach in metres (>0 breaking, <0 pending: a red hairline)
const vec3 RK_S=vec3(13.,10.,13.);   // cells per metre: chips about 8 cm across, a little taller than wide
uvec3 rkPcg(uvec3 v){ v=v*1664525u+1013904223u; v.x+=v.y*v.z; v.y+=v.z*v.x; v.z+=v.x*v.y; v^=v>>16u;
  v.x+=v.y*v.z; v.y+=v.z*v.x; v.z+=v.x*v.y; return v; }
vec3 rkHash(vec3 c){ return vec3(rkPcg(uvec3(c+4096.)))*(1./4294967295.); }
float rkBand(){ return max(0.003,0.05*exp(-uRock.y/0.6)); }   // chips at a break crumble, then finish
float rkStrikeD(vec3 qc, vec4 f){ return length((qc-f.xyz)*vec3(1.,0.85,1.))/abs(f.w); }   // 0 at a strike's centre, 1 at its reach (a little taller than wide)
/* when a chip breaks: 0.01 (first) .. 0.95 (last) for the tide; a strike pulls it under the tide; boots wait for the end.
   Keys only ever get lower while a screen is up (the tide and the reaches only grow), so a chip never comes back */
float rkKey(vec3 cc, float hx){
  float o=uRockB.x, k=hx;
  if(o>0.5&&o<1.5) k=mix(hx,pow(clamp(length((cc-uRockC.xyz)*vec3(1.,0.75,1.))/0.85,0.,1.),0.65),0.75);
  else if(o>1.5) k=mix(hx,clamp((1.80-cc.y)/1.75,0.,1.),0.75);
  k=0.01+0.94*k;
  vec3 qc=vec3(abs(cc.x),cc.y,cc.z); float s=0., band=rkBand(), f=band/0.05;
  for(int i=0;i<12;i++){ vec4 F=uRockF[i];
    if(F.w>0.001) s=max(s,clamp((1.-rkStrikeD(qc,F))/(0.25*f),0.,1.)); }   // 0 at the reach, 1 a little inside it
  if(s>0.) k=min(k,uRock.x-band*2.*s);                                       // crumbling at the rim of the hole, gone inside
  if(cc.y<uRockC.w) k=max(k,0.985);                                          // the boots: only the final break frees the feet
  return k;
}
/* 3D cells (27 lookups): offsets from p to the nearest and second-nearest feature points, and their hashes */
void rkVor(vec3 p, out vec3 d1, out vec3 h1, out vec3 d2, out vec3 h2){
  vec3 i=floor(p), f=p-i; float b1=9., b2=9.;
  d1=vec3(0.); d2=vec3(0.); h1=vec3(0.); h2=vec3(0.);
  for(int z=-1;z<=1;z++) for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec3 g=vec3(float(x),float(y),float(z)), h=rkHash(i+g), d=g+0.12+0.76*h-f; float dd=dot(d,d);
    if(dd<b1){ b2=b1; d2=d1; h2=h1; b1=dd; d1=d; h1=h; }
    else if(dd<b2){ b2=dd; d2=d; h2=h; }
  }
}
/* stone: each chip a facet leaning its own way (loose ones lean more), grainy grey-brown, dark lichen, a faint cool rim */
vec3 rkStone(vec3 n0, float nv, vec3 h, float lean, float grain, float lich){
  vec3 nf=normalize(n0+(h-0.5)*lean);
  float l1=clamp(dot(nf,normalize(-uFw*0.5-uRt*0.6+uUp*0.85)),0.,1.), l2=clamp(dot(nf,normalize(uFw*0.3+uRt*0.8-uUp*0.2)),0.,1.);
  vec3 base=mix(vec3(0.24,0.22,0.20),vec3(0.40,0.37,0.33),h.y)*(0.78+0.44*grain);
  base=mix(base,vec3(0.10,0.12,0.09),lich);
  return base*(0.16+0.9*pow(l1,1.2)+0.25*l2)+vec3(0.55,0.58,0.62)*pow(1.-nv,3.)*0.3;
}
`, ob:`
if(uRock.z>0.5){
  vec3 LIME=vec3(0.831,1.0,0.0), EMBER=vec3(1.0,0.55,0.18), ACHE=vec3(1.0,0.3,0.26);
  vec3 LIT=mix(LIME,uRockT.rgb,uRockT.a);                              // the light in the seams (a rank colour for a moment, or cold)
  float calm=uRockB.z, ago=exp(-uRock.y/0.8)*(1.-0.7*calm);           // a crack flares for about 0.8 s
  if(uRock.x<1.){
    vec3 so=uRock.w*vec3(7.31,3.17,5.43), rp=r*RK_S+so, d1, h1, d2, h2; rkVor(rp,d1,h1,d2,h2);
    vec3 c1=(rp+d1-so)/RK_S, c2=(rp+d2-so)/RK_S;
    float x=uRock.x, k1=rkKey(c1,h1.x), k2=rkKey(c2,h2.x);
    float e=dot(0.5*(d1+d2),normalize(d2-d1)), ew=fwidth(e)+1e-4;    // distance to this chip's edge, in cells
    float band=rkBand();
    float t1=(x-k1)/band, t2=(x-k2)/band;                              // <=0 whole, 0..1 crumbling, >=1 gone
    float rr=e-clamp(t1,0.,1.)*0.5, rw=fwidth(rr)+1e-4;                // a crumbling chip wears in from its edges
    float keep=t1<=0.?1.:smoothstep(-rw,rw,rr)*step(t1,1.);
    vec3 q1=vec3(abs(c1.x),c1.y,c1.z); float pend=0.;                  // a pending strike (an ache you've tapped): a red hairline, no break
    for(int i=0;i<12;i++){ vec4 F=uRockF[i]; if(F.w<-0.001) pend=max(pend,1.-smoothstep(0.6,1.,rkStrikeD(q1,F))); }
    float near=max(1.-clamp((k1-x)/0.1,0.,1.),pend*0.7);              // 1 at the break, 0 far from it
    float seam=1.-smoothstep(0.,mix(0.025,0.08,near)+ew,e);            // crevices open as the break comes close
    float line=1.-smoothstep(0.,0.02+ew*1.2,e);
    float brk=step(1e-4,t2), lip=brk*(1.-smoothstep(0.,0.14,e));       // the fresh, paler face where a neighbour came away
    float grain=vn3(r*85.), lich=smoothstep(0.62,0.82,vn3(r*16.+h1*5.))*0.55*(1.-near);
    vec3 rock=rkStone(n0,nv,h1,mix(0.18,0.6,near),grain,lich);
    rock=mix(rock,vec3(0.02,0.022,0.018),seam*0.85*(1.-lip));
    rock=mix(rock,vec3(0.46,0.43,0.39)*(0.35+0.65*da),lip*0.6);
    float glow=line*near*near*(1.2*ago+0.12*(0.5+bt)*x*(1.-0.5*calm))      // light leaks through; a new crack flares
              +brk*(1.-smoothstep(0.,0.03+ew,e))*ago*1.2;
    float ember=(1.-smoothstep(0.,0.06,rr))*step(1e-4,t1)*step(t1,1.)*(1.-0.6*calm);
    rock+=LIT*glow*(1.-pend)+mix(EMBER,LIT,0.3)*ember*1.3+ACHE*line*pend*(0.55+0.45*sin(tm*3.2))*(1.-0.5*calm);
    if(uScan<1.){ float sy=mix(1.95,-0.06,uScan); keep*=smoothstep(sy-0.012,sy+0.07,vW.y); }
    c=mix(c,rock,keep); obA=max(obA,keep);
  }
  if(uRockB.y>=0.){ float fl=exp(-uRockB.y*2.4)*(1.-0.6*calm);        // the last break: a flash through the body
    c+=(vec3(0.86,0.93,1.0)*0.45+LIME*0.5*pow(1.-nv,2.))*fl; }
}
`}); }

function rkS(){ return rkS.s||(rkS.s={on:false,x:0,tg:0,crackAt:-1e9,finalAt:-1,last:0,seed:0,order:1,F:[],
  tint:[0,0,0],ta:0,taT:0,tintTo:0,heart:[0.03,1.26,0.06],boots:0.40,face:false}); }
function rkGL(){ return !!(typeof Body!=="undefined"&&Body.kind==="gl"&&window.BODY_FX&&BODY_FX.active&&BODY_FX.ids.includes("ob-rock")); }
function rkShown(){ const a=document.getElementById("app"); return rkS().on&&!!a&&a.classList.contains("onboarding"); }
function rkKick(){ try{ Body.fxKick&&Body.fxKick(); }catch(e){} }
function rkFace(){ return !rkS().on||rkS().face; }
function rkFig(){ return S.body==="f"&&FIGURES.f?"f":"m"; }
function rkReach(id){ return ({head:0.12,chest:0.10,shoulders:0.08,arms:0.08,core:0.09,upperback:0.10,lowerback:0.09,glutes:0.09,thighs:0.10,lowerlegs:0.09})[id]||0.09; }   /* windows, not whole regions: the big break is the seal (19 Oct, tuned in the preview) */
/* a region's centre in rest space (x mirrored), from this figure's muscle centres; "head" has no muscles */
function rkCen(id){
  if(id==="head") return figP([0,1.65,0.02]);
  const ms=((REGIONS[id]&&REGIONS[id].muscles)||[]).map(k=>MCEN[k]).filter(Boolean); if(!ms.length) return null;
  return [0,1,2].map(i=>ms.reduce((a,m)=>a+(i?m[i]:Math.abs(m[0])),0)/ms.length);
}

/* the effect is compiled in only for the intro */
function obRockStart(){
  if(typeof Body!=="undefined"&&Body.kind==="gl"&&window.BODY_FX&&!BODY_FX.ids.includes("ob-rock")){
    BODY_FX.add(rkFx());
    if(!(Body.fxRebuild&&Body.fxRebuild())){ console.warn("Ossa: the rock didn't compile, so the intro uses the stone filter");
      BODY_FX.drop(["ob-rock"]); Body.fxRebuild&&Body.fxRebuild(); }
  }
  obRockOn(true,{order:1});
}
function obRockStop(){
  obRockOn(false);
  if(window.BODY_FX&&BODY_FX.ids.includes("ob-rock")) setTimeout(()=>{ try{ if(rkS().on) return; BODY_FX.drop(["ob-rock"]); Body.fxRebuild&&Body.fxRebuild(); }catch(e){ console.warn(e); } },1200);
}
function obRockOn(on,o){ const s=rkS();
  Object.assign(s,{on:!!on,x:0,tg:0,crackAt:-1e9,finalAt:-1,last:performance.now(),seed:Math.floor(Math.random()*64)/8,
    order:o&&o.order!=null?o.order:1,F:[],ta:0,taT:0,tintTo:0,face:false});
  rkFit(); rkCss(); rkKick(); }
/* the heart (where the tide starts) and the boots line follow the figure; call again after the frame step swaps it */
function rkFit(){ const s=rkS();
  try{ const oc=organData(rkFig())[0]; s.heart=[oc[0],oc[1],oc[2]]; }catch(e){}
  const ll=rkCen("lowerlegs"); s.boots=ll?ll[1]+0.09:figP([0,0.40,0])[1];
  s.F.forEach(f=>{ const c=rkCen(f.id); if(c) f.c=c; }); rkKick(); }
function obRock(v,o){ const s=rkS(); o=o||{}; if(!s.on||s.finalAt>0) return; v=Math.max(0,Math.min(0.98,+v||0)); if(v<=s.tg+0.004) return;
  const step=v-s.tg; s.tg=v; s.crackAt=performance.now(); if(reduced) s.x=v; rkCss();
  if(!o.quiet){ try{ Pulse.buzz(step>0.06?[12,40,16]:10); }catch(e){} rkKnock(Math.min(1,step*8)); rkChips(Math.round(6+120*step),{}); }
  rkKick(); }
function obStrike(id,o){ const s=rkS(); o=o||{}; if(!s.on||s.finalAt>0) return;
  const c=rkCen(id); if(!c) return;
  const reach=o.reach||rkReach(id); let f=s.F.find(x=>x.id===id);
  if(o.pending){ if(f||s.F.length>=12) return; s.F.push({id,c,w:-reach,e:-reach*0.3}); try{ Pulse.buzz(6); }catch(e){} rkKick(); return; }
  if(!f){ if(s.F.length>=12) return; f={id,c,w:0,e:0}; s.F.push(f); }
  if(f.w<0){ f.e=0; f.w=0; }                 // a pending hairline breaks open from its centre
  if(reach<=f.w+0.005) return;               // only ever wider
  f.w=reach; s.crackAt=performance.now(); if(reduced) f.e=reach;
  if(id==="head") s.face=true;
  if(!o.quiet){ try{ Pulse.buzz([12,40,16]); }catch(e){} rkKnock(0.6); rkChips(Math.round(20+120*reach),{at:c,r:reach}); }
  if(o.tag) rkTag(o.tag,c);
  rkCss(); rkKick(); }
function obStrikeOff(id){ const s=rkS(), i=s.F.findIndex(x=>x.id===id&&x.w<0); if(i>=0){ s.F.splice(i,1); rkKick(); } }
function obRockTint(tok,ms){ const s=rkS();
  if(!tok){ s.taT=0; s.tintTo=0; rkKick(); return; }
  const hex=(fxTok(tok)||"").replace("#",""); if(hex.length!==6) return;
  s.tint=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255); s.taT=1; s.tintTo=ms?performance.now()+ms:0; rkKick(); }
function obRockFinal(){ const s=rkS(); if(!s.on||s.finalAt>0) return;
  s.tg=1; s.crackAt=s.finalAt=performance.now(); s.F=s.F.filter(f=>f.w>0); s.taT=0; if(reduced) s.x=1; rkCss();
  try{ Pulse.buzz([18,60,30]); Body.obFlash(); }catch(e){} rkKnock(1); rkChips(90,{all:true}); rkKick(); }

function rkFx(){ return { id:"ob-rock", uniforms:["uRock","uRockB","uRockC","uRockT","uRockF"], decl:rkGlsl().decl, ob:rkGlsl().ob,
  draw(gl,U,pick){ if(!U.uRock) return;   // the outline pass has no rock
    const s=rkS(), now=performance.now(), dt=Math.min(0.1,(now-(s.last||now))/1000); s.last=now;
    const fin=s.finalAt>0?(now-s.finalAt)/1000:-1;
    if(pick||!rkShown()||fin>2.5){ gl.uniform4f(U.uRock,0,0,0,0); gl.uniform4f(U.uRockB,0,-1,0,0); return; }
    const k=reduced?1:1-Math.exp(-dt/(fin>=0?0.16:0.28)), kr=reduced?1:1-Math.exp(-dt/0.18), kt=reduced?1:1-Math.exp(-dt/0.12);
    s.x+=(s.tg-s.x)*k; if(Math.abs(s.tg-s.x)<0.0005) s.x=s.tg;
    if(s.tintTo&&now>s.tintTo){ s.taT=0; s.tintTo=0; }
    s.ta+=(s.taT-s.ta)*kt; if(Math.abs(s.taT-s.ta)<0.002) s.ta=s.taT;
    const A=rkFx.A||(rkFx.A=new Float32Array(48)); A.fill(0);
    s.F.forEach((f,i)=>{ if(i>=12) return; f.e+=(f.w-f.e)*kr; if(Math.abs(f.w-f.e)<0.001) f.e=f.w; A.set([f.c[0],f.c[1],f.c[2],f.e],i*4); });
    gl.uniform4f(U.uRock,s.x,reduced?9:Math.min(9,(now-s.crackAt)/1000),1,s.seed);
    gl.uniform4f(U.uRockB,s.order,fin>=0?Math.min(9,fin):-1,reduced?1:0,0);
    gl.uniform4f(U.uRockC,s.heart[0],s.heart[1],s.heart[2],s.boots);
    gl.uniform4f(U.uRockT,s.tint[0],s.tint[1],s.tint[2],s.ta);
    gl.uniform4fv(U.uRockF,A); },
  busy(){ const s=rkS(); if(!rkShown()) return false; const now=performance.now();
    return Math.abs(s.tg-s.x)>0.0005||now-s.crackAt<1500||(s.finalAt>0&&now-s.finalAt<2600)||Math.abs(s.taT-s.ta)>0.002||s.F.some(f=>Math.abs(f.w-f.e)>0.001); } }; }

/* no 3D shell: the figure starts stone-grey and its colour comes back as it breaks (strikes count a little) */
function rkCss(){ const st=document.getElementById("stage"); if(!st) return; const s=rkS();
  if(!s.on||rkGL()||s.tg>=1){ st.style.filter=""; return; }
  const v=Math.min(0.95,s.tg+0.02*s.F.filter(f=>f.w>0).length), k=1-v; st.style.transition=reduced?"":"filter .8s var(--ease)";
  st.style.filter=`grayscale(${k.toFixed(2)}) sepia(${(0.3*k).toFixed(2)}) brightness(${(0.6+0.4*v).toFixed(2)}) contrast(${(1.2-0.2*v).toFixed(2)})`; }

/* a short stone knock: filtered noise and a low thump (silent when music is off). 19 Oct: it plays through the app's
   one AudioContext and its limiter (ossAudio in web/ossa.html), with a 2 ms attack instead of a jump to full level
   (the jump clicked), a little quieter, and at most one every 70 ms so a run of cracks can't stack up */
function rkKnock(sz){ try{
  if(S.music===false||typeof ossAudio!=="function") return;
  const now=performance.now(); if(now-(rkKnock.at||0)<70) return; rkKnock.at=now;
  const A=ossAudio(), out=A&&ossAudio.fx(); if(!A||!out) return;
  const t=A.currentTime+0.02;
  if(!rkKnock.buf||rkKnock.buf.sampleRate!==A.sampleRate){
    const n=Math.floor(A.sampleRate*0.09), at=Math.max(1,Math.floor(A.sampleRate*0.002)), b=A.createBuffer(1,n,A.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3)*Math.min(1,i/at);
    rkKnock.buf=b; }
  const src=A.createBufferSource(), lp=A.createBiquadFilter(), g=A.createGain(); src.buffer=rkKnock.buf; src.playbackRate.value=0.92+Math.random()*0.16;
  lp.type="lowpass"; lp.frequency.value=1100-600*sz; g.gain.value=0.14+0.2*sz;
  src.connect(lp); lp.connect(g); g.connect(out); src.start(t); ossAudioDone(src,lp,g);
  const o=A.createOscillator(), og=A.createGain(); o.frequency.setValueAtTime(120-50*sz,t); o.frequency.exponentialRampToValueAtTime(42,t+0.13);
  og.gain.setValueAtTime(0.0001,t); og.gain.exponentialRampToValueAtTime(0.18*sz+0.04,t+0.004); og.gain.exponentialRampToValueAtTime(0.0001,t+0.15);
  o.connect(og); og.connect(out); o.start(t); o.stop(t+0.17); ossAudioDone(o,og);
}catch(e){} }

/* a region's name floats up from where it broke, in lime, and fades */
function rkTag(text,c){
  if(typeof Body==="undefined"||!Body.project) return; const host=document.getElementById("o2"), app=document.getElementById("app"); if(!host||!app) return;
  const p=Body.project(c); if(!p) return; const hr=host.getBoundingClientRect(), ar=app.getBoundingClientRect();
  const el=document.createElement("span"); el.className="rk-tag"; el.setAttribute("aria-hidden","true"); el.textContent=text;
  el.style.left=(p.x+ar.left-hr.left)+"px"; el.style.top=(p.y+ar.top-hr.top)+"px"; host.appendChild(el);
  setTimeout(()=>el.remove(),reduced?900:1400); }

/* chips and dust falling from where the shell broke: a short 2D burst over the stage, in stone tones.
   o.all: the whole body; o.at+o.r: around a strike (either side); otherwise the tide's front around the heart */
function rkChips(n,o){
  o=o||{}; if(reduced||!n||typeof Body==="undefined"||!Body.project) return;
  const host=document.getElementById("o2"), app=document.getElementById("app"); if(!host||!app) return;
  const hr=host.getBoundingClientRect(), ar=app.getBoundingClientRect(); if(!hr.width||!hr.height) return;
  const s=rkS(), cv=document.createElement("canvas"); cv.className="rk-cf"; cv.setAttribute("aria-hidden","true");
  const dpr=Math.min(2,window.devicePixelRatio||1); cv.width=Math.round(hr.width*dpr); cv.height=Math.round(hr.height*dpr);
  host.appendChild(cv); const g=cv.getContext("2d"); if(!g){ cv.remove(); return; } g.scale(dpr,dpr);
  const cols=["--stone-1","--stone-2","--stone-3"].map(fxTok), lime=fxTok("--glow"), H=s.heart;
  const at=()=>{ let p;
    if(o.all) p=figP([(Math.random()-0.5)*0.5,0.1+Math.random()*1.65,0.12]);
    else if(o.at){ const a=Math.random()*6.283, R=Math.sqrt(Math.random())*o.r; p=[o.at[0]*(Math.random()<0.5?-1:1)+Math.cos(a)*R,o.at[1]+Math.sin(a)*R,o.at[2]+0.05]; }
    else { const a=Math.random()*6.283, R=Math.pow(s.tg,1/0.65)*0.85; p=[H[0]+Math.cos(a)*Math.min(R,0.3),H[1]+Math.sin(a)*R/0.75,H[2]+0.06]; }
    const q=Body.project(p); return q&&{x:q.x+ar.left-hr.left,y:q.y+ar.top-hr.top}; };
  const P=[]; for(let i=0;i<n;i++){ const q=at(); if(!q) continue; const dust=Math.random()<0.35;
    P.push({x:q.x,y:q.y,vx:(Math.random()-0.5)*(o.all?5:2.4),vy:-Math.random()*(o.all?3.5:1.6),r:Math.random()*6.28,vr:(Math.random()-0.5)*0.3,
      sz:dust?1+Math.random()*1.5:3+Math.random()*(o.all?8:6),dust,c:Math.random()<0.08?lime:cols[(Math.random()*3)|0],a:1,
      k:[0,1,2,3,4].map(()=>0.55+Math.random()*0.45)}); }
  const t0=performance.now(); let last=t0;
  const f=now=>{ if(!cv.isConnected) return; const k=Math.min(2.2,(now-last)/16.67), t=(now-t0)/1000; last=now;
    g.clearRect(0,0,hr.width,hr.height); let alive=0;
    for(const p of P){ p.vy+=0.22*k; p.x+=p.vx*k; p.y+=p.vy*k; p.r+=p.vr*k; if(t>0.6) p.a-=0.03*k;
      if(p.a<=0||p.y>hr.height+20) continue; alive++;
      g.save(); g.globalAlpha=p.a*(p.dust?0.5:1); g.fillStyle=p.c; g.translate(p.x,p.y); g.rotate(p.r); g.beginPath();
      if(p.dust) g.rect(-p.sz/2,-p.sz/2,p.sz,p.sz);
      else p.k.forEach((m,j)=>{ const a=j/5*6.283; g[j?"lineTo":"moveTo"](Math.cos(a)*p.sz*m,Math.sin(a)*p.sz*m); });
      g.closePath(); g.fill(); g.restore(); }
    if(alive&&t<3) requestAnimationFrame(f); else cv.remove(); };
  requestAnimationFrame(f);
}
