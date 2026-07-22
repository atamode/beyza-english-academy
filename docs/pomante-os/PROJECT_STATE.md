# Project State

> **Purpose:** Concise current-state snapshot.
> **Update trigger:** Any shipped product, access, platform, or operating-model change.
> **Related files:** [Roadmap](ROADMAP.md), [Active Sprint](ACTIVE_SPRINT.md), [Decisions](DECISIONS.md), [Done](DONE.md)
> **Last reviewed:** 2026-07-22

## Product

Poma Academy is Pomante's English-learning product for children. The repository currently contains a browser-based learning application with lessons, module reviews, a diagnostic test, stories, football and volleyball games, family/teacher/student roles, payment and membership flows, parent reporting, and Supabase-backed account features.

## Current verified baseline

- Branch: `main`
- Baseline reviewed: `737ae79` (`fix: restore public pricing visibility`), with Pomante OS commit `b36f431` applied locally.
- Curriculum data: lesson `000` plus lessons `001`–`065`, ten module reviews, vocabulary, diagnostic test, and Story 001.
- Sport questions adapt to student progress through the shared sport-question engine.
- Parent dashboard, weekly/monthly reports, payment review, refunds, membership expiry reminders, audit logging, CI, and live smoke coverage exist in repository history.
- Public positioning and acquisition architecture are now governed by this Pomante OS.
- Live organic search surface currently consists of one crawlable canonical document, `https://pomante.com.tr/`; public games, stories, login, and signup experiences use client-side hash routes and are not distinct crawlable pages.
- Privacy-safe analytics repair is implemented locally: GA is opt-in, refusal preserves full use, the preference is changeable, and safe route/landing/signup/core-learning events are connected. It is not live because repository push credentials are unavailable; GA receipt and numeric baseline remain unverified.

## Fixed boundaries

- Canonical brand rules live in [Brand Guide](BRAND_GUIDE.md).
- Current execution belongs in [Active Sprint](ACTIVE_SPRINT.md), not here.
- Unverified competitor or market claims belong in [Research Log](RESEARCH_LOG.md).

## Immediate operating focus

Deploy the analytics repair and verify GA event receipt when access is available; independently, validate the first acquisition opportunity before designing crawlable product or Knowledge Center routes.
