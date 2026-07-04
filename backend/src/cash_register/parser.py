"""Parse flat-file input lines into transactions."""

import re
from decimal import Decimal

from cash_register.domain import InvalidLineError, Transaction

_AMOUNT_PATTERN = re.compile(r"^\d+(\.\d{1,2})?$", re.ASCII)


def parse_amount(text: str) -> int:
    """Parse a money amount into integer cents.

    Accepts plain decimal notation with at most 2 decimal places. Anything
    else (signs, exponents, symbols, extra precision) is rejected so a typo
    in the flat file never silently becomes a wrong charge.
    """
    cleaned = text.strip()
    if not _AMOUNT_PATTERN.match(cleaned):
        raise InvalidLineError(f"invalid amount: {cleaned!r}")
    return int(Decimal(cleaned).scaleb(2))


def parse_line(line: str) -> Transaction:
    """Parse one 'owed,paid' line into a Transaction in cents."""
    parts = line.split(",")
    if len(parts) != 2:
        raise InvalidLineError(f"expected 'owed,paid': {line.strip()!r}")
    owed, paid = (parse_amount(part) for part in parts)
    return Transaction(owed_cents=owed, paid_cents=paid)
