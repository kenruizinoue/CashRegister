# Self-Critique

Answers authored by Ken Ruiz Inoue; transcribed into this file by the AI assistant at his direction.

## If I could change part of the solution, what would I change and why?

Security and scale were consciously skipped, and that is what I would change first for production. There is no auth, CORS policy, or rate limiting on the API; the random change strategy draws one denomination at a time, which is exact but does not scale to very large totals; and there is no multi-register synchronization story. I would harden those first before putting this in front of real cashiers.

## Which part of the solution seems strongest, and why?

The core policy design: strategies are pure functions with injectable randomness, and strategy selection is a single point. Because of that, the random divisor, new special cases, and new currencies are configuration or one-line changes, and the tests prove it (fake random sources, the euro table, divisor variations).

## Which part of the solution seems weakest, and why?

The security posture, and the client-side UX around backend limits: the 1000-line batch cap just surfaces as a raw failure alert in the UI instead of a friendly client-side guard.
