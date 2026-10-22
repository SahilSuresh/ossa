// The iPhone widgets (expo-widgets + SwiftUI): home screen and lock screen (Ossa 2.0, Build 9).
// They carry the streak screen's promo: the streak, the weak link, your body in rank colours,
// your overall rank and today's session. Body Score stays in the app.
// Rules from Expo: the 'widget' function runs on its own in the widget extension. No hooks, no imports
// at runtime, nothing declared outside it (not even the colours below); everything else arrives as props
// (native/widget.ios.js builds them, native/widget-shared.js says what they mean).
//
// Taps: the widget opens the streak (ossa://streak), the body opens Muscle ranks (ossa://ranks),
// the Today pill opens today's session (ossa://train).
// Lock screen widgets are drawn in one tint, so they use shape and text instead of colour.
// Fonts: the system font at heavy weights (Inter can't reach a widget extension).
import { AccessoryWidgetBackground, Circle, HStack, Image, Link, Spacer, Text, VStack, ZStack } from "@expo/ui/swift-ui";
import {
  background,
  clipped,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  kerning,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  multilineTextAlignment,
  padding,
  resizable,
  shapes,
  widgetAccentedRenderingMode,
  widgetURL,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget } from "expo-widgets";

const OssaBody = (props, env) => {
  "widget";
  // a hand-kept mirror of web/ui/tokens.css (--glow, --text-1, --text-2, --text-3, --bg, --surface-3)
  const lime = "#D4FF00", ink = "#FFFFFF", sub = "#9CA3AF", faint = "#6B7280", bg = "#000000", chip = "#1A1A1A";
  const p = props || {};
  const fam = env.widgetFamily;
  const empty = !p.sk || p.stale === "1";
  const msg = p.msg || (p.stale === "1" ? "Open Ossa to update" : "Open Ossa to wake your body up");

  // ---- lock screen ----
  if (fam === "accessoryInline") {
    return <Text>{empty ? "Open Ossa" : p.skLine + (p.todayS ? " · " + p.todayS : "")}</Text>;
  }
  if (fam === "accessoryCircular") {
    return (
      <ZStack modifiers={[widgetURL("ossa://streak")]}>
        <AccessoryWidgetBackground />
        {empty ? (
          <Image systemName="figure.stand" size={22} />
        ) : (
          <VStack spacing={0}>
            <Image systemName="flame.fill" size={13} />
            <Text modifiers={[font({ size: 20, weight: "black" }), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.6)]}>{p.sk}</Text>
          </VStack>
        )}
      </ZStack>
    );
  }
  if (fam === "accessoryRectangular") {
    if (empty) {
      return (
        <HStack spacing={8} modifiers={[widgetURL("ossa://streak")]}>
          <Image systemName="figure.stand" size={26} />
          <Text modifiers={[font({ size: 13, weight: "semibold" }), lineLimit(2)]}>{msg}</Text>
          <Spacer />
        </HStack>
      );
    }
    return (
      <HStack spacing={0} modifiers={[widgetURL("ossa://streak")]}>
        <VStack alignment="leading" spacing={1}>
          <HStack spacing={4}>
            <Image systemName="flame.fill" size={13} />
            <Text modifiers={[font({ size: 15, weight: "heavy" }), lineLimit(1)]}>{p.skLine}</Text>
          </HStack>
          <Text modifiers={[font({ size: 12, weight: "semibold" }), lineLimit(1)]}>{p.weak || ""}</Text>
          <Text modifiers={[font({ size: 12 }), lineLimit(1)]}>{p.todayS || p.skNote || ""}</Text>
        </VStack>
        <Spacer />
      </HStack>
    );
  }

  // ---- home screen ----
  const small = fam === "systemSmall";
  if (empty) {
    return (
      <VStack spacing={8} modifiers={[containerBackground(bg, "widget"), widgetURL("ossa://streak")]}>
        <Image systemName="figure.stand" size={small ? 40 : 48} color={lime} />
        <Text modifiers={[font({ size: 13, weight: "semibold" }), foregroundStyle(ink), multilineTextAlignment("center"), lineLimit(3)]}>{msg}</Text>
      </VStack>
    );
  }

  // the body: a PNG of front and back side by side; the small widget shows only the weak link's side
  // (the picture is drawn full size, then a frame half as wide keeps one side and clips the rest)
  const FH = 112, FW = Math.round((FH * 262) / 396), HW = Math.round((FH * 124) / 396);
  const caps = (s, c, size) => (
    <Text modifiers={[font({ size: size || 12, weight: "heavy" }), kerning(1.4), foregroundStyle(c || sub), lineLimit(1)]}>{s || ""}</Text>
  );
  const figure = (one) =>
    p.fig ? (
      <Image
        uiImage={p.fig}
        modifiers={
          one
            ? [resizable(), frame({ width: FW, height: FH }), frame({ width: HW, height: FH, alignment: p.figV === "back" ? "trailing" : "leading" }), clipped(), widgetAccentedRenderingMode("fullColor")]
            : [resizable(), frame({ width: FW, height: FH }), widgetAccentedRenderingMode("fullColor")]
        }
      />
    ) : (
      <Image systemName="figure.stand" size={one ? 40 : 56} color={lime} />
    );

  if (small) {
    return (
      <HStack spacing={4} modifiers={[containerBackground(bg, "widget"), widgetURL("ossa://streak")]}>
        <VStack alignment="leading" spacing={0}>
          <Image systemName="flame.fill" size={18} color={lime} />
          <Text modifiers={[font({ size: 34, weight: "black" }), monospacedDigit(), foregroundStyle(ink), lineLimit(1), minimumScaleFactor(0.6), padding({ top: 4 })]}>{p.sk}</Text>
          {caps(p.skTxt)}
          <Spacer />
          <Text modifiers={[font({ size: 12, weight: "heavy" }), foregroundStyle(lime), lineLimit(2), minimumScaleFactor(0.8)]}>{p.weak2 || p.weak || ""}</Text>
        </VStack>
        <Spacer />
        {figure(true)}
      </HStack>
    );
  }

  return (
    <HStack spacing={12} modifiers={[containerBackground(bg, "widget"), widgetURL("ossa://streak")]}>
      <VStack alignment="leading" spacing={0}>
        <HStack spacing={6}>
          <Image systemName="flame.fill" size={20} color={lime} />
          <Text modifiers={[font({ size: 34, weight: "black" }), monospacedDigit(), foregroundStyle(ink), lineLimit(1), minimumScaleFactor(0.6)]}>{p.sk}</Text>
          <VStack alignment="leading" spacing={1}>
            {caps(p.skTxt)}
            <Text modifiers={[font({ size: 12, weight: "semibold" }), foregroundStyle(ink), lineLimit(1)]}>{p.skNote || ""}</Text>
          </VStack>
        </HStack>
        <Text modifiers={[font({ size: 14, weight: "heavy" }), foregroundStyle(lime), lineLimit(1), padding({ top: 6 })]}>{p.weak || ""}</Text>
        <HStack spacing={5} modifiers={[padding({ top: 3 })]}>
          {caps("OVERALL")}
          {caps(p.rk, p.rkCol || sub)}
        </HStack>
        <Spacer />
        {p.today ? (
          <Link destination="ossa://train">
            <HStack spacing={6} modifiers={[padding({ horizontal: 9, vertical: 6 }), background(chip, shapes.roundedRectangle({ cornerRadius: 12 }))]}>
              <Circle modifiers={[foregroundStyle(p.todayK === "rest" ? faint : lime), frame({ width: 6, height: 6 })]} />
              {caps(p.pill, lime, 11)}
              <Text modifiers={[font({ size: 12, weight: "semibold" }), foregroundStyle(ink), lineLimit(1)]}>{p.today}</Text>
            </HStack>
          </Link>
        ) : null}
      </VStack>
      <Spacer />
      <Link destination="ossa://ranks">{figure(false)}</Link>
    </HStack>
  );
};

export default createWidget("OssaBody", OssaBody);
