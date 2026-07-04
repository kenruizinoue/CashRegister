"""Currency tables: the denominations change can be made from."""

from dataclasses import dataclass

from cash_register.domain import InvalidCurrencyError


@dataclass(frozen=True)
class Denomination:
    """One physical denomination with its display names."""

    singular: str
    plural: str
    value_cents: int


@dataclass(frozen=True)
class Currency:
    """An ordered denomination table.

    Tables are normalized to largest-first and must contain a 1-unit
    denomination so every non-negative amount is representable.
    """

    code: str
    denominations: tuple[Denomination, ...]

    def __post_init__(self):
        if not self.denominations:
            raise InvalidCurrencyError(f"{self.code}: empty denomination table")
        values = [d.value_cents for d in self.denominations]
        if any(v <= 0 for v in values):
            raise InvalidCurrencyError(f"{self.code}: denomination values must be positive")
        if len(set(values)) != len(values):
            raise InvalidCurrencyError(f"{self.code}: duplicate denomination values")
        if min(values) != 1:
            raise InvalidCurrencyError(f"{self.code}: table must include a 1-unit denomination")
        normalized = tuple(sorted(self.denominations, key=lambda d: d.value_cents, reverse=True))
        object.__setattr__(self, "denominations", normalized)


USD = Currency(
    code="USD",
    denominations=(
        Denomination("dollar", "dollars", 100),
        Denomination("quarter", "quarters", 25),
        Denomination("dime", "dimes", 10),
        Denomination("nickel", "nickels", 5),
        Denomination("penny", "pennies", 1),
    ),
)
