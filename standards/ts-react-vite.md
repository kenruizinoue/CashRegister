# Ken TypeScript React Vite Rules

Use with `base-sdlc.md`.

## Purpose

Build a real usable client while keeping network and domain boundaries swappable. UI may guard obvious invalid actions; backend/core remains authoritative.

## Structure

```text
frontend/
  src/
    domain/      # types and gateway interfaces
    adapters/    # HTTP/Firebase/local implementations
    hooks/       # stateful workflow logic
    screens/     # page-level composition
    components/  # reusable presentational UI
    utils/       # pure helpers + unit tests
    test/        # test setup
    App.tsx
    main.tsx
    styles.css
  e2e/
```

Styling: one `styles.css` for small tools/consoles; Tailwind for product apps.

## Defaults

- React + TypeScript + Vite.
- Vitest + Testing Library from the first frontend ticket.
- ESLint flat config (typescript-eslint + react-hooks); runs in CI.
- `@/` path alias to `src` in both vite config and tsconfig paths.
- Env vars: `VITE_`-prefixed, committed `.env.example`, real env files gitignored.
- Scripts: `dev`, `build` (`tsc -b && vite build`), `preview`, `test` (`vitest run`), `test:watch`, `e2e`, `lint`; `deploy` when hosting on Firebase.
- Vite proxy explicit when calling a local API.

## Boundary Rules

- No direct `fetch` in screens.
- Put gateway interfaces in `domain/`.
- Put concrete network adapters in `adapters/`.
- Inject fake gateways in screen tests.
- Keep deterministic client rules in `utils/` with unit tests.

## Ticket Order

1. Vite setup and smoke render test.
2. Frontend CI workflow: npm test + build on push to main.
3. Domain types and gateway interface.
4. API adapter with mocked tests.
5. First usable screen with injected gateway.
6. Workflow hooks.
7. Utility functions and tests.
8. Loading, empty, and error states.
9. UX/responsive polish.
10. E2E ticket (see Testing Rule; add to CI only once approved).

## Component Rules

- Repeated UI must be one shared component in `components/`; if the same element appears in two places (e.g. a denomination list on both panels), design it as one component from the start, never duplicated markup.
- Styling lives in a separate CSS file per component, scoped class names; with Tailwind, use `@apply`/`@layer` in that file. No inline `style` props and no styles hardcoded in the component.

## UI Rules

- First screen should be the usable app, not a landing page.
- Operational tools should be quiet, dense, and scannable.
- Use tabs for modes, inputs for values, buttons for commands, lists/tables for output.
- Snackbar/toast is only for transient non-blocking feedback.
- Avoid over-explaining the UI with visible instructional copy.
- Check no text overlap and no unwanted page scroll for console-like desktop layouts.

## Testing Rule

- Vitest setup: jsdom, globals, setup file with jest-dom + `afterEach(cleanup)`, exclude `e2e/`.
- Playwright config: `testDir: 'e2e'`, retries 1, `webServer` with `reuseExistingServer` on a dedicated port; multiple `webServer` entries when a real backend is needed.
- Add unit/integration tests in the same ticket as each feature.
- Use screen tests with injected gateways before browser tests.
- Plan Playwright near the end, but do not create E2E tests automatically.
- Implement Playwright only when the user confirms the UI/workflow is stable enough to lock.
- When testing UI behavior with Playwright, mock external network calls; prove backend correctness in backend tests.

## Verify

```bash
npm test
npm run build
npm run e2e # only when E2E has been approved and added
```
