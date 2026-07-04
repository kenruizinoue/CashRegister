import pytest

from cash_register.change import change_due, minimum_change
from cash_register.currency import USD, Currency, Denomination
from cash_register.domain import InvalidCurrencyError, Transaction, UnderpaymentError

EUR = Currency(
    code="EUR",
    denominations=(
        Denomination("2 euro", "2 euro", 200),
        Denomination("1 euro", "1 euro", 100),
        Denomination("50 cent", "50 cent", 50),
        Denomination("20 cent", "20 cent", 20),
        Denomination("10 cent", "10 cent", 10),
        Denomination("5 cent", "5 cent", 5),
        Denomination("2 cent", "2 cent", 2),
        Denomination("1 cent", "1 cent", 1),
    ),
)


def by_name(counts):
    return {denomination.singular: count for denomination, count in counts.items()}


class TestChangeDue:
    def test_readme_sample(self):
        assert change_due(Transaction(owed_cents=212, paid_cents=300)) == 88

    def test_exact_payment_is_zero(self):
        assert change_due(Transaction(owed_cents=500, paid_cents=500)) == 0

    def test_underpayment_raises(self):
        with pytest.raises(UnderpaymentError, match="paid 1.00 is less than owed 2.00"):
            change_due(Transaction(owed_cents=200, paid_cents=100))


class TestMinimumChangeUsd:
    def test_readme_sample_212_300(self):
        counts = minimum_change(88, USD)
        assert by_name(counts) == {"quarter": 3, "dime": 1, "penny": 3}

    def test_readme_sample_197_200(self):
        counts = minimum_change(3, USD)
        assert by_name(counts) == {"penny": 3}

    def test_zero_change_is_empty(self):
        assert minimum_change(0, USD) == {}

    def test_one_cent(self):
        assert by_name(minimum_change(1, USD)) == {"penny": 1}

    def test_only_dollars(self):
        assert by_name(minimum_change(300, USD)) == {"dollar": 3}

    def test_large_amount_uses_bills(self):
        counts = minimum_change(123456, USD)
        assert by_name(counts) == {
            "hundred dollar bill": 12,
            "twenty dollar bill": 1,
            "ten dollar bill": 1,
            "dollar": 4,
            "quarter": 2,
            "nickel": 1,
            "penny": 1,
        }

    def test_minimum_change_spans_every_bill(self):
        counts = minimum_change(18675, USD)
        assert by_name(counts) == {
            "hundred dollar bill": 1,
            "fifty dollar bill": 1,
            "twenty dollar bill": 1,
            "ten dollar bill": 1,
            "five dollar bill": 1,
            "dollar": 1,
            "quarter": 3,
        }

    def test_counts_are_ordered_largest_first(self):
        counts = minimum_change(141, USD)
        values = [denomination.value_cents for denomination in counts]
        assert values == sorted(values, reverse=True)

    @pytest.mark.parametrize("amount", [1, 4, 29, 88, 99, 100, 141, 12345])
    def test_counts_sum_exactly(self, amount):
        counts = minimum_change(amount, USD)
        assert sum(d.value_cents * n for d, n in counts.items()) == amount


class TestNegativeAmountGuard:
    def test_minimum_change_rejects_negative(self):
        with pytest.raises(ValueError, match="non-negative"):
            minimum_change(-1, USD)


class TestConfigurableCurrency:
    def test_euro_table(self):
        change = change_due(Transaction(owed_cents=212, paid_cents=500))
        counts = minimum_change(change, EUR)
        assert by_name(counts) == {
            "2 euro": 1,
            "50 cent": 1,
            "20 cent": 1,
            "10 cent": 1,
            "5 cent": 1,
            "2 cent": 1,
            "1 cent": 1,
        }
        assert sum(d.value_cents * n for d, n in counts.items()) == 288

    def test_unsorted_table_is_normalized(self):
        scrambled = Currency(
            code="X",
            denominations=(
                Denomination("one", "ones", 1),
                Denomination("ten", "tens", 10),
                Denomination("five", "fives", 5),
            ),
        )
        assert by_name(minimum_change(16, scrambled)) == {"ten": 1, "five": 1, "one": 1}


class TestCurrencyValidation:
    def test_duplicate_values_rejected(self):
        with pytest.raises(InvalidCurrencyError):
            Currency("X", (Denomination("a", "as", 5), Denomination("b", "bs", 5)))

    def test_non_positive_value_rejected(self):
        with pytest.raises(InvalidCurrencyError):
            Currency("X", (Denomination("a", "as", 0),))

    def test_missing_unit_denomination_rejected(self):
        with pytest.raises(InvalidCurrencyError):
            Currency("X", (Denomination("nickel", "nickels", 5),))

    def test_empty_table_rejected(self):
        with pytest.raises(InvalidCurrencyError):
            Currency("X", ())
