// Render an icon SVG: node render-icon.js <icon.svg> <outDir> [port]
// Writes <name>-1024.png (the App Store master, opaque) and <name>-sheet.png (the icon masked at home-screen sizes
// 180/120/60/40/29 on a dark and a light wallpaper, plus a greyscale "tinted" preview), so you can judge it small.
const fs = require("fs"), path = require("path");
const { launch, page, sleep } = require("./cdp");
(async () => {
  const [svgPath, outDir, portArg] = process.argv.slice(2);
  if (!svgPath || !outDir) { console.error("usage: node render-icon.js <icon.svg> <outDir> [port]"); process.exit(2); }
  const port = +portArg || 9400 + Math.floor(Math.random() * 400);
  const name = path.basename(svgPath).replace(/\.svg$/i, "");
  const svg = fs.readFileSync(svgPath, "utf8");
  fs.mkdirSync(outDir, { recursive: true });
  const C = await launch({ port, profile: path.join(__dirname, "prof-" + port) });
  const P = await page(port);
  try {
    await P.send("Emulation.setDeviceMetricsOverride", { width: 1024, height: 1024, deviceScaleFactor: 1, mobile: false });
    const html1 = `<!doctype html><html><head><style>html,body{margin:0;background:#000;width:1024px;height:1024px;overflow:hidden}svg{display:block;width:1024px;height:1024px}</style></head><body>${svg}</body></html>`;
    const f1 = path.join(outDir, name + "-page.html"); fs.writeFileSync(f1, html1);
    await P.go(require("url").pathToFileURL(f1).href, 600);
    const master = path.join(outDir, name + "-1024.png");
    await P.shot(master, { x: 0, y: 0, width: 1024, height: 1024 });
    const b64 = fs.readFileSync(master).toString("base64");
    const sizes = [180, 120, 60, 40, 29];
    const row = (bg, fg, label, filt) => `<div class="row" style="background:${bg};color:${fg}"><span class="lab">${label}</span>${sizes.map(s => `<div class="cell"><img src="data:image/png;base64,${b64}" style="width:${s}px;height:${s}px;border-radius:${(s * 0.2237).toFixed(1)}px;${filt || ""}"><small>${s}</small></div>`).join("")}</div>`;
    const html2 = `<!doctype html><html><head><style>html,body{margin:0;background:#111;font:600 14px system-ui}.row{display:flex;align-items:flex-end;gap:36px;padding:28px 36px;height:240px;box-sizing:border-box}.cell{display:flex;flex-direction:column;align-items:center;gap:8px}.lab{width:110px;align-self:center;opacity:.7}small{opacity:.6}img{display:block;box-shadow:0 1px 3px rgba(0,0,0,.35)}</style></head><body>
      ${row("linear-gradient(135deg,#1b2a3a,#0b0f14)", "#fff", "dark wallpaper")}
      ${row("linear-gradient(135deg,#e9e4da,#c9d3dc)", "#222", "light wallpaper")}
      ${row("linear-gradient(135deg,#222,#111)", "#fff", "tinted (grey)", "filter:grayscale(1) contrast(1.1)")}
    </body></html>`;
    await P.send("Emulation.setDeviceMetricsOverride", { width: 1000, height: 720, deviceScaleFactor: 2, mobile: false });
    const f2 = path.join(outDir, name + "-sheet.html"); fs.writeFileSync(f2, html2);
    await P.go(require("url").pathToFileURL(f2).href, 600);
    const sheet = path.join(outDir, name + "-sheet.png");
    await P.shot(sheet, { x: 0, y: 0, width: 1000, height: 720 });
    console.log(JSON.stringify({ master, sheet, logs: P.logs.slice(-5) }));
  } finally { P.close(); C.close(); }
})().catch(e => { console.error(e); process.exit(1); });
