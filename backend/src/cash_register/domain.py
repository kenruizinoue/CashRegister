"""Domain types and errors for the cash register core."""

from dataclasses import dataclass


class CashRegisterError(Exception):
    """Base error for all domain failures."""


class InvalidLineError(CashRegisterError):
    """An input line cannot be parsed into a transaction."""


@dataclass(frozen=True)
class Transaction:
    """One sale: what was owed and what was paid, in integer cents."""

    owed_cents: int
    paid_cents: int
