/* =========================================================
   MOTION — the few moments that move. Researched 2026-10-15 on ScreensDesign against the
   top earners in gym and habit apps (Liftoff, Symmetry, GymStreak, Gravl, Luvu, Yazio, BetterMe):
   - rank-up: the badge lands with light rays turning behind it, embers rising, the tier name glowing,
     the progress bar filling, and story-style segments when there's more than one (Liftoff, Symmetry, GymStreak)
   - streak: you light it yourself, the number rolls over and today's dot fills (Luvu, Duolingo-style apps)
   - workout complete: a short confetti burst on the dark screen, in Ossa's colours (Gravl, GymStreak)
   - small things: a pulse on the muscle a label points at, a sheen across the paywall button, a set row
     that flashes when you log it
   Everything respects reduced motion and only moves transform and opacity, so it stays smooth on old phones.
   ========================================================= */

/* a token's value, so canvas drawing uses the same colours as the CSS */
function fxTok(name){ try{ return getComputedStyle(document.documentElement).getPropertyValue(name).trim()||name; }catch(e){ return name; } }

/* confetti: a short burst from a point, on its own canvas over a screen. o: {x,y (0–1 of the host), count, colors:[token or colour]} */
function fxConfetti(host,o){
  if(reduced||!host||!host.getBoundingClientRect) return;
  o=o||{};
  const r=host.getBoundingClientRect(); if(!r.width||!r.height) return;
  const cv=document.createElement("canvas"); cv.className="fx-cf"; cv.setAttribute("aria-hidden","true");
  const dpr=Math.min(2,window.devicePixelRatio||1); cv.width=Math.round(r.width*dpr); cv.height=Math.round(r.height*dpr);
  host.appendChild(cv);
  const g=cv.getContext("2d"); if(!g){ cv.remove(); return; } g.scale(dpr,dpr);
  const cols=(o.colors||["--glow","--cta","--glow-soft"]).map(c=>c.startsWith("--")?fxTok(c):c);
  const N=o.count||70, ox=(o.x==null?0.5:o.x)*r.width, oy=(o.y==null?0.3:o.y)*r.height;
  const P=Array.from({length:N},()=>{ const a=-Math.PI/2+(Math.random()-0.5)*Math.PI*1.3, v=4.5+Math.random()*7.5;
    return {x:ox,y:oy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,w:4+Math.random()*4,h:7+Math.random()*7,rot:Math.random()*6.28,vr:(Math.random()-0.5)*0.35,c:cols[(Math.random()*cols.length)|0],a:1,sq:Math.random()<0.3}; });
  const t0=performance.now(); let last=t0;
  const f=now=>{
    if(!cv.isConnected) return;
    const k=Math.min(2.2,(now-last)/16.67); last=now; const t=(now-t0)/1000;
    g.clearRect(0,0,r.width,r.height); let alive=0;
    for(const p of P){
      p.vy+=0.26*k; p.vx*=Math.pow(0.986,k); p.vy*=Math.pow(0.986,k); p.x+=p.vx*k; p.y+=p.vy*k; p.rot+=p.vr*k;
      if(t>1.2) p.a-=0.028*k;
      if(p.a<=0||p.y>r.height+24) continue;
      alive++; g.save(); g.globalAlpha=Math.max(0,p.a); g.translate(p.x,p.y); g.rotate(p.rot); g.fillStyle=p.c;
      if(p.sq) g.fillRect(-p.w/2,-p.w/2,p.w,p.w); else g.fillRect(-p.w/2,-p.h/2,p.w,Math.max(1.5,p.h*Math.abs(Math.cos(p.rot*1.7))));
      g.restore();
    }
    if(alive&&t<4) requestAnimationFrame(f); else cv.remove();
  };
  requestAnimationFrame(f);
}

/* embers: small lights that rise and fade around a badge (pure CSS; the markup sets each one's path and timing) */
function fxEmbersHTML(n){
  if(reduced) return "";
  let s=""; for(let i=0;i<n;i++){ const x=(Math.random()*100).toFixed(1), d=(Math.random()*2.6).toFixed(2), t=(2.4+Math.random()*2.2).toFixed(2), z=(0.6+Math.random()*0.9).toFixed(2), w=(Math.random()*40-20).toFixed(0);
    s+=`<i class="fx-em" style="--x:${x}%;--d:${d}s;--t:${t}s;--z:${z};--w:${w}px"></i>`; }
  return `<span class="fx-embers" aria-hidden="true">${s}</span>`;
}

/* count a number up (or down) inside an element */
function fxCount(el,from,to,ms,fmt){
  if(!el) return; fmt=fmt||(v=>String(v));
  if(reduced||from===to){ el.textContent=fmt(to); return; }
  const t0=performance.now(), f=now=>{ const u=Math.min(1,(now-t0)/ms), e=1-Math.pow(1-u,3); el.textContent=fmt(Math.round(from+(to-from)*e)); if(u<1&&el.isConnected) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}

/* a bar that fills from one fraction to another; across a level boundary it fills, empties and fills again */
function fxBar(el,from,to,wrap,ms){
  if(!el) return;
  const set=(v,d)=>{ el.style.transition=d?`width ${d}ms cubic-bezier(.2,.8,.2,1)`:"none"; el.style.width=(Math.max(0,Math.min(1,v))*100).toFixed(1)+"%"; };
  if(reduced){ set(to,0); return; }
  set(from,0); void el.offsetWidth;
  if(!wrap){ setTimeout(()=>set(to,ms||700),60); return; }
  setTimeout(()=>set(1,(ms||700)*0.55),60);
  setTimeout(()=>{ set(0,0); void el.offsetWidth; set(to,(ms||700)*0.6); },60+(ms||700)*0.6);
}

/* re-run a one-shot CSS animation class on an element */
function fxReplay(el,cls){ if(!el||reduced) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
