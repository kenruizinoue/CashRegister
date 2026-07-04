# Ken Project Prompts

Invoke as: `execute prompt N from prompts/prompts.md`, adding the inputs the prompt lists.
Always read the referenced files fresh; never work from memory of them.

## Prompt 1 - Load Context

When: the very first message in a fresh session, before anything else.

Inputs: none.

Read every file in standards/ and read prompts/prompts.md. The standards are my working rules; the prompts file is the flow we will follow. I will invoke its prompts by number. Confirm what you loaded with one line per file. Don't act on anything yet.

## Prompt 2 - Bootstrap

When: kick off the project or a new requirement, right after the context is loaded.

Inputs: `phases` (ordered list of delivery units, e.g. a platform, cloud/infra config, deployment), `requirement` (link or pasted text).

Read the requirement. Then:

1. Create a short CLAUDE.md for this repo:
   - CLAUDE.md must refer to the standards/ files, never summarize, compact, or copy their content. The rules live only in standards/ and must be read from there, so no instruction or context gets lost.
   - standards/base-sdlc.md is always mandatory; when a phase has a matching standards/ file, read it before working on that phase.
   - If the requirement demands process documentation (e.g. AI decision log, verification records, self-critique), add rules to CLAUDE.md so they are maintained in real time: log entries are appended in the same turn the event happens, never reconstructed later; self-assessment docs are scaffolded with TODOs only, never answered for me.
2. Summarize the requirement: required vs optional scope, and list every ambiguity with your proposed decision (input validation, edge cases, special rules, localization hints, whatever applies).

Show me CLAUDE.md and the summary, then wait for my confirmation. No planning or code yet.

## Prompt 3 - Plan Tickets

When: right after the bootstrap assumptions are confirmed, before any code.

Inputs: none (uses the phases and the assumptions confirmed after prompt 2).

Using the confirmed assumptions and the given phases, write docs/PROJECT_PLAN.md following standards/base-sdlc.md: phases, tickets with acceptance criteria, a CI ticket for each phase that adds testable code, verification commands. No code. Wait for my approval.

## Prompt 4 - Implement Ticket

When: repeatedly during a phase once the plan is approved, one ticket at a time.

Inputs: `X` (ticket number from docs/PROJECT_PLAN.md).

Implement ticket X. TDD: failing test first, minimal implementation, run tests, update the plan status, commit.

## Prompt 5 - Phase Audit

When: all tickets of the current phase are done; this closes the phase.

Inputs: none (audits and closes the current phase).

Audit the current phase. This is the point where edge case verification happens: list the inputs, states, and error paths not yet covered by tests (invalid input, boundaries, empty/large values, failure modes). Add tests for the real gaps, fix anything they expose, re-run all checks, commit, and mark the phase done in the plan.

## Prompt 6 - E2E (optional, only for projects with a UI/frontend phase)

When: the UI workflow is stable and I decide to lock it; skip if there is no UI.

Inputs: none (sending this prompt is the E2E approval; skip it entirely if there is no UI to lock).

The workflow is stable; implement the planned E2E ticket per the matching standards/ file. Add it to CI. Commit.

## Prompt 7 - Docs

When: all phases are closed, before the final audit.

Inputs: none (extra docs come from the requirement; name any additional doc to include).

Update README.md: setup, run, test, usage for every phase. Write docs/ARCHITECTURE.md: layer boundaries and the extension points hinted by the requirement. Then create or complete any additional document the requirement demands: verify logs against what actually happened, flag gaps instead of inventing entries, and scaffold self-assessment sections as TODOs for me.

## Prompt 8 - Final Audit

When: everything is built and documented, right before shipping.

Inputs: none.

Run everything (all suites, lint, builds, approved E2E). Then review the whole repo against standards/ and the requirement. List anything a reviewer could flag. Do not fix yet.

## Prompt 9 - Ship

When: final audit findings are resolved and I am ready to deliver.

Inputs: none (delivery method comes from the requirement; state it if different, e.g. PR target).

Commit anything pending, push, and deliver per the requirement (e.g. open the PR). Include how to run each phase and pointers to the docs.
