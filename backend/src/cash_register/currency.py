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


EUR = Currency(
    code="EUR",
    denominations=(
        Denomination("hundred euro note", "hundred euro notes", 10000),
        Denomination("fifty euro note", "fifty euro notes", 5000),
        Denomination("twenty euro note", "twenty euro notes", 2000),
        Denomination("ten euro note", "ten euro notes", 1000),
        Denomination("five euro note", "five euro notes", 500),
        Denomination("two euro coin", "two euro coins", 200),
        Denomination("one euro coin", "one euro coins", 100),
        Denomination("fifty cent coin", "fifty cent coins", 50),
        Denomination("twenty cent coin", "twenty cent coins", 20),
        Denomination("ten cent coin", "ten cent coins", 10),
        Denomination("five cent coin", "five cent coins", 5),
        Denomination("two cent coin", "two cent coins", 2),
        Denomination("one cent coin", "one cent coins", 1),
    ),
)

USD = Currency(
    code="USD",
    denominations=(
        Denomination("hundred dollar bill", "hundred dollar bills", 10000),
        Denomination("fifty dollar bill", "fifty dollar bills", 5000),
        Denomination("twenty dollar bill", "twenty dollar bills", 2000),
        Denomination("ten dollar bill", "ten dollar bills", 1000),
        Denomination("five dollar bill", "five dollar bills", 500),
        Denomination("dollar", "dollars", 100),
        Denomination("quarter", "quarters", 25),
        Denomination("dime", "dimes", 10),
        Denomination("nickel", "nickels", 5),
        Denomination("penny", "pennies", 1),
    ),
)

CURRENCIES = {currency.code: currency for currency in (USD, EUR)}
