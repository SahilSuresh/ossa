// iPhone widget plumbing. Needs a real build (and an Apple Developer account); in Expo Go it does nothing.
import { isRunningInExpoGo } from "expo";
import { saveSnap, loadSnap, say } from "./widget-shared";

let Ossa = null, dir = "", FS = null;
if (!isRunningInExpoGo()) {
  try {
    Ossa = require("./OssaWidget").default;
    dir = require("expo-widgets").widgetsDirectory || "";
    FS = require("expo-file-system");
  } catch (e) {
    Ossa = null;
  }
}

export const NAME = "OssaBody";
export const available = !!Ossa;

export function register() {}

// SwiftUI can't draw SVG, so the page sends a PNG of the rank body; it's saved where the widget can read it
function saveFigure(b64) {
  if (!b64 || !dir || !FS) return null;
  try {
    const name = "fig-" + Date.now() + ".png";
    const folder = new FS.Directory(dir);
    for (const f of folder.list()) {
      if (f && f.name && /^fig-\d+\.png$/.test(f.name)) {
        try {
          f.delete();
        } catch (e) {}
      }
    }
    const file = new FS.File(dir, name);
    file.write(b64, { encoding: "base64" });
    return file.uri;
  } catch (e) {
    return null;
  }
}

// what one timeline entry shows on date d (strings only, as the widget gets them)
function propsFor(snap, d, fig) {
  const L = say(snap, d);
  if (!L.ok) return { stale: "1", msg: L.msg };
  return {
    fig: fig || "",
    figV: L.figV,
    sk: L.sk,
    skTxt: L.skTxt,
    skLine: L.skLine,
    skNote: L.note,
    weak: L.weak,
    weak2: L.weak2,
    rk: L.rk,
    rkCol: L.rkCol,
    pill: L.pill,
    today: L.today,
    todayS: L.todayS,
    todayK: L.todayK,
  };
}

// One timeline entry per day for the coming week, so the streak and "Today" change at midnight by themselves,
// then an 8th that asks you to open Ossa, because the snapshot knows nothing past its week.
export async function update(snap) {
  if (!snap) return;
  let fig = Ossa ? saveFigure(snap.figPng) : null;
  if (!fig && Ossa) {
    // the page couldn't make a picture this time: keep the last one rather than showing none
    const prev = await loadSnap();
    fig = (prev && prev.figUri) || null;
  }
  await saveSnap({ ...snap, figPng: null, figUri: fig });
  if (!Ossa) return;
  try {
    const entries = [];
    for (let i = 0; i < 8; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      if (i > 0) d.setHours(0, 0, 5, 0);
      entries.push({ date: d, props: i < 7 ? propsFor(snap, d, fig) : { stale: "1", msg: "Open Ossa to update" } });
    }
    Ossa.updateTimeline(entries);
  } catch (e) {}
}

export async function pin() {
  return false;
}
