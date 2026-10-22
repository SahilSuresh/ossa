// One headless Chrome page at iPhone 6.9" size (440x956 @3x, safe areas 62/34), driven over HTTP:
//   POST /ev      body = JS expression          -> JSON result (awaits promises)
//   GET  /shot?name=x[&sel=css]                 -> writes cap/x.png (full screen, or that element's box)
//   GET  /rect?sel=css                          -> the element's box in CSS px
//   GET  /seed[?spots=0]                        -> demo state, then reload
//   GET  /go?url=...                            -> navigate
//   GET  /tap?sel=css  |  /tapxy?x=&y=          -> a real mouse tap
//   GET  /logs                                  -> console errors and exceptions so far
const http = require("http"), fs = require("fs"), path = require("path"), { URL } = require("url");
const { launch, page, sleep } = require("./cdp");
const seed = require("./seed");
const BASE = "http://localhost:5178/";
(async () => {
  const C = await launch({ port: 9350, profile: path.join(__dirname, "prof-srv") });
  const P = await page(9350);
  await P.device();
  await P.send("Page.addScriptToEvaluateOnNewDocument", { source: require("./clock.js") });
  await P.send("Emulation.setTimezoneOverride", { timezoneId: process.env.TZID || "Asia/Tokyo" });
  await P.go(BASE, 2500);
  const doSeed = async (spots) => {
    await P.go(BASE, 2000);
    await P.ev(seed);
    if (spots === "0") await P.ev(`(()=>{ S.spots=[]; save(); })()`);
    delete require.cache[require.resolve("./tweak.js")]; await P.ev(require("./tweak.js"));
    await P.go(BASE, 4500);
    await P.ev(`window.__noSave=true; window.save=function(){}; 1`);
  };
  const rect = sel => P.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; const r=e.getBoundingClientRect(); return {x:r.left,y:r.top,width:r.width,height:r.height};})()`);
  http.createServer(async (req, res) => {
    const u = new URL(req.url, "http://x"); const q = Object.fromEntries(u.searchParams);
    const out = (code, v) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(v)); };
    try {
      let body = ""; for await (const ch of req) body += ch;
      if (u.pathname === "/ev") return out(200, await P.ev(body));
      if (u.pathname === "/cdp") return out(200, await P.send(q.m, body ? JSON.parse(body) : {}));
      if (u.pathname === "/dpr") { await P.device({ dpr: +q.v || 3 }); return out(200, "dpr " + (q.v || 3)); }
      if (u.pathname === "/seed") { await doSeed(q.spots); return out(200, "seeded"); }
      if (u.pathname === "/go") { await P.go(q.url || BASE, +(q.wait || 3000)); return out(200, "ok"); }
      if (u.pathname === "/rect") return out(200, await rect(q.sel));
      if (u.pathname === "/tap") return out(200, await P.tap(q.sel));
      if (u.pathname === "/tapxy") { await P.tapXY(+q.x, +q.y); return out(200, "ok"); }
      if (u.pathname === "/logs") return out(200, P.logs.filter(l => /EXC|error|warn/i.test(l)).slice(-40));
      if (u.pathname === "/shot") {
        let clip = null;
        if (q.sel) { const r = await rect(q.sel); if (!r) return out(404, "no " + q.sel); const pad = +(q.pad || 0); clip = { x: r.x - pad, y: r.y - pad, width: r.width + 2 * pad, height: r.height + 2 * pad }; }
        if (q.x) clip = { x: +q.x, y: +q.y, width: +q.w, height: +q.h };
        const f = await P.shot(path.join(__dirname, "cap", (q.name || "shot") + ".png"), clip);
        return out(200, { file: f, clip });
      }
      out(404, "?");
    } catch (e) { out(500, String(e && e.message || e)); }
  }).listen(9360, () => console.log("srv on 9360"));
})().catch(e => { console.error(e); process.exit(1); });
