// Every store capture in one run, against srv.js (port 9360). node cap-all.js [section...]
// Sections: body train progress workout run look focus intro. Writes cap/*.png and cap/clips.json (chip boxes in pt).
const fs = require("fs"), path = require("path");
const B = "http://127.0.0.1:9360";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ev = async js => { const r = await fetch(B + "/ev", { method: "POST", body: js }); const t = await r.text(); if (r.status !== 200) throw new Error("ev " + t + "\n" + js.slice(0, 200)); return JSON.parse(t); };
const get = async q => { const r = await fetch(B + q); const t = await r.text(); if (r.status !== 200) throw new Error(q + " " + t); return JSON.parse(t); };
const shot = (name, sel, pad = 0) => get(`/shot?name=${name}` + (sel ? `&sel=${encodeURIComponent(sel)}&pad=${pad}` : ""));
const shotRect = (name, r) => get(`/shot?name=${name}&x=${r.x}&y=${r.y}&w=${r.w}&h=${r.h}`);
const HI = require("./hires.js"), STEP = require("./step.js");
const CF = path.join(__dirname, "cap", "clips.json");
const clips = fs.existsSync(CF) ? JSON.parse(fs.readFileSync(CF, "utf8")) : {};
const keep = (k, c) => { clips[k] = c && c.clip ? { x: c.clip.x, y: c.clip.y, w: c.clip.width, h: c.clip.height } : c; fs.writeFileSync(CF, JSON.stringify(clips, null, 1)); };
const css = (id, text) => ev(`(()=>{ let s=document.getElementById(${JSON.stringify(id)}); if(!s){ s=document.createElement("style"); s.id=${JSON.stringify(id)}; document.head.appendChild(s); } s.textContent=${JSON.stringify(text)}; return 1; })()`);
const uncss = id => ev(`(()=>{ const s=document.getElementById(${JSON.stringify(id)}); if(s) s.remove(); return 1; })()`);
const log = (...a) => console.log(...a);

const S = {
  async body() {
    await get("/seed"); await ev(HI); await sleep(1200);
    await shot("body-ui");
    keep("chip-u-lvl", await shot("chip-u-lvl", ".u-lvl", 2));
    keep("chip-u-weak", await shot("chip-u-weak", ".u-weak", 2));
    await ev(`document.querySelector("canvas").style.visibility="hidden"; 1`); await sleep(300);
    keep("chip-u-rkrail", await shot("chip-u-rkrail", ".u-rkrail", 2));
    await ev(`document.querySelector("canvas").style.visibility=""; 1`);
    await css("__hide", ".u-top,.u-below,.u-nav,.u-lvl,.u-rkrail,.u-rkbar,.u-scn-btn,.u-rk-tap .u-rkcall{visibility:hidden!important}");
    await sleep(800); await shot("hero-body"); await uncss("__hide");
    log("body", await ev(`document.querySelector(".u-lvl").innerText.replace(/\\s+/g," ")+" | "+document.querySelector(".u-weak").innerText.replace(/\\s+/g," ")`));
  },
  async train() {
    await get("/seed"); await ev(HI); await sleep(800);
    await ev(`uiGo("train"); 1`); await sleep(3000);
    await shot("train");
    keep("chip-quest", await shot("chip-quest", ".dk-quest", 4));
    log("train", await ev(`document.querySelector(".dk-quest").innerText.replace(/\\s+/g," ")`));
  },
  async progress() {
    await get("/seed"); await ev(`uiGo("train"); 1`); await sleep(2800);
    await css("__pad", ".dk-sheet{padding-bottom:140px!important}");
    log("scroll", await ev(`(()=>{ const tr=document.getElementById("train"); const h=[...tr.querySelectorAll("*")].find(e=>e.children.length===0&&/^Your progress$/.test(e.textContent.trim())); tr.scrollTop+=h.getBoundingClientRect().top-74; return tr.scrollTop+"/"+(tr.scrollHeight-tr.clientHeight); })()`));
    await sleep(1000);
    await shot("train-progress");
    keep("chip-dkhud", await shot("chip-dkhud", ".dk-hud", 4));
    await uncss("__pad");
  },
  async workout(keepGoing) {
    await get("/seed");
    log("session", await ev(`(()=>{ TR.day=todayIdx; TR.session=sessionForDay(todayIdx); TR.hub=false; TR.view="plan"; TR.custom=false; setMode("train"); return TR.session.title+": "+TR.session.items.map(i=>i.name).join(", "); })()`));
    await sleep(1500); await ev(`document.getElementById("startW").click(); 1`); await sleep(1500);
    await css("__wkfix", ".app.train.tactive .trainv{top:0!important}");
    await ev(`TR.t0=Date.now()-(8*60+40)*1000; 1`);
    for (let k = 0; k < 2; k++) {
      await get("/tap?sel=%23setDone"); await sleep(1200);
      await ev(`(()=>{ const b=document.getElementById("skipRest"); if(b) b.click(); return 1; })()`); await sleep(900);
    }
    await sleep(3800);
    await shot("wk-c");
    // the meter alone, without the card's divider line above it
    const r = await get("/rect?sel=.wk-mm");
    const c = { x: Math.round(r.x - 8), y: Math.round(r.y + 2), w: Math.round(r.width + 16), h: Math.round(r.height - 2) };
    await shotRect("chip-wkmm", c); keep("chip-wkmm", c);
    log("hud", await ev(`(document.querySelector(".wk-clock")||{}).innerText.replace(/\\s+/g," ")+" | "+(document.querySelector(".wk-mm")||{}).innerText.replace(/\\s+/g," ")`));
    if (!keepGoing) await uncss("__wkfix");
  },
  async run() {
    await S.workout(true);
    log("level", await ev(`(()=>{ const L=vxLevelInfo(); S.tally.rp=(+S.tally.rp||0)+(L.toNext-9); return JSON.stringify(vxLevelInfo()); })()`));
    for (let i = 0; i < 80; i++) { const r = await ev(STEP); if (/none/.test(r)) break; await sleep(800); }
    log("run", await ev(`JSON.stringify({steps:TR.run.steps.map(s=>s.id), ranks:TR.run.R.ranks.map(r=>r.k+">"+r.to), lv:[TR.run.R.lv0,TR.run.R.lv1], prs:TR.run.R.prs.map(p=>p.name+" "+p.now+" was "+p.was), mins:TR.run.R.mins})`));
    await sleep(2500); await shot("r2-0-results");
    for (let i = 0; i < 6; i++) {
      const id = await ev(`TR.run.steps[TR.run.i].id`);
      if (id === "ranks") break;
      await ev(`wkRunNext(); 1`); await sleep(2800);
      await shot("r2-" + (i + 1) + "-" + (await ev(`TR.run.steps[TR.run.i].id`)));
    }
    await sleep(4200);
    await shot("r2-3-rank1");
    log("rank", await ev(`(document.querySelector(".rk-up")||document.body).innerText.replace(/\\s+/g," ").slice(0,160)`));
    await uncss("__wkfix");
  },
  async look() {
    await get("/seed"); await sleep(500);
    await ev(`S.finish="chrome"; evGo("look"); 1`); await sleep(3500);
    await shot("look-chrome");
    log("look", await ev(`(document.getElementById("evV")||document.body).innerText.replace(/\\s+/g," ").slice(0,200)`));
  },
  async focus() {
    await get("/seed"); await ev(`uiGo("breathe"); 1`); await sleep(3200);
    await shot("focus");
  },
  async intro() {
    await get("/seed");
    await ev(`(()=>{ delete S.pro; S.body=null; delete S.obIn; startOnboarding(); return 1; })()`); await sleep(2500);
    await ev(HI); await sleep(800);
    await css("__ob", "#o2Snd{visibility:hidden!important}");
    log("footer", await ev(`(()=>{ const e=[...document.querySelectorAll(".app.onboarding *")].find(x=>x.children.length===0&&/About three minutes/.test(x.textContent)); if(e){ e.style.visibility="hidden"; return e.textContent; } return "none"; })()`));
    await sleep(2500);
    await shot("ob-0");
  },
};
(async () => {
  const only = process.argv.slice(2);
  for (const k of ["body", "train", "progress", "workout", "run", "look", "focus", "intro"]) {
    if (only.length && !only.includes(k)) continue;
    if (k === "workout" && (!only.length || only.includes("run"))) continue;   // run does the workout too
    log("==", k); await S[k]();
  }
  log("logs", JSON.stringify(await get("/logs")));
})().catch(e => { console.error(e); process.exit(1); });
