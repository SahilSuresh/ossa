// The page's save, kept in the app's own Documents folder as well as in the web view's localStorage.
//
// Why (23 Oct 2026, Sahil: "after a few days it forgets the record"): localStorage inside a WKWebView is website
// data. iOS may clear it when the phone is short of space, and WebKit's tracking prevention can delete storage
// that scripts wrote once a few days pass without use. The app's Documents folder is never cleared by iOS and
// is included in iCloud / device backups, which is where Apple expects user-created data like workout records.
//
// The page sends its save as {t:"state:save", j, at} (batched, and flushed when the app goes to the background).
// At start-up App.js reads this file before the web view loads and hands it to the page as window.OSSA_SAVED;
// the page keeps whichever copy is newer (S._at). Writes go to a temporary file first and are then moved into
// place, so a crash mid-write leaves the previous save intact.
import * as FS from "expo-file-system/legacy";

const DIR = FS.documentDirectory || "";
const FILE = DIR + "ossa-state.json";
const TMP = DIR + "ossa-state.tmp";

/** The saved page state as a JSON string, or null when there is none (first launch, or an older build). */
export async function read() {
  if (!DIR) return null;
  for (const f of [FILE, TMP]) {
    try {
      const info = await FS.getInfoAsync(f);
      if (!info.exists) continue;
      const j = await FS.readAsStringAsync(f);
      if (j && j.charAt(0) === "{") return j;
    } catch (e) {}
  }
  return null;
}

// One write at a time, in order, so an older save can never land after a newer one.
let chain = Promise.resolve();
let last = 0;

/** Keep this save. `at` is the page's own save time; a save older than the last one written is ignored. */
export function write(j, at) {
  if (!DIR || typeof j !== "string" || j.charAt(0) !== "{") return chain;
  const t = +at || Date.now();
  chain = chain.then(async () => {
    if (t < last) return;
    try {
      await FS.writeAsStringAsync(TMP, j);
      await FS.deleteAsync(FILE, { idempotent: true });
      await FS.moveAsync({ from: TMP, to: FILE });
      last = t;
    } catch (e) {
      console.warn("Ossa: couldn't keep the save in Documents", e);
    }
  });
  return chain;
}
