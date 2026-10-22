/* =========================================================
   VAULT — Ossa 2.0 Phase 5 "Evolve" (package: vault). Prefix vt, classes .vt-.
   Ossa Pro's three new materials for the whole body (Obsidian, Chrome, Carbon fibre), the Your look view,
   its hub tile, and the two Pro hooks on the body. "Vault" is only the label over the three swatches,
   never a product, perk or feature name in a sentence. Earned finishes and prestige materials stay free.
   - vtMats()            the three materials {id, name, tok, rim} (ids never clash with FINISHES or prestige)
   - vtOn()              the materials can be drawn on this phone: Body.kind==="gl" and render's bxOk("fin"),
                         or, while render isn't there, only in the preview (core's evPreviewOn()). Everything
                         that sells or shows the materials checks it (proPerks, the paywall, Your look, vtPick).
   - vtFinishNow()       pure reader (safe inside a GL draw): the live preview id, else S.finish when it is a
                         material id and Pro is on, else null; null when !vtOn()
   - vtPreview(id|null)  a live-body override, nothing saved (preview switches only; Your look uses stills)
   - vtPick(id, o)       Pro: wear it (save, refresh, bxKick, toast, evolve "look"); not Pro: the paywall on it
   - vtShot(id, el)      a still of the chest and shoulders in a material alone (render's fx.look.only: no
                         muscle colours), sized to el: the paywall circles and Your look's preview chip
   - vtTile()            the Evolve hub's Your look tile (pure)
   - view "look"         Your look: the body in its current look, the four earned finishes, the materials
                         and prestige materials on or off. Taps apply; no bottom button.
   Wrappers (the only ones of these names): rimColor (a material's rim tint) and proChanged (refresh the
   body and the still caches, emit "pro"). Listens to "pro" to redraw Your look.
   No top-level const or let: state lives on function properties (vtMats.L, vtShot.c, vtLookShot.c, vtPreview.id).
   What a still depends on: vtSig() for the body in its look (figure, rank colours and fade, render's look key),
   vtSwSig() for a material alone (figure, render's look key, which muscles are still unexplored).
   Tokens only (web/ui/tokens.css); safe areas as var(--ev-sat)/var(--ev-sab).
   ========================================================= */

/* the three materials. tok: the swatch colour, rim: the body's rim tint while it's worn */
function vtMats(){
  return vtMats.L||(vtMats.L=Object.freeze([
    Object.freeze({id:"obsidian",name:"Obsidian",tok:"--mat-obsidian",rim:"--mat-obsidian-rim"}),
    Object.freeze({id:"chrome",name:"Chrome",tok:"--mat-chrome",rim:"--mat-chrome"}),
    Object.freeze({id:"carbon",name:"Carbon fibre",tok:"--mat-carbon",rim:"--mat-carbon-hi"})]));
}
function vtMat(id){ const L=vtMats(); for(let i=0;i<L.length;i++) if(L[i].id===id) return L[i]; return null; }
function vtIsId(id){ return id==="obsidian"||id==="chrome"||id==="carbon"; }

/* can this phone draw the materials? Never sell or show what would silently render as Ice */
function vtOn(){
  try{
    if(typeof Body==="undefined"||!Body||Body.kind!=="gl") return false;
    if(typeof bxOk==="function") return !!bxOk("fin");
    return typeof evPreviewOn==="function"&&!!evPreviewOn();
  }catch(e){ return false; }
}
/* the material the body wears right now (render and rimColor read this every frame: no DOM, no save) */
function vtFinishNow(){
  if(!vtOn()) return null;
  if(vtIsId(vtPreview.id)) return vtPreview.id;
  const f=typeof S!=="undefined"&&S?S.finish:null;
  return vtIsId(f)&&typeof isPro==="function"&&isPro()?f:null;
}
/* a live-body override for preview switches; nothing is saved. null clears it */
function vtPreview(id){
  const v=vtIsId(id)?id:null; if((vtPreview.id||null)===v) return;
  vtPreview.id=v; vtKick();
}
function vtKick(){ try{ if(typeof bxKick==="function") bxKick(); }catch(e){ console.warn(e); } }
function vtEmit(){ try{ if(typeof vxEmit==="function") vxEmit("evolve",{what:"look"}); }catch(e){ console.warn(e); } }
function vtRefreshBody(){ try{ if(typeof Body!=="undefined"&&Body&&Body.refresh) Body.refresh(); }catch(e){ console.warn(e); } }

/* the earned finish in effect (rimColor's own rule: unknown or locked → Ice) */
function vtFinCur(){
  try{ const f=FINISHES.find(x=>x.id===S.finish); return f&&vxHas("finish:"+f.id)?f:FINISHES[0]; }catch(e){ return {id:"ice",name:"Ice",at:0,lv:0}; }
}

/* wear a material. o.quiet: no toast (right after buying Pro, when the welcome toast says it) */
function vtPick(id,o){
  o=o||{};
  const m=vtMat(id); if(!m||!vtOn()) return false;
  if(!isPro()){ openPaywall("material",{mat:id}); return false; }
  if(S.finish===id) return true;   // already worn: nothing to redo, no second toast
  S.finish=id; save();
  vtRefreshBody(); vtKick();
  if(!o.quiet) toast(`${m.name} on`);
  vtEmit();
  return true;
}
/* use an earned finish (the legacy rules: unlocked by sessions; replaces a material too) */
function vtUseFinish(id){
  const f=FINISHES.find(x=>x.id===id); if(!f||!vxHas("finish:"+f.id)) return false;
  const was=S.finish;
  if(was!==f.id){ S.finish=f.id; save(); }
  vtRefreshBody(); vtKick();
  toast(`${f.name} finish on`);
  if(was!==f.id) vtEmit();
  return true;
}

/* device px for a still, from an element's CSS box (core's evPx when it's there) */
function vtPx(el){
  if(!el) return null;
  try{ if(typeof evPx==="function"){ const r=evPx(el); if(r&&r[0]>0&&r[1]>0) return r; } }catch(e){}
  const k=Math.min(window.devicePixelRatio||1,2.5), w=Math.round(el.offsetWidth*k), h=Math.round(el.offsetHeight*k);
  return w>0&&h>0?[w,h]:null;
}
function vtCanShoot(){ return typeof Body!=="undefined"&&!!Body&&Body.kind==="gl"&&typeof Body.shot==="function"; }

/* what a still of the body depends on besides its framing: figure, rank colours and fade, and render's look key.
   Cheap (no simulation); read at call time, so Load demo, Start fresh and a workout all change it */
function vtSig(){
  let sc=""; try{ sc=GLORDER.map(k=>(S.scores[k]||0)+":"+(typeof rkFadeShown==="function"?Math.round(rkFadeShown(k)*8):0)).join(","); }catch(e){}
  return [S.body||"m",uiSafe(()=>typeof bxLookKey==="function"?bxLookKey():"",""),sc].join("|");
}
/* what a material-alone still depends on: the figure, render's look key, and which muscles are unexplored
   (render's unexplored block still dims those to 0.8 of the material; the check view has none). Not the
   scores or fade: fx.look.only takes the rank colours off */
function vtSwSig(){
  let nw=""; try{ nw=window.CHECKVIEW?"cv":GLORDER.map(k=>typeof isNew==="function"&&isNew(k)?1:0).join(""); }catch(e){}
  return [S.body||"m",uiSafe(()=>typeof bxLookKey==="function"?bxLookKey():"",""),nw].join("|");
}
/* a still of the chest and shoulders in material id alone, sized to el: the paywall's three circles and Your
   look's preview chip. fx.look.only takes the muscle colours off (render), so a trained chest shows the
   material, not its rank; prestige materials, the path shape and the ghost are off too. Cached per id and size
   for the current vtSwSig() only (a new signature drops the old stills); proChanged clears it too. */
function vtShot(id,el){
  if(!vtIsId(id)||!vtOn()||!vtCanShoot()) return null;
  const sz=vtPx(el); if(!sz) return null;
  const sig=vtSwSig();
  if(!vtShot.c||vtShot.c.sig!==sig) vtShot.c={sig,m:{}};
  const c=vtShot.c.m, key=[id,sz[0],sz[1]].join("|");
  if(c[key]) return c[key];
  let u=null;
  try{ u=Body.shot({at:[0,1.37,0],span:0.46,yaw:0.35,size:sz,fx:{look:{fin:id,only:true,mats:null,arch:null,ghost:null}}}); }catch(e){ console.warn("Ossa: material still",e); u=null; }
  if(u) c[key]=u;
  return u;
}

/* ---------- the hub tile ---------- */
function vtTile(){
  const n=sessionsN(), worn=vtFinishNow();
  if(worn){ const m=vtMat(worn); return {sub:`${m.name} · Pro`,bar:null,c:`var(${m.rim})`,dot:false}; }
  const cur=vtFinCur(), F=[...FINISHES].sort((a,b)=>(a.lv||0)-(b.lv||0)), next=F.find(f=>!vxHas("finish:"+f.id)), L=vxLevelInfo();
  if(!next) return {sub:`${cur.name} finish`,bar:null,c:`var(--fin-${cur.id})`,dot:false};
  /* the tile has one line of about 135 px at fs-1: the goal only (the icon is tinted in the finish in use),
     "level" only while it still fits ("Gold at level 30", "Bioluminescent at 8") */
  const goal=`${next.name} at level ${next.lv}`;
  return {sub:goal.length<=21?goal:`${next.name} at ${next.lv}`,bar:Math.max(0,Math.min(1,L.xp/Math.max(1,vxLevelXp(next.lv)))),c:`var(--fin-${cur.id})`,dot:false};
}

/* ---------- Your look (view "look") ---------- */
function vtLockSvg(){ return `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0"/></svg>`; }
/* the whole body at yaw 0.35 in its current look, or with material pv as a preview (a still: the live body
   is hidden behind the panel). The preview stays honest: the muscles keep their rank colours over the
   material, as on the live body once it's worn; the chip in the corner (vtShot) shows the material alone.
   Cached per look, scores, figure and size. */
function vtLookShot(el,pv){
  if(!vtCanShoot()) return null;
  const sz=vtPx(el); if(!sz) return null;
  const c=vtLookShot.c||(vtLookShot.c={key:"",url:null});
  const key=[pv||"",sz[0],sz[1],S.finish||"",vtFinCur().id,vtFinishNow()||"",typeof isPro==="function"&&isPro()?1:0,vtSig()].join("|");
  if(c.key===key&&c.url) return c.url;
  let u=null;
  try{ u=Body.shot({at:[0,0.9,0],span:1.94,yaw:0.35,size:sz,...(pv?{fx:{look:{fin:pv}}}:{})}); }catch(e){ console.warn("Ossa: look still",e); u=null; }
  if(u){ c.key=key; c.url=u; }
  return u;
}
function vtLookDraw(b,o){
  o=o||{};
  const n=sessionsN(), on=vtOn(), pro=isPro(), worn=vtFinishNow(), cur=worn?null:vtFinCur();
  const pv=on&&!pro&&vtIsId(o.pv)?o.pv:null, pm=pv?vtMat(pv):null;
  const lapsed=on&&!pro&&vtIsId(S.finish);
  const E=uiSafe(()=>typeof pzEarned==="function"?pzEarned():[],[])||[], N=E.reduce((a,x)=>a+((x&&x.mats)||[]).length,0);
  const show=uiSafe(()=>typeof pzShow==="function"?pzShow()!==false:true,true);
  const vsub=!on?`<small>Not available on this phone</small>`
    :pv?`<button class="u-btn primary small vt-get" id="vtGet">Get Ossa Pro</button>`
    :lapsed?`<small class="vt-wrap">Needs Ossa Pro · <span class="vt-nw">showing Ice</span></small>`
    :pro?`<small>${worn?`${uiEsc(vtMat(worn).name)} in use`:"Tap to use"}</small>`
    :`<small>With Ossa Pro</small>`;
  b.innerHTML=`<div class="vt-look">
    <div class="vt-still">${pm?`<span class="vt-pv-c" role="img" aria-label="${uiEsc(pm.name)} up close" data-vt="${pm.id}"></span><span class="vt-lock">${vtLockSvg()}${uiEsc(pm.name)} comes with Ossa Pro</span>`:""}</div>
    <div class="vt-fins" role="group" aria-label="Finishes">${FINISHES.map(f=>{ const got=vxHas("finish:"+f.id), use=!!cur&&cur.id===f.id;
      return `<button class="vt-fin${use?" on":""}${got?"":" lk"}" data-fin="${f.id}" aria-pressed="${use}"${got?"":` aria-disabled="true"`}><i class="vt-sw" style="--c:var(--fin-${f.id})"></i>
        <span><b>${uiEsc(f.name)}</b><small>${use?"In use":got?"Tap to use":`At level ${f.lv} · ${Math.max(0,vxLevelXp(f.lv)-vxXp())} RP to go`}</small></span></button>`; }).join("")}</div>
    <div class="vt-vault${on?"":" off"}">
      <div class="vt-vl"><span class="u-eyebrow">Vault</span>${vsub}</div>
      <div class="vt-sws" role="group" aria-label="New materials">${vtMats().map(m=>`<button class="vt-m${worn===m.id||pv===m.id?" on":""}" data-vt="${m.id}" aria-label="${uiEsc(m.name)}" aria-pressed="${worn===m.id}"${on?"":" disabled"}><i class="vt-mi" data-m="${m.id}"></i></button>`).join("")}</div>
    </div>
    ${N?`<button class="vt-pz" id="vtPz" role="switch" aria-checked="${show}"><span><b>Prestige materials</b><small>${N} earned</small></span><span class="vt-tg${show?" on":""}" aria-hidden="true"><i></i></span></button>`
      :`<button class="vt-pz none" id="vtPzGo"><span><b>Prestige materials</b><small>Earn one with a prestige lap</small></span>${typeof UI_IC!=="undefined"?UI_IC.chev:"›"}</button>`}
  </div>`;
  const root=b.querySelector(".vt-look"), still=root.querySelector(".vt-still");
  const url=vtLookShot(still,pv);
  still.insertAdjacentHTML("afterbegin",url?`<img class="vt-img" src="${url}" alt="Your body${pm?` in ${uiEsc(pm.name)}, a preview`:", in its current look"}" draggable="false">`
    :`<div class="vt-fig">${uiSafe(()=>uiRankFig("front",{}),"")}</div>`);
  /* the preview's chip: the material alone (no still: the flat swatch from vault.css) */
  const chip=root.querySelector(".vt-pv-c");
  if(chip){ const cu=vtShot(pv,chip); if(cu) chip.innerHTML=`<img src="${cu}" alt="" draggable="false">`; }
  /* after a change: core's "evolve" listener redraws the view; if nothing did, redraw here */
  const again=()=>{ if(b.isConnected&&b.querySelector(".vt-look")===root) vtLookDraw(b,o); };
  root.querySelectorAll("[data-fin]").forEach(x=>x.onclick=()=>{ const f=FINISHES.find(z=>z.id===x.dataset.fin);
    if(!f) return; if(!vxHas("finish:"+f.id)||S.finish===f.id){ Pulse.buzz(4); return; }
    Pulse.buzz(8); o.pv=null; vtUseFinish(f.id); again(); });
  root.querySelectorAll("[data-vt]").forEach(x=>x.onclick=()=>{ const id=x.dataset.vt; if(!vtOn()) return;
    if(isPro()&&vtFinishNow()===id){ Pulse.buzz(4); return; }   // already worn
    Pulse.buzz(8); try{ track("vault_swatch",{id}); }catch(e){}
    if(isPro()){ o.pv=null; vtPick(id); again(); return; }
    o.pv=o.pv===id?null:id; vtLookDraw(b,o); });
  if($("vtGet")) $("vtGet").onclick=()=>{ Pulse.buzz(10); openPaywall("material",{mat:o.pv}); };
  if($("vtPz")) $("vtPz").onclick=()=>{ Pulse.buzz(6); const v=uiSafe(()=>typeof pzShow==="function"?pzShow():true,true)!==false;
    uiSafe(()=>{ if(typeof pzShow==="function") pzShow(!v); }); again(); };
  if($("vtPzGo")) $("vtPzGo").onclick=()=>{ Pulse.buzz(6); if(typeof evGo==="function") evGo("prestige",{from:"look"}); };
}

/* ---------- include time: the view, the listeners and the two wrappers ---------- */
(()=>{ try{
  if(typeof evView==="function") evView("look",{title:"Your look",render:(b,o)=>vtLookDraw(b,o)});
}catch(e){ console.warn("Ossa: vault.js view",e); } })();
(()=>{ try{
  /* Pro switched on or off: redraw Your look when it's open (the panel sits over everything else) */
  if(typeof vxOn==="function") vxOn("pro",()=>setTimeout(()=>{ try{
    const p=$("evV"); if(p&&p.classList.contains("on")&&typeof evS==="function"&&evS().v==="look"&&typeof evRefresh==="function") evRefresh();
  }catch(e){ console.warn(e); } },0));
}catch(e){ console.warn("Ossa: vault.js hooks",e); } })();
/* a material's rim tint on the live body (the original runs for every earned finish, so a lapsed material
   falls back to Ice by itself: an unknown id is FINISHES[0]) */
(()=>{ try{ const _r=rimColor; rimColor=function(){
  try{ if((vtPreview.id||vtIsId(S.finish))&&typeof bxTokRGB==="function"){ const id=vtFinishNow();
    if(id){ const c=bxTokRGB(vtMat(id).rim), k=window.LIVEK||1; if(c&&c.length===3) return k===1?c:c.map(v=>Math.min(1,v*k)); } } }catch(e){}
  return _r.apply(this,arguments); }; }catch(e){ console.warn("Ossa: vault.js rimColor",e); } })();
/* Pro on or off: the body, its looks and every cached still catch up; then "pro" for anyone listening */
(()=>{ try{ const _p=proChanged; proChanged=function(){ const v=_p.apply(this,arguments);
  try{
    if(S.body&&!document.querySelector(".app.onboarding")) vtRefreshBody();
    vtKick();
    if(typeof rkShots==="function") rkShots.c=null;
    if(typeof densShot==="function") densShot.c=null;
    if(typeof kcShots==="function") kcShots.c=null;
    vtLookShot.c=null; vtShot.c=null;
    if(typeof vxEmit==="function") vxEmit("pro",S.pro);
  }catch(e){ console.warn("Ossa: vault.js proChanged",e); }
  return v; }; }catch(e){ console.warn("Ossa: vault.js proChanged wrap",e); } })();
