// Ossa Pro subscriptions through RevenueCat (App Store now, Google Play later).
// The web app never sees prices it can't trust: everything here comes from the store.
import { Platform } from "react-native";
import { isRunningInExpoGo } from "expo";

const KEYS = {
  ios: "appl_ssUeDBDxpYWKoLtIbuRSzypRESh", // RevenueCat public SDK key (safe to ship in the app)
  android: "", // add the goog_ key when Android is set up in RevenueCat
};
export const ENTITLEMENT = "pro";

let P = null;
let ready = false;
const key = KEYS[Platform.OS] || "";

if (key && !isRunningInExpoGo()) {
  try {
    P = require("react-native-purchases").default;
  } catch (e) {
    P = null;
  }
}

export const available = !!P;

export function setup(onChange) {
  if (!P || ready) return;
  try {
    P.configure({ apiKey: key });
    ready = true;
    P.addCustomerInfoUpdateListener((info) => onChange(summarise(info)));
  } catch (e) {
    ready = false;
  }
}

// what the web app needs to know about the subscription
export function summarise(info) {
  const e = info && info.entitlements && info.entitlements.active && info.entitlements.active[ENTITLEMENT];
  return {
    active: !!e,
    product: e ? e.productIdentifier : null,
    expires: e ? e.expirationDate : null,
    willRenew: e ? !!e.willRenew : false,
    trial: e ? e.periodType === "TRIAL" : false,
    userId: info ? info.originalAppUserId : null,
    manage: info ? info.managementURL : null,
  };
}

export async function status() {
  if (!P || !ready) return { active: false, unavailable: true };
  const info = await P.getCustomerInfo();
  return summarise(info);
}

function pkgOut(p) {
  const s = p.product || {};
  const intro = s.introPrice
    ? { price: s.introPrice.price, priceString: s.introPrice.priceString, unit: s.introPrice.periodUnit, units: s.introPrice.periodNumberOfUnits, cycles: s.introPrice.cycles }
    : null;
  return {
    id: p.identifier,
    type: p.packageType,
    product: s.identifier,
    title: s.title,
    price: s.price,
    priceString: s.priceString,
    currency: s.currencyCode,
    period: s.subscriptionPeriod,
    intro,
    pricePerWeekString: s.pricePerWeekString || null,
    pricePerMonthString: s.pricePerMonthString || null,
  };
}

// the packages in the current offering, with the free week only where this person can still get it
export async function offerings() {
  if (!P || !ready) return { ok: false, why: "unavailable" };
  const o = await P.getOfferings();
  const cur = o && o.current;
  if (!cur) return { ok: false, why: "no-offering" };
  const packages = cur.availablePackages.map(pkgOut);
  if (Platform.OS === "ios") {
    try {
      const ids = packages.map((x) => x.product);
      const el = await P.checkTrialOrIntroductoryPriceEligibility(ids);
      packages.forEach((x) => {
        const r = el[x.product];
        x.introEligible = r ? r.status === 2 : !!x.intro; // 2 = eligible
      });
    } catch (e) {
      packages.forEach((x) => (x.introEligible = !!x.intro));
    }
  } else packages.forEach((x) => (x.introEligible = !!x.intro));
  return { ok: true, offering: cur.identifier, packages };
}

export async function buy(id) {
  if (!P || !ready) return { ok: false, why: "unavailable" };
  const o = await P.getOfferings();
  const pkg = o && o.current && o.current.availablePackages.find((p) => p.identifier === id);
  if (!pkg) return { ok: false, why: "no-package" };
  try {
    const r = await P.purchasePackage(pkg);
    return { ok: true, pro: summarise(r.customerInfo) };
  } catch (e) {
    if (e && e.userCancelled) return { ok: false, cancelled: true };
    return { ok: false, why: (e && e.message) || "error" };
  }
}

export async function restore() {
  if (!P || !ready) return { ok: false, why: "unavailable" };
  try {
    const info = await P.restorePurchases();
    return { ok: true, pro: summarise(info) };
  } catch (e) {
    return { ok: false, why: (e && e.message) || "error" };
  }
}

export async function manage() {
  if (!P || !ready) return false;
  try {
    await P.showManageSubscriptions();
    return true;
  } catch (e) {
    return false;
  }
}
