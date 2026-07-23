# Project State

> **Purpose:** Concise current-state snapshot.
> **Update trigger:** Any shipped product, access, platform, or operating-model change.
> **Related files:** [Roadmap](ROADMAP.md), [Active Sprint](ACTIVE_SPRINT.md), [Decisions](DECISIONS.md), [Done](DONE.md)
> **Last reviewed:** 2026-07-23

## Product

Poma Academy is Pomante's English-learning product for children. The repository currently contains a browser-based learning application with lessons, module reviews, a diagnostic test, stories, football and volleyball games, family/teacher/student roles, payment and membership flows, parent reporting, and Supabase-backed account features.

## Current verified baseline

- Branch: `main`
- Baseline reviewed: `c95f36b` (`docs: close commercial site phase one`).
- Curriculum data: lesson `000` plus lessons `001`–`065`, ten module reviews, vocabulary, diagnostic test, and Story 001.
- Sport questions adapt to student progress through the shared sport-question engine.
- Parent dashboard, weekly/monthly reports, payment review, refunds, membership expiry reminders, audit logging, CI, and live smoke coverage exist in repository history.
- Public positioning and acquisition architecture are now governed by this Pomante OS.
- Public games, stories, login, and signup application experiences use client-side hash routes and are not distinct crawlable pages; the root plus three clean acquisition documents are crawlable.
- The English-game hub and football/volleyball product pages are live as independent crawlable documents with production 200 responses, correct canonicals, sitemap coverage, Search Console submission, and GA4 real-time page receipt.
- Football, volleyball, and Story 001 runtime media are optimized. The football win video is restored and runs only for a won match before its summary; the verified repository/live line is commit `c442525`.
- Privacy-safe analytics repair is live: GA is opt-in, refusal preserves full use, the preference is changeable, and safe route/landing/signup/core-learning events are connected. GA4 real-time page receipt for the root, game hub, and football page was observed; broader event/configuration and numeric-baseline validation remain open under MT-009.
- A separate Pomante commercial site now has a privately deployed Phase 1 build. It includes the approved product/B2B scope, “Poma ile Eğitim” bridge, and source-level 301 handlers for the three Academy acquisition paths. Real `pomante.com.tr` activation has not occurred; advanced site architecture and motion refinement are deferred.
- The Academy hostname source patch is prepared on the isolated `mt-013-academy-hostname` branch. Source metadata, sitemap/robots, live checks, analytics fallback, email links, and transitional CORS target Academy; the tracked `CNAME` deliberately remains on the current root until coordinated cutover.

## Fixed boundaries

- Canonical brand rules live in [Brand Guide](BRAND_GUIDE.md).
- Current execution belongs in [Active Sprint](ACTIVE_SPRINT.md), not here.
- Unverified competitor or market claims belong in [Research Log](RESEARCH_LOG.md).

## Immediate operating focus

Validate and hold the prepared non-live Academy hostname patch under MT-013 until a coordinated cutover window. The commercial site contains the required redirect handlers, but activation remains blocked until they are verified on the final custom domain and DNS/Pages/Supabase/GA/Search Console/rollback access is confirmed. Mediablu remains outside Pomante. MT-009 and KC-001 retain their existing blockers.
