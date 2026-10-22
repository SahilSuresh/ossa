// The app audit (19 Oct): every main screen at phone sizes, a screenshot each, and automatic checks.
//   node scripts/audit.js [WxH ...]        default 360x740 375x667
//   AUDIT_ONLY=body,train node scripts/audit.js
// Writes scripts/smoke/out/audit/<WxH>/<nn>-<id>.png and report.json, and prints a summary per screen:
//   hov    things wider than the screen (cut off at the side)
//   cover  buttons covered by something else (the tab pill, a panel) at their centre
//   small  buttons smaller than 40×40 (hard to tap)
//   tiny   text under 11 px
//   faint  small text with contrast under 3:1 against its background
//   scroll a main page that scrolls (for pages meant to fit one screen)
const fs = require("fs"), http = require("http"), path = require("path");
const { execFileSync } = require("child_process");
const { launch, page, sleep } = require("./smoke/cdp");
const ROOT = path.join(__dirname, "..");
const PORT = 5211, CDP = 9381;
const SIZES = (process.argv.slice(2).length ? process.argv.slice(2) : ["360x740", "375x667"]).map(s => s.split("x").map(Number));
const ONLY = process.env.AUDIT_ONLY ? process.env.AUDIT_ONLY.split(",") : null;

const SEED = `(()=>{
  try{ localStorage.clear(); }catch(e){}
  const keep={body:"m",name:"Alex",goal:"muscle",goals:["muscle"],flagged:["lowerback"],hinted:true,toured:true,
    pro:{active:true,trial:false,at:Date.now(),plan:"yearly"},
    profile:{age:"18-24",activity:"3-4",sleep:"ok",sleepH:7,diet:"ok",stress:"some",kit:"gym",days:[0,2,4,5],sit:"6-8",quit:true}};
  S=Object.assign(demoData(),keep); S.demo=false; S.onb={phoneHours:6};
  try{ S.program=genPlan({days:4,exp:"some",kit:"gym",mins:45,focus:"balanced"}); }catch(e){}
  S.done={day:new Date().toDateString(),items:[]};
  save(); return 1; })()`;
const AFTER_SEED = `(()=>{ try{ auState(); S.aura.xp=auXpFor(6)+40; S.aura.lv=6; S.aura.seenLv=6; S.aura.fhXp=S.aura.xp; S.aura.fhLv=6;
  const h=clNew("nicotine"); h.start=Date.now()-12.3*864e5; clRoot().habits.push(h); h.ms=[1,3,7]; h.granted=12; h.earned=195;
  eyS(); S.eyes.hist[dkey(1)]=380; S.eyes.hist[dkey(2)]=420; S.eyes.lastCheck=dkey(1); S.eyes.checkStreak=3; save(); }catch(e){ console.warn(e); } return 1; })()`;

const W = `const w=ms=>new Promise(r=>setTimeout(r,ms));`;
const startWk = `uiGo("train"); await w(600); const d=S.program.week.findIndex(Boolean); TR.day=d; TR.hub=false; TR.view="plan"; setMode("train"); await w(900);
  [...document.querySelectorAll("#train button")].find(b=>/Start workout/i.test(b.textContent)&&b.offsetParent).click(); await w(1200);`;
const SCREENS = [
  ["body", `uiGo("today"); await w(1500);`],
  ["body-recovery", `uiGo("today"); await w(1200); lxSetLens("recovery"); await w(1200);`],
  ["body-bones", `uiGo("today"); await w(1200); lxSetLens("bones"); await w(1400);`],
  ["body-muscle", `uiGo("today"); await w(1200); uiHeroSelect("pec_major"); await w(1200);`],
  ["stats-sheet", `uiGo("today"); await w(1200); stOpen(); await w(900);`],
  ["streak", `uiGo("today"); await w(1000); openStreak(false); await w(1400);`],
  ["ranks", `uiGo("today"); await w(1000); openRanks(); await w(1400);`],
  ["sore-spots", `uiGo("today"); await w(1000); vxSoreOpen(); await w(1400);`],
  ["search", `uiGo("today"); await w(1000); openSearch(); await w(900);`],
  ["train", `uiGo("train"); await w(2200);`],
  ["train-more", `uiGo("train"); await w(1500); dkMore(null); await w(1200);`],
  ["cold-sheet", `uiGo("train"); await w(1500); fgColdOpen(); await w(1200);`],
  ["session", `uiGo("train"); await w(600); const d=S.program.week.findIndex(Boolean); TR.day=d; TR.hub=false; TR.view="plan"; setMode("train"); await w(1500);`],
  ["exercises", `uiGo("train"); await w(1200); openExercises(); await w(1400);`],
  ["kinetic", `uiGo("train"); await w(1200); openKinetic("Barbell bench press"); await w(1400);`],
  ["insights", `uiGo("train"); await w(1200); openInsights("Barbell bench press"); await w(1400);`],
  ["workout", startWk],
  ["workout-rest", startWk + `document.getElementById("setDone").click(); await w(1200);`],
  ["focus", `uiGo("breathe"); await w(1800);`],
  ["focus-more", `uiGo("breathe"); await w(1200); mindGo("more"); await w(1200);`],
  ["eyes", `uiGo("breathe"); await w(1200); mindGo("eyes"); await w(1200);`],
  ["report", `uiGo("breathe"); await w(1200); mindGo("report"); await w(1200);`],
  ["lockin-setup", `uiGo("breathe"); await w(1200); mindGo("monk:setup"); await w(1400);`],
  ["lockin-timer", `uiGo("breathe"); await w(1200); mmStart(50,"Essay"); mindGo("monk"); await w(1500);`],
  ["breakfree", `uiGo("breathe"); await w(1200); mindGo("clean"); await w(1200);`],
  ["breakfree-habit", `uiGo("breathe"); await w(1200); mindGo("clean:"+clRoot().habits[0].id); await w(1300);`],
  ["urge", `uiGo("breathe"); await w(1200); clCur(clRoot().habits[0].id); mindGo("urge"); await w(1500);`],
  ["relapse", `uiGo("breathe"); await w(1200); clCur(clRoot().habits[0].id); mindGo("relapse"); await w(1200);`],
  ["breathe", `uiGo("breathe"); await w(1200); mindGo("breath"); await w(1500);`],
  ["unwind", `uiGo("breathe"); await w(1200); mindGo("unwind"); await w(1500);`],
  ["heartbeat", `uiGo("breathe"); await w(1200); mindGo("beat"); await w(1500);`],
  ["checkin", `uiGo("breathe"); await w(1200); mindGo("checkin"); await w(1300);`],
  ["wind", `uiGo("breathe"); await w(1200); mindGo("wind"); await w(1200);`],
  ["reflect", `uiGo("breathe"); await w(1200); mindGo("reflect"); await w(1200);`],
  ["learn-lesson", `uiGo("breathe"); await w(1200); mindGo("learn:dopamine"); await w(1200);`],
  ["recover", `uiGo("recover"); await w(1800);`],
  ["fuel", `uiGo("recover"); await w(1200); rcvGo("fuel"); await w(1300);`],
  ["learn", `uiGo("explore"); await w(1800);`],
  ["profile", `setTab("you"); await w(1600);`],
  ["settings", `setTab("you"); await w(1000); SUB.you="settings"; renderYou(); await w(1000);`],
  ["evolve", `openEvolve("home"); await w(1500);`],
  ["trophies", `openEvolve("trophies"); await w(1500);`],
  ["ideal", `openEvolve("ideal"); await w(1500);`],
  ["prestige", `openEvolve("prestige"); await w(1500);`],
  ["path", `openEvolve("path"); await w(1500);`],
  ["card", `openEvolve("card"); await w(1800);`],
  ["look", `openEvolve("look"); await w(1500);`],
  ["dare", `uiGo("train"); await w(1200); dpOpen({from:"body"}); await w(1300);`],
  ["posture", `uiGo("today"); await w(1000); psOpen(); await w(1500);`],
  ["bodycheck", `uiGo("today"); await w(1000); openBodyCheck(); await w(1500);`],
  ["lock", `gtShow(); await w(1200);`],
];

const AUDIT = `(()=>{
  const Wd=innerWidth,H=innerHeight, out={hov:[],cover:[],small:[],tiny:[],faint:[],scroll:[]};
  const nm=e=>{ const t=(e.getAttribute&&(e.getAttribute("aria-label")||""))||(e.textContent||"").trim().replace(/\\s+/g," "); return ((e.id?"#"+e.id+" ":"")+(t||e.className||e.tagName)).toString().slice(0,48); };
  const shown=e=>{ const r=e.getBoundingClientRect(); if(r.width<1||r.height<1) return false; let n=e; while(n&&n.nodeType===1){ const cs=getComputedStyle(n); if(cs.display==="none"||cs.visibility==="hidden"||+cs.opacity<0.05) return false; n=n.parentElement; } return r.bottom>0&&r.top<H&&r.right>0&&r.left<Wd; };
  const top=e=>{ const r=e.getBoundingClientRect(); const x=Math.min(Wd-1,Math.max(0,r.left+r.width/2)), y=Math.min(H-1,Math.max(0,r.top+r.height/2)); const t=document.elementFromPoint(x,y); return {t,ok:!!t&&(t===e||e.contains(t)||t.contains(e))}; };
  const inScrollX=e=>{ let n=e.parentElement; while(n&&n!==document.body){ const cs=getComputedStyle(n); if((cs.overflowX==="auto"||cs.overflowX==="scroll"||cs.overflowX==="hidden")&&n.scrollWidth>n.clientWidth+1) return true; if(cs.overflowX==="hidden"||cs.overflowX==="clip") return true; n=n.parentElement; } return false; };
  const els=[...document.querySelectorAll("body *")];
  els.forEach(e=>{ if(!shown(e)) return; const r=e.getBoundingClientRect();
    if((r.right>Wd+1||r.left<-1)&&!inScrollX(e)&&e.children.length===0&&(e.textContent||"").trim()) out.hov.push(nm(e)+" "+Math.round(r.left)+".."+Math.round(r.right)); });
  const btns=els.filter(e=>e.matches("button,a[href],[role=button],input[type=checkbox],input[type=range],select")&&shown(e));
  btns.forEach(e=>{ const r=e.getBoundingClientRect(), T=top(e);
    if(!T.ok){ const by=T.t?((T.t.closest("#uNav")?"the tab pill":(T.t.id?"#"+T.t.id:T.t.className||T.t.tagName))).toString().slice(0,30):"?"; if(r.top>=0&&r.bottom<=H) out.cover.push(nm(e)+" under "+by); return; }
    if((r.width<40||r.height<40)&&!e.closest("p,li>span")) out.small.push(nm(e)+" "+Math.round(r.width)+"×"+Math.round(r.height)); });
  const lum=c=>{ const m=c.match(/[\\d.]+/g); if(!m) return null; const [r,g,b,a]=m.map(Number); const f=v=>{ v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); }; return {L:0.2126*f(r)+0.7152*f(g)+0.0722*f(b),a:a==null?1:a}; };
  const bgOf=e=>{ let n=e; while(n&&n.nodeType===1){ const cs=getComputedStyle(n); if(cs.backgroundImage&&cs.backgroundImage!=="none") return null; const l=lum(cs.backgroundColor); if(l&&l.a>0.9) return l.L; n=n.parentElement; } return 0; };
  els.forEach(e=>{ if(!shown(e)) return; const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()); if(!own) return; const cs=getComputedStyle(e), fz=parseFloat(cs.fontSize);
    if(fz<11) out.tiny.push(nm(e)+" "+fz+"px");
    if(fz<18&&top(e).ok){ const fg=lum(cs.color), bg=bgOf(e); if(fg&&bg!=null&&fg.a>0.5){ const hi=Math.max(fg.L,bg), lo=Math.min(fg.L,bg), cr=(hi+0.05)/(lo+0.05); if(cr<3) out.faint.push(nm(e)+" "+cr.toFixed(1)+":1"); } } });
  ["tv-today","tv-recover","tv-explore","tv-you","mind","train"].forEach(id=>{ const e=document.getElementById(id); if(e&&shown(e)){ const d=e.scrollHeight-e.clientHeight; if(d>2) out.scroll.push(id+" +"+d); } });
  document.querySelectorAll(".panel.on,.st-wrap.on .st-p,.ev-v,.fg-p.on").forEach(e=>{ if(shown(e)){ const d=e.scrollHeight-e.clientHeight; if(d>2) out.scroll.push((e.id||e.className).toString().slice(0,20)+" +"+d); } });
  for(const k in out) out[k]=[...new Set(out[k])].slice(0,14);
  return out; })()`;

(async () => {
  execFileSync(process.execPath, [path.join(__dirname, "build-html.js")], { stdio: "ignore" });
  const html = fs.readFileSync(path.join(ROOT, "web", ".preview.html"));
  const srv = http.createServer((q, s) => { s.writeHead(200, { "content-type": "text/html; charset=utf-8" }); s.end(html); }).listen(PORT);
  const C = await launch({ port: CDP });
  const summary = [];
  try {
    for (const [w, h] of SIZES) {
      const dir = path.join(__dirname, "smoke", "out", "audit", `${w}x${h}`); fs.mkdirSync(dir, { recursive: true });
      const P = await page(CDP); await P.device({ w, h, dpr: 2, top: 24, bottom: 0 });
      await P.go(`http://localhost:${PORT}/`, 1500); await P.ev(SEED); await P.go(`http://localhost:${PORT}/`, 2500); await P.ev(AFTER_SEED);
      const rep = {};
      let n = 0;
      for (const [id, js] of SCREENS) {
        n++; if (ONLY && !ONLY.includes(id)) continue;
        await P.go(`http://localhost:${PORT}/`, 2200);
        const before = P.logs.length;
        try { await P.ev(`(async()=>{ ${W} ${js} return 1; })()`); } catch (e) { rep[id] = { error: e.message.split("\n")[0] }; console.log(`${w}x${h} ${id}: SETUP FAILED ${rep[id].error}`); continue; }
        await P.shot(path.join(dir, `${String(n).padStart(2, "0")}-${id}.png`));
        let r; try { r = await P.ev(AUDIT); } catch (e) { r = { auditError: e.message.split("\n")[0] }; }
        const errs = P.logs.slice(before).filter(l => /^EXC:|^error:/.test(l));
        if (errs.length) r.errors = [...new Set(errs)].slice(0, 4);
        rep[id] = r;
        const bits = Object.entries(r).filter(([k, v]) => Array.isArray(v) && v.length).map(([k, v]) => `${k}:${v.length}`);
        console.log(`${w}x${h} ${id}: ${bits.join(" ") || "clean"}`);
      }
      fs.writeFileSync(path.join(dir, "report.json"), JSON.stringify(rep, null, 1));
      summary.push([`${w}x${h}`, rep]); P.close();
    }
  } finally { C.close(); srv.close(); }
})();
