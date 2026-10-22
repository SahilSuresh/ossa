// The overview for Andrej: the 8 slides in store order + the icon at 1024/180/60/29 on dark and light. -> store/listing-v3-overview.png
const fs = require("fs"), path = require("path"), { pathToFileURL } = require("url");
const { launch, page } = require("./cdp");
const R = "C:/Ossa/ossa-expo";
const u = p => pathToFileURL(p).href;
const shots = ["01-body", "02-quest", "03-workout", "04-rankup", "05-level", "06-stone", "07-focus", "08-look"].map(n => u(`${R}/store/screenshots-6.9in-v3/${n}.png`));
const ico = u(`${R}/assets/icon.png`), alt = u(`${R}/store/icon/alternates/level-ring-1024.png`);
const W = 2600, H = 1640;
const icons = (src, bg, fg) => `<div class="ir" style="background:${bg};color:${fg}">${[180, 120, 60, 40, 29].map(s => `<figure><img src="${src}" style="width:${s}px;height:${s}px;border-radius:${(s * .2237).toFixed(1)}px"><figcaption>${s}</figcaption></figure>`).join("")}</div>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@import url("${u(R + "/web/ui/fonts.css")}");
html,body{margin:0;width:${W}px;height:${H}px;background:#0b0b0c;color:#F5F2EB;font-family:Inter,system-ui,sans-serif}
.wrap{padding:56px 64px}
h1{margin:0 0 6px;font-weight:900;font-size:56px;letter-spacing:-.03em}
h1 em{font-style:normal;color:#D4FF00}
p.s{margin:0 0 36px;font-size:24px;color:#9CA3AF}
.row{display:flex;gap:22px}
.row figure{margin:0;display:flex;flex-direction:column;gap:10px;align-items:center}
.row img.sh{width:291px;height:632px;border-radius:18px;box-shadow:0 0 0 1px #222}
figcaption{font-size:20px;color:#9CA3AF;font-weight:600}
.ic{display:flex;gap:44px;margin-top:48px;align-items:flex-start}
.big{display:flex;flex-direction:column;gap:12px}
.big img{width:300px;height:300px;border-radius:67px}
.lab{font-size:24px;font-weight:800}.lab small{display:block;font-weight:500;color:#9CA3AF;font-size:19px;margin-top:4px}
.ir{display:flex;gap:30px;align-items:flex-end;padding:22px 30px;border-radius:24px}
.ir figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:8px}
.ir figcaption{font-size:17px;opacity:.7}
.col{display:flex;flex-direction:column;gap:16px}
.alt img{width:150px;height:150px;border-radius:34px}
</style></head><body><div class="wrap">
<h1>Ossa · new App Store listing <em>v3</em></h1>
<p class="s">Eight screenshots in store order (6.9" masters; the 6.3" set is identical), the new icon at home-screen sizes, and the runner-up. Nothing uploaded to Apple.</p>
<div class="row">${shots.map((s, i) => `<figure><img class="sh" src="${s}"><figcaption>${i + 1}</figcaption></figure>`).join("")}</div>
<div class="ic">
  <div class="big"><img src="${ico}"><div class="lab">Breakout Hex<small>New icon: the rank hex in stone, lime light breaking out</small></div></div>
  <div class="col">${icons(ico, "linear-gradient(135deg,#1b2a3a,#0b0f14)", "#fff")}${icons(ico, "linear-gradient(135deg,#e9e4da,#c9d3dc)", "#222")}</div>
  <div class="big alt"><img src="${alt}"><div class="lab">Level Ring<small>Runner-up, kept as<br>an alternate</small></div></div>
</div></div></body></html>`;
(async () => {
  const f = path.join(__dirname, "overview.html"); fs.writeFileSync(f, html);
  const C = await launch({ port: 9390, profile: path.join(__dirname, "prof-ov") });
  const P = await page(9390);
  try {
    await P.send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
    await P.go(u(f), 900); await P.ev("document.fonts.ready.then(()=>1)");
    await P.shot(`${R}/store/listing-v3-overview.png`, { x: 0, y: 0, width: W, height: H });
    console.log("ok");
  } finally { P.close(); C.close(); }
})().catch(e => { console.error(e); process.exit(1); });
