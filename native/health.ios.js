// Apple Health (iPhone). Reads steps, last night's sleep and resting heart rate.
// Only works in a real build of Ossa (with an Apple Developer account), not in Expo Go.
import { isRunningInExpoGo } from "expo";

let AH = null;
if (!isRunningInExpoGo()) {
  try {
    AH = require("react-native-health");
    if (!AH || typeof AH.initHealthKit !== "function") AH = null;
  } catch (e) {
    AH = null;
  }
}

export const source = "Apple Health";

const call = (fn, opts) =>
  new Promise((res) => {
    try {
      AH[fn](opts, (err, r) => res(err ? null : r));
    } catch (e) {
      res(null);
    }
  });

export async function status() {
  if (!AH) return "needs-build";
  const ok = await new Promise((res) => {
    try {
      AH.isAvailable((err, r) => res(!err && !!r));
    } catch (e) {
      res(false);
    }
  });
  return ok ? "ok" : "missing";
}

let inited = false;
async function init() {
  if (!AH) return false;
  if (inited) return true;
  const P = AH.Constants.Permissions;
  const r = await new Promise((res) => {
    try {
      AH.initHealthKit({ permissions: { read: [P.StepCount, P.SleepAnalysis, P.RestingHeartRate], write: [] } }, (err) => res(!err));
    } catch (e) {
      res(false);
    }
  });
  inited = r;
  return r;
}

// Apple never says whether reading was allowed, so "connected" means the sheet was shown.
export async function connect() {
  const st = await status();
  if (st !== "ok") return { ok: false, why: st };
  return (await init()) ? { ok: true } : { ok: false, why: "denied" };
}

const dayAt = (n, h = 12) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, 0, 0, 0);
  return d;
};

export async function read() {
  if (!(await init())) return { ok: false, why: "needs-build" };
  const out = { ok: true, src: "hk", at: Date.now(), steps: {}, sleepH: null, rhr: null };
  const s0 = await call("getStepCount", { date: new Date().toISOString(), includeManuallyAdded: true });
  const s1 = await call("getStepCount", { date: dayAt(1).toISOString(), includeManuallyAdded: true });
  if (s0 && s0.value != null) out.steps[0] = Math.round(s0.value);
  if (s1 && s1.value != null) out.steps[1] = Math.round(s1.value);
  const from = dayAt(1, 16);
  const sl = await call("getSleepSamples", { startDate: from.toISOString(), endDate: new Date().toISOString() });
  if (Array.isArray(sl) && sl.length) {
    // merge overlapping "asleep" samples (watch + phone can both write), skip time in bed / awake
    const iv = sl
      .filter((x) => x.value && !/INBED|AWAKE/.test(x.value))
      .map((x) => [new Date(x.startDate).getTime(), new Date(x.endDate).getTime()])
      .sort((a, b) => a[0] - b[0]);
    let ms = 0, cur = null;
    for (const [a, b] of iv) {
      if (!cur || a > cur[1]) {
        if (cur) ms += cur[1] - cur[0];
        cur = [a, b];
      } else cur[1] = Math.max(cur[1], b);
    }
    if (cur) ms += cur[1] - cur[0];
    if (ms > 0) out.sleepH = Math.round((ms / 3.6e6) * 10) / 10;
  }
  const hr = await call("getRestingHeartRateSamples", { startDate: dayAt(7, 0).toISOString(), endDate: new Date().toISOString(), limit: 7 });
  if (Array.isArray(hr) && hr.length) out.rhr = Math.round(hr.reduce((a, x) => a + x.value, 0) / hr.length);
  return out;
}

export function openSettings() {}
