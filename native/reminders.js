// Real reminders. The web app works out what each day's nudge should say (it knows the plan);
// this file just asks permission once and hands the list to the phone's own scheduler.
// Local notifications like these work in a real build and in Expo Go on iPhone.
// Expo Go on Android (SDK 53+) throws as soon as expo-notifications is imported, so there
// it isn't loaded at all and reminders are simply off (the rest of Ossa runs normally).
import { Platform } from "react-native";
import { isRunningInExpoGo } from "expo";

const OFF = Platform.OS === "android" && isRunningInExpoGo();
const Notifications = OFF ? null : require("expo-notifications");

const CHANNEL = "nudges";
let ready = false;

if (Notifications) Notifications.setNotificationHandler({
  // if a nudge arrives while Ossa is open, show it quietly as a banner
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function setup() {
  if (ready) return;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: "Daily nudges",
      description: "Your daily nudge, desk-mode resets and your week in review",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 40, 60, 40],
      lightColor: "#9BFCEC",
    });
  }
  ready = true;
}

export async function permission(ask) {
  if (!Notifications) return false;
  await setup();
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted || !ask) return !!cur.granted;
  if (cur.canAskAgain === false) return false;
  const res = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return !!res.granted;
}

// list: [{ at: ms timestamp, title, body, go }]
export async function schedule(list, ask) {
  if (!Notifications) return { granted: false, count: 0 };
  const granted = await permission(ask);
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!granted) return { granted: false, count: 0 };
  const now = Date.now();
  let count = 0;
  // iOS keeps at most 64 pending; the web app sends up to 60 (daily nudges plus desk-mode resets)
  for (const n of (list || []).slice(0, 60)) {
    if (!n || !n.at || n.at < now + 30000) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title: n.title, body: n.body, data: { go: n.go || "" } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: n.at,
        channelId: CHANNEL,
      },
    });
    count++;
  }
  return { granted: true, count };
}

export async function clear() {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// tapping a nudge opens Ossa where it points (today's workout, the review)
export function onOpen(cb) {
  if (!Notifications) return () => {};
  const fire = (r) => {
    const go = r && r.notification && r.notification.request.content.data && r.notification.request.content.data.go;
    if (go) cb(go);
  };
  try {
    const last = Notifications.getLastNotificationResponse();
    if (last) {
      fire(last);
      Notifications.clearLastNotificationResponse();
    }
  } catch (e) {}
  const sub = Notifications.addNotificationResponseReceivedListener(fire);
  return () => sub.remove();
}

// The lock-in (19 Oct): leaving Ossa during a lock-in shows this at once; coming back within 10 s dismisses it.
export async function nowNote(title, body) {
  if (!Notifications) return null;
  try {
    if (!(await permission(false))) return null;
    await setup();
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { go: "monk" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, channelId: CHANNEL },
    });
  } catch (e) {
    return null;
  }
}
export async function dropNote(id) {
  if (!Notifications || !id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
    await Notifications.dismissNotificationAsync(id);
  } catch (e) {}
}
