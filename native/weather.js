// The weather where you are, from MET Norway's Locationforecast 2.0 (/complete), fetched here on the
// phone, never from the page. MET's terms, as followed here:
// - an identifying User-Agent ("Ossa/<version> https://getossa.app") and no other identifying header,
//   no cookies (credentials "omit"), coordinates sent as 2-decimal strings (MET allows at most 4);
// - no new request before max(1 hour, Expires); then If-Modified-Since; a 304 keeps what we have;
// - nothing is fetched unless the page asks while Ossa is open (App.js refuses in the background).
// The forecast is cut down to 48 hourly steps and kept in AsyncStorage, so a cached or 304 forecast
// still describes the current hour. Only a short summary (about 300 bytes) goes to the page.
// Data: MET Norway, CC BY 4.0. The credit travels with every summary.

const MET_URL = "https://api.met.no/weatherapi/locationforecast/2.0/complete";
const HOUR = 3600e3;
const STALE = 6 * HOUR; // serve an older forecast (marked stale) for up to 6 hours when offline or refused
const MAX_EXP = 6 * HOUR; // never trust an Expires further out than this
const KEY = "ossa-wx-v1";
const STEPS = 48;
const CREDIT = "Weather data from MET Norway";

let VERSION = "1.0.0";
try {
  VERSION = require("../app.json").expo.version || VERSION;
} catch (e) {}
export const UA = `Ossa/${VERSION} https://getossa.app`;

// AsyncStorage is loaded lazily so this file can also be checked in plain Node
function store() {
  try {
    const m = require("@react-native-async-storage/async-storage");
    return m.default || m;
  } catch (e) {
    return null;
  }
}

const mem = { c: null, loaded: false, fail: null, busy: null };

// "53.80" — always exactly two decimals, never "-0.00"
export function fx(x) {
  const s = (Math.round(+x * 100) / 100).toFixed(2);
  return s === "-0.00" ? "0.00" : s;
}
export function keyOf(lat, lon) {
  return fx(lat) + "," + fx(lon);
}
export function urlOf(lat, lon) {
  return `${MET_URL}?lat=${fx(lat)}&lon=${fx(lon)}`;
}
const num = (x) => (typeof x === "number" && isFinite(x) ? x : null);
export function validCoords(lat, lon) {
  return num(lat) != null && num(lon) != null && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

// MET's JSON → our hourly series [{t, temp, wind, gust, fog, sym, pr, thp}]
export function trim(json) {
  const ts = json && json.properties && Array.isArray(json.properties.timeseries) ? json.properties.timeseries : null;
  if (!ts) return null;
  const step = (s) => {
    const d = (s && s.data) || {};
    const i = (d.instant && d.instant.details) || {};
    const n1 = d.next_1_hours || null, n6 = d.next_6_hours || null;
    const per = n1 || n6 || {};
    return {
      t: Date.parse(s.time),
      temp: num(i.air_temperature),
      wind: num(i.wind_speed),
      gust: num(i.wind_speed_of_gust),
      fog: num(i.fog_area_fraction),
      sym: (per.summary && per.summary.symbol_code) || null,
      pr: n1 && n1.details ? num(n1.details.precipitation_amount) : null,
      thp: n1 && n1.details ? num(n1.details.probability_of_thunder) : null,
    };
  };
  let out = ts.filter((s) => s && s.data && s.data.next_1_hours).slice(0, STEPS).map(step);
  if (!out.length) out = ts.slice(0, STEPS).map(step); // no hourly periods: fall back to the 6-hour symbol
  out = out.filter((s) => isFinite(s.t));
  return out.length ? out : null;
}

// how bad a symbol is, for "the worst of the next 3 hours"
export function symRank(sym) {
  const s = String(sym || "").replace(/_(day|night|polartwilight)$/, "");
  if (!s) return -1;
  if (/thunder/.test(s)) return 9;
  const light = /^light/.test(s) ? 2 : 0;
  if (/heavy(snow|sleet)/.test(s)) return 8;
  if (/heavyrain/.test(s)) return 7;
  if (/snow|sleet/.test(s)) return 6 - light;
  if (/rain/.test(s)) return 5 - light;
  if (/^fog/.test(s)) return 3;
  if (/^cloudy/.test(s)) return 2;
  if (/^partlycloudy/.test(s)) return 1.5;
  if (/^fair/.test(s)) return 1;
  return 0; // clearsky
}

// Sunrise and sunset on the phone (the NOAA / sunrise-equation approximation, about a minute out),
// for the local solar day that contains `now`. polar: "day" (sun never sets) or "night" (never rises).
export function sun(lat, lon, now) {
  const rad = Math.PI / 180;
  const jd = now / 86400000 + 2440587.5;
  const n = Math.round(jd - 2451545 + lon / 360); // the solar noon nearest to now, at this longitude
  const Js = n - lon / 360;
  const M = (357.5291 + 0.98560028 * Js) % 360;
  const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
  const L = (M + C + 180 + 102.9372) % 360;
  const Jt = 2451545 + Js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad);
  const sd = Math.sin(L * rad) * Math.sin(23.4397 * rad);
  const cd = Math.cos(Math.asin(sd));
  const cw = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * sd) / (Math.cos(lat * rad) * cd);
  const ms = (j) => Math.round((j - 2440587.5) * 86400000);
  if (!(cw >= -1)) return { rise: null, set: null, polar: "day", dark: false };
  if (!(cw <= 1)) return { rise: null, set: null, polar: "night", dark: true };
  const w = Math.acos(cw) / rad;
  const rise = ms(Jt - w / 360), set = ms(Jt + w / 360);
  return { rise, set, polar: null, dark: !(now >= rise && now <= set) };
}

// the summary the page gets: now, the worst of the next 3 hours, and whether it's dark
export function summarise(c, now) {
  const S = c.series || [];
  let i = -1;
  for (let k = 0; k < S.length; k++) if (S[k].t <= now) i = k;
  if (i < 0) i = 0;
  const cur = S[i] || {};
  const next = S.filter((s) => s.t >= (cur.t || 0) && s.t < now + 3 * HOUR);
  const max = (f) => next.reduce((a, s) => (s[f] != null && (a == null || s[f] > a) ? s[f] : a), null);
  const thunderOf = (s) => /thunder/.test(s.sym || "") || (s.thp != null && s.thp >= 30);
  const worst = next.reduce((a, s) => (a == null || symRank(s.sym) > symRank(a) ? s.sym : a), null);
  const [lat, lon] = String(c.key).split(",").map(Number);
  const sn = sun(lat, lon, now);
  const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
  return {
    ok: true,
    src: "met",
    key: c.key,
    at: c.at,
    exp: Math.max(c.at + HOUR, c.exp || 0),
    upd: c.upd || null,
    temp: r1(cur.temp),
    symbol: cur.sym || null,
    wind: r1(cur.wind),
    gust: r1(cur.gust),
    precip: r1(cur.pr == null ? 0 : cur.pr),
    thunder: thunderOf(cur),
    fog: (cur.fog != null && cur.fog >= 50) || /^fog/.test(cur.sym || ""),
    soon: {
      gust: r1(max("gust")),
      wind: r1(max("wind")),
      precip: r1(next.reduce((a, s) => a + (s.pr || 0), 0)),
      thunder: next.some(thunderOf),
      symbol: worst,
    },
    rise: sn.rise,
    set: sn.set,
    polar: sn.polar,
    dark: sn.dark,
    credit: CREDIT,
  };
}

// fresh enough to answer without asking MET?
export function fresh(c, key, now) {
  return !!c && c.key === key && Array.isArray(c.series) && now < Math.max(c.at + HOUR, c.exp || 0);
}
export function usableStale(c, key, now) {
  return !!c && c.key === key && Array.isArray(c.series) && c.series.length > 0 && now - c.at < STALE;
}
// next-allowed time from an Expires header (never earlier than 1 hour, never later than 6)
export function expOf(h, now) {
  const e = Date.parse(h || "");
  return isFinite(e) ? Math.min(Math.max(e, now + HOUR), now + MAX_EXP) : now + HOUR;
}
// after a failed fetch, wait before asking MET again (short for offline, longer when MET refused)
export function backoff(why) {
  return why === "offline" || why === "timeout" ? 2 * 60e3 : 15 * 60e3;
}

async function load() {
  if (mem.loaded) return mem.c;
  mem.loaded = true;
  const A = store();
  if (!A) return mem.c;
  try {
    const s = await A.getItem(KEY);
    const c = s ? JSON.parse(s) : null;
    if (c && c.key && Array.isArray(c.series) && !mem.c) mem.c = c;
  } catch (e) {}
  return mem.c;
}
async function persist(c) {
  mem.c = c;
  const A = store();
  if (!A) return;
  try {
    await A.setItem(KEY, JSON.stringify(c));
  } catch (e) {}
}

// one request to MET; deps are injectable so this can be checked with a fake fetch in Node
export async function request(lat, lon, c, deps = {}) {
  const f = deps.fetch || fetch;
  const now = (deps.now || Date.now)();
  const key = keyOf(lat, lon);
  const headers = { "User-Agent": UA, Accept: "application/json" };
  if (c && c.key === key && c.lm) headers["If-Modified-Since"] = c.lm;
  const AC = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = AC ? setTimeout(() => AC.abort(), deps.timeout || 10000) : null;
  let res;
  try {
    // no `cache` option: React Native's fetch would add ?_=<time> to the URL for no-store/no-cache
    res = await f(urlOf(lat, lon), { method: "GET", headers, credentials: "omit", signal: AC ? AC.signal : undefined });
  } catch (e) {
    if (timer) clearTimeout(timer);
    return { ok: false, why: e && e.name === "AbortError" ? "timeout" : "offline" };
  }
  try {
    const hd = (n) => (res.headers && res.headers.get ? res.headers.get(n) : null);
    if (res.status === 304 && c && c.key === key) {
      return { ok: true, c: { ...c, at: now, exp: expOf(hd("expires"), now), lm: hd("last-modified") || c.lm } };
    }
    if (res.status !== 200) return { ok: false, why: "http-" + res.status };
    const json = await res.json();
    const series = trim(json);
    if (!series) return { ok: false, why: "bad-data" };
    const upd = (json.properties.meta && json.properties.meta.updated_at) || null;
    return { ok: true, c: { key, at: now, exp: expOf(hd("expires"), now), lm: hd("last-modified") || null, upd, series } };
  } catch (e) {
    return { ok: false, why: e && e.name === "AbortError" ? "timeout" : "bad-data" };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// The page's {t:"weather", lat, lon}. Coordinates are rounded to 2 decimals before anything else.
export async function get(lat, lon, deps = {}) {
  lat = +lat;
  lon = +lon;
  if (!validCoords(lat, lon)) return { ok: false, why: "bad-coords" };
  const now = (deps.now || Date.now)();
  const key = keyOf(lat, lon);
  const c = await load();
  if (fresh(c, key, now)) return { ...summarise(c, now), cached: true };
  // one request at a time; a second ask while it's out waits for the same answer
  if (mem.busy && mem.busy.key === key) return mem.busy.p;
  const f = mem.fail;
  if (f && f.key === key && now - f.at < backoff(f.why)) {
    return usableStale(c, key, now) ? { ...summarise(c, now), stale: true } : { ok: false, why: f.why, wait: true };
  }
  const p = (async () => {
    const r = await request(lat, lon, c, deps);
    const t = (deps.now || Date.now)();
    if (r.ok) {
      mem.fail = null;
      await persist(r.c);
      return summarise(r.c, t);
    }
    mem.fail = { key, at: t, why: r.why };
    if (usableStale(c, key, t)) return { ...summarise(c, t), stale: true };
    return { ok: false, why: r.why };
  })();
  mem.busy = { key, p };
  try {
    return await p;
  } finally {
    if (mem.busy && mem.busy.p === p) mem.busy = null;
  }
}

// for tests only: forget the in-memory cache
export function _reset(c) {
  mem.c = c || null;
  mem.loaded = !!c;
  mem.fail = null;
  mem.busy = null;
}
