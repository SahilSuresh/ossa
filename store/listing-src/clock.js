// Injected before the page's own scripts: the page's clock reads 9:41 today at load (matching the frame's status
// bar) and runs on from there. Only Date is shifted; timers and animation clocks are untouched.
module.exports = `(()=>{ try{
  const RD=Date, now0=RD.now(), t=new RD(now0); t.setHours(9,41,0,0); const off=t.getTime()-now0;
  if(Math.abs(off)>12*3600e3) return;
  const rnow=RD.now.bind(RD);
  class D extends RD { constructor(...a){ if(a.length===0) super(rnow()+off); else super(...a); } static now(){ return rnow()+off; } }
  window.Date=D;
}catch(e){} })();`;
