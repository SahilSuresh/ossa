// Face down or not, for Offline sessions (20 Oct): the page counts only minutes with the phone face down.
// - The accelerometer runs only while the page asks for it (an Offline session is on), at 2 readings a second.
// - z < −0.8 g means face down (the screen towards the floor). Only changes are sent, with a little hysteresis.
// - expo-sensors loads inside try/require, so a build made before it was added doesn't crash; it then says
//   "needs-build" and the page counts every minute. Expo Go (iOS and Android) includes it.
let A = null;
try {
  A = require("expo-sensors").Accelerometer;
} catch (e) {
  A = null;
}
export const available = !!A;

let sub = null;
let last = null;

export async function start(onChange) {
  stop();
  if (!A) return { ok: false, why: "needs-build" };
  try {
    const ok = await A.isAvailableAsync();
    if (!ok) return { ok: false, why: "no-sensor" };
    A.setUpdateInterval(500);
    sub = A.addListener(({ z }) => {
      const down = last ? z < -0.7 : z < -0.8; // once down, stay down until clearly lifted
      if (down !== last) {
        last = down;
        onChange(down);
      }
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, why: "error" };
  }
}

export function stop() {
  try {
    if (sub) sub.remove();
  } catch (e) {}
  sub = null;
  last = null;
}
