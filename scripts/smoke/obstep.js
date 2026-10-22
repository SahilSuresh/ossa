module.exports = `(()=>{
  const vis=e=>e&&e.offsetParent!==null&&!e.disabled;
  const eye=(document.getElementById("uObEye")||{}).textContent||"";
  const fp=document.getElementById("o2Fp"); if(vis(fp)){ fp.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true})); return eye+" | hold"; }
  const nm=document.getElementById("o2Name");
  if(vis(nm)){ nm.value="Alex"; nm.dispatchEvent(new Event("input",{bubbles:true})); document.getElementById("o2NameOk").click(); return eye+" | name"; }
  const bs=[...document.querySelectorAll("#o2 button, .app.onboarding .pw button")].filter(b=>vis(b)&&!/^(o2Back|o2Snd)$/.test(b.id));
  const go=bs.find(b=>/primary/.test(b.className)&&!/u-ob-card|u-ob-pc/.test(b.className))||bs.find(b=>!/u-ob-card|u-ob-pc/.test(b.className)&&/^(Continue|Next|That's me|Done|Let's go|Looks right|See my|Build|Show|Start|Got it|I'm in|Yes|Keep going|Carry on|Tap)/i.test(b.textContent.trim()));
  const cards=bs.filter(b=>/u-ob-card|u-ob-pc|u-ob-pick|u-ob-pill|u-ob-day|u-ob-age|chip|opt/.test(b.className)&&!b.classList.contains("sel")&&b.getAttribute("aria-pressed")!=="true");
  const anySel=bs.some(b=>b.classList.contains("sel")||b.getAttribute("aria-pressed")==="true");
  if(cards.length&&!anySel){ cards[0].click(); return eye+" | pick "+cards[0].textContent.trim().slice(0,30); }
  if(go){ go.click(); return eye+" | go "+go.textContent.trim().slice(0,30); }
  const sp=document.getElementById("o2Space"); if(sp&&/Tap to continue|tap/i.test((document.querySelector(".app.onboarding")||document.body).innerText)){ return eye+" | space"; }
  return eye+" | ?? "+bs.map(b=>(b.id||b.className)+"="+b.textContent.trim().slice(0,20)).join(" ; ");
})()`;
