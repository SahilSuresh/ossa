module.exports = `(()=>{
  const vis=e=>e&&e.offsetParent!==null;
  const tot=TR.session.items.reduce((a,it)=>a+(it.sets||(+String(it.rx||"3").split(/\D/)[0])||3),0);
  const r=document.querySelector("[data-rir='1']"); if(vis(r)){ r.click(); return "eff"; }
  const sk=document.getElementById("skipRest"); if(vis(sk)){ sk.click(); return "skip"; }
  const d=document.getElementById("setDone"); if(vis(d)){ d.click(); return "log "+TR.doneSets.join(","); }
  return "none "+TR.doneSets.join(",")+" view "+TR.view;
})()`;
