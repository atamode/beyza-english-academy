# Active Sprint

> **Purpose:** The small set of tasks currently in execution.
> **Update trigger:** Work starts, completes, blocks, or leaves the sprint.
> **Related files:** [Master Tasks](MASTER_TASKS.md), [Done](DONE.md), [Open Decisions](OPEN_DECISIONS.md)
> **Last reviewed:** 2026-07-23

## Sprint goal

Preserve the verified Academy launch while preparing the Pomante root/Academy subdomain split without breaking access, analytics, or search equity.

## In progress

- **MT-003 / MT-009:** Numeric funnel baseline blocked pending push/deploy and authenticated GA4 property/report access.
- **MT-013:** Migration contract and repository dependency audit completed. Academy hostname source patch is prepared on the isolated `mt-013-academy-hostname` branch without changing `CNAME` or live infrastructure; DNS/Pages/Supabase/GA/Search Console access and rollback ownership remain required for activation.
- **MT-014:** Phase 1 commercial site is complete for now. Custom-domain activation remains coordinated with MT-013; deeper information architecture and Dora/Framer-style motion are explicitly deferred to a later refinement pass.

## Completed this sprint

- **MT-002:** Public route and SEO inventory completed against repository source and the live site on 2026-07-22.
- **MT-003 implementation audit:** Live tag, event allowlist, call sites, funnel gaps, and data-access boundary documented on 2026-07-22; task remains blocked for received-data verification.
- **MT-008:** Opt-in analytics loading, equal accept/reject controls, changeable preference, safe SPA route views, landing CTAs, signup, and core learning completion events implemented and tested locally.
- **MT-004:** Turkish SERPs and current product capability evaluated; first acquisition opportunity, canonical intent owners, exclusions, and evidence limits recorded.
- **MT-005:** KC-001 selection-framework brief approved with SERP boundary, evidence plan, outline, exclusions, measurement, and review gate.
- **MT-010:** Game hub and football/volleyball production briefs approved from verified mechanics, access, media, analytics, and route behavior.
- **MT-007:** Dynamic sport player label, approved Pomante Kingdom/Krallığı naming, and evidence-bounded root structured data implemented and fully tested locally.
- **MT-006:** Crawlable English-game hub and football/volleyball product pages implemented with direct-load HTML, unique metadata, internal links, sitemap entries, BreadcrumbList markup, and consent-safe CTA measurement; local build, HTTP, and full-suite checks pass.
- **MT-012:** Acquisition hub and sport pages deployed; clean URLs, assets, canonicals, sitemap, Search Console submission, and GA4 real-time page receipt verified on production.
- **Performance repair:** Football, volleyball, and Story 001 media optimized; football victory video restored for wins only; production assets return 200 and the full suite passes at 475/475.
- **MT-013 contract:** Exact hostname dependencies, URL/redirect map, ordered GitHub Pages/DNS/Supabase/analytics/Search Console cutover, acceptance checks, and rollback triggers recorded in [Domain Migration](DOMAIN_MIGRATION.md).
- **MT-014 Phase 1:** Separate Pomante commercial site created and privately deployed with the selected warm retail palette, fast-sale hero/category flow, Kayseri/Duble Katla product focus, Renkli Mola, corporate ordering, “Poma ile Eğitim” bridge, and three Academy 301 route handlers.
- **MT-013 source preparation:** Academy canonicals, discovery files, live-check defaults, analytics fallback, transactional/report email links, and transitional Edge Function CORS were updated on an isolated branch. A migration guard keeps the live `CNAME` unchanged until the coordinated cutover.

## Exit criteria

- Inventory evidence is recorded in the relevant canonical files.
- Gaps become bounded master tasks.
- No unverified market claim is promoted to product direction.
