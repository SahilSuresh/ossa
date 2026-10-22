// Ossa App Store frames: writes frames/NN-name.html for each slide (1320x2868). render-frames.js shoots them.
const fs = require("fs"), path = require("path"), { pathToFileURL } = require("url");
const CAP = f => pathToFileURL(path.join(__dirname, "cap", f)).href;
const FONTS = pathToFileURL("C:/Ossa/ossa-expo/web/ui/fonts.css").href;
const C = { bg: "#000", bone: "#F5F2EB", lime: "#D4FF00", gold: "#FFD700", cyan: "#00E5FF", t2: "rgba(245,242,235,.62)" };
// phone geometry: the 440x956pt screen drawn 1000px wide
const K = 1000 / 440, SW = 1000, SH = Math.round(956 * K), B = 22, SR = Math.round(60 * K), PW = SW + 2 * B, PH = SH + 2 * B, PTOP = 690;
fs.mkdirSync(path.join(__dirname, "frames"), { recursive: true });

const statusBar = (light = true) => {
  const c = light ? "#fff" : "#000";
  return `<div class="sb" style="color:${c}">
    <span class="tm">9:41</span>
    <span class="ic"><svg width="78" height="40" viewBox="0 0 78 40"><g fill="${c}"><rect x="0" y="26" width="13" height="12" rx="3"/><rect x="20" y="18" width="13" height="20" rx="3"/><rect x="40" y="10" width="13" height="28" rx="3"/><rect x="60" y="1" width="13" height="37" rx="3"/></g></svg>
    <svg width="56" height="40" viewBox="0 0 56 40"><g fill="${c}"><path d="M28 34.5l7.2-7.4a10.4 10.4 0 0 0-14.4 0z"/><path d="M28 17.6c5.5 0 10.5 2.1 14.2 5.6l4.3-4.4A26.6 26.6 0 0 0 28 11.4a26.6 26.6 0 0 0-18.5 7.4l4.3 4.4c3.7-3.5 8.7-5.6 14.2-5.6z"/><path d="M28 1.6C17.9 1.6 8.7 5.6 1.9 12.1l4.3 4.4A30.9 30.9 0 0 1 28 7.8c8.4 0 16.1 3.3 21.8 8.7l4.3-4.4A37 37 0 0 0 28 1.6z"/></g></svg>
    <svg width="92" height="40" viewBox="0 0 92 40"><rect x="2" y="5" width="78" height="31" rx="10" fill="none" stroke="${c}" stroke-opacity=".4" stroke-width="3"/><rect x="7" y="10" width="68" height="21" rx="6" fill="${c}"/><path d="M85 14v13c3-1 5-3.5 5-6.5S88 15 85 14z" fill="${c}" fill-opacity=".45"/></svg></span></div>`;
};
const phone = (img, o = {}) => `<div class="phone" style="top:${o.top || PTOP}px"><div class="scr"><img src="${CAP(img)}">${statusBar()}<i class="island"></i></div></div>`;
const chip = (img, o) => `<div class="chip" style="left:${o.x}px;top:${o.y}px;width:${o.w}px;border-radius:${o.r == null ? 56 : o.r}px;${o.rot ? `transform:rotate(${o.rot}deg);` : ""}${o.ring ? `box-shadow:0 0 0 3px ${o.ring},0 50px 110px rgba(0,0,0,.85);` : ""}${o.flat ? "box-shadow:none;" : ""}"><img src="${CAP(img)}"></div>`;
// a card lifted out of the phone: drawn over its own spot, scaled up (clip = its box in screen pt, r = its corner radius in pt)
const zoom = (img, cl, sc, r, ring) => { const X0 = 660 - SW / 2, Y0 = PTOP + B, w = cl.w * K, h = cl.h * K, W = w * sc, H = h * sc;
  return chip(img, { x: Math.round(X0 + cl.x * K + w / 2 - W / 2), y: Math.round(Y0 + cl.y * K + h / 2 - H / 2), w: Math.round(W), r: Math.round(r * K * sc), ring: ring || "rgba(212,255,0,.6)" }); };
const head = (l1, l2, key, sub) => `<h1 class="hd">${l1}<br><em style="${key}">${l2}</em></h1><p class="sub">${sub}</p>`;
const hex2 = a => Math.round(a * 255).toString(16).padStart(2, "0");
const glow = (col, y = 1500, a = 0.16) => `<div class="glow" style="background:radial-gradient(62% 30% at 50% ${y}px,${col}${hex2(a)},transparent 72%)"></div>`;

const CSS = `
@import url("${FONTS}");
html,body{margin:0;width:1320px;height:2868px;overflow:hidden;background:#000}
.c{position:relative;width:1320px;height:2868px;overflow:hidden;background:${C.bg};font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.glow{position:absolute;inset:0;pointer-events:none}
.hd{position:absolute;left:60px;right:60px;top:150px;margin:0;text-align:center;font-weight:900;font-size:152px;line-height:.96;letter-spacing:-.045em;color:${C.bone}}
.hd em{font-style:normal}
.sub{position:absolute;left:120px;right:120px;top:476px;margin:0;text-align:center;font-weight:500;font-size:46px;line-height:1.28;letter-spacing:-.012em;color:${C.t2};text-wrap:balance}
.phone{position:absolute;left:50%;margin-left:${-PW / 2}px;width:${PW}px;height:${PH}px;box-sizing:border-box;padding:${B}px;border-radius:${SR + B}px;
  background:linear-gradient(140deg,#5a5a5f 0%,#232325 14%,#0e0e0f 48%,#1b1b1d 80%,#4b4b50 100%);
  box-shadow:inset 0 0 0 2px rgba(255,255,255,.10),0 0 0 3px #050505,0 70px 160px rgba(0,0,0,.9)}
.scr{position:relative;width:${SW}px;height:${SH}px;border-radius:${SR}px;overflow:hidden;background:#000}
.scr img{display:block;width:${SW}px;height:${SH}px}
.island{position:absolute;left:50%;top:${Math.round(11 * K)}px;width:${Math.round(126 * K)}px;height:${Math.round(37 * K)}px;margin-left:${-Math.round(63 * K)}px;border-radius:999px;background:#000}
.sb{position:absolute;left:0;right:0;top:0;height:${Math.round(54 * K)}px;display:flex;align-items:center;justify-content:space-between;padding:${Math.round(6 * K)}px ${Math.round(30 * K)}px 0 ${Math.round(50 * K)}px;box-sizing:border-box}
.sb .tm{font-weight:650;font-size:${Math.round(17.5 * K)}px;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.sb .ic{display:flex;align-items:center;gap:${Math.round(6 * K)}px;transform:scale(.78);transform-origin:right center}
.chip{position:absolute;overflow:hidden;box-shadow:0 50px 110px rgba(0,0,0,.85),0 0 0 2px rgba(255,255,255,.06)}
.chip img{display:block;width:100%}
.pill{position:absolute;left:50%;transform:translateX(-50%);display:flex;gap:28px;align-items:center;padding:26px 44px;border-radius:999px;background:rgba(20,20,20,.88);box-shadow:0 0 0 2px rgba(255,255,255,.10),0 30px 80px rgba(0,0,0,.8);font-weight:700;font-size:38px;letter-spacing:-.01em;color:${C.bone};white-space:nowrap}
.pill i{width:12px;height:12px;border-radius:50%;background:${C.lime};display:block}
`;
const KEY = { lime: `color:${C.lime}`, gold: `color:${C.gold}`, cyan: `color:${C.cyan}`,
  stone: `background:linear-gradient(180deg,#e2dbcf 0%,#a89f91 50%,#6B6359 100%);-webkit-background-clip:text;background-clip:text;color:transparent` };

// ---------- slides ----------
const S = [];
// 1 hero: the ranked body, frameless, with real UI chips
{ const cx = 140, cy = 560, s = 1.1, ox = 88, oy = 640;            // crop origin in the capture, scale, placement
  const mx = ox + (795 - cx) * s, my = oy + (1803 - cy) * s;         // the weak-link marker on the shin
  S.push({ n: "01-body", html: `${glow(C.lime, 1500, .08)}
    <div style="position:absolute;left:${ox}px;top:${oy}px;width:${1040 * s}px;height:${1730 * s}px;overflow:hidden">
      <img src="${CAP("hero-body.png")}" style="position:absolute;left:${-cx * s}px;top:${-cy * s}px;width:${1320 * s}px;height:${2868 * s}px"></div>
    ${head("Your body.", "Ranked.", KEY.lime, "Every muscle ranked, from Fragile to Unbreakable.")}
    <svg style="position:absolute;left:0;top:0" width="1320" height="2868"><line x1="${mx}" y1="${my + 38}" x2="${mx}" y2="2540" stroke="${C.lime}" stroke-width="5"/><circle cx="${mx}" cy="${my}" r="34" fill="none" stroke="${C.lime}" stroke-width="5"/></svg>
    ${chip("chip-u-lvl.png", { x: 54, y: 690, w: 476, r: 0, flat: true })}
    ${chip("chip-u-rkrail.png", { x: 1000, y: 1880, w: 300, r: 0, flat: true })}
    ${chip("chip-u-weak.png", { x: 84, y: 2530, w: 1152, r: 66 })}` });
}
S.push({ n: "02-quest", html: `${glow(C.lime)}${head("Train today&rsquo;s", "quest.", KEY.lime, "Built from your week, your kit and what&rsquo;s recovered.")}${phone("train.png")}
  ${zoom("chip-quest.png", { x: 16, y: 144, w: 408, h: 178 }, 1.2, 28)}` });
S.push({ n: "03-workout", html: `${glow(C.lime)}${head("Every set", "counts.", KEY.lime, "Rank points count up live as you log.")}${phone("wk-c.png")}
  ${zoom("chip-wkmm.png", { x: 29, y: 377, w: 382, h: 84 }, 1.3, 14)}` });
// 4 rank-up: the real screen full-bleed, its top strip faded under the headline
S.push({ n: "04-rankup", html: `<img src="${CAP("r2-3-rank1.png")}" style="position:absolute;left:0;top:520px;width:1320px;height:2868px">
  <div style="position:absolute;left:0;right:0;top:0;height:1060px;background:linear-gradient(180deg,#000 0,#000 840px,rgba(0,0,0,0) 1060px)"></div>
  ${glow(C.gold, 1250, .10)}${head("Rank up", "every muscle.", KEY.gold, "Five ranks, three steps each. Ranks never drop.")}` });
S.push({ n: "05-level", html: `${glow(C.lime)}${head("Level up", "for life.", KEY.lime, "Your level only goes up, and unlocks more as it climbs.")}${phone("train-progress.png")}
  ${zoom("chip-dkhud.png", { x: 16, y: 112.19, w: 408, h: 87 }, 1.24, 20)}` });
S.push({ n: "06-stone", html: `${glow("#8C8478", 1600, .16)}${head("It starts", "as stone.", KEY.stone, "Answer a few questions and break it out.")}${phone("ob-0.png")}` });
S.push({ n: "07-focus", html: `${glow(C.cyan, 1700, .14)}${head("Train your", "mind too.", KEY.cyan, "Breathing, Monk Mode and an aura that grows.")}${phone("focus.png")}` });
S.push({ n: "08-look", html: `${glow("#cfd6e0", 1600, .12)}${head("Make it", "yours.", KEY.lime, "Finishes and materials for your whole body.")}${phone("look-chrome.png")}
  <div style="position:absolute;left:0;right:0;top:2380px;height:488px;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.94) 62%)"></div>
  <div class="pill" style="top:2706px"><i></i>No account<i></i>No ads<i></i>Stays on your phone</div>` });

for (const s of S) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="c">${s.html}</div></body></html>`;
  fs.writeFileSync(path.join(__dirname, "frames", s.n + ".html"), html);
}
console.log(S.map(s => s.n).join(" "));
