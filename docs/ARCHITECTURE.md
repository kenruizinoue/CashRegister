# Architecture

One core, three adapters. Business rules exist exactly once, in the Python package; every surface translates in and out of it.

## Layers

```text
core (backend/src/cash_register/)
  domain.py      errors and the Transaction value type (integer cents everywhere)
  parser.py      strict owed,paid line parsing into cents
  currency.py    self-validating denomination tables (USD, EUR) and the CURRENCIES registry
  change.py      change_due (underpayment check) and greedy minimum_change
  policy.py      ChangePolicy (currency, random divisor), strategy selection, random_change
  processor.py   formatting and line/text/file processing with per-line error continuation

adapters
  cli.py                          argparse, exit codes, delegates to processor
  api.py                          FastAPI models and the /change route, delegates per line
  frontend/src/adapters/          HTTP gateway implementing the domain interface

frontend (frontend/src/)
  domain/       types mirroring the API contract, ChangeGateway interface, denomination catalog
  adapters/     httpChangeGateway (the only fetch in the app), strict envelope validation
  hooks/        useSubmitChange: in-flight guard, results, failure translation
  screens/      CashRegisterScreen: tabs, panels, composition only
  components/   DenominationToken (the one shared bill/coin visual), OutputPanel, Snackbar
  utils/        pure helpers: line splitting, money parsing/formatting, change-text parsing
```

## Boundary rules

- No change math outside the core. The API handler and CLI only validate, configure, delegate, and translate. The frontend renders what the backend returns; its money parsing exists only to guard obvious invalid actions (bad owed format, underpayment) and the backend stays authoritative.
- The wire format (snake_case) exists only inside the HTTP gateway adapter; screens and hooks see domain types.
- Domain errors become per-line error strings in the CLI, structured per-line entries in the API, and error rows in the UI. Transport failures converge on one typed GatewayError in the frontend.
- Unexpected exceptions are never converted into output lines; only domain errors are.

## Data flow

input line -> parser -> Transaction -> change_due -> ChangePolicy.strategy_for -> strategy (minimum | random) -> denomination counts -> format_change -> adapter surface

## Extension points (mapped to the challenge hints)

1. Change the random divisor: `ChangePolicy(random_divisor=N)`; exposed as `--divisor` on the CLI and `divisor` in the API request. Validated at construction; invalid config never reaches the core.
2. Add another special case: strategies are pure functions of `(amount_cents, currency, rng)`; `ChangePolicy.strategy_for` is the single selection point. A new case is one new strategy function plus one selection change, with no edits to existing strategies.
3. A client in France: currencies are data, not code. A `Currency` table validates itself (positive unique values, a 1-unit denomination so greedy always terminates exactly) and registers in `CURRENCIES`; the CLI choices derive from the registry and the API accepts the code. EUR ships with coins and banknotes as the proof. The frontend token catalog maps backend denomination names to visuals and silently skips unknown names, so a new currency degrades to text-only output until its tokens are added.
4. Randomness is injectable everywhere: strategies receive the random source, the CLI and API accept a seed, and tests use fakes (smallest-picking, largest-picking, must-not-be-consulted) plus seed sweeps.

## Known limitations

- No authentication, CORS policy, or rate limiting on the API; it is a local/demo deployment shape.
- The API caps batches at 1000 lines; the UI surfaces that as a raw failure alert rather than a client-side guard.
- Random change draws one denomination at a time, which is exact but slow for very large change amounts.
- The frontend token catalog covers USD only; EUR output renders as text.
