# AI Tools and Task Mapping

How AI was deployed across the problem and which tool handled each task. Appended as tasks complete.

## Bootstrap and planning (2026-07-03)

- Tool: Claude Code (Claude Fable 5), interactive terminal session driven by the numbered prompt flow in prompts/prompts.md.
- Tasks: requirement analysis and ambiguity resolution proposals (Prompt 2), CLAUDE.md authoring, docs/PROJECT_PLAN.md ticket planning (Prompt 3). Human confirmed assumptions and edited plan scope (replaced the loading/error-states ticket with a user-specified UI features ticket).

## Ticket 1 - Project setup and smoke test (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: Python project scaffolding (pyproject, src layout, pytest and ruff wiring, smoke test), executed and verified by the same session per Prompt 4 TDD flow.

## Ticket 2 - Python CI workflow (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: GitHub Actions workflow authoring plus local YAML structural validation before any push.

## Ticket 3 - Money parsing and validation (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: TDD implementation of the input parser (failing tests written and observed red first, then domain types and parser implementation, then green run and lint).
