# Analytics

> **Purpose:** Canonical event taxonomy, data-quality rules, and reporting plan.
> **Update trigger:** User flow, instrumentation, consent/privacy, or reports change.
> **Related files:** [KPI](KPI.md), [Experiment Log](EXPERIMENT_LOG.md), [Search Console](SEARCH_CONSOLE.md)
> **Last reviewed:** 2026-07-23

## Current status

Implementation was audited against repository and live assets on 2026-07-22.

The following repair is deployed and tested:

- Google Analytics no longer loads from static HTML. A user must explicitly accept analytics before the tag is requested.
- Accept and reject have equal controls; rejection does not restrict the product; “Analitik ayarları” allows later change. Refusal/unknown state disables measurement and clears accessible `_ga` cookies.
- SPA route views use a sanitized route without query/fragment parameters. Learning route entry emits a coarse content type/ID only.
- Public landing CTAs, signup submit/success, lesson and diagnostic completion, football/volleyball completion, and story quiz completion now use the protected event allowlist.
- The client refuses analytics events unless consent is granted. Existing parameter filtering continues to discard non-allowlisted fields.
- Formal aydınlatma/KVKK wording and organizational obligations still require qualified owner review; implementation is not a legal-compliance guarantee.

- GA4 measurement ID `G-LVDEFW23S9` loads only after explicit analytics consent.
- Sanitized application route views and public acquisition page views are instrumented. On 2026-07-22, GA4 real-time pages showed receipt for `/`, `/ingilizce-oyunlari/`, and `/ingilizce-oyunlari/futbol/`; this proves page receipt, not full event correctness or a numeric baseline.
- `js/analytics.js` allowlists 13 custom event names and five privacy-limited parameters: `plan_code`, `source`, `status`, `period_type`, and `has_data`.
- Eleven allowlisted events have a source call site. Two (`parent_report_period_changed`, `parent_report_printed`) are declared but never called.
- Public landing actions are connected through the consent-gated analytics bridge. Event-by-event GA4 receipt is not yet verified.
- GA property access, DebugView, live received events, internal-traffic filters, retention settings, conversions, audiences, and historical data were not available. A numeric funnel baseline cannot yet be trusted.

## Pre-repair live emitted-event inventory

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

At the 2026-07-22 pre-repair baseline, these events were not connected. MT-008 now connects them in production with only coarse allowlisted context; authenticated GA4 receipt remains MT-009 work.

## Remaining funnel/data gaps

- No login success or profile/child setup completion event.
- Vocabulary and word-game completion are not yet explicit; their starts are visible through sanitized route events.
- No payment approval/rejection, membership activation, renewal, expiry, cancellation, or refund result event.
- No return-learning or retention event.
- No deployed DebugView/Realtime receipt proof, GA conversion marking, internal-traffic filter verification, retention configuration, or numeric baseline.

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

Decision D-005 in [Decisions](DECISIONS.md) governs consent and minimization. Do not send names, emails, UUIDs, child IDs, free-text notes, IBAN/payment codes, receipts, or exact learning answers.

Weekly reporting covers event health and funnel movement; monthly reporting covers cohort/source trends, content contribution, retention, and explicit decisions.
