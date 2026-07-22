# Landing Page Library

> **Purpose:** Registry and brief standard for audience, class, campaign, and intent-led landing pages.
> **Update trigger:** A landing page is proposed, approved, launched, changed, or retired.
> **Related files:** [Keyword Map](KEYWORD_MAP.md), [Product Page Library](PRODUCT_PAGE_LIBRARY.md), [Internal Linking](INTERNAL_LINKING.md)
> **Last reviewed:** 2026-07-22

## Verified live registry

Audited 2026-07-22 against repository source and the live GitHub Pages response.

| ID | URL / runtime surface | Audience and role | Search status | Primary action |
|---|---|---|---|---|
| LP-001 | `https://pomante.com.tr/` | Parents evaluating Poma Academy; product overview | Live, crawlable, indexable canonical document; only sitemap URL | Free signup; watch video; login; social links; coupon signup |
| UT-001 | `/#/login` | Returning users; authentication utility | Public runtime state, not a distinct crawlable document | Sign in / go to signup |
| UT-002 | `/#/signup` | New parent, teacher, or student account | Public runtime state, not a distinct crawlable document | Create free account / go to login |

The server returns the same `index.html` for fragment variants because URL fragments are not sent in HTTP requests. Therefore `/#/login` and `/#/signup` inherit the root title, description, canonical, robots directive, social metadata, and structured data. They are product utilities, not approved SEO landing pages.

No dedicated audience, age, grade/class, campaign, or Knowledge Center landing page exists. New page proposals remain blocked on intent validation in **MT-004** and **MT-005**.

## Root metadata baseline

- Title: `Pomante | Poma Academy – Çocuklar İçin Oyunlarla İngilizce`
- Description: describes lessons, word games, stories, sports mini-games, and free trial.
- Canonical: `https://pomante.com.tr/`
- Robots meta: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`
- `robots.txt`: permits all crawling and declares the sitemap.
- `sitemap.xml`: contains only the canonical root URL; recorded `lastmod` is 2026-07-16 at audit time.
- Social metadata: root-specific Open Graph and Twitter card fields with one shared wide image.

## Approval rules

- One distinct user need and primary intent per page.
- Age, grade, class, and audience pages must contain materially distinct help—not token swaps or doorway copy.
- State the product fit honestly; do not imply unsupported curriculum outcomes.
- Link to the relevant product page and at least one useful Knowledge Center resource.
- Define impression/click, qualified session, CTA, registration, and downstream activation expectations before launch.

## Brief fields

Audience and problem; query/intent evidence; promise; unique content; proof; page outline; CTA; internal links; eligible schema; owner; review date; measurement window.
