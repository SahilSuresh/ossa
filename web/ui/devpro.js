/* =========================================================
   DEVELOPMENT ONLY: Pro without an App Store, so the hard paywall can be passed while testing.
   This file is NEVER in the App Store build. It reaches a page only through:
     - web/.preview.html (the desktop preview), always, and
     - ossaHtml.js when the bundle is built with OSSA_DEV=1 (for Expo Go, which has no App Store).
   Codemagic runs a plain `node scripts/build-html.js`, so the IPA's bundle has no trace of it (23 Oct 2026,
   App Review: payment-bypass code must not be compiled into a store build in any form). Nothing is charged.
   ========================================================= */
(()=>{
  if(typeof proBuy!=="function") return;
  const _buy=proBuy;
  proBuy=async function(plan,where){
    let devHost=false; try{ devHost=/^(localhost|127\.0\.0\.1)$/.test(location.hostname); }catch(e){}
    const expoGo=!!(NATIVE.on&&NATIVE.caps&&NATIVE.caps.expoGo&&!iapLive());
    if((!NATIVE.on&&devHost)||expoGo){
      S.pro={active:true,demo:true,trial:plan==="year",product:plan,at:Date.now()}; save(); proChanged();
      toast(NATIVE.on?"Expo Go has no App Store: Pro is on for testing and nothing was charged.":"Preview only: Pro is on and nothing was charged.");
      return {ok:true};
    }
    return _buy.apply(this,arguments);
  };
})();
