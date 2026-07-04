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

## Extension - USD bills (2026-07-03)

- Tests: TDD red-green observed (exactly the 5 new bill tests failed, then 381 passed total); `ruff check .` clean. The 260-case seed sweep and byte-for-byte README assertions passed unchanged, confirming bills do not disturb amounts under five dollars.
- Edge cases exercised: minimum change spanning every bill in one amount (186.75), large amount preferring bills (1234.56), random strategy returning only hundred dollar bills via a largest-picking fake, the random path through make_change returning a bill, bill singular vs plural formatting.

## Phase 1 audit (2026-07-03)

- Tests: 12 audit tests written first; 7 failed exposing the three real bugs, all green after the fixes (393 passed total); `ruff check .` clean; manual CLI run against the README sample re-verified, random line summing to 167.
- Edge cases added: Arabic-Indic and fullwidth digit rejection, non-UTF-8 input file exiting 1 with a clear message, directory as input path exiting 1, negative amounts rejected by both strategies, zero owed with zero paid producing no change, zero owed with payment, custom currency through make_change on both the minimum and random paths.

## Ticket 9 - API dependency and app smoke test (2026-07-03)

- Tests: TDD red-green observed (collection error before api.py existed, then 394 passed); `ruff check .` clean; `pip install -e ".[api,dev]"` succeeded; deprecation warning eliminated by moving to httpx2.
- Lightweight-core check: AST scan proves no core module imports any api-extra package; API tests skip cleanly when fastapi is absent.
- Edge cases: none, wiring-only ticket.

## Ticket 10 - Extend CI for API tests (2026-07-03)

- Tests: local run with the api extra installed shows 394 passed with zero skips, matching what CI will now execute; CI greenness on main to be confirmed on the next approved push.
- Edge cases: none, CI wiring.

## Ticket 11 - Request and response models (2026-07-03)

- Tests: TDD red-green observed (collection error before the models existed, then 407 passed total, 13 new); `ruff check .` clean.
- Edge cases exercised: defaults applied on minimal payload, empty lines list, missing lines field, wrong element types, unknown fields forbidden, unknown currency, divisor 0, oversized payload (1001 lines), ok and error line results, unknown status literal, envelope construction.

## Ticket 12 - Change endpoint delegating to core (2026-07-03)

- Tests: TDD red-green observed (12 endpoint tests failing with 404s before the route existed, then 420 passed total, 13 new); `ruff check .` clean.
- Edge cases exercised: README batch with seeded random third line summing to 167, single line, 100 lines keeping order and numbering, endpoint-equals-core equality under the same seed, same-seed response identity, custom divisor forcing minimum, six invalid shapes each 422 before any core call, OpenAPI components present.

## Ticket 13 - Structured error output (2026-07-03)

- Tests: 6 new tests, all green on first run (426 passed total); `ruff check .` clean. No red phase: Ticket 12's seam already implemented the behavior, so these are contract-locking regression tests.
- Edge cases exercised: mixed batch with parse and underpayment failures continuing processing, all-lines-invalid batch returning 200 with specific messages, blank and whitespace-only lines as explicit error entries, ok/error field exclusivity (change xor error), shape problems staying 422.

## Ticket 14 - Config and mode selection (2026-07-03)

- Tests: TDD red-green observed (collection error on the missing EUR/CURRENCIES imports, then 431 passed total, 5 new); `ruff check .` clean after the F811 shadow fix.
- Human addition, euro banknotes: TDD red-green observed (exactly the 2 new note tests failed, then 433 passed total); minimum change spanning all five notes plus four coins in one amount, random strategy returning three hundred-euro notes via the largest-picking fake.
- Edge cases exercised: EUR minimum change spanning all seven coin values through the endpoint, EUR random line parsed back and summing to exactly 167 with EUR names, negative divisor 422, currency registry identity, shipped EUR table breakdown at core level. Unknown currency and divisor 0 were already covered in Ticket 11 tests.

## Ticket 15 - API run docs (2026-07-03)

- Verification: documented commands executed exactly as written before documenting them; uvicorn served, /health returned ok, the README example curl returned the response now shown in the README (seed 42, third line summing to 167). No automated tests, docs ticket.

## Phase 2 audit (2026-07-03)

- Tests: 11 audit tests, all green on first run (444 passed total); `ruff check .` clean; live uvicorn run of the README example verified earlier the same day at human request.
- Post-audit human-directed addition, CLI --currency: TDD red-green (EUR run failed on the unrecognized argument, then 447 passed total, 3 new); manual cash-register run with --currency EUR produced the correct seven-coin breakdown for 2.88 change.
- Edge cases added: batch of exactly 1000 accepted and 1001 rejected at the endpoint, explicit null seed, string and fractional seeds 422, non-JSON body 422, GET on /change 405, Unicode-digit line and embedded-newline line as per-line error entries, padded line ok, divisor 1 with seed deterministic.

## Ticket 16 - Vite setup and smoke render test (2026-07-03)

- Tests: `npm test` (1 smoke render test passed under jsdom), `npm run lint` (eslint clean), `npm run build` (tsc -b + vite build succeeded after removing the deprecated baseUrl). Dev server booted and served the app shell, then stopped.
- Edge cases: none, wiring-only ticket.

## Ticket 17 - Frontend CI workflow (2026-07-03)

- Tests: the exact CI sequence executed locally (npm ci clean install from the lockfile, lint clean, 1 test passed, build succeeded); workflow YAML parsed and hygiene fields asserted programmatically.
- Confirmed: first Frontend CI run on origin main (commit d5d4d9e) completed with conclusion success, alongside a green Backend CI on the same commit.
- Edge cases: none, CI wiring.

## Ticket 18 - Domain types and gateway interface (2026-07-03)

- Tests: TDD red-green observed (module-not-found failure, then 4 passed across 2 files); `npm run lint` clean; `npm run build` typechecks the types under strict noUnused rules.
- Edge cases: types-only ticket; contract exercised via a fake gateway implementation, an error entry literal, and the GatewayError class.

## Ticket 19 - HTTP API adapter (2026-07-03)

- Tests: TDD red-green observed (module-not-found failure, then 12 passed across 3 files, 8 new); `npm run lint` clean; `npm run build` typechecks. All adapter tests run against stubbed fetch, no backend involved.
- Edge cases exercised: happy-path envelope mapping including a per-line error entry, config omitted entirely, full config with null seed omitted from the body, base url prefixing, HTTP 422 as GatewayError with status, JSON parse failure, envelope missing the results array, network-level fetch rejection.
- Human-requested strengthening, per-entry validation: 8 more red-first cases (null entry, non-object entry, unknown status, string line_number, missing input, numeric change, object error field, missing status), all GatewayError after the type-guard fix; 20 frontend tests total.

## Ticket 20 - Main screen with injected gateway (2026-07-03)

- Tests: TDD red-green observed (module-not-found failure, then 27 passed across 4 files, 7 new); `npm run lint` clean; `npm run build` typechecks. All screen tests use a fake gateway; no network involved.
- Edge cases exercised: README paste renders all three change lines and the gateway receives exactly the split lines, per-line error row rendered with error styling next to an ok row, submit disabled for empty and whitespace-only input and re-enabled with content, blank lines and padding stripped before the gateway call, 500-line input rendering 500 result rows, gateway rejection surfacing as a role=alert message, file pick filling the textarea.

## Ticket 21 - Workflow hooks (2026-07-03)

- Tests: TDD red-green observed (module-not-found failure, then 35 passed across 5 files, 8 new hook tests); `npm run lint` clean; `npm run build` typechecks; the 7 pre-existing screen tests passed unchanged after the screen refactor.
- Edge cases exercised: initial idle state, success path with trimmed lines, no-op submit on blank input, in-flight submitting flag via a deferred promise, double submit ignored while in flight (gateway called once), mid-flight rejection surfacing failure and clearing results, success clearing a previous failure, non-gateway exception mapped to a generic message.

## Ticket 22 - Utility functions (2026-07-03)

- Tests: TDD red-green observed (two module-not-found failures, then 45 passed across 7 files, 10 new); `npm run lint` clean; `npm run build` typechecks; hook and screen suites passed unchanged after the refactor.
- Edge cases exercised: blank and whitespace-only lines, tab-only lines, empty input, CRLF endings, padding trim, order preservation, ok/error display selection, null change and null error degrading to empty strings.

## Ticket 23 - UI and features implementation (2026-07-03)

- Tests: TDD red-green observed (9 test files failing before implementation, then 104 passed across 13 files, 59 new); one genuine mid-implementation catch: the paid-total output element's implicit status role collided with the snackbar and was caught by the accumulation test; `npm run lint` clean; `npm run build` typechecks. Live boot of backend plus frontend confirmed the page serves and a proxy submit returns correct change; servers stopped after.
- Refinement (2026-07-04): overpayment notice tested red-first; exceeding payment appends the notice, no owed set stays plain.
- Refinement (2026-07-04): payment lock integration test red-first exactly as specified by the human (300.10 owed, 4x $100 accepted to 400, 5th click dead, 1 cent also locked, Clear Paid unlocks); exact-coverage case locks with a plain notice; 108 frontend tests total.
- Edge cases exercised: paid accumulation across bills and coins, invalid owed format, underpayment guard, empty owed without noise, clear paid reset, injected owed generation, sample preload and restore, empty flat file disabling submit, per-line error rows as Line N: message, gateway failure alert inside the output region, no-change rows without tokens, unknown denomination names skipped, snackbar timing including unmount cleanup, random owed always parseable across 20 sampled values.

## Ticket 24 - UX and responsive polish (2026-07-04)

- Tests: no behavior changes, so the check is that all 108 existing tests, lint, and build stay green (they do) plus mechanical rule checks: no inline style props, no fetch outside adapters.
- Visual: dev servers were already running with HMR; desktop no-page-scroll layout and narrow-viewport stacking are CSS-asserted (100vh + internal panel scroll, single-column media query) and pending the human's eyeball pass in the live app.

## Ticket 25 - E2E with Playwright (2026-07-04)

- Tests: 3 Playwright specs passing in real Chromium against the Vite dev server on the dedicated port (flat file sample workflow with token assertions, cashier tap-pay-calculate, per-line error rows); one strict-mode locator failure caught and fixed during the first run. Unit suite (108), lint, and build re-verified green alongside.
- Audit additions (2026-07-04, human directed): backend unreachable via aborted route showing the failure alert, snackbar notice appearing and auto-dismissing in real time, output persisting across tab switches; 6 e2e specs passing.
- CI: e2e job added to the frontend workflow; confirmed green on origin main (commit b0b2b79), Frontend CI now running lint, unit tests, build, and the Playwright e2e job.

## Phase 3 audit (2026-07-04)

- Tests: 4 audit tests added (112 unit tests total), all green on first run; 6 e2e specs, lint, and build re-verified green for the phase close.
- Edge cases added: rapid tap notice replacement (single status element showing the latest), lock on owed entered after covering payment without a stray validation message, unlock plus underpayment message when owed rises above paid, owed exactly zero locking the grid while keeping calculate enabled and submitting 0,0.00 rendering no change.

## Restructure - move Python project into backend/ (2026-07-03)

- Tests: recreated .venv inside backend/ (editable installs are path-dependent), reran `pip install -e ".[dev]"`, `pytest` (1 passed), `ruff check .` (clean) from backend/.
