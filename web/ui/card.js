/* =========================================================
   YOUR CARD — Ossa 2.0 Phase 5 "Evolve" (package card, prefix cd / .cd-)
   A 1080×1350 picture of your rank to share, made only from your own log: overall rank, streak,
   sessions, top muscles and top trophy. Body Score and your name stay off until you turn them on
   (Edit). Never a made-up stat; never check-ins, mood, Health or body-check data.
   - view "card" in the Evolve panel (#evV, evolve.js): the card, one line, "Share card".
     o.tro pins that trophy (the trophy room's "Share on your card").
   - cdCanvas(o) draws it: colours from tokens through fxTok, every font face loaded first, the body
     still taken at once (in the caller's task), the result cached per look (cdCanvas.c).
   - cdShareImage(canvas,name) shares it the way psShare does (ossa.html): the share sheet, else the
     app's share:image bridge, else the picture in the view to press and hold.
   - openShare() is redefined here: Settings › "Share your card" opens the view. The legacy #share
     sheet is no longer used.
   - S.card = {name:false, score:false}, made by cdState() the first time it's read. A switch saves it and
     emits vxEmit("evolve",{what:"card"}).
   No top-level const/let (start-up rule, CLAUDE.md): state lives on function properties.
   ========================================================= */

/* ---------- state ---------- */
function cdState(){
  if(!S.card||typeof S.card!=="object") S.card={name:false,score:false};
  return S.card;
}
/* the optional ?evo=1 seed (evolve.js calls it): the card needs nothing seeded */
function cdDemoSeed(){ return false; }

/* ---------- what goes on the card (read at call time; Load demo replaces S) ---------- */
function cdDate(d){
  d=d||new Date();
  return d.getDate()+" "+["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]+" "+d.getFullYear();
}
/* the trophy on the card: o.tro when it's earned, else the top one (trophy.js troTop). null when none.
   .tok is the star's colour token, by the trophy room's rule (troCol): one-grade trophies are gold. */
function cdTro(o){
  try{
    if(o&&o.tro&&typeof troCat==="function"&&typeof troState==="function"){
      const e=(troCat()||[]).find(x=>x&&x.id===o.tro), got=((troState()||{}).got||{})[o.tro];
      if(e&&got&&+got.g>0){
        const n=cdGrades(e), g=Math.max(1,Math.min(n,3,Math.floor(+got.g)));
        const gname=typeof troGname==="function"?uiSafe(()=>troGname(e,g),""):n>1?(["Bronze","Silver","Gold"][g-1]||""):"";
        const top=typeof troTop==="function"?uiSafe(()=>troTop(),null):null;
        return {id:e.id,name:e.name,g,gname,tok:cdTroTok(e,g),pin:!(top&&top.id===e.id)};   // pinned and not the top one: the row says "Trophy"
      }
    }
    if(typeof troTop==="function"){
      const t=troTop();
      if(t&&t.name){ const e=typeof troById==="function"?uiSafe(()=>troById(t.id),null):null; return {...t,tok:cdTroTok(e,t.g)}; }
    }
  }catch(e){ console.warn(e); }
  return null;
}
/* a grade's colour token: troCol's own answer when trophy.js has it, else the same rule (one grade → --tro-3) */
function cdTroTok(e,g){
  const gg=Math.max(1,Math.min(3,Math.floor(+g)||1));
  try{
    if(e&&typeof troCol==="function"){ const m=/^var\((--[\w-]+)\)$/.exec(String(troCol(e,gg)).trim()); if(m) return m[1]; }
  }catch(x){ console.warn(x); }
  return e&&cdGrades(e)===1?"--tro-3":"--tro-"+gg;
}
/* how many grades a catalogue entry has, whatever shape trophy.js gives it */
function cdGrades(e){
  if(!e) return 1;
  if(+e.n>0) return Math.floor(+e.n);
  if(+e.grades>0) return Math.floor(+e.grades);
  const a=Array.isArray(e.rules)?e.rules:Array.isArray(e.at)?e.at:Array.isArray(e.pts)?e.pts:Array.isArray(e.need)?e.need:null;
  return a?a.length:1;
}
function cdData(o){
  o=o||{};
  const C=cdState(), ov=overall(), ix=rankIx(ov), t=rankTier(ov);
  const nm=C.name&&S.name?String(S.name).trim().slice(0,20):"";
  const top=GLORDER.filter(k=>(S.scores[k]||0)>0).sort((a,b)=>(S.scores[b]||0)-(S.scores[a]||0)).slice(0,3)
    .map(k=>({k,name:rkSay(k),rank:rankOf(S.scores[k]),t:rankTier(S.scores[k])}));
  return {ov,ix,t,rank:rankOf(ov),lv:ix?RK_LV[RK_STEPS[ix-1][2]]:"–",tier:RANKS[t][1],
    st:uiSafe(()=>uiStreak().n,0),n:uiSafe(()=>sessionsN(),0),
    sc:C.score?uiSafe(()=>bodyScore(),null):null,nm,top,tro:cdTro(o),date:cdDate()};
}
/* everything the picture depends on, so a still is only retaken when something changed */
function cdKey(D){
  const look=uiSafe(()=>typeof bxLookKey==="function"?bxLookKey():"","");
  const body=GLORDER.map(k=>{ const f=uiSafe(()=>rkFadeShown(k),0); return rankIx(S.scores[k])+(f>0.01?"f"+Math.round(f*20):""); }).join(",");
  const kind=typeof Body!=="undefined"&&Body?Body.kind:"";
  return JSON.stringify([D.ov,D.st,D.n,D.sc,D.nm,D.top.map(x=>x.k+":"+x.rank),D.tro?[D.tro.id,D.tro.g,!!D.tro.pin]:0,D.date,S.body,S.finish||"",kind,look,body]);
}

/* ---------- the picture ---------- */
/* the body: a still of the 3D body in its live look and rank colours, or the 2D rank body without WebGL */
function cdFig(){
  try{
    if(typeof Body!=="undefined"&&Body&&Body.kind==="gl"&&typeof Body.shot==="function"){
      const c=Body.shot({yaw:0,h:720,canvas:true});
      if(c&&c.width>0&&c.height>0) return {c};
    }
  }catch(e){ console.warn(e); }
  try{ if(typeof figRankSvg==="function") return {svg:figRankSvg(740)}; }catch(e){ console.warn(e); }
  return {};
}
function cdImg(svg){
  return new Promise(r=>{ try{ const im=new Image(); im.onload=()=>r(im); im.onerror=()=>r(null); im.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg); }catch(e){ r(null); } });
}
/* document.fonts.ready doesn't load a face no element has used yet, so load each one the card draws with */
function cdFonts(){
  if(!document.fonts||typeof document.fonts.load!=="function") return Promise.resolve();
  const all=Promise.all(['italic 900 120px "Inter Display Italic"',"900 72px Inter","800 36px Inter","500 30px Inter"].map(f=>document.fonts.load(f).catch(()=>null)));
  return Promise.race([all,new Promise(r=>setTimeout(r,2500))]);
}
function cdNum(v){ const n=Math.round(+v||0); try{ return n.toLocaleString("en-GB"); }catch(e){ return String(n); } }
function cdFam(name){ const v=fxTok(name); return v&&v.indexOf("--")!==0?v:"sans-serif"; }
function cdLs(g,px){ try{ if("letterSpacing" in g) g.letterSpacing=px+"px"; }catch(e){} }
/* the largest size from px down to min at which txt fits maxW; sets g.font and returns the size */
function cdFit(g,txt,pre,px,min,maxW,fam){
  let s=px; g.font=`${pre} ${s}px ${fam}`;
  while(s>min&&g.measureText(txt).width>maxW){ s-=2; g.font=`${pre} ${s}px ${fam}`; }
  return s;
}
function cdRR(g,x,y,w,h,r){
  g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath();
}
function cdHex(g,x,y,w,h){
  g.beginPath(); g.moveTo(x+w/2,y); g.lineTo(x+w,y+h*0.25); g.lineTo(x+w,y+h*0.75); g.lineTo(x+w/2,y+h); g.lineTo(x,y+h*0.75); g.lineTo(x,y+h*0.25); g.closePath();
}
function cdStar(g,cx,cy,r){
  g.beginPath();
  for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rr=i%2?r*0.45:r; g[i?"lineTo":"moveTo"](cx+Math.cos(a)*rr,cy+Math.sin(a)*rr); }
  g.closePath();
}
/* draws the whole card on a 1080×1350 context. fig: a canvas or image of the body, or null */
function cdPaint(g,D,fig){
  const W=1080, H=1350, M=80, R=W-M, T=n=>fxTok(n), fam=cdFam("--display"), ita=cdFam("--display-italic");
  const F=(w,px)=>`${w} ${px}px ${fam}`;
  const rk=T("--rk-"+D.t), onrk=T("--on-rk-"+D.t), t1=T("--text-1"), t2=T("--text-2"), bg=T("--bg");
  g.save(); g.textAlign="left"; g.textBaseline="alphabetic";
  g.fillStyle=bg; g.fillRect(0,0,W,H);

  /* top right: the overall rank's hex, its level and tier */
  const hw=170, hh=Math.round(hw/0.866), hx=R-hw, hy=80;
  g.save(); g.shadowColor=rk; g.shadowBlur=56; g.fillStyle=rk; cdHex(g,hx,hy,hw,hh); g.fill(); g.restore();
  g.fillStyle=onrk; g.textAlign="center"; g.font=F(900,84); g.fillText(D.lv,hx+hw/2,hy+hh*0.56);
  const tn=D.tier.toUpperCase(); cdLs(g,2); cdFit(g,tn,"800",22,14,hw-40,fam); g.fillText(tn,hx+hw/2,hy+hh*0.74); cdLs(g,0);
  g.textAlign="left";

  /* top left: (name), OVERALL, the rank, its RP average */
  const LW=hx-36-M; let y=96;
  if(D.nm){ const s=cdFit(g,`${D.nm}'s body`,"800",40,24,LW,fam); g.fillStyle=t1; g.fillText(`${D.nm}'s body`,M,y+Math.round(s*0.73)); y+=Math.round(s*0.73)+22; }
  g.fillStyle=t2; g.font=F(800,36); cdLs(g,6); g.fillText("OVERALL",M,y+27); cdLs(g,0); y+=27+22;
  const rt=D.rank.toUpperCase(), rs=cdFit(g,rt,"italic 900",120,56,LW,ita), cap=Math.round(rs*0.73);
  g.fillStyle=t1; g.fillText(rt,M,y+cap); y+=cap+20;
  g.fillStyle=t2; g.font=F(500,40); g.fillText(`${D.ov} RP average`,M,y+30); y+=30;

  /* centre: the body, on a soft glow in the rank colour */
  const top=Math.max(y+20,hy+hh+16), bot=1000, bh=bot-top;
  g.save(); g.globalAlpha=0.14; const cy=top+bh*0.45, gr=g.createRadialGradient(W/2,cy,10,W/2,cy,bh*0.6);
  gr.addColorStop(0,rk); gr.addColorStop(1,bg); g.fillStyle=gr; g.fillRect(0,0,W,H); g.restore();
  if(fig){
    const fw=fig.naturalWidth||fig.width, fh=fig.naturalHeight||fig.height;
    if(fw>0&&fh>0){ const s=Math.min(bh/fh,(W-2*M)/fw), dw=fw*s, dh=fh*s;
      g.save(); g.globalCompositeOperation="lighten"; g.drawImage(fig,(W-dw)/2,top+(bh-dh)/2,dw,dh); g.restore(); }
  }

  /* the frame in the rank colour: 6 px, radius 48, inset 24 */
  g.strokeStyle=rk; g.lineWidth=6; cdRR(g,27,27,W-54,H-54,45); g.stroke();

  /* stats: streak, sessions, RP average (or Body Score when you turn it on) */
  const cells=[[D.st,"day streak"],[D.n,D.n===1?"session":"sessions"],D.sc!=null?[D.sc,"Body Score"]:[D.ov,"RP average"]], cw=(W-2*M)/3;
  cells.forEach(([v,l],i)=>{ const x=M+i*cw; g.fillStyle=t1; cdFit(g,cdNum(v),"900",72,48,cw-24,fam); g.fillText(cdNum(v),x,1064); g.fillStyle=t2; g.font=F(500,30); g.fillText(l,x,1104); });

  /* your three best muscles as chips: a rank-colour square and "Biceps · Forged I" */
  if(D.top.length){
    const lab=x=>`${x.name} · ${x.rank}`; let L=D.top.slice(), px=32;
    const tw=()=>{ g.font=F(800,px); return L.reduce((a,x)=>a+76+g.measureText(lab(x)).width,0)+(L.length-1)*14; };
    while(tw()>W-2*M){ if(px>24) px-=2; else if(L.length>1){ L.pop(); px=32; } else break; }
    g.font=F(800,px); let x=M; const cy0=1128, ch=56;
    L.forEach(m=>{ const w=76+g.measureText(lab(m)).width;
      g.fillStyle=T("--surface-2"); cdRR(g,x,cy0,w,ch,ch/2); g.fill(); g.strokeStyle=T("--line-2"); g.lineWidth=2; g.stroke();
      g.fillStyle=T("--rk-"+m.t); cdRR(g,x+22,cy0+ch/2-9,18,18,4); g.fill();
      g.fillStyle=t1; g.fillText(lab(m),x+54,cy0+ch/2+Math.round(px*0.36)); x+=w+14; });
  }

  /* the top trophy (or the one you pinned): a star in its grade colour (one-grade trophies are gold, as in the trophy room) */
  if(D.tro){
    const g3=Math.max(1,Math.min(3,+D.tro.g||1)), a=D.tro.pin?"Trophy":"Top trophy", b=` · ${D.tro.name}${D.tro.gname?" · "+D.tro.gname:""}`;
    g.fillStyle=T(D.tro.tok||"--tro-"+g3); cdStar(g,M+18,1211,20); g.fill();
    g.font=F(500,32); g.fillStyle=t2; g.fillText(a,M+52,1222); const aw=g.measureText(a).width;
    cdFit(g,b,"800",32,22,R-(M+52+aw),fam); g.fillStyle=t1; g.fillText(b,M+52+aw,1222);
  }

  /* footer: the wordmark and the date */
  g.fillStyle=T("--line"); g.fillRect(M,1254,W-2*M,2);
  g.fillStyle=t1; g.font=F(900,40); cdLs(g,6); g.fillText("OSSA",M,1302); cdLs(g,0);
  g.fillStyle=t2; g.font=F(500,30); g.textAlign="right"; g.fillText(D.date,R,1300);
  g.restore();
}
/* a blank 1080×1350 canvas painted with the card (fig may be null) */
function cdDraw(D,fig){
  const cv=document.createElement("canvas"); cv.width=1080; cv.height=1350;
  const g=cv.getContext("2d"); if(!g) throw new Error("no 2d context");
  cdPaint(g,D,fig);
  return cv;
}
/* → Promise<Blob|null>; rejects (SecurityError) when the canvas is tainted */
function cdPng(cv){ return new Promise(r=>cv.toBlob(r,"image/png")); }
/* a PNG data URL, or "" when the canvas can't export one ("data:," is an empty export) */
function cdData64(cv){ try{ const u=cv.toDataURL("image/png"); return u&&u.indexOf("data:image/png")===0?u:""; }catch(e){ return ""; } }
/* → Promise<HTMLCanvasElement> 1080×1350, with .cdBlob (PNG, when the browser can make one) and .cdUrl (an object URL
   of it, else a data URL). Rejects when no picture can be exported. The still is taken now, before the first await,
   so a view takes it inside its render. */
function cdCanvas(o){
  o=o||{};
  const D=cdData(o), key=cdKey(D), hit=cdCanvas.c;
  if(hit&&hit.key===key) return hit.p;
  const fig=cdFig();
  const p=(async()=>{
    await cdFonts();
    const im=fig.c||(fig.svg?await cdImg(fig.svg):null);
    let cv=cdDraw(D,im), blob=null;
    try{ blob=await cdPng(cv); }
    catch(e){
      /* a tainted figure: a tainted canvas stays tainted for good, so paint a fresh one: with the 2D rank body when
         the 3D still was the culprit, else (or when that taints too) with no figure */
      const svg=fig.c&&typeof figRankSvg==="function"?await cdImg(uiSafe(()=>figRankSvg(740),"")):null;
      for(const f of svg?[svg,null]:im?[null]:[]){
        cv=cdDraw(D,f);
        try{ blob=await cdPng(cv); break; }catch(e2){ blob=null; }
      }
    }
    if(blob){ cv.cdBlob=blob; try{ cv.cdUrl=URL.createObjectURL(blob); }catch(e){} }
    if(!cv.cdUrl) cv.cdUrl=cdData64(cv);
    if(!cv.cdUrl) throw new Error("the card couldn't be exported");
    return cv;
  })();
  const old=cdCanvas.c; cdCanvas.c={key,p};
  if(old&&old.p) old.p.then(c=>{ if(c&&c.cdUrl&&c.cdUrl.indexOf("blob:")===0) setTimeout(()=>{ try{ URL.revokeObjectURL(c.cdUrl); }catch(e){} },4000); }).catch(()=>{});
  p.catch(e=>{ console.warn("Ossa: card",e); if(cdCanvas.c&&cdCanvas.c.p===p) cdCanvas.c=null; });
  return p;
}

/* ---------- sharing: psShare's chain (ossa.html) ---------- */
/* → Promise<"web"|"native"|"shown"|"cancel">. Rejects, tracking nothing, when the canvas has no picture to give
   (cdCanvas never resolves with one, so only a caller's own canvas can get here). */
async function cdShareImage(canvas,name){
  name=name||"ossa-card.png";
  try{
    const blob=canvas.cdBlob||await cdPng(canvas);
    const file=blob?new File([blob],name,{type:"image/png"}):null;
    if(file&&navigator.canShare&&navigator.canShare({files:[file]})){
      await navigator.share({files:[file],title:"My Ossa card"});
      track("card_share",{via:"web"}); return "web";
    }
  }catch(e){ if(e&&e.name==="AbortError") return "cancel"; console.warn(e); }
  if(typeof NATIVE!=="undefined"&&NATIVE.on){
    const b64=(cdData64(canvas).split(",")[1])||"";
    if(b64){ nsend({t:"share:image",b64,name}); track("card_share",{via:"native"}); return "native"; }
  }
  const url=canvas.cdUrl||cdData64(canvas);
  if(!url) throw new Error("the card has no picture to share");
  cdShown(url);
  track("card_share",{via:"shown"});
  return "shown";
}
/* no share sheet and no app: the PNG itself in the view, to press and hold */
function cdShown(url){
  if(!url) return;
  const v=document.querySelector(".cd-v");
  if(!v){ toast("Open Your card to save the picture."); return; }
  const f=v.querySelector(".cd-frame"), l=v.querySelector(".cd-line");
  if(f){ f.removeAttribute("role"); f.removeAttribute("aria-label"); f.innerHTML=`<img class="cd-img save" src="${url}" alt="Your card">`; f.classList.add("ready"); }
  if(l) l.textContent="Press and hold the image to save it.";
}
/* the card couldn't be made: say so on the line under it (a toast when the view isn't open) */
function cdFail(){
  const msg="Your card couldn't be made. Try again.", l=document.querySelector(".cd-v .cd-line");
  if(l) l.textContent=msg; else toast(msg);
}

/* ---------- the view (Evolve panel) ---------- */
function cdShareIc(){ return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5v11.5M7.5 8 12 3.5 16.5 8M8 11H6.5v9h11v-9H16"/></svg>`; }
/* the card's box: as big as the space left over allows, 4:5, at most 350 px wide */
function cdSize(b){
  const pv=b.querySelector(".cd-pv"), f=b.querySelector(".cd-frame"), l=b.querySelector(".cd-line");
  if(!pv||!f) return;
  const w=pv.clientWidth, h=pv.clientHeight-(l?l.offsetHeight+cdGap(pv):0);
  if(!(w>0&&h>0)) return;
  const fh=Math.max(120,Math.floor(Math.min(h,w*1.25,350*1.25))), fw=Math.floor(fh*0.8);
  f.style.width=fw+"px"; f.style.height=fh+"px";
}
function cdGap(el){ try{ return parseFloat(getComputedStyle(el).rowGap)||0; }catch(e){ return 0; } }
function cdRender(b,o,bar){
  o=o||{};
  const D=cdData(o), n=(cdRender.n=(cdRender.n||0)+1);
  cdRender.s={o,b};
  /* evolve.js draws the bar before the body, so the act button is already there */
  const ed=(bar&&bar.querySelector?bar:document).querySelector("[data-cd-edit]");
  if(ed) ed.onclick=()=>{ Pulse.buzz(6); cdEdit(); };
  const say=`Your card: ${D.rank}, ${D.st} day streak, ${D.n} ${D.n===1?"session":"sessions"}`;
  b.innerHTML=`<div class="cd-v">
    <div class="cd-pv">
      <div class="cd-frame" role="img" aria-label="${uiEsc(say)}" style="--c:var(--rk-${D.t})"><span class="cd-ph">${rkBadge(D.ov,"lg")}</span></div>
      <p class="cd-line">Made from your own training log.</p>
    </div>
    <button class="u-btn primary block cd-go" type="button">${cdShareIc()}Share card</button>
  </div>`;
  cdSize(b);
  const go=b.querySelector(".cd-go");
  if(go) go.onclick=()=>{ Pulse.buzz(8); cdShare(); };
  cdCanvas(o).then(cv=>{
    if(cdRender.n!==n||!b.isConnected) return;
    const f=b.querySelector(".cd-frame"); if(!f||!cv.cdUrl) return;
    f.innerHTML=`<img class="cd-img" src="${cv.cdUrl}" alt="" draggable="false">`; f.classList.add("ready");
  }).catch(e=>{
    if(cdRender.n!==n||!b.isConnected) return;
    cdFail();
  });
}
async function cdShare(){
  if(cdShare.busy) return;
  const s=cdRender.s; if(!s) return;
  cdShare.busy=true;
  try{ await cdShareImage(await cdCanvas(s.o),"ossa-card.png"); }
  catch(e){ console.warn("Ossa: card",e); cdFail(); }
  finally{ cdShare.busy=false; }
}
/* the act slot: Edit (wired in cdRender) */
function cdAct(){ return `<button class="cd-ed" type="button" data-cd-edit aria-label="Edit your card">Edit</button>`; }
/* Edit: two switches, both off by default */
function cdEdit(){
  if(typeof evSheet!=="function") return;
  const C=cdState(), has=!!(S.name&&String(S.name).trim());
  const row=(k,label,on,off,sub)=>`<button class="cd-tg" type="button" role="switch" aria-checked="${on}" data-cd-t="${k}"${off?" disabled":""}>
      <span class="cd-tg-l"><b>${label}</b>${sub?`<small>${sub}</small>`:""}</span><i class="cd-sw" aria-hidden="true"></i></button>`;
  evSheet(`<div class="cd-sh"><h3 class="ev-sh-h">Your card</h3>
    ${row("score","Show Body Score",!!C.score,false,"")}
    ${row("name","Show your name",!!(C.name&&has),!has,has?"":"No name saved")}</div>`,
    el=>{ const host=el&&el.querySelectorAll?el:document;
      host.querySelectorAll("[data-cd-t]").forEach(x=>x.onclick=()=>cdToggle(x)); });
}
/* a switch: save, redraw the card under the open sheet, then tell the others (brief §3.4). evolve.js holds its
   own refresh while the sheet is up (evS().dirty) and redraws once it closes, a cache hit. */
function cdToggle(x){
  const k=x.dataset.cdT; if(k!=="score"&&k!=="name") return;
  const C=cdState(); C[k]=!C[k]; save();
  x.setAttribute("aria-checked",String(!!C[k])); Pulse.buzz(6);
  const s=cdRender.s; if(s&&s.b&&s.b.isConnected) cdRender(s.b,s.o);
  if(typeof vxEmit==="function") vxEmit("evolve",{what:"card"});
}

/* ---------- the hub tile ---------- */
function cdTile(){
  const ov=overall(), t=rankTier(ov);
  return {sub:`${rankOf(ov)} · share it`,bar:null,c:t>=2?`var(--rk-${t})`:"var(--text-1)",dot:false};
}

/* ---------- Settings › Share your card ---------- */
function openShare(){ if(typeof openEvolve==="function"&&openEvolve("card",{from:"settings"})) return; toast("Your card isn't ready yet."); }

(()=>{ try{
  if(typeof evView==="function") evView("card",{title:"Your card",act:cdAct,render:cdRender});
}catch(e){ console.warn("Ossa: card.js",e); } })();
