# Analytics

> **Purpose:** Canonical event taxonomy, data-quality rules, and reporting plan.
> **Update trigger:** User flow, instrumentation, consent/privacy, or reports change.
> **Related files:** [KPI](KPI.md), [Experiment Log](EXPERIMENT_LOG.md), [Search Console](SEARCH_CONSOLE.md)
> **Last reviewed:** 2026-07-22

## Current status

The repository contains an analytics module, but deployed configuration, received events, consent behavior, and data quality have not yet been audited here. Event names below are a target contract pending **MT-003**, not a claim of current collection.

| Funnel action | Target event | Required context (privacy-safe) |
|---|---|---|
| View acquisition page | `page_view` | page type, canonical path, referrer class |
| Select product path | `product_cta_click` | source page, destination/product |
| Begin/create account | `signup_start` / `signup_complete` | source, role if supplied |
| Start learning experience | `learning_start` | lesson/game/story/diagnostic type, content ID |
| Complete meaningful unit | `learning_complete` | type, content ID, outcome band |
| View parent report | `parent_report_view` | report period/type |
| Begin/complete payment intent | `payment_start` / `payment_result` | plan/method/status, no sensitive payment data |

## Rules

Use stable names, documented triggers, deduplication, test traffic exclusion, consent/privacy compliance, and no child-identifying data in analytics. Validate events in a controlled environment and confirm reports receive them before using KPIs.

Weekly reporting covers event health and funnel movement; monthly reporting covers cohort/source trends, content contribution, retention, and explicit decisions.
