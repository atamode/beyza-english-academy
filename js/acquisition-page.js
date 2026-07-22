import { initAnalyticsConsent } from "./analytics-consent.js";
import { trackEvent } from "./analytics.js";

initAnalyticsConsent();

document.querySelectorAll("[data-acquisition-event]").forEach(link => {
  link.addEventListener("click", () => {
    trackEvent(link.dataset.acquisitionEvent, {
      source: document.body.dataset.pageId || "acquisition",
      content_type: link.dataset.contentType || "",
      content_id: link.dataset.contentId || ""
    });
  });
});
