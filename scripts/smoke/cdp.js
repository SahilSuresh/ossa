// A tiny Chrome DevTools Protocol driver (Node 24: global WebSocket and fetch). No dependencies.
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function launch({ port = 9333, profile, headless = true, extra = [] } = {}) {
  profile = profile || path.join(require("os").tmpdir(), "ossa-smoke-chrome-" + port);
  fs.mkdirSync(profile, { recursive: true });
  const args = [
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check",
    "--hide-scrollbars", "--mute-audio", "--autoplay-policy=no-user-gesture-required", "--ignore-gpu-blocklist",
    "--enable-unsafe-swiftshader", "--window-size=600,1100", ...extra,
  ];
  if (headless) args.unshift("--headless=new");
  const proc = spawn(CHROME, args, { stdio: "ignore", detached: false });
  let ver = null;
  for (let i = 0; i < 80 && !ver; i++) { await sleep(150); try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch (e) {} }
  if (!ver) throw new Error("Chrome did not start");
  return { proc, port, close: () => { try { proc.kill(); } catch (e) {} } };
}

async function page(port) {
  const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pend = new Map(); const listeners = [];
  const logs = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(m.error.message + " " + (m.error.data || ""))) : res(m.result); }
    else if (m.method) {
      if (m.method === "Runtime.consoleAPICalled") logs.push(m.params.type + ": " + m.params.args.map(a => a.value !== undefined ? a.value : a.description).join(" "));
      if (m.method === "Runtime.exceptionThrown") logs.push("EXC: " + (m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description || m.params.exceptionDetails.text));
      listeners.forEach(f => f(m));
    }
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable"); try{ await send("Page.bringToFront"); }catch(e){}
  const P = {
    send, logs, sleep,
    on: f => listeners.push(f),
    async device({ w = 440, h = 956, dpr = 3, top = 62, bottom = 34 } = {}) {
      await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: dpr, mobile: true, screenWidth: w, screenHeight: h });
      await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
      try { await send("Emulation.setSafeAreaInsetsOverride", { insets: { top, bottom, left: 0, right: 0 } }); P.safe = true; } catch (e) { P.safe = false; P.safeErr = e.message; }
      await send("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-color-scheme", value: "dark" }, { name: "prefers-reduced-motion", value: "no-preference" }] });
    },
    async go(url, wait = 1500) {
      const loaded = new Promise(r => { const f = m => { if (m.method === "Page.loadEventFired") r(); }; listeners.push(f); });
      await send("Page.navigate", { url }); await Promise.race([loaded, sleep(15000)]); await sleep(wait);
    },
    async ev(expr, awaitPromise = true) {
      const r = await Promise.race([send("Runtime.evaluate", { expression: expr, awaitPromise, returnByValue: true, userGesture: true }), sleep(20000).then(() => { throw new Error("eval timed out (20 s): " + expr.slice(0, 80)); })]);
      if (r.exceptionDetails) throw new Error("eval: " + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text) + "\n--- in: " + expr.slice(0, 200));
      return r.result.value;
    },
    async tap(sel) {
      const box = await P.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; const r=e.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
      if (!box) throw new Error("no element " + sel);
      for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: box.x, y: box.y, button: "left", clickCount: 1 });
      return box;
    },
    async tapXY(x, y) { for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 }); },
    async shot(file, clip) {
      const p = { format: "png", captureBeyondViewport: false };
      if (clip) p.clip = { ...clip, scale: 1 };
      const r = await send("Page.captureScreenshot", p);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(r.data, "base64"));
      return file;
    },
    close() { try { ws.close(); } catch (e) {} fetch(`http://127.0.0.1:${port}/json/close/${t.id}`).catch(() => {}); },
  };
  return P;
}
module.exports = { launch, page, sleep };
