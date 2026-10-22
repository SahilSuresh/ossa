/* =========================================================
   HALO (Ossa 2.0, Phase 3 "Focus"): body effects and stills for Focus. Owner: package P2. Prefix hl*.
   Included after aura.js and before boot, so its BODY_FX.add calls are compiled into the first
   makeGLBody. It reads the Aura level only through auLv() (aura.js), guarded: level 1 without it.
   Start-up rule: function declarations only, no top-level const or let; state on function
   properties; never redeclare a name that web/ossa.html or another web/ui file declares.

   Two body effects (web/ui/body-fx.js; both drawn by the body's own renderer):
     'aura'   a cyan rim on the head (FS final), the outline tinted cyan round the head (hull),
              and a halo outside the silhouette: the glow pass grows the head and neck outward
              from a head-neck axis (vertex chunk, glow pass only) and adds cyan (hull chunk).
              Crystal shards from level 15 (sides, top and back of the head; never the face or
              the shoulders). Still: no time term, no busy(), so it never adds frames.
              Live: only on the Body page (RDHOME, tab 'today', not scrolled away, not Train,
              onboarding or a check view, not while the Train glow demo shows) from level 2, a
              subtle 'home' look. In a still: only when Body.shot({fx:{aura:level}}) asks
              (the 'full' look: a faint rim at level 1, growing from 2 to 14, crystals at 15+).
     'chest'  stills only: a glow on the chest at the heart (organData) and an optional ring.
              Body.shot({fx:{chest:0..1, ring:0..1, col:'cyan'|'lime'}}). Colours from tokens.css
              (--cyan, --glow), read once.
   Seated Monk poses (stills only; the live body never sits and Body.setPose is never called):
     hlPresets()           the slider values (cm, degrees) for 'lotus' and 'block', with each
                           figure's root lift (lowest point at y = +0.02) and top. the preview-only pose tester
                           reads these too: one source of truth.
     hlPose(name,fig,q)    a boneMats pose object, or null. hlSeat(yaw): 'lotus' from the front,
                           'block' when |yaw| > 0.3 (lotus tears off-axis) or hlSeat.force.
   Cached stills (framed Body.shot, dark glass body mask:{}, PNG on black: show them with
   mix-blend-mode:lighten). At most 4 are kept; null is never cached; take them after the
   first paint, never from a timer tick:
     hlShot(kind,o)        kind 'hero' (the head and its aura, Focus home), 'setup' (Monk setup:
                           standing at yaw 0.35, cyan chest glow and ring, aura), 'seated' (Monk
                           timer and finish: lotus or block, cyan chest glow, aura) or 'chest'
                           (Heartbeat: the torso from the front, lime chest glow, no aura).
                           o (all optional): w, h the box in CSS px (the image is w×h at the device
                           ratio, at most 2.5, capped near 700k px); yaw; lv (aura level, default
                           the user's); aura (false: none); glow (chest glow 0..1, 0 = the plain
                           body, e.g. Heartbeat's base frame); ring (0..1); col ('cyan'|'lime');
                           seat ('lotus'|'block', 'seated' only); canvas (true: a fresh canvas
                           copy instead of the data URL).
                           Returns a PNG data URL (or a canvas), or null (no WebGL, the glass
                           scene is on, the context is lost, the canvas has no size yet).
     hlHero(cssW,cssH,o)   hlShot('hero', {w:cssW, h:cssH, ...o}): the Focus home head. About
                           126 CSS px of head in a 305 px tall box; the bottom edge cuts the neck,
                           so fade it with a CSS mask if needed.
   hlKick() drops the stills and redraws the body once. aura.js's vxEmit('aura') calls it.
   Preview only (localhost): ?aura=N shows Aura level N everywhere here (nothing is saved).
   ========================================================= */

/* ---------- the level and the look ---------- */
function hlLevel(){
  if(hlLevel.q==null){ hlLevel.q=0;
    try{ if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)){ const m=/[?&]aura=(\d{1,2})(?!\d)/.exec(location.search); if(m) hlLevel.q=Math.max(1,+m[1]); } }catch(e){} }
  if(hlLevel.q) return hlLevel.q;
  try{ if(typeof auLv==="function"){ const n=Math.floor(+auLv()); if(n>=1) return n; } }catch(e){}
  return 1;
}
/* the look for a level: {k strength 0..1, w halo width (m), sh crystal length (m), t level 0..1, cry, key}.
   'home' (the Body page): nothing below level 2, a thin still halo after, never crystals.
   'full' (Focus stills): a faint rim at level 1, growing from 2 to 14, crystals from 15. Nothing grows past 15. */
function hlLook(lv,where){
  lv=Math.min(15,Math.max(1,Math.floor(+lv||1))); where=where==="home"?"home":"full";
  const c=hlLook.c||(hlLook.c={}), id=where+lv;
  if(id in c) return c[id];
  const t=Math.max(0,Math.min(1,(lv-2)/13)); let L=null;
  if(where==="home"){ if(lv>=2) L={k:0.22+0.2*t,w:0.008+0.012*t,sh:0,t}; }
  else if(lv<2) L={k:0.18,w:0,sh:0,t:0};
  else if(lv<15) L={k:0.4+0.5*t,w:0.014+0.026*t,sh:0,t};
  else L={k:1,w:0.046,sh:0.065,t:1,cry:true};
  if(L) L.key=id;
  return (c[id]=L);
}
/* the Body page, with its figure on screen */
function hlHomeOn(){
  try{
    if(!window.RDHOME||TAB!=="today"||window.CHECKVIEW) return false;
    const cl=document.getElementById("app").classList;
    if(cl.contains("homeoff")||cl.contains("train")||cl.contains("onboarding")||cl.contains("minding")) return false;
    return !(TR&&TR.glowOn==="home");   // the Train tab's glow demo on the Body page: no halo over it
  }catch(e){ return false; }
}
/* what the aura draws right now: the still's own look (only if the shot asks), else the Body page look, else null */
function hlNow(){
  const F=window.BODY_FX;
  if(F&&F.inShot){ const a=F.shotFx&&F.shotFx.aura; return a==null||a===false?null:hlLook(a===true?hlLevel():a,"full"); }
  return hlHomeOn()?hlLook(hlLevel(),"home"):null;
}
/* a token colour as a vec3, read once: 'cyan' (--cyan) or 'lime' (--glow) */
function hlColour(k){
  const c=hlColour.c||(hlColour.c={}); k=k==="lime"?"lime":"cyan";
  if(c[k]) return c[k];
  let v=k==="lime"?[0.831,1,0]:[0,0.898,1];
  try{ const s=getComputedStyle(document.documentElement).getPropertyValue(k==="lime"?"--glow":"--cyan").trim(), m=/^#?([0-9a-f]{6})$/i.exec(s);
    if(m){ const n=parseInt(m[1],16); v=[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]; } }catch(e){}
  return (c[k]=new Float32Array(v));
}
function hlFig(){ try{ return S.body==="f"&&FIGURES.f?"f":"m"; }catch(e){ return "m"; } }
/* the heart's rest-space centre for a figure (the organ table) */
function hlHeart(fig){
  fig=fig==="f"?"f":"m"; const c=hlHeart.c||(hlHeart.c={});
  if(c[fig]) return c[fig];
  let p=[0.022,1.255,0.02]; try{ const oc=organData(fig)[0]; p=[oc[0],oc[1],oc[2]]; }catch(e){}
  return (c[fig]=new Float32Array(p));
}
function hl01(v){ v=+v; return v>0?Math.min(1,v):0; }
/* a level changed (or a look did): drop the stills and redraw the body once */
function hlKick(){ hlShot.c=[]; try{ if(typeof Body!=="undefined"&&Body&&Body.fxKick) Body.fxKick(); }catch(e){} }

/* ---------- the two effects ---------- */
(()=>{ try{
  if(!window.BODY_FX) return;
  /* the head mask and the radial direction (rest space, so it follows any pose), and the crystals:
     64 fixed directions (the same for everyone), none towards the face (+z) or down into the shoulders,
     four-sided so their flat facets catch the light, grown along hlSph (from the head's centre: hlDir is flat
     below the crown, which would stretch a shard into a strip). vr is the view direction in rest space (vec3(0.): no test):
     a whole shard turned towards the camera doesn't grow (it would cover the face) */
  const help=`float hlMask(vec3 r){ return smoothstep(1.49,1.57,r.y)*(1.-smoothstep(0.12,0.19,abs(r.x))); }
vec3 hlDir(vec3 r){ return normalize(r-vec3(0.,clamp(r.y,1.45,1.69),-0.015)); }
vec3 hlSph(vec3 r){ return normalize(r-vec3(0.,1.64,-0.015)); }
float hlShard(vec3 d,vec3 vr){ float s=0.;
  for(int i=0;i<64;i++){ float fi=float(i), y=1.-(fi+0.5)/32., rr=sqrt(max(0.,1.-y*y)), ph=fi*2.3999632;
    vec3 a=vec3(cos(ph)*rr,y,sin(ph)*rr); if(a.z>0.25||a.y<-0.2||dot(d,a)<0.9) continue;
    float h=fract(sin(fi*12.9898+4.1)*43758.5453), al=0.065+0.06*h, an=h*6.2832;
    vec3 t1=normalize(abs(a.y)<0.9?cross(a,vec3(0.,1.,0.)):cross(a,vec3(1.,0.,0.))), t2=cross(a,t1);
    float u=dot(d,t1), v=dot(d,t2), u2=u*cos(an)-v*sin(an), v2=u*sin(an)+v*cos(an);
    float g=dot(vr,vr)>0.?smoothstep(-0.15,0.05,dot(a,vr)):1.;
    s=max(s,g*(0.45+0.55*h)*max(0.,1.-(abs(u2)+abs(v2))/al)); }
  return s; }`;
  BODY_FX.add({ id:"aura", uniforms:["uHaloK","uHaloC"],
    vdecl:`uniform vec4 uHaloK;   // the aura: x strength, y halo width (m), z crystal length (m), w level 0..1
${help}`,
    /* the glow pass only (the body and the outline keep their shape): the head and neck move outward along the
       radial direction, the same for neighbours, so no triangle stretches. Only the far half grows: the half facing
       the camera sinks 8 mm instead, so the mesh's folds (hairline, ears, chin) stay hidden behind the face.
       n becomes that direction, a smooth normal for the hull chunk's shading */
    vertex:`if(uHull>1.5&&uHaloK.x>0.001){ float hlM=hlMask(r);
  if(hlM>0.001){ vec3 hlD=hlDir(r), hlW=normalize(mat3(M)*hlD), hlV=normalize(w-uRo);
    float hlG=smoothstep(-0.25,0.1,dot(hlW,hlV)), hlL=uHaloK.y*hlG-0.008*(1.-hlG);
    w+=hlW*hlL*hlM; n=normalize(mix(n,hlW,hlM));
    if(uHaloK.z>0.){ vec3 hlS=hlSph(r); w+=normalize(mat3(M)*hlS)*uHaloK.z*hlShard(hlS,hlV*mat3(M))*hlM; } } }`,
    decl:`uniform vec4 uHaloK; uniform vec4 uHaloC;   // the aura (halo.js): uHaloC rgb from --cyan, w a clock (0: still)`,
    /* a cyan rim on the head; off in x-ray and the head zoom */
    final:`if(uHaloK.x>0.001){ float hlR=smoothstep(1.52,1.60,vR.y)*(1.-smoothstep(0.,1.,uX))*(1.-uHZ);
  if(hlR>0.001) col+=uHaloC.rgb*hlR*uHaloK.x*(pow(1.-ndv,2.6)*(0.45+0.6*uHaloK.w)+0.02*uHaloK.w); }`,
    hdecl:`uniform vec4 uHaloK; uniform vec4 uHaloC;
${help}`,
    /* the outline pass tints the 1-px ring round the head (else it would sit grey between the head and the glow),
       only where the head turns away (not the old specks of the mesh's folds on the face);
       the glow pass adds cyan, brightest at the head's edge, fading out; crystals get flat, lit facets */
    hull:`if(uHaloK.x>0.001){ vec3 hlF=cross(dFdx(vW),dFdy(vW)), hlV=normalize(vW-uRo); float hlM=hlMask(vR)*smoothstep(0.9,1.,uA);
  if(hlM>0.001){
    if(glow){ float hlN=abs(dot(normalize(vN),hlV));
      vec3 hlC=uHaloC.rgb*smoothstep(0.,0.8,hlN)*(0.35+0.65*uHaloK.x);
      if(uHaloK.z>0.){ float hlS=hlShard(hlSph(vR),vec3(0.));
        if(hlS>0.01){ float hlG=pow(abs(dot(normalize(hlF+vec3(1e-9)),normalize(vec3(0.35,0.8,0.5)))),5.);
          hlC=mix(hlC,uHaloC.rgb*(0.4+0.9*hlG)+vec3(0.6)*hlG*hlG*hlG,smoothstep(0.01,0.2,hlS)); } }
      if(uHaloC.w>0.) hlC*=0.88+0.12*sin(uHaloC.w*1.2+vR.y*35.+vR.x*21.);
      add+=hlC*hlM*uHaloK.x; }
    else col=mix(col,uHaloC.rgb*0.85,hlM*uHaloK.x*(1.-smoothstep(0.35,0.7,abs(dot(hlDir(vR),hlV))))); } }`,
    /* the same values for the body, the outline and the glow pass: the shaders pick by uHull */
    draw(gl,U,pick){
      if(!U||!U.uHaloK) return;
      const L=pick?null:hlNow();
      if(!L){ gl.uniform4f(U.uHaloK,0,0,0,0); return; }
      gl.uniform4f(U.uHaloK,L.k,L.w,L.sh,L.t);
      if(U.uHaloC){ const c=hlColour("cyan"); gl.uniform4f(U.uHaloC,c[0],c[1],c[2],0); }
    },
    post(){ const L=hlNow(); return !!L&&(L.w>0||L.sh>0); } });

  BODY_FX.add({ id:"chest", uniforms:["uChestK","uChestC","uChestP"],
    decl:`uniform vec4 uChestK; uniform vec3 uChestC; uniform vec3 uChestP;   // chest glow (halo.js, stills only): x glow, y ring; the colour; the heart's rest-space centre`,
    /* a soft glow and a hot core at the heart (front of the chest only), and a ring round the sternum */
    final:`if(uChestK.x+uChestK.y>0.001){
  vec3 hlCd=(vR-uChestP)/vec3(0.11,0.11,0.22), hlCc=(vR-uChestP)/vec3(0.045,0.05,0.2);
  float hlFz=smoothstep(-0.03,0.05,vR.z), hlCg=exp(-dot(hlCd,hlCd))*hlFz*uChestK.x, hlCo=exp(-dot(hlCc,hlCc))*hlFz*uChestK.x, hlFr=pow(1.-ndv,2.);
  col=mix(col,uChestC*(0.45+0.5*dif),clamp(hlCg*0.5,0.,0.8));
  col+=uChestC*(hlCg*(0.2+0.5*hlFr)+hlCo*0.8)+vec3(hlCo*0.22);
  float hlRr=length((vR.xy-vec2(0.,uChestP.y+0.01))/vec2(0.13,0.12));
  col+=uChestC*exp(-pow((hlRr-1.)/0.1,2.))*smoothstep(0.,0.04,vR.z)*uChestK.y*(0.45+0.55*vn3(vR*38.)); }`,
    draw(gl,U,pick){
      if(!U||!U.uChestK) return;
      const F=window.BODY_FX, fx=!pick&&F&&F.inShot?F.shotFx:null, g=fx?hl01(fx.chest):0, r=fx?hl01(fx.ring):0;
      gl.uniform4f(U.uChestK,g,r,0,0);
      if(g+r<=0) return;
      gl.uniform3fv(U.uChestC,hlColour(fx.col));
      gl.uniform3fv(U.uChestP,hlHeart(hlFig()));
    } });

  /* a level change redraws the Body page halo and drops the stills (aura.js emits 'aura') */
  if(typeof vxOn==="function") vxOn("aura",()=>hlKick());
}catch(e){ console.warn(e); } })();

/* ---------- seated poses (Monk Mode stills) ---------- */
/* sliders in cm and degrees, given for the figure's left (+x) side; "cross" lifts one shin over the other.
   lift: the root goes up by this (m) so the lowest point sits at y = +0.02; top: the head's top after the lift.
   Lotus is knee 140 / cross 5 (150 / 6 tore the female knee). Re-measure in the preview's pose tester after tuning. */
function hlPresets(){
  return hlPresets.p||(hlPresets.p={
    lotus:{q:{seat:13,flex:76,spread:55,turn:90,knee:150,cross:10,feet:10,lean:-3,head:8,armF:10,armO:8,elbow:22,palms:20,pelvis:-15},   // an easy cross-legged sit: thighs wide and flat, shins crossed in front, hands by the knees (Andrej, 17 Oct)
      m:{lift:0.055,top:1.107}, f:{lift:0.040,top:1.054}},
    block:{q:{seat:42,flex:86,spread:12,turn:0,knee:112,cross:0,feet:0,lean:-3,head:8,armF:20,armO:4,elbow:30,palms:0},
      m:{lift:0.209,top:1.558}, f:{lift:0.207,top:1.515}}
  });
}
/* sliders → a boneMats pose (no lift). Rotations in the renderer's order (m4.R is Ry·Rx·Rz) */
function hlPoseMake(q,f){
  const DEG=Math.PI/180, L=RIG[f]||RIG.m;
  const rX=a=>{ const c=Math.cos(a),s=Math.sin(a); return [[1,0,0],[0,c,-s],[0,s,c]]; };
  const rY=a=>{ const c=Math.cos(a),s=Math.sin(a); return [[c,0,s],[0,1,0],[-s,0,c]]; };
  const mul=(A,B)=>A.map(r=>[0,1,2].map(j=>r[0]*B[0][j]+r[1]*B[1][j]+r[2]*B[2][j]));
  const yxz=M=>{ const sx=Math.max(-1,Math.min(1,-M[1][2])), x=Math.asin(sx);   // a rotation matrix back to the [rx,ry,rz] m4.R takes
    if(Math.abs(Math.cos(x))<1e-6) return [x,sx<0?Math.atan2(-M[0][1],M[0][0]):Math.atan2(M[0][1],M[0][0]),0];
    return [x,Math.atan2(M[0][2],M[2][2]),Math.atan2(M[1][0],M[1][1])]; };
  /* pelvis: tilting it brings the thighs and the crossed shins up in front of the hips (no pinched gap there); the spine
     takes the opposite tilt so the torso stays upright */
  const pel=(+q.pelvis||0)*DEG;
  const o={root:[0,-(L.hip[1]-q.seat/100),0], pelvis:[pel,0,0], spine:[q.lean*DEG-pel,0,0], head:[q.head*DEG,0,0]};
  ["R","L"].forEach((s,i)=>{
    const c=(i?-1:1)*q.cross*DEG;
    const T=mul(rY(q.spread*DEG),mul(rX(-(q.flex*DEG+c*0.5)),rY(q.turn*DEG)));   // swing out · bend · turn out
    o["th"+s]=yxz(T); o["sh"+s]=[q.knee*DEG+c,0,0]; o["ft"+s]=[q.feet*DEG,0,0];
    o["ua"+s]=[-q.armF*DEG,0,q.armO*DEG]; o["fa"+s]=[-q.elbow*DEG,0,0]; o["tw"+s]=q.palms*DEG;
  });
  return o;
}
/* a seated pose for Body.shot({pose}), lifted to sit at y≈0; q overrides the sliders (the preview's pose tester) */
function hlPose(name,fig,q){
  const P=hlPresets()[name]; if(!P) return null;
  if(fig!=="m"&&fig!=="f") fig=hlFig();
  try{
    const o=hlPoseMake(q||P.q,fig); o.root[1]+=(P[fig]||P.m).lift;
    for(const k in o){ const v=o[k]; if((Array.isArray(v)?v:[v]).some(x=>!Number.isFinite(x))) return null; }
    return o;
  }catch(e){ return null; }
}
/* which seat: lotus from the front, block off-axis (or hlSeat.force: 'lotus' | 'block') */
function hlSeat(yaw){
  if(hlSeat.force==="lotus"||hlSeat.force==="block") return hlSeat.force;
  return Math.abs(+yaw||0)>0.3?"block":"lotus";
}

/* ---------- framed stills ---------- */
function hlKinds(){
  return hlKinds.k||(hlKinds.k={
    hero:{w:220,h:300,yaw:0,aura:true,chest:0,ring:0,col:"cyan"},
    setup:{w:260,h:340,yaw:0.35,aura:true,chest:1,ring:1,col:"cyan"},
    seated:{w:260,h:300,yaw:0,aura:true,chest:1,ring:0,col:"cyan"},
    chest:{w:300,h:300,yaw:0,aura:false,chest:1,ring:0,col:"lime"}
  });
}
/* where each kind looks: a world point at the centre and the metres shown top to bottom (wide enough for the box) */
function hlFrame(kind,fig,seat,w,h){
  const a=w/h;
  if(kind==="hero"){ const ppm=Math.min(700,h/0.5,w/0.4); return {at:[0,1.665,-0.015],span:h/ppm}; }   // the head and its crystals (0.4 m across at level 15), ≤700 CSS px a metre
  if(kind==="setup") return {at:[0,1.26,0],span:Math.max(1.34,0.84/a)};                                  // head (and aura) to mid-thigh
  if(kind==="chest"){ const p=hlHeart(fig); return {at:[0,p[1],0.05],span:Math.max(0.72,0.76/a)}; }        // neck to waist, shoulders in
  /* seated: waist up (Andrej, 17 Oct): the head with room for the aura down to just above the knees, so the folded
     legs (which this rig can't make look natural) stay out of shot; the arms hang relaxed at the sides */
  const b=(hlPresets()[seat]||hlPresets().lotus)[fig]||hlPresets().lotus.m, y1=b.top+0.1, sp=Math.max(0.96,0.84/a);
  return {at:[0,y1-sp/2,0.06],span:sp};
}
function hlShot(kind,o){
  o=o||{};
  const K=hlKinds()[kind]; if(!K) return null;
  if(typeof Body==="undefined"||!Body||Body.kind!=="gl"||typeof Body.shot!=="function") return null;
  const w=Math.round(+o.w||K.w), h=Math.round(+o.h||K.h); if(!(w>=40&&h>=40)) return null;
  const fig=hlFig(), d=Math.max(1,Math.min(2.5,window.devicePixelRatio||1)), size=[Math.round(w*d),Math.round(h*d)];
  const yaw=o.yaw!=null&&Number.isFinite(+o.yaw)?+o.yaw:K.yaw;
  const lv=(o.aura!=null?o.aura:K.aura)?Math.max(1,Math.floor(+o.lv||hlLevel())):null, look=lv?hlLook(lv,"full"):null;
  const fx={aura:lv, chest:hl01(o.glow!=null?o.glow:K.chest), ring:hl01(o.ring!=null?o.ring:K.ring), col:(o.col||K.col)==="lime"?"lime":"cyan"};
  let rim=""; try{ if(typeof rimColor==="function") rim=Array.from(rimColor(),v=>(+v).toFixed(3)).join(","); }catch(e){}
  const c=hlShot.c||(hlShot.c=[]);
  const take=seat=>{
    const fr=hlFrame(kind,fig,seat,w,h);
    const key=JSON.stringify([kind,fig,seat,+yaw.toFixed(3),size,+fr.span.toFixed(4),fr.at,look?look.key:"",fx.chest,fx.ring,fx.col,rim,uiSafe(()=>typeof bxLookKey==="function"?bxLookKey():"","")]);
    const i=c.findIndex(e=>e.k===key);
    if(i>=0){ const e=c.splice(i,1)[0]; c.unshift(e); return e; }
    const pose=seat?hlPose(seat,fig):null; if(seat&&!pose) return null;
    let cv=null; try{ cv=Body.shot({yaw,at:fr.at,span:fr.span,size,mask:{},pose:pose||undefined,fx,canvas:true}); }catch(e){ console.warn(e); }
    hlShot.n=(hlShot.n||0)+1;   // renders so far (a cache hit doesn't count)
    if(!cv) return null;
    const e={k:key,cv,url:""}; c.unshift(e); if(c.length>4) c.length=4;
    return e;
  };
  const seat=kind==="seated"?(o.seat==="lotus"||o.seat==="block"?o.seat:hlSeat(yaw)):"";
  let e=take(seat);
  if(!e&&seat==="lotus"&&!o.seat) e=take("block");   // the lotus still failed: sit on the block
  if(!e) return null;
  if(o.canvas){ const out=document.createElement("canvas"); out.width=e.cv.width; out.height=e.cv.height; out.getContext("2d").drawImage(e.cv,0,0); return out; }
  try{ return e.url||(e.url=e.cv.toDataURL("image/png")); }catch(x){ return null; }
}
/* the Focus home's head and aura, sized to its box */
function hlHero(cssW,cssH,o){ return hlShot("hero",Object.assign({},o||{},{w:cssW,h:cssH})); }
