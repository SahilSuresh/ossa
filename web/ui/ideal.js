/* =========================================================
   IDEAL SELF (Ossa 2.0, Phase 5 "Evolve") — package "goals". Prefix idl, classes .idl-.
   One job: see the gap to your next overall rank, then train it.
   The view "ideal" lives in core's #evV panel (evolve.js). Its picture is your own body in rank
   colours with every muscle below the target drawn as "your next rank" (render's still-only ghost,
   fx.look.ghost); without WebGL it is the 2D rank figure with the three biggest gaps picked out.

   idlData(o) → {t, T, name, pct, c, at, of:23, gaps:[{k,s,need,n}], top}
     t     overall tier now (0-5)          T     the target score (the next tier's floor; 94 at Unbreakable)
     name  the target's name ("Forged", "Unbreakable III")
     pct   0-100, the same region weighting as overall(): mean over REGION_ORDER of the mean of min(score,T)/T
     c     the colour index for --rk-{c}/--on-rk-{c}: Math.min(t+1,5) (there is no --rk-6)
     at    muscles at or above T           gaps  the muscles below T, biggest gap first
     n     sessions of 3 direct sets to reach T, simulated with vxRP on a copied book (null past 80)
     top   true when every muscle is at 94 or more
   idlData({lite:true}) → {t, T, name, pct, c} only (no simulations): the hub tile.
   idlTile() → {sub, bar, c, dot} for core's hub (pure: no save, no emit).
   Saved state: none (everything is derived). Stills are cached on idlShot.c.
   Start-up rule: function declarations only, state on function properties, include-time code in try.
   ========================================================= */

/* ---------- the data ---------- */
function idlData(o){
  o=o||{};
  const sc=k=>Math.max(0,+((S.scores||{})[k])||0);
  const ov=overall(), t=rankTier(ov);
  const T=t<=4?RANKS[t+1][0]:94, name=t<=4?RANKS[t+1][1]:"Unbreakable III", c=Math.min(t+1,5);
  const pct=Math.round(100*REGION_ORDER.reduce((a,r)=>{ const ms=REGIONS[r].muscles; return a+ms.reduce((x,k)=>x+Math.min(sc(k),T)/T,0)/ms.length; },0)/REGION_ORDER.length);
  if(o.lite) return {t,T,name,pct,c};
  const at=GLORDER.filter(k=>sc(k)>=T).length;
  const gaps=GLORDER.filter(k=>sc(k)<T).map(k=>({k,s:sc(k),need:T-sc(k),n:idlSess(k,T)}))
    .sort((a,b)=>b.need-a.need||a.s-b.s||GLORDER.indexOf(a.k)-GLORDER.indexOf(b.k));
  return {t,T,name,pct,c,at,of:GLORDER.length,gaps,top:GLORDER.every(k=>sc(k)>=94)};
}
/* sessions of 3 direct sets (load 3.6, like dxNext) from k's score to T, on a copy of its score and carry */
function idlSess(k,T){
  const B={scores:{[k]:Math.round(+((S.scores||{})[k])||0)},rpCarry:{[k]:+((S.rpCarry||{})[k])||0}};
  let n=0;
  try{ while(B.scores[k]<T&&n<80){ vxRP({[k]:3.6},[k],true,B); n++; } }catch(e){ console.warn(e); return null; }
  return B.scores[k]>=T?Math.max(1,n):null;
}
/* the hub tile: "71% to Forged" and a bar in the next rank's colour */
function idlTile(){
  const d=idlData({lite:true});
  const top=d.t>=5&&GLORDER.every(k=>(+((S.scores||{})[k])||0)>=94);
  return {sub:top?"Every muscle at the top":`${d.pct}% to ${d.name}`,bar:Math.max(0,Math.min(1,d.pct/100)),c:`var(--rk-${d.c})`,dot:false};
}

/* ---------- the still: your body, the gap muscles as your next rank ---------- */
function idlPx(el){
  try{ if(typeof evPx==="function") return evPx(el); }catch(e){}
  const r=el.getBoundingClientRect(), d=Math.min(window.devicePixelRatio||1,2.5);
  return [Math.round(r.width*d),Math.round(r.height*d)];
}
/* a data URL, or null (no WebGL, or the 3D can't draw right now: the caller shows the 2D figure) */
function idlShot(yaw,d,px){
  if(typeof Body==="undefined"||!Body||Body.kind!=="gl"||typeof Body.shot!=="function") return null;
  const h=Math.max(64,Math.min(1400,px[1]||0)), ghost={};
  d.gaps.forEach(g=>{ ghost[g.k]=d.T; });
  const look=typeof bxLookKey==="function"?uiSafe(()=>bxLookKey(),""):"";
  const key=[yaw?"b":"f",h,d.T,S.body||"",GLORDER.map(k=>Math.round(+((S.scores||{})[k])||0)).join(","),look].join("|");
  const c=idlShot.c||(idlShot.c={});
  if(c[key]) return c[key];
  let url=null;
  try{ url=Body.shot({yaw:yaw?Math.PI:0,rank:true,h,fx:{look:{ghost}}}); }catch(e){ console.warn("Ossa: ideal still",e); url=null; }
  if(!url) return null;   // not cached: the canvas may only be unsized for now
  const ks=Object.keys(c); if(ks.length>=4) delete c[ks[0]];
  c[key]=url; return url;
}
/* draw the picture for the current side into .idl-pic */
function idlPic(pic,d){
  if(!pic) return;
  const yaw=idlRender.yaw?1:0, url=idlShot(yaw,d,idlPx(pic));
  const nm=yaw?"Back":"Front";
  pic.innerHTML=url?`<img src="${url}" alt="" draggable="false">`
    :uiRankFig(yaw?"back":"front",{hl:d.gaps.slice(0,3).map(g=>g.k)});
  pic.setAttribute("aria-label",`${nm} of your body. Muscles below ${d.name} show your next rank`);
}

/* ---------- the view ---------- */
function idlAct(){
  const d=idlData({lite:true}), top=d.t>=5&&GLORDER.every(k=>(+((S.scores||{})[k])||0)>=94);
  return `<span class="idl-chip" data-t="${d.c}" style="--c:var(--rk-${d.c});--on-c:var(--on-rk-${d.c})">${top?"Top rank":`Next: ${uiEsc(d.name)}`}</span>`;
}
function idlSessTxt(n){ return n==null?"a long way":`about ${n} session${n===1?"":"s"}`; }
function idlRender(b){
  const d=idlData();
  /* rows and the button never nudge a flagged sore spot (unless every gap is flagged) */
  const ok=d.gaps.filter(g=>!(typeof rkFlagged==="function"&&rkFlagged(g.k)));
  const list=(ok.length?ok:d.gaps).slice(0,3), big=list[0];
  const row=g=>{ const t=rankTier(g.s), nm=rkSay(g.k);
    return `<button class="idl-row" data-k="${g.k}" aria-label="${uiEsc(nm)}: ${g.need} to ${uiEsc(d.name)}, ${idlSessTxt(g.n)}. Train it">
      <i class="rk-sq" style="--c:var(--rk-${t})" data-t="${t}"></i>
      <span class="idl-rt"><b>${uiEsc(nm)}</b><small>${g.need} to ${uiEsc(d.name)} · ${idlSessTxt(g.n)}</small></span>${UI_IC.chev}</button>`; };
  const yaw=idlRender.yaw?1:0;
  b.innerHTML=`<div class="idl${d.top?" top":""}" style="--c:var(--rk-${d.c})">
    <div class="idl-hero">
      <div class="idl-pic" id="idlPic" role="img"></div>
      <div class="u-seg idl-fb" role="tablist" aria-label="Side">
        <button role="tab" data-yaw="0" class="${yaw?"":"on"}" aria-selected="${!yaw}">Front</button>
        <button role="tab" data-yaw="1" class="${yaw?"on":""}" aria-selected="${!!yaw}">Back</button></div>
      <div class="idl-gauge${d.top||d.pct>=100?" full":""}" role="img" aria-label="${d.top?100:d.pct}% to ${uiEsc(d.name)}"><b class="u-num">${d.top?100:d.pct}%</b><small>${d.top?"Top rank":`to ${uiEsc(d.name)}`}</small></div>
    </div>
    <p class="idl-line">${d.top?"Every muscle at Unbreakable III.":`${d.at} of ${d.of} muscles at ${uiEsc(d.name)}.`}</p>
    ${d.top?"":`<div class="idl-gap"><span class="u-eyebrow">Close the gap</span><div class="idl-rows">${list.map(row).join("")}</div></div>`}
    ${d.top?`<button class="u-btn gold block idl-go" id="idlGo">Prestige</button>`
      :big?`<button class="u-btn primary block idl-go" id="idlGo" data-k="${big.k}">Train ${uiEsc(rkSay(big.k).toLowerCase())}</button>`:""}
  </div>`;
  idlPic($("idlPic"),d);
  b.querySelectorAll("[data-yaw]").forEach(x=>x.onclick=()=>{
    const y=x.dataset.yaw==="1"; if(!!idlRender.yaw===y) return;
    Pulse.buzz(6); idlRender.yaw=y;
    b.querySelectorAll("[data-yaw]").forEach(z=>{ const on=z===x; z.classList.toggle("on",on); z.setAttribute("aria-selected",on); });
    idlPic($("idlPic"),d); });
  const train=k=>{ Pulse.buzz(8); if(typeof evTrain==="function") evTrain(k); else toast("That isn't ready yet."); };
  b.querySelectorAll(".idl-row[data-k]").forEach(x=>x.onclick=()=>train(x.dataset.k));
  const go=$("idlGo");
  if(go) go.onclick=()=>{ if(d.top){ Pulse.buzz(8); if(typeof evGo==="function") evGo("prestige",{}); return; } train(go.dataset.k); };
}

/* ---------- register (core's evView is a hoisted declaration in evolve.js) ---------- */
(()=>{ try{
  if(typeof evView==="function") evView("ideal",{title:"Ideal self",act:idlAct,render:idlRender});
}catch(e){ console.warn("Ossa: ideal.js",e); } })();
