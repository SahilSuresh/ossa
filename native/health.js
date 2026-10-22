// Fallback for platforms without a health store.
export const source = "";
export async function status() {
  return "needs-build";
}
export async function connect() {
  return { ok: false, why: "needs-build" };
}
export async function read() {
  return { ok: false, why: "needs-build" };
}
export function openSettings() {}
