const EVENTS = new Set([
  "pricing_section_view", "pricing_plan_selected", "signup_started_from_pricing",
  "membership_page_opened", "payment_request_created", "receipt_upload_completed",
  "parent_report_opened", "parent_report_period_changed", "parent_report_printed"
  ,"teacher_partner_panel_opened", "teacher_partner_code_copied", "teacher_partner_payment_started", "partner_code_validated",
  "start_free_trial", "watch_intro_video", "signup_click", "instagram_click", "youtube_click", "coupon_signup_click",
  "signup_form_submitted", "signup_completed", "learning_started", "learning_completed"
]);
const PARAMS = new Set(["plan_code", "source", "status", "period_type", "has_data", "content_type", "content_id"]);

export function trackEvent(eventName, params = {}, target = globalThis) {
  if (!EVENTS.has(eventName)) return false;
  if (target === globalThis && globalThis.__pomaAnalyticsAllowed !== true) return false;
  const safe = Object.fromEntries(Object.entries(params).filter(([key, value]) => PARAMS.has(key) && ["string", "number", "boolean"].includes(typeof value)));
  try { if (typeof target?.gtag !== "function") return false; target.gtag("event", eventName, safe); return true; } catch { return false; }
}

export function routeAnalyticsContext(route) {
  const clean = String(route || "home").split(/[?#]/, 1)[0].replace(/[^a-zA-Z0-9/_-]/g, "").slice(0, 120) || "home";
  const [head, id = ""] = clean.split("/");
  if (head === "lesson") return { route: clean, content_type: "lesson", content_id: id || "selected" };
  if (head === "story") return { route: clean, content_type: "story", content_id: id || "selected" };
  if (head === "game" && ["football", "volleyball"].includes(id)) return { route: clean, content_type: id, content_id: `${id}-v1` };
  if (head === "diagnostic") return { route: clean, content_type: "diagnostic", content_id: "placement" };
  if (head === "word-game") return { route: clean, content_type: "word_game", content_id: id || "selected" };
  if (head === "vocabulary") return { route: clean, content_type: "vocabulary", content_id: "word_chest" };
  return { route: clean, content_type: "", content_id: "" };
}

export function trackRouteView(route, target = globalThis) {
  if (target === globalThis && globalThis.__pomaAnalyticsAllowed !== true) return false;
  if (typeof target?.gtag !== "function") return false;
  const context = routeAnalyticsContext(route);
  const origin = target.location?.origin || "https://pomante.com.tr";
  const pathname = target.location?.pathname || "/";
  target.gtag("event", "page_view", { page_location: `${origin}${pathname}#/${context.route}`, page_title: target.document?.title || "Poma Academy" });
  if (context.content_type) trackEvent("learning_started", { content_type: context.content_type, content_id: context.content_id, source: "route" }, target);
  return true;
}

export { EVENTS as ANALYTICS_EVENTS, PARAMS as ANALYTICS_PARAMS };
