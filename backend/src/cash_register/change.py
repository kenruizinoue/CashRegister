"""Change amount and minimum-denomination calculation."""

from cash_register.currency import Currency, Denomination
from cash_register.domain import Transaction, UnderpaymentError


def _cents_display(cents: int) -> str:
    return f"{cents // 100}.{cents % 100:02d}"


def change_due(transaction: Transaction) -> int:
    """Cents of change owed to the customer."""
    if transaction.paid_cents < transaction.owed_cents:
        raise UnderpaymentError(
            f"paid {_cents_display(transaction.paid_cents)} is less than "
            f"owed {_cents_display(transaction.owed_cents)}"
        )
    return transaction.paid_cents - transaction.owed_cents


def minimum_change(amount_cents: int, currency: Currency) -> dict[Denomination, int]:
    """Greedy minimum physical change, largest denomination first.

    Greedy is exact-minimal for canonical tables like USD and EUR; the
    1-unit denomination guaranteed by Currency means it always terminates
    with the full amount represented.
    """
    if amount_cents < 0:
        raise ValueError(f"amount_cents must be non-negative, got {amount_cents}")
    counts: dict[Denomination, int] = {}
    remaining = amount_cents
    for denomination in currency.denominations:
        count, remaining = divmod(remaining, denomination.value_cents)
        if count:
            counts[denomination] = count
    return counts
