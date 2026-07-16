const EVENTS = new Set([
  "pricing_section_view", "pricing_plan_selected", "signup_started_from_pricing",
  "membership_page_opened", "payment_request_created", "receipt_upload_completed"
]);
const PARAMS = new Set(["plan_code", "source", "status"]);

export function trackEvent(eventName, params = {}, target = globalThis) {
  if (!EVENTS.has(eventName)) return false;
  const safe = Object.fromEntries(Object.entries(params).filter(([key, value]) => PARAMS.has(key) && ["string", "number", "boolean"].includes(typeof value)));
  try { if (typeof target?.gtag !== "function") return false; target.gtag("event", eventName, safe); return true; } catch { return false; }
}

export { EVENTS as ANALYTICS_EVENTS, PARAMS as ANALYTICS_PARAMS };
