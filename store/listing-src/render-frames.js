// node render-frames.js [names...]  -> out/NN-name.png at 1320x2868
const fs = require("fs"), path = require("path"), { pathToFileURL } = require("url");
const { launch, page, sleep } = require("./cdp");
(async () => {
  const only = process.argv.slice(2);
  const files = fs.readdirSync(path.join(__dirname, "frames")).filter(f => f.endsWith(".html") && (!only.length || only.some(o => f.startsWith(o))));
  const C = await launch({ port: 9370, profile: path.join(__dirname, "prof-frames") });
  const P = await page(9370);
  try {
    await P.send("Emulation.setDeviceMetricsOverride", { width: 1320, height: 2868, deviceScaleFactor: 1, mobile: false });
    for (const f of files) {
      await P.go(pathToFileURL(path.join(__dirname, "frames", f)).href, 700);
      await P.ev("document.fonts.ready.then(()=>1)");
      await sleep(200);
      const out = path.join(__dirname, "out", f.replace(".html", ".png"));
      await P.shot(out, { x: 0, y: 0, width: 1320, height: 2868 });
      console.log("ok", out);
    }
    if (P.logs.length) console.log(P.logs.slice(-5).join("\n"));
  } finally { P.close(); C.close(); }
})().catch(e => { console.error(e); process.exit(1); });
