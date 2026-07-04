# Verification Log

How AI-generated pieces were confirmed to work: tests used and edge cases exercised, recorded when the checks actually ran.

## Ticket 1 - Project setup and smoke test (2026-07-03)

- Tests: `pip install -e ".[dev]"` succeeded in a fresh .venv (Python 3.14.6); `pytest` ran the smoke test, 1 passed; `ruff check .` reported no issues.
- Edge cases: none, wiring-only ticket per standards/base-sdlc.md TDD rules.

## Ticket 2 - Python CI workflow (2026-07-03)

- Tests: workflow YAML parsed and asserted locally (permissions contents read, concurrency cancel-in-progress, timeout-minutes 10, working-directory backend, install/lint/test steps present). The commands CI runs (pip install -e ".[dev]", ruff check ., pytest) are the same ones passing locally.
- Confirmed: first Backend CI run on origin main (commit b2b7173) completed with conclusion success.
- Edge cases: none, wiring-only ticket.

## Ticket 3 - Money parsing and validation (2026-07-03)

- Tests: TDD red-green observed (ModuleNotFoundError before implementation, then 41 passed including smoke); `ruff check .` clean.
- Edge cases exercised: missing comma, multiple commas, empty line, empty fields, non-numeric text, negative amounts, more than 2 decimal places, bare dot forms (`1.`, `.5`), scientific notation, NaN, Infinity, plus sign, embedded space, currency symbol, surrounding whitespace, zero amounts, large amounts.

## Restructure - move Python project into backend/ (2026-07-03)

- Tests: recreated .venv inside backend/ (editable installs are path-dependent), reran `pip install -e ".[dev]"`, `pytest` (1 passed), `ruff check .` (clean) from backend/.
