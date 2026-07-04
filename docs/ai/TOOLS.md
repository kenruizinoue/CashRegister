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

## Ticket 4 - Minimum change calculation (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: TDD implementation of currency tables and greedy minimum change, including the human-requested euro configurability test.

## Ticket 5 - Random change policy (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: TDD implementation of strategy selection and the random change strategy, using injected fake random sources to prove selection behavior deterministically.

## Ticket 6 - Single-record processor and formatting (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: TDD implementation of change-line formatting and the single-transaction processor, with a hand-recomputed correction to one AI-drafted expected value.

## Ticket 7 - Text and file processor (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: TDD implementation of multi-line text processing with per-line error continuation and the file round-trip wrapper.

## Ticket 8 - CLI wrapper (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: TDD implementation of the argparse CLI adapter and console script registration, plus a scripted manual verification of both entry points against the README sample.
