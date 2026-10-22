/* =========================================================
   HEX CONSTELLATION tab bar (19 Oct, from the "Body home screen redesign" thread; Andrej: "yes").
   A port of the design's HexTabBar.tsx to the web layer: Ossa's tab bar is the page's own #uNav, so this
   decorates it instead of adding React Native navigation.
   - Each tab is a level-badge hexagon on a faint dotted constellation; Body sits in the middle, highest.
   - The tab you're on fills lime, lifts, and shows its name and stat (STR/MND/REC from stats.js, LV on Body),
     with the stat as a ring round the hex.
   - Switching tabs sends a shooting star along the constellation from the old tab to the new one.
   - The bar keeps its height (--navH), so no screen moves; the hexes and the fade rise above its top edge.
   Prefix hx*. Function declarations only; state on hxS().
   ========================================================= */
function hxS(){ return hxS.s||(hxS.s={on:false,cur:null,raf:0}); }
function hxOrder(){ return ["train","breathe","today","recover","explore"]; }   // Body in the middle
const HX_PTS="24,2 46,14.5 46,39.5 24,52 2,39.5 2,14.5", HX_IN="24,6 42.5,16.6 42.5,37.4 24,48 5.5,37.4 5.5,16.6";
function hxLift(i,n){ const mid=(n-1)/2; return Math.round((1-Math.abs(i-mid)/Math.max(mid,1))*18); }   // px above the row

function hxDecorate(){
  const nav=$("uNav"); if(!nav||nav.classList.contains("hx")) return;
  nav.classList.add("hx"); $("app").classList.add("hxon");
  const O=hxOrder();
  const sky=document.createElementNS("http://www.w3.org/2000/svg","svg"); sky.setAttribute("class","hx-sky"); sky.setAttribute("aria-hidden","true");
  nav.prepend(sky);
  nav.querySelectorAll("[data-u]").forEach(b=>{
    const i=O.indexOf(b.dataset.u); b.style.order=i; b.style.setProperty("--hy",`${-hxLift(i,O.length)}px`);
    const ic=b.querySelector(".u-nav-ic"); if(!ic) return;
    ic.insertAdjacentHTML("afterbegin",`<svg class="hx-hex" viewBox="0 0 48 54" aria-hidden="true"><polygon class="hx-b" points="${HX_PTS}"/><polygon class="hx-r" pathLength="100" points="${HX_PTS}"/><polygon class="hx-f" points="${HX_IN}"/></svg>`);
    b.insertAdjacentHTML("beforeend",`<span class="hx-st"></span>`);
  });
  new MutationObserver(()=>hxSync()).observe(nav,{subtree:true,attributes:true,attributeFilter:["class"]});
  window.addEventListener("resize",()=>hxSky(true));
  hxS().on=true; hxSky(true); hxSync();
}
/* the tab centres in the nav's own box */
function hxPoints(){
  const nav=$("uNav"); if(!nav) return [];
  const r=nav.getBoundingClientRect();
  return hxOrder().map(k=>{ const b=nav.querySelector(`[data-u="${k}"] .hx-hex`); if(!b) return null; const q=b.getBoundingClientRect(); return {k,x:q.left+q.width/2-r.left,y:q.top+q.height/2-r.top}; }).filter(Boolean);
}
function hxSky(redraw){
  if(typeof hxNavPill==="function"&&hxNavPill()) return;
  const nav=$("uNav"), sky=nav&&nav.querySelector(".hx-sky"); if(!sky) return;
  const P=hxPoints(), W=nav.clientWidth, H=nav.clientHeight+40, cur=hxS().cur, ci=P.findIndex(p=>p.k===cur);
  sky.setAttribute("viewBox",`0 -40 ${W} ${H}`); sky.setAttribute("width",W); sky.setAttribute("height",H);
  let dust=""; for(let k=0;k<14;k++) dust+=`<circle cx="${(k*73+19)%Math.max(1,W)}" cy="${-30+((k*37)%70)}" r="${k%4?0.6:1}" style="opacity:${0.25+(k%3)*0.15}"/>`;
  const lines=P.slice(0,-1).map((p,k)=>{ const q=P[k+1], near=k===ci||k+1===ci; return `<line class="${near?"near":""}" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>`; }).join("");
  sky.innerHTML=`<g class="hx-dust">${dust}</g><g class="hx-lines">${lines}</g><line class="hx-star" x1="0" y1="0" x2="0" y2="0"/><circle class="hx-head" r="3" cx="0" cy="0"/>`;
}
/* the stat under the tab you're on, and the ring round each hex */
function hxStats(){
  let v=null, L=null; try{ v=stNow(); }catch(e){} try{ L=vxLevelInfo(); }catch(e){}
  return { train:v&&{t:`STR ${v.str}`,p:v.str/100}, breathe:v&&{t:`MND ${v.mind}`,p:v.mind/100}, recover:v&&{t:`REC ${v.rec}`,p:v.rec/100},
    today:L&&{t:`LV ${L.lv}`,p:L.frac}, explore:null };
}
function hxSync(){
  const st=hxS(), nav=$("uNav"); if(!st.on||!nav) return;
  const onB=nav.querySelector("[data-u].on"), cur=onB?onB.dataset.u:null;
  if(cur===st.cur&&!hxSync.force) return;
  hxSync.force=false;
  const prev=st.cur; st.cur=cur;
  const M=hxStats();
  nav.querySelectorAll("[data-u]").forEach(b=>{ const m=M[b.dataset.u], s=b.querySelector(".hx-st"), r=b.querySelector(".hx-r");
    if(s) s.textContent=m?m.t:""; if(r) r.style.strokeDasharray=`${m?Math.round(Math.max(0,Math.min(1,m.p))*100):0} 100`; });
  hxSky(true);
  if(prev&&cur&&prev!==cur) hxStar(prev,cur);
}
/* the shooting star: hops vertex to vertex from the old tab to the new one */
function hxStar(from,to){
  if(typeof hxNavPill==="function"&&hxNavPill()) return;
  if(typeof reduced!=="undefined"&&reduced) return;
  const nav=$("uNav"), star=nav&&nav.querySelector(".hx-star"), head=nav&&nav.querySelector(".hx-head"); if(!star||!head) return;
  const P=hxPoints(), a=P.findIndex(p=>p.k===from), b=P.findIndex(p=>p.k===to); if(a<0||b<0) return;
  const dir=b>a?1:-1, path=[]; for(let k=a;k!==b+dir;k+=dir) path.push(P[k]);
  let tot=0; for(let k=1;k<path.length;k++) tot+=Math.hypot(path[k].x-path[k-1].x,path[k].y-path[k-1].y);
  const at=d=>{ d=Math.max(0,d); for(let k=1;k<path.length;k++){ const p=path[k-1], q=path[k], l=Math.hypot(q.x-p.x,q.y-p.y); if(d<=l){ const f=l?d/l:0; return {x:p.x+(q.x-p.x)*f,y:p.y+(q.y-p.y)*f}; } d-=l; } return path[path.length-1]; };
  const dur=260+tot*0.9, t0=performance.now(), st=hxS(); cancelAnimationFrame(st.raf);
  const step=now=>{ const t=Math.min(1,(now-t0)/dur), e=1-(1-t)*(1-t), d=e*tot, h=at(d), tl=at(d-38);
    star.setAttribute("x1",tl.x); star.setAttribute("y1",tl.y); star.setAttribute("x2",h.x); star.setAttribute("y2",h.y);
    head.setAttribute("cx",h.x); head.setAttribute("cy",h.y); star.style.opacity=head.style.opacity=t<1?1:0;
    if(t<1) st.raf=requestAnimationFrame(step); };
  st.raf=requestAnimationFrame(step);
}
/* rdNavBuild (shell.js) makes the bar at boot; decorate it right after */
(()=>{ const _o=rdNavBuild; rdNavBuild=function(){ const v=_o.apply(this,arguments); try{ hxDecorate(); }catch(e){ console.warn("Ossa: hex tab bar",e); } return v; }; })();
/* stats change after a workout, a focus session or a reset: refresh the rings */
try{ vxOn("workout",()=>{ hxSync.force=true; setTimeout(hxSync,50); }); }catch(e){}

/* ---------- The tab bar tucked away (19 Oct, Andrej: "hidden kinda … scroll left and right to switch between tabs
   … click like a arrow to bring up the navigation … more space for the things that actually matter") ----------
   The hex bar sits below the screen; a slim strip shows five pips, the tab's name and an up arrow. The arrow (or a
   tap on the strip) raises the full bar; it tucks away again after a pick or 4 s. A horizontal swipe moves one tab
   left or right from anywhere that isn't the screen edge (the phone's back gesture), the 3D body, a scrolling row or a canvas.
   Off on full-screen flows (workout, run, intro, Focus tools that hide the bar). */
function hxMiniS(){ return hxMiniS.s||(hxMiniS.s={t:0,x:0,y:0,ok:false,tm:0}); }
function hxNames(){ return {train:"Train",breathe:"Focus",today:"Body",recover:"Recover",explore:"Learn"}; }
function hxNavPill(){ try{ return $("app").classList.contains("navpill"); }catch(e){ return false; } }
function hxMiniDraw(){
  if(hxNavPill()) return;
  const app=$("app"); if(!app) return; let m=$("hxMini");
  if(!m){ m=document.createElement("div"); m.id="hxMini"; m.className="hx-mini";
    m.innerHTML=`<button class="hx-mini-b" id="hxMiniB" aria-label="Show the tabs"><span class="hx-pips"></span><b id="hxMiniN"></b><i class="hx-up" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="M3 7.5 6 4.5l3 3"/></svg></i></button>`;
    app.appendChild(m); $("hxMiniB").onclick=()=>{ try{ Pulse.buzz(6); }catch(e){} hxOpen(!app.classList.contains("navopen")); }; }
  const cur=hxS().cur, O=hxOrder();
  m.querySelector(".hx-pips").innerHTML=O.map(k=>`<i class="${k===cur?"on":""}"></i>`).join("");
  const n=$("hxMiniN"); if(n) n.textContent=hxNames()[cur]||"";
}
function hxOpen(on){
  const app=$("app"), st=hxMiniS(); clearTimeout(st.tm); app.classList.toggle("navopen",!!on);
  if(on){ hxSync.force=true; hxSync(); st.tm=setTimeout(()=>hxOpen(false),4000); }
}
function hxSwipeOff(){ const a=$("app"); return !a||["onboarding","tactive","tdone","fcfull","storying","touring","wkrun"].some(c=>a.classList.contains(c))||!!document.querySelector(".panel.on")||(typeof MIND!=="undefined"&&MIND.open&&String(MIND.view||"home")!=="home"&&String(MIND.view||"")!=="more")||$("app").classList.contains("tplan"); }
function hxBusyTarget(el){ try{ return !!(el&&el.closest&&el.closest("canvas,#stage,input,textarea,.fg-cols,.fh-cards,.dk-week,.ey-bars,[data-noswipe],#rdHero .u-rk-tap,.u-rk3dh")); }catch(e){ return false; } }
function hxSwipeWire(){
  if(hxSwipeWire.on) return; hxSwipeWire.on=true; const st=hxMiniS();
  document.addEventListener("touchstart",e=>{ const t=e.touches[0]; st.ok=e.touches.length===1&&!hxSwipeOff(); if(!st.ok) return;
    const W=innerWidth, edge=t.clientX<28||t.clientX>W-28; st.ok=!edge&&!hxBusyTarget(e.target);   /* the edges belong to the phone's back gesture */ st.x=t.clientX; st.y=t.clientY; st.t=Date.now(); },{passive:true});
  document.addEventListener("touchend",e=>{ if(!st.ok) return; st.ok=false; const t=e.changedTouches[0], dx=t.clientX-st.x, dy=t.clientY-st.y;
    if(Math.abs(dx)<70||Math.abs(dy)>Math.abs(dx)*0.5||Date.now()-st.t>700) return;
    const O=hxOrder(), i=O.indexOf(hxS().cur), j=i+(dx<0?1:-1); if(i<0||j<0||j>=O.length) return;
    try{ if(typeof hap==="function") hap("select"); else Pulse.buzz(6); }catch(x){}
    uiGo(O[j]); },{passive:true});
}
(()=>{ const _s=hxSync; hxSync=function(){ const v=_s.apply(this,arguments); try{ npGlide(); hxMiniDraw(); if($("app").classList.contains("navopen")&&hxSync.picked){ hxSync.picked=false; setTimeout(()=>hxOpen(false),350); } }catch(e){} return v; }; })();
(()=>{ const _d=hxDecorate; hxDecorate=function(){ const v=_d.apply(this,arguments); try{ const app=$("app"); app.classList.add("navpill"); app.classList.remove("navmin"); hxSwipeWire(); npGlider();
  const nav=$("uNav"); if(nav) nav.addEventListener("click",e=>{ if(e.target.closest("[data-u]")) hxSync.picked=true; },true); }catch(e){ console.warn("Ossa: tucked tab bar",e); } return v; }; })();

/* ---------- The pill (19 Oct, Andrej: "make the navigation cleaner and better and easier to use") ----------
   Every tab one tap away, nothing to open first: a slim floating pill of five icons (Train · Focus · Body · Recover ·
   Learn, Body in the middle as before). The tab you're on shows its name in lime on a capsule that slides from the old
   tab to the new one (the pill's shooting star). Each icon is at least 44 pt to tap. The mid-screen swipe stays.
   Hidden on full-screen flows by shell.css's own rules (workout, run, intro, Focus tools, Unwind). */
function npGlider(){
  const nav=$("uNav"); if(!nav||nav.querySelector(".np-glide")) return;
  const g=document.createElement("i"); g.className="np-glide"; g.setAttribute("aria-hidden","true"); nav.prepend(g);
  window.addEventListener("resize",()=>npGlide(true));
  npGlide(true);
}
function npGlide(now){
  if(!hxNavPill()) return;
  const nav=$("uNav"), g=nav&&nav.querySelector(".np-glide"); if(!g) return;
  /* after the label has opened: measure on the next frames (the button widths animate) */
  const place=()=>{ const b=nav.querySelector("[data-u].on"); if(!b){ g.style.opacity="0"; return; }
    const nr=nav.getBoundingClientRect(), br=b.getBoundingClientRect(), w=br.width.toFixed(1)+"px", tf=`translateX(${(br.left-nr.left).toFixed(1)}px)`;
    /* write only what moved, so the next frame's read doesn't pay for a fresh layout (perf, 21 Oct) */
    if(g.style.opacity!=="1") g.style.opacity="1"; if(place.w!==w){ place.w=w; g.style.width=w; } if(place.tf!==tf){ place.tf=tf; g.style.transform=tf; } };
  if(now){ g.classList.add("np-now"); place(); requestAnimationFrame(()=>g.classList.remove("np-now")); return; }
  cancelAnimationFrame(npGlide.raf); let n=0; const tick=()=>{ place(); if(++n<22) npGlide.raf=requestAnimationFrame(tick); }; tick();
}
