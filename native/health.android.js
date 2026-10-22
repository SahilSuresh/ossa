// Health Connect (Android). Reads steps, last night's sleep and resting heart rate.
// Only works in a real build of Ossa, not in Expo Go, so everything is guarded.
import { isRunningInExpoGo } from "expo";

let HC = null;
if (!isRunningInExpoGo()) {
  try {
    HC = require("react-native-health-connect");
  } catch (e) {
    HC = null;
  }
}

const PERMS = [
  { accessType: "read", recordType: "Steps" },
  { accessType: "read", recordType: "SleepSession" },
  { accessType: "read", recordType: "RestingHeartRate" },
];

export const source = "Health Connect";

// "ok" | "needs-build" | "missing" (Health Connect not installed / needs update)
export async function status() {
  if (!HC) return "needs-build";
  try {
    const s = await HC.getSdkStatus();
    if (s !== HC.SdkAvailabilityStatus.SDK_AVAILABLE) return "missing";
    return "ok";
  } catch (e) {
    return "missing";
  }
}

async function init() {
  if (!HC) return false;
  try {
    return await HC.initialize();
  } catch (e) {
    return false;
  }
}

export async function connect() {
  const st = await status();
  if (st !== "ok") return { ok: false, why: st };
  if (!(await init())) return { ok: false, why: "missing" };
  try {
    const got = await HC.requestPermission(PERMS);
    const has = (t) => got.some((p) => p.recordType === t);
    if (!has("Steps") && !has("SleepSession")) return { ok: false, why: "denied" };
    return { ok: true };
  } catch (e) {
    return { ok: false, why: "denied" };
  }
}

const dayStart = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};
const iso = (d) => d.toISOString();

async function stepsOn(n) {
  const r = await HC.aggregateRecord({
    recordType: "Steps",
    timeRangeFilter: {
      operator: "between",
      startTime: iso(dayStart(n)),
      endTime: iso(n === 0 ? new Date() : dayStart(n - 1)),
    },
  });
  return Math.round((r && r.COUNT_TOTAL) || 0);
}

export async function read() {
  if (!(await init())) return { ok: false, why: "needs-build" };
  let granted = [];
  try {
    granted = await HC.getGrantedPermissions();
  } catch (e) {}
  const has = (t) => granted.some((p) => p.recordType === t);
  const out = { ok: true, src: "hc", at: Date.now(), steps: {}, sleepH: null, rhr: null };
  try {
    if (has("Steps")) {
      out.steps[0] = await stepsOn(0);
      out.steps[1] = await stepsOn(1);
    }
  } catch (e) {}
  try {
    if (has("SleepSession")) {
      // the main sleep that ended since 4pm yesterday ("last night")
      const from = dayStart(1);
      from.setHours(16);
      const r = await HC.readRecords("SleepSession", {
        timeRangeFilter: { operator: "between", startTime: iso(from), endTime: iso(new Date()) },
      });
      let ms = 0;
      for (const s of (r && r.records) || []) {
        const a = new Date(s.startTime).getTime(), b = new Date(s.endTime).getTime();
        // count only stages that are actually asleep when the tracker records them
        const stages = s.stages || [];
        if (stages.length) {
          for (const st of stages) {
            if (st.stage === 1 || st.stage === 3 || st.stage === 7) continue; // awake, out of bed, awake in bed
            ms += new Date(st.endTime).getTime() - new Date(st.startTime).getTime();
          }
        } else ms += Math.max(0, b - a);
      }
      if (ms > 0) out.sleepH = Math.round((ms / 3.6e6) * 10) / 10;
    }
  } catch (e) {}
  try {
    if (has("RestingHeartRate")) {
      const r = await HC.aggregateRecord({
        recordType: "RestingHeartRate",
        timeRangeFilter: { operator: "between", startTime: iso(dayStart(7)), endTime: iso(new Date()) },
      });
      if (r && r.BPM_AVG) out.rhr = Math.round(r.BPM_AVG);
    }
  } catch (e) {}
  return out;
}

export function openSettings() {
  try {
    HC && HC.openHealthConnectSettings();
  } catch (e) {}
}
