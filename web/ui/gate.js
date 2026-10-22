/* =========================================================
   THE HARD PAYWALL (Andrej, 18 Oct): Ossa has no free tier. The intro ends on the subscription screen, with
   no "Not now"; a free week or a subscription is the only way in. Afterwards, whenever Pro is off (a lapsed
   subscription, a restore on a new phone, the sandbox status arriving late), the app is covered by one lock
   screen until Pro is on again. The lock keeps the Body page's chrome underneath but takes every tap.
   Prefix gt*. Start-up rule: function declarations only, state on function properties.
   - gtLocked()      true when the intro is done (S.body) and Pro is off. The browser preview counts as unlocked
                     until the first paywall shows, so the desktop checks keep working; ?lock=1 forces the lock.
   - gtShow()/gtHide() the lock screen (#gtLock): "Your plan is waiting." · what Pro is · the paywall sheet
                     (pwMount, same prices and terms as the intro) · Restore · Terms · Privacy.
   - Hooks: proChanged (hide on Pro, show on lapse), the "pro" native message, boot, finishOnboarding.
   Nothing in here saves anything but S.pro, which proIn owns.
   ========================================================= */
function gtS(){ return gtS.s||(gtS.s={on:false,m:null,pre:false}); }
function gtPreview(){ try{ return !NATIVE.on&&/^(localhost|127\.0\.0\.1)$/.test(location.hostname); }catch(e){ return false; } }
function gtForced(){ try{ return /[?&]lock=1\b/.test(location.search); }catch(e){ return false; } }
function gtLocked(){
  try{
    if(!S.body) return false;                                   // the intro has its own paywall at the end
    if(typeof isPro==="function"&&isPro()) return false;
    if(gtPreview()&&!gtForced()) return false;                  // desktop preview: free to look around
    if(document.querySelector(".app.onboarding")) return false;  // the intro is on screen
    return true;
  }catch(e){ return false; }
}
function gtShow(){
  const st=gtS(); if(st.on&&$("gtLock")) return;
  st.on=true; const app=$("app"); if(!app) return;
  let el=$("gtLock");
  if(!el){ el=document.createElement("section"); el.id="gtLock"; el.className="gt-lock"; el.setAttribute("role","dialog"); el.setAttribute("aria-label","Ossa Pro"); app.appendChild(el); }
  el.innerHTML=`<div class="gt-in"><div class="pw pw2 gt-pw" id="gtPw" role="document"></div></div>`;
  app.classList.add("gt-on");
  const pw=$("gtPw");
  const lapsed=!!(S.pro&&S.pro.at&&!S.pro.active);
  const prev=S.program&&S.program.week?S.program.week.map((d,i)=>({d:["M","T","W","T","F","S","S"][i],t:d?d.title:"Rest",on:!!d})):[];
  try{ track("paywall_view",{where:"lock"}); }catch(e){}
  st.m=pwMount(pw,{where:"lock",eye:"Ossa Pro",head:lapsed?"Your subscription has ended.":"Your plan is waiting.",
    preview:prev,days:S.program&&S.program.a&&S.program.a.days,
    done:()=>{ gtHide(); setTimeout(()=>toast(S.pro&&S.pro.trial?"Your free week has started. Welcome back.":"Welcome back to Ossa Pro."),500); }});
  requestAnimationFrame(()=>el.classList.add("on"));
}
function gtHide(){
  const st=gtS(); st.on=false; st.m=null;
  const el=$("gtLock"), app=$("app"); if(app) app.classList.remove("gt-on");
  if(el){ el.classList.remove("on"); setTimeout(()=>{ if(!gtS().on&&el.isConnected) el.remove(); },reduced?0:350); }
}
/* the one check: called after boot, after the intro, and whenever Pro changes or the phone reports it */
function gtCheck(){ try{ if(gtLocked()) gtShow(); else if(gtS().on) gtHide(); }catch(e){ console.warn("Ossa: gate",e); } }
(()=>{ try{
  const _pc=proChanged; proChanged=function(){ const r=_pc.apply(this,arguments); gtCheck(); return r; };
  const _fo=finishOnboarding; finishOnboarding=function(){ const r=_fo.apply(this,arguments); setTimeout(gtCheck,0); return r; };
  /* "pro" from the phone with active:false (status arrives a moment after launch, or a lapse while the app was closed) */
  if(typeof vxOn==="function") vxOn("native",m=>{ if(m&&m.t==="pro") setTimeout(gtCheck,0); });
  /* boot: once the page has drawn (the Pro status from the phone follows within a second or so; the lock shows at
     once and hides again when "pro" says active, so a subscriber sees it only for a blink, if at all) */
  setTimeout(()=>{ try{ if(S.body&&!document.querySelector(".app.onboarding")) gtCheck(); }catch(e){} },NATIVE&&NATIVE.on?1600:50);
}catch(e){ console.warn("Ossa: gate hooks",e); } })();
