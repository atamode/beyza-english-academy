import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { ANALYTICS_CONSENT_KEY, ANALYTICS_MEASUREMENT_ID, applyAnalyticsConsent, readAnalyticsConsent } from "../js/analytics-consent.js";
import { routeAnalyticsContext, trackRouteView } from "../js/analytics.js";

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
}

function fakeTarget(storage = memoryStorage()) {
  const scripts = [];
  const document = {
    title: "Poma Academy",
    cookie: "",
    head: { append: node => scripts.push(node) },
    createElement: () => ({ dataset: {} })
  };
  return { storage, scripts, target: { localStorage: storage, document, location: { origin: "https://pomante.com.tr", pathname: "/" } } };
}

test("analytics remains unknown until an explicit choice", () => {
  assert.equal(readAnalyticsConsent(memoryStorage()), "unknown");
});

test("denial persists and keeps analytics disabled", () => {
  const { storage, target } = fakeTarget();
  applyAnalyticsConsent("denied", { target, storage, trackCurrentRoute: false });
  assert.equal(storage.getItem(ANALYTICS_CONSENT_KEY), "denied");
  assert.equal(target.__pomaAnalyticsAllowed, false);
  assert.equal(target[`ga-disable-${ANALYTICS_MEASUREMENT_ID}`], true);
});

test("grant is opt-in and only then requests the Google tag", () => {
  const { storage, scripts, target } = fakeTarget();
  applyAnalyticsConsent("granted", { target, storage, trackCurrentRoute: false });
  assert.equal(storage.getItem(ANALYTICS_CONSENT_KEY), "granted");
  assert.equal(target.__pomaAnalyticsAllowed, true);
  assert.equal(scripts.length, 1);
  assert.match(scripts[0].src, new RegExp(ANALYTICS_MEASUREMENT_ID));
});

test("route analytics strips query-like and unsafe route data", () => {
  assert.deepEqual(routeAnalyticsContext("lesson/001-subject-pronouns?child=secret"), { route: "lesson/001-subject-pronouns", content_type: "lesson", content_id: "001-subject-pronouns" });
  const calls = [];
  const target = { gtag: (...args) => calls.push(args), location: { origin: "https://pomante.com.tr", pathname: "/" }, document: { title: "Poma Academy" } };
  assert.equal(trackRouteView("game/football", target), true);
  assert.equal(calls[0][0], "event");
  assert.equal(calls[0][1], "page_view");
  assert.deepEqual(calls[1], ["event", "learning_started", { content_type: "football", content_id: "football-v1", source: "route" }]);
});

test("index does not load Google Analytics before consent", () => {
  const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.doesNotMatch(index, /googletagmanager\.com\/gtag\/js/);
  assert.doesNotMatch(index, /gtag\(['"]config/);
});
