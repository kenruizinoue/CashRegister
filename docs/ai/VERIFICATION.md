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

## Ticket 6 - Single-record processor and formatting (2026-07-03)

- Tests: TDD red-green observed (collection error before implementation, then 353 passed total, 13 new); `ruff check .` clean.
- Edge cases exercised: README sample strings byte for byte, singular vs plural including 1 nickel and pennies irregular plural, all five denominations at once, single denomination, empty counts rendering "no change" for both divisible and non-divisible owed, unsorted counts rendered largest-first, random sample parsed back and summed to exactly 167, custom policy honored, underpayment propagation.

## Ticket 7 - Text and file processor (2026-07-03)

- Tests: TDD red observed (collection error), then one genuine red-green iteration: a wrong AI-drafted expectation surfaced on the first run and was corrected, ending at 368 passed total (15 new); `ruff check .` clean. File tests use pytest tmp_path temp files.
- Human-requested strengthening: the README sample test now parses the random third output line back into cents and asserts it sums to exactly 167, instead of only asserting non-emptiness.
- Edge cases exercised: README three-line sample, blank and whitespace-only lines skipped, CRLF input, invalid middle line continuing processing, empty text, only-blank-lines text, seeded determinism across full runs, per-line policy application, file round-trip with trailing newline, empty input file producing empty output file, mixed file with parse and underpayment errors.

## Ticket 8 - CLI wrapper (2026-07-03)

- Tests: TDD red-green observed (collection error before implementation, then 377 passed total, 9 new); `ruff check .` clean after reinstalling the package to register the console script.
- Edge cases exercised: happy path exit code and output, seeded reproducibility across runs, divisor flag forcing the minimum strategy on the README random line, per-line error lines with exit code 0, missing input file (exit 1, stderr message), unwritable output path (exit 1), divisor 0 (exit 2), missing args (argparse exit 2), python -m subprocess entry.
- Manual primary workflow check: ran both `python -m cash_register.cli` and the installed `cash-register` script against the README sample file; deterministic lines matched the README byte for byte and two independent random third lines each summed to exactly 167 cents; missing-input run printed a clear error and exited 1.

## Restructure - move Python project into backend/ (2026-07-03)

- Tests: recreated .venv inside backend/ (editable installs are path-dependent), reran `pip install -e ".[dev]"`, `pytest` (1 passed), `ruff check .` (clean) from backend/.
