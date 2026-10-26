/* PREVIEW ONLY (26 Oct). Included with @include-preview, so it is in web/.preview.html and never in ossaHtml.js
   (the App Store bundle). Desktop-preview switches that touch paid features (skipping the lock screen in
   gate.js, previewing Vault looks with ?look= in look-fx.js) need this flag as well as localhost, so a store
   bundle can't turn them on under any address. */
window.OSSA_PREVIEW = true;
