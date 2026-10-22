// The weather-dare safety check (Ossa 2.0 Phase 6 "Challenge", package: gate). Read-only: it writes nothing.
// It fails (exit 1) if ANY severe case gives an outdoor dare, and proves the app runs the tested code.
//   Stage A  the gate alone: web/ui/wxgate.js in an empty vm context, fed real summaries that
//            native/weather.js trim() + summarise() make from synthetic MET JSON (Nordic and global shapes).
//            Every severe case must give no outdoor dare (indoor or none); the positive controls must still
//            give one, so the gate can't pass by refusing everything; KNOWN limits print, never fail.
//            A light sweep (15 places on their own phone zone, a year of days, every 10 minutes) checks that a
//            walk never starts in the dark or outside 06:00-21:00, near midnight included.
//            Also the fixtures' shape and the copy.
//   Stage B  the real pick: dares.js + wxgate.js in one sandbox holding exactly the engine's allowance
//            (dkey, waterToday, RD_WGOAL, hOn, hSteps and nvKey loaded from source; the rest stubbed). Also the
//            engine's round-2 fixes: "Checking the forecast…" clears on every path, a dare picked before the
//            phone answers hello is never drawn as a walk, and yesterday's weather dare can't be finished.
//   Stage C  dwSun === weather.js sun() over 980 seeded timestamps.
//   Stage D  purity (acorn): wxgate.js is dw* function declarations only, with no host globals and no clock;
//            dares.js holds only function declarations and try-wrapped IIFEs at the top level, and its §3.4
//            functions use only the allowance (TYPEOF_ONLY names behind a guard, never mindState()).
//   Stage E  ossaHtml.js and web/.preview.html hold the CURRENT wxgate.js and dares.js, in order.
//   Stage F  nothing else declares or reassigns the gate's or the engine's names (plainly, or through
//            window / globalThis / self, Object.assign, defineProperty, Reflect.set); no DARE_LIFE anywhere.
// Run: node scripts/build-html.js && node scripts/check-dares.js
//      (--gate: only the gate's part, Stages A, C, D and F, while dares.js is being built)
// Node prints a harmless MODULE_TYPELESS_PACKAGE_JSON warning when it imports native/weather.js.
"use strict";
process.env.TZ = "Europe/London"; // the host clock matches the pinned phone zone (dkey, dwClock)
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { pathToFileURL } = require("url");
const ROOT = path.join(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const GATE_ONLY = process.argv.includes("--gate");
const HOUR = 36e5, MIN = 6e4, DAY = 864e5;
const T = Date.UTC(2026, 9, 17, 11, 0); // Saturday 17 Oct 2026, 12:00 BST in London
const LDN = "51.51,-0.13";

/* The engine's global allowance (brief §3.4), in one place. Stage B's sandbox holds exactly ALLOW_LOADED (from
   source) + ALLOW_STUBBED, and Stage D checks statically that the §3.4 functions (ENGINE_ROOTS), everything they
   call in dares.js and the include-time code use nothing else, except TYPEOF_ONLY names behind a typeof guard (or
   inside a try in the same function), and never mindState(). A name the engine needs: add it here and to Stage B. */
const ALLOW_LOADED = ["dkey", "waterToday", "RD_WGOAL", "hOn", "hSteps", "nvKey"]; // and every dw* (wxgate.js)
const ALLOW_STUBBED = ["S", "save", "track", "toast", "hap", "vxOn", "vxHooks", "vxEmit", "NATIVE", "nvWeather", "nvLocate", "GLORDER", "MUSCLES",
  "stateOf", "daysSince", "rkFlagged", "rkSay", "fkg", "location", "document", "setTimeout", "clearTimeout", "console"]; // and the sandbox's own Date
const TYPEOF_ONLY = ["nvReady", "brPlaySync", "healthPoll", "TAB", "RDBR", "uiFocusOpen", "closePanels", "rdPlaySession", "mobilitySession", "uiWaterAdd", "Pulse",
  "troLine", "dpOpen", "wpOpen", "uiEsc", "UI_IC", "renderToday", "vxDayCheck", "addWater", "rdWaterLog"];
const ENGINE_ROOTS = ["dareToday", "drApply", "drCanAccept", "drAccept", "drRefresh", "drWx", "drView", "drRows", "drCheck"];

let fails = 0;
const N = { severe: 0, severeBad: 0, control: 0, controlBad: 0, known: 0, handled: 0, b: 0, bBad: 0, sweep: 0, sweepBad: 0 };
const show = x => (x === null ? "null" : x === undefined ? "-" : String(x));
const utc = t => (Number.isFinite(t) ? new Date(t).toISOString().slice(5, 16).replace("T", " ") + "Z" : String(t));
const line = (tag, name, id, why, more) => console.log(`${tag.padEnd(5)} ${name} → ${show(id)} / ${show(why)}${more ? "  (" + more + ")" : ""}`);
const fail = m => { fails++; console.log("FAIL  " + m); };
const stage = t => console.log(`\n== ${t} ==`);

/* ---------- source helpers, copied from scripts/check-exdata.js (scan, constOf, fnOf) ---------- */
/* Bracket matching from src[i] (strings and comments skipped). toEnd=false: src[i] is an opening
   bracket, return up to its match. toEnd=true: return the expression up to a ; or line end at depth 0. */
function scan(src, i, toEnd) {
  let depth = 0;
  const start = i;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") { const q = c; i++; while (i < src.length && src[i] !== q) { if (src[i] === "\\") i++; i++; } continue; }
    if (c === "/" && src[i + 1] === "/") { while (i < src.length && src[i] !== "\n") i++; i--; continue; }
    if (c === "/" && src[i + 1] === "*") { i = src.indexOf("*/", i + 2) + 1; continue; }
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") { depth--; if (depth === 0 && !toEnd) return src.slice(start, i + 1); }
    else if (toEnd && depth === 0 && (c === ";" || c === "\n")) return src.slice(start, i);
  }
  throw new Error("unterminated literal");
}
/* the value of a top-level `const NAME = …` */
function constOf(src, name) {
  const m = new RegExp("^const\\s+" + name + "\\s*=\\s*", "m").exec(src);
  if (!m) throw new Error("no `const " + name + "`");
  const at = m.index + m[0].length;
  return scan(src, at, !/[\[{]/.test(src[at]));
}
/* the whole `function NAME(…){…}` */
function fnOf(src, name) {
  const m = new RegExp("^function\\s+" + name + "\\s*\\(", "m").exec(src);
  if (!m) throw new Error("no `function " + name + "`");
  const paren = m.index + m[0].length - 1, body = src.indexOf("{", paren + scan(src, paren, false).length);
  return src.slice(m.index, body) + scan(src, body, false);
}

/* ---------- the sources (the two mesh lines in ossa.html are megabytes of base64: blank them) ---------- */
const html = read("web/ossa.html").split("\n").map(l => (l.length < 200000 ? l : "")).join("\n");
const gateSrc = read("web/ui/wxgate.js");
const daresSrc = read("web/ui/dares.js");
const nativeSrc = read("web/ui/native.js");
let acorn = null;
try { acorn = require("acorn"); } catch (e) { /* Stage D fails below */ }

/* the gate, alone, in an empty context: any host global it touched would throw here */
const G = vm.createContext({});
let gateOk = true;
try { vm.runInContext(gateSrc, G, { filename: "web/ui/wxgate.js" }); }
catch (e) { gateOk = false; fail(`web/ui/wxgate.js doesn't load in an empty context: ${e.message}`); }

/* ---------- synthetic MET Locationforecast /complete JSON → weather.js trim() + summarise() ---------- */
let W = null;
const DEF = { temp: 12, wind: 3, gust: 5, fogf: 0, sym: "cloudy", pr: 0, thp: 0 };
const RAINY = { sym: "lightrain", temp: 9, pr: 0.6 };
/* steps: hourly from the current hour. Nordic carries wind_speed_of_gust, probability_of_thunder and
   fog_area_fraction; global (the UK) carries none of them. noPr / noWind leave that field out. */
function metJson(t0, steps, nordic) {
  return { type: "Feature", properties: { meta: { updated_at: new Date(t0).toISOString() }, timeseries: steps.map((s, i) => {
    const det = { air_temperature: s.temp };
    if (!s.noWind) det.wind_speed = s.wind;
    if (nordic) { det.wind_speed_of_gust = s.gust; det.fog_area_fraction = s.fogf; }
    const n1 = {};
    if (!s.noPr) n1.precipitation_amount = s.pr;
    if (nordic) n1.probability_of_thunder = s.thp;
    return { time: new Date(t0 + i * HOUR).toISOString(), data: { instant: { details: det }, next_1_hours: { summary: { symbol_code: s.sym }, details: n1 } } };
  }) } };
}
/* a real summary: base applies to every hour, hours[i] overrides hour i (0 = the current hour) */
function reading(o) {
  const now = o.now == null ? T : o.now, key = o.key || LDN;
  const t0 = Math.floor(now / HOUR) * HOUR;
  const steps = Array.from({ length: 8 }, (_, i) => Object.assign({}, DEF, o.base || {}, (o.hours || {})[i] || {}));
  const series = W.trim(metJson(t0, steps, !!o.nordic));
  const at = now - (o.age == null ? 5 * MIN : o.age);
  return W.summarise({ key, at, exp: at + HOUR, upd: null, series }, now);
}
const ctx = (now, o) => Object.assign({ tz: 60, src: "typed", placeAt: now, sumAt: now }, o || {});
const SEVERE = []; // every severe case, for Stage B's dareToday() run

function severe(name, w, now, key, c, whys) {
  N.severe++;
  SEVERE.push({ name, w, now, key, c });
  let ch, g, more = "";
  try { ch = G.dwChoose(w, now, key, c); g = G.dwCheck(w, now, key, c); }
  catch (e) { N.severeBad++; fail(`severe · ${name}: the gate threw ${e.message}`); return; }
  let ok = (ch.id === null || ch.id === "indoor") && g.out === false;
  if (!ok) more = "AN OUTDOOR DARE";
  else if (whys && !whys.includes(ch.why)) { ok = false; more = `no outdoor dare, but by the wrong rule: expected ${whys.join("|")}`; }
  if (!ok) { N.severeBad++; fails++; }
  line(ok ? "PASS" : "FAIL", "severe · " + name, ch.id, ch.why, more || `light ${g.light}, out ${g.out}`);
}
function control(name, w, now, key, c, exp) {
  N.control++;
  let ch, g;
  try { ch = G.dwChoose(w, now, key, c); g = G.dwCheck(w, now, key, c); }
  catch (e) { N.controlBad++; fail(`control · ${name}: the gate threw ${e.message}`); return; }
  const errs = [];
  if ("id" in exp && ch.id !== exp.id) errs.push(`expected ${show(exp.id)}`);
  if ("why" in exp && ch.why !== exp.why) errs.push(`expected why ${show(exp.why)}`);
  for (const k of ["out", "light", "here", "fresh", "recent", "use"]) if (k in exp && g[k] !== exp[k]) errs.push(`${k} ${g[k]}, expected ${exp[k]}`);
  if ("from" in exp && !(Number.isFinite(g.from) && Math.abs(g.from - exp.from) <= MIN)) errs.push(`from ${utc(g.from)}, expected ${utc(exp.from)} (within a minute)`);
  if (errs.length) { N.controlBad++; fails++; }
  line(errs.length ? "FAIL" : "PASS", "control · " + name, ch.id, ch.why, errs.length ? errs.join("; ") : `light ${g.light}, out ${g.out}`);
}
/* dwLight on its own (what the engine's dark warn reads): it must say "late" or "night" */
function darkLight(name, lat, lon, now, c, w) {
  N.severe++;
  let L;
  try { L = G.dwLight(lat, lon, now, c, w); }
  catch (e) { N.severeBad++; fail(`severe · ${name}: dwLight threw ${e.message}`); return; }
  const ok = L.light === "late" || L.light === "night";
  if (!ok) { N.severeBad++; fails++; }
  line(ok ? "PASS" : "FAIL", "severe · " + name, "dwLight", L.light, ok ? "" : `the walk could start${L.from != null ? " at " + utc(L.from) : ""}: expected late or night`);
}
function known(name, w, now, key, c, expId) {
  const ch = G.dwChoose(w, now, key, c);
  if (ch.id === null || ch.id === "indoor") { N.handled++; line("PASS", `known · ${name} (now handled)`, ch.id, ch.why); }
  else { N.known++; line("KNOWN", `known · ${name}`, ch.id, ch.why, ch.id === expId ? "the summary can't show it" : `expected ${expId}`); }
}

/* The light, swept: 15 places on their own phone zone (the offset at each instant, from Intl), the 1st and 15th
   of every month of 2026, every 10 minutes, each with no reading, with the reading made then and with one made
   2 h 50 min earlier. Whatever the sun formula, these must hold (a 15-minute walk):
     - after 20:45 on the phone: late or night (the walk would end after 21:00)
     - before 06:00: pre or night
     - the sun is down and it's afternoon or evening on the phone: late or night (never "pre" for tomorrow)
     - "day": the sun is up now and still up an hour later (the walk, then the 45 minutes before sunset)
     - "pre": the walk can start at `from`, today (06:00-21:00 on the phone), with the sun up then.
   "The sun is up at t" is weather.js sun(lat, lon, t).dark, which is right at any t (it only picks which day's
   times to compare with), so the truth doesn't share the gate's choice of day. */
function sweepLight() {
  const PL = [["London", 51.51, -0.13, "Europe/London"], ["Edinburgh", 55.95, -3.19, "Europe/London"], ["Madrid", 40.42, -3.70, "Europe/Madrid"],
    ["Warsaw", 52.23, 21.01, "Europe/Warsaw"], ["Budapest", 47.50, 19.04, "Europe/Budapest"], ["Stockholm", 59.33, 18.07, "Europe/Stockholm"],
    ["Luleå", 65.58, 22.15, "Europe/Stockholm"], ["Tromsø", 69.65, 18.96, "Europe/Oslo"], ["Reykjavík", 64.15, -21.94, "Atlantic/Reykjavik"],
    ["New York", 40.71, -74.01, "America/New_York"], ["Tokyo", 35.68, 139.69, "Asia/Tokyo"], ["Kolkata", 22.57, 88.36, "Asia/Kolkata"],
    ["Kashgar", 39.47, 75.99, "Asia/Shanghai"], ["Brisbane", -27.47, 153.03, "Australia/Brisbane"], ["Sydney", -33.87, 151.21, "Australia/Sydney"]];
  const WALK = 15;
  const hhmm = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  let n = 0, bad = 0;
  for (const [name, lat, lon, zone] of PL) {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" });
    const tzAt = t => { const p = {}; for (const x of fmt.formatToParts(t)) p[x.type] = x.value; return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - t) / MIN); };
    const up = t => !W.sun(lat, lon, t).dark;
    for (let mo = 0; mo < 12; mo++) for (const d of [1, 15]) {
      const start = Date.UTC(2026, mo, d) - tzAt(Date.UTC(2026, mo, d, 12)) * MIN;
      for (let k = 0; k < 144; k++) {
        const t = start + k * 10 * MIN, tz = tzAt(t);
        const loc = ((Math.round(t / MIN) + tz) % 1440 + 1440) % 1440, day0 = t - loc * MIN;
        const c = { tz, src: "typed", placeAt: t, sumAt: t, m: WALK };
        for (const [wn, w] of [["no reading", null], ["a reading made then", W.sun(lat, lon, t)], ["a reading made 2 h 50 min earlier", W.sun(lat, lon, t - 170 * MIN)]]) {
          n++;
          let L, errs = [];
          try { L = G.dwLight(lat, lon, t, c, w); } catch (e) { L = { light: "threw" }; errs.push(e.message); }
          const dusk = L.light === "late" || L.light === "night";
          if (loc > 21 * 60 - WALK && !dusk) errs.push(`a ${WALK}-minute walk would end after 21:00`);
          if (loc < 6 * 60 && L.light !== "pre" && L.light !== "night") errs.push("it's before 06:00");
          if (loc >= 12 * 60 && !up(t) && !dusk) errs.push("the sun has set for today");
          if (L.light === "day" && !(up(t) && up(t + (WALK + 44) * MIN))) errs.push("the sun isn't up for the walk and the 45 minutes after it");
          if (L.light === "pre" && !(L.from > t && L.from >= day0 + 6 * HOUR && L.from < day0 + 21 * HOUR && up(L.from + 2 * MIN))) errs.push(`"pre" points at ${utc(L.from)}, not a time today with the sun up`);
          if (errs.length) { bad++; if (bad <= 8) fail(`light sweep · ${name} ${d} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][mo]} ${hhmm(loc)} (tz ${tz}, ${wn}): ${L.light}: ${errs.join("; ")}`); }
        }
      }
    }
  }
  N.sweep += n; N.sweepBad += bad;
  if (bad > 8) fail(`light sweep: ${bad - 8} more`);
  console.log(`${bad ? "FAIL" : "PASS "} light sweep: ${n - bad} of ${n} (15 places on their own phone zone, 24 days of 2026, every 10 minutes, 3 reading states)`);
}

function stageA() {
  stage("Stage A: the gate (wxgate.js alone, real weather.js summaries)");
  const SH = [["global", false], ["Nordic", true]];
  const sunL = W.sun(51.51, -0.13, T);

  /* baselines: the hazard-free versions of the cases below are outdoor dares */
  control("baseline light rain 9 °C (global)", reading({ base: RAINY }), T, LDN, ctx(T), { id: "rain", out: true });
  control("baseline light rain 9 °C, wind 6, gust 9 (Nordic)", reading({ base: Object.assign({}, RAINY, { wind: 6, gust: 9 }), nordic: true }), T, LDN, ctx(T), { id: "rain", out: true });
  control("baseline fair 15 °C (Nordic)", reading({ base: { sym: "fair_day", temp: 15 }, nordic: true }), T, LDN, ctx(T), { id: "bright", out: true });
  control("baseline cloudy 6 °C dry (global)", reading({ base: { temp: 6 } }), T, LDN, ctx(T), { id: "cold", out: true });

  /* thunder */
  for (const [sh, nd] of SH) for (const code of ["rainandthunder", "lightrainshowersandthunder_day", "heavysleetandthunder", "snowandthunder", "lightssleetshowersandthunder_day", "lightssnowshowersandthunder_day"]) {
    severe(`thunder ${code} now (${sh})`, reading({ base: RAINY, hours: { 0: { sym: code } }, nordic: nd }), T, LDN, ctx(T), ["thunder"]);
    severe(`thunder ${code} in 1 h (${sh})`, reading({ base: RAINY, hours: { 1: { sym: code } }, nordic: nd }), T, LDN, ctx(T), ["thunder"]);
  }
  severe("thunder probability 30 % now, fair 15 °C (Nordic)", reading({ base: { sym: "fair_day", temp: 15 }, hours: { 0: { thp: 30 } }, nordic: true }), T, LDN, ctx(T), ["thunder"]);
  severe("thunder probability 30 % in 2 h, fair 15 °C (Nordic)", reading({ base: { sym: "fair_day", temp: 15 }, hours: { 2: { thp: 30 } }, nordic: true }), T, LDN, ctx(T), ["thunder"]);

  /* gusts and wind (13.9 m/s = 50 km/h) */
  const RW = Object.assign({}, RAINY, { wind: 6, gust: 9 });
  for (const [h, when] of [[0, "now"], [1, "in 1 h"]]) {
    severe(`gust 13.9 exactly ${when} (Nordic)`, reading({ base: RW, hours: { [h]: { gust: 13.9 } }, nordic: true }), T, LDN, ctx(T), ["gust"]);
    severe(`gust 16 ${when} (Nordic)`, reading({ base: RW, hours: { [h]: { gust: 16 } }, nordic: true }), T, LDN, ctx(T), ["gust"]);
    severe(`wind 8.7, no gust: 8.7 × 1.6 = 13.92 ${when} (global)`, reading({ base: RAINY, hours: { [h]: { wind: 8.7 } } }), T, LDN, ctx(T), ["gust"]);
    severe(`mean wind 10.8, gust 12 ${when} (Nordic)`, reading({ base: RW, hours: { [h]: { wind: 10.8, gust: 12 } }, nordic: true }), T, LDN, ctx(T), ["wind"]);
    severe(`mean wind 10.8 ${when} (global)`, reading({ base: RAINY, hours: { [h]: { wind: 10.8 } } }), T, LDN, ctx(T), ["gust", "wind"]);
  }

  /* heavy rain */
  for (const [sh, nd] of SH) {
    for (const code of ["heavyrain", "heavyrainshowers_day"]) {
      severe(`${code} now (${sh})`, reading({ base: RAINY, hours: { 0: { sym: code, pr: 2 } }, nordic: nd }), T, LDN, ctx(T), ["heavy"]);
      severe(`${code} in 1 h (${sh})`, reading({ base: RAINY, hours: { 1: { sym: code, pr: 2 } }, nordic: nd }), T, LDN, ctx(T), ["heavy"]);
    }
    severe(`4 mm in the current hour, rain 9 °C (${sh})`, reading({ base: Object.assign({}, RAINY, { sym: "rain" }), hours: { 0: { pr: 4 } }, nordic: nd }), T, LDN, ctx(T), ["heavy"]);
    severe(`10.2 mm over 3 h, 3.4 an hour (${sh})`, reading({ base: { sym: "rain", temp: 9, pr: 3.4 }, nordic: nd }), T, LDN, ctx(T), ["heavy"]);
    severe(`10.2 mm over 3 h, light now and 4.8 mm in 1 h and 2 h (${sh})`, reading({ base: RAINY, hours: { 1: { sym: "rain", pr: 4.8 }, 2: { sym: "rain", pr: 4.8 } }, nordic: nd }), T, LDN, ctx(T), ["heavy"]);
  }

  /* snow and sleet (any, not only heavy), at 9 °C so the symbol rule is the one tested */
  for (const [sh, nd] of SH) {
    for (const code of ["lightsnow", "snow", "heavysnow", "snowshowers_day"]) {
      severe(`${code} now (${sh})`, reading({ base: RAINY, hours: { 0: { sym: code } }, nordic: nd }), T, LDN, ctx(T), ["snow"]);
      severe(`${code} in 1 h (${sh})`, reading({ base: RAINY, hours: { 1: { sym: code } }, nordic: nd }), T, LDN, ctx(T), ["snow"]);
    }
    for (const code of ["lightsleet", "sleet", "sleetshowers_day"]) {
      severe(`${code} now (${sh})`, reading({ base: RAINY, hours: { 0: { sym: code } }, nordic: nd }), T, LDN, ctx(T), ["ice"]);
      severe(`${code} in 1 h (${sh})`, reading({ base: RAINY, hours: { 1: { sym: code } }, nordic: nd }), T, LDN, ctx(T), ["ice"]);
    }
  }

  /* freezing and ice */
  for (const [sh, nd] of SH) {
    for (const t of [0, -0.1, -5]) severe(`${t} °C, clear and dry (${sh})`, reading({ base: { sym: "clearsky_day", temp: t }, nordic: nd }), T, LDN, ctx(T), ["freeze"]);
    severe(`2 °C, clear and dry (${sh})`, reading({ base: { sym: "clearsky_day", temp: 2 }, nordic: nd }), T, LDN, ctx(T), ["ice"]);
    severe(`3 °C, cloudy, 0.1 mm now (${sh})`, reading({ base: { temp: 3 }, hours: { 0: { pr: 0.1 } }, nordic: nd }), T, LDN, ctx(T), ["ice"]);
    severe(`3 °C, dry now, 0.3 mm in 1 h (${sh})`, reading({ base: { temp: 3 }, hours: { 1: { pr: 0.3 } }, nordic: nd }), T, LDN, ctx(T), ["ice"]);
    severe(`5 °C light rain, precipitation_amount missing (${sh})`, reading({ base: { sym: "lightrain", temp: 5, noPr: true }, nordic: nd }), T, LDN, ctx(T), ["ice"]);
    /* the rain shows only in soon.symbol (its amount missing reads 0 mm): dry now, so only the symbol says wet */
    severe(`cloudy 4 °C dry now, lightrain in 1-2 h with no precipitation amount (${sh})`, reading({ base: { temp: 4 }, hours: { 1: { sym: "lightrain", noPr: true }, 2: { sym: "lightrain", noPr: true } }, nordic: nd }), T, LDN, ctx(T), ["ice"]);
    severe(`cloudy 4 °C dry now, lightrainshowers in 1 h with no precipitation amount (${sh})`, reading({ base: { temp: 4 }, hours: { 1: { sym: "lightrainshowers_day", noPr: true } }, nordic: nd }), T, LDN, ctx(T), ["ice"]);
    /* mixed sequences: sleet or snow hidden behind rain in soon.symbol, caught by wet ice at ≤ 5 °C */
    severe(`rain now, lightsleet in 1 h, 4 °C (${sh})`, reading({ base: { sym: "rain", temp: 4, pr: 1 }, hours: { 1: { sym: "lightsleet", pr: 0.5 } }, nordic: nd }), T, LDN, ctx(T), ["ice"]);
    severe(`rain now, lightsnow in 1 h, 4.5 °C (${sh})`, reading({ base: { sym: "rain", temp: 4.5, pr: 1 }, hours: { 1: { sym: "lightsnow", pr: 0.5 } }, nordic: nd }), T, LDN, ctx(T), ["ice"]);
    severe(`rain now, sleet in 2 h, 5 °C (${sh})`, reading({ base: { sym: "rain", temp: 5, pr: 1 }, hours: { 2: { sym: "sleet", pr: 0.8 } }, nordic: nd }), T, LDN, ctx(T), ["ice"]);
  }

  /* fog (cloudy 6 °C dry is a cold walk without it) */
  for (const [sh, nd] of SH) {
    severe(`fog symbol now, 6 °C (${sh})`, reading({ base: { temp: 6 }, hours: { 0: { sym: "fog" } }, nordic: nd }), T, LDN, ctx(T), ["fog"]);
    severe(`cloudy now, fog symbol in 1 h, 6 °C (${sh})`, reading({ base: { temp: 6 }, hours: { 1: { sym: "fog" } }, nordic: nd }), T, LDN, ctx(T), ["fog"]);
  }
  severe("fog_area_fraction 60 now, cloudy 6 °C (Nordic)", reading({ base: { temp: 6 }, hours: { 0: { fogf: 60 } }, nordic: true }), T, LDN, ctx(T), ["fog"]);

  /* heat */
  for (const [sh, nd] of SH) for (const t of [30, 34]) severe(`${t} °C, clear (${sh})`, reading({ base: { sym: "clearsky_day", temp: t }, nordic: nd }), T, LDN, ctx(T), ["hot"]);

  /* the dark (light rain 9 °C, London 17 Oct) */
  const set = sunL.set, rise = sunL.rise;
  for (const [n, dt, cm] of [["30 min before sunset", -30, undefined], ["55 min before sunset, a 15-minute walk", -55, 15], ["55 min before sunset, walk length unknown", -55, undefined], ["30 min after sunset", 30, undefined]]) {
    const now = set + dt * MIN;
    severe(`${n} (${G.dwClock(now)}, sunset ${G.dwClock(set)})`, reading({ now, base: RAINY }), now, LDN, ctx(now, { m: cm }), ["dark"]);
  }
  const tromso = Date.UTC(2026, 11, 21, 11, 0); // 21 Dec 12:00 CET, polar night
  severe("polar night, Tromsø 21 Dec 12:00", reading({ now: tromso, key: "69.65,18.96", base: RAINY }), tromso, "69.65,18.96", ctx(tromso), ["dark"]);

  /* quiet hours (06:00-21:00 on the phone) */
  const jun2110 = Date.UTC(2026, 5, 21, 20, 10), jun0530 = Date.UTC(2026, 5, 21, 4, 30);
  const sunJ = W.sun(51.51, -0.13, jun2110);
  severe(`21 Jun 21:10 BST, sunset ${G.dwClock(sunJ.set)}: late`, reading({ now: jun2110, base: RAINY }), jun2110, LDN, ctx(jun2110), ["dark"]);
  control(`21 Jun 05:30 BST, sunrise ${G.dwClock(W.sun(51.51, -0.13, jun0530).rise)}: waits for 06:00`, reading({ now: jun0530, base: RAINY }), jun0530, LDN, ctx(jun0530), { id: "rain", light: "pre", out: false });
  severe("no phone time zone (tz missing)", reading({ base: RAINY }), T, LDN, ctx(T, { tz: undefined }), ["tz"]);
  control("no phone time zone: light", reading({ base: RAINY }), T, LDN, ctx(T, { tz: undefined }), { light: "night", here: false, out: false });
  /* where only 21:00 stops the walk: Edinburgh's sun sets after 22:00 on 21 Jun, and Tromsø has the midnight sun */
  const ED = "55.95,-3.19", TR = "69.65,18.96";
  const ed2050 = Date.UTC(2026, 5, 21, 19, 50), tr2050 = Date.UTC(2026, 5, 21, 18, 50), tr2200 = Date.UTC(2026, 5, 21, 20, 0);
  if (W.sun(55.95, -3.19, ed2050).set - ed2050 < 70 * MIN) fail("the Edinburgh case needs a sunset well after 21:00");
  if (W.sun(69.65, 18.96, tr2050).polar !== "day" || W.sun(69.65, 18.96, tr2200).polar !== "day") fail("the Tromsø June cases need the midnight sun");
  severe(`Edinburgh 21 Jun 20:50 BST, a 15-minute walk (sunset ${G.dwClock(W.sun(55.95, -3.19, ed2050).set)}): ends after 21:00`, reading({ now: ed2050, key: ED, base: RAINY }), ed2050, ED, ctx(ed2050, { m: 15 }), ["dark"]);
  severe("Tromsø 21 Jun 20:50 CEST, midnight sun, a 15-minute walk: ends after 21:00", reading({ now: tr2050, key: TR, base: RAINY }), tr2050, TR, ctx(tr2050, { tz: 120, m: 15 }), ["dark"]);
  severe("Tromsø 21 Jun 22:00 CEST, midnight sun", reading({ now: tr2200, key: TR, base: RAINY }), tr2200, TR, ctx(tr2200, { tz: 120 }), ["dark"]);
  control("Tromsø 21 Jun 12:00 CEST, midnight sun", reading({ now: tr2050 - 8 * HOUR - 50 * MIN, key: TR, base: RAINY }), tr2050 - 8 * HOUR - 50 * MIN, TR, ctx(tr2050 - 8 * HOUR - 50 * MIN, { tz: 120 }), { id: "rain", light: "day", out: true });

  /* near midnight the sun is the phone's own day's. East of a zone's meridian (Warsaw, Tokyo…) the solar noon
     nearest to now is already tomorrow's for the last minutes of the day; west of it (London in BST, Madrid)
     it is still yesterday's just after midnight. Neither may move the walk into the dark. */
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (const [n, lat, lon, tz, y, mo, d] of [["Warsaw", 52.23, 21.01, 60, 2026, 11, 10], ["Budapest", 47.50, 19.04, 60, 2026, 0, 15], ["Stockholm", 59.33, 18.07, 60, 2026, 11, 10],
    ["Luleå", 65.58, 22.15, 60, 2026, 0, 15], ["Tokyo", 35.68, 139.69, 540, 2026, 9, 17], ["Kolkata", 22.57, 88.36, 330, 2026, 9, 17],
    ["New York (EST)", 40.71, -74.01, -300, 2026, 11, 10], ["Brisbane", -27.47, 153.03, 600, 2026, 9, 17]]) {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const noon = Date.UTC(y, mo, d, 12) - tz * MIN;
    control(`${n} ${d} ${MON[mo]} 12:00 on its own phone`, reading({ now: noon, key, base: RAINY }), noon, key, ctx(noon, { tz }), { id: "rain", light: "day", out: true });
    for (const [h, m] of [[23, 30], [23, 45], [23, 55]]) {
      const now = Date.UTC(y, mo, d, h, m) - tz * MIN, hm = `${h}:${String(m).padStart(2, "0")}`;
      severe(`${n} ${d} ${MON[mo]} ${hm} on its own phone (tz ${tz})`, reading({ now, key, base: RAINY }), now, key, ctx(now, { tz }), ["dark"]);
      darkLight(`${n} ${d} ${MON[mo]} ${hm}, no reading (the place's coordinates only)`, lat, lon, now, ctx(now, { tz }), null);
    }
  }
  /* the belt and braces: once quiet hours begin it is never "pre", whatever sun times come in (here a day that
     starts after 21:00 on the phone, as a town far to the west could have) */
  { const day0 = Date.UTC(2026, 9, 16, 23, 0), now = day0 + 21 * HOUR + 10 * MIN;
    darkLight("a day starting at 21:30 on the phone, at 21:10: not \"pre\"", 51.51, -0.13, now, ctx(now), { rise: day0 + 21.5 * HOUR, set: day0 + 23.9 * HOUR, polar: null }); }
  const ldn0030 = Date.UTC(2026, 9, 16, 23, 30), riseL = W.sun(51.51, -0.13, T).rise;
  control(`London 17 Oct 00:30 BST: waits for today's sunrise (${G.dwClock(riseL)}), not 06:00`, reading({ now: ldn0030, base: RAINY }), ldn0030, LDN, ctx(ldn0030), { id: "rain", light: "pre", out: false, from: riseL });
  { const L = G.dwLight(51.51, -0.13, ldn0030, ctx(ldn0030), null), ok = L.light === "pre" && Math.abs(L.from - riseL) <= MIN;
    N.control++; if (!ok) { N.controlBad++; fails++; }
    line(ok ? "PASS" : "FAIL", "control · London 17 Oct 00:30 BST, no reading: dwLight", "dwLight", L.light, `from ${utc(L.from)}, today's sunrise ${utc(riseL)}`); }
  const mad0130 = Date.UTC(2026, 9, 16, 23, 30), riseM = W.sun(40.42, -3.70, Date.UTC(2026, 9, 17, 10, 0)).rise;
  control("Madrid 17 Oct 01:30 CEST: waits for today's sunrise, not 06:00", reading({ now: mad0130, key: "40.42,-3.70", base: RAINY }), mad0130, "40.42,-3.70", ctx(mad0130, { tz: 120 }), { id: "rain", light: "pre", out: false, from: riseM });
  const waw0700 = Date.UTC(2026, 11, 10, 6, 0), riseW = W.sun(52.23, 21.01, Date.UTC(2026, 11, 10, 11, 0)).rise;
  control("Warsaw 10 Dec 07:00 CET: waits for today's sunrise", reading({ now: waw0700, key: "52.23,21.01", base: RAINY }), waw0700, "52.23,21.01", ctx(waw0700), { id: "rain", light: "pre", out: false, from: riseW });
  sweepLight();

  /* the place isn't yours */
  severe("Sydney typed, London phone, 12:00 BST", reading({ key: "-33.87,151.21", base: RAINY }), T, "-33.87,151.21", ctx(T), ["zone"]);
  const syd = Date.UTC(2026, 9, 16, 22, 30); // 09:30 in Sydney, 23:30 in London, quiet hours off (as a fixture)
  severe("Sydney typed in its daylight, London phone, quiet hours off", reading({ now: syd, key: "-33.87,151.21", base: RAINY }), syd, "-33.87,151.21", ctx(syd, { quiet: false }), ["zone"]);
  severe("New York typed, London phone", reading({ key: "40.71,-74.01", base: RAINY }), T, "40.71,-74.01", ctx(T), ["zone"]);
  severe("GPS place 13 h old", reading({ base: RAINY }), T, LDN, ctx(T, { src: "gps", placeAt: T - 13 * HOUR }), ["gps"]);
  severe("GPS place with no time", reading({ base: RAINY }), T, LDN, ctx(T, { src: "gps", placeAt: undefined }), ["gps"]);
  severe("GPS place stamped 2 h in the future", reading({ base: RAINY }), T, LDN, ctx(T, { src: "gps", placeAt: T + 2 * HOUR }), ["gps"]);

  /* stale and malformed readings */
  const mal = (n, f, whys) => { const w = reading({ base: RAINY }); f(w); severe(n, w, T, LDN, ctx(T), whys); };
  severe("reading 3 h 1 min old", reading({ base: RAINY, age: 3 * HOUR + MIN }), T, LDN, ctx(T), ["stale"]);
  severe("reading 7 h old", reading({ base: RAINY, age: 7 * HOUR }), T, LDN, ctx(T), ["stale"]);
  severe("reading from 10 min in the future", reading({ base: RAINY, age: -10 * MIN }), T, LDN, ctx(T), ["data"]);
  severe("the place moved (another key)", reading({ base: RAINY }), T, "53.80,-1.55", ctx(T), ["place"]);
  severe("ok:false", { ok: false, why: "offline" }, T, LDN, ctx(T), ["none"]);
  severe("no reading at all", null, T, LDN, ctx(T), ["none"]);
  mal("temp null", w => { w.temp = null; }, ["data"]);
  mal("temp undefined", w => { w.temp = undefined; }, ["data"]);
  mal("temp NaN", w => { w.temp = NaN; }, ["data"]);
  { const w = reading({ base: Object.assign({}, RAINY, { wind: 12 }) }); w.wind = undefined; w.soon.wind = undefined; severe("wind and soon.wind undefined, wind 12 behind them", w, T, LDN, ctx(T), ["data"]); }
  severe("wind_speed missing from MET (summary wind null)", reading({ base: Object.assign({}, RAINY, { noWind: true }) }), T, LDN, ctx(T), ["data"]);
  mal("precip undefined", w => { w.precip = undefined; }, ["data"]);
  mal("thunder undefined", w => { w.thunder = undefined; }, ["data"]);
  mal("thunder as the string 'false'", w => { w.thunder = "false"; }, ["data"]);
  mal("gust as the string '16'", w => { w.gust = "16"; }, ["data"]);
  mal("a summary without soon", w => { delete w.soon; }, ["data"]);
  mal("soon as an array", w => { w.soon = []; }, ["data"]);
  mal("soon.thunder undefined", w => { w.soon.thunder = undefined; }, ["data"]);
  mal("soon.precip NaN", w => { w.soon.precip = NaN; }, ["data"]);
  mal("null symbol now and soon", w => { w.symbol = null; w.soon.symbol = null; }, ["data"]);
  mal("unknown symbol 'drizzle' now", w => { w.symbol = "drizzle"; }, ["data"]);
  mal("unknown symbol 'drizzle' soon", w => { w.soon.symbol = "drizzle"; }, ["data"]);
  mal("at missing", w => { delete w.at; }, ["data"]);
  mal("negative precipitation", w => { w.precip = -1; }, ["data"]);

  /* accept freshness: the pick stands, but no outdoor accept */
  control("light rain 9 °C, no re-summary (sumAt null)", reading({ base: RAINY }), T, LDN, ctx(T, { sumAt: null }), { id: "rain", out: false, recent: false });
  control("light rain 9 °C, re-summarised 31 min ago", reading({ base: RAINY }), T, LDN, ctx(T, { sumAt: T - 31 * MIN }), { id: "rain", out: false, recent: false });
  control("light rain 9 °C, fetched 61 min ago", reading({ base: RAINY, age: 61 * MIN }), T, LDN, ctx(T), { id: "rain", out: false, recent: false });
  control("light rain 9 °C, re-summary stamped in the future", reading({ base: RAINY }), T, LDN, ctx(T, { sumAt: T + 5 * MIN }), { id: "rain", out: false, recent: false });

  /* positive controls (so the gate can't pass by refusing everything) */
  control("light rain 9 °C at noon (global)", reading({ base: RAINY }), T, LDN, ctx(T), { id: "rain", out: true });
  control("light rain 9 °C at noon (Nordic)", reading({ base: RAINY, nordic: true }), T, LDN, ctx(T), { id: "rain", out: true });
  control("cloudy 4 °C dry", reading({ base: { temp: 4 } }), T, LDN, ctx(T), { id: "cold", out: true });
  control("Nordic gust 11, dry, 12 °C", reading({ base: { wind: 6, gust: 11 }, nordic: true }), T, LDN, ctx(T), { id: "wind", out: true });
  control("global wind 6, no gust (9.6 effective), dry, 12 °C", reading({ base: { wind: 6 } }), T, LDN, ctx(T), { id: "wind", out: true });
  control("clear 15 °C at noon", reading({ base: { sym: "clearsky_day", temp: 15 } }), T, LDN, ctx(T), { id: "bright", out: true });
  control("cloudy 14 °C (calm)", reading({ base: { temp: 14 } }), T, LDN, ctx(T), { id: null, why: "calm" });
  control("Nordic gust 13.8 (just under 50 km/h)", reading({ base: { wind: 6, gust: 13.8 }, nordic: true }), T, LDN, ctx(T), { id: "wind", out: true });
  control("clear 25 °C", reading({ base: { sym: "clearsky_day", temp: 25 } }), T, LDN, ctx(T), { id: "bright", out: true });
  control("clear 26 °C", reading({ base: { sym: "clearsky_day", temp: 26 } }), T, LDN, ctx(T), { id: null, why: "calm" });
  control("rain 6 °C", reading({ base: { sym: "rain", temp: 6, pr: 1 } }), T, LDN, ctx(T), { id: "rain", out: true });
  const preNow = rise - HOUR;
  control(`light rain 1 h before sunrise (${G.dwClock(preNow)}, sunrise ${G.dwClock(rise)})`, reading({ now: preNow, base: RAINY }), preNow, LDN, ctx(preNow), { id: "rain", light: "pre", out: false });
  const madrid = Date.UTC(2026, 9, 17, 10, 0), kashgar = Date.UTC(2026, 9, 17, 6, 0);
  control("Madrid typed, phone on +120", reading({ now: madrid, key: "40.42,-3.70", base: RAINY }), madrid, "40.42,-3.70", ctx(madrid, { tz: 120 }), { id: "rain", here: true, out: true });
  control("Kashgar typed, phone on +480 (China's one zone)", reading({ now: kashgar, key: "39.47,75.99", base: RAINY }), kashgar, "39.47,75.99", ctx(kashgar, { tz: 480 }), { id: "rain", here: true, out: true });
  control("GPS place 11 h old", reading({ base: RAINY }), T, LDN, ctx(T, { src: "gps", placeAt: T - 11 * HOUR }), { id: "rain", here: true, out: true });
  control("fetched 59 min ago, re-summarised now", reading({ base: RAINY, age: 59 * MIN }), T, LDN, ctx(T), { id: "rain", out: true });
  for (const [n, t] of [["10:30 AEDT, 16 Oct 23:30 UTC", Date.UTC(2026, 9, 16, 23, 30)], ["11:30 AEDT, 17 Oct 00:30 UTC", Date.UTC(2026, 9, 17, 0, 30)]])
    control(`Sydney typed, Sydney phone (+660), ${n}`, reading({ now: t, key: "-33.87,151.21", base: RAINY }), t, "-33.87,151.21", ctx(t, { tz: 660 }), { id: "rain", here: true, out: true });
  control("Sydney typed, Sydney phone, 21:10 AEDT (late)", reading({ now: Date.UTC(2026, 9, 17, 10, 10), key: "-33.87,151.21", base: RAINY }), Date.UTC(2026, 9, 17, 10, 10), "-33.87,151.21", ctx(Date.UTC(2026, 9, 17, 10, 10), { tz: 660 }), { id: "indoor", why: "dark", out: false });

  /* KNOWN limits: the phone's summary can't show these, so they still give an outdoor dare */
  known("light rain 9 °C now, fog symbol in the next hours (soon.symbol keeps lightrain)", reading({ base: RAINY, hours: { 1: { sym: "fog", pr: 0 }, 2: { sym: "fog", pr: 0 } } }), T, LDN, ctx(T), "rain");
  known("cloudy 4 °C dry now, fog_area_fraction 80 in 1 h (no soon.fog)", reading({ base: { temp: 4 }, hours: { 1: { fogf: 80 } }, nordic: true }), T, LDN, ctx(T), "cold");
  known("cloudy 4 °C dry now, −1 °C in 2 h (no soon temperatures)", reading({ base: { temp: 4 }, hours: { 2: { temp: -1 } } }), T, LDN, ctx(T), "cold");
  known("fair 15 °C, thunder probability 25 % (under 30 % is dropped)", reading({ base: { sym: "fair_day", temp: 15, thp: 25 }, nordic: true }), T, LDN, ctx(T), "bright");
  known("cloudy 4 °C, precipitation_amount missing in every step (reads 0 mm)", reading({ base: { temp: 4, noPr: true } }), T, LDN, ctx(T), "cold");

  /* ---------- the preview fixtures ---------- */
  console.log("\n-- fixtures (a London phone at 12:00 BST; dwCond is the conditions line) --");
  const real = reading({ base: RAINY });
  const keys = o => Object.keys(o).sort().join(",");
  const PICK = { rain: "rain", cold: "cold", wind: "wind", bright: "bright", calm: null, thunder: "indoor", gust: "indoor", windy: "indoor", heavy: "indoor", snow: "indoor", sleet: "indoor", wet: "indoor", ice: "indoor", freeze: "indoor", fog: "indoor", hot: "indoor", dark: "indoor", pre: "rain", polar: "indoor", stale: null, old: null, far: null, gpsold: null, junk: null };
  const WHY = { wet: "ice", dark: "dark", polar: "dark", far: "zone", gpsold: "gps", junk: "data", stale: "stale", old: "stale", calm: "calm" };
  const names = G.dwFixtures();
  if (JSON.stringify([...names].sort()) !== JSON.stringify(Object.keys(PICK).sort())) fail(`dwFixtures() lists ${names.join(", ")}`);
  for (const n of names) {
    const fx = G.dwFixture(n, T);
    if (!fx || !fx.w || !fx.place) { fail(`dwFixture("${n}") is empty`); continue; }
    if (keys(fx.w) !== keys(real)) fail(`fixture ${n}: keys ${keys(fx.w)} ≠ summarise() ${keys(real)}`);
    if (!fx.w.soon || keys(fx.w.soon) !== keys(real.soon)) fail(`fixture ${n}: soon keys differ from summarise()`);
    const c = ctx(T, { src: fx.place.src, placeAt: fx.place.at });
    const g = G.dwCheck(fx.w, T, fx.w.key, c), ch = G.dwChoose(fx.w, T, fx.w.key, c);
    const useOk = n === "old" ? !g.use && g.why === "stale" : n === "junk" ? !g.use && g.why === "data" : g.use;
    /* out: outdoor kinds may be accepted (sumAt now); indoor, pre and every refusal may not; calm is a plain day */
    const outOk = n === "calm" ? g.out : ch.id === "indoor" || ch.id === null || n === "pre" ? !g.out : g.out;
    const pickOk = ch.id === PICK[n] && (!(n in WHY) || ch.why === WHY[n]) && (n !== "pre" || g.light === "pre") && outOk;
    if (!useOk || !pickOk) fails++;
    const cond = G.dwCond(fx.w, T, fx.w.key, c, ch.id, ch.why);
    line(useOk && pickOk ? "PASS" : "FAIL", `fixture ${n}`, ch.id, ch.why, `use ${g.use}, light ${g.light}, out ${g.out} · "${cond}"`);
    if (g.use && (/undefined|NaN|\n/.test(cond) || (ch.id !== null && !cond))) fail(`fixture ${n}: dwCond "${cond}"`);
    for (const id of ["rain", "cold", "wind", "bright", "indoor"]) for (const why of id === "indoor" ? ["thunder", "gust", "wind", "heavy", "snow", "freeze", "ice", "fog", "hot", "dark"] : [null]) {
      const s = G.dwCond(fx.w, T, fx.w.key, c, id, why);
      if (g.use && (!s || /undefined|NaN|null|\n/.test(s))) fail(`dwCond(${n}, ${id}, ${why}) = "${s}"`);
      if (!g.use && s !== "") fail(`dwCond(${n}) should be "" for an unusable reading, got "${s}"`);
    }
  }

  /* ---------- copy ---------- */
  console.log("\n-- copy --");
  const eq = (n, a, b) => { if (a !== b) fail(`${n}: ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`); };
  eq("dwTemp(8)", G.dwTemp(8), "8 °C");
  eq("dwTemp(-2)", G.dwTemp(-2), "−2 °C");
  eq("dwTemp(-0.4)", G.dwTemp(-0.4), "0 °C");
  eq("dwTemp(null)", G.dwTemp(null), "–");
  eq("dwKmh(13.9)", G.dwKmh(13.9), 50);
  eq("dwClock(T)", G.dwClock(T), "12:00");
  eq("dwFill", G.dwFill("{m}-minute walk · {h} · {n} steps", { m: 10, h: 5, n: 1000 }), "10-minute walk · 5 · 1,000 steps");
  const syms = G.dwSyms();
  if (syms.length !== 41 || new Set(syms).size !== 41) fail(`dwSyms() has ${syms.length} codes (${new Set(syms).size} distinct), expected 41`);
  for (const s of ["lightssleetshowersandthunder", "lightssnowshowersandthunder"]) if (!syms.includes(s)) fail(`dwSyms() is missing MET's own spelling ${s}`);
  for (const s of syms) for (const v of [s, s + "_day", s + "_night", s + "_polartwilight"]) if (!G.dwSky(v)) fail(`dwSky("${v}") is empty`);
  eq('dwSky("drizzle")', G.dwSky("drizzle"), "");
  for (const s of syms.filter(x => /thunder/.test(x))) eq(`dwSky("${s}")`, G.dwSky(s), "Thunder about");
  const BANNED = /\b(grit|xp|storms?|severe|elements|exposure|toughen|layers|vessel|never|safe)\b/i;
  const strings = [];
  const walk = (o, at) => { if (typeof o === "string") strings.push([at, o]); else if (o && typeof o === "object") for (const k of Object.keys(o)) walk(o[k], at + "." + k); };
  const K = G.dwKinds();
  walk(K, "dwKinds()");
  const REASONS = ["thunder", "gust", "wind", "heavy", "snow", "freeze", "ice", "fog", "hot", "dark"];
  for (const r of REASONS) { const a = G.dwWhy(r), b = G.dwWarn(r); if (!a) fail(`dwWhy("${r}") is empty`); if (!b) fail(`dwWarn("${r}") is empty`); strings.push([`dwWhy(${r})`, a], [`dwWarn(${r})`, b]); }
  for (const r of ["far", "nofresh"]) { const b = G.dwWarn(r); if (!b) fail(`dwWarn("${r}") is empty`); strings.push([`dwWarn(${r})`, b]); }
  for (const [at, s] of strings) { const m = BANNED.exec(s); if (m) fail(`${at} says "${m[0]}": "${s}"`); if (/undefined|NaN/.test(s)) fail(`${at}: "${s}"`); }
  for (const id of ["rain", "cold", "wind", "bright", "indoor"]) {
    const k = K[id];
    if (!k || !k.name || !k.lead || !k.lead.coach || !k.lead.drill || !k.safety || !Array.isArray(k.rows) || k.rows.length !== 3) { fail(`dwKinds().${id} is incomplete`); continue; }
    for (const r of k.rows) {
      const v = { m: 15, h: 5, n: 1500 }, t = G.dwFill(r.t, v), s = G.dwFill(r.s, v), sH = r.sH ? G.dwFill(r.sH, v) : "";
      if (t.length > 28) fail(`dwKinds().${id} row ${r.id}: title "${t}" is ${t.length} characters (28 at most)`);
      for (const x of [s, sH]) if (x.length > 40) fail(`dwKinds().${id} row ${r.id}: sub "${x}" is ${x.length} characters (40 at most)`);
      if (!["walk", "into", "back", "breath", "water", "flow"].includes(r.id)) fail(`dwKinds().${id}: unknown row id ${r.id}`);
    }
  }
  if (!K.indoor.dark || !K.indoor.dark.coach || !K.indoor.dark.drill) fail("dwKinds().indoor.dark (the dark leads) is missing");
  const mutate = G.dwKinds(); mutate.rain.name = "x";
  if (G.dwKinds().rain.name !== "Rain walk") fail("dwKinds() hands out its own table: a caller's change leaks into the next call");
  console.log(`copy: ${strings.length} strings checked, ${syms.length} symbols mapped`);
}

/* ---------- Stage C: dwSun is an exact copy of weather.js sun() ---------- */
function stageC() {
  stage("Stage C: the sun (dwSun === weather.js sun())");
  const prng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const Y0 = Date.UTC(2026, 0, 1);
  let n = 0, bad = 0;
  const cmp = (name, lat, lon, t) => {
    n++;
    const a = G.dwSun(lat, lon, t), b = W.sun(lat, lon, t);
    if (a.rise !== b.rise || a.set !== b.set || a.polar !== b.polar || a.dark !== b.dark) { bad++; if (bad <= 5) fail(`dwSun ${name} at ${new Date(t).toISOString()}: ${JSON.stringify(a)} ≠ sun() ${JSON.stringify(b)}`); }
  };
  for (const [name, lat, lon, seed] of [["London", 51.51, -0.13, 11], ["Tromsø", 69.65, 18.96, 22], ["Sydney", -33.87, 151.21, 33]]) {
    const r = prng(seed);
    for (let i = 0; i < 240; i++) cmp(name, lat, lon, Y0 + Math.floor(r() * 365 * DAY));
    /* 60 around local solar midnight (23:00-01:00 solar time), where sun() moves to the next solar noon */
    const mid = ((24 - lon / 15) % 24 + 24) % 24;
    for (let i = 0; i < 60; i++) cmp(name, lat, lon, Y0 + Math.floor(r() * 365) * DAY + Math.round((mid + (r() * 2 - 1)) * HOUR));
  }
  const r = prng(44);
  for (const [a, b] of [[[10, 25], [10, 28]], [[0, 14], [0, 17]], [[4, 17], [4, 21]], [[6, 24], [6, 28]]]) {
    const t0 = Date.UTC(2026, a[0], a[1]), t1 = Date.UTC(2026, b[0], b[1] + 1);
    for (let i = 0; i < 20; i++) cmp("Tromsø (polar edge)", 69.65, 18.96, t0 + Math.floor(r() * (t1 - t0)));
  }
  console.log(`${bad ? "FAIL" : "PASS "} dwSun matched sun() at ${n - bad} of ${n} timestamps (London, Tromsø, Sydney; 180 near solar midnight; 80 at Tromsø's polar edges)`);
  if (bad > 5) fail(`${bad - 5} more dwSun mismatches`);
}

/* ---------- Stage D: purity and start-up rules ---------- */
function freeWalk(ast) {
  const declared = new Set(), refs = [], clock = [];
  const decl = p => {
    if (!p) return;
    if (p.type === "Identifier") declared.add(p.name);
    else if (p.type === "ObjectPattern") p.properties.forEach(q => { if (q.type === "RestElement") decl(q.argument); else { if (q.computed) visit(q.key); decl(q.value); } });
    else if (p.type === "ArrayPattern") p.elements.forEach(decl);
    else if (p.type === "AssignmentPattern") { decl(p.left); visit(p.right); }
    else if (p.type === "RestElement") decl(p.argument);
    else visit(p);
  };
  const assignTarget = p => {
    if (!p) return;
    if (p.type === "ObjectPattern") p.properties.forEach(q => { if (q.type === "RestElement") assignTarget(q.argument); else { if (q.computed) visit(q.key); assignTarget(q.value); } });
    else if (p.type === "ArrayPattern") p.elements.forEach(assignTarget);
    else if (p.type === "AssignmentPattern") { assignTarget(p.left); visit(p.right); }
    else if (p.type === "RestElement") assignTarget(p.argument);
    else visit(p);
  };
  const isDate = n => n && n.type === "Identifier" && n.name === "Date";
  function visit(n) {
    if (!n || typeof n.type !== "string") return;
    switch (n.type) {
      case "Identifier": refs.push(n); return;
      case "FunctionDeclaration": case "FunctionExpression": case "ArrowFunctionExpression":
        if (n.id) declared.add(n.id.name); n.params.forEach(decl); visit(n.body); return;
      case "VariableDeclaration": n.declarations.forEach(d => { decl(d.id); visit(d.init); }); return;
      case "ClassDeclaration": case "ClassExpression": if (n.id) declared.add(n.id.name); visit(n.superClass); visit(n.body); return;
      case "CatchClause": decl(n.param); visit(n.body); return;
      case "MemberExpression":
        if (isDate(n.object) && ((!n.computed && n.property.name === "now") || (n.computed && n.property.value === "now"))) clock.push([n.start, "Date.now"]);
        visit(n.object); if (n.computed) visit(n.property); return;
      case "Property": case "MethodDefinition": case "PropertyDefinition": if (n.computed) visit(n.key); visit(n.value); return;
      case "LabeledStatement": visit(n.body); return;
      case "BreakStatement": case "ContinueStatement": case "MetaProperty": case "Literal": case "TemplateElement": return;
      case "ThisExpression": clock.push([n.start, "this (the global object in a plain call)"]); return;
      case "AssignmentExpression": assignTarget(n.left); visit(n.right); return;
      case "NewExpression": if (isDate(n.callee) && !n.arguments.length) clock.push([n.start, "new Date() without an argument"]); break;
      case "CallExpression": if (isDate(n.callee)) clock.push([n.start, "Date()"]); break;
    }
    for (const k of Object.keys(n)) {
      if (k === "type" || k === "start" || k === "end" || k === "loc" || k === "range") continue;
      const v = n[k];
      if (Array.isArray(v)) v.forEach(x => x && typeof x.type === "string" && visit(x));
      else if (v && typeof v.type === "string") visit(v);
    }
  }
  visit(ast);
  return { declared, refs, clock };
}
/* The engine's free names, scope by scope (dares.js isn't one flat scope like the gate): every Identifier that no
   enclosing function, block, loop or catch declares, with the functions and try blocks around it. A try counts only
   inside its own function (a callback inside it runs later, outside the try). */
function scopedRefs(root) {
  const refs = [];
  const declIn = (s, p) => {
    if (!p) return;
    if (p.type === "Identifier") s.add(p.name);
    else if (p.type === "ObjectPattern") p.properties.forEach(q => declIn(s, q.type === "RestElement" ? q.argument : q.value));
    else if (p.type === "ArrayPattern") p.elements.forEach(e => declIn(s, e));
    else if (p.type === "AssignmentPattern") declIn(s, p.left);
    else if (p.type === "RestElement") declIn(s, p.argument);
  };
  const hoistVars = (b, s) => { // var and nested function declarations belong to the whole function
    if (!b || typeof b.type !== "string") return;
    if (b.type === "VariableDeclaration" && b.kind === "var") b.declarations.forEach(d => declIn(s, d.id));
    if (b.type === "FunctionDeclaration") { s.add(b.id.name); return; }
    if (/Function/.test(b.type)) return;
    for (const k of Object.keys(b)) { if (k === "type") continue; const v = b[k]; if (Array.isArray(v)) v.forEach(x => hoistVars(x, s)); else if (v && typeof v.type === "string") hoistVars(v, s); }
  };
  const lexical = (list, s) => list.forEach(b => {
    if (b.type === "VariableDeclaration" && b.kind !== "var") b.declarations.forEach(d => declIn(s, d.id));
    else if ((b.type === "ClassDeclaration" || b.type === "FunctionDeclaration") && b.id) s.add(b.id.name);
  });
  function pat(p, sc, cx) { // a binding or assignment target: a plain name is a reference (a write), defaults and computed keys are expressions
    if (!p) return;
    if (p.type === "ObjectPattern") p.properties.forEach(q => { if (q.type === "RestElement") pat(q.argument, sc, cx); else { if (q.computed) walk(q.key, sc, cx); pat(q.value, sc, cx); } });
    else if (p.type === "ArrayPattern") p.elements.forEach(e => pat(e, sc, cx));
    else if (p.type === "AssignmentPattern") { pat(p.left, sc, cx); walk(p.right, sc, cx); }
    else if (p.type === "RestElement") pat(p.argument, sc, cx);
    else walk(p, sc, cx);
  }
  function walk(n, sc, cx, how) {
    if (!n || typeof n.type !== "string") return;
    switch (n.type) {
      case "Identifier": if (!sc.some(s => s.has(n.name))) refs.push({ name: n.name, start: n.start, fns: cx.fns, tries: cx.tries, how: how || "" }); return;
      case "FunctionDeclaration": case "FunctionExpression": case "ArrowFunctionExpression": {
        const s = new Set();
        if (n.id) s.add(n.id.name);
        if (n.type !== "ArrowFunctionExpression") s.add("arguments");
        n.params.forEach(p => declIn(s, p)); hoistVars(n.body, s);
        const c2 = { fns: [...cx.fns, n], tries: [] };
        n.params.forEach(p => { if (p.type !== "Identifier") pat(p, [...sc, s], c2); });
        walk(n.body, [...sc, s], c2); return;
      }
      case "BlockStatement": case "StaticBlock": { const s = new Set(); lexical(n.body, s); n.body.forEach(b => walk(b, [...sc, s], cx)); return; }
      case "SwitchStatement": { walk(n.discriminant, sc, cx); const s = new Set(); n.cases.forEach(c => lexical(c.consequent, s)); n.cases.forEach(c => { walk(c.test, [...sc, s], cx); c.consequent.forEach(b => walk(b, [...sc, s], cx)); }); return; }
      case "ForStatement": case "ForInStatement": case "ForOfStatement": {
        const s = new Set(), d = n.init || n.left;
        if (d && d.type === "VariableDeclaration" && d.kind !== "var") d.declarations.forEach(x => declIn(s, x.id));
        const s2 = [...sc, s];
        if (n.left && n.left.type !== "VariableDeclaration") pat(n.left, s2, cx); else walk(n.left, s2, cx);
        for (const k of ["init", "test", "update", "right", "body"]) walk(n[k], s2, cx);
        return;
      }
      case "TryStatement":
        walk(n.block, sc, { fns: cx.fns, tries: [...cx.tries, n.block] });
        if (n.handler) { const s = new Set(); declIn(s, n.handler.param); walk(n.handler.body, [...sc, s], cx); }
        walk(n.finalizer, sc, cx); return;
      case "ClassDeclaration": case "ClassExpression": walk(n.superClass, sc, cx); walk(n.body, sc, cx); return;
      case "VariableDeclaration": n.declarations.forEach(d => { pat(d.id, sc, cx); walk(d.init, sc, cx); }); return;
      case "AssignmentExpression": pat(n.left, sc, cx); walk(n.right, sc, cx); return;
      case "MemberExpression": walk(n.object, sc, cx, "member"); if (n.computed) walk(n.property, sc, cx); return;
      case "Property": case "MethodDefinition": case "PropertyDefinition": if (n.computed) walk(n.key, sc, cx); walk(n.value, sc, cx); return;
      case "UnaryExpression": if (n.operator === "typeof") { walk(n.argument, sc, cx, "typeof"); return; } break;
      case "LabeledStatement": walk(n.body, sc, cx); return;
      case "BreakStatement": case "ContinueStatement": case "Literal": case "TemplateElement": case "MetaProperty": case "ThisExpression": case "Super": return;
    }
    for (const k of Object.keys(n)) {
      if (k === "type" || k === "start" || k === "end" || k === "loc" || k === "range") continue;
      const v = n[k];
      if (Array.isArray(v)) v.forEach(x => x && typeof x.type === "string" && walk(x, sc, cx));
      else if (v && typeof v.type === "string") walk(v, sc, cx);
    }
  }
  walk(root, [], { fns: [], tries: [] });
  return refs;
}
/* does the node hold `typeof NAME` anywhere */
function hasTypeof(node, name) {
  let found = false;
  const v = n => {
    if (found || !n || typeof n.type !== "string") return;
    if (n.type === "UnaryExpression" && n.operator === "typeof" && n.argument.type === "Identifier" && n.argument.name === name) { found = true; return; }
    for (const k of Object.keys(n)) { if (k === "type") continue; const x = n[k]; if (Array.isArray(x)) x.forEach(v); else if (x && typeof x.type === "string") v(x); }
  };
  v(node);
  return found;
}
function stageD() {
  stage("Stage D: purity and start-up rules (acorn)");
  if (!acorn) { fail("acorn isn't installed (node_modules/acorn), so purity can't be checked"); return; }
  const lineOf = (src, i) => src.slice(0, i).split("\n").length;
  let ast;
  try { ast = acorn.parse(gateSrc, { ecmaVersion: "latest", sourceType: "script" }); }
  catch (e) { fail(`wxgate.js doesn't parse: ${e.message}`); return; }
  const names = [];
  for (const s of ast.body) {
    if (s.type === "FunctionDeclaration" && /^dw[A-Z]/.test(s.id.name) && !s.generator) names.push(s.id.name);
    else if (s.type !== "EmptyStatement") fail(`wxgate.js:${lineOf(gateSrc, s.start)}: only function declarations named dw* at the top level (found ${s.type}${s.kind ? " " + s.kind : ""}${s.id ? " " + s.id.name : ""})`);
  }
  const BUILTIN = new Set(vm.runInNewContext("Object.getOwnPropertyNames(globalThis)"));
  const FORBID = new Set(["globalThis", "eval", "Function", "S", "NATIVE", "document", "window", "self", "navigator", "location", "save", "setTimeout", "setInterval", "fetch"]);
  const forbidden = n => FORBID.has(n) || /^(nv|dr|dp|wp)[A-Z]/.test(n);
  const { declared, refs, clock } = freeWalk(ast);
  let bad = 0;
  for (const n of declared) if (forbidden(n)) { bad++; fail(`wxgate.js declares "${n}", a host name the gate may not use`); }
  const seen = new Set();
  for (const r of refs) {
    if (declared.has(r.name) || seen.has(r.name)) continue;
    seen.add(r.name);
    if (forbidden(r.name)) { bad++; fail(`wxgate.js:${lineOf(gateSrc, r.start)} uses the host global "${r.name}"`); }
    else if (!BUILTIN.has(r.name)) { bad++; fail(`wxgate.js:${lineOf(gateSrc, r.start)} uses "${r.name}", which isn't an ECMAScript built-in`); }
  }
  for (const [at, what] of clock) { bad++; fail(`wxgate.js:${lineOf(gateSrc, at)}: ${what} (the gate has no clock: now is an argument)`); }
  const dup = names.filter((n, i) => names.indexOf(n) !== i);
  if (dup.length) fail(`wxgate.js declares ${dup.join(", ")} twice`);
  console.log(`${bad ? "FAIL" : "PASS "} wxgate.js: ${names.length} dw* function declarations; free names: ${[...seen].filter(n => !declared.has(n)).sort().join(", ")}`);
  if (GATE_ONLY) return;
  let dast;
  try { dast = acorn.parse(daresSrc, { ecmaVersion: "latest", sourceType: "script" }); }
  catch (e) { fail(`dares.js doesn't parse: ${e.message}`); return; }
  let fnN = 0, iife = 0;
  for (const s of dast.body) {
    if (s.type === "FunctionDeclaration") { fnN++; continue; }
    if (s.type === "EmptyStatement") continue;
    const e = s.type === "ExpressionStatement" ? s.expression : null, f = e && e.type === "CallExpression" ? e.callee : null;
    const body = f && (f.type === "ArrowFunctionExpression" || f.type === "FunctionExpression") && f.body.type === "BlockStatement" ? f.body.body : null;
    if (body && body.length === 1 && body[0].type === "TryStatement" && body[0].handler) { iife++; continue; }
    fail(`dares.js:${lineOf(daresSrc, s.start)}: the top level holds only function declarations and (()=>{ try{…}catch(e){…} })() (found ${s.type}${s.kind ? " " + s.kind : ""})`);
  }
  console.log(`PASS  dares.js top level: ${fnN} function declarations, ${iife} try-wrapped IIFEs`);

  /* the global allowance (§3.4): the include-time code, the ENGINE_ROOTS and every dares.js function they call or
     hand on (a name used as a value, not `name.prop`) use only built-ins, dares.js and wxgate.js names, ALLOW_LOADED
     and ALLOW_STUBBED; a TYPEOF_ONLY name only behind `typeof NAME` in an enclosing function, or inside a try in
     its own function; never mindState(). Stage B runs these in a sandbox with exactly that list. */
  const fns = new Map();
  dast.body.forEach(s => { if (s.type === "FunctionDeclaration") fns.set(s.id.name, s); });
  const ok = new Set([...ALLOW_LOADED, ...ALLOW_STUBBED, ...names]);
  const units = dast.body.filter(s => s.type !== "FunctionDeclaration").map(s => [`include-time code at dares.js:${lineOf(daresSrc, s.start)}`, s]);
  const refsOf = new Map(units.map(([l, n]) => [l, scopedRefs(n)]));
  const reached = new Set(), queue = [...ENGINE_ROOTS];
  for (const [, r] of refsOf) for (const x of r) if (fns.has(x.name) && x.how !== "member") queue.push(x.name);
  while (queue.length) {
    const f = queue.shift();
    if (reached.has(f)) continue;
    if (!fns.has(f)) { fail(`dares.js doesn't declare ${f} (an ENGINE_ROOTS function)`); continue; }
    reached.add(f); units.push([f, fns.get(f)]); refsOf.set(f, scopedRefs(fns.get(f)));
    for (const x of refsOf.get(f)) if (fns.has(x.name) && x.how !== "member" && !reached.has(x.name)) queue.push(x.name);
  }
  let gbad = 0;
  const guarded = new Set(), seenBad = new Set();
  for (const [label, node] of units) for (const x of refsOf.get(label)) {
    const n = x.name;
    if (fns.has(n) || BUILTIN.has(n) || ok.has(n) || x.how === "typeof") continue;
    const at = `dares.js:${lineOf(daresSrc, x.start)}`, key = `${label} ${n}`;
    let why = null;
    if (n === "mindState") why = "calls mindState() (it seeds and saves: read S.mind.log directly)";
    else if (TYPEOF_ONLY.includes(n)) {
      if (x.fns.some(f => hasTypeof(f, n)) || (!x.fns.length && hasTypeof(node, n)) || x.tries.length) { guarded.add(n); continue; }
      why = `uses ${n} without a typeof guard (TYPEOF_ONLY)`;
    } else why = `uses ${n}, a global outside the allowance (add it to Stage B loaded from source, or guard it and add it to TYPEOF_ONLY)`;
    if (seenBad.has(key)) continue;
    seenBad.add(key); gbad++; fail(`${at} (${label}) ${why}`);
  }
  console.log(`${gbad ? "FAIL" : "PASS "} dares.js globals: include-time code and ${reached.size} engine functions (the §3.4 ones and what they call) use only the allowance; behind a guard: ${[...guarded].sort().join(", ") || "none"}`);
}

/* ---------- Stage E: the app runs the tested code ---------- */
function stageE() {
  stage("Stage E: ossaHtml.js and web/.preview.html hold the current wxgate.js and dares.js");
  const mk = f => `/* ---- ui/${f} ---- */\n`;
  const parts = [["ranks.js", null], ["wxgate.js", gateSrc], ["dares.js", daresSrc]];
  let bundle = null;
  try {
    const s = read("ossaHtml.js"), i = s.indexOf("export default ");
    bundle = JSON.parse(s.slice(i + 15).trim().replace(/;$/, ""));
  } catch (e) { fail(`ossaHtml.js can't be read as \`export default "<page>";\` (${e.message}): run node scripts/build-html.js`); }
  let preview = null;
  try { preview = read("web/.preview.html"); } catch (e) { fail("web/.preview.html is missing: run node scripts/build-html.js"); }
  for (const [label, page] of [["ossaHtml.js", bundle], ["web/.preview.html", preview]]) {
    if (page == null) continue;
    let last = -1, ok = true;
    for (const [f, src] of parts) {
      const marker = mk(f), at = page.indexOf(marker);
      if (at < 0 || page.indexOf(marker, at + 1) >= 0) { ok = false; fail(`${label}: ${at < 0 ? "no" : "more than one"} "/* ---- ui/${f} ---- */" line: run node scripts/build-html.js`); continue; }
      if (src != null && page.slice(at + marker.length, at + marker.length + src.length) !== src) { ok = false; fail(`${label}: ui/${f} isn't the current web/ui/${f}: run node scripts/build-html.js`); }
      if (at < last) { ok = false; fail(`${label}: ui/${f} comes too early (the order is ranks.js → wxgate.js → dares.js)`); }
      last = at;
    }
    if (ok) console.log(`PASS  ${label}: ranks.js → wxgate.js → dares.js, both current`);
  }
}

/* ---------- Stage F: nothing else replaces the tested code ---------- */
function stageF() {
  stage("Stage F: nothing else declares or reassigns the gate's and the engine's names");
  const ENGINE = ["dareLife", "dareRand", "dareMuscle", "rkDareMix", "dareToday", "dareText", "uiDareHTML", "uiWireDare"];
  const isGate = n => /^dw[A-Z]/.test(n), isEngine = n => ENGINE.includes(n) || /^dr[A-Z]/.test(n);
  const NAMES = `(?:dw[A-Z][\\w$]*|dr[A-Z][\\w$]*|${ENGINE.join("|")})`;
  const DECL = new RegExp(`(?:^|[^\\w$.])(?:async\\s+)?(?:function\\s*\\*?\\s*|const\\s+|let\\s+|var\\s+|class\\s+)(${NAMES})(?![\\w$])`, "g");
  const ASSIGN = new RegExp(`(?<![.\\w$])(${NAMES})\\s*(?:\\*\\*|<<|>>>|>>|&&|\\|\\||\\?\\?|[-+*/%&|^])?=(?![=>])`, "g");
  /* the same names written through the global object: window.drX=…, globalThis["dwY"]=…, self.window.drZ++ … (one
     inlined script, so that replaces the tested function as surely as a plain reassignment) */
  const GLOBAL = "(?:window|globalThis|self|top|parent|frames)";
  const PROP = new RegExp(`(?<![.\\w$])${GLOBAL}(?:\\s*\\.\\s*${GLOBAL})*\\s*(?:\\.\\s*(${NAMES})(?![\\w$])|\\[\\s*(['"\`])(${NAMES})\\2\\s*\\])\\s*(?:(?:\\*\\*|<<|>>>|>>|&&|\\|\\||\\?\\?|[-+*/%&|^])?=(?![=>])|\\+\\+|--)`, "g");
  /* … or by Object.assign / defineProperty / defineProperties / Reflect.set / Reflect.defineProperty on it: any gate
     or engine name inside such a call fails (fail closed; there is no such call in the repo) */
  const DEFINE = new RegExp(`(?<![.\\w$])(?:Object\\s*\\.\\s*(?:assign|defineProperty|defineProperties)|Reflect\\s*\\.\\s*(?:set|defineProperty))\\s*\\(\\s*\\(?\\s*${GLOBAL}(?![\\w$])`, "g");
  const NAME1 = new RegExp(`(?<![\\w$])(${NAMES})(?![\\w$])`);
  const files = [["web/ossa.html", html], ...fs.readdirSync(path.join(ROOT, "web/ui")).filter(f => f.endsWith(".js")).sort().map(f => ["web/ui/" + f, read("web/ui/" + f)])];
  const lineOf = (src, i) => src.slice(0, i).split("\n").length;
  let bad = 0;
  for (const [f, src] of files) {
    const gateFile = f === "web/ui/wxgate.js", engineFile = f === "web/ui/dares.js";
    if (GATE_ONLY && engineFile) continue;
    for (const m of src.matchAll(DECL)) {
      const n = m[1];
      if ((isGate(n) && !gateFile) || (isEngine(n) && !engineFile)) { bad++; fail(`${f}:${lineOf(src, m.index)} declares ${n}: only ${isGate(n) ? "web/ui/wxgate.js" : "web/ui/dares.js"} may`); }
    }
    for (const m of src.matchAll(ASSIGN)) {
      const n = m[1];
      if (GATE_ONLY && !isGate(n)) continue;
      bad++; fail(`${f}:${lineOf(src, m.index)} assigns to ${n}${(isGate(n) && gateFile) || (isEngine(n) && engineFile) ? " (its own file declares it once and never reassigns it)" : ""}`);
    }
    for (const m of src.matchAll(PROP)) {
      const n = m[1] || m[3];
      if (GATE_ONLY && !isGate(n)) continue;
      bad++; fail(`${f}:${lineOf(src, m.index)} writes ${n} through the global object (${m[0].replace(/\s+/g, " ").trim()}): that replaces the tested ${isGate(n) ? "gate" : "engine"} function`);
    }
    for (const m of src.matchAll(DEFINE)) {
      let call;
      try { call = scan(src, src.indexOf("(", m.index), false); } catch (e) { call = src.slice(m.index, m.index + 400); }
      const h = NAME1.exec(call);
      if (!h || (GATE_ONLY && !isGate(h[1]))) continue;
      bad++; fail(`${f}:${lineOf(src, m.index)} sets ${h[1]} on the global object (${m[0].replace(/\s+/g, " ").trim()}…): that replaces the tested ${isGate(h[1]) ? "gate" : "engine"} function`);
    }
    if (/DARE_LIFE/.test(src)) { bad++; fail(`${f} still says DARE_LIFE (it is dareLife() in dares.js now)`); }
  }
  /* inside their own files: each declared once, at the top level */
  const tops = src => (acorn ? acorn.parse(src, { ecmaVersion: "latest", sourceType: "script" }).body.filter(s => s.type === "FunctionDeclaration").map(s => s.id.name) : [...src.matchAll(/^(?:async\s+)?function\s+([\w$]+)/gm)].map(m => m[1]));
  const once = (f, src, test, must) => {
    let list;
    try { list = tops(src); } catch (e) { bad++; fail(`${f} doesn't parse: ${e.message}`); return; }
    const mine = list.filter(test);
    for (const n of new Set(mine)) if (mine.filter(x => x === n).length > 1) { bad++; fail(`${f} declares ${n} more than once (the last one wins)`); }
    for (const n of must) if (!mine.includes(n)) { bad++; fail(`${f} doesn't declare ${n}`); }
    return mine.length;
  };
  const g = once("web/ui/wxgate.js", gateSrc, isGate, ["dwRules", "dwSyms", "dwSym", "dwKnown", "dwNum", "dwLL", "dwSun", "dwGust", "dwHere", "dwLight", "dwCheck", "dwChoose", "dwSky", "dwWhy", "dwWarn", "dwTemp", "dwKmh", "dwClock", "dwCond", "dwKinds", "dwFixture", "dwFixtures"]);
  const d = GATE_ONLY ? 0 : once("web/ui/dares.js", daresSrc, isEngine, ENGINE);
  console.log(`${bad ? "FAIL" : "PASS "} ${files.length} files: ${g} dw* names only in wxgate.js${GATE_ONLY ? "" : `, ${d} engine names only in dares.js`}, no reassignment (plain or through window/globalThis/self), no DARE_LIFE`);
}

/* ---------- Stage B: the real pick (wxgate.js + dares.js in one sandbox) ---------- */
async function stageB() {
  stage("Stage B: the real pick (dares.js and wxgate.js in one sandbox)");
  const need = ["dareToday", "drApply", "drCanAccept", "drAccept", "drRefresh", "drView", "drSetWx", "drCheck", "drS", "drKey", "drReading", "drGate", "drSoon"];
  const missing = need.filter(n => !new RegExp(`^(?:async\\s+)?function\\s+${n}\\s*\\(`, "m").test(daresSrc));
  if (missing.length) { fail(`dares.js doesn't have ${missing.join(", ")} yet (engine not landed), so the real pick can't be checked`); return; }

  /* the record of every call the engine makes */
  let R;
  const freshRec = () => ({ save: 0, track: [], toast: [], hap: [], emit: [], nvw: [], warn: [], hookErr: [] });
  R = freshRec();
  const hooks = {};
  const Q = []; // setTimeout queue
  let NEXT = null; // what nvWeather answers next (a summary, or a function giving one); null = S.wx.last
  let DELAY = null; // a function giving a promise nvWeather waits on first (a slow phone); null = answer at once
  const sb = {};
  vm.createContext(sb);
  /* the sandbox's own Date: Date.now(), new Date() and getTimezoneOffset() pinned to the case's clock */
  vm.runInContext(`(function(){ var D0=Date; class D extends D0 { constructor(...a){ if(a.length) super(...a); else super(D.__t); } static now(){ return D.__t; } }
    D.__t=0; D.__tz=60; D0.prototype.getTimezoneOffset=function(){ return -D.__tz; }; globalThis.Date=D; })()`, sb);
  const SD = vm.runInContext("Date", sb), SJ = vm.runInContext("JSON", sb);
  const clock = (t, tz) => { SD.__t = t; SD.__tz = tz == null ? 60 : tz; };
  const inSb = o => (o === undefined ? undefined : SJ.parse(JSON.stringify(o)));
  const hk = e => hooks[e] || (hooks[e] = []);
  Object.assign(sb, {
    S: null,
    save: () => { R.save++; },
    track: (n, o) => { R.track.push([n, JSON.parse(JSON.stringify(o === undefined ? null : o))]); },
    toast: m => { R.toast.push(String(m)); },
    hap: s => { R.hap.push(s); },
    vxHooks: e => hk(e),
    vxOn: (e, f) => { if (typeof f === "function") hk(e).push(f); return () => { const a = hk(e), i = a.indexOf(f); if (i >= 0) a.splice(i, 1); }; },
    vxEmit: (e, ...a) => { R.emit.push([e, JSON.parse(JSON.stringify(a[0] === undefined ? null : a[0]))]); hk(e).slice().forEach(f => { try { f(...a); } catch (x) { R.hookErr.push(`${e}: ${x.message}`); } }); },
    NATIVE: null,
    nvWeather: async force => {
      R.nvw.push(!!force);
      if (DELAY) await DELAY();
      let r = typeof NEXT === "function" ? NEXT() : NEXT;
      if (r == null) r = sb.S && sb.S.wx ? sb.S.wx.last : null;
      if (r == null) return inSb({ ok: false, why: "no-place" });
      r = inSb(r);
      if (r.ok && sb.S && sb.S.wx) sb.S.wx.last = r;
      return r;
    },
    nvLocate: async () => inSb({ ok: false, why: "denied" }),
    GLORDER: inSb([]), MUSCLES: inSb({}),
    stateOf: () => "", daysSince: () => 0, rkFlagged: () => false, rkSay: k => k, fkg: x => String(x),
    location: null, document: null,
    setTimeout: f => { Q.push(f); return Q.length; },
    clearTimeout: id => { if (id > 0 && id <= Q.length) Q[id - 1] = null; },
    console: { log() {}, info() {}, debug() {}, warn: (...a) => R.warn.push(a.map(x => (x && x.message) || String(x)).join(" ")), error: (...a) => R.warn.push(a.map(x => (x && x.message) || String(x)).join(" ")) },
  });
  { const have = Object.keys(sb).filter(k => k !== "Date").sort(), want = [...ALLOW_STUBBED].sort();
    if (JSON.stringify(have) !== JSON.stringify(want)) fail(`Stage B: the sandbox's stubs (${have.join(", ")}) aren't ALLOW_STUBBED (${want.join(", ")})`); }
  const tick = () => new Promise(r => setImmediate(r));
  const flush = async () => { for (let k = 0; k < 30; k++) { await tick(); const q = Q.splice(0); if (!q.length) break; for (const f of q) if (f) { try { f(); } catch (e) { R.hookErr.push("timer: " + e.message); } } } await tick(); };
  const run = (code, what) => vm.runInContext(code, sb, { filename: what });
  try {
    run(`var dkey = ${constOf(html, "dkey")};`, "web/ossa.html dkey");
    run(`var waterToday = ${constOf(html, "waterToday")};`, "web/ossa.html waterToday");
    run(`var RD_WGOAL = ${constOf(html, "RD_WGOAL").split(",")[0]};`, "web/ossa.html RD_WGOAL");
    run(fnOf(html, "hOn"), "web/ossa.html hOn");
    run(fnOf(html, "hSteps"), "web/ossa.html hSteps");
    run(fnOf(nativeSrc, "nvKey"), "web/ui/native.js nvKey");
  } catch (e) { fail(`Stage B: the engine's helpers can't be loaded from source: ${e.message}`); return; }
  { const gone = ALLOW_LOADED.filter(n => typeof sb[n] === "undefined"); if (gone.length) fail(`Stage B: ${gone.join(", ")} (ALLOW_LOADED) weren't loaded from source`); }
  const reset = (t, tz) => {
    clock(t == null ? T : t, tz);
    sb.NATIVE = inSb({ on: true, caps: { v: 2, wx: true } });
    sb.location = inSb({ hostname: "ossa.app", search: "" });
    sb.document = inSb({ hidden: false });
    if (sb.drS) sb.drS.s = undefined;
    Q.length = 0; NEXT = null; DELAY = null;
    delete sb.nvReady; // only the cases that test it set it (it is a typeof-only name)
    /* the recorded calls start again (emit, track, warn and listener errors stay: they're checked over the whole run) */
    R.save = 0; R.toast = []; R.hap = []; R.nvw = [];
  };
  reset();
  try { run(gateSrc, "web/ui/wxgate.js"); run(daresSrc, "web/ui/dares.js"); }
  catch (e) { fail(`Stage B: dares.js throws at include time in the sandbox: ${e.message}`); return; }
  if (R.warn.length) fail(`Stage B: dares.js warned at include time (a global outside the allowance?): ${R.warn.join(" | ")}`);
  await flush();

  const S0 = (place, last, extra) => inSb(Object.assign({ name: "", body: "m", water: {}, mind: { log: [] }, workouts: [], dares: { wxOpt: "on", scale: 1, tone: "coach" }, wx: { place, last } }, extra || {}));
  const fx = (n, t) => sb.dwFixture(n, t == null ? T : t);
  const check = (name, ok, more) => { N.b++; if (!ok) { N.bBad++; fails++; } console.log(`${ok ? "PASS" : "FAIL"}  ${name}${more ? "  (" + more + ")" : ""}`); };
  const cur = () => (sb.S && sb.S.dares ? sb.S.dares.cur : null);
  const desc = c => (c ? `${c.kind} ${c.id || c.k || ""} ${c.st}${c.why ? " why " + c.why : ""}${c.wxTry ? " wxTry" : ""}` : "no dare");
  const dareEmits = () => R.emit.filter(e => e[0] === "dare").length;
  const guard = async (name, f) => { try { await f(); } catch (e) { N.b++; N.bBad++; fail(`${name}: threw ${e && e.stack ? e.stack.split("\n").slice(0, 2).join(" ") : e}`); } };
  const LIFE = ["cold", "steps", "phone", "protein", "mob"];
  /* a new outdoor rain dare, picked under the rain fixture at T */
  const pickRain = () => { reset(); const f = fx("rain"); sb.S = S0(f.place, f.w); const c = sb.dareToday(); if (!c || c.kind !== "wx" || c.id !== "rain") throw new Error(`the rain fixture picked ${desc(c)}`); return c; };
  const acceptRain = async () => { pickRain(); sb.S.water = inSb({ [sb.dkey(0)]: 2 }); NEXT = () => fx("rain").w; const ok = await sb.drAccept(); await flush(); NEXT = null; if (!ok || cur().st !== "yes") throw new Error(`accepting the rain dare gave ${ok}, ${desc(cur())}; toasts ${R.toast.join(" | ")}`); return cur(); };

  /* 1. every fixture through dareToday() */
  console.log("-- every fixture through dareToday() (a London phone at 12:00 BST) --");
  const PICK = { rain: "rain", cold: "cold", wind: "wind", bright: "bright", calm: null, thunder: "indoor", gust: "indoor", windy: "indoor", heavy: "indoor", snow: "indoor", sleet: "indoor", wet: "indoor", ice: "indoor", freeze: "indoor", fog: "indoor", hot: "indoor", dark: "indoor", pre: "rain", polar: "indoor", stale: null, old: null, far: null, gpsold: null, junk: null };
  const M = { rain: 10, cold: 10, wind: 10, bright: 15, indoor: 0 };
  let emitsBefore = dareEmits();
  for (const n of Object.keys(PICK)) await guard(`fixture ${n} through dareToday()`, async () => {
    reset(); const f = fx(n); sb.S = S0(f.place, f.w);
    const e0 = dareEmits(), c = sb.dareToday(), e1 = dareEmits();
    const want = PICK[n], errs = [];
    if (want === null) { if (!c || c.kind === "wx") errs.push("expected a life dare"); }
    else if (!c || c.kind !== "wx" || c.id !== want) errs.push(`expected wx ${want}`);
    if (c && c.kind === "wx") {
      if (!LIFE.includes(c.alt)) errs.push(`alt ${c.alt}`);
      if (c.m !== M[c.id]) errs.push(`m ${c.m}, expected ${M[c.id]} at full scale`);
      if (!Array.isArray(c.obj) || c.obj.length !== 3) errs.push("obj isn't three rows");
      if (!c.seen || ["town", "lat", "lon", "key", "cc"].some(k => k in c.seen)) errs.push("seen is missing or holds the place");
      if (c.st !== "new") errs.push(`st ${c.st}`);
    }
    const usable = !["stale", "old", "junk"].includes(n);
    if (c && usable && c.wxTry !== true) errs.push("wxTry should be true (a usable, fresh reading decided it)");
    if (c && !usable && c.wxTry) errs.push("wxTry should stay false without a fresh reading");
    if (e1 !== e0) errs.push("dareToday emitted");
    check(`fixture ${n} → ${desc(c)}`, !errs.length, errs.join("; "));
  });
  /* 2. every severe Stage A summary, at its own clock and phone zone, with its own place (the key's coordinates) */
  let sv = 0, svBad = 0;
  for (const s of SEVERE) {
    const ll = typeof s.key === "string" ? s.key.split(",").map(Number) : [];
    if (ll.length !== 2 || !ll.every(Number.isFinite) || !Number.isFinite(s.c.tz) || s.c.quiet === false) continue;
    sv++;
    try {
      reset(s.now, s.c.tz);
      sb.S = S0({ town: s.key === LDN ? "London" : "Elsewhere", cc: "", lat: ll[0], lon: ll[1], src: s.c.src || "typed", approx: true, at: s.c.placeAt }, s.w);
      const e0 = dareEmits(), c = sb.dareToday();
      if (!c || (c.kind === "wx" && c.id !== "indoor") || dareEmits() !== e0) { svBad++; fail(`severe "${s.name}" through dareToday() → ${desc(c)}`); }
    } catch (e) { svBad++; fail(`severe "${s.name}" through dareToday() threw ${e.message}`); }
  }
  check(`${sv} severe summaries (London and the other places) through dareToday(): none gives an outdoor dare, no emit`, svBad === 0 && sv > 50, `${svBad} bad`);
  check("no emit inside dareToday() across all those calls", dareEmits() === emitsBefore, `${dareEmits() - emitsBefore} emits`);

  /* 3. a new outdoor rain dare meets each fixture: drApply, drCanAccept, then (from a fresh rain dare) drAccept */
  console.log("-- a new outdoor rain dare meets each fixture --");
  const SEV13 = ["thunder", "gust", "windy", "heavy", "snow", "sleet", "wet", "ice", "freeze", "fog", "hot", "dark", "polar"];
  const POS = ["rain", "cold", "wind", "bright", "calm"];
  for (const n of [...SEV13, "pre", "stale", "old", "junk", "far", "gpsold", ...POS]) await guard(`rain dare vs ${n}`, async () => {
    const c0 = pickRain(), alt = c0.alt;
    const f = fx(n); sb.S.wx.place = f.place; sb.S.wx.last = f.w;
    sb.drApply(sb.drReading(), T);
    const c1 = cur(), ca = sb.drCanAccept();
    const errs = [];
    if (SEV13.includes(n)) { if (c1.kind !== "wx" || c1.id !== "indoor" || c1.st !== "new" || c1.m !== 0) errs.push(`drApply gave ${desc(c1)}, m ${c1.m}`); if (!ca.ok) errs.push(`drCanAccept ${JSON.stringify(ca)}`); }
    else if (n === "pre") { if (c1.id !== "rain") errs.push(`drApply gave ${desc(c1)}`); if (ca.ok || ca.why !== "pre" || !Number.isFinite(ca.at)) errs.push(`drCanAccept ${JSON.stringify(ca)}`); }
    else if (["stale", "old", "junk"].includes(n)) { if (c1 !== c0 || c1.id !== "rain") errs.push(`drApply changed it: ${desc(c1)}`); if (ca.ok || ca.why !== "stale") errs.push(`drCanAccept ${JSON.stringify(ca)}`); }
    else if (n === "far" || n === "gpsold") { if (c1.kind !== "life" || c1.id !== alt || c1.wxTry !== true || c1.st !== "new") errs.push(`drApply gave ${desc(c1)}, expected life ${alt}`); if (!ca.ok) errs.push(`drCanAccept ${JSON.stringify(ca)}`); }
    else { if (c1.id !== "rain" || c1.kind !== "wx") errs.push(`drApply gave ${desc(c1)}`); if (ca.ok || ca.why !== "stale") errs.push(`drCanAccept before any forced check ${JSON.stringify(ca)}, expected stale`); }
    /* Accept, from a fresh rain dare, with nvWeather answering this fixture */
    pickRain(); sb.S.water = inSb({ [sb.dkey(0)]: 2 });
    const f2 = fx(n); sb.S.wx.place = f2.place; sb.S.wx.last = f2.w; NEXT = () => fx(n).w;
    const res = await sb.drAccept(); await flush();
    const c2 = cur();
    if (!R.nvw.includes(true)) errs.push("Accept didn't force a fresh check");
    if (POS.includes(n)) {
      const wr = (c2.obj || []).find(r => r.id === "water");
      if (res !== true || c2.st !== "yes" || !Number.isFinite(c2.acc)) errs.push(`drAccept ${res}, ${desc(c2)}; toasts ${R.toast.join(" | ")}`);
      if (!wr || wr.base !== 2) errs.push(`water row base ${wr && wr.base}, expected waterToday() = 2`);
    } else if (res !== false || c2.st !== "new") errs.push(`drAccept ${res}, ${desc(c2)} (must not accept)`);
    if ((n === "far" || n === "gpsold") && c2.kind !== "life") errs.push(`after Accept ${desc(c2)}, expected the life dare`);
    if (SEV13.includes(n) && (c2.kind !== "wx" || c2.id !== "indoor")) errs.push(`after Accept ${desc(c2)}, expected indoor (new)`);
    check(`rain dare vs ${n}: ${desc(c1)} · drCanAccept ${ca.ok ? "ok" : ca.why} · Accept → ${res} ${c2.st}`, !errs.length, errs.join("; "));
  });

  /* 4. Accept needs a fresh re-summary */
  await guard("accept offline", async () => {
    reset(); const f = fx("rain"); f.w.at = T - 2 * HOUR; f.w.exp = f.w.at + HOUR;
    sb.S = S0(f.place, f.w); const c = sb.dareToday();
    NEXT = { ok: false, why: "offline" };
    const res = await sb.drAccept(); await flush();
    check("a rain dare picked on a 2 h old reading, phone offline at Accept: not accepted", c.id === "rain" && res === false && cur().st === "new" && R.nvw.includes(true), `pick ${desc(c)}, Accept ${res}, ${desc(cur())}, force calls ${JSON.stringify(R.nvw)}`);
  });

  await guard("accept stale reply", async () => {
    reset(); const f = fx("rain"); sb.S = S0(f.place, f.w); sb.dareToday();
    NEXT = () => Object.assign(fx("rain").w, { stale: true }); // the phone's cached forecast (MET unreachable)
    const res = await sb.drAccept(); await flush();
    check("the phone can only answer from its cache (stale:true): not a fresh re-summary, not accepted", res === false && cur().st === "new" && !(sb.drS().sumAt > 0), `Accept ${res}, ${desc(cur())}, sumAt ${sb.drS().sumAt}`);
  });
  await guard("hidden", async () => {
    reset(); const f = fx("rain"); sb.S = S0(f.place, f.w); sb.dareToday();
    sb.document.hidden = true;
    const r1 = await sb.drRefresh(true); const res = await sb.drAccept(); await flush();
    check("the app in the background: no weather call, no outdoor accept", r1 === false && res === false && R.nvw.length === 0 && cur().st === "new", `drRefresh ${r1}, Accept ${res}, nvWeather calls ${R.nvw.length}`);
  });

  /* 5. an ACCEPTED outdoor rain dare when the weather turns */
  for (const n of SEV13) await guard(`accepted vs ${n}`, async () => {
    await acceptRain();
    const f = fx(n); sb.S.wx.place = f.place; sb.S.wx.last = f.w;
    const ca = sb.drCanAccept(), v = sb.drView();
    check(`accepted rain dare, then ${n}: warn "${v && v.warn}"`, ca.ok === false && v && !!v.warn && v.acts === "warn", `drCanAccept ${JSON.stringify(ca)}, acts ${v && v.acts}`);
  });
  /* 6. dark without a usable reading, at 19:30 BST (after the London sunset) */
  const T2 = Date.UTC(2026, 9, 17, 18, 30);
  for (const [n, mk] of [
    ["a real reading made 3 h 5 min earlier", () => reading({ now: T2 - 3 * HOUR - 5 * MIN, base: RAINY, age: 0 })],
    ["a real reading made 7 h earlier", () => reading({ now: T2 - 7 * HOUR, base: RAINY, age: 0 })],
    ["a reading with an unknown symbol", () => { const w = reading({ now: T2, base: RAINY }); w.symbol = "drizzle"; return w; }],
    ["no reading at all", () => null],
  ]) await guard(`dark, ${n}`, async () => {
    await acceptRain();
    clock(T2, 60); sb.S.wx.last = inSb(mk()) || null;
    const v = sb.drView();
    check(`accepted rain dare at 19:30 BST, ${n}: dark warn`, v && typeof v.warn === "string" && v.warn.indexOf(sb.dwWarn("dark")) === 0 && v.acts === "warn", `warn "${v && v.warn}", acts ${v && v.acts}`);
  });
  /* 6b. near midnight in Warsaw (10 Dec, sunset 15:24 CET; the solar noon nearest to now is tomorrow's from
     about 23:36): an accepted rain dare keeps the dark warn to the end of the day, and a first open late at
     night picks no outdoor dare. Then London just after midnight (BST): the walk waits for today's sunrise. */
  const WAW = "52.23,21.01", wawPlace = t => ({ town: "Warsaw", cc: "PL", lat: 52.23, lon: 21.01, src: "typed", approx: true, at: t });
  const waw = (h, m) => Date.UTC(2026, 11, 10, h - 1, m); // CET = UTC+1
  const wawRead = t => reading({ now: t, key: WAW, base: RAINY });
  await guard("warsaw accepted", async () => {
    const noon = waw(12, 0);
    reset(noon, 60); sb.S = S0(wawPlace(noon), wawRead(noon));
    const c = sb.dareToday();
    if (!c || c.kind !== "wx" || c.id !== "rain") throw new Error(`Warsaw at 12:00 picked ${desc(c)}`);
    NEXT = () => wawRead(SD.now());
    const ok = await sb.drAccept(); await flush(); NEXT = null;
    if (!ok || cur().st !== "yes") throw new Error(`accepting in Warsaw gave ${ok}, ${desc(cur())}; toasts ${R.toast.join(" | ")}`);
    for (const [h, m] of [[23, 30], [23, 45], [23, 55]]) for (const [rn, mk] of [["a reading made then", wawRead], ["no reading", () => null]]) {
      const t = waw(h, m); clock(t, 60); sb.S.wx.last = inSb(mk(t)) || null;
      const v = sb.drView();
      check(`Warsaw rain dare accepted at 12:00, viewed at ${h}:${m} CET, ${rn}: dark warn`, v && typeof v.warn === "string" && v.warn.indexOf(sb.dwWarn("dark")) === 0 && v.acts === "warn" && v.card && v.card.line === v.warn, `warn "${v && v.warn}", acts ${v && v.acts}, card "${v && v.card && v.card.line}"`);
    }
  });
  await guard("warsaw first open", async () => {
    for (const [h, m] of [[23, 30], [23, 45], [23, 55]]) {
      const t = waw(h, m); reset(t, 60); sb.S = S0(wawPlace(t), wawRead(t));
      const c = sb.dareToday(), v = sb.drView();
      check(`Warsaw, first open at ${h}:${m} CET with a fresh light-rain reading: ${desc(c)}`, c && (c.kind !== "wx" || c.id === "indoor"), v ? `card "${v.card.line}"` : "");
    }
  });
  await guard("london after midnight", async () => {
    const t = Date.UTC(2026, 9, 16, 23, 30), rise = W.sun(51.51, -0.13, T).rise; // 00:30 BST on 17 Oct
    reset(t, 60); sb.S = S0({ town: "London", cc: "GB", lat: 51.51, lon: -0.13, src: "typed", approx: true, at: t }, reading({ now: t, base: RAINY }));
    const c = sb.dareToday(), v = sb.drView(), ca = sb.drCanAccept();
    check(`London, first open at 00:30 BST: "${v && v.card.line}"`, c && c.kind === "wx" && c.id === "rain" && v && v.acts === "pre" && Math.abs(v.from - rise) <= MIN
      && v.card.line.indexOf(sb.dwClock(rise)) >= 0 && ca.why === "pre" && Math.abs(ca.at - rise) <= MIN, `${desc(c)}, acts ${v && v.acts}, from ${utc(v && v.from)}, today's sunrise ${utc(rise)}, drCanAccept ${JSON.stringify(ca)}`);
  });
  /* 7. the caution: usable but not fresh, in daylight */
  await guard("caution", async () => {
    await acceptRain();
    const f = fx("stale"); sb.S.wx.last = f.w;
    const v = sb.drView();
    check(`accepted rain dare, reading 3 h 5 min old: caution "${v && v.warn}"`, v && v.warn === sb.dwWarn("nofresh") && v.acts === "yes", `acts ${v && v.acts}`);
  });
  /* 8. a redraw when the content changes with the same `at` */
  await guard("redraw", async () => {
    await acceptRain();
    const th = fx("thunder").w; th.at = sb.S.wx.last.at; th.exp = sb.S.wx.last.exp;
    NEXT = th;
    const e0 = R.emit.filter(e => e[0] === "dare" && e[1] && e[1].what === "wx").length;
    await sb.drRefresh(false); await flush();
    const e1 = R.emit.filter(e => e[0] === "dare" && e[1] && e[1].what === "wx").length;
    await sb.drRefresh(false); await flush();
    const e2 = R.emit.filter(e => e[0] === "dare" && e[1] && e[1].what === "wx").length;
    check("thunder arrives with the same `at`: drRefresh(false) emits dare {what:\"wx\"} once, then nothing", e1 - e0 >= 1 && e2 === e1, `${e1 - e0} then ${e2 - e1}`);
  });
  /* 9. the boot race: caps not here yet */
  await guard("boot race", async () => {
    pickRain();
    sb.NATIVE.caps = null;
    const before = JSON.stringify(cur());
    const c = sb.dareToday();
    const n0 = R.nvw.length, r = await sb.drRefresh(); await flush();
    const unchanged = c && c.kind === "wx" && c.id === "rain" && JSON.stringify(cur()) === before;
    check("caps not here: dareToday() leaves the rain dare alone, drRefresh() resolves false without asking", unchanged && r === false && R.nvw.length === n0, `${desc(c)}, drRefresh ${r}, nvWeather calls ${R.nvw.length - n0}`);
    sb.NATIVE.caps = inSb({ v: 2, wx: true });
    sb.drS().soonAt = SD.now();      // as if drSoon had just run: the caps listener must clear the throttle
    const n1 = R.nvw.length;
    for (const f of hk("native").slice()) { try { f(inSb({ t: "caps" })); } catch (e) { R.hookErr.push("native: " + e.message); } }
    await flush();
    check("caps arrive: the listener clears the throttle and the first refresh runs", R.nvw.length > n1, `nvWeather calls after caps ${R.nvw.length - n1}, soonAt ${sb.drS().soonAt}`);
  });
  /* 10. a name-only place (the browser, old builds, Android without permission) */
  await guard("name-only", async () => {
    reset(); sb.S = S0({ town: "Leeds", cc: "", lat: null, lon: null, src: "typed" }, null);
    const k = sb.drKey(), c = sb.dareToday();
    check("name-only place: drKey() null, a non-weather dare", k === null && c && c.kind !== "wx", `drKey ${k}, ${desc(c)}`);
    const c0 = pickRain(); sb.S.wx.place = inSb({ town: "Leeds", cc: "", lat: null, lon: null, src: "typed" });
    const c1 = sb.dareToday();
    check("a new weather dare, then a name-only place: back to its life dare", c1 && c1.kind === "life" && c1.id === c0.alt && c1.st === "new", desc(c1));
  });
  /* 11. turning weather dares off */
  await guard("off", async () => {
    const c0 = pickRain();
    await sb.drSetWx(false, inSb({ forget: true })); await flush();
    check("off with forget: wxOpt off, S.wx gone, a new weather dare goes back to its life dare", sb.S.dares.wxOpt === "off" && sb.S.wx === undefined && cur().kind === "life" && cur().id === c0.alt, `${sb.S.dares.wxOpt}, S.wx ${typeof sb.S.wx}, ${desc(cur())}`);
    await acceptRain();
    await sb.drSetWx(false, inSb({ forget: true })); await flush();
    check("off: an accepted outdoor dare is left for today at no cost", cur().st === "no" && cur().free === true && sb.S.dares.scale === 1, `${desc(cur())}, free ${cur().free}, scale ${sb.S.dares.scale}`);
    reset(); const f = fx("thunder"); sb.S = S0(f.place, f.w); sb.dareToday();
    const ok = await sb.drAccept(); await flush();
    await sb.drSetWx(false, inSb({ forget: true })); await flush();
    check("off: an accepted indoor dare stays", ok === true && cur().kind === "wx" && cur().id === "indoor" && cur().st === "yes", desc(cur()));
  });
  /* 12. breathing ticks (an entry without `at`, as the legacy writers make) */
  await guard("breath", async () => {
    reset(); const f = fx("thunder"); sb.S = S0(f.place, f.w); sb.dareToday();
    await sb.drAccept(); await flush();
    sb.S.mind.log.push(inSb({ d: cur().d, k: "breath", min: 1 }));
    sb.drCheck(); await flush();
    const r = (cur().obj || []).find(x => x.id === "breath");
    check("an accepted indoor dare: one minute of breathing ticks the breath row", r && r.done === true, JSON.stringify(r));
  });

  /* 13. "Checking the forecast…" clears on every path (engine's round-2 fixes; DELAY holds the phone's answer) */
  const whatN = (from, w) => R.emit.slice(from).filter(e => e[0] === "dare" && e[1] && e[1].what === w).length;
  const busyOff = () => sb.drS().busy === false && (sb.drS().busyN || 0) === 0;
  await guard("busy: plain, forced, Accept", async () => {
    reset(); const f = fx("rain"); sb.S = S0(f.place, f.w); sb.dareToday();
    const rel = []; DELAY = () => new Promise(r => rel.push(r));
    sb.drRefresh(false); await tick(); sb.drRefresh(true); await tick();   // Home's plain check in flight, then the page opens (forced)
    const e0 = R.emit.length, pa = sb.drAccept(); await tick();
    const v = sb.drView(), shown = sb.drS().busy === true && v && v.acts === "busy";
    DELAY = null; rel.forEach(r => r()); await flush();
    const res = await pa; await flush();
    check("a plain check in flight, then a forced one, then Accept: \"Checking the forecast…\" while it waits, accepted, busy cleared",
      shown && res === true && cur().st === "yes" && busyOff() && whatN(e0, "check") === 1,
      `busy shown ${shown}, Accept ${res}, ${desc(cur())}, busy ${sb.drS().busy}, busyN ${sb.drS().busyN}, check emits ${whatN(e0, "check")}`);
    /* the next day, same session: the new dare can be accepted (nothing stuck) */
    const T2 = T + DAY; clock(T2, 60); const f2 = fx("rain", T2); sb.S.wx.place = f2.place; sb.S.wx.last = f2.w;
    for (const h of hk("day").slice()) h("x");
    await flush(); sb.dareToday(); NEXT = () => fx("rain", T2).w;
    const a1 = sb.drView() && sb.drView().acts, ok2 = await sb.drAccept(); await flush();
    check("the next day in the same session: the new rain dare shows Accept and accepts", a1 === "new" && ok2 === true && cur().st === "yes" && busyOff(), `acts ${a1}, Accept ${ok2}, ${desc(cur())}`);
  });
  await guard("busy: hidden", async () => {
    reset(); const f = fx("rain"); sb.S = S0(f.place, f.w); sb.dareToday();
    let rel = null; DELAY = () => new Promise(r => { rel = r; });
    sb.drRefresh(false); await tick();
    const pa = sb.drAccept(); await tick();
    sb.document.hidden = true; DELAY = null; if (rel) rel();               // the app goes to the background before the phone answers
    const res = await pa; await flush();
    check("the app hides while Accept waits: not accepted, the stale toast, busy cleared",
      res === false && cur().st === "new" && R.toast[R.toast.length - 1] === "Couldn't get a fresh forecast. Try again in a minute." && busyOff(),
      `Accept ${res}, ${desc(cur())}, toasts ${R.toast.join(" | ")}, busy ${sb.drS().busy}, busyN ${sb.drS().busyN}`);
    sb.document.hidden = false;
    for (const h of hk("fg").slice()) h();
    await flush();
    const a1 = sb.drView() && sb.drView().acts, ok2 = await sb.drAccept(); await flush();
    check("back to the front: Accept shows and works", a1 === "new" && ok2 === true && cur().st === "yes" && busyOff(), `acts ${a1}, Accept ${ok2}, ${desc(cur())}`);
  });
  await guard("busy: Check the forecast", async () => {
    reset(); const f = fx("rain"); sb.S = S0(f.place, f.w); sb.dareToday();
    const rel = []; DELAY = () => new Promise(r => rel.push(r));
    sb.drRefresh(false); await tick(); sb.drRefresh(true, {}); await tick();
    const pc = sb.drRefresh(true, { busy: true }); await tick();          // the page's "Check the forecast" joins the queued forced check
    const shown = sb.drS().busy === true;
    DELAY = null; rel.forEach(r => r()); await pc; await flush();
    const v = sb.drView();
    check("\"Check the forecast\" behind a queued forced check: busy while it runs, cleared after", shown && busyOff() && v && v.acts === "new", `busy shown ${shown}, busy ${sb.drS().busy}, busyN ${sb.drS().busyN}, acts ${v && v.acts}`);
  });
  await guard("busy: day", async () => {
    reset(); const f = fx("rain"); sb.S = S0(f.place, f.w); sb.dareToday();
    sb.drS().busy = true; sb.drS().busyN = 2;
    for (const h of hk("day").slice()) h("x");
    await flush();
    check("a new day clears a stuck \"Checking the forecast…\"", busyOff(), `busy ${sb.drS().busy}, busyN ${sb.drS().busyN}`);
  });

  /* 14. picked before the phone answers hello, with a cached reading that says no: never drawn as a walk */
  for (const n of ["thunder", "gust", "sleet", "freeze", "far", "dark"]) await guard(`caps null, cached ${n}`, async () => {
    pickRain();
    const g = fx(n); sb.S.wx.last = g.w; if (n === "far") sb.S.wx.place = g.place;
    sb.NATIVE = inSb({ on: true, caps: null });
    const c = sb.dareToday(), v = sb.drView();
    const walk = v && /minutes out in it|Go\.|walk starts|minutes outside|brisk minutes|into the wind/.test(`${v.card.line} ${v.lead}`);
    check(`caps not here, a new rain dare, cached ${n}: "${v && v.card.eye} / ${v && v.card.line}", warn "${v && v.warn}"`,
      c && c.kind === "wx" && c.id === "rain" && v && v.acts === "stale" && /^Picked on /.test(v.card.line) && v.card.eye === "Weather dare" && !!v.warn && !walk,
      `${desc(c)}, acts ${v && v.acts}, lead "${v && v.lead}"`);
  });
  await guard("caps null, Accept", async () => {
    pickRain();
    sb.S.wx.last = fx("thunder").w; sb.NATIVE = inSb({ on: true, caps: null });
    const res = await sb.drAccept(); await flush();
    check("caps not here, cached thunder: Accept refused with the toast \"Thunder in the forecast.\", no weather call",
      res === false && cur().st === "new" && R.toast[R.toast.length - 1] === "Thunder in the forecast." && R.nvw.length === 0 && busyOff(),
      `Accept ${res}, ${desc(cur())}, toasts ${R.toast.join(" | ")}, nvWeather calls ${R.nvw.length}`);
  });
  await guard("caps null, nvReady", async () => {
    pickRain();
    sb.S.wx.last = fx("thunder").w; sb.NATIVE = inSb({ on: true, caps: null });
    let hello = null; sb.nvReady = () => (sb.NATIVE.caps ? Promise.resolve(true) : new Promise(r => { hello = r; }));
    const pa = sb.drAccept(); await tick();
    const shown = sb.drS().busy === true && sb.drView() && sb.drView().acts === "busy";
    sb.NATIVE.caps = inSb({ v: 2, wx: true }); if (hello) hello(true);
    const res = await pa; await flush();
    check("caps not here, nvReady present: \"Checking the forecast…\" until hello, then the forced check turns it indoor, nothing accepted",
      shown && res === false && cur().kind === "wx" && cur().id === "indoor" && cur().st === "new" && busyOff() && R.nvw.includes(true),
      `busy shown ${shown}, Accept ${res}, ${desc(cur())}, force calls ${JSON.stringify(R.nvw)}`);
  });

  /* 15. midnight: yesterday's weather dare can't be ticked, finished or skipped (life keeps today's Done) */
  await guard("midnight", async () => {
    const t0 = Date.UTC(2026, 9, 17, 17, 0); // 18:00 BST
    reset(t0, 60); const f = fx("rain", t0); sb.S = S0(f.place, f.w); sb.dareToday();
    NEXT = () => fx("rain", t0).w; const ok = await sb.drAccept(); await flush(); NEXT = null;
    if (!ok || cur().st !== "yes") throw new Error(`accepting at 18:00 gave ${ok}, ${desc(cur())}; toasts ${R.toast.join(" | ")}`);
    const D = sb.S.dares, before = JSON.stringify(D);
    clock(Date.UTC(2026, 9, 17, 23, 10), 60);                             // 00:10 BST on 18 Oct
    sb.S.water[sb.dkey(0)] = 3;                                            // water today that would tick the row
    const r = { "drRow(water)": sb.drRow("water"), "drRow(walk)": sb.drRow("walk"), "drRow(breath)": sb.drRow("breath"),
      "drSkip(false)": sb.drSkip(false), "drSkip(true)": sb.drSkip(true), "drFinish(button)": sb.drFinish("button"), "drCheck()": sb.drCheck() };
    await flush();
    const said = Object.keys(r).filter(k => r[k] !== false);
    check("00:10 the next day: Done, row ticks, Not today and drCheck do nothing on yesterday's weather dare; won, wxWon and scale unchanged",
      !said.length && JSON.stringify(D) === before && D.cur.st === "yes",
      `${said.map(k => k + " → " + r[k]).join(", ") || "all false"}; won ${D.won}, wxWon ${D.wxWon}, scale ${D.scale}, ${desc(D.cur)}`);
    const c = sb.dareToday();
    check("the next pick is today's", c && c.d === sb.dkey(0), desc(c));
    clock(t0, 60); sb.S.dares.cur = inSb({ d: sb.dkey(0), kind: "life", id: "phone", st: "yes", sc: 1, at: t0 });
    const w1 = sb.S.dares.won || 0;
    clock(Date.UTC(2026, 9, 17, 23, 10), 60);
    const done = sb.drFinish("button"), again = sb.drFinish("button");
    check("a life dare's Done after midnight still counts, once", done === true && again === false && sb.S.dares.won === w1 + 1, `drFinish ${done} then ${again}, won ${w1} → ${sb.S.dares.won}`);
  });
  /* analytics carry plain words only */
  const okKeys = new Set(["st", "kind", "on", "src"]);
  const leaks = R.track.filter(([, o]) => o && typeof o === "object" && Object.keys(o).some(k => !okKeys.has(k) || (o[k] !== null && typeof o[k] !== "string" && typeof o[k] !== "boolean") || /London|Sydney|Leeds|°C/.test(String(o[k]))));
  check(`${R.track.length} analytics events carry plain words only`, !leaks.length, leaks.map(x => JSON.stringify(x)).join(" "));
  const whats = new Set(["check", "wx", "accept", "skip", "tick", "done", "tone", "opt"]);
  const odd = R.emit.filter(([e, o]) => e === "dare" && (!o || !whats.has(o.what)));
  check(`${R.emit.filter(e => e[0] === "dare").length} dare events, each with a known "what"`, !odd.length, odd.map(x => JSON.stringify(x[1])).join(" "));
  if (R.hookErr.length) fail(`listeners or timers threw in the sandbox: ${[...new Set(R.hookErr)].slice(0, 5).join(" | ")}`);
  check("the engine logged no warnings in the sandbox (a swallowed error would show here)", !R.warn.length, [...new Set(R.warn)].slice(0, 5).join(" | "));
}

async function main() {
  if (gateOk) {
    try { W = await import(pathToFileURL(path.join(ROOT, "native/weather.js")).href); }
    catch (e) { fail(`native/weather.js can't be imported: ${e.message}`); }
    if (W) { stageA(); stageC(); }
    if (W && !GATE_ONLY) await stageB();
  }
  stageD();
  if (!GATE_ONLY) stageE();
  stageF();

  console.log("\n== Summary ==");
  console.log(`${N.severe} severe cases: ${N.severeBad ? N.severeBad + " FAILED (an outdoor dare, a wrong rule or an error)" : "none gives an outdoor dare"}`);
  console.log(`${N.control} controls: ${N.controlBad ? N.controlBad + " not as expected" : "as expected"}`);
  console.log(`${N.known} known gate limits (listed above, not failures)${N.handled ? `; ${N.handled} now handled` : ""}`);
  console.log(`${N.sweep} light checks (the sweep): ${N.sweepBad ? N.sweepBad + " FAILED" : "the walk never starts in the dark or outside 06:00-21:00"}`);
  if (!GATE_ONLY) console.log(`${N.b} engine checks (Stage B): ${N.bBad ? N.bBad + " failed" : "all pass"}`);
  console.log("Limits the check can't see (the phone's summary hides them; Build 10 native follow-up):");
  for (const s of ["thunder only from the symbol outside the Nordic area, and a thunder probability under 30 % is dropped",
    "no temperatures later in the 3-hour window (soon has none)",
    "ice from air temperature only (MET has no ground temperature or freezing-rain symbol)",
    "fog and sleet masked in soon.symbol behind a higher-ranked symbol (partly covered by wet ice at ≤ 5 °C)",
    "a missing precipitation amount reads as 0 mm",
    "the place check looks at longitude only (the town's solar noon within 3.5 h of 12:00 on your phone): a typed town far north or south of you, or up to about 3 time zones east or west, can show daylight you don't have"]) console.log("  - " + s);
  if (GATE_ONLY) console.log("(--gate: Stages B and E and the dares.js parts of D and F were skipped)");
  console.log(fails ? `\ncheck-dares: ${fails} problem(s)` : "\ncheck-dares: all clear");
  process.exit(fails ? 1 : 0);
}
main().catch(e => { console.log("FAIL  check-dares crashed: " + (e && e.stack || e)); process.exit(1); });
