# Analytics

> **Purpose:** Canonical event taxonomy, data-quality rules, and reporting plan.
> **Update trigger:** User flow, instrumentation, consent/privacy, or reports change.
> **Related files:** [KPI](KPI.md), [Experiment Log](EXPERIMENT_LOG.md), [Search Console](SEARCH_CONSOLE.md)
> **Last reviewed:** 2026-07-22

## Current status

Implementation was audited against repository and live assets on 2026-07-22.

- GA4 measurement ID `G-LVDEFW23S9` is loaded directly from `index.html`, and the live site serves the same configuration.
- The default `gtag('config', ...)` call can send the initial page view. There is no explicit application route/page-view event on hash change. Whether GA4 property-side enhanced measurement adds useful route views is unverified.
- `js/analytics.js` allowlists 13 custom event names and five privacy-limited parameters: `plan_code`, `source`, `status`, `period_type`, and `has_data`.
- Eleven allowlisted events have a source call site. Two (`parent_report_period_changed`, `parent_report_printed`) are declared but never called.
- Six public landing actions dispatch `poma-analytics-event`, but no repository listener forwards that custom browser event to `gtag`; those CTA events are not proven GA events.
- The tag loads immediately. No consent mode, analytics preference, cookie control, privacy/KVKK surface, or opt-out implementation was found in the audited source. This is a technical observation, not a legal conclusion.
- GA property access, DebugView, live received events, internal-traffic filters, retention settings, conversions, audiences, and historical data were not available. A numeric funnel baseline cannot yet be trusted.

## Verified emitted-event inventory

| Stage | Event | Call site / trigger | Parameters |
|---|---|---|---|
| Understand | `pricing_section_view` | Pricing section first injection | `source` |
| Understand | `pricing_plan_selected` | Plan selection | `plan_code`, `source` |
| Start | `signup_started_from_pricing` | Pricing-to-signup path | `plan_code`, `source` |
| Convert | `membership_page_opened` | Signed-in membership render | `plan_code`, `source` |
| Convert | `partner_code_validated` | Valid partner code | `source`, `status` |
| Convert | `payment_request_created` | Payment request succeeds | `plan_code`, `source`, `status` |
| Convert | `receipt_upload_completed` | Receipt upload succeeds | `plan_code`, `source`, `status` |
| Parent trust | `parent_report_opened` | Report data load succeeds | `period_type`, `source`, `has_data` |
| Teacher growth | `teacher_partner_panel_opened` | Partner panel loads | `source`, `status` |
| Teacher growth | `teacher_partner_code_copied` | Code/link copy succeeds | `source` |
| Teacher growth | `teacher_partner_payment_started` | Teacher paid-access action | `plan_code`, `source` |

Declared without a caller: `parent_report_period_changed`, `parent_report_printed`.

## Public landing events not connected to GA

`start_free_trial`, `watch_intro_video`, `signup_click`, `instagram_click`, `youtube_click`, and `coupon_signup_click` are UI detail values on a local `poma-analytics-event`. No bridge to the analytics allowlist or `gtag` was found.

## Funnel coverage gaps

- No verified generic signup start, signup completion, login success, or profile/child setup completion event.
- No diagnostic, lesson, vocabulary, football, volleyball, or story start/completion event.
- No route-level page/screen view contract for the single-page application.
- No payment approval/rejection, membership activation, renewal, expiry, cancellation, or refund result event.
- No return-learning or retention event.

| Funnel action | Target event | Required context (privacy-safe) |
|---|---|---|
| View acquisition/application surface | `page_view` / `screen_view` | public page type or safe route class; never a child/account identifier |
| Select product path | `product_cta_click` | source surface, destination/product |
| Begin/create account | `signup_start` / `signup_complete` | source and broad role only if privacy-approved |
| Start learning experience | `learning_start` | experience type and non-personal content ID |
| Complete meaningful unit | `learning_complete` | type, content ID, outcome band |
| View/use parent report | `parent_report_view` / `parent_report_action` | report period/type, action |
| Begin/complete payment intent | `payment_start` / `payment_result` | plan/method/status, no sensitive payment data |

## Rules

Use stable names, documented triggers, deduplication, test traffic exclusion, consent/privacy compliance, and no child-identifying data in analytics. Validate events in a controlled environment and confirm reports receive them before using KPIs.

Before implementation, resolve consent/privacy requirements in [Open Decisions](OPEN_DECISIONS.md). Do not send names, emails, UUIDs, child IDs, free-text notes, IBAN/payment codes, receipts, or exact learning answers.

Weekly reporting covers event health and funnel movement; monthly reporting covers cohort/source trends, content contribution, retention, and explicit decisions.
