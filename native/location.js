// Approximate location for the weather. Only ever asked for from a tap on the page.
// - Coordinates are rounded to 2 decimals (about 1.1 km) here, before anything leaves this file;
//   raw ones are never returned or logged.
// - The town name comes from the phone's own geocoder (Apple's on iPhone), once per rounded point.
// - expo-location loads inside try/require, so a dev client built before it was added doesn't
//   crash; it then answers "needs-build". Expo Go (iOS and Android) includes it.
import { Platform } from "react-native";

let L = null;
try {
  L = require("expo-location");
} catch (e) {
  L = null;
}
export const available = !!L;

const FIX_MS = 30 * 60e3; // reuse a fix for 30 minutes
const r2 = (x) => Math.round(x * 100) / 100;
const ok = (x) => typeof x === "number" && isFinite(x);
const fix = { c: null }; // {lat, lon, town, cc, at}: rounded only
const geo = { m: {} }; // typed town → result, so the geocoder isn't asked twice

function within(p, ms) {
  let t;
  return Promise.race([p, new Promise((_, no) => (t = setTimeout(() => no(new Error("timeout")), ms)))]).finally(() => clearTimeout(t));
}
function whyOf(e) {
  const s = String((e && (e.code || "")) + " " + ((e && e.message) || e || ""));
  if (/timeout/i.test(s)) return "timeout";
  if (/unauthori[sz]ed|permission|denied/i.test(s)) return "needs-permission";
  if (/network/i.test(s)) return "offline";
  if (/services.*disabled|LocationServicesDisabled/i.test(s)) return "off";
  return "error";
}
// "Leeds", from the most specific useful field
function townOf(a) {
  if (!a) return "";
  return a.city || a.subregion || a.district || a.region || a.name || "";
}
function approxOf(p) {
  if (Platform.OS === "ios") return !(p && p.ios && p.ios.accuracy === "full");
  return !(p && p.android && p.android.accuracy === "fine");
}

// location services on? true when the phone doesn't answer, so the permission check decides
async function servicesOn() {
  try {
    return (await within(L.hasServicesEnabledAsync(), 3000)) !== false;
  } catch (e) {
    return true;
  }
}

// "granted" | "denied" | "undetermined" | "off" (location services off) | "needs-build"
export async function status() {
  if (!L) return "needs-build";
  try {
    if (!(await within(L.hasServicesEnabledAsync(), 3000))) return "off";
  } catch (e) {}
  try {
    const p = await within(L.getForegroundPermissionsAsync(), 3000);
    return p.granted ? "granted" : p.status || "undetermined";
  } catch (e) {
    return "undetermined";
  }
}

async function label(lat, lon) {
  try {
    const a = (await within(L.reverseGeocodeAsync({ latitude: lat, longitude: lon }), 8000)) || [];
    return { town: townOf(a[0]), cc: (a[0] && a[0].isoCountryCode) || "" };
  } catch (e) {
    return { town: "", cc: "" };
  }
}

// {ok:true, lat, lon, town, cc, approx, cached?} or {ok:false, why, canAsk}
export async function locate(ask) {
  if (!L) return { ok: false, why: "needs-build", canAsk: false };
  try {
    // services first, as status() does: with them off, iPhone reports Ossa's permission as denied
    if (!(await servicesOn())) return { ok: false, why: "off", canAsk: true };
    let p = await within(L.getForegroundPermissionsAsync(), 5000);
    // the system prompt only from a tap, and never once the phone says it can't ask again
    if (!p.granted && ask && p.canAskAgain !== false) p = await L.requestForegroundPermissionsAsync();
    if (!p.granted) return { ok: false, why: "denied", canAsk: p.canAskAgain !== false };
    // and again after the permission check, in case they were switched off meanwhile
    if (!(await servicesOn())) return { ok: false, why: "off", canAsk: true };
    const approx = approxOf(p);
    const now = Date.now();
    if (fix.c && now - fix.c.at < FIX_MS) return { ok: true, lat: fix.c.lat, lon: fix.c.lon, town: fix.c.town, cc: fix.c.cc, approx, cached: true };
    let pos = null;
    try {
      pos = await within(L.getLastKnownPositionAsync({ maxAge: 3 * 3600e3, requiredAccuracy: 20000 }), 4000);
    } catch (e) {
      pos = null;
    }
    if (!pos) pos = await within(L.getCurrentPositionAsync({ accuracy: L.Accuracy.Lowest }), 12000);
    const c = pos && pos.coords;
    if (!c || !ok(c.latitude) || !ok(c.longitude)) return { ok: false, why: "error", canAsk: true };
    const lat = r2(c.latitude), lon = r2(c.longitude);
    // same rounded point as last time: keep its name, don't ask the geocoder again
    const same = fix.c && fix.c.lat === lat && fix.c.lon === lon && fix.c.town;
    const lb = same ? { town: fix.c.town, cc: fix.c.cc } : await label(lat, lon);
    fix.c = { lat, lon, town: lb.town, cc: lb.cc, at: now };
    return { ok: true, lat, lon, town: lb.town, cc: lb.cc, approx };
  } catch (e) {
    const why = whyOf(e);
    return { ok: false, why: why === "needs-permission" ? "denied" : why === "offline" ? "error" : why, canAsk: true };
  }
}

// a typed town → {ok:true, list:[{lat, lon, town, cc}]} (first hit only), or {ok:false, why}
// why: "empty" | "not-found" | "needs-permission" (Android without location permission) | "timeout" | "offline" | "needs-build" | "error"
export async function geocode(q) {
  const s = String(q || "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  if (!s) return { ok: false, why: "empty" };
  if (!L) return { ok: false, why: "needs-build" };
  const k = s.toLowerCase();
  if (geo.m[k]) return geo.m[k];
  try {
    const hits = (await within(L.geocodeAsync(s), 10000)) || [];
    const h = hits.find((x) => x && ok(x.latitude) && ok(x.longitude));
    if (!h) return { ok: false, why: "not-found" };
    const lat = r2(h.latitude), lon = r2(h.longitude);
    const lb = await label(lat, lon);
    const r = { ok: true, list: [{ lat, lon, town: lb.town || s.split(",")[0].trim(), cc: lb.cc }] };
    const keys = Object.keys(geo.m);
    if (keys.length >= 20) delete geo.m[keys[0]];
    geo.m[k] = r;
    return r;
  } catch (e) {
    return { ok: false, why: whyOf(e) };
  }
}
