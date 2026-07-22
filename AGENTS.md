# Pomante Repository Agent Rules

## Mandatory startup

Before planning or changing the repository, read:

1. [`docs/pomante-os/PROJECT_STATE.md`](docs/pomante-os/PROJECT_STATE.md)
2. [`docs/pomante-os/DECISIONS.md`](docs/pomante-os/DECISIONS.md)
3. [`docs/pomante-os/ROADMAP.md`](docs/pomante-os/ROADMAP.md)
4. [`docs/pomante-os/ACTIVE_SPRINT.md`](docs/pomante-os/ACTIVE_SPRINT.md)
5. [`docs/pomante-os/MASTER_TASKS.md`](docs/pomante-os/MASTER_TASKS.md)

Then read the subject-specific canonical files linked from those documents. Check whether the subject was already decided; do not reopen a settled decision without new evidence.

## Completion rule

> A task is not complete when only the code is changed. If the task changes project state, decisions, roadmap, sprint status, SEO architecture, product direction, or research knowledge, the relevant Pomante OS files must also be updated in the same task.

Every task must:

- check the active sprint and master task list before work;
- record newly completed work in `DONE.md` and update task status where relevant;
- append a decision to `DECISIONS.md` when one is made or superseded;
- update `PROJECT_STATE.md` when the product changes;
- update SEO, Knowledge Center, competitor, research, brand, or growth records when relevant;
- report exactly which Pomante OS documents changed at completion.

## Knowledge ownership

- Store each fact in one canonical file and link to it elsewhere.
- Keep `PROJECT_STATE.md` concise and current.
- Keep `DECISIONS.md` append-only; supersede entries, never rewrite history.
- Keep `MASTER_TASKS.md` as the high-level execution ledger.
- Keep `ACTIVE_SPRINT.md` limited to current work.
- Keep `DONE.md` as a concise completion index.
- Keep `CHANGELOG.md` about Pomante OS changes, not application releases.
- Do not present assumptions or unverified research as facts.

## Git and user-change safety

- Preserve all existing tracked and untracked user changes.
- Never use `git stash`, `git reset`, `git clean`, force checkout, or force push.
- Do not use `git add .`; stage only explicitly reviewed files.
- Do not overwrite or stage unrelated work.
- Inspect `git status --short` before and after changes.
