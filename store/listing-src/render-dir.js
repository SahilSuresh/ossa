// node render-dir.js <framesDir> <outDir> [names...]  (render frames from any folder)
const fs = require("fs"), path = require("path"), { pathToFileURL } = require("url");
const { launch, page, sleep } = require("./cdp");
(async () => {
  const [fd, od, ...only] = process.argv.slice(2);
  const FD = path.resolve(fd), OD = path.resolve(od); fs.mkdirSync(OD, { recursive: true });
  const files = fs.readdirSync(FD).filter(f => f.endsWith(".html") && (!only.length || only.some(o => f.startsWith(o))));
  const C = await launch({ port: 9372, profile: path.join(__dirname, "prof-dir") });
  const P = await page(9372);
  try {
    await P.send("Emulation.setDeviceMetricsOverride", { width: 1320, height: 2868, deviceScaleFactor: 1, mobile: false });
    for (const f of files) {
      await P.go(pathToFileURL(path.join(FD, f)).href, 700);
      await P.ev("document.fonts.ready.then(()=>1)"); await sleep(200);
      await P.shot(path.join(OD, f.replace(".html", ".png")), { x: 0, y: 0, width: 1320, height: 2868 });
      console.log("ok", f);
    }
  } finally { P.close(); C.close(); }
})().catch(e => { console.error(e); process.exit(1); });
