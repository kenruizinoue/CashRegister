# CashRegister

Cash register change calculator for the Creative Cash Draw Solutions assessment. The requirement lives in README.md plus the client documentation demands recorded in docs/ai/REQUIREMENT_DOCS.md; read them fresh before planning or scoping work.

## Working Rules

- The rules live only in standards/. Read them from there every session; never summarize, compact, or copy their content into this file or any other doc.
- standards/base-sdlc.md is always mandatory. Read it before any work.
- Before working on a phase, read its matching standards file:
  - Phase 1, Python core + CLI: standards/python-cli.md
  - Phase 2, FastAPI API: standards/python-fastapi.md
  - Phase 3, React + Vite UI: standards/ts-react-vite.md
- The delivery flow is prompts/prompts.md; the user invokes its prompts by number.
- Never commit implementation work until the user explicitly approves it. Prompt 4's commit step means: finish the ticket, show the result, then wait; commit only when the user says to. A prompt invocation is not commit approval.

## AI Process Documentation (client-demanded, maintained in real time)

The client requires AI-usage documentation with the submission. These live under docs/ai/ and are updated in the same turn the event happens, never reconstructed later:

- docs/ai/DECISION_LOG.md: every ticket gets entries the moment the work happens, marking where AI output was used directly, where it was modified and why, and where it was rejected and why. Never backfill; if an entry is missing, flag the gap instead of inventing it.
- docs/ai/VERIFICATION.md: for each ticket, append what tests confirmed the AI-generated pieces work and which edge cases were exercised, written when the tests actually run.
- docs/ai/TOOLS.md: append which AI tool handled which task as the task is done (tool, task, how it was deployed).
- docs/ai/SELF_CRITIQUE.md: scaffold with TODO sections only (what to change, strongest part, weakest part). Never write answers; the critique is the user's voice.
- Full prompt transcript: exported by the user from the AI tool at delivery time. Keep a placeholder pointer in docs/ai/ so the export is not forgotten; never fabricate transcript content.

## Phases

1. Python core + CLI
2. FastAPI API adapter over the same core
3. React + Vite frontend

Layout: the Python core, CLI, and API live in backend/; the React app lives in frontend/.

## Plan

Ticket status lives in docs/PROJECT_PLAN.md once created.
