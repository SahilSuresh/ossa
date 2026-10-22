/* =========================================================
   YOUR LOOK: the body and a swatch rail (20 Oct, Andrej picked option B: "I love the idea of B, implement it").
   Prefix lk*. Redefines vtLookDraw (vault.js registers the "look" view and calls it by name).
   - The body big, as a still in the look you're trying (Body.shot), its name and how to get it over the bottom.
   - Three groups as chips: Glow (the four finishes), Skin (your session Bones, Bone to your rank, then the Vault's
     Obsidian, Chrome and Carbon fibre with Ossa Pro), Prestige (the prestige materials switch).
   - Tap a swatch: the body changes at once (a preview, nothing saved). Wear saves it. Locked ones say what opens them.
   Data: a glow is S.finish (a finish id); a Vault skin is S.finish too (vtPick), so wearing one takes the other off;
   Bones are S.bones.wear (an index up to your overall rank; null = your current rank).
   ========================================================= */
function lkUi(){ return lkUi.s||(lkUi.s={cat:"glow",sel:null}); }
/* every swatch: {k (key), cat, name, c (css swatch), got, how (when locked), on (worn now), kind, id} */
function lkItems(){
  const out=[], worn=typeof vtFinishNow==="function"?vtFinishNow():null, pro=typeof isPro==="function"&&isPro();
  let fcur=null; try{ fcur=vtFinCur().id; }catch(e){}
  FINISHES.forEach(f=>{ const got=vxHas("finish:"+f.id);
    out.push({k:"g:"+f.id,cat:"glow",kind:"fin",id:f.id,name:f.name,c:`var(--fin-${f.id})`,got,how:`At level ${f.lv}`,on:!worn&&fcur===f.id}); });
  try{ const B=boS(), M=boMats(), R=luRanks(), cur=boMatNow();
    M.forEach((m,i)=>out.push({k:"b:"+i,cat:"skin",kind:"bone",id:i,name:m[0],c:`linear-gradient(160deg,var(--mt-${m[1]}1),var(--mt-${m[1]}2))`,got:i<=B.seen,how:`${R[i][0]}-rank in sessions`,on:!worn&&cur===i})); }catch(e){}
  if(typeof vtMats==="function"&&vtOn()) vtMats().forEach(m=>out.push({k:"v:"+m.id,cat:"skin",kind:"vault",id:m.id,name:m.name,c:`var(${m.tok})`,got:pro,how:"Ossa Pro",on:worn===m.id}));
  return out;
}
function lkCur(){ const I=lkItems(), u=lkUi(); let s=I.find(x=>x.k===u.sel); if(!s) s=I.find(x=>x.cat===u.cat&&x.on)||I.find(x=>x.cat===u.cat)||I[0]; return s; }
/* a still of the whole body wearing item s (the live body sits behind the panel) */
function lkShot(el,s){
  if(typeof vtCanShoot!=="function"||!vtCanShoot()) return null;
  const sz=vtPx(el); if(!sz) return null;
  const c=lkShot.c||(lkShot.c={}); const key=[s.k,sz[0],sz[1],S.finish||"",(S.bones&&S.bones.wear)??"",vtSig()].join("|");
  if(c[key]) return c[key];
  const sh=boShow(), m0=sh.mat, f0=sh.fin, fin0=S.finish; let u=null, fx={};
  try{
    if(s.kind==="fin"){ sh.fin=s.id; S.finish=s.id; fx={look:{fin:null}}; }
    else if(s.kind==="bone"){ sh.mat=s.id; fx={look:{fin:null}}; }
    else if(s.kind==="vault"){ fx={look:{fin:s.id}}; }
    u=Body.shot({at:[0,0.9,0],span:1.94,yaw:0.35,size:sz,fx});
  }catch(e){ console.warn("Ossa: look still",e); }
  sh.mat=m0; sh.fin=f0; S.finish=fin0;
  if(u){ if(Object.keys(c).length>24) lkShot.c={}; (lkShot.c||c)[key]=u; }
  return u;
}
function vtLookDraw(b,o){
  o=o||{}; const u=lkUi(), I=lkItems(), s=lkCur(); if(u.cat!=="prestige") u.cat=s.cat;
  let N=0, show=true; try{ N=(pzEarned()||[]).reduce((a,x)=>a+((x&&x.mats)||[]).length,0); show=pzShow()!==false; }catch(e){}
  const list=I.filter(x=>x.cat===u.cat), act=s.on?{t:"Wearing",dis:true}:!s.got?(s.kind==="vault"?{t:"Get Ossa Pro",pro:true}:{t:`🔒 ${s.how}`,dis:true}):{t:`Wear ${s.name}`};
  const cats=[["glow","Glow"],["skin","Skin"],["prestige","Prestige"]];
  b.innerHTML=`<div class="lk">
    <div class="lk-stage" id="lkStage"><span class="lk-nm">${u.cat==="prestige"?`<small>Prestige · ${N?`${N} earned`:"none yet"}</small><b>${N&&show?"On your body":"Your look"}</b>`:`<small>${u.cat==="glow"?"Glow":"Skin"} · ${s.on?"Wearing":s.got?"Tap Wear to keep it":uiEsc(s.how)}</small><b>${uiEsc(s.name)}</b>`}</span></div>
    <div class="lk-cats" role="tablist">${cats.map(([k,n])=>`<button class="${k===u.cat?"on":""}" data-cat="${k}" role="tab" aria-selected="${k===u.cat}">${n}</button>`).join("")}</div>
    ${u.cat==="prestige"
      ?`<div class="lk-pz">${N?`<button class="lk-pzr" id="lkPz" role="switch" aria-checked="${show}"><span><b>Prestige materials</b><small>${N} earned · marble, silver and gold on the muscles you prestiged</small></span><span class="vt-tg${show?" on":""}" aria-hidden="true"><i></i></span></button>`
        :`<button class="lk-pzr" id="lkPzGo"><span><b>Prestige materials</b><small>Prestige a muscle to earn marble, silver and gold for it</small></span><span aria-hidden="true">›</span></button>`}</div>`
      :`<div class="lk-rail" role="listbox" aria-label="${u.cat==="glow"?"Glows":"Skins"}">${list.map(x=>`<button class="lk-sw${x.k===s.k?" on":""}${x.kind==="vault"&&x.id===(vtMats()[0]||{}).id?" lk-v":""}${x.got?"":" lk-lk"}${x.on?" worn":""}" data-k="${x.k}" role="option" aria-selected="${x.k===s.k}" aria-label="${uiEsc(x.name)}${x.on?", wearing":x.got?"":", locked: "+uiEsc(x.how)}">${x.kind==="vault"?`<i class="vt-mi" data-m="${x.id}"></i>`:`<i style="--c:${x.c}"></i>`}<small>${uiEsc(x.name.length>9?x.name.slice(0,3)+"…":x.name.split(" ")[0])}</small></button>`).join("")}</div>`}
    ${u.cat==="prestige"?"":`<button class="lk-go${act.dis?" off":""}" id="lkGo"${act.dis?" aria-disabled=\"true\"":""}>${act.t}</button>`}
  </div>`;
  const st=$("lkStage"), url=lkShot(st,u.cat==="prestige"?(I.find(x=>x.on)||s):s);
  st.insertAdjacentHTML("afterbegin",url?`<img class="lk-img" src="${url}" alt="Your body in ${uiEsc(s.name)}" draggable="false">`:`<div class="vt-fig">${uiSafe(()=>uiRankFig("front",{}),"")}</div>`);
  const again=()=>{ if(b.isConnected) vtLookDraw(b,o); };
  b.querySelectorAll("[data-cat]").forEach(x=>x.onclick=()=>{ Pulse.buzz(5); u.cat=x.dataset.cat; u.sel=null; again(); });
  b.querySelectorAll("[data-k]").forEach(x=>x.onclick=()=>{ Pulse.buzz(6); u.sel=x.dataset.k; try{ track("look_try",{k:u.sel}); }catch(e){} again(); });
  const go=$("lkGo"); if(go) go.onclick=()=>{ const c=lkCur(); if(c.on||(!c.got&&c.kind!=="vault")){ Pulse.buzz(4); return; }
    if(c.kind==="vault"){ if(!isPro()){ Pulse.buzz(10); openPaywall("material",{mat:c.id}); return; } Pulse.buzz([10,40,14]); vtPick(c.id); }
    else if(c.kind==="fin"){ Pulse.buzz([10,40,14]); if(typeof vtIsId==="function"&&vtIsId(S.finish)){ S.finish=c.id; save(); } vtUseFinish(c.id); }
    else if(c.kind==="bone"){ Pulse.buzz([10,40,14]); const B=boS(); B.wear=c.id===B.seen?null:c.id; if(typeof vtIsId==="function"&&vtIsId(S.finish)){ S.finish="ice"; } save(); try{ Body.fxKick(); vtKick(); }catch(e){} toast(`${c.name} bones on`); }
    try{ track("look_wear",{k:c.k}); }catch(e){}
    lkShot.c={}; u.sel=null; again(); };
  if($("lkPz")) $("lkPz").onclick=()=>{ Pulse.buzz(6); try{ pzShow(!(pzShow()!==false)); }catch(e){} again(); };
  if($("lkPzGo")) $("lkPzGo").onclick=()=>{ Pulse.buzz(6); if(typeof evGo==="function") evGo("prestige",{from:"look"}); };
}
