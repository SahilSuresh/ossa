// The smoke test: run it before every `npm run update` and every build.
//   node scripts/smoke.js            (both phone sizes)
//   node scripts/smoke.js --shots    (also saves screenshots in scripts/smoke/out/)
//   SMOKE_ONLY=workout node scripts/smoke.js   (one journey; SMOKE_V=1 prints every step)
// It builds the web bundle, serves web/.preview.html on its own port, and drives headless Chrome
// (C:/Program Files/Google/Chrome) through three journeys at 390x844 and 375x667:
//   1. a brand-new person goes through the whole intro, paywall included, and lands on the Body page
//   2. a just-onboarded person opens every tab
//   3. the same person starts today's workout, logs every set, and goes through the run to the end
// Any uncaught exception or console.error fails the run. Exit code 0 = pass.
const http = require("http"), fs = require("fs"), path = require("path");
const { execFileSync } = require("child_process");
const { launch, page, sleep } = require("./smoke/cdp");
const seedNew = require("./smoke/seed-new");
const obStep = require("./smoke/obstep");

const ROOT = path.join(__dirname, "..");
const PORT = 5191, CDP = 9361;
const SHOTS = process.argv.includes("--shots");
const OUT = path.join(__dirname, "smoke", "out");
const SIZES = [{ w: 390, h: 844, top: 47, bottom: 34 }, { w: 375, h: 667, top: 20, bottom: 0 }];

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); console.log((cond ? "  ok   " : "  FAIL ") + msg); return cond; };

async function shot(P, name) { if (SHOTS) await P.shot(path.join(OUT, name + ".png")); }
const errs = P => P.logs.filter(l => /^EXC:|^error:/.test(l) && !/favicon|net::ERR|Failed to load resource/.test(l));

async function intro(P, tag) {
  await P.go(`http://localhost:${PORT}/`, 1500);
  await P.ev(`(()=>{ try{ localStorage.clear(); }catch(e){} return 1; })()`);
  await P.go(`http://localhost:${PORT}/`, 2500);
  const seen = new Set(); let last = "", stuck = 0;
  for (let i = 0; i < 260; i++) {
    const st = await P.ev(`(()=>{ const o=document.getElementById("o2"); return { step:o&&o.dataset.step||"", on:!!document.querySelector(".app.onboarding"), body:!!S.body }; })()`);
    if (!st.on && st.body) break;
    if (st.step) { if (!seen.has(st.step)) await shot(P, `${tag}-ob-${st.step}`); seen.add(st.step); }
    if (st.step === "sheet" && !seen.has("sheet-full") && await P.ev(`!!document.querySelector(".st-sheet")`)) { seen.add("sheet-full"); await sleep(1500); await shot(P, `${tag}-ob-sheet-full`); }
    const r = await P.ev(obStep);
    if (process.env.SMOKE_V) console.log("    ", st.step, r);
    if (r === last) stuck++; else stuck = 0;
    last = r;
    if (stuck > 25) { ok(false, `intro stuck at "${st.step}": ${r}`); break; }
    await sleep(/space|\?\?/.test(r) ? 700 : 450);
    if (/space|\?\?/.test(r)) await P.tapXY(195, 400);
  }
  await sleep(1500);
  const end = await P.ev(`({ body:!!S.body, onb:!!document.querySelector(".app.onboarding"), lock:!!document.querySelector("#gtLock:not([hidden])"), steps:${"0"} })`);
  ok(end.body && !end.onb, `intro finishes on the app (${seen.size} steps: ${[...seen].join(" ")})`);
  ok(seen.has("pro") || await P.ev(`!!(S.pro&&S.pro.active)`), "intro goes through the paywall");
  ok(seen.has("sheet-full"), "intro shows the character sheet");
  ok(!end.lock, "no lock screen after the intro");
  await shot(P, `${tag}-ob-end`);
}

async function tabs(P, tag) {
  await P.go(`http://localhost:${PORT}/`, 1500);
  await P.ev(seedNew({ toured: true }));
  await P.go(`http://localhost:${PORT}/`, 3000);
  for (const t of ["today", "train", "breathe", "recover", "explore", "you"]) {
    const before = errs(P).length;
    await P.ev(`(()=>{ typeof uiGo==="function"?uiGo(${JSON.stringify(t)}):setTab(${JSON.stringify(t)}); return 1; })()`);
    await sleep(1200);
    const vis = await P.ev(`(()=>{ const a=document.getElementById("app"); return a&&a.getBoundingClientRect().height>0; })()`);
    ok(vis && errs(P).length === before, `tab ${t} opens cleanly`);
    await shot(P, `${tag}-tab-${t}`);
  }
}

async function workout(P, tag) {
  await P.go(`http://localhost:${PORT}/`, 1500);
  await P.ev(seedNew({ toured: true }));
  await P.go(`http://localhost:${PORT}/`, 3000);
  await P.ev(`(()=>{ try{ uiGo("train"); }catch(e){ setTab("today"); } const d=S.program.week.findIndex(Boolean); TR.day=d; TR.hub=false; TR.view="plan"; setMode("train"); return 1; })()`);
  await sleep(1200);
  const started = await P.ev(`(()=>{ const b=[...document.querySelectorAll("#train button")].find(b=>/Start workout/i.test(b.textContent)&&b.offsetParent); if(!b) return "no start button"; b.click(); return "clicked"; })()`);
  await sleep(800);
  const view = await P.ev(`TR.view`);
  ok(view === "active", `workout starts (${started}, ${view})`);
  await shot(P, `${tag}-wk-active`);
  let sets = 0, runSeen = false;
  for (let i = 0; i < 160; i++) {
    const r = await P.ev(`(()=>{
      const vis=e=>e&&e.offsetParent!==null&&!e.disabled;
      if(TR.view==="active"){
        const sk=document.getElementById("skipRest"); if(vis(sk)){ sk.click(); return "rest"; }
        const ef=[...document.querySelectorAll("[data-rir]")].find(vis); if(ef){ ef.click(); return "effort"; }
        const sd=document.getElementById("setDone"); if(vis(sd)){ sd.click(); return "set"; }
        const any=[...document.querySelectorAll("#train button")].find(b=>vis(b)&&/Finish|End workout|Yes, finish/i.test(b.textContent)); if(any){ any.click(); return "finish"; }
        return "active-wait";
      }
      if(document.querySelector(".wk-run")){
        const dr=[...document.querySelectorAll("[data-drir]")].find(vis); if(dr){ dr.click(); return "run-effort"; }
        const b=[...document.querySelectorAll(".wk-run button, #wkRunTop button")].find(b=>vis(b)&&/^(Done|Next|Continue|Carry on|Keep going|Nice|Got it|Close|See|Tap)/i.test(b.textContent.trim()));
        if(b){ const t=b.textContent.trim(); b.click(); return "run:"+t.slice(0,20); }
        return "run-wait";
      }
      return "out:"+TR.view;
    })()`);
    if (process.env.SMOKE_V) console.log("    ", r);
    if (r === "set") sets++;
    if (r.startsWith("run")) runSeen = true;
    if (r.startsWith("out:") && runSeen) break;
    if (r === "run-wait" || r === "active-wait") await P.tapXY(195, 300);
    await sleep(r.startsWith("run") ? 900 : 350);
  }
  ok(sets > 0, `logs sets (${sets})`);
  ok(runSeen, "the run after the workout shows");
  const after = await P.ev(`({ view:TR.view, run:!!document.querySelector(".wk-run"), log:(S.log||[]).length, nav:!!document.querySelector(".u-nav") && getComputedStyle(document.querySelector(".u-nav")).display!=="none" })`);
  ok(!after.run && after.log > 0, `the run ends and the workout is saved (log ${after.log})`);
  ok(after.nav, "the tab bar is back");
  await shot(P, `${tag}-wk-end`);
}

(async () => {
  console.log("Building the web bundle…");
  execFileSync(process.execPath, [path.join(__dirname, "build-html.js")], { stdio: "inherit" });
  const html = fs.readFileSync(path.join(ROOT, "web", ".preview.html"));
  const srv = http.createServer((q, s) => { s.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }); s.end(html); }).listen(PORT);
  if (SHOTS) fs.mkdirSync(OUT, { recursive: true });
  const C = await launch({ port: CDP });
  try {
    for (const sz of SIZES) {
      const tag = `${sz.w}x${sz.h}`;
      for (const [name, fn] of [["intro", intro], ["tabs", tabs], ["workout", workout]]) {
        if (process.env.SMOKE_ONLY && !process.env.SMOKE_ONLY.split(",").includes(name)) continue;
        console.log(`\n${tag} · ${name}`);
        const P = await page(CDP);
        await P.device({ w: sz.w, h: sz.h, dpr: 2, top: sz.top, bottom: sz.bottom });
        try { await fn(P, tag); } catch (e) { ok(false, `${name} crashed: ${e.message.split("\n")[0]}`); }
        const E = errs(P);
        ok(E.length === 0, `no errors in ${name}` + (E.length ? ":\n        " + [...new Set(E)].slice(0, 5).join("\n        ") : ""));
        P.close();
      }
    }
  } finally { C.close(); srv.close(); }
  console.log(fails.length ? `\nSMOKE FAILED: ${fails.length} problem(s).` : "\nSMOKE PASSED.");
  process.exit(fails.length ? 1 : 0);
})();
