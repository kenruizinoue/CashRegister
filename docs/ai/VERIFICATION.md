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

## Ticket 4 - Minimum change calculation (2026-07-03)

- Tests: TDD red-green observed (collection error before implementation, then 65 passed total, 24 new); `ruff check .` clean.
- Edge cases exercised: both README samples, exact payment (empty result), underpayment (domain error with message), 1 cent change, dollars-only change, large amounts, exact-sum property across 8 amounts, largest-first ordering, euro table end to end, unsorted table normalization, invalid tables (empty, duplicate values, non-positive value, missing 1-unit).

## Ticket 5 - Random change policy (2026-07-03)

- Tests: TDD red-green observed (collection error before implementation, then 86 passed total, 21 new); `ruff check .` clean. Determinism via injected fakes (smallest-picking rng, rng that raises if the minimum path consults it) and seeded random.Random.
- Human-requested addition: exact-sum property matrix over every combination of 20 seeds and 13 amounts (260 cases), also asserting no zero counts leak into results. The narrower single-seed exact-sum test was then removed as redundant at human direction; suite stands at 340 tests, all passing.
- Edge cases exercised: README random sample (3.33,5.00 sums to 167), zero change under a divisible owed, 1 cent change, seeded reproducibility, largest-first ordering of random results, custom divisor selecting and not selecting random, divisor 1 always random, divisor 0 and negative rejected, underpayment propagation through make_change.

## Restructure - move Python project into backend/ (2026-07-03)

- Tests: recreated .venv inside backend/ (editable installs are path-dependent), reran `pip install -e ".[dev]"`, `pytest` (1 passed), `ruff check .` (clean) from backend/.
