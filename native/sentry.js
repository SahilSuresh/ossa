/* =========================================================
   SENTRY — crash and error reporting (22 Oct 2026, Sahil).
   Sentry is only initialised when a DSN is present (EXPO_PUBLIC_SENTRY_DSN at build time, Expo Updates runtime
   config, or the one baked into app.json's `extra.sentryDsn`). In Expo Go, in dev, and without a DSN, this
   module becomes a no-op so a missing environment variable never crashes the app.

   JS errors inside the WebView don't reach the native layer by default; recv() below picks up messages of the
   shape {t:"err", msg, stack, where} that ossa.html posts through nsend(), and forwards them to Sentry with
   {source: "webview"} tags so native and WebView errors can be told apart.
   ========================================================= */

let Sentry = null;
try { Sentry = require("@sentry/react-native"); } catch (e) { Sentry = null; }

let INITED = false;

function getDsn() {
  try {
    if (typeof process !== "undefined" && process.env && process.env.EXPO_PUBLIC_SENTRY_DSN) return process.env.EXPO_PUBLIC_SENTRY_DSN;
  } catch (e) {}
  try {
    const Constants = require("expo-constants");
    const extra = (Constants && (Constants.expoConfig || Constants.manifest || {}).extra) || {};
    if (extra.sentryDsn) return extra.sentryDsn;
  } catch (e) {}
  return null;
}

function appVersion() {
  try {
    const Constants = require("expo-constants");
    const v = (Constants && Constants.expoConfig && Constants.expoConfig.version) || null;
    return v || "0.0.0";
  } catch (e) { return "0.0.0"; }
}

/* Init runs once, as early as possible from App.js; later calls are no-ops. Returns true when Sentry is live. */
export function init() {
  if (INITED || !Sentry || !Sentry.init) return !!INITED;
  const dsn = getDsn();
  if (!dsn) return false;
  try {
    const inExpoGo = (() => { try { return require("expo").isRunningInExpoGo && require("expo").isRunningInExpoGo(); } catch (e) { return false; } })();
    Sentry.init({
      dsn,
      enabled: !inExpoGo,                     // Expo Go can't bundle the native bits, so stay quiet there
      debug: false,
      enableAutoSessionTracking: true,
      tracesSampleRate: 0.05,                 // light sampling: catch patterns without blowing the free tier
      release: "ossa@" + appVersion(),
      environment: __DEV__ ? "dev" : "production",
      ignoreErrors: [
        /ExponentPushToken/i,                 // Expo Go push warnings (we don't use push)
        /Non-serializable values were found/i,
        /Possible unhandled promise rejection/i, // noisy; actual crashes still land
      ],
    });
    Sentry.setTag("layer", "native");
    INITED = true;
    return true;
  } catch (e) {
    try { console.warn("Sentry init failed:", e && e.message ? e.message : e); } catch (_) {}
    return false;
  }
}

/* The WebView bridge: App.js already routes OssaNative messages here through onMessage. */
export function recv(m) {
  if (!INITED || !Sentry || !m || m.t !== "err") return false;
  try {
    const err = new Error(String(m.msg || "WebView error"));
    err.name = "WebViewError";
    if (m.stack) err.stack = String(m.stack);
    Sentry.withScope(scope => {
      scope.setTag("source", "webview");
      if (m.where) scope.setTag("where", String(m.where));
      if (m.url) scope.setExtra("url", String(m.url));
      if (m.line) scope.setExtra("line", m.line);
      if (m.col) scope.setExtra("col", m.col);
      Sentry.captureException(err);
    });
    return true;
  } catch (e) {
    try { console.warn("Sentry recv failed:", e && e.message ? e.message : e); } catch (_) {}
    return false;
  }
}

/* Wraps the root component so React render errors are caught. Falls through unchanged when Sentry is off. */
export function wrap(App) {
  if (!Sentry || !Sentry.wrap) return App;
  const dsn = getDsn();
  if (!dsn) return App;
  try { return Sentry.wrap(App); } catch (e) { return App; }
}

export function captureMessage(msg, extra) {
  if (!INITED || !Sentry) return;
  try {
    Sentry.withScope(scope => {
      if (extra && typeof extra === "object") Object.keys(extra).forEach(k => scope.setExtra(k, extra[k]));
      Sentry.captureMessage(String(msg));
    });
  } catch (e) {}
}

export default { init, recv, wrap, captureMessage };
