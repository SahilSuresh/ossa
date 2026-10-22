/* =========================================================
   SPIKES: desktop preview only, never in the app.
   scripts/build-html.js inlines this file into web/.preview.html only (its
   @include-preview marker in ossa.html), and the code below also needs localhost:
     http://localhost:5178/?spike=monk         seated Monk poses (Lotus, Block) with sliders
     http://localhost:5178/?spike=shape        Tank / neutral / Scout body shape with a slider
     http://localhost:5178/?spike=monk,shape   both
   Monk: MOVES.monk_lotus and MOVES.monk_block, posed with Body.setPose (no easing).
     The sliders start from the shipped presets and use the shipped maths (hlPresets, hlPose
     and hlPoseMake in web/ui/halo.js: one source of truth, lifted to sit at y≈0).
     figLive is wrapped so the 5-minute live pose doesn't undo the spike pose.
     SPIKE.bounds("lotus"|"block"|null, "m"|"f", {lift:false}) skins the mesh and returns the
     posed figure's extents (about 0.1-0.2 s): re-measure hlPresets' lift and top after tuning.
   Shape: since Ossa 2.0 Phase 5 the shape ships as the bx-arch effect in web/ui/look-fx.js (the same
     maths); this panel only drives it: bxPreview({arch}) for Scout · Tank and bxArGain.o for the strength
     (1 to 3). Nothing is saved, and Your path's own choice comes back when the page reloads.
   Console: SPIKE.pose("lotus"|"block"|null), SPIKE.set("knee",150), SPIKE.cam("side"),
     SPIKE.shape(-1..1) (Scout to Tank), SPIKE.gain(1..3), SPIKE.copy(), SPIKE.bounds(…)
   Everything lives inside one function: no globals besides window.SPIKE.
   ========================================================= */
(()=>{
  const on={};
  try{
    if(!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
    const m=/[?&]spike=([a-z,]+)/.exec(location.search); if(!m) return;
    m[1].split(",").forEach(k=>{ if(k) on[k]=true; });
  }catch(e){ return; }
  if(!on.monk&&!on.shape) return;

  const DEG=Math.PI/180;
  const fig=()=>typeof S!=="undefined"&&S.body==="f"&&FIGURES.f?"f":"m";
  const st={pose:null, cam:"three", shape:0, gain:typeof bxArGain==="function"?bxArGain():2, open:false, tune:false};

  /* ---------- Monk: seated poses ---------- */
  /* sliders, in cm and degrees. The pose is given for the +x side (the figure's left)
     and the renderer mirrors it; "cross" lifts one shin over the other */
  const SLIDERS=[
    ["seat","Seat height",0,60,"cm"], ["flex","Hip bend",0,130,"°"], ["spread","Knees apart",-10,70,"°"],
    ["turn","Turn-out",-30,100,"°"], ["knee","Knee bend",0,165,"°"], ["cross","Cross",-20,20,"°"],
    ["feet","Feet point",-40,60,"°"], ["lean","Lean",-20,30,"°"], ["head","Head",-20,30,"°"],
    ["armF","Arms forward",-10,100,"°"], ["armO","Arms out",-10,60,"°"], ["elbow","Elbows",0,150,"°"],
    ["palms","Palms up",-90,150,"°"]
  ];
  /* the shipped presets (web/ui/halo.js) */
  const PRESET={lotus:{...hlPresets().lotus.q}, block:{...hlPresets().block.q}};
  const Q={lotus:{...PRESET.lotus}, block:{...PRESET.block}};
  /* camera per pose: the seated figure sits low, so look lower and closer */
  const FRAME={lotus:{zoom:1.3,py:-0.38}, block:{zoom:1.15,py:-0.15}, none:{zoom:1,py:0}};   // the poses are lifted to sit at y≈0
  const YAW={front:0, three:0.6, side:Math.PI/2, back:Math.PI};

  /* the shipped maths, with the shipped lift for that pose */
  const monkPose=(name,f)=>hlPose(name,f,Q[name])||{};
  if(on.monk){
    MOVES.monk_lotus={view:0.6,f:(p,t,f)=>monkPose("lotus",f||fig())};
    MOVES.monk_block={view:0.6,f:(p,t,f)=>monkPose("block",f||fig())};
  }
  const glOk=()=>typeof Body!=="undefined"&&Body&&Body.kind==="gl"&&typeof Body.setPose==="function";
  function applyPose(){
    if(!glOk()) return;
    try{ Body.setPose(st.pose?MOVES["monk_"+st.pose].f(1,0,fig()):null); }catch(e){ console.warn(e); }
  }
  function cam(v){
    if(v) st.cam=v;
    if(!glOk()) return;
    const fr=FRAME[on.monk&&st.pose||"none"];
    try{ Body.camTo({zoom:fr.zoom,px:0,py:fr.py,yaw:YAW[st.cam]||0},0.8); }catch(e){}
  }
  function setPose(name){
    st.pose=name&&Q[name]?name:null;
    applyPose();
    if(!st.pose){ try{ _figLive(); }catch(e){} }   // standing: the app's own live pose comes back
    cam(); paint();
  }
  /* the app re-poses the figure every 5 minutes (and after the desk and posture checks) */
  const _figLive=figLive;
  if(on.monk) figLive=function(){ const r=_figLive.apply(this,arguments); if(st.pose) applyPose(); return r; };

  /* ---------- Shape: Tank / neutral / Scout (drives look-fx.js's bx-arch, nothing saved) ---------- */
  function shapeOut(){
    if(typeof bxPreview!=="function") return;
    const o=Object.assign({},bxPreview.o||{}), k=st.shape;
    o.arch=k>0?{a:"tank",amt:k}:k<0?{a:"scout",amt:-k}:null;
    bxPreview(o);
  }
  function gainOut(){ if(typeof bxArGain==="function"){ bxArGain.o=st.gain; try{ Body.fxKick&&Body.fxKick(); }catch(e){} } }
  function setShape(k){ st.shape=Math.max(-1,Math.min(1,+k||0)); shapeOut(); paint(); }
  function setGain(g){ st.gain=Math.max(1,Math.min(3,+g||1)); gainOut(); paint(); }

  /* ---------- the panel (tokens only: check-tokens.js reads this file too) ---------- */
  const CSS=`
.spk{position:fixed;z-index:9999;bottom:calc(var(--tabH) + var(--sp-2));right:var(--sp-2);width:min(340px,calc(100vw - 16px));max-height:32vh;overflow:auto;overscroll-behavior:contain;box-sizing:border-box;
  background:var(--glass-strong);border:1px solid var(--glass-line);border-radius:var(--r-card);color:var(--text-1);
  font:500 var(--fs-1)/1.35 var(--body);padding:var(--sp-2) var(--sp-3);-webkit-backdrop-filter:blur(var(--glass-blur));backdrop-filter:blur(var(--glass-blur))}
.spk-hd{display:flex;align-items:center;gap:var(--sp-2)}
.spk-hd b{flex:1;font-size:var(--fs-1);font-weight:800;letter-spacing:var(--track-caps);text-transform:uppercase;color:var(--text-2)}
.spk-sec{margin-top:var(--sp-2);padding-top:var(--sp-2);border-top:1px solid var(--line)}
.spk-sec h6{margin:0;font-size:var(--fs-1);font-weight:800;color:var(--text-1)}
.spk-row{display:flex;flex-wrap:wrap;gap:var(--sp-1);margin-top:var(--sp-2)}
.spk button{appearance:none;-webkit-appearance:none;border:1px solid var(--line-2);background:var(--surface-3);color:var(--text-1);border-radius:var(--r-pill);
  padding:var(--sp-1) var(--sp-3);font:700 var(--fs-1)/1.4 var(--body);min-height:28px;cursor:pointer}
.spk button.on{background:var(--cta);color:var(--on-cta);border-color:var(--cta)}
.spk label{display:grid;grid-template-columns:86px 1fr 44px;align-items:center;gap:var(--sp-2);margin-top:var(--sp-1);color:var(--text-2)}
.spk input[type=range]{width:100%;margin:0;accent-color:var(--glow)}
.spk output{text-align:right;color:var(--text-1);font-variant-numeric:tabular-nums}
.spk-note{margin-top:var(--sp-1);color:var(--text-3)}
.spk.min .spk-bd{display:none}
/* folded: a small pill bottom-left, clear of the cards and the body */
.spk.min{right:auto;left:var(--sp-2);width:auto;padding:var(--sp-1) var(--sp-1) var(--sp-1) var(--sp-3)}
.spk.min .spk-hd b{flex:none}`;

  let P=null;
  const btn=(act,val,label,sel)=>`<button type="button" data-a="${act}" data-v="${val}"${sel?' class="on"':""}>${label}</button>`;
  const fmt=(v,u)=>u==="cm"?v+" cm":v+"°";
  function html(){
    let h=`<div class="spk-hd"><b>Preview only</b>${btn("min",0,st.open?"Hide":"Show",false)}</div><div class="spk-bd">`;
    if(on.monk){
      const q=st.pose&&Q[st.pose];
      h+=`<div class="spk-sec"><h6>Monk pose</h6>
        <div class="spk-row">${btn("pose","lotus","Lotus",st.pose==="lotus")}${btn("pose","block","Block",st.pose==="block")}${btn("pose","","Standing",!st.pose)}</div>
        <div class="spk-row">${["front","three","side","back"].map(v=>btn("cam",v,{front:"Front",three:"¾",side:"Side",back:"Back"}[v],st.cam===v)).join("")}</div>
        ${q?`<div class="spk-row">${btn("tune",0,st.tune?"Hide sliders":"Sliders",st.tune)}${btn("reset",0,"Reset",false)}${btn("copy",0,"Copy pose",false)}</div>`:""}
        ${q&&st.tune?SLIDERS.map(([k,l,a,b,u])=>`<label>${l}<input type="range" min="${a}" max="${b}" step="1" value="${q[k]}" data-k="${k}"><output>${fmt(q[k],u)}</output></label>`).join(""):""}
      </div>`;
    }
    if(on.shape){
      h+=`<div class="spk-sec"><h6>Body shape</h6>
        <div class="spk-row">${btn("shape",-1,"Scout",st.shape===-1)}${btn("shape",0,"Neutral",st.shape===0)}${btn("shape",1,"Tank",st.shape===1)}</div>
        ${on.monk?"":`<div class="spk-row">${["front","three","side","back"].map(v=>btn("cam",v,{front:"Front",three:"¾",side:"Side",back:"Back"}[v],st.cam===v)).join("")}</div>`}
        <label>Scout · Tank<input type="range" min="-100" max="100" step="1" value="${Math.round(st.shape*100)}" data-k="shape"><output>${Math.round(st.shape*100)}</output></label>
        <label>Strength<input type="range" min="100" max="300" step="5" value="${Math.round(st.gain*100)}" data-k="gain"><output>${Math.round(st.gain*100)}%</output></label>
        <div class="spk-note">Moves the skin up to 1 cm at 100%, 2 cm at 200% (the default). Colours and taps don't move.</div>
      </div>`;
    }
    return h+"</div>";
  }
  function paint(){
    if(!P) return;
    P.classList.toggle("min",!st.open);
    /* keep a slider being dragged: only re-render when nothing in the panel has focus */
    if(P.contains(document.activeElement)&&document.activeElement.type==="range") return;
    P.innerHTML=html();
  }
  function copyPose(){
    if(!st.pose) return;
    const p=MOVES["monk_"+st.pose].f(1,0,fig()), r=JSON.stringify(p,(k,v)=>typeof v==="number"?Math.round(v*1000)/1000:v);
    console.log("monk_"+st.pose+" sliders",JSON.stringify(Q[st.pose]),"pose",r);
    try{ navigator.clipboard&&navigator.clipboard.writeText(r).catch(()=>{}); }catch(e){}
  }
  function mount(){
    if(P||!document.body) return;
    const s=document.createElement("style"); s.textContent=CSS; document.head.appendChild(s);
    P=document.createElement("div"); P.className="spk"; P.setAttribute("role","region"); P.setAttribute("aria-label","Preview controls");
    ["pointerdown","touchstart","click","wheel"].forEach(t=>P.addEventListener(t,e=>e.stopPropagation()));
    P.addEventListener("click",e=>{
      const b=e.target.closest("button[data-a]"); if(!b) return;
      const a=b.dataset.a, v=b.dataset.v;
      if(a==="min"){ st.open=!st.open; paint(); }
      else if(a==="pose") setPose(v);
      else if(a==="cam"){ cam(v); paint(); }
      else if(a==="tune"){ st.tune=!st.tune; paint(); }
      else if(a==="reset"&&st.pose){ Q[st.pose]={...PRESET[st.pose]}; applyPose(); paint(); }
      else if(a==="copy") copyPose();
      else if(a==="shape") setShape(v);
    });
    P.addEventListener("input",e=>{
      const i=e.target; if(!i.dataset||!i.dataset.k) return;
      const k=i.dataset.k, v=+i.value, o=i.parentNode.querySelector("output");
      if(k==="shape"){ st.shape=v/100; if(o) o.textContent=v; shapeOut(); return; }
      if(k==="gain"){ st.gain=Math.max(1,v/100); if(o) o.textContent=v+"%"; gainOut(); return; }
      if(!st.pose) return;
      Q[st.pose][k]=v; const d=SLIDERS.find(x=>x[0]===k); if(o&&d) o.textContent=fmt(v,d[4]);
      applyPose();
    });
    P.addEventListener("change",e=>{ if(e.target.type==="range") e.target.blur(); paint(); });
    document.body.appendChild(P); paint();
  }

  /* the posed figure's extents in world metres (the mesh skinned on the CPU the way the shader does it).
     name "lotus" | "block" | null (standing); fig "m" | "f"; {lift:false} measures without the shipped lift */
  function bounds(name,f,opt){
    f=f==="f"&&FIGURES.f?"f":f==="m"?"m":fig();
    const mesh=FIGURES[f].mesh(), t0=performance.now(), sk=skinWeights(mesh,f);
    let pose=name?hlPose(name,f,Q[name]):{};
    if(!pose) return null;
    if(name&&opt&&opt.lift===false){ pose={...pose,root:[0,pose.root[1]-hlPresets()[name][f].lift,0]}; }
    const B=boneMats(pose,f,1), raw=Uint8Array.from(atob(mesh.pos),c=>c.charCodeAt(0)), q=new Uint16Array(raw.buffer);
    const mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9], p=[0,0,0];
    for(let i=0;i<mesh.nv;i++){
      for(let a=0;a<3;a++) p[a]=mesh.lo[a]+q[i*3+a]/65535*(mesh.hi[a]-mesh.lo[a]);
      const b0=sk.bi[i*2]|0, b1=sk.bi[i*2+1]|0, w=sk.bw[i];
      for(let r=0;r<3;r++){
        let v=B[b0*16+12+r]*w+B[b1*16+12+r]*(1-w);
        for(let c=0;c<3;c++) v+=(B[b0*16+c*4+r]*w+B[b1*16+c*4+r]*(1-w))*p[c];
        if(v<mn[r]) mn[r]=v; if(v>mx[r]) mx[r]=v;
      }
    }
    const r3=v=>Math.round(v*1000)/1000;
    return {pose:name||"standing", fig:f, x:[r3(mn[0]),r3(mx[0])], y:[r3(mn[1]),r3(mx[1])], z:[r3(mn[2]),r3(mx[2])], ms:Math.round(performance.now()-t0)};
  }

  window.SPIKE={on, bounds, pose:setPose, set:(k,v)=>{ if(st.pose&&k in Q[st.pose]){ Q[st.pose][k]=+v; applyPose(); paint(); } }, cam:v=>{ cam(v); paint(); },
    shape:setShape, gain:setGain, copy:copyPose, params:()=>st.pose?{...Q[st.pose]}:null, state:()=>({...st})};

  /* after boot: Body exists once this script block has finished */
  setTimeout(()=>{
    mount();
    if(on.monk) setPose("lotus");
    else cam("front");
    setTimeout(()=>{ cam(); }, 1400);   // after the opening camera move
  },0);
})();
