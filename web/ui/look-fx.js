/* =========================================================
   LOOK FX: body looks on our own 3D body (Ossa 2.0 Phase 5 "Evolve", package render, prefix bx)
   Five BODY_FX effects (web/ui/body-fx.js), all optional for callers:
     bx-lib    (decl)            shared GLSL helpers: a soft studio for mirror-like looks, a twill weave
     bx-fin    (decl + base)     the three Pro finishes over the whole body: Obsidian, Chrome, Carbon fibre.
                                 Every layer; muscle colours, sore red and the aura still draw on top
                                 (+ fill: a swatch still's fx.look.only takes the muscle colours back off)
     bx-mats   (decl + fill)     prestige materials per muscle: Black marble, Silver, Gold, with the rank colour
                                 kept in the seams. Rank mode only: off in demos, check views and recovery colours
     bx-ghost  (decl + final)    Ideal self's "your next rank", in stills only: a muscle below its target darkens
                                 and gets hologram lines and a rim in the target's rank colour, by the gap
     bx-arch   (vdecl + vertex)  the Tank / Scout shape (moved here from the shape spike, same maths): the skin
                                 moves along its normal, up to 1 cm × bxArGain(). Live changes ease over 0.6 s
   and bx-gl, a draw-only probe that reads the GL limits once (bxGlLine, a diagnostic line for development).
   When the body's shader with effects never links, no effect draws and the probe can't run: the fallback then
   reads the limits straight from the stage's context (bxGlDirect), so the diagnostic line still has them.
   Pull model: the live look comes from the data owners' pure readers, cached here until bxKick(), a new S
   (Load demo), Body.refresh() or 2 s pass: pzMatsNow() (prestige.js), pthArchNow() (path.js) and
   vtFinishNow() (vault.js). Each one is optional.
   Stills: Body.shot({..., fx:{look:{fin, mats, arch:{a,amt}, ghost}}}). A key that is absent = the live look,
   null = off. fin "obsidian"|"chrome"|"carbon" (an earned finish id only tints the rim); mats {muscle:
   "marble"|"silver"|"gold"}; ghost {muscle: target score}; only:true (stills only) the finish alone, with the
   muscle colours off, for a material swatch.
   API: bxKick, bxPreview, bxLookKey, bxOk, bxTokRGB, bxArGain, bxGlLine.
   Fallback: if the body's shader doesn't build with these looks (BODY_FX.active false after boot), every bx-*
   effect is dropped and the body rebuilt, so sore red, the aura and the chest come back; bxOk() is then false
   and screens use their own fallbacks.
   Preview switches (localhost only, nothing saved): ?look=marble|silver|gold (on the chest, front delts and
   biceps) | obsidian|chrome|carbon, ?arch=tank|scout, ?argain=1|2|3, ?ghost=60 (live on the Body page),
   ?look=fail (a broken chunk, to prove the fallback), ?look=failall (a broken chunk the fallback can't drop, as on
   a phone where sore, aura and chest alone go over its limits: the GL line must still read the limits).
   Start-up rule: function declarations only, state on function properties, include-time code inside a try.
   Every GLSL local and function is prefixed bx.
   ========================================================= */

/* the preview host */
function bxDev(){ try{ return window.OSSA_PREVIEW===true&&/^(localhost|127\.0\.0\.1)$/.test(location.hostname); }catch(e){ return false; } }

/* the looks' own tables (a function property, never a top-level const) */
function bxDefs(){
  return bxDefs.d||(bxDefs.d={
    fin:{ obsidian:{n:1,tok:"--mat-obsidian",rim:"--mat-obsidian-rim"},
          chrome:{n:2,tok:"--mat-chrome",rim:"--mat-chrome"},
          carbon:{n:3,tok:"--mat-carbon",rim:"--mat-carbon-hi"} },
    mat:{marble:1,silver:2,gold:3},
    ids:["bx-lib","bx-fin","bx-mats","bx-ghost","bx-arch","bx-fail"]   // dropped together when they don't compile
  });
}

/* a tokens.css colour as [r,g,b] 0..1, read once per name (vault's rimColor wrapper calls this in every frame).
   Ice's colour when the token is missing. bxKick() clears the cache */
function bxTokRGB(name){
  const c=bxTokRGB.c||(bxTokRGB.c={});
  if(c[name]) return c[name];
  let v=null;
  try{
    const m=/^#?([0-9a-f]{6})$/i.exec(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
    if(m){ const x=parseInt(m[1],16); v=[(x>>16&255)/255,(x>>8&255)/255,(x&255)/255]; }
  }catch(e){}
  if(!v){ try{ v=FINISHES[0].col.slice(); }catch(e){ v=[0.914,0.925,0.945]; } }
  return (c[name]=v);
}

/* the Tank / Scout shape's strength: the skin moves up to 1 cm × this. Default 2 (Andrej picks 1, 2 or 3);
   ?argain=1|2|3 on localhost, and the shape spike's slider (bxArGain.o), override it */
function bxArGain(){
  const cl=v=>Math.max(1,Math.min(3,v));
  if(bxArGain.o!=null&&Number.isFinite(+bxArGain.o)) return cl(+bxArGain.o);
  if(bxArGain.q!=null&&Number.isFinite(+bxArGain.q)) return cl(+bxArGain.q);
  return cl(bxArGain.d||2);
}

/* the figure in use */
function bxFig(){ try{ return typeof S!=="undefined"&&S&&S.body==="f"&&FIGURES.f?"f":"m"; }catch(e){ return "m"; } }

/* a data owner's pure reader, or d when it isn't there (a package still a stub) or throws */
function bxRead(name,d){ try{ const f=window[name]; if(typeof f!=="function") return d; const v=f(); return v==null?d:v; }catch(e){ return d; } }

/* the live look, cached: {fin, mats, arch, ghost}. A preview override (bxPreview) wins key by key */
function bxLook(){
  const s=typeof S!=="undefined"?S:null, now=Date.now(), c=bxLook.c;
  if(c&&c.s===s&&now-c.t<2000) return c;
  const P=bxPreview.o||{}, has=k=>Object.prototype.hasOwnProperty.call(P,k);
  const fin=has("fin")?P.fin:bxRead("vtFinishNow",null);
  const mats=has("mats")?P.mats:bxRead("pzMatsNow",null);
  const arch=has("arch")?P.arch:bxRead("pthArchNow",null);
  let ghost=has("ghost")?P.ghost:null;   // live: only the ?ghost= preview
  if(typeof ghost==="number"&&s&&s.scores){ const t=ghost, g={}; GLORDER.forEach(k=>{ if((+s.scores[k]||0)<t) g[k]=t; }); ghost=g; }
  return (bxLook.c={s, t:now,
    fin:typeof fin==="string"&&fin?fin:null,
    mats:mats&&typeof mats==="object"?mats:null,
    arch:arch&&typeof arch==="object"?arch:null,
    ghost:ghost&&typeof ghost==="object"?ghost:null});
}

/* the look for the pass being drawn: a still's own fx.look key when it has one, else the live look */
function bxCur(k){
  const F=window.BODY_FX, L=F&&F.inShot&&F.shotFx&&F.shotFx.look;
  if(L&&typeof L==="object"&&Object.prototype.hasOwnProperty.call(L,k)) return L[k];
  return bxLook()[k];
}
function bxShotHas(k){
  const F=window.BODY_FX, L=F&&F.inShot&&F.shotFx&&F.shotFx.look;
  return !!(L&&typeof L==="object"&&Object.prototype.hasOwnProperty.call(L,k));
}

/* the look changed: drop the cached look and colours, redraw the body, drop the halo stills */
function bxKick(){
  bxLook.c=null; bxTokRGB.c=null; bxMatsArr.r=null; bxGhostArr.r=null;
  try{ if(typeof Body!=="undefined"&&Body&&Body.fxKick) Body.fxKick(); }catch(e){}
  try{ if(typeof hlKick==="function") hlKick(); }catch(e){}
}

/* a live-body override, nothing saved: {fin?, arch?:{a,amt}, mats?, ghost?}, or null to clear it.
   Only for the preview switches and screens where the live body is visible (never inside #evV or the
   paywall: those use stills with fx.look) */
function bxPreview(o){ bxPreview.o=o&&typeof o==="object"?Object.assign({},o):null; bxKick(); }

/* the effect compiled and is on: kind "fin"|"mats"|"arch"|"ghost" (no kind: all four).
   False on the SVG body, before boot and after the fallback */
function bxOk(kind){
  try{
    if(bxOk.failed) return false;
    if(typeof Body==="undefined"||!Body||Body.kind!=="gl") return false;
    const F=window.BODY_FX; if(!F||F.active!==true||!F.ids.includes("bx-lib")) return false;
    const ks=kind?[kind]:["fin","mats","arch","ghost"];
    return ks.every(k=>F.ids.includes("bx-"+k));
  }catch(e){ return false; }
}

/* a signature of the live look, for still caches: finish, materials, shape, gain, Pro, on/off */
function bxLookKey(){
  try{
    const L=bxLook(), sig=o=>o?Object.keys(o).sort().map(k=>k+"="+o[k]).join(","):"";
    const a=L.arch&&(L.arch.a==="tank"||L.arch.a==="scout")?L.arch.a+(L.arch.amt==null?1:+L.arch.amt):"";
    const pro=typeof isPro==="function"&&isPro()?"pro":"";
    return ["bx",bxOk()?"on":"off",L.fin||"",sig(L.mats),a,bxArGain(),pro,sig(L.ghost)].join("|");
  }catch(e){ return ""; }
}

/* ---------- per-draw data (cached by the look object, so a frame allocates nothing) ---------- */
/* materials: 23 muscle ids packed 4 per vec4 (0 none, 1 marble, 2 silver, 3 gold) */
function bxMatsArr(m){
  if(bxMatsArr.r&&bxMatsArr.k===m) return bxMatsArr.r;
  const a=new Float32Array(24); let n=0;
  if(m&&typeof m==="object") Object.keys(m).forEach(k=>{ const i=GLORDER.indexOf(k), v=bxDefs().mat[m[k]]; if(i>=0&&v){ a[i]=v; n++; } });
  bxMatsArr.k=m; return (bxMatsArr.r={a,n});
}
/* ghost targets per muscle, 4 per vec4 (-1 none) */
function bxGhostArr(g){
  if(bxGhostArr.r&&bxGhostArr.k===g) return bxGhostArr.r;
  const a=new Float32Array(24).fill(-1); let n=0;
  if(g&&typeof g==="object") Object.keys(g).forEach(k=>{ const i=GLORDER.indexOf(k), v=+g[k]; if(i>=0&&Number.isFinite(v)&&v>0){ a[i]=Math.min(100,v); n++; } });
  bxGhostArr.k=g; return (bxGhostArr.r={a,n});
}
/* the shape's landmarks from RIG: shoulder, elbow, wrist, hip, knee, ankle (the +x side) */
function bxArMarks(f){
  const c=bxArMarks.c||(bxArMarks.c={});
  if(c[f]) return c[f];
  const L=RIG[f]||RIG.m;
  return (c[f]=new Float32Array([...L.sh,...L.el,...L.wr,...L.hip,...L.kn,...L.an]));
}
/* {a,amt} → [tank, scout] 0..1 */
function bxArPair(a){
  if(!a||typeof a!=="object") return [0,0];
  const t=Math.max(0,Math.min(1,a.amt==null?1:(+a.amt||0)));
  return [a.a==="tank"?t:0,a.a==="scout"?t:0];
}
/* the live shape, eased over 0.6 s (at once under reduced motion, and on the first frame) */
function bxArStep(){
  const st=bxArStep.s||(bxArStep.s={cur:[0,0],from:[0,0],to:[0,0],t0:0,busy:false,init:false});
  const to=bxArPair(bxLook().arch), now=performance.now();
  if(!st.init){ st.init=true; st.cur=to.slice(); st.from=to.slice(); st.to=to; st.t0=now-1e4; }
  if(to[0]!==st.to[0]||to[1]!==st.to[1]){ st.from=st.cur.slice(); st.to=to; st.t0=now; }
  const red=typeof reduced!=="undefined"&&reduced, k=red?1:Math.min(1,Math.max(0,(now-st.t0)/600)), e=k*k*(3-2*k);
  st.cur[0]=st.from[0]+(st.to[0]-st.from[0])*e; st.cur[1]=st.from[1]+(st.to[1]-st.from[1])*e;
  st.busy=k<1;
  return st;
}
/* the rim a still or the preview asks for: a Pro finish's rim token, an earned finish's colour, or for
   fin null the earned rim (what rimColor gives without a Pro finish) */
function bxRimFor(fin){
  try{
    const k=window.LIVEK||1, sc=c=>k===1?c:c.map(v=>Math.min(1,v*k)), d=fin&&bxDefs().fin[fin];
    if(d) return sc(bxTokRGB(d.rim));
    const f=fin&&FINISHES.find(x=>x.id===fin);
    if(f) return sc(f.col);
    const e=FINISHES.find(x=>x.id===S.finish), c=e&&sessionsN()>=e.at?e.col:FINISHES[0].col;
    return sc(c);
  }catch(e){ return null; }
}

/* ---------- the GL limits, read once (bxGlLine: a one-line summary for development; nothing in the app shows it) ---------- */
function bxGlVec(gl,t){
  if(t===gl.FLOAT_MAT2) return 2;
  if(t===gl.FLOAT_MAT3||t===gl.FLOAT_MAT2x3||t===gl.FLOAT_MAT3x2) return 3;
  if(t===gl.FLOAT_MAT4||t===gl.FLOAT_MAT2x4||t===gl.FLOAT_MAT4x2||t===gl.FLOAT_MAT3x4||t===gl.FLOAT_MAT4x3) return 4;
  return 1;
}
function bxGlRead(gl){
  const g={frag:0,vert:0,n:0,vec:0,bx:0,looks:false,linked:true};
  try{
    g.frag=gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)|0; g.vert=gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)|0;
    const p=gl.getParameter(gl.CURRENT_PROGRAM);
    if(p){
      const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS)|0, idx=[]; for(let i=0;i<n;i++) idx.push(i);
      const blk=n?gl.getActiveUniforms(p,idx,gl.UNIFORM_BLOCK_INDEX):[];
      idx.forEach(i=>{ if(blk[i]!==-1) return; const u=gl.getActiveUniform(p,i); if(!u) return;
        const v=bxGlVec(gl,u.type)*u.size; g.n++; g.vec+=v; if(/^bx/.test(u.name)) g.bx+=v; });
    }
  }catch(e){}
  g.looks=bxOk();
  bxOk.gl=g;
  if(bxDev()) console.log("Ossa body looks: "+bxGlLine());
  return g;
}
/* the limits straight from the stage's own context (getContext returns the one the body made), for when the body's
   shader with effects never linked: BODY_FX.active stays false, no effect draws and the bx-gl probe never runs.
   The active uniforms can't be read then (linked:false); the limits are what the diagnostic line needs most */
function bxGlDirect(){
  const g={frag:0,vert:0,n:0,vec:0,bx:0,looks:false,linked:false};
  try{
    const cv=document.querySelector("#stage canvas"), gl=cv&&cv.getContext("webgl2");
    if(gl){ g.frag=gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)|0; g.vert=gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)|0; }
  }catch(e){}
  bxOk.gl=g;
  if(bxDev()) console.log("Ossa body looks: "+bxGlLine());
  return g;
}
/* one diagnostic line (development only): the phone's uniform limits, the body shader's active uniforms
   (vectors, unpacked: an upper bound; the bx share in brackets) and whether the body looks are on */
function bxGlLine(){
  const g=bxOk.gl, on=bxOk()?"on":"off";
  if(typeof Body!=="undefined"&&Body&&Body.kind&&Body.kind!=="gl") return "GL body off (flat figure) · body looks off";
  if(!g) return `GL not read yet · body looks ${on}`;
  if(g.linked===false) return `GL fragment ${g.frag} · vertex ${g.vert} · body effects didn't build · body looks off`;
  return `GL fragment ${g.frag} · vertex ${g.vert} · active ${g.vec} (${g.n} uniforms, body looks ${g.bx}) · body looks ${on}`;
}

/* ---------- after boot: the Body.refresh wrapper, and the fallback ---------- */
function bxInstall(){
  if(typeof Body==="undefined"||!Body||typeof Body.refresh!=="function"||Body.refresh.bx) return;
  const _r=Body.refresh, f=function(){ bxLook.c=null; return _r.apply(this,arguments); };
  f.bx=true; Body.refresh=f;
}
/* the body was built without effects because one didn't compile: drop every bx look and rebuild, so the
   other effects (sore red, the aura, the chest) come back. Returns true when it dropped them.
   When the effects still don't build (no bx look to drop, or the rebuild without them fails too, e.g. sore, aura
   and chest alone over the phone's limits), the probe can never run: read the limits straight away */
function bxFallback(){
  const F=window.BODY_FX;
  if(!F||typeof Body==="undefined"||!Body||Body.kind!=="gl"||F.active!==false) return false;
  const ids=F.ids.filter(id=>bxDefs().ids.includes(id));
  if(!ids.length){ bxGlDirect(); return false; }
  F.drop(ids); bxOk.failed=true; bxOk.gl=null; bxLook.c=null;
  try{ if(Body.fxRebuild) Body.fxRebuild(); }catch(e){}
  console.warn("Ossa: body looks off");
  if(F.active!==true) bxGlDirect();
  return true;
}

/* ---------- the effects ---------- */
(()=>{ try{
  if(!window.BODY_FX) return;

  /* shared helpers. bxStudio: a soft studio for mirror-like looks, lit from the camera's side like the body's
     own light (a dark floor, a lit ceiling, a horizon band, two strip lights and a softbox up and to the left).
     bxR the reflected view ray, bxU/bxS/bxF the camera's up, right and forward.
     bxTwill: a 2/2 twill (carbon fibre) at bxUv (1 = one tow): x the tow's round profile, y 1 where the tow on
     top runs along u */
  BODY_FX.add({ id:"bx-lib",
    decl:`float bxSq(float bxX){ return bxX*bxX; }
vec3 bxStudio(vec3 bxR,vec3 bxU,vec3 bxS,vec3 bxF){
  float bxX=dot(bxR,bxS), bxY=dot(bxR,bxU);
  float bxLit=0.025+0.22*smoothstep(-0.15,0.65,bxY);
  float bxBand=0.55*exp(-bxSq((bxY+0.03)/0.055))*(0.25+0.75*smoothstep(0.1,0.6,abs(bxX)));
  float bxStrip=1.05*exp(-bxSq((bxX+0.6)/0.1))*smoothstep(-0.4,-0.05,bxY)*(1.-smoothstep(0.55,0.85,bxY))
    +0.65*exp(-bxSq((bxX-0.72)/0.13))*smoothstep(-0.25,0.1,bxY);
  float bxBox=1.25*pow(max(0.,dot(bxR,normalize(-bxF*0.5-bxS*0.6+bxU*0.85))),26.);
  return vec3(bxLit+bxBand+bxStrip+bxBox);
}
vec2 bxTwill(vec2 bxUv){
  vec2 bxC=floor(bxUv), bxFr=fract(bxUv);
  float bxH=step(mod(bxC.x+bxC.y,4.),1.5);
  return vec2(mix(sin(3.14159*bxFr.x),sin(3.14159*bxFr.y),bxH),bxH);
}` });

  /* the Pro finishes, over the whole body (every layer), drawn into the base colour. A still can ask for the finish
     alone with fx.look.only:true (a material swatch: no muscle colours) */
  BODY_FX.add({ id:"bx-fin", uniforms:["bxFnK","bxFnC","bxFnB"],
    decl:`uniform vec4 bxFnK;   // bx-fin: x the finish (0 none, 1 Obsidian, 2 Chrome, 3 Carbon fibre), y strength, z 1: the finish alone (a swatch still)
uniform vec3 bxFnC;   // its rim tint (tokens)
uniform vec3 bxFnB;   // its base colour (tokens)`,
    base:`if(bxFnK.x>0.5){
  vec3 bxRf=reflect(vd,n), bxEnv=bxStudio(bxRf,uUp,uRt,uFw), bxM=col;
  float bxFr=pow(1.-ndv,5.), bxSp=pow(max(0.,dot(bxRf,L)),160.);
  if(bxFnK.x<1.5){
    bxM=bxFnB*(0.5+0.6*dif)+bxEnv*(0.13+0.8*bxFr)+bxFnC*(rim*2.6+pow(1.-ndv,1.6)*0.07)+vec3(bxSp*1.3);
  } else if(bxFnK.x<2.5){
    bxM=bxFnB*bxEnv*0.92+bxFnB*0.04*dif+bxFnC*rim*0.35;
  } else {
    vec3 bxA=pow(abs(n),vec3(8.)); bxA/=bxA.x+bxA.y+bxA.z+1e-5;
    vec2 bxU1=vR.zy/0.012, bxU2=vR.xz/0.012, bxU3=vR.xy/0.012;
    float bxW1=max(fwidth(bxU1.x),fwidth(bxU1.y)), bxW2=max(fwidth(bxU2.x),fwidth(bxU2.y)), bxW3=max(fwidth(bxU3.x),fwidth(bxU3.y));
    vec3 bxHv=normalize(L-vd);
    vec2 bxT1=bxTwill(bxU1), bxT2=bxTwill(bxU2), bxT3=bxTwill(bxU3);
    float bxS1=mix(pow(sqrt(max(0.,1.-bxHv.y*bxHv.y)),18.),pow(sqrt(max(0.,1.-bxHv.z*bxHv.z)),18.),bxT1.y);
    float bxS2=mix(pow(sqrt(max(0.,1.-bxHv.z*bxHv.z)),18.),pow(sqrt(max(0.,1.-bxHv.x*bxHv.x)),18.),bxT2.y);
    float bxS3=mix(pow(sqrt(max(0.,1.-bxHv.y*bxHv.y)),18.),pow(sqrt(max(0.,1.-bxHv.x*bxHv.x)),18.),bxT3.y);
    float bxP1=mix(bxT1.x*(0.35+0.65*bxS1),0.42,smoothstep(0.25,0.5,bxW1));
    float bxP2=mix(bxT2.x*(0.35+0.65*bxS2),0.42,smoothstep(0.25,0.5,bxW2));
    float bxP3=mix(bxT3.x*(0.35+0.65*bxS3),0.42,smoothstep(0.25,0.5,bxW3));
    float bxWv=bxP1*bxA.x+bxP2*bxA.y+bxP3*bxA.z;
    bxM=bxFnB*(0.2+1.45*bxWv)*(0.5+0.75*dif)+bxFnC*bxWv*0.45*dif+bxEnv*0.08*(0.2+bxFr*3.)+bxFnC*rim*0.9+vec3(bxSp*0.35);
  }
  col=mix(col,bxM,bxFnK.y);
}`,
    /* a swatch still (fx.look.only): the finish alone, the muscle colours taken back off, the fibres and seams kept faintly */
    fill:`if(bxFnK.z>0.5){ col=col0+HAIR*(fib*0.035+bl*0.05+edge*w*0.03); }`,
    draw(gl,U,pick){
      if(!U||!U.bxFnK) return;
      const fin=pick?null:bxCur("fin"), d=fin&&bxDefs().fin[fin];
      const only=!pick&&bxShotHas("only")&&bxCur("only")===true;
      gl.uniform4f(U.bxFnK,d?d.n:0,d?1:0,only?1:0,0);
      if(d){ gl.uniform3fv(U.bxFnC,bxTokRGB(d.rim)); gl.uniform3fv(U.bxFnB,bxTokRGB(d.tok)); }
      /* the rim: live, vault's rimColor wrapper sets it; a still with its own fin, or the preview, sets it here */
      if(!pick&&U.uRimC){
        const F=window.BODY_FX, own=F&&F.inShot?bxShotHas("fin"):!!(bxPreview.o&&Object.prototype.hasOwnProperty.call(bxPreview.o,"fin"));
        if(own){ const c=bxRimFor(fin); if(c) gl.uniform3fv(U.uRimC,c); }
      }
    } });

  /* prestige materials, per muscle, in rank mode only */
  BODY_FX.add({ id:"bx-mats", uniforms:["bxMtI","bxMtK","bxMtG","bxMtS","bxMtV","bxMtB"],
    decl:`uniform vec4 bxMtI[6];   // bx-mats: per muscle (GLORDER, 4 per vec4): 0 none, 1 Black marble, 2 Silver, 3 Gold
uniform vec4 bxMtK;      // x on, y strength
uniform vec3 bxMtG;      // gold (--gold)
uniform vec3 bxMtS;      // silver (--mat-silver)
uniform vec3 bxMtV;      // the marble's veins (--mat-marble-vein)
uniform vec3 bxMtB;      // the marble (--mat-marble)`,
    fill:`if(bxMtK.x>0.5&&uRk>0.5){
  vec3 bxQ=vR*11.;
  float bxT=vn3(bxQ)+0.5*vn3(bxQ*2.07+3.7)+0.25*vn3(bxQ*4.13+7.1);
  float bxV1=sin((vR.x*0.9+vR.y*1.4+vR.z*0.6)*34.+bxT*6.5), bxV2=sin((vR.y*1.1-vR.x*0.7+vR.z*0.9)*63.+bxT*9.+1.7);
  float bxD1=fwidth(bxV1)*1.1+0.035, bxD2=fwidth(bxV2)*1.0+0.02;
  float bxVein=((1.-smoothstep(0.,bxD1,abs(bxV1)))*0.85+(1.-smoothstep(0.,bxD2,abs(bxV2)))*0.35)*(0.45+0.55*smoothstep(0.25,0.75,vn3(vR*6.+11.)));
  int bxI=id/4; float bxMt=bxMtI[bxI][id-bxI*4];
  if(bxMt>0.5){
    vec3 bxRf=reflect(vd,n), bxEnv=bxStudio(bxRf,uUp,uRt,uFw), bxM;
    float bxSp=pow(max(0.,dot(bxRf,L)),110.);
    if(bxMt<1.5) bxM=bxMtB*(0.75+0.9*dif)+bxMtV*bxVein*(0.45+0.4*dif)+bxEnv*0.14*(0.2+pow(1.-ndv,3.))+vec3(bxSp*0.9);
    else { vec3 bxTn=bxMt<2.5?bxMtS:bxMtG; bxM=bxTn*bxEnv*0.95+bxTn*0.05*dif+vec3(bxSp*0.4); }
    bxM*=1.-fib*0.25;
    float bxK=w*bxMtK.y;
    col=mix(col,bxM,bxK);
    col+=heat*(bl*0.45+edge*0.3)*bxK;
  }
}`,
    draw(gl,U,pick){
      if(!U||!U.bxMtK) return;
      const A=bxMatsArr(pick||window.CHECKVIEW?null:bxCur("mats"));
      gl.uniform4f(U.bxMtK,A.n?1:0,1,0,0);
      if(!A.n) return;
      gl.uniform4fv(U.bxMtI,A.a);
      gl.uniform3fv(U.bxMtG,bxTokRGB("--gold")); gl.uniform3fv(U.bxMtS,bxTokRGB("--mat-silver"));
      gl.uniform3fv(U.bxMtV,bxTokRGB("--mat-marble-vein")); gl.uniform3fv(U.bxMtB,bxTokRGB("--mat-marble"));
    } });

  /* Ideal self: "your next rank", in stills (and live under ?ghost=) */
  BODY_FX.add({ id:"bx-ghost", uniforms:["bxGhT","bxGhK"],
    decl:`uniform vec4 bxGhT[6];   // bx-ghost: per muscle target score (GLORDER, 4 per vec4), -1 none
uniform vec4 bxGhK;      // x strength, y hologram lines per metre`,
    final:`if(bxGhK.x>0.001&&uDemoOn<0.5&&lay==1){
  vec3 bxG=vR*bxGhK.y, bxGf=fwidth(bxG);
  int bxGi=id/4; float bxGt=bxGhT[bxGi][id-bxGi*4];
  if(bxGt>=0.){
    float bxGap=clamp((bxGt-uS[id])/20.,0.,1.)*(1.-smoothstep(0.004,0.03,dm))*bxGhK.x*(1.-smoothstep(0.,1.,uX))*(1.-uHZ);
    if(bxGap>0.001){
      vec3 bxGd=0.5-abs(fract(bxG)-0.5);
      vec3 bxGl=(1.-smoothstep(vec3(0.),bxGf*1.2+1e-4,bxGd))*(1.-smoothstep(vec3(0.3),vec3(0.6),bxGf));
      vec3 bxAn=abs(n);
      float bxLn=max(bxGl.y*(1.-0.7*bxAn.y),max(bxGl.x*smoothstep(0.35,0.75,bxAn.z),bxGl.z*smoothstep(0.35,0.75,bxAn.x)));
      vec3 bxGc=rkC(bxGt);
      col*=1.-0.55*bxGap;
      col+=bxGc*(bxLn*0.55+pow(1.-ndv,2.)*0.75)*bxGap;
    }
  }
}`,
    draw(gl,U,pick){
      if(!U||!U.bxGhK) return;
      const A=bxGhostArr(pick?null:bxCur("ghost"));
      gl.uniform4f(U.bxGhK,A.n?1:0,65,0,0);
      if(A.n) gl.uniform4fv(U.bxGhT,A.a);
    } });

  /* the Tank / Scout shape: the shape spike's masks and amounts. Tank grows the delts, traps, upper back, upper arms,
     forearms, thighs and calves; Scout leans them and draws the waist in. bxArK: x Tank, y Scout (0..1), z gain;
     bxArY: neck y, waist y, the torso's centre z; bxArL: shoulder, elbow, wrist, hip, knee, ankle (RIG, +x side) */
  BODY_FX.add({ id:"bx-arch", uniforms:["bxArK","bxArY","bxArL"],
    vdecl:`uniform vec4 bxArK; uniform vec4 bxArY; uniform vec3 bxArL[6];
vec3 bxClo(vec3 bxP,vec3 bxA,vec3 bxB){ vec3 bxAB=bxB-bxA; float bxT=clamp(dot(bxP-bxA,bxAB)/dot(bxAB,bxAB),0.,1.); return bxA+bxAB*bxT; }
float bxSeg(vec3 bxP,vec3 bxA,vec3 bxB){ return length(bxP-bxClo(bxP,bxA,bxB)); }
vec3 bxDir(vec3 bxV){ float bxL=length(bxV); return bxL>1e-6?bxV/bxL:vec3(0.); }`,
    /* the masks and amounts are the spike's, unchanged. The direction is not the vertex normal (that pulled the
       shorts' hem and the waist's sides apart, even at gain 1) but a function of position only, away from the
       bone axis under each mask, weighted more where it agrees with the surface's facing (an arm and the torso
       side don't push each other), never by the normal alone (a fold's underside would move the wrong way) */
    vertex:`if(bxArK.x+bxArK.y>0.0001){ vec3 bxP=vec3(abs(r.x),r.y,r.z), bxN=vec3(r.x<0.?-nr.x:nr.x,nr.y,nr.z);
  float bxNk=bxArY.x, bxWa=bxArY.y, bxZc=bxArY.z, bxHp=bxArL[3].y;
  float bxTor=1.-smoothstep(0.15,0.2,bxP.x);
  float bxUp=bxTor*smoothstep(bxWa+0.06,bxWa+0.16,bxP.y)*(1.-smoothstep(bxNk-0.08,bxNk,bxP.y));
  float bxTr=(1.-smoothstep(0.1,0.15,bxP.x))*smoothstep(bxNk-0.12,bxNk-0.04,bxP.y)*(1.-smoothstep(bxNk+0.02,bxNk+0.07,bxP.y));
  float bxDe=1.-smoothstep(0.05,0.11,length(bxP-bxArL[0]));
  float bxUa=1.-smoothstep(0.06,0.09,bxSeg(bxP,bxArL[0],bxArL[1]));
  float bxFa=1.-smoothstep(0.05,0.08,bxSeg(bxP,bxArL[1],bxArL[2]));
  float bxTh=(1.-smoothstep(0.1,0.14,bxSeg(bxP,bxArL[3],bxArL[4])))*(1.-smoothstep(bxHp-0.02,bxHp+0.05,bxP.y));
  float bxCa=1.-smoothstep(0.065,0.1,bxSeg(bxP,bxArL[4],bxArL[5]));
  float bxWs=bxTor*smoothstep(bxHp,bxHp+0.06,bxP.y)*(1.-smoothstep(bxWa+0.04,bxWa+0.12,bxP.y));
  float bxTk=max(max(max(0.006*bxUp,0.008*bxTr),max(0.010*bxDe,0.007*bxUa)),max(max(0.004*bxFa,0.008*bxTh),max(0.005*bxCa,0.004*bxWs)));
  float bxSc=max(max(max(0.004*bxUp,0.003*bxDe),max(0.004*bxUa,0.002*bxFa)),max(max(0.006*bxTh,0.002*bxCa),0.008*bxWs));
  vec3 bxDt=bxDir(vec3(bxP.x,0.,bxP.z-bxZc)), bxDr=bxDir(bxP-vec3(0.,bxNk-0.12,bxZc)), bxDd=bxDir(bxP-bxArL[0]);
  vec3 bxDu=bxDir(bxP-bxClo(bxP,bxArL[0],bxArL[1])), bxDf=bxDir(bxP-bxClo(bxP,bxArL[1],bxArL[2]));
  vec3 bxDh=bxDir(bxP-bxClo(bxP,bxArL[3],bxArL[4])), bxDc=bxDir(bxP-bxClo(bxP,bxArL[4],bxArL[5]));
  float bxAt=0.1+0.9*smoothstep(-0.3,0.3,dot(bxDt,bxN)), bxAr=0.1+0.9*smoothstep(-0.3,0.3,dot(bxDr,bxN)), bxAd=0.1+0.9*smoothstep(-0.3,0.3,dot(bxDd,bxN));
  float bxAu=0.1+0.9*smoothstep(-0.3,0.3,dot(bxDu,bxN)), bxAf=0.1+0.9*smoothstep(-0.3,0.3,dot(bxDf,bxN)), bxAh=0.1+0.9*smoothstep(-0.3,0.3,dot(bxDh,bxN)), bxAc=0.1+0.9*smoothstep(-0.3,0.3,dot(bxDc,bxN));
  vec3 bxVt=bxDir(bxDt*(0.006*bxUp+0.004*bxWs)*bxAt+bxDr*0.008*bxTr*bxAr+bxDd*0.010*bxDe*bxAd+bxDu*0.007*bxUa*bxAu+bxDf*0.004*bxFa*bxAf+bxDh*0.008*bxTh*bxAh+bxDc*0.005*bxCa*bxAc);
  vec3 bxVs=bxDir(bxDt*(0.004*bxUp+0.008*bxWs)*bxAt+bxDd*0.003*bxDe*bxAd+bxDu*0.004*bxUa*bxAu+bxDf*0.002*bxFa*bxAf+bxDh*0.006*bxTh*bxAh+bxDc*0.002*bxCa*bxAc);
  if(dot(bxVt,bxVt)<0.5) bxVt=bxDt; if(dot(bxVs,bxVs)<0.5) bxVs=bxDt;
  vec3 bxMv=(bxVt*bxArK.x*bxTk-bxVs*bxArK.y*bxSc)*bxArK.z; if(r.x<0.) bxMv.x=-bxMv.x;
  w+=mat3(M)*bxMv; }`,
    /* every pass (the body, picking, the outline and the glow pass) gets the same shape. A still takes its own arch
       or the live look's target, never a frame of the ease (bxLookKey already names the target); easing is live only */
    draw(gl,U){
      if(!U||!U.bxArK) return;
      const F=window.BODY_FX;
      const v=bxShotHas("arch")?bxArPair(bxCur("arch")):(F&&F.inShot?bxArPair(bxLook().arch):bxArStep().cur), on=v[0]+v[1]>0.0005;
      gl.uniform4f(U.bxArK,on?v[0]:0,on?v[1]:0,on?bxArGain():0,0);
      if(!on) return;
      const f=bxFig(), R=RIG[f]||RIG.m;
      gl.uniform4f(U.bxArY,R.neck[1],R.waist[1],(R.neck[2]+R.waist[2])/2,0);
      gl.uniform3fv(U.bxArL,bxArMarks(f));
    },
    busy(){ const F=window.BODY_FX; return !(F&&F.inShot)&&bxArStep().busy; } });

  /* the GL limits, read on the first frame of the body's own program (no GLSL, never dropped). A reading the
     fallback took while the effects didn't build (linked:false) is replaced once they do */
  BODY_FX.add({ id:"bx-gl",
    draw(gl,U,pick){ if(pick||(bxOk.gl&&bxOk.gl.linked!==false)||!U||!Object.prototype.hasOwnProperty.call(U,"uRk")) return; bxGlRead(gl); } });

  /* preview switches (localhost only, nothing saved) */
  if(bxDev()){
    const q=location.search, o={};
    let m=/[?&]look=([a-z]+)/.exec(q);
    if(m){ const v=m[1];
      if(bxDefs().fin[v]) o.fin=v;
      else if(bxDefs().mat[v]) o.mats={pec_major:v,front_delt:v,biceps:v};
      else if(v==="fail") BODY_FX.add({ id:"bx-fail", decl:"float bxFail(){ return bxNoSuchValue; }   // ?look=fail: never compiles, to prove the fallback" });
      /* ?look=failall: a broken chunk outside the drop list, so the rebuild without the looks fails too (a phone where
         sore, aura and chest alone go over its limits); proves bxGlLine still reads the limits */
      else if(v==="failall") BODY_FX.add({ id:"bx-failall", decl:"float bxFailAll(){ return bxNoSuchAll; }   // ?look=failall: never compiles, never dropped" });
    }
    m=/[?&]arch=(tank|scout)\b/.exec(q); if(m) o.arch={a:m[1],amt:1};
    m=/[?&]ghost=(\d{1,3})\b/.exec(q); if(m) o.ghost=Math.max(1,Math.min(100,+m[1]));
    m=/[?&]argain=([0-9.]+)/.exec(q); if(m&&Number.isFinite(+m[1])) bxArGain.q=+m[1];
    if(Object.keys(o).length) bxPreview.o=o;   // Body doesn't exist yet: no kick needed
  }

  /* after boot (this file runs before it): the Body.refresh wrapper, then the fallback */
  setTimeout(()=>{ try{ bxInstall(); bxFallback(); }catch(e){ console.warn("Ossa: look-fx",e); } },0);
}catch(e){ console.warn("Ossa: look-fx",e); } })();
