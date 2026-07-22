# SEO Architecture

> **Purpose:** Canonical model for organic discovery surfaces and their roles.
> **Update trigger:** Search intent, site hierarchy, page-type, or indexing rules change.
> **Related files:** [Keyword Map](KEYWORD_MAP.md), [Internal Linking](INTERNAL_LINKING.md), [Schema Matrix](SCHEMA_MATRIX.md), [Knowledge Center](KNOWLEDGE_CENTER.md)
> **Last reviewed:** 2026-07-22

## Network model

The SEO network has four complementary layers:

1. **Product pages** explain a distinct product or feature and support conversion.
2. **Audience/class landing pages** answer a specific child's, parent's, or teacher's need without doorway-page duplication.
3. **Evergreen Knowledge Center guides** solve durable learning or parenting questions and connect relevant intent to product experiences.
4. **Timely blog/editorial posts** cover genuinely time-sensitive news, campaigns, or research; they must not replace evergreen guides.

Every indexable page needs one primary intent, a useful standalone answer, a clear next action, and at least one logical inward and outward link. Page generation at scale is prohibited unless every page has distinct human value.

## Page hierarchy

- Home: brand/product promise and primary paths.
- Product layer: Academy, lessons, stories, games, parent reporting, and other verified offers.
- Audience/class layer: only validated age, grade, level, parent, or teacher needs.
- Knowledge Center: topic hubs → evergreen guides/glossary/FAQ → relevant product or audience page.

## Verified baseline — 2026-07-22

- Hosting serves a single physical `index.html` document from `https://pomante.com.tr/`.
- The root is indexable, self-canonical, present in the sitemap, and allowed by `robots.txt`.
- Public games and stories, plus login/signup, are hash-based application states. A fragment does not create a separate HTTP document, so those surfaces cannot own independent canonical URLs, metadata, schema, sitemap entries, or organic landing intent in the current architecture.
- No class/audience page, standalone product page, evergreen guide, blog/editorial route, FAQ resource, or glossary route exists.
- Protected account, lesson, report, payment, and administration states should remain application utilities rather than indexable acquisition pages.

## Implementation implication

Do not add hash URLs to the sitemap or treat dynamic hash content as a page library. After **MT-004** and **MT-005** validate demand and page roles, approved acquisition surfaces need real crawlable paths with server/static output, unique metadata, canonical ownership, and useful internal links. Authentication and child-specific states must remain outside the indexable network.

## Quality and measurement

Human usefulness overrides keyword coverage. Measure indexing, non-brand impressions/clicks, qualified landing sessions, product-start actions, registration, lesson/game/story starts, and paid conversion where applicable. See [KPI](KPI.md) and [Analytics](ANALYTICS.md).
