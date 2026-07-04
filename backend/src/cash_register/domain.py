"""Domain types and errors for the cash register core."""

from dataclasses import dataclass


class CashRegisterError(Exception):
    """Base error for all domain failures."""


class InvalidLineError(CashRegisterError):
    """An input line cannot be parsed into a transaction."""


class UnderpaymentError(CashRegisterError):
    """The amount paid does not cover the amount owed."""


class InvalidCurrencyError(CashRegisterError):
    """A currency table is not usable for making change."""


@dataclass(frozen=True)
class Transaction:
    """One sale: what was owed and what was paid, in integer cents."""

    owed_cents: int
    paid_cents: int
