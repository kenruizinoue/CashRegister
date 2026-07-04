"""Change strategy selection: minimum by default, random on the divisor rule.

New special cases plug in by extending ChangePolicy.strategy_for, keeping
strategies themselves pure functions of (amount, currency, rng).
"""

import random
from collections.abc import Callable
from dataclasses import dataclass

from cash_register.change import change_due, minimum_change
from cash_register.currency import USD, Currency, Denomination
from cash_register.domain import InvalidConfigError, Transaction

RandomSource = random.Random
Strategy = Callable[[int, Currency, RandomSource], dict[Denomination, int]]


def minimum_strategy(
    amount_cents: int, currency: Currency, rng: RandomSource
) -> dict[Denomination, int]:
    """Minimum physical change; the random source is deliberately unused."""
    return minimum_change(amount_cents, currency)


def random_change(
    amount_cents: int, currency: Currency, rng: RandomSource
) -> dict[Denomination, int]:
    """Random denominations that still sum exactly to the amount.

    Draws one eligible denomination at a time until the amount is covered;
    the 1-unit denomination guaranteed by Currency means a draw always exists.
    """
    picked: dict[Denomination, int] = {}
    remaining = amount_cents
    while remaining:
        eligible = [d for d in currency.denominations if d.value_cents <= remaining]
        choice = rng.choice(eligible)
        picked[choice] = picked.get(choice, 0) + 1
        remaining -= choice.value_cents
    return {d: picked[d] for d in currency.denominations if d in picked}


@dataclass(frozen=True)
class ChangePolicy:
    """Configuration for making change: currency table and the random twist."""

    currency: Currency = USD
    random_divisor: int = 3

    def __post_init__(self):
        if self.random_divisor < 1:
            raise InvalidConfigError(f"random divisor must be >= 1, got {self.random_divisor}")

    def strategy_for(self, transaction: Transaction) -> Strategy:
        if transaction.owed_cents % self.random_divisor == 0:
            return random_change
        return minimum_strategy


def make_change(
    transaction: Transaction,
    policy: ChangePolicy | None = None,
    rng: RandomSource | None = None,
) -> dict[Denomination, int]:
    """Compute the change denominations for one transaction under a policy."""
    policy = policy if policy is not None else ChangePolicy()
    rng = rng if rng is not None else random.Random()
    amount = change_due(transaction)
    strategy = policy.strategy_for(transaction)
    return strategy(amount, policy.currency, rng)
