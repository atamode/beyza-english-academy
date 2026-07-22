# Research Log

> **Purpose:** Evidence ledger for product, learning, market, SEO, and user research.
> **Update trigger:** Research begins, evidence is reviewed, or a finding changes confidence.
> **Related files:** [Open Decisions](OPEN_DECISIONS.md), [Competitor Database](competitors/COMPETITOR_DATABASE.md), [Idea Bank](IDEA_BANK.md)
> **Last reviewed:** 2026-07-22

## Standards

Separate observation from interpretation and recommendation. Record source, date accessed, method/sample, limitations, confidence, decision affected, and owner. Time-sensitive claims require a fresh review date. Research templates are not evidence.

## Entries

| ID | Question | Evidence | Finding | Confidence | Decision/task | Status |
|---|---|---|---|---|---|---|
| R-001 | What is the current public SEO surface? | Repository route/meta/schema inspection plus live root, robots and sitemap responses; 2026-07-22 | One crawlable canonical root; public product experiences are hash states sharing root metadata; no standalone product, audience, or Knowledge Center pages | High | MT-002 / MT-007 | Complete |
| R-002 | What is the verified analytics baseline? | Repository and live analytics asset audit; 2026-07-22 | GA4 tag and 11 called custom events exist, but the funnel is incomplete; landing CTA bridge, route views, signup completion, learning events, conversion outcomes and consent controls are absent or unverified. Numeric baseline requires GA property data. | High for implementation; none for received data | MT-003 / MT-008 / OD-004 | Implementation complete; data blocked |
| R-003 | Which acquisition cluster should launch first? | Query/SERP/user evidence pending | No conclusion yet | None | OD-001 / MT-004 | Planned |

## R-001 evidence and limits

- Live evidence: `https://pomante.com.tr/`, `/robots.txt`, and `/sitemap.xml` returned HTTP 200 during the audit.
- Repository evidence: `index.html`, `js/router.js`, `js/app.js`, route-specific entry modules, `robots.txt`, and `sitemap.xml` at baseline `737ae79`.
- Limitation: Search Console indexing and query data were not available; this audit establishes technical surface and declared controls, not actual index coverage or rankings.

## R-002 evidence and limits

- Live evidence: root HTML loads GA4 ID `G-LVDEFW23S9`; live `js/analytics.js` and `js/app.js` match the audited instrumentation pattern.
- Repository evidence: `index.html`, `js/analytics.js`, public landing event dispatch, pricing/payment/report/teacher call sites, and analytics privacy tests.
- Limitation: no authenticated GA4 property, DebugView, event export, conversion configuration, filter/retention settings, or historical date range was available. The audit proves code paths, not delivery volume or funnel rates.
