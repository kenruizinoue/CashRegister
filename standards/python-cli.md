# Ken Python CLI Rules

Use with `base-sdlc.md`.

## Purpose

Build a Python package plus a thin CLI entry point. CLI is an adapter, not the business logic layer.

## Structure

```text
project/
  pyproject.toml
  src/package_name/
    __init__.py
    money_or_parser.py
    domain.py
    policy.py
    processor.py
    cli.py
  tests/
    test_smoke.py
    test_domain.py
    test_policy.py
    test_processor.py
    test_cli.py
```

Rename modules for the domain; keep names responsibility-based.

## Defaults

- `src/` layout.
- `.venv/` at project root, gitignored.
- `pyproject.toml` with a `dev` extra for tooling (`pip install -e ".[dev]"`); keep core `dependencies` minimal.
- `pytest` configured in pyproject: `testpaths=["tests"]`, `pythonpath=["src"]`, `addopts="-ra"`.
- `ruff` for lint (line-length 100); runs in CI.
- console script via `[project.scripts]` (`tool-name = "package_name.cli:main"`) when terminal usage is part of the product workflow.
- exact arithmetic for money/decimal domains, never floats.

## Ticket Order

1. Setup and smoke test.
2. CI workflow: pytest on push to main.
3. Input parsing/validation.
4. Core calculation.
5. Special policy/rule.
6. Single-record processor.
7. Text/file processor.
8. CLI wrapper.

## CLI Rules

- Parse args, call package code, write output.
- Keep file processing deterministic.
- Use temp files in tests.
- Represent per-line errors consistently when multi-line output must continue.

## Extension Points

Use parameters or config objects for currency/locale, formatting, random source, and policy rules. Defaults should preserve the agreed core behavior.

## Verify

```bash
pip install -e ".[dev]"
ruff check .
pytest
python -m package_name.cli input.txt output.txt
```
