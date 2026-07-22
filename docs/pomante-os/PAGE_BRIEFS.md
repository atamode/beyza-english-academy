# Acquisition Page Briefs

> **Purpose:** Production-ready briefs for approved crawlable landing and product pages.
> **Update trigger:** A brief is approved, revised, implemented, measured, or retired.
> **Related files:** [Landing Page Library](LANDING_PAGE_LIBRARY.md), [Product Page Library](PRODUCT_PAGE_LIBRARY.md), [Keyword Map](KEYWORD_MAP.md), [Internal Linking](INTERNAL_LINKING.md)
> **Last reviewed:** 2026-07-22

## Registry

| ID | Page | Canonical URL | Brief status | Build status |
|---|---|---|---|---|
| LP-002 | English game hub | `/ingilizce-oyunlari/` | Approved | Not built |
| PP-001 | Football English word game | `/ingilizce-oyunlari/futbol/` | Approved | Not built |
| PP-002 | Volleyball English word game | `/ingilizce-oyunlari/voleybol/` | Approved | Not built |

## Shared implementation contract

- Every canonical URL must return its own HTTP 200 document on direct request, without depending on a URL fragment for its indexable content.
- Server HTML must contain the unique title, description, canonical, H1, core explanatory copy, primary links, and crawlable navigation. JavaScript enhancement must not be the only source of meaning.
- The current games remain at `/#/game/football` and `/#/game/volleyball`. Product-page CTAs may launch those verified experiences; the clean acquisition URLs must not canonicalize to the hash routes.
- Home links to LP-002. LP-002 links to both product pages. Each product page links to LP-002, its play route, and—after publication—KC-001 where parent guidance is useful.
- Add all three canonical URLs to the sitemap only when direct production requests return the final indexable documents. Keep one self-referencing canonical per page.
- Use unique Open Graph/Twitter metadata and meaningful 16:9 game artwork with accurate alt text. Do not eagerly load gameplay MP4 files on acquisition pages.
- Candidate schema is `BreadcrumbList`; use `SoftwareApplication` or another product vocabulary only after checking current eligibility and visible-page parity. Do not add ratings, reviews, outcomes, or `FAQPage` markup without real eligible content.
- Preserve explicit analytics consent. Proposed events use only allowlisted, non-personal fields: acquisition page view, product CTA click, game start, and game completion with coarse content type/ID/source. No child/account identifiers or exact answers.
- Direct-load, no-JavaScript meaning, keyboard navigation, focus visibility, reduced-motion behavior, responsive layout, image dimensions, broken-link checks, canonical/meta uniqueness, and consent-safe analytics require automated or documented verification.

## Verified product facts and claim boundary

Repository inspection on 2026-07-22 confirms:

- Football and volleyball are public runtime experiences and can be started without an account.
- Each match/set uses up to ten four-option English-word meaning questions.
- Both sports use the same Word League progress. For an active student, selection considers lesson progress and vocabulary difficulty/review signals; a small next-lesson preview may be included. Guest progress uses session storage and is not a parent-report promise.
- Incorrect words can reappear later; the games show immediate explanations, score/progress, a match/set summary, difficult/review words, league progress, and trophies.
- Football uses pass, attack, shot, defence, save, score, poster, and selected video states. Volleyball uses serve, receive/pass, spike, block/defence, score, poster, and selected video states.
- Reduced-motion handling uses posters instead of result videos where implemented.

Permitted phrasing describes these mechanics as practice or reinforcement. Do not claim guaranteed learning, fluency, curriculum mastery, a scientifically proven outcome, or personalization beyond the implemented selection signals. Do not imply that two sports form a large game catalogue.

Before launch, MT-007 must replace the legacy visible score label “Beyza” in both sport games with an approved product/character/player label. The brief does not decide that replacement name.

## LP-002 — English game hub

### Audience, intent, and promise

- **Audience/job:** A parent or child looking for a free online English game that can be tried immediately; strongest verified product fit is primary-school end / middle-school start.
- **Primary intent:** Find and choose a playable English game for a child.
- **Promise:** Try Poma Academy's two real sports-based word games and understand what each practises before starting.
- **Not this page:** General Poma Academy evaluation, a broad third-party game directory, an age/grade doorway, or the KC-001 game-selection framework.
- **Primary CTA:** Choose football or volleyball. Secondary CTA: create a free account only after access/progress differences are explained.

### Proposed search presentation

- **Title:** `Çocuklar İçin Ücretsiz İngilizce Oyunları | Poma Academy`
- **Meta description:** `Futbol ve voleybol temalı ücretsiz İngilizce kelime oyunlarını keşfedin. Çocuklar kelimeleri kısa maç ve setlerle tekrar etsin.`
- **H1:** `Çocuklar için ücretsiz online İngilizce oyunları`
- **Canonical:** `https://pomante.com.tr/ingilizce-oyunlari/`

Final title/description must be checked for rendered length and SERP fit at implementation; wording is not a volume or ranking claim.

### Required visible content

1. Direct introduction: two available games, free immediate play, word-practice purpose, and honest audience fit.
2. Football and volleyball cards with distinct mechanic summaries, static artwork, “how it works,” and crawlable detail links.
3. “What is practised?” explanation separating recognition/meaning recall from broader language skills.
4. Guest versus signed-in use: immediate guest play; signed-in student progress can inform selection and feed verified progress storage/reporting only where current behavior supports it.
5. Short comparison table: sport setting, interaction states, shared ten-question Word League, result summary, and play/detail actions.
6. Safety/access facts that are actually verified; do not invent ad-free, tracking-free, device, or accessibility claims.
7. Contextual link to KC-001 after it is reviewed and published.

### Measurement and acceptance

- KPIs: organic qualified visit, football/volleyball detail click, play CTA, consented game start, assisted signup. Treat these separately; a hub visit is not activation.
- Accept when the hub directly returns 200, has unique metadata/body, links crawlably to both product pages, launches both real games, makes the two-game inventory explicit, and passes shared contract checks.

## PP-001 — Football English word game

### Audience, intent, and promise

- **Audience/job:** A child interested in football, or a parent seeking a football-context English word practice activity.
- **Primary intent:** Understand and play the football English word game.
- **Promise:** Answer English word-meaning questions to move through passes, attacks, shots, defence, saves, and a match summary.
- **Primary CTA:** `Futbol oyununu başlat` → `/#/game/football`. Secondary: view all English games.

### Proposed search presentation

- **Title:** `İngilizce Futbol Kelime Oyunu | Poma Academy`
- **Meta description:** `Sporty Poma ile 10 soruluk İngilizce futbol maçına çıkın; pas, şut ve kurtarışlarla kelimeleri ücretsiz tekrar edin.`
- **H1:** `İngilizce futbol kelime oyunu`
- **Canonical:** `https://pomante.com.tr/ingilizce-oyunlari/futbol/`

### Required visible content

1. Direct answer: what the game is, that it is free to start, and the verified question format.
2. Three-step flow: start match → answer word questions and see football states → review match/word summary.
3. Verified adaptation explanation: current/previous lesson words, limited next-lesson preview, difficult/due word signals, recent-word avoidance, and shared Word League. Use plain language and distinguish guest behavior.
4. What the result screen shows: score, correct/wrong count, success percentage, new/learned/review words, league progress, difficult words, and trophies.
5. Static screenshots/posters for match intro and representative result states; no autoplay acquisition-page video.
6. Limitations: primarily word-meaning practice; not a full football simulation or complete English course.
7. Links to LP-002, PP-002 as an alternative sport, and KC-001 when published.

### Proof, measurement, and acceptance

- Proof sources: `football-engine.js`, `sport-question-engine.js`, `football-game.js`, manifest assets, and tests. Reverify mechanics at build time.
- KPIs: qualified page view, play CTA, consented football start/completion, repeat play, contextual signup. Never send word/answer or student identifiers.
- Accept when direct URL returns unique 200 content, play CTA opens the working public football route, all claims match current mechanics, media has dimensions/alt text, and shared checks pass.

## PP-002 — Volleyball English word game

### Audience, intent, and promise

- **Audience/job:** A child interested in volleyball, or a parent seeking a volleyball-context English word practice activity.
- **Primary intent:** Understand and play the volleyball English word game.
- **Promise:** Answer English word-meaning questions through serve, receive/pass, spike, block/defence, points, and a set summary while retaining shared Word League progress.
- **Primary CTA:** `Voleybol oyununu başlat` → `/#/game/volleyball`. Secondary: view all English games.

### Proposed search presentation

- **Title:** `İngilizce Voleybol Kelime Oyunu | Poma Academy`
- **Meta description:** `Poma ile 10 soruluk İngilizce voleybol setine başlayın; servis, smaç ve bloklarla kelimeleri ücretsiz tekrar edin.`
- **H1:** `İngilizce voleybol kelime oyunu`
- **Canonical:** `https://pomante.com.tr/ingilizce-oyunlari/voleybol/`

### Required visible content

1. Direct answer: what the game is, free start, and verified question format.
2. Three-step flow: start set → answer word questions and see volleyball states → review set/word summary.
3. Shared adaptation explanation aligned exactly with PP-001; make clear that Word League progress continues across football and volleyball.
4. What the result screen shows: score, correct/wrong count, success percentage, new/learned/review words, blocks/saves, league progress, difficult words, and trophies.
5. Static idle/gameplay and representative result posters; no autoplay acquisition-page video.
6. Limitations: primarily word-meaning practice; not a full volleyball simulation or complete English course.
7. Links to LP-002, PP-001 as an alternative sport, and KC-001 when published.

### Proof, measurement, and acceptance

- Proof sources: `volleyball-engine.js`, shared `football-engine.js`/`sport-question-engine.js`, `volleyball-game.js`, manifest assets, and tests. Reverify mechanics at build time.
- KPIs: qualified page view, play CTA, consented volleyball start/completion, repeat play, contextual signup. Never send word/answer or student identifiers.
- Accept when direct URL returns unique 200 content, play CTA opens the working public volleyball route, shared progress language is accurate, all media is accessible, and shared checks pass.

## Build order and launch gate

1. Resolve the approved replacement for the legacy “Beyza” score label under MT-007 and update both games consistently.
2. Implement shared acquisition-page shell and LP-002.
3. Implement PP-001 and PP-002 from the same maintained component/style system while preserving unique content.
4. Add crawlable links from home and between the three pages; add KC-001 links only after KC-001 publication.
5. Add sitemap/metadata/schema/consent-safe measurement, then run direct-load, content, accessibility, and game-launch verification.
6. Deploy before treating pages as live; verify production HTTP responses, rendered metadata, indexability, and analytics receipt separately.
