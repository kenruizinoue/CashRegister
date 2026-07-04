# Project Plan: Cash Register

## Goal and Expected Behavior

Build the Creative Cash Draw Solutions change calculator (README.md): read a flat file where each line is `owed,paid`, output one line of change denominations per input line, formatted like `1 dollar,2 quarters,1 nickel`. Minimum physical change by default; when the owed amount (in cents) is divisible by 3, denominations are chosen randomly but still sum exactly to the change. Deliver as a Python core + CLI (Phase 1), a FastAPI adapter (Phase 2), and a React + Vite frontend (Phase 3). Business logic lives only in the Python core; CLI, API, and UI are thin adapters.

Confirmed decisions: integer-cents arithmetic (never floats), divisibility checked on owed cents, USD set penny/nickel/dime/quarter/dollar plus five/ten/twenty/fifty/hundred dollar bills in a configurable currency table (France hint), configurable divisor (default 3), injectable random source, per-line errors keep processing, `no change` for exact payment, blank input lines skipped, output always rendered largest to smallest, per-denomination singular/plural names.

Process rule: every ticket appends its entries to docs/ai/DECISION_LOG.md, docs/ai/VERIFICATION.md, and docs/ai/TOOLS.md in the same turn the work happens (see CLAUDE.md).

Ticket status legend: `[ ]` pending, `[x]` done.

## Phase 1: Python Core + CLI `[DONE]`

Closed by Prompt 5 audit on 2026-07-03: three real gaps found and fixed (non-ASCII digits passing the amount regex, CLI crash on non-UTF-8 input, missing negative-amount guards in both strategies), 12 audit tests added, 393 tests green, CI green.

Standards: standards/base-sdlc.md + standards/python-cli.md. Lives in backend/ (the React app lives in frontend/ later). Package `cash_register`, src/ layout, console script `cash-register`.

### Ticket 1 - Project setup and smoke test `[x]`

Objective:

- Create pyproject.toml (dev extra: pytest, ruff), src/cash_register/ package skeleton, .gitignore (.venv, artifacts), pytest config (testpaths, pythonpath=src, addopts=-ra), ruff line-length 100.

TDD work:

- tests/test_smoke.py: import the package and assert a trivial truth.

Edge cases:

- None (wiring only).

Acceptance criteria:

- `pip install -e ".[dev]"` succeeds; `pytest` passes the smoke test; `ruff check .` is clean.

### Ticket 2 - Python CI workflow `[x]`

Objective:

- GitHub Actions workflow running ruff and pytest on every push and PR to main, with `permissions: contents: read`, concurrency group with cancel-in-progress, `timeout-minutes`, and pip caching.

TDD work:

- None (CI wiring); the workflow runs the existing suite.

Edge cases:

- None.

Acceptance criteria:

- Workflow file exists and is green on main after push.

### Ticket 3 - Money parsing and validation `[x]`

Objective:

- Parse one input line `owed,paid` into integer cents using Decimal, plus a domain error type for invalid lines.

TDD work:

- Failing tests first for valid parses (`2.13,3.00`, `3,5`, `0.05,1`) and each invalid case raising the domain error with a clear message.

Edge cases:

- Missing comma, more than one comma, non-numeric fields, negative amounts, more than 2 decimal places, empty fields, surrounding whitespace, zero amounts.

Acceptance criteria:

- Parser returns exact cents for valid lines; every invalid case raises the domain error; no float appears anywhere in the code path.

### Ticket 4 - Minimum change calculation `[x]`

Objective:

- Core function computing minimum physical change in cents over a currency table (USD default: dollar 100, quarter 25, dime 10, nickel 5, penny 1), returning denomination counts.

TDD work:

- Failing tests first: README samples (2.12/3.00 and 1.97/2.00), exact payment returns empty counts, paid < owed raises the domain error.

Edge cases:

- Paid < owed, paid == owed, change of 1 cent, change requiring only dollars, large change amounts.

Acceptance criteria:

- Counts are minimal for USD, sum of counts times values equals change exactly, domain error on underpayment.

### Ticket 5 - Random change policy `[x]`

Objective:

- Policy layer choosing between minimum and random strategies: when owed cents divisible by the configured divisor (default 3), produce random denomination counts that still sum exactly to the change. Random source injectable; policy selection an extension point for future special cases.

TDD work:

- Failing tests first with a seeded/fake random source: divisible owed triggers random strategy, non-divisible uses minimum, random result always sums exactly, divisor configurable.

Edge cases:

- Owed divisible but change is 0, change of 1 cent (only pennies possible), divisor of 1 (always random), seeded runs are reproducible.

Acceptance criteria:

- Strategy selection matches the divisor rule on owed cents; every random result sums exactly to the change; tests are deterministic via the injected source.

### Ticket 6 - Single-record processor and formatting `[x]`

Objective:

- Process one parsed transaction into the output string: counts rendered largest to smallest, `N name` with per-denomination singular/plural (penny/pennies), zero counts omitted, `no change` when change is zero.

TDD work:

- Failing tests first: README sample strings byte for byte, singular vs plural, `no change`.

Edge cases:

- Single denomination output, all denominations present, zero change.

Acceptance criteria:

- Output strings match the README format exactly, including comma separation without trailing separators.

### Ticket 7 - Text and file processor `[x]`

Objective:

- Process multi-line text: one output line per non-blank input line, per-line error strings in a consistent format when a line is invalid, processing continues. File-to-file wrapper around the text processor.

TDD work:

- Failing tests first: multi-line happy path, blank lines skipped, invalid middle line yields an error line while others succeed, file round-trip using temp files.

Edge cases:

- Empty file, file of only blank lines, trailing newline handling, mixed valid and invalid lines.

Acceptance criteria:

- Line N of output corresponds to non-blank line N of input; error lines are deterministic and clearly marked; file output is deterministic given a seeded random source.

### Ticket 8 - CLI wrapper `[x]`

Objective:

- Thin CLI: parse `input_path output_path` args (optional flags for divisor and seed), call the processor, write the output file, exit non-zero with a clear message on unusable input (missing file, unwritable output). Console script `cash-register` registered.

TDD work:

- Failing tests first: CLI happy path with temp files, missing input file error, exit codes.

Edge cases:

- Missing args, nonexistent input path, output path in nonexistent directory.

Acceptance criteria:

- `python -m cash_register.cli input.txt output.txt` and `cash-register input.txt output.txt` both work; CLI contains no business logic.

Phase 1 verification commands:

```bash
cd backend
pip install -e ".[dev]"
ruff check .
pytest
python -m cash_register.cli sample_input.txt output.txt
```

Phase 1 closes via Prompt 5 audit (edge case sweep, fixes, commit, mark phase done).

## Phase 2: FastAPI Adapter `[DONE]`

Closed by Prompt 5 audit on 2026-07-03: 11 audit tests added covering batch-cap boundaries, seed edge shapes, transport-level errors, hostile line content, and always-random mode; none exposed a defect (the handler delegates to the already-audited core). 444 tests green, CI green. The CLI currency parity limitation flagged by the audit was then implemented at human direction (--currency USD|EUR, 447 tests green).

Standards: standards/base-sdlc.md + standards/python-fastapi.md. API deps behind an `api` extra; FastAPI delegates to the Phase 1 core.

### Ticket 9 - API dependency and app smoke test `[x]`

Objective:

- Add `api` extra (fastapi, uvicorn, httpx for tests), create the FastAPI app module with a health route.

TDD work:

- tests/test_api.py: TestClient smoke test hitting the health route.

Edge cases:

- None (wiring only).

Acceptance criteria:

- `pip install -e ".[api,dev]"` succeeds; smoke test passes; core install without the extra stays lightweight.

### Ticket 10 - Extend CI for API tests `[x]`

Objective:

- Python CI job installs `.[api,dev]` and runs the full suite including API tests.

TDD work:

- None (CI wiring).

Edge cases:

- None.

Acceptance criteria:

- CI green on main with API tests included.

### Ticket 11 - Request and response models `[x]`

Objective:

- Pydantic models: request carrying transaction lines (and optional config), response carrying per-line results; explicit validation for enum-like mode fields.

TDD work:

- Failing tests first: model validation accepts good payloads, rejects bad shapes (wrong types, empty list, unknown mode).

Edge cases:

- Empty lines list, oversized payloads, unknown fields.

Acceptance criteria:

- Invalid shapes rejected with 422 before any core call; models documented in the OpenAPI schema.

### Ticket 12 - Change endpoint delegating to core `[x]`

Objective:

- POST endpoint that translates the request into core calls and returns per-line results; no domain math in the handler.

TDD work:

- Failing tests first: README samples through the endpoint, seeded random config for determinism.

Edge cases:

- Single line, many lines, divisible-by-3 line.

Acceptance criteria:

- Endpoint results equal core processor results for the same input; handler only validates, configures, delegates, translates.

### Ticket 13 - Structured error output `[x]`

Objective:

- Per-line domain failures returned as structured entries (line number, input, error message) inside a result envelope while valid lines still succeed; request-shape problems stay 4xx.

TDD work:

- Failing tests first: mixed valid/invalid lines yield per-line statuses; fully invalid request yields 4xx.

Edge cases:

- All lines invalid, blank lines in payload, underpayment lines.

Acceptance criteria:

- Clients can tell exactly which line failed and why; envelope shape covered by tests.

### Ticket 14 - Config and mode selection `[x]`

Objective:

- Request-level options mapped to core config: divisor, currency/locale selection, optional seed for reproducible random output; invalid config rejected explicitly.

TDD work:

- Failing tests first: custom divisor changes strategy selection, invalid divisor rejected, seed reproducibility, currency selection changes denominations.

Edge cases:

- Divisor 0 or negative, unknown currency code.

Acceptance criteria:

- Config options exercised end to end through the endpoint; invalid config never reaches the core.

### Ticket 15 - API run docs `[x]`

Objective:

- README section: install with the api extra, run uvicorn, example curl request and response.

TDD work:

- None (docs).

Edge cases:

- None.

Acceptance criteria:

- A fresh reader can start the API and get a correct response following only the README.

Phase 2 verification commands:

```bash
cd backend
pip install -e ".[api,dev]"
pytest
uvicorn cash_register.api:app --reload
```

Phase 2 closes via Prompt 5 audit.

## Phase 3: React + Vite Frontend

Standards: standards/base-sdlc.md + standards/ts-react-vite.md. `frontend/` directory, Vitest + Testing Library from the first ticket, gateway injected into screens, single styles.css (small console tool).

### Ticket 16 - Vite setup and smoke render test `[x]`

Objective:

- Scaffold React + TypeScript + Vite in frontend/ with Vitest + Testing Library (jsdom, globals, jest-dom setup file, cleanup), ESLint flat config, `@/` alias, scripts (dev, build, preview, test, test:watch, lint), .env.example, Vite proxy to the local API.

TDD work:

- Smoke test: App renders without crashing.

Edge cases:

- None (wiring only).

Acceptance criteria:

- `npm test`, `npm run build`, `npm run lint` all pass in frontend/.

### Ticket 17 - Frontend CI workflow `[x]`

Objective:

- Separate CI job/workflow: npm ci, lint, test, build on push and PR to main, with the same workflow hygiene as Phase 1 plus npm caching.

TDD work:

- None (CI wiring).

Edge cases:

- None.

Acceptance criteria:

- Frontend CI green on main.

### Ticket 18 - Domain types and gateway interface `[x]`

Objective:

- src/domain/: transaction, result, per-line error, and config types mirroring the API contract; ChangeGateway interface for submitting lines and receiving results.

TDD work:

- Type-level compile coverage via usage in a trivial unit test.

Edge cases:

- None (types only).

Acceptance criteria:

- No screen or hook imports fetch or adapter internals; they depend on the gateway interface.

### Ticket 19 - HTTP API adapter `[x]`

Objective:

- src/adapters/: gateway implementation calling the FastAPI endpoint, translating envelope and errors into domain types.

TDD work:

- Failing tests first with mocked fetch: happy path, per-line errors surfaced, network failure translated.

Edge cases:

- Non-200 responses, malformed JSON, timeout/network error.

Acceptance criteria:

- Adapter fully tested without a running backend; no domain math in the adapter.

### Ticket 20 - Main screen with injected gateway `[ ]`

Objective:

- The usable app as the first screen: textarea for `owed,paid` lines (and file pick that fills it), submit, results rendered as a per-line list/table including per-line errors. Gateway injected so tests use a fake.

TDD work:

- Failing screen tests first with a fake gateway: submit renders results, per-line error rows shown.

Edge cases:

- Empty input submit guarded, very long input.

Acceptance criteria:

- A user can paste README sample input and read correct change lines; screen tests pass with the fake gateway; no fetch in the screen.

### Ticket 21 - Workflow hooks `[ ]`

Objective:

- src/hooks/: extract the submit workflow state (input, submitting, results, error) from the screen into a tested hook.

TDD work:

- Failing hook tests first: state transitions for success and failure.

Edge cases:

- Double submit, gateway rejection mid-flight.

Acceptance criteria:

- Screen becomes composition only; hook covered by tests.

### Ticket 22 - Utility functions `[ ]`

Objective:

- src/utils/: pure helpers (input line splitting/trimming, result formatting for display) with unit tests.

TDD work:

- Failing unit tests first per helper.

Edge cases:

- Blank lines, whitespace-only input, CRLF line endings.

Acceptance criteria:

- Helpers pure and fully unit tested; screens/hooks use them instead of inline logic.

### Ticket 23 - UI and features implementation `[ ]`

Objective:

- Implement the app UI and its features. The concrete feature requirements are provided by the user as input when this ticket is invoked; scope, TDD cases, and acceptance criteria are refined then, before implementation starts.

TDD work:

- Failing screen/unit tests first for each feature in the provided requirements.

Edge cases:

- Defined per feature when the requirements are provided.

Acceptance criteria:

- Every provided feature requirement covered by tests and implemented; boundary rules of standards/ts-react-vite.md hold.

### Ticket 24 - UX and responsive polish `[ ]`

Objective:

- Quiet, dense, scannable console layout: tabs/inputs/buttons per the UI rules, shared components extracted for any repeated UI (single denomination-list component), scoped CSS per component, no inline styles, no text overlap, no unwanted page scroll on desktop.

TDD work:

- Adjust existing tests as markup settles; add tests only for behavior changes.

Edge cases:

- Narrow viewport, long result lines.

Acceptance criteria:

- UI rules of standards/ts-react-vite.md hold; all tests and build pass.

### Ticket 25 - E2E with Playwright (approval-gated) `[ ]`

Objective:

- Planned only: Playwright config (testDir e2e, retries 1, webServer with reuseExistingServer on a dedicated port), core workflow spec (paste input, submit, read results) with the API mocked at the network layer; add e2e job to frontend CI.

TDD work:

- E2E spec for the primary workflow; backend correctness stays proven by backend tests.

Edge cases:

- Per-line error row rendering in the browser.

Acceptance criteria:

- Implemented only after explicit approval via Prompt 6; then `npm run e2e` passes locally and in CI.

Phase 3 verification commands:

```bash
cd frontend
npm test
npm run lint
npm run build
npm run e2e # only after Ticket 25 is approved and implemented
```

Phase 3 closes via Prompt 5 audit.

## Cross-Phase Finalization

After all phases close: Prompt 7 (README, docs/ARCHITECTURE.md, complete docs/ai/ deliverables with self-critique scaffolded as TODOs), Prompt 8 (final audit: all suites, lint, builds, approved E2E, repo review against standards and requirement), Prompt 9 (push and deliver via pull request per README).
