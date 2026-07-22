# KPI Framework

> **Purpose:** Define outcome measures and reporting expectations.
> **Update trigger:** Funnel, business model, instrumentation, or targets change.
> **Related files:** [Analytics](ANALYTICS.md), [Search Console](SEARCH_CONSOLE.md), [Experiment Log](EXPERIMENT_LOG.md)
> **Last reviewed:** 2026-07-22

## Funnel

| Stage | Core measures | Current measurability (2026-07-22) |
|---|---|---|
| Discover | Indexed pages, non-brand impressions/clicks, qualified referrals | Search Console/data baseline unavailable; initial GA page view possible |
| Understand | Engaged landing sessions, key content depth, product-view action | Landing CTAs and pricing events are live; acquisition page-view receipt verified, event-level receipt pending |
| Start | Registration/account start, diagnostic/lesson/game/story start | Signup and sanitized learning route starts are live; event-level receipt pending |
| Learn | Meaningful completion, return practice, progression signal | Core lesson/diagnostic/sport/story completions are live; event-level receipt and retention baseline pending |
| Parent trust | Parent report viewed, useful report interaction, linked child activity | Report open instrumented; period-change/print declared but unused |
| Convert/retain | Payment intent, approved payment/membership, renewal/expiry outcomes | Request/receipt instrumented; approval, activation, renewal, expiry and refund outcomes absent |

Exact event definitions belong in [Analytics](ANALYTICS.md). Segment by source, landing page type, new/returning user, role, and child profile only where privacy-safe and technically reliable.

## Reporting expectations

- Weekly: instrumentation health, acquisition movement, activation, anomalies.
- Monthly: cohort/funnel trends, content contribution, retention, decisions and next actions.
- Experiments: predeclared primary metric, guardrails, window, and result.

Targets remain unset until GA receipt and historical data are verified. Current event presence is not a numeric baseline. Never substitute pageviews or impressions alone for learning, trust, or conversion outcomes.
