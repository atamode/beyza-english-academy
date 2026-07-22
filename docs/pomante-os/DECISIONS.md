# Decision Log

> **Purpose:** Append-only record of settled product and operating decisions.
> **Update trigger:** A decision is accepted, rejected, or superseded.
> **Related files:** [Open Decisions](OPEN_DECISIONS.md), [Vision](VISION.md), [Project State](PROJECT_STATE.md)
> **Last reviewed:** 2026-07-22

Do not edit old entries to hide history. Add a new entry that names the superseded decision.

## D-001 — Brand architecture

- **Date:** 2026-07-22 (recorded)
- **Status:** Active
- **Decision:** Pomante is the umbrella brand; Poma Academy is the education product. Use “Pomante Kingdom” in English and “Pomante Krallığı” in Turkish. Never use “Poma Kingdom” or “Poma Krallığı”. Mediablu remains outside Pomante's brand architecture.
- **Reason:** Preserve clear ownership and consistent naming across product, story, and acquisition surfaces.

## D-002 — Baby Poma movement rule

- **Date:** 2026-07-22 (recorded)
- **Status:** Active
- **Decision:** Baby Poma cannot stand, walk, or run; Baby Poma only crawls.
- **Reason:** Character continuity.

## D-003 — Knowledge Center role

- **Date:** 2026-07-22
- **Status:** Active
- **Decision:** The Knowledge Center is a core acquisition and trust product, not a miscellaneous blog.
- **Reason:** Content must serve user needs, product discovery, internal linking, and demonstrable expertise.

## D-004 — Canonical project memory

- **Date:** 2026-07-22
- **Status:** Active
- **Decision:** `AGENTS.md` plus `docs/pomante-os/` form the canonical operational memory for human and AI contributors.
- **Reason:** Reduce repeated decisions, lost context, and documentation drift.

## D-005 — Analytics consent and child-data boundary

- **Date:** 2026-07-22
- **Status:** Active
- **Decision:** Google Analytics is opt-in. The tag must not load before an explicit “Kabul Et” action; refusal must leave the application fully usable, and the choice must remain changeable. Analytics may receive only coarse route/content, source, plan, status, period, and availability fields. Names, emails, user/child identifiers, free text, payment details, receipts, and exact learning answers are prohibited.
- **Reason:** Poma Academy serves children and families; measurement must be subordinate to privacy, explicit choice, and data minimization.

## D-006 — First acquisition opportunity and intent ownership

- **Date:** 2026-07-22
- **Status:** Active
- **Decision:** Lead with the “free online English games for children” opportunity. The home page owns broad Poma Academy/platform evaluation; a future `/ingilizce-oyunlari/` hub owns playable-game discovery; football and volleyball receive truthful supporting product pages. Knowledge Center content may support selection and practice questions but must not compete for the hub's generic discovery intent.
- **Reason:** Turkish SERPs confirm a real game-discovery need, the current product can satisfy it immediately, and sport-based progress-adaptive games provide credible differentiation. Live-tutor course queries mismatch the product; story inventory is not yet deep enough. Demand size is unknown and is not part of this decision.

## D-007 — Sport scoreboard player name

- **Date:** 2026-07-22
- **Status:** Active
- **Decision:** Football and volleyball scoreboards show the entered student profile name. When no student name exists, they show the neutral fallback “Poma”. The name is display-only and must not be sent to analytics.
- **Reason:** Remove the legacy hardcoded “Beyza” label while making the game respond consistently to the active learner profile without weakening the child-data boundary in D-005.
