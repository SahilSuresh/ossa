// Shared bits for the home-screen and lock-screen widgets on both platforms (Ossa 2.0, Build 9).
// The web app sends a small snapshot (v3, built in web/ui/widget.js): the streak for each day of the
// coming week, the weak link, the overall rank, your body in rank colours and the week's sessions.
// It's saved on the phone so the widget can redraw itself while Ossa is closed. Body Score stays in the app.
import AsyncStorage from "@react-native-async-storage/async-storage";

export const KEY = "ossa-widget-v1";

// A hand-kept mirror of web/ui/tokens.css: native code can't read the page's tokens, so change both together.
// (The body picture's colours need no mirror: the page draws it from the tokens.)
// OssaWidget.ios.js repeats these inside its widget function, which can't see anything outside itself.
export const C = {
  bg: "#000000", // --bg
  chip: "#1A1A1A", // --surface-3
  line: "#262626", // --line
  ink: "#FFFFFF", // --text-1
  sub: "#9CA3AF", // --text-2
  faint: "#6B7280", // --text-3
  lime: "#D4FF00", // --glow
};
// --rk-0 … --rk-5: Unranked, Fragile, Stable, Strong, Forged, Unbreakable
export const RK = ["#2A2A2A", "#4A4A4A", "#C5A059", "#FFFFFF", "#FFD700", "#00E5FF"];

// The streak flame (UI_FLAME in web/ui/ranks.js): lime, with the inner flame cut out in black.
// Android draws it as SVG; the iPhone widget uses the SF Symbol flame.fill instead.
export const FLAME = [
  "M12 22c-4.4 0-6.5-3.1-6.5-6 0-4.6 4-6 4.6-11 3.3 2 8.4 5.8 8.4 11 0 2.9-2.1 6-6.5 6z",
  "M12 22c-1.9 0-2.6-1.6-2.6-2.9 0-1.9 1.9-3.1 2.6-5 1.3 1.3 2.6 3.1 2.6 5 0 1.3-.7 2.9-2.6 2.9z",
];
export function flameSvg(c = C.lime, hole = C.bg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="${FLAME[0]}" fill="${c}"/><path d="${FLAME[1]}" fill="${hole}"/></svg>`;
}

// The body picture holds front and back side by side (viewBox 38 4 262 396).
// The small widget shows one side, the weak link's; only the viewBox changes (wgHalf in web/ui/widget.js).
export const FIG_RATIO = 262 / 396;
export const HALF_RATIO = 124 / 396;
export function figHalf(svg, side) {
  return String(svg || "")
    .replace('viewBox="38 4 262 396"', `viewBox="${side === "back" ? 176 : 38} 4 124 396"`)
    .replace(/ width="\d+" height="(\d+)"/, (m, h) => ` width="${Math.round(h * HALF_RATIO)}" height="${h}"`);
}

export function dayKey(d = new Date()) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export async function saveSnap(snap) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(snap));
  } catch (e) {}
}

export async function loadSnap() {
  try {
    const s = await AsyncStorage.getItem(KEY);
    return s ? JSON.parse(s) : null;
  } catch (e) {
    return null;
  }
}

// the snapshot's entry for a date, so the widget stays right after midnight
export function todayOf(snap, d = new Date()) {
  const k = dayKey(d);
  const w = (snap && snap.week) || [];
  return w.find((x) => x.d === k) || null;
}

// is the snapshot from today?
export function fresh(snap, d = new Date()) {
  return !!snap && snap.day === dayKey(d);
}

// What a widget says on date d, worked out in one place for both platforms (wgSay in web/ui/widget.js matches it).
// The streak for each day was worked out by the page (week[].sk: what Ossa would show then if nothing more
// is logged), so it changes at midnight without the app. No snapshot, an old one (before v3) or a date past
// its week: { ok: false, msg }.
export function say(snap, d = new Date()) {
  const t = snap && snap.v >= 3 ? todayOf(snap, d) : null;
  if (!t) return { ok: false, msg: snap ? "Open Ossa to update" : "Open Ossa to wake your body up" };
  const n = Math.max(0, Math.round(Number(t.sk) || 0));
  const kept = t.d === snap.day && !!snap.skToday;
  const note = kept ? "Kept today" : t.k === "rest" ? (n ? "Rest day: it won't break" : "Rest day") : n ? "Train today to keep it" : "Train today to start one";
  const weak = String(snap.weak || "");
  return {
    ok: true,
    sk: String(n),
    skTxt: n === 1 ? "DAY" : "DAYS",
    skLine: n ? n + "-day streak" : "Start a streak",
    note,
    weak, // "Shins need you"
    weak2: weak.replace(/ (needs?) you$/, "\n$1 you"), // on two lines, for the small widget
    rk: String(snap.rk || "").toUpperCase(), // "STRONG I"
    rkCol: snap.rkCol || C.sub, // the rank's colour (text-2 below Stable)
    figV: snap.figV === "back" ? "back" : "front",
    pill: t.k === "done" ? "DONE" : "TODAY",
    today: (t.k === "done" ? t.t : t.s || t.t) || "", // short: "Upper · 40m", "Rest day"; done: the title
    todayS: t.s || t.t || "", // "Upper · 40m", "Done · Upper", "Rest day"
    todayK: t.k || "", // train | rest | done
  };
}
