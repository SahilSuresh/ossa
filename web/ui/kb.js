/* =========================================================
   KEYBOARD INSET: a single global shim for every text input, select and textarea in the app
   (22 Oct, Sahil: "make sure it run everything page layout which required an input and make
   sure they are proper"). On iOS Safari / Expo WebView the on-screen keyboard overlays the
   layout; a plain scrollIntoView() does not help inside a fixed-height panel, sheet or screen.
   This module:
   - sets --kb on <html> from window.visualViewport, with a 'kb-on' class while the keyboard is up
   - scrolls the focused control into view once the keyboard has settled, with a second pass to
     catch iOS firing its viewport resize mid-animation
   The CSS counterpart (loaded by polish.css) uses --kb to pad every scrolling tab container, to
   shift bottom-anchored sheets up, and to shrink fixed-height screens by the keyboard height.
   ========================================================= */
(function(){
  if(typeof window==="undefined"||typeof document==="undefined") return;
  const html=document.documentElement;
  const vv=window.visualViewport||null;
  /* measure the keyboard height from visualViewport; small insets (safe area, nav bar) are ignored */
  const measure=()=>{ if(!vv) return 0; const kb=Math.max(0,window.innerHeight-vv.height-vv.offsetTop); return kb<60?0:kb; };
  const apply=()=>{ const kb=measure(); html.style.setProperty("--kb",kb+"px"); html.classList.toggle("kb-on",kb>0); };
  const bring=el=>{ if(!el||!el.isConnected) return; try{ el.scrollIntoView({block:"center",behavior:"smooth"}); }catch(e){ try{ el.scrollIntoView(); }catch(_){} } };
  const isField=el=>{ if(!el||el.nodeType!==1) return false; const t=el.tagName;
    if(t==="TEXTAREA"||t==="SELECT") return !el.disabled;
    if(t!=="INPUT") return false;
    const kind=String(el.type||"text").toLowerCase();
    return !el.disabled&&!el.readOnly&&!/^(button|submit|reset|checkbox|radio|range|color|file|image|hidden)$/.test(kind);
  };
  const onFocus=e=>{ const el=e.target; if(!isField(el)) return;
    setTimeout(()=>{ apply(); bring(el); },80);
    setTimeout(()=>{ apply(); bring(el); },340);
  };
  const onBlur=e=>{ if(!isField(e.target)) return; setTimeout(apply,120); };
  if(vv){ vv.addEventListener("resize",apply); vv.addEventListener("scroll",apply); }
  document.addEventListener("focusin",onFocus,true);
  document.addEventListener("focusout",onBlur,true);
  apply();
  /* a programmatic lift, for callers that know in advance an input is about to open */
  window.uiKbFocus=function(el){ if(!el) return; setTimeout(()=>{ apply(); bring(el); },80); setTimeout(()=>{ apply(); bring(el); },340); };
  window.uiKbClear=function(){ apply(); };
})();
