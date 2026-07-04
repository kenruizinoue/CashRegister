# AI Decision Log

Marks where AI output was used directly, where it was modified and why, and where it was rejected and why. Entries are appended in the same turn the work happens; gaps are flagged, never backfilled.

## Ticket 1 - Project setup and smoke test (2026-07-03)

- AI (Claude Code) generated pyproject.toml, .gitignore, the src/cash_register package skeleton, and tests/test_smoke.py. Used directly, no manual modification.
- AI decision, accepted without change: defer the [project.scripts] console entry to Ticket 8 so the installed script never references a cli module that does not exist yet.

## Restructure - move Python project into backend/ (2026-07-03)

- Human decision: keep each platform in a dedicated folder because a React project is coming later. AI executed the move (git mv of pyproject.toml, src/, tests/ into backend/), chose the folder name backend/ to pair with the frontend/ folder the ts-react-vite standard already uses, and updated path references in docs/PROJECT_PLAN.md and CLAUDE.md.

## Correction - commit policy (2026-07-03)

- Human rejected AI behavior: AI treated invoking Prompt 4 as approval to commit and committed Ticket 1 plus the restructure on its own. Human requires explicit approval per commit. Both commits were reverted with git reset --soft (work kept in the working tree) and CLAUDE.md now states the rule.
