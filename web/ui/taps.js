/* =========================================================
   BUTTON SOUNDS (21 Oct): a sound on every tap after the intro (the intro keeps its own knocks and flourishes),
   in a style you pick, like the music.
   - One capture listener on click: a real tap (isTrusted), which is also what iOS lets sound start from.
     Scripted clicks (the smoke test, b.click()) stay silent.
   - Through the shared context and its limiter (ossAudio in web/ossa.html), like the dial clicks.
   - Six styles (tapStyles); each has a light version and a deeper one for the main buttons (tapKind → "cta").
   - Settings › Button sounds opens the picker (#tapP, beside the Music panel): tap a style to hear it and keep it,
     or Off. S.tapStyle is the style, S.tapSound === false is off. Music has its own switch.
   Function declarations, one listener and one wrapper (closePanels) only.
   ========================================================= */
/* [id, name, line, group]; the picker shows them under tapGroups, like the music's categories */
function tapStyles(){ return [
  ["tick","Tick","Soft and quiet","soft"],
  ["wood","Wood","A muted marimba knock","soft"],
  ["pop","Pop","A round bubble pop","soft"],
  ["key","Key","A crisp keyboard click","soft"],
  ["dial","Dial","The safe-dial click from turning your body","ossa"],
  ["stone","Stone","The intro's stone knock, softer","ossa"],
  ["pulse","Pulse","A soft heartbeat, lub-dub","ossa"],
  ["forge","Forge","A small anvil ring, for forged bones","ossa"],
  ["glass","Glass","A small, bright ping","glow"],
  ["aura","Aura","A shimmer, like your aura","glow"],
  ["neon","Neon","A short synth blip","glow"],
  ["melody","Melody","A new note each tap, in the intro's key","glow"]]; }
function tapGroups(){ return [["soft","Soft","Quiet, for every day"],["ossa","From Ossa","The body, the bones and the dial"],["glow","Glow","Bright and musical"]]; }
function tapSoundOn(){ return typeof S!=="undefined"&&S.tapSound!==false; }
function tapStyle(){ const s=typeof S!=="undefined"&&S.tapStyle; return tapStyles().some(x=>x[0]===s)?s:"tick"; }
function tapLabel(){ return tapSoundOn()?tapStyles().find(x=>x[0]===tapStyle())[1]:"Off"; }

/* noise that dies away (pow sets how fast), one buffer per length, shape and sample rate */
function tapNoise(A,sec,pow){
  const C=tapNoise.c||(tapNoise.c={}), k=sec+"|"+pow+"|"+A.sampleRate; if(C[k]) return C[k];
  const n=Math.max(1,Math.floor(A.sampleRate*sec)), b=A.createBuffer(1,n,A.sampleRate), d=b.getChannelData(0), at=Math.max(1,Math.floor(A.sampleRate*0.0015));
  for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,pow)*Math.min(1,i/at);
  return C[k]=b;
}
function tapHit(A,out,t,buf,type,freq,q,gain,rate){
  const s=A.createBufferSource(), f=A.createBiquadFilter(), g=A.createGain(); s.buffer=buf; if(rate) s.playbackRate.value=rate;
  f.type=type; f.frequency.value=freq; f.Q.value=q; g.gain.value=gain; s.connect(f); f.connect(g); g.connect(out); s.start(t); ossAudioDone(s,f,g);
}
function tapTone(A,out,t,type,f0,f1,peak,dec,glide){
  const o=A.createOscillator(), g=A.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); if(f1&&f1!==f0) o.frequency.exponentialRampToValueAtTime(f1,t+(glide||dec*0.6));
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+0.003); g.gain.exponentialRampToValueAtTime(0.0001,t+dec);
  o.connect(g); g.connect(out); o.start(t); o.stop(t+dec+0.02); ossAudioDone(o,g);
}
/* the styles: A the context, out the effects bus, t when, big the deeper version for main buttons */
function tapPlay(style,A,out,t,big){
  const j=0.97+Math.random()*0.06;   // a little variation, so a run of taps isn't a machine gun
  if(style==="wood"){ const f=(big?392:587)*j;
    tapTone(A,out,t,"sine",f,f,big?0.11:0.08,big?0.26:0.18);
    tapTone(A,out,t,"sine",f*3.93,f*3.93,big?0.02:0.015,0.05);
    tapHit(A,out,t,tapNoise(A,0.012,6),"bandpass",f*2,1.5,0.03); return; }
  if(style==="glass"){ const f=(big?1318.5:1568)*j;
    tapTone(A,out,t,"sine",f,f,big?0.045:0.035,big?0.45:0.32);
    tapTone(A,out,t,"sine",f*2.76,f*2.76,0.008,0.14);
    if(big) tapTone(A,out,t+0.06,"sine",f*1.5,f*1.5,0.022,0.4); return; }
  if(style==="pop"){
    tapTone(A,out,t,"sine",(big?520:780)*j,big?150:210,big?0.13:0.1,big?0.11:0.08,big?0.07:0.05); return; }
  if(style==="stone"){ const sz=big?0.55:0.3;
    tapHit(A,out,t,tapNoise(A,0.09,3),"lowpass",1100-600*sz,0.7,(0.14+0.2*sz)*0.7,0.92+Math.random()*0.16);
    tapTone(A,out,t,"sine",120-50*sz,42,(0.18*sz+0.04)*0.7,0.15,0.13); return; }
  if(style==="dial"){   /* the body dial's click (dialTick in web/ossa.html), a touch louder */
    tapHit(A,out,t,tapNoise(A,0.02,6),"bandpass",(big?2100:3400)*j,big?5:8,big?0.08:0.05); return; }
  if(style==="pulse"){   /* lub (and dub on the main buttons); a triangle so a phone speaker can carry it */
    tapTone(A,out,t,"triangle",110*j,58,big?0.16:0.12,0.14,0.08);
    if(big) tapTone(A,out,t+0.17,"triangle",98*j,55,0.09,0.12,0.07); return; }
  if(style==="forge"){   /* an anvil: inharmonic partials that ring and fade, over a bright strike */
    const f=(big?587:880)*j;
    [[1,0.05,0.35],[2.76,0.025,0.2],[5.4,0.012,0.12],[8.93,0.006,0.08]].forEach(([m,g,d])=>tapTone(A,out,t,"sine",f*m,f*m,g*(big?1.3:1),d*(big?1.4:1)));
    tapHit(A,out,t,tapNoise(A,0.01,10),"highpass",4000,0.7,0.03); return; }
  if(style==="aura"){   /* three high notes, a breath apart, with a little air */
    const b=big?1046.5:2093;
    [1,1.26,1.5].forEach((m,i)=>tapTone(A,out,t+i*0.016,"sine",b*m*j,b*m*j,big?0.018:0.013,big?0.5:0.3));
    tapHit(A,out,t,tapNoise(A,0.04,4),"highpass",6500,0.5,0.025); return; }
  if(style==="neon"){   /* a filtered square that chirps up; the main buttons get a second blip a fifth higher */
    const blip=(at,f0)=>{ const o=A.createOscillator(), lp=A.createBiquadFilter(), g=A.createGain(); o.type="square";
      o.frequency.setValueAtTime(f0,at); o.frequency.exponentialRampToValueAtTime(f0*1.5,at+0.02); lp.type="lowpass"; lp.frequency.value=2800;
      g.gain.setValueAtTime(0.0001,at); g.gain.exponentialRampToValueAtTime(0.022,at+0.003); g.gain.exponentialRampToValueAtTime(0.0001,at+0.07);
      o.connect(lp); lp.connect(g); g.connect(out); o.start(at); o.stop(at+0.09); ossAudioDone(o,lp,g); };
    blip(t,(big?440:880)*j); if(big) blip(t+0.06,660*j); return; }
  if(style==="melody"){   /* D major pentatonic (the intro's luminous score is in D): never the same note twice running */
    const sc=[74,76,78,81,83,86], last=tapPlay.note; let n; do{ n=sc[Math.floor(Math.random()*sc.length)]; }while(n===last&&sc.length>1); tapPlay.note=n;
    const f=440*Math.pow(2,((big?n-12:n)-69)/12);
    tapTone(A,out,t,"sine",f,f,0.045,big?0.6:0.4); tapTone(A,out,t,"triangle",f*2,f*2,0.008,0.12);
    if(big) tapTone(A,out,t+0.07,"sine",f*1.5,f*1.5,0.03,0.5); return; }
  if(style==="key"){
    tapHit(A,out,t,tapNoise(A,0.012,10),"highpass",2600*j,0.8,big?0.11:0.08);
    tapHit(A,out,t+0.028,tapNoise(A,0.01,10),"highpass",3400*j,0.8,big?0.05:0.035);
    if(big) tapTone(A,out,t,"sine",190,120,0.05,0.04); return; }
  /* tick: a 30 ms band-passed click and a short falling sine under it */
  tapHit(A,out,t,tapNoise(A,0.03,8),"bandpass",(big?1300:2300)*j,big?3:5,big?0.07:0.045);
  tapTone(A,out,t,"sine",big?520:880,big?300:620,big?0.07:0.035,big?0.12:0.07,0.06);
}
/* kind "cta" is the deeper one; style defaults to the one picked; force plays even when off (the picker's preview) */
function tapSound(kind,style,force){
  if((!force&&!tapSoundOn())||typeof ossAudio!=="function") return;
  const now=performance.now(); if(!force&&now-(tapSound.at||0)<45) return; tapSound.at=now;
  try{ const A=ossAudio(), out=A&&ossAudio.fx(); if(!A||!out) return;
    tapPlay(style||tapStyle(),A,out,A.currentTime+0.004,kind==="cta"); }catch(e){}
}
/* what counts as a button, and which ones are the main ones */
function tapTarget(t){
  const el=t&&t.closest&&t.closest('button,a[href],[role="button"],[role="tab"],[data-tab],label,summary,input[type="checkbox"],input[type="radio"]');
  if(!el||el.disabled||el.getAttribute("aria-disabled")==="true") return null;
  if(el.closest("#tapP [data-tap]")) return null;   // the picker's rows play their own preview
  return el;
}
function tapKind(el){ return el.matches('.primary,.lu-go,.dk-go,.u-cta,[class*="-cta"]')?"cta":""; }
document.addEventListener("click",e=>{
  if(!e.isTrusted||!tapSoundOn()) return;
  if(document.querySelector(".app.onboarding")) return;   // the intro has its own sounds
  const el=tapTarget(e.target); if(el) tapSound(tapKind(el));
},true);

/* ---------- the picker (Settings › Button sounds), laid out like the Music panel ---------- */
function tapPick(){ const p=$("tapP"); if(!p) return; tapDraw(); p.classList.add("on"); }
function tapDraw(){
  const b=$("tapBody"); if(!b) return;
  const cur=tapSoundOn()?tapStyle():"off";
  const SPK=`<svg viewBox="0 0 12 12"><path d="M2 4.5h2L6.5 2.5v7L4 7.5H2z"/><path d="M8.3 4.3a2.4 2.4 0 0 1 0 3.4"/></svg>`;
  const ON=`<svg viewBox="0 0 12 12"><path d="M2.5 6.2l2.3 2.3 4.7-5"/></svg>`, MUTE=`<svg viewBox="0 0 12 12"><path d="M2 4.5h2L6.5 2.5v7L4 7.5H2z"/><path d="M8.2 4.6l2.6 2.8M10.8 4.6l-2.6 2.8"/></svg>`;
  const row=([id,n,d])=>`<button class="trk${id===cur?" cur":""}" data-tap="${id}" aria-pressed="${id===cur}">
      <span class="ti">${id===cur?ON:id==="off"?MUTE:SPK}</span><span class="tn"><b>${n}</b><small>${d}</small></span></button>`;
  b.innerHTML=`<p class="sc-note">Tap one to hear it. It plays when you tap a button; the main buttons get a deeper version. Music has its own switch.</p>
    ${tapGroups().map(([g,gn,gs])=>`<div class="grp mcat"><h4>${gn}<span>${gs}</span></h4>${tapStyles().filter(x=>x[3]===g).map(row).join("")}</div>`).join("")}
    <div class="grp mcat">${row(["off","Off","No sound when you tap"])}</div>`;
  b.querySelectorAll("[data-tap]").forEach(x=>x.onclick=()=>{ const id=x.dataset.tap;
    if(id==="off") S.tapSound=false; else { S.tapSound=true; S.tapStyle=id; }
    save(); Pulse.buzz(6); if(id!=="off") tapSound("cta",id,true); tapDraw(); tapRow(); });
}
/* ---------- vibration (21 Oct, Sahil: "have an option to vibrate as well"): Settings › Vibration, Normal / Light / Off ----------
   Every buzz goes one of two ways: navigator.vibrate (Pulse.buzz; App.js's bridge turns it into a haptic) or a
   {t:"haptic"} message (hap/hapSeq in native.js, the heartbeat). Both pass through here. Light makes each one the
   phone's lightest tick; Off drops them (an empty sequence still goes, so a pending heartbeat dub is cancelled) */
function hapMode(){ const m=typeof S!=="undefined"&&S.haptics; return m==="light"||m==="off"?m:"on"; }
(()=>{ try{
  const v=navigator.vibrate;
  if(typeof v==="function"){ const w=function(p){ const m=hapMode(); if(m==="off") return true; return v.call(navigator,m==="light"?5:p); };   // 5 ms: App.js's selection tick
    try{ Object.defineProperty(navigator,"vibrate",{value:w,configurable:true}); }catch(e){ navigator.vibrate=w; } }
  if(typeof nsend==="function"){ const _n=nsend; nsend=function(m){
    if(m&&m.t==="haptic"){ const md=hapMode();
      if(md==="off"&&!(Array.isArray(m.seq)&&!m.seq.length)) return;
      if(md==="light"){ m=Object.assign({},m); if(m.style) m.style="select"; if(Array.isArray(m.seq)) m.seq=m.seq.map(x=>Array.isArray(x)?["select",x[1]]:"select"); } }
    return _n.call(this,m); }; }
}catch(e){ console.warn("Ossa: vibration setting",e); } })();

/* Settings' row says what's picked */
function tapRow(){ const r=$("yuTap"), em=r&&r.querySelector("em"); if(em) em.textContent=tapLabel()+" ›"; }
(()=>{ try{
  const x=$("tapClose"); if(x) x.onclick=()=>$("tapP").classList.remove("on");
  if(typeof closePanels==="function"){ const _c=closePanels; closePanels=function(){ const v=_c.apply(this,arguments); const p=$("tapP"); if(p) p.classList.remove("on"); return v; }; }
}catch(e){ console.warn("Ossa: button sounds",e); } })();
