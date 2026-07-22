# Research Log

> **Purpose:** Evidence ledger for product, learning, market, SEO, and user research.
> **Update trigger:** Research begins, evidence is reviewed, or a finding changes confidence.
> **Related files:** [Open Decisions](OPEN_DECISIONS.md), [Competitor Database](competitors/COMPETITOR_DATABASE.md), [Idea Bank](IDEA_BANK.md)
> **Last reviewed:** 2026-07-22

## Standards

Separate observation from interpretation and recommendation. Record source, date accessed, method/sample, limitations, confidence, decision affected, and owner. Time-sensitive claims require a fresh review date. Research templates are not evidence.

## Entries

| ID | Question | Evidence | Finding | Confidence | Decision/task | Status |
|---|---|---|---|---|---|---|
| R-001 | What is the current public SEO surface? | Repository route/meta/schema inspection plus live root, robots and sitemap responses; 2026-07-22 | One crawlable canonical root; public product experiences are hash states sharing root metadata; no standalone product, audience, or Knowledge Center pages | High | MT-002 / MT-007 | Complete |
| R-002 | What is the verified analytics baseline? | Repository/live audit plus local MT-008 implementation; 2026-07-22 | Previous live funnel was incomplete. Opt-in consent and minimum funnel repair now pass local targeted tests, but deployment and GA receipt/numeric baseline require MT-009. | High for implementation; none for received data | MT-003 / MT-008 / MT-009 / D-005 | Repair complete; data blocked |
| R-003 | Which acquisition cluster should launch first? | Turkish Google SERP review plus verified current product inventory; 2026-07-22 | Free online English games for children offers the strongest first fit; game hub and sport pages need distinct ownership | Medium for opportunity; high for product fit; none for volume | OD-001 / MT-004 / D-006 | Complete |

## R-001 evidence and limits

- Live evidence: `https://pomante.com.tr/`, `/robots.txt`, and `/sitemap.xml` returned HTTP 200 during the audit.
- Repository evidence: `index.html`, `js/router.js`, `js/app.js`, route-specific entry modules, `robots.txt`, and `sitemap.xml` at baseline `737ae79`.
- Limitation: Search Console indexing and query data were not available; this audit establishes technical surface and declared controls, not actual index coverage or rankings.

## R-002 evidence and limits

- Live evidence: root HTML loads GA4 ID `G-LVDEFW23S9`; live `js/analytics.js` and `js/app.js` match the audited instrumentation pattern.
- Repository evidence: `index.html`, `js/analytics.js`, public landing event dispatch, pricing/payment/report/teacher call sites, and analytics privacy tests.
- Limitation: no authenticated GA4 property, DebugView, event export, conversion configuration, filter/retention settings, or historical date range was available. The audit proves code paths, not delivery volume or funnel rates.

## R-003 evidence and limits

**Method.** Turkish-language SERPs were reviewed on 2026-07-22 for children's English games, game-based learning, online English, English stories, middle-school games, and football/volleyball English-game combinations. Result patterns were compared with the verified public product inventory in R-001; this was a directional opportunity review, not keyword-volume research.

**Observed result patterns.**

- Free-game discovery is served by playable hubs such as [Novakid Games](https://www.novakidschool.com/tr/games/), [Wonjo](https://wonjo.kids/tr/ingilizce-oyunlar/), [Wordwall](https://wordwall.net/tr-tr/community/ingilizce/oyun), [TeamELT](https://www.teamelt.com/oyunlar/), [Cambridge English](https://www.cambridgeenglish.org/tr/learning-english/games-social/), and [Derslig](https://www.derslig.com/oyunlar/ingilizce-oyunu). This validates a playable-game need but also shows established competition.
- General online-English results are dominated by live-course/tutor offers such as [Novakid](https://www.novakidschool.com/tr/) and [Cambly Kids](https://www.cambly.com/tr/kids), which do not match Poma Academy's current self-directed product model.
- English-story results are mainly story libraries and list/editorial pages, including [Çocuk Masalları Oku](https://www.cocukmasallarioku.com/hikaye-kategori/ingilizce-hikayeler/). Poma Academy currently has only Story 001, so a story-led cluster would overstate present depth.
- Football-specific searches showed sparse, mixed results; volleyball-specific results showed no clear direct learning-game competitor in the reviewed set. This supports differentiation potential for real product pages, not a demand claim.
- The root domain appeared for a branded Poma Academy query, while the site inventory still exposes only the root as a crawlable canonical URL.

**Interpretation and recommendation.** Lead with a truthful game-discovery hub supported by the existing football and volleyball experiences. Differentiate through sports context and verified progress adaptation, not catalogue size. Keep the home page on broad platform evaluation and make the first Knowledge Center guide answer a parent selection/practice question rather than duplicate the hub.

**Limits.** No Search Console, keyword planner, third-party volume, clickstream, parent interviews, or conversion data was available. Exact audience-age demand, monthly volume, difficulty, ranking potential, and traffic value are unknown. SERPs are time- and location-sensitive; recheck them when briefs are finalized and quantify the opportunity when a named demand source becomes available.
