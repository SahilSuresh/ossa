/* =========================================================
   CALM VISUALS (Andrej, 17 Oct). The Calm sessions used a ray-marched "creature" that looked blotchy and
   boxed in. This redefines rdAlienMake (a function declaration in ossa.html, so the last one wins, even for
   the RDAlien/RDAlienO instances built at start-up) with the same API, {start(canvas), set(level), stop(),
   canvas}, drawing on a plain 2D canvas, full bleed on black, one look per session:
     float   a cyan orb that rises as you breathe in and sinks as you breathe out, with a soft halo
     deep    slow ripples on still water, a new ring at the start of each breath out
     drift   a dim moon-blue orb under twinkling stars; the whole screen darkens over the session
   Colours come from tokens.css at runtime. Reduced motion keeps the breathing (it is the guide) and drops
   the twinkle, the drift and the ripples. Function declarations only (start-up rule), state per instance.
   ========================================================= */
/* a colour token's value, for the canvas (opacity is set with globalAlpha, so no colour is ever written here) */
function calmTok(name,fb){
  try{ const v=getComputedStyle(document.documentElement).getPropertyValue(name).trim(); if(v) return v; }catch(e){}
  return fb;
}
function calmKey(){
  try{ const c=rdBrCur(); return c&&c.pat&&c.k?c.k:"float"; }catch(e){ return "float"; }
}
function rdAlienMake(){
  const st={cv:null,x:null,raf:0,on:false,t0:0,lv:0.2,lvS:0.2,k:"float",cy:"",moon:"",bg:"",star:"",
    stars:null,rip:[],up:false,lastRip:0,w:0,h:0,d:1};
  const al=a=>Math.max(0,Math.min(1,a));
  function size(){
    const cv=st.cv; if(!cv) return;
    const d=Math.min(window.devicePixelRatio||1,2), w=Math.max(1,Math.round(cv.clientWidth*d)), h=Math.max(1,Math.round(cv.clientHeight*d));
    if(cv.width!==w||cv.height!==h){ cv.width=w; cv.height=h; }
    st.w=w; st.h=h; st.d=d;
  }
  function glow(x,y,r,c,a){
    const g=st.x.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,c); g.addColorStop(1,"transparent");
    st.x.globalAlpha=al(a); st.x.fillStyle=g; st.x.beginPath(); st.x.arc(x,y,r,0,Math.PI*2); st.x.fill(); st.x.globalAlpha=1;
  }
  function disc(x,y,r,c,a){ st.x.globalAlpha=al(a); st.x.fillStyle=c; st.x.beginPath(); st.x.arc(x,y,r,0,Math.PI*2); st.x.fill(); st.x.globalAlpha=1; }
  function ring(x,y,r,c,a,lw){ st.x.globalAlpha=al(a); st.x.strokeStyle=c; st.x.lineWidth=lw*st.d; st.x.beginPath(); st.x.arc(x,y,r,0,Math.PI*2); st.x.stroke(); st.x.globalAlpha=1; }
  function draw(now){
    const x=st.x, w=st.w, h=st.h, cx=w/2, cy=h/2, m=Math.min(w,h), t=(now-st.t0)/1000, L=st.lvS, still=typeof reduced!=="undefined"&&reduced;
    x.setTransform(1,0,0,1,0,0); x.shadowBlur=0; x.globalAlpha=1; x.fillStyle=st.bg; x.fillRect(0,0,w,h);   // the Breathe shapes leave a scale and a shadow on this canvas
    if(st.k==="deep"){
      /* a new ripple when the breath turns to go out, and one every 7 s if the level never peaks */
      const peak=L>0.85; if(peak&&!st.up&&!still){ st.rip.push(t); st.lastRip=t; } st.up=peak;
      if(!still&&t-st.lastRip>7){ st.rip.push(t); st.lastRip=t; }
      st.rip=st.rip.filter(s=>t-s<9);
      st.rip.forEach(s=>{ const p=(t-s)/9; ring(cx,cy,m*(0.06+0.5*p),st.cy,0.75*(1-p),1.6); });
      glow(cx,cy,m*0.12,st.cy,0.18+0.2*L);
      disc(cx,cy,m*(0.018+0.012*L),st.cy,0.95);
      return;
    }
    if(st.k==="drift"){
      const dur=Math.max(60,((typeof RDBR!=="undefined"&&+RDBR.dur)||3)*60), dim=1-0.65*Math.min(1,t/dur);
      if(!st.stars){ st.stars=[]; let s=7; const r=()=>{ s=(s*16807)%2147483647; return s/2147483647; };
        for(let i=0;i<70;i++) st.stars.push([r(),r(),0.5+r()*1.2,r()*6.28,0.4+r()*0.9]); }
      st.stars.forEach(([sx,sy,sr,ph,f])=>{ const a=(still?0.35:0.2+0.35*(0.5+0.5*Math.sin(t*f+ph)))*dim; disc(sx*w,sy*h,sr*st.d,st.star,a); });
      const R=m*(0.13+0.03*L);
      glow(cx,cy,R*2.6,st.moon,(0.12+0.1*L)*dim);
      disc(cx,cy,R,st.moon,(0.42+0.25*L)*dim);
      return;
    }
    /* float */
    const R=m*(0.11+0.06*L), y=cy+(still?0:(0.5-L)*m*0.12);
    ring(cx,cy,m*(0.2+0.09*L),st.cy,0.12+0.25*L,1.5);
    glow(cx,y,R*2.8,st.cy,0.16+0.18*L);
    disc(cx,y,R,st.cy,0.55+0.4*L);
  }
  function frame(now){ if(!st.on) return; st.raf=requestAnimationFrame(frame); size(); st.lvS+=(st.lv-st.lvS)*0.08;
    const k=calmKey(); if(k!==st.k){ st.k=k; st.stars=null; st.rip=[]; st.up=false; st.lastRip=(now-st.t0)/1000; }   // the arrows switch sessions on the same canvas
    draw(now); }
  return {
    start(c){
      if(st.on){ st.on=false; cancelAnimationFrame(st.raf); }
      if(!c||!c.getContext) return false;
      const x=c.getContext("2d"); if(!x) return false;
      st.cv=c; st.x=x; st.k=calmKey(); st.stars=null; st.rip=[]; st.up=false; st.lastRip=0;
      st.cy=calmTok("--cyan","cyan"); st.moon=calmTok("--recover","lightsteelblue"); st.bg=calmTok("--bg","black"); st.star=calmTok("--text-1","white");
      st.on=true; st.t0=performance.now(); st.lv=st.lvS=0.2; st.raf=requestAnimationFrame(frame);
      return true;
    },
    set(v){ st.lv=Math.max(0,Math.min(1,+v||0)); },
    stop(){ st.on=false; cancelAnimationFrame(st.raf); st.cv=null; st.x=null; },
    get canvas(){ return st.cv; }
  };
}
