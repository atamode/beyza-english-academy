# Internal Linking

> **Purpose:** Define useful, consistent relationships among acquisition and product pages.
> **Update trigger:** Site hierarchy, page templates, clusters, or conversion paths change.
> **Related files:** [SEO Architecture](SEO_ARCHITECTURE.md), [Content Clusters](CONTENT_CLUSTERS.md), [Landing Page Library](LANDING_PAGE_LIBRARY.md)
> **Last reviewed:** 2026-07-23

## Logic

- Home links to core verified product and audience paths.
- Product pages link to the most relevant audience pages and explanatory guides.
- Audience/class pages link to the matching product experience and the guide that helps the visitor decide.
- Topic hubs link to all approved cluster resources; supporting guides link back to their hub and to genuinely adjacent guides.
- Glossary and FAQ entries link to the canonical guide rather than duplicating its explanation.
- Timely posts link to the evergreen source of truth and include an update/expiry plan.

Use descriptive, natural anchor text; vary it only when language remains honest. Do not create sitewide exact-match link blocks, orphan pages, circular funnels, or links added solely for crawlers.

## Audit measures

Track orphan count, click depth, broken links, pages with excessive repeated anchors, internal-link clicks, and assisted activation. Page-type registries own the destination; this file owns the rules.

## Baseline finding — 2026-07-22

The current public root links by JavaScript/hash navigation to signup, login, games, stories, and sport games. These are valid product navigation actions but not crawlable internal links between distinct SEO documents. Instagram and YouTube are external actions. No crawlable content cluster or product-page network exists yet, so orphan/click-depth analysis begins only after real acquisition paths are built.

## Approved first network — live

- Home links to the English-game hub as a core verified product path.
- The hub links to football and volleyball with descriptive game names.
- Each sport page links back to the hub and offers the relevant play/signup action.
- The first English-through-play guide links to the hub only when it helps the reader act; the hub may link back as optional parent guidance.
- No generic Knowledge Center article duplicates the hub's game-discovery intent.

The home, hub, and two sport pages implement this crawlable network in production. Direct responses, links, sitemap discovery, and Search Console submission were verified under MT-012; final indexing and query performance remain monitoring work.
