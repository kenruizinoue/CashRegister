"""Turn transactions into cashier-facing change lines."""

from pathlib import Path

from cash_register.currency import Denomination
from cash_register.domain import CashRegisterError, Transaction
from cash_register.parser import parse_line
from cash_register.policy import ChangePolicy, RandomSource, make_change

NO_CHANGE = "no change"
ERROR_PREFIX = "error: "


def format_change(counts: dict[Denomination, int]) -> str:
    """Render denomination counts as '3 quarters,1 dime,3 pennies'."""
    if not counts:
        return NO_CHANGE
    ordered = sorted(counts.items(), key=lambda item: item[0].value_cents, reverse=True)
    return ",".join(
        f"{count} {denomination.singular if count == 1 else denomination.plural}"
        for denomination, count in ordered
    )


def process_transaction(
    transaction: Transaction,
    policy: ChangePolicy | None = None,
    rng: RandomSource | None = None,
) -> str:
    """Compute and format the change line for one transaction."""
    return format_change(make_change(transaction, policy, rng))


def process_line(
    line: str,
    policy: ChangePolicy | None = None,
    rng: RandomSource | None = None,
) -> str:
    """Process one raw input line; domain failures become error lines."""
    try:
        return process_transaction(parse_line(line), policy, rng)
    except CashRegisterError as error:
        return f"{ERROR_PREFIX}{error}"


def process_text(
    text: str,
    policy: ChangePolicy | None = None,
    rng: RandomSource | None = None,
) -> str:
    """Process multi-line input text; blank lines are skipped."""
    lines = [line for line in text.splitlines() if line.strip()]
    return "\n".join(process_line(line, policy, rng) for line in lines)


def process_file(
    input_path: str | Path,
    output_path: str | Path,
    policy: ChangePolicy | None = None,
    rng: RandomSource | None = None,
) -> None:
    """Read a flat input file and write one change line per non-blank input line."""
    text = Path(input_path).read_text(encoding="utf-8")
    output = process_text(text, policy, rng)
    Path(output_path).write_text(output + "\n" if output else "", encoding="utf-8")
