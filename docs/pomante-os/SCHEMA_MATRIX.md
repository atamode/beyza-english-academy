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

## Root inventory — repaired locally 2026-07-22

The root now emits one JSON-LD block containing `Organization`, `WebSite`, and `VideoObject` entities. The repair is local until deployment.

- Organization/WebSite names and canonical URL are present.
- The referenced video is visible after the public landing JavaScript renders; its content URL, thumbnail, publish date, and measured duration are recorded. The invalid MP4-as-player `embedUrl` was removed.
- `SoftwareApplication` was removed from the root because the page exposes free and paid plans while the markup reduced the offer to zero TRY, and no real review/rating exists for Google's required rich-result pairing.
- `FAQPage` was removed while the visible FAQ content remains. Google removed the FAQ rich-result feature in May 2026 and its documentation in June 2026.
- All fragment routes inherit the same root JSON-LD. No route-specific schema exists, and none should be assumed.

Evidence: [Google structured-data general guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), [SoftwareApplication requirements](https://developers.google.com/search/docs/appearance/structured-data/software-app), [FAQ feature removal](https://developers.google.com/search/updates#removing-faq-rich-result), and [VideoObject requirements](https://developers.google.com/search/docs/appearance/structured-data/video). Production validation remains required after deployment.

## Acquisition-page inventory — implemented locally 2026-07-22

LP-002, PP-001, and PP-002 each emit a visible breadcrumb trail with matching `BreadcrumbList` JSON-LD and a self-referencing canonical. No ratings, reviews, offers, or unsupported product claims are marked up. Syntax and page-contract tests pass locally; production rich-result and URL inspection remain MT-012 work.
