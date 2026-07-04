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

## Extension - USD bills (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: TDD extension of the USD table with banknotes at human direction, proving bill coverage in both strategies with fake random sources.

## Phase 1 audit (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: adversarial self-audit of Phase 1 per Prompt 5; gap enumeration, tests-before-fixes, three bug fixes, full re-verification.

## Ticket 9 - API dependency and app smoke test (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: FastAPI wiring (api extra, app module, health route, TestClient smoke test) and resolution of the httpx-to-httpx2 TestClient deprecation.

## Ticket 10 - Extend CI for API tests (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: CI install step extended to the api extra so API tests execute in CI.

## Ticket 11 - Request and response models (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: TDD pydantic request/response model design with strict validation (forbidden extras, size caps, literal enums).

## Ticket 12 - Change endpoint delegating to core (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: TDD implementation of the POST /change handler as a pure adapter, with an endpoint-equals-core equality test.

## Ticket 13 - Structured error output (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: contract-locking tests for the structured per-line error envelope and the 200-vs-422 boundary.

## Ticket 14 - Config and mode selection (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: TDD shipping of the EUR currency, registry lookup, and end-to-end currency selection through the API.

## Ticket 15 - API run docs (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: README API run section, written from a live verified run of the documented commands.

## Phase 2 audit (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: adversarial audit of the API surface per Prompt 5; boundary, transport, and hostile-content tests, no defects found.

## Ticket 16 - Vite setup and smoke render test (2026-07-03)

- Tool: Claude Code (Claude Fable 5), plus create-vite for the initial scaffold.
- Task: frontend scaffold reworked to the standard (ESLint over template oxlint, vitest wiring, alias, proxy, minimal app shell with smoke test).

## Ticket 17 - Frontend CI workflow (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: frontend GitHub Actions workflow, verified by running the identical command sequence locally and asserting the YAML structure.

## Ticket 18 - Domain types and gateway interface (2026-07-03)

- Tool: Claude Code (Claude Fable 5).
- Task: TDD frontend domain layer (types mirroring the API contract, ChangeGateway interface, typed GatewayError).
