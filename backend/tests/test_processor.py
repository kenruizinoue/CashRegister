import random

import pytest

from cash_register.currency import USD
from cash_register.domain import Transaction, UnderpaymentError
from cash_register.policy import ChangePolicy
from cash_register.processor import format_change, process_transaction


def usd(name):
    return next(d for d in USD.denominations if d.singular == name)


class NoRandomAllowed:
    def choice(self, options):
        raise AssertionError("random source must not be consulted")


class TestFormatChange:
    def test_readme_sample_counts(self):
        counts = {usd("quarter"): 3, usd("dime"): 1, usd("penny"): 3}
        assert format_change(counts) == "3 quarters,1 dime,3 pennies"

    def test_singular_and_plural(self):
        counts = {usd("dollar"): 1, usd("quarter"): 2, usd("nickel"): 1}
        assert format_change(counts) == "1 dollar,2 quarters,1 nickel"

    def test_all_denominations(self):
        counts = {
            usd("dollar"): 2,
            usd("quarter"): 3,
            usd("dime"): 2,
            usd("nickel"): 1,
            usd("penny"): 4,
        }
        assert format_change(counts) == "2 dollars,3 quarters,2 dimes,1 nickel,4 pennies"

    def test_single_denomination(self):
        assert format_change({usd("penny"): 3}) == "3 pennies"

    def test_bill_singular_and_plural(self):
        counts = {usd("hundred dollar bill"): 2, usd("five dollar bill"): 1}
        assert format_change(counts) == "2 hundred dollar bills,1 five dollar bill"

    def test_empty_counts_is_no_change(self):
        assert format_change({}) == "no change"

    def test_unsorted_counts_render_largest_first(self):
        counts = {usd("penny"): 1, usd("dollar"): 1, usd("dime"): 1}
        assert format_change(counts) == "1 dollar,1 dime,1 penny"


class TestProcessTransaction:
    def test_readme_minimum_sample(self):
        line = process_transaction(
            Transaction(owed_cents=212, paid_cents=300), rng=NoRandomAllowed()
        )
        assert line == "3 quarters,1 dime,3 pennies"

    def test_readme_pennies_sample(self):
        line = process_transaction(
            Transaction(owed_cents=197, paid_cents=200), rng=NoRandomAllowed()
        )
        assert line == "3 pennies"

    def test_readme_random_sample_is_correct_and_formatted(self):
        rng = random.Random(42)
        line = process_transaction(Transaction(owed_cents=333, paid_cents=500), rng=rng)
        parts = line.split(",")
        assert parts, "must produce at least one denomination"
        total = 0
        by_value = {d.plural: d.value_cents for d in USD.denominations}
        by_value.update({d.singular: d.value_cents for d in USD.denominations})
        for part in parts:
            count, name = part.split(" ", 1)
            total += int(count) * by_value[name]
        assert total == 167

    def test_exact_payment_no_change(self):
        line = process_transaction(
            Transaction(owed_cents=250, paid_cents=250), rng=NoRandomAllowed()
        )
        assert line == "no change"

    def test_divisible_owed_with_exact_payment_no_change(self):
        line = process_transaction(
            Transaction(owed_cents=300, paid_cents=300), rng=random.Random(5)
        )
        assert line == "no change"

    def test_custom_policy_is_honored(self):
        policy = ChangePolicy(random_divisor=1000000)
        line = process_transaction(
            Transaction(owed_cents=333, paid_cents=500), policy, rng=NoRandomAllowed()
        )
        assert line == "1 dollar,2 quarters,1 dime,1 nickel,2 pennies"

    def test_underpayment_propagates(self):
        with pytest.raises(UnderpaymentError):
            process_transaction(Transaction(owed_cents=300, paid_cents=200))
