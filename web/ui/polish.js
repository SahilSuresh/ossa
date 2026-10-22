/* =========================================================
   AUDIT FIXES, the JavaScript half (19 Oct). See polish.css for the list.
   - Learn gets the same header as every other tab (the date, then the tab's name), above its sections.
   Function declarations and wrappers only.
   ========================================================= */
(()=>{ const _r=renderExplore; renderExplore=function(){ const v=_r.apply(this,arguments);
  try{ const b=$("tv-explore"); if(b&&!b.querySelector(".pl-head")) b.insertAdjacentHTML("afterbegin",`<header class="u-top pl-head"><div class="u-top-tx"><div class="u-eyebrow">${uiShortDate()}</div><h1 class="u-h1">Learn</h1></div></header>`); }catch(e){ console.warn("Ossa: Learn header",e); }
  return v; }; })();
