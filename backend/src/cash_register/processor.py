"""Turn transactions into cashier-facing change lines."""

from cash_register.currency import Denomination
from cash_register.domain import Transaction
from cash_register.policy import ChangePolicy, RandomSource, make_change

NO_CHANGE = "no change"


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
