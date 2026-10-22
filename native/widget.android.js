"use no memo";
// The Android home-screen widgets (react-native-android-widget), Ossa 2.0, Build 9.
// Needs a real build of Ossa; in Expo Go this file does nothing.
//
// The same content as the iPhone widgets (native/OssaWidget.ios.js): the streak, the weak link in lime,
// your overall rank in its colour, today's session and your body in rank colours, on black.
// Taps: the widget opens the streak (ossa://streak), the body opens Muscle ranks (ossa://ranks),
// the Today pill opens today's session (ossa://train). Fonts: the system font (Roboto) at heavy weights.
import React from "react";
import { isRunningInExpoGo } from "expo";
import { saveSnap, loadSnap, say, flameSvg, figHalf, C, FIG_RATIO, HALF_RATIO } from "./widget-shared";

let W = null;
if (!isRunningInExpoGo()) {
  try {
    W = require("react-native-android-widget");
  } catch (e) {
    W = null;
  }
}

export const NAME = "OssaBody"; // 4×2: the streak, the weak link, your rank, today's session and the body
const SMALL = "OssaRing"; // 2×2: the streak, the weak link and one side of the body
export const available = !!W;

const STREAK_URI = { uri: "ossa://streak" };
const RANKS_URI = { uri: "ossa://ranks" };
const TRAIN_URI = { uri: "ossa://train" };
const BG = { backgroundColor: C.bg, borderRadius: 24, borderWidth: 1, borderColor: C.line };
const CAPS = { fontSize: 12, fontWeight: "800", letterSpacing: 0.12, color: C.sub };

function Dot({ c }) {
  const { FlexWidget } = W;
  return <FlexWidget style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c, marginRight: 6 }} />;
}

function Flame({ size }) {
  const { SvgWidget } = W;
  return <SvgWidget svg={flameSvg()} style={{ width: size, height: size }} />;
}

// the rank body from the page (plain SVG); one side only on the small widget
function Figure({ snap, side, h }) {
  const { SvgWidget } = W;
  if (!snap || !snap.fig) return <Flame size={Math.round(h * 0.4)} />;
  const svg = side ? figHalf(snap.fig, side) : snap.fig;
  const w = Math.round(h * (side ? HALF_RATIO : FIG_RATIO));
  return <SvgWidget svg={svg} clickAction="OPEN_URI" clickActionData={RANKS_URI} style={{ width: w, height: h, marginLeft: 10 }} />;
}

function OssaWidget({ snap, width, height, small: forceSmall }) {
  const { FlexWidget, TextWidget } = W;
  const small = !!forceSmall || (width > 0 && width < 230);
  const L = say(snap);
  const figH = Math.max(76, Math.min(150, (height > 0 ? height : 150) - 28));

  if (!L.ok) {
    return (
      <FlexWidget clickAction="OPEN_URI" clickActionData={STREAK_URI}
        style={{ height: "match_parent", width: "match_parent", alignItems: "center", justifyContent: "center", padding: 14, ...BG }}>
        <Flame size={28} />
        <TextWidget text={L.msg} maxLines={3} style={{ fontSize: 13, fontWeight: "600", color: C.ink, textAlign: "center", marginTop: 8 }} />
      </FlexWidget>
    );
  }

  if (small) {
    return (
      <FlexWidget clickAction="OPEN_URI" clickActionData={STREAK_URI}
        style={{ height: "match_parent", width: "match_parent", flexDirection: "row", alignItems: "center", padding: 14, ...BG }}>
        <FlexWidget style={{ flex: 1, height: "match_parent", flexDirection: "column", justifyContent: "space-between" }}>
          <FlexWidget style={{ flexDirection: "column" }}>
            <Flame size={18} />
            <TextWidget text={L.sk} maxLines={1} style={{ fontSize: 34, fontWeight: "900", color: C.ink, marginTop: 2 }} />
            <TextWidget text={L.skTxt} style={CAPS} />
          </FlexWidget>
          <TextWidget text={L.weak2} maxLines={2} truncate="END" style={{ fontSize: 12, fontWeight: "800", color: C.lime }} />
        </FlexWidget>
        <Figure snap={snap} side={L.figV} h={figH} />
      </FlexWidget>
    );
  }

  const roomy = !(height > 0 && height < 140); // a short 4×2 drops the rank line
  return (
    <FlexWidget clickAction="OPEN_URI" clickActionData={STREAK_URI}
      style={{ height: "match_parent", width: "match_parent", flexDirection: "row", alignItems: "center", padding: 14, ...BG }}>
      <FlexWidget style={{ flex: 1, height: "match_parent", flexDirection: "column", justifyContent: "space-between" }}>
        <FlexWidget style={{ flexDirection: "column" }}>
          <FlexWidget style={{ flexDirection: "row", alignItems: "center" }}>
            <Flame size={20} />
            <TextWidget text={L.sk} maxLines={1} style={{ fontSize: 34, fontWeight: "900", color: C.ink, marginLeft: 6 }} />
            <FlexWidget style={{ flexDirection: "column", marginLeft: 8 }}>
              <TextWidget text={L.skTxt} style={CAPS} />
              <TextWidget text={L.note} maxLines={1} truncate="END" style={{ fontSize: 12, fontWeight: "600", color: C.ink }} />
            </FlexWidget>
          </FlexWidget>
          <TextWidget text={L.weak} maxLines={1} truncate="END" style={{ fontSize: 14, fontWeight: "800", color: C.lime, marginTop: 4 }} />
          {roomy ? (
            <FlexWidget style={{ flexDirection: "row", marginTop: 2 }}>
              <TextWidget text="OVERALL" style={CAPS} />
              <TextWidget text={L.rk} maxLines={1} style={{ ...CAPS, color: L.rkCol, marginLeft: 5 }} />
            </FlexWidget>
          ) : null}
        </FlexWidget>
        {L.today ? (
          <FlexWidget clickAction="OPEN_URI" clickActionData={TRAIN_URI}
            style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.chip, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6 }}>
            <Dot c={L.todayK === "rest" ? C.faint : C.lime} />
            <TextWidget text={L.pill} style={{ ...CAPS, color: C.lime, marginRight: 6 }} />
            <TextWidget text={L.today} maxLines={1} truncate="END" style={{ fontSize: 12, fontWeight: "600", color: C.ink }} />
          </FlexWidget>
        ) : (
          <TextWidget text=" " style={{ fontSize: 4 }} />
        )}
      </FlexWidget>
      <Figure snap={snap} h={figH} />
    </FlexWidget>
  );
}

// runs in the background when Android asks the widget to draw (added, resized, every 30 min);
// say() picks the day by date, so the streak and Today are right after midnight without the app
export async function widgetTaskHandler(props) {
  if (!W) return;
  const snap = await loadSnap();
  const info = props.widgetInfo || {};
  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED":
    case "WIDGET_CLICK":
      props.renderWidget(<OssaWidget snap={snap} width={info.width} height={info.height} small={info.widgetName === SMALL} />);
      break;
    default:
      break;
  }
}

export function register() {
  if (!W) return;
  try {
    W.registerWidgetTaskHandler(widgetTaskHandler);
  } catch (e) {}
}

// called whenever the app sends a fresh snapshot
export async function update(snap) {
  await saveSnap(snap);
  if (!W) return;
  for (const name of [NAME, SMALL]) {
    try {
      await W.requestWidgetUpdate({
        widgetName: name,
        renderWidget: (info) => <OssaWidget snap={snap} width={info.width} height={info.height} small={name === SMALL} />,
      });
    } catch (e) {}
  }
}

// Android 8+: shows the system "add this widget?" sheet
export async function pin() {
  if (!W) return false;
  try {
    return await W.requestPinWidget({ widgetName: NAME });
  } catch (e) {
    return false;
  }
}
