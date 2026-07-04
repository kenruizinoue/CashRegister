# Cash Register

## The Problem
Creative Cash Draw Solutions is a client who wants to provide something different for the cashiers who use their system. The function of the application is to tell the cashier how much change is owed, and what denominations should be used. In most cases the app should return the minimum amount of physical change, but the client would like to add a twist. If the "owed" amount is divisible by 3, the app should randomly generate the change denominations (but the math still needs to be right :))

Please write a program which accomplishes the clients goals. The program should:

1. Accept a flat file as input
	1. Each line will contain the amount owed and the amount paid separated by a comma (for example: 2.13,3.00)
	2. Expect that there will be multiple lines
2. Output the change the cashier should return to the customer
	1. The return string should look like: 1 dollar,2 quarters,1 nickel, etc ...
	2. Each new line in the input file should be a new line in the output file

## Sample Input
2.12,3.00

1.97,2.00

3.33,5.00

## Sample Output
3 quarters,1 dime,3 pennies

3 pennies

1 dollar,1 quarter,6 nickels,12 pennies

*Remember the last one is random

## The Fine Print
Please use whatever technology and techniques you feel are applicable to solve the problem. We suggest that you approach this exercise as if this code was part of a larger system. The end result should be representative of your abilities and style.

Please fork this repository. When you have completed your solution, please issue a pull request to notify us that you are ready.

Have fun.

## Things To Consider
Here are a couple of thoughts about the domain that could influence your response:

* What might happen if the client needs to change the random divisor?
* What might happen if the client needs to add another special case (like the random twist)?
* What might happen if sales closes a new client in France?

---

# Solution

Three phases share one core: the change-making business logic lives only in the Python package; the CLI, the HTTP API, and the React UI are thin adapters over it.

```text
backend/    Python core (cash_register package), CLI, and FastAPI adapter
frontend/   React + TypeScript + Vite UI
docs/       project plan, architecture, and the AI process documentation
standards/  working standards the project was built under
prompts/    the prompt flow that drove the delivery
```

Test suites: 447 backend tests, 112 frontend unit tests, 6 Playwright e2e specs. Both CI workflows (backend and frontend, including e2e) run on every push and PR to main.

## Phase 1: Core and CLI

### Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

### Test

```bash
ruff check .
pytest
```

### Usage

```bash
cash-register input.txt output.txt
# or: python -m cash_register.cli input.txt output.txt
```

Each non-blank input line `owed,paid` produces one output line like `3 quarters,1 dime,3 pennies`. Invalid lines become `error: <message>` lines and processing continues. Options:

- `--divisor N` owed amounts (in cents) divisible by N get random change (default 3)
- `--seed N` seed the random source for reproducible output
- `--currency {USD,EUR}` denomination table to make change from (default USD)

Exit codes: 0 success, 1 input/output failure, 2 usage or config error.

## Phase 2: HTTP API

### Setup and run

```bash
cd backend
python3 -m venv .venv          # skip if already created
source .venv/bin/activate
pip install -e ".[api,dev]"
uvicorn cash_register.api:app --reload
```

Interactive documentation: http://127.0.0.1:8000/docs

### Example

```bash
curl -s http://127.0.0.1:8000/change \
  -H "Content-Type: application/json" \
  -d '{"lines": ["2.12,3.00", "1.97,2.00", "3.33,5.00"], "seed": 42}'
```

Response (the third line is random because 3.33 divides by 3; `seed` makes it reproducible):

```json
{
  "results": [
    {"line_number": 1, "input": "2.12,3.00", "status": "ok", "change": "3 quarters,1 dime,3 pennies", "error": null},
    {"line_number": 2, "input": "1.97,2.00", "status": "ok", "change": "3 pennies", "error": null},
    {"line_number": 3, "input": "3.33,5.00", "status": "ok", "change": "1 dollar,1 quarter,3 dimes,2 nickels,2 pennies", "error": null}
  ]
}
```

Request options: `currency` (`"USD"` default or `"EUR"`), `divisor` (default 3), `seed` (omit for real randomness). Invalid lines come back as per-line `status: "error"` entries; invalid request shapes return 422. Batches are capped at 1000 lines.

## Phase 3: Web UI

### Setup and run

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 with the API running (the dev server proxies `/change` to port 8000). Two tabs: Cashier (enter or generate the owed amount, tap bills and coins to build the payment, calculate) and Flat File (paste or edit `owed,paid` lines, calculate). Output shows one row per line with the change text and visual denomination tokens.

### Test

```bash
npm test        # unit and screen tests
npm run lint
npm run build
npm run e2e     # Playwright browser tests (installs nothing extra beyond npx playwright install chromium once)
```

## Documentation

- [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) - phases, tickets, and status
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - layer boundaries and extension points

## Submission Documentation

The client-requested AI process documentation lives in [docs/ai/](docs/ai/):

- [docs/ai/REQUIREMENT_DOCS.md](docs/ai/REQUIREMENT_DOCS.md) - the documentation demands this section fulfills, recorded verbatim
- [docs/ai/TRANSCRIPT.md](docs/ai/TRANSCRIPT.md) - full prompt transcript: the raw session log exported as [transcript-build-session.jsonl](docs/ai/transcript-build-session.jsonl)
- [docs/ai/DECISION_LOG.md](docs/ai/DECISION_LOG.md) - where AI output was used directly, modified, or rejected, and why, appended in real time per ticket
- [docs/ai/VERIFICATION.md](docs/ai/VERIFICATION.md) - how AI-generated pieces were verified: tests run and edge cases exercised per ticket
- [docs/ai/TOOLS.md](docs/ai/TOOLS.md) - which AI tool handled which task and how it was deployed
- [docs/ai/SELF_CRITIQUE.md](docs/ai/SELF_CRITIQUE.md) - the author's self-critique of the solution
