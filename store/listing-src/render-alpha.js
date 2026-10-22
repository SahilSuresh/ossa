// node render-alpha.js <in.svg> <out.png> [size]  -> a PNG with a transparent background (Android foreground, mono, splash)
const fs = require("fs"), path = require("path"), { pathToFileURL } = require("url");
const { launch, page } = require("./cdp");
(async () => {
  const [inp, out, sz] = process.argv.slice(2); const N = +sz || 1024;
  const svg = fs.readFileSync(inp, "utf8"); fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  const f = path.join(path.dirname(out), path.basename(out, ".png") + "-alpha.html");
  fs.writeFileSync(f, `<!doctype html><html><head><style>html,body{margin:0;background:transparent;width:${N}px;height:${N}px;overflow:hidden}svg{display:block;width:${N}px;height:${N}px}</style></head><body>${svg}</body></html>`);
  const C = await launch({ port: 9380, profile: path.join(__dirname, "prof-alpha") });
  const P = await page(9380);
  try {
    await P.send("Emulation.setDeviceMetricsOverride", { width: N, height: N, deviceScaleFactor: 1, mobile: false });
    await P.send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
    await P.go(pathToFileURL(f).href, 600);
    await P.shot(out, { x: 0, y: 0, width: N, height: N });
    fs.unlinkSync(f);
    console.log("ok", out);
  } finally { P.close(); C.close(); }
})().catch(e => { console.error(e); process.exit(1); });
