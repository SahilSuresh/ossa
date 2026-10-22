/* =========================================================
   WIDGETS IN RANK COLOURS, the page side (Ossa 2.0, Build 9)
   The home-screen and lock-screen widgets carry the streak screen's promo: the streak, the weak link,
   your body in rank colours, your overall rank and today's session. Body Score stays in the app.
   - figRankSvg(h,o)     the 2D rank body, front and back side by side, in plain SVG attributes, so Android's
                         widget draws it as it is and figPng can turn it into the iPhone widget's picture.
                         Colours are read from tokens.css at runtime (wgTok), never written here.
   - wgStreakAhead(k)    the streak Ossa would show k days from now if nothing more is logged
                         (uiStreak's rules: today never breaks it, planned rest days carry it)
   - widgetSnap          wrapped: snapshot v3 (below). nativeSync sends it unchanged: a PNG to iPhone, the SVG to Android.
   - widgetHTML          reassigned: the Settings preview (and the Android widget picker pictures come from it)
   - ossa://ranks, ossa://streak   widget taps (vxRoute)
   - a flush when the page is hidden, so a workout you just finished reaches the widget before iOS pauses the page
   Snapshot v3 = the v2 fields (day, score, d, dTxt, head, tail, hs, week[{d,k,t,s}], name) plus
     fig (the rank body SVG, replacing the old figSvg), figV ('front'|'back': the weak link's side, for the small widget),
     week[].sk (each day's streak from wgStreakAhead), sk (today's), skToday (kept today), weakK, weak ("Shins need you"),
     rk ("Strong I"), rkT (tier 0-5), rkCol (the rank's hex from tokens; --text-2 below Stable).
   The native side (native/widget-shared.js say()) reads v3 only; anything older shows "Open Ossa to update".
   The native side is native/widget-shared.js, OssaWidget.ios.js (iPhone) and widget.android.js (Android).
   Rules: function declarations only, no top-level const or let; state on function properties;
   widgetSnap and widgetHTML are wrapped or reassigned inside the IIFE at the bottom, never redeclared.
   ========================================================= */

/* a token's value, read from tokens.css (cached once it has one) */
function wgTok(n){
  const c=wgTok.c||(wgTok.c={}); if(c[n]) return c[n];
  let v=""; try{ v=getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }catch(e){}
  if(v) c[n]=v;
  return v;
}

/* the 2D rank body for the widgets: front and back side by side (viewBox 38 4 262 396, as figSvg),
   built like uiRankFig in ranks.js: a dark silhouette, each part in its rank colour, a fading part see-through,
   Fragile outlined, the weak link edged in lime (drawn last so nothing covers its edge). */
function figRankSvg(h,o){
  o=o||{}; const T=wgTok, hl=o.hl||[], sil=T("--surface-3"), gap=T("--bg"), frag=T("--line-3"), edge=T("--line-2"), lime=T("--glow");
  const part=(v,p)=>{ const ks=FIGPARTS[v][p], t=rankTier(rkAvg(ks)), on=ks.some(k=>hl.includes(k)), f=ks.reduce((a,k)=>a+rkFadeShown(k),0)/ks.length;
    return {on,svg:`<path d="${SP[p]}" fill="${T("--rk-"+t)}"${f>0.01?` fill-opacity="${(1-0.55*f).toFixed(2)}"`:""} stroke="${on?lime:t===1?frag:gap}" stroke-width="${on?2.4:1.2}" stroke-linejoin="round"/>`}; };
  const half=(v,m)=>{ const ps=SVGMAP[v].map(([p])=>part(v,p)), body=ps.filter(x=>!x.on).concat(ps.filter(x=>x.on)).map(x=>x.svg).join("");
    return `<g${m?' transform="translate(200 0) scale(-1 1)"':""}><path d="${OUT}" fill="${sil}"/>${m?"":`<path d="M92.5,47 L107.5,47 L100,205 Z" fill="${sil}"/>`}${body}<path d="${OUT}" fill="none" stroke="${edge}" stroke-width="1.4" stroke-linecap="round"/></g>`; };
  h=h||240; const w=Math.round(h*262/396);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="38 4 262 396">${["front","back"].map((v,i)=>`<g transform="translate(${i*138} 0)">${half(v,false)}${half(v,true)}</g>`).join("")}</svg>`;
}
/* one side of that picture (the small widget shows the weak link's side): only the viewBox changes.
   native/widget-shared.js figHalf does the same for Android. */
function wgHalf(svg,side){
  return String(svg||"").replace('viewBox="38 4 262 396"',`viewBox="${side==="back"?176:38} 4 124 396"`)
    .replace(/ width="\d+" height="(\d+)"/,(m,h)=>` width="${Math.round(h*124/396)}" height="${h}"`);
}

/* the streak on day k (0 = today) if nothing more is logged: uiStreak's loop, started k days ahead.
   Days between now and then that aren't planned rest days break it, so the widget stays honest after midnight. */
function wgStreakAhead(k,T,R){
  k=k||0; T=T||uiTrainedDays(); R=R||[0,1,2,3,4,5,6].map(uiRestDay);
  let n=0, pend=0;
  for(let i=0;i<400;i++){
    const d=dkey(i-k), wd=((todayIdx+k-i)%7+7)%7;
    if(T.has(d)){ n+=1+pend; pend=0; continue; }
    if(!i) continue;                                  // that day isn't over
    if(R[wd]){ pend++; continue; }                    // a planned rest day keeps it going
    break;
  }
  return n;
}

/* adds the v3 fields to a v2 snapshot. Everything is worked out first, so a failure leaves a clean v2. */
function wgV3(w){
  const weak=rkWeak(), o=overall(), t=rankTier(o), st=uiStreak(), T=uiTrainedDays(), R=[0,1,2,3,4,5,6].map(uiRestDay);
  const sks=w.week.map((x,k)=>wgStreakAhead(k,T,R)), fig=figRankSvg(264,{hl:[weak]});
  const add={fig,figV:rkWeakView(weak),sk:sks[0],skToday:!!st.today,weakK:weak,weak:rkNeeds(weak),rk:rankOf(o),rkT:t,rkCol:wgTok(t>=2?"--rk-"+t:"--text-2")};
  Object.assign(w,add); w.week.forEach((x,k)=>{ x.sk=sks[k]; }); w.v=3;
  return w;
}

/* what a widget says on day k of the snapshot. native/widget-shared.js say() is the same on the phone. */
function wgSay(w,k){
  const x=w.week[k||0]||w.week[0]||{}, n=x.sk||0, kept=!k&&!!w.skToday;
  return {n, unit:n===1?"day":"days",
    note:kept?"Kept today":x.k==="rest"?(n?"Rest day: it won't break":"Rest day"):n?"Train today to keep it":"Train today to start one",
    pill:x.k==="done"?"Done":"Today", go:x.k!=="rest", today:(x.k==="done"?x.t:x.s||x.t)||""};   // the short form: the pill is narrow
}

/* the Settings preview, drawn like the native widgets (system font there, Inter here) */
function wgPreviewHTML(w,small){
  const s=wgSay(w,0), fl=`<span class="wg3-fl">${typeof UI_FLAME==="string"?UI_FLAME:""}</span>`, bare=x=>String(x||"").replace(/ width="\d+" height="\d+"/,"");
  if(small){
    const label=`Small widget preview: ${s.n} ${s.unit} streak. ${w.weak}.`;
    return `<div class="wg3 sm" role="img" aria-label="${uiEsc(label)}"><div class="wg3-l">${fl}<b class="u-num wg3-n">${s.n}</b><span class="wg3-u">${s.unit}</span>
      <em class="wg3-weak">${uiEsc(w.weak).replace(/ (needs?) you$/,"<br>$1 you")}</em></div><div class="wg3-fig one">${bare(wgHalf(w.fig,w.figV))}</div></div>`;
  }
  const rkc=w.rkT>=2?`--rk-${w.rkT}`:"--text-2";
  const label=`Widget preview: ${s.n} ${s.unit} streak. ${s.note}. ${w.weak}. Overall ${w.rk}. ${s.pill}: ${s.today}.`;
  return `<div class="wg3" role="img" aria-label="${uiEsc(label)}"><div class="wg3-l">
    <div class="wg3-top">${fl}<b class="u-num wg3-n">${s.n}</b><span class="wg3-st"><span class="wg3-u">${s.unit}</span><span class="wg3-note">${uiEsc(s.note)}</span></span></div>
    <div class="wg3-weak">${uiEsc(w.weak)}</div>
    <div class="wg3-rk"><span>Overall</span><b style="--c:var(${rkc})">${uiEsc(w.rk)}</b></div>
    ${s.today?`<div class="wg3-pill"><i${s.go?' class="go"':""}></i><small>${s.pill}</small><span>${uiEsc(s.today)}</span></div>`:""}</div>
    <div class="wg3-fig">${bare(w.fig)}</div></div>`;
}

/* the page is going away (app to the background, phone locked): send the widget what it has now */
function wgFlush(){
  try{
    if(!document.hidden||typeof NATIVE==="undefined"||!NATIVE.on) return;
    clearTimeout(NATIVE.t); nativeSync(false);   // nativeSync sends only what changed
  }catch(e){ console.warn(e); }
}

/* ---------- wrappers and routes (run once, at include time) ---------- */
(function(){
  const _snap=widgetSnap;
  widgetSnap=function(){ const w=_snap.apply(this,arguments); try{ wgV3(w); }catch(e){ console.warn("Ossa widget v3",e); } return w; };
  const _html=widgetHTML;
  widgetHTML=function(w,small){
    w=w||widgetSnap();
    if(!w||w.v!==3) return _html.call(this,w,small);
    try{ return wgPreviewHTML(w,small); }catch(e){ console.warn(e); return ""; }
  };
  try{
    vxRoute("ranks",()=>{ openRanks(); try{ if(typeof uiPanelFront==="function") uiPanelFront($("ranksP")); }catch(e){} });
    vxRoute("streak",()=>{ openStreak(false); });
  }catch(e){ console.warn(e); }
  try{ document.addEventListener("visibilitychange",wgFlush); }catch(e){}
})();
