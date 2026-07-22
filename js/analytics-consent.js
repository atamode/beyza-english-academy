import { trackRouteView } from "./analytics.js";
import { getRoute } from "./router.js";

export const ANALYTICS_MEASUREMENT_ID = "G-LVDEFW23S9";
export const ANALYTICS_CONSENT_KEY = "poma.analytics.consent.v1";
const VALID = new Set(["granted", "denied"]);
let scriptRequested = false;

export function readAnalyticsConsent(storage = globalThis.localStorage) {
  try {
    const value = storage?.getItem(ANALYTICS_CONSENT_KEY);
    return VALID.has(value) ? value : "unknown";
  } catch { return "unknown"; }
}

function writeAnalyticsConsent(value, storage = globalThis.localStorage) {
  try { storage?.setItem(ANALYTICS_CONSENT_KEY, value); } catch {}
}

function clearAnalyticsCookies(doc = globalThis.document) {
  if (!doc?.cookie) return;
  for (const part of doc.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (name === "_ga" || name?.startsWith("_ga_")) doc.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
  }
}

export function loadAnalytics(target = globalThis) {
  target.__pomaAnalyticsAllowed = true;
  target[`ga-disable-${ANALYTICS_MEASUREMENT_ID}`] = false;
  target.dataLayer ||= [];
  target.gtag ||= function gtag(){ target.dataLayer.push(arguments); };
  target.gtag("consent", "update", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  if (!scriptRequested && target.document?.head) {
    scriptRequested = true;
    const script = target.document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_MEASUREMENT_ID}`;
    script.dataset.pomaAnalytics = "";
    target.document.head.append(script);
    target.gtag("js", new Date());
    target.gtag("config", ANALYTICS_MEASUREMENT_ID, { send_page_view: false });
  }
  return true;
}

export function applyAnalyticsConsent(value, { target = globalThis, storage = target.localStorage, trackCurrentRoute = true } = {}) {
  if (!VALID.has(value)) throw new TypeError("Analytics izni granted veya denied olmalıdır.");
  writeAnalyticsConsent(value, storage);
  if (value === "granted") {
    loadAnalytics(target);
    if (trackCurrentRoute) trackRouteView(getRoute(), target);
  } else {
    target.__pomaAnalyticsAllowed = false;
    target[`ga-disable-${ANALYTICS_MEASUREMENT_ID}`] = true;
    target.gtag?.("consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    clearAnalyticsCookies(target.document);
  }
  return value;
}

function consentPanel(doc) {
  const panel = doc.createElement("section");
  panel.className = "analytics-consent";
  panel.dataset.analyticsConsent = "";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-labelledby", "analytics-consent-title");
  panel.innerHTML = `<div><strong id="analytics-consent-title">Analitik tercihi</strong><p>Poma Academy’yi geliştirmek için Google Analytics kullanmak istiyoruz. Kabul etmezsen Analytics yüklenmez; uygulamayı aynı şekilde kullanmaya devam edebilirsin. İsim, e-posta, çocuk kimliği veya cevaplar Analytics’e gönderilmez.</p></div><div class="analytics-consent-actions"><button class="button secondary" data-analytics-choice="granted">Kabul Et</button><button class="button secondary" data-analytics-choice="denied">Reddet</button></div>`;
  return panel;
}

function settingsButton(doc) {
  const button = doc.createElement("button");
  button.type = "button";
  button.className = "analytics-settings-button";
  button.dataset.analyticsSettings = "";
  button.textContent = "Analitik ayarları";
  return button;
}

export function initAnalyticsConsent(target = globalThis) {
  const doc = target.document;
  if (!doc?.body) return "unavailable";
  const current = readAnalyticsConsent(target.localStorage);
  if (current === "granted") loadAnalytics(target);
  else {
    target.__pomaAnalyticsAllowed = false;
    target[`ga-disable-${ANALYTICS_MEASUREMENT_ID}`] = true;
    clearAnalyticsCookies(doc);
  }

  const open = () => {
    if (doc.querySelector("[data-analytics-consent]")) return;
    const panel = consentPanel(doc);
    doc.body.append(panel);
    panel.querySelectorAll("[data-analytics-choice]").forEach(button => button.addEventListener("click", () => {
      applyAnalyticsConsent(button.dataset.analyticsChoice, { target });
      panel.remove();
    }));
  };
  if (!doc.querySelector("[data-analytics-settings]")) {
    const button = settingsButton(doc);
    button.addEventListener("click", open);
    doc.body.append(button);
  }
  if (current === "unknown") open();
  return current;
}
