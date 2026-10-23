import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Keyboard, Linking, LogBox, Platform, Share, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";
import * as Haptics from "expo-haptics";
import { isRunningInExpoGo } from "expo";
import html from "./ossaHtml";
import * as Reminders from "./native/reminders";
import * as Widget from "./native/widget";
import * as Health from "./native/health";
import * as IAP from "./native/purchases";
import * as Pose from "./native/pose";
import * as Loc from "./native/location";
import * as Wx from "./native/weather";
import * as Face from "./native/face";
import * as Sentry from "./native/sentry";
import * as State from "./native/state";

// Sentry is initialised as early as possible so it catches render-time crashes too. It no-ops without a DSN
// and in Expo Go (where @sentry/react-native's native bits can't load), so this import is safe everywhere.
Sentry.init();

// Expo Go prints a reminder that push notifications need a real build. Ossa only uses
// local reminders (which do work in Expo Go), so the warning is just noise.
LogBox.ignoreLogs(["expo-notifications", "`expo-notifications`"]);

// Native modules added in Build 9 load inside try/require: a dev client built before they were
// added (or any build without them) then simply goes without, instead of crashing on start.
// Android draws edge to edge, and its web view often reports 0 for env(safe-area-inset-*), so bottom buttons
// ended up under the navigation bar (20 Oct, a Samsung with 3-button navigation). So on Android the page runs
// full screen and we tell it the real status and navigation bar sizes; its --sat/--sab tokens take the larger of
// those and env() (web/ui/tokens.css), so nothing is padded twice. iOS's web view reports them itself.
let SA = null;
try {
  SA = require("react-native-safe-area-context");
} catch (e) {
  SA = null;
}
const ZERO = { top: 0, bottom: 0, left: 0, right: 0 };
const useIns = SA && SA.useSafeAreaInsets ? SA.useSafeAreaInsets : () => (SA && SA.initialWindowMetrics && SA.initialWindowMetrics.insets) || ZERO;

let KA = null; // keep the screen on (expo-keep-awake)
try {
  KA = require("expo-keep-awake");
} catch (e) {
  KA = null;
}
let SR = null; // Apple's own rating prompt (expo-store-review); missing in builds before 19 Oct
try {
  SR = require("expo-store-review");
} catch (e) {
  SR = null;
}
const AWAKE = "ossa-awake"; // our own lock; never the default tag, which Expo's dev tools hold
const AWAKE_MS = 2 * 3600e3; // released after 2 hours unless the page says otherwise (4 hours at most)

// The launch screen (black with the mark) stays up until the page says hello, with a 4 s fallback.
// Expo Go shows its own icon instead; hide() is harmless there.
let Splash = null;
try {
  Splash = require("expo-splash-screen");
  const p = Splash.preventAutoHideAsync();
  if (p && p.catch) p.catch(() => {});
  if (!isRunningInExpoGo()) Splash.setOptions({ duration: 250, fade: true });
} catch (e) {}
function hideSplash() {
  try {
    if (Splash) Splash.hide();
  } catch (e) {}
}

// Runs inside the page before Ossa starts: routes vibration to real haptics.
const BRIDGE = `(function () { var send = function (p) { try { window.ReactNativeWebView.postMessage(JSON.stringify({ t: "buzz", p: p })); } catch (e) {} return true; };
  try { Object.defineProperty(navigator, "vibrate", { value: send, configurable: true }); } catch (e) { navigator.vibrate = send; }
  try { Object.defineProperty(navigator, "userActivation", { value: { hasBeenActive: true, isActive: true }, configurable: true }); } catch (e) {}
  window.OSSA_NATIVE = ${JSON.stringify({ platform: Platform.OS })}; })(); true;`;

function buzz(p) {
  const list = Array.isArray(p) ? p : [p];
  const total = list.reduce((a, b) => a + (+b || 0), 0);
  if (list.length > 1) return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  if (total <= 6) return Haptics.selectionAsync();
  if (total <= 10) return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

// Bridge v2 haptics: a named style ({t:"haptic", style}) …
const IMPACT = { light: "Light", medium: "Medium", heavy: "Heavy", soft: "Soft", rigid: "Rigid" };
const NOTE = { success: "Success", warning: "Warning", error: "Error" };
function haptic(s) {
  if (s === "select") return Haptics.selectionAsync();
  if (IMPACT[s]) return Haptics.impactAsync(Haptics.ImpactFeedbackStyle[IMPACT[s]]);
  if (NOTE[s]) return Haptics.notificationAsync(Haptics.NotificationFeedbackType[NOTE[s]]);
  return Promise.resolve();
}
// … or a short sequence ({t:"haptic", seq:[[style, gapMs], …]}), timed here so a heartbeat has no bridge jitter.
// Up to 8 steps; each gap (0–2000 ms) is the wait after the previous step. A new sequence cancels the old one.
const seqT = [];
function hapticSeq(seq) {
  seqT.splice(0).forEach(clearTimeout);
  let at = 0;
  (Array.isArray(seq) ? seq : []).slice(0, 8).forEach((x) => {
    const st = Array.isArray(x) ? String(x[0]) : String(x);
    at += Math.max(0, Math.min(2000, (Array.isArray(x) && +x[1]) || 0));
    seqT.push(
      setTimeout(() => {
        try {
          haptic(st).catch(() => {});
        } catch (e) {}
      }, at)
    );
  });
}

function Main() {
  const ins = useIns();
  const insRef = useRef(ins);
  insRef.current = ins;
  const web = useRef(null);
  const ready = useRef(false);
  const queue = useRef([]);
  const kaT = useRef(null); // keep-awake auto-release timer
  const appSt = useRef(AppState.currentState); // for fg.from / fg.away
  const lock = useRef(null); // a running lock-in: {title, body}; its "come back" notification id while away
  const lockNote = useRef(null);
  const bgAt = useRef(0);
  // The script that runs before the page: the bridge, plus the save kept in Documents (native/state.js) as
  // window.OSSA_SAVED. The web view waits for it (a file read, a few ms; 1.5 s at most) so the page always starts
  // from the newest save, even when iOS has cleared the web view's own storage. `gen` remounts the web view with a
  // fresh read when iOS kills its process (the old injected copy would be stale by then).
  const [boot, setBoot] = useState(null);
  const [gen, setGen] = useState(0);
  // After time away, the page must answer a ping within 6 s, or the web view is rebuilt (below, AppState).
  const alive = useRef(null);
  useEffect(() => {
    let done = false;
    const go = (j) => {
      if (done) return;
      done = true;
      setBoot(BRIDGE + (j ? `window.OSSA_SAVED=${JSON.stringify(j)};true;` : ""));
    };
    const t = setTimeout(() => go(null), 1500);
    State.read().then(go, () => go(null));
    return () => {
      done = true;
      clearTimeout(t);
    };
  }, [gen]);
  const relaunch = useCallback(() => {
    clearTimeout(alive.current);
    ready.current = false;
    setBoot(null);
    setGen((g) => g + 1);
  }, []);

  // Android: the real system bar sizes into the page's --nst/--nsb (see useIns above)
  const pushInsets = useCallback(() => {
    if (Platform.OS !== "android" || !web.current) return;
    const i = insRef.current || ZERO;
    const t = Math.round(+i.top || 0), b = Math.round(+i.bottom || 0);
    web.current.injectJavaScript(
      `(function(){var r=document.documentElement.style;r.setProperty("--nst","${t}px");r.setProperty("--nsb","${b}px");})();true;`
    );
  }, []);
  useEffect(() => {
    if (ready.current) pushInsets();
  }, [ins.top, ins.bottom, pushInsets]);

  // iOS: the keyboard slides over the web view without making the page shorter, so a text field low on the
  // screen ended up under it (21 Oct, the intro's name step). The page gets its height as --kb and a .kbup
  // class on <html>; screens with a field sit above it (web/ui/onboarding.css). Android resizes the page itself.
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const kb = (h) => {
      if (!web.current) return;
      web.current.injectJavaScript(
        `(function(){var d=document.documentElement;d.style.setProperty("--kb","${h}px");d.classList.toggle("kbup",${h > 0});if(window.scrollY)window.scrollTo(0,0);})();true;`
      );
    };
    const show = Keyboard.addListener("keyboardWillShow", (e) => kb(Math.round((e && e.endCoordinates && e.endCoordinates.height) || 0)));
    const hide = Keyboard.addListener("keyboardWillHide", () => kb(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // native -> web
  const send = useCallback((m) => {
    if (!ready.current || !web.current) {
      queue.current.push(m);
      return;
    }
    web.current.injectJavaScript(`window.OssaNative&&window.OssaNative.recv(${JSON.stringify(m)});true;`);
  }, []);

  const caps = useCallback(async () => {
    let health = "needs-build";
    try {
      health = await Health.status();
    } catch (e) {}
    let loc = "needs-build";
    try {
      loc = await Loc.status();
    } catch (e) {}
    send({
      t: "caps",
      v: 2, // bridge v2: haptic styles and seq, keepAwake, locate, geocode, weather, bg, richer fg
      platform: Platform.OS,
      expoGo: isRunningInExpoGo(),
      notif: true,
      widget: Widget.available,
      health,
      healthSrc: Health.source,
      iap: IAP.available,
      haptic: true,
      loc,
      awake: !!KA,
      wx: true,
    });
    // where the subscription stands right now (the store is the source of truth)
    if (IAP.available) {
      try {
        send({ t: "pro", ...(await IAP.status()) });
      } catch (e) {}
    }
  }, [send]);

  const readHealth = useCallback(async () => {
    try {
      send({ t: "health", ...(await Health.read()) });
    } catch (e) {
      send({ t: "health", ok: false, why: "error" });
    }
  }, [send]);

  // web -> native
  const onMessage = useCallback(
    async (e) => {
      let m;
      try {
        m = JSON.parse(e.nativeEvent.data);
      } catch (err) {
        return;
      }
      if (!m || !m.t) return;
      try {
        if (m.t === "err") { Sentry.recv(m); return; }   // WebView-side JS error, forwarded to Sentry
        if (m.t === "state:save") { await State.write(m.j, m.at); return; }   // the save, kept in Documents too
        if (m.t === "pong") { clearTimeout(alive.current); alive.current = null; return; }
        if (m.t === "buzz") await buzz(m.p);
        else if (m.t === "log") {
          if (__DEV__) console.log("[page] " + String(m.s || "").slice(0, 300)); // the page's own notes, in the dev server's terminal
        }
        else if (m.t === "hello") {
          ready.current = true;
          pushInsets();
          hideSplash(); // the page is up: fade the launch screen into it
          const q = queue.current;
          queue.current = [];
          await caps();
          q.forEach(send);
        } else if (m.t === "haptic") {
          if (m.seq) hapticSeq(m.seq);
          else await haptic(String(m.style || ""));
        } else if (m.t === "keepAwake") {
          clearTimeout(kaT.current);
          kaT.current = null;
          if (!KA) send({ t: "keepAwake", id: m.id, ok: false, on: false, why: "needs-build" });
          else if (m.on) {
            await KA.activateKeepAwakeAsync(AWAKE);
            const ms = Math.min(Math.max(+m.ms || AWAKE_MS, 1000), 2 * AWAKE_MS);
            kaT.current = setTimeout(() => {
              kaT.current = null;
              KA.deactivateKeepAwake(AWAKE).catch(() => {});
              send({ t: "keepAwake", ok: true, on: false, why: "time" }); // no id: the page just updates its state
            }, ms);
            send({ t: "keepAwake", id: m.id, ok: true, on: true, ms });
          } else {
            await KA.deactivateKeepAwake(AWAKE);
            send({ t: "keepAwake", id: m.id, ok: true, on: false });
          }
        } else if (m.t === "insets") {
          pushInsets(); // an older page asking: answer with the real sizes
        } else if (m.t === "lockin") {
          lock.current = m.on ? { title: String(m.title || "Your lock-in is breaking"), body: String(m.body || "") } : null;
        } else if (m.t === "face") {
          if (m.on) send({ t: "face:status", ...(await Face.start((down) => send({ t: "face", down }))) });
          else Face.stop();
        } else if (m.t === "review") {
          // Apple decides whether the prompt shows (at most 3 times a year; never in TestFlight)
          if (SR && (await SR.isAvailableAsync())) await SR.requestReview();
        } else if (m.t === "locate") send({ t: "location", id: m.id, ...(await Loc.locate(!!m.ask)) });
        else if (m.t === "geocode") send({ t: "geocode", id: m.id, q: String(m.q || "").slice(0, 80), ...(await Loc.geocode(m.q)) });
        else if (m.t === "weather") {
          // MET: no fetching while the app isn't in use, whatever the page asks
          if (AppState.currentState !== "active") send({ t: "weather", id: m.id, ok: false, why: "background" });
          else send({ t: "weather", id: m.id, ...(await Wx.get(+m.lat, +m.lon)) });
        } else if (m.t === "remind") {
          const r = m.on === false ? (await Reminders.clear(), { granted: true, count: 0 }) : await Reminders.schedule(m.list, !!m.ask);
          send({ t: "remind", ...r, asked: !!m.ask });
        } else if (m.t === "widget") await Widget.update(m.snap);
        else if (m.t === "widget:pin") send({ t: "widget:pin", ok: await Widget.pin() });
        else if (m.t === "health:connect") {
          const r = await Health.connect();
          if (r.ok) await readHealth();
          else send({ t: "health", ...r });
        } else if (m.t === "health:read") await readHealth();
        else if (m.t === "health:settings") Health.openSettings();
        else if (m.t === "iap:offerings") send({ t: "iap:offerings", ...(await IAP.offerings()) });
        else if (m.t === "iap:buy") send({ t: "iap:result", pkg: m.pkg, ...(await IAP.buy(m.pkg)) });
        else if (m.t === "iap:restore") send({ t: "iap:restore", ...(await IAP.restore()) });
        else if (m.t === "iap:manage") {
          const ok = await IAP.manage();
          if (!ok) Linking.openURL("https://apps.apple.com/account/subscriptions").catch(() => {});
        } else if (m.t === "link" && /^(https:|mailto:)/.test(m.url || "")) Linking.openURL(m.url).catch(() => {});
        // posture scan: the page asks for the model and engine in pieces
        else if (m.t === "pose:get") {
          try {
            send({ t: "pose:chunk", f: m.f, i: m.i, ...(await Pose.chunk(m.f, m.i)) });
          } catch (err) {
            send({ t: "pose:chunk", f: m.f, i: m.i, err: String((err && err.message) || err) });
          }
        } else if (m.t === "share:image" && m.b64) await Pose.shareImage(m.b64, m.name, Share);
      } catch (err) {
        if (m.t === "iap:buy") send({ t: "iap:result", pkg: m.pkg, ok: false, why: "error" });
        else if (m.t === "iap:offerings") send({ t: "iap:offerings", ok: false, why: "error" });
        else if (m.t === "iap:restore") send({ t: "iap:restore", ok: false, why: "error" });
        else {
          // every bridge v2 request with an id gets exactly one reply, errors included
          const RE = { locate: "location", geocode: "geocode", weather: "weather", keepAwake: "keepAwake" };
          if (RE[m.t]) send({ t: RE[m.t], id: m.id, ok: false, why: /timeout|abort/i.test(String(err && err.message)) ? "timeout" : "error" });
        }
      }
    },
    [caps, send, readHealth]
  );

  // subscriptions: set up once; any change (purchase, renewal, refund, expiry) reaches the page
  useEffect(() => {
    IAP.setup((pro) => send({ t: "pro", ...pro }));
  }, [send]);

  // if the page never says hello (it threw, or it's very slow), don't hold the launch screen past 4 s
  useEffect(() => {
    const t = setTimeout(hideSplash, 4000);
    return () => clearTimeout(t);
  }, []);

  // release the screen lock if the app closes this view
  useEffect(
    () => () => {
      clearTimeout(kaT.current);
      if (KA) KA.deactivateKeepAwake(AWAKE).catch(() => {});
    },
    []
  );

  useEffect(() => {
    // Going to the background sends {t:"bg", at}. Every return to 'active' still sends "fg" (as before),
    // now with at, from and away (ms since "bg"; 0 unless it came back from the background).
    // iOS 'inactive' (permission alerts, Control Centre, calls) is never treated as leaving.
    // WKWebView pauses JS in the background, so "bg" may only arrive together with "fg": use their `at`.
    const s1 = AppState.addEventListener("change", (st) => {
      const prev = appSt.current;
      appSt.current = st;
      if (st === "background") {
        bgAt.current = Date.now();
        send({ t: "bg", at: bgAt.current });
        if (lock.current) Reminders.nowNote(lock.current.title, lock.current.body).then((id) => (lockNote.current = id));
      } else if (st === "active") {
        // counted from the last "bg", even if iOS passed through 'inactive' on the way back
        const now = Date.now(), wasBg = bgAt.current > 0;
        if (lockNote.current) { Reminders.dropNote(lockNote.current); lockNote.current = null; }
        send({ t: "fg", at: now, from: wasBg ? "background" : prev, away: wasBg ? now - bgAt.current : 0 });
        // Back after a while: iOS may have killed the web view's process without telling us (the page then sat
        // blank or broken until the app was closed and reopened). If the page doesn't answer, rebuild it.
        if (wasBg && now - bgAt.current > 30000 && web.current) {
          clearTimeout(alive.current);
          alive.current = setTimeout(relaunch, 6000);
          web.current.injectJavaScript(`window.OssaNative&&window.OssaNative.recv({t:"ping",id:${now}});true;`);
        }
        bgAt.current = 0;
      }
    });
    // a tapped reminder opens where it points
    const off = Reminders.onOpen((go) => send({ t: "open", go }));
    // so does a tapped widget (ossa://score, ossa://train)
    const fromUrl = (url) => {
      const m = /^ossa:\/\/([a-z]+)/.exec(url || "");
      if (m) send({ t: "open", go: m[1] });
    };
    Linking.getInitialURL().then(fromUrl).catch(() => {});
    const s2 = Linking.addEventListener("url", (e) => fromUrl(e.url));
    return () => {
      s1.remove();
      s2.remove();
      off();
    };
  }, [send, relaunch]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {boot ? (
      <WebView
        key={gen}
        ref={web}
        style={styles.web}
        bounces={false}
        overScrollMode="never"
        source={{ html, baseUrl: "https://ossa.app/" }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        injectedJavaScriptBeforeContentLoaded={boot}
        onMessage={onMessage}
        onContentProcessDidTerminate={relaunch}
        onRenderProcessGone={relaunch}
        onLoadStart={() => {
          ready.current = false;
          // a reloaded page starts with the screen allowed to sleep again
          clearTimeout(kaT.current);
          kaT.current = null;
          if (KA) KA.deactivateKeepAwake(AWAKE).catch(() => {});
        }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
        bounces={false}
        overScrollMode="never"
        scrollEnabled={false}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        setSupportMultipleWindows={false}
        allowsBackForwardNavigationGestures={false}
        textZoom={100}
      />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  web: { flex: 1, backgroundColor: "#000" },
});

// the provider measures the system bars for useIns (Main)
function App() {
  if (SA && SA.SafeAreaProvider) {
    const P = SA.SafeAreaProvider;
    return (
      <P initialMetrics={SA.initialWindowMetrics}>
        <Main />
      </P>
    );
  }
  return <Main />;
}

// Sentry.wrap returns the same component when Sentry is off (no DSN or Expo Go), so this is safe either way.
export default Sentry.wrap(App);
