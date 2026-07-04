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

## Correction - commit policy (2026-07-03)

- Human rejected AI behavior: AI treated invoking Prompt 4 as approval to commit and committed Ticket 1 plus the restructure on its own. Human requires explicit approval per commit. Both commits were reverted with git reset --soft (work kept in the working tree) and CLAUDE.md now states the rule.
