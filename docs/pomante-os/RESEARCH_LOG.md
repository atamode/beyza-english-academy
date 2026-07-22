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
| R-004 | What should the first supporting Knowledge Center guide answer? | Turkish parent/game-selection SERP review plus authoritative source scan; 2026-07-22 | A practical word-game selection framework fills a clearer informational gap than another game list and stays distinct from LP-002 | Medium for user-value hypothesis; none for volume | MT-005 / KC-001 | Complete |
| R-005 | What can the first acquisition pages truthfully promise? | Football/volleyball engines, views, assets, access tests, analytics, and route inventory; 2026-07-22 | Public guest play, ten-question word matches/sets, shared Word League, signed-in progress signals, summaries, media states, and limitations are briefable; legacy score label was resolved by D-007 | High | MT-010 / MT-007 / MT-006 | Complete |
| R-006 | Which root schema entities remain supportable? | Root visible/source parity, real video probe, current official Google structured-data documentation; 2026-07-22 | Keep Organization, WebSite, and VideoObject; remove unsupported/misaligned SoftwareApplication and obsolete FAQPage markup while retaining visible content | High | MT-007 | Complete |

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

## R-004 evidence and limits

- Turkish searches around choosing age/level-appropriate English games and using word games returned mostly activity lists, game/app pages, and course-led play articles. Examples included [Speak English Daily's game list](https://speakenglishdaily.com/tr/blog/cocuklar-icin-ingilizce-kelime-oyunlari/), [Novakid's activity/game article](https://www.novakidschool.com/tr/blog/cocuklar-icin-ingilizce-aktiviteler-ve-ingilizce-oyunlari/), and [British Council's parent guidance](https://learnenglishkids.britishcouncil.org/parents/helping-your-child/how-start-teaching-kids-english-home).
- The reviewed Turkish result set did not expose a clear, comprehensive parent decision framework covering goal, observed level, learning action, feedback, return/transfer, and practical/safety fit together.
- KC-001 therefore owns evaluation rather than game discovery. The source plan includes British Council practice examples and Cambridge-hosted research on retrieval and technology-assisted L2 vocabulary learning; publication still requires full-source review and qualified claim checking.
- Limitation: sparse/noisy results can reflect low query demand as well as a content gap. No volume, Search Console, interviews, or usability evidence was available. The brief is an evidence-bounded value hypothesis, not a traffic forecast.

## R-005 evidence and limits

- Repository evidence: public route handling in `js/app.js`; shared selection in `js/sport-question-engine.js`; league/question/session behavior in `js/football-engine.js` and `js/volleyball-engine.js`; visible interaction and summaries in both game views; media manifests; access, adaptation, game, analytics, and reduced-motion tests.
- Guest sessions use namespaced session storage; active-student sessions can use lesson/vocabulary signals and persist sport learning events. The acquisition copy must not collapse those behaviors into one universal personalization/reporting promise.
- Both games exposed “Beyza” as the player-side score label at audit time. D-007 resolved this with the entered student profile name and a neutral “Poma” fallback; targeted sport tests verify both views use the shared escaped label.
- Limitation: this was a repository behavior audit, not a deployed cross-browser, child-usability, performance, or production analytics test. Every product claim and route must be reverified after implementation and deployment.

## R-006 evidence and limits

- Google's current [SoftwareApplication documentation](https://developers.google.com/search/docs/appearance/structured-data/software-app) requires an offer price and a real review or aggregate rating for rich-result eligibility. Poma Academy has no verified review/rating, and the root's former zero-price-only offer did not represent its visible free and paid plan set.
- Google [removed the FAQ rich-result feature](https://developers.google.com/search/updates#removing-faq-rich-result) from Search in May 2026 and removed its documentation in June. Visible root FAQs remain useful to users; their `FAQPage` markup no longer has a supported Google Search feature role.
- The root's real MP4 is 49.536 seconds by local `ffprobe`. `VideoObject` retains its real content URL, thumbnail, name, description, upload date, and measured duration; `embedUrl` was removed because the MP4 URL is content bytes, not a player URL, consistent with Google's [VideoObject definitions](https://developers.google.com/search/docs/appearance/structured-data/video).
- [General structured-data guidance](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) requires markup to represent visible page content. Local JSON parsing and parity tests pass; Rich Results Test and production URL Inspection remain blocked until deployment.
