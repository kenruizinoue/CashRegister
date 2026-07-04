# AI Decision Log

Marks where AI output was used directly, where it was modified and why, and where it was rejected and why. Entries are appended in the same turn the work happens; gaps are flagged, never backfilled.

## Ticket 1 - Project setup and smoke test (2026-07-03)

- AI (Claude Code) generated pyproject.toml, .gitignore, the src/cash_register package skeleton, and tests/test_smoke.py. Used directly, no manual modification.
- AI decision, accepted without change: defer the [project.scripts] console entry to Ticket 8 so the installed script never references a cli module that does not exist yet.

## Restructure - move Python project into backend/ (2026-07-03)

- Human decision: keep each platform in a dedicated folder because a React project is coming later. AI executed the move (git mv of pyproject.toml, src/, tests/ into backend/), chose the folder name backend/ to pair with the frontend/ folder the ts-react-vite standard already uses, and updated path references in docs/PROJECT_PLAN.md and CLAUDE.md.

## Ticket 2 - Python CI workflow (2026-07-03)

- AI (Claude Code) generated .github/workflows/backend-ci.yml. Used directly, no manual modification.
- AI decisions, accepted without change: CI pins Python 3.12 (oldest widely-deployed version above the package floor of 3.11, catches accidental use of newer syntax since local dev runs 3.14); job scoped to backend/ via working-directory so the future frontend workflow stays independent; no paths filter so the check always reports on main.

## Ticket 3 - Money parsing and validation (2026-07-03)

- AI (Claude Code) generated tests/test_parser.py, src/cash_register/domain.py, and src/cash_register/parser.py. Used directly except one AI self-correction before the first run: the "," test case was initially asserted as a field-count error, but "," splits into two empty fields, so it was moved to the bad-amount cases.
- AI decisions, accepted without change: strict regex validation (digits with at most 2 decimals) instead of accepting everything Decimal parses, so signs, exponents (1e2), NaN/Infinity, and currency symbols are rejected rather than silently coerced; amounts converted to integer cents via Decimal.scaleb, keeping the no-floats rule; paid-vs-owed comparison deferred to Ticket 4 because it is a calculation rule, not a parsing rule; zero amounts accepted at parse level.

## Ticket 4 - Minimum change calculation (2026-07-03)

- AI (Claude Code) generated tests/test_change.py, src/cash_register/currency.py, src/cash_register/change.py, and new domain errors. Used directly except one AI self-correction before the green run: the underpayment error message initially formatted cents with float division for display; replaced with integer divmod formatting to keep the no-floats rule absolute.
- Human requirement this ticket: prove the currency table is configurable with a euro test. Implemented as an inline EUR table in the tests (2 euro through 1 cent), not shipped as a package constant; shipping EUR is Ticket 14 scope.
- AI decisions, accepted without change: Currency validates itself on construction (rejects empty, non-positive, duplicate values, and tables without a 1-unit denomination) and normalizes to largest-first, so greedy always terminates exactly; change_due (underpayment check) kept separate from minimum_change (denomination breakdown); greedy documented as exact-minimal for canonical tables like USD and EUR.

## Ticket 5 - Random change policy (2026-07-03)

- AI (Claude Code) generated tests/test_policy.py, src/cash_register/policy.py, and the InvalidConfigError domain error. Used directly, no manual modification.
- Human addition to AI's test plan: a 20-seed by 13-amount exact-sum matrix (260 parametrized cases) hardening the random strategy beyond the single-seed property test AI proposed.
- Human rejection of AI output: the original single-seed exact-sum test (test_sums_exactly, 6 amounts under seed 7) was removed as redundant because the seed-amount matrix strictly covers it. Suite is 340 tests after removal.
- AI decisions, accepted without change: strategies are pure functions of (amount, currency, rng) and ChangePolicy.strategy_for is the single selection point, so a future special case is a new strategy plus one selection change (README hint 2) without touching existing strategies; the divisor is plain policy config (README hint 1); randomness proven absent from the minimum path with a fake rng that fails the test if consulted; random strategy draws one eligible denomination at a time so the Currency-guaranteed 1-unit coin makes exact coverage always reachable; divisor validated >= 1 at construction.

## Ticket 6 - Single-record processor and formatting (2026-07-03)

- AI (Claude Code) generated tests/test_processor.py and src/cash_register/processor.py. Used directly except one AI self-correction before the first run: the custom-policy test initially expected a wrong minimal breakdown for 167 cents (1 dollar,1 quarter,4 dimes,2 pennies); corrected to 1 dollar,2 quarters,1 dime,1 nickel,2 pennies by recomputing by hand.
- AI decisions, accepted without change: format_change re-sorts counts largest-first instead of trusting caller ordering, so rendering is deterministic no matter which strategy produced the counts; the "no change" literal is a named constant (NO_CHANGE) since the CLI, API, and UI will all need the same sentinel; the random README sample is asserted by parsing the formatted line back and checking it sums to 167, which pins format and math without pinning one seed's arbitrary breakdown.

## Ticket 7 - Text and file processor (2026-07-03)

- AI (Claude Code) generated tests/test_text_processor.py and the process_line/process_text/process_file additions to processor.py. One AI-drafted test expectation was wrong and fixed after the red run: 'nope' without a comma is a field-count error, not an invalid amount; the test input was changed to 'nope,x' to actually exercise the bad-amount path. Implementation unchanged by the fix.
- AI decisions, accepted without change: per-line errors use a single 'error: ' prefix constant so every adapter can rely on one format; only CashRegisterError subclasses are converted to error lines (unexpected exceptions still crash loudly instead of being swallowed into output); blank-line detection uses strip so whitespace-only lines are skipped; splitlines handles CRLF input; output file gets a trailing newline only when there is content.

## Ticket 8 - CLI wrapper (2026-07-03)

- AI (Claude Code) generated tests/test_cli.py, src/cash_register/cli.py, and the [project.scripts] entry. Used directly, no manual modification.
- AI decisions, accepted without change: exit code convention 0 success (including runs whose output contains per-line error lines, since the file was processed), 1 for I/O failures (missing input, unwritable output), 2 for usage and config errors (matching argparse's own convention, used for the invalid divisor); --seed and --divisor exposed as the two hinted configuration points; Random(None) seeds from system entropy so omitting --seed keeps real randomness; the python -m entry point tested via subprocess to cover the __main__ guard; CLI contains no domain logic, only arg parsing, policy construction, delegation, and error translation.

## Extension - USD bills (2026-07-03)

- Human requirement: extend the USD table with 5, 10, 20, 50, and 100 dollar bills, with tests proving both strategies can return bills. This supersedes the bootstrap decision that capped the table at the dollar.
- AI (Claude Code) implemented it TDD (5 new tests red first, then the table extension). AI decisions, accepted without change: bill names spelled out as 'five dollar bill'/'five dollar bills' etc so change lines stay readable English; the prior large-amount minimum test updated because bills legitimately change its expected breakdown; random bill coverage proven with a largest-picking fake rng rather than seed hunting.

## Phase 1 audit (2026-07-03)

- AI (Claude Code) performed the audit, listed six candidate gaps, and wrote tests for all of them before any fix. Three were real bugs the tests exposed and AI then fixed: the amount regex used \d without re.ASCII so Unicode digits (Arabic-Indic, fullwidth) slipped past validation; the CLI crashed with a traceback on non-UTF-8 input instead of exiting 1; minimum_change and random_change accepted negative amounts (nonsense counts and an IndexError respectively), now guarded with ValueError since a negative amount is a programming error, not user input.
- The other three candidates (directory as input path, zero owed with zero paid, custom currency through make_change) were already handled correctly; their tests were kept as regression coverage.

## Ticket 9 - API dependency and app smoke test (2026-07-03)

- AI (Claude Code) generated the api extra, src/cash_register/api.py with the health route, and tests/test_api.py. Used directly with one dependency swap during verification: the first run surfaced a StarletteDeprecationWarning saying httpx-based TestClient is deprecated in favor of httpx2, so the extra pins httpx2 instead and the old httpx was uninstalled. Warning gone, suite clean.
- AI decisions, accepted without change: test_api.py starts with pytest.importorskip('fastapi') so a core-only install (no api extra) skips API tests instead of erroring, keeping the lightweight-core guarantee testable; a small AST check confirmed no core module imports fastapi, uvicorn, or httpx2.

## Ticket 10 - Extend CI for API tests (2026-07-03)

- AI (Claude Code) changed the CI install step from ".[dev]" to ".[api,dev]" so the API tests run in CI instead of being skipped by importorskip. One-line change, used directly.

## Ticket 11 - Request and response models (2026-07-03)

- AI (Claude Code) generated tests/test_api_models.py and the pydantic models in api.py. Used directly, no manual modification.
- AI decisions, accepted without change: ChangeRequest carries raw owed,paid strings (parsing stays in the core, the API does not re-model transactions); extra='forbid' so unknown fields 422 instead of being silently dropped; lines capped at 1000 per request as the oversized-payload guard; currency is a Literal enum currently allowing only USD, to be widened when EUR ships in Ticket 14; divisor validated ge=1 at the model layer mirroring the domain rule so bad config never reaches core; LineResult uses a status Literal (ok/error) with line_number and echoed input, pre-shaping the Ticket 13 structured error envelope.
- Deferred: the OpenAPI-schema acceptance check runs in Ticket 12 when the endpoint registers the models with the app.

## Ticket 12 - Change endpoint delegating to core (2026-07-03)

- AI (Claude Code) generated tests/test_api_endpoint.py and the POST /change handler. Used directly, no manual modification.
- AI decisions, accepted without change: the handler composes parse_line + process_transaction and translates CashRegisterError into structured entries rather than reusing process_line and sniffing its 'error: ' string prefix, because the API surface is structured, not textual; one Random(seed) instance is shared across the request so a seeded request is fully reproducible and endpoint output provably equals process_text for the same seed (asserted in a test); per-line error translation lands here as the natural adapter seam, with Ticket 13 driving its mixed and all-invalid coverage.
- Carried from Ticket 11: OpenAPI schema now asserted to document ChangeRequest, ChangeResponse, and LineResult.

## Ticket 13 - Structured error output (2026-07-03)

- AI (Claude Code) generated six structured-error tests. No implementation change was needed: the translation seam built in Ticket 12 already produced the correct envelope, so this ticket locks the contract as regression coverage. No red phase occurred and that is recorded honestly here rather than staged.
- AI decisions, accepted without change: blank or whitespace lines in the API payload are explicit per-line error entries rather than being silently skipped like in the file processor, because an API array element is a deliberate client value while a blank file line is formatting; batches with all lines invalid still return 200 with error entries (domain failures are data, not transport failures); only request-shape problems 422.

## Ticket 14 - Config and mode selection (2026-07-03)

- AI (Claude Code) shipped EUR in currency.py, added the CURRENCIES registry, widened the request Literal to USD|EUR, and mapped the selection in the handler. Used directly with one AI cleanup during green: the test file's older inline euro table was renamed INLINE_EUR because it shadowed the new shipped constant (ruff F811); it stays as the proof that arbitrary tables work, separate from the shipped EUR.
- AI decisions, accepted without change: euro denominations named in spelled-out English ('two euro coin', 'fifty cent coin') consistent with the USD bill naming; registry keyed by currency code is the single lookup point the CLI could also adopt later; divisor/seed wiring already existed from Ticket 12, so this ticket's new surface is currency selection plus the negative-divisor request test.
- Note: the CLI still exposes only divisor and seed, not currency; flagged as a candidate for the Phase 2 audit rather than silently expanding this ticket's scope.
- Human addition: euro banknotes (5 through 100 euro) added to the shipped EUR table mirroring the USD bills work; named 'five euro note' etc since euros have notes, not bills. TDD with a nine-denomination minimum span (186.75) and a largest-picking random proof; endpoint EUR tests unaffected because their amounts sit below five euros.

## Ticket 15 - API run docs (2026-07-03)

- AI (Claude Code) wrote the README 'Solution: Running the API' section. Every command and the example response were executed live first (uvicorn started, /health and /change curled, server stopped) and the response pasted from the real output rather than composed from memory.
- AI decision, accepted without change: the section is appended after the original challenge text, leaving the problem statement untouched; the full README restructure is Prompt 7 scope.

## Phase 2 audit (2026-07-03)

- AI (Claude Code) enumerated seven gap candidates and wrote 11 tests before any fix. All passed on the first run, so no implementation changed; the tests remain as regression coverage. Recorded honestly: unlike the Phase 1 audit, this one exposed no defects, consistent with the handler being a thin adapter over the already-hardened core.
- AI decision, accepted without change: the missing CLI --currency flag is a parity limitation, not a coverage gap, so the audit did not expand scope to add it; it is recorded in the plan and will surface in ARCHITECTURE.md and the self-critique scaffold.
- Human then directed implementing the flag. AI added --currency with argparse choices generated from the CURRENCIES registry (a new currency becomes a CLI option automatically) and mapped it into ChangePolicy. TDD: EUR run red first; unknown currency exits 2 via argparse choices.

## Ticket 16 - Vite setup and smoke render test (2026-07-03)

- AI (Claude Code) scaffolded via create-vite react-ts, then reworked to the standard. Two template deviations corrected deliberately: the 2026 template ships oxlint but standards/ts-react-vite.md mandates ESLint flat config with typescript-eslint and react-hooks, so oxlint was removed and ESLint installed; the template's demo app (logos, counter, two css files) was replaced with a minimal App and the single styles.css the standard prescribes for console tools.
- AI decisions, accepted without change: Vite proxy routes /change and /health to the FastAPI port so the frontend calls same-origin paths; vitest config lives inside vite.config.ts with jsdom, globals, the jest-dom+cleanup setup file, and e2e/ excluded; .env.example carries VITE_API_BASE_URL empty by default meaning use the dev proxy.
- One iteration during verification: TypeScript 6 deprecates baseUrl, so the @/ alias uses paths without baseUrl.

## Ticket 17 - Frontend CI workflow (2026-07-03)

- AI (Claude Code) generated .github/workflows/frontend-ci.yml mirroring the backend workflow hygiene (least-privilege permissions, concurrency cancellation, timeout, dependency caching keyed on the lockfile). Used directly, no manual modification.
- AI decisions, accepted without change: separate workflow per platform (matching the standard) rather than a second job in the backend file, so failures and concurrency groups stay independent; node 22 pinned to match local dev; npm ci rather than npm install so CI is lockfile-exact.

## Ticket 18 - Domain types and gateway interface (2026-07-03)

- AI (Claude Code) generated src/domain/change.ts and its test. Used directly after one AI cleanup: the test fake initially consumed the optional config parameter with a no-op ternary to satisfy noUnusedParameters; simplified by implementing the interface with fewer parameters, which TypeScript permits.
- AI decisions, accepted without change: domain types use frontend camelCase (lineNumber) and the adapter owns the snake_case translation, keeping the wire format out of screens; GatewayError defined in domain so hooks can catch a typed failure without importing adapter internals; config fields optional so callers state only what they override.

## Ticket 19 - HTTP API adapter (2026-07-03)

- AI (Claude Code) generated the adapter and its mocked-fetch tests. Used directly, no manual modification.
- AI decisions, accepted without change: factory function taking baseUrl with the default read from VITE_API_BASE_URL (empty means same-origin via the dev proxy), so tests inject explicit urls and production wiring stays configurable; the request body includes only the config fields the caller set, and a null seed is omitted so the backend treats it as unseeded; every failure mode (network throw, non-2xx, JSON parse failure, missing results key) converges on GatewayError with a human-readable message, so hooks handle exactly one error type; the API snake_case shape exists only inside this module.
- Human requirement: validate every entry in the results array, not just the envelope. AI added an isApiLineResult type guard (field types, status literal, string-or-null change/error) applied with Array.every; any unknown shape now throws GatewayError. TDD: 8 invalid-entry cases red first.

## Ticket 21 - Workflow hooks (2026-07-03)

- AI (Claude Code) generated useChangeWorkflow and its tests, then refactored ChangeScreen to pure composition. Used directly, no manual modification. All 7 existing screen tests passed unchanged after the refactor, confirming behavior parity.
- AI decisions, accepted without change: the hook owns the double-submit guard (submit is a no-op while in flight or with no non-blank lines) instead of relying on the disabled button, so the invariant holds for any future caller; failures clear results and successes clear failures so the screen never shows both; non-GatewayError exceptions map to a generic message rather than leaking internals; line splitting stays in the hook until Ticket 22 moves it to utils/.

## Ticket 22 - Utility functions (2026-07-03)

- AI (Claude Code) generated utils/lines.ts (toLines) and utils/results.ts (resultText) with unit tests, then swapped the hook's inline splitter and the screen's inline ternary to use them. Used directly, no manual modification.
- AI decisions, accepted without change: only helpers that already had two callers or a display rule worth naming were extracted, avoiding speculative utils; resultText degrades to an empty string on null fields so the table never renders the word null; existing hook and screen tests passing unchanged after the swap prove the refactor was behavior-neutral.

## Ticket 23 - UI and features implementation (2026-07-03)

- Human provided the full UI spec (tabs, panels, payment grid, output tokens, snackbar, dense console). AI implemented it TDD across 8 modules. Supersessions at human direction via the spec: the Ticket 20 ChangeScreen and its file-pick flow were removed in favor of the Flat File tab with Load Sample; useChangeWorkflow was reshaped into useSubmitChange (lines passed per call, shared by both tabs) and its tests rewritten accordingly.
- AI decisions, accepted without change: DenominationToken is the single shared bill/coin visual, a button when pressable and a counted static token otherwise, satisfying the one-component rule; output tokens map backend change-line names through a lookup, silently skipping unknown names (EUR) so text remains authoritative; client-side validation guards obvious invalid actions (bad owed format, underpayment) while the backend stays authoritative; the paid total was changed from an output element to a span because output carries an implicit status role that collided with the snackbar in accessibility queries (caught by a failing test); Generate Owed takes an injectable generator defaulting to a random 0.01-99.99 amount; snackbar restarts via a keyed remount and is used for payment notices only per spec.

## Refinement - overpayment notice (2026-07-04, Ticket 23)

- Human feedback from live testing: the payment snackbar said only "Added X" even when the tap pushed the paid total past the owed amount. AI added the overpayment suffix ("Added $1, paid exceeds owed") computed against the tap's resulting total, kept plain while no valid owed amount is set and when paid exactly equals owed. TDD red first; 106 frontend tests green.
- Reversed later the same day (see the post-docs entry): the human decided notices should always read plain "Added $X" and the suffix was removed.

## Reversal - plain payment notices (2026-07-04, post Prompt 7)

- Human rejected the earlier overpayment wording: the snackbar must always say just "Added $X". The suffix logic was removed and the two affected tests rewritten (plain notice even when a tap jumps past owed; exact coverage still locks the grid). The grid-lock behavior itself is unchanged. TDD red first on the rewritten test; 112 unit tests, 6 e2e specs, lint, and build green.

## Refinement - payment lock on coverage (2026-07-04, Ticket 23)

- Human requirement with an explicit integration scenario: lock the payment grid once paid covers owed; owed 300.10, four $100 taps reach 400 accepted, the fifth click is dead. AI implemented via the shared token's disabled prop driven by paid >= owed (only when owed is valid), with Clear Paid unlocking.
- Interaction with the overpayment notice, resolved by AI and locked in tests: once coverage disables the grid, overpaying is only possible when a single tap jumps from below owed to above it; exact coverage notices plainly and locks without the overpayment flag. The earlier overpayment test was rewritten for the jump scenario because its old second tap is now correctly impossible.

## Ticket 24 - UX and responsive polish (2026-07-04)

- AI (Claude Code) did a CSS-only polish: quiet consistent form-control styling moved to the global styles.css (buttons, inputs, focus-visible outlines, disabled states), long output lines wrap with overflow-wrap anywhere, snackbar gains z-index and a viewport-relative max width, primary submit buttons weighted, narrow-viewport padding and header wrap, prefers-reduced-motion kills animations. No behavior changes, so per the standard no new tests were added; all 108 existing tests, lint, and build stayed green.
- Rules verified mechanically before polishing: zero inline style props and zero fetch calls outside adapters/ (grep), the denomination visual is one shared component.

## Ticket 25 - E2E with Playwright (2026-07-04)

- Gate honored: the human explicitly invoked Ticket 25, which per prompts.md Prompt 6 is the E2E approval that the UI workflow is stable enough to lock.
- AI (Claude Code) wrote playwright.config.ts (testDir e2e, retries 1, dedicated port 5174 webServer with reuseExistingServer outside CI) and three specs: the flat file workflow with the preloaded sample, the cashier tap-and-calculate workflow, and per-line error rows in a real browser. The API is mocked at the network layer with page.route per the standard; backend correctness stays proven by backend tests.
- One iteration during the run: Playwright role-name matching is substring by default, so 'Add $1' also matched the $10 and $100 buttons (strict mode violation); fixed with exact matching. Playwright artifacts gitignored; e2e added to frontend CI as its own job with the chromium install step.

## Refinement - e2e audit additions (2026-07-04, Ticket 25)

- Human directed an audit of the e2e suite and named two gaps: backend-unreachable (route aborted, failure message must show) and snackbar behavior (notice appears on a payment click and auto-dismisses on its own). AI's audit surfaced one more browser-only behavior with no coverage: output persisting across tab switches, since the output panel lives outside the tabpanels. All three added; 6 e2e specs passing, including a real-time auto-dismiss wait rather than mocked timers.

## Phase 3 audit (2026-07-04)

- AI (Claude Code) audited the frontend for uncovered inputs, states, and error paths. Four real gaps were identified, all state-interaction boundaries on the cashier panel: snackbar replacement on rapid taps, grid locking when owed is entered after payment already covers it, unlocking when owed rises above paid, and the owed-zero boundary (instant lock, calculate enabled, line submitted as 0,0.00). All four tests passed on first run, so no fixes were needed; recorded honestly as regression locks, matching the Phase 2 pattern where a thin composition over well-tested parts audits clean.
- Considered and deliberately not added: a client-side guard for the 1000-line backend cap in the flat file tab (the 422 surfaces through the existing failure alert; a friendlier message is a product decision, left for the self-critique).

## Prompt 7 - Docs (2026-07-04)

- AI (Claude Code) restructured README.md (original challenge text preserved verbatim, solution sections for all three phases with verified commands and test counts, documentation and submission-docs link sections), wrote docs/ARCHITECTURE.md (layers, boundary rules, data flow, the four extension points mapped to the challenge hints, known limitations), and replaced the leftover Vite-template frontend/README.md with a pointer.
- SELF_CRITIQUE.md was filled with answers the human authored and supplied verbatim in his prompt; the AI transcribed and formatted them, and the file states that authorship split. This honors the CLAUDE.md rule that the critique is never answered for the human.
- Log verification per Prompt 7: DECISION_LOG, VERIFICATION, and TOOLS were reviewed against the git history; entries exist for every ticket, correction, refinement, and audit, appended in the same turn each happened. One known gap, flagged not invented: TRANSCRIPT.md remains a placeholder until the human exports the raw conversation log at ship time.

## Transcript export (2026-07-04, post final audit)

- Human directed the AI to export the session log itself: the tool's native JSONL for this session (16dbc220) was located under ~/.claude/projects and copied verbatim into docs/ai/transcript-build-session.jsonl (2277 events at export time). TRANSCRIPT.md documents the format and the caveat that the file is re-exported as the last pre-delivery step so the shipping turns are included. This closes the final audit's one must-fix finding, pending that last refresh.

## Correction - stray root npm install (2026-07-03, Ticket 20)

- Human caught an AI mistake: @testing-library/user-event was installed from the repo root (the shell was not in frontend/), creating a root package.json, package-lock.json, and node_modules. Local tests still passed because Node resolves modules upward, which would have masked the problem until CI's npm ci ran strictly inside frontend/ and failed. Fix: root artifacts deleted, dependency installed in frontend/package.json, npm ci re-run from the lockfile, all 27 tests plus lint and build green again.

## Ticket 20 - Main screen with injected gateway (2026-07-03)

- AI (Claude Code) generated ChangeScreen.tsx, its scoped ChangeScreen.css, the screen tests, and the App wiring. Used directly, no manual modification.
- AI decisions, accepted without change: the screen receives ChangeGateway as a prop and App owns the one createHttpChangeGateway call, so no fetch exists outside adapters/; input splitting trims and drops blank lines client-side to mirror the file processor before lines reach the gateway; submit disabled when no non-blank lines and while a request is in flight; per-line errors render inside the results table as marked rows rather than a separate list, keeping input order visible; gateway failures render a role=alert message; file picking uses File.text() into the textarea so the file path is just a convenience for the same submit flow; styling follows the component rule (scoped BEM-ish classes in a per-component css file, no inline styles).

## Correction - commit policy (2026-07-03)

- Human rejected AI behavior: AI treated invoking Prompt 4 as approval to commit and committed Ticket 1 plus the restructure on its own. Human requires explicit approval per commit. Both commits were reverted with git reset --soft (work kept in the working tree) and CLAUDE.md now states the rule.
