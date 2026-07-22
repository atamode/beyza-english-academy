# Product Page Library

> **Purpose:** Canonical registry for pages representing verified products and features.
> **Update trigger:** A product page is proposed, launched, materially changed, or retired.
> **Related files:** [Project State](PROJECT_STATE.md), [Landing Page Library](LANDING_PAGE_LIBRARY.md), [Acquisition Page Briefs](PAGE_BRIEFS.md), [Schema Matrix](SCHEMA_MATRIX.md)
> **Last reviewed:** 2026-07-22

## Verified route inventory

Audited 2026-07-22. “Public runtime” means usable without sign-in; it does not mean independently crawlable or indexable.

| Product surface | Runtime route | Access | Search status | Conversion / next action |
|---|---|---|---|---|
| Poma Academy overview | `/` | Public | Only crawlable/indexable product document | Free signup, video, login, social, coupon |
| Entertainment hub | `/#/games` | Public runtime | Fragment state; shares root canonical and metadata | Open story, football, or volleyball |
| Football game | `/#/game/football` | Public runtime | Fragment state; shares root canonical and metadata | Play / return to hub |
| Volleyball game | `/#/game/volleyball` | Public runtime | Fragment state; shares root canonical and metadata | Play / return to hub |
| Story library | `/#/stories` | Public runtime | Fragment state; shares root canonical and metadata | Open Story 001 |
| Story 001 | `/#/story/story-001` | Public runtime | Fragment state; shares root canonical and metadata | Read/listen/quiz |
| Membership and payment | `/#/membership` | Sign-in required | Application utility; not an acquisition page | Manage plan/payment |
| Lessons, diagnostic, vocabulary, reports | Multiple hash routes | Sign-in/profile required | Application states; not acquisition pages | Learn / review progress |

No standalone crawlable product page currently exists for lessons, games, stories, parent reporting, or membership. Their suitability as future pages remains a content-and-intent decision, not an automatic route conversion.

## Approved crawlable proposals

| ID | Proposed URL | Verified product | Intent role | Status |
|---|---|---|---|---|
| PP-001 | `/ingilizce-oyunlari/futbol/` | Football game | Specific playable product; supports game hub | [Implemented locally](PAGE_BRIEFS.md); production validation pending; demand unknown |
| PP-002 | `/ingilizce-oyunlari/voleybol/` | Volleyball game | Specific playable product; supports game hub | [Implemented locally](PAGE_BRIEFS.md); production validation pending; demand unknown |

These pages must expose or faithfully lead into the real games, describe only verified mechanics, and use distinct visible copy and metadata. Sparse exact-match SERPs indicate differentiation potential, not proven search volume.

## Resolved consistency gap

The story list/card source formerly used “Poma Kingdom”. MT-007 corrected Turkish UI/alt text to “Pomante Krallığı” and the English story line to “Pomante Kingdom”; tests prohibit the rejected variants.

Each approved page must describe only available behavior, show who it is for, disclose access/pricing clearly, offer a relevant next action, and have unique measurement. Product structured data is used only where visible content and current eligibility support it.
