# Schema Matrix

> **Purpose:** Govern structured-data eligibility by visible page content.
> **Update trigger:** Page types, visible features, or search-engine eligibility guidance change.
> **Related files:** [SEO Architecture](SEO_ARCHITECTURE.md), [Product Page Library](PRODUCT_PAGE_LIBRARY.md), [FAQ Plan](FAQ_PLAN.md)
> **Last reviewed:** 2026-07-22

| Page/content type | Candidate vocabulary | Eligibility gate | Prohibited use |
|---|---|---|---|
| Organization/home | `Organization`, `WebSite` | Accurate visible identity and canonical URL | Invented ratings, awards, profiles |
| Breadcrumbs | `BreadcrumbList` | Breadcrumb path is visible and matches navigation | Hidden or conflicting hierarchy |
| Product/offer | `Product`/`Offer` only if applicable | A real identifiable offer with visible, current terms | Marking generic editorial pages as products |
| Article/guide | `Article` or suitable subtype | Authorship, dates, headline, and body are visible | False dates or expertise |
| FAQ resource | `FAQPage` only when currently eligible | Real visible questions and answers; current engine rules checked | Repeated marketing Q&A or guaranteed rich result |
| Video page | `VideoObject` | Playable video and accurate metadata are visible | Markup for absent/inaccessible media |

Structured data describes content; it does not create eligibility by itself. Validate syntax, rendered visibility, canonical consistency, and current search-engine rules at implementation time. Record errors and enhancements in [Search Console](SEARCH_CONSOLE.md).

## Live root inventory — 2026-07-22

The root currently emits one JSON-LD block containing `Organization`, `WebSite`, `SoftwareApplication`, `FAQPage`, and `VideoObject` entities.

- Organization/WebSite names and canonical URL are present.
- FAQ questions/answers and the referenced video are visible after the public landing JavaScript renders.
- The initial server HTML contains only a short fallback introduction, not the full FAQ/video landing content. Eligibility and content parity therefore depend on successful client rendering.
- `SoftwareApplication.offers` currently declares a zero-price TRY offer while the live landing also loads plan/pricing choices. Review whether this entity accurately represents the free entry point versus the full commercial offer; do not change it without checking visible pricing and current structured-data rules.
- All fragment routes inherit the same root JSON-LD. No route-specific schema exists, and none should be assumed.

**MT-007** owns correction of confirmed brand/schema consistency risks after a scoped implementation review.
